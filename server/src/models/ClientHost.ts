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
    this.inputsBlocked = true;
  }

  handleHostMessage(message: SocketMessage): void {
    const id = message.id;
    const type = message.type;

    if (id === 0) {
      if (type === "GAME_START") {
        logMessage(`La partie ${this.hostCode} a démarré`);
        this.gameStarted = true;
        this.players.forEach((player, id) => {
          if (!player.isReplaying) {
            logMessage(`Joueur ${player.name} (ID: ${id}) n'a pas rejoint à temps et est retiré.`);
            player.socket.close();
            this.players.delete(id);
          }
        });
        this.counterPlayers = this.players.size;
      } else if (type === "REQUEST_ROUND_START") {
        this.prepareNextRound();
        return;
      } else if (type === "REQUEST_ROUND_END") {
        this.inputsBlocked = true;
        return;
      } else if (type === "RESTART_GAME") {
        this.replayGame();
        return;
      }

      this.sendToAllPlayers(message);
    } else {
      const targetPlayer = this.getPlayer(id);

      if (targetPlayer) {
        targetPlayer.sendMessage(message);

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
    let id = 1;
    while (this.players.has(id)) {
      id++;
    }
    return id;
  }

  addPlayer(player: ClientPlayer): void {
    this.players.set(player.id, player);
    this.counterPlayers = this.players.size;
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
    this.counterPlayers = this.players.size;
    logMessage(
      `Joueur ${playerName} (ID: ${id}) a quitté la partie ${this.hostCode}`,
    );
  }

  closeGame(): void {
    this.players.forEach((p) => {
      p.socket.close();
    });
  }

  prepareNextRound() {
    // Empêcher l'envoi des entrées utilisateur à Godot
    this.inputsBlocked = true;

    // Lancement du décompte du lancement de la manche : 3, 2, 1
    this.socket.send(JSON.stringify({ type: "START_COUNTDOWN" }));

    setTimeout(() => {
      this.socket.send(JSON.stringify({ type: "COUNTDOWN_TICK", value: 2 }));
    }, 1000);

    setTimeout(() => {
      this.socket.send(JSON.stringify({ type: "COUNTDOWN_TICK", value: 1 }));
    }, 2000);

    setTimeout(() => {
      this.inputsBlocked = false;
      this.socket.send(JSON.stringify({ type: "ROUND_START" }));
    }, 3000);
  }

  replayGame() {
    this.gameStarted = false;
    this.inputsBlocked = true;
    this.currentRound = 0;
    this.players.forEach((player) => {
      player.isReplaying = false;
    });
    this.sendToAllPlayers({ type: "RESTART_GAME" });
    this.counterPlayers = 0;
  }
}
