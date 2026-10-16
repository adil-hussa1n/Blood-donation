import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Download,
  Printer,
  RotateCw,
  Award,
  ShieldCheck,
  Heart,
  Flame,
  QrCode,
  MapPin,
  Calendar,
  Phone,
  Clock,
  Tag,
  Building2,
  ExternalLink,
  CheckCircle2,
  Copy,
  Info
} from 'lucide-react';
import { useApp, getDistrictBadge } from '../context/AppContext';

export default function DonorCardModal({ donor, onClose }) {
  const { language, t, getDonorCardConfig, getDonorCardOffers, showToast } = useApp();
  const [activeSide, setActiveSide] = useState('front'); // 'front' | 'back'
  const [isFlipping, setIsFlipping] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [offersTab, setOffersTab] = useState(false); // view offers drawer/tab
  const [copiedCode, setCopiedCode] = useState(null);

  // Dynamic config and sponsorship offers fetched from backend/admin
  const [cardConfig, setCardConfig] = useState({
    card_title: 'Smart Blood Donor Card',
    card_subtitle: 'Sylhet Emergency Blood Network • Darun Donors',
    front_notes: 'This card certifies that the bearer is a verified voluntary blood donor dedicated to saving human lives in emergency need.',
    back_terms: '1. Non-transferable voluntary donor identity.\n2. Present this card or QR code to claim partner benefits.\n3. Clinical cooldown of 90 days applies between whole blood donations.\n4. Always verify medical eligibility before transfusion.',
    emergency_hotline: '+880 1800-000000',
    authorized_signatory_title: 'Medical & Registry Director',
    badge_accent_color: '#dc2626',
    badge_text: 'Life Saver',
    card_theme: 'crimson_dark',
    issue_org: '',
    website_url: 'donors.daruntech.com',
    valid_years: 3,
    show_qr: 1,
    front_tag_label: 'REGISTERED LIFE SAVER',
    qr_label: 'SCAN TO VERIFY',
    back_guidelines_title: 'Guidelines & Partner Benefits',
    security_strip_text: 'DARUN DONORS DIGITAL SECURITY STRIP • VERIFIED VOLUNTARY REGISTRY',
    blood_group_label: 'GROUP',
    district_label: 'District / Area',
    donations_label: 'Total Donations',
    valid_thru_label: 'Valid Thru',
    verified_status_text: 'Verified Voluntary Donor',
    footer_sponsor_text: 'Partner discounts valid at recognized diagnostic centers and clinics.'
  });
  const [offers, setOffers] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [cfgRes, offersRes] = await Promise.all([
          getDonorCardConfig(),
          getDonorCardOffers()
        ]);
        if (mounted) {
          if (cfgRes?.data) setCardConfig(cfgRes.data);
          if (offersRes?.data) setOffers(offersRes.data.filter(o => o.is_active));
        }
      } catch (err) {
        console.warn('Failed to load dynamic card config/offers:', err);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (!donor) return null;

  const district = getDistrictBadge(donor.area, language);
  const cardId = `BD-${(donor.id || 'DONOR').replace(/-/g, '').slice(0, 8).toUpperCase()}`;
  const qrVerificationUrl = `https://donors.daruntech.com/?donor=${donor.id || ''}`;
  const qrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrVerificationUrl)}&color=0f172a&bgcolor=ffffff`;

  const handleFlip = () => {
    setIsFlipping(true);
    setTimeout(() => {
      setActiveSide(prev => prev === 'front' ? 'back' : 'front');
      setIsFlipping(false);
    }, 200);
  };

  const copyPromoCode = (code) => {
    if (!code) return;
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    showToast(language === 'bn' ? 'কুপন কোড কপি করা হয়েছে!' : 'Promo code copied!', 'success');
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Dynamic Theme Definitions
  const getThemeStyles = () => {
    const theme = cardConfig.card_theme || 'crimson_dark';
    switch (theme) {
      case 'royal_navy':
        return {
          frontGradient: 'from-slate-950 via-slate-900 to-blue-950',
          backGradient: 'from-slate-950 via-blue-950/60 to-slate-900',
          accent: cardConfig.badge_accent_color || '#2563eb',
          badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
          crestGradient: 'from-blue-600 via-indigo-650 to-blue-800',
          crestRing: 'ring-blue-500/20 border-blue-400/60',
          highlightGlow: 'bg-blue-600/20',
          ribbonGradient: 'from-blue-500 via-sky-400 to-indigo-600',
          canvasBg1: '#020617',
          canvasBg2: '#1e3a8a',
          canvasBg3: '#0f172a'
        };
      case 'emerald_prestige':
        return {
          frontGradient: 'from-slate-950 via-emerald-950/70 to-slate-900',
          backGradient: 'from-slate-950 via-emerald-950/50 to-zinc-950',
          accent: cardConfig.badge_accent_color || '#059669',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          crestGradient: 'from-emerald-600 via-teal-650 to-emerald-800',
          crestRing: 'ring-emerald-500/20 border-emerald-400/60',
          highlightGlow: 'bg-emerald-600/20',
          ribbonGradient: 'from-emerald-500 via-teal-400 to-amber-500',
          canvasBg1: '#022c22',
          canvasBg2: '#064e3b',
          canvasBg3: '#0f172a'
        };
      case 'onyx_gold':
        return {
          frontGradient: 'from-zinc-950 via-neutral-900 to-black',
          backGradient: 'from-black via-zinc-900 to-neutral-950',
          accent: cardConfig.badge_accent_color || '#d97706',
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          crestGradient: 'from-amber-600 via-yellow-650 to-amber-800',
          crestRing: 'ring-amber-500/20 border-amber-400/60',
          highlightGlow: 'bg-amber-500/15',
          ribbonGradient: 'from-amber-500 via-yellow-300 to-amber-600',
          canvasBg1: '#09090b',
          canvasBg2: '#27272a',
          canvasBg3: '#000000'
        };
      case 'crimson_dark':
      default:
        return {
          frontGradient: 'from-slate-950 via-indigo-950/60 to-slate-900',
          backGradient: 'from-slate-950 via-slate-900 to-zinc-950',
          accent: cardConfig.badge_accent_color || '#dc2626',
          badgeBg: 'bg-red-500/20 text-red-300 border-red-500/30',
          crestGradient: 'from-rose-600 via-red-650 to-red-800',
          crestRing: 'ring-red-500/20 border-red-400/60',
          highlightGlow: 'bg-red-600/20',
          ribbonGradient: 'from-red-500 via-amber-400 to-rose-600',
          canvasBg1: '#0f172a',
          canvasBg2: '#1e1b4b',
          canvasBg3: '#090d16'
        };
    }
  };

  const themeStyle = getThemeStyles();
  const showQrOnCard = cardConfig.show_qr !== 0 && cardConfig.show_qr !== false;
  const validityYears = cardConfig.valid_years || 3;
  const expiryYear = new Date().getFullYear() + validityYears;

  // High-Resolution Dual-Side Card PNG Export
  const handleDownloadCardImage = async () => {
    setIsDownloading(true);
    try {
      // Create high-res canvas (width: 1200, height: 750, standard CR80 landscape proportion)
      const width = 1200;
      const height = 750;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');

      // Helper function for rounded rectangles
      const roundRect = (x, y, w, h, r) => {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
      };

      if (activeSide === 'front') {
        // ================= FRONT SIDE CANVAS =================
        const bg = ctx.createLinearGradient(0, 0, width, height);
        bg.addColorStop(0, themeStyle.canvasBg1);
        bg.addColorStop(0.5, themeStyle.canvasBg2);
        bg.addColorStop(1, themeStyle.canvasBg3);
        ctx.fillStyle = bg;
        roundRect(20, 20, width - 40, height - 40, 36);
        ctx.fill();

        // Outer Metallic Border
        ctx.strokeStyle = themeStyle.accent;
        ctx.lineWidth = 6;
        roundRect(20, 20, width - 40, height - 40, 36);
        ctx.stroke();

        // Top Accent Stripe
        const stripe = ctx.createLinearGradient(20, 20, width - 20, 20);
        stripe.addColorStop(0, themeStyle.accent);
        stripe.addColorStop(0.5, '#f59e0b');
        stripe.addColorStop(1, themeStyle.accent);
        ctx.fillStyle = stripe;
        ctx.fillRect(40, 22, width - 80, 8);

        // Header Title & Brand
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 34px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(cardConfig.card_title || 'DARUN DONORS', 70, 95);

        ctx.font = '600 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(cardConfig.card_subtitle || 'Sylhet Emergency Blood Network', 70, 125);

        // Top Right Life Saver Official Badge
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        roundRect(width - 250, 65, 180, 50, 14);
        ctx.fill();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
        roundRect(width - 250, 65, 180, 50, 14);
        ctx.stroke();

        ctx.fillStyle = '#fde68a';
        ctx.font = '900 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`★ ${cardConfig.badge_text || 'LIFE SAVER'}`.toUpperCase(), width - 160, 96);
        ctx.textAlign = 'left';

        // Blood Group Emblem (Right Center)
        const bloodX = width - 180;
        const bloodY = 320;
        ctx.save();
        ctx.beginPath();
        ctx.arc(bloodX, bloodY, 80, 0, Math.PI * 2);
        const bloodGrad = ctx.createLinearGradient(bloodX - 60, bloodY - 60, bloodX + 60, bloodY + 60);
        bloodGrad.addColorStop(0, themeStyle.accent);
        bloodGrad.addColorStop(1, '#881337');
        ctx.fillStyle = bloodGrad;
        ctx.fill();
        ctx.strokeStyle = themeStyle.accent;
        ctx.lineWidth = 5;
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffe4e6';
        ctx.font = '700 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText((cardConfig.blood_group_label || 'GROUP').toUpperCase(), bloodX, bloodY - 32);

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 52px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(donor.blood_group || 'O+', bloodX, bloodY + 10);
        ctx.restore();

        // Donor Name & Details
        ctx.textAlign = 'left';
        ctx.fillStyle = '#94a3b8';
        ctx.font = '700 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText((cardConfig.front_tag_label || 'REGISTERED LIFE SAVER').toUpperCase(), 70, 205);

        ctx.fillStyle = '#f8fafc';
        ctx.font = '900 46px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(donor.name || 'Honored Donor', 70, 248);

        ctx.fillStyle = '#38bdf8';
        ctx.font = '700 18px monospace';
        ctx.fillText(`CARD ID: ${cardId}   •   ${cardConfig.verified_status_text || 'Verified Voluntary Donor'}`, 70, 285);

        // 3-Column Stats Grid
        const gridY = 350;
        ctx.fillStyle = '#64748b';
        ctx.font = '700 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText((cardConfig.district_label || 'DISTRICT / AREA').toUpperCase(), 70, gridY);
        ctx.fillText((cardConfig.donations_label || 'TOTAL DONATIONS').toUpperCase(), 380, gridY);
        ctx.fillText((cardConfig.valid_thru_label || 'VALID THRU').toUpperCase(), 640, gridY);

        ctx.fillStyle = '#ffffff';
        ctx.font = '800 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(donor.area || 'Sylhet', 70, gridY + 34);
        ctx.fillText(`${donor.total_donations || 1} Times`, 380, gridY + 34);
        ctx.fillStyle = '#38bdf8';
        ctx.fillText(`12/${expiryYear}`, 640, gridY + 34);

        // Bottom Footer Bar
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        roundRect(60, height - 150, width - 120, 85, 18);
        ctx.fill();

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '500 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(cardConfig.front_notes || 'Verified voluntary blood donor dedicated to saving human lives.', 85, height - 110);

        ctx.fillStyle = '#f59e0b';
        ctx.font = '700 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(`Hotline: ${cardConfig.emergency_hotline || '+880 1700-000000'}   •   Registry: ${cardConfig.website_url || 'donors.daruntech.com'}`, 85, height - 82);

      } else {
        // ================= BACK SIDE CANVAS =================
        const bg = ctx.createLinearGradient(0, 0, width, height);
        bg.addColorStop(0, '#090d16');
        bg.addColorStop(0.5, '#1e293b');
        bg.addColorStop(1, '#0f172a');
        ctx.fillStyle = bg;
        roundRect(20, 20, width - 40, height - 40, 36);
        ctx.fill();

        // Magnetic Strip Emulation
        ctx.fillStyle = '#020617';
        ctx.fillRect(20, 80, width - 40, 90);
        ctx.fillStyle = '#64748b';
        ctx.font = '700 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(cardConfig.security_strip_text || 'DARUN DONORS DIGITAL SECURITY STRIP • VERIFIED VOLUNTARY REGISTRY', width / 2, 130);

        if (showQrOnCard) {
          ctx.fillStyle = '#ffffff';
          roundRect(60, 210, 200, 200, 16);
          ctx.fill();

          ctx.fillStyle = '#0f172a';
          ctx.font = '700 12px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(cardConfig.qr_label || 'SCAN TO VERIFY', 160, 240);
          ctx.fillText(cardId, 160, 390);
        }

        ctx.textAlign = 'left';
        ctx.fillStyle = '#f8fafc';
        ctx.font = '800 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText((cardConfig.back_guidelines_title || 'GUIDELINES & PARTNER BENEFITS').toUpperCase(), showQrOnCard ? 290 : 85, 235);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '500 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        const terms = (cardConfig.back_terms || '').split('\n').filter(Boolean);
        terms.slice(0, 4).forEach((term, idx) => {
          ctx.fillText(term, showQrOnCard ? 290 : 85, 275 + (idx * 30));
        });

        // Signatory Title & Organization
        ctx.fillStyle = '#64748b';
        ctx.font = '600 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        const issuedLabel = cardConfig.issued_by_label ? `${cardConfig.issued_by_label} ` : 'Issued by: ';
        ctx.fillText(`${issuedLabel}${cardConfig.issue_org || ''}`, showQrOnCard ? 290 : 85, 410);

        ctx.fillStyle = '#f43f5e';
        ctx.font = '700 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(`Authorized Signature: ${cardConfig.authorized_signatory_title || ''}`, showQrOnCard ? 290 : 85, 435);
        // Bottom Sponsor Bar
        ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
        roundRect(60, height - 190, width - 120, 120, 20);
        ctx.fill();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
        roundRect(60, height - 190, width - 120, 120, 20);
        ctx.stroke();

        ctx.fillStyle = '#fbbf24';
        ctx.font = '800 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('★ ACTIVE COMMUNITY SPONSORSHIP PRIVILEGES:', 85, height - 150);

        ctx.fillStyle = '#ffffff';
        ctx.font = '600 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        const displayOffers = offers.slice(0, 2);
        if (displayOffers.length > 0) {
          displayOffers.forEach((off, i) => {
            ctx.fillText(`• ${off.sponsor_name}: ${off.discount_text} (${off.title})`, 85, height - 120 + (i * 26));
          });
        } else {
          ctx.fillText(`• ${cardConfig.footer_sponsor_text || 'Diagnostic & Pharmacy discounts available across partner hospitals in Sylhet.'}`, 85, height - 120);
        }
      }

      // Export PNG and trigger download
      const safeName = (donor.name || 'Donor').replace(/[^a-zA-Z0-9]/g, '_');
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `DonorCard_${safeName}_${activeSide.toUpperCase()}.png`;
      link.href = dataUrl;
      link.click();
      showToast(language === 'bn' ? 'ডোনার কার্ড ডাউনলোড হয়েছে!' : 'Donor Card image downloaded!', 'success');
    } catch (err) {
      console.error('Error generating card image:', err);
      showToast('Could not download image. Try printing instead.', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrintCard = () => {
    document.body.classList.add('donor-card-printing');
    const cleanup = () => {
      document.body.classList.remove('donor-card-printing');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    setTimeout(() => {
      window.print();
      // Fallback cleanup in case afterprint event does not fire on older browsers
      setTimeout(cleanup, 1500);
    }, 50);
  };

  const modalContent = (
    <div id="donor-card-modal-overlay" className="fixed inset-0 w-screen h-screen z-[9999] flex items-center justify-center p-3 sm:p-5 md:p-6 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">

      {/* Print Specific CSS Styles for PDF & Hardcopy */}
      <style>{`
        @media print {
          @page {
            size: landscape;
            margin: 8mm !important;
          }
          body > *:not(#donor-card-modal-overlay),
          #root,
          header,
          footer,
          nav,
          main {
            display: none !important;
          }
          body {
            background: #0f172a !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #donor-card-modal-overlay {
            position: static !important;
            display: block !important;
            background: transparent !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
          }
          .donor-card-screen-only {
            display: none !important;
          }
          .donor-card-print-container {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 12mm !important;
            width: 100% !important;
            margin: 0 auto !important;
            padding: 4mm 0 !important;
          }
          .donor-card-print-item {
            display: flex !important;
            width: 155mm !important;
            max-width: 100% !important;
            aspect-ratio: 1.58 / 1 !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      <div className="relative max-w-2xl w-full my-auto animate-scale-up space-y-4 print:max-w-none print:w-full print:my-0 print:space-y-0">

        {/* Top Floating Control Bar */}
        <div className="donor-card-screen-only flex items-center justify-between bg-slate-900/90 border border-slate-800 p-2.5 sm:p-3 rounded-2xl shadow-xl print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <h3 className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              {language === 'bn' ? 'স্মার্ট রক্তদাতা কার্ড' : 'Smart Blood Donor Card'}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Flip Side Toggle */}
            <button
              type="button"
              onClick={handleFlip}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-700"
              title="Flip Card View"
            >
              <RotateCw className={`w-3.5 h-3.5 text-amber-400 ${isFlipping ? 'animate-spin' : ''}`} />
              <span>{activeSide === 'front' ? (language === 'bn' ? 'পেছনের পাশ' : 'Back Side') : (language === 'bn' ? 'সামনের পাশ' : 'Front Side')}</span>
            </button>

            {/* Offers Drawer Toggle */}
            <button
              type="button"
              onClick={() => setOffersTab(prev => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${offersTab
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-amber-500/40'
                }`}
              title="View Sponsorship Offers"
            >
              <Tag className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'অফারসমূহ' : 'Offers'} ({offers.length})</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 flex items-center justify-center transition-colors cursor-pointer"
              title="Close Modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* INTERACTIVE DUAL-SIDED 3D CARD DISPLAY                         */}
        {/* ============================================================== */}
        <div className="donor-card-screen-only perspective-1000 select-none">
          <div className={`transition-all duration-300 transform ${isFlipping ? 'scale-95 opacity-80' : 'scale-100 opacity-100'} print:hidden`}>

            {activeSide === 'front' ? (
              /* ======================= FRONT SIDE ======================= */
              <div
                className={`card-side-container relative w-full aspect-[1.6/1] rounded-3xl p-5 sm:p-7 shadow-2xl border-2 bg-gradient-to-br ${themeStyle.frontGradient} text-white flex flex-col justify-between overflow-hidden ring-1 ring-white/10`}
                style={{ borderColor: themeStyle.accent }}
              >
                {/* Background Ambient Glow & Dot Matrix */}
                <div className={`absolute top-0 right-0 w-96 h-96 ${themeStyle.highlightGlow} rounded-full blur-3xl pointer-events-none -mr-20 -mt-20`} />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

                {/* Top Edge Metallic Ribbon */}
                <div className={`absolute top-0 inset-x-8 h-1.5 bg-gradient-to-r ${themeStyle.ribbonGradient} rounded-b-md opacity-90`} />

                {/* Card Top Row: Official Logo & Brand Header */}
                <div className="flex items-center justify-between relative z-10 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white p-1.5 shadow-lg border border-white/20 flex items-center justify-center shrink-0">
                      <img
                        src="/logo.png"
                        alt="Darun Donors Logo"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="text-left space-y-0.5 min-w-0">
                      <h3 className="text-base sm:text-xl font-black tracking-wide uppercase text-white drop-shadow-sm truncate">
                        {cardConfig.card_title || 'DARUN DONORS'}
                      </h3>
                      <span className="text-[10px] sm:text-xs text-slate-300 font-semibold block tracking-wide truncate">
                        {cardConfig.card_subtitle || 'Sylhet Emergency Blood Network'}
                      </span>
                    </div>
                  </div>

                  {/* Top Right Lifesaver Seal Badge */}
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${themeStyle.badgeBg} backdrop-blur-md border shadow-sm shrink-0`}>
                    <Award className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-[10px] sm:text-xs font-black tracking-wider uppercase">
                      {cardConfig.badge_text || 'Life Saver'}
                    </span>
                  </div>
                </div>

                {/* Card Middle: Donor Name, ID & Blood Group Crest */}
                <div className="flex items-center justify-between gap-4 my-auto py-2 relative z-10">
                  <div className="space-y-1.5 min-w-0 pr-2">
                    <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold block">
                      {cardConfig.front_tag_label || 'Registered Life Saver'}
                    </span>
                    <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight truncate drop-shadow">
                      {donor.name}
                    </h2>
                    <div className="flex items-center gap-2 font-mono text-[11px] sm:text-xs text-sky-400 font-bold flex-wrap">
                      <span>ID: {cardId}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-emerald-400 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                        {cardConfig.verified_status_text || 'Verified'}
                      </span>
                    </div>
                  </div>

                  {/* Blood Group Crest Seal */}
                  <div className="relative shrink-0 flex items-center justify-center">
                    <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${themeStyle.crestGradient} border-2 shadow-xl flex flex-col items-center justify-center text-white ring-4 ${themeStyle.crestRing}`}>
                      <span className="text-[7px] sm:text-[8px] font-bold uppercase tracking-widest text-white/80">
                        {cardConfig.blood_group_label || 'Group'}
                      </span>
                      <span className="text-2xl sm:text-3xl font-black leading-none mt-0.5 tracking-tight drop-shadow-md">
                        {donor.blood_group}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Bottom Row: Metadata Grid & Note */}
                <div className="relative z-10 pt-2 border-t border-slate-800/80">
                  <div className="grid grid-cols-3 gap-3 text-left">
                    <div className="min-w-0">
                      <span className="text-[8px] sm:text-[9px] text-slate-400 font-bold uppercase block tracking-wider">
                        {cardConfig.district_label || 'District / Area'}
                      </span>
                      <strong className="text-xs sm:text-sm font-bold text-slate-200 block truncate" title={donor.area || 'Sylhet'}>
                        {donor.area || 'Sylhet'}
                      </strong>
                    </div>

                    <div className="min-w-0">
                      <span className="text-[8px] sm:text-[9px] text-slate-400 font-bold uppercase block tracking-wider">
                        {cardConfig.donations_label || 'Total Donations'}
                      </span>
                      <strong className="text-xs sm:text-sm font-bold text-amber-400 block truncate">
                        {t('timesUnit', { count: donor.total_donations || 1 })}
                      </strong>
                    </div>

                    <div className="min-w-0">
                      <span className="text-[8px] sm:text-[9px] text-slate-400 font-bold uppercase block tracking-wider">
                        {cardConfig.valid_thru_label || 'Valid Thru'}
                      </span>
                      <strong className="text-xs sm:text-sm font-bold text-sky-300 block truncate font-mono">
                        12/{expiryYear}
                      </strong>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-1.5 flex items-center justify-between text-[8px] sm:text-[9px] text-slate-400 border-t border-slate-800/50">
                    <span className="truncate pr-2">
                      {cardConfig.front_notes || 'Verified voluntary blood donor dedicated to saving human lives.'}
                    </span>
                    <span className="font-mono text-amber-400/90 shrink-0 font-bold">
                      HOTLINE: {cardConfig.emergency_hotline || '+880 1700-000000'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* ======================= BACK SIDE ======================= */
              <div
                className={`card-side-container relative w-full aspect-[1.6/1] rounded-3xl p-5 sm:p-7 shadow-2xl border-2 bg-gradient-to-br ${themeStyle.backGradient} text-white flex flex-col justify-between overflow-hidden ring-1 ring-white/10`}
                style={{ borderColor: themeStyle.accent }}
              >
                {/* Magnetic Stripe Strip Emulation */}
                {(cardConfig.show_magnetic_strip !== 0 && cardConfig.show_magnetic_strip !== false) && (
                  <div className="absolute top-5 inset-x-0 h-10 sm:h-12 bg-black border-y border-slate-800 shadow-inner flex items-center px-6">
                    <div className="w-full flex items-center justify-between opacity-30 text-[8px] font-mono tracking-widest text-slate-400">
                      <span className="truncate">{cardConfig.security_strip_text || 'DARUN DONORS DIGITAL SECURITY STRIP • VERIFIED VOLUNTARY REGISTRY'}</span>
                    </div>
                  </div>
                )}

                {/* Middle Content: QR Verification + Terms & Conditions */}
                <div className={`${(cardConfig.show_magnetic_strip !== 0 && cardConfig.show_magnetic_strip !== false) ? 'mt-12 sm:mt-14' : 'mt-4 sm:mt-6'} flex items-center gap-4 relative z-10 my-auto`}>

                  {/* Verified QR Code Card */}
                  {showQrOnCard && (
                    <div className="w-24 sm:w-28 shrink-0 p-2 rounded-2xl bg-white text-slate-900 shadow-lg flex flex-col items-center justify-center space-y-1">
                      <img
                        src={qrImageSrc}
                        alt="Verification QR"
                        className="w-18 h-18 sm:w-22 sm:h-22 object-contain rounded-lg"
                        loading="lazy"
                      />
                      <span className="text-[7px] sm:text-[8px] font-mono font-bold tracking-tight text-slate-700">
                        {cardConfig.qr_label || 'SCAN TO VERIFY'}
                      </span>
                    </div>
                  )}

                  {/* Terms & Recognition text */}
                  <div className="space-y-1.5 text-left min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-amber-400">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <h4 className="text-xs font-black uppercase tracking-wider">
                        {cardConfig.back_guidelines_title || (language === 'bn' ? 'ব্যবহারবিধি ও পার্টনার সুবিধা' : 'Guidelines & Partner Benefits')}
                      </h4>
                    </div>

                    <p className="text-[9px] sm:text-[10px] text-slate-300 leading-relaxed font-normal whitespace-pre-line line-clamp-4">
                      {cardConfig.back_terms || '1. Non-transferable voluntary donor identity.\n2. Present this card or QR code to claim partner benefits.\n3. Clinical cooldown of 90 days applies between whole blood donations.\n4. Always verify medical eligibility before transfusion.'}
                    </p>

                    <div className="pt-1.5 flex items-center justify-between border-t border-slate-800 text-[8px] text-slate-400">
                      <span className="text-slate-300">
                        {cardConfig.issued_by_label ? `${cardConfig.issued_by_label} ` : 'Issued by: '}<strong className="text-white">{cardConfig.issue_org || ''}</strong>
                      </span>
                      <span className="font-bold text-amber-400">
                        {cardConfig.authorized_signatory_title || ''}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Back Footer Sponsor Strip */}
                <div className="relative z-10 pt-2 border-t border-slate-800">
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Tag className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="text-[9px] sm:text-[10px] font-bold text-amber-300 truncate">
                        {offers.length > 0
                          ? `${offers[0].sponsor_name}: ${offers[0].discount_text} (${offers[0].title})`
                          : (cardConfig.footer_sponsor_text || 'Partner discounts valid at recognized diagnostic centers and clinics.')
                        }
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOffersTab(true)}
                      className="text-[9px] sm:text-[10px] font-extrabold text-white bg-amber-600 hover:bg-amber-500 px-2 py-0.5 rounded-lg transition-colors shrink-0 cursor-pointer"
                    >
                      {language === 'bn' ? 'সব দেখুন' : 'View All'}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ============================================================== */}
        {/* PRINT ONLY: CLEAN DUAL-SIDED (FRONT & BACK) FOR PDF & PRINT    */}
        {/* ============================================================== */}
        <div className="donor-card-print-container hidden print:flex flex-col items-center gap-8 w-full">
          {/* --- FRONT SIDE FOR PRINT --- */}
          <div
            className={`donor-card-print-item relative w-full aspect-[1.58/1] rounded-3xl p-6 border-2 bg-gradient-to-br ${themeStyle.frontGradient} text-white flex flex-col justify-between overflow-hidden`}
            style={{ borderColor: themeStyle.accent }}
          >
            {/* Top Accent Ribbon */}
            <div className={`absolute top-0 inset-x-8 h-1.5 bg-gradient-to-r ${themeStyle.ribbonGradient} rounded-b-md opacity-90`} />

            {/* Top Row: Logo & Brand Header */}
            <div className="flex items-center justify-between relative z-10 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-white p-1.5 border border-white/20 flex items-center justify-center shrink-0">
                  <img src="/logo.png" alt="Darun Donors Logo" className="w-full h-full object-contain" />
                </div>
                <div className="text-left space-y-0.5 min-w-0">
                  <h3 className="text-xl font-black tracking-wide uppercase text-white truncate">
                    {cardConfig.card_title || 'DARUN DONORS'}
                  </h3>
                  <span className="text-xs text-slate-300 font-semibold block tracking-wide truncate">
                    {cardConfig.card_subtitle || 'Sylhet Emergency Blood Network'}
                  </span>
                </div>
              </div>

              {/* Top Right Lifesaver Seal */}
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${themeStyle.badgeBg} border shrink-0`}>
                <Award className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-xs font-black tracking-wider uppercase">
                  {cardConfig.badge_text || 'Life Saver'}
                </span>
              </div>
            </div>

            {/* Middle Row: Name, ID, Blood Group Crest */}
            <div className="flex items-center justify-between gap-4 my-auto py-2 relative z-10">
              <div className="space-y-1 min-w-0 pr-2">
                <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block">
                  {cardConfig.front_tag_label || 'Registered Life Saver'}
                </span>
                <h2 className="text-2xl font-black text-white tracking-tight truncate">
                  {donor.name}
                </h2>
                <div className="flex items-center gap-2 font-mono text-xs text-sky-400 font-bold">
                  <span>ID: {cardId}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    {cardConfig.verified_status_text || 'Verified Voluntary Donor'}
                  </span>
                </div>
              </div>

              {/* Blood Group Emblem */}
              <div className="relative shrink-0 flex items-center justify-center">
                <div className={`w-18 h-18 rounded-2xl bg-gradient-to-br ${themeStyle.crestGradient} border-2 flex flex-col items-center justify-center text-white ring-4 ${themeStyle.crestRing}`}>
                  <span className="text-[8px] font-bold uppercase tracking-widest text-white/80">
                    {cardConfig.blood_group_label || 'Group'}
                  </span>
                  <span className="text-3xl font-black leading-none mt-0.5 tracking-tight">
                    {donor.blood_group}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Row: 3-column stats & hotline */}
            <div className="relative z-10 pt-2 border-t border-slate-800">
              <div className="grid grid-cols-3 gap-3 text-left">
                <div className="min-w-0">
                  <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">
                    {cardConfig.district_label || 'District / Area'}
                  </span>
                  <strong className="text-sm font-bold text-slate-200 block truncate">
                    {donor.area || 'Sylhet'}
                  </strong>
                </div>

                <div className="min-w-0">
                  <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">
                    {cardConfig.donations_label || 'Total Donations'}
                  </span>
                  <strong className="text-sm font-bold text-amber-400 block truncate">
                    {t('timesUnit', { count: donor.total_donations || 1 })}
                  </strong>
                </div>

                <div className="min-w-0">
                  <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">
                    {cardConfig.valid_thru_label || 'Valid Thru'}
                  </span>
                  <strong className="text-sm font-bold text-sky-300 block truncate font-mono">
                    12/{expiryYear}
                  </strong>
                </div>
              </div>

              <div className="mt-2.5 pt-1.5 flex items-center justify-between text-[9px] text-slate-400 border-t border-slate-800/60">
                <span className="truncate pr-2">
                  {cardConfig.front_notes || 'Verified voluntary blood donor dedicated to saving human lives.'}
                </span>
                <span className="font-mono text-amber-400 shrink-0 font-bold">
                  HOTLINE: {cardConfig.emergency_hotline || '+880 1700-000000'}
                </span>
              </div>
            </div>
          </div>

          {/* --- BACK SIDE FOR PRINT --- */}
          <div
            className={`donor-card-print-item relative w-full aspect-[1.58/1] rounded-3xl p-6 border-2 bg-gradient-to-br ${themeStyle.backGradient} text-white flex flex-col justify-between overflow-hidden`}
            style={{ borderColor: themeStyle.accent }}
          >
            {/* Magnetic Stripe Strip Emulation */}
            {(cardConfig.show_magnetic_strip !== 0 && cardConfig.show_magnetic_strip !== false) && (
              <div className="absolute top-5 inset-x-0 h-10 bg-black border-y border-slate-800 flex items-center px-6">
                <div className="w-full flex items-center justify-between opacity-40 text-[8px] font-mono tracking-widest text-slate-400">
                  <span className="truncate">{cardConfig.security_strip_text || 'DARUN DONORS DIGITAL SECURITY STRIP • VERIFIED VOLUNTARY REGISTRY'}</span>
                </div>
              </div>
            )}

            {/* Middle Content: QR Verification + Terms & Conditions */}
            <div className={`${(cardConfig.show_magnetic_strip !== 0 && cardConfig.show_magnetic_strip !== false) ? 'mt-12' : 'mt-4'} flex items-center gap-4 relative z-10 my-auto`}>
              {showQrOnCard && (
                <div className="w-24 shrink-0 p-2 rounded-2xl bg-white text-slate-900 shadow-md flex flex-col items-center justify-center space-y-1">
                  <img
                    src={qrImageSrc}
                    alt="Verification QR"
                    className="w-20 h-20 object-contain rounded-lg"
                  />
                  <span className="text-[7px] font-mono font-bold tracking-tight text-slate-700">
                    {cardConfig.qr_label || 'SCAN TO VERIFY'}
                  </span>
                </div>
              )}

              <div className="space-y-1.5 text-left min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-amber-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <h4 className="text-xs font-black uppercase tracking-wider">
                    {cardConfig.back_guidelines_title || (language === 'bn' ? 'ব্যবহারবিধি ও পার্টনার সুবিধা' : 'Guidelines & Partner Benefits')}
                  </h4>
                </div>

                <p className="text-[10px] text-slate-300 leading-relaxed font-normal whitespace-pre-line">
                  {cardConfig.back_terms || '1. Non-transferable voluntary donor identity.\n2. Present this card or QR code to claim partner benefits.\n3. Clinical cooldown of 90 days applies between whole blood donations.\n4. Always verify medical eligibility before transfusion.'}
                </p>

                <div className="pt-1.5 flex items-center justify-between border-t border-slate-800 text-[9px] text-slate-400">
                  <span className="text-slate-300">
                    {cardConfig.issued_by_label ? `${cardConfig.issued_by_label} ` : 'Issued by: '}<strong className="text-white">{cardConfig.issue_org || ''}</strong>
                  </span>
                  <span className="font-bold text-amber-400">
                    {cardConfig.authorized_signatory_title || ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Back Footer Sponsor Strip */}
            <div className="relative z-10 pt-2 border-t border-slate-800">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Tag className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-[10px] font-bold text-amber-300 truncate">
                    {offers.length > 0
                      ? `${offers[0].sponsor_name}: ${offers[0].discount_text} (${offers[0].title})`
                      : (cardConfig.footer_sponsor_text || 'Partner discounts valid at recognized diagnostic centers and clinics in Sylhet.')
                    }
                  </span>
                </div>
                <span className="text-[9px] font-bold text-amber-400/90 font-mono">
                  PARTNER PRIVILEGES
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* SPONSORSHIP OFFERS DRAWER (INTERACTIVE BENEFIT CARDS)           */}
        {/* ============================================================== */}
        {offersTab && (
          <div className="donor-card-screen-only glass-panel p-4 rounded-2xl border border-amber-500/30 bg-slate-900/90 space-y-3 animate-fade-in text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-white">
                    {language === 'bn' ? 'রক্তদাতাদের জন্য পার্টনার ও স্পন্সরশিপ অফার' : 'Exclusive Donor Sponsorship Offers'}
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    {language === 'bn'
                      ? 'এই কার্ড প্রদর্শন করে নিচের পার্টনার প্রতিষ্ঠানগুলো থেকে বিশেষ ছাড় ও সেবা গ্রহণ করুন।'
                      : 'Show this digital donor card at partner locations to redeem verified privileges.'
                    }
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOffersTab(false)}
                className="text-xs text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {offers.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">
                {language === 'bn' ? 'বর্তমানে কোনো সক্রিয় অফার নেই।' : 'No active sponsor offers currently listed.'}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {offers.map((off) => (
                  <div key={off.id} className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                          {off.sponsor_name}
                        </span>
                        <h5 className="text-xs font-black text-white truncate">
                          {off.title}
                        </h5>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black shrink-0">
                        {off.discount_text}
                      </span>
                    </div>

                    {off.description && (
                      <p className="text-[10px] text-slate-300 line-clamp-2">
                        {off.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-slate-700/50 text-[10px]">
                      <span className="text-slate-400">
                        Valid: <strong className="text-slate-200">{off.valid_until || 'Ongoing'}</strong>
                      </span>

                      {off.promo_code ? (
                        <button
                          type="button"
                          onClick={() => copyPromoCode(off.promo_code)}
                          className="flex items-center gap-1 font-mono font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded transition-colors cursor-pointer"
                          title="Copy Promo Code"
                        >
                          {copiedCode === off.promo_code ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>{off.promo_code}</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-emerald-400 font-semibold">Present Card</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons Toolbar (Download PNG & Print/Save PDF) */}
        <div className="donor-card-screen-only flex flex-wrap gap-2.5 justify-center items-center print:hidden">
          <button
            type="button"
            onClick={handleDownloadCardImage}
            disabled={isDownloading}
            className="px-5 py-2.5 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-600 text-white font-extrabold rounded-2xl text-xs sm:text-sm shadow-lg shadow-red-600/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isDownloading ? (
              <>
                <Clock className="w-4 h-4 animate-spin" />
                <span>Exporting Card...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download {activeSide === 'front' ? 'Front Side' : 'Back Side'} (PNG)</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handlePrintCard}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-extrabold rounded-2xl text-xs sm:text-sm shadow-md border border-slate-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Print / Save as PDF</span>
          </button>
        </div>

      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
