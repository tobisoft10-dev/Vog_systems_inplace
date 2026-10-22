import React, { useState, useEffect, useRef, useCallback } from 'react';
import API_BASE_URL from '../services/apiConfig';

const HandheldTerminal = () => {
    // Active Tab Mode: 'receiving' (Mal Kabul), 'boxing' (Koli Paketleme), 'counting' (Hızlı Sayım), 'geiger' (Geiger Arama)
    const [activeTab, setActiveTab] = useState('boxing');

    // Boxing (Koli Paketleme) State
    const [boxingOrderNo, setBoxingOrderNo] = useState('');
    const [boxingSearch, setBoxingSearch] = useState('');
    const [boxingBoxNo, setBoxingBoxNo] = useState(1);
    const [boxingTotalBoxes, setBoxingTotalBoxes] = useState(1);
    const [boxingItems, setBoxingItems] = useState([]);
    const [boxingInput, setBoxingInput] = useState('');
    const [savedOrderBoxes, setSavedOrderBoxes] = useState([]);
    const [boxingOrderWhitelist, setBoxingOrderWhitelist] = useState({
        allowed_epcs: [],
        allowed_barcodes: [],
        allowed_skus: [],
        scanned_epcs: []
    });
    const [isSavingBox, setIsSavingBox] = useState(false);


    // Receiving (Tesellüm) State
    const [pendingOrders, setPendingOrders] = useState([]);
    const [selectedOrderNo, setSelectedOrderNo] = useState('');
    const [currentBarcode, setCurrentBarcode] = useState('');
    const [scannedItems, setScannedItems] = useState([]);
    const [statusMessage, setStatusMessage] = useState(null); // { type: 'success' | 'error' | 'info', text: '' }


    // Counting (Sayım) State
    const [countLocation, setCountLocation] = useState('Ana Depo Tesellüm');
    const [countedTags, setCountedTags] = useState([]);
    const [countInput, setCountInput] = useState('');
    const [auditResult, setAuditResult] = useState(null);
    const [isAuditing, setIsAuditing] = useState(false);

    // Geiger (Arama) Mode State
    const [geigerTargets, setGeigerTargets] = useState([]);
    const [selectedGeigerTarget, setSelectedGeigerTarget] = useState(null);
    const [geigerSignal, setGeigerSignal] = useState(0); // 0 - 100
    const [isGeigerActive, setIsGeigerActive] = useState(false);

    // Offline Buffer State
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [offlineQueue, setOfflineQueue] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('vog_handheld_offline_scans') || '[]');
        } catch {
            return [];
        }
    });

    const inputRef = useRef(null);
    const countInputRef = useRef(null);
    const boxingInputRef = useRef(null);
    const keyBufferRef = useRef('');
    const lastKeyTimeRef = useRef(0);
    const bufferTimeoutRef = useRef(null);
    const audioCtxRef = useRef(null);
    const geigerIntervalRef = useRef(null);

    // Web Audio Synthesizer
    const initAudioContext = () => {
        if (!audioCtxRef.current) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) audioCtxRef.current = new AudioContext();
        }
        if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }
    };

    const playBeep = useCallback((freq = 880, duration = 0.05) => {
        try {
            initAudioContext();
            if (!audioCtxRef.current) return;
            const ctx = audioCtxRef.current;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + duration);
        } catch (e) {
            console.error('Audio beep error:', e);
        }
    }, []);

    const playSuccessChime = useCallback(() => {
        try {
            initAudioContext();
            if (!audioCtxRef.current) return;
            const ctx = audioCtxRef.current;
            [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(f, ctx.currentTime + i * 0.08);
                gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.08);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.2);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime + i * 0.08);
                osc.stop(ctx.currentTime + i * 0.08 + 0.2);
            });
        } catch (e) {
            console.error('Chime error:', e);
        }
    }, []);

    const triggerVibrate = (pattern = [40]) => {
        if (navigator.vibrate) {
            try {
                navigator.vibrate(pattern);
            } catch (e) {
                console.error('Vibration error:', e);
            }
        }
    };

    // Listen to online / offline events
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            syncOfflineQueue();
        };
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Sync Offline Queue
    const syncOfflineQueue = async () => {
        const queue = JSON.parse(localStorage.getItem('vog_handheld_offline_scans') || '[]');
        if (queue.length === 0) return;

        try {
            const res = await fetch(`${API_BASE_URL}/api/wms/handheld-batch-sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scans: queue })
            });
            const json = await res.json();
            if (json.success) {
                localStorage.removeItem('vog_handheld_offline_scans');
                setOfflineQueue([]);
                setStatusMessage({ type: 'success', text: `🌐 ${json.synced_count} Çevrimdışı Kayıt Sunucuya Aktarıldı!` });
                setTimeout(() => setStatusMessage(null), 4000);
            }
        } catch (err) {
            console.error('Offline sync error:', err);
        }
    };

    // Fetch Pending Orders for Receiving
    const fetchPendingOrders = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/wms/pending-orders`);
            const json = await res.json();
            if (json.success) {
                setPendingOrders(json.data || []);
            }
        } catch (e) {
            console.error('Pending orders fetch error:', e);
        }
    };

    // Fetch Geiger Targets
    const fetchGeigerTargets = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/wms/geiger-targets`);
            const json = await res.json();
            if (json.success) {
                setGeigerTargets(json.data || []);
                if (json.data.length > 0 && !selectedGeigerTarget) {
                    setSelectedGeigerTarget(json.data[0]);
                }
            }
        } catch (e) {
            console.error('Geiger targets fetch error:', e);
        }
    };

    useEffect(() => {
        fetchPendingOrders();
    }, []);

    useEffect(() => {
        if (activeTab === 'boxing' || activeTab === 'receiving') fetchPendingOrders();
        if (activeTab === 'geiger') fetchGeigerTargets();
    }, [activeTab]);

    // Keep focus on active input for hardware barcode scanner guns and RFID triggers
    useEffect(() => {
        const interval = setInterval(() => {
            const activeTag = document.activeElement?.tagName?.toLowerCase();
            // Don't steal focus if user is actively interacting with an input, select or textarea
            if (document.activeElement && (activeTag === 'select' || (activeTag === 'input' && 
                document.activeElement !== boxingInputRef.current && 
                document.activeElement !== inputRef.current && 
                document.activeElement !== countInputRef.current))) {
                return;
            }

            if (activeTab === 'boxing' && boxingInputRef.current && document.activeElement !== boxingInputRef.current) {
                boxingInputRef.current.focus();
            } else if (activeTab === 'receiving' && inputRef.current && document.activeElement !== inputRef.current) {
                inputRef.current.focus();
            } else if (activeTab === 'counting' && countInputRef.current && document.activeElement !== countInputRef.current) {
                countInputRef.current.focus();
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [activeTab]);

    // Handle Inbound Receiving Barcode Submit
    const handleBarcodeSubmit = async (e, directCode = null) => {
        if (e && e.preventDefault) e.preventDefault();
        const code = (directCode || currentBarcode).trim();
        if (!code) return;
        setCurrentBarcode('');

        // If offline, buffer scan
        if (!isOnline) {
            const offlineItem = {
                code,
                barcode: code,
                order_id: selectedOrderNo || undefined,
                location: 'Ana Depo Tesellüm',
                timestamp: new Date().toISOString()
            };
            const updatedQueue = [offlineItem, ...offlineQueue];
            setOfflineQueue(updatedQueue);
            localStorage.setItem('vog_handheld_offline_scans', JSON.stringify(updatedQueue));
            playBeep(600, 0.08);
            triggerVibrate([60]);
            setStatusMessage({ type: 'info', text: `💾 Çevrimdışı Kaydedildi (#${code}). Kuyrukta: ${updatedQueue.length}` });
            setTimeout(() => setStatusMessage(null), 3000);
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/api/wms/handheld-receive`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    barcode: code,
                    selected_order_number: selectedOrderNo || undefined,
                    stage: 'receiving',
                    location: 'Ana Depo Tesellüm'
                })
            });

            const data = await res.json();
            if (data.success && data.results && data.results.length > 0) {
                const itemRes = data.results[0];
                if (itemRes.status === 'duplicate_skipped') {
                    // Mükerrer olduğunda bildirim/uyarı gösterilmez!
                    return;
                }
                playBeep(950, 0.05);
                triggerVibrate([40]);

                setScannedItems(prev => [{
                    code: code,
                    product_name: itemRes.product_name,
                    order_id: itemRes.order_id,
                    sku: itemRes.sku,
                    size: itemRes.size,
                    staff_name: itemRes.staff_name,
                    sub_customer_name: itemRes.sub_customer_name,
                    received_qty: itemRes.received_qty,
                    total_qty: itemRes.total_qty,
                    progress_percent: itemRes.progress_percent,
                    is_completed: itemRes.is_completed,
                    timestamp: new Date().toLocaleTimeString('tr-TR')
                }, ...prev]);

                if (itemRes.is_completed) {
                    playSuccessChime();
                    triggerVibrate([100, 50, 100]);
                    setStatusMessage({
                        type: 'success',
                        text: `🎉 SİPARİŞ #${itemRes.order_id} %100 TAMAMLANDI & LİSTEDEN KALDIRILDI!`
                    });
                    if (selectedOrderNo === itemRes.order_id) setSelectedOrderNo('');
                } else {
                    setStatusMessage({
                        type: 'success',
                        text: `✅ TESELLÜM OK: ${itemRes.product_name || code} (#${itemRes.order_id}: %${itemRes.progress_percent})`
                    });
                }
                fetchPendingOrders();
            } else {
                playBeep(300, 0.15);
                triggerVibrate([150]);
                setStatusMessage({ type: 'error', text: `⚠️ ${data.message || 'Tesellüm oluşturulamadı.'}` });
            }
        } catch (error) {
            console.error('Handheld scan error:', error);
            setStatusMessage({ type: 'error', text: 'Sunucu Bağlantı Hatası!' });
        }
        setTimeout(() => setStatusMessage(null), 3500);
    };

    // Fetch order boxes for active boxing order & load order whitelist
    const fetchOrderBoxes = async (orderNo) => {
        if (!orderNo) {
            setSavedOrderBoxes([]);
            setBoxingOrderWhitelist({ allowed_epcs: [], allowed_barcodes: [], allowed_skus: [], scanned_epcs: [] });
            return;
        }
        try {
            const res = await fetch(`${API_BASE_URL}/api/terminal/order-boxes/${orderNo}`);
            const json = await res.json();
            if (json.success) {
                setSavedOrderBoxes(json.boxes || []);
                setBoxingOrderWhitelist({
                    allowed_epcs: (json.allowed_epcs || []).map(e => String(e).toUpperCase()),
                    allowed_barcodes: (json.allowed_barcodes || []).map(b => String(b).toUpperCase()),
                    allowed_skus: (json.allowed_skus || []).map(s => String(s).toUpperCase()),
                    scanned_epcs: (json.scanned_epcs || []).map(e => String(e).toUpperCase())
                });
                if (json.boxes && json.boxes.length > 0) {
                    const nextBox = Math.max(...json.boxes.map(b => b.box_no || 1)) + 1;
                    setBoxingBoxNo(nextBox);
                } else {
                    setBoxingBoxNo(1);
                }
            }
        } catch (e) {
            console.error('Fetch order boxes error:', e);
        }
    };

    // Handle Boxing Scan (Strict Order Whitelist & Duplicate Rejection)
    const handleBoxingScanSubmit = (e, directCode = null) => {
        if (e && e.preventDefault) e.preventDefault();
        const code = (directCode || boxingInput).trim().toUpperCase();
        if (!code) return;
        setBoxingInput('');

        if (!boxingOrderNo) {
            playBeep(300, 0.15);
            triggerVibrate([150]);
            setStatusMessage({ type: 'error', text: '⚠️ Lütfen önce paketlenecek siparişi seçin!' });
            setTimeout(() => setStatusMessage(null), 3000);
            return;
        }

        // 1. Mükerrer Kontrolü: Mevcut Koli İçinde (Sessizce yoksay, notification gösterme)
        if (boxingItems.some(i => i.epc === code || i.barcode === code)) {
            return;
        }

        // 2. Mükerrer Kontrolü: Daha Önce Mühürlenmiş Diğer Kolilerde (Sessizce yoksay, notification gösterme)
        const alreadyInSavedBox = savedOrderBoxes.find(b => 
            b.items && b.items.some(i => (i.epc && i.epc.toUpperCase() === code) || (i.barcode && i.barcode.toUpperCase() === code))
        );
        if (alreadyInSavedBox || (boxingOrderWhitelist.scanned_epcs && boxingOrderWhitelist.scanned_epcs.includes(code))) {
            return;
        }

        // 3. SGTIN-96 VOG EPC Format Kontrolü (303B50CC...)
        if (code.startsWith('303B50CC') && code.length >= 14) {
            const orderHex = code.substring(8, 14);
            const embeddedOrderId = parseInt(orderHex, 16);
            if (embeddedOrderId && embeddedOrderId !== parseInt(boxingOrderNo, 10)) {
                playBeep(250, 0.25);
                triggerVibrate([200]);
                setStatusMessage({
                    type: 'error',
                    text: `🚫 YABANCI ETİKET! Bu etiket Sipariş #${embeddedOrderId}'ye ait! Seçili siparişe (#${boxingOrderNo}) ait değil!`
                });
                setTimeout(() => setStatusMessage(null), 4000);
                return;
            }
        }

        // 4. Whitelist ve Sipariş Doğrulaması (Yabancı Etiket Engelleme)
        const selectedOrd = pendingOrders.find(o => String(o.order_number) === String(boxingOrderNo));
        const cleanNoZero = code.replace(/^0+/, '');

        const isKnownEpc = boxingOrderWhitelist.allowed_epcs && boxingOrderWhitelist.allowed_epcs.includes(code);
        const isKnownBarcode = boxingOrderWhitelist.allowed_barcodes && (
            boxingOrderWhitelist.allowed_barcodes.includes(code) ||
            boxingOrderWhitelist.allowed_barcodes.includes(cleanNoZero)
        );
        const isKnownSku = boxingOrderWhitelist.allowed_skus && boxingOrderWhitelist.allowed_skus.includes(code);
        const isOrderMatch = selectedOrd && (
            String(selectedOrd.order_number) === code ||
            (selectedOrd.barcode && selectedOrd.barcode.toUpperCase() === code) ||
            (selectedOrd.sku && (code.includes(selectedOrd.sku.toUpperCase()) || selectedOrd.sku.toUpperCase().includes(code)))
        );

        const hasWhitelist = (boxingOrderWhitelist.allowed_epcs.length > 0 || boxingOrderWhitelist.allowed_barcodes.length > 0 || boxingOrderWhitelist.allowed_skus.length > 0);

        if (hasWhitelist && !isKnownEpc && !isKnownBarcode && !isKnownSku && !isOrderMatch) {
            playBeep(250, 0.2);
            triggerVibrate([200]);
            setStatusMessage({
                type: 'error',
                text: `🚫 YABANCI ETİKET ENGELLENDİ! (${code}) seçili siparişe (#${boxingOrderNo}) ait değil!`
            });
            setTimeout(() => setStatusMessage(null), 3500);
            return;
        }

        const newItem = {
            epc: code,
            barcode: code,
            sku: selectedOrd?.sku || '',
            size: 'STD',
            product_name: selectedOrd?.product_name || 'Paketlenen Ürün',
            timestamp: new Date().toISOString()
        };

        playBeep(920, 0.04);
        triggerVibrate([30]);
        setBoxingItems(prev => [newItem, ...prev]);
        setStatusMessage({ type: 'success', text: `✅ Ürün Koliye Eklendi (#${boxingBoxNo})` });
        setTimeout(() => setStatusMessage(null), 1500);
    };

    // Save & Seal Current Box
    const handleSaveBox = async () => {
        if (!boxingOrderNo) {
            alert('Lütfen önce bir sipariş seçin veya girin.');
            return;
        }
        if (boxingItems.length === 0) {
            alert('Lütfen koliye en az 1 adet ürün okutun.');
            return;
        }

        setIsSavingBox(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/terminal/save-box`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    order_number: boxingOrderNo,
                    box_no: boxingBoxNo,
                    total_boxes: Math.max(boxingBoxNo, boxingTotalBoxes),
                    items: boxingItems,
                    staff_name: 'Terminal Operatörü'
                })
            });
            const json = await res.json();
            if (json.success) {
                playSuccessChime();
                triggerVibrate([100, 50, 100]);
                setStatusMessage({ type: 'success', text: `🎉 ${boxingBoxNo}. Koli Kaydedildi (${boxingItems.length} Adet)! Tünel doğrulamasına hazır.` });
                setBoxingOrderWhitelist(prev => ({
                    ...prev,
                    scanned_epcs: [...prev.scanned_epcs, ...boxingItems.map(i => i.epc.toUpperCase())]
                }));
                setBoxingItems([]);
                fetchOrderBoxes(boxingOrderNo);
            } else {
                alert('Koli kaydetme hatası: ' + json.error);
            }
        } catch (e) {
            console.error('Save box error:', e);
            alert('Sunucu hatası: ' + e.message);
        } finally {
            setIsSavingBox(false);
            setTimeout(() => setStatusMessage(null), 4000);
        }
    };

    // Handle Inventory Counting Scan / Add
    const handleCountScanSubmit = (e, directCode = null) => {
        if (e && e.preventDefault) e.preventDefault();
        const code = (directCode || countInput).trim().toUpperCase();
        if (!code) return;
        setCountInput('');
        playBeep(850, 0.04);
        triggerVibrate([30]);

        setCountedTags(prev => [code, ...prev]);
    };

    // Run Inventory Audit against database stock
    const handleRunAudit = async () => {
        if (countedTags.length === 0) {
            alert('Lütfen önce en az 1 adet etiket veya barkod okutun.');
            return;
        }

        setIsAuditing(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/wms/inventory-count-audit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    location: countLocation,
                    tags: countedTags
                })
            });
            const json = await res.json();
            if (json.success) {
                setAuditResult(json);
                playSuccessChime();
            } else {
                alert('Denetim hatası: ' + json.error);
            }
        } catch (e) {
            console.error('Audit error:', e);
            alert('Sunucu hatası: ' + e.message);
        } finally {
            setIsAuditing(false);
        }
    };

    // Geiger Mode Simulation / Ticking
    useEffect(() => {
        if (activeTab === 'geiger' && isGeigerActive) {
            geigerIntervalRef.current = setInterval(() => {
                setGeigerSignal(prev => {
                    const delta = (Math.random() - 0.45) * 15;
                    const next = Math.max(5, Math.min(98, Math.round(prev + delta)));
                    if (next > 70) {
                        playBeep(1200, 0.03);
                        triggerVibrate([20]);
                    } else if (next > 40) {
                        playBeep(800, 0.03);
                    }
                    return next;
                });
            }, 600);
        } else {
            if (geigerIntervalRef.current) clearInterval(geigerIntervalRef.current);
        }
        return () => {
            if (geigerIntervalRef.current) clearInterval(geigerIntervalRef.current);
        };
    }, [activeTab, isGeigerActive, playBeep]);

    // Global Hardware Trigger & Wedge Handler for Physical Terminal Pistol Gun Keys
    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            const keyCode = e.keyCode || e.which;
            const key = e.key;

            // 1. Hardware Scanner Trigger Keys (Chainway C72/C66 139, 280, 293, Urovo 261, F9-F12, etc.)
            const isTrigger = [131, 132, 133, 134, 135, 138, 139, 140, 141, 142, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 261, 262, 263, 280, 284, 285, 291, 292, 293, 294, 301, 302, 303, 520, 521, 522].includes(keyCode)
                || (key && /^F(1[0-2]|[1-9])$/i.test(key));

            if (isTrigger) {
                if (activeTab === 'boxing') boxingInputRef.current?.focus();
                else if (activeTab === 'receiving') inputRef.current?.focus();
                else if (activeTab === 'counting') countInputRef.current?.focus();
                return;
            }

            // 2. Hardware Wedge Interception (Buffer rapid keystrokes from barcode/RFID scanner if input temporarily lost focus)
            const activeElem = document.activeElement;
            const isInsideActiveInput = activeElem === boxingInputRef.current || activeElem === inputRef.current || activeElem === countInputRef.current;

            if (!isInsideActiveInput) {
                const now = Date.now();
                if (now - lastKeyTimeRef.current > 250) {
                    keyBufferRef.current = '';
                }
                lastKeyTimeRef.current = now;

                if (key === 'Enter' || key === 'Tab') {
                    if (bufferTimeoutRef.current) clearTimeout(bufferTimeoutRef.current);
                    const scanned = keyBufferRef.current.trim();
                    keyBufferRef.current = '';
                    if (scanned.length >= 3) {
                        e.preventDefault();
                        if (activeTab === 'boxing') {
                            handleBoxingScanSubmit(null, scanned);
                        } else if (activeTab === 'receiving') {
                            handleBarcodeSubmit(null, scanned);
                        } else if (activeTab === 'counting') {
                            handleCountScanSubmit(null, scanned);
                        }
                    }
                } else if (key && key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
                    keyBufferRef.current += key;
                    if (bufferTimeoutRef.current) clearTimeout(bufferTimeoutRef.current);
                    bufferTimeoutRef.current = setTimeout(() => {
                        const scanned = keyBufferRef.current.trim();
                        if (scanned.length >= 8) {
                            keyBufferRef.current = '';
                            if (activeTab === 'boxing') {
                                handleBoxingScanSubmit(null, scanned);
                            } else if (activeTab === 'receiving') {
                                handleBarcodeSubmit(null, scanned);
                            } else if (activeTab === 'counting') {
                                handleCountScanSubmit(null, scanned);
                            }
                        }
                    }, 120);
                }
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => {
            window.removeEventListener('keydown', handleGlobalKeyDown);
            if (bufferTimeoutRef.current) clearTimeout(bufferTimeoutRef.current);
        };
    }, [activeTab]);

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#090d16',
            color: '#f1f5f9',
            fontFamily: "'Inter', -apple-system, sans-serif",
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '600px',
            margin: '0 auto',
            boxShadow: '0 0 40px rgba(0,0,0,0.8)'
        }}>
            {/* MOBILE TOP BAR */}
            <header style={{
                padding: '12px 16px',
                backgroundColor: '#111827',
                borderBottom: '2px solid #1f2937',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                        backgroundColor: '#e5a93c',
                        color: '#000',
                        fontWeight: 900,
                        fontSize: '12px',
                        padding: '4px 8px',
                        borderRadius: '6px'
                    }}>
                        VOG PDA
                    </span>
                    <strong style={{ fontSize: '15px', color: '#f8fafc' }}>El Terminali</strong>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {offlineQueue.length > 0 && (
                        <button
                            onClick={syncOfflineQueue}
                            style={{
                                backgroundColor: '#dc2626',
                                color: '#fff',
                                border: 'none',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 800,
                                cursor: 'pointer'
                            }}
                        >
                            📤 {offlineQueue.length} Kuyrukta
                        </button>
                    )}

                    <span style={{
                        fontSize: '12px',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        backgroundColor: isOnline ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: isOnline ? '#34d399' : '#f87171',
                        border: `1px solid ${isOnline ? '#10b981' : '#ef4444'}`,
                        fontWeight: 700
                    }}>
                        {isOnline ? '🟢 Çevrimiçi' : '🔴 Çevrimdışı'}
                    </span>
                </div>
            </header>

            {/* STATUS NOTIFICATION */}
            {statusMessage && (
                <div style={{
                    padding: '10px 16px',
                    backgroundColor: statusMessage.type === 'success' ? '#064e3b' : (statusMessage.type === 'error' ? '#7f1d1d' : '#1e3a8a'),
                    color: '#fff',
                    textAlign: 'center',
                    fontSize: '13px',
                    fontWeight: 700,
                    borderBottom: '1px solid rgba(255,255,255,0.2)'
                }}>
                    {statusMessage.text}
                </div>
            )}

            {/* TAB NAVIGATION (4 TABS) */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                backgroundColor: '#111827',
                borderBottom: '1px solid #1f2937'
            }}>
                <button
                    onClick={() => setActiveTab('boxing')}
                    style={{
                        padding: '12px 4px',
                        border: 'none',
                        borderBottom: activeTab === 'boxing' ? '3px solid #10b981' : '3px solid transparent',
                        backgroundColor: activeTab === 'boxing' ? '#1e293b' : 'transparent',
                        color: activeTab === 'boxing' ? '#34d399' : '#94a3b8',
                        fontWeight: 800,
                        fontSize: '12px',
                        cursor: 'pointer'
                    }}
                >
                    📦 Koli Paketle
                </button>
                <button
                    onClick={() => setActiveTab('receiving')}
                    style={{
                        padding: '12px 4px',
                        border: 'none',
                        borderBottom: activeTab === 'receiving' ? '3px solid #38bdf8' : '3px solid transparent',
                        backgroundColor: activeTab === 'receiving' ? '#1e293b' : 'transparent',
                        color: activeTab === 'receiving' ? '#38bdf8' : '#94a3b8',
                        fontWeight: 800,
                        fontSize: '12px',
                        cursor: 'pointer'
                    }}
                >
                    📥 Mal Kabul
                </button>
                <button
                    onClick={() => setActiveTab('counting')}
                    style={{
                        padding: '12px 4px',
                        border: 'none',
                        borderBottom: activeTab === 'counting' ? '3px solid #e5a93c' : '3px solid transparent',
                        backgroundColor: activeTab === 'counting' ? '#1e293b' : 'transparent',
                        color: activeTab === 'counting' ? '#e5a93c' : '#94a3b8',
                        fontWeight: 800,
                        fontSize: '12px',
                        cursor: 'pointer'
                    }}
                >
                    📊 Sayım
                </button>
                <button
                    onClick={() => setActiveTab('geiger')}
                    style={{
                        padding: '12px 4px',
                        border: 'none',
                        borderBottom: activeTab === 'geiger' ? '3px solid #ec4899' : '3px solid transparent',
                        backgroundColor: activeTab === 'geiger' ? '#1e293b' : 'transparent',
                        color: activeTab === 'geiger' ? '#f472b6' : '#94a3b8',
                        fontWeight: 800,
                        fontSize: '12px',
                        cursor: 'pointer'
                    }}
                >
                    🎯 Geiger
                </button>
            </div>

            {/* TAB 0: KOLI PAKETLEME (BOXING) */}
            {activeTab === 'boxing' && (
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
                    {/* ORDER & BOX SELECTION */}
                    <div style={{ backgroundColor: '#111827', padding: '14px', borderRadius: '12px', border: '1px solid #1f2937', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 700 }}>
                                    📦 PAKETLENECEK SİPARİŞİ SEÇİN:
                                </label>
                                <button
                                    type="button"
                                    onClick={fetchPendingOrders}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#38bdf8',
                                        fontSize: '11px',
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}
                                >
                                    🔄 Yenile ({pendingOrders.length} Sipariş)
                                </button>
                            </div>

                            {/* Search Filter for Fast Handheld Order Selection */}
                            <input
                                type="text"
                                value={boxingSearch}
                                onChange={(e) => setBoxingSearch(e.target.value)}
                                placeholder="🔍 Sipariş No, Marka veya Ürün Ara..."
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    backgroundColor: '#0f172a',
                                    border: '1px solid #334155',
                                    color: '#f8fafc',
                                    fontSize: '13px',
                                    fontWeight: 700,
                                    marginBottom: '8px',
                                    boxSizing: 'border-box'
                                }}
                            />

                            <div style={{ display: 'flex', gap: '8px' }}>
                                <select
                                    value={boxingOrderNo}
                                    onChange={(e) => {
                                        setBoxingOrderNo(e.target.value);
                                        fetchOrderBoxes(e.target.value);
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        borderRadius: '10px',
                                        backgroundColor: '#1e293b',
                                        border: '1px solid #334155',
                                        color: '#f8fafc',
                                        fontSize: '14px',
                                        fontWeight: 700
                                    }}
                                >
                                    <option value="">-- Sipariş Seçin ({pendingOrders.length} Aktif Sipariş) --</option>
                                    {pendingOrders
                                        .filter(o => {
                                            if (!boxingSearch.trim()) return true;
                                            const q = boxingSearch.toLowerCase();
                                            return String(o.order_number).includes(q) ||
                                                String(o.brand || '').toLowerCase().includes(q) ||
                                                String(o.product_name || '').toLowerCase().includes(q) ||
                                                String(o.sub_customer_name || '').toLowerCase().includes(q);
                                        })
                                        .map(o => (
                                            <option key={o.order_number} value={o.order_number}>
                                                #{o.order_number} - {o.brand} | {o.product_name || 'Ürün'} ({o.total_qty || o.quantity || o.total} Adet)
                                            </option>
                                        ))}
                                </select>
                            </div>
                        </div>

                        {/* Selected Order Summary Card */}
                        {boxingOrderNo && (() => {
                            const selectedOrd = pendingOrders.find(o => String(o.order_number) === String(boxingOrderNo));
                            return selectedOrd ? (
                                <div style={{
                                    backgroundColor: '#0f172a',
                                    borderRadius: '10px',
                                    border: '1px solid #1e3a8a',
                                    padding: '10px 14px',
                                    fontSize: '12px'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ backgroundColor: '#e5a93c', color: '#000', padding: '2px 6px', borderRadius: '4px', fontWeight: 900 }}>
                                            {selectedOrd.brand}
                                        </span>
                                        <strong style={{ color: '#38bdf8' }}>
                                            Toplam: {selectedOrd.total_qty || selectedOrd.quantity || selectedOrd.total} Adet
                                        </strong>
                                    </div>
                                    <div style={{ color: '#f8fafc', fontWeight: 800, marginTop: '4px', fontSize: '13px' }}>
                                        #{selectedOrd.order_number} - {selectedOrd.product_name}
                                    </div>
                                    <div style={{ color: '#94a3b8', marginTop: '2px' }}>
                                        Müşteri: {selectedOrd.sub_customer_name || '-'}
                                    </div>
                                </div>
                            ) : null;
                        })()}

                        {boxingOrderNo && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #1f2937' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 700 }}>Aktif Koli:</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <button
                                            onClick={() => setBoxingBoxNo(prev => Math.max(1, prev - 1))}
                                            style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', fontWeight: 900, cursor: 'pointer' }}
                                        >
                                            -
                                        </button>
                                        <strong style={{ fontSize: '16px', color: '#fbbf24', minWidth: '60px', textAlign: 'center' }}>
                                            Koli {boxingBoxNo}
                                        </strong>
                                        <button
                                            onClick={() => setBoxingBoxNo(prev => prev + 1)}
                                            style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', fontWeight: 900, cursor: 'pointer' }}
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                <div style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 800 }}>
                                    {savedOrderBoxes.length} Koli Mühürlendi
                                </div>
                            </div>
                        )}
                    </div>

                    {/* SCAN INPUT */}
                    {boxingOrderNo ? (
                        <>
                            <form onSubmit={handleBoxingScanSubmit}>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
                                    <input
                                        ref={boxingInputRef}
                                        type="text"
                                        value={boxingInput}
                                        onChange={(e) => setBoxingInput(e.target.value)}
                                        placeholder="Koliye konulan RFID / Barkod Okutun..."
                                        autoFocus
                                        style={{
                                            flex: 1,
                                            padding: '16px 14px',
                                            borderRadius: '12px',
                                            backgroundColor: '#111827',
                                            border: '2px solid #10b981',
                                            color: '#fff',
                                            fontSize: '15px',
                                            fontWeight: 800,
                                            boxSizing: 'border-box',
                                            outline: 'none',
                                            boxShadow: '0 0 15px rgba(16, 185, 129, 0.2)'
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            boxingInputRef.current?.focus();
                                            if (boxingInput.trim()) {
                                                handleBoxingScanSubmit();
                                            } else {
                                                playBeep(1100, 0.04);
                                                triggerVibrate([30]);
                                                setStatusMessage({ type: 'info', text: '🎯 TETİK AKTİF: Donanım tetiğine basın veya barkod okutun' });
                                                setTimeout(() => setStatusMessage(null), 1500);
                                            }
                                        }}
                                        title="Tetik / Okut"
                                        style={{
                                            padding: '0 16px',
                                            borderRadius: '12px',
                                            backgroundColor: '#10b981',
                                            color: '#000',
                                            fontWeight: 900,
                                            fontSize: '13px',
                                            border: 'none',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            whiteSpace: 'nowrap',
                                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                                        }}
                                    >
                                        🔫 TETİK
                                    </button>
                                </div>
                            </form>

                            {/* CURRENT BOX COUNTER CARD */}
                            <div style={{
                                backgroundColor: '#111827',
                                borderRadius: '14px',
                                border: '2px solid #10b981',
                                padding: '16px',
                                textAlign: 'center',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                            }}>
                                <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>
                                    📦 {boxingBoxNo}. KOLİ İÇİNDEKİ ÜRÜN ADEDİ
                                </div>
                                <div style={{ fontSize: '64px', fontWeight: 900, color: '#34d399', lineHeight: 1, margin: '8px 0' }}>
                                    {boxingItems.length}
                                </div>
                                <div style={{ fontSize: '12px', color: '#6ee7b7' }}>
                                    Koliye ürün koydukça RFID okutun, dolunca alttaki butona basın.
                                </div>
                            </div>

                            {/* SEAL & SAVE BOX BUTTON */}
                            <button
                                onClick={handleSaveBox}
                                disabled={isSavingBox || boxingItems.length === 0}
                                style={{
                                    padding: '16px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: boxingItems.length > 0
                                        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                        : '#334155',
                                    color: boxingItems.length > 0 ? '#fff' : '#94a3b8',
                                    fontWeight: 900,
                                    fontSize: '16px',
                                    cursor: boxingItems.length > 0 ? 'pointer' : 'not-allowed',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    boxShadow: boxingItems.length > 0 ? '0 6px 20px rgba(16, 185, 129, 0.4)' : 'none'
                                }}
                            >
                                {isSavingBox ? 'Kaydediliyor...' : `📦 ${boxingBoxNo}. KOLİYİ KAPAT & MÜHÜRLE (${boxingItems.length} ADET)`}
                            </button>

                            {/* SCANNED ITEMS LIST IN THIS BOX */}
                            <div style={{ flex: 1, minHeight: '120px', backgroundColor: '#111827', borderRadius: '12px', border: '1px solid #1f2937', padding: '12px', overflowY: 'auto' }}>
                                <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 800, marginBottom: '8px' }}>
                                    📋 Bu Kolideki Ürünler ({boxingItems.length} Adet)
                                </div>
                                {boxingItems.length === 0 ? (
                                    <div style={{ textAlign: 'center', color: '#64748b', fontSize: '13px', padding: '20px' }}>
                                        Bu koliye henüz ürün okutulmadı.
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {boxingItems.map((it, idx) => (
                                            <div key={idx} style={{ padding: '8px 12px', backgroundColor: '#1e293b', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                                                <span style={{ color: '#38bdf8', fontWeight: 800 }}>#{boxingItems.length - idx}</span>
                                                <span style={{ color: '#f8fafc', fontFamily: 'monospace' }}>{it.epc}</span>
                                                <button
                                                    onClick={() => setBoxingItems(prev => prev.filter((_, i) => i !== idx))}
                                                    style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '14px', cursor: 'pointer' }}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* PREVIOUSLY SAVED BOXES FOR THIS ORDER */}
                            {savedOrderBoxes.length > 0 && (
                                <div style={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #334155', padding: '12px' }}>
                                    <div style={{ fontSize: '12px', color: '#fbbf24', fontWeight: 800, marginBottom: '8px' }}>
                                        ✅ Bu Sipariş İçin Kaydedilmiş Koliler (Tünele Hazır)
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {savedOrderBoxes.map((b) => (
                                            <div key={b.box_no} style={{ padding: '8px 12px', backgroundColor: '#1e293b', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                                                <span style={{ color: '#fbbf24', fontWeight: 800 }}>📦 Koli {b.box_no}</span>
                                                <span style={{ color: '#34d399', fontWeight: 800 }}>{b.packed_quantity || b.item_count || 0} Adet</span>
                                                <span style={{ color: '#94a3b8', fontSize: '11px' }}>{b.status || 'PACKED'}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8', fontSize: '14px' }}>
                            👈 Lütfen yukarıdan paketleme yapılacak siparişi seçin.
                        </div>
                    )}
                </div>
            )}


            {/* TAB 1: MAL KABUL (TESELLÜM) */}
            {activeTab === 'receiving' && (
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
                    {/* ORDER SELECTOR */}
                    <div>
                        <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 700, marginBottom: '6px', display: 'block' }}>
                            🎯 HEDEF BEKLEYEN SİPARİŞİ SEÇİN:
                        </label>
                        <select
                            value={selectedOrderNo}
                            onChange={(e) => setSelectedOrderNo(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '10px',
                                backgroundColor: '#1e293b',
                                border: '1px solid #334155',
                                color: '#f8fafc',
                                fontSize: '14px',
                                fontWeight: 700
                            }}
                        >
                            <option value="">-- Tüm Bekleyen Siparişler (Otomatik Eşleme) --</option>
                            {pendingOrders.map(o => (
                                <option key={o.order_number} value={o.order_number}>
                                    #{o.order_number} - {o.brand} ({o.received}/{o.total} Adet - %{o.percentage})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* BARCODE / RFID SCAN INPUT FORM */}
                    <form onSubmit={handleBarcodeSubmit}>
                        <label style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 800, marginBottom: '6px', display: 'block' }}>
                            ⚡ BARKOD / EAN-13 / RFID OKUTUN:
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                ref={inputRef}
                                autoFocus
                                type="text"
                                placeholder="Barkod veya RFID Etiketi Tarayın..."
                                value={currentBarcode}
                                onChange={(e) => setCurrentBarcode(e.target.value)}
                                style={{
                                    flex: 1,
                                    padding: '14px',
                                    borderRadius: '10px',
                                    backgroundColor: '#030712',
                                    border: '2px solid #38bdf8',
                                    color: '#fff',
                                    fontSize: '16px',
                                    fontWeight: 700,
                                    boxSizing: 'border-box'
                                }}
                            />
                            <button
                                type="submit"
                                style={{
                                    backgroundColor: '#38bdf8',
                                    color: '#000',
                                    border: 'none',
                                    borderRadius: '10px',
                                    padding: '0 18px',
                                    fontWeight: 900,
                                    fontSize: '16px',
                                    cursor: 'pointer'
                                }}
                            >
                                OKU
                            </button>
                        </div>
                    </form>

                    {/* SCANNED ITEMS LIST */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 700 }}>
                                📋 OKUTULAN ÜRÜNLER ({scannedItems.length})
                            </span>
                            {scannedItems.length > 0 && (
                                <button
                                    onClick={() => setScannedItems([])}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#f87171',
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        fontWeight: 700
                                    }}
                                >
                                    Temizle
                                </button>
                            )}
                        </div>

                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            maxHeight: '400px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                        }}>
                            {scannedItems.length > 0 ? (
                                scannedItems.map((item, idx) => (
                                    <div key={idx} style={{
                                        backgroundColor: '#1e293b',
                                        border: `1px solid ${item.is_completed ? '#10b981' : '#334155'}`,
                                        borderRadius: '10px',
                                        padding: '10px 12px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <div>
                                            <div style={{ fontWeight: 800, fontSize: '14px', color: '#f8fafc' }}>
                                                {item.product_name || item.code}
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                                                Sipariş: #{item.order_id} | SKU: {item.sku} | Beden: {item.size}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{
                                                backgroundColor: item.is_completed ? '#064e3b' : '#0369a1',
                                                color: '#fff',
                                                padding: '2px 8px',
                                                borderRadius: '6px',
                                                fontWeight: 800,
                                                fontSize: '11px'
                                            }}>
                                                %{item.progress_percent}
                                            </span>
                                            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
                                                {item.timestamp}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b', fontSize: '13px' }}>
                                    Henüz taranmış ürün yok. Barkod okutmaya başlayın.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: HIZLI DEPO SAYIMI */}
            {activeTab === 'counting' && (
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
                    {/* LOCATION SELECTOR */}
                    <div>
                        <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 700, marginBottom: '6px', display: 'block' }}>
                            📍 SAYIM YAPILAN LOKASYON:
                        </label>
                        <select
                            value={countLocation}
                            onChange={(e) => setCountLocation(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '10px',
                                backgroundColor: '#1e293b',
                                border: '1px solid #334155',
                                color: '#f8fafc',
                                fontSize: '14px',
                                fontWeight: 700
                            }}
                        >
                            <option value="Ana Depo Tesellüm">Ana Depo Tesellüm</option>
                            <option value="Showroom">Showroom</option>
                            <option value="Kesimhane">Kesimhane</option>
                            <option value="Dikimhane">Dikimhane</option>
                            <option value="Sevkiyat Alanı">Sevkiyat Alanı</option>
                        </select>
                    </div>

                    {/* CONTINUOUS SCAN INPUT */}
                    <form onSubmit={handleCountScanSubmit}>
                        <label style={{ fontSize: '12px', color: '#e5a93c', fontWeight: 800, marginBottom: '6px', display: 'block' }}>
                            📡 SÜREKLİ RFID / BARKOD TARAYICI:
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                ref={countInputRef}
                                type="text"
                                placeholder="Barkod veya RFID Etiketi..."
                                value={countInput}
                                onChange={(e) => setCountInput(e.target.value)}
                                style={{
                                    flex: 1,
                                    padding: '14px',
                                    borderRadius: '10px',
                                    backgroundColor: '#030712',
                                    border: '2px solid #e5a93c',
                                    color: '#fff',
                                    fontSize: '16px',
                                    fontWeight: 700,
                                    boxSizing: 'border-box'
                                }}
                            />
                            <button
                                type="submit"
                                style={{
                                    backgroundColor: '#e5a93c',
                                    color: '#000',
                                    border: 'none',
                                    borderRadius: '10px',
                                    padding: '0 18px',
                                    fontWeight: 900,
                                    fontSize: '16px',
                                    cursor: 'pointer'
                                }}
                            >
                                EKLE
                            </button>
                        </div>
                    </form>

                    {/* COUNT STATS & AUDIT ACTION */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '10px'
                    }}>
                        <div style={{
                            backgroundColor: '#1e293b',
                            padding: '12px',
                            borderRadius: '10px',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>TOPLAM OKUNAN</div>
                            <div style={{ fontSize: '24px', fontWeight: 900, color: '#e5a93c' }}>
                                {countedTags.length}
                            </div>
                        </div>

                        <button
                            onClick={handleRunAudit}
                            disabled={isAuditing || countedTags.length === 0}
                            style={{
                                backgroundColor: countedTags.length > 0 ? '#10b981' : '#334155',
                                color: countedTags.length > 0 ? '#fff' : '#94a3b8',
                                border: 'none',
                                borderRadius: '10px',
                                fontWeight: 900,
                                fontSize: '14px',
                                cursor: countedTags.length > 0 ? 'pointer' : 'not-allowed'
                            }}
                        >
                            {isAuditing ? 'DENETLENİYOR...' : '🔍 STOK DENETİMİNİ BAŞLAT'}
                        </button>
                    </div>

                    {/* AUDIT RESULTS DISPLAY */}
                    {auditResult && (
                        <div style={{
                            backgroundColor: '#111827',
                            border: '2px solid #334155',
                            borderRadius: '12px',
                            padding: '14px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1f2937', paddingBottom: '8px' }}>
                                <strong style={{ fontSize: '14px', color: '#38bdf8' }}>📊 DENETİM SONUÇLARI</strong>
                                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                                    Eşleşen: <strong style={{ color: '#34d399' }}>{auditResult.matched_items}</strong> | Fazla: <strong style={{ color: '#f87171' }}>{auditResult.excess_items}</strong>
                                </span>
                            </div>

                            <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {auditResult.audit_details.map((item, idx) => (
                                    <div key={idx} style={{
                                        backgroundColor: '#1e293b',
                                        padding: '8px 10px',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <div>
                                            <div style={{ fontWeight: 700, color: '#f8fafc' }}>{item.product_name}</div>
                                            <div style={{ fontSize: '10px', color: '#94a3b8' }}>Kod: {item.code} | Beden: {item.size}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <strong style={{ color: item.status === 'MATCHED' ? '#34d399' : '#f87171' }}>
                                                {item.scanned_qty} Adet
                                            </strong>
                                            <div style={{ fontSize: '10px', color: '#64748b' }}>Sistem: {item.system_qty}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 3: GEIGER BULUCU */}
            {activeTab === 'geiger' && (
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                    {/* TARGET SELECTOR */}
                    <div>
                        <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 700, marginBottom: '6px', display: 'block' }}>
                            🎯 ARANACAK HEDEF ÜRÜNÜ SEÇİN:
                        </label>
                        <select
                            onChange={(e) => {
                                const found = geigerTargets.find(t => String(t.order_number) === e.target.value);
                                if (found) setSelectedGeigerTarget(found);
                            }}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '10px',
                                backgroundColor: '#1e293b',
                                border: '1px solid #334155',
                                color: '#f8fafc',
                                fontSize: '14px',
                                fontWeight: 700
                            }}
                        >
                            {geigerTargets.map(t => (
                                <option key={t.order_number} value={t.order_number}>
                                    #{t.order_number} - {t.product_name} ({t.brand} / {t.sku})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* RADAR SIGNAL METER */}
                    <div style={{
                        backgroundColor: '#111827',
                        border: '2px solid #10b981',
                        borderRadius: '20px',
                        padding: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '16px',
                        boxShadow: isGeigerActive ? '0 0 30px rgba(16, 185, 129, 0.2)' : 'none'
                    }}>
                        <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 700 }}>
                            SİNYAL YAKINLIK DERECESİ (RSSI)
                        </div>

                        <div style={{
                            fontSize: '64px',
                            fontWeight: 900,
                            fontFamily: 'monospace',
                            color: geigerSignal > 70 ? '#34d399' : (geigerSignal > 40 ? '#e5a93c' : '#94a3b8')
                        }}>
                            %{isGeigerActive ? geigerSignal : 0}
                        </div>

                        <div style={{ width: '100%', height: '24px', backgroundColor: '#030712', borderRadius: '12px', overflow: 'hidden', border: '1px solid #1f2937' }}>
                            <div style={{
                                height: '100%',
                                width: `${isGeigerActive ? geigerSignal : 0}%`,
                                backgroundColor: geigerSignal > 70 ? '#10b981' : (geigerSignal > 40 ? '#e5a93c' : '#38bdf8'),
                                transition: 'width 0.3s ease'
                            }}></div>
                        </div>

                        <button
                            onClick={() => setIsGeigerActive(!isGeigerActive)}
                            style={{
                                width: '100%',
                                padding: '16px',
                                borderRadius: '12px',
                                border: 'none',
                                backgroundColor: isGeigerActive ? '#dc2626' : '#10b981',
                                color: '#fff',
                                fontWeight: 900,
                                fontSize: '16px',
                                cursor: 'pointer'
                            }}
                        >
                            {isGeigerActive ? '🛑 ARAMAYI DURDUR' : '🔍 GEIGER RADARINI BAŞLAT'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HandheldTerminal;
