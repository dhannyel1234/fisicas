import { Application, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as DiscordStrategy } from 'passport-discord';
import jwt from 'jsonwebtoken';
import { config, serverConfig } from '../config';
import { findUserByDiscordId } from '../database';
import { logger, logAudit } from '../utils/logger';
import { unauthorizedError, forbiddenError } from './errorHandler';
import { User } from '@hyperv-platform/shared';

// Configurar estratégia JWT
const jwtStrategy = new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: serverConfig.jwtSecret,
  issuer: 'hyperv-platform',
  audience: 'hyperv-platform-users'
}, async (payload, done) => {
  try {
    const user = await findUserByDiscordId(payload.discordId);
    
    if (!user) {
      return done(null, false);
    }

    // Verificar se o usuário não está banido
    if (user.isBanned) {
      const banExpired = user.banExpiresAt && new Date() > user.banExpiresAt;
      if (!banExpired) {
        return done(null, false);
      }
    }

    return done(null, user);
  } catch (error) {
    return done(error, false);
  }
});

// Configurar estratégia Discord OAuth2
const discordStrategy = new DiscordStrategy({
  clientID: config.discord.clientId,
  clientSecret: config.discord.clientSecret,
  callbackURL: config.discord.redirectUri,
  scope: ['identify', 'email']
}, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
  try {
    logger.info('Discord OAuth callback', {
      service: 'auth',
      discordId: profile.id,
      username: profile.username
    });

    return done(null, {
      discordId: profile.id,
      username: profile.username,
      discriminator: profile.discriminator,
      email: profile.email,
      avatar: profile.avatar
    });
  } catch (error) {
    logger.error('Discord OAuth error', {
      service: 'auth',
      error: (error as Error).message
    });
    return done(error, null);
  }
});

// Configurar Passport
export const setupAuth = (app: Application): void => {
  // Inicializar Passport
  app.use(passport.initialize());

  // Registrar estratégias
  passport.use('jwt', jwtStrategy);
  passport.use('discord', discordStrategy);

  // Serialização (não necessária para JWT, mas mantida para compatibilidade)
  passport.serializeUser((user: any, done) => {
    done(null, user.id || user.discordId);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await findUserByDiscordId(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  logger.info('Authentication middleware configured', { service: 'auth' });
};

// Middleware para autenticação JWT
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  passport.authenticate('jwt', { session: false }, (err: any, user: User, info: any) => {
    if (err) {
      logger.error('Authentication error', {
        service: 'auth',
        error: err.message,
        url: req.originalUrl
      });
      return next(unauthorizedError('Authentication failed'));
    }

    if (!user) {
      logger.warn('Authentication failed', {
        service: 'auth',
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        info: info?.message
      });
      return next(unauthorizedError('Invalid or expired token'));
    }

    // Verificar se o usuário não está banido
    if (user.isBanned) {
      const banExpired = user.banExpiresAt && new Date() > user.banExpiresAt;
      if (!banExpired) {
        logger.warn('Banned user attempted access', {
          service: 'auth',
          userId: user.id,
          username: user.username,
          banReason: user.banReason,
          banExpiresAt: user.banExpiresAt
        });
        return next(forbiddenError('Account is banned'));
      }
    }

    // Anexar usuário ao request
    (req as any).user = user;
    
    // Log de acesso bem-sucedido
    logger.debug('User authenticated', {
      service: 'auth',
      userId: user.id,
      username: user.username,
      url: req.originalUrl
    });

    next();
  })(req, res, next);
};

// Middleware para exigir privilégios de administrador
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  const user = (req as any).user;

  if (!user) {
    return next(unauthorizedError('Authentication required'));
  }

  if (!user.isAdmin) {
    logAudit('admin_access_denied', 'admin_endpoint', {
      endpoint: req.originalUrl,
      method: req.method
    }, user.id, req);

    return next(forbiddenError('Administrator privileges required'));
  }

  logAudit('admin_access_granted', 'admin_endpoint', {
    endpoint: req.originalUrl,
    method: req.method
  }, user.id, req);

  next();
};

// Middleware opcional de autenticação (não retorna erro se não autenticado)
export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  passport.authenticate('jwt', { session: false }, (err: any, user: User) => {
    if (err) {
      logger.error('Optional authentication error', {
        service: 'auth',
        error: err.message
      });
    }

    if (user) {
      (req as any).user = user;
    }

    next();
  })(req, res, next);
};

// Função para gerar JWT token
export const generateToken = (user: User): string => {
  const payload = {
    discordId: user.discordId,
    username: user.username,
    isAdmin: user.isAdmin,
    iat: Math.floor(Date.now() / 1000)
  };

  return jwt.sign(payload, serverConfig.jwtSecret, {
    expiresIn: serverConfig.jwtExpiresIn,
    issuer: 'hyperv-platform',
    audience: 'hyperv-platform-users'
  });
};

// Função para verificar token
export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, serverConfig.jwtSecret, {
      issuer: 'hyperv-platform',
      audience: 'hyperv-platform-users'
    });
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Função para extrair token do header
export const extractTokenFromHeader = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.substring(7);
};

// Middleware para rate limiting baseado em usuário
export const userRateLimit = (windowMs: number, maxRequests: number) => {
  const requests = new Map<string, Array<{ timestamp: number; count: number }>>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;
    const userId = user?.id || req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Limpar requests antigos
    if (requests.has(userId)) {
      const userRequests = requests.get(userId)!;
      const validRequests = userRequests.filter(r => r.timestamp > windowStart);
      requests.set(userId, validRequests);
    }

    // Contar requests na janela atual
    const userRequests = requests.get(userId) || [];
    const requestCount = userRequests.reduce((sum, r) => sum + r.count, 0);

    if (requestCount >= maxRequests) {
      logger.warn('Rate limit exceeded', {
        service: 'auth',
        userId,
        requestCount,
        maxRequests,
        windowMs
      });

      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }

    // Adicionar request atual
    userRequests.push({ timestamp: now, count: 1 });
    requests.set(userId, userRequests);

    next();
  };
};

// Função para logout (invalidar token - seria necessário uma blacklist)
export const logout = (req: Request, res: Response): void => {
  const token = extractTokenFromHeader(req);
  const user = (req as any).user;

  if (token && user) {
    logAudit('user_logout', 'auth', { token: token.substring(0, 10) + '...' }, user.id, req);
    
    logger.info('User logged out', {
      service: 'auth',
      userId: user.id,
      username: user.username
    });
  }

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
};