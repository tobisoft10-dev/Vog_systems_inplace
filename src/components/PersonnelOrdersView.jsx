import React, { useState, useEffect, useMemo } from 'react';
import API_BASE_URL from '../services/apiConfig';
import PersonnelLabelAndReceiptModal from './PersonnelLabelAndReceiptModal';
import { getChuteWallStyle, extractCleanShoeDisplay } from '../pages/PersonnelOrderManagement';

const chToPhysicalMap = {
  1: 'A1-1', 2: 'A1-2', 3: 'A1-3', 4: 'A1-4', 5: 'A1-5', 6: 'A1-6', 7: 'A1-7', 8: 'A1-8', 9: 'A1-9',
  10: 'A0-1', 11: 'A0-2', 12: 'A0-3', 13: 'A0-4', 14: 'A0-5', 15: 'A0-6',
  16: 'A3-1', 17: 'A3-2', 18: 'A3-3', 19: 'A3-4', 20: 'A3-5', 21: 'A3-6', 22: 'A3-7', 23: 'A3-8', 24: 'A3-9',
  25: 'A4-1', 26: 'A4-2', 27: 'A4-3', 28: 'A4-4', 29: 'A4-5', 30: 'A4-6',
  31: 'B1-1', 32: 'B1-2', 33: 'B1-3', 34: 'B1-4', 35: 'B1-5', 36: 'B1-6', 37: 'B1-7', 38: 'B1-8', 39: 'B1-9',
  40: 'B0-1', 41: 'B0-2', 42: 'B0-3', 43: 'B0-4', 44: 'B0-5', 45: 'B0-6',
  46: 'B3-1', 47: 'B3-2', 48: 'B3-3', 49: 'B3-4', 50: 'B3-5', 51: 'B3-6', 52: 'B3-7', 53: 'B3-8', 54: 'B3-9',
  55: 'B4-1', 56: 'B4-2', 57: 'B4-3', 58: 'B4-4', 59: 'B4-5', 60: 'B4-6',
  61: 'A2-1', 62: 'A2-2', 63: 'A2-3'
};

