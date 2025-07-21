import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

// Configurações e utilitários
import { serverConfig, validateConfig, logConfig } from './config';
import { logger, requestLoggerMiddleware } from './utils/logger';
import { connectDatabase } from './database';

// Middlewares
import { errorHandler } from './middleware/errorHandler';
import { maintenanceMode } from './middleware/maintenanceMode';
import { setupAuth } from './middleware/auth';

// Routes
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import vmRoutes from './routes/vm';
import queueRoutes from './routes/queue';
import adminRoutes from './routes/admin';
import healthRoutes from './routes/health';

// Socket.IO
import { setupSocketIO } from './socket';

// Services
import { setupQueueProcessor } from './services/queueService';
import { setupScheduledTasks } from './services/scheduledTasks';

class Application {
  public app: express.Application;
  public server: any;
  public io: SocketIOServer;
  private port: number;

  constructor() {
    this.app = express();
    this.port = serverConfig.port;
    
    this.setupServer();
  }

  private setupServer(): void {
    // Criar servidor HTTP
    this.server = createServer(this.app);
    
    // Configurar Socket.IO
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: serverConfig.frontendUrl,
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });
  }

  private setupMiddlewares(): void {
    // Middleware de segurança
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "ws:", "wss:"]
        }
      },
      crossOriginEmbedderPolicy: false
    }));

    // CORS
    this.app.use(cors({
      origin: (origin, callback) => {
        // Permitir requests sem origin (mobile apps, etc.)
        if (!origin) return callback(null, true);
        
        // Permitir origens configuradas
        if (serverConfig.corsOrigins.includes(origin)) {
          return callback(null, true);
        }
        
        // Em desenvolvimento, permitir localhost
        if (serverConfig.nodeEnv === 'development' && origin.includes('localhost')) {
          return callback(null, true);
        }
        
        callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: serverConfig.rateLimitWindowMs,
      max: serverConfig.rateLimitMax,
      message: {
        error: 'Too many requests',
        message: 'Rate limit exceeded. Try again later.'
      },
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => {
        // Pular rate limiting para health checks
        return req.path.startsWith('/health');
      }
    });
    this.app.use(limiter);

    // Compressão
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use(requestLoggerMiddleware);

    // Trust proxy (para deploy atrás de load balancer)
    this.app.set('trust proxy', 1);

    // Middleware de manutenção
    this.app.use(maintenanceMode);
  }

  private setupRoutes(): void {
    // Health check (antes da autenticação)
    this.app.use('/health', healthRoutes);

    // Configurar autenticação
    setupAuth(this.app);

    // API Routes
    this.app.use('/auth', authRoutes);
    this.app.use('/user', userRoutes);
    this.app.use('/vm', vmRoutes);
    this.app.use('/queue', queueRoutes);
    this.app.use('/admin', adminRoutes);

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        message: 'Hyper-V Platform API',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        docs: '/docs',
        health: '/health'
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        message: `The endpoint ${req.method} ${req.originalUrl} does not exist`,
        timestamp: new Date().toISOString()
      });
    });

    // Error handler (deve ser o último middleware)
    this.app.use(errorHandler);
  }

  private async setupServices(): Promise<void> {
    try {
      // Configurar Socket.IO
      setupSocketIO(this.io);

      // Configurar processador de fila
      await setupQueueProcessor(this.io);

      // Configurar tarefas agendadas
      setupScheduledTasks();

      logger.info('All services initialized successfully', {
        service: 'application'
      });
    } catch (error) {
      logger.error('Failed to setup services', {
        service: 'application',
        error: (error as Error).message
      });
      throw error;
    }
  }

  public async initialize(): Promise<void> {
    try {
      // Validar configuração
      validateConfig();
      logConfig();

      // Conectar ao banco de dados
      await connectDatabase();

      // Configurar middlewares
      this.setupMiddlewares();

      // Configurar rotas
      this.setupRoutes();

      // Configurar serviços
      await this.setupServices();

      logger.info('Application initialized successfully', {
        service: 'application',
        port: this.port,
        nodeEnv: serverConfig.nodeEnv
      });
    } catch (error) {
      logger.error('Failed to initialize application', {
        service: 'application',
        error: (error as Error).message,
        stack: (error as Error).stack
      });
      throw error;
    }
  }

  public async start(): Promise<void> {
    try {
      await this.initialize();

      this.server.listen(this.port, () => {
        logger.info(`🚀 Server started successfully`, {
          service: 'application',
          port: this.port,
          url: `http://localhost:${this.port}`,
          nodeEnv: serverConfig.nodeEnv,
          timestamp: new Date().toISOString()
        });

        // Log informações importantes
        console.log('\n🖥️  Hyper-V Platform Backend');
        console.log('================================');
        console.log(`🌍 Server: http://localhost:${this.port}`);
        console.log(`🏥 Health: http://localhost:${this.port}/health`);
        console.log(`📡 Socket.IO: ws://localhost:${this.port}`);
        console.log(`🔧 Environment: ${serverConfig.nodeEnv}`);
        console.log(`📊 Frontend: ${serverConfig.frontendUrl}`);
        console.log('================================\n');
      });
    } catch (error) {
      logger.error('Failed to start server', {
        service: 'application',
        error: (error as Error).message
      });
      process.exit(1);
    }
  }

  public async stop(): Promise<void> {
    try {
      logger.info('Shutting down server...', { service: 'application' });

      // Fechar servidor HTTP
      if (this.server) {
        await new Promise<void>((resolve) => {
          this.server.close(() => {
            logger.info('HTTP server closed', { service: 'application' });
            resolve();
          });
        });
      }

      // Fechar Socket.IO
      if (this.io) {
        this.io.close();
        logger.info('Socket.IO server closed', { service: 'application' });
      }

      // Desconectar do banco
      const { disconnectDatabase } = await import('./database');
      await disconnectDatabase();

      logger.info('Server shutdown completed', { service: 'application' });
    } catch (error) {
      logger.error('Error during shutdown', {
        service: 'application',
        error: (error as Error).message
      });
    }
  }
}

// Criar instância da aplicação
const app = new Application();

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...', { service: 'application' });
  await app.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...', { service: 'application' });
  await app.stop();
  process.exit(0);
});

// Tratar erros não capturados
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    service: 'application',
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    service: 'application',
    reason,
    promise
  });
  process.exit(1);
});

// Iniciar aplicação se este arquivo for executado diretamente
if (require.main === module) {
  app.start().catch((error) => {
    logger.error('Failed to start application', {
      service: 'application',
      error: error.message
    });
    process.exit(1);
  });
}

export default app;