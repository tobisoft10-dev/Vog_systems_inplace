const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Cache for quick lookups
let cachedProfile = null;
let lastProfileFetch = 0;
let cachedSettings = null;
let lastSettingsFetch = 0;

const PROFILES = {
    PROFILE_BRAND_DEALER: {
        id: 'PROFILE_BRAND_DEALER',
        name: 'Standart Marka / Bayi Modu',
        description: 'Her marka ve bayi tekil sabit gözüne ayrıştırılır.',
        icon: '🎯'
    },
    PROFILE_CASCADE_OVERFLOW: {
        id: 'PROFILE_CASCADE_OVERFLOW',
        name: 'Otomatik Kaskad Taşma Modu',
        description: 'Tek bayiye birden fazla göz atanır. Koli dolunca otomatik sıradaki göze taşar.',
        icon: '🌊'
    },
    PROFILE_PRODUCT_SIZE_SPLIT: {
        id: 'PROFILE_PRODUCT_SIZE_SPLIT',
        name: 'Ürün Modeli & Beden Modu',
        description: 'Mont, Pantolon veya Beden (S, M, L, XL) ayrımı yapılarak gözlere yönlendirilir.',
        icon: '👕'
    },
    PROFILE_DYNAMIC_PACKING: {
        id: 'PROFILE_DYNAMIC_PACKING',
        name: 'Dinamik Koli Dolum & Etiketleme',
        description: 'Koli hedef adedine ulaştığında otomatik koli etiketi tetiklenir ve yeni koliye geçer.',
        icon: '📦'
    },
    PROFILE_SMART_HYBRID: {
        id: 'PROFILE_SMART_HYBRID',
        name: 'Akıllı Hibrit Mod',
        description: 'Sipariş büyüklüğü ve ürün çeşitliliğine göre kaskad ve model kurallarını otonom uygular.',
        icon: '⚡'
    },
    PROFILE_PERSONNEL: {
        id: 'PROFILE_PERSONNEL',
        name: 'Personel Bazlı Sipariş & Kolileme Modu',
        description: 'Her personel tekil bir sorter gözüne atanır. Kişiye ait kıyafet seti tamamlandığında koli etiketi basılır.',
        icon: '👤'
    }
};

// OmniSort Mini: 8 Physical Modules + 1 Center Elevator Module = 63 Göz
const chToPhysicalMap = {
    // Bölüm 1 (A Hattı Sol: A0 [6 Göz] + A1 [9 Göz])
    1: 'A1-1', 2: 'A1-2', 3: 'A1-3', 4: 'A1-4', 5: 'A1-5', 6: 'A1-6', 7: 'A1-7', 8: 'A1-8', 9: 'A1-9',
    10: 'A0-1', 11: 'A0-2', 12: 'A0-3', 13: 'A0-4', 14: 'A0-5', 15: 'A0-6',

    // Bölüm 2 (A Hattı Sağ: A3 [9 Göz] + A4 [6 Göz])
    16: 'A3-1', 17: 'A3-2', 18: 'A3-3', 19: 'A3-4', 20: 'A3-5', 21: 'A3-6', 22: 'A3-7', 23: 'A3-8', 24: 'A3-9',
    25: 'A4-1', 26: 'A4-2', 27: 'A4-3', 28: 'A4-4', 29: 'A4-5', 30: 'A4-6',

    // Bölüm 3 (B Hattı Sol: B0 [6 Göz] + B1 [9 Göz])
    31: 'B1-1', 32: 'B1-2', 33: 'B1-3', 34: 'B1-4', 35: 'B1-5', 36: 'B1-6', 37: 'B1-7', 38: 'B1-8', 39: 'B1-9',
    40: 'B0-1', 41: 'B0-2', 42: 'B0-3', 43: 'B0-4', 44: 'B0-5', 45: 'B0-6',

    // Bölüm 4 (B Hattı Sağ: B3 [9 Göz] + B4 [6 Göz])
    46: 'B3-1', 47: 'B3-2', 48: 'B3-3', 49: 'B3-4', 50: 'B3-5', 51: 'B3-6', 52: 'B3-7', 53: 'B3-8', 54: 'B3-9',
    55: 'B4-1', 56: 'B4-2', 57: 'B4-3', 58: 'B4-4', 59: 'B4-5', 60: 'B4-6',

    // Asansör Arkası Kontrol & Hata Gözleri (A2: 3 Göz)
    61: 'A2-1', 62: 'A2-2', 63: 'A2-3'
};

function getPlcPhysicalMapping(chuteNo) {
    const ch = parseInt(chuteNo, 10) || 1;
    
    // Wall A1: Bölüm 1 (A Hattı Sol: Z-A1-1 [9] + Z-A0-1 [6])
    if (ch >= 1 && ch <= 9) {
        const wallId = process.env.HC_WALL_A1_M1 || 'M145-WALL-A-1';
        return { wallId, wallName: 'A Hattı Sol (Z-A1-1)', moduleTag: 'Z-A1-1', index: ch, physicalCode: chToPhysicalMap[ch] };
    }
    if (ch >= 10 && ch <= 15) {
        const wallId = process.env.HC_WALL_A1_M2 || 'M145-WALL-A-0';
        return { wallId, wallName: 'A Hattı Sol (Z-A0-1)', moduleTag: 'Z-A0-1', index: ch - 9, physicalCode: chToPhysicalMap[ch] };
    }

    // Wall A2: Bölüm 2 (A Hattı Sağ: Z-A3-1 [9] + Z-A4-1 [6])
    if (ch >= 16 && ch <= 24) {
        const wallId = process.env.HC_WALL_A2_M1 || 'M145-WALL-A-3';
        return { wallId, wallName: 'A Hattı Sağ (Z-A3-1)', moduleTag: 'Z-A3-1', index: ch - 15, physicalCode: chToPhysicalMap[ch] };
    }
    if (ch >= 25 && ch <= 30) {
        const wallId = process.env.HC_WALL_A2_M2 || 'M145-WALL-A-4';
        return { wallId, wallName: 'A Hattı Sağ (Z-A4-1)', moduleTag: 'Z-A4-1', index: ch - 24, physicalCode: chToPhysicalMap[ch] };
    }

    // Wall B1: Bölüm 3 (B Hattı Sol: Z-B1-1 [9] + Z-B0-1 [6])
    if (ch >= 31 && ch <= 39) {
        const wallId = process.env.HC_WALL_B1_M1 || 'M145-WALL-B-1';
        return { wallId, wallName: 'B Hattı Sol (Z-B1-1)', moduleTag: 'Z-B1-1', index: ch - 30, physicalCode: chToPhysicalMap[ch] };
    }
    if (ch >= 40 && ch <= 45) {
        const wallId = process.env.HC_WALL_B1_M2 || 'M145-WALL-B-0';
        return { wallId, wallName: 'B Hattı Sol (Z-B0-1)', moduleTag: 'Z-B0-1', index: ch - 39, physicalCode: chToPhysicalMap[ch] };
    }

    // Wall B2: Bölüm 4 (B Hattı Sağ: Z-B3-1 [9] + Z-B4-1 [6])
    if (ch >= 46 && ch <= 54) {
        const wallId = process.env.HC_WALL_B2_M1 || 'M145-WALL-B-3';
        return { wallId, wallName: 'B Hattı Sağ (Z-B3-1)', moduleTag: 'Z-B3-1', index: ch - 45, physicalCode: chToPhysicalMap[ch] };
    }
    if (ch >= 55 && ch <= 60) {
        const wallId = process.env.HC_WALL_B2_M2 || 'M145-WALL-B-4';
        return { wallId, wallName: 'B Hattı Sağ (Z-B4-1)', moduleTag: 'Z-B4-1', index: ch - 54, physicalCode: chToPhysicalMap[ch] };
    }

    // Asansör Arkası Kontrol & Hata Gözleri: A2 (Z-A2-1: A2-1, A2-2, A2-3)
    if (ch >= 61 && ch <= 63) {
        const wallId = process.env.HC_WALL_A2_CENTER || 'M145-WALL-A-2';
        return { wallId, wallName: 'A Hattı Asansör Arkası (Z-A2-1)', moduleTag: 'Z-A2-1', index: ch - 60, physicalCode: chToPhysicalMap[ch] };
    }

    return { wallId: process.env.HC_WALL_A1_M1 || 'M145-WALL-A-1', wallName: 'A Hattı Sol', moduleTag: 'Z-A1-1', index: 1, physicalCode: 'A1-1' };
}

function getChuteFromPlcMapping(wallId, index) {
    const idx = parseInt(index, 10) || 1;
    const w = (wallId || '').toUpperCase();
    
    if (w.includes('A-1') || w.endsWith('A1') || w === (process.env.HC_WALL_A1_M1 || 'M145-WALL-A-1').toUpperCase()) {
        return idx; // 1..9
    }
    if (w.includes('A-0') || w.endsWith('A0') || w === (process.env.HC_WALL_A1_M2 || 'M145-WALL-A-0').toUpperCase()) {
        return 9 + idx; // 10..15
    }
    if (w.includes('A-3') || w.endsWith('A3') || w === (process.env.HC_WALL_A2_M1 || 'M145-WALL-A-3').toUpperCase()) {
        return 15 + idx; // 16..24
    }
    if (w.includes('A-4') || w.endsWith('A4') || w === (process.env.HC_WALL_A2_M2 || 'M145-WALL-A-4').toUpperCase()) {
        return 24 + idx; // 25..30
    }
    if (w.includes('B-1') || w.endsWith('B1') || w === (process.env.HC_WALL_B1_M1 || 'M145-WALL-B-1').toUpperCase()) {
        return 30 + idx; // 31..39
    }
    if (w.includes('B-0') || w.endsWith('B0') || w === (process.env.HC_WALL_B1_M2 || 'M145-WALL-B-0').toUpperCase()) {
        return 39 + idx; // 40..45
    }
    if (w.includes('B-3') || w.endsWith('B3') || w === (process.env.HC_WALL_B2_M1 || 'M145-WALL-B-3').toUpperCase()) {
        return 45 + idx; // 46..54
    }
    if (w.includes('B-4') || w.endsWith('B4') || w === (process.env.HC_WALL_B2_M2 || 'M145-WALL-B-4').toUpperCase()) {
        return 54 + idx; // 55..60
    }
    if (w.includes('A-2') || w.includes('CENTER') || w.includes('LIFT') || w === (process.env.HC_WALL_A2_CENTER || 'M145-WALL-A-2').toUpperCase()) {
        return 60 + idx; // 61..63
    }
    return idx;
}

