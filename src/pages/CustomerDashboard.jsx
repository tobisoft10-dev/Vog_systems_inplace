import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Link, useNavigate } from 'react-router-dom';
import API_BASE_URL from '../services/apiConfig';

const CustomerDashboard = () => {
    const { t, currentUser, setCurrentUser, themeMode } = useLanguage();
    const navigate = useNavigate();
    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobileView(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    const [stocks, setStocks] = useState([]);
    const [statsData, setStatsData] = useState({
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        stockAlerts: 0
    });
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const brand = currentUser?.brand || "VOG";

    useEffect(() => {
        setLoading(true);
        Promise.all([
            fetch(`${API_BASE_URL}/api/stocks/${brand}`).then(res => res.json()),
            fetch(`${API_BASE_URL}/api/customer/stats?brand=${brand}`).then(res => res.json()),
            fetch(`${API_BASE_URL}/api/orders/list?brand=${brand}&limit=2`).then(res => res.json())
        ])
        .then(([stockData, statsRes, ordersRes]) => {
            if (stockData.success) setStocks(stockData.data);
            if (statsRes.success) setStatsData(statsRes.data);
            if (ordersRes.success) setRecentOrders(ordersRes.data.slice(0, 2));
            setLoading(false);
        })
        .catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, [brand]);

    const stats = [
        { label: t('customer.orders'), value: statsData.totalOrders.toString(), icon: '📦' },
        { label: t('customer.pendingOrders').toUpperCase(), value: statsData.pendingOrders.toString(), icon: '⏳' },
        { label: t('customer.stockAlerts').toUpperCase(), value: statsData.stockAlerts.toString(), icon: '⚠️' }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
            <header className="glass-card" style={{ 
                padding: isMobileView ? '2rem 1.5rem' : '4rem', 
                borderRadius: '4px', 
                background: themeMode === 'light' ? 'rgba(15, 23, 42, 0.01)' : 'rgba(255,255,255,0.02)',
                border: '1px solid var(--glass-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: isMobileView ? '1.5rem' : '2.5rem',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 50px 100px rgba(0,0,0,0.4)'
            }}>
                <div style={{ position: 'relative', zIndex: 1, flex: isMobileView ? '1 1 100%' : '1 1 500px' }}>
                    <span style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: '900', 
                        color: 'var(--text-primary)', 
                        background: 'var(--accent)', 
                        padding: '0.5rem 1.2rem', 
                        borderRadius: '4px',
                        display: 'inline-block',
                        marginBottom: '1.5rem',
                        letterSpacing: '2px'
                    }}>
                          {brand.toUpperCase()} {t('customer.globalPortal').toUpperCase()}
                    </span>
                    <h1 style={{ fontSize: isMobileView ? '2rem' : 'clamp(2.5rem, 5vw, 4rem)', marginBottom: '1rem', color: 'var(--text-primary)', fontWeight: '950', letterSpacing: '-1.5px', lineHeight: '1.1' }}>
                        {t('common.welcome')}, <br/>
                        <span className="gradient-text">{currentUser?.name.split(' ')[0] || t('customer.defaultName')}</span>
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', fontSize: '1rem', lineHeight: '1.5' }}>
                        {t('customer.zaraWelcomeDesc')}
                    </p>
                </div>
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: '1rem', alignItems: 'center', width: isMobileView ? '100%' : 'auto' }}>
                    <Link to="/customer/new-order" className="btn-primary" style={{ padding: isMobileView ? '1.2rem' : '1.8rem 4rem', fontSize: '1rem', background: 'var(--text-primary)', color: 'var(--midnight)', boxShadow: 'var(--laminar-shadow)', width: '100%', textAlign: 'center', display: 'block' }}>
                        {t('customer.newOrder').toUpperCase()}
                    </Link>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: isMobileView ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))', gap: isMobileView ? '1.2rem' : '2rem' }}>
                {stats.map(stat => (
                    <div key={stat.label} 
                      className="prism-glass holographic" 
                      style={{ 
                        padding: isMobileView ? '1.8rem 1.5rem' : '3rem 2.5rem', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: isMobileView ? '1.5rem' : '2.5rem', 
                        borderRadius: '4px',
                        transition: 'var(--transition)'
                      }}
                      onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = ((e.clientX - rect.left) / rect.width) * 100;
                        const y = ((e.clientY - rect.top) / rect.height) * 100;
                        e.currentTarget.style.setProperty('--mouse-x', `${x}%`);
                        e.currentTarget.style.setProperty('--mouse-y', `${y}%`);
                      }}
                    >
                        <span style={{ fontSize: isMobileView ? '2.5rem' : '4rem', filter: 'drop-shadow(0 0 15px rgba(255,255,255,0.2))' }}>{stat.icon}</span>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '950' }}>{stat.label}</div>
                            <div style={{ fontSize: isMobileView ? '1.8rem' : '2.5rem', fontWeight: '950', color: 'var(--text-primary)', letterSpacing: '-1px', lineHeight: '1' }}>{stat.value}</div>
                        </div>
                    </div>
                ))}
            </div>

                     <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                <div className="glass" style={{ padding: isMobileView ? '1.5rem' : '3rem', background: 'var(--glass)' }}>
                    <h3 style={{ marginBottom: isMobileView ? '1.5rem' : '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-primary)', fontWeight: '900', letterSpacing: '1px', flexWrap: 'wrap', gap: '1rem' }}>
                        <span>{t('customer.logisticsTracking').toUpperCase()}</span>
                        <Link to="/customer/orders" style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: '900', letterSpacing: '1px', textDecoration: 'none' }}>{t('customer.viewAll').toUpperCase()} →</Link>
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                          {recentOrders.map(pipe => (
                              <div key={pipe.id} style={{ padding: '2rem', borderRadius: '4px', background: 'var(--input-bg)', border: '1px solid var(--input-border)' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                      <div>
                                          <div style={{ fontWeight: '900', color: 'var(--accent)', fontSize: '0.8rem', letterSpacing: '2px' }}>#{pipe.id}</div>
                                          <div style={{ fontWeight: '900', fontSize: '1.4rem', color: 'var(--text-primary)' }}>{pipe.product_name}</div>
                                      </div>
                                      <div style={{ textAlign: 'right' }}>
                                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '1px' }}>{t('customer.status')}</div>
                                          <div style={{ fontWeight: '900', color: 'var(--text-primary)' }}>{t(`statuses.${pipe.status.toLowerCase()}`).toUpperCase()}</div>
                                      </div>
                                  </div>
                                  <div style={{ height: '12px', background: 'var(--border-subtle)', borderRadius: '6px', overflow: 'hidden' }}>
                                      <div style={{ width: `${pipe.status === 'pending' ? 10 : pipe.status === 'completed' ? 100 : 50}%`, height: '100%', background: 'var(--accent)', transition: 'width 1.2s cubic-bezier(0.23, 1, 0.32, 1)', boxShadow: '0 0 15px var(--accent)' }}></div>
                                  </div>
                                   <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '700' }}>
                                       <span>{t('customer.quantity')}: {pipe.quantity}</span>
                                       <span>{t('customer.estDelivery')}: {pipe.estimated_delivery_date}</span>
                                   </div>
                              </div>
                          ))}
                          {recentOrders.length === 0 && <div style={{ color: 'var(--text-muted)', padding: '2rem' }}>{t('customer.noActiveOrders')}</div>}
                    </div>
                </div>

                <div className="glass" style={{ padding: isMobileView ? '1.5rem' : '3rem', background: 'var(--glass)' }}>
                    <h3 style={{ marginBottom: isMobileView ? '1.5rem' : '2rem', color: 'var(--text-primary)', fontWeight: '900', letterSpacing: '1px' }}>{t('customer.inventoryStatus').toUpperCase()}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        {stocks.map(item => (
                            <div key={item.id} style={{ 
                                padding: '1.5rem', 
                                borderRadius: '4px', 
                                background: 'var(--input-bg)', 
                                border: `1px solid ${item.quantity < item.min_stock_level ? 'rgba(212, 175, 55,0.3)' : 'var(--input-border)'}` 
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ fontWeight: '800', color: 'var(--text-primary)' }}>{item.product_name}</span>
                                    <span style={{ fontWeight: '950', color: item.quantity < item.min_stock_level ? 'var(--accent)' : 'var(--color-success)' }}>
                                        {item.quantity} {t('customer.pcs').toUpperCase()}
                                    </span>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>SKU: {item.sku}</div>
                                {item.quantity < item.min_stock_level && (
                                    <div style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: '900', marginTop: '0.5rem' }}>⚠️ {t('customer.criticalStock').toUpperCase()}</div>
                                )}
                            </div>
                        ))}
                        {loading && <div style={{ color: 'var(--text-secondary)' }}>{t('common.loading')}</div>}
                    </div>
                    <Link to="/customer/new-order" className="btn-primary" style={{ marginTop: '2rem', width: '100%', display: 'block', textAlign: 'center', background: 'var(--accent)', color: brand === 'ZARA' ? 'var(--midnight)' : 'var(--text-primary)', textDecoration: 'none', padding: '1.2rem', borderRadius: '4px', fontWeight: '900' }}>
                        {t('customer.completeStock').toUpperCase()}
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default CustomerDashboard;
