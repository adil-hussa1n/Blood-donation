import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/db.js';
import { generateToken } from '../middleware/auth.js';
import { getClientIp } from '../middleware/rateLimiter.js';

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

export async function getDeletedDonors(req: Request, res: Response): Promise<void> {
  try {
    const [rows]: any = await pool.query(`
      SELECT id, original_donor_id, name, phone, blood_group, area, email, 
             total_donations, lifetime_donation_count, last_donation_date, 
             registered_at, deleted_by, deletion_reason, deleted_at 
      FROM deleted_donors 
      ORDER BY deleted_at DESC
    `);
    res.json({ success: true, data: rows || [], error: null });
  } catch (error: any) {
    res.status(500).json({ success: false, data: [], error: { message: error.message } });
  }
}

export async function getDeletedEmergencies(req: Request, res: Response): Promise<void> {
  try {
    const [rows]: any = await pool.query(`
      SELECT id, original_request_id, donor_id, requester_name, blood_group, 
             area, contact, note, original_status, requested_at, 
             deleted_by, deletion_reason, deleted_at 
      FROM deleted_emergencies 
      ORDER BY deleted_at DESC
    `);
    res.json({ success: true, data: rows || [], error: null });
  } catch (error: any) {
    res.status(500).json({ success: false, data: [], error: { message: error.message } });
  }
}

// ==========================================
// DONOR CARD & SPONSORSHIP OFFERS CONTROLLERS
// ==========================================

export async function getDonorCardConfig(req: Request, res: Response): Promise<void> {
  try {
    const [rows]: any = await pool.query('SELECT * FROM donor_card_config LIMIT 1');
    if (!rows || rows.length === 0) {
      res.json({
        success: true,
        data: {
          id: 'default_config',
          card_title: 'Official Voluntary Blood Donor Card',
          card_subtitle: 'Sylhet Emergency Blood Network • Darun Donors',
          front_notes: 'This card certifies that the bearer is a verified voluntary blood donor dedicated to saving human lives.',
          back_terms: '1. This card is non-transferable and strictly voluntary.\n2. Valid across partner health clinics, blood transfusion centers, and community sponsors.\n3. Present this card or QR code to redeem partner benefits and donor discounts.\n4. Always verify medical eligibility before transfusion.',
          emergency_hotline: '+880 1700-000000',
          authorized_signatory_title: 'Medical & Registry Director',
          badge_accent_color: '#dc2626',
          card_theme: 'crimson_dark',
          badge_text: 'Life Saver',
          issue_org: '',
          website_url: 'donors.daruntech.com',
          valid_years: 3,
          show_qr: 1,
          front_tag_label: 'REGISTERED LIFE SAVER',
          qr_label: 'SCAN TO VERIFY',
          back_guidelines_title: 'Guidelines & Partner Benefits',
          security_strip_text: 'DARUN DONORS DIGITAL SECURITY STRIP • VERIFIED VOLUNTARY REGISTRY',
          blood_group_label: 'GROUP',
          district_label: 'District / Area',
          donations_label: 'Total Donations',
          valid_thru_label: 'Valid Thru',
          verified_status_text: 'Verified Voluntary Donor',
          footer_sponsor_text: 'Partner discounts valid at recognized diagnostic centers and clinics.',
          show_magnetic_strip: 1,
          issued_by_label: 'Issued by:'
        },
        error: null
      });
      return;
    }
    res.json({ success: true, data: rows[0], error: null });
  } catch (error: any) {
    res.status(500).json({ success: false, data: null, error: { message: error.message } });
  }
}

