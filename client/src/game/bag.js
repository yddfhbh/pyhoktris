import { PIECE_TYPES } from './pieces.js';

export function createRng(seed = Date.now()) {
  let state = Number(seed) >>> 0;

  return function rng() {
    state += 0x6D2B79F5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class SevenBag {
  constructor(seed) {
    this.rng = createRng(seed);
    this.queue = [];
    this.refill();
    this.refill();
  }

  refill() {
    const bag = PIECE_TYPES.slice();

    for (let i = bag.length - 1; i > 0; i -= 1) {
      const j = Math.floor(this.rng() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }

    this.queue.push(...bag);
  }

  next() {
    if (this.queue.length < 7) {
      this.refill();
    }

    return this.queue.shift();
  }

  preview(count = 5) {
    while (this.queue.length < count) {
      this.refill();
    }

    return this.queue.slice(0, count);
  }
}
