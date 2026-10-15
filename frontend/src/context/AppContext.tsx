import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { dbService } from '../services/db';
import { isDemoMode } from '../services/apiConfig';

import { appStorage } from '../services/storage';

// Robust cross-platform storage with cookie mirroring for mobile device resilience
const localStorage = appStorage;

const sessionStorage = (() => {
  const memoryStorage = {};
  return {
    getItem(key) {
      try {
        return window.sessionStorage.getItem(key);
      } catch (e) {
        return memoryStorage[key] || null;
      }
    },
    setItem(key, value) {
      try {
        window.sessionStorage.setItem(key, value);
      } catch (e) {
        memoryStorage[key] = String(value);
      }
    },
    removeItem(key) {
      try {
        window.sessionStorage.removeItem(key);
      } catch (e) {
        delete memoryStorage[key];
      }
    }
  };
})();

interface AppContextType {
  donors: any[];
  emergencyRequests: any[];
  loading: boolean;
  error: string | null;
  theme: 'light' | 'dark' | string;
  isAdmin: boolean;
  isDemoMode: boolean;
  language: 'en' | 'bn' | string;
  setLanguage: (lang: string) => void;
  t: (key: string, variables?: Record<string, any>) => string;
  toggleTheme: (e?: any) => void;
  currentDonor: any | null;
  setCurrentDonor: (donor: any | null) => void;
  logoutDonor: () => void;
  loginAdmin: (username: string, password?: string) => Promise<boolean>;
  loginAdminWithGoogle: (payload: { credential?: string; user?: any }) => Promise<{ success: boolean; error?: any }>;
  logoutAdmin: () => void;
  verifyDonorCredentials: (phone: string, password?: string) => Promise<{ success: boolean; donor?: any; error?: any }>;
  loginDonorWithGoogle: (payload: { credential?: string; user?: any }) => Promise<{ success: boolean; isNewUser?: boolean; donor?: any; googleProfile?: any; token?: string; error?: any }>;
  resetDonorPassword: (name: string, phone: string, bloodGroup: string, dob: string, newPassword?: string) => Promise<{ success: boolean; error?: any }>;
  registerDonor: (donorData: any, honeypot?: string) => Promise<{ success: boolean; data?: any; error?: any }>;
  updateDonorAvailability: (id: string, isAvailable: boolean, password?: string) => Promise<{ success: boolean; data?: any; error?: any }>;
  updateDonorProfile: (id: string, profileData: any, password?: string) => Promise<{ success: boolean; data?: any; error?: any }>;
  addDonationHistory: (donorId: string, donationDate: string, password?: string) => Promise<{ success: boolean; data?: any; error?: any }>;
  deleteDonor: (id: string, options?: { password?: string; isDonorSelfDelete?: boolean }) => Promise<{ success: boolean; error?: any }>;
  createEmergencyRequest: (requestData: any, honeypot?: string) => Promise<{ success: boolean; data?: any; error?: any }>;
  deleteEmergencyRequest: (id: string, userPasscode?: string, options?: { donorId?: string; donorPhone?: string }) => Promise<{ success: boolean; error?: any }>;
  updateEmergencyRequestStatus: (id: string, status: 'needed' | 'responded' | 'fulfilled' | string, userPasscode?: string, options?: { donorId?: string; donorPhone?: string }) => Promise<{ success: boolean; data?: any; error?: any }>;
  refreshData: (silent?: boolean) => Promise<void>;
  blockDonorByPhone: (phone: string, reason?: string) => Promise<{ success: boolean; error?: any }>;
  unblockDonorByPhone: (phone: string) => Promise<{ success: boolean; error?: any }>;
  getBlockedPhones: () => Promise<{ success: boolean; data: any[]; error?: any }>;
  getSupportRequests: () => Promise<{ data?: any[]; error?: any }>;
  showToast: (message: string, type?: 'success' | 'error' | 'warning') => void;
  checkIfBlocked: (phone: string) => Promise<{ data: boolean; error?: any }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const DISTRICT_AREAS = [
  {
    id: 'sylhet',
    name: 'Sylhet',
    nameBn: 'সিলেট জেলা ও সিটি',
    color: {
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-500/30 dark:border-emerald-500/40',
      dot: 'bg-emerald-500',
      optGroupClass: 'text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40',
    },
    upazilas: [
      'Sylhet City Corporation',
      'Sylhet Sadar Upazila',
      'Beanibazar Upazila',
      'Bishwanath Upazila',
      'Companiganj Upazila',
      'Fenchuganj Upazila',
      'Golapganj Upazila',
      'Gowainghat Upazila',
      'Jaintiapur Upazila',
      'Kanaighat Upazila',
      'Osmani Nagar Upazila',
      'South Surma Upazila',
      'Zakiganj Upazila',
      'Balaganj Upazila',
    ]
  },
  {
    id: 'moulvibazar',
    name: 'Moulvibazar',
    nameBn: 'মৌলভীবাজার জেলা',
    color: {
      bg: 'bg-sky-500/10 dark:bg-sky-500/20',
      text: 'text-sky-700 dark:text-sky-300',
      border: 'border-sky-500/30 dark:border-sky-500/40',
      dot: 'bg-sky-500',
      optGroupClass: 'text-sky-700 dark:text-sky-400 font-bold bg-sky-50 dark:bg-sky-950/40',
    },
    upazilas: [
      'Moulvibazar Sadar Upazila',
      'Barlekha Upazila',
      'Juri Upazila',
      'Kamalganj Upazila',
      'Kulaura Upazila',
      'Rajnagar Upazila',
      'Sreemangal Upazila',
    ]
  },
  {
    id: 'habiganj',
    name: 'Habiganj',
    nameBn: 'হবিগঞ্জ জেলা',
    color: {
      bg: 'bg-amber-500/10 dark:bg-amber-500/20',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-500/30 dark:border-amber-500/40',
      dot: 'bg-amber-500',
      optGroupClass: 'text-amber-700 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/40',
    },
    upazilas: [
      'Habiganj Sadar Upazila',
      'Ajmiriganj Upazila',
      'Bahubal Upazila',
      'Baniachang Upazila',
      'Chunarughat Upazila',
      'Lakhai Upazila',
      'Madhabpur Upazila',
      'Nabiganj Upazila',
      'Sayestaganj Upazila',
    ]
  },
  {
    id: 'sunamganj',
    name: 'Sunamganj',
    nameBn: 'সুনামগঞ্জ জেলা',
    color: {
      bg: 'bg-purple-500/10 dark:bg-purple-500/20',
      text: 'text-purple-700 dark:text-purple-300',
      border: 'border-purple-500/30 dark:border-purple-500/40',
      dot: 'bg-purple-500',
      optGroupClass: 'text-purple-700 dark:text-purple-400 font-bold bg-purple-50 dark:bg-purple-950/40',
    },
    upazilas: [
      'Sunamganj Sadar Upazila',
      'Bishwamvarpur Upazila',
      'Chhatak Upazila',
      'Derai Upazila',
      'Dharampasha Upazila',
      'Dowarabazar Upazila',
      'Jagannathpur Upazila',
      'Jamalganj Upazila',
      'Madyanagar Upazila',
      'Shantiganj Upazila',
      'Sullah Upazila',
      'Tahirpur Upazila',
    ]
  }
];

export const AREAS = DISTRICT_AREAS.flatMap((d) => d.upazilas);

export const getDistrictForArea = (area: string | undefined | null) => {
  if (!area) return DISTRICT_AREAS[0];
  const found = DISTRICT_AREAS.find((d) => d.upazilas.some((u) => u.toLowerCase() === area.toLowerCase()));
  if (found) return found;
  // Partial fallback matching
  const lower = area.toLowerCase();
  if (lower.includes('sylhet') || lower.includes('beanibazar') || lower.includes('golapganj') || lower.includes('bishwanath') || lower.includes('osmani')) {
    return DISTRICT_AREAS[0];
  }
  if (lower.includes('moulvi') || lower.includes('kulaura') || lower.includes('sreemangal') || lower.includes('barlekha') || lower.includes('kamalganj')) {
    return DISTRICT_AREAS[1];
  }
  if (lower.includes('habi') || lower.includes('nabiganj') || lower.includes('baniachang') || lower.includes('chunarughat') || lower.includes('sayesta')) {
    return DISTRICT_AREAS[2];
  }
  if (lower.includes('sunam') || lower.includes('chhatak') || lower.includes('jagannath') || lower.includes('tahirpur') || lower.includes('derai')) {
    return DISTRICT_AREAS[3];
  }
  return DISTRICT_AREAS[0];
};

export const getDistrictBadge = (area: string | undefined | null, language: string = 'en') => {
  const district = getDistrictForArea(area);
  return {
    label: language === 'bn' ? district.nameBn : district.name,
    color: district.color,
  };
};

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export const TRANSLATIONS = {
  en: {
    // Navigation
    dobLabel: 'Date of Birth',
    searchDonors: 'Search Donors',
    registerUpdate: 'Register / Update',
    emergencyRequests: 'Emergency Requests',
    adminDashboard: 'Admin Dashboard',
    logoutAdmin: 'Logout Admin',
    hospitalsStock: 'Hospital Stock',

    // Hospital Stock & Portal additions
    hospitalsStockTitle: 'Hospital Blood Stocks',
    hospitalsStockDesc: 'Check live stock levels and shortages across registered clinics and blood banks in Sylhet.',
    searchHospitalPlaceholder: 'Search hospital by name...',
    showShortageAlerts: 'Show only shortage alerts',
    noHospitalStocksFound: 'No Hospital Stocks Found',
    noHospitalStocksFoundDesc: 'Try adjusting your search query, selecting another area, or checking back later.',
    callClinic: 'Call Clinic',
    contactLabel: 'Contact',
    shortageLabel: 'Shortage',
    lowLabel: 'Low',
    stableLabel: 'Stable',
    updatedLabel: 'Updated',
    donateToClinic: 'Donate to this clinic',
    clinicProfileLabel: 'Clinic / Hospital Profile',
    approvedLabel: 'Approved',
    pendingApprovalLabel: 'Pending Approval',
    signOutLabel: 'Sign Out',
    accountVerificationStatusPending: 'Account Verification Status: Pending',
    clinicVerificationDesc: 'Your clinic registration has been submitted successfully. To secure patient safety and avoid fake stock reports, your profile is restricted from modifying blood stocks until verified by an administrator.',
    contactSupportVerify: 'Contact Support to Verify Hospital / Clinic Account',
    bloodStockLabel: 'Blood Stock',
    bloodStockDashboardTitle: 'Blood Stock Management Dashboard',
    bloodStockDashboardDesc: 'Select status for each blood group. Set groups experiencing shortages to \'Low\' or \'Critical\' to notify matching community donors.',
    saveStockChangesButton: 'Save Stock Changes',
    hospitalStockPortalTitle: 'Hospital Stock Portal',
    hospitalStockPortalDesc: 'Register your clinic or sign in to update local blood shortage status warnings.',
    signInTab: 'Sign In',
    registerClinicTab: 'Register Clinic',
    uniqueUsernameLabel: 'Unique Username',
    choosePasswordLabelPortal: 'Choose Password',
    registeringLabelPortal: 'Registering...',
    registerClinicAccountButton: 'Register Clinic Account',
    usernameRequirementsMsg: 'Username must be 3-15 chars (letters, numbers, underscore).',
    checkingAvailabilityMsg: 'Checking availability...',
    usernameAvailableMsg: 'Username is available!',
    usernameNotAvailableMsg: 'Username not available.',
    invalidCredentialsMsgPortal: 'Invalid username or password.',
    registrationSuccessPendingMsg: 'Registration submitted successfully! Verification Status: Pending. Please Contact Support to Verify Hospital / Clinic Account.',
    savingChangesMsg: 'Saving changes...',
    saveSuccessMsgPortal: 'All blood stock levels updated successfully!',
    saveErrorMsgPortal: 'Failed to update stock.',
    accountApprovedMsg: 'Account Approved! Loading your profile dashboard...',

    hospitalPortal: 'Hospital Portal',

    // Hero & Search
    findDonors: 'Find Blood Donors',
    findDonorsDesc: 'Search active donors near you in Sylhet local areas.',
    bloodGroup: 'Required Blood Group',
    area: 'Area (Sylhet Unions/Upazilas)',
    searchButton: 'Search Donors',
    searchQueryPlaceholder: 'Search by donor name or phone...',
    showingResults: 'Blood Donors Directory',
    available: 'Available',
    waiting: 'On Cooldown',
    notAvailable: 'Unavailable',
    phone: 'Phone',
    lastDonation: 'Last Donation',
    status: 'Status',
    call: 'Call',
    whatsapp: 'WhatsApp',
    showContact: 'Show Contact',
    show: 'Show',

    // Quick Stats
    totalRegistered: 'Total Registered',
    availableNow: 'Available Now',
    emergencyActive: 'Emergency Posts',
    activeDonors: 'Active Donors',

    // Register Page
    managementPortal: 'Donor Management Portal',
    portalDesc: 'Register as a new donor or manage your profile and update your donation history securely.',
    newDonorTab: 'New Donor',
    updateProfileTab: 'Sign In',
    signInWithGoogle: 'Continue with Google',
    registerWithGoogle: 'Register with Google',
    orDivider: 'OR',
    googleLinkedNotice: 'Google Account connected: ',
    googleAuthSuccess: 'Signed in with Google successfully!',
    googleCompleteProfile: 'Action Required: Please complete your donor profile to appear in searches and save lives.',
    completeProfileTitle: 'Complete Your Donor Profile',
    completeProfileSubtitle: 'Welcome to Darun Donors! Please provide your contact and blood details to finalize your lifesaver profile.',
    completeProfileBannerTitle: '⚠️ Action Required: Complete Your Profile',
    completeProfileBannerDesc: 'Your Google Account is linked, but emergency patients cannot reach you until you provide your Phone Number, Blood Group, and Upazila.',
    completeProfileStepNotice: 'Step 2 of 2: Almost Done!',
    phoneRequiredWarning: 'A valid Bangladeshi mobile number (013-019) is strictly required for patients to reach you in emergencies.',
    bloodGroupRequiredWarning: 'Select your accurate blood group to match with nearby emergency patients.',
    saveAndEnterDashboard: 'Save Profile & Enter Dashboard',
    googleAccountConnected: 'Google Account Verified',
    optional: 'Optional',
    fullName: 'Full Name',
    phoneUnique: 'Phone Number (Unique)',
    phoneFormatNotice: 'Fixed +88 with 11 digits starting with 013-019 (e.g. 01711223344)',
    phoneAlreadyRegisteredError: 'This phone number is already registered. Each donor must have a unique phone number.',
    age18RequiredError: 'You must be at least 18 years old to register as a blood donor.',
    age18Badge: 'Must be 18+ years old',
    choosePassword: 'Choose Account Password (min. 4 chars)',
    selectArea: 'Area (Sylhet Union/Upazila)',
    lastDonationOptional: 'Last Donation Date (Optional)',
    timesDonatedOptional: 'How Many Times Donated (Optional)',
    timesDonatedHelper: 'Approximate lifetime count if you donated before.',
    timesDonatedPlaceholder: 'e.g. 3',
    invalidDonationCountError: 'Donation count must be a number between 0 and 999.',
    setAvailable: 'Set Available to Donate',
    availableDesc: 'Toggle to appear available on searches',
    completeRegistration: 'Complete Registration',

    // Profile Update Section
    findProfile: 'Find Your Profile',
    enterPassword: 'Password',
    forgotPassword: 'Forgot Password?',
    loadProfileButton: 'Verify & Load Profile',
    logDonationTitle: 'Log a Donation Event',
    logDonationButton: 'Log Donation & Enter Cooldown',
    donationDate: 'Donation Date',
    updateDetailsTitle: 'Update Profile Details',
    saveChanges: 'Save Changes',
    hideGooglePhoto: 'Hide Profile Photo',
    hideGooglePhotoDesc: 'Hide your Google profile photo from public donor lists and use your blood group badge instead.',
    showGooglePhoto: 'Show Profile Photo',
    totalDonationsCount: 'Total Donations',
    times: 'times',
    never: 'Not Mentioned',
    confirmDonationModalTitle: 'Confirm Blood Donation',
    confirmDonationModalDesc: 'Are you sure you want to log a new blood donation on {date}?',
    confirmDonationCooldownWarning: 'Important: Once logged, medical safety rules require a mandatory 90-day cooldown period. Your profile will be marked unavailable for donation during this time.',
    confirmDonationProceedButton: 'Yes, Confirm & Enter Cooldown',
    confirmDonationCancelButton: 'Cancel',
    cooldownActiveTitle: 'Donation Cooldown Active',
    cooldownActiveDesc: 'You recently donated blood on {date}. For your health and medical safety, you cannot log another donation until your 90-day recovery cooldown ends.',
    daysRemainingCooldown: '{days} days remaining until eligible',
    cooldownEndsOn: 'Cooldown ends on {date}',
    cooldownRestrictedNotice: 'Donation Logging Restricted During Cooldown',
    cooldownResting: 'Recovering (In Cooldown)',
    cooldownRestingDesc: 'Donor is in mandatory 90-day medical recovery cooldown. Contact details are hidden to ensure restful recovery without disturbances.',
    loginRequiredToViewContact: 'Sign In Required',
    loginRequiredDesc: 'To protect our donors from spam and unauthorized disturbance, please sign in or register with your account to view contact numbers.',
    loginToViewContactButton: 'Sign In to View Contact',
    donorCommunityProtectedNotice: 'Donor privacy protected. Please sign in to reveal verified phone numbers.',
    deleteAccountBtn: 'Delete Account',
    deleteAccountConfirmTitle: 'Permanently Delete Account',
    deleteAccountConfirmDesc: 'Are you sure you want to permanently delete your donor account? All your donation records and personal details will be completely removed.',
    deleteAccountWarning: 'Warning: This action cannot be undone. You will no longer appear in donor directories.',
    deleteAccountPasswordPrompt: 'Enter your account password to confirm deletion:',
    deleteAccountGooglePrompt: 'Type DELETE to confirm deletion of your Google-linked account:',
    confirmDeleteAccountBtn: 'Permanently Delete My Account',
    cancelDeleteBtn: 'Keep Account',
    accountDeletedSuccess: 'Your donor account has been successfully deleted.',

    // Emergency Page
    emergencyTitle: 'Emergency Blood Requests',
    emergencyDesc: 'If you or your family needs blood urgently in Sylhet, post an emergency request here.',
    createRequestTitle: 'Create Urgent Request',
    locationHospital: 'Area Location',
    emergencyPhone: 'Emergency Contact Phone',
    accountDeletionPassword: 'Account / Deletion Password (min. 4 chars)',
    passwordHelper: 'If your contact number is registered, enter your donor account password. If not, set any password.',
    additionalDetails: 'Additional Details / Note',
    postRequestButton: 'Post Emergency Request',
    activeFeedTitle: 'Active Emergency Posts Feed',
    activeCount: 'active',
    filterEmergencyByBlood: 'Filter by Blood Group',
    filterEmergencyByArea: 'Filter by Area',
    allAreas: 'All Areas',
    allBloodGroups: 'All Groups',
    noEmergencyForBloodGroup: 'No active requests for {bloodGroup} blood.',
    noEmergencyForBloodGroupDesc: 'Try another blood group or check back later.',
    allAddressedTitle: 'All Requests Addressed!',
    allAddressedDesc: 'There are no active emergency blood requests in Sylhet at the moment. Keep saving lives!',
    postedAgo: 'Posted',
    actions: 'Actions',
    deleteRequest: 'Delete Request',
    enterDeletionPassword: 'Enter Deletion Password',
    loginRequiredToPost: 'Login Required to Post Request',
    loginRequiredToPostDesc: 'To ensure patient safety and prevent spam, creating an urgent blood request requires an active account login.',
    signInToPostUrgent: 'Sign In / Register with Google',
    urgentAutoDeleteNotice: 'Urgent requests automatically expire and are deleted after 24 hours.',
    verifiedRequester: 'Verified Requester',
    yourUrgentRequest: 'Your Urgent Request',
    deleteMyRequest: 'Delete My Request',
    confirmDeleteMyRequest: 'Are you sure you want to remove your urgent blood request?',
    expiresInHours: 'Expires in {hours}h',
    expiresInMinutes: 'Expires in {minutes}m',

    // Admin Page
    adminTitle: 'Administrator Console',
    adminDesc: 'Secure moderator panel for managing database listings and requests.',
    adminIdLabel: 'Admin ID / Username',
    adminPassLabel: 'Admin Passcode',
    adminLoginButton: 'Verify Administrator',
    supplySummary: 'Donor Supply Summary',
    manageDonorsList: 'Registered Donors Directory',
    bloodStock: 'Blood Stock status by groups',
    deleteDonorAction: 'Delete Donor',

    // Footers
    developedBy: 'Design & Developed By',
    dedicatedTo: 'Dedicated to saving lives in Sylhet, Bangladesh.',
    projectOf: 'Emergency Blood Donation Network',

    // Form Alerts & Errors
    invalidPhoneError: 'Please enter a valid phone number (10 to 15 digits).',
    invalidContactError: 'Please enter a valid contact number (10 to 15 digits).',
    passwordLengthError: 'Password must be at least 4 characters long.',
    passwordLengthRecoveryError: 'New password must be at least 4 characters long.',
    registeredPhonePasswordError: 'This contact phone number is registered. Please enter your correct donor account password to authorize posting.',
    postSuccessMsg: 'Emergency request for {bloodGroup} blood has been posted successfully!',
    postErrorMsg: 'Failed to post emergency request.',
    unexpectedError: 'An unexpected error occurred.',
    fillAllFieldsError: 'Please fill out all fields.',
    forgotPasswordPhonePasswordError: 'Please enter both your phone number and password.',
    invalidPhonePasswordError: 'Invalid phone or password.',
    authErrorTryAgain: 'Authentication error. Please try again.',
    profileUpdateSuccess: 'Profile updated successfully.',
    profileUpdateError: 'Failed to update profile.',
    donationLoggedSuccess: 'Donation event logged! Your cooldown is active, and availability is set to waiting.',
    donationLoggedError: 'Failed to log donation event.',
    recoverySuccess: 'Identity verified! Password has been reset successfully. You can now load your profile.',
    recoveryError: 'Verification failed. Please check details.',
    recoveryGeneralError: 'An error occurred during password recovery.',
    incorrectPasswordDeleteError: 'Incorrect password. Deletion rejected.',
    deleteSuccess: 'Emergency request deleted successfully.',
    deleteErrorPrefix: 'Error deleting request: ',
    unknownError: 'Unknown error',
    adminAuthSuccessText: "Authenticated as Admin. You do not need to enter the user's password.",
    regSuccessMsg: 'Congratulations! {name} has been registered successfully.',
    registrationFailed: 'Registration failed.',
    donorRegistrationTitle: 'Donor Registration',
    registeredPhoneLabel: 'Registered Phone Number',

    // Placeholders
    hospitalPlaceholder: 'e.g. Osmani Medical College Hospital',
    passwordPlaceholder: 'Enter account password or choose a password...',
    recoveryPasswordPlaceholder: 'Enter new password...',
    notePlaceholder: 'Details like surgery reason, amount needed, timing, etc...',
    donorNamePlaceholder: 'e.g. ADIL HUSSAIN',
    phonePlaceholder: 'e.g. 01712345678',
    choosePasswordPlaceholder: 'Choose password to update profile later...',
    enterPasswordPlaceholder: 'Enter password...',

    // Dynamic UI Labels
    cooldownProgress: 'Cooldown Progress',
    daysLeft: '{days} days left',
    daysRemainingText: 'Available in {days} days',
    timesUnit: '{count} times',
    neverDonated: 'Not Mentioned',
    deletingRequestText: 'Deleting request for',
    bloodAtText: 'blood at',
    cancelButton: 'Cancel',
    processingButton: 'Processing...',
    postingButton: 'Posting...',
    registeringButton: 'Registering...',
    verifyingButton: 'Verifying...',
    loggingButton: 'Logging...',
    justNow: 'Just now',
    hoursAgo: '{hours}h ago',
    noDescription: 'No description',
    emergencyBloodNeeded: 'Emergency {bloodGroup} Needed',
    contactNumberLabel: 'Contact Number: ',
    recoveryTab: 'Recover Password',
    recoveryDesc: 'Enter your registered Name, Phone Number, and Blood Group to verify your donor identity and reset your passcode.',
    registeredFullNameLabel: 'Registered Full Name',
    chooseNewPasswordLabel: 'Choose New Password (min. 4 chars)',
    verifyResetPasswordButton: 'Verify & Reset Password',
    donationHistoryTitle: 'Donation History Log',
    loadingDonationHistory: 'Loading donation log...',
    noDonationEvents: 'No past donation events logged for this donor profile.',
    eventDateLabel: 'Event Date',
    statusLabel: 'Status',
    loggedStatus: 'Logged',
    areaLabel: 'Area',
    toggleManualPresence: 'Toggle your profile presence manually',

    // Home Page Additional
    empoweringCommunity: 'Empowering Sylhet Community',
    everyDonorLifesaver: 'Every Blood Donor is a Lifesaver',
    lifesaverWord: 'Lifesaver',
    heroDescText: 'A local network connecting blood donors in Sylhet. Search by blood group, check real-time donor availability, and respond to local emergencies.',
    registerAsDonorButton: 'Register as Donor',
    filterDonorsTitle: 'Filter Search',
    clearButton: 'Clear',
    searchByNamePhoneLabel: 'Search by name / phone',
    selectAreaLabel: 'Select Area',
    allBeanibazarAreas: 'All Sylhet Areas',
    recentEmergencyRequestsTitle: 'Recent Emergency Blood Requests',
    locationPrioritizedTooltip: 'Prioritized based on your location',
    nearYouBadge: 'Near You',
    sameDistrictBadge: 'Your District',
    viewAllRequestsLink: 'View All Requests',
    noDescriptionProvided: 'No description provided.',
    foundSuffix: 'found',
    noDonorsFoundTitle: 'No Donors Found',
    noDonorsFoundDesc: 'There are no registered donors matching your filters. Try clearing them or register a new donor profile to help.',
    resetFiltersButton: 'Reset Filters',
    registerDonorLink: 'Register Donor',
    donorInfoLabel: 'Donor Info',
    areaUnionLabel: 'Area Union',
    availabilityLabel: 'Availability',
    timesDonatedHeader: 'Times Donated',
    actionsLabel: 'Actions',
    unavailableManual: 'Unavailable (Manual)',
    totalDonationsText: 'Total: {count} times',
    donorBadgeNew: 'New Donor',
    donorBadgeNormal: 'Normal Donor',
    donorBadgeActive: 'Active Donor',
    donorBadgeHero: 'Hero Donor',

    // Pagination
    previousPage: 'Previous',
    nextPage: 'Next',
    pageIndicator: 'Page {current} of {total}',

    // Admin Dashboard Additions
    adminAuthTitle: 'Admin Authentication',
    adminPortalSub: 'Darun Donors Admin Portal',
    adminDescLogin: 'Please enter administrator credentials to manage records.',
    adminLoginError: 'Invalid Administrator Credentials. Please check Admin ID and Password.',
    adminConnError: 'Authentication failed. Connection error.',
    adminPassPlaceholder: 'Enter password...',
    adminIdPlaceholder: 'Enter Admin ID...',
    authenticatingButton: 'Authenticating...',
    adminDashboardTitle: 'Administration Dashboard',
    moderatorControlsText: 'System Moderator Controls',
    exitAdminButton: 'Exit Admin',
    manageDonorsTab: 'Manage Donors',
    manageEmergenciesTab: 'Manage Emergencies',
    areYouSureTitle: 'Are you absolutely sure?',
    permanentActionWarning: 'This action is permanent and cannot be undone. You are about to delete a {type} record.',
    registeredDonorWord: 'registered donor',
    emergencyRequestWord: 'emergency request',
    confirmDeleteButton: 'Confirm Delete',
    deletingButton: 'Deleting...',
    donorRecordsHeader: 'Donor Registration Records',
    categoryLabel: 'Category:',
    allCategoryPill: 'All',
    noDonorsInCategory: 'No donors registered under the {category} category.',
    nameHeader: 'Name',
    bloodGroupHeader: 'Blood Group',
    phoneHeader: 'Phone Number',
    areaHeader: 'Area Location',
    donationsHeader: 'Donations',
    actionsHeader: 'Actions',
    activeEmergencyRecordsHeader: 'Active Emergency Request Records',
    noActiveEmergencies: 'No active emergency blood requests.',
    bloodNeededHeader: 'Blood Needed',
    hospitalAreaHeader: 'Area',
    contactPhoneHeader: 'Contact Phone',
    noteDetailsHeader: 'Note / Details',
    postedDateHeader: 'Posted Date',
    errorDeletingDonorPrefix: 'Error deleting donor: ',
    errorDeletingRequestPrefix: 'Error deleting emergency request: ',
    // Sylhet City & Key Areas
    area_sylhetcitycorporation: 'Sylhet City Corporation',
    // Sylhet Upazilas
    area_sylhetsadarupazila: 'Sylhet Sadar Upazila',
    area_beanibazarupazila: 'Beanibazar Upazila',
    area_bishwanathupazila: 'Bishwanath Upazila',
    area_companiganjupazila: 'Companiganj Upazila',
    area_fenchuganjupazila: 'Fenchuganj Upazila',
    area_golapganjupazila: 'Golapganj Upazila',
    area_gowainghatupazila: 'Gowainghat Upazila',
    area_jaintiapurupazila: 'Jaintiapur Upazila',
    area_kanaighatupazila: 'Kanaighat Upazila',
    area_osmaninagarupazila: 'Osmani Nagar Upazila',
    area_southsurmaupazila: 'South Surma Upazila',
    area_zakiganjupazila: 'Zakiganj Upazila',
    area_balaganjupazila: 'Balaganj Upazila',
    // Moulvibazar Upazilas
    area_moulvibazarsadarupazila: 'Moulvibazar Sadar Upazila',
    area_barlekhaupazila: 'Barlekha Upazila',
    area_juriupazila: 'Juri Upazila',
    area_kamalganjupazila: 'Kamalganj Upazila',
    area_kulauraupazila: 'Kulaura Upazila',
    area_rajnagarupazila: 'Rajnagar Upazila',
    area_sreemangalupazila: 'Sreemangal Upazila',
    // Habiganj Upazilas
    area_habiganjsadarupazila: 'Habiganj Sadar Upazila',
    area_ajmiriganjupazila: 'Ajmiriganj Upazila',
    area_bahubalupazila: 'Bahubal Upazila',
    area_baniachangupazila: 'Baniachang Upazila',
    area_chunarughatupazila: 'Chunarughat Upazila',
    area_lakhaiupazila: 'Lakhai Upazila',
    area_madhabpurupazila: 'Madhabpur Upazila',
    area_nabiganjupazila: 'Nabiganj Upazila',
    area_sayestaganjupazila: 'Sayestaganj Upazila',
    // Sunamganj Upazilas
    area_sunamganjsadarupazila: 'Sunamganj Sadar Upazila',
    area_bishwamvarpurupazila: 'Bishwamvarpur Upazila',
    area_chhatakupazila: 'Chhatak Upazila',
    area_deraiupazila: 'Derai Upazila',
    area_dharampashaupazila: 'Dharampasha Upazila',
    area_dowarabazarupazila: 'Dowarabazar Upazila',
    area_jagannathpurupazila: 'Jagannathpur Upazila',
    area_jamalganjupazila: 'Jamalganj Upazila',
    area_madyanagarupazila: 'Madyanagar Upazila',
    area_shantiganjupazila: 'Shantiganj Upazila',
    area_sullahupazila: 'Sullah Upazila',
    area_tahirpurupazila: 'Tahirpur Upazila',

    // Support Page
    supportTitle: 'Help & Support',
    supportDesc: 'Need help or want to report a problem? Get in touch with our team.',
    contactSupportTab: 'Contact Support',
    reportProblemTab: 'Report a Problem',
    supportName: 'Your Name',
    supportPhone: 'Phone Number',
    supportMessage: 'Your Message / Query',
    supportIssueType: 'Select Issue Type',
    supportSubmit: 'Submit Request',
    supportSuccessMsg: 'Your request has been submitted successfully!',
    supportErrorMsg: 'Failed to submit request.',
    blockedAccount: 'Blocked Account',
    bugReport: 'App Bug / Error',
    fakeDonor: 'Report Fake Donor Profile',
    incorrectDonorDetails: 'Incorrect Donor Details',
    otherIssue: 'Other Problem',

    // Legal & Privacy
    termsNav: 'Terms & Conditions',
    privacyNav: 'Privacy Policy',
    agreeToTermsPrefix: 'I have read and agree to the',
    termsAndConditionsText: 'Terms & Conditions',
    andText: 'and',
    privacyPolicyText: 'Privacy Policy',
    mustAgreeTermsError: 'You must agree to the Terms & Conditions and Privacy Policy to register.',
  },
  bn: {
    // Navigation
    dobLabel: 'জন্ম তারিখ',
    searchDonors: 'রক্তদাতা খুঁজুন',
    registerUpdate: 'নিবন্ধন / আপডেট',
    emergencyRequests: 'জরুরি রক্তের অনুরোধ',
    adminDashboard: 'অ্যাডমিন ড্যাশবোর্ড',
    logoutAdmin: 'লগআউট অ্যাডমিন',
    hospitalsStock: 'হাসপাতাল স্টক',

    // Hospital Stock & Portal additions
    hospitalsStockTitle: 'হাসপাতাল রক্তের স্টকসমূহ',
    hospitalsStockDesc: 'সিলেটের নিবন্ধিত ক্লিনিক এবং ব্লাড ব্যাংকের লাইভ স্টকের স্তর এবং ঘাটতি পরীক্ষা করুন।',
    searchHospitalPlaceholder: 'হাসপাতালের নাম দিয়ে খুঁজুন...',
    showShortageAlerts: 'শুধুমাত্র সংকট সতর্কতা দেখান',
    noHospitalStocksFound: 'কোনো হাসপাতালের স্টক পাওয়া যায়নি',
    noHospitalStocksFoundDesc: 'আপনার অনুসন্ধানের শব্দ পরিবর্তন করুন, অন্য এলাকা নির্বাচন করুন বা পরে আবার চেষ্টা করুন।',
    callClinic: 'ক্লিনিকে কল করুন',
    contactLabel: 'যোগাযোগ',
    shortageLabel: 'জরুরী সংকট',
    lowLabel: 'স্বল্পতা',
    stableLabel: 'স্বাভাবিক',
    updatedLabel: 'আপডেট করা হয়েছে',
    donateToClinic: 'এই ক্লিনিকে রক্তদান করুন',
    clinicProfileLabel: 'ক্লিনিক / হাসপাতাল প্রোফাইল',
    approvedLabel: 'অনুমোদিত',
    pendingApprovalLabel: 'অনুমোদনের অপেক্ষায়',
    signOutLabel: 'লগ আউট',
    accountVerificationStatusPending: 'অ্যাকাউন্টের অবস্থা: অনুমোদনের অপেক্ষায়',
    clinicVerificationDesc: 'আপনার ক্লিনিক নিবন্ধন সফলভাবে জমা দেওয়া হয়েছে। রোগীর সুরক্ষা নিশ্চিত করতে এবং ভুয়া স্টক রিপোর্ট এড়াতে, অ্যাডমিন কর্তৃক যাচাই না হওয়া পর্যন্ত আপনার প্রোফাইলটি রক্তের স্টক পরিবর্তন করা থেকে সীমাবদ্ধ থাকবে।',
    contactSupportVerify: 'হাসপাতাল / ক্লিনিক অ্যাকাউন্ট যাচাই করতে সাপোর্টের সাথে যোগাযোগ করুন',
    bloodStockLabel: 'রক্তের স্টক',
    bloodStockDashboardTitle: 'রক্তের স্টক ম্যানেজমেন্ট ড্যাশবোর্ড',
    bloodStockDashboardDesc: 'প্রতিটি রক্তের গ্রুপের জন্য স্ট্যাটাস নির্বাচন করুন। সিলেটের স্থানীয় দাতাদের অবহিত করতে যে রক্তের গ্রুপগুলোর সংকট রয়েছে তা \'Low\' বা \'Critical\' এ সেট করুন।',
    saveStockChangesButton: 'স্টক পরিবর্তন সংরক্ষণ করুন',
    hospitalStockPortalTitle: 'হাসপাতাল স্টক পোর্টাল',
    hospitalStockPortalDesc: 'আপনার ক্লিনিক নিবন্ধন করুন বা স্থানীয় রক্তের ঘাটতি সতর্কবার্তা আপডেট করতে লগইন করুন।',
    signInTab: 'সাইন ইন',
    registerClinicTab: 'ক্লিনিক নিবন্ধন',
    uniqueUsernameLabel: 'ইউনিক ইউজারনেম',
    choosePasswordLabelPortal: 'পাসওয়ার্ড নির্বাচন করুন',
    registeringLabelPortal: 'নিবন্ধন করা হচ্ছে...',
    registerClinicAccountButton: 'ক্লিনিক অ্যাকাউন্ট নিবন্ধন করুন',
    usernameRequirementsMsg: 'ইউজারনেম ৩-১৫ অক্ষরের হতে হবে (অক্ষর, সংখ্যা, আন্ডারস্কোর)।',
    checkingAvailabilityMsg: 'যাচাই করা হচ্ছে...',
    usernameAvailableMsg: 'ইউজারনেমটি উপলব্ধ রয়েছে!',
    usernameNotAvailableMsg: 'ইউজারনেমটি উপলব্ধ নেই।',
    invalidCredentialsMsgPortal: 'ভুল ইউজারনেম বা পাসওয়ার্ড।',
    registrationSuccessPendingMsg: 'নিবন্ধন সফলভাবে জমা হয়েছে! অ্যাকাউন্টের অবস্থা: পেন্ডিং। হাসপাতাল / ক্লিনিক অ্যাকাউন্ট যাচাই করতে দয়া করে সাপোর্টের সাথে যোগাযোগ করুন।',
    savingChangesMsg: 'সংরক্ষণ করা হচ্ছে...',
    saveSuccessMsgPortal: 'সব রক্তের গ্রুপের স্টক সফলভাবে আপডেট করা হয়েছে!',
    saveErrorMsgPortal: 'স্টক আপডেট করতে ব্যর্থ হয়েছে।',
    accountApprovedMsg: 'অ্যাকাউন্ট অনুমোদিত হয়েছে! প্রোফাইল ড্যাশবোর্ড লোড হচ্ছে...',

    hospitalPortal: 'হাসপাতাল পোর্টাল',

    // Hero & Search
    findDonors: 'রক্তদাতা অনুসন্ধান',
    findDonorsDesc: 'সিলেটের স্থানীয় এলাকায় আপনার নিকটবর্তী সক্রিয় রক্তদাতাদের খুঁজুন।',
    bloodGroup: 'রক্তের গ্রুপ',
    area: 'এলাকা (সিলেট ইউনিয়ন/উপজেলা)',
    searchButton: 'অনুসন্ধান করুন',
    searchQueryPlaceholder: 'দাতা বা ফোন নম্বর দিয়ে খুঁজুন...',
    showingResults: 'রক্তদাতাদের তালিকা',
    available: 'প্রস্তুত',
    waiting: 'অপেক্ষমান (কুলডাউন)',
    notAvailable: 'অনুপস্থিত',
    phone: 'ফোন',
    lastDonation: 'শেষ রক্তদান',
    status: 'অবস্থা',
    call: 'কল করুন',
    whatsapp: 'হোয়াটসঅ্যাপ',
    showContact: 'যোগাযোগ দেখুন',
    show: 'দেখুন',

    // Quick Stats
    totalRegistered: 'মোট নিবন্ধিত',
    availableNow: 'বর্তমানে প্রস্তুত',
    emergencyActive: 'জরুরি অনুরোধসমূহ',
    activeDonors: 'সক্রিয় রক্তদাতা',

    // Register Page
    managementPortal: 'রক্তদাতা ব্যবস্থাপনা পোর্টাল',
    portalDesc: 'নতুন রক্তদাতা হিসেবে নিবন্ধন করুন বা আপনার প্রোফাইল ও রক্তদানের তথ্য আপডেট করুন।',
    newDonorTab: 'নতুন রক্তদাতা',
    updateProfileTab: 'সাইন ইন',
    signInWithGoogle: 'গুগল দিয়ে প্রবেশ করুন',
    registerWithGoogle: 'গুগল দিয়ে নিবন্ধন করুন',
    orDivider: 'অথবা',
    googleLinkedNotice: 'গুগল অ্যাকাউন্ট সংযুক্ত হয়েছে: ',
    googleAuthSuccess: 'গুগল দিয়ে সফলভাবে প্রবেশ সম্পন্ন হয়েছে!',
    googleCompleteProfile: 'জরুরি করণীয়: রক্তের অনুসন্ধান তালিকায় আপনার নাম দেখাতে দয়া করে প্রোফাইল সম্পন্ন করুন।',
    completeProfileTitle: 'আপনার রক্তদাতা প্রোফাইল সম্পন্ন করুন',
    completeProfileSubtitle: 'দারুণ ডোনার্স-এ স্বাগতম! আপনার রক্তদাতা প্রোফাইল সক্রিয় করতে নিচে যোগাযোগের তথ্য ও রক্তের বিবরণ দিন।',
    completeProfileBannerTitle: '⚠️ জরুরি পদক্ষেপ: আপনার প্রোফাইলটি সম্পন্ন করুন',
    completeProfileBannerDesc: 'আপনার গুগল অ্যাকাউন্ট সংযুক্ত হয়েছে, তবে ফোন নম্বর, রক্তের গ্রুপ এবং উপজেলা প্রদান না করা পর্যন্ত জরুরি রোগীরা আপনার সাথে যোগাযোগ করতে পারবে না।',
    completeProfileStepNotice: 'ধাপ ২ এর ২: প্রায় সম্পন্ন!',
    phoneRequiredWarning: 'জরুরি পরিস্থিতিতে রোগীদের আপনার সাথে সরাসরি যোগাযোগের জন্য সচল বাংলাদেশি ফোন নম্বর (০১৩-০১৯) বাধ্যতামূলক।',
    bloodGroupRequiredWarning: 'কাছের জরুরি রোগীর প্রয়োজনের সাথে মেলাতে আপনার সঠিক রক্তের গ্রুপ নির্বাচন করুন।',
    saveAndEnterDashboard: 'প্রোফাইল সংরক্ষণ ও ড্যাশবোর্ডে প্রবেশ করুন',
    googleAccountConnected: 'গুগল অ্যাকাউন্ট যাচাইকৃত',
    optional: 'ঐচ্ছিক',
    fullName: 'পূর্ণ নাম',
    phoneUnique: 'ফোন নম্বর (ইউনিক)',
    phoneFormatNotice: 'স্থির +88 সহ 013-019 দিয়ে শুরু ১১ ডিজিট (যেমন: 01711223344)',
    phoneAlreadyRegisteredError: 'এই ফোন নম্বরটি ইতিমধ্যে নিবন্ধিত। প্রতিটি দাতার নিজস্ব ইউনিক ফোন নম্বর থাকতে হবে।',
    age18RequiredError: 'রক্তদাতা হিসেবে নিবন্ধন করতে আপনার বয়স অবশ্যই কমপক্ষে ১৮ বছর হতে হবে।',
    age18Badge: 'বয়স নূন্যতম ১৮ বছর আবশ্যক',
    choosePassword: 'অ্যাকাউন্ট পাসওয়ার্ড (নূন্যতম ৪ অক্ষর)',
    selectArea: 'এলাকা (সিলেট ইউনিয়ন/উপজেলা)',
    lastDonationOptional: 'শেষ রক্তদানের তারিখ (ঐচ্ছিক)',
    timesDonatedOptional: 'কতবার রক্ত দিয়েছেন (ঐচ্ছিক)',
    timesDonatedHelper: 'আগে রক্ত দিয়ে থাকলে আনুমানিক মোট সংখ্যা লিখুন।',
    timesDonatedPlaceholder: 'যেমন: ৩',
    invalidDonationCountError: 'রক্তদানের সংখ্যা ০ থেকে ৯৯৯ এর মধ্যে হতে হবে।',
    setAvailable: 'রক্তদানে প্রস্তুত থাকুন',
    availableDesc: 'অনুসন্ধানে আপনার নাম দেখাতে টিক দিন',
    completeRegistration: 'নিবন্ধন সম্পন্ন করুন',

    // Profile Update Section
    findProfile: 'আপনার প্রোফাইল খুঁজুন',
    enterPassword: 'পাসওয়ার্ড',
    forgotPassword: 'পাসওয়ার্ড ভুলে গেছেন?',
    loadProfileButton: 'যাচাই ও প্রোফাইল লোড',
    logDonationTitle: 'রক্তদানের তথ্য যোগ করুন',
    logDonationButton: 'তথ্য যোগ ও কুলডাউনে প্রবেশ',
    donationDate: 'রক্তদানের তারিখ',
    updateDetailsTitle: 'প্রোফাইলের তথ্য সংশোধন',
    saveChanges: 'পরিবর্তন সংরক্ষণ করুন',
    hideGooglePhoto: 'প্রোফাইল ছবি লুকিয়ে রাখুন',
    hideGooglePhotoDesc: 'পাবলিক রক্তদাতা তালিকা থেকে আপনার গুগল ছবি গোপন রাখুন এবং রক্তের গ্রুপের ব্যাজ দেখান।',
    showGooglePhoto: 'প্রোফাইল ছবি প্রদর্শন করুন',
    totalDonationsCount: 'মোট রক্তদান',
    times: 'বার',
    never: 'উল্লেখ নেই',
    confirmDonationModalTitle: 'রক্তদানের তথ্য নিশ্চিতকরণ',
    confirmDonationModalDesc: 'আপনি কি নিশ্চিত যে আপনি {date} তারিখে নতুন রক্তদানের তথ্য যোগ করতে চান?',
    confirmDonationCooldownWarning: 'সতর্কতা: তথ্য যোগ করার পর চিকিৎসা নিয়মানুযায়ী আপনার অ্যাকাউন্টে বাধ্যতামূলক ৯০ দিনের কুলডাউন প্রযোজ্য হবে এবং এই সময়ে আপনার প্রোফাইল রক্তদানে সাময়িক অনুপলব্ধ থাকবে।',
    confirmDonationProceedButton: 'হ্যাঁ, নিশ্চিত করুন ও কুলডাউনে প্রবেশ করুন',
    confirmDonationCancelButton: 'বাতিল',
    cooldownActiveTitle: 'রক্তদানের কুলডাউন সক্রিয় রয়েছে',
    cooldownActiveDesc: 'আপনি সম্প্রতি {date} তারিখে রক্তদান করেছেন। আপনার শারীরিক সুরক্ষা ও স্বাস্থ্যবিধির স্বার্থে ৯০ দিনের কুলডাউন শেষ না হওয়া পর্যন্ত পুনরায় নতুন রক্তদান যোগ করা যাবে না।',
    daysRemainingCooldown: 'পুনরায় রক্তদানে আরও {days} দিন বাকি',
    cooldownEndsOn: 'কুলডাউন শেষ হবে: {date}',
    cooldownRestrictedNotice: 'কুলডাউন চলাকালীন নতুন রক্তদান যোগ করা নিষিদ্ধ',
    cooldownResting: 'বিশ্রামে আছেন (কুলডাউন)',
    cooldownRestingDesc: 'রক্তদাতা ৯০ দিনের বিশ্রাম ও শারীরিক সুরক্ষার কুলডাউনে আছেন। সুস্থতা নিশ্চিতে এই সময়ে যোগাযোগ তথ্য গোপন রাখা হয়েছে।',
    loginRequiredToViewContact: 'লগইন আবশ্যক',
    loginRequiredDesc: 'রক্তদাতাদের নিরাপত্তা ও অপ্রয়োজনীয় বিরক্তি রোধে নম্বর দেখতে অনুগ্রহ করে অ্যাকাউন্টে লগইন অথবা রেজিস্ট্রেশন করুন।',
    loginToViewContactButton: 'নম্বর দেখতে লগইন করুন',
    donorCommunityProtectedNotice: 'রক্তদাতাদের নিরাপত্তা সুরক্ষিত। নম্বর দেখতে সাইন ইন করুন।',
    deleteAccountBtn: 'অ্যাকাউন্ট মুছে ফেলুন',
    deleteAccountConfirmTitle: 'স্থায়ীভাবে অ্যাকাউন্ট মুছে ফেলা',
    deleteAccountConfirmDesc: 'আপনি কি নিশ্চিত যে আপনার রক্তদাতা অ্যাকাউন্টটি স্থায়ীভাবে মুছে ফেলতে চান? আপনার সকল রক্তদানের তথ্য ও প্রোফাইল স্থায়ীভাবে ডিলিট হয়ে যাবে।',
    deleteAccountWarning: 'সতর্কতা: এই কাজটি পূর্বাবস্থায় ফিরিয়ে আনা সম্ভব নয়। আপনি আর রক্তদাতা তালিকায় উপস্থিত থাকবেন না।',
    deleteAccountPasswordPrompt: 'অ্যাকাউন্ট ডিলিট নিশ্চিত করতে আপনার পাসওয়ার্ড দিন:',
    deleteAccountGooglePrompt: 'আপনার গুগল অ্যাকাউন্ট নিশ্চিত করতে DELETE টাইপ করুন:',
    confirmDeleteAccountBtn: 'স্থায়ীভাবে অ্যাকাউন্ট ডিলিট করুন',
    cancelDeleteBtn: 'অ্যাকাউন্ট রাখুন',
    accountDeletedSuccess: 'আপনার রক্তদাতা অ্যাকাউন্টটি সফলভাবে মুছে ফেলা হয়েছে।',

    // Emergency Page
    emergencyTitle: 'জরুরি রক্তের অনুরোধসমূহ',
    emergencyDesc: 'যদি আপনার বা আপনার পরিবারের সিলেটে জরুরি রক্তের প্রয়োজন হয়, এখানে অনুরোধ পোস্ট করুন।',
    createRequestTitle: 'জরুরি রক্তের অনুরোধ তৈরি করুন',
    locationHospital: 'এলাকার অবস্থান',
    emergencyPhone: 'জরুরি যোগাযোগের ফোন নম্বর',
    accountDeletionPassword: 'অ্যাকাউন্ট / মুছে ফেলার পাসওয়ার্ড (নূন্যতম ৪ অক্ষর)',
    passwordHelper: 'যদি আপনার নম্বর নিবন্ধিত থাকে, তবে অ্যাকাউন্টের পাসওয়ার্ড দিন। না থাকলে যেকোনো পাসওয়ার্ড দিন।',
    additionalDetails: 'অতিরিক্ত বিবরণ / নোট',
    postRequestButton: 'জরুরি অনুরোধ পোস্ট করুন',
    activeFeedTitle: 'সক্রিয় অনুরোধসমূহের তালিকা',
    activeCount: 'সক্রিয়',
    filterEmergencyByBlood: 'রক্তের গ্রুপ অনুযায়ী ফিল্টার',
    filterEmergencyByArea: 'এলাকা অনুযায়ী ফিল্টার',
    allAreas: 'সব এলাকা',
    allBloodGroups: 'সব গ্রুপ',
    noEmergencyForBloodGroup: '{bloodGroup} রক্তের জন্য কোনো সক্রিয় অনুরোধ নেই।',
    noEmergencyForBloodGroupDesc: 'অন্য রক্তের গ্রুপ বেছে নিন অথবা পরে আবার দেখুন।',
    allAddressedTitle: 'সব অনুরোধ সম্পন্ন হয়েছে!',
    allAddressedDesc: 'এই মুহূর্তে সিলেটে কোনো সক্রিয় জরুরি রক্তের অনুরোধ নেই। জীবন বাঁচাতে থাকুন!',
    postedAgo: 'পোস্টের সময়',
    actions: 'অ্যাকশন',
    deleteRequest: 'অনুরোধ মুছে ফেলুন',
    enterDeletionPassword: 'মুছে ফেলার পাসওয়ার্ড লিখুন',
    loginRequiredToPost: 'অনুরোধ তৈরি করতে লগইন আবশ্যক',
    loginRequiredToPostDesc: 'রোগীর নিরাপত্তা নিশ্চিত করতে ও ভুয়া অনুরোধ রোধ করতে জরুরি রক্তের অনুরোধ তৈরি করতে লগইন থাকা আবশ্যক।',
    signInToPostUrgent: 'গুগল দিয়ে লগইন / নিবন্ধন করুন',
    urgentAutoDeleteNotice: 'জরুরি অনুরোধ ২৪ ঘণ্টা পর স্বয়ংক্রিয়ভাবে মুছে যাবে।',
    verifiedRequester: 'যাচাইকৃত ব্যবহারকারী',
    yourUrgentRequest: 'আপনার জরুরি অনুরোধ',
    deleteMyRequest: 'আমার অনুরোধ মুছুন',
    confirmDeleteMyRequest: 'আপনি কি আপনার জরুরি রক্তের অনুরোধটি মুছে ফেলতে নিশ্চিত?',
    expiresInHours: '{hours} ঘণ্টা বাকি',
    expiresInMinutes: '{minutes} মিনিট বাকি',

    // Footers
    developedBy: 'ডিজাইন ও ডেভেলপমেন্টে',
    dedicatedTo: 'সিলেট, বাংলাদেশে জীবন বাঁচাতে নিবেদিত।',
    projectOf: 'জরুরী রক্তদান নেটওয়ার্ক',

    // Form Alerts & Errors
    invalidPhoneError: 'অনুগ্রহ করে একটি সঠিক ফোন নম্বর লিখুন (১০ থেকে ১৫ ডিজিট)।',
    invalidContactError: 'অনুগ্রহ করে একটি সঠিক যোগাযোগের নম্বর লিখুন (১০ থেকে ১৫ ডিজিট)।',
    passwordLengthError: 'পাসওয়ার্ডটি অবশ্যই অন্তত ৪ অক্ষরের হতে হবে।',
    passwordLengthRecoveryError: 'নতুন পাসওয়ার্ডটি অবশ্যই অন্তত ৪ অক্ষরের হতে হবে।',
    registeredPhonePasswordError: 'এই যোগাযোগের ফোন নম্বরটি ইতিমধ্যে নিবন্ধিত। পোস্ট করার জন্য আপনার সঠিক দাতার পাসওয়ার্ড দিন।',
    postSuccessMsg: 'জরুরি রক্তের অনুরোধ ({bloodGroup}) সফলভাবে পোস্ট করা হয়েছে!',
    postErrorMsg: 'জরুরি অনুরোধ পোস্ট করতে ব্যর্থ হয়েছে।',
    unexpectedError: 'একটি অপ্রত্যাশিত ত্রুটি ঘটেছে।',
    fillAllFieldsError: 'অনুগ্রহ করে সব ঘর পূরণ করুন।',
    forgotPasswordPhonePasswordError: 'অনুগ্রহ করে আপনার ফোন নম্বর এবং পাসওয়ার্ড উভয়ই লিখুন।',
    invalidPhonePasswordError: 'অবৈধ ফোন বা পাসওয়ার্ড।',
    authErrorTryAgain: 'যাচাইকরণ ত্রুটি। অনুগ্রহ করে আবার চেষ্টা করুন।',
    profileUpdateSuccess: 'প্রোফাইল সফলভাবে আপডেট করা হয়েছে।',
    profileUpdateError: 'প্রোফাইল আপডেট করতে ব্যর্থ হয়েছে।',
    donationLoggedSuccess: 'রক্তদানের ঘটনা রেকর্ড করা হয়েছে! আপনার কুলডাউন সক্রিয় এবং প্রাপ্যতা অপেক্ষমান রাখা হয়েছে।',
    donationLoggedError: 'রক্তদান রেকর্ড করতে ব্যর্থ হয়েছে।',
    recoverySuccess: 'পরিচয় যাচাই করা হয়েছে! পাসওয়ার্ড সফলভাবে রিসেট করা হয়েছে। আপনি এখন আপনার প্রোফাইল লোড করতে পারেন।',
    recoveryError: 'যাচাইকরণ ব্যর্থ হয়েছে। অনুগ্রহ করে বিবরণ পরীক্ষা করুন।',
    recoveryGeneralError: 'পাসওয়ার্ড পুনরুদ্ধারের সময় একটি ত্রুটি ঘটেছে।',
    incorrectPasswordDeleteError: 'ভুল পাসওয়ার্ড। মুছে ফেলার অনুরোধ বাতিল করা হয়েছে।',
    deleteSuccess: 'জরুরি অনুরোধ সফলভাবে মুছে ফেলা হয়েছে।',
    deleteErrorPrefix: 'অনুরোধ মুছতে ত্রুটি: ',
    unknownError: 'অজানা ত্রুটি',
    adminAuthSuccessText: 'অ্যাডমিন হিসেবে যাচাইকৃত। ব্যবহারকারীর পাসওয়ার্ড লিখতে হবে না।',
    regSuccessMsg: 'অভিনন্দন! {name} সফলভাবে নিবন্ধিত হয়েছে।',
    registrationFailed: 'নিবন্ধন ব্যর্থ হয়েছে।',
    donorRegistrationTitle: 'রক্তদাতা নিবন্ধন',
    registeredPhoneLabel: 'নিবন্ধিত ফোন নম্বর',

    // Placeholders
    hospitalPlaceholder: 'যেমন: ওসমানী মেডিকেল কলেজ হাসপাতাল',
    passwordPlaceholder: 'অ্যাকাউন্টের পাসওয়ার্ড দিন বা নতুন পাসওয়ার্ড সেট করুন...',
    recoveryPasswordPlaceholder: 'নতুন পাসওয়ার্ড লিখুন...',
    notePlaceholder: 'অপারেশনের কারণ, কত ব্যাগ রক্ত লাগবে, সময় ইত্যাদি বিবরণ...',
    donorNamePlaceholder: 'যেমন: ফয়সাল আহমেদ',
    phonePlaceholder: 'যেমন: ০১৭১২৩৪৫৬৭৮',
    choosePasswordPlaceholder: 'পরবর্তীতে প্রোফাইল আপডেট করার জন্য পাসওয়ার্ড দিন...',
    enterPasswordPlaceholder: 'পাসওয়ার্ড লিখুন...',

    // Dynamic UI Labels
    cooldownProgress: 'কুলডাউন অগ্রগতি',
    daysLeft: '{days} দিন বাকি',
    daysRemainingText: '{days} দিন পর প্রস্তুত হবে',
    timesUnit: '{count} বার',
    neverDonated: 'উল্লেখ নেই',
    deletingRequestText: 'অনুরোধ মুছে ফেলা হচ্ছে:',
    bloodAtText: 'রক্তের অনুরোধ, স্থান:',
    cancelButton: 'বাতিল',
    processingButton: 'প্রক্রিয়াধীন...',
    postingButton: 'পোস্ট হচ্ছে...',
    registeringButton: 'নিবন্ধন হচ্ছে...',
    verifyingButton: 'যাচাই হচ্ছে...',
    loggingButton: 'যোগ করা হচ্ছে...',
    justNow: 'এইমাত্র',
    hoursAgo: '{hours} ঘণ্টা আগে',
    noDescription: 'কোনো বিবরণ নেই',
    emergencyBloodNeeded: 'জরুরি {bloodGroup} প্রয়োজন',
    contactNumberLabel: 'যোগাযোগ নম্বর: ',
    recoveryTab: 'পাসওয়ার্ড উদ্ধার',
    recoveryDesc: 'আপনার নিবন্ধিত নাম, ফোন নম্বর এবং রক্তের গ্রুপ প্রদান করে আপনার পরিচয় যাচাই করুন ও পাসকোড পরিবর্তন করুন।',
    registeredFullNameLabel: 'নিবন্ধিত পূর্ণ নাম',
    chooseNewPasswordLabel: 'নতুন পাসওয়ার্ড নির্বাচন (নূন্যতম ৪ অক্ষর)',
    verifyResetPasswordButton: 'যাচাই ও পাসওয়ার্ড পরিবর্তন',
    donationHistoryTitle: 'রক্তদানের ইতিহাস লগ',
    loadingDonationHistory: 'রক্তদানের ইতিহাস লোড হচ্ছে...',
    noDonationEvents: 'এই দাতার জন্য পূর্বের কোনো রক্তদানের রেকর্ড নেই।',
    eventDateLabel: 'রক্তদানের তারিখ',
    statusLabel: 'অবস্থা',
    loggedStatus: 'যুক্ত হয়েছে',
    areaLabel: 'ইউনিয়ন',
    toggleManualPresence: 'অনুসন্ধানে প্রোফাইল প্রদর্শন পরিবর্তন করুন',

    // Home Page Additional
    empoweringCommunity: 'সিলেট রক্তদাতা নেটওয়ার্ক',
    everyDonorLifesaver: 'প্রতিটি রক্তদাতাই একজন জীবনরক্ষক',
    lifesaverWord: 'জীবনরক্ষক',
    heroDescText: 'সিলেটে রক্তদাতাদের সংযোগকারী একটি স্থানীয় নেটওয়ার্ক। রক্তের গ্রুপ দিয়ে খুঁজুন, রক্তদাতার প্রাপ্যতা দেখুন এবং স্থানীয় জরুরি অনুরোধে সাড়া দিন।',
    registerAsDonorButton: 'রক্তদাতা হিসেবে নিবন্ধন',
    filterDonorsTitle: 'দাতা ফিল্টার',
    clearButton: 'মুছুন',
    searchByNamePhoneLabel: 'নাম বা ফোন নম্বর',
    selectAreaLabel: 'ইউনিয়ন/এলাকা',
    allBeanibazarAreas: 'সব সিলেট এলাকা',
    recentEmergencyRequestsTitle: 'সাম্প্রতিক জরুরি রক্তের অনুরোধ',
    locationPrioritizedTooltip: 'আপনার অবস্থানের ভিত্তিতে অগ্রাধিকার দেওয়া হয়েছে',
    nearYouBadge: 'আপনার এলাকায়',
    sameDistrictBadge: 'আপনার জেলায়',
    viewAllRequestsLink: 'সব অনুরোধ দেখুন',
    noDescriptionProvided: 'কোনো বিবরণ দেওয়া নেই।',
    foundSuffix: 'জন রক্তদাতা',
    noDonorsFoundTitle: 'কোনো রক্তদাতা পাওয়া যায়নি',
    noDonorsFoundDesc: 'আপনার ফিল্টারের সাথে মিল রয়েছে এমন কোনো রক্তদাতা নেই। দয়া করে ফিল্টার পরিবর্তন করুন বা সাহায্য করতে নতুন রক্তদাতা নিবন্ধন করুন।',
    resetFiltersButton: 'ফিল্টার রিসেট',
    registerDonorLink: 'নিবন্ধন করুন',
    donorInfoLabel: 'দাতার তথ্য',
    areaUnionLabel: 'এলাকা ইউনিয়ন',
    availabilityLabel: 'প্রাপ্যতা',
    timesDonatedHeader: 'রক্তদানের সংখ্যা',
    actionsLabel: 'অ্যাকশন',
    unavailableManual: 'অনুপস্থিত (ম্যানুয়াল)',
    totalDonationsText: 'মোট: {count} বার',
    donorBadgeNew: 'নতুন রক্তদাতা',
    donorBadgeNormal: 'সাধারণ রক্তদাতা',
    donorBadgeActive: 'সক্রিয় রক্তদাতা',
    donorBadgeHero: 'বীর রক্তদাতা',

    // Pagination
    previousPage: 'পূর্ববর্তী',
    nextPage: 'পরবর্তী',
    pageIndicator: 'পৃষ্ঠা {current} এর {total}',

    // Admin Dashboard Additions
    adminAuthTitle: 'অ্যাডমিন লগইন',
    adminPortalSub: 'দারুণ ডোনার্স অ্যাডমিন পোর্টাল',
    adminDescLogin: 'রেকর্ড পরিচালনা করতে অ্যাডমিনিস্ট্রেটর শংসাপত্র লিখুন।',
    adminLoginError: 'অবৈধ অ্যাডমিনিস্ট্রেটর শংসাপত্র। অ্যাডমিন আইডি এবং পাসওয়ার্ড যাচাই করুন।',
    adminConnError: 'যাচাইকরণ ব্যর্থ হয়েছে। সংযোগ ত্রুটি।',
    adminPassPlaceholder: 'পাসওয়ার্ড লিখুন...',
    adminIdPlaceholder: 'অ্যাডমিন আইডি লিখুন...',
    authenticatingButton: 'যাচাই হচ্ছে...',
    adminDashboardTitle: 'অ্যাডমিনিস্ট্রেশন ড্যাশবোর্ড',
    moderatorControlsText: 'সিস্টেম মডারেটর নিয়ন্ত্রণ',
    exitAdminButton: 'অ্যাডমিন প্রস্থান',
    manageDonorsTab: 'রক্তদাতা পরিচালনা',
    manageEmergenciesTab: 'জরুরি অনুরোধ পরিচালনা',
    areYouSureTitle: 'আপনি কি নিশ্চিত?',
    permanentActionWarning: 'এই কাজটি স্থায়ী এবং পুনরুদ্ধার করা সম্ভব নয়। আপনি একটি {type} রেকর্ড মুছে ফেলতে চলেছেন।',
    registeredDonorWord: 'নিবন্ধিত রক্তদাতা',
    emergencyRequestWord: 'জরুরি অনুরোধ',
    confirmDeleteButton: 'মুছে ফেলা নিশ্চিত করুন',
    deletingButton: 'মুছে ফেলা হচ্ছে...',
    donorRecordsHeader: 'নিবন্ধিত রক্তদাতার রেকর্ড',
    categoryLabel: 'বিভাগ:',
    allCategoryPill: 'সব',
    noDonorsInCategory: '{category} বিভাগের অধীনে কোনো রক্তদাতা নিবন্ধিত নেই।',
    nameHeader: 'নাম',
    bloodGroupHeader: 'রক্তের গ্রুপ',
    phoneHeader: 'ফোন নম্বর',
    areaHeader: 'এলাকা অবস্থান',
    donationsHeader: 'রক্তদান',
    actionsHeader: 'অ্যাকশন',
    activeEmergencyRecordsHeader: 'সক্রিয় জরুরি রক্তের অনুরোধের রেকর্ড',
    noActiveEmergencies: 'কোনো সক্রিয় জরুরি রক্তের অনুরোধ নেই।',
    bloodNeededHeader: 'প্রয়োজনীয় রক্ত',
    hospitalAreaHeader: 'এলাকা',
    contactPhoneHeader: 'যোগাযোগের ফোন',
    noteDetailsHeader: 'বিবরণ / নোট',
    postedDateHeader: 'পোস্টের তারিখ',
    errorDeletingDonorPrefix: 'রক্তদাতা মুছতে ত্রুটি: ',
    errorDeletingRequestPrefix: 'জরুরি অনুরোধ মুছতে ত্রুটি: ',
    // সিলেট সিটি ও গুরুত্বপূর্ণ এলাকা
    area_sylhetcitycorporation: 'সিলেট সিটি কর্পোরেশন',
    // সিলেট উপজেলা
    area_sylhetsadarupazila: 'সিলেট সদর উপজেলা',
    area_beanibazarupazila: 'বিয়ানীবাজার উপজেলা',
    area_bishwanathupazila: 'বিশ্বনাথ উপজেলা',
    area_companiganjupazila: 'কোম্পানিগঞ্জ উপজেলা',
    area_fenchuganjupazila: 'ফেঞ্চুগঞ্জ উপজেলা',
    area_golapganjupazila: 'গোলাপগঞ্জ উপজেলা',
    area_gowainghatupazila: 'গোয়াইনঘাট উপজেলা',
    area_jaintiapurupazila: 'জৈন্তাপুর উপজেলা',
    area_kanaighatupazila: 'কানাইঘাট উপজেলা',
    area_osmaninagarupazila: 'ওসমানী নগর উপজেলা',
    area_southsurmaupazila: 'দক্ষিণ সুরমা উপজেলা',
    area_zakiganjupazila: 'জকিগঞ্জ উপজেলা',
    area_balaganjupazila: 'বালাগঞ্জ উপজেলা',
    // মৌলভীবাজার উপজেলা
    area_moulvibazarsadarupazila: 'মৌলভীবাজার সদর উপজেলা',
    area_barlekhaupazila: 'বড়লেখা উপজেলা',
    area_juriupazila: 'জুড়ী উপজেলা',
    area_kamalganjupazila: 'কমলগঞ্জ উপজেলা',
    area_kulauraupazila: 'কুলাউড়া উপজেলা',
    area_rajnagarupazila: 'রাজনগর উপজেলা',
    area_sreemangalupazila: 'শ্রীমঙ্গল উপজেলা',
    // হবিগঞ্জ উপজেলা
    area_habiganjsadarupazila: 'হবিগঞ্জ সদর উপজেলা',
    area_ajmiriganjupazila: 'আজমিরীগঞ্জ উপজেলা',
    area_bahubalupazila: 'বাহুবল উপজেলা',
    area_baniachangupazila: 'বানিয়াচং উপজেলা',
    area_chunarughatupazila: 'চুনারুঘাট উপজেলা',
    area_lakhaiupazila: 'লাখাই উপজেলা',
    area_madhabpurupazila: 'মাধবপুর উপজেলা',
    area_nabiganjupazila: 'নবীগঞ্জ উপজেলা',
    area_sayestaganjupazila: 'শায়েস্তাগঞ্জ উপজেলা',
    // সুনামগঞ্জ উপজেলা
    area_sunamganjsadarupazila: 'সুনামগঞ্জ সদর উপজেলা',
    area_bishwamvarpurupazila: 'বিশ্বম্ভরপুর উপজেলা',
    area_chhatakupazila: 'ছাতক উপজেলা',
    area_deraiupazila: 'দিরাই উপজেলা',
    area_dharampashaupazila: 'ধর্মপাশা উপজেলা',
    area_dowarabazarupazila: 'দোয়ারাবাজার উপজেলা',
    area_jagannathpurupazila: 'জগন্নাথপুর উপজেলা',
    area_jamalganjupazila: 'জামালগঞ্জ উপজেলা',
    area_madyanagarupazila: 'মধ্যনগর উপজেলা',
    area_shantiganjupazila: 'শান্তিগঞ্জ উপজেলা',
    area_sullahupazila: 'শাল্লা উপজেলা',
    area_tahirpurupazila: 'তাহিরপুর উপজেলা',

    // Support Page
    supportTitle: 'সাহায্য ও সহযোগিতা',
    supportDesc: 'কোনো সাহায্য লাগবে বা কোনো সমস্যা জানাতে চান? আমাদের টিমের সাথে যোগাযোগ করুন।',
    contactSupportTab: 'যোগাযোগ করুন',
    reportProblemTab: 'সমস্যা রিপোর্ট করুন',
    supportName: 'আপনার নাম',
    supportPhone: 'ফোন নম্বর',
    supportMessage: 'আপনার বার্তা / প্রশ্ন',
    supportIssueType: 'সমস্যার ধরণ নির্বাচন করুন',
    supportSubmit: 'অনুরোধ পাঠান',
    supportSuccessMsg: 'আপনার অনুরোধটি সফলভাবে পাঠানো হয়েছে!',
    supportErrorMsg: 'অনুরোধ পাঠাতে ব্যর্থ হয়েছে।',
    blockedAccount: 'অ্যাকাউন্ট ব্লক সংক্রান্ত',
    bugReport: 'অ্যাপের সমস্যা / ত্রুটি',
    fakeDonor: 'ভুয়া দাতার তথ্য রিপোর্ট',
    incorrectDonorDetails: 'দাতার ভুল তথ্য সংশোধন',
    otherIssue: 'অন্যান্য সমস্যা',

    // Legal & Privacy
    termsNav: 'শর্তাবলী',
    privacyNav: 'গোপনীয়তা নীতি',
    agreeToTermsPrefix: 'আমি প্ল্যাটফর্মের',
    termsAndConditionsText: 'ব্যবহারের শর্তাবলী',
    andText: 'ও',
    privacyPolicyText: 'গোপনীয়তা নীতি',
    mustAgreeTermsError: 'নিবন্ধন সম্পন্ন করতে শর্তাবলী ও গোপনীয়তা নীতিতে সম্মতি জানানো আবশ্যক।',
  }
};

export const calculateDaysSince = (dateString) => {
  if (!dateString) return Infinity;
  const lastDate = new Date(dateString);
  const today = new Date();

  lastDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - lastDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const calculateHoursSince = (dateString) => {
  if (!dateString) return 0;
  const createdDate = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - createdDate.getTime();
  return diffMs / (1000 * 60 * 60);
};

export const getDonorDonationCount = (donor) => {
  if (!donor) return 0;
  const lifetime = Number.parseInt(donor.lifetime_donation_count, 10);
  if (!Number.isNaN(lifetime)) {
    return Math.min(Math.max(lifetime, 0), 999);
  }
  const total = Number.parseInt(donor.total_donations, 10);
  if (!Number.isNaN(total)) {
    return Math.min(Math.max(total, 0), 999);
  }
  return 0;
};

export const normalizeDonor = (donor) => {
  if (!donor) return donor;
  const count = getDonorDonationCount(donor);
  return {
    ...donor,
    hide_photo: Boolean(donor.hide_photo),
    lifetime_donation_count: count,
    total_donations: count,
  };
};

export const getDonorBadge = (count) => {
  const total = normalizeDonor({ total_donations: count }).total_donations;
  if (total <= 0) return { label: 'New Donor', color: 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300' };
  if (total >= 1 && total <= 2) return { label: 'Normal Donor', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/35' };
  if (total >= 3 && total <= 5) return { label: 'Active Donor', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/35' };
  return { label: 'Hero Donor', color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/35 font-semibold pulse-glow' };
};

export const getDonorBadgeLabel = (badgeLabel, t) => {
  switch (badgeLabel) {
    case 'New Donor': return t('donorBadgeNew');
    case 'Normal Donor': return t('donorBadgeNormal');
    case 'Active Donor': return t('donorBadgeActive');
    case 'Hero Donor': return t('donorBadgeHero');
    default: return badgeLabel;
  }
};

export const getAreaLabel = (area, t) => {
  if (!area) return '';
  if (typeof t !== 'function') return area;
  // Check exact translation key
  const key = 'area_' + area.toLowerCase().replace(/[^a-z0-9]/g, '');
  const translated = t(key);
  if (translated !== key) return translated;

  // Custom check for general hospital mock data or any matching text containing Beanibazar Sadar/Upazila
  if (area.includes('Beanibazar Upazila (General Hospital)')) {
    return area.replace('Beanibazar Upazila (General Hospital)', t('area_beanibazarupazila_hospital') || 'Beanibazar Upazila (General Hospital)');
  }
  if (area.includes('Beanibazar Sadar (General Hospital)')) {
    return area.replace('Beanibazar Sadar (General Hospital)', t('area_beanibazarupazila_hospital') || 'Beanibazar Upazila (General Hospital)');
  }

  return area;
};

export const AppProvider = ({ children }) => {
  const [donors, setDonors] = useState(() => {
    try {
      const cached = localStorage.getItem('bb_donors_cache') || localStorage.getItem('bb_donors');
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  });

  const [emergencyRequests, setEmergencyRequests] = useState(() => {
    try {
      const cached = localStorage.getItem('bb_emergencies_cache') || localStorage.getItem('bb_emergency_requests');
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  });

  const [loading, setLoading] = useState(() => {
    try {
      const hasCached = (localStorage.getItem('bb_donors_cache') || localStorage.getItem('bb_donors')) ||
        (localStorage.getItem('bb_emergencies_cache') || localStorage.getItem('bb_emergency_requests'));
      return !hasCached;
    } catch (e) {
      return true;
    }
  });

  const [error, setError] = useState(null);

  // Set default theme to light for a faster, less jarring first paint on mobile.
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    return 'light';
  });

  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key, variables = {}) => {
    let text = TRANSLATIONS[language]?.[key] || TRANSLATIONS['en']?.[key] || key;
    Object.keys(variables).forEach(varKey => {
      text = text.replace(`{${varKey}}`, variables[varKey]);
    });
    return text;
  };

  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem('isAdmin') === 'true';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    const isDark = theme === 'dark';
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);

    // Dynamically update mobile browser status bar theme color
    const targetColor = isDark ? '#09090b' : '#ffffff';
    const themeColorMetas = document.querySelectorAll('meta[name="theme-color"]');
    themeColorMetas.forEach((meta) => {
      meta.setAttribute('content', targetColor);
    });
  }, [theme]);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Active logged-in donor session
  const [currentDonor, setCurrentDonorState] = useState<any>(() => {
    try {
      const cached = localStorage.getItem('bb_donor_session');
      if (cached) {
        const parsed = JSON.parse(cached);
        return parsed?.donor || null;
      }
    } catch (e) { }
    return null;
  });

  const setCurrentDonor = (donor: any | null) => {
    setCurrentDonorState(donor);
    if (donor) {
      try {
        const cached = localStorage.getItem('bb_donor_session');
        const existing = cached ? JSON.parse(cached) : {};
        localStorage.setItem('bb_donor_session', JSON.stringify({
          ...existing,
          donor,
          googleAuth: existing.googleAuth ?? (existing.password ? false : true),
        }));
      } catch (e) { }
    } else {
      localStorage.removeItem('bb_donor_session');
    }
    window.dispatchEvent(new Event('bb_donor_session_updated'));
  };

  const logoutDonor = () => {
    setCurrentDonor(null);
    showToast(
      language === 'bn' ? 'সফলভাবে লগআউট হয়েছে' : 'Logged out successfully',
      'success'
    );
  };

  useEffect(() => {
    const handleSyncSession = () => {
      try {
        const cached = localStorage.getItem('bb_donor_session');
        if (cached) {
          const parsed = JSON.parse(cached);
          setCurrentDonorState(parsed?.donor || null);
        } else {
          setCurrentDonorState(null);
        }
      } catch (e) {
        setCurrentDonorState(null);
      }
    };

    window.addEventListener('storage', handleSyncSession);
    window.addEventListener('bb_donor_session_updated', handleSyncSession);
    return () => {
      window.removeEventListener('storage', handleSyncSession);
      window.removeEventListener('bb_donor_session_updated', handleSyncSession);
    };
  }, []);

  // Real-time block check: poll every 15 seconds for the logged-in donor.
  // If the admin has blocked their phone since they last logged in, immediately
  // clear their session and reload so they are kicked out without delay.
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const checkBlock = async () => {
      try {
        const cached = localStorage.getItem('bb_donor_session');
        if (!cached) return;
        const session = JSON.parse(cached);
        if (!session?.donor?.phone) return;

        const blockRes = await dbService.checkIfBlocked(session.donor.phone);
        if (blockRes.data === true) {
          // Immediately wipe session and kick the user out
          localStorage.removeItem('bb_donor_session');
          if (intervalId) clearInterval(intervalId);
          showToast(
            localStorage.getItem('language') === 'bn'
              ? 'আপনার অ্যাকাউন্টটি নিষ্ক্রিয় করা হয়েছে। আরও তথ্যের জন্য সহায়তায় যোগাযোগ করুন।'
              : 'Your account has been deactivated by the administrator.',
            'error'
          );
          setTimeout(() => {
            window.location.reload();
          }, 2500);
        }
      } catch (e) {
        // Silently ignore network errors to avoid noise
      }
    };

    // Only start polling if there is an active donor session
    const hasDonorSession = !!localStorage.getItem('bb_donor_session');
    if (hasDonorSession && !isDemoMode) {
      // Run once immediately, then every 15 seconds
      checkBlock();
      intervalId = setInterval(checkBlock, 15000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch data
  const refreshData = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);

    // Check if the currently logged-in donor is blocked
    try {
      const cached = localStorage.getItem('bb_donor_session');
      if (cached) {
        const session = JSON.parse(cached);
        if (session && session.donor && session.donor.phone) {
          const blockRes = await dbService.checkIfBlocked(session.donor.phone);
          if (blockRes.data === true) {
            localStorage.removeItem('bb_donor_session');
            showToast(
              language === 'bn'
                ? 'আপনার অ্যাকাউন্টটি নিষ্ক্রিয় করা হয়েছে। আরও তথ্যের জন্য সহায়তায় যোগাযোগ করুন।'
                : 'Your account has been deactivated. Please contact support.',
              'error'
            );
            setTimeout(() => {
              window.location.reload();
            }, 3000);
            return;
          }
        }
      }
    } catch (e) {
      console.error("Failed to check active donor block status:", e);
    }

    try {
      const timeout = (ms) => new Promise(resolve => setTimeout(() => resolve(null), ms));

      // Fetch Donors with a 3.5s timeout, load immediately when resolved
      const donorsFetch = Promise.race([
        dbService.getDonors(),
        timeout(3500)
      ]).then((res: any) => {
        if (res) {
          if (res.error) throw new Error(res.error.message);
          const data = res.data || [];
          setDonors(data.map(normalizeDonor));
          if (!isDemoMode && data.length > 0) {
            localStorage.setItem('bb_donors_cache', JSON.stringify(data));
          }
        } else {
          console.warn("Donors database fetch timed out. Using offline cache.");
          const cachedDonors = localStorage.getItem('bb_donors_cache') || localStorage.getItem('bb_donors');
          if (cachedDonors) setDonors(JSON.parse(cachedDonors).map(normalizeDonor));
        }
      });

      // Fetch Emergencies with a 3.5s timeout, load immediately when resolved
      const emergenciesFetch = Promise.race([
        dbService.getEmergencyRequests(),
        timeout(3500)
      ]).then(async (res: any) => {
        if (res) {
          if (res.error) throw new Error(res.error.message);
          let data = res.data || [];

          if (isDemoMode) {
            const activeRequests = [];
            for (const req of data) {
              const hours = calculateHoursSince(req.created_at);
              if (hours >= 24) {
                dbService.deleteEmergencyRequest(req.id);
              } else {
                activeRequests.push(req);
              }
            }
            data = activeRequests;
          }

          setEmergencyRequests(data);
          if (!isDemoMode && data.length > 0) {
            localStorage.setItem('bb_emergencies_cache', JSON.stringify(data));
          }
        } else {
          console.warn("Emergencies database fetch timed out. Using offline cache.");
          const cachedRequests = localStorage.getItem('bb_emergencies_cache') || localStorage.getItem('bb_emergency_requests');
          if (cachedRequests) setEmergencyRequests(JSON.parse(cachedRequests));
        }
      });

      // Execute all in parallel
      await Promise.all([donorsFetch, emergenciesFetch]);

    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message || "Something went wrong while loading data.");

      // Load offline cache on throw error
      try {
        const cachedDonors = localStorage.getItem('bb_donors_cache') || localStorage.getItem('bb_donors');
        const cachedRequests = localStorage.getItem('bb_emergencies_cache') || localStorage.getItem('bb_emergency_requests');
        if (cachedDonors) setDonors(JSON.parse(cachedDonors).map(normalizeDonor));
        if (cachedRequests) setEmergencyRequests(JSON.parse(cachedRequests));
      } catch (e) { }
    } finally {
      setLoading(false);
    }
  };

  // Load data after the first app shell renders. Cached content appears immediately;
  // first-time visitors see page skeletons instead of a full-screen blocking loader.
  useEffect(() => {
    const hasCachedData = donors.length > 0 || emergencyRequests.length > 0;
    const refreshTimer = window.setTimeout(() => {
      refreshData(hasCachedData);
    }, 0);

    return () => window.clearTimeout(refreshTimer);
  }, []);

  const lastClickCoords = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleGlobalClick = (e) => {
      lastClickCoords.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('click', handleGlobalClick, { capture: true });
    return () => window.removeEventListener('click', handleGlobalClick, { capture: true });
  }, []);

