/**
 * Socket.IO client bootstrap
 * - Uses VITE_SERVER_URL in production (Render).
 * - Falls back to http://<current-host>:3001 for local development.
 * - autoConnect=true so the UI reflects connection status immediately.
 */
import { io } from 'socket.io-client';

const prodURL = import.meta.env.VITE_SERVER_URL;
const localHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const URL = prodURL || `http://${localHost}:3001`;

export const socket = io(URL, {
  autoConnect: true,
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 10,
  reconnectionDelay: 500
});
