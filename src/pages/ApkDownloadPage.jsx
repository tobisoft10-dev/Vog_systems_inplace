import React, { useEffect, useState, useRef } from 'react';
import API_BASE_URL from '../services/apiConfig';
import bwipjs from '@bwip-js/browser';

const ApkDownloadPage = () => {
    const [info, setInfo] = useState({
        version: 'v1.5.2',
        build: 13,
        release_date: '06 Ekim 2026',
        filename: 'vog-terminal.apk',
        download_url: '/vog-terminal.apk',
        size: '24.4 MB',
        features: [
            '👔 Personel Bazlı Excel Sıralı Kolileme: Marka (SKODA, SCANIA) ve Bölüm (Danışman, Formen, Teknisyen vb.) seçimi, Excel satır sırasına göre koli no (1..N), personel kartı ve 7/6/4 parça giysi kontrol listesi',
            '🏷️ Godex G530 Dikey Koli Etiketi: Parça No, Açıklama, Beden, Adet 4 sütunlu koli etiketini doğrudan yazdırma ve mühürleme',
            '⚡ Yüksek Hızlı RFID Donmasız Sayaç (60 FPS & O(1) Pre-normalized Sets)',
            '🔕 Bildirim Sessizleştirme: Hatalı/yabancı etiketlerde ekranı kilitleyen pencereler kaldırıldı, anlık renkli kart ve titreşim korundu',
            '📦 Sevk Çıkış (Koli Paketleme): Canlı koli sayacı, mühürleme ve LOGO açık satış irsaliyesi entegrasyonu',
            '📥 Mal Kabul (Tesellüm & Stok Girişi): Sipariş karşılama, depoya giriş fişi (vouchers) ve hedef/kalan takibi',
            '🎯 4 Modlu Ana Navigasyon: Personel Kolileme, Sevk Çıkış, Mal Kabul ve Ayarlar',
            '🚫 %100 Mükerrer ve Yabancı Sipariş Filtreleme (3 Kademe)',
            '🔫 Chainway C72 / C66 UHF RFID ve Barkod Donanım Tetiği (Receive/Broadcast & Wedge)',
            '🔊 Yerel Android BİP! Buzzer ve Haptic Titreşim Geri Bildirimi',
            '💼 LOGO Tiger ERP LEM Paketi Açık Satış İrsaliyesi Entegrasyonu'
        ]
    });

    const [showOlderVersions, setShowOlderVersions] = useState(false);
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState('personnel'); // 'personnel' | 'shipping' | 'inbound' | 'hardware'
    const canvasRef = useRef(null);

    // Compute effective download URL (resolves to the host IP:3001 or API_BASE_URL)
    const host = typeof window !== 'undefined' ? window.location.hostname : '192.168.1.251';
    const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
    const apkDownloadUrl = API_BASE_URL 
        ? `${API_BASE_URL}/vog-terminal.apk` 
        : `${protocol}//${host}:3001/vog-terminal.apk`;

    const v152Url = API_BASE_URL ? `${API_BASE_URL}/vog-terminal-v1.5.2.apk` : `${protocol}//${host}:3001/vog-terminal-v1.5.2.apk`;
    const v151Url = API_BASE_URL ? `${API_BASE_URL}/vog-terminal-v1.5.1.apk` : `${protocol}//${host}:3001/vog-terminal-v1.5.1.apk`;
    const v150Url = API_BASE_URL ? `${API_BASE_URL}/vog-terminal-v1.5.0.apk` : `${protocol}//${host}:3001/vog-terminal-v1.5.0.apk`;
    const v140Url = API_BASE_URL ? `${API_BASE_URL}/vog-terminal-v1.4.0.apk` : `${protocol}//${host}:3001/vog-terminal-v1.4.0.apk`;
    const v131Url = API_BASE_URL ? `${API_BASE_URL}/vog-terminal-v1.3.1.apk` : `${protocol}//${host}:3001/vog-terminal-v1.3.1.apk`;

    useEffect(() => {
        fetch(`${API_BASE_URL || ''}/api/terminal/info`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setInfo(prev => ({
                        ...prev,
                        version: data.version || 'v1.5.2',
                        build: data.build || 13,
                        release_date: data.release_date || '06 Ekim 2026',
                        features: data.features || prev.features,
                        filename: data.filename || 'vog-terminal.apk',
                        size: data.size || prev.size
                    }));
                }
            })
            .catch(() => {});
    }, []);

    // Render high-contrast QR code on canvas
    useEffect(() => {
        if (canvasRef.current && apkDownloadUrl) {
            try {
                bwipjs.toCanvas(canvasRef.current, {
                    bcid: 'qrcode',
                    text: apkDownloadUrl,
                    scale: 4,
                    height: 32,
                    width: 32,
                    includetext: false
                });
            } catch (err) {
                console.error('QR code generation error:', err);
            }
        }
    }, [apkDownloadUrl]);

    const handleCopyUrl = () => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(apkDownloadUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        }
    };

    return (
        <div className="force-white-text" style={{
            minHeight: '100vh',
            backgroundColor: '#070a12',
            backgroundImage: 'radial-gradient(ellipse at top, #111d33 0%, #070a12 70%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px 16px',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
            <div style={{
                maxWidth: '680px',
                width: '100%',
                backgroundColor: '#0f172a',
                borderRadius: '28px',
                border: '1px solid #1e293b',
                padding: '36px 28px',
                boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 50px rgba(16, 185, 129, 0.1)',
                textAlign: 'center',
                position: 'relative'
            }}>
                {/* Header Badge */}
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid #10b981',
                    padding: '6px 16px',
                    borderRadius: '30px',
                    fontSize: '12px',
                    fontWeight: 800,
                    color: '#34d399',
                    marginBottom: '16px'
                }}>
                    <span style={{ fontSize: '14px' }}>✨</span>
                    <span>SON SÜRÜM YAYINLANDI • FLUTTER & CHAINWAY UHF</span>
                </div>

                {/* App Icon */}
                <div style={{
                    width: '92px',
                    height: '92px',
                    backgroundColor: '#1e293b',
                    borderRadius: '24px',
                    border: '2px solid #10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)',
                    position: 'relative'
                }}>
                    <span style={{ fontSize: '44px' }}>📱</span>
                    <span style={{
                        position: 'absolute',
                        top: '-10px',
                        right: '-10px',
                        background: '#e5a93c',
                        color: '#000',
                        fontSize: '11px',
                        fontWeight: 900,
                        padding: '3px 8px',
                        borderRadius: '12px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                    }}>
                        {info.version}
                    </span>
                </div>

                {/* Title & Badge */}
                <h1 className="force-white-text" style={{ fontSize: '26px', fontWeight: 900, color: '#ffffff', margin: '0 0 8px', letterSpacing: '-0.3px', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                    VOG Tekstil El Terminali (PDA)
                </h1>
                <p style={{ fontSize: '13.5px', color: '#94a3b8', margin: '0 0 18px', fontWeight: 500, lineHeight: 1.5 }}>
                    Chainway C72 / C66, Urovo, Zebra, Newland & Honeywell RFID Koli Paketleme Sistemi
                </p>

                {/* Version Badges */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '22px', flexWrap: 'wrap' }}>
                    <span style={{
                        backgroundColor: '#064e3b',
                        color: '#34d399',
                        border: '1px solid #10b981',
                        fontSize: '12px',
                        fontWeight: 800,
                        padding: '5px 14px',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        <span>✅</span>
                        <span>Aktif Sürüm: {info.version} (Build {info.build})</span>
                    </span>
                    <span style={{
                        backgroundColor: '#1e293b',
                        color: '#cbd5e1',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        padding: '5px 12px',
                        borderRadius: '20px',
                        border: '1px solid #334155'
                    }}>
                        📅 {info.release_date}
                    </span>
                    <span style={{
                        backgroundColor: '#1e293b',
                        color: '#38bdf8',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        padding: '5px 12px',
                        borderRadius: '20px',
                        border: '1px solid #0284c7'
                    }}>
                        💾 {info.size}
                    </span>
                    <span style={{
                        backgroundColor: '#2e1065',
                        color: '#c084fc',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        padding: '5px 12px',
                        borderRadius: '20px',
                        border: '1px solid #7e22ce'
                    }}>
                        🤖 Android 7.0+
                    </span>
                </div>

                {/* Major Highlight Card 1: Personel Bazlı Kolileme (v1.5.2) */}
                <div style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    border: '1.5px solid #10b981',
                    borderRadius: '18px',
                    padding: '16px 18px',
                    marginBottom: '16px',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px'
                }}>
                    <span style={{ fontSize: '28px', lineHeight: 1 }}>👔</span>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13.5px', fontWeight: 900, color: '#34d399', marginBottom: '4px' }}>
                            YENİ: Personel Bazlı Excel Sıralı Kolileme & Eşleştirme (v1.5.2)
                        </div>
                        <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.55' }}>
                            Skoda ve Scania departman bazında (Danışman, Formen, Teknisyen, Hasar Garanti vb.) Excel satır sırasına göre (1..N) koli gezintisi, personel ve bayi kartı, 7/6/4 parça giysi kontrol listesi ve tetiğe basıldığında anlık yeşil tikli parça eşleştirme.
                        </div>
                    </div>
                </div>

                {/* Major Highlight Card 2: Godex Dikey Koli Etiketi */}
                <div style={{
                    backgroundColor: 'rgba(56, 189, 248, 0.08)',
                    border: '1.5px solid #0284c7',
                    borderRadius: '18px',
                    padding: '16px 18px',
                    marginBottom: '20px',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px'
                }}>
                    <span style={{ fontSize: '28px', lineHeight: 1 }}>🏷️</span>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13.5px', fontWeight: 900, color: '#38bdf8', marginBottom: '4px' }}>
                            Godex G530 80x100mm Dikey 4 Sütunlu Koli Etiketi & Mühürleme
                        </div>
                        <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.55' }}>
                            Parça No, Ürün Açıklaması, Beden ve Adet 4 bağımsız sütunlu dikey formatta koli etiketini doğrudan el terminalinden ağ yazıcısına gönderme ve koli mühürleme.
                        </div>
                    </div>
                </div>

                {/* Primary Download Button */}
                <a
                    href={apkDownloadUrl}
                    download={info.filename}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: '#000000',
                        textDecoration: 'none',
                        padding: '18px 26px',
                        borderRadius: '16px',
                        fontSize: '17px',
                        fontWeight: 900,
                        boxShadow: '0 8px 32px rgba(16, 185, 129, 0.45)',
                        transition: 'all 0.2s ease',
                        marginBottom: '14px',
                        letterSpacing: '0.2px'
                    }}
                >
                    <span style={{ fontSize: '24px' }}>⬇️</span>
                    <span>EN SON SÜRÜMÜ İNDİR ({info.version} - {info.size})</span>
                </a>

                {/* Secondary Download Buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                    <a
                        href={v152Url}
                        download="vog-terminal-v1.5.2.apk"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            background: '#1e293b',
                            color: '#34d399',
                            textDecoration: 'none',
                            padding: '10px 14px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 800,
                            border: '1px solid #10b981'
                        }}
                    >
                        <span>📦</span>
                        <span>v1.5.2 Doğrudan APK</span>
                    </a>
                    <a
                        href={v151Url}
                        download="vog-terminal-v1.5.1.apk"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            background: '#1e293b',
                            color: '#94a3b8',
                            textDecoration: 'none',
                            padding: '10px 14px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 700,
                            border: '1px solid #334155'
                        }}
                    >
                        <span>📦</span>
                        <span>v1.5.1 Önceki Sürüm</span>
                    </a>
                </div>

                {/* Older Versions Toggle */}
                <div style={{ marginBottom: '22px' }}>
                    <button
                        onClick={() => setShowOlderVersions(!showOlderVersions)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#64748b',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            textDecoration: 'underline'
                        }}
                    >
                        {showOlderVersions ? '▲ Önceki Sürümleri Gizle' : '▼ Daha Eski Sürümleri Göster (v1.5.0, v1.4.0, v1.3.1)'}
                    </button>
                    {showOlderVersions && (
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '10px', flexWrap: 'wrap' }}>
                            <a href={v150Url} download="vog-terminal-v1.5.0.apk" style={{ color: '#94a3b8', fontSize: '11px', textDecoration: 'none', padding: '4px 10px', background: '#0a0f1d', borderRadius: '8px', border: '1px solid #1e293b' }}>
                                💾 v1.5.0 APK (24.1 MB)
                            </a>
                            <a href={v140Url} download="vog-terminal-v1.4.0.apk" style={{ color: '#94a3b8', fontSize: '11px', textDecoration: 'none', padding: '4px 10px', background: '#0a0f1d', borderRadius: '8px', border: '1px solid #1e293b' }}>
                                💾 v1.4.0 APK (24.1 MB)
                            </a>
                            <a href={v131Url} download="vog-terminal-v1.3.1.apk" style={{ color: '#94a3b8', fontSize: '11px', textDecoration: 'none', padding: '4px 10px', background: '#0a0f1d', borderRadius: '8px', border: '1px solid #1e293b' }}>
                                💾 v1.3.1 APK (23.9 MB)
                            </a>
                        </div>
                    )}
                </div>

                {/* QR Code & Direct PDA Scanning Box */}
                <div style={{
                    backgroundColor: '#182234',
                    border: '1px solid #233554',
                    borderRadius: '18px',
                    padding: '20px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '18px',
                    textAlign: 'left'
                }}>
                    <div style={{
                        background: '#ffffff',
                        padding: '10px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                    }}>
                        <canvas ref={canvasRef} style={{ width: '100px', height: '100px', display: 'block' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12.5px', fontWeight: 900, color: '#e5a93c', marginBottom: '4px' }}>
                            📸 HIZLI QR İNDİRME:
                        </div>
                        <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5', marginBottom: '10px' }}>
                            El terminalinizin kamerasıyla veya telefonunuzla yandaki QR kodu taratarak doğrudan indirin.
                        </div>
                        <button
                            onClick={handleCopyUrl}
                            style={{
                                background: copied ? '#065f46' : '#1e293b',
                                color: copied ? '#34d399' : '#38bdf8',
                                border: `1px solid ${copied ? '#10b981' : '#38bdf8'}`,
                                borderRadius: '10px',
                                padding: '8px 14px',
                                fontSize: '11.5px',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <span>{copied ? '✅' : '📋'}</span>
                            <span>{copied ? 'Bağlantı Kopyalandı!' : 'İndirme Linkini Kopyala'}</span>
                        </button>
                    </div>
                </div>

                {/* Direct Link Display */}
                <div style={{
                    backgroundColor: '#0a0f1d',
                    borderRadius: '14px',
                    padding: '14px 16px',
                    textAlign: 'left',
                    border: '1px solid #1e293b',
                    marginBottom: '20px'
                }}>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', marginBottom: '6px' }}>
                        🌐 Terminal Chrome / Tarayıcı Doğrudan Linki:
                    </div>
                    <code style={{ fontSize: '12.5px', color: '#38bdf8', wordBreak: 'break-all', fontFamily: 'monospace', fontWeight: 800, display: 'block' }}>
                        {apkDownloadUrl}
                    </code>
                </div>

                {/* Module Highlights Tabs */}
                <div style={{
                    backgroundColor: '#0f172a',
                    borderRadius: '18px',
                    border: '1px solid #1e293b',
                    padding: '20px',
                    textAlign: 'left',
                    marginBottom: '20px'
                }}>
                    <div style={{ fontSize: '13px', fontWeight: 900, color: '#34d399', marginBottom: '14px', letterSpacing: '0.4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>📋 SÜRÜM {info.version} MODÜLLERİ:</span>
                        <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>4 Ana Sekme</span>
                    </div>

                    {/* Navigation Pills */}
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => setActiveTab('personnel')}
                            style={{
                                background: activeTab === 'personnel' ? '#10b981' : '#1e293b',
                                color: activeTab === 'personnel' ? '#000' : '#cbd5e1',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '6px 12px',
                                fontSize: '11.5px',
                                fontWeight: 800,
                                cursor: 'pointer'
                            }}
                        >
                            👔 Personel
                        </button>
                        <button
                            onClick={() => setActiveTab('shipping')}
                            style={{
                                background: activeTab === 'shipping' ? '#10b981' : '#1e293b',
                                color: activeTab === 'shipping' ? '#000' : '#cbd5e1',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '6px 12px',
                                fontSize: '11.5px',
                                fontWeight: 800,
                                cursor: 'pointer'
                            }}
                        >
                            📦 Sevk Çıkış
                        </button>
                        <button
                            onClick={() => setActiveTab('inbound')}
                            style={{
                                background: activeTab === 'inbound' ? '#10b981' : '#1e293b',
                                color: activeTab === 'inbound' ? '#000' : '#cbd5e1',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '6px 12px',
                                fontSize: '11.5px',
                                fontWeight: 800,
                                cursor: 'pointer'
                            }}
                        >
                            📥 Mal Kabul
                        </button>
                        <button
                            onClick={() => setActiveTab('hardware')}
                            style={{
                                background: activeTab === 'hardware' ? '#10b981' : '#1e293b',
                                color: activeTab === 'hardware' ? '#000' : '#cbd5e1',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '6px 12px',
                                fontSize: '11.5px',
                                fontWeight: 800,
                                cursor: 'pointer'
                            }}
                        >
                            ⚙️ Donanım & Ayarlar
                        </button>
                    </div>

                    {/* Tab Contents */}
                    {activeTab === 'personnel' && (
                        <div style={{ fontSize: '12.5px', color: '#cbd5e1', lineHeight: '1.7' }}>
                            <div style={{ fontWeight: 800, color: '#34d399', marginBottom: '4px' }}>👔 Personel Bazlı Kolileme (Öncelikli Ekran):</div>
                            • Firma ve Departman (Danışman, Formen, Teknisyen vb.) filtreleme<br />
                            • Excel satır sırasına göre 1..N koli gezintisi (`Önceki`, `Sonraki`, Modal Koli Arama)<br />
                            • Personel adı, bayi, koli barkodu ve 7/6/4 parçalık giysi kontrol listesi<br />
                            • Tabanca tetiğiyle okunan kıyafetlerde otomatik yeşil onay rozeti<br />
                            • Godex G530 dikey koli etiketi yazdırma ve otomatik mühürleme
                        </div>
                    )}
                    {activeTab === 'shipping' && (
                        <div style={{ fontSize: '12.5px', color: '#cbd5e1', lineHeight: '1.7' }}>
                            <div style={{ fontWeight: 800, color: '#38bdf8', marginBottom: '4px' }}>📦 Sevk Çıkış (Toptan Koli):</div>
                            • Canlı koli içi sayaç ve hedef adet kontrolü<br />
                            • Mükerrer ve yabancı sipariş etiket filtreleme<br />
                            • Koli tamamlama, mühürleme ve LOGO açık satış irsaliyesi aktarımı
                        </div>
                    )}
                    {activeTab === 'inbound' && (
                        <div style={{ fontSize: '12.5px', color: '#cbd5e1', lineHeight: '1.7' }}>
                            <div style={{ fontWeight: 800, color: '#fbbf24', marginBottom: '4px' }}>📥 Mal Kabul (Stok Girişi):</div>
                            • Sipariş bazında depoya giriş fişi karşılama<br />
                            • Hedef ve kalan miktar takibi<br />
                            • Hatalı veya siparişte olmayan ürün uyarısı
                        </div>
                    )}
                    {activeTab === 'hardware' && (
                        <div style={{ fontSize: '12.5px', color: '#cbd5e1', lineHeight: '1.7' }}>
                            <div style={{ fontWeight: 800, color: '#c084fc', marginBottom: '4px' }}>⚙️ Donanım & Ağ Ayarları:</div>
                            • Chainway C72 / C66 fiziksel tabanca tetiği entegrasyonu<br />
                            • Barkod ve RFID çift modlu tarayıcı seçimi<br />
                            • Yerel Android BİP sesi ve titreşim geri bildirimi<br />
                            • Sunucu IP ve operatör adı konfigürasyonu
                        </div>
                    )}
                </div>

                {/* Compatible Devices */}
                <div style={{
                    backgroundColor: '#0a0f1d',
                    borderRadius: '14px',
                    border: '1px solid #1e293b',
                    padding: '12px 16px',
                    textAlign: 'left',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <span style={{ fontSize: '20px' }}>📟</span>
                    <div style={{ fontSize: '11.5px', color: '#94a3b8', lineHeight: '1.4' }}>
                        <strong style={{ color: '#cbd5e1' }}>Uyumlu Donanımlar:</strong> Chainway C72, C66, C70, Urovo DT50/RT40, Zebra TC26/MC3300 RFID, Newland, Honeywell & tüm Android cihazlar.
                    </div>
                </div>

                {/* Installation Steps Box */}
                <div style={{
                    backgroundColor: '#1e1b4b',
                    border: '1px solid #4338ca',
                    borderRadius: '16px',
                    padding: '16px 20px',
                    textAlign: 'left',
                    color: '#c7d2fe',
                    fontSize: '12px',
                    lineHeight: '1.6',
                    marginBottom: '22px'
                }}>
                    <div style={{ fontWeight: 900, color: '#ffffff', marginBottom: '6px', fontSize: '13px' }}>
                        🚀 3 Adımda Kolay Kurulum:
                    </div>
                    <div><strong>1. İndirin:</strong> Yukarıdaki <strong>EN SON SÜRÜMÜ İNDİR</strong> butonuna dokunun veya QR kodu taratın.</div>
                    <div><strong>2. Kurun / Güncelleyin:</strong> İndirilen <code>vog-terminal.apk</code> dosyasına dokunup <strong>Güncelle</strong> deyin.</div>
                    <div><strong>3. Taramaya Başlayın:</strong> Firma ve bölümü seçip fiziksel tabanca tetiğine basarak hemen koli paketlemeye başlayın.</div>
                </div>

                {/* Back to Admin */}
                <div>
                    <a href="/admin" style={{ color: '#64748b', fontSize: '12.5px', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <span>←</span>
                        <span>Yönetim Paneline Dön</span>
                    </a>
                </div>
            </div>
        </div>
    );
};

export default ApkDownloadPage;
