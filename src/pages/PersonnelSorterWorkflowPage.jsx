import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import API_BASE_URL from '../services/apiConfig';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ROBOTO_REGULAR, ROBOTO_BOLD } from '../assets/fonts/fonts.js';
import bwipjs from '@bwip-js/browser';
import PersonnelLabelAndReceiptModal from '../components/PersonnelLabelAndReceiptModal';
import { getChuteWallStyle } from './PersonnelOrderManagement';

// Crisp dynamic barcode & QR renderer using bwip-js
const BarcodePreviewCanvas = ({ barcode, template = 'CODE128', height = 45 }) => {
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
          height: 10,
          includetext: true,
          textsize: 8
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

const PersonnelSorterWorkflowPage = () => {
  const navigate = useNavigate();
  const { themeMode } = useLanguage();
  const isLight = themeMode === 'light';

  // 1. Workflow Stepper State: 1 | 2 | 3 | 4
  const [currentStep, setCurrentStep] = useState(1);

  // 2. Step 1: Firma & Bölüm Seçimi (Sipariş seçimi yoktur, markaya ait tüm açık/kısmi siparişler kapsanır)
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState('SCANIA');
  const [orders, setOrders] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDepts, setSelectedDepts] = useState([]);

  // 3. Step 2: Kategori Bazlı Seçim (İşarete Göre) & Kutu Hacim ve Maksimum Adet Ayarları
  const DEFAULT_CATEGORY_LIMITS = {
    MONT: { max_per_box: 2, volume_points: 45, label: 'Mont / Kaban', icon: '🧥' },
    YELEK: { max_per_box: 4, volume_points: 25, label: 'Yelek / Polar', icon: '🦺' },
    SWEATSHIRT: { max_per_box: 5, volume_points: 20, label: 'Sweatshirt / Hırka', icon: '🧶' },
    PANTOLON: { max_per_box: 6, volume_points: 16, label: 'Pantolon', icon: '👖' },
    GÖMLEK: { max_per_box: 8, volume_points: 12, label: 'Gömlek', icon: '👔' },
    'POLO TİŞÖRT': { max_per_box: 12, volume_points: 8, label: 'Polo / Tişört', icon: '👕' },
    BERE: { max_per_box: 25, volume_points: 4, label: 'Bere / Aksesuar', icon: '🧢' },
    AYAKKABI: { max_per_box: 1, volume_points: 50, label: 'Ayakkabı / Bot', icon: '👞' },
    DİĞER: { max_per_box: 10, volume_points: 10, label: 'Diğer Kıyafet', icon: '📦' }
  };

  const [categoryLimits, setCategoryLimits] = useState(DEFAULT_CATEGORY_LIMITS);
  const [categorySettingsModalOpen, setCategorySettingsModalOpen] = useState(false);

  // Akıllı Hacim & Ürün Seçimi: Sadece işaretli olan ürünler işleme alınır
  const [enabledCategories, setEnabledCategories] = useState({
    MONT: true,
    YELEK: true,
    SWEATSHIRT: true,
    PANTOLON: true,
    GÖMLEK: true,
    'POLO TİŞÖRT': true,
    BERE: true,
    AYAKKABI: true,
    DİĞER: true
  });

  const handleToggleCategory = (catKey) => {
    setEnabledCategories(prev => ({
      ...prev,
      [catKey]: !prev[catKey]
    }));
  };

  const handleSelectAllCategories = (selectState) => {
    setEnabledCategories({
      MONT: selectState,
      YELEK: selectState,
      SWEATSHIRT: selectState,
      PANTOLON: selectState,
      GÖMLEK: selectState,
      'POLO TİŞÖRT': selectState,
      BERE: selectState,
      AYAKKABI: selectState,
      DİĞER: selectState
    });
  };

  const handleSelectCategoryGroup = (groupType) => {
    if (groupType === 'WINTER') {
      setEnabledCategories({
        MONT: true,
        YELEK: true,
        SWEATSHIRT: true,
        PANTOLON: true,
        GÖMLEK: false,
        'POLO TİŞÖRT': false,
        BERE: true,
        AYAKKABI: true,
        DİĞER: false
      });
      setFeedback({ type: 'success', text: '❄️ Sadece Kışlık Ürün Tipleri seçildi (Mont, Yelek, Sweatshirt, Pantolon, Bere, Ayakkabı).' });
    } else if (groupType === 'SUMMER') {
      setEnabledCategories({
        MONT: false,
        YELEK: false,
        SWEATSHIRT: false,
        PANTOLON: true,
        GÖMLEK: true,
        'POLO TİŞÖRT': true,
        BERE: false,
        AYAKKABI: false,
        DİĞER: false
      });
      setFeedback({ type: 'success', text: '☀️ Sadece Yazlık Ürün Tipleri seçildi (Polo Tişört, Gömlek, Pantolon).' });
    } else if (groupType === 'HEAVY_TOPS') {
      setEnabledCategories({
        MONT: true,
        YELEK: true,
        SWEATSHIRT: true,
        PANTOLON: false,
        GÖMLEK: false,
        'POLO TİŞÖRT': false,
        BERE: false,
        AYAKKABI: false,
        DİĞER: false
      });
      setFeedback({ type: 'success', text: '🧥 Sadece Hacimli Üst Giyim seçildi (Mont, Yelek, Sweatshirt).' });
    } else if (groupType === 'BOTTOMS') {
      setEnabledCategories({
        MONT: false,
        YELEK: false,
        SWEATSHIRT: false,
        PANTOLON: true,
        GÖMLEK: false,
        'POLO TİŞÖRT': false,
        BERE: false,
        AYAKKABI: false,
        DİĞER: false
      });
      setFeedback({ type: 'success', text: '👖 Sadece Alt Giyim (Pantolon) seçildi.' });
    }
  };

  const activeCategories = useMemo(() => {
    return Object.keys(enabledCategories).filter(k => enabledCategories[k]);
  }, [enabledCategories]);

  const selectedDepartmentsStaffTotal = useMemo(() => {
    return departments
      .filter(d => selectedDepts.includes(d.department))
      .reduce((sum, d) => sum + (parseInt(d.staff_count, 10) || 0), 0);
  }, [departments, selectedDepts]);

  // 4. Step 3: Konsolide Depo Toplama Listesi & Plan
  const [boxCapacity, setBoxCapacity] = useState(7);
  const [planData, setPlanData] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [pickingSearchQuery, setPickingSearchQuery] = useState('');
  const [pickingCategoryFilter, setPickingCategoryFilter] = useState('ALL');
  const [checkedItems, setCheckedItems] = useState({});

  // 5. Step 4: Mini-Sorter 60 Göz Yönetimi & Döngüler (Waves)
  const [activeWaveIndex, setActiveWaveIndex] = useState(0);
  const [allocatingWave, setAllocatingWave] = useState(false);
  const [allocatedWaveSuccess, setAllocatedWaveSuccess] = useState(null);
  const [chutesLiveState, setChutesLiveState] = useState([]);

  // 6. Etiket & Fiş Modalı State
  const [selectedStaffForPrint, setSelectedStaffForPrint] = useState(null);
  const [printModalData, setPrintModalData] = useState(null);
  const [loadingPrintData, setLoadingPrintData] = useState(false);

  // 7. Geri Bildirim ve UI Mesajları
  const [feedback, setFeedback] = useState(null);

  // Otomatik mesaj gizleme
  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 6000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  // Sunucudan Kategori Limitlerini & Koli Kapasitesini Çek
  useEffect(() => {
    const fetchCategoryLimits = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/personnel-workflow/category-limits`);
        const data = await res.json();
        if (data.success) {
          if (data.category_limits && typeof data.category_limits === 'object') {
            setCategoryLimits(data.category_limits);
          }
          if (data.box_capacity) {
            setBoxCapacity(Number(data.box_capacity));
          }
          if (data.selected_categories && typeof data.selected_categories === 'object') {
            setEnabledCategories(data.selected_categories);
          }
        }
      } catch (e) {
        // Varsayılan limitlerle devam et
      }
    };
    fetchCategoryLimits();
  }, []);

  // Koli ve Kategori Ayarlarını Sunucuya Kaydet (Diğer Sayfalarla Tam Senkronizasyon)
  const saveBoxAndCategorySettings = async (newBoxCap, newCatLimits, newEnabledCats) => {
    try {
      await fetch(`${API_BASE_URL}/api/personnel-workflow/category-limits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          box_capacity: newBoxCap !== undefined ? newBoxCap : boxCapacity,
          category_limits: newCatLimits || categoryLimits,
          selected_categories: newEnabledCats || enabledCategories
        })
      });
    } catch (e) {
      console.error('Koli ayarları kaydedilemedi:', e);
    }
  };

  // ----------------------------------------------------
  // VERİ YÜKLEME 1: Markaları Getir
  // ----------------------------------------------------
  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/personnel-workflow/brands`);
      const data = await res.json();
      if (data.success && Array.isArray(data.brands)) {
        setBrands(data.brands);
        if (data.brands.length > 0 && !selectedBrand) {
          setSelectedBrand(data.brands[0].brand);
        }
      }
    } catch (e) {
      console.error('Markalar yüklenemedi:', e);
    }
  };

  // ----------------------------------------------------
  // VERİ YÜKLEME 2: Seçilen Markanın Siparişlerini Getir (Özet Bilgi İçin)
  // ----------------------------------------------------
  useEffect(() => {
    if (selectedBrand) {
      fetchOrders(selectedBrand);
    }
  }, [selectedBrand]);

  const fetchOrders = async (brand) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/personnel-workflow/orders?brand=${encodeURIComponent(brand)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        setOrders(data.orders);
      }
    } catch (e) {
      console.error('Siparişler yüklenemedi:', e);
    }
  };

  // ----------------------------------------------------
  // VERİ YÜKLEME 3: Seçilen Markanın Bölümlerini Getir (Tüm Siparişleri Kapsar)
  // ----------------------------------------------------
  useEffect(() => {
    if (selectedBrand) {
      fetchDepartments(selectedBrand);
    }
  }, [selectedBrand]);

  const fetchDepartments = async (brand) => {
    try {
      const url = `${API_BASE_URL}/api/personnel-workflow/departments?brand=${encodeURIComponent(brand)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.departments)) {
        setDepartments(data.departments);
        // Varsayılan olarak tüm bölümleri seç
        setSelectedDepts(data.departments.map(d => d.department));
      }
    } catch (e) {
      console.error('Departmanlar yüklenemedi:', e);
    }
  };

  // ----------------------------------------------------
  // İŞLEM 3.5: Kategori Limitleri Güncelleme & Şablonlar
  // ----------------------------------------------------
  const handleUpdateCategoryLimit = (catKey, field, val) => {
    const num = Math.max(1, parseInt(val, 10) || 1);
    const updated = {
      ...categoryLimits,
      [catKey]: {
        ...categoryLimits[catKey],
        [field]: num
      }
    };
    setCategoryLimits(updated);
    saveBoxAndCategorySettings(boxCapacity, updated, enabledCategories);
  };

  const handleApplyPreset = (presetType) => {
    let newLimits = { ...categoryLimits };
    let newCap = boxCapacity;

    if (presetType === 'WINTER') {
      newCap = 5;
      newLimits = {
        MONT: { max_per_box: 2, volume_points: 45, label: 'Mont / Kaban', icon: '🧥' },
        YELEK: { max_per_box: 4, volume_points: 25, label: 'Yelek / Polar', icon: '🦺' },
        SWEATSHIRT: { max_per_box: 5, volume_points: 20, label: 'Sweatshirt / Hırka', icon: '🧶' },
        PANTOLON: { max_per_box: 6, volume_points: 16, label: 'Pantolon', icon: '👖' },
        GÖMLEK: { max_per_box: 8, volume_points: 12, label: 'Gömlek', icon: '👔' },
        'POLO TİŞÖRT': { max_per_box: 12, volume_points: 8, label: 'Polo / Tişört', icon: '👕' },
        BERE: { max_per_box: 25, volume_points: 4, label: 'Bere / Aksesuar', icon: '🧢' },
        AYAKKABI: { max_per_box: 1, volume_points: 50, label: 'Ayakkabı / Bot', icon: '👞' },
        DİĞER: { max_per_box: 10, volume_points: 10, label: 'Diğer Kıyafet', icon: '📦' }
      };
      setFeedback({ type: 'success', text: '❄️ Standart Kışlık koli şablonu uygulandı (Kapasite: 5 Adet, Mont: 2 adet / %45 hacim).' });
    } else if (presetType === 'SUMMER') {
      newCap = 8;
      newLimits = {
        MONT: { max_per_box: 4, volume_points: 25, label: 'Mont / Kaban', icon: '🧥' },
        YELEK: { max_per_box: 6, volume_points: 16, label: 'Yelek / Polar', icon: '🦺' },
        SWEATSHIRT: { max_per_box: 8, volume_points: 12, label: 'Sweatshirt / Hırka', icon: '🧶' },
        PANTOLON: { max_per_box: 8, volume_points: 12, label: 'Pantolon', icon: '👖' },
        GÖMLEK: { max_per_box: 10, volume_points: 10, label: 'Gömlek', icon: '👔' },
        'POLO TİŞÖRT': { max_per_box: 15, volume_points: 7, label: 'Polo / Tişört', icon: '👕' },
        BERE: { max_per_box: 30, volume_points: 3, label: 'Bere / Aksesuar', icon: '🧢' },
        AYAKKABI: { max_per_box: 1, volume_points: 50, label: 'Ayakkabı / Bot', icon: '👞' },
        DİĞER: { max_per_box: 12, volume_points: 8, label: 'Diğer Kıyafet', icon: '📦' }
      };
      setFeedback({ type: 'success', text: '☀️ Yazlık Kompakt koli şablonu uygulandı (Kapasite: 8 Adet, Tişört: 15 adet).' });
    } else if (presetType === 'XL_BOX') {
      newCap = 10;
      newLimits = {
        MONT: { max_per_box: 3, volume_points: 30, label: 'Mont / Kaban', icon: '🧥' },
        YELEK: { max_per_box: 6, volume_points: 16, label: 'Yelek / Polar', icon: '🦺' },
        SWEATSHIRT: { max_per_box: 8, volume_points: 12, label: 'Sweatshirt / Hırka', icon: '🧶' },
        PANTOLON: { max_per_box: 10, volume_points: 10, label: 'Pantolon', icon: '👖' },
        GÖMLEK: { max_per_box: 12, volume_points: 8, label: 'Gömlek', icon: '👔' },
        'POLO TİŞÖRT': { max_per_box: 18, volume_points: 5, label: 'Polo / Tişört', icon: '👕' },
        BERE: { max_per_box: 40, volume_points: 2, label: 'Bere / Aksesuar', icon: '🧢' },
        AYAKKABI: { max_per_box: 2, volume_points: 40, label: 'Ayakkabı / Bot', icon: '👞' },
        DİĞER: { max_per_box: 15, volume_points: 6, label: 'Diğer Kıyafet', icon: '📦' }
      };
      setFeedback({ type: 'success', text: '📦 Büyük Boy (XL) Koli şablonu uygulandı (Kapasite: 10 Adet).' });
    } else {
      newCap = 7;
      newLimits = DEFAULT_CATEGORY_LIMITS;
      setFeedback({ type: 'success', text: '🔄 Varsayılan standart fabrika koli şablonuna dönüldü (Kapasite: 7 Adet).' });
    }

    setBoxCapacity(newCap);
    setCategoryLimits(newLimits);
    saveBoxAndCategorySettings(newCap, newLimits, enabledCategories);
  };

  // ----------------------------------------------------
  // İŞLEM 4: Depo Toplama Listesi & Döngü Planını Hesapla
  // ----------------------------------------------------
  const handleCalculatePlan = async (targetStep = null, customLimits = null) => {
    if (!selectedBrand) {
      setFeedback({ type: 'error', text: 'Lütfen bir firma seçin.' });
      return;
    }
    if (selectedDepts.length === 0) {
      setFeedback({ type: 'error', text: 'Lütfen en az bir bölüm seçin.' });
      return;
    }

    const activeCats = Object.keys(enabledCategories).filter(k => enabledCategories[k]);
    if (activeCats.length === 0) {
      setFeedback({ type: 'error', text: 'Lütfen işleme alınacak en az bir ürün cinsi işaretleyiniz.' });
      return;
    }

    setLoadingPlan(true);
    try {
      const limitsToSend = customLimits || categoryLimits;
      const res = await fetch(`${API_BASE_URL}/api/personnel-workflow/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: selectedBrand,
          order_number: null, // Markaya ait tüm aktif ve kısmi siparişleri kapsar
          departments: selectedDepts,
          box_capacity: boxCapacity,
          category_limits: limitsToSend,
          selected_categories: activeCats
        })
      });
      const data = await res.json();
      if (data.success) {
        setPlanData(data);
        setActiveWaveIndex(0);
        if (targetStep) {
          setCurrentStep(targetStep);
        } else if (currentStep < 3) {
          setCurrentStep(3); // Depo Toplama Listesi adımına ilerle
        }
        setFeedback({
          type: 'success',
          text: `Depo Toplama Listesi ve Sorter planı hazırlandı! ${data.summary.total_staff} personel, ${data.summary.total_pieces} adet kıyafet, ${data.summary.total_boxes_needed} koli ihtiyacı ve ${data.summary.total_waves} döngü hesaplandı.`
        });
        if (categorySettingsModalOpen) {
          setCategorySettingsModalOpen(false);
        }
      } else {
        setFeedback({ type: 'error', text: data.error || 'Plan hesaplanamadı.' });
      }
    } catch (e) {
      setFeedback({ type: 'error', text: 'Sunucu bağlantı hatası: ' + e.message });
    } finally {
      setLoadingPlan(false);
    }
  };

  // Canlı Sorter Göz Durumunu Çek
  const fetchLiveChutes = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/wms/sorter-chutes`);
      const data = await res.json();
      if (data.success && Array.isArray(data.chutes)) {
        setChutesLiveState(data.chutes);
      }
    } catch (e) {
      // sessizce geç
    }
  };

  useEffect(() => {
    if (currentStep === 4) {
      fetchLiveChutes();
      const interval = setInterval(fetchLiveChutes, 3000);
      return () => clearInterval(interval);
    }
  }, [currentStep]);

  // ----------------------------------------------------
  // İŞLEM 5: Döngüyü Mini-Sorter 60 Göze Dağıt
  // ----------------------------------------------------
  const handleAllocateWaveToSorter = async (wave) => {
    if (!wave || !wave.staff_list || wave.staff_list.length === 0) return;

    setAllocatingWave(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/personnel-workflow/allocate-wave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: selectedBrand,
          order_number: null,
          wave_no: wave.wave_no,
          staff_list: wave.staff_list,
          box_capacity: boxCapacity,
          category_limits: categoryLimits
        })
      });
      const data = await res.json();
      if (data.success) {
        setAllocatedWaveSuccess(wave.wave_no);
        setFeedback({
          type: 'success',
          text: `🚀 ${wave.wave_no}. Döngü başarıyla Mini-Sorter'a dağıtıldı! ${data.allocated_count} personele ${data.chutes_used} göz 1-to-1 olarak tahsis edildi.`
        });
        fetchLiveChutes();
      } else {
        setFeedback({ type: 'error', text: data.error || 'Döngü atanamadı.' });
      }
    } catch (e) {
      setFeedback({ type: 'error', text: 'Dağıtım hatası: ' + e.message });
    } finally {
      setAllocatingWave(false);
    }
  };

  // ----------------------------------------------------
  // İŞLEM 6: Döngüyü Tamamla & Kolile & Gözleri Boşalt
  // ----------------------------------------------------
  const handleCompleteWave = async (wave) => {
    if (!wave || !wave.staff_list) return;
    const confirmDone = window.confirm(`${wave.wave_no}. Döngüdeki tüm koliler tamamlandı mı? Gözler boşaltılıp sonraki döngüye geçilecek.`);
    if (!confirmDone) return;

    try {
      const staffIds = wave.staff_list.map(s => s.id);
      const res = await fetch(`${API_BASE_URL}/api/personnel-workflow/complete-wave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: selectedBrand,
          wave_no: wave.wave_no,
          staff_ids: staffIds
        })
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', text: `✅ ${wave.wave_no}. Döngü başarıyla tamamlandı! Gözler sıfırlandı.` });
        // Bir sonraki döngüye otomatik geç
        if (planData && activeWaveIndex < planData.waves.length - 1) {
          setActiveWaveIndex(activeWaveIndex + 1);
        }
        fetchLiveChutes();
      } else {
        setFeedback({ type: 'error', text: data.error || 'Tamamlama hatası.' });
      }
    } catch (e) {
      setFeedback({ type: 'error', text: 'Hata: ' + e.message });
    }
  };

  // ----------------------------------------------------
  // PDF OLUŞTURMA MOTORU (A4 Depo Toplama Listesi)
  // ----------------------------------------------------
  const handleGeneratePdf = (targetItems, titleSuffix = '') => {
    if (!planData || !targetItems || targetItems.length === 0) {
      setFeedback({ type: 'error', text: 'Yazdırılacak liste boş.' });
      return;
    }

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Roboto fontlarını ekle (Türkçe karakter desteği)
      if (ROBOTO_REGULAR) {
        doc.addFileToVFS('Roboto-Regular.ttf', ROBOTO_REGULAR);
        doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
      }
      if (ROBOTO_BOLD) {
        doc.addFileToVFS('Roboto-Bold.ttf', ROBOTO_BOLD);
        doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
      }
      doc.setFont('Roboto', 'normal');

      const todayStr = new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

      // Antet ve Başlık
      doc.setFillColor(15, 23, 42); // Midnight navy
      doc.rect(0, 0, 210, 32, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('Roboto', 'bold');
      doc.setFontSize(16);
      doc.text('VOG TEKSTİL PREMIUM - DEPO TOPLAMA EMRİ & MALZEME ÇEKİ LİSTESİ', 14, 12);

      doc.setFont('Roboto', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(203, 213, 225);
      doc.text(`Firma / Marka: ${selectedBrand}   |   Kapsam: TÜM SİPARİŞLER   |   Tarih: ${todayStr}`, 14, 20);
      doc.text(`Seçili Bölümler: ${selectedDepts.join(', ')}   |   Ürün Cinsleri: ${activeCategories.join(', ')} ${titleSuffix ? `  |  [${titleSuffix}]` : ''}`, 14, 26);

      // İstatistik Kutusu
      doc.setFillColor(241, 245, 249);
      doc.rect(14, 36, 182, 14, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.rect(14, 36, 182, 14, 'S');

      doc.setTextColor(30, 41, 59);
      doc.setFont('Roboto', 'bold');
      doc.setFontSize(9);
      doc.text(`Toplam Personel: ${planData.summary.total_staff} Kişi`, 18, 44);
      doc.text(`Toplam Çekilecek Ürün: ${targetItems.reduce((acc, it) => acc + (it.total_quantity || it.quantity || 0), 0)} Adet`, 75, 44);
      doc.text(`Kutu Kapasitesi: ${boxCapacity} Adet/Kutu`, 140, 44);

      // Tablo Satırları
      const tableRows = targetItems.map((item, idx) => {
        const qty = item.total_quantity || item.quantity || 1;
        return [
          idx + 1,
          item.category || 'DİĞER',
          item.sku || '-',
          item.product_name || '-',
          item.color || 'STANDART',
          item.size || 'STD',
          qty,
          'DEPO-KAT-1',
          '[   ]'
        ];
      });

      autoTable(doc, {
        startY: 54,
        head: [['NO', 'KATEGORİ', 'SKU / KOD', 'ÜRÜN TANIMI', 'RENK', 'BEDEN', 'MİKTAR', 'LOKASYON', 'KONTROL']],
        body: tableRows,
        theme: 'grid',
        styles: {
          font: 'Roboto',
          fontSize: 8,
          cellPadding: 2,
          valign: 'middle'
        },
        headStyles: {
          fillColor: [30, 58, 138], // Indigo navy
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center'
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 10 },
          1: { halign: 'center', cellWidth: 20 },
          2: { halign: 'center', cellWidth: 26, fontStyle: 'bold' },
          3: { halign: 'left', cellWidth: 48 },
          4: { halign: 'center', cellWidth: 20 },
          5: { halign: 'center', cellWidth: 14, fontStyle: 'bold' },
          6: { halign: 'center', cellWidth: 16, fontStyle: 'bold' },
          7: { halign: 'center', cellWidth: 16 },
          8: { halign: 'center', cellWidth: 12 }
        },
        didDrawPage: (data) => {
          // Alt Bilgi & Sayfa No
          const pageCount = doc.internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184);
          doc.text(`Sayfa ${data.pageNumber} / ${pageCount}`, 14, 287);
          doc.text('Depodan Teslim Eden (İmza): ___________________    |    Teslim Alan (Mini-Sorter Operatörü): ___________________', 45, 287);
        }
      });

      const fileName = `Depo_Toplama_Listesi_${selectedBrand}_Tum_Siparisler.pdf`;
      doc.save(fileName);
      setFeedback({ type: 'success', text: `📄 ${fileName} başarıyla indirildi!` });
    } catch (err) {
      console.error('PDF oluşturma hatası:', err);
      setFeedback({ type: 'error', text: 'PDF oluşturulamadı: ' + err.message });
    }
  };

  // Doğrudan Tarayıcıdan Yazdırma (A4 Print Preview)
  const handleBrowserPrint = () => {
    window.print();
  };

  // Personel Fiş/Etiket Detay Modalı Aç
  const handleOpenPrintModal = async (staff) => {
    setSelectedStaffForPrint(staff);
    setLoadingPrintData(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/personnel-orders/${staff.id}/label-data`);
      const data = await res.json();
      if (data.success) {
        setPrintModalData(data);
      }
    } catch (e) {
      console.error('Baskı verisi çekilemedi:', e);
    } finally {
      setLoadingPrintData(false);
    }
  };

  // Filtrelenmiş Depo Toplama Listesi
  const filteredPickingList = useMemo(() => {
    if (!planData || !planData.consolidated_picking_list) return [];
    return planData.consolidated_picking_list.filter(it => {
      const matchCat = pickingCategoryFilter === 'ALL' || it.category === pickingCategoryFilter;
      const matchSearch = !pickingSearchQuery || 
        it.sku?.toLowerCase().includes(pickingSearchQuery.toLowerCase()) ||
        it.product_name?.toLowerCase().includes(pickingSearchQuery.toLowerCase()) ||
        it.size?.toLowerCase().includes(pickingSearchQuery.toLowerCase()) ||
        it.color?.toLowerCase().includes(pickingSearchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [planData, pickingCategoryFilter, pickingSearchQuery]);

  // Kategori Listesi
  const categories = useMemo(() => {
    if (!planData || !planData.consolidated_picking_list) return [];
    const set = new Set(planData.consolidated_picking_list.map(it => it.category).filter(Boolean));
    return ['ALL', ...Array.from(set)];
  }, [planData]);

  // UI Renkleri
  const cardBg = isLight ? '#ffffff' : '#111827';
  const borderCol = isLight ? '#e2e8f0' : '#1f2937';
  const textMuted = isLight ? '#64748b' : '#94a3b8';

  // ----------------------------------------------------
  // ÜRÜN CİNSİ KUTU İÇİ MAKS ADET & HACİM AYARLARI PANELİ (VE KATEGORİ İŞARETLEME)
  // ----------------------------------------------------
  const renderCategorySettingsContent = (isInsideModal = false) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        
        {/* 1. Ürün Cinsi Hızlı Seçim Butonları (Kategori İşaretleme) */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.8rem',
          padding: '0.8rem 1rem',
          borderRadius: '10px',
          background: isLight ? '#f0fdf4' : '#064e3b20',
          border: `1px solid ${isLight ? '#86efac' : '#05966950'}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.2rem' }}>🎯</span>
            <div>
              <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                İşleme Alınacak Ürün Cinsleri:
              </span>
              <span style={{ display: 'block', fontSize: '0.72rem', color: textMuted }}>
                Yalnızca işaretli kategoriler depodan toplanır ve sorter gözlerine paylaştırılır.
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => handleSelectAllCategories(true)}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid #10b981',
                background: isLight ? '#ecfdf5' : '#064e3b',
                color: '#10b981',
                fontWeight: '800',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              ✓ Tümünü Seç
            </button>
            <button
              type="button"
              onClick={() => handleSelectAllCategories(false)}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                border: `1px solid ${borderCol}`,
                background: 'transparent',
                color: textMuted,
                fontWeight: '800',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              ✕ Tümünü Kaldır
            </button>
            <button
              type="button"
              onClick={() => handleSelectCategoryGroup('WINTER')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid #3b82f6',
                background: isLight ? '#eff6ff' : '#1e3a8a',
                color: '#3b82f6',
                fontWeight: '800',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              ❄️ Kışlık Set
            </button>
            <button
              type="button"
              onClick={() => handleSelectCategoryGroup('SUMMER')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid #f59e0b',
                background: isLight ? '#fffbeb' : '#78350f',
                color: '#f59e0b',
                fontWeight: '800',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              ☀️ Yazlık Set
            </button>
            <button
              type="button"
              onClick={() => handleSelectCategoryGroup('HEAVY_TOPS')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid #8b5cf6',
                background: isLight ? '#f5f3ff' : '#4c1d95',
                color: '#8b5cf6',
                fontWeight: '800',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              🧥 Üst Giyim
            </button>
            <button
              type="button"
              onClick={() => handleSelectCategoryGroup('BOTTOMS')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid #06b6d4',
                background: isLight ? '#ecfeff' : '#164e63',
                color: '#06b6d4',
                fontWeight: '800',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              👖 Alt Giyim
            </button>
          </div>
        </div>

        {/* 2. Koli Kapasitesi & Koli Hacim Şablonları */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.8rem',
          padding: '0.8rem 1rem',
          borderRadius: '10px',
          background: isLight ? '#f8fafc' : '#1e293b',
          border: `1px solid ${borderCol}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.1rem' }}>📦</span>
              <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                Varsayılan Koli Kapasitesi:
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={boxCapacity}
                  onChange={(e) => {
                    const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                    setBoxCapacity(val);
                    saveBoxAndCategorySettings(val, categoryLimits, enabledCategories);
                  }}
                  style={{
                    width: '60px',
                    padding: '0.3rem',
                    borderRadius: '6px',
                    border: '2px solid #3b82f6',
                    textAlign: 'center',
                    fontWeight: '900',
                    fontSize: '0.95rem',
                    background: cardBg,
                    color: 'var(--text-primary)'
                  }}
                />
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: textMuted }}>Adet</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: '800', color: textMuted }}>
              Koli Hacim Şablonları:
            </span>
            <button
              type="button"
              onClick={() => handleApplyPreset('WINTER')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                border: boxCapacity === 5 ? '2px solid #3b82f6' : '1px solid #3b82f6',
                background: boxCapacity === 5 ? (isLight ? '#dbeafe' : '#1d4ed8') : (isLight ? '#eff6ff' : '#1e3a8a'),
                color: boxCapacity === 5 && !isLight ? '#ffffff' : '#3b82f6',
                fontWeight: '800',
                fontSize: '0.75rem',
                cursor: 'pointer',
                boxShadow: boxCapacity === 5 ? '0 0 8px rgba(59, 130, 246, 0.4)' : 'none'
              }}
            >
              ❄️ Kışlık Koli (5)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('SUMMER')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                border: boxCapacity === 8 ? '2px solid #f59e0b' : '1px solid #f59e0b',
                background: boxCapacity === 8 ? (isLight ? '#fef3c7' : '#b45309') : (isLight ? '#fffbeb' : '#78350f'),
                color: boxCapacity === 8 && !isLight ? '#ffffff' : '#f59e0b',
                fontWeight: '800',
                fontSize: '0.75rem',
                cursor: 'pointer',
                boxShadow: boxCapacity === 8 ? '0 0 8px rgba(245, 158, 11, 0.4)' : 'none'
              }}
            >
              ☀️ Yazlık Kompakt (8)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('XL_BOX')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                border: boxCapacity === 10 ? '2px solid #8b5cf6' : '1px solid #8b5cf6',
                background: boxCapacity === 10 ? (isLight ? '#ede9fe' : '#6d28d9') : (isLight ? '#f5f3ff' : '#4c1d95'),
                color: boxCapacity === 10 && !isLight ? '#ffffff' : '#8b5cf6',
                fontWeight: '800',
                fontSize: '0.75rem',
                cursor: 'pointer',
                boxShadow: boxCapacity === 10 ? '0 0 8px rgba(139, 92, 246, 0.4)' : 'none'
              }}
            >
              📦 Büyük Koli XL (10)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('RESET')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                border: boxCapacity === 7 ? `2px solid ${isLight ? '#0f172a' : '#f8fafc'}` : `1px solid ${borderCol}`,
                background: 'transparent',
                color: textMuted,
                fontWeight: '700',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              🔄 Standart (7)
            </button>
          </div>
        </div>

        {/* 3. Bilgilendirme ve Hacim Mantığı Kutusu */}
        <div style={{
          padding: '0.8rem 1.2rem',
          borderRadius: '10px',
          background: isLight ? 'rgba(59, 130, 246, 0.05)' : 'rgba(59, 130, 246, 0.1)',
          borderLeft: '4px solid #3b82f6',
          fontSize: '0.8rem',
          color: 'var(--text-primary)',
          lineHeight: '1.4'
        }}>
          <strong>💡 Akıllı Hacim & Seçili Ürün İşleme Mantığı:</strong> Mini-sorterda tüm ürünler aynı anda işlem görmeyebilir. Yalnızca <strong>işaretli olan ürün tipleri</strong> depodan toplanır ve sorter gözlerine paylaştırılır. 1 standart koli = <strong>%100 Hacim</strong> kabul edilir. Personelin işaretli ürünlerinin toplam hacim puanı %100'ü aştığında VEYA herhangi bir ürün kategorisinin kutu içi maks adedi aşıldığında sistem personeli otomatik olarak <strong>2 (veya 3) kutuya</strong> böler ve Mini-Sorter üzerinde 2 ayrı göz tahsis eder.
        </div>

        {/* 4. 9 Kategorili Ayar Kartları Izgarası */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
          gap: '1rem'
        }}>
          {Object.entries(categoryLimits).map(([catKey, conf]) => {
            const isEnabled = !!enabledCategories[catKey];
            const vol = conf.volume_points || 10;
            const maxQty = conf.max_per_box || 1;
            const isHeavy = vol >= 40 || maxQty <= 2;

            return (
              <div
                key={catKey}
                style={{
                  padding: '1.1rem',
                  borderRadius: '12px',
                  border: isEnabled 
                    ? (isHeavy ? '2px solid rgba(239, 68, 68, 0.5)' : (isLight ? '2px solid #3b82f680' : '2px solid #3b82f660'))
                    : `1px dashed ${borderCol}`,
                  background: isEnabled 
                    ? (isLight ? '#ffffff' : '#1e293b') 
                    : (isLight ? '#f8fafc' : '#0f172a'),
                  boxShadow: isEnabled ? '0 4px 12px rgba(0,0,0,0.06)' : 'none',
                  opacity: isEnabled ? 1 : 0.6,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.8rem',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Kart Başlığı ve Checkbox */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', userSelect: 'none' }}>
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={() => handleToggleCategory(catKey)}
                      style={{ width: '20px', height: '20px', accentColor: '#3b82f6', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '1.4rem' }}>{conf.icon || '👕'}</span>
                    <div>
                      <span style={{ fontWeight: '900', fontSize: '0.98rem', color: isEnabled ? 'var(--text-primary)' : textMuted }}>
                        {conf.label || catKey}
                      </span>
                      <span style={{ display: 'block', fontSize: '0.7rem', color: textMuted }}>
                        Kategori: {catKey}
                      </span>
                    </div>
                  </label>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
                    <span style={{
                      fontSize: '0.68rem',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      background: isEnabled ? '#10b98120' : (isLight ? '#e2e8f0' : '#334155'),
                      color: isEnabled ? '#10b981' : textMuted,
                      fontWeight: '800'
                    }}>
                      {isEnabled ? '✓ İŞLENECEK' : '✕ DEVRE DIŞI'}
                    </span>
                    {isHeavy && isEnabled && (
                      <span style={{
                        fontSize: '0.65rem',
                        padding: '0.1rem 0.4rem',
                        borderRadius: '4px',
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: '#ef4444',
                        fontWeight: '800'
                      }}>
                        Hacimli
                      </span>
                    )}
                  </div>
                </div>

                {/* İki Kritik Girdi: Maks Adet & Hacim Payı */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                  {/* 1. Kutu Başına Maks Adet */}
                  <div style={{
                    padding: '0.6rem',
                    borderRadius: '8px',
                    background: isLight ? '#f8fafc' : '#0f172a',
                    border: `1px solid ${borderCol}`
                  }}>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '800', color: textMuted, marginBottom: '0.3rem' }}>
                      Kutu İçi Maks Adet:
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        disabled={!isEnabled}
                        value={maxQty}
                        onChange={(e) => handleUpdateCategoryLimit(catKey, 'max_per_box', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.4rem',
                          borderRadius: '6px',
                          border: isEnabled ? '2px solid #3b82f6' : `1px solid ${borderCol}`,
                          textAlign: 'center',
                          fontWeight: '900',
                          fontSize: '1rem',
                          background: isEnabled ? cardBg : (isLight ? '#f1f5f9' : '#1e293b'),
                          color: isEnabled ? 'var(--text-primary)' : textMuted,
                          cursor: isEnabled ? 'text' : 'not-allowed'
                        }}
                      />
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: textMuted }}>Adet</span>
                    </div>
                  </div>

                  {/* 2. Kapladığı Hacim Payı (% Doluluk) */}
                  <div style={{
                    padding: '0.6rem',
                    borderRadius: '8px',
                    background: isLight ? '#f8fafc' : '#0f172a',
                    border: `1px solid ${borderCol}`
                  }}>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '800', color: textMuted, marginBottom: '0.3rem' }}>
                      1 Adet Hacim Payı:
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        disabled={!isEnabled}
                        value={vol}
                        onChange={(e) => handleUpdateCategoryLimit(catKey, 'volume_points', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.4rem',
                          borderRadius: '6px',
                          border: isEnabled ? (isHeavy ? '2px solid #ef4444' : '2px solid #10b981') : `1px solid ${borderCol}`,
                          textAlign: 'center',
                          fontWeight: '900',
                          fontSize: '1rem',
                          background: isEnabled ? cardBg : (isLight ? '#f1f5f9' : '#1e293b'),
                          color: isEnabled ? 'var(--text-primary)' : textMuted,
                          cursor: isEnabled ? 'text' : 'not-allowed'
                        }}
                      />
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: textMuted }}>% Hacim</span>
                    </div>
                  </div>
                </div>

                {/* Hacim Görsel İlerleme Çubuğu */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: textMuted, marginBottom: '0.2rem' }}>
                    <span>1 Kutu İçindeki Kapladığı Alan:</span>
                    <strong style={{ color: isEnabled ? (isHeavy ? '#ef4444' : '#10b981') : textMuted }}>%{vol}</strong>
                  </div>
                  <div style={{ height: '6px', width: '100%', background: isLight ? '#e2e8f0' : '#334155', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${isEnabled ? Math.min(100, vol) : 0}%`,
                      background: vol > 40 ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : 'linear-gradient(90deg, #3b82f6, #10b981)',
                      borderRadius: '3px'
                    }} />
                  </div>
                </div>

                <div style={{ fontSize: '0.7rem', color: textMuted, fontStyle: 'italic' }}>
                  {isEnabled 
                    ? `💬 ${maxQty > 1 ? `1 kutuya en çok ${maxQty} adet sığar.` : 'Tek kutuya en fazla 1 adet konabilir.'} Her adet kutunun %${vol}'sini doldurur.`
                    : '⚠️ Bu ürün tipi mini sorterda bu turda işleme alınmayacak (atlanacaktır).'
                  }
                </div>
              </div>
            );
          })}
        </div>

        {/* 5. Alt Aksiyon Butonları */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.8rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          {isInsideModal ? (
            <>
              <button
                type="button"
                onClick={() => setCategorySettingsModalOpen(false)}
                style={{
                  padding: '0.7rem 1.4rem',
                  borderRadius: '8px',
                  border: `1px solid ${borderCol}`,
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Kapat
              </button>

              <button
                type="button"
                onClick={() => {
                  if (selectedDepts.length > 0) {
                    handleCalculatePlan(currentStep >= 3 ? currentStep : 3);
                  } else {
                    setFeedback({ type: 'success', text: 'Kategori koli ve hacim ayarları kaydedildi!' });
                    setCategorySettingsModalOpen(false);
                  }
                }}
                style={{
                  padding: '0.75rem 1.8rem',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: '900',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)'
                }}
              >
                <span>💾</span>
                <span>Ayarları Uygula & Planı Yeniden Hesapla</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                style={{
                  padding: '0.75rem 1.6rem',
                  borderRadius: '10px',
                  border: `1px solid ${borderCol}`,
                  background: isLight ? '#f1f5f9' : '#1e293b',
                  color: 'var(--text-primary)',
                  fontWeight: '800',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <span>←</span>
                <span>1. Adıma Dön (Firma & Bölüm)</span>
              </button>

              <div style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                background: isLight ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.2)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                fontSize: '0.82rem',
                fontWeight: '800',
                color: '#3b82f6'
              }}>
                Seçili: {activeCategories.length} / 9 Ürün Cinsi ({activeCategories.length > 0 ? activeCategories.map(c => DEFAULT_CATEGORY_LIMITS[c]?.label || c).join(', ') : 'Hiçbiri'})
              </div>

              <button
                type="button"
                onClick={() => handleCalculatePlan(3)}
                disabled={loadingPlan || activeCategories.length === 0}
                style={{
                  padding: '0.85rem 2rem',
                  borderRadius: '10px',
                  background: activeCategories.length === 0 ? '#94a3b8' : 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: '900',
                  fontSize: '0.92rem',
                  cursor: activeCategories.length === 0 || loadingPlan ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  boxShadow: activeCategories.length > 0 ? '0 4px 14px rgba(16, 185, 129, 0.4)' : 'none'
                }}
              >
                {loadingPlan ? (
                  <span>⏳ Plan Hazırlanıyor...</span>
                ) : (
                  <>
                    <span>📄 3. ADIMA İLERLE: Depo Toplama Listesini Hazırla & PDF Al</span>
                    <span>➔</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '1.5rem 2rem', maxWidth: '1600px', margin: '0 auto', minHeight: '100vh' }}>
      
      {/* 0. GERİ BİLDİRİM BİLDİRİMİ */}
      {feedback && (
        <div style={{
          position: 'fixed',
          top: '2rem',
          right: '2rem',
          zIndex: 9999,
          padding: '1rem 1.8rem',
          borderRadius: '12px',
          fontWeight: 'bold',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          background: feedback.type === 'error' ? '#ef4444' : '#10b981',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          gap: '0.8rem',
          animation: 'fadeIn 0.3s ease'
        }}>
          <span>{feedback.type === 'error' ? '⚠️' : '✅'}</span>
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
        </div>
      )}

      {/* 1. ÜST BAŞLIK & GEZİNME */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <span style={{ fontSize: '2rem' }}>🔄</span>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: '900', margin: 0, color: 'var(--text-primary)' }}>
                PERSONEL BAZLI MİNİ-SORTER ÇALIŞMA AKIŞI
              </h1>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: textMuted }}>
                Firma & Sipariş Seçimi ➔ Bölüm Kotaları ➔ Depo Toplama Listesi (PDF) ➔ 60 Gözlü Sorter Döngü & Koli Yönetimi
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
          <button
            onClick={() => navigate(`/admin/personnel?brand=${encodeURIComponent(selectedBrand)}`)}
            style={{
              padding: '0.6rem 1.2rem',
              borderRadius: '8px',
              border: `1px solid ${borderCol}`,
              background: isLight ? '#f8fafc' : '#1e293b',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '0.85rem'
            }}
          >
            🎯 Personel Sorter Tablosu ({selectedBrand}) →
          </button>
          <button
            onClick={() => navigate('/admin/orders')}
            style={{
              padding: '0.6rem 1.2rem',
              borderRadius: '8px',
              border: `1px solid ${borderCol}`,
              background: isLight ? '#f8fafc' : '#1e293b',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '0.85rem'
            }}
          >
            📦 Siparişlerim →
          </button>
        </div>
      </div>

      {/* 2. 4 ADIMLI STEPPER ÇUBUĞU */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '0.8rem',
        marginBottom: '2rem',
        background: isLight ? 'rgba(241, 245, 249, 0.6)' : 'rgba(15, 23, 42, 0.6)',
        padding: '0.6rem',
        borderRadius: '14px',
        border: `1px solid ${borderCol}`
      }}>
        {[
          { step: 1, title: '1. Firma & Bölüm', desc: selectedBrand ? `${selectedBrand} (${selectedDepts.length} Bölüm)` : 'Firma Belirle', icon: '🏢' },
          { step: 2, title: '2. Ürün Tipleri & Koli', desc: `${activeCategories.length}/9 Ürün Cinsi Seçili`, icon: '⚙️' },
          { step: 3, title: '3. Depo Listesi & PDF', desc: planData ? `${planData.summary.total_pieces} Parça Toplanacak` : 'Liste Hazırla', icon: '📄' },
          { step: 4, title: '4. 60 Göz Sorter & Koli', desc: planData ? `${planData.waves.length} Döngü (Wave)` : 'Sorter Dağıtımı', icon: '🤖' }
        ].map(s => {
          const isActive = currentStep === s.step;
          const isDone = currentStep > s.step;
          return (
            <button
              key={s.step}
              onClick={() => setCurrentStep(s.step)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.8rem',
                padding: '0.8rem 1rem',
                borderRadius: '10px',
                border: isActive ? '2px solid #3b82f6' : `1px solid ${isDone ? '#10b981' : 'transparent'}`,
                background: isActive 
                  ? (isLight ? '#ffffff' : '#1e293b')
                  : (isDone ? (isLight ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.15)') : 'transparent'),
                color: 'var(--text-primary)',
                cursor: 'pointer',
                textAlign: 'left',
                boxShadow: isActive ? '0 4px 14px rgba(59, 130, 246, 0.2)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: isActive ? '#3b82f6' : (isDone ? '#10b981' : (isLight ? '#e2e8f0' : '#334155')),
                color: isActive || isDone ? '#ffffff' : textMuted,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '900',
                fontSize: '1rem',
                flexShrink: 0
              }}>
                {isDone ? '✓' : s.icon}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontWeight: '800', fontSize: '0.85rem', color: isActive ? '#3b82f6' : (isDone ? '#10b981' : 'var(--text-primary)') }}>
                  {s.title}
                </div>
                <div style={{ fontSize: '0.72rem', color: textMuted, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {s.desc}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* ADIM 1: FİRMA (MARKA) VE BÖLÜM SEÇİMİ                    */}
      {/* ======================================================== */}
      {currentStep === 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '1.5rem' }}>
          
          {/* Sol Panel: Firma ve Bölüm Seçimi */}
          <div style={{ background: cardBg, borderRadius: '16px', border: `1px solid ${borderCol}`, padding: '1.8rem', display: 'flex', flexDirection: 'column', gap: '1.8rem' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: '900', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span>🏢</span> 1. ADIM: Firma (Marka) ve Bölüm Seçimi
              </h2>
              <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.85rem', color: textMuted }}>
                Sipariş seçimi kaldırılmıştır. Markaya ait tüm açık ve kısmi kalan siparişler otomatik olarak kapsanır. İşlem yapılacak firma ve bölümleri seçiniz.
              </p>
            </div>

            {/* 1A. Firma Seçimi */}
            <div>
              <label style={{ display: 'block', fontWeight: '800', fontSize: '0.85rem', marginBottom: '0.6rem', color: textMuted }}>
                FİRMA / MARKA SEÇİNİZ:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.8rem' }}>
                {brands.map(b => {
                  const isSelected = selectedBrand === b.brand;
                  return (
                    <button
                      key={b.brand}
                      onClick={() => {
                        setSelectedBrand(b.brand);
                      }}
                      style={{
                        padding: '1rem',
                        borderRadius: '12px',
                        border: isSelected ? '2px solid #3b82f6' : `1px solid ${borderCol}`,
                        background: isSelected 
                          ? (isLight ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.2)') 
                          : (isLight ? '#f8fafc' : '#1e293b'),
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        textAlign: 'center',
                        boxShadow: isSelected ? '0 0 15px rgba(59, 130, 246, 0.25)' : 'none',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ fontSize: '1.2rem', fontWeight: '900', color: isSelected ? '#3b82f6' : 'var(--text-primary)' }}>
                        {b.brand}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: textMuted, marginTop: '0.3rem' }}>
                        👥 {b.staff_count} Personel
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 1B. Bölüm (Departman) Seçimi */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', flexWrap: 'wrap', gap: '0.8rem' }}>
                <label style={{ fontWeight: '800', fontSize: '0.85rem', color: textMuted }}>
                  İŞLEM YAPILACAK BÖLÜMLERİ SEÇİNİZ:
                </label>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedDepts(departments.map(d => d.department))}
                    style={{
                      padding: '0.4rem 0.8rem',
                      borderRadius: '6px',
                      border: `1px solid ${borderCol}`,
                      background: isLight ? '#f1f5f9' : '#1e293b',
                      color: 'var(--text-primary)',
                      fontWeight: '700',
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    ✓ Tümünü Seç
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDepts([])}
                    style={{
                      padding: '0.4rem 0.8rem',
                      borderRadius: '6px',
                      border: `1px solid ${borderCol}`,
                      background: isLight ? '#f1f5f9' : '#1e293b',
                      color: 'var(--text-primary)',
                      fontWeight: '700',
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    ✕ Temizle
                  </button>
                </div>
              </div>

              {/* Bölüm Kartları Izgarası */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.8rem' }}>
                {departments.map(d => {
                  const isSelected = selectedDepts.includes(d.department);
                  return (
                    <div
                      key={d.department}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedDepts(selectedDepts.filter(x => x !== d.department));
                        } else {
                          setSelectedDepts([...selectedDepts, d.department]);
                        }
                      }}
                      style={{
                        padding: '1rem',
                        borderRadius: '12px',
                        border: isSelected ? '2px solid #3b82f6' : `1px solid ${borderCol}`,
                        background: isSelected 
                          ? (isLight ? 'rgba(59, 130, 246, 0.06)' : 'rgba(59, 130, 246, 0.18)') 
                          : (isLight ? '#f8fafc' : '#1e293b'),
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: isSelected ? '0 4px 12px rgba(59, 130, 246, 0.15)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ fontWeight: '900', fontSize: '0.95rem', color: isSelected ? '#3b82f6' : 'var(--text-primary)' }}>
                          {d.department}
                        </div>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#3b82f6' }}
                        />
                      </div>

                      <div style={{ marginTop: '0.6rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', fontSize: '0.75rem' }}>
                        <div style={{ padding: '0.3rem 0.5rem', borderRadius: '6px', background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)' }}>
                          <span style={{ color: textMuted }}>Personel: </span>
                          <strong style={{ color: 'var(--text-primary)' }}>{d.staff_count}</strong>
                        </div>
                        <div style={{ padding: '0.3rem 0.5rem', borderRadius: '6px', background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)' }}>
                          <span style={{ color: textMuted }}>Tahmini: </span>
                          <strong style={{ color: '#10b981' }}>~{d.estimated_pieces} Pç</strong>
                        </div>
                        <div style={{ padding: '0.3rem 0.5rem', borderRadius: '6px', background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)' }}>
                          <span style={{ color: textMuted }}>Bayi: </span>
                          <strong style={{ color: 'var(--text-primary)' }}>{d.dealer_count}</strong>
                        </div>
                        <div style={{ padding: '0.3rem 0.5rem', borderRadius: '6px', background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)' }}>
                          <span style={{ color: textMuted }}>Koli: </span>
                          <strong style={{ color: '#8b5cf6' }}>~{d.estimated_boxes}</strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* İlerle Butonu */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${borderCol}`, paddingTop: '1.2rem', marginTop: '0.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ fontSize: '0.85rem', color: textMuted }}>
                Seçilen: <strong style={{ color: '#3b82f6' }}>{selectedDepts.length} Bölüm</strong> ({selectedDepartmentsStaffTotal} Personel)
              </div>

              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                disabled={selectedDepts.length === 0}
                style={{
                  padding: '0.9rem 2.2rem',
                  borderRadius: '10px',
                  background: selectedDepts.length === 0 ? '#94a3b8' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: '900',
                  fontSize: '0.95rem',
                  cursor: selectedDepts.length === 0 ? 'not-allowed' : 'pointer',
                  boxShadow: selectedDepts.length > 0 ? '0 4px 14px rgba(59, 130, 246, 0.4)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem'
                }}
              >
                <span>2. ADIMA İLERLE (Ürün Tipleri & Koli Ayarları)</span>
                <span>➔</span>
              </button>
            </div>
          </div>

          {/* Sağ Panel: Seçim Özeti Kartı */}
          <div style={{ background: cardBg, borderRadius: '16px', border: `1px solid ${borderCol}`, padding: '1.8rem', height: 'fit-content' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '900', marginBottom: '1.2rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>📋</span> SEÇİM ÖZETİ
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '0.9rem', borderRadius: '10px', background: isLight ? '#f1f5f9' : '#1e293b' }}>
                <span style={{ fontSize: '0.72rem', color: textMuted, display: 'block', fontWeight: '700' }}>SEÇİLİ FİRMA / MARKA</span>
                <span style={{ fontSize: '1.3rem', fontWeight: '900', color: '#3b82f6' }}>{selectedBrand || 'Seçilmedi'}</span>
              </div>

              <div style={{ padding: '0.9rem', borderRadius: '10px', background: isLight ? '#f1f5f9' : '#1e293b' }}>
                <span style={{ fontSize: '0.72rem', color: textMuted, display: 'block', fontWeight: '700' }}>SİPARİŞ KAPSAMI</span>
                <div style={{ fontSize: '0.95rem', fontWeight: '900', color: '#10b981', marginTop: '0.2rem' }}>
                  Tüm Yeni & Kısmi Kalan Siparişler
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.5rem' }}>
                  {orders.map(o => (
                    <span key={o.order_number} style={{
                      padding: '0.15rem 0.45rem',
                      borderRadius: '4px',
                      background: isLight ? '#e2e8f0' : '#334155',
                      fontSize: '0.7rem',
                      fontWeight: '800',
                      color: 'var(--text-primary)'
                    }}>
                      #{o.order_number}
                    </span>
                  ))}
                </div>
                <span style={{ fontSize: '0.7rem', color: textMuted, display: 'block', marginTop: '0.4rem' }}>
                  Markaya ait açık ve kısmi siparişler tek havuzda birleştirilir.
                </span>
              </div>

              <div style={{ padding: '0.9rem', borderRadius: '10px', background: isLight ? '#f1f5f9' : '#1e293b' }}>
                <span style={{ fontSize: '0.72rem', color: textMuted, display: 'block', fontWeight: '700' }}>SEÇİLİ BÖLÜM SAYISI</span>
                <span style={{ fontSize: '1.15rem', fontWeight: '900', color: 'var(--text-primary)' }}>
                  {selectedDepts.length} / {departments.length} Bölüm
                </span>
              </div>

              <div style={{ padding: '0.9rem', borderRadius: '10px', background: isLight ? '#f1f5f9' : '#1e293b' }}>
                <span style={{ fontSize: '0.72rem', color: textMuted, display: 'block', fontWeight: '700' }}>KAPSAMDAKİ TOPLAM PERSONEL</span>
                <span style={{ fontSize: '1.3rem', fontWeight: '900', color: '#10b981' }}>
                  {selectedDepartmentsStaffTotal} Personel
                </span>
              </div>

              <div style={{ padding: '0.9rem', borderRadius: '10px', background: isLight ? '#f1f5f9' : '#1e293b' }}>
                <span style={{ fontSize: '0.72rem', color: textMuted, display: 'block', fontWeight: '700' }}>KULLANILABİLİR MİNİ-SORTER KAPASİTESİ</span>
                <span style={{ fontSize: '1.15rem', fontWeight: '900', color: '#8b5cf6' }}>60 Göz (1-60)</span>
                <span style={{ fontSize: '0.7rem', color: textMuted, display: 'block', marginTop: '0.2rem' }}>OmniSort Mini 8 Duvar Haritası</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ADIM 2: ÜRÜN CİNSİ KUTU İÇİ MAKS ADET & AKILLI HACİM     */}
      {/* ======================================================== */}
      {currentStep === 2 && (
        <div style={{ background: cardBg, borderRadius: '16px', border: `1px solid ${borderCol}`, padding: '1.8rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: '900', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span>⚙️</span> 2. ADIM: Ürün Cinsine Göre Kutu İçi Maks Adetler & Akıllı Hacim
              </h2>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: textMuted }}>
                Mini-Sorter'da sırayla işlem görecek ürün cinslerini işaretleyiniz. Tüm seçenekler hepsi birden mini sorterda işlem görmeyebilir; sadece seçilen ürün tipleri ile adım adım işlem yapılır.
              </p>
            </div>
          </div>

          {renderCategorySettingsContent(false)}
        </div>
      )}

      {/* ======================================================== */}
      {/* ADIM 3: DEPO TOPLAMA LİSTESİ & PDF ÇIKTISI                */}
      {/* ======================================================== */}
      {currentStep === 3 && planData && (
        <div style={{ background: cardBg, borderRadius: '16px', border: `1px solid ${borderCol}`, padding: '1.8rem' }}>
          
          {/* Üst Bilgi Bantı & KPI Sayaçları */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: '900', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span>📄</span> 3. ADIM: Konsolide Depo Malzeme Çeki Listesi & PDF Raporu
              </h2>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: textMuted }}>
                Depodan getirilmesi gereken toplam beden, renk ve ürün miktarları hesaplandı. Bu PDF ekrandan görüntülenebilir veya yazıcıya gönderilebilir.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: textMuted }}>İşleme Alınan Ürün Cinsleri:</span>
                {activeCategories.map(cat => (
                  <span key={cat} style={{
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                    background: isLight ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.25)',
                    color: '#3b82f6',
                    fontSize: '0.72rem',
                    fontWeight: '800'
                  }}>
                    {DEFAULT_CATEGORY_LIMITS[cat]?.icon || '📦'} {DEFAULT_CATEGORY_LIMITS[cat]?.label || cat}
                  </span>
                ))}
              </div>
            </div>

            {/* Aksiyon Butonları: PDF & Yazdır */}
            <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => setCurrentStep(2)}
                style={{
                  padding: '0.75rem 1.2rem',
                  borderRadius: '10px',
                  background: isLight ? '#f1f5f9' : '#1e293b',
                  color: 'var(--text-primary)',
                  border: `1px solid ${borderCol}`,
                  fontWeight: '800',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <span>←</span>
                <span>2. Adıma Dön (Ürün & Koli)</span>
              </button>

              <button
                onClick={() => handleGeneratePdf(planData.consolidated_picking_list, 'KONSOLİDE TÜM BÖLÜMLER')}
                style={{
                  padding: '0.75rem 1.4rem',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: '900',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                }}
              >
                <span>📄</span>
                <span>DEPO TOPLAMA LİSTESİ PDF İNDİR</span>
              </button>

              <button
                onClick={handleBrowserPrint}
                style={{
                  padding: '0.75rem 1.4rem',
                  borderRadius: '10px',
                  background: isLight ? '#f1f5f9' : '#1e293b',
                  color: 'var(--text-primary)',
                  border: `1px solid ${borderCol}`,
                  fontWeight: '800',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <span>🖨️</span>
                <span>YAZDIR (A4 ÇEKİ LİSTESİ)</span>
              </button>

              <button
                onClick={() => setCategorySettingsModalOpen(true)}
                style={{
                  padding: '0.75rem 1.3rem',
                  borderRadius: '10px',
                  background: isLight ? '#f1f5f9' : '#1e293b',
                  color: 'var(--text-primary)',
                  border: `1px solid ${borderCol}`,
                  fontWeight: '800',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <span>⚙️</span>
                <span>Kutu Hacim & Maks Adet Ayarları</span>
              </button>

              <button
                onClick={() => setCurrentStep(4)}
                style={{
                  padding: '0.75rem 1.6rem',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: '900',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
                }}
              >
                <span>🤖 4. ADIM: 60 Göz Sorter Yönetimine Geç ➔</span>
              </button>
            </div>
          </div>

          {/* İstatistik Sayaç Kutuları */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ padding: '1rem', borderRadius: '12px', background: isLight ? '#f8fafc' : '#1e293b', border: `1px solid ${borderCol}` }}>
              <span style={{ fontSize: '0.72rem', color: textMuted, display: 'block' }}>TOPLAM PERSONEL</span>
              <span style={{ fontSize: '1.4rem', fontWeight: '900', color: '#3b82f6' }}>{planData.summary.total_staff} Kişi</span>
            </div>
            <div style={{ padding: '1rem', borderRadius: '12px', background: isLight ? '#f8fafc' : '#1e293b', border: `1px solid ${borderCol}` }}>
              <span style={{ fontSize: '0.72rem', color: textMuted, display: 'block' }}>DEPODAN GELECEK TOPLAM KIYAFET</span>
              <span style={{ fontSize: '1.4rem', fontWeight: '900', color: '#10b981' }}>{planData.summary.total_pieces} Parça</span>
            </div>
            <div style={{ padding: '1rem', borderRadius: '12px', background: isLight ? '#f8fafc' : '#1e293b', border: `1px solid ${borderCol}` }}>
              <span style={{ fontSize: '0.72rem', color: textMuted, display: 'block' }}>FARKLI ÜRÜN & BEDEN ÇEŞİDİ</span>
              <span style={{ fontSize: '1.4rem', fontWeight: '900', color: '#f59e0b' }}>{planData.summary.distinct_sku_count} Çeşit</span>
            </div>
            <div style={{ padding: '1rem', borderRadius: '12px', background: isLight ? '#f8fafc' : '#1e293b', border: `1px solid ${borderCol}` }}>
              <span style={{ fontSize: '0.72rem', color: textMuted, display: 'block' }}>HESAPLANAN DÖNGÜ (WAVE)</span>
              <span style={{ fontSize: '1.4rem', fontWeight: '900', color: '#8b5cf6' }}>{planData.summary.total_waves} Döngü (60 Gözlük)</span>
            </div>
          </div>

          {/* Filtre ve Arama Çubuğu */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.8rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {categories.map(c => (
                <button
                  key={c}
                  onClick={() => setPickingCategoryFilter(c)}
                  style={{
                    padding: '0.4rem 0.9rem',
                    borderRadius: '20px',
                    border: pickingCategoryFilter === c ? '2px solid #3b82f6' : `1px solid ${borderCol}`,
                    background: pickingCategoryFilter === c ? (isLight ? '#3b82f6' : '#2563eb') : 'transparent',
                    color: pickingCategoryFilter === c ? '#ffffff' : textMuted,
                    fontWeight: '800',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  {c === 'ALL' ? 'TÜM KATEGORİLER' : c}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="text"
                value={pickingSearchQuery}
                onChange={(e) => setPickingSearchQuery(e.target.value)}
                placeholder="🔍 Ürün, SKU, Beden veya Renk Ara..."
                style={{
                  padding: '0.5rem 0.9rem',
                  borderRadius: '8px',
                  border: `1px solid ${borderCol}`,
                  background: isLight ? '#ffffff' : '#1e293b',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  width: '260px'
                }}
              />
            </div>
          </div>

          {/* Depo Toplama Tablosu */}
          <div style={{ overflowX: 'auto', borderRadius: '12px', border: `1px solid ${borderCol}` }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: isLight ? '#f1f5f9' : '#1e293b', borderBottom: `2px solid ${borderCol}` }}>
                  <th style={{ padding: '0.8rem 1rem', width: '50px', textAlign: 'center' }}>NO</th>
                  <th style={{ padding: '0.8rem 1rem', width: '110px' }}>KATEGORİ</th>
                  <th style={{ padding: '0.8rem 1rem', width: '130px' }}>SKU / KOD</th>
                  <th style={{ padding: '0.8rem 1rem' }}>ÜRÜN TANIMI & MODEL</th>
                  <th style={{ padding: '0.8rem 1rem', width: '110px', textAlign: 'center' }}>RENK</th>
                  <th style={{ padding: '0.8rem 1rem', width: '90px', textAlign: 'center' }}>BEDEN</th>
                  <th style={{ padding: '0.8rem 1rem', width: '130px', textAlign: 'center' }}>TOPLAM MİKTAR</th>
                  <th style={{ padding: '0.8rem 1rem', width: '90px', textAlign: 'center' }}>KONTROL</th>
                </tr>
              </thead>
              <tbody>
                {filteredPickingList.map((item, idx) => {
                  const isChecked = !!checkedItems[item.sku + item.size];
                  return (
                    <tr
                      key={item.sku + item.size + idx}
                      style={{
                        borderBottom: `1px solid ${borderCol}`,
                        background: isChecked 
                          ? (isLight ? 'rgba(16, 185, 129, 0.05)' : 'rgba(16, 185, 129, 0.1)') 
                          : (idx % 2 === 0 ? 'transparent' : (isLight ? 'rgba(0,0,0,0.01)' : 'rgba(255,255,255,0.01)'))
                      }}
                    >
                      <td style={{ padding: '0.7rem 1rem', textAlign: 'center', fontWeight: 'bold', color: textMuted }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: '0.7rem 1rem' }}>
                        <span style={{
                          padding: '0.25rem 0.6rem',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: '800',
                          background: item.category === 'MONT' ? '#ea580c' : (item.category === 'PANTOLON' ? '#1e3a8a' : (item.category === 'GÖMLEK' ? '#0284c7' : '#475569')),
                          color: '#ffffff'
                        }}>
                          {item.category}
                        </span>
                      </td>
                      <td style={{ padding: '0.7rem 1rem', fontWeight: '900', color: 'var(--text-primary)' }}>
                        {item.sku}
                      </td>
                      <td style={{ padding: '0.7rem 1rem' }}>
                        <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{item.product_name}</div>
                        {item.sample_staff && (
                          <div style={{ fontSize: '0.7rem', color: textMuted, marginTop: '0.1rem' }}>
                            Örnek Personeller: {item.sample_staff}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '0.7rem 1rem', textAlign: 'center', fontWeight: '700', color: textMuted }}>
                        {item.color}
                      </td>
                      <td style={{ padding: '0.7rem 1rem', textAlign: 'center' }}>
                        <span style={{
                          padding: '0.2rem 0.6rem',
                          borderRadius: '6px',
                          fontWeight: '900',
                          fontSize: '0.85rem',
                          background: isLight ? '#f1f5f9' : '#334155',
                          color: 'var(--text-primary)',
                          border: `1px solid ${borderCol}`
                        }}>
                          {item.size}
                        </span>
                      </td>
                      <td style={{ padding: '0.7rem 1rem', textAlign: 'center' }}>
                        <span style={{
                          padding: '0.35rem 0.9rem',
                          borderRadius: '8px',
                          fontWeight: '900',
                          fontSize: '1rem',
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#10b981',
                          border: '1px solid rgba(16, 185, 129, 0.4)'
                        }}>
                          {item.total_quantity} Adet
                        </span>
                      </td>
                      <td style={{ padding: '0.7rem 1rem', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            setCheckedItems({
                              ...checkedItems,
                              [item.sku + item.size]: e.target.checked
                            });
                          }}
                          style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#10b981' }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Alt Gezinme Butonları */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <button
              onClick={() => setCurrentStep(2)}
              style={{
                padding: '0.7rem 1.4rem',
                borderRadius: '8px',
                border: `1px solid ${borderCol}`,
                background: 'transparent',
                color: 'var(--text-primary)',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              ← 2. Adıma Dön
            </button>

            <button
              onClick={() => setCurrentStep(4)}
              style={{
                padding: '0.9rem 2.2rem',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                color: '#ffffff',
                border: 'none',
                fontWeight: '900',
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(139, 92, 246, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem'
              }}
            >
              <span>4. ADIM: 60 Gözlü Sorter & Koli Dağıtımını Başlat</span>
              <span>➔</span>
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ADIM 4: 60 GÖZ MİNİ-SORTER DÖNGÜ & KOLİ YÖNETİM MERKEZİ    */}
      {/* ======================================================== */}
      {currentStep === 4 && planData && (
        <div>
          {/* Döngü Seçici Sekmeler (Waves Selector) */}
          <div style={{ background: cardBg, borderRadius: '16px', border: `1px solid ${borderCol}`, padding: '1.4rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.8rem' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: '900', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span>🤖</span> 4. ADIM: Mini-Sorter 60 Göz Döngü (Wave) & Koli Yönetimi
                </h2>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: textMuted }}>
                  Toplam {planData.summary.total_staff} personel için 60'ar gözlük döngüler oluşturuldu. Sırayla depodan ürünler getirilir, gözlere dağıtılır ve koli etiketleri basılır.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button
                  onClick={() => setCategorySettingsModalOpen(true)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    border: `1px solid ${borderCol}`,
                    background: isLight ? '#f1f5f9' : '#1e293b',
                    color: 'var(--text-primary)',
                    fontWeight: '700',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <span>⚙️</span>
                  <span>Kutu Hacim Ayarları</span>
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    border: `1px solid ${borderCol}`,
                    background: 'transparent',
                    color: 'var(--text-primary)',
                    fontWeight: '700',
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  ← Depo Listesine Dön
                </button>
              </div>
            </div>

            {/* Döngü Butonları */}
            <div style={{ display: 'flex', gap: '0.8rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
              {planData.waves.map((w, wIdx) => {
                const isSelected = activeWaveIndex === wIdx;
                const isAllocated = allocatedWaveSuccess === w.wave_no;
                return (
                  <button
                    key={w.wave_no}
                    onClick={() => setActiveWaveIndex(wIdx)}
                    style={{
                      padding: '1rem 1.4rem',
                      borderRadius: '12px',
                      border: isSelected ? '2px solid #8b5cf6' : `1px solid ${borderCol}`,
                      background: isSelected 
                        ? (isLight ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.25)') 
                        : (isLight ? '#f8fafc' : '#1e293b'),
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      minWidth: '220px',
                      boxShadow: isSelected ? '0 4px 14px rgba(139, 92, 246, 0.25)' : 'none',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '900', fontSize: '1rem', color: isSelected ? '#8b5cf6' : 'var(--text-primary)' }}>
                        {w.title}
                      </span>
                      {isAllocated && (
                        <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '4px', background: '#10b981', color: '#fff', fontWeight: 'bold' }}>
                          SORTER'DA
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: textMuted, marginTop: '0.4rem' }}>
                      👥 {w.staff_count} Personel  |  🧵 {w.total_pieces} Parça
                    </div>
                    <div style={{ fontSize: '0.72rem', color: isSelected ? '#8b5cf6' : textMuted, marginTop: '0.2rem', fontWeight: 'bold' }}>
                      🎯 {w.total_chutes} Sorter Gözü Kullanılıyor
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Aktif Döngü Operasyon Kontrol Kartı */}
          {planData.waves[activeWaveIndex] && (
            <div style={{ background: cardBg, borderRadius: '16px', border: `1px solid ${borderCol}`, padding: '1.6rem', marginBottom: '1.5rem' }}>
              {(() => {
                const currentWave = planData.waves[activeWaveIndex];
                return (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '1px' }}>
                          AKTİF ÇALIŞILAN DÖNGÜ:
                        </span>
                        <h3 style={{ fontSize: '1.3rem', fontWeight: '900', margin: '0.2rem 0', color: 'var(--text-primary)' }}>
                          {currentWave.title} ({currentWave.staff_count} Personel / {currentWave.total_pieces} Parça)
                        </h3>
                      </div>

                      {/* Döngü Butonları */}
                      <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                        {/* Bu Döngünün Özel Depo Listesi PDF'i */}
                        <button
                          onClick={() => handleGeneratePdf(currentWave.picking_items, `${currentWave.wave_no}. DÖNGÜ (WAVE ${currentWave.wave_no})`)}
                          style={{
                            padding: '0.75rem 1.2rem',
                            borderRadius: '10px',
                            background: isLight ? '#f1f5f9' : '#1e293b',
                            color: 'var(--text-primary)',
                            border: `1px solid ${borderCol}`,
                            fontWeight: '800',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}
                        >
                          <span>📄</span>
                          <span>Bu Döngünün Depo Listesi (PDF)</span>
                        </button>

                        {/* Bu Döngüyü Sorter'a Dağıt */}
                        <button
                          onClick={() => handleAllocateWaveToSorter(currentWave)}
                          disabled={allocatingWave}
                          style={{
                            padding: '0.75rem 1.6rem',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                            color: '#ffffff',
                            border: 'none',
                            fontWeight: '900',
                            fontSize: '0.85rem',
                            cursor: allocatingWave ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)'
                          }}
                        >
                          <span>⚡</span>
                          <span>{allocatingWave ? 'Gözlere Dağıtılıyor...' : 'Bu Döngüyü Sorter Gözlerine Dağıt (1-60)'}</span>
                        </button>

                        {/* Dağıtılan Döngüyü Takip Sayfasına Git */}
                        {allocatedWaveSuccess === currentWave.wave_no && (
                          <button
                            onClick={() => navigate(`/admin/personnel?brand=${encodeURIComponent(selectedBrand)}`)}
                            style={{
                              padding: '0.75rem 1.6rem',
                              borderRadius: '10px',
                              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                              color: '#ffffff',
                              border: 'none',
                              fontWeight: '900',
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)'
                            }}
                          >
                            <span>🎯</span>
                            <span>{selectedBrand} Sorter Takip Ekranına Git →</span>
                          </button>
                        )}

                        {/* Döngüyü Tamamla ve Sıradakine Geç */}
                        <button
                          onClick={() => handleCompleteWave(currentWave)}
                          style={{
                            padding: '0.75rem 1.6rem',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            color: '#ffffff',
                            border: 'none',
                            fontWeight: '900',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                          }}
                        >
                          <span>✅</span>
                          <span>Döngüyü Bitir & Kolile → Sıradakine Geç</span>
                        </button>
                      </div>
                    </div>

                    {/* Döngüdeki Personeller ve Göz Dağılım Tablosu */}
                    <div style={{ overflowX: 'auto', borderRadius: '12px', border: `1px solid ${borderCol}` }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                        <thead>
                          <tr style={{ background: isLight ? '#f1f5f9' : '#1e293b', borderBottom: `2px solid ${borderCol}` }}>
                            <th style={{ padding: '0.7rem 1rem', width: '50px', textAlign: 'center' }}>SIRA</th>
                            <th style={{ padding: '0.7rem 1rem', width: '140px' }}>SORTER GÖZÜ</th>
                            <th style={{ padding: '0.7rem 1rem' }}>PERSONEL ADI</th>
                            <th style={{ padding: '0.7rem 1rem' }}>BAYİ / SERVİS MERKEZİ</th>
                            <th style={{ padding: '0.7rem 1rem' }}>BÖLÜM</th>
                            <th style={{ padding: '0.7rem 1rem', width: '100px', textAlign: 'center' }}>KOLİ NO</th>
                            <th style={{ padding: '0.7rem 1rem', width: '110px', textAlign: 'center' }}>TOPLAM PARÇA</th>
                            <th style={{ padding: '0.7rem 1rem', width: '130px', textAlign: 'center' }}>KOLİ BARKODU</th>
                            <th style={{ padding: '0.7rem 1rem', width: '160px', textAlign: 'center' }}>İŞLEMLER</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentWave.staff_list.map((st, sIdx) => {
                            const chuteStr = st.assigned_chutes && st.assigned_chutes.length > 0 
                              ? st.assigned_chutes.map(c => `CH-${c}`).join(', ') 
                              : (st.sorter_chute ? `CH-${st.sorter_chute}` : 'Bekliyor');
                            const boxBarcode = st.box_barcode || `KOLI-${(st.brand || 'VOG').substring(0, 2).toUpperCase()}-${String(st.id).replace(/-/g, '').substring(0, 6).toUpperCase()}`;

                            return (
                              <tr
                                key={st.id}
                                style={{
                                  borderBottom: `1px solid ${borderCol}`,
                                  background: sIdx % 2 === 0 ? 'transparent' : (isLight ? 'rgba(0,0,0,0.01)' : 'rgba(255,255,255,0.01)')
                                }}
                              >
                                <td style={{ padding: '0.7rem 1rem', textAlign: 'center', fontWeight: 'bold', color: textMuted }}>
                                  {sIdx + 1}
                                </td>
                                <td style={{ padding: '0.7rem 1rem' }}>
                                  <span style={{
                                    padding: '0.3rem 0.8rem',
                                    borderRadius: '6px',
                                    fontWeight: '900',
                                    fontSize: '0.85rem',
                                    background: '#3b82f6',
                                    color: '#ffffff',
                                    boxShadow: '0 2px 6px rgba(59, 130, 246, 0.3)'
                                  }}>
                                    🎯 {chuteStr}
                                  </span>
                                </td>
                                <td style={{ padding: '0.7rem 1rem', fontWeight: '900', color: 'var(--text-primary)' }}>
                                  {st.name}
                                </td>
                                <td style={{ padding: '0.7rem 1rem', color: textMuted }}>
                                  🏢 {st.service_center || 'GENEL'}
                                </td>
                                <td style={{ padding: '0.7rem 1rem', fontSize: '0.8rem' }}>
                                  {st.department}
                                </td>
                                <td style={{ padding: '0.7rem 1rem', textAlign: 'center' }}>
                                  <span style={{
                                    padding: '0.25rem 0.6rem',
                                    borderRadius: '6px',
                                    fontWeight: '800',
                                    fontSize: '0.78rem',
                                    background: (st.boxes_needed > 1) ? 'rgba(245, 158, 11, 0.15)' : (isLight ? '#f1f5f9' : '#334155'),
                                    color: (st.boxes_needed > 1) ? '#d97706' : 'inherit',
                                    border: (st.boxes_needed > 1) ? '1px solid rgba(245, 158, 11, 0.4)' : 'none',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.3rem'
                                  }}>
                                    <span>📦</span>
                                    <span>{st.boxes_needed > 1 ? `${st.boxes_needed} Koli` : `1 Koli`}</span>
                                  </span>
                                  {st.volume_points ? (
                                    <div style={{ fontSize: '0.68rem', color: textMuted, marginTop: '2px', fontWeight: 'bold' }}>
                                      %{st.volume_points} Hacim
                                    </div>
                                  ) : null}
                                </td>
                                <td style={{ padding: '0.7rem 1rem', textAlign: 'center', fontWeight: '900', color: '#10b981' }}>
                                  {st.total_items} Parça
                                </td>
                                <td style={{ padding: '0.7rem 1rem', textAlign: 'center' }}>
                                  <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 'bold' }}>
                                    {boxBarcode}
                                  </span>
                                </td>
                                <td style={{ padding: '0.7rem 1rem', textAlign: 'center' }}>
                                  <button
                                    onClick={() => handleOpenPrintModal(st)}
                                    style={{
                                      padding: '0.4rem 0.9rem',
                                      borderRadius: '6px',
                                      background: '#10b981',
                                      color: '#ffffff',
                                      border: 'none',
                                      fontWeight: '800',
                                      fontSize: '0.78rem',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.3rem',
                                      boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)'
                                    }}
                                  >
                                    <span>🏷️</span>
                                    <span>Koli Etiketi</span>
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* OmniSort Mini 60 Göz Canlı Saha Matrisi Önizlemesi */}
          <div style={{ background: cardBg, borderRadius: '16px', border: `1px solid ${borderCol}`, padding: '1.6rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.8rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '900', margin: 0, color: 'var(--text-primary)' }}>
                  🏭 OMNISORT MINI (HC ROBOTICS) 60 GÖZ SAHA DURUMU
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: textMuted }}>
                  Ürünler sorter konveyöründen okutuldukça otomatik olarak bu gözlerdeki personellere düşer.
                </p>
              </div>

              <button
                onClick={fetchLiveChutes}
                style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: '6px',
                  border: `1px solid ${borderCol}`,
                  background: 'transparent',
                  color: textMuted,
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 'bold'
                }}
              >
                🔄 Canlı Yenile
              </button>
            </div>

            {/* 60 Göz Grid Matrisi (1-60) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.6rem' }}>
              {Array.from({ length: 60 }, (_, idx) => {
                const chNo = idx + 1;
                const live = chutesLiveState.find(c => c.chute_no === chNo);
                const wallStyle = getChuteWallStyle(chNo);
                const isAssigned = live && live.status === 'ASSIGNED';
                const isPacked = live && live.item_count >= (live.target_capacity || 7) && live.item_count > 0;

                return (
                  <div
                    key={chNo}
                    style={{
                      height: '85px',
                      borderRadius: '8px',
                      border: isPacked ? '2px solid #10b981' : (isAssigned ? '1px solid #3b82f6' : `1px solid ${borderCol}`),
                      background: isPacked 
                        ? 'rgba(16, 185, 129, 0.2)' 
                        : (isAssigned ? (isLight ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.2)') : (isLight ? '#f8fafc' : '#1e293b')),
                      padding: '0.4rem 0.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: '900', color: wallStyle?.colorHex || '#3b82f6' }}>
                        CH-{chNo < 10 ? `0${chNo}` : chNo}
                      </span>
                      <span style={{
                        fontSize: '0.65rem',
                        fontWeight: '800',
                        color: isPacked ? '#10b981' : (isAssigned ? '#3b82f6' : textMuted)
                      }}>
                        {live ? `${live.item_count || 0}/${live.target_capacity || 7}` : '0/7'}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.7rem', fontWeight: '800', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)' }}>
                      {live?.assigned_destination || 'Boş Göz'}
                    </div>

                    <div style={{
                      height: '4px',
                      width: '100%',
                      background: isLight ? '#e2e8f0' : '#334155',
                      borderRadius: '2px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min(100, Math.round(((live?.item_count || 0) / Math.max(1, live?.target_capacity || 7)) * 100))}%`,
                        background: isPacked ? '#10b981' : '#3b82f6'
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. PERSONEL KOLİ ETİKETİ & FİŞ MODALI                     */}
      {/* ======================================================== */}
      {printModalData && (
        <PersonnelLabelAndReceiptModal
          isOpen={!!printModalData}
          onClose={() => setPrintModalData(null)}
          data={printModalData}
          onPrintSuccess={() => {
            setFeedback({ type: 'success', text: 'Koli etiketi başarıyla yazdırıldı!' });
            fetchLiveChutes();
          }}
        />
      )}

      {/* ======================================================== */}
      {/* 6. KUTU İÇİ MAKS ADET & HACİM AYARLARI MODALI            */}
      {/* ======================================================== */}
      {categorySettingsModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 9998,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          animation: 'fadeIn 0.2s ease'
        }}>
          <div style={{
            background: cardBg,
            borderRadius: '18px',
            border: `1px solid ${borderCol}`,
            width: '100%',
            maxWidth: '1100px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            overflow: 'hidden'
          }}>
            {/* Modal Başlığı */}
            <div style={{
              padding: '1.2rem 1.6rem',
              borderBottom: `1px solid ${borderCol}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: isLight ? '#f8fafc' : '#1e293b'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <span style={{ fontSize: '1.6rem' }}>⚙️</span>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '900', margin: 0, color: 'var(--text-primary)' }}>
                    Ürün Cinsine Göre Kutu İçi Maksimum Adet & Hacim Ayarları
                  </h3>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: textMuted }}>
                    Kutunun kapladığı alan ve adet sınırlarını güncelleyip planı anında yeniden hesaplayabilirsiniz.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setCategorySettingsModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.4rem',
                  color: textMuted,
                  cursor: 'pointer',
                  padding: '0.4rem'
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Gövdesi */}
            <div style={{ padding: '1.6rem', overflowY: 'auto' }}>
              {renderCategorySettingsContent(true)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonnelSorterWorkflowPage;
