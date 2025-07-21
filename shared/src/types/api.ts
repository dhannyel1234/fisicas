import { User, VirtualMachine, QueueItem, AdminStats, VMStatus, QueueStatus } from './index';

// =============================================================================
// AUTH API TYPES
// =============================================================================

export interface LoginRequest {
  code: string; // Discord OAuth2 code
  state?: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  expiresAt: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  token: string;
}

// =============================================================================
// USER API TYPES
// =============================================================================

export interface UserProfileResponse {
  user: User;
  stats: {
    totalVMsCreated: number;
    totalTimeUsed: number; // in minutes
    currentVM?: VirtualMachine;
    queuePosition?: number;
  };
}

export interface UpdateUserRequest {
  email?: string;
  preferences?: {
    theme: 'light' | 'dark';
    notifications: boolean;
    autoConnect: boolean;
  };
}

// =============================================================================
// VM API TYPES
// =============================================================================

export interface CreateVMRequest {
  cpuCores?: number;
  ramMB?: number;
  diskSizeGB?: number;
}

export interface CreateVMResponse {
  vm?: VirtualMachine;
  queueItem?: QueueItem;
  message: string;
}

export interface VMListResponse {
  vms: VirtualMachine[];
  active?: VirtualMachine;
}

export interface VMDetailsResponse {
  vm: VirtualMachine;
  access?: {
    ipAddress: string;
    rdpPort: number;
    vncPort?: number;
    rdpFile?: string; // Base64 encoded RDP file
  };
  logs?: Array<{
    timestamp: string;
    level: 'info' | 'warn' | 'error';
    message: string;
  }>;
}

export interface VMActionRequest {
  action: 'start' | 'stop' | 'restart' | 'delete' | 'format' | 'extend';
  parameters?: {
    extendMinutes?: number;
  };
}

export interface VMActionResponse {
  success: boolean;
  message: string;
  vm?: VirtualMachine;
}

// =============================================================================
// QUEUE API TYPES
// =============================================================================

export interface QueueStatusResponse {
  inQueue: boolean;
  queueItem?: QueueItem;
  position?: number;
  estimatedWaitTime?: number;
  queueLength: number;
}

export interface JoinQueueRequest {
  vmConfig?: CreateVMRequest;
}

export interface JoinQueueResponse {
  queueItem: QueueItem;
  position: number;
  estimatedWaitTime: number;
}

