import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../services/apiConfig';

const WebServiceTerminal = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('login');
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    // Form States
    const [loginForm, setLoginForm] = useState({ username: 'VOG', password: 'Vog2026!Premium', database_name: 'vog_db' });
    const [barcodeQuery, setBarcodeQuery] = useState('');
    const [dateRange, setDateRange] = useState({ start: '2026-05-01', end: '2026-05-14' });
    const [countData, setCountData] = useState([
        { gtin: '1956000808353', count: 10 },
        { gtin: '1956000805653', count: 5 }
    ]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginForm)
            });
            const data = await res.json();
            if (data.success) {
                setToken(data.token);
                setResult({ status: 'success', message: 'Giriş Başarılı. Token Alındı.' });
                setActiveTab('master');
            } else {
                setResult({ status: 'error', message: data.message });
            }
        } catch (err) {
            setResult({ status: 'error', message: 'Bağlantı hatası!' });
        }
        setLoading(false);
    };

    const fetchMasterData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/products/master-data`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, barcode: barcodeQuery })
            });
            const data = await res.json();
            setResult(data);
        } catch (err) {
            setResult({ error: 'Sorgu hatası' });
        }
        setLoading(false);
    };

    const submitInventory = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/inventory/count`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    token, 
                    counting_id: 4272, 
                    total_line_items: countData.length,
                    response_data: countData 
                })
            });
            const data = await res.json();
            setResult(data);
        } catch (err) {
            setResult({ error: 'Gönderim hatası' });
        }
        setLoading(false);
    };

    const fetchHistory = async (type) => {
        setLoading(true);
        const endpoint = type === 'sales' ? '/api/sales' : '/api/vouchers/print';
        try {
            const res = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, start_date: dateRange.start, end_date: dateRange.end })
            });
            const data = await res.json();
            setResult(data);
        } catch (err) {
            setResult({ error: 'Veri çekme hatası' });
        }
        setLoading(false);
    };

    return (
        <div className="web-service-terminal-premium" style={{ maxWidth: '1100px', margin: '0 auto', padding: 'var(--container-pad)' }}>
            <header style={{ marginBottom: '3rem' }}>
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
                        fontSize: '0.75rem', 
                        fontWeight: '950',
                        marginBottom: '2rem', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.8rem', 
                        transition: 'var(--transition)', 
                        letterSpacing: '1.5px',
                        textTransform: 'uppercase'
                    }}
                >
                    ← {t('admin.users.goBack')}
                </button>
                <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: '950', color: 'var(--text-primary)', letterSpacing: '-3px', lineHeight: '1', margin: 0 }}>WEB SERVİS TERMİNALİ</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: '700', marginTop: '1rem', letterSpacing: '0.5px' }}>Mobil Uygulama & Web Servis Simülasyon Paneli</p>
            </header>

            <div className="glass-card prism-glass" style={{ padding: '0', overflow: 'hidden', border: 'var(--card-border)', background: 'var(--card-bg)', boxShadow: 'var(--laminar-shadow)', borderRadius: '3rem' }}>
                {/* Tabs */}
                <div style={{ display: 'flex', background: 'var(--glass)', borderBottom: '1px solid var(--border-subtle)', padding: '0.5rem', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {['login', 'master', 'inventory', 'sales', 'vouchers'].map(tab => (
                        <button 
                            key={tab}
                            onClick={() => { setActiveTab(tab); setResult(null); }}
                            style={{
                                padding: '1rem', 
                                border: 'none', 
                                borderRadius: '100px',
                                background: activeTab === tab ? 'var(--text-primary)' : 'transparent',
                                color: activeTab === tab ? 'var(--midnight)' : 'var(--text-muted)', 
                                cursor: 'pointer', 
                                fontWeight: '950', 
                                textTransform: 'uppercase',
                                fontSize: '0.8rem', 
                                letterSpacing: '1px', 
                                transition: 'var(--transition)',
                                flex: 1,
                                minWidth: '100px'
                            }}
                            className={activeTab === tab ? 'tab-btn-active' : 'tab-btn-inactive'}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div style={{ padding: '3.5rem' }}>
                    {activeTab === 'login' && (
                        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem', maxWidth: '420px', margin: '0 auto' }}>
                            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                                <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🔐</div>
                                <h3 style={{ color: 'var(--text-primary)', fontSize: '1.8rem', fontWeight: '950', letterSpacing: '-0.5px', margin: 0 }}>Servis Girişi</h3>
                            </div>
                            <input 
                                type="text" placeholder="Username" className="premium-input" 
                                value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})}
                                style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--input-color)', padding: '1.1rem 1.3rem', borderRadius: '1.2rem', fontSize: '1.05rem', fontWeight: '700', outline: 'none', transition: 'var(--transition)', fontFamily: 'var(--font-main)' }}
                            />
                            <input 
                                type="password" placeholder="Password" className="premium-input" 
                                value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                                style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--input-color)', padding: '1.1rem 1.3rem', borderRadius: '1.2rem', fontSize: '1.05rem', fontWeight: '700', outline: 'none', transition: 'var(--transition)', fontFamily: 'var(--font-main)' }}
                            />
                            <button type="submit" className="btn-action-primary" disabled={loading} style={{ padding: '1.2rem', borderRadius: '1.2rem', border: 'none', background: 'linear-gradient(135deg, var(--accent) 0%, #6366f1 100%)', color: '#fffffe', fontWeight: '950', fontSize: '1.1rem', cursor: 'pointer', letterSpacing: '1px', boxShadow: 'var(--laminar-shadow)', transition: 'var(--transition)' }}>
                                {loading ? 'BAĞLANILIYOR...' : 'TOKEN AL'}
                            </button>
                            {token && <div style={{ color: 'var(--color-success)', fontSize: '0.85rem', fontWeight: '800', textAlign: 'center', wordBreak: 'break-all', background: 'var(--color-success-bg)', padding: '0.8rem 1.2rem', borderRadius: '1rem', border: '1px solid var(--color-success)' }}>Aktif Token: {token}</div>}
                        </form>
                    )}

                    {activeTab !== 'login' && !token && (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-danger)', fontWeight: '950', background: 'var(--color-danger-bg)', borderRadius: '2rem', border: '1px solid var(--color-danger)' }}>
                            ⚠️ Lütfen önce Login sekmesinden giriş yapınız.
                        </div>
                    )}

                    {token && (
                        <div>
                            {activeTab === 'master' && (
                                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                                    <input 
                                        type="text" placeholder="Barkod Okutun..." value={barcodeQuery} onChange={e => setBarcodeQuery(e.target.value)}
                                        className="premium-input"
                                        style={{ flex: 1, background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--input-color)', padding: '1.1rem 1.3rem', borderRadius: '1.2rem', fontSize: '1.05rem', fontWeight: '700', outline: 'none', transition: 'var(--transition)', fontFamily: 'var(--font-main)', minWidth: '250px' }}
                                    />
                                    <button onClick={fetchMasterData} className="btn-action-primary" style={{ padding: '1.1rem 2.2rem', borderRadius: '1.2rem', border: 'none', background: 'linear-gradient(135deg, var(--accent) 0%, #6366f1 100%)', color: '#fffffe', fontWeight: '950', fontSize: '1rem', cursor: 'pointer', transition: 'var(--transition)', boxShadow: 'var(--laminar-shadow)', letterSpacing: '0.5px' }}>SORGULA</button>
                                </div>
                            )}

                            {activeTab === 'inventory' && (
                                <div style={{ textAlign: 'center' }}>
                                    <h3 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem', fontSize: '1.6rem', fontWeight: '950', letterSpacing: '-0.5px' }}>Hızlı Sayım Gönderimi</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem' }}>
                                        {countData.map((item, idx) => (
                                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '1.2rem 2rem', background: 'var(--glass)', borderRadius: '1.5rem', border: '1px solid var(--glass-border)', alignItems: 'center' }}>
                                                <span style={{ fontWeight: '900', color: 'var(--text-primary)' }}>{item.gtin}</span>
                                                <span style={{ fontWeight: '950', color: 'var(--accent)', background: 'var(--accent-soft)', padding: '0.4rem 1rem', borderRadius: '100px', border: '1px solid var(--accent)', fontSize: '0.85rem' }}>{item.count} ADET</span>
                                            </div>
                                        ))}
                                    </div>
                                    <button onClick={submitInventory} className="btn-action-primary" style={{ padding: '1.2rem 2.5rem', borderRadius: '1.2rem', border: 'none', background: 'linear-gradient(135deg, var(--accent) 0%, #6366f1 100%)', color: '#fffffe', fontWeight: '950', fontSize: '1.1rem', cursor: 'pointer', transition: 'var(--transition)', boxShadow: 'var(--laminar-shadow)', letterSpacing: '0.5px' }}>SAYIMI TAMAMLA VE GÖNDER</button>
                                </div>
                            )}

                            {(activeTab === 'sales' || activeTab === 'vouchers') && (
                                <div style={{ marginBottom: '2rem' }}>
                                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                        <div style={{ flex: 1, minWidth: '200px' }}>
                                            <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '0.6rem', fontWeight: '950', color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>BAŞLANGIÇ</label>
                                            <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--input-color)', padding: '1rem', borderRadius: '1.2rem', fontSize: '0.9rem', fontWeight: '800', fontFamily: 'var(--font-main)' }} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: '200px' }}>
                                            <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '0.6rem', fontWeight: '950', color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>BİTİŞ</label>
                                            <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--input-color)', padding: '1rem', borderRadius: '1.2rem', fontSize: '0.9rem', fontWeight: '800', fontFamily: 'var(--font-main)' }} />
                                        </div>
                                        <button onClick={() => fetchHistory(activeTab)} className="btn-action-primary" style={{ padding: '1.1rem 2.2rem', borderRadius: '1.2rem', border: 'none', background: 'linear-gradient(135deg, var(--accent) 0%, #6366f1 100%)', color: '#fffffe', fontWeight: '950', fontSize: '1rem', cursor: 'pointer', transition: 'var(--transition)', boxShadow: 'var(--laminar-shadow)', letterSpacing: '0.5px' }}>GETİR</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Result View */}
                    {result && (
                        <div style={{ marginTop: '2.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '2.5rem' }}>
                            <h4 style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '1rem', textTransform: 'uppercase', fontWeight: '950', letterSpacing: '1.5px' }}>Servis Yanıtı (JSON)</h4>
                            <pre className="terminal-view" style={{ background: '#02040a', padding: '2rem', borderRadius: '1.8rem', color: '#00ff66', fontSize: '0.9rem', overflowX: 'auto', border: '1px solid var(--glass-border)', fontFamily: 'Courier New, monospace', boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.8)' }}>
                                {JSON.stringify(result, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            </div>
            <style>{`
                .premium-input:focus {
                    border-color: var(--accent) !important;
                    box-shadow: 0 0 0 4px var(--accent-soft) !important;
                }
                .btn-back-premium:hover {
                    background: var(--text-primary) !important;
                    color: var(--midnight) !important;
                    border-color: transparent !important;
                }
                .tab-btn-inactive:hover {
                    color: var(--text-primary) !important;
                    background: var(--glass) !important;
                }
                .btn-action-primary:hover {
                    opacity: 0.95;
                    transform: translateY(-2px);
                    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15) !important;
                }
                .btn-action-primary:active {
                    transform: translateY(0);
                }
                .terminal-view::-webkit-scrollbar {
                    height: 8px;
                }
                .terminal-view::-webkit-scrollbar-thumb {
                    background: var(--glass-border);
                    border-radius: 4px;
                }
            `}</style>
        </div>
    );
};

export default WebServiceTerminal;
