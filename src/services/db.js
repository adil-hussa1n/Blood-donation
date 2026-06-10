import { supabase, isDemoMode } from './supabase';

// Safe localStorage wrapper to prevent crashes in private browsing modes where storage is blocked
const localStorage = (() => {
  const memoryStorage = {};
  return {
    getItem(key) {
      try {
        return window.localStorage.getItem(key);
      } catch (e) {
        return memoryStorage[key] || null;
      }
    },
    setItem(key, value) {
      try {
        window.localStorage.setItem(key, value);
      } catch (e) {
        memoryStorage[key] = String(value);
      }
    },
    removeItem(key) {
      try {
        window.localStorage.removeItem(key);
      } catch (e) {
        delete memoryStorage[key];
      }
    },
    clear() {
      try {
        window.localStorage.clear();
      } catch (e) {
        for (const k in memoryStorage) delete memoryStorage[k];
      }
    }
  };
})();

// Helper to generate UUIDs in demo mode
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Seed initial data for Demo Mode
const resolveRegistrationTotalDonations = (donorData) => {
  const raw = donorData.total_donations;
  if (raw !== undefined && raw !== null && raw !== '') {
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isNaN(parsed)) {
      return Math.min(Math.max(parsed, 0), 999);
    }
  }
  return donorData.last_donation_date ? 1 : 0;
};

const initDemoDB = () => {
  if (!localStorage.getItem('bb_demo_cleared')) {
    localStorage.removeItem('bb_donors');
    localStorage.removeItem('bb_donation_history');
    localStorage.removeItem('bb_emergency_requests');
    localStorage.removeItem('bb_donors_cache');
    localStorage.removeItem('bb_emergencies_cache');
    localStorage.setItem('bb_demo_cleared', 'true');
  }

  if (!localStorage.getItem('bb_donors')) {
    localStorage.setItem('bb_donors', JSON.stringify([]));
    localStorage.setItem('bb_donation_history', JSON.stringify([]));
    localStorage.setItem('bb_emergency_requests', JSON.stringify([]));
  }
  
  if (!localStorage.getItem('bb_admins')) {
    const mockAdmins = [
      { id: 'admin-1', username: 'adilhussa1n', password: 'Adil@1267' }
    ];
    localStorage.setItem('bb_admins', JSON.stringify(mockAdmins));
  }
};

if (isDemoMode) {
  initDemoDB();
}

const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

const normalizeFunctionError = async (error) => {
  if (!error) return null;

  let message = error.message || 'Request failed.';
  const response = error.context;

  if (response && typeof response.clone === 'function') {
    try {
      const payload = await response.clone().json();
      message = payload?.error?.message || payload?.message || message;
    } catch (err) {
      // Keep Supabase's original message when the function response is not JSON.
    }
  }

  return { ...error, message };
};

