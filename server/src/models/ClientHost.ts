import ClientPlayer from "./ClientPlayer.js";
import WebSocket from "ws";

export default class ClientHost {
  socket: WebSocket;
  hostCode: string;
  players: Map<number, ClientPlayer>;
  counterPlayers: number;
  maxRound: number;
  currentRound: number;
  disconnectTimeout: NodeJS.Timeout | null;

  constructor(socket: WebSocket, hostCode: string) {
    this.socket = socket;
    this.hostCode = hostCode;
    this.players = new Map<number, ClientPlayer>();
    this.counterPlayers = 0;
    this.maxRound = 0;
    this.currentRound = 0;
    this.disconnectTimeout = null;
  }

  sendToGodot(data: any): void {
    if (this.socket.readyState === 1) {
      // 1 = OPEN
      this.socket.send(JSON.stringify(data));
    }
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

  getSurvivors(): ClientPlayer[] {
    let survivors: ClientPlayer[] = [];

    return survivors;
  }

  getInfected(): ClientPlayer[] {
    let infected: ClientPlayer[] = [];

    return infected;
  }

  getSparrowhawk(): ClientPlayer[] {
    let sparrowhawks: ClientPlayer[] = [];

    return sparrowhawks;
  }

  closeGame(): void {
    this.players.forEach((p) => {
      p.socket.close();
    });
  }
}
