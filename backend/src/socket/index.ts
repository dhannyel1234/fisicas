import { Server as SocketIOServer } from 'socket.io';
import { logger } from '../utils/logger';

export const setupSocketIO = (io: SocketIOServer): void => {
  io.on('connection', (socket) => {
    logger.info('Socket.IO client connected', {
      service: 'socket',
      socketId: socket.id,
      clientAddress: socket.handshake.address
    });

    socket.on('disconnect', (reason) => {
      logger.info('Socket.IO client disconnected', {
        service: 'socket',
        socketId: socket.id,
        reason
      });
    });

    // Placeholder para eventos específicos
    socket.emit('connected', {
      message: 'Connected to Hyper-V Platform',
      timestamp: new Date().toISOString()
    });
  });

  logger.info('Socket.IO server configured', { service: 'socket' });
};