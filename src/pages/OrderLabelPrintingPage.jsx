import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import API_BASE_URL from '../services/apiConfig';
import bwipjs from '@bwip-js/browser';
import {
  cleanModelDisplayName,
  formatOrderDisplayParcaNo,
  getOrderHeaders,
  getSizeMatrixForOrder,
  ProductionMatrixTable,
  calculateOrderSizeBreakdown,
  getAllAvailableSizes,
  isNumericSizeOrder,
  isAltBedenGarment,
  SIZE_TEXT_TO_NUM_MALE,
  SIZE_TEXT_TO_NUM_FEMALE,
  STANDARD_LETTER_SIZES,
  STANDARD_NUMERIC_SIZES
} from './OrdersPage';

// Crisp dynamic barcode & QR renderer using bwip-js
const BarcodePreviewCanvas = ({ barcode, template = 'QR', height = 65 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const cleanText = String(barcode || 'PVOG1000').trim();
    try {
      if (template === 'QR') {
        bwipjs.toCanvas(canvas, {
          bcid: 'qrcode',
          text: cleanText,
          scale: 3,
          includetext: false
        });
      } else {
        bwipjs.toCanvas(canvas, {
          bcid: 'code128',
          text: cleanText,
          scale: 2,
          height: 14,
          includetext: true,
          textsize: 10
        });
      }
    } catch (e) {
      // canvas preview ignore
    }
  }, [barcode, template]);

  return (
    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <canvas 
        ref={canvasRef} 
        style={{ 
          maxWidth: '100%', 
          maxHeight: `${height}px`, 
          display: 'block', 
          margin: '0 auto',
          borderRadius: '4px'
        }} 
      />
      <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.35rem', fontWeight: '800', letterSpacing: '0.5px' }}>
        {template === 'QR' ? '🔲 2D QR KAREKOD' : '🏷️ 1D ÇİZGİLİ BARKOD (CODE 128 / EAN)'}
      </div>
    </div>
  );
};

// Akıllı Başlık Temizleme (Parantez içi notları, ek kalıp/model ibarelerini ve cinsiyetleri temizler)
export const smartCleanTitle = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text
    // 0. Parantez içindeki ek notları temizle: "(TEKNİSYEN MODELİ)", "(DİZE ELYAF KONULACAK)" vb.
    .replace(/\s*\([^)]*\)/gu, '')
    // 0b. Başka markaların model/kalıp ibarelerini temizle: "VOLVO MODELİ" vb.
    .replace(/(?:VOLVO|FORD|RENAULT|FIAT|MERCEDES|BMW|AUDI|VW|VOLKSWAGEN)\s+MODEL[İIıiA-Za-z]*/gui, '')
    // 1. Cinsiyet kelimelerini ve eklerini temizle
    .replace(/[\s\-_/]*(?:BAY\s*[\/&\-]\s*BAYAN|BAY\s+BAYAN|BAYAN\s*[\/&\-]\s*BAY|ERKEK\s*[\/&\-]\s*KADIN|ERKEK\s+VE\s+BAYAN|ERKEK\s+VE\s+KADIN|ERKEK\s+KADIN|KADIN\s*[\/&\-]\s*ERKEK|ERKEK\s*[\/&\-]\s*BAYAN|ERKEK\s+BAYAN|BAY\s*[\/&\-]\s*BAY)[\s\-_/]*/gui, ' ')
    .replace(/(?:ERKEK|BAYAN|BAY|KADIN)\s*MODEL[İIıiA-Za-z]*/gui, ' ')
    .replace(/\b(?:BAYAN|BAY|ERKEK|KADIN)\b/gui, ' ')
    // 2. Fazlalık tire, slaş ve boşlukları temizle
    .replace(/[\/\-]\s*$/gu, '')
    .replace(/^\s*[\/\-]/gu, '')
    .replace(/\s{2,}/gu, ' ')
    .trim() || text.trim();
};

// Helper to resolve gender-specific base SKU for VW, Skoda, Audi, Seat, Cupra
export const resolveGenderSpecificSku = (rawSku, gender) => {
  if (!rawSku) return '';
  const cleanG = (gender || '').toString().trim().toUpperCase().includes('KADIN') || (gender || '').toString().trim().toUpperCase().includes('BAYAN') ? 'KADIN' : 'ERKEK';
  let str = String(rawSku).trim();

  // Normalize VW 3-zero typo (e.g. PVWK1000102 -> PVWK100102, PVWK1000103 -> PVWK100103)
  if (/^PVWK1000(10[2-7])/i.test(str)) {
    str = str.replace(/^PVWK1000(10[2-7])/i, 'PVWK100$1');
  }

  if (cleanG === 'KADIN') {
    const kMatch = str.match(/KADIN\s*:\s*([A-Za-z0-9_-]+)/i);
    if (kMatch) return kMatch[1].trim();
    if (/^PVWK1000?102/i.test(str)) return str.replace(/^PVWK1000?102/i, 'PVWK100103');
    if (/^PVWK1000?106/i.test(str)) return str.replace(/^PVWK1000?106/i, 'PVWK100107');
    if (/^PVWK1000?104/i.test(str)) return str.replace(/^PVWK1000?104/i, 'PVWK100105');
    if (str.startsWith('PVWK100013')) return str.replace(/^PVWK100013/i, 'PVWK100028');
    if (str.startsWith('PVWK100009')) return str.replace(/^PVWK100009/i, 'PVWK100010');
    if (str.startsWith('PVWK10009')) return str.replace(/^PVWK10009/i, 'PVWK10010');
    if (str.startsWith('PVWB260013')) return str.replace(/^PVWB260013/i, 'PVWB260012');
    if (str.startsWith('PVWB260017')) return str.replace(/^PVWB260017/i, 'PVWB250007');
    if (str.startsWith('PVWT250001')) return str.replace(/^PVWT250001/i, 'PVWT250003');
    if (str.startsWith('PVWK200088')) return str.replace(/^PVWK200088/i, 'PVWK200089');
    if (str.startsWith('PVWK200059')) return str.replace(/^PVWK200059/i, 'PVWK200069');
    if (str.startsWith('PVWK200005')) return str.replace(/^PVWK200005/i, 'PVWK200028');
    if (str.startsWith('PVWK200074')) return str.replace(/^PVWK200074/i, 'PVWK200073');
    if (str.startsWith('PVWK200070')) return str.replace(/^PVWK200070/i, 'PVWK200068');
    if (str.startsWith('PVWK200003')) return str.replace(/^PVWK200003/i, 'PVWK200026');
    if (str.startsWith('PVWT260006')) return str.replace(/^PVWT260006/i, 'PVWT260005');
    if (str.startsWith('PVWK100108')) return str.replace(/^PVWK100108/i, 'PVWK100109');
    if (str.startsWith('PVWK100079')) return str.replace(/^PVWK100079/i, 'PVWK100084');
    if (str.startsWith('PVWK100110')) return str.replace(/^PVWK100110/i, 'PVWK100111');
    if (str.startsWith('PVWK100058')) return str.replace(/^PVWK100058/i, 'PVWK100097');
    if (str.startsWith('PSKD100025')) return str.replace(/^PSKD100025/i, 'PSKD100026');
    if (str.startsWith('PSKD100041')) return str.replace(/^PSKD100041/i, 'PSKD100042');
    if (str.startsWith('PSKD100052')) return str.replace(/^PSKD100052/i, 'PSKD100053');
    if (str.startsWith('PSKD100050')) return str.replace(/^PSKD100050/i, 'PSKD100051');
    if (str.startsWith('PSKD200032')) return str.replace(/^PSKD200032/i, 'PSKD200033');
    if (str.startsWith('PSKD200038')) return str.replace(/^PSKD200038/i, 'PSKD200039');
    if (str.startsWith('PAUDI250012')) return str.replace(/^PAUDI250012/i, 'PAUDI250013');
    if (str.startsWith('PAUDI250018')) return str.replace(/^PAUDI250018/i, 'PAUDI250019');
    if (str.startsWith('PAUDI250014')) return str.replace(/^PAUDI250014/i, 'PAUDI250015');
    if (str.startsWith('PAUDI4242')) return str.replace(/^PAUDI4242/i, 'PAUDI4444');
    if (str.startsWith('PAUDI3538')) return str.replace(/^PAUDI3538/i, 'PAUDI3539');
    if (str.startsWith('PAUDI3003')) return str.replace(/^PAUDI3003/i, 'PAUDI3005');
  } else {
    const eMatch = str.match(/(?:ERKEK|BAY)\s*:\s*([A-Za-z0-9_-]+)/i);
    if (eMatch) return eMatch[1].trim();
    if (/^PVWK1000?103/i.test(str)) return str.replace(/^PVWK1000?103/i, 'PVWK100102');
    if (/^PVWK1000?107/i.test(str)) return str.replace(/^PVWK1000?107/i, 'PVWK100106');
    if (/^PVWK1000?105/i.test(str)) return str.replace(/^PVWK1000?105/i, 'PVWK100104');
    if (str.startsWith('PVWK100028')) return str.replace(/^PVWK100028/i, 'PVWK100013');
    if (/^PVWK100010(?![0-9])/i.test(str)) return str.replace(/^PVWK100010/i, 'PVWK100009');
    if (/^PVWK10010(?![0-9])/i.test(str)) return str.replace(/^PVWK10010/i, 'PVWK10009');
    if (str.startsWith('PVWB260012')) return str.replace(/^PVWB260012/i, 'PVWB260013');
    if (str.startsWith('PVWB250007')) return str.replace(/^PVWB250007/i, 'PVWB260017');
    if (str.startsWith('PVWT250003')) return str.replace(/^PVWT250003/i, 'PVWT250001');
    if (str.startsWith('PVWK200089')) return str.replace(/^PVWK200089/i, 'PVWK200088');
    if (str.startsWith('PVWK200069')) return str.replace(/^PVWK200069/i, 'PVWK200059');
    if (str.startsWith('PVWK200028')) return str.replace(/^PVWK200028/i, 'PVWK200005');
    if (str.startsWith('PVWK200073')) return str.replace(/^PVWK200073/i, 'PVWK200074');
    if (str.startsWith('PVWK200068')) return str.replace(/^PVWK200068/i, 'PVWK200070');
    if (str.startsWith('PVWK200026')) return str.replace(/^PVWK200026/i, 'PVWK200003');
    if (str.startsWith('PVWT260005')) return str.replace(/^PVWT260005/i, 'PVWT260006');
    if (str.startsWith('PVWK100109')) return str.replace(/^PVWK100109/i, 'PVWK100108');
    if (str.startsWith('PVWK100084')) return str.replace(/^PVWK100084/i, 'PVWK100079');
    if (str.startsWith('PVWK100111')) return str.replace(/^PVWK100111/i, 'PVWK100110');
    if (str.startsWith('PVWK100097')) return str.replace(/^PVWK100097/i, 'PVWK100058');
    if (str.startsWith('PSKD100026')) return str.replace(/^PSKD100026/i, 'PSKD100025');
    if (str.startsWith('PSKD100042')) return str.replace(/^PSKD100042/i, 'PSKD100041');
    if (str.startsWith('PSKD100053')) return str.replace(/^PSKD100053/i, 'PSKD100052');
    if (str.startsWith('PSKD100051')) return str.replace(/^PSKD100051/i, 'PSKD100050');
    if (str.startsWith('PSKD200033')) return str.replace(/^PSKD200033/i, 'PSKD200032');
    if (str.startsWith('PSKD200039')) return str.replace(/^PSKD200039/i, 'PSKD200038');
    if (str.startsWith('PAUDI250013')) return str.replace(/^PAUDI250013/i, 'PAUDI250012');
    if (str.startsWith('PAUDI250019')) return str.replace(/^PAUDI250019/i, 'PAUDI250018');
    if (str.startsWith('PAUDI250015')) return str.replace(/^PAUDI250015/i, 'PAUDI250014');
    if (str.startsWith('PAUDI4444')) return str.replace(/^PAUDI4444/i, 'PAUDI4242');
    if (str.startsWith('PAUDI3539')) return str.replace(/^PAUDI3539/i, 'PAUDI3538');
    if (str.startsWith('PAUDI3005')) return str.replace(/^PAUDI3005/i, 'PAUDI3003');
  }
  return str;
};

