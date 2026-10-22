import React, { useState, useEffect, useMemo } from 'react';
import API_BASE_URL from '../services/apiConfig';
import { useLanguage } from '../context/LanguageContext';

const OrderBoxPlanModal = ({ orderNumber, initialOrder, isOpen, onClose, onPlanSaved }) => {
    const { themeMode } = useLanguage();
    const isLight = themeMode === 'light';

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [orderData, setOrderData] = useState(initialOrder || null);
    const [availableSizes, setAvailableSizes] = useState([]);
    const [totalOrderQty, setTotalOrderQty] = useState(0);
    const [boxes, setBoxes] = useState([]);
    const [notes, setNotes] = useState('');
    const [feedbackMessage, setFeedbackMessage] = useState(null);

    // 1. Fetch current box plan & sizes
    const fetchBoxPlan = async () => {
        if (!orderNumber) return;
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/orders/${orderNumber}/box-plan`);
            const data = await res.json();
            if (data.success) {
                setOrderData(data.order || initialOrder);
                setTotalOrderQty(data.total_order_quantity || 0);
                setAvailableSizes(data.available_sizes || []);
                
                if (data.boxes && data.boxes.length > 0) {
                    setBoxes(data.boxes.map((b, idx) => ({
                        box_no: b.box_no || (idx + 1),
                        target_quantity: b.target_quantity || 0,
                        notes: b.notes || '',
                        plan_type: b.plan_type || 'MANUAL',
                        status: b.status || 'PLANNED',
                        items_plan: b.items_plan || []
                    })));
                } else {
                    // Plan yoksa otomatik 1 kolili başlangıç
                    const initialItems = (data.available_sizes || []).map(s => ({
                        size: s.size,
                        barcode: s.barcode,
                        sku: s.sku,
                        product_name: s.product_name,
                        planned_qty: s.total_quantity
                    }));
                    setBoxes([{
                        box_no: 1,
                        target_quantity: data.total_order_quantity || 0,
                        notes: 'Standart Koli',
                        plan_type: 'MANUAL',
                        status: 'PLANNED',
                        items_plan: initialItems
                    }]);
                }
            } else {
                setFeedbackMessage({ type: 'error', text: data.error || 'Plan bilgisi alınamadı.' });
            }
        } catch (err) {
            console.error('Fetch box plan error:', err);
            setFeedbackMessage({ type: 'error', text: 'Sunucu bağlantı hatası: ' + err.message });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && orderNumber) {
            fetchBoxPlan();
        }
    }, [isOpen, orderNumber]);

    // 2. Calculations
    const totalPlannedQty = useMemo(() => {
        return boxes.reduce((sum, b) => {
            const boxSum = (b.items_plan || []).reduce((acc, it) => acc + (parseInt(it.planned_qty, 10) || 0), 0);
            return sum + boxSum;
        }, 0);
    }, [boxes]);

    const sizePlannedSummary = useMemo(() => {
        const summary = {};
        availableSizes.forEach(s => { summary[s.size] = 0; });
        boxes.forEach(b => {
            (b.items_plan || []).forEach(it => {
                const sz = it.size || 'STD';
                summary[sz] = (summary[sz] || 0) + (parseInt(it.planned_qty, 10) || 0);
            });
        });
        return summary;
    }, [boxes, availableSizes]);

    const differenceQty = totalOrderQty - totalPlannedQty;

    // 3. User Actions
    const handleQtyChange = (boxIndex, sizeName, newQty) => {
        const cleanQty = Math.max(0, parseInt(newQty, 10) || 0);
        setBoxes(prev => {
            const next = [...prev];
            const targetBox = { ...next[boxIndex] };
            const nextItems = [...(targetBox.items_plan || [])];

            const itemIdx = nextItems.findIndex(it => (it.size || 'STD') === sizeName);
            if (itemIdx >= 0) {
                nextItems[itemIdx] = { ...nextItems[itemIdx], planned_qty: cleanQty };
            } else {
                const sizeMeta = availableSizes.find(s => s.size === sizeName);
                nextItems.push({
                    size: sizeName,
                    barcode: sizeMeta?.barcode || '',
                    sku: sizeMeta?.sku || '',
                    product_name: sizeMeta?.product_name || orderData?.product_name || 'Tekstil Ürünü',
                    planned_qty: cleanQty
                });
            }

            targetBox.items_plan = nextItems;
            targetBox.target_quantity = nextItems.reduce((acc, it) => acc + (parseInt(it.planned_qty, 10) || 0), 0);
            next[boxIndex] = targetBox;
            return next;
        });
    };

    const handleFillRemainingToBox = (boxIndex, sizeName) => {
        const sizeMeta = availableSizes.find(s => s.size === sizeName);
        if (!sizeMeta) return;

        const alreadyPlannedInOtherBoxes = boxes.reduce((acc, b, bIdx) => {
            if (bIdx === boxIndex) return acc;
            const it = (b.items_plan || []).find(i => (i.size || 'STD') === sizeName);
            return acc + (parseInt(it?.planned_qty, 10) || 0);
        }, 0);

        const remainingForThisSize = Math.max(0, sizeMeta.total_quantity - alreadyPlannedInOtherBoxes);
        handleQtyChange(boxIndex, sizeName, remainingForThisSize);
    };

    const handleAddBox = () => {
        const newBoxNo = boxes.length + 1;
        const emptyItems = availableSizes.map(s => ({
            size: s.size,
            barcode: s.barcode,
            sku: s.sku,
            product_name: s.product_name,
            planned_qty: 0
        }));

        setBoxes(prev => [
            ...prev,
            {
                box_no: newBoxNo,
                target_quantity: 0,
                notes: `Koli ${newBoxNo}`,
                plan_type: 'MANUAL',
                status: 'PLANNED',
                items_plan: emptyItems
            }
        ]);
    };

    const handleRemoveBox = (boxIndex) => {
        if (boxes.length <= 1) {
            alert('En az 1 koli bulunmalıdır.');
            return;
        }
        setBoxes(prev => {
            const filtered = prev.filter((_, idx) => idx !== boxIndex);
            return filtered.map((b, idx) => ({ ...b, box_no: idx + 1 }));
        });
    };

    const handleAutoPlan = async (mode, param) => {
        setIsLoading(true);
        try {
            const body = { mode };
            if (mode === 'BY_BOX_COUNT') body.box_count = param;
            if (mode === 'BY_CAPACITY') body.box_capacity = param;

            const res = await fetch(`${API_BASE_URL}/api/orders/${orderNumber}/auto-box-plan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (data.success && data.boxes) {
                setBoxes(data.boxes);
                setFeedbackMessage({ type: 'success', text: `⚡ ${data.boxes.length} kolili otomatik plan oluşturuldu!` });
                setTimeout(() => setFeedbackMessage(null), 3000);
            } else {
                alert('Otomatik plan oluşturulamadı: ' + (data.error || 'Bilinmeyen hata'));
            }
        } catch (e) {
            alert('Otomatik plan hatası: ' + e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSavePlan = async () => {
        setIsSaving(true);
        setFeedbackMessage(null);
        try {
            // Kolilerin hedeflerini doğrula ve güncelle
            const cleanBoxes = boxes.map((b, idx) => {
                const validItems = (b.items_plan || []).filter(it => (parseInt(it.planned_qty, 10) || 0) > 0);
                const target = validItems.reduce((acc, it) => acc + (parseInt(it.planned_qty, 10) || 0), 0);
                return {
                    box_no: idx + 1,
                    total_boxes: boxes.length,
                    target_quantity: target,
                    notes: b.notes || `Koli ${idx + 1}`,
                    plan_type: b.plan_type || 'MANUAL',
                    items_plan: validItems
                };
            }).filter(b => b.target_quantity > 0);

            if (cleanBoxes.length === 0) {
                alert('Kolilerde en az 1 adet ürün planlanmalıdır.');
                setIsSaving(false);
                return;
            }

            const res = await fetch(`${API_BASE_URL}/api/orders/${orderNumber}/box-plan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ boxes: cleanBoxes, notes: notes })
            });

            const data = await res.json();
            if (data.success) {
                setFeedbackMessage({ type: 'success', text: `✅ Sipariş #${orderNumber} için ${cleanBoxes.length} koli planı başarıyla kaydedildi!` });
                if (onPlanSaved) onPlanSaved(cleanBoxes);
                setTimeout(() => {
                    onClose();
                }, 1200);
            } else {
                setFeedbackMessage({ type: 'error', text: 'Kayıt başarısız: ' + data.error });
            }
        } catch (e) {
            setFeedbackMessage({ type: 'error', text: 'Bağlantı hatası: ' + e.message });
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(6px)',
            zIndex: 11000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '16px'
        }}>
            <div style={{
                backgroundColor: isLight ? '#ffffff' : '#0f172a',
                color: isLight ? '#0f172a' : '#f8fafc',
                borderRadius: '20px',
                border: `2px solid ${isLight ? '#cbd5e1' : '#334155'}`,
                width: '100%',
                maxWidth: '920px',
                maxHeight: '92vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 70px rgba(0,0,0,0.7)',
                overflow: 'hidden'
            }}>
                {/* 1. MODAL HEADER */}
                <div style={{
                    padding: '18px 24px',
                    backgroundColor: isLight ? '#f1f5f9' : '#1e293b',
                    borderBottom: `1px solid ${isLight ? '#e2e8f0' : '#334155'}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '12px',
                            backgroundColor: '#2563eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '22px',
                            color: '#fff',
                            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)'
                        }}>
                            📦
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{
                                    backgroundColor: '#e5a93c',
                                    color: '#000',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    fontWeight: 900,
                                    fontSize: '11px'
                                }}>
                                    {orderData?.brand || 'VOG'}
                                </span>
                                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>
                                    Koli Planlama & Beden Dağılımı
                                </h2>
                                <span style={{
                                    fontSize: '14px',
                                    fontWeight: 800,
                                    color: '#38bdf8',
                                    backgroundColor: isLight ? '#e0f2fe' : 'rgba(56, 189, 248, 0.15)',
                                    padding: '2px 8px',
                                    borderRadius: '6px'
                                }}>
                                    #{orderNumber}
                                </span>
                            </div>
                            <div style={{ fontSize: '12px', color: isLight ? '#64748b' : '#94a3b8', marginTop: '2px' }}>
                                {orderData?.product_name || 'Tekstil Ürünü'} • Müşteri: {orderData?.sub_customer_name || orderData?.customer_name || '-'}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: isLight ? '#64748b' : '#94a3b8',
                            fontSize: '24px',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            borderRadius: '8px'
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* 2. KPI SUMMARY BAR */}
                <div style={{
                    padding: '14px 24px',
                    backgroundColor: isLight ? '#f8fafc' : '#111827',
                    borderBottom: `1px solid ${isLight ? '#e2e8f0' : '#1f293d'}`,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '12px'
                }}>
                    <div style={{
                        backgroundColor: isLight ? '#ffffff' : '#1e293b',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: `1px solid ${isLight ? '#e2e8f0' : '#334155'}`
                    }}>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>TOPLAM SİPARİŞ</div>
                        <div style={{ fontSize: '18px', fontWeight: 900, color: '#3b82f6' }}>
                            {totalOrderQty} <span style={{ fontSize: '12px', fontWeight: 600 }}>Adet</span>
                        </div>
                    </div>

                    <div style={{
                        backgroundColor: isLight ? '#ffffff' : '#1e293b',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: `1px solid ${isLight ? '#e2e8f0' : '#334155'}`
                    }}>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>KOLİ SAYISI</div>
                        <div style={{ fontSize: '18px', fontWeight: 900, color: '#e5a93c' }}>
                            {boxes.length} <span style={{ fontSize: '12px', fontWeight: 600 }}>Koli</span>
                        </div>
                    </div>

                    <div style={{
                        backgroundColor: isLight ? '#ffffff' : '#1e293b',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: `1px solid ${isLight ? '#e2e8f0' : '#334155'}`
                    }}>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>PLANLANAN TOPLAM</div>
                        <div style={{ fontSize: '18px', fontWeight: 900, color: differenceQty === 0 ? '#10b981' : (differenceQty > 0 ? '#f59e0b' : '#ef4444') }}>
                            {totalPlannedQty} <span style={{ fontSize: '12px', fontWeight: 600 }}>/ {totalOrderQty}</span>
                        </div>
                    </div>

                    <div style={{
                        backgroundColor: differenceQty === 0 
                            ? (isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.15)') 
                            : (differenceQty > 0 ? (isLight ? '#fffbeb' : 'rgba(245, 158, 11, 0.15)') : (isLight ? '#fef2f2' : 'rgba(239, 68, 68, 0.15)')),
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: `1px solid ${differenceQty === 0 ? '#10b981' : (differenceQty > 0 ? '#f59e0b' : '#ef4444')}`,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                    }}>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: differenceQty === 0 ? '#059669' : (differenceQty > 0 ? '#d97706' : '#dc2626') }}>
                            {differenceQty === 0 ? '✅ TAM DAĞITILDI' : (differenceQty > 0 ? `⏳ ${differenceQty} ADET DAĞITILMADI` : `🚫 ${Math.abs(differenceQty)} ADET FAZLA`)}
                        </div>
                        <div style={{ fontSize: '10px', color: isLight ? '#64748b' : '#94a3b8', marginTop: '2px' }}>
                            {differenceQty === 0 ? 'Koliler sevkiyata hazır' : (differenceQty > 0 ? 'Bedenleri kolilere paylaştırın' : 'Toplam miktarı aşmayınız')}
                        </div>
                    </div>
                </div>

                {/* 3. AUTO-DISTRIBUTE TOOLBAR */}
                <div style={{
                    padding: '12px 24px',
                    backgroundColor: isLight ? '#f1f5f9' : '#1a2234',
                    borderBottom: `1px solid ${isLight ? '#e2e8f0' : '#1f293d'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            ⚡ Hızlı Otomatik Plan:
                        </span>
                        
                        <button
                            type="button"
                            onClick={() => handleAutoPlan('BY_BOX_COUNT', 2)}
                            style={{
                                padding: '5px 10px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 700,
                                backgroundColor: isLight ? '#ffffff' : '#334155',
                                border: '1px solid #475569',
                                color: 'inherit',
                                cursor: 'pointer'
                            }}
                        >
                            📦 2 Koliye Eşit Böl
                        </button>

                        <button
                            type="button"
                            onClick={() => handleAutoPlan('BY_BOX_COUNT', 3)}
                            style={{
                                padding: '5px 10px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 700,
                                backgroundColor: isLight ? '#ffffff' : '#334155',
                                border: '1px solid #475569',
                                color: 'inherit',
                                cursor: 'pointer'
                            }}
                        >
                            📦 3 Koliye Eşit Böl
                        </button>

                        <button
                            type="button"
                            onClick={() => handleAutoPlan('BY_CAPACITY', 25)}
                            style={{
                                padding: '5px 10px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 700,
                                backgroundColor: isLight ? '#ffffff' : '#334155',
                                border: '1px solid #475569',
                                color: 'inherit',
                                cursor: 'pointer'
                            }}
                        >
                            🎯 Maks 25 Adet/Koli
                        </button>

                        <button
                            type="button"
                            onClick={() => handleAutoPlan('BY_SIZE')}
                            style={{
                                padding: '5px 10px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 700,
                                backgroundColor: isLight ? '#ffffff' : '#334155',
                                border: '1px solid #475569',
                                color: 'inherit',
                                cursor: 'pointer'
                            }}
                        >
                            🏷️ Her Beden Ayrı Koli
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={handleAddBox}
                        style={{
                            padding: '6px 14px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 800,
                            backgroundColor: '#10b981',
                            color: '#ffffff',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                        }}
                    >
                        ➕ Yeni Koli Ekle
                    </button>
                </div>

                {/* 4. BEDEN BAZINDA KALAN ADETLER REHBERİ */}
                {availableSizes.length > 0 && (
                    <div style={{
                        padding: '8px 24px',
                        backgroundColor: isLight ? '#f8fafc' : '#0b1120',
                        borderBottom: `1px solid ${isLight ? '#e2e8f0' : '#1f293d'}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        overflowX: 'auto',
                        whiteSpace: 'nowrap'
                    }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8' }}>
                            📊 Beden Dağılım Özeti:
                        </span>
                        {availableSizes.map(s => {
                            const planned = sizePlannedSummary[s.size] || 0;
                            const diff = s.total_quantity - planned;
                            return (
                                <div
                                    key={s.size}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '3px 8px',
                                        borderRadius: '6px',
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        backgroundColor: diff === 0 
                                            ? (isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.15)') 
                                            : (diff > 0 ? (isLight ? '#fffbeb' : 'rgba(245, 158, 11, 0.15)') : (isLight ? '#fef2f2' : 'rgba(239, 68, 68, 0.15)')),
                                        border: `1px solid ${diff === 0 ? '#10b981' : (diff > 0 ? '#f59e0b' : '#ef4444')}`,
                                        color: diff === 0 ? '#10b981' : (diff > 0 ? '#f59e0b' : '#ef4444')
                                    }}
                                >
                                    <span>{s.size}:</span>
                                    <strong>{planned}/{s.total_quantity}</strong>
                                    {diff === 0 ? '✓' : `(${diff > 0 ? `-${diff}` : `+${Math.abs(diff)}`})`}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* 5. BOXES CARDS LIST CONTAINER */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '20px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                }}>
                    {isLoading ? (
                        <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                            ⏳ Koli planı yükleniyor...
                        </div>
                    ) : boxes.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                            Henüz koli eklenmedi. Yukarıdaki "➕ Yeni Koli Ekle" veya otomatik plan butonlarını kullanabilirsiniz.
                        </div>
                    ) : (
                        boxes.map((box, bIdx) => {
                            const boxTotal = (box.items_plan || []).reduce((acc, it) => acc + (parseInt(it.planned_qty, 10) || 0), 0);
                            return (
                                <div
                                    key={box.box_no || bIdx}
                                    style={{
                                        backgroundColor: isLight ? '#ffffff' : '#161e2e',
                                        borderRadius: '14px',
                                        border: `1.5px solid ${isLight ? '#cbd5e1' : '#283548'}`,
                                        padding: '16px',
                                        boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '12px'
                                    }}
                                >
                                    {/* Box Card Header */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{
                                                backgroundColor: '#2563eb',
                                                color: '#fff',
                                                padding: '4px 10px',
                                                borderRadius: '8px',
                                                fontWeight: 900,
                                                fontSize: '13px'
                                            }}>
                                                📦 KOLİ {box.box_no}
                                            </span>
                                            <span style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8' }}>
                                                Hedef: {boxTotal} Adet
                                            </span>
                                            {box.notes && (
                                                <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
                                                    ({box.notes})
                                                </span>
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveBox(bIdx)}
                                                style={{
                                                    backgroundColor: 'transparent',
                                                    color: '#ef4444',
                                                    border: '1px solid #ef4444',
                                                    padding: '4px 8px',
                                                    borderRadius: '6px',
                                                    fontSize: '11px',
                                                    fontWeight: 700,
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                🗑️ Koliyi Sil
                                            </button>
                                        </div>
                                    </div>

                                    {/* Size Items Grid for this Box */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                                        gap: '10px',
                                        backgroundColor: isLight ? '#f8fafc' : '#0f172a',
                                        padding: '12px',
                                        borderRadius: '10px',
                                        border: `1px solid ${isLight ? '#e2e8f0' : '#1e293b'}`
                                    }}>
                                        {availableSizes.map(s => {
                                            const it = (box.items_plan || []).find(i => (i.size || 'STD') === s.size);
                                            const currentQty = parseInt(it?.planned_qty || 0, 10);
                                            return (
                                                <div
                                                    key={s.size}
                                                    style={{
                                                        backgroundColor: isLight ? '#ffffff' : '#1e293b',
                                                        borderRadius: '8px',
                                                        border: `1px solid ${currentQty > 0 ? '#38bdf8' : (isLight ? '#e2e8f0' : '#334155')}`,
                                                        padding: '8px',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }}
                                                >
                                                    <span style={{ fontSize: '12px', fontWeight: 800, color: currentQty > 0 ? '#38bdf8' : 'inherit' }}>
                                                        {s.size}
                                                    </span>
                                                    <span style={{ fontSize: '10px', color: '#64748b' }}>
                                                        Top: {s.total_quantity}
                                                    </span>

                                                    {/* Stepper Inputs */}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '100%', marginTop: '2px' }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleQtyChange(bIdx, s.size, Math.max(0, currentQty - 1))}
                                                            style={{
                                                                width: '24px',
                                                                height: '24px',
                                                                borderRadius: '4px',
                                                                border: '1px solid #475569',
                                                                backgroundColor: isLight ? '#f1f5f9' : '#334155',
                                                                color: 'inherit',
                                                                cursor: 'pointer',
                                                                fontWeight: 900,
                                                                fontSize: '12px'
                                                            }}
                                                        >
                                                            −
                                                        </button>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={currentQty === 0 ? '' : currentQty}
                                                            placeholder="0"
                                                            onChange={(e) => handleQtyChange(bIdx, s.size, e.target.value)}
                                                            style={{
                                                                width: '100%',
                                                                minWidth: '32px',
                                                                height: '24px',
                                                                textAlign: 'center',
                                                                fontWeight: 800,
                                                                fontSize: '12px',
                                                                borderRadius: '4px',
                                                                border: '1px solid #475569',
                                                                backgroundColor: isLight ? '#ffffff' : '#0f172a',
                                                                color: 'inherit',
                                                                outline: 'none'
                                                            }}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => handleQtyChange(bIdx, s.size, currentQty + 1)}
                                                            style={{
                                                                width: '24px',
                                                                height: '24px',
                                                                borderRadius: '4px',
                                                                border: '1px solid #475569',
                                                                backgroundColor: isLight ? '#f1f5f9' : '#334155',
                                                                color: 'inherit',
                                                                cursor: 'pointer',
                                                                fontWeight: 900,
                                                                fontSize: '12px'
                                                            }}
                                                        >
                                                            +
                                                        </button>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleFillRemainingToBox(bIdx, s.size)}
                                                        title="Bu bedenden kalan tüm açık miktarı bu koliye aktar"
                                                        style={{
                                                            fontSize: '9px',
                                                            color: '#38bdf8',
                                                            background: 'none',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            padding: '2px',
                                                            textDecoration: 'underline',
                                                            marginTop: '2px'
                                                        }}
                                                    >
                                                        Kalanı Al
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* 6. FEEDBACK ALERTS */}
                {feedbackMessage && (
                    <div style={{
                        padding: '10px 24px',
                        backgroundColor: feedbackMessage.type === 'success' ? '#065f46' : '#991b1b',
                        color: '#ffffff',
                        fontSize: '13px',
                        fontWeight: 700,
                        textAlign: 'center'
                    }}>
                        {feedbackMessage.text}
                    </div>
                )}

                {/* 7. MODAL FOOTER */}
                <div style={{
                    padding: '16px 24px',
                    backgroundColor: isLight ? '#f1f5f9' : '#1e293b',
                    borderTop: `1px solid ${isLight ? '#e2e8f0' : '#334155'}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{ fontSize: '12px', color: isLight ? '#64748b' : '#94a3b8' }}>
                        💡 Kaydedilen koli planı RFID Tünel, El Terminali ve Koli Etiketleme akışlarında otomatik kullanılacaktır.
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: '10px 18px',
                                borderRadius: '10px',
                                fontSize: '13px',
                                fontWeight: 700,
                                backgroundColor: isLight ? '#e2e8f0' : '#334155',
                                color: 'inherit',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            Kapat
                        </button>

                        <button
                            type="button"
                            onClick={handleSavePlan}
                            disabled={isSaving}
                            style={{
                                padding: '10px 24px',
                                borderRadius: '10px',
                                fontSize: '13px',
                                fontWeight: 900,
                                backgroundColor: '#2563eb',
                                color: '#ffffff',
                                border: 'none',
                                cursor: isSaving ? 'wait' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
                                opacity: isSaving ? 0.7 : 1
                            }}
                        >
                            {isSaving ? '⏳ Kaydediliyor...' : '💾 Koli Dağılım Planını Kaydet'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderBoxPlanModal;
