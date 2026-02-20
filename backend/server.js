const express = require("express");
const http = require("http");
const { join } = require("node:path");
const { WebSocketServer } = require("ws");
const { ClientHost } = require("./models/ClientHost").default;
const { ClientPlayer } = require("./models/ClientPlayer");

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server }); // On lie ws au serveur http

const PORT = process.env.PORT || 3000;

// SECURITE

app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  next();
});

app.get("/", (req, res) => {
  res.send(
    "<h1>L'épervier masqué - Godot</h1><a href='game'>Game</a><br><a href='controller'>Controller</a>",
  );
});

// FICHIERS STATIQUES

app.use(express.static("controller"));
app.use(express.static("game"));

// ROUTES

app.get("/controller", (req, res) => {
  res.sendFile(join(__dirname, "controller", "index.html"));
});

app.get("/game", (req, res) => {
  res.sendFile(join(__dirname, "game", "index.html"));
});

// COMMUNICATIONS SOCKETS

const hosts = new Map();
let counterPlayers = 0;

// let clients = new Map();
// let hostSocket = null; // Référence vers l'écran Godot

wss.on("connection", (ws, req) => {
  // Extraction des paramètres de l'URL (ex: ?clientType=player&name=Alex)
  const params = new URLSearchParams(req.url.split("?")[1]);
  const type = params.get("clientType");
  const hostCode = params.get("hostCode");

  let currentUser = null;

  if (type === "player") {
    const name = params.get("name") || "Anonyme";

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

    // Création du joueur si le salon existe
    counterPlayers++;
    currentUser = new ClientPlayer(counterPlayers, ws, name, hostCode);

    // Ajouter le joueur à l'Host correspondant
    const host = hosts.get(hostCode);
    host.addPlayer(currentUser);

    // Confirmation au joueur
    currentUser.sendToController({
      type: "newplayer",
      data: {
        player_id: currentUser.id,
        player_name: currentUser.name,
      },
    });

    // On prévient le Host (Godot) qu'un joueur est arrivé
    host.sendToGodot({
      type: "player_joined",
      data: {
        id: currentUser.id,
        name: currentUser.name,
      },
    });

    console.log(
      `Joueur ${name} (ID: ${ws.playerId}) a rejoint la partie ${hostCode}`,
    );
  } else {
    // Si aucun type n'est spécifié dans l'URL avec c'est un host Godot
    currentUser = new ClientHost(ws, hostCode);
    hosts.set(hostCode, currentUser);

    console.log(`Écran Godot (Host) connecté avec le code : ${hostCode}`);

    currentUser.sendToGodot({
      type: "root_created",
      code: hostCode,
    });
  }

  // Gestion des messages entrants
  ws.on("message", (message) => {
    try {
      const parsed = JSON.parse(message);

      // Si c'est un message d'un joueur (mouvement, bonus...), on le relaie à Godot
      if (currentUser instanceof ClientPlayer) {
        const host = hosts.get(currentUser.hostCode);
        if (host) {
          host.sendToGodot({
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
        }
      }
    } catch (e) {
      console.error("Erreur format JSON :", e);
    }
  });

  // DECONNEXION
  ws.on("close", () => {
    if (currentUser instanceof ClientPlayer) {
      const host = hosts.get(currentUser.hostCode);
      if (host) {
        host.removePlayer(currentUser.id);
        host.sendToGodot({
          type: "player_left",
          player_id: currentUser.id,
        });
        console.log(
          `Joueur ${currentUser.name} déconnecté de la partie ${currentUser.hostCode}`,
        );
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
