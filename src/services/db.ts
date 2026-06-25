import { supabase, isDemoMode } from './supabase';
import { Donor, EmergencyRequest, SupportRequest, DonationEvent, HospitalInventory } from '../types';

// Safe localStorage wrapper to prevent crashes in private browsing modes where storage is blocked
const localStore = (() => {
  const memoryStorage: Record<string, string> = {};
  return {
    getItem(key: string): string | null {
      try {
        return window.localStorage.getItem(key);
      } catch (e) {
        return memoryStorage[key] || null;
      }
    },
    setItem(key: string, value: string): void {
      try {
        window.localStorage.setItem(key, value);
      } catch (e) {
        memoryStorage[key] = String(value);
      }
    },
    removeItem(key: string): void {
      try {
        window.localStorage.removeItem(key);
      } catch (e) {
        delete memoryStorage[key];
      }
    },
    clear(): void {
      try {
        window.localStorage.clear();
      } catch (e) {
        for (const k in memoryStorage) delete memoryStorage[k];
      }
    }
  };
})();

// Helper to generate UUIDs in demo mode
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const resolveRegistrationTotalDonations = (donorData: Partial<Donor>): number => {
  const raw = donorData.total_donations;
  if (raw !== undefined && raw !== null && (raw as any) !== '') {
    const parsed = Number.parseInt(raw as any, 10);
    if (!Number.isNaN(parsed)) {
      return Math.min(Math.max(parsed, 0), 999);
    }
  }
  return donorData.last_donation_date ? 1 : 0;
};