async function getActiveProfile() {
    if (cachedProfile && (Date.now() - lastProfileFetch < 5000)) {
        return cachedProfile;
    }
    try {
        const res = await pool.query("SELECT value FROM sorter_settings WHERE key = 'active_profile' LIMIT 1");
        cachedProfile = res.rows.length > 0 ? res.rows[0].value : 'PROFILE_BRAND_DEALER';
        lastProfileFetch = Date.now();
        return cachedProfile;
    } catch (err) {
        console.error('[SORTER ENGINE] Error getting active profile:', err.message);
        return 'PROFILE_BRAND_DEALER';
    }
}

async function setActiveProfile(profileKey) {
    if (!PROFILES[profileKey]) {
        throw new Error(`Invalid profile key: ${profileKey}`);
    }
    await pool.query(`
        INSERT INTO sorter_settings (key, value, updated_at)
        VALUES ('active_profile', $1, CURRENT_TIMESTAMP)
        ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = CURRENT_TIMESTAMP;
    `, [profileKey]);
    cachedProfile = profileKey;
    lastProfileFetch = Date.now();
    console.log(`[SORTER ENGINE] 🔄 Active profile changed to: ${profileKey} (${PROFILES[profileKey].name})`);
    return { success: true, profile: PROFILES[profileKey] };
}

async function getSorterSettings() {
    if (cachedSettings && (Date.now() - lastSettingsFetch < 5000)) {
        return cachedSettings;
    }
    try {
        const res = await pool.query("SELECT key, value, description FROM sorter_settings");
        const settings = {};
        res.rows.forEach(r => { settings[r.key] = r.value; });
        settings.active_profile_info = PROFILES[settings.active_profile] || PROFILES.PROFILE_BRAND_DEALER;
        cachedSettings = settings;
        lastSettingsFetch = Date.now();
        return settings;
    } catch (err) {
        console.error('[SORTER ENGINE] Error getting sorter settings:', err.message);
        return { active_profile: 'PROFILE_BRAND_DEALER', max_chute_capacity: '25', error_chute: '61' };
    }
}

async function updateSorterSettings(settingsObj) {
    for (const [key, value] of Object.entries(settingsObj)) {
        await pool.query(`
            INSERT INTO sorter_settings (key, value, updated_at)
            VALUES ($1, $2, CURRENT_TIMESTAMP)
            ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP;
        `, [key, String(value)]);
    }
    cachedSettings = null;
    lastSettingsFetch = 0;
    return getSorterSettings();
}

async function getChutesStatus() {
    try {
        const res = await pool.query(`
            SELECT DISTINCT ON (c.chute_no)
                c.*, m.destination_name as mapped_destination, m.match_type, m.priority, m.size as mapped_size
            FROM sorter_chute_state c
            LEFT JOIN sorter_mappings m ON c.chute_no = m.chute_no AND m.status = 'ACTIVE'
            ORDER BY c.chute_no ASC, m.priority ASC NULLS LAST
        `);
        return res.rows.map(r => {
            const capacity = r.target_capacity || 25;
            const count = r.item_count || 0;
            const loadPercent = Math.min(100, Math.round((count / capacity) * 100));
            const plc = getPlcPhysicalMapping(r.chute_no);
            
            const mod15 = ((r.chute_no - 1) % 15) + 1;
            let floorNum = 1;
            let floorLabel = "Kat 1 (Alt)";
            if (mod15 >= 1 && mod15 <= 5) {
                floorNum = 1;
                floorLabel = "Kat 1 (Alt)";
            } else if (mod15 >= 6 && mod15 <= 10) {
                floorNum = 2;
                floorLabel = "Kat 2 (Orta)";
            } else if (mod15 >= 11 && mod15 <= 15) {
                floorNum = 3;
                floorLabel = "Kat 3 (Üst)";
            }

            return {
                chute_no: r.chute_no,
                id: `CH-${r.chute_no.toString().padStart(2, '0')}`,
                physical_code: r.physical_code || chToPhysicalMap[r.chute_no],
                wall_id: plc.wallId,
                wall_name: plc.wallName,
                plan_index: plc.index,
                floor_num: floorNum,
                floor_label: floorLabel,
                destination: r.assigned_destination !== '---' ? r.assigned_destination : (r.mapped_destination || '---'),
                assigned_size: r.assigned_size || r.mapped_size || null,
                match_type: r.match_type || 'DEALER',
                item_count: count,
                target_capacity: capacity,
                load: loadPercent,
                status: r.status || (count >= capacity ? 'full' : (count > 0 ? 'active' : 'standby')),
                is_full: count >= capacity,
                last_barcode: r.last_barcode,
                last_sku: r.last_sku,
                last_product_name: r.last_product_name,
                updated_at: r.updated_at
            };
        });
    } catch (err) {
        console.error('[SORTER ENGINE] Error getting chutes status:', err.message);
        return [];
    }
}

async function getChuteItems(chuteNo) {
    const ch = parseInt(chuteNo, 10);
    if (!ch || isNaN(ch)) return [];
    try {
        const res = await pool.query(`
            SELECT * FROM sorter_chute_items 
            WHERE chute_no = $1 
            ORDER BY created_at DESC 
            LIMIT 200
        `, [ch]);
        return res.rows;
    } catch (err) {
        console.error(`[SORTER ENGINE] Error getting chute items for ${ch}:`, err.message);
        return [];
    }
}

async function resetChute(chuteNo) {
    const ch = parseInt(chuteNo, 10);
    try {
        await pool.query(`
            UPDATE sorter_chute_state
            SET item_count = 0, assigned_destination = '---', last_barcode = NULL, last_sku = NULL, last_product_name = NULL, status = 'standby', updated_at = CURRENT_TIMESTAMP
            WHERE chute_no = $1;
        `, [ch]);
        await pool.query(`
            DELETE FROM sorter_chute_items
            WHERE chute_no = $1;
        `, [ch]);
        await pool.query(`
            DELETE FROM sorter_mappings
            WHERE chute_no = $1;
        `, [ch]);
        await pool.query(`
            UPDATE personnel
            SET sorter_chute = NULL
            WHERE sorter_chute = $1;
        `, [ch]);

        // Extinguish LED if in 1-60 range
        if (ch >= 1 && ch <= 60) {
            const plc = getPlcPhysicalMapping(ch);
            if (plc && plc.wallId) {
                sendMultLedCommand([{ wallId: plc.wallId, index: plc.index, color: 0, isTwinkle: false }]).catch(() => {});
            }
        }

        console.log(`[SORTER ENGINE] 🧹 Chute ${ch} (${chToPhysicalMap[ch]}) reset to 0 items, all mappings cleared, and unassigned.`);
        return { success: true, chute_no: ch };
    } catch (err) {
        console.error(`[SORTER ENGINE] Error resetting chute ${ch}:`, err.message);
        throw err;
    }
}

async function resetAllChutes() {
    try {
        await pool.query(`
            UPDATE sorter_chute_state
            SET item_count = 0, assigned_destination = '---', last_barcode = NULL, last_sku = NULL, last_product_name = NULL, status = 'standby', updated_at = CURRENT_TIMESTAMP;
        `);
        await pool.query(`
            DELETE FROM sorter_chute_items;
        `);
        await pool.query(`
            DELETE FROM sorter_mappings;
        `);
        await pool.query(`
            UPDATE personnel SET sorter_chute = NULL WHERE sorter_chute IS NOT NULL;
        `);
        await pool.query(`
            UPDATE personnel SET packing_status = 'PENDING' WHERE packing_status IN ('PACKING', 'PACKED');
        `);

        // Extinguish all LEDs for 60 chutes
        const multLedItems = [];
        for (let ch = 1; ch <= 60; ch++) {
            const plc = getPlcPhysicalMapping(ch);
            multLedItems.push({ wallId: plc.wallId, index: plc.index, color: 0, isTwinkle: false });
        }
        sendMultLedCommand(multLedItems).catch(() => {});

        console.log(`[SORTER ENGINE] 🧹 ALL 63 Chutes, all mappings, items, personnel chute assignments and packing statuses reset.`);
        return { success: true };
    } catch (err) {
        console.error(`[SORTER ENGINE] Error resetting all chutes:`, err.message);
        throw err;
    }
}

/**
 * Official HC Robotics OmniSort Mini - VOG System Color Standard (0..5 Valid Physical Hardware States)
 * 
 * Target Color of the Lamp (color):
 * 0: Extinguish (Söndür / Kapalı)
 * 1: Green (Yeşil - #10B981) - TAMAMLANAN GÖZ (Sipariş / Koli Bitti)
 * 2: Yellow (Sarı - #F59E0B) - YENİ SİPARİŞ (Boş / Rezerve Göz)
 * 3: Red (Kırmızı - #EF4444) - HATA / TANIMSIZ / ARIZA
 * 4: Blue (Mavi - #007BFF)   - KISMİ DOLU (Toplama Devam Ediyor)
 * 5: Purple (Mor - #8B5CF6)  - GÖZ SENSÖRÜ OKUDU / İHLAL (Sensör önünde ürün var)
 * 
 * Çift Renk Mekânsal Kombinasyon (Dual-LED):
 * index: -1 -> Duvar Ana Çerçeve Şeridi
 * index: 1..N -> Göz Şeritleri
 * isTwinkle: Boolean (true: Flaş / Yanıp Sönme, false: Sabit Yanma)
 */
