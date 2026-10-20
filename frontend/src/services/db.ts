import { isDemoMode, getApiUrl } from './apiConfig';
import { Donor, EmergencyRequest, SupportRequest, DonationEvent } from '../types';

import { appStorage as localStore } from './storage';

const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export function isDatabaseOrConnectionError(errMsg?: string | null): boolean {
  if (!errMsg) return false;
  const msg = String(errMsg).toLowerCase();
  return (
    msg.includes('cannot reach the backend') ||
    msg.includes('econnrefused') ||
    msg.includes('network error') ||
    msg.includes('failed to fetch') ||
    msg.includes('networkrequestfailed') ||
    msg.includes('database is undergoing scheduled maintenance') ||
    msg.includes('system is currently undergoing maintenance') ||
    msg.includes('connect etimedout') ||
    msg.includes('econnreset') ||
    msg.includes('protocol_connection_lost') ||
    msg.includes('er_con_count_error') ||
    msg.includes('too many connections') ||
    msg.includes('database error') ||
    msg.includes('service unavailable') ||
    msg.includes('http 502') ||
    msg.includes('http 503') ||
    msg.includes('http 504') ||
    msg.includes('bad gateway') ||
    msg.includes('gateway timeout')
  );
}

// Generic HTTP request helper
async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: { message: string } | null; success?: boolean; isMaintenance?: boolean }> {
  try {
    const url = getApiUrl(endpoint);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    // Attach admin token if stored
    const adminToken = localStore.getItem('adminToken');
    if (adminToken && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${adminToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const json = await response.json().catch(() => null);

    if (response.status === 503 || json?.status === 'maintenance') {
      return {
        data: null,
        error: { message: json?.message || 'Database connection is temporarily unavailable. System is in maintenance mode.' },
        success: false,
        isMaintenance: true
      };
    }

    if (!response.ok) {
      const errorMsg = json?.error?.message || json?.message || `HTTP ${response.status}: Request failed.`;
      return { data: null, error: { message: errorMsg }, success: false, isMaintenance: isDatabaseOrConnectionError(errorMsg) };
    }

    return {
      data: json?.data !== undefined ? json.data : json,
      error: null,
      success: json?.success !== undefined ? json.success : true,
    };
  } catch (err: any) {
    const errorMsg = err?.message || 'Network error: Cannot reach the backend API server.';
    return {
      data: null,
      error: { message: errorMsg },
      success: false,
      isMaintenance: isDatabaseOrConnectionError(errorMsg),
    };
  }
}

export const dbService = {
  // ==========================================
  // DONORS
  // ==========================================
  async getDonors(): Promise<{ data: Donor[]; error: any }> {
    if (isDemoMode) {
      await delay();
      const donors = JSON.parse(localStore.getItem('bb_donors') || '[]');
      return { data: donors as Donor[], error: null };
    }
    const res = await apiRequest<Donor[]>('/donors');
    return { data: (res.data || []) as Donor[], error: res.error };
  },

  async getDonorByPhone(phone: string): Promise<{ data: Donor | null; error: any }> {
    if (isDemoMode) {
      await delay();
      const donors = JSON.parse(localStore.getItem('bb_donors') || '[]') as Donor[];
      const donor = donors.find((d) => d.phone.trim() === phone.trim());
      return { data: donor || null, error: donor ? null : { message: 'Donor profile not found.' } };
    }
    return await apiRequest<Donor>(`/donors/${encodeURIComponent(phone.trim())}`);
  },

  async registerDonor(donorData: Partial<Donor>, honeypot?: string): Promise<{ data: Donor | null; error: any }> {
    if (isDemoMode) {
      await delay();
      const donors = JSON.parse(localStore.getItem('bb_donors') || '[]') as Donor[];
      const exists = donors.find((d) => d.phone === donorData.phone);
      if (exists) {
        return { data: null, error: { message: `Phone number ${donorData.phone} is already registered.` } };
      }
      const newDonor: Donor = {
        id: generateUUID(),
        name: donorData.name || '',
        phone: donorData.phone || '',
        blood_group: donorData.blood_group || '',
        area: donorData.area || '',
        last_donation_date: donorData.last_donation_date || null,
        is_available: donorData.is_available ?? true,
        total_donations: donorData.total_donations || 0,
        lifetime_donation_count: donorData.total_donations || 0,
        password: donorData.password || '123456',
        dob: donorData.dob || null,
        created_at: new Date().toISOString(),
      };
      donors.unshift(newDonor);
      localStore.setItem('bb_donors', JSON.stringify(donors));
      return { data: newDonor, error: null };
    }

    return await apiRequest<Donor>('/donors/register', {
      method: 'POST',
      body: JSON.stringify({ donorData, honeypot }),
    });
  },

  async updateDonorAvailability(id: string, is_available: boolean, password?: string): Promise<{ data: any; error: any }> {
    if (isDemoMode) {
      await delay();
      const donors = JSON.parse(localStore.getItem('bb_donors') || '[]') as Donor[];
      const index = donors.findIndex((d) => d.id === id);
      if (index !== -1) {
        donors[index].is_available = is_available;
        localStore.setItem('bb_donors', JSON.stringify(donors));
        return { data: donors[index], error: null };
      }
      return { data: null, error: { message: 'Donor not found' } };
    }

    return await apiRequest(`/donors/${id}/availability`, {
      method: 'PATCH',
      body: JSON.stringify({ is_available, password }),
    });
  },

  async updateDonorProfile(id: string, profileData: Partial<Donor>, password?: string): Promise<{ data: Donor | null; error: any }> {
    if (isDemoMode) {
      await delay();
      const donors = JSON.parse(localStore.getItem('bb_donors') || '[]') as Donor[];
      const index = donors.findIndex((d) => d.id === id);
      if (index !== -1) {
        donors[index] = { ...donors[index], ...profileData };
        localStore.setItem('bb_donors', JSON.stringify(donors));
        return { data: donors[index], error: null };
      }
      return { data: null, error: { message: 'Donor not found' } };
    }

    return await apiRequest<Donor>(`/donors/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ profileData, password }),
    });
  },

  async deleteDonor(id: string, adminUsername?: string, adminPassword?: string, options?: { password?: string; isDonorSelfDelete?: boolean }): Promise<{ success: boolean; error: any }> {
    if (isDemoMode) {
      await delay();
      let donors = JSON.parse(localStore.getItem('bb_donors') || '[]') as Donor[];
      donors = donors.filter((d) => d.id !== id);
      localStore.setItem('bb_donors', JSON.stringify(donors));
      return { success: true, error: null };
    }

    const payload: any = {};
    if (adminUsername) payload.adminUsername = adminUsername;
    if (adminPassword) payload.adminPassword = adminPassword;
    if (options?.password) payload.password = options.password;
    if (options?.isDonorSelfDelete) payload.isDonorSelfDelete = true;

    const res = await apiRequest(`/donors/${id}`, {
      method: 'DELETE',
      body: JSON.stringify(payload),
    });
    return { success: !!res.success, error: res.error };
  },

  async resetDonorPassword(name: string, phone: string, blood_group: string, dob: string, new_password: string): Promise<{ success: boolean; error: any }> {
    if (isDemoMode) {
      await delay();
      const donors = JSON.parse(localStore.getItem('bb_donors') || '[]') as Donor[];
      const index = donors.findIndex(
        (d) =>
          d.name.trim().toLowerCase() === name.trim().toLowerCase() &&
          d.phone.trim() === phone.trim() &&
          d.blood_group === blood_group &&
          d.dob === dob
      );
      if (index !== -1) {
        donors[index].password = new_password;
        localStore.setItem('bb_donors', JSON.stringify(donors));
        return { success: true, error: null };
      }
      return { success: false, error: { message: 'Verification failed. No donor matched.' } };
    }

    const res = await apiRequest('/donors/reset-password', {
      method: 'POST',
      body: JSON.stringify({ name, phone, blood_group, dob, new_password }),
    });
    return { success: !!res.success, error: res.error };
  },

  async verifyDonor(phone: string, password?: string): Promise<{ data: Donor | null; error: any }> {
    if (isDemoMode) {
      await delay();
      const donors = JSON.parse(localStore.getItem('bb_donors') || '[]') as Donor[];
      const donor = donors.find((d) => d.phone.trim() === phone.trim() && d.password === password);
      if (!donor) return { data: null, error: { message: 'Invalid phone or password.' } };
      return { data: donor, error: null };
    }

    return await apiRequest<Donor>('/donors/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    });
  },

  async googleAuth(payload: { credential?: string; user?: any }): Promise<{
    success: boolean;
    isNewUser?: boolean;
    donor?: Donor | null;
    googleProfile?: { google_id: string; email: string; name: string; avatar_url: string };
    token?: string;
    error: any;
  }> {
    if (isDemoMode) {
      await delay();
      const donors = JSON.parse(localStore.getItem('bb_donors') || '[]') as Donor[];
      const email = payload.user?.email || 'demo.donor@gmail.com';
      const existing = donors.find((d) => d.email === email);
      if (existing) {
        return { success: true, isNewUser: false, donor: existing, error: null };
      }
      return {
        success: true,
        isNewUser: true,
        googleProfile: {
          google_id: `google_${Date.now()}`,
          email,
          name: payload.user?.name || 'Google Donor',
          avatar_url: payload.user?.picture || '',
        },
        error: null,
      };
    }

    const res = await apiRequest<any>('/auth/google', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.data?.token) {
      localStore.setItem('donorToken', res.data.token);
    }

    return {
      success: !!res.data?.success || (!res.error && !!res.data),
      isNewUser: res.data?.isNewUser,
      donor: res.data?.donor || null,
      googleProfile: res.data?.googleProfile,
      token: res.data?.token,
      error: res.error,
    };
  },

  // ==========================================
  // DONATION HISTORY
  // ==========================================
  async getDonationHistory(donorId: string): Promise<{ data: DonationEvent[]; error: any }> {
    if (isDemoMode) {
      await delay();
      const history = JSON.parse(localStore.getItem('bb_donation_history') || '[]') as DonationEvent[];
      const filtered = history.filter((h) => h.donor_id === donorId);
      return { data: filtered, error: null };
    }

    const res = await apiRequest<DonationEvent[]>(`/donors/${donorId}/history`);
    return { data: res.data || [], error: res.error };
  },

  async addDonationEvent(donorId: string, donationDate: string, password?: string): Promise<{ data: any; error: any }> {
    if (isDemoMode) {
      await delay();
      const history = JSON.parse(localStore.getItem('bb_donation_history') || '[]') as DonationEvent[];
      const newEvent: DonationEvent = {
        id: generateUUID(),
        donor_id: donorId,
        donation_date: donationDate,
      };
      history.push(newEvent);
      localStore.setItem('bb_donation_history', JSON.stringify(history));
      return { data: newEvent, error: null };
    }

    return await apiRequest(`/donors/${donorId}/donations`, {
      method: 'POST',
      body: JSON.stringify({ donation_date: donationDate, password }),
    });
  },

  // ==========================================
  // EMERGENCY REQUESTS
  // ==========================================
  async getEmergencyRequests(): Promise<{ data: EmergencyRequest[]; error: any }> {
    if (isDemoMode) {
      await delay();
      const requests = JSON.parse(localStore.getItem('bb_emergency_requests') || '[]') as EmergencyRequest[];
      return { data: requests, error: null };
    }

    const res = await apiRequest<EmergencyRequest[]>('/emergencies');
    return { data: res.data || [], error: res.error };
  },

  async createEmergencyRequest(requestData: Partial<EmergencyRequest>, honeypot?: string): Promise<{ data: EmergencyRequest | null; error: any }> {
    if (isDemoMode) {
      await delay();
      const requests = JSON.parse(localStore.getItem('bb_emergency_requests') || '[]') as EmergencyRequest[];
      const newRequest: EmergencyRequest = {
        id: generateUUID(),
        blood_group: requestData.blood_group || '',
        area: requestData.area || '',
        contact: requestData.contact || '',
        note: requestData.note || '',
        passcode: requestData.passcode || '1234',
        status: 'needed',
        created_at: new Date().toISOString(),
      };
      requests.unshift(newRequest);
      localStore.setItem('bb_emergency_requests', JSON.stringify(requests));
      return { data: newRequest, error: null };
    }

    return await apiRequest<EmergencyRequest>('/emergencies', {
      method: 'POST',
      body: JSON.stringify({ requestData, honeypot }),
    });
  },

  async updateEmergencyRequestStatus(
    id: string,
    status: 'needed' | 'responded' | 'fulfilled',
    userPasscode?: string,
    adminUsername?: string,
    adminPassword?: string,
    donorId?: string,
    donorPhone?: string
  ): Promise<{ data: any; error: any }> {
    if (isDemoMode) {
      await delay();
      const requests = JSON.parse(localStore.getItem('bb_emergency_requests') || '[]') as EmergencyRequest[];
      const index = requests.findIndex((r) => r.id === id);
      if (index !== -1) {
        requests[index].status = status;
        localStore.setItem('bb_emergency_requests', JSON.stringify(requests));
        return { data: requests[index], error: null };
      }
      return { data: null, error: { message: 'Emergency request not found' } };
    }

    return await apiRequest(`/emergencies/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, userPasscode, adminUsername, adminPassword, donorId, donorPhone }),
    });
  },

  async deleteEmergencyRequest(
    id: string,
    adminUsername?: string,
    adminPassword?: string,
    userPasscode?: string,
    donorId?: string,
    donorPhone?: string
  ): Promise<{ success: boolean; error: any }> {
    if (isDemoMode) {
      await delay();
      let requests = JSON.parse(localStore.getItem('bb_emergency_requests') || '[]') as EmergencyRequest[];
      requests = requests.filter((r) => r.id !== id);
      localStore.setItem('bb_emergency_requests', JSON.stringify(requests));
      return { success: true, error: null };
    }

    const res = await apiRequest(`/emergencies/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ adminUsername, adminPassword, userPasscode, donorId, donorPhone }),
    });
    return { success: !!res.success, error: res.error };
  },

  // ==========================================
  // BLOCKED DONORS & ADMIN
  // ==========================================
  async checkIfBlocked(phone: string): Promise<{ data: boolean; error: any }> {
    if (isDemoMode) {
      const blocked = JSON.parse(localStore.getItem('bb_blocked_donors') || '[]');
      const exists = blocked.find((b: any) => b.phone.trim() === phone.trim());
      return { data: !!exists, error: null };
    }

    const res = await apiRequest<boolean>(`/admin/check-blocked/${encodeURIComponent(phone.trim())}`);
    return { data: Boolean(res.data), error: res.error };
  },

  async blockDonorByPhone(phone: string, adminUsername?: string, adminPassword?: string, reason?: string): Promise<{ success: boolean; error: any }> {
    if (isDemoMode) {
      const blocked = JSON.parse(localStore.getItem('bb_blocked_donors') || '[]');
      if (!blocked.find((b: any) => b.phone === phone)) {
        blocked.push({ phone, reason: reason || 'Blocked by admin', blocked_by: adminUsername, blocked_at: new Date().toISOString() });
        localStore.setItem('bb_blocked_donors', JSON.stringify(blocked));
      }
      return { success: true, error: null };
    }

    const res = await apiRequest('/admin/block', {
      method: 'POST',
      body: JSON.stringify({ phone, adminUsername, adminPassword, reason }),
    });
    return { success: !!res.success, error: res.error };
  },

  async unblockDonorByPhone(phone: string, adminUsername?: string, adminPassword?: string): Promise<{ success: boolean; error: any }> {
    if (isDemoMode) {
      let blocked = JSON.parse(localStore.getItem('bb_blocked_donors') || '[]');
      blocked = blocked.filter((b: any) => b.phone !== phone);
      localStore.setItem('bb_blocked_donors', JSON.stringify(blocked));
      return { success: true, error: null };
    }

    const res = await apiRequest(`/admin/block/${encodeURIComponent(phone.trim())}`, {
      method: 'DELETE',
      body: JSON.stringify({ adminUsername, adminPassword }),
    });
    return { success: !!res.success, error: res.error };
  },

  async getBlockedPhones(adminUsername?: string, adminPassword?: string): Promise<{ success: boolean; data: any[]; error: any }> {
    if (isDemoMode) {
      const blocked = JSON.parse(localStore.getItem('bb_blocked_donors') || '[]');
      return { success: true, data: blocked, error: null };
    }

    const query = new URLSearchParams();
    if (adminUsername) query.set('adminUsername', adminUsername);
    if (adminPassword) query.set('adminPassword', adminPassword);

    const res = await apiRequest<any[]>(`/admin/blocked?${query.toString()}`);
    return { success: !res.error, data: res.data || [], error: res.error };
  },

  // ==========================================
  // SUPPORT REQUESTS
  // ==========================================
  async submitSupportRequest(requestData: SupportRequest): Promise<{ success: boolean; error: any }> {
    if (isDemoMode) {
      const requests = JSON.parse(localStore.getItem('bb_support_requests') || '[]');
      requests.push({ id: generateUUID(), ...requestData, created_at: new Date().toISOString() });
      localStore.setItem('bb_support_requests', JSON.stringify(requests));
      return { success: true, error: null };
    }

    const res = await apiRequest('/support', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
    return { success: !!res.success, error: res.error };
  },

  async getSupportRequests(adminUsername?: string, adminPassword?: string): Promise<{ data: any[]; error: any }> {
    if (isDemoMode) {
      const requests = JSON.parse(localStore.getItem('bb_support_requests') || '[]');
      return { data: requests, error: null };
    }

    const query = new URLSearchParams();
    if (adminUsername) query.set('adminUsername', adminUsername);
    if (adminPassword) query.set('adminPassword', adminPassword);

    const res = await apiRequest<any[]>(`/support?${query.toString()}`);
    return { data: res.data || [], error: res.error };
  },

  // ==========================================
  // DELETED USERS & DELETED EMERGENCIES AUDITING
  // ==========================================
  async getDeletedDonors(adminUsername?: string, adminPassword?: string): Promise<{ success: boolean; data: any[]; error: any }> {
    if (isDemoMode) {
      const deleted = JSON.parse(localStore.getItem('bb_deleted_donors') || '[]');
      return { success: true, data: deleted, error: null };
    }

    const query = new URLSearchParams();
    if (adminUsername) query.set('adminUsername', adminUsername);
    if (adminPassword) query.set('adminPassword', adminPassword);

    const res = await apiRequest<any[]>(`/admin/deleted-donors?${query.toString()}`);
    return { success: !res.error, data: res.data || [], error: res.error };
  },

  async getDeletedEmergencies(adminUsername?: string, adminPassword?: string): Promise<{ success: boolean; data: any[]; error: any }> {
    if (isDemoMode) {
      const deleted = JSON.parse(localStore.getItem('bb_deleted_emergencies') || '[]');
      return { success: true, data: deleted, error: null };
    }

    const query = new URLSearchParams();
    if (adminUsername) query.set('adminUsername', adminUsername);
    if (adminPassword) query.set('adminPassword', adminPassword);

    const res = await apiRequest<any[]>(`/admin/deleted-emergencies?${query.toString()}`);
    return { success: !res.error, data: res.data || [], error: res.error };
  },

  // ==========================================
  // ADMIN AUTHENTICATION
  // ==========================================
  async verifyAdminCredentials(username: string, password?: string): Promise<{ success: boolean; token?: string; error: any }> {
    if (isDemoMode) {
      if (username.trim().toLowerCase() === 'adilhussa1n' && password === 'Adil@1267') {
        return { success: true, error: null };
      }
      return { success: false, error: { message: 'Invalid Admin credentials.' } };
    }

    const res = await apiRequest<{ token?: string }>('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    if (res.success && res.data?.token) {
      localStore.setItem('adminToken', res.data.token);
    }

    return {
      success: !!res.success,
      token: res.data?.token,
      error: res.error,
    };
  },

  async loginAdminWithGoogle(payload: { credential?: string; user?: any }): Promise<{ success: boolean; token?: string; admin?: any; error: any }> {
    if (isDemoMode) {
      const email = String(payload.user?.email || 'adilh5353@gmail.com').toLowerCase().trim();
      const allowedAdminEmails = ['adilh5353@gmail.com', 'daruntech.pvt.ltd@gmail.com'];
      if (allowedAdminEmails.includes(email)) {
        return {
          success: true,
          token: 'demo_admin_jwt_token',
          admin: { email, name: email === 'adilh5353@gmail.com' ? 'Adil Hussain (Admin)' : 'Darun Tech (Admin)', role: 'admin' },
          error: null,
        };
      }
      return {
        success: false,
        error: { message: `Access Denied: The Google account (${email}) is not authorized as an administrator.` },
      };
    }

    const res = await apiRequest<{ token?: string; admin?: any }>('/admin/google-login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.success && res.data?.token) {
      localStore.setItem('adminToken', res.data.token);
    }

    return {
      success: !!res.success,
      token: res.data?.token,
      admin: res.data?.admin,
      error: res.error,
    };
  },

  // ==========================================
  // DONOR CARD & SPONSORSHIP OFFERS
  // ==========================================
  async getDonorCardConfig(): Promise<{ success: boolean; data: any; error: any }> {
    const res = await apiRequest('/donor-card/config');
    return {
      success: !!res.success,
      data: res.data || {
        card_title: 'Official Voluntary Blood Donor Card',
        card_subtitle: 'Sylhet Emergency Blood Network • Darun Donors',
        front_notes: 'This card certifies that the bearer is a verified voluntary blood donor dedicated to saving human lives.',
        back_terms: '1. This card is non-transferable and strictly voluntary.\n2. Valid across partner health clinics, blood transfusion centers, and community sponsors.\n3. Present this card or QR code to redeem partner benefits and donor discounts.\n4. Always verify medical eligibility before transfusion.',
        emergency_hotline: '+880 1700-000000',
        authorized_signatory_title: 'Medical & Registry Director',
        badge_accent_color: '#dc2626',
        card_theme: 'crimson_dark',
        badge_text: 'Life Saver',
        issue_org: '',
        website_url: 'donors.daruntech.com',
        valid_years: 3,
        show_qr: 1
      },
      error: res.error
    };
  },

  async updateDonorCardConfig(config: any): Promise<{ success: boolean; data: any; error: any }> {
    const res = await apiRequest('/donor-card/config', {
      method: 'PUT',
      body: JSON.stringify(config)
    });
    return {
      success: !!res.success,
      data: res.data,
      error: res.error
    };
  },

  async getDonorCardOffers(): Promise<{ success: boolean; data: any[]; error: any }> {
    const res = await apiRequest('/donor-card/offers');
    return {
      success: !!res.success,
      data: res.data || [],
      error: res.error
    };
  },

  async createDonorCardOffer(offer: any): Promise<{ success: boolean; data: any; error: any }> {
    const res = await apiRequest('/donor-card/offers', {
      method: 'POST',
      body: JSON.stringify(offer)
    });
    return {
      success: !!res.success,
      data: res.data,
      error: res.error
    };
  },

  async updateDonorCardOffer(id: string, offer: any): Promise<{ success: boolean; data: any; error: any }> {
    const res = await apiRequest(`/donor-card/offers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(offer)
    });
    return {
      success: !!res.success,
      data: res.data,
      error: res.error
    };
  },

  async deleteDonorCardOffer(id: string): Promise<{ success: boolean; error: any }> {
    const res = await apiRequest(`/donor-card/offers/${id}`, {
      method: 'DELETE'
    });
    return {
      success: !!res.success,
      error: res.error
    };
  },

  async updateDonorByAdmin(id: string, donorData: any): Promise<{ success: boolean; data: any; error: any }> {
    const res = await apiRequest(`/admin/donors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(donorData)
    });
    return {
      success: !!res.success,
      data: res.data,
      error: res.error
    };
  },

  async updateEmergencyByAdmin(id: string, emergencyData: any): Promise<{ success: boolean; data: any; error: any }> {
    const res = await apiRequest(`/admin/emergencies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(emergencyData)
    });
    return {
      success: !!res.success,
      data: res.data,
      error: res.error
    };
  },

  async getUserActivityLogs(filters?: { userId?: string; phone?: string; limit?: number }): Promise<{ success: boolean; data: any[]; error: any }> {
    const params = new URLSearchParams();
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.phone) params.append('phone', filters.phone);
    if (filters?.limit) params.append('limit', String(filters.limit));

    const url = `/admin/activity-logs${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await apiRequest(url);
    return {
      success: !!res.success,
      data: res.data || [],
      error: res.error
    };
  },

  // ==========================================
  // DONOR ALERTS & WARNINGS
  // ==========================================
  async createDonorWarning(warningData: any, adminUsername?: string, adminPassword?: string): Promise<{ success: boolean; data?: any; error: any }> {
    if (isDemoMode) {
      const warnings = JSON.parse(localStore.getItem('bb_donor_warnings') || '[]');
      const newWarning = {
        id: 'warn_' + Date.now(),
        ...warningData,
        is_acknowledged: 0,
        created_by: adminUsername || 'admin',
        created_at: new Date().toISOString(),
      };
      warnings.unshift(newWarning);
      localStore.setItem('bb_donor_warnings', JSON.stringify(warnings));

      if (warningData.autoSetUnavailable) {
        let donors = JSON.parse(localStore.getItem('bb_donors') || '[]');
        donors = donors.map((d: any) => (d.phone === warningData.donorPhone || d.id === warningData.donorId) ? { ...d, is_available: false } : d);
        localStore.setItem('bb_donors', JSON.stringify(donors));
      }
      return { success: true, data: newWarning, error: null };
    }

    const res = await apiRequest('/admin/warnings', {
      method: 'POST',
      body: JSON.stringify({ ...warningData, adminUsername, adminPassword }),
    });
    return { success: !!res.success, data: res.data, error: res.error };
  },

  async getDonorWarnings(filters?: { phone?: string; donorId?: string }, adminUsername?: string, adminPassword?: string): Promise<{ success: boolean; data: any[]; error: any }> {
    if (isDemoMode) {
      let warnings = JSON.parse(localStore.getItem('bb_donor_warnings') || '[]');
      if (filters?.phone) {
        warnings = warnings.filter((w: any) => w.donor_phone === filters.phone);
      }
      return { success: true, data: warnings, error: null };
    }

    const query = new URLSearchParams();
    if (filters?.phone) query.set('phone', filters.phone);
    if (filters?.donorId) query.set('donorId', filters.donorId);
    if (adminUsername) query.set('adminUsername', adminUsername);
    if (adminPassword) query.set('adminPassword', adminPassword);

    const res = await apiRequest<any[]>(`/admin/warnings?${query.toString()}`);
    return { success: !res.error, data: res.data || [], error: res.error };
  },

  async deleteDonorWarning(id: string, adminUsername?: string, adminPassword?: string): Promise<{ success: boolean; error: any }> {
    if (isDemoMode) {
      let warnings = JSON.parse(localStore.getItem('bb_donor_warnings') || '[]');
      warnings = warnings.filter((w: any) => w.id !== id);
      localStore.setItem('bb_donor_warnings', JSON.stringify(warnings));
      return { success: true, error: null };
    }

    const res = await apiRequest(`/admin/warnings/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ adminUsername, adminPassword }),
    });
    return { success: !!res.success, error: res.error };
  },

  async getWarningsForDonor(phone: string): Promise<{ success: boolean; data: any[]; error: any }> {
    if (isDemoMode) {
      const warnings = JSON.parse(localStore.getItem('bb_donor_warnings') || '[]');
      const filtered = warnings.filter((w: any) => w.donor_phone === phone);
      return { success: true, data: filtered, error: null };
    }

    const res = await apiRequest<any[]>(`/donors/${encodeURIComponent(phone.trim())}/warnings`);
    return { success: !res.error, data: res.data || [], error: res.error };
  },

  async acknowledgeDonorWarning(id: string, options?: { setUnavailable?: boolean; donorPhone?: string }): Promise<{ success: boolean; data?: any; error: any }> {
    if (isDemoMode) {
      let warnings = JSON.parse(localStore.getItem('bb_donor_warnings') || '[]');
      let updated: any = null;
      warnings = warnings.map((w: any) => {
        if (w.id === id) {
          updated = { ...w, is_acknowledged: 1, acknowledged_at: new Date().toISOString() };
          return updated;
        }
        return w;
      });
      localStore.setItem('bb_donor_warnings', JSON.stringify(warnings));

      if (options?.setUnavailable && options?.donorPhone) {
        let donors = JSON.parse(localStore.getItem('bb_donors') || '[]');
        donors = donors.map((d: any) => d.phone === options.donorPhone ? { ...d, is_available: false } : d);
        localStore.setItem('bb_donors', JSON.stringify(donors));
      }
      return { success: true, data: updated, error: null };
    }

    const res = await apiRequest(`/donors/warnings/${id}/acknowledge`, {
      method: 'POST',
      body: JSON.stringify(options || {}),
    });
    return { success: !!res.success, data: res.data, error: res.error };
  },

  async checkHealth(): Promise<{ isMaintenance: boolean; message?: string }> {
    if (isDemoMode) return { isMaintenance: false };
    const res = await apiRequest('/health');
    if (res.isMaintenance || res.error) {
      return {
        isMaintenance: true,
        message: res.error?.message || 'Database connection is temporarily unavailable.'
      };
    }
    return { isMaintenance: false };
  }
};


