import { makeMessage } from '../../../shared/protocol.js';

export class TetrisSocket {
  constructor() {
    this.ws = null;
    this.openHandlers = [];
    this.closeHandlers = [];
    this.messageHandlers = [];
  }

  connect() {
    if (this.ws && this.ws.readyState <= 1) return;

    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//${location.host}/ws/tetris`;

    this.ws = new WebSocket(url);

    this.ws.addEventListener('open', () => {
      for (const handler of this.openHandlers) handler();
    });

    this.ws.addEventListener('close', () => {
      for (const handler of this.closeHandlers) handler();
    });

    this.ws.addEventListener('message', (event) => {
      try {
        const message = JSON.parse(event.data);

        for (const handler of this.messageHandlers) {
          handler(message);
        }
      } catch {
        // ignore malformed message
      }
    });
  }

  isOpen() {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  send(type, payload = {}) {
    if (!this.isOpen()) return false;

    this.ws.send(JSON.stringify(makeMessage(type, payload)));
    return true;
  }

  onOpen(handler) {
    this.openHandlers.push(handler);
  }

  onClose(handler) {
    this.closeHandlers.push(handler);
  }

  onMessage(handler) {
    this.messageHandlers.push(handler);
  }
}