import dotenv from 'dotenv';
import { AppConfig } from '@hyperv-platform/shared';

// Carregar variáveis de ambiente
dotenv.config();

export const config: AppConfig = {
  discord: {
    clientId: process.env.DISCORD_CLIENT_ID || '',
    clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
    redirectUri: process.env.DISCORD_REDIRECT_URI || 'http://localhost:3000/auth/discord/callback'
  },
  database: {
    url: process.env.DATABASE_URL || 'postgresql://hyperv_user:hyperv_password123@localhost:5432/hyperv_platform'
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  },
  hyperv: {
    host: process.env.HYPERV_HOST || 'localhost',
    username: process.env.HYPERV_USERNAME || 'Administrator',
    password: process.env.HYPERV_PASSWORD || '',
    baseImagePath: process.env.BASE_VM_IMAGE_PATH || 'C:\\VMs\\BaseImage\\base.vhdx',
    vmStoragePath: process.env.VM_STORAGE_PATH || 'C:\\VMs\\Instances\\',
    switchName: process.env.VM_SWITCH_NAME || 'Default Switch',
    defaultCpuCores: parseInt(process.env.VM_CPU_CORES || '2'),
    defaultRamMB: parseInt(process.env.VM_RAM_MB || '4096'),
    ipRangeStart: process.env.VM_IP_RANGE_START || '192.168.1.100',
    ipRangeEnd: process.env.VM_IP_RANGE_END || '192.168.1.200',
    subnetMask: process.env.VM_SUBNET_MASK || '255.255.255.0',
    gateway: process.env.VM_GATEWAY || '192.168.1.1',
    dnsServers: (process.env.VM_DNS_SERVERS || '8.8.8.8,8.8.4.4').split(',')
  },
  limits: {
    maxVMsPerUser: parseInt(process.env.MAX_VMS_PER_USER || '1'),
    maxVMSessionHours: parseInt(process.env.MAX_VM_SESSION_HOURS || '4'),
    maxQueueSize: parseInt(process.env.MAX_QUEUE_SIZE || '50'),
    vmCreationTimeoutMinutes: parseInt(process.env.VM_CREATION_TIMEOUT_MINUTES || '10')
  },
  features: {
    enableMetrics: process.env.ENABLE_METRICS === 'true',
    enableLogs: process.env.ENABLE_LOGS === 'true',
    enableEmails: process.env.SMTP_HOST !== undefined
  }
};

export const serverConfig = {
  port: parseInt(process.env.PORT || '5000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  backendUrl: process.env.BACKEND_URL || 'http://localhost:5000',
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'hyperv_jwt_secret_key_change_in_production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  
  // Session
  sessionSecret: process.env.SESSION_SECRET || 'hyperv_session_secret_change_in_production',
  
  // Rate limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  
  // Hyper-V Agent
  hypervAgentUrl: process.env.HYPERV_AGENT_URL || 'http://localhost:4000',
  hypervAgentTimeout: parseInt(process.env.HYPERV_AGENT_TIMEOUT || '30000'),
  
  // Email (opcional)
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD
  },
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  logDir: process.env.LOG_DIR || './logs',
  
  // File upload
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
  
  // CORS
  corsOrigins: (process.env.CORS_ORIGINS || config.database.url).split(','),
  
  // Health check
  healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000'), // 30 seconds
  
  // Maintenance mode
  maintenanceMode: process.env.MAINTENANCE_MODE === 'true',
  maintenanceMessage: process.env.MAINTENANCE_MESSAGE || 'Sistema em manutenção. Tente novamente em alguns minutos.'
};

// Validar configurações críticas
export const validateConfig = (): void => {
  const errors: string[] = [];
  
  if (!config.discord.clientId) {
    errors.push('DISCORD_CLIENT_ID é obrigatório');
  }
  
  if (!config.discord.clientSecret) {
    errors.push('DISCORD_CLIENT_SECRET é obrigatório');
  }
  
  if (!config.database.url) {
    errors.push('DATABASE_URL é obrigatório');
  }
  
  if (!serverConfig.jwtSecret || serverConfig.jwtSecret === 'hyperv_jwt_secret_key_change_in_production') {
    if (serverConfig.nodeEnv === 'production') {
      errors.push('JWT_SECRET deve ser definido em produção');
    }
  }
  
  if (!config.hyperv.host) {
    errors.push('HYPERV_HOST é obrigatório');
  }
  
  if (!config.hyperv.password) {
    errors.push('HYPERV_PASSWORD é obrigatório');
  }
  
  if (errors.length > 0) {
    throw new Error(`Erro de configuração:\n${errors.join('\n')}`);
  }
};

// Configurações específicas por ambiente
export const isDevelopment = serverConfig.nodeEnv === 'development';
export const isProduction = serverConfig.nodeEnv === 'production';
export const isTesting = serverConfig.nodeEnv === 'test';

// URLs completas
export const getFullUrl = (path: string): string => {
  return `${serverConfig.backendUrl}${path}`;
};

export const getFrontendUrl = (path: string = ''): string => {
  return `${serverConfig.frontendUrl}${path}`;
};

// Configuração do Redis (com fallback para desenvolvimento)
export const getRedisConfig = () => {
  if (config.redis.url.startsWith('redis://')) {
    return config.redis.url;
  }
  
  // Para desenvolvimento local sem Redis
  return isDevelopment ? undefined : config.redis.url;
};

// Log da configuração (sem dados sensíveis)
export const logConfig = () => {
  console.log('🔧 Configuração carregada:');
  console.log(`   Environment: ${serverConfig.nodeEnv}`);
  console.log(`   Port: ${serverConfig.port}`);
  console.log(`   Frontend URL: ${serverConfig.frontendUrl}`);
  console.log(`   Backend URL: ${serverConfig.backendUrl}`);
  console.log(`   Database: ${config.database.url.split('@')[1] || 'configurado'}`);
  console.log(`   Redis: ${config.redis.url.split('@')[1] || 'configurado'}`);
  console.log(`   Hyper-V Host: ${config.hyperv.host}`);
  console.log(`   Max VMs per user: ${config.limits.maxVMsPerUser}`);
  console.log(`   Max queue size: ${config.limits.maxQueueSize}`);
  console.log(`   Features: ${JSON.stringify(config.features)}`);
  console.log(`   Maintenance mode: ${serverConfig.maintenanceMode}`);
};