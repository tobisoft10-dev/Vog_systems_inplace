import React, { useState, useEffect, useRef } from 'react';
import API_BASE_URL from '../services/apiConfig';
import { useLanguage } from '../context/LanguageContext';

const BoxLabelAutoPrint = () => {
  const { themeMode } = useLanguage();
  const isLight = themeMode === 'light';

  // Auto print ALWAYS ENABLED (ON) by default
  const [autoPrintEnabled, setAutoPrintEnabled] = useState(() => {
    const saved = localStorage.getItem('auto_print_enabled');
    return saved !== null ? JSON.parse(saved) : true; // Default ON
  });

  const [pendingLabels, setPendingLabels] = useState([]);
  const [printedLabels, setPrintedLabels] = useState([]);
  const [activePrintLabel, setActivePrintLabel] = useState(null);
  const [printingStatus, setPrintingStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const autoPrintRef = useRef(autoPrintEnabled);

  // Keep ref & localStorage in sync
  useEffect(() => {
    autoPrintRef.current = autoPrintEnabled;
    localStorage.setItem('auto_print_enabled', JSON.stringify(autoPrintEnabled));
  }, [autoPrintEnabled]);

  const fetchData = async () => {
    try {
      const [pendingRes, allRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/box-labels/pending`),
        fetch(`${API_BASE_URL}/api/box-labels/list`)
      ]);
      const pendingData = await pendingRes.json();
      const allData = await allRes.json();

      if (pendingData.success) {
        setPendingLabels(pendingData.data || []);
      }
      if (allData.success) {
        setPrintedLabels(allData.data || []);
      }
    } catch (error) {
      console.error('Error fetching box labels queue:', error);
    } finally {
      setLoading(false);
    }
  };

  // Poll for new pending labels every 2.5 seconds
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2500);
    return () => clearInterval(interval);
  }, []);

  // Auto-print trigger logic (Triggers browser print via hidden iframe)
  useEffect(() => {
    if (autoPrintEnabled && pendingLabels.length > 0 && !activePrintLabel) {
      const nextLabel = pendingLabels[pendingLabels.length - 1]; // Pick oldest first
      handleClientDirectPrint(nextLabel);
    }
  }, [pendingLabels, autoPrintEnabled, activePrintLabel]);

  // Client-side Browser Direct Print Function
  const handleClientDirectPrint = async (label) => {
    const orderId = label.order_id || label.id;
    setActivePrintLabel(label);
    setPrintingStatus(`🖨️ Sipariş #${orderId} etiketi yazdırılıyor...`);

    try {
      // 1. Fetch Today's Brand Label HTML from Server
      const res = await fetch(`${API_BASE_URL}/api/print-label/${orderId}?noprint=true`);
      const htmlContent = await res.text();

      // 2. Create hidden iframe on CLIENT Browser and write HTML
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write(htmlContent);
      doc.close();

      // 3. Trigger Browser Print
      setTimeout(() => {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        } catch (e) {
          console.error('Client print error:', e);
        }

        // 4. Mark as printed in PostgreSQL database after print action
        setTimeout(() => {
          if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
          markAsPrinted(orderId);
        }, 1200);
      }, 600);

    } catch (err) {
      console.error('Error fetching label HTML for client print:', err);
      setPrintingStatus(`❌ Etiket şablonu yükleme hatası.`);
      setActivePrintLabel(null);
    }
  };

  const markAsPrinted = async (orderId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/box-labels/mark-printed/${orderId}`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        setPrintingStatus(`✅ Sipariş #${orderId} yazdırıldı ve 'printed' olarak kaydedildi.`);
        setPendingLabels(prev => prev.filter(l => (l.order_id || l.id) !== orderId));
        fetchData();
      }
    } catch (err) {
      console.error('Error marking box label as printed:', err);
    } finally {
      setTimeout(() => {
        setActivePrintLabel(null);
        setPrintingStatus(null);
      }, 2000);
    }
  };

  // Color values
  const glassBg = isLight ? 'rgba(15, 23, 42, 0.02)' : 'rgba(255, 255, 255, 0.02)';
  const glassBorder = isLight ? 'rgba(15, 23, 42, 0.05)' : 'rgba(255, 255, 255, 0.05)';
  const cardBg = isLight ? '#ffffff' : '#11131c';
  const textPrimary = 'var(--text-primary)';
  const textSecondary = 'var(--text-secondary)';

  return (
    <div className="box-label-auto-print-container" style={{ padding: '2rem', minHeight: '100vh', background: isLight ? 'var(--bg-primary)' : '#05070a' }}>
      
      {/* Dashboard View */}
      <div className="no-print" style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Header Block */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ color: textPrimary, fontSize: '2.2rem', fontWeight: '950', letterSpacing: '-1px' }}>
              Otomatik <span style={{ color: '#10b981' }}>Koli Etiketi Yazma İstasyonu</span>
            </h1>
            <p style={{ color: textSecondary }}>Takılı Godex G530 etiket yazıcısından doğrudan otomatik baskı (Her zaman Aktif)</p>
          </div>
          
          {/* Active Auto Print Mode Toggle switch (Default ON) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: cardBg, padding: '1rem 2rem', borderRadius: '100px', border: `1px solid ${glassBorder}`, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: '900', color: autoPrintEnabled ? '#10b981' : textSecondary }}>
              {autoPrintEnabled ? '🟢 OTOMATİK YAZDIRMA HER ZAMAN AKTİF (ON)' : '⚪ OTOMATİK YAZDIRMA KAPALI'}
            </span>
            <label style={{ position: 'relative', display: 'inline-block', width: '60px', height: '34px', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={autoPrintEnabled}
                onChange={() => setAutoPrintEnabled(!autoPrintEnabled)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: autoPrintEnabled ? '#10b981' : '#475569',
                transition: '.4s', borderRadius: '34px',
                boxShadow: autoPrintEnabled ? '0 0 15px rgba(16, 185, 129, 0.4)' : 'none'
              }}>
                <span style={{
                  position: 'absolute', content: '""', height: '26px', width: '26px', left: '4px', bottom: '4px',
                  backgroundColor: 'white', transition: '.4s', borderRadius: '50%',
                  transform: autoPrintEnabled ? 'translateX(26px)' : 'translateX(0)'
                }} />
              </span>
            </label>
          </div>
        </div>

        {/* Live Printing Status Notification Banner */}
        {printingStatus && (
          <div style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#fff',
            padding: '1.2rem 2rem',
            borderRadius: '16px',
            fontWeight: '900',
            fontSize: '1.1rem',
            marginBottom: '2rem',
            boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>{printingStatus}</span>
            <span style={{ fontSize: '0.85rem', background: 'rgba(0,0,0,0.2)', padding: '4px 12px', borderRadius: '20px' }}>Godex G530 Yazıcısı</span>
          </div>
        )}

        {/* Content Grids */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem' }}>
          
          {/* Pending Queue Column */}
          <div style={{ background: cardBg, borderRadius: '24px', padding: '2rem', border: `1px solid ${glassBorder}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '900', color: textPrimary, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: '#eab308' }}></span>
                Bekleyen Etiketler ({pendingLabels.length})
              </h2>
              <span style={{ fontSize: '0.8rem', color: textSecondary }}>status = 'waiting'</span>
            </div>

            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: textSecondary }}>Yükleniyor...</div>
            ) : pendingLabels.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', border: `2px dashed ${glassBorder}`, borderRadius: '16px', color: textSecondary }}>
                Sırada bekleyen etiket yok. Tünelden okuma yapıldığında bu bilgisayardaki Godex G530 yazıcıya basılacaktır.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {pendingLabels.map(label => {
                  const orderId = label.order_id || label.id;
                  return (
                    <div key={orderId} style={{ background: glassBg, border: `1px solid ${glassBorder}`, borderRadius: '16px', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                          <span style={{ fontSize: '1.1rem', fontWeight: '900', color: textPrimary }}>Sipariş #{orderId}</span>
                          <span style={{ background: '#eab308', color: '#000', fontSize: '0.7rem', fontWeight: '900', padding: '2px 8px', borderRadius: '4px' }}>
                            {label.brand || 'VOG'}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: textSecondary }}>
                          {label.dealer || 'Bayi'} &bull; {label.waiting_count || 1} Adet Ürün
                        </p>
                      </div>
                      <button
                        onClick={() => handleClientDirectPrint(label)}
                        style={{
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: '#fff',
                          border: 'none',
                          padding: '0.8rem 1.5rem',
                          borderRadius: '12px',
                          fontWeight: '900',
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                        }}
                      >
                        🖨️ YAZDIR
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Printed History Column */}
          <div style={{ background: cardBg, borderRadius: '24px', padding: '2rem', border: `1px solid ${glassBorder}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '900', color: textPrimary, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: '#10b981' }}></span>
                Yazdırılan Etiketler ({printedLabels.length})
              </h2>
              <span style={{ fontSize: '0.8rem', color: textSecondary }}>status = 'printed'</span>
            </div>

            {printedLabels.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', border: `2px dashed ${glassBorder}`, borderRadius: '16px', color: textSecondary }}>
                Henüz yazdırılmış etiket kaydı bulunmuyor.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '500px', overflowY: 'auto' }}>
                {printedLabels.map(label => {
                  const orderId = label.order_id || label.id;
                  return (
                    <div key={orderId} style={{ background: glassBg, border: `1px solid ${glassBorder}`, borderRadius: '16px', padding: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.8 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                          <span style={{ fontSize: '1rem', fontWeight: '900', color: textPrimary }}>Sipariş #{orderId}</span>
                          <span style={{ background: '#10b981', color: '#fff', fontSize: '0.65rem', fontWeight: '900', padding: '2px 6px', borderRadius: '4px' }}>
                            YAZDIRILDI
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: textSecondary }}>
                          {label.dealer || 'Bayi'} &bull; {label.item_count || 1} Ürün
                        </p>
                      </div>
                      <button
                        onClick={() => handleClientDirectPrint(label)}
                        style={{
                          background: 'transparent',
                          color: textSecondary,
                          border: `1px solid ${glassBorder}`,
                          padding: '0.5rem 1rem',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        Tekrar Yazdır
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};

export default BoxLabelAutoPrint;
