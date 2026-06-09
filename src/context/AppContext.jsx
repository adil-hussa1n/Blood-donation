import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { dbService } from '../services/db';
import { supabase, isDemoMode } from '../services/supabase';

// Safe storage wrappers to prevent crashes in private browsing / security-conscious browsers
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
    }
  };
})();

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

const AppContext = createContext(undefined);

export const AREAS = [
  'Beanibazar Sadar',
  'Alinagar',
  'Charikhada',
  'Dubag',
  'Kurar Bazar',
  'Lauta',
  'Mullapur',
  'Mathiura',
  'Muria',
  'Sheola',
  'Tilpara'
];

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export const TRANSLATIONS = {
  en: {
    // Navigation
    searchDonors: 'Search Donors',
    registerUpdate: 'Register / Update',
    emergencyRequests: 'Emergency Requests',
    adminDashboard: 'Admin Dashboard',
    logoutAdmin: 'Logout Admin',

    // Hero & Search
    findDonors: 'Find Blood Donors',
    findDonorsDesc: 'Search active donors near you in Beanibazar local areas.',
    bloodGroup: 'Required Blood Group',
    area: 'Area (Beanibazar Unions)',
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
    updateProfileTab: 'Update Profile',
    fullName: 'Full Name',
    phoneUnique: 'Phone Number (Unique)',
    choosePassword: 'Choose Account Password (min. 4 chars)',
    selectArea: 'Area (Beanibazar Union)',
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
    totalDonationsCount: 'Total Donations',
    times: 'times',
    never: 'Never',

    // Emergency Page
    emergencyTitle: 'Emergency Blood Requests',
    emergencyDesc: 'If you or your family needs blood urgently in Beanibazar, post an emergency request here.',
    createRequestTitle: 'Create Urgent Request',
    locationHospital: 'Hospital/Area Location',
    emergencyPhone: 'Emergency Contact Phone',
    accountDeletionPassword: 'Account / Deletion Password (min. 4 chars)',
    passwordHelper: 'If your contact number is registered, enter your donor account password. If not, set any password.',
    additionalDetails: 'Additional Details / Note',
    postRequestButton: 'Post Emergency Request',
    activeFeedTitle: 'Active Emergency Posts Feed',
    activeCount: 'active',
    filterEmergencyByBlood: 'Filter by Blood Group',
    allBloodGroups: 'All Groups',
    noEmergencyForBloodGroup: 'No active requests for {bloodGroup} blood.',
    noEmergencyForBloodGroupDesc: 'Try another blood group or check back later.',
    allAddressedTitle: 'All Requests Addressed!',
    allAddressedDesc: 'There are no active emergency blood requests in Beanibazar at the moment. Keep saving lives!',
    postedAgo: 'Posted',
    actions: 'Actions',
    deleteRequest: 'Delete Request',
    enterDeletionPassword: 'Enter Deletion Password',

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
    dedicatedTo: 'Dedicated to saving lives in Beanibazar, Sylhet, Bangladesh.',
    projectOf: 'A project of GraffixInnovation',

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
    hospitalPlaceholder: 'e.g. Beanibazar General Hospital',
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
    neverDonated: 'Never',
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
    empoweringCommunity: 'Empowering Beanibazar Community',
    everyDonorLifesaver: 'Every Blood Donor is a Lifesaver',
    lifesaverWord: 'Lifesaver',
    heroDescText: 'A local network connecting blood donors in Beanibazar Upazila. Search by blood group, check real-time donor availability, and respond to local emergencies.',
    registerAsDonorButton: 'Register as Donor',
    filterDonorsTitle: 'Filter Donors',
    clearButton: 'Clear',
    searchByNamePhoneLabel: 'Search by name / phone',
    selectAreaLabel: 'Select Area',
    allBeanibazarAreas: 'All Beanibazar Areas',
    recentEmergencyRequestsTitle: 'Recent Emergency Blood Requests',
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
    adminPortalSub: 'GraffixInnovation Admin Portal',
    adminDescLogin: 'Please enter administrator credentials to manage records.',
    adminLoginError: 'Invalid Administrator Credentials. Please check Admin ID and Password.',
    adminConnError: 'Authentication failed. Connection error.',
    adminPassPlaceholder: 'Enter password...',
    adminIdPlaceholder: 'Enter Admin ID...',
    authenticatingButton: 'Authenticating...',
    adminDashboardTitle: 'Administration Dashboard',
    moderatorControlsText: 'GraffixInnovation Moderator Controls',
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
    hospitalAreaHeader: 'Hospital/Area',
    contactPhoneHeader: 'Contact Phone',
    noteDetailsHeader: 'Note / Details',
    postedDateHeader: 'Posted Date',
    errorDeletingDonorPrefix: 'Error deleting donor: ',
    errorDeletingRequestPrefix: 'Error deleting emergency request: '
  },
  bn: {
    // Navigation
    searchDonors: 'রক্তদাতা খুঁজুন',
    registerUpdate: 'নিবন্ধন / আপডেট',
    emergencyRequests: 'জরুরি রক্তের অনুরোধ',
    adminDashboard: 'অ্যাডমিন ড্যাশবোর্ড',
    logoutAdmin: 'লগআউট অ্যাডমিন',

    // Hero & Search
    findDonors: 'রক্তদাতা অনুসন্ধান',
    findDonorsDesc: 'বিয়ানীবাজারের স্থানীয় এলাকায় আপনার নিকটবর্তী সক্রিয় রক্তদাতাদের খুঁজুন।',
    bloodGroup: 'রক্তের গ্রুপ',
    area: 'এলাকা (বিয়ানীবাজার ইউনিয়ন)',
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
    updateProfileTab: 'প্রোফাইল আপডেট',
    fullName: 'পূর্ণ নাম',
    phoneUnique: 'ফোন নম্বর (ইউনিক)',
    choosePassword: 'অ্যাকাউন্ট পাসওয়ার্ড (নূন্যতম ৪ অক্ষর)',
    selectArea: 'এলাকা (বিয়ানীবাজার ইউনিয়ন)',
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
    totalDonationsCount: 'মোট রক্তদান',
    times: 'বার',
    never: 'কখনো নয়',

    // Emergency Page
    emergencyTitle: 'জরুরি রক্তের অনুরোধসমূহ',
    emergencyDesc: 'যদি আপনার বা আপনার পরিবারের বিয়ানীবাজারে জরুরি রক্তের প্রয়োজন হয়, এখানে অনুরোধ পোস্ট করুন।',
    createRequestTitle: 'জরুরি রক্তের অনুরোধ তৈরি করুন',
    locationHospital: 'হাসপাতাল/এলাকার অবস্থান',
    emergencyPhone: 'জরুরি যোগাযোগের ফোন নম্বর',
    accountDeletionPassword: 'অ্যাকাউন্ট / মুছে ফেলার পাসওয়ার্ড (নূন্যতম ৪ অক্ষর)',
    passwordHelper: 'যদি আপনার নম্বর নিবন্ধিত থাকে, তবে অ্যাকাউন্টের পাসওয়ার্ড দিন। না থাকলে যেকোনো পাসওয়ার্ড দিন।',
    additionalDetails: 'অতিরিক্ত বিবরণ / নোট',
    postRequestButton: 'জরুরি অনুরোধ পোস্ট করুন',
    activeFeedTitle: 'সক্রিয় অনুরোধসমূহের তালিকা',
    activeCount: 'সক্রিয়',
    filterEmergencyByBlood: 'রক্তের গ্রুপ অনুযায়ী ফিল্টার',
    allBloodGroups: 'সব গ্রুপ',
    noEmergencyForBloodGroup: '{bloodGroup} রক্তের জন্য কোনো সক্রিয় অনুরোধ নেই।',
    noEmergencyForBloodGroupDesc: 'অন্য রক্তের গ্রুপ বেছে নিন অথবা পরে আবার দেখুন।',
    allAddressedTitle: 'সব অনুরোধ সম্পন্ন হয়েছে!',
    allAddressedDesc: 'এই মুহূর্তে বিয়ানীবাজারে কোনো সক্রিয় জরুরি রক্তের অনুরোধ নেই। জীবন বাঁচাতে থাকুন!',
    postedAgo: 'পোস্টের সময়',
    actions: 'অ্যাকশন',
    deleteRequest: 'অনুরোধ মুছে ফেলুন',
    enterDeletionPassword: 'মুছে ফেলার পাসওয়ার্ড লিখুন',

    // Footers
    developedBy: 'ডিজাইন ও ডেভেলপমেন্টে',
    dedicatedTo: 'বিয়ানীবাজার, সিলেট, বাংলাদেশে জীবন বাঁচাতে নিবেদিত।',
    projectOf: 'গ্রাফিক্স ইনোভেশন এর একটি প্রজেক্ট',

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
    hospitalPlaceholder: 'যেমন: বিয়ানীবাজার জেনারেল হাসপাতাল',
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
    neverDonated: 'কখনো নয়',
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
    empoweringCommunity: 'বিয়ানীবাজার রক্তদাতা নেটওয়ার্ক',
    everyDonorLifesaver: 'প্রতিটি রক্তদাতাই একজন জীবনরক্ষক',
    lifesaverWord: 'জীবনরক্ষক',
    heroDescText: 'বিয়ানীবাজার উপজেলায় রক্তদাতাদের সংযোগকারী একটি স্থানীয় নেটওয়ার্ক। রক্তের গ্রুপ দিয়ে খুঁজুন, রক্তদাতার প্রাপ্যতা দেখুন এবং স্থানীয় জরুরি অনুরোধে সাড়া দিন।',
    registerAsDonorButton: 'রক্তদাতা হিসেবে নিবন্ধন',
    filterDonorsTitle: 'দাতা ফিল্টার',
    clearButton: 'মুছুন',
    searchByNamePhoneLabel: 'নাম বা ফোন নম্বর',
    selectAreaLabel: 'ইউনিয়ন/এলাকা',
    allBeanibazarAreas: 'সব বিয়ানীবাজার এলাকা',
    recentEmergencyRequestsTitle: 'সাম্প্রতিক জরুরি রক্তের অনুরোধ',
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
    adminPortalSub: 'গ্রাফিক্স ইনোভেশন অ্যাডমিন পোর্টাল',
    adminDescLogin: 'রেকর্ড পরিচালনা করতে অ্যাডমিনিস্ট্রেটর শংসাপত্র লিখুন।',
    adminLoginError: 'অবৈধ অ্যাডমিনিস্ট্রেটর শংসাপত্র। অ্যাডমিন আইডি এবং পাসওয়ার্ড যাচাই করুন।',
    adminConnError: 'যাচাইকরণ ব্যর্থ হয়েছে। সংযোগ ত্রুটি।',
    adminPassPlaceholder: 'পাসওয়ার্ড লিখুন...',
    adminIdPlaceholder: 'অ্যাডমিন আইডি লিখুন...',
    authenticatingButton: 'যাচাই হচ্ছে...',
    adminDashboardTitle: 'অ্যাডমিনিস্ট্রেশন ড্যাশবোর্ড',
    moderatorControlsText: 'গ্রাফিক্স ইনোভেশন মডারেটর নিয়ন্ত্রণ',
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
    hospitalAreaHeader: 'হাসপাতাল/এলাকা',
    contactPhoneHeader: 'যোগাযোগের ফোন',
    noteDetailsHeader: 'বিবরণ / নোট',
    postedDateHeader: 'পোস্টের তারিখ',
    errorDeletingDonorPrefix: 'রক্তদাতা মুছতে ত্রুটি: ',
    errorDeletingRequestPrefix: 'জরুরি অনুরোধ মুছতে ত্রুটি: '
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
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Fetch data
  const refreshData = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      if (!isDemoMode && supabase) {
        try {
          // Trigger RPC background checks without blocking page loading fetches
          Promise.all([
            supabase.rpc('reset_expired_cooldowns'),
            supabase.rpc('prune_expired_emergencies')
          ]).catch((e) => console.error("DB background RPC failed:", e));
        } catch (e) {
          console.error("Database maintenance RPC error:", e);
        }
      }

      // 3.5-second timeout wrapper for live database fetches to ensure fast mobile startup
      const fetchPromise = Promise.all([
        dbService.getDonors(),
        dbService.getEmergencyRequests()
      ]);

      const res = await Promise.race([
        fetchPromise,
        new Promise((resolve) => setTimeout(() => {
          console.warn("Database fetch timed out. Falling back to offline cache.");
          resolve(null);
        }, 3500))
      ]);

      let fetchedDonors = [];
      let fetchedRequests = [];

      if (res) {
        const [donorsRes, requestsRes] = res;
        if (donorsRes.error) throw new Error(donorsRes.error.message);
        if (requestsRes.error) throw new Error(requestsRes.error.message);
        
        fetchedDonors = donorsRes.data || [];
        fetchedRequests = requestsRes.data || [];

        // Save successfully fetched live data to local cache for future offline startups
        if (!isDemoMode && fetchedDonors.length > 0) {
          localStorage.setItem('bb_donors_cache', JSON.stringify(fetchedDonors));
        }
        if (!isDemoMode && fetchedRequests.length > 0) {
          localStorage.setItem('bb_emergencies_cache', JSON.stringify(fetchedRequests));
        }
      } else {
        // Fetch timed out - retrieve offline cache
        const cachedDonors = localStorage.getItem('bb_donors_cache') || localStorage.getItem('bb_donors');
        const cachedRequests = localStorage.getItem('bb_emergencies_cache') || localStorage.getItem('bb_emergency_requests');
        
        if (cachedDonors) fetchedDonors = JSON.parse(cachedDonors);
        if (cachedRequests) fetchedRequests = JSON.parse(cachedRequests);
        console.info("Database connection delayed. Loaded content from offline cache.");
      }

      if (isDemoMode) {
        // Fallback maintenance for demo mode (local storage)
        const updatedDonorsPromises = fetchedDonors.map(async (donor) => {
          const days = calculateDaysSince(donor.last_donation_date);
          if (days >= 90 && !donor.is_available) {
            dbService.updateDonorAvailability(donor.id, true);
            return { ...donor, is_available: true };
          }
          return donor;
        });
        fetchedDonors = await Promise.all(updatedDonorsPromises);

        const activeRequests = [];
        for (const req of fetchedRequests) {
          const hours = calculateHoursSince(req.created_at);
          if (hours >= 24) {
            dbService.deleteEmergencyRequest(req.id);
          } else {
            activeRequests.push(req);
          }
        }
        fetchedRequests = activeRequests;
      }

      setDonors(fetchedDonors.map(normalizeDonor));
      setEmergencyRequests(fetchedRequests);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message || "Something went wrong while loading data.");
      
      // Load offline cache on throw error
      try {
        const cachedDonors = localStorage.getItem('bb_donors_cache') || localStorage.getItem('bb_donors');
        const cachedRequests = localStorage.getItem('bb_emergencies_cache') || localStorage.getItem('bb_emergency_requests');
        if (cachedDonors) setDonors(JSON.parse(cachedDonors).map(normalizeDonor));
        if (cachedRequests) setEmergencyRequests(JSON.parse(cachedRequests));
      } catch (e) {}
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
      setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
      return;
    }

    const { x, y } = lastClickCoords.current;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    document.documentElement.classList.add('theme-transitioning');
    const transition = document.startViewTransition(() => {
      setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        [
          {
            clipPath: `circle(0px at ${x}px ${y}px)`,
          },
          {
            clipPath: `circle(${endRadius}px at ${x}px ${y}px)`,
          },
        ],
        {
          duration: 450,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          pseudoElement: '::view-transition-new(root)',
        }
      );
    });

    transition.finished.finally(() => {
      document.documentElement.classList.remove('theme-transitioning');
    });
  };

  const [adminCredentials, setAdminCredentials] = useState(() => {
    const savedUser = sessionStorage.getItem('adminUser');
    const savedPass = sessionStorage.getItem('adminPass');
    return savedUser && savedPass ? { username: savedUser, password: savedPass } : null;
  });

  const loginAdmin = async (username, password) => {
    setError(null);
    const res = await dbService.verifyAdminCredentials(username, password);
    if (res.success) {
      setIsAdmin(true);
      setAdminCredentials({ username, password });
      sessionStorage.setItem('adminUser', username);
      sessionStorage.setItem('adminPass', password);
      localStorage.setItem('isAdmin', 'true');
      return true;
    } else {
      setError(res.error?.message || "Invalid Administrator Credentials.");
      return false;
    }
  };

  const logoutAdmin = () => {
    setIsAdmin(false);
    setAdminCredentials(null);
    sessionStorage.removeItem('adminUser');
    sessionStorage.removeItem('adminPass');
    localStorage.removeItem('isAdmin');
  };

  const verifyDonorCredentials = async (phone, password) => {
    setError(null);
    const { data, error } = await dbService.getDonorByPhone(phone);
    if (error) {
      setError(error.message);
      return { success: false, error };
    }
    if (data.password !== password) {
      setError("Invalid password credentials.");
      return { success: false, error: { message: "Invalid password credentials." } };
    }
    return { success: true, donor: data };
  };

  const resetDonorPassword = async (name, phone, bloodGroup, newPassword) => {
    setError(null);
    const res = await dbService.resetDonorPassword(name, phone, bloodGroup, newPassword);
    if (!res.success) {
      setError(res.error?.message || "Verification failed.");
      return { success: false, error: res.error };
    }
    await refreshData(true);
    return { success: true };
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

  const deleteDonor = async (id) => {
    if (!isAdmin) {
      setError("Unauthorized access");
      return { success: false, error: "Unauthorized" };
    }
    setError(null);
    const adminUser = adminCredentials?.username || '';
    const adminPass = adminCredentials?.password || '';
    const { success, error } = await dbService.deleteDonor(id, adminUser, adminPass);
    if (error) {
      setError(error.message);
      return { success: false, error };
    }
    setDonors(prev => prev.filter(d => d.id !== id));
    return { success: true };
  };

  const createEmergencyRequest = async (requestData, honeypot) => {
    setError(null);
    const { data, error } = await dbService.createEmergencyRequest(requestData, honeypot);
    if (error) {
      setError(error.message);
      return { success: false, error };
    }
    await refreshData(true);
    return { success: true, data };
  };

  const deleteEmergencyRequest = async (id, userPasscode) => {
    setError(null);
    const adminUser = adminCredentials?.username || '';
    const adminPass = adminCredentials?.password || '';
    const { success, error } = await dbService.deleteEmergencyRequest(id, adminUser, adminPass, userPasscode);
    if (error) {
      setError(error.message);
      return { success: false, error };
    }
    setEmergencyRequests(prev => prev.filter(r => r.id !== id));
    return { success: true };
  };

  return (
    <AppContext.Provider
      value={{
        donors,
        emergencyRequests,
        loading,
        error,
        theme,
        isAdmin,
        isDemoMode,
        language,
        setLanguage,
        t,
        toggleTheme,
        loginAdmin,
        logoutAdmin,
        verifyDonorCredentials,
        resetDonorPassword,
        registerDonor,
        updateDonorAvailability,
        updateDonorProfile,
        addDonationHistory,
        deleteDonor,
        createEmergencyRequest,
        deleteEmergencyRequest,
        refreshData
      }}
    >
      {children}
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
