const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'pages', 'TunnelKioskPage.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. UPDATE GIANT BUTTON LABELS FOR PERSONNEL
const oldButtonText = `{session.status === 'COMPLETED'
                                ? '🎉 TÜM KOLİLER BİTTİ — YENİ SİPARİŞ SEÇİN 📦'
                                : (session.status === 'BOX_COMPLETED'
                                    ? \`▶️ \${session.box_no}. KOLİYİ BAŞLAT (\${session.box_no}/\${session.total_boxes || 1}) 📦\`
                                    : (session.status === 'PAUSED'
                                        ? '▶️ Tünel Duraklatıldı — Devam Et'
                                        : (isTargetReached
                                            ? \`✨ HEDEF TAMAM (\${session.scanned_quantity}/\${session.target_quantity}) — 🏷️ KOLİ ETİKETİNİ BAS & BİTİR 📦\`
                                            : '🏷️ KOLİYİ TAMAMLA & ETİKET BAS (PRINT)')))}`;

const newButtonText = `{session.status === 'COMPLETED'
                                ? '🎉 TÜM KOLİLER BİTTİ — YENİ SİPARİŞ / PERSONEL SEÇİN 📦'
                                : (session.status === 'BOX_COMPLETED'
                                    ? (session.session_type === 'PERSONNEL'
                                        ? \`▶️ \${session.box_no}. KOLİYİ BAŞLAT (\${session.staff_name || 'Personel'}) 👤\`
                                        : \`▶️ \${session.box_no}. KOLİYİ BAŞLAT (\${session.box_no}/\${session.total_boxes || 1}) 📦\`)
                                    : (session.status === 'PAUSED'
                                        ? '▶️ Tünel Duraklatıldı — Devam Et'
                                        : (session.session_type === 'PERSONNEL'
                                            ? (isTargetReached
                                                ? \`✨ \${session.staff_name || 'PERSONEL'} KOLİSİ TAMAM (\${session.scanned_quantity}/\${session.target_quantity}) — 🏷️ ETİKET BAS & SIRADAKİNE GEÇ ➔\`
                                                : \`🏷️ KOLİYİ TAMAMLA & SIRADAKİNE GEÇ (#\${session.box_no || 1}) ➔\`)
                                            : (isTargetReached
                                                ? \`✨ HEDEF TAMAM (\${session.scanned_quantity}/\${session.target_quantity}) — 🏷️ KOLİ ETİKETİNİ BAS & BİTİR 📦\`
                                                : '🏷️ KOLİYİ TAMAMLA & ETİKET BAS (PRINT)'))))}`;

if (content.includes(oldButtonText)) {
    content = content.replace(oldButtonText, newButtonText);
    console.log('✅ Button labels patched successfully.');
} else {
    console.warn('⚠️ oldButtonText not found directly, checking partial...');
}

// 2. UPDATE MODAL STRUCTURE WITH TAB SWITCHER AND PERSONNEL MODE
const modalOldStart = `{/* MODAL HEADER */}
                        <div style={{
                            padding: '18px 24px',
                            backgroundColor: '#1a2234',
                            borderBottom: '1px solid #334155',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <h2 style={{ margin: 0, fontSize: '18px', color: '#f8fafc', fontWeight: 800 }}>
                                📦 Taranacak Siparişi Seçin
                            </h2>
                            <button
                                onClick={() => setIsOrderModalOpen(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#94a3b8',
                                    fontSize: '24px',
                                    cursor: 'pointer'
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* SEARCH & FILTER BAR */}`;

