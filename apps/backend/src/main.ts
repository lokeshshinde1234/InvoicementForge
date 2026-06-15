import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { setDefaultResultOrder } from 'dns';
import express, { NextFunction, Request, Response } from 'express';
import { join } from 'path';
import { AppModule } from './app.module';

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const isProduction = process.env.NODE_ENV === 'production';
const requestBodyLimit = process.env.REQUEST_BODY_LIMIT ?? '2mb';
setDefaultResultOrder(
  process.env.DNS_RESULT_ORDER === 'verbatim' ? 'verbatim' : 'ipv4first',
);

async function bootstrap() {
  const server = express();
  server.set('trust proxy', isProduction ? 1 : false);

  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
    bodyParser: false,
  });
  const frontendOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
    : ['http://localhost:3000', 'http://127.0.0.1:3000'];

  app.use(securityHeaders);
  app.use(createRateLimiter());
  app.use(express.json({ limit: requestBodyLimit }));
  app.use(express.urlencoded({ extended: true, limit: requestBodyLimit }));

  app.enableCors({
    origin(
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) {
      const localhostAllowed =
        !isProduction &&
        !!origin &&
        /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

      if (!origin || frontendOrigins.includes(origin) || localhostAllowed) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
    credentials: true,
  });
  app.use(
    '/uploads',
    express.static(join(process.cwd(), 'uploads'), {
      etag: true,
      immutable: isProduction,
      maxAge: isProduction ? '30d' : 0,
      setHeaders(response) {
        response.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        response.setHeader('Access-Control-Allow-Origin', '*');
      },
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();

function securityHeaders(
  _request: Request,
  response: Response,
  next: NextFunction,
) {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader('X-XSS-Protection', '0');
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  response.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  response.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()',
  );

  if (isProduction) {
    response.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains',
    );
  }

  next();
}

function createRateLimiter() {
  const buckets = new Map<string, RateLimitBucket>();
  const generalWindowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);
  const generalMax = Number(process.env.RATE_LIMIT_MAX ?? 240);
  const sensitiveWindowMs = Number(
    process.env.SENSITIVE_RATE_LIMIT_WINDOW_MS ?? 15 * 60_000,
  );
  const sensitiveMax = Number(process.env.SENSITIVE_RATE_LIMIT_MAX ?? 20);
  const demoMax = Number(process.env.DEMO_RATE_LIMIT_MAX ?? 10);

  return (request: Request, response: Response, next: NextFunction) => {
    if (request.path === '/health') {
      next();
      return;
    }

    const profile = rateLimitProfile(request.path, request.method, {
      generalMax,
      generalWindowMs,
      sensitiveMax,
      sensitiveWindowMs,
      demoMax,
    });
    const key = `${clientIp(request)}:${profile.scope}`;
    const now = Date.now();
    const current = buckets.get(key);
    const bucket =
      current && current.resetAt > now
        ? current
        : { count: 0, resetAt: now + profile.windowMs };

    bucket.count += 1;
    buckets.set(key, bucket);

    if (bucket.count > profile.max) {
      response.setHeader(
        'Retry-After',
        Math.ceil((bucket.resetAt - now) / 1000),
      );
      response
        .status(429)
        .json({ message: 'Too many requests. Please try again later.' });
      return;
    }

    if (buckets.size > 10_000) {
      for (const [bucketKey, value] of buckets.entries()) {
        if (value.resetAt <= now) {
          buckets.delete(bucketKey);
        }
      }
    }

    next();
  };
}

function rateLimitProfile(
  path: string,
  method: string,
  config: {
    generalMax: number;
    generalWindowMs: number;
    sensitiveMax: number;
    sensitiveWindowMs: number;
    demoMax: number;
  },
) {
  const normalizedPath = path.toLowerCase();
  const normalizedMethod = method.toUpperCase();
  const sensitive =
    normalizedPath.includes('/login') ||
    normalizedPath.includes('/forgot-password') ||
    normalizedPath.includes('/reset-password') ||
    normalizedPath.includes('/send-otp') ||
    normalizedPath.includes('/verify-otp') ||
    normalizedPath.includes('/payments/verify') ||
    normalizedPath.includes('/subscription/verify');

  if (sensitive) {
    return {
      scope: `sensitive:${normalizedPath}`,
      max: config.sensitiveMax,
      windowMs: config.sensitiveWindowMs,
    };
  }

  if (normalizedMethod === 'POST' && normalizedPath === '/demo-requests') {
    return {
      scope: 'demo-requests',
      max: config.demoMax,
      windowMs: config.sensitiveWindowMs,
    };
  }

  return {
    scope: 'general',
    max: config.generalMax,
    windowMs: config.generalWindowMs,
  };
}

function clientIp(request: Request): string {
  return request.ip || request.socket.remoteAddress || 'unknown';
}
