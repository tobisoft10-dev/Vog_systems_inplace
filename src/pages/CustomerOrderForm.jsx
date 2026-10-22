import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import API_BASE_URL from '../services/apiConfig';

import ProductCard from '../components/ProductCard';
import { logoService } from '../services/logoService';

const allModels = {
    'SEAT': [
        { 
            id: 'ST-JACKET-01', 
            title: 'Premium Work Jacket', 
            category: 'Uniform', 
            img: '/p1.jpg',
            sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'],
            measurements: {
                headers: ['BEDEN / SIZE', 'GÖĞÜS (CHEST)', 'BOY (LENGTH)', 'KOL (SLEEVE)'],
                rows: [
                    ['S', '54 cm', '72 cm', '62 cm'],
                    ['M', '57 cm', '74 cm', '63.5 cm'],
                    ['L', '60 cm', '76 cm', '65 cm'],
                    ['XL', '63 cm', '78 cm', '66.5 cm'],
                    ['2XL', '66 cm', '80 cm', '68 cm'],
                    ['3XL', '69 cm', '82 cm', '69.5 cm']
                ]
            }
        },
        { 
            id: 'ST-PANTS-01', 
            title: 'Heavy Duty Pants', 
            category: 'Uniform', 
            img: '/p2.jpg',
            sizes: ['38', '40', '42', '44', '46', '48', '50', '52'],
            measurements: {
                headers: ['BEDEN / SIZE', 'BEL (WAIST)', 'BASEN (HIPS)', 'BOY (LENGTH)'],
                rows: [
                    ['38', '38 cm', '48 cm', '106 cm'],
                    ['40', '40 cm', '50 cm', '107 cm'],
                    ['42', '42 cm', '52 cm', '108 cm'],
                    ['44', '44 cm', '54 cm', '109 cm'],
                    ['46', '46 cm', '56 cm', '110 cm'],
                    ['48', '48 cm', '58 cm', '111 cm'],
                    ['50', '50 cm', '60 cm', '112 cm'],
                    ['52', '52 cm', '62 cm', '113 cm']
                ]
            }
        },
        { 
            id: 'ST-SHIRT-01', 
            title: 'Classic Polo Shirt', 
            category: 'Uniform', 
            img: '/p3.jpg',
            sizes: ['S', 'M', 'L', 'XL', 'XXL'],
            measurements: {
                headers: ['BEDEN / SIZE', 'GÖĞÜS (CHEST)', 'BOY (LENGTH)', 'KOL (SLEEVE)'],
                rows: [
                    ['S', '52 cm', '70 cm', '20 cm'],
                    ['M', '54 cm', '72 cm', '21 cm'],
                    ['L', '56 cm', '74 cm', '22 cm'],
                    ['XL', '58 cm', '76 cm', '23 cm'],
                    ['XXL', '60 cm', '78 cm', '24 cm']
                ]
            }
        }
    ],
    'FORD': [
        { 
            id: 'FR-GLOVES-01', 
            title: 'Industrial Gloves', 
            category: 'Safety', 
            img: '/p4.jpg',
            sizes: ['S', 'M', 'L', 'XL'],
            measurements: {
                headers: ['BEDEN / SIZE', 'EN (WIDTH)', 'BOY (LENGTH)'],
                rows: [
                    ['S', '9 cm', '22 cm'],
                    ['M', '10 cm', '23 cm'],
                    ['L', '11 cm', '24 cm'],
                    ['XL', '12 cm', '25 cm']
                ]
            }
        }
    ],
    'ZARA': [
        { 
            id: 'ZARA-TSH-TEX-GR', 
            title: 'Textured Polo (Green)', 
            category: 'Polo', 
            img: 'https://static.zara.net/assets/public/04ba/ec09/c53246a79f2e/deaa479a5f45/04087511527-e1/04087511527-e1.jpg?ts=1774884011517&w=544',
            sizes: ['S', 'M', 'L', 'XL', 'XXL'],
            measurements: {
                headers: ['BEDEN / SIZE', 'GÖĞÜS (CHEST)', 'BOY (LENGTH)', 'OMUZ (SHOULDER)'],
                rows: [
                    ['S', '50 cm', '68 cm', '44 cm'],
                    ['M', '52.5 cm', '70 cm', '46 cm'],
                    ['L', '55 cm', '72 cm', '48 cm'],
                    ['XL', '57.5 cm', '74 cm', '50 cm'],
                    ['XXL', '60 cm', '76 cm', '52 cm']
                ]
            }
        }
    ],
    'AUDI': [
        { 
            id: 'AUD-POLO-2026', 
            title: 'Audi Danışman Erkek Polo Yaka T-Shirt', 
            category: 'Polo', 
            img: '/extracted_pdf_pages/page_1_img_4_Im14.png',
            images: [
                '/extracted_pdf_pages/page_1_img_4_Im14.png',
                '/extracted_pdf_pages/page_1_img_1_Im11.png',
                '/extracted_pdf_pages/page_2_img_1_Im30.png',
                '/extracted_pdf_pages/page_1_img_5_Im15.png'
            ],

            sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'],
            measurements: {
                headers: ['BEDEN / SIZE', 'GÖĞÜS (CHEST)', 'A.O. BOY (LENGTH)', 'KOL BOYU (SLEEVE)'],
                rows: [
                    ['XS', '48.8 cm', '66.7 cm', '17.4 cm'],
                    ['S', '51.4 cm', '68.8 cm', '18.2 cm'],
                    ['M', '54 cm', '71 cm', '19 cm'],
                    ['L', '56.5 cm', '73.2 cm', '19.8 cm'],
                    ['XL', '59.2 cm', '75.3 cm', '20.6 cm'],
                    ['2XL', '61.7 cm', '77.4 cm', '21.4 cm'],
                    ['3XL', '64.5 cm', '79.5 cm', '22.2 cm'],
                    ['4XL', '67 cm', '80.7 cm', '22.7 cm'],
                    ['5XL', '69.5 cm', '82 cm', '23.2 cm']
                ]
            }
        },
        { 
            id: 'AUD-POLO-WOMEN-2026', 
            title: 'Audi Danışman Kadın Polo Yaka T-Shirt', 
            category: 'Polo', 
            img: '/extracted_pdf_pages/page_4_img_1_Im46.png',
            images: [
                '/extracted_pdf_pages/page_4_img_1_Im46.png',
                '/extracted_pdf_pages/page_4_img_4_Im49.png',
                '/extracted_pdf_pages/page_4_img_5_Im50.png'
            ],

            sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'],
            measurements: {
                headers: ['BEDEN / SIZE', 'GÖĞÜS (CHEST)', 'A.O. BOY (LENGTH)', 'KOL BOYU (SLEEVE)'],
                rows: [
                    ['XS', '43.2 cm', '62.6 cm', '14.8 cm'],
                    ['S', '45.7 cm', '64.6 cm', '16 cm'],
                    ['M', '48.3 cm', '66.6 cm', '17.2 cm'],
                    ['L', '51 cm', '68.6 cm', '18.4 cm'],
                    ['XL', '53.6 cm', '70.6 cm', '19.6 cm'],
                    ['2XL', '56.2 cm', '72.6 cm', '20.8 cm'],
                    ['3XL', '58.8 cm', '74.5 cm', '22 cm'],
                    ['4XL', '61.5 cm', '76.5 cm', '23.2 cm'],
                    ['5XL', '64 cm', '78.5 cm', '24.4 cm']
                ]
            }
        },
        { 
            id: 'AUD-PANT-2026', 
            title: 'Audi Teknik İş Pantolonu', 
            category: 'Uniform', 
            img: '/extracted_pdf_pages/page_3_img_4_Im42.png',
            images: [
                '/extracted_pdf_pages/page_3_img_4_Im42.png',
                '/extracted_pdf_pages/page_3_img_1_Im39.png',
                '/extracted_pdf_pages/page_3_img_2_Im40.png'
            ],

            sizes: ['38', '40', '42', '44', '46', '48', '50', '52', '54', '56', '58', '60', '62'],
            measurements: {
                headers: ['BEDEN / SIZE', 'BEL (WAIST)', 'BASEN (HIPS)', 'BOY (OUTER LENGTH)'],
                rows: [
                    ['38', '38 cm', '47 cm', '109 cm'],
                    ['40', '40 cm', '48 cm', '109 cm'],
                    ['42', '42 cm', '49 cm', '109 cm'],
                    ['44', '44 cm', '51 cm', '109 cm'],
                    ['46', '46 cm', '52 cm', '110 cm'],
                    ['48', '48 cm', '55 cm', '111 cm'],
                    ['50', '50 cm', '57 cm', '112 cm'],
                    ['52', '52 cm', '59 cm', '112 cm'],
                    ['54', '54 cm', '61 cm', '112 cm'],
                    ['56', '56 cm', '63 cm', '112 cm'],
                    ['58', '58 cm', '65 cm', '114 cm'],
                    ['60', '60 cm', '66 cm', '114 cm'],
                    ['62', '62 cm', '69 cm', '114 cm']
                ]
            }
        },
        { 
            id: 'AUD-TSH-2026', 
            title: 'Audi Sport e-tron Kırmızı T-Shirt', 
            category: 'T-Shirt', 
            img: '/extracted_pdf_pages/page_19_img_2_Im294.png',
            images: [
                '/extracted_pdf_pages/page_19_img_2_Im294.png',
                '/extracted_pdf_pages/page_19_img_4_Im296.png',
                '/extracted_pdf_pages/page_19_img_5_Im297.png'
            ],

            sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'],
            measurements: {
                headers: ['BEDEN / SIZE', 'GÖĞÜS (CHEST)', 'A.O. BOY (LENGTH)', 'KOL BOYU (SLEEVE)'],
                rows: [
                    ['XS', '49 cm', '67.6 cm', '18.8 cm'],
                    ['S', '51.3 cm', '69.6 cm', '19.7 cm'],
                    ['M', '53.7 cm', '71.6 cm', '20.6 cm'],
                    ['L', '56.2 cm', '73.6 cm', '21.5 cm'],
                    ['XL', '58.5 cm', '75.6 cm', '22.4 cm'],
                    ['2XL', '61.5 cm', '77.6 cm', '23.3 cm'],
                    ['3XL', '63.5 cm', '79.5 cm', '24.2 cm'],
                    ['4XL', '65.8 cm', '81.5 cm', '25 cm'],
                    ['5XL', '68.3 cm', '83.5 cm', '26 cm']
                ]
            }
        },
        { 
            id: 'AUD-POLO-SPORT-2026', 
            title: 'Audi Sport Teknik Servis Polo T-Shirt', 
            category: 'Polo', 
            img: '/extracted_pdf_pages/page_21_img_1_Im309.png',
            images: [
                '/extracted_pdf_pages/page_21_img_1_Im309.png',
                '/extracted_pdf_pages/page_21_img_3_Im311.png'
            ],

            sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'],
            measurements: {
                headers: ['BEDEN / SIZE', 'GÖĞÜS (CHEST)', 'A.O. BOY (LENGTH)', 'KOL BOYU (SLEEVE)'],
                rows: [
                    ['XS', '48.8 cm', '66.7 cm', '17.4 cm'],
                    ['S', '51.4 cm', '68.8 cm', '18.2 cm'],
                    ['M', '54 cm', '71 cm', '19 cm'],
                    ['L', '56.5 cm', '73.2 cm', '19.8 cm'],
                    ['XL', '59.2 cm', '75.3 cm', '20.6 cm'],
                    ['2XL', '61.7 cm', '77.4 cm', '21.4 cm'],
                    ['3XL', '64.5 cm', '79.5 cm', '22.2 cm'],
                    ['4XL', '67 cm', '80.7 cm', '22.7 cm'],
                    ['5XL', '69.5 cm', '82 cm', '23.2 cm']
                ]
            }
        },
        { 
            id: 'AUD-POLO-DYNAMIC-2026', 
            title: 'Audi Sport Dynamic Renk Bloklu Polo', 
            category: 'Polo', 
            img: '/extracted_pdf_pages/page_27_img_1_Im368.png',
            images: [
                '/extracted_pdf_pages/page_27_img_1_Im368.png',
                '/extracted_pdf_pages/page_27_img_3_Im370.png'
            ],

            sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'],
            measurements: {
                headers: ['BEDEN / SIZE', 'GÖĞÜS (CHEST)', 'A.O. BOY (LENGTH)', 'KOL BOYU (SLEEVE)'],
                rows: [
                    ['XS', '48.8 cm', '66.7 cm', '17.4 cm'],
                    ['S', '51.4 cm', '68.8 cm', '18.2 cm'],
                    ['M', '54 cm', '71 cm', '19 cm'],
                    ['L', '56.5 cm', '73.2 cm', '19.8 cm'],
                    ['XL', '59.2 cm', '75.3 cm', '20.6 cm'],
                    ['2XL', '61.7 cm', '77.4 cm', '21.4 cm'],
                    ['3XL', '64.5 cm', '79.5 cm', '22.2 cm'],
                    ['4XL', '67 cm', '80.7 cm', '22.7 cm'],
                    ['5XL', '69.5 cm', '82 cm', '23.2 cm']
                ]
            }
        }
    ]
};