  const toggleTheme = () => {
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!document.startViewTransition || isReducedMotion) {
      document.documentElement.classList.add('theme-smooth-transition');
      setTheme(prev => {
        const next = prev === 'light' ? 'dark' : 'light';
        const root = document.documentElement;
        if (next === 'dark') {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
        localStorage.setItem('theme', next);
        return next;
      });
      setTimeout(() => {
        document.documentElement.classList.remove('theme-smooth-transition');
      }, 250);
      return;
    }

    document.documentElement.classList.add('theme-transitioning');
    const transition = document.startViewTransition(() => {
      flushSync(() => {
        setTheme(prev => {
          const next = prev === 'light' ? 'dark' : 'light';
          const root = document.documentElement;
          if (next === 'dark') {
            root.classList.add('dark');
          } else {
            root.classList.remove('dark');
          }
          localStorage.setItem('theme', next);
          return next;
        });
      });
    });

    transition.finished.finally(() => {
      document.documentElement.classList.remove('theme-transitioning');
    });
  };

  const [adminCredentials, setAdminCredentials] = useState<{ username: string; password?: string } | null>(() => {
    const savedUser = localStorage.getItem('adminUser');
    const savedPass = localStorage.getItem('adminPass');
    return savedUser ? { username: savedUser, password: savedPass || '' } : null;
  });

