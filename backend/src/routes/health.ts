import { Router, Request, Response } from 'express';
import { checkDatabaseHealth } from '../database';
import { logger } from '../utils/logger';
import { HealthCheckResponse } from '@hyperv-platform/shared';
import { serverConfig } from '../config';

const router = Router();

// Health check básico
router.get('/', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    
    // Verificar banco de dados
    const dbHealth = await checkDatabaseHealth();
    
    // Verificar Redis (se configurado)
    let redisHealth = { status: 'up', responseTime: 0 };
    // TODO: Implementar verificação do Redis
    
    // Verificar Hyper-V Agent (se configurado)
    let hypervAgentHealth = { status: 'unknown', responseTime: 0 };
    // TODO: Implementar verificação do Hyper-V Agent
    
    const totalResponseTime = Date.now() - startTime;
    
    // Determinar status geral
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (dbHealth.status === 'down') {
      overallStatus = 'unhealthy';
    } else if (redisHealth.status === 'down' || hypervAgentHealth.status === 'down') {
      overallStatus = 'degraded';
    }
    
    // Obter métricas do sistema
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    const healthResponse: HealthCheckResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      services: {
        database: {
          status: dbHealth.status as 'up' | 'down',
          responseTime: dbHealth.responseTime,
          error: dbHealth.error
        },
        redis: {
          status: redisHealth.status as 'up' | 'down',
          responseTime: redisHealth.responseTime
        },
        hypervAgent: {
          status: hypervAgentHealth.status as 'up' | 'down',
          responseTime: hypervAgentHealth.responseTime
        }
      },
      metrics: {
        activeConnections: 0, // TODO: Implementar contagem de conexões ativas
        memoryUsage: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100, // MB
        cpuUsage: Math.round((cpuUsage.user + cpuUsage.system) / 1000) // ms
      }
    };
    
    // Log do health check
    logger.debug('Health check performed', {
      service: 'health',
      status: overallStatus,
      responseTime: totalResponseTime,
      dbResponseTime: dbHealth.responseTime
    });
    
    // Retornar status HTTP apropriado
    const statusCode = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json(healthResponse);
    
  } catch (error) {
    logger.error('Health check failed', {
      service: 'health',
      error: (error as Error).message
    });
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      message: (error as Error).message
    });
  }
});

// Readiness probe (para Kubernetes)
router.get('/ready', async (req: Request, res: Response) => {
  try {
    // Verificar se a aplicação está pronta para receber tráfego
    const dbHealth = await checkDatabaseHealth();
    
    if (dbHealth.status === 'up') {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        message: 'Application is ready to serve traffic'
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        message: 'Database is not available'
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: (error as Error).message
    });
  }
});

// Liveness probe (para Kubernetes)
router.get('/live', (req: Request, res: Response) => {
  // Verificação simples se o processo está rodando
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// Métricas detalhadas (para monitoramento)
router.get('/metrics', (req: Request, res: Response) => {
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  res.json({
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      rss: memoryUsage.rss,
      heapTotal: memoryUsage.heapTotal,
      heapUsed: memoryUsage.heapUsed,
      external: memoryUsage.external,
      arrayBuffers: memoryUsage.arrayBuffers
    },
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system
    },
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      nodeEnv: serverConfig.nodeEnv
    },
    config: {
      port: serverConfig.port,
      maintenanceMode: serverConfig.maintenanceMode
    }
  });
});

export default router;