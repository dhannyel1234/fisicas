// =============================================================================
// TIPOS DE USUÁRIO E AUTENTICAÇÃO
// =============================================================================

export interface User {
  id: string;
  discordId: string;
  username: string;
  discriminator: string;
  email?: string;
  avatar?: string;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthSession {
  userId: string;
  token: string;
  expiresAt: Date;
}

// =============================================================================
// TIPOS DE MÁQUINA VIRTUAL
// =============================================================================

export enum VMStatus {
  CREATING = 'creating',
  STARTING = 'starting',
  RUNNING = 'running',
  STOPPING = 'stopping',
  STOPPED = 'stopped',
  FORMATTING = 'formatting',
  ERROR = 'error',
  DELETED = 'deleted'
}

export interface VirtualMachine {
  id: string;
  name: string;
  userId: string;
  hypervId?: string;
  status: VMStatus;
  ipAddress?: string;
  rdpPort?: number;
  vncPort?: number;
  cpuCores: number;
  ramMB: number;
  diskSizeGB: number;
  createdAt: Date;
  startedAt?: Date;
  stoppedAt?: Date;
  lastAccessAt?: Date;
  expiresAt?: Date;
}

export interface VMCreateRequest {
  userId: string;
  cpuCores?: number;
  ramMB?: number;
  diskSizeGB?: number;
}

export interface VMActionRequest {
  vmId: string;
  action: 'start' | 'stop' | 'restart' | 'delete' | 'format';
}

// =============================================================================
// TIPOS DE FILA
// =============================================================================

export enum QueueStatus {
  WAITING = 'waiting',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface QueueItem {
  id: string;
  userId: string;
  position: number;
  status: QueueStatus;
  vmRequest: VMCreateRequest;
  estimatedWaitTime?: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
}

// =============================================================================
// TIPOS DE EVENTS (SOCKET.IO)
// =============================================================================

export interface SocketEvents {
  // Client -> Server
  'vm:request': (data: VMCreateRequest) => void;
  'vm:action': (data: VMActionRequest) => void;
  'queue:join': () => void;
  'queue:leave': () => void;
  'admin:getStats': () => void;

  // Server -> Client
  'vm:status': (data: { vmId: string; status: VMStatus; details?: any }) => void;
  'vm:created': (data: VirtualMachine) => void;
  'vm:progress': (data: { vmId: string; step: string; progress: number; message: string }) => void;
  'queue:updated': (data: { position: number; estimatedWait: number; queueLength: number }) => void;
  'queue:processing': (data: { vmId: string }) => void;
  'admin:stats': (data: AdminStats) => void;
  'error': (data: { message: string; code?: string }) => void;
}

// =============================================================================
// TIPOS DO HYPER-V AGENT
// =============================================================================

export interface HyperVConfig {
  host: string;
  username: string;
  password: string;
  baseImagePath: string;
  vmStoragePath: string;
  switchName: string;
  defaultCpuCores: number;
  defaultRamMB: number;
  ipRangeStart: string;
  ipRangeEnd: string;
  subnetMask: string;
  gateway: string;
  dnsServers: string[];
}

export interface VMCreationProgress {
  vmId: string;
  step: 'creating' | 'copying_disk' | 'configuring' | 'starting' | 'networking' | 'completed';
  progress: number; // 0-100
  message: string;
  error?: string;
}

export interface HyperVVMInfo {
  id: string;
  name: string;
  state: 'Off' | 'Running' | 'Saved' | 'Paused' | 'Starting' | 'Stopping';
  cpuUsage: number;
  memoryAssigned: number;
  memoryDemand: number;
  ipAddresses: string[];
  uptime: string;
}

// =============================================================================
// TIPOS DE ADMINISTRAÇÃO
// =============================================================================

export interface AdminStats {
  totalUsers: number;
  activeVMs: number;
  queueLength: number;
  totalVMsCreated: number;
  averageWaitTime: number;
  systemResources: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
  };
  vmsByStatus: Record<VMStatus, number>;
}

export interface AdminVMControl {
  vmId: string;
  action: 'force_stop' | 'force_start' | 'force_delete' | 'extend_time';
  parameters?: {
    extendMinutes?: number;
  };
}

// =============================================================================
// TIPOS DE API RESPONSE
// =============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// =============================================================================
// TIPOS DE CONFIGURAÇÃO
// =============================================================================

export interface AppConfig {
  discord: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
  database: {
    url: string;
  };
  redis: {
    url: string;
  };
  hyperv: HyperVConfig;
  limits: {
    maxVMsPerUser: number;
    maxVMSessionHours: number;
    maxQueueSize: number;
    vmCreationTimeoutMinutes: number;
  };
  features: {
    enableMetrics: boolean;
    enableLogs: boolean;
    enableEmails: boolean;
  };
}

// =============================================================================
// TIPOS DE LOG E AUDITORIA
// =============================================================================

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// =============================================================================
// TIPOS DE ERRO
// =============================================================================

export enum ErrorCode {
  // Auth errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_TOKEN = 'INVALID_TOKEN',
  
  // VM errors
  VM_NOT_FOUND = 'VM_NOT_FOUND',
  VM_CREATION_FAILED = 'VM_CREATION_FAILED',
  VM_LIMIT_EXCEEDED = 'VM_LIMIT_EXCEEDED',
  VM_ALREADY_RUNNING = 'VM_ALREADY_RUNNING',
  
  // Queue errors
  QUEUE_FULL = 'QUEUE_FULL',
  ALREADY_IN_QUEUE = 'ALREADY_IN_QUEUE',
  
  // Hyper-V errors
  HYPERV_CONNECTION_FAILED = 'HYPERV_CONNECTION_FAILED',
  HYPERV_COMMAND_FAILED = 'HYPERV_COMMAND_FAILED',
  
  // General errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
}

export interface AppError {
  code: ErrorCode;
  message: string;
  details?: Record<string, any>;
  stack?: string;
}

// =============================================================================
// EXPORTAÇÕES
// =============================================================================

export * from './socket';
export * from './api';