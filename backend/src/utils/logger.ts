import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { serverConfig } from '../config';
import path from 'path';
import fs from 'fs';

// Criar diretório de logs se não existir
const logDir = path.resolve(serverConfig.logDir);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Formato personalizado para logs
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Formato para console (desenvolvimento)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    const serviceStr = service ? `[${service}]` : '';
    return `${timestamp} ${level} ${serviceStr} ${message} ${metaStr}`;
  })
);

// Configuração dos transportes
const transports: winston.transport[] = [];

// Console transport (sempre ativo em desenvolvimento)
if (serverConfig.nodeEnv === 'development') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: serverConfig.logLevel
    })
  );
}

// File transports (produção e desenvolvimento)
if (serverConfig.nodeEnv === 'production' || process.env.ENABLE_FILE_LOGS === 'true') {
  // Logs combinados
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDir, 'hyperv-platform-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: logFormat,
      level: 'info'
    })
  );

  // Logs de erro separados
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      format: logFormat,
      level: 'error'
    })
  );

  // Logs de auditoria
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDir, 'audit-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '90d',
      format: logFormat,
      level: 'info',
      handleExceptions: false
    })
  );
}

// Criar logger principal
export const logger = winston.createLogger({
  level: serverConfig.logLevel,
  format: logFormat,
  transports,
  exitOnError: false,
  handleExceptions: true,
  handleRejections: true
});

// Logger específico para auditoria
export const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new DailyRotateFile({
      filename: path.join(logDir, 'audit-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '90d'
    })
  ]
});

// Logger específico para métricas
export const metricsLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new DailyRotateFile({
      filename: path.join(logDir, 'metrics-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '50m',
      maxFiles: '30d'
    })
  ]
});

// Função para log de request/response HTTP
export const logHttpRequest = (req: any, res: any, responseTime: number) => {
  const logData = {
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    userId: req.user?.id,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    contentLength: res.get('Content-Length') || 0,
    timestamp: new Date().toISOString()
  };

  if (res.statusCode >= 400) {
    logger.warn('HTTP Request Error', logData);
  } else {
    logger.info('HTTP Request', logData);
  }
};

// Função para log de auditoria
export const logAudit = (action: string, resource: string, details: any = {}, userId?: string, req?: any) => {
  const auditData = {
    action,
    resource,
    details,
    userId,
    ip: req?.ip || req?.connection?.remoteAddress,
    userAgent: req?.get('User-Agent'),
    timestamp: new Date().toISOString()
  };

  auditLogger.info('Audit Log', auditData);
  logger.info(`Audit: ${action} on ${resource}`, auditData);
};

// Função para log de VM operations
export const logVMOperation = (operation: string, vmId: string, userId: string, details: any = {}) => {
  const logData = {
    service: 'vm-manager',
    operation,
    vmId,
    userId,
    details,
    timestamp: new Date().toISOString()
  };

  logger.info(`VM Operation: ${operation}`, logData);
  auditLogger.info('VM Operation', logData);
};

// Função para log de queue operations
export const logQueueOperation = (operation: string, userId: string, queuePosition?: number, details: any = {}) => {
  const logData = {
    service: 'queue-manager',
    operation,
    userId,
    queuePosition,
    details,
    timestamp: new Date().toISOString()
  };

  logger.info(`Queue Operation: ${operation}`, logData);
};

// Função para log de Hyper-V agent operations
export const logHyperVOperation = (operation: string, vmName: string, result: any, error?: any) => {
  const logData = {
    service: 'hyperv-agent',
    operation,
    vmName,
    result,
    error,
    timestamp: new Date().toISOString()
  };

  if (error) {
    logger.error(`Hyper-V Operation Failed: ${operation}`, logData);
  } else {
    logger.info(`Hyper-V Operation: ${operation}`, logData);
  }
};

// Função para log de métricas
export const logMetrics = (metrics: any) => {
  metricsLogger.info('System Metrics', {
    ...metrics,
    timestamp: new Date().toISOString()
  });
};

// Função para log de errors com contexto
export const logError = (error: Error, context: string, additionalData: any = {}) => {
  const errorData = {
    message: error.message,
    stack: error.stack,
    context,
    ...additionalData,
    timestamp: new Date().toISOString()
  };

  logger.error(`Error in ${context}`, errorData);
};

// Função para log de performance
export const logPerformance = (operation: string, duration: number, details: any = {}) => {
  const perfData = {
    service: 'performance',
    operation,
    duration: `${duration}ms`,
    details,
    timestamp: new Date().toISOString()
  };

  if (duration > 5000) { // Log slow operations (>5s)
    logger.warn(`Slow Operation: ${operation}`, perfData);
  } else {
    logger.debug(`Performance: ${operation}`, perfData);
  }
};

// Middleware de logging para Express
export const requestLoggerMiddleware = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logHttpRequest(req, res, duration);
  });
  
  next();
};

// Stream para Morgan (HTTP request logging)
export const morganStream = {
  write: (message: string) => {
    logger.info(message.trim());
  }
};

// Função para limpar logs antigos (se necessário)
export const cleanupOldLogs = () => {
  // Esta função é chamada automaticamente pelo DailyRotateFile
  // baseado nas configurações maxFiles
  logger.info('Log cleanup completed');
};

// Log inicial do sistema
logger.info('Logger initialized', {
  service: 'logger',
  logLevel: serverConfig.logLevel,
  logDir,
  nodeEnv: serverConfig.nodeEnv,
  timestamp: new Date().toISOString()
});

export default logger;