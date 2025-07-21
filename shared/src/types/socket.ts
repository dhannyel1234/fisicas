import { VMStatus, VMCreateRequest, VMActionRequest, VirtualMachine, AdminStats } from './index';

// =============================================================================
// SOCKET.IO EVENT TYPES
// =============================================================================

export interface ServerToClientEvents {
  // VM Events
  'vm:status': (data: { vmId: string; status: VMStatus; details?: any }) => void;
  'vm:created': (data: VirtualMachine) => void;
  'vm:progress': (data: { vmId: string; step: string; progress: number; message: string }) => void;
  'vm:access': (data: { vmId: string; ipAddress: string; rdpPort: number; vncPort?: number }) => void;
  
  // Queue Events
  'queue:updated': (data: { position: number; estimatedWait: number; queueLength: number }) => void;
  'queue:processing': (data: { vmId: string }) => void;
  'queue:removed': (data: { reason: string }) => void;
  
  // Admin Events
  'admin:stats': (data: AdminStats) => void;
  'admin:vm-update': (data: { vmId: string; status: VMStatus; user?: string }) => void;
  'admin:queue-update': (data: { queueLength: number; processingItems: number }) => void;
  
  // Error Events
  'error': (data: { message: string; code?: string; details?: any }) => void;
  'warning': (data: { message: string; details?: any }) => void;
  'info': (data: { message: string; details?: any }) => void;
  
  // Connection Events
  'connected': (data: { userId: string; sessionId: string }) => void;
  'disconnected': (data: { reason: string }) => void;
}

export interface ClientToServerEvents {
  // Authentication
  'auth': (data: { token: string }) => void;
  
  // VM Actions
  'vm:request': (data: VMCreateRequest) => void;
  'vm:action': (data: VMActionRequest) => void;
  'vm:connect': (data: { vmId: string }) => void;
  'vm:disconnect': (data: { vmId: string }) => void;
  
  // Queue Actions
  'queue:join': () => void;
  'queue:leave': () => void;
  'queue:status': () => void;
  
  // Admin Actions
  'admin:getStats': () => void;
  'admin:getVMs': () => void;
  'admin:getQueue': () => void;
  'admin:vmControl': (data: { vmId: string; action: string; parameters?: any }) => void;
  'admin:clearQueue': () => void;
  
  // Ping/Pong for connection health
  'ping': () => void;
}

export interface InterServerEvents {
  // For scaling across multiple server instances
  'vm:status-broadcast': (data: { vmId: string; status: VMStatus; serverId: string }) => void;
  'queue:update-broadcast': (data: { userId: string; position: number; serverId: string }) => void;
  'admin:action-broadcast': (data: { action: string; data: any; serverId: string }) => void;
}

export interface SocketData {
  userId: string;
  username: string;
  isAdmin: boolean;
  sessionId: string;
  connectedAt: Date;
  lastActivity: Date;
  currentVMId?: string;
  isInQueue?: boolean;
}

// =============================================================================
// SOCKET ROOM TYPES
// =============================================================================

export enum SocketRoom {
  // User-specific rooms
  USER_PREFIX = 'user:',
  
  // VM-specific rooms
  VM_PREFIX = 'vm:',
  
  // Admin rooms
  ADMIN = 'admin',
  ADMIN_STATS = 'admin:stats',
  ADMIN_VMS = 'admin:vms',
  ADMIN_QUEUE = 'admin:queue',
  
  // Queue room
  QUEUE = 'queue',
  
  // General notifications
  NOTIFICATIONS = 'notifications'
}

// =============================================================================
// HELPER FUNCTIONS FOR ROOM NAMES
// =============================================================================

export const createUserRoom = (userId: string) => `${SocketRoom.USER_PREFIX}${userId}`;
export const createVMRoom = (vmId: string) => `${SocketRoom.VM_PREFIX}${vmId}`;

// =============================================================================
// SOCKET MIDDLEWARE TYPES
// =============================================================================

export interface SocketAuthData {
  user: {
    id: string;
    username: string;
    isAdmin: boolean;
  };
  token: string;
}

export interface SocketError {
  message: string;
  code?: string;
  status?: number;
}

// =============================================================================
// RATE LIMITING TYPES
// =============================================================================

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface UserRateLimit {
  userId: string;
  requests: Array<{
    timestamp: number;
    event: string;
    success: boolean;
  }>;
}

// =============================================================================
// SOCKET ANALYTICS TYPES
// =============================================================================

export interface SocketMetrics {
  totalConnections: number;
  activeConnections: number;
  adminConnections: number;
  userConnections: number;
  eventsPerMinute: number;
  averageResponseTime: number;
  errorRate: number;
}

export interface SocketEventLog {
  timestamp: Date;
  userId?: string;
  event: string;
  data?: any;
  responseTime?: number;
  error?: string;
  socketId: string;
  userAgent?: string;
  ipAddress?: string;
}