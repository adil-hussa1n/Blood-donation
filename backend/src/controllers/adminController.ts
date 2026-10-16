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

