import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10);
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'blood_donation_db';

export async function initDatabase() {
  console.log('🔄 Initializing MySQL Database...');

  // Step 1: Attempt to create database if not exists (gracefully skips on managed cloud DBs where user has restricted scope)
  let rootConn;
  try {
    rootConn = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
    });

    await rootConn.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    console.log(`✅ Database '${DB_NAME}' verified/created.`);
    await rootConn.end();
  } catch (err: any) {
    // If user lacks global CREATE DATABASE privilege (common on cloud hosting like cPanel/managed MySQL), log warning and continue
    console.warn(`⚠️ Note on DB verification (${err.message}). Connecting directly to '${DB_NAME}'...`);
    if (rootConn) {
      try { await rootConn.end(); } catch (_) {}
    }
  }

  // Step 2: Connect to the specific database and create tables
  const dbConn = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    dateStrings: true,
  });

  try {
    // 1. Admins
    await dbConn.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id VARCHAR(36) PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    // 2. Blocked Donors
    await dbConn.query(`
      CREATE TABLE IF NOT EXISTS blocked_donors (
        phone VARCHAR(20) PRIMARY KEY,
        reason TEXT,
        blocked_by VARCHAR(100),
        blocked_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    // 3. Donors
    await dbConn.query(`
      CREATE TABLE IF NOT EXISTS donors (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        phone VARCHAR(20) NOT NULL UNIQUE,
        blood_group VARCHAR(10) NOT NULL,
        area VARCHAR(150) NOT NULL,
        last_donation_date DATE NULL,
        is_available TINYINT(1) DEFAULT 1 NOT NULL,
        total_donations INT DEFAULT 0 NOT NULL,
        lifetime_donation_count INT DEFAULT 0 NOT NULL,
        password_hash VARCHAR(255) NULL,
        dob DATE NULL,
        email VARCHAR(255) NULL UNIQUE,
        google_id VARCHAR(100) NULL UNIQUE,
        avatar_url VARCHAR(500) NULL,
        hide_photo TINYINT(1) DEFAULT 0 NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_blood_group (blood_group),
        INDEX idx_area (area),
        INDEX idx_google_id (google_id),
        INDEX idx_email (email),
        INDEX idx_is_available (is_available),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB;
    `);

    // 4. Donation History
    await dbConn.query(`
      CREATE TABLE IF NOT EXISTS donation_history (
        id VARCHAR(36) PRIMARY KEY,
        donor_id VARCHAR(36) NOT NULL,
        donation_date DATE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (donor_id) REFERENCES donors(id) ON DELETE CASCADE,
        INDEX idx_donor_id (donor_id),
        INDEX idx_donation_date (donation_date)
      ) ENGINE=InnoDB;
    `);

    // 5. Emergency Requests
    await dbConn.query(`
      CREATE TABLE IF NOT EXISTS emergency_requests (
        id VARCHAR(36) PRIMARY KEY,
        donor_id VARCHAR(36) NULL,
        blood_group VARCHAR(10) NOT NULL,
        area VARCHAR(150) NOT NULL,
        contact VARCHAR(20) NOT NULL,
        note TEXT,
        passcode VARCHAR(100) NOT NULL,
        status ENUM('needed', 'responded', 'fulfilled') DEFAULT 'needed' NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_emergency_donor (donor_id),
        INDEX idx_emergency_status (status),
        INDEX idx_emergency_created (created_at)
      ) ENGINE=InnoDB;
    `);

    // Migration: ensure donor_id exists on emergency_requests if already created earlier
    try {
      const [colCheck]: any = await dbConn.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'emergency_requests' AND COLUMN_NAME = 'donor_id'
      `, [DB_NAME]);

      if (!colCheck || colCheck.length === 0) {
        await dbConn.query(`
          ALTER TABLE emergency_requests 
          ADD COLUMN donor_id VARCHAR(36) NULL AFTER id,
          ADD INDEX idx_emergency_donor (donor_id)
        `);
        console.log('✅ Added donor_id column to emergency_requests table.');
      }
    } catch (migErr: any) {
      console.warn('Migration note for emergency_requests.donor_id:', migErr.message);
    }

    // Migration: ensure lifetime_donation_count and modern columns exist on donors table
    const donorColumnsToCheck = [
      { name: 'lifetime_donation_count', def: 'INT DEFAULT 0 NOT NULL AFTER total_donations' },
      { name: 'avatar_url', def: 'VARCHAR(500) NULL AFTER google_id' },
      { name: 'hide_photo', def: 'TINYINT(1) DEFAULT 0 NOT NULL AFTER avatar_url' },
      { name: 'google_id', def: 'VARCHAR(100) NULL UNIQUE AFTER email' },
      { name: 'email', def: 'VARCHAR(255) NULL UNIQUE AFTER dob' },
      { name: 'dob', def: 'DATE NULL AFTER password_hash' },
    ];

    for (const col of donorColumnsToCheck) {
      try {
        const [exists]: any = await dbConn.query(`
          SELECT COLUMN_NAME 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'donors' AND COLUMN_NAME = ?
        `, [DB_NAME, col.name]);

        if (!exists || exists.length === 0) {
          await dbConn.query(`ALTER TABLE donors ADD COLUMN ${col.name} ${col.def}`);
          console.log(`✅ Added ${col.name} column to donors table.`);
        }
      } catch (err: any) {
        console.warn(`Migration note for donors.${col.name}:`, err.message);
      }
    }

    try {
      await dbConn.query(`
        UPDATE donors 
        SET lifetime_donation_count = total_donations 
        WHERE lifetime_donation_count = 0 AND total_donations > 0
      `);
    } catch (e) {}

    // 6. Support Requests
    await dbConn.query(`
      CREATE TABLE IF NOT EXISTS support_requests (
        id VARCHAR(36) PRIMARY KEY,
        type ENUM('support', 'problem') NOT NULL,
        name VARCHAR(150) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        issue_type VARCHAR(50) NULL,
        message TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_support_created (created_at)
      ) ENGINE=InnoDB;
    `);

    // 7. Rate Limit Logs
    await dbConn.query(`
      CREATE TABLE IF NOT EXISTS rate_limit_logs (
        id VARCHAR(36) PRIMARY KEY,
        ip_address VARCHAR(45) NOT NULL,
        request_type VARCHAR(50) NOT NULL,
        status ENUM('allowed', 'blocked') NOT NULL,
        reason VARCHAR(100) NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_rate_ip_time (ip_address, created_at)
      ) ENGINE=InnoDB;
    `);

    // 8. Push Subscriptions (For background Web Push to Android, iPhone PWA & Desktop)
    await dbConn.query(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id VARCHAR(36) PRIMARY KEY,
        endpoint TEXT NOT NULL,
        p256dh VARCHAR(255) NOT NULL,
        auth VARCHAR(255) NOT NULL,
        donor_id VARCHAR(36) NULL,
        blood_group VARCHAR(10) NULL,
        area VARCHAR(150) NULL,
        endpoint_hash VARCHAR(64) NOT NULL UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_push_blood (blood_group),
        INDEX idx_push_area (area),
        INDEX idx_push_donor (donor_id),
        INDEX idx_push_endpoint_hash (endpoint_hash)
      ) ENGINE=InnoDB;
    `);

    // 9. Deleted Donors Archive (Auditing for Admin Dashboard)
    await dbConn.query(`
      CREATE TABLE IF NOT EXISTS deleted_donors (
        id VARCHAR(36) PRIMARY KEY,
        original_donor_id VARCHAR(36) NOT NULL,
        name VARCHAR(150) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        blood_group VARCHAR(10) NOT NULL,
        area VARCHAR(150) NOT NULL,
        email VARCHAR(255) NULL,
        total_donations INT DEFAULT 0 NOT NULL,
        lifetime_donation_count INT DEFAULT 0 NOT NULL,
        last_donation_date DATE NULL,
        registered_at DATETIME NULL,
        deleted_by VARCHAR(100) NOT NULL,
        deletion_reason TEXT NULL,
        deleted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_del_donor_blood (blood_group),
        INDEX idx_del_donor_phone (phone),
        INDEX idx_del_donor_time (deleted_at)
      ) ENGINE=InnoDB;
    `);

    // 10. Deleted Emergency Requests Archive (Auditing for Admin Dashboard)
    await dbConn.query(`
      CREATE TABLE IF NOT EXISTS deleted_emergencies (
        id VARCHAR(36) PRIMARY KEY,
        original_request_id VARCHAR(36) NOT NULL,
        donor_id VARCHAR(36) NULL,
        requester_name VARCHAR(150) NULL,
        blood_group VARCHAR(10) NOT NULL,
        area VARCHAR(150) NOT NULL,
        contact VARCHAR(20) NOT NULL,
        note TEXT NULL,
        original_status VARCHAR(50) NULL,
        requested_at DATETIME NULL,
        deleted_by VARCHAR(100) NOT NULL,
        deletion_reason TEXT NULL,
        deleted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_del_emg_blood (blood_group),
        INDEX idx_del_emg_area (area),
        INDEX idx_del_emg_time (deleted_at)
      ) ENGINE=InnoDB;
    `);

    // 10.1 User Activity Logs (Tracks user sign-ins, profile edits, emergencies, donations)
    await dbConn.query(`
      CREATE TABLE IF NOT EXISTS user_activity_logs (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NULL,
        user_name VARCHAR(150) NULL,
        user_phone VARCHAR(20) NULL,
        user_email VARCHAR(255) NULL,
        activity_type VARCHAR(50) NOT NULL,
        description TEXT NOT NULL,
        ip_address VARCHAR(45) NULL,
        metadata JSON NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_act_user_id (user_id),
        INDEX idx_act_user_phone (user_phone),
        INDEX idx_act_type (activity_type),
        INDEX idx_act_created (created_at)
      ) ENGINE=InnoDB;
    `);

    // 11. Donor Card Customization Configuration (Admin Editable)
    await dbConn.query(`
      CREATE TABLE IF NOT EXISTS donor_card_config (
        id VARCHAR(36) PRIMARY KEY,
        card_title VARCHAR(150) DEFAULT 'Smart Blood Donor Card',
        card_subtitle VARCHAR(255) DEFAULT 'Sylhet Emergency Blood Network • Darun Donors',
        front_notes TEXT NULL,
        back_terms TEXT NULL,
        emergency_hotline VARCHAR(50) DEFAULT '+880 1700-000000',
        authorized_signatory_title VARCHAR(100) DEFAULT 'Medical & Registry Director',
        badge_accent_color VARCHAR(30) DEFAULT '#dc2626',
        card_theme VARCHAR(50) DEFAULT 'crimson_dark',
        badge_text VARCHAR(100) DEFAULT 'Life Saver',
        issue_org VARCHAR(150) DEFAULT '',
        website_url VARCHAR(150) DEFAULT 'donors.daruntech.com',
        valid_years INT DEFAULT 3,
        show_qr TINYINT(1) DEFAULT 1,
        front_tag_label VARCHAR(100) DEFAULT 'REGISTERED LIFE SAVER',
        qr_label VARCHAR(100) DEFAULT 'SCAN TO VERIFY',
        back_guidelines_title VARCHAR(150) DEFAULT 'Guidelines & Partner Benefits',
        security_strip_text VARCHAR(255) DEFAULT 'DARUN DONORS DIGITAL SECURITY STRIP • VERIFIED VOLUNTARY REGISTRY',
        blood_group_label VARCHAR(50) DEFAULT 'GROUP',
        district_label VARCHAR(100) DEFAULT 'District / Area',
        donations_label VARCHAR(100) DEFAULT 'Total Donations',
        valid_thru_label VARCHAR(100) DEFAULT 'Valid Thru',
        verified_status_text VARCHAR(100) DEFAULT 'Verified Voluntary Donor',
        footer_sponsor_text VARCHAR(255) DEFAULT 'Partner discounts valid at recognized diagnostic centers and clinics.',
        show_magnetic_strip TINYINT(1) DEFAULT 1,
        issued_by_label VARCHAR(50) DEFAULT 'Issued by:',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    // Migration check for donor_card_config columns
    const cardConfigCols = [
      { name: 'card_theme', def: "VARCHAR(50) DEFAULT 'crimson_dark' AFTER badge_accent_color" },
      { name: 'badge_text', def: "VARCHAR(100) DEFAULT 'Life Saver' AFTER card_theme" },
      { name: 'issue_org', def: "VARCHAR(150) DEFAULT 'Darun Tech' AFTER badge_text" },
      { name: 'website_url', def: "VARCHAR(150) DEFAULT 'donors.daruntech.com' AFTER issue_org" },
      { name: 'valid_years', def: 'INT DEFAULT 3 AFTER website_url' },
      { name: 'show_qr', def: 'TINYINT(1) DEFAULT 1 AFTER valid_years' },
      { name: 'front_tag_label', def: "VARCHAR(100) DEFAULT 'REGISTERED LIFE SAVER' AFTER show_qr" },
      { name: 'qr_label', def: "VARCHAR(100) DEFAULT 'SCAN TO VERIFY' AFTER front_tag_label" },
      { name: 'back_guidelines_title', def: "VARCHAR(150) DEFAULT 'Guidelines & Partner Benefits' AFTER qr_label" },
      { name: 'security_strip_text', def: "VARCHAR(255) DEFAULT 'DARUN DONORS DIGITAL SECURITY STRIP • VERIFIED VOLUNTARY REGISTRY' AFTER back_guidelines_title" },
      { name: 'blood_group_label', def: "VARCHAR(50) DEFAULT 'GROUP' AFTER security_strip_text" },
      { name: 'district_label', def: "VARCHAR(100) DEFAULT 'District / Area' AFTER blood_group_label" },
      { name: 'donations_label', def: "VARCHAR(100) DEFAULT 'Total Donations' AFTER district_label" },
      { name: 'valid_thru_label', def: "VARCHAR(100) DEFAULT 'Valid Thru' AFTER donations_label" },
      { name: 'verified_status_text', def: "VARCHAR(100) DEFAULT 'Verified Voluntary Donor' AFTER valid_thru_label" },
      { name: 'footer_sponsor_text', def: "VARCHAR(255) DEFAULT 'Partner discounts valid at recognized diagnostic centers and clinics.' AFTER verified_status_text" },
      { name: 'show_magnetic_strip', def: "TINYINT(1) DEFAULT 1 AFTER footer_sponsor_text" },
      { name: 'issued_by_label', def: "VARCHAR(50) DEFAULT 'Issued by:' AFTER show_magnetic_strip" }
    ];

    for (const c of cardConfigCols) {
      try {
        const [hasCol]: any = await dbConn.query(`
          SELECT COLUMN_NAME 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'donor_card_config' AND COLUMN_NAME = ?
        `, [DB_NAME, c.name]);

        if (!hasCol || hasCol.length === 0) {
          await dbConn.query(`ALTER TABLE donor_card_config ADD COLUMN ${c.name} ${c.def}`);
          console.log(`✅ Added ${c.name} to donor_card_config.`);
        }
      } catch (err: any) {
        console.warn(`Migration check for donor_card_config.${c.name}:`, err.message);
      }
    }

    // One-time cleanup migration: ensure no legacy "Sylhet Health & Blood Foundation" remains in issue_org or issued_by_label
    try {
      await dbConn.query(`
        UPDATE donor_card_config 
        SET 
          issue_org = TRIM(REPLACE(issue_org, 'Sylhet Health & Blood Foundation', '')),
          issued_by_label = CASE 
            WHEN issued_by_label LIKE '%Darun Tech%' THEN 'Issued by:'
            ELSE issued_by_label
          END
        WHERE issue_org LIKE '%Sylhet Health & Blood Foundation%' 
           OR issued_by_label LIKE '%Sylhet Health & Blood Foundation%'
           OR issued_by_label LIKE '%Darun Tech%';
      `);
    } catch (cleanErr: any) {
      console.warn('donor_card_config cleanup migration error:', cleanErr.message);
    }

    // Insert default donor card configuration if empty
    const [cardCfgRows]: any = await dbConn.query('SELECT id FROM donor_card_config LIMIT 1');
    if (!cardCfgRows || cardCfgRows.length === 0) {
      await dbConn.query(`
        INSERT INTO donor_card_config (id, card_title, card_subtitle, front_notes, back_terms, emergency_hotline, authorized_signatory_title, badge_accent_color, card_theme, badge_text, issue_org, website_url, valid_years, show_qr)
        VALUES (
          'default_config',
          'Smart Blood Donor Card',
          'Sylhet Emergency Blood Network • Darun Donors',
          'This card certifies that the bearer is a verified voluntary blood donor dedicated to saving human lives.',
          '1. This card is non-transferable and strictly voluntary.\\n2. Valid across partner health clinics, blood transfusion centers, and community sponsors.\\n3. Present this card or QR code to redeem partner benefits and donor discounts.\\n4. Always verify medical eligibility before transfusion.',
          '+880 1700-000000',
          'Medical & Registry Director',
          '#dc2626',
          'crimson_dark',
          'Life Saver',
          '',
          'donors.daruntech.com',
          3,
          1
        )
      `);
    }

    // 12. Donor Card Sponsorship Offers & Partner Discounts
    await dbConn.query(`
      CREATE TABLE IF NOT EXISTS donor_card_offers (
        id VARCHAR(36) PRIMARY KEY,
        sponsor_name VARCHAR(150) NOT NULL,
        sponsor_logo VARCHAR(500) NULL,
        title VARCHAR(200) NOT NULL,
        discount_text VARCHAR(100) NOT NULL,
        description TEXT NULL,
        promo_code VARCHAR(50) NULL,
        valid_until VARCHAR(100) NULL,
        category VARCHAR(50) DEFAULT 'healthcare',
        is_active TINYINT(1) DEFAULT 1 NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    // Seed initial sponsorship offers if table is empty
    const [offerRows]: any = await dbConn.query('SELECT id FROM donor_card_offers LIMIT 1');
    if (!offerRows || offerRows.length === 0) {
      await dbConn.query(`
        INSERT INTO donor_card_offers (id, sponsor_name, title, discount_text, description, promo_code, valid_until, category, is_active)
        VALUES 
        (
          'offer-1',
          'Popular Diagnostic Centre',
          'Full Blood & Health Checkup Package',
          '25% OFF',
          'Special discount for registered voluntary donors on CBC, Serum Ferritin, and screening profiles.',
          'DARUNHEALTH25',
          'Dec 31, 2026',
          'diagnostic',
          1
        ),
        (
          'offer-2',
          'Sylhet Eye Hospital & Laser',
          'Free Consultation & Eye Checkup',
          '100% FREE',
          'Complimentary comprehensive vision screening and consultation upon presenting this card.',
          'DARUNEYE',
          'Dec 31, 2026',
          'consultation',
          1
        ),
        (
          'offer-3',
          'MedLife Pharmacy Network',
          'Prescription Medicines & First Aid',
          '12% OFF',
          'Instant flat discount on all essential medicines and first-aid kits across Sylhet branches.',
          'DARUNMED12',
          'Dec 31, 2026',
          'pharmacy',
          1
        )
      `);
    }

    // Cleanup mock data and test emergencies
    try {
      await dbConn.query(`
        DELETE FROM emergency_requests 
        WHERE note = 'aaaaa' 
           OR note LIKE '%aaaa%'
           OR contact IN ('01711223344', '01811223344')
           OR contact LIKE '01715%7';
      `);
      await dbConn.query(`
        DELETE FROM donors 
        WHERE phone IN (
          '01943157539', '01842522900', '01867895666', '01818510112', 
          '01523011555', '01651015158', '01757746456', '01977304373', 
          '01965758903', '01927566808', '01335306976', '01745485364'
        ) OR name IN ('Keya Ali', 'Hasan Hasan', 'Sadia Kazi', 'Mariam Kazi', 'Sujon Sheikh');
      `);
      console.log('🧹 Cleaned up mock donors and test emergency requests from database.');
    } catch (cleanupErr: any) {
      console.warn('Mock cleanup note:', cleanupErr.message);
    }

    // Seed default admin if not exists
    const adminUser = 'adilhussa1n';
    const adminPass = 'Adil@1267';
    const [existingAdmin]: any = await dbConn.query('SELECT id FROM admins WHERE username = ?', [adminUser]);

    if (!existingAdmin || existingAdmin.length === 0) {
      const hashedPass = await bcrypt.hash(adminPass, 10);
      await dbConn.query(
        'INSERT INTO admins (id, username, password_hash) VALUES (?, ?, ?)',
        [crypto.randomUUID(), adminUser, hashedPass]
      );
      console.log(`✅ Default admin created: ${adminUser}`);
    }

    // Register Google admin emails (ADMIN_GOOGLE_EMAIL) in the admins table
    const adminEmails = (process.env.ADMIN_GOOGLE_EMAIL || process.env.ADMIN_EMAIL || 'adilh5353@gmail.com,daruntech.pvt.ltd@gmail.com')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);
    for (const email of adminEmails) {
      const [existing]: any = await dbConn.query('SELECT id FROM admins WHERE LOWER(username) = ?', [email]);
      if (!existing || existing.length === 0) {
        // Google admins sign in via OAuth; store an unusable random password hash
        const unusableHash = await bcrypt.hash(crypto.randomUUID(), 10);
        await dbConn.query(
          'INSERT INTO admins (id, username, password_hash) VALUES (?, ?, ?)',
          [crypto.randomUUID(), email, unusableHash]
        );
        console.log(`✅ Admin registered: ${email}`);
      }
    }

    await dbConn.end();
    console.log('🎉 Database initialization complete!');
    return true;
  } catch (err: any) {
    console.error('❌ Database Initialization Error:', err.message);
    await dbConn.end();
    return false;
  }
}

// Allow direct execution via command line: npm run db:init
if (process.argv[1] && process.argv[1].includes('initDb')) {
  initDatabase().then((success) => {
    process.exit(success ? 0 : 1);
  });
}
