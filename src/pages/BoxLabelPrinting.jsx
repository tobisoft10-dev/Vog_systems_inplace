import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../services/apiConfig';
import { useLanguage } from '../context/LanguageContext';
import bwipjs from '@bwip-js/browser';
import ProductSearchSelect from '../components/ProductSearchSelect';

const QRCodeGenerator = ({ value }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current && value) {
      try {
        bwipjs.toCanvas(canvasRef.current, {
          bcid: 'qrcode',
          text: value,
          scale: 4,
          height: 30,
          width: 30,
          includetext: false,
        });
      } catch (err) {
        console.error('Error rendering QRCode:', err);
      }
    }
  }, [value]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fff', padding: '1mm', borderRadius: '4px', border: '1px solid #ddd' }}>
      <canvas ref={canvasRef} style={{ width: '28mm', height: '28mm', display: 'block' }} />
    </div>
  );
};

const BoxLabelPrinting = () => {
  const navigate = useNavigate();
  const { themeMode } = useLanguage();
  const isLight = themeMode === 'light';
  
  const [activeTab, setActiveTab] = useState('personnel');
  const [selectedBrand, setSelectedBrand] = useState('SEAT');
  
  const [staffGroups, setStaffGroups] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  
  const [ordersData, setOrdersData] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  const [masterProducts, setMasterProducts] = useState([]);
  const [manualList, setManualList] = useState([]);
  
  const [manualLabelType, setManualLabelType] = useState('order'); // 'order' or 'personnel'
  const [manualStaffName, setManualStaffName] = useState('');
  const [manualRole, setManualRole] = useState('');
  const [manualDealer, setManualDealer] = useState('');
  const [manualOrderId, setManualOrderId] = useState('');
  
  const [selectedItems, setSelectedItems] = useState([]);
  const [labelsToPrint, setLabelsToPrint] = useState([]);
  const [activeCell, setActiveCell] = useState({ rowIndex: null, colIndex: null, value: '' });
  const [showFormulaHelp, setShowFormulaHelp] = useState(false);
  const [createLogoDespatch, setCreateLogoDespatch] = useState(true);
  const [logoSyncStatus, setLogoSyncStatus] = useState(null);
  const [isSyncingLogo, setIsSyncingLogo] = useState(false);
  const colLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/orders/staff-by-role?brand=${selectedBrand}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStaffGroups(data.data);
          if (data.data.length > 0) setSelectedRole(data.data[0].role);
        }
      });
      
    fetch(`${API_BASE_URL}/api/orders/list?brand=${selectedBrand}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const grouped = data.data.reduce((acc, curr) => {
            const key = curr.sub_customer_name || curr.order_number;
            if (!acc[key]) acc[key] = [];
            acc[key].push(curr);
            return acc;
          }, {});
          
          const groups = Object.keys(grouped).map(k => ({
            name: k,
            items: grouped[k]
          }));
          setOrdersData(groups);
          if (groups.length > 0) setSelectedOrder(groups[0].name);
        }
      });

    fetch(`${API_BASE_URL}/api/master-products`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMasterProducts(data.data.filter(p => p.brand === selectedBrand));
        }
      });
  }, [selectedBrand]);

  const handleSelectStaff = (staff) => {
    const isSelected = selectedItems.find(s => s.id === staff.id);
    if (isSelected) {
      setSelectedItems(selectedItems.filter(s => s.id !== staff.id));
    } else {
      setSelectedItems([...selectedItems, { ...staff, role: selectedRole }]);
    }
  };

  const handleSelectOrder = (orderGroup) => {
      const isSelected = selectedItems.find(s => s.name === orderGroup.name);
      if(isSelected) {
          setSelectedItems(selectedItems.filter(s => s.name !== orderGroup.name));
      } else {
          setSelectedItems([...selectedItems, orderGroup]);
      }
  }

  const addManualItem = () => {
    setManualList([...manualList, { id: Date.now(), productName: '', size: '', quantity: 1, sku: '', barcode: '' }]);
  };

  const updateManualItem = (id, field, value) => {
    setManualList(manualList.map(item => {
      if (item.id === id) {
        let updated = { ...item, [field]: value };
        if (field === 'productName') {
            const sizeQuery = updated.size ? updated.size.trim().toUpperCase() : '';
            let prod = null;
            if (sizeQuery) {
                prod = masterProducts.find(p => p.product_name === value && p.size === sizeQuery);
            }
            if (!prod) {
                prod = masterProducts.find(p => p.product_name === value);
            }
            if (prod) {
                updated.sku = prod.sku || '';
                updated.barcode = prod.barcode || '';
                if (!updated.size) updated.size = prod.size || '';
            }
        } else if (field === 'size') {
            const sizeQuery = value ? value.trim().toUpperCase() : '';
            const prod = masterProducts.find(p => p.product_name === item.productName && p.size === sizeQuery);
            if (prod) {
                updated.sku = prod.sku || '';
                updated.barcode = prod.barcode || '';
            }
        }
        return updated;
      }
      return item;
    }));
  };

  const removeManualItem = (id) => {
      setManualList(manualList.filter(item => item.id !== id));
  }

  const generateLabels = async () => {
    let generated = [];
    const orderIdsToSync = new Set();
    let itemsToSync = [];

    if (activeTab === 'personnel') {
      selectedItems.forEach(staff => {
         if (staff.orderNumber) orderIdsToSync.add(staff.orderNumber);
         generated.push({
             type: 'KİŞİ BAZLI SEVKİYAT (INDIVIDUAL ORDER)',
             dealer: staff.dealer,
             staffName: staff.staffName,
             role: staff.role,
             orderId: staff.orderNumber,
             items: staff.items,
             barcode: `BOX-${selectedBrand}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${staff.orderNumber || Math.floor(1000 + Math.random() * 9000)}`,
             brand: selectedBrand
         });
      });
    } else if (activeTab === 'order') {
       selectedItems.forEach(group => {
           const orderNum = group.items && group.items[0] ? group.items[0].order_number : '';
           if (orderNum) orderIdsToSync.add(orderNum);
           generated.push({
               type: 'SİPARİŞ BAZLI SEVKİYAT (BULK ORDER)',
               dealer: group.name,
               staffName: '-',
               role: '-',
               orderId: orderNum,
               items: group.items,
               barcode: `BOX-${selectedBrand}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-BULK`,
               brand: selectedBrand
           });
       });
    } else if (activeTab === 'manual') {
        const formattedItems = manualList.filter(i => i.productName).map(i => ({
            quantity: i.quantity,
            product_name: i.productName,
            sku: i.sku,
            size: i.size
        }));
        itemsToSync = formattedItems;
        if (manualOrderId) orderIdsToSync.add(manualOrderId);

        if(formattedItems.length > 0) {
            const isPersonnel = manualLabelType === 'personnel';
            generated.push({
                type: isPersonnel ? 'KİŞİ BAZLI SEVKİYAT (INDIVIDUAL ORDER)' : 'SİPARİŞ BAZLI SEVKİYAT (BULK ORDER)',
                dealer: manualDealer || `${selectedBrand} ÖZEL SİPARİŞ`,
                staffName: isPersonnel ? (manualStaffName || 'Bilinmeyen Personel') : '-',
                role: isPersonnel ? (manualRole || 'Personel') : '-',
                orderId: manualOrderId || '',
                items: formattedItems,
                barcode: `BOX-MANUAL-${Math.floor(100000 + Math.random() * 900000)}`,
                brand: selectedBrand
            });
        }
    }
    setLabelsToPrint(generated);

    // LEM Paketi Özellikleriyle LOGO Tiger ERP İrsaliye Kaydı
    if (createLogoDespatch && (orderIdsToSync.size > 0 || itemsToSync.length > 0)) {
        setIsSyncingLogo(true);
        setLogoSyncStatus({ type: 'info', text: '💼 LOGO Tiger ERP LEM İrsaliyesi kaydediliyor...' });
        try {
            const res = await fetch(`${API_BASE_URL}/api/logo/sync-box-dispatch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    order_ids: Array.from(orderIdsToSync),
                    items: itemsToSync,
                    create_logo_despatch: true
                })
            });
            const json = await res.json();
            if (json.success) {
                setLogoSyncStatus({
                    type: 'success',
                    text: `✅ ${json.message || 'LOGO Satış İrsaliyesi başarıyla oluşturuldu! (Açık ve düzenlenebilir taslak)'}`
                });
            } else {
                setLogoSyncStatus({
                    type: 'warning',
                    text: `⚠️ LOGO Uyarısı: ${json.error || json.message || 'İrsaliye aktarımı tamamlanamadı.'}`
                });
            }
        } catch (err) {
            setLogoSyncStatus({ type: 'warning', text: `⚠️ LOGO Bağlantı Uyarısı: ${err.message}` });
        } finally {
            setIsSyncingLogo(false);
            setTimeout(() => setLogoSyncStatus(null), 8000);
        }
    }
  };

  const printLabels = () => {
    window.print();
  };

  const activeStaffGroup = staffGroups.find(g => g.role === selectedRole);
  const activeOrderGroup = ordersData.find(g => g.name === selectedOrder);



  const glassBg = isLight ? 'rgba(15, 23, 42, 0.02)' : 'rgba(255, 255, 255, 0.02)';
  const glassBorder = isLight ? 'rgba(15, 23, 42, 0.05)' : 'rgba(255, 255, 255, 0.05)';

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

  const handleSelectAllStaff = () => {
    if (!activeStaffGroup) return;
    const allSelected = activeStaffGroup.staff.every(s => selectedItems.some(st => st.id === s.id));
    if (allSelected) {
      setSelectedItems(selectedItems.filter(st => !activeStaffGroup.staff.some(s => s.id === st.id)));
    } else {
      const toAdd = activeStaffGroup.staff.filter(s => !selectedItems.some(st => st.id === s.id))
        .map(s => ({ ...s, role: selectedRole }));
      setSelectedItems([...selectedItems, ...toAdd]);
    }
  };

  const renderMainContent = () => {
    let fileName = '';
    if (activeTab === 'personnel') {
      fileName = `${selectedBrand}_2026_Yaz_Personel_Koli_Etiketleri.xlsx`;
    } else if (activeTab === 'order') {
      fileName = `${selectedBrand}_2026_Yaz_Siparis_Koli_Etiketleri.xlsx`;
    } else {
      fileName = 'Manuel_Koli_Urun_Listesi.xlsx';
    }

    let currentHeaders = [];
    let currentRowsCount = 0;
    
    if (activeTab === 'personnel') {
      currentHeaders = ['SEÇ', 'PERSONEL ADI', 'BAYİ / ALICI', 'BEDEN', 'ADET', 'SİPARİŞ NO'];
      currentRowsCount = activeStaffGroup?.staff.length || 0;
    } else if (activeTab === 'order') {
      currentHeaders = ['ÜRÜN ADI', 'BEDEN', 'ADET', 'SKU'];
      currentRowsCount = activeOrderGroup?.items.length || 0;
    } else {
      currentHeaders = ['ÜRÜN SEÇ', 'BEDEN', 'SKU / BARKOD', 'ADET', 'İŞLEM'];
      currentRowsCount = manualList.length;
    }

    const colCount = currentHeaders.length;

    return (
      <div className="glass-card" style={{ 
        flex: 1,
        padding: 0, 
        borderRadius: '32px', 
        background: isLight ? '#ffffff' : '#0d1117', 
        border: `1px solid ${glassBorder}`, 
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Excel Ribbon Action Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: isLight ? '#ffffff' : '#0d1117',
          borderBottom: `1px solid ${isLight ? '#e1dfdd' : '#334155'}`,
          padding: '0.6rem 0.8rem',
          fontSize: '0.85rem'
        }}>
          {/* Logo İrsaliyesi Checkbox & Action Buttons inside Ribbon Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginLeft: 'auto', flexWrap: 'wrap' }}>
            <label style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: '700',
              color: createLogoDespatch ? '#38bdf8' : 'var(--text-secondary)',
              background: createLogoDespatch ? (isLight ? '#e0f2fe' : 'rgba(56, 189, 248, 0.12)') : 'transparent',
              padding: '0.35rem 0.65rem',
              borderRadius: '6px',
              border: `1px solid ${createLogoDespatch ? '#38bdf8' : (isLight ? '#cbd5e1' : '#334155')}`,
              transition: 'all 0.2s ease',
              userSelect: 'none'
            }}
            title="LEM paketi özellikleriyle LOGO Tiger ERP'ye açık satış irsaliyesi kaydeder; Logo kullanıcıları ihtiyaç halinde düzenleyebilir."
            >
              <input
                type="checkbox"
                checked={createLogoDespatch}
                onChange={(e) => setCreateLogoDespatch(e.target.checked)}
                style={{ cursor: 'pointer', width: '15px', height: '15px', accentColor: '#38bdf8' }}
              />
              <span>📄 Logo İrsaliyesi Oluştur</span>
              <span style={{ fontSize: '0.62rem', background: '#E5A93C', color: '#000', padding: '1px 5px', borderRadius: '4px', fontWeight: '900' }}>LEM</span>
            </label>

            {activeTab === 'personnel' && (
              <button 
                onClick={generateLabels} 
                disabled={selectedItems.length === 0 || isSyncingLogo} 
                className="label-action-btn"
                style={{ 
                  background: selectedItems.length > 0 ? 'linear-gradient(135deg, #10b981, #059669)' : (isLight ? '#e2e8f0' : '#1e293b'), 
                  color: selectedItems.length > 0 ? '#fff' : 'var(--text-secondary)', 
                  border: 'none', 
                  padding: '0.4rem 1rem', 
                  borderRadius: '6px', 
                  cursor: (selectedItems.length > 0 && !isSyncingLogo) ? 'pointer' : 'not-allowed', 
                  fontWeight: 'bold',
                  fontSize: '0.75rem',
                  boxShadow: selectedItems.length > 0 ? '0 2px 6px rgba(16, 185, 129, 0.25)' : 'none'
                }}
              >
                {isSyncingLogo ? 'İRSALİYE KAYDEDİLİYOR...' : `${selectedItems.length} SATIR İÇİN KOLİ ETİKETİ OLUŞTUR`}
              </button>
            )}
            
            {activeTab === 'order' && (
              <>
                <button 
                  onClick={() => handleSelectOrder(activeOrderGroup)} 
                  style={{ 
                    background: 'transparent', 
                    color: 'var(--text-primary)', 
                    border: `1px solid ${isLight ? '#cbd5e1' : '#475569'}`, 
                    padding: '0.4rem 1rem', 
                    borderRadius: '6px', 
                    cursor: 'pointer', 
                    fontWeight: 'bold', 
                    fontSize: '0.75rem' 
                  }}
                >
                  {selectedItems.some(s => s.name === activeOrderGroup?.name) ? 'BU SİPARİŞİ KALDIR' : 'BU SİPARİŞİ SEÇ'}
                </button>
                <button 
                  onClick={generateLabels} 
                  disabled={selectedItems.length === 0 || isSyncingLogo} 
                  className="label-action-btn"
                  style={{ 
                    background: selectedItems.length > 0 ? 'linear-gradient(135deg, #f59e0b, #d97706)' : (isLight ? '#e2e8f0' : '#1e293b'), 
                    color: selectedItems.length > 0 ? '#fff' : 'var(--text-secondary)', 
                    border: 'none', 
                    padding: '0.4rem 1rem', 
                    borderRadius: '6px', 
                    cursor: (selectedItems.length > 0 && !isSyncingLogo) ? 'pointer' : 'not-allowed', 
                    fontWeight: 'bold',
                    fontSize: '0.75rem',
                    boxShadow: selectedItems.length > 0 ? '0 2px 6px rgba(245, 158, 11, 0.25)' : 'none'
                  }}
                >
                  {isSyncingLogo ? 'İRSALİYE KAYDEDİLİYOR...' : 'SEÇİLİ SİPARİŞLER İÇİN KOLİ ETİKETİ OLUŞTUR'}
                </button>
              </>
            )}

            {activeTab === 'manual' && (
              <>
                <button 
                  onClick={addManualItem} 
                  style={{ 
                    background: 'transparent', 
                    color: 'var(--text-primary)', 
                    border: `1px solid ${isLight ? '#cbd5e1' : '#475569'}`, 
                    padding: '0.4rem 1rem', 
                    borderRadius: '6px', 
                    cursor: 'pointer', 
                    fontWeight: 'bold', 
                    fontSize: '0.75rem' 
                  }}
                >
                  + SATIR EKLE
                </button>
                <button 
                  onClick={generateLabels} 
                  disabled={manualList.length === 0 || isSyncingLogo} 
                  className="label-action-btn"
                  style={{ 
                    background: manualList.length > 0 ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : (isLight ? '#e2e8f0' : '#1e293b'), 
                    color: manualList.length > 0 ? '#fff' : 'var(--text-secondary)', 
                    border: 'none', 
                    padding: '0.4rem 1rem', 
                    borderRadius: '6px', 
                    cursor: (manualList.length > 0 && !isSyncingLogo) ? 'pointer' : 'not-allowed', 
                    fontWeight: 'bold',
                    fontSize: '0.75rem',
                    boxShadow: manualList.length > 0 ? '0 2px 6px rgba(59, 130, 246, 0.25)' : 'none'
                  }}
                >
                  {isSyncingLogo ? 'İRSALİYE KAYDEDİLİYOR...' : 'KOLİ ETİKETİ OLUŞTUR'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Manual Tab Metadata Settings inside Excel workbook view if active */}
        {activeTab === 'manual' && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1rem', 
            background: isLight ? '#f3f2f1' : '#161b22', 
            padding: '1rem', 
            borderBottom: `1px solid ${isLight ? '#cbd5e1' : '#475569'}`
          }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: '800', marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>KOLİ TÜRÜ</label>
              <select
                value={manualLabelType}
                onChange={(e) => setManualLabelType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.4rem',
                  background: isLight ? '#fff' : '#070a13',
                  color: 'var(--text-primary)',
                  border: `1.5px solid ${isLight ? '#cbd5e1' : '#475569'}`,
                  borderRadius: '6px',
                  outline: 'none',
                  fontSize: '0.8rem',
                  fontWeight: '600'
                }}
              >
                <option value="order">Sipariş Bazlı (Toplu)</option>
                <option value="personnel">Personel Bazlı (Kişisel)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: '800', marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>ALICI / BAYİ</label>
              <input
                type="text"
                placeholder={`${selectedBrand} ÖZEL SİPARİŞ`}
                value={manualDealer}
                onChange={(e) => setManualDealer(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.4rem',
                  background: isLight ? '#fff' : '#070a13',
                  color: 'var(--text-primary)',
                  border: `1.5px solid ${isLight ? '#cbd5e1' : '#475569'}`,
                  borderRadius: '6px',
                  outline: 'none',
                  fontSize: '0.8rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: '800', marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>SİPARİŞ NO</label>
              <input
                type="text"
                placeholder="Örn: 2026-001"
                value={manualOrderId}
                onChange={(e) => setManualOrderId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.4rem',
                  background: isLight ? '#fff' : '#070a13',
                  color: 'var(--text-primary)',
                  border: `1.5px solid ${isLight ? '#cbd5e1' : '#475569'}`,
                  borderRadius: '6px',
                  outline: 'none',
                  fontSize: '0.8rem'
                }}
              />
            </div>

            {manualLabelType === 'personnel' && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: '800', marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>PERSONEL ADI</label>
                  <input
                    type="text"
                    placeholder="Örn: Ahmet Yılmaz"
                    value={manualStaffName}
                    onChange={(e) => setManualStaffName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.4rem',
                      background: isLight ? '#fff' : '#070a13',
                      color: 'var(--text-primary)',
                      border: `1.5px solid ${isLight ? '#cbd5e1' : '#475569'}`,
                      borderRadius: '6px',
                      outline: 'none',
                      fontSize: '0.8rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: '800', marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>GÖREVİ</label>
                  <input
                    type="text"
                    placeholder="Örn: Formen"
                    value={manualRole}
                    onChange={(e) => setManualRole(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.4rem',
                      background: isLight ? '#fff' : '#070a13',
                      color: 'var(--text-primary)',
                      border: `1.5px solid ${isLight ? '#cbd5e1' : '#475569'}`,
                      borderRadius: '6px',
                      outline: 'none',
                      fontSize: '0.8rem'
                    }}
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* Main Grid Wrapper */}
        <div className="excel-grid-wrapper" style={{ background: isLight ? '#ffffff' : '#0d1117' }}>
          <table style={{ width: '100%', minWidth: activeTab === 'personnel' ? '1000px' : '900px', borderCollapse: 'collapse', color: 'var(--text-primary)' }}>
            <thead>
              {/* Excel Column Letters Row */}
              <tr style={{ background: isLight ? '#f3f2f1' : '#161b22' }}>
                <th style={{ width: '45px', border: `1px solid ${isLight ? '#e1dfdd' : '#334155'}`, padding: '0.3rem', fontSize: '0.7rem', color: '#605e5c', textAlign: 'center', fontWeight: 'normal', userSelect: 'none' }}></th>
                {colLetters.slice(0, colCount).map((letter) => (
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
                {currentHeaders.map((hdr, idx) => (
                  <th 
                    key={idx} 
                    style={{ 
                      border: `1px solid ${isLight ? '#e1dfdd' : '#334155'}`, 
                      textAlign: (hdr === 'SEÇ' || hdr === 'BEDEN' || hdr === 'ADET' || hdr === 'İŞLEM') ? 'center' : 'left',  
                      padding: '0.6rem 0.8rem', 
                      color: 'var(--text-secondary)', 
                      fontSize: '0.75rem', 
                      fontWeight: '800' 
                    }}
                  >
                    {hdr === 'SEÇ' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '800' }}>SEÇ</span>
                        <input 
                          type="checkbox"
                          checked={activeStaffGroup ? activeStaffGroup.staff.length > 0 && activeStaffGroup.staff.every(s => selectedItems.some(st => st.id === s.id)) : false}
                          onChange={handleSelectAllStaff}
                          onClick={(e) => e.stopPropagation()}
                          style={{ cursor: 'pointer', width: '15px', height: '15px' }}
                          title="Tümünü Seç / Kaldır"
                        />
                      </div>
                    ) : hdr}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* PERSONNEL TAB ROWS */}
              {activeTab === 'personnel' && activeStaffGroup?.staff.map((s, idx) => {
                const isSelected = selectedItems.some(st => st.id === s.id);
                return (
                  <tr key={idx} style={{ borderBottom: `1px solid ${isLight ? '#e1dfdd' : '#334155'}` }}>
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
                    
                    <td 
                      onClick={() => setActiveCell({ rowIndex: idx, colIndex: 0, value: isSelected ? 'SEÇİLİ' : 'BOŞ' })}
                      style={{ ...getCellStyles(idx, 0), textAlign: 'center' }}
                    >
                      <input 
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectStaff(s)}
                        onClick={(e) => e.stopPropagation()}
                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                      />
                    </td>

                    <td 
                      onClick={() => setActiveCell({ rowIndex: idx, colIndex: 1, value: s.staffName || '' })}
                      style={getCellStyles(idx, 1)}
                    >
                      <span style={{ fontWeight: 'bold' }}>{s.staffName}</span>
                    </td>

                    <td 
                      onClick={() => setActiveCell({ rowIndex: idx, colIndex: 2, value: s.dealer || '' })}
                      style={getCellStyles(idx, 2)}
                    >
                      {s.dealer}
                    </td>

                    <td 
                      onClick={() => {
                        const displaySizes = [s.topSize, s.bottomSize].filter(size => size && size !== '-').join(' / ') || '-';
                        setActiveCell({ rowIndex: idx, colIndex: 3, value: displaySizes });
                      }}
                      style={{ ...getCellStyles(idx, 3), textAlign: 'center', fontWeight: 'bold' }}
                    >
                      {[s.topSize, s.bottomSize].filter(size => size && size !== '-').join(' / ') || '-'}
                    </td>

                    <td 
                      onClick={() => {
                        const totalQty = s.items ? s.items.reduce((sum, item) => sum + (item.quantity || 0), 0) : 0;
                        setActiveCell({ rowIndex: idx, colIndex: 4, value: String(totalQty) });
                      }}
                      style={{ ...getCellStyles(idx, 4), textAlign: 'center', fontWeight: 'bold' }}
                    >
                      {s.items ? s.items.reduce((sum, item) => sum + (item.quantity || 0), 0) : 0}
                    </td>

                    <td 
                      onClick={() => setActiveCell({ rowIndex: idx, colIndex: 5, value: s.orderNumber ? `#${s.orderNumber}` : '' })}
                      style={getCellStyles(idx, 5)}
                    >
                      {s.orderNumber ? `#${s.orderNumber}` : '-'}
                    </td>
                  </tr>
                );
              })}

              {/* ORDER TAB ROWS */}
              {activeTab === 'order' && activeOrderGroup?.items.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: `1px solid ${isLight ? '#e1dfdd' : '#334155'}` }}>
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
                  
                  <td 
                    onClick={() => setActiveCell({ rowIndex: idx, colIndex: 0, value: item.product_name || '' })}
                    style={getCellStyles(idx, 0)}
                  >
                    {item.product_name}
                  </td>

                  <td 
                    onClick={() => setActiveCell({ rowIndex: idx, colIndex: 1, value: item.size || '-' })}
                    style={{ ...getCellStyles(idx, 1), textAlign: 'center' }}
                  >
                    {item.size || '-'}
                  </td>

                  <td 
                    onClick={() => setActiveCell({ rowIndex: idx, colIndex: 2, value: String(item.quantity || 0) })}
                    style={{ ...getCellStyles(idx, 2), textAlign: 'center' }}
                  >
                    {item.quantity}
                  </td>

                  <td 
                    onClick={() => setActiveCell({ rowIndex: idx, colIndex: 3, value: item.sku || '' })}
                    style={getCellStyles(idx, 3)}
                  >
                    {item.sku}
                  </td>
                </tr>
              ))}

              {/* MANUAL TAB ROWS */}
              {activeTab === 'manual' && manualList.map((item, idx) => (
                <tr key={item.id} style={{ borderBottom: `1px solid ${isLight ? '#e1dfdd' : '#334155'}` }}>
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

                  <td 
                    onClick={() => setActiveCell({ rowIndex: idx, colIndex: 0, value: item.productName || '' })}
                    style={getCellStyles(idx, 0)}
                  >
                    <div onClick={(e) => e.stopPropagation()}>
                      <ProductSearchSelect 
                        value={item.productName}
                        onChange={(val) => updateManualItem(item.id, 'productName', val)}
                        masterProducts={masterProducts}
                        isLight={isLight}
                      />
                    </div>
                  </td>

                  <td 
                    onClick={() => setActiveCell({ rowIndex: idx, colIndex: 1, value: item.size || '' })}
                    style={{ ...getCellStyles(idx, 1), textAlign: 'center' }}
                  >
                    <input 
                      type="text" 
                      value={item.size} 
                      onChange={(e) => updateManualItem(item.id, 'size', e.target.value)} 
                      onClick={(e) => e.stopPropagation()}
                      style={{ 
                        width: '75px', 
                        padding: '0.3rem', 
                        textAlign: 'center',
                        background: isLight ? '#fff' : '#111', 
                        color: 'var(--text-primary)',
                        border: `1px solid ${isLight ? '#ccc' : '#333'}`,
                        borderRadius: '4px',
                        outline: 'none',
                        fontSize: '0.8rem',
                        fontWeight: 'bold'
                      }} 
                    />
                  </td>

                  <td 
                    onClick={() => setActiveCell({ rowIndex: idx, colIndex: 2, value: `SKU: ${item.sku}, BAR: ${item.barcode}` })}
                    style={getCellStyles(idx, 2)}
                  >
                    <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <span style={{ position: 'absolute', left: '6px', fontSize: '0.6rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>SKU</span>
                        <input 
                          type="text" 
                          value={item.sku} 
                          onChange={(e) => updateManualItem(item.id, 'sku', e.target.value)} 
                          placeholder="SKU" 
                          style={{ 
                            width: '100%', 
                            padding: '0.25rem 0.25rem 0.25rem 2rem', 
                            background: isLight ? '#fff' : '#111', 
                            color: 'var(--text-primary)',
                            border: `1px solid ${isLight ? '#ccc' : '#333'}`,
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            outline: 'none'
                          }} 
                        />
                      </div>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <span style={{ position: 'absolute', left: '6px', fontSize: '0.6rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>BAR</span>
                        <input 
                          type="text" 
                          value={item.barcode} 
                          onChange={(e) => updateManualItem(item.id, 'barcode', e.target.value)} 
                          placeholder="Barkod" 
                          style={{ 
                            width: '100%', 
                            padding: '0.25rem 0.25rem 0.25rem 2rem', 
                            background: isLight ? '#fff' : '#111', 
                            color: 'var(--text-primary)',
                            border: `1px solid ${isLight ? '#ccc' : '#333'}`,
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            outline: 'none'
                          }} 
                        />
                      </div>
                    </div>
                  </td>

                  <td 
                    onClick={() => setActiveCell({ rowIndex: idx, colIndex: 3, value: String(item.quantity) })}
                    style={{ ...getCellStyles(idx, 3), textAlign: 'center' }}
                  >
                    <input 
                      type="number" 
                      min="1" 
                      value={item.quantity} 
                      onChange={(e) => updateManualItem(item.id, 'quantity', parseInt(e.target.value) || 1)} 
                      onClick={(e) => e.stopPropagation()}
                      style={{ 
                        width: '65px', 
                        padding: '0.3rem', 
                        textAlign: 'center',
                        background: isLight ? '#fff' : '#111', 
                        color: 'var(--text-primary)',
                        border: `1px solid ${isLight ? '#ccc' : '#333'}`,
                        borderRadius: '4px',
                        outline: 'none',
                        fontSize: '0.8rem',
                        fontWeight: 'bold'
                      }} 
                    />
                  </td>

                  <td 
                    onClick={() => setActiveCell({ rowIndex: idx, colIndex: 4, value: 'İŞLEM' })}
                    style={{ ...getCellStyles(idx, 4), textAlign: 'center' }}
                  >
                    <button 
                      onClick={() => removeManualItem(item.id)} 
                      onClickCapture={(e) => e.stopPropagation()}
                      style={{ 
                        background: 'transparent', 
                        border: 'none', 
                        color: '#ef4444', 
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase'
                      }}
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
              {currentRowsCount === 0 && (
                <tr>
                  <td colSpan={colCount + 1} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    Seçilen sheet içerisinde görüntülenecek veri bulunmamaktadır.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Excel Bottom Tab Sheet Container */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          background: isLight ? '#f3f2f1' : '#161b22', 
          borderTop: `1px solid ${isLight ? '#cbd5e1' : '#475569'}`,
          padding: '0.3rem 0.5rem',
          flexWrap: 'nowrap',
          userSelect: 'none'
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 8px', color: '#605e5c', borderRight: `1px solid ${isLight ? '#cbd5e1' : '#475569'}`, marginRight: '8px' }}>
              <span style={{ cursor: 'pointer', fontSize: '0.7rem' }}>◀</span>
              <span style={{ cursor: 'pointer', fontSize: '0.7rem' }}>▶</span>
            </div>
            
            {activeTab === 'personnel' && staffGroups.map((group) => {
              const isActive = selectedRole === group.role;
              return (
                <div 
                  key={group.role}
                  onClick={() => { setSelectedRole(group.role); setSelectedItems([]); }}
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
                  {group.role} ({group.staff.length})
                </div>
              );
            })}

            {activeTab === 'order' && ordersData.map((group) => {
              const isActive = selectedOrder === group.name;
              return (
                <div 
                  key={group.name}
                  onClick={() => { setSelectedOrder(group.name); setSelectedItems([]); }}
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
                  {group.name} ({group.items.length})
                </div>
              );
            })}

            {activeTab === 'manual' && (
              <div 
                style={{
                  padding: '0.4rem 1.2rem',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  backgroundColor: isLight ? '#ffffff' : '#0d1117',
                  color: '#107c41',
                  borderTopLeftRadius: '4px',
                  borderTopRightRadius: '4px',
                  border: `1px solid ${isLight ? '#cbd5e1' : '#475569'}`,
                  borderBottom: `1px solid ${isLight ? '#ffffff' : '#0d1117'}`,
                  marginTop: '2px',
                  marginBottom: '-5px',
                  position: 'relative',
                  zIndex: 2,
                  whiteSpace: 'nowrap'
                }}
              >
                Manuel Liste ({manualList.length})
              </div>
            )}
          </div>
          
          <div style={{ 
            fontSize: '0.7rem', 
            color: '#605e5c', 
            fontWeight: '600', 
            paddingLeft: '1rem',
            paddingRight: '1rem',
            flexShrink: 0,
            whiteSpace: 'nowrap'
          }}>
            HAZIR | Toplam Satır: {currentRowsCount} | Seçilen: {activeCell.rowIndex !== null ? `1` : `0`}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="label-printing-page" style={{ padding: '2rem', minHeight: '100vh', background: isLight ? '#f8f9fa' : '#05070a' }}>
      
      <div className="no-print">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <button onClick={() => navigate('/admin')} style={{ background: 'transparent', border: `1px solid ${isLight ? '#ccc' : '#333'}`, color: 'var(--text-primary)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', marginBottom: '1rem' }}>
              ← GERİ DÖN
            </button>
            <h1 style={{ color: 'var(--text-primary)', fontSize: '2rem', fontWeight: '800' }}>Koli Etiket Basımı</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Birden fazla ürünü içeren koli etiketlerini oluşturun.</p>
              <select 
                  value={selectedBrand} 
                  onChange={(e) => { setSelectedBrand(e.target.value); setSelectedRole(null); setSelectedItems([]); }}
                  style={{ 
                    padding: '0.3rem 1rem', 
                    borderRadius: '8px', 
                    background: isLight ? '#ffffff' : '#161b22', 
                    color: 'var(--text-primary)', 
                    border: `1px solid ${isLight ? '#cbd5e1' : '#475569'}`, 
                    cursor: 'pointer', 
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    outline: 'none',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                  }}
              >
                  <option value="SEAT">SEAT</option>
                  <option value="AUDI">AUDI</option>
                  <option value="FORD">FORD</option>
                  <option value="ZARA">ZARA</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <a
              href={`${API_BASE_URL}/vog-terminal.apk`}
              download="vog-terminal.apk"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                color: '#fff',
                textDecoration: 'none',
                padding: '0.6rem 1.1rem',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: '700',
                boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)',
                transition: 'all 0.2s ease'
              }}
              title="El Terminali Android APK Uygulamasını İndirin (v1.5.2 - Personel Kolileme & Godex Dikey Etiket)"
            >
              <span>📲 El Terminali APK</span>
              <span style={{ fontSize: '0.7rem', background: '#10b981', color: '#000', padding: '1px 6px', borderRadius: '4px', fontWeight: '900' }}>v1.5.2</span>
            </a>
            {labelsToPrint.length > 0 && (
              <button onClick={printLabels} style={{ background: '#E60000', color: 'white', border: 'none', padding: '1rem 2rem', borderRadius: '12px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(230,0,0,0.3)' }}>
                YAZDIR (PRINT)
              </button>
            )}
          </div>
        </div>

        {/* LOGO ERP Sync Notification Banner */}
        {logoSyncStatus && (
          <div style={{
            marginBottom: '1.5rem',
            padding: '0.9rem 1.2rem',
            borderRadius: '10px',
            backgroundColor: logoSyncStatus.type === 'success' ? (isLight ? '#ecfdf5' : '#064e3b') : (logoSyncStatus.type === 'warning' ? (isLight ? '#fffbeb' : '#78350f') : (isLight ? '#eff6ff' : '#1e293b')),
            color: logoSyncStatus.type === 'success' ? (isLight ? '#065f46' : '#a7f3d0') : (logoSyncStatus.type === 'warning' ? (isLight ? '#92400e' : '#fde68a') : (isLight ? '#1e40af' : '#93c5fd')),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.85rem',
            fontWeight: '700',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            border: `1.5px solid ${logoSyncStatus.type === 'success' ? '#10b981' : (logoSyncStatus.type === 'warning' ? '#f59e0b' : '#38bdf8')}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{logoSyncStatus.text}</span>
            </div>
            <button
              onClick={() => setLogoSyncStatus(null)}
              style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: '900', fontSize: '1rem' }}
            >
              ✕
            </button>
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: `2px solid ${isLight ? '#eee' : '#222'}` }}>
            <button 
                onClick={() => { setActiveTab('personnel'); setSelectedItems([]); setLabelsToPrint([]); }}
                style={{ padding: '1rem 2rem', background: 'transparent', border: 'none', borderBottom: activeTab === 'personnel' ? '3px solid #10b981' : '3px solid transparent', color: activeTab === 'personnel' ? '#10b981' : 'var(--text-secondary)', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.1rem' }}
            >
                Personel Koli
            </button>
            <button 
                onClick={() => { setActiveTab('order'); setSelectedItems([]); setLabelsToPrint([]); }}
                style={{ padding: '1rem 2rem', background: 'transparent', border: 'none', borderBottom: activeTab === 'order' ? '3px solid #f59e0b' : '3px solid transparent', color: activeTab === 'order' ? '#f59e0b' : 'var(--text-secondary)', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.1rem' }}
            >
                Sipariş Koli
            </button>
            <button 
                onClick={() => { setActiveTab('manual'); setSelectedItems([]); setLabelsToPrint([]); }}
                style={{ padding: '1rem 2rem', background: 'transparent', border: 'none', borderBottom: activeTab === 'manual' ? '3px solid #3b82f6' : '3px solid transparent', color: activeTab === 'manual' ? '#3b82f6' : 'var(--text-secondary)', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.1rem' }}
            >
                Manuel Koli
            </button>
        </div>

        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          {renderMainContent()}
        </div>
      </div>

      {labelsToPrint.length > 0 && (
        <div className="print-area" style={{ marginTop: '3rem' }}>
          <h2 className="no-print" style={{ color: 'var(--text-primary)', marginBottom: '1.5rem', borderTop: '1px solid #333', paddingTop: '2rem' }}>Oluşturulan Etiketler (Önizleme)</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            {labelsToPrint.map((lbl, idx) => {
              const isPersonnel = lbl.staffName && lbl.staffName !== '-';
              const displayBrand = lbl.brand || selectedBrand;
              return (
                <div key={idx} className="print-label" style={{
                  width: '100mm',
                  height: '80mm',
                  background: '#fff',
                  color: '#000',
                  padding: '4mm',
                  boxSizing: 'border-box',
                  border: '2px solid #000',
                  position: 'relative',
                  pageBreakInside: 'avoid',
                  fontFamily: 'Arial, sans-serif',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #000', paddingBottom: '1.5mm', marginBottom: '2.5mm' }}>
                    <span style={{ fontSize: '13pt', fontWeight: '950', letterSpacing: '0.5px' }}>VOG TEKSTİL</span>
                    <span style={{ background: '#000', color: '#fff', padding: '1mm 3mm', fontSize: '11pt', fontWeight: '900', borderRadius: '4px', textTransform: 'uppercase' }}>
                      {displayBrand}
                    </span>
                  </div>

                  {/* Body */}
                  <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
                    {/* Left Column - Info Grid */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', border: '1.5px solid #000', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ display: 'flex', borderBottom: '1.5px solid #000', flex: 1, minHeight: 0 }}>
                        <div style={{ width: '28%', background: '#f5f5f5', padding: '1.5mm 2mm', fontSize: '7.5pt', fontWeight: 'bold', borderRight: '1.5px solid #000', display: 'flex', alignItems: 'center' }}>BAYİ / ALICI</div>
                        <div style={{ flex: 1, padding: '1.5mm 2mm', fontSize: '9pt', fontWeight: 'bold', display: 'flex', alignItems: 'center', wordBreak: 'break-word' }}>{lbl.dealer}</div>
                      </div>
                      <div style={{ display: 'flex', borderBottom: '1.5px solid #000', flex: 1, minHeight: 0 }}>
                        <div style={{ width: '28%', background: '#f5f5f5', padding: '1.5mm 2mm', fontSize: '7.5pt', fontWeight: 'bold', borderRight: '1.5px solid #000', display: 'flex', alignItems: 'center' }}>SİPARİŞ NO</div>
                        <div style={{ flex: 1, padding: '1.5mm 2mm', fontSize: '9pt', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>{lbl.orderId ? `#${lbl.orderId}` : '-'}</div>
                      </div>
                      <div style={{ display: 'flex', borderBottom: isPersonnel ? '1.5px solid #000' : 'none', flex: 1, minHeight: 0 }}>
                        <div style={{ width: '28%', background: '#f5f5f5', padding: '1.5mm 2mm', fontSize: '7.5pt', fontWeight: 'bold', borderRight: '1.5px solid #000', display: 'flex', alignItems: 'center' }}>SEVK TÜRÜ</div>
                        <div style={{ flex: 1, padding: '1.5mm 2mm', fontSize: '8.5pt', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>{isPersonnel ? 'Kişi Bazlı (Bireysel)' : 'Sipariş Bazlı (Toplu)'}</div>
                      </div>
                      {isPersonnel ? (
                        <>
                          <div style={{ display: 'flex', borderBottom: '1.5px solid #000', flex: 1.2, minHeight: 0 }}>
                            <div style={{ width: '28%', background: '#f5f5f5', padding: '1.5mm 2mm', fontSize: '7.5pt', fontWeight: 'bold', borderRight: '1.5px solid #000', display: 'flex', alignItems: 'center' }}>PERSONEL</div>
                            <div style={{ flex: 1, padding: '1.5mm 2mm', fontSize: '11pt', fontWeight: '950', display: 'flex', alignItems: 'center' }}>{lbl.staffName}</div>
                          </div>
                          <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
                            <div style={{ width: '28%', background: '#f5f5f5', padding: '1.5mm 2mm', fontSize: '7.5pt', fontWeight: 'bold', borderRight: '1.5px solid #000', display: 'flex', alignItems: 'center' }}>GÖREVİ</div>
                            <div style={{ flex: 1, padding: '1.5mm 2mm', fontSize: '9pt', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>{lbl.role || '-'}</div>
                          </div>
                        </>
                      ) : (
                        <div style={{ display: 'flex', flex: 2, minHeight: 0, justifyContent: 'center', alignItems: 'center', background: '#fafafa' }}>
                          <div style={{ fontSize: '12pt', fontWeight: '900', color: '#444', letterSpacing: '1px' }}>TOPLU SEVKİYAT</div>
                        </div>
                      )}
                    </div>

                    {/* Right Column - QR Code */}
                    <div style={{ width: '34mm', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginLeft: '3mm' }}>
                      <QRCodeGenerator value={lbl.barcode} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        @page {
          size: auto;
          margin: 0;
        }
        @media print {
          body * { visibility: hidden; }
          html, body {
            background: #fff !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .label-printing-page, .label-printing-page * { background: #fff !important; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0 !important; padding: 0 !important; }
          .no-print { display: none !important; }
          .print-label { border: 2px solid #000 !important; page-break-after: always; box-shadow: none !important; width: 100mm !important; height: 80mm !important; margin: 0 !important; }
        }
      `}</style>
    </div>
  );
};

export default BoxLabelPrinting;
