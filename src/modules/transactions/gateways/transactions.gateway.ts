import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { TransactionStatus } from '../entities/transaction.entity';

const parseCorsOrigins = () => {
  const raw =
    process.env.FRONT_URL ??
    process.env.CORS_ORIGIN ??
    'http://localhost:5173';
  const origins = raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  return origins.length > 1 ? origins : origins[0];
};

@WebSocketGateway({
  cors: {
    origin: parseCorsOrigins(),
    credentials: true,
  },
})
export class TransactionsGateway {
  @WebSocketServer()
  server: Server;

  broadcastTransactionUpdated(payload: {
    id: string;
    status: TransactionStatus;
    updatedAt: Date;
  }) {
    this.server.emit('transaction.updated', payload);
  }
}
