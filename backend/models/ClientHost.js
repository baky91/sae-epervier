import "./Constants.js";

class ClientHost {
  constructor(parameters) {
    this.socket = parameters.socket;
    this.maxRound = parameters.maxRound;
    this.currentRound = 0;
    this.players = null;
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