const initDemoDB = () => {
  if (!localStore.getItem('bb_demo_cleared')) {
    localStore.removeItem('bb_donors');
    localStore.removeItem('bb_donation_history');
    localStore.removeItem('bb_emergency_requests');
    localStore.removeItem('bb_donors_cache');
    localStore.removeItem('bb_emergencies_cache');
    localStore.setItem('bb_demo_cleared', 'true');
  }

  if (!localStore.getItem('bb_donors')) {
    localStore.setItem('bb_donors', JSON.stringify([]));
    localStore.setItem('bb_donation_history', JSON.stringify([]));
    localStore.setItem('bb_emergency_requests', JSON.stringify([]));
  }
  
  if (!localStore.getItem('bb_support_requests')) {
    const mockSupportRequests = [
      {
        id: generateUUID(),
        type: 'support',
        name: 'Rakib Hasan',
        phone: '01712345678',
        message: 'Hello, I am having trouble updating my donation count on the profile tab. Can you please verify my records?',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: generateUUID(),
        type: 'problem',
        name: 'Sadia Rahman',
        phone: '01987654321',
        issue_type: 'bug_report',
        message: 'The print certificate modal close button was overlapping previously. Please check if the layout aligns well on mobile.',
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    localStore.setItem('bb_support_requests', JSON.stringify(mockSupportRequests));
  }
  
  if (!localStore.getItem('bb_admins')) {
    const mockAdmins = [
      { id: 'admin-1', username: 'adilhussa1n', password: 'Adil@1267' }
    ];
    localStore.setItem('bb_admins', JSON.stringify(mockAdmins));
  }
};

if (isDemoMode) {
  initDemoDB();
}

const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

const normalizeFunctionError = async (error: any) => {
  if (!error) return null;

  let message = error.message || 'Request failed.';
  const response = error.context;

  if (response && typeof response.clone === 'function') {
    try {
      const payload = await response.clone().json();
      message = payload?.error?.message || payload?.message || message;
    } catch (err) {
      // Keep Supabase's original message
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
      const donors = JSON.parse(localStore.getItem('bb_donors') || '[]');
      return { data: donors as Donor[], error: null };
    } else {
      const { data, error } = await supabase
        .from('donors')
        .select('id, name, phone, blood_group, area, last_donation_date, is_available, total_donations, lifetime_donation_count, created_at')
        .order('created_at', { ascending: false });
      return { data: data as Donor[], error };
    }
  },

  async getDonorByPhone(phone: string) {
    if (isDemoMode) {
      await delay();
      const donors = JSON.parse(localStore.getItem('bb_donors') || '[]') as Donor[];
      const donor = donors.find(d => d.phone.trim() === phone.trim());
      return { data: donor || null, error: donor ? null : { message: 'Donor profile not found.' } };
    } else {
      const { data, error } = await supabase
        .from('donors')
        .select('id, name, phone, blood_group, area, last_donation_date, is_available, total_donations, lifetime_donation_count, created_at')
        .eq('phone', phone.trim())
        .maybeSingle();
      
      if (!error && !data) {
        return { data: null, error: { message: 'Donor profile not found.' } };
      }
      return { data: data as Donor, error };
    }
  },

  async registerDonor(donorData: Partial<Donor>, honeypot?: string) {
    if (isDemoMode) {
      await delay();
      const donors = JSON.parse(localStore.getItem('bb_donors') || '[]') as Donor[];
      
      const exists = donors.find(d => d.phone === donorData.phone);
      if (exists) {
        return { data: null, error: { message: `Phone number ${donorData.phone} is already registered.` } };
      }

      // Check if blocked in demo mode
      const blocked = JSON.parse(localStore.getItem('bb_blocked_donors') || '[]');
      if (blocked.find((b: any) => b.phone.trim() === donorData.phone?.trim())) {
        return { data: null, error: { message: 'This phone number has been blocked. Please contact the administrator.' } };
      }

      const donationCount = resolveRegistrationTotalDonations(donorData);
      const newDonor: Donor = {
        id: generateUUID(),
        name: donorData.name || '',
        phone: donorData.phone || '',
        blood_group: donorData.blood_group || '',
        area: donorData.area || '',
        last_donation_date: donorData.last_donation_date || null,
        is_available: donorData.is_available ?? true,
        total_donations: donationCount,
        lifetime_donation_count: donationCount,
        password: donorData.password || '123456',
        dob: donorData.dob || null,
        created_at: new Date().toISOString()
      };

      donors.unshift(newDonor);
      localStore.setItem('bb_donors', JSON.stringify(donors));

      return { data: newDonor, error: null };
    } else {
      const lifetimeCount = resolveRegistrationTotalDonations(donorData);

      // Prefer SQL RPC
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
        p_dob: donorData.dob || null,
      });

      if (!rpcError && rpcDonor) {
        const donor = typeof rpcDonor === 'string' ? JSON.parse(rpcDonor) : rpcDonor;
        return { data: donor as Donor, error: null };
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
        body: { donorData: { ...donorData, total_donations: lifetimeCount, dob: donorData.dob }, honeypot }
      });
      const normalizedError = await normalizeFunctionError(error);
      if (normalizedError) {
        return { data: null, error: normalizedError };
      }
      const donor = responseBody?.data ?? responseBody;
      return { data: donor as Donor, error: null };
    }
  },

  async updateDonorAvailability(id: string, is_available: boolean, password?: string) {
    if (isDemoMode) {
      await delay();
      const donors = JSON.parse(localStore.getItem('bb_donors') || '[]') as Donor[];
      const index = donors.findIndex(d => d.id === id);
      if (index !== -1) {
        donors[index].is_available = is_available;
        localStore.setItem('bb_donors', JSON.stringify(donors));
        return { data: donors[index], error: null };
      }
      return { data: null, error: { message: 'Donor not found' } };
    } else {
      const { data, error } = await supabase.functions.invoke('secure-update-donor', {
        body: { action: 'update_availability', id, password, payload: { is_available } }
      });
      return { data, error: await normalizeFunctionError(error) };
    }
  },

  async updateDonorProfile(id: string, profileData: Partial<Donor>, password?: string) {
    if (isDemoMode) {
      await delay();
      const donors = JSON.parse(localStore.getItem('bb_donors') || '[]') as Donor[];
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
        localStore.setItem('bb_donors', JSON.stringify(donors));
        return { data: donors[index], error: null };
      }
      return { data: null, error: { message: 'Donor not found' } };
    } else {
      const { data, error } = await supabase.functions.invoke('secure-update-donor', {
        body: { action: 'update_profile', id, password, payload: profileData }
      });
      return { data: data as Donor, error: await normalizeFunctionError(error) };
    }
  },

  async deleteDonor(id: string, adminUsername?: string, adminPassword?: string) {
    if (isDemoMode) {
      await delay();
      let donors = JSON.parse(localStore.getItem('bb_donors') || '[]') as Donor[];
      donors = donors.filter(d => d.id !== id);
      localStore.setItem('bb_donors', JSON.stringify(donors));

      let history = JSON.parse(localStore.getItem('bb_donation_history') || '[]') as DonationEvent[];
      history = history.filter(h => h.donor_id !== id);
      localStore.setItem('bb_donation_history', JSON.stringify(history));

      return { success: true, error: null };
    } else {
      const { error } = await supabase.functions.invoke('secure-delete-record', {
        body: { type: 'donor', id, adminUsername, adminPassword }
      });
      const normalizedError = await normalizeFunctionError(error);
      return { success: !normalizedError, error: normalizedError };
    }
  },

  async resetDonorPassword(name: string, phone: string, blood_group: string, dob: string, new_password: string) {
    if (isDemoMode) {
      await delay();
      const donors = JSON.parse(localStore.getItem('bb_donors') || '[]') as Donor[];
      const index = donors.findIndex(
        d => d.name.trim().toLowerCase() === name.trim().toLowerCase() && 
             d.phone.trim() === phone.trim() && 
             d.blood_group === blood_group &&
             d.dob === dob
      );

      if (index !== -1) {
        donors[index].password = new_password;
        localStore.setItem('bb_donors', JSON.stringify(donors));
        return { success: true, error: null };
      }
      return { success: false, error: { message: 'Verification failed. No donor matched the provided Name, Phone, Blood Group, and Date of Birth.' } };
    } else {
      const { error: rpcError } = await supabase.rpc('reset_donor_password_secure', {
        p_name: name,
        p_phone: phone,
        p_blood_group: blood_group,
        p_dob: dob,
        p_new_password: new_password
      });

      if (!rpcError) {
        return { success: true, error: null };
      }

      const rpcMessage = rpcError.message || rpcError.details || 'Verification failed.';
      const rpcMissing = rpcMessage.includes('reset_donor_password_secure') &&
        (rpcMessage.includes('does not exist') || rpcMessage.includes('Could not find'));
      if (!rpcMissing) {
        return { success: false, error: { message: rpcMessage } };
      }

      const { error } = await supabase.functions.invoke('secure-update-donor', {
        body: { action: 'reset_password', name, phone, blood_group, dob, new_password }
      });
      const normalizedError = await normalizeFunctionError(error);
      return { success: !normalizedError, error: normalizedError };
    }
  },

  async blockDonorByPhone(phone: string, adminUsername?: string, adminPassword?: string, reason?: string) {
    if (isDemoMode) {
      await delay();
      const blocked = JSON.parse(localStore.getItem('bb_blocked_donors') || '[]');
      const exists = blocked.find((b: any) => b.phone === phone);
      if (!exists) {
        blocked.push({
          phone,
          reason: reason || 'Blocked by admin',
          blocked_by: adminUsername,
          blocked_at: new Date().toISOString()
        });
        localStore.setItem('bb_blocked_donors', JSON.stringify(blocked));
      }
      return { success: true, error: null };
    } else {
      const { error } = await supabase.rpc('block_donor_by_phone', {
        p_phone: phone,
        p_admin_username: adminUsername,
        p_admin_password: adminPassword,
        p_reason: reason || 'Blocked by admin'
      });
      if (error) {
        return { success: false, error: { message: error.message || 'Failed to block donor' } };
      }
      return { success: true, error: null };
    }
  },

  async unblockDonorByPhone(phone: string, adminUsername?: string, adminPassword?: string) {
    if (isDemoMode) {
      await delay();
      let blocked = JSON.parse(localStore.getItem('bb_blocked_donors') || '[]');
      blocked = blocked.filter((b: any) => b.phone !== phone);
      localStore.setItem('bb_blocked_donors', JSON.stringify(blocked));
      return { success: true, error: null };
    } else {
      const { error } = await supabase.rpc('unblock_donor_by_phone', {
        p_phone: phone,
        p_admin_username: adminUsername,
        p_admin_password: adminPassword
      });
      if (error) {
        return { success: false, error: { message: error.message || 'Failed to unblock donor' } };
      }
      return { success: true, error: null };
    }
  },

  async getBlockedPhones(adminUsername?: string, adminPassword?: string) {
    if (isDemoMode) {
      await delay();
      const blocked = JSON.parse(localStore.getItem('bb_blocked_donors') || '[]');
      return { success: true, data: blocked, error: null };
    } else {
      const { data, error } = await supabase.rpc('get_blocked_phones', {
        p_admin_username: adminUsername,
        p_admin_password: adminPassword
      });
      if (error) {
        return { success: false, data: [], error: { message: error.message || 'Failed to get blocked list' } };
      }
      return { success: true, data: typeof data === 'string' ? JSON.parse(data) : (data || []), error: null };
    }
  },

  async verifyDonor(phone: string, password?: string) {
    if (isDemoMode) {
      await delay();
      const donors = JSON.parse(localStore.getItem('bb_donors') || '[]') as Donor[];
      const donor = donors.find(
        d => d.phone.trim() === phone.trim() && d.password === password
      );
      if (!donor) {
        return { data: null, error: { message: 'Invalid phone or password.' } };
      }
      return { data: donor, error: null };
    } else {
      const { data, error } = await supabase.rpc('verify_donor_credentials', {
        p_phone: phone.trim(),
        p_password: password
      });
      if (error) {
        return { data: null, error: { message: error.message || 'Verification failed.' } };
      }
      return { data: typeof data === 'string' ? JSON.parse(data) : data, error: null };
    }
  },

  // ==========================================
  // DONATION HISTORY
  // ==========================================
  async getDonationHistory(donorId: string) {
    if (isDemoMode) {
      await delay();
      const history = JSON.parse(localStore.getItem('bb_donation_history') || '[]') as DonationEvent[];
      const filtered = history
        .filter(h => h.donor_id === donorId)
        .sort((a, b) => new Date(b.donation_date).getTime() - new Date(a.donation_date).getTime());
      return { data: filtered, error: null };
    } else {
      const { data, error } = await supabase
        .from('donation_history')
        .select('*')
        .eq('donor_id', donorId)
        .order('donation_date', { ascending: false });
      return { data: data as DonationEvent[], error };
    }
  },

  async addDonationEvent(donorId: string, donationDate: string, password?: string) {
    if (isDemoMode) {
      await delay();
      const donors = JSON.parse(localStore.getItem('bb_donors') || '[]') as Donor[];
      const donorIndex = donors.findIndex(d => d.id === donorId);

      if (donorIndex === -1) {
        return { data: null, error: { message: 'Donor not found' } };
      }

      const history = JSON.parse(localStore.getItem('bb_donation_history') || '[]') as DonationEvent[];
      const newEvent: DonationEvent = {
        id: generateUUID(),
        donor_id: donorId,
        donation_date: donationDate
      };
      
      history.push(newEvent);
      localStore.setItem('bb_donation_history', JSON.stringify(history));

      const donorEvents = history.filter(h => h.donor_id === donorId);
      const latestDate = donorEvents.reduce((latest: string | null, current) => {
        if (!latest) return current.donation_date;
        return new Date(current.donation_date).getTime() > new Date(latest).getTime() ? current.donation_date : latest;
      }, null);

      const newCount = ((donors[donorIndex].lifetime_donation_count ?? donors[donorIndex].total_donations) || 0) + 1;
      donors[donorIndex].total_donations = newCount;
      donors[donorIndex].lifetime_donation_count = newCount;
      donors[donorIndex].last_donation_date = latestDate;
      donors[donorIndex].is_available = false;

      localStore.setItem('bb_donors', JSON.stringify(donors));

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
      const requests = JSON.parse(localStore.getItem('bb_emergency_requests') || '[]') as EmergencyRequest[];
      requests.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return { data: requests, error: null };
    } else {
      const { data, error } = await supabase
        .from('emergency_requests')
        .select('id, blood_group, area, contact, note, status, created_at')
        .order('created_at', { ascending: false });
      return { data: data as EmergencyRequest[], error };
    }
  },

  async createEmergencyRequest(requestData: Partial<EmergencyRequest>, honeypot?: string) {
    if (isDemoMode) {
      await delay();
      const requests = JSON.parse(localStore.getItem('bb_emergency_requests') || '[]') as EmergencyRequest[];
      const donors = JSON.parse(localStore.getItem('bb_donors') || '[]') as Donor[];
      const matchedDonor = donors.find(d => d.phone.trim() === requestData.contact?.trim());
      const finalPasscode = matchedDonor ? matchedDonor.password : (requestData.passcode || '1234');

      const newRequest: EmergencyRequest = {
        id: generateUUID(),
        blood_group: requestData.blood_group || '',
        area: requestData.area || '',
        contact: requestData.contact || '',
        note: requestData.note || '',
        passcode: finalPasscode,
        status: 'needed',
        created_at: new Date().toISOString()
      };

      requests.unshift(newRequest);
      localStore.setItem('bb_emergency_requests', JSON.stringify(requests));
      return { data: newRequest, error: null };
    } else {
      const { data, error } = await supabase.functions.invoke('secure-insert-emergency', {
        body: { requestData, honeypot }
      });
      return { data: data as EmergencyRequest, error: await normalizeFunctionError(error) };
    }
  },

  async updateEmergencyRequestStatus(id: string, status: 'needed' | 'responded' | 'fulfilled', userPasscode?: string, adminUsername?: string, adminPassword?: string) {
    if (isDemoMode) {
      await delay();
      const requests = JSON.parse(localStore.getItem('bb_emergency_requests') || '[]') as EmergencyRequest[];
      const index = requests.findIndex(r => r.id === id);
      if (index !== -1) {
        requests[index].status = status;
        localStore.setItem('bb_emergency_requests', JSON.stringify(requests));
        return { data: requests[index], error: null };
      }
      return { data: null, error: { message: 'Emergency request not found' } };
    } else {
      const { data, error } = await supabase.rpc('update_emergency_status', {
        p_id: id,
        p_status: status,
        p_passcode: userPasscode || null,
        p_admin_username: adminUsername || null,
        p_admin_password: adminPassword || null
      });
      return { data, error };
    }
  },

  async getHospitalInventory() {
    if (isDemoMode) {
      await delay();
      const inventory = JSON.parse(localStore.getItem('bb_hospital_inventory') || '[]') as any[];
      const hospitals = JSON.parse(localStore.getItem('bb_hospitals') || '[]') as any[];
      const data = inventory.map(item => {
        const h = hospitals.find(x => x.id === item.hospital_id);
        return {
          ...item,
          hospitals: h || null
        };
      });
      return { data, error: null };
    } else {
      const { data, error } = await supabase
        .from('hospital_inventory')
        .select(`
          id,
          hospital_id,
          blood_group,
          stock_status,
          updated_at,
          hospitals (
            id,
            name,
            area,
            contact,
            is_verified
          )
        `)
        .order('updated_at', { ascending: false });
      return { data: data as any[], error };
    }
  },

  async checkHospitalUsernameAvailable(username: string) {
    if (isDemoMode) {
      await delay();
      const hospitals = JSON.parse(localStore.getItem('bb_hospitals') || '[]') as any[];
      const exists = hospitals.find(h => h.username?.toLowerCase() === username.trim().toLowerCase());
      return { available: !exists, error: null };
    } else {
      const { data, error } = await supabase.rpc('check_hospital_username_available', {
        p_username: username.trim()
      });
      if (error) return { available: false, error };
      return { available: !!data, error: null };
    }
  },

  async registerHospital(hospitalData: { name: string; username: string; area: string; contact: string; password?: string }) {
    if (isDemoMode) {
      await delay();
      const hospitals = JSON.parse(localStore.getItem('bb_hospitals') || '[]') as any[];
      const existsUsername = hospitals.find(h => h.username?.toLowerCase() === hospitalData.username.toLowerCase());
      const existsName = hospitals.find(h => h.name.toLowerCase() === hospitalData.name.toLowerCase());
      const existsContact = hospitals.find(h => h.contact === hospitalData.contact);
      
      if (existsUsername) {
        return { data: null, error: { message: 'Username not available.' } };
      }
      if (existsName || existsContact) {
        return { data: null, error: { message: 'Hospital name or contact number already registered.' } };
      }
      const newHospital = {
        id: generateUUID(),
        name: hospitalData.name,
        username: hospitalData.username.toLowerCase().trim(),
        area: hospitalData.area,
        contact: hospitalData.contact,
        password: hospitalData.password || '123456',
        is_verified: false,
        created_at: new Date().toISOString()
      };
      hospitals.unshift(newHospital);
      localStore.setItem('bb_hospitals', JSON.stringify(hospitals));
      return { data: newHospital, error: null };
    } else {
      const { data, error } = await supabase.rpc('register_hospital', {
        p_name: hospitalData.name,
        p_username: hospitalData.username,
        p_area: hospitalData.area,
        p_contact: hospitalData.contact,
        p_password: hospitalData.password || '123456'
      });
      if (error) return { data: null, error };
      return { data: typeof data === 'string' ? JSON.parse(data) : data, error: null };
    }
  },

  async loginHospital(username: string, password?: string) {
    if (isDemoMode) {
      await delay();
      const hospitals = JSON.parse(localStore.getItem('bb_hospitals') || '[]') as any[];
      const hospital = hospitals.find(h => h.username?.toLowerCase() === username.trim().toLowerCase() && h.password === password);
      if (!hospital) {
        return { data: null, error: { message: 'Invalid username or password.' } };
      }
      return { data: hospital, error: null };
    } else {
      const { data, error } = await supabase.rpc('verify_hospital', {
        p_username: username.trim(),
        p_password: password
      });
      if (error) return { data: null, error };
      return { data: typeof data === 'string' ? JSON.parse(data) : data, error: null };
    }
  },

  async updateHospitalStockBulk(hospitalId: string, stocks: { blood_group: string; stock_status: string }[], password?: string) {
    if (isDemoMode) {
      await delay();
      const inventory = JSON.parse(localStore.getItem('bb_hospital_inventory') || '[]') as any[];
      
      stocks.forEach(stock => {
        const index = inventory.findIndex(item => item.hospital_id === hospitalId && item.blood_group === stock.blood_group);
        const updatedItem = {
          id: index !== -1 ? inventory[index].id : generateUUID(),
          hospital_id: hospitalId,
          blood_group: stock.blood_group,
          stock_status: stock.stock_status,
          updated_at: new Date().toISOString()
        };
        if (index !== -1) {
          inventory[index] = updatedItem;
        } else {
          inventory.unshift(updatedItem);
        }
      });

      localStore.setItem('bb_hospital_inventory', JSON.stringify(inventory));
      return { success: true, error: null };
    } else {
      const { data, error } = await supabase.rpc('update_hospital_stock_bulk', {
        p_hospital_id: hospitalId,
        p_stocks: stocks,
        p_password: password
      });
      if (error) return { success: false, error };
      return { success: true, error: null };
    }
  },

  async getAllHospitalsAdmin() {
    if (isDemoMode) {
      await delay();
      const hospitals = JSON.parse(localStore.getItem('bb_hospitals') || '[]') as any[];
      return { data: hospitals, error: null };
    } else {
      const { data, error } = await supabase
        .from('hospitals')
        .select('id, name, username, area, contact, is_verified, created_at')
        .order('name', { ascending: true });
      return { data, error };
    }
  },

  async approveHospitalAdmin(hospitalId: string, isVerified: boolean, adminUsername?: string, adminPassword?: string) {
    if (isDemoMode) {
      await delay();
      const hospitals = JSON.parse(localStore.getItem('bb_hospitals') || '[]') as any[];
      const index = hospitals.findIndex(h => h.id === hospitalId);
      if (index !== -1) {
        hospitals[index].is_verified = isVerified;
        localStore.setItem('bb_hospitals', JSON.stringify(hospitals));
        return { success: true, error: null };
      }
      return { success: false, error: { message: 'Hospital not found' } };
    } else {
      const { data, error } = await supabase.rpc('approve_hospital_admin', {
        p_hospital_id: hospitalId,
        p_is_verified: isVerified,
        p_admin_username: adminUsername,
        p_admin_password: adminPassword
      });
      if (error) return { success: false, error };
      return { success: true, error: null };
    }
  },

  async deleteEmergencyRequest(id: string, adminUsername?: string, adminPassword?: string, userPasscode?: string) {
    if (isDemoMode) {
      await delay();
      let requests = JSON.parse(localStore.getItem('bb_emergency_requests') || '[]') as EmergencyRequest[];
      requests = requests.filter(r => r.id !== id);
      localStore.setItem('bb_emergency_requests', JSON.stringify(requests));
      return { success: true, error: null };
    } else {
      const { error } = await supabase.functions.invoke('secure-delete-record', {
        body: { type: 'emergency', id, adminUsername, adminPassword, userPasscode }
      });
      const normalizedError = await normalizeFunctionError(error);
      return { success: !normalizedError, error: normalizedError };
    }
  },

  async checkIfBlocked(phone: string) {
    if (isDemoMode) {
      await delay();
      const blocked = JSON.parse(localStore.getItem('bb_blocked_donors') || '[]');
      const exists = blocked.find((b: any) => b.phone.trim() === phone.trim());
      return { data: !!exists, error: null };
    } else {
      const { data, error } = await supabase.rpc('is_phone_blocked', {
        p_phone: phone.trim()
      });
      if (error) {
        return { data: false, error };
      }
      return { data: !!data, error: null };
    }
  },

  async submitSupportRequest(requestData: SupportRequest) {
    if (isDemoMode) {
      await delay();
      const requests = JSON.parse(localStore.getItem('bb_support_requests') || '[]');
      requests.push({
        id: generateUUID(),
        ...requestData,
        created_at: new Date().toISOString()
      });
      localStore.setItem('bb_support_requests', JSON.stringify(requests));
      return { success: true, error: null };
    } else {
      const { error } = await supabase
        .from('support_requests')
        .insert([requestData]);
      if (error) {
        return { success: false, error: { message: error.message } };
      }
      return { success: true, error: null };
    }
  },
  async getSupportRequests(adminUsername?: string, adminPassword?: string) {
    if (isDemoMode) {
      await delay();
      const requests = JSON.parse(localStore.getItem('bb_support_requests') || '[]');
      requests.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return { data: requests, error: null };
    } else {
      const { data, error } = await supabase.rpc('get_support_requests', {
        p_admin_username: adminUsername,
        p_admin_password: adminPassword
      });
      if (error) {
        return { data: [], error: { message: error.message } };
      }
      return { data: typeof data === 'string' ? JSON.parse(data) : (data || []), error: null };
    }
  },

  // ==========================================
  // ADMIN AUTHENTICATION
  // ==========================================
  async verifyAdminCredentials(username: string, password?: string) {
    if (isDemoMode) {
      await delay();
      const admins = JSON.parse(localStore.getItem('bb_admins') || '[]');
      const match = admins.find(
        (a: any) => a.username.trim().toLowerCase() === username.trim().toLowerCase() && 
             a.password === password
      );
      return { success: !!match, error: match ? null : { message: 'Invalid Admin credentials.' } };
    } else {
      try {
        const { data, error } = await supabase.rpc('verify_admin', {
          p_username: username.trim(),
          p_password: password
        });

        if (!error && data) {
          return { success: true, error: null };
        }
      } catch (err) {
        console.error("Supabase admin query error:", err);
      }
      
      return { success: false, error: { message: 'Invalid Admin credentials.' } };
    }
  }
};
