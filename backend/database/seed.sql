USE blood_donation_db;

-- 1. SEED GOOGLE ADMIN ACCOUNTS (Admins authenticate strictly via Google Authentication)
INSERT INTO admins (id, username, password_hash)
VALUES 
  ('admin-adilh5353', 'adilh5353@gmail.com', 'GOOGLE_OAUTH_AUTHENTICATED'),
  ('admin-daruntech', 'daruntech.pvt.ltd@gmail.com', 'GOOGLE_OAUTH_AUTHENTICATED')
ON DUPLICATE KEY UPDATE username = username;
