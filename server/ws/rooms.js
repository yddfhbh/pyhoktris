import { ROOM_ID_LENGTH } from '../../shared/constants.js';
import { RoomState } from './room-state.js';

const rooms = new Map();

function generateRoomId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  for (let attempt = 0; attempt < 100; attempt += 1) {
    let id = '';

    for (let i = 0; i < ROOM_ID_LENGTH; i += 1) {
      id += chars[Math.floor(Math.random() * chars.length)];
    }

    if (!rooms.has(id)) return id;
  }

  throw new Error('failed_to_generate_room_id');
}

export function createRoom() {
  const roomId = generateRoomId();
  const room = new RoomState(roomId);
  rooms.set(roomId, room);
  return room;
}

export function getRoom(roomId) {
  return rooms.get(roomId) ?? null;
}

export function deleteRoom(roomId) {
  rooms.delete(roomId);
}

export function cleanupEmptyRooms() {
  for (const [roomId, room] of rooms.entries()) {
    if (room.size === 0) {
      rooms.delete(roomId);
    }
  }
}

export function listRooms() {
  return [...rooms.values()].map((room) => room.toJSON());
}