  const loginAdmin = async (username, password) => {
    setError(null);
    const res = await dbService.verifyAdminCredentials(username, password);
    if (res.success) {
      setIsAdmin(true);
      setAdminCredentials({ username, password });
      localStorage.setItem('adminUser', username);
      localStorage.setItem('adminPass', password);
      localStorage.setItem('isAdmin', 'true');
      return true;
    } else {
      setError(res.error?.message || "Invalid Administrator Credentials.");
      return false;
    }
  };

  const loginAdminWithGoogle = async (payload: { credential?: string; user?: any }) => {
    setError(null);
    const res = await dbService.loginAdminWithGoogle(payload);
    if (res.success) {
      setIsAdmin(true);
      const adminName = res.admin?.email || res.admin?.name || 'admin';
      setAdminCredentials({ username: adminName, password: '' });
      localStorage.setItem('adminUser', adminName);
      localStorage.setItem('isAdmin', 'true');
      if (res.admin?.avatar_url) {
        localStorage.setItem('adminAvatar', res.admin.avatar_url);
      }
      return { success: true };
    } else {
      const errMsg = res.error?.message || "Unauthorized: This Google account is not configured as an administrator.";
      setError(errMsg);
      return { success: false, error: { message: errMsg } };
    }
  };

  const logoutAdmin = () => {
    setIsAdmin(false);
    setAdminCredentials(null);
    localStorage.removeItem('adminUser');
    localStorage.removeItem('adminPass');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminAvatar');
  };

