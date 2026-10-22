import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PackingStation from '../components/PackingStation';

const FulfillmentCenter = () => {
    const navigate = useNavigate();
    const [mode, setMode] = useState(null); // 'FOY' | 'PERSONNEL'
    const [useSorter, setUseSorter] = useState(false);
    
    // Selection state
    const [brand, setBrand] = useState('SEAT');
    const [foyNumber, setFoyNumber] = useState('');
    const [location, setLocation] = useState('');
    const [personnel, setPersonnel] = useState('');
    
    // Proceed to packing
    const [isPacking, setIsPacking] = useState(false);

    const handleStartPacking = () => {
        if (mode === 'FOY' && !foyNumber) return alert('Lütfen Föy numarası giriniz.');
        if (mode === 'PERSONNEL' && (!location || !personnel)) return alert('Lütfen Lokasyon ve Personel seçiniz.');
        setIsPacking(true);
    };

    if (isPacking) {
        return (
            <PackingStation 
                mode={mode} 
                brand={brand} 
                identifier={mode === 'FOY' ? foyNumber : personnel} 
                location={location}
                useSorter={useSorter}
                onBack={() => setIsPacking(false)} 
            />
        );
    }

    return (
        <div className="fulfillment-center" style={{ width: '100%', padding: 'var(--container-pad)', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem', flexWrap: 'wrap', gap: '2rem' }}>
                <div>
                    <button 
                        onClick={() => navigate('/admin')} 
                        className="btn-back-premium"
                        style={{ 
                            background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', 
                            padding: '0.8rem 1.8rem', borderRadius: '100px', cursor: 'pointer', marginBottom: '2rem', 
                            fontSize: '0.75rem', fontWeight: '950', letterSpacing: '1.5px', textTransform: 'uppercase',
                            display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'var(--transition)'
                        }}
                    >
                        ← Yönetim Paneli
                    </button>
                    <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', marginBottom: '0.5rem', color: 'var(--text-primary)', fontWeight: '950', letterSpacing: '-2px', lineHeight: '1' }}>
                        Sipariş Yönetimi <span style={{ color: 'var(--accent)' }}>(Fulfillment)</span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: '700', letterSpacing: '0.5px' }}>
                        Tüm kolileme ve sevkiyat işlemlerini tek bir merkezden yönetin.
                    </p>
                </div>
                
                {/* Sorter Toggle */}
                <div style={{ 
                    background: 'var(--glass)', padding: '1rem 1.5rem', borderRadius: '1rem', 
                    border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '1rem',
                    boxShadow: 'var(--laminar-shadow)'
                }}>
                    <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: '950', color: 'var(--text-primary)' }}>Sorter Sistemi</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{useSorter ? 'Aktif (Koli ayrıştırma yapılacak)' : 'Pasif (Sadece RFID Tünel)'}</div>
                    </div>
                    <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '60px', height: '34px' }}>
                        <input type="checkbox" checked={useSorter} onChange={(e) => setUseSorter(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                        <span className="slider round" style={{ 
                            position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, 
                            backgroundColor: useSorter ? 'var(--accent)' : 'var(--glass-border)', 
                            transition: '.4s', borderRadius: '34px' 
                        }}>
                            <span style={{
                                position: 'absolute', content: '""', height: '26px', width: '26px', left: '4px', bottom: '4px',
                                backgroundColor: 'white', transition: '.4s', borderRadius: '50%',
                                transform: useSorter ? 'translateX(26px)' : 'translateX(0)'
                            }}></span>
                        </span>
                    </label>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
                
                {/* FÖY BAZLI */}
                <div 
                    onClick={() => setMode('FOY')}
                    style={{ 
                        padding: '3rem', borderRadius: '2rem', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        background: mode === 'FOY' ? 'linear-gradient(135deg, rgba(37,99,235,0.1), rgba(37,99,235,0.05))' : 'var(--glass)', 
                        border: mode === 'FOY' ? '2px solid var(--accent)' : '1px solid var(--glass-border)',
                        boxShadow: mode === 'FOY' ? '0 20px 40px rgba(37,99,235,0.15)' : 'var(--laminar-shadow)',
                        position: 'relative', overflow: 'hidden'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
                        <div style={{ 
                            width: '64px', height: '64px', borderRadius: '1.2rem', background: mode === 'FOY' ? 'var(--accent)' : 'var(--glass-border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: '#fff', transition: 'var(--transition)'
                        }}>
                            📦
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: '950', color: 'var(--text-primary)', margin: 0 }}>Föy (Sipariş) Bazlı</h2>
                            <p style={{ color: 'var(--text-muted)', margin: '0.3rem 0 0 0', fontSize: '0.95rem' }}>Föy/Sipariş Numarasına Göre Toplama</p>
                        </div>
                    </div>
                    
                    {mode === 'FOY' && (
                        <div style={{ marginTop: '2rem', animation: 'fadeIn 0.3s ease' }}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase' }}>Firma Seçimi</label>
                                <select value={brand} onChange={(e) => setBrand(e.target.value)} className="premium-select">
                                    <option value="SEAT">SEAT</option>
                                    <option value="FORD">FORD</option>
                                    <option value="ZARA">ZARA</option>
                                </select>
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase' }}>Föy (Sipariş) ID</label>
                                <input type="number" placeholder="Örn: 2045" value={foyNumber} onChange={(e) => setFoyNumber(e.target.value)} className="premium-input" />
                            </div>
                            <button onClick={handleStartPacking} className="btn-action-primary" style={{ width: '100%' }}>
                                İşleme Başla
                            </button>
                        </div>
                    )}
                </div>

                {/* PERSONEL BAZLI */}
                <div 
                    onClick={() => setMode('PERSONNEL')}
                    style={{ 
                        padding: '3rem', borderRadius: '2rem', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        background: mode === 'PERSONNEL' ? 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.05))' : 'var(--glass)', 
                        border: mode === 'PERSONNEL' ? '2px solid #10B981' : '1px solid var(--glass-border)',
                        boxShadow: mode === 'PERSONNEL' ? '0 20px 40px rgba(16,185,129,0.15)' : 'var(--laminar-shadow)',
                        position: 'relative', overflow: 'hidden'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
                        <div style={{ 
                            width: '64px', height: '64px', borderRadius: '1.2rem', background: mode === 'PERSONNEL' ? '#10B981' : 'var(--glass-border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: '#fff', transition: 'var(--transition)'
                        }}>
                            👤
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: '950', color: 'var(--text-primary)', margin: 0 }}>Personel Bazlı</h2>
                            <p style={{ color: 'var(--text-muted)', margin: '0.3rem 0 0 0', fontSize: '0.95rem' }}>Kişiye Özel Hazırlık & Kolileme</p>
                        </div>
                    </div>
                    
                    {mode === 'PERSONNEL' && (
                        <div style={{ marginTop: '2rem', animation: 'fadeIn 0.3s ease' }}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase' }}>Firma Seçimi</label>
                                <select value={brand} onChange={(e) => setBrand(e.target.value)} className="premium-select" style={{ borderFocus: '#10B981' }}>
                                    <option value="SEAT">SEAT</option>
                                    <option value="FORD">FORD</option>
                                    <option value="ZARA">ZARA</option>
                                </select>
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase' }}>Lokasyon (Bayi / Şube)</label>
                                <input type="text" placeholder="Örn: Merkez Depo" value={location} onChange={(e) => setLocation(e.target.value)} className="premium-input" />
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase' }}>Personel Adı</label>
                                <input type="text" placeholder="Örn: Ahmet Yılmaz" value={personnel} onChange={(e) => setPersonnel(e.target.value)} className="premium-input" />
                            </div>
                            <button onClick={handleStartPacking} className="btn-action-primary" style={{ width: '100%', background: 'linear-gradient(135deg, #10B981, #059669)' }}>
                                İşleme Başla
                            </button>
                        </div>
                    )}
                </div>

            </div>

            <style>{`
                .premium-input, .premium-select {
                    width: 100%; padding: 1.1rem 1.3rem; border-radius: 1.2rem; background: var(--input-bg); 
                    border: 1px solid var(--input-border); color: var(--input-color); font-size: 1.05rem; 
                    font-weight: 700; outline: none; transition: var(--transition);
                }
                .premium-input:focus, .premium-select:focus {
                    border-color: var(--accent);
                    box-shadow: 0 0 0 4px var(--accent-soft);
                }
                .btn-action-primary {
                    padding: 1.3rem 2rem; border-radius: 1.2rem; border: none; 
                    background: linear-gradient(135deg, var(--accent) 0%, #6366f1 100%); 
                    color: #fffffe; font-size: 1.1rem; font-weight: 950; cursor: pointer; transition: var(--transition);
                    letter-spacing: 1.5px; text-transform: uppercase; box-shadow: var(--laminar-shadow);
                }
                .btn-action-primary:hover {
                    opacity: 0.95; transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,0,0,0.15);
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default FulfillmentCenter;
