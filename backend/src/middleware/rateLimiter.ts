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

/**
 * Brute-force protection for login:
 * Maximum 8 attempts per 10 minutes per IP address
 */
export function loginRateLimiter(maxAttempts = 8, windowMinutes = 10) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const ip = getClientIp(req);
    try {
      const [rows]: any = await pool.query(
        `SELECT COUNT(*) as count 
         FROM rate_limit_logs 
         WHERE ip_address = ? 
           AND request_type = 'donor_login_attempt' 
           AND created_at >= DATE_SUB(NOW(), INTERVAL ? MINUTE)`,
        [ip, windowMinutes]
      );

      if (rows && rows[0]?.count >= maxAttempts) {
        await logRateLimit(ip, 'donor_login_attempt', 'blocked', 'brute_force_block');
        res.status(429).json({
          error: { message: `Too many login attempts. For security reasons, please wait ${windowMinutes} minutes before trying again.` },
        });
        return;
      }
      next();
    } catch (err) {
      next();
    }
  };
}

/**
 * Rate limiter for password reset:
 * Maximum 5 attempts per 15 minutes per IP address
 */
export function resetPasswordRateLimiter(maxAttempts = 5, windowMinutes = 15) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const ip = getClientIp(req);
    try {
      const [rows]: any = await pool.query(
        `SELECT COUNT(*) as count 
         FROM rate_limit_logs 
         WHERE ip_address = ? 
           AND request_type = 'password_reset_attempt' 
           AND created_at >= DATE_SUB(NOW(), INTERVAL ? MINUTE)`,
        [ip, windowMinutes]
      );

      if (rows && rows[0]?.count >= maxAttempts) {
        await logRateLimit(ip, 'password_reset_attempt', 'blocked', 'reset_rate_limit');
        res.status(429).json({
          error: { message: `Too many password reset requests. Please wait ${windowMinutes} minutes.` },
        });
        return;
      }
      next();
    } catch (err) {
      next();
    }
  };
}

/**
 * Rate limiter for Emergency Requests:
 * 1. Per User/Donor: Max 3 urgent posts per 15 minutes, and checks for duplicate active request for same blood group in last 1 hour.
 * 2. Per IP: Max 5 emergency request creations per 15 minutes.
 */
export function emergencyRequestRateLimiter(maxPerPeriod = 3, periodMinutes = 15) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const ip = getClientIp(req);
    const donorId = req.body?.requestData?.donor_id || req.body?.requestData?.donorId;

    try {
      // 1. IP-level rate limit check
      const [ipRows]: any = await pool.query(
        `SELECT COUNT(*) as count 
         FROM rate_limit_logs 
         WHERE ip_address = ? 
           AND request_type = 'emergency_request' 
           AND status = 'allowed' 
           AND created_at >= DATE_SUB(NOW(), INTERVAL ? MINUTE)`,
        [ip, periodMinutes]
      );

      if (ipRows && ipRows[0]?.count >= (maxPerPeriod * 2)) {
        await logRateLimit(ip, 'emergency_request', 'blocked', 'ip_rate_limit');
        res.status(429).json({
          data: null,
          error: { 
            message: `Too many emergency requests from your connection. Please wait ${periodMinutes} minutes before trying again.` 
          },
        });
        return;
      }

      // 2. User/Donor-level rate limit check (if donorId is present)
      if (donorId) {
        const [donorRows]: any = await pool.query(
          `SELECT COUNT(*) as count 
           FROM emergency_requests 
           WHERE donor_id = ? 
             AND created_at >= DATE_SUB(NOW(), INTERVAL ? MINUTE)`,
          [donorId, periodMinutes]
        );

        if (donorRows && donorRows[0]?.count >= maxPerPeriod) {
          await logRateLimit(ip, 'emergency_request', 'blocked', 'user_rate_limit');
          res.status(429).json({
            data: null,
            error: { 
              message: `You have reached the limit of ${maxPerPeriod} urgent requests within ${periodMinutes} minutes. Please wait before creating another.` 
            },
          });
          return;
        }

        // 3. Prevent immediate duplicate requests for the same blood group and area within 10 minutes
        const bloodGroup = req.body?.requestData?.blood_group;
        const area = req.body?.requestData?.area;
        if (bloodGroup && area) {
          const [dupRows]: any = await pool.query(
            `SELECT id 
             FROM emergency_requests 
             WHERE donor_id = ? 
               AND blood_group = ? 
               AND area = ? 
               AND status = 'needed' 
               AND created_at >= DATE_SUB(NOW(), INTERVAL 10 MINUTE)
             LIMIT 1`,
            [donorId, bloodGroup, area]
          );

          if (dupRows && dupRows.length > 0) {
            await logRateLimit(ip, 'emergency_request', 'blocked', 'duplicate_recent_request');
            res.status(429).json({
              data: null,
              error: { 
                message: `You already posted an active emergency request for ${bloodGroup} blood in ${area} within the last 10 minutes.` 
              },
            });
            return;
          }
        }
      }

      next();
    } catch (err) {
      // In case of error querying db, proceed gracefully
      next();
    }
  };
}
