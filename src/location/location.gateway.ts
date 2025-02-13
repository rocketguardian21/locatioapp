import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LocationService } from './location.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class LocationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private locationService: LocationService) {}

  handleConnection(client: Socket) {
    console.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Cliente desconectado: ${client.id}`);
  }

  @SubscribeMessage('updateLocation')
  handleLocation(client: Socket, location: Location): void {
    // Procesar y corregir la ubicación
    const correctedLocation = this.locationService.correctLocation(location);
    
    // Emitir la ubicación corregida a todos los clientes excepto al emisor
    client.broadcast.emit('locationUpdate', correctedLocation);
  }
} 