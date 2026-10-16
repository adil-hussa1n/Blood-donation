import { Router } from 'express';
import {
  getDonors,
  getDonorByPhone,
  registerDonor,
  verifyDonor,
  updateDonorAvailability,
  updateDonorProfile,
  resetDonorPassword,
  addDonationEvent,
  getDonationHistory,
  deleteDonor,
  googleAuth,
} from '../controllers/donorController.js';
import {
  getEmergencyRequests,
  createEmergencyRequest,
  updateEmergencyRequestStatus,
  deleteEmergencyRequest,
} from '../controllers/emergencyController.js';
import {
  googleAdminLogin,
  verifyAdminCredentials,
  blockDonorByPhone,
  unblockDonorByPhone,
  getBlockedPhones,
  checkIfBlocked,
  getDeletedDonors,
  getDeletedEmergencies,
} from '../controllers/adminController.js';
import {
  submitSupportRequest,
  getSupportRequests,
} from '../controllers/supportController.js';
import {
  getVapidPublicKey,
  savePushSubscription,
  deletePushSubscription,
} from '../services/pushNotificationService.js';
import { 
  honeypotCheck, 
  registrationRateLimiter, 
  loginRateLimiter, 
  resetPasswordRateLimiter, 
  emergencyRequestRateLimiter 
} from '../middleware/rateLimiter.js';
import { requireAdmin, requireAdminOrDonor } from '../middleware/auth.js';

const router = Router();

// Health Check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==========================================
// DONORS ROUTES
// ==========================================
router.get('/donors', getDonors);
router.get('/donors/:phone', getDonorByPhone);
router.post('/donors/register', honeypotCheck, registrationRateLimiter(5), registerDonor);
router.post('/donors/login', loginRateLimiter(8, 10), verifyDonor);
router.post('/auth/google', googleAuth);
router.patch('/donors/:id/availability', updateDonorAvailability);
router.put('/donors/:id', updateDonorProfile);
router.post('/donors/reset-password', resetPasswordRateLimiter(5, 15), resetDonorPassword);
router.post('/donors/:id/donations', addDonationEvent);
router.get('/donors/:id/history', getDonationHistory);
router.delete('/donors/:id', requireAdminOrDonor, deleteDonor);

// ==========================================
// EMERGENCY REQUESTS ROUTES
// ==========================================
router.get('/emergencies', getEmergencyRequests);
router.post('/emergencies', honeypotCheck, emergencyRequestRateLimiter(3, 15), createEmergencyRequest);
router.patch('/emergencies/:id/status', updateEmergencyRequestStatus);
router.delete('/emergencies/:id', deleteEmergencyRequest);

// ==========================================
// ADMIN & SECURITY ROUTES
// ==========================================
router.post('/admin/google-login', googleAdminLogin);
router.post('/admin/login', verifyAdminCredentials);
router.post('/admin/block', requireAdmin, blockDonorByPhone);
router.delete('/admin/block/:phone', requireAdmin, unblockDonorByPhone);
router.get('/admin/blocked', requireAdmin, getBlockedPhones);
router.get('/admin/check-blocked/:phone', checkIfBlocked);
router.get('/admin/deleted-donors', requireAdmin, getDeletedDonors);
router.get('/admin/deleted-emergencies', requireAdmin, getDeletedEmergencies);

// ==========================================
// PUSH NOTIFICATIONS ROUTES
// ==========================================
router.get('/push/vapid-public-key', (req, res) => {
  res.json({ publicKey: getVapidPublicKey() });
});
router.post('/push/subscribe', async (req, res) => {
  try {
    await savePushSubscription(req.body);
    res.status(201).json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: { message: err.message } });
  }
});
router.post('/push/unsubscribe', async (req, res) => {
  try {
    await deletePushSubscription(req.body.endpoint);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: { message: err.message } });
  }
});

export default router;
