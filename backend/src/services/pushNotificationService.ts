import webpush from 'web-push';
import crypto from 'crypto';
import { pool } from '../config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BGTKkBypvKntkd3jZFPHUb7FQHNDv9I7rn_8Ll1OaoCvHT_r1iV8ysHyNEAmWSMfKyH7csp3W6npZmtKO26KGho';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'YpwM87hXyn9rO99XOajLwzC195wt5QqSfPNwanISvL0';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@daruntech.com';

// Configure Web Push with VAPID details
try {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  console.log('✅ Web Push initialized with VAPID configuration.');
} catch (e: any) {
  console.error('❌ Failed to initialize Web Push VAPID:', e.message);
}

// Blood compatibility mapping
export const BLOOD_COMPATIBILITY: Record<string, string[]> = {
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'A-': ['A-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  'AB-': ['AB-', 'A-', 'B-', 'O-'],
  'O+': ['O+', 'O-'],
  'O-': ['O-'],
};

export function isBloodCompatible(donorBloodGroup?: string, requestedBloodGroup?: string): boolean {
  if (!donorBloodGroup || !requestedBloodGroup) return false;
  const cleanDonor = donorBloodGroup.trim().toUpperCase();
  const cleanReq = requestedBloodGroup.trim().toUpperCase();
  if (cleanDonor === cleanReq || cleanDonor === 'O-') return true;
  const list = BLOOD_COMPATIBILITY[cleanReq] || [cleanReq];
  return list.includes(cleanDonor);
}

/**
 * Return public VAPID key to client
 */
export function getVapidPublicKey() {
  return VAPID_PUBLIC_KEY;
}

/**
 * Save or update a Web Push subscription
 */
export async function savePushSubscription(sub: {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  donorId?: string;
  bloodGroup?: string;
  area?: string;
}) {
  if (!sub.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
    throw new Error('Invalid push subscription payload');
  }

  const endpointHash = crypto.createHash('sha256').update(sub.endpoint).digest('hex');
  const id = crypto.randomUUID();

  await pool.query(
    `INSERT INTO push_subscriptions 
      (id, endpoint, p256dh, auth, donor_id, blood_group, area, endpoint_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
      p256dh = VALUES(p256dh),
      auth = VALUES(auth),
      donor_id = COALESCE(VALUES(donor_id), donor_id),
      blood_group = COALESCE(VALUES(blood_group), blood_group),
      area = COALESCE(VALUES(area), area),
      updated_at = NOW()`,
    [
      id,
      sub.endpoint,
      sub.keys.p256dh,
      sub.keys.auth,
      sub.donorId || null,
      sub.bloodGroup || null,
      sub.area || null,
      endpointHash,
    ]
  );

  return { success: true };
}

/**
 * Delete a Web Push subscription
 */
export async function deletePushSubscription(endpoint: string) {
  if (!endpoint) return;
  const endpointHash = crypto.createHash('sha256').update(endpoint).digest('hex');
  await pool.query('DELETE FROM push_subscriptions WHERE endpoint_hash = ?', [endpointHash]);
}

/**
 * Dispatch background Web Push to matching subscribed devices (Android, iOS Home Screen PWA, Windows/macOS)
 */
export async function broadcastEmergencyPush(emergency: {
  id: string;
  blood_group: string;
  area: string;
  contact?: string;
  note?: string;
  donor_id?: string;
}) {
  try {
    const [rows]: any = await pool.query('SELECT * FROM push_subscriptions');
    if (!rows || rows.length === 0) {
      console.log('ℹ️ No push subscribers registered yet.');
      return;
    }

    const payload = JSON.stringify({
      title: `🚨 জরুরি ${emergency.blood_group} রক্তের প্রয়োজন! (Urgent)`,
      body: `স্থান: ${emergency.area} | যোগাযোগ: ${emergency.contact || 'জরুরি ফিড'}\n${emergency.note ? emergency.note.slice(0, 60) : 'একটি জীবন বাঁচাতে দ্রুত এগিয়ে আসুন।'}`,
      icon: '/apple-touch-icon-180x180.png',
      badge: '/apple-touch-icon-180x180.png',
      tag: `emergency-${emergency.id}`,
      data: {
        url: '/emergency',
        requestId: emergency.id,
        bloodGroup: emergency.blood_group,
        area: emergency.area,
      },
    });

    const sendPromises = rows.map(async (subRow: any) => {
      // 1. Skip notifying the person who created this request
      if (emergency.donor_id && subRow.donor_id === emergency.donor_id) {
        return;
      }

      // 2. Compatibility check if subscriber provided blood group
      if (subRow.blood_group && !isBloodCompatible(subRow.blood_group, emergency.blood_group)) {
        return;
      }

      const pushSub = {
        endpoint: subRow.endpoint,
        keys: {
          p256dh: subRow.p256dh,
          auth: subRow.auth,
        },
      };

      try {
        await webpush.sendNotification(pushSub, payload, {
          TTL: 60 * 60 * 12, // 12 hours
          urgency: 'high',
        });
      } catch (err: any) {
        // If subscription is 404 or 410 Gone, remove from database
        if (err.statusCode === 404 || err.statusCode === 410) {
          console.log(`🧹 Removing expired push subscription: ${subRow.id}`);
          await pool.query('DELETE FROM push_subscriptions WHERE id = ?', [subRow.id]);
        } else {
          console.warn(`⚠️ Failed to send push to subscription ${subRow.id}:`, err.message);
        }
      }
    });

    await Promise.allSettled(sendPromises);
    console.log(`📡 Broadcasted background emergency push for ${emergency.blood_group} in ${emergency.area}`);
  } catch (error: any) {
    console.error('❌ Failed to broadcast emergency push:', error);
  }
}

/**
 * Dispatch a direct background Web Push alert to a specific donor
 */
export async function sendDonorDirectNotification(donorId: string, phone: string, title: string, body: string, url: string = '/register') {
  try {
    const [rows]: any = await pool.query(
      'SELECT * FROM push_subscriptions WHERE donor_id = ?',
      [donorId]
    );

    if (!rows || rows.length === 0) {
      return;
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: '/apple-touch-icon-180x180.png',
      badge: '/apple-touch-icon-180x180.png',
      tag: `donor-warning-${Date.now()}`,
      data: {
        url,
        donorId,
        phone,
      },
    });

    const sendPromises = rows.map(async (subRow: any) => {
      const pushSub = {
        endpoint: subRow.endpoint,
        keys: {
          p256dh: subRow.p256dh,
          auth: subRow.auth,
        },
      };

      try {
        await webpush.sendNotification(pushSub, payload, {
          TTL: 60 * 60 * 24, // 24 hours
          urgency: 'high',
        });
      } catch (err: any) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await pool.query('DELETE FROM push_subscriptions WHERE id = ?', [subRow.id]);
        }
      }
    });

    await Promise.allSettled(sendPromises);
  } catch (error: any) {
    console.warn('Direct donor push notification failed:', error.message);
  }
}
