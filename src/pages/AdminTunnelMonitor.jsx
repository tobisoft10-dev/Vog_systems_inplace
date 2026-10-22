import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import API_BASE_URL from '../services/apiConfig';

const AdminTunnelMonitor = () => {
    const { t, lang, theme } = useLanguage();
    const [scans, setScans] = useState([]);
    const [isScanning, setIsScanning] = useState(true);
    const [shipments, setShipments] = useState([]);
    const [readerStatus, setReaderStatus] = useState(null);
    const [selectedLocationKey, setSelectedLocationKey] = useState(null);
    const [activeShipment, setActiveShipment] = useState(null);
    const [showHelp, setShowHelp] = useState(false);

    // Live data states
    const [totalReadsToday, setTotalReadsToday] = useState(0);
    const [liveBoxes, setLiveBoxes] = useState([]);
    const [lastSeenTimestamp, setLastSeenTimestamp] = useState(null);

    // Dynamic filters state
    const [selectedBrand, setSelectedBrand] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [itemSearchQuery, setItemSearchQuery] = useState('');
    const [orderNumberSearch, setOrderNumberSearch] = useState('');
    const [sortBy, setSortBy] = useState('name_asc');
    const [progressFilter, setProgressFilter] = useState('All');
    const [activeTunnelMode, setActiveTunnelMode] = useState('person');

    // Fetch active tunnel scan mode on mount
    useEffect(() => {
        fetch(`${API_BASE_URL}/api/settings/tunnel-mode`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setActiveTunnelMode(data.mode);
                }
            })
            .catch(err => console.error('Error fetching tunnel mode:', err));
    }, []);

    const updateTunnelMode = (mode) => {
        fetch(`${API_BASE_URL}/api/settings/tunnel-mode`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                setActiveTunnelMode(data.mode);
            }
        })
        .catch(err => console.error('Error setting tunnel mode:', err));
    };

    const handleToggleAutoComplete = (currentVal) => {
        const newVal = !currentVal;
        fetch(`${API_BASE_URL}/api/tunnel/kiosk/set-auto-complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ autoComplete: newVal })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                setReaderStatus(prev => prev ? ({ ...prev, auto_complete: newVal }) : prev);
            }
        })
        .catch(err => console.error('Error toggling auto complete:', err));
    };

    // Fetch active shipments with selected brand on 3-second interval polling
    useEffect(() => {
        const fetchShipments = () => {
            fetch(`${API_BASE_URL}/api/shipments/active?brand=${selectedBrand}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setShipments(data.data);
                        
                        const stillExists = data.data.find(s => `${s.location_name}_${s.brand}_${s.grup}` === selectedLocationKey);
                        if (data.data.length > 0 && (!selectedLocationKey || !stillExists)) {
                            const firstKey = `${data.data[0].location_name}_${data.data[0].brand}_${data.data[0].grup}`;
                            setSelectedLocationKey(firstKey);
                            setActiveShipment(data.data[0]);
                        } else if (stillExists) {
                            setActiveShipment(stillExists);
                        } else {
                            setSelectedLocationKey(null);
                            setActiveShipment(null);
                        }
                    }
                })
                .catch(err => console.error('Error fetching shipments:', err));
        };

        fetchShipments();
        const interval = setInterval(fetchShipments, 3000);
        return () => clearInterval(interval);
    }, [selectedLocationKey, selectedBrand]);

    // Real-time scan log polling
    useEffect(() => {
        if (!isScanning) return;
        
        const fetchScans = () => {
            fetch(`${API_BASE_URL}/api/rfid/reads`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setScans(data.data.slice(0, 10));
                        if (data.total_today !== undefined) {
                            setTotalReadsToday(data.total_today);
                        }
                        
                        setLastSeenTimestamp(prev => {
                            const latestTime = prev || new Date(Date.now() - 5000).toISOString();
                            const newScans = data.data.filter(s => s.timestamp > latestTime);
                            if (newScans.length > 0) {
                                const newBoxes = newScans.map((s, i) => ({
                                    id: s.id || Math.random().toString(),
                                    icon: (s.rfid_tag && s.rfid_tag.includes('TSHIRT')) ? '👕' : '📦',
                                    addedAt: Date.now(),
                                    delay: i * 0.3
                                }));
                                setLiveBoxes(prevBoxes => [...prevBoxes, ...newBoxes]);
                                return newScans[0].timestamp;
                            }
                            return prev;
                        });
                    }
                });
        };

        fetchScans();
        const interval = setInterval(fetchScans, 2000);
        return () => clearInterval(interval);
    }, [isScanning]);

    // Cleanup live boxes after animation ends
    useEffect(() => {
        const boxInterval = setInterval(() => {
            setLiveBoxes(prev => prev.filter(b => Date.now() - b.addedAt < 4000));
        }, 1000);
        return () => clearInterval(boxInterval);
    }, []);

    // Fetch live Impinj R700 Reader telemetry & GPO states
    useEffect(() => {
        const fetchReaderStatus = () => {
            fetch(`${API_BASE_URL}/api/tunnel/kiosk/status`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setReaderStatus(data);
                    }
                })
                .catch(err => console.error('Error fetching reader status in monitor:', err));
        };

        fetchReaderStatus();
        const interval = setInterval(fetchReaderStatus, 2000);
        return () => clearInterval(interval);
    }, []);

    // Filter shipments by search query and completion status
    const filteredShipments = shipments.filter(s => {
        const query = searchQuery.toLowerCase().trim();
        const matchSearch = !query || 
            s.location_name.toLowerCase().includes(query) ||
            s.brand.toLowerCase().includes(query) ||
            (s.items && s.items.some(item => 
                (item.staff_name && item.staff_name.toLowerCase().includes(query)) ||
                (item.product_name && item.product_name.toLowerCase().includes(query))
            ));

        const progressRatio = s.target_quantity > 0 ? (s.scanned_quantity / s.target_quantity) : 0;
        const matchProgress = progressFilter === 'All' ||
            (progressFilter === 'Completed' && progressRatio >= 1) ||
            (progressFilter === 'Pending' && progressRatio < 1);

        const orderQuery = orderNumberSearch.toLowerCase().trim();
        let searchNumber = orderQuery;
        if (orderQuery.includes(' - ')) {
            searchNumber = orderQuery.split(' - ')[0].trim();
        }
        
        const matchOrder = !orderQuery || (s.items && s.items.some(item => item.order_number && String(item.order_number).toLowerCase().includes(searchNumber)));

        return matchSearch && matchProgress && matchOrder;
    });

    // Sort shipments based on selected criteria
    const sortedShipments = [...filteredShipments].sort((a, b) => {
        const progressA = a.target_quantity > 0 ? (a.scanned_quantity / a.target_quantity) : 0;
        const progressB = b.target_quantity > 0 ? (b.scanned_quantity / b.target_quantity) : 0;

        switch (sortBy) {
            case 'name_asc':
                return a.location_name.localeCompare(b.location_name);
            case 'name_desc':
                return b.location_name.localeCompare(a.location_name);
            case 'qty_desc':
                return b.target_quantity - a.target_quantity;
            case 'qty_asc':
                return a.target_quantity - b.target_quantity;
            case 'progress_desc':
                return progressB - progressA;
            case 'progress_asc':
                return progressA - progressB;
            default:
                return 0;
        }
    });

    const progress = activeShipment && activeShipment.target_quantity > 0 
        ? Math.min(100, Math.floor((activeShipment.scanned_quantity / activeShipment.target_quantity) * 100)) 
        : 0;
    const remainingCount = activeShipment ? Math.max(0, activeShipment.target_quantity - activeShipment.scanned_quantity) : 0;
    const scannedCount = activeShipment ? activeShipment.scanned_quantity : 0;

    // Extract unique order numbers with their brands, locations, and grups
    const orderNumberMap = new Map();
    shipments.forEach(s => {
        if (s.items) {
            s.items.forEach(item => {
                if (item.order_number) {
                    orderNumberMap.set(item.order_number, { brand: s.brand, location: s.location_name, grup: s.grup });
                }
            });
        }
    });
    
    const uniqueOrderNumbers = Array.from(orderNumberMap.keys()).sort((a, b) => a - b).map(num => ({
        num,
        brand: orderNumberMap.get(num).brand,
        location: orderNumberMap.get(num).location,
        grup: orderNumberMap.get(num).grup
    }));


    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            {/* Header / Banner area */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1.5rem',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                paddingBottom: '1.5rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: '950', color: 'var(--text-primary)', letterSpacing: '-1.5px', margin: 0 }} dangerouslySetInnerHTML={{__html: t('admin.tunnel.titleLive')}}></h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginTop: '0.5rem' }}>
                            <span style={{
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                background: 'var(--accent)',
                                boxShadow: `0 0 10px var(--accent)`,
                                animation: isScanning ? 'pulse 2s infinite' : 'none'
                            }}></span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: '800', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                                {isScanning ? t('admin.tunnel.statusActive') : t('admin.tunnel.statusStandby')}
                            </span>
                        </div>
                    </div>
                    {/* "?" Help Button */}
                    <button 
                        onClick={() => setShowHelp(true)}
                        style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'var(--accent)',
                            fontSize: '1.2rem',
                            fontWeight: '900',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: '0.3s',
                            boxShadow: '0 0 10px rgba(0, 229, 255, 0.1)',
                            marginTop: '-10px'
                        }}
                        onMouseOver={e => { e.currentTarget.style.background = 'rgba(0, 229, 255, 0.1)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                        onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                        ?
                    </button>
                </div>

                <button 
                    onClick={() => setIsScanning(!isScanning)}
                    style={{
                        padding: '0.8rem 2rem',
                        borderRadius: '100px',
                        border: `1px solid ${isScanning ? 'rgba(255, 59, 48, 0.2)' : 'rgba(0, 229, 255, 0.2)'}`,
                        background: isScanning ? 'rgba(255, 59, 48, 0.05)' : 'rgba(0, 229, 255, 0.05)',
                        color: isScanning ? '#ff3b30' : 'var(--accent)',
                        fontWeight: '900',
                        fontSize: '0.8rem',
                        letterSpacing: '1px',
                        cursor: 'pointer',
                        transition: '0.3s'
                    }}
                    onMouseOver={e => {
                        e.currentTarget.style.background = isScanning ? 'rgba(255, 59, 48, 0.1)' : 'rgba(0, 229, 255, 0.1)';
                    }}
                    onMouseOut={e => {
                        e.currentTarget.style.background = isScanning ? 'rgba(255, 59, 48, 0.05)' : 'rgba(0, 229, 255, 0.05)';
                    }}
                >
                    {isScanning ? t('admin.tunnel.stopStream') : t('admin.tunnel.startStream')}
                </button>
            </div>

            {/* Filter controls panel */}
            <div className="glass-card" style={{ padding: '1.2rem 2rem', borderRadius: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: '1 1 240px' }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>LOKASYON VEYA PERSONEL ARAMA</label>
                    <input 
                        type="text" 
                        placeholder="Aramak için yazın..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.1)', outline: 'none' }}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: '1 1 150px' }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>SİPARİŞ NO</label>
                    <input 
                        list="order-number-options"
                        value={orderNumberSearch}
                        onChange={(e) => setOrderNumberSearch(e.target.value)}
                        placeholder="Tüm Siparişler (Seç/Ara)"
                        style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: '#0d1117', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.1)', outline: 'none', cursor: 'text' }}
                    />
                    <datalist id="order-number-options">
                        {uniqueOrderNumbers.map(item => (
                            <option key={item.num} value={`${item.num} - ${item.location} ${item.grup ? `[${item.grup}]` : ''} (${item.brand})`} />
                        ))}
                    </datalist>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>MARKA FİLTRESİ</label>
                    <select 
                        value={selectedBrand} 
                        onChange={(e) => { setSelectedBrand(e.target.value); setSelectedLocationKey(null); setActiveShipment(null); }}
                        style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: '#0d1117', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', minWidth: '150px' }}
                    >
                        <option value="All">Tüm Markalar</option>
                        <option value="SEAT">SEAT</option>
                        <option value="AUDI">AUDI</option>
                        <option value="FORD">FORD</option>
                        <option value="ZARA">ZARA</option>
                    </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>İLERLEME DURUMU</label>
                    <select 
                        value={progressFilter} 
                        onChange={(e) => { setProgressFilter(e.target.value); setSelectedLocationKey(null); setActiveShipment(null); }}
                        style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: '#0d1117', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', minWidth: '180px' }}
                    >
                        <option value="All">Tüm Sevkiyatlar</option>
                        <option value="Pending">Bekleyenler / Devam Edenler</option>
                        <option value="Completed">Tamamlananlar (100%)</option>
                    </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>SIRALAMA</label>
                    <select 
                        value={sortBy} 
                        onChange={(e) => setSortBy(e.target.value)}
                        style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: '#0d1117', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', minWidth: '180px' }}
                    >
                        <option value="name_asc">Lokasyon Adı (A-Z)</option>
                        <option value="name_desc">Lokasyon Adı (Z-A)</option>
                        <option value="qty_desc">Toplam Ürün (Azalan)</option>
                        <option value="qty_asc">Toplam Ürün (Artan)</option>
                        <option value="progress_desc">İlerleme Oranı (Azalan)</option>
                        <option value="progress_asc">İlerleme Oranı (Artan)</option>
                    </select>
                </div>
            </div>

            {/* New Stacked Layout */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                
                {/* TOP ROW: Tunnel Animation + Active Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2.5rem', alignItems: 'stretch' }}>
                    
                    {/* Left: Tunnel Animation Hero */}
                    <div className="glass-card" style={{ 
                        padding: '2.5rem', 
                        borderRadius: '2rem', 
                        border: '1px solid rgba(255,255,255,0.05)', 
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.005) 100%)', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '1.5rem' 
                    }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: '900', color: 'var(--text-secondary)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                            {t('admin.tunnel.liveConveyor')}
                        </div>
                        <div className="rfid-tunnel-box" style={{ flex: 1, minHeight: '260px', borderRadius: '1.5rem', overflow: 'hidden', boxShadow: 'inset 0 10px 30px rgba(0,0,0,0.5)' }}>
                            <div className="rfid-tunnel-scanner-window">
                                <div className="rfid-scan-laser" style={{ width: '4px', boxShadow: '0 0 20px rgba(0,229,255,0.8)' }}></div>
                            </div>
                            <div className="rfid-conveyor-belt" style={{ backgroundSize: '40px 100%' }}></div>
                            {isScanning ? (
                                liveBoxes.map(box => (
                                    <div key={box.id} className="rfid-conveyor-item scanned" style={{ animationDelay: `${box.delay}s`, fontSize: '2.5rem' }}>{box.icon}</div>
                                ))
                            ) : (
                                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'var(--text-muted)', fontWeight: '900', fontSize: '1.2rem', zIndex: 10, letterSpacing: '2px', textTransform: 'uppercase' }}>
                                    {t('admin.tunnel.statusStandby')}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Active Order Summary & General Stats */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* Active Shipment Details Dashboard */}
                        {activeShipment ? (
                            <div className="glass-card" style={{ 
                                padding: '2rem', 
                                borderRadius: '2rem', 
                                background: 'rgba(255,255,255,0.01)', 
                                border: '1px solid rgba(255,255,255,0.06)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1.5rem',
                                flex: 1
                            }}>
                                <div>
                                    <span style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--accent)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                                        {activeShipment.brand} - AKTİF SEVKİYAT
                                    </span>
                                    <h2 style={{ fontSize: '1.6rem', fontWeight: '950', color: 'var(--text-primary)', margin: '0.5rem 0 0.2rem 0' }}>
                                        {activeShipment.location_name}
                                    </h2>
                                    <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '1rem', fontWeight: '800' }}>
                                        Toplam {activeShipment.items?.length || 0} Kalem Ürün
                                    </p>
                                    <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 0 0', fontSize: '0.85rem' }}>
                                        Tünel Monitöründe Koli/Sevkiyat Bekleniyor
                                    </p>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', flexWrap: 'wrap' }}>
                                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '1rem' }}>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '800' }}>
                                            {t('admin.tunnel.targetQty')}
                                        </div>
                                        <div style={{ fontSize: '1.3rem', fontWeight: '900', color: 'var(--text-primary)', marginTop: '0.4rem' }}>
                                            {activeShipment.target_quantity}
                                        </div>
                                    </div>
                                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '1rem' }}>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '800' }}>
                                            {t('admin.tunnel.scannedQty')}
                                        </div>
                                        <div style={{ fontSize: '1.3rem', fontWeight: '900', color: 'var(--accent)', marginTop: '0.4rem' }}>
                                            {scannedCount}
                                        </div>
                                    </div>
                                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '1rem' }}>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '800' }}>
                                            {t('admin.tunnel.remainingQty')}
                                        </div>
                                        <div style={{ fontSize: '1.3rem', fontWeight: '900', color: 'var(--text-primary)', marginTop: '0.4rem' }}>
                                            {remainingCount}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-secondary)' }}>
                                            {t('admin.tunnel.completionRatio')}
                                        </span>
                                        <span style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--accent)' }}>
                                            {progress}%
                                        </span>
                                    </div>
                                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.04)', borderRadius: '100px', overflow: 'hidden' }}>
                                        <div style={{ width: `${progress}%`, height: '100%', background: 'var(--accent)', boxShadow: `0 0 10px var(--accent)`, transition: 'width 0.5s' }}></div>
                                    </div>
                                </div>

                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.2rem', marginTop: '0.5rem' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.6rem', letterSpacing: '0.5px' }}>
                                        KOLİ ETİKETLEME STRATEJİSİ
                                    </span>
                                    <div style={{ display: 'flex', gap: '0.8rem' }}>
                                        <button 
                                            onClick={() => updateTunnelMode('person')}
                                            style={{
                                                flex: 1, padding: '0.8rem', borderRadius: '12px', border: '1px solid',
                                                borderColor: activeTunnelMode === 'person' ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
                                                background: activeTunnelMode === 'person' ? 'rgba(0, 229, 255, 0.08)' : 'rgba(255,255,255,0.01)',
                                                color: activeTunnelMode === 'person' ? 'var(--accent)' : 'var(--text-muted)',
                                                cursor: 'pointer', fontWeight: '900', fontSize: '0.75rem', transition: 'all 0.3s ease',
                                                boxShadow: activeTunnelMode === 'person' ? '0 0 15px rgba(0, 229, 255, 0.15)' : 'none'
                                            }}
                                        >
                                            👤 KİŞİ BAZLI
                                        </button>
                                        <button 
                                            onClick={() => updateTunnelMode('order')}
                                            style={{
                                                flex: 1, padding: '0.8rem', borderRadius: '12px', border: '1px solid',
                                                borderColor: activeTunnelMode === 'order' ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
                                                background: activeTunnelMode === 'order' ? 'rgba(0, 229, 255, 0.08)' : 'rgba(255,255,255,0.01)',
                                                color: activeTunnelMode === 'order' ? 'var(--accent)' : 'var(--text-muted)',
                                                cursor: 'pointer', fontWeight: '900', fontSize: '0.75rem', transition: 'all 0.3s ease',
                                                boxShadow: activeTunnelMode === 'order' ? '0 0 15px rgba(0, 229, 255, 0.15)' : 'none'
                                            }}
                                        >
                                            📦 SİPARİŞ BAZLI
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="glass-card" style={{ padding: '2rem', borderRadius: '2rem', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                                <div style={{ color: 'var(--text-muted)', fontWeight: '800' }}>{t('admin.tunnel.noActiveOrders')}</div>
                            </div>
                        )}
                        
                        {/* Stats Card */}
                        <div className="glass-card" style={{ 
                            padding: '1.5rem 2rem', 
                            borderRadius: '2rem', 
                            border: '1px solid rgba(255,255,255,0.05)', 
                            background: 'rgba(255,255,255,0.01)',
                            display: 'flex',
                            gap: '3rem',
                            alignItems: 'center'
                        }}>
                            <div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                                    {t('admin.tunnel.totalReads')}
                                </div>
                                <div style={{ fontSize: '1.6rem', fontWeight: '950', color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                                    {totalReadsToday} <small style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t('admin.tunnel.pcs')}</small>
                                </div>
                            </div>
                            <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.1)' }}></div>
                            <div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                                    {t('admin.tunnel.scanSpeed')}
                                </div>
                                <div style={{ fontSize: '1.6rem', fontWeight: '950', color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                                    {(() => {
                                        if (scans.length < 2) return '0.0';
                                        const sorted = [...scans].sort((a,b) => new Date(a.timestamp || a.scanned_at) - new Date(b.timestamp || b.scanned_at));
                                        const diff = (new Date(sorted[sorted.length-1].timestamp || sorted[sorted.length-1].scanned_at) - new Date(sorted[0].timestamp || sorted[0].scanned_at)) / 1000;
                                        return (diff / scans.length).toFixed(1);
                                    })()} <small style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t('admin.tunnel.secPerItem')}</small>
                                </div>
                            </div>
                        </div>
                        
                        {/* RFID Reader Diagnostics & Stack Light Card */}
                        {readerStatus && (
                            <div className="glass-card" style={{ 
                                padding: '1.5rem 2rem', 
                                borderRadius: '2rem', 
                                border: '1px solid rgba(255,255,255,0.05)', 
                                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.6) 0%, rgba(30, 41, 59, 0.4) 100%)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1rem'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-secondary)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                                        🤖 TÜNEL DONANIM DURUMU (IMPINJ R700)
                                    </span>
                                    <span style={{ 
                                        fontSize: '0.75rem', 
                                        color: '#10b981', 
                                        fontWeight: '900',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}>
                                        <span style={{ width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 8px #10b981' }}></span>
                                        BAĞLI
                                    </span>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.8rem' }}>
                                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '0.6rem 0.8rem', borderRadius: '1rem', textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: '800' }}>SICAKLIK</div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: '900', color: readerStatus.telemetry?.temperature > 50 ? '#ff3b30' : '#10b981', marginTop: '0.2rem' }}>
                                            {readerStatus.telemetry?.temperature || 42}°C
                                        </div>
                                    </div>
                                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '0.6rem 0.8rem', borderRadius: '1rem', textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: '800' }}>CPU YÜKÜ</div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: '900', color: 'var(--accent)', marginTop: '0.2rem' }}>
                                            %{readerStatus.telemetry?.cpu || 8}
                                        </div>
                                    </div>
                                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '0.6rem 0.8rem', borderRadius: '1rem', textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: '800' }}>GECİKME</div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#ffcc00', marginTop: '0.2rem' }}>
                                            {readerStatus.telemetry?.ping || 4} ms
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.8rem', fontSize: '0.75rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ color: 'var(--text-secondary)', fontWeight: '800' }}>🚨 STACK LIGHT:</span>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            {/* Red Light Indicator */}
                                            <span style={{ 
                                                width: '12px', 
                                                height: '12px', 
                                                borderRadius: '50%', 
                                                backgroundColor: '#ff3b30', 
                                                opacity: readerStatus.gpo?.red ? 1 : 0.2,
                                                boxShadow: readerStatus.gpo?.red ? '0 0 10px #ff3b30' : 'none',
                                                border: '1px solid rgba(255,255,255,0.2)' 
                                            }}></span>
                                            {/* Yellow Light Indicator */}
                                            <span style={{ 
                                                width: '12px', 
                                                height: '12px', 
                                                borderRadius: '50%', 
                                                backgroundColor: '#ffcc00', 
                                                opacity: readerStatus.gpo?.yellow ? 1 : 0.2,
                                                boxShadow: readerStatus.gpo?.yellow ? '0 0 10px #ffcc00' : 'none',
                                                border: '1px solid rgba(255,255,255,0.2)' 
                                            }}></span>
                                            {/* Green Light Indicator */}
                                            <span style={{ 
                                                width: '12px', 
                                                height: '12px', 
                                                borderRadius: '50%', 
                                                backgroundColor: '#4cd964', 
                                                opacity: readerStatus.gpo?.green ? 1 : 0.2,
                                                boxShadow: readerStatus.gpo?.green ? '0 0 10px #4cd964' : 'none',
                                                border: '1px solid rgba(255,255,255,0.2)' 
                                            }}></span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: '800' }}>KOLİ ETİKETİ BASIM MODU:</span>
                                        <button
                                            type="button"
                                            onClick={() => handleToggleAutoComplete(readerStatus.auto_complete)}
                                            style={{
                                                padding: '3px 8px',
                                                borderRadius: '6px',
                                                border: '1px solid ' + (readerStatus.auto_complete ? '#4cd964' : '#0284c7'),
                                                backgroundColor: readerStatus.auto_complete ? 'rgba(76,217,100,0.15)' : 'rgba(2,132,199,0.15)',
                                                color: readerStatus.auto_complete ? '#4cd964' : '#38bdf8',
                                                fontWeight: '900',
                                                fontSize: '0.72rem',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}
                                        >
                                            {readerStatus.auto_complete ? '🟢 OTOMATİK (7/7 Direkt Bas)' : '🔵 MANUEL (Onay Bekler)'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* BOTTOM ROW: Order Data Table + Live Logs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '2.5rem', alignItems: 'stretch' }}>
                    
                    {/* Left: Data Table for Long Orders */}
                    <div className="glass-card" style={{ 
                        padding: '2rem', 
                        borderRadius: '2rem', 
                        background: 'rgba(255,255,255,0.01)', 
                        border: '1px solid rgba(255,255,255,0.06)', 
                        display: 'flex', 
                        flexDirection: 'column' 
                    }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '950', color: 'var(--text-primary)', letterSpacing: '0.5px', margin: '0 0 1.5rem 0' }}>
                            AKTİF LOKASYONLAR & BAYİLER ({sortedShipments.length})
                        </h3>
                        <div style={{ overflowX: 'auto', maxHeight: '500px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '900', letterSpacing: '0.5px' }}>Lokasyon / Bayi</th>
                                        <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '900', letterSpacing: '0.5px' }}>Toplam Kalem</th>
                                        <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '900', letterSpacing: '0.5px' }}>Marka</th>
                                        <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '900', letterSpacing: '0.5px', textAlign: 'right' }}>İlerleme</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedShipments.length > 0 ? sortedShipments.map((s, index) => {
                                        const shipmentKey = `${s.location_name}_${s.brand}_${s.grup}`;
                                        const isSelected = selectedLocationKey === shipmentKey;
                                        const shipmentProgress = s.target_quantity > 0 ? Math.min(100, Math.floor((s.scanned_quantity / s.target_quantity) * 100)) : 0;
                                        return (
                                            <tr 
                                                key={s.location_name + index}
                                                onClick={() => { setSelectedLocationKey(shipmentKey); setActiveShipment(s); }}
                                                style={{ 
                                                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                                                    background: isSelected ? 'rgba(0, 229, 255, 0.08)' : 'transparent',
                                                    cursor: 'pointer',
                                                    transition: '0.2s',
                                                    boxShadow: isSelected ? 'inset 2px 0 0 var(--accent)' : 'none'
                                                }}
                                                onMouseOver={e => !isSelected && (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                                                onMouseOut={e => !isSelected && (e.currentTarget.style.background = 'transparent')}
                                            >
                                                <td style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: '900', color: isSelected ? 'var(--accent)' : 'var(--text-primary)' }}>
                                                    {s.location_name}
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ fontSize: '0.85rem', fontWeight: '900', color: 'var(--text-primary)' }}>{s.target_quantity} Adet</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.items?.length || 0} Farklı Kalem</div>
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '800' }}>{s.brand}</div>
                                                </td>
                                                <td style={{ padding: '1rem', minWidth: '160px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'flex-end' }}>
                                                        <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '100px', overflow: 'hidden' }}>
                                                            <div style={{ width: `${shipmentProgress}%`, height: '100%', background: isSelected ? 'var(--accent)' : 'var(--text-muted)', transition: 'width 0.3s' }}></div>
                                                        </div>
                                                        <span style={{ fontSize: '0.8rem', fontWeight: '900', color: isSelected ? 'var(--accent)' : 'var(--text-muted)', width: '40px', textAlign: 'right' }}>{shipmentProgress}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr><td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '800' }}>Aktif sevkiyat bulunmuyor.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Right: Shipment Items List */}
                    <div className="glass-card" style={{ 
                        padding: '2rem', 
                        borderRadius: '2rem', 
                        border: '1px solid rgba(255,255,255,0.05)', 
                        background: 'rgba(255,255,255,0.01)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.5rem',
                        maxHeight: '580px'
                    }}>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.9rem', fontWeight: '900', color: 'var(--text-secondary)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                                    SEVKİYAT İÇERİĞİ KONTROLÜ
                                </span>
                                <span style={{ 
                                    fontSize: '0.7rem', 
                                    fontWeight: '900', 
                                    color: isScanning ? 'var(--accent)' : '#ff3b30',
                                    background: isScanning ? 'rgba(0, 229, 255, 0.05)' : 'rgba(255, 59, 48, 0.05)',
                                    padding: '0.4rem 0.8rem',
                                    borderRadius: '100px',
                                    border: `1px solid ${isScanning ? 'rgba(0, 229, 255, 0.15)' : 'rgba(255, 59, 48, 0.15)'}`
                                }}>
                                    {isScanning ? 'SİSTEM AKTİF' : 'BEKLEMEDE'}
                                </span>
                            </div>
                            
                            {/* Items List Search Input */}
                            <input 
                                type="text"
                                placeholder="Personel veya ürün ara..."
                                value={itemSearchQuery}
                                onChange={(e) => setItemSearchQuery(e.target.value)}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '8px',
                                    background: 'rgba(255, 255, 255, 0.02)',
                                    color: 'var(--text-primary)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    outline: 'none',
                                    fontSize: '0.8rem',
                                    width: '100%'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', overflowY: 'auto', paddingRight: '0.5rem' }}>
                            {(() => {
                                if (!activeShipment || !activeShipment.items) {
                                    return (
                                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontWeight: '900', fontSize: '1.1rem', minHeight: '200px' }}>
                                            Lokasyon seçin...
                                        </div>
                                    );
                                }
                                
                                const filtered = activeShipment.items.filter(item => {
                                    const query = itemSearchQuery.toLowerCase().trim();
                                    return !query || 
                                        (item.staff_name && item.staff_name.toLowerCase().includes(query)) ||
                                        (item.product_name && item.product_name.toLowerCase().includes(query)) ||
                                        (item.size && String(item.size).toLowerCase().includes(query)) ||
                                        (item.grup && item.grup.toLowerCase().includes(query));
                                });
                                
                                if (filtered.length === 0) {
                                    return (
                                        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem', fontSize: '0.85rem' }}>
                                            Aramanıza uygun ürün bulunamadı.
                                        </div>
                                    );
                                }
                                
                                return filtered.map((item, idx) => {
                                    const isScanned = item.scanned;
                                    return (
                                        <div key={item.order_number + '_' + idx} style={{ 
                                            padding: '1rem 1.2rem', 
                                            background: isScanned ? 'rgba(0, 229, 255, 0.03)' : 'rgba(255,255,255,0.01)', 
                                            border: `1px solid ${isScanned ? 'rgba(0, 229, 255, 0.2)' : 'rgba(255,255,255,0.05)'}`, 
                                            borderRadius: '1.2rem',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            transition: 'all 0.3s'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ fontSize: '1.4rem' }}>{isScanned ? '✅' : '⏳'}</div>
                                                <div>
                                                    <div style={{ fontSize: '0.85rem', fontWeight: '900', color: isScanned ? 'var(--accent)' : 'var(--text-primary)' }}>{item.staff_name || 'Bilinmiyor'}</div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                                                        {item.product_name} - {item.size ? `Beden: ${item.size}` : 'Standart'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ 
                                                    fontSize: '0.65rem', 
                                                    fontWeight: '950', 
                                                    color: isScanned ? 'var(--accent)' : 'var(--text-muted)',
                                                    background: isScanned ? 'rgba(0, 229, 255, 0.05)' : 'rgba(255,255,255,0.05)',
                                                    padding: '0.3rem 0.6rem',
                                                    borderRadius: '100px',
                                                    border: `1px solid ${isScanned ? 'rgba(0, 229, 255, 0.15)' : 'rgba(255,255,255,0.05)'}`
                                                }}>
                                                    {isScanned ? 'OKUNDU' : 'EKSİK'}
                                                </div>
                                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.4rem', fontWeight: '800', fontFamily: 'monospace' }}>
                                                    Adet: {item.quantity}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Glassmorphic Help Modal */}
            {showHelp && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    background: 'rgba(4, 7, 18, 0.8)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    animation: 'fadeIn 0.3s ease'
                }}>
                    <div className="glass-card animate-up revealed" style={{
                        maxWidth: '550px',
                        width: '90%',
                        padding: '3rem',
                        borderRadius: '2.5rem',
                        border: '1px solid rgba(255,255,255,0.08)',
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%)',
                        boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
                        position: 'relative'
                    }}>
                        <button 
                            onClick={() => setShowHelp(false)}
                            style={{
                                position: 'absolute',
                                top: '2rem',
                                right: '2rem',
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-muted)',
                                fontSize: '1.2rem',
                                cursor: 'pointer',
                                transition: '0.3s'
                            }}
                            onMouseOver={e => e.currentTarget.style.color = 'var(--text-primary)'}
                            onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}
                        >
                            ✕
                        </button>
                        
                        <h2 style={{ fontSize: '1.8rem', fontWeight: '950', color: 'var(--text-primary)', margin: '0 0 1.5rem 0', letterSpacing: '-0.5px' }}>
                            📖 {t('admin.tunnel.guide.title')}
                        </h2>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <span style={{ fontSize: '1.2rem' }}>1️⃣</span>
                                <div>
                                    <strong style={{ color: 'var(--text-primary)' }}>{t('admin.tunnel.guide.step1Title')}</strong>
                                    <p style={{ marginTop: '0.2rem' }}>{t('admin.tunnel.guide.step1Desc')}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <span style={{ fontSize: '1.2rem' }}>2️⃣</span>
                                <div>
                                    <strong style={{ color: 'var(--text-primary)' }}>{t('admin.tunnel.guide.step2Title')}</strong>
                                    <p style={{ marginTop: '0.2rem' }}>{t('admin.tunnel.guide.step2Desc')}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <span style={{ fontSize: '1.2rem' }}>3️⃣</span>
                                <div>
                                    <strong style={{ color: 'var(--text-primary)' }}>{t('admin.tunnel.guide.step3Title')}</strong>
                                    <p style={{ marginTop: '0.2rem' }}>{t('admin.tunnel.guide.step3Desc')}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <span style={{ fontSize: '1.2rem' }}>4️⃣</span>
                                <div>
                                    <strong style={{ color: 'var(--text-primary)' }}>{t('admin.tunnel.guide.step4Title')}</strong>
                                    <p style={{ marginTop: '0.2rem' }}>{t('admin.tunnel.guide.step4Desc')}</p>
                                </div>
                            </div>
                        </div>
                        
                        <button 
                            onClick={() => setShowHelp(false)}
                            style={{
                                width: '100%',
                                marginTop: '2.5rem',
                                padding: '1rem',
                                borderRadius: '100px',
                                background: 'var(--accent)',
                                color: 'var(--midnight)',
                                border: 'none',
                                fontWeight: '950',
                                cursor: 'pointer',
                                letterSpacing: '0.5px',
                                transition: '0.3s'
                            }}
                            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            {t('admin.tunnel.guide.close')}
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.4); opacity: 0.6; }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes slideInRight {
                    from { transform: translateX(20px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default AdminTunnelMonitor;
