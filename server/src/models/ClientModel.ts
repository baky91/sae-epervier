import WebSocket from "ws";

export class ClientModel {
  socket: WebSocket;
  disconnectTimeout: NodeJS.Timeout | null;

  constructor(socket: WebSocket) {
    this.socket = socket;
    this.disconnectTimeout = null;
  }

  sendMessage(data: any): void {
    if (this.socket.readyState === 1) {
      // 1 = OPEN
      this.socket.send(JSON.stringify(data));
    }
  }

  closeWithTimeout(timeout: number): void {}
}