export async function updateDonorCardConfig(req: Request, res: Response): Promise<void> {
  const {
    card_title,
    card_subtitle,
    front_notes,
    back_terms,
    emergency_hotline,
    authorized_signatory_title,
    badge_accent_color,
    card_theme,
    badge_text,
    issue_org,
    website_url,
    valid_years,
    show_qr,
    front_tag_label,
    qr_label,
    back_guidelines_title,
    security_strip_text,
    blood_group_label,
    district_label,
    donations_label,
    valid_thru_label,
    verified_status_text,
    footer_sponsor_text,
    show_magnetic_strip,
    issued_by_label
  } = req.body;

  try {
    const [existing]: any = await pool.query('SELECT id FROM donor_card_config LIMIT 1');
    if (!existing || existing.length === 0) {
      await pool.query(
        `INSERT INTO donor_card_config 
         (id, card_title, card_subtitle, front_notes, back_terms, emergency_hotline, authorized_signatory_title, badge_accent_color, card_theme, badge_text, issue_org, website_url, valid_years, show_qr, front_tag_label, qr_label, back_guidelines_title, security_strip_text, blood_group_label, district_label, donations_label, valid_thru_label, verified_status_text, footer_sponsor_text, show_magnetic_strip, issued_by_label)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'default_config',
          card_title || 'Official Voluntary Blood Donor Card',
          card_subtitle || 'Sylhet Emergency Blood Network • Darun Donors',
          front_notes || '',
          back_terms || '',
          emergency_hotline || '+880 1700-000000',
          authorized_signatory_title || 'Medical & Registry Director',
          badge_accent_color || '#dc2626',
          card_theme || 'crimson_dark',
          badge_text || 'Life Saver',
          issue_org !== undefined ? issue_org : '',
          website_url || 'donors.daruntech.com',
          valid_years ? parseInt(valid_years, 10) : 3,
          show_qr !== undefined ? (show_qr ? 1 : 0) : 1,
          front_tag_label || 'REGISTERED LIFE SAVER',
          qr_label || 'SCAN TO VERIFY',
          back_guidelines_title || 'Guidelines & Partner Benefits',
          security_strip_text || 'DARUN DONORS DIGITAL SECURITY STRIP • VERIFIED VOLUNTARY REGISTRY',
          blood_group_label || 'GROUP',
          district_label || 'District / Area',
          donations_label || 'Total Donations',
          valid_thru_label || 'Valid Thru',
          verified_status_text || 'Verified Voluntary Donor',
          footer_sponsor_text || 'Partner discounts valid at recognized diagnostic centers and clinics.',
          show_magnetic_strip !== undefined ? (show_magnetic_strip ? 1 : 0) : 1,
          issued_by_label || 'Issued by:'
        ]
      );
    } else {
      await pool.query(
        `UPDATE donor_card_config 
         SET card_title = ?, card_subtitle = ?, front_notes = ?, back_terms = ?, 
             emergency_hotline = ?, authorized_signatory_title = ?, badge_accent_color = ?,
             card_theme = ?, badge_text = ?, issue_org = ?, website_url = ?, valid_years = ?, show_qr = ?,
             front_tag_label = ?, qr_label = ?, back_guidelines_title = ?, security_strip_text = ?,
             blood_group_label = ?, district_label = ?, donations_label = ?, valid_thru_label = ?,
             verified_status_text = ?, footer_sponsor_text = ?, show_magnetic_strip = ?, issued_by_label = ?
         WHERE id = ?`,
        [
          card_title,
          card_subtitle,
          front_notes,
          back_terms,
          emergency_hotline,
          authorized_signatory_title,
          badge_accent_color || '#dc2626',
          card_theme || 'crimson_dark',
          badge_text || 'Life Saver',
          issue_org !== undefined ? issue_org : '',
          website_url || 'donors.daruntech.com',
          valid_years ? parseInt(valid_years, 10) : 3,
          show_qr !== undefined ? (show_qr ? 1 : 0) : 1,
          front_tag_label || 'REGISTERED LIFE SAVER',
          qr_label || 'SCAN TO VERIFY',
          back_guidelines_title || 'Guidelines & Partner Benefits',
          security_strip_text || 'DARUN DONORS DIGITAL SECURITY STRIP • VERIFIED VOLUNTARY REGISTRY',
          blood_group_label || 'GROUP',
          district_label || 'District / Area',
          donations_label || 'Total Donations',
          valid_thru_label || 'Valid Thru',
          verified_status_text || 'Verified Voluntary Donor',
          footer_sponsor_text || 'Partner discounts valid at recognized diagnostic centers and clinics.',
          show_magnetic_strip !== undefined ? (show_magnetic_strip ? 1 : 0) : 1,
          issued_by_label || 'Issued by:',
          existing[0].id
        ]
      );
    }

    const [updated]: any = await pool.query('SELECT * FROM donor_card_config LIMIT 1');
    res.json({ success: true, data: updated[0], error: null });
  } catch (error: any) {
    res.status(500).json({ success: false, data: null, error: { message: error.message } });
  }
}

export async function getDonorCardOffers(req: Request, res: Response): Promise<void> {
  try {
    const [rows]: any = await pool.query('SELECT * FROM donor_card_offers ORDER BY created_at DESC');
    res.json({ success: true, data: rows || [], error: null });
  } catch (error: any) {
    res.status(500).json({ success: false, data: [], error: { message: error.message } });
  }
}

export async function createDonorCardOffer(req: Request, res: Response): Promise<void> {
  const {
    sponsor_name,
    sponsor_logo,
    title,
    discount_text,
    description,
    promo_code,
    valid_until,
    category,
    is_active
  } = req.body;

  if (!sponsor_name || !title || !discount_text) {
    res.status(400).json({ success: false, error: { message: 'Sponsor name, title, and discount text are required.' } });
    return;
  }

  const id = `offer_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  try {
    await pool.query(
      `INSERT INTO donor_card_offers 
       (id, sponsor_name, sponsor_logo, title, discount_text, description, promo_code, valid_until, category, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        sponsor_name.trim(),
        sponsor_logo || null,
        title.trim(),
        discount_text.trim(),
        description || null,
        promo_code ? promo_code.trim().toUpperCase() : null,
        valid_until || 'Ongoing',
        category || 'healthcare',
        is_active !== undefined ? (is_active ? 1 : 0) : 1
      ]
    );

    const [created]: any = await pool.query('SELECT * FROM donor_card_offers WHERE id = ?', [id]);
    res.status(201).json({ success: true, data: created[0], error: null });
  } catch (error: any) {
    res.status(500).json({ success: false, data: null, error: { message: error.message } });
  }
}

export async function updateDonorCardOffer(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const {
    sponsor_name,
    sponsor_logo,
    title,
    discount_text,
    description,
    promo_code,
    valid_until,
    category,
    is_active
  } = req.body;

  try {
    await pool.query(
      `UPDATE donor_card_offers 
       SET sponsor_name = ?, sponsor_logo = ?, title = ?, discount_text = ?, 
           description = ?, promo_code = ?, valid_until = ?, category = ?, is_active = ?
       WHERE id = ?`,
      [
        sponsor_name,
        sponsor_logo,
        title,
        discount_text,
        description,
        promo_code,
        valid_until,
        category,
        is_active ? 1 : 0,
        id
      ]
    );

    const [updated]: any = await pool.query('SELECT * FROM donor_card_offers WHERE id = ?', [id]);
    res.json({ success: true, data: updated[0] || null, error: null });
  } catch (error: any) {
    res.status(500).json({ success: false, data: null, error: { message: error.message } });
  }
}

export async function deleteDonorCardOffer(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM donor_card_offers WHERE id = ?', [id]);
    res.json({ success: true, error: null });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
}

export async function logUserActivity(
  activityType: string,
  description: string,
  options?: {
    userId?: string | null;
    userName?: string | null;
    userPhone?: string | null;
    userEmail?: string | null;
    ipAddress?: string | null;
    metadata?: any;
  }
): Promise<void> {
  try {
    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO user_activity_logs 
        (id, user_id, user_name, user_phone, user_email, activity_type, description, ip_address, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        options?.userId || null,
        options?.userName || null,
        options?.userPhone || null,
        options?.userEmail || null,
        activityType,
        description,
        options?.ipAddress || null,
        options?.metadata ? JSON.stringify(options.metadata) : null,
      ]
    );
  } catch (err: any) {
    console.error('Failed to log user activity:', err.message);
  }
}

export async function getUserActivityLogs(req: Request, res: Response): Promise<void> {
  try {
    const limit = parseInt(String(req.query.limit || '100'), 10);
    const userId = req.query.userId ? String(req.query.userId).trim() : null;
    const phone = req.query.phone ? String(req.query.phone).trim() : null;

    let query = `
      SELECT id, user_id, user_name, user_phone, user_email, 
             activity_type, description, ip_address, metadata, created_at
      FROM user_activity_logs
    `;
    const params: any[] = [];

    if (userId) {
      query += ` WHERE user_id = ? `;
      params.push(userId);
    } else if (phone) {
      query += ` WHERE user_phone = ? `;
      params.push(phone);
    }

    query += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(limit);

    const [rows]: any = await pool.query(query, params);
    res.json({ success: true, data: rows || [], error: null });
  } catch (error: any) {
    res.status(500).json({ success: false, data: [], error: { message: error.message } });
  }
}

export async function updateDonorDetailsByAdmin(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { name, phone, blood_group, area, last_donation_date, total_donations, is_available, dob, email } = req.body;
  const adminName = (req as any).admin?.username || 'admin';

  try {
    const [rows]: any = await pool.query('SELECT * FROM donors WHERE id = ?', [id]);
    if (!rows || rows.length === 0) {
      res.status(404).json({ success: false, error: { message: 'Donor not found.' } });
      return;
    }

    const prev = rows[0];

    // Duplicate phone check if phone changed
    if (phone && phone.trim() !== prev.phone) {
      const [duplicate]: any = await pool.query('SELECT id FROM donors WHERE phone = ? AND id != ?', [phone.trim(), id]);
      if (duplicate && duplicate.length > 0) {
        res.status(409).json({ success: false, error: { message: `Phone number ${phone} is already registered to another donor.` } });
        return;
      }
    }

    const diffs: Record<string, { from: any; to: any }> = {};
    if (name !== undefined && (name || '').trim() !== (prev.name || '').trim()) {
      diffs.name = { from: prev.name || '', to: name.trim() };
    }
    if (phone !== undefined && (phone || '').trim() !== (prev.phone || '').trim()) {
      diffs.phone = { from: prev.phone || '', to: phone.trim() };
    }
    if (blood_group !== undefined && (blood_group || '') !== (prev.blood_group || '')) {
      diffs.blood_group = { from: prev.blood_group || '', to: blood_group };
    }
    if (area !== undefined && (area || '') !== (prev.area || '')) {
      diffs.area = { from: prev.area || '', to: area };
    }
    if (last_donation_date !== undefined) {
      const prevDate = prev.last_donation_date ? String(prev.last_donation_date).substring(0, 10) : '';
      const newDate = last_donation_date ? String(last_donation_date).substring(0, 10) : '';
      if (prevDate !== newDate) diffs.last_donation_date = { from: prevDate, to: newDate };
    }
    if (total_donations !== undefined && parseInt(total_donations, 10) !== parseInt(prev.total_donations, 10)) {
      diffs.total_donations = { from: parseInt(prev.total_donations, 10) || 0, to: parseInt(total_donations, 10) || 0 };
    }
    if (is_available !== undefined && Boolean(is_available) !== Boolean(prev.is_available)) {
      diffs.is_available = { from: Boolean(prev.is_available), to: Boolean(is_available) };
    }
    if (dob !== undefined) {
      const prevDob = prev.dob ? String(prev.dob).substring(0, 10) : '';
      const newDob = dob ? String(dob).substring(0, 10) : '';
      if (prevDob !== newDob) diffs.dob = { from: prevDob, to: newDob };
    }
    if (email !== undefined && (email || '').trim().toLowerCase() !== (prev.email || '').trim().toLowerCase()) {
      diffs.email = { from: (prev.email || '').trim().toLowerCase(), to: (email || '').trim().toLowerCase() };
    }
    if (req.body.occupation !== undefined && (req.body.occupation || '').trim() !== (prev.occupation || '').trim()) {
      diffs.occupation = { from: prev.occupation || 'other', to: req.body.occupation.trim() };
    }
    if (req.body.institute !== undefined && (req.body.institute || '').trim() !== (prev.institute || '').trim()) {
      diffs.institute = { from: prev.institute || '', to: req.body.institute.trim() };
    }
    if (req.body.student_id !== undefined && (req.body.student_id || '').trim() !== (prev.student_id || '').trim()) {
      diffs.student_id = { from: prev.student_id || '', to: req.body.student_id.trim() };
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) { updates.push('name = ?'); values.push(name.trim()); }
    if (phone !== undefined) { updates.push('phone = ?'); values.push(phone.trim()); }
    if (blood_group !== undefined) { updates.push('blood_group = ?'); values.push(blood_group); }
    if (area !== undefined) { updates.push('area = ?'); values.push(area); }
    if (last_donation_date !== undefined) { updates.push('last_donation_date = ?'); values.push(last_donation_date || null); }
    if (total_donations !== undefined) { 
      updates.push('total_donations = ?'); values.push(parseInt(total_donations, 10) || 0); 
      updates.push('lifetime_donation_count = ?'); values.push(parseInt(total_donations, 10) || 0);
    }
    if (is_available !== undefined) { updates.push('is_available = ?'); values.push(is_available ? 1 : 0); }
    if (dob !== undefined) { updates.push('dob = ?'); values.push(dob || null); }
    if (email !== undefined) { updates.push('email = ?'); values.push(email ? email.trim().toLowerCase() : null); }
    if (req.body.occupation !== undefined) { updates.push('occupation = ?'); values.push(req.body.occupation ? req.body.occupation.trim() : 'other'); }
    if (req.body.institute !== undefined) { updates.push('institute = ?'); values.push(req.body.institute ? req.body.institute.trim() : null); }
    if (req.body.student_id !== undefined) { updates.push('student_id = ?'); values.push(req.body.student_id ? req.body.student_id.trim() : null); }

    if (updates.length > 0) {
      values.push(id);
      await pool.query(`UPDATE donors SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    const [updated]: any = await pool.query('SELECT * FROM donors WHERE id = ?', [id]);
    const clientIp = getClientIp(req);

    // Format human readable change summary
    const changeSummary = Object.keys(diffs).length > 0
      ? Object.entries(diffs).map(([k, v]) => `${k}: '${v.from || 'none'}' → '${v.to || 'none'}'`).join(', ')
      : 'No field values changed';

    // Log admin modification in user_activity_logs with exact diffs
    await logUserActivity(
      'admin_updated_donor',
      `Admin (${adminName}) modified: ${changeSummary}.`,
      {
        userId: updated[0].id,
        userName: updated[0].name,
        userPhone: updated[0].phone,
        userEmail: updated[0].email,
        ipAddress: clientIp,
        metadata: { updatedBy: adminName, changes: diffs }
      }
    );

    res.json({ success: true, data: updated[0], error: null });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
}

export async function updateEmergencyDetailsByAdmin(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { blood_group, area, contact, note, status } = req.body;
  const adminName = (req as any).admin?.username || 'admin';

  try {
    const [rows]: any = await pool.query('SELECT * FROM emergency_requests WHERE id = ?', [id]);
    if (!rows || rows.length === 0) {
      res.status(404).json({ success: false, error: { message: 'Emergency request not found.' } });
      return;
    }

    const prev = rows[0];

    const diffs: Record<string, { from: any; to: any }> = {};
    if (blood_group !== undefined && blood_group !== prev.blood_group) diffs.blood_group = { from: prev.blood_group, to: blood_group };
    if (area !== undefined && area !== prev.area) diffs.area = { from: prev.area, to: area };
    if (contact !== undefined && contact.trim() !== prev.contact) diffs.contact = { from: prev.contact, to: contact.trim() };
    if (note !== undefined && (note || '').trim() !== (prev.note || '').trim()) diffs.note = { from: prev.note || '', to: (note || '').trim() };
    if (status !== undefined && status !== prev.status) diffs.status = { from: prev.status, to: status };

    const updates: string[] = [];
    const values: any[] = [];

    if (blood_group !== undefined) { updates.push('blood_group = ?'); values.push(blood_group); }
    if (area !== undefined) { updates.push('area = ?'); values.push(area); }
    if (contact !== undefined) { updates.push('contact = ?'); values.push(contact.trim()); }
    if (note !== undefined) { updates.push('note = ?'); values.push(note ? note.trim() : ''); }
    if (status !== undefined) { updates.push('status = ?'); values.push(status); }

    if (updates.length > 0) {
      values.push(id);
      await pool.query(`UPDATE emergency_requests SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    const [updated]: any = await pool.query('SELECT * FROM emergency_requests WHERE id = ?', [id]);
    const clientIp = getClientIp(req);

    const changeSummary = Object.keys(diffs).length > 0
      ? Object.entries(diffs).map(([k, v]) => `${k}: '${v.from || 'none'}' → '${v.to || 'none'}'`).join(', ')
      : 'No field values changed';

    // Log admin modification in user_activity_logs
    await logUserActivity(
      'admin_updated_emergency',
      `Admin (${adminName}) modified emergency request: ${changeSummary}.`,
      {
        userId: updated[0].donor_id || null,
        userPhone: updated[0].contact,
        ipAddress: clientIp,
        metadata: { updatedBy: adminName, changes: diffs }
      }
    );

    res.json({ success: true, data: updated[0], error: null });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
}

