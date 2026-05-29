import { WebSocketServer, WebSocket } from "ws";
import ClientHost from "../models/ClientHost";
import ClientPlayer from "../models/ClientPlayer";
import { generateUniqueCode, logMessage } from "../utils/utils";
import { SocketMessage } from "../types/types";

export function setupWebSockets(
  wss: WebSocketServer,
  hosts: Map<string, ClientHost>,
) {
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

      logMessage(`Nouvel hôte crée avec le code : ${code}`);

      currentUser.sendMessage({
        type: "ROOM_CREATED",
        data: {
          code: code,
        },
      });
    } else if (type === "player") {
      const hostCode = params.get("hostCode");

      if (!hosts || !hostCode) return;

      // Vérification que le code entré par le joueur correspond à un client Godot
      if (!hosts.has(hostCode)) {
        ws.send(
          JSON.stringify({
            type: "ERROR",
            message: "Code de partie invalide",
          }),
        );
        ws.close();
        return;
      }

      hostSocket = hosts.get(hostCode);

      if (!hostSocket) return;

      let name = params.get("name") || "Anonyme";

      const savedPlayerId = params.get("playerId");
      if (hostSocket && savedPlayerId) {
        const savedPlayer = hostSocket.getPlayer(Number(savedPlayerId));
        currentUser = savedPlayer;
      }

      if (currentUser instanceof ClientPlayer) {
        currentUser.reconnect(ws);
      } else {
        // Création du joueur si le salon existe
        const playerId = hostSocket.getNextPlayerId();
        currentUser = new ClientPlayer(playerId, ws, name, hostSocket);

        // Ajouter le joueur à l'Host correspondant
        hostSocket.addPlayer(currentUser);

        // Confirmation au joueur
        currentUser.sendMessage({
          type: "SETUP_CONTROLLER",
          data: {
            id: currentUser.id,
            name: currentUser.name,
          },
        });

        // On prévient le Host (Godot) qu'un joueur est arrivé
        hostSocket.sendMessage({
          type: "PLAYER_JOIN",
          data: {
            id: currentUser.id,
            name: currentUser.name,
          },
        });

        logMessage(`Joueur ${name} (ID: ${currentUser.id}) a rejoint la partie ${hostCode}`);
      }
    }

    // Gestion des messages entrants
    ws.on("message", (message: any) => {
      try {
        let parsed: SocketMessage = JSON.parse(message);

        // Si c'est un message d'un joueur (mouvement, bonus...), on le relaie à Godot
        if (currentUser instanceof ClientPlayer) {
          currentUser.handlePlayerMessage(parsed);
        }
        // Si c'est un message de Godot (par exemple: récupération de bonus) on le relaie au joueur concerné
        else if (currentUser instanceof ClientHost) {
          currentUser.handleHostMessage(parsed);
        }
      } catch (e) {
        console.error("Erreur format JSON :", e);
      }
    });

    // DECONNEXION
    ws.on("close", () => {
      if (currentUser instanceof ClientPlayer) {
        currentUser.closeWithTimeout(10);
      } else if (currentUser instanceof ClientHost) {
        currentUser.closeGame();
        hosts.delete(currentUser.hostCode);
        logMessage(`La partie ${currentUser.hostCode} a été fermée`);
      }
    });
  });
}
