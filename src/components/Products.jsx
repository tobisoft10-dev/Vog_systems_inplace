import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import ProductCard from './ProductCard';
import API_BASE_URL from '../services/apiConfig';

const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=2000&auto=format&fit=crop', // Polo/Tee
  'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=2000&auto=format&fit=crop', // Outerwear
  'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=2000&auto=format&fit=crop', // Basic
  'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=2000&auto=format&fit=crop', // Collection
  'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?q=80&w=2000&auto=format&fit=crop', // Fashion
  'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=2000&auto=format&fit=crop'  // Accessory
];

const getProductImage = (title, brand) => {
  const t = (title || '').toLowerCase();
  const b = (brand || '').toLowerCase();
  
  if (b === 'audi' || t.includes('audi')) {
    if (t.includes('erkek') || t.includes('men')) return '/vog_images/audi_polo_2.jpg';
    if (t.includes('kadın') || t.includes('women')) return '/vog_images/audi_polo_3.jpg';
    if (t.includes('pantolon') || t.includes('pant')) return '/vog_images/cat_workwears.jpg';
    if (t.includes('e-tron') || t.includes('kırmızı') || t.includes('red')) return '/vog_images/audi_polo_4.jpg';
    if (t.includes('servis')) return '/vog_images/audi_polo_1.jpg';
    if (t.includes('dynamic')) return '/vog_images/audi_polo_1.jpg';
    return '/vog_images/audi_polo_1.jpg';
  }
  
  if (b === 'seat') {
    if (t.includes('jacket') || t.includes('ceket')) return '/vog_images/azuree_jacket.jpg';
    if (t.includes('pant') || t.includes('pants')) return '/vog_images/cat_workwears.jpg';
    return '/vog_images/cat_polos.jpg';
  }
  
  if (b === 'ford') {
    return '/vog_images/workwear_siemens.jpg';
  }
  
  if (b === 'zara') {
    return '/zara_item.jpg';
  }
  
  return '/vog_images/legio_tshirt.jpg';
};

const Products = () => {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [brands, setBrands] = useState([]);

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/master-products`);
        const result = await response.json();
        
        if (result.success && result.data.length > 0) {
          // De-duplicate products by product_name & brand to prevent multiple sizing listings
          const uniqueMap = {};
          result.data.forEach(item => {
            const key = `${item.product_name || item.sku}_${item.brand}`.toLowerCase();
            if (!uniqueMap[key] || (!uniqueMap[key].price && item.price)) {
              uniqueMap[key] = item;
            }
          });
          
          const uniqueList = Object.values(uniqueMap);
          const mapped = uniqueList.map((item) => {
            let title = item.product_name || item.sku;
            let img = getProductImage(title, item.brand);
            
            // Override title and image to be realistic for Ford
            if (item.brand === 'FORD') {
              title = 'Ford Service Technician Jacket';
              img = '/vog_images/products/workwears_153_primary.jpg';
            }
            
            // Override SEAT products to have real SEAT branded images (or workwears)
            if (item.brand === 'SEAT') {
              if (title.toLowerCase().includes('polo')) {
                title = 'SEAT Premium Staff Polo Shirt';
                img = '/vog_images/products/polos_38_primary.jpg';
              } else if (title.toLowerCase().includes('jacket') || title.toLowerCase().includes('mont')) {
                title = 'SEAT Technical Field Jacket';
                img = '/vog_images/products/workwears_148_primary.jpg';
              } else if (title.toLowerCase().includes('pants') || title.toLowerCase().includes('pantolon')) {
                title = 'SEAT Cargo Work Pants';
                img = '/vog_images/products/workwears_147_primary.jpg';
              }
            }
            
            // Zara override
            if (item.brand === 'ZARA') {
              title = 'Zara Ribbed Knit Green Polo';
              img = '/zara_item.jpg';
            }

            return {
              id: item.id,
              title,
              category: item.brand || 'VOG Premium',
              brand: item.brand,
              price: item.price,
              tag: item.color,
              img,
              barcode: item.barcode
            };
          });
          setProducts(mapped);
          
          const uniqueBrands = ['ALL', ...new Set(mapped.map(p => p.brand).filter(Boolean))];
          setBrands(uniqueBrands);
        }
      } catch (error) {
        console.error('Error fetching master data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMasterData();
  }, []);

  const filteredProducts = filter === 'ALL' 
    ? products 
    : products.filter(p => p.brand === filter);

  return (
    <section id="products" style={{ background: 'var(--midnight)', padding: '10rem 0', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: '40%', height: '100%', background: 'linear-gradient(to left, rgba(230,0,0,0.03), transparent)', pointerEvents: 'none' }}></div>
      
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8rem', flexWrap: 'wrap', gap: '3rem' }}>
          <div className="animate-up revealed">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ width: '40px', height: '2px', background: 'var(--color-info)' }}></div>
              <span style={{ color: 'var(--color-info)', fontWeight: '800', letterSpacing: '4px', fontSize: '0.75rem' }}>{t('products.collection') || 'EXCELLENCE'}</span>
            </div>
            <h2 style={{ fontSize: 'clamp(3.5rem, 8vw, 5.5rem)', marginBottom: '2rem', fontWeight: '900', color: 'var(--text-primary)', letterSpacing: '-3px', lineHeight: '0.9' }}>
              {t('products.title') || 'Master'}<br/>
              <span className="gradient-text">{t('products.catalog') || 'Catalogue'}</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.35rem', maxWidth: '700px', lineHeight: '1.8', fontWeight: '400' }}>
              {t('products.subtitle') || 'Explore our comprehensive master directory of premium textile products, engineered for performance and identity.'}
            </p>
          </div>
          
          <div className="animate-up revealed" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'flex-end' }}>
            <div style={{ padding: '1.2rem 3rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '100px', fontSize: '0.75rem', color: 'var(--text-primary)', background: 'rgba(255,255,255,0.03)', fontWeight: '800', letterSpacing: '4px', backdropFilter: 'blur(10px)' }}>
              LIVE RELEASES 2026
            </div>
            
            {/* Brand Filter */}
            {brands.length > 2 && (
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {brands.map(brand => (
                  <button
                    key={brand}
                    onClick={() => setFilter(brand)}
                    style={{
                      padding: '0.8rem 1.8rem',
                      background: filter === brand ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                      border: 'none',
                      borderRadius: '50px',
                      color: 'var(--text-primary)',
                      fontSize: '0.7rem',
                      fontWeight: '800',
                      letterSpacing: '2px',
                      cursor: 'pointer',
                      transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
                      boxShadow: filter === brand ? '0 10px 20px rgba(230,0,0,0.3)' : 'none'
                    }}
                  >
                    {brand.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '4rem' }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="shimmer" style={{ height: '500px', borderRadius: '3rem', background: 'rgba(255,255,255,0.02)' }}></div>
            ))}
          </div>
        ) : (
          <div className="grid-stack" style={{ gap: '4rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))
            ) : (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '10rem 0' }}>
                <div style={{ fontSize: '1.5rem', color: 'var(--text-secondary)' }}>No products found in this category.</div>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .shimmer {
          background: linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 75%);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </section>
  );
};

export default Products;
