import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../services/apiConfig';

const HardwareDashboard = () => {
    const { t, themeMode } = useLanguage();
    const navigate = useNavigate();
    const [rfidData, setRfidData] = useState({
        scanned: 1240,
        errors: 0,
        efficiency: 99.8
    });

    const [selectedGate, setSelectedGate] = useState(null);
    const [selectedGateItems, setSelectedGateItems] = useState([]);
    const [isLoadingGateItems, setIsLoadingGateItems] = useState(false);
    const [itemSearchQuery, setItemSearchQuery] = useState('');

    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'tracking' | 'list'
    const [isDiagnosing, setIsDiagnosing] = useState(false);
    const [sorterConnected, setSorterConnected] = useState(false);
    const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);

    // Live Tracking Filters
    const [trackingSearchQuery, setTrackingSearchQuery] = useState('');
    const [filterWall, setFilterWall] = useState('ALL');
    const [filterFloor, setFilterFloor] = useState('ALL');
    const [filterStatus, setFilterStatus] = useState('ALL');

    // Fullscreen Floor Map State & Clock
    const [isFloorMapFullscreen, setIsFloorMapFullscreen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
    const [gridDisplayMode, setGridDisplayMode] = useState('matrix'); // 'matrix' (Image 1 Birebir Saha Matrisi) | 'cards' (Image 2 - 4 Duvar Modülü)

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isFloorMapFullscreen) {
                toggleFullscreen(false);
            }
        };
        const handleFsChange = () => {
            if (!document.fullscreenElement && isFloorMapFullscreen) {
                setIsFloorMapFullscreen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        document.addEventListener('fullscreenchange', handleFsChange);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('fullscreenchange', handleFsChange);
        };
    }, [isFloorMapFullscreen]);

    const toggleFullscreen = (targetState) => {
        const next = typeof targetState === 'boolean' ? targetState : !isFloorMapFullscreen;
        setIsFloorMapFullscreen(next);
        if (next) {
            try {
                if (document.documentElement.requestFullscreen) {
                    document.documentElement.requestFullscreen().catch(() => {});
                }
            } catch (err) {}
        } else {
            try {
                if (document.fullscreenElement && document.exitFullscreen) {
                    document.exitFullscreen().catch(() => {});
                }
            } catch (err) {}
        }
    };

    // Sorter Profile Management State
    const [profilesList, setProfilesList] = useState([
        { id: 'PROFILE_BRAND_DEALER', name: 'Standart Marka / Bayi Modu', description: 'Her marka ve bayi tekil sabit gözüne ayrıştırılır.', icon: '🎯' },
        { id: 'PROFILE_CASCADE_OVERFLOW', name: 'Otomatik Kaskad Taşma Modu', description: 'Tek bayiye birden fazla göz atanır. Koli dolunca sıradaki göze taşar.', icon: '🌊' },
        { id: 'PROFILE_PRODUCT_SIZE_SPLIT', name: 'Ürün Modeli & Beden Modu', description: 'Mont, Pantolon veya Beden (S, M, L, XL) ayrımı yapılarak ayrıştırılır.', icon: '👕' },
        { id: 'PROFILE_DYNAMIC_PACKING', name: 'Dinamik Koli Dolum & Etiket', description: 'Koli hedef adedine ulaştığında koli etiketi tetiklenir ve yeni koliye geçer.', icon: '📦' },
        { id: 'PROFILE_SMART_HYBRID', name: 'Akıllı Hibrit Mod', description: 'Sipariş hacmi ve çeşitliliğine göre kaskad ve model kurallarını hibrit uygular.', icon: '⚡' }
    ]);
    const [activeProfile, setActiveProfile] = useState('PROFILE_BRAND_DEALER');
    const [isSwitchingProfile, setIsSwitchingProfile] = useState(false);

    // Chute Mapping State
    const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);
    const [mappingModalTab, setMappingModalTab] = useState('ORDER'); // 'ORDER' | 'MANUAL'
    const [sorterMappings, setSorterMappings] = useState([]);
    const [newMappingDest, setNewMappingDest] = useState('');
    const [newMappingChute, setNewMappingChute] = useState(1);
    const [newMappingType, setNewMappingType] = useState('DEALER');
    const [newMappingPriority, setNewMappingPriority] = useState(1);
    const [newMappingCapacity, setNewMappingCapacity] = useState(25);

    // Order-Based Automatic Chute Allocation State
    const [orderSearchQuery, setOrderSearchQuery] = useState('');
    const [orderSearchResults, setOrderSearchResults] = useState([]);
    const [isSearchingOrders, setIsSearchingOrders] = useState(false);
    const [selectedOrderForReserve, setSelectedOrderForReserve] = useState(null);
    const [reserveOrderNumber, setReserveOrderNumber] = useState('');
    const [reserveCustomerName, setReserveCustomerName] = useState('');
    const [reserveBrand, setReserveBrand] = useState('GENEL');
    const [reserveTotalQty, setReserveTotalQty] = useState(50);
    const [reserveBoxCap, setReserveBoxCap] = useState(25);
    const [availableChuteData, setAvailableChuteData] = useState(null);
    const [selectedReservationChutes, setSelectedReservationChutes] = useState([]);
    const [isReservingOrder, setIsReservingOrder] = useState(false);
    const [orderReservationFeedback, setOrderReservationFeedback] = useState(null);

    // Size-Based Chute Splitting State
    const [splitBySize, setSplitBySize] = useState(false);
    const [orderSizes, setOrderSizes] = useState([]);
    const [isLoadingOrderSizes, setIsLoadingOrderSizes] = useState(false);
    const [sizeAllocations, setSizeAllocations] = useState({}); // { [size]: [chute_no, ...] }
    const [activeEditingSize, setActiveEditingSize] = useState(null);

    // Cart & Wall Labels Printing State
    const [isCartLabelsModalOpen, setIsCartLabelsModalOpen] = useState(false);
    const [isPrintingCartLabels, setIsPrintingCartLabels] = useState(false);
    const [cartLabelsPrintFeedback, setCartLabelsPrintFeedback] = useState(null);
    const [selectedCartCodes, setSelectedCartCodes] = useState(new Set());
    const [cartLabelsTab, setCartLabelsTab] = useState('ALL'); // 'ALL' | 'CHUTE' | 'CART' | 'WALL'
    const [selectedCartFilter, setSelectedCartFilter] = useState('ALL'); // 'ALL' | 'R01'..'R16'
    const [labelProfile, setLabelProfile] = useState('STANDARD'); // 'STANDARD' (Normal Çipsiz) | 'RFID' (Çipli)
    const [printerTarget, setPrinterTarget] = useState('TSC'); // 'TSC' (TSC TTP-244CE) | 'SATO' (SATO CL4NX Plus)

    const CART_AND_WALL_ITEMS = [
        // 16 Taşıma Arabası (Ana Etiketler)
        { code: 'R01', type: 'CART', label: 'Taşıma Arabası - R01 (9 Göz)' },
        { code: 'R02', type: 'CART', label: 'Taşıma Arabası - R02 (9 Göz)' },
        { code: 'R03', type: 'CART', label: 'Taşıma Arabası - R03 (9 Göz)' },
        { code: 'R04', type: 'CART', label: 'Taşıma Arabası - R04 (9 Göz)' },
        { code: 'R05', type: 'CART', label: 'Taşıma Arabası - R05 (9 Göz)' },
        { code: 'R06', type: 'CART', label: 'Taşıma Arabası - R06 (9 Göz)' },
        { code: 'R07', type: 'CART', label: 'Taşıma Arabası - R07 (9 Göz)' },
        { code: 'R08', type: 'CART', label: 'Taşıma Arabası - R08 (9 Göz)' },
        { code: 'R09', type: 'CART', label: 'Taşıma Arabası - R09 (6 Göz)' },
        { code: 'R10', type: 'CART', label: 'Taşıma Arabası - R10 (6 Göz)' },
        { code: 'R11', type: 'CART', label: 'Taşıma Arabası - R11 (6 Göz)' },
        { code: 'R12', type: 'CART', label: 'Taşıma Arabası - R12 (6 Göz)' },
        { code: 'R13', type: 'CART', label: 'Taşıma Arabası - R13 (6 Göz)' },
        { code: 'R14', type: 'CART', label: 'Taşıma Arabası - R14 (6 Göz)' },
        { code: 'R15', type: 'CART', label: 'Taşıma Arabası - R15 (6 Göz)' },
        { code: 'R16', type: 'CART', label: 'Taşıma Arabası - R16 (6 Göz)' },

        // 8 Duvar Modülü
        { code: 'M145-WALL-A-0', type: 'WALL', label: 'Bölüm 1 (Sol Dış) - Z-A0-1 [6 Göz]' },
        { code: 'M145-WALL-B-0', type: 'WALL', label: 'Bölüm 3 (Sağ İç) - Z-B0-1 [6 Göz]' },
        { code: 'M145-WALL-A-1', type: 'WALL', label: 'Bölüm 1 (Sol Dış) - Z-A1-1 [9 Göz]' },
        { code: 'M145-WALL-B-1', type: 'WALL', label: 'Bölüm 3 (Sağ İç) - Z-B1-1 [9 Göz]' },
        { code: 'M145-WALL-A-3', type: 'WALL', label: 'Bölüm 2 (Sol İç) - Z-A3-1 [9 Göz]' },
        { code: 'M145-WALL-B-3', type: 'WALL', label: 'Bölüm 4 (Sağ Dış) - Z-B3-1 [9 Göz]' },
        { code: 'M145-WALL-A-4', type: 'WALL', label: 'Bölüm 2 (Sol İç) - Z-A4-1 [6 Göz]' },
        { code: 'M145-WALL-B-4', type: 'WALL', label: 'Bölüm 4 (Sağ Dış) - Z-B4-1 [6 Göz]' },

        // 120 Araba Gözü (R01.1 .. R08.9 & R09.1 .. R16.6)
        ...(() => {
            const list = [];
            for (let c = 1; c <= 8; c++) {
                const cartStr = `R${c.toString().padStart(2, '0')}`;
                for (let k = 1; k <= 9; k++) {
                    let kat = 1;
                    if (k >= 7) kat = 3;
                    else if (k >= 4) kat = 2;
                    list.push({
                        code: `${cartStr}.${k}`,
                        type: 'CHUTE',
                        cart: cartStr,
                        label: `Araba ${cartStr} - Göz ${k} (Kat ${kat})`
                    });
                }
            }
            for (let c = 9; c <= 16; c++) {
                const cartStr = `R${c.toString().padStart(2, '0')}`;
                for (let k = 1; k <= 6; k++) {
                    let kat = 1;
                    if (k >= 5) kat = 3;
                    else if (k >= 3) kat = 2;
                    list.push({
                        code: `${cartStr}.${k}`,
                        type: 'CHUTE',
                        cart: cartStr,
                        label: `Araba ${cartStr} - Göz ${k} (Kat ${kat})`
                    });
                }
            }
            return list;
        })()
    ];

    const handlePrintCartLabels = async (codesToPrint) => {
        try {
            setIsPrintingCartLabels(true);
            setCartLabelsPrintFeedback(null);
            const res = await fetch(`${API_BASE_URL}/api/printer/print-cart-labels`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ codes: codesToPrint, profile: labelProfile, printer_target: printerTarget })
            });
            const data = await res.json();
            if (data.success) {
                setCartLabelsPrintFeedback({ type: 'success', text: data.message || `Etiketler ${printerTarget === 'TSC' ? 'TSC TTP-244CE' : 'SATO'} yazıcıya başarıyla gönderildi!` });
            } else {
                setCartLabelsPrintFeedback({ type: 'error', text: data.error || 'Yazdırma sırasında bir hata oluştu.' });
            }
        } catch (e) {
            setCartLabelsPrintFeedback({ type: 'error', text: e.message || 'Yazıcı sunucusuna ulaşılamadı.' });
        } finally {
            setIsPrintingCartLabels(false);
        }
    };

    const handleOpenHtmlPrintView = (codesToPrint) => {
        const codesQuery = codesToPrint && codesToPrint.length > 0 ? `codes=${codesToPrint.join(',')}` : '';
        window.open(`${API_BASE_URL}/api/printer/print-cart-labels-html?${codesQuery}`, '_blank');
    };

    const toggleCartCodeSelection = (code) => {
        const next = new Set(selectedCartCodes);
        if (next.has(code)) next.delete(code);
        else next.add(code);
        setSelectedCartCodes(next);
    };

    const selectAllCartCodes = () => {
        if (selectedCartCodes.size === CART_AND_WALL_ITEMS.length) {
            setSelectedCartCodes(new Set());
        } else {
            setSelectedCartCodes(new Set(CART_AND_WALL_ITEMS.map(x => x.code)));
        }
    };

    // Heartbeat Settings State
    const [isHeartbeatSettingsOpen, setIsHeartbeatSettingsOpen] = useState(false);
    const [heartbeatInterval, setHeartbeatInterval] = useState(() => {
        const saved = localStorage.getItem('hc_heartbeatInterval');
        return saved ? parseInt(saved, 10) : 3000;
    });

    const [isHeartbeatEnabled, setIsHeartbeatEnabled] = useState(() => {
        const saved = localStorage.getItem('hc_isHeartbeatEnabled');
        return saved !== null ? JSON.parse(saved) : true;
    });

    useEffect(() => {
        localStorage.setItem('hc_heartbeatInterval', heartbeatInterval);
    }, [heartbeatInterval]);

    useEffect(() => {
        localStorage.setItem('hc_isHeartbeatEnabled', isHeartbeatEnabled);
    }, [isHeartbeatEnabled]);

    // LED Strip Commissioning & Control State (Section 6.2 mult-led Rebuild)
    const [isLedModalOpen, setIsLedModalOpen] = useState(false);
    const [ledActiveTab, setLedActiveTab] = useState('ALL'); // 'ALL' | 'DUAL' | 'WALLS' | 'CHUTE'
    const [ledSelectedColor, setLedSelectedColor] = useState('GREEN');
    const [ledSelectedMode, setLedSelectedMode] = useState('SOLID');
    const [ledSelectedTarget, setLedSelectedTarget] = useState('ALL');
    const [ledSelectedChute, setLedSelectedChute] = useState(1);
    const [isSendingLedCmd, setIsSendingLedCmd] = useState(false);
    const [ledFeedback, setLedFeedback] = useState(null);
    const [ledLogs, setLedLogs] = useState([]);

    // Dual-Color State (Duvar Ana Şeridi vs Göz Şeritleri)
    const [dualScope, setDualScope] = useState('ALL'); // 'ALL' | 'WALL' | 'CHUTE'
    const [dualSelectedWall, setDualSelectedWall] = useState('M145-WALL-A-1');
    const [dualSelectedChute, setDualSelectedChute] = useState(1);
    const [customWallColor, setCustomWallColor] = useState('BLUE');
    const [customWallMode, setCustomWallMode] = useState('SOLID');
    const [customChuteColor, setCustomChuteColor] = useState('GREEN');
    const [customChuteMode, setCustomChuteMode] = useState('SOLID');

    const addLedLog = (msg, success = true) => {
        const time = new Date().toLocaleTimeString();
        setLedLogs(prev => [{ time, msg, success }, ...prev.slice(0, 7)]);
    };

    const handleSendDualLedCommand = async (wallColor, chuteColor, wallMode = 'SOLID', chuteMode = 'SOLID', overrideScope = null) => {
        const scope = overrideScope || dualScope;
        setIsSendingLedCmd(true);
        try {
            let endpoint = `${API_BASE_URL}/api/wms/sorter/led/set-all`;
            let payload = { wallColor, chuteColor, wallMode, chuteMode };

            if (scope === 'ALL') {
                endpoint = `${API_BASE_URL}/api/wms/sorter/led/set-all`;
            } else if (scope === 'WALL') {
                endpoint = `${API_BASE_URL}/api/wms/sorter/led/test`;
                payload.wallId = dualSelectedWall;
            } else if (scope === 'CHUTE') {
                endpoint = `${API_BASE_URL}/api/wms/sorter/led/test`;
                payload.chuteNo = dualSelectedChute;
                payload.physicalCode = chToPhysicalMap[dualSelectedChute];
            }

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                const targetText = scope === 'ALL' ? 'Tüm Makine' : (scope === 'WALL' ? dualSelectedWall : `Göz #${dualSelectedChute}`);
                setLedFeedback({ type: 'success', text: `✅ [${targetText}] Çift Renk: Duvar [${wallColor} - ${wallMode}] + Göz [${chuteColor} - ${chuteMode}] uygulandı!` });
                addLedLog(`${targetText} -> Duvar:${wallColor} / Göz:${chuteColor} [OK]`, true);
            } else {
                setLedFeedback({ type: 'error', text: `❌ Sorter Hatası: ${data.message || 'Hata'}` });
                addLedLog(`HATA: ${data.message}`, false);
            }
        } catch (e) {
            setLedFeedback({ type: 'error', text: 'Bağlantı hatası: ' + e.message });
            addLedLog(`Bağlantı hatası: ${e.message}`, false);
        } finally {
            setIsSendingLedCmd(false);
        }
    };

    const handleSendLedCommand = async (customColor, customMode, customTarget) => {
        const color = customColor || ledSelectedColor;
        const mode = customMode || ledSelectedMode;
        const target = customTarget !== undefined ? customTarget : ledSelectedTarget;

        setIsSendingLedCmd(true);
        try {
            if (target === 'ALL') {
                const res = await fetch(`${API_BASE_URL}/api/wms/sorter/led/set-all`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ color, mode })
                });
                const data = await res.json();
                if (data.success) {
                    setLedFeedback({ type: 'success', text: `✅ TÜM MAKİNE: ${color} (${mode}) sinyali Sorter Controller'a başarıyla iletildi!` });
                    addLedLog(`Tüm Makine -> ${color} (${mode}) [HTTP 200 OK]`, true);
                } else {
                    setLedFeedback({ type: 'error', text: `❌ Sorter Hatası: ${data.message || 'Hata oluştu'}` });
                    addLedLog(`HATA: ${data.message}`, false);
                }
            } else if (target.startsWith('WALL_')) {
                const wallId = target.replace('WALL_', '');
                const res = await fetch(`${API_BASE_URL}/api/wms/sorter/led/test`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ wallId, color, mode })
                });
                const data = await res.json();
                if (data.success) {
                    setLedFeedback({ type: 'success', text: `✅ ${wallId}: ${color} (${mode}) modülü yandı!` });
                    addLedLog(`${wallId} -> ${color} (${mode}) [OK]`, true);
                } else {
                    setLedFeedback({ type: 'error', text: `❌ ${data.message || 'Hata'}` });
                    addLedLog(`HATA ${wallId}: ${data.message}`, false);
                }
            } else {
                const chuteNo = parseInt(target, 10);
                const res = await fetch(`${API_BASE_URL}/api/wms/sorter/led/test`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chuteNo, color, mode, physicalCode: chToPhysicalMap[chuteNo] })
                });
                const data = await res.json();
                if (data.success) {
                    setLedFeedback({ type: 'success', text: `✅ Göz #${chuteNo} (${chToPhysicalMap[chuteNo] || ''}): ${color} yandı!` });
                    addLedLog(`Göz #${chuteNo} (${chToPhysicalMap[chuteNo] || ''}) -> ${color} [OK]`, true);
                } else {
                    setLedFeedback({ type: 'error', text: `❌ ${data.message || 'Hata'}` });
                    addLedLog(`HATA Göz #${chuteNo}: ${data.message}`, false);
                }
            }
        } catch (e) {
            setLedFeedback({ type: 'error', text: 'Bağlantı hatası: ' + e.message });
            addLedLog(`Bağlantı hatası: ${e.message}`, false);
        } finally {
            setIsSendingLedCmd(false);
        }
    };

    const isLight = themeMode === 'light';

    // Load active profile and settings on mount
    useEffect(() => {
        loadProfiles();
        loadMappings();
    }, []);

    const loadProfiles = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/wms/sorter/profiles`);
            const data = await response.json();
            if (data.success) {
                if (data.profiles && data.profiles.length > 0) setProfilesList(data.profiles);
                if (data.active_profile) setActiveProfile(data.active_profile);
            }
        } catch (err) {
            console.error('Failed to load sorter profiles', err);
        }
    };

    const handleSwitchProfile = async (profileId) => {
        setIsSwitchingProfile(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/wms/sorter/profile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profile: profileId })
            });
            const data = await response.json();
            if (data.success) {
                setActiveProfile(profileId);
            }
        } catch (err) {
            console.error('Failed to switch profile', err);
        } finally {
            setIsSwitchingProfile(false);
        }
    };

    const handleResetChute = async (chuteNo) => {
        try {
            await fetch(`${API_BASE_URL}/api/wms/sorter/chute-reset/${chuteNo}`, { method: 'POST' });
            if (selectedGate && selectedGate.chute_no === chuteNo) {
                setSelectedGate(prev => prev ? { ...prev, item_count: 0, load: 0, is_full: false, status: 'standby' } : null);
                setSelectedGateItems([]);
            }
            loadMappings();
            fetchStatus();
        } catch (err) {
            console.error('Failed to reset chute', err);
        }
    };

    const handleResetAllChutes = async () => {
        if (!window.confirm('Tüm 60 gözün toplanan ürün adetleri ve sepet kayıtları sıfırlanacaktır. Bu işlem geri alınamaz.\n\nOnaylıyor musunuz?')) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/wms/sorter/chutes-reset-all`, { method: 'POST' });
            if (response.ok) {
                setSelectedGate(null);
                setSelectedGateItems([]);
                fetchStatus();
                loadMappings();
            }
        } catch (err) {
            console.error('Failed to reset all chutes', err);
        }
    };

    const openChuteDetails = async (gate) => {
        const chNo = parseInt((gate.chute_no || gate.id).toString().replace('CH-', ''), 10);
        setSelectedGate({ ...gate, chute_no: chNo });
        setItemSearchQuery('');
        setIsLoadingGateItems(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/wms/sorter/chute/${chNo}/items`);
            const data = await res.json();
            if (data.success && Array.isArray(data.items)) {
                setSelectedGateItems(data.items);
            } else {
                setSelectedGateItems([]);
            }
        } catch (err) {
            console.error('Error fetching chute items:', err);
            setSelectedGateItems([]);
        } finally {
            setIsLoadingGateItems(false);
        }
    };

    useEffect(() => {
        let interval;
        const checkConnection = async () => {
            if (!isHeartbeatEnabled) return;
            try {
                const response = await fetch(`${API_BASE_URL}/api/wms/common/status/check`);
                const data = await response.json();
                setSorterConnected(data.connected);
            } catch (err) {
                setSorterConnected(false);
            }
        };
        
        if (isHeartbeatEnabled) {
            checkConnection();
            interval = setInterval(checkConnection, heartbeatInterval);
        } else {
            setSorterConnected(false); 
        }
        
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [heartbeatInterval, isHeartbeatEnabled]);

    const loadMappings = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/wms/sorter-mapping`);
            const data = await response.json();
            if (Array.isArray(data)) {
                setSorterMappings(data);
            } else {
                setSorterMappings([]);
            }
        } catch (err) {
            console.error('Failed to load mappings', err);
        }
    };

    const handleSaveMapping = async () => {
        if (!newMappingDest.trim()) {
            alert('Lütfen bir hedef/bayi/ürün adı girin.');
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/api/wms/sorter-mapping`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    destination_name: newMappingDest,
                    chute_no: newMappingChute,
                    match_type: newMappingType,
                    priority: newMappingPriority,
                    target_capacity: newMappingCapacity
                })
            });
            if (response.ok) {
                setNewMappingDest('');
                setNewMappingPriority(1);
                loadMappings();
                fetchStatus();
            }
        } catch (err) {
            console.error('Failed to save mapping', err);
        }
    };

    const handleDeleteMapping = async (id) => {
        try {
            await fetch(`${API_BASE_URL}/api/wms/sorter-mapping/${id}`, { method: 'DELETE' });
            loadMappings();
            fetchStatus();
        } catch (err) {
            console.error('Failed to delete mapping', err);
        }
    };

    // --- Order-Based Chute Allocation & Reservation Handlers ---
    const searchOrdersForSorter = async (query) => {
        setIsSearchingOrders(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/wms/sorter/orders/search?q=${encodeURIComponent(query || '')}`);
            const data = await res.json();
            if (data.success) {
                setOrderSearchResults(data.orders || []);
            }
        } catch (e) {
            console.error('Failed to search orders', e);
        } finally {
            setIsSearchingOrders(false);
        }
    };

    const fetchAvailableChutesForOrder = async (qty, cap) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/wms/sorter/chutes/available?total_quantity=${qty || 0}&box_capacity=${cap || 25}`);
            const data = await res.json();
            if (data.success) {
                setAvailableChuteData(data);
                if (data.suggested_chutes && data.suggested_chutes.length > 0) {
                    setSelectedReservationChutes(data.suggested_chutes.map(c => c.chute_no));
                }
            }
        } catch (e) {
            console.error('Failed to fetch available chutes', e);
        }
    };

    const fetchOrderSizes = async (orderNum, cap) => {
        if (!orderNum) {
            setOrderSizes([]);
            setSizeAllocations({});
            return;
        }
        setIsLoadingOrderSizes(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/wms/sorter/orders/${encodeURIComponent(orderNum)}/sizes?box_capacity=${cap || reserveBoxCap || 25}`);
            const data = await res.json();
            if (data.success && Array.isArray(data.sizes)) {
                setOrderSizes(data.sizes);
                setSizeAllocations(prev => {
                    const next = {};
                    data.sizes.forEach(s => {
                        next[s.size] = prev[s.size] || [];
                    });
                    return next;
                });
                if (data.sizes.length > 0) {
                    setActiveEditingSize(prev => prev && data.sizes.some(s => s.size === prev) ? prev : data.sizes[0].size);
                }
            } else {
                setOrderSizes([]);
            }
        } catch (e) {
            console.error('Failed to fetch order sizes', e);
            setOrderSizes([]);
        } finally {
            setIsLoadingOrderSizes(false);
        }
    };

    const handleSelectOrderForReservation = (ord) => {
        setSelectedOrderForReserve(ord);
        setReserveOrderNumber(String(ord.order_number));
        setReserveCustomerName(ord.customer_name);
        setReserveBrand(ord.brand);
        const qty = ord.remaining_quantity > 0 ? ord.remaining_quantity : ord.total_quantity;
        setReserveTotalQty(qty || 25);
        fetchAvailableChutesForOrder(qty || 25, reserveBoxCap);
        fetchOrderSizes(String(ord.order_number), reserveBoxCap);
    };

    const handleAutoAllocateSizes = () => {
        if (!availableChuteData || !availableChuteData.available_chutes || availableChuteData.available_chutes.length === 0) {
            alert('Sorter üzerinde boş göz bulunmuyor!');
            return;
        }
        if (!orderSizes || orderSizes.length === 0) {
            alert('Ayrıştırılacak beden listesi bulunamadı.');
            return;
        }

        const totalNeededChutes = orderSizes.reduce((sum, s) => sum + (s.needed_chutes || 1), 0);
        if (totalNeededChutes > availableChuteData.available_chutes.length) {
            if (!window.confirm(`Bu siparişteki bedenler için toplam ${totalNeededChutes} göz gerekiyor, ancak sorterda ${availableChuteData.available_chutes.length} boş göz var.\n\nYine de mevcut boş gözleri sırayla dağıtmak istiyor musunuz?`)) {
                return;
            }
        }

        let chuteIdx = 0;
        const newAllocations = {};
        const allAssigned = [];

        orderSizes.forEach(sizeItem => {
            const needed = sizeItem.needed_chutes || 1;
            const assignedForSize = [];
            for (let i = 0; i < needed && chuteIdx < availableChuteData.available_chutes.length; i++) {
                const ch = availableChuteData.available_chutes[chuteIdx];
                assignedForSize.push(ch.chute_no);
                allAssigned.push(ch.chute_no);
                chuteIdx++;
            }
            newAllocations[sizeItem.size] = assignedForSize;
        });

        setSizeAllocations(newAllocations);
        setSelectedReservationChutes(allAssigned);
    };

    const handleToggleChuteForActiveSize = (chuteNo) => {
        if (!splitBySize) {
            if (selectedReservationChutes.includes(chuteNo)) {
                setSelectedReservationChutes(selectedReservationChutes.filter(n => n !== chuteNo));
            } else {
                setSelectedReservationChutes([...selectedReservationChutes, chuteNo]);
            }
            return;
        }

        if (!activeEditingSize) {
            alert('Lütfen önce yukarıdan bir beden seçin.');
            return;
        }

        setSizeAllocations(prev => {
            const next = { ...prev };
            const currentForActive = next[activeEditingSize] || [];

            if (currentForActive.includes(chuteNo)) {
                next[activeEditingSize] = currentForActive.filter(n => n !== chuteNo);
            } else {
                // If it's assigned to any other size, unassign it first
                Object.keys(next).forEach(sz => {
                    if (sz !== activeEditingSize) {
                        next[sz] = (next[sz] || []).filter(n => n !== chuteNo);
                    }
                });
                next[activeEditingSize] = [...currentForActive, chuteNo];
            }

            const allChutes = Object.values(next).flat();
            setSelectedReservationChutes(allChutes);
            return next;
        });
    };

    const handleRemoveChuteFromSize = (sizeName, chuteNo, e) => {
        if (e) e.stopPropagation();
        setSizeAllocations(prev => {
            const next = { ...prev };
            next[sizeName] = (next[sizeName] || []).filter(n => n !== chuteNo);
            const allChutes = Object.values(next).flat();
            setSelectedReservationChutes(allChutes);
            return next;
        });
    };

    const handleExecuteOrderReservation = async () => {
        if (!reserveOrderNumber) {
            alert('Lütfen bir sipariş numarası girin veya listeden seçin.');
            return;
        }

        if (splitBySize) {
            const assignedSizes = Object.entries(sizeAllocations).filter(([_, chutes]) => chutes && chutes.length > 0);
            if (assignedSizes.length === 0) {
                alert('Lütfen en az bir beden için sorter gözü belirleyin.');
                return;
            }

            const unallocated = orderSizes.filter(s => !sizeAllocations[s.size] || sizeAllocations[s.size].length === 0);
            if (unallocated.length > 0) {
                const unallocatedNames = unallocated.map(s => s.size).join(', ');
                if (!window.confirm(`Şu bedenlere henüz göz atanmadı: [${unallocatedNames}].\n\nBu bedenler sorter induction okumasında tanımlanmamış olacaktır. Yine de devam etmek istiyor musunuz?`)) {
                    return;
                }
            }

            const payloadAllocations = assignedSizes.map(([size, chute_numbers]) => ({ size, chute_numbers }));

            setIsReservingOrder(true);
            try {
                const res = await fetch(`${API_BASE_URL}/api/wms/sorter/orders/reserve`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        order_number: reserveOrderNumber,
                        customer_name: reserveCustomerName,
                        brand: reserveBrand,
                        total_quantity: reserveTotalQty,
                        box_capacity: reserveBoxCap,
                        split_by_size: true,
                        size_allocations: payloadAllocations
                    })
                });
                const data = await res.json();
                if (data.success) {
                    setOrderReservationFeedback({ success: true, message: data.msg });
                    loadMappings();
                    fetchStatus();
                    fetchAvailableChutesForOrder(reserveTotalQty, reserveBoxCap);
                    fetchOrderSizes(reserveOrderNumber, reserveBoxCap);
                    setTimeout(() => setOrderReservationFeedback(null), 5000);
                } else {
                    alert(data.error || 'Rezervasyon başarısız oldu.');
                }
            } catch (e) {
                console.error('Error reserving order size chutes:', e);
                alert('Sunucu hatası: ' + e.message);
            } finally {
                setIsReservingOrder(false);
            }
            return;
        }

        if (selectedReservationChutes.length === 0) {
            alert('Lütfen rezerve edilecek en az 1 göz seçin.');
            return;
        }

        setIsReservingOrder(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/wms/sorter/orders/reserve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    order_number: reserveOrderNumber,
                    customer_name: reserveCustomerName,
                    brand: reserveBrand,
                    total_quantity: reserveTotalQty,
                    box_capacity: reserveBoxCap,
                    chute_numbers: selectedReservationChutes
                })
            });
            const data = await res.json();
            if (data.success) {
                setOrderReservationFeedback({ success: true, message: data.msg });
                loadMappings();
                fetchStatus();
                fetchAvailableChutesForOrder(reserveTotalQty, reserveBoxCap);
                setTimeout(() => setOrderReservationFeedback(null), 5000);
            } else {
                alert(data.error || 'Rezervasyon başarısız oldu.');
            }
        } catch (e) {
            console.error('Error reserving order chutes:', e);
            alert('Sunucu hatası: ' + e.message);
        } finally {
            setIsReservingOrder(false);
        }
    };

    const handleReleaseOrderReservation = async (orderNum, destName) => {
        if (!window.confirm(`Sipariş #${orderNum} göz rezervasyonlarını serbest bırakmak istediğinize emin misiniz?`)) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/wms/sorter/orders/release`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order_number: orderNum, destination_name: destName })
            });
            if (res.ok) {
                loadMappings();
                fetchStatus();
                fetchAvailableChutesForOrder(reserveTotalQty, reserveBoxCap);
            }
        } catch (e) {
            console.error('Failed to release order chutes', e);
        }
    };

    // Map CH-XX from database to physical OmniSort Mini label codes (4 Walls x 15 Chutes)
    const physicalToChMap = {
        // A0 (6 Göz - Araba R09)
        'A0-1': 'CH-10', 'A0-2': 'CH-11', 'A0-3': 'CH-12', 'A0-4': 'CH-13', 'A0-5': 'CH-14', 'A0-6': 'CH-15',
        'R09.1': 'CH-10', 'R09.2': 'CH-11', 'R09.3': 'CH-12', 'R09.4': 'CH-13', 'R09.5': 'CH-14', 'R09.6': 'CH-15',

        // A1 (9 Göz - Araba R01)
        'A1-1': 'CH-01', 'A1-2': 'CH-02', 'A1-3': 'CH-03', 'A1-4': 'CH-04', 'A1-5': 'CH-05', 'A1-6': 'CH-06', 'A1-7': 'CH-07', 'A1-8': 'CH-08', 'A1-9': 'CH-09',
        'R01.1': 'CH-01', 'R01.2': 'CH-02', 'R01.3': 'CH-03', 'R01.4': 'CH-04', 'R01.5': 'CH-05', 'R01.6': 'CH-06', 'R01.7': 'CH-07', 'R01.8': 'CH-08', 'R01.9': 'CH-09',

        // A2 (3 Göz / Asansör Arkası Hata ve Tanımsız Kontrol Gözleri)
        'A2-1': 'CH-61', 'A2-2': 'CH-62', 'A2-3': 'CH-63',
        'A2.1': 'CH-61', 'A2.2': 'CH-62', 'A2.3': 'CH-63',

        // A3 (9 Göz - Araba R02)
        'A3-1': 'CH-16', 'A3-2': 'CH-17', 'A3-3': 'CH-18', 'A3-4': 'CH-19', 'A3-5': 'CH-20', 'A3-6': 'CH-21', 'A3-7': 'CH-22', 'A3-8': 'CH-23', 'A3-9': 'CH-24',
        'R02.1': 'CH-16', 'R02.2': 'CH-17', 'R02.3': 'CH-18', 'R02.4': 'CH-19', 'R02.5': 'CH-20', 'R02.6': 'CH-21', 'R02.7': 'CH-22', 'R02.8': 'CH-23', 'R02.9': 'CH-24',

        // A4 (6 Göz - Araba R10)
        'A4-1': 'CH-25', 'A4-2': 'CH-26', 'A4-3': 'CH-27', 'A4-4': 'CH-28', 'A4-5': 'CH-29', 'A4-6': 'CH-30',
        'R10.1': 'CH-25', 'R10.2': 'CH-26', 'R10.3': 'CH-27', 'R10.4': 'CH-28', 'R10.5': 'CH-29', 'R10.6': 'CH-30',

        // B1 (9 Göz - Araba R03)
        'B1-1': 'CH-31', 'B1-2': 'CH-32', 'B1-3': 'CH-33', 'B1-4': 'CH-34', 'B1-5': 'CH-35', 'B1-6': 'CH-36', 'B1-7': 'CH-37', 'B1-8': 'CH-38', 'B1-9': 'CH-39',
        'R03.1': 'CH-31', 'R03.2': 'CH-32', 'R03.3': 'CH-33', 'R03.4': 'CH-34', 'R03.5': 'CH-35', 'R03.6': 'CH-36', 'R03.7': 'CH-37', 'R03.8': 'CH-38', 'R03.9': 'CH-39',

        // B0 (6 Göz - Araba R11)
        'B0-1': 'CH-40', 'B0-2': 'CH-41', 'B0-3': 'CH-42', 'B0-4': 'CH-43', 'B0-5': 'CH-44', 'B0-6': 'CH-45',
        'R11.1': 'CH-40', 'R11.2': 'CH-41', 'R11.3': 'CH-42', 'R11.4': 'CH-43', 'R11.5': 'CH-44', 'R11.6': 'CH-45',

        // B3 (9 Göz - Araba R04)
        'B3-1': 'CH-46', 'B3-2': 'CH-47', 'B3-3': 'CH-48', 'B3-4': 'CH-49', 'B3-5': 'CH-50', 'B3-6': 'CH-51', 'B3-7': 'CH-52', 'B3-8': 'CH-53', 'B3-9': 'CH-54',
        'R04.1': 'CH-46', 'R04.2': 'CH-47', 'R04.3': 'CH-48', 'R04.4': 'CH-49', 'R04.5': 'CH-50', 'R04.6': 'CH-51', 'R04.7': 'CH-52', 'R04.8': 'CH-53', 'R04.9': 'CH-54',

        // B4 (6 Göz - Araba R12)
        'B4-1': 'CH-55', 'B4-2': 'CH-56', 'B4-3': 'CH-57', 'B4-4': 'CH-58', 'B4-5': 'CH-59', 'B4-6': 'CH-60',
        'R12.1': 'CH-55', 'R12.2': 'CH-56', 'R12.3': 'CH-57', 'R12.4': 'CH-58', 'R12.5': 'CH-59', 'R12.6': 'CH-60'
    };

    const chToPhysicalMap = {
        1: 'A1-1', 2: 'A1-2', 3: 'A1-3', 4: 'A1-4', 5: 'A1-5', 6: 'A1-6', 7: 'A1-7', 8: 'A1-8', 9: 'A1-9',
        10: 'A0-1', 11: 'A0-2', 12: 'A0-3', 13: 'A0-4', 14: 'A0-5', 15: 'A0-6',
        16: 'A3-1', 17: 'A3-2', 18: 'A3-3', 19: 'A3-4', 20: 'A3-5', 21: 'A3-6', 22: 'A3-7', 23: 'A3-8', 24: 'A3-9',
        25: 'A4-1', 26: 'A4-2', 27: 'A4-3', 28: 'A4-4', 29: 'A4-5', 30: 'A4-6',
        31: 'B1-1', 32: 'B1-2', 33: 'B1-3', 34: 'B1-4', 35: 'B1-5', 36: 'B1-6', 37: 'B1-7', 38: 'B1-8', 39: 'B1-9',
        40: 'B0-1', 41: 'B0-2', 42: 'B0-3', 43: 'B0-4', 44: 'B0-5', 45: 'B0-6',
        46: 'B3-1', 47: 'B3-2', 48: 'B3-3', 49: 'B3-4', 50: 'B3-5', 51: 'B3-6', 52: 'B3-7', 53: 'B3-8', 54: 'B3-9',
        55: 'B4-1', 56: 'B4-2', 57: 'B4-3', 58: 'B4-4', 59: 'B4-5', 60: 'B4-6',
        61: 'A2-1', 62: 'A2-2', 63: 'A2-3'
    };

    // Initial 63 gates generation (60 standard + 3 elevator control chutes)
    const generateInitialGates = () => {
        return Array.from({ length: 63 }, (_, i) => {
            const chNo = i + 1;
            const phys = chToPhysicalMap[chNo] || `CH-${chNo.toString().padStart(2, '0')}`;
            const mod15 = ((chNo - 1) % 15) + 1;
            let floorNum = 1;
            let floorLabel = "Kat 1 (Alt)";
            if (chNo >= 61) {
                floorNum = chNo === 61 ? 3 : (chNo === 62 ? 2 : 1);
                floorLabel = `Kat ${floorNum} (Asansör Arkası)`;
            } else if (mod15 >= 1 && mod15 <= 5) { floorNum = 1; floorLabel = "Kat 1 (Alt)"; }
            else if (mod15 >= 6 && mod15 <= 10) { floorNum = 2; floorLabel = "Kat 2 (Orta)"; }
            else if (mod15 >= 11 && mod15 <= 15) { floorNum = 3; floorLabel = "Kat 3 (Üst)"; }

            let wallId = "M145-WALL-1";
            let wallName = "Bölüm 1 (Sol Dış)";
            if (chNo >= 61) { wallId = "M145-WALL-A-2"; wallName = "Orta Asansör Arkası (A2)"; }
            else if (chNo >= 16 && chNo <= 30) { wallId = "M145-WALL-2"; wallName = "Bölüm 2 (Sol İç)"; }
            else if (chNo >= 31 && chNo <= 45) { wallId = "M145-WALL-3"; wallName = "Bölüm 3 (Sağ İç)"; }
            else if (chNo >= 46 && chNo <= 60) { wallId = "M145-WALL-4"; wallName = "Bölüm 4 (Sağ Dış)"; }

            return {
                id: `CH-${chNo.toString().padStart(2, '0')}`,
                chute_no: chNo,
                physical_code: phys,
                wall_id: wallId,
                wall_name: wallName,
                floor_num: floorNum,
                floor_label: floorLabel,
                destination: '---',
                match_type: 'DEALER',
                item_count: 0,
                target_capacity: 25,
                load: 0,
                status: 'standby',
                is_full: false,
                last_barcode: '',
                last_product_name: ''
            };
        });
    };

    const [sorterGates, setSorterGates] = useState(generateInitialGates());

    // Live Data Loop
    const fetchStatus = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/wms/white/grid/status`);
            if (res.ok) {
                const result = await res.json();
                if (result && result.success && result.data) {
                    if (Array.isArray(result.data.gates)) {
                        setSorterGates(result.data.gates);
                    }
                    setRfidData({
                        scanned: result.data.throughput || 0,
                        errors: result.data.errorCount || 0,
                        efficiency: result.data.efficiency || 99.8
                    });
                }
            }
        } catch (err) {
            console.error("Hardware Dashboard fetch error:", err);
        }
    };

    useEffect(() => {
        let isMounted = true;
        fetchStatus();
        const interval = setInterval(fetchStatus, 3000);
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    const resolveErrors = () => {
        setIsDiagnosing(true);
        setTimeout(() => {
            setSorterGates(prev => prev.map(g => g.status === 'error' ? { ...g, status: 'standby' } : g));
            setIsDiagnosing(false);
        }, 2000);
    };

    // Filtered tracking list for live table
    const filteredTrackingGates = sorterGates.filter(gate => {
        if (filterWall !== 'ALL' && gate.wall_id !== filterWall) return false;
        if (filterFloor !== 'ALL' && gate.floor_num !== parseInt(filterFloor, 10)) return false;
        if (filterStatus === 'FULL' && !gate.is_full) return false;
        if (filterStatus === 'ACTIVE' && (gate.item_count === 0 || gate.is_full)) return false;
        if (filterStatus === 'EMPTY' && gate.item_count > 0) return false;
        if (filterStatus === 'ERROR' && gate.status !== 'error') return false;

        if (trackingSearchQuery.trim()) {
            const q = trackingSearchQuery.toLowerCase();
            const chMatch = gate.id.toLowerCase().includes(q);
            const physMatch = (gate.physical_code || '').toLowerCase().includes(q);
            const destMatch = (gate.destination || '').toLowerCase().includes(q);
            const bcMatch = (gate.last_barcode || '').toLowerCase().includes(q);
            const prodMatch = (gate.last_product_name || '').toLowerCase().includes(q);
            return chMatch || physMatch || destMatch || bcMatch || prodMatch;
        }
        return true;
    });

    const totalCollectedItems = sorterGates.reduce((sum, g) => sum + (g.item_count || 0), 0);
    const fullGatesCount = sorterGates.filter(g => g.is_full).length;
    const activeGatesCount = sorterGates.filter(g => g.item_count > 0 && !g.is_full).length;
    const emptyGatesCount = sorterGates.filter(g => !g.item_count || g.item_count === 0).length;

    return (
        <div className="hardware-dashboard-premium" style={{ 
            color: 'var(--text-primary)', 
            paddingBottom: '3rem',
            fontFamily: "'Inter', sans-serif"
        }}>
            {/* Header with Glass Effect */}
            <header className="glass-morphism" style={{ 
                marginBottom: '1.2rem', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '1.5rem 2.5rem',
                borderRadius: '1.5rem',
                border: isLight ? '1px solid rgba(15,23,42,0.08)' : '1px solid rgba(255,255,255,0.08)',
                background: isLight ? 'rgba(15,23,42,0.02)' : 'rgba(255,255,255,0.02)',
                boxShadow: isLight ? '0 10px 25px rgba(0, 0, 0, 0.04)' : '0 20px 40px -12px rgba(0, 0, 0, 0.4)'
            }}>
                <div>
                    <button 
                        onClick={() => navigate('/admin')}
                        style={{ 
                            background: isLight ? 'rgba(15,23,42,0.05)' : 'rgba(255,255,255,0.05)', border: isLight ? '1px solid rgba(15,23,42,0.1)' : '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', 
                            padding: '0.5rem 1rem', borderRadius: '100px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '800',
                            marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: '0.3s'
                        }}
                        onMouseOver={e => e.currentTarget.style.background = 'var(--border-subtle)'}
                        onMouseOut={e => e.currentTarget.style.background = ''}
                    >
                        ← ANA SAYFAYA DÖN
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.3rem' }}>
                        <div style={{ 
                            width: '10px', height: '10px', borderRadius: '50%', 
                            background: !isHeartbeatEnabled ? 'var(--text-muted)' : (sorterConnected ? 'var(--color-success)' : 'var(--color-danger)'), 
                            boxShadow: !isHeartbeatEnabled ? 'none' : (sorterConnected ? '0 0 10px var(--color-success)' : '0 0 10px var(--color-danger)') 
                        }}></div>
                        <span style={{ 
                            fontSize: '0.75rem', fontWeight: '800', letterSpacing: '2px', 
                            color: !isHeartbeatEnabled ? 'var(--text-muted)' : (sorterConnected ? 'var(--color-success)' : 'var(--color-danger)'), 
                            textTransform: 'uppercase' 
                        }}>
                            {!isHeartbeatEnabled ? 'Heartbeat Disabled' : (sorterConnected ? 'System Live' : 'Connection Lost')}
                        </span>
                    </div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-1.5px', margin: 0 }}>
                        SORTER <span style={{ color: '#E60000', textShadow: '0 0 30px rgba(230,0,0,0.3)' }}>CORE</span>
                    </h1>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ background: isLight ? 'rgba(15,23,42,0.05)' : 'rgba(255,255,255,0.05)', padding: '0.4rem', borderRadius: '1rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        
                        <button onClick={() => setIsHeartbeatSettingsOpen(true)} style={{ 
                            background: isHeartbeatEnabled ? '#28a745' : 'var(--text-muted)',
                            border: 'none', color: '#fff', padding: '0.6rem 1.2rem', borderRadius: '0.8rem', cursor: 'pointer', fontWeight: '800', transition: '0.3s', fontSize: '0.8rem'
                        }}>
                            HEARTBEAT ({heartbeatInterval / 1000}s) ⚙️
                        </button>

                        <button onClick={() => { 
                            setIsMappingModalOpen(true); 
                            loadMappings(); 
                            searchOrdersForSorter('');
                            fetchAvailableChutesForOrder(reserveTotalQty, reserveBoxCap);
                        }} style={{ 
                            background: '#007BFF',
                            border: 'none', color: '#fff', padding: '0.6rem 1.2rem', borderRadius: '0.8rem', cursor: 'pointer', fontWeight: '800', transition: '0.3s', fontSize: '0.8rem'
                        }}>⚙️ EŞLEŞTİRME & REZERVASYON</button>

                        <button 
                            onClick={() => { setIsLedModalOpen(true); setLedFeedback(null); }}
                            title="OmniSort üzerindeki LED ışık şeritlerini kontrol et ve test et"
                            style={{ 
                                background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
                                border: 'none', color: '#fff', padding: '0.6rem 1.1rem', borderRadius: '0.8rem', cursor: 'pointer', fontWeight: '800', transition: '0.3s', fontSize: '0.8rem',
                                display: 'flex', alignItems: 'center', gap: '0.4rem',
                                boxShadow: '0 4px 12px rgba(13,148,136,0.3)'
                            }}
                            onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'}
                            onMouseOut={e => e.currentTarget.style.transform = 'none'}
                        >
                            <span>🌈</span> IŞIK ŞERİTLERİ (LED)
                        </button>

                        <button 
                            onClick={handleResetAllChutes}
                            title="Tüm 60 gözün toplanan ürün adetlerini ve sepet içeriğini sıfırlar"
                            style={{ 
                                background: '#dc2626',
                                border: 'none', color: '#fff', padding: '0.6rem 1.1rem', borderRadius: '0.8rem', cursor: 'pointer', fontWeight: '800', transition: '0.3s', fontSize: '0.8rem',
                                display: 'flex', alignItems: 'center', gap: '0.4rem'
                            }}
                            onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'}
                            onMouseOut={e => e.currentTarget.style.transform = 'none'}
                        >
                            <span>🧹</span> TÜMÜNÜ BOŞALT
                        </button>

                        <button onClick={() => setViewMode('grid')} style={{ 
                            background: viewMode === 'grid' ? '#E60000' : 'transparent',
                            border: 'none', color: viewMode === 'grid' ? '#fff' : 'var(--text-primary)', padding: '0.6rem 1.2rem', borderRadius: '0.8rem', cursor: 'pointer', fontWeight: '800', transition: '0.3s', fontSize: '0.8rem'
                        }}>🗺️ KAT HARİTASI</button>

                        <button onClick={() => setViewMode('tracking')} style={{ 
                            background: viewMode === 'tracking' ? '#E60000' : 'transparent',
                            border: 'none', color: viewMode === 'tracking' ? '#fff' : 'var(--text-primary)', padding: '0.6rem 1.2rem', borderRadius: '0.8rem', cursor: 'pointer', fontWeight: '800', transition: '0.3s', fontSize: '0.8rem'
                        }}>📋 CANLI TAKİP LİSTESİ</button>
                    </div>
                </div>
            </header>

            {/* Heartbeat Settings Popover Modal */}
            {isHeartbeatSettingsOpen && (
                <div 
                    onClick={() => setIsHeartbeatSettingsOpen(false)}
                    style={{
                        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                        zIndex: 11000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                >
                    <div 
                        onClick={e => e.stopPropagation()}
                        style={{
                            width: '340px',
                            background: isLight ? '#ffffff' : '#0f172a',
                            border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.15)',
                            borderRadius: '1.5rem', padding: '1.8rem',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                            display: 'flex', flexDirection: 'column', gap: '1.2rem'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.8rem' }}>
                            <span style={{ fontWeight: '900', fontSize: '1.1rem' }}>⚙️ Heartbeat Ayarları</span>
                            <button onClick={() => setIsHeartbeatSettingsOpen(false)} style={{ background: 'transparent', border: 'none', color: isLight ? '#000' : '#fff', fontSize: '1.8rem', fontWeight: 'bold', cursor: 'pointer', lineHeight: '1' }}>&times;</button>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: '800', fontSize: '0.9rem' }}>Sistem Durumu:</span>
                            <button 
                                onClick={() => setIsHeartbeatEnabled(!isHeartbeatEnabled)} 
                                style={{
                                    background: isHeartbeatEnabled ? '#dc2626' : '#16a34a',
                                    border: 'none', color: '#fff', padding: '0.5rem 1.2rem', borderRadius: '0.6rem',
                                    cursor: 'pointer', fontWeight: '900', fontSize: '0.85rem'
                                }}
                            >
                                {isHeartbeatEnabled ? 'DURDUR' : 'BAŞLAT'}
                            </button>
                        </div>

                        <div>
                            <span style={{ fontWeight: '800', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.6rem' }}>
                                Yoklama Sıklığı (Saniye):
                            </span>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                                {[1000, 3000, 5000, 10000].map(ms => (
                                    <button 
                                        key={ms} 
                                        onClick={() => { setHeartbeatInterval(ms); setIsHeartbeatSettingsOpen(false); }} 
                                        style={{
                                            background: heartbeatInterval === ms ? '#007BFF' : (isLight ? '#f1f5f9' : 'rgba(255,255,255,0.06)'),
                                            color: heartbeatInterval === ms ? '#fff' : 'var(--text-primary)',
                                            border: heartbeatInterval === ms ? '2px solid #007BFF' : (isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.1)'),
                                            padding: '0.6rem', borderRadius: '0.6rem', cursor: 'pointer',
                                            textAlign: 'center', fontWeight: '800', fontSize: '0.85rem',
                                            transition: '0.2s'
                                        }}
                                    >
                                        {ms / 1000} Saniye {heartbeatInterval === ms ? '✓' : ''}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sorter Operations Profile Bar */}
            <div className="glass-morphism" style={{
                background: isLight ? '#ffffff' : 'rgba(255,255,255,0.03)',
                border: isLight ? '1px solid rgba(15,23,42,0.1)' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '1.2rem',
                padding: '1rem 1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem',
                flexWrap: 'wrap',
                boxShadow: isLight ? '0 4px 15px rgba(0,0,0,0.03)' : '0 10px 25px rgba(0,0,0,0.2)',
                marginBottom: '1.2rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <span style={{ fontSize: '1.4rem' }}>⚙️</span>
                    <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            AKTİF SORTER ÇALIŞMA PROFİLİ
                        </div>
                        <div style={{ fontSize: '1.05rem', fontWeight: '900', color: '#007BFF' }}>
                            {profilesList.find(p => p.id === activeProfile)?.icon} {profilesList.find(p => p.id === activeProfile)?.name || 'Standart Marka / Bayi Modu'}
                        </div>
                    </div>
                </div>

                {/* Profile Switch Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {profilesList.map(p => {
                        const isSelected = activeProfile === p.id;
                        return (
                            <button
                                key={p.id}
                                onClick={() => handleSwitchProfile(p.id)}
                                disabled={isSwitchingProfile}
                                style={{
                                    padding: '0.6rem 1rem',
                                    borderRadius: '0.8rem',
                                    border: isSelected ? '2px solid #007BFF' : (isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.1)'),
                                    background: isSelected ? '#007BFF' : (isLight ? '#f8fafc' : 'rgba(255,255,255,0.05)'),
                                    color: isSelected ? '#ffffff' : 'var(--text-primary)',
                                    fontWeight: isSelected ? '900' : '700',
                                    fontSize: '0.8rem',
                                    cursor: isSwitchingProfile ? 'not-allowed' : 'pointer',
                                    transition: '0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    boxShadow: isSelected ? '0 4px 12px rgba(0,123,255,0.3)' : 'none'
                                }}
                            >
                                <span>{p.icon}</span>
                                <span>{p.name.split(' ')[0]} {p.name.split(' ')[1] || ''}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Quick Metrics Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <GlassCard glow="#007BFF">
                    <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-secondary)' }}>TOPLAM DÜŞEN ÜRÜN</div>
                    <div style={{ fontSize: '2rem', fontWeight: '900', color: '#007BFF', marginTop: '0.2rem' }}>
                        {totalCollectedItems} <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Adet</span>
                    </div>
                </GlassCard>

                <GlassCard glow="#ef4444">
                    <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-secondary)' }}>DOLU GÖZLER (KOLİLEME)</div>
                    <div style={{ fontSize: '2rem', fontWeight: '900', color: '#ef4444', marginTop: '0.2rem' }}>
                        {fullGatesCount} <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>/ 60 Göz</span>
                    </div>
                </GlassCard>

                <GlassCard glow="#10b981">
                    <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-secondary)' }}>DOLMAKTA OLAN (AKTİF)</div>
                    <div style={{ fontSize: '2rem', fontWeight: '900', color: '#10b981', marginTop: '0.2rem' }}>
                        {activeGatesCount} <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Göz</span>
                    </div>
                </GlassCard>

                <GlassCard glow="#64748b">
                    <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-secondary)' }}>BOŞ VE HAZIR GÖZLER</div>
                    <div style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                        {emptyGatesCount} <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Göz</span>
                    </div>
                </GlassCard>
            </div>

            {/* Main Content Area */}
            <main className="glass-morphism" style={{ 
                padding: '1.5rem', borderRadius: '2rem', 
                background: isLight ? 'rgba(15,23,42,0.01)' : 'rgba(255,255,255,0.01)', 
                border: isLight ? '1px solid rgba(15,23,42,0.05)' : '1px solid rgba(255,255,255,0.05)',
                minHeight: '600px'
            }}>
                {viewMode === 'grid' ? (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.8rem' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                    <h2 style={{ fontSize: '1.4rem', fontWeight: '900', margin: 0 }}>OmniSort Mini Kat & Göz Haritası</h2>
                                    
                                    {/* Layout Display Mode Switcher (Image 1 vs Image 2) */}
                                    <div style={{ display: 'flex', background: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.06)', padding: '0.2rem', borderRadius: '0.8rem', border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.1)' }}>
                                        <button
                                            onClick={() => setGridDisplayMode('matrix')}
                                            style={{
                                                background: gridDisplayMode === 'matrix' ? '#007BFF' : 'transparent',
                                                color: gridDisplayMode === 'matrix' ? '#fff' : 'var(--text-primary)',
                                                border: 'none', padding: '0.4rem 0.8rem', borderRadius: '0.6rem',
                                                fontSize: '0.78rem', fontWeight: '800', cursor: 'pointer', transition: '0.2s'
                                            }}
                                            title="1. Resimdeki birebir 6 sıralı saha yerleşimi"
                                        >
                                            🏢 6 Sıra Saha Matrisi
                                        </button>
                                        <button
                                            onClick={() => setGridDisplayMode('cards')}
                                            style={{
                                                background: gridDisplayMode === 'cards' ? '#8b5cf6' : 'transparent',
                                                color: gridDisplayMode === 'cards' ? '#fff' : 'var(--text-primary)',
                                                border: 'none', padding: '0.4rem 0.8rem', borderRadius: '0.6rem',
                                                fontSize: '0.78rem', fontWeight: '800', cursor: 'pointer', transition: '0.2s'
                                            }}
                                            title="2. Resimdeki 4 duvar modülü ayrık görünümü"
                                        >
                                            🗂️ 4 Duvar Kartı
                                        </button>
                                    </div>

                                    <button 
                                        onClick={() => { setIsCartLabelsModalOpen(true); setCartLabelsPrintFeedback(null); }}
                                        style={{
                                            background: '#8b5cf6',
                                            color: '#fff',
                                            border: 'none',
                                            padding: '0.45rem 1rem',
                                            borderRadius: '0.8rem',
                                            fontWeight: '900',
                                            fontSize: '0.8rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                            boxShadow: '0 4px 15px rgba(139,92,246,0.35)',
                                            transition: '0.3s'
                                        }}
                                        onMouseOver={e => e.currentTarget.style.transform = 'scale(1.03)'}
                                        onMouseOut={e => e.currentTarget.style.transform = 'none'}
                                        title="TSC / SATO Yazıcıdan Taşıma Arabaları (R01-R16) ve Sorter Duvar Barkodlarını Yazdırır"
                                    >
                                        <span>🖨️</span> ARABA & DUVAR ETİKETLERİ
                                    </button>

                                    <button 
                                        onClick={() => toggleFullscreen(true)}
                                        style={{
                                            background: 'linear-gradient(135deg, #007BFF, #0056b3)',
                                            color: '#fff',
                                            border: 'none',
                                            padding: '0.45rem 1rem',
                                            borderRadius: '0.8rem',
                                            fontWeight: '900',
                                            fontSize: '0.8rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                            boxShadow: '0 4px 15px rgba(0,123,255,0.35)',
                                            transition: '0.3s'
                                        }}
                                        onMouseOver={e => e.currentTarget.style.transform = 'scale(1.03)'}
                                        onMouseOut={e => e.currentTarget.style.transform = 'none'}
                                        title="Saha TV veya geniş ekran izleme için Tam Ekran Modunu açar (F11 / ESC)"
                                    >
                                        <span style={{ fontSize: '1rem' }}>⛶</span> TAM EKRAN MODU
                                    </button>

                                    <button 
                                        onClick={handleResetAllChutes}
                                        style={{
                                            background: '#dc2626',
                                            color: '#fff',
                                            border: 'none',
                                            padding: '0.45rem 1rem',
                                            borderRadius: '0.8rem',
                                            fontWeight: '900',
                                            fontSize: '0.8rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                            boxShadow: '0 4px 15px rgba(220,38,38,0.35)',
                                            transition: '0.3s'
                                        }}
                                        onMouseOver={e => e.currentTarget.style.transform = 'scale(1.03)'}
                                        onMouseOut={e => e.currentTarget.style.transform = 'none'}
                                        title="Tüm gözlerdeki toplanan ürün adetlerini sıfırlar ve boşaltır"
                                    >
                                        <span>🧹</span> TÜMÜNÜ BOŞALT
                                    </button>
                                </div>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                                    Herhangi bir gözün üzerine tıklayarak <strong>içindeki ürünlerin listesini</strong> açabilir ve sepeti sıfırlayabilirsiniz.
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.72rem', fontWeight: '900', color: '#ffffff', background: 'rgba(234, 88, 12, 0.50)', padding: '0.2rem 0.55rem', borderRadius: '6px', border: '1px solid rgba(249, 115, 22, 0.85)' }}>🟧 1-2. Duvar (Turuncu %50)</span>
                                <span style={{ fontSize: '0.72rem', fontWeight: '900', color: '#ffffff', background: 'rgba(30, 58, 138, 0.50)', padding: '0.2rem 0.55rem', borderRadius: '6px', border: '1px solid rgba(59, 130, 246, 0.85)' }}>🟦 3-4. Duvar (Lacivert %50)</span>
                                <span style={{ fontSize: '0.72rem', fontWeight: '900', color: '#ffffff', background: 'rgba(126, 34, 206, 0.50)', padding: '0.2rem 0.55rem', borderRadius: '6px', border: '1px solid rgba(168, 85, 247, 0.85)' }}>🟪 5-6. Duvar (Mor %50)</span>
                                <span style={{ fontSize: '0.72rem', fontWeight: '900', color: '#ffffff', background: 'rgba(220, 38, 38, 0.50)', padding: '0.2rem 0.55rem', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.85)' }}>🟥 7-8. Duvar (Kırmızı %50)</span>
                                <div style={{ width: '1px', height: '18px', background: isLight ? '#cbd5e1' : 'rgba(255,255,255,0.2)', margin: '0 0.2rem' }}></div>
                                <LegendItem color="#64748b" label="Boş" />
                                <LegendItem color="#10b981" label="Az Dolu" />
                                <LegendItem color="#f59e0b" label="Orta Dolu" />
                                <LegendItem color="#ef4444" label="Dolu" />
                            </div>
                        </div>

                        {/* Regular Floor Map Grid */}
                        <FloorMapGrid 
                            sorterGates={sorterGates}
                            physicalToChMap={physicalToChMap}
                            selectedGate={selectedGate}
                            openChuteDetails={openChuteDetails}
                            isLight={isLight}
                            isFs={false}
                            displayMode={gridDisplayMode}
                        />
                    </div>
                ) : (
                    /* CANLI GÖZ EŞLEŞME VE TAKİP LİSTESİ (60 GÖZ) */
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                                <h2 style={{ fontSize: '1.4rem', fontWeight: '900', margin: 0 }}>Canlı Göz Eşleşme & Takip Listesi</h2>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                                    Tüm 60 gözün hedef bayi atamalarını, anlık doluluk durumunu ve toplanan ürünleri gerçek zamanlı izleyin.
                                </p>
                            </div>

                            <button 
                                onClick={() => { 
                                    setIsMappingModalOpen(true); 
                                    loadMappings(); 
                                    searchOrdersForSorter('');
                                    fetchAvailableChutesForOrder(reserveTotalQty, reserveBoxCap);
                                }}
                                className="btn-primary"
                                style={{ padding: '0.6rem 1.2rem', borderRadius: '0.8rem', fontSize: '0.85rem', fontWeight: '800', cursor: 'pointer' }}
                            >
                                ➕ Yeni Eşleştirme & Rezervasyon Ekle
                            </button>
                        </div>

                        {/* Search and Filters Toolbar */}
                        <div style={{ 
                            display: 'flex', gap: '0.8rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.2rem',
                            background: isLight ? '#f8fafc' : 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '1rem',
                            border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.05)'
                        }}>
                            {/* Search Box */}
                            <div style={{ flex: 1.5, minWidth: '220px' }}>
                                <input 
                                    type="text"
                                    placeholder="🔍 Göz (CH-01), Adres (A1-01), Bayi veya Barkod ara..."
                                    value={trackingSearchQuery}
                                    onChange={e => setTrackingSearchQuery(e.target.value)}
                                    style={{
                                        width: '100%', padding: '0.7rem 1rem', borderRadius: '0.8rem',
                                        border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.1)',
                                        background: isLight ? '#ffffff' : '#0f172a',
                                        color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: '600'
                                    }}
                                />
                            </div>

                            {/* Wall Filter */}
                            <select 
                                value={filterWall}
                                onChange={e => setFilterWall(e.target.value)}
                                style={{
                                    padding: '0.7rem 1rem', borderRadius: '0.8rem',
                                    border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.1)',
                                    background: isLight ? '#ffffff' : '#0f172a',
                                    color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: '700'
                                }}
                            >
                                <option value="ALL">🏢 Tüm Bölümler (Duvarlar)</option>
                                <option value="M145-WALL-1">Bölüm 1 (A1 - Sol Dış)</option>
                                <option value="M145-WALL-2">Bölüm 2 (A2 - Sol İç)</option>
                                <option value="M145-WALL-3">Bölüm 3 (B1 - Sağ İç)</option>
                                <option value="M145-WALL-4">Bölüm 4 (B2 - Sağ Dış)</option>
                            </select>

                            {/* Floor Filter */}
                            <select 
                                value={filterFloor}
                                onChange={e => setFilterFloor(e.target.value)}
                                style={{
                                    padding: '0.7rem 1rem', borderRadius: '0.8rem',
                                    border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.1)',
                                    background: isLight ? '#ffffff' : '#0f172a',
                                    color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: '700'
                                }}
                            >
                                <option value="ALL">🔺 Tüm Katlar</option>
                                <option value="3">Kat 3 (Üst Sıra)</option>
                                <option value="2">Kat 2 (Orta Sıra)</option>
                                <option value="1">Kat 1 (Alt Sıra)</option>
                            </select>

                            {/* Status Filter */}
                            <select 
                                value={filterStatus}
                                onChange={e => setFilterStatus(e.target.value)}
                                style={{
                                    padding: '0.7rem 1rem', borderRadius: '0.8rem',
                                    border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.1)',
                                    background: isLight ? '#ffffff' : '#0f172a',
                                    color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: '700'
                                }}
                            >
                                <option value="ALL">⚡ Tüm Durumlar</option>
                                <option value="FULL">🔴 Sadece Dolular</option>
                                <option value="ACTIVE">🟢 Sadece Aktifler</option>
                                <option value="EMPTY">⚪ Sadece Boşlar</option>
                                <option value="ERROR">⚠️ Hata / Arıza</option>
                            </select>
                        </div>

                        {/* Interactive Data Table */}
                        <div style={{ overflowX: 'auto', borderRadius: '1.2rem', border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.05)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                                <thead>
                                    <tr style={{ background: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.05)', borderBottom: isLight ? '2px solid #cbd5e1' : '2px solid rgba(255,255,255,0.1)' }}>
                                        <th style={{ padding: '0.9rem 1rem', fontWeight: '900' }}>GÖZ</th>
                                        <th style={{ padding: '0.9rem 1rem', fontWeight: '900' }}>FİZİKSEL KOD</th>
                                        <th style={{ padding: '0.9rem 1rem', fontWeight: '900' }}>BÖLÜM & KAT</th>
                                        <th style={{ padding: '0.9rem 1rem', fontWeight: '900' }}>EŞLEŞEN HEDEF / BAYİ</th>
                                        <th style={{ padding: '0.9rem 1rem', fontWeight: '900' }}>TÜR</th>
                                        <th style={{ padding: '0.9rem 1rem', fontWeight: '900' }}>DOLULUK ORANI</th>
                                        <th style={{ padding: '0.9rem 1rem', fontWeight: '900' }}>SON OKUNAN ÜRÜN</th>
                                        <th style={{ padding: '0.9rem 1rem', fontWeight: '900' }}>DURUM</th>
                                        <th style={{ padding: '0.9rem 1rem', fontWeight: '900', textAlign: 'right' }}>İŞLEMLER</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTrackingGates.map(gate => {
                                        const capacity = gate.target_capacity || 25;
                                        const count = gate.item_count || 0;
                                        const loadPercent = Math.min(100, Math.round((count / capacity) * 100));
                                        const isFull = gate.is_full || count >= capacity;
                                        const isSensorBlocked = gate.status === 'sensor_blocked';

                                        let statusBadgeBg = '#64748b';
                                        let statusText = 'BOŞ';
                                        if (isSensorBlocked) {
                                            statusBadgeBg = '#ef4444';
                                            statusText = '⚠️ SENSÖR İHLALİ (TAŞMA)';
                                        } else if (gate.status === 'error') {
                                            statusBadgeBg = '#ef4444';
                                            statusText = 'ARIZA';
                                        } else if (isFull) {
                                            statusBadgeBg = '#ef4444';
                                            statusText = 'DOLU (KOLİ HAZIR)';
                                        } else if (count > 0) {
                                            statusBadgeBg = '#10b981';
                                            statusText = 'AKTİF';
                                        }

                                        let barColor = '#64748b';
                                        if (isFull) barColor = '#ef4444';
                                        else if (loadPercent >= 50) barColor = '#f59e0b';
                                        else if (count > 0) barColor = '#10b981';

                                        return (
                                            <tr 
                                                key={gate.id} 
                                                style={{ 
                                                    borderBottom: isLight ? '1px solid #f1f5f9' : '1px solid rgba(255,255,255,0.03)',
                                                    transition: '0.2s',
                                                    background: isFull ? (isLight ? 'rgba(239, 68, 68, 0.03)' : 'rgba(239, 68, 68, 0.05)') : 'transparent'
                                                }}
                                                onMouseOver={e => e.currentTarget.style.background = isLight ? '#f8fafc' : 'rgba(255,255,255,0.03)'}
                                                onMouseOut={e => e.currentTarget.style.background = isFull ? (isLight ? 'rgba(239, 68, 68, 0.03)' : 'rgba(239, 68, 68, 0.05)') : 'transparent'}
                                            >
                                                <td style={{ padding: '0.8rem 1rem', fontWeight: '900', color: '#007BFF' }}>
                                                    {gate.id}
                                                </td>
                                                <td style={{ padding: '0.8rem 1rem', fontWeight: '800' }}>
                                                    <span style={{ 
                                                        background: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.08)', 
                                                        padding: '0.2rem 0.5rem', borderRadius: '0.4rem', fontWeight: '900' 
                                                    }}>
                                                        {gate.physical_code || chToPhysicalMap[gate.chute_no]}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '0.8rem 1rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                                    <div>{gate.wall_name || 'Bölüm'}</div>
                                                    <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#007BFF' }}>{gate.floor_label || 'Kat 1'}</div>
                                                </td>
                                                <td style={{ padding: '0.8rem 1rem', fontWeight: '800' }}>
                                                    {gate.destination !== '---' ? (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                                            <span style={{ color: isLight ? '#0f172a' : '#f8fafc' }}>{gate.destination}</span>
                                                            {(gate.assigned_size || (gate.destination && gate.destination.includes('[Beden:'))) && (
                                                                <span style={{
                                                                    fontSize: '0.7rem',
                                                                    background: 'rgba(245,158,11,0.15)',
                                                                    color: '#f59e0b',
                                                                    border: '1px solid rgba(245,158,11,0.5)',
                                                                    padding: '0.1rem 0.4rem',
                                                                    borderRadius: '4px',
                                                                    fontWeight: '900',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '0.2rem'
                                                                }}>
                                                                    👕 {gate.assigned_size || (gate.destination.match(/\[Beden:\s*([^\]]+)\]/) ? gate.destination.match(/\[Beden:\s*([^\]]+)\]/)[1] : '')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span style={{ color: 'var(--text-muted)' }}>— Atanmadı —</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '0.8rem 1rem' }}>
                                                    <span style={{ 
                                                        fontSize: '0.68rem', fontWeight: '900', padding: '0.15rem 0.45rem', borderRadius: '0.35rem',
                                                        background: gate.match_type === 'BRAND' ? '#8b5cf620' : (gate.match_type === 'PRODUCT' ? '#ec489920' : (gate.match_type === 'SIZE' ? '#f59e0b20' : '#007bff20')),
                                                        color: gate.match_type === 'BRAND' ? '#8b5cf6' : (gate.match_type === 'PRODUCT' ? '#ec4899' : (gate.match_type === 'SIZE' ? '#f59e0b' : '#007bff'))
                                                    }}>
                                                        {gate.match_type || 'BAYİ'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '0.8rem 1rem', minWidth: '150px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: '800', marginBottom: '0.25rem' }}>
                                                        <span>{count} / {capacity} Adet</span>
                                                        <span style={{ color: barColor }}>%{loadPercent}</span>
                                                    </div>
                                                    <div style={{ height: '6px', background: isLight ? '#e2e8f0' : 'rgba(0,0,0,0.4)', borderRadius: '6px', overflow: 'hidden' }}>
                                                        <div style={{ width: `${loadPercent}%`, height: '100%', background: barColor, borderRadius: '6px', transition: 'width 0.4s ease' }}></div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '0.8rem 1rem', fontSize: '0.78rem' }}>
                                                    {gate.last_product_name || gate.last_barcode ? (
                                                        <div>
                                                            <div style={{ fontWeight: '700', color: isLight ? '#0f172a' : '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
                                                                {gate.last_product_name || 'Ürün'}
                                                            </div>
                                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{gate.last_barcode}</div>
                                                        </div>
                                                    ) : (
                                                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '0.8rem 1rem' }}>
                                                    <span style={{ 
                                                        fontSize: '0.7rem', fontWeight: '900', padding: '0.2rem 0.6rem', borderRadius: '0.4rem',
                                                        background: statusBadgeBg, color: '#fff'
                                                    }}>
                                                        {statusText}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '0.8rem 1rem', textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const destStr = String(gate.destination || '').trim();
                                                                const matchOrder = destStr.match(/\b\d{4,6}\b/);
                                                                const orderId = gate.order_number || gate.order_id || (matchOrder ? matchOrder[0] : null);
                                                                if (orderId) {
                                                                    navigate(`/admin/orders/${orderId}/labels`, { state: { order: { Id: orderId } } });
                                                                } else if (destStr && !destStr.includes('---')) {
                                                                    navigate('/admin/personnel');
                                                                } else {
                                                                    navigate('/admin/orders');
                                                                }
                                                            }}
                                                            title="Bu göze ait Fiş & Etiket Basım Merkezine Git"
                                                            style={{
                                                                padding: '0.4rem 0.75rem', borderRadius: '0.6rem', border: 'none',
                                                                background: '#10b981', color: '#fff', fontSize: '0.75rem', fontWeight: '800',
                                                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem',
                                                                boxShadow: '0 2px 8px rgba(16,185,129,0.3)'
                                                            }}
                                                        >
                                                            🏷️ Fiş & Etiket
                                                        </button>
                                                        <button 
                                                            onClick={() => openChuteDetails(gate)}
                                                            title="İçindeki Ürünleri Görüntüle"
                                                            style={{
                                                                padding: '0.4rem 0.8rem', borderRadius: '0.6rem', border: 'none',
                                                                background: '#007BFF', color: '#fff', fontSize: '0.75rem', fontWeight: '800',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            🔍 İçindekiler {count > 0 ? `(${count})` : ''}
                                                        </button>
                                                        {count > 0 && (
                                                            <button 
                                                                onClick={() => handleResetChute(gate.chute_no || parseInt(gate.id.replace('CH-', ''), 10))}
                                                                title="Sepeti Boşalt / Sıfırla"
                                                                style={{
                                                                    padding: '0.4rem 0.7rem', borderRadius: '0.6rem', border: 'none',
                                                                    background: '#28a745', color: '#fff', fontSize: '0.75rem', fontWeight: '800',
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                🧹
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {filteredTrackingGates.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                                    Arama kriterine uygun göz bulunamadı.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* CHUTE DETAIL & ITEMS CONTENT MODAL */}
            {selectedGate && (
                <div 
                    onClick={() => setSelectedGate(null)}
                    style={{ 
                        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1000, 
                        background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                >
                    <div 
                        onClick={e => e.stopPropagation()}
                        style={{ 
                            width: '90%', maxWidth: '850px', background: isLight ? '#ffffff' : '#0f172a', borderRadius: '2rem', padding: '2.5rem', 
                            border: isLight ? '1px solid rgba(15,23,42,0.1)' : '1px solid rgba(255,255,255,0.1)',
                            boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
                            maxHeight: '90vh', display: 'flex', flexDirection: 'column'
                        }}
                    >
                        {/* Modal Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: isLight ? '1px solid #f1f5f9' : '1px solid rgba(255,255,255,0.08)', paddingBottom: '1rem' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                                    {(() => {
                                        const wCol = getSorterWallColor(selectedGate, selectedGate.physical_code);
                                        return (
                                            <span style={{ 
                                                fontSize: '0.8rem', fontWeight: '900', background: wCol.bg50, color: '#fff', 
                                                border: `1.5px solid ${wCol.border}`,
                                                padding: '0.2rem 0.6rem', borderRadius: '0.4rem',
                                                boxShadow: wCol.glow,
                                                textShadow: '0 1px 2px rgba(0,0,0,0.6)'
                                            }}>
                                                {wCol.wallPair} ({wCol.colorName} %50)
                                            </span>
                                        );
                                    })()}
                                    <span style={{ 
                                        fontSize: '0.8rem', fontWeight: '900', background: '#007BFF', color: '#fff', 
                                        padding: '0.2rem 0.6rem', borderRadius: '0.4rem' 
                                    }}>
                                        {selectedGate.physical_code || chToPhysicalMap[selectedGate.chute_no] || selectedGate.id}
                                    </span>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '700' }}>
                                        {selectedGate.id} • {selectedGate.floor_label || 'Kat 1'}
                                    </span>
                                </div>
                                <h2 style={{ fontSize: '1.8rem', fontWeight: '900', margin: 0, color: isLight ? '#0f172a' : '#ffffff' }}>
                                    {selectedGate.destination !== '---' ? selectedGate.destination : 'Serbest / Boş Göz'}
                                </h2>
                            </div>
                            <button 
                                onClick={() => setSelectedGate(null)}
                                style={{ background: 'transparent', border: 'none', color: isLight ? '#0f172a' : '#fff', fontSize: '2rem', fontWeight: 'bold', cursor: 'pointer', lineHeight: '1' }}
                            >
                                &times;
                            </button>
                        </div>

                        {/* Capacity and Fill Level Card */}
                        <div style={{ 
                            background: isLight ? '#f8fafc' : 'rgba(255,255,255,0.03)', padding: '1.2rem', borderRadius: '1.2rem', 
                            border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.05)', marginBottom: '1.5rem'
                        }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '0.8rem', textAlign: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-secondary)' }}>TOPLANAN ADET</div>
                                    <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#007BFF' }}>{selectedGate.item_count || 0} Adet</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-secondary)' }}>HEDEF KAPASİTE</div>
                                    <div style={{ fontSize: '1.4rem', fontWeight: '900' }}>{selectedGate.target_capacity || 25} Adet</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-secondary)' }}>DOLULUK ORANI</div>
                                    <div style={{ fontSize: '1.4rem', fontWeight: '900', color: selectedGate.is_full ? '#ef4444' : '#10b981' }}>
                                        %{Math.min(100, Math.round(((selectedGate.item_count || 0) / (selectedGate.target_capacity || 25)) * 100))}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-secondary)' }}>KALAN YER</div>
                                    <div style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--text-secondary)' }}>
                                        {Math.max(0, (selectedGate.target_capacity || 25) - (selectedGate.item_count || 0))} Adet
                                    </div>
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div style={{ height: '8px', background: isLight ? '#cbd5e1' : 'rgba(0,0,0,0.5)', borderRadius: '10px', overflow: 'hidden' }}>
                                <div style={{ 
                                    width: `${Math.min(100, Math.round(((selectedGate.item_count || 0) / (selectedGate.target_capacity || 25)) * 100))}%`, 
                                    height: '100%', 
                                    background: selectedGate.is_full ? '#ef4444' : '#007BFF', 
                                    borderRadius: '10px',
                                    transition: 'width 0.5s ease'
                                }}></div>
                            </div>
                        </div>

                        {/* Items Search and Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                            <div style={{ fontSize: '1rem', fontWeight: '900' }}>
                                📦 Sepet İçindeki Ürünler ({selectedGateItems.length})
                            </div>
                            <input 
                                type="text"
                                placeholder="🔍 Ürün adı veya barkod ara..."
                                value={itemSearchQuery}
                                onChange={e => setItemSearchQuery(e.target.value)}
                                style={{
                                    padding: '0.4rem 0.8rem', borderRadius: '0.6rem',
                                    border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.1)',
                                    background: isLight ? '#fff' : '#0f172a',
                                    color: 'var(--text-primary)', fontSize: '0.8rem', width: '220px'
                                }}
                            />
                        </div>

                        {/* Scrollable Items Table */}
                        <div style={{ flex: 1, overflowY: 'auto', borderRadius: '1rem', border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.05)', maxHeight: '280px', marginBottom: '1.5rem' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                                <thead>
                                    <tr style={{ background: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.05)', position: 'sticky', top: 0, zIndex: 1 }}>
                                        <th style={{ padding: '0.6rem 0.8rem', fontWeight: '900' }}>#</th>
                                        <th style={{ padding: '0.6rem 0.8rem', fontWeight: '900' }}>ÜRÜN ADI</th>
                                        <th style={{ padding: '0.6rem 0.8rem', fontWeight: '900' }}>BARKOD / EPC</th>
                                        <th style={{ padding: '0.6rem 0.8rem', fontWeight: '900' }}>BEDEN</th>
                                        <th style={{ padding: '0.6rem 0.8rem', fontWeight: '900' }}>SİPARİŞ NO</th>
                                        <th style={{ padding: '0.6rem 0.8rem', fontWeight: '900' }}>DÜŞME ZAMANI</th>
                                        <th style={{ padding: '0.6rem 0.8rem', fontWeight: '900' }}>DURUM</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoadingGateItems ? (
                                        <tr>
                                            <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                                ⏳ Sepet içeriği yükleniyor...
                                            </td>
                                        </tr>
                                    ) : selectedGateItems.filter(i => {
                                        if (!itemSearchQuery.trim()) return true;
                                        const q = itemSearchQuery.toLowerCase();
                                        return (i.product_name || '').toLowerCase().includes(q) || (i.barcode || '').toLowerCase().includes(q);
                                    }).map((item, idx) => (
                                        <tr key={item.id || idx} style={{ borderBottom: isLight ? '1px solid #f1f5f9' : '1px solid rgba(255,255,255,0.03)' }}>
                                            <td style={{ padding: '0.6rem 0.8rem', fontWeight: '800', color: 'var(--text-secondary)' }}>{idx + 1}</td>
                                            <td style={{ padding: '0.6rem 0.8rem', fontWeight: '800' }}>{item.product_name || 'Genel Ürün'}</td>
                                            <td style={{ padding: '0.6rem 0.8rem', fontFamily: 'monospace', fontSize: '0.75rem' }}>{item.barcode}</td>
                                            <td style={{ padding: '0.6rem 0.8rem', fontWeight: '700' }}>{item.size || 'STD'}</td>
                                            <td style={{ padding: '0.6rem 0.8rem', color: 'var(--text-secondary)' }}>{item.order_number || '—'}</td>
                                            <td style={{ padding: '0.6rem 0.8rem', color: 'var(--text-secondary)', fontSize: '0.72rem' }}>
                                                {item.created_at ? new Date(item.created_at).toLocaleTimeString() : 'Live'}
                                            </td>
                                            <td style={{ padding: '0.6rem 0.8rem' }}>
                                                <span style={{ fontSize: '0.65rem', fontWeight: '900', padding: '0.15rem 0.4rem', borderRadius: '0.3rem', background: '#10b98120', color: '#10b981' }}>
                                                    DÜŞTÜ ✅
                                                </span>
                                            </td>
                                        </tr>
                                    ))}

                                    {!isLoadingGateItems && selectedGateItems.length === 0 && (
                                        <tr>
                                            <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)' }}>
                                                📦 Bu sepette henüz toplanan ürün bulunmuyor. Sorter ürün bıraktıkça burada anlık listelenecektir.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Modal Action Buttons */}
                        <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end', flexWrap: 'wrap', borderTop: isLight ? '1px solid #f1f5f9' : '1px solid rgba(255,255,255,0.08)', paddingTop: '1.2rem' }}>
                            <button 
                                onClick={() => {
                                    const destStr = String(selectedGate.destination || '').trim();
                                    const matchOrder = destStr.match(/\b\d{4,6}\b/);
                                    const orderId = selectedGate.order_number || selectedGate.order_id || (selectedGateItems[0] && selectedGateItems[0].order_number) || (matchOrder ? matchOrder[0] : null);
                                    if (orderId) {
                                        navigate(`/admin/orders/${orderId}/labels`, { state: { order: { Id: orderId } } });
                                    } else if (destStr && !destStr.includes('---')) {
                                        navigate('/admin/personnel');
                                    } else {
                                        navigate('/admin/orders');
                                    }
                                }}
                                style={{ 
                                    padding: '0.8rem 1.4rem', borderRadius: '0.8rem', background: '#10b981', color: '#fff', 
                                    border: 'none', fontWeight: '900', cursor: 'pointer', fontSize: '0.85rem',
                                    boxShadow: '0 4px 15px rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', gap: '0.5rem'
                                }}
                                title="Bu göze ait siparişin veya personelin Fiş & Etiket Basım Merkezine Git"
                            >
                                🏷️ FİŞ & ETİKET BAS
                            </button>
                            <button 
                                onClick={() => {
                                    navigate('/admin/orders');
                                }}
                                style={{ 
                                    padding: '0.8rem 1.4rem', borderRadius: '0.8rem', background: '#6366f1', color: '#fff', 
                                    border: 'none', fontWeight: '900', cursor: 'pointer', fontSize: '0.85rem',
                                    boxShadow: '0 4px 15px rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', gap: '0.5rem'
                                }}
                                title="Koli Planlamasını Başlat"
                            >
                                📦 KOLİ PLANLA
                            </button>
                            <button 
                                onClick={() => {
                                    const chNo = parseInt((selectedGate.chute_no || selectedGate.id).toString().replace('CH-', ''), 10);
                                    handleResetChute(chNo);
                                }}
                                style={{ 
                                    padding: '0.8rem 1.4rem', borderRadius: '0.8rem', background: '#28a745', color: '#fff', 
                                    border: 'none', fontWeight: '900', cursor: 'pointer', fontSize: '0.85rem',
                                    boxShadow: '0 4px 15px rgba(40,167,69,0.3)', display: 'flex', alignItems: 'center', gap: '0.5rem'
                                }}
                            >
                                🧹 SEPETİ BOŞALT / SIFIRLA (Koli Hazır)
                            </button>
                            <button 
                                onClick={() => setSelectedGate(null)}
                                style={{ 
                                    padding: '0.8rem 1.4rem', borderRadius: '0.8rem', 
                                    background: isLight ? '#e2e8f0' : 'rgba(255,255,255,0.1)', 
                                    color: 'var(--text-primary)', border: 'none', fontWeight: '800', 
                                    cursor: 'pointer', fontSize: '0.85rem' 
                                }}
                            >
                                KAPAT
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MAPPING CONFIGURATION MODAL */}
            {isMappingModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000
                }}>
                    <div className="glass-morphism" style={{
                        backgroundColor: isLight ? '#ffffff' : '#0f172a',
                        padding: '2.2rem', borderRadius: '1.8rem', width: '92%', maxWidth: '860px',
                        border: isLight ? '1px solid rgba(15,23,42,0.15)' : '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
                        maxHeight: '92vh', display: 'flex', flexDirection: 'column'
                    }}>
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: isLight ? '1px solid #f1f5f9' : '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.8rem' }}>
                            <div>
                                <div style={{ margin: 0, fontSize: '1.4rem', fontWeight: '900', color: isLight ? '#0f172a' : '#ffffff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <span>⚙️</span> Gelişmiş Göz & Senaryo Eşleştirme (Mapping)
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                                    Aktif Profil: <span style={{ color: '#007BFF', fontWeight: 'bold' }}>{profilesList.find(p => p.id === activeProfile)?.name}</span>
                                </div>
                            </div>
                            <button onClick={() => setIsMappingModalOpen(false)} style={{ background: 'transparent', border: 'none', color: isLight ? '#000' : '#fff', fontSize: '2rem', fontWeight: 'bold', cursor: 'pointer', lineHeight: '1' }}>&times;</button>
                        </div>

                        {/* TAB SELECTOR: ORDER-BASED vs MANUAL */}
                        <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.2rem', background: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.04)', padding: '0.35rem', borderRadius: '0.9rem' }}>
                            <button
                                onClick={() => {
                                    setMappingModalTab('ORDER');
                                    searchOrdersForSorter('');
                                    fetchAvailableChutesForOrder(reserveTotalQty, reserveBoxCap);
                                }}
                                style={{
                                    flex: 1, padding: '0.65rem 1rem', borderRadius: '0.7rem', border: 'none',
                                    background: mappingModalTab === 'ORDER' ? '#007BFF' : 'transparent',
                                    color: mappingModalTab === 'ORDER' ? '#fff' : 'var(--text-primary)',
                                    fontWeight: '900', fontSize: '0.85rem', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                    boxShadow: mappingModalTab === 'ORDER' ? '0 4px 15px rgba(0,123,255,0.3)' : 'none',
                                    transition: '0.2s'
                                }}
                            >
                                <span>📦</span> Sipariş No İle Otomatik Göz Rezerve & Eşleştir
                            </button>
                            <button
                                onClick={() => setMappingModalTab('MANUAL')}
                                style={{
                                    flex: 1, padding: '0.65rem 1rem', borderRadius: '0.7rem', border: 'none',
                                    background: mappingModalTab === 'MANUAL' ? '#8b5cf6' : 'transparent',
                                    color: mappingModalTab === 'MANUAL' ? '#fff' : 'var(--text-primary)',
                                    fontWeight: '900', fontSize: '0.85rem', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                    boxShadow: mappingModalTab === 'MANUAL' ? '0 4px 15px rgba(139,92,246,0.3)' : 'none',
                                    transition: '0.2s'
                                }}
                            >
                                <span>⚙️</span> Manuel Kural Eşleştirme (Bayi / Marka / Ürün)
                            </button>
                        </div>

                        {/* FEEDBACK TOAST */}
                        {orderReservationFeedback && (
                            <div style={{
                                background: '#10b981', color: '#000', fontWeight: '900', fontSize: '0.85rem',
                                padding: '0.7rem 1.2rem', borderRadius: '0.7rem', marginBottom: '1rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                boxShadow: '0 4px 15px rgba(16,185,129,0.3)'
                            }}>
                                <span>✅ {orderReservationFeedback.message}</span>
                                <button onClick={() => setOrderReservationFeedback(null)} style={{ background: 'transparent', border: 'none', fontWeight: '900', cursor: 'pointer' }}>✕</button>
                            </div>
                        )}

                        {/* TAB 1: ORDER-BASED INTELLIGENT ALLOCATION */}
                        {mappingModalTab === 'ORDER' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', overflowY: 'auto', paddingRight: '0.4rem', maxHeight: '58vh' }}>
                                {/* 1. Order Number Input & Live Search */}
                                <div style={{ background: isLight ? '#f8fafc' : 'rgba(255,255,255,0.03)', padding: '1.2rem', borderRadius: '1.2rem', border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.08)' }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: '900', color: '#007BFF', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <span>🔍</span> 1. Sipariş Numarası Yazın veya Seçin:
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
                                        <input 
                                            type="text" 
                                            placeholder="Sipariş No Yazın (Örn: 16941, 16903) veya Müşteri Ara..." 
                                            value={reserveOrderNumber}
                                            onChange={e => {
                                                const val = e.target.value;
                                                setReserveOrderNumber(val);
                                                searchOrdersForSorter(val);
                                                fetchAvailableChutesForOrder(reserveTotalQty, reserveBoxCap);
                                            }}
                                            style={{
                                                flex: 1.5, minWidth: '220px', padding: '0.75rem 1rem', borderRadius: '0.8rem',
                                                border: '2px solid #007BFF', background: isLight ? '#fff' : '#0f172a',
                                                color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: '800'
                                            }}
                                        />
                                        <input 
                                            type="text" 
                                            placeholder="Müşteri / Bayi Adı (İsteğe Bağlı)" 
                                            value={reserveCustomerName}
                                            onChange={e => setReserveCustomerName(e.target.value)}
                                            style={{
                                                flex: 1.5, minWidth: '200px', padding: '0.75rem 1rem', borderRadius: '0.8rem',
                                                border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.1)',
                                                background: isLight ? '#fff' : '#0f172a', color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: '600'
                                            }}
                                        />
                                    </div>

                                    {/* Quick selection chips for recent orders */}
                                    {orderSearchResults.length > 0 && (
                                        <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.3rem' }}>
                                            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', alignSelf: 'center', fontWeight: '800' }}>Önerilen:</span>
                                            {orderSearchResults.slice(0, 6).map(ord => (
                                                <button
                                                    key={ord.order_number}
                                                    onClick={() => handleSelectOrderForReservation(ord)}
                                                    style={{
                                                        background: String(reserveOrderNumber) === String(ord.order_number) ? '#007BFF' : (isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)'),
                                                        color: String(reserveOrderNumber) === String(ord.order_number) ? '#fff' : 'var(--text-primary)',
                                                        border: 'none', padding: '0.3rem 0.65rem', borderRadius: '0.5rem',
                                                        fontSize: '0.74rem', fontWeight: '800', cursor: 'pointer', whiteSpace: 'nowrap',
                                                        display: 'flex', alignItems: 'center', gap: '0.3rem'
                                                    }}
                                                >
                                                    <span>#{ord.order_number}</span>
                                                    <span style={{ opacity: 0.8, fontSize: '0.68rem' }}>({ord.total_quantity} ad.)</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* 2. Mode Selection & Quantity / Size Capacity Settings */}
                                <div style={{ background: isLight ? '#f8fafc' : 'rgba(255,255,255,0.03)', padding: '1.2rem', borderRadius: '1.2rem', border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.08)' }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: '900', color: '#8b5cf6', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <span>📊</span> 2. Ayrıştırma Modu & Kapasite Hesabı:
                                    </div>

                                    {/* Mode Selection Tabs */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '1rem' }}>
                                        <button
                                            type="button"
                                            onClick={() => setSplitBySize(false)}
                                            style={{
                                                padding: '0.75rem 1rem', borderRadius: '0.8rem',
                                                border: !splitBySize ? '2px solid #007BFF' : (isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.1)'),
                                                background: !splitBySize ? (isLight ? '#eff6ff' : 'rgba(0,123,255,0.15)') : (isLight ? '#fff' : 'rgba(255,255,255,0.02)'),
                                                color: !splitBySize ? '#007BFF' : 'var(--text-secondary)',
                                                fontWeight: '900', fontSize: '0.82rem', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                                transition: '0.2s',
                                                boxShadow: !splitBySize ? '0 3px 12px rgba(0,123,255,0.2)' : 'none'
                                            }}
                                        >
                                            <span style={{ fontSize: '1.2rem' }}>📦</span>
                                            <div style={{ textAlign: 'left' }}>
                                                <div style={{ fontWeight: '900' }}>Standart Karışık Koli</div>
                                                <div style={{ fontSize: '0.68rem', opacity: 0.8, fontWeight: '600' }}>Tüm bedenler tek kaskat kolide toplanır</div>
                                            </div>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSplitBySize(true);
                                                if (reserveOrderNumber) {
                                                    fetchOrderSizes(reserveOrderNumber, reserveBoxCap);
                                                }
                                            }}
                                            style={{
                                                padding: '0.75rem 1rem', borderRadius: '0.8rem',
                                                border: splitBySize ? '2px solid #f59e0b' : (isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.1)'),
                                                background: splitBySize ? (isLight ? '#fffbeb' : 'rgba(245,158,11,0.15)') : (isLight ? '#fff' : 'rgba(255,255,255,0.02)'),
                                                color: splitBySize ? '#d97706' : 'var(--text-secondary)',
                                                fontWeight: '900', fontSize: '0.82rem', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                                transition: '0.2s',
                                                boxShadow: splitBySize ? '0 3px 12px rgba(245,158,11,0.2)' : 'none'
                                            }}
                                        >
                                            <span style={{ fontSize: '1.2rem' }}>👕</span>
                                            <div style={{ textAlign: 'left' }}>
                                                <div style={{ fontWeight: '900', color: splitBySize ? '#d97706' : 'inherit' }}>Her Bedeni Ayrı Kutuya Koy</div>
                                                <div style={{ fontSize: '0.68rem', opacity: 0.8, fontWeight: '600' }}>Beden bazlı (S, M, L..) ayrı gözlere ayrıştırma</div>
                                            </div>
                                        </button>
                                    </div>

                                    {!splitBySize ? (
                                        /* STANDARD MIXED SIZES */
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.8rem', alignItems: 'center' }}>
                                            <div>
                                                <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                                                    Toplam Sipariş Adedi:
                                                </label>
                                                <input 
                                                    type="number" 
                                                    min="1" 
                                                    max="5000" 
                                                    value={reserveTotalQty}
                                                    onChange={e => {
                                                        const val = Number(e.target.value);
                                                        setReserveTotalQty(val);
                                                        fetchAvailableChutesForOrder(val, reserveBoxCap);
                                                    }}
                                                    style={{
                                                        width: '100%', padding: '0.7rem 0.9rem', borderRadius: '0.8rem',
                                                        border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.1)',
                                                        background: isLight ? '#fff' : '#0f172a', color: 'var(--text-primary)',
                                                        fontSize: '1.1rem', fontWeight: '900', boxSizing: 'border-box'
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                                                    Koli / Göz Kapasitesi (Adet):
                                                </label>
                                                <input 
                                                    type="number" 
                                                    min="1" 
                                                    max="200" 
                                                    value={reserveBoxCap}
                                                    onChange={e => {
                                                        const val = Number(e.target.value);
                                                        setReserveBoxCap(val);
                                                        fetchAvailableChutesForOrder(reserveTotalQty, val);
                                                    }}
                                                    style={{
                                                        width: '100%', padding: '0.7rem 0.9rem', borderRadius: '0.8rem',
                                                        border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.1)',
                                                        background: isLight ? '#fff' : '#0f172a', color: 'var(--text-primary)',
                                                        fontSize: '1.1rem', fontWeight: '900', boxSizing: 'border-box'
                                                    }}
                                                />
                                            </div>
                                            <div style={{ background: 'rgba(139,92,246,0.12)', border: '1.5px dashed #8b5cf6', padding: '0.7rem 1rem', borderRadius: '0.8rem', textAlign: 'center' }}>
                                                <div style={{ fontSize: '0.72rem', fontWeight: '800', color: '#8b5cf6' }}>HESAPLANAN İHTİYAÇ</div>
                                                <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#8b5cf6', marginTop: '0.1rem' }}>
                                                    {Math.max(1, Math.ceil((reserveTotalQty || 1) / (reserveBoxCap || 25)))} Göz
                                                </div>
                                                <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                                                    ({reserveBoxCap} ad. x {Math.max(1, Math.ceil((reserveTotalQty || 1) / (reserveBoxCap || 25)))} Koli Kaskadı)
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        /* SIZE-BASED SPLITTING VIEW */
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                                    <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--text-secondary)' }}>
                                                        Koli Kapasitesi:
                                                    </label>
                                                    <input 
                                                        type="number" 
                                                        min="1" 
                                                        max="200" 
                                                        value={reserveBoxCap}
                                                        onChange={e => {
                                                            const val = Number(e.target.value);
                                                            setReserveBoxCap(val);
                                                            fetchOrderSizes(reserveOrderNumber, val);
                                                        }}
                                                        style={{
                                                            width: '80px', padding: '0.4rem 0.6rem', borderRadius: '0.5rem',
                                                            border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.1)',
                                                            background: isLight ? '#fff' : '#0f172a', color: 'var(--text-primary)',
                                                            fontSize: '0.9rem', fontWeight: '900', textAlign: 'center'
                                                        }}
                                                    />
                                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Adet / Koli</span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => fetchOrderSizes(reserveOrderNumber, reserveBoxCap)}
                                                        title="Siparişteki bedenleri veritabanından tekrar tara"
                                                        style={{
                                                            background: isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)',
                                                            color: 'var(--text-primary)', border: 'none', padding: '0.4rem 0.8rem',
                                                            borderRadius: '0.6rem', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer',
                                                            display: 'flex', alignItems: 'center', gap: '0.3rem'
                                                        }}
                                                    >
                                                        <span>🔄</span> Bedenleri Yenile
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={handleAutoAllocateSizes}
                                                        style={{
                                                            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                                            color: '#000', border: 'none', padding: '0.4rem 0.9rem',
                                                            borderRadius: '0.6rem', fontSize: '0.78rem', fontWeight: '900', cursor: 'pointer',
                                                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                                                            boxShadow: '0 4px 12px rgba(245,158,11,0.3)'
                                                        }}
                                                    >
                                                        <span>⚡</span> Boş Gözleri Bedenlere Otomatik Dağıt
                                                    </button>
                                                </div>
                                            </div>

                                            {isLoadingOrderSizes ? (
                                                <div style={{ textAlign: 'center', padding: '1.2rem', color: '#f59e0b', fontWeight: '800', fontSize: '0.85rem' }}>
                                                    ⏳ Siparişteki beden dağılımı sorgulanıyor...
                                                </div>
                                            ) : orderSizes.length === 0 ? (
                                                <div style={{ textAlign: 'center', padding: '1.2rem', background: isLight ? '#fff' : 'rgba(255,255,255,0.02)', borderRadius: '0.8rem', border: '1px dashed #cbd5e1' }}>
                                                    <div style={{ color: '#ef4444', fontWeight: '800', fontSize: '0.82rem', marginBottom: '0.3rem' }}>
                                                        ⚠️ Bu sipariş için ayrıştırılabilir beden kaydı bulunamadı.
                                                    </div>
                                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.72rem' }}>
                                                        Lütfen yukarıdaki sipariş numarasını kontrol edin veya sağdaki "Bedenleri Yenile" butonuna tıklayın.
                                                    </div>
                                                </div>
                                            ) : (
                                                <div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '0.6rem', maxHeight: '180px', overflowY: 'auto', padding: '0.2rem' }}>
                                                        {orderSizes.map(s => {
                                                            const isEditing = activeEditingSize === s.size;
                                                            const assigned = sizeAllocations[s.size] || [];
                                                            const isFulfilled = assigned.length >= (s.needed_chutes || 1);
                                                            return (
                                                                <div
                                                                    key={s.size}
                                                                    onClick={() => setActiveEditingSize(s.size)}
                                                                    style={{
                                                                        background: isEditing ? (isLight ? '#fffbeb' : 'rgba(245,158,11,0.12)') : (isLight ? '#ffffff' : 'rgba(255,255,255,0.03)'),
                                                                        border: isEditing ? '2px solid #f59e0b' : (isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.08)'),
                                                                        borderRadius: '0.8rem', padding: '0.65rem', cursor: 'pointer',
                                                                        display: 'flex', flexDirection: 'column', gap: '0.4rem',
                                                                        boxShadow: isEditing ? '0 4px 15px rgba(245,158,11,0.2)' : 'none',
                                                                        transition: '0.15s'
                                                                    }}
                                                                >
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                                            <span style={{ fontSize: '0.82rem' }}>👕</span>
                                                                            <span style={{ fontWeight: '900', fontSize: '1rem', color: isEditing ? '#f59e0b' : 'var(--text-primary)' }}>
                                                                                BEDEN {s.size}
                                                                            </span>
                                                                        </div>
                                                                        <span style={{
                                                                            fontSize: '0.75rem', fontWeight: '900',
                                                                            color: isFulfilled ? '#10b981' : '#f59e0b',
                                                                            background: isFulfilled ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                                                                            padding: '0.15rem 0.45rem', borderRadius: '4px'
                                                                        }}>
                                                                            {s.quantity} Adet
                                                                        </span>
                                                                    </div>

                                                                    <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                                                                        <span>İhtiyaç: <strong style={{ color: 'var(--text-primary)' }}>{s.needed_chutes} Göz / Koli</strong></span>
                                                                        <span>Atanan: <strong style={{ color: isFulfilled ? '#10b981' : '#ef4444' }}>{assigned.length} Göz</strong></span>
                                                                    </div>

                                                                    {/* Assigned chute chips */}
                                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', minHeight: '26px', alignItems: 'center' }}>
                                                                        {assigned.length > 0 ? (
                                                                            assigned.map((chNo, idx) => (
                                                                                <span
                                                                                    key={chNo}
                                                                                    style={{
                                                                                        fontSize: '0.68rem', fontWeight: '900',
                                                                                        background: '#f59e0b', color: '#000',
                                                                                        padding: '0.1rem 0.4rem', borderRadius: '4px',
                                                                                        display: 'inline-flex', alignItems: 'center', gap: '0.25rem'
                                                                                    }}
                                                                                >
                                                                                    <span>{chToPhysicalMap[chNo] || `CH-${chNo}`}</span>
                                                                                    {assigned.length > 1 && <span style={{ opacity: 0.7, fontSize: '0.6rem' }}>(#{idx + 1})</span>}
                                                                                    <span
                                                                                        onClick={(e) => handleRemoveChuteFromSize(s.size, chNo, e)}
                                                                                        title="Bu gözü bu bedenden kaldır"
                                                                                        style={{ cursor: 'pointer', fontWeight: '900', marginLeft: '0.1rem' }}
                                                                                    >
                                                                                        ✕
                                                                                    </span>
                                                                                </span>
                                                                            ))
                                                                        ) : (
                                                                            <span style={{ fontSize: '0.65rem', color: '#ef4444', fontWeight: '700' }}>
                                                                                Henüz göz atanmadı
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    <div style={{
                                                                        marginTop: 'auto', paddingTop: '0.2rem',
                                                                        fontSize: '0.65rem', fontWeight: '800', textAlign: 'center',
                                                                        color: isEditing ? '#f59e0b' : 'var(--text-secondary)'
                                                                    }}>
                                                                        {isEditing ? '👉 Bu Beden Seçili (Aşağıdan Göz Tıklayın)' : 'Düzenlemek İçin Tıklayın'}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>

                                                    {/* Summary footer for sizes */}
                                                    <div style={{ marginTop: '0.6rem', padding: '0.5rem 0.8rem', background: isLight ? '#fff' : 'rgba(255,255,255,0.02)', borderRadius: '0.6rem', border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', fontWeight: '800', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                                            <span>Toplam Beden: <strong style={{ color: '#007BFF' }}>{orderSizes.length}</strong></span>
                                                            <span>Toplam Ürün: <strong style={{ color: '#007BFF' }}>{orderSizes.reduce((sum, s) => sum + s.quantity, 0)} ad.</strong></span>
                                                            <span>Gerekli Göz: <strong style={{ color: '#8b5cf6' }}>{orderSizes.reduce((sum, s) => sum + (s.needed_chutes || 1), 0)} Göz</strong></span>
                                                        </div>
                                                        <div style={{ color: selectedReservationChutes.length >= orderSizes.reduce((sum, s) => sum + (s.needed_chutes || 1), 0) ? '#10b981' : '#f59e0b' }}>
                                                            Atanan Toplam: <strong>{selectedReservationChutes.length} Göz</strong> {selectedReservationChutes.length >= orderSizes.reduce((sum, s) => sum + (s.needed_chutes || 1), 0) ? '✅ Tamamlandı' : '⚠️ Eksik Göz Var'}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* 3. Recommended Available Chutes Selection */}
                                <div style={{ background: isLight ? '#f8fafc' : 'rgba(255,255,255,0.03)', padding: '1.2rem', borderRadius: '1.2rem', border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.08)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                                        <div style={{ fontSize: '0.85rem', fontWeight: '900', color: splitBySize ? '#f59e0b' : '#10b981', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <span>🏢</span> 3. {splitBySize ? `Boş Sorter Gözleri (Aktif Beden: ${activeEditingSize ? `👕 ${activeEditingSize}` : 'Beden Seçin'}):` : `Önerilen Uygun Boş Gözler (${selectedReservationChutes.length} Seçili):`}
                                        </div>
                                        <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                                            Toplam Boş Göz: <strong style={{ color: '#10b981' }}>{availableChuteData?.total_empty || 0} / 60</strong>
                                        </div>
                                    </div>

                                    {availableChuteData?.available_chutes && availableChuteData.available_chutes.length > 0 ? (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.5rem', maxHeight: '160px', overflowY: 'auto', padding: '0.3rem' }}>
                                            {availableChuteData.available_chutes.map(ch => {
                                                if (splitBySize) {
                                                    const assignedSize = Object.keys(sizeAllocations).find(sz => (sizeAllocations[sz] || []).includes(ch.chute_no));
                                                    const isAssigned = !!assignedSize;
                                                    const isAssignedToActive = isAssigned && assignedSize === activeEditingSize;
                                                    return (
                                                        <div
                                                            key={ch.chute_no}
                                                            onClick={() => handleToggleChuteForActiveSize(ch.chute_no)}
                                                            style={{
                                                                background: isAssigned ? (isAssignedToActive ? (isLight ? '#fef3c7' : 'rgba(245,158,11,0.25)') : (isLight ? '#fffbeb' : 'rgba(245,158,11,0.12)')) : (isLight ? '#ffffff' : 'rgba(255,255,255,0.04)'),
                                                                border: isAssignedToActive ? '2px solid #f59e0b' : (isAssigned ? '1.5px dashed #f59e0b' : (isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.1)')),
                                                                borderRadius: '0.7rem', padding: '0.45rem 0.6rem', cursor: 'pointer',
                                                                display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
                                                                transition: '0.15s',
                                                                boxShadow: isAssignedToActive ? '0 2px 10px rgba(245,158,11,0.3)' : 'none'
                                                            }}
                                                        >
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                                                <span style={{ fontSize: '0.7rem', fontWeight: '800', color: isAssigned ? '#f59e0b' : 'var(--text-secondary)' }}>
                                                                    {ch.id}
                                                                </span>
                                                                {isAssigned && (
                                                                    <span style={{ fontSize: '0.62rem', background: '#f59e0b', color: '#000', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: '900' }}>
                                                                        👕 {assignedSize}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div style={{ fontSize: '0.95rem', fontWeight: '900', color: isAssigned ? '#f59e0b' : 'var(--text-primary)', margin: '0.1rem 0' }}>
                                                                {ch.physical_code}
                                                            </div>
                                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                                                                {ch.wall_name?.replace('Bölüm ', 'B.') || 'Modül'}
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                const isChecked = selectedReservationChutes.includes(ch.chute_no);
                                                const priorityIndex = selectedReservationChutes.indexOf(ch.chute_no);
                                                return (
                                                    <div
                                                        key={ch.chute_no}
                                                        onClick={() => {
                                                            if (isChecked) {
                                                                setSelectedReservationChutes(selectedReservationChutes.filter(n => n !== ch.chute_no));
                                                            } else {
                                                                setSelectedReservationChutes([...selectedReservationChutes, ch.chute_no]);
                                                            }
                                                        }}
                                                        style={{
                                                            background: isChecked ? (isLight ? '#ecfdf5' : 'rgba(16,185,129,0.18)') : (isLight ? '#ffffff' : 'rgba(255,255,255,0.04)'),
                                                            border: isChecked ? '2px solid #10b981' : (isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.1)'),
                                                            borderRadius: '0.7rem', padding: '0.45rem 0.6rem', cursor: 'pointer',
                                                            display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
                                                            transition: '0.15s'
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                                            <span style={{ fontSize: '0.7rem', fontWeight: '800', color: isChecked ? '#10b981' : 'var(--text-secondary)' }}>
                                                                {ch.id}
                                                            </span>
                                                            {isChecked && (
                                                                <span style={{ fontSize: '0.62rem', background: '#10b981', color: '#000', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: '900' }}>
                                                                    #{priorityIndex + 1}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div style={{ fontSize: '0.95rem', fontWeight: '900', color: isChecked ? '#10b981' : 'var(--text-primary)', margin: '0.1rem 0' }}>
                                                            {ch.physical_code}
                                                        </div>
                                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                                                            {ch.wall_name?.replace('Bölüm ', 'B.') || 'Modül'}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '1.5rem', color: '#ef4444', fontWeight: '800', fontSize: '0.85rem' }}>
                                            ⚠️ Sorter üzerinde boş göz kalmadı! Lütfen dolu gözleri boşaltın veya koli sıfırlaması yapın.
                                        </div>
                                    )}

                                    {/* Action Button */}
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                        <button
                                            disabled={isReservingOrder || selectedReservationChutes.length === 0 || !reserveOrderNumber}
                                            onClick={handleExecuteOrderReservation}
                                            style={{
                                                background: splitBySize ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #10b981, #059669)',
                                                color: '#000', border: 'none', padding: '0.8rem 1.8rem', borderRadius: '0.9rem',
                                                fontSize: '0.92rem', fontWeight: '900', cursor: isReservingOrder ? 'not-allowed' : 'pointer',
                                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                boxShadow: splitBySize ? '0 6px 20px rgba(245,158,11,0.35)' : '0 6px 20px rgba(16,185,129,0.35)', transition: '0.2s',
                                                opacity: (isReservingOrder || selectedReservationChutes.length === 0 || !reserveOrderNumber) ? 0.6 : 1
                                            }}
                                        >
                                            <span>🎯</span> {
                                                isReservingOrder ? 'Rezerve Ediliyor...' : (
                                                    splitBySize ? (
                                                        `SİPARİŞ #${reserveOrderNumber || '...'} İÇİN ${selectedReservationChutes.length} GÖZÜ BEDENLERE GÖRE REZERVE ET`
                                                    ) : (
                                                        `SİPARİŞ #${reserveOrderNumber || '...'} İÇİN ${selectedReservationChutes.length} GÖZÜ REZERVE ET & BAĞLA`
                                                    )
                                                )
                                            }
                                        </button>
                                    </div>
                                </div>

                                {/* 4. Active Order Reservations List */}
                                <div style={{ background: isLight ? '#f8fafc' : 'rgba(255,255,255,0.03)', padding: '1.2rem', borderRadius: '1.2rem', border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.08)' }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '0.6rem' }}>
                                        📋 Sorter'da Aktif Rezerve Edilmiş Siparişler:
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                                        {sorterMappings.filter(m => m.match_type === 'ORDER').length > 0 ? (
                                            sorterMappings.filter(m => m.match_type === 'ORDER').map(m => (
                                                <div 
                                                    key={m.id} 
                                                    style={{ 
                                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                                                        padding: '0.65rem 1rem', background: isLight ? '#ffffff' : 'rgba(255,255,255,0.05)', 
                                                        borderRadius: '0.8rem', border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.08)' 
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                                        <span style={{ fontSize: '0.68rem', fontWeight: '900', background: '#10b98120', color: '#10b981', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                                                            SİPARİŞ REZERVE
                                                        </span>
                                                        <span style={{ fontWeight: '800', fontSize: '0.88rem' }}>{m.destination_name}</span>
                                                        {(m.size || (m.destination_name && m.destination_name.includes('[Beden:'))) && (
                                                            <span style={{
                                                                fontSize: '0.72rem',
                                                                background: 'rgba(245,158,11,0.15)',
                                                                color: '#f59e0b',
                                                                border: '1px solid rgba(245,158,11,0.5)',
                                                                padding: '0.12rem 0.45rem',
                                                                borderRadius: '4px',
                                                                fontWeight: '900',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '0.2rem'
                                                            }}>
                                                                👕 BEDEN: {m.size || (m.destination_name.match(/\[Beden:\s*([^\]]+)\]/) ? m.destination_name.match(/\[Beden:\s*([^\]]+)\]/)[1] : '')}
                                                            </span>
                                                        )}
                                                        <span style={{ fontSize: '0.72rem', background: 'rgba(0,123,255,0.1)', color: '#007BFF', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: '800' }}>
                                                            Kaskad #{m.priority}
                                                        </span>
                                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                                                            (Koli Kapasitesi: {m.target_capacity || 25} ad.)
                                                        </span>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                                        <span style={{ fontWeight: '900', fontSize: '1rem', color: '#007BFF' }}>
                                                            {chToPhysicalMap[m.chute_no] || `CH-${m.chute_no}`}
                                                        </span>
                                                        <button 
                                                            onClick={() => handleDeleteMapping(m.id)} 
                                                            title="Bu gözün rezervasyonunu kaldır"
                                                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.1rem' }}
                                                        >
                                                            🗑
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                                Şu anda rezerve edilmiş sipariş bulunmuyor. Yukarıdan sipariş numarası girerek gözleri hemen rezerve edebilirsiniz.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* TAB 2: MANUAL MATCHING */
                            <div>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.2fr 1fr 1fr auto', gap: '0.6rem', marginBottom: '1.5rem', alignItems: 'center' }}>
                                    <input 
                                        type="text" 
                                        placeholder="Hedef / Bayi / Ürün / Beden Adı" 
                                        value={newMappingDest}
                                        onChange={e => setNewMappingDest(e.target.value)}
                                        style={{ padding: '0.8rem', borderRadius: '0.8rem', border: '1px solid var(--border-subtle)', background: isLight ? '#fff' : '#222', color: isLight ? '#000' : '#fff', fontSize: '0.85rem' }}
                                    />
                                    <select 
                                        value={newMappingType} 
                                        onChange={e => setNewMappingType(e.target.value)}
                                        style={{ padding: '0.8rem', borderRadius: '0.8rem', border: '1px solid var(--border-subtle)', background: isLight ? '#fff' : '#222', color: isLight ? '#000' : '#fff', fontWeight: 'bold', fontSize: '0.85rem' }}
                                    >
                                        <option value="DEALER">🏢 Bayi / Müşteri</option>
                                        <option value="BRAND">🏷️ Marka</option>
                                        <option value="PRODUCT">👕 Ürün Modeli</option>
                                        <option value="SIZE">📏 Beden</option>
                                    </select>
                                    <select 
                                        value={newMappingChute} 
                                        onChange={e => setNewMappingChute(Number(e.target.value))}
                                        style={{ padding: '0.8rem', borderRadius: '0.8rem', border: '1px solid var(--border-subtle)', background: isLight ? '#fff' : '#222', color: isLight ? '#000' : '#fff', fontWeight: 'bold', fontSize: '0.85rem' }}
                                    >
                                        {Array.from({ length: 60 }, (_, i) => i + 1).map(num => (
                                            <option key={num} value={num}>
                                                {chToPhysicalMap[num] || `CH-${num.toString().padStart(2, '0')}`}
                                            </option>
                                        ))}
                                    </select>
                                    <input 
                                        type="number" 
                                        title="Kaskad Taşma Önceliği (1: İlk Koli, 2: İkinci Koli...)" 
                                        placeholder="Sıra"
                                        min="1"
                                        max="10"
                                        value={newMappingPriority}
                                        onChange={e => setNewMappingPriority(Number(e.target.value))}
                                        style={{ padding: '0.8rem', borderRadius: '0.8rem', border: '1px solid var(--border-subtle)', background: isLight ? '#fff' : '#222', color: isLight ? '#000' : '#fff', fontSize: '0.85rem', textAlign: 'center' }}
                                    />
                                    <input 
                                        type="number" 
                                        title="Koli Hedef Kapasitesi (Adet)" 
                                        placeholder="Kap."
                                        min="1"
                                        max="500"
                                        value={newMappingCapacity}
                                        onChange={e => setNewMappingCapacity(Number(e.target.value))}
                                        style={{ padding: '0.8rem', borderRadius: '0.8rem', border: '1px solid var(--border-subtle)', background: isLight ? '#fff' : '#222', color: isLight ? '#000' : '#fff', fontSize: '0.85rem', textAlign: 'center' }}
                                    />
                                    <button onClick={handleSaveMapping} style={{ background: 'var(--color-success)', color: '#000', border: 'none', padding: '0.8rem 1.2rem', borderRadius: '0.8rem', fontWeight: '800', cursor: 'pointer', fontSize: '0.85rem' }}>
                                        EKLE
                                    </button>
                                </div>

                                <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                    {sorterMappings.map(m => (
                                        <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1.2rem', background: isLight ? '#f1f5f9' : 'var(--bg-primary)', borderRadius: '1rem', border: '1px solid var(--border-subtle)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                                <span style={{ 
                                                    padding: '0.2rem 0.6rem', borderRadius: '0.4rem', fontSize: '0.7rem', fontWeight: '900',
                                                    background: m.match_type === 'BRAND' ? '#8b5cf620' : (m.match_type === 'PRODUCT' ? '#ec489920' : (m.match_type === 'SIZE' ? '#f59e0b20' : '#007bff20')),
                                                    color: m.match_type === 'BRAND' ? '#8b5cf6' : (m.match_type === 'PRODUCT' ? '#ec4899' : (m.match_type === 'SIZE' ? '#f59e0b' : '#007bff'))
                                                }}>
                                                    {m.match_type === 'BRAND' ? 'MARKA' : (m.match_type === 'PRODUCT' ? 'ÜRÜN' : (m.match_type === 'SIZE' ? 'BEDEN' : (m.match_type === 'ORDER' ? 'SİPARİŞ' : 'BAYİ')))}
                                                </span>
                                                <span style={{ fontWeight: '700', color: isLight ? '#0f172a' : '#ffffff', fontSize: '0.95rem' }}>{m.destination_name}</span>
                                                {m.priority > 1 && (
                                                    <span style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.06)', padding: '0.1rem 0.4rem', borderRadius: '0.3rem', fontWeight: 'bold' }}>
                                                        Kaskad #{m.priority}
                                                    </span>
                                                )}
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                    (Koli: {m.target_capacity || 25} ad.)
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <span style={{ color: '#007BFF', fontWeight: '900', fontSize: '1.15rem' }}>
                                                    {chToPhysicalMap[m.chute_no] || `CH-${m.chute_no.toString().padStart(2, '0')}`}
                                                </span>
                                                <button onClick={() => handleDeleteMapping(m.id)} style={{ background: 'transparent', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontSize: '1.2rem' }}>🗑</button>
                                            </div>
                                        </div>
                                    ))}
                                    {sorterMappings.length === 0 && <div style={{ textAlign: 'center', color: isLight ? '#666' : '#ccc', padding: '2rem' }}>Henüz eşleştirme bulunmuyor.</div>}
                                </div>
                            </div>
                        )}

                        {/* Footer */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: isLight ? '1px solid rgba(15,23,42,0.1)' : '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem', marginTop: 'auto' }}>
                            <button 
                                onClick={() => setIsMappingModalOpen(false)} 
                                className="btn-primary"
                                style={{ padding: '0.6rem 1.5rem', borderRadius: '0.8rem', fontSize: '0.85rem', cursor: 'pointer' }}
                            >
                                Kapat
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CART & WALL LABELS PRINT MODAL */}
            {isCartLabelsModalOpen && (
                <div 
                    onClick={() => setIsCartLabelsModalOpen(false)}
                    style={{ 
                        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10000, 
                        background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                >
                    <div 
                        onClick={e => e.stopPropagation()}
                        style={{ 
                            width: '90%', maxWidth: '920px', background: isLight ? '#ffffff' : '#0f172a', borderRadius: '2rem', padding: '2.2rem', 
                            border: isLight ? '1px solid rgba(15,23,42,0.1)' : '1px solid rgba(255,255,255,0.1)',
                            boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
                            maxHeight: '90vh', display: 'flex', flexDirection: 'column'
                        }}
                    >
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: isLight ? '1px solid #f1f5f9' : '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.8rem', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.8rem' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem' }}>
                                    <span style={{ fontSize: '1.4rem' }}>🖨️</span>
                                    <h2 style={{ fontSize: '1.35rem', fontWeight: '900', margin: 0, color: isLight ? '#0f172a' : '#ffffff' }}>
                                        Etiket Basım Merkezi • {printerTarget === 'TSC' ? 'TSC TTP-244CE (Karekod / QRCode)' : 'SATO CL4NX Plus'}
                                    </h2>
                                </div>
                                <p style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: '700', margin: 0 }}>
                                    📱 Tüm etiketler Zebra TC21 ve optik terminaller için yüksek hızlı QR Code (Karekod) formatında basılmaktadır.
                                </p>
                            </div>

                            {/* Printer & Profile Switcher */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                                {/* Printer Target Switcher */}
                                <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', background: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.06)', padding: '0.25rem 0.45rem', borderRadius: '0.8rem', border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.1)' }}>
                                    <span style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-secondary)', paddingLeft: '0.2rem' }}>Yazıcı:</span>
                                    <button
                                        onClick={() => { setPrinterTarget('TSC'); setLabelProfile('STANDARD'); }}
                                        style={{
                                            background: printerTarget === 'TSC' ? '#007BFF' : 'transparent',
                                            color: printerTarget === 'TSC' ? '#fff' : 'var(--text-primary)',
                                            border: 'none', padding: '0.25rem 0.6rem', borderRadius: '0.5rem',
                                            fontSize: '0.74rem', fontWeight: '800', cursor: 'pointer', transition: '0.2s'
                                        }}
                                    >
                                        🖨️ TSC TTP-244CE
                                    </button>
                                    <button
                                        onClick={() => setPrinterTarget('SATO')}
                                        style={{
                                            background: printerTarget === 'SATO' ? '#8b5cf6' : 'transparent',
                                            color: printerTarget === 'SATO' ? '#fff' : 'var(--text-primary)',
                                            border: 'none', padding: '0.25rem 0.6rem', borderRadius: '0.5rem',
                                            fontSize: '0.74rem', fontWeight: '800', cursor: 'pointer', transition: '0.2s'
                                        }}
                                    >
                                        🖨️ SATO CL4NX
                                    </button>
                                </div>

                                {/* RFID / Standard Profile (if SATO) */}
                                {printerTarget === 'SATO' && (
                                    <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', background: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.06)', padding: '0.25rem 0.45rem', borderRadius: '0.8rem', border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.1)' }}>
                                        <button
                                            onClick={() => setLabelProfile('STANDARD')}
                                            style={{
                                                background: labelProfile === 'STANDARD' ? '#10b981' : 'transparent',
                                                color: labelProfile === 'STANDARD' ? '#fff' : 'var(--text-primary)',
                                                border: 'none', padding: '0.25rem 0.5rem', borderRadius: '0.5rem',
                                                fontSize: '0.72rem', fontWeight: '800', cursor: 'pointer'
                                            }}
                                        >
                                            Çipsiz
                                        </button>
                                        <button
                                            onClick={() => setLabelProfile('RFID')}
                                            style={{
                                                background: labelProfile === 'RFID' ? '#a855f7' : 'transparent',
                                                color: labelProfile === 'RFID' ? '#fff' : 'var(--text-primary)',
                                                border: 'none', padding: '0.25rem 0.5rem', borderRadius: '0.5rem',
                                                fontSize: '0.72rem', fontWeight: '800', cursor: 'pointer'
                                            }}
                                        >
                                            📡 RFID
                                        </button>
                                    </div>
                                )}

                                <button 
                                    onClick={() => setIsCartLabelsModalOpen(false)}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.4rem', cursor: 'pointer', padding: '0 0.3rem' }}
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        {/* Category Tabs */}
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.9rem', flexWrap: 'wrap' }}>
                            {[
                                { id: 'ALL', label: '🗂️ Tümü', count: CART_AND_WALL_ITEMS.length },
                                { id: 'CHUTE', label: '📦 Araba Gözleri', count: 120 },
                                { id: 'CART', label: '🛒 Arabalar', count: 16 },
                                { id: 'WALL', label: '🏢 Duvar Modülleri', count: 8 }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setCartLabelsTab(tab.id)}
                                    style={{
                                        background: cartLabelsTab === tab.id ? '#007BFF' : (isLight ? '#f1f5f9' : 'rgba(255,255,255,0.05)'),
                                        color: cartLabelsTab === tab.id ? '#fff' : 'var(--text-primary)',
                                        border: 'none', padding: '0.45rem 0.9rem', borderRadius: '0.7rem',
                                        fontSize: '0.8rem', fontWeight: '800', cursor: 'pointer', transition: '0.2s'
                                    }}
                                >
                                    {tab.label} ({tab.count})
                                </button>
                            ))}
                        </div>

                        {/* Cart Quick Filter Badges (R01..R16) */}
                        {(cartLabelsTab === 'ALL' || cartLabelsTab === 'CHUTE') && (
                            <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '0.9rem', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Araba Filtresi:</span>
                                <button
                                    onClick={() => setSelectedCartFilter('ALL')}
                                    style={{
                                        background: selectedCartFilter === 'ALL' ? '#10b981' : (isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)'),
                                        color: selectedCartFilter === 'ALL' ? '#fff' : 'var(--text-primary)',
                                        border: 'none', padding: '0.25rem 0.6rem', borderRadius: '0.5rem',
                                        fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer'
                                    }}
                                >
                                    Tümü
                                </button>
                                {Array.from({ length: 16 }, (_, i) => `R${(i + 1).toString().padStart(2, '0')}`).map(cart => (
                                    <button
                                        key={cart}
                                        onClick={() => setSelectedCartFilter(cart)}
                                        style={{
                                            background: selectedCartFilter === cart ? '#10b981' : (isLight ? '#f1f5f9' : 'rgba(255,255,255,0.05)'),
                                            color: selectedCartFilter === cart ? '#fff' : 'var(--text-primary)',
                                            border: 'none', padding: '0.25rem 0.6rem', borderRadius: '0.5rem',
                                            fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer'
                                        }}
                                    >
                                        {cart}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Top Action Bar */}
                        <div style={{ 
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem',
                            background: isLight ? '#f8fafc' : 'rgba(255,255,255,0.03)', padding: '0.75rem 1.1rem', borderRadius: '0.9rem',
                            border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.06)', marginBottom: '1rem'
                        }}>
                            {(() => {
                                const filteredItems = CART_AND_WALL_ITEMS.filter(x => {
                                    if (cartLabelsTab !== 'ALL' && x.type !== cartLabelsTab) return false;
                                    if (selectedCartFilter !== 'ALL' && x.type === 'CHUTE' && x.cart !== selectedCartFilter) return false;
                                    return true;
                                });
                                const allFilteredSelected = filteredItems.length > 0 && filteredItems.every(x => selectedCartCodes.has(x.code));

                                return (
                                    <>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                            <button
                                                onClick={() => {
                                                    const next = new Set(selectedCartCodes);
                                                    if (allFilteredSelected) {
                                                        filteredItems.forEach(x => next.delete(x.code));
                                                    } else {
                                                        filteredItems.forEach(x => next.add(x.code));
                                                    }
                                                    setSelectedCartCodes(next);
                                                }}
                                                style={{
                                                    background: 'rgba(0,123,255,0.1)', border: '1px solid rgba(0,123,255,0.3)',
                                                    color: '#007BFF', padding: '0.4rem 0.8rem', borderRadius: '0.6rem',
                                                    fontSize: '0.78rem', fontWeight: '800', cursor: 'pointer'
                                                }}
                                            >
                                                {allFilteredSelected ? 'Filtrelenenleri Bırak' : `Görünenleri Seç (${filteredItems.length})`}
                                            </button>
                                            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: '700' }}>
                                                {selectedCartCodes.size} / {CART_AND_WALL_ITEMS.length} Seçili
                                            </span>
                                        </div>

                                        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                            {/* PDF Direct Download / View Button */}
                                            <button
                                                onClick={() => {
                                                    const pdfType = cartLabelsTab === 'WALL' ? 'WALL' : (cartLabelsTab === 'CART' ? 'CART' : (cartLabelsTab === 'CHUTE' ? 'CHUTE' : 'MASTER'));
                                                    window.open(`${API_BASE_URL}/api/printer/download-pdf?type=${pdfType}&inline=true`, '_blank');
                                                }}
                                                style={{
                                                    background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.5)',
                                                    color: '#f87171', padding: '0.5rem 1rem', borderRadius: '0.7rem',
                                                    fontSize: '0.82rem', fontWeight: '800', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', gap: '0.4rem'
                                                }}
                                                title="Tüm seçili etiketleri 100x50 mm standart PDF dosyası olarak açar ve indirir"
                                            >
                                                <span>📄</span> PDF Olarak Aç / İndir
                                            </button>

                                            {/* Browser HTML Print Preview Button */}
                                            <button
                                                onClick={() => handleOpenHtmlPrintView(selectedCartCodes.size > 0 ? Array.from(selectedCartCodes) : filteredItems.map(x => x.code))}
                                                style={{
                                                    background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.5)',
                                                    color: '#38bdf8', padding: '0.5rem 1rem', borderRadius: '0.7rem',
                                                    fontSize: '0.82rem', fontWeight: '800', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', gap: '0.4rem'
                                                }}
                                                title="Tarayıcının yazdırma penceresini açar (TSC TTP-244CE veya herhangi bir yazıcı seçilebilir)"
                                            >
                                                <span>🌐</span> Tarayıcıdan Yazdır (Önizleme)
                                            </button>

                                            {selectedCartCodes.size > 0 && (
                                                <button
                                                    disabled={isPrintingCartLabels}
                                                    onClick={() => handlePrintCartLabels(Array.from(selectedCartCodes))}
                                                    style={{
                                                        background: '#8b5cf6', color: '#fff', border: 'none',
                                                        padding: '0.5rem 1.1rem', borderRadius: '0.7rem',
                                                        fontSize: '0.82rem', fontWeight: '900', cursor: 'pointer',
                                                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                                                        boxShadow: '0 4px 15px rgba(139,92,246,0.35)',
                                                        opacity: isPrintingCartLabels ? 0.7 : 1
                                                    }}
                                                >
                                                    <span>📑</span> {printerTarget}'den Seçilenleri Yazdır ({selectedCartCodes.size})
                                                </button>
                                            )}

                                            <button
                                                disabled={isPrintingCartLabels}
                                                onClick={() => handlePrintCartLabels(filteredItems.map(x => x.code))}
                                                style={{
                                                    background: '#22c55e', color: '#fff', border: 'none',
                                                    padding: '0.5rem 1.2rem', borderRadius: '0.7rem',
                                                    fontSize: '0.82rem', fontWeight: '900', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                                                    boxShadow: '0 4px 15px rgba(34,197,94,0.35)',
                                                    opacity: isPrintingCartLabels ? 0.7 : 1
                                                }}
                                            >
                                                <span>⚡</span> {isPrintingCartLabels ? 'Yazdırılıyor...' : `${printerTarget}'den Yazdır (${filteredItems.length} Adet)`}
                                            </button>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>

                        {/* Feedback Banner */}
                        {cartLabelsPrintFeedback && (
                            <div style={{
                                padding: '0.75rem 1.1rem', borderRadius: '0.8rem', marginBottom: '1rem',
                                background: cartLabelsPrintFeedback.type === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                                border: `1px solid ${cartLabelsPrintFeedback.type === 'success' ? '#22c55e' : '#ef4444'}`,
                                color: cartLabelsPrintFeedback.type === 'success' ? '#22c55e' : '#ef4444',
                                fontSize: '0.85rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem'
                            }}>
                                <span>{cartLabelsPrintFeedback.type === 'success' ? '✅' : '❌'}</span>
                                {cartLabelsPrintFeedback.text}
                            </div>
                        )}

                        {/* Scrollable Label Cards */}
                        <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '0.6rem', paddingRight: '0.3rem' }}>
                            {CART_AND_WALL_ITEMS
                                .filter(x => {
                                    if (cartLabelsTab !== 'ALL' && x.type !== cartLabelsTab) return false;
                                    if (selectedCartFilter !== 'ALL' && x.type === 'CHUTE' && x.cart !== selectedCartFilter) return false;
                                    return true;
                                })
                                .map(item => {
                                    const isSelected = selectedCartCodes.has(item.code);
                                    const isChute = item.type === 'CHUTE';
                                    const isCart = item.type === 'CART';
                                    const accent = isChute ? '#0284c7' : (isCart ? '#007BFF' : '#8b5cf6');

                                    return (
                                        <div 
                                            key={item.code}
                                            onClick={() => toggleCartCodeSelection(item.code)}
                                            style={{
                                                background: isSelected 
                                                    ? (isLight ? '#eff6ff' : 'rgba(0,123,255,0.15)') 
                                                    : (isLight ? '#ffffff' : 'rgba(255,255,255,0.03)'),
                                                border: `1.5px solid ${isSelected ? accent : (isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)')}`,
                                                borderRadius: '0.8rem', padding: '0.65rem 0.85rem',
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                cursor: 'pointer', transition: '0.2s'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={isSelected}
                                                    onChange={() => {}}
                                                    style={{ cursor: 'pointer', width: '15px', height: '15px', accentColor: accent }}
                                                />
                                                <div>
                                                    <div style={{ fontSize: '0.95rem', fontWeight: '900', color: isLight ? '#0f172a' : '#f8fafc' }}>{item.code}</div>
                                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handlePrintCartLabels([item.code]);
                                                }}
                                                disabled={isPrintingCartLabels}
                                                title={`${item.code} Etiketini Yazdır`}
                                                style={{
                                                    background: `${accent}18`, border: `1px solid ${accent}40`,
                                                    color: accent, padding: '0.3rem 0.55rem', borderRadius: '0.5rem',
                                                    fontSize: '0.72rem', fontWeight: '800', cursor: 'pointer'
                                                }}
                                            >
                                                🖨️
                                            </button>
                                        </div>
                                    );
                                })}
                        </div>

                        {/* Modal Footer */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: isLight ? '1px solid #f1f5f9' : '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem', marginTop: '1.2rem' }}>
                            <button 
                                onClick={() => setIsCartLabelsModalOpen(false)}
                                className="btn-primary"
                                style={{ padding: '0.6rem 1.6rem', borderRadius: '0.8rem', fontSize: '0.85rem', cursor: 'pointer' }}
                            >
                                Kapat
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* OMNISORT LED IŞIK ŞERİTLERİ DEVREYE ALMA & KONTROL MERKEZİ (REBUILD) */}
            {isLedModalOpen && (
                <div 
                    onClick={() => setIsLedModalOpen(false)}
                    style={{
                        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                        zIndex: 11000, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
                    }}
                >
                    <div 
                        onClick={e => e.stopPropagation()}
                        style={{
                            width: '840px',
                            maxWidth: '96vw',
                            maxHeight: '92vh',
                            background: isLight ? '#ffffff' : '#0b1120',
                            border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(56,189,248,0.25)',
                            borderRadius: '1.6rem',
                            padding: '1.6rem 2rem',
                            boxShadow: '0 25px 70px rgba(0,0,0,0.75), 0 0 40px rgba(56,189,248,0.1)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem',
                            overflowY: 'auto'
                        }}
                    >
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.8rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                <span style={{ fontSize: '2rem' }}>🌈</span>
                                <div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: '900', color: isLight ? '#0f172a' : '#ffffff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                        <span>OmniSort Işık Şeritleri & Çift Renk Kontrol Merkezi</span>
                                        <span style={{ fontSize: '0.68rem', padding: '0.2rem 0.55rem', borderRadius: '0.5rem', background: '#10b98122', color: '#10b981', border: '1px solid #10b98144', fontWeight: '800' }}>
                                            6.2 DUAL-LED KOMBİNASYON
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                        HC Robotics OmniSort Mini (M145) duvar çerçevesi ve göz şeritlerini çift renk kombinasyonlarıyla yönetin
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsLedModalOpen(false)} 
                                style={{ background: 'transparent', border: 'none', color: isLight ? '#000' : '#fff', fontSize: '2rem', fontWeight: 'bold', cursor: 'pointer', lineHeight: '1' }}
                            >
                                &times;
                            </button>
                        </div>

                        {/* Top Navigation Tabs */}
                        <div style={{ display: 'flex', gap: '0.5rem', background: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.04)', padding: '0.35rem', borderRadius: '1rem', border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.08)' }}>
                            {[
                                { id: 'ALL', label: '🏢 TEK RENK (TÜMÜ)', icon: '⚡' },
                                { id: 'DUAL', label: '🎭 DUVAR + GÖZ KOMBİNASYONU', icon: '✨' },
                                { id: 'WALLS', label: '🧱 DUVAR MODÜLLERİ (9 DUVAR)', icon: '🏢' },
                                { id: 'CHUTE', label: '🎯 TEKİL GÖZ (1..63)', icon: '📦' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => { setLedActiveTab(tab.id); setLedFeedback(null); }}
                                    style={{
                                        flex: 1, padding: '0.6rem 0.8rem', borderRadius: '0.75rem', border: 'none',
                                        background: ledActiveTab === tab.id ? (isLight ? '#ffffff' : '#0284c7') : 'transparent',
                                        color: ledActiveTab === tab.id ? (isLight ? '#0284c7' : '#ffffff') : 'var(--text-secondary)',
                                        fontWeight: '900', fontSize: '0.82rem', cursor: 'pointer', transition: '0.2s',
                                        boxShadow: ledActiveTab === tab.id ? '0 4px 12px rgba(0,0,0,0.15)' : 'none'
                                    }}
                                >
                                    <span>{tab.icon}</span> {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Feedback Banner */}
                        {ledFeedback && (
                            <div style={{
                                padding: '0.75rem 1.2rem', borderRadius: '0.8rem', fontSize: '0.85rem', fontWeight: '800',
                                background: ledFeedback.type === 'success' ? 'rgba(16,185,129,0.18)' : 'rgba(239,68,68,0.18)',
                                color: ledFeedback.type === 'success' ? '#10b981' : '#ef4444',
                                border: `1.5px solid ${ledFeedback.type === 'success' ? '#10b981' : '#ef4444'}`,
                                display: 'flex', alignItems: 'center', gap: '0.5rem'
                            }}>
                                <span>{ledFeedback.type === 'success' ? '✅' : '❌'}</span>
                                <span>{ledFeedback.text}</span>
                            </div>
                        )}

                        {/* TAB 1: TÜM MAKİNE HIZLI RENK YAKMA */}
                        {ledActiveTab === 'ALL' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--text-secondary)' }}>
                                    ✨ TÜM MAKİNEYİ TEK TIKLA YAKIN VEYA SÖNDÜRÜN (STANDART 6 DURUM):
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                                    {[
                                        { id: 'GREEN', name: '1: TÜMÜ YEŞİL', color: '#10b981', bg: 'rgba(16,185,129,0.15)', border: '#10b981', desc: 'Tamamlanan Göz (Sipariş / Koli Bitti)', icon: '🟢', mode: 'SOLID' },
                                        { id: 'YELLOW', name: '2: TÜMÜ SARI', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: '#f59e0b', desc: 'Yeni Sipariş (Boş / Rezerve Göz)', icon: '🟡', mode: 'SOLID' },
                                        { id: 'BLUE', name: '4: TÜMÜ MAVİ', color: '#38bdf8', bg: 'rgba(0,123,255,0.15)', border: '#007BFF', desc: 'Kısmi Dolu (Toplama Devam Ediyor)', icon: '🔵', mode: 'SOLID' },
                                        { id: 'PURPLE', name: '5: TÜMÜ MOR', color: '#a78bfa', bg: 'rgba(139,92,246,0.15)', border: '#8b5cf6', desc: 'Göz Sensörü Okudu / İhlal', icon: '🟣', mode: 'FLASH' },
                                        { id: 'RED', name: '3: TÜMÜ KIRMIZI', color: '#ef4444', bg: 'rgba(239,68,68,0.15)', border: '#ef4444', desc: 'Hata / Tanımsız / Arıza Modu', icon: '🔴', mode: 'FLASH' },
                                        { id: 'OFF', name: '0: TÜMÜNÜ SÖNDÜR', color: 'var(--text-primary)', bg: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.06)', border: isLight ? '#cbd5e1' : 'rgba(255,255,255,0.2)', desc: 'Tüm Işıkları Kapat (Boş / Beklemede)', icon: '📴', mode: 'SOLID' }
                                    ].map(btn => (
                                        <button
                                            key={btn.id}
                                            onClick={() => handleSendLedCommand(btn.id, btn.mode, 'ALL')}
                                            disabled={isSendingLedCmd}
                                            style={{
                                                background: btn.bg, border: `2px solid ${btn.border}`, color: btn.color,
                                                padding: '1rem 0.9rem', borderRadius: '1rem', cursor: 'pointer', textAlign: 'left',
                                                display: 'flex', flexDirection: 'column', gap: '0.3rem', transition: '0.2s',
                                                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                                            }}
                                            onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'}
                                            onMouseOut={e => e.currentTarget.style.transform = 'none'}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span style={{ fontSize: '1.3rem' }}>{btn.icon}</span>
                                                <span style={{ fontWeight: '900', fontSize: '0.92rem' }}>{btn.name}</span>
                                            </div>
                                            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: '700' }}>
                                                {btn.desc}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* TAB 2: DUVAR + GÖZ ÇİFT RENK KOMBİNASYONU */}
                        {ledActiveTab === 'DUAL' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                                {/* Scope / Hedef Seçimi */}
                                <div style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    background: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.03)',
                                    padding: '0.65rem 1rem', borderRadius: '1rem',
                                    border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.08)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                        <span style={{ fontWeight: '800', fontSize: '0.85rem' }}>🎯 Uygulama Kapsamı:</span>
                                        <div style={{ display: 'flex', gap: '0.3rem' }}>
                                            {[
                                                { id: 'ALL', label: '🏢 Tüm Makine' },
                                                { id: 'WALL', label: '🧱 Duvar Modülü' },
                                                { id: 'CHUTE', label: '📦 Tekil Göz' }
                                            ].map(sc => (
                                                <button
                                                    key={sc.id}
                                                    onClick={() => setDualScope(sc.id)}
                                                    style={{
                                                        padding: '0.35rem 0.75rem', borderRadius: '0.6rem', border: 'none',
                                                        background: dualScope === sc.id ? '#0284c7' : (isLight ? '#ffffff' : 'rgba(255,255,255,0.08)'),
                                                        color: dualScope === sc.id ? '#ffffff' : 'var(--text-secondary)',
                                                        fontWeight: '800', fontSize: '0.78rem', cursor: 'pointer', transition: '0.2s'
                                                    }}
                                                >
                                                    {sc.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {dualScope === 'WALL' && (
                                        <select
                                            value={dualSelectedWall}
                                            onChange={e => setDualSelectedWall(e.target.value)}
                                            style={{
                                                padding: '0.4rem 0.8rem', borderRadius: '0.6rem',
                                                background: isLight ? '#ffffff' : '#1e293b', color: isLight ? '#0f172a' : '#ffffff',
                                                border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.2)',
                                                fontWeight: '800', fontSize: '0.8rem'
                                            }}
                                        >
                                            {[
                                                { id: 'M145-WALL-A-1', label: 'Duvar A-1 (Sol Modül / Göz 1..9)' },
                                                { id: 'M145-WALL-A-0', label: 'Duvar A-0 (Sol Başı / Göz 10..15)' },
                                                { id: 'M145-WALL-A-2', label: 'Duvar A-2 (Asansör Arkası / Göz 61..63)' },
                                                { id: 'M145-WALL-A-3', label: 'Duvar A-3 (Sağ Modül / Göz 16..24)' },
                                                { id: 'M145-WALL-A-4', label: 'Duvar A-4 (Sağ Başı / Göz 25..30)' },
                                                { id: 'M145-WALL-B-1', label: 'Duvar B-1 (Sol Modül / Göz 31..39)' },
                                                { id: 'M145-WALL-B-0', label: 'Duvar B-0 (Sol Başı / Göz 40..45)' },
                                                { id: 'M145-WALL-B-3', label: 'Duvar B-3 (Sağ Modül / Göz 46..54)' },
                                                { id: 'M145-WALL-B-4', label: 'Duvar B-4 (Sağ Başı / Göz 55..60)' }
                                            ].map(w => <option key={w.id} value={w.id}>{w.label}</option>)}
                                        </select>
                                    )}

                                    {dualScope === 'CHUTE' && (
                                        <select
                                            value={dualSelectedChute}
                                            onChange={e => setDualSelectedChute(parseInt(e.target.value, 10))}
                                            style={{
                                                padding: '0.4rem 0.8rem', borderRadius: '0.6rem',
                                                background: isLight ? '#ffffff' : '#1e293b', color: isLight ? '#0f172a' : '#ffffff',
                                                border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.2)',
                                                fontWeight: '800', fontSize: '0.8rem'
                                            }}
                                        >
                                            {Array.from({ length: 63 }, (_, i) => i + 1).map(ch => (
                                                <option key={ch} value={ch}>📦 Göz #{ch} ({chToPhysicalMap[ch] || `CH-${ch}`})</option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                {/* Hazır Popüler Kombinasyonlar */}
                                <div>
                                    <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-secondary)', marginBottom: '0.6rem' }}>
                                        ⭐ HAZIR ÇİFT RENK KOMBİNASYONLARI (TEK TIKLA ÇALIŞTIRIN):
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem' }}>
                                        {[
                                            {
                                                title: '🌊 Turkuaz / Hedef Yönlendirme',
                                                wall: 'BLUE', chute: 'GREEN',
                                                wallMode: 'SOLID', chuteMode: 'SOLID',
                                                wallLabel: '🔵 Mavi Duvar', chuteLabel: '🟢 Yeşil Göz',
                                                desc: 'Mavi duvar çerçevesi operatörü modüle çağırır, hedef göz Yeşil parlar',
                                                accent: '#06b6d4'
                                            },
                                            {
                                                title: '⚡ Dinamik Turkuaz Çakar',
                                                wall: 'BLUE', chute: 'GREEN',
                                                wallMode: 'SOLID', chuteMode: 'FLASH',
                                                wallLabel: '🔵 Mavi Duvar', chuteLabel: '🟢⚡ Yeşil Flaş',
                                                desc: 'Sabit mavi çerçeve altında yeşil flaş çakan hedef ürün gözü',
                                                accent: '#10b981'
                                            },
                                            {
                                                title: '👑 VIP / Özel Sipariş',
                                                wall: 'PURPLE', chute: 'YELLOW',
                                                wallMode: 'SOLID', chuteMode: 'SOLID',
                                                wallLabel: '🟣 Mor Duvar', chuteLabel: '🟡 Sarı Göz',
                                                desc: 'Mor duvar çerçevesi içinde sarı rezerve edilmiş yeni sipariş gözü',
                                                accent: '#8b5cf6'
                                            },
                                            {
                                                title: '📦 Koli Tamamlandı / Alma',
                                                wall: 'GREEN', chute: 'BLUE',
                                                wallMode: 'SOLID', chuteMode: 'SOLID',
                                                wallLabel: '🟢 Yeşil Duvar', chuteLabel: '🔵 Mavi Göz',
                                                desc: 'Yeşil bitiş çerçevesi altında mavi toplama devam eden gözler',
                                                accent: '#10b981'
                                            },
                                            {
                                                title: '🚨 Kritik Alarm / İhlal',
                                                wall: 'PURPLE', chute: 'RED',
                                                wallMode: 'SOLID', chuteMode: 'FLASH',
                                                wallLabel: '🟣 Mor Duvar', chuteLabel: '🔴⚡ Kırmızı Flaş',
                                                desc: 'Sensör engeli veya arıza durumu için çift renkli güçlü alarm',
                                                accent: '#ef4444'
                                            },
                                            {
                                                title: '⚠️ Rezerve & Bekleme',
                                                wall: 'YELLOW', chute: 'BLUE',
                                                wallMode: 'SOLID', chuteMode: 'SOLID',
                                                wallLabel: '🟡 Sarı Duvar', chuteLabel: '🔵 Mavi Göz',
                                                desc: 'Sarı genel rezerve çerçeve ve mavi kısmi dolu ürün gözleri',
                                                accent: '#f59e0b'
                                            }
                                        ].map((combo, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleSendDualLedCommand(combo.wall, combo.chute, combo.wallMode, combo.chuteMode)}
                                                disabled={isSendingLedCmd}
                                                style={{
                                                    background: isLight ? '#ffffff' : 'rgba(255,255,255,0.03)',
                                                    border: `1.5px solid ${combo.accent}44`,
                                                    padding: '0.85rem', borderRadius: '1rem', cursor: 'pointer', textAlign: 'left',
                                                    display: 'flex', flexDirection: 'column', gap: '0.4rem', transition: '0.2s',
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                                                }}
                                                onMouseOver={e => { e.currentTarget.style.borderColor = combo.accent; e.currentTarget.style.transform = 'scale(1.02)'; }}
                                                onMouseOut={e => { e.currentTarget.style.borderColor = `${combo.accent}44`; e.currentTarget.style.transform = 'none'; }}
                                            >
                                                <div style={{ fontWeight: '900', fontSize: '0.85rem', color: isLight ? '#0f172a' : '#ffffff' }}>
                                                    {combo.title}
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.35rem' }}>
                                                    <span style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem', borderRadius: '0.4rem', background: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.08)', fontWeight: '800' }}>
                                                        {combo.wallLabel}
                                                    </span>
                                                    <span style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem', borderRadius: '0.4rem', background: `${combo.accent}22`, color: combo.accent, fontWeight: '800' }}>
                                                        + {combo.chuteLabel}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                                                    {combo.desc}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Özel Kombinasyon Oluşturucu */}
                                <div style={{
                                    background: isLight ? '#f8fafc' : 'rgba(255,255,255,0.02)',
                                    border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: '1.2rem', padding: '1rem 1.2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem'
                                }}>
                                    <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-secondary)' }}>
                                        🛠️ ÖZEL RENK & MOD OLUŞTURUCU (DUVAR VE GÖZÜ KENDİNİZ SEÇİN):
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'flex-end' }}>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', fontWeight: '800', marginBottom: '0.3rem' }}>
                                                🧱 Duvar Çerçevesi (Index -1):
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                <select
                                                    value={customWallColor}
                                                    onChange={e => setCustomWallColor(e.target.value)}
                                                    style={{
                                                        flex: 1, padding: '0.5rem 0.7rem', borderRadius: '0.6rem',
                                                        background: isLight ? '#ffffff' : '#1e293b', color: isLight ? '#0f172a' : '#ffffff',
                                                        border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.2)',
                                                        fontWeight: '800', fontSize: '0.8rem'
                                                    }}
                                                >
                                                    <option value="BLUE">🔵 Mavi (Kod 4)</option>
                                                    <option value="GREEN">🟢 Yeşil (Kod 1)</option>
                                                    <option value="YELLOW">🟡 Sarı (Kod 2)</option>
                                                    <option value="PURPLE">🟣 Mor (Kod 5)</option>
                                                    <option value="RED">🔴 Kırmızı (Kod 3)</option>
                                                    <option value="OFF">📴 Kapalı (Kod 0)</option>
                                                </select>
                                                <button
                                                    onClick={() => setCustomWallMode(m => m === 'SOLID' ? 'FLASH' : 'SOLID')}
                                                    style={{
                                                        padding: '0.5rem 0.8rem', borderRadius: '0.6rem', border: 'none',
                                                        background: customWallMode === 'FLASH' ? '#ef444422' : (isLight ? '#f1f5f9' : 'rgba(255,255,255,0.08)'),
                                                        color: customWallMode === 'FLASH' ? '#ef4444' : 'var(--text-secondary)',
                                                        fontWeight: '900', fontSize: '0.75rem', cursor: 'pointer'
                                                    }}
                                                >
                                                    {customWallMode === 'FLASH' ? '⚡ Flaş' : '💡 Sabit'}
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <div style={{ fontSize: '0.75rem', fontWeight: '800', marginBottom: '0.3rem' }}>
                                                📦 Göz Şeritleri (Index 1..N):
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                <select
                                                    value={customChuteColor}
                                                    onChange={e => setCustomChuteColor(e.target.value)}
                                                    style={{
                                                        flex: 1, padding: '0.5rem 0.7rem', borderRadius: '0.6rem',
                                                        background: isLight ? '#ffffff' : '#1e293b', color: isLight ? '#0f172a' : '#ffffff',
                                                        border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.2)',
                                                        fontWeight: '800', fontSize: '0.8rem'
                                                    }}
                                                >
                                                    <option value="GREEN">🟢 Yeşil (Kod 1)</option>
                                                    <option value="BLUE">🔵 Mavi (Kod 4)</option>
                                                    <option value="YELLOW">🟡 Sarı (Kod 2)</option>
                                                    <option value="PURPLE">🟣 Mor (Kod 5)</option>
                                                    <option value="RED">🔴 Kırmızı (Kod 3)</option>
                                                    <option value="OFF">📴 Kapalı (Kod 0)</option>
                                                </select>
                                                <button
                                                    onClick={() => setCustomChuteMode(m => m === 'SOLID' ? 'FLASH' : 'SOLID')}
                                                    style={{
                                                        padding: '0.5rem 0.8rem', borderRadius: '0.6rem', border: 'none',
                                                        background: customChuteMode === 'FLASH' ? '#ef444422' : (isLight ? '#f1f5f9' : 'rgba(255,255,255,0.08)'),
                                                        color: customChuteMode === 'FLASH' ? '#ef4444' : 'var(--text-secondary)',
                                                        fontWeight: '900', fontSize: '0.75rem', cursor: 'pointer'
                                                    }}
                                                >
                                                    {customChuteMode === 'FLASH' ? '⚡ Flaş' : '💡 Sabit'}
                                                </button>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleSendDualLedCommand(customWallColor, customChuteColor, customWallMode, customChuteMode)}
                                            disabled={isSendingLedCmd}
                                            style={{
                                                background: 'linear-gradient(135deg, #0284c7 0%, #059669 100%)',
                                                border: 'none', color: '#ffffff', padding: '0.55rem 1.4rem', borderRadius: '0.75rem',
                                                fontWeight: '900', fontSize: '0.85rem', cursor: 'pointer',
                                                boxShadow: '0 4px 15px rgba(2,132,199,0.3)', whiteSpace: 'nowrap'
                                            }}
                                        >
                                            ⚡ KOMBİNASYONU ÇALIŞTIR
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 3: DUVAR MODÜLLERİ (9 DUVAR) */}
                        {ledActiveTab === 'WALLS' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '0.4rem' }}>
                                <div style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--text-secondary)' }}>
                                    🧱 DUVAR MODÜLLERİNİ TEKER TEKER KONTROL EDİN (A & B HATTI - 6 STANDART DURUM):
                                </div>
                                {[
                                    { id: 'M145-WALL-A-1', name: 'Duvar A-1', desc: 'Sol Modül (Göz 1..9 / 9 Göz)', side: 'A' },
                                    { id: 'M145-WALL-A-0', name: 'Duvar A-0', desc: 'Sol Başı (Göz 10..15 / 6 Göz)', side: 'A' },
                                    { id: 'M145-WALL-A-2', name: 'Duvar A-2', desc: 'Orta Asansör Arkası (Göz 61..63 / 3 Göz)', side: 'A' },
                                    { id: 'M145-WALL-A-3', name: 'Duvar A-3', desc: 'Sağ Modül (Göz 16..24 / 9 Göz)', side: 'A' },
                                    { id: 'M145-WALL-A-4', name: 'Duvar A-4', desc: 'Sağ Başı (Göz 25..30 / 6 Göz)', side: 'A' },
                                    { id: 'M145-WALL-B-1', name: 'Duvar B-1', desc: 'Sol Modül (Göz 31..39 / 9 Göz)', side: 'B' },
                                    { id: 'M145-WALL-B-0', name: 'Duvar B-0', desc: 'Sol Başı (Göz 40..45 / 6 Göz)', side: 'B' },
                                    { id: 'M145-WALL-B-3', name: 'Duvar B-3', desc: 'Sağ Modül (Göz 46..54 / 9 Göz)', side: 'B' },
                                    { id: 'M145-WALL-B-4', name: 'Duvar B-4', desc: 'Sağ Başı (Göz 55..60 / 6 Göz)', side: 'B' }
                                ].map(w => (
                                    <div 
                                        key={w.id}
                                        style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            background: isLight ? '#f8fafc' : 'rgba(255,255,255,0.03)',
                                            border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.08)',
                                            borderRadius: '0.9rem', padding: '0.65rem 1rem'
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontWeight: '900', fontSize: '0.9rem', color: w.side === 'A' ? '#38bdf8' : '#a78bfa' }}>
                                                {w.name} ({w.id})
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{w.desc}</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                            <button onClick={() => handleSendLedCommand('GREEN', 'SOLID', `WALL_${w.id}`)} style={{ background: '#10b98122', border: '1px solid #10b981', color: '#10b981', padding: '0.35rem 0.55rem', borderRadius: '0.5rem', fontWeight: '900', fontSize: '0.72rem', cursor: 'pointer' }}>🟢 Yeşil</button>
                                            <button onClick={() => handleSendLedCommand('YELLOW', 'SOLID', `WALL_${w.id}`)} style={{ background: '#f59e0b22', border: '1px solid #f59e0b', color: '#f59e0b', padding: '0.35rem 0.55rem', borderRadius: '0.5rem', fontWeight: '900', fontSize: '0.72rem', cursor: 'pointer' }}>🟡 Sarı</button>
                                            <button onClick={() => handleSendLedCommand('BLUE', 'SOLID', `WALL_${w.id}`)} style={{ background: '#007bff22', border: '1px solid #007BFF', color: '#38bdf8', padding: '0.35rem 0.55rem', borderRadius: '0.5rem', fontWeight: '900', fontSize: '0.72rem', cursor: 'pointer' }}>🔵 Mavi</button>
                                            <button onClick={() => handleSendLedCommand('PURPLE', 'SOLID', `WALL_${w.id}`)} style={{ background: '#8b5cf622', border: '1px solid #8b5cf6', color: '#a78bfa', padding: '0.35rem 0.55rem', borderRadius: '0.5rem', fontWeight: '900', fontSize: '0.72rem', cursor: 'pointer' }}>🟣 Mor</button>
                                            <button onClick={() => handleSendLedCommand('RED', 'FLASH', `WALL_${w.id}`)} style={{ background: '#ef444422', border: '1px solid #ef4444', color: '#ef4444', padding: '0.35rem 0.55rem', borderRadius: '0.5rem', fontWeight: '900', fontSize: '0.72rem', cursor: 'pointer' }}>🔴 Kırmızı</button>
                                            <button onClick={() => handleSendLedCommand('OFF', 'SOLID', `WALL_${w.id}`)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.2)', color: 'var(--text-primary)', padding: '0.35rem 0.55rem', borderRadius: '0.5rem', fontWeight: '900', fontSize: '0.72rem', cursor: 'pointer' }}>📴 Söndür</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* TAB 4: TEKİL GÖZ KONTROLÜ (1..63) */}
                        {ledActiveTab === 'CHUTE' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--text-secondary)' }}>
                                    🎯 TEKİL BİR GÖZ SEÇİN VE DİLEDİĞİNİZ RENKTE YAKIN (6 STANDART DURUM):
                                </div>
                                <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                                    <span style={{ fontWeight: '800', fontSize: '0.9rem' }}>Hedef Göz:</span>
                                    <select
                                        value={ledSelectedChute}
                                        onChange={e => setLedSelectedChute(parseInt(e.target.value, 10))}
                                        style={{
                                            flex: 1, padding: '0.7rem 1rem', borderRadius: '0.8rem',
                                            background: isLight ? '#ffffff' : '#1e293b', color: isLight ? '#0f172a' : '#ffffff',
                                            border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.2)',
                                            fontWeight: '900', fontSize: '0.95rem'
                                        }}
                                    >
                                        {Array.from({ length: 63 }, (_, i) => i + 1).map(ch => (
                                            <option key={ch} value={ch}>
                                                📦 Göz #{ch} ({chToPhysicalMap[ch] || `CH-${ch}`})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.5rem' }}>
                                    {[
                                        { id: 'GREEN', label: '🟢 1: Yeşil', color: '#10b981', bg: '#10b98122', mode: 'SOLID' },
                                        { id: 'YELLOW', label: '🟡 2: Sarı', color: '#f59e0b', bg: '#f59e0b22', mode: 'SOLID' },
                                        { id: 'BLUE', label: '🔵 4: Mavi', color: '#38bdf8', bg: '#007bff22', mode: 'SOLID' },
                                        { id: 'PURPLE', label: '🟣 5: Mor', color: '#a78bfa', bg: '#8b5cf622', mode: 'SOLID' },
                                        { id: 'RED', label: '🔴 3: Kırmızı', color: '#ef4444', bg: '#ef444422', mode: 'FLASH' },
                                        { id: 'OFF', label: '📴 0: Söndür', color: 'var(--text-primary)', bg: 'rgba(255,255,255,0.06)', mode: 'SOLID' }
                                    ].map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => handleSendLedCommand(c.id, c.mode, String(ledSelectedChute))}
                                            disabled={isSendingLedCmd}
                                            style={{
                                                background: c.bg, border: `2px solid ${c.color}`, color: c.color,
                                                padding: '0.85rem 0.6rem', borderRadius: '0.8rem', fontWeight: '900', fontSize: '0.85rem',
                                                cursor: 'pointer', textAlign: 'center', transition: '0.2s'
                                            }}
                                            onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                            onMouseOut={e => e.currentTarget.style.transform = 'none'}
                                        >
                                            {c.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Live Activity Log Console */}
                        <div style={{
                            background: isLight ? '#f8fafc' : 'rgba(0,0,0,0.5)',
                            border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '0.9rem', padding: '0.75rem 1rem', fontSize: '0.75rem', fontFamily: 'monospace'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '0.3rem', fontWeight: '800' }}>
                                <span>📟 Sorter Donanım İletişim Konsolu (192.168.1.234:4000):</span>
                                <span style={{ color: '#10b981' }}>🟢 AKTİF</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', color: isLight ? '#334155' : '#94a3b8' }}>
                                {ledLogs.length === 0 ? (
                                    <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Henüz komut gönderilmedi. Yukarıdaki butonlara basarak test edin.</div>
                                ) : (
                                    ledLogs.map((l, i) => (
                                        <div key={i} style={{ display: 'flex', gap: '0.6rem', color: l.success ? '#10b981' : '#ef4444' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>[{l.time}]</span>
                                            <span>{l.msg}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: isLight ? '1px solid #f1f5f9' : '1px solid rgba(255,255,255,0.08)', paddingTop: '0.8rem' }}>
                            <button
                                onClick={() => handleSendLedCommand('OFF', 'SOLID', 'ALL')}
                                disabled={isSendingLedCmd}
                                style={{
                                    background: '#ef444422', border: '1.5px solid #ef4444', color: '#ef4444',
                                    padding: '0.6rem 1.2rem', borderRadius: '0.8rem', fontWeight: '900', fontSize: '0.82rem',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem'
                                }}
                            >
                                <span>📴</span> TÜM IŞIKLARI SÖNDÜR (KAPAT)
                            </button>
                            <button 
                                onClick={() => setIsLedModalOpen(false)}
                                style={{
                                    background: isLight ? '#e2e8f0' : 'rgba(255,255,255,0.1)', border: 'none',
                                    color: 'var(--text-primary)', padding: '0.6rem 1.6rem', borderRadius: '0.8rem',
                                    fontWeight: '900', fontSize: '0.85rem', cursor: 'pointer'
                                }}
                            >
                                Kapat
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* IMMERSIVE FULLSCREEN FLOOR MAP OVERLAY */}
            {isFloorMapFullscreen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    zIndex: 9999,
                    background: '#090d18',
                    color: '#f8fafc',
                    padding: '1rem 1.8rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxSizing: 'border-box',
                    overflow: 'hidden'
                }}>
                    {/* Fullscreen Top Command Bar */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'rgba(255,255,255,0.03)',
                        padding: '0.8rem 1.6rem',
                        borderRadius: '1.2rem',
                        border: '1px solid rgba(255,255,255,0.08)',
                        marginBottom: '0.8rem'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={{ fontSize: '1.8rem' }}>🏢</span>
                            <div>
                                <div style={{ fontSize: '0.72rem', fontWeight: '800', color: '#38bdf8', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                                    VOG TEKSTİL • HC ROBOTICS OMNISORT MINI
                                </div>
                                <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#ffffff' }}>
                                    60 GÖZ CANLI SAHA KONTROL PANELİ
                                </div>
                            </div>
                        </div>

                        {/* Fullscreen Metric Badges */}
                        <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center' }}>
                            <div style={{ background: 'rgba(0,123,255,0.18)', border: '1px solid rgba(56,189,248,0.5)', padding: '0.4rem 1rem', borderRadius: '0.8rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.68rem', color: '#93c5fd', fontWeight: '800' }}>TOPLAM DÜŞEN</div>
                                <div style={{ fontSize: '1.15rem', fontWeight: '900', color: '#ffffff', textShadow: '0 0 10px rgba(56,189,248,0.6)' }}>{totalCollectedItems} Adet</div>
                            </div>

                            <div style={{ background: 'rgba(239,68,68,0.18)', border: '1px solid rgba(239,68,68,0.5)', padding: '0.4rem 1rem', borderRadius: '0.8rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.68rem', color: '#fca5a5', fontWeight: '800' }}>DOLU GÖZLER</div>
                                <div style={{ fontSize: '1.15rem', fontWeight: '900', color: '#ffffff', textShadow: '0 0 10px rgba(239,68,68,0.6)' }}>{fullGatesCount} / 63</div>
                            </div>

                            <div style={{ background: 'rgba(16,185,129,0.18)', border: '1px solid rgba(16,185,129,0.5)', padding: '0.4rem 1rem', borderRadius: '0.8rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.68rem', color: '#86efac', fontWeight: '800' }}>AKTİF GÖZLER</div>
                                <div style={{ fontSize: '1.15rem', fontWeight: '900', color: '#ffffff', textShadow: '0 0 10px rgba(16,185,129,0.6)' }}>{activeGatesCount} Göz</div>
                            </div>

                            <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', padding: '0.4rem 1rem', borderRadius: '0.8rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.68rem', color: '#ffffff', fontWeight: '800' }}>BOŞ / HAZIR</div>
                                <div style={{ fontSize: '1.15rem', fontWeight: '900', color: '#ffffff' }}>{emptyGatesCount} Göz</div>
                            </div>
                        </div>

                        {/* Live Clock & Buttons */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            {/* Layout Display Mode Switcher (Image 1 vs Image 2) */}
                            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', padding: '0.2rem', borderRadius: '0.8rem', border: '1px solid rgba(255,255,255,0.15)' }}>
                                <button
                                    onClick={() => setGridDisplayMode('matrix')}
                                    style={{
                                        background: gridDisplayMode === 'matrix' ? '#007BFF' : 'transparent',
                                        color: '#ffffff',
                                        border: 'none', padding: '0.4rem 0.8rem', borderRadius: '0.6rem',
                                        fontSize: '0.78rem', fontWeight: '800', cursor: 'pointer', transition: '0.2s'
                                    }}
                                    title="1. Resimdeki birebir 6 sıralı saha yerleşimi"
                                >
                                    🏢 6 Sıra Saha Matrisi
                                </button>
                                <button
                                    onClick={() => setGridDisplayMode('cards')}
                                    style={{
                                        background: gridDisplayMode === 'cards' ? '#8b5cf6' : 'transparent',
                                        color: '#ffffff',
                                        border: 'none', padding: '0.4rem 0.8rem', borderRadius: '0.6rem',
                                        fontSize: '0.78rem', fontWeight: '800', cursor: 'pointer', transition: '0.2s'
                                    }}
                                    title="2. Resimdeki 4 duvar modülü ayrık görünümü"
                                >
                                    🗂️ 4 Duvar Kartı
                                </button>
                            </div>

                            <div style={{
                                background: 'rgba(255,255,255,0.08)',
                                padding: '0.5rem 1rem',
                                borderRadius: '0.8rem',
                                fontFamily: 'monospace',
                                fontSize: '1.1rem',
                                fontWeight: '900',
                                color: '#ffffff',
                                textShadow: '0 0 10px rgba(56,189,248,0.8)'
                            }}>
                                🕒 {currentTime}
                            </div>
                            <button 
                                onClick={() => { setIsLedModalOpen(true); setLedFeedback(null); }}
                                style={{
                                    background: 'linear-gradient(135deg, rgba(5,150,105,0.3) 0%, rgba(13,148,136,0.3) 100%)',
                                    border: '1px solid #10b981',
                                    color: '#ffffff',
                                    padding: '0.65rem 1.1rem',
                                    borderRadius: '0.8rem',
                                    fontWeight: '900',
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    transition: '0.2s'
                                }}
                                onMouseOver={e => e.currentTarget.style.background = '#059669'}
                                onMouseOut={e => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(5,150,105,0.3) 0%, rgba(13,148,136,0.3) 100%)'}
                                title="OmniSort Işık Şeritlerini (LED) Manuel Kontrol Et ve Renk Yak"
                            >
                                <span>🌈</span> IŞIK ŞERİTLERİ (LED)
                            </button>
                            <button 
                                onClick={() => { setIsCartLabelsModalOpen(true); setCartLabelsPrintFeedback(null); }}
                                style={{
                                    background: 'rgba(139,92,246,0.3)',
                                    border: '1px solid rgba(139,92,246,0.7)',
                                    color: '#ffffff',
                                    padding: '0.65rem 1.1rem',
                                    borderRadius: '0.8rem',
                                    fontWeight: '900',
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    transition: '0.2s'
                                }}
                                onMouseOver={e => e.currentTarget.style.background = '#8b5cf6'}
                                onMouseOut={e => e.currentTarget.style.background = 'rgba(139,92,246,0.3)'}
                                title="TSC / SATO Yazıcıdan Taşıma Arabaları ve Duvar Modülü Etiketlerini Yazdır"
                            >
                                <span>🖨️</span> ARABA & DUVAR ETİKETLERİ
                            </button>
                            <button 
                                onClick={handleResetAllChutes}
                                style={{
                                    background: 'rgba(220,38,38,0.3)',
                                    border: '1px solid rgba(220,38,38,0.7)',
                                    color: '#ffffff',
                                    padding: '0.65rem 1.1rem',
                                    borderRadius: '0.8rem',
                                    fontWeight: '900',
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    transition: '0.2s'
                                }}
                                onMouseOver={e => e.currentTarget.style.background = '#dc2626'}
                                onMouseOut={e => e.currentTarget.style.background = 'rgba(220,38,38,0.3)'}
                                title="Tüm gözleri sıfırlar ve boşaltır"
                            >
                                <span>🧹</span> TÜMÜNÜ BOŞALT
                            </button>
                            <button
                                onClick={() => toggleFullscreen(false)}
                                style={{
                                    background: '#dc2626',
                                    color: '#ffffff',
                                    border: 'none',
                                    padding: '0.65rem 1.3rem',
                                    borderRadius: '0.8rem',
                                    fontWeight: '900',
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    boxShadow: '0 4px 15px rgba(220,38,38,0.4)',
                                    transition: '0.2s'
                                }}
                                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.03)'}
                                onMouseOut={e => e.currentTarget.style.transform = 'none'}
                            >
                                <span>🗗</span> TAM EKRANDAN ÇIK (ESC)
                            </button>
                        </div>
                    </div>

                    {/* Fullscreen Expanded Grid */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                        <FloorMapGrid 
                            sorterGates={sorterGates}
                            physicalToChMap={physicalToChMap}
                            selectedGate={selectedGate}
                            openChuteDetails={openChuteDetails}
                            isLight={false}
                            isFs={true}
                            displayMode={gridDisplayMode}
                        />
                    </div>

                    {/* Fullscreen Bottom Status Bar */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'rgba(255,255,255,0.04)',
                        padding: '0.5rem 1.4rem',
                        borderRadius: '0.8rem',
                        marginTop: '0.6rem',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <div style={{ fontSize: '0.82rem', color: '#ffffff', fontWeight: '700' }}>
                            💡 <strong style={{ color: '#38bdf8' }}>Canlı İzleme & Kontrol:</strong> Kutuların üzerine tıklayarak koli içeriğindeki ürünleri açabilir veya sepeti boşaltıp sıfırlayabilirsiniz.
                        </div>
                        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: '900', color: '#ffffff', background: 'rgba(234, 88, 12, 0.50)', padding: '0.2rem 0.6rem', borderRadius: '6px', border: '1px solid rgba(249, 115, 22, 0.85)' }}>🟧 1-2. Duvar (Turuncu %50)</span>
                            <span style={{ fontSize: '0.75rem', fontWeight: '900', color: '#ffffff', background: 'rgba(30, 58, 138, 0.50)', padding: '0.2rem 0.6rem', borderRadius: '6px', border: '1px solid rgba(59, 130, 246, 0.85)' }}>🟦 3-4. Duvar (Lacivert %50)</span>
                            <span style={{ fontSize: '0.75rem', fontWeight: '900', color: '#ffffff', background: 'rgba(126, 34, 206, 0.50)', padding: '0.2rem 0.6rem', borderRadius: '6px', border: '1px solid rgba(168, 85, 247, 0.85)' }}>🟪 5-6. Duvar (Mor %50)</span>
                            <span style={{ fontSize: '0.75rem', fontWeight: '900', color: '#ffffff', background: 'rgba(220, 38, 38, 0.50)', padding: '0.2rem 0.6rem', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.85)' }}>🟥 7-8. Duvar (Kırmızı %50)</span>
                            <div style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.2)', margin: '0 0.2rem' }}></div>
                            <LegendItem color="#64748b" label="Boş" />
                            <LegendItem color="#10b981" label="Az Dolu" />
                            <LegendItem color="#f59e0b" label="Orta Dolu" />
                            <LegendItem color="#ef4444" label="Dolu" />
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .glass-morphism {
                    backdrop-filter: blur(24px);
                    -webkit-backdrop-filter: blur(24px);
                }
            `}</style>
        </div>
    );
};

// -------------------------------------------------------------------------------------
// 1. IMAGE 1 REFERANSI: 1:1 BİREBİR FİZİKSEL SAHA MATRİSİ (3 KAT x 6 SIRA x 11 SÜTUN)
// -------------------------------------------------------------------------------------
const PhysicalMatrixGrid = ({ sorterGates, physicalToChMap, selectedGate, openChuteDetails, isLight, isFs }) => {
    // 3 Kat için Sıra A ve Sıra B tanımları
    const floorRows = [
        {
            katNum: 3,
            katLabel: '🔺 KAT 3 (ÜST SIRA)',
            badgeColor: '#38bdf8',
            rowA: {
                m0: ['A0-2', 'A0-1'],
                m1: ['A1-3', 'A1-2', 'A1-1'],
                m2: 'A2-1',
                m3: ['A3-3', 'A3-2', 'A3-1'],
                m4: ['A4-2', 'A4-1']
            },
            rowB: {
                m0: ['B0-1', 'B0-2'],
                m1: ['B1-1', 'B1-2', 'B1-3'],
                m2Type: 'LIFT_TOP',
                m3: ['B3-1', 'B3-2', 'B3-3'],
                m4: ['B4-1', 'B4-2']
            }
        },
        {
            katNum: 2,
            katLabel: '▫️ KAT 2 (ORTA SIRA)',
            badgeColor: '#818cf8',
            rowA: {
                m0: ['A0-4', 'A0-3'],
                m1: ['A1-6', 'A1-5', 'A1-4'],
                m2: 'A2-2',
                m3: ['A3-6', 'A3-5', 'A3-4'],
                m4: ['A4-4', 'A4-3']
            },
            rowB: {
                m0: ['B0-3', 'B0-4'],
                m1: ['B1-4', 'B1-5', 'B1-6'],
                m2Type: 'LIFT_MID',
                m3: ['B3-4', 'B3-5', 'B3-6'],
                m4: ['B4-3', 'B4-4']
            }
        },
        {
            katNum: 1,
            katLabel: '🔻 KAT 1 (ALT SIRA)',
            badgeColor: '#a855f7',
            rowA: {
                m0: ['A0-6', 'A0-5'],
                m1: ['A1-9', 'A1-8', 'A1-7'],
                m2: 'A2-3',
                m3: ['A3-9', 'A3-8', 'A3-7'],
                m4: ['A4-6', 'A4-5']
            },
            rowB: {
                m0: ['B0-5', 'B0-6'],
                m1: ['B1-7', 'B1-8', 'B1-9'],
                m2Type: 'LIFT_BOT',
                m3: ['B3-7', 'B3-8', 'B3-9'],
                m4: ['B4-5', 'B4-6']
            }
        }
    ];

    const renderNode = (id, isBRow = false) => {
        const chId = physicalToChMap[id] || id;
        const g = sorterGates.find(x => x.id === chId) || { id: chId, destination: '---', status: 'standby', item_count: 0, target_capacity: 25 };
        return (
            <GateNode 
                key={id} 
                label={id} 
                gate={g} 
                isSelected={selectedGate?.id === chId} 
                onClick={() => openChuteDetails(g)} 
                isFs={isFs}
                hasDot={isBRow}
            />
        );
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: isFs ? '0.85rem' : '0.6rem',
            background: isFs ? '#060a14' : (isLight ? 'rgba(15,23,42,0.01)' : 'rgba(15,23,42,0.4)'),
            padding: isFs ? '1rem 1.4rem' : '0.85rem 1rem',
            borderRadius: '1.6rem',
            border: isFs ? '2px solid rgba(56,189,248,0.45)' : (isLight ? '1px solid rgba(0,0,0,0.1)' : '2px solid rgba(255,255,255,0.1)'),
            flex: isFs ? 1 : 'initial',
            height: isFs ? '100%' : 'auto',
            minHeight: 0,
            justifyContent: 'space-between',
            boxShadow: isFs ? '0 20px 50px rgba(0,0,0,0.8), inset 0 0 40px rgba(56,189,248,0.06)' : 'none'
        }}>
            {/* Top Section Headers (Sol Modüller | Orta Kule | Sağ Modüller) */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 3fr 1fr 3fr 2fr',
                gap: isFs ? '0.9rem' : '0.5rem',
                textAlign: 'center',
                borderBottom: `2px solid ${isFs ? 'rgba(56,189,248,0.3)' : (isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)')}`,
                paddingBottom: isFs ? '0.6rem' : '0.3rem'
            }}>
                <div style={{ fontSize: isFs ? '1.05rem' : '0.72rem', fontWeight: '900', color: '#ea580c', letterSpacing: '0.5px' }}>
                    🟧 A0 (1-2. Duvar) / 🟪 B0 (5-6. Duvar)
                </div>
                <div style={{ fontSize: isFs ? '1.05rem' : '0.72rem', fontWeight: '900', color: '#ea580c', letterSpacing: '0.5px' }}>
                    🟧 A1 (1-2. Duvar) / 🟪 B1 (5-6. Duvar)
                </div>
                <div style={{ fontSize: isFs ? '1.05rem' : '0.72rem', fontWeight: '900', color: '#0284c7', letterSpacing: '0.5px' }}>
                    🛗 A2 (ORTA ASANSÖR)
                </div>
                <div style={{ fontSize: isFs ? '1.05rem' : '0.72rem', fontWeight: '900', color: '#38bdf8', letterSpacing: '0.5px' }}>
                    🟦 A3 (3-4. Duvar) / 🟥 B3 (7-8. Duvar)
                </div>
                <div style={{ fontSize: isFs ? '1.05rem' : '0.72rem', fontWeight: '900', color: '#38bdf8', letterSpacing: '0.5px' }}>
                    🟦 A4 (3-4. Duvar) / 🟥 B4 (7-8. Duvar)
                </div>
            </div>

            {/* 3 KAT (Kat 3, Kat 2, Kat 1) - Her Kat 2 Sıra (A ve B) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: isFs ? '0.75rem' : '0.5rem', flex: isFs ? 1 : 'initial', minHeight: 0 }}>
                {floorRows.map((floor, idx) => (
                    <div 
                        key={floor.katNum}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: isFs ? '0.45rem' : '0.3rem',
                            flex: isFs ? 1 : 'initial',
                            minHeight: 0,
                            background: isFs ? 'rgba(15,23,42,0.65)' : (isLight ? 'rgba(241,245,249,0.6)' : 'rgba(255,255,255,0.02)'),
                            padding: isFs ? '0.55rem 0.85rem' : '0.35rem 0.5rem',
                            borderRadius: '1.2rem',
                            border: `1.5px solid ${isFs ? 'rgba(255,255,255,0.1)' : (isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)')}`,
                            position: 'relative'
                        }}
                    >
                        {/* Kat Başlığı Rozeti */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.3rem' }}>
                            <span style={{ 
                                fontSize: isFs ? '1.05rem' : '0.65rem', 
                                fontWeight: '900', 
                                color: floor.badgeColor, 
                                letterSpacing: '0.6px',
                                textShadow: isFs ? `0 0 12px ${floor.badgeColor}80` : 'none'
                            }}>
                                {floor.katLabel}
                            </span>
                            <span style={{ fontSize: isFs ? '0.9rem' : '0.6rem', color: isFs ? '#ffffff' : (isLight ? '#64748b' : '#94a3b8'), fontWeight: '800' }}>
                                A Sırası (Üst) • B Sırası (Alt)
                            </span>
                        </div>

                        {/* SIRA A (ÜST SIRASI) */}
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr 1fr 3fr 2fr', gap: isFs ? '0.7rem' : '0.4rem', flex: isFs ? 1 : 'initial', minHeight: 0 }}>
                            {/* M0 A */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: isFs ? '0.45rem' : '0.25rem', height: isFs ? '100%' : 'auto', minHeight: 0 }}>
                                {floor.rowA.m0.map(id => renderNode(id, false))}
                            </div>
                            {/* M1 A */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: isFs ? '0.45rem' : '0.25rem', height: isFs ? '100%' : 'auto', minHeight: 0 }}>
                                {floor.rowA.m1.map(id => renderNode(id, false))}
                            </div>
                            {/* M2 A2 Center */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: isFs ? '0.45rem' : '0.25rem', height: isFs ? '100%' : 'auto', minHeight: 0 }}>
                                {renderNode(floor.rowA.m2, false)}
                            </div>
                            {/* M3 A */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: isFs ? '0.45rem' : '0.25rem', height: isFs ? '100%' : 'auto', minHeight: 0 }}>
                                {floor.rowA.m3.map(id => renderNode(id, false))}
                            </div>
                            {/* M4 A */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: isFs ? '0.45rem' : '0.25rem', height: isFs ? '100%' : 'auto', minHeight: 0 }}>
                                {floor.rowA.m4.map(id => renderNode(id, false))}
                            </div>
                        </div>

                        {/* SIRA B (ALT SIRASI - DOTLU) */}
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr 1fr 3fr 2fr', gap: isFs ? '0.7rem' : '0.4rem', flex: isFs ? 1 : 'initial', minHeight: 0 }}>
                            {/* M0 B */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: isFs ? '0.45rem' : '0.25rem', height: isFs ? '100%' : 'auto', minHeight: 0 }}>
                                {floor.rowB.m0.map(id => renderNode(id, true))}
                            </div>
                            {/* M1 B */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: isFs ? '0.45rem' : '0.25rem', height: isFs ? '100%' : 'auto', minHeight: 0 }}>
                                {floor.rowB.m1.map(id => renderNode(id, true))}
                            </div>
                            {/* M2 Center (Lift Box / OmniSort Mini) */}
                            <div style={{ 
                                display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', 
                                background: isFs ? 'rgba(0,123,255,0.18)' : (isLight ? '#ffffff' : 'rgba(255,255,255,0.05)'),
                                border: '2px solid rgba(0,123,255,0.7)',
                                borderRadius: '0.85rem',
                                padding: '0.25rem',
                                height: isFs ? '100%' : 'auto',
                                minHeight: 0,
                                textAlign: 'center',
                                boxShadow: isFs ? '0 0 16px rgba(0,123,255,0.4)' : '0 0 12px rgba(0,123,255,0.25)'
                            }}>
                                <div style={{ fontSize: isFs ? '0.95rem' : '0.6rem', fontWeight: '900', color: '#38bdf8' }}>
                                    {floor.rowB.m2Type === 'LIFT_BOT' ? '🟢 OmniSort' : '🛗 CARRIER'}
                                </div>
                                <div style={{ fontSize: isFs ? '0.82rem' : '0.5rem', color: isFs ? '#ffffff' : (isLight ? '#64748b' : '#94a3b8'), fontWeight: '800' }}>
                                    {floor.rowB.m2Type === 'LIFT_BOT' ? 'Mini Sorter' : `Kat ${floor.katNum} Lift`}
                                </div>
                            </div>
                            {/* M3 B */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: isFs ? '0.45rem' : '0.25rem', height: isFs ? '100%' : 'auto', minHeight: 0 }}>
                                {floor.rowB.m3.map(id => renderNode(id, true))}
                            </div>
                            {/* M4 B */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: isFs ? '0.45rem' : '0.25rem', height: isFs ? '100%' : 'auto', minHeight: 0 }}>
                                {floor.rowB.m4.map(id => renderNode(id, true))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// -------------------------------------------------------------------------------------
// 2. IMAGE 2 REFERANSI: 4 AYRI DUVAR KARTI MODÜL GÖRÜNÜMÜ
// -------------------------------------------------------------------------------------
const BayCard = ({ 
    title, badge1, badge2, 
    m1Cols = 2, m2Cols = 3,
    m1Kat3, m2Kat3, 
    m1Kat2, m2Kat2, 
    m1Kat1, m2Kat1, 
    physicalToChMap, sorterGates, selectedGate, openChuteDetails, 
    isFs, isLight, accentColor, isBDot = false
}) => {
    const renderChuteRow = (m1List, m2List) => (
        <div style={{ display: 'flex', gap: isFs ? '0.7rem' : '0.45rem', alignItems: 'stretch', flex: isFs ? 1 : 'initial', minHeight: 0, height: isFs ? '100%' : 'auto' }}>
            {/* Module 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${m1Cols}, 1fr)`, gap: isFs ? '0.5rem' : '0.35rem', flex: m1Cols, height: isFs ? '100%' : 'auto', minHeight: 0 }}>
                {m1List.map(id => {
                    const chId = physicalToChMap[id] || id;
                    const g = sorterGates.find(x => x.id === chId) || { id: chId, destination: '---', status: 'standby', item_count: 0, target_capacity: 25 };
                    return <GateNode key={id} label={id} gate={g} isSelected={selectedGate?.id === chId} onClick={() => openChuteDetails(g)} isFs={isFs} hasDot={isBDot} />;
                })}
            </div>

            {/* Vertical Module Divider */}
            <div style={{ width: '2px', background: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)', borderRadius: '1px' }}></div>

            {/* Module 2 */}
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${m2Cols}, 1fr)`, gap: isFs ? '0.5rem' : '0.35rem', flex: m2Cols, height: isFs ? '100%' : 'auto', minHeight: 0 }}>
                {m2List.map(id => {
                    const chId = physicalToChMap[id] || id;
                    const g = sorterGates.find(x => x.id === chId) || { id: chId, destination: '---', status: 'standby', item_count: 0, target_capacity: 25 };
                    return <GateNode key={id} label={id} gate={g} isSelected={selectedGate?.id === chId} onClick={() => openChuteDetails(g)} isFs={isFs} hasDot={isBDot} />;
                })}
            </div>
        </div>
    );

    return (
        <div style={{
            display: 'flex', 
            flexDirection: 'column', 
            gap: isFs ? '0.65rem' : '0.45rem',
            background: isFs ? '#060a14' : (isLight ? '#ffffff' : 'rgba(30,41,59,0.4)'),
            border: `2px solid ${accentColor}55`,
            borderRadius: '1.3rem',
            padding: isFs ? '0.9rem' : '0.65rem',
            boxShadow: isFs ? `0 10px 30px rgba(0,0,0,0.7), inset 0 0 20px ${accentColor}15` : (isLight ? '0 4px 15px rgba(0,0,0,0.03)' : '0 10px 25px rgba(0,0,0,0.3)'),
            flex: isFs ? 1 : 'initial',
            height: isFs ? '100%' : 'auto',
            minHeight: 0,
            justifyContent: 'space-between'
        }}>
            {/* Bay Title Bar */}
            <div style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                borderBottom: `2px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)'}`, 
                paddingBottom: '0.5rem' 
            }}>
                <span style={{ fontSize: isFs ? '1.15rem' : '0.82rem', fontWeight: '900', color: accentColor, letterSpacing: '0.5px' }}>
                    {title}
                </span>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <span style={{ 
                        fontSize: isFs ? '0.9rem' : '0.66rem', fontWeight: '900', 
                        padding: '0.25rem 0.65rem', borderRadius: '6px', 
                        background: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.08)', 
                        border: `1.5px solid ${accentColor}88`,
                        color: accentColor 
                    }}>
                        {badge1}
                    </span>
                    <span style={{ 
                        fontSize: isFs ? '0.9rem' : '0.66rem', fontWeight: '900', 
                        padding: '0.25rem 0.65rem', borderRadius: '6px', 
                        background: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.08)', 
                        border: `1.5px solid ${accentColor}88`,
                        color: accentColor 
                    }}>
                        {badge2}
                    </span>
                </div>
            </div>

            {/* Kat 3 */}
            <div style={{ 
                flex: isFs ? 1 : 'initial', display: 'flex', flexDirection: 'column', minHeight: 0,
                borderBottom: `1px dashed ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)'}`,
                paddingBottom: isFs ? '0.5rem' : '0.35rem'
            }}>
                <div style={{ fontSize: isFs ? '0.92rem' : '0.68rem', fontWeight: '900', color: isLight ? '#475569' : '#38bdf8', marginBottom: '0.25rem' }}>🔺 KAT 3 (ÜST SIRA)</div>
                {renderChuteRow(m1Kat3, m2Kat3)}
            </div>

            {/* Kat 2 */}
            <div style={{ 
                flex: isFs ? 1 : 'initial', display: 'flex', flexDirection: 'column', minHeight: 0,
                borderBottom: `1px dashed ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)'}`,
                paddingBottom: isFs ? '0.5rem' : '0.35rem'
            }}>
                <div style={{ fontSize: isFs ? '0.92rem' : '0.68rem', fontWeight: '900', color: isLight ? '#475569' : '#818cf8', marginBottom: '0.25rem' }}>▫️ KAT 2 (ORTA SIRA)</div>
                {renderChuteRow(m1Kat2, m2Kat2)}
            </div>

            {/* Kat 1 */}
            <div style={{ flex: isFs ? 1 : 'initial', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <div style={{ fontSize: isFs ? '0.92rem' : '0.68rem', fontWeight: '900', color: isLight ? '#475569' : '#c084fc', marginBottom: '0.25rem' }}>🔻 KAT 1 (ALT SIRA)</div>
                {renderChuteRow(m1Kat1, m2Kat1)}
            </div>
        </div>
    );
};

const BayCardsGrid = ({ sorterGates, physicalToChMap, selectedGate, openChuteDetails, isLight, isFs }) => {
    return (
        <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isFs ? '1fr 1fr 140px 1fr 1fr' : '1fr 1fr 115px 1fr 1fr', 
            gap: isFs ? '1.1rem' : '0.8rem',
            background: isFs ? '#060a14' : (isLight ? 'rgba(15,23,42,0.01)' : 'rgba(255,255,255,0.01)'),
            padding: isFs ? '1.1rem' : '0.85rem',
            borderRadius: '1.6rem',
            border: isFs ? '2px solid rgba(255,255,255,0.22)' : (isLight ? '1px solid rgba(0,0,0,0.1)' : '2px solid rgba(255,255,255,0.1)'),
            flex: isFs ? 1 : 'initial',
            height: isFs ? '100%' : 'auto',
            minHeight: 0,
            alignItems: 'stretch'
        }}>
            {/* BAY 1: 1. ve 2. DUVAR (A HATTI SOL: A0 [6 Göz] + A1 [9 Göz] - TURUNCU %50) */}
            <BayCard 
                title="🟧 1. ve 2. DUVAR (A SOL)"
                badge1="A0 (6 Göz)"
                badge2="A1 (9 Göz)"
                m1Cols={2}
                m2Cols={3}
                m1Kat3={['A0-2','A0-1']}
                m2Kat3={['A1-3','A1-2','A1-1']}
                m1Kat2={['A0-4','A0-3']}
                m2Kat2={['A1-6','A1-5','A1-4']}
                m1Kat1={['A0-6','A0-5']}
                m2Kat1={['A1-9','A1-8','A1-7']}
                physicalToChMap={physicalToChMap}
                sorterGates={sorterGates}
                selectedGate={selectedGate}
                openChuteDetails={openChuteDetails}
                isFs={isFs}
                isLight={isLight}
                accentColor="#ea580c"
                isBDot={false}
            />

            {/* BAY 2: 5. ve 6. DUVAR (B HATTI SOL: B0 [6 Göz] + B1 [9 Göz] - MOR %50) */}
            <BayCard 
                title="🟪 5. ve 6. DUVAR (B SOL)"
                badge1="B0 (6 Göz)"
                badge2="B1 (9 Göz)"
                m1Cols={2}
                m2Cols={3}
                m1Kat3={['B0-1','B0-2']}
                m2Kat3={['B1-1','B1-2','B1-3']}
                m1Kat2={['B0-3','B0-4']}
                m2Kat2={['B1-4','B1-5','B1-6']}
                m1Kat1={['B0-5','B0-6']}
                m2Kat1={['B1-7','B1-8','B1-9']}
                physicalToChMap={physicalToChMap}
                sorterGates={sorterGates}
                selectedGate={selectedGate}
                openChuteDetails={openChuteDetails}
                isFs={isFs}
                isLight={isLight}
                accentColor="#7e22ce"
                isBDot={true}
            />

            {/* ORTA ASANSÖR & KULE BLOKU (A2 + LIFT) */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: isFs ? '0.75rem' : '0.5rem',
                background: isFs ? 'rgba(0,123,255,0.08)' : (isLight ? '#f8fafc' : 'rgba(0,123,255,0.05)'),
                border: '2px dashed rgba(0,123,255,0.6)',
                borderRadius: '1.3rem',
                padding: isFs ? '0.85rem 0.4rem' : '0.65rem 0.3rem',
                height: isFs ? '100%' : 'auto',
                minHeight: 0
            }}>
                <div style={{ fontSize: isFs ? '0.95rem' : '0.72rem', fontWeight: '900', color: '#38bdf8', textAlign: 'center' }}>
                    🛗 ASANSÖR
                </div>

                {/* A2 Center Gözleri */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: isFs ? '0.45rem' : '0.3rem', width: '100%', flex: isFs ? 1 : 'initial', minHeight: 0 }}>
                    <div style={{ flex: isFs ? 1 : 'initial', minHeight: 0 }}>
                        {(() => {
                            const g = sorterGates.find(x => x.id === 'A2-1') || { id: 'A2-1', destination: '---', status: 'standby', item_count: 0, target_capacity: 25 };
                            return <GateNode label="A2-1" gate={g} isSelected={selectedGate?.id === 'A2-1'} onClick={() => openChuteDetails(g)} isFs={isFs} hasDot={false} />;
                        })()}
                    </div>
                    <div style={{ flex: isFs ? 1 : 'initial', minHeight: 0 }}>
                        {(() => {
                            const g = sorterGates.find(x => x.id === 'A2-2') || { id: 'A2-2', destination: '---', status: 'standby', item_count: 0, target_capacity: 25 };
                            return <GateNode label="A2-2" gate={g} isSelected={selectedGate?.id === 'A2-2'} onClick={() => openChuteDetails(g)} isFs={isFs} hasDot={false} />;
                        })()}
                    </div>
                    <div style={{ flex: isFs ? 1 : 'initial', minHeight: 0 }}>
                        {(() => {
                            const g = sorterGates.find(x => x.id === 'A2-3') || { id: 'A2-3', destination: '---', status: 'standby', item_count: 0, target_capacity: 25 };
                            return <GateNode label="A2-3" gate={g} isSelected={selectedGate?.id === 'A2-3'} onClick={() => openChuteDetails(g)} isFs={isFs} hasDot={false} />;
                        })()}
                    </div>
                </div>

                {/* Animated Elevator Box / Shaft */}
                <div style={{ 
                    width: '100%', padding: isFs ? '0.85rem 0.4rem' : '0.5rem 0.25rem', borderRadius: '0.9rem',
                    background: isFs ? 'rgba(15,23,42,0.95)' : (isLight ? '#ffffff' : 'rgba(255,255,255,0.05)'),
                    border: '2px solid rgba(0,123,255,0.8)',
                    boxShadow: '0 0 20px rgba(0,123,255,0.4)',
                    textAlign: 'center',
                    flex: isFs ? 0.7 : 'initial',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <div style={{ fontSize: isFs ? '0.85rem' : '0.6rem', color: isLight ? '#475569' : '#38bdf8', fontWeight: '900', marginBottom: '0.2rem' }}>🛗 LİFT</div>
                    <div style={{ padding: isFs ? '0.45rem 0.7rem' : '0.25rem', borderRadius: '0.5rem', background: '#007BFF', color: '#fff', fontSize: isFs ? '0.95rem' : '0.65rem', fontWeight: '900', boxShadow: '0 4px 12px rgba(0,123,255,0.5)' }}>
                        CARRIER
                    </div>
                </div>

                <div style={{ textAlign: 'center', width: '100%' }}>
                    <div style={{ background: '#22c55e', color: '#fff', fontSize: isFs ? '0.82rem' : '0.62rem', fontWeight: '900', padding: isFs ? '0.35rem 0.55rem' : '0.2rem 0.3rem', borderRadius: '6px', textAlign: 'center', width: '100%', boxShadow: '0 2px 8px rgba(34,197,94,0.4)' }}>
                        OmniSort Mini
                    </div>
                </div>
            </div>

            {/* BAY 3: 3. ve 4. DUVAR (A HATTI SAĞ: A3 [9 Göz] + A4 [6 Göz] - LACİVERT %50) */}
            <BayCard 
                title="🟦 3. ve 4. DUVAR (A SAĞ)"
                badge1="A3 (9 Göz)"
                badge2="A4 (6 Göz)"
                m1Cols={3}
                m2Cols={2}
                m1Kat3={['A3-3','A3-2','A3-1']}
                m2Kat3={['A4-2','A4-1']}
                m1Kat2={['A3-6','A3-5','A3-4']}
                m2Kat2={['A4-4','A4-3']}
                m1Kat1={['A3-9','A3-8','A3-7']}
                m2Kat1={['A4-6','A4-5']}
                physicalToChMap={physicalToChMap}
                sorterGates={sorterGates}
                selectedGate={selectedGate}
                openChuteDetails={openChuteDetails}
                isFs={isFs}
                isLight={isLight}
                accentColor="#1e3a8a"
                isBDot={false}
            />

            {/* BAY 4: 7. ve 8. DUVAR (B HATTI SAĞ: B3 [9 Göz] + B4 [6 Göz] - KIRMIZI %50) */}
            <BayCard 
                title="🟥 7. ve 8. DUVAR (B SAĞ)"
                badge1="B3 (9 Göz)"
                badge2="B4 (6 Göz)"
                m1Cols={3}
                m2Cols={2}
                m1Kat3={['B3-1','B3-2','B3-3']}
                m2Kat3={['B4-1','B4-2']}
                m1Kat2={['B3-4','B3-5','B3-6']}
                m2Kat2={['B4-3','B4-4']}
                m1Kat1={['B3-7','B3-8','B3-9']}
                m2Kat1={['B4-5','B4-6']}
                physicalToChMap={physicalToChMap}
                sorterGates={sorterGates}
                selectedGate={selectedGate}
                openChuteDetails={openChuteDetails}
                isFs={isFs}
                isLight={isLight}
                accentColor="#dc2626"
                isBDot={true}
            />
        </div>
    );
};

// -------------------------------------------------------------------------------------
// 3. MASTER FLOOR MAP WRAPPER (Saha Matrisi vs Duvar Kartları Switcher)
// -------------------------------------------------------------------------------------
const FloorMapGrid = ({ sorterGates, physicalToChMap, selectedGate, openChuteDetails, isLight, isFs, displayMode = 'matrix' }) => {
    if (displayMode === 'cards') {
        return (
            <BayCardsGrid 
                sorterGates={sorterGates}
                physicalToChMap={physicalToChMap}
                selectedGate={selectedGate}
                openChuteDetails={openChuteDetails}
                isLight={isLight}
                isFs={isFs}
            />
        );
    }

    return (
        <PhysicalMatrixGrid 
            sorterGates={sorterGates}
            physicalToChMap={physicalToChMap}
            selectedGate={selectedGate}
            openChuteDetails={openChuteDetails}
            isLight={isLight}
            isFs={isFs}
        />
    );
};

const GlassCard = ({ children, glow }) => {
    const { themeMode } = useLanguage();
    const isLight = themeMode === 'light';
    return (
        <div className="glass-morphism" style={{ 
            padding: '1.4rem 1.8rem', borderRadius: '1.4rem', 
            background: isLight ? 'rgba(15, 23, 42, 0.02)' : 'rgba(255,255,255,0.02)', 
            border: isLight ? '1px solid rgba(15,23,42,0.08)' : '1px solid rgba(255,255,255,0.08)',
            position: 'relative', overflow: 'hidden', 
            boxShadow: isLight ? '0 6px 20px rgba(0,0,0,0.03)' : '0 10px 30px rgba(0,0,0,0.3)'
        }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: glow, boxShadow: `0 0 20px ${glow}` }}></div>
            {children}
        </div>
    );
};

const LegendItem = ({ color, label }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: color, boxShadow: `0 0 10px ${color}`, border: '1px solid rgba(255,255,255,0.3)' }}></div>
        <span style={{ fontSize: '0.85rem', color: '#e2e8f0', fontWeight: '800' }}>{label}</span>
    </div>
);

// -------------------------------------------------------------------------------------
// 4 DUVAR & 8 MODÜL RENK KODU YARDIMCISI (%50 TRANSPARENT OPACITY)
// 1. ve 2. Duvar: Turuncu (%50)
// 3. ve 4. Duvar: Lacivert (%50)
// 5. ve 6. Duvar: Mor (%50)
// 7. ve 8. Duvar: Kırmızı (%50)
// -------------------------------------------------------------------------------------
export const getSorterWallColor = (gate, label) => {
    let ch = null;
    if (gate) {
        if (gate.chute_no) ch = parseInt(gate.chute_no, 10);
        else if (typeof gate.id === 'number') ch = gate.id;
        else if (typeof gate.id === 'string') {
            const parsed = parseInt(gate.id.replace(/\D/g, ''), 10);
            if (!isNaN(parsed) && parsed > 0 && parsed <= 63) ch = parsed;
        }
    }
    
    // Label prefixinden chute aralığı tahmini (A0, A1, A3, A4, B0, B1, B3, B4, A2)
    if (!ch && label) {
        if (label.startsWith('A1-') || label.startsWith('A0-')) ch = 1;
        else if (label.startsWith('A3-') || label.startsWith('A4-')) ch = 16;
        else if (label.startsWith('B1-') || label.startsWith('B0-')) ch = 31;
        else if (label.startsWith('B3-') || label.startsWith('B4-')) ch = 46;
        else if (label.startsWith('A2-')) ch = 61;
    }

    // 1. ve 2. Duvar (A Hattı Sol): Turuncu (%50 Opacity)
    if (ch >= 1 && ch <= 15) {
        return {
            wall: ch <= 9 ? '1. Duvar' : '2. Duvar',
            wallPair: '1. ve 2. Duvar',
            colorName: 'Turuncu',
            hex: '#ea580c',
            bg50: 'rgba(234, 88, 12, 0.50)',
            border: 'rgba(249, 115, 22, 0.85)',
            glow: '0 0 16px rgba(234, 88, 12, 0.45)',
            badgeBg: '#ea580c'
        };
    }
    // 3. ve 4. Duvar (A Hattı Sağ): Lacivert (%50 Opacity)
    if (ch >= 16 && ch <= 30) {
        return {
            wall: ch <= 24 ? '3. Duvar' : '4. Duvar',
            wallPair: '3. ve 4. Duvar',
            colorName: 'Lacivert',
            hex: '#1e3a8a',
            bg50: 'rgba(30, 58, 138, 0.50)',
            border: 'rgba(59, 130, 246, 0.85)',
            glow: '0 0 16px rgba(30, 58, 138, 0.55)',
            badgeBg: '#1e3a8a'
        };
    }
    // 5. ve 6. Duvar (B Hattı Sol): Mor (%50 Opacity)
    if (ch >= 31 && ch <= 45) {
        return {
            wall: ch <= 39 ? '5. Duvar' : '6. Duvar',
            wallPair: '5. ve 6. Duvar',
            colorName: 'Mor',
            hex: '#7e22ce',
            bg50: 'rgba(126, 34, 206, 0.50)',
            border: 'rgba(168, 85, 247, 0.85)',
            glow: '0 0 16px rgba(126, 34, 206, 0.45)',
            badgeBg: '#7e22ce'
        };
    }
    // 7. ve 8. Duvar (B Hattı Sağ): Kırmızı (%50 Opacity)
    if (ch >= 46 && ch <= 60) {
        return {
            wall: ch <= 54 ? '7. Duvar' : '8. Duvar',
            wallPair: '7. ve 8. Duvar',
            colorName: 'Kırmızı',
            hex: '#dc2626',
            bg50: 'rgba(220, 38, 38, 0.50)',
            border: 'rgba(239, 68, 68, 0.85)',
            glow: '0 0 16px rgba(220, 38, 38, 0.45)',
            badgeBg: '#dc2626'
        };
    }
    // Asansör (A2): Mavi (%50 Opacity)
    return {
        wall: 'Asansör',
        wallPair: 'Orta Asansör',
        colorName: 'Mavi',
        hex: '#0284c7',
        bg50: 'rgba(2, 132, 199, 0.50)',
        border: 'rgba(56, 189, 248, 0.85)',
        glow: '0 0 16px rgba(2, 132, 199, 0.45)',
        badgeBg: '#0284c7'
    };
};

// -------------------------------------------------------------------------------------
// 4. CANLI OMNISORT GÖZ DÜĞÜMÜ (GATE NODE) - 43" TV ULTRA YÜKSEK KONTRAST & BÜYÜK YAZI TİPİ
// -------------------------------------------------------------------------------------
const GateNode = ({ gate, onClick, isSelected, label, isFs, hasDot = false }) => {
    const { themeMode } = useLanguage();
    const isLight = isFs ? false : themeMode === 'light';
    const isError = gate.status === 'error';
    const capacity = gate.target_capacity || 25;
    const count = gate.item_count || 0;
    const loadPercent = Math.min(100, Math.round((count / capacity) * 100));
    const isFull = gate.is_full || count >= capacity;
    const hasDestination = gate.destination && gate.destination !== '---' && gate.destination !== '';

    const physicalToCartMap = {
        'A0-1': 'R09.1', 'A0-2': 'R09.2', 'A0-3': 'R09.3', 'A0-4': 'R09.4', 'A0-5': 'R09.5', 'A0-6': 'R09.6',
        'A1-1': 'R01.1', 'A1-2': 'R01.2', 'A1-3': 'R01.3', 'A1-4': 'R01.4', 'A1-5': 'R01.5', 'A1-6': 'R01.6', 'A1-7': 'R01.7', 'A1-8': 'R01.8', 'A1-9': 'R01.9',
        'A2-1': 'A2.1', 'A2-2': 'A2.2', 'A2-3': 'A2.3',
        'A3-1': 'R02.1', 'A3-2': 'R02.2', 'A3-3': 'R02.3', 'A3-4': 'R02.4', 'A3-5': 'R02.5', 'A3-6': 'R02.6', 'A3-7': 'R02.7', 'A3-8': 'R02.8', 'A3-9': 'R02.9',
        'A4-1': 'R10.1', 'A4-2': 'R10.2', 'A4-3': 'R10.3', 'A4-4': 'R10.4', 'A4-5': 'R10.5', 'A4-6': 'R10.6',
        'B0-1': 'R11.1', 'B0-2': 'R11.2', 'B0-3': 'R11.3', 'B0-4': 'R11.4', 'B0-5': 'R11.5', 'B0-6': 'R11.6',
        'B1-1': 'R03.1', 'B1-2': 'R03.2', 'B1-3': 'R03.3', 'B1-4': 'R03.4', 'B1-5': 'R03.5', 'B1-6': 'R03.6', 'B1-7': 'R03.7', 'B1-8': 'R03.8', 'B1-9': 'R03.9',
        'B3-1': 'R04.1', 'B3-2': 'R04.2', 'B3-3': 'R04.3', 'B3-4': 'R04.4', 'B3-5': 'R04.5', 'B3-6': 'R04.6', 'B3-7': 'R04.7', 'B3-8': 'R04.8', 'B3-9': 'R04.9',
        'B4-1': 'R12.1', 'B4-2': 'R12.2', 'B4-3': 'R12.3', 'B4-4': 'R12.4', 'B4-5': 'R12.5', 'B4-6': 'R12.6'
    };
    
    // Duvar Rengi Hesabı (%50 Transparent Opacity Kuralı)
    const wallColor = getSorterWallColor(gate, label);

    // Status colors tuned for 43" TV maximum contrast from distance
    let liquidBaseColor = '#059669';
    let liquidGlowColor = '#10b981';
    let borderTint = isFull ? '#ef4444' : (count > 0 ? '#10b981' : wallColor.border);
    let cardBg = wallColor.bg50; // Kullanıcı Talebi: %50 Transparan Duvar Rengi
    let dotColor = wallColor.hex;

    const isSensorBlocked = gate.status === 'sensor_blocked';

    if (isSensorBlocked || isError) {
        liquidBaseColor = '#dc2626';
        liquidGlowColor = '#ef4444';
        borderTint = '#ef4444';
        dotColor = '#ef4444';
        cardBg = 'rgba(239, 68, 68, 0.55)';
    } else if (isFull) {
        liquidBaseColor = '#dc2626';
        liquidGlowColor = '#ef4444';
        borderTint = '#ef4444';
        dotColor = '#ef4444';
    } else if (loadPercent >= 50) {
        liquidBaseColor = '#d97706';
        liquidGlowColor = '#f59e0b';
        borderTint = '#f59e0b';
        dotColor = '#f59e0b';
    } else if (count > 0) {
        liquidBaseColor = '#059669';
        liquidGlowColor = '#10b981';
        borderTint = '#10b981';
        dotColor = '#10b981';
    }

    return (
        <div 
            onClick={onClick}
            title={`${label || gate.id} (${physicalToCartMap[label] || ''}) - ${wallColor.wallPair} (${wallColor.colorName}) - ${gate.destination || 'Boş'} (${count}/${capacity} Adet - %${loadPercent} Dolu)`}
            style={{ 
                background: cardBg, 
                border: isFs ? (count > 0 ? `2.5px solid ${borderTint}` : `2px solid ${borderTint}`) : `2px solid ${borderTint}`,
                borderRadius: isFs ? '0.95rem' : '0.7rem', 
                padding: isFs ? '0.45rem 0.35rem' : '0.35rem 0.25rem', 
                textAlign: 'center', 
                cursor: 'pointer', 
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isSelected ? 'scale(0.96)' : 'none',
                boxShadow: isFull ? '0 0 28px rgba(239, 68, 68, 0.85)' : (count > 0 ? `0 6px 20px ${liquidBaseColor}66` : wallColor.glow),
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: isFs ? '0.2rem' : '0.1rem',
                height: isFs ? '100%' : 'auto',
                minHeight: isFs ? '72px' : '52px'
            }}
            onMouseOver={e => {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)';
                e.currentTarget.style.boxShadow = `0 8px 28px ${liquidGlowColor}77`;
                e.currentTarget.style.borderColor = liquidGlowColor;
            }}
            onMouseOut={e => {
                e.currentTarget.style.transform = isSelected ? 'scale(0.96)' : 'none';
                e.currentTarget.style.boxShadow = isFull ? '0 0 28px rgba(239, 68, 68, 0.85)' : (count > 0 ? `0 6px 20px ${liquidBaseColor}66` : (isLight ? '0 2px 6px rgba(0,0,0,0.05)' : (isFs ? '0 4px 15px rgba(0,0,0,0.6)' : '0 4px 12px rgba(0,0,0,0.4)')));
                e.currentTarget.style.borderColor = borderTint;
            }}
        >
            {/* STATUS INDICATOR DOT (Image 1 Screen Referansı: Sağ Üst LED Nokta) */}
            {hasDot && (
                <div 
                    title={`Durum: ${count > 0 ? `${count} adet` : 'Boş'}`}
                    style={{
                        position: 'absolute',
                        top: isFs ? '6px' : '5px',
                        right: isFs ? '6px' : '5px',
                        width: isFs ? '12px' : '7px',
                        height: isFs ? '12px' : '7px',
                        borderRadius: '50%',
                        background: dotColor,
                        border: isFs ? '1.5px solid rgba(255,255,255,0.4)' : 'none',
                        boxShadow: count > 0 ? `0 0 12px ${dotColor}` : 'none',
                        zIndex: 3
                    }} 
                />
            )}

            {/* LIQUID LEVEL FILL (Canlı OmniSort Doluluk Barı) */}
            {count > 0 && (
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: '100%',
                    height: `${loadPercent}%`,
                    background: `linear-gradient(180deg, ${liquidGlowColor}70 0%, ${liquidBaseColor}95 100%)`,
                    borderTop: `3px solid ${liquidGlowColor}`,
                    boxShadow: `0 0 15px ${liquidGlowColor}`,
                    transition: 'height 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                    zIndex: 1,
                    pointerEvents: 'none'
                }} />
            )}

            {/* FRONT CONTENT */}
            <div style={{ position: 'relative', zIndex: 2, width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: isFs ? '0.15rem' : '0.08rem' }}>
                {/* Physical Code: Extra Large, Ultra-Bold, White with Heavy Shadow for 43" TVs */}
                <div style={{ 
                    fontSize: isFs ? '1.75rem' : '0.92rem', 
                    fontWeight: '900', 
                    color: isLight ? '#0f172a' : '#ffffff', 
                    letterSpacing: isFs ? '0.8px' : '0.3px',
                    lineHeight: '1.05',
                    whiteSpace: 'nowrap',
                    textShadow: isFs ? '0 2px 10px rgba(0,0,0,0.95), 0 0 4px rgba(0,0,0,0.8)' : (isLight ? 'none' : '0 2px 6px rgba(0,0,0,0.6)')
                }}>
                    {label || gate.id}
                </div>

                {/* Subtitle Cart Code (e.g. R09.2, R11.1) + Live Count Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: isFs ? '0.45rem' : '0.3rem', justifyContent: 'center', width: '100%' }}>
                    {physicalToCartMap[label] && (
                        <span style={{
                            fontSize: isFs ? '1.1rem' : '0.62rem',
                            fontWeight: '900',
                            color: isFs ? '#ffffff' : (count > 0 ? (isLight ? '#0f172a' : '#38bdf8') : (isLight ? '#64748b' : '#94a3b8')),
                            lineHeight: '1',
                            letterSpacing: '0.3px',
                            textShadow: isFs ? '0 2px 6px rgba(0,0,0,0.95)' : 'none'
                        }}>
                            {physicalToCartMap[label]}
                        </span>
                    )}

                    {count > 0 ? (
                        <span style={{
                            fontSize: isFs ? '1.05rem' : '0.58rem',
                            fontWeight: '900',
                            background: '#000000',
                            border: isFs ? `1.5px solid #ffffff` : 'none',
                            padding: isFs ? '0.1rem 0.5rem' : '0.1rem 0.35rem',
                            borderRadius: '6px',
                            color: '#ffffff',
                            boxShadow: isFs ? `0 0 10px ${liquidGlowColor}88` : 'none'
                        }}>
                            {count} ad.
                        </span>
                    ) : (
                        isFs && (
                            <span style={{
                                fontSize: '0.88rem',
                                fontWeight: '900',
                                background: 'rgba(0,0,0,0.65)',
                                padding: '0.1rem 0.45rem',
                                borderRadius: '4px',
                                color: '#ffffff',
                                border: '1px solid rgba(255,255,255,0.3)',
                                textShadow: '0 1px 3px rgba(0,0,0,0.9)'
                            }}>
                                0 ad.
                            </span>
                        )
                    )}
                </div>

                {/* Destination name (High contrast pure white on dark badge for 43" TV readability) */}
                {hasDestination ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '96%', gap: '0.1rem' }}>
                        <div style={{
                            fontSize: isFs ? '0.96rem' : '0.55rem',
                            fontWeight: '900',
                            color: '#ffffff',
                            background: isFs ? 'rgba(0,0,0,0.85)' : 'none',
                            padding: isFs ? '0.12rem 0.5rem' : '0',
                            borderRadius: '4px',
                            border: isFs ? '1px solid rgba(255,255,255,0.5)' : 'none',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '100%',
                            lineHeight: '1.2',
                            marginTop: isFs ? '0.15rem' : '0.05rem',
                            textShadow: isFs ? '0 2px 5px rgba(0,0,0,0.95)' : 'none'
                        }}>
                            {gate.destination}
                        </div>
                        {(gate.assigned_size || (gate.destination && gate.destination.includes('[Beden:'))) && (
                            <div style={{
                                fontSize: isFs ? '0.78rem' : '0.52rem',
                                fontWeight: '900',
                                color: '#fbbf24',
                                background: 'rgba(245, 158, 11, 0.25)',
                                border: '1px solid rgba(245, 158, 11, 0.6)',
                                borderRadius: '3px',
                                padding: '0.05rem 0.3rem',
                                lineHeight: '1.1',
                                textShadow: '0 1px 2px rgba(0,0,0,0.9)'
                            }}>
                                👕 {gate.assigned_size || (gate.destination.match(/\[Beden:\s*([^\]]+)\]/) ? gate.destination.match(/\[Beden:\s*([^\]]+)\]/)[1] : '')}
                            </div>
                        )}
                    </div>
                ) : (
                    isFs && (
                        <div style={{
                            fontSize: '0.85rem',
                            fontWeight: '900',
                            color: '#ffffff',
                            lineHeight: '1.1',
                            textShadow: '0 1px 4px rgba(0,0,0,0.9)',
                            opacity: 0.95
                        }}>
                            BOŞ
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export default HardwareDashboard;

