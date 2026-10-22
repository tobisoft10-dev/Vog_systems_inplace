import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const AdminDashboard = () => {
  const { t, themeMode } = useLanguage();
  const navigate = useNavigate();

  const [liveMetrics, setLiveMetrics] = useState({
    totalOrders: 16232,
    pendingOrders: 42,
    totalRevenue: 7285400,
    activeBranches: 18
  });
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = '';

  useEffect(() => {
    const fetchLiveMetrics = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/ceo/metrics`);
        const data = await res.json();
        if (data.success && data.data) {
          setLiveMetrics(data.data);
        }
      } catch (err) {
        console.error('Error fetching admin live metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLiveMetrics();
    const interval = setInterval(fetchLiveMetrics, 15000);
    return () => clearInterval(interval);
  }, []);

  const capacityRatio = liveMetrics.totalOrders > 0
    ? Math.round(((liveMetrics.totalOrders - liveMetrics.pendingOrders) / liveMetrics.totalOrders) * 100)
    : 88;

  const stats = [
    { label: 'TOPLAM CANLI SİPARİŞ', value: liveMetrics.totalOrders.toLocaleString('tr-TR'), trend: 'BSİP Canlı SQL', color: '#00f3ff', icon: '📦', path: '/orders' },
    { label: 'İŞLEM BEKLEYENLER', value: liveMetrics.pendingOrders.toString(), trend: 'Canlı Takip', color: '#ffaa00', icon: '⏳', path: '/orders' },
    { label: t('admin.stats.seatOrder'), value: 'CANLI SEAT', trend: 'RFID Hazır', color: '#D4AF37', icon: '🏎️', path: '/admin/seat' },
    { label: 'TOPLAM HAREKET CİROSU', value: `₺${liveMetrics.totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`, trend: '+18.4%', color: '#D4AF37', icon: '💰', path: '/admin/reports' },
    { label: 'ÜRETİM KAPASİTE ORANI', value: `%${capacityRatio}`, trend: 'Yüksek', color: '#10b981', icon: '↑' },
    { label: 'AKTİF ŞUBE / BAYİLER', value: liveMetrics.activeBranches.toString(), trend: 'Canlı Dağıtım', color: '#10b981', icon: '🏢', path: '/admin/sub-customers' },
    { label: 'ÜRÜN ETİKETLERİ', value: 'Tekil Basım', trend: 'Yazdır', color: '#8b5cf6', icon: '🏷️', path: '/admin/product-labels' },
    { label: 'KOLİ ETİKETLERİ', value: 'Toplu Basım', trend: 'Yazdır', color: '#10b981', icon: '📦', path: '/admin/box-labels' }
  ];

  return (
    <div className="admin-dashboard-premium" style={{
      background: themeMode === 'light' ? 'rgba(15, 23, 42, 0.01)' : 'rgba(255,255,255,0.01)',
      minHeight: '85vh',
      padding: '5rem 4rem',
      borderRadius: '12px',
      color: 'var(--text-primary)',
      position: 'relative',
      overflow: 'hidden',
      border: themeMode === 'light' ? '1px solid rgba(15, 23, 42, 0.06)' : '1px solid rgba(255,255,255,0.05)',
      boxShadow: themeMode === 'light' ? '0 40px 80px rgba(15,23,42,0.04)' : '0 80px 150px rgba(0,0,0,0.6)'
    }}>
      {/* Background Ambient Glows */}
      <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(212, 175, 55,0.15) 0%, transparent 70%)', filter: 'blur(80px)', zIndex: 0 }}></div>
      <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(212,175,55,0.1) 0%, transparent 70%)', filter: 'blur(80px)', zIndex: 0 }}></div>
      
      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '5rem', textAlign: 'left' }}>
          <h1 style={{ fontSize: '4.5rem', marginBottom: '1rem', color: 'var(--text-primary)', letterSpacing: '-3px', fontWeight: '950' }}>
            {t('admin.dashboardTitle')}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.4rem', fontWeight: '500', maxWidth: '800px' }}>
            {t('admin.welcome')}
          </p>
        </div>

        <div className="admin-dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '2rem', marginBottom: '5rem' }}>
          {stats.map(stat => (
            <div key={stat.label} 
              className="prism-glass holographic" 
              style={{ 
                padding: '2.2rem 1.8rem', 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderRadius: '8px',
                transition: '0.4s cubic-bezier(0.23, 1, 0.32, 1)',
                cursor: stat.path ? 'pointer' : 'default',
                position: 'relative',
                overflow: 'hidden',
                minHeight: '230px',
                background: themeMode === 'light' ? '#ffffff' : 'rgba(255, 255, 255, 0.02)',
                border: themeMode === 'light' ? '1px solid rgba(15, 23, 42, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)'
              }}
              onClick={() => stat.path && navigate(stat.path)}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                e.currentTarget.style.setProperty('--mouse-x', `${x}%`);
                e.currentTarget.style.setProperty('--mouse-y', `${y}%`);
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-10px)';
                e.currentTarget.style.boxShadow = themeMode === 'light'
                  ? `0 20px 40px rgba(15,23,42,0.06), 0 0 20px ${stat.color}15`
                  : `0 35px 70px rgba(0,0,0,0.4), 0 0 25px ${stat.color}12`;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '';
              }}>
              <div style={{ position: 'absolute', top: '0', left: '0', width: '100%', height: '4px', background: `linear-gradient(90deg, ${stat.color}, transparent)`, zIndex: 10 }}></div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', gap: '1rem' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: '800', letterSpacing: '1.5px', textTransform: 'uppercase', wordBreak: 'break-word', flex: 1 }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: '1.8rem', color: stat.color, filter: `drop-shadow(0 0 12px ${stat.color}40)`, flexShrink: 0 }}>{stat.icon}</div>
              </div>

              <div style={{ margin: '0.5rem 0', width: '100%' }}>
                <div style={{ 
                  fontSize: typeof stat.value === 'string' && stat.value.length > 10
                    ? '1.8rem'
                    : '2.8rem',
                  fontWeight: '950', 
                  color: stat.color, 
                  lineHeight: '1.1', 
                  letterSpacing: '-1.5px',
                  wordBreak: 'break-word'
                }} title={stat.value}>
                  {stat.value}
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', flexWrap: 'wrap' }}>
                <span style={{ 
                  color: stat.color, 
                  fontWeight: '900', 
                  padding: '0.25rem 0.6rem', 
                  background: `${stat.color}12`, 
                  borderRadius: '6px', 
                  fontSize: '0.65rem', 
                  flexShrink: 0,
                  border: `1px solid ${stat.color}20`
                }}>
                  {stat.trend}
                </span> 
                <span style={{ 
                  fontWeight: '700', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.5px', 
                  fontSize: '0.62rem', 
                  color: 'var(--text-secondary)',
                  whiteSpace: 'normal',
                  wordBreak: 'break-word'
                }}>
                  {t('admin.stats.trend')}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ 
          background: themeMode === 'light' ? 'rgba(15, 23, 42, 0.02)' : 'rgba(255,255,255,0.02)', 
          backdropFilter: 'blur(20px)',
          border: themeMode === 'light' ? '1px solid rgba(15, 23, 42, 0.08)' : '1px solid rgba(255,255,255,0.05)',
          padding: '4rem 2rem', 
          borderRadius: '8px',
          minHeight: '350px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          boxShadow: themeMode === 'light' ? '0 10px 30px rgba(15, 23, 42, 0.04)' : '0 20px 40px rgba(0,0,0,0.3)',
          position: 'relative'
        }}>
          <div style={{ position: 'absolute', top: '0', left: '50%', transform: 'translateX(-50%)', width: '40%', height: '1px', background: themeMode === 'light' ? 'linear-gradient(90deg, transparent, rgba(15,23,42,0.1), transparent)' : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)' }}></div>
          <div style={{ textAlign: 'center', color: 'var(--text-primary)', width: '100%', maxWidth: '800px' }}>
            <h3 style={{ fontSize: '1.8rem', marginBottom: '3rem', fontWeight: '700', letterSpacing: '-0.5px' }}>{t('admin.pipeline')}</h3>
            
            <div style={{ width: '100%', background: themeMode === 'light' ? 'rgba(15, 23, 42, 0.03)' : 'rgba(255,255,255,0.03)', borderRadius: '4px', padding: '6px', border: themeMode === 'light' ? '1px solid rgba(15, 23, 42, 0.1)' : '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ width: '65%', height: '16px', background: 'linear-gradient(90deg, #D4AF37, #D4AF37)', borderRadius: '4px', boxShadow: '0 0 25px rgba(212, 175, 55,0.5)', position: 'relative', transition: 'width 1s ease-in-out' }}>
                <div style={{ position: 'absolute', right: '2px', top: '50%', transform: 'translateY(-50%)', width: '12px', height: '12px', backgroundColor: 'var(--text-primary)', borderRadius: '50%', boxShadow: '0 0 15px rgba(255,255,255,1)' }}></div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '600' }}>
              <span style={{ color: '#D4AF37' }}>{t('admin.pipelineSteps.start')}</span>
              <span style={{ color: '#D4AF37', textShadow: '0 0 10px rgba(212,175,55,0.3)' }}>{t('admin.pipelineSteps.active')}</span>
              <span>{t('admin.pipelineSteps.delivery')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

