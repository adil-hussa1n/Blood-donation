import { Request, Response, NextFunction } from 'express';
import pool from '../config/db.js';
import crypto from 'crypto';

export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || '127.0.0.1';
}

export async function logRateLimit(
  ip: string,
  requestType: string,
  status: 'allowed' | 'blocked',
  reason?: string
) {
  try {
    await pool.query(
      `INSERT INTO rate_limit_logs (id, ip_address, request_type, status, reason) VALUES (?, ?, ?, ?, ?)`,
      [crypto.randomUUID(), ip, requestType, status, reason || null]
    );
  } catch (err) {
    // Non-fatal logging error
    console.error('Failed to log rate limit event:', err);
  }
}

export function honeypotCheck(req: Request, res: Response, next: NextFunction): void {
  const honeypot = req.body?.honeypot;
  if (honeypot && String(honeypot).trim() !== '') {
    const ip = getClientIp(req);
    logRateLimit(ip, 'bot_honeypot', 'blocked', 'honeypot_triggered');
    res.status(400).json({ error: { message: 'Verification failed. Bot detected.' } });
    return;
  }
  next();
}

export function registrationRateLimiter(maxPerMinute = 5) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const ip = getClientIp(req);
    try {
      const [rows]: any = await pool.query(
        `SELECT COUNT(*) as count 
         FROM rate_limit_logs 
         WHERE ip_address = ? 
           AND request_type = 'donor_registration' 
           AND status = 'allowed' 
           AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MINUTE)`,
        [ip]
      );

      if (rows && rows[0]?.count >= maxPerMinute) {
        await logRateLimit(ip, 'donor_registration', 'blocked', 'rate_limit');
        res.status(429).json({
          error: { message: 'Too many registration attempts. Please wait 1 minute before trying again.' },
        });
        return;
      }
      next();
    } catch (err) {
      // If table query fails, don't completely block user
      next();
    }
  };
}
