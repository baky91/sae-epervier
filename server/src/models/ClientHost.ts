import { SocketMessage } from "../types/types.js";
import { ClientModel } from "./ClientModel.js";
import ClientPlayer from "./ClientPlayer.js";
import WebSocket from "ws";

export default class ClientHost extends ClientModel {
  hostCode: string;
  players: Map<number, ClientPlayer>;
  counterPlayers: number;
  maxRound: number;
  currentRound: number;
  gameStarted: boolean;

  constructor(socket: WebSocket, hostCode: string) {
    super(socket);
    this.hostCode = hostCode;
    this.players = new Map<number, ClientPlayer>();
    this.counterPlayers = 0;
    this.maxRound = 0;
    this.currentRound = 0;
    this.gameStarted = false;
  }

  sendToPlayer(message: SocketMessage): void {
    const id = message.id;
    if (id === 0) {
      this.sendToAllPlayers(message);
    } else {
      const targetPlayer = this.getPlayer(id);

      if (targetPlayer) {
        // console.log(message);

        targetPlayer.sendMessage(message);

        const type = message.type;
        // Enregistrement de quelques informations utiles
        switch (type) {
          case "GET_BONUS":
            targetPlayer.bonus[message.data.bonus]++;
            break;
          case "SET_ROLE":
            targetPlayer.role = message.data.role;
            break;
          case "PLAYER_KICK":
            targetPlayer.closeWithTimeout(0);
            break;
        }
      }
    }
  }

  sendToAllPlayers(data: any): void {
    this.players.forEach((player) => {
      player.sendMessage(data);
    });
  }

  getNextPlayerId(): number {
    return this.counterPlayers + 1;
  }

  addPlayer(player: ClientPlayer): void {
    this.players.set(player.id, player);
    this.counterPlayers++;
  }

  getPlayer(id: number): ClientPlayer | undefined {
    return this.players.get(id);
  }

  getAllPlayers(): Map<number, ClientPlayer> {
    return this.players;
  }

  removePlayer(id: number): void {
    this.players.delete(id);
  }

  closeGame(): void {
    this.players.forEach((p) => {
      p.socket.close();
    });
  }
}
