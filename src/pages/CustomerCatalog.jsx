import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../services/apiConfig';

const allModels = {
    'SEAT': [
        { 
            id: 'ST-JACKET-01', 
            title: 'Premium Work Jacket', 
            category: 'Uniform', 
            img: '/p1.jpg',

            sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL']
        },
        { 
            id: 'ST-PANTS-01', 
            title: 'Heavy Duty Pants', 
            category: 'Uniform', 
            img: '/p2.jpg',

            sizes: ['38', '40', '42', '44', '46', '48', '50', '52']
        },
        { 
            id: 'ST-SHIRT-01', 
            title: 'Classic Polo Shirt', 
            category: 'Uniform', 
            img: '/p3.jpg',

            sizes: ['S', 'M', 'L', 'XL', 'XXL']
        }
    ],
    'FORD': [
        { 
            id: 'FR-GLOVES-01', 
            title: 'Industrial Gloves', 
            category: 'Safety', 
            img: '/p4.jpg',

            sizes: ['S', 'M', 'L', 'XL']
        }
    ],
    'ZARA': [
        { 
            id: 'ZARA-TSH-TEX-GR', 
            title: 'Textured Polo (Green)', 
            category: 'Polo', 
            img: 'https://static.zara.net/assets/public/04ba/ec09/c53246a79f2e/deaa479a5f45/04087511527-e1/04087511527-e1.jpg?ts=1774884011517&w=544',

            sizes: ['S', 'M', 'L', 'XL', 'XXL']
        }
    ],
    'AUDI': [
        { 
            id: 'AUD-POLO-2026', 
            title: 'Audi Danışman Erkek Polo Yaka T-Shirt', 
            category: 'Polo', 
            img: '/extracted_pdf_pages/page_1_img_4_Im14.png',

            sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL']
        },
        { 
            id: 'AUD-POLO-WOMEN-2026', 
            title: 'Audi Danışman Kadın Polo Yaka T-Shirt', 
            category: 'Polo', 
            img: '/extracted_pdf_pages/page_4_img_1_Im46.png',

            sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL']
        },
        { 
            id: 'AUD-PANT-2026', 
            title: 'Audi Teknik İş Pantolonu', 
            category: 'Uniform', 
            img: '/extracted_pdf_pages/page_3_img_4_Im42.png',

            sizes: ['38', '40', '42', '44', '46', '48', '50', '52', '54', '56', '58', '60', '62']
        },
        { 
            id: 'AUD-TSH-2026', 
            title: 'Audi Sport e-tron Kırmızı T-Shirt', 
            category: 'T-Shirt', 
            img: '/extracted_pdf_pages/page_19_img_2_Im294.png',

            sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL']
        },
        { 
            id: 'AUD-POLO-SPORT-2026', 
            title: 'Audi Sport Teknik Servis Polo T-Shirt', 
            category: 'Polo', 
            img: '/extracted_pdf_pages/page_21_img_1_Im309.png',

            sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL']
        },
        { 
            id: 'AUD-POLO-DYNAMIC-2026', 
            title: 'Audi Sport Dynamic Renk Bloklu Polo', 
            category: 'Polo', 
            img: '/extracted_pdf_pages/page_27_img_1_Im368.png',

            sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL']
        }
    ]
};