// Helper for clean base SKU extraction
export const cleanBaseProductSku = (sku) => {
  if (!sku) return '';
  let str = String(sku).trim();
  str = str.replace(/^(?:ERKEK|BAY):\s*([^-]+)\s*-\s*(?:KADIN|BAYAN):\s*(.+)$/i, '$1').trim();
  if (/^SCKY(?!20000)\d{5}$/i.test(str)) return str.slice(0, 7);

  // 1. Strip hyphen/separated sizes first (e.g. -4XL, -2XL, -M, _3XL, -STD)
  const strippedSeparated = str.replace(/[-_](?:X{1,14}L|[2-9]XL|XXS|XS|XXL|XL|[SML]|STD|\d{2})$/i, '').trim();
  if (strippedSeparated !== str && strippedSeparated.length >= 3) return strippedSeparated;

  // 2. Strip direct letter sizes without corrupting digits at end:
  // Repeated X's before L (XXL, XXXL, XXXXL... or XXS, XS, STD)
  const strippedRepeated = str.replace(/(?:X{2,14}L|XXS|XS|STD)$/i, '').trim();
  if (strippedRepeated !== str && strippedRepeated.length >= 3) return strippedRepeated;

  // Direct extra size (e.g. PVWK1001024XL -> PVWK100102): ONLY if preceded by at least 6 digits!
  const strippedExtraXl = str.replace(/^([A-Z0-9]*\D\d{6,8})[2-9]XL$/i, '$1').trim();
  if (strippedExtraXl !== str) return strippedExtraXl;

  // Direct single letter size (S, M, L, XL) - DO NOT treat preceding digit as size!
  const strippedDirectLetter = str.replace(/(?:XL|[SML])$/i, '').trim();
  if (strippedDirectLetter !== str && strippedDirectLetter.length >= 3) return strippedDirectLetter;

  // Strip VW 2-digit direct numeric size at end (e.g. PVWT26000448 -> PVWT260004, PVWT25000750 -> PVWT250007, PVWK10008846 -> PVWK100088)
  const strippedVwNum = str.replace(/^(P[A-Z0-9]*VW[A-Z0-9]*\d{6,8})(?:3[2-9]|[4-5]\d|6[0-2])$/i, '$1').trim();
  if (strippedVwNum !== str) return strippedVwNum;

  // Strip Audi 2-digit direct numeric size at end (e.g. PAUDI25001638 -> PAUDI250016)
  const strippedAudiNum = str.replace(/^(PAUDI25\d{4})(?:3[0-9]|[4-5]\d|6[0-2])$/i, '$1').trim();
  if (strippedAudiNum !== str) return strippedAudiNum;

  // Strip Cupra 2-digit direct numeric size at end (e.g. PCUPRA10002742 -> PCUPRA100027)
  const strippedCupraNum = str.replace(/^(PCUPRA\d{6})(?:3[2-9]|[4-5]\d|6[0-2])$/i, '$1').trim();
  if (strippedCupraNum !== str) return strippedCupraNum;

  // Strip separated numeric size at end (e.g. -42, _44, -38)
  const strippedNumeric = str.replace(/[-_](?:3[2-9]|[45]\d|60)$/i, '').trim();
  return strippedNumeric;
};

// Helper to format Volkswagen size suffix (2XL -> XXL, 3XL -> XXXL, or for alt beden pants convert letter to numeric size using gender)
export const formatVwSizeCode = (size, isAlt = false, gender = 'ERKEK') => {
  if (!size) return '';
  const s = String(size).replace(/[^A-Z0-9]/gi, '').toUpperCase();
  if (isAlt) {
    const isFemale = (gender || '').toUpperCase().includes('KADIN') || (gender || '').toUpperCase().includes('BAYAN');
    const textToNum = isFemale ? SIZE_TEXT_TO_NUM_FEMALE : SIZE_TEXT_TO_NUM_MALE;
    if (textToNum[s]) return textToNum[s];
  }
  if (s === '2XL') return 'XXL';
  if (s === '3XL') return 'XXXL';
  return s;
};

