import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../services/apiConfig';

const mapStatusToKey = (status) => {
  if (!status) return 'pending';
  const s = status.toLowerCase();
  if (s === 'pending' || s === 'işlem bekliyor' || s === 'islem bekliyor') return 'pending';
  if (s === 'approved' || s === 'onaylandı' || s === 'onaylandi') return 'pending';
  if (s === 'production' || s === 'üretimde' || s === 'uretimde' || s === 'processing' || s === 'kısmi tamamlandı' || s === 'kismi tamamlandi') return 'processing';
  if (s === 'ready' || s === 'hazır' || s === 'hazir' || s === 'sipariş tamamlandı' || s === 'siparis tamamlandi') return 'ready';
  if (s === 'shipped' || s === 'sevk edildi' || s === 'gönderildi' || s === 'gonderildi') return 'shipped';
  if (s === 'completed' || s === 'tamamlandı' || s === 'tamamlandi') return 'completed';
  if (s === 'cancelled' || s === 'iptal edildi' || s === 'iptal') return 'cancelled';
  return s;
};

const parseOrderNotes = (notes) => {
  if (!notes) return { sizes: null, userNotes: '' };
  const match = notes.match(/^\[Bedenler \/ Sizes:\s*([^\]]+)\](?:\s*-\s*(.*))?$/);
  if (match) {
      return {
          sizes: match[1],
          userNotes: match[2] || ''
      };
  }
  return { sizes: null, userNotes: notes };
};

