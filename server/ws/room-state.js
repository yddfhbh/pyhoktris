import { MAX_ROOM_PLAYERS } from '../../shared/constants.js';

export class RoomState {
  constructor(roomId) {
    this.roomId = roomId;
    this.players = new Map();
    this.createdAt = Date.now();
    this.started = false;
    this.seed = null;
  }

  get size() {
    return this.players.size;
  }

  isFull() {
    return this.players.size >= MAX_ROOM_PLAYERS;
  }

  addPlayer(player) {
    if (this.isFull()) {
      throw new Error('room_full');
    }

    this.players.set(player.id, {
      ...player,
      ready: false,
      alive: true
    });
  }

  removePlayer(playerId) {
    this.players.delete(playerId);
  }

  hasPlayer(playerId) {
    return this.players.has(playerId);
  }

  setReady(playerId, ready = true) {
    const player = this.players.get(playerId);
    if (!player) return;

    player.ready = ready;
  }

  setDead(playerId) {
    const player = this.players.get(playerId);
    if (!player) return;

    player.alive = false;
  }

  getReadyCount() {
    let count = 0;

    for (const player of this.players.values()) {
      if (player.ready) count += 1;
    }

    return count;
  }

  canStart() {
    return this.players.size === MAX_ROOM_PLAYERS
      && [...this.players.values()].every((player) => player.ready);
  }

  start() {
    this.started = true;
    this.seed = Date.now();
    return this.seed;
  }

  getOpponent(playerId) {
    for (const player of this.players.values()) {
      if (player.id !== playerId) {
        return player;
      }
    }

    return null;
  }

  getWinnerId() {
    const alivePlayers = [...this.players.values()].filter((player) => player.alive);
    if (alivePlayers.length === 1) return alivePlayers[0].id;
    return null;
  }

  toJSON() {
    return {
      roomId: this.roomId,
      playerCount: this.players.size,
      readyCount: this.getReadyCount(),
      started: this.started
    };
  }
}