// Etiket Üst Başlığı Elle Düzeltme Kutusu (Kullanıcı talebi: İlk satırda yazacak kısmı belirleyebilme)
const LabelTitleEditorBox = ({ customLabelTitle, setCustomLabelTitle, originalName, isLight }) => {
  return (
    <div style={{
      background: isLight ? '#f8fafc' : '#1e293b',
      padding: '0.9rem 1.25rem',
      borderRadius: '12px',
      border: `1.5px solid ${isLight ? '#cbd5e1' : '#334155'}`,
      marginBottom: '1.25rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <label style={{ fontSize: '0.85rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.4rem', color: isLight ? '#0f172a' : '#f8fafc' }}>
          <span>🏷️</span> Etiketin Üst Kısmında (İlk Satır) Basılacak Ürün / Model Başlığı:
        </label>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setCustomLabelTitle(smartCleanTitle(originalName))}
            style={{
              padding: '0.3rem 0.65rem',
              borderRadius: '6px',
              border: `1px solid ${isLight ? '#93c5fd' : '#1e3a8a'}`,
              background: isLight ? '#eff6ff' : 'rgba(59, 130, 246, 0.15)',
              color: '#2563eb',
              fontSize: '0.75rem',
              fontWeight: '800',
              cursor: 'pointer'
            }}
            title="Parantez içi ek notları ve gereksiz modelleri temizler"
          >
            ✨ Otomatik Temizle
          </button>
          <button
            type="button"
            onClick={() => setCustomLabelTitle(originalName || '')}
            style={{
              padding: '0.3rem 0.65rem',
              borderRadius: '6px',
              border: `1px solid ${isLight ? '#cbd5e1' : '#475569'}`,
              background: isLight ? '#ffffff' : '#0f172a',
              color: isLight ? '#64748b' : '#94a3b8',
              fontSize: '0.75rem',
              fontWeight: '700',
              cursor: 'pointer'
            }}
            title="Orijinal ham model adına geri döner"
          >
            ↺ Orijinal Ad
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <input
          type="text"
          id="custom-label-title-input"
          value={customLabelTitle}
          onChange={(e) => setCustomLabelTitle(e.target.value)}
          placeholder="Etiketin ilk satırına basılacak model adı..."
          maxLength={45}
          style={{
            flex: 1,
            padding: '0.65rem 0.9rem',
            borderRadius: '8px',
            border: '2px solid #2563eb',
            fontSize: '0.95rem',
            fontWeight: '800',
            background: isLight ? '#ffffff' : '#0f172a',
            color: isLight ? '#0f172a' : '#f8fafc',
            outline: 'none',
            letterSpacing: '0.3px'
          }}
        />
        <span style={{ fontSize: '0.78rem', color: '#64748b', whiteSpace: 'nowrap', fontWeight: '800' }}>
          {customLabelTitle.length}/45
        </span>
      </div>
      <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.4rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.3rem' }}>
        <span>💡 Elle yazdığınız bu başlık hem etiketin ilk satırında fiziken basılacak hem de aşağıdaki önizlemede anlık görünecektir.</span>
        <span>Maksimum 45 karakter</span>
      </div>
    </div>
  );
};


const OrderLabelPrintingPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { themeMode } = useLanguage();
  const isLight = themeMode === 'light';

  // Core Order Data
  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!order);
  const [errorMsg, setErrorMsg] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Voucher Summary & History
  const [voucherSummary, setVoucherSummary] = useState({
    processed_quantity: 0,
    total_quantity: 0,
    status: 'BEKLEMEDE',
    processed_by_size: {}
  });
  const [vouchersHistory, setVouchersHistory] = useState([]);

  // Active Tab
  const [activeTab, setActiveTab] = useState('planli'); // 'planli' | 'ekstra' | 'matrix' | 'koli' | 'gecmis'

  // Standard Print Mode State (Planlı Basım)
  const [printMode, setPrintMode] = useState('FULL'); // 'FULL' | 'PARTIAL'
  const [sizeTransferInputs, setSizeTransferInputs] = useState({});
  const [selectedGender, setSelectedGender] = useState('Erkek');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantityInput, setQuantityInput] = useState('');
  const [rfidLabelTemplate, setRfidLabelTemplate] = useState('QR');
  const [showAllSizes, setShowAllSizes] = useState(false);
  const [customAddedSizes, setCustomAddedSizes] = useState([]);
  const [newCustomSizeInput, setNewCustomSizeInput] = useState('');

  const handleAddCustomSizeToTab1 = () => {
    const trimmed = (newCustomSizeInput || '').trim().toUpperCase();
    if (!trimmed) return;
    if (!customAddedSizes.includes(trimmed)) {
      setCustomAddedSizes(prev => [...prev, trimmed]);
    }
    setNewCustomSizeInput('');
  };

  // Custom Label Title (Elle düzeltilebilir ilk satır başlığı)
  const [customLabelTitle, setCustomLabelTitle] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Box & Shipping settings
  const [boxNo, setBoxNo] = useState(1);
  const [totalBoxes, setTotalBoxes] = useState(1);

  // Extra / Supplementary Label State (İlave Etiket Basımı)
  const [extraGender, setExtraGender] = useState('Erkek');
  const [extraSizes, setExtraSizes] = useState({});
  const [customSizeName, setCustomSizeName] = useState('');
  const [customSizeQty, setCustomSizeQty] = useState('');
  const [extraReason, setExtraReason] = useState('Defo / Hasarlı Etiket Telafisi');
  const [extraLabelTemplate, setExtraLabelTemplate] = useState('QR');
  const [selectedExtraPreviewBeden, setSelectedExtraPreviewBeden] = useState('');

  // Live Print Progress Tracker State
  const [submitting, setSubmitting] = useState(false);
  const [printJob, setPrintJob] = useState(null);
  const printTickerIntervalRef = useRef(null);

  // Cleanup ticker on unmount and expose test helper
  useEffect(() => {
    window.__setPrintJob = setPrintJob;
    return () => {
      if (printTickerIntervalRef.current) {
        clearInterval(printTickerIntervalRef.current);
      }
      delete window.__setPrintJob;
    };
  }, []);

  // Fetch Order Details
  const fetchOrderDetails = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/detail/${id}`);
      const data = await res.json();
      if (data.success && data.order) {
        setOrder(data.order);
        if (data.voucher_summary) {
          setVoucherSummary(data.voucher_summary);
        }
        if (data.vouchers_history) {
          setVouchersHistory(data.vouchers_history);
        }
      } else {
        setErrorMsg(data.message || 'Sipariş detayları alınamadı.');
      }
    } catch (err) {
      setErrorMsg(`Sunucu hatası: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const targetId = orderId || order?.Id;
    if (targetId) {
      fetchOrderDetails(targetId);
    } else {
      setErrorMsg('Sipariş numarası bulunamadı.');
      setLoading(false);
    }
  }, [orderId]);

  // Model başlığı değiştiğinde veya sipariş yüklendiğinde akıllı başlığı başlat
  useEffect(() => {
    const rawModel = order?.Model || order?.product_name || '';
    if (rawModel) {
      setCustomLabelTitle(prev => prev ? prev : smartCleanTitle(rawModel));
    }
  }, [order?.Id, order?.Model, order?.product_name]);

  // Emergency Stop / Durdurma İşlemi (Hata olduğunda veya operatör durdurmak istediğinde)
  const handleStopPrinting = async () => {
    if (printTickerIntervalRef.current) {
      clearInterval(printTickerIntervalRef.current);
      printTickerIntervalRef.current = null;
    }
    setIsCancelling(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/printer/cancel-print-job`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: order?.Id,
          printer_name: 'SATO CL4NX Plus'
        })
      });
      const data = await res.json();
      setPrintJob(prev => prev ? ({
        ...prev,
        isStopped: true,
        isFinished: true,
        errorMessage: 'Yazdırma işlemi operatör tarafından durduruldu.'
      }) : null);
      setFeedbackMsg({
        type: 'error',
        text: `🛑 Yazdırma işlemi durduruldu! ${data.message || 'Kalan etiketler iptal edildi.'}`
      });
      if (order?.Id) {
        fetchOrderDetails(order.Id);
      }
    } catch (err) {
      setFeedbackMsg({
        type: 'error',
        text: `🛑 Durdurma uyarısı: ${err.message}`
      });
    } finally {
      setIsCancelling(false);
      setSubmitting(false);
    }
  };

  // Derived Calculations
  const totalOrderQty = order?.Adet || order?.quantity || 100;
  const previouslyProcessed = voucherSummary?.processed_quantity || 0;
  const remainingQty = Math.max(0, totalOrderQty - previouslyProcessed);

  // Per-gender statistics & breakdowns
  const genderStats = useMemo(() => {
    if (!order) return { hasMultiple: false, erkekTotal: 0, erkRemaining: 0, kadinTotal: 0, kadRemaining: 0, erkekBreakdown: [], kadinBreakdown: [], available: ['Erkek'] };
    const erkBreakdown = calculateOrderSizeBreakdown(order, voucherSummary, 'Erkek');
    const kadBreakdown = calculateOrderSizeBreakdown(order, voucherSummary, 'Kadın');
    
    const erkekTotal = erkBreakdown.reduce((sum, item) => sum + item.orderQty, 0);
    const erkRemaining = erkBreakdown.reduce((sum, item) => sum + item.remainingQty, 0);

    const kadinTotal = kadBreakdown.reduce((sum, item) => sum + item.orderQty, 0);
    const kadRemaining = kadBreakdown.reduce((sum, item) => sum + item.remainingQty, 0);

    const hasMultiple = erkekTotal > 0 && kadinTotal > 0;
    const available = [];
    if (erkekTotal > 0) available.push('Erkek');
    if (kadinTotal > 0) available.push('Kadın');
    if (available.length === 0) available.push('Erkek');

    return {
      hasMultiple,
      erkekTotal,
      erkRemaining,
      erkekBreakdown: erkBreakdown,
      kadinTotal,
      kadRemaining,
      kadinBreakdown: kadBreakdown,
      available
    };
  }, [order, voucherSummary]);

  // Gender-aware active sizes for currently selected gender
  const activeSizes = useMemo(() => {
    if (!order) return [];
    let list = [];
    if (genderStats.hasMultiple) {
      list = selectedGender === 'Kadın'
        ? calculateOrderSizeBreakdown(order, voucherSummary, 'Kadın', showAllSizes)
        : calculateOrderSizeBreakdown(order, voucherSummary, 'Erkek', showAllSizes);
    } else {
      list = calculateOrderSizeBreakdown(order, voucherSummary, selectedGender, showAllSizes);
    }

    if (customAddedSizes.length > 0) {
      const existingSet = new Set(list.map(it => it.size.toUpperCase()));
      customAddedSizes.forEach(cSz => {
        const up = cSz.trim().toUpperCase();
        if (up && !existingSet.has(up)) {
          list.push({
            size: up,
            orderQty: 0,
            processedQty: 0,
            remainingQty: 0,
            gender: selectedGender || 'Erkek',
            notInOrder: true
          });
        }
      });
    }
    return list;
  }, [order, voucherSummary, selectedGender, genderStats, showAllSizes, customAddedSizes]);

  // Gender-aware active sizes for Extra / Supplementary Label Printing (all sizes available)
  const extraActiveSizes = useMemo(() => {
    if (!order) return [];
    return calculateOrderSizeBreakdown(order, voucherSummary, extraGender, true);
  }, [order, voucherSummary, extraGender]);

  // Selected gender specific remaining count
  const selectedGenderRemaining = useMemo(() => {
    if (genderStats.hasMultiple) {
      return selectedGender === 'Kadın' ? genderStats.kadRemaining : genderStats.erkRemaining;
    }
    return activeSizes.reduce((sum, item) => sum + item.remainingQty, 0);
  }, [genderStats, selectedGender, activeSizes]);

  // Currently inputted or remaining total to print for selected gender
  const currentSelectedTotalToPrint = useMemo(() => {
    const inputs = sizeTransferInputs || {};
    const sum = Object.values(inputs).reduce((a, b) => a + (parseInt(b) || 0), 0);
    return sum > 0 ? sum : selectedGenderRemaining;
  }, [sizeTransferInputs, selectedGenderRemaining]);

  // Fill All Remaining Sizes for currently active gender
  const handleFillAllRemainingSizes = () => {
    const inputs = {};
    activeSizes.forEach(item => {
      inputs[item.size] = item.remainingQty;
    });
    setSizeTransferInputs(inputs);
  };

  // Helper to resolve dynamic SKU & Barcode for Tab 1 live preview based on selectedGender
  const plannedPreviewData = useMemo(() => {
    if (!order) return { sku: '', barcode: '', title: '', baseSku: '' };
    const rawSku = order.ParcaNo || order.Sku || order.sku || '';
    const cleanG = selectedGender === 'Kadın' ? 'KADIN' : 'ERKEK';
    const brand = (order.Marka || order.brand || '').toUpperCase();

    const baseSku = resolveGenderSpecificSku(rawSku, cleanG);
    const isVw = brand.includes('VOLKSWAGEN') || brand === 'VW' || /^P*VW/i.test(baseSku || rawSku);

    let displaySku = baseSku;
    const activeSz = selectedSize ? selectedSize.replace(/^BEDEN\s*/i, '').trim() : '';
    if (isVw && activeSz && activeSz !== 'STD') {
      const cleanBase = cleanBaseProductSku(baseSku);
      const isAlt = isAltBedenGarment(order.Model || order.product_name, brand, activeSz);
      const vwSize = formatVwSizeCode(activeSz, isAlt, cleanG);
      if (!displaySku.toUpperCase().endsWith(vwSize) && !displaySku.toUpperCase().endsWith(activeSz.toUpperCase())) {
        displaySku = `${cleanBase}${vwSize}`.toUpperCase();
      }
    }

    let barcode = (order.Ean13 || order.ean13 || order.Barcode || order.barcode || '').trim();
    if (cleanG === 'KADIN' && (displaySku.startsWith('PSKD100042') || displaySku.includes('100042'))) {
      barcode = '8692456899721';
    } else if (cleanG === 'ERKEK' && (displaySku.startsWith('PSKD100041') || displaySku.includes('100041'))) {
      barcode = '8697616389142';
    }

    return {
      sku: displaySku,
      baseSku: baseSku,
      barcode: barcode || order.Ean13 || '8697616389142',
      title: customLabelTitle || cleanModelDisplayName(order.Model || order.product_name)
    };
  }, [order, selectedGender, selectedSize, customLabelTitle]);

  // Base SKU without trailing size codes for dynamic hints
  const orderBaseSku = useMemo(() => {
    if (!order) return '';
    const raw = (order.ParcaNo || order.Sku || order.sku || formatOrderDisplayParcaNo(order) || '').trim();
    if (!raw || raw === '---') return '';
    return cleanBaseProductSku(raw);
  }, [order]);

  // Active extra size being previewed in Tab 2
  const activeExtraPreviewSize = useMemo(() => {
    if (selectedExtraPreviewBeden) return selectedExtraPreviewBeden;
    const sizeWithQty = Object.entries(extraSizes).find(([_, q]) => parseInt(q) > 0);
    if (sizeWithQty) return sizeWithQty[0];
    if (customSizeName && parseInt(customSizeQty) > 0) return customSizeName.trim().toUpperCase();
    if (extraActiveSizes && extraActiveSizes.length > 0) return extraActiveSizes[0].size || extraActiveSizes[0];
    return 'XS';
  }, [selectedExtraPreviewBeden, extraSizes, customSizeName, customSizeQty, extraActiveSizes]);

  // Helper to resolve dynamic SKU & Barcode for Tab 2 (Ekstra) preview
  const previewResolvedData = useMemo(() => {
    if (!order) return { sku: '', barcode: '', brand: 'GENEL', baseSku: '', previewSize: '' };
    const brand = (order.Marka || order.brand || '').toUpperCase();
    const rawSku = order.ParcaNo || order.Sku || order.sku || formatOrderDisplayParcaNo(order) || '';
    const cleanG = extraGender === 'Kadın' ? 'KADIN' : 'ERKEK';

    const baseSku = resolveGenderSpecificSku(rawSku, cleanG);
    const isVw = brand.includes('VOLKSWAGEN') || brand === 'VW' || /^P*VW/i.test(baseSku || rawSku);

    let displaySku = baseSku;
    if (isVw && activeExtraPreviewSize && activeExtraPreviewSize !== 'STD') {
      const cleanBase = cleanBaseProductSku(baseSku);
      const isAlt = isAltBedenGarment(order.Model || order.product_name, brand, activeExtraPreviewSize);
      const vwSize = formatVwSizeCode(activeExtraPreviewSize, isAlt, cleanG);
      if (!displaySku.toUpperCase().endsWith(vwSize) && !displaySku.toUpperCase().endsWith(activeExtraPreviewSize.toUpperCase())) {
        displaySku = `${cleanBase}${vwSize}`.toUpperCase();
      }
    }

    let barcode = (order.Ean13 || order.ean13 || order.Barcode || order.barcode || '').trim();
    if (cleanG === 'KADIN' && (displaySku.startsWith('PSKD100042') || displaySku.includes('100042'))) {
      barcode = '8692456899721';
    } else if (cleanG === 'ERKEK' && (displaySku.startsWith('PSKD100041') || displaySku.includes('100041'))) {
      barcode = '8697616389142';
    }

    return { 
      sku: displaySku || 'PVOG' + (order.Id || ''), 
      baseSku: baseSku,
      previewSize: activeExtraPreviewSize,
      barcode: barcode || order.Ean13 || '', 
      brand 
    };
  }, [order, extraGender, activeExtraPreviewSize]);

  // Start Live Ticker
  const startLivePrintTicker = (tags, tagItems, summary) => {
    const total = tags.length;
    if (total === 0) return;

    if (printTickerIntervalRef.current) {
      clearInterval(printTickerIntervalRef.current);
    }

    const initialItem = (tagItems && tagItems[0]) || { epc: tags[0] };

    setPrintJob({
      isActive: true,
      totalLabels: total,
      queuedCount: total,        // 📤 1. KUYRUĞA GİDEN ETİKETLER (QUEUE)
      ejectedCount: 0,           // 🖨️ 2. YAZICIDAN O AN ÇIKAN ETİKET (CANLI ÇIKIŞ)
      printedCount: 0,
      remainingToEject: total,   // YAZICI İÇİNDE KALAN ÇIKACAK
      remainingCount: total,
      progressPercent: 0,
      activeTag: initialItem,
      isFinished: false,
      isStopped: false,
      tagItems: tagItems || tags.map(t => ({ epc: t })),
      tags: tags,
      startTime: new Date().toLocaleTimeString('tr-TR')
    });

    let current = 0;
    // SATO CL4NX Plus RFID Termal Yazıcı Donanım Çıkış Ritmi (~550-650ms/etiket)
    const intervalTime = total > 50 ? 450 : (total > 20 ? 550 : 650);

    printTickerIntervalRef.current = setInterval(() => {
      current++;
      const pct = Math.min(100, Math.round((current / total) * 100));
      const active = (tagItems && tagItems[current - 1]) || (tagItems && tagItems[tagItems.length - 1]) || { epc: tags[current - 1] || tags[0] };

      setPrintJob(prev => ({
        ...prev,
        ejectedCount: current, // Yazıcıdan o an çıkan etiket
        printedCount: current,
        remainingToEject: Math.max(0, total - current),
        remainingCount: Math.max(0, total - current),
        progressPercent: pct,
        activeTag: active,
        isFinished: current >= total
      }));

      if (current >= total) {
        clearInterval(printTickerIntervalRef.current);
        printTickerIntervalRef.current = null;
        if (summary) {
          setVoucherSummary(summary);
        }
        if (order?.Id) {
          fetchOrderDetails(order.Id);
        }
      }
    }, intervalTime);
  };

  // Fast forward ticker
  const handleFastForwardTicker = () => {
    if (printTickerIntervalRef.current) {
      clearInterval(printTickerIntervalRef.current);
      printTickerIntervalRef.current = null;
    }
    if (printJob) {
      const total = printJob.totalLabels;
      const lastTag = (printJob.tagItems && printJob.tagItems[total - 1]) || printJob.activeTag;
      setPrintJob(prev => ({
        ...prev,
        ejectedCount: total,
        printedCount: total,
        remainingToEject: 0,
        remainingCount: 0,
        progressPercent: 100,
        activeTag: lastTag,
        isFinished: true
      }));
      if (order?.Id) {
        fetchOrderDetails(order.Id);
      }
    }
  };

  // 1. Submit Planned RFID Print Job
  const handlePrintPlannedSatoLabels = async (isPrintAllGenders = false) => {
    if (!order) return;
    
    let sizeItemsToSubmit = [];
    if (isPrintAllGenders && genderStats.hasMultiple) {
      const erkItems = genderStats.erkekBreakdown
        .filter(item => item.remainingQty > 0)
        .map(item => ({ size: item.size, quantity: item.remainingQty, gender: 'Erkek' }));
      const kadItems = genderStats.kadinBreakdown
        .filter(item => item.remainingQty > 0)
        .map(item => ({ size: item.size, quantity: item.remainingQty, gender: 'Kadın' }));
      sizeItemsToSubmit = [...erkItems, ...kadItems];
    } else {
      const inputs = sizeTransferInputs || {};
      const hasCustomInputs = Object.values(inputs).some(v => parseInt(v) > 0);

      if (printMode === 'FULL' || !hasCustomInputs) {
        sizeItemsToSubmit = activeSizes.map(item => ({
          size: item.size,
          quantity: item.remainingQty,
          gender: selectedGender || 'Erkek'
        })).filter(item => item.quantity > 0);
      } else {
        const activeMap = new Map(activeSizes.map(item => [item.size, item]));
        sizeItemsToSubmit = [];
        Object.entries(inputs).forEach(([sz, val]) => {
          const q = parseInt(val) || 0;
          if (q > 0) {
            const item = activeMap.get(sz);
            sizeItemsToSubmit.push({
              size: sz,
              quantity: q,
              gender: (item && item.gender) || selectedGender || 'Erkek'
            });
          }
        });

        if (sizeItemsToSubmit.length === 0) {
          const qtyVal = parseInt(quantityInput);
          if (qtyVal > 0) {
            const rawSz = (selectedSize || order.BedenAdi || 'XL').replace(/^BEDEN\s*/i, '').trim() || 'XL';
            sizeItemsToSubmit = [{
              size: rawSz,
              quantity: qtyVal,
              gender: selectedGender || 'Erkek'
            }];
          }
        }
      }
    }

    const totalBatchQty = sizeItemsToSubmit.reduce((sum, item) => sum + item.quantity, 0);
    if (totalBatchQty <= 0) {
      setFeedbackMsg({ type: 'error', text: 'Lütfen basılacak etiketler için en az 1 adet miktar belirleyiniz.' });
      return;
    }

    setSubmitting(true);
    const batchLabel = isPrintAllGenders ? 'Tüm Karışık (Erkek + Kadın)' : `${selectedGender.toUpperCase()}`;
    setFeedbackMsg({ type: 'info', text: `⏳ SATO CL4NX Plus yazıcıya ${totalBatchQty} adet planlı ${batchLabel} RFID etiket ve EPC kodlama emri gönderiliyor...` });

    try {
      const rawSkuCandidate = order.ParcaNo || order.Code39 || order.Sku || order.sku || order.code39 || order.Detay1 || order.Not || '';
      const cleanOrderSku = rawSkuCandidate || `PVOG${order.Id}`;
      
      const actualBarcode = 
        (order.Ean13 && /^\d{8,14}$/.test(String(order.Ean13).trim()) ? String(order.Ean13).trim() : null) ||
        (order.ean13 && /^\d{8,14}$/.test(String(order.ean13).trim()) ? String(order.ean13).trim() : null) ||
        (order.Detay2 && /^\d{8,14}$/.test(String(order.Detay2).trim()) ? String(order.Detay2).trim() : null) ||
        (order.Barcode && /^\d{8,14}$/.test(String(order.Barcode).trim()) ? String(order.Barcode).trim() : null) ||
        (order.barcode && /^\d{8,14}$/.test(String(order.barcode).trim()) ? String(order.barcode).trim() : null) ||
        '';

      const payload = {
        order_id: order.Id || order.id || order.order_number,
        items: sizeItemsToSubmit,
        product_name: order.Model || order.product_name || '',
        custom_title: customLabelTitle || undefined,
        sku: cleanOrderSku,
        brand: order.Marka || order.brand || 'GENEL',
        gender: selectedGender || 'Erkek',
        detail1: `${cleanOrderSku} - ${customLabelTitle || order.Model || order.product_name || ''}`,
        detail2: order.MusteriAdi || order.sub_customer_name || '',
        barcode: actualBarcode || cleanOrderSku,
        total_boxes: totalBoxes,
        box_no: boxNo,
        label_template: rfidLabelTemplate
      };

      const res = await fetch(`${API_BASE_URL}/api/printer/print-order-rfid-labels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        setFeedbackMsg({ type: 'success', text: `✅ ${data.message}` });
        startLivePrintTicker(data.tags || [], data.tag_items || [], data.summary);
        setSizeTransferInputs({});
      } else {
        setFeedbackMsg({ type: 'error', text: data.error || data.message || 'Yazıcıya gönderilirken bir hata oluştu.' });
      }
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: `Yazıcı Hatası: ${err.message}` });
    } finally {
      setSubmitting(false);
    }
  };

  // 2. Submit Extra / Supplementary Label Print Job
  const handlePrintExtraLabels = async () => {
    if (!order) return;

    // Collect extra size items
    const items = [];
    Object.entries(extraSizes).forEach(([sz, qty]) => {
      const q = parseInt(qty) || 0;
      if (q > 0) {
        items.push({
          size: sz,
          quantity: q,
          gender: extraGender
        });
      }
    });

    if (customSizeName && parseInt(customSizeQty) > 0) {
      items.push({
        size: customSizeName.trim().toUpperCase(),
        quantity: parseInt(customSizeQty),
        gender: extraGender
      });
    }

    const totalBatchQty = items.reduce((sum, item) => sum + item.quantity, 0);
    if (totalBatchQty <= 0) {
      setFeedbackMsg({ type: 'error', text: 'Lütfen ilave basılacak en az bir beden için adet belirleyiniz.' });
      return;
    }

    setSubmitting(true);
    setFeedbackMsg({ type: 'info', text: `⏳ SATO CL4NX Plus yazıcıya ${totalBatchQty} adet İLAVE etiket emri gönderiliyor (${extraGender} - ${extraReason})...` });

    try {
      const rawSkuCandidate = previewResolvedData.baseSku || order.ParcaNo || order.Code39 || order.Sku || order.sku || '';
      const cleanOrderSku = rawSkuCandidate || `PVOG${order.Id}`;

      const actualBarcode = 
        (order.Ean13 && /^\d{8,14}$/.test(String(order.Ean13).trim()) ? String(order.Ean13).trim() : null) ||
        (order.ean13 && /^\d{8,14}$/.test(String(order.ean13).trim()) ? String(order.ean13).trim() : null) ||
        '';

      const payload = {
        order_id: order.Id,
        items: items,
        product_name: order.Model || order.product_name || '',
        custom_title: customLabelTitle || undefined,
        sku: cleanOrderSku,
        brand: order.Marka || order.brand || 'GENEL',
        gender: extraGender,
        detail1: `İLAVE BASIM: ${extraReason} - ${customLabelTitle || order.Model || order.product_name || ''}`,
        detail2: order.MusteriAdi || '',
        barcode: actualBarcode || cleanOrderSku,
        total_boxes: totalBoxes,
        box_no: boxNo,
        label_template: extraLabelTemplate,
        is_extra: true,
        extra_reason: extraReason
      };

      const res = await fetch(`${API_BASE_URL}/api/printer/print-order-rfid-labels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        setFeedbackMsg({ type: 'success', text: `🎉 ${data.message}` });
        startLivePrintTicker(data.tags || [], data.tag_items || [], data.summary);
        // Reset extra counters
        setExtraSizes({});
        setCustomSizeName('');
        setCustomSizeQty('');
      } else {
        setFeedbackMsg({ type: 'error', text: data.error || data.message || 'İlave etiket basımı sırasında hata meydana geldi.' });
      }
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: `İlave Baskı Hatası: ${err.message}` });
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Print Godex Box Label
  const handlePrintGodexBoxLabel = async () => {
    if (!order) return;
    
    setSubmitting(true);
    setFeedbackMsg({ type: 'info', text: '⏳ Godex G530 yazıcıya koli sevkiyat etiketi gönderiliyor...' });

    try {
      const actualBarcode = 
        (order.Ean13 && /^\d{8,14}$/.test(String(order.Ean13).trim()) ? String(order.Ean13).trim() : null) ||
        (order.ean13 && /^\d{8,14}$/.test(String(order.ean13).trim()) ? String(order.ean13).trim() : null) ||
        '';

      const payload = {
        order_id: order.Id,
        customer_name: order.MusteriAdi || 'MUSTERI',
        product_name: order.Model || 'URUN ADI',
        sku: order.Sku || `PVOG${order.Id}`,
        brand: order.Marka || order.brand || 'GENEL',
        barcode: actualBarcode,
        box_no: boxNo,
        total_boxes: totalBoxes,
        total_quantity: activeSizes.reduce((sum, item) => sum + (parseInt(sizeTransferInputs[item.size]) || item.remainingQty || 0), 0),
        items: activeSizes.map(it => ({ size: it.size, quantity: parseInt(sizeTransferInputs[it.size]) || it.remainingQty || 0 }))
      };

      const res = await fetch(`${API_BASE_URL}/api/printer/print-box-label`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        setFeedbackMsg({ type: 'success', text: `✅ GODEX BAŞARILI: ${data.message}` });
      } else {
        setFeedbackMsg({ type: 'error', text: data.error || 'Godex yazıcıya gönderilemedi.' });
      }
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: `Godex Hatası: ${err.message}` });
    } finally {
      setSubmitting(false);
    }
  };

  // Quick stepper helper for extra sizes
  const handleStepExtraSize = (sz, delta) => {
    setSelectedExtraPreviewBeden(sz);
    setExtraSizes(prev => ({
      ...prev,
      [sz]: Math.max(0, (parseInt(prev[sz]) || 0) + delta)
    }));
  };

  const totalExtraCount = useMemo(() => {
    const fromCards = Object.values(extraSizes).reduce((sum, val) => sum + (parseInt(val) || 0), 0);
    const fromCustom = parseInt(customSizeQty) || 0;
    return fromCards + fromCustom;
  }, [extraSizes, customSizeQty]);

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', color: isLight ? '#1e293b' : '#f8fafc' }}>
        <div style={{ fontSize: '2.5rem', animation: 'spin 1s linear infinite' }}>⏳</div>
        <div style={{ fontSize: '1.2rem', fontWeight: '700' }}>Sipariş #{orderId} Detayları Yükleniyor...</div>
      </div>
    );
  }

  if (errorMsg && !order) {
    return (
      <div style={{ padding: '3rem 2rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
        <h2 style={{ color: '#ef4444', fontWeight: '800' }}>Sipariş Bilgisi Yüklenemedi</h2>
        <p style={{ color: '#64748b', fontSize: '1rem' }}>{errorMsg}</p>
        <button 
          onClick={() => navigate('/admin/orders')}
          style={{ padding: '0.65rem 1.4rem', borderRadius: '8px', background: '#2563eb', color: '#ffffff', border: 'none', fontWeight: '700', cursor: 'pointer', marginTop: '1rem' }}
        >
          ← Sipariş Listesine Dön
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      width: '100%', 
      minHeight: '100vh', 
      background: isLight ? '#f4f6f9' : '#0b0f19', 
      color: isLight ? '#1e293b' : '#f8fafc', 
      padding: '1.5rem 2rem 4rem', 
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif' 
    }}>
      
      {/* 1. TOP EXECUTIVE HEADER */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '1.5rem', 
        flexWrap: 'wrap', 
        gap: '1rem',
        borderBottom: `1px solid ${isLight ? '#e2e8f0' : '#1e293b'}`,
        paddingBottom: '1.2rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
            <button 
              onClick={() => navigate('/admin/orders')}
              style={{ 
                background: isLight ? '#ffffff' : 'rgba(59, 130, 246, 0.12)', 
                border: `1px solid ${isLight ? '#cbd5e1' : 'rgba(59, 130, 246, 0.3)'}`, 
                color: '#2563eb', 
                padding: '0.45rem 1rem', 
                borderRadius: '8px', 
                cursor: 'pointer', 
                fontSize: '0.85rem', 
                fontWeight: '700',
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.4rem',
                boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
              }}
            >
              ← Tüm Siparişler
            </button>
            <span style={{ 
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
              color: '#ffffff', 
              padding: '0.25rem 0.75rem', 
              borderRadius: '20px', 
              fontSize: '0.78rem', 
              fontWeight: '800',
              letterSpacing: '0.5px'
            }}>
              🏷️ ETİKET & FİŞ MERKEZİ
            </span>
            <span style={{
              background: voucherSummary.status === 'TAMAMLANDI' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
              color: voucherSummary.status === 'TAMAMLANDI' ? '#10b981' : '#3b82f6',
              padding: '0.25rem 0.65rem',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: '800'
            }}>
              ● {voucherSummary.status}
            </span>
          </div>

          <h1 style={{ fontSize: '1.8rem', fontWeight: '900', margin: '0 0 0.2rem 0', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            Sipariş #{order.Id} • {cleanModelDisplayName(order.Model || order.product_name)}
          </h1>
          <div style={{ fontSize: '0.88rem', color: isLight ? '#64748b' : '#94a3b8', display: 'flex', gap: '1.2rem', flexWrap: 'wrap' }}>
            <span>🏢 <strong>Müşteri:</strong> {order.MusteriAdi || order.sub_customer_name || 'GENEL'}</span>
            <span>🔖 <strong>Marka:</strong> <strong style={{ color: '#2563eb' }}>{order.Marka || order.brand || 'GENEL'}</strong></span>
            <span>🔢 <strong>Parça No / SKU:</strong> <code style={{ color: '#0284c7', fontWeight: '800' }}>{formatOrderDisplayParcaNo(order)}</code></span>
            <span>📏 <strong>Sipariş Bedeni:</strong> {order.BedenAdi || 'STANDART'}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => fetchOrderDetails(order.Id)}
            style={{
              padding: '0.55rem 1rem',
              borderRadius: '8px',
              background: isLight ? '#ffffff' : '#1e293b',
              color: 'inherit',
              border: `1px solid ${isLight ? '#cbd5e1' : '#334155'}`,
              fontWeight: '700',
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
            }}
            title="Sipariş ve etiket geçmişini yenile"
          >
            🔄 Yenile
          </button>
        </div>
      </div>

      {/* 2. KPI SUMMARY CARDS BAR */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', 
        gap: '1rem', 
        marginBottom: '1.5rem' 
      }}>
        <div style={{ 
          background: isLight ? '#ffffff' : '#0f172a', 
          padding: '1rem 1.25rem', 
          borderRadius: '12px', 
          border: `1px solid ${isLight ? '#e2e8f0' : '#1e293b'}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <div style={{ color: isLight ? '#64748b' : '#94a3b8', fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase' }}>
            📦 Toplam Sipariş
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '900', color: 'inherit', marginTop: '0.2rem' }}>
            {totalOrderQty.toLocaleString('tr-TR')} <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Adet</span>
          </div>
        </div>

        <div style={{ 
          background: isLight ? '#ffffff' : '#0f172a', 
          padding: '1rem 1.25rem', 
          borderRadius: '12px', 
          border: `1px solid ${isLight ? '#e2e8f0' : '#1e293b'}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <div style={{ color: '#3b82f6', fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase' }}>
            🏷️ Önceden Basılan Etiket
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#2563eb', marginTop: '0.2rem' }}>
            {previouslyProcessed.toLocaleString('tr-TR')} <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Adet</span>
          </div>
        </div>

        <div style={{ 
          background: isLight ? '#ffffff' : '#0f172a', 
          padding: '1rem 1.25rem', 
          borderRadius: '12px', 
          border: `1px solid ${isLight ? '#e2e8f0' : '#1e293b'}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <div style={{ color: remainingQty > 0 ? '#10b981' : '#64748b', fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase' }}>
            ⏳ Kalan Planlı Sipariş
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '900', color: remainingQty > 0 ? '#10b981' : '#94a3b8', marginTop: '0.2rem' }}>
            {remainingQty.toLocaleString('tr-TR')} <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Adet</span>
          </div>
        </div>

        <div style={{ 
          background: isLight ? '#ffffff' : '#0f172a', 
          padding: '1rem 1.25rem', 
          borderRadius: '12px', 
          border: `1px solid ${isLight ? '#e2e8f0' : '#1e293b'}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <div style={{ color: '#8b5cf6', fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase' }}>
            📦 Koli & Sevkiyat Ayarı
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: '800', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>Koli: <strong>{boxNo}</strong> / <strong>{totalBoxes}</strong></span>
          </div>
        </div>
      </div>

      {/* 3. LIVE PRINT PROGRESS TRACKER (Gereksinim: "hata oldugun yazdırma işlemini durdurabilme düğmesi ekle", "kaçıncı basıldı/kalan") */}
      {printJob && printJob.isActive && (
        <div style={{ 
          background: isLight ? '#ffffff' : '#0f172a', 
          borderRadius: '14px', 
          padding: '1.5rem', 
          marginBottom: '1.75rem', 
          border: `2px solid ${printJob.isStopped ? '#ef4444' : (printJob.isFinished ? '#10b981' : '#2563eb')}`,
          boxShadow: printJob.isStopped ? '0 10px 30px rgba(239, 68, 68, 0.2)' : (printJob.isFinished ? '0 10px 30px rgba(16, 185, 129, 0.15)' : '0 10px 35px rgba(37, 99, 235, 0.2)'),
          transition: 'all 0.3s ease'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ 
                width: '46px', 
                height: '46px', 
                borderRadius: '12px', 
                background: printJob.isStopped ? 'rgba(239, 68, 68, 0.15)' : (printJob.isFinished ? 'rgba(16, 185, 129, 0.15)' : 'rgba(37, 99, 235, 0.15)'), 
                color: printJob.isStopped ? '#ef4444' : (printJob.isFinished ? '#10b981' : '#2563eb'),
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '1.6rem' 
              }}>
                {printJob.isStopped ? '🛑' : (printJob.isFinished ? '✅' : '🖨️')}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '900', color: printJob.isStopped ? '#ef4444' : (printJob.isFinished ? '#10b981' : '#2563eb') }}>
                  {printJob.isStopped 
                    ? '🛑 Yazdırma İşlemi Operatör Tarafından Durduruldu!' 
                    : (printJob.isFinished 
                        ? '🎉 Tüm Etiketler Yazıcıdan Başarıyla Çıktı & Çipler Kodlandı!' 
                        : '⚡ SATO CL4NX Plus RFID Yazıcı Canlı Baskı & Çıkış Takibi')}
                </h3>
                <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.2rem' }}>
                  {printJob.isStopped ? (
                    <>⚠️ Toplam {printJob.totalLabels} etiketten <strong>{printJob.ejectedCount || printJob.printedCount} adedi çıktı</strong>, {printJob.remainingToEject !== undefined ? printJob.remainingToEject : printJob.remainingCount} adedi iptal edildi.</>
                  ) : (
                    <>Yazıcı: <strong>SATO CL4NX Plus (305 DPI - RFID UHF)</strong> • Başlangıç: {printJob.startTime} • Termal Besleme Hızı: ~600ms/etiket</>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              {!printJob.isFinished && (
                <>
                  <button
                    type="button"
                    onClick={handleStopPrinting}
                    disabled={isCancelling}
                    style={{
                      padding: '0.5rem 1.15rem',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '0.82rem',
                      fontWeight: '900',
                      cursor: isCancelling ? 'not-allowed' : 'pointer',
                      boxShadow: '0 3px 10px rgba(239, 68, 68, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      transition: 'all 0.2s ease'
                    }}
                    title="Yazdırma işlemini derhal durdurur ve yazıcı kuyruğunu iptal eder"
                  >
                    {isCancelling ? '⏳ Durduruluyor...' : '🛑 BASKIYI DURDUR'}
                  </button>

                  <button
                    type="button"
                    onClick={handleFastForwardTicker}
                    style={{
                      padding: '0.5rem 0.95rem',
                      borderRadius: '8px',
                      background: 'rgba(59, 130, 246, 0.12)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      color: '#2563eb',
                      fontSize: '0.8rem',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                    title="Animasyonu atlayarak tamamlandı durumuna getirir"
                  >
                    ⏩ Çıkışı Hızlandır / Tamamla
                  </button>
                </>
              )}
              {printJob.isFinished && (
                <button
                  type="button"
                  onClick={() => setPrintJob(null)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    background: isLight ? '#f1f5f9' : '#1e293b',
                    border: `1px solid ${isLight ? '#cbd5e1' : '#334155'}`,
                    color: 'inherit',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Paneli Kapat ✕
                </button>
              )}
            </div>
          </div>

          {/* İKİLİ SAYAÇ BLOKLARI: 1. KUYRUK SAYACI  &  2. YAZICIDAN O AN ÇIKAN ETİKET SAYACI */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            
            {/* GÖSTERGE 1: YAZICI KUYRUĞUNA GİDENLER (QUEUE / SPOOLER) */}
            <div style={{ 
              background: isLight ? '#f1f5f9' : '#1e293b', 
              padding: '1rem 1.25rem', 
              borderRadius: '12px', 
              border: `1.5px solid ${isLight ? '#cbd5e1' : '#334155'}`,
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  📤 1. Yazıcı Kuyruğuna Gönderilen (Queue)
                </span>
                <span style={{ 
                  background: 'rgba(16, 185, 129, 0.15)', 
                  color: '#10b981', 
                  fontSize: '0.72rem', 
                  fontWeight: '900', 
                  padding: '0.2rem 0.5rem', 
                  borderRadius: '6px' 
                }}>
                  ✅ %100 Kuyrukta Hazır
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <div style={{ fontSize: '2rem', fontWeight: '900', color: isLight ? '#0f172a' : '#f8fafc' }}>
                  {printJob.queuedCount || printJob.totalLabels}
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#64748b' }}>
                  / {printJob.totalLabels} Adet Emir İletildi
                </div>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.35rem' }}>
                Windows Spooler ve SATO yazıcı hafızasına aktarıldı.
              </div>
            </div>

            {/* GÖSTERGE 2: YAZICIDAN O AN ÇIKAN ETİKET (CANLI FİZİKSEL ÇIKIŞ) */}
            <div style={{ 
              background: isLight ? 'rgba(37, 99, 235, 0.04)' : 'rgba(30, 58, 138, 0.18)', 
              padding: '1rem 1.25rem', 
              borderRadius: '12px', 
              border: '2px solid #2563eb',
              boxShadow: '0 4px 15px rgba(37, 99, 235, 0.12)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: '900', color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>🖨️</span> 2. Yazıcıdan O An Çıkan Etiket (Fiziksel Çıkış)
                </span>
                <span style={{ 
                  background: printJob.isFinished ? '#10b981' : (printJob.isStopped ? '#ef4444' : '#2563eb'), 
                  color: '#ffffff', 
                  fontSize: '0.72rem', 
                  fontWeight: '900', 
                  padding: '0.2rem 0.6rem', 
                  borderRadius: '12px',
                  boxShadow: '0 2px 6px rgba(37, 99, 235, 0.35)'
                }}>
                  {printJob.isFinished ? 'TAMAMLANDI' : (printJob.isStopped ? 'DURDURULDU' : '🟢 ŞU AN ÇIKIYOR')}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                  <div style={{ fontSize: '2.3rem', fontWeight: '900', color: '#2563eb', lineHeight: 1 }}>
                    #{printJob.ejectedCount || printJob.printedCount || 0}
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#64748b' }}>
                    . Etiket Çıktı <span style={{ fontSize: '0.8rem' }}>(/ {printJob.totalLabels})</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '700' }}>KALAN ÇIKACAK:</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '900', color: ((printJob.remainingToEject !== undefined ? printJob.remainingToEject : printJob.remainingCount) === 0 ? '#10b981' : '#f59e0b') }}>
                    {printJob.remainingToEject !== undefined ? printJob.remainingToEject : printJob.remainingCount} Adet
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: '800', marginTop: '0.35rem' }}>
                Yazıcı ağzından fiziken çıkan etiketin anlık sırası ve ilerlemesi (%{printJob.progressPercent})
              </div>
            </div>

          </div>

          {/* Visual Progress Bar (Fiziksel Çıkış İlerleme Çubuğu) */}
          <div style={{ 
            width: '100%', 
            height: '14px', 
            background: isLight ? '#e2e8f0' : '#1e293b', 
            borderRadius: '10px', 
            overflow: 'hidden', 
            marginBottom: '1rem',
            position: 'relative'
          }}>
            <div style={{ 
              width: `${printJob.progressPercent}%`, 
              height: '100%', 
              background: printJob.isFinished 
                ? 'linear-gradient(90deg, #10b981, #059669)' 
                : (printJob.isStopped ? '#ef4444' : 'linear-gradient(90deg, #3b82f6, #10b981)'), 
              borderRadius: '10px',
              transition: 'width 0.3s ease-in-out',
              boxShadow: '0 0 12px rgba(59, 130, 246, 0.5)'
            }} />
          </div>

          {/* Active Item Ticker Card (Şu an yazıcıdan çıkan etiketin tam kimliği) */}
          {printJob.activeTag && (
            <div style={{ 
              background: isLight ? 'rgba(59, 130, 246, 0.05)' : 'rgba(15, 23, 42, 0.85)', 
              padding: '0.9rem 1.2rem', 
              borderRadius: '12px', 
              border: `1.5px dashed ${isLight ? '#93c5fd' : '#1e3a8a'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
              fontSize: '0.85rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.4rem' }}>🏷️</span>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>
                    YAZICI AĞZINDAN O AN ÇIKAN ETİKET (#{printJob.ejectedCount || printJob.printedCount || 1} / {printJob.totalLabels}):
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: '900', color: isLight ? '#0f172a' : '#f8fafc', marginTop: '0.15rem' }}>
                    <span style={{ color: '#2563eb' }}>{printJob.activeTag.size ? `BEDEN: ${printJob.activeTag.size}` : ''}</span>
                    {printJob.activeTag.gender ? ` • ${printJob.activeTag.gender}` : ''}
                    {printJob.activeTag.sku ? ` • SKU: ${printJob.activeTag.sku}` : ''}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: '700', display: 'block' }}>KODLANAN RFID EPC ÇİPİ:</span>
                  <code style={{ fontSize: '0.95rem', fontWeight: '900', color: '#10b981', letterSpacing: '0.8px' }}>
                    {printJob.activeTag.epc || '303B50CC...'}
                  </code>
                </div>
                {printJob.activeTag.barcode && (
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: '700', display: 'block' }}>EAN-13 BARKOD:</span>
                    <strong style={{ fontSize: '0.95rem', color: '#0284c7' }}>{printJob.activeTag.barcode}</strong>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Global Feedback Message Banner */}
      {feedbackMsg && (
        <div style={{ 
          padding: '0.9rem 1.25rem', 
          borderRadius: '10px', 
          marginBottom: '1.5rem', 
          fontSize: '0.9rem', 
          fontWeight: '700',
          background: feedbackMsg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : (feedbackMsg.type === 'info' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(239, 68, 68, 0.15)'),
          color: feedbackMsg.type === 'success' ? '#10b981' : (feedbackMsg.type === 'info' ? '#3b82f6' : '#ef4444'),
          border: `1px solid ${feedbackMsg.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : (feedbackMsg.type === 'info' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(239, 68, 68, 0.3)')}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span>{feedbackMsg.type === 'success' ? '✅' : (feedbackMsg.type === 'info' ? 'ℹ️' : '⚠️')}</span>
            <span>{feedbackMsg.text}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {feedbackMsg.type === 'error' && (
              <button
                type="button"
                onClick={handleStopPrinting}
                disabled={isCancelling}
                style={{
                  padding: '0.35rem 0.85rem',
                  borderRadius: '6px',
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: '800',
                  fontSize: '0.78rem',
                  cursor: isCancelling ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
                title="Hata durumunda yazıcı kuyruğunu ve bekleyen işleri temizler"
              >
                🛑 Kuyruğu Temizle & Durdur
              </button>
            )}
            <button 
              type="button"
              onClick={() => setFeedbackMsg(null)} 
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1rem', fontWeight: '800' }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 4. NAVIGATION TABS BAR */}
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        marginBottom: '1.5rem', 
        borderBottom: `2px solid ${isLight ? '#e2e8f0' : '#1e293b'}`, 
        paddingBottom: '0.5rem',
        overflowX: 'auto'
      }}>
        <button
          type="button"
          onClick={() => setActiveTab('planli')}
          style={{
            padding: '0.65rem 1.2rem',
            borderRadius: '8px 8px 0 0',
            fontWeight: '800',
            fontSize: '0.88rem',
            border: 'none',
            cursor: 'pointer',
            background: activeTab === 'planli' ? (isLight ? '#2563eb' : '#3b82f6') : 'transparent',
            color: activeTab === 'planli' ? '#ffffff' : (isLight ? '#64748b' : '#94a3b8'),
            boxShadow: activeTab === 'planli' ? '0 4px 12px rgba(37, 99, 235, 0.25)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            transition: 'all 0.15s ease'
          }}
        >
          📋 Planlı Sipariş / Kalan Bedenler Baskısı
          {remainingQty > 0 && (
            <span style={{ background: activeTab === 'planli' ? 'rgba(255,255,255,0.25)' : '#10b981', color: '#ffffff', padding: '0.15rem 0.45rem', borderRadius: '12px', fontSize: '0.72rem' }}>
              {remainingQty} Kalan
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ekstra')}
          style={{
            padding: '0.65rem 1.2rem',
            borderRadius: '8px 8px 0 0',
            fontWeight: '800',
            fontSize: '0.88rem',
            border: 'none',
            cursor: 'pointer',
            background: activeTab === 'ekstra' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
            color: activeTab === 'ekstra' ? '#ffffff' : (isLight ? '#64748b' : '#94a3b8'),
            boxShadow: activeTab === 'ekstra' ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            transition: 'all 0.15s ease'
          }}
        >
          ➕ İlave / Ekstra Etiket Basımı
          <span style={{ background: activeTab === 'ekstra' ? 'rgba(255,255,255,0.25)' : '#f59e0b', color: '#ffffff', padding: '0.15rem 0.45rem', borderRadius: '12px', fontSize: '0.72rem' }}>
            Hızlı / Esnek
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('matrix')}
          style={{
            padding: '0.65rem 1.2rem',
            borderRadius: '8px 8px 0 0',
            fontWeight: '800',
            fontSize: '0.88rem',
            border: 'none',
            cursor: 'pointer',
            background: activeTab === 'matrix' ? (isLight ? '#2563eb' : '#3b82f6') : 'transparent',
            color: activeTab === 'matrix' ? '#ffffff' : (isLight ? '#64748b' : '#94a3b8'),
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          🏭 ERP Kesim / Beden Dağılımı (bsip)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('koli')}
          style={{
            padding: '0.65rem 1.2rem',
            borderRadius: '8px 8px 0 0',
            fontWeight: '800',
            fontSize: '0.88rem',
            border: 'none',
            cursor: 'pointer',
            background: activeTab === 'koli' ? (isLight ? '#2563eb' : '#3b82f6') : 'transparent',
            color: activeTab === 'koli' ? '#ffffff' : (isLight ? '#64748b' : '#94a3b8'),
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          📦 Koli & Godex Yazıcı Ayarları
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('gecmis')}
          style={{
            padding: '0.65rem 1.2rem',
            borderRadius: '8px 8px 0 0',
            fontWeight: '800',
            fontSize: '0.88rem',
            border: 'none',
            cursor: 'pointer',
            background: activeTab === 'gecmis' ? (isLight ? '#2563eb' : '#3b82f6') : 'transparent',
            color: activeTab === 'gecmis' ? '#ffffff' : (isLight ? '#64748b' : '#94a3b8'),
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          📜 Fiş & Baskı Geçmişi ({vouchersHistory.length})
        </button>
      </div>

      {/* 5. TAB 1: PLANLI SİPARİŞ / KALAN BEDENLER BASKISI */}
      {activeTab === 'planli' && (
        <div style={{ 
          background: isLight ? '#ffffff' : '#0f172a', 
          borderRadius: '16px', 
          padding: '1.75rem', 
          border: `1px solid ${isLight ? '#cbd5e1' : '#334155'}`,
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.8rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: selectedGender === 'Kadın' ? '#ec4899' : '#2563eb' }}>
                📋 Planlı Sipariş Beden Dağılımı ve Etiket Basımı ({selectedGender.toUpperCase()})
              </h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                Siparişin başlangıçta tanımlı {selectedGender.toLowerCase()} beden adetlerini ve kalan eksik miktarları buradan basabilirsiniz.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setShowAllSizes(prev => !prev)}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  background: showAllSizes ? '#3b82f6' : (isLight ? '#e2e8f0' : '#334155'),
                  color: showAllSizes ? '#ffffff' : 'inherit',
                  border: 'none',
                  cursor: 'pointer'
                }}
                title="Siparişte yer almayan tüm standart bedenleri listeye ekler veya gizler"
              >
                {showAllSizes ? '👁️ Sadece Sipariştekileri Göster' : '➕ Tüm Standart Bedenleri Göster'}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <input
                  type="text"
                  placeholder="Örn: 4XL, 50"
                  value={newCustomSizeInput}
                  onChange={(e) => setNewCustomSizeInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomSizeToTab1(); } }}
                  style={{
                    width: '105px',
                    padding: '0.4rem 0.5rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    border: `1px solid ${isLight ? '#cbd5e1' : '#475569'}`,
                    background: isLight ? '#ffffff' : '#0f172a',
                    color: 'inherit'
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddCustomSizeToTab1}
                  style={{
                    padding: '0.4rem 0.65rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: '800',
                    background: '#6366f1',
                    color: '#ffffff',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  title="Özel beden kutusu ekle"
                >
                  + Beden Ekle
                </button>
              </div>

              {activeSizes.length > 0 && (
                <button
                  type="button"
                  onClick={handleFillAllRemainingSizes}
                  style={{
                    padding: '0.45rem 1rem', 
                    borderRadius: '8px', 
                    fontSize: '0.82rem', 
                    fontWeight: '800',
                    background: selectedGender === 'Kadın' ? '#ec4899' : '#10b981', 
                    color: '#ffffff', 
                    border: 'none', 
                    cursor: 'pointer',
                    boxShadow: selectedGender === 'Kadın' ? '0 2px 8px rgba(236, 72, 153, 0.3)' : '0 2px 8px rgba(16, 185, 129, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  ⚡ Tüm Kalan {selectedGender} Bedenlerini Doldur ({selectedGenderRemaining} Adet)
                </button>
              )}

              {genderStats.hasMultiple && (genderStats.erkRemaining > 0 || genderStats.kadRemaining > 0) && (
                <button
                  type="button"
                  onClick={() => handlePrintPlannedSatoLabels(true)}
                  disabled={submitting}
                  style={{
                    padding: '0.45rem 1rem', 
                    borderRadius: '8px', 
                    fontSize: '0.82rem', 
                    fontWeight: '800',
                    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', 
                    color: '#ffffff', 
                    border: 'none', 
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(168, 85, 247, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                  title="Hem Erkek hem Kadın kalan tüm etiketleri doğru SKU ve cinsiyetle tek seferde basar"
                >
                  ✨ Tüm Siparişi Bas ({genderStats.erkRemaining + genderStats.kadRemaining} Adet: {genderStats.erkRemaining} Erkek + {genderStats.kadRemaining} Kadın)
                </button>
              )}
            </div>
          </div>

          {/* Etiket İlk Satır Başlığı Belirleme / Düzenleme Kutusu */}
          <LabelTitleEditorBox 
            customLabelTitle={customLabelTitle} 
            setCustomLabelTitle={setCustomLabelTitle} 
            originalName={order?.Model || order?.product_name || ''} 
            isLight={isLight} 
          />

          {/* Beden Dağılımı Grid Cards */}
          {activeSizes.length > 0 ? (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))', 
              gap: '0.75rem', 
              marginBottom: '1.5rem' 
            }}>
              {activeSizes.map(szItem => {
                const currentInput = sizeTransferInputs[szItem.size] !== undefined ? sizeTransferInputs[szItem.size] : '';
                const isFinished = szItem.remainingQty <= 0 && !szItem.notInOrder;

                return (
                  <div 
                    key={szItem.size} 
                    style={{ 
                      background: isLight ? '#f8fafc' : '#1e293b', 
                      padding: '0.75rem', 
                      borderRadius: '10px', 
                      border: `1.5px solid ${currentInput > 0 ? (szItem.notInOrder ? '#f59e0b' : (selectedGender === 'Kadın' ? '#ec4899' : '#10b981')) : (szItem.notInOrder ? '#f59e0b' : (isLight ? '#cbd5e1' : '#334155'))}`, 
                      textAlign: 'center',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
                    }}
                  >
                    <div style={{ fontWeight: '900', fontSize: '1.1rem', color: szItem.notInOrder ? '#f59e0b' : (selectedGender === 'Kadın' ? '#ec4899' : '#2563eb'), marginBottom: '0.2rem' }}>
                      {szItem.size}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '0.4rem' }}>
                      {szItem.notInOrder ? (
                        <span style={{ color: '#f59e0b', fontWeight: '800' }}>⚠️ İlave Beden</span>
                      ) : (
                        <>
                          Sipariş: <strong>{szItem.orderQty}</strong><br />
                          Kalan: <strong style={{ color: isFinished ? '#94a3b8' : (selectedGender === 'Kadın' ? '#ec4899' : '#10b981') }}>{szItem.remainingQty}</strong>
                        </>
                      )}
                    </div>
                    <input
                      type="number"
                      min="0"
                      placeholder={szItem.notInOrder ? '0' : String(szItem.remainingQty)}
                      value={currentInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSizeTransferInputs(prev => ({
                          ...prev,
                          [szItem.size]: val === '' ? '' : parseInt(val) || 0
                        }));
                      }}
                      style={{
                        width: '100%', 
                        padding: '0.4rem 0.5rem', 
                        borderRadius: '6px', 
                        fontSize: '0.9rem', 
                        fontWeight: '800',
                        textAlign: 'center', 
                        border: `1px solid ${szItem.notInOrder ? '#f59e0b' : (isLight ? '#cbd5e1' : '#475569')}`,
                        background: isLight ? '#ffffff' : '#0f172a', 
                        color: 'inherit', 
                        outline: 'none'
                      }}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
              Bu cinsiyete ait açık beden dağılımı bulunamadı.
            </div>
          )}

          {/* Gender & Template Selection */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: isLight ? '#334155' : '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                👤 Cinsiyet Grubu & Beden Dağılımı:
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['Erkek', 'Kadın', 'Çocuk'].map(g => {
                  const isSelected = selectedGender === g;
                  const gRemaining = g === 'Erkek' ? genderStats.erkRemaining : (g === 'Kadın' ? genderStats.kadRemaining : 0);
                  const gTotal = g === 'Erkek' ? genderStats.erkekTotal : (g === 'Kadın' ? genderStats.kadinTotal : 0);
                  const hasData = gTotal > 0;
                  const themeColor = g === 'Kadın' ? '#ec4899' : (g === 'Çocuk' ? '#f59e0b' : '#2563eb');

                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => {
                        setSelectedGender(g);
                        setSizeTransferInputs({});
                      }}
                      style={{
                        flex: 1, 
                        padding: '0.55rem 0.75rem', 
                        borderRadius: '8px', 
                        fontSize: '0.85rem', 
                        fontWeight: '800',
                        border: `1.5px solid ${isSelected ? themeColor : (isLight ? '#cbd5e1' : '#475569')}`,
                        background: isSelected ? themeColor : (isLight ? '#ffffff' : '#0f172a'),
                        color: isSelected ? '#ffffff' : 'inherit',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.15rem',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span>{g === 'Erkek' ? '👨 Erkek' : (g === 'Kadın' ? '👩 Kadın' : '🧒 Çocuk')}</span>
                      </div>
                      {hasData && (
                        <div style={{ 
                          fontSize: '0.7rem', 
                          fontWeight: '900',
                          opacity: isSelected ? 0.95 : 0.7,
                          color: isSelected ? '#ffffff' : (g === 'Kadın' ? '#db2777' : '#2563eb')
                        }}>
                          {gRemaining} / {gTotal} Adet
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: isLight ? '#334155' : '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                🏷️ SATO RFID Etiket Şablonu:
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setRfidLabelTemplate('QR')}
                  style={{
                    flex: 1, 
                    padding: '0.55rem 0.75rem', 
                    borderRadius: '8px', 
                    fontSize: '0.85rem', 
                    fontWeight: '800',
                    border: `1.5px solid ${rfidLabelTemplate === 'QR' ? '#2563eb' : (isLight ? '#cbd5e1' : '#475569')}`,
                    background: rfidLabelTemplate === 'QR' ? '#2563eb' : (isLight ? '#ffffff' : '#0f172a'),
                    color: rfidLabelTemplate === 'QR' ? '#ffffff' : 'inherit',
                    cursor: 'pointer'
                  }}
                >
                  🔲 QR Karekodlu
                </button>
                <button
                  type="button"
                  onClick={() => setRfidLabelTemplate('CLASSIC_1D')}
                  style={{
                    flex: 1, 
                    padding: '0.55rem 0.75rem', 
                    borderRadius: '8px', 
                    fontSize: '0.85rem', 
                    fontWeight: '800',
                    border: `1.5px solid ${rfidLabelTemplate === 'CLASSIC_1D' ? '#2563eb' : (isLight ? '#cbd5e1' : '#475569')}`,
                    background: rfidLabelTemplate === 'CLASSIC_1D' ? '#2563eb' : (isLight ? '#ffffff' : '#0f172a'),
                    color: rfidLabelTemplate === 'CLASSIC_1D' ? '#ffffff' : 'inherit',
                    cursor: 'pointer'
                  }}
                >
                  🏷️ Klasik Çizgi Barkod (1D)
                </button>
              </div>
            </div>
          </div>

          {/* Live Dynamic Preview Card for Tab 1 */}
          <div style={{ 
            background: isLight ? '#f8fafc' : '#0f172a', 
            borderRadius: '12px', 
            padding: '1rem 1.25rem', 
            marginBottom: '1.25rem', 
            border: `1.5px solid ${selectedGender === 'Kadın' ? (isLight ? '#fbcfe8' : '#831843') : (isLight ? '#e2e8f0' : '#1e293b')}` 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '800', color: selectedGender === 'Kadın' ? '#ec4899' : '#2563eb', textTransform: 'uppercase' }}>
                🔍 Planlı Etiket Baskı Önizlemesi ({selectedGender.toUpperCase()} • {rfidLabelTemplate === 'CLASSIC_1D' ? '1D ÇİZGİLİ BARKOD' : '2D QR KAREKOD'}):
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Etikette Basılacak Model (1. Satır): <strong style={{ color: selectedGender === 'Kadın' ? '#ec4899' : '#2563eb', fontSize: '0.9rem' }}>{customLabelTitle || cleanModelDisplayName(order.Model || order.product_name)}</strong>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.3rem' }}>
                  SKU / Parça No: <code style={{ color: selectedGender === 'Kadın' ? '#ec4899' : '#0284c7', fontWeight: '900' }}>{plannedPreviewData.sku}</code>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.3rem' }}>
                  EAN-13 / Barkod: <code style={{ color: '#10b981', fontWeight: '800' }}>{plannedPreviewData.barcode}</code>
                </div>
              </div>
              <div style={{ 
                textAlign: 'center', 
                background: '#ffffff', 
                padding: '0.75rem 1rem', 
                borderRadius: '10px', 
                border: '1.5px solid #cbd5e1',
                boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                minHeight: '85px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <BarcodePreviewCanvas 
                  barcode={plannedPreviewData.barcode} 
                  template={rfidLabelTemplate} 
                  height={60} 
                />
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: `1px solid ${isLight ? '#e2e8f0' : '#1e293b'}`, paddingTop: '1.25rem' }}>
            <button
              type="button"
              onClick={() => handlePrintPlannedSatoLabels(false)}
              disabled={submitting || selectedGenderRemaining <= 0}
              style={{
                padding: '0.75rem 2rem',
                borderRadius: '10px',
                background: selectedGenderRemaining <= 0 
                  ? '#94a3b8' 
                  : (selectedGender === 'Kadın' 
                      ? 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)' 
                      : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'),
                color: '#ffffff',
                border: 'none',
                fontWeight: '900',
                fontSize: '0.95rem',
                cursor: (submitting || selectedGenderRemaining <= 0) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                boxShadow: (submitting || selectedGenderRemaining <= 0) 
                  ? 'none' 
                  : (selectedGender === 'Kadın' ? '0 4px 14px rgba(236, 72, 153, 0.4)' : '0 4px 14px rgba(37, 99, 235, 0.35)')
              }}
            >
              <span>🖨️</span>
              {submitting ? '⏳ Yazıcıya Gönderiliyor...' : `SATO'dan Planlı RFID Etiket Bas (${selectedGender.toUpperCase()} - ${currentSelectedTotalToPrint || selectedGenderRemaining} Adet)`}
            </button>
          </div>
        </div>
      )}

      {/* 6. TAB 2: İLAVE / EKSTRA ETİKET BASIMI (Gereksinim: "gerektiğinde bedenler kadın erkek çocuk v.s. için ekstre etiket basımını desteklesin. ilave etiket basımını kolaylaştırsın.") */}
      {activeTab === 'ekstra' && (
        <div style={{ 
          background: isLight ? '#ffffff' : '#0f172a', 
          borderRadius: '16px', 
          padding: '1.75rem', 
          border: `1px solid ${isLight ? '#cbd5e1' : '#334155'}`,
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>✨</span>
                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '900', color: '#10b981' }}>
                  İlave & Ekstra Etiket Basım Merkezi
                </h3>
              </div>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                Sipariş bakiyesinden bağımsız olarak defo, hasar telafisi, şahit numune veya ek müşteri talepleri için tek tıkla ilave etiket basın.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <button
                type="button"
                onClick={() => {
                  setExtraSizes({});
                  setCustomSizeName('');
                  setCustomSizeQty('');
                }}
                style={{
                  padding: '0.45rem 0.9rem',
                  borderRadius: '8px',
                  background: isLight ? '#f1f5f9' : '#1e293b',
                  border: `1px solid ${isLight ? '#cbd5e1' : '#334155'}`,
                  color: 'inherit',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                🗑️ Adetleri Sıfırla
              </button>
            </div>
          </div>

          {/* Etiket İlk Satır Başlığı Belirleme / Düzenleme Kutusu */}
          <LabelTitleEditorBox 
            customLabelTitle={customLabelTitle} 
            setCustomLabelTitle={setCustomLabelTitle} 
            originalName={order?.Model || order?.product_name || ''} 
            isLight={isLight} 
          />

          {/* Gender Selector with dynamic SKU hint */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: isLight ? '#334155' : '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              1. CİNSİYET GRUBU SEÇİMİ:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
              {[
                { 
                  key: 'Erkek', 
                  label: '👨 Erkek', 
                  skuHint: resolveGenderSpecificSku(orderBaseSku, 'ERKEK') || (order?.brand === 'SKODA' ? 'PSKD100025' : '') 
                },
                { 
                  key: 'Kadın', 
                  label: '👩 Kadın', 
                  skuHint: resolveGenderSpecificSku(orderBaseSku, 'KADIN') || (order?.brand === 'SKODA' ? 'PSKD100026' : '') 
                },
                { key: 'Çocuk', label: '🧒 Çocuk', skuHint: '' },
                { key: 'Unisex', label: '⚪ Unisex', skuHint: '' }
              ].map(g => (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => {
                    setExtraGender(g.key);
                    setExtraSizes({});
                    setSelectedExtraPreviewBeden('');
                  }}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    border: `2px solid ${extraGender === g.key ? '#10b981' : (isLight ? '#e2e8f0' : '#334155')}`,
                    background: extraGender === g.key ? (isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.15)') : (isLight ? '#ffffff' : '#0f172a'),
                    color: extraGender === g.key ? '#059669' : 'inherit',
                    fontWeight: '800',
                    cursor: 'pointer',
                    boxShadow: extraGender === g.key ? '0 4px 12px rgba(16, 185, 129, 0.2)' : 'none',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ fontSize: '1rem' }}>{g.label}</div>
                  {g.skuHint && (
                    <div style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: '700', marginTop: '0.2rem' }}>
                      SKU: {g.skuHint}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Size Stepper Cards - Dynaimcally derived from Order (Matching Tab 1) */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: isLight ? '#334155' : '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              2. BEDENLER VE İLAVE BASKI MİKTARLARI (+1 / +5 / +10 Hızlı Butonlar):
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))', gap: '0.75rem' }}>
              {extraActiveSizes.map(szItem => {
                const sz = szItem.size || szItem;
                const count = extraSizes[sz] || 0;
                const orderQty = szItem.orderQty;

                return (
                  <div
                    key={sz}
                    onClick={() => setSelectedExtraPreviewBeden(sz)}
                    style={{
                      background: count > 0 ? (isLight ? '#f0fdf4' : '#064e3b') : (isLight ? '#f8fafc' : '#1e293b'),
                      borderRadius: '10px',
                      padding: '0.75rem 0.6rem',
                      border: `${activeExtraPreviewSize === sz ? '2.5px solid #2563eb' : (count > 0 ? '1.5px solid #10b981' : (isLight ? '1.5px solid #cbd5e1' : '1.5px solid #334155'))}`,
                      textAlign: 'center',
                      boxShadow: activeExtraPreviewSize === sz ? '0 0 0 2px rgba(37,99,235,0.3)' : (count > 0 ? '0 4px 10px rgba(16, 185, 129, 0.2)' : '0 1px 3px rgba(0,0,0,0.05)'),
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ fontWeight: '900', fontSize: '1.15rem', color: activeExtraPreviewSize === sz ? '#2563eb' : (count > 0 ? '#10b981' : '#64748b'), marginBottom: '0.1rem' }}>
                      {sz}
                    </div>
                    {orderQty !== undefined && orderQty > 0 ? (
                      <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '0.35rem' }}>
                        Sipariş: <strong>{orderQty}</strong>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.35rem', visibility: 'hidden' }}>
                        -
                      </div>
                    )}
                    
                    {/* Direct numeric input */}
                    <input
                      type="number"
                      min="0"
                      value={count === 0 ? '' : count}
                      placeholder="0"
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedExtraPreviewBeden(sz);
                        setExtraSizes(prev => ({
                          ...prev,
                          [sz]: val === '' ? 0 : Math.max(0, parseInt(val) || 0)
                        }));
                      }}
                      style={{
                        width: '100%',
                        padding: '0.35rem',
                        borderRadius: '6px',
                        border: `1px solid ${isLight ? '#cbd5e1' : '#475569'}`,
                        background: isLight ? '#ffffff' : '#0f172a',
                        textAlign: 'center',
                        fontWeight: '900',
                        fontSize: '1rem',
                        color: 'inherit',
                        outline: 'none',
                        marginBottom: '0.4rem'
                      }}
                    />

                    {/* Quick Stepper Row */}
                    <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStepExtraSize(sz, -1);
                        }}
                        style={{
                          flex: 1, padding: '0.25rem 0', borderRadius: '4px',
                          background: isLight ? '#e2e8f0' : '#334155', border: 'none',
                          fontWeight: '800', fontSize: '0.75rem', cursor: 'pointer'
                        }}
                      >
                        -1
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStepExtraSize(sz, +1);
                        }}
                        style={{
                          flex: 1, padding: '0.25rem 0', borderRadius: '4px',
                          background: '#10b981', color: '#ffffff', border: 'none',
                          fontWeight: '800', fontSize: '0.75rem', cursor: 'pointer'
                        }}
                      >
                        +1
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStepExtraSize(sz, +5);
                        }}
                        style={{
                          flex: 1, padding: '0.25rem 0', borderRadius: '4px',
                          background: '#2563eb', color: '#ffffff', border: 'none',
                          fontWeight: '800', fontSize: '0.75rem', cursor: 'pointer'
                        }}
                      >
                        +5
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Custom Size & Reason Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            {/* Custom Non-standard size input */}
            <div style={{ 
              background: isLight ? '#f8fafc' : '#1e293b', 
              padding: '1rem', 
              borderRadius: '10px', 
              border: `1px solid ${isLight ? '#cbd5e1' : '#334155'}` 
            }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: isLight ? '#334155' : '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                ⭐ Özel / Standart Dışı Beden Ekle:
              </label>
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <input
                  type="text"
                  placeholder="Örn: 48, 50, 52, 5XL..."
                  value={customSizeName}
                  onChange={(e) => {
                    const v = e.target.value;
                    setCustomSizeName(v);
                    if (v.trim()) setSelectedExtraPreviewBeden(v.trim().toUpperCase());
                  }}
                  style={{
                    flex: 2,
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    border: `1px solid ${isLight ? '#cbd5e1' : '#475569'}`,
                    background: isLight ? '#ffffff' : '#0f172a',
                    fontWeight: '700',
                    fontSize: '0.9rem',
                    color: 'inherit',
                    outline: 'none'
                  }}
                />
                <input
                  type="number"
                  min="1"
                  placeholder="Adet"
                  value={customSizeQty}
                  onChange={(e) => setCustomSizeQty(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    border: `1px solid ${isLight ? '#cbd5e1' : '#475569'}`,
                    background: isLight ? '#ffffff' : '#0f172a',
                    fontWeight: '800',
                    fontSize: '0.9rem',
                    textAlign: 'center',
                    color: 'inherit',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Extra Reason dropdown */}
            <div style={{ 
              background: isLight ? '#f8fafc' : '#1e293b', 
              padding: '1rem', 
              borderRadius: '10px', 
              border: `1px solid ${isLight ? '#cbd5e1' : '#334155'}` 
            }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: isLight ? '#334155' : '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                📝 İlave Basım Gerekçesi / Notu:
              </label>
              <select
                value={extraReason}
                onChange={(e) => setExtraReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: `1px solid ${isLight ? '#cbd5e1' : '#475569'}`,
                  background: isLight ? '#ffffff' : '#0f172a',
                  fontWeight: '700',
                  fontSize: '0.88rem',
                  color: 'inherit',
                  outline: 'none'
                }}
              >
                <option value="Defo / Hasarlı Etiket Telafisi">🏷️ Defo / Hasarlı Etiket Telafisi</option>
                <option value="İlave Müşteri Talebi">✨ İlave Müşteri Talebi</option>
                <option value="Numune / Şahit Numune">🧵 Numune / Şahit Numune</option>
                <option value="Koli / Beden Düzeltmesi">📦 Koli / Beden Düzeltmesi</option>
                <option value="Diğer">🔧 Diğer</option>
              </select>
            </div>
          </div>

          {/* 3. Etiket Formatı & Barkod Tipi Seçimi (1D Çizgili Barkod vs 2D QR Kod) */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: isLight ? '#334155' : '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              3. ETİKET FORMATI & BARKOD TİPİ SEÇİMİ (1D ÇİZGİLİ / 2D KAREKOD):
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setExtraLabelTemplate('CLASSIC_1D')}
                style={{
                  padding: '0.85rem 1.1rem',
                  borderRadius: '10px',
                  border: `2.5px solid ${extraLabelTemplate === 'CLASSIC_1D' ? '#2563eb' : (isLight ? '#e2e8f0' : '#334155')}`,
                  background: extraLabelTemplate === 'CLASSIC_1D' ? (isLight ? '#eff6ff' : 'rgba(37, 99, 235, 0.15)') : (isLight ? '#ffffff' : '#0f172a'),
                  color: extraLabelTemplate === 'CLASSIC_1D' ? '#2563eb' : 'inherit',
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxShadow: extraLabelTemplate === 'CLASSIC_1D' ? '0 4px 14px rgba(37, 99, 235, 0.25)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <span style={{ fontSize: '2.2rem' }}>🏷️</span>
                <div>
                  <div style={{ fontWeight: '900', fontSize: '1rem', color: extraLabelTemplate === 'CLASSIC_1D' ? '#2563eb' : 'inherit' }}>
                    1D Çizgili Barkod Şablonu (Code 128)
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                    Standart yatay çizgili barkod + Model + Beden + Parça No + RFID EPC Çipi
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setExtraLabelTemplate('QR')}
                style={{
                  padding: '0.85rem 1.1rem',
                  borderRadius: '10px',
                  border: `2.5px solid ${extraLabelTemplate === 'QR' ? '#2563eb' : (isLight ? '#e2e8f0' : '#334155')}`,
                  background: extraLabelTemplate === 'QR' ? (isLight ? '#eff6ff' : 'rgba(37, 99, 235, 0.15)') : (isLight ? '#ffffff' : '#0f172a'),
                  color: extraLabelTemplate === 'QR' ? '#2563eb' : 'inherit',
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxShadow: extraLabelTemplate === 'QR' ? '0 4px 14px rgba(37, 99, 235, 0.25)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <span style={{ fontSize: '2.2rem' }}>🔲</span>
                <div>
                  <div style={{ fontWeight: '900', fontSize: '1rem', color: extraLabelTemplate === 'QR' ? '#2563eb' : 'inherit' }}>
                    2D QR Karekodlu Şablon
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                    Karekod + EAN-13 + Model + Beden + Parça No + RFID EPC Çipi
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Live Dynamic Preview Card */}
          <div style={{ 
            background: isLight ? '#f8fafc' : '#0f172a', 
            borderRadius: '12px', 
            padding: '1.25rem', 
            marginBottom: '1.75rem', 
            border: `1px solid ${isLight ? '#e2e8f0' : '#1e293b'}` 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', flexWrap: 'wrap', gap: '0.6rem' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#2563eb', textTransform: 'uppercase' }}>
                🔍 Canlı Etiket & Barkod Çıktı Önizlemesi ({extraGender} • {extraLabelTemplate === 'CLASSIC_1D' ? '1D ÇİZGİLİ BARKOD' : '2D QR KAREKOD'}):
              </div>

              {/* Instant Template Switcher Pill directly on preview */}
              <div style={{ display: 'inline-flex', background: isLight ? '#e2e8f0' : '#1e293b', borderRadius: '8px', padding: '0.2rem', border: `1px solid ${isLight ? '#cbd5e1' : '#334155'}` }}>
                <button
                  type="button"
                  onClick={() => setExtraLabelTemplate('CLASSIC_1D')}
                  style={{
                    padding: '0.35rem 0.85rem',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '0.78rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                    background: extraLabelTemplate === 'CLASSIC_1D' ? '#2563eb' : 'transparent',
                    color: extraLabelTemplate === 'CLASSIC_1D' ? '#ffffff' : 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    boxShadow: extraLabelTemplate === 'CLASSIC_1D' ? '0 2px 6px rgba(37,99,235,0.3)' : 'none'
                  }}
                >
                  🏷️ 1D Çizgili Barkod
                </button>
                <button
                  type="button"
                  onClick={() => setExtraLabelTemplate('QR')}
                  style={{
                    padding: '0.35rem 0.85rem',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '0.78rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                    background: extraLabelTemplate === 'QR' ? '#2563eb' : 'transparent',
                    color: extraLabelTemplate === 'QR' ? '#ffffff' : 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    boxShadow: extraLabelTemplate === 'QR' ? '0 2px 6px rgba(37,99,235,0.3)' : 'none'
                  }}
                >
                  🔲 2D QR Karekod
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Etikette Basılacak Model (1. Satır):</div>
                <div style={{ fontWeight: '800', fontSize: '0.95rem', color: '#10b981' }}>{customLabelTitle || cleanModelDisplayName(order.Model || order.product_name)}</div>

                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
                  Çözümlenen Parça No / SKU ({extraGender}{previewResolvedData.previewSize ? ` • ${previewResolvedData.previewSize}` : ''}):
                </div>
                <code style={{ fontSize: '1.05rem', fontWeight: '900', color: '#0284c7' }}>{previewResolvedData.sku}</code>

                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>Barkod / EAN-13:</div>
                <code style={{ fontSize: '0.95rem', fontWeight: '800', color: '#10b981' }}>{previewResolvedData.barcode || 'Otomatik EAN-13'}</code>
              </div>

              <div style={{ 
                textAlign: 'center', 
                background: '#ffffff', 
                padding: '0.85rem 1rem', 
                borderRadius: '10px', 
                border: '1.5px solid #cbd5e1',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                minHeight: '95px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <BarcodePreviewCanvas 
                  barcode={previewResolvedData.barcode || previewResolvedData.sku || 'PVOG16970'} 
                  template={extraLabelTemplate} 
                  height={65} 
                />
              </div>
            </div>
          </div>

          {/* Final Action Button for Extra Print */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderTop: `1px solid ${isLight ? '#e2e8f0' : '#1e293b'}`, paddingTop: '1.25rem' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: '800' }}>
              Toplam İlave Basılacak: <span style={{ color: '#10b981', fontSize: '1.4rem' }}>{totalExtraCount}</span> Adet
            </div>

            <button
              type="button"
              onClick={handlePrintExtraLabels}
              disabled={submitting || totalExtraCount <= 0}
              style={{
                padding: '0.85rem 2.2rem',
                borderRadius: '10px',
                background: totalExtraCount <= 0 ? '#94a3b8' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                border: 'none',
                fontWeight: '900',
                fontSize: '1.05rem',
                cursor: totalExtraCount <= 0 ? 'not-allowed' : 'pointer',
                boxShadow: totalExtraCount <= 0 ? 'none' : '0 6px 20px rgba(16, 185, 129, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem'
              }}
            >
              {submitting ? '⏳ Yazıcıya Gönderiliyor...' : `🚀 SATO'dan ${totalExtraCount} Adet İlave Etiket Bas`}
            </button>
          </div>
        </div>
      )}

      {/* 7. TAB 3: ERP KESİM / BEDEN DAĞILIMI MATRIX */}
      {activeTab === 'matrix' && (
        <div style={{ 
          background: isLight ? '#ffffff' : '#0f172a', 
          borderRadius: '16px', 
          padding: '1.75rem', 
          border: `1px solid ${isLight ? '#cbd5e1' : '#334155'}`,
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.8rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#2563eb' }}>
                🏭 ERP Üretim Bilgileri (Kesim / Planlama / Ütü Paket - bsip)
              </h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                Hücrelere veya satırlara tıklayarak miktar ve beden seçimini otomatik olarak aktarabilirsiniz.
              </p>
            </div>
          </div>

          <ProductionMatrixTable 
            matrix={getSizeMatrixForOrder(order)} 
            headers={order?.SizeHeaders}
            isLight={isLight} 
            onSelectRowOrCell={(row, sz, val) => {
              if (row.gender) setSelectedGender(row.gender);
              setPrintMode('PARTIAL');
              if (sz) {
                setSelectedSize(sz);
                setQuantityInput(val);
                setSizeTransferInputs(prev => ({
                  ...prev,
                  [sz]: val
                }));
                // Also switch tab to planli so user can see it filled
                setActiveTab('planli');
                setFeedbackMsg({ type: 'info', text: `💡 Seçildi: ${row.gender} - ${sz} (${val} Adet). Planlı basım sekmesine aktarıldı.` });
              }
            }}
          />
        </div>
      )}

      {/* 8. TAB 4: KOLİ & GODEX YAZICI AYARLARI */}
      {activeTab === 'koli' && (
        <div style={{ 
          background: isLight ? '#ffffff' : '#0f172a', 
          borderRadius: '16px', 
          padding: '1.75rem', 
          border: `1px solid ${isLight ? '#cbd5e1' : '#334155'}`,
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', fontWeight: '800', color: '#f59e0b' }}>
            📦 Koli Sevkiyat & Godex G530 Yazıcı İşlemleri
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#64748b', marginBottom: '0.3rem' }}>KOLİ NUMARASI</label>
              <input 
                type="number" 
                min="1"
                value={boxNo}
                onChange={(e) => setBoxNo(parseInt(e.target.value) || 1)}
                style={{ 
                  width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', 
                  border: `1px solid ${isLight ? '#cbd5e1' : '#334155'}`, background: isLight ? '#ffffff' : '#1e293b',
                  color: 'inherit', fontSize: '1rem', fontWeight: '800'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#64748b', marginBottom: '0.3rem' }}>TOPLAM KOLİ SAYISI</label>
              <input 
                type="number" 
                min="1"
                value={totalBoxes}
                onChange={(e) => setTotalBoxes(parseInt(e.target.value) || 1)}
                style={{ 
                  width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', 
                  border: `1px solid ${isLight ? '#cbd5e1' : '#334155'}`, background: isLight ? '#ffffff' : '#1e293b',
                  color: 'inherit', fontSize: '1rem', fontWeight: '800'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button
              type="button"
              onClick={handlePrintGodexBoxLabel}
              disabled={submitting}
              style={{
                padding: '0.75rem 1.8rem',
                borderRadius: '10px',
                background: '#f59e0b',
                color: '#ffffff',
                border: 'none',
                fontWeight: '900',
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(245, 158, 11, 0.35)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              📦 Godex G530'dan Koli Etiketi Bas
            </button>
          </div>
        </div>
      )}

      {/* 9. TAB 5: FİŞ VE BASKI GEÇMİŞİ TABLOSU */}
      {activeTab === 'gecmis' && (
        <div style={{ 
          background: isLight ? '#ffffff' : '#0f172a', 
          borderRadius: '16px', 
          padding: '1.75rem', 
          border: `1px solid ${isLight ? '#cbd5e1' : '#334155'}`,
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', fontWeight: '800', color: '#2563eb' }}>
            📜 Bu Siparişe Ait Basılmış Fiş ve Etiket Geçmişi ({vouchersHistory.length} Kayıt)
          </h3>

          {vouchersHistory.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: isLight ? '#f1f5f9' : '#1e293b', borderBottom: `2px solid ${isLight ? '#cbd5e1' : '#334155'}` }}>
                    <th style={{ padding: '0.6rem 0.8rem' }}>ID / Fiş No</th>
                    <th style={{ padding: '0.6rem 0.8rem' }}>Tarih</th>
                    <th style={{ padding: '0.6rem 0.8rem' }}>Beden</th>
                    <th style={{ padding: '0.6rem 0.8rem' }}>Cinsiyet</th>
                    <th style={{ padding: '0.6rem 0.8rem' }}>Adet</th>
                    <th style={{ padding: '0.6rem 0.8rem' }}>SKU</th>
                    <th style={{ padding: '0.6rem 0.8rem' }}>EAN-13</th>
                    <th style={{ padding: '0.6rem 0.8rem' }}>Koli</th>
                    <th style={{ padding: '0.6rem 0.8rem' }}>Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {vouchersHistory.map((v, idx) => (
                    <tr key={v.id || idx} style={{ borderBottom: `1px solid ${isLight ? '#e2e8f0' : '#1e293b'}` }}>
                      <td style={{ padding: '0.6rem 0.8rem', fontWeight: '700', color: '#2563eb' }}>#{v.id}</td>
                      <td style={{ padding: '0.6rem 0.8rem', color: '#64748b' }}>
                        {v.created_at ? new Date(v.created_at).toLocaleString('tr-TR') : '---'}
                      </td>
                      <td style={{ padding: '0.6rem 0.8rem', fontWeight: '800' }}>{v.size || 'STD'}</td>
                      <td style={{ padding: '0.6rem 0.8rem' }}>{v.gender || 'Erkek'}</td>
                      <td style={{ padding: '0.6rem 0.8rem', fontWeight: '900', color: '#10b981' }}>{v.quantity} Adet</td>
                      <td style={{ padding: '0.6rem 0.8rem', fontFamily: 'monospace', fontWeight: '700' }}>{v.sku || v.code39 || '---'}</td>
                      <td style={{ padding: '0.6rem 0.8rem', fontFamily: 'monospace' }}>{v.ean13 || v.barcode || '---'}</td>
                      <td style={{ padding: '0.6rem 0.8rem' }}>{v.box_no ? `${v.box_no}/${v.total_boxes || 1}` : '---'}</td>
                      <td style={{ padding: '0.6rem 0.8rem' }}>
                        <span style={{ 
                          background: 'rgba(16, 185, 129, 0.15)', 
                          color: '#10b981', 
                          padding: '0.2rem 0.5rem', 
                          borderRadius: '6px', 
                          fontSize: '0.75rem', 
                          fontWeight: '800' 
                        }}>
                          {v.status || 'TAMAMLANDI'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
              Henüz basılmış bir etiket veya fiş kaydı bulunmamaktadır.
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default OrderLabelPrintingPage;
