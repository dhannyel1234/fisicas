import { Request, Response, NextFunction } from 'express';
import { serverConfig } from '../config';
import { HTTP_STATUS } from '@hyperv-platform/shared';

export const maintenanceMode = (req: Request, res: Response, next: NextFunction): void => {
  // Se o modo de manutenção não estiver ativo, continuar normalmente
  if (!serverConfig.maintenanceMode) {
    return next();
  }

  // Permitir health checks mesmo em manutenção
  if (req.path.startsWith('/health')) {
    return next();
  }

  // Permitir acesso de administradores
  const user = (req as any).user;
  if (user && user.isAdmin) {
    return next();
  }

  // Retornar resposta de manutenção
  res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
    success: false,
    error: 'Service Unavailable',
    message: serverConfig.maintenanceMessage,
    maintenanceMode: true,
    timestamp: new Date().toISOString(),
    retryAfter: '30 minutes' // Sugestão de quando tentar novamente
  });
};