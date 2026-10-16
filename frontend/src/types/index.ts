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
  email?: string | null;
  google_id?: string | null;
  avatar_url?: string | null;
  hide_photo?: boolean;
  password?: string;
  created_at?: string;
}

export interface EmergencyRequest {
  id: string;
  donor_id?: string | null;
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

export interface DonorCardConfig {
  id?: string;
  card_title: string;
  card_subtitle: string;
  front_notes?: string;
  back_terms?: string;
  emergency_hotline?: string;
  authorized_signatory_title?: string;
  badge_accent_color?: string;
  card_theme?: 'crimson_dark' | 'royal_navy' | 'emerald_prestige' | 'onyx_gold';
  badge_text?: string;
  issue_org?: string;
  website_url?: string;
  valid_years?: number;
  show_qr?: boolean | number;
  // Dynamic customizable labels
  front_tag_label?: string;
  qr_label?: string;
  back_guidelines_title?: string;
  security_strip_text?: string;
  show_magnetic_strip?: boolean | number;
  blood_group_label?: string;
  district_label?: string;
  donations_label?: string;
  valid_thru_label?: string;
  verified_status_text?: string;
  footer_sponsor_text?: string;
  issued_by_label?: string;
}

export interface DonorCardOffer {
  id: string;
  sponsor_name: string;
  sponsor_logo?: string | null;
  title: string;
  discount_text: string;
  description?: string | null;
  promo_code?: string | null;
  valid_until?: string | null;
  category?: string;
  is_active: boolean | number;
  created_at?: string;
}

