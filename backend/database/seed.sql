USE blood_donation_db;

-- 1. SEED DEFAULT ADMIN (Username: adilhussa1n, Password: Adil@1267)
-- bcrypt hash for 'Adil@1267' with cost factor 10: $2a$10$wL4g8k/qB1Vd3HhJt.t4k.q49bK4WjE17S.Lp3u3QpYvBvG8M9wXG
INSERT INTO admins (id, username, password_hash)
VALUES ('admin-default-id', 'adilhussa1n', '$2a$10$wL4g8k/qB1Vd3HhJt.t4k.q49bK4WjE17S.Lp3u3QpYvBvG8M9wXG')
ON DUPLICATE KEY UPDATE username = username;
