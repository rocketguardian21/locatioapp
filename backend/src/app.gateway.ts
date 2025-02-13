import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface Location {
  latitude: number;
  longitude: number;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private destination: Location | null = null;
  private connectedClients: Map<string, Socket> = new Map();

  handleConnection(client: Socket) {
    console.log(`Cliente conectado: ${client.id}`);
    this.connectedClients.set(client.id, client);
    
    // Si hay un destino establecido, enviarlo al nuevo cliente
    if (this.destination) {
      client.emit('destinationSet', { destination: this.destination });
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Cliente desconectado: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  @SubscribeMessage('updateLocation')
  handleLocation(client: Socket, data: { userId: string; location: Location }): void {
    console.log(`Actualización de ubicación de ${data.userId}:`, data.location);
    this.server.emit('locationUpdate', data);
  }

  @SubscribeMessage('setDestination')
  handleDestination(client: Socket, data: { destination: Location }): void {
    console.log('Nuevo destino establecido:', data.destination);
    this.destination = data.destination;
    this.server.emit('destinationSet', data);
  }
} 