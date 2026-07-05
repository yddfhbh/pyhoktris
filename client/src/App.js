import { TetrisGame } from './game/game.js';
import { createCanvasRenderer } from './render/canvas-renderer.js';
import { bindKeyboard } from './input/keyboard.js';
import {
  DEFAULT_HANDLING,
  DEFAULT_KEYBINDS,
  formatKeyCode,
  formatSdfValue,
  loadInputPreferences,
  saveInputPreferences
} from './input/preferences.js';
import { TetrisSocket } from './net/tetris-socket.js';
import { CLIENT, SERVER } from '../../shared/protocol.js';
import { STATE_SEND_INTERVAL_MS } from '../../shared/constants.js';

const KEYBIND_FIELDS = [
  ['moveLeft', 'Move Left'],
  ['moveRight', 'Move Right'],
  ['softDrop', 'Soft Drop'],
  ['hardDrop', 'Hard Drop'],
  ['rotate', 'Rotate'],
  ['hold', 'Hold'],
  ['restart', 'Restart']
];

const HANDLING_FIELDS = [
  ['arr', 'ARR', 0, 100, (value) => `${value} MS`],
  ['das', 'DAS', 0, 300, (value) => `${value} MS`],
  ['dcd', 'DCD', 0, 200, (value) => `${value} MS`],
  ['sdf', 'SDF', 1, 41, formatSdfValue]
];

