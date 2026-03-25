/**
 * socketService.js - singleton Socket.IO client for the frontend
 * Imported by DashboardPage to receive real-time events
 */
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}

export function joinStudentRoom(regdNo) {
  const s = getSocket();
  if (regdNo) s.emit('join_student', regdNo.toString().toUpperCase());
}

export function disconnectSocket() {
  if (socket) { socket.disconnect(); socket = null; }
}
