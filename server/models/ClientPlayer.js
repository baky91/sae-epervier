const { SURVIVOR } = require("./Constants");

class ClientPlayer {
  constructor(id, socket, name, hostCode) {
    this.id = id;
    this.socket = socket;
    this.name = name;
    this.hostCode = hostCode;
    this.role = SURVIVOR; // Rôle par défaut
  }

  sendToController(data) {
    if (this.socket.readyState === 1) {
      // 1 = OPEN
      this.socket.send(JSON.stringify(data));
    }
  }
}

module.exports = ClientPlayer;
