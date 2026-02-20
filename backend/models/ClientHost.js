class ClientHost {
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

  addPlayer(player) {
    this.players.set(player.id, player);
  }

  getPlayer(id) {
    return this.players.get(id);
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
}

module.exports = ClientHost;