  const verifyDonorCredentials = async (phone, password) => {
    setError(null);
    const { data, error } = await dbService.verifyDonor(phone, password);
    if (error) {
      setError(error.message);
      return { success: false, error };
    }
    return { success: true, donor: data };
  };

  const loginDonorWithGoogle = async (payload: { credential?: string; user?: any }) => {
    setError(null);
    const res = await dbService.googleAuth(payload);
    if (!res.success && res.error) {
      setError(res.error.message || 'Google authentication failed.');
      return { success: false, error: res.error };
    }
    return res;
  };

  const resetDonorPassword = async (name, phone, bloodGroup, dob, newPassword) => {
    setError(null);
    const res = await dbService.resetDonorPassword(name, phone, bloodGroup, dob, newPassword);
    if (!res.success) {
      setError(res.error?.message || "Verification failed.");
      return { success: false, error: res.error };
    }
    await refreshData(true);
    return { success: true };
  };

  const blockDonorByPhone = async (phone, reason) => {
    if (!isAdmin) return { success: false, error: { message: 'Unauthorized' } };
    setError(null);
    const adminUser = adminCredentials?.username || '';
    const adminPass = adminCredentials?.password || '';
    const res = await dbService.blockDonorByPhone(phone, adminUser, adminPass, reason);
    if (!res.success) {
      setError(res.error?.message || 'Failed to block donor.');
    }
    return res;
  };

