import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import pool from '../config/db.js';
import { getClientIp, logRateLimit } from '../middleware/rateLimiter.js';
import { generateToken, verifyToken } from '../middleware/auth.js';

// Format donor object to ensure boolean types matching frontend expectations
function formatDonor(row: any) {
  if (!row) return null;
  return {
    ...row,
    is_available: Boolean(row.is_available),
    hide_photo: Boolean(row.hide_photo),
    total_donations: Number(row.total_donations) || 0,
    lifetime_donation_count: Number(row.lifetime_donation_count) || 0,
    // Ensure password_hash is NEVER exposed to clients
    password_hash: undefined,
  };
}

export async function getDonors(req: Request, res: Response): Promise<void> {
  try {
    const [rows]: any = await pool.query(
      `SELECT id, name, phone, blood_group, area, last_donation_date, is_available, 
              total_donations, lifetime_donation_count, email, google_id, avatar_url, hide_photo, created_at 
       FROM donors 
       ORDER BY is_available DESC, created_at DESC`
    );
    res.json({ data: rows.map(formatDonor), error: null });
  } catch (error: any) {
    console.error('getDonors error:', error);
    res.status(500).json({ data: null, error: { message: error.message || 'Failed to fetch donors' } });
  }
}

export async function getDonorByPhone(req: Request, res: Response): Promise<void> {
  const phone = String(req.params.phone || '').trim();
  try {
    const [rows]: any = await pool.query(
      `SELECT id, name, phone, blood_group, area, last_donation_date, is_available, 
              total_donations, lifetime_donation_count, email, google_id, avatar_url, hide_photo, created_at 
       FROM donors 
       WHERE phone = ?`,
      [phone]
    );

    if (!rows || rows.length === 0) {
      res.status(404).json({ data: null, error: { message: 'Donor profile not found.' } });
      return;
    }

    res.json({ data: formatDonor(rows[0]), error: null });
  } catch (error: any) {
    res.status(500).json({ data: null, error: { message: error.message } });
  }
}