const modalNewHeaderAndTabs = `{/* MODAL HEADER */}
                        <div style={{
                            padding: '16px 24px',
                            backgroundColor: '#1a2234',
                            borderBottom: '1px solid #334155',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <h2 style={{ margin: 0, fontSize: '18px', color: '#f8fafc', fontWeight: 800 }}>
                                📦 Taranacak Sipariş veya Personel Kolisini Seçin
                            </h2>
                            <button
                                onClick={() => setIsOrderModalOpen(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#94a3b8',
                                    fontSize: '24px',
                                    cursor: 'pointer'
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* TAB SWITCHER */}
                        <div style={{
                            display: 'flex',
                            backgroundColor: '#0a0d14',
                            borderBottom: '1px solid #334155'
                        }}>
                            <button
                                onClick={() => setModalTab('PERSONNEL')}
                                style={{
                                    flex: 1,
                                    padding: '14px 20px',
                                    backgroundColor: modalTab === 'PERSONNEL' ? '#161e2e' : 'transparent',
                                    border: 'none',
                                    borderBottom: modalTab === 'PERSONNEL' ? '3px solid #38bdf8' : '3px solid transparent',
                                    color: modalTab === 'PERSONNEL' ? '#38bdf8' : '#94a3b8',
                                    fontWeight: 800,
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    transition: 'all 0.2s'
                                }}
                            >
                                👤 Personel Bazlı Koli Taraması (Marka & Alfabetik Sıralı)
                            </button>
                            <button
                                onClick={() => setModalTab('ORDER')}
                                style={{
                                    flex: 1,
                                    padding: '14px 20px',
                                    backgroundColor: modalTab === 'ORDER' ? '#161e2e' : 'transparent',
                                    border: 'none',
                                    borderBottom: modalTab === 'ORDER' ? '3px solid #e5a93c' : '3px solid transparent',
                                    color: modalTab === 'ORDER' ? '#e5a93c' : '#94a3b8',
                                    fontWeight: 800,
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    transition: 'all 0.2s'
                                }}
                            >
                                📦 Sipariş Bazlı Tarama (BSİP / Standard)
                            </button>
                        </div>

                        {/* TAB 1: PERSONEL BAZLI MOD */}
                        {modalTab === 'PERSONNEL' && (
                            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
                                {/* BRAND & START BOX CONTROLS */}
                                <div style={{
                                    padding: '16px 24px',
                                    borderBottom: '1px solid #1f293d',
                                    backgroundColor: '#131b2c',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '12px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                                        {/* Brand Selector */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>Marka:</span>
                                            <select
                                                value={selectedPersonnelBrand}
                                                onChange={(e) => {
                                                    const b = e.target.value;
                                                    setSelectedPersonnelBrand(b);
                                                    fetchPersonnelBoxes(b, personnelSearch);
                                                }}
                                                style={{
                                                    backgroundColor: '#0a0d14',
                                                    border: '1.5px solid #38bdf8',
                                                    borderRadius: '8px',
                                                    padding: '8px 14px',
                                                    color: '#38bdf8',
                                                    fontWeight: 900,
                                                    fontSize: '14px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <option value="VOLKSWAGEN">VOLKSWAGEN</option>
                                                <option value="SCANIA">SCANIA</option>
                                                <option value="SKODA">SKODA</option>
                                                <option value="SEAT">SEAT</option>
                                            </select>
                                        </div>

                                        {/* Starting Box Input */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>Başlangıç Koli No:</span>
                                            <input
                                                type="number"
                                                min="1"
                                                max={personnelBoxes.length || 9999}
                                                value={personnelStartBox}
                                                onChange={(e) => setPersonnelStartBox(e.target.value)}
                                                style={{
                                                    width: '80px',
                                                    backgroundColor: '#0a0d14',
                                                    border: '1px solid #334155',
                                                    borderRadius: '8px',
                                                    padding: '8px 12px',
                                                    color: '#fff',
                                                    fontWeight: 800,
                                                    fontSize: '14px',
                                                    textAlign: 'center'
                                                }}
                                            />
                                        </div>

                                        {/* CTA Buttons */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <button
                                                onClick={() => handleStartPersonnelSession(selectedPersonnelBrand, personnelStartBox)}
                                                style={{
                                                    backgroundColor: '#10b981',
                                                    color: '#000',
                                                    border: 'none',
                                                    padding: '10px 18px',
                                                    borderRadius: '8px',
                                                    fontWeight: 900,
                                                    fontSize: '13px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                                                }}
                                            >
                                                ▶️ Koli #{personnelStartBox}'den Başlat
                                            </button>

                                            <button
                                                onClick={() => handleRenumberPersonnel(selectedPersonnelBrand)}
                                                disabled={isRenumbering}
                                                title="Tüm personeli alfabetik sıraya göre (A-Z) Koli 1'den başlayarak yeniden numaralandırır"
                                                style={{
                                                    backgroundColor: '#1e293b',
                                                    color: '#38bdf8',
                                                    border: '1px solid #38bdf8',
                                                    padding: '10px 14px',
                                                    borderRadius: '8px',
                                                    fontWeight: 800,
                                                    fontSize: '12px',
                                                    cursor: isRenumbering ? 'wait' : 'pointer'
                                                }}
                                            >
                                                {isRenumbering ? '⏳ Sıralanıyor...' : '🔄 Alfabetik Numaralandır (A-Z)'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Brand Stats Summary */}
                                    {(() => {
                                        const bInfo = personnelBrands.find(b => b.brand === selectedPersonnelBrand);
                                        return (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: '#94a3b8' }}>
                                                <span>Toplam: <strong style={{ color: '#fff' }}>{bInfo ? bInfo.total_personnel : personnelBoxes.length} Koli</strong></span>
                                                <span>•</span>
                                                <span style={{ color: '#34d399' }}>Paketlenen: <strong>{bInfo ? bInfo.packed_count : 0} Koli</strong></span>
                                                <span>•</span>
                                                <span style={{ color: '#fbbf24' }}>Bekleyen: <strong>{bInfo ? bInfo.remaining_count : (personnelBoxes.length)} Koli</strong></span>
                                                <span>•</span>
                                                <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>📌 Bölge/Lokasyon ve Personel İsimleri A-Z alfabetik sıralıdır.</span>
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* SEARCH BAR */}
                                <div style={{ padding: '12px 24px', borderBottom: '1px solid #1f293d', display: 'flex', gap: '10px' }}>
                                    <input
                                        type="text"
                                        placeholder="🔍 Personel Adı, Bayi / Lokasyon, Departman veya Koli Barkodu Ara..."
                                        value={personnelSearch}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setPersonnelSearch(val);
                                            fetchPersonnelBoxes(selectedPersonnelBrand, val);
                                        }}
                                        style={{
                                            flex: 1,
                                            backgroundColor: '#0a0d14',
                                            border: '1px solid #334155',
                                            borderRadius: '8px',
                                            padding: '10px 14px',
                                            color: '#fff',
                                            fontSize: '13px'
                                        }}
                                    />
                                </div>

                                {/* BOXES LIST TABLE */}
                                <div style={{ flex: 1, overflowY: 'auto', padding: '14px 24px' }}>
                                    {isLoadingPersonnel ? (
                                        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                            Koliler listeleniyor...
                                        </div>
                                    ) : filteredPersonnelBoxes.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {filteredPersonnelBoxes.map((box) => {
                                                const isPacked = box.packing_status === 'PACKED' || box.last_step === 'RFID_TUNNEL_TAMAM';
                                                return (
                                                    <div
                                                        key={box.box_no}
                                                        onClick={() => {
                                                            setPersonnelStartBox(box.box_no);
                                                            handleStartPersonnelSession(selectedPersonnelBrand, box.box_no);
                                                        }}
                                                        style={{
                                                            backgroundColor: isPacked ? 'rgba(16, 185, 129, 0.08)' : '#161e2e',
                                                            border: isPacked ? '1px solid #065f46' : '1px solid #283548',
                                                            borderRadius: '10px',
                                                            padding: '12px 16px',
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.15s'
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.borderColor = '#38bdf8'}
                                                        onMouseLeave={(e) => e.currentTarget.style.borderColor = isPacked ? '#065f46' : '#283548'}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <span style={{
                                                                backgroundColor: '#0284c7',
                                                                color: '#fff',
                                                                padding: '4px 10px',
                                                                borderRadius: '6px',
                                                                fontWeight: 900,
                                                                fontSize: '13px',
                                                                minWidth: '42px',
                                                                textAlign: 'center'
                                                            }}>
                                                                #{box.box_no}
                                                            </span>
                                                            <div>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    <strong style={{ fontSize: '14px', color: '#f8fafc' }}>
                                                                        👤 {box.name}
                                                                    </strong>
                                                                    <span style={{
                                                                        fontSize: '11px',
                                                                        padding: '2px 8px',
                                                                        borderRadius: '4px',
                                                                        fontWeight: 800,
                                                                        backgroundColor: isPacked ? '#065f46' : '#1e293b',
                                                                        color: isPacked ? '#6ee7b7' : '#94a3b8'
                                                                    }}>
                                                                        {isPacked ? '✅ PAKETLENDİ' : '⏳ BEKLİYOR'}
                                                                    </span>
                                                                </div>
                                                                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '3px' }}>
                                                                    📍 <strong style={{ color: '#fbbf24' }}>{box.service_center || '-'}</strong> | 🏢 {box.department || '-'} | Barkod: <span style={{ fontFamily: 'monospace', color: '#cbd5e1' }}>{box.box_barcode}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <span style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8' }}>
                                                                {box.target_quantity || 7} Parça
                                                            </span>
                                                            <button style={{
                                                                backgroundColor: '#2563eb',
                                                                color: '#fff',
                                                                border: 'none',
                                                                padding: '7px 14px',
                                                                borderRadius: '6px',
                                                                fontWeight: 800,
                                                                fontSize: '12px',
                                                                cursor: 'pointer'
                                                            }}>
                                                                Bu Koliyi Başlat ➔
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                            Aramanıza uygun personel kolisi bulunamadı.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* TAB 2: SİPARİŞ BAZLI MOD (BSİP / STANDART) */}
                        {modalTab === 'ORDER' && (
                            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
                                {/* SEARCH & FILTER BAR */}`;

if (content.includes(modalOldStart)) {
    content = content.replace(modalOldStart, modalNewHeaderAndTabs);
    // Also we need to close the {modalTab === 'ORDER' && ( ... )} container at the end of the orders list!
    const ordersListEndOld = `                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                    Aramanıza uygun sipariş bulunamadı.
                                </div>
                            )}
                        </div>
                    </div>`;

    const ordersListEndNew = `                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                    Aramanıza uygun sipariş bulunamadı.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>`;

    if (content.includes(ordersListEndOld)) {
        content = content.replace(ordersListEndOld, ordersListEndNew);
        console.log('✅ Orders list end patched successfully.');
    } else {
        console.warn('⚠️ ordersListEndOld not found directly.');
    }

    console.log('✅ Modal structure patched successfully.');
} else {
    console.warn('⚠️ modalOldStart not found directly.');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('🎉 Patch complete!');
