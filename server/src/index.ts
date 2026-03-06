import express, { NextFunction, Request, Response } from "express";
import { createServer } from "http";
import { join } from "node:path";
import { WebSocketServer, WebSocket } from "ws";
import ClientHost from "./models/ClientHost.js";
import ClientPlayer from "./models/ClientPlayer.js";
import { generateUniqueCode } from "./models/utils.js";
import { SocketMessage } from "./types/types.js";

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server }); // On lie ws au serveur http

const PORT = process.env.PORT || 3000;
const hosts = new Map<string, ClientHost>();

// SECURITE

app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  next();
});

// FICHIERS STATIQUES

app.use(express.static(join(import.meta.dirname, "../public")));
app.use(express.static(join(import.meta.dirname, "../game")));

// ROUTES

app.get("/", (req: Request, res: Response) => {
  res.sendFile(join(import.meta.dirname, "../public/index.html"));
});

app.get("/game", (req: Request, res: Response) => {
  res.sendFile(join(import.meta.dirname, "../game/index.html"));
});

app.get("/:hostCode", (req: Request, res: Response) => {
  const { hostCode } = req.params;

  if (!Array.isArray(hostCode) && hosts.has(hostCode)) {
    res.sendFile(join(import.meta.dirname, "../public/controller.html"));
  } else {
    res.sendFile(join(import.meta.dirname, "../public/error-page.html"));
  }
});

// COMMUNICATIONS SOCKETS

let counterPlayers: number = 0;

wss.on("connection", (ws: WebSocket, req: Request) => {
  // Extraction des paramètres de l'URL (ex: ?clientType=player&name=Alex)
  const params = new URLSearchParams(req.url.split("?")[1]);
  const type = params.get("clientType") || "host"; // Si aucun type n'est spécifié dans l'URL avec c'est un host Godot

  let currentUser: ClientHost | ClientPlayer | undefined;
  let hostSocket: ClientHost | undefined; // Stocker la socket du host si le type de client est un joueur

  if (type === "host") {
    let code = generateUniqueCode(hosts);
    code = "ABCD"; // Utilisation d'un code défini pour faciliter le développement

    currentUser = new ClientHost(ws, code);
    hosts.set(code, currentUser);

    console.log(`Écran Godot (Host) connecté avec le code : ${code}`);

    currentUser.sendToGodot({
      type: "room_created",
      data: {
        code: code,
      },
    });
  } else if (type === "player") {
    const hostCode = params.get("hostCode");

    if (!hosts || !hostCode) {
      return;
    }

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

    if (!hostSocket) {
      return;
    }

    let name = params.get("name") || "Anonyme";

    const savedPlayerId = params.get("playerId");
    if (hostSocket && savedPlayerId) {
      const savedPlayer = hostSocket.getPlayer(Number(savedPlayerId));
      currentUser = savedPlayer;
    }

    if (currentUser instanceof ClientPlayer) {
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
  ws.on("message", (message: any) => {
    try {
      let parsed: SocketMessage = JSON.parse(message);

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
        // Envoi à tous les joueurs
        if (!parsed.player_id) {
          currentUser.sendToAllPlayers(parsed);

          return;
        }

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
      currentUser.closeGame();
      hosts.delete(currentUser.hostCode);
      console.log(`Partie ${currentUser.hostCode} fermée`);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
