import cron from 'node-cron';
import pool from '../config/db.js';

export async function runMaintenance(): Promise<void> {
  try {
    // 1. Reset availability for donors after 90 days cooldown
    const [cooldownResult]: any = await pool.query(`
      UPDATE donors 
      SET is_available = 1 
      WHERE is_available = 0 
        AND last_donation_date IS NOT NULL 
        AND last_donation_date <= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
    `);

    if (cooldownResult?.affectedRows > 0) {
      console.log(`[Cron] Reset cooldown for ${cooldownResult.affectedRows} donors.`);
    }

    // 2. Prune emergency requests older than 24 hours
    const [pruneResult]: any = await pool.query(`
      DELETE FROM emergency_requests 
      WHERE created_at <= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `);

    if (pruneResult?.affectedRows > 0) {
      console.log(`[Cron] Pruned ${pruneResult.affectedRows} expired emergency requests.`);
    }
  } catch (err: any) {
    console.error('[Cron] Maintenance job failed:', err.message);
  }
}

export function startMaintenanceCron(): void {
  // Run on startup
  runMaintenance();

  // Run every hour at minute 0
  cron.schedule('0 * * * *', () => {
    console.log('[Cron] Running scheduled hourly maintenance...');
    runMaintenance();
  });

  console.log('⏰ Hourly maintenance cron scheduler active.');
}
