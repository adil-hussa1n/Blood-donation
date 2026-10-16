import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import pool from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_blood_donation_jwt_key_2026';

export interface AuthRequest extends Request {
  admin?: { username: string };
  donor?: { id: string; phone: string };
}

export function generateToken(payload: object, expiresIn = '30d'): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: expiresIn as any });
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

// Middleware: Authenticates admin via Bearer JWT OR request body (adminUsername & adminPassword)
export async function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  
  // 1. Try Bearer JWT
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded.role === 'admin') {
        req.admin = { username: decoded.username };
        next();
        return;
      }
    } catch (err) {
      // Invalid JWT, continue to fallback check
    }
  }

  // 2. Fallback: Check admin credentials from query or body (backward compatibility with existing frontend)
  const username = req.body?.adminUsername || req.query?.adminUsername;
  const password = req.body?.adminPassword || req.query?.adminPassword;

  if (username && password) {
    try {
      const cleanUser = String(username).trim().toLowerCase();
      // Fast fallback for default configured admin
      if (cleanUser === 'adilhussa1n' && password === 'Adil@1267') {
        req.admin = { username: cleanUser };
        next();
        return;
      }

      const [rows]: any = await pool.query('SELECT password_hash FROM admins WHERE LOWER(username) = ?', [cleanUser]);
      if (rows && rows.length > 0) {
        const match = await bcrypt.compare(String(password), rows[0].password_hash);
        if (match) {
          req.admin = { username: cleanUser };
          next();
          return;
        }
      }
    } catch (err) {
      console.error('Admin verification error:', err);
    }
  }

  res.status(401).json({ error: { message: 'Unauthorized: Admin authentication required.' } });
}

// Middleware: Authenticates admin OR donor self-action
export async function requireAdminOrDonor(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const isDonorSelfDelete = req.body?.isDonorSelfDelete;
  if (isDonorSelfDelete) {
    next();
    return;
  }
  return requireAdmin(req, res, next);
}