export async function registerDonor(req: Request, res: Response): Promise<void> {
  const { donorData, honeypot } = req.body;
  const clientIp = getClientIp(req);

  try {
    // 1. Honeypot Check
    if (honeypot && String(honeypot).trim() !== '') {
      await logRateLimit(clientIp, 'donor_registration', 'blocked', 'honeypot_triggered');
      res.status(400).json({ data: null, error: { message: 'Verification failed. Bot detected.' } });
      return;
    }

    // 2. Validate Bangladeshi Phone Format
    // Format must be: +88 fixed country code with 11-digit number starting with 013, 014, 015, 016, 017, 018, 019
    let phone = String(donorData?.phone || '').trim();
    if (phone.startsWith('+88')) {
      phone = phone.slice(3).trim();
    } else if (phone.startsWith('88')) {
      phone = phone.slice(2).trim();
    }
    const phoneRegex = /^01[3-9]\d{8}$/;
    if (!phoneRegex.test(phone)) {
      await logRateLimit(clientIp, 'donor_registration', 'blocked', 'invalid_phone');
      res.status(400).json({
        data: null,
        error: { message: 'Invalid phone number. Must be an 11-digit Bangladeshi mobile number starting with 013, 014, 015, 016, 017, 018, or 019 (e.g. 01711223344).' }
      });
      return;
    }

    // 3. Password Check (Optional if google_id is provided)
    const googleId = donorData?.google_id ? String(donorData.google_id).trim() : null;
    const email = donorData?.email ? String(donorData.email).trim().toLowerCase() : null;
    const avatarUrl = donorData?.avatar_url ? String(donorData.avatar_url).trim() : null;
    const password = String(donorData?.password || '').trim();

    if (!googleId && password.length < 4) {
      res.status(400).json({ data: null, error: { message: 'Password must be at least 4 characters long.' } });
      return;
    }

    // 3.1 Prevent Admin email from being used as a donor account
    const configuredAdminEmails = (process.env.ADMIN_GOOGLE_EMAIL || process.env.ADMIN_EMAIL || 'adilh5353@gmail.com,daruntech.pvt.ltd@gmail.com')
      .split(',')
      .map(e => e.trim().toLowerCase());

    if (email && configuredAdminEmails.includes(email)) {
      res.status(403).json({
        data: null,
        error: { message: 'This email is reserved for system administrators and cannot be used as a general donor account. Please log in through the Admin Dashboard.' }
      });
      return;
    }

    // 4. DOB Required & Minimum Age 18 Check
    if (!donorData?.dob) {
      res.status(400).json({ data: null, error: { message: 'Date of birth is required for registration.' } });
      return;
    }

    const birthDate = new Date(donorData.dob);
    if (isNaN(birthDate.getTime())) {
      res.status(400).json({ data: null, error: { message: 'Invalid date of birth provided.' } });
      return;
    }

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 18) {
      res.status(400).json({
        data: null,
        error: { message: 'Blood donors must be at least 18 years old to register.' }
      });
      return;
    }

    // 5. Block Check
    const [blocked]: any = await pool.query('SELECT phone FROM blocked_donors WHERE phone = ?', [phone]);
    if (blocked && blocked.length > 0) {
      await logRateLimit(clientIp, 'donor_registration', 'blocked', 'phone_blocked');
      res.status(403).json({ data: null, error: { message: 'Your account has been blocked. Contact Support.' } });
      return;
    }

    // 6. Duplicate Phone Check (Phone number must be unique)
    const [existing]: any = await pool.query('SELECT id FROM donors WHERE phone = ?', [phone]);
    if (existing && existing.length > 0) {
      res.status(409).json({ data: null, error: { message: `Phone number ${phone} is already registered. Each donor must have a unique phone number.` } });
      return;
    }

    // 7. Calculate Donations Count
    let totalDonations = 0;
    if (donorData.total_donations !== undefined && donorData.total_donations !== null && donorData.total_donations !== '') {
      const parsed = parseInt(String(donorData.total_donations), 10);
      if (!isNaN(parsed)) totalDonations = Math.min(Math.max(parsed, 0), 999);
    } else if (donorData.last_donation_date) {
      totalDonations = 1;
    }

    // 8. Hash password (if provided) and insert
    const passwordHash = password ? await bcrypt.hash(password, 10) : (googleId ? await bcrypt.hash(crypto.randomUUID(), 10) : null);
    const id = crypto.randomUUID();
    const isAvailable = donorData.is_available ?? true;
    const hidePhoto = Boolean(donorData.hide_photo);

    await pool.query(
      `INSERT INTO donors 
       (id, name, phone, blood_group, area, last_donation_date, is_available, total_donations, lifetime_donation_count, password_hash, dob, email, google_id, avatar_url, hide_photo) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        donorData.name.trim(),
        phone,
        donorData.blood_group,
        donorData.area,
        donorData.last_donation_date || null,
        isAvailable ? 1 : 0,
        totalDonations,
        totalDonations,
        passwordHash,
        donorData.dob || null,
        email,
        googleId,
        avatarUrl,
        hidePhoto ? 1 : 0,
      ]
    );

    await logRateLimit(clientIp, 'donor_registration', 'allowed');

    const newDonor = {
      id,
      name: donorData.name.trim(),
      phone,
      blood_group: donorData.blood_group,
      area: donorData.area,
      last_donation_date: donorData.last_donation_date || null,
      is_available: isAvailable,
      total_donations: totalDonations,
      lifetime_donation_count: totalDonations,
      dob: donorData.dob,
      email,
      google_id: googleId,
      avatar_url: avatarUrl,
      hide_photo: hidePhoto,
      created_at: new Date().toISOString(),
    };

    res.status(201).json({ data: newDonor, error: null });
  } catch (error: any) {
    console.error('registerDonor error:', error);
    res.status(500).json({ data: null, error: { message: error.message || 'Registration failed.' } });
  }
}

export async function verifyDonor(req: Request, res: Response): Promise<void> {
  const { phone, password } = req.body;
  try {
    const cleanPhone = String(phone || '').trim();

    // Block check
    const [blocked]: any = await pool.query('SELECT phone FROM blocked_donors WHERE phone = ?', [cleanPhone]);
    if (blocked && blocked.length > 0) {
      res.status(403).json({ data: null, error: { message: 'Your account has been blocked. Contact Support.' } });
      return;
    }

    const [rows]: any = await pool.query('SELECT * FROM donors WHERE phone = ?', [cleanPhone]);
    if (!rows || rows.length === 0) {
      res.status(401).json({ data: null, error: { message: 'Invalid phone or password.' } });
      return;
    }

    const donor = rows[0];
    const passwordMatch = await bcrypt.compare(String(password || ''), donor.password_hash) ||
                          donor.password_hash === password; // Legacy plain check fallback

    if (!passwordMatch) {
      res.status(401).json({ data: null, error: { message: 'Invalid phone or password.' } });
      return;
    }

    const token = generateToken({ id: donor.id, phone: donor.phone, role: 'donor' });
    res.json({ data: formatDonor(donor), token, error: null });
  } catch (error: any) {
    res.status(500).json({ data: null, error: { message: error.message } });
  }
}

export async function updateDonorAvailability(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { is_available, password } = req.body;

  try {
    const [rows]: any = await pool.query('SELECT password_hash FROM donors WHERE id = ?', [id]);
    if (!rows || rows.length === 0) {
      res.status(404).json({ data: null, error: { message: 'Donor not found' } });
      return;
    }

    if (password) {
      const match = await bcrypt.compare(String(password), rows[0].password_hash) || rows[0].password_hash === password;
      if (!match) {
        res.status(401).json({ data: null, error: { message: 'Invalid password.' } });
        return;
      }
    }

    await pool.query('UPDATE donors SET is_available = ? WHERE id = ?', [is_available ? 1 : 0, id]);
    const [updated]: any = await pool.query('SELECT * FROM donors WHERE id = ?', [id]);

    res.json({ data: formatDonor(updated[0]), error: null });
  } catch (error: any) {
    res.status(500).json({ data: null, error: { message: error.message } });
  }
}

export async function updateDonorProfile(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { profileData, password } = req.body;

  try {
    const [rows]: any = await pool.query('SELECT * FROM donors WHERE id = ?', [id]);
    if (!rows || rows.length === 0) {
      res.status(404).json({ data: null, error: { message: 'Donor not found' } });
      return;
    }

    if (password) {
      const match = await bcrypt.compare(String(password), rows[0].password_hash) || rows[0].password_hash === password;
      if (!match) {
        res.status(401).json({ data: null, error: { message: 'Invalid password.' } });
        return;
      }
    }

    // Duplicate phone check if phone changed
    if (profileData.phone && profileData.phone.trim() !== rows[0].phone) {
      const [duplicate]: any = await pool.query('SELECT id FROM donors WHERE phone = ? AND id != ?', [
        profileData.phone.trim(),
        id,
      ]);
      if (duplicate && duplicate.length > 0) {
        res.status(409).json({
          data: null,
          error: { message: `Phone number ${profileData.phone} is already registered by another user.` }
        });
        return;
      }
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (profileData.name !== undefined) { updates.push('name = ?'); values.push(profileData.name.trim()); }
    if (profileData.phone !== undefined) { updates.push('phone = ?'); values.push(profileData.phone.trim()); }
    if (profileData.blood_group !== undefined) { updates.push('blood_group = ?'); values.push(profileData.blood_group); }
    if (profileData.area !== undefined) { updates.push('area = ?'); values.push(profileData.area); }
    if (profileData.last_donation_date !== undefined) { updates.push('last_donation_date = ?'); values.push(profileData.last_donation_date || null); }
    if (profileData.is_available !== undefined) { updates.push('is_available = ?'); values.push(profileData.is_available ? 1 : 0); }
    if (profileData.total_donations !== undefined) { updates.push('total_donations = ?'); values.push(profileData.total_donations); }
    if (profileData.lifetime_donation_count !== undefined) { updates.push('lifetime_donation_count = ?'); values.push(profileData.lifetime_donation_count); }
    if (profileData.dob !== undefined) { updates.push('dob = ?'); values.push(profileData.dob || null); }
    if (profileData.avatar_url !== undefined) { updates.push('avatar_url = ?'); values.push(profileData.avatar_url ? String(profileData.avatar_url).trim() : null); }
    if (profileData.hide_photo !== undefined) { updates.push('hide_photo = ?'); values.push(profileData.hide_photo ? 1 : 0); }
    if (profileData.new_password) {
      const newHash = await bcrypt.hash(profileData.new_password, 10);
      updates.push('password_hash = ?');
      values.push(newHash);
    }

    if (updates.length > 0) {
      values.push(id);
      await pool.query(`UPDATE donors SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    const [updated]: any = await pool.query('SELECT * FROM donors WHERE id = ?', [id]);
    res.json({ data: formatDonor(updated[0]), error: null });
  } catch (error: any) {
    res.status(500).json({ data: null, error: { message: error.message } });
  }
}