  const unblockDonorByPhone = async (phone) => {
    if (!isAdmin) return { success: false, error: { message: 'Unauthorized' } };
    setError(null);
    const adminUser = adminCredentials?.username || '';
    const adminPass = adminCredentials?.password || '';
    const res = await dbService.unblockDonorByPhone(phone, adminUser, adminPass);
    if (!res.success) {
      setError(res.error?.message || 'Failed to unblock donor.');
    }
    return res;
  };

  const getBlockedPhones = async () => {
    if (!isAdmin) return { success: false, data: [], error: { message: 'Unauthorized' } };
    const adminUser = adminCredentials?.username || '';
    const adminPass = adminCredentials?.password || '';
    return await dbService.getBlockedPhones(adminUser, adminPass);
  };

  const registerDonor = async (donorData, honeypot) => {
    setError(null);
    const { data, error } = await dbService.registerDonor(donorData, honeypot);
    if (error) {
      setError(error.message);
      return { success: false, error };
    }
    await refreshData(true);
    return { success: true, data };
  };

  const updateDonorAvailability = async (id, isAvailable, password) => {
    setError(null);
    const { data, error } = await dbService.updateDonorAvailability(id, isAvailable, password);
    if (error) {
      setError(error.message);
      return { success: false, error };
    }
    setDonors(prev => prev.map(d => d.id === id ? { ...d, is_available: isAvailable } : d));
    return { success: true, data };
  };

