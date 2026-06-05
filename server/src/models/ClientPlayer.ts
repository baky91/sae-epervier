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
  }

  sendToHost(message: SocketMessage) {
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

    logMessage(`Joueur ${this.name} (ID: ${this.id}) s'est reconnecté dans la partie ${this.hostSocket.hostCode}`);    
  }

  closeWithTimeout(timeout: number): void {
    if (this.hostSocket) {
      this.disconnectTimeout = setTimeout(() => {
        this.hostSocket.removePlayer(this.id);
        this.hostSocket.sendMessage({
          type: "PLAYER_LEFT",
          id: this.id,
        });
        
        logMessage(`Joueur ${this.name} (ID: ${this.id}) s'est déconnecté de la partie ${this.hostSocket.hostCode}`);    
      }, timeout * 1000);
    }
  }
}
