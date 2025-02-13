import io from 'socket.io-client';
import { Location } from '../types';

// Para Genymotion, usamos la IP del host virtual
const SOCKET_URL = 'http://192.168.56.1:3000';  // IP del host de Genymotion

export const socket = io(SOCKET_URL);

export const emitLocation = (location: Location): void => {
  socket.emit('updateLocation', location);
};

export const listenToLocation = (callback: (location: Location) => void): void => {
  socket.on('locationUpdate', callback);
};