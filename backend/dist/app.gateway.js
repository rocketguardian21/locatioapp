"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
let AppGateway = class AppGateway {
    constructor() {
        this.destination = null;
        this.connectedClients = new Map();
    }
    handleConnection(client) {
        console.log(`Cliente conectado: ${client.id}`);
        this.connectedClients.set(client.id, client);
        if (this.destination) {
            client.emit('destinationSet', { destination: this.destination });
        }
    }
    handleDisconnect(client) {
        console.log(`Cliente desconectado: ${client.id}`);
        this.connectedClients.delete(client.id);
    }
    handleLocation(client, data) {
        console.log(`Actualización de ubicación de ${data.userId}:`, data.location);
        this.server.emit('locationUpdate', data);
    }
    handleDestination(client, data) {
        console.log('Nuevo destino establecido:', data.destination);
        this.destination = data.destination;
        this.server.emit('destinationSet', data);
    }
};
exports.AppGateway = AppGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], AppGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('updateLocation'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], AppGateway.prototype, "handleLocation", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('setDestination'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], AppGateway.prototype, "handleDestination", null);
exports.AppGateway = AppGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
    })
], AppGateway);
//# sourceMappingURL=app.gateway.js.map