function resolveLightStripColor(chuteNo, reasonType, meta = {}) {
    const ch = parseInt(chuteNo, 10);
    const { isFull, isComplete, count, loadPercent, isOrder, isError, isSensorBlocked } = meta;

    // 1. Göz Sensörü Okuduğunda (Sensör Önünde Ürün Var / İhlal): MOR (5)
    if (isSensorBlocked || reasonType === 'SENSOR') {
        return {
            lightColor: 'PURPLE',
            color: 5, // 5: Purple (Mor)
            wallColor: 5,
            ledColor: 5,
            colorCode: '#8B5CF6',
            isTwinkle: true,
            lightMode: 'FLASH',
            lightName: 'Mor Flaş (Göz Sensörü Okudu / İhlal)'
        };
    }

    // 2. Hata Durumunda (Tanımsız, Hata, A2 Asansör Arkası Kontrol Gözleri 61..63): KIRMIZI (3)
    if (isError || (ch >= 61 && ch <= 63) || reasonType === 'ERROR') {
        return {
            lightColor: 'RED',
            color: 3, // 3: Red (Kırmızı)
            wallColor: 3,
            ledColor: 3,
            colorCode: '#EF4444',
            isTwinkle: true,
            lightMode: 'FLASH',
            lightName: 'Kırmızı Flaş (Hata / Tanımsız)'
        };
    }

    // 3. Turkuaz Kombinasyonu: MAVİ DUVAR (4) + YEŞİL GÖZ (1)
    if (reasonType === 'CYAN' || reasonType === 'TURKUAZ' || reasonType === 'QC') {
        return {
            lightColor: 'CYAN',
            color: 1, // Chute: Yeşil (1)
            wallColor: 4, // Wall: Mavi (4)
            ledColor: 1,
            colorCode: '#06B6D4',
            isTwinkle: false,
            lightMode: 'SOLID',
            lightName: 'Turkuaz Kombinasyonu (Mavi Duvar + Yeşil Göz)'
        };
    }

    // 4. Aydınlatma / Beyaz Kombinasyonu: SARI DUVAR (2) + YEŞİL GÖZ (1)
    if (reasonType === 'WHITE' || reasonType === 'BEYAZ') {
        return {
            lightColor: 'WHITE',
            color: 1, // Chute: Yeşil (1)
            wallColor: 2, // Wall: Sarı (2)
            ledColor: 1,
            colorCode: '#F8FAFC',
            isTwinkle: false,
            lightMode: 'SOLID',
            lightName: 'Aydınlatma Kombinasyonu (Sarı Duvar + Yeşil Göz)'
        };
    }

    // 5. İşlem / Sipariş Tamamlandığında (Koli Hazır / Sepet Doldu): YEŞİL (1)
    if (isFull || isComplete || (loadPercent !== undefined && loadPercent >= 100) || (count !== undefined && meta.targetCapacity && count >= meta.targetCapacity) || reasonType === 'COMPLETE' || reasonType === 'FULL') {
        return {
            lightColor: 'GREEN',
            color: 1, // 1: Green (Yeşil)
            ledColor: 1,
            colorCode: '#10B981',
            isTwinkle: false,
            lightMode: 'SOLID',
            lightName: 'Yeşil Sabit (İşlem / Sipariş Tamamlandı)'
        };
    }

    // 6. Kısmi Dolu İken (Ürün atılmış, toplama devam ediyor): MAVİ (4)
    if ((count !== undefined && count > 0) || (loadPercent !== undefined && loadPercent > 0) || reasonType === 'PARTIAL' || reasonType === 'CASCADE' || reasonType === 'NORMAL') {
        return {
            lightColor: 'BLUE',
            color: 4, // 4: Blue (Mavi)
            ledColor: 4,
            colorCode: '#007BFF',
            isTwinkle: false,
            lightMode: 'SOLID',
            lightName: 'Mavi Sabit (Kısmi Dolu / Toplama Devam Ediyor)'
        };
    }

    // 7. Yeni Sipariş Açıldığında (Rezerve Göz / Henüz Ürün Atılmamış 0 Adet): SARI (2)
    if (isOrder || reasonType === 'ORDER' || reasonType === 'NEW_ORDER') {
        return {
            lightColor: 'YELLOW',
            color: 2, // 2: Yellow (Sarı)
            ledColor: 2,
            colorCode: '#F59E0B',
            isTwinkle: false,
            lightMode: 'SOLID',
            lightName: 'Sarı Sabit (Yeni Sipariş / Rezerve Göz)'
        };
    }

    // Default: Boş / Beklemede
    return {
        lightColor: 'OFF',
        color: 0,
        ledColor: 0,
        colorCode: '#64748B',
        isTwinkle: false,
        lightMode: 'SOLID',
        lightName: 'Kapalı (Boş / Beklemede)'
    };
}

/**
 * Sends official Section 6.2 mult-led command to HC Robotics Sorter Controller
 * @param {Array<{wallId: string, index: number, color: number, isTwinkle: boolean}>} dataItems 
 */
async function sendMultLedCommand(dataItems) {
    if (!Array.isArray(dataItems) || dataItems.length === 0) return { success: true };
    const sorterApiBase = process.env.HC_SORTER_API_URL || 'http://192.168.1.234';
    const sorterPort = process.env.HC_SORTER_PORT || '4000';
    const targetUrl = sorterApiBase.includes(':') && sorterApiBase.replace('http://', '').replace('https://', '').includes(':')
        ? `${sorterApiBase}/wms/common/mult-led`
        : `${sorterApiBase}:${sorterPort}/wms/common/mult-led`;

    const payload = {
        systemId: process.env.HC_SORTER_SYSTEM_ID || 'M145',
        data: dataItems
    };

    try {
        const res = await fetch(targetUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(3000)
        });
        const json = await res.json();
        console.log(`[SORTER LED 6.2] Sent ${dataItems.length} LED points to ${targetUrl} -> Response:`, json);
        return json;
    } catch (err) {
        console.error(`[SORTER LED 6.2] Failed to send mult-led to ${targetUrl}:`, err.message);
        return { success: false, error: err.message };
    }
}

function normalizeSize(sz) {
    if (!sz) return '';
    const s = String(sz).toUpperCase().trim();
    if (s === '2XL') return 'XXL';
    if (s === '3XL') return 'XXXL';
    if (s === '4XL') return 'XXXXL';
    return s;
}