const CustomerCatalog = () => {
    const { t, currentUser, theme, themeMode } = useLanguage();
    const navigate = useNavigate();
    const [dbProducts, setDbProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);
    const [zoomScale, setZoomScale] = useState(1);
    const [selectedTitle, setSelectedTitle] = useState('');

    const getThumbnail = (url) => {
        if (!url) return '';
        if (url.startsWith('/extracted_pdf_pages/') && !url.includes('/thumbnails/')) {
            return url.replace('/extracted_pdf_pages/', '/extracted_pdf_pages/thumbnails/');
        }
        return url;
    };

    const brand = currentUser?.brand || "SEAT";

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/master-products`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setDbProducts(data.data.filter(p => p.brand === brand));
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [brand]);

    // Build catalog catalog list based on PDF metadata
    const catalogItems = (allModels[brand] || []).map(model => {
        // Group size products from database under this model
        const matchingDbProducts = dbProducts.filter(p => p.sku === model.id);
        
        // Find price and default details
        const representativeProduct = matchingDbProducts[0];
        const price = representativeProduct ? `${representativeProduct.price} TL` : '480.00 TL';
        const colors = [...new Set(matchingDbProducts.map(p => p.color))];
        const barcodes = [...new Set(matchingDbProducts.map(p => p.barcode))];

        return {
            ...model,
            price,
            colors: colors.length > 0 ? colors.join(', ') : t('catalog.defaultColor'),
            barcode: representativeProduct ? representativeProduct.ean13 || representativeProduct.barcode : '8680003000013',
            matchingDbProducts
        };
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            <header style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <button 
                  onClick={() => navigate('/customer')}
                  style={{ 
                      background: themeMode === 'light' ? 'rgba(15, 23, 42, 0.05)' : 'rgba(255,255,255,0.05)', border: themeMode === 'light' ? '1px solid rgba(15, 23, 42, 0.1)' : '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', 
                      padding: '0.8rem 1.5rem', borderRadius: '100px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '950',
                      alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'var(--transition)',
                      letterSpacing: '1px'
                  }}
                  onMouseOver={e => e.currentTarget.style.background = themeMode === 'light' ? 'rgba(15, 23, 42, 0.1)' : 'rgba(255,255,255,0.1)'}
                  onMouseOut={e => e.currentTarget.style.background = themeMode === 'light' ? 'rgba(15, 23, 42, 0.05)' : 'rgba(255,255,255,0.05)'}
                >
                  ← {t('common.back').toUpperCase()}
                </button>
                <h1 style={{ fontSize: '4.5rem', color: 'var(--text-primary)', fontWeight: '950', letterSpacing: '-3px', margin: 0 }}>
                    {t('admin.nav.catalog').toUpperCase()}
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', fontWeight: '500', margin: 0 }}>
                    {currentUser?.brand} {t('catalog.subtitle')}
                </p>
            </header>

            <div className="glass" style={{ padding: '3rem', background: themeMode === 'light' ? 'rgba(15, 23, 42, 0.01)' : 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid var(--glass-border)' }}>
                {loading ? (
                    <div style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-primary)', fontWeight: '900', letterSpacing: '4px' }}>
                        {t('common.loading').toUpperCase()}
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '3rem' }}>
                        {catalogItems.length > 0 ? catalogItems.map(item => (
                            <div 
                                key={item.id} 
                                className="prism-glass" 
                                style={{ 
                                    padding: '2rem', 
                                    borderRadius: '4px', 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    gap: '1.5rem',
                                    border: themeMode === 'light' ? '1px solid rgba(15, 23, 42, 0.08)' : '1px solid rgba(255,255,255,0.05)',
                                    background: themeMode === 'light' ? 'rgba(15, 23, 42, 0.01)' : 'rgba(255,255,255,0.01)',
                                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                {/* Drawing Viewport */}
                                <div 
                                    onClick={() => {
                                        setSelectedImage(item.img);
                                        setSelectedTitle(item.title);
                                        setZoomScale(1);
                                    }}
                                    style={{ 
                                        height: '240px', 
                                        borderRadius: '1.8rem', 
                                        background: 'var(--input-bg)', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        overflow: 'hidden',
                                        border: '1px solid var(--input-border)',
                                        position: 'relative',
                                        cursor: 'zoom-in'
                                    }}
                                    className="pdf-spec-sheet-viewport"
                                >
                                    <img 
                                        src={getThumbnail(item.img)} 
                                        alt={item.title} 
                                        style={{ 
                                            maxHeight: '85%', 
                                            maxWidth: '85%', 
                                            objectFit: 'contain',
                                            filter: brand === 'AUDI' ? 'none' : 'brightness(0.9) contrast(1.1)',
                                            transition: 'transform 0.4s ease'
                                        }} 
                                    />
                                    {/* Hover Search overlay */}
                                    <div style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background: 'rgba(0, 0, 0, 0.15)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        opacity: 0,
                                        transition: 'opacity 0.3s ease',
                                        pointerEvents: 'none'
                                    }} className="hover-zoom-overlay">
                                        <span style={{
                                            background: 'var(--royal)',
                                            color: 'var(--text-primary)',
                                            border: '1px solid var(--glass-border)',
                                            padding: '1rem 2rem',
                                            borderRadius: '100px',
                                            fontWeight: '900',
                                            fontSize: '0.85rem',
                                            letterSpacing: '1px',
                                            boxShadow: 'var(--laminar-shadow)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}>
                                            {t('catalog.zoomImage')}
                                        </span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.7rem', color: theme?.primary || 'var(--accent)', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase' }}>
                                            {item.category}
                                        </span>
                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '900', letterSpacing: '1px' }}>
                                            {item.id}
                                        </span>
                                    </div>
                                    <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: '950', margin: 0, lineHeight: '1.4' }}>
                                        {item.title}
                                    </h3>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--input-bg)', padding: '1.2rem', borderRadius: '4px', border: '1px solid var(--input-border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '800' }}>{t('catalog.sizes')}</span>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: '900' }}>
                                            {item.sizes[0]} - {item.sizes[item.sizes.length - 1]}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '800' }}>{t('catalog.color')}</span>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: '800', textAlign: 'right' }}>
                                            {item.colors}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '800' }}>{t('catalog.barcode')}</span>
                                        <span style={{ fontSize: '0.8rem', color: theme?.primary || 'var(--accent)', fontWeight: '900', letterSpacing: '0.5px' }}>
                                            {item.barcode}
                                        </span>
                                    </div>
                                </div>

                                <div style={{ marginTop: 'auto', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem' }}>
                                    <div>
                                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: '900', letterSpacing: '1px' }}>{t('catalog.unitPrice')}</div>
                                        <div style={{ fontSize: '1.6rem', color: 'var(--color-success)', fontWeight: '950', textShadow: '0 0 20px rgba(0,255,102,0.15)' }}>{item.price}</div>
                                    </div>
                                    <button 
                                        onClick={() => navigate(`/customer/new-order?model=${item.id}`)}
                                        style={{ 
                                            background: theme?.primary || 'var(--accent)', 
                                            color: brand === 'ZARA' ? 'var(--midnight)' : 'var(--text-primary)', 
                                            border: 'none', 
                                            padding: '1rem 2rem', 
                                            borderRadius: '100px', 
                                            fontWeight: '950', 
                                            fontSize: '0.8rem', 
                                            cursor: 'pointer',
                                            boxShadow: `0 10px 25px ${(theme?.primary || 'var(--accent)')}33`,
                                            transition: 'all 0.3s ease'
                                        }}
                                        className="order-btn-glowing"
                                    >
                                        {t('catalog.orderNow').toUpperCase()}
                                    </button>
                                </div>
                            </div>
                        )) : (
                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)' }}>
                                {t('catalog.noProducts')}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Interactive Zoom Lightbox Modal */}
            {selectedImage && (
                <div 
                    onClick={() => setSelectedImage(null)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: themeMode === 'light' ? 'rgba(255, 255, 255, 0.75)' : 'rgba(4, 7, 18, 0.85)',
                        backdropFilter: 'blur(30px)',
                        WebkitBackdropFilter: 'blur(30px)',
                        zIndex: 10000,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '2rem'
                    }}
                >
                    {/* Lightbox Header Controls */}
                    <div 
                        onClick={e => e.stopPropagation()}
                        style={{
                            position: 'absolute',
                            top: '2rem',
                            display: 'flex',
                            gap: '1.5rem',
                            alignItems: 'center',
                            zIndex: 10002
                        }}
                    >
                        <button 
                            onClick={() => setZoomScale(prev => Math.min(prev + 0.25, 3))}
                            style={{
                                background: themeMode === 'light' ? 'rgba(15, 23, 42, 0.06)' : 'rgba(255,255,255,0.1)',
                                border: themeMode === 'light' ? '1px solid rgba(15, 23, 42, 0.1)' : '1px solid rgba(255,255,255,0.15)',
                                color: 'var(--text-primary)',
                                width: '50px',
                                height: '50px',
                                borderRadius: '50%',
                                cursor: 'pointer',
                                fontSize: '1.25rem',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: '0.2s'
                            }}
                            onMouseOver={e => e.currentTarget.style.background = themeMode === 'light' ? 'rgba(15, 23, 42, 0.1)' : 'var(--text-muted)'}
                            onMouseOut={e => e.currentTarget.style.background = themeMode === 'light' ? 'rgba(15, 23, 42, 0.06)' : 'rgba(255,255,255,0.1)'}
                        >
                            ➕
                        </button>
                        <button 
                            onClick={() => setZoomScale(prev => Math.max(prev - 0.25, 0.5))}
                            style={{
                                background: themeMode === 'light' ? 'rgba(15, 23, 42, 0.06)' : 'rgba(255,255,255,0.1)',
                                border: themeMode === 'light' ? '1px solid rgba(15, 23, 42, 0.1)' : '1px solid rgba(255,255,255,0.15)',
                                color: 'var(--text-primary)',
                                width: '50px',
                                height: '50px',
                                borderRadius: '50%',
                                cursor: 'pointer',
                                fontSize: '1.25rem',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: '0.2s'
                            }}
                            onMouseOver={e => e.currentTarget.style.background = themeMode === 'light' ? 'rgba(15, 23, 42, 0.1)' : 'var(--text-muted)'}
                            onMouseOut={e => e.currentTarget.style.background = themeMode === 'light' ? 'rgba(15, 23, 42, 0.06)' : 'rgba(255,255,255,0.1)'}
                        >
                            ➖
                        </button>
                        <button 
                            onClick={() => setZoomScale(1)}
                            style={{
                                background: themeMode === 'light' ? 'rgba(15, 23, 42, 0.06)' : 'rgba(255,255,255,0.1)',
                                border: themeMode === 'light' ? '1px solid rgba(15, 23, 42, 0.1)' : '1px solid rgba(255,255,255,0.15)',
                                color: 'var(--text-primary)',
                                padding: '0 1.5rem',
                                height: '50px',
                                borderRadius: '25px',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: '900',
                                letterSpacing: '1px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: '0.2s'
                            }}
                            onMouseOver={e => e.currentTarget.style.background = themeMode === 'light' ? 'rgba(15, 23, 42, 0.1)' : 'var(--text-muted)'}
                            onMouseOut={e => e.currentTarget.style.background = themeMode === 'light' ? 'rgba(15, 23, 42, 0.06)' : 'rgba(255,255,255,0.1)'}
                        >
                            {t('catalog.reset')}
                        </button>
                        <button 
                            onClick={() => setSelectedImage(null)}
                            style={{
                                background: 'rgba(212, 175, 55, 0.2)',
                                border: '1px solid rgba(212, 175, 55,0.4)',
                                color: 'var(--text-primary)',
                                width: '50px',
                                height: '50px',
                                borderRadius: '50%',
                                cursor: 'pointer',
                                fontSize: '1.25rem',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: '0.2s'
                            }}
                            onMouseOver={e => e.currentTarget.style.background = 'rgba(212, 175, 55,0.3)'}
                            onMouseOut={e => e.currentTarget.style.background = 'rgba(212, 175, 55, 0.2)'}
                        >
                            ✕
                        </button>
                    </div>

                    {/* Lightbox Body Image */}
                    <div 
                        onClick={e => e.stopPropagation()}
                        style={{
                            maxWidth: '90%',
                            maxHeight: '80vh',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'auto',
                            padding: '2rem',
                            borderRadius: '4px',
                            background: themeMode === 'light' ? 'rgba(15, 23, 42, 0.01)' : 'rgba(255,255,255,0.02)',
                            border: themeMode === 'light' ? '1px solid rgba(15, 23, 42, 0.08)' : '1px solid rgba(255,255,255,0.05)',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <img 
                            src={selectedImage} 
                            alt={selectedTitle}
                            style={{
                                transform: `scale(${zoomScale})`,
                                transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                                maxWidth: '100%',
                                maxHeight: '75vh',
                                objectFit: 'contain'
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerCatalog;