const CustomerOrderForm = () => {
    const { t, currentUser, theme, themeMode } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Parse model query param
    const queryParams = new URLSearchParams(location.search);
    const urlModelId = queryParams.get('model');
    
    const brand = currentUser?.brand || "SEAT";
    const models = allModels[brand] || allModels['SEAT'];
    const initialModel = (urlModelId && models.find(m => m.id === urlModelId)) || (models && models.length > 0 ? models[0] : null);

    const [formData, setFormData] = useState(() => {
        const initialSizes = {};
        if (initialModel && initialModel.sizes) {
            initialModel.sizes.forEach(size => {
                initialSizes[size] = 0;
            });
        }
        return {
            model: initialModel ? initialModel.id : '',
            fabric: 'Technical Cotton Pique',
            color: 'Medium Green',
            deliveryDate: '',
            notes: '',
            sizes: initialSizes
        };
    });

    const [stockInfo, setStockInfo] = useState(null);
    const [subCustomers, setSubCustomers] = useState([]);
    const [selectedSub, setSelectedSub] = useState(null);
    const [activeImage, setActiveImage] = useState('');
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [zoomScale, setZoomScale] = useState(1);
    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);
    const [showSpecs, setShowSpecs] = useState(false);

    const getThumbnail = (url) => {
        if (!url) return '';
        if (url.startsWith('/extracted_pdf_pages/') && !url.includes('/thumbnails/')) {
            return url.replace('/extracted_pdf_pages/', '/extracted_pdf_pages/thumbnails/');
        }
        return url;
    };

    React.useEffect(() => {
        const handleResize = () => {
            setIsMobileView(window.innerWidth <= 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fetch sub-customers
    React.useEffect(() => {
        fetch(`${API_BASE_URL}/api/subs/${brand}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setSubCustomers(data.data);
                    if (data.data && data.data.length > 0) {
                        setSelectedSub(data.data[0]); // Auto-select first branch!
                    }
                }
            });
    }, [brand]);

    const activeModel = models.find(m => m.id === formData.model) || models[0] || null;

    // Auto-select first model when brand changes
    React.useEffect(() => {
        if (formData.model && models.some(m => m.id === formData.model)) {
            return; // Preserve pre-selected model if valid
        }
        if (models && models.length > 0) {
            const firstModel = models[0];
            const initialSizes = {};
            if (firstModel.sizes) {
                firstModel.sizes.forEach(size => {
                    initialSizes[size] = 0;
                });
            }
            setFormData(prev => ({
                ...prev,
                model: firstModel.id,
                sizes: initialSizes
            }));
        }
    }, [brand]);

    // Fetch stock info when model changes
    React.useEffect(() => {
        fetch(`${API_BASE_URL}/api/stocks/${brand}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    const currentStock = data.data.find(s => s.sku === formData.model);
                    setStockInfo(currentStock);
                }
            });
    }, [formData.model, brand]);

    // Sync active image when model changes
    React.useEffect(() => {
        if (activeModel) {
            setActiveImage(activeModel.img);
        } else {
            setActiveImage('');
        }
    }, [formData.model, brand, activeModel]);

    const handleModelSelect = (selectedModel) => {
        const initialSizes = {};
        if (selectedModel.sizes) {
            selectedModel.sizes.forEach(size => {
                initialSizes[size] = 0;
            });
        }
        setFormData(prev => ({
            ...prev,
            model: selectedModel.id,
            sizes: initialSizes
        }));
    };

    const handleSizeChange = (size, val) => {
        setFormData(prev => ({
            ...prev,
            sizes: { ...prev.sizes, [size]: parseInt(val) || 0 }
        }));
    };

    const calculateTotal = () => {
        return Object.values(formData.sizes).reduce((acc, curr) => acc + curr, 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const total = calculateTotal();
        
        if (total === 0) {
            alert(t('customer.errors.minQuantity'));
            return;
        }

        try {
            const totalQty = calculateTotal();
            
            // Format size details (e.g. "XS: 5, S: 10")
            const sizeDetails = Object.entries(formData.sizes)
                .filter(([_, qty]) => qty > 0)
                .map(([size, qty]) => `${size}: ${qty}`)
                .join(', ');
                
            // Append size breakdown to notes in a structured format
            const finalNotes = sizeDetails
                ? `[Bedenler / Sizes: ${sizeDetails}]${formData.notes ? ' - ' + formData.notes : ''}`
                : formData.notes;

            const response = await fetch(`${API_BASE_URL}/api/orders/new`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    brand: brand,
                    product_name: stockInfo ? stockInfo.product_name : (activeModel ? activeModel.title : formData.model),
                    sku: formData.model,
                    quantity: totalQty,
                    service_center: currentUser.name,
                    sub_customer_id: selectedSub?.id,
                    sub_customer_name: selectedSub?.name,
                    notes: finalNotes
                })
            });

            const data = await response.json();

            if (data.success) {
                const displayId = data.orderNumber || (typeof data.orderId === 'string' && data.orderId.length > 8 ? data.orderId.substring(0, 8).toUpperCase() : data.orderId);
                let message = t('customer.orderCreated').replace('{orderId}', displayId) + '\n';
                message += t('customer.estimatedDeliveryColon').replace('{date}', data.estimated_delivery_date) + '\n';
                
                if (data.procurement_needed) {
                    message += `\n${t('customer.procurementAlert')}`;
                }

                alert(message);
                navigate('/customer/orders');
            }
        } catch (error) {
            console.error('Order submission failed:', error);
            alert(t('customer.orderFailed'));
        }
    };

    const renderMatrixTable = () => {
        if (!activeModel || !activeModel.measurements) return null;

        const { headers, rows } = activeModel.measurements;
        const specNames = headers.slice(1);
        const sizesList = activeModel.sizes;

        if (isMobileView) {
            return (
                <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Size Inputs Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '0.8rem' }}>
                        {sizesList.map((size) => {
                            const hasValue = (formData.sizes[size] || 0) > 0;
                            return (
                                <div key={size} style={{
                                    background: hasValue ? 'rgba(214, 175, 55, 0.08)' : 'var(--input-bg)',
                                    border: hasValue ? `1px solid ${theme?.primary || 'var(--accent)'}` : '1px solid var(--input-border)',
                                    borderRadius: '1rem',
                                    padding: '0.8rem 0.5rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    boxShadow: hasValue ? `0 0 10px ${(theme?.primary || 'var(--accent)')}22` : 'none',
                                    transition: 'all 0.2s ease',
                                    boxSizing: 'border-box',
                                    width: '100%'
                                }}>
                                    <span style={{ fontSize: '0.9rem', fontWeight: '950', color: 'var(--text-primary)' }}>{size}</span>
                                    
                                    {/* Stepper controls */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', width: '100%', justifyContent: 'center' }}>
                                        <button
                                            type="button"
                                            onClick={() => handleSizeChange(size, (formData.sizes[size] || 0) - 1)}
                                            style={{ width: '22px', height: '22px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.06)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.65rem' }}
                                        >
                                            ➖
                                        </button>
                                        <input
                                            type="number"
                                            min="0"
                                            value={formData.sizes[size] !== undefined ? formData.sizes[size] : 0}
                                            onChange={(e) => handleSizeChange(size, e.target.value)}
                                            style={{
                                                width: '28px',
                                                border: 'none',
                                                background: 'transparent',
                                                color: 'var(--text-primary)',
                                                fontWeight: '950',
                                                fontSize: '1rem',
                                                textAlign: 'center',
                                                outline: 'none',
                                                MozAppearance: 'textfield'
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleSizeChange(size, (formData.sizes[size] || 0) + 1)}
                                            style={{ width: '22px', height: '22px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.06)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.65rem' }}
                                        >
                                            ➕
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Size Measurements Toggle */}
                    <div style={{ marginTop: '0.5rem' }}>
                        <button
                            type="button"
                            onClick={() => setShowSpecs(!showSpecs)}
                            style={{
                                background: 'var(--input-bg)',
                                border: '1px solid var(--input-border)',
                                color: 'var(--text-secondary)',
                                padding: '0.6rem 1.2rem',
                                borderRadius: '100px',
                                fontSize: '0.75rem',
                                fontWeight: '800',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                margin: '0 auto',
                                transition: 'var(--transition)'
                            }}
                        >
                            📐 {showSpecs ? t('common.hide') || 'Gizle' : t('customer.sizeChartTable') || 'Ölçüleri Göster'} {showSpecs ? '▲' : '▼'}
                        </button>

                        {showSpecs && (
                            <div style={{
                                marginTop: '1rem',
                                background: 'rgba(255, 255, 255, 0.01)',
                                border: '1px dashed var(--border-subtle)',
                                borderRadius: '1rem',
                                padding: '1rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.6rem',
                                animation: 'fadeIn 0.3s forwards'
                            }}>
                                {sizesList.map((size, sizeIdx) => {
                                    const sizeRow = rows.find(r => r[0] === size) || rows[sizeIdx] || [];
                                    const specValuesString = specNames.map((specName, specIdx) => {
                                        const val = sizeRow[specIdx + 1] || '---';
                                        const displaySpecName = specName.split(' / ')[0] || specName;
                                        return `${displaySpecName}: ${val}`;
                                    }).join(' | ');

                                    return (
                                        <div key={size} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '0.4rem' }}>
                                            <span style={{ fontWeight: '900', color: 'var(--text-primary)' }}>{size}</span>
                                            <span style={{ color: 'var(--text-secondary)', textAlign: 'right' }}>{specValuesString}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return (
            <div style={{ marginTop: '0.5rem' }}>
                <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1rem', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    📐 {t('customer.sizeChartTable')}
                </h4>
                <div style={{ overflowX: 'auto', borderRadius: '4px', border: '1px solid var(--glass-border)', background: 'var(--input-bg)', boxShadow: 'inset 0 4px 30px rgba(0,0,0,0.02)' }}>
                    <div className="table-responsive">
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                            <thead>
                                <tr style={{ background: 'var(--border-subtle)', borderBottom: '1px solid var(--glass-border)' }}>
                                    <th style={{ padding: '1.2rem 1rem', color: 'var(--text-secondary)', fontWeight: '800', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', borderRight: '1px solid var(--border-subtle)', width: '180px' }}>
                                        SPEC / ÖLÇÜLER
                                    </th>
                                    {sizesList.map((size) => {
                                        const isColHighlighted = (formData.sizes[size] || 0) > 0;
                                        return (
                                            <th 
                                                key={size} 
                                                style={{ 
                                                    padding: '1.2rem 0.8rem', 
                                                    color: isColHighlighted ? (theme?.primary || 'var(--accent)') : 'var(--text-primary)', 
                                                    fontWeight: '950', 
                                                    fontSize: '0.9rem', 
                                                    textAlign: 'center',
                                                    background: isColHighlighted ? 'var(--border-subtle)' : 'transparent',
                                                    borderBottom: isColHighlighted ? `2px solid ${theme?.primary || 'var(--accent)'}` : 'none',
                                                    transition: 'all 0.3s ease'
                                                }}
                                            >
                                                {size}
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody>
                                {specNames.map((specName, specIdx) => (
                                    <tr 
                                        key={specName} 
                                        style={{ 
                                            borderBottom: '1px solid var(--border-subtle)',
                                            background: 'transparent'
                                        }}
                                    >
                                        <td style={{ padding: '1rem 1.2rem', color: 'var(--text-primary)', fontWeight: '700', fontSize: '0.75rem', borderRight: '1px solid var(--border-subtle)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                            {specName}
                                        </td>
                                        {sizesList.map((size, sizeIdx) => {
                                            const isColHighlighted = (formData.sizes[size] || 0) > 0;
                                            const sizeRow = rows.find(r => r[0] === size) || rows[sizeIdx] || [];
                                            const specValue = sizeRow[specIdx + 1] || '---';

                                            return (
                                                <td 
                                                    key={size} 
                                                    style={{ 
                                                        padding: '1rem 0.8rem', 
                                                        color: isColHighlighted ? 'var(--text-primary)' : 'var(--text-secondary)', 
                                                        fontWeight: isColHighlighted ? '900' : 'normal',
                                                        fontSize: '0.85rem',
                                                        textAlign: 'center',
                                                        background: isColHighlighted ? 'var(--border-subtle)' : 'transparent',
                                                        borderLeft: isColHighlighted ? '1px dashed var(--border-subtle)' : 'none',
                                                        borderRight: isColHighlighted ? '1px dashed var(--border-subtle)' : 'none',
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                >
                                                    {specValue}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                                <tr style={{ background: 'transparent', borderTop: '2px solid var(--glass-border)' }}>
                                    <td style={{ padding: '1.2rem', color: theme?.primary || 'var(--accent)', fontWeight: '950', fontSize: '0.8rem', letterSpacing: '1px', textTransform: 'uppercase', borderRight: '1px solid var(--border-subtle)' }}>
                                        ✍️ {t('customer.quantity') || 'MİKTAR / QTY'}
                                    </td>
                                    {sizesList.map((size) => {
                                        const isColHighlighted = (formData.sizes[size] || 0) > 0;
                                        return (
                                            <td 
                                                key={size} 
                                                style={{ 
                                                    padding: '0.8rem', 
                                                    background: isColHighlighted ? 'var(--border-subtle)' : 'transparent',
                                                    borderLeft: isColHighlighted ? '1px dashed var(--border-subtle)' : 'none',
                                                    borderRight: isColHighlighted ? '1px dashed var(--border-subtle)' : 'none',
                                                    textAlign: 'center'
                                                }}
                                            >
                                                <input 
                                                    type="number" 
                                                    min="0"
                                                    value={formData.sizes[size] !== undefined ? formData.sizes[size] : 0} 
                                                    onChange={(e) => handleSizeChange(size, e.target.value)}
                                                    style={{ 
                                                        width: '55px',
                                                        padding: '0.6rem 0.2rem', 
                                                        textAlign: 'center', 
                                                        background: 'var(--input-bg)', 
                                                        border: isColHighlighted ? `1px solid ${theme?.primary || 'var(--accent)'}` : '1px solid var(--input-border)', 
                                                        borderRadius: '0.6rem', 
                                                        color: 'var(--input-color)', 
                                                        fontWeight: '950', 
                                                        fontSize: '1.1rem',
                                                        boxShadow: isColHighlighted ? `0 0 15px ${(theme?.primary || 'var(--accent)')}33` : 'none',
                                                        transition: 'all 0.3s ease',
                                                        outline: 'none'
                                                    }}
                                                />
                                            </td>
                                        );
                                    })}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', maxWidth: '1600px', margin: '0 auto', paddingBottom: '5rem', width: '100%' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                <div>
                    <button 
                      onClick={() => navigate('/customer')}
                      style={{ 
                          background: themeMode === 'light' ? 'rgba(15, 23, 42, 0.05)' : 'rgba(255,255,255,0.05)', border: themeMode === 'light' ? '1px solid rgba(15, 23, 42, 0.1)' : '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', 
                          padding: '0.8rem 1.8rem', borderRadius: '100px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '950',
                          marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem', transition: '0.3s',
                          letterSpacing: '1px'
                      }}
                      onMouseOver={e => e.currentTarget.style.background = themeMode === 'light' ? 'rgba(15, 23, 42, 0.1)' : 'rgba(255,255,255,0.1)'}
                      onMouseOut={e => e.currentTarget.style.background = themeMode === 'light' ? 'rgba(15, 23, 42, 0.05)' : 'rgba(255,255,255,0.05)'}
                    >
                      ← {t('customer.dashboard').toUpperCase()}
                    </button>
                    <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', marginBottom: '0.5rem', color: 'var(--text-primary)', fontWeight: '950', letterSpacing: '-2px' }}>{t('customer.newOrder')}</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                        {t('customer.account')}: <strong style={{ color: 'var(--text-primary)' }}>{currentUser.name.toUpperCase()}</strong>
                    </p>
                </div>
            </header>

            <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobileView ? '1fr' : '260px 1fr',
                    gap: isMobileView ? '1.5rem' : '2.5rem',
                    alignItems: 'start',
                    width: '100%'
                }}>
                    
                    {/* COLUMN 1: Vertical Product Selector (Flat slider on mobile) */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: isMobileView ? '0.8rem' : '1.2rem',
                        position: isMobileView ? 'static' : 'sticky',
                        top: '1.5rem',
                        background: isMobileView ? 'transparent' : 'var(--glass)',
                        border: isMobileView ? 'none' : '1px solid var(--glass-border)',
                        borderRadius: '4px',
                        padding: isMobileView ? '0.5rem 0 1rem 0' : '1.5rem',
                        boxShadow: isMobileView ? 'none' : 'var(--laminar-shadow)',
                        width: '100%',
                        boxSizing: 'border-box'
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: '900', color: theme?.primary || 'var(--accent)', textTransform: 'uppercase', letterSpacing: '2px' }}>
                                {t('customer.selectProduct')}
                            </label>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                {models.length} {t('customer.models') || 'ÜRÜN'}
                            </span>
                        </div>
                        
                        <div className="product-vertical-tabs" style={{
                            display: 'flex',
                            flexDirection: isMobileView ? 'row' : 'column',
                            gap: '0.8rem',
                            overflowX: isMobileView ? 'auto' : 'visible',
                            overflowY: isMobileView ? 'visible' : 'auto',
                            maxHeight: isMobileView ? 'none' : 'calc(100vh - 15rem)',
                            paddingRight: isMobileView ? '0' : '0.4rem',
                            scrollbarWidth: 'thin',
                            width: '100%'
                        }}>
                            {models.map(m => {
                                const isSelected = formData.model === m.id;
                                return (
                                    <button
                                        key={m.id}
                                        type="button"
                                        onClick={() => handleModelSelect(m)}
                                        style={{
                                            width: isMobileView ? 'auto' : '100%',
                                            background: isSelected ? (themeMode === 'light' ? 'rgba(15, 23, 42, 0.05)' : 'rgba(255,255,255,0.06)') : (themeMode === 'light' ? 'rgba(15, 23, 42, 0.01)' : 'rgba(255,255,255,0.01)'),
                                            border: isSelected ? `2px solid ${theme?.primary || 'var(--accent)'}` : (themeMode === 'light' ? '1px solid rgba(15, 23, 42, 0.1)' : '1px solid rgba(255,255,255,0.08)'),
                                            borderRadius: '8px',
                                            padding: '0.8rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.8rem',
                                            textAlign: 'left',
                                            whiteSpace: isMobileView ? 'nowrap' : 'normal',
                                            boxShadow: isSelected ? `0 8px 20px ${(theme?.primary || 'var(--accent)')}22` : 'none',
                                            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                            boxSizing: 'border-box'
                                        }}
                                        onMouseOver={e => {
                                            if (!isSelected) e.currentTarget.style.background = themeMode === 'light' ? 'rgba(15, 23, 42, 0.03)' : 'rgba(255,255,255,0.03)';
                                        }}
                                        onMouseOut={e => {
                                            if (!isSelected) e.currentTarget.style.background = themeMode === 'light' ? 'rgba(15, 23, 42, 0.01)' : 'rgba(255,255,255,0.01)';
                                        }}
                                    >
                                        <div style={{ width: '40px', height: '30px', overflow: 'hidden', borderRadius: '0.4rem', background: 'rgba(0,0,0,0.1)', flexShrink: 0 }}>
                                            <img src={getThumbnail(m.img)} alt={m.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                        </div>
                                        <div style={{ fontSize: '0.8rem', fontWeight: '950', color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)', lineHeight: '1.2', flexGrow: 1 }}>
                                            {m.title.replace('Audi ', '')}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* COLUMN 2: Main Area (Right Side) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', width: '100%' }}>
                        
                            {/* Product Spec Sheet Container (Full Width) */}
                            <div className="pdf-spec-sheet glass-card" style={{
                                background: 'var(--glass)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '4px',
                                padding: isMobileView ? '1.2rem' : '2rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: isMobileView ? '1.2rem' : '1.8rem',
                                boxShadow: 'var(--laminar-shadow)',
                                boxSizing: 'border-box',
                                width: '100%'
                            }}>
                                {/* Header mimicking PDF layout */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.2rem', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <span style={{ width: '4px', height: '35px', background: theme?.primary || 'var(--accent)', borderRadius: '2px' }}></span>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', fontWeight: '900', color: theme?.primary || 'var(--accent)', letterSpacing: '2px', textTransform: 'uppercase' }}>
                                                {brand.toUpperCase()} {t('customer.productSpecSheet')}
                                            </div>
                                            <h2 style={{ fontSize: '1.3rem', fontWeight: '950', color: 'var(--text-primary)', letterSpacing: '-0.5px', marginTop: '0.2rem', lineHeight: '1.2' }}>
                                                {activeModel?.title}
                                            </h2>
                                        </div>
                                    </div>
                                    {stockInfo && (
                                        <span style={{ 
                                            fontSize: '0.8rem', 
                                            fontWeight: '950', 
                                            color: stockInfo.quantity < 20 ? 'var(--color-danger)' : 'var(--color-success)',
                                            background: stockInfo.quantity < 20 ? 'var(--color-danger-bg)' : 'var(--color-success-bg)',
                                            padding: '0.4rem 1.2rem',
                                            borderRadius: '100px'
                                        }}>
                                            {t('customer.currentStock')}: {stockInfo.quantity} {t('customer.pcs').toUpperCase()}
                                        </span>
                                    )}
                                </div>

                                {/* Main Image Viewport (Enlarged and Zoomable) */}
                                <div 
                                    className="pdf-spec-sheet-viewport" 
                                    onClick={() => {
                                        setZoomScale(1);
                                        setIsLightboxOpen(true);
                                    }}
                                    style={{
                                        width: '100%',
                                        height: 'auto',
                                        aspectRatio: '3/4',
                                        maxHeight: isMobileView ? '240px' : '480px',
                                        background: 'var(--input-bg)',
                                        borderRadius: isMobileView ? '1rem' : '1.8rem',
                                        border: '1px solid var(--input-border)',
                                        overflow: 'hidden',
                                        position: 'relative',
                                        boxShadow: 'inset 0 4px 30px rgba(0, 0, 0, 0.1)',
                                        cursor: 'zoom-in',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    <img 
                                        src={getThumbnail(activeImage || activeModel?.img)} 
                                        alt={activeModel?.title}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'contain',
                                            padding: '1.2rem',
                                            transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
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
                                    {/* Watermark */}
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '1.2rem',
                                        right: '1.5rem',
                                        fontSize: '0.65rem',
                                        color: 'var(--text-muted)',
                                        fontWeight: '900',
                                        letterSpacing: '3px',
                                        textTransform: 'uppercase',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {t('customer.vogSystemSpec')}
                                    </div>
                                </div>

                                {/* Interactive Gallery Thumbnails */}
                                <div>
                                    <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '900', marginBottom: '0.8rem', lineHeight: '1.4' }}>
                                        📸 {t('customer.visualizer') || 'ÜRÜN DETAY GÖRSELLERİ / PRODUCT DETAIL IMAGES'}
                                    </h4>
                                    <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                                        {(activeModel?.images || [activeModel?.img]).map((imgSrc, idx) => {
                                            const isSelected = activeImage === imgSrc;
                                            return (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => setActiveImage(imgSrc)}
                                                    style={{
                                                        width: '70px',
                                                        height: '55px',
                                                        borderRadius: '0.8rem',
                                                        background: 'var(--input-bg)',
                                                        border: isSelected ? `2px solid ${theme?.primary || 'var(--accent)'}` : '1px solid var(--input-border)',
                                                        padding: '0.2rem',
                                                        cursor: 'pointer',
                                                        overflow: 'hidden',
                                                        boxShadow: isSelected ? `0 0 15px ${(theme?.primary || 'var(--accent)')}55` : 'none',
                                                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                                                    }}
                                                    onMouseOver={e => {
                                                        if (!isSelected) {
                                                            e.currentTarget.style.borderColor = 'var(--text-primary)';
                                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                                        }
                                                    }}
                                                    onMouseOut={e => {
                                                        if (!isSelected) {
                                                            e.currentTarget.style.borderColor = 'var(--input-border)';
                                                            e.currentTarget.style.transform = 'translateY(0)';
                                                        }
                                                    }}
                                                >
                                                    <img 
                                                        src={getThumbnail(imgSrc)} 
                                                        alt={`Thumbnail ${idx}`} 
                                                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                                    />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Technical Details Footer */}
                                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                        <span style={{ color: 'var(--text-secondary)', fontWeight: '800' }}>SKU / MODEL KODU:</span>
                                        <span style={{ color: 'var(--text-primary)', fontWeight: '900' }}>{activeModel?.id}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                        <span style={{ color: 'var(--text-secondary)', fontWeight: '800' }}>KATEGORİ / CATEGORY:</span>
                                        <span style={{ color: 'var(--text-primary)', fontWeight: '900', textTransform: 'uppercase' }}>{activeModel?.category}</span>
                                    </div>
                                </div>
                            </div>

                        {/* Sizing Matrix & Quantity Inputs Section */}
                        <div className="glass-card" style={{ padding: isMobileView ? '1.5rem' : '2.5rem', borderRadius: isMobileView ? '1.8rem' : '2.5rem', background: 'var(--glass)', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: isMobileView ? '1.2rem' : '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                <h3 style={{ color: 'var(--text-primary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '3px', fontWeight: '950' }}>{t('customer.sizeDistribution')}</h3>
                                <div style={{ background: theme?.primary || 'var(--accent)', color: brand === 'ZARA' ? 'var(--midnight)' : 'var(--text-primary)', padding: '0.6rem 1.8rem', borderRadius: '100px', fontWeight: '950', fontSize: '0.85rem', boxShadow: `0 10px 20px ${(theme?.primary || 'var(--accent)')}33` }}>
                                     {t('customer.totalUnits').toUpperCase()}: {calculateTotal()}
                                </div>
                            </div>
                            
                            {activeModel && activeModel.measurements ? (
                                renderMatrixTable()
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '1.2rem' }}>
                                    {(activeModel?.sizes || ['S', 'M', 'L', 'XL', 'XXL']).map(size => (
                                        <div key={size} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', textAlign: 'center' }}>
                                            <div style={{ fontWeight: '800', fontSize: '0.9rem', color: 'var(--text-primary)' }}>{size}</div>
                                            <input 
                                                type="number" 
                                                min="0"
                                                value={formData.sizes[size] !== undefined ? formData.sizes[size] : 0} 
                                                onChange={(e) => handleSizeChange(size, e.target.value)}
                                                style={{ 
                                                    padding: '1rem 0.3rem', 
                                                    textAlign: 'center', 
                                                    background: (formData.sizes[size] || 0) > 0 ? 'var(--border-subtle)' : 'var(--input-bg)', 
                                                    border: (formData.sizes[size] || 0) > 0 ? `1px solid ${theme?.primary || 'var(--accent)'}` : '1px solid var(--input-border)', 
                                                    borderRadius: '4px', 
                                                    color: 'var(--input-color)', 
                                                    fontWeight: '950', 
                                                    fontSize: '1.4rem',
                                                    boxShadow: 'none',
                                                    transition: 'all 0.3s ease',
                                                    outline: 'none',
                                                    width: '100%'
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* unified Specifications & Order Settings Card (Branch, Fabric, Color, Delivery Date, Notes) */}
                        <div className="glass-card" style={{ 
                            padding: isMobileView ? '1.5rem' : '2.5rem', 
                            borderRadius: isMobileView ? '1.8rem' : '2.5rem', 
                            background: 'var(--glass)', 
                            border: '1px solid var(--glass-border)', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: isMobileView ? '1.5rem' : '2.5rem', 
                            boxSizing: 'border-box', 
                            width: '100%' 
                        }}>
                            <h3 style={{ 
                                color: 'var(--text-primary)', 
                                fontSize: '0.85rem', 
                                textTransform: 'uppercase', 
                                letterSpacing: '3px', 
                                fontWeight: '950', 
                                borderBottom: '1px solid var(--border-subtle)', 
                                paddingBottom: '1rem', 
                                margin: 0 
                            }}>
                                ⚙️ {t('customer.orderConfigs')}
                            </h3>
                            
                            {/* Branch Selection */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: '900', color: theme?.primary || 'var(--accent)', textTransform: 'uppercase', letterSpacing: '2px' }}>
                                        {t('customer.selectSubCustomer')}
                                    </label>
                                    <button 
                                        type="button" 
                                        onClick={() => navigate('/customer/subs')}
                                        style={{ 
                                            background: 'none', 
                                            border: 'none', 
                                            color: theme?.primary || 'var(--accent)', 
                                            cursor: 'pointer', 
                                            fontSize: '0.75rem', 
                                            fontWeight: '900', 
                                            letterSpacing: '1px',
                                            textTransform: 'uppercase',
                                            textDecoration: 'underline',
                                            padding: 0
                                        }}
                                    >
                                        ➕ {t('customer.addSubAccount') || 'ŞUBE EKLE'}
                                    </button>
                                </div>
                                <select 
                                    value={selectedSub?.id || ''} 
                                    onChange={(e) => {
                                        const sub = subCustomers.find(s => s.id === parseInt(e.target.value));
                                        setSelectedSub(sub);
                                    }}
                                    style={{ padding: '1.2rem', background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '4px', color: 'var(--input-color)', fontSize: '1.1rem', fontWeight: '900', outline: 'none' }}
                                    required
                                >
                                    <option value="" style={{ background: 'var(--royal)', color: 'var(--text-primary)' }}>{t('customer.pleaseSelectBranch')}</option>
                                    {subCustomers.map(sub => (
                                        <option key={sub.id} value={sub.id} style={{ background: 'var(--royal)', color: 'var(--text-primary)' }}>
                                            {sub.name.toUpperCase()} - {sub.location}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Fabric, Color & Delivery Date Options Row */}
                            <div style={{ display: 'grid', gridTemplateColumns: isMobileView ? '1fr' : '1fr 1fr 1fr', gap: '2rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '2px' }}>{t('customer.fabric')}</label>
                                    <select 
                                        value={formData.fabric} 
                                        onChange={(e) => setFormData({...formData, fabric: e.target.value})}
                                        style={{ padding: '1.2rem', background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '4px', color: 'var(--input-color)', fontSize: '1rem', fontWeight: '700', outline: 'none' }}
                                    >
                                        <option style={{ background: 'var(--royal)', color: 'var(--text-primary)' }}>Technical Cotton Pique</option>
                                        <option style={{ background: 'var(--royal)', color: 'var(--text-primary)' }}>Organic Ribbed Cotton</option>
                                        <option style={{ background: 'var(--royal)', color: 'var(--text-primary)' }}>Premium Microfibre</option>
                                    </select>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '2px' }}>{t('customer.color')}</label>
                                    <input 
                                        type="text" 
                                        value={formData.color} 
                                        onChange={(e) => setFormData({...formData, color: e.target.value})}
                                        style={{ padding: '1.2rem', background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '4px', color: 'var(--input-color)', fontSize: '1rem', fontWeight: '700', outline: 'none' }}
                                    />
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '2px' }}>{t('customer.deliveryDate')}</label>
                                    <input 
                                        type="date"
                                        value={formData.deliveryDate}
                                        onChange={(e) => setFormData({...formData, deliveryDate: e.target.value})}
                                        style={{ padding: '1.2rem', background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '4px', color: 'var(--input-color)', fontSize: '1rem', outline: 'none' }}
                                    />
                                </div>
                            </div>

                            {/* Notes Textarea */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '2px' }}>{t('customer.notes')}</label>
                                <textarea 
                                    rows="3"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                    placeholder={t('customer.placeholders.notes')}
                                    style={{ padding: '1.2rem', background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '4px', color: 'var(--input-color)', fontSize: '1rem', resize: 'none', outline: 'none' }}
                                />
                            </div>
                        </div>

                        {/* Submit Actions */}
                        <div style={{ display: 'flex', flexDirection: isMobileView ? 'column' : 'row', gap: '1rem', marginTop: '1rem', width: '100%' }}>
                            <button type="submit" style={{ flex: 2, padding: isMobileView ? '1.2rem 1.5rem' : '1.8rem', fontSize: isMobileView ? '0.85rem' : '1.1rem', letterSpacing: '2px', background: theme?.primary || 'var(--accent)', color: brand === 'ZARA' ? 'var(--midnight)' : 'var(--text-primary)', border: 'none', borderRadius: '100px', fontWeight: '950', cursor: 'pointer', boxShadow: 'none', transition: 'all 0.3s ease' }}>
                                {t('customer.submitOrder').toUpperCase()}
                            </button>
                            <button type="button" onClick={() => navigate('/customer')} style={{ flex: 1, padding: isMobileView ? '1.2rem' : '1.8rem', borderRadius: '100px', border: '1px solid var(--input-border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                {t('common.cancel')}
                            </button>
                        </div>
                    </div>
                </div>
            </form>

            {/* Interactive Zoom Lightbox Modal */}
            {isLightboxOpen && (
                <div 
                    onClick={() => setIsLightboxOpen(false)}
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
                            onClick={() => setIsLightboxOpen(false)}
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
                            src={activeImage || activeModel?.img} 
                            alt={activeModel?.title}
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

export default CustomerOrderForm;

