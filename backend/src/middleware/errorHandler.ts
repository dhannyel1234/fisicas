import { Request, Response, NextFunction } from 'express';
import { logger, logError } from '../utils/logger';
import { ErrorCode, HTTP_STATUS } from '@hyperv-platform/shared';
import { serverConfig } from '../config';

// Interface para erros customizados
export interface AppError extends Error {
  statusCode?: number;
  code?: ErrorCode;
  details?: any;
  isOperational?: boolean;
}

// Criar erro customizado
export const createError = (
  message: string,
  statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  code?: ErrorCode,
  details?: any
): AppError => {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.code = code;
  error.details = details;
  error.isOperational = true;
  return error;
};

// Middleware de tratamento de erros
export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log do erro
  logError(error, 'error-handler', {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id,
    body: req.body,
    params: req.params,
    query: req.query
  });

  // Determinar status code
  let statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = error.message || 'Internal Server Error';
  let code = error.code || ErrorCode.INTERNAL_ERROR;

  // Tratar erros específicos
  if (error.name === 'ValidationError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    code = ErrorCode.VALIDATION_ERROR;
    message = 'Validation failed';
  }

  if (error.name === 'UnauthorizedError' || error.name === 'JsonWebTokenError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    code = ErrorCode.UNAUTHORIZED;
    message = 'Authentication failed';
  }

  if (error.name === 'CastError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    code = ErrorCode.VALIDATION_ERROR;
    message = 'Invalid ID format';
  }

  if (error.name === 'MongoError' && (error as any).code === 11000) {
    statusCode = HTTP_STATUS.CONFLICT;
    message = 'Duplicate field value';
  }

  // Preparar resposta de erro
  const errorResponse: any = {
    success: false,
    error: message,
    code,
    timestamp: new Date().toISOString()
  };

  // Incluir detalhes em desenvolvimento
  if (serverConfig.nodeEnv === 'development') {
    errorResponse.details = error.details;
    errorResponse.stack = error.stack;
  }

  // Incluir trace ID para debugging
  errorResponse.traceId = req.headers['x-trace-id'] || 'unknown';

  // Enviar resposta
  res.status(statusCode).json(errorResponse);
};

// Middleware para capturar erros async
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Middleware para 404
export const notFoundHandler = (req: Request, res: Response) => {
  const error = createError(
    `Route ${req.originalUrl} not found`,
    HTTP_STATUS.NOT_FOUND
  );
  
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    error: error.message,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  });
};

// Função para validar se um erro é operacional
export const isOperationalError = (error: AppError): boolean => {
  return error.isOperational === true;
};

// Wrapper para erros de validação
export const validationError = (message: string, details?: any): AppError => {
  return createError(
    message,
    HTTP_STATUS.BAD_REQUEST,
    ErrorCode.VALIDATION_ERROR,
    details
  );
};

// Wrapper para erros de autorização
export const unauthorizedError = (message: string = 'Unauthorized'): AppError => {
  return createError(
    message,
    HTTP_STATUS.UNAUTHORIZED,
    ErrorCode.UNAUTHORIZED
  );
};

// Wrapper para erros de acesso negado
export const forbiddenError = (message: string = 'Forbidden'): AppError => {
  return createError(
    message,
    HTTP_STATUS.FORBIDDEN,
    ErrorCode.FORBIDDEN
  );
};

// Wrapper para erros de recurso não encontrado
export const notFoundError = (resource: string): AppError => {
  return createError(
    `${resource} not found`,
    HTTP_STATUS.NOT_FOUND
  );
};

// Wrapper para erros de conflito
export const conflictError = (message: string): AppError => {
  return createError(
    message,
    HTTP_STATUS.CONFLICT
  );
};

// Wrapper para erros de limite excedido
export const rateLimitError = (message: string = 'Rate limit exceeded'): AppError => {
  return createError(
    message,
    HTTP_STATUS.TOO_MANY_REQUESTS,
    ErrorCode.RATE_LIMIT_EXCEEDED
  );
};

// Wrapper para erros de VM
export const vmError = (message: string, code: ErrorCode): AppError => {
  return createError(
    message,
    HTTP_STATUS.UNPROCESSABLE_ENTITY,
    code
  );
};

// Wrapper para erros de fila
export const queueError = (message: string, code: ErrorCode): AppError => {
  return createError(
    message,
    HTTP_STATUS.UNPROCESSABLE_ENTITY,
    code
  );
};

// Wrapper para erros de Hyper-V
export const hypervError = (message: string, details?: any): AppError => {
  return createError(
    message,
    HTTP_STATUS.BAD_GATEWAY,
    ErrorCode.HYPERV_CONNECTION_FAILED,
    details
  );
};

export default errorHandler;