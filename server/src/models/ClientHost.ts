import { SocketMessage } from "../types/types";
import { logMessage } from "../utils/utils";
import { ClientModel } from "./ClientModel";
import ClientPlayer from "./ClientPlayer";
import WebSocket from "ws";

export default class ClientHost extends ClientModel {
  hostCode: string;
  players: Map<number, ClientPlayer>;
  counterPlayers: number;
  maxRound: number;
  currentRound: number;
  gameStarted: boolean;
  inputsBlocked: boolean;

  constructor(socket: WebSocket, hostCode: string) {
    super(socket);
    this.hostCode = hostCode;
    this.players = new Map<number, ClientPlayer>();
    this.counterPlayers = 0;
    this.maxRound = 0;
    this.currentRound = 0;
    this.gameStarted = false;
    this.inputsBlocked = false;
  }

  sendToPlayer(message: SocketMessage): void {
    const id = message.id;
    if (id === 0) {
      this.sendToAllPlayers(message);
    } else {
      const targetPlayer = this.getPlayer(id);

      if (targetPlayer) {
        targetPlayer.sendMessage(message);

        const type = message.type;
        // Actions en fonction du type de message
        switch (type) {
          case "GET_BONUS":
            targetPlayer.bonus[message.data.bonus]++;
            break;
          case "SET_ROLE":
            targetPlayer.role = message.data.role;
            break;
          case "PLAYER_KICK":
            this.removePlayer(id);
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
    const playerName = this.getPlayer(id)?.name;
    this.players.delete(id);
    logMessage(`Joueur ${playerName} (ID: ${id}) a quitté la partie ${this.hostCode}`);
  }

  closeGame(): void {
    this.players.forEach((p) => {
      p.socket.close();
    });
  }
}
