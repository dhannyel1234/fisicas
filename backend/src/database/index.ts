import { PrismaClient } from '@prisma/client';
import { logger, logError } from '../utils/logger';
import { config } from '../config';

// Configurar cliente Prisma
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: config.database.url
    }
  },
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
});

// Event listeners para logs do Prisma
prisma.$on('query', (e) => {
  logger.debug('Database Query', {
    service: 'prisma',
    query: e.query,
    params: e.params,
    duration: `${e.duration}ms`,
    timestamp: e.timestamp
  });
});

prisma.$on('error', (e) => {
  logger.error('Database Error', {
    service: 'prisma',
    message: e.message,
    timestamp: e.timestamp
  });
});

prisma.$on('info', (e) => {
  logger.info('Database Info', {
    service: 'prisma',
    message: e.message,
    timestamp: e.timestamp
  });
});

prisma.$on('warn', (e) => {
  logger.warn('Database Warning', {
    service: 'prisma',
    message: e.message,
    timestamp: e.timestamp
  });
});

// Função para conectar ao banco
export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully', {
      service: 'database',
      url: config.database.url.split('@')[1] || 'configured'
    });
  } catch (error) {
    logError(error as Error, 'database-connection');
    throw new Error('Failed to connect to database');
  }
};

// Função para desconectar do banco
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected', { service: 'database' });
  } catch (error) {
    logError(error as Error, 'database-disconnection');
  }
};

// Função para verificar saúde do banco
export const checkDatabaseHealth = async (): Promise<{ status: string; responseTime: number; error?: string }> => {
  const start = Date.now();
  
  try {
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - start;
    
    return {
      status: 'up',
      responseTime
    };
  } catch (error) {
    const responseTime = Date.now() - start;
    logError(error as Error, 'database-health-check');
    
    return {
      status: 'down',
      responseTime,
      error: (error as Error).message
    };
  }
};

// Função para executar transações
export const executeTransaction = async <T>(
  fn: (prisma: PrismaClient) => Promise<T>
): Promise<T> => {
  try {
    return await prisma.$transaction(async (tx) => {
      return await fn(tx as PrismaClient);
    });
  } catch (error) {
    logError(error as Error, 'database-transaction');
    throw error;
  }
};

// Middleware para performance de queries
export const withPerformanceLogging = <T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> => {
  const start = Date.now();
  
  return fn()
    .then((result) => {
      const duration = Date.now() - start;
      
      if (duration > 1000) { // Log slow queries (>1s)
        logger.warn('Slow Database Operation', {
          service: 'database',
          operation,
          duration: `${duration}ms`
        });
      }
      
      return result;
    })
    .catch((error) => {
      const duration = Date.now() - start;
      logError(error, `database-operation-${operation}`, { duration: `${duration}ms` });
      throw error;
    });
};

// Helper functions para queries comuns
export const findUserByDiscordId = async (discordId: string) => {
  return await withPerformanceLogging(
    'findUserByDiscordId',
    () => prisma.user.findUnique({
      where: { discordId },
      include: {
        preferences: true,
        virtualMachines: {
          where: {
            status: {
              not: 'DELETED'
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })
  );
};

export const findActiveVMsByUser = async (userId: string) => {
  return await withPerformanceLogging(
    'findActiveVMsByUser',
    () => prisma.virtualMachine.findMany({
      where: {
        userId,
        status: {
          in: ['CREATING', 'STARTING', 'RUNNING']
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  );
};

export const findQueueItemByUser = async (userId: string) => {
  return await withPerformanceLogging(
    'findQueueItemByUser',
    () => prisma.queueItem.findFirst({
      where: {
        userId,
        status: {
          in: ['WAITING', 'PROCESSING']
        }
      }
    })
  );
};

export const getQueuePosition = async (userId: string): Promise<number> => {
  const queueItem = await findQueueItemByUser(userId);
  if (!queueItem) return 0;
  
  const position = await withPerformanceLogging(
    'getQueuePosition',
    () => prisma.queueItem.count({
      where: {
        status: 'WAITING',
        createdAt: {
          lt: queueItem.createdAt
        }
      }
    })
  );
  
  return position + 1;
};

export const getSystemStats = async () => {
  return await withPerformanceLogging(
    'getSystemStats',
    async () => {
      const [
        totalUsers,
        activeVMs,
        queueLength,
        totalVMsCreated
      ] = await Promise.all([
        prisma.user.count(),
        prisma.virtualMachine.count({
          where: {
            status: {
              in: ['CREATING', 'STARTING', 'RUNNING']
            }
          }
        }),
        prisma.queueItem.count({
          where: {
            status: {
              in: ['WAITING', 'PROCESSING']
            }
          }
        }),
        prisma.virtualMachine.count()
      ]);

      return {
        totalUsers,
        activeVMs,
        queueLength,
        totalVMsCreated
      };
    }
  );
};

// Função para limpar dados antigos
export const cleanupOldData = async () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  try {
    await executeTransaction(async (tx) => {
      // Limpar VMs antigas deletadas
      await tx.virtualMachine.deleteMany({
        where: {
          status: 'DELETED',
          updatedAt: {
            lt: thirtyDaysAgo
          }
        }
      });

      // Limpar itens da fila antigos
      await tx.queueItem.deleteMany({
        where: {
          status: {
            in: ['COMPLETED', 'FAILED', 'CANCELLED']
          },
          updatedAt: {
            lt: thirtyDaysAgo
          }
        }
      });

      // Limpar logs antigos
      await tx.systemLog.deleteMany({
        where: {
          createdAt: {
            lt: ninetyDaysAgo
          }
        }
      });

      // Limpar métricas antigas
      await tx.systemMetrics.deleteMany({
        where: {
          timestamp: {
            lt: ninetyDaysAgo
          }
        }
      });

      // Limpar sessões expiradas
      await tx.userSession.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });
    });

    logger.info('Database cleanup completed', {
      service: 'database',
      cleanupDate: new Date().toISOString()
    });
  } catch (error) {
    logError(error as Error, 'database-cleanup');
  }
};

// Export do cliente Prisma
export default prisma;