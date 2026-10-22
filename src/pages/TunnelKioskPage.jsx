import React, { useState, useEffect, useRef, useCallback } from 'react';
import API_BASE_URL from '../services/apiConfig';
import OrderBoxPlanModal from '../components/OrderBoxPlanModal';

const TunnelKioskPage = () => {
    // Session State
    const [session, setSession] = useState({
        status: 'IDLE',
        order_id: null,
        order_number: null,
        brand: 'VOG',
        product_name: '',
        sku: '',
        sub_customer_name: '',
        staff_name: '',
        target_quantity: 0,
        scanned_quantity: 0,
        remaining_quantity: 0,
        progress_percent: 0,
        is_matched: false,
        is_overcount: false,
        box_no: 1,
        total_boxes: 1,
        tags: []
    });

    // Orders selection modal & Planning Modal (Method 2 / Mod B)
    const [orders, setOrders] = useState([]);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [planModalOrder, setPlanModalOrder] = useState(null); // Selected order for planning
    const [planTotalBoxes, setPlanTotalBoxes] = useState(1);
    const [planTargetQty, setPlanTargetQty] = useState(11);
    const [orderPackedBoxes, setOrderPackedBoxes] = useState([]); // Packed boxes for Mod B
    const [searchOrder, setSearchOrder] = useState('');
    const [selectedBrandFilter, setSelectedBrandFilter] = useState('ALL');
    const [isLoadingOrders, setIsLoadingOrders] = useState(false);
    const [editingBoxPlanOrder, setEditingBoxPlanOrder] = useState(null);

    // Modal Mode Tab ('ORDER' | 'PERSONNEL')
    const [modalTab, setModalTab] = useState('PERSONNEL');
    // Personnel Selection & Ordering States
    const [personnelBrands, setPersonnelBrands] = useState([]);
    const [selectedPersonnelBrand, setSelectedPersonnelBrand] = useState('SKODA');
    const [selectedPersonnelDepartment, setSelectedPersonnelDepartment] = useState('Danışman');
    const [personnelStartBox, setPersonnelStartBox] = useState(1);
    const [personnelBoxes, setPersonnelBoxes] = useState([]);
    const [personnelSearch, setPersonnelSearch] = useState('');
    const [isLoadingPersonnel, setIsLoadingPersonnel] = useState(false);
    const [isRenumbering, setIsRenumbering] = useState(false);
    const [jumpBoxInput, setJumpBoxInput] = useState('');

    // Manual Barcode Input Modal
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    const [manualBarcode, setManualBarcode] = useState('');


    // Audio & UI States
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [lastScanEvent, setLastScanEvent] = useState(null);
    const [actionMessage, setActionMessage] = useState(null); // { type: 'success' | 'error' | 'info', text: '' }
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('tr-TR'));
    const [readerPower, setReaderPower] = useState(20.0);
    const [rssiThreshold, setRssiThreshold] = useState(-50);
    const [autoComplete, setAutoComplete] = useState(false);
    const [autoPrintOnExit, setAutoPrintOnExit] = useState(true); // Tünelden koli çıkınca otomatik basım
    const [exitDebounceMs, setExitDebounceMs] = useState(2000); // Tünel çıkış bekleme süresi (2 sn)
    const [syncToLogo, setSyncToLogo] = useState(true);
    const [telemetry, setTelemetry] = useState({ temperature: 42, cpu: 10, ram: 30, status: 'OK', ping: 4 });
    const [showHelpModal, setShowHelpModal] = useState(false);

    // 4 Tünel Anteni Durumu (Port 1..4)
    const [antennas, setAntennas] = useState([
        { port: 1, name: 'Anten 1 (Üst Sol)', count: 0, last_seen: null, active: true },
        { port: 2, name: 'Anten 2 (Üst Sağ)', count: 0, last_seen: null, active: true },
        { port: 3, name: 'Anten 3 (Alt Sol)', count: 0, last_seen: null, active: true },
        { port: 4, name: 'Anten 4 (Alt Sağ)', count: 0, last_seen: null, active: true }
    ]);

    const audioCtxRef = useRef(null);
    const prevScannedQtyRef = useRef(0);

    // Web Audio API Synthesizer (Zero External Dependencies)
    const initAudioContext = () => {
        if (!audioCtxRef.current) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                audioCtxRef.current = new AudioContext();
            }
        }
        if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }
    };

    // Auto-unlock AudioContext on first user interaction (Chrome/Edge policy)
    useEffect(() => {
        const unlockAudio = () => {
            initAudioContext();
            window.removeEventListener('click', unlockAudio);
            window.removeEventListener('touchstart', unlockAudio);
        };
        window.addEventListener('click', unlockAudio);
        window.addEventListener('touchstart', unlockAudio);
        return () => {
            window.removeEventListener('click', unlockAudio);
            window.removeEventListener('touchstart', unlockAudio);
        };
    }, []);


    const playBeep = useCallback((freq = 880, duration = 0.06) => {
        if (!soundEnabled) return;
        try {
            initAudioContext();
            if (!audioCtxRef.current) return;
            const ctx = audioCtxRef.current;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + duration);
        } catch (e) {
            console.error('Audio play error:', e);
        }
    }, [soundEnabled]);

    const playSuccessChime = useCallback(() => {
        if (!soundEnabled) return;
        try {
            initAudioContext();
            if (!audioCtxRef.current) return;
            const ctx = audioCtxRef.current;
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
            notes.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
                gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.08);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.25);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime + idx * 0.08);
                osc.stop(ctx.currentTime + idx * 0.08 + 0.25);
            });
        } catch (e) {
            console.error('Audio chime error:', e);
        }
    }, [soundEnabled]);

    const playAlarmBuzzer = useCallback(() => {
        if (!soundEnabled) return;
        try {
            initAudioContext();
            if (!audioCtxRef.current) return;
            const ctx = audioCtxRef.current;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.2);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.3);
        } catch (e) {
            console.error('Audio alarm error:', e);
        }
    }, [soundEnabled]);

    // Live Clock Interval
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString('tr-TR'));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Local Takipsan / Impinj Bridge WebSocket Client
    const [bridgeStatus, setBridgeStatus] = useState('DISCONNECTED'); // 'CONNECTED', 'DISCONNECTED', 'SCANNING'
    const bridgeWsRef = useRef(null);

    useEffect(() => {
        // Native LLRP driver runs as a background Windows Service on the Tünel PC
        setBridgeStatus('CONNECTED');
    }, []);

    // Live Hardware Driver Status (TCP Socket / Remote Reader 192.168.1.79:7070)
    const [driverStatus, setDriverStatus] = useState({
        server_listening: true,
        active_clients: 0,
        remote_connected: true
    });

    // Kiosk Okuma Gücü Değişikliği (HTTP POST)
    const handlePowerChange = async (e) => {
        const val = parseFloat(e.target.value);
        setReaderPower(val);
        try {
            const res = await fetch(`${API_BASE_URL}/api/tunnel/kiosk/set-power`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ power: val })
            });
            const data = await res.json();
            if (data.success) {
                setActionMessage({ type: 'success', text: `Tünel gücü ${val} dBm olarak ayarlandı.` });
                setTimeout(() => setActionMessage(null), 3000);
            } else {
                setActionMessage({ type: 'error', text: `Güç ayarlanamadı: ${data.error}` });
                setTimeout(() => setActionMessage(null), 3000);
            }
        } catch (err) {
            console.error('Power change error:', err);
            setActionMessage({ type: 'error', text: 'Bağlantı hatası: Güç seviyesi güncellenemedi.' });
            setTimeout(() => setActionMessage(null), 3000);
        }
    };

    // Kiosk RSSI Filtresi Değişikliği (HTTP POST)
    const handleRssiChange = async (e) => {
        const val = parseInt(e.target.value);
        setRssiThreshold(val);
        try {
            const res = await fetch(`${API_BASE_URL}/api/tunnel/kiosk/set-rssi`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rssi: val })
            });
            const data = await res.json();
            if (data.success) {
                setActionMessage({ type: 'success', text: `Sinyal filtre eşiği ${val} dBm olarak ayarlandı.` });
                setTimeout(() => setActionMessage(null), 3000);
            } else {
                setActionMessage({ type: 'error', text: `Filtre ayarlanamadı: ${data.error}` });
                setTimeout(() => setActionMessage(null), 3000);
            }
        } catch (err) {
            console.error('RSSI change error:', err);
            setActionMessage({ type: 'error', text: 'Bağlantı hatası: Sinyal filtresi güncellenemedi.' });
            setTimeout(() => setActionMessage(null), 3000);
        }
    };

    // Kiosk Koli Etiketi Otomatik / Manuel Basım Modu Değişikliği (HTTP POST)
    const handleSetPrintMode = async (isAuto) => {
        setAutoComplete(isAuto);
        try {
            const res = await fetch(`${API_BASE_URL}/api/tunnel/kiosk/set-auto-complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ autoComplete: isAuto })
            });
            const data = await res.json();
            if (data.success) {
                setActionMessage({ 
                    type: 'success', 
                    text: isAuto 
                        ? `🟢 Koli Etiketi OTOMATİK Basım Moduna Alındı: Koli tamamlanınca etiket basılır ve sıradaki koliye geçilir.` 
                        : `🔵 Koli Etiketi Otomatik Basım KAPALI: Koli tamamlanınca etiket basılmaz, sıradaki koliye OTOMATİK geçilir (İstendiğinde manuel butonla basılabilir).` 
                });
                setTimeout(() => setActionMessage(null), 4000);
            } else {
                setActionMessage({ type: 'error', text: `Basım modu ayarlanamadı: ${data.error}` });
                setTimeout(() => setActionMessage(null), 3000);
            }
        } catch (err) {
            console.error('Print mode change error:', err);
            setActionMessage({ type: 'error', text: 'Bağlantı hatası: Basım modu güncellenemedi.' });
            setTimeout(() => setActionMessage(null), 3000);
        }
    };

    const handleAutoCompleteChange = async (e) => {
        handleSetPrintMode(e.target.checked);
    };

    // 🖨️ Tünel Çıkışında Otomatik Koli Basım Modu Ayarlama (Seçenek 1)
    const handleSetExitAutoPrint = async (enabled) => {
        setAutoPrintOnExit(enabled);
        try {
            const res = await fetch(`${API_BASE_URL}/api/tunnel/kiosk/set-exit-auto-print`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ autoPrintOnExit: enabled, exitDebounceMs })
            });
            const data = await res.json();
            if (data.success) {
                setActionMessage({
                    type: 'success',
                    text: enabled
                        ? `🟢 TÜNEL ÇIKIŞI OTOMATİK BASIM AÇIK: Koli tünelden çıkınca (2 sn sessizlik) içindeki tüm ürünlerle otomatik Godex koli etiketi basılır!`
                        : `⚪ TÜNEL ÇIKIŞI OTOMATİK BASIM KAPALI: Koli çıkınca etiket otomatik basılmaz, ekrandaki butona basılması beklenir.`
                });
                setTimeout(() => setActionMessage(null), 4500);
            }
        } catch (err) {
            console.error('Exit auto-print change error:', err);
        }
    };

    // Mevcut Kolinin Etiketini SATO / Godex Yazıcıdan Manuel Basma
    const handleManualPrintCurrentBox = async () => {
        try {
            setActionMessage({ type: 'info', text: '🖨️ Koli etiketi yazıcıya gönderiliyor...' });
            const res = await fetch(`${API_BASE_URL}/api/tunnel/kiosk/print-current-box`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    order_id: session?.order_number || session?.order_id,
                    box_no: session?.box_no || 1,
                    total_boxes: session?.total_boxes || 1
                })
            });
            const json = await res.json();
            if (json.success) {
                playSuccessChime();
                setActionMessage({ 
                    type: 'success', 
                    text: `🖨️ Koli ${session?.box_no || 1}/${session?.total_boxes || 1} Etiketi Başarıyla SATO/Godex Yazıcıya Gönderildi!` 
                });
                setTimeout(() => setActionMessage(null), 4500);
            } else {
                setActionMessage({ type: 'error', text: 'Yazdırma hatası: ' + (json.error || 'Bilinmeyen hata') });
                setTimeout(() => setActionMessage(null), 4000);
            }
        } catch (e) {
            console.error('Manual print error:', e);
            setActionMessage({ type: 'error', text: 'Yazdırma bağlantı hatası: ' + e.message });
            setTimeout(() => setActionMessage(null), 4000);
        }
    };

    // Poll Kiosk Status every 800ms
    const fetchStatus = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/tunnel/kiosk/status`);
            const json = await res.json();
            if (json.success && json.session) {
                const s = json.session;
                
                // 🚨 ALARM VEYA YENİ OKUMA SESLİ UYARISI
                if (s.status === 'ALARM' || s.is_alarm) {
                    playAlarmBuzzer();
                } else if (s.scanned_quantity > prevScannedQtyRef.current) {
                    if (s.scanned_quantity === s.target_quantity) {
                        playSuccessChime();
                    } else if (s.scanned_quantity > s.target_quantity) {
                        playAlarmBuzzer();
                    } else {
                        playBeep(950, 0.05);
                    }
                    setLastScanEvent({
                        time: new Date().toLocaleTimeString('tr-TR'),
                        qty: s.scanned_quantity
                    });
                }
                prevScannedQtyRef.current = s.scanned_quantity;
                setSession(s);
                if (json.driver_status) {
                    setDriverStatus(json.driver_status);
                }
                if (json.power !== undefined) {
                    setReaderPower(json.power);
                }
                if (json.rssi_threshold !== undefined) {
                    setRssiThreshold(json.rssi_threshold);
                }
                if (json.auto_complete !== undefined) {
                    setAutoComplete(json.auto_complete);
                }
                if (json.auto_print_on_exit !== undefined) {
                    setAutoPrintOnExit(json.auto_print_on_exit);
                }
                if (json.exit_debounce_ms !== undefined) {
                    setExitDebounceMs(json.exit_debounce_ms);
                }
                if (json.telemetry !== undefined) {
                    setTelemetry(json.telemetry);
                }
                if (json.antennas && Array.isArray(json.antennas) && json.antennas.length > 0) {
                    setAntennas(json.antennas);
                } else if (s.antennas && Array.isArray(s.antennas) && s.antennas.length > 0) {
                    setAntennas(s.antennas);
                }
            }
        } catch (err) {
            console.error('Kiosk status poll error:', err);
        }
    }, [playBeep, playSuccessChime, playAlarmBuzzer]);

    useEffect(() => {
        fetchStatus();
        const pollInterval = setInterval(fetchStatus, 800);
        return () => clearInterval(pollInterval);
    }, [fetchStatus]);

    // The hardware bridge is handled in the background by the Windows Service (VogTunnelBridge)


    // Fetch Orders List for Modal
    const fetchOrdersList = async (q = '', brand = 'ALL') => {
        setIsLoadingOrders(true);
        try {
            const params = new URLSearchParams();
            if (q) params.set('q', q);
            if (brand && brand !== 'ALL') params.set('brand', brand);
            const res = await fetch(`${API_BASE_URL}/api/tunnel/kiosk/orders?${params.toString()}`);
            const json = await res.json();
            if (json.success) {
                setOrders(json.data || []);
            }
        } catch (err) {
            console.error('Fetch orders error:', err);
        } finally {
            setIsLoadingOrders(false);
        }
    };

    // Fetch Personnel Brands Summary
    const fetchPersonnelBrands = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/tunnel/kiosk/personnel/brands`);
            const json = await res.json();
            if (json.success && json.brands) {
                setPersonnelBrands(json.brands);
                const currentBrandObj = json.brands.find(b => b.brand === selectedPersonnelBrand);
                if (currentBrandObj && currentBrandObj.departments && currentBrandObj.departments.length > 0) {
                    const hasCurrentDept = currentBrandObj.departments.some(d => d.department === selectedPersonnelDepartment);
                    if (!hasCurrentDept) {
                        setSelectedPersonnelDepartment(currentBrandObj.departments[0].department);
                    }
                }
            }
        } catch (e) {
            console.error('Fetch personnel brands error:', e);
        }
    };

    // Fetch Personnel Boxes by Brand, Department and Filter
    const fetchPersonnelBoxes = async (brand = selectedPersonnelBrand, department = selectedPersonnelDepartment, q = '') => {
        let activeDept = department;
        let query = q;
        if (typeof activeDept === 'string' && (activeDept === '' || (query === '' && !['Danışman', 'Formen', 'Hasar Garanti', 'MİS', 'Teknisyen', 'Yedek Parça', 'ALL'].includes(activeDept)))) {
            const brandObj = personnelBrands.find(b => b.brand === brand);
            const isKnownDept = brandObj?.departments?.some(d => d.department === activeDept);
            if (!isKnownDept && activeDept !== undefined) {
                query = activeDept;
                activeDept = selectedPersonnelDepartment;
            }
        }

        setIsLoadingPersonnel(true);
        try {
            const params = new URLSearchParams({ brand: brand || 'SKODA' });
            if (activeDept && activeDept !== 'ALL') params.set('department', activeDept);
            if (query) params.set('q', query);
            const res = await fetch(`${API_BASE_URL}/api/tunnel/kiosk/personnel/boxes?${params.toString()}`);
            const json = await res.json();
            if (json.success && json.boxes) {
                setPersonnelBoxes(json.boxes);
            }
        } catch (e) {
            console.error('Fetch personnel boxes error:', e);
        } finally {
            setIsLoadingPersonnel(false);
        }
    };

    // Start Personnel RFID Session
    const handleStartPersonnelSession = async (brand = selectedPersonnelBrand, department = selectedPersonnelDepartment, startBox = personnelStartBox) => {
        let activeDept = department;
        let boxNum = startBox;
        if (typeof activeDept === 'number' || (typeof activeDept === 'string' && /^\d+$/.test(activeDept) && !['Danışman', 'Formen', 'Hasar Garanti', 'MİS', 'Teknisyen', 'Yedek Parça'].includes(activeDept))) {
            boxNum = activeDept;
            activeDept = selectedPersonnelDepartment;
        }
        boxNum = Math.max(1, parseInt(boxNum, 10) || 1);
        try {
            const res = await fetch(`${API_BASE_URL}/api/tunnel/kiosk/personnel/start-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ brand, department: activeDept, start_box_no: boxNum })
            });
            const json = await res.json();
            if (json.success) {
                setSession(json.session);
                setIsOrderModalOpen(false);
                prevScannedQtyRef.current = 0;
                playSuccessChime();
                setActionMessage({
                    type: 'success',
                    text: `👤 ${brand} [${json.box?.department || activeDept}] Koli #${boxNum} Taraması Başlatıldı: ${json.box?.name || ''} (${json.box?.service_center || ''}) - Hedef: ${json.box?.target_quantity || 7} Adet`
                });
                setTimeout(() => setActionMessage(null), 5000);
            } else {
                alert('Oturum başlatılamadı: ' + (json.error || 'Bilinmeyen hata'));
            }
        } catch (e) {
            console.error('Start personnel session error:', e);
            setActionMessage({ type: 'error', text: 'Hata: ' + e.message });
        }
    };

    // Switch Personnel Box Directly
    const handleSwitchPersonnelBox = async (boxNo) => {
        const targetBoxNo = Math.max(1, parseInt(boxNo, 10) || 1);
        try {
            const res = await fetch(`${API_BASE_URL}/api/tunnel/kiosk/personnel/switch-box`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    brand: session.brand || selectedPersonnelBrand, 
                    box_no: targetBoxNo,
                    department: session.department || selectedPersonnelDepartment
                })
            });
            const json = await res.json();
            if (json.success) {
                prevScannedQtyRef.current = 0;
                setJumpBoxInput('');
                playSuccessChime();
                fetchStatus();
                setActionMessage({
                    type: 'success',
                    text: `📦 Koli #${targetBoxNo} Yüklendi (${json.box?.name || ''} [${json.box?.department || ''}] - ${json.box?.service_center || ''})`
                });
                setTimeout(() => setActionMessage(null), 3500);
            } else {
                setActionMessage({ type: 'error', text: 'Koli değiştirilemedi: ' + (json.error || 'Hata') });
            }
        } catch (e) {
            console.error('Switch personnel box error:', e);
            setActionMessage({ type: 'error', text: 'Bağlantı hatası: ' + e.message });
        }
    };

    // Renumber Personnel Cartons in A-Z Turkish Alphabetical Order
    const handleRenumberPersonnel = async (brand = selectedPersonnelBrand, department = selectedPersonnelDepartment) => {
        const deptLabel = department && department !== 'ALL' ? ` [${department}] bölümündeki` : '';
        if (!window.confirm(`${brand}${deptLabel} tüm personeli koli sırasına göre Koli 1'den başlayarak numaralandırmak istiyor musunuz?`)) {
            return;
        }
        setIsRenumbering(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/tunnel/kiosk/personnel/renumber`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ brand, department, start_box_no: 1 })
            });
            const json = await res.json();
            if (json.success) {
                playSuccessChime();
                setActionMessage({
                    type: 'success',
                    text: `✅ ${brand}${deptLabel} personeli (${json.total_count} koli) başarıyla 1..${json.total_count} olarak numaralandırıldı!`
                });
                fetchPersonnelBoxes(brand, department, personnelSearch);
                fetchPersonnelBrands();
                setTimeout(() => setActionMessage(null), 5000);
            } else {
                alert('Numaralandırma hatası: ' + (json.error || 'Bilinmeyen hata'));
            }
        } catch (e) {
            console.error('Renumber error:', e);
            alert('Numaralandırma bağlantı hatası: ' + e.message);
        } finally {
            setIsRenumbering(false);
        }
    };

    const handleJumpBox = (e) => {
        if (e) e.preventDefault();
        const val = parseInt(jumpBoxInput, 10);
        if (!isNaN(val) && val >= 1 && val <= (session.total_boxes || 9999)) {
            handleSwitchPersonnelBox(val);
        } else {
            alert(`Lütfen 1 ile ${session.total_boxes || 1} arasında geçerli bir koli numarası giriniz.`);
        }
    };

    const handleOpenOrderModal = () => {
        setSearchOrder('');
        setSelectedBrandFilter('ALL');
        fetchOrdersList('', 'ALL');
        fetchPersonnelBrands();
        fetchPersonnelBoxes(selectedPersonnelBrand, selectedPersonnelDepartment, '');
        setIsOrderModalOpen(true);
    };


    const handleOpenPlanModal = async (order) => {
        const totalQty = order.remaining_quantity > 0 ? order.remaining_quantity : (order.quantity || 1);
        const initialBoxes = Math.max(1, parseInt(order.total_boxes, 10) || 1);
        const perBoxQty = Math.max(1, Math.ceil(totalQty / initialBoxes));
        
        setPlanModalOrder(order);
        setPlanTotalBoxes(initialBoxes);
        setPlanTargetQty(perBoxQty);
        setOrderPackedBoxes([]);

        try {
            const res = await fetch(`${API_BASE_URL}/api/terminal/order-boxes/${order.order_number || order.id}`);
            const json = await res.json();
            if (json.success && json.boxes) {
                setOrderPackedBoxes(json.boxes);
            }
        } catch (e) {
            console.error('Fetch order boxes error:', e);
        }
    };

    const handleSelectBoxForVerification = async (orderNumber, boxNo) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/tunnel/kiosk/select-box-for-verification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order_number: orderNumber, box_no: boxNo })
            });
            const json = await res.json();
            if (json.success) {
                setSession(json.session);
                setPlanModalOrder(null);
                setIsOrderModalOpen(false);
                prevScannedQtyRef.current = 0;
                playSuccessChime();
                setActionMessage({ type: 'success', text: `🔍 Sipariş #${orderNumber} Koli ${boxNo} Doğrulamaya Alındı (${json.box.packed_quantity} Adet Bekleniyor)` });
                setTimeout(() => setActionMessage(null), 4000);
            } else {
                alert('Doğrulama başlatılamadı: ' + json.error);
            }
        } catch (e) {
            console.error('Select box for verification error:', e);
            setActionMessage({ type: 'error', text: 'Doğrulama başlatılamadı: ' + e.message });
        }
    };


    const handleConfirmStartSession = async () => {
        if (!planModalOrder) return;
        const order = planModalOrder;
        const totalOrderQty = order.remaining_quantity > 0 ? order.remaining_quantity : (order.quantity || 1);
        try {
            const res = await fetch(`${API_BASE_URL}/api/tunnel/kiosk/start-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    order_id: order.id,
                    order_number: order.order_number,
                    brand: order.brand,
                    product_name: order.product_name,
                    sku: order.sku || order.code39 || '',
                    sub_customer_name: order.sub_customer_name || order.customer_name,
                    staff_name: order.staff_name,
                    total_order_quantity: totalOrderQty,
                    target_quantity: planTargetQty,
                    total_boxes: planTotalBoxes,
                    box_no: 1,
                    reset_boxes: true
                })
            });

            const json = await res.json();
            if (json.success) {
                setSession(json.session);
                setPlanModalOrder(null);
                setIsOrderModalOpen(false);
                prevScannedQtyRef.current = 0;
                setActionMessage({ type: 'success', text: `📦 Sipariş #${order.order_number} başlatıldı (Toplam: ${totalOrderQty} Adet, Koli 1/${planTotalBoxes} - Hedef: ${planTargetQty} Adet)` });
                setTimeout(() => setActionMessage(null), 4000);
            }
        } catch (err) {
            console.error('Start session error:', err);
            setActionMessage({ type: 'error', text: 'Oturum başlatılamadı: ' + err.message });
        }
    };

    const handleStartNextBox = async (customTarget) => {
        try {
            const body = customTarget ? { target_quantity: customTarget } : {};
            const res = await fetch(`${API_BASE_URL}/api/tunnel/kiosk/start-next-box`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const json = await res.json();
            if (json.success) {
                setSession(json.session);
                prevScannedQtyRef.current = 0;
                playSuccessChime();
                setActionMessage({ type: 'success', text: `▶️ ${json.session.box_no}. Koli Taraması Başlatıldı (${json.session.box_no}/${json.session.total_boxes} - Hedef: ${json.session.target_quantity} Adet)` });
                setTimeout(() => setActionMessage(null), 3500);
            }
        } catch (err) {
            console.error('Start next box error:', err);
            setActionMessage({ type: 'error', text: 'Sıradaki koliye geçilemedi: ' + err.message });
        }
    };


    const handleChangeTotalBoxes = async () => {
        const currentTotal = session?.total_boxes || 1;
        const newTotalStr = window.prompt(`Siparişin Toplam Koli Sayısını Giriniz:`, currentTotal);
        if (newTotalStr !== null && newTotalStr.trim() !== '') {
            const parsed = parseInt(newTotalStr.trim(), 10);
            if (!isNaN(parsed) && parsed > 0) {
                try {
                    const res = await fetch(`${API_BASE_URL}/api/tunnel/kiosk/set-total-boxes`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ total_boxes: parsed })
                    });
                    const data = await res.json();
                    if (data.success) {
                        setSession(data.session);
                        setActionMessage({ type: 'success', text: `📦 Toplam koli sayısı ${parsed} olarak güncellendi.` });
                        setTimeout(() => setActionMessage(null), 3000);
                    }
                } catch (e) {
                    console.error('Change total boxes error:', e);
                }
            }
        }
    };


    const handleChangeTarget = async () => {

        const currentTarget = session?.target_quantity || 11;
        const newTargetStr = window.prompt(`Koli / Okuma Hedef Adedini Giriniz:`, currentTarget);
        if (newTargetStr !== null && newTargetStr.trim() !== '') {
            const parsedTarget = parseInt(newTargetStr.trim(), 10);
            if (!isNaN(parsedTarget) && parsedTarget > 0) {
                try {
                    const res = await fetch(`${API_BASE_URL}/api/tunnel/kiosk/set-target-quantity`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ target_quantity: parsedTarget })
                    });
                    const data = await res.json();
                    if (data.success) {
                        setSession(data.session);
                        setActionMessage({ type: 'success', text: `🎯 Hedef adet ${parsedTarget} olarak güncellendi.` });
                        setTimeout(() => setActionMessage(null), 3000);
                    }
                } catch (e) {
                    console.error('Change target error:', e);
                }
            }
        }
    };

    const handlePauseSession = async () => {

        try {
            const res = await fetch(`${API_BASE_URL}/api/tunnel/kiosk/pause-session`, { method: 'POST' });
            const json = await res.json();
            if (json.success) setSession(json.session);
        } catch (e) {
            console.error('Pause session error:', e);
        }
    };

    const handleResetSession = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/tunnel/kiosk/reset`, { method: 'POST' });
            const json = await res.json();
            if (json.success) {
                setSession(json.session);
                prevScannedQtyRef.current = 0;
                setActionMessage({ type: 'info', text: 'Koli okuma sayaçları sıfırlandı.' });
                setTimeout(() => setActionMessage(null), 3000);
            }
        } catch (e) {
            console.error('Reset error:', e);
        }
    };

    const handleCompleteBox = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/tunnel/kiosk/complete-box`, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ syncToLogo })
            });
            const json = await res.json();
            if (json.success) {
                playSuccessChime();
                setActionMessage({
                    type: 'success',
                    text: `✅ Koli Başarıyla Tamamlandı! (${json.scanned_quantity} Adet). Koli Etiketi basıldı & LOGO ERP güncellendi.`
                });
                fetchStatus();
                setTimeout(() => setActionMessage(null), 5000);
            } else {
                setActionMessage({ type: 'error', text: 'Hata: ' + (json.error || 'İşlem tamamlanamadı.') });
            }
        } catch (e) {
            console.error('Complete box error:', e);
            setActionMessage({ type: 'error', text: 'Sunucu hatası: ' + e.message });
        }
    };

    // 🚨 Alarmı Sıfırlama ve Normal Akışı Başlatma
    const handleResetAlarm = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/tunnel/kiosk/reset-alarm`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const json = await res.json();
            if (json.success) {
                setActionMessage({
                    type: 'success',
                    text: '🔄 Alarm sıfırlandı. Konveyör yürüyen palet ve normal tarama akışı yeniden başlatıldı.'
                });
                fetchStatus();
                setTimeout(() => setActionMessage(null), 4000);
            } else {
                setActionMessage({ type: 'error', text: 'Hata: ' + (json.error || 'Alarm sıfırlanamadı.') });
            }
        } catch (e) {
            console.error('Reset alarm error:', e);
            setActionMessage({ type: 'error', text: 'Bağlantı hatası: ' + e.message });
        }
    };

    // 🗑️ Mevcut Kolinin Okumalarını Sıfırlama (Kutuyu Düzeltip Yeniden Geçirmek İçin)
    const handleClearBoxScans = async () => {
        if (!window.confirm('Mevcut kolinin okunan tüm etiketleri sıfırlanacak ve koli yeniden taranmaya hazır hale getirilecek. Emin misiniz?')) {
            return;
        }
        try {
            const res = await fetch(`${API_BASE_URL}/api/tunnel/kiosk/clear-box-scans`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const json = await res.json();
            if (json.success) {
                setActionMessage({
                    type: 'success',
                    text: '🗑️ Koli okumaları sıfırlandı! Koli içeriğini düzeltip tünelden tekrar geçirebilirsiniz.'
                });
                fetchStatus();
                setTimeout(() => setActionMessage(null), 4000);
            } else {
                setActionMessage({ type: 'error', text: 'Hata: ' + (json.error || 'Koli okumaları sıfırlanamadı.') });
            }
        } catch (e) {
            console.error('Clear box scans error:', e);
            setActionMessage({ type: 'error', text: 'Bağlantı hatası: ' + e.message });
        }
    };

    const handleManualScanSubmit = async (e) => {
        e.preventDefault();
        const code = manualBarcode.trim();
        if (!code) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/tunnel/kiosk/scan-tag`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    barcode: code,
                    epc: code.length === 24 ? code : undefined,
                    source: 'MANUAL_KIOSK_KEYBOARD'
                })
            });
            const json = await res.json();
            if (json.success) {
                setManualBarcode('');
                setIsManualModalOpen(false);
                fetchStatus();
            }
        } catch (err) {
            console.error('Manual scan error:', err);
        }
    };

    const triggerImpinjManual = () => {
        try {
            const urls = ['ws://127.0.0.1:8025/ws', 'ws://localhost:8025/ws'];
            urls.forEach(u => {
                try {
                    const ws = new WebSocket(u);
                    ws.onopen = () => {
                        console.log('⚡ [1/3] createreader gönderiliyor:', u);
                        // 1. Create Reader
                        ws.send(JSON.stringify({
                            type: "createreader",
                            body: {
                                id: "1",
                                param: {
                                    id: 1,
                                    readerType: "Impinj",
                                    connectionType: "Ethernet",
                                    address: "192.168.0.13"
                                }
                            }
                        }));

                        // 2. Connect Reader & Antennas
                        const activePower = parseFloat(readerPower) || 20.0;
                        setTimeout(() => {
                            console.log(`⚡ [2/3] connectreader gönderiliyor (Güç: ${activePower} dBm)...`);
                            ws.send(JSON.stringify({
                                type: "connectreader",
                                body: {
                                    id: "1",
                                    param: {
                                        id: 1,
                                        settings: {
                                            readPower: activePower,
                                            writePower: activePower,
                                            antennas: [
                                                { portNumber: 1, enabled: true, readPower: activePower },
                                                { portNumber: 2, enabled: true, readPower: activePower },
                                                { portNumber: 3, enabled: true, readPower: activePower },
                                                { portNumber: 4, enabled: true, readPower: activePower }
                                            ]
                                        }
                                    }
                                }
                            }));
                        }, 500);

                        // 3. Start Reader
                        setTimeout(() => {
                            console.log('⚡ [3/3] startreader (Anten Ateşleme) gönderiliyor...');
                            ws.send(JSON.stringify({
                                type: "startreader",
                                body: {
                                    id: "1",
                                    param: { id: 1 }
                                }
                            }));
                            setActionMessage({ type: 'success', text: `📡 Impinj 4-Antenli Okuyucu Başarıyla Ateşlendi (${activePower} dBm)!` });
                        }, 1200);
                    };

                    ws.onmessage = async (event) => {
                        try {
                            const data = JSON.parse(event.data);
                            if (data.tags && Array.isArray(data.tags)) {
                                for (const t of data.tags) {
                                    const epc = typeof t === 'string' ? t : (t.epc || t.tag || t.Epc);
                                    const rssi = typeof t === 'object' && t ? (t.rssi !== undefined ? t.rssi : (t.peakRssi !== undefined ? t.peakRssi : (t.Rssi !== undefined ? t.Rssi : null))) : null;
                                    const antenna = typeof t === 'object' && t ? (t.antenna || t.antennaPort || t.antennaId || t.Antenna || t.AntennaID || 1) : 1;
                                    if (epc) {
                                        await fetch(`${API_BASE_URL}/api/tunnel/kiosk/scan-tag`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ rfid_tag: epc, rssi: rssi, antenna: antenna, source: 'TAKIPSAN_BRIDGE' })
                                        });
                                    }
                                }
                                fetchStatus();
                            }
                        } catch (e) {}
                    };
                } catch (err) {}
            });

            // Backend Kiosk Oturumunu Canlı Tut ve Senkronize Et
            fetch(`${API_BASE_URL}/api/tunnel/kiosk/status`)
                .then(r => r.json())
                .then(d => {
                    if (d.session && d.session.status === 'PAUSED') {
                        fetch(`${API_BASE_URL}/api/tunnel/kiosk/pause-session`, { method: 'POST' });
                    }
                    fetchStatus();
                })
                .catch(() => {});

            setActionMessage({ type: 'success', text: '📡 Impinj Antenleri Ateşlendi! Okuma Bekleniyor.' });
            setTimeout(() => setActionMessage(null), 4000);
        } catch (e) {
            console.error('Trigger error:', e);
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => console.error(err));
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    };

    // Filtered orders for modal
    const filteredOrders = orders.filter(o => {
        const matchesBrand = selectedBrandFilter === 'ALL' || o.brand?.toUpperCase() === selectedBrandFilter;
        const q = searchOrder.toLowerCase();
        const matchesSearch = !q ||
            String(o.order_number).includes(q) ||
            (o.product_name && o.product_name.toLowerCase().includes(q)) ||
            (o.sub_customer_name && o.sub_customer_name.toLowerCase().includes(q)) ||
            (o.staff_name && o.staff_name.toLowerCase().includes(q)) ||
            (o.sku && o.sku.toLowerCase().includes(q));
        return matchesBrand && matchesSearch;
    });

    // Filtered personnel boxes for modal
    const filteredPersonnelBoxes = personnelBoxes.filter(b => {
        if (!personnelSearch.trim()) return true;
        const q = personnelSearch.trim().toLowerCase();
        return (
            String(b.box_no).includes(q) ||
            (b.name && b.name.toLowerCase().includes(q)) ||
            (b.service_center && b.service_center.toLowerCase().includes(q)) ||
            (b.department && b.department.toLowerCase().includes(q)) ||
            (b.box_barcode && b.box_barcode.toLowerCase().includes(q))
        );
    });

    const isTargetReached = session.is_matched;
    const isOvercount = session.is_overcount;
    const isScanning = session.status === 'SCANNING';

    return (
        <div style={{
            height: '100vh',
            maxHeight: '100vh',
            backgroundColor: '#0a0d14',
            color: '#f0f4f8',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            display: 'flex',
            flexDirection: 'column',
            userSelect: 'none',
            overflow: 'hidden'
        }}>
            {/* TOP INDUSTRIAL HEADER BAR */}
            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 20px',
                backgroundColor: '#111622',
                borderBottom: '2px solid #1f293d',
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                flexShrink: 0
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #e5a93c 0%, #c28821 100%)',
                        color: '#000',
                        fontWeight: 900,
                        fontSize: '16px',
                        padding: '5px 12px',
                        borderRadius: '8px',
                        letterSpacing: '1px',
                        boxShadow: '0 0 15px rgba(229, 169, 60, 0.4)'
                    }}>
                        VOG TOUCH TÜNEL
                    </div>
                    
                    {/* Tunnel Mode Badge */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        backgroundColor: isScanning ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        border: `1px solid ${isScanning ? '#10b981' : '#ef4444'}`,
                        color: isScanning ? '#34d399' : '#f87171',
                        fontWeight: 700,
                        fontSize: '12px'
                    }}>
                        <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: isScanning ? '#10b981' : '#ef4444',
                            boxShadow: `0 0 8px ${isScanning ? '#10b981' : '#ef4444'}`,
                            display: 'inline-block'
                        }}></span>
                        {isScanning ? '🟢 CANLI TARAMA AKTİF' : '⏸️ TÜNEL DURAKLATILDI'}
                    </div>
                </div>

                {/* Center / Right Header: Stack Light, Box Count, Audio, Fullscreen Controls & Clock */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* IŞIK KULESİ (STACK LIGHT) GÖSTERGESİ */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)'
                    }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', marginRight: '4px' }}>IŞIK KULESİ:</span>
                        
                        {/* 🔴 Kırmızı (Hata / Hedef Aşımı) */}
                        <span 
                            title="Kırmızı: Hata / Hedef Aşımı"
                            style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                backgroundColor: isOvercount ? '#ef4444' : '#3f1818',
                                boxShadow: isOvercount ? '0 0 10px #ef4444, inset 0 0 3px #fff' : 'none',
                                transition: 'all 0.2s',
                                display: 'inline-block'
                            }}
                        />

                        {/* 🟡 Sarı (Tarama Sürüyor) */}
                        <span 
                            title="Sarı: Canlı Tarama Sürüyor"
                            style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                backgroundColor: (isScanning && !isTargetReached && !isOvercount) ? '#eab308' : '#3d3410',
                                boxShadow: (isScanning && !isTargetReached && !isOvercount) ? '0 0 10px #eab308, inset 0 0 3px #fff' : 'none',
                                transition: 'all 0.2s',
                                display: 'inline-block'
                            }}
                        />

                        {/* 🟢 Yeşil (Koli Eşleşti / Onaylandı) */}
                        <span 
                            title="Yeşil: Hedef Eşleşti / Onaylandı"
                            style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                backgroundColor: isTargetReached ? '#10b981' : '#0d3829',
                                boxShadow: isTargetReached ? '0 0 10px #10b981, inset 0 0 3px #fff' : 'none',
                                transition: 'all 0.2s',
                                display: 'inline-block'
                            }}
                        />
                    </div>

                    {/* 4 Anten Durum Rozeti */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
                        color: '#38bdf8',
                        fontSize: '11px',
                        fontWeight: 800
                    }} title="Tüneldeki 4 adet Impinj/SICK RFID anteni devrede">
                        <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: '#38bdf8',
                            boxShadow: '0 0 8px #38bdf8',
                            display: 'inline-block'
                        }}></span>
                        <span>4/4 ANTEN DEVREDE</span>
                    </div>

                    {/* Koli Sayısı Rozeti (Tıklanabilir - Canlı Koli Sayısı Düzenleme) */}
                    <div 
                        onClick={handleChangeTotalBoxes}
                        title="Toplam Koli Sayısını Değiştirmek İçin Tıklayın"
                        style={{
                            padding: '5px 12px',
                            borderRadius: '8px',
                            backgroundColor: '#1e293b',
                            border: '1px solid #e5a93c',
                            color: '#fbbf24',
                            fontWeight: 800,
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                            transition: 'all 0.2s'
                        }}
                    >
                        <span>📦 Koli: <strong>{session.box_no || 1}</strong> / <strong>{session.total_boxes || 1}</strong></span>
                        <span style={{ fontSize: '10px', color: '#94a3b8' }}>✏️</span>
                    </div>

                    {/* 🖨️ TÜNEL ÇIKIŞI OTOMATİK BASIM KONTROL DÜĞMESİ */}
                    <button
                        onClick={() => handleSetExitAutoPrint(!autoPrintOnExit)}
                        title="Tünelden koli çıktığı anda (2 sn sessizlik) içindeki tüm ürünlerle otomatik Godex koli etiketi basılmasını açar/kapatır"
                        style={{
                            padding: '5px 12px',
                            borderRadius: '8px',
                            backgroundColor: autoPrintOnExit ? 'rgba(16, 185, 129, 0.2)' : '#1e293b',
                            border: `1px solid ${autoPrintOnExit ? '#10b981' : '#475569'}`,
                            color: autoPrintOnExit ? '#34d399' : '#94a3b8',
                            fontWeight: 800,
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: autoPrintOnExit ? '0 0 12px rgba(16, 185, 129, 0.35)' : 'none',
                            transition: 'all 0.2s'
                        }}
                    >
                        <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: autoPrintOnExit ? '#10b981' : '#64748b',
                            boxShadow: autoPrintOnExit ? '0 0 8px #10b981' : 'none',
                            display: 'inline-block'
                        }}></span>
                        <span>🖨️ Koli Çıkışında Basım: <strong>{autoPrintOnExit ? 'AÇIK' : 'KAPALI'}</strong></span>
                    </button>


                    <button
                        onClick={() => {
                            const next = !soundEnabled;
                            setSoundEnabled(next);
                            if (next) playSuccessChime();
                        }}
                        style={{
                            padding: '6px 10px',
                            borderRadius: '8px',
                            border: '1px solid #334155',
                            backgroundColor: soundEnabled ? '#1e293b' : '#3f1818',
                            color: soundEnabled ? '#38bdf8' : '#f87171',
                            fontWeight: 700,
                            fontSize: '12px',
                            cursor: 'pointer'
                        }}
                        title={soundEnabled ? 'Sesleri Kapat' : 'Sesleri Aç'}
                    >
                        {soundEnabled ? '🔊 Ses Açık' : '🔇 Ses Kapalı'}
                    </button>

                    <button
                        onClick={() => playSuccessChime()}
                        style={{
                            padding: '6px 10px',
                            borderRadius: '8px',
                            border: '1px solid #0284c7',
                            backgroundColor: 'rgba(2, 132, 199, 0.15)',
                            color: '#38bdf8',
                            fontWeight: 700,
                            fontSize: '12px',
                            cursor: 'pointer'
                        }}
                        title="Canlı Hoparlör / Melodi Testi Yap"
                    >
                        🎵 Ses Testi
                    </button>

                    <button
                        onClick={toggleFullscreen}
                        style={{
                            padding: '6px 10px',
                            borderRadius: '8px',
                            border: '1px solid #334155',
                            backgroundColor: '#1e293b',
                            color: '#e2e8f0',
                            fontWeight: 700,
                            fontSize: '12px',
                            cursor: 'pointer'
                        }}
                    >
                        {isFullscreen ? '🗗 Pencere' : '⛶ Tam Ekran'}
                    </button>

                    <button
                        onClick={() => setShowHelpModal(true)}
                        style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            border: '1px solid #e5a93c',
                            backgroundColor: 'rgba(229, 169, 60, 0.1)',
                            color: '#e5a93c',
                            fontWeight: '900',
                            fontSize: '16px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 0 10px rgba(229, 169, 60, 0.2)',
                            transition: 'all 0.2s'
                        }}
                        title="Yardım / Düğme Açıklamaları"
                    >
                        ?
                    </button>

                    <div style={{
                        backgroundColor: '#1e293b',
                        padding: '5px 10px',
                        borderRadius: '8px',
                        color: '#f8fafc',
                        fontWeight: 800,
                        fontSize: '14px',
                        letterSpacing: '1px',
                        border: '1px solid #334155'
                    }}>
                        🕒 {currentTime}
                    </div>
                </div>
            </header>


            {/* PERMANENT FIXED-HEIGHT NOTIFICATION & STATUS ROW (SABİT SATIR - HİÇBİR ZAMAN SAYFAYI KAYDIRMAZ) */}
            <div style={{
                height: '28px',
                minHeight: '28px',
                maxHeight: '28px',
                backgroundColor: actionMessage 
                    ? (actionMessage.type === 'success' ? '#064e3b' : (actionMessage.type === 'error' ? '#7f1d1d' : '#1e3a8a'))
                    : '#0a0e17',
                color: actionMessage ? '#ffffff' : '#94a3b8',
                borderBottom: '1px solid #1f293d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.4px',
                padding: '0 20px',
                boxSizing: 'border-box',
                flexShrink: 0,
                transition: 'background-color 0.25s ease, color 0.25s ease'
            }}>
                {actionMessage ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', animation: 'fadeIn 0.2s ease' }}>
                        <span>{actionMessage.type === 'success' ? '✅' : (actionMessage.type === 'error' ? '❌' : 'ℹ️')}</span>
                        <span>{actionMessage.text}</span>
                    </div>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isScanning ? '#10b981' : '#e5a93c', display: 'inline-block' }}></span>
                        <span>{isScanning ? 'Tünel aktif ve hazır — Ürünler geçirildiğinde anında sayılır.' : 'Tünel duraklatıldı — Yeni sipariş seçebilir veya tüneli başlatabilirsiniz.'}</span>
                    </div>
                )}
            </div>



            {/* MAIN KIOSK OPERATOR WORKSPACE */}
            <div style={{
                flex: 1,
                display: 'grid',
                gridTemplateColumns: '1.4fr 1fr',
                gap: '16px',
                padding: '14px',
                boxSizing: 'border-box',
                minHeight: 0,
                overflow: 'hidden'
            }}>
                {/* LEFT COLUMN: HERO COUNTER & ACTIVE ORDER DETAILS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', minHeight: 0 }}>
                    
                    {/* ACTIVE ORDER CARD */}
                    <div style={{
                        backgroundColor: '#111622',
                        borderRadius: '14px',
                        border: '2px solid #1f293d',
                        padding: '14px 18px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                        flexShrink: 0
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{
                                    backgroundColor: session.session_type === 'PERSONNEL' ? '#38bdf8' : '#e5a93c',
                                    color: '#000',
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    fontWeight: 900,
                                    fontSize: '12px'
                                }}>
                                    {session.brand || 'MARKA YOK'}
                                </span>
                                <div style={{ margin: 0, fontSize: '18px', color: '#f8fafc', fontWeight: 800 }}>
                                    {session.session_type === 'PERSONNEL'
                                        ? `👤 Koli #${session.box_no || 1}: ${session.staff_name || 'Personel'} (${session.service_center || ''})`
                                        : (session.order_number ? `Sipariş #${session.order_number}` : 'Lütfen Bir Sipariş / Personel Seçin')}
                                </div>
                            </div>

                            <button
                                onClick={handleOpenOrderModal}
                                style={{
                                    backgroundColor: session.session_type === 'PERSONNEL' ? '#0284c7' : '#2563eb',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    fontWeight: 800,
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)'
                                }}
                            >
                                {session.session_type === 'PERSONNEL' ? '👤 PERSONEL / MARKA DEĞİŞTİR' : '📦 SİPARİŞ DEĞİŞTİR / SEÇ'}
                            </button>
                        </div>

                        {session.session_type === 'PERSONNEL' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {/* PERSONNEL ACTIVE METADATA */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1.2fr 1fr 1fr',
                                    gap: '10px',
                                    backgroundColor: '#0f172a',
                                    padding: '10px 14px',
                                    borderRadius: '10px',
                                    border: '1px solid #1e293b'
                                }}>
                                    <div>
                                        <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Personel & Departman</div>
                                        <div style={{ fontSize: '14px', color: '#f1f5f9', fontWeight: 900, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            👤 {session.staff_name || '-'}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#38bdf8', marginTop: '2px', fontWeight: 700 }}>
                                            🏢 {session.department || '-'}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Bayi / Lokasyon</div>
                                        <div style={{ fontSize: '13px', color: '#fbbf24', fontWeight: 800, marginTop: '2px' }}>
                                            📍 {session.service_center || session.sub_customer_name || '-'}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px', fontFamily: 'monospace' }}>
                                            Barkod: <strong style={{ color: '#fff' }}>{session.box_barcode || `KOLI-${session.box_no}`}</strong>
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Koli & Hedef Adet</div>
                                        <div style={{ fontSize: '13px', color: '#34d399', fontWeight: 900, marginTop: '2px' }}>
                                            📦 Koli {session.box_no || 1} / {session.total_boxes || 1}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                                            Hedef: <strong>{session.target_quantity || 7} Parça</strong>
                                        </div>
                                    </div>
                                </div>

                                {/* QUICK STEPPER & JUMP CONTROLS */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    backgroundColor: '#161e2e',
                                    padding: '8px 14px',
                                    borderRadius: '10px',
                                    border: '1px solid #283548'
                                }}>
                                    <button
                                        onClick={() => handleSwitchPersonnelBox((session.box_no || 1) - 1)}
                                        disabled={(session.box_no || 1) <= 1}
                                        style={{
                                            backgroundColor: (session.box_no || 1) <= 1 ? '#1e293b' : '#334155',
                                            color: (session.box_no || 1) <= 1 ? '#64748b' : '#f8fafc',
                                            border: 'none',
                                            padding: '8px 16px',
                                            borderRadius: '8px',
                                            fontWeight: 800,
                                            fontSize: '12px',
                                            cursor: (session.box_no || 1) <= 1 ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}
                                    >
                                        ◀ Önceki Koli
                                    </button>

                                    <form onSubmit={handleJumpBox} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 700 }}>Koliye Git:</span>
                                        <input
                                            type="number"
                                            min="1"
                                            max={session.total_boxes || 9999}
                                            placeholder={`1..${session.total_boxes || 1}`}
                                            value={jumpBoxInput}
                                            onChange={(e) => setJumpBoxInput(e.target.value)}
                                            style={{
                                                width: '75px',
                                                backgroundColor: '#0a0d14',
                                                border: '1px solid #475569',
                                                borderRadius: '6px',
                                                padding: '6px 8px',
                                                color: '#38bdf8',
                                                fontWeight: 800,
                                                fontSize: '13px',
                                                textAlign: 'center'
                                            }}
                                        />
                                        <button
                                            type="submit"
                                            style={{
                                                backgroundColor: '#0284c7',
                                                color: '#fff',
                                                border: 'none',
                                                padding: '6px 12px',
                                                borderRadius: '6px',
                                                fontWeight: 800,
                                                fontSize: '12px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Git ➔
                                        </button>
                                    </form>

                                    <button
                                        onClick={() => handleSwitchPersonnelBox((session.box_no || 1) + 1)}
                                        disabled={(session.box_no || 1) >= (session.total_boxes || 1)}
                                        style={{
                                            backgroundColor: (session.box_no || 1) >= (session.total_boxes || 1) ? '#1e293b' : '#2563eb',
                                            color: (session.box_no || 1) >= (session.total_boxes || 1) ? '#64748b' : '#fff',
                                            border: 'none',
                                            padding: '8px 16px',
                                            borderRadius: '8px',
                                            fontWeight: 800,
                                            fontSize: '12px',
                                            cursor: (session.box_no || 1) >= (session.total_boxes || 1) ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}
                                    >
                                        Sonraki Koli ▶
                                    </button>
                                </div>
                            </div>
                        ) : (session.order_number ? (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1.2fr 1fr 1fr',
                                gap: '10px',
                                backgroundColor: '#0f172a',
                                padding: '10px 14px',
                                borderRadius: '10px',
                                border: '1px solid #1e293b'
                            }}>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Model / Müşteri</div>
                                    <div style={{ fontSize: '13px', color: '#f1f5f9', fontWeight: 800, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {session.product_name || '-'}
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>
                                        {session.sub_customer_name || '-'}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Koli / Toplam Hedef</div>
                                    <div style={{ fontSize: '13px', color: '#38bdf8', fontWeight: 800, marginTop: '2px' }}>
                                        📦 Bu Koli: <strong>{session.target_quantity || 0} Adet</strong>
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>
                                        Koli Sırası: <strong>{session.box_no || 1} / {session.total_boxes || 1}</strong>
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Sipariş Kalanı</div>
                                    <div style={{ fontSize: '13px', color: '#34d399', fontWeight: 900, marginTop: '2px' }}>
                                        Kalan: <strong>{session.remaining_order_quantity !== undefined ? session.remaining_order_quantity : (session.target_quantity || 0)} Adet</strong>
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>
                                        Toplam: {session.total_order_quantity || session.target_quantity || 0} Adet
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div style={{
                                textAlign: 'center',
                                padding: '16px',
                                color: '#94a3b8',
                                fontSize: '14px'
                            }}>
                                👈 Tünel okumasına başlamak için sağ üstteki <strong>"Sipariş / Personel Seç"</strong> butonuna dokunun.
                            </div>
                        ))}

                    </div>

                    {/* 4 TÜNEL ANTENİ CANLI RF VE PORT MONİTÖRÜ */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '8px',
                        flexShrink: 0
                    }}>
                        {antennas.map((ant) => {
                            const isRecent = ant.last_seen && (Date.now() - new Date(ant.last_seen).getTime()) < 3000;
                            const portColors = {
                                1: { border: '#3b82f6', glow: 'rgba(59, 130, 246, 0.4)', text: '#60a5fa' },
                                2: { border: '#10b981', glow: 'rgba(16, 185, 129, 0.4)', text: '#34d399' },
                                3: { border: '#f97316', glow: 'rgba(249, 115, 22, 0.4)', text: '#fb923c' },
                                4: { border: '#a855f7', glow: 'rgba(168, 85, 247, 0.4)', text: '#c084fc' }
                            };
                            const c = portColors[ant.port] || portColors[1];
                            return (
                                <div key={ant.port} style={{
                                    backgroundColor: '#111622',
                                    borderRadius: '10px',
                                    border: isRecent ? `2px solid ${c.border}` : '1px solid #1f293d',
                                    padding: '7px 10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    boxShadow: isRecent ? `0 0 14px ${c.glow}` : 'none',
                                    transition: 'all 0.25s ease'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{
                                            width: '9px',
                                            height: '9px',
                                            borderRadius: '50%',
                                            backgroundColor: isRecent ? c.border : (ant.active ? '#10b981' : '#64748b'),
                                            boxShadow: isRecent ? `0 0 10px ${c.border}` : (ant.active ? '0 0 6px #10b981' : 'none')
                                        }} />
                                        <div>
                                            <div style={{ fontSize: '11px', fontWeight: 800, color: '#f8fafc' }}>
                                                Anten {ant.port}
                                            </div>
                                            <div style={{ fontSize: '9px', color: c.text, fontWeight: 700 }}>
                                                {ant.port === 1 ? 'Üst Sol' : (ant.port === 2 ? 'Üst Sağ' : (ant.port === 3 ? 'Alt Sol' : 'Alt Sağ'))}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '14px', fontWeight: 900, color: ant.count > 0 ? '#e5a93c' : '#64748b' }}>
                                            {ant.count || 0}
                                        </div>
                                        <div style={{ fontSize: '9px', color: isRecent ? c.text : '#64748b', fontWeight: isRecent ? 800 : 500 }}>
                                            {isRecent ? '📡 RF SİNYAL' : 'adet'}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* GIANT TOUCH COUNTER DISPLAY */}
                    <div style={{
                        flex: 1,
                        backgroundColor: '#111622',
                        borderRadius: '16px',
                        border: isOvercount
                            ? '3px solid #ef4444'
                            : (isTargetReached ? '3px solid #10b981' : '2px solid #1f293d'),
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        position: 'relative',
                        boxShadow: isTargetReached
                            ? '0 0 35px rgba(16, 185, 129, 0.3)'
                            : (isOvercount ? '0 0 35px rgba(239, 68, 68, 0.3)' : 'none'),
                        minHeight: 0
                    }}>
                        {/* Status Label Banner */}
                        <div style={{
                            padding: '6px 20px',
                            borderRadius: '30px',
                            fontWeight: 800,
                            fontSize: '14px',
                            letterSpacing: '1px',
                            backgroundColor: (session.status === 'ALARM' || session.is_alarm || session.foreign_quantity > 0 || isOvercount)
                                ? '#7f1d1d'
                                : (session.is_fully_verified || isTargetReached 
                                    ? '#064e3b' 
                                    : (session.scanned_quantity > 0 ? '#1e3a8a' : '#1e293b')),
                            color: (session.status === 'ALARM' || session.is_alarm || session.foreign_quantity > 0 || isOvercount)
                                ? '#fca5a5' 
                                : (session.is_fully_verified || isTargetReached 
                                    ? '#6ee7b7' 
                                    : (session.scanned_quantity > 0 ? '#93c5fd' : '#94a3b8')),
                            border: `1px solid ${(session.status === 'ALARM' || session.is_alarm || session.foreign_quantity > 0 || isOvercount) ? '#ef4444' : ((session.is_fully_verified || isTargetReached) ? '#10b981' : (session.scanned_quantity > 0 ? '#3b82f6' : '#334155'))}`
                        }}>
                            {(session.status === 'ALARM' || session.is_alarm) ? (
                                `🚨 TÜNEL ALARMI: ${session.alarm_info?.message || 'KOLİDE UYUMSUZLUK TESPİT EDİLDİ — AKIŞ VE PALET DURDURULDU!'}`
                            ) : session.is_verification_mode ? (
                                session.foreign_quantity > 0
                                    ? `❌ DİKKAT: ${session.foreign_quantity} ADET YABANCI / HATALI ÜRÜN BULUNDU!`
                                    : (session.is_fully_verified
                                        ? `✅ %100 DOĞRULANDI! (KOLİ ${session.box_no} TAM — ${session.expected_quantity} ADET)`
                                        : (session.scanned_quantity > 0
                                            ? `🔍 DOĞRULAMA: ${session.matched_quantity || session.scanned_quantity}/${session.expected_quantity} (${session.missing_quantity} EKSİK BEKLENİYOR)`
                                            : (isScanning ? '📦 TÜNELDEN GEÇİŞ VE DOĞRULAMA BEKLENİYOR...' : '⏸️ DURAKLATILDI')))
                            ) : (
                                session.foreign_quantity > 0
                                    ? `❌ DİKKAT: ${session.foreign_quantity} ADET YABANCI / FARKLI MARKA ETİKETİ TESPİT EDİLDİ!`
                                    : (session.scanned_quantity > session.target_quantity
                                        ? `⚠️ FAZLA ÜRÜN OKUNDU! (+${session.scanned_quantity - session.target_quantity} ADET FAZLA)`
                                        : (isTargetReached
                                            ? `✨ HEDEF ADEDE ULAŞILDI! (KOLİ TAM - ${session.target_quantity} ADET)`
                                            : (session.scanned_quantity > 0
                                                ? `⚡ CANLI SAYIM: ${session.scanned_quantity} ADET OKUNDU (${Math.max(0, session.target_quantity - session.scanned_quantity)} BEKLENİYOR)`
                                                : (isScanning ? '📦 TÜNELDEN GEÇİŞ BEKLENİYOR...' : '⏸️ DURAKLATILDI'))))
                            )}
                        </div>

                        {/* GIANT DIGITS */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'baseline',
                            gap: '16px',
                            margin: '8px 0',
                            padding: '10px 32px',
                            backgroundColor: 'rgba(15, 23, 42, 0.8)',
                            borderRadius: '16px',
                            border: '2px solid #1e293b',
                            boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)'
                        }}>
                            <span style={{
                                fontSize: '118px',
                                lineHeight: '1',
                                fontWeight: 900,
                                fontFamily: 'monospace',
                                color: (session.foreign_quantity > 0 || isOvercount) ? '#f87171' : ((session.is_fully_verified || isTargetReached) ? '#34d399' : '#fbbf24'),
                                textShadow: (session.is_fully_verified || isTargetReached) ? '0 0 35px rgba(52, 211, 153, 0.7)' : '0 0 35px rgba(251, 191, 36, 0.5)'
                            }}>
                                {session.is_verification_mode ? (session.matched_quantity || session.scanned_quantity) : session.scanned_quantity}
                            </span>
                            <span style={{ fontSize: '64px', color: '#64748b', fontWeight: 300 }}>/</span>
                            <span 
                                onClick={handleChangeTarget}
                                title="Hedef adedi değiştirmek için tıklayın"
                                style={{ 
                                    fontSize: '76px', 
                                    lineHeight: '1',
                                    color: '#f1f5f9', 
                                    fontWeight: 900,
                                    cursor: 'pointer',
                                    borderBottom: '3px dashed #475569',
                                    paddingBottom: '2px'
                                }}>
                                {session.is_verification_mode ? (session.expected_quantity || session.target_quantity) : session.target_quantity}
                            </span>
                            <span style={{ fontSize: '22px', color: '#94a3b8', fontWeight: 800 }}>
                                {session.is_verification_mode ? 'DOĞRULANAN' : 'ADET'}
                            </span>
                        </div>






                        {/* PROGRESS BAR */}
                        <div style={{ width: '100%', marginBottom: '14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#94a3b8', fontWeight: 700 }}>
                                <span>İLERLEME DURUMU</span>
                                <span style={{ color: isTargetReached ? '#34d399' : '#e5a93c' }}>
                                    %{session.progress_percent}
                                </span>
                            </div>
                            <div style={{
                                width: '100%',
                                height: '20px',
                                backgroundColor: '#0f172a',
                                borderRadius: '10px',
                                overflow: 'hidden',
                                border: '1px solid #1e293b'
                            }}>
                                <div style={{
                                    height: '100%',
                                    width: `${Math.min(100, session.progress_percent)}%`,
                                    backgroundColor: isOvercount ? '#ef4444' : (isTargetReached ? '#10b981' : '#e5a93c'),
                                    transition: 'width 0.3s ease',
                                    borderRadius: '10px'
                                }}></div>
                            </div>
                        </div>

                        {/* PERSONNEL BUNDLE CHECKLIST OR BEDEN / SİZE DAĞILIMI ÖZETİ */}
                        {session.session_type === 'PERSONNEL' && session.bundle_items && Array.isArray(session.bundle_items) && session.bundle_items.length > 0 ? (
                            <div style={{ width: '100%', marginTop: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '0 4px' }}>
                                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.5px' }}>
                                        👤 {session.staff_name || 'Personel'} — {session.target_quantity || 7} PARÇA PAKET İÇERİĞİ
                                    </span>
                                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                                        Okunan: <strong style={{ color: session.scanned_quantity === session.target_quantity ? '#34d399' : '#e5a93c' }}>{session.scanned_quantity}/{session.target_quantity}</strong>
                                    </span>
                                </div>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                                    gap: '8px',
                                    maxHeight: '135px',
                                    overflowY: 'auto'
                                }}>
                                    {session.bundle_items.map((item, idx) => {
                                        const isItemScanned = !!item.is_scanned;
                                        return (
                                            <div key={item.id || idx} style={{
                                                backgroundColor: isItemScanned ? 'rgba(16, 185, 129, 0.2)' : '#161e2e',
                                                border: `1.5px solid ${isItemScanned ? '#10b981' : '#283548'}`,
                                                borderRadius: '10px',
                                                padding: '8px 10px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '3px',
                                                boxShadow: isItemScanned ? '0 0 12px rgba(16, 185, 129, 0.3)' : 'none',
                                                transition: 'all 0.2s ease'
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '12px', fontWeight: 800, color: isItemScanned ? '#34d399' : '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {item.short_name || item.name}
                                                    </span>
                                                    <span style={{
                                                        fontSize: '11px',
                                                        fontWeight: 900,
                                                        color: isItemScanned ? '#34d399' : '#64748b'
                                                    }}>
                                                        {isItemScanned ? '✓ OK' : '⏳ 1'}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8' }}>
                                                    <span>Beden: <strong style={{ color: '#e5a93c' }}>{item.size || 'STD'}</strong></span>
                                                    {item.part_no && (
                                                        <span style={{ fontFamily: 'monospace', fontSize: '9px', opacity: 0.8 }}>
                                                            {String(item.part_no).slice(-6)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : session.box_plan && Array.isArray(session.box_plan) && session.box_plan.length > 0 ? (
                            <div style={{ width: '100%', marginTop: '10px' }}>
                                <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textAlign: 'center', marginBottom: '6px', letterSpacing: '0.5px' }}>
                                    📦 KOLİ İÇERİK PLANI & BEDEN SAYIMI
                                </div>
                                <div style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '8px',
                                    justifyContent: 'center'
                                }}>
                                    {session.box_plan.map(p => {
                                        const sz = p.size;
                                        const target = p.quantity || p.target_quantity || 0;
                                        const scanned = (session.items_breakdown && session.items_breakdown[sz]) || 0;
                                        const isMatch = scanned === target && target > 0;
                                        const isOver = scanned > target;
                                        return (
                                            <div key={sz} style={{
                                                backgroundColor: isOver ? '#7f1d1d' : (isMatch ? '#064e3b' : '#1e293b'),
                                                padding: '6px 14px',
                                                borderRadius: '8px',
                                                fontSize: '13px',
                                                border: `1px solid ${isOver ? '#ef4444' : (isMatch ? '#10b981' : '#334155')}`,
                                                color: isOver ? '#fca5a5' : (isMatch ? '#6ee7b7' : '#f8fafc'),
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                boxShadow: isMatch ? '0 0 10px rgba(16,185,129,0.3)' : 'none'
                                            }}>
                                                <strong style={{ color: isMatch ? '#34d399' : '#e5a93c' }}>{sz}:</strong>
                                                <span style={{ fontWeight: 800 }}>{scanned} / {target} Adet</span>
                                                {isMatch && <span>✓</span>}
                                                {isOver && <span>⚠️</span>}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (session.items_breakdown && Object.keys(session.items_breakdown).length > 0 && (
                            <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '8px',
                                justifyContent: 'center',
                                marginTop: '10px'
                            }}>
                                {Object.entries(session.items_breakdown).map(([size, count]) => (
                                    <div key={size} style={{
                                        backgroundColor: '#1e293b',
                                        padding: '4px 12px',
                                        borderRadius: '8px',
                                        fontSize: '13px',
                                        border: '1px solid #334155'
                                    }}>
                                        <strong style={{ color: '#e5a93c' }}>{size}:</strong> {count} Adet
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT COLUMN: BIG TOUCH ACTIONS & LIVE RFID STREAM */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* Tünel & Okuma Ayarları Card */}
                    <div style={{
                        backgroundColor: '#111622',
                        borderRadius: '16px',
                        border: '2px solid #1f293d',
                        padding: '18px',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '14px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '15px', color: '#f8fafc', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                📡 Tünel & Sensör Ayarları
                            </h3>
                            
                            {/* Connection status */}
                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                backgroundColor: driverStatus.remote_connected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                border: `1px solid ${driverStatus.remote_connected ? '#10b981' : '#ef4444'}`,
                                color: driverStatus.remote_connected ? '#34d399' : '#f87171',
                                fontSize: '11px',
                                fontWeight: 800
                            }}>
                                <span style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    backgroundColor: driverStatus.remote_connected ? '#10b981' : '#ef4444',
                                    display: 'inline-block'
                                }}></span>
                                {driverStatus.remote_connected ? 'BAĞLI' : 'BAĞLANTI YOK'}
                            </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                            {/* Power Slider */}
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px',
                                padding: '10px 14px',
                                borderRadius: '10px',
                                backgroundColor: '#1e293b',
                                border: '1px solid #334155'
                            }}>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8' }}>📶 Anten Gücü (Menzil):</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input
                                        type="range"
                                        min="10.0"
                                        max="30.0"
                                        step="1.0"
                                        value={readerPower}
                                        onChange={handlePowerChange}
                                        style={{
                                            flex: 1,
                                            accentColor: '#f59e0b',
                                            cursor: 'pointer'
                                        }}
                                    />
                                    <strong style={{ fontSize: '13px', color: '#f59e0b', fontWeight: 900, minWidth: '45px', textAlign: 'right' }}>
                                        {readerPower.toFixed(0)} dBm
                                    </strong>
                                </div>
                                <span style={{ fontSize: '10px', color: '#64748b' }}>
                                    {readerPower <= 15 ? '🔋 Düşük Menzil (Sadece Tünel)' : (readerPower <= 25 ? '⚡ Orta Menzil' : '🔥 Maksimum Güç')}
                                </span>
                            </div>

                            {/* Distance Slider */}
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px',
                                padding: '10px 14px',
                                borderRadius: '10px',
                                backgroundColor: '#1e293b',
                                border: '1px solid #334155'
                            }}>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8' }}>🎯 Okuma Filtresi (Mesafe):</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input
                                        type="range"
                                        min="10"
                                        max="100"
                                        step="5"
                                        value={Math.round(100 - (rssiThreshold + 80) * 2)}
                                        onChange={(e) => {
                                            const p = parseInt(e.target.value);
                                            const dbm = Math.round(-80 + (100 - p) * 0.5);
                                            handleRssiChange({ target: { value: dbm } });
                                        }}
                                        style={{
                                            flex: 1,
                                            accentColor: '#f43f5e',
                                            cursor: 'pointer'
                                        }}
                                    />
                                    <strong style={{ fontSize: '13px', color: '#f43f5e', fontWeight: 900, minWidth: '35px', textAlign: 'right' }}>
                                        %{Math.round(100 - (rssiThreshold + 80) * 2)}
                                    </strong>
                                </div>
                                <span style={{ fontSize: '10px', color: '#64748b' }}>
                                    {rssiThreshold >= -45 ? '🎯 Dar Menzil (Yakın Nesneler)' : (rssiThreshold >= -65 ? '⚡ Orta Hassasiyet' : '🌐 Geniş Menzil (Uzak)')}
                                </span>
                            </div>

                            {/* Koli Etiketi Basım Modu (Otomatik vs Manuel) */}
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                                padding: '12px 14px',
                                borderRadius: '12px',
                                backgroundColor: '#1e293b',
                                border: '1.5px solid ' + (autoComplete ? '#10b981' : '#38bdf8'),
                                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        🏷️ Koli Etiketi Basım Modu:
                                    </span>
                                    <span style={{
                                        fontSize: '11px',
                                        fontWeight: 900,
                                        padding: '2px 8px',
                                        borderRadius: '6px',
                                        backgroundColor: autoComplete ? 'rgba(16,185,129,0.2)' : 'rgba(56,189,248,0.2)',
                                        color: autoComplete ? '#10b981' : '#38bdf8',
                                        border: '1px solid ' + (autoComplete ? '#10b981' : '#38bdf8')
                                    }}>
                                        {autoComplete ? '⚡ OTOMATİK' : '✋ MANUEL'}
                                    </span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                    <button
                                        type="button"
                                        onClick={() => handleSetPrintMode(true)}
                                        style={{
                                            padding: '8px 10px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            backgroundColor: autoComplete ? '#10b981' : 'rgba(255,255,255,0.06)',
                                            color: autoComplete ? '#ffffff' : '#94a3b8',
                                            fontWeight: 800,
                                            fontSize: '11px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '4px',
                                            transition: '0.2s'
                                        }}
                                    >
                                        🟢 {session.target_quantity || 7}/{session.target_quantity || 7}'de Otomatik Bas
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleSetPrintMode(false)}
                                        style={{
                                            padding: '8px 10px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            backgroundColor: !autoComplete ? '#0284c7' : 'rgba(255,255,255,0.06)',
                                            color: !autoComplete ? '#ffffff' : '#94a3b8',
                                            fontWeight: 800,
                                            fontSize: '11px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '4px',
                                            transition: '0.2s'
                                        }}
                                    >
                                        🔵 Manuel (Butonla Bas)
                                    </button>
                                </div>
                                <div style={{ fontSize: '10px', color: '#94a3b8', lineHeight: '1.3' }}>
                                    {autoComplete 
                                        ? `✨ Hedef adede (${session.target_quantity || 7}/${session.target_quantity || 7}) ulaşıldığında koli etiketi otomatik basılır ve sıradaki koliye geçilir.`
                                        : `⚡ Otomatik koli etiketi yazdırma KAPALI: Koli tamamlandığında sıradaki koliye OTOMATİK geçilir (Etiket basılmaz, istendiğinde butonla basılır).`}
                                </div>
                            </div>

                            {/* Canlı Cihaz Telemetrisi & Sağlık İzleme */}
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                                padding: '12px 14px',
                                borderRadius: '10px',
                                backgroundColor: '#0f172a',
                                border: '1px solid #1e293b'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        📡 Cihaz Sağlığı & Telemetri
                                    </span>
                                    <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span style={{ width: '6px', height: '6px', backgroundColor: '#10b981', borderRadius: '50%', display: 'inline-block' }}></span>
                                        CANLI
                                    </span>
                                </div>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '4px' }}>
                                    {/* Sıcaklık */}
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        padding: '6px',
                                        backgroundColor: '#1e293b',
                                        borderRadius: '8px',
                                        border: '1px solid #334155'
                                    }}>
                                        <span style={{ fontSize: '10px', color: '#94a3b8' }}>🌡️ Sıcaklık</span>
                                        <strong style={{ fontSize: '13px', color: telemetry.temperature > 50 ? '#f43f5e' : '#10b981', marginTop: '2px' }}>
                                            {telemetry.temperature}°C
                                        </strong>
                                    </div>
                                    
                                    {/* CPU Yükü */}
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        padding: '6px',
                                        backgroundColor: '#1e293b',
                                        borderRadius: '8px',
                                        border: '1px solid #334155'
                                    }}>
                                        <span style={{ fontSize: '10px', color: '#94a3b8' }}>📊 CPU</span>
                                        <strong style={{ fontSize: '13px', color: '#3b82f6', marginTop: '2px' }}>
                                            %{telemetry.cpu}
                                        </strong>
                                    </div>
                                    
                                    {/* Latency / Ping */}
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        padding: '6px',
                                        backgroundColor: '#1e293b',
                                        borderRadius: '8px',
                                        border: '1px solid #334155'
                                    }}>
                                        <span style={{ fontSize: '10px', color: '#94a3b8' }}>⚡ Gecikme</span>
                                        <strong style={{ fontSize: '13px', color: '#f59e0b', marginTop: '2px' }}>
                                            {telemetry.ping} ms
                                        </strong>
                                    </div>
                                </div>
                            </div>

                            {/* LOGO ERP İrsaliye Kaydı Modu */}
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                                padding: '12px 14px',
                                borderRadius: '12px',
                                backgroundColor: '#1e293b',
                                border: '1.5px solid ' + (syncToLogo ? '#10b981' : '#64748b'),
                                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        💼 LOGO ERP İrsaliye Kaydı:
                                    </span>
                                    <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '40px', height: '22px' }}>
                                        <input type="checkbox" checked={syncToLogo} onChange={(e) => setSyncToLogo(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                                        <span className="slider round" style={{ 
                                            position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, 
                                            backgroundColor: syncToLogo ? '#10b981' : '#475569', 
                                            transition: '.4s', borderRadius: '34px' 
                                        }}>
                                            <span style={{
                                                position: 'absolute', content: '""', height: '16px', width: '16px', left: '3px', bottom: '3px',
                                                backgroundColor: 'white', transition: '.4s', borderRadius: '50%',
                                                transform: syncToLogo ? 'translateX(18px)' : 'translateX(0)'
                                            }}></span>
                                        </span>
                                    </label>
                                </div>
                                <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                                    {syncToLogo ? '✅ Kolilendiğinde Logo ERP canlı satış irsaliyesi kesilir.' : '❌ ERP İrsaliye Kaydı KAPALI. Sadece etiket basılır.'}
                                </span>
                            </div>

                        </div>

                        {/* Antenleri Ateşle Button inside settings card */}
                        <button
                            onClick={triggerImpinjManual}
                            style={{
                                padding: '12px',
                                borderRadius: '10px',
                                border: 'none',
                                background: isScanning ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                color: '#fff',
                                fontWeight: 800,
                                fontSize: '13px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                boxShadow: isScanning ? '0 4px 14px rgba(16, 185, 129, 0.3)' : '0 4px 14px rgba(37, 99, 235, 0.3)'
                            }}
                        >
                            ⚡ {isScanning ? 'TÜNEL TARAMASI AKTİF (DURDUR)' : 'ANTENLERİ ATEŞLE (TARAMAYI BAŞLAT)'}
                        </button>
                    </div>

                    {/* TOUCH ACTION BUTTONS GRID */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                    }}>
                        {/* COMPLETE BOX & PRINT (GIANT BUTTON) */}
                        <button
                            onClick={
                                session.status === 'COMPLETED'
                                    ? handleOpenOrderModal
                                    : (session.status === 'BOX_COMPLETED'
                                        ? handleStartNextBox
                                        : (session.status === 'PAUSED'
                                            ? handlePauseSession
                                            : handleCompleteBox))
                            }
                            disabled={session.status !== 'COMPLETED' && session.status !== 'BOX_COMPLETED' && session.status !== 'PAUSED' && session.scanned_quantity === 0}
                            style={{
                                width: '100%',
                                padding: '20px',
                                borderRadius: '14px',
                                border: 'none',
                                background: session.status === 'COMPLETED'
                                    ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
                                    : (session.status === 'BOX_COMPLETED'
                                        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                        : (session.status === 'PAUSED'
                                            ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                                            : (session.scanned_quantity > 0
                                                ? (isTargetReached ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #e5a93c 0%, #c28821 100%)')
                                                : '#334155'))),
                                color: (session.status === 'COMPLETED' || session.status === 'BOX_COMPLETED' || session.status === 'PAUSED' || session.scanned_quantity > 0) ? '#fff' : '#94a3b8',
                                fontWeight: 900,
                                fontSize: '18px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '12px',
                                boxShadow: isTargetReached ? '0 0 25px rgba(16,185,129,0.5)' : '0 6px 20px rgba(0,0,0,0.3)',
                                transition: 'all 0.2s',
                                animation: isTargetReached ? 'pulse 2s infinite' : 'none'
                            }}
                        >
                            {session.status === 'COMPLETED'
                                ? '🎉 TÜM KOLİLER BİTTİ — YENİ SİPARİŞ / PERSONEL SEÇİN 📦'
                                : (session.status === 'BOX_COMPLETED'
                                    ? (session.session_type === 'PERSONNEL'
                                        ? `▶️ ${session.box_no}. KOLİYİ BAŞLAT (${session.staff_name || 'Personel'}) 👤`
                                        : `▶️ ${session.box_no}. KOLİYİ BAŞLAT (${session.box_no}/${session.total_boxes || 1}) 📦`)
                                    : (session.status === 'PAUSED'
                                        ? '▶️ Tünel Duraklatıldı — Devam Et'
                                        : (session.session_type === 'PERSONNEL'
                                            ? (isTargetReached
                                                ? `✨ ${session.staff_name || 'PERSONEL'} KOLİSİ TAMAM (${session.scanned_quantity}/${session.target_quantity}) — 🏷️ ETİKET BAS & SIRADAKİNE GEÇ ➔`
                                                : `🏷️ KOLİYİ TAMAMLA & SIRADAKİNE GEÇ (#${session.box_no || 1}) ➔`)
                                            : (isTargetReached
                                                ? `✨ HEDEF TAMAM (${session.scanned_quantity}/${session.target_quantity}) — 🏷️ KOLİ ETİKETİNİ BAS & BİTİR 📦`
                                                : '🏷️ KOLİYİ TAMAMLA & ETİKET BAS (PRINT)'))))}
                        </button>

                        {/* DIRECT MANUAL SATO/GODEX PRINT BUTTON */}
                        <button
                            onClick={handleManualPrintCurrentBox}
                            disabled={!session.order_number && !session.order_id}
                            style={{
                                width: '100%',
                                padding: '14px',
                                borderRadius: '12px',
                                border: '1.5px solid #0284c7',
                                backgroundColor: 'rgba(2, 132, 199, 0.15)',
                                color: '#38bdf8',
                                fontWeight: 800,
                                fontSize: '14px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                transition: '0.2s'
                            }}
                            onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(2, 132, 199, 0.3)'}
                            onMouseOut={e => e.currentTarget.style.backgroundColor = 'rgba(2, 132, 199, 0.15)'}
                        >
                            🖨️ Koli Etiketini Yazdır (SATO / Godex Manuel Baskı)
                        </button>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                            {/* PAUSE / RESUME */}
                            <button
                                onClick={handlePauseSession}
                                style={{
                                    padding: '14px',
                                    borderRadius: '12px',
                                    border: '1px solid #334155',
                                    backgroundColor: isScanning ? '#1e293b' : '#064e3b',
                                    color: isScanning ? '#e2e8f0' : '#34d399',
                                    fontWeight: 800,
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                            >
                                {isScanning ? '⏸️ Tüneli Duraklat' : '▶️ Tüneli Başlat / Devam Et'}
                            </button>

                            {/* RESET SESSION */}
                            <button
                                onClick={handleResetSession}
                                style={{
                                    padding: '14px',
                                    borderRadius: '12px',
                                    border: '1px solid #334155',
                                    backgroundColor: '#1e293b',
                                    color: '#f87171',
                                    fontWeight: 800,
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                            >
                                🔄 Koliyi Sıfırla
                            </button>
                        </div>

                        {/* MANUAL BARCODE INPUT */}
                        <button
                            onClick={() => setIsManualModalOpen(true)}
                            style={{
                                gridColumn: 'span 2',
                                padding: '14px',
                                borderRadius: '12px',
                                border: '1px solid #334155',
                                backgroundColor: '#0f172a',
                                color: '#38bdf8',
                                fontWeight: 800,
                                fontSize: '14px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            ⌨️ Manuel Barkod / EPC Girişi
                        </button>
                    </div>

                    {/* LIVE RFID STREAM LOG CARD */}
                    <div style={{
                        flex: 1,
                        backgroundColor: '#111622',
                        borderRadius: '16px',
                        border: '2px solid #1f293d',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '12px',
                            borderBottom: '1px solid #1f293d',
                            paddingBottom: '8px'
                        }}>
                            <h3 style={{ margin: 0, fontSize: '15px', color: '#f8fafc', fontWeight: 800 }}>
                                📡 CANLI OKUNAN ETİKETLER (STREAM)
                            </h3>
                            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                                Toplam: <strong style={{ color: '#e5a93c' }}>{session.tags_count || 0}</strong> Kayıt
                            </span>
                        </div>

                        {/* TAGS LIST */}
                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                            maxHeight: '380px'
                        }}>
                            {session.tags && session.tags.length > 0 ? (
                                session.tags.slice().reverse().map((t, idx) => {
                                    const antPort = t.antenna || 1;
                                    const antBadgeColors = {
                                        1: { bg: '#1e3a8a', text: '#93c5fd', border: 'rgba(59, 130, 246, 0.4)' },
                                        2: { bg: '#065f46', text: '#6ee7b7', border: 'rgba(16, 185, 129, 0.4)' },
                                        3: { bg: '#7c2d12', text: '#fdba74', border: 'rgba(249, 115, 22, 0.4)' },
                                        4: { bg: '#581c87', text: '#f0abfc', border: 'rgba(168, 85, 247, 0.4)' }
                                    };
                                    const b = antBadgeColors[antPort] || antBadgeColors[1];
                                    const timeStr = t.timestamp || t.last_seen ? new Date(t.timestamp || t.last_seen).toLocaleTimeString('tr-TR') : '-';
                                    return (
                                        <div key={idx} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            backgroundColor: t.is_excess ? 'rgba(239, 68, 68, 0.15)' : '#0f172a',
                                            border: `1px solid ${t.is_excess ? '#ef4444' : '#1e293b'}`,
                                            padding: '8px 12px',
                                            borderRadius: '8px',
                                            fontSize: '12px',
                                            fontFamily: 'monospace'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{
                                                    padding: '2px 6px',
                                                    borderRadius: '4px',
                                                    fontSize: '10px',
                                                    fontWeight: 800,
                                                    backgroundColor: b.bg,
                                                    color: b.text,
                                                    border: `1px solid ${b.border}`
                                                }}>
                                                    ANT {antPort}
                                                </span>
                                                <span style={{ color: '#e5a93c', fontWeight: 700 }}>
                                                    {t.barcode || t.epc}
                                                </span>
                                                {t.is_excess && (
                                                    <span style={{ marginLeft: '4px', color: '#f87171', fontWeight: 900 }}>
                                                        [FAZLA]
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ color: '#64748b', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {t.rssi !== null && t.rssi !== undefined && (
                                                    <span style={{ color: '#94a3b8' }}>{t.rssi} dBm</span>
                                                )}
                                                <span>{timeStr}</span>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '40px 20px',
                                    color: '#64748b',
                                    fontSize: '13px'
                                }}>
                                    Henüz tünelden geçen bir RFID etiket okuması yok.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 🚨 BİLGİ KUTUSU: TÜNEL ALARMI & UYUMSUZLUK DETAY MODALI */}
            {(session?.status === 'ALARM' || session?.is_alarm || (session?.discrepancies && (
                (session.discrepancies.foreign_items && session.discrepancies.foreign_items.length > 0) ||
                (session.discrepancies.extra_items && session.discrepancies.extra_items.length > 0) ||
                (session.discrepancies.missing_items && session.discrepancies.missing_items.length > 0)
            ) && session.status !== 'COMPLETED' && session.status !== 'BOX_COMPLETED')) && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.92)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 99999,
                    padding: '20px'
                }}>
                    <div style={{
                        backgroundColor: '#0f172a',
                        borderRadius: '20px',
                        border: '2px solid #ef4444',
                        boxShadow: '0 25px 60px rgba(239, 68, 68, 0.4)',
                        width: '920px',
                        maxWidth: '96vw',
                        maxHeight: '92vh',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        animation: 'fadeIn 0.25s ease'
                    }}>
                        {/* Header */}
                        <div style={{
                            padding: '20px 24px',
                            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(185, 28, 28, 0.1) 100%)',
                            borderBottom: '1.5px solid rgba(239, 68, 68, 0.4)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <span style={{
                                    fontSize: '34px',
                                    animation: 'pulse 1.2s infinite',
                                    display: 'inline-block'
                                }}>
                                    🚨
                                </span>
                                <div>
                                    <h2 style={{
                                        margin: 0,
                                        fontSize: '20px',
                                        color: '#f87171',
                                        fontWeight: 900,
                                        letterSpacing: '0.5px'
                                    }}>
                                        TÜNEL ALARMI: KOLİ İÇERİK UYUMSUZLUĞU!
                                    </h2>
                                    <p style={{
                                        margin: '3px 0 0 0',
                                        fontSize: '13px',
                                        color: '#cbd5e1'
                                    }}>
                                        {session?.alarm_info?.message || 'Koli içinde uyumsuzluk tespit edildi. Akış ve yürüyen palet durduruldu.'}
                                    </p>
                                </div>
                            </div>

                            <span style={{
                                backgroundColor: '#dc2626',
                                color: '#fff',
                                padding: '6px 14px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: 900,
                                letterSpacing: '1px'
                            }}>
                                PALET DURDURULDU
                            </span>
                        </div>

                        {/* Content Scrollable Body */}
                        <div style={{
                            padding: '20px 24px',
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '18px'
                        }}>
                            {/* Summary Ribbon */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, 1fr)',
                                gap: '12px'
                            }}>
                                <div style={{
                                    backgroundColor: (session?.discrepancies?.foreign_items?.length || 0) > 0 ? 'rgba(239, 68, 68, 0.15)' : '#1e293b',
                                    border: `1.5px solid ${(session?.discrepancies?.foreign_items?.length || 0) > 0 ? '#ef4444' : '#334155'}`,
                                    borderRadius: '12px',
                                    padding: '12px',
                                    textAlign: 'center'
                                }}>
                                    <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>🛑 OLMAMASI GEREKEN ÜRÜN</span>
                                    <div style={{ fontSize: '24px', fontWeight: 900, color: (session?.discrepancies?.foreign_items?.length || 0) > 0 ? '#f87171' : '#f8fafc', marginTop: '4px' }}>
                                        {session?.discrepancies?.foreign_items?.length || 0} Adet
                                    </div>
                                </div>

                                <div style={{
                                    backgroundColor: (session?.discrepancies?.extra_items?.length || 0) > 0 ? 'rgba(245, 158, 11, 0.15)' : '#1e293b',
                                    border: `1.5px solid ${(session?.discrepancies?.extra_items?.length || 0) > 0 ? '#f59e0b' : '#334155'}`,
                                    borderRadius: '12px',
                                    padding: '12px',
                                    textAlign: 'center'
                                }}>
                                    <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>⚠️ FAZLA / HATALI BEDEN</span>
                                    <div style={{ fontSize: '24px', fontWeight: 900, color: (session?.discrepancies?.extra_items?.length || 0) > 0 ? '#fbbf24' : '#f8fafc', marginTop: '4px' }}>
                                        {session?.discrepancies?.extra_items?.length || 0} Adet
                                    </div>
                                </div>

                                <div style={{
                                    backgroundColor: (session?.discrepancies?.missing_items?.length || 0) > 0 ? 'rgba(56, 189, 248, 0.15)' : '#1e293b',
                                    border: `1.5px solid ${(session?.discrepancies?.missing_items?.length || 0) > 0 ? '#38bdf8' : '#334155'}`,
                                    borderRadius: '12px',
                                    padding: '12px',
                                    textAlign: 'center'
                                }}>
                                    <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>⏳ EKSİK BEDEN / PARÇA</span>
                                    <div style={{ fontSize: '24px', fontWeight: 900, color: (session?.discrepancies?.missing_items?.length || 0) > 0 ? '#38bdf8' : '#f8fafc', marginTop: '4px' }}>
                                        {session?.discrepancies?.missing_items?.length || 0} Adet
                                    </div>
                                </div>
                            </div>

                            {/* Section 1: Olmaması Gereken (Yabancı) Ürünler */}
                            {session?.discrepancies?.foreign_items && session.discrepancies.foreign_items.length > 0 && (
                                <div style={{
                                    backgroundColor: '#161e2e',
                                    borderRadius: '14px',
                                    border: '1.5px solid #ef4444',
                                    padding: '16px'
                                }}>
                                    <h4 style={{
                                        margin: '0 0 10px 0',
                                        color: '#f87171',
                                        fontSize: '14px',
                                        fontWeight: 800,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        🛑 Koli İçinde Olmaması Gereken Ürünler ({session.discrepancies.foreign_items.length})
                                    </h4>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                            <thead>
                                                <tr style={{ color: '#94a3b8', borderBottom: '1px solid #283548', textAlign: 'left' }}>
                                                    <th style={{ padding: '6px 8px' }}>Ürün / Model</th>
                                                    <th style={{ padding: '6px 8px' }}>Barkod / SKU</th>
                                                    <th style={{ padding: '6px 8px' }}>EPC</th>
                                                    <th style={{ padding: '6px 8px' }}>Uyumsuzluk Nedeni</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {session.discrepancies.foreign_items.map((it, idx) => (
                                                    <tr key={idx} style={{ borderBottom: '1px solid #1e293b' }}>
                                                        <td style={{ padding: '8px', color: '#f8fafc', fontWeight: 700 }}>{it.name || 'Bilinmeyen Ürün'}</td>
                                                        <td style={{ padding: '8px', color: '#94a3b8', fontFamily: 'monospace' }}>{it.barcode || it.sku || '-'}</td>
                                                        <td style={{ padding: '8px', color: '#cbd5e1', fontFamily: 'monospace', fontSize: '11px' }}>{it.epc ? it.epc.slice(-12) : '-'}</td>
                                                        <td style={{ padding: '8px', color: '#f87171', fontWeight: 700 }}>{it.reason}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Section 2: Fazla veya Hatalı Bedenler */}
                            {session?.discrepancies?.extra_items && session.discrepancies.extra_items.length > 0 && (
                                <div style={{
                                    backgroundColor: '#161e2e',
                                    borderRadius: '14px',
                                    border: '1.5px solid #f59e0b',
                                    padding: '16px'
                                }}>
                                    <h4 style={{
                                        margin: '0 0 10px 0',
                                        color: '#fbbf24',
                                        fontSize: '14px',
                                        fontWeight: 800,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        ⚠️ Fazla Adet veya Hatalı Bedenler ({session.discrepancies.extra_items.length})
                                    </h4>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                            <thead>
                                                <tr style={{ color: '#94a3b8', borderBottom: '1px solid #283548', textAlign: 'left' }}>
                                                    <th style={{ padding: '6px 8px' }}>Ürün</th>
                                                    <th style={{ padding: '6px 8px' }}>Okunan Beden</th>
                                                    <th style={{ padding: '6px 8px' }}>Beklenen Beden</th>
                                                    <th style={{ padding: '6px 8px' }}>Açıklama</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {session.discrepancies.extra_items.map((it, idx) => (
                                                    <tr key={idx} style={{ borderBottom: '1px solid #1e293b' }}>
                                                        <td style={{ padding: '8px', color: '#f8fafc', fontWeight: 700 }}>{it.name || 'Ürün'}</td>
                                                        <td style={{ padding: '8px' }}>
                                                            <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.25)', color: '#f87171', padding: '3px 8px', borderRadius: '6px', fontWeight: 900 }}>
                                                                {it.size || 'STD'}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '8px', color: '#34d399', fontWeight: 800 }}>
                                                            {it.expected_sizes && it.expected_sizes.length > 0 ? it.expected_sizes.join(', ') : 'STD'}
                                                        </td>
                                                        <td style={{ padding: '8px', color: '#fbbf24', fontWeight: 600 }}>{it.reason}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Section 3: Eksik Beden / Parçalar */}
                            {session?.discrepancies?.missing_items && session.discrepancies.missing_items.length > 0 && (
                                <div style={{
                                    backgroundColor: '#161e2e',
                                    borderRadius: '14px',
                                    border: '1.5px solid #38bdf8',
                                    padding: '16px'
                                }}>
                                    <h4 style={{
                                        margin: '0 0 10px 0',
                                        color: '#38bdf8',
                                        fontSize: '14px',
                                        fontWeight: 800,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        ⏳ Koli İçinde Eksik Kalan Parçalar ({session.discrepancies.missing_items.length})
                                    </h4>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                            <thead>
                                                <tr style={{ color: '#94a3b8', borderBottom: '1px solid #283548', textAlign: 'left' }}>
                                                    <th style={{ padding: '6px 8px' }}>Eksik Parça</th>
                                                    <th style={{ padding: '6px 8px' }}>Beden</th>
                                                    <th style={{ padding: '6px 8px' }}>Barkod / Parça No</th>
                                                    <th style={{ padding: '6px 8px' }}>Durum</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {session.discrepancies.missing_items.map((it, idx) => (
                                                    <tr key={idx} style={{ borderBottom: '1px solid #1e293b' }}>
                                                        <td style={{ padding: '8px', color: '#f8fafc', fontWeight: 700 }}>{it.name}</td>
                                                        <td style={{ padding: '8px', color: '#e5a93c', fontWeight: 900 }}>{it.size}</td>
                                                        <td style={{ padding: '8px', color: '#94a3b8', fontFamily: 'monospace' }}>{it.part_no || it.barcode || '-'}</td>
                                                        <td style={{ padding: '8px', color: '#f87171', fontWeight: 700 }}>❌ Taranmadı / Eksik</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons Footer */}
                        <div style={{
                            padding: '18px 24px',
                            backgroundColor: '#0a0f1d',
                            borderTop: '1px solid #1e293b',
                            display: 'flex',
                            gap: '12px',
                            justifyContent: 'flex-end',
                            flexWrap: 'wrap'
                        }}>
                            <button
                                onClick={handleResetAlarm}
                                style={{
                                    padding: '12px 20px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                                    color: '#fff',
                                    fontWeight: 800,
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                🔄 Alarmı Sıfırla & Akışı Başlat
                            </button>

                            <button
                                onClick={handleClearBoxScans}
                                style={{
                                    padding: '12px 20px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: 'linear-gradient(135deg, #e5a93c 0%, #c28821 100%)',
                                    color: '#fff',
                                    fontWeight: 800,
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    boxShadow: '0 4px 14px rgba(229, 169, 60, 0.3)'
                                }}
                            >
                                🗑️ Koli Sayımını Sıfırla (Kutuyu Düzeltip Yeniden Geçir)
                            </button>

                            <button
                                onClick={() => {
                                    if (window.confirm('Koli eksik veya hatalı parçalar içerebilir. Yine de bu haliyle tamamlayıp sıradakine geçmek istiyor musunuz?')) {
                                        handleCompleteBox();
                                    }
                                }}
                                style={{
                                    padding: '12px 20px',
                                    borderRadius: '12px',
                                    border: '1.5px solid #10b981',
                                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                    color: '#34d399',
                                    fontWeight: 800,
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                ✋ Bu Haliyle Manuel Tamamla & Sıradakine Geç
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ORDER SELECTION MODAL */}
            {isOrderModalOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.85)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 9999,
                    padding: '20px'
                }}>
                    <div style={{
                        backgroundColor: '#111622',
                        borderRadius: '20px',
                        border: '2px solid #334155',
                        width: '100%',
                        maxWidth: '850px',
                        maxHeight: '85vh',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
                        overflow: 'hidden'
                    }}>
                        {/* MODAL HEADER */}
                        <div style={{
                            padding: '16px 24px',
                            backgroundColor: '#1a2234',
                            borderBottom: '1px solid #334155',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div style={{ margin: 0, fontSize: '18px', color: '#f8fafc', fontWeight: 800 }}>
                                📦 Taranacak Sipariş veya Personel Kolisini Seçin
                            </div>
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
                                                    const targetBrand = personnelBrands.find(item => item.brand === b);
                                                    const deptList = targetBrand?.departments || [];
                                                    const nextDept = deptList.length > 0 ? deptList[0].department : 'ALL';
                                                    setSelectedPersonnelDepartment(nextDept);
                                                    setPersonnelStartBox(1);
                                                    fetchPersonnelBoxes(b, nextDept, personnelSearch);
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

                                        {/* Department (Bölüm / Lokasyon) Selector */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>Bölüm / Lokasyon:</span>
                                            <select
                                                value={selectedPersonnelDepartment}
                                                onChange={(e) => {
                                                    const dept = e.target.value;
                                                    setSelectedPersonnelDepartment(dept);
                                                    setPersonnelStartBox(1);
                                                    fetchPersonnelBoxes(selectedPersonnelBrand, dept, personnelSearch);
                                                }}
                                                style={{
                                                    backgroundColor: '#0a0d14',
                                                    border: '1.5px solid #10b981',
                                                    borderRadius: '8px',
                                                    padding: '8px 14px',
                                                    color: '#10b981',
                                                    fontWeight: 900,
                                                    fontSize: '14px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {(() => {
                                                    const bInfo = personnelBrands.find(b => b.brand === selectedPersonnelBrand);
                                                    const depts = bInfo?.departments || [];
                                                    if (depts.length > 0) {
                                                        return depts.map(d => (
                                                            <option key={d.department} value={d.department}>
                                                                📁 {d.department} ({d.total_count || d.total_personnel || 0} Koli)
                                                            </option>
                                                        ));
                                                    }
                                                    return <option value="ALL">📁 Tüm Bölümler</option>;
                                                })()}
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
                                                onClick={() => handleStartPersonnelSession(selectedPersonnelBrand, selectedPersonnelDepartment, personnelStartBox)}
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
                                                onClick={() => handleRenumberPersonnel(selectedPersonnelBrand, selectedPersonnelDepartment)}
                                                disabled={isRenumbering}
                                                title="Bu bölümdeki tüm personeli Excel sıra numarasına göre (A sütunu) Koli 1'den başlayarak numaralandırır"
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
                                                {isRenumbering ? '⏳ Sıralanıyor...' : '🔄 Excel Sıra Numaralandır (1..N)'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Brand & Department Stats Summary */}
                                    {(() => {
                                        const bInfo = personnelBrands.find(b => b.brand === selectedPersonnelBrand);
                                        const deptInfo = bInfo?.departments?.find(d => d.department === selectedPersonnelDepartment);
                                        const totalCount = deptInfo ? (deptInfo.total_count || deptInfo.total_personnel || 0) : (bInfo ? (bInfo.total_personnel || 0) : personnelBoxes.length);
                                        const packedCount = deptInfo ? (deptInfo.packed_count || 0) : (bInfo ? (bInfo.packed_count || 0) : 0);
                                        const remainingCount = deptInfo ? (deptInfo.remaining_count || 0) : (totalCount - packedCount);

                                        return (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: '#94a3b8', flexWrap: 'wrap' }}>
                                                <span style={{ backgroundColor: '#1e293b', padding: '3px 10px', borderRadius: '6px', color: '#38bdf8', fontWeight: 800 }}>
                                                    🏢 Bölüm: {selectedPersonnelDepartment || 'Tümü'}
                                                </span>
                                                <span>Toplam: <strong style={{ color: '#fff' }}>{totalCount} Koli</strong></span>
                                                <span>•</span>
                                                <span style={{ color: '#34d399' }}>Paketlenen: <strong>{packedCount} Koli</strong></span>
                                                <span>•</span>
                                                <span style={{ color: '#fbbf24' }}>Bekleyen: <strong>{remainingCount} Koli</strong></span>
                                                <span>•</span>
                                                <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>📌 Her bölüm koli sırası Excel A sütununa göre 1'den başlar (Sıra: 1 - {totalCount}).</span>
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
                                            fetchPersonnelBoxes(selectedPersonnelBrand, selectedPersonnelDepartment, val);
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
                                                        key={box.box_barcode || `${box.department}-${box.box_no}`}
                                                        onClick={() => {
                                                            setPersonnelStartBox(box.box_no);
                                                            handleStartPersonnelSession(selectedPersonnelBrand, selectedPersonnelDepartment, box.box_no);
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
                                                                        backgroundColor: '#1e293b',
                                                                        color: '#38bdf8',
                                                                        border: '1px solid #0284c7'
                                                                    }}>
                                                                        🏢 {box.department}
                                                                    </span>
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
                                                                {box.target_quantity || box.item_count || 7} Parça
                                                            </span>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setPersonnelStartBox(box.box_no);
                                                                    handleStartPersonnelSession(selectedPersonnelBrand, selectedPersonnelDepartment, box.box_no);
                                                                }}
                                                                style={{
                                                                    backgroundColor: '#2563eb',
                                                                    color: '#fff',
                                                                    border: 'none',
                                                                    padding: '7px 14px',
                                                                    borderRadius: '6px',
                                                                    fontWeight: 800,
                                                                    fontSize: '12px',
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
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
                                {/* SEARCH & FILTER BAR */}
                        <div style={{ padding: '16px 24px', borderBottom: '1px solid #1f293d', display: 'flex', gap: '12px' }}>
                            <input
                                type="text"
                                placeholder="🔍 Sipariş No (Örn: 16865), Model, Müşteri veya SKU Ara..."
                                value={searchOrder}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setSearchOrder(val);
                                    fetchOrdersList(val, selectedBrandFilter);
                                }}
                                style={{
                                    flex: 1,
                                    backgroundColor: '#0a0d14',
                                    border: '1px solid #334155',
                                    borderRadius: '10px',
                                    padding: '12px 16px',
                                    color: '#fff',
                                    fontSize: '14px'
                                }}
                            />
                            <select
                                value={selectedBrandFilter}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setSelectedBrandFilter(val);
                                    fetchOrdersList(searchOrder, val);
                                }}
                                style={{
                                    backgroundColor: '#0a0d14',
                                    border: '1px solid #334155',
                                    borderRadius: '10px',
                                    padding: '12px 16px',
                                    color: '#e5a93c',
                                    fontWeight: 700,
                                    fontSize: '14px'
                                }}
                            >

                                <option value="ALL">Tüm Markalar</option>
                                <option value="SEAT">SEAT</option>
                                <option value="AUDI">AUDI</option>
                                <option value="FORD">FORD</option>
                                <option value="NISSAN">NISSAN</option>
                                <option value="CUPRA">CUPRA</option>
                                <option value="SKODA">SKODA</option>
                                <option value="PORSCHE">PORSCHE</option>
                                <option value="VOLKSWAGEN">VOLKSWAGEN</option>
                            </select>
                        </div>

                        {/* ORDERS TABLE LIST */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
                            {isLoadingOrders ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                    Siparişler yükleniyor...
                                </div>
                            ) : filteredOrders.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {filteredOrders.map((order) => (
                                        <div
                                            key={order.id}
                                            onClick={() => handleOpenPlanModal(order)}
                                            style={{
                                                backgroundColor: '#161e2e',
                                                border: '1px solid #283548',
                                                borderRadius: '12px',
                                                padding: '14px 18px',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#e5a93c'}
                                            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#283548'}
                                        >
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{
                                                        backgroundColor: '#e5a93c',
                                                        color: '#000',
                                                        padding: '2px 8px',
                                                        borderRadius: '4px',
                                                        fontWeight: 900,
                                                        fontSize: '11px'
                                                    }}>
                                                        {order.brand || 'VOG'}
                                                    </span>
                                                    <strong style={{ fontSize: '15px', color: '#f8fafc' }}>
                                                        #{order.order_number} - {order.product_name}
                                                    </strong>
                                                    {order.has_box_plan && (
                                                        <span style={{
                                                            backgroundColor: 'rgba(99, 102, 241, 0.2)',
                                                            color: '#818cf8',
                                                            border: '1px solid #6366f1',
                                                            padding: '2px 8px',
                                                            borderRadius: '4px',
                                                            fontWeight: 800,
                                                            fontSize: '11px'
                                                        }}>
                                                            📦 {order.total_planned_boxes || order.total_boxes} Koli Planlı
                                                        </span>
                                                    )}
                                                </div>
                                                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                                                    Müşteri: {order.sub_customer_name || order.customer_name} | Personel: {order.staff_name || '-'} | SKU: {order.sku || '-'}
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#38bdf8' }}>
                                                        {order.remaining_quantity || order.quantity} Adet
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                                                        {order.status || 'BEKLİYOR'}
                                                    </div>
                                                </div>
                                                <button style={{
                                                    backgroundColor: '#2563eb',
                                                    color: '#fff',
                                                    border: 'none',
                                                    padding: '8px 14px',
                                                    borderRadius: '8px',
                                                    fontWeight: 800,
                                                    fontSize: '12px',
                                                    cursor: 'pointer'
                                                }}>
                                                    SEÇ & PLANLA ➔
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                    Aramanıza uygun sipariş bulunamadı.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
                </div>
            )}

            {/* METHOD 2: KOLI PLANLAMA & BAŞLATMA MODALI */}
            {planModalOrder && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.85)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 10000,
                    padding: '20px'
                }}>
                    <div style={{
                        backgroundColor: '#111622',
                        borderRadius: '20px',
                        border: '2px solid #e5a93c',
                        width: '100%',
                        maxWidth: '650px',
                        boxShadow: '0 25px 70px rgba(0,0,0,0.9), 0 0 30px rgba(229, 169, 60, 0.2)',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        {/* Header */}
                        <div style={{
                            padding: '18px 24px',
                            backgroundColor: '#1a2234',
                            borderBottom: '1px solid #334155',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <h2 style={{ margin: 0, fontSize: '18px', color: '#f8fafc', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                📦 Koli Sayısı & Hedef Planlama
                            </h2>
                            <button
                                onClick={() => setPlanModalOrder(null)}
                                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '24px', cursor: 'pointer' }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Content */}
                        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {/* Order Info Card */}
                            <div style={{
                                backgroundColor: '#0a0e17',
                                padding: '14px 18px',
                                borderRadius: '12px',
                                border: '1px solid #1f293d',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <span style={{ backgroundColor: '#e5a93c', color: '#000', padding: '2px 8px', borderRadius: '4px', fontWeight: 900, fontSize: '11px' }}>
                                        {planModalOrder.brand || 'VOG'}
                                    </span>
                                    <h3 style={{ margin: '4px 0 0 0', fontSize: '16px', color: '#f8fafc', fontWeight: 800 }}>
                                        #{planModalOrder.order_number} - {planModalOrder.product_name}
                                    </h3>
                                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                                        Müşteri: {planModalOrder.sub_customer_name || planModalOrder.customer_name}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>TOPLAM SİPARİŞ</div>
                                    <div style={{ fontSize: '22px', fontWeight: 900, color: '#38bdf8' }}>
                                        {planModalOrder.remaining_quantity > 0 ? planModalOrder.remaining_quantity : (planModalOrder.quantity || 1)} Adet
                                    </div>
                                </div>
                            </div>

                            {/* MOD B / PLANLANMIŞ KOLİLER VARSA GÖSTER */}
                            {orderPackedBoxes && orderPackedBoxes.length > 0 ? (
                                <div style={{
                                    backgroundColor: '#0a0e17',
                                    border: '2px solid #10b981',
                                    borderRadius: '14px',
                                    padding: '16px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '12px',
                                    boxShadow: '0 4px 20px rgba(16, 185, 129, 0.2)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                        <div style={{ fontSize: '13px', fontWeight: 900, color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            📦 PLANLI / PAKETLENMİŞ KOLİLER ({orderPackedBoxes.length} Koli Mevcut)
                                        </div>
                                        <button
                                            onClick={() => setEditingBoxPlanOrder(planModalOrder)}
                                            style={{
                                                backgroundColor: '#6366f1',
                                                color: '#ffffff',
                                                border: 'none',
                                                padding: '6px 14px',
                                                borderRadius: '8px',
                                                fontSize: '11px',
                                                fontWeight: 800,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}
                                        >
                                            ✏️ Koli Dağılım Planını Düzenle
                                        </button>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {orderPackedBoxes.map((b) => {
                                            const targetCount = b.target_quantity || b.packed_quantity || b.item_count || 0;
                                            const itemsPlan = Array.isArray(b.items_plan) ? b.items_plan : [];
                                            return (
                                                <div
                                                    key={b.box_no}
                                                    onClick={() => handleSelectBoxForVerification(planModalOrder.order_number || planModalOrder.id, b.box_no)}
                                                    style={{
                                                        backgroundColor: '#1e293b',
                                                        border: '1px solid #334155',
                                                        borderRadius: '10px',
                                                        padding: '12px 16px',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.backgroundColor = '#162e24'; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.backgroundColor = '#1e293b'; }}
                                                >
                                                    <div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            <strong style={{ fontSize: '15px', color: '#fbbf24' }}>
                                                                📦 Koli {b.box_no}
                                                            </strong>
                                                            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                                                                Hedef: <strong style={{ color: '#38bdf8' }}>{targetCount} Adet</strong>
                                                            </span>
                                                            {b.status && (
                                                                <span style={{
                                                                    fontSize: '10px',
                                                                    fontWeight: 800,
                                                                    padding: '2px 6px',
                                                                    borderRadius: '4px',
                                                                    backgroundColor: b.status === 'PACKED' || b.status === 'VERIFIED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                                                                    color: b.status === 'PACKED' || b.status === 'VERIFIED' ? '#34d399' : '#60a5fa'
                                                                }}>
                                                                    {b.status}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {itemsPlan.length > 0 && (
                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                                                                {itemsPlan.filter(p => p.quantity > 0).map(p => (
                                                                    <span key={p.size} style={{
                                                                        fontSize: '11px',
                                                                        fontWeight: 700,
                                                                        padding: '2px 6px',
                                                                        borderRadius: '4px',
                                                                        backgroundColor: '#0f172a',
                                                                        color: '#e2e8f0',
                                                                        border: '1px solid #334155'
                                                                    }}>
                                                                        <span style={{ color: '#e5a93c' }}>{p.size}:</span> {p.quantity} adet
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <button style={{
                                                        backgroundColor: '#10b981',
                                                        color: '#fff',
                                                        border: 'none',
                                                        padding: '8px 16px',
                                                        borderRadius: '8px',
                                                        fontWeight: 900,
                                                        fontSize: '12px',
                                                        cursor: 'pointer',
                                                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)',
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        ▶️ OKUT / DOĞRULA ➔
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '12px 16px',
                                    backgroundColor: '#0a0e17',
                                    border: '1px dashed #334155',
                                    borderRadius: '12px'
                                }}>
                                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                                        💡 Bu sipariş için henüz özel koli/beden dağılım planı yapılmadı.
                                    </div>
                                    <button
                                        onClick={() => setEditingBoxPlanOrder(planModalOrder)}
                                        style={{
                                            backgroundColor: '#6366f1',
                                            color: '#ffffff',
                                            border: 'none',
                                            padding: '8px 14px',
                                            borderRadius: '8px',
                                            fontSize: '11px',
                                            fontWeight: 800,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}
                                    >
                                        📦 Koli Planı Oluştur
                                    </button>
                                </div>
                            )}

                            {/* 1. TOPLAM KOLI SAYISI SEÇİCİ */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <label style={{ fontSize: '13px', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    {orderPackedBoxes && orderPackedBoxes.length > 0 ? 'Veya Standart Oturum Başlat (Toplam Koli Sayısı)' : '1. Bu Sipariş Kaç Koliye Bölünecek? (Toplam Koli Sayısı)'}
                                </label>

                                
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <button
                                        onClick={() => {
                                            const next = Math.max(1, planTotalBoxes - 1);
                                            const totalQty = planModalOrder.remaining_quantity > 0 ? planModalOrder.remaining_quantity : (planModalOrder.quantity || 1);
                                            setPlanTotalBoxes(next);
                                            setPlanTargetQty(Math.max(1, Math.ceil(totalQty / next)));
                                        }}
                                        style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', fontSize: '22px', fontWeight: 900, cursor: 'pointer' }}
                                    >
                                        −
                                    </button>
                                    
                                    <div style={{
                                        flex: 1,
                                        height: '48px',
                                        backgroundColor: '#1e293b',
                                        borderRadius: '10px',
                                        border: '2px solid #e5a93c',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '20px',
                                        fontWeight: 900,
                                        color: '#fbbf24'
                                    }}>
                                        📦 {planTotalBoxes} KOLİ
                                    </div>

                                    <button
                                        onClick={() => {
                                            const next = planTotalBoxes + 1;
                                            const totalQty = planModalOrder.remaining_quantity > 0 ? planModalOrder.remaining_quantity : (planModalOrder.quantity || 1);
                                            setPlanTotalBoxes(next);
                                            setPlanTargetQty(Math.max(1, Math.ceil(totalQty / next)));
                                        }}
                                        style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', fontSize: '22px', fontWeight: 900, cursor: 'pointer' }}
                                    >
                                        +
                                    </button>
                                </div>

                                {/* Hızlı Koli Butonları */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                                    {[1, 2, 3, 4, 5].map(num => (
                                        <button
                                            key={num}
                                            onClick={() => {
                                                const totalQty = planModalOrder.remaining_quantity > 0 ? planModalOrder.remaining_quantity : (planModalOrder.quantity || 1);
                                                setPlanTotalBoxes(num);
                                                setPlanTargetQty(Math.max(1, Math.ceil(totalQty / num)));
                                            }}
                                            style={{
                                                padding: '8px',
                                                borderRadius: '8px',
                                                border: planTotalBoxes === num ? '2px solid #e5a93c' : '1px solid #334155',
                                                backgroundColor: planTotalBoxes === num ? 'rgba(229, 169, 60, 0.2)' : '#0f172a',
                                                color: planTotalBoxes === num ? '#fbbf24' : '#94a3b8',
                                                fontWeight: 800,
                                                fontSize: '13px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {num} Koli
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 2. KOLI BAŞI HEDEF ADET */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <label style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    2. Koli Başına Düşen Hedef Okuma Adedi
                                </label>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <button
                                        onClick={() => setPlanTargetQty(prev => Math.max(1, prev - 1))}
                                        style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', fontSize: '22px', fontWeight: 900, cursor: 'pointer' }}
                                    >
                                        −
                                    </button>

                                    <div style={{
                                        flex: 1,
                                        height: '48px',
                                        backgroundColor: '#1e293b',
                                        borderRadius: '10px',
                                        border: '2px solid #0284c7',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '20px',
                                        fontWeight: 900,
                                        color: '#38bdf8'
                                    }}>
                                        🎯 {planTargetQty} ADET / KOLİ
                                    </div>

                                    <button
                                        onClick={() => setPlanTargetQty(prev => prev + 1)}
                                        style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', fontSize: '22px', fontWeight: 900, cursor: 'pointer' }}
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            {/* Plan Özeti Bilgi Kartı */}
                            <div style={{
                                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                border: '1px solid #10b981',
                                borderRadius: '10px',
                                padding: '12px 16px',
                                color: '#6ee7b7',
                                fontSize: '13px',
                                fontWeight: 700,
                                textAlign: 'center'
                            }}>
                                💡 Bu sipariş <strong>{planTotalBoxes} koliye</strong> bölünecek. 1. koli için tünelde <strong>{planTargetQty} adet</strong> okununca otomatik <strong>1/{planTotalBoxes}</strong> etiketi basılacak.
                            </div>
                        </div>

                        {/* Footer Action Buttons */}
                        <div style={{
                            padding: '16px 24px',
                            backgroundColor: '#1a2234',
                            borderTop: '1px solid #334155',
                            display: 'flex',
                            gap: '12px',
                            justifyContent: 'flex-end'
                        }}>
                            <button
                                onClick={() => setPlanModalOrder(null)}
                                style={{
                                    padding: '14px 20px',
                                    borderRadius: '10px',
                                    border: '1px solid #334155',
                                    backgroundColor: '#1e293b',
                                    color: '#94a3b8',
                                    fontWeight: 800,
                                    fontSize: '14px',
                                    cursor: 'pointer'
                                }}
                            >
                                ✕ Vazgeç
                            </button>
                            
                            <button
                                onClick={handleConfirmStartSession}
                                style={{
                                    flex: 1,
                                    padding: '14px 24px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    color: '#fff',
                                    fontWeight: 900,
                                    fontSize: '16px',
                                    cursor: 'pointer',
                                    boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                            >
                                🚀 SİPARİŞİ BAŞLAT (Koli 1/{planTotalBoxes}) ▶️
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* MANUAL BARCODE MODAL */}
            {isManualModalOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.85)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 9999,
                    padding: '20px'
                }}>
                    <div style={{
                        backgroundColor: '#111622',
                        borderRadius: '20px',
                        border: '2px solid #334155',
                        width: '100%',
                        maxWidth: '500px',
                        padding: '24px',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.8)'
                    }}>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#f8fafc', fontWeight: 800 }}>
                            ⌨️ Manuel Barkod veya RFID EPC Girişi
                        </h3>
                        <form onSubmit={handleManualScanSubmit}>
                            <input
                                autoFocus
                                type="text"
                                placeholder="Barkod veya 24 Haneli EPC Girin..."
                                value={manualBarcode}
                                onChange={(e) => setManualBarcode(e.target.value)}
                                style={{
                                    width: '100%',
                                    backgroundColor: '#0a0d14',
                                    border: '2px solid #38bdf8',
                                    borderRadius: '10px',
                                    padding: '14px',
                                    color: '#fff',
                                    fontSize: '16px',
                                    marginBottom: '16px',
                                    boxSizing: 'border-box'
                                }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                <button
                                    type="button"
                                    onClick={() => setIsManualModalOpen(false)}
                                    style={{
                                        padding: '10px 18px',
                                        borderRadius: '8px',
                                        border: '1px solid #334155',
                                        backgroundColor: '#1e293b',
                                        color: '#cbd5e1',
                                        cursor: 'pointer',
                                        fontWeight: 700
                                    }}
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    style={{
                                        padding: '10px 20px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        backgroundColor: '#10b981',
                                        color: '#fff',
                                        cursor: 'pointer',
                                        fontWeight: 800
                                    }}
                                >
                                    Ekle & Say
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* HELP INFO MODAL */}
            {showHelpModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(10, 13, 20, 0.8)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 10000,
                    padding: '20px'
                }}>
                    <div style={{
                        backgroundColor: '#111622',
                        borderRadius: '20px',
                        border: '2px solid #e5a93c',
                        width: '100%',
                        maxWidth: '750px',
                        padding: '28px',
                        boxShadow: '0 20px 60px rgba(229, 169, 60, 0.25)',
                        maxHeight: '90vh',
                        overflowY: 'auto'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #1f293d', paddingBottom: '12px' }}>
                            <h3 style={{ margin: 0, fontSize: '20px', color: '#e5a93c', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                💡 VOG Touch Tünel Kiosk Yardım Rehberi
                            </h3>
                            <button 
                                onClick={() => setShowHelpModal(false)}
                                style={{
                                    border: 'none',
                                    background: 'none',
                                    color: '#cbd5e1',
                                    fontSize: '28px',
                                    fontWeight: '300',
                                    cursor: 'pointer',
                                    padding: '0 8px'
                                }}
                            >
                                &times;
                            </button>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {/* Card 1 */}
                            <div style={{
                                backgroundColor: 'rgba(30, 41, 59, 0.4)',
                                border: '1px solid #1e293b',
                                borderRadius: '12px',
                                padding: '14px 18px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px',
                                transition: 'all 0.2s'
                            }}>
                                <strong style={{ color: '#fff', fontSize: '15px' }}>📂 Sipariş Değiştir / Seç:</strong>
                                <p style={{ margin: 0, color: '#cbd5e1', fontSize: '13.5px', lineHeight: '1.5' }}>
                                    Kiosk ekranında sayımı yapılacak aktif siparişi seçmek için kullanılır. Sipariş seçildiğinde hedef adet ve ürün bilgileri ekranın sol bölümüne otomatik olarak yüklenir.
                                </p>
                            </div>
                            
                            {/* Card 2 */}
                            <div style={{
                                backgroundColor: 'rgba(30, 41, 59, 0.4)',
                                border: '1px solid #1e293b',
                                borderRadius: '12px',
                                padding: '14px 18px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px',
                                transition: 'all 0.2s'
                            }}>
                                <strong style={{ color: '#fff', fontSize: '15px' }}>⚡ Antenleri Ateşle (Taramayı Başlat):</strong>
                                <p style={{ margin: 0, color: '#cbd5e1', fontSize: '13.5px', lineHeight: '1.5' }}>
                                    RFID okuyucunun tünel içindeki antenlerini aktif hale getirerek ürünleri okumaya başlamasını sağlar. Tünel taraması açıkken bu buton yeşile döner.
                                </p>
                            </div>
                            
                            {/* Card 3 */}
                            <div style={{
                                backgroundColor: 'rgba(30, 41, 59, 0.4)',
                                border: '1px solid #1e293b',
                                borderRadius: '12px',
                                padding: '14px 18px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px',
                                transition: 'all 0.2s'
                            }}>
                                <strong style={{ color: '#fff', fontSize: '15px' }}>⏸️ Tüneli Duraklat & Devam Ettir:</strong>
                                <p style={{ margin: 0, color: '#cbd5e1', fontSize: '13.5px', lineHeight: '1.5' }}>
                                    <strong>"Tüneli Duraklat"</strong> butonu okuyucunun anten yayımını fiziksel olarak askıya alır (okuyucu kapanır/susar). <strong>"Tüneli Devam Ettir"</strong> dendiğinde okuyucu tekrar donanımsal olarak çalışmaya başlar.
                                </p>
                            </div>

                            {/* Card 4 */}
                            <div style={{
                                backgroundColor: 'rgba(30, 41, 59, 0.4)',
                                border: '1px solid #1e293b',
                                borderRadius: '12px',
                                padding: '14px 18px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px',
                                transition: 'all 0.2s'
                            }}>
                                <strong style={{ color: '#fff', fontSize: '15px' }}>🤖 Hands-Free Otomatik ERP & Yazıcı (Switch):</strong>
                                <p style={{ margin: 0, color: '#cbd5e1', fontSize: '13.5px', lineHeight: '1.5' }}>
                                    Bu otomasyon switch'i aktifken, tünelde okunan ürün sayısı hedefe ulaştığı an (Örn: 10/10) sistem <strong>ekrandaki hiçbir düğmeye basmanıza gerek kalmadan</strong> koliyi otomatik tamamlar, Tiger ERP irsaliyesini keser, etiket çıktısını yazıcıya yollar ve yeni koli için tüneli sıfırlar.
                                </p>
                            </div>
                            
                            {/* Card 5 */}
                            <div style={{
                                backgroundColor: 'rgba(30, 41, 59, 0.4)',
                                border: '1px solid #1e293b',
                                borderRadius: '12px',
                                padding: '14px 18px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px',
                                transition: 'all 0.2s'
                            }}>
                                <strong style={{ color: '#fff', fontSize: '15px' }}>🏷️ Koliyi Tamamla & Etiket Bas (Manuel):</strong>
                                <p style={{ margin: 0, color: '#cbd5e1', fontSize: '13.5px', lineHeight: '1.5' }}>
                                    Okuması biten koli verilerini kaydeder, LOGO Tiger ERP'ye canlı olarak sevk irsaliyesi yazar ve sevkiyat barkod etiketini basar.
                                </p>
                            </div>
                            
                            {/* Card 6 */}
                            <div style={{
                                backgroundColor: 'rgba(30, 41, 59, 0.4)',
                                border: '1px solid #1e293b',
                                borderRadius: '12px',
                                padding: '14px 18px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px',
                                transition: 'all 0.2s'
                            }}>
                                <strong style={{ color: '#fff', fontSize: '15px' }}>🔄 Koliyi Sıfırla:</strong>
                                <p style={{ margin: 0, color: '#cbd5e1', fontSize: '13.5px', lineHeight: '1.5' }}>
                                    Koli içindeki tüm okumaları siler, sayacı sıfırlar ve tüneli baştan başlatır. (Tünelden yanlış bir etiket geçtiğinde veya sayım iptal edilmek istendiğinde kullanılır).
                                </p>
                            </div>
                            
                            {/* Card 7 */}
                            <div style={{
                                backgroundColor: 'rgba(30, 41, 59, 0.4)',
                                border: '1px solid #1e293b',
                                borderRadius: '12px',
                                padding: '14px 18px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px',
                                transition: 'all 0.2s'
                            }}>
                                <strong style={{ color: '#fff', fontSize: '15px' }}>⌨️ Manuel Barkod / EPC Girişi:</strong>
                                <p style={{ margin: 0, color: '#cbd5e1', fontSize: '13.5px', lineHeight: '1.5' }}>
                                    RFID etiketi hasar görmüş veya okunmayan ürünlerin barkodunu el terminaliyle veya klavyeyle elle girmenizi sağlar.
                                </p>
                            </div>
                        </div>
                        
                        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #1f293d', paddingTop: '16px' }}>
                            <button
                                onClick={() => setShowHelpModal(false)}
                                style={{
                                    padding: '10px 24px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    backgroundColor: '#e5a93c',
                                    color: '#000',
                                    cursor: 'pointer',
                                    fontWeight: 800,
                                    boxShadow: '0 4px 14px rgba(229, 169, 60, 0.3)'
                                }}
                            >
                                Anladım, Kapat
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Koli Planlama & Beden Dağılım Modalı */}
            {editingBoxPlanOrder && (
                <OrderBoxPlanModal
                    order={editingBoxPlanOrder}
                    onClose={() => setEditingBoxPlanOrder(null)}
                    onSaved={async () => {
                        if (planModalOrder) {
                            handleOpenPlanModal(planModalOrder);
                        }
                    }}
                />
            )}
        </div>
    );
};

export default TunnelKioskPage;
