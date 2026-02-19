class ClientPlayer {
  constructor(parameters) {
    this.id = parameters.id;
    this.socket = parameters.socket;
    this.role = undefined;
    this.bonus = {
      speed: 0,
      dash: 0,
    };
  }
}