function extractSizeFromBarcode(barcode, prefix) {
    if (!barcode) return null;
    const b = barcode.toUpperCase().trim();
    const p = (prefix || '').toUpperCase().trim();
    if (p && b.startsWith(p)) {
        const remaining = b.substring(p.length).replace(/[-_#/]CH\d+$/i, '').trim();
        if (remaining) return normalizeSize(remaining);
    }
    const match = b.match(/(?:[-_#/]?)((?:[2-9]?X[SL]|XXXL|XXL|XL|XS|[SML])|\b\d{2}(?:\.5)?)$/i);
    return match ? normalizeSize(match[1]) : null;
}

function extractChuteFromBarcode(barcode) {
    if (!barcode) return null;
    const match = barcode.match(/(?:[-_#/]CH|\bCH|[-_#/]GOZ|\bGOZ)(\d{1,2})$/i);
    return match ? parseInt(match[1], 10) : null;
}

/**
 * Match a scanned barcode / SKU / EPC against actively allocated personnel garments with 100% size and chute fidelity
 */
async function matchPersonnelForGarment(cleanBarcode, sku) {
    if (!cleanBarcode && !sku) return null;
    const scan = String(cleanBarcode || sku).trim();
    if (!scan) return null;

    try {
        const scanUpper = scan.toUpperCase();
        const explicitChute = extractChuteFromBarcode(scanUpper);

        // 1. Direct EPC in rfid_tags (RFID Reader - 100% Unique to Person)
        const tagRes = await pool.query(
            `SELECT r.*, p.id as p_id, p.name as p_name, p.service_center as p_service, p.sorter_chute as p_chute
             FROM rfid_tags r
             JOIN personnel p ON (r.order_id = p.id::text)
             WHERE r.epc = $1 AND p.sorter_chute IS NOT NULL
             LIMIT 1`,
            [scan]
        );
        if (tagRes.rows.length > 0) {
            const t = tagRes.rows[0];
            return {
                personnel: { id: t.p_id, name: t.p_name, service_center: t.p_service, sorter_chute: t.p_chute },
                item: { name: t.product_name, part_no: t.sku, size: t.size }
            };
        }

        // 2. Fetch all active personnel assigned to sorter chutes (Ordered by chute number)
        const staffRes = await pool.query(`
            SELECT p.*, sc.item_count, sc.target_capacity 
            FROM personnel p
            JOIN sorter_mappings sm ON sm.chute_no = p.sorter_chute AND sm.match_type = 'PERSONNEL' AND sm.status = 'ACTIVE'
            LEFT JOIN sorter_chute_state sc ON p.sorter_chute = sc.chute_no
            WHERE p.sorter_chute IS NOT NULL
            ORDER BY p.sorter_chute ASC
        `);

        if (staffRes.rows.length === 0) return null;

        // 3. Explicit chute match if embedded in barcode (e.g. PVWB260013L-CH34)
        if (explicitChute) {
            const targetP = staffRes.rows.find(p => p.sorter_chute === explicitChute);
            if (targetP) {
                return {
                    personnel: targetP,
                    item: { name: 'Personel Kıyafeti (Doğrudan Göz Eşleşmeli)', part_no: scanUpper, size: targetP.top_size }
                };
            }
        }

        // Fetch existing dropped items in all active chutes to enforce individual item quotas
        const activeChutes = staffRes.rows.map(r => r.sorter_chute).filter(Boolean);
        const chuteCounts = {};
        const chuteSkuCounts = {};
        activeChutes.forEach(ch => {
            chuteCounts[ch] = { mont: 0, yelek: 0, gomlek: 0, pant: 0, shoe: 0, total: 0 };
            chuteSkuCounts[ch] = {};
        });

        if (activeChutes.length > 0) {
            const droppedRes = await pool.query(`
                SELECT chute_no, sku, barcode, product_name 
                FROM sorter_chute_items 
                WHERE chute_no = ANY($1)
            `, [activeChutes]);

            droppedRes.rows.forEach(item => {
                const c = chuteCounts[item.chute_no];
                if (!c) return;
                const pName = (item.product_name || '').toLowerCase();
                const pSku = (item.sku || '').toUpperCase().trim();
                const pBarcode = (item.barcode || '').toUpperCase().trim();
                if (pSku) {
                    chuteSkuCounts[item.chute_no][pSku] = (chuteSkuCounts[item.chute_no][pSku] || 0) + 1;
                }
                if (pBarcode && pBarcode !== pSku) {
                    chuteSkuCounts[item.chute_no][pBarcode] = (chuteSkuCounts[item.chute_no][pBarcode] || 0) + 1;
                }
                if (pName.includes('mont') || pSku.startsWith('PVWK100102') || pSku.startsWith('PVWK100103') || pSku.startsWith('PVWK100106') || pSku.startsWith('PVWK100107')) {
                    c.mont++;
                } else if (pName.includes('yelek') || pSku.startsWith('PVWK100104') || pSku.startsWith('PVWK100105')) {
                    c.yelek++;
                } else if (pName.includes('gömlek') || pName.includes('gomlek') || pSku.startsWith('PVWB260012') || pSku.startsWith('PVWB260013')) {
                    c.gomlek++;
                } else if (pName.includes('pantolon') || pSku.startsWith('PVWB250007') || pSku.startsWith('PVWB260017')) {
                    c.pant++;
                } else if (pName.includes('ayakkabı') || pName.includes('ayakkabi') || pSku.startsWith('SHOE-') || pSku.startsWith('PVWB260019') || pSku.startsWith('PVWB260018') || pSku.startsWith('PVWB250006')) {
                    c.shoe++;
                }
                c.total++;
            });
        }

        // Fetch master_products row if scan matches barcode/ean13
        let mpRow = null;
        const mpRes = await pool.query(
            `SELECT sku, barcode, ean13, code39, product_name, size, clean_size FROM master_products 
             WHERE barcode = $1 OR ean13 = $1 OR sku = $1 OR code39 = $1 LIMIT 1`,
            [scan]
        );
        if (mpRes.rows.length > 0) {
            mpRow = mpRes.rows[0];
        }

        const mpSkuUpper = mpRow?.sku?.toUpperCase() || '';
        const mpCode39Upper = mpRow?.code39?.toUpperCase() || '';

        // Prioritize candidate staff: Chutes that ALREADY have partial drops for this item/SKU get evaluated first
        // to complete that person's set and prevent items from scattering across different chutes.
        const candidateStaff = [...staffRes.rows].sort((a, b) => {
            const getProgressScore = (p) => {
                let pBundle = p.bundle_items;
                if (typeof pBundle === 'string') {
                    try { pBundle = JSON.parse(pBundle); } catch (e) { pBundle = []; }
                }
                if (Array.isArray(pBundle) && pBundle.length > 0) {
                    for (const it of pBundle) {
                        const itSku = (it.sku || it.part_no || '').toUpperCase().trim();
                        const itBarcode = (it.barcode || it.ean13 || '').trim();
                        if (itSku === scanUpper || mpSkuUpper === itSku || mpCode39Upper === itSku || (itBarcode && (scan === itBarcode || mpRow?.barcode === itBarcode))) {
                            const dropped = (chuteSkuCounts[p.sorter_chute] && (chuteSkuCounts[p.sorter_chute][itSku] || chuteSkuCounts[p.sorter_chute][itBarcode])) || 0;
                            const target = parseInt(it.qty || it.quantity || 1, 10);
                            if (dropped > 0 && dropped < target) return 100;
                            if (dropped >= target) return -1;
                            return 10;
                        }
                    }
                    return 0;
                }
                const c = chuteCounts[p.sorter_chute] || { mont: 0, yelek: 0, gomlek: 0, pant: 0, shoe: 0 };
                if (scanUpper.startsWith('PVWB260012') || scanUpper.startsWith('PVWB260013') || mpSkuUpper.startsWith('PVWB260012') || mpSkuUpper.startsWith('PVWB260013')) {
                    if (c.gomlek === 1) return 100;
                }
                if (scanUpper.startsWith('PVWB250007') || scanUpper.startsWith('PVWB260017') || mpSkuUpper.startsWith('PVWB250007') || mpSkuUpper.startsWith('PVWB260017')) {
                    if (c.pant === 1) return 100;
                }
                return 0;
            };

            const scoreA = getProgressScore(a);
            const scoreB = getProgressScore(b);
            if (scoreB !== scoreA) return scoreB - scoreA;
            return a.sorter_chute - b.sorter_chute;
        });

        for (const p of candidateStaff) {
            let pBundle = p.bundle_items;
            if (typeof pBundle === 'string') {
                try { pBundle = JSON.parse(pBundle); } catch (e) { pBundle = []; }
            }
            const hasCustomBundle = Array.isArray(pBundle) && pBundle.length > 0;
            const targetCapacity = hasCustomBundle 
                ? pBundle.reduce((s, it) => s + (parseInt(it.qty || it.quantity || 1, 10)), 0)
                : (p.target_capacity || 7);

            const isFull = (p.item_count || 0) >= targetCapacity;
            if (isFull) continue;
            const cCounts = chuteCounts[p.sorter_chute] || { mont: 0, yelek: 0, gomlek: 0, pant: 0, shoe: 0, total: 0 };
            if (cCounts.total >= targetCapacity) continue;

            // Custom Bundle (e.g. SCANIA) Matching:
            if (hasCustomBundle) {
                for (const it of pBundle) {
                    const itSkuUpper = (it.sku || it.part_no || '').toUpperCase().trim();
                    const itBarcode = (it.barcode || it.ean13 || '').trim();
                    const itTarget = parseInt(it.qty || it.quantity || 1, 10);

                    const isSkuMatch = itSkuUpper && (scanUpper === itSkuUpper || mpSkuUpper === itSkuUpper || mpCode39Upper === itSkuUpper);
                    const isBarcodeMatch = itBarcode && (scan === itBarcode || mpRow?.barcode === itBarcode || mpRow?.ean13 === itBarcode);

                    if (isSkuMatch || isBarcodeMatch) {
                        const droppedSkuCount = (chuteSkuCounts[p.sorter_chute] && chuteSkuCounts[p.sorter_chute][itSkuUpper]) || 0;
                        if (droppedSkuCount < itTarget) {
                            return {
                                personnel: p,
                                item: {
                                    name: it.name || it.short_name || 'Scania Kıyafeti',
                                    part_no: itSkuUpper,
                                    size: it.size || p.top_size || 'STD'
                                }
                            };
                        }
                    }
                }
                // Custom bundle staff do not use generic Volkswagen clothing rules
                continue;
            }

            const isFemale = (p.gender || '').toLowerCase().includes('kadın') || (p.gender || '').toLowerCase().includes('kadin');
            const montPref = (p.mont_preference || (p.department && p.department.includes('KALIN') ? 'KALIN' : 'İNCE')).toUpperCase();
            const top = normalizeSize(p.top_size || 'L');
            const bottom = String(p.bottom_size || '48').trim();
            const rawShoe = (p.shoe_size || '').toUpperCase().trim();

            const montPrefix = montPref === 'KALIN' ? (isFemale ? 'PVWK100107' : 'PVWK100106') : (isFemale ? 'PVWK100103' : 'PVWK100102');
            const yelekPrefix = isFemale ? 'PVWK100105' : 'PVWK100104';
            const gomlekPrefix = isFemale ? 'PVWB260012' : 'PVWB260013';
            const pantPrefix = isFemale ? 'PVWB250007' : 'PVWB260017';

            const expectedMontSku = `${montPrefix}${top}`;
            const expectedYelekSku = `${yelekPrefix}${top}`;
            const expectedGomlekSku = `${gomlekPrefix}${top}`;
            const expectedPantSku = `${pantPrefix}${bottom}`;

            // A. MONT (Quota: 1) - Strict Gender, Model & Size Check
            if (cCounts.mont < 1 && (scanUpper.startsWith(montPrefix) || mpSkuUpper.startsWith(montPrefix))) {
                const scSz = extractSizeFromBarcode(scanUpper, montPrefix) || normalizeSize(mpRow?.clean_size || mpRow?.size);
                if (!scSz || scSz === top) {
                    return { personnel: p, item: { name: `Servis Danışman Montu (${montPref})`, part_no: expectedMontSku, size: top } };
                }
            }

            // B. YELEK (Quota: 1) - Strict Gender & Size Check
            if (cCounts.yelek < 1 && (scanUpper.startsWith(yelekPrefix) || mpSkuUpper.startsWith(yelekPrefix))) {
                const scSz = extractSizeFromBarcode(scanUpper, yelekPrefix) || normalizeSize(mpRow?.clean_size || mpRow?.size);
                if (!scSz || scSz === top) {
                    return { personnel: p, item: { name: 'Servis Danışman Yelek', part_no: expectedYelekSku, size: top } };
                }
            }

            // C. GÖMLEK (Quota: 2) - STRICT GENDER & SIZE CHECK (Never swap S with XXL!)
            if (cCounts.gomlek < 2 && (scanUpper.startsWith(gomlekPrefix) || mpSkuUpper.startsWith(gomlekPrefix))) {
                const scSz = extractSizeFromBarcode(scanUpper, gomlekPrefix) || normalizeSize(mpRow?.clean_size || mpRow?.size);
                if (scSz) {
                    if (scSz === top) {
                        return { personnel: p, item: { name: 'Servis Danışman Gömlek', part_no: expectedGomlekSku, size: top } };
                    }
                } else {
                    // Only match un-sized barcodes if ALL candidate personnel needing this garment share the exact same size
                    const candidatesNeeding = staffRes.rows.filter(st => {
                        const stIsFem = (st.gender || '').toLowerCase().includes('kadın') || (st.gender || '').toLowerCase().includes('kadin');
                        if (stIsFem !== isFemale) return false;
                        const stCounts = chuteCounts[st.sorter_chute] || { gomlek: 0 };
                        return stCounts.gomlek < 2;
                    });
                    const distinctSizes = [...new Set(candidatesNeeding.map(st => normalizeSize(st.top_size || 'L')))];
                    if (distinctSizes.length === 1 && distinctSizes[0] === top) {
                        return { personnel: p, item: { name: 'Servis Danışman Gömlek', part_no: expectedGomlekSku, size: top } };
                    }
                }
            }

            // D. PANTOLON (Quota: 2) - Strict Gender & Waist Size Check
            if (cCounts.pant < 2 && (scanUpper.startsWith(pantPrefix) || mpSkuUpper.startsWith(pantPrefix))) {
                const scSz = extractSizeFromBarcode(scanUpper, pantPrefix) || String(mpRow?.clean_size || mpRow?.size || '').trim();
                if (!scSz || scSz === bottom) {
                    return { personnel: p, item: { name: 'Servis Danışman Pantolon', part_no: expectedPantSku, size: bottom } };
                }
            }

            // E. AYAKKABI (Quota: 1) - Strict Shoe Size Check
            if (cCounts.shoe < 1 && rawShoe) {
                const cleanShoeNum = rawShoe.replace(/\D/g, '');
                const scanClean = scanUpper.replace(/\D/g, '');
                if (scanUpper === rawShoe || mpSkuUpper === rawShoe || (cleanShoeNum && scanClean.endsWith(cleanShoeNum))) {
                    return { personnel: p, item: { name: `Servis Danışman Ayakkabı (${rawShoe})`, part_no: rawShoe, size: rawShoe } };
                }
            }
        }
    } catch (e) {
        console.error('[SORTER ENGINE] matchPersonnelForGarment error:', e.message);
    }
    return null;
}

/**
 * CORE ROUTING ALGORITHM (Executes active profile logic)
 */
async function resolveDestinationChute(params = {}) {
    const cleanBarcode = String(params.cleanBarcode || params.barcode || '').trim();
    const destination = String(params.destination || '').trim();
    const brand = String(params.brand || '').trim();
    const productName = String(params.productName || params.product_name || '').trim();
    const size = String(params.size || '').trim();
    const sku = String(params.sku || '').trim();
    const orderNumber = String(params.orderNumber || params.order_number || '').trim();

    const profile = await getActiveProfile();
    const settings = await getSorterSettings();
    const defaultCapacity = parseInt(settings.max_chute_capacity || '25', 10);
    
    // Asansör Arkası Hata/Tanımsız Kontrol Gözleri: A2-1 (61), A2-2 (62), A2-3 (63)
    const errorChutesList = [61, 62, 63];
    let selectedErrorChute = 61; // Default to A2-1

    try {
        const errStateRes = await pool.query(
            `SELECT chute_no, item_count, target_capacity FROM sorter_chute_state WHERE chute_no = ANY($1)`,
            [errorChutesList]
        );
        const errStateMap = {};
        errStateRes.rows.forEach(r => { errStateMap[r.chute_no] = r; });

        for (const ech of errorChutesList) {
            const st = errStateMap[ech] || { item_count: 0, target_capacity: defaultCapacity };
            const cap = st.target_capacity || defaultCapacity;
            if (st.item_count < cap) {
                selectedErrorChute = ech;
                break;
            }
        }
    } catch (e) {
        console.error('[SORTER ENGINE] Error resolving error chute cascade:', e.message);
    }

    console.log(`[SORTER ENGINE] 🧭 Routing Query | Profile: [${profile}] | Dest: "${destination}" | Brand: "${brand}" | Product: "${productName}" | Barcode: "${cleanBarcode}"`);

    // Fetch product details from master_products by scanned barcode or sku (authoritative catalog source)
    let mpProduct = null;
    if (cleanBarcode || sku) {
        try {
            const mpRes = await pool.query(
                `SELECT sku, barcode, ean13, code39, product_name, size, clean_size, brand, grup, gender 
                 FROM master_products 
                 WHERE barcode = $1 OR ean13 = $1 OR sku = $1 OR code39 = $1 
                 ORDER BY (CASE WHEN brand = 'NISSAN' AND sku = barcode THEN 0 ELSE 1 END), id ASC LIMIT 1`,
                [cleanBarcode || sku]
            );
            if (mpRes.rows.length > 0) {
                mpProduct = mpRes.rows[0];
            }
        } catch (_) {}
    }

    // Fetch all active mappings
    const mappingsRes = await pool.query('SELECT * FROM sorter_mappings ORDER BY priority ASC, id ASC');
    const mappings = mappingsRes.rows;

    let targetChute = selectedErrorChute;
    let routingReason = `Hatalı / Tanımsız Ürün -> Asansör Arkası Kontrol Gözü: ${chToPhysicalMap[selectedErrorChute] || selectedErrorChute}`;

    // -------------------------------------------------------------
    // PRIORITY 0: DOĞRUDAN BARKOD GÖZ EŞLEŞMESİ (EXPLICIT CHUTE MATCH - e.g. PVWB260013L-CH34)
    // -------------------------------------------------------------
    const explicitChute = extractChuteFromBarcode(cleanBarcode);
    if (explicitChute && explicitChute >= 1 && explicitChute <= 63) {
        targetChute = explicitChute;
        routingReason = `Doğrudan Barkod Göz Eşleşmesi (-CH${explicitChute}) -> Göz: ${chToPhysicalMap[targetChute] || targetChute}`;
        const stRes = await pool.query(`SELECT item_count, target_capacity FROM sorter_chute_state WHERE chute_no = $1`, [targetChute]);
        const cSt = stRes.rows[0] || { item_count: 0, target_capacity: defaultCapacity };
        const cap = cSt.target_capacity || defaultCapacity;
        const isFull = (cSt.item_count + 1) >= cap;
        const loadPct = Math.round(((cSt.item_count + 1) / cap) * 100);
        const lightInfo = resolveLightStripColor(targetChute, 'ORDER', { isFull, loadPercent: loadPct, isOrder: true, isError: false });
        console.log(`[SORTER ENGINE] 🏷️ Explicit Chute Match (-CH${explicitChute}) -> Chute ${targetChute}`);
        return {
            chuteNo: targetChute,
            physicalCode: chToPhysicalMap[targetChute] || `CH-${targetChute.toString().padStart(2, '0')}`,
            profile: 'PROFILE_EXPLICIT_CHUTE',
            reason: routingReason,
            lightColor: lightInfo.lightColor,
            color: lightInfo.color,
            ledColor: lightInfo.ledColor,
            lightMode: lightInfo.lightMode,
            colorCode: lightInfo.colorCode,
            lightName: lightInfo.lightName
        };
    }

    // -------------------------------------------------------------
    // PRIORITY 0: SİPARİŞ NUMARASI REZERVASYON EŞLEŞTİRMESİ (ORDER MATCH)
    // -------------------------------------------------------------
    let orderStr = orderNumber ? String(orderNumber).trim() : null;
    let orderMappings = mappings.filter(m => {
        if (m.match_type === 'ORDER') {
            if (orderStr && (m.destination_name.includes(orderStr) || m.destination_name.includes(`#${orderStr}`))) return true;
            if (destination && destination !== 'Unassigned Stock' && destination !== 'Unknown Chute' && (destination.includes(m.destination_name) || m.destination_name.includes(destination))) return true;
        }
        return false;
    });

    // If orderMappings not found yet, check if cleanBarcode or sku matches any active reserved order in database
    if (orderMappings.length === 0 && (cleanBarcode || sku)) {
        try {
            const allOrderMappings = mappings.filter(m => m.match_type === 'ORDER');
            for (const om of allOrderMappings) {
                const mMatch = om.destination_name.match(/#(\d+)/);
                if (mMatch) {
                    const cOrderNum = mMatch[1];
                    const cleanBase = (cleanBarcode || sku).replace(/(?:XS|XXS|S|M|L|XL|XXL|3XL|4XL|5XL|6XL|7XL|8XL|9XL|\d{2})$/i, '');
                    
                    // 1. Direct match on orders table
                    const oCheck = await pool.query(
                        `SELECT order_number, sub_customer_name FROM orders 
                         WHERE order_number = $1 
                           AND (sku ILIKE $2 OR code39 ILIKE $2 OR notes ILIKE $2 OR barcode = $3 OR ean13 = $3) LIMIT 1`,
                        [cOrderNum, `%${cleanBase}%`, cleanBarcode]
                    );
                    if (oCheck.rows.length > 0) {
                        orderStr = cOrderNum;
                        orderMappings = allOrderMappings.filter(m => m.destination_name.includes(cOrderNum) || m.destination_name.includes(`#${cOrderNum}`));
                        break;
                    }

                    // 2. Check vouchers table for this order
                    const vCheck = await pool.query(
                        `SELECT order_id FROM vouchers 
                         WHERE order_id::text = $1 AND (barcode = $2 OR sku = $2 OR ean13 = $2) LIMIT 1`,
                        [cOrderNum, cleanBarcode]
                    );
                    if (vCheck.rows.length > 0) {
                        orderStr = cOrderNum;
                        orderMappings = allOrderMappings.filter(m => m.destination_name.includes(cOrderNum) || m.destination_name.includes(`#${cOrderNum}`));
                        break;
                    }

                    // 3. Match via master_products model group for variant barcodes
                    if (mpProduct) {
                        const oModelCheck = await pool.query(
                            `SELECT o.order_number, o.sub_customer_name, mp.product_name as order_mp_title
                             FROM orders o
                             LEFT JOIN master_products mp ON (mp.barcode = o.barcode OR mp.sku = o.barcode)
                             WHERE o.order_number = $1
                             LIMIT 1`,
                            [cOrderNum]
                        );
                        if (oModelCheck.rows.length > 0) {
                            const oRow = oModelCheck.rows[0];
                            const orderTitle = (oRow.order_mp_title || '').replace(/\s+(4XL|3XL|2XL|XL|L|M|S|XS|\d{2})$/i, '').trim().toUpperCase();
                            const scannedTitle = (mpProduct.product_name || '').replace(/\s+(4XL|3XL|2XL|XL|L|M|S|XS|\d{2})$/i, '').trim().toUpperCase();
                            if (orderTitle && scannedTitle && (orderTitle === scannedTitle || orderTitle.includes(scannedTitle) || scannedTitle.includes(orderTitle))) {
                                orderStr = cOrderNum;
                                orderMappings = allOrderMappings.filter(m => m.destination_name.includes(cOrderNum) || m.destination_name.includes(`#${cOrderNum}`));
                                break;
                            }
                        }
                    }
                }
            }
        } catch (e) {
            console.error('[SORTER ENGINE] Error in auto order mapping fallback:', e.message);
        }
    }

    if (orderMappings.length > 0) {
        // -------------------------------------------------------------
        // BEDEN BAZLI AYRIŞTIRMA (SIZE-SPECIFIC CHUTE SPLITTING)
        // -------------------------------------------------------------
        let effectiveSize = (size || '').trim().toUpperCase();
        if (!effectiveSize || effectiveSize === 'STD' || effectiveSize === 'STANDART') {
            // Priority 1: Check master_products (Authoritative catalog resolution)
            if (mpProduct && (mpProduct.clean_size || mpProduct.size)) {
                effectiveSize = String(mpProduct.clean_size || mpProduct.size).trim().toUpperCase();
            } else {
                try {
                    if (cleanBarcode) {
                        // Priority 2: Vouchers
                        const vSizeRes = await pool.query(
                            `SELECT size FROM vouchers WHERE barcode = $1 OR sku = $1 LIMIT 1`,
                            [cleanBarcode]
                        );
                        if (vSizeRes.rows.length > 0 && vSizeRes.rows[0].size) {
                            effectiveSize = String(vSizeRes.rows[0].size).trim().toUpperCase();
                        } else {
                            // Priority 3: RFID Tags
                            const tSizeRes = await pool.query(
                                `SELECT size FROM rfid_tags WHERE barcode = $1 OR epc = $1 LIMIT 1`,
                                [cleanBarcode]
                            );
                            if (tSizeRes.rows.length > 0 && tSizeRes.rows[0].size) {
                                effectiveSize = String(tSizeRes.rows[0].size).trim().toUpperCase();
                            }
                        }
                    }
                } catch (_) {}
            }
        }

        const sizeMappings = orderMappings.filter(m => m.size || (m.destination_name && m.destination_name.includes('Beden:')));
        let isSizeFiltered = false;
        if (sizeMappings.length > 0 && effectiveSize) {
            const matchedSizeList = sizeMappings.filter(m => {
                const mSize = (m.size || '').trim().toUpperCase();
                if (mSize && (mSize === effectiveSize || effectiveSize.includes(mSize) || mSize.includes(effectiveSize))) return true;
                if (m.destination_name && (
                    m.destination_name.toUpperCase().includes(`BEDEN: ${effectiveSize}`) ||
                    m.destination_name.toUpperCase().includes(`[${effectiveSize}]`)
                )) return true;
                return false;
            });
            if (matchedSizeList.length > 0) {
                orderMappings = matchedSizeList;
                isSizeFiltered = true;
            }
        }

        orderMappings.sort((a, b) => (a.priority || 1) - (b.priority || 1));
        const chuteNos = orderMappings.map(m => m.chute_no);
        const chuteStateRes = await pool.query(
            `SELECT chute_no, item_count, target_capacity FROM sorter_chute_state WHERE chute_no = ANY($1)`,
            [chuteNos]
        );
        const stateMap = {};
        chuteStateRes.rows.forEach(r => { stateMap[r.chute_no] = r; });

        let selected = null;
        let selectedPriority = 1;
        for (const om of orderMappings) {
            const state = stateMap[om.chute_no] || { item_count: 0, target_capacity: defaultCapacity };
            const cap = om.target_capacity || state.target_capacity || defaultCapacity;
            if (state.item_count < cap) {
                selected = om.chute_no;
                selectedPriority = om.priority || 1;
                routingReason = isSizeFiltered
                    ? `Sipariş #${orderStr || destination} [Beden: ${effectiveSize}] -> Göz: ${chToPhysicalMap[selected] || selected} (Kaskad #${selectedPriority}, ${state.item_count + 1}/${cap} Adet)`
                    : `Sipariş #${orderStr || destination} Rezervasyonu -> Göz: ${chToPhysicalMap[selected] || selected} (Kaskad #${selectedPriority}, ${state.item_count + 1}/${cap} Adet)`;
                break;
            }
        }

        if (!selected) {
            const lastChute = orderMappings[orderMappings.length - 1];
            selected = lastChute.chute_no;
            routingReason = isSizeFiltered
                ? `Sipariş #${orderStr || destination} [Beden: ${effectiveSize}] TÜM REZERVE GÖZLER DOLDU! Son göze yönlendirildi: ${chToPhysicalMap[selected] || selected}`
                : `Sipariş #${orderStr || destination} TÜM REZERVE GÖZLER DOLDU! Son göze yönlendirildi: ${chToPhysicalMap[selected] || selected}`;
        }

        targetChute = selected;
        const selectedState = stateMap[selected] || { item_count: 0, target_capacity: defaultCapacity };
        const selectedCap = selectedState.target_capacity || defaultCapacity;
        const isSelectedFull = (selectedState.item_count + 1) >= selectedCap;
        const selectedLoadPct = Math.round(((selectedState.item_count + 1) / selectedCap) * 100);

        const lightInfo = resolveLightStripColor(targetChute, 'ORDER', {
            isFull: isSelectedFull,
            loadPercent: selectedLoadPct,
            isOrder: true,
            isError: false
        });

        console.log(`[SORTER ENGINE] 🎯 Routing Decision (Order Reservation) -> Chute ${targetChute} (${chToPhysicalMap[targetChute] || targetChute}) | LED Strip: ${lightInfo.lightColor} (${lightInfo.lightName}) | Reason: ${routingReason}`);
        return {
            chuteNo: targetChute,
            physicalCode: chToPhysicalMap[targetChute] || `CH-${targetChute.toString().padStart(2, '0')}`,
            profile: profile,
            reason: routingReason,
            lightColor: lightInfo.lightColor,
            color: lightInfo.color,
            ledColor: lightInfo.ledColor,
            lightMode: lightInfo.lightMode,
            colorCode: lightInfo.colorCode,
            lightName: lightInfo.lightName
        };
    }

    // -------------------------------------------------------------
    // PRIORITY 1: PERSONEL BAZLI SİPARİŞ & AYRIŞTIRMA (PERSONNEL MATCH)
    // -------------------------------------------------------------
    const personnelMappings = mappings.filter(m => m.match_type === 'PERSONNEL');
    if (personnelMappings.length > 0) {
        let pMatch = null;
        const targetStaff = String(params.targetStaff || params.staffName || params.staff_name || params.personnelName || '').trim().toLowerCase();
        
        // A. Direct staff name passed
        if (targetStaff) {
            pMatch = personnelMappings.find(m => 
                (m.destination_name || '').toLowerCase().includes(targetStaff) ||
                targetStaff.includes((m.destination_name || '').toLowerCase())
            );
        }

        // B. Destination contains staff name
        if (!pMatch && destination && destination !== 'Unassigned Stock' && destination !== 'Unknown Chute') {
            const destLower = destination.toLowerCase();
            pMatch = personnelMappings.find(m => 
                (m.destination_name || '').toLowerCase().includes(destLower) ||
                destLower.includes((m.destination_name || '').toLowerCase())
            );
        }

        // C. Barcode / SKU matches personnel clothing attributes (Mont, Yelek, Gömlek, Pantolon, Ayakkabı, RFID)
        if (!pMatch && (cleanBarcode || sku)) {
            const pmGarment = await matchPersonnelForGarment(cleanBarcode, sku);
            if (pmGarment) {
                pMatch = personnelMappings.find(m => m.chute_no === pmGarment.personnel.sorter_chute);
                if (pMatch) {
                    routingReason = `Personel Bazlı Sipariş -> ${pMatch.destination_name} [${pmGarment.item.name}] (Göz: ${chToPhysicalMap[pMatch.chute_no] || pMatch.chute_no})`;
                }
            }
        }

        if (pMatch) {
            targetChute = pMatch.chute_no;
            routingReason = `Personel Bazlı Sipariş -> ${pMatch.destination_name} (Göz: ${chToPhysicalMap[targetChute] || targetChute})`;
            
            const pStateRes = await pool.query(`SELECT item_count, target_capacity FROM sorter_chute_state WHERE chute_no = $1`, [targetChute]);
            const pState = pStateRes.rows[0] || { item_count: 0, target_capacity: 7 };
            const pCap = pMatch.target_capacity || pState.target_capacity || 7;
            const isFull = (pState.item_count + 1) >= pCap;
            const pLoadPct = Math.round(((pState.item_count + 1) / pCap) * 100);

            const lightInfo = resolveLightStripColor(targetChute, 'ORDER', {
                isFull,
                loadPercent: pLoadPct,
                isOrder: true,
                isError: false
            });

            console.log(`[SORTER ENGINE] 👤 Personnel Match -> Chute ${targetChute} (${pMatch.destination_name}) | LED: ${lightInfo.lightColor}`);
            return {
                chuteNo: targetChute,
                physicalCode: chToPhysicalMap[targetChute] || `CH-${targetChute.toString().padStart(2, '0')}`,
                profile: 'PROFILE_PERSONNEL',
                reason: routingReason,
                lightColor: lightInfo.lightColor,
                color: lightInfo.color,
                ledColor: lightInfo.ledColor,
                lightMode: lightInfo.lightMode,
                colorCode: lightInfo.colorCode,
                lightName: lightInfo.lightName
            };
        }
    }

    // -------------------------------------------------------------
    // PROFILE 1: STANDART MARKA / BAYİ MODU (BRAND_DEALER)
    // -------------------------------------------------------------
    if (profile === 'PROFILE_BRAND_DEALER') {
        const match = mappings.find(m => 
            (m.destination_name && (
                destination.toLowerCase().includes(m.destination_name.toLowerCase()) ||
                m.destination_name.toLowerCase().includes(destination.toLowerCase()) ||
                (brand && brand.toLowerCase() === m.destination_name.toLowerCase())
            ))
        );
        if (match) {
            targetChute = match.chute_no;
            routingReason = `Brand/Dealer direct match: ${match.destination_name}`;
        }
    }

    // -------------------------------------------------------------
    // PROFILE 2: OTOMATİK KASKAD TAŞMA MODU (CASCADE_OVERFLOW)
    // -------------------------------------------------------------
    else if (profile === 'PROFILE_CASCADE_OVERFLOW') {
        // Find all chutes assigned to this destination/brand
        const matchingChutes = mappings.filter(m => 
            (m.destination_name && (
                destination.toLowerCase().includes(m.destination_name.toLowerCase()) ||
                m.destination_name.toLowerCase().includes(destination.toLowerCase()) ||
                (brand && brand.toLowerCase() === m.destination_name.toLowerCase())
            ))
        );

        if (matchingChutes.length > 0) {
            // Check state of each chute in priority order
            const chuteStateRes = await pool.query(
                `SELECT chute_no, item_count, target_capacity FROM sorter_chute_state WHERE chute_no = ANY($1) ORDER BY chute_no ASC`,
                [matchingChutes.map(m => m.chute_no)]
            );
            const stateMap = {};
            chuteStateRes.rows.forEach(r => { stateMap[r.chute_no] = r; });

            let selected = null;
            for (const ch of matchingChutes) {
                const state = stateMap[ch.chute_no] || { item_count: 0, target_capacity: defaultCapacity };
                const cap = ch.target_capacity || state.target_capacity || defaultCapacity;
                if (state.item_count < cap) {
                    selected = ch.chute_no;
                    routingReason = `Cascade selected primary available chute: ${ch.chute_no} (${state.item_count}/${cap})`;
                    break;
                }
            }

            if (!selected) {
                // All assigned chutes are full! Overflow to the last chute or error chute
                selected = matchingChutes[matchingChutes.length - 1].chute_no;
                routingReason = `Cascade all assigned chutes full! Overflowed to last chute: ${selected}`;
            }
            targetChute = selected;
        }
    }

    // -------------------------------------------------------------
    // PROFILE 3: ÜRÜN MODELİ & BEDEN MODU (PRODUCT_SIZE_SPLIT)
    // -------------------------------------------------------------
    else if (profile === 'PROFILE_PRODUCT_SIZE_SPLIT') {
        // 1. Look for exact product name / model / size in mapping
        const fullItemText = `${productName || ''} ${sku || ''} ${size || ''}`.toLowerCase();
        const productMatch = mappings.find(m => 
            m.destination_name && fullItemText.includes(m.destination_name.toLowerCase())
        );

        if (productMatch) {
            targetChute = productMatch.chute_no;
            routingReason = `Product/Size model match: ${productMatch.destination_name}`;
        } else {
            // Fallback to dealer/brand match
            const dealerMatch = mappings.find(m => 
                m.destination_name && destination.toLowerCase().includes(m.destination_name.toLowerCase())
            );
            if (dealerMatch) {
                targetChute = dealerMatch.chute_no;
                routingReason = `Product fallback to dealer match: ${dealerMatch.destination_name}`;
            }
        }
    }

    // -------------------------------------------------------------
    // PROFILE 4: DİNAMİK KOLİ PAKETLEME (DYNAMIC_PACKING)
    // -------------------------------------------------------------
    else if (profile === 'PROFILE_DYNAMIC_PACKING') {
        const match = mappings.find(m => 
            m.destination_name && (
                destination.toLowerCase().includes(m.destination_name.toLowerCase()) ||
                (brand && brand.toLowerCase() === m.destination_name.toLowerCase())
            )
        );

        if (match) {
            targetChute = match.chute_no;
            const stateRes = await pool.query(`SELECT item_count, target_capacity FROM sorter_chute_state WHERE chute_no = $1`, [targetChute]);
            const count = stateRes.rows.length > 0 ? stateRes.rows[0].item_count : 0;
            const cap = stateRes.rows.length > 0 ? (stateRes.rows[0].target_capacity || defaultCapacity) : defaultCapacity;

            routingReason = `Dynamic Packing chute: ${targetChute} (${count + 1}/${cap} Items)`;
            if (count + 1 >= cap) {
                console.log(`[SORTER ENGINE] 📦 CHUTE ${targetChute} REACHED FULL CAPACITY (${cap}). Box packing complete!`);
            }
        }
    }

    // -------------------------------------------------------------
    // PROFILE 5: AKILLI HİBRİT MOD (SMART_HYBRID)
    // -------------------------------------------------------------
    else if (profile === 'PROFILE_SMART_HYBRID') {
        const fullItemText = `${productName || ''} ${sku || ''} ${size || ''}`.toLowerCase();
        
        // 1. Try Product/Size specific chute first
        const productMatches = mappings.filter(m => 
            m.destination_name && fullItemText.includes(m.destination_name.toLowerCase())
        );

        if (productMatches.length > 0) {
            targetChute = productMatches[0].chute_no;
            routingReason = `Hybrid matched specific product: ${productMatches[0].destination_name}`;
        } else {
            // 2. Try Dealer/Brand with cascade overflow
            const matchingChutes = mappings.filter(m => 
                m.destination_name && (
                    destination.toLowerCase().includes(m.destination_name.toLowerCase()) ||
                    (brand && brand.toLowerCase() === m.destination_name.toLowerCase())
                )
            );

            if (matchingChutes.length > 0) {
                const chuteStateRes = await pool.query(
                    `SELECT chute_no, item_count, target_capacity FROM sorter_chute_state WHERE chute_no = ANY($1)`,
                    [matchingChutes.map(m => m.chute_no)]
                );
                const stateMap = {};
                chuteStateRes.rows.forEach(r => { stateMap[r.chute_no] = r; });

                let selected = matchingChutes[0].chute_no;
                for (const ch of matchingChutes) {
                    const state = stateMap[ch.chute_no] || { item_count: 0, target_capacity: defaultCapacity };
                    if (state.item_count < (ch.target_capacity || defaultCapacity)) {
                        selected = ch.chute_no;
                        break;
                    }
                }
                targetChute = selected;
                routingReason = `Hybrid matched brand with cascade: ${selected}`;
            }
        }
    }

    // Update chute state preview in DB
    try {
        await pool.query(`
            UPDATE sorter_chute_state
            SET assigned_destination = $2, last_barcode = $3, last_sku = $4, last_product_name = $5, updated_at = CURRENT_TIMESTAMP
            WHERE chute_no = $1;
        `, [targetChute, destination, cleanBarcode, sku || '', productName || '']);
    } catch (err) {
        console.error('[SORTER ENGINE] Error updating chute state preview:', err.message);
    }

    // Determine LED Strip Color for the selected chute
    const isError = (targetChute >= 61 && targetChute <= 63) || destination === 'Unknown Chute' || destination === 'Unassigned Stock';
    let targetCount = 0;
    let targetCap = defaultCapacity;
    try {
        const cRes = await pool.query(`SELECT item_count, target_capacity FROM sorter_chute_state WHERE chute_no = $1`, [targetChute]);
        if (cRes.rows.length > 0) {
            targetCount = cRes.rows[0].item_count || 0;
            targetCap = cRes.rows[0].target_capacity || defaultCapacity;
        }
    } catch (_) {}

    const isFull = (targetCount + 1) >= targetCap;
    const loadPercent = Math.round(((targetCount + 1) / targetCap) * 100);

    const lightInfo = resolveLightStripColor(targetChute, isError ? 'ERROR' : (profile === 'PROFILE_CASCADE_OVERFLOW' ? 'CASCADE' : 'NORMAL'), {
        isFull,
        loadPercent,
        isOrder: false,
        isError
    });

    console.log(`[SORTER ENGINE] 🎯 Routing Decision -> Chute ${targetChute} (${chToPhysicalMap[targetChute] || targetChute}) | LED Strip: ${lightInfo.lightColor} (${lightInfo.lightName}) | Reason: ${routingReason}`);

    return {
        chuteNo: targetChute,
        physicalCode: chToPhysicalMap[targetChute] || `CH-${targetChute.toString().padStart(2, '0')}`,
        profile: profile,
        reason: routingReason,
        lightColor: lightInfo.lightColor,
        color: lightInfo.color,
        ledColor: lightInfo.ledColor,
        lightMode: lightInfo.lightMode,
        colorCode: lightInfo.colorCode,
        lightName: lightInfo.lightName
    };
}

/**
 * Called when parcel drops into the chute (mission/finish)
 */
async function recordChuteDrop(chuteNo, barcode, status, meta = {}) {
    const ch = parseInt(chuteNo, 10);
    if (!ch || isNaN(ch)) return;

    let { productName, sku, size, brand, orderNumber } = meta;

    if (!productName && barcode) {
        try {
            const ordRes = await pool.query(
                `SELECT product_name, sku, size, brand, order_number FROM orders WHERE barcode = $1 OR ean13 = $1 OR sku = $1 LIMIT 1`,
                [barcode]
            );
            if (ordRes.rows.length > 0) {
                productName = ordRes.rows[0].product_name;
                sku = ordRes.rows[0].sku;
                size = ordRes.rows[0].size;
                brand = ordRes.rows[0].brand;
                orderNumber = ordRes.rows[0].order_number;
            } else {
                const mpRes = await pool.query(
                    `SELECT product_name, sku, brand FROM master_products WHERE barcode = $1 OR ean13 = $1 OR sku = $1 LIMIT 1`,
                    [barcode]
                );
                if (mpRes.rows.length > 0) {
                    productName = mpRes.rows[0].product_name;
                    sku = mpRes.rows[0].sku;
                    brand = mpRes.rows[0].brand;
                }
            }
        } catch (_) {}
    }

    try {
        await pool.query(`
            UPDATE sorter_chute_state
            SET item_count = item_count + 1,
                status = CASE WHEN item_count + 1 >= target_capacity THEN 'full' ELSE 'active' END,
                last_barcode = $2,
                last_sku = $3,
                last_product_name = $4,
                updated_at = CURRENT_TIMESTAMP
            WHERE chute_no = $1;
        `, [ch, barcode || '', sku || '', productName || '']);

        await pool.query(`
            INSERT INTO sorter_chute_items (chute_no, barcode, sku, product_name, size, brand, order_number, status, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
        `, [ch, barcode || '', sku || '', productName || 'Genel Ürün', size || '', brand || '', orderNumber || '', status || 'DROPPED']);

        console.log(`[SORTER ENGINE] 📥 Drop recorded for Chute ${ch} (${chToPhysicalMap[ch]}): ${productName || barcode}`);

        // Update Chute LED Strip directly upon drop
        const physical = getPlcPhysicalMapping(ch);
        const stateRes = await pool.query(`SELECT item_count, target_capacity FROM sorter_chute_state WHERE chute_no = $1`, [ch]);
        const currentCount = stateRes.rows.length > 0 ? (stateRes.rows[0].item_count || 0) : 1;
        const currentCap = stateRes.rows.length > 0 ? (stateRes.rows[0].target_capacity || 25) : 25;
        const isChuteFull = currentCount >= currentCap;

        // If this chute belongs to an assigned personnel, update personnel status
        try {
            const persRes = await pool.query(
                `SELECT id, name, packing_status FROM personnel WHERE sorter_chute = $1 LIMIT 1`,
                [ch]
            );
            if (persRes.rows.length > 0) {
                const p = persRes.rows[0];
                const isFinished = currentCount >= (currentCap || 7);
                const newStatus = isFinished ? 'PACKED' : 'PACKING';
                await pool.query(
                    `UPDATE personnel 
                     SET packing_status = $1,
                         updated_at = CURRENT_TIMESTAMP 
                     WHERE id = $2`,
                    [newStatus, p.id]
                );
                console.log(`[SORTER ENGINE] 👤 Updated personnel ${p.name} (Chute ${ch}): ${currentCount}/${currentCap || 7} (${newStatus})`);
            }
        } catch (persErr) {
            console.error(`[SORTER ENGINE] Error updating personnel for chute ${ch}:`, persErr.message);
        }

        // User standard: Tamamlanan -> YEŞİL (1), Kısmi Dolu -> MAVİ (4)
        const dropColor = isChuteFull ? 1 : 4;
        sendMultLedCommand([
            { wallId: physical.wallId, index: physical.index, color: dropColor, isTwinkle: false },
            { wallId: physical.wallId, index: -1, color: dropColor, isTwinkle: false }
        ]).catch(() => {});

    } catch (err) {
        console.error(`[SORTER ENGINE] Error recording drop for chute ${ch}:`, err.message);
    }
}

// Map to track live chute optical sensor states
const chuteSensorState = new Map();

/**
 * Optical Full/Overflow Sensor Synchronizer & Automatic LED Recovery Engine
 * Based on HC Robotics Actuator Mode Standard (Section 4.3 search/grid-full & Section 6.2 mult-led)
 */
async function syncSensorStatusAndAutoRecover() {
    const sorterApiBase = process.env.HC_SORTER_API_URL || 'http://192.168.1.234';
    const sorterPort = process.env.HC_SORTER_PORT || '4000';
    const targetUrl = sorterApiBase.includes(':') && sorterApiBase.replace('http://', '').replace('https://', '').includes(':')
        ? `${sorterApiBase}/wms/white/search/grid-full`
        : `${sorterApiBase}:${sorterPort}/wms/white/search/grid-full`;

    try {
        const res = await fetch(targetUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ systemIds: [process.env.HC_SORTER_SYSTEM_ID || 'M145'] }),
            signal: AbortSignal.timeout(2000)
        });
        const json = await res.json();
        if (!json || !json.success || !Array.isArray(json.data) || !json.data[0] || !Array.isArray(json.data[0].grids)) {
            return;
        }

        const grids = json.data[0].grids;
        const stateRows = await pool.query('SELECT chute_no, item_count, target_capacity, status, order_number FROM sorter_chute_state');
        const dbChuteMap = new Map();
        stateRows.rows.forEach(r => dbChuteMap.set(r.chute_no, r));

        for (const g of grids) {
            const chuteNo = getChuteFromPlcMapping(g.wallId, g.indexInWall);
            if (!chuteNo) continue;

            const isSensorBlocked = (g.sensorFull === true);
            const prev = chuteSensorState.get(chuteNo) || { isBlocked: false };

            // 1. SENSOR VIOLATION DETECTED (Product hanging / blocking sensor): MOR (5)
            if (isSensorBlocked && !prev.isBlocked) {
                chuteSensorState.set(chuteNo, { isBlocked: true, lastChanged: Date.now() });
                console.warn(`[SENSOR ALARM] ⚠️ Göz #${chuteNo} (${chToPhysicalMap[chuteNo] || ''}) sensör ihlali tespit edildi! LED MOR (Flaş) yakılıyor...`);

                // Mark chute as sensor_blocked in DB
                await pool.query(`UPDATE sorter_chute_state SET status = 'sensor_blocked', updated_at = CURRENT_TIMESTAMP WHERE chute_no = $1`, [chuteNo]).catch(() => {});

                // Log error
                await pool.query(`
                    INSERT INTO sorter_errors (system_id, error_code, level, device_type, device_id, resolved)
                    VALUES ($1, 'GRID_SENSOR_BLOCKED', 'WARNING', 'grid', $2, FALSE)
                    ON CONFLICT (unique_id) DO UPDATE SET resolved = FALSE, resolved_at = NULL
                `, [process.env.HC_SORTER_SYSTEM_ID || 'M145', `CHUTE_${chuteNo}`]).catch(() => {});

                // Send PURPLE Flash LED Command immediately (Color 5)
                await sendMultLedCommand([
                    { wallId: g.wallId, index: g.indexInWall, color: 5, isTwinkle: true }
                ]);
            }

            // 2. SENSOR VIOLATION CLEARED (Operator straightened product / cleared sensor): ÖNCEKİ RENGİNE DÖN
            else if (!isSensorBlocked && prev.isBlocked) {
                chuteSensorState.set(chuteNo, { isBlocked: false, lastChanged: Date.now() });
                console.log(`[SENSOR RECOVERED] ✅ Göz #${chuteNo} (${chToPhysicalMap[chuteNo] || ''}) sensör ihlali giderildi! LED önceki rengine döndürülüyor...`);

                const dbState = dbChuteMap.get(chuteNo) || {};
                const count = dbState.item_count || 0;
                const capacity = dbState.target_capacity || 25;
                const isFull = count >= capacity;
                const hasOrder = !!dbState.order_number;

                // User rules:
                // Tamamlanan: YEŞİL (1)
                // Kısmi Dolu: MAVİ (4)
                // Yeni Sipariş: SARI (2)
                // Boş: KAPALI (0)
                let normalColor = 0;
                if (isFull) {
                    normalColor = 1; // Yeşil (Tamamlandı)
                } else if (count > 0) {
                    normalColor = 4; // Mavi (Kısmi Dolu)
                } else if (hasOrder) {
                    normalColor = 2; // Sarı (Yeni Sipariş)
                } else {
                    normalColor = 0; // Kapalı / Sönük
                }

                // Restore chute status in DB
                const newStatus = isFull ? 'full' : (count > 0 || hasOrder ? 'active' : 'standby');
                await pool.query(`UPDATE sorter_chute_state SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE chute_no = $2`, [newStatus, chuteNo]).catch(() => {});

                // Resolve error in DB
                await pool.query(`
                    UPDATE sorter_errors
                    SET resolved = TRUE, resolved_at = CURRENT_TIMESTAMP
                    WHERE error_code = 'GRID_SENSOR_BLOCKED' AND device_id = $1 AND resolved = FALSE
                `, [`CHUTE_${chuteNo}`]).catch(() => {});

                // Send Restored LED command
                await sendMultLedCommand([
                    { wallId: g.wallId, index: g.indexInWall, color: normalColor, isTwinkle: false }
                ]);
            }
        }
    } catch (err) {
        // Silently skip transient polling errors
    }
}

// Start continuous background sensor monitoring loop (every 2.5 seconds)
let sensorMonitorInterval = null;
function startSensorMonitoring(intervalMs = 2500) {
    if (sensorMonitorInterval) clearInterval(sensorMonitorInterval);
    sensorMonitorInterval = setInterval(syncSensorStatusAndAutoRecover, intervalMs);
    console.log(`[SORTER SENSOR MONITOR] 📡 Otomatik Sensör İhlali Dinleme & LED Kurtarma motoru başlatıldı (${intervalMs}ms).`);
}
startSensorMonitoring(2500);

module.exports = {
    PROFILES,
    chToPhysicalMap,
    getPlcPhysicalMapping,
    getChuteFromPlcMapping,
    getActiveProfile,
    setActiveProfile,
    getSorterSettings,
    updateSorterSettings,
    getChutesStatus,
    getChuteItems,
    resetChute,
    resetAllChutes,
    resolveDestinationChute,
    recordChuteDrop,
    resolveLightStripColor,
    sendMultLedCommand,
    syncSensorStatusAndAutoRecover,
    startSensorMonitoring,
    matchPersonnelForGarment,
    chuteSensorState
};
