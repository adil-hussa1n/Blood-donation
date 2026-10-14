-- =============================================================================
-- BLOOD DONATION PLATFORM - MYSQL SCHEMA
-- Compatible with MySQL 8.0+ / MariaDB 10.5+
-- =============================================================================

CREATE DATABASE IF NOT EXISTS blood_donation_db 
  DEFAULT CHARACTER SET utf8mb4 
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE blood_donation_db;

-- 1. ADMINS TABLE
CREATE TABLE IF NOT EXISTS admins (
  id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. BLOCKED DONORS TABLE
CREATE TABLE IF NOT EXISTS blocked_donors (
  phone VARCHAR(20) PRIMARY KEY,
  reason TEXT,
  blocked_by VARCHAR(100),
  blocked_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. DONORS TABLE
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

-- 4. DONATION HISTORY TABLE
CREATE TABLE IF NOT EXISTS donation_history (
  id VARCHAR(36) PRIMARY KEY,
  donor_id VARCHAR(36) NOT NULL,
  donation_date DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (donor_id) REFERENCES donors(id) ON DELETE CASCADE,
  INDEX idx_donor_id (donor_id),
  INDEX idx_donation_date (donation_date)
) ENGINE=InnoDB;

-- 5. EMERGENCY REQUESTS TABLE
CREATE TABLE IF NOT EXISTS emergency_requests (
  id VARCHAR(36) PRIMARY KEY,
  blood_group VARCHAR(10) NOT NULL,
  area VARCHAR(150) NOT NULL,
  contact VARCHAR(20) NOT NULL,
  note TEXT,
  passcode VARCHAR(100) NOT NULL,
  status ENUM('needed', 'responded', 'fulfilled') DEFAULT 'needed' NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_emergency_status (status),
  INDEX idx_emergency_created (created_at)
) ENGINE=InnoDB;

-- 6. SUPPORT REQUESTS TABLE
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

-- 7. RATE LIMIT LOGS TABLE
CREATE TABLE IF NOT EXISTS rate_limit_logs (
  id VARCHAR(36) PRIMARY KEY,
  ip_address VARCHAR(45) NOT NULL,
  request_type VARCHAR(50) NOT NULL,
  status ENUM('allowed', 'blocked') NOT NULL,
  reason VARCHAR(100) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_rate_ip_time (ip_address, created_at)
) ENGINE=InnoDB;
