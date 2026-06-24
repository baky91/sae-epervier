import WebSocket from "ws";
import { ClientModel } from "./ClientModel";
import ClientHost from "./ClientHost";
import { SocketMessage } from "../types/types";
import { logMessage } from "../utils/utils";

export default class ClientPlayer extends ClientModel {
  id: number;
  name: string;
  hostSocket: ClientHost;
  role: string | null;
  bonus: {
    [Key: string]: number;
  };
  isReplaying: boolean;
  definitelyLeave: boolean;

  constructor(
    id: number,
    socket: WebSocket,
    name: string,
    hostSocket: ClientHost,
  ) {
    super(socket);
    this.id = id;
    this.name = name;
    this.hostSocket = hostSocket;
    this.role = null;
    this.bonus = {
      speed: 0,
      dash: 0,
    };
    this.isReplaying = true;
    this.definitelyLeave = false;
  }

  handlePlayerMessage(message: SocketMessage) {
    if (message.type === "REPLAY") {
      if (this.hostSocket) {
        this.isReplaying = true;
        this.hostSocket.addPlayer(this);

        this.hostSocket.sendMessage({
          type: "PLAYER_JOIN",
          data: {
            id: this.id,
            name: this.name,
          },
        });

        this.sendMessage({
          type: "SETUP_CONTROLLER",
          data: {
            id: this.id,
            name: this.name,
          },
        });
      }
      return;
    }

    // Logique de déconnexion
    if (message.type === "INSTANT_LEAVE" ||
      // Si le joueur quitte la partie lorsque la partie n'est pas lancée, on n'attends pas que le timeout s'écoule
      (message.type === "REQUEST_LEAVE" && !this.hostSocket.gameStarted)
    ) {
      this.definitelyLeave = true;
      this.closeWithTimeout(0);
      return;
    }

    // Logique spécifique pour l'utilisation des bonus
    if (message.type === "USE_BONUS") {
      const bonusType = message.data.bonus;

      // On vérifie si le joueur peut utiliser le bonus
      if (
        this.hostSocket &&
        !this.hostSocket.inputsBlocked &&
        this.bonus[bonusType] > 0
      ) {
        this.bonus[bonusType]--; // On décrémente le bonus côté serveur

        // On relaie le message à Godot
        this.hostSocket.sendMessage({
          type: "USE_BONUS",
          id: this.id,
          data: message.data,
        });
      }

      // Dans tous les cas (succès ou échec), on renvoie le nombre de bonus au joueur
      // pour synchroniser l'interface. Si l'utilisation a échoué, le nombre est inchangé,
      // ce qui "rembourse" le bonus sur l'interface du joueur.
      this.sendMessage({
        type: "UPDATE_BONUS",
        data: {
          bonus: bonusType,
          count: this.bonus[bonusType],
        },
      });
      return;
    }

    // Comportement par défaut pour les autres messages (ex: MOVE)
    if (this.hostSocket && !this.hostSocket.inputsBlocked) {
      this.hostSocket.sendMessage({
        type: message.type,
        id: this.id,
        data: message.data,
      });
    }
  }

  reconnect(socket: WebSocket) {
    // Mise à jour de la socket
    this.socket = socket;

    // On arrête le timer de déconnexion
    if (this.disconnectTimeout) {
      clearTimeout(this.disconnectTimeout);
      this.disconnectTimeout = null;
    }

    // On envoi un message pour remettre en place le contrôleur
    this.sendMessage({
      type: "RECONNECTION",
      data: {
        id: this.id,
        name: this.name,
        bonus: this.bonus,
        role: this.role,
      },
    });

    logMessage(
      `Joueur ${this.name} (ID: ${this.id}) s'est reconnecté dans la partie ${this.hostSocket.hostCode}`,
    );
  }

  closeWithTimeout(timeout: number): void {
    if (this.hostSocket) {
      this.disconnectTimeout = setTimeout(() => {
        this.hostSocket.removePlayer(this.id);
        if (this.isReplaying) {
          this.hostSocket.sendMessage({
            type: "PLAYER_LEFT",
            id: this.id,
          });
        }

        logMessage(
          `Joueur ${this.name} (ID: ${this.id}) s'est déconnecté de la partie ${this.hostSocket.hostCode}`,
        );
        this.disconnectTimeout = null;
      }, timeout * 1000);
    }
  }
}
