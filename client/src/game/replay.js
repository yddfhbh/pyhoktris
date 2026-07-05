export class ReplayRecorder {
  constructor() {
    this.events = [];
    this.startedAt = Date.now();
  }

  push(type, payload = {}) {
    this.events.push({
      type,
      payload,
      at: Date.now() - this.startedAt
    });
  }

  toJSON() {
    return {
      startedAt: this.startedAt,
      events: this.events.slice()
    };
  }
}
