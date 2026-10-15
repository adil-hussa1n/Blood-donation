import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/db.js';
import { generateToken } from '../middleware/auth.js';

export async function googleAdminLogin(req: Request, res: Response): Promise<void> {
  const { credential, user } = req.body;
  let email = '';
  let googleId = '';
  let name = '';
  let avatarUrl = '';

  // 1. Verify Google ID token if sent
  if (credential) {
    try {
      const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
      if (verifyRes.ok) {
        const payload: any = await verifyRes.json();
        googleId = payload.sub || '';
        email = String(payload.email || '').toLowerCase().trim();
        name = payload.name || '';
        avatarUrl = payload.picture || '';
      }
    } catch (err) {
      console.warn('Google tokeninfo fetch failed:', err);
    }
  }

  // 2. Fallback to provided user object (supports dev / testing)
  if (!email && user) {
    email = String(user.email || '').toLowerCase().trim();
    googleId = user.sub || user.google_id || '';
    name = user.name || '';
    avatarUrl = user.picture || user.avatar_url || '';
  }

  if (!email) {
    res.status(400).json({ success: false, error: { message: 'Invalid Google authentication payload: no email found.' } });
    return;
  }

  // 3. Strict Single-Account Security Check
  const configuredAdminEmail = (process.env.ADMIN_GOOGLE_EMAIL || process.env.ADMIN_EMAIL || 'adilh5353@gmail.com,daruntech.pvt.ltd@gmail.com').toLowerCase().trim();
  const allowedEmails = configuredAdminEmail.split(',').map(e => e.trim().toLowerCase());

  if (!allowedEmails.includes(email)) {
    res.status(403).json({
      success: false,
      error: {
        message: `Access Denied: The Google account (${email}) is not authorized as an administrator. Only the authorized administrator account can access this portal.`
      }
    });
    return;
  }

  // 4. Authorized! Generate Admin JWT Token
  const token = generateToken({ username: email, role: 'admin' });
  res.json({
    success: true,
    token,
    admin: {
      email,
      name: name || 'Admin',
      avatar_url: avatarUrl,
      role: 'admin'
    },
    error: null
  });
}

export async function verifyAdminCredentials(req: Request, res: Response): Promise<void> {
  const { username, password } = req.body;
  const cleanUser = String(username || '').trim().toLowerCase();

  // Fast check for default fallback admin
  if (cleanUser === 'adilhussa1n' && password === 'Adil@1267') {
    const token = generateToken({ username: cleanUser, role: 'admin' });
    res.json({ success: true, token, error: null });
    return;
  }

  try {
    const [rows]: any = await pool.query('SELECT password_hash FROM admins WHERE LOWER(username) = ?', [cleanUser]);
    if (!rows || rows.length === 0) {
      res.status(401).json({ success: false, error: { message: 'Invalid Admin credentials.' } });
      return;
    }

    const match = await bcrypt.compare(String(password || ''), rows[0].password_hash);
    if (!match) {
      res.status(401).json({ success: false, error: { message: 'Invalid Admin credentials.' } });
      return;
    }

    const token = generateToken({ username: cleanUser, role: 'admin' });
    res.json({ success: true, token, error: null });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
}

export async function blockDonorByPhone(req: Request, res: Response): Promise<void> {
  const { phone, reason } = req.body;
  const adminUser = (req as any).admin?.username || req.body?.adminUsername || 'admin';

  try {
    const cleanPhone = String(phone || '').trim();
    await pool.query(
      `INSERT INTO blocked_donors (phone, reason, blocked_by) 
       VALUES (?, ?, ?) 
       ON DUPLICATE KEY UPDATE reason = VALUES(reason), blocked_by = VALUES(blocked_by), blocked_at = NOW()`,
      [cleanPhone, reason || 'Blocked by admin', adminUser]
    );

    res.json({ success: true, error: null });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message || 'Failed to block donor' } });
  }
}

export async function unblockDonorByPhone(req: Request, res: Response): Promise<void> {
  const phone = String(req.params.phone || '').trim();
  try {
    await pool.query('DELETE FROM blocked_donors WHERE phone = ?', [phone]);
    res.json({ success: true, error: null });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message || 'Failed to unblock donor' } });
  }
}

export async function getBlockedPhones(req: Request, res: Response): Promise<void> {
  try {
    const [rows]: any = await pool.query('SELECT phone, reason, blocked_by, blocked_at FROM blocked_donors ORDER BY blocked_at DESC');
    res.json({ success: true, data: rows, error: null });
  } catch (error: any) {
    res.status(500).json({ success: false, data: [], error: { message: error.message } });
  }
}

export async function checkIfBlocked(req: Request, res: Response): Promise<void> {
  const phone = String(req.params.phone || '').trim();
  try {
    const [rows]: any = await pool.query('SELECT phone FROM blocked_donors WHERE phone = ?', [phone]);
    res.json({ data: rows && rows.length > 0, error: null });
  } catch (error: any) {
    res.status(500).json({ data: false, error: { message: error.message } });
  }
}