export async function resetDonorPassword(req: Request, res: Response): Promise<void> {
  const { name, phone, blood_group, dob, new_password } = req.body;
  try {
    const [rows]: any = await pool.query(
      `SELECT id FROM donors 
       WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) 
         AND TRIM(phone) = TRIM(?) 
         AND blood_group = ? 
         AND dob = ?`,
      [name, phone, blood_group, dob]
    );

    if (!rows || rows.length === 0) {
      res.status(404).json({
        success: false,
        error: { message: 'Verification failed. No donor matched the provided Name, Phone, Blood Group, and Date of Birth.' },
      });
      return;
    }

    const newHash = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE donors SET password_hash = ? WHERE id = ?', [newHash, rows[0].id]);

    res.json({ success: true, error: null });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
}

export async function addDonationEvent(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { donation_date, password } = req.body;

  try {
    const [donorRows]: any = await pool.query('SELECT * FROM donors WHERE id = ?', [id]);
    if (!donorRows || donorRows.length === 0) {
      res.status(404).json({ data: null, error: { message: 'Donor not found' } });
      return;
    }

    const donor = donorRows[0];
    if (password) {
      const match = await bcrypt.compare(String(password), donor.password_hash) || donor.password_hash === password;
      if (!match) {
        res.status(401).json({ data: null, error: { message: 'Invalid donor password.' } });
        return;
      }
    }

    // Cooldown Validation: Check if donor is within 90 days of last donation
    if (donor.last_donation_date) {
      const lastDate = new Date(donor.last_donation_date);
      const newDate = new Date(donation_date);
      const diffTime = newDate.getTime() - lastDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays >= 0 && diffDays < 90) {
        const remaining = 90 - diffDays;
        res.status(400).json({
          data: null,
          error: {
            message: `Donation restricted: Mandatory recovery cooldown is active. Please wait ${remaining} more days.`,
            daysRemaining: remaining,
          },
        });
        return;
      }
    }

    const eventId = crypto.randomUUID();
    await pool.query(
      'INSERT INTO donation_history (id, donor_id, donation_date) VALUES (?, ?, ?)',
      [eventId, id, donation_date]
    );

    const newCount = (donor.lifetime_donation_count || donor.total_donations || 0) + 1;
    await pool.query(
      `UPDATE donors 
       SET total_donations = ?, lifetime_donation_count = ?, last_donation_date = ?, is_available = 0 
       WHERE id = ?`,
      [newCount, newCount, donation_date, id]
    );

    res.status(201).json({
      data: { id: eventId, donor_id: id, donation_date },
      error: null,
    });
  } catch (error: any) {
    res.status(500).json({ data: null, error: { message: error.message } });
  }
}

