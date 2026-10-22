import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import API_BASE_URL from '../services/apiConfig';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ROBOTO_REGULAR, ROBOTO_BOLD } from '../assets/fonts/fonts.js';

const TARGET_ROLES = [
  'Servis Danışmanı',
  'Diğer Servis Danışmanı',
  'Formen',
  'Mekanik Teknisyen',
  'Kaporta Teknisyen',
  'Master Teknisyen',
  'GarantiDispozisyon'
];

const SeatOrderManagement = () => {
  const navigate = useNavigate();
  const { themeMode } = useLanguage();
  const [shipments, setShipments] = useState([]);
  const [rfidReads, setRfidReads] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & View States
  const [selectedDealer, setSelectedDealer] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [activeTab, setActiveTab] = useState('Servis Danışmanı');
  const [viewType, setViewType] = useState('person'); // 'person' or 'order'
  const [searchQuery, setSearchQuery] = useState('');

  // Excel Cell Selection States
  const [activeCell, setActiveCell] = useState({ rowIndex: null, colIndex: null, value: '' });
  const [showFormulaHelp, setShowFormulaHelp] = useState(false);
  const colLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

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
    product_name: 'Yazlık Polo Tişört',
    quantity: 1,
    status: 'Pending'
  });

  const handleOpenAdd = () => {
    setModalMode('add');
    setFormData({
      staff_name: '',
      dealer: selectedDealer !== 'All' ? selectedDealer : '',
      role: activeTab,
      gender: 'ERKEK',
      top_size: 'L',
      bottom_size: '48',
      product_name: 'Yazlık Polo Tişört',
      quantity: 1,
      status: 'Pending'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (shipment) => {
    setModalMode('edit');
    setEditOriginalKey({ name: shipment.name, dealer: shipment.dealer });
    setFormData({
      staff_name: shipment.name,
      dealer: shipment.dealer,
      role: shipment.role,
      gender: shipment.gender || 'ERKEK',
      top_size: shipment.top_size || '-',
      bottom_size: shipment.bottom_size || '-',
      product_name: shipment.items?.[0]?.product_name || 'Yazlık Polo Tişört',
      quantity: shipment.items?.[0]?.quantity || 1,
      status: shipment.status
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const url = `${API_BASE_URL}/api/seat/shipments`;
      const method = modalMode === 'edit' ? 'PUT' : 'POST';
      const body = modalMode === 'edit' 
        ? { old_name: editOriginalKey.name, old_dealer: editOriginalKey.dealer, name: formData.staff_name, dealer: formData.dealer, role: formData.role, gender: formData.gender, top_size: formData.top_size, bottom_size: formData.bottom_size, status: formData.status }
        : formData;

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
        alert(data.message || 'Hata oluştu.');
      }
    } catch (err) {
      console.error(err);
      alert('Ağ hatası oluştu.');
    }
  };

  const handleDelete = async (shipment) => {
    if (!window.confirm(`${shipment.name} isimli personeli silmek istediğinize emin misiniz?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/seat/shipments`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: shipment.name, dealer: shipment.dealer })
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.message || 'Silme işlemi başarısız.');
      }
    } catch (err) {
      console.error(err);
      alert('Ağ hatası oluştu.');
    }
  };

  const isLight = themeMode === 'light';
  const glassBg = isLight ? 'rgba(15, 23, 42, 0.02)' : 'rgba(255, 255, 255, 0.02)';
  const glassBorder = isLight ? 'rgba(15, 23, 42, 0.05)' : 'rgba(255, 255, 255, 0.05)';
  const cardBg = isLight ? 'rgba(15, 23, 42, 0.02)' : 'rgba(255, 255, 255, 0.03)';
  const cardBorder = isLight ? 'rgba(15, 23, 42, 0.05)' : 'rgba(255, 255, 255, 0.05)';

  const fetchData = async () => {
    try {
      const [shipmentsRes, rfidRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/seat/shipments`),
        fetch(`${API_BASE_URL}/api/rfid/reads`)
      ]);

      const shipmentsData = await shipmentsRes.json();
      const rfidData = await rfidRes.json();

      if (shipmentsData.success) setShipments(shipmentsData.data);
      if (rfidData.success) setRfidReads(rfidData.data);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const generatePDF = (shipment) => {
    const doc = new jsPDF();
    
    // Add Turkish font support
    doc.addFileToVFS('Roboto-Regular.ttf', ROBOTO_REGULAR);
    doc.addFileToVFS('Roboto-Bold.ttf', ROBOTO_BOLD);
    doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
    doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
    doc.setFont('Roboto', 'normal');

    // Add Header Accent
    doc.setFillColor(230, 0, 0); // VOG Red
    doc.rect(0, 0, 210, 4, 'F');
    
    // Title
    doc.setFont('Roboto', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(230, 0, 0);
    doc.text('SEAT 2026 YAZ KOLEKSİYONU', 105, 20, { align: 'center' });
    
    doc.setFontSize(13);
    doc.setTextColor(80, 80, 80);
    doc.text(viewType === 'person' ? 'KİŞİ BAZLI SEVKİYAT FORMU' : 'SİPARİŞ BAZLI SEVKİYAT FORMU', 105, 28, { align: 'center' });

    // Draw metadata box
    doc.setFillColor(250, 250, 250);
    doc.setDrawColor(230, 230, 230);
    doc.roundedRect(14, 36, 182, 46, 3, 3, 'FD');

    // Left Column Info
    doc.setFont('Roboto', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    
    doc.text('Bayi / Yetkili Satıcı:', 20, 44);
    doc.setFont('Roboto', 'normal');
    doc.text(`${shipment.dealer}`, 60, 44);

    doc.setFont('Roboto', 'bold');
    doc.text('Grup / Görev:', 20, 51);
    doc.setFont('Roboto', 'normal');
    doc.text(`${shipment.role}`, 60, 51);

    doc.setFont('Roboto', 'bold');
    doc.text('Tarih:', 20, 58);
    doc.setFont('Roboto', 'normal');
    doc.text(`${new Date().toLocaleDateString('tr-TR')}`, 60, 58);

    doc.setFont('Roboto', 'bold');
    doc.text('Referans ID:', 130, 44);
    doc.setFont('Roboto', 'normal');
    doc.text(`#${shipment.id}`, 160, 44);

    // Personel listesi wrapping (if long, split to fit width 130)
    doc.setFont('Roboto', 'bold');
    doc.text('Personel Listesi:', 20, 65);
    doc.setFont('Roboto', 'normal');
    const personnelText = shipment.name || '-';
    const splitName = doc.splitTextToSize(personnelText, 130);
    doc.text(splitName, 60, 65);

    // Items table
    const tableColumn = ["Ürün Adı", "Beden", "Miktar"];
    const tableRows = [];

    shipment.items.forEach(item => {
      tableRows.push([
        item.product_name,
        item.size || '-',
        item.quantity
      ]);
    });

    // Start table below metadata box. Since metadata box goes to y=82, start at 90.
    autoTable(doc, {
      startY: 90,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { 
        fillColor: [255, 255, 255], 
        textColor: [50, 50, 50],
        font: 'Roboto', 
        fontStyle: 'bold', 
        fontSize: 10,
        halign: 'center',
        lineColor: [220, 220, 220],
        lineWidth: 0.1
      },
      styles: { 
        font: 'Roboto', 
        fontSize: 10,
        textColor: [50, 50, 50],
        halign: 'center'
      },
      columnStyles: {
        0: { halign: 'left' } // Left align product names
      }
    });

    // Footer
    const finalY = doc.lastAutoTable.finalY || 90;
    doc.setFont('Roboto', 'bold');
    doc.text('Teslim Alan İmza:', 20, finalY + 20);
    doc.text('VOG Tekstil Yetkilisi:', 140, finalY + 20);

    const trToEn = (str) => {
      if (!str) return 'Dosya';
      return str
        .replace(/Ğ/g, 'G').replace(/ğ/g, 'g')
        .replace(/Ü/g, 'U').replace(/ü/g, 'u')
        .replace(/Ş/g, 'S').replace(/ş/g, 's')
        .replace(/İ/g, 'I').replace(/ı/g, 'i')
        .replace(/Ö/g, 'O').replace(/ö/g, 'o')
        .replace(/Ç/g, 'C').replace(/ç/g, 'c');
    };
    const cleanedName = trToEn(shipment.name)
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '');

    const safeName = (viewType === 'order') 
      ? `Siparis_${shipment.order_number}` 
      : `Kisi_${cleanedName}`;
    try {
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      
      // Open the PDF in a new tab so the user can preview, print, and choose where to save it
      const pdfWindow = window.open(url, '_blank');
      if (!pdfWindow) {
        // Fallback to direct download if popups are blocked
        const link = document.createElement('a');
        link.href = url;
        link.download = `SEAT_Sevkiyat_${safeName}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Failed to open PDF in new tab, falling back to jsPDF save:', error);
      doc.save(`SEAT_Sevkiyat_${safeName}.pdf`);
    }
  };

  const handleSimulateTunnel = async (shipment) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/seat/shipment/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: shipment.id, status: 'Shipped' })
      });
      const data = await res.json();
      
      if (data.success) {
        const fakeTags = shipment.items.map(item => `EPC-${shipment.id}-${item.product_name.replace(/\s+/g, '').substring(0,5).toUpperCase()}-${Math.random().toString(36).substring(7).toUpperCase()}`);
        
        await fetch(`${API_BASE_URL}/api/rfid/receive`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tags: fakeTags,
            reader_id: 'TUNNEL_DEMO',
            location: 'PACKING_LINE_A',
            order_id: shipment.id
          })
        });

        generatePDF(shipment);
        fetchData();
      }
    } catch (err) {
      console.error('Error simulating tunnel:', err);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Pending': return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', text: 'BEKLEMEDE' };
      case 'Shipped': return { color: 'var(--color-success)', bg: 'rgba(0, 255, 102, 0.1)', text: 'SEVK EDİLDİ' };
      default: return { color: 'var(--text-primary)', bg: isLight ? 'rgba(15, 23, 42, 0.1)' : 'rgba(255, 255, 255, 0.1)', text: status };
    }
  };

  // Get dynamic unique lists for filters
  const dealersList = ['All', ...new Set(shipments.map(s => s.dealer).filter(Boolean))];

  // Helper: Group raw shipments based on viewType ('person' or 'order')
  const getGroupedData = (raw) => {
    const grouped = {};
    raw.forEach(item => {
      // Group by order_number for order view, or by name-dealer for person view
      const key = viewType === 'order' ? String(item.order_number) : `${item.name}-${item.dealer}`;
      
      if (!grouped[key]) {
        grouped[key] = {
          id: item.id,
          order_number: item.order_number,
          name: item.name,
          namesList: item.name ? [item.name] : [],
          dealer: item.dealer,
          role: item.role,
          status: item.status,
          gender: item.gender || 'ERKEK',
          top_size: item.top_size || '-',
          bottom_size: item.bottom_size || '-',
          items: []
        };
      } else {
        if (item.name && !grouped[key].namesList.includes(item.name)) {
          grouped[key].namesList.push(item.name);
        }
      }
      
      // Merge items
      item.items.forEach(pItem => {
        const existing = grouped[key].items.find(i => i.product_name === pItem.product_name && i.size === pItem.size);
        if (existing) {
          existing.quantity += pItem.quantity;
        } else {
          grouped[key].items.push({ ...pItem });
        }
      });

      // Group is Pending if any component order is Pending
      if (item.status === 'Pending') {
        grouped[key].status = 'Pending';
      }
    });

    const result = Object.values(grouped);
    if (viewType === 'order') {
      result.forEach(g => {
        if (g.namesList && g.namesList.length > 0) {
          g.name = `${g.namesList.length} Personel (${g.namesList.join(', ')})`;
        }
      });
    }
    return result;
  };

  // 1. Group/Format first
  const groupedData = getGroupedData(shipments);

  // 2. Filter based on dropdown selections & Search Query
  const filteredData = groupedData.filter(s => {
    const matchDealer = selectedDealer === 'All' || s.dealer === selectedDealer;
    const matchStatus = selectedStatus === 'All' || s.status === selectedStatus;
    
    const normalizeRole = (r) => {
      if (!r) return '';
      return r.toString()
        .toUpperCase()
        .replace(/I/g, 'I')
        .replace(/İ/g, 'I')
        .replace(/\s+/g, '')
        .replace(/&/g, '')
        .replace(/[^A-Z0-9]/g, '');
    };
    const matchGroup = normalizeRole(s.role) === normalizeRole(activeTab);
    
    // Case-insensitive global search query matching
    const query = searchQuery.toLowerCase().trim();
    const matchSearch = !query || 
      (s.name && s.name.toLowerCase().includes(query)) ||
      (s.dealer && s.dealer.toLowerCase().includes(query)) ||
      (s.role && s.role.toLowerCase().includes(query)) ||
      (s.order_number && String(s.order_number).includes(query)) ||
      (s.status && s.status.toLowerCase().includes(query)) ||
      s.items.some(item => item.product_name && item.product_name.toLowerCase().includes(query));

    return matchDealer && matchStatus && matchGroup && matchSearch;
  });

  // Calculate dynamic stats
  const uniquePersonnelCount = new Set(filteredData.map(s => `${s.name}-${s.dealer}`)).size;
  const stats = {
    totalPersonnel: uniquePersonnelCount,
    totalCount: filteredData.length,
    pending: filteredData.filter(s => s.status === 'Pending').length,
    shipped: filteredData.filter(s => s.status === 'Shipped').length
  };

  const getCellStyles = (rowIdx, colIdx) => {
    const isActive = activeCell.rowIndex === rowIdx && activeCell.colIndex === colIdx;
    return {
      padding: '0.4rem 0.8rem',
      border: `1px solid ${isLight ? '#cbd5e1' : '#334155'}`,
      fontSize: '0.75rem',
      color: 'var(--text-primary)',
      cursor: 'cell',
      backgroundColor: isActive ? (isLight ? '#e2f0d9' : '#1b4332') : 'transparent',
      outline: isActive ? '2px solid #107c41' : 'none',
      outlineOffset: '-2px',
      transition: 'background-color 0.1s ease',
      verticalAlign: 'middle'
    };
  };

  return (
    <div className="seat-management" style={{ padding: '2rem', minHeight: '100vh', background: isLight ? 'var(--bg-primary)' : '#05070a' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <button onClick={() => navigate('/admin')} style={{ background: 'transparent', border: `1px solid ${isLight ? 'rgba(15, 23, 42, 0.1)' : 'rgba(255, 255, 255, 0.1)'}`, color: 'var(--text-primary)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', marginBottom: '1rem' }}>
            ← GERİ DÖN
          </button>
          <h1 style={{ color: 'var(--text-primary)', fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-1px' }}>
            SEAT 2026 Yaz Dönemi <span style={{ color: '#E60000' }}>{viewType === 'person' ? 'Kişi Bazlı' : 'Sipariş Bazlı'} Dağıtım</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Personel paket yönetimi ve RFID tünel sevkiyat dokümanları</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={handleOpenAdd} 
            style={{ 
              background: '#E60000', 
              color: '#fff', 
              border: 'none', 
              padding: '0.8rem 1.5rem', 
              borderRadius: '12px', 
              fontWeight: 'bold', 
              cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(230, 0, 0, 0.25)' 
            }}
          >
            + YENİ KAYIT EKLE
          </button>
          <button onClick={fetchData} style={{ background: isLight ? 'rgba(15, 23, 42, 0.05)' : '#1a1a1a', color: 'var(--text-primary)', border: `1px solid ${isLight ? 'rgba(15, 23, 42, 0.1)' : '#333'}`, padding: '0.8rem 1.5rem', borderRadius: '12px', cursor: 'pointer' }}>YENİLE</button>
        </div>
      </div>

      {/* Filter Controls Panel */}
      <div className="glass-card" style={{ padding: '1.5rem 2rem', borderRadius: '20px', background: cardBg, border: `1px solid ${cardBorder}`, marginBottom: '2.5rem', display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
        
        {/* Search Input Box */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: '1 1 240px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-secondary)' }}>ARAMA (İSİM, ÜRÜN, REFERANS NO VB.)</label>
          <input 
            type="text" 
            placeholder="Aramak için kelime girin..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', background: isLight ? '#fff' : '#0d1117', color: 'var(--text-primary)', border: `1px solid ${cardBorder}`, outline: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-secondary)' }}>LİSTELEME TÜRÜ</label>
          <select 
            value={viewType} 
            onChange={(e) => setViewType(e.target.value)}
            style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', background: isLight ? '#fff' : '#0d1117', color: 'var(--text-primary)', border: `1px solid ${cardBorder}`, cursor: 'pointer', minWidth: '160px' }}
          >
            <option value="person">Kişi Bazlı Dağıtım</option>
            <option value="order">Sipariş Bazlı Liste</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-secondary)' }}>BAYİ / YETKİLİ SATICI</label>
          <select 
            value={selectedDealer} 
            onChange={(e) => setSelectedDealer(e.target.value)}
            style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', background: isLight ? '#fff' : '#0d1117', color: 'var(--text-primary)', border: `1px solid ${cardBorder}`, cursor: 'pointer', minWidth: '220px' }}
          >
            {dealersList.map(d => (
              <option key={d} value={d}>{d === 'All' ? 'Tüm Bayiler' : d}</option>
            ))}
          </select>
        </div>



        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-secondary)' }}>SEVK DURUMU</label>
          <select 
            value={selectedStatus} 
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', background: isLight ? '#fff' : '#0d1117', color: 'var(--text-primary)', border: `1px solid ${cardBorder}`, cursor: 'pointer', minWidth: '150px' }}
          >
            <option value="All">Tüm Durumlar</option>
            <option value="Pending">Beklemede</option>
            <option value="Shipped">Sevk Edildi</option>
          </select>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
        {[
          { label: 'TOPLAM PERSONEL', value: stats.totalPersonnel, color: 'var(--text-primary)' },
          { label: viewType === 'person' ? 'TOPLAM PAKET' : 'TOPLAM SİPARİŞ', value: stats.totalCount, color: '#00f3ff' },
          { label: 'SEVK EDİLEN', value: stats.shipped, color: 'var(--color-success)' }
        ].map((stat, idx) => (
          <div key={idx} className="glass-card" style={{ padding: '2rem', borderRadius: '24px', background: cardBg, border: `1px solid ${cardBorder}` }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '700', letterSpacing: '1px', marginBottom: '0.5rem' }}>{stat.label}</p>
            <h2 style={{ fontSize: '2.5rem', color: stat.color, fontWeight: '900' }}>{stat.value}</h2>
          </div>
        ))}
      </div>

      <div className="seat-grid-container">
        {/* Main Shipments Table */}
        <div className="glass-card" style={{ 
          padding: 0, 
          borderRadius: '32px', 
          background: isLight ? '#ffffff' : '#0d1117', 
          border: `1px solid ${glassBorder}`, 
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Main Grid Wrapper */}
          <div className="excel-grid-wrapper" style={{ background: isLight ? '#ffffff' : '#0d1117' }}>
            <table style={{ width: '100%', minWidth: viewType === 'order' ? '900px' : '1150px', borderCollapse: 'collapse', color: 'var(--text-primary)' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                  {/* Excel Column Letters Row */}
                  <tr style={{ background: isLight ? '#f3f2f1' : '#161b22' }}>
                    <th style={{ width: '45px', border: `1px solid ${isLight ? '#e1dfdd' : '#334155'}`, padding: '0.3rem', fontSize: '0.7rem', color: '#605e5c', textAlign: 'center', fontWeight: 'normal', userSelect: 'none' }}></th>
                    {colLetters.slice(0, viewType === 'order' ? 5 : 8).map((letter) => (
                      <th key={letter} style={{ border: `1px solid ${isLight ? '#e1dfdd' : '#334155'}`, padding: '0.3rem', fontSize: '0.7rem', color: '#605e5c', textAlign: 'center', fontWeight: 'normal', userSelect: 'none' }}>
                        {letter}
                      </th>
                    ))}
                  </tr>
                  {/* Actual Column Headers */}
                  <tr style={{ 
                    background: isLight ? '#f3f2f1' : '#161b22',
                    borderBottom: `2px solid ${isLight ? '#cbd5e1' : '#475569'}`
                  }}>
                    <th style={{ border: `1px solid ${isLight ? '#e1dfdd' : '#334155'}`, padding: '0.6rem 0.8rem', fontSize: '0.75rem', fontWeight: '800', color: '#605e5c', textAlign: 'center', userSelect: 'none' }}>#</th>
                    {viewType === 'order' ? (
                      <>
                        <th style={{ border: `1px solid ${isLight ? '#e1dfdd' : '#334155'}`, textAlign: 'left', padding: '0.6rem 0.8rem', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: '800' }}>SİPARİŞ NO</th>
                        <th style={{ border: `1px solid ${isLight ? '#e1dfdd' : '#334155'}`, textAlign: 'left', padding: '0.6rem 0.8rem', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: '800' }}>PERSONEL / BAYİ</th>
                        <th style={{ border: `1px solid ${isLight ? '#e1dfdd' : '#334155'}`, textAlign: 'left', padding: '0.6rem 0.8rem', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: '800' }}>PAKET İÇERİĞİ</th>
                      </>
                    ) : (
                      <>
                        <th style={{ border: `1px solid ${isLight ? '#e1dfdd' : '#334155'}`, textAlign: 'left', padding: '0.6rem 0.8rem', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: '800' }}>YETKİLİ SATICI KISA ADI</th>
                        <th style={{ border: `1px solid ${isLight ? '#e1dfdd' : '#334155'}`, textAlign: 'left', padding: '0.6rem 0.8rem', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: '800' }}>PERSONEL ADI</th>
                        <th style={{ border: `1px solid ${isLight ? '#e1dfdd' : '#334155'}`, textAlign: 'left', padding: '0.6rem 0.8rem', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: '800' }}>GÖREV</th>
                        <th style={{ border: `1px solid ${isLight ? '#e1dfdd' : '#334155'}`, textAlign: 'center', padding: '0.6rem 0.8rem', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: '800' }}>CİNSİYET</th>
                        <th style={{ border: `1px solid ${isLight ? '#e1dfdd' : '#334155'}`, textAlign: 'center', padding: '0.6rem 0.8rem', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: '800' }}>ÜST BEDEN</th>
                        <th style={{ border: `1px solid ${isLight ? '#e1dfdd' : '#334155'}`, textAlign: 'center', padding: '0.6rem 0.8rem', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: '800' }}>ALT BEDEN</th>
                      </>
                    )}
                    <th style={{ border: `1px solid ${isLight ? '#e1dfdd' : '#334155'}`, textAlign: 'center', padding: '0.6rem 0.8rem', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: '800' }}>DURUM</th>
                    <th style={{ border: `1px solid ${isLight ? '#e1dfdd' : '#334155'}`, textAlign: 'right', padding: '0.6rem 0.8rem', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: '800' }}>İŞLEM</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((shipment, idx) => {
                    const style = getStatusStyle(shipment.status);
                    return (
                      <tr 
                        key={viewType === 'order' ? `order-${shipment.order_number}` : `person-${shipment.name}-${shipment.dealer}`} 
                        style={{ 
                          borderBottom: `1px solid ${isLight ? '#e1dfdd' : '#334155'}`
                        }}
                      >
                        {/* Excel Row Number Cell */}
                        <td style={{ 
                          background: isLight ? '#f3f2f1' : '#161b22', 
                          border: `1px solid ${isLight ? '#e1dfdd' : '#334155'}`, 
                          fontSize: '0.7rem', 
                          color: '#605e5c', 
                          textAlign: 'center', 
                          fontWeight: '600',
                          userSelect: 'none'
                        }}>
                          {idx + 2}
                        </td>
                        {viewType === 'order' ? (
                          <>
                            <td 
                              onClick={() => setActiveCell({ rowIndex: idx, colIndex: 0, value: `#${shipment.order_number}` })}
                              style={getCellStyles(idx, 0)}
                            >
                              <div style={{ 
                                fontWeight: '900', 
                                fontFamily: 'monospace', 
                                color: '#E60000', 
                                fontSize: '0.9rem',
                                background: 'rgba(230, 0, 0, 0.05)',
                                padding: '0.2rem 0.5rem',
                                borderRadius: '4px',
                                display: 'inline-block'
                              }}>
                                #{shipment.order_number}
                              </div>
                            </td>
                            <td 
                              onClick={() => setActiveCell({ rowIndex: idx, colIndex: 1, value: shipment.namesList?.join(', ') || '' })}
                              style={getCellStyles(idx, 1)}
                            >
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                                  {shipment.namesList?.join(', ')}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                  {shipment.dealer} | {shipment.role}
                                </div>
                              </div>
                            </td>
                            <td 
                              onClick={() => setActiveCell({ rowIndex: idx, colIndex: 2, value: shipment.items.map(i => `${i.quantity}x ${i.product_name}`).join(', ') })}
                              style={getCellStyles(idx, 2)}
                            >
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                {shipment.items.map((item, i) => (
                                  <div 
                                    key={i} 
                                    style={{ 
                                      display: 'inline-flex', 
                                      alignItems: 'center', 
                                      gap: '0.4rem', 
                                      fontSize: '0.7rem',
                                      color: 'var(--text-primary)'
                                    }}
                                  >
                                    <span style={{ fontWeight: '800', color: '#E60000' }}>{item.quantity}x</span>
                                    <span>{item.product_name}</span>
                                    <span style={{ opacity: 0.5 }}>Beden: {item.size || '-'}</span>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td 
                              onClick={() => setActiveCell({ rowIndex: idx, colIndex: 0, value: shipment.dealer || '' })}
                              style={getCellStyles(idx, 0)}
                            >
                              {shipment.dealer}
                            </td>
                            <td 
                              onClick={() => setActiveCell({ rowIndex: idx, colIndex: 1, value: shipment.name || '' })}
                              style={getCellStyles(idx, 1)}
                            >
                              {shipment.name}
                            </td>
                            <td 
                              onClick={() => setActiveCell({ rowIndex: idx, colIndex: 2, value: shipment.role || '' })}
                              style={getCellStyles(idx, 2)}
                            >
                              {shipment.role}
                            </td>
                            <td 
                              onClick={() => setActiveCell({ rowIndex: idx, colIndex: 3, value: shipment.gender || '' })}
                              style={getCellStyles(idx, 3)}
                            >
                              {shipment.gender}
                            </td>
                            <td 
                              onClick={() => setActiveCell({ rowIndex: idx, colIndex: 4, value: shipment.top_size || '' })}
                              style={getCellStyles(idx, 4)}
                            >
                              {shipment.top_size}
                            </td>
                            <td 
                              onClick={() => setActiveCell({ rowIndex: idx, colIndex: 5, value: shipment.bottom_size || '' })}
                              style={getCellStyles(idx, 5)}
                            >
                              {shipment.bottom_size}
                            </td>
                          </>
                        )}
                        <td 
                          onClick={() => setActiveCell({ rowIndex: idx, colIndex: viewType === 'order' ? 3 : 6, value: style.text })}
                          style={getCellStyles(idx, viewType === 'order' ? 3 : 6)}
                        >
                          <span style={{ 
                            padding: '0.25rem 0.6rem', 
                            borderRadius: '20px', 
                            fontSize: '0.65rem', 
                            fontWeight: '800', 
                            background: style.bg, 
                            color: style.color, 
                            border: `1px solid ${style.color}25`
                          }}>
                            {style.text}
                          </span>
                        </td>
                        <td style={{ 
                          padding: '0.4rem 0.8rem', 
                          border: `1px solid ${isLight ? '#cbd5e1' : '#334155'}`,
                          textAlign: 'right',
                          verticalAlign: 'middle'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem', alignItems: 'center' }}>
                            <button 
                              onClick={() => handleOpenEdit(shipment)}
                              style={{
                                background: isLight ? 'rgba(15, 23, 42, 0.05)' : 'rgba(255, 255, 255, 0.05)',
                                border: `1px solid ${isLight ? 'rgba(15, 23, 42, 0.1)' : 'rgba(255, 255, 255, 0.1)'}`,
                                color: 'var(--text-primary)',
                                padding: '0.35rem 0.7rem',
                                borderRadius: '6px',
                                fontSize: '0.65rem',
                                fontWeight: '700',
                                cursor: 'pointer'
                              }}
                            >
                              DÜZENLE
                            </button>
                            <button 
                              onClick={() => handleDelete(shipment)}
                              style={{
                                background: 'rgba(230, 0, 0, 0.05)',
                                border: '1px solid rgba(230, 0, 0, 0.2)',
                                color: '#E60000',
                                padding: '0.35rem 0.7rem',
                                borderRadius: '6px',
                                fontSize: '0.65rem',
                                fontWeight: '700',
                                cursor: 'pointer'
                              }}
                            >
                              SİL
                            </button>
                            {shipment.status === 'Pending' ? (
                              <span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '0.2rem', marginLeft: '0.4rem' }}>
                                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block', animation: 'pulse 1.5s infinite' }}></span>
                                Tünel...
                              </span>
                            ) : (
                              <button 
                                onClick={() => generatePDF(shipment)}
                                style={{ 
                                  background: 'linear-gradient(135deg, #10b981, #059669)', 
                                  border: 'none',
                                  color: '#ffffff', 
                                  padding: '0.4rem 0.9rem', 
                                  borderRadius: '6px', 
                                  fontSize: '0.65rem', 
                                  fontWeight: '800', 
                                  cursor: 'pointer',
                                  boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)',
                                  marginLeft: '0.4rem'
                                }}
                              >
                                İRSALİYE
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredData.length === 0 && (
                    <tr>
                      <td colSpan={viewType === 'order' ? 6 : 9} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        Seçilen filtrelere veya aramaya uygun kayıt bulunamadı.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          {/* Excel-style Status Bar & Sheet Tabs at the Bottom */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            background: isLight ? '#f3f2f1' : '#161b22', 
            borderTop: `1px solid ${isLight ? '#cbd5e1' : '#475569'}`,
            padding: '0.3rem 0.5rem',
            flexWrap: 'nowrap'
          }}>
            {/* Sheet Tabs */}
            <div 
              className="excel-tabs-container"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '2px', 
                overflowX: 'auto', 
                flex: 1,
                minWidth: 0,
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            >
              {/* Navigation controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 8px', color: '#605e5c', borderRight: `1px solid ${isLight ? '#cbd5e1' : '#475569'}`, marginRight: '8px' }}>
                <span style={{ cursor: 'pointer', fontSize: '0.7rem', userSelect: 'none' }}>◀</span>
                <span style={{ cursor: 'pointer', fontSize: '0.7rem', userSelect: 'none' }}>▶</span>
              </div>
              
              {TARGET_ROLES.map((role) => {
                const isActive = activeTab === role;
                return (
                  <div 
                    key={role}
                    onClick={() => setActiveTab(role)}
                    style={{
                      padding: '0.4rem 1.2rem',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: isActive ? '700' : '500',
                      backgroundColor: isActive ? (isLight ? '#ffffff' : '#0d1117') : 'transparent',
                      color: isActive ? '#107c41' : 'var(--text-secondary)',
                      borderTopLeftRadius: '4px',
                      borderTopRightRadius: '4px',
                      border: isActive ? `1px solid ${isLight ? '#cbd5e1' : '#475569'}` : '1px solid transparent',
                      borderBottom: isActive ? `1px solid ${isLight ? '#ffffff' : '#0d1117'}` : 'none',
                      marginTop: '2px',
                      marginBottom: '-5px',
                      position: 'relative',
                      zIndex: isActive ? 2 : 1,
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {role}
                  </div>
                );
              })}
            </div>
            
            {/* Excel Status info */}
            <div style={{ 
              fontSize: '0.7rem', 
              color: '#605e5c', 
              fontWeight: '600', 
              paddingLeft: '1rem',
              paddingRight: '1rem', 
              userSelect: 'none',
              flexShrink: 0,
              whiteSpace: 'nowrap'
            }}>
              HAZIR | Toplam Satır: {filteredData.length} | Seçilen: {activeCell.rowIndex !== null ? `1` : `0`}
            </div>
          </div>
        </div>

        {/* Real-time RFID Feed */}
        <div>
          <div className="glass-card" style={{ padding: '2rem', borderRadius: '32px', background: glassBg, border: `1px solid ${glassBorder}`, position: 'sticky', top: '2rem' }}>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-success)', boxShadow: '0 0 10px var(--color-success)' }}></span>
              CANLI RFID AKIŞI (TÜNEL)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {rfidReads.slice(0, 10).map((read, idx) => (
                <div key={read.id} style={{ padding: '1rem', background: isLight ? 'rgba(15, 23, 42, 0.03)' : 'rgba(255, 255, 255, 0.03)', borderRadius: '16px', borderLeft: '3px solid #00f3ff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ color: 'var(--color-info)', fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: '700' }}>{read.tag_id}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.65rem' }}>{new Date(read.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    Cihaz: {read.reader_id} | Lokasyon: {read.location} | Sipariş: {read.order_id}
                  </div>
                </div>
              ))}
              {rfidReads.length === 0 && (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.8rem', padding: '2rem' }}>Henüz veri okunmadı...</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CRUD Modal Overlay */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '1.5rem'
        }}>
          <div className="glass-card" style={{
            background: isLight ? '#ffffff' : '#0d1117',
            border: `1px solid ${glassBorder}`,
            borderRadius: '24px',
            padding: '2.5rem',
            width: '100%',
            maxWidth: '600px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--text-primary)', margin: 0 }}>
                {modalMode === 'edit' ? 'Kayıt Düzenle' : 'Yeni Kayıt Ekle'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-secondary)' }}>PERSONEL ADI SOYADI</label>
                <input 
                  type="text"
                  required
                  value={formData.staff_name}
                  onChange={(e) => setFormData({ ...formData, staff_name: e.target.value })}
                  style={{ padding: '0.7rem 1rem', borderRadius: '8px', background: isLight ? '#f8fafc' : '#161b22', color: 'var(--text-primary)', border: `1px solid ${glassBorder}`, outline: 'none' }}
                  placeholder="örn. Göksel El..."
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-secondary)' }}>YETKİLİ SATICI / BAYİ</label>
                <select
                  required
                  value={formData.dealer}
                  onChange={(e) => setFormData({ ...formData, dealer: e.target.value })}
                  style={{ padding: '0.7rem 1rem', borderRadius: '8px', background: isLight ? '#f8fafc' : '#161b22', color: 'var(--text-primary)', border: `1px solid ${glassBorder}`, outline: 'none', cursor: 'pointer' }}
                >
                  <option value="" disabled>Seçiniz...</option>
                  {dealersList.filter(d => d !== 'All').map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                  <option value="New">Yeni Bayi Ekle...</option>
                </select>
                {formData.dealer === 'New' && (
                  <input 
                    type="text"
                    required
                    placeholder="Yeni Bayi Adı Girin..."
                    onChange={(e) => setFormData({ ...formData, dealer: e.target.value })}
                    style={{ padding: '0.7rem 1rem', borderRadius: '8px', background: isLight ? '#f8fafc' : '#161b22', color: 'var(--text-primary)', border: `1px solid ${glassBorder}`, outline: 'none', marginTop: '0.5rem' }}
                  />
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-secondary)' }}>GÖREV / GRUP</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    style={{ padding: '0.7rem 1rem', borderRadius: '8px', background: isLight ? '#f8fafc' : '#161b22', color: 'var(--text-primary)', border: `1px solid ${glassBorder}`, outline: 'none', cursor: 'pointer' }}
                  >
                    {TARGET_ROLES.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-secondary)' }}>CİNSİYET</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    style={{ padding: '0.7rem 1rem', borderRadius: '8px', background: isLight ? '#f8fafc' : '#161b22', color: 'var(--text-primary)', border: `1px solid ${glassBorder}`, outline: 'none', cursor: 'pointer' }}
                  >
                    <option value="ERKEK">ERKEK</option>
                    <option value="KADIN">KADIN</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-secondary)' }}>ÜST BEDEN</label>
                  <input 
                    type="text"
                    required
                    value={formData.top_size}
                    onChange={(e) => setFormData({ ...formData, top_size: e.target.value })}
                    style={{ padding: '0.7rem 1rem', borderRadius: '8px', background: isLight ? '#f8fafc' : '#161b22', color: 'var(--text-primary)', border: `1px solid ${glassBorder}`, outline: 'none' }}
                    placeholder="örn. L, XL, 46..."
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-secondary)' }}>ALT BEDEN</label>
                  <input 
                    type="text"
                    required
                    value={formData.bottom_size}
                    onChange={(e) => setFormData({ ...formData, bottom_size: e.target.value })}
                    style={{ padding: '0.7rem 1rem', borderRadius: '8px', background: isLight ? '#f8fafc' : '#161b22', color: 'var(--text-primary)', border: `1px solid ${glassBorder}`, outline: 'none' }}
                    placeholder="örn. 48, 50, XL..."
                  />
                </div>
              </div>

              {modalMode === 'add' && (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-secondary)' }}>ÜRÜN ADI</label>
                    <input 
                      type="text"
                      required
                      value={formData.product_name}
                      onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                      style={{ padding: '0.7rem 1rem', borderRadius: '8px', background: isLight ? '#f8fafc' : '#161b22', color: 'var(--text-primary)', border: `1px solid ${glassBorder}`, outline: 'none' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-secondary)' }}>MİKTAR</label>
                    <input 
                      type="number"
                      required
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                      style={{ padding: '0.7rem 1rem', borderRadius: '8px', background: isLight ? '#f8fafc' : '#161b22', color: 'var(--text-primary)', border: `1px solid ${glassBorder}`, outline: 'none' }}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-secondary)' }}>SEVK DURUMU</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  style={{ padding: '0.7rem 1rem', borderRadius: '8px', background: isLight ? '#f8fafc' : '#161b22', color: 'var(--text-primary)', border: `1px solid ${glassBorder}`, outline: 'none', cursor: 'pointer' }}
                >
                  <option value="Pending">Beklemede (Tünel Bekleniyor)</option>
                  <option value="Shipped">Sevk Edildi (İrsaliye Hazır)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  style={{
                    background: 'transparent',
                    border: `1px solid ${glassBorder}`,
                    color: 'var(--text-primary)',
                    padding: '0.8rem 1.8rem',
                    borderRadius: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  İPTAL
                </button>
                <button 
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, #E60000, #b30000)',
                    border: 'none',
                    color: '#ffffff',
                    padding: '0.8rem 2.2rem',
                    borderRadius: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: '0 4px 10px rgba(230, 0, 0, 0.2)'
                  }}
                >
                  KAYDET
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeatOrderManagement;
