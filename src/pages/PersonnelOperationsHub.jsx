import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import API_BASE_URL from '../services/apiConfig';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ROBOTO_REGULAR, ROBOTO_BOLD } from '../assets/fonts/fonts.js';
import bwipjs from '@bwip-js/browser';

// Reusable Barcode / QRCode canvas generator
const BarcodeCanvas = ({ text, bcid = 'code128', scale = 2, height = 12 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current && text) {
      try {
        bwipjs.toCanvas(canvasRef.current, {
          bcid: bcid,
          text: String(text),
          scale: scale,
          height: height,
          includetext: true,
          textxalign: 'center',
          textcolor: '000000'
        });
      } catch (err) {
        console.warn('Barcode render error:', err);
      }
    }
  }, [text, bcid, scale, height]);

  return <canvas ref={canvasRef} style={{ maxWidth: '100%', height: 'auto', display: 'block', margin: '0 auto' }} />;
};

const TARGET_DEFAULT_ROLES = [
  'Tümü',
  'Servis Danışmanı',
  'Diğer Servis Danışmanı',
  'Formen',
  'Mekanik Teknisyen',
  'Kaporta Teknisyen',
  'Master Teknisyen',
  'GarantiDispozisyon'
];

const STANDARD_TOP_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', 'STD'];
const STANDARD_BOTTOM_SIZES = ['42', '44', '46', '48', '50', '52', '54', '56', '58', 'STD'];