  const updateDonorProfile = async (id, profileData, password) => {
    setError(null);
    const { data, error } = await dbService.updateDonorProfile(id, profileData, password);
    if (error) {
      setError(error.message);
      return { success: false, error };
    }
    await refreshData(true);
    return { success: true, data };
  };

  const addDonationHistory = async (donorId, donationDate, password) => {
    setError(null);
    const { data, error } = await dbService.addDonationEvent(donorId, donationDate, password);
    if (error) {
      setError(error.message);
      return { success: false, error };
    }
    await refreshData(true);
    return { success: true, data };
  };

  const deleteDonor = async (id, options?: { password?: string; isDonorSelfDelete?: boolean }) => {
    if (!isAdmin && !options?.isDonorSelfDelete) {
      setError("Unauthorized access");
      return { success: false, error: "Unauthorized" };
    }
    setError(null);
    const adminUser = adminCredentials?.username || '';
    const adminPass = adminCredentials?.password || '';
    const { success, error } = await dbService.deleteDonor(id, adminUser, adminPass, options);
    if (error) {
      setError(error.message);
      return { success: false, error };
    }
    setDonors(prev => prev.filter(d => d.id !== id));
    if (options?.isDonorSelfDelete) {
      logoutDonor();
    }
    await refreshData(true);
    return { success: true };
  };

