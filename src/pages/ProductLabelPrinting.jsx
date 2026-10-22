import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../services/apiConfig';
import { useLanguage } from '../context/LanguageContext';
import bwipjs from '@bwip-js/browser';
import ProductSearchSelect from '../components/ProductSearchSelect';

const BarcodeGenerator = ({ value }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current && value) {
      try {
        bwipjs.toCanvas(canvasRef.current, {
          bcid: 'qrcode',
          text: value,
          scale: 3,
          includetext: false,
        });
      } catch (err) {
        console.error('Error rendering QRCode:', err);
      }
    }
  }, [value]);

  return <canvas ref={canvasRef} style={{ maxWidth: '22mm', maxHeight: '22mm', margin: '0 auto', display: 'block' }} />;
};

const ProductLabelPrinting = () => {
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
  
  const [selectedItems, setSelectedItems] = useState([]);
  const [labelsToPrint, setLabelsToPrint] = useState([]);
  const [activeCell, setActiveCell] = useState({ rowIndex: null, colIndex: null, value: '' });
  const [showFormulaHelp, setShowFormulaHelp] = useState(false);
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

  const handleSelectAllStaff = () => {
    if (!activeStaffGroup) return;
    const currentStaffIds = activeStaffGroup.staff.map(s => s.id);
    const allSelected = activeStaffGroup.staff.every(s => selectedItems.some(st => st.id === s.id));
    
    if (allSelected) {
      // Remove all current staff from selectedItems
      setSelectedItems(selectedItems.filter(s => !currentStaffIds.includes(s.id)));
    } else {
      // Add all current staff to selectedItems (avoiding duplicates)
      const newItems = [...selectedItems];
      activeStaffGroup.staff.forEach(s => {
        if (!newItems.some(st => st.id === s.id)) {
          newItems.push({ ...s, role: selectedRole });
        }
      });
      setSelectedItems(newItems);
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

  const generateLabels = () => {
    let generated = [];
    if (activeTab === 'personnel') {
      selectedItems.forEach(staff => {
         staff.items.forEach(item => {
            const qty = parseInt(item.quantity) || 1;
            for(let i=0; i<qty; i++) {
                generated.push({
                   logo: '/vog_logo.png',
                   productName: item.product_name,
                   size: item.size,
                   sku: item.sku,
                   barcode: `LBL-${Math.floor(100000 + Math.random() * 900000)}`
                });
            }
         });
      });
    } else if (activeTab === 'order') {
       selectedItems.forEach(group => {
          group.items.forEach(item => {
              const qty = parseInt(item.quantity) || 1;
              for(let i=0; i<qty; i++) {
                  generated.push({
                      logo: '/vog_logo.png',
                      productName: item.product_name,
                      size: item.size,
                      sku: item.sku,
                      barcode: item.barcode || `LBL-${Math.floor(100000 + Math.random() * 900000)}`
                  });
              }
          });
       });
    } else if (activeTab === 'manual') {
       manualList.forEach(item => {
           if(item.productName) {
               const qty = parseInt(item.quantity) || 1;
               for(let i=0; i<qty; i++) {
                   generated.push({
                       logo: '/vog_logo.png',
                       productName: item.productName,
                       size: item.size,
                       sku: item.sku,
                       barcode: item.barcode || `LBL-${Math.floor(100000 + Math.random() * 900000)}`
                   });
               }
           }
       });
    }
    setLabelsToPrint(generated);
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

  const renderMainContent = () => {
    let fileName = '';
    if (activeTab === 'personnel') {
      fileName = `${selectedBrand}_2026_Yaz_Personel_Etiketleri.xlsx`;
    } else if (activeTab === 'order') {
      fileName = `${selectedBrand}_2026_Yaz_Siparis_Etiketleri.xlsx`;
    } else {
      fileName = 'Manuel_Urun_Etiket_Listesi.xlsx';
    }

    let currentHeaders = [];
    let currentRowsCount = 0;
    
    if (activeTab === 'personnel') {
      currentHeaders = ['SEÇ', 'PERSONEL ADI', 'BAYİ / ALICI', 'ÜST BEDEN', 'ALT BEDEN', 'SİPARİŞ NO'];
      currentRowsCount = activeStaffGroup?.staff.length || 0;
    } else if (activeTab === 'order') {
      currentHeaders = ['ÜRÜN', 'BEDEN', 'ADET', 'SKU'];
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
          {/* Action Buttons inside Ribbon Bar */}
          <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
            {activeTab === 'personnel' && (
              <button 
                onClick={generateLabels} 
                disabled={selectedItems.length === 0} 
                className="label-action-btn"
                style={{ 
                  background: selectedItems.length > 0 ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)' : (isLight ? '#e2e8f0' : '#1e293b'), 
                  color: selectedItems.length > 0 ? '#fff' : 'var(--text-secondary)', 
                  border: 'none', 
                  padding: '0.4rem 1rem', 
                  borderRadius: '6px', 
                  cursor: selectedItems.length > 0 ? 'pointer' : 'not-allowed', 
                  fontWeight: 'bold',
                  fontSize: '0.75rem',
                  boxShadow: selectedItems.length > 0 ? '0 2px 6px rgba(139, 92, 246, 0.25)' : 'none'
                }}
              >
                {selectedItems.length} SATIR İÇİN ETİKET OLUŞTUR
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
                  disabled={selectedItems.length === 0} 
                  className="label-action-btn"
                  style={{ 
                    background: selectedItems.length > 0 ? 'linear-gradient(135deg, #10b981, #059669)' : (isLight ? '#e2e8f0' : '#1e293b'), 
                    color: selectedItems.length > 0 ? '#fff' : 'var(--text-secondary)', 
                    border: 'none', 
                    padding: '0.4rem 1rem', 
                    borderRadius: '6px', 
                    cursor: selectedItems.length > 0 ? 'pointer' : 'not-allowed', 
                    fontWeight: 'bold',
                    fontSize: '0.75rem',
                    boxShadow: selectedItems.length > 0 ? '0 2px 6px rgba(16, 185, 129, 0.25)' : 'none'
                  }}
                >
                  SEÇİLİ SİPARİŞLER İÇİN ETİKET OLUŞTUR
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
                  disabled={manualList.length === 0} 
                  className="label-action-btn"
                  style={{ 
                    background: manualList.length > 0 ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : (isLight ? '#e2e8f0' : '#1e293b'), 
                    color: manualList.length > 0 ? '#fff' : 'var(--text-secondary)', 
                    border: 'none', 
                    padding: '0.4rem 1rem', 
                    borderRadius: '6px', 
                    cursor: manualList.length > 0 ? 'pointer' : 'not-allowed', 
                    fontWeight: 'bold',
                    fontSize: '0.75rem',
                    boxShadow: manualList.length > 0 ? '0 2px 6px rgba(59, 130, 246, 0.25)' : 'none'
                  }}
                >
                  ETİKET OLUŞTUR
                </button>
              </>
            )}
          </div>
        </div>

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
                      textAlign: (hdr === 'SEÇ' || hdr === 'BEDEN' || hdr === 'ÜST BEDEN' || hdr === 'ALT BEDEN' || hdr === 'ADET' || hdr === 'İŞLEM') ? 'center' : 'left',  
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
                      onClick={() => setActiveCell({ rowIndex: idx, colIndex: 3, value: s.topSize || '' })}
                      style={{ ...getCellStyles(idx, 3), textAlign: 'center', fontWeight: 'bold' }}
                    >
                      {s.topSize || '-'}
                    </td>

                    <td 
                      onClick={() => setActiveCell({ rowIndex: idx, colIndex: 4, value: s.bottomSize || '' })}
                      style={{ ...getCellStyles(idx, 4), textAlign: 'center', fontWeight: 'bold' }}
                    >
                      {s.bottomSize || '-'}
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
                    onClick={() => setActiveCell({ rowIndex: idx, colIndex: 1, value: item.size || '' })}
                    style={{ ...getCellStyles(idx, 1), textAlign: 'center' }}
                  >
                    {item.size}
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
                      onChange={(e) => updateManualItem(item.id, 'quantity', parseInt(e.target.value))} 
                      onClick={(e) => e.stopPropagation()}
                      style={{ 
                        width: '60px', 
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

                  <td style={{ textAlign: 'center', padding: '0.4rem 0.8rem', border: `1px solid ${isLight ? '#cbd5e1' : '#334155'}` }}>
                    <button 
                      onClick={() => removeManualItem(item.id)} 
                      style={{ 
                        color: '#E60000', 
                        background: 'transparent', 
                        border: 'none', 
                        cursor: 'pointer', 
                        fontSize: '1.2rem', 
                        lineHeight: '1' 
                      }}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}

              {currentRowsCount === 0 && (
                <tr>
                  <td colSpan={colCount + 1} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {activeTab === 'manual' ? 'Boş. Satır ekleyerek başlayın.' : 'Seçilen filtrelere uygun veri bulunamadı.'}
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
            <h1 style={{ color: 'var(--text-primary)', fontSize: '2rem', fontWeight: '800' }}>Ürün Etiket Basımı</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Tekil ürün etiketlerini oluşturun.</p>
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
            {labelsToPrint.length > 0 && (
              <button onClick={printLabels} style={{ background: '#E60000', color: 'white', border: 'none', padding: '1rem 2rem', borderRadius: '12px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(230,0,0,0.3)' }}>
                YAZDIR (PRINT)
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: `2px solid ${isLight ? '#eee' : '#222'}` }}>
            <button 
                onClick={() => { setActiveTab('personnel'); setSelectedItems([]); setLabelsToPrint([]); }}
                style={{ padding: '1rem 2rem', background: 'transparent', border: 'none', borderBottom: activeTab === 'personnel' ? '3px solid #8b5cf6' : '3px solid transparent', color: activeTab === 'personnel' ? '#8b5cf6' : 'var(--text-secondary)', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.1rem' }}
            >
                Personel Bazlı
            </button>
            <button 
                onClick={() => { setActiveTab('order'); setSelectedItems([]); setLabelsToPrint([]); }}
                style={{ padding: '1rem 2rem', background: 'transparent', border: 'none', borderBottom: activeTab === 'order' ? '3px solid #10b981' : '3px solid transparent', color: activeTab === 'order' ? '#10b981' : 'var(--text-secondary)', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.1rem' }}
            >
                Sipariş Bazlı
            </button>
            <button 
                onClick={() => { setActiveTab('manual'); setSelectedItems([]); setLabelsToPrint([]); }}
                style={{ padding: '1rem 2rem', background: 'transparent', border: 'none', borderBottom: activeTab === 'manual' ? '3px solid #3b82f6' : '3px solid transparent', color: activeTab === 'manual' ? '#3b82f6' : 'var(--text-secondary)', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.1rem' }}
            >
                Manuel Liste
            </button>
        </div>

        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          {renderMainContent()}
        </div>
      </div>

      {labelsToPrint.length > 0 && (
        <div className="print-area" style={{ marginTop: '3rem' }}>
          <h2 className="no-print" style={{ color: 'var(--text-primary)', marginBottom: '1.5rem', borderTop: '1px solid #333', paddingTop: '2rem' }}>Oluşturulan Etiketler (Önizleme) - {labelsToPrint.length} Adet</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {labelsToPrint.map((lbl, idx) => (
              <div key={idx} className="print-label" style={{ 
                width: '40mm', 
                height: '60mm', 
                background: '#fff', 
                color: '#000', 
                padding: '3mm', 
                boxSizing: 'border-box', 
                border: '1px solid #ccc', 
                position: 'relative', 
                pageBreakInside: 'avoid', 
                fontFamily: 'Arial, sans-serif', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                textAlign: 'center' 
              }}>
                <img src={lbl.logo} alt="Logo" style={{ height: '7mm', objectFit: 'contain', filter: 'grayscale(100%)', marginBottom: '1mm' }} />
                
                <div style={{ fontSize: '8pt', fontWeight: 'bold', textTransform: 'uppercase', lineHeight: '1.2', width: '100%', wordBreak: 'break-word', margin: '1mm 0' }}>
                  {lbl.productName}
                </div>
                
                {lbl.size && (
                  <div style={{ 
                    fontSize: '12pt', 
                    fontWeight: '900', 
                    border: '2px solid #000', 
                    borderRadius: '50%', 
                    width: '9mm', 
                    height: '9mm', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    margin: '1mm 0'
                  }}>
                    {lbl.size}
                  </div>
                )}
                
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5mm', marginTop: 'auto' }}>
                  <div style={{ fontSize: '6.5pt', fontWeight: 'bold', color: '#000' }}>SKU: {lbl.sku}</div>
                  <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <BarcodeGenerator value={lbl.barcode} />
                  </div>
                </div>
              </div>
            ))}
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
          .print-label { border: none !important; box-shadow: none !important; margin: 0 !important; page-break-after: always; }
        }
      `}</style>
    </div>
  );
};

export default ProductLabelPrinting;
