import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
interface Location {
    latitude: number;
    longitude: number;
}
export declare class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private destination;
    private connectedClients;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleLocation(client: Socket, data: {
        userId: string;
        location: Location;
    }): void;
    handleDestination(client: Socket, data: {
        destination: Location;
    }): void;
}
export {};
