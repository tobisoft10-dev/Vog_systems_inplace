import React, { useState, useEffect, useRef } from 'react';
import API_BASE_URL from '../services/apiConfig';

const HandheldDemoAnimation = () => {
    const [activeStage, setActiveStage] = useState('receiving');
    const [scannedItems, setScannedItems] = useState([]);
    const [currentBarcode, setCurrentBarcode] = useState('');
    const [status, setStatus] = useState(null);
    const [selectedOrderNo, setSelectedOrderNo] = useState('5285');
    const [isPlaying, setIsPlaying] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);

    // Mock order and items data for realistic simulation
    const mockOrder = {
        order_number: '5285',
        sub_customer_name: 'SEAT İstanbul Ana Bayi',
        brand: 'SEAT',
        total_qty: 10
    };

    const mockProducts = [
        { code: '8691234567890', name: 'SEAT Polo Tişört', size: 'L', staff: 'Ahmet Yılmaz' },
        { code: '8691234567891', name: 'SEAT Polo Tişört', size: 'M', staff: 'Mehmet Demir' },
        { code: '8691234567892', name: 'SEAT Pantolon', size: '42', staff: 'Ali Kaya' },
        { code: '8691234567893', name: 'SEAT Kışlık Mont', size: 'L', staff: 'Hasan Şahin' },
        { code: '8691234567894', name: 'SEAT Yelek', size: 'XL', staff: 'Veli Can' },
        { code: '8691234567895', name: 'SEAT Şapka', size: 'Std', staff: 'Murat Arslan' },
        { code: '8691234567896', name: 'SEAT Polo Tişört', size: 'XL', staff: 'Osman Yıldız' },
        { code: '8691234567897', name: 'SEAT Pantolon', size: '44', staff: 'İbrahim Çelik' },
        { code: '8691234567898', name: 'SEAT Kışlık Mont', size: 'M', staff: 'Kemal Güneş' },
        { code: '8691234567899', name: 'SEAT İş Ayakkabısı', size: '43', staff: 'Caner Bulut' }
    ];

    const currentReceived = scannedItems.length;
    const progressPercent = Math.min(100, Math.round((currentReceived / mockOrder.total_qty) * 100));
    const isCompleted = currentReceived >= mockOrder.total_qty;

    // Web Audio Beep Sound
    const playBeep = (freq = 900, duration = 0.08) => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + duration);
        } catch (e) {}
    };

    const playSuccessChime = () => {
        playBeep(523.25, 0.1);
        setTimeout(() => playBeep(659.25, 0.1), 100);
        setTimeout(() => playBeep(783.99, 0.2), 200);
    };

    const handleNextStep = () => {
        if (stepIndex >= mockProducts.length) {
            setIsPlaying(false);
            return;
        }

        const prod = mockProducts[stepIndex];
        setCurrentBarcode(prod.code);
        playBeep(1200, 0.08);

        setTimeout(() => {
            setScannedItems(prev => [{
                code: prod.code,
                product_name: prod.name,
                order_id: mockOrder.order_number,
                sku: `SKU-${prod.code.slice(-4)}`,
                size: prod.size,
                staff_name: prod.staff,
                sub_customer_name: mockOrder.sub_customer_name,
                received_qty: stepIndex + 1,
                total_qty: mockOrder.total_qty,
                progress_percent: Math.round(((stepIndex + 1) / mockOrder.total_qty) * 100),
                is_completed: (stepIndex + 1) >= mockOrder.total_qty,
                timestamp: new Date().toLocaleTimeString('tr-TR')
            }, ...prev]);

            setStepIndex(prev => prev + 1);

            if ((stepIndex + 1) >= mockOrder.total_qty) {
                playSuccessChime();
                setStatus({
                    type: 'success',
                    message: `🎉 SİPARİŞ #${mockOrder.order_number} %100 TAMAMLANDI & VOUCHERS STOKUNA AKTARILDI!`
                });
                setIsPlaying(false);
            } else {
                setStatus({
                    type: 'success',
                    message: `✅ TESELLÜM OK: ${prod.name} (#${mockOrder.order_number}: %${Math.round(((stepIndex + 1) / mockOrder.total_qty) * 100)})`
                });
            }
        }, 300);
    };

    useEffect(() => {
        let timer;
        if (isPlaying) {
            timer = setInterval(() => {
                handleNextStep();
            }, 1200);
        }
        return () => clearInterval(timer);
    }, [isPlaying, stepIndex]);

    const handleReset = () => {
        setIsPlaying(false);
        setStepIndex(0);
        setScannedItems([]);
        setCurrentBarcode('');
        setStatus(null);
        setSelectedOrderNo('5285');
    };

    const getStageColor = (stage) => {
        switch(stage) {
            case 'receiving': return '#38bdf8';
            case 'stocking': return '#ffaa00';
            case 'dispatch': return '#00ff66';
            default: return '#38bdf8';
        }
    };

    const getStageColorBg = (stage) => {
        switch(stage) {
            case 'receiving': return 'rgba(56, 189, 248, 0.15)';
            case 'stocking': return 'rgba(255, 170, 0, 0.15)';
            case 'dispatch': return 'rgba(0, 255, 102, 0.15)';
            default: return 'rgba(56, 189, 248, 0.15)';
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            width: '100vw',
            background: '#040711',
            color: '#fffffe',
            fontFamily: "'Space Grotesk', 'Inter', sans-serif",
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '1.5rem 1rem'
        }}>
            {/* Top Presentation Header */}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem', maxWidth: '800px' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: '950', background: 'linear-gradient(135deg, #ffffff, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0, letterSpacing: '1px' }}>
                    VOG TEKSTİL WMS - GERÇEK EL TERMINALİ TESELLÜM ANİMASYONU
                </h1>
                <p style={{ color: '#8892b0', fontSize: '0.95rem', marginTop: '0.4rem' }}>
                    Depo Kabulü, Canlı Yüzde İlerlemesi ve Vouchers Tablosuna Otomatik Kayıt İşleyişi
                </p>
            </div>

            {/* Animation Control Bar */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    style={{
                        background: isPlaying ? 'linear-gradient(135deg, #e11d48, #ff4b4b)' : 'linear-gradient(135deg, #0284c7, #38bdf8)',
                        color: '#040711',
                        border: 'none',
                        padding: '0.8rem 1.8rem',
                        borderRadius: '100px',
                        fontWeight: '950',
                        fontSize: '0.95rem',
                        cursor: 'pointer',
                        boxShadow: '0 0 20px rgba(56, 189, 248, 0.4)',
                        transition: 'all 0.3s ease'
                    }}
                >
                    {isPlaying ? '⏸️ Animasyonu Duraklat' : '▶️ Animasyonu Otomatik Başlat'}
                </button>
                <button
                    onClick={handleNextStep}
                    style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#fffffe',
                        padding: '0.8rem 1.5rem',
                        borderRadius: '100px',
                        fontWeight: '950',
                        fontSize: '0.9rem',
                        cursor: 'pointer'
                    }}
                >
                    ⏩ Adım Adım Barkod Okut
                </button>
                <button
                    onClick={handleReset}
                    style={{
                        background: 'rgba(255, 75, 75, 0.1)',
                        border: '1px solid rgba(255, 75, 75, 0.3)',
                        color: '#ff4b4b',
                        padding: '0.8rem 1.5rem',
                        borderRadius: '100px',
                        fontWeight: '950',
                        fontSize: '0.9rem',
                        cursor: 'pointer'
                    }}
                >
                    🔄 Sıfırla
                </button>
            </div>

            {/* Mobile Handheld Device Container Mockup */}
            <div style={{
                width: '100%',
                maxWidth: '480px',
                background: '#080d21',
                borderRadius: '2rem',
                border: '2px solid rgba(56, 189, 248, 0.3)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(56, 189, 248, 0.15)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '750px'
            }}>
                {/* Real Handheld Header */}
                <header style={{ 
                    padding: '1.2rem 1.5rem', 
                    background: '#080d21', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    borderBottom: '1px solid rgba(255,255,255,0.06)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>📱</span>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '950', letterSpacing: '1px', textTransform: 'uppercase' }}>
                                EL TERMINALI (WMS)
                            </h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '0.2rem' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00ff66', display: 'inline-block', boxShadow: '0 0 10px #00ff66' }}></span>
                                <span style={{ fontSize: '0.7rem', color: '#8892b0', fontWeight: '800', letterSpacing: '0.5px' }}>RFID TERMINAL ONLINE</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Stage Selector */}
                <div style={{ display: 'flex', padding: '0.8rem', gap: '0.5rem', background: '#080d21', overflowX: 'auto', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    {['receiving', 'stocking', 'dispatch'].map(stage => (
                        <button
                            key={stage}
                            onClick={() => setActiveStage(stage)}
                            style={{
                                flex: 1, 
                                padding: '0.8rem 1rem', 
                                minWidth: '100px', 
                                borderRadius: '100px', 
                                border: activeStage === stage ? `1px solid ${getStageColor(stage)}` : '1px solid rgba(255,255,255,0.05)',
                                background: activeStage === stage ? getStageColorBg(stage) : 'rgba(255,255,255,0.02)',
                                color: activeStage === stage ? getStageColor(stage) : '#8892b0', 
                                fontSize: '0.8rem', 
                                fontWeight: '950', 
                                cursor: 'pointer',
                                textTransform: 'uppercase'
                            }}
                        >
                            {stage === 'receiving' ? 'MAL KABUL (TESELLÜM)' : stage === 'stocking' ? 'STOKLAMA' : 'SEVKİYAT'}
                        </button>
                    ))}
                </div>

                {/* Pending Order Selector & Live Progress Bar */}
                <div style={{ padding: '0.9rem 1.2rem', background: '#0a1029', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.8rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: '900', color: '#38bdf8', whiteSpace: 'nowrap' }}>📋 SİPARİŞ:</span>
                        <div style={{
                            flex: 1,
                            background: '#040711',
                            color: isCompleted ? '#00ff66' : '#fffffe',
                            border: `1px solid ${isCompleted ? '#00ff66' : 'rgba(56, 189, 248, 0.4)'}`,
                            borderRadius: '0.8rem',
                            padding: '0.6rem 0.8rem',
                            fontSize: '0.85rem',
                            fontWeight: '900'
                        }}>
                            {isCompleted ? '✨ Tüm Siparişler Tamamlandı!' : `#5285 - SEAT İstanbul (${currentReceived}/10 Adet - %${progressPercent})`}
                        </div>
                    </div>

                    {/* Progress Bar Track */}
                    <div style={{ background: 'rgba(56, 189, 248, 0.08)', borderRadius: '0.8rem', padding: '0.8rem', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', fontSize: '0.8rem', fontWeight: '900' }}>
                            <span style={{ color: '#fffffe' }}>Sipariş #5285 Doluluk Oranı:</span>
                            <span style={{ color: isCompleted ? '#00ff66' : '#38bdf8' }}>{currentReceived} / 10 Adet (%{progressPercent})</span>
                        </div>
                        <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '100px', overflow: 'hidden' }}>
                            <div style={{ 
                                width: `${progressPercent}%`, 
                                height: '100%', 
                                background: isCompleted ? '#00ff66' : 'linear-gradient(90deg, #38bdf8, #00ff66)', 
                                borderRadius: '100px', 
                                transition: 'width 0.4s ease' 
                            }} />
                        </div>
                    </div>
                </div>

                {/* Status & Feedback Area */}
                {status && (
                    <div style={{ 
                        padding: '1rem', 
                        textAlign: 'center', 
                        fontSize: '0.95rem', 
                        fontWeight: '950',
                        background: status.type === 'success' ? 'rgba(0, 255, 102, 0.15)' : 'rgba(255, 75, 75, 0.15)',
                        color: status.type === 'success' ? '#00ff66' : '#ff4b4b', 
                        borderBottom: status.type === 'success' ? '1px solid #00ff66' : '1px solid #ff4b4b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        {status.message}
                    </div>
                )}

                {/* Scanner Input Area */}
                <div style={{ padding: '1.2rem', background: '#060b1e', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <span style={{ position: 'absolute', left: '1rem', fontSize: '1.2rem', opacity: 0.6 }}>⚡</span>
                        <input
                            type="text"
                            value={currentBarcode}
                            readOnly
                            placeholder="BARKOD / EAN-13 LAZER TARAMASI..."
                            style={{ 
                                flex: 1, 
                                padding: '1rem 1rem 1rem 2.8rem', 
                                fontSize: '1.1rem', 
                                borderRadius: '1rem',
                                border: '2px solid #38bdf8', 
                                background: '#02040a', 
                                color: '#00ff66',
                                letterSpacing: '2px', 
                                fontWeight: '950',
                                outline: 'none',
                                fontFamily: 'Courier New, monospace'
                            }}
                        />
                    </div>
                </div>

                {/* Scanned Items List */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.2rem', background: '#040711', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div style={{ fontSize: '0.75rem', color: '#8892b0', fontWeight: '900', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                        SON OKUTULAN TESELLÜM KALEMLERİ ({scannedItems.length})
                    </div>
                    {scannedItems.map((item, index) => (
                        <div key={index} style={{ 
                            background: '#080d21', 
                            padding: '0.9rem 1.2rem', 
                            borderRadius: '1rem', 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            border: '1px solid rgba(255,255,255,0.05)',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                <span style={{ color: '#38bdf8', fontWeight: '950', fontSize: '0.8rem' }}>#{scannedItems.length - index}</span>
                                <div>
                                    <div style={{ fontFamily: 'Courier New, monospace', letterSpacing: '1px', fontSize: '1rem', fontWeight: '900', color: '#fffffe' }}>
                                        {item.code}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#8892b0', marginTop: '0.2rem', display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                                        <span style={{ color: '#38bdf8' }}>📦 {item.product_name}</span>
                                        <span>Beden: {item.size}</span>
                                        <span>👤 {item.staff_name}</span>
                                    </div>
                                </div>
                            </div>
                            <span style={{ background: 'rgba(0, 255, 102, 0.15)', color: '#00ff66', border: '1px solid #00ff66', padding: '0.2rem 0.5rem', borderRadius: '100px', fontSize: '0.7rem', fontWeight: '900' }}>
                                VOUCHERS OK
                            </span>
                        </div>
                    ))}
                    {scannedItems.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#4c526d', fontSize: '0.9rem', fontWeight: '800' }}>
                            <div style={{ fontSize: '2.5rem', opacity: 0.3, marginBottom: '0.5rem' }}>📶</div>
                            <div>Otomatik oynatmayı başlatın veya barkod okutun</div>
                        </div>
                    )}
                </div>

                {/* Database Sync Footer Bar */}
                <div style={{ padding: '1rem 1.2rem', background: '#080d21', borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', color: '#8892b0', fontWeight: '800' }}>
                        🗄️ Veritabanı Durumu: <span style={{ color: '#00ff66' }}>Vouchers Kaydı Aktif</span> | Location: <span style={{ color: '#38bdf8' }}>Ana Depo Tesellüm</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HandheldDemoAnimation;
