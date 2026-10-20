import { Router } from 'express';
import { testDbConnection } from '../config/db.js';
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
  getDonorCardConfig,
  updateDonorCardConfig,
  getDonorCardOffers,
  createDonorCardOffer,
  updateDonorCardOffer,
  deleteDonorCardOffer,
  getUserActivityLogs,
  updateDonorDetailsByAdmin,
  updateEmergencyDetailsByAdmin,
  createDonorWarning,
  getDonorWarnings,
  deleteDonorWarning,
  getWarningsForDonor,
  acknowledgeDonorWarning,
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

// Health Check & Database Status
router.get('/health', async (req, res) => {
  const dbConnected = await testDbConnection();
  if (!dbConnected) {
    res.status(503).json({
      status: 'maintenance',
      database: 'disconnected',
      message: 'System database is undergoing scheduled maintenance or temporarily unavailable.',
      timestamp: new Date().toISOString()
    });
    return;
  }

  res.json({
    status: 'ok',
    database: 'connected',
    timestamp: new Date().toISOString()
  });
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
router.get('/admin/activity-logs', requireAdmin, getUserActivityLogs);
router.put('/admin/donors/:id', requireAdmin, updateDonorDetailsByAdmin);
router.put('/admin/emergencies/:id', requireAdmin, updateEmergencyDetailsByAdmin);

// ==========================================
// DONOR ALERTS & WARNINGS
// ==========================================
router.post('/admin/warnings', requireAdmin, createDonorWarning);
router.get('/admin/warnings', requireAdmin, getDonorWarnings);
router.delete('/admin/warnings/:id', requireAdmin, deleteDonorWarning);
router.get('/donors/:phone/warnings', getWarningsForDonor);
router.post('/donors/warnings/:id/acknowledge', acknowledgeDonorWarning);

// ==========================================
// SUPPORT & PROBLEM TICKETS
// ==========================================
router.post('/support', submitSupportRequest);
router.get('/support', requireAdmin, getSupportRequests);

// Donor Card Configuration & Sponsorship Offers (Public view + Admin management)
router.get('/donor-card/config', getDonorCardConfig);
router.put('/donor-card/config', requireAdmin, updateDonorCardConfig);
router.get('/donor-card/offers', getDonorCardOffers);
router.post('/donor-card/offers', requireAdmin, createDonorCardOffer);
router.put('/donor-card/offers/:id', requireAdmin, updateDonorCardOffer);
router.delete('/donor-card/offers/:id', requireAdmin, deleteDonorCardOffer);

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
