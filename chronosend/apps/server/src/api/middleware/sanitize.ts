import { Request, Response, NextFunction } from 'express';

// Strips HTML tags from all string fields in req.body to prevent XSS
export function sanitizeInput(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }
  next();
}

function sanitizeObject(obj: Record<string, unknown>): void {
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (typeof value === 'string') {
      obj[key] = value.replace(/<[^>]*>/g, '');
    } else if (value && typeof value === 'object') {
      sanitizeObject(value as Record<string, unknown>);
    }
  }
}