  const createEmergencyRequest = async (requestData: any, honeypot?: string) => {
    setError(null);
    const donorId = currentDonor?.id || requestData?.donor_id || requestData?.donorId;
    if (!donorId) {
      const authErr = {
        message: language === 'bn'
          ? 'জরুরি রক্তের অনুরোধ পোস্ট করতে আপনাকে প্রথমে লগইন করতে হবে।'
          : 'Authentication required. Please sign in to post an urgent blood request.'
      };
      setError(authErr.message);
      return { success: false, error: authErr };
    }

    const payload = {
      ...requestData,
      donor_id: donorId,
      contact: requestData.contact || currentDonor?.phone || '',
    };

    const { data, error } = await dbService.createEmergencyRequest(payload, honeypot);
    if (error) {
      setError(error.message);
      return { success: false, error };
    }
    await refreshData(true);
    return { success: true, data };
  };

  const deleteEmergencyRequest = async (
    id: string,
    userPasscode?: string,
    options?: { donorId?: string; donorPhone?: string }
  ) => {
    setError(null);
    const adminUser = adminCredentials?.username || '';
    const adminPass = adminCredentials?.password || '';
    const donorId = options?.donorId || currentDonor?.id;
    const donorPhone = options?.donorPhone || currentDonor?.phone;
    const { success, error } = await dbService.deleteEmergencyRequest(
      id,
      adminUser,
      adminPass,
      userPasscode,
      donorId,
      donorPhone
    );
    if (error) {
      setError(error.message);
      return { success: false, error };
    }
    setEmergencyRequests(prev => prev.filter(r => r.id !== id));
    return { success: true };
  };