const CustomerOrders = () => {
    const { t, currentUser, themeMode } = useLanguage();
    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobileView(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    const navigate = useNavigate();
    const [trackingId, setTrackingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const brand = currentUser?.brand || "VOG";

    const isLight = themeMode === 'light';

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/orders/list?brand=${brand}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) setOrders(data.data);
                setLoading(false);
            })
            .catch(err => console.error(err));
    }, [brand]);

    const filteredOrders = orders.filter(o => 
        o.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
        o.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.sub_customer_name && o.sub_customer_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleAction = async (id, action) => {
        const actionLabel = action.toUpperCase() === 'CANCELLED' ? t('customer.cancel') : t('customer.return');
        const confirmMsg = t('customer.confirmMsg').replace('{action}', actionLabel);
        if (!window.confirm(confirmMsg)) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/orders/update/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: action })
            });
            const data = await response.json();
            if (data.success) {
                setOrders(prev => prev.map(o => o.id === id ? { ...o, status: action } : o));
            }
        } catch (error) {
            alert(t('customer.actionFailed'));
        }
    };

    const getStatusColor = (status) => {
        const mapped = mapStatusToKey(status);
        switch(mapped) {
            case 'completed': return 'var(--color-success)';
            case 'ready': return 'var(--color-success)';
            case 'processing': return '#b026ff';
            case 'cancelled': return 'var(--color-danger)';
            default: return 'var(--accent)';
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            <header style={{ marginBottom: '1rem' }}>
                <button 
                  onClick={() => navigate('/customer')}
                  style={{ 
                      background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', 
                      padding: '0.8rem 1.5rem', borderRadius: '100px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '950',
                      marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'var(--transition)',
                      letterSpacing: '1px'
                  }}
                  onMouseOver={e => e.currentTarget.style.background = 'var(--border-subtle)'}
                  onMouseOut={e => e.currentTarget.style.background = ''}
                >
                  ← {t('customer.dashboard').toUpperCase()}
                </button>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
                    <div>
                        <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', marginBottom: '1rem', color: 'var(--text-primary)', fontWeight: '950', letterSpacing: '-3px', lineHeight: '1' }}>{t('customer.orderHistory')}</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', fontWeight: '500' }}>
                            {t('customer.account')}: <strong style={{ color: 'var(--text-primary)' }}>{brand} GLOBAL</strong>
                        </p>
                    </div>
                    <div style={{ position: 'relative', width: '100%', maxWidth: '450px' }}>
                        <span style={{ position: 'absolute', left: '1.5rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1.2rem', opacity: 0.5 }}>🔍</span>
                        <input 
                            type="text" 
                            placeholder={t('customer.searchPlaceholder')} 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%', padding: '1.2rem 1.2rem 1.2rem 4rem', borderRadius: '4px', background: 'var(--input-bg)',
                                border: '1px solid var(--input-border)', color: 'var(--input-color)', outline: 'none', fontSize: '1rem', fontWeight: '800',
                                boxShadow: 'var(--laminar-shadow)', transition: '0.3s'
                            }}
                        />
                    </div>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: isMobileView ? '1fr' : 'repeat(auto-fit, minmax(400px, 1fr))', gap: isMobileView ? '1.5rem' : '2.5rem' }}>
                {filteredOrders.map(order => (
                    <div key={order.id} 
                      className="prism-glass holographic" 
                      style={{ 
                        padding: isMobileView ? '2rem 1.5rem' : '4rem 3rem', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: isMobileView ? '1.8rem' : '3rem',
                        borderRadius: isMobileView ? '2rem' : '4rem',
                        transition: 'var(--transition)',
                        cursor: 'pointer',
                        minHeight: 'auto'
                      }}
                      onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = ((e.clientX - rect.left) / rect.width) * 100;
                        const y = ((e.clientY - rect.top) / rect.height) * 100;
                        e.currentTarget.style.setProperty('--mouse-x', `${x}%`);
                        e.currentTarget.style.setProperty('--mouse-y', `${y}%`);
                      }}
                    >
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: isMobileView ? 'flex-start' : 'center',
                            flexDirection: isMobileView ? 'column' : 'row',
                            gap: '1rem'
                        }}>
                            <div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--accent)', fontWeight: '950', letterSpacing: '4px', marginBottom: '0.5rem' }}>
                                    #{order.order_number || (typeof order.id === 'string' && order.id.length > 8 ? order.id.substring(0, 8).toUpperCase() : order.id)} {order.sub_customer_name ? `• ${order.sub_customer_name.toUpperCase()}` : ''}
                                </div>
                                <div style={{ fontSize: isMobileView ? '1.8rem' : '2.8rem', fontWeight: '950', color: 'var(--text-primary)', letterSpacing: '-1px', lineHeight: '1.2' }}>{order.product_name}</div>
                            </div>
                            <span style={{ 
                                padding: '0.6rem 1.5rem', 
                                borderRadius: '100px', 
                                fontSize: '0.75rem', 
                                fontWeight: '950',
                                background: 'var(--input-bg)',
                                color: getStatusColor(order.status),
                                border: `1px solid ${getStatusColor(order.status)}`,
                                textTransform: 'uppercase',
                                letterSpacing: '2px'
                            }}>
                                {t(`statuses.${mapStatusToKey(order.status)}`).toUpperCase()}
                            </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isMobileView ? '1.5rem' : '3rem' }}>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '900', marginBottom: '0.5rem' }}>{t('customer.date')}</div>
                                <div style={{ fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: '800' }}>{order.created_at.split(' ')[0]}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '900', marginBottom: '0.5rem' }}>{t('customer.estimatedDelivery')}</div>
                                <div style={{ fontSize: '1.2rem', color: 'var(--color-info)', fontWeight: '900' }}>{order.estimated_delivery_date || '---'}</div>
                            </div>
                        </div>

                        {order.procurement_needed === 1 && (
                            <div style={{ 
                                padding: '1rem', 
                                background: 'rgba(212, 175, 55,0.1)', 
                                border: '1px solid rgba(212, 175, 55,0.2)', 
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem'
                            }}>
                                <span style={{ fontSize: '1.5rem' }}>🚛</span>
                                <div style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: '800' }}>
                                    {t('customer.procurementStarted')}
                                </div>
                            </div>
                        )}

                        {/* Order Details Panel */}
                        <div style={{ 
                            background: 'rgba(255, 255, 255, 0.01)', 
                            border: '1px solid var(--border-subtle)', 
                            borderRadius: '1.2rem', 
                            padding: isMobileView ? '1.2rem' : '2rem', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: isMobileView ? '1rem' : '1.5rem',
                            marginTop: '1rem'
                        }}>
                            <h4 style={{ 
                                margin: 0, 
                                fontSize: '0.85rem', 
                                color: 'var(--text-primary)', 
                                fontWeight: '950', 
                                letterSpacing: '2px', 
                                textTransform: 'uppercase',
                                borderBottom: '1px solid var(--border-subtle)',
                                paddingBottom: '0.8rem'
                            }}>
                                📋 {t('customer.orderDetails') || 'SİPARİŞ DETAYLARI'}
                            </h4>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800', marginBottom: '0.3rem' }}>
                                        SKU / MODEL
                                    </div>
                                    <div style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: '900' }}>
                                        {order.sku || '---'}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800', marginBottom: '0.3rem' }}>
                                        {t('customer.quantity') || 'MİKTAR'}
                                    </div>
                                    <div style={{ fontSize: '1.1rem', color: themeMode === 'light' ? 'var(--midnight)' : 'var(--text-primary)', fontWeight: '950' }}>
                                        {order.quantity} {t('customer.pcs') || 'ADET'}
                                    </div>
                                </div>
                            </div>

                            {/* Sizing Details */}
                            {(() => {
                                const parsed = parseOrderNotes(order.notes);
                                return (
                                    <>
                                        {parsed.sizes && (
                                            <div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800', marginBottom: '0.3rem' }}>
                                                    {t('customer.sizeDistribution') || 'BEDEN DAĞILIMI'}
                                                </div>
                                                <div style={{ 
                                                    fontSize: '0.95rem', 
                                                    color: 'var(--accent)', 
                                                    fontWeight: '900',
                                                    background: 'rgba(214, 175, 55, 0.05)',
                                                    border: '1px dashed var(--accent-soft)',
                                                    padding: '0.8rem 1.2rem',
                                                    borderRadius: '8px'
                                                }}>
                                                    {parsed.sizes}
                                                </div>
                                            </div>
                                        )}
                                        {parsed.userNotes && (
                                            <div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800', marginBottom: '0.3rem' }}>
                                                    {t('customer.notes') || 'MÜŞTERİ NOTLARI'}
                                                </div>
                                                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '700', fontStyle: 'italic' }}>
                                                    "{parsed.userNotes}"
                                                </div>
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>

                        {/* Action Buttons */}
                        {(order.status.toLowerCase() === 'pending' || order.status.toLowerCase() === 'delivered' || mapStatusToKey(order.status) === 'pending') && (
                            <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                                {mapStatusToKey(order.status) === 'pending' && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleAction(order.id, 'cancelled'); }}
                                        style={{ 
                                            width: '100%', 
                                            background: 'rgba(239, 68, 68, 0.1)', 
                                            border: '1px solid var(--color-danger)', 
                                            color: 'var(--color-danger)', 
                                            padding: '1.2rem',
                                            borderRadius: '100px', 
                                            fontWeight: '950', 
                                            cursor: 'pointer',
                                            fontSize: '0.8rem',
                                            letterSpacing: '2px',
                                            textTransform: 'uppercase',
                                            transition: 'all 0.3s'
                                        }}
                                        onMouseOver={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                                        onMouseOut={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                    >
                                        ❌ {t('customer.cancel').toUpperCase()}
                                    </button>
                                )}
                                
                                {mapStatusToKey(order.status) === 'delivered' && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleAction(order.id, 'returned'); }}
                                        style={{ 
                                            width: '100%', 
                                            background: 'var(--glass)', 
                                            border: '1px solid var(--text-primary)', 
                                            color: 'var(--text-primary)', 
                                            padding: '1.2rem',
                                            borderRadius: '100px', 
                                            fontWeight: '950', 
                                            cursor: 'pointer',
                                            fontSize: '0.8rem',
                                            letterSpacing: '2px',
                                            textTransform: 'uppercase',
                                            transition: 'all 0.3s'
                                        }}
                                        onMouseOver={e => e.currentTarget.style.background = 'var(--border-subtle)'}
                                        onMouseOut={e => e.currentTarget.style.background = 'var(--glass)'}
                                    >
                                        ↩ {t('customer.return').toUpperCase()}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CustomerOrders;
