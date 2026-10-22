import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import API_BASE_URL from '../services/apiConfig';

const CustomerShipmentTracking = () => {
    const { t, currentUser } = useLanguage();
    // Live mode states
    const [liveOrder, setLiveOrder] = useState(null);
    
    const shipments = [
        { id: 'SH-2026-901', date: '2026-05-14', status: 'IN_TRANSIT', carrier: 'DHL Express', destination: 'Paris Hub', items: 450, tracking: 'JD123456789' },
        { id: 'SH-2026-885', date: '2026-05-10', status: 'DELIVERED', carrier: 'FedEx', destination: 'Lyon Distribution', items: 1200, tracking: 'FX987654321' },
        { id: 'SH-2026-842', date: '2026-05-01', status: 'DELIVERED', carrier: 'UPS', destination: 'Marseille Store', items: 320, tracking: '1Z99999999' }
    ];

    // Live PostgreSQL Polling
    useEffect(() => {
        const fetchLiveTracking = () => {
            if (!currentUser?.brand) return;
            fetch(`${API_BASE_URL}/api/rfid/live-tracking?brand=${currentUser.brand}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success && data.hasActiveOrder) {
                        setLiveOrder(data.order);
                    } else {
                        // Fallback placeholder if no active orders in DB
                        setLiveOrder({
                            id: 'VO-0000',
                            product: `${currentUser?.brand} ${t('tracking.noActiveOrders')}`,
                            target: 500,
                            tunnelCount: 0,
                            status: t('tracking.standby')
                        });
                    }
                })
                .catch(err => {
                    console.error('Error fetching live RFID reads:', err);
                });
        };

        fetchLiveTracking();
        const interval = setInterval(fetchLiveTracking, 2000);
        return () => clearInterval(interval);
    }, [currentUser]);

    const activeOrder = liveOrder || {
        id: t('tracking.loadingId'),
        product: t('tracking.searchingRFID'),
        target: 500,
        tunnelCount: 0,
        status: t('tracking.connecting')
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '3.5rem', fontWeight: '950', color: 'var(--text-primary)', letterSpacing: '-2px' }}>
                        {t('customer.logisticsTracking')}
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>{t('tracking.subtitle')}</p>
                </div>
            </header>

            {/* Active Production Tracking */}
            <div className="glass-card" style={{ padding: '3rem', borderRadius: '4px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.03)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, right: 0, padding: '2rem', textAlign: 'right' }}>
                    <span style={{ 
                        fontSize: '0.7rem', 
                        fontWeight: '900', 
                        color: 'var(--color-info)', 
                        letterSpacing: '2px', 
                        background: 'rgba(0,243,255,0.1)', 
                        padding: '0.6rem 1.2rem', 
                        borderRadius: '100px', 
                        border: '1px solid rgba(0,243,255,0.2)' 
                    }}>
                        {t('tracking.liveTunnel')}
                    </span>
                </div>

                <div style={{ display: 'flex', gap: '4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ width: '200px', height: '200px', position: 'relative', margin: '0 auto' }}>
                        <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                            <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                            <circle cx="50" cy="50" r="45" fill="none" stroke="#00f3ff" strokeWidth="8" strokeDasharray={`${(activeOrder.tunnelCount/activeOrder.target)*282} 282`} strokeLinecap="round" style={{ transition: 'all 1s ease' }} />
                        </svg>
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: '950', color: 'var(--text-primary)' }}>{Math.round((activeOrder.tunnelCount/activeOrder.target)*100)}%</div>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: '900' }}>{t('tracking.scanned')}</div>
                        </div>
                    </div>

                    <div style={{ flex: 1, minWidth: '300px' }}>
                        <h3 style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{activeOrder.product}</h3>
                        <div style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>{t('admin.orders.table.id')}: {activeOrder.order_number || (typeof activeOrder.id === 'string' && activeOrder.id.length > 8 ? activeOrder.id.substring(0, 8).toUpperCase() : activeOrder.id)} • {t('tracking.destination')}: {currentUser?.brand} {t('tracking.globalHub')}</div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
                            <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '800', marginBottom: '0.5rem' }}>{t('tracking.totalOrder')}</div>
                                <div style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--text-primary)' }}>{activeOrder.target} <small style={{ fontSize: '0.7rem' }}>{t('customer.pcs').toUpperCase()}</small></div>
                            </div>
                            <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '800', marginBottom: '0.5rem' }}>{t('tracking.tunnelPassed')}</div>
                                <div style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--color-info)' }}>{activeOrder.tunnelCount} <small style={{ fontSize: '0.7rem' }}>{t('customer.pcs').toUpperCase()}</small></div>
                            </div>
                            <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '800', marginBottom: '0.5rem' }}>{t('tracking.remaining')}</div>
                                <div style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--text-primary)' }}>{Math.max(0, activeOrder.target - activeOrder.tunnelCount)} <small style={{ fontSize: '0.7rem' }}>{t('customer.pcs').toUpperCase()}</small></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Shipment History */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: '950', color: 'var(--text-primary)', letterSpacing: '-1px' }}>{t('customer.orderHistory')}</h2>
                <div className="glass-card" style={{ padding: '0', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <div className="table-responsive">
<table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <th style={{ padding: '1.5rem 2rem', fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-muted)', letterSpacing: '1px' }}>{t('tracking.idDate')}</th>
                                    <th style={{ padding: '1.5rem 2rem', fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-muted)', letterSpacing: '1px' }}>{t('tracking.destination')}</th>
                                    <th style={{ padding: '1.5rem 2rem', fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-muted)', letterSpacing: '1px' }}>{t('tracking.items')}</th>
                                    <th style={{ padding: '1.5rem 2rem', fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-muted)', letterSpacing: '1px' }}>{t('tracking.status')}</th>
                                    <th style={{ padding: '1.5rem 2rem', fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-muted)', letterSpacing: '1px', textAlign: 'right' }}>{t('tracking.tracking')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {shipments.map(s => (
                                    <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                        <td style={{ padding: '2rem' }}>
                                            <div style={{ fontWeight: '900', color: 'var(--text-primary)' }}>{s.id}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>{s.date}</div>
                                        </td>
                                        <td style={{ padding: '2rem', fontWeight: '700', color: 'rgba(255,255,255,0.6)' }}>{s.destination}</td>
                                        <td style={{ padding: '2rem', fontWeight: '900', color: 'var(--text-primary)' }}>{s.items}</td>
                                        <td style={{ padding: '2rem' }}>
                                            <span style={{ 
                                                padding: '0.4rem 1rem', borderRadius: '100px', fontSize: '0.65rem', fontWeight: '950',
                                                background: s.status === 'DELIVERED' ? 'rgba(0,255,100,0.1)' : 'rgba(0,243,255,0.1)',
                                                color: s.status === 'DELIVERED' ? '#00ff64' : '#00f3ff',
                                                border: `1px solid ${s.status === 'DELIVERED' ? 'rgba(0,255,100,0.2)' : 'rgba(0,243,255,0.2)'}`
                                            }}>
                                                {t(`tracking.statuses.${s.status.toLowerCase()}`).toUpperCase()}
                                            </span>
                                        </td>
                                        <td style={{ padding: '2rem', textAlign: 'right' }}>
                                            <div style={{ fontSize: '0.8rem', fontWeight: '900', color: 'var(--text-primary)' }}>{s.tracking}</div>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--color-info)', cursor: 'pointer', marginTop: '0.3rem' }}>{t('tracking.trackLive')}</div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerShipmentTracking;
