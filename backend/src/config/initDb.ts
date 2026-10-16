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

    console.log('✅ All tables verified/created successfully.');

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
