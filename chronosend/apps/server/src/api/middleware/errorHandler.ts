import { Request, Response, NextFunction } from 'express';
import { config } from '../../config';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error('[error]', err);

  const statusCode = ('statusCode' in err ? (err as { statusCode: number }).statusCode : 500);
  const message = config.isProduction ? 'Internal server error' : err.message;

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(config.isDevelopment ? { stack: err.stack } : {}),
  });
}
