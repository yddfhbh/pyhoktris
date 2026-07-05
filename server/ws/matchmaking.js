import { createRoom, listRooms } from './rooms.js';

export function findOpenRoom() {
  const rooms = listRooms();
  return rooms.find((room) => room.playerCount === 1 && !room.started) ?? null;
}

export function createMatchmakingRoom() {
  return createRoom();
}