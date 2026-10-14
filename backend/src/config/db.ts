import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'blood_donation_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true, // Prevents timezone date offset issues with DATE columns
  charset: 'utf8mb4',
});

// Helper to test database connectivity
export async function testDbConnection(): Promise<boolean> {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ Connected to MySQL database successfully.');
    return true;
  } catch (error: any) {
    console.error('❌ MySQL Connection Error:', error.message);
    console.warn(
      '⚠️ Ensure your MySQL server is running and database configuration in backend/.env is correct.'
    );
    return false;
  }
}

export default pool;