export const dbService = {
  // ==========================================
  // DONORS
  // ==========================================
  async getDonors() {
    if (isDemoMode) {
      await delay();
      const donors = JSON.parse(localStorage.getItem('bb_donors') || '[]');
      return { data: donors, error: null };
    } else {
      const { data, error } = await supabase
        .from('donors')
        .select('*')
        .order('created_at', { ascending: false });
      return { data, error };
    }
  },

  async getDonorByPhone(phone) {
    if (isDemoMode) {
      await delay();
      const donors = JSON.parse(localStorage.getItem('bb_donors') || '[]');
      const donor = donors.find(d => d.phone.trim() === phone.trim());
      return { data: donor || null, error: donor ? null : { message: 'Donor profile not found.' } };
    } else {
      const { data, error } = await supabase
        .from('donors')
        .select('*')
        .eq('phone', phone.trim())
        .maybeSingle();
      
      if (!error && !data) {
        return { data: null, error: { message: 'Donor profile not found.' } };
      }
      return { data, error };
    }
  },

  async registerDonor(donorData, honeypot) {
    if (isDemoMode) {
      await delay();
      const donors = JSON.parse(localStorage.getItem('bb_donors') || '[]');
      
      const exists = donors.find(d => d.phone === donorData.phone);
      if (exists) {
        return { data: null, error: { message: `Phone number ${donorData.phone} is already registered.` } };
      }

      const donationCount = resolveRegistrationTotalDonations(donorData);
      const newDonor = {
        id: generateUUID(),
        name: donorData.name,
        phone: donorData.phone,
        blood_group: donorData.blood_group,
        area: donorData.area,
        last_donation_date: donorData.last_donation_date || null,
        is_available: donorData.is_available ?? true,
        total_donations: donationCount,
        lifetime_donation_count: donationCount,
        password: donorData.password || '123456',
        created_at: new Date().toISOString()
      };

      donors.unshift(newDonor);
      localStorage.setItem('bb_donors', JSON.stringify(donors));

      return { data: newDonor, error: null };
    } else {
      const lifetimeCount = resolveRegistrationTotalDonations(donorData);

      // Prefer SQL RPC (works without redeploying edge functions)
      const { data: rpcDonor, error: rpcError } = await supabase.rpc('register_donor_secure', {
        p_name: donorData.name,
        p_phone: donorData.phone,
        p_blood_group: donorData.blood_group,
        p_area: donorData.area,
        p_last_donation_date: donorData.last_donation_date || null,
        p_is_available: donorData.is_available ?? true,
        p_password: donorData.password || '123456',
        p_lifetime_count: lifetimeCount,
        p_honeypot: honeypot || '',
      });

      if (!rpcError && rpcDonor) {
        const donor = typeof rpcDonor === 'string' ? JSON.parse(rpcDonor) : rpcDonor;
        return { data: donor, error: null };
      }

      if (rpcError) {
        const rpcMessage = rpcError.message || rpcError.details || 'Registration failed.';
        const rpcMissing = rpcMessage.includes('register_donor_secure') &&
          (rpcMessage.includes('does not exist') || rpcMessage.includes('Could not find'));
        if (!rpcMissing) {
          return { data: null, error: { message: rpcMessage } };
        }
      }

      const { data: responseBody, error } = await supabase.functions.invoke('secure-insert-donor', {
        body: { donorData: { ...donorData, total_donations: lifetimeCount }, honeypot }
      });
      const normalizedError = await normalizeFunctionError(error);
      if (normalizedError) {
        return { data: null, error: normalizedError };
      }
      const donor = responseBody?.data ?? responseBody;
      return { data: donor, error: null };
    }
  },

  async updateDonorAvailability(id, is_available, password) {
    if (isDemoMode) {
      await delay();
      const donors = JSON.parse(localStorage.getItem('bb_donors') || '[]');
      const index = donors.findIndex(d => d.id === id);
      if (index !== -1) {
        donors[index].is_available = is_available;
        localStorage.setItem('bb_donors', JSON.stringify(donors));
        return { data: donors[index], error: null };
      }
      return { data: null, error: { message: 'Donor not found' } };
    } else {
      // Invoke secure update Edge Function
      const { data, error } = await supabase.functions.invoke('secure-update-donor', {
        body: { action: 'update_availability', id, password, payload: { is_available } }
      });
      return { data, error: await normalizeFunctionError(error) };
    }
  },

  async updateDonorProfile(id, profileData, password) {
    if (isDemoMode) {
      await delay();
      const donors = JSON.parse(localStorage.getItem('bb_donors') || '[]');
      const index = donors.findIndex(d => d.id === id);
      if (index !== -1) {
        if (profileData.phone && profileData.phone !== donors[index].phone) {
          const duplicate = donors.find(d => d.phone === profileData.phone);
          if (duplicate) {
            return { data: null, error: { message: `Phone number ${profileData.phone} is already registered by another user.` } };
          }
        }

        donors[index] = {
          ...donors[index],
          ...profileData
        };
        localStorage.setItem('bb_donors', JSON.stringify(donors));
        return { data: donors[index], error: null };
      }
      return { data: null, error: { message: 'Donor not found' } };
    } else {
      // Invoke secure update Edge Function
      const { data, error } = await supabase.functions.invoke('secure-update-donor', {
        body: { action: 'update_profile', id, password, payload: profileData }
      });
      return { data, error: await normalizeFunctionError(error) };
    }
  },

  async deleteDonor(id, adminUsername, adminPassword) {
    if (isDemoMode) {
      await delay();
      let donors = JSON.parse(localStorage.getItem('bb_donors') || '[]');
      donors = donors.filter(d => d.id !== id);
      localStorage.setItem('bb_donors', JSON.stringify(donors));

      let history = JSON.parse(localStorage.getItem('bb_donation_history') || '[]');
      history = history.filter(h => h.donor_id !== id);
      localStorage.setItem('bb_donation_history', JSON.stringify(history));

      return { success: true, error: null };
    } else {
      // Invoke secure delete Edge Function
      const { error } = await supabase.functions.invoke('secure-delete-record', {
        body: { type: 'donor', id, adminUsername, adminPassword }
      });
      const normalizedError = await normalizeFunctionError(error);
      return { success: !normalizedError, error: normalizedError };
    }
  },

  async resetDonorPassword(name, phone, blood_group, new_password) {
    if (isDemoMode) {
      await delay();
      const donors = JSON.parse(localStorage.getItem('bb_donors') || '[]');
      const index = donors.findIndex(
        d => d.name.trim().toLowerCase() === name.trim().toLowerCase() && 
             d.phone.trim() === phone.trim() && 
             d.blood_group === blood_group
      );

      if (index !== -1) {
        donors[index].password = new_password;
        localStorage.setItem('bb_donors', JSON.stringify(donors));
        return { success: true, error: null };
      }
      return { success: false, error: { message: 'Verification failed. No donor matched the provided Name, Phone, and Blood Group.' } };
    } else {
      // Invoke secure update Edge Function
      const { error } = await supabase.functions.invoke('secure-update-donor', {
        body: { action: 'reset_password', name, phone, blood_group, new_password }
      });
      const normalizedError = await normalizeFunctionError(error);
      return { success: !normalizedError, error: normalizedError };
    }
  },

  // ==========================================
  // DONATION HISTORY
  // ==========================================
  async getDonationHistory(donorId) {
    if (isDemoMode) {
      await delay();
      const history = JSON.parse(localStorage.getItem('bb_donation_history') || '[]');
      const filtered = history
        .filter(h => h.donor_id === donorId)
        .sort((a, b) => new Date(b.donation_date) - new Date(a.donation_date));
      return { data: filtered, error: null };
    } else {
      const { data, error } = await supabase
        .from('donation_history')
        .select('*')
        .eq('donor_id', donorId)
        .order('donation_date', { ascending: false });
      return { data, error };
    }
  },

  async addDonationEvent(donorId, donationDate, password) {
    if (isDemoMode) {
      await delay();
      const donors = JSON.parse(localStorage.getItem('bb_donors') || '[]');
      const donorIndex = donors.findIndex(d => d.id === donorId);

      if (donorIndex === -1) {
        return { data: null, error: { message: 'Donor not found' } };
      }

      const history = JSON.parse(localStorage.getItem('bb_donation_history') || '[]');
      const newEvent = {
        id: generateUUID(),
        donor_id: donorId,
        donation_date: donationDate
      };
      
      history.push(newEvent);
      localStorage.setItem('bb_donation_history', JSON.stringify(history));

      const donorEvents = history.filter(h => h.donor_id === donorId);
      const latestDate = donorEvents.reduce((latest, current) => {
        if (!latest) return current.donation_date;
        return new Date(current.donation_date) > new Date(latest) ? current.donation_date : latest;
      }, null);

      const newCount = ((donors[donorIndex].lifetime_donation_count ?? donors[donorIndex].total_donations) || 0) + 1;
      donors[donorIndex].total_donations = newCount;
      donors[donorIndex].lifetime_donation_count = newCount;
      donors[donorIndex].last_donation_date = latestDate;
      donors[donorIndex].is_available = false;

      localStorage.setItem('bb_donors', JSON.stringify(donors));

      return { data: newEvent, error: null };
    } else {
      const { data: rpcDonor, error: rpcError } = await supabase.rpc('log_donation_secure', {
        p_donor_id: donorId,
        p_donation_date: donationDate,
        p_password: password,
      });

      if (!rpcError && rpcDonor) {
        const donor = typeof rpcDonor === 'string' ? JSON.parse(rpcDonor) : rpcDonor;
        return { data: donor, error: null };
      }

      if (rpcError) {
        const rpcMessage = rpcError.message || rpcError.details || 'Failed to log donation.';
        const rpcMissing = rpcMessage.includes('log_donation_secure') &&
          (rpcMessage.includes('does not exist') || rpcMessage.includes('Could not find'));
        if (!rpcMissing) {
          return { data: null, error: { message: rpcMessage } };
        }
      }

      const { data, error } = await supabase.functions.invoke('secure-update-donor', {
        body: { action: 'add_donation', id: donorId, password, payload: { donation_date: donationDate } }
      });
      return { data, error: await normalizeFunctionError(error) };
    }
  },

  // ==========================================
  // EMERGENCY REQUESTS
  // ==========================================
  async getEmergencyRequests() {
    if (isDemoMode) {
      await delay();
      const requests = JSON.parse(localStorage.getItem('bb_emergency_requests') || '[]');
      requests.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return { data: requests, error: null };
    } else {
      const { data, error } = await supabase
        .from('emergency_requests')
        .select('*')
        .order('created_at', { ascending: false });
      return { data, error };
    }
  },

  async createEmergencyRequest(requestData, honeypot) {
    if (isDemoMode) {
      await delay();
      const requests = JSON.parse(localStorage.getItem('bb_emergency_requests') || '[]');
      const donors = JSON.parse(localStorage.getItem('bb_donors') || '[]');
      const matchedDonor = donors.find(d => d.phone.trim() === requestData.contact.trim());
      const finalPasscode = matchedDonor ? matchedDonor.password : (requestData.passcode || '1234');

      const newRequest = {
        id: generateUUID(),
        blood_group: requestData.blood_group,
        area: requestData.area,
        contact: requestData.contact,
        note: requestData.note || '',
        passcode: finalPasscode,
        created_at: new Date().toISOString()
      };

      requests.unshift(newRequest);
      localStorage.setItem('bb_emergency_requests', JSON.stringify(requests));
      return { data: newRequest, error: null };
    } else {
      // Invoke secure insert Edge Function
      const { data, error } = await supabase.functions.invoke('secure-insert-emergency', {
        body: { requestData, honeypot }
      });
      return { data, error: await normalizeFunctionError(error) };
    }
  },

  async deleteEmergencyRequest(id, adminUsername, adminPassword, userPasscode) {
    if (isDemoMode) {
      await delay();
      let requests = JSON.parse(localStorage.getItem('bb_emergency_requests') || '[]');
      requests = requests.filter(r => r.id !== id);
      localStorage.setItem('bb_emergency_requests', JSON.stringify(requests));
      return { success: true, error: null };
    } else {
      // Invoke secure delete Edge Function
      const { error } = await supabase.functions.invoke('secure-delete-record', {
        body: { type: 'emergency', id, adminUsername, adminPassword, userPasscode }
      });
      const normalizedError = await normalizeFunctionError(error);
      return { success: !normalizedError, error: normalizedError };
    }
  },

  // ==========================================
  // ADMIN AUTHENTICATION
  // ==========================================
  async verifyAdminCredentials(username, password) {
    const isHardcodedMatch = 
      username.trim().toLowerCase() === 'adilhussa1n' && 
      password === 'Adil@1267';

    if (isDemoMode) {
      await delay();
      const admins = JSON.parse(localStorage.getItem('bb_admins') || '[]');
      const match = admins.find(
        a => a.username.trim().toLowerCase() === username.trim().toLowerCase() && 
             a.password === password
      );
      return { success: !!match || isHardcodedMatch, error: (match || isHardcodedMatch) ? null : { message: 'Invalid Admin credentials.' } };
    } else {
      try {
        // Securely verify admin credentials via RPC instead of select *
        const { data, error } = await supabase.rpc('verify_admin', {
          p_username: username.trim(),
          p_password: password
        });

        if (!error && data) {
          return { success: true, error: null };
        }
      } catch (err) {
        console.error("Supabase admin query error, falling back to local credentials:", err);
      }
      
      if (isHardcodedMatch) {
        return { success: true, error: null };
      }
      return { success: false, error: { message: 'Invalid Admin credentials.' } };
    }
  }
};
