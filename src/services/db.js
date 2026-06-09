import { supabase, isDemoMode } from './supabase';

// Helper to generate UUIDs in demo mode
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Seed initial data for Demo Mode
const initDemoDB = () => {
  if (!localStorage.getItem('bb_donors')) {
    const mockDonors = [
      {
        id: 'donor-1',
        name: 'Rahat Ahmed',
        phone: '01712345678',
        blood_group: 'O+',
        area: 'Beanibazar Sadar',
        last_donation_date: '2026-05-15', // Cooldown active
        is_available: true,
        total_donations: 4, // Active Donor
        password: 'password123',
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'donor-2',
        name: 'Sayed Chowdhury',
        phone: '01898765432',
        blood_group: 'A-',
        area: 'Mathiura',
        last_donation_date: '2026-02-01', // Cooldown elapsed
        is_available: true,
        total_donations: 8, // Hero Donor
        password: 'password123',
        created_at: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'donor-3',
        name: 'Tahmid Hussain',
        phone: '01911223344',
        blood_group: 'B+',
        area: 'Mullapur',
        last_donation_date: null, // Never donated
        is_available: true,
        total_donations: 0, // New Donor
        password: 'password123',
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'donor-4',
        name: 'Kamrul Hasan',
        phone: '01755667788',
        blood_group: 'AB+',
        area: 'Kurar Bazar',
        last_donation_date: '2026-06-05', // Cooldown active
        is_available: false, // Manually unavailable
        total_donations: 2, // Normal Donor
        password: 'password123',
        created_at: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'donor-5',
        name: 'Fahmida Yeasmin',
        phone: '01633445566',
        blood_group: 'O-',
        area: 'Alinagar',
        last_donation_date: '2025-12-10', // Cooldown elapsed
        is_available: true,
        total_donations: 7, // Hero Donor
        password: 'password123',
        created_at: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    const mockHistory = [
      { id: 'h-1', donor_id: 'donor-1', donation_date: '2026-05-15' },
      { id: 'h-2', donor_id: 'donor-1', donation_date: '2026-01-10' },
      { id: 'h-3', donor_id: 'donor-2', donation_date: '2026-02-01' },
      { id: 'h-4', donor_id: 'donor-2', donation_date: '2025-10-15' },
      { id: 'h-5', donor_id: 'donor-2', donation_date: '2025-06-20' },
      { id: 'h-6', donor_id: 'donor-4', donation_date: '2026-06-05' },
      { id: 'h-7', donor_id: 'donor-5', donation_date: '2025-12-10' }
    ];

    const mockEmergencies = [
      {
        id: 'req-1',
        blood_group: 'O-',
        area: 'Beanibazar Sadar (General Hospital)',
        contact: '01799887766',
        note: 'Urgent surgery tomorrow morning. Need 2 bags of O- Negative blood.',
        passcode: '1234',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
      },
      {
        id: 'req-2',
        blood_group: 'A+',
        area: 'Lauta',
        contact: '01811223344',
        note: 'Thalassemia patient, blood transfusion needed by this weekend.',
        passcode: '1234',
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
      }
    ];

    localStorage.setItem('bb_donors', JSON.stringify(mockDonors));
    localStorage.setItem('bb_donation_history', JSON.stringify(mockHistory));
    localStorage.setItem('bb_emergency_requests', JSON.stringify(mockEmergencies));
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

  async registerDonor(donorData, turnstileToken, honeypot) {
    if (isDemoMode) {
      await delay();
      const donors = JSON.parse(localStorage.getItem('bb_donors') || '[]');
      
      const exists = donors.find(d => d.phone === donorData.phone);
      if (exists) {
        return { data: null, error: { message: `Phone number ${donorData.phone} is already registered.` } };
      }

      const newDonor = {
        id: generateUUID(),
        name: donorData.name,
        phone: donorData.phone,
        blood_group: donorData.blood_group,
        area: donorData.area,
        last_donation_date: donorData.last_donation_date || null,
        is_available: donorData.is_available ?? true,
        total_donations: donorData.last_donation_date ? 1 : 0,
        password: donorData.password || '123456',
        created_at: new Date().toISOString()
      };

      donors.unshift(newDonor);
      localStorage.setItem('bb_donors', JSON.stringify(donors));

      if (newDonor.last_donation_date) {
        const history = JSON.parse(localStorage.getItem('bb_donation_history') || '[]');
        history.push({
          id: generateUUID(),
          donor_id: newDonor.id,
          donation_date: newDonor.last_donation_date
        });
        localStorage.setItem('bb_donation_history', JSON.stringify(history));
      }

      return { data: newDonor, error: null };
    } else {
      // Invoke secure insert Edge Function
      const { data, error } = await supabase.functions.invoke('secure-insert-donor', {
        body: { donorData, turnstileToken, honeypot }
      });
      return { data, error };
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
      return { data, error };
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
      return { data, error };
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
      const { data, error } = await supabase.functions.invoke('secure-delete-record', {
        body: { type: 'donor', id, adminUsername, adminPassword }
      });
      return { success: !error, error };
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
      const { data, error } = await supabase.functions.invoke('secure-update-donor', {
        body: { action: 'reset_password', name, phone, blood_group, new_password }
      });
      return { success: !error, error };
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

      donors[donorIndex].total_donations = donorEvents.length;
      donors[donorIndex].last_donation_date = latestDate;
      donors[donorIndex].is_available = false;

      localStorage.setItem('bb_donors', JSON.stringify(donors));

      return { data: newEvent, error: null };
    } else {
      // Invoke secure update Edge Function
      const { data, error } = await supabase.functions.invoke('secure-update-donor', {
        body: { action: 'add_donation', id: donorId, password, payload: { donation_date: donationDate } }
      });
      return { data, error };
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

  async createEmergencyRequest(requestData, turnstileToken, honeypot) {
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
        body: { requestData, turnstileToken, honeypot }
      });
      return { data, error };
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
      const { data, error } = await supabase.functions.invoke('secure-delete-record', {
        body: { type: 'emergency', id, adminUsername, adminPassword, userPasscode }
      });
      return { success: !error, error };
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
