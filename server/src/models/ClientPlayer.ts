import WebSocket from "ws";

export default class ClientPlayer {
  id: number;
  socket: WebSocket;
  name: string;
  hostCode: string;
  role: string | null;
  bonus: {
    [Key: string]: number;
  };
  disconnectTimeout: NodeJS.Timeout | null;

  constructor(id: number, socket: WebSocket, name: string, hostCode: string) {
    this.id = id;
    this.socket = socket;
    this.name = name;
    this.hostCode = hostCode;
    this.role = null;
    this.bonus = {
      speed: 0,
      dash: 0,
    };
    this.disconnectTimeout = null;
  }

  sendToController(data: any): void {
    if (this.socket.readyState === 1) {
      // 1 = OPEN
      this.socket.send(JSON.stringify(data));
    }
  }
}
