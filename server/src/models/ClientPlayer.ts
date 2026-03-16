import WebSocket from "ws";
import { ClientModel } from "./ClientModel.js";
import ClientHost from "./ClientHost.js";

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

  closeWithTimeout(timeout: number): void {
    this.disconnectTimeout = setTimeout(() => {
      this.hostSocket.removePlayer(this.id);
      this.hostSocket.sendMessage({
        type: "player_left",
        player_id: this.id,
      });
      console.log(
        `Joueur ${this.name} déconnecté de la partie ${this.hostSocket.hostCode}`,
      );
    }, timeout * 1000);
  }
}
