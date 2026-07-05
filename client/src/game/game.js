import { createEmptyBoard, collides, mergePiece, clearLines, cloneBoard } from './board.js';
import { createPiece } from './pieces.js';
import { SevenBag } from './bag.js';
import { tryRotate } from './rotation.js';
import { getGravityMs } from './gravity.js';
import { addGarbageLines, getAttackLines } from './garbage.js';
import { ReplayRecorder } from './replay.js';
import { LOCK_DELAY_MS } from '../../../shared/constants.js';

export class TetrisGame {
  constructor({ seed = Date.now(), onAttack = null, onGameOver = null } = {}) {
    this.seed = seed;
    this.board = createEmptyBoard();
    this.bag = new SevenBag(seed);
    this.active = createPiece(this.bag.next());
    this.heldType = null;
    this.canHold = true;
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.alive = true;
    this.gravityTimer = 0;
    this.lockTimer = 0;
    this.onAttack = onAttack;
    this.onGameOver = onGameOver;
    this.replay = new ReplayRecorder();
  }

  update(dt) {
    if (!this.alive) return;

    this.gravityTimer += dt;

    if (this.isGrounded()) {
      this.lockTimer += dt;

      if (this.lockTimer >= LOCK_DELAY_MS) {
        this.lockPiece();
        return;
      }
    } else {
      this.lockTimer = 0;
    }

    if (this.gravityTimer >= getGravityMs({ level: this.level })) {
      this.gravityTimer = 0;
      this.stepDown();
    }
  }

  move(dx) {
    if (!this.alive) return false;

    if (!collides(this.board, this.active, dx, 0)) {
      this.active.x += dx;
      this.resetLockDelay();
      this.replay.push('move', { dx });
      return true;
    }

    return false;
  }

  rotate() {
    if (!this.alive) return false;

    const ok = tryRotate(this.board, this.active);

    if (ok) {
      this.resetLockDelay();
      this.replay.push('rotate');
    }

    return ok;
  }

  hold() {
    if (!this.alive || !this.canHold) return false;

    const currentType = this.active.type;

    if (this.heldType) {
      const heldType = this.heldType;
      this.heldType = currentType;
      this.active = createPiece(heldType);
    } else {
      this.heldType = currentType;
      this.active = createPiece(this.bag.next());
    }

    this.canHold = false;
    this.gravityTimer = 0;
    this.lockTimer = 0;
    this.replay.push('hold', {
      heldType: this.heldType,
      activeType: this.active.type
    });

    if (collides(this.board, this.active, 0, 0)) {
      this.alive = false;
      this.onGameOver?.();
    }

    return this.alive;
  }

  softDrop() {
    if (!this.alive) return false;

    if (this.stepDown()) {
      this.score += 1;
      this.replay.push('soft_drop');
      return true;
    }

    return false;
  }

  hardDrop() {
    if (!this.alive) return;

    let dropped = 0;

    while (!collides(this.board, this.active, 0, 1)) {
      this.active.y += 1;
      dropped += 1;
    }

    this.score += dropped * 2;
    this.replay.push('hard_drop', { dropped });
    this.lockPiece();
  }

  stepDown() {
    if (!this.alive) return false;

    if (!collides(this.board, this.active, 0, 1)) {
      this.active.y += 1;
      this.lockTimer = 0;
      return true;
    }

    return false;
  }

  isGrounded() {
    return collides(this.board, this.active, 0, 1);
  }

  resetLockDelay() {
    this.lockTimer = 0;
  }

  lockPiece() {
    mergePiece(this.board, this.active);

    const cleared = clearLines(this.board);

    if (cleared > 0) {
      this.lines += cleared;
      this.score += [0, 100, 300, 500, 800][cleared] ?? 0;
      this.level = 1 + Math.floor(this.lines / 10);

      const attack = getAttackLines(cleared);

      if (attack > 0) {
        this.onAttack?.(attack);
      }
    }

    this.spawnPiece();
  }

  spawnPiece() {
    this.active = createPiece(this.bag.next());
    this.canHold = true;
    this.gravityTimer = 0;
    this.lockTimer = 0;

    if (collides(this.board, this.active, 0, 0)) {
      this.alive = false;
      this.onGameOver?.();
    }
  }

  addGarbage(lines) {
    if (!this.alive) return;
    addGarbageLines(this.board, lines);
  }

  getRenderState() {
    return {
      board: this.board,
      active: this.active,
      heldType: this.heldType,
      canHold: this.canHold,
      next: this.bag.preview(5),
      score: this.score,
      lines: this.lines,
      level: this.level,
      alive: this.alive
    };
  }

  getPublicState() {
    return {
      board: cloneBoard(this.board),
      active: {
        type: this.active.type,
        matrix: this.active.matrix,
        x: this.active.x,
        y: this.active.y
      },
      score: this.score,
      lines: this.lines,
      level: this.level,
      alive: this.alive
    };
  }
}
