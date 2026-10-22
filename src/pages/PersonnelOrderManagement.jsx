import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import API_BASE_URL from '../services/apiConfig';
import bwipjs from '@bwip-js/browser';
import PersonnelLabelAndReceiptModal from '../components/PersonnelLabelAndReceiptModal';

// Crisp dynamic barcode & QR renderer using bwip-js
const BarcodePreviewCanvas = ({ barcode, template = 'CODE128', height = 50 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const cleanText = String(barcode || 'KOLI-VW-0001').trim();
    try {
      if (template === 'QR') {
        bwipjs.toCanvas(canvasRef.current, {
          bcid: 'qrcode',
          text: cleanText,
          scale: 3,
          includetext: false
        });
      } else {
        bwipjs.toCanvas(canvasRef.current, {
          bcid: 'code128',
          text: cleanText,
          scale: 2,
          height: 12,
          includetext: true,
          textsize: 9
        });
      }
    } catch (e) {
      // preview error ignored
    }
  }, [barcode, template]);

  return (
    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <canvas ref={canvasRef} style={{ maxWidth: '100%', maxHeight: `${height}px`, display: 'block', margin: '0 auto' }} />
    </div>
  );
};

const chToPhysicalMap = {
  // Bölüm 1 (A Hattı Sol: A1 [9] + A0 [6])
  1: 'A1-1', 2: 'A1-2', 3: 'A1-3', 4: 'A1-4', 5: 'A1-5', 6: 'A1-6', 7: 'A1-7', 8: 'A1-8', 9: 'A1-9',
  10: 'A0-1', 11: 'A0-2', 12: 'A0-3', 13: 'A0-4', 14: 'A0-5', 15: 'A0-6',
  // Bölüm 2 (A Hattı Sağ: A3 [9] + A4 [6])
  16: 'A3-1', 17: 'A3-2', 18: 'A3-3', 19: 'A3-4', 20: 'A3-5', 21: 'A3-6', 22: 'A3-7', 23: 'A3-8', 24: 'A3-9',
  25: 'A4-1', 26: 'A4-2', 27: 'A4-3', 28: 'A4-4', 29: 'A4-5', 30: 'A4-6',
  // Bölüm 3 (B Hattı Sol: B1 [9] + B0 [6])
  31: 'B1-1', 32: 'B1-2', 33: 'B1-3', 34: 'B1-4', 35: 'B1-5', 36: 'B1-6', 37: 'B1-7', 38: 'B1-8', 39: 'B1-9',
  40: 'B0-1', 41: 'B0-2', 42: 'B0-3', 43: 'B0-4', 44: 'B0-5', 45: 'B0-6',
  // Bölüm 4 (B Hattı Sağ: B3 [9] + B4 [6])
  46: 'B3-1', 47: 'B3-2', 48: 'B3-3', 49: 'B3-4', 50: 'B3-5', 51: 'B3-6', 52: 'B3-7', 53: 'B3-8', 54: 'B3-9',
  55: 'B4-1', 56: 'B4-2', 57: 'B4-3', 58: 'B4-4', 59: 'B4-5', 60: 'B4-6',
  // Asansör Arkası Hata/Kontrol (A2: 3 Göz)
  61: 'A2-1', 62: 'A2-2', 63: 'A2-3'
};

// Clean shoe size display helper (e.g. PVWB26001943 -> 43, PVWB260010375 -> 37.5, PVWK100100481 -> 41)
export const extractCleanShoeDisplay = (shoeCode) => {
  if (!shoeCode) return 'STD';
  const raw = String(shoeCode).trim().toUpperCase();

  // Pattern: .5 endings (e.g. 375 -> 37.5, 365 -> 36.5, 405 -> 40.5, 425 -> 42.5, 475 -> 47.5)
  const halfMatch = raw.match(/(\d{2})5$/);
  if (halfMatch && parseInt(halfMatch[1], 10) >= 35 && parseInt(halfMatch[1], 10) <= 48) {
    return `${halfMatch[1]}.5`;
  }

  // Pattern: standard 2-digit shoe size between 35 and 50
  const twoDigit = raw.match(/(3[5-9]|4[0-9]|50)$/);
  if (twoDigit) {
    return twoDigit[1];
  }

  // Special cases like PVWK100100481 (Kadın ayakkabı 41 beden)
  const endMatch = raw.match(/(\d{2,3})$/);
  if (endMatch) {
    const val = endMatch[1];
    if (val.length === 3 && val.endsWith('1')) return '41';
    if (val.length === 3) return val.slice(1);
    return val;
  }

  return raw;
};

// 8 Fiziksel Duvar / Modül Renk Standardı (Kullanıcı Talebi: %50 Transparan Opacity)
// 1. Duvar: Turuncu (%50)
// 2. Duvar: Turuncu (%50)
// 3. Duvar: Lacivert (%50)
// 4. Duvar: Lacivert (%50)
// 5. Duvar: Mor (%50)
// 6. Duvar: Mor (%50)
// 7. Duvar: Kırmızı (%50)
// 8. Duvar: Kırmızı (%50)
export const getChuteWallStyle = (chNo) => {
  const ch = parseInt(chNo, 10);
  if (ch >= 1 && ch <= 9) {
    return {
      wallIndex: 1,
      wallNum: '1. Duvar',
      moduleCode: 'Z-A1-1',
      lineName: 'A Hattı Sol Dış (Üst)',
      colorName: 'Turuncu',
      colorHex: '#ea580c',
      bg50: 'rgba(234, 88, 12, 0.50)',
      border: 'rgba(249, 115, 22, 0.85)',
      glow: '0 0 16px rgba(234, 88, 12, 0.45)',
      text: '#ffffff',
      badgeBg: '#ea580c'
    };
  }
  if (ch >= 10 && ch <= 15) {
    return {
      wallIndex: 2,
      wallNum: '2. Duvar',
      moduleCode: 'Z-A0-1',
      lineName: 'A Hattı Sol Dış (Alt)',
      colorName: 'Turuncu',
      colorHex: '#ea580c',
      bg50: 'rgba(234, 88, 12, 0.50)',
      border: 'rgba(249, 115, 22, 0.85)',
      glow: '0 0 16px rgba(234, 88, 12, 0.45)',
      text: '#ffffff',
      badgeBg: '#ea580c'
    };
  }
  if (ch >= 16 && ch <= 24) {
    return {
      wallIndex: 3,
      wallNum: '3. Duvar',
      moduleCode: 'Z-A3-1',
      lineName: 'A Hattı Sol İç (Üst)',
      colorName: 'Lacivert',
      colorHex: '#1e3a8a',
      bg50: 'rgba(30, 58, 138, 0.50)',
      border: 'rgba(59, 130, 246, 0.85)',
      glow: '0 0 16px rgba(30, 58, 138, 0.55)',
      text: '#ffffff',
      badgeBg: '#1e3a8a'
    };
  }
  if (ch >= 25 && ch <= 30) {
    return {
      wallIndex: 4,
      wallNum: '4. Duvar',
      moduleCode: 'Z-A4-1',
      lineName: 'A Hattı Sol İç (Alt)',
      colorName: 'Lacivert',
      colorHex: '#1e3a8a',
      bg50: 'rgba(30, 58, 138, 0.50)',
      border: 'rgba(59, 130, 246, 0.85)',
      glow: '0 0 16px rgba(30, 58, 138, 0.55)',
      text: '#ffffff',
      badgeBg: '#1e3a8a'
    };
  }
  if (ch >= 31 && ch <= 39) {
    return {
      wallIndex: 5,
      wallNum: '5. Duvar',
      moduleCode: 'Z-B1-1',
      lineName: 'B Hattı Sağ İç (Üst)',
      colorName: 'Mor',
      colorHex: '#7e22ce',
      bg50: 'rgba(126, 34, 206, 0.50)',
      border: 'rgba(168, 85, 247, 0.85)',
      glow: '0 0 16px rgba(126, 34, 206, 0.45)',
      text: '#ffffff',
      badgeBg: '#7e22ce'
    };
  }
  if (ch >= 40 && ch <= 45) {
    return {
      wallIndex: 6,
      wallNum: '6. Duvar',
      moduleCode: 'Z-B0-1',
      lineName: 'B Hattı Sağ İç (Alt)',
      colorName: 'Mor',
      colorHex: '#7e22ce',
      bg50: 'rgba(126, 34, 206, 0.50)',
      border: 'rgba(168, 85, 247, 0.85)',
      glow: '0 0 16px rgba(126, 34, 206, 0.45)',
      text: '#ffffff',
      badgeBg: '#7e22ce'
    };
  }
  if (ch >= 46 && ch <= 54) {
    return {
      wallIndex: 7,
      wallNum: '7. Duvar',
      moduleCode: 'Z-B3-1',
      lineName: 'B Hattı Sağ Dış (Üst)',
      colorName: 'Kırmızı',
      colorHex: '#dc2626',
      bg50: 'rgba(220, 38, 38, 0.50)',
      border: 'rgba(239, 68, 68, 0.85)',
      glow: '0 0 16px rgba(220, 38, 38, 0.45)',
      text: '#ffffff',
      badgeBg: '#dc2626'
    };
  }
  if (ch >= 55 && ch <= 60) {
    return {
      wallIndex: 8,
      wallNum: '8. Duvar',
      moduleCode: 'Z-B4-1',
      lineName: 'B Hattı Sağ Dış (Alt)',
      colorName: 'Kırmızı',
      colorHex: '#dc2626',
      bg50: 'rgba(220, 38, 38, 0.50)',
      border: 'rgba(239, 68, 68, 0.85)',
      glow: '0 0 16px rgba(220, 38, 38, 0.45)',
      text: '#ffffff',
      badgeBg: '#dc2626'
    };
  }
  return {
    wallIndex: 0,
    wallNum: 'Orta Asansör',
    moduleCode: 'Z-A2-1',
    lineName: 'Kule Hata Kontrol İstasyonu',
    colorName: 'Mavi',
    colorHex: '#0284c7',
    bg50: 'rgba(2, 132, 199, 0.50)',
    border: 'rgba(56, 189, 248, 0.85)',
    glow: '0 0 16px rgba(2, 132, 199, 0.45)',
    text: '#ffffff',
    badgeBg: '#0284c7'
  };
};

export const EIGHT_WALLS_DATA = [
  {
    wallId: 'W1',
    wallNum: '1. Duvar',
    moduleCode: 'Z-A1-1',
    name: '1. DUVAR: A Hattı Sol Dış (Üst)',
    colorName: 'Turuncu',
    colorHex: '#ea580c',
    bg50: 'rgba(234, 88, 12, 0.50)',
    border: 'rgba(249, 115, 22, 0.90)',
    glow: '0 0 16px rgba(234, 88, 12, 0.45)',
    columns: 3,
    chutes: [1, 2, 3, 4, 5, 6, 7, 8, 9] // 9 Göz (3 Sütun x 3 Satır)
  },
  {
    wallId: 'W2',
    wallNum: '2. Duvar',
    moduleCode: 'Z-A0-1',
    name: '2. DUVAR: A Hattı Sol Dış (Alt)',
    colorName: 'Turuncu',
    colorHex: '#ea580c',
    bg50: 'rgba(234, 88, 12, 0.50)',
    border: 'rgba(249, 115, 22, 0.90)',
    glow: '0 0 16px rgba(234, 88, 12, 0.45)',
    columns: 2,
    chutes: [10, 11, 12, 13, 14, 15] // 6 Göz (2 Sütun x 3 Satır)
  },
  {
    wallId: 'W3',
    wallNum: '3. Duvar',
    moduleCode: 'Z-A3-1',
    name: '3. DUVAR: A Hattı Sol İç (Üst)',
    colorName: 'Lacivert',
    colorHex: '#1e3a8a',
    bg50: 'rgba(30, 58, 138, 0.50)',
    border: 'rgba(59, 130, 246, 0.90)',
    glow: '0 0 16px rgba(30, 58, 138, 0.55)',
    columns: 3,
    chutes: [16, 17, 18, 19, 20, 21, 22, 23, 24] // 9 Göz (3 Sütun x 3 Satır)
  },
  {
    wallId: 'W4',
    wallNum: '4. Duvar',
    moduleCode: 'Z-A4-1',
    name: '4. DUVAR: A Hattı Sol İç (Alt)',
    colorName: 'Lacivert',
    colorHex: '#1e3a8a',
    bg50: 'rgba(30, 58, 138, 0.50)',
    border: 'rgba(59, 130, 246, 0.90)',
    glow: '0 0 16px rgba(30, 58, 138, 0.55)',
    columns: 2,
    chutes: [25, 26, 27, 28, 29, 30] // 6 Göz (2 Sütun x 3 Satır)
  },
  {
    wallId: 'W5',
    wallNum: '5. Duvar',
    moduleCode: 'Z-B1-1',
    name: '5. DUVAR: B Hattı Sağ İç (Üst)',
    colorName: 'Mor',
    colorHex: '#7e22ce',
    bg50: 'rgba(126, 34, 206, 0.50)',
    border: 'rgba(168, 85, 247, 0.90)',
    glow: '0 0 16px rgba(126, 34, 206, 0.45)',
    columns: 3,
    chutes: [31, 32, 33, 34, 35, 36, 37, 38, 39] // 9 Göz (3 Sütun x 3 Satır)
  },
  {
    wallId: 'W6',
    wallNum: '6. Duvar',
    moduleCode: 'Z-B0-1',
    name: '6. DUVAR: B Hattı Sağ İç (Alt)',
    colorName: 'Mor',
    colorHex: '#7e22ce',
    bg50: 'rgba(126, 34, 206, 0.50)',
    border: 'rgba(168, 85, 247, 0.90)',
    glow: '0 0 16px rgba(126, 34, 206, 0.45)',
    columns: 2,
    chutes: [40, 41, 42, 43, 44, 45] // 6 Göz (2 Sütun x 3 Satır)
  },
  {
    wallId: 'W7',
    wallNum: '7. Duvar',
    moduleCode: 'Z-B3-1',
    name: '7. DUVAR: B Hattı Sağ Dış (Üst)',
    colorName: 'Kırmızı',
    colorHex: '#dc2626',
    bg50: 'rgba(220, 38, 38, 0.50)',
    border: 'rgba(239, 68, 68, 0.90)',
    glow: '0 0 16px rgba(220, 38, 38, 0.45)',
    columns: 3,
    chutes: [46, 47, 48, 49, 50, 51, 52, 53, 54] // 9 Göz (3 Sütun x 3 Satır)
  },
  {
    wallId: 'W8',
    wallNum: '8. Duvar',
    moduleCode: 'Z-B4-1',
    name: '8. DUVAR: B Hattı Sağ Dış (Alt)',
    colorName: 'Kırmızı',
    colorHex: '#dc2626',
    bg50: 'rgba(220, 38, 38, 0.50)',
    border: 'rgba(239, 68, 68, 0.90)',
    glow: '0 0 16px rgba(220, 38, 38, 0.45)',
    columns: 2,
    chutes: [55, 56, 57, 58, 59, 60] // 6 Göz (2 Sütun x 3 Satır)
  }
];