export function createApp(root) {
  const inputPreferences = loadInputPreferences();

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
  let currentScreen = 'home';
  let multiplayerPanelOpen = false;
  let settingsPanelOpen = false;
  let pendingRebindAction = null;
  let rebindCleanup = null;
  let els = {};

  function renderShell() {
    root.innerHTML = `
      <div class="app-shell">
        <header class="topbar">
          <div class="brand-wrap">
            <button class="brand-button" data-go-home>
              <span class="brand-mark">KN</span>
              <span class="brand-text">KanNyan Tetris</span>
            </button>
            <div class="topbar-subtitle">Arcade lobby and versus prototype</div>
          </div>
          <div class="topbar-actions">
            <button class="ghost-button" data-go-home>HOME</button>
            <div class="server-state" data-server-state>offline</div>
          </div>
        </header>

        <section class="home-screen ${currentScreen === 'home' ? '' : 'is-hidden'}" data-home-screen>
          <div class="home-backdrop"></div>
          <div class="home-content">
            <div class="home-header">
              <p class="home-kicker">LOBBY</p>
              <h1>모드를 고르고 바로 시작</h1>
              <p class="home-copy">사진은 참고만 해서, 우리 쪽은 좀 더 깔끔하고 빠르게 들어가는 구조로 정리했습니다.</p>
            </div>

            <div class="menu-stack">
              <button class="menu-card menu-card-multi" data-open-multiplayer>
                <span class="menu-card-code">MP</span>
                <span class="menu-card-body">
                  <strong>MULTIPLAYER</strong>
                  <small>친구와 방을 만들거나 코드로 참가</small>
                </span>
              </button>

              <div class="multiplayer-panel ${multiplayerPanelOpen ? 'is-open' : ''}" data-multiplayer-panel>
                <div class="multiplayer-grid">
                  <button data-connect>서버 연결</button>
                  <button data-open-room>멀티 화면 열기</button>
                </div>
                <p class="multiplayer-hint">연결 후 방 생성 또는 방 코드 입장을 사용할 수 있습니다.</p>
              </div>

              <button class="menu-card menu-card-solo" data-start-solo>
                <span class="menu-card-code">1P</span>
                <span class="menu-card-body">
                  <strong>SOLO</strong>
                  <small>지금 바로 혼자 플레이 시작</small>
                </span>
              </button>

              <button class="menu-card menu-card-setting" data-open-settings>
                <span class="menu-card-code">CFG</span>
                <span class="menu-card-body">
                  <strong>SETTING</strong>
                  <small>조작키와 감도를 직접 커스터마이즈</small>
                </span>
              </button>

              <div class="settings-panel ${settingsPanelOpen ? 'is-open' : ''}" data-settings-panel>
                <div class="settings-toolbar">
                  <div class="settings-title">HANDLING</div>
                  <div class="settings-toolbar-actions">
                    <button class="ghost-button" data-reset-handling>RESET</button>
                  </div>
                </div>

                <div class="handling-list">
                  ${HANDLING_FIELDS.map(([key, label, min, max, formatter]) => `
                    <label class="handling-row">
                      <div class="handling-head">
                        <span class="handling-name">${label}</span>
                        <span class="handling-value">${formatter(inputPreferences.handling[key])}</span>
                      </div>
                      <input
                        class="handling-slider"
                        type="range"
                        min="${min}"
                        max="${max}"
                        value="${inputPreferences.handling[key]}"
                        data-setting-slider="${key}"
                      />
                    </label>
                  `).join('')}
                </div>

                <div class="settings-toolbar settings-toolbar-keybinds">
                  <div class="settings-title">KEYBINDS</div>
                  <div class="settings-toolbar-actions">
                    <button class="ghost-button" data-reset-keybinds>DEFAULT</button>
                  </div>
                </div>

                <div class="keybind-grid">
                  ${KEYBIND_FIELDS.map(([key, label]) => `
                    <div class="keybind-row">
                      <span class="keybind-label">${label}</span>
                      <button
                        class="keybind-button ${pendingRebindAction === key ? 'is-listening' : ''}"
                        data-rebind-action="${key}"
                      >
                        ${pendingRebindAction === key
                          ? 'PRESS KEY...'
                          : formatKeyCode(inputPreferences.keybinds[key])}
                      </button>
                    </div>
                  `).join('')}
                </div>

                <p class="settings-note">
                  ${pendingRebindAction
                    ? '새 키를 누르세요. ESC를 누르면 취소됩니다.'
                    : '변경한 설정은 브라우저에 자동 저장됩니다.'}
                </p>
              </div>
            </div>
          </div>
        </section>

        <main class="play-screen ${currentScreen === 'play' ? '' : 'is-hidden'}" data-play-screen>
          <div class="layout">
            <section class="panel menu-panel">
              <div class="panel-heading">
                <div>
                  <h1>게임 허브</h1>
                  <p class="muted">솔로 / 방 PVP MVP 버전</p>
                </div>
                <button class="ghost-button" data-go-home>로비</button>
              </div>

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
                <canvas data-hold-canvas width="140" height="112"></canvas>
                <div class="game-caption">HOLD (${formatKeyCode(inputPreferences.keybinds.hold)})</div>

                <canvas data-opponent-canvas width="140" height="280"></canvas>
                <div class="game-caption">OPPONENT</div>

                <div class="stat-card">
                  <div>Score: <b data-score>0</b></div>
                  <div>Lines: <b data-lines>0</b></div>
                  <div>Mode: <b data-mode>solo</b></div>
                  <div>ARR / DAS: <b>${inputPreferences.handling.arr} / ${inputPreferences.handling.das}</b></div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    `;
  }

  function cacheElements() {
    els = {
      serverState: root.querySelector('[data-server-state]'),
      status: root.querySelector('[data-status]'),
      roomId: root.querySelector('[data-room-id]'),
      playerId: root.querySelector('[data-player-id]'),
      roomInput: root.querySelector('[data-room-input]'),
      score: root.querySelector('[data-score]'),
      lines: root.querySelector('[data-lines]'),
      mode: root.querySelector('[data-mode]'),
      mainCanvas: root.querySelector('[data-main-canvas]'),
      holdCanvas: root.querySelector('[data-hold-canvas]'),
      opponentCanvas: root.querySelector('[data-opponent-canvas]')
    };
  }

  function renderGameStage() {
    cacheElements();

    renderer = createCanvasRenderer({
      canvas: els.mainCanvas,
      holdCanvas: els.holdCanvas,
      opponentCanvas: els.opponentCanvas
    });

    syncHud();
    bindUiEvents();
  }

  function bindUiEvents() {
    root.querySelectorAll('[data-go-home]').forEach((button) => {
      button.addEventListener('click', goHome);
    });

    root.querySelectorAll('[data-start-solo]').forEach((button) => {
      button.addEventListener('click', startSolo);
    });

    root.querySelectorAll('[data-connect]').forEach((button) => {
      button.addEventListener('click', () => {
        ensureSocket();
      });
    });

    root.querySelectorAll('[data-open-room]').forEach((button) => {
      button.addEventListener('click', () => {
        openPlayScreen();
      });
    });

    root.querySelectorAll('[data-open-multiplayer]').forEach((button) => {
      button.addEventListener('click', () => {
        multiplayerPanelOpen = !multiplayerPanelOpen;
        rerender();
      });
    });

    root.querySelectorAll('[data-open-settings]').forEach((button) => {
      button.addEventListener('click', () => {
        settingsPanelOpen = !settingsPanelOpen;
        rerender();
      });
    });

    root.querySelectorAll('[data-setting-slider]').forEach((input) => {
      input.addEventListener('change', (event) => {
        const key = event.currentTarget.dataset.settingSlider;
        inputPreferences.handling[key] = Number(event.currentTarget.value);
        persistInputPreferences();
        rerender();
        rebindKeyboardIfNeeded();
      });
    });

    root.querySelectorAll('[data-rebind-action]').forEach((button) => {
      button.addEventListener('click', () => {
        beginKeyRebind(button.dataset.rebindAction);
      });
    });

    root.querySelector('[data-reset-handling]')?.addEventListener('click', () => {
      inputPreferences.handling = { ...DEFAULT_HANDLING };
      persistInputPreferences();
      rerender();
      rebindKeyboardIfNeeded();
    });

    root.querySelector('[data-reset-keybinds]')?.addEventListener('click', () => {
      inputPreferences.keybinds = { ...DEFAULT_KEYBINDS };
      pendingRebindAction = null;
      stopKeyRebind();
      persistInputPreferences();
      rerender();
      rebindKeyboardIfNeeded();
    });

    root.querySelector('[data-create-room]')?.addEventListener('click', () => {
      ensureSocket().send(CLIENT.CREATE_ROOM);
    });

    root.querySelector('[data-join-room]')?.addEventListener('click', () => {
      const roomId = els.roomInput.value.trim().toUpperCase();
      ensureSocket().send(CLIENT.JOIN_ROOM, { roomId });
    });

    root.querySelector('[data-ready]')?.addEventListener('click', () => {
      if (!currentRoomId) {
        setStatus('먼저 방에 들어가야 함');
        return;
      }

      ensureSocket().send(CLIENT.READY, { roomId: currentRoomId });
    });
  }

  function beginKeyRebind(action) {
    pendingRebindAction = action;
    rerender();
    stopKeyRebind();

    const listener = (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (event.code === 'Escape') {
        pendingRebindAction = null;
        stopKeyRebind();
        rerender();
        return;
      }

      inputPreferences.keybinds[action] = event.code;
      pendingRebindAction = null;
      persistInputPreferences();
      stopKeyRebind();
      rerender();
      rebindKeyboardIfNeeded();
    };

    window.addEventListener('keydown', listener, true);
    rebindCleanup = () => {
      window.removeEventListener('keydown', listener, true);
      rebindCleanup = null;
    };
  }

  function stopKeyRebind() {
    rebindCleanup?.();
  }

  function rerender() {
    const previousStatus = els.status?.textContent ?? '대기중';
    renderShell();
    renderGameStage();
    setStatus(previousStatus);
  }

  function persistInputPreferences() {
    saveInputPreferences(inputPreferences);
  }

  function rebindKeyboardIfNeeded() {
    if (!game || currentScreen !== 'play') {
      return;
    }

    keyboardCleanup?.();
    keyboardCleanup = bindKeyboard({
      onLeft: () => game.move(-1),
      onRight: () => game.move(1),
      onRotate: () => game.rotate(),
      onSoftDrop: () => game.softDrop(),
      onHardDrop: () => game.hardDrop(),
      onHold: () => game.hold(),
      onRestart: () => startGame(Date.now()),
      keybinds: inputPreferences.keybinds,
      handling: inputPreferences.handling
    });
  }

  function syncHud() {
    if (els.serverState) {
      els.serverState.textContent = socket?.isOpen() ? 'online' : 'offline';
    }

    if (els.roomId) {
      els.roomId.textContent = currentRoomId ?? '-';
    }

    if (els.playerId) {
      els.playerId.textContent = playerId ?? '-';
    }

    if (els.mode) {
      els.mode.textContent = mode;
    }

    if (els.score) {
      els.score.textContent = String(game?.score ?? 0);
    }

    if (els.lines) {
      els.lines.textContent = String(game?.lines ?? 0);
    }
  }

  function setStatus(text) {
    if (els.status) {
      els.status.textContent = text;
    }
  }

  function openPlayScreen() {
    currentScreen = 'play';
    rerender();
    setStatus('대기중');
    rebindKeyboardIfNeeded();

    if (game) {
      renderer?.render(game.getRenderState());
      renderer?.renderOpponent(opponentState);
    }
  }

  function goHome() {
    stopKeyRebind();
    stopGame();
    currentScreen = 'home';
    rerender();
  }

  function ensureSocket() {
    if (socket?.isOpen()) return socket;

    socket = new TetrisSocket();

    socket.onOpen(() => {
      if (els.serverState) {
        els.serverState.textContent = 'online';
      }
      setStatus('서버 연결됨');
    });

    socket.onClose(() => {
      if (els.serverState) {
        els.serverState.textContent = 'offline';
      }
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
      if (els.playerId) {
        els.playerId.textContent = playerId;
      }
      return;
    }

    if (type === SERVER.ROOM_CREATED) {
      currentRoomId = payload.roomId;
      if (els.roomId) {
        els.roomId.textContent = currentRoomId;
      }
      if (els.roomInput) {
        els.roomInput.value = currentRoomId;
      }
      setStatus('방 생성됨');
      return;
    }

    if (type === SERVER.JOINED_ROOM) {
      currentRoomId = payload.roomId;
      if (els.roomId) {
        els.roomId.textContent = currentRoomId;
      }
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
    currentScreen = 'play';
    rerender();
    els.mode.textContent = mode;
    setStatus('솔로 플레이중');
    startGame(Date.now());
  }

  function startVersus(seed = Date.now()) {
    mode = 'versus';
    currentScreen = 'play';
    rerender();
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

    rebindKeyboardIfNeeded();

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

    if (game && currentScreen === 'play') {
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

  renderShell();
  renderGameStage();
}
