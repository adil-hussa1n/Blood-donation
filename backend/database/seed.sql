USE blood_donation_db;

-- 1. SEED DEFAULT ADMIN (Username: adilhussa1n, Password: Adil@1267)
-- bcrypt hash for 'Adil@1267' with cost factor 10: $2a$10$wL4g8k/qB1Vd3HhJt.t4k.q49bK4WjE17S.Lp3u3QpYvBvG8M9wXG
INSERT INTO admins (id, username, password_hash)
VALUES ('admin-default-id', 'adilhussa1n', '$2a$10$wL4g8k/qB1Vd3HhJt.t4k.q49bK4WjE17S.Lp3u3QpYvBvG8M9wXG')
ON DUPLICATE KEY UPDATE username = username;

-- 2. SEED SAMPLE SYLHET DONORS (Default password: '123456')
-- bcrypt hash for '123456': $2a$10$r9c0E25c0P6j3d3k1z0CkuT6s9w2A5b1l8F4q3z7v1m9k2j5h8x3O
INSERT INTO donors (id, name, phone, blood_group, area, last_donation_date, is_available, total_donations, lifetime_donation_count, password_hash, dob)
VALUES
  (UUID(), 'Keya Ali', '01943157539', 'B+', 'Jaintiapur Upazila', '2025-11-02', 1, 4, 4, '$2a$10$r9c0E25c0P6j3d3k1z0CkuT6s9w2A5b1l8F4q3z7v1m9k2j5h8x3O', '1994-11-08'),
  (UUID(), 'Hasan Hasan', '01842522900', 'O+', 'Companiganj Upazila', NULL, 1, 0, 0, '$2a$10$r9c0E25c0P6j3d3k1z0CkuT6s9w2A5b1l8F4q3z7v1m9k2j5h8x3O', '1980-03-11'),
  (UUID(), 'Sadia Kazi', '01867895666', 'O+', 'Beanibazar Upazila', NULL, 1, 0, 0, '$2a$10$r9c0E25c0P6j3d3k1z0CkuT6s9w2A5b1l8F4q3z7v1m9k2j5h8x3O', '1998-03-20'),
  (UUID(), 'Mariam Kazi', '01818510112', 'B-', 'Zakiganj Upazila', NULL, 1, 0, 0, '$2a$10$r9c0E25c0P6j3d3k1z0CkuT6s9w2A5b1l8F4q3z7v1m9k2j5h8x3O', '2000-06-01'),
  (UUID(), 'Sujon Sheikh', '01523011555', 'B+', 'Golapganj Upazila', '2026-05-31', 0, 14, 14, '$2a$10$r9c0E25c0P6j3d3k1z0CkuT6s9w2A5b1l8F4q3z7v1m9k2j5h8x3O', '1998-05-21'),
  (UUID(), 'Jamil Ahmed', '01651015158', 'O-', 'Companiganj Upazila', NULL, 1, 0, 0, '$2a$10$r9c0E25c0P6j3d3k1z0CkuT6s9w2A5b1l8F4q3z7v1m9k2j5h8x3O', '1975-08-25'),
  (UUID(), 'Keya Miah', '01757746456', 'AB+', 'Fenchuganj Upazila', NULL, 1, 0, 0, '$2a$10$r9c0E25c0P6j3d3k1z0CkuT6s9w2A5b1l8F4q3z7v1m9k2j5h8x3O', '1997-09-10'),
  (UUID(), 'Raju Hussain', '01977304373', 'B-', 'Golapganj Upazila', '2025-11-14', 1, 2, 2, '$2a$10$r9c0E25c0P6j3d3k1z0CkuT6s9w2A5b1l8F4q3z7v1m9k2j5h8x3O', '1987-08-07'),
  (UUID(), 'Shahin Hussain', '01965758903', 'AB-', 'Golapganj Upazila', '2026-06-07', 0, 3, 3, '$2a$10$r9c0E25c0P6j3d3k1z0CkuT6s9w2A5b1l8F4q3z7v1m9k2j5h8x3O', '1981-03-13'),
  (UUID(), 'Tania Munshi', '01927566808', 'O+', 'Sylhet City Corporation', '2026-05-06', 0, 2, 2, '$2a$10$r9c0E25c0P6j3d3k1z0CkuT6s9w2A5b1l8F4q3z7v1m9k2j5h8x3O', '1984-09-12'),
  (UUID(), 'Afsana Alam', '01335306976', 'B+', 'Sylhet City Corporation', '2026-03-07', 1, 2, 2, '$2a$10$r9c0E25c0P6j3d3k1z0CkuT6s9w2A5b1l8F4q3z7v1m9k2j5h8x3O', '2000-02-17'),
  (UUID(), 'Farhana Patwary', '01745485364', 'A-', 'Sylhet City Corporation', '2026-02-27', 1, 9, 9, '$2a$10$r9c0E25c0P6j3d3k1z0CkuT6s9w2A5b1l8F4q3z7v1m9k2j5h8x3O', '1984-09-19')
ON DUPLICATE KEY UPDATE phone = phone;

-- 3. SEED SAMPLE EMERGENCY REQUESTS
INSERT INTO emergency_requests (id, blood_group, area, contact, note, passcode, status)
VALUES
  (UUID(), 'O+', 'Sylhet Sadar Upazila', '01711223344', 'Urgent need for surgery at MAG Osmani Medical College Hospital', '$2a$10$r9c0E25c0P6j3d3k1z0CkuT6s9w2A5b1l8F4q3z7v1m9k2j5h8x3O', 'needed'),
  (UUID(), 'B+', 'Sylhet City Corporation', '01811223344', 'Platelets required urgently for Dengue patient', '$2a$10$r9c0E25c0P6j3d3k1z0CkuT6s9w2A5b1l8F4q3z7v1m9k2j5h8x3O', 'needed')
ON DUPLICATE KEY UPDATE id = id;
