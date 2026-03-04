export default class ClientHost {
  constructor(socket, hostCode) {
    this.socket = socket;
    this.hostCode = hostCode;
    this.players = new Map();
    this.counterPlayers = 0;
    this.maxRound = 0;
    this.currentRound = 0;
  }

  sendToGodot(data) {
    if (this.socket.readyState === 1) {
      // 1 = OPEN
      this.socket.send(JSON.stringify(data));
    }
  }

  getNextPlayerId() {
    return this.counterPlayers + 1;
  }

  addPlayer(player) {
    this.players.set(player.id, player);
    this.counterPlayers++;
  }

  getPlayer(id) {
    return this.players.get(id);
  }

  getAllPlayers() {
    return this.players;
  }

  removePlayer(id) {
    this.players.delete(id);
  }

  getSurvivors() {
    let survivors = [];

    return survivors;
  }

  getInfected() {
    let infected = [];

    return infected;
  }

  getSparrowhawk() {
    let sparrowhawks = [];

    return sparrowhawks;
  }

  closeGame() {
    this.players.forEach((p) => {
      p.socket.close();
    });
  }
}
