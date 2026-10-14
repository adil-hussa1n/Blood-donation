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

  // Step 1: Connect without database specified to create database if not exists
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
    console.error('❌ Failed to create/verify database:', err.message);
    if (rootConn) await rootConn.end();
    return false;
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

    // Seed initial Sylhet demo donors if donors table is empty
    const [donorsCount]: any = await dbConn.query('SELECT COUNT(*) as count FROM donors');
    if (donorsCount[0].count === 0) {
      console.log('🌱 Seeding sample donors from Sylhet...');
      const defaultDonorHash = await bcrypt.hash('123456', 10);

      const demoDonors = [
        ['Keya Ali', '01943157539', 'B+', 'Jaintiapur Upazila', '2025-11-02', 1, 4, 4, defaultDonorHash, '1994-11-08'],
        ['Hasan Hasan', '01842522900', 'O+', 'Companiganj Upazila', null, 1, 0, 0, defaultDonorHash, '1980-03-11'],
        ['Sadia Kazi', '01867895666', 'O+', 'Beanibazar Upazila', null, 1, 0, 0, defaultDonorHash, '1998-03-20'],
        ['Mariam Kazi', '01818510112', 'B-', 'Zakiganj Upazila', null, 1, 0, 0, defaultDonorHash, '2000-06-01'],
        ['Sujon Sheikh', '01523011555', 'B+', 'Golapganj Upazila', '2026-05-31', 0, 14, 14, defaultDonorHash, '1998-05-21'],
        ['Jamil Ahmed', '01651015158', 'O-', 'Companiganj Upazila', null, 1, 0, 0, defaultDonorHash, '1975-08-25'],
        ['Keya Miah', '01757746456', 'AB+', 'Fenchuganj Upazila', null, 1, 0, 0, defaultDonorHash, '1997-09-10'],
        ['Raju Hussain', '01977304373', 'B-', 'Golapganj Upazila', '2025-11-14', 1, 2, 2, defaultDonorHash, '1987-08-07'],
        ['Shahin Hussain', '01965758903', 'AB-', 'Golapganj Upazila', '2026-06-07', 0, 3, 3, defaultDonorHash, '1981-03-13'],
        ['Tania Munshi', '01927566808', 'O+', 'Sylhet City Corporation', '2026-05-06', 0, 2, 2, defaultDonorHash, '1984-09-12'],
        ['Afsana Alam', '01335306976', 'B+', 'Sylhet City Corporation', '2026-03-07', 1, 2, 2, defaultDonorHash, '2000-02-17'],
        ['Farhana Patwary', '01745485364', 'A-', 'Sylhet City Corporation', '2026-02-27', 1, 9, 9, defaultDonorHash, '1984-09-19']
      ];

      for (const donor of demoDonors) {
        await dbConn.query(
          `INSERT INTO donors 
           (id, name, phone, blood_group, area, last_donation_date, is_available, total_donations, lifetime_donation_count, password_hash, dob) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [crypto.randomUUID(), ...donor]
        );
      }
      console.log('✅ Demo donors seeded.');
    }

    // Seed sample emergency requests if empty
    const [emergenciesCount]: any = await dbConn.query('SELECT COUNT(*) as count FROM emergency_requests');
    if (emergenciesCount[0].count === 0) {
      console.log('🌱 Seeding initial emergency requests...');
      await dbConn.query(
        `INSERT INTO emergency_requests (id, blood_group, area, contact, note, passcode, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          crypto.randomUUID(),
          'O+',
          'Sylhet Sadar Upazila',
          '01711223344',
          'Urgent need for surgery at MAG Osmani Medical College Hospital',
          '1234',
          'needed'
        ]
      );
      console.log('✅ Demo emergency request seeded.');
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
