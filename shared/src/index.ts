// =============================================================================
// SHARED TYPES PARA PLATAFORMA HYPER-V
// =============================================================================

// Export all types from types directory
export * from './types';
export * from './types/socket';
export * from './types/api';

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export const generateVMName = (userId: string, timestamp?: Date): string => {
  const date = timestamp || new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const timeStr = date.toTimeString().slice(0, 8).replace(/:/g, '');
  const userPrefix = userId.slice(0, 8);
  return `vm-${userPrefix}-${dateStr}-${timeStr}`;
};

export const generateUniqueId = (): string => {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
};

export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours < 24) {
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }
  
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
};

export const calculateEstimatedWaitTime = (position: number, averageProcessingTime: number): number => {
  // Estimate based on position in queue and average processing time
  return Math.ceil(position * averageProcessingTime);
};

export const isValidIPv4 = (ip: string): boolean => {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipv4Regex.test(ip);
};

export const isValidPort = (port: number): boolean => {
  return port >= 1 && port <= 65535;
};

export const sanitizeVMName = (name: string): string => {
  // Remove special characters and ensure valid Hyper-V VM name
  return name.replace(/[^a-zA-Z0-9-_]/g, '').substring(0, 100);
};

export const validateVMConfig = (config: {
  cpuCores?: number;
  ramMB?: number;
  diskSizeGB?: number;
}): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (config.cpuCores !== undefined) {
    if (config.cpuCores < 1 || config.cpuCores > 16) {
      errors.push('CPU cores must be between 1 and 16');
    }
  }
  
  if (config.ramMB !== undefined) {
    if (config.ramMB < 512 || config.ramMB > 32768) {
      errors.push('RAM must be between 512MB and 32GB');
    }
  }
  
  if (config.diskSizeGB !== undefined) {
    if (config.diskSizeGB < 10 || config.diskSizeGB > 1000) {
      errors.push('Disk size must be between 10GB and 1TB');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// =============================================================================
// CONSTANTS
// =============================================================================

export const VM_DEFAULTS = {
  CPU_CORES: 2,
  RAM_MB: 4096,
  DISK_SIZE_GB: 50,
  SESSION_TIMEOUT_HOURS: 4,
  MAX_IDLE_MINUTES: 30
} as const;

export const QUEUE_DEFAULTS = {
  MAX_SIZE: 50,
  AVERAGE_PROCESSING_TIME_MINUTES: 5,
  POSITION_UPDATE_INTERVAL_MS: 30000
} as const;

export const SOCKET_EVENTS = {
  // Connection
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  
  // Authentication
  AUTH: 'auth',
  AUTH_SUCCESS: 'auth:success',
  AUTH_ERROR: 'auth:error',
  
  // VM Events
  VM_REQUEST: 'vm:request',
  VM_STATUS: 'vm:status',
  VM_CREATED: 'vm:created',
  VM_PROGRESS: 'vm:progress',
  VM_ACCESS: 'vm:access',
  VM_ACTION: 'vm:action',
  
  // Queue Events
  QUEUE_JOIN: 'queue:join',
  QUEUE_LEAVE: 'queue:leave',
  QUEUE_UPDATED: 'queue:updated',
  QUEUE_PROCESSING: 'queue:processing',
  
  // Admin Events
  ADMIN_STATS: 'admin:stats',
  ADMIN_GET_STATS: 'admin:getStats',
  ADMIN_VM_CONTROL: 'admin:vmControl',
  
  // Error Events
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
} as const;

export const API_ENDPOINTS = {
  // Auth
  AUTH_LOGIN: '/auth/login',
  AUTH_LOGOUT: '/auth/logout',
  AUTH_REFRESH: '/auth/refresh',
  AUTH_DISCORD: '/auth/discord',
  AUTH_DISCORD_CALLBACK: '/auth/discord/callback',
  
  // User
  USER_PROFILE: '/user/profile',
  USER_UPDATE: '/user/update',
  USER_VMS: '/user/vms',
  
  // VM
  VM_CREATE: '/vm/create',
  VM_LIST: '/vm/list',
  VM_DETAILS: (id: string) => `/vm/${id}`,
  VM_ACTION: (id: string) => `/vm/${id}/action`,
  
  // Queue
  QUEUE_STATUS: '/queue/status',
  QUEUE_JOIN: '/queue/join',
  QUEUE_LEAVE: '/queue/leave',
  QUEUE_HISTORY: '/queue/history',
  
  // Admin
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_VMS: '/admin/vms',
  ADMIN_USERS: '/admin/users',
  ADMIN_QUEUE: '/admin/queue',
  ADMIN_METRICS: '/admin/metrics',
  ADMIN_LOGS: '/admin/logs',
  
  // Health
  HEALTH: '/health',
  HEALTH_READY: '/health/ready',
  HEALTH_LIVE: '/health/live'
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503
} as const;