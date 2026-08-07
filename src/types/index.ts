export interface Donor {
  id: string;
  name: string;
  phone: string;
  blood_group: string;
  area: string;
  last_donation_date: string | null;
  is_available: boolean;
  total_donations: number;
  lifetime_donation_count: number;
  dob?: string | null;
  password?: string;
  created_at?: string;
}

export interface EmergencyRequest {
  id: string;
  blood_group: string;
  area: string;
  contact: string;
  note: string;
  passcode?: string;
  status: 'needed' | 'responded' | 'fulfilled';
  created_at: string;
}

export interface DonationEvent {
  id: string;
  donor_id: string;
  donation_date: string;
}

export interface SupportRequest {
  id?: string;
  type: 'support' | 'problem';
  name: string;
  phone: string;
  issue_type?: 'blocked_account' | 'bug_report' | 'fake_donor' | 'other' | null;
  message: string;
  created_at?: string;
}

export interface DonorBadge {
  label: string;
  color: string;
}