export interface QueueHistoryResponse {
  items: Array<QueueItem & {
    user: Pick<User, 'id' | 'username'>;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// =============================================================================
// ADMIN API TYPES
// =============================================================================

export interface AdminDashboardResponse {
  stats: AdminStats;
  recentActivity: Array<{
    id: string;
    type: 'vm_created' | 'vm_stopped' | 'user_joined' | 'queue_processed';
    message: string;
    timestamp: string;
    userId?: string;
    username?: string;
  }>;
  alerts: Array<{
    id: string;
    severity: 'info' | 'warning' | 'error';
    message: string;
    timestamp: string;
    resolved: boolean;
  }>;
}

export interface AdminVMListResponse {
  vms: Array<VirtualMachine & {
    user: Pick<User, 'id' | 'username' | 'avatar'>;
    hypervInfo?: {
      cpuUsage: number;
      memoryUsage: number;
      diskUsage: number;
      networkIO: number;
    };
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminUserListResponse {
  users: Array<User & {
    stats: {
      totalVMs: number;
      totalTimeUsed: number;
      lastActive: string;
      currentStatus: 'offline' | 'online' | 'in_vm' | 'in_queue';
    };
    currentVM?: Pick<VirtualMachine, 'id' | 'name' | 'status'>;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminQueueListResponse {
  queue: Array<QueueItem & {
    user: Pick<User, 'id' | 'username' | 'avatar'>;
  }>;
  processing: Array<QueueItem & {
    user: Pick<User, 'id' | 'username' | 'avatar'>;
    progress: {
      step: string;
      percentage: number;
      estimatedTimeRemaining: number;
    };
  }>;
}

export interface AdminVMControlRequest {
  action: 'force_stop' | 'force_start' | 'force_delete' | 'extend_time' | 'migrate';
  parameters?: {
    extendMinutes?: number;
    targetHost?: string;
    reason?: string;
  };
}

export interface AdminUserActionRequest {
  action: 'ban' | 'unban' | 'make_admin' | 'remove_admin' | 'reset_limits';
  reason?: string;
  duration?: number; // in hours for temporary bans
}

export interface AdminSystemActionRequest {
  action: 'clear_queue' | 'restart_service' | 'maintenance_mode' | 'backup_database';
  parameters?: {
    enabled?: boolean;
    message?: string;
  };
}

// =============================================================================
// METRICS API TYPES
// =============================================================================

export interface MetricsRequest {
  timeRange: '1h' | '6h' | '24h' | '7d' | '30d';
  metrics: Array<'vm_usage' | 'queue_length' | 'user_activity' | 'system_resources'>;
  granularity?: 'minute' | 'hour' | 'day';
}

export interface MetricsResponse {
  timeRange: string;
  granularity: string;
  data: {
    vm_usage?: Array<{
      timestamp: string;
      active_vms: number;
      creating_vms: number;
      total_cpu_usage: number;
      total_memory_usage: number;
    }>;
    queue_length?: Array<{
      timestamp: string;
      queue_length: number;
      average_wait_time: number;
      processed_items: number;
    }>;
    user_activity?: Array<{
      timestamp: string;
      active_users: number;
      new_users: number;
      sessions_started: number;
    }>;
    system_resources?: Array<{
      timestamp: string;
      cpu_usage: number;
      memory_usage: number;
      disk_usage: number;
      network_io: number;
    }>;
  };
}

// =============================================================================
// LOGS API TYPES
// =============================================================================

export interface LogsRequest {
  level?: 'error' | 'warn' | 'info' | 'debug';
  service?: 'api' | 'vm_manager' | 'queue' | 'hyperv_agent';
  userId?: string;
  vmId?: string;
  startTime?: string;
  endTime?: string;
  limit?: number;
  offset?: number;
  search?: string;
}

export interface LogsResponse {
  logs: Array<{
    id: string;
    timestamp: string;
    level: 'error' | 'warn' | 'info' | 'debug';
    service: string;
    message: string;
    metadata?: Record<string, any>;
    userId?: string;
    vmId?: string;
    ipAddress?: string;
    userAgent?: string;
  }>;
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}

// =============================================================================
// WEBHOOK API TYPES
// =============================================================================

export interface WebhookEvent {
  id: string;
  type: 'vm.created' | 'vm.started' | 'vm.stopped' | 'vm.deleted' | 'queue.joined' | 'queue.processed' | 'user.registered';
  timestamp: string;
  data: {
    userId?: string;
    vmId?: string;
    queueItemId?: string;
    metadata?: Record<string, any>;
  };
}

export interface WebhookSubscription {
  id: string;
  url: string;
  events: string[];
  secret?: string;
  enabled: boolean;
  createdAt: string;
  lastTriggered?: string;
  failureCount: number;
}

// =============================================================================
// SEARCH API TYPES
// =============================================================================

export interface SearchRequest {
  query: string;
  filters?: {
    type?: Array<'user' | 'vm' | 'queue_item' | 'log'>;
    dateRange?: {
      start: string;
      end: string;
    };
    status?: VMStatus[] | QueueStatus[];
    userId?: string;
  };
  pagination?: {
    page: number;
    limit: number;
  };
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
}

export interface SearchResponse {
  results: {
    users?: Array<User & { relevance: number }>;
    vms?: Array<VirtualMachine & { relevance: number; user: Pick<User, 'username'> }>;
    queueItems?: Array<QueueItem & { relevance: number; user: Pick<User, 'username'> }>;
    logs?: Array<{
      id: string;
      timestamp: string;
      message: string;
      relevance: number;
    }>;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  queryTime: number;
}

// =============================================================================
// HEALTH CHECK API TYPES
// =============================================================================

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    database: {
      status: 'up' | 'down';
      responseTime?: number;
      error?: string;
    };
    redis: {
      status: 'up' | 'down';
      responseTime?: number;
      error?: string;
    };
    hypervAgent: {
      status: 'up' | 'down';
      responseTime?: number;
      error?: string;
    };
  };
  metrics: {
    activeConnections: number;
    memoryUsage: number;
    cpuUsage: number;
  };
}