const PersonnelOrderManagement = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { themeMode } = useLanguage();
  const isLight = themeMode === 'light';

  // 1. Filter & Selection States
  const urlBrand = searchParams.get('brand');
  const [selectedBrand, setSelectedBrand] = useState(urlBrand || 'VOLKSWAGEN');
  const [activeSorterBrand, setActiveSorterBrand] = useState(null);
  const [availableBrands, setAvailableBrands] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [dealers, setDealers] = useState([]);
  const [selectedDealer, setSelectedDealer] = useState('ALL');
  const [selectedGender, setSelectedGender] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // 2. Data States
  const [staffList, setStaffList] = useState([]);
  const [activeBoxCapacity, setActiveBoxCapacity] = useState(7);
  const [selectedStaffIds, setSelectedStaffIds] = useState([]);
  const [chutesLive, setChutesLive] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 3. Active Tabs: 'orders' (Sipariş & Kolileme), 'sorter' (Mini-Sorter 60 Göz), 'scan' (Canlı Okutma), 'dispatch' (Sevkiyat & Logo)
  const [activeTab, setActiveTab] = useState('orders');

  // 4. Modal States
  const [selectedPersonForDetail, setSelectedPersonForDetail] = useState(null);
  const [labelModalData, setLabelModalData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // 4b. Personel Fiş & Etiket Basım Modalı State
  const [selectedStaffForPrint, setSelectedStaffForPrint] = useState(null);
  const [printModalData, setPrintModalData] = useState(null);
  const [loadingPrintData, setLoadingPrintData] = useState(false);
  const [activePrintTab, setActivePrintTab] = useState('ALL'); // 'ALL' | 'RECEIPT' | 'LABELS' | 'BOX'
  const [labelBarcodeType, setLabelBarcodeType] = useState('1D'); // '1D' (Code 128) | 'QR' (Karekod)
  const [isPrintingAction, setIsPrintingAction] = useState(false);
  const [modalFeedback, setModalFeedback] = useState(null);

  // 5. Scan Terminal Input State
  const [scanInputBarcode, setScanInputBarcode] = useState('');
  const [scanHistory, setScanHistory] = useState([]);

  // 6. Sorter Assignments & View Filter States (Hangi gözde hangi personel eşleşti)
  const [sorterAssignments, setSorterAssignments] = useState([]);
  const [sorterAssignStats, setSorterAssignStats] = useState({ total_chutes: 60, assigned_count: 0, completed_count: 0 });
  const [chuteFilterTab, setChuteFilterTab] = useState('ASSIGNED'); // 'ASSIGNED' | 'COMPLETED' | 'EMPTY' | 'ALL'
  const [chuteSearchQuery, setChuteSearchQuery] = useState('');
  const [assignModalChute, setAssignModalChute] = useState(null);
  const [assignModalSearch, setAssignModalSearch] = useState('');

  // Auto-dismiss feedback message after 5 seconds
  useEffect(() => {
    if (feedbackMsg) {
      const timer = setTimeout(() => setFeedbackMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMsg]);

  // Auto-dismiss modal feedback message after 6 seconds
  useEffect(() => {
    if (modalFeedback) {
      const timer = setTimeout(() => setModalFeedback(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [modalFeedback]);

  // Load Available Brands
  const fetchBrands = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/personnel-orders/brands`);
      const data = await res.json();
      if (data.success && Array.isArray(data.brands)) {
        setAvailableBrands(data.brands);
      }
    } catch (e) {
      console.error('Failed to load brands', e);
    }
  };

  // Load Departments & Dealers when brand changes
  const fetchFilterData = async () => {
    try {
      const [deptRes, dealerRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/personnel-orders/departments?brand=${encodeURIComponent(selectedBrand)}`),
        fetch(`${API_BASE_URL}/api/personnel-orders/dealers?brand=${encodeURIComponent(selectedBrand)}&department=${encodeURIComponent(selectedDept)}`)
      ]);
      const deptData = await deptRes.json();
      const dealerData = await dealerRes.json();

      if (deptData.success) setDepartments(deptData.departments || []);
      if (dealerData.success) setDealers(dealerData.dealers || []);
    } catch (e) {
      console.error('Failed to load filter metadata', e);
    }
  };

  // Load Staff List
  const fetchStaffList = async () => {
    setLoading(true);
    try {
      const url = `${API_BASE_URL}/api/personnel-orders/staff-list?brand=${encodeURIComponent(selectedBrand)}&department=${encodeURIComponent(selectedDept)}&dealer=${encodeURIComponent(selectedDealer)}&status=${encodeURIComponent(selectedStatus)}&search=${encodeURIComponent(searchQuery)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setStaffList(data.staff || []);
        if (data.default_box_capacity) {
          setActiveBoxCapacity(Number(data.default_box_capacity));
        }
        if (data.active_sorter_brand) {
          setActiveSorterBrand(data.active_sorter_brand);
        }
      }
    } catch (e) {
      console.error('Failed to load staff list', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Koli İçi Kapasitesini Güncelle ve Diğer Sayfalarla Senkronize Et
  const handleUpdateBoxCapacity = async (newCap) => {
    const capNum = Math.max(1, parseInt(newCap, 10) || 7);
    setActiveBoxCapacity(capNum);
    try {
      await fetch(`${API_BASE_URL}/api/personnel-workflow/category-limits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ box_capacity: capNum })
      });
      fetchStaffList();
    } catch (e) {
      console.error('Koli kapasitesi güncellenemedi:', e);
    }
  };

  // Load Sorter Live Chute Status & Active Personnel Assignments
  const fetchSorterStatus = async () => {
    try {
      const [resChutes, resAssign] = await Promise.all([
        fetch(`${API_BASE_URL}/api/wms/sorter-chutes`),
        fetch(`${API_BASE_URL}/api/personnel-orders/active-sorter-assignments`)
      ]);
      if (resChutes.ok) {
        const data = await resChutes.json();
        setChutesLive(Array.isArray(data) ? data : []);
      }
      if (resAssign.ok) {
        const assignData = await resAssign.json();
        if (assignData.success) {
          setSorterAssignments(assignData.assignments || []);
          setSorterAssignStats({
            total_chutes: assignData.total_chutes || 60,
            assigned_count: assignData.assigned_count || 0,
            completed_count: assignData.completed_count || 0
          });
          if (assignData.active_brand) {
            setActiveSorterBrand(assignData.active_brand);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load sorter status', e);
    }
  };

  useEffect(() => {
    fetchFilterData();
  }, [selectedBrand]);

  useEffect(() => {
    fetchFilterData();
    fetchStaffList();
  }, [selectedBrand, selectedDept, selectedDealer, selectedStatus]);

  useEffect(() => {
    fetchBrands();
    fetchSorterStatus();
    const interval = setInterval(fetchSorterStatus, 4000);
    return () => clearInterval(interval);
  }, []);

  // Filtered staff based on client-side search and gender
  const filteredStaff = useMemo(() => {
    return staffList.filter(p => {
      if (selectedStatus === 'PENDING' && (p.packing_status === 'PACKED' || p.packing_status === 'SHIPPED')) return false;
      if (selectedStatus === 'ON_SORTER' && !p.sorter_chute) return false;
      if (selectedStatus === 'PACKED' && p.packing_status !== 'PACKED') return false;
      if (selectedStatus === 'SHIPPED' && p.packing_status !== 'SHIPPED') return false;
      if (selectedGender !== 'ALL' && (p.gender || 'Erkek').toUpperCase() !== selectedGender.toUpperCase()) {
        return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = (p.name || '').toLowerCase().includes(q);
        const matchesDealer = (p.service_center || '').toLowerCase().includes(q);
        const matchesShoe = (p.shoe_size || '').toLowerCase().includes(q);
        const matchesPart = (p.part_no || '').toLowerCase().includes(q);
        if (!matchesName && !matchesDealer && !matchesShoe && !matchesPart) return false;
      }
      return true;
    });
  }, [staffList, selectedStatus, selectedGender, searchQuery]);

  // Overall Statistics
  const stats = useMemo(() => {
    const total = staffList.length;
    const onSorter = sorterAssignStats.assigned_count > 0 ? sorterAssignStats.assigned_count : staffList.filter(p => p.sorter_chute).length;
    const packed = staffList.filter(p => p.packing_status === 'PACKED').length;
    const shipped = staffList.filter(p => p.packing_status === 'SHIPPED').length;
    const pending = total - (packed + shipped);
    return { total, onSorter, packed, shipped, pending };
  }, [staffList, sorterAssignStats]);

  // Filter eligible staff candidates for single-chute manual assignment modal
  const assignCandidates = useMemo(() => {
    if (!assignModalChute) return [];
    const q = (assignModalSearch || '').toLowerCase().trim();
    return staffList.filter(p => {
      if (p.packing_status === 'PACKED' || p.packing_status === 'SHIPPED') return false;
      if (Number(p.sorter_chute) === Number(assignModalChute)) return false;
      if (q) {
        const matchName = (p.name || '').toLowerCase().includes(q);
        const matchCenter = (p.service_center || '').toLowerCase().includes(q);
        const matchDept = (p.department || '').toLowerCase().includes(q);
        const matchPart = (p.part_no || '').toLowerCase().includes(q);
        if (!matchName && !matchCenter && !matchDept && !matchPart) return false;
      }
      return true;
    }).sort((a, b) => {
      // Unassigned personnel appear first
      if (!a.sorter_chute && b.sorter_chute) return -1;
      if (a.sorter_chute && !b.sorter_chute) return 1;
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [staffList, assignModalChute, assignModalSearch]);

  // Handle Select All
  const handleToggleSelectAll = () => {
    if (selectedStaffIds.length === filteredStaff.length) {
      setSelectedStaffIds([]);
    } else {
      setSelectedStaffIds(filteredStaff.map(p => p.id));
    }
  };

  const handleToggleStaffSelect = (id) => {
    setSelectedStaffIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Action: Allocate Selected Staff to Sorter 1-60 (1-to-1 Guaranteed Unique Allocation)
  const handleAllocateToSorter = async () => {
    if (selectedStaffIds.length === 0) {
      alert('Lütfen Sorter gözlerine atamak için en az 1 personel seçin.');
      return;
    }

    // Filter eligible staff (exclude already packed/shipped)
    const eligibleStaff = staffList.filter(p => selectedStaffIds.includes(p.id) && p.packing_status !== 'PACKED' && p.packing_status !== 'SHIPPED');
    if (eligibleStaff.length === 0) {
      alert('Seçilen personellerin tamamı zaten kolilenmiş veya sevk edilmiş durumda.');
      return;
    }

    const needsChuteCount = eligibleStaff.filter(p => !p.sorter_chute).length;
    const alreadyOnSorterCount = eligibleStaff.filter(p => p.sorter_chute).length;

    const confirmMsg = alreadyOnSorterCount > 0
      ? `Seçilen ${eligibleStaff.length} personelden ${needsChuteCount} tanesi yeni boş gözlere dağıtılacak, ${alreadyOnSorterCount} tanesi mevcut gözlerini koruyacak. Onaylıyor musunuz?`
      : `Seçilen ${eligibleStaff.length} personeli Mini-Sorter'ın boş gözlerine tekil (1-to-1) olarak dağıtmak istiyor musunuz?`;

    if (!window.confirm(confirmMsg)) {
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/personnel-orders/allocate-sorter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staff_ids: eligibleStaff.map(p => p.id),
          start_chute: 1,
          end_chute: 60,
          brand: selectedBrand
        })
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackMsg({ type: 'success', text: `✅ ${data.message}` });
        fetchStaffList();
        fetchSorterStatus();
        setSelectedStaffIds([]);
      } else {
        alert(data.message || 'Atama başarısız oldu.');
      }
    } catch (e) {
      alert('Sunucu hatası: ' + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Action: Pack Item for Personnel (Simulate or Scan drop)
  const handlePackItemForPerson = async (personId, itemType) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/personnel-orders/pack-item`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personnel_id: personId, item_type: itemType })
      });
      const data = await res.json();
      if (data.success) {
        fetchStaffList();
        fetchSorterStatus();
        if (selectedPersonForDetail && selectedPersonForDetail.id === personId) {
          setSelectedPersonForDetail(prev => ({
            ...prev,
            current_packed: Math.min(prev.total_target, prev.current_packed + 1)
          }));
        }
      }
    } catch (e) {
      console.error('Pack item error:', e);
    }
  };

  // Action: Complete Box for Personnel (Generates Box Barcode & Portrait ZPL Label)
  const handleCompleteBox = async (person, printNow = false) => {
    setIsProcessing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/personnel-orders/complete-box`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personnel_id: person.id,
          print_label: printNow,
          printer_name: 'Godex G530'
        })
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackMsg({ type: 'success', text: `📦 ${data.message}` });
        setLabelModalData({
          person: person,
          box_no: data.box_no,
          box_barcode: data.box_barcode,
          zpl: data.zpl
        });
        fetchStaffList();
        fetchSorterStatus();
      } else {
        alert(data.message || 'Koli tamamlama başarısız.');
      }
    } catch (e) {
      alert('Hata: ' + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Action: Batch Dispatch to Logo Tiger ERP
  const handleBatchDispatch = async () => {
    const packedStaff = staffList.filter(p => selectedStaffIds.includes(p.id) && p.packing_status === 'PACKED');
    if (packedStaff.length === 0) {
      alert('Lütfen sevk etmek için durumu "PACKED / Hazır" olan en az 1 personel kolisi seçin.');
      return;
    }

    if (!window.confirm(`Seçilen ${packedStaff.length} adet personel kolisini sevk etmek ve Logo Tiger ERP irsaliyesini oluşturmak istiyor musunuz?`)) {
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/personnel-orders/batch-dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staff_ids: packedStaff.map(p => p.id), create_logo_waybill: true })
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackMsg({ type: 'success', text: `🚚 ${data.message}` });
        fetchStaffList();
        setSelectedStaffIds([]);
      } else {
        alert(data.message || 'Sevkiyat başarısız.');
      }
    } catch (e) {
      alert('Hata: ' + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Action: Clear All Sorter Allocations
  const handleClearAllocations = async () => {
    if (!window.confirm('Tüm aktif personel sorter gözü tahsislerini temizlemek ve gözleri sıfırlamak istiyor musunuz?')) {
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/personnel-orders/clear-sorter-allocations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true })
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackMsg({ type: 'info', text: `🧹 ${data.message}` });
        fetchStaffList();
        fetchSorterStatus();
      }
    } catch (e) {
      alert('Hata: ' + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Action: Reset & Restart Mini-Sorter (Tam Sıfırlama & Yeniden Başlatma)
  const handleResetSorter = async () => {
    const confirmed = window.confirm(
      '⚠️ MINI-SORTER YENİDEN BAŞLATMA & SIFIRLAMA (RESET)\n\n' +
      'Mini-Sorter üzerindeki tüm aktif personel eşleşmelerini ve göz sayaçlarını sıfırlayıp sistemi yeniden başlatmak istiyor musunuz?\n\n' +
      '• 60 gözün tamamı (1-60) anında boşaltılacak\n' +
      '• PLC donanım LED ışıkları söndürülecek (LED: 0)\n' +
      '• Personellerin kolileme sayaçları sıfırlanacak\n' +
      '• Sistem yeni parti/dağıtım için hazır hale gelecek'
    );
    if (!confirmed) return;

    setIsProcessing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/personnel-orders/reset-sorter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand: selectedBrand, department: selectedDept, reset_packing_status: true })
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackMsg({ type: 'success', text: `🔄 ${data.message}` });
        fetchStaffList();
        fetchSorterStatus();
      } else {
        alert(data.message || 'Sıfırlama başarısız oldu.');
      }
    } catch (e) {
      alert('Hata: ' + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Action: Clear Single Chute Allocation
  const handleClearSingleChute = async (staffId, chuteNo, staffName) => {
    if (!window.confirm(`Göz #${chuteNo} (${staffName}) eşleşmesini kaldırıp bu gözü boşaltmak istiyor musunuz?`)) {
      return;
    }
    setIsProcessing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/personnel-orders/clear-sorter-allocations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chute_no: chuteNo, staff_ids: staffId ? [staffId] : [], all: false })
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackMsg({ type: 'info', text: `🧹 Göz #${chuteNo} (${staffName}) başarıyla boşaltıldı.` });
        fetchStaffList();
        fetchSorterStatus();
      }
    } catch (e) {
      alert('Hata: ' + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Action: Assign Selected Staff directly to specific Chute (Gözden Doğrudan Atama)
  const handleAssignStaffToChute = async (staffId, chuteNo, staffName) => {
    setIsProcessing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/personnel-orders/assign-single-chute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staff_id: staffId, chute_no: chuteNo })
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackMsg({ type: 'success', text: `🎯 ${data.message}` });
        setAssignModalChute(null);
        fetchStaffList();
        fetchSorterStatus();
      } else {
        alert(data.message || 'Atama yapılamadı.');
      }
    } catch (e) {
      alert('Hata: ' + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Action: Personel Fiş & Etiket Basım Modalını Aç
  const handleOpenLabelAndReceipt = async (person) => {
    setSelectedStaffForPrint(person);
    setLoadingPrintData(true);
    setActivePrintTab('ALL');
    try {
      const res = await fetch(`${API_BASE_URL}/api/personnel-orders/${person.id}/label-data`);
      const data = await res.json();
      if (data.success) {
        setPrintModalData(data);
      } else {
        alert(data.message || 'Etiket verisi alınamadı.');
      }
    } catch (e) {
      alert('Hata: ' + e.message);
    } finally {
      setLoadingPrintData(false);
    }
  };

  // Tarayıcı Doğrudan Yazdırma Fonksiyonu (Hidden iframe ile Pop-up Engelini %100 Aşar)
  const printHtmlBlock = (elementId, title = 'Baskı', pageFormat = 'A5') => {
    const el = document.getElementById(elementId);
    if (!el) {
      console.warn('Yazdırılacak alan bulunamadı:', elementId);
      return false;
    }

    let iframe = document.getElementById('vog-silent-print-frame');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'vog-silent-print-frame';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.opacity = '0';
      iframe.style.pointerEvents = 'none';
      document.body.appendChild(iframe);
    }

    try {
      // 1. Elementin klonunu al ve canvasları baskıda kaybolmaması için dataURL img elementine çevir
      const clone = el.cloneNode(true);
      const originalCanvases = el.querySelectorAll('canvas');
      const clonedCanvases = clone.querySelectorAll('canvas');

      originalCanvases.forEach((origCanvas, idx) => {
        const targetCanvas = clonedCanvases[idx];
        if (targetCanvas) {
          try {
            const dataUrl = origCanvas.toDataURL('image/png');
            const img = document.createElement('img');
            img.src = dataUrl;
            img.style.maxWidth = targetCanvas.style.maxWidth || '100%';
            img.style.maxHeight = targetCanvas.style.maxHeight || '100%';
            img.style.display = 'block';
            img.style.margin = '0 auto';
            targetCanvas.parentNode.replaceChild(img, targetCanvas);
          } catch (canvasErr) {
            console.warn('Canvas toDataURL error:', canvasErr);
          }
        }
      });

      const isA5 = pageFormat === 'A5' || elementId === 'personnel-receipt-print-area';
      const pageRule = isA5
        ? '@page { size: A5 portrait; margin: 5mm 6mm; }'
        : '@page { size: auto; margin: 6mm; }';

      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>${title}</title>
            <style>
              ${pageRule}
              * { box-sizing: border-box; }
              html, body {
                margin: 0;
                padding: 0;
                background: #ffffff;
                color: #000000;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                -webkit-font-smoothing: antialiased;
              }
              body {
                padding: ${isA5 ? '1mm 2mm' : '8px'};
                width: 100%;
              }
              table { width: 100%; border-collapse: collapse; }
              img { max-width: 100%; height: auto; }
              @media print {
                .no-print { display: none !important; }
                body {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                #personnel-receipt-print-area {
                  border: 1.5px solid #000 !important;
                  border-radius: 0.6rem !important;
                  box-shadow: none !important;
                  padding: 10px 14px !important;
                  margin: 0 auto !important;
                  width: 100% !important;
                  max-width: 100% !important;
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                }
              }
            </style>
          </head>
          <body>
            ${clone.outerHTML}
          </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        } catch (e) {
          console.warn('Iframe print error, falling back to window.print:', e);
          window.print();
        }
      }, 350);
      return true;
    } catch (printErr) {
      console.warn('Print iframe error:', printErr);
      return false;
    }
  };

  // Action: Fiş & Etiket Yazdırma Emri (Termal SATO/Godex + Tarayıcı Yazdırma Penceresi)
  const handlePrintVoucher = async (personId, printType = 'ALL') => {
    setIsPrintingAction(true);
    try {
      // 1. Sunucuya İlet (Termal Yazıcılar: SATO / Godex Win32 Spooler + DB Sayacı)
      const res = await fetch(`${API_BASE_URL}/api/personnel-orders/print-voucher`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personnel_id: personId,
          barcode_type: labelBarcodeType,
          print_receipt: printType === 'ALL' || printType === 'RECEIPT',
          print_labels: printType === 'ALL' || printType === 'LABELS',
          print_box: printType === 'ALL' || printType === 'BOX'
        })
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackMsg({ type: 'success', text: `🖨️ ${data.message}` });
        setModalFeedback({ type: 'success', text: `🖨️ ${data.message}` });
        // Update local status in staffList and sorterAssignments
        setStaffList(prev => prev.map(s => s.id === personId ? { ...s, voucher_status: 'BASILDI', voucher_print_count: (s.voucher_print_count || 0) + 1 } : s));
        setSorterAssignments(prev => prev.map(a => (a.staff && a.staff.id === personId) ? { ...a, staff: { ...a.staff, voucher_status: 'BASILDI' } } : a));
        if (printModalData && printModalData.staff) {
          setPrintModalData(prev => ({ ...prev, staff: { ...prev.staff, voucher_status: 'BASILDI' } }));
        }

        // 2. Fiş veya Tümü seçildiğinde A5 Üretim Fişi için tarayıcı yazdırma diyaloğunu aç
        if (printType === 'RECEIPT' || printType === 'ALL') {
          setTimeout(() => {
            printHtmlBlock('personnel-receipt-print-area', 'VOG Üretim & Sevk Fişi (A5)');
          }, 150);
        }
      } else {
        const errMsg = data.message || 'Basım emri işlenemedi.';
        setModalFeedback({ type: 'error', text: `⚠️ ${errMsg}` });
        alert(errMsg);
      }
    } catch (e) {
      setModalFeedback({ type: 'error', text: `❌ Hata: ${e.message}` });
      alert('Hata: ' + e.message);
    } finally {
      setIsPrintingAction(false);
    }
  };

  // Action: Son İşlem Adımını Değiştir (PLANLAMA, KESİM, DİKİM, ÜTÜ PAKET, TAMAMLANDI)
  const handleUpdateStep = async (personId, newStep) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/personnel-orders/update-step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personnel_id: personId, last_step: newStep })
      });
      const data = await res.json();
      if (data.success) {
        setStaffList(prev => prev.map(s => s.id === personId ? { ...s, last_step: newStep } : s));
        setFeedbackMsg({ type: 'success', text: `⚙️ İşlem adımı "${newStep}" olarak güncellendi.` });
      }
    } catch (e) {
      alert('Hata: ' + e.message);
    }
  };

  // Action: Personel Sil / Arşivle
  const handleDeleteStaff = async (personId, personName) => {
    if (!window.confirm(`⚠️ ${personName} personel kaydını ve varsa Sorter göz tahsisini silmek istediğinize emin misiniz?`)) {
      return;
    }
    setIsProcessing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/personnel-orders/delete-staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personnel_id: personId })
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackMsg({ type: 'info', text: `🗑️ ${data.message}` });
        fetchStaffList();
        fetchSorterStatus();
      } else {
        alert(data.message || 'Silme işlemi başarısız.');
      }
    } catch (e) {
      alert('Hata: ' + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Scan Terminal submission
  const handleScanSubmit = (e) => {
    e.preventDefault();
    if (!scanInputBarcode.trim()) return;

    const barcode = scanInputBarcode.trim();
    setScanInputBarcode('');

    // Try finding matching staff
    const matchedStaff = staffList.find(p =>
      (p.shoe_size && p.shoe_size.toLowerCase() === barcode.toLowerCase()) ||
      (p.box_barcode && p.box_barcode.toLowerCase() === barcode.toLowerCase()) ||
      (p.name && p.name.toLowerCase().includes(barcode.toLowerCase()))
    );

    if (matchedStaff) {
      handlePackItemForPerson(matchedStaff.id, 'Barkod Okuma');
      setScanHistory(prev => [
        { time: new Date().toLocaleTimeString(), barcode, result: 'MATCH', text: `${matchedStaff.name} (${matchedStaff.service_center}) kolisine aktarıldı -> Göz #${matchedStaff.sorter_chute || 'Yok'}` },
        ...prev.slice(0, 19)
      ]);
    } else {
      setScanHistory(prev => [
        { time: new Date().toLocaleTimeString(), barcode, result: 'UNKNOWN', text: `Barkod herhangi bir aktif personele ait bulunamadı -> Asansör Kontrol Gözü (A2-1)` },
        ...prev.slice(0, 19)
      ]);
    }
  };

  // Filtered Sorter Chute Assignments (Hangi gözde hangi personel eşleşti)
  const displayedAssignments = useMemo(() => {
    return sorterAssignments.filter(a => {
      if (chuteFilterTab === 'ASSIGNED' && !a.is_assigned) return false;
      if (chuteFilterTab === 'COMPLETED' && (!a.is_assigned || !a.is_full)) return false;
      if (chuteFilterTab === 'EMPTY' && a.is_assigned) return false;
      if (chuteSearchQuery.trim()) {
        const q = chuteSearchQuery.trim().toLowerCase();
        const sName = a.staff?.name?.toLowerCase() || '';
        const sDealer = a.staff?.service_center?.toLowerCase() || '';
        const sDept = a.staff?.department?.toLowerCase() || '';
        const chStr = `göz ${a.chute_no} ch-${a.chute_no} ${a.physical_code}`.toLowerCase();
        if (!sName.includes(q) && !sDealer.includes(q) && !sDept.includes(q) && !chStr.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [sorterAssignments, chuteFilterTab, chuteSearchQuery]);

  return (
    <div style={{
      padding: '1.5rem',
      minHeight: '100vh',
      maxWidth: '100vw',
      boxSizing: 'border-box',
      overflowX: 'hidden',
      background: isLight
        ? 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
        : 'linear-gradient(135deg, #0b0f19 0%, #020617 100%)',
      color: isLight ? '#0f172a' : '#f8fafc',
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* 1. Header & Title Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.5rem',
        marginBottom: '2rem',
        padding: '1.8rem 2.2rem',
        borderRadius: '2rem',
        background: isLight ? 'rgba(255, 255, 255, 0.85)' : 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(16px)',
        border: `1px solid ${isLight ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.08)'}`,
        boxShadow: isLight ? '0 10px 30px rgba(0,0,0,0.04)' : '0 20px 40px rgba(0,0,0,0.4)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <span style={{ fontSize: '2rem' }}>🎯</span>
            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '900', letterSpacing: '-0.5px' }}>
              Personel Bazlı Sipariş & Mini-Sorter Yönetim Merkezi
            </h1>
            <span style={{
              background: 'linear-gradient(135deg, #0066cc, #00f3ff)',
              color: '#fff',
              fontSize: '0.75rem',
              fontWeight: '900',
              padding: '0.3rem 0.8rem',
              borderRadius: '1rem',
              letterSpacing: '1px'
            }}>
              VOG WMS ENTERPRISE
            </span>
          </div>
          <p style={{ margin: '0.5rem 0 0 0', color: isLight ? '#64748b' : '#94a3b8', fontSize: '0.95rem' }}>
            Firma ve Bölüm Bazlı Otomatik Kolileme, 60 Gözlü Mini-Sorter Dağıtımı, Godex Etiketleme ve Logo Tiger ERP Kokpiti
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => { setRefreshing(true); fetchStaffList(); fetchSorterStatus(); }}
            disabled={refreshing}
            style={{
              padding: '0.75rem 1.2rem',
              borderRadius: '1.2rem',
              border: `1px solid ${isLight ? '#cbd5e1' : 'rgba(255,255,255,0.1)'}`,
              background: isLight ? '#ffffff' : 'rgba(255,255,255,0.05)',
              color: isLight ? '#0f172a' : '#f8fafc',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.2s',
              fontSize: '0.85rem'
            }}
          >
            <span style={{ display: 'inline-block', transform: refreshing ? 'rotate(360deg)' : 'none', transition: '0.5s' }}>↺</span>
            Yenile
          </button>

          <button
            onClick={() => navigate('/admin/personnel-sorter-flow')}
            style={{
              padding: '0.75rem 1.4rem',
              borderRadius: '1.2rem',
              border: '2px solid #8b5cf6',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(124, 58, 237, 0.3))',
              color: isLight ? '#7c3aed' : '#c4b5fd',
              fontWeight: '900',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.85rem',
              boxShadow: '0 4px 14px rgba(139, 92, 246, 0.3)'
            }}
            title="Firma, Sipariş, Bölüm seçimi, Depo Toplama PDF Listesi ve 60 Gözlü Sorter Döngü Yönetimi"
          >
            <span>🔄</span>
            <span>Çalışma Akışı & Depo Toplama (PDF) →</span>
          </button>

          <button
            onClick={() => navigate('/admin/iot')}
            style={{
              padding: '0.75rem 1.2rem',
              borderRadius: '1.2rem',
              border: `1px solid ${isLight ? '#38bdf8' : '#0284c7'}`,
              background: isLight ? 'rgba(56, 189, 248, 0.1)' : 'rgba(2, 132, 199, 0.2)',
              color: isLight ? '#0369a1' : '#38bdf8',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.85rem'
            }}
            title="Sipariş, Marka ve Model Bazlı Mini-Sorter Yönetim Paneli"
          >
            🤖 Sipariş Bazlı Sorter (/admin/iot)
          </button>

          <button
            onClick={handleResetSorter}
            disabled={isProcessing}
            style={{
              padding: '0.75rem 1.2rem',
              borderRadius: '1.2rem',
              border: '1px solid #ef4444',
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#ef4444',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.85rem'
            }}
            title="Tüm göz tahsislerini sıfırlar, LED'leri söndürür ve sistemi yeniden başlatır"
          >
            🔄 Sorter'ı Sıfırla (Reset)
          </button>

          <button
            onClick={() => navigate('/admin/fulfillment')}
            style={{
              padding: '0.75rem 1.2rem',
              borderRadius: '1.2rem',
              border: 'none',
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: '#fff',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
              fontSize: '0.85rem'
            }}
          >
            🏭 Koli İstasyonu
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackMsg && (
        <div style={{
          marginBottom: '1.5rem',
          padding: '1.2rem 1.6rem',
          borderRadius: '1.2rem',
          background: feedbackMsg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
          border: `1px solid ${feedbackMsg.type === 'success' ? '#10b981' : '#3b82f6'}`,
          color: feedbackMsg.type === 'success' ? '#10b981' : '#3b82f6',
          fontWeight: '800',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          animation: 'fadeIn 0.3s'
        }}>
          <div>{feedbackMsg.text}</div>
          <button
            onClick={() => setFeedbackMsg(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.2rem' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Top Filter Bar: Brand, Department, Dealer, Status */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.2rem',
        marginBottom: '2rem',
        padding: '1.5rem',
        borderRadius: '1.8rem',
        background: isLight ? 'rgba(255, 255, 255, 0.7)' : 'rgba(15, 23, 42, 0.5)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${isLight ? 'rgba(15, 23, 42, 0.06)' : 'rgba(255, 255, 255, 0.06)'}`
      }}>
        {/* Brand / Firma */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: isLight ? '#64748b' : '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
            🏢 Firma / Marka
          </label>
          <select
            value={selectedBrand}
            onChange={(e) => { setSelectedBrand(e.target.value); setSelectedDept('ALL'); setSelectedDealer('ALL'); }}
            style={{
              width: '100%',
              padding: '0.8rem 1rem',
              borderRadius: '1rem',
              border: `1px solid ${isLight ? '#cbd5e1' : 'rgba(255,255,255,0.1)'}`,
              background: isLight ? '#fff' : '#0f172a',
              color: isLight ? '#0f172a' : '#f8fafc',
              fontWeight: '800',
              fontSize: '0.95rem'
            }}
          >
            {availableBrands.length > 0 ? (
              availableBrands.map((b, i) => {
                const isSorterActive = activeSorterBrand && activeSorterBrand.toUpperCase() === b.brand.toUpperCase() && sorterAssignStats.assigned_count > 0;
                return (
                  <option key={i} value={b.brand}>
                    {isSorterActive ? '⚡ ' : ''}{b.brand} ({b.staff_count} {b.brand === 'VOLKSWAGEN' ? 'Danışman' : 'Personel'}){isSorterActive ? ` — Sorter'da Aktif (${sorterAssignStats.assigned_count} Göz)` : ''}
                  </option>
                );
              })
            ) : (
              <>
                <option value="VOLKSWAGEN">VOLKSWAGEN (442 Danışman)</option>
                <option value="SCANIA">{activeSorterBrand === 'SCANIA' && sorterAssignStats.assigned_count > 0 ? `⚡ SCANIA — Sorter'da Aktif (${sorterAssignStats.assigned_count} Göz)` : 'SCANIA (851 Personel)'}</option>
                <option value="SKODA">SKODA (285 Personel)</option>
                <option value="SEAT">SEAT (61 Personel)</option>
                <option value="AUDI">AUDI</option>
                <option value="FORD">FORD (4 Personel)</option>
              </>
            )}
          </select>
        </div>

        {/* Department / Bölüm */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: isLight ? '#64748b' : '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
            🏷️ Bölüm / Departman
          </label>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            style={{
              width: '100%',
              padding: '0.8rem 1rem',
              borderRadius: '1rem',
              border: `1px solid ${isLight ? '#cbd5e1' : 'rgba(255,255,255,0.1)'}`,
              background: isLight ? '#fff' : '#0f172a',
              color: isLight ? '#0f172a' : '#f8fafc',
              fontWeight: '800',
              fontSize: '0.95rem'
            }}
          >
            <option value="ALL">Tüm Bölümler ({departments.reduce((sum, d) => sum + parseInt(d.staff_count || 0, 10), 0)} Kişi)</option>
            {departments.map((d, i) => (
              <option key={i} value={d.department}>
                {d.department} ({d.staff_count} Kişi)
              </option>
            ))}
          </select>
        </div>

        {/* Dealer / Yetkili Satıcı */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: isLight ? '#64748b' : '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
            📍 Yetkili Satıcı / Bayi
          </label>
          <select
            value={selectedDealer}
            onChange={(e) => setSelectedDealer(e.target.value)}
            style={{
              width: '100%',
              padding: '0.8rem 1rem',
              borderRadius: '1rem',
              border: `1px solid ${isLight ? '#cbd5e1' : 'rgba(255,255,255,0.1)'}`,
              background: isLight ? '#fff' : '#0f172a',
              color: isLight ? '#0f172a' : '#f8fafc',
              fontWeight: '800',
              fontSize: '0.95rem'
            }}
          >
            <option value="ALL">Tüm Bayiler ({dealers.length} Bayi)</option>
            {dealers.map((d, i) => (
              <option key={i} value={d.dealer_name}>
                {d.dealer_name} ({d.staff_count} Kişi)
              </option>
            ))}
          </select>
        </div>

        {/* Gender / Cinsiyet */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: isLight ? '#64748b' : '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
            ⚧ Cinsiyet
          </label>
          <select
            value={selectedGender}
            onChange={(e) => setSelectedGender(e.target.value)}
            style={{
              width: '100%',
              padding: '0.8rem 1rem',
              borderRadius: '1rem',
              border: `1px solid ${isLight ? '#cbd5e1' : 'rgba(255,255,255,0.1)'}`,
              background: isLight ? '#fff' : '#0f172a',
              color: isLight ? '#0f172a' : '#f8fafc',
              fontWeight: '800',
              fontSize: '0.95rem'
            }}
          >
            <option value="ALL">Tümü (Erkek & Kadın)</option>
            <option value="Erkek">Erkek</option>
            <option value="Kadın">Kadın</option>
          </select>
        </div>

        {/* Search */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: isLight ? '#64748b' : '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
            🔍 İsim / Ayakkabı / Bayi Ara
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Personel veya bayi adı yazın..."
            style={{
              width: '100%',
              padding: '0.8rem 1rem',
              borderRadius: '1rem',
              border: `1px solid ${isLight ? '#cbd5e1' : 'rgba(255,255,255,0.1)'}`,
              background: isLight ? '#fff' : '#0f172a',
              color: isLight ? '#0f172a' : '#f8fafc',
              fontWeight: '600',
              fontSize: '0.95rem'
            }}
          />
        </div>
      </div>

      {/* 3. KPI Metrics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.2rem',
        marginBottom: '2rem'
      }}>
        {/* Total Personnel */}
        <div style={{
          padding: '1.5rem',
          borderRadius: '1.5rem',
          background: isLight ? '#fff' : 'rgba(30, 41, 59, 0.7)',
          border: `1px solid ${isLight ? '#e2e8f0' : 'rgba(255,255,255,0.06)'}`,
          boxShadow: isLight ? '0 4px 15px rgba(0,0,0,0.03)' : 'none'
        }}>
          <div style={{ fontSize: '0.8rem', color: isLight ? '#64748b' : '#94a3b8', fontWeight: '800', textTransform: 'uppercase' }}>
            👥 Toplam Personel
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: '900', marginTop: '0.4rem', color: '#3b82f6' }}>
            {stats.total}
          </div>
          <div style={{ fontSize: '0.75rem', color: isLight ? '#94a3b8' : '#64748b', marginTop: '0.2rem' }}>
            Seçili Bölüm & Kriter
          </div>
        </div>

        {/* On Sorter */}
        <div style={{
          padding: '1.5rem',
          borderRadius: '1.5rem',
          background: isLight ? '#fff' : 'rgba(30, 41, 59, 0.7)',
          border: `1px solid ${isLight ? '#e2e8f0' : 'rgba(255,255,255,0.06)'}`,
          boxShadow: isLight ? '0 4px 15px rgba(0,0,0,0.03)' : 'none'
        }}>
          <div style={{ fontSize: '0.8rem', color: isLight ? '#64748b' : '#94a3b8', fontWeight: '800', textTransform: 'uppercase' }}>
            ⚡ Sorter Gözünde Aktif
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: '900', marginTop: '0.4rem', color: '#f59e0b' }}>
            {stats.onSorter} <span style={{ fontSize: '1rem', color: '#64748b' }}>/ 60</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: isLight ? '#94a3b8' : '#64748b', marginTop: '0.2rem' }}>
            Mini-Sorter Bantında
          </div>
        </div>

        {/* Packed / Ready */}
        <div style={{
          padding: '1.5rem',
          borderRadius: '1.5rem',
          background: isLight ? '#fff' : 'rgba(30, 41, 59, 0.7)',
          border: `1px solid ${isLight ? '#e2e8f0' : 'rgba(255,255,255,0.06)'}`,
          boxShadow: isLight ? '0 4px 15px rgba(0,0,0,0.03)' : 'none'
        }}>
          <div style={{ fontSize: '0.8rem', color: isLight ? '#64748b' : '#94a3b8', fontWeight: '800', textTransform: 'uppercase' }}>
            📦 Kolilenmiş / Hazır
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: '900', marginTop: '0.4rem', color: '#10b981' }}>
            {stats.packed}
          </div>
          <div style={{ fontSize: '0.75rem', color: isLight ? '#94a3b8' : '#64748b', marginTop: '0.2rem' }}>
            Godex Etiketi Basılmış
          </div>
        </div>

        {/* Shipped */}
        <div style={{
          padding: '1.5rem',
          borderRadius: '1.5rem',
          background: isLight ? '#fff' : 'rgba(30, 41, 59, 0.7)',
          border: `1px solid ${isLight ? '#e2e8f0' : 'rgba(255,255,255,0.06)'}`,
          boxShadow: isLight ? '0 4px 15px rgba(0,0,0,0.03)' : 'none'
        }}>
          <div style={{ fontSize: '0.8rem', color: isLight ? '#64748b' : '#94a3b8', fontWeight: '800', textTransform: 'uppercase' }}>
            🚚 Sevk Edilen
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: '900', marginTop: '0.4rem', color: '#8b5cf6' }}>
            {stats.shipped}
          </div>
          <div style={{ fontSize: '0.75rem', color: isLight ? '#94a3b8' : '#64748b', marginTop: '0.2rem' }}>
            Logo Tiger İrsaliyeli
          </div>
        </div>

        {/* Pending */}
        <div style={{
          padding: '1.5rem',
          borderRadius: '1.5rem',
          background: isLight ? '#fff' : 'rgba(30, 41, 59, 0.7)',
          border: `1px solid ${isLight ? '#e2e8f0' : 'rgba(255,255,255,0.06)'}`,
          boxShadow: isLight ? '0 4px 15px rgba(0,0,0,0.03)' : 'none'
        }}>
          <div style={{ fontSize: '0.8rem', color: isLight ? '#64748b' : '#94a3b8', fontWeight: '800', textTransform: 'uppercase' }}>
            ⏳ Bekleyen Danışman
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: '900', marginTop: '0.4rem', color: '#ef4444' }}>
            {stats.pending}
          </div>
          <div style={{ fontSize: '0.75rem', color: isLight ? '#94a3b8' : '#64748b', marginTop: '0.2rem' }}>
            Kolileme Sırası Bekliyor
          </div>
        </div>
      </div>

      {/* 4. Tab Navigation Header */}
      <div style={{
        display: 'flex',
        gap: '0.8rem',
        marginBottom: '1.5rem',
        borderBottom: `2px solid ${isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)'}`,
        paddingBottom: '0.5rem'
      }}>
        {[
          { id: 'orders', label: '📋 Personel Sipariş & Kolileme Listesi', badge: filteredStaff.length },
          { id: 'sorter', label: '🏭 Mini-Sorter 60 Göz Canlı Matris', badge: `${stats.onSorter}/60` },
          { id: 'scan', label: '⚡ Canlı Okutma & Kolileme Terminali', badge: null },
          { id: 'dispatch', label: '🚚 Koli Sevkiyat & Logo Tiger ERP', badge: stats.packed }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '1rem 1.6rem',
              borderRadius: '1.2rem',
              border: 'none',
              background: activeTab === tab.id
                ? (isLight ? '#0f172a' : '#ffffff')
                : 'transparent',
              color: activeTab === tab.id
                ? (isLight ? '#ffffff' : '#0f172a')
                : (isLight ? '#64748b' : '#94a3b8'),
              fontWeight: '900',
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <span>{tab.label}</span>
            {tab.badge !== null && (
              <span style={{
                background: activeTab === tab.id ? 'rgba(0, 243, 255, 0.2)' : (isLight ? '#e2e8f0' : 'rgba(255,255,255,0.1)'),
                color: activeTab === tab.id ? (isLight ? '#fff' : '#000') : 'inherit',
                fontSize: '0.75rem',
                padding: '0.2rem 0.6rem',
                borderRadius: '0.8rem',
                fontWeight: '900'
              }}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ======================================================== */}
      {/* TAB 1: PERSONEL SİPARİŞ & KOLİLEME LİSTESİ               */}
      {/* ======================================================== */}
      {activeTab === 'orders' && (
        <div>
          {/* Aktif Sorter Partisi Bildirim Bannerı (Marka Geçiş Kolaylığı) */}
          {activeSorterBrand && activeSorterBrand.toUpperCase() !== selectedBrand.toUpperCase() && sorterAssignStats.assigned_count > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.9rem 1.4rem',
              marginBottom: '1.2rem',
              borderRadius: '1.2rem',
              background: isLight 
                ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(59, 130, 246, 0.08))' 
                : 'linear-gradient(135deg, rgba(245, 158, 11, 0.22), rgba(59, 130, 246, 0.15))',
              border: '1.5px solid #f59e0b',
              boxShadow: '0 4px 16px rgba(245, 158, 11, 0.15)',
              gap: '1rem',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: '#f59e0b',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem'
                }}>
                  ⚡
                </div>
                <div>
                  <div style={{ fontWeight: '900', fontSize: '0.98rem', color: isLight ? '#92400e' : '#fbbf24' }}>
                    Mini-Sorter'da Aktif Dağıtılmış Parti: <strong>{activeSorterBrand}</strong> ({sorterAssignStats.assigned_count} Göz Eşleşti)
                  </div>
                  <div style={{ fontSize: '0.82rem', color: isLight ? '#475569' : '#cbd5e1', marginTop: '0.15rem' }}>
                    Şu an "{selectedBrand}" markasını görüntülüyorsunuz. Sorter'daki personelleri ve döngü koli içi adetlerini takip etmek için aktif partiye geçebilirsiniz.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedBrand(activeSorterBrand);
                  setSelectedDept('ALL');
                  setSelectedDealer('ALL');
                  setSelectedStatus('ALL');
                }}
                style={{
                  padding: '0.65rem 1.3rem',
                  borderRadius: '0.8rem',
                  border: 'none',
                  background: '#f59e0b',
                  color: '#ffffff',
                  fontWeight: '900',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  whiteSpace: 'nowrap'
                }}
              >
                👉 {activeSorterBrand} Takip Ekranına Geç
              </button>
            </div>
          )}
          {/* Action Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.2rem',
            padding: '1.2rem 1.5rem',
            borderRadius: '1.5rem',
            background: isLight ? '#ffffff' : 'rgba(30, 41, 59, 0.5)',
            border: `1px solid ${isLight ? '#e2e8f0' : 'rgba(255,255,255,0.06)'}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <input
                type="checkbox"
                checked={selectedStaffIds.length === filteredStaff.length && filteredStaff.length > 0}
                onChange={handleToggleSelectAll}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span style={{ fontWeight: '800', fontSize: '0.9rem' }}>
                {selectedStaffIds.length > 0 ? `${selectedStaffIds.length} Personel Seçili` : 'Tümünü Seç'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
              <button
                onClick={handleAllocateToSorter}
                disabled={isProcessing || selectedStaffIds.length === 0}
                style={{
                  padding: '0.75rem 1.4rem',
                  borderRadius: '1rem',
                  border: 'none',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#fff',
                  fontWeight: '800',
                  fontSize: '0.85rem',
                  cursor: selectedStaffIds.length > 0 ? 'pointer' : 'not-allowed',
                  opacity: selectedStaffIds.length > 0 ? 1 : 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                }}
              >
                ⚡ Seçilileri Mini-Sorter'a Dağıt (1-60 Göz)
              </button>

              <button
                onClick={handleBatchDispatch}
                disabled={isProcessing || selectedStaffIds.length === 0}
                style={{
                  padding: '0.75rem 1.4rem',
                  borderRadius: '1rem',
                  border: 'none',
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  color: '#fff',
                  fontWeight: '800',
                  fontSize: '0.85rem',
                  cursor: selectedStaffIds.length > 0 ? 'pointer' : 'not-allowed',
                  opacity: selectedStaffIds.length > 0 ? 1 : 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                🚚 Toplu Sevk Et (Logo Tiger ERP)
              </button>

              <button
                onClick={handleClearAllocations}
                disabled={isProcessing}
                style={{
                  padding: '0.75rem 1.2rem',
                  borderRadius: '1rem',
                  border: `1px solid ${isLight ? '#cbd5e1' : 'rgba(255,255,255,0.1)'}`,
                  background: isLight ? '#f8fafc' : 'rgba(255,255,255,0.05)',
                  color: isLight ? '#64748b' : '#94a3b8',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                🧹 Sorter Gözlerini Boşalt
              </button>

              <button
                onClick={handleResetSorter}
                disabled={isProcessing}
                style={{
                  padding: '0.75rem 1.2rem',
                  borderRadius: '1rem',
                  border: '1px solid #ef4444',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  fontWeight: '800',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
                title="Tüm gözleri boşaltır, PLC LED'leri söndürür ve sorter'ı baştan başlatır"
              >
                🔄 Sorter'ı Sıfırla (Reset)
              </button>
            </div>
          </div>

          {/* Quick Filter Tabs matching screenshot */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            flexWrap: 'wrap',
            gap: '0.8rem'
          }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {[
                { id: 'ALL', label: `TÜM PERSONELLER (${staffList.length})`, color: isLight ? '#0f172a' : '#334155' },
                { id: 'PENDING', label: `BEKLEYENLER (${stats.pending})`, color: '#d97706' },
                { id: 'ON_SORTER', label: `SORTER'DA / KISMİ (${stats.onSorter})`, color: '#3b82f6' },
                { id: 'PACKED', label: `TAMAMLANANLAR (${stats.packed})`, color: '#10b981' },
                { id: 'SHIPPED', label: `SEVK EDİLENLER (${stats.shipped})`, color: '#8b5cf6' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.id === 'ON_SORTER' && activeSorterBrand && activeSorterBrand.toUpperCase() !== selectedBrand.toUpperCase() && sorterAssignStats.assigned_count > 0) {
                      setSelectedBrand(activeSorterBrand);
                      setSelectedDept('ALL');
                      setSelectedDealer('ALL');
                    }
                    setSelectedStatus(tab.id);
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.8rem',
                    border: 'none',
                    background: selectedStatus === tab.id ? tab.color : (isLight ? '#f1f5f9' : 'rgba(255,255,255,0.06)'),
                    color: selectedStatus === tab.id ? '#ffffff' : (isLight ? '#475569' : '#94a3b8'),
                    fontWeight: '800',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: selectedStatus === tab.id ? '0 2px 8px rgba(0,0,0,0.15)' : 'none'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => navigate('/admin/orders?tab=personnel')}
                style={{
                  padding: '0.45rem 1.1rem',
                  borderRadius: '0.8rem',
                  border: '1.5px solid #10b981',
                  background: isLight ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.15)',
                  color: isLight ? '#047857' : '#34d399',
                  fontWeight: '800',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15)',
                  transition: 'all 0.2s ease'
                }}
                title="Personel etiket basma işlemlerini Siparişlerim sayfasında görüntüle ve bas"
              >
                <span>🏷️</span>
                <span>Etiket Basım Merkezi (Siparişlerim) →</span>
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
                <div style={{ fontSize: '0.8rem', color: isLight ? '#64748b' : '#94a3b8', fontWeight: '700' }}>
                  Veri Kaynağı: <strong style={{ color: '#10b981' }}>Canlı PostgreSQL (personnel & sorter_mappings)</strong>
                </div>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '0.6rem',
                  background: isLight ? '#f1f5f9' : 'rgba(30, 41, 59, 0.7)',
                  border: `1px solid ${isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.1)'}`,
                  fontSize: '0.75rem'
                }}>
                  <span style={{ fontWeight: '800', color: isLight ? '#1e293b' : '#f1f5f9', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    📦 Koli İçi Kapasitesi:
                  </span>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={activeBoxCapacity}
                      onChange={(e) => handleUpdateBoxCapacity(e.target.value)}
                      style={{
                        width: '46px',
                        padding: '0.15rem',
                        borderRadius: '4px',
                        border: '1.5px solid #3b82f6',
                        textAlign: 'center',
                        fontWeight: '900',
                        fontSize: '0.8rem',
                        background: isLight ? '#ffffff' : '#0f172a',
                        color: isLight ? '#0f172a' : '#f8fafc'
                      }}
                      title="Diğer sayfalarla senkronize koli içi adet kapasitesi"
                    />
                    <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#64748b' }}>Adet</span>
                  </div>
                  <div style={{ display: 'inline-flex', gap: '0.2rem' }}>
                    {[5, 7, 8, 10].map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => handleUpdateBoxCapacity(c)}
                        style={{
                          padding: '0.1rem 0.4rem',
                          borderRadius: '4px',
                          border: activeBoxCapacity === c ? '1px solid #3b82f6' : `1px solid ${isLight ? '#cbd5e1' : 'rgba(255,255,255,0.1)'}`,
                          background: activeBoxCapacity === c ? (isLight ? '#eff6ff' : '#1e3a8a') : 'transparent',
                          color: activeBoxCapacity === c ? '#3b82f6' : (isLight ? '#64748b' : '#94a3b8'),
                          fontSize: '0.68rem',
                          fontWeight: activeBoxCapacity === c ? '900' : '700',
                          cursor: 'pointer'
                        }}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Staff Table */}
          <div style={{
            background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.7)',
            borderRadius: '1.5rem',
            overflow: 'hidden',
            border: `1px solid ${isLight ? '#e2e8f0' : 'rgba(255,255,255,0.06)'}`,
            boxShadow: isLight ? '0 10px 25px rgba(0,0,0,0.02)' : 'none'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', tableLayout: 'auto' }}>
              <thead>
                <tr style={{
                  background: isLight ? '#f1f5f9' : 'rgba(30, 41, 59, 0.8)',
                  borderBottom: `2px solid ${isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)'}`,
                  fontSize: '0.78rem',
                  color: isLight ? '#475569' : '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  <th style={{ padding: '0.85rem 0.8rem', width: '80px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <input
                        type="checkbox"
                        checked={selectedStaffIds.length === filteredStaff.length && filteredStaff.length > 0}
                        onChange={handleToggleSelectAll}
                        style={{ cursor: 'pointer' }}
                      />
                      <span>ID</span>
                    </div>
                  </th>
                  <th style={{ padding: '0.85rem 0.8rem', width: '130px', textAlign: 'center' }}>İŞLEM ADIMI</th>
                  <th style={{ padding: '0.85rem 0.8rem', minWidth: '150px' }}>MÜŞTERİ / BAYİ</th>
                  <th style={{ padding: '0.85rem 0.8rem', width: '120px' }}>PARÇA NO</th>
                  <th style={{ padding: '0.85rem 0.8rem', minWidth: '200px' }}>PERSONEL & MODEL</th>
                  <th style={{ padding: '0.85rem 0.8rem', width: '140px', textAlign: 'center' }}>SORTER GÖZÜ</th>
                  <th style={{ padding: '0.85rem 0.8rem', width: '130px' }}>KOLİLEME</th>
                  <th style={{ padding: '0.85rem 0.8rem', width: '140px', textAlign: 'center' }}>İŞLEMLER</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                      ⏳ Personel listesi yükleniyor...
                    </td>
                  </tr>
                ) : filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                      Seçilen kriterlere uygun personel bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((p, pIdx) => {
                    const isSelected = selectedStaffIds.includes(p.id);
                    const isPacked = p.packing_status === 'PACKED';
                    const isShipped = p.packing_status === 'SHIPPED';
                    const chuteCode = p.sorter_chute ? chToPhysicalMap[p.sorter_chute] || `CH-${p.sorter_chute}` : null;
                    const idShort = p.id ? String(p.id).replace(/-/g, '').substring(0, 6).toUpperCase() : `${pIdx + 1}`;
                    const partNo = p.part_no || `PVW-${idShort}`;
                    const lastStep = p.last_step || 'PLANLAMA';

                    // Step badge styles
                    const stepColors = {
                      'PLANLAMA': { bg: 'rgba(100, 116, 139, 0.15)', text: '#64748b', border: '#cbd5e1' },
                      'KESİM': { bg: 'rgba(217, 119, 6, 0.15)', text: '#d97706', border: '#fcd34d' },
                      'DİKİM': { bg: 'rgba(139, 92, 246, 0.15)', text: '#8b5cf6', border: '#c4b5fd' },
                      'ÜTÜ PAKET': { bg: 'rgba(37, 99, 235, 0.15)', text: '#2563eb', border: '#93c5fd' },
                      'TAMAMLANDI': { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: '#6ee7b7' }
                    };
                    const currentStepStyle = stepColors[lastStep] || stepColors['PLANLAMA'];

                    return (
                      <tr
                        key={p.id}
                        style={{
                          borderBottom: `1px solid ${isLight ? '#f1f5f9' : 'rgba(255,255,255,0.04)'}`,
                          background: isSelected
                            ? (isLight ? 'rgba(59, 130, 246, 0.06)' : 'rgba(59, 130, 246, 0.15)')
                            : 'transparent',
                          transition: 'background 0.2s'
                        }}
                      >
                        {/* 1. ID */}
                        <td style={{ padding: '0.75rem 0.8rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleStaffSelect(p.id)}
                              style={{ cursor: 'pointer' }}
                            />
                            <span style={{
                              fontWeight: '800',
                              fontSize: '0.75rem',
                              color: isLight ? '#64748b' : '#94a3b8',
                              fontFamily: 'monospace'
                            }}>
                              #{idShort}
                            </span>
                          </div>
                        </td>

                        {/* 2. İŞLEM ADIMI */}
                        <td style={{ padding: '0.75rem 0.8rem', textAlign: 'center' }}>
                          <select
                            value={lastStep}
                            onChange={(e) => handleUpdateStep(p.id, e.target.value)}
                            style={{
                              padding: '0.3rem 0.5rem',
                              borderRadius: '0.6rem',
                              fontSize: '0.75rem',
                              fontWeight: '900',
                              background: currentStepStyle.bg,
                              color: currentStepStyle.text,
                              border: `1px solid ${currentStepStyle.border}`,
                              cursor: 'pointer',
                              outline: 'none'
                            }}
                            title="İşlem adımını değiştirmek için seçin"
                          >
                            <option value="PLANLAMA">PLANLAMA</option>
                            <option value="KESİM">KESİM</option>
                            <option value="DİKİM">DİKİM</option>
                            <option value="ÜTÜ PAKET">ÜTÜ PAKET</option>
                            <option value="TAMAMLANDI">TAMAMLANDI</option>
                          </select>
                        </td>

                        {/* 3. MÜŞTERİ / BAYİ */}
                        <td style={{ padding: '0.75rem 0.8rem', fontWeight: '700', fontSize: '0.82rem' }}>
                          <div style={{ color: isLight ? '#0f172a' : '#f8fafc', fontWeight: '800' }}>
                            {p.service_center}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                            {p.brand || selectedBrand} YETKİLİ SERVİS
                          </div>
                        </td>

                        {/* 4. PARÇA NO */}
                        <td style={{ padding: '0.75rem 0.8rem' }}>
                          <span style={{
                            fontFamily: 'monospace',
                            fontWeight: '800',
                            fontSize: '0.78rem',
                            padding: '0.2rem 0.45rem',
                            borderRadius: '0.5rem',
                            background: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.06)',
                            color: isLight ? '#334155' : '#cbd5e1'
                          }}>
                            {partNo}
                          </span>
                        </td>

                        {/* 5. PERSONEL & MODEL */}
                        <td style={{ padding: '0.75rem 0.8rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '800', fontSize: '0.85rem' }}>
                            <span>{p.name}</span>
                            <span style={{
                              fontSize: '0.68rem',
                              padding: '0.1rem 0.4rem',
                              borderRadius: '0.4rem',
                              background: p.gender === 'Kadın' ? 'rgba(236, 72, 153, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                              color: p.gender === 'Kadın' ? '#ec4899' : '#3b82f6',
                              fontWeight: '800'
                            }}>
                              {p.gender || 'Erkek'}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.15rem' }}>
                            Mont ({p.mont_preference || 'İNCE'}) | Üst: {p.top_size || 'L'} | Alt: {p.bottom_size || '48'} | Ayak: {extractCleanShoeDisplay(p.shoe_size) || 'STD'}
                          </div>
                        </td>

                        {/* 6. SORTER GÖZÜ */}
                        <td style={{ padding: '0.75rem 0.8rem', textAlign: 'center' }}>
                          {p.sorter_chute ? (() => {
                            const wStyle = getChuteWallStyle(p.sorter_chute);
                            return (
                              <span
                                onClick={() => {
                                  setChuteSearchQuery(p.name);
                                  setChuteFilterTab('ASSIGNED');
                                  setActiveTab('sorter');
                                }}
                                className="sorter-wall-badge force-white-text"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  padding: '0.3rem 0.65rem',
                                  borderRadius: '0.65rem',
                                  background: wStyle.bg50,
                                  border: `1.5px solid ${wStyle.border}`,
                                  color: '#ffffff',
                                  WebkitTextFillColor: '#ffffff',
                                  fontWeight: '900',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer',
                                  boxShadow: wStyle.glow,
                                  textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                                  transition: 'all 0.2s'
                                }}
                                title={`${wStyle.wallNum} (${wStyle.colorName} %50) - Mini-Sorter haritasında incele`}
                              >
                                <span>🎯 GÖZ #{p.sorter_chute}</span>
                                <span style={{ fontSize: '0.68rem', opacity: 0.9 }}>({chuteCode})</span>
                              </span>
                            );
                          })() : (
                            <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Standby</span>
                          )}
                        </td>

                        {/* 7. KOLİLEME */}
                        <td style={{ padding: '0.75rem 0.8rem' }}>
                          {(() => {
                            const chuteTarget = p.chute_target_capacity ? Number(p.chute_target_capacity) : null;
                            const isAssigned = Boolean(p.sorter_chute);
                            const boxCap = chuteTarget || (isAssigned && p.box_item_target ? Number(p.box_item_target) : null) || (p.box_item_target ? Number(p.box_item_target) : null) || Number(p.box_capacity) || activeBoxCapacity || 7;
                            const currentPacked = p.current_packed || 0;
                            const totalTarget = p.total_target || boxCap;
                            const totalBoxesNeeded = p.total_boxes_needed || Math.max(1, Math.ceil(totalTarget / boxCap));
                            const percent = Math.min(100, Math.round((currentPacked / boxCap) * 100));

                            return (
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', fontWeight: '800', marginBottom: '0.25rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    <span style={{ color: isLight ? '#0f172a' : '#f8fafc', fontWeight: '900', fontSize: '0.82rem' }}>
                                      {currentPacked} / {boxCap}
                                    </span>
                                    {chuteTarget && (
                                      <span style={{
                                        fontSize: '0.62rem',
                                        padding: '0.08rem 0.35rem',
                                        borderRadius: '4px',
                                        background: isLight ? 'rgba(59, 130, 246, 0.12)' : 'rgba(59, 130, 246, 0.25)',
                                        color: isLight ? '#1d4ed8' : '#60a5fa',
                                        border: '1px solid rgba(59, 130, 246, 0.3)',
                                        fontWeight: '800',
                                        whiteSpace: 'nowrap'
                                      }} title={`Mini-Sorter ${p.sorter_chute}. Göz Hedef Kapasitesi: ${chuteTarget} Adet`}>
                                        🎯 {chuteTarget} Adet
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    {totalBoxesNeeded > 1 && (
                                      <span style={{
                                        fontSize: '0.65rem',
                                        padding: '0.1rem 0.35rem',
                                        borderRadius: '4px',
                                        background: isLight ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.25)',
                                        color: isLight ? '#b45309' : '#fbbf24',
                                        border: '1px solid rgba(245, 158, 11, 0.35)',
                                        fontWeight: '800',
                                        whiteSpace: 'nowrap'
                                      }} title={`Toplam ${totalTarget} parça için ${totalBoxesNeeded} koli planlanmıştır`}>
                                        📦 {totalBoxesNeeded} Koli
                                      </span>
                                    )}
                                    <span style={{ color: percent >= 100 ? '#10b981' : (percent > 0 ? '#3b82f6' : '#64748b') }}>
                                      %{percent}
                                    </span>
                                  </div>
                                </div>
                                <div style={{ width: '100%', height: '6px', background: isLight ? '#e2e8f0' : 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                  <div style={{
                                    width: `${percent}%`,
                                    height: '100%',
                                    background: percent >= 100
                                      ? '#10b981'
                                      : percent > 0
                                        ? '#3b82f6'
                                        : 'transparent',
                                    borderRadius: '3px',
                                    transition: 'width 0.4s ease'
                                  }} />
                                </div>
                                {totalBoxesNeeded > 1 && (
                                  <div style={{ fontSize: '0.65rem', color: isLight ? '#64748b' : '#94a3b8', marginTop: '0.2rem', textAlign: 'right' }}>
                                    Toplam: {currentPacked}/{totalTarget} parça
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </td>

                        {/* 8. İŞLEMLER (Koli Planla & Sil) */}
                        <td style={{ padding: '0.75rem 0.8rem', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', justifyContent: 'center' }}>
                            {/* Mor: KOLİ PLANLA */}
                            <button
                              type="button"
                              onClick={() => setSelectedPersonForDetail(p)}
                              title="Koli İçeriğini Planla & Ürün Detayını Yönet"
                              style={{
                                padding: '0.4rem 0.65rem',
                                borderRadius: '0.6rem',
                                border: 'none',
                                background: '#6366f1',
                                color: '#ffffff',
                                fontSize: '0.75rem',
                                fontWeight: '900',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                whiteSpace: 'nowrap',
                                boxShadow: '0 2px 6px rgba(99, 102, 241, 0.25)',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <span>📦</span>
                              <span>Koli Planla</span>
                            </button>

                            {/* Kırmızı: SİL */}
                            <button
                              type="button"
                              onClick={() => handleDeleteStaff(p.id, p.name)}
                              title="Personel kaydını ve göz tahsisini sil"
                              style={{
                                padding: '0.4rem 0.55rem',
                                borderRadius: '0.6rem',
                                border: 'none',
                                background: '#ef4444',
                                color: '#ffffff',
                                fontSize: '0.75rem',
                                fontWeight: '900',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                whiteSpace: 'nowrap',
                                boxShadow: '0 2px 6px rgba(239, 68, 68, 0.25)',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <span>🗑️</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: MINI-SORTER 60 GÖZ CANLI MATRİS PANELİ           */}
      {/* ======================================================== */}
      {activeTab === 'sorter' && (
        <div>
          {/* Header & Controls */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.5rem',
            padding: '1.2rem 1.6rem',
            borderRadius: '1.5rem',
            background: isLight ? '#ffffff' : 'rgba(30, 41, 59, 0.6)',
            border: `1px solid ${isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)'}`,
            boxShadow: isLight ? '0 4px 20px rgba(0,0,0,0.03)' : 'none'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.4rem' }}>🏭</span>
                <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '900', letterSpacing: '-0.3px' }}>
                  HC Robotics OmniSort Mini M145 - 60 Göz Canlı Yönetim
                </h2>
                <span style={{
                  padding: '0.2rem 0.6rem',
                  borderRadius: '0.6rem',
                  fontSize: '0.75rem',
                  fontWeight: '900',
                  background: 'rgba(59, 130, 246, 0.15)',
                  color: '#3b82f6',
                  letterSpacing: '0.5px'
                }}>
                  60 GÖZ PERSONEL AYRIŞTIRMA
                </span>
              </div>
              <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.85rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                Personel ↔ Göz Eşleşmeleri, Canlı Toplama Sayaçları (7 Parça) ve PLC Donanım LED Kontrolü
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={handleResetSorter}
                disabled={isProcessing}
                style={{
                  padding: '0.7rem 1.2rem',
                  borderRadius: '1rem',
                  border: '1px solid #ef4444',
                  background: 'rgba(239, 68, 68, 0.12)',
                  color: '#ef4444',
                  fontWeight: '900',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 0 15px rgba(239, 68, 68, 0.15)'
                }}
                title="Tüm göz tahsislerini temizler, PLC LED'leri söndürür ve sorter'ı sıfırlar"
              >
                🔄 Sorter'ı Sıfırla (Reset)
              </button>

              <button
                onClick={() => navigate('/admin/iot')}
                style={{
                  padding: '0.7rem 1.2rem',
                  borderRadius: '1rem',
                  border: `1px solid ${isLight ? '#38bdf8' : '#0284c7'}`,
                  background: isLight ? 'rgba(56, 189, 248, 0.1)' : 'rgba(2, 132, 199, 0.2)',
                  color: isLight ? '#0369a1' : '#38bdf8',
                  fontWeight: '800',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                🤖 Sipariş Bazlı Sorter (/admin/iot)
              </button>

              <button
                onClick={() => setActiveTab('orders')}
                style={{
                  padding: '0.7rem 1.2rem',
                  borderRadius: '1rem',
                  border: 'none',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#fff',
                  fontWeight: '800',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                ⚡ Personel Seç & Gözlere Dağıt
              </button>

              <button
                onClick={() => { setRefreshing(true); fetchSorterStatus(); fetchStaffList(); }}
                disabled={refreshing}
                style={{
                  padding: '0.7rem 1rem',
                  borderRadius: '1rem',
                  border: `1px solid ${isLight ? '#cbd5e1' : 'rgba(255,255,255,0.1)'}`,
                  background: isLight ? '#f8fafc' : 'rgba(255,255,255,0.05)',
                  color: isLight ? '#0f172a' : '#f8fafc',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                ↺ Yenile
              </button>
            </div>
          </div>

          {/* ======================================================== */}
          {/* ÖNE ÇIKAN BÖLÜM: AKTİF GÖZ ↔ PERSONEL EŞLEŞME PANELİ   */}
          {/* ======================================================== */}
          <div style={{
            marginBottom: '2rem',
            padding: '1.4rem 1.6rem',
            borderRadius: '1.8rem',
            background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.7)',
            border: `1.5px solid ${isLight ? '#cbd5e1' : 'rgba(255,255,255,0.1)'}`,
            boxShadow: isLight ? '0 10px 30px rgba(0,0,0,0.04)' : '0 20px 40px rgba(0,0,0,0.3)',
            maxWidth: '100%',
            boxSizing: 'border-box',
            overflow: 'hidden'
          }}>
            {/* KPI Counts & Filter Strip */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '1.2rem',
              paddingBottom: '1.2rem',
              borderBottom: `1px solid ${isLight ? '#f1f5f9' : 'rgba(255,255,255,0.08)'}`
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>🎯</span> Hangi Gözde Hangi Personel Eşleşti? (Canlı Eşleşme Listesi)
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                  60 Sorter gözünün canlı atama tablosu, ürün toplama sayaçları ve etiket tetikleyicisi
                </p>
              </div>

              {/* Filter Tabs */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {[
                  { id: 'ASSIGNED', label: '🎯 Eşleşen Personeller', count: sorterAssignStats.assigned_count, color: '#f59e0b' },
                  { id: 'COMPLETED', label: '🟢 Koliye Hazır (7/7)', count: sorterAssignStats.completed_count, color: '#10b981' },
                  { id: 'EMPTY', label: '⚪ Boş Gözler', count: 60 - sorterAssignStats.assigned_count, color: '#64748b' },
                  { id: 'ALL', label: '📋 Tüm Gözler (60)', count: 60, color: '#3b82f6' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setChuteFilterTab(tab.id)}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '0.8rem',
                      border: chuteFilterTab === tab.id
                        ? `2px solid ${tab.color}`
                        : `1px solid ${isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)'}`,
                      background: chuteFilterTab === tab.id
                        ? (isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.08)')
                        : 'transparent',
                      color: chuteFilterTab === tab.id ? tab.color : (isLight ? '#64748b' : '#94a3b8'),
                      fontWeight: '800',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      transition: 'all 0.2s'
                    }}
                  >
                    <span>{tab.label}</span>
                    <span style={{
                      padding: '0.15rem 0.5rem',
                      borderRadius: '1rem',
                      background: chuteFilterTab === tab.id ? tab.color : (isLight ? '#e2e8f0' : 'rgba(255,255,255,0.1)'),
                      color: chuteFilterTab === tab.id ? '#fff' : 'inherit',
                      fontSize: '0.75rem',
                      fontWeight: '900'
                    }}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input for Chute Table */}
            <div style={{ marginBottom: '1.2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1, maxWidth: '450px' }}>
                <input
                  type="text"
                  value={chuteSearchQuery}
                  onChange={(e) => setChuteSearchQuery(e.target.value)}
                  placeholder="🔍 Göz No (#12, Z-A1-1), Personel Adı veya Bayi Ara..."
                  style={{
                    width: '100%',
                    padding: '0.75rem 1.2rem',
                    borderRadius: '1rem',
                    border: `1px solid ${isLight ? '#cbd5e1' : 'rgba(255,255,255,0.12)'}`,
                    background: isLight ? '#f8fafc' : 'rgba(255,255,255,0.04)',
                    color: isLight ? '#0f172a' : '#f8fafc',
                    fontSize: '0.85rem',
                    fontWeight: '600'
                  }}
                />
                {chuteSearchQuery && (
                  <button
                    onClick={() => setChuteSearchQuery('')}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      fontWeight: '900'
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>

              <span style={{ fontSize: '0.85rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                Listelenen: <strong>{displayedAssignments.length}</strong> Göz
              </span>
            </div>

            {/* Assignments Table */}
            <div style={{
              borderRadius: '1.2rem',
              overflowX: 'auto',
              maxWidth: '100%',
              boxSizing: 'border-box',
              border: `1px solid ${isLight ? '#e2e8f0' : 'rgba(255,255,255,0.06)'}`,
              WebkitOverflowScrolling: 'touch'
            }}>
              <table style={{ width: '100%', minWidth: '950px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{
                    background: isLight ? '#f1f5f9' : 'rgba(30, 41, 59, 0.8)',
                    borderBottom: `2px solid ${isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)'}`,
                    fontSize: '0.72rem',
                    color: isLight ? '#475569' : '#94a3b8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    <th style={{ padding: '0.65rem 0.8rem', width: '110px', whiteSpace: 'nowrap' }}>Sorter Gözü</th>
                    <th style={{ padding: '0.65rem 0.8rem', whiteSpace: 'nowrap' }}>Eşleşen Personel</th>
                    <th style={{ padding: '0.65rem 0.8rem', whiteSpace: 'nowrap' }}>Yetkili Satıcı / Bayi</th>
                    <th style={{ padding: '0.65rem 0.8rem', whiteSpace: 'nowrap' }}>Bölüm & Tercih</th>
                    <th style={{ padding: '0.65rem 0.8rem', whiteSpace: 'nowrap' }}>Bedenler</th>
                    <th style={{ padding: '0.65rem 0.8rem', width: '130px', whiteSpace: 'nowrap' }}>Toplanan Parça</th>
                    <th style={{ padding: '0.65rem 0.8rem', width: '130px', whiteSpace: 'nowrap' }}>LED & Durum</th>
                    <th style={{ padding: '0.65rem 0.8rem', textAlign: 'right', width: '220px', whiteSpace: 'nowrap' }}>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedAssignments.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
                        <div style={{ fontWeight: '800', fontSize: '1rem' }}>Eşleşen Sorter Gözü Bulunamadı</div>
                        <div style={{ fontSize: '0.85rem', marginTop: '0.3rem' }}>
                          {sorterAssignStats.assigned_count === 0
                            ? "Şu anda Mini-Sorter gözlerine atanmış personel bulunmuyor. 'Personel Seç & Gözlere Dağıt' butonunu kullanarak atama yapabilirsiniz."
                            : 'Arama kriterinize veya seçili filtreye uygun göz bulunamadı.'}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    displayedAssignments.map(a => {
                      const staff = a.staff;
                      const hasStaff = a.is_assigned && !!staff;
                      const count = a.item_count || 0;
                      const cap = a.target_capacity || 7;
                      const isCompleted = count >= cap;
                      const progressPct = Math.min(100, Math.round((count / cap) * 100));

                      let rowBg = 'transparent';
                      let statusBadge = (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '0.6rem',
                          background: 'rgba(100, 116, 139, 0.15)',
                          color: '#64748b',
                          fontWeight: '800',
                          fontSize: '0.75rem'
                        }}>
                          ⚪ Boş Standby
                        </span>
                      );

                      if (isCompleted) {
                        rowBg = isLight ? 'rgba(16, 185, 129, 0.04)' : 'rgba(16, 185, 129, 0.08)';
                        statusBadge = (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '0.6rem',
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#10b981',
                            fontWeight: '900',
                            fontSize: '0.75rem'
                          }}>
                            🟢 7/7 Tamamlandı
                          </span>
                        );
                      } else if (count > 0) {
                        rowBg = isLight ? 'rgba(59, 130, 246, 0.04)' : 'rgba(59, 130, 246, 0.08)';
                        statusBadge = (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '0.6rem',
                            background: 'rgba(59, 130, 246, 0.15)',
                            color: '#3b82f6',
                            fontWeight: '900',
                            fontSize: '0.75rem'
                          }}>
                            🔵 Ürün Toplanıyor
                          </span>
                        );
                      } else if (hasStaff) {
                        rowBg = isLight ? 'rgba(245, 158, 11, 0.03)' : 'rgba(245, 158, 11, 0.06)';
                        statusBadge = (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '0.6rem',
                            background: 'rgba(245, 158, 11, 0.15)',
                            color: '#f59e0b',
                            fontWeight: '900',
                            fontSize: '0.75rem'
                          }}>
                            🟡 Rezerve Personel
                          </span>
                        );
                      }

                      return (
                        <tr
                          key={a.chute_no}
                          style={{
                            borderBottom: `1px solid ${isLight ? '#f1f5f9' : 'rgba(255,255,255,0.04)'}`,
                            background: rowBg,
                            transition: 'background 0.2s'
                          }}
                        >
                          {/* Chute No & Code */}
                          <td style={{ padding: '0.6rem 0.8rem' }}>
                            {(() => {
                              const wStyle = getChuteWallStyle(a.chute_no);
                              return (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                  <span style={{
                                    width: '12px',
                                    height: '12px',
                                    borderRadius: '50%',
                                    background: isCompleted ? '#10b981' : (hasStaff ? wStyle.colorHex : '#64748b'),
                                    boxShadow: hasStaff ? `0 0 10px ${isCompleted ? '#10b981' : wStyle.colorHex}` : 'none',
                                    border: '2px solid rgba(255,255,255,0.4)'
                                  }} />
                                  <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                      <strong style={{ fontSize: '0.92rem', color: hasStaff ? (isLight ? '#0f172a' : '#fff') : '#94a3b8' }}>
                                        Göz #{a.chute_no}
                                      </strong>
                                      <span
                                        className="sorter-wall-badge force-white-text"
                                        style={{
                                          fontSize: '0.68rem',
                                          fontWeight: '900',
                                          padding: '0.15rem 0.5rem',
                                          borderRadius: '0.5rem',
                                          background: wStyle.bg50,
                                          color: '#ffffff',
                                          WebkitTextFillColor: '#ffffff',
                                          border: `1px solid ${wStyle.border}`,
                                          textShadow: '0 1px 2px rgba(0,0,0,0.7)'
                                        }}
                                      >
                                        {wStyle.wallNum} ({wStyle.colorName})
                                      </span>
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                                      {a.physical_code} ({a.wall_id})
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </td>

                          {/* Staff Name */}
                          <td style={{ padding: '0.6rem 0.8rem' }}>
                            {hasStaff ? (
                              <div>
                                <div style={{ fontWeight: '900', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <span>{staff.gender === 'Kadın' ? '👩' : '👨'}</span>
                                  <span>{staff.name}</span>
                                </div>
                                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                  {staff.role || 'SERVİS DANIŞMANI'}
                                </div>
                              </div>
                            ) : (
                              <span style={{ color: '#64748b', fontStyle: 'italic' }}>— Müsait Boş Göz —</span>
                            )}
                          </td>

                          {/* Dealer */}
                          <td style={{ padding: '0.6rem 0.8rem' }}>
                            {hasStaff ? (
                              <div style={{ fontWeight: '700', color: isLight ? '#1e293b' : '#e2e8f0', fontSize: '0.82rem' }}>
                                {staff.service_center}
                              </div>
                            ) : (
                              <span style={{ color: '#64748b' }}>—</span>
                            )}
                          </td>

                          {/* Department & Mont Preference */}
                          <td style={{ padding: '0.6rem 0.8rem' }}>
                            {hasStaff ? (
                              <span style={{
                                display: 'inline-block',
                                padding: '0.2rem 0.55rem',
                                borderRadius: '0.6rem',
                                fontSize: '0.7rem',
                                fontWeight: '800',
                                background: staff.mont_preference === 'KALIN'
                                  ? 'rgba(249, 115, 22, 0.15)'
                                  : 'rgba(6, 182, 212, 0.15)',
                                color: staff.mont_preference === 'KALIN' ? '#f97316' : '#06b6d4'
                              }}>
                                {staff.mont_preference === 'KALIN' ? '🧥 KALIN MONT' : '🦺 İNCE MONT'}
                              </span>
                            ) : (
                              <span style={{ color: '#64748b' }}>—</span>
                            )}
                          </td>

                          {/* Sizes */}
                          <td style={{ padding: '0.6rem 0.8rem' }}>
                            {hasStaff ? (
                              <div style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                                <span style={{ fontWeight: '700' }}>Üst: {staff.top_size || 'L'}</span> | Alt: {staff.bottom_size || '48'} | <span style={{ color: '#64748b' }}>Ayk: {extractCleanShoeDisplay(staff.shoe_size) || 'STD'}</span>
                              </div>
                            ) : (
                              <span style={{ color: '#64748b' }}>—</span>
                            )}
                          </td>

                          {/* Progress */}
                          <td style={{ padding: '0.6rem 0.8rem' }}>
                            {hasStaff ? (
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: '800', marginBottom: '0.3rem' }}>
                                  <span>{count} / {cap} Parça</span>
                                  <span style={{ color: isCompleted ? '#10b981' : '#f59e0b' }}>%{progressPct}</span>
                                </div>
                                <div style={{ height: '6px', borderRadius: '3px', background: isLight ? '#e2e8f0' : 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                                  <div style={{
                                    height: '100%',
                                    width: `${progressPct}%`,
                                    background: isCompleted ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #f59e0b, #d97706)',
                                    borderRadius: '3px',
                                    transition: 'width 0.3s ease'
                                  }} />
                                </div>
                              </div>
                            ) : (
                              <span style={{ color: '#64748b', fontSize: '0.8rem' }}>0 / {cap}</span>
                            )}
                          </td>

                          {/* LED & Durum */}
                          <td style={{ padding: '0.6rem 0.8rem' }}>
                            {statusBadge}
                          </td>

                          {/* Action Buttons */}
                          <td style={{ padding: '0.6rem 0.8rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                            {hasStaff ? (
                              <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                                <button
                                  onClick={() => handleOpenLabelAndReceipt(staff)}
                                  style={{
                                    padding: '0.35rem 0.6rem',
                                    borderRadius: '0.6rem',
                                    border: 'none',
                                    background: '#10b981',
                                    color: '#ffffff',
                                    fontSize: '0.72rem',
                                    fontWeight: '900',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    whiteSpace: 'nowrap',
                                    boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)'
                                  }}
                                  title="Bu personelin A5 Üretim Fişini ve 7 Parça Etiketini Önizle / Bas"
                                >
                                  🏷️ FİŞ & ETİKET BAS
                                </button>

                                <button
                                  onClick={() => handleCompleteBox(staff, false)}
                                  style={{
                                    padding: '0.35rem 0.6rem',
                                    borderRadius: '0.6rem',
                                    border: 'none',
                                    background: isCompleted ? '#6366f1' : (isLight ? '#0f172a' : '#fff'),
                                    color: isCompleted ? '#fff' : (isLight ? '#fff' : '#0f172a'),
                                    fontSize: '0.72rem',
                                    fontWeight: '800',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    whiteSpace: 'nowrap'
                                  }}
                                  title="Kolilemeyi tamamlar ve Godex etiketini hazırlar"
                                >
                                  📦 KOLİ BİTİR
                                </button>

                                <button
                                  onClick={() => handleClearSingleChute(staff.id, a.chute_no, staff.name)}
                                  disabled={isProcessing}
                                  style={{
                                    padding: '0.35rem 0.5rem',
                                    borderRadius: '0.6rem',
                                    border: `1px solid ${isLight ? '#fca5a5' : 'rgba(239, 68, 68, 0.3)'}`,
                                    background: 'rgba(239, 68, 68, 0.08)',
                                    color: '#ef4444',
                                    fontSize: '0.72rem',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap'
                                  }}
                                  title="Bu personeli gözden çıkarır ve gözü boşaltır"
                                >
                                  ❌ BOŞALT
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => { setAssignModalChute(a.chute_no); setAssignModalSearch(''); }}
                                style={{
                                  padding: '0.4rem 0.85rem',
                                  borderRadius: '0.7rem',
                                  border: '1px solid #3b82f6',
                                  background: 'rgba(59, 130, 246, 0.12)',
                                  color: '#3b82f6',
                                  fontSize: '0.75rem',
                                  fontWeight: '800',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                  boxShadow: '0 2px 6px rgba(59, 130, 246, 0.15)'
                                }}
                              >
                                🎯 Personel Ata
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SAHA MATRİSİ: 8 FİZİKSEL DUVAR (1-60 GÖZ)               */}
          {/* ======================================================== */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.2rem',
            padding: '0 0.5rem',
            flexWrap: 'wrap',
            gap: '0.8rem'
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>📐</span> 8 Fiziksel Sorter Duvarı (%50 Transparan Saha Matrisi)
              </h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                1-2. Duvar Turuncu, 3-4. Duvar Lacivert, 5-6. Duvar Mor, 7-8. Duvar Kırmızı (%50 Opacity)
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <span className="sorter-wall-badge force-white-text" style={{ fontSize: '0.72rem', fontWeight: '900', padding: '0.25rem 0.55rem', borderRadius: '0.5rem', background: 'rgba(234, 88, 12, 0.75)', color: '#ffffff', WebkitTextFillColor: '#ffffff', border: '1.5px solid rgba(249, 115, 22, 0.9)', boxShadow: '0 0 8px rgba(234, 88, 12, 0.3)', textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}>
                🟧 1. Duvar (Turuncu %50)
              </span>
              <span className="sorter-wall-badge force-white-text" style={{ fontSize: '0.72rem', fontWeight: '900', padding: '0.25rem 0.55rem', borderRadius: '0.5rem', background: 'rgba(234, 88, 12, 0.75)', color: '#ffffff', WebkitTextFillColor: '#ffffff', border: '1.5px solid rgba(249, 115, 22, 0.9)', boxShadow: '0 0 8px rgba(234, 88, 12, 0.3)', textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}>
                🟧 2. Duvar (Turuncu %50)
              </span>
              <span className="sorter-wall-badge force-white-text" style={{ fontSize: '0.72rem', fontWeight: '900', padding: '0.25rem 0.55rem', borderRadius: '0.5rem', background: 'rgba(30, 58, 138, 0.75)', color: '#ffffff', WebkitTextFillColor: '#ffffff', border: '1.5px solid rgba(59, 130, 246, 0.9)', boxShadow: '0 0 8px rgba(30, 58, 138, 0.3)', textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}>
                🟦 3. Duvar (Lacivert %50)
              </span>
              <span className="sorter-wall-badge force-white-text" style={{ fontSize: '0.72rem', fontWeight: '900', padding: '0.25rem 0.55rem', borderRadius: '0.5rem', background: 'rgba(30, 58, 138, 0.75)', color: '#ffffff', WebkitTextFillColor: '#ffffff', border: '1.5px solid rgba(59, 130, 246, 0.9)', boxShadow: '0 0 8px rgba(30, 58, 138, 0.3)', textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}>
                🟦 4. Duvar (Lacivert %50)
              </span>
              <span className="sorter-wall-badge force-white-text" style={{ fontSize: '0.72rem', fontWeight: '900', padding: '0.25rem 0.55rem', borderRadius: '0.5rem', background: 'rgba(126, 34, 206, 0.75)', color: '#ffffff', WebkitTextFillColor: '#ffffff', border: '1.5px solid rgba(168, 85, 247, 0.9)', boxShadow: '0 0 8px rgba(126, 34, 206, 0.3)', textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}>
                🟪 5. Duvar (Mor %50)
              </span>
              <span className="sorter-wall-badge force-white-text" style={{ fontSize: '0.72rem', fontWeight: '900', padding: '0.25rem 0.55rem', borderRadius: '0.5rem', background: 'rgba(126, 34, 206, 0.75)', color: '#ffffff', WebkitTextFillColor: '#ffffff', border: '1.5px solid rgba(168, 85, 247, 0.9)', boxShadow: '0 0 8px rgba(126, 34, 206, 0.3)', textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}>
                🟪 6. Duvar (Mor %50)
              </span>
              <span className="sorter-wall-badge force-white-text" style={{ fontSize: '0.72rem', fontWeight: '900', padding: '0.25rem 0.55rem', borderRadius: '0.5rem', background: 'rgba(220, 38, 38, 0.75)', color: '#ffffff', WebkitTextFillColor: '#ffffff', border: '1.5px solid rgba(239, 68, 68, 0.9)', boxShadow: '0 0 8px rgba(220, 38, 38, 0.3)', textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}>
                🟥 7. Duvar (Kırmızı %50)
              </span>
              <span className="sorter-wall-badge force-white-text" style={{ fontSize: '0.72rem', fontWeight: '900', padding: '0.25rem 0.55rem', borderRadius: '0.5rem', background: 'rgba(220, 38, 38, 0.75)', color: '#ffffff', WebkitTextFillColor: '#ffffff', border: '1.5px solid rgba(239, 68, 68, 0.9)', boxShadow: '0 0 8px rgba(220, 38, 38, 0.3)', textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}>
                🟥 8. Duvar (Kırmızı %50)
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
            {[
              [EIGHT_WALLS_DATA[0], EIGHT_WALLS_DATA[1]], // A Hattı Sol Dış: 1. Duvar (Üst - 9 Göz - 3 Sütun) & 2. Duvar (Alt - 6 Göz - 2 Sütun)
              [EIGHT_WALLS_DATA[2], EIGHT_WALLS_DATA[3]], // A Hattı Sol İç: 3. Duvar (Üst - 9 Göz - 3 Sütun) & 4. Duvar (Alt - 6 Göz - 2 Sütun)
              [EIGHT_WALLS_DATA[4], EIGHT_WALLS_DATA[5]], // B Hattı Sağ İç: 5. Duvar (Üst - 9 Göz - 3 Sütun) & 6. Duvar (Alt - 6 Göz - 2 Sütun)
              [EIGHT_WALLS_DATA[6], EIGHT_WALLS_DATA[7]]  // B Hattı Sağ Dış: 7. Duvar (Üst - 9 Göz - 3 Sütun) & 8. Duvar (Alt - 6 Göz - 2 Sütun)
            ].map(([upperWall, lowerWall]) => (
              <div
                key={upperWall.wallId}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 3fr) minmax(0, 2fr)',
                  gap: '1.4rem',
                  alignItems: 'stretch'
                }}
              >
                {[upperWall, lowerWall].map(wall => (
                  <div
                    key={wall.wallId}
                    style={{
                      padding: '1.1rem',
                      borderRadius: '1.4rem',
                      background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.8)',
                      border: `2px solid ${wall.border}`,
                      boxShadow: isLight ? '0 6px 20px rgba(0,0,0,0.04)' : `0 10px 30px rgba(0,0,0,0.4), 0 0 15px ${wall.bg50}`,
                      overflow: 'hidden',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', borderBottom: `1px solid ${isLight ? '#f1f5f9' : 'rgba(255,255,255,0.08)'}`, paddingBottom: '0.5rem' }}>
                      <div>
                        <div style={{ fontWeight: '900', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span>{wall.name}</span>
                          <span
                            className="sorter-wall-badge force-white-text"
                            style={{
                              padding: '0.15rem 0.55rem',
                              borderRadius: '0.45rem',
                              fontSize: '0.7rem',
                              fontWeight: '900',
                              background: wall.colorHex,
                              color: '#ffffff',
                              WebkitTextFillColor: '#ffffff',
                              textShadow: '0 1px 2px rgba(0,0,0,0.7)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.25)'
                            }}
                          >
                            {wall.colorName} (%50)
                          </span>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: isLight ? '#64748b' : '#94a3b8', marginTop: '0.1rem' }}>
                          Modül {wall.moduleCode} • {wall.lineName}
                        </div>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '800' }}>{wall.chutes.length} Göz</span>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(${wall.columns || (wall.chutes.length === 6 ? 2 : 3)}, minmax(0, 1fr))`,
                      gap: '0.65rem',
                      flex: 1
                    }}>
                      {wall.chutes.map(chNo => {
                        const assignItem = sorterAssignments.find(a => a.chute_no === chNo);
                        const chState = chutesLive.find(c => c.chute_no === chNo) || {};
                        const assignedStaff = assignItem?.staff || staffList.find(s => s.sorter_chute === chNo);
                        const hasStaff = !!assignedStaff;
                        const count = Number(assignItem?.item_count ?? chState.item_count ?? (assignedStaff?.chute_item_count || 0));
                        const cap = assignItem?.target_capacity || chState.target_capacity || 7;
                        const isFull = hasStaff && count >= cap && count > 0;
                        const wallStyle = getChuteWallStyle(chNo);

                        // %50 Transparent Opacity Arka Plan (Atanmış gözlerde renkli, boş gözlerde nötr standby)
                        const bg = hasStaff ? wallStyle.bg50 : (isLight ? 'rgba(241, 245, 249, 0.45)' : 'rgba(255, 255, 255, 0.03)');
                        const borderColor = isFull ? '#10b981' : (count > 0 ? '#38bdf8' : (hasStaff ? '#fbbf24' : (isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.12)')));

                        return (
                          <div
                            key={chNo}
                            style={{
                              padding: '0.65rem 0.55rem',
                              borderRadius: '0.85rem',
                              background: bg,
                              border: `2px solid ${borderColor}`,
                              boxShadow: isFull ? '0 0 16px rgba(16, 185, 129, 0.45)' : (hasStaff ? wallStyle.glow : 'none'),
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              minHeight: '136px',
                              height: '136px',
                              boxSizing: 'border-box',
                              gap: '0.3rem',
                              transition: 'all 0.2s',
                              position: 'relative',
                              color: '#ffffff',
                              minWidth: 0,
                              overflow: 'hidden'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: '900', color: '#ffffff', textShadow: '0 1px 3px rgba(0,0,0,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                #{chNo} <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.85)' }}>({chToPhysicalMap[chNo]})</span>
                              </span>
                              <span style={{
                                fontSize: '0.68rem',
                                fontWeight: '900',
                                padding: '0.12rem 0.35rem',
                                borderRadius: '0.4rem',
                                background: isFull ? '#10b981' : (count > 0 ? '#0284c7' : (hasStaff ? '#d97706' : 'rgba(0,0,0,0.4)')),
                                color: '#ffffff',
                                textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                                whiteSpace: 'nowrap'
                              }}>
                                {isFull ? '🟢 7/7' : `${count}/${cap}`}
                              </span>
                            </div>

                            {hasStaff ? (
                              <>
                                <div>
                                  <div style={{ fontSize: '0.78rem', fontWeight: '900', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textShadow: '0 1px 3px rgba(0,0,0,0.6)' }} title={assignedStaff.name}>
                                    {assignedStaff.name}
                                  </div>
                                  <div style={{ fontSize: '0.66rem', color: 'rgba(255,255,255,0.9)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={assignedStaff.service_center}>
                                    {assignedStaff.service_center}
                                  </div>
                                  <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {assignedStaff.top_size || 'L'} / {assignedStaff.bottom_size || '48'} / {extractCleanShoeDisplay(assignedStaff.shoe_size) || 'STD'}
                                  </div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.2rem', marginTop: 'auto' }}>
                                  <button
                                    onClick={() => handleOpenLabelAndReceipt(assignedStaff)}
                                    style={{
                                      flex: 1,
                                      minWidth: 0,
                                      padding: '0.32rem 0.2rem',
                                      borderRadius: '0.45rem',
                                      border: 'none',
                                      background: '#10b981',
                                      color: '#fff',
                                      fontSize: '0.58rem',
                                      fontWeight: '900',
                                      cursor: 'pointer',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: '0.15rem',
                                      boxShadow: '0 2px 5px rgba(0,0,0,0.25)'
                                    }}
                                    title="Bu personelin A5 Fişini ve 7 Parça Etiketini Aç"
                                  >
                                    <span>🏷️</span>
                                    <span>Fiş/Etiket</span>
                                  </button>
                                  <button
                                    onClick={() => handleCompleteBox(assignedStaff, false)}
                                    style={{
                                      flex: 1,
                                      minWidth: 0,
                                      padding: '0.32rem 0.2rem',
                                      borderRadius: '0.45rem',
                                      border: 'none',
                                      background: isFull ? '#6366f1' : 'rgba(0,0,0,0.5)',
                                      color: '#fff',
                                      fontSize: '0.58rem',
                                      fontWeight: '800',
                                      cursor: 'pointer',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: '0.15rem',
                                      boxShadow: '0 2px 5px rgba(0,0,0,0.25)'
                                    }}
                                    title="Kolilemeyi tamamla"
                                  >
                                    <span>📦</span>
                                    <span>Koli Bitir</span>
                                  </button>
                                </div>
                              </>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1, paddingTop: '0.3rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.75)', fontStyle: 'italic', margin: 'auto 0' }}>
                                  — Boş Göz —
                                </div>
                                <button
                                  onClick={() => { setAssignModalChute(chNo); setAssignModalSearch(''); }}
                                  style={{
                                    width: '100%',
                                    padding: '0.32rem 0.35rem',
                                    borderRadius: '0.45rem',
                                    border: '1px solid rgba(255,255,255,0.7)',
                                    background: 'rgba(0,0,0,0.35)',
                                    color: '#ffffff',
                                    fontSize: '0.65rem',
                                    fontWeight: '900',
                                    cursor: 'pointer'
                                  }}
                                >
                                  🎯 Personel Ata
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Elevator Chutes: 61, 62, 63 */}
          <div style={{
            marginTop: '1.5rem',
            padding: '1.2rem',
            borderRadius: '1.5rem',
            background: isLight ? '#fff' : 'rgba(15, 23, 42, 0.65)',
            border: `1px solid ${isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)'}`
          }}>
            <div style={{ fontWeight: '900', fontSize: '0.9rem', marginBottom: '0.8rem', color: '#ef4444' }}>
              ⚠️ Asansör Arkası Kontrol & Hata Gözleri (A2 Modülü)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              {[61, 62, 63].map(chNo => {
                const chState = chutesLive.find(c => c.chute_no === chNo) || {};
                return (
                  <div key={chNo} style={{
                    padding: '0.8rem 1.2rem',
                    borderRadius: '1rem',
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontWeight: '900', fontSize: '0.85rem' }}>Göz #{chNo} ({chToPhysicalMap[chNo]})</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Tanımsız / Hatalı Parça Sepeti</div>
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#ef4444' }}>
                      {chState.item_count || 0} Adet
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: CANLI OKUTMA & KOLİLEME TERMİNALİ                */}
      {/* ======================================================== */}
      {activeTab === 'scan' && (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{
            padding: '2.5rem',
            borderRadius: '2rem',
            background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.7)',
            border: `1px solid ${isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)'}`,
            boxShadow: isLight ? '0 15px 35px rgba(0,0,0,0.04)' : 'none',
            marginBottom: '2rem'
          }}>
            <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.4rem', fontWeight: '900' }}>
              ⚡ Canlı Ürün Okutma & Kolileme İstasyonu
            </h2>
            <p style={{ margin: '0 0 1.5rem 0', color: isLight ? '#64748b' : '#94a3b8', fontSize: '0.9rem' }}>
              Ürün barkodunu veya ayakkabı parça kodunu okutun; sistem ürünü otomatik olarak personelin Mini-Sorter gözüne yönlendirir.
            </p>

            <form onSubmit={handleScanSubmit} style={{ display: 'flex', gap: '1rem' }}>
              <input
                type="text"
                value={scanInputBarcode}
                onChange={(e) => setScanInputBarcode(e.target.value)}
                placeholder="Barkod / Ayakkabı Kodu / RFID EPC okutun..."
                autoFocus
                style={{
                  flex: 1,
                  padding: '1.1rem 1.4rem',
                  borderRadius: '1.2rem',
                  border: `2px solid ${isLight ? '#3b82f6' : '#2563eb'}`,
                  background: isLight ? '#f8fafc' : '#0f172a',
                  color: isLight ? '#0f172a' : '#f8fafc',
                  fontSize: '1.1rem',
                  fontWeight: '800',
                  boxShadow: '0 0 15px rgba(59, 130, 246, 0.2)'
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '0 2rem',
                  borderRadius: '1.2rem',
                  border: 'none',
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  color: '#fff',
                  fontSize: '1rem',
                  fontWeight: '900',
                  cursor: 'pointer'
                }}
              >
                Gözüne Yönlendir
              </button>
            </form>
          </div>

          {/* Scan Log History */}
          <div style={{
            padding: '1.5rem',
            borderRadius: '1.5rem',
            background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.5)',
            border: `1px solid ${isLight ? '#e2e8f0' : 'rgba(255,255,255,0.06)'}`
          }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '800' }}>
              📜 Anlık Okutma & Ayrıştırma Geçmişi
            </h3>
            {scanHistory.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                Henüz ürün okutulmadı.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {scanHistory.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '0.8rem 1.2rem',
                      borderRadius: '0.8rem',
                      background: item.result === 'MATCH' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      border: `1px solid ${item.result === 'MATCH' ? '#10b981' : '#ef4444'}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.85rem'
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: '900', marginRight: '0.8rem' }}>{item.barcode}</span>
                      <span>{item.text}</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: KOLİ SEVKİYAT & LOGO TIGER ERP ENTEGRASYONU       */}
      {/* ======================================================== */}
      {activeTab === 'dispatch' && (
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            padding: '1.5rem 2rem',
            borderRadius: '1.5rem',
            background: isLight ? '#fff' : 'rgba(30, 41, 59, 0.6)',
            border: `1px solid ${isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)'}`
          }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '900' }}>
                🚚 Hazır Personel Kolileri & Logo Tiger ERP Sevk Kokpiti
              </h2>
              <p style={{ margin: '0.3rem 0 0 0', color: isLight ? '#64748b' : '#94a3b8', fontSize: '0.85rem' }}>
                Paketlenmiş kolileri toplu olarak sevk irsaliyesine dönüştürün ve LOGO Tiger ERP'ye otomatik işleyin.
              </p>
            </div>

            <button
              onClick={handleBatchDispatch}
              disabled={isProcessing}
              style={{
                padding: '0.9rem 1.8rem',
                borderRadius: '1.2rem',
                border: 'none',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff',
                fontSize: '0.95rem',
                fontWeight: '900',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.35)'
              }}
            >
              📄 Toplu Sevk İrsaliyesi Kes & Gönder
            </button>
          </div>

          {/* List of Packed / Shipped boxes */}
          <div style={{
            background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.7)',
            borderRadius: '1.5rem',
            overflow: 'hidden',
            border: `1px solid ${isLight ? '#e2e8f0' : 'rgba(255,255,255,0.06)'}`
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{
                  background: isLight ? '#f1f5f9' : 'rgba(30, 41, 59, 0.8)',
                  fontSize: '0.8rem',
                  color: isLight ? '#475569' : '#94a3b8',
                  textTransform: 'uppercase'
                }}>
                  <th style={{ padding: '1rem 1.2rem' }}>Koli Barkodu</th>
                  <th style={{ padding: '1rem 1.2rem' }}>Personel</th>
                  <th style={{ padding: '1rem 1.2rem' }}>Bayi</th>
                  <th style={{ padding: '1rem 1.2rem' }}>Bölüm</th>
                  <th style={{ padding: '1rem 1.2rem' }}>Toplam Ürün</th>
                  <th style={{ padding: '1rem 1.2rem' }}>Durum</th>
                  <th style={{ padding: '1rem 1.2rem', textAlign: 'right' }}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {staffList.filter(p => p.packing_status === 'PACKED' || p.packing_status === 'SHIPPED').length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                      Henüz kolilenmiş personel bulunmuyor. Personel listesinden "Koli Bitir" işlemi yapabilirsiniz.
                    </td>
                  </tr>
                ) : (
                  staffList.filter(p => p.packing_status === 'PACKED' || p.packing_status === 'SHIPPED').map(p => (
                    <tr key={p.id} style={{ borderBottom: `1px solid ${isLight ? '#f1f5f9' : 'rgba(255,255,255,0.04)'}` }}>
                      <td style={{ padding: '1rem 1.2rem', fontWeight: '900', color: '#3b82f6' }}>
                        {p.box_barcode || `KOLI-VW-${p.box_no || '001'}`}
                      </td>
                      <td style={{ padding: '1rem 1.2rem', fontWeight: '800' }}>{p.name}</td>
                      <td style={{ padding: '1rem 1.2rem' }}>{p.service_center}</td>
                      <td style={{ padding: '1rem 1.2rem' }}>{p.department}</td>
                      <td style={{ padding: '1rem 1.2rem', fontWeight: '800' }}>7 Adet (Set)</td>
                      <td style={{ padding: '1rem 1.2rem' }}>
                        <span style={{
                          padding: '0.25rem 0.7rem',
                          borderRadius: '0.6rem',
                          fontSize: '0.75rem',
                          fontWeight: '800',
                          background: p.packing_status === 'SHIPPED' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          color: p.packing_status === 'SHIPPED' ? '#8b5cf6' : '#10b981'
                        }}>
                          {p.packing_status === 'SHIPPED' ? '🚚 SEVK EDİLDİ' : '📦 HAZIR / PACKED'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.2rem', textAlign: 'right' }}>
                        <button
                          onClick={() => handleCompleteBox(p, false)}
                          style={{
                            padding: '0.4rem 0.8rem',
                            borderRadius: '0.6rem',
                            border: `1px solid ${isLight ? '#cbd5e1' : 'rgba(255,255,255,0.1)'}`,
                            background: 'transparent',
                            color: 'inherit',
                            fontWeight: '700',
                            fontSize: '0.8rem',
                            cursor: 'pointer'
                          }}
                        >
                          🏷️ Etiketi Gör
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: PERSONEL KOLİ DETAY & ÜRÜN ÇEKMECESİ             */}
      {/* ======================================================== */}
      {selectedPersonForDetail && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.5rem'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '650px',
            background: isLight ? '#ffffff' : '#0f172a',
            borderRadius: '2rem',
            padding: '2rem',
            boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
            border: `1px solid ${isLight ? '#e2e8f0' : 'rgba(255,255,255,0.1)'}`,
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '900' }}>
                  📦 {selectedPersonForDetail.name} - Koli Paketi
                </h3>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.2rem' }}>
                  {selectedPersonForDetail.service_center} | {selectedPersonForDetail.department}
                </div>
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                  {(() => {
                    const modalChuteTarget = selectedPersonForDetail.chute_target_capacity ? Number(selectedPersonForDetail.chute_target_capacity) : null;
                    const modalBoxCap = modalChuteTarget || selectedPersonForDetail.box_item_target || selectedPersonForDetail.box_capacity || activeBoxCapacity || 7;
                    return (
                      <>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: '800',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '6px',
                          background: isLight ? '#eff6ff' : 'rgba(59, 130, 246, 0.2)',
                          color: '#3b82f6',
                          border: '1px solid rgba(59, 130, 246, 0.3)'
                        }}>
                          📦 Koli İçi Kapasitesi: {modalBoxCap} Adet
                        </span>
                        {modalChuteTarget && (
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: '800',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '6px',
                            background: isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.2)',
                            color: '#10b981',
                            border: '1px solid rgba(16, 185, 129, 0.3)'
                          }}>
                            🎯 Sorter Göz Hedefi: {modalChuteTarget} Adet
                          </span>
                        )}
                      </>
                    );
                  })()}
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: '800',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '6px',
                    background: isLight ? '#fef3c7' : 'rgba(245, 158, 11, 0.2)',
                    color: '#d97706',
                    border: '1px solid rgba(245, 158, 11, 0.3)'
                  }}>
                    📋 Toplam İhtiyaç: {selectedPersonForDetail.total_boxes_needed || 1} Koli ({selectedPersonForDetail.total_target} Parça)
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedPersonForDetail(null)}
                style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '1.4rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Checklist of 7 pieces */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1.5rem' }}>
              {selectedPersonForDetail.bundle_items.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '1rem',
                    borderRadius: '1rem',
                    background: isLight ? '#f8fafc' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isLight ? '#e2e8f0' : 'rgba(255,255,255,0.06)'}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '0.95rem' }}>{item.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
                      Beden: <span style={{ fontWeight: '800', color: '#3b82f6' }}>{item.size}</span> | Hedef Adet: {item.target}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                      onClick={() => handlePackItemForPerson(selectedPersonForDetail.id, item.name)}
                      style={{
                        padding: '0.4rem 0.8rem',
                        borderRadius: '0.6rem',
                        border: 'none',
                        background: '#3b82f6',
                        color: '#fff',
                        fontSize: '0.8rem',
                        fontWeight: '800',
                        cursor: 'pointer'
                      }}
                    >
                      +1 Ekle
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button
                onClick={() => setSelectedPersonForDetail(null)}
                style={{
                  padding: '0.8rem 1.4rem',
                  borderRadius: '1rem',
                  border: `1px solid ${isLight ? '#cbd5e1' : 'rgba(255,255,255,0.1)'}`,
                  background: 'transparent',
                  color: 'inherit',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Kapat
              </button>
              <button
                onClick={() => {
                  const p = selectedPersonForDetail;
                  setSelectedPersonForDetail(null);
                  handleCompleteBox(p, false);
                }}
                style={{
                  padding: '0.8rem 1.6rem',
                  borderRadius: '1rem',
                  border: 'none',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#fff',
                  fontWeight: '900',
                  cursor: 'pointer'
                }}
              >
                🏷️ Koliyi Tamamla & Etiket Bas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1B: GÖZDEN DOĞRUDAN PERSONEL ATAMA (CHUTE ASSIGN)    */}
      {/* ======================================================== */}
      {assignModalChute !== null && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '1.5rem'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '680px',
            background: isLight ? '#ffffff' : '#0f172a',
            color: isLight ? '#0f172a' : '#f8fafc',
            borderRadius: '1.5rem',
            padding: '2rem',
            boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
            border: `1px solid ${isLight ? '#e2e8f0' : 'rgba(255,255,255,0.1)'}`,
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: `1px solid ${isLight ? '#e2e8f0' : 'rgba(255,255,255,0.1)'}`, paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '0.8rem',
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  fontWeight: '900'
                }}>
                  #{assignModalChute}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '900' }}>
                    Göz #{assignModalChute} İçin Personel Seç & Ata
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                    Aşağıdaki listeden bir personel seçtiğinizde, doğrudan bu göze 1-to-1 olarak bağlanır ve PLC Sorter LED'i Sarı yanar.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAssignModalChute(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '1.3rem',
                  color: isLight ? '#64748b' : '#94a3b8',
                  cursor: 'pointer',
                  padding: '0.4rem'
                }}
              >
                ✕
              </button>
            </div>

            {/* Search Input & Info */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="🔍 Personel adı, bayi, departman veya parça no ile ara..."
                  value={assignModalSearch}
                  onChange={(e) => setAssignModalSearch(e.target.value)}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.9rem',
                    border: `1px solid ${isLight ? '#cbd5e1' : 'rgba(255,255,255,0.15)'}`,
                    background: isLight ? '#f8fafc' : 'rgba(255,255,255,0.05)',
                    color: 'inherit',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', fontSize: '0.75rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                <span>Toplam {assignCandidates.length} uygun personel listeleniyor</span>
                <span>💡 Henüz göze atanmamış personeller üst sırada yer alır</span>
              </div>
            </div>

            {/* List */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.6rem',
              paddingRight: '0.4rem',
              minHeight: '200px'
            }}>
              {assignCandidates.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: isLight ? '#94a3b8' : '#64748b' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔍</div>
                  <div style={{ fontWeight: '700' }}>Aranan kritere uygun atanabilir personel bulunamadı.</div>
                </div>
              ) : (
                assignCandidates.map((person) => {
                  const hasChute = !!person.sorter_chute;
                  return (
                    <div
                      key={person.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.8rem 1rem',
                        borderRadius: '0.9rem',
                        background: isLight ? (hasChute ? '#f1f5f9' : '#f8fafc') : (hasChute ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)'),
                        border: `1px solid ${isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)'}`,
                        gap: '0.8rem'
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: '800', fontSize: '0.92rem' }}>{person.name}</span>
                          <span style={{
                            fontSize: '0.68rem',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '0.4rem',
                            fontWeight: '700',
                            background: person.gender === 'Kadın' ? 'rgba(236,72,153,0.15)' : 'rgba(59,130,246,0.15)',
                            color: person.gender === 'Kadın' ? '#ec4899' : '#3b82f6'
                          }}>
                            {person.gender || 'Erkek'}
                          </span>
                          {hasChute ? (
                            <span style={{
                              fontSize: '0.68rem',
                              padding: '0.15rem 0.45rem',
                              borderRadius: '0.4rem',
                              fontWeight: '700',
                              background: 'rgba(245, 158, 11, 0.15)',
                              color: '#f59e0b'
                            }}>
                              Şu an Göz #{person.sorter_chute}'de (Buraya Taşınır)
                            </span>
                          ) : (
                            <span style={{
                              fontSize: '0.68rem',
                              padding: '0.15rem 0.45rem',
                              borderRadius: '0.4rem',
                              fontWeight: '700',
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#10b981'
                            }}>
                              ⚪ Boşta (Atanmamış)
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: isLight ? '#64748b' : '#94a3b8', marginTop: '0.25rem', display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                          <span>🏢 {person.service_center || person.dealer || 'Merkez'}</span>
                          {person.department && <span>🏷️ {person.department}</span>}
                          {person.shoe_size && <span>👟 {person.shoe_size} No</span>}
                        </div>
                      </div>

                      <button
                        onClick={() => handleAssignStaffToChute(person.id, assignModalChute, person.name)}
                        disabled={isProcessing}
                        style={{
                          padding: '0.55rem 1rem',
                          borderRadius: '0.75rem',
                          border: 'none',
                          background: 'linear-gradient(135deg, #10b981, #059669)',
                          color: '#fff',
                          fontWeight: '800',
                          fontSize: '0.8rem',
                          cursor: isProcessing ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <span>🎯</span>
                        <span>Bu Göze Ata</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.2rem', paddingTop: '1rem', borderTop: `1px solid ${isLight ? '#e2e8f0' : 'rgba(255,255,255,0.1)'}` }}>
              <button
                onClick={() => setAssignModalChute(null)}
                style={{
                  padding: '0.65rem 1.4rem',
                  borderRadius: '0.8rem',
                  border: `1px solid ${isLight ? '#cbd5e1' : 'rgba(255,255,255,0.15)'}`,
                  background: isLight ? '#ffffff' : 'rgba(255,255,255,0.05)',
                  color: 'inherit',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: GODEX G530 14-SATIRLI PORTRAİT ETİKET ÖNİZLEME   */}
      {/* ======================================================== */}
      {labelModalData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '1.5rem'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '540px',
            background: '#ffffff',
            color: '#000000',
            borderRadius: '2rem',
            padding: '2rem',
            boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
            maxHeight: '92vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '2px solid #000', paddingBottom: '0.8rem' }}>
              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: '900' }}>{(labelModalData?.person?.brand || selectedBrand).toUpperCase()} | PERSONEL KOLİSİ</div>
                <div style={{ fontSize: '0.85rem', color: '#666', fontWeight: '800' }}>Godex G530 (80x100mm Dikey Portrait Standart)</div>
              </div>
              <button
                onClick={() => setLabelModalData(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', fontWeight: '900' }}
              >
                ✕
              </button>
            </div>

            {/* Label Visual Mockup */}
            <div style={{
              border: '3px solid #000',
              padding: '1rem',
              borderRadius: '0.8rem',
              marginBottom: '1.5rem',
              background: '#fff'
            }}>
              {/* Header Banner */}
              <div style={{ background: '#000', color: '#fff', padding: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '900' }}>
                <span style={{ fontSize: '1.1rem' }}>{(labelModalData?.person?.brand || selectedBrand).toUpperCase()}</span>
                <span>KOLİ: 1 / 1</span>
              </div>

              {/* Bayi & Personel */}
              <div style={{ padding: '0.6rem 0', borderBottom: '1px solid #ccc', fontSize: '0.85rem' }}>
                <div><strong>BAYİ:</strong> {labelModalData.person.service_center}</div>
                <div><strong>BÖLÜM:</strong> {labelModalData.person.department}</div>
                <div style={{ marginTop: '0.3rem', fontSize: '1rem', fontWeight: '900' }}>
                  PERSONEL: {labelModalData.person.name} ({labelModalData.person.gender || 'Erkek'})
                </div>
              </div>

              {/* Items Table Mockup */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                <thead>
                  <tr style={{ background: '#000', color: '#fff', fontSize: '0.75rem' }}>
                    <th style={{ padding: '0.3rem' }}>Beden</th>
                    <th style={{ padding: '0.3rem' }}>Ürün Açıklaması</th>
                    <th style={{ padding: '0.3rem', textAlign: 'right' }}>Adet</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td style={{ borderBottom: '1px solid #eee', padding: '0.3rem', textAlign: 'center', fontWeight: '800' }}>{labelModalData.person.top_size}</td><td style={{ borderBottom: '1px solid #eee', padding: '0.3rem' }}>Servis Danışman Montu ({labelModalData.person.mont_preference})</td><td style={{ borderBottom: '1px solid #eee', padding: '0.3rem', textAlign: 'right' }}>1</td></tr>
                  <tr><td style={{ borderBottom: '1px solid #eee', padding: '0.3rem', textAlign: 'center', fontWeight: '800' }}>{labelModalData.person.top_size}</td><td style={{ borderBottom: '1px solid #eee', padding: '0.3rem' }}>Servis Danışman Yelek</td><td style={{ borderBottom: '1px solid #eee', padding: '0.3rem', textAlign: 'right' }}>1</td></tr>
                  <tr><td style={{ borderBottom: '1px solid #eee', padding: '0.3rem', textAlign: 'center', fontWeight: '800' }}>{labelModalData.person.top_size}</td><td style={{ borderBottom: '1px solid #eee', padding: '0.3rem' }}>Servis Danışman Gömlek</td><td style={{ borderBottom: '1px solid #eee', padding: '0.3rem', textAlign: 'right' }}>2</td></tr>
                  <tr><td style={{ borderBottom: '1px solid #eee', padding: '0.3rem', textAlign: 'center', fontWeight: '800' }}>{labelModalData.person.bottom_size}</td><td style={{ borderBottom: '1px solid #eee', padding: '0.3rem' }}>Servis Danışman Pantolon</td><td style={{ borderBottom: '1px solid #eee', padding: '0.3rem', textAlign: 'right' }}>2</td></tr>
                  <tr>
                    <td style={{ borderBottom: '1px solid #eee', padding: '0.3rem', textAlign: 'center', fontWeight: '800' }}>
                      {extractCleanShoeDisplay(labelModalData.person.shoe_size)}
                    </td>
                    <td style={{ borderBottom: '1px solid #eee', padding: '0.3rem' }}>
                      Servis Danışman Ayakkabı {labelModalData.person.shoe_part_no || (labelModalData.person.shoe_size && labelModalData.person.shoe_size.startsWith('PVW') ? `(${labelModalData.person.shoe_size})` : '')}
                    </td>
                    <td style={{ borderBottom: '1px solid #eee', padding: '0.3rem', textAlign: 'right' }}>1</td>
                  </tr>
                </tbody>
              </table>

              {/* Total Qty */}
              <div style={{ marginTop: '0.8rem', padding: '0.5rem', background: '#f5f5f5', border: '1px solid #000', display: 'flex', justifyContent: 'space-between', fontWeight: '900', fontSize: '0.95rem' }}>
                <span>TOPLAM:</span>
                <span>7 ADET URUN</span>
              </div>

              {/* Barcode & QR */}
              <div style={{ marginTop: '0.8rem', padding: '0.5rem', border: '1px solid #ccc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <BarcodePreviewCanvas barcode={labelModalData.box_barcode} template="QR" height={55} />
                <div style={{ flex: 1, paddingLeft: '1rem' }}>
                  <BarcodePreviewCanvas barcode={labelModalData.box_barcode} template="CODE128" height={35} />
                  <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '0.3rem', textAlign: 'center' }}>
                    DIGITAL KOLI QR & EPC DOGRULAMA
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button
                onClick={() => setLabelModalData(null)}
                style={{
                  padding: '0.8rem 1.4rem',
                  borderRadius: '1rem',
                  border: '1px solid #ccc',
                  background: '#f5f5f5',
                  color: '#333',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Kapat
              </button>
              <button
                onClick={async () => {
                  try {
                    await fetch(`${API_BASE_URL}/api/printer/print-raw-zpl`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ printer_name: 'Godex G530', zpl: labelModalData.zpl })
                    });
                    alert('✅ Koli etiketi Godex G530 yazıcısına başarıyla gönderildi (Zero Print Safe).');
                    setLabelModalData(null);
                  } catch (e) {
                    alert('Yazıcı gönderim hatası: ' + e.message);
                  }
                }}
                style={{
                  padding: '0.8rem 1.6rem',
                  borderRadius: '1rem',
                  border: 'none',
                  background: '#000',
                  color: '#fff',
                  fontWeight: '900',
                  cursor: 'pointer'
                }}
              >
                🖨️ Godex G530'a Yazdır
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: PERSONEL FİŞ & ETİKET BASIM MERKEZİ            */}
      {/* ======================================================== */}
      {selectedStaffForPrint && (
        <PersonnelLabelAndReceiptModal
          person={selectedStaffForPrint}
          onClose={() => setSelectedStaffForPrint(null)}
          onPrinted={() => {
            fetchStaffList();
          }}
          isLight={isLight}
        />
      )}

      {/* ======================================================== */}
      {/* FLOATING ACTION BAR: SEÇİLİ PERSONELLER İÇİN HIZLI DAĞIT */}
      {/* ======================================================== */}
      {selectedStaffIds.length > 0 && activeTab === 'orders' && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          background: isLight ? '#1e293b' : 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(245, 158, 11, 0.6)',
          boxShadow: '0 20px 45px rgba(0,0,0,0.6), 0 0 25px rgba(245, 158, 11, 0.35)',
          borderRadius: '1.3rem',
          padding: '0.85rem 1.8rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem',
          color: '#ffffff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: '#f59e0b',
              color: '#000000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '900',
              fontSize: '0.95rem'
            }}>
              {selectedStaffIds.length}
            </div>
            <div>
              <div style={{ fontWeight: '800', fontSize: '0.95rem', color: '#ffffff' }}>
                {selectedStaffIds.length} Personel Seçildi
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Mini-Sorter 1-60 boş gözlerine otomatik dağıtım için hazır
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              onClick={handleAllocateToSorter}
              disabled={isProcessing}
              style={{
                padding: '0.75rem 1.6rem',
                borderRadius: '0.9rem',
                border: 'none',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#ffffff',
                fontWeight: '900',
                fontSize: '0.9rem',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 16px rgba(245, 158, 11, 0.45)',
                whiteSpace: 'nowrap'
              }}
            >
              <span>⚡</span>
              <span>SEÇİLİLERİ GÖZLERE DAĞIT (1-60 Göz)</span>
            </button>

            <button
              onClick={() => setSelectedStaffIds([])}
              style={{
                padding: '0.75rem 1.2rem',
                borderRadius: '0.9rem',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#cbd5e1',
                fontWeight: '700',
                fontSize: '0.85rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              ✕ Seçimi Kaldır
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonnelOrderManagement;
