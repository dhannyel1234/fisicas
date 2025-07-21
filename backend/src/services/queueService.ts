import { Server as SocketIOServer } from 'socket.io';
import { logger } from '../utils/logger';

export const setupQueueProcessor = async (io: SocketIOServer): Promise<void> => {
  // Placeholder para o processador de fila
  logger.info('Queue processor initialized', { service: 'queue' });
  
  // TODO: Implementar Bull Queue e processamento de VMs
};