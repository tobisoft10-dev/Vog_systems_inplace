import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../services/apiConfig';
import { useLanguage } from '../context/LanguageContext';
import bwipjs from '@bwip-js/browser';

const QRCodeGenerator = ({ value }) => {
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

  return <canvas ref={canvasRef} style={{ maxWidth: '20mm', maxHeight: '20mm', margin: '0 auto', display: 'block' }} />;
};

const LabelPrinting = () => {
  const navigate = useNavigate();
  const { themeMode } = useLanguage();
  const isLight = themeMode === 'light';
  
  const [groupedData, setGroupedData] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState([]);
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState('SEAT');

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE_URL}/api/orders/staff-by-role?brand=${selectedBrand}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setGroupedData(data.data);
          if (data.data.length > 0) {
            setSelectedRole(data.data[0].role);
          } else {
            setSelectedRole(null);
          }
        }
      })
      .finally(() => setLoading(false));
  }, [selectedBrand]);

  const handleSelectStaff = (staff) => {
    if (selectedStaff.find(s => s.staffName === staff.staffName && s.dealer === staff.dealer)) {
      setSelectedStaff(selectedStaff.filter(s => !(s.staffName === staff.staffName && s.dealer === staff.dealer)));
    } else {
      setSelectedStaff([...selectedStaff, { ...staff, role: selectedRole }]);
    }
  };

  const handleSelectAll = (staffList) => {
    const allSelected = staffList.every(staff => selectedStaff.find(s => s.staffName === staff.staffName && s.dealer === staff.dealer));
    if (allSelected) {
      setSelectedStaff(selectedStaff.filter(s => !staffList.find(sl => sl.staffName === s.staffName && sl.dealer === s.dealer)));
    } else {
      const newSelections = staffList.filter(staff => !selectedStaff.find(s => s.staffName === staff.staffName && s.dealer === staff.dealer)).map(s => ({ ...s, role: selectedRole }));
      setSelectedStaff([...selectedStaff, ...newSelections]);
    }
  };

  const generateLabels = async () => {
    if (selectedStaff.length === 0) return alert('Lütfen etiket basılacak personelleri seçin.');
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/vouchers/generate-staff-labels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffList: selectedStaff, brand: selectedBrand })
      });
      const data = await res.json();
      if (data.success) {
        setLabels(data.data);
      }
    } catch (err) {
      console.error(err);
      alert('Etiketler oluşturulurken hata oluştu.');
    }
  };

  const prepareRFID = async () => {
    if (selectedStaff.length === 0) return alert('Lütfen personelleri seçin.');
    
    try {
        let createdCount = 0;
        for (const staff of selectedStaff) {
            const barcode = `LBL-${selectedBrand.substring(0,3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
            
            if (staff.items && staff.items.length > 0) {
                for (const item of staff.items) {
                    await fetch(`${API_BASE_URL}/api/vouchers/create`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            location: 'RFID Hazırlık',
                            barcode: barcode,
                            quantity: parseInt(item.quantity || 1),
                            grup: staff.role,
                            sku: item.sku,
                            product_name: item.product_name,
                            size: item.size,
                            brand: selectedBrand,
                            staff_name: staff.staffName
                        })
                    });
                    
                    await fetch(`${API_BASE_URL}/api/sales/create`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            location: 'RFID Hazırlık',
                            barcode: barcode,
                            quantity: parseInt(item.quantity || 1),
                            grup: staff.role,
                            sku: item.sku,
                            product_name: item.product_name,
                            staff_name: staff.staffName,
                            brand: selectedBrand
                        })
                    });
                    
                    createdCount++;
                }
            }
        }
        alert(`${createdCount} adet kayıt başarıyla RFID sistemi için vouchers ve sales tablolarına eklendi!`);
    } catch (err) {
        console.error(err);
        alert('İşlem sırasında hata oluştu.');
    }
  };

  const printLabels = () => {
    window.print();
  };

  const activeGroup = groupedData.find(g => g.role === selectedRole);

  return (
    <div className="label-printing-page" style={{ padding: '2rem', minHeight: '100vh', background: isLight ? '#f8f9fa' : '#05070a' }}>
      
      {/* Hide this entire block when printing */}
      <div className="no-print">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <button onClick={() => navigate('/admin')} style={{ background: 'transparent', border: `1px solid ${isLight ? '#ccc' : '#333'}`, color: 'var(--text-primary)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', marginBottom: '1rem' }}>
              ← GERİ DÖN
            </button>
            <h1 style={{ color: 'var(--text-primary)', fontSize: '2rem', fontWeight: '800' }}>Kişi Bazlı Etiket & Koli Basımı</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Excel'den alınan görevlere göre personelleri filtreleyin ve barkodlu etiket oluşturun.</p>
          </div>
          {labels.length > 0 && (
            <button onClick={printLabels} style={{ background: '#E60000', color: 'white', border: 'none', padding: '1rem 2rem', borderRadius: '12px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(230,0,0,0.3)' }}>
              YAZDIR (PRINT)
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          {/* Sidebar - Roles */}
          <div style={{ width: '250px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Filtreler</h3>
            
            <select 
                value={selectedBrand} 
                onChange={(e) => { setSelectedBrand(e.target.value); setSelectedRole(null); setSelectedStaff([]); }}
                style={{ padding: '0.8rem', borderRadius: '8px', background: isLight ? '#fff' : '#111', color: 'var(--text-primary)', border: `1px solid ${isLight ? '#eee' : '#222'}`, cursor: 'pointer', marginBottom: '1rem', outline: 'none' }}
            >
                <option value="SEAT">SEAT</option>
                <option value="AUDI">AUDI</option>
                <option value="FORD">FORD</option>
                <option value="ZARA">ZARA</option>
            </select>

            <h3 style={{ color: 'var(--text-primary)', marginBottom: '1rem', marginTop: '0.5rem' }}>Görevler</h3>
            {loading ? <p style={{ color: 'var(--text-secondary)' }}>Yükleniyor...</p> : groupedData.map(group => (
              <button 
                key={group.role}
                onClick={() => setSelectedRole(group.role)}
                style={{ 
                  textAlign: 'left', 
                  padding: '1rem', 
                  borderRadius: '12px', 
                  background: selectedRole === group.role ? '#E60000' : (isLight ? '#fff' : '#111'), 
                  color: selectedRole === group.role ? '#fff' : 'var(--text-primary)',
                  border: `1px solid ${selectedRole === group.role ? '#E60000' : (isLight ? '#eee' : '#222')}`,
                  cursor: 'pointer',
                  fontWeight: selectedRole === group.role ? 'bold' : 'normal',
                  transition: '0.2s'
                }}>
                {group.role} <span style={{ float: 'right', background: 'rgba(0,0,0,0.1)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.8rem' }}>{group.staff.length}</span>
              </button>
            ))}
          </div>

          {/* Main - Staff List */}
          <div style={{ flex: 1, minWidth: '300px', background: isLight ? '#fff' : '#111', padding: '2rem', borderRadius: '16px', border: `1px solid ${isLight ? '#eee' : '#222'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h3 style={{ color: 'var(--text-primary)' }}>{selectedRole} ({activeGroup?.staff.length || 0} Kişi)</h3>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={() => handleSelectAll(activeGroup?.staff || [])} style={{ background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--text-secondary)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>Tümünü Seç / Kaldır</button>
                <button onClick={generateLabels} disabled={selectedStaff.length === 0} style={{ display: 'none', background: selectedStaff.length > 0 ? '#10b981' : '#ccc', color: '#fff', border: 'none', padding: '0.5rem 1.5rem', borderRadius: '8px', cursor: selectedStaff.length > 0 ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}>{selectedStaff.length} Kişi İçin Etiket Oluştur</button>
                <button onClick={prepareRFID} disabled={selectedStaff.length === 0} style={{ background: selectedStaff.length > 0 ? '#3b82f6' : '#ccc', color: '#fff', border: 'none', padding: '0.5rem 1.5rem', borderRadius: '8px', cursor: selectedStaff.length > 0 ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}>RFID İçin Hazırla</button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
              {activeGroup?.staff.map((s, idx) => {
                const isSelected = selectedStaff.find(st => st.staffName === s.staffName && st.dealer === s.dealer);
                return (
                  <div key={idx} onClick={() => handleSelectStaff(s)} style={{ padding: '1rem', border: `2px solid ${isSelected ? '#E60000' : (isLight ? '#eee' : '#222')}`, borderRadius: '12px', cursor: 'pointer', background: isSelected ? (isLight ? 'rgba(230,0,0,0.05)' : 'rgba(230,0,0,0.1)') : 'transparent' }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{s.staffName}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{s.dealer}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Printable Area */}
      {labels.length > 0 && (
        <div className="print-area" style={{ marginTop: '3rem' }}>
          <h2 className="no-print" style={{ color: 'var(--text-primary)', marginBottom: '1.5rem', borderTop: '1px solid #333', paddingTop: '2rem' }}>Oluşturulan Etiketler (Önizleme)</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            {labels.map((lbl, idx) => (
              <div key={idx} className="print-label" style={{ width: '100mm', height: '100mm', background: '#fff', color: '#000', padding: '5mm', boxSizing: 'border-box', border: '1px solid #ccc', position: 'relative', pageBreakInside: 'avoid', fontFamily: 'Arial, sans-serif' }}>
                {/* Header */}
                <div style={{ borderBottom: '2px solid #000', paddingBottom: '3mm', marginBottom: '3mm', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <img src="/vog_logo.png" alt="VOG Logo" style={{ height: '10mm', filter: 'grayscale(100%) brightness(0)' }} />
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '900', fontSize: '12pt' }}>SEAT 2026 YAZ</div>
                    <div style={{ fontSize: '8pt', color: '#444' }}>PERSONEL KOLİ ETİKETİ</div>
                  </div>
                </div>
                
                {/* Body */}
                <div style={{ marginBottom: '3mm' }}>
                  <div style={{ fontSize: '8pt', color: '#666' }}>BAYİ / NOKTA</div>
                  <div style={{ fontSize: '12pt', fontWeight: 'bold', textTransform: 'uppercase' }}>{lbl.dealer}</div>
                </div>

                <div style={{ marginBottom: '3mm', display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '8pt', color: '#666' }}>PERSONEL ADI</div>
                    <div style={{ fontSize: '14pt', fontWeight: '900', textTransform: 'uppercase' }}>{lbl.staffName}</div>
                  </div>
                  <div style={{ textAlign: 'right', maxWidth: '40%' }}>
                    <div style={{ fontSize: '8pt', color: '#666' }}>GÖREVİ</div>
                    <div style={{ fontSize: '10pt', fontWeight: 'bold' }}>{lbl.role}</div>
                  </div>
                </div>

                {/* Items */}
                <div style={{ borderTop: '1px dotted #000', paddingTop: '2mm', marginBottom: '5mm' }}>
                  <div style={{ fontSize: '7pt', fontWeight: 'bold', marginBottom: '1mm' }}>PAKET İÇERİĞİ ({lbl.items?.length} Kalem)</div>
                  {lbl.items?.map((item, i) => (
                    <div key={i} style={{ fontSize: '8pt', display: 'flex', justifyContent: 'space-between', marginBottom: '1mm', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span>{item.quantity}x {item.product_name}</span>
                        <span style={{ fontSize: '6pt', color: '#555', marginTop: '1px' }}>Parça No: {item.sku || '-'}</span>
                      </div>
                      <span style={{ fontWeight: 'bold', marginLeft: '5px' }}>{item.size || '-'}</span>
                    </div>
                  ))}
                </div>

                {/* Footer Barcode / QRCode */}
                <div style={{ position: 'absolute', bottom: '2mm', left: '5mm', right: '5mm', textAlign: 'center', borderTop: '1px solid #000', paddingTop: '1.5mm', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <QRCodeGenerator value={lbl.barcode} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Global CSS for Printing */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .label-printing-page, .label-printing-page * {
            background: #fff !important;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-label {
            border: none !important;
            page-break-after: always;
            box-shadow: none !important;
            width: 100mm !important;
            height: 100mm !important;
          }
        }
      `}</style>
    </div>
  );
};

export default LabelPrinting;