const PersonnelOrdersView = ({ isLight = false, navigate }) => {
  const [selectedBrand, setSelectedBrand] = useState('VOLKSWAGEN');
  const [availableBrands, setAvailableBrands] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedDealer, setSelectedDealer] = useState('ALL');
  const [selectedStatusTab, setSelectedStatusTab] = useState('ALL'); // 'ALL' | 'PENDING' | 'PRINTED' | 'PACKED'
  const [dealers, setDealers] = useState([]);
  const [selectedStaffIds, setSelectedStaffIds] = useState([]);
  const [selectedStaffForPrint, setSelectedStaffForPrint] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState(null);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Auto-dismiss feedback message
  useEffect(() => {
    if (feedbackMsg) {
      const timer = setTimeout(() => setFeedbackMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMsg]);

  // Load Brands
  const fetchBrands = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/personnel-orders/brands`);
      const data = await res.json();
      if (data.success && Array.isArray(data.brands)) {
        setAvailableBrands(data.brands);
      }
    } catch (e) {
      console.error('Failed to fetch brands:', e);
    }
  };

  // Load Departments for current brand
  const fetchDepartments = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/personnel-orders/departments?brand=${encodeURIComponent(selectedBrand)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.departments)) {
        setDepartments(data.departments);
      }
    } catch (e) {
      console.error('Failed to fetch departments:', e);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  // Load Dealers & Staff List when filters change
  useEffect(() => {
    fetchDepartments();
    fetchStaffList();
  }, [selectedBrand, selectedDept, selectedDealer]);

  const fetchStaffList = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const params = new URLSearchParams({
        brand: selectedBrand
      });
      if (selectedDept !== 'ALL') params.set('department', selectedDept);
      if (selectedDealer !== 'ALL') params.set('dealer', selectedDealer);

      const res = await fetch(`${API_BASE_URL}/api/personnel-orders/staff-list?${params.toString()}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.staff)) {
        setStaffList(data.staff);
        // Extract unique dealers for dropdown if not already set
        const uniqueDealers = Array.from(new Set(data.staff.map(s => s.service_center).filter(Boolean))).sort();
        setDealers(uniqueDealers);
      }
    } catch (err) {
      console.error('Failed to fetch personnel staff list:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Step Update Handler
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
      } else {
        alert(data.message || 'İşlem adımı güncellenemedi.');
      }
    } catch (e) {
      alert('Hata: ' + e.message);
    }
  };

  // Bulk mark as printed
  const handleBulkMarkPrinted = async () => {
    if (selectedStaffIds.length === 0) return;
    if (!window.confirm(`Seçilen ${selectedStaffIds.length} personelin fiş durumunu "BASILDI" olarak güncellemek istiyor musunuz?`)) return;

    setIsBulkProcessing(true);
    try {
      let updatedCount = 0;
      for (const id of selectedStaffIds) {
        await fetch(`${API_BASE_URL}/api/personnel-orders/print-voucher`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            personnel_id: id,
            barcode_type: '1D',
            print_receipt: true,
            print_labels: false,
            print_box: false
          })
        });
        updatedCount++;
      }
      setFeedbackMsg({ type: 'success', text: `🎉 ${updatedCount} personelin fiş durumu "BASILDI" olarak güncellendi.` });
      fetchStaffList(true);
      setSelectedStaffIds([]);
    } catch (err) {
      alert('Toplu işlem hatası: ' + err.message);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // Toggle selection
  const handleToggleSelectAll = () => {
    if (selectedStaffIds.length === filteredStaff.length && filteredStaff.length > 0) {
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

  // Filter and Search logic
  const filteredStaff = useMemo(() => {
    return staffList.filter(p => {
      // 1. Status Filter Tab
      if (selectedStatusTab === 'PENDING') {
        const isPendingVoucher = !p.voucher_status || p.voucher_status === 'BEKLİYOR';
        if (!isPendingVoucher) return false;
      } else if (selectedStatusTab === 'PRINTED') {
        if (p.voucher_status !== 'BASILDI') return false;
      } else if (selectedStatusTab === 'PACKED') {
        if (p.packing_status !== 'PACKED' && p.packing_status !== 'SHIPPED') return false;
      }

      // 2. Search Query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const nameMatch = (p.name || '').toLowerCase().includes(q);
        const centerMatch = (p.service_center || '').toLowerCase().includes(q);
        const partMatch = (p.part_no || '').toLowerCase().includes(q);
        const idMatch = (p.id || '').toLowerCase().includes(q);
        const shoeMatch = (p.shoe_size || '').toLowerCase().includes(q);
        if (!nameMatch && !centerMatch && !partMatch && !idMatch && !shoeMatch) return false;
      }

      return true;
    });
  }, [staffList, selectedStatusTab, searchTerm]);

  // Overall Statistics
  const stats = useMemo(() => {
    const total = staffList.length;
    const pendingVoucher = staffList.filter(p => !p.voucher_status || p.voucher_status === 'BEKLİYOR').length;
    const printedVoucher = staffList.filter(p => p.voucher_status === 'BASILDI').length;
    const packed = staffList.filter(p => p.packing_status === 'PACKED' || p.packing_status === 'SHIPPED').length;
    const onSorter = staffList.filter(p => p.sorter_chute).length;
    return { total, pendingVoucher, printedVoucher, packed, onSorter };
  }, [staffList]);

  return (
    <div>
      {/* Feedback Toast */}
      {feedbackMsg && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          padding: '0.9rem 1.4rem',
          borderRadius: '12px',
          background: feedbackMsg.type === 'error' ? '#ef4444' : '#10b981',
          color: '#ffffff',
          fontWeight: '800',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          animation: 'fadeIn 0.2s ease-in-out'
        }}>
          <span>{feedbackMsg.text}</span>
          <button 
            onClick={() => setFeedbackMsg(null)}
            style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: '900', fontSize: '1.1rem' }}
          >
            ×
          </button>
        </div>
      )}

      {/* Top Banner / Filter Toolbar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.5rem',
        padding: '1.2rem 1.5rem',
        borderRadius: '1.2rem',
        background: isLight ? '#ffffff' : '#0f172a',
        border: `1px solid ${isLight ? '#e2e8f0' : '#1e293b'}`,
        boxShadow: isLight ? '0 4px 15px rgba(0,0,0,0.03)' : '0 4px 20px rgba(0,0,0,0.4)'
      }}>
        {/* Title & Info */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <span style={{ fontSize: '1.5rem' }}>👤</span>
            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '900', letterSpacing: '-0.3px' }}>
              {selectedBrand} BAYİ & SERVİS PERSONELİ ETİKET BASIM MERKEZİ
            </h2>
            {refreshing && (
              <span style={{ fontSize: '0.78rem', color: '#3b82f6', fontWeight: '700', background: 'rgba(59,130,246,0.1)', padding: '0.2rem 0.6rem', borderRadius: '20px' }}>
                🔄 Güncelleniyor...
              </span>
            )}
          </div>
          <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.85rem', color: isLight ? '#64748b' : '#94a3b8' }}>
            Toplam <strong>{stats.total}</strong> {selectedBrand === 'VOLKSWAGEN' ? 'Danışman' : 'Personel'} | Kıyafet Seti (SATO 100x50mm RFID) + A5 Sevk Fişi + Godex Koli Etiketi
          </p>
        </div>

        {/* Right Controls: Filters & Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
          {/* Brand Selector */}
          <select
            value={selectedBrand}
            onChange={(e) => {
              setSelectedBrand(e.target.value);
              setSelectedDept('ALL');
              setSelectedDealer('ALL');
            }}
            style={{
              padding: '0.6rem 0.9rem',
              borderRadius: '8px',
              border: `1.5px solid ${isLight ? '#3b82f6' : '#60a5fa'}`,
              background: isLight ? '#eff6ff' : 'rgba(59,130,246,0.15)',
              color: isLight ? '#1e40af' : '#93c5fd',
              fontWeight: '900',
              fontSize: '0.84rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {availableBrands.length > 0 ? (
              availableBrands.map((b, i) => (
                <option key={i} value={b.brand}>
                  🏢 {b.brand} ({b.staff_count} {b.brand === 'VOLKSWAGEN' ? 'Danışman' : 'Personel'})
                </option>
              ))
            ) : (
              <>
                <option value="VOLKSWAGEN">🏢 VOLKSWAGEN (442 Danışman)</option>
                <option value="SCANIA">🏢 SCANIA (851 Personel)</option>
                <option value="SKODA">🏢 SKODA (285 Personel)</option>
                <option value="SEAT">🏢 SEAT (61 Personel)</option>
                <option value="AUDI">🏢 AUDI</option>
                <option value="FORD">🏢 FORD (4 Personel)</option>
              </>
            )}
          </select>

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            style={{
              padding: '0.6rem 0.9rem',
              borderRadius: '8px',
              border: `1px solid ${isLight ? '#cbd5e1' : '#334155'}`,
              background: isLight ? '#ffffff' : '#1e293b',
              color: 'inherit',
              fontWeight: '700',
              fontSize: '0.82rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">🏢 Tüm Bölümler (Hepsi)</option>
            {departments.length > 0 ? (
              departments.map((d, idx) => (
                <option key={idx} value={d.department}>
                  🏷️ {d.department} ({d.staff_count} Kişi)
                </option>
              ))
            ) : (
              <>
                <option value="İNCE">🧥 İnce Mont (Satış & Servis)</option>
                <option value="KALIN">🧥 Kalın Mont (Atölye & Mekanik)</option>
              </>
            )}
          </select>

          {/* Dealer Selector */}
          <select
            value={selectedDealer}
            onChange={(e) => setSelectedDealer(e.target.value)}
            style={{
              padding: '0.6rem 0.9rem',
              borderRadius: '8px',
              border: `1px solid ${isLight ? '#cbd5e1' : '#334155'}`,
              background: isLight ? '#ffffff' : '#1e293b',
              color: 'inherit',
              fontWeight: '700',
              fontSize: '0.82rem',
              outline: 'none',
              cursor: 'pointer',
              maxWidth: '220px'
            }}
          >
            <option value="ALL">🏬 Tüm Bayiler ({dealers.length} Bayi)</option>
            {dealers.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Search Box */}
          <div style={{ position: 'relative', width: '260px' }}>
            <span style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.6 }}>🔍</span>
            <input
              type="text"
              placeholder="Danışman, Bayi veya Parça No..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.9rem 0.6rem 2.2rem',
                borderRadius: '8px',
                border: `1px solid ${isLight ? '#cbd5e1' : '#334155'}`,
                background: isLight ? '#ffffff' : '#1e293b',
                color: 'inherit',
                fontSize: '0.82rem',
                fontWeight: '600',
                outline: 'none'
              }}
            />
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => fetchStaffList(true)}
            disabled={refreshing}
            style={{
              padding: '0.6rem 1.1rem',
              borderRadius: '8px',
              border: 'none',
              background: '#2563eb',
              color: '#ffffff',
              fontWeight: '800',
              fontSize: '0.82rem',
              cursor: refreshing ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 2px 8px rgba(37,99,235,0.3)'
            }}
          >
            🔄 {refreshing ? '...' : 'YENİLE'}
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
        marginBottom: '1.25rem'
      }}>
        {/* Total Personnel */}
        <div style={{
          padding: '1.2rem',
          borderRadius: '1rem',
          background: isLight ? '#ffffff' : '#0f172a',
          border: `1px solid ${isLight ? '#e2e8f0' : '#1e293b'}`,
          boxShadow: isLight ? '0 2px 10px rgba(0,0,0,0.02)' : 'none'
        }}>
          <div style={{ fontSize: '0.78rem', color: isLight ? '#64748b' : '#94a3b8', fontWeight: '800', textTransform: 'uppercase' }}>
            👥 Toplam Danışman
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '900', marginTop: '0.3rem', color: '#3b82f6' }}>
            {stats.total}
          </div>
          <div style={{ fontSize: '0.72rem', color: isLight ? '#94a3b8' : '#64748b', marginTop: '0.2rem' }}>
            Seçili Bölüm & Kriter
          </div>
        </div>

        {/* Voucher Pending */}
        <div style={{
          padding: '1.2rem',
          borderRadius: '1rem',
          background: isLight ? '#ffffff' : '#0f172a',
          border: `1px solid ${isLight ? '#e2e8f0' : '#1e293b'}`,
          boxShadow: isLight ? '0 2px 10px rgba(0,0,0,0.02)' : 'none'
        }}>
          <div style={{ fontSize: '0.78rem', color: isLight ? '#64748b' : '#94a3b8', fontWeight: '800', textTransform: 'uppercase' }}>
            ⏳ Fiş & Etiket Bekleyen
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '900', marginTop: '0.3rem', color: '#d97706' }}>
            {stats.pendingVoucher}
          </div>
          <div style={{ fontSize: '0.72rem', color: isLight ? '#94a3b8' : '#64748b', marginTop: '0.2rem' }}>
            Henüz Basılmamış
          </div>
        </div>

        {/* Voucher Printed */}
        <div style={{
          padding: '1.2rem',
          borderRadius: '1rem',
          background: isLight ? '#ffffff' : '#0f172a',
          border: `1px solid ${isLight ? '#e2e8f0' : '#1e293b'}`,
          boxShadow: isLight ? '0 2px 10px rgba(0,0,0,0.02)' : 'none'
        }}>
          <div style={{ fontSize: '0.78rem', color: isLight ? '#64748b' : '#94a3b8', fontWeight: '800', textTransform: 'uppercase' }}>
            🖨️ Fişi & Etiketi Basılan
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '900', marginTop: '0.3rem', color: '#10b981' }}>
            {stats.printedVoucher}
          </div>
          <div style={{ fontSize: '0.72rem', color: isLight ? '#94a3b8' : '#64748b', marginTop: '0.2rem' }}>
            Baskı Emri Tamamlanan
          </div>
        </div>

        {/* Packed / Completed */}
        <div style={{
          padding: '1.2rem',
          borderRadius: '1rem',
          background: isLight ? '#ffffff' : '#0f172a',
          border: `1px solid ${isLight ? '#e2e8f0' : '#1e293b'}`,
          boxShadow: isLight ? '0 2px 10px rgba(0,0,0,0.02)' : 'none'
        }}>
          <div style={{ fontSize: '0.78rem', color: isLight ? '#64748b' : '#94a3b8', fontWeight: '800', textTransform: 'uppercase' }}>
            📦 Kolilenen / Hazır
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '900', marginTop: '0.3rem', color: '#8b5cf6' }}>
            {stats.packed}
          </div>
          <div style={{ fontSize: '0.72rem', color: isLight ? '#94a3b8' : '#64748b', marginTop: '0.2rem' }}>
            Koli Barkodu & Sevkiyat
          </div>
        </div>
      </div>

      {/* Status Filter Tabs & Action Toolbar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
        flexWrap: 'wrap',
        gap: '0.8rem'
      }}>
        {/* Left: Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: 'TÜM DANIŞMANLAR', count: stats.total, color: '#2563eb' },
            { id: 'PENDING', label: '⏳ FİŞ BEKLEYENLER', count: stats.pendingVoucher, color: '#d97706' },
            { id: 'PRINTED', label: '🖨️ FİŞİ BASILANLAR', count: stats.printedVoucher, color: '#10b981' },
            { id: 'PACKED', label: '📦 KOLİLENMİŞ / HAZIR', count: stats.packed, color: '#8b5cf6' }
          ].map(tab => {
            const isActive = selectedStatusTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedStatusTab(tab.id)}
                style={{
                  padding: '0.55rem 1.1rem',
                  borderRadius: '8px',
                  border: `1px solid ${isActive ? tab.color : (isLight ? '#cbd5e1' : '#334155')}`,
                  background: isActive ? tab.color : (isLight ? '#ffffff' : '#1e293b'),
                  color: isActive ? '#ffffff' : (isLight ? '#475569' : '#cbd5e1'),
                  fontWeight: '800',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: isActive ? `0 4px 12px ${tab.color}33` : 'none'
                }}
              >
                <span>{tab.label}</span>
                <span style={{
                  padding: '0.15rem 0.5rem',
                  borderRadius: '12px',
                  fontSize: '0.74rem',
                  background: isActive ? 'rgba(255,255,255,0.25)' : (isLight ? '#e2e8f0' : '#334155'),
                  color: isActive ? '#ffffff' : (isLight ? '#475569' : '#cbd5e1'),
                  fontWeight: '900'
                }}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: Multi-select Action Buttons & Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {selectedStaffIds.length > 0 && (
            <>
              <button
                onClick={() => {
                  const firstSelected = staffList.find(s => s.id === selectedStaffIds[0]);
                  if (firstSelected) setSelectedStaffForPrint(firstSelected);
                }}
                style={{
                  padding: '0.55rem 1.1rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  fontWeight: '800',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 3px 10px rgba(16,185,129,0.3)'
                }}
              >
                ⚡ Seçilen ({selectedStaffIds.length}) Kişinin Etiketini Bas
              </button>

              <button
                onClick={handleBulkMarkPrinted}
                disabled={isBulkProcessing}
                style={{
                  padding: '0.55rem 1rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#6366f1',
                  color: '#ffffff',
                  fontWeight: '800',
                  fontSize: '0.82rem',
                  cursor: isBulkProcessing ? 'wait' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                ✅ {isBulkProcessing ? 'İşleniyor...' : 'Toplu "BASILDI" Yap'}
              </button>

              <button
                onClick={() => setSelectedStaffIds([])}
                style={{
                  padding: '0.55rem 0.8rem',
                  borderRadius: '8px',
                  border: `1px solid ${isLight ? '#cbd5e1' : '#334155'}`,
                  background: 'transparent',
                  color: isLight ? '#64748b' : '#94a3b8',
                  fontWeight: '700',
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                🧹 Seçimi Bırak
              </button>
            </>
          )}

          {navigate && (
            <button
              onClick={() => navigate('/admin/personnel')}
              style={{
                padding: '0.55rem 1.1rem',
                borderRadius: '8px',
                border: '1.5px solid #3b82f6',
                background: isLight ? 'rgba(59,130,246,0.06)' : 'rgba(59,130,246,0.15)',
                color: isLight ? '#1d4ed8' : '#60a5fa',
                fontWeight: '800',
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
              title="Mini-Sorter 60 Göz Canlı Matrisine Git"
            >
              🏭 Mini-Sorter Sayfasına Git →
            </button>
          )}
        </div>
      </div>

      {/* Main Personnel Data Table */}
      <div style={{
        background: isLight ? '#ffffff' : '#0f172a',
        borderRadius: '8px',
        border: `1px solid ${isLight ? '#cbd5e1' : '#1e293b'}`,
        boxShadow: isLight ? '0 4px 20px rgba(0,0,0,0.05)' : '0 4px 20px rgba(0,0,0,0.4)',
        overflow: 'hidden'
      }}>
        {loading && staffList.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⌛</div>
            <div style={{ fontWeight: '700', fontSize: '1rem' }}>Volkswagen Danışman Listesi Yükleniyor...</div>
            <div style={{ fontSize: '0.82rem', marginTop: '0.4rem', color: '#94a3b8' }}>PostgreSQL veritabanından 442+ danışman getiriliyor...</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 220px)' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.82rem',
              fontFamily: 'Segoe UI, Arial, sans-serif',
              whiteSpace: 'nowrap'
            }}>
              <thead>
                <tr style={{
                  background: isLight ? '#e2e8f0' : '#1e293b',
                  color: isLight ? '#334155' : '#e2e8f0',
                  borderBottom: `2px solid ${isLight ? '#cbd5e1' : '#334155'}`,
                  position: 'sticky',
                  top: 0,
                  zIndex: 10
                }}>
                  <th style={{ padding: '0.75rem 0.8rem', width: '85px', textAlign: 'left', borderRight: `1px solid ${isLight ? '#cbd5e1' : '#334155'}` }}>
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
                  <th style={{ padding: '0.75rem 0.8rem', textAlign: 'center', width: '130px', borderRight: `1px solid ${isLight ? '#cbd5e1' : '#334155'}` }}>
                    İŞLEM ADIMI
                  </th>
                  <th style={{ padding: '0.75rem 0.8rem', textAlign: 'center', width: '150px', borderRight: `1px solid ${isLight ? '#cbd5e1' : '#334155'}` }}>
                    FİŞ & ETİKET DURUMU
                  </th>
                  <th style={{ padding: '0.75rem 0.8rem', textAlign: 'center', width: '160px', borderRight: `1px solid ${isLight ? '#cbd5e1' : '#334155'}` }}>
                    İŞLEM (ETİKET BAS)
                  </th>
                  <th style={{ padding: '0.75rem 0.8rem', textAlign: 'left', minWidth: '150px', borderRight: `1px solid ${isLight ? '#cbd5e1' : '#334155'}` }}>
                    MÜŞTERİ / BAYİ
                  </th>
                  <th style={{ padding: '0.75rem 0.8rem', textAlign: 'left', width: '120px', borderRight: `1px solid ${isLight ? '#cbd5e1' : '#334155'}` }}>
                    PARÇA NO
                  </th>
                  <th style={{ padding: '0.75rem 0.8rem', textAlign: 'left', minWidth: '220px', borderRight: `1px solid ${isLight ? '#cbd5e1' : '#334155'}` }}>
                    PERSONEL & MODEL
                  </th>
                  <th style={{ padding: '0.75rem 0.8rem', textAlign: 'center', width: '140px', borderRight: `1px solid ${isLight ? '#cbd5e1' : '#334155'}` }}>
                    SORTER GÖZÜ
                  </th>
                  <th style={{ padding: '0.75rem 0.8rem', textAlign: 'left', width: '130px' }}>
                    KOLİLEME
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                      Seçilen kriterlere uygun danışman bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((p, idx) => {
                    const isSelected = selectedStaffIds.includes(p.id);
                    const chuteCode = p.sorter_chute ? chToPhysicalMap[p.sorter_chute] || `CH-${p.sorter_chute}` : null;
                    const idShort = p.id ? String(p.id).replace(/-/g, '').substring(0, 6).toUpperCase() : `${idx + 1}`;
                    const partNo = p.part_no || `PVW-${idShort}`;
                    const lastStep = p.last_step || 'PLANLAMA';
                    const isVoucherPrinted = p.voucher_status === 'BASILDI';
                    const printCount = p.voucher_print_count || 0;

                    // Step badge styles
                    const stepColors = {
                      'PLANLAMA': { bg: 'rgba(100, 116, 139, 0.15)', text: '#64748b', border: '#cbd5e1' },
                      'KESİM': { bg: 'rgba(217, 119, 6, 0.15)', text: '#d97706', border: '#fcd34d' },
                      'DİKİM': { bg: 'rgba(139, 92, 246, 0.15)', text: '#8b5cf6', border: '#c4b5fd' },
                      'ÜTÜ PAKET': { bg: 'rgba(37, 99, 235, 0.15)', text: '#2563eb', border: '#93c5fd' },
                      'TAMAMLANDI': { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: '#6ee7b7' }
                    };
                    const currentStepStyle = stepColors[lastStep] || stepColors['PLANLAMA'];

                    const rowBg = isSelected
                      ? (isLight ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.15)')
                      : (idx % 2 === 0
                        ? (isLight ? '#ffffff' : '#0f172a')
                        : (isLight ? '#f8fafc' : '#1e293b'));

                    return (
                      <tr
                        key={p.id || idx}
                        style={{
                          background: rowBg,
                          borderBottom: `1px solid ${isLight ? '#e2e8f0' : '#1e293b'}`,
                          transition: 'background 0.15s ease'
                        }}
                      >
                        {/* 1. ID */}
                        <td style={{ padding: '0.6rem 0.8rem', borderRight: `1px solid ${isLight ? '#f1f5f9' : '#1e293b'}` }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleStaffSelect(p.id)}
                              style={{ cursor: 'pointer' }}
                            />
                            <span style={{
                              fontWeight: '800',
                              fontSize: '0.78rem',
                              fontFamily: 'monospace',
                              color: isLight ? '#1e293b' : '#f8fafc'
                            }}>
                              #{idShort}
                            </span>
                          </div>
                        </td>

                        {/* 2. İŞLEM ADIMI */}
                        <td style={{ padding: '0.6rem 0.8rem', textAlign: 'center', borderRight: `1px solid ${isLight ? '#f1f5f9' : '#1e293b'}` }}>
                          <select
                            value={lastStep}
                            onChange={(e) => handleUpdateStep(p.id, e.target.value)}
                            style={{
                              padding: '0.3rem 0.5rem',
                              borderRadius: '0.5rem',
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

                        {/* 3. FİŞ & ETİKET DURUMU */}
                        <td style={{ padding: '0.6rem 0.8rem', textAlign: 'center', borderRight: `1px solid ${isLight ? '#f1f5f9' : '#1e293b'}` }}>
                          {isVoucherPrinted ? (
                            <span style={{
                              padding: '0.25rem 0.6rem',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: '800',
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#10b981',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}>
                              🖨️ BASILDI {printCount > 1 ? `(${printCount}x)` : ''}
                            </span>
                          ) : (
                            <span style={{
                              padding: '0.25rem 0.6rem',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: '800',
                              background: 'rgba(217, 119, 6, 0.12)',
                              color: '#d97706',
                              border: '1px solid rgba(217, 119, 6, 0.3)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}>
                              📦 BEKLİYOR
                            </span>
                          )}
                        </td>

                        {/* 4. İŞLEM (🏷️ FİŞ & ETİKET BAS) */}
                        <td style={{ padding: '0.6rem 0.8rem', textAlign: 'center', borderRight: `1px solid ${isLight ? '#f1f5f9' : '#1e293b'}` }}>
                          <button
                            type="button"
                            onClick={() => setSelectedStaffForPrint(p)}
                            style={{
                              padding: '0.42rem 0.85rem',
                              borderRadius: '6px',
                              border: 'none',
                              background: isVoucherPrinted ? '#0284c7' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              color: '#ffffff',
                              fontSize: '0.78rem',
                              fontWeight: '800',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              whiteSpace: 'nowrap',
                              boxShadow: isVoucherPrinted ? '0 2px 8px rgba(2, 132, 199, 0.25)' : '0 2px 8px rgba(16, 185, 129, 0.35)',
                              transition: 'all 0.15s ease'
                            }}
                            title="A5 Sevk Fişi, SATO RFID Kıyafet Etiketleri ve Godex Koli Etiketini Aç & Yazdır"
                          >
                            <span>🏷️</span>
                            <span>{isVoucherPrinted ? 'ETİKETLER & FİŞ (TEKRAR)' : 'FİŞ & ETİKET BAS'}</span>
                          </button>
                        </td>

                        {/* 5. MÜŞTERİ / BAYİ */}
                        <td style={{ padding: '0.6rem 0.8rem', borderRight: `1px solid ${isLight ? '#f1f5f9' : '#1e293b'}` }}>
                          <div style={{ color: isLight ? '#0f172a' : '#f8fafc', fontWeight: '800', fontSize: '0.85rem' }}>
                            {p.service_center}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                            VOLKSWAGEN YETKİLİ SERVİS
                          </div>
                        </td>

                        {/* 6. PARÇA NO */}
                        <td style={{ padding: '0.6rem 0.8rem', borderRight: `1px solid ${isLight ? '#f1f5f9' : '#1e293b'}` }}>
                          <span style={{
                            fontFamily: 'monospace',
                            fontWeight: '800',
                            fontSize: '0.78rem',
                            padding: '0.2rem 0.45rem',
                            borderRadius: '0.4rem',
                            background: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.06)',
                            color: isLight ? '#334155' : '#cbd5e1'
                          }}>
                            {partNo}
                          </span>
                        </td>

                        {/* 7. PERSONEL & MODEL */}
                        <td style={{ padding: '0.6rem 0.8rem', borderRight: `1px solid ${isLight ? '#f1f5f9' : '#1e293b'}` }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '800', fontSize: '0.85rem' }}>
                            <span>{p.name}</span>
                            <span style={{
                              fontSize: '0.68rem',
                              padding: '0.1rem 0.35rem',
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

                        {/* 8. SORTER GÖZÜ */}
                        <td style={{ padding: '0.6rem 0.8rem', textAlign: 'center', borderRight: `1px solid ${isLight ? '#f1f5f9' : '#1e293b'}` }}>
                          {p.sorter_chute ? (() => {
                            const wStyle = getChuteWallStyle(p.sorter_chute);
                            return (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  padding: '0.25rem 0.6rem',
                                  borderRadius: '0.5rem',
                                  background: wStyle.bg50,
                                  border: `1.5px solid ${wStyle.border}`,
                                  color: '#ffffff',
                                  fontWeight: '900',
                                  fontSize: '0.75rem',
                                  boxShadow: wStyle.glow,
                                  textShadow: '0 1px 2px rgba(0,0,0,0.6)'
                                }}
                                title={`${wStyle.wallNum} (${wStyle.colorName} %50)`}
                              >
                                <span>🎯 GÖZ #{p.sorter_chute}</span>
                                <span style={{ fontSize: '0.68rem', opacity: 0.9 }}>({chuteCode})</span>
                              </span>
                            );
                          })() : (
                            <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Standby</span>
                          )}
                        </td>

                        {/* 9. KOLİLEME */}
                        <td style={{ padding: '0.6rem 0.8rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: '800', marginBottom: '0.25rem' }}>
                            <span>{p.current_packed} / {p.total_target}</span>
                            <span>%{p.progress_percent}</span>
                          </div>
                          <div style={{ width: '100%', height: '6px', background: isLight ? '#e2e8f0' : 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{
                              width: `${p.progress_percent}%`,
                              height: '100%',
                              background: p.progress_percent >= 100
                                ? '#10b981'
                                : p.progress_percent > 0
                                  ? '#3b82f6'
                                  : 'transparent',
                              borderRadius: '3px',
                              transition: 'width 0.4s ease'
                            }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Personnel Label & Receipt Modal */}
      {selectedStaffForPrint && (
        <PersonnelLabelAndReceiptModal
          person={selectedStaffForPrint}
          onClose={() => setSelectedStaffForPrint(null)}
          onPrinted={() => {
            fetchStaffList(true);
          }}
          isLight={isLight}
        />
      )}
    </div>
  );
};

export default PersonnelOrdersView;
