import { WebSocket, WebSocketServer } from 'ws';
import crypto from 'node:crypto';

import { CLIENT, SERVER, makeMessage } from './protocol.js';
import { parseJsonMessage } from '../../shared/validators.js';
import { createRoom, getRoom, cleanupEmptyRooms } from './rooms.js';
import { isKnownClientMessage, sanitizeAttackLines } from './validators.js';

function send(ws, type, payload = {}) {
  if (ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify(makeMessage(type, payload)));
}

function broadcast(room, type, payload = {}, exceptPlayerId = null) {
  for (const player of room.players.values()) {
    if (player.id === exceptPlayerId) continue;
    send(player.ws, type, payload);
  }
}

function createPlayer(ws) {
  return {
    id: crypto.randomUUID().slice(0, 8),
    ws
  };
}

export function attachTetrisWs(server) {
  const wss = new WebSocketServer({
    server,
    path: '/ws/tetris'
  });

  wss.on('connection', (ws) => {
    const player = createPlayer(ws);
    let currentRoomId = null;

    send(ws, SERVER.HELLO, {
      playerId: player.id
    });

    ws.on('message', (raw) => {
      const message = parseJsonMessage(raw);
      if (!message) {
        send(ws, SERVER.ERROR, { message: '잘못된 메시지' });
        return;
      }

      const { type, payload } = message;

      if (!isKnownClientMessage(type)) {
        send(ws, SERVER.ERROR, { message: '알 수 없는 메시지 타입' });
        return;
      }

      if (type === CLIENT.PING) {
        send(ws, SERVER.PONG);
        return;
      }

      if (type === CLIENT.CREATE_ROOM) {
        const room = createRoom();
        room.addPlayer(player);
        currentRoomId = room.roomId;

        send(ws, SERVER.ROOM_CREATED, {
          roomId: room.roomId,
          playerId: player.id
        });
        return;
      }

      if (type === CLIENT.JOIN_ROOM) {
        const roomId = String(payload.roomId ?? '').trim().toUpperCase();
        const room = getRoom(roomId);

        if (!room) {
          send(ws, SERVER.ERROR, { message: '방을 찾을 수 없음' });
          return;
        }

        if (room.isFull()) {
          send(ws, SERVER.ERROR, { message: '방이 가득 참' });
          return;
        }

        room.addPlayer(player);
        currentRoomId = room.roomId;

        send(ws, SERVER.JOINED_ROOM, {
          roomId: room.roomId,
          playerId: player.id
        });

        broadcast(room, SERVER.PLAYER_JOINED, {
          roomId: room.roomId,
          playerId: player.id,
          playerCount: room.size
        }, player.id);

        return;
      }

      const roomId = String(payload.roomId ?? currentRoomId ?? '').trim().toUpperCase();
      const room = getRoom(roomId);

      if (!room || !room.hasPlayer(player.id)) {
        send(ws, SERVER.ERROR, { message: '참가 중인 방이 아님' });
        return;
      }

      if (type === CLIENT.LEAVE_ROOM) {
        room.removePlayer(player.id);
        broadcast(room, SERVER.PLAYER_LEFT, { playerId: player.id });
        cleanupEmptyRooms();
        currentRoomId = null;
        return;
      }

      if (type === CLIENT.READY) {
        room.setReady(player.id, true);

        broadcast(room, SERVER.READY_STATE, {
          roomId: room.roomId,
          playerCount: room.size,
          readyCount: room.getReadyCount()
        });

        if (!room.started && room.canStart()) {
          const seed = room.start();

          broadcast(room, SERVER.GAME_START, {
            roomId: room.roomId,
            seed
          });
        }

        return;
      }

      if (type === CLIENT.STATE) {
        broadcast(room, SERVER.OPPONENT_STATE, {
          playerId: player.id,
          state: payload.state
        }, player.id);
        return;
      }

      if (type === CLIENT.ATTACK) {
        const lines = sanitizeAttackLines(payload.lines);

        if (lines > 0) {
          broadcast(room, SERVER.GARBAGE, {
            playerId: player.id,
            lines
          }, player.id);
        }

        return;
      }

      if (type === CLIENT.GAME_OVER) {
        room.setDead(player.id);
        const winnerId = room.getWinnerId();

        broadcast(room, SERVER.GAME_OVER, {
          roomId: room.roomId,
          loserId: player.id,
          winnerId
        });
      }
    });

    ws.on('close', () => {
      if (!currentRoomId) return;

      const room = getRoom(currentRoomId);

      if (!room) return;

      room.removePlayer(player.id);

      broadcast(room, SERVER.PLAYER_LEFT, {
        playerId: player.id
      });

      cleanupEmptyRooms();
    });
  });

  console.log('[ws] /ws/tetris attached');
}
