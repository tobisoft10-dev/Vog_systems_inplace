import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../services/apiConfig';

const PackingStation = ({ mode, brand, identifier, location, useSorter, onBack }) => {
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]);
    
    // For Box Management
    const [currentBoxNumber, setCurrentBoxNumber] = useState(1);
    const [boxes, setBoxes] = useState([{ boxNumber: 1, items: [] }]);
    
    // Packing mode state
    const [barcodeInput, setBarcodeInput] = useState('');
    const [labelType, setLabelType] = useState('QR'); // 'QR' or '1D'

    useEffect(() => {
        fetchItemsToPack();
    }, [mode, brand, identifier, location]);

    const fetchItemsToPack = async () => {
        setLoading(true);
        try {
            // mode: 'FOY' or 'PERSONNEL'
            // In FOY mode, identifier is foyNumber (Siparisler.Id)
            // In PERSONNEL mode, identifier is personnel name, plus we have location
            const queryParam = mode === 'FOY' 
                ? `?foyNumber=${identifier}&brand=${brand}` 
                : `?personnel=${identifier}&location=${location}&brand=${brand}`;

            const res = await fetch(`${API_BASE_URL}/api/fulfillment/items${queryParam}`);
            const data = await res.json();
            
            if (data.success) {
                setItems(data.data || []);
            } else {
                console.error(data.message);
            }
        } catch (error) {
            console.error('Error fetching items:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBarcodeScan = (e) => {
        e.preventDefault();
        if (!barcodeInput.trim()) return;

        // Find the item in our list that matches the barcode
        const itemToPack = items.find(i => 
            (i.barcode === barcodeInput || i.sku === barcodeInput || i.ean13 === barcodeInput) && 
            i.packed_qty < i.total_qty
        );

        if (itemToPack) {
            // Update items state
            setItems(prevItems => prevItems.map(item => 
                item.id === itemToPack.id 
                    ? { ...item, packed_qty: (item.packed_qty || 0) + 1 }
                    : item
            ));

            // Add to current box
            setBoxes(prevBoxes => prevBoxes.map(box => {
                if (box.boxNumber === currentBoxNumber) {
                    const existingItem = box.items.find(i => i.id === itemToPack.id);
                    if (existingItem) {
                        return {
                            ...box,
                            items: box.items.map(i => i.id === itemToPack.id ? { ...i, qty: i.qty + 1 } : i)
                        };
                    } else {
                        return {
                            ...box,
                            items: [...box.items, { ...itemToPack, qty: 1 }]
                        };
                    }
                }
                return box;
            }));
            
        } else {
            alert('Ürün bulunamadı veya bu sipariş için istenen adet tamamlandı!');
        }
        setBarcodeInput('');
    };

    const handleCreateNewBox = () => {
        const nextBox = boxes.length + 1;
        setBoxes([...boxes, { boxNumber: nextBox, items: [] }]);
        setCurrentBoxNumber(nextBox);
    };

    const handleFinishPacking = async () => {
        if (!window.confirm('Tüm kolileme işlemini bitirip RFID tüneli/Sorter aktarımını başlatmak istediğinize emin misiniz?')) return;
        
        // Prepare data to send back to server
        const payload = {
            mode,
            brand,
            identifier,
            location,
            useSorter,
            labelType,
            boxes
        };

        try {
            const res = await fetch(`${API_BASE_URL}/api/fulfillment/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                alert('Paketleme tamamlandı ve veriler Tünele aktarıldı!');
                onBack(); // Go back to fulfillment center selection
            } else {
                alert('Hata: ' + data.message);
            }
        } catch (error) {
            console.error(error);
            alert('Tamamlama işlemi başarısız oldu.');
        }
    };

    return (
        <div className="packing-station" style={{ width: '100%', padding: 'var(--container-pad)', maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <button 
                    onClick={onBack}
                    style={{ 
                        background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', 
                        padding: '0.8rem 1.8rem', borderRadius: '100px', cursor: 'pointer',
                        fontSize: '0.75rem', fontWeight: '950', letterSpacing: '1.5px', textTransform: 'uppercase',
                        display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'var(--transition)'
                    }}
                >
                    ← Mod Seçimine Dön
                </button>
                
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '950', letterSpacing: '1px' }}>
                        {mode === 'FOY' ? 'Föy / Sipariş' : 'Personel / Lokasyon'}
                    </div>
                    <div style={{ fontSize: '1.8rem', color: 'var(--text-primary)', fontWeight: '950' }}>
                        {mode === 'FOY' ? `FÖY NO: ${identifier}` : `${identifier} (${location})`}
                    </div>
                    {mode === 'PERSONNEL' && (
                        <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '800' }}>ETİKET TİPİ:</span>
                            <div style={{ display: 'flex', background: 'var(--input-bg)', borderRadius: '0.5rem', padding: '0.2rem', border: '1px solid var(--input-border)' }}>
                                <button 
                                    onClick={() => setLabelType('QR')}
                                    style={{ 
                                        padding: '0.4rem 1rem', border: 'none', borderRadius: '0.4rem', cursor: 'pointer', fontWeight: '800', fontSize: '0.8rem',
                                        background: labelType === 'QR' ? 'var(--accent)' : 'transparent', 
                                        color: labelType === 'QR' ? '#fff' : 'var(--text-muted)', transition: '0.3s'
                                    }}>
                                    Karekod (QR)
                                </button>
                                <button 
                                    onClick={() => setLabelType('1D')}
                                    style={{ 
                                        padding: '0.4rem 1rem', border: 'none', borderRadius: '0.4rem', cursor: 'pointer', fontWeight: '800', fontSize: '0.8rem',
                                        background: labelType === '1D' ? 'var(--accent)' : 'transparent', 
                                        color: labelType === '1D' ? '#fff' : 'var(--text-muted)', transition: '0.3s'
                                    }}>
                                    1D Barkod
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                
                {/* Left Side: Packing Action & Items List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Scanner Input */}
                    <div style={{ padding: '2rem', background: 'var(--glass)', borderRadius: '2rem', border: '1px solid var(--glass-border)', boxShadow: 'var(--laminar-shadow)' }}>
                        <form onSubmit={handleBarcodeScan} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase' }}>
                                    Barkod Okut veya Elle Gir (Koli #{currentBoxNumber})
                                </label>
                                <input 
                                    type="text" 
                                    value={barcodeInput}
                                    onChange={(e) => setBarcodeInput(e.target.value)}
                                    placeholder="Barkod okutunuz..."
                                    autoFocus
                                    className="premium-input"
                                    style={{ 
                                        width: '100%', padding: '1.1rem 1.3rem', borderRadius: '1.2rem', background: 'var(--input-bg)', 
                                        border: '1px solid var(--accent)', color: 'var(--input-color)', fontSize: '1.2rem', 
                                        fontWeight: '700', outline: 'none'
                                    }}
                                />
                            </div>
                            <button 
                                type="submit" 
                                style={{ 
                                    padding: '1.2rem 2rem', borderRadius: '1.2rem', border: 'none', 
                                    background: 'linear-gradient(135deg, var(--accent) 0%, #6366f1 100%)', 
                                    color: '#fffffe', fontSize: '1.1rem', fontWeight: '950', cursor: 'pointer',
                                    boxShadow: '0 10px 20px rgba(37,99,235,0.2)'
                                }}
                            >
                                OKUT
                            </button>
                        </form>
                    </div>

                    {/* Required Items Table */}
                    <div style={{ padding: '2rem', background: 'var(--card-bg)', borderRadius: '2rem', border: 'var(--card-border)', boxShadow: 'var(--laminar-shadow)' }}>
                        <h3 style={{ fontSize: '1.3rem', fontWeight: '950', marginBottom: '1.5rem' }}>Toplanması Gereken Ürünler</h3>
                        
                        {loading ? (
                            <p style={{ color: 'var(--text-muted)' }}>Yükleniyor...</p>
                        ) : items.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)' }}>Bu seçim için ürün bulunamadı.</p>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                                            <th style={{ padding: '1rem', fontWeight: '800', fontSize: '0.85rem', textTransform: 'uppercase' }}>Ürün Adı</th>
                                            <th style={{ padding: '1rem', fontWeight: '800', fontSize: '0.85rem', textTransform: 'uppercase' }}>Beden / Renk</th>
                                            <th style={{ padding: '1rem', fontWeight: '800', fontSize: '0.85rem', textTransform: 'uppercase' }}>SKU</th>
                                            <th style={{ padding: '1rem', fontWeight: '800', fontSize: '0.85rem', textTransform: 'uppercase', textAlign: 'center' }}>Hedef</th>
                                            <th style={{ padding: '1rem', fontWeight: '800', fontSize: '0.85rem', textTransform: 'uppercase', textAlign: 'center' }}>Okutulan</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item, idx) => (
                                            <tr key={item.id || idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                                <td style={{ padding: '1rem', color: 'var(--text-primary)', fontWeight: '700' }}>{item.product_name}</td>
                                                <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{item.size || '-'} / {item.color || '-'}</td>
                                                <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{item.sku}</td>
                                                <td style={{ padding: '1rem', textAlign: 'center', fontWeight: '950', color: 'var(--text-primary)' }}>{item.total_qty}</td>
                                                <td style={{ padding: '1rem', textAlign: 'center', fontWeight: '950', color: (item.packed_qty || 0) >= item.total_qty ? '#10B981' : 'var(--accent)' }}>
                                                    {item.packed_qty || 0}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Boxes Management */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '950', margin: 0 }}>Koliler</h3>
                        <button 
                            onClick={handleCreateNewBox}
                            style={{ 
                                padding: '0.8rem 1.5rem', borderRadius: '1rem', border: '1px solid var(--accent)', 
                                background: 'transparent', color: 'var(--accent)', fontWeight: '950', cursor: 'pointer'
                            }}
                        >
                            + Yeni Koli
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '500px', overflowY: 'auto', paddingRight: '1rem' }}>
                        {boxes.map(box => (
                            <div 
                                key={box.boxNumber} 
                                onClick={() => setCurrentBoxNumber(box.boxNumber)}
                                style={{ 
                                    padding: '1.5rem', borderRadius: '1.5rem', cursor: 'pointer', transition: 'var(--transition)',
                                    background: currentBoxNumber === box.boxNumber ? 'linear-gradient(135deg, rgba(37,99,235,0.15), rgba(37,99,235,0.05))' : 'var(--glass)',
                                    border: currentBoxNumber === box.boxNumber ? '2px solid var(--accent)' : '1px solid var(--glass-border)'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <div style={{ fontWeight: '950', color: 'var(--text-primary)' }}>Koli #{box.boxNumber}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{box.items.reduce((acc, i) => acc + i.qty, 0)} Ürün</div>
                                </div>
                                
                                {box.items.length === 0 ? (
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Bu koli boş.</div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {box.items.map((bItem, bIdx) => (
                                            <div key={bIdx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem' }}>
                                                <span style={{ color: 'var(--text-secondary)' }}>{bItem.sku}</span>
                                                <span style={{ fontWeight: '800', color: 'var(--text-primary)' }}>x{bItem.qty}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <button 
                        onClick={handleFinishPacking}
                        style={{ 
                            marginTop: 'auto', padding: '1.5rem', borderRadius: '1.5rem', border: 'none', 
                            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', 
                            color: '#fffffe', fontSize: '1.1rem', fontWeight: '950', cursor: 'pointer',
                            boxShadow: '0 10px 20px rgba(16,185,129,0.3)', textTransform: 'uppercase', letterSpacing: '1px'
                        }}
                    >
                        Tünele / Sorter'a Gönder
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PackingStation;
