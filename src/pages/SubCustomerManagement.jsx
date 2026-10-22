import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate, useLocation } from 'react-router-dom';
import API_BASE_URL from '../services/apiConfig';

const SubCustomerManagement = () => {
    const { t, currentUser } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();
    const [showAddModal, setShowAddModal] = useState(false);
    const [subCustomers, setSubCustomers] = useState([]);
    const [newSub, setNewSub] = useState({ name: '', location: '' });
    const [selectedSub, setSelectedSub] = useState(null);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('add') === 'true') {
            setShowAddModal(true);
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, [location]);

    const brand = currentUser?.brand || "VOG";

    const fetchSubs = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/subs/${brand}`);
            const result = await response.json();
            if (result.success) {
                // Simulation: activeOrders random count for display
                const enrichedData = result.data.map(sub => ({
                    ...sub,
                    activeOrders: Math.floor(Math.random() * 5)
                }));
                setSubCustomers(enrichedData);
            }
        } catch (error) {
            console.error('Error fetching subs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubs();
    }, [brand]);

    const handleAddSub = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/subs/new`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    parent_brand: brand,
                    name: newSub.name,
                    location: newSub.location
                })
            });
            const result = await response.json();
            if (result.success) {
                setShowAddModal(false);
                setNewSub({ name: '', location: '' });
                fetchSubs();
            }
        } catch (error) {
            console.error('Error adding sub:', error);
        }
    };

    const handleDeleteSub = async (subId) => {
        if (!window.confirm('Bu bayiyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/subs/${subId}`, {
                method: 'DELETE'
            });
            const result = await response.json();
            if (result.success) {
                setShowProfileModal(false);
                setSelectedSub(null);
                fetchSubs();
            } else {
                alert(result.message || 'Bayi silinemedi.');
            }
        } catch (error) {
            console.error('Error deleting sub:', error);
            alert('Bayi silinirken sunucu hatası oluştu.');
        }
    };

    const [subOrderHistory, setSubOrderHistory] = useState({});

    const fetchSubHistory = async (subId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/orders/list?sub_customer_id=${subId}`);
            const result = await response.json();
            if (result.success) {
                setSubOrderHistory(prev => ({ ...prev, [subId]: result.data }));
            }
        } catch (error) {
            console.error('Error fetching sub history:', error);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            <header>
                <button 
                  onClick={() => navigate('/customer')}
                  style={{ 
                      background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', 
                      padding: '0.8rem 1.8rem', borderRadius: '100px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '950',
                      marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem', transition: 'var(--transition)',
                      letterSpacing: '1px'
                  }}
                  onMouseOver={e => e.currentTarget.style.background = 'var(--border-subtle)'}
                  onMouseOut={e => e.currentTarget.style.background = 'var(--glass)'}
                >
                  ← {t('customer.dashboard').toUpperCase()}
                </button>
                <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', marginBottom: '1rem', color: 'var(--text-primary)', fontWeight: '950', letterSpacing: '-2px' }}>{t('customer.subManagement')}</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', lineHeight: '1.6', maxWidth: '800px' }}>{t('customer.subManagementDesc')}</p>
            </header>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem' }}>
                {subCustomers.map(sub => (
                    <div key={sub.id} 
                      className="prism-glass holographic" 
                      style={{ 
                        padding: '4rem 3rem', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '3rem', 
                        borderRadius: '4rem',
                        transition: 'var(--transition)',
                        cursor: 'pointer'
                      }}
                      onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = ((e.clientX - rect.left) / rect.width) * 100;
                        const y = ((e.clientY - rect.top) / rect.height) * 100;
                        e.currentTarget.style.setProperty('--mouse-x', `${x}%`);
                        e.currentTarget.style.setProperty('--mouse-y', `${y}%`);
                      }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '2.5rem', fontWeight: '950', marginBottom: '0.5rem', color: 'var(--text-primary)', letterSpacing: '-2px', lineHeight: '1', wordBreak: 'break-word' }}>{sub.name}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase' }}>{sub.id} • {sub.location}</div>
                            </div>
                            <div style={{ 
                                background: sub.activeOrders > 0 ? 'rgba(230,0,0,0.1)' : 'var(--input-bg)', 
                                color: sub.activeOrders > 0 ? 'var(--accent)' : 'var(--text-secondary)', 
                                padding: '0.6rem 1.5rem', 
                                borderRadius: '100px', 
                                fontSize: '0.75rem', 
                                fontWeight: '950',
                                border: `1px solid ${sub.activeOrders > 0 ? 'var(--accent)' : 'var(--input-border)'}`,
                                textTransform: 'uppercase',
                                letterSpacing: '1px'
                            }}>
                                {sub.activeOrders} {t('customer.activeOrders')}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <button 
                                onClick={() => {
                                    setSelectedSub(sub);
                                    fetchSubHistory(sub.id);
                                    setShowProfileModal(true);
                                }}
                                className="glass" style={{ padding: '1.2rem', fontSize: '0.75rem', fontWeight: '950', cursor: 'pointer', border: '1px solid var(--input-border)', color: 'var(--text-primary)', background: 'var(--input-bg)', borderRadius: '1.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                {t('customer.viewProfile')}
                            </button>
                            <button 
                                onClick={() => {
                                    setSelectedSub(sub);
                                    fetchSubHistory(sub.id);
                                    setShowHistoryModal(true);
                                }}
                                className="glass" style={{ padding: '1.2rem', fontSize: '0.75rem', fontWeight: '950', cursor: 'pointer', border: '1px solid var(--input-border)', color: 'var(--text-primary)', background: 'var(--input-bg)', borderRadius: '1.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                {t('customer.orderHistory')}
                            </button>
                        </div>

                        <button 
                            onClick={() => navigate(`/customer/new-order?sub=${sub.id}`)}
                            style={{ 
                                width: '100%', 
                                padding: '1.6rem', 
                                borderRadius: '2rem', 
                                background: 'var(--text-primary)', 
                                color: 'var(--midnight)', 
                                fontWeight: '950', 
                                fontSize: '1rem', 
                                border: 'none', 
                                cursor: 'pointer',
                                textTransform: 'uppercase',
                                letterSpacing: '3px',
                                boxShadow: 'var(--laminar-shadow)',
                                transition: 'var(--transition)'
                            }}
                            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            {t('customer.newSubOrder')}
                        </button>
                    </div>
                ))}

                <button 
                  onClick={() => setShowAddModal(true)}
                  className="prism-glass holographic" style={{ 
                    padding: '4rem', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '2rem', 
                    border: '2px dashed var(--input-border)', 
                    cursor: 'pointer',
                    minHeight: '400px',
                    background: 'var(--glass)',
                    color: 'var(--text-primary)',
                    borderRadius: '4rem',
                    transition: 'var(--transition)'
                }}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * 100;
                  const y = ((e.clientY - rect.top) / rect.height) * 100;
                  e.currentTarget.style.setProperty('--mouse-x', `${x}%`);
                  e.currentTarget.style.setProperty('--mouse-y', `${y}%`);
                }}>
                    <span style={{ fontSize: '4rem', filter: 'drop-shadow(0 0 20px var(--text-primary))' }}>➕</span>
                    <span style={{ fontWeight: '950', fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '3px' }}>{t('customer.addSubAccount')}</span>
                </button>
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <div style={{ 
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
                    background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', 
                    zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' 
                }}>
                    <div className="prism-glass" style={{ width: '500px', padding: '3rem', borderRadius: '3rem', position: 'relative' }}>
                        <button 
                            onClick={() => setShowAddModal(false)}
                            style={{ position: 'absolute', top: '2rem', right: '2rem', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '1.5rem' }}>✕</button>
                        
                        <h2 style={{ fontSize: '2rem', fontWeight: '950', color: 'var(--text-primary)', marginBottom: '2rem' }}>{t('customer.addSubAccount')}</h2>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.7rem', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('customer.storeName')}</label>
                                <input 
                                    value={newSub.name}
                                    onChange={e => setNewSub({...newSub, name: e.target.value})}
                                    type="text" 
                                    style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', padding: '1.2rem', borderRadius: '1rem', color: 'var(--input-color)', outline: 'none' }} 
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.7rem', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('customer.locationCity')}</label>
                                <input 
                                    value={newSub.location}
                                    onChange={e => setNewSub({...newSub, location: e.target.value})}
                                    type="text" 
                                    style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', padding: '1.2rem', borderRadius: '1rem', color: 'var(--input-color)', outline: 'none' }} 
                                />
                            </div>
                            
                            <button 
                                onClick={handleAddSub}
                                style={{ background: 'var(--text-primary)', color: 'var(--midnight)', padding: '1.5rem', borderRadius: '1.5rem', fontWeight: '950', border: 'none', cursor: 'pointer', marginTop: '1rem', textTransform: 'uppercase', letterSpacing: '2px' }}
                            >
                                {t('customer.saveAndAuthorize')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Profile Modal */}
            {showProfileModal && selectedSub && (
                <div style={{ 
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
                    background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)', 
                    zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' 
                }}>
                    <div className="prism-glass" style={{ width: '700px', padding: '4rem', borderRadius: '4rem', position: 'relative' }}>
                        <button 
                            onClick={() => setShowProfileModal(false)}
                            style={{ position: 'absolute', top: '2rem', right: '3rem', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '2rem' }}>✕</button>
                        
                        <div style={{ marginBottom: '3rem' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: '950', letterSpacing: '3px', marginBottom: '1rem', textTransform: 'uppercase' }}>BAYİ PROFİLİ</div>
                            <h2 style={{ fontSize: '3rem', fontWeight: '950', color: 'var(--text-primary)', letterSpacing: '-2px', lineHeight: '1' }}>{selectedSub.name}</h2>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
                            <div className="glass" style={{ padding: '2rem', borderRadius: '2rem', border: '1px solid var(--glass-border)', background: 'var(--glass)' }}>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: '900', marginBottom: '0.8rem', letterSpacing: '2px' }}>KONUM</div>
                                <div style={{ color: 'var(--text-primary)', fontSize: '1.3rem', fontWeight: '950' }}>{selectedSub.location}</div>
                            </div>
                            <div className="glass" style={{ padding: '2rem', borderRadius: '2rem', border: '1px solid var(--glass-border)', background: 'var(--glass)' }}>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: '900', marginBottom: '0.8rem', letterSpacing: '2px' }}>BAYİ KODU</div>
                                <div style={{ color: 'var(--color-info)', fontSize: '1.3rem', fontWeight: '950' }}>{selectedSub.id}</div>
                            </div>
                            <div className="glass" style={{ padding: '2rem', borderRadius: '2rem', border: '1px solid var(--glass-border)', background: 'var(--glass)' }}>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: '900', marginBottom: '0.8rem', letterSpacing: '2px' }}>AKTİF SİPARİŞLER</div>
                                <div style={{ color: 'var(--text-primary)', fontSize: '1.3rem', fontWeight: '950' }}>{selectedSub.activeOrders}</div>
                            </div>
                            <div className="glass" style={{ padding: '2rem', borderRadius: '2rem', border: '1px solid var(--glass-border)', background: 'var(--glass)' }}>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: '900', marginBottom: '0.8rem', letterSpacing: '2px' }}>TOPLAM SİPARİŞ</div>
                                <div style={{ color: 'var(--text-primary)', fontSize: '1.3rem', fontWeight: '950' }}>{(subOrderHistory[selectedSub.id] || []).length}</div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                            <button 
                                onClick={() => {
                                    setShowProfileModal(false);
                                    navigate(`/customer/new-order?sub=${selectedSub.id}`);
                                }}
                                style={{ padding: '1.5rem', borderRadius: '1.5rem', background: 'var(--text-primary)', color: 'var(--midnight)', fontWeight: '950', border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.8rem' }}
                            >
                                SİPARİŞ VER
                            </button>
                            <button 
                                onClick={() => {
                                    setShowProfileModal(false);
                                    setShowHistoryModal(true);
                                }}
                                style={{ padding: '1.5rem', borderRadius: '1.5rem', background: 'var(--input-bg)', color: 'var(--text-primary)', fontWeight: '950', border: '1px solid var(--input-border)', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.8rem' }}
                            >
                                GEÇMİŞ
                            </button>
                            <button 
                                onClick={() => handleDeleteSub(selectedSub.id)}
                                style={{ padding: '1.5rem', borderRadius: '1.5rem', background: 'rgba(230,0,0,0.1)', color: 'var(--accent)', fontWeight: '950', border: '1px solid var(--accent)', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.8rem', transition: '0.3s' }}
                                onMouseOver={e => { e.currentTarget.style.background = '#E60000'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                                onMouseOut={e => { e.currentTarget.style.background = 'rgba(230,0,0,0.1)'; e.currentTarget.style.color = 'var(--accent)'; }}
                            >
                                BAYİYİ SİL
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {showHistoryModal && selectedSub && (
                <div style={{ 
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
                    background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)', 
                    zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' 
                }}>
                    <div className="prism-glass" style={{ width: '800px', padding: '4rem', borderRadius: '4rem', position: 'relative' }}>
                        <button 
                            onClick={() => setShowHistoryModal(false)}
                            style={{ position: 'absolute', top: '2rem', right: '3rem', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '2rem' }}>✕</button>
                        
                        <div style={{ marginBottom: '3rem' }}>
                            <h2 style={{ fontSize: '3rem', fontWeight: '950', color: 'var(--text-primary)', letterSpacing: '-2px' }}>{selectedSub.name}</h2>
                            <p style={{ color: 'var(--accent)', fontWeight: '900', letterSpacing: '2px', fontSize: '0.9rem' }}>{t('customer.subOrderHistoryAnalysis')}</p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {subOrderHistory[selectedSub.id] && subOrderHistory[selectedSub.id].length > 0 ? subOrderHistory[selectedSub.id].map(order => (
                                <div key={order.id} style={{ 
                                    background: 'var(--input-bg)', 
                                    padding: '1.5rem 2rem', 
                                    borderRadius: '2rem', 
                                    border: '1px solid var(--input-border)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div>
                                        <div style={{ color: 'var(--text-primary)', fontWeight: '950', fontSize: '1.1rem' }}>{order.product_name}</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '800' }}>{new Date(order.created_at).toLocaleDateString()} • #{order.order_number || (typeof order.id === 'string' && order.id.length > 8 ? order.id.substring(0, 8).toUpperCase() : order.id)}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ color: 'var(--text-primary)', fontWeight: '950' }}>{order.quantity} {t('customer.pcs').toUpperCase()}</div>
                                        <div style={{ 
                                            color: order.status === 'completed' ? '#00ff88' : '#ffaa00', 
                                            fontSize: '0.7rem', 
                                            fontWeight: '950', 
                                            textTransform: 'uppercase' 
                                        }}>{order.status}</div>
                                    </div>
                                </div>
                            )) : (
                                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontWeight: '900' }}>{t('customer.noActiveOrders').toUpperCase()}</div>
                            )}
                        </div>

                        <div style={{ marginTop: '3rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            <div className="glass" style={{ padding: '2rem', borderRadius: '2rem', textAlign: 'center', border: '1px solid var(--glass-border)', background: 'var(--glass)' }}>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: '900' }}>{t('customer.totalVolume')}</div>
                                <div style={{ color: 'var(--text-primary)', fontSize: '1.8rem', fontWeight: '950' }}>€12,540</div>
                            </div>
                            <div className="glass" style={{ padding: '2rem', borderRadius: '2rem', textAlign: 'center', border: '1px solid var(--glass-border)', background: 'var(--glass)' }}>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: '900' }}>{t('customer.returnRate')}</div>
                                <div style={{ color: 'var(--accent)', fontSize: '1.8rem', fontWeight: '950' }}>%1.2</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubCustomerManagement;