  const updateEmergencyRequestStatus = async (
    id: string,
    status: 'needed' | 'responded' | 'fulfilled' | string,
    userPasscode?: string,
    options?: { donorId?: string; donorPhone?: string }
  ) => {
    setError(null);
    const adminUser = adminCredentials?.username || '';
    const adminPass = adminCredentials?.password || '';
    const donorId = options?.donorId || currentDonor?.id;
    const donorPhone = options?.donorPhone || currentDonor?.phone;
    const { data, error } = await dbService.updateEmergencyRequestStatus(
      id,
      status as any,
      userPasscode,
      adminUser,
      adminPass,
      donorId,
      donorPhone
    );
    if (error) {
      setError(error.message);
      return { success: false, error };
    }
    setEmergencyRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    return { success: true, data };
  };



  const getSupportRequests = async () => {
    if (!isAdmin) return { data: [], error: { message: 'Unauthorized' } };
    setError(null);
    const adminUser = adminCredentials?.username || '';
    const adminPass = adminCredentials?.password || '';
    return await dbService.getSupportRequests(adminUser, adminPass);
  };

  const checkIfBlocked = async (phone: string) => {
    return await dbService.checkIfBlocked(phone);
  };

  return (
    <AppContext.Provider
      value={{
        donors,
        emergencyRequests,
        loading,
        error,
        theme,
        currentDonor,
        setCurrentDonor,
        logoutDonor,
        isAdmin,
        isDemoMode,
        language,
        setLanguage,
        t,
        toggleTheme,
        loginAdmin,
        loginAdminWithGoogle,
        logoutAdmin,
        verifyDonorCredentials,
        loginDonorWithGoogle,
        resetDonorPassword,
        registerDonor,
        updateDonorAvailability,
        updateDonorProfile,
        addDonationHistory,
        deleteDonor,
        createEmergencyRequest,
        deleteEmergencyRequest,
        updateEmergencyRequestStatus,
        refreshData,
        blockDonorByPhone,
        unblockDonorByPhone,
        getBlockedPhones,
        getSupportRequests,
        showToast,
        checkIfBlocked
      }}
    >
      {children}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[9999] animate-slide-up p-1 pointer-events-auto">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-xl backdrop-blur-md max-w-sm ${toast.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
            : toast.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-650 dark:text-rose-400'
              : 'bg-amber-500/10 border-amber-500/20 text-amber-650 dark:text-amber-400'
            }`}>
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />}
            {toast.type === 'error' && <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500" />}
            {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500" />}
            <span className="text-xs font-bold leading-normal">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-auto text-slate-400 hover:text-slate-655 dark:hover:text-zinc-350 transition-colors p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