export async function getDonationHistory(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  try {
    const [rows]: any = await pool.query(
      'SELECT id, donor_id, donation_date, created_at FROM donation_history WHERE donor_id = ? ORDER BY donation_date DESC',
      [id]
    );
    res.json({ data: rows, error: null });
  } catch (error: any) {
    res.status(500).json({ data: [], error: { message: error.message } });
  }
}

export async function deleteDonor(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { password, isDonorSelfDelete } = req.body || {};

  try {
    const [donorRows]: any = await pool.query('SELECT * FROM donors WHERE id = ?', [id]);
    if (!donorRows || donorRows.length === 0) {
      res.status(404).json({ success: false, error: { message: 'Donor account not found' } });
      return;
    }

    const donor = donorRows[0];

    // If deleting self from profile
    if (isDonorSelfDelete) {
      if (password) {
        const match = await bcrypt.compare(String(password), donor.password_hash) || donor.password_hash === password;
        if (!match) {
          res.status(401).json({ success: false, error: { message: 'Incorrect password. Account deletion canceled.' } });
          return;
        }
      }
    }

    // Determine who deleted the account
    let deletedBy = 'donor_self';
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const decoded: any = verifyToken(authHeader.split(' ')[1]);
      if (decoded && decoded.role === 'admin') {
        deletedBy = `admin (${decoded.username || 'admin'})`;
      }
    } else if (!isDonorSelfDelete) {
      deletedBy = 'admin';
    }

    // 1. Archive to deleted_donors table
    const archiveId = crypto.randomUUID();
    await pool.query(
      `INSERT INTO deleted_donors 
        (id, original_donor_id, name, phone, blood_group, area, email, total_donations, lifetime_donation_count, last_donation_date, registered_at, deleted_by, deletion_reason)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        archiveId,
        donor.id,
        donor.name,
        donor.phone,
        donor.blood_group,
        donor.area,
        donor.email || null,
        donor.total_donations || 0,
        donor.lifetime_donation_count || donor.total_donations || 0,
        donor.last_donation_date || null,
        donor.created_at || null,
        deletedBy,
        isDonorSelfDelete ? 'Donor deleted their own account' : 'Deleted by Administrator',
      ]
    );

    // 2. Delete push subscriptions, donor history and record
    await pool.query('DELETE FROM push_subscriptions WHERE donor_id = ?', [id]);
    await pool.query('DELETE FROM donation_history WHERE donor_id = ?', [id]);
    await pool.query('DELETE FROM donors WHERE id = ?', [id]);
    res.json({ success: true, error: null });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
}

export async function googleAuth(req: Request, res: Response): Promise<void> {
  const { credential, user } = req.body;

  try {
    let googleId = '';
    let email = '';
    let name = '';
    let avatarUrl = '';

    // 1. Verify Google ID token if sent
    if (credential) {
      try {
        const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
        if (verifyRes.ok) {
          const payload: any = await verifyRes.json();
          googleId = payload.sub || '';
          email = payload.email ? String(payload.email).trim().toLowerCase() : '';
          name = payload.name || '';
          avatarUrl = payload.picture || '';
        }
      } catch (err) {
        console.warn('Google tokeninfo fetch failed, falling back to payload:', err);
      }
    }

    // 2. Fallback to provided user object (supports dev / demo simulated Google sign-in)
    if (!googleId && user) {
      googleId = user.sub || user.google_id || `google_${Date.now()}`;
      email = user.email ? String(user.email).trim().toLowerCase() : '';
      name = user.name || '';
      avatarUrl = user.picture || user.avatar_url || '';
    }

    if (!email && !googleId) {
      res.status(400).json({ success: false, error: { message: 'Invalid Google authentication payload.' } });
      return;
    }

    // 2.1 Block admin email from user donor portal
    const configuredAdminEmails = (process.env.ADMIN_GOOGLE_EMAIL || process.env.ADMIN_EMAIL || 'adilh5353@gmail.com,daruntech.pvt.ltd@gmail.com')
      .split(',')
      .map(e => e.trim().toLowerCase());

    if (email && configuredAdminEmails.includes(email)) {
      res.status(403).json({
        success: false,
        error: { message: 'This email belongs to a system administrator and cannot be used as a public donor account. Please sign in via the Admin Dashboard.' }
      });
      return;
    }

    // 3. Check if phone is blocked
    if (email || googleId) {
      const [blocked]: any = await pool.query(
        `SELECT b.phone FROM blocked_donors b 
         JOIN donors d ON b.phone = d.phone 
         WHERE (d.email = ? AND d.email IS NOT NULL) OR (d.google_id = ? AND d.google_id IS NOT NULL)`,
        [email, googleId]
      );
      if (blocked && blocked.length > 0) {
        res.status(403).json({ success: false, error: { message: 'Your account has been blocked. Contact Support.' } });
        return;
      }
    }

    // 4. Check if donor already exists by google_id or email
    const [rows]: any = await pool.query(
      `SELECT * FROM donors 
       WHERE (google_id = ? AND google_id IS NOT NULL) 
          OR (email = ? AND email IS NOT NULL)`,
      [googleId, email]
    );

    if (rows && rows.length > 0) {
      const donor = rows[0];

      // Update google_id or avatar if missing
      if (!donor.google_id || !donor.avatar_url) {
        await pool.query(
          `UPDATE donors 
           SET google_id = COALESCE(google_id, ?), 
               avatar_url = COALESCE(avatar_url, ?), 
               email = COALESCE(email, ?) 
           WHERE id = ?`,
          [googleId, avatarUrl || null, email || null, donor.id]
        );
        donor.google_id = donor.google_id || googleId;
        donor.avatar_url = donor.avatar_url || avatarUrl;
        donor.email = donor.email || email;
      }

      const token = generateToken({ id: donor.id, phone: donor.phone, email: donor.email, role: 'donor' });
      res.json({
        success: true,
        isNewUser: false,
        donor: formatDonor(donor),
        token,
        error: null,
      });
      return;
    }

    // 5. Donor does not exist yet -> tell frontend to complete profile
    res.json({
      success: true,
      isNewUser: true,
      googleProfile: {
        google_id: googleId,
        email,
        name,
        avatar_url: avatarUrl,
      },
      error: null,
    });
  } catch (error: any) {
    console.error('googleAuth error:', error);
    res.status(500).json({ success: false, error: { message: error.message || 'Google authentication failed.' } });
  }
}
