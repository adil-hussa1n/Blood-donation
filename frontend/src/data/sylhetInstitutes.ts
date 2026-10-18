export interface EducationalInstitute {
  id: string;
  name: string;
  nameBn: string;
  type: 'university' | 'medical_college' | 'college' | 'polytechnic';
  district: 'sylhet' | 'moulvibazar' | 'habiganj' | 'sunamganj';
  location: string;
  aliases: string[];
}

export const SYLHET_INSTITUTES: EducationalInstitute[] = [
  // ===================== UNIVERSITIES =====================
  {
    id: 'sust',
    name: 'Shahjalal University of Science and Technology (SUST)',
    nameBn: 'শাহজালাল বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয় (শাবিপ্রবি)',
    type: 'university',
    district: 'sylhet',
    location: 'Kumargaon, Sylhet',
    aliases: ['sust', 'shahjalal university', 'shabiprobi', 'শাবিপ্রবি', 'শাবি']
  },
  {
    id: 'sau',
    name: 'Sylhet Agricultural University (SAU)',
    nameBn: 'সিলেট কৃষি বিশ্ববিদ্যালয় (সিকৃবি)',
    type: 'university',
    district: 'sylhet',
    location: 'Alurtol, Sylhet',
    aliases: ['sau', 'sikribi', 'sylhet krishi', 'সিকৃবি']
  },
  {
    id: 'sec',
    name: 'Sylhet Engineering College (SEC)',
    nameBn: 'সিলেট ইঞ্জিনিয়ারিং কলেজ',
    type: 'university',
    district: 'sylhet',
    location: 'Tilagarh, Sylhet',
    aliases: ['sec', 'engineering college', 'সিলেট ইঞ্জিনিয়ারিং']
  },
  {
    id: 'lu',
    name: 'Leading University (LU)',
    nameBn: 'লিডিং ইউনিভার্সিটি',
    type: 'university',
    district: 'sylhet',
    location: 'Ragibnagar, South Surma, Sylhet',
    aliases: ['lu', 'leading', 'লিডিং']
  },
  {
    id: 'metropolitan',
    name: 'Metropolitan University (MU)',
    nameBn: 'মেট্রোপলিটন ইউনিভার্সিটি',
    type: 'university',
    district: 'sylhet',
    location: 'Bateshwar, Sylhet',
    aliases: ['mu', 'metropolitan', 'মেট্রোপলিটন']
  },
  {
    id: 'siu',
    name: 'Sylhet International University (SIU)',
    nameBn: 'সিলেট ইন্টারন্যাশনাল ইউনিভার্সিটি',
    type: 'university',
    district: 'sylhet',
    location: 'Shamimabad, Bagbari, Sylhet',
    aliases: ['siu', 'sylhet international']
  },
  {
    id: 'hub',
    name: 'Habiganj Agricultural University (HAU)',
    nameBn: 'হবিগঞ্জ কৃষি বিশ্ববিদ্যালয়',
    type: 'university',
    district: 'habiganj',
    location: 'Habiganj Sadar, Habiganj',
    aliases: ['hau', 'habiganj krishi university']
  },
  {
    id: 'ssust',
    name: 'Sunamganj Science and Technology University (SSTU)',
    nameBn: 'সুনামগঞ্জ বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়',
    type: 'university',
    district: 'sunamganj',
    location: 'Sunamganj Sadar, Sunamganj',
    aliases: ['sstu', 'sunamganj university']
  },

  // ===================== MEDICAL COLLEGES =====================
  {
    id: 'somch',
    name: 'Sylhet MAG Osmani Medical College (SOMC)',
    nameBn: 'সিলেট এম.এ.জি. ওসমানী মেডিকেল কলেজ',
    type: 'medical_college',
    district: 'sylhet',
    location: 'Kajalshah, Sylhet',
    aliases: ['somc', 'osmani medical', 'somch', 'ওসমানী মেডিকেল']
  },
  {
    id: 'jalalabad_ragib_rabeya',
    name: 'Jalalabad Ragib-Rabeya Medical College (JRRMC)',
    nameBn: 'জালালাবাদ রাগীব-রাবেয়া মেডিকেল কলেজ',
    type: 'medical_college',
    district: 'sylhet',
    location: 'Pathantula, Sylhet',
    aliases: ['jrrmc', 'ragib rabeya medical', 'রাগীব রাবেয়া']
  },
  {
    id: 'sylhet_womens_medical',
    name: "Sylhet Women's Medical College (SWMC)",
    nameBn: 'সিলেট উইমেন্স মেডিকেল কলেজ',
    type: 'medical_college',
    district: 'sylhet',
    location: 'Mirboxtula, Sylhet',
    aliases: ['swmc', 'womens medical', 'মহিলা মেডিকেল']
  },
  {
    id: 'parkview_medical',
    name: 'Parkview Medical College (PMC)',
    nameBn: 'পার্কভিউ মেডিকেল কলেজ',
    type: 'medical_college',
    district: 'sylhet',
    location: 'VIP Road, Telihaor, Sylhet',
    aliases: ['pmc', 'parkview medical']
  },
  {
    id: 'north_east_medical',
    name: 'North East Medical College (NEMC)',
    nameBn: 'নর্থ ইস্ট মেডিকেল কলেজ',
    type: 'medical_college',
    district: 'sylhet',
    location: 'South Surma, Sylhet',
    aliases: ['nemc', 'north east medical', 'নর্থ ইস্ট']
  },
  {
    id: 'sheikh_hasina_habiganj',
    name: 'Habiganj Medical College (HMC)',
    nameBn: 'হবিগঞ্জ মেডিকেল কলেজ',
    type: 'medical_college',
    district: 'habiganj',
    location: 'Habiganj Sadar, Habiganj',
    aliases: ['hmc', 'habiganj medical']
  },
  {
    id: 'bangabandhu_sunamganj_med',
    name: 'Sunamganj Medical College (SMC)',
    nameBn: 'সুনামগঞ্জ মেডিকেল কলেজ',
    type: 'medical_college',
    district: 'sunamganj',
    location: 'Madankapon, Sunamganj',
    aliases: ['smc', 'sunamganj medical']
  },

  // ===================== GOVT & PROMINENT COLLEGES - SYLHET =====================
  {
    id: 'mc_college',
    name: 'Murari Chand (MC) College, Sylhet',
    nameBn: 'মুরারিচাঁদ (এমসি) কলেজ, সিলেট',
    type: 'college',
    district: 'sylhet',
    location: 'Tilagarh, Sylhet',
    aliases: ['mc college', 'murarichand', 'এমসি কলেজ']
  },
  {
    id: 'sylhet_govt_college',
    name: 'Sylhet Government College',
    nameBn: 'সিলেট সরকারি কলেজ',
    type: 'college',
    district: 'sylhet',
    location: 'Tilagarh, Sylhet',
    aliases: ['govt college sylhet', 'সরকারি কলেজ সিলেট']
  },
  {
    id: 'sylhet_govt_womens_college',
    name: "Sylhet Government Women's College",
    nameBn: 'সিলেট সরকারি মহিলা কলেজ',
    type: 'college',
    district: 'sylhet',
    location: 'Chowhatta, Sylhet',
    aliases: ['womens college chowhatta', 'সরকারি মহিলা কলেজ সিলেট']
  },
  {
    id: 'madan_mohan_college',
    name: 'Madan Mohan College, Sylhet',
    nameBn: 'মদন মোহন কলেজ, সিলেট',
    type: 'college',
    district: 'sylhet',
    location: 'Lama Bazar, Sylhet',
    aliases: ['madan mohan', 'মদন মোহন কলেজ']
  },
  {
    id: 'sylhet_polytechnic',
    name: 'Sylhet Polytechnic Institute',
    nameBn: 'সিলেট পলিটেকনিক ইনস্টিটিউট',
    type: 'polytechnic',
    district: 'sylhet',
    location: 'Technical Road, Sylhet',
    aliases: ['polytechnic', 'spi', 'সিলেট পলিটেকনিক']
  },
  {
    id: 'sylhet_cadet_college',
    name: 'Sylhet Cadet College',
    nameBn: 'সিলেট ক্যাডেট কলেজ',
    type: 'college',
    district: 'sylhet',
    location: 'Airport Road, Sylhet',
    aliases: ['cadet college']
  },
  {
    id: 'scholarshome_shahi_eidgah',
    name: 'Scholarshome College, Shahi Eidgah',
    nameBn: 'স্কলার্সহোম কলেজ, শাহী ঈদগাহ',
    type: 'college',
    district: 'sylhet',
    location: 'Shahi Eidgah, Sylhet',
    aliases: ['scholarshome']
  },
  {
    id: 'beanibazar_govt_college',
    name: 'Beanibazar Government College',
    nameBn: 'বিয়ানীবাজার সরকারি কলেজ',
    type: 'college',
    district: 'sylhet',
    location: 'Beanibazar, Sylhet',
    aliases: ['beanibazar college', 'বিয়ানীবাজার কলেজ']
  },
  {
    id: 'golapganj_govt_college',
    name: 'Dhaka Dakshin Degree College, Golapganj',
    nameBn: 'ঢাকা দক্ষিণ ডিগ্রি কলেজ, গোলাপগঞ্জ',
    type: 'college',
    district: 'sylhet',
    location: 'Dhaka Dakshin, Golapganj, Sylhet',
    aliases: ['dhaka dakshin', 'golapganj college']
  },
  {
    id: 'bishwanath_college',
    name: 'Bishwanath Government College',
    nameBn: 'বিশ্বনাথ সরকারি কলেজ',
    type: 'college',
    district: 'sylhet',
    location: 'Bishwanath, Sylhet',
    aliases: ['bishwanath college', 'বিশ্বনাথ কলেজ']
  },
  {
    id: 'fenchuganj_govt_college',
    name: 'Fenchuganj Government College',
    nameBn: 'ফেঞ্চুগঞ্জ সরকারি কলেজ',
    type: 'college',
    district: 'sylhet',
    location: 'Fenchuganj, Sylhet',
    aliases: ['fenchuganj college', 'ফেঞ্চুগঞ্জ কলেজ']
  },
  {
    id: 'imran_ahmed_college',
    name: 'Imran Ahmad Government College, Jaintiapur',
    nameBn: 'ইমরান আহমদ সরকারি কলেজ, জৈন্তাপুর',
    type: 'college',
    district: 'sylhet',
    location: 'Jaintiapur, Sylhet',
    aliases: ['jaintiapur college', 'imran ahmad']
  },
  {
    id: 'gowainghat_govt_college',
    name: 'Gowainghat Government College',
    nameBn: 'গোয়াইনঘাট সরকারি কলেজ',
    type: 'college',
    district: 'sylhet',
    location: 'Gowainghat, Sylhet',
    aliases: ['gowainghat college']
  },
  {
    id: 'kanaighat_govt_college',
    name: 'Kanaighat Government College',
    nameBn: 'কানাইঘাট সরকারি কলেজ',
    type: 'college',
    district: 'sylhet',
    location: 'Kanaighat, Sylhet',
    aliases: ['kanaighat college']
  },
  {
    id: 'zakiganj_govt_college',
    name: 'Zakiganj Government College',
    nameBn: 'জকিগঞ্জ সরকারি কলেজ',
    type: 'college',
    district: 'sylhet',
    location: 'Zakiganj, Sylhet',
    aliases: ['zakiganj college']
  },
  {
    id: 'balaganj_govt_college',
    name: 'DN Government College, Balaganj',
    nameBn: 'ডি.এন. সরকারি কলেজ, বালাগঞ্জ',
    type: 'college',
    district: 'sylhet',
    location: 'Balaganj, Sylhet',
    aliases: ['balaganj college']
  },
  {
    id: 'tajpur_degree_college',
    name: 'Tajpur Degree College, Osmani Nagar',
    nameBn: 'তাজপুর ডিগ্রি কলেজ, ওসমানীনগর',
    type: 'college',
    district: 'sylhet',
    location: 'Tajpur, Osmani Nagar, Sylhet',
    aliases: ['tajpur college']
  },

  // ===================== COLLEGES - MOULVIBAZAR =====================
  {
    id: 'moulvibazar_govt_college',
    name: 'Moulvibazar Government College',
    nameBn: 'মৌলভীবাজার সরকারি কলেজ',
    type: 'college',
    district: 'moulvibazar',
    location: 'Moulvibazar Sadar, Moulvibazar',
    aliases: ['moulvibazar college', 'মৌলভীবাজার কলেজ']
  },
  {
    id: 'moulvibazar_govt_womens',
    name: "Moulvibazar Government Women's College",
    nameBn: 'মৌলভীবাজার সরকারি মহিলা কলেজ',
    type: 'college',
    district: 'moulvibazar',
    location: 'Moulvibazar Sadar, Moulvibazar',
    aliases: ['moulvibazar womens college']
  },
  {
    id: 'moulvibazar_polytechnic',
    name: 'Moulvibazar Polytechnic Institute',
    nameBn: 'মৌলভীবাজার পলিটেকনিক ইনস্টিটিউট',
    type: 'polytechnic',
    district: 'moulvibazar',
    location: 'Matarkapon, Moulvibazar',
    aliases: ['moulvibazar polytechnic']
  },
  {
    id: 'sreemangal_govt_college',
    name: 'Sreemangal Government College',
    nameBn: 'শ্রীমঙ্গল সরকারি কলেজ',
    type: 'college',
    district: 'moulvibazar',
    location: 'Sreemangal, Moulvibazar',
    aliases: ['sreemangal college', 'শ্রীমঙ্গল কলেজ']
  },
  {
    id: 'kulaura_govt_college',
    name: 'Kulaura Government College',
    nameBn: 'কুলাউড়া সরকারি কলেজ',
    type: 'college',
    district: 'moulvibazar',
    location: 'Kulaura, Moulvibazar',
    aliases: ['kulaura college', 'কুলাউড়া কলেজ']
  },
  {
    id: 'kamalganj_govt_college',
    name: 'Kamalganj Government College',
    nameBn: 'কমলগঞ্জ সরকারি কলেজ',
    type: 'college',
    district: 'moulvibazar',
    location: 'Kamalganj, Moulvibazar',
    aliases: ['kamalganj college']
  },
  {
    id: 'barlekha_govt_college',
    name: 'Barlekha Government College',
    nameBn: 'বড়লেখা সরকারি কলেজ',
    type: 'college',
    district: 'moulvibazar',
    location: 'Barlekha, Moulvibazar',
    aliases: ['barlekha college']
  },
  {
    id: 'tayabunnesa_khanom_college',
    name: 'Tayabunnesa Khanam City College, Juri',
    nameBn: 'তৈয়বুন্নেছা খানম সিটি কলেজ, জুড়ী',
    type: 'college',
    district: 'moulvibazar',
    location: 'Juri, Moulvibazar',
    aliases: ['juri college', 'tayabunnesa']
  },
  {
    id: 'rajnagar_govt_college',
    name: 'Rajnagar Government College',
    nameBn: 'রাজনগর সরকারি কলেজ',
    type: 'college',
    district: 'moulvibazar',
    location: 'Rajnagar, Moulvibazar',
    aliases: ['rajnagar college']
  },

  // ===================== COLLEGES - HABIGANJ =====================
  {
    id: 'brindaban_govt_college',
    name: 'Brindaban Government College, Habiganj',
    nameBn: 'বৃন্দাবন সরকারি কলেজ, হবিগঞ্জ',
    type: 'college',
    district: 'habiganj',
    location: 'Habiganj Sadar, Habiganj',
    aliases: ['brindaban college', 'বৃন্দাবন কলেজ', 'habiganj govt college']
  },
  {
    id: 'habiganj_govt_womens',
    name: "Habiganj Government Women's College",
    nameBn: 'হবিগঞ্জ সরকারি মহিলা কলেজ',
    type: 'college',
    district: 'habiganj',
    location: 'Habiganj Sadar, Habiganj',
    aliases: ['habiganj womens college']
  },
  {
    id: 'habiganj_polytechnic',
    name: 'Habiganj Polytechnic Institute',
    nameBn: 'হবিগঞ্জ পলিটেকনিক ইনস্টিটিউট',
    type: 'polytechnic',
    district: 'habiganj',
    location: 'Gopaya, Habiganj',
    aliases: ['habiganj polytechnic']
  },
  {
    id: 'nabiganj_govt_college',
    name: 'Nabiganj Government College',
    nameBn: 'নবীগঞ্জ সরকারি কলেজ',
    type: 'college',
    district: 'habiganj',
    location: 'Nabiganj, Habiganj',
    aliases: ['nabiganj college', 'নবীগঞ্জ কলেজ']
  },
  {
    id: 'chunarughat_govt_college',
    name: 'Chunarughat Government College',
    nameBn: 'চুনারুঘাট সরকারি কলেজ',
    type: 'college',
    district: 'habiganj',
    location: 'Chunarughat, Habiganj',
    aliases: ['chunarughat college']
  },
  {
    id: 'madhabpur_govt_college',
    name: 'Syed Sayeed Uddin Degree College, Madhabpur',
    nameBn: 'সৈয়দ সঈদ উদ্দিন ডিগ্রি কলেজ, মাধবপুর',
    type: 'college',
    district: 'habiganj',
    location: 'Madhabpur, Habiganj',
    aliases: ['madhabpur college']
  },
  {
    id: 'baniachang_govt_college',
    name: 'Janata Degree College, Baniachang',
    nameBn: 'জনতা ডিগ্রি কলেজ, বানিয়াচং',
    type: 'college',
    district: 'habiganj',
    location: 'Baniachang, Habiganj',
    aliases: ['baniachang college']
  },
  {
    id: 'sayestaganj_degree_college',
    name: 'Sayestaganj Degree College',
    nameBn: 'শায়েস্তাগঞ্জ ডিগ্রি কলেজ',
    type: 'college',
    district: 'habiganj',
    location: 'Sayestaganj, Habiganj',
    aliases: ['sayestaganj college']
  },

  // ===================== COLLEGES - SUNAMGANJ =====================
  {
    id: 'sunamganj_govt_college',
    name: 'Sunamganj Government College',
    nameBn: 'সুনামগঞ্জ সরকারি কলেজ',
    type: 'college',
    district: 'sunamganj',
    location: 'Sunamganj Sadar, Sunamganj',
    aliases: ['sunamganj college', 'সুনামগঞ্জ কলেজ']
  },
  {
    id: 'sunamganj_govt_womens',
    name: "Sunamganj Government Women's College",
    nameBn: 'সুনামগঞ্জ সরকারি মহিলা কলেজ',
    type: 'college',
    district: 'sunamganj',
    location: 'Sunamganj Sadar, Sunamganj',
    aliases: ['sunamganj womens college']
  },
  {
    id: 'sunamganj_polytechnic',
    name: 'Sunamganj Polytechnic Institute',
    nameBn: 'সুনামগঞ্জ পলিটেকনিক ইনস্টিটিউট',
    type: 'polytechnic',
    district: 'sunamganj',
    location: 'Sunamganj Sadar, Sunamganj',
    aliases: ['sunamganj polytechnic']
  },
  {
    id: 'chhatak_govt_college',
    name: 'Chhatak Government College',
    nameBn: 'ছাতক সরকারি কলেজ',
    type: 'college',
    district: 'sunamganj',
    location: 'Chhatak, Sunamganj',
    aliases: ['chhatak college', 'ছাতক কলেজ']
  },
  {
    id: 'jagannathpur_govt_college',
    name: 'Jagannathpur Government College',
    nameBn: 'জগন্নাথপুর সরকারি কলেজ',
    type: 'college',
    district: 'sunamganj',
    location: 'Jagannathpur, Sunamganj',
    aliases: ['jagannathpur college', 'জগন্নাথপুর কলেজ']
  },
  {
    id: 'derai_govt_college',
    name: 'Derai Government College',
    nameBn: 'দিরাই সরকারি কলেজ',
    type: 'college',
    district: 'sunamganj',
    location: 'Derai, Sunamganj',
    aliases: ['derai college']
  },
  {
    id: 'tahirpur_govt_college',
    name: 'Badaghat Government Degree College, Tahirpur',
    nameBn: 'বাদাঘাট সরকারি ডিগ্রি কলেজ, তাহিরপুর',
    type: 'college',
    district: 'sunamganj',
    location: 'Tahirpur, Sunamganj',
    aliases: ['tahirpur college', 'badaghat college']
  },
  {
    id: 'dharampasha_govt_college',
    name: 'Dharampasha Government College',
    nameBn: 'ধর্মপাশা সরকারি কলেজ',
    type: 'college',
    district: 'sunamganj',
    location: 'Dharampasha, Sunamganj',
    aliases: ['dharampasha college']
  },
  {
    id: 'jamalganj_govt_college',
    name: 'Jamalganj Government College',
    nameBn: 'জামালগঞ্জ সরকারি কলেজ',
    type: 'college',
    district: 'sunamganj',
    location: 'Jamalganj, Sunamganj',
    aliases: ['jamalganj college']
  },
  {
    id: 'pagla_model_high_school_college',
    name: 'Pagla High School & College, Shantiganj',
    nameBn: 'পাগলা মডেল হাই স্কুল ও কলেজ, শান্তিগঞ্জ',
    type: 'college',
    district: 'sunamganj',
    location: 'Shantiganj, Sunamganj',
    aliases: ['pagla college', 'shantiganj college']
  }
];

// Helper to search and filter institutes with typing query
export function filterInstitutes(query: string, districtFilter?: string): EducationalInstitute[] {
  const q = (query || '').toLowerCase().trim();
  return SYLHET_INSTITUTES.filter((inst) => {
    if (districtFilter && districtFilter !== 'all' && inst.district !== districtFilter) {
      return false;
    }
    if (!q) return true;
    return (
      inst.name.toLowerCase().includes(q) ||
      inst.nameBn.includes(q) ||
      inst.location.toLowerCase().includes(q) ||
      inst.aliases.some((a) => a.toLowerCase().includes(q))
    );
  });
}
