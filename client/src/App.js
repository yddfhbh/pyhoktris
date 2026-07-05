import { TetrisGame } from './game/game.js';
import { createCanvasRenderer } from './render/canvas-renderer.js';
import { bindKeyboard } from './input/keyboard.js';
import { TetrisSocket } from './net/tetris-socket.js';
import { CLIENT, SERVER } from '../../shared/protocol.js';
import { STATE_SEND_INTERVAL_MS } from '../../shared/constants.js';

export function createApp(root) {
  let game = null;
  let renderer = null;
  let keyboardCleanup = null;
  let socket = null;
  let animationId = null;
  let lastTime = 0;
  let stateTimer = 0;
  let mode = 'solo';
  let currentRoomId = null;
  let playerId = null;
  let opponentState = null;

  root.innerHTML = `
    <div class="app-shell">
      <header class="topbar">
        <div class="brand">KanNyan Tetris</div>
        <div class="server-state" data-server-state>offline</div>
      </header>

      <main class="layout">
        <section class="panel menu-panel">
          <h1>온라인 테트리스</h1>
          <p class="muted">솔로 / 방 PVP MVP 버전</p>

          <div class="button-row">
            <button data-start-solo>솔로 시작</button>
            <button data-connect>서버 연결</button>
          </div>

          <div class="room-box">
            <button data-create-room>방 만들기</button>
            <div class="join-row">
              <input data-room-input placeholder="방 코드" maxlength="5" />
              <button data-join-room>입장</button>
            </div>
            <button data-ready>준비</button>
          </div>

          <div class="info-box">
            <div>Room: <b data-room-id>-</b></div>
            <div>Player: <b data-player-id>-</b></div>
            <div>Status: <b data-status>대기중</b></div>
          </div>
        </section>

        <section class="game-area">
          <div class="board-wrap">
            <canvas data-main-canvas width="280" height="560"></canvas>
            <div class="game-caption">MY BOARD</div>
          </div>

          <div class="side-wrap">
            <canvas data-opponent-canvas width="140" height="280"></canvas>
            <div class="game-caption">OPPONENT</div>

            <div class="stat-card">
              <div>Score: <b data-score>0</b></div>
              <div>Lines: <b data-lines>0</b></div>
              <div>Mode: <b data-mode>solo</b></div>
            </div>
          </div>
        </section>
      </main>
    </div>
  `;

  const els = {
    serverState: root.querySelector('[data-server-state]'),
    status: root.querySelector('[data-status]'),
    roomId: root.querySelector('[data-room-id]'),
    playerId: root.querySelector('[data-player-id]'),
    roomInput: root.querySelector('[data-room-input]'),
    score: root.querySelector('[data-score]'),
    lines: root.querySelector('[data-lines]'),
    mode: root.querySelector('[data-mode]'),
    mainCanvas: root.querySelector('[data-main-canvas]'),
    opponentCanvas: root.querySelector('[data-opponent-canvas]')
  };

  renderer = createCanvasRenderer({
    canvas: els.mainCanvas,
    opponentCanvas: els.opponentCanvas
  });

  function setStatus(text) {
    els.status.textContent = text;
  }

  function ensureSocket() {
    if (socket?.isOpen()) return socket;

    socket = new TetrisSocket();

    socket.onOpen(() => {
      els.serverState.textContent = 'online';
      setStatus('서버 연결됨');
    });

    socket.onClose(() => {
      els.serverState.textContent = 'offline';
      setStatus('서버 연결 끊김');
    });

    socket.onMessage((message) => {
      handleServerMessage(message);
    });

    socket.connect();

    return socket;
  }

  function handleServerMessage(message) {
    const { type, payload } = message;

    if (type === SERVER.HELLO) {
      playerId = payload.playerId;
      els.playerId.textContent = playerId;
      return;
    }

    if (type === SERVER.ROOM_CREATED) {
      currentRoomId = payload.roomId;
      els.roomId.textContent = currentRoomId;
      els.roomInput.value = currentRoomId;
      setStatus('방 생성됨');
      return;
    }

    if (type === SERVER.JOINED_ROOM) {
      currentRoomId = payload.roomId;
      els.roomId.textContent = currentRoomId;
      setStatus('방 입장됨');
      return;
    }

    if (type === SERVER.PLAYER_JOINED) {
      setStatus('상대 입장');
      return;
    }

    if (type === SERVER.PLAYER_LEFT) {
      setStatus('상대 나감');
      opponentState = null;
      return;
    }

    if (type === SERVER.READY_STATE) {
      setStatus(`준비 상태 ${payload.readyCount}/${payload.playerCount}`);
      return;
    }

    if (type === SERVER.GAME_START) {
      startVersus(payload.seed);
      return;
    }

    if (type === SERVER.OPPONENT_STATE) {
      opponentState = payload.state;
      return;
    }

    if (type === SERVER.GARBAGE) {
      if (game) {
        game.addGarbage(payload.lines ?? 0);
      }
      return;
    }

    if (type === SERVER.GAME_OVER) {
      setStatus(payload.winnerId === playerId ? '승리' : '패배');
      return;
    }

    if (type === SERVER.ERROR) {
      setStatus(payload.message ?? '서버 오류');
    }
  }

  function startSolo() {
    mode = 'solo';
    els.mode.textContent = mode;
    setStatus('솔로 플레이중');
    startGame(Date.now());
  }

  function startVersus(seed = Date.now()) {
    mode = 'versus';
    els.mode.textContent = mode;
    setStatus('PVP 시작');
    startGame(seed);
  }

  function startGame(seed) {
    stopGame();

    game = new TetrisGame({
      seed,
      onAttack: (lines) => {
        if (mode === 'versus' && socket?.isOpen()) {
          socket.send(CLIENT.ATTACK, { roomId: currentRoomId, lines });
        }
      },
      onGameOver: () => {
        setStatus('게임 오버');

        if (mode === 'versus' && socket?.isOpen()) {
          socket.send(CLIENT.GAME_OVER, { roomId: currentRoomId });
        }
      }
    });

    keyboardCleanup = bindKeyboard({
      onLeft: () => game.move(-1),
      onRight: () => game.move(1),
      onRotate: () => game.rotate(),
      onSoftDrop: () => game.softDrop(),
      onHardDrop: () => game.hardDrop(),
      onRestart: () => startGame(Date.now())
    });

    lastTime = performance.now();
    stateTimer = 0;
    loop(lastTime);
  }

  function stopGame() {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }

    if (keyboardCleanup) {
      keyboardCleanup();
      keyboardCleanup = null;
    }
  }

  function loop(now) {
    const dt = now - lastTime;
    lastTime = now;

    if (game) {
      game.update(dt);
      renderer.render(game.getRenderState());
      renderer.renderOpponent(opponentState);

      els.score.textContent = String(game.score);
      els.lines.textContent = String(game.lines);

      if (mode === 'versus' && socket?.isOpen() && currentRoomId) {
        stateTimer += dt;

        if (stateTimer >= STATE_SEND_INTERVAL_MS) {
          stateTimer = 0;
          socket.send(CLIENT.STATE, {
            roomId: currentRoomId,
            state: game.getPublicState()
          });
        }
      }
    }

    animationId = requestAnimationFrame(loop);
  }

  root.querySelector('[data-start-solo]').addEventListener('click', startSolo);

  root.querySelector('[data-connect]').addEventListener('click', () => {
    ensureSocket();
  });

  root.querySelector('[data-create-room]').addEventListener('click', () => {
    ensureSocket().send(CLIENT.CREATE_ROOM);
  });

  root.querySelector('[data-join-room]').addEventListener('click', () => {
    const roomId = els.roomInput.value.trim().toUpperCase();
    ensureSocket().send(CLIENT.JOIN_ROOM, { roomId });
  });

  root.querySelector('[data-ready]').addEventListener('click', () => {
    if (!currentRoomId) {
      setStatus('먼저 방에 들어가야 함');
      return;
    }

    ensureSocket().send(CLIENT.READY, { roomId: currentRoomId });
  });

  startSolo();
}