export const CLIENT = {
  CREATE_ROOM: 'create_room',
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  READY: 'ready',
  INPUT: 'input',
  STATE: 'state',
  ATTACK: 'attack',
  GAME_OVER: 'game_over',
  PING: 'ping'
};

export const SERVER = {
  HELLO: 'hello',
  ROOM_CREATED: 'room_created',
  JOINED_ROOM: 'joined_room',
  PLAYER_JOINED: 'player_joined',
  PLAYER_LEFT: 'player_left',
  READY_STATE: 'ready_state',
  GAME_START: 'game_start',
  OPPONENT_STATE: 'opponent_state',
  GARBAGE: 'garbage',
  GAME_OVER: 'game_over',
  ERROR: 'error',
  PONG: 'pong'
};

export function makeMessage(type, payload = {}) {
  return {
    type,
    payload,
    t: Date.now()
  };
}