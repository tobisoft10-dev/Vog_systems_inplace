import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

function CEODashboard() {
    const { t, themeMode } = useLanguage();
    const [metrics, setMetrics] = useState({
        totalOrders: 0,
        pendingOrders: 0,
        totalRevenue: 0,
        activeBranches: 0
    });
    const [hardware, setHardware] = useState({
        tunnelStatus: 'Unknown',
        sorterStatus: 'Unknown',
        scansLast24h: 0
    });
    const [loading, setLoading] = useState(true);

    const API_BASE_URL = '';

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [metricsRes, hardwareRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/api/ceo/metrics`),
                    fetch(`${API_BASE_URL}/api/ceo/hardware-health`)
                ]);
                
                if (metricsRes.ok) {
                    const mData = await metricsRes.json();
                    if (mData.success) setMetrics(mData.data);
                }
                
                if (hardwareRes.ok) {
                    const hData = await hardwareRes.json();
                    if (hData.success) setHardware(hData.data);
                }
            } catch (error) {
                console.error("Error fetching CEO dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 30000); // refresh every 30s
        return () => clearInterval(interval);
    }, []);

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { duration: 0.5, staggerChildren: 0.1 }
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '3rem', height: '3rem', borderTop: '2px solid #c5a059', borderBottom: '2px solid #c5a059', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            </div>
        );
    }

    const statCards = [
        { label: t('admin.ceo.totalRevenue'), value: `₺${metrics.totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`, color: '#D4AF37', icon: '💰' },
        { label: t('admin.ceo.totalOrders'), value: metrics.totalOrders, color: '#00f3ff', icon: '📦' },
        { label: t('admin.ceo.pendingOrders'), value: metrics.pendingOrders, color: '#ffaa00', icon: '⏳' },
        { label: t('admin.ceo.activeBranches'), value: metrics.activeBranches, color: '#10b981', icon: '🏢' }
    ];

    return (
        <motion.div 
            className="admin-dashboard-premium"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            style={{
                background: themeMode === 'light' ? 'rgba(15, 23, 42, 0.01)' : 'rgba(255,255,255,0.01)',
                minHeight: '85vh',
                padding: '3rem 4rem',
                borderRadius: '4rem',
                color: 'var(--text-primary)',
                position: 'relative',
                overflow: 'hidden',
                border: themeMode === 'light' ? '1px solid rgba(15, 23, 42, 0.06)' : '1px solid rgba(255,255,255,0.05)',
                boxShadow: themeMode === 'light' ? '0 40px 80px rgba(15,23,42,0.04)' : '0 80px 150px rgba(0,0,0,0.6)',
                maxWidth: '1400px',
                margin: '0 auto'
            }}
        >
            {/* Background Ambient Glows */}
            <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(197,160,89,0.15) 0%, transparent 70%)', filter: 'blur(80px)', zIndex: 0 }}></div>
            <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(0,243,255,0.05) 0%, transparent 70%)', filter: 'blur(80px)', zIndex: 0 }}></div>
            
            <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ marginBottom: '4rem', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1.5rem' }}>
                    <h1 style={{ fontSize: '3.5rem', marginBottom: '0.5rem', color: 'var(--text-primary)', letterSpacing: '-2px', fontWeight: '900', background: '-webkit-linear-gradient(45deg, #c5a059, #f3e5c8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        {t('admin.ceo.title')}
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', fontWeight: '500' }}>
                        {t('admin.ceo.subtitle')}
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
                    {statCards.map((stat, idx) => (
                        <motion.div key={idx} variants={cardVariants} 
                            className="prism-glass holographic" 
                            style={{ 
                                padding: '2.2rem 1.8rem', 
                                display: 'flex', 
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                gap: '1.2rem', 
                                borderRadius: '2.5rem',
                                position: 'relative',
                                overflow: 'hidden',
                                minHeight: '190px',
                                background: themeMode === 'light' ? '#ffffff' : 'rgba(255, 255, 255, 0.02)',
                                border: themeMode === 'light' ? '1px solid rgba(15, 23, 42, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)',
                                transition: 'transform 0.3s ease, box-shadow 0.3s ease'
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
                            }}
                        >
                            <div style={{ position: 'absolute', top: '0', right: '0', width: '150px', height: '150px', background: `radial-gradient(circle, ${stat.color}15 0%, transparent 70%)`, filter: 'blur(20px)', zIndex: 0, margin: '-20px -20px 0 0' }}></div>
                            <div style={{ position: 'absolute', top: '0', left: '0', width: '100%', height: '4px', background: `linear-gradient(90deg, ${stat.color}, transparent)`, zIndex: 10 }}></div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', position: 'relative', zIndex: 1, gap: '1rem' }}>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: '800', letterSpacing: '1.5px', textTransform: 'uppercase', wordBreak: 'break-word', flex: 1 }}>
                                    {stat.label}
                                </div>
                                <div style={{ fontSize: '1.8rem', opacity: 0.8, color: stat.color }}>{stat.icon}</div>
                            </div>
                            <div style={{ 
                                fontSize: stat.value.toString().length > 12 
                                    ? '1.5rem' 
                                    : (stat.value.toString().length > 8 ? '1.9rem' : '2.8rem'),
                                fontWeight: '950', 
                                color: stat.color, 
                                lineHeight: '1.1', 
                                letterSpacing: '-1.5px',
                                wordBreak: 'break-word',
                                position: 'relative',
                                zIndex: 1,
                                width: '100%',
                                marginTop: '0.5rem'
                            }}>
                                {stat.value}
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '3rem' }}>
                    {/* Hardware Health Section */}
                    <motion.div variants={cardVariants} className="prism-glass holographic" style={{ padding: '2.5rem', borderRadius: '2.5rem', background: themeMode === 'light' ? '#ffffff' : 'rgba(255, 255, 255, 0.02)', border: themeMode === 'light' ? '1px solid rgba(15, 23, 42, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '2rem', borderBottom: `1px solid ${themeMode === 'light' ? 'rgba(15,23,42,0.06)' : 'rgba(255,255,255,0.05)'}`, paddingBottom: '1rem', letterSpacing: '-0.5px' }}>
                            {t('admin.ceo.hardware.title')}
                        </h2>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', background: themeMode === 'light' ? 'rgba(15, 23, 42, 0.02)' : 'rgba(255,255,255,0.01)', borderRadius: '1.5rem', border: themeMode === 'light' ? '1px solid rgba(15, 23, 42, 0.05)' : '1px solid rgba(255,255,255,0.05)' }}>
                                <div>
                                    <h4 style={{ color: 'var(--text-primary)', fontWeight: '750', fontSize: '1.1rem' }}>{t('admin.ceo.hardware.tunnelTitle')}</h4>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.3rem', fontWeight: '500' }}>{t('admin.ceo.hardware.tunnelDesc')}</p>
                                </div>
                                <div style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '0.6rem', 
                                  padding: '0.4rem 0.8rem', 
                                  borderRadius: '100px', 
                                  background: hardware.tunnelStatus === 'Connected' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                                  border: `1px solid ${hardware.tunnelStatus === 'Connected' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}`
                                }}>
                                    <span style={{ 
                                      width: '8px', 
                                      height: '8px', 
                                      borderRadius: '50%', 
                                      background: hardware.tunnelStatus === 'Connected' ? '#10b981' : '#ef4444', 
                                      boxShadow: hardware.tunnelStatus === 'Connected' ? '0 0 10px #10b981' : '0 0 10px #ef4444',
                                      display: 'inline-block'
                                    }}></span>
                                    <span style={{ fontSize: '0.8rem', color: hardware.tunnelStatus === 'Connected' ? '#10b981' : '#ef4444', fontWeight: '800' }}>
                                      {hardware.tunnelStatus === 'Connected' ? 'BAĞLI' : 'ÇEVRİMDIŞI'}
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', background: themeMode === 'light' ? 'rgba(15, 23, 42, 0.02)' : 'rgba(255,255,255,0.01)', borderRadius: '1.5rem', border: themeMode === 'light' ? '1px solid rgba(15, 23, 42, 0.05)' : '1px solid rgba(255,255,255,0.05)' }}>
                                <div>
                                    <h4 style={{ color: 'var(--text-primary)', fontWeight: '750', fontSize: '1.1rem' }}>{t('admin.ceo.hardware.sorterTitle')}</h4>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.3rem', fontWeight: '500' }}>{t('admin.ceo.hardware.sorterDesc')}</p>
                                </div>
                                <div style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '0.6rem', 
                                  padding: '0.4rem 0.8rem', 
                                  borderRadius: '100px', 
                                  background: hardware.sorterStatus === 'Operational' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                                  border: `1px solid ${hardware.sorterStatus === 'Operational' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}`
                                }}>
                                    <span style={{ 
                                      width: '8px', 
                                      height: '8px', 
                                      borderRadius: '50%', 
                                      background: hardware.sorterStatus === 'Operational' ? '#10b981' : '#ef4444', 
                                      boxShadow: hardware.sorterStatus === 'Operational' ? '0 0 10px #10b981' : '0 0 10px #ef4444',
                                      display: 'inline-block'
                                    }}></span>
                                    <span style={{ fontSize: '0.8rem', color: hardware.sorterStatus === 'Operational' ? '#10b981' : '#ef4444', fontWeight: '800' }}>
                                      {hardware.sorterStatus === 'Operational' ? 'AKTİF' : 'ARIZALI'}
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', background: 'rgba(197,160,89,0.06)', borderRadius: '1.5rem', border: '1px solid rgba(197,160,89,0.15)' }}>
                                <div>
                                    <h4 style={{ color: '#c5a059', fontWeight: '750', fontSize: '1.1rem' }}>{t('admin.ceo.hardware.scansTitle')}</h4>
                                    <p style={{ fontSize: '0.85rem', color: 'rgba(197,160,89,0.8)', marginTop: '0.3rem', fontWeight: '500' }}>{t('admin.ceo.hardware.scansDesc')}</p>
                                </div>
                                <div style={{ fontSize: '2.4rem', fontWeight: '950', color: '#c5a059', letterSpacing: '-1.5px', textShadow: '0 0 20px rgba(197,160,89,0.2)' }}>
                                    {hardware.scansLast24h.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* System Insights Section */}
                    <motion.div variants={cardVariants} className="prism-glass holographic" style={{ padding: '2.5rem', borderRadius: '2.5rem', background: themeMode === 'light' ? '#ffffff' : 'rgba(255, 255, 255, 0.02)', border: themeMode === 'light' ? '1px solid rgba(15, 23, 42, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '2rem', borderBottom: `1px solid ${themeMode === 'light' ? 'rgba(15,23,42,0.06)' : 'rgba(255,255,255,0.05)'}`, paddingBottom: '1rem', letterSpacing: '-0.5px' }}>
                            {t('admin.ceo.aiInsights.title')}
                        </h2>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            <div style={{ padding: '1.5rem', borderLeft: '4px solid #c5a059', background: 'linear-gradient(90deg, rgba(197,160,89,0.08) 0%, transparent 100%)', borderRadius: '0 1.5rem 1.5rem 0' }}>
                                <h4 style={{ color: 'var(--text-primary)', fontWeight: '800', fontSize: '1rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <span style={{ fontSize: '1.1rem' }}>🔮</span> {t('admin.ceo.aiInsights.predictiveTitle')}
                                </h4>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5', fontWeight: '500' }} dangerouslySetInnerHTML={{ __html: t('admin.ceo.aiInsights.predictiveDesc') }} />
                            </div>
                            
                            <div style={{ padding: '1.5rem', borderLeft: '4px solid #00f3ff', background: 'linear-gradient(90deg, rgba(0,243,255,0.06) 0%, transparent 100%)', borderRadius: '0 1.5rem 1.5rem 0' }}>
                                <h4 style={{ color: 'var(--text-primary)', fontWeight: '800', fontSize: '1rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <span style={{ fontSize: '1.1rem' }}>🤖</span> {t('admin.ceo.aiInsights.logoTitle')}
                                </h4>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5', fontWeight: '500' }}>
                                    {t('admin.ceo.aiInsights.logoDesc')}
                                </p>
                            </div>

                            <div style={{ padding: '1.5rem', borderLeft: '4px solid #10b981', background: 'linear-gradient(90deg, rgba(16,185,129,0.06) 0%, transparent 100%)', borderRadius: '0 1.5rem 1.5rem 0' }}>
                                <h4 style={{ color: 'var(--text-primary)', fontWeight: '800', fontSize: '1rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <span style={{ fontSize: '1.1rem' }}>🔌</span> {t('admin.ceo.aiInsights.hardwareTitle')}
                                </h4>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5', fontWeight: '500' }} dangerouslySetInnerHTML={{ __html: t('admin.ceo.aiInsights.hardwareDesc') }} />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
}

export default CEODashboard;
