import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import API_BASE_URL from '../services/apiConfig';

const AdminDataEntry = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('sales');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);

    // Excel Upload States
    const [excelFile, setExcelFile] = useState(null);
    const [excelBrand, setExcelBrand] = useState('NISSAN');
    const [customExcelBrand, setCustomExcelBrand] = useState('');

    // Master Products Upload States
    const [masterFile, setMasterFile] = useState(null);
    const [masterBrand, setMasterBrand] = useState('NISSAN');
    const [customMasterBrand, setCustomMasterBrand] = useState('');
    const [uploadResult, setUploadResult] = useState(null);

    // Form states
    const [formData, setFormData] = useState({
        order_id: '',
        location: 'Merkez Depo',
        barcode: '',
        ean13: '',
        quantity: '',
        product_name: '',
        color: 'Standart',
        size: 'Standart',
        brand: 'VOG Tekstil'
    });

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/orders/list`);
            const data = await res.json();
            if (data.success) {
                setOrders(data.data);
            }
        } catch (err) {
            console.error('Siparişler çekilemedi:', err);
        }
    };

    const handleOrderChange = (e) => {
        const selectedOrderId = e.target.value;
        const selectedOrder = orders.find(o => o.order_number.toString() === selectedOrderId);
        
        if (selectedOrder) {
            setFormData(prev => ({
                ...prev,
                order_id: selectedOrder.order_number,
                barcode: selectedOrder.ean13 || selectedOrder.sku || `BARCODE-${selectedOrder.order_number}`,
                ean13: selectedOrder.ean13 || '',
                quantity: selectedOrder.quantity || '',
                product_name: selectedOrder.product_name || '',
                brand: selectedOrder.brand || 'VOG Tekstil'
            }));
        } else {
            setFormData(prev => ({ ...prev, order_id: selectedOrderId }));
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const endpoint = activeTab === 'sales' ? '/api/sales/create' : '/api/vouchers/create';
        
        try {
            const res = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            
            if (data.success) {
                alert(activeTab === 'sales' ? t('admin.dataEntry.salesSuccess') : t('admin.dataEntry.vouchersSuccess'));
                // Reset form slightly but keep useful defaults
                setFormData(prev => ({
                    ...prev,
                    order_id: '',
                    barcode: '',
                    ean13: '',
                    quantity: '',
                    product_name: ''
                }));
            } else {
                alert(t('admin.dataEntry.error') + ': ' + data.message);
            }
        } catch (err) {
            console.error(err);
            alert(t('admin.dataEntry.error'));
        } finally {
            setLoading(false);
        }
    };

    const handleExcelUpload = async (e) => {
        e.preventDefault();
        if (!excelFile) return alert('Lütfen bir Excel dosyası seçin.');

        const effectiveBrand = excelBrand === 'CUSTOM' ? (customExcelBrand.trim().toUpperCase() || 'GENEL') : excelBrand;
        if (!effectiveBrand) return alert('Lütfen geçerli bir marka seçin veya girin.');

        setLoading(true);
        const formData = new FormData();
        formData.append('file', excelFile);
        formData.append('brand', effectiveBrand);

        try {
            const res = await fetch(`${API_BASE_URL}/api/orders/import-excel`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            
            if (data.success) {
                alert('Başarılı: ' + data.message);
                setExcelFile(null);
                fetchOrders(); // Refresh orders if needed
            } else {
                alert('Hata: ' + data.message);
            }
        } catch (err) {
            console.error(err);
            alert('Yükleme sırasında beklenmeyen bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const handleMasterProductsUpload = async (e) => {
        e.preventDefault();
        if (!masterFile) return alert('Lütfen yüklemek istediğiniz Master Ürün Kataloğu Excel dosyasını seçin.');

        const effectiveBrand = masterBrand === 'CUSTOM' ? (customMasterBrand.trim().toUpperCase() || 'GENEL') : masterBrand;
        if (!effectiveBrand) return alert('Lütfen geçerli bir marka seçin veya girin.');

        setLoading(true);
        setUploadResult(null);

        const formData = new FormData();
        formData.append('file', masterFile);
        formData.append('brand', effectiveBrand);

        try {
            const res = await fetch(`${API_BASE_URL}/api/products/import-master-excel`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            
            if (data.success) {
                setUploadResult({
                    filename: data.filename || masterFile.name,
                    brand: data.brand || masterBrand,
                    inserted: data.inserted || 0,
                    updated: data.updated || 0,
                    total: data.total || 0,
                    message: data.message
                });
                setMasterFile(null);
            } else {
                alert('Hata: ' + data.message);
            }
        } catch (err) {
            console.error(err);
            alert('Master ürün kataloğu yüklenirken beklenmeyen bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetScans = async () => {
        const effectiveBrand = excelBrand === 'CUSTOM' ? (customExcelBrand.trim().toUpperCase() || 'GENEL') : excelBrand;
        if (!window.confirm(`${effectiveBrand} markasına ait tüm siparişleri ve tünel okuma geçmişini TAMAMEN SİLMEK istediğinize emin misiniz? (Bu işlem geri alınamaz ve ekran tamamen temizlenir!)`)) {
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/orders/reset-scans`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ brand: effectiveBrand })
            });
            const data = await res.json();
            alert(data.success ? 'Başarılı: ' + data.message : 'Hata: ' + data.message);
        } catch (err) {
            console.error(err);
            alert('Sıfırlama sırasında beklenmeyen bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-data-entry-premium" style={{ width: '100%', padding: 'var(--container-pad)', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem', flexWrap: 'wrap', gap: '2rem' }}>
                <div>
                    <button 
                        onClick={() => navigate('/admin')} 
                        className="btn-back-premium"
                        style={{ 
                            background: 'var(--glass)', 
                            border: '1px solid var(--glass-border)', 
                            color: 'var(--text-primary)', 
                            padding: '0.8rem 1.8rem', 
                            borderRadius: '100px', 
                            cursor: 'pointer', 
                            marginBottom: '2rem', 
                            fontSize: '0.75rem', 
                            fontWeight: '950', 
                            letterSpacing: '1.5px',
                            textTransform: 'uppercase',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'var(--transition)'
                        }}
                    >
                        ← {t('admin.reports.goBack')}
                    </button>
                    <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', marginBottom: '0.5rem', color: 'var(--text-primary)', fontWeight: '950', letterSpacing: '-2px', lineHeight: '1' }}>
                        {t('admin.dataEntry.title')}
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: '700', letterSpacing: '0.5px' }}>
                        {t('admin.dataEntry.desc')}
                    </p>
                </div>
            </div>

            <div className="glass-card prism-glass" style={{ padding: '3.5rem', borderRadius: '3.5rem', border: 'var(--card-border)', background: 'var(--card-bg)', boxShadow: 'var(--laminar-shadow)', position: 'relative', overflow: 'hidden' }}>
                
                {/* Tabs */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '3.5rem', background: 'var(--glass)', padding: '0.5rem', borderRadius: '100px', border: '1px solid var(--glass-border)', width: 'fit-content', flexWrap: 'wrap', boxShadow: 'var(--laminar-shadow)' }}>
                    <button 
                        onClick={() => setActiveTab('sales')}
                        style={{
                            background: activeTab === 'sales' ? 'var(--text-primary)' : 'transparent',
                            color: activeTab === 'sales' ? 'var(--midnight)' : 'var(--text-muted)',
                            border: 'none', padding: '0.9rem 2rem', borderRadius: '100px', fontSize: '0.85rem', fontWeight: '950', cursor: 'pointer', transition: 'var(--transition)', letterSpacing: '0.5px'
                        }}
                        className={activeTab === 'sales' ? 'tab-btn-active' : 'tab-btn-inactive'}
                    >
                        💰 {t('admin.dataEntry.tabs.sales')}
                    </button>
                    <button 
                        onClick={() => setActiveTab('vouchers')}
                        style={{
                            background: activeTab === 'vouchers' ? 'var(--text-primary)' : 'transparent',
                            color: activeTab === 'vouchers' ? 'var(--midnight)' : 'var(--text-muted)',
                            border: 'none', padding: '0.9rem 2rem', borderRadius: '100px', fontSize: '0.85rem', fontWeight: '950', cursor: 'pointer', transition: 'var(--transition)', letterSpacing: '0.5px'
                        }}
                        className={activeTab === 'vouchers' ? 'tab-btn-active' : 'tab-btn-inactive'}
                    >
                        📑 {t('admin.dataEntry.tabs.vouchers')}
                    </button>
                    <button 
                        onClick={() => setActiveTab('excel')}
                        style={{
                            background: activeTab === 'excel' ? 'var(--text-primary)' : 'transparent',
                            color: activeTab === 'excel' ? 'var(--midnight)' : 'var(--text-muted)',
                            border: 'none', padding: '0.9rem 2rem', borderRadius: '100px', fontSize: '0.85rem', fontWeight: '950', cursor: 'pointer', transition: 'var(--transition)', letterSpacing: '0.5px'
                        }}
                        className={activeTab === 'excel' ? 'tab-btn-active' : 'tab-btn-inactive'}
                    >
                        📊 Excel Sipariş Yükle
                    </button>
                    <button 
                        onClick={() => setActiveTab('master_products')}
                        style={{
                            background: activeTab === 'master_products' ? 'var(--text-primary)' : 'transparent',
                            color: activeTab === 'master_products' ? 'var(--midnight)' : 'var(--text-muted)',
                            border: 'none', padding: '0.9rem 2rem', borderRadius: '100px', fontSize: '0.85rem', fontWeight: '950', cursor: 'pointer', transition: 'var(--transition)', letterSpacing: '0.5px'
                        }}
                        className={activeTab === 'master_products' ? 'tab-btn-active' : 'tab-btn-inactive'}
                    >
                        📦 Master Ürün Kataloğu (master_products)
                    </button>
                </div>

                {activeTab === 'excel' ? (
                    <form onSubmit={handleExcelUpload} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                        <div>
                            <h2 style={{ fontSize: '1.8rem', marginBottom: '0.8rem', color: 'var(--text-primary)', fontWeight: '950', letterSpacing: '-0.5px' }}>Excel ile Toplu Sipariş Yükleme (Karma Model)</h2>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.6', fontSize: '1rem', fontWeight: '500' }}>
                                Siparişleri içeren Excel dosyasını (.xlsx) yükleyin. Sistem, daha önce tünelden geçen bir ürün varsa yüklemeyi engelleyerek güvenliği sağlar.
                                Henüz tünelden geçmemiş siparişleriniz var ise, bu firmaya ait eski bekleyen kayıtlar tamamen silinir ve Excel'deki yeni veriler tertemiz bir şekilde aktarılır.
                            </p>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-secondary)', fontWeight: '800', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Firma (Marka)</label>
                                <select 
                                    value={excelBrand} 
                                    onChange={(e) => setExcelBrand(e.target.value)}
                                    className="premium-select"
                                    style={{ width: '100%', padding: '1rem 1.2rem', borderRadius: '1.2rem', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--input-color)', fontSize: '1rem', fontWeight: '700', outline: 'none', fontFamily: 'var(--font-main)', transition: 'var(--transition)' }}
                                >
                                    <option value="NISSAN">NISSAN</option>
                                    <option value="VOLKSWAGEN">VOLKSWAGEN (VW)</option>
                                    <option value="SEAT">SEAT</option>
                                    <option value="AUDI">AUDI</option>
                                    <option value="CUPRA">CUPRA</option>
                                    <option value="SKODA">SKODA</option>
                                    <option value="PORSCHE">PORSCHE</option>
                                    <option value="SCANIA">SCANIA</option>
                                    <option value="FORD">FORD</option>
                                    <option value="MAN">MAN</option>
                                    <option value="ZARA">ZARA</option>
                                    <option value="VOG">VOG TEKSTİL</option>
                                    <option value="CUSTOM">➕ DİĞER / YENİ MARKA GİRİŞİ...</option>
                                </select>
                                {excelBrand === 'CUSTOM' && (
                                    <div style={{ marginTop: '0.8rem' }}>
                                        <input 
                                            type="text"
                                            placeholder="Marka Adını Girin (Örn: RENAULT, TOYOTA)"
                                            value={customExcelBrand}
                                            onChange={(e) => setCustomExcelBrand(e.target.value.toUpperCase())}
                                            style={{ width: '100%', padding: '0.8rem 1.2rem', borderRadius: '1.2rem', background: 'var(--input-bg)', border: '1px solid #3b82f6', color: 'var(--input-color)', fontSize: '0.95rem', fontWeight: '800', outline: 'none' }}
                                        />
                                    </div>
                                )}
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-secondary)', fontWeight: '800', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Excel Dosyası Seç</label>
                                <input 
                                    type="file" 
                                    accept=".xlsx, .xls"
                                    onChange={(e) => setExcelFile(e.target.files[0])}
                                    className="premium-file-input"
                                    style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '1.2rem', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--input-color)', fontSize: '0.9rem', outline: 'none', fontFamily: 'var(--font-main)', transition: 'var(--transition)' }}
                                />
                            </div>
                        </div>

                        <div style={{ marginTop: '2rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: 2 }}>
                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    className="btn-action-primary"
                                    style={{ 
                                        width: '100%', padding: '1.2rem 2rem', borderRadius: '1.2rem', border: 'none', 
                                        background: loading ? 'var(--glass)' : 'linear-gradient(135deg, var(--accent) 0%, #6366f1 100%)', 
                                        color: loading ? 'var(--text-muted)' : '#fffffe', 
                                        fontSize: '1.1rem', fontWeight: '950', cursor: loading ? 'not-allowed' : 'pointer', transition: 'var(--transition)',
                                        letterSpacing: '1.5px', textTransform: 'uppercase', boxShadow: 'var(--laminar-shadow)', minWidth: '250px'
                                    }}
                                >
                                    {loading ? 'Yükleniyor...' : 'Siparişi İçeri Aktar ve Sıfırla'}
                                </button>
                                
                                {/* Tooltip Container */}
                                <div className="tooltip-container" style={{ marginLeft: '1rem', cursor: 'help', position: 'relative' }}>
                                    <div style={{ 
                                        width: '32px', height: '32px', borderRadius: '50%', background: 'var(--glass)', 
                                        border: '1px solid var(--accent)', color: 'var(--accent)', 
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                        fontWeight: 'bold', fontSize: '1.2rem' 
                                    }}>
                                        ?
                                    </div>
                                    <div className="tooltip-content" style={{
                                        position: 'absolute', bottom: '120%', left: '50%', transform: 'translateX(-50%)',
                                        width: '320px', background: 'var(--midnight)', color: 'var(--text-primary)',
                                        padding: '1rem', borderRadius: '0.8rem', fontSize: '0.85rem', lineHeight: '1.5',
                                        boxShadow: '0 10px 25px rgba(0,0,0,0.5)', opacity: 0, visibility: 'hidden',
                                        transition: 'all 0.3s ease', zIndex: 100, border: '1px solid var(--glass-border)'
                                    }}>
                                        <strong>Bu işlem ne yapar?</strong><br/><br/>
                                        1. Excel'deki <strong>"PARÇA NO DETAY"</strong> sekmesini okuyarak pozisyonlara göre paket içeriğini belirler.<br/>
                                        2. Diğer sekmelerdeki personelleri okur ve beden/cinsiyet bilgisini şablonla eşleştirip <strong>kişiye özel sipariş satırları</strong> üretir.<br/>
                                        3. Seçili firmanın henüz tünelden geçmemiş (bekleyen) eski siparişlerini çakışmayı önlemek için <strong>siler</strong>.<br/>
                                        4. Yeni kişiselleştirilmiş listeyi RFID tüneli ve etiket sistemi için <strong>veritabanına yükler</strong>.
                                    </div>
                                </div>
                            </div>
                            
                            <button 
                                type="button" 
                                onClick={handleResetScans}
                                disabled={loading}
                                className="btn-action-warning"
                                style={{ 
                                    flex: 1, padding: '1.2rem 2rem', borderRadius: '1.2rem', border: '1px solid var(--color-danger)', 
                                    background: 'var(--color-danger-bg)', 
                                    color: 'var(--color-danger)', 
                                    fontSize: '1rem', fontWeight: '950', cursor: loading ? 'not-allowed' : 'pointer', transition: 'var(--transition)',
                                    letterSpacing: '1px', textTransform: 'uppercase', minWidth: '200px'
                                }}
                            >
                                ⚠️ Tünel Geçmişini İptal Et
                            </button>
                        </div>
                    </form>
                ) : activeTab === 'master_products' ? (
                    <form onSubmit={handleMasterProductsUpload} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                        <div>
                            <h2 style={{ fontSize: '1.8rem', marginBottom: '0.8rem', color: 'var(--text-primary)', fontWeight: '950', letterSpacing: '-0.5px' }}>
                                📦 Master Ürün Kataloğu Yükle (master_products)
                            </h2>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.6', fontSize: '1rem', fontWeight: '500' }}>
                                <strong>SEAT 2025 KIŞ PARÇA KODLARI.XLSX</strong> veya benzeri ana ürün listesi Excel dosyalarını yükleyin.
                                Sistem dosyadaki <strong>Parça No / SKU</strong>, <strong>Ürün Adı</strong>, <strong>Renk</strong>, <strong>Beden</strong> ve <strong>Barkod</strong> bilgilerini otomatik okur.
                                <br />
                                <span style={{ color: '#2563EB', fontWeight: '800' }}>✨ Olmayan ürünleri veritabanına yeni ekler (Insert), var olan ürünlerin bilgilerini günceller (Update).</span>
                            </p>
                        </div>

                        {uploadResult && (
                            <div style={{
                                padding: '2rem 2.2rem',
                                borderRadius: '2rem',
                                background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(16, 185, 129, 0.12))',
                                border: '1px solid rgba(37, 99, 235, 0.3)',
                                backdropFilter: 'blur(20px)',
                                boxShadow: '0 15px 40px rgba(0, 0, 0, 0.2)',
                                transition: 'all 0.3s ease'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{
                                            width: '48px', height: '48px', borderRadius: '100px',
                                            background: 'linear-gradient(135deg, #10B981, #059669)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '1.4rem', boxShadow: '0 8px 20px rgba(16, 185, 129, 0.4)', color: '#ffffff'
                                        }}>
                                            🎉
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '1.3rem', fontWeight: '950', color: 'var(--text-primary)', margin: 0 }}>
                                                Master Ürün Kataloğu Aktarımı Tamamlandı!
                                            </h3>
                                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: '600', margin: '0.2rem 0 0 0' }}>
                                                📄 Dosya: <strong style={{ color: '#2563EB' }}>{uploadResult.filename}</strong> | Firma: <strong style={{ color: '#10B981' }}>{uploadResult.brand}</strong>
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => setUploadResult(null)}
                                        style={{
                                            background: 'var(--glass)', border: '1px solid var(--glass-border)',
                                            color: 'var(--text-muted)', width: '32px', height: '32px', borderRadius: '100px',
                                            fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.2rem', marginTop: '1.2rem' }}>
                                    <div style={{ background: 'var(--card-bg)', padding: '1.2rem 1.5rem', borderRadius: '1.4rem', border: '1px solid var(--glass-border)' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Toplam İşlenen</span>
                                        <div style={{ fontSize: '1.8rem', fontWeight: '950', color: 'var(--text-primary)', marginTop: '0.3rem' }}>
                                            {uploadResult.total.toLocaleString('tr-TR')} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Adet</span>
                                        </div>
                                    </div>

                                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1.2rem 1.5rem', borderRadius: '1.4rem', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                                        <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>✨ Yeni Eklenen (Insert)</span>
                                        <div style={{ fontSize: '1.8rem', fontWeight: '950', color: '#10B981', marginTop: '0.3rem' }}>
                                            {uploadResult.inserted.toLocaleString('tr-TR')} <span style={{ fontSize: '0.9rem', color: '#10B981' }}>Kalem</span>
                                        </div>
                                    </div>

                                    <div style={{ background: 'rgba(37, 99, 235, 0.1)', padding: '1.2rem 1.5rem', borderRadius: '1.4rem', border: '1px solid rgba(37, 99, 235, 0.3)' }}>
                                        <span style={{ fontSize: '0.75rem', color: '#2563EB', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>🔄 Var Olan Güncellenen (Update)</span>
                                        <div style={{ fontSize: '1.8rem', fontWeight: '950', color: '#2563EB', marginTop: '0.3rem' }}>
                                            {uploadResult.updated.toLocaleString('tr-TR')} <span style={{ fontSize: '0.9rem', color: '#2563EB' }}>Kalem</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-secondary)', fontWeight: '800', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Katalog Markası (Brand)</label>
                                <select 
                                    value={masterBrand} 
                                    onChange={(e) => setMasterBrand(e.target.value)}
                                    className="premium-select"
                                    style={{ width: '100%', padding: '1rem 1.2rem', borderRadius: '1.2rem', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--input-color)', fontSize: '1rem', fontWeight: '700', outline: 'none', fontFamily: 'var(--font-main)', transition: 'var(--transition)' }}
                                >
                                    <option value="NISSAN">NISSAN</option>
                                    <option value="VOLKSWAGEN">VOLKSWAGEN (VW)</option>
                                    <option value="SEAT">SEAT</option>
                                    <option value="AUDI">AUDI</option>
                                    <option value="CUPRA">CUPRA</option>
                                    <option value="SKODA">SKODA</option>
                                    <option value="PORSCHE">PORSCHE</option>
                                    <option value="SCANIA">SCANIA</option>
                                    <option value="FORD">FORD</option>
                                    <option value="MAN">MAN</option>
                                    <option value="ZARA">ZARA</option>
                                    <option value="VOG">VOG TEKSTİL</option>
                                    <option value="CUSTOM">➕ DİĞER / YENİ MARKA GİRİŞİ...</option>
                                </select>
                                {masterBrand === 'CUSTOM' && (
                                    <div style={{ marginTop: '0.8rem' }}>
                                        <input 
                                            type="text"
                                            placeholder="Marka Adını Girin (Örn: RENAULT, TOYOTA)"
                                            value={customMasterBrand}
                                            onChange={(e) => setCustomMasterBrand(e.target.value.toUpperCase())}
                                            style={{ width: '100%', padding: '0.8rem 1.2rem', borderRadius: '1.2rem', background: 'var(--input-bg)', border: '1px solid #3b82f6', color: 'var(--input-color)', fontSize: '0.95rem', fontWeight: '800', outline: 'none' }}
                                        />
                                    </div>
                                )}
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-secondary)', fontWeight: '800', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Master Ürün Excel Dosyası (.xlsx / .xls)</label>
                                <input 
                                    type="file" 
                                    accept=".xlsx, .xls, .csv" 
                                    onChange={(e) => setMasterFile(e.target.files[0])}
                                    className="premium-file-input"
                                    style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '1.2rem', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--input-color)', fontSize: '0.95rem', outline: 'none', fontFamily: 'var(--font-main)', transition: 'var(--transition)' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="btn-action-primary"
                                style={{ 
                                    flex: 2, padding: '1.2rem 2.5rem', borderRadius: '1.2rem', border: 'none', 
                                    background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', 
                                    color: '#ffffff', 
                                    fontSize: '1rem', fontWeight: '950', cursor: loading ? 'not-allowed' : 'pointer', transition: 'var(--transition)',
                                    letterSpacing: '1px', textTransform: 'uppercase', boxShadow: '0 10px 25px rgba(37, 99, 235, 0.35)', minWidth: '250px'
                                }}
                            >
                                {loading ? '📦 Ürünler Aktarılıyor & Güncelleniyor...' : '🚀 Master Ürün Kataloğunu Yükle & Güncelle (UPSERT)'}
                            </button>
                        </div>
                    </form>
                ) : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                    
                    {/* Select Order */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-secondary)', fontWeight: '800', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('admin.dataEntry.form.selectOrder')}</label>
                        <select 
                            name="order_id"
                            value={formData.order_id} 
                            onChange={handleOrderChange}
                            className="premium-select"
                            style={{ width: '100%', padding: '1.1rem 1.3rem', borderRadius: '1.2rem', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--input-color)', fontSize: '1.05rem', fontWeight: '700', outline: 'none', transition: 'var(--transition)', fontFamily: 'var(--font-main)' }}
                        >
                            <option value="">{t('admin.dataEntry.form.selectOrderPlaceholder')}</option>
                            {orders.map(o => (
                                <option key={o.id} value={o.order_number}>
                                    #{o.order_number} - {o.product_name} ({o.quantity} {t('admin.dataEntry.form.pcs')})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-secondary)', fontWeight: '800', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('admin.dataEntry.form.barcode')}</label>
                            <input 
                                type="text" name="barcode" value={formData.barcode} onChange={handleChange} required
                                className="premium-input"
                                style={{ width: '100%', padding: '1.1rem 1.3rem', borderRadius: '1.2rem', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--input-color)', fontSize: '1.05rem', fontWeight: '700', outline: 'none', transition: 'var(--transition)', fontFamily: 'var(--font-main)' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-secondary)', fontWeight: '800', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('admin.dataEntry.form.ean13')}</label>
                            <input 
                                type="text" name="ean13" value={formData.ean13} onChange={handleChange} required
                                className="premium-input"
                                style={{ width: '100%', padding: '1.1rem 1.3rem', borderRadius: '1.2rem', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--input-color)', fontSize: '1.05rem', fontWeight: '700', outline: 'none', transition: 'var(--transition)', fontFamily: 'var(--font-main)' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-secondary)', fontWeight: '800', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('admin.dataEntry.form.quantity')}</label>
                            <input 
                                type="number" name="quantity" value={formData.quantity} onChange={handleChange} required
                                className="premium-input"
                                style={{ width: '100%', padding: '1.1rem 1.3rem', borderRadius: '1.2rem', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--input-color)', fontSize: '1.05rem', fontWeight: '700', outline: 'none', transition: 'var(--transition)', fontFamily: 'var(--font-main)' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-secondary)', fontWeight: '800', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('admin.dataEntry.form.location')}</label>
                            <input 
                                type="text" name="location" value={formData.location} onChange={handleChange} required
                                className="premium-input"
                                style={{ width: '100%', padding: '1.1rem 1.3rem', borderRadius: '1.2rem', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--input-color)', fontSize: '1.05rem', fontWeight: '700', outline: 'none', transition: 'var(--transition)', fontFamily: 'var(--font-main)' }}
                            />
                        </div>
                    </div>

                    {/* Additional fields for Vouchers */}
                    {activeTab === 'vouchers' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginTop: '1rem', paddingTop: '2.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-secondary)', fontWeight: '800', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('admin.dataEntry.form.productName')}</label>
                                <input 
                                    type="text" name="product_name" value={formData.product_name} onChange={handleChange} required
                                    className="premium-input"
                                    style={{ width: '100%', padding: '1.1rem 1.3rem', borderRadius: '1.2rem', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--input-color)', fontSize: '1.05rem', fontWeight: '700', outline: 'none', transition: 'var(--transition)', fontFamily: 'var(--font-main)' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-secondary)', fontWeight: '800', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('admin.dataEntry.form.color')}</label>
                                <input 
                                    type="text" name="color" value={formData.color} onChange={handleChange} required
                                    className="premium-input"
                                    style={{ width: '100%', padding: '1.1rem 1.3rem', borderRadius: '1.2rem', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--input-color)', fontSize: '1.05rem', fontWeight: '700', outline: 'none', transition: 'var(--transition)', fontFamily: 'var(--font-main)' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-secondary)', fontWeight: '800', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('admin.dataEntry.form.size')}</label>
                                <input 
                                    type="text" name="size" value={formData.size} onChange={handleChange} required
                                    className="premium-input"
                                    style={{ width: '100%', padding: '1.1rem 1.3rem', borderRadius: '1.2rem', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--input-color)', fontSize: '1.05rem', fontWeight: '700', outline: 'none', transition: 'var(--transition)', fontFamily: 'var(--font-main)' }}
                                />
                            </div>
                        </div>
                    )}

                    <div style={{ marginTop: '2rem' }}>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="btn-action-primary"
                            style={{ 
                                width: '100%', padding: '1.3rem 2rem', borderRadius: '1.2rem', border: 'none', 
                                background: loading ? 'var(--glass)' : 'linear-gradient(135deg, var(--accent) 0%, #6366f1 100%)', 
                                color: loading ? 'var(--text-muted)' : '#fffffe', 
                                fontSize: '1.2rem', fontWeight: '950', cursor: loading ? 'not-allowed' : 'pointer', transition: 'var(--transition)',
                                letterSpacing: '2px', textTransform: 'uppercase', boxShadow: 'var(--laminar-shadow)'
                            }}
                        >
                            {loading ? t('admin.dataEntry.form.saving') : t('admin.dataEntry.form.submit')}
                        </button>
                    </div>
                </form>
                )}

            </div>
            <style>{`
                .premium-input:focus, .premium-select:focus, .premium-file-input:focus {
                    border-color: var(--accent) !important;
                    box-shadow: 0 0 0 4px var(--accent-soft) !important;
                }
                .btn-back-premium:hover {
                    background: var(--text-primary) !important;
                    color: var(--midnight) !important;
                    border-color: transparent !important;
                }
                .tab-btn-inactive:hover {
                    color: var(--text-primary) !important;
                    background: var(--glass) !important;
                }
                .btn-action-primary:hover {
                    opacity: 0.95;
                    transform: translateY(-2px);
                    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15) !important;
                }
                .btn-action-primary:active {
                    transform: translateY(0);
                }
                .btn-action-warning:hover {
                    background: var(--color-danger) !important;
                    color: #fffffe !important;
                    transform: translateY(-2px);
                    box-shadow: 0 10px 20px var(--color-danger-bg) !important;
                }
                .btn-action-warning:active {
                    transform: translateY(0);
                }
                .premium-select option {
                    background: var(--midnight);
                    color: var(--text-primary);
                }
                .tooltip-container:hover .tooltip-content {
                    opacity: 1 !important;
                    visibility: visible !important;
                    bottom: 135% !important;
                }
            `}</style>
        </div>
    );
};

export default AdminDataEntry;