const PersonnelOperationsHub = () => {
  const navigate = useNavigate();
  const { themeMode, t } = useLanguage();
  const isLight = themeMode === 'light';

  // Core Data States
  const [brands, setBrands] = useState(['SEAT', 'NISSAN', 'FORD', 'AUDI', 'VOLKSWAGEN']);
  const [selectedBrand, setSelectedBrand] = useState('SEAT');
  const [shipments, setShipments] = useState([]);
  const [stats, setStats] = useState({
    totalPersonnel: 0,
    totalDealers: 0,
    totalItems: 0,
    totalOrders: 0,
    pendingCount: 0,
    shippedCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Active Hub Tabs: 'list' (Personel & Sipariş), 'import' (Excel İçe Aktar), 'labels' (Etiketleme & Logo), 'tunnel' (Canlı Tünel)
  const [activeHubTab, setActiveHubTab] = useState('list');

  // Filter & Search States
  const [selectedRole, setSelectedRole] = useState('Tümü');
  const [selectedDealer, setSelectedDealer] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Selection for Batch Operations
  const [selectedStaffIds, setSelectedStaffIds] = useState([]);

  // CRUD Modal States
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [editOriginalKey, setEditOriginalKey] = useState({ name: '', dealer: '' });
  const [formData, setFormData] = useState({
    staff_name: '',
    dealer: '',
    role: 'Servis Danışmanı',
    gender: 'ERKEK',
    top_size: 'L',
    bottom_size: '48',
    product_name: 'Polo Tişört',
    quantity: 1,
    status: 'Pending',
    brand: 'SEAT'
  });

  // Excel Import States
  const [excelFile, setExcelFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState(null);

  // Label Printing & Logo ERP Sync States
  const [labelType, setLabelType] = useState('box'); // 'box' (14-row Godex) or 'rfid' (SATO Single Product)
  const [createLogoDespatch, setCreateLogoDespatch] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printStatus, setPrintStatus] = useState(null);
  const [showLabelPreview, setShowLabelPreview] = useState(false);

  // Styles
  const glassBg = isLight ? 'rgba(255, 255, 255, 0.85)' : 'rgba(15, 23, 42, 0.65)';
  const glassBorder = isLight ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.08)';
  const cardBg = isLight ? '#ffffff' : '#111827';
  const textMuted = isLight ? '#64748b' : '#94a3b8';

  // 1. Initial Load: Fetch Brands
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/personnel/brands`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.brands && data.brands.length > 0) {
          setBrands(data.brands);
          if (!data.brands.includes(selectedBrand)) {
            setSelectedBrand(data.brands[0]);
          }
        }
      })
      .catch(err => console.warn('Brands fetch warning:', err));
  }, []);

  // 2. Fetch Shipments & Stats when selectedBrand changes
  const fetchData = async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const [shipmentsRes, statsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/personnel/shipments?brand=${selectedBrand}`),
        fetch(`${API_BASE_URL}/api/personnel/stats?brand=${selectedBrand}`)
      ]);

      const shipmentsData = await shipmentsRes.json();
      const statsData = await statsRes.json();

      if (shipmentsData.success) {
        setShipments(shipmentsData.data || []);
      }
      if (statsData.success) {
        setStats(statsData.data || {});
      }
    } catch (error) {
      console.error('Personnel hub fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    setSelectedStaffIds([]);
  }, [selectedBrand]);

  // Derived: Unique Dealers & Roles for Filters
  const dealersList = useMemo(() => {
    const set = new Set(shipments.map(s => s.dealer).filter(Boolean));
    return ['All', ...Array.from(set).sort()];
  }, [shipments]);

  const dynamicRolesList = useMemo(() => {
    const fromData = new Set(shipments.map(s => s.role).filter(Boolean));
    const combined = new Set(['Tümü', ...TARGET_DEFAULT_ROLES.slice(1), ...fromData]);
    return Array.from(combined);
  }, [shipments]);

  // Grouped Shipments by (name + dealer)
  const groupedPersonnel = useMemo(() => {
    const grouped = {};
    shipments.forEach(item => {
      const key = `${item.name}__${item.dealer}`;
      if (!grouped[key]) {
        grouped[key] = {
          id: item.id,
          order_number: item.order_number,
          name: item.name,
          dealer: item.dealer,
          role: item.role || 'Genel Personel',
          status: item.status || 'Pending',
          gender: item.gender || 'ERKEK',
          brand: item.brand || selectedBrand,
          top_size: item.top_size || '-',
          bottom_size: item.bottom_size || '-',
          items: []
        };
      }
      item.items?.forEach(pItem => {
        const existing = grouped[key].items.find(i => i.product_name === pItem.product_name && i.size === pItem.size);
        if (existing) {
          existing.quantity += (pItem.quantity || 1);
        } else {
          grouped[key].items.push({ ...pItem });
        }
      });
      if (item.status && item.status.toLowerCase().includes('sevk')) {
        // preserve shipped status
        grouped[key].status = item.status;
      }
    });

    return Object.values(grouped);
  }, [shipments, selectedBrand]);

  // Filtered Personnel List
  const filteredPersonnel = useMemo(() => {
    return groupedPersonnel.filter(person => {
      // Role Filter
      if (selectedRole !== 'Tümü' && person.role !== selectedRole) return false;
      // Dealer Filter
      if (selectedDealer !== 'All' && person.dealer !== selectedDealer) return false;
      // Status Filter
      if (selectedStatus !== 'All') {
        const isShipped = person.status.toLowerCase().includes('sevk') || person.status.toLowerCase().includes('shipped');
        if (selectedStatus === 'Shipped' && !isShipped) return false;
        if (selectedStatus === 'Pending' && isShipped) return false;
      }
      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = person.name.toLowerCase().includes(q);
        const matchesDealer = person.dealer.toLowerCase().includes(q);
        const matchesRole = person.role.toLowerCase().includes(q);
        const matchesProduct = person.items.some(i => (i.product_name || '').toLowerCase().includes(q) || (i.size || '').toLowerCase().includes(q));
        if (!matchesName && !matchesDealer && !matchesRole && !matchesProduct) return false;
      }
      return true;
    });
  }, [groupedPersonnel, selectedRole, selectedDealer, selectedStatus, searchQuery]);

  // Selection Handlers
  const handleSelectOne = (personKey) => {
    if (selectedStaffIds.includes(personKey)) {
      setSelectedStaffIds(selectedStaffIds.filter(k => k !== personKey));
    } else {
      setSelectedStaffIds([...selectedStaffIds, personKey]);
    }
  };

  const handleSelectAll = () => {
    if (selectedStaffIds.length === filteredPersonnel.length) {
      setSelectedStaffIds([]);
    } else {
      setSelectedStaffIds(filteredPersonnel.map(p => `${p.name}__${p.dealer}`));
    }
  };

  // Selected Personnel Objects for batch actions
  const selectedPersonnelObjects = useMemo(() => {
    return groupedPersonnel.filter(p => selectedStaffIds.includes(`${p.name}__${p.dealer}`));
  }, [groupedPersonnel, selectedStaffIds]);

  // CRUD Operations
  const handleOpenAdd = () => {
    setModalMode('add');
    setFormData({
      staff_name: '',
      dealer: selectedDealer !== 'All' ? selectedDealer : (dealersList[1] || 'Merkez Servis'),
      role: selectedRole !== 'Tümü' ? selectedRole : 'Servis Danışmanı',
      gender: 'ERKEK',
      top_size: 'L',
      bottom_size: '48',
      product_name: 'Polo Tişört',
      quantity: 1,
      status: 'Pending',
      brand: selectedBrand
    });
    setShowModal(true);
  };

  const handleOpenEdit = (person) => {
    setModalMode('edit');
    setEditOriginalKey({ name: person.name, dealer: person.dealer });
    setFormData({
      staff_name: person.name,
      dealer: person.dealer,
      role: person.role,
      gender: person.gender || 'ERKEK',
      top_size: person.top_size || 'L',
      bottom_size: person.bottom_size || '48',
      product_name: person.items?.[0]?.product_name || 'Polo Tişört',
      quantity: person.items?.[0]?.quantity || 1,
      status: person.status,
      brand: person.brand || selectedBrand
    });
    setShowModal(true);
  };

  const handleSaveModal = async (e) => {
    e.preventDefault();
    try {
      const url = `${API_BASE_URL}/api/personnel/shipments`;
      const method = modalMode === 'edit' ? 'PUT' : 'POST';
      const body = modalMode === 'edit'
        ? {
            old_name: editOriginalKey.name,
            old_dealer: editOriginalKey.dealer,
            name: formData.staff_name,
            dealer: formData.dealer,
            role: formData.role,
            gender: formData.gender,
            top_size: formData.top_size,
            bottom_size: formData.bottom_size,
            status: formData.status,
            brand: selectedBrand
          }
        : { ...formData, brand: selectedBrand };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        fetchData();
      } else {
        alert(data.message || 'Kayıt sırasında bir hata oluştu.');
      }
    } catch (err) {
      console.error(err);
      alert('Sunucu iletişim hatası oluştu.');
    }
  };

  const handleDelete = async (person) => {
    if (!window.confirm(`${person.name} (${person.dealer}) isimli personeli ve siparişlerini silmek istediğinize emin misiniz?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/personnel/shipments`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: person.name, dealer: person.dealer, brand: selectedBrand })
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
        setSelectedStaffIds(selectedStaffIds.filter(k => k !== `${person.name}__${person.dealer}`));
      } else {
        alert(data.message || 'Silme işlemi başarısız.');
      }
    } catch (err) {
      console.error(err);
      alert('Silme işleminde ağ hatası oluştu.');
    }
  };

  const handleToggleStatus = async (person) => {
    const newStatus = (person.status.toLowerCase().includes('sevk') || person.status.toLowerCase().includes('shipped'))
      ? 'Pending'
      : 'SEVK EDİLDİ';

    try {
      const res = await fetch(`${API_BASE_URL}/api/personnel/shipment/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: person.id, status: newStatus, brand: selectedBrand })
      });
      const data = await res.json();
      if (data.success) {
        fetchData(true);
      }
    } catch (err) {
      console.error('Status toggle error:', err);
    }
  };

  // Excel Upload Handler
  const handleExcelUpload = async (e) => {
    e.preventDefault();
    if (!excelFile) return alert('Lütfen içe aktarılacak bir Excel dosyası seçin.');

    setIsImporting(true);
    setImportMessage(null);
    const form = new FormData();
    form.append('file', excelFile);
    form.append('brand', selectedBrand);

    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/import-excel`, {
        method: 'POST',
        body: form
      });
      const data = await res.json();
      if (data.success) {
        setImportMessage({ type: 'success', text: `🎉 Başarılı: ${data.message || 'Excel personelleri sisteme aktarıldı.'}` });
        setExcelFile(null);
        fetchData();
        setTimeout(() => setActiveHubTab('list'), 2000);
      } else {
        setImportMessage({ type: 'error', text: `❌ Hata: ${data.message || 'Dosya okunamadı.'}` });
      }
    } catch (err) {
      console.error(err);
      setImportMessage({ type: 'error', text: 'Yükleme sırasında ağ hatası oluştu.' });
    } finally {
      setIsImporting(false);
    }
  };

  // PDF Shipment Handover Form Generator
  const generatePersonnelPDF = (personList) => {
    const list = Array.isArray(personList) ? personList : [personList];
    if (list.length === 0) return alert('Lütfen formu çıkarılacak en az bir personel seçin.');

    const doc = new jsPDF();
    doc.addFileToVFS('Roboto-Regular.ttf', ROBOTO_REGULAR);
    doc.addFileToVFS('Roboto-Bold.ttf', ROBOTO_BOLD);
    doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
    doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
    doc.setFont('Roboto', 'normal');

    list.forEach((person, index) => {
      if (index > 0) doc.addPage();

      // Header Banner
      doc.setFillColor(230, 0, 0); // VOG Red
      doc.rect(0, 0, 210, 5, 'F');

      // Title
      doc.setFont('Roboto', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(230, 0, 0);
      doc.text(`${selectedBrand} KURUMSAL KIYAFET DAĞITIMI`, 105, 20, { align: 'center' });

      doc.setFontSize(12);
      doc.setTextColor(70, 70, 70);
      doc.text('KİŞİ BAZLI SEVKİYAT VE TESLİM FORMU', 105, 28, { align: 'center' });

      // Metadata Container Box
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, 34, 182, 46, 3, 3, 'FD');

      doc.setFont('Roboto', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);

      doc.text('Bayi / Yetkili Satıcı:', 20, 43);
      doc.setFont('Roboto', 'normal');
      doc.text(String(person.dealer || '-'), 65, 43);

      doc.setFont('Roboto', 'bold');
      doc.text('Personel Adı Soyadı:', 20, 51);
      doc.setFont('Roboto', 'normal');
      doc.text(String(person.name || '-'), 65, 51);

      doc.setFont('Roboto', 'bold');
      doc.text('Görev / Pozisyon:', 20, 59);
      doc.setFont('Roboto', 'normal');
      doc.text(String(person.role || '-'), 65, 59);

      doc.setFont('Roboto', 'bold');
      doc.text('Bedenler (Üst / Alt):', 20, 67);
      doc.setFont('Roboto', 'normal');
      doc.text(`${person.top_size || '-'} / ${person.bottom_size || '-'}`, 65, 67);

      doc.setFont('Roboto', 'bold');
      doc.text('Tarih:', 135, 43);
      doc.setFont('Roboto', 'normal');
      doc.text(new Date().toLocaleDateString('tr-TR'), 160, 43);

      doc.setFont('Roboto', 'bold');
      doc.text('Referans No:', 135, 51);
      doc.setFont('Roboto', 'normal');
      doc.text(`#${person.order_number || person.id}`, 160, 51);

      doc.setFont('Roboto', 'bold');
      doc.text('Durum:', 135, 59);
      doc.setFont('Roboto', 'normal');
      doc.text(String(person.status || 'Pending'), 160, 59);

      // Items Table
      const tableHeaders = ['Ürün Adı', 'Beden', 'Miktar', 'Barkod / SKU'];
      const tableData = (person.items || []).map(item => [
        item.product_name,
        item.size || '-',
        `${item.quantity || 1} Adet`,
        item.sku || `VOG-${selectedBrand}-${item.size || 'STD'}`
      ]);

      autoTable(doc, {
        startY: 86,
        head: [tableHeaders],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [241, 245, 249],
          textColor: [30, 41, 59],
          font: 'Roboto',
          fontStyle: 'bold',
          fontSize: 9,
          halign: 'center'
        },
        styles: {
          font: 'Roboto',
          fontSize: 9,
          textColor: [30, 41, 59],
          halign: 'center'
        },
        columnStyles: {
          0: { halign: 'left' }
        }
      });

      const finalY = doc.lastAutoTable?.finalY || 120;

      // Signatures
      doc.setFont('Roboto', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text('Teslim Alan Personel İmza:', 25, finalY + 28);
      doc.text('VOG Tekstil Yetkilisi İmza:', 135, finalY + 28);

      doc.setDrawColor(203, 213, 225);
      doc.line(25, finalY + 45, 85, finalY + 45);
      doc.line(135, finalY + 45, 195, finalY + 45);
    });

    const safeFileName = `${selectedBrand}_Sevkiyat_Formu_${new Date().toISOString().slice(0, 10)}.pdf`;
    try {
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      const pdfWindow = window.open(url, '_blank');
      if (!pdfWindow) {
        doc.save(safeFileName);
      }
    } catch (_) {
      doc.save(safeFileName);
    }
  };

  // Label Printing & Logo ERP Trigger
  const handlePrintLabels = async () => {
    const targetStaff = selectedPersonnelObjects.length > 0 ? selectedPersonnelObjects : filteredPersonnel.slice(0, 5);
    if (targetStaff.length === 0) {
      return alert('Lütfen etiket basılacak en az bir personel seçin.');
    }

    setIsPrinting(true);
    setPrintStatus({ type: 'info', text: `🖨️ ${targetStaff.length} personel için etiketler basılıyor ve Logo Tiger ERP senkronize ediliyor...` });

    try {
      if (labelType === 'box') {
        // Godex 14-Row Box Label Printing for each staff member
        for (const person of targetStaff) {
          const totalQty = person.items.reduce((s, i) => s + (i.quantity || 1), 0);
          const boxPayload = {
            order_id: person.order_number || person.id || '1001',
            brand: selectedBrand,
            customer_name: person.dealer,
            sub_customer_name: person.dealer,
            staff_name: person.name,
            role: person.role,
            gender: person.gender,
            top_size: person.top_size,
            product_name: person.items?.[0]?.product_name || 'Tekstil Ürünü',
            sku: person.items?.[0]?.sku || `${selectedBrand}-PROD-001`,
            box_no: 1,
            total_boxes: 1,
            total_quantity: totalQty,
            is_personnel: true,
            items: person.items.map(item => ({
              part_no: item.sku || `${selectedBrand}-SKU`,
              product_name: item.product_name,
              size: item.size || 'STD',
              quantity: item.quantity || 1
            }))
          };

          await fetch(`${API_BASE_URL}/api/printer/print-box-label`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(boxPayload)
          });
        }

        // Logo Tiger ERP Waybill Sync
        if (createLogoDespatch) {
          const orderIds = targetStaff.map(s => s.order_number).filter(Boolean);
          const allItems = targetStaff.flatMap(s => s.items);

          const logoRes = await fetch(`${API_BASE_URL}/api/logo/sync-box-dispatch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              order_ids: orderIds,
              items: allItems,
              create_logo_despatch: true
            })
          });
          const logoData = await logoRes.json();
          setPrintStatus({
            type: 'success',
            text: `✅ ${targetStaff.length} adet Godex G530 14 satırlı koli etiketi yazdırıldı! ${logoData.message || 'Logo Tiger ERP açık irsaliyesi başarıyla kaydedildi.'}`
          });
        } else {
          setPrintStatus({
            type: 'success',
            text: `✅ ${targetStaff.length} adet Godex G530 14 satırlı koli etiketi yazıcı kuyruğuna gönderildi!`
          });
        }
      } else {
        // Single Product RFID Tag Printing (SATO RFID)
        const res = await fetch(`${API_BASE_URL}/api/vouchers/generate-staff-labels`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            staffList: targetStaff.map(s => ({
              staffName: s.name,
              dealer: s.dealer,
              role: s.role,
              items: s.items
            })),
            brand: selectedBrand
          })
        });
        const data = await res.json();
        if (data.success) {
          setPrintStatus({
            type: 'success',
            text: `✅ ${data.labels?.length || targetStaff.length} personelin kıyafet RFID etiketleri SATO yazıcıya ve stok fişlerine aktarıldı!`
          });
        } else {
          setPrintStatus({ type: 'warning', text: `⚠️ RFID Etiket Uyarısı: ${data.message}` });
        }
      }
    } catch (err) {
      console.error('Print/Sync error:', err);
      setPrintStatus({ type: 'error', text: `❌ Hata: ${err.message || 'İşlem tamamlanamadı.'}` });
    } finally {
      setIsPrinting(false);
      setTimeout(() => setPrintStatus(null), 10000);
    }
  };

  return (
    <div className="personnel-operations-hub" style={{ padding: '1.5rem', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.5rem',
        marginBottom: '2rem',
        background: glassBg,
        padding: '1.5rem 2rem',
        borderRadius: '24px',
        border: `1px solid ${glassBorder}`,
        boxShadow: isLight ? '0 10px 30px rgba(0,0,0,0.04)' : '0 20px 40px rgba(0,0,0,0.4)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '2rem' }}>👤</span>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '900', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                Merkezi Personel Operasyon Paneli
              </h1>
              <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.88rem', color: textMuted, fontWeight: '600' }}>
                Excel içe aktarımı, personel & beden yönetimi, SATO RFID & Godex 14 satırlı koli etiketleri ve Logo Tiger ERP irsaliyesi
              </p>
            </div>
          </div>
        </div>

        {/* Brand Selector & Refresh Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: isLight ? '#f1f5f9' : '#1e293b', padding: '0.5rem 1rem', borderRadius: '14px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '800', color: textMuted }}>MARKA:</span>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontWeight: '900',
                fontSize: '1rem',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {brands.map(b => (
                <option key={b} value={b} style={{ background: isLight ? '#fff' : '#0f172a', color: isLight ? '#000' : '#fff' }}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => fetchData()}
            disabled={refreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'transparent',
              border: `1px solid ${glassBorder}`,
              color: 'var(--text-primary)',
              padding: '0.6rem 1.2rem',
              borderRadius: '14px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            <span style={{ display: 'inline-block', transform: refreshing ? 'rotate(360deg)' : 'none', transition: 'transform 0.5s ease' }}>🔄</span>
            <span>Yenile</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{ background: cardBg, padding: '1.2rem', borderRadius: '18px', border: `1px solid ${glassBorder}`, boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.78rem', color: textMuted, fontWeight: '800', textTransform: 'uppercase' }}>👥 Toplam Personel</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#0284c7', marginTop: '0.4rem' }}>{stats.totalPersonnel}</div>
        </div>
        <div style={{ background: cardBg, padding: '1.2rem', borderRadius: '18px', border: `1px solid ${glassBorder}`, boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.78rem', color: textMuted, fontWeight: '800', textTransform: 'uppercase' }}>🏢 Bayi / Servisler</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#8b5cf6', marginTop: '0.4rem' }}>{stats.totalDealers}</div>
        </div>
        <div style={{ background: cardBg, padding: '1.2rem', borderRadius: '18px', border: `1px solid ${glassBorder}`, boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.78rem', color: textMuted, fontWeight: '800', textTransform: 'uppercase' }}>👕 Dağıtılacak Parça</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#10b981', marginTop: '0.4rem' }}>{stats.totalItems}</div>
        </div>
        <div style={{ background: cardBg, padding: '1.2rem', borderRadius: '18px', border: `1px solid ${glassBorder}`, boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.78rem', color: textMuted, fontWeight: '800', textTransform: 'uppercase' }}>📦 Toplam Sipariş</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#f59e0b', marginTop: '0.4rem' }}>{stats.totalOrders}</div>
        </div>
        <div style={{ background: cardBg, padding: '1.2rem', borderRadius: '18px', border: `1px solid ${glassBorder}`, boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.78rem', color: textMuted, fontWeight: '800', textTransform: 'uppercase' }}>⏳ Bekleyen</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#eab308', marginTop: '0.4rem' }}>{stats.pendingCount}</div>
        </div>
        <div style={{ background: cardBg, padding: '1.2rem', borderRadius: '18px', border: `1px solid ${glassBorder}`, boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.78rem', color: textMuted, fontWeight: '800', textTransform: 'uppercase' }}>🚀 Sevk Edilen</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#10b981', marginTop: '0.4rem' }}>{stats.shippedCount}</div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.8rem',
        marginBottom: '1.5rem',
        borderBottom: `2px solid ${isLight ? '#e2e8f0' : '#1e293b'}`,
        paddingBottom: '0.5rem',
        overflowX: 'auto'
      }}>
        <button
          onClick={() => setActiveHubTab('list')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '0.8rem 1.6rem',
            borderRadius: '12px',
            border: 'none',
            background: activeHubTab === 'list' ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'transparent',
            color: activeHubTab === 'list' ? '#fff' : 'var(--text-secondary)',
            fontWeight: '900',
            cursor: 'pointer',
            fontSize: '0.95rem',
            transition: 'all 0.2s ease'
          }}
        >
          <span>📋</span>
          <span>Personel & Sipariş Yönetimi</span>
          <span style={{ fontSize: '0.75rem', background: activeHubTab === 'list' ? 'rgba(255,255,255,0.25)' : (isLight ? '#e2e8f0' : '#334155'), padding: '2px 8px', borderRadius: '10px' }}>
            {groupedPersonnel.length}
          </span>
        </button>

        <button
          onClick={() => setActiveHubTab('import')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '0.8rem 1.6rem',
            borderRadius: '12px',
            border: 'none',
            background: activeHubTab === 'import' ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent',
            color: activeHubTab === 'import' ? '#fff' : 'var(--text-secondary)',
            fontWeight: '900',
            cursor: 'pointer',
            fontSize: '0.95rem',
            transition: 'all 0.2s ease'
          }}
        >
          <span>📥</span>
          <span>Hızlı Excel İçe Aktarma</span>
        </button>

        <button
          onClick={() => setActiveHubTab('labels')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '0.8rem 1.6rem',
            borderRadius: '12px',
            border: 'none',
            background: activeHubTab === 'labels' ? 'linear-gradient(135deg, #e11d48, #be123c)' : 'transparent',
            color: activeHubTab === 'labels' ? '#fff' : 'var(--text-secondary)',
            fontWeight: '900',
            cursor: 'pointer',
            fontSize: '0.95rem',
            transition: 'all 0.2s ease'
          }}
        >
          <span>🏷️</span>
          <span>Toplu Etiketleme & Logo ERP</span>
          {selectedStaffIds.length > 0 && (
            <span style={{ fontSize: '0.75rem', background: '#fff', color: '#be123c', padding: '2px 8px', borderRadius: '10px', fontWeight: '900' }}>
              {selectedStaffIds.length} Seçili
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveHubTab('tunnel')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '0.8rem 1.6rem',
            borderRadius: '12px',
            border: 'none',
            background: activeHubTab === 'tunnel' ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)' : 'transparent',
            color: activeHubTab === 'tunnel' ? '#fff' : 'var(--text-secondary)',
            fontWeight: '900',
            cursor: 'pointer',
            fontSize: '0.95rem',
            transition: 'all 0.2s ease'
          }}
        >
          <span>🚇</span>
          <span>Canlı Tünel & Paketleme</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PERSONEL & SİPARİŞ LİSTESİ (EXCEL GRID VIEW & CRUD)               */}
      {/* ========================================================================= */}
      {activeHubTab === 'list' && (
        <div style={{ background: cardBg, borderRadius: '24px', border: `1px solid ${glassBorder}`, padding: '1.5rem', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
          {/* Sub-Filters: Roles, Dealer, Search */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
              {dynamicRolesList.slice(0, 8).map(role => {
                const isSelected = selectedRole === role;
                return (
                  <button
                    key={role}
                    onClick={() => setSelectedRole(role)}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '10px',
                      border: isSelected ? 'none' : `1px solid ${glassBorder}`,
                      background: isSelected ? '#E60000' : 'transparent',
                      color: isSelected ? '#fff' : 'var(--text-primary)',
                      fontWeight: isSelected ? '800' : '600',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {role}
                  </button>
                );
              })}
            </div>

            {/* Actions: Add Staff, Generate PDF, Print Labels */}
            <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                onClick={handleOpenAdd}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#fff',
                  border: 'none',
                  padding: '0.6rem 1.2rem',
                  borderRadius: '12px',
                  fontWeight: '800',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                <span>➕</span>
                <span>Yeni Personel Ekle</span>
              </button>

              <button
                onClick={() => generatePersonnelPDF(selectedPersonnelObjects.length > 0 ? selectedPersonnelObjects : filteredPersonnel)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: isLight ? '#f1f5f9' : '#1e293b',
                  color: 'var(--text-primary)',
                  border: `1px solid ${glassBorder}`,
                  padding: '0.6rem 1.2rem',
                  borderRadius: '12px',
                  fontWeight: '800',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                <span>📄</span>
                <span>Sevkiyat Formu PDF ({selectedStaffIds.length > 0 ? `${selectedStaffIds.length} Seçili` : 'Tümü'})</span>
              </button>

              {selectedStaffIds.length > 0 && (
                <button
                  onClick={() => setActiveHubTab('labels')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#e11d48',
                    color: '#fff',
                    border: 'none',
                    padding: '0.6rem 1.2rem',
                    borderRadius: '12px',
                    fontWeight: '800',
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  <span>🏷️</span>
                  <span>Etiketleme Paneline Aktar ({selectedStaffIds.length})</span>
                </button>
              )}
            </div>
          </div>

          {/* Search and Dealer Filter row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', marginBottom: '1.2rem', background: isLight ? '#f8fafc' : '#0f172a', padding: '0.8rem 1.2rem', borderRadius: '16px' }}>
            <div style={{ flex: '1', minWidth: '220px', position: 'relative' }}>
              <input
                type="text"
                placeholder="🔍 Personel adı, bayi, ürün veya beden ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 1rem',
                  borderRadius: '10px',
                  border: `1px solid ${isLight ? '#cbd5e1' : '#334155'}`,
                  background: isLight ? '#ffffff' : '#1e293b',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  outline: 'none'
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: textMuted, cursor: 'pointer', fontWeight: 'bold' }}
                >
                  ✕
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '800', color: textMuted }}>BAYİ:</span>
              <select
                value={selectedDealer}
                onChange={(e) => setSelectedDealer(e.target.value)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '10px',
                  border: `1px solid ${isLight ? '#cbd5e1' : '#334155'}`,
                  background: isLight ? '#ffffff' : '#1e293b',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                {dealersList.map(d => (
                  <option key={d} value={d}>{d === 'All' ? 'Tüm Bayiler' : d}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '800', color: textMuted }}>DURUM:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '10px',
                  border: `1px solid ${isLight ? '#cbd5e1' : '#334155'}`,
                  background: isLight ? '#ffffff' : '#1e293b',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="All">Tüm Durumlar</option>
                <option value="Pending">Beklemede</option>
                <option value="Shipped">Sevk Edildi</option>
              </select>
            </div>

            <div style={{ marginLeft: 'auto', fontSize: '0.85rem', color: textMuted, fontWeight: '700' }}>
              Toplam {filteredPersonnel.length} personel listeleniyor
            </div>
          </div>

          {/* Grid Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: isLight ? '#f1f5f9' : '#1e293b', borderBottom: `2px solid ${isLight ? '#cbd5e1' : '#334155'}` }}>
                  <th style={{ padding: '0.8rem', textAlign: 'center', width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={filteredPersonnel.length > 0 && selectedStaffIds.length === filteredPersonnel.length}
                      onChange={handleSelectAll}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                  </th>
                  <th style={{ padding: '0.8rem', textAlign: 'left', fontWeight: '800', color: textMuted }}>PERSONEL ADI</th>
                  <th style={{ padding: '0.8rem', textAlign: 'left', fontWeight: '800', color: textMuted }}>BAYİ / SERVİS MERKEZİ</th>
                  <th style={{ padding: '0.8rem', textAlign: 'left', fontWeight: '800', color: textMuted }}>GÖREV / POZİSYON</th>
                  <th style={{ padding: '0.8rem', textAlign: 'center', fontWeight: '800', color: textMuted }}>BEDEN (ÜST / ALT)</th>
                  <th style={{ padding: '0.8rem', textAlign: 'center', fontWeight: '800', color: textMuted }}>ÜRÜN VE ADET</th>
                  <th style={{ padding: '0.8rem', textAlign: 'center', fontWeight: '800', color: textMuted }}>DURUM</th>
                  <th style={{ padding: '0.8rem', textAlign: 'center', fontWeight: '800', color: textMuted }}>İŞLEMLER</th>
                </tr>
              </thead>
              <tbody>
                {filteredPersonnel.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ padding: '3rem', textAlign: 'center', color: textMuted, fontWeight: '600' }}>
                      {loading ? 'Veriler yükleniyor...' : 'Kayıt bulunamadı. Yeni personel ekleyebilir veya Excel içe aktarabilirsiniz.'}
                    </td>
                  </tr>
                ) : (
                  filteredPersonnel.map((person, idx) => {
                    const key = `${person.name}__${person.dealer}`;
                    const isSelected = selectedStaffIds.includes(key);
                    const isShipped = person.status.toLowerCase().includes('sevk') || person.status.toLowerCase().includes('shipped');
                    const totalQty = person.items.reduce((s, i) => s + (i.quantity || 1), 0);

                    return (
                      <tr
                        key={key}
                        style={{
                          borderBottom: `1px solid ${isLight ? '#e2e8f0' : '#1e293b'}`,
                          backgroundColor: isSelected
                            ? (isLight ? '#e0f2fe' : '#0c4a6e')
                            : (idx % 2 === 0 ? 'transparent' : (isLight ? 'rgba(0,0,0,0.015)' : 'rgba(255,255,255,0.015)')),
                          transition: 'background-color 0.15s ease'
                        }}
                      >
                        <td style={{ padding: '0.8rem', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectOne(key)}
                            style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                          />
                        </td>
                        <td style={{ padding: '0.8rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                          {person.name}
                        </td>
                        <td style={{ padding: '0.8rem', color: textMuted, fontWeight: '600' }}>
                          🏢 {person.dealer}
                        </td>
                        <td style={{ padding: '0.8rem' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.78rem',
                            fontWeight: '700',
                            background: isLight ? '#f1f5f9' : '#1e293b',
                            color: 'var(--text-primary)',
                            border: `1px solid ${glassBorder}`
                          }}>
                            {person.role}
                          </span>
                        </td>
                        <td style={{ padding: '0.8rem', textAlign: 'center', fontWeight: '800' }}>
                          {person.top_size || '-'} / {person.bottom_size || '-'}
                        </td>
                        <td style={{ padding: '0.8rem', textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '8px',
                            background: isLight ? '#dcfce7' : '#064e3b',
                            color: isLight ? '#166534' : '#86efac',
                            fontWeight: '900',
                            fontSize: '0.82rem'
                          }}>
                            {totalQty} Adet
                          </span>
                        </td>
                        <td style={{ padding: '0.8rem', textAlign: 'center' }}>
                          <button
                            onClick={() => handleToggleStatus(person)}
                            title="Durumu değiştirmek için tıklayın"
                            style={{
                              padding: '4px 10px',
                              borderRadius: '8px',
                              border: 'none',
                              cursor: 'pointer',
                              fontWeight: '800',
                              fontSize: '0.78rem',
                              background: isShipped ? '#10b981' : '#f59e0b',
                              color: '#fff',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                            }}
                          >
                            {isShipped ? '✓ SEVK EDİLDİ' : '⏳ BEKLEMEDE'}
                          </button>
                        </td>
                        <td style={{ padding: '0.8rem', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleOpenEdit(person)}
                              title="Düzenle"
                              style={{ background: 'transparent', border: `1px solid ${glassBorder}`, borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => generatePersonnelPDF(person)}
                              title="PDF Sevkiyat Tutanağı"
                              style={{ background: 'transparent', border: `1px solid ${glassBorder}`, borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}
                            >
                              📄
                            </button>
                            <button
                              onClick={() => handleDelete(person)}
                              title="Sil"
                              style={{ background: 'transparent', border: `1px solid ${glassBorder}`, borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', color: '#ef4444' }}
                            >
                              🗑️
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

      {/* ========================================================================= */}
      {/* TAB 2: HIZLI EXCEL İÇE AKTARMA (DRAG & DROP IMPORT)                       */}
      {/* ========================================================================= */}
      {activeHubTab === 'import' && (
        <div style={{ background: cardBg, borderRadius: '24px', border: `1px solid ${glassBorder}`, padding: '2.5rem', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <span style={{ fontSize: '3rem' }}>📥</span>
            <h2 style={{ margin: '0.5rem 0', fontSize: '1.5rem', fontWeight: '900', color: 'var(--text-primary)' }}>
              {selectedBrand} Personel Listesi Excel İçe Aktarımı
            </h2>
            <p style={{ color: textMuted, fontSize: '0.9rem', maxWidth: '600px', margin: '0 auto' }}>
              Personel adları, bayileri, görevleri ve beden dağılımlarını içeren Excel tablosunu doğrudan yükleyerek sipariş ve personel kayıtlarını tek tıkla oluşturun.
            </p>
          </div>

          {importMessage && (
            <div style={{
              padding: '1rem',
              borderRadius: '12px',
              marginBottom: '1.5rem',
              fontWeight: '700',
              fontSize: '0.9rem',
              backgroundColor: importMessage.type === 'success' ? (isLight ? '#ecfdf5' : '#064e3b') : (isLight ? '#fef2f2' : '#7f1d1d'),
              color: importMessage.type === 'success' ? (isLight ? '#065f46' : '#a7f3d0') : (isLight ? '#991b1b' : '#fecaca'),
              border: `1px solid ${importMessage.type === 'success' ? '#10b981' : '#ef4444'}`
            }}>
              {importMessage.text}
            </div>
          )}

          <form onSubmit={handleExcelUpload}>
            <div style={{
              border: `2px dashed ${isLight ? '#cbd5e1' : '#475569'}`,
              borderRadius: '20px',
              padding: '3rem 2rem',
              textAlign: 'center',
              backgroundColor: isLight ? '#f8fafc' : '#0f172a',
              cursor: 'pointer',
              marginBottom: '1.5rem'
            }}
            onClick={() => document.getElementById('excelFileInput').click()}
            >
              <input
                id="excelFileInput"
                type="file"
                accept=".xlsx, .xls"
                onChange={(e) => setExcelFile(e.target.files[0] || null)}
                style={{ display: 'none' }}
              />
              <span style={{ fontSize: '2.5rem' }}>📄</span>
              <div style={{ marginTop: '0.8rem', fontWeight: '800', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                {excelFile ? excelFile.name : 'Excel Dosyası Seçin veya Sürükleyin'}
              </div>
              <div style={{ color: textMuted, fontSize: '0.85rem', marginTop: '0.4rem' }}>
                {excelFile ? `${(excelFile.size / 1024).toFixed(1)} KB` : '.xlsx veya .xls formatı desteklenir'}
              </div>
            </div>

            {/* Standard Columns Info Box */}
            <div style={{ background: isLight ? '#f1f5f9' : '#1e293b', borderRadius: '14px', padding: '1rem 1.5rem', marginBottom: '2rem' }}>
              <div style={{ fontWeight: '800', fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                💡 Standart Kolon Yapısı (Otomatik Tanınır):
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', fontSize: '0.8rem' }}>
                <span style={{ background: cardBg, padding: '3px 8px', borderRadius: '6px', border: `1px solid ${glassBorder}` }}>Personel Adı</span>
                <span style={{ background: cardBg, padding: '3px 8px', borderRadius: '6px', border: `1px solid ${glassBorder}` }}>Bayi / Servis</span>
                <span style={{ background: cardBg, padding: '3px 8px', borderRadius: '6px', border: `1px solid ${glassBorder}` }}>Görev / Grup</span>
                <span style={{ background: cardBg, padding: '3px 8px', borderRadius: '6px', border: `1px solid ${glassBorder}` }}>Üst Beden (S, M, L..)</span>
                <span style={{ background: cardBg, padding: '3px 8px', borderRadius: '6px', border: `1px solid ${glassBorder}` }}>Alt Beden (46, 48..)</span>
                <span style={{ background: cardBg, padding: '3px 8px', borderRadius: '6px', border: `1px solid ${glassBorder}` }}>Ürün Adı</span>
                <span style={{ background: cardBg, padding: '3px 8px', borderRadius: '6px', border: `1px solid ${glassBorder}` }}>Adet</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={!excelFile || isImporting}
              style={{
                width: '100%',
                padding: '1rem',
                borderRadius: '14px',
                border: 'none',
                background: !excelFile || isImporting ? '#94a3b8' : 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff',
                fontWeight: '900',
                fontSize: '1rem',
                cursor: !excelFile || isImporting ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
              }}
            >
              {isImporting ? '⏳ İçe Aktarılıyor...' : '🚀 İçe Aktarımı Başlat'}
            </button>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TOPLU ETİKETLEME & LOGO TIGER ERP MERKEZİ                         */}
      {/* ========================================================================= */}
      {activeHubTab === 'labels' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(350px, 450px) 1fr', gap: '2rem' }}>
          {/* Controls Panel */}
          <div style={{ background: cardBg, borderRadius: '24px', border: `1px solid ${glassBorder}`, padding: '2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: '900', margin: '0 0 1.5rem 0', color: 'var(--text-primary)' }}>
              🏷️ Etiket ve İrsaliye Ayarları
            </h2>

            {printStatus && (
              <div style={{
                padding: '0.9rem',
                borderRadius: '10px',
                marginBottom: '1.5rem',
                fontWeight: '700',
                fontSize: '0.85rem',
                backgroundColor: printStatus.type === 'success' ? (isLight ? '#ecfdf5' : '#064e3b') : (printStatus.type === 'warning' ? (isLight ? '#fffbeb' : '#78350f') : (isLight ? '#eff6ff' : '#1e293b')),
                color: printStatus.type === 'success' ? (isLight ? '#065f46' : '#a7f3d0') : (printStatus.type === 'warning' ? (isLight ? '#92400e' : '#fde68a') : (isLight ? '#1e40af' : '#93c5fd')),
                border: `1.5px solid ${printStatus.type === 'success' ? '#10b981' : (printStatus.type === 'warning' ? '#f59e0b' : '#38bdf8')}`
              }}>
                {printStatus.text}
              </div>
            )}

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontWeight: '800', fontSize: '0.85rem', color: textMuted, marginBottom: '0.6rem' }}>
                HEDEF ETİKET FORMATI
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '0.8rem 1rem',
                  borderRadius: '12px',
                  border: `1.5px solid ${labelType === 'box' ? '#E60000' : glassBorder}`,
                  background: labelType === 'box' ? (isLight ? '#fef2f2' : 'rgba(230,0,0,0.1)') : 'transparent',
                  cursor: 'pointer'
                }}>
                  <input
                    type="radio"
                    name="labelType"
                    checked={labelType === 'box'}
                    onChange={() => setLabelType('box')}
                  />
                  <div>
                    <div style={{ fontWeight: '800', color: 'var(--text-primary)' }}>📦 14 Satırlı Godex G530 Koli Etiketi</div>
                    <div style={{ fontSize: '0.78rem', color: textMuted }}>Kişi bazlı koli etiketi (14 satır, Koli No başlıkta, alt boşluk sıfırlı)</div>
                  </div>
                </label>

                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '0.8rem 1rem',
                  borderRadius: '12px',
                  border: `1.5px solid ${labelType === 'rfid' ? '#E60000' : glassBorder}`,
                  background: labelType === 'rfid' ? (isLight ? '#fef2f2' : 'rgba(230,0,0,0.1)') : 'transparent',
                  cursor: 'pointer'
                }}>
                  <input
                    type="radio"
                    name="labelType"
                    checked={labelType === 'rfid'}
                    onChange={() => setLabelType('rfid')}
                  />
                  <div>
                    <div style={{ fontWeight: '800', color: 'var(--text-primary)' }}>👕 Tekil Ürün RFID Etiketi (SATO CL4NX Plus)</div>
                    <div style={{ fontSize: '0.78rem', color: textMuted }}>Kıyafet SGTIN-96 RFID çipli barkod etiketi</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Logo ERP Waybill Checkbox */}
            <div style={{
              background: isLight ? '#f8fafc' : '#0f172a',
              borderRadius: '14px',
              padding: '1rem',
              marginBottom: '2rem',
              border: `1px solid ${glassBorder}`
            }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={createLogoDespatch}
                  onChange={(e) => setCreateLogoDespatch(e.target.checked)}
                  style={{ width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer' }}
                />
                <div>
                  <div style={{ fontWeight: '800', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                    💼 LOGO Tiger ERP Kağıt İrsaliyesi Oluştur
                  </div>
                  <div style={{ fontSize: '0.78rem', color: textMuted, marginTop: '2px' }}>
                    {selectedBrand} carisine açık ve düzenlenebilir taslak kağıt irsaliyesi kaydeder.
                  </div>
                </div>
              </label>
            </div>

            <div style={{ marginBottom: '1.5rem', fontSize: '0.85rem', color: textMuted }}>
              📌 <strong>{selectedStaffIds.length > 0 ? `${selectedStaffIds.length} Personel Seçili` : `İlk 5 Personel (Örnek)`}</strong> için işlem yapılacak.
            </div>

            <button
              onClick={handlePrintLabels}
              disabled={isPrinting}
              style={{
                width: '100%',
                padding: '1.1rem',
                borderRadius: '14px',
                border: 'none',
                background: isPrinting ? '#94a3b8' : 'linear-gradient(135deg, #E60000, #b91c1c)',
                color: '#fff',
                fontWeight: '900',
                fontSize: '1rem',
                cursor: isPrinting ? 'not-allowed' : 'pointer',
                boxShadow: '0 6px 20px rgba(230, 0, 0, 0.35)',
                marginBottom: '1rem'
              }}
            >
              {isPrinting ? '⏳ İşleniyor...' : '🖨️ YAZICIYA GÖNDER & İRSALİYE KES'}
            </button>

            <button
              onClick={() => setShowLabelPreview(!showLabelPreview)}
              style={{
                width: '100%',
                padding: '0.8rem',
                borderRadius: '14px',
                border: `1px solid ${glassBorder}`,
                background: 'transparent',
                color: 'var(--text-primary)',
                fontWeight: '800',
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              {showLabelPreview ? 'Önizlemeyi Gizle' : '👁️ Etiket Önizlemesini Göster'}
            </button>
          </div>

          {/* Visual Preview Panel */}
          <div style={{ background: cardBg, borderRadius: '24px', border: `1px solid ${glassBorder}`, padding: '2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: '900', margin: '0 0 1.5rem 0', color: 'var(--text-primary)' }}>
              👁️ Canlı Etiket Önizleme ({labelType === 'box' ? 'Godex G530 Koli' : 'SATO RFID Tekil'})
            </h2>

            {selectedPersonnelObjects.length === 0 && (
              <div style={{ padding: '1rem', borderRadius: '12px', background: isLight ? '#f1f5f9' : '#1e293b', color: textMuted, fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                ℹ️ Aşağıdaki önizleme listedeki ilk personelin verisiyle simüle edilmektedir. Tablo sekmesinden dilediğiniz personelleri seçebilirsiniz.
              </div>
            )}

            {/* Simulated Label Box */}
            {(() => {
              const previewPerson = selectedPersonnelObjects[0] || filteredPersonnel[0] || {
                name: 'AHMET YILMAZ',
                dealer: 'DOĞUŞ OTO MASLAK',
                role: 'Servis Danışmanı',
                top_size: 'L',
                bottom_size: '48',
                order_number: '16575',
                items: [
                  { product_name: 'Polo Tişört', size: 'L', quantity: 2, sku: 'NIS-POLO-L' },
                  { product_name: 'Pantolon', size: '48', quantity: 1, sku: 'NIS-PNT-48' }
                ]
              };

              const totalQty = previewPerson.items.reduce((s, i) => s + (i.quantity || 1), 0);

              if (labelType === 'box') {
                return (
                  <div style={{
                    width: '100%',
                    maxWidth: '480px',
                    margin: '0 auto',
                    background: '#ffffff',
                    color: '#000000',
                    border: '2px solid #000000',
                    borderRadius: '4px',
                    padding: '12px',
                    fontFamily: 'monospace',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
                  }}>
                    {/* Header Banner */}
                    <div style={{ background: '#000000', color: '#ffffff', padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold' }}>
                      <span style={{ fontSize: '1rem', letterSpacing: '1px' }}>VOG PREMIUM // {selectedBrand}</span>
                      <span style={{ fontSize: '1rem' }}>KOLI: 1 / 1</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px', gap: '8px', padding: '8px 0', borderBottom: '1px solid #000' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#555' }}>ALICI / BAYİ:</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{previewPerson.dealer}</div>
                        <div style={{ fontSize: '0.75rem', color: '#555', marginTop: '4px' }}>PERSONEL:</div>
                        <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>{previewPerson.name} ({previewPerson.role})</div>
                      </div>
                      <div style={{ textAlign: 'center', borderLeft: '1px solid #ddd', paddingLeft: '6px' }}>
                        <div style={{ fontSize: '0.7rem', color: '#555' }}>TOPLAM</div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 'bold' }}>{totalQty}</div>
                        <div style={{ fontSize: '0.7rem', color: '#555' }}>ADET</div>
                      </div>
                    </div>

                    {/* 14 Rows Table Preview */}
                    <div style={{ marginTop: '8px', borderBottom: '1px solid #000', paddingBottom: '6px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 50px 50px', fontWeight: 'bold', fontSize: '0.75rem', borderBottom: '1px solid #ccc', paddingBottom: '3px' }}>
                        <span>ÜRÜN ADI</span>
                        <span style={{ textAlign: 'center' }}>BEDEN</span>
                        <span style={{ textAlign: 'right' }}>ADET</span>
                      </div>
                      {previewPerson.items.map((it, i) => (
                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 50px 50px', fontSize: '0.75rem', padding: '3px 0', borderBottom: '1px dotted #eee' }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.product_name}</span>
                          <span style={{ textAlign: 'center', fontWeight: 'bold' }}>{it.size || '-'}</span>
                          <span style={{ textAlign: 'right', fontWeight: 'bold' }}>{it.quantity || 1}</span>
                        </div>
                      ))}
                    </div>

                    {/* Barcode Footer */}
                    <div style={{ marginTop: '10px', textAlign: 'center' }}>
                      <BarcodeCanvas text={`BOX-${selectedBrand}-${previewPerson.order_number || '1001'}`} bcid="code128" scale={2} height={14} />
                      <div style={{ fontSize: '0.75rem', marginTop: '4px', fontWeight: 'bold' }}>
                        Sipariş: #{previewPerson.order_number || '1001'} // Ref: {new Date().toISOString().slice(0, 10)}
                      </div>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div style={{
                    width: '100%',
                    maxWidth: '380px',
                    margin: '0 auto',
                    background: '#ffffff',
                    color: '#000000',
                    border: '2px solid #000000',
                    borderRadius: '4px',
                    padding: '16px',
                    fontFamily: 'sans-serif',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '1rem', fontWeight: '900', letterSpacing: '1px', borderBottom: '2px solid #000', paddingBottom: '6px' }}>
                      {selectedBrand} KURUMSAL TEKSTİL
                    </div>
                    <div style={{ margin: '10px 0', fontSize: '0.95rem', fontWeight: 'bold' }}>
                      {previewPerson.items?.[0]?.product_name || 'Tekstil Ürünü'}
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: '900', background: '#000', color: '#fff', padding: '4px', borderRadius: '4px', margin: '8px auto', width: '80px' }}>
                      {previewPerson.top_size || 'L'}
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#333' }}>
                      {previewPerson.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '10px' }}>
                      {previewPerson.dealer} // {previewPerson.role}
                    </div>
                    <BarcodeCanvas text={`303B50CC${(previewPerson.order_number || '1001').padStart(6, '0')}001`} bcid="code128" scale={2} height={16} />
                    <div style={{ fontSize: '0.7rem', color: '#444', marginTop: '4px' }}>
                      EPC: 303B50CC... // SATO RFID GEN2
                    </div>
                  </div>
                );
              }
            })()}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CANLI TÜNEL & PAKETLEME TAKİBİ                                     */}
      {/* ========================================================================= */}
      {activeHubTab === 'tunnel' && (
        <div style={{ background: cardBg, borderRadius: '24px', border: `1px solid ${glassBorder}`, padding: '2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '900', margin: 0, color: 'var(--text-primary)' }}>
                🚇 Canlı RFID Tünel ve Paketleme Takibi
              </h2>
              <p style={{ color: textMuted, margin: '0.3rem 0 0 0', fontSize: '0.88rem' }}>
                Personellerin sipariş paketlerinin RFID tünelinden geçiş durumunu, okunan parça adetlerini ve mühürlenme aşamalarını canlı izleyin.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.8rem' }}>
              <button
                onClick={() => navigate('/kiosk')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                  color: '#fff',
                  border: 'none',
                  padding: '0.7rem 1.4rem',
                  borderRadius: '12px',
                  fontWeight: '800',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
                }}
              >
                <span>📟</span>
                <span>Tünel Kiosk Ekranını Aç</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.2rem' }}>
            {groupedPersonnel.map(person => {
              const totalQty = person.items.reduce((s, i) => s + (i.quantity || 1), 0);
              const isShipped = person.status.toLowerCase().includes('sevk') || person.status.toLowerCase().includes('shipped');

              return (
                <div
                  key={`${person.name}__${person.dealer}`}
                  style={{
                    background: isLight ? '#f8fafc' : '#0f172a',
                    border: `1.5px solid ${isShipped ? '#10b981' : glassBorder}`,
                    borderRadius: '18px',
                    padding: '1.2rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
                    <div>
                      <div style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--text-primary)' }}>{person.name}</div>
                      <div style={{ fontSize: '0.78rem', color: textMuted, marginTop: '2px' }}>🏢 {person.dealer}</div>
                    </div>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: '800',
                      background: isShipped ? '#10b981' : '#f59e0b',
                      color: '#fff'
                    }}>
                      {isShipped ? '✓ SEVK EDİLDİ' : '⏳ BEKLEMEDE'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: textMuted, marginBottom: '0.6rem' }}>
                    <span>Görev: <strong>{person.role}</strong></span>
                    <span>Beden: <strong>{person.top_size} / {person.bottom_size}</strong></span>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ marginTop: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: '700', marginBottom: '4px' }}>
                      <span>Paket Durumu</span>
                      <span>{isShipped ? `${totalQty}/${totalQty} Tamamlandı` : `0/${totalQty} Parça`}</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: isLight ? '#e2e8f0' : '#334155', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        width: isShipped ? '100%' : '0%',
                        height: '100%',
                        background: isShipped ? '#10b981' : '#f59e0b',
                        transition: 'width 0.4s ease'
                      }} />
                    </div>
                  </div>

                  <div style={{ marginTop: '1rem', display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleToggleStatus(person)}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        borderRadius: '8px',
                        border: `1px solid ${glassBorder}`,
                        background: 'transparent',
                        color: 'var(--text-primary)',
                        fontSize: '0.78rem',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      {isShipped ? 'Beklemeye Al' : 'Sevk Et'}
                    </button>
                    <button
                      onClick={() => generatePersonnelPDF(person)}
                      style={{
                        padding: '0.5rem 0.8rem',
                        borderRadius: '8px',
                        border: `1px solid ${glassBorder}`,
                        background: 'transparent',
                        color: 'var(--text-primary)',
                        fontSize: '0.78rem',
                        cursor: 'pointer'
                      }}
                      title="PDF Çıkar"
                    >
                      📄
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD / EDIT MODAL                                                          */}
      {/* ========================================================================= */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(6px)'
        }}>
          <div style={{
            background: cardBg,
            borderRadius: '24px',
            border: `1px solid ${glassBorder}`,
            width: '90%',
            maxWidth: '560px',
            padding: '2rem',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '900', color: 'var(--text-primary)' }}>
                {modalMode === 'add' ? `➕ Yeni ${selectedBrand} Personeli Ekle` : '✏️ Personel Bilgilerini Düzenle'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'transparent', border: 'none', color: textMuted, cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModal}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: textMuted, marginBottom: '4px' }}>PERSONEL ADI SOYADI</label>
                  <input
                    type="text"
                    required
                    value={formData.staff_name}
                    onChange={(e) => setFormData({ ...formData, staff_name: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '10px', border: `1px solid ${glassBorder}`, background: isLight ? '#f8fafc' : '#1e293b', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: textMuted, marginBottom: '4px' }}>BAYİ / YETKİLİ SATICI</label>
                  <input
                    type="text"
                    required
                    value={formData.dealer}
                    onChange={(e) => setFormData({ ...formData, dealer: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '10px', border: `1px solid ${glassBorder}`, background: isLight ? '#f8fafc' : '#1e293b', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: textMuted, marginBottom: '4px' }}>GÖREV / ROL</label>
                  <input
                    type="text"
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '10px', border: `1px solid ${glassBorder}`, background: isLight ? '#f8fafc' : '#1e293b', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: textMuted, marginBottom: '4px' }}>CİNSİYET</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '10px', border: `1px solid ${glassBorder}`, background: isLight ? '#f8fafc' : '#1e293b', color: 'var(--text-primary)', outline: 'none' }}
                  >
                    <option value="ERKEK">ERKEK</option>
                    <option value="KADIN">KADIN</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: textMuted, marginBottom: '4px' }}>ÜST BEDEN</label>
                  <select
                    value={formData.top_size}
                    onChange={(e) => setFormData({ ...formData, top_size: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '10px', border: `1px solid ${glassBorder}`, background: isLight ? '#f8fafc' : '#1e293b', color: 'var(--text-primary)', outline: 'none' }}
                  >
                    {STANDARD_TOP_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: textMuted, marginBottom: '4px' }}>ALT BEDEN</label>
                  <select
                    value={formData.bottom_size}
                    onChange={(e) => setFormData({ ...formData, bottom_size: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '10px', border: `1px solid ${glassBorder}`, background: isLight ? '#f8fafc' : '#1e293b', color: 'var(--text-primary)', outline: 'none' }}
                  >
                    {STANDARD_BOTTOM_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {modalMode === 'add' && (
                  <>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: textMuted, marginBottom: '4px' }}>ÜRÜN ADI</label>
                      <input
                        type="text"
                        value={formData.product_name}
                        onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                        style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '10px', border: `1px solid ${glassBorder}`, background: isLight ? '#f8fafc' : '#1e293b', color: 'var(--text-primary)', outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: textMuted, marginBottom: '4px' }}>MİKTAR</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                        style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '10px', border: `1px solid ${glassBorder}`, background: isLight ? '#f8fafc' : '#1e293b', color: 'var(--text-primary)', outline: 'none' }}
                      />
                    </div>
                  </>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', border: `1px solid ${glassBorder}`, background: 'transparent', color: textMuted, fontWeight: '700', cursor: 'pointer' }}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', border: 'none', background: '#E60000', color: '#fff', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 12px rgba(230,0,0,0.3)' }}
                >
                  {modalMode === 'add' ? 'Kaydet' : 'Güncelle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonnelOperationsHub;
