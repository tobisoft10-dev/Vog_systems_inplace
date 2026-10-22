import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { generateProposalPDF } from '../services/proposalService';
import { productsData } from '../data/productsData';

const ProductsPage = () => {
  const { t, lang } = useLanguage();
  const [view, setView] = useState('categories'); // 'categories', 'products', 'details'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Detail view form state
  const [customColor, setCustomColor] = useState('');
  const [customFabric, setCustomFabric] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [selectedSizesQty, setSelectedSizesQty] = useState({});
  const [activeImage, setActiveImage] = useState('');
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);

  // Async visualizer states
  const [isGenerating, setIsGenerating] = useState(null);
  const [genStatus, setGenStatus] = useState('');

  const products = productsData.map(p => ({
    ...p,
    category: t(`products.categories.${p.categoryKey}`)
  }));

  const categoriesList = [
    {
      key: 'tshirts',
      title: t('products.categories.tshirts'),
      subtitle: {
        en: "Legio & Performance T-Shirts",
        tr: "Legio & Performans T-Shirtler"
      },
      img: '/vog_images/cat_tshirts.jpg',
      desc: {
        en: "Combed cotton and performance polyester blend t-shirts for motorsport and corporate events.",
        tr: "Motor sporları ve kurumsal etkinlikler için penye pamuk ve performans karışımlı t-shirtler."
      }
    },
    {
      key: 'polos',
      title: t('products.categories.polos'),
      subtitle: {
        en: "Audi & SEAT Premium Polo Shirts",
        tr: "Audi & SEAT Premium Polo Yaka Tişörtler"
      },
      img: '/vog_images/cat_polos.jpg',
      desc: {
        en: "High-end pique knit corporate polos with contrast details and bespoke chest logo embroideries.",
        tr: "Kontrast detaylı ve göğüs nakışlı yüksek kaliteli pike örgü kurumsal polo tişörtler."
      }
    },
    {
      key: 'caps',
      title: t('products.categories.caps'),
      subtitle: {
        en: "Corporate & Teamwear Caps",
        tr: "Kurumsal ve Takım Şapkaları"
      },
      img: '/vog_images/cat_caps.jpg',
      desc: {
        en: "Structured cotton twill caps with brass buckles and embroidered letter branding.",
        tr: "Pirinç tokalı ve nakışlı harf markalamalı, yapılandırılmış pamuklu dimi şapkalar."
      }
    },
    {
      key: 'jackets',
      title: t('products.categories.jackets'),
      subtitle: {
        en: "Azuree & Corporate Windbreakers",
        tr: "Azuree & Kurumsal Rüzgarlıklar"
      },
      img: '/vog_images/cat_jackets.jpg',
      desc: {
        en: "Lightweight windproof jackets and storm parkas engineered for field personnel protection.",
        tr: "Saha personelinin korunması için tasarlanmış hafif, rüzgar geçirmez ceketler ve parkalar."
      }
    },
    {
      key: 'workwears',
      title: t('products.categories.workwears'),
      subtitle: {
        en: "Siemens Utility Work Jacket Series",
        tr: "Siemens Teknisyen İş Montları"
      },
      img: '/vog_images/cat_workwears.jpg',
      desc: {
        en: "Double-stitched canvas workwear with reflective safety stripes and utility storage.",
        tr: "Reflektörlü güvenlik şeritlerine ve işlevsel ceplere sahip çift dikişli kanvas iş kıyafetleri."
      }
    },
    {
      key: 'school',
      title: t('products.categories.school'),
      subtitle: {
        en: "College Varsity Blazers",
        tr: "Kolej Montları ve Okul Üniformaları"
      },
      img: '/vog_images/cat_school.jpg',
      desc: {
        en: "Prestigious school uniforms, varsity jackets, and wool-blend crest blazers.",
        tr: "Saygın okul üniformaları, kolej montları ve yün karışımlı armalı blazer ceketler."
      }
    },
    {
      key: 'sweatshirts',
      title: t('products.categories.sweatshirts'),
      subtitle: {
        en: "Heavy Fleece Hoodies & Sweaters",
        tr: "Kalın Polar Kapüşonlu ve Sweatshirtler"
      },
      img: '/vog_images/cat_sweatshirts.jpg',
      desc: {
        en: "Warm athletic hoodies with brushed backing, drawstring adjustments, and kangaroo pouch pocket.",
        tr: "Şardonlu polar astarlı, büzme ipli ve kanguru cepli sıcak tutan spor kapüşonlular."
      }
    },
    {
      key: 'shirts',
      title: t('products.categories.shirts'),
      subtitle: {
        en: "Jeep Classic Oxford Shirts",
        tr: "Jeep Klasik Oxford Gömlekler"
      },
      img: '/vog_images/cat_shirts.jpg',
      desc: {
        en: "Structured oxford weave shirts with button-down collars and premium logo detailing.",
        tr: "Düğmeli yakalı ve premium logo detaylı, yapılandırılmış oxford örgü gömlekler."
      }
    },
    {
      key: 'wests',
      title: t('products.categories.wests'),
      subtitle: {
        en: "Corporate Vests & Bodywarmers",
        tr: "Kurumsal Yelekler ve Bodywarmer'lar"
      },
      img: '/vog_images/cat_wests.jpg',
      desc: {
        en: "Insulated or lightweight utility vests with custom company printing slots.",
        tr: "Özel şirket logosu baskı alanlarına sahip, yalıtımlı veya hafif fonksiyonel yelekler."
      }
    },
    {
      key: 'fleeces',
      title: t('products.categories.fleeces'),
      subtitle: {
        en: "Outdoor Polar Fleece Linings",
        tr: "Dış Mekan Polar Mont ve Astarları"
      },
      img: '/vog_images/cat_fleeces.jpg',
      desc: {
        en: "Anti-pilling thermal fleece pullovers and jackets for cold operations.",
        tr: "Soğuk hava operasyonları için tüylenme yapmayan termal polar kazaklar ve ceketler."
      }
    },
    {
      key: 'ladies',
      title: t('products.categories.ladies'),
      subtitle: {
        en: "Ladies Fine Knit Dress Wear",
        tr: "Kadın İnce Örgü Kurumsal Giyim"
      },
      img: '/vog_images/cat_ladies.jpg',
      desc: {
        en: "Premium stretch ribbed knits and executive trousers tailored for female crew members.",
        tr: "Kadın mürettebat üyeleri için tasarlanmış premium esnek fitilli örgüler ve kurumsal pantolonlar."
      }
    },
    {
      key: 'pets',
      title: t('products.categories.pets'),
      subtitle: {
        en: "Companion Animal Couture",
        tr: "Evcil Hayvan Mont Tasarımları"
      },
      img: '/vog_images/cat_pets.jpg',
      desc: {
        en: "Custom padded logo vests and water-resistant companion animal puffers.",
        tr: "Özel elyaf dolgulu logolu yelekler ve suya dayanıklı evcil hayvan montları."
      }
    },
    {
      key: 'bags',
      title: t('products.categories.bags'),
      subtitle: {
        en: "Heavy Canvas Utility Backpacks",
        tr: "Dayanıklı Kanvas Sırt Çantaları"
      },
      img: '/vog_images/cat_bags.jpg',
      desc: {
        en: "Corporate branded laptop backpacks, tote bags, and canvas sports duffels.",
        tr: "Kurumsal markalı laptop sırt çantaları, bez çantalar ve kanvas spor çantaları."
      }
    }
  ];

  // Initialize detailed view states
  useEffect(() => {
    if (selectedProduct) {
      const initial = {};
      selectedProduct.sizes.forEach(sz => {
        initial[sz] = 0;
      });
      setSelectedSizesQty(initial);
      setCustomColor(selectedProduct.color.split(' / ')[0]);
      setCustomFabric(selectedProduct.fabric);
      setCustomNotes('');
      setActiveImage(selectedProduct.img);
    }
  }, [selectedProduct]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleProposal = async (e) => {
    if (e) e.preventDefault();
    if (!selectedProduct) return;

    setIsGenerating(selectedProduct.id);
    setGenStatus(t('products.status.ai'));

    try {
      // Step 1: AI Visualization
      let aiImageUrl = null;
      try {
        const { generateAIProductImage } = await import('../services/aiService');
        aiImageUrl = await generateAIProductImage(selectedProduct.aiPrompt, selectedProduct.img);
      } catch (aiErr) {
        console.warn('AI Visualization failed, utilizing original image:', aiErr);
        setGenStatus('Standard Visual loaded...');
        await new Promise(r => setTimeout(r, 1000));
      }

      // Step 2: Generate PDF proposal with customized options
      setGenStatus(t('products.status.pdf'));
      
      const customizedProduct = {
        ...selectedProduct,
        color: customColor || selectedProduct.color,
        fabric: customFabric || selectedProduct.fabric,
        notes: customNotes,
        selectedSizesQty: selectedSizesQty
      };

      await generateProposalPDF(customizedProduct, lang, t, aiImageUrl);
    } catch (error) {
      console.error('Proposal generation failed:', error);
      alert(t('pdf.error') || 'Error creating proposal.');
    } finally {
      setIsGenerating(null);
      setGenStatus('');
    }
  };

  const handleSizeChange = (size, val) => {
    setSelectedSizesQty(prev => ({
      ...prev,
      [size]: Math.max(0, parseInt(val) || 0)
    }));
  };

  const calculateTotalQty = () => {
    return Object.values(selectedSizesQty).reduce((acc, curr) => acc + curr, 0);
  };

  // Filter products matching selected category key
  const filteredProducts = selectedCategory
    ? products.filter(p => p.categoryKey === selectedCategory)
    : [];

  return (
    <div className="products-page" style={{ paddingTop: '10rem', minHeight: '100vh', background: 'var(--midnight)', paddingBottom: '8rem' }}>
      <section className="container">
        
        {/* VIEW 1: CATEGORY LANDING GRID */}
        {view === 'categories' && (
          <div>
            <h1 className="animate-up revealed" style={{ 
              fontSize: 'clamp(3.5rem, 8vw, 5rem)', 
              marginBottom: '1.5rem',
              fontWeight: '950',
              letterSpacing: '-0.04em'
            }}>
              <span className="gradient-text">{t('products.title')}</span>
            </h1>
            <p className="animate-up delay-1 revealed" style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', marginBottom: '5rem', maxWidth: '700px' }}>
              {t('products.subtitle')}
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '2.5rem'
            }}>
              {categoriesList.map((cat, idx) => (
                <div 
                  key={cat.key}
                  onClick={() => {
                    setSelectedCategory(cat.key);
                    setView('products');
                  }}
                  className="glass-card category-card-premium"
                  style={{
                    position: 'relative',
                    height: '420px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: '1px solid var(--glass-border)',
                    boxShadow: 'var(--laminar-shadow)',
                    transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.transform = 'translateY(-10px)';
                    e.currentTarget.style.borderColor = 'var(--text-primary)';
                    const bg = e.currentTarget.querySelector('.cat-bg');
                    if(bg) bg.style.transform = 'scale(1.08)';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'var(--glass-border)';
                    const bg = e.currentTarget.querySelector('.cat-bg');
                    if(bg) bg.style.transform = 'scale(1)';
                  }}
                >
                  {/* Category Image Background */}
                  <div 
                    className="cat-bg"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundImage: `url(${cat.img})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                      zIndex: 1
                    }}
                  />
                  {/* Subtle Gradient Overlays */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to bottom, rgba(5, 7, 18, 0.2) 20%, rgba(5, 7, 18, 0.9) 90%)',
                    zIndex: 2
                  }} />

                  {/* Card Content Overlay */}
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '2.5rem',
                    zIndex: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.8rem'
                  }}>
                    <div className="category-card-subtitle" style={{
                      alignSelf: 'flex-start',
                      padding: '0.4rem 1.2rem',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '4px',
                      fontSize: '0.65rem',
                      fontWeight: '800',
                      letterSpacing: '1.5px',
                      color: '#ffffff',
                      textTransform: 'uppercase',
                      backdropFilter: 'blur(10px)'
                    }}>
                      {lang === 'tr' ? cat.subtitle.tr : cat.subtitle.en}
                    </div>
                    <h3 style={{ fontSize: '2rem', fontWeight: '900', color: '#ffffff', margin: 0, letterSpacing: '-1px' }}>
                      {cat.title}
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: 0, opacity: 0.8, lineHeight: '1.4' }}>
                      {lang === 'tr' ? cat.desc.tr : cat.desc.en}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 2: CATEGORY PRODUCTS LIST */}
        {view === 'products' && (
          <div>
            <button 
              onClick={() => setView('categories')}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)',
                padding: '0.8rem 1.8rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: '900',
                display: 'flex',
                alignItems: 'center',
                gap: '0.8rem',
                marginBottom: '4rem',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                transition: 'var(--transition)'
              }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'}
            >
              ← {lang === 'tr' ? 'KATEGORİLERE GÖNDER' : 'BACK TO CATEGORIES'}
            </button>

            <h2 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: '950', color: 'var(--text-primary)', marginBottom: '4rem', letterSpacing: '-2px' }}>
              {categoriesList.find(c => c.key === selectedCategory)?.title}
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '2.5rem'
            }}>
              {filteredProducts.map(p => (
                <div 
                  key={p.id}
                  onClick={() => {
                    setSelectedProduct(p);
                    setView('details');
                  }}
                  className="glass-card"
                  style={{
                    borderRadius: '8px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: '1px solid var(--glass-border)',
                    boxShadow: 'var(--laminar-shadow)',
                    transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                    background: 'rgba(255,255,255,0.01)'
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.transform = 'translateY(-10px)';
                    e.currentTarget.style.borderColor = 'var(--text-primary)';
                    const overlay = e.currentTarget.querySelector('.inspect-overlay');
                    if (overlay) overlay.style.opacity = 1;
                    const img = e.currentTarget.querySelector('.prod-img');
                    if (img) img.style.transform = 'scale(1.05)';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'var(--glass-border)';
                    const overlay = e.currentTarget.querySelector('.inspect-overlay');
                    if (overlay) overlay.style.opacity = 0;
                    const img = e.currentTarget.querySelector('.prod-img');
                    if (img) img.style.transform = 'scale(1)';
                  }}
                >
                  <div style={{ aspectRatio: '3/4', overflow: 'hidden', position: 'relative', background: 'rgba(0,0,0,0.1)' }}>
                    <img 
                      className="prod-img"
                      src={p.img} 
                      alt={p.title} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.8s ease' }}
                    />
                    
                    {/* Hover Inspect Text Overlay */}
                    <div 
                      className="inspect-overlay"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(5, 7, 18, 0.7)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0,
                        transition: 'opacity 0.4s ease',
                        padding: '2rem',
                        textAlign: 'center'
                      }}
                    >
                      <span style={{
                        padding: '1rem 2rem',
                        background: 'var(--text-primary)',
                        color: 'var(--midnight)',
                        fontWeight: '900',
                        fontSize: '0.8rem',
                        letterSpacing: '1px',
                        borderRadius: '4px',
                        textTransform: 'uppercase'
                      }}>
                        🔎 {lang === 'tr' ? 'DETAYLARI İNCELE' : 'INSPECT DETAILS'}
                      </span>
                    </div>
                  </div>

                  <div style={{ padding: '2rem' }}>
                    <div style={{
                      display: 'inline-block',
                      padding: '0.3rem 0.8rem',
                      background: 'rgba(255,255,255,0.04)',
                      borderRadius: '4px',
                      fontSize: '0.65rem',
                      color: 'var(--text-secondary)',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      marginBottom: '0.8rem',
                      border: '1px solid var(--glass-border)'
                    }}>
                      {p.color.split(' / ')[0]}
                    </div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.5px' }}>
                      {p.title}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 3: B2B-STYLE PRODUCT DETAILS SPEC SHEET */}
        {view === 'details' && selectedProduct && (
          <div>
            <button 
              onClick={() => setView('products')}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)',
                padding: '0.8rem 1.8rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: '900',
                display: 'flex',
                alignItems: 'center',
                gap: '0.8rem',
                marginBottom: '4rem',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                transition: 'var(--transition)'
              }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'}
            >
              ← {lang === 'tr' ? 'KATEGORİ ÜRÜNLERİNE DÖN' : 'BACK TO PRODUCTS'}
            </button>

            <form onSubmit={handleProposal} className="order-split-grid">
              
              {/* LEFT COLUMN: Technical PDF Spec Sheet Card */}
              <div className="pdf-spec-sheet glass-card">
                <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ width: '4px', height: '35px', background: 'var(--text-primary)', borderRadius: '2px' }}></span>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-secondary)', letterSpacing: '2px', textTransform: 'uppercase' }}>
                        VOG {t('customer.productSpecSheet')}
                      </div>
                      <h2 style={{ fontSize: '1.4rem', fontWeight: '950', color: 'var(--text-primary)', letterSpacing: '-0.5px', marginTop: '0.2rem', lineHeight: '1.2' }}>
                        {selectedProduct.title}
                      </h2>
                    </div>
                  </div>
                </div>

                {/* Image Viewport (Click to Lightbox Zoom) */}
                <div 
                  onClick={() => {
                    setZoomScale(1);
                    setIsLightboxOpen(true);
                  }}
                  style={{
                    width: '100%',
                    aspectRatio: '3/4',
                    background: 'var(--input-bg)',
                    borderRadius: '8px',
                    border: '1px solid var(--input-border)',
                    overflow: 'hidden',
                    position: 'relative',
                    boxShadow: 'inset 0 4px 30px rgba(0, 0, 0, 0.1)',
                    cursor: 'zoom-in'
                  }}
                  onMouseOver={e => {
                    const overlay = e.currentTarget.querySelector('.zoom-overlay-text');
                    if (overlay) overlay.style.opacity = 1;
                  }}
                  onMouseOut={e => {
                    const overlay = e.currentTarget.querySelector('.zoom-overlay-text');
                    if (overlay) overlay.style.opacity = 0;
                  }}
                >
                  <img 
                    src={activeImage} 
                    alt={selectedProduct.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      padding: '1.2rem'
                    }}
                  />
                  {/* Zoom Overlay */}
                  <div 
                    className="zoom-overlay-text"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(0, 0, 0, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0,
                      transition: 'opacity 0.3s ease',
                      pointerEvents: 'none'
                    }}
                  >
                    <span style={{
                      background: 'var(--midnight)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--glass-border)',
                      padding: '0.8rem 1.6rem',
                      borderRadius: '4px',
                      fontWeight: '900',
                      fontSize: '0.8rem',
                      letterSpacing: '1px',
                      boxShadow: 'var(--laminar-shadow)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      🔍 {t('catalog.zoomImage') || 'ZOOM IMAGE'}
                    </span>
                  </div>
                  {/* Spec Sheet Watermark */}
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

                {/* Image Gallery Switcher */}
                <div>
                  <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '900', marginBottom: '0.8rem' }}>
                    📸 {lang === 'tr' ? 'ÜRÜN DETAY GÖRSELLERİ' : 'PRODUCT DETAIL IMAGES'}
                  </h4>
                  <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                    {selectedProduct.images.map((imgSrc, idx) => {
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
                            border: isSelected ? '2px solid var(--text-primary)' : '1px solid var(--input-border)',
                            padding: '0.2rem',
                            cursor: 'pointer',
                            overflow: 'hidden',
                            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                          }}
                          onMouseOver={e => {
                            if (!isSelected) e.currentTarget.style.borderColor = 'var(--text-primary)';
                          }}
                          onMouseOut={e => {
                            if (!isSelected) e.currentTarget.style.borderColor = 'var(--input-border)';
                          }}
                        >
                          <img 
                            src={imgSrc} 
                            alt={`Thumbnail ${idx}`} 
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Technical Product Info Footer */}
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: '800' }}>SKU / MODEL KODU:</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: '900' }}>VOG-PREM-{selectedProduct.id}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: '800' }}>KATEGORİ / CATEGORY:</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: '900', textTransform: 'uppercase' }}>{selectedProduct.category}</span>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Configuration Form & Sizes Table */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                
                {/* 1. Sizing Matrix measurements & Quantity inputs */}
                <div className="glass-card" style={{ padding: isMobileView ? '1.5rem' : '2.5rem', borderRadius: isMobileView ? '1.8rem' : '2.5rem', background: 'var(--glass)', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: isMobileView ? '1.2rem' : '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <h3 style={{ color: 'var(--text-primary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '3px', fontWeight: '950', margin: 0 }}>
                      {t('customer.sizeDistribution')}
                    </h3>
                    <div style={{ background: 'var(--text-primary)', color: 'var(--midnight)', padding: '0.6rem 1.8rem', borderRadius: '4px', fontWeight: '950', fontSize: '0.85rem' }}>
                      {t('customer.totalUnits').toUpperCase()}: {calculateTotalQty()}
                    </div>
                  </div>

                  {/* Dynamic Sizing Matrix Table / Cards */}
                  {isMobileView ? (
                    <div className="mobile-size-container">
                      {selectedProduct.sizes.map((size, sizeIdx) => {
                        const isColHighlighted = (selectedSizesQty[size] || 0) > 0;
                        const { headers, rows } = selectedProduct.measurements;
                        const specNames = headers.slice(1);
                        const sizeRow = rows.find(r => r[0] === size) || rows[sizeIdx] || [];
                        const specValuesString = specNames.map((specName, specIdx) => {
                          const val = sizeRow[specIdx + 1] || '---';
                          const displaySpecName = specName.split(' / ')[0] || specName;
                          const cleanVal = typeof val === 'string' && val.toLowerCase().includes('cm') ? val : `${val} cm`;
                          return `${displaySpecName}: ${cleanVal}`;
                        }).join(' | ');

                        return (
                          <div 
                            key={size} 
                            className={`mobile-size-card ${isColHighlighted ? 'active' : ''}`}
                          >
                            <div className="mobile-size-info">
                              <span className="mobile-size-label">{size}</span>
                              <span className="mobile-size-specs">{specValuesString}</span>
                            </div>
                            
                            <div className={`mobile-stepper ${isColHighlighted ? 'active' : ''}`}>
                              <button
                                type="button"
                                className="stepper-btn"
                                onClick={() => handleSizeChange(size, (selectedSizesQty[size] || 0) - 1)}
                              >
                                ➖
                              </button>
                              <input
                                type="number"
                                className="stepper-input"
                                min="0"
                                value={selectedSizesQty[size] !== undefined ? selectedSizesQty[size] : 0}
                                onChange={(e) => handleSizeChange(size, e.target.value)}
                              />
                              <button
                                type="button"
                                className="stepper-btn"
                                onClick={() => handleSizeChange(size, (selectedSizesQty[size] || 0) + 1)}
                              >
                                ➕
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ marginTop: '0.5rem' }}>
                      <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1rem', fontWeight: '900' }}>
                        📐 {t('customer.sizeChartTable')}
                      </h4>
                      <div style={{ overflowX: 'auto', borderRadius: '4px', border: '1px solid var(--glass-border)', background: 'var(--input-bg)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '550px' }}>
                          <thead>
                            <tr style={{ background: 'var(--border-subtle)', borderBottom: '1px solid var(--glass-border)' }}>
                              <th style={{ padding: '1.2rem 1rem', color: 'var(--text-secondary)', fontWeight: '800', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', borderRight: '1px solid var(--border-subtle)', width: '150px' }}>
                                SPEC / ÖLÇÜLER
                              </th>
                              {selectedProduct.sizes.map((size) => {
                                const isColHighlighted = (selectedSizesQty[size] || 0) > 0;
                                return (
                                  <th 
                                    key={size} 
                                    style={{ 
                                      padding: '1.2rem 0.8rem', 
                                      color: isColHighlighted ? 'var(--text-primary)' : 'var(--text-secondary)', 
                                      fontWeight: '950', 
                                      fontSize: '0.9rem', 
                                      textAlign: 'center',
                                      background: isColHighlighted ? 'var(--border-subtle)' : 'transparent',
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
                            {selectedProduct.measurements.headers.slice(1).map((specName, specIdx) => (
                              <tr key={specName} style={{ borderBottom: '1px solid var(--border-subtle)', background: 'transparent' }}>
                                <td style={{ padding: '1rem 1.2rem', color: 'var(--text-primary)', fontWeight: '700', fontSize: '0.75rem', borderRight: '1px solid var(--border-subtle)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                  {specName}
                                </td>
                                {selectedProduct.sizes.map((size, sizeIdx) => {
                                  const isColHighlighted = (selectedSizesQty[size] || 0) > 0;
                                  const sizeRow = selectedProduct.measurements.rows.find(r => r[0] === size) || selectedProduct.measurements.rows[sizeIdx] || [];
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
                                        transition: 'all 0.3s ease'
                                      }}
                                    >
                                      {specValue}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                            
                            {/* Quantities Row */}
                            <tr style={{ background: 'transparent', borderTop: '2px solid var(--glass-border)' }}>
                              <td style={{ padding: '1.2rem', color: 'var(--text-primary)', fontWeight: '950', fontSize: '0.8rem', letterSpacing: '1px', textTransform: 'uppercase', borderRight: '1px solid var(--border-subtle)' }}>
                                ✍️ {t('customer.quantity') || 'MİKTAR / QTY'}
                              </td>
                              {selectedProduct.sizes.map((size) => {
                                const isColHighlighted = (selectedSizesQty[size] || 0) > 0;
                                return (
                                  <td 
                                    key={size} 
                                    style={{ 
                                      padding: '0.8rem', 
                                      background: isColHighlighted ? 'var(--border-subtle)' : 'transparent',
                                      textAlign: 'center'
                                    }}
                                  >
                                    <input 
                                      type="number" 
                                      min="0"
                                      value={selectedSizesQty[size] !== undefined ? selectedSizesQty[size] : 0} 
                                      onChange={(e) => handleSizeChange(size, e.target.value)}
                                      style={{ 
                                        width: '55px',
                                        padding: '0.6rem 0.2rem', 
                                        textAlign: 'center', 
                                        background: 'var(--input-bg)', 
                                        border: isColHighlighted ? '1px solid var(--text-primary)' : '1px solid var(--input-border)', 
                                        borderRadius: '0.6rem', 
                                        color: 'var(--input-color)', 
                                        fontWeight: '950', 
                                        fontSize: '1.1rem',
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
                  )}
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', margin: 0, opacity: 0.8 }}>
                    ℹ️ {t('customer.measurementTolerance')}
                  </p>
                </div>

                {/* 2. Specifications configuration card */}
                <div className="glass-card" style={{ padding: isMobileView ? '1.5rem' : '2.5rem', borderRadius: isMobileView ? '1.8rem' : '2.5rem', background: 'var(--glass)', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: isMobileView ? '1.2rem' : '2rem' }}>
                  <h3 style={{ color: 'var(--text-primary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '3px', fontWeight: '950', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem', margin: 0 }}>
                    🛠️ {lang === 'tr' ? 'TASARIM VE KUMAŞ ÖZELLEŞTİRME' : 'FABRIC & DESIGN REVISIONS'}
                  </h3>

                  {/* Fabric & Color Rows */}
                  <div style={{ display: 'grid', gridTemplateColumns: isMobileView ? '1fr' : '1fr 1fr', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: '950', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '2px' }}>
                        {t('customer.fabric')}
                      </label>
                      <select 
                        value={customFabric} 
                        onChange={(e) => setCustomFabric(e.target.value)}
                        style={{ padding: '1.2rem', background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '4px', color: 'var(--input-color)', fontSize: '1rem', fontWeight: '700', outline: 'none' }}
                      >
                        <option style={{ background: 'var(--royal)', color: 'var(--text-primary)' }}>Technical Cotton Pique</option>
                        <option style={{ background: 'var(--royal)', color: 'var(--text-primary)' }}>Organic Ribbed Cotton</option>
                        <option style={{ background: 'var(--royal)', color: 'var(--text-primary)' }}>Premium Microfibre</option>
                        <option style={{ background: 'var(--royal)', color: 'var(--text-primary)' }}>Heavy Duty Technical Fabric</option>
                        <option style={{ background: 'var(--royal)', color: 'var(--text-primary)' }}>Dry-fit Performance Mesh</option>
                        <option style={{ background: 'var(--royal)', color: 'var(--text-primary)' }}>Reflective Canvas Cotton</option>
                        <option style={{ background: 'var(--royal)', color: 'var(--text-primary)' }}>Premium Blazer Wool-blend</option>
                        <option style={{ background: 'var(--royal)', color: 'var(--text-primary)' }}>Quilted Pet Nylon</option>
                        <option style={{ background: 'var(--royal)', color: 'var(--text-primary)' }}>Cabin Crew Poly-wool</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: '950', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '2px' }}>
                        {t('customer.color')}
                      </label>
                      <input 
                        type="text" 
                        value={customColor} 
                        onChange={(e) => setCustomColor(e.target.value)}
                        style={{ padding: '1.2rem', background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '4px', color: 'var(--input-color)', fontSize: '1rem', fontWeight: '700', outline: 'none' }}
                      />
                    </div>
                  </div>

                  {/* Material Composition Display */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '950', color: 'var(--text-secondary)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                      🧬 {t('pdf.comp') || 'KUMAŞ BİLEŞİMİ / COMPOSITION'}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: '700' }}>
                      {selectedProduct.composition}
                    </div>
                  </div>
                </div>

                {/* 3. Design Vision Notes / Concept */}
                <div className="glass-card" style={{ padding: isMobileView ? '1.5rem' : '2.5rem', borderRadius: isMobileView ? '1.8rem' : '2.5rem', background: 'var(--glass)', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '950', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '2px' }}>
                    📝 {t('customer.notes') || 'TEKNİK AÇIKLAMA VE İSTEKLER / SPECIAL NOTES'}
                  </label>
                  <textarea 
                    rows="3"
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    placeholder={t('customer.placeholders.notes') || "Enter technical modifications, embroidery options, or package details..."}
                    style={{ padding: '1.2rem', background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '4px', color: 'var(--input-color)', fontSize: '1rem', resize: 'none', outline: 'none' }}
                  />
                </div>

                {/* 4. Action Buttons */}
                <div style={{ display: 'flex', flexDirection: isMobileView ? 'column' : 'row', gap: '1rem', width: '100%' }}>
                  <button 
                    type="submit" 
                    disabled={isGenerating !== null}
                    style={{ 
                      flex: 2, 
                      padding: isMobileView ? '1.2rem 1.5rem' : '1.8rem', 
                      fontSize: isMobileView ? '0.85rem' : '1.05rem', 
                      letterSpacing: '2px', 
                      background: isGenerating ? 'rgba(255,255,255,0.06)' : 'var(--text-primary)', 
                      color: isGenerating ? 'var(--text-muted)' : 'var(--midnight)', 
                      border: 'none', 
                      borderRadius: '4px', 
                      fontWeight: '950', 
                      cursor: isGenerating ? 'wait' : 'pointer', 
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '1rem'
                    }}
                    onMouseOver={(e) => { if (!isGenerating) { e.currentTarget.style.background = 'var(--text-secondary)'; } }}
                    onMouseOut={(e) => { if (!isGenerating) { e.currentTarget.style.background = 'var(--text-primary)'; } }}
                  >
                    {isGenerating && <div className="spinner-small" style={{ border: '2px solid var(--text-primary)', borderTopColor: 'transparent' }} />}
                    {isGenerating ? genStatus.toUpperCase() : (lang === 'tr' ? 'TEKLİF OLUŞTUR VE AI GÖRSELLEŞTİR ✨' : 'GENERATE PROPOSAL & AI VISUALIZATION ✨')}
                  </button>
                  
                  <button 
                    type="button" 
                    onClick={() => setView('products')} 
                    style={{ 
                      flex: 1, 
                      padding: isMobileView ? '1.2rem' : '1.8rem', 
                      borderRadius: '4px', 
                      border: '1px solid var(--glass-border)', 
                      background: 'rgba(255, 255, 255, 0.02)', 
                      color: 'var(--text-secondary)', 
                      cursor: 'pointer', 
                      fontWeight: '800', 
                      textTransform: 'uppercase', 
                      letterSpacing: '1px',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                    onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

      </section>

      {/* Interactive Zoom Lightbox Modal */}
      {isLightboxOpen && selectedProduct && (
        <div 
          onClick={() => setIsLightboxOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(4, 7, 18, 0.95)',
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
          {/* Lightbox Controls */}
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
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.15)',
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
            >
              ➕
            </button>
            <button 
              onClick={() => setZoomScale(prev => Math.max(prev - 0.25, 0.5))}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.15)',
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
            >
              ➖
            </button>
            <button 
              onClick={() => setZoomScale(1)}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.15)',
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
            >
              {t('catalog.reset') || 'RESET'}
            </button>
            <button 
              onClick={() => setIsLightboxOpen(false)}
              style={{
                background: 'rgba(212, 175, 55,0.15)',
                border: '1px solid rgba(212, 175, 55,0.3)',
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
            >
              {lang === 'tr' ? 'KAPAT' : 'CLOSE'}
            </button>
          </div>

          {/* Lightbox Image viewport */}
          <div 
            onClick={e => e.stopPropagation()}
            style={{
              width: '90%',
              height: '80%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'auto',
              borderRadius: '8px',
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.05)',
              padding: '2rem'
            }}
          >
            <img 
              src={activeImage} 
              alt={selectedProduct.title}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                transform: `scale(${zoomScale})`,
                transition: 'transform 0.25s ease'
              }}
            />
          </div>
        </div>
      )}

      {/* Embedded Spinner CSS */}
      <style>
        {`
          .spinner-small {
            width: 14px;
            height: 14px;
            border: 2px solid white;
            border-top-color: transparent;
            border-radius: 50%;
            animation: spin 0.6s linear infinite;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}
      </style>
    </div>
  );
};

export default ProductsPage;
