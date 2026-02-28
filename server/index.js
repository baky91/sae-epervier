const express = require("express");
const http = require("http");
const { join } = require("node:path");
const { WebSocketServer } = require("ws");
const ClientHost = require("./models/ClientHost");
const ClientPlayer = require("./models/ClientPlayer");
const { generateUniqueCode } = require("./models/utils");
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server }); // On lie ws au serveur http

const PORT = process.env.PORT || 3000;
const hosts = new Map();

// SECURITE

app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  next();
});

// FICHIERS STATIQUES

app.use(express.static("public"));
app.use(express.static("controller"));
app.use(express.static("game"));

// ROUTES

app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "public", "index.html"));
});

app.get("/game", (req, res) => {
  res.sendFile(join(__dirname, "game", "index.html"));
});

app.get("/:hostCode", (req, res) => {
  const { hostCode } = req.params;

  if (hosts.has(hostCode)) {
    res.sendFile(join(__dirname, "controller", "index.html"));
  } else {
    res.send(
      `<h1>Erreur</h1>
      <p>La partie avec le code '<strong>${hostCode}</strong>' n'existe pas!</p>
      <a href="/">Retour à l'accueil</a>`,
    );
  }
});

// COMMUNICATIONS SOCKETS

let counterPlayers = 0;

wss.on("connection", (ws, req) => {
  // Extraction des paramètres de l'URL (ex: ?clientType=player&name=Alex)
  const params = new URLSearchParams(req.url.split("?")[1]);
  const type = params.get("clientType") || "host"; // Si aucun type n'est spécifié dans l'URL avec c'est un host Godot

  let currentUser = null;
  let hostSocket = null; // Stocker la socket du host si le type de client est un joueur

  if (type === "host") {
    let code = generateUniqueCode(hosts);
    code = "ABCD"; // Utilisation d'un code défini pour faciliter le développement

    currentUser = new ClientHost(ws, code);
    hosts.set(code, currentUser);

    console.log(`Écran Godot (Host) connecté avec le code : ${code}`);

    currentUser.sendToGodot({
      type: "root_created",
      data: {
        code: code,
      },
    });
  } else if (type === "player") {
    const hostCode = params.get("hostCode");

    // Vérification que le code entré par le joueur correspond à un client Godot
    if (!hosts.has(hostCode)) {
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Code de partie invalide",
        }),
      );
      ws.close();
      return;
    }

    hostSocket = hosts.get(hostCode);
    let name = params.get("name") || "Anonyme";

    const savedPlayerId = params.get("playerId");

    if (savedPlayerId && currentUser) {
      const savedPlayer = hostSocket.getPlayer(Number(savedPlayerId));

      currentUser = savedPlayer;
      // Mise à jour de la socket
      currentUser.socket = ws;

      // On arrête le timer de déconnexion
      if (currentUser.disconnectTimeout) {
        clearTimeout(currentUser.disconnectTimeout);
        currentUser.disconnectTimeout = null;
      }

      currentUser.sendToController({
        type: "reconnection",
        data: {
          player_id: currentUser.id,
          player_name: currentUser.name,
          player_bonus: currentUser.bonus,
          player_role: currentUser.role,
        },
      });

      console.log(
        `Joueur ${name} (ID: ${currentUser.id}) s'est reconnecté dans la partie ${hostCode}`,
      );
    } else {
      counterPlayers++;
      if (name === "Anonyme") name += counterPlayers;

      // Création du joueur si le salon existe
      const playerId = hostSocket.getNextPlayerId();
      currentUser = new ClientPlayer(playerId, ws, name, hostCode);

      // Ajouter le joueur à l'Host correspondant
      hostSocket.addPlayer(currentUser);

      // Confirmation au joueur
      currentUser.sendToController({
        type: "newplayer",
        data: {
          player_id: currentUser.id,
          player_name: currentUser.name,
        },
      });

      // On prévient le Host (Godot) qu'un joueur est arrivé
      hostSocket.sendToGodot({
        type: "player_joined",
        data: {
          id: currentUser.id,
          name: currentUser.name,
        },
      });

      console.log(
        `Joueur ${name} (ID: ${currentUser.id}) a rejoint la partie ${hostCode}`,
      );
    }
  }

  // Gestion des messages entrants
  ws.on("message", (message) => {
    try {
      let parsed = JSON.parse(message);

      // Si c'est un message d'un joueur (mouvement, bonus...), on le relaie à Godot
      if (currentUser instanceof ClientPlayer) {
        if (hostSocket) {
          hostSocket.sendToGodot({
            type: parsed.type,
            player_id: currentUser.id,
            data: parsed.data,
          });
        }
      }
      // Si c'est un message de Godot (par exemple: récupération de bonus) on le relaie au joueur concerné
      else if (currentUser instanceof ClientHost) {
        const targetId = parsed.player_id;
        const targetPlayer = currentUser.getPlayer(targetId);

        if (targetPlayer) {
          targetPlayer.sendToController({
            type: parsed.type,
            data: parsed.data,
          });
          // Enregistrement de quelques informations utiles
          if (parsed.type === "bonus_obtained") {
            targetPlayer.bonus[parsed.data.bonus]++;
          } else if (parsed.type === "new_role") {
            targetPlayer.role = parsed.data.role;
          }
        }
      }
    } catch (e) {
      console.error("Erreur format JSON :", e);
    }
  });

  // DECONNEXION
  ws.on("close", () => {
    if (currentUser instanceof ClientPlayer) {
      if (hostSocket) {
        currentUser.disconnectTimeout = setTimeout(() => {
          hostSocket.removePlayer(currentUser.id);
          hostSocket.sendToGodot({
            type: "player_left",
            player_id: currentUser.id,
          });
          console.log(
            `Joueur ${currentUser.name} déconnecté de la partie ${currentUser.hostCode}`,
          );
        }, 10000); // On laisse 10 secondes au joueur pour se reconnecter avant de le supprimer
      }
    } else if (currentUser instanceof ClientHost) {
      hosts.delete(currentUser.hostCode);
      console.log(`Partie ${currentUser.hostCode} fermée`);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
