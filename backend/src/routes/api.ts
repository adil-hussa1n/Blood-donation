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
} from '../controllers/adminController.js';
import {
  submitSupportRequest,
  getSupportRequests,
} from '../controllers/supportController.js';
import { honeypotCheck, registrationRateLimiter } from '../middleware/rateLimiter.js';
import { requireAdmin } from '../middleware/auth.js';

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
router.post('/donors/login', verifyDonor);
router.post('/auth/google', googleAuth);
router.patch('/donors/:id/availability', updateDonorAvailability);
router.put('/donors/:id', updateDonorProfile);
router.post('/donors/reset-password', resetDonorPassword);
router.post('/donors/:id/donations', addDonationEvent);
router.get('/donors/:id/history', getDonationHistory);
router.delete('/donors/:id', requireAdmin, deleteDonor);

// ==========================================
// EMERGENCY REQUESTS ROUTES
// ==========================================
router.get('/emergencies', getEmergencyRequests);
router.post('/emergencies', honeypotCheck, createEmergencyRequest);
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

// ==========================================
// SUPPORT & PROBLEM REPORTS ROUTES
// ==========================================
router.post('/support', submitSupportRequest);
router.get('/support', requireAdmin, getSupportRequests);

export default router;
