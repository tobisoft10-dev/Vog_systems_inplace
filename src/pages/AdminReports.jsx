import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../services/apiConfig';

const AdminReports = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [reportData, setReportData] = useState({
    sales: [],
    inventory: [],
    vouchers: [],
    stats: {
      totalRevenue: '€142,500',
      avgOrder: '€925',
      efficiency: '%98.4'
    }
  });

  // Demo token - in production this comes from auth context
  const ADMIN_TOKEN = "VOG16546NNF5351ADD123123";

  useEffect(() => {
    fetchData();
  }, [activeTab, dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const res = await fetch(`${API_BASE_URL}/api/customer/stats?brand=VOG`);
        const data = await res.json();
        if (data.success) {
          setReportData(prev => ({
            ...prev,
            stats: {
              ...prev.stats,
              totalRevenue: `€${(data.data.totalOrders * 1250).toLocaleString()}`,
              avgOrder: '€1,250',
              efficiency: '%99.2'
            }
          }));
        }
      } else if (activeTab === 'sales') {
        const res = await fetch(`${API_BASE_URL}/api/sales`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: ADMIN_TOKEN, start_date: dateRange.start, end_date: dateRange.end })
        });
        const data = await res.json();
        setReportData(prev => ({ ...prev, sales: Array.isArray(data) ? data : (data.success === false ? [] : []) }));
      } else if (activeTab === 'inventory') {
        const res = await fetch(`${API_BASE_URL}/api/stocks/VOG`);
        const data = await res.json();
        if (data.success) setReportData(prev => ({ ...prev, inventory: data.data }));
      } else if (activeTab === 'vouchers') {
        const res = await fetch(`${API_BASE_URL}/api/vouchers/print`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: ADMIN_TOKEN, start_date: dateRange.start, end_date: dateRange.end })
        });
        const data = await res.json();
        setReportData(prev => ({ ...prev, vouchers: Array.isArray(data) ? data : [] }));
      }
    } catch (error) {
      console.error("Report fetch error:", error);
    }
    setLoading(false);
  };

  const handleExportCSV = () => {
    let csvContent = '';
    let filename = '';
    
    if (activeTab === 'sales') {
      if (reportData.sales.length === 0) { alert(t('admin.reports.noDataExport')); return; }
      csvContent = 'RefNumber,Barcode,Miktar,Tür,Durum\n';
      reportData.sales.forEach(item => {
        csvContent += `${item.order_id || item.id},${item.barcode},${item.quantity},Satış,TAMAMLANDI\n`;
      });
      filename = `VOG_Satis_Raporu_${dateRange.start}_${dateRange.end}.csv`;
    } else if (activeTab === 'inventory') {
      if (reportData.inventory.length === 0) { alert(t('admin.reports.noDataExport')); return; }
      csvContent = 'SKU,Ürün Adı,Mevcut Adet,Min Stok\n';
      reportData.inventory.forEach(item => {
        csvContent += `${item.sku},"${item.product_name}",${item.quantity},${item.min_stock_level || 0}\n`;
      });
      filename = `VOG_Stok_Raporu_${new Date().toISOString().split('T')[0]}.csv`;
    } else if (activeTab === 'vouchers') {
      if (reportData.vouchers.length === 0) { alert(t('admin.reports.noDataExport')); return; }
      csvContent = 'RefNumber,Barcode,Açıklama,Miktar,Tür\n';
      reportData.vouchers.forEach(item => {
        csvContent += `${item.order_id || item.id},${item.barcode},"${item.product_name || item.brand}",${item.quantity},İrsaliye\n`;
      });
      filename = `VOG_Fis_Arsivi_${dateRange.start}_${dateRange.end}.csv`;
    } else {
      csvContent = 'Metrik,Değer\n';
      csvContent += `Dönemsel Ciro,${reportData.stats.totalRevenue}\n`;
      csvContent += `Ortalama Sepet,${reportData.stats.avgOrder}\n`;
      csvContent += `RFID Okuma Başarısı,${reportData.stats.efficiency}\n`;
      filename = `VOG_Genel_Bakis_${new Date().toISOString().split('T')[0]}.csv`;
    }
    
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-reports-premium" style={{ maxWidth: '1600px', margin: '0 auto', padding: 'var(--container-pad)' }}>
      {/* Header Area */}
      <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
        <div>
          <button 
            onClick={() => navigate('/admin')} 
            className="btn-back-premium"
            style={{ 
              background: 'var(--glass)', 
              border: '1px solid var(--glass-border)', 
              color: 'var(--text-primary)', 
              padding: '0.8rem 1.8rem', 
              borderRadius: '100px', 
              cursor: 'pointer', 
              marginBottom: '2rem', 
              fontSize: '0.75rem', 
              fontWeight: '950', 
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'var(--transition)'
            }}
          >
            ← {t('admin.reports.goBack')}
          </button>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: '950', color: 'var(--text-primary)', letterSpacing: '-3px', margin: 0, lineHeight: '1' }}>{t('admin.reports.title')} <span className="gradient-text">{t('admin.reports.titleCenter')}</span></h1>
          <p style={{ color: 'var(--text-muted)', fontWeight: '800', marginTop: '1rem', letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.9rem' }}>{t('admin.reports.subtitle')}</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', background: 'var(--glass)', padding: '1.2rem', borderRadius: '1.8rem', border: '1px solid var(--glass-border)', flexWrap: 'wrap', boxShadow: 'var(--laminar-shadow)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.65rem', fontWeight: '900', color: 'var(--accent)', letterSpacing: '1px', textTransform: 'uppercase' }}>{t('admin.reports.startDate')}</label>
                <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--input-color)', padding: '0.7rem 1rem', borderRadius: '0.8rem', fontSize: '0.85rem', fontWeight: '800', fontFamily: 'var(--font-main)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.65rem', fontWeight: '900', color: 'var(--accent)', letterSpacing: '1px', textTransform: 'uppercase' }}>{t('admin.reports.endDate')}</label>
                <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--input-color)', padding: '0.7rem 1rem', borderRadius: '0.8rem', fontSize: '0.85rem', fontWeight: '800', fontFamily: 'var(--font-main)' }} />
            </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="scroll-tabs" style={{ marginBottom: '3rem', background: 'var(--glass)', padding: '0.5rem', borderRadius: '100px', border: '1px solid var(--glass-border)', display: 'flex', gap: '0.5rem', width: 'fit-content', flexWrap: 'wrap', boxShadow: 'var(--laminar-shadow)' }}>
        {[
          { id: 'overview', name: t('admin.reports.tabs.overview'), icon: '📊' },
          { id: 'sales', name: t('admin.reports.tabs.sales'), icon: '💰' },
          { id: 'inventory', name: t('admin.reports.tabs.inventory'), icon: '📦' },
          { id: 'vouchers', name: t('admin.reports.tabs.vouchers'), icon: '📑' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.9rem 2rem', 
              background: activeTab === tab.id ? 'var(--text-primary)' : 'transparent',
              color: activeTab === tab.id ? 'var(--midnight)' : 'var(--text-muted)', 
              border: 'none', 
              borderRadius: '100px',
              fontWeight: '950', 
              cursor: 'pointer', 
              fontSize: '0.8rem', 
              letterSpacing: '1px', 
              transition: 'var(--transition)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            className={activeTab === tab.id ? 'tab-btn-active' : 'tab-btn-inactive'}
          >
            <span style={{ fontSize: '1rem' }}>{tab.icon}</span> {tab.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: '10rem', textAlign: 'center' }}>
            <div className="spinner" style={{ width: '50px', height: '50px', border: '5px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 2rem' }}></div>
            <div style={{ fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: '900', letterSpacing: '2px' }}>{t('admin.reports.analyzing')}</div>
        </div>
      ) : (
        <main>
          {activeTab === 'overview' && (
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
                {[
                  { label: t('admin.reports.overviewStats.revenue'), value: reportData.stats.totalRevenue, color: 'var(--color-info)', desc: t('admin.reports.overviewStats.revenueDesc') },
                  { label: t('admin.reports.overviewStats.avgBasket'), value: reportData.stats.avgOrder, color: 'var(--color-success)', desc: t('admin.reports.overviewStats.avgBasketDesc') },
                  { label: t('admin.reports.overviewStats.efficiency'), value: reportData.stats.efficiency, color: 'var(--accent)', desc: t('admin.reports.overviewStats.efficiencyDesc') },
                  { label: t('admin.reports.overviewStats.activeDevices'), value: '12', color: 'var(--text-primary)', desc: t('admin.reports.overviewStats.activeDevicesDesc') }
                ].map((s, i) => (
                  <div key={i} className="prism-glass holographic" style={{ padding: '3.5rem 2.5rem', borderRadius: '3rem', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '260px', border: 'var(--card-border)', boxShadow: 'var(--laminar-shadow)', transition: 'var(--transition)' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '950', letterSpacing: '2.5px', marginBottom: '1.5rem', textTransform: 'uppercase', opacity: 0.8 }}>{s.label}</div>
                      <div style={{ fontSize: '3.8rem', fontWeight: '950', color: s.color, letterSpacing: '-2px', lineHeight: '1', marginBottom: '1rem' }}>{s.value}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '700', lineHeight: '1.4' }}>{s.desc}</div>
                    </div>
                    <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '4px', background: s.color, opacity: 0.4 }}></div>
                  </div>
                ))}
             </div>
          )}

          {activeTab === 'sales' && (
            <div className="glass-card prism-glass" style={{ padding: '3rem', borderRadius: '3rem', border: 'var(--card-border)', boxShadow: 'var(--laminar-shadow)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1.5rem' }}>
                <h3 style={{ color: 'var(--text-primary)', fontSize: '1.8rem', fontWeight: '950', letterSpacing: '-1px', margin: 0 }}>{t('admin.reports.salesPerformance')}</h3>
                <button onClick={handleExportCSV} className="btn-primary" style={{ padding: '0.8rem 1.8rem', cursor: 'pointer', borderRadius: '100px', fontWeight: '950', letterSpacing: '1px', fontSize: '0.8rem', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'var(--transition)' }}>📥 {t('admin.reports.exportCsv')}</button>
              </div>
              <div className="table-responsive" style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-primary)' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                        <th style={{ padding: '1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase' }}>{t('admin.reports.table.refNo')}</th>
                        <th style={{ padding: '1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase' }}>{t('admin.reports.table.barcode')}</th>
                        <th style={{ padding: '1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase' }}>{t('admin.reports.table.qty')}</th>
                        <th style={{ padding: '1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase' }}>{t('admin.reports.table.type')}</th>
                        <th style={{ padding: '1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase' }}>{t('admin.reports.table.status')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.sales.length > 0 ? reportData.sales.map((item, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'var(--transition)' }} className="table-row-hover">
                          <td style={{ padding: '1.5rem', fontWeight: '950', fontSize: '1.05rem' }}>{item.order_id || item.id}</td>
                          <td style={{ padding: '1.5rem', color: 'var(--text-secondary)', fontWeight: '700' }}>{item.barcode}</td>
                          <td style={{ padding: '1.5rem', color: 'var(--accent)', fontWeight: '950', fontSize: '1.15rem' }}>{item.quantity}</td>
                          <td style={{ padding: '1.5rem', color: 'var(--text-muted)', fontWeight: '800' }}>{item.location || 'Satış'}</td>
                          <td style={{ padding: '1.5rem' }}>
                              <span style={{ padding: '0.4rem 1rem', borderRadius: '100px', background: 'var(--color-success-bg)', color: 'var(--color-success)', fontSize: '0.7rem', fontWeight: '950', border: '1px solid var(--color-success)', display: 'inline-block' }}>{t('admin.reports.completed')}</span>
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan="5" style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '900', fontSize: '1rem', letterSpacing: '1px' }}>{t('admin.reports.noDataPeriod')}</td></tr>
                      )}
                    </tbody>
                  </table>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
               {reportData.inventory.length > 0 ? reportData.inventory.map((stock, i) => (
                 <div key={i} className="prism-glass" style={{ padding: '3rem 2.5rem', borderRadius: '3rem', border: 'var(--card-border)', boxShadow: 'var(--laminar-shadow)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '260px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '950', color: 'var(--text-muted)', letterSpacing: '1px' }}>{stock.sku}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-success)', fontWeight: '950', background: 'var(--color-success-bg)', padding: '0.4rem 1rem', borderRadius: '100px', border: '1px solid var(--color-success)' }}>{t('admin.reports.activeStock')}</span>
                      </div>
                      <h4 style={{ color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: '950', marginBottom: '2.5rem', letterSpacing: '-0.5px', lineHeight: '1.2' }}>{stock.product_name}</h4>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                       <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '900', marginBottom: '0.5rem', letterSpacing: '1px', textTransform: 'uppercase' }}>{t('admin.reports.currentQty')}</div>
                          <div style={{ fontSize: '3.2rem', fontWeight: '950', color: 'var(--text-primary)', lineHeight: '1', letterSpacing: '-1px' }}>{stock.quantity}</div>
                       </div>
                       <div style={{ height: '50px', width: '100px', display: 'flex', alignItems: 'flex-end', gap: '5px' }}>
                          {[20, 50, 30, 80, 40, 60, 45].map((h, j) => <div key={j} style={{ flex: 1, height: `${h}%`, background: 'var(--accent)', borderRadius: '2px', opacity: 0.4 + (j/12) }}></div>)}
                       </div>
                    </div>
                 </div>
               )) : (
                <div className="prism-glass" style={{ gridColumn: '1/-1', padding: '5rem', textAlign: 'center', borderRadius: '3rem', border: 'var(--card-border)' }}>
                  <div style={{ color: 'var(--text-muted)', fontWeight: '900', fontSize: '1.1rem', letterSpacing: '1px' }}>{t('admin.reports.noRecords')}</div>
                </div>
               )}
            </div>
          )}

          {activeTab === 'vouchers' && (
            <div className="glass-card prism-glass" style={{ padding: '3rem', borderRadius: '3rem', border: 'var(--card-border)', boxShadow: 'var(--laminar-shadow)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1.5rem' }}>
                <h3 style={{ color: 'var(--text-primary)', fontSize: '1.8rem', fontWeight: '950', letterSpacing: '-1px', margin: 0 }}>{t('admin.reports.voucherArchive')}</h3>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '800', background: 'var(--glass)', padding: '0.5rem 1.2rem', borderRadius: '100px', border: '1px solid var(--glass-border)' }}>{t('admin.reports.totalListed').replace('{count}', reportData.vouchers.length)}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                {reportData.vouchers.length > 0 ? reportData.vouchers.map((v, i) => (
                  <div key={i} className="list-item-hover prism-glass" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2rem', borderRadius: '2rem', border: '1px solid var(--glass-border)', transition: 'var(--transition)', flexWrap: 'wrap', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ fontSize: '1.6rem', background: 'var(--glass)', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '1.2rem', border: '1px solid var(--glass-border)' }}>📑</div>
                      <div>
                        <div style={{ color: 'var(--text-primary)', fontWeight: '950', fontSize: '1.2rem', marginBottom: '0.2rem' }}>{v.order_id || v.id} <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>/</span> {v.product_name || v.brand}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '800' }}>{t('admin.reports.table.barcode')}: {v.barcode} • {v.location || 'İrsaliye'}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', minWidth: '120px' }}>
                      <div style={{ color: 'var(--accent)', fontWeight: '950', fontSize: '1.6rem', lineHeight: '1' }}>{v.quantity} <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-secondary)' }}>{t('admin.reports.pcs')}</span></div>
                      <div style={{ color: 'var(--color-success)', fontSize: '0.7rem', fontWeight: '900', marginTop: '0.4rem', letterSpacing: '1px', textTransform: 'uppercase' }}>SYSTEM_PRINT_SUCCESS</div>
                    </div>
                  </div>
                )) : (
                    <div style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '900', fontSize: '1.1rem', letterSpacing: '1px' }}>{t('admin.reports.noRecords')}</div>
                )}
              </div>
            </div>
          )}
        </main>
      )}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .table-row-hover:hover { background: var(--glass) !important; transform: scale(1.002); }
        .list-item-hover:hover { background: var(--glass) !important; border-color: var(--accent-glow) !important; transform: translateX(5px); }
        .btn-back-premium:hover { background: var(--text-primary) !important; color: var(--midnight) !important; border-color: transparent !important; }
        .tab-btn-inactive:hover { color: var(--text-primary) !important; background: var(--glass) !important; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(var(--calendar-indicator-invert, 1)); cursor: pointer; }
        :root.light-mode {
          --calendar-indicator-invert: 0;
        }
      `}</style>
    </div>
  );
};

export default AdminReports;
