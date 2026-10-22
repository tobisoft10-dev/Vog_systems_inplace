import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../services/apiConfig';

const ProductCatalog = () => {
  const { t, themeMode } = useLanguage();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('ALL');

  const isLight = themeMode === 'light';
  const glassBg = isLight ? 'rgba(15, 23, 42, 0.02)' : 'rgba(255, 255, 255, 0.02)';
  const glassBorder = isLight ? 'rgba(15, 23, 42, 0.05)' : 'rgba(255, 255, 255, 0.05)';
  const inputBg = isLight ? 'rgba(15, 23, 42, 0.03)' : 'rgba(255, 255, 255, 0.03)';
  const inputBorder = isLight ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.1)';
  const optionBg = isLight ? '#ffffff' : '#0a0f1e';
  const optionColor = isLight ? 'var(--text-primary)' : '#ffffff';
  const rowHoverBg = isLight ? 'rgba(15, 23, 42, 0.04)' : 'rgba(255, 255, 255, 0.05)';

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/master-products`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setProducts(data.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         p.barcode.includes(searchTerm) ||
                         (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesBrand = selectedBrand === 'ALL' || p.brand === selectedBrand;
    return matchesSearch && matchesBrand;
  });

  const getBrandAccent = (brand) => {
    const b = (brand || '').toUpperCase();
    if (b === 'YAMAHA') return '#FF9F0A';
    if (b === 'ZARA') return isLight ? '#0f172a' : '#ffffff';
    if (b === 'FORD') return '#0066FF';
    if (b === 'AUDI') return '#E50914';
    if (b === 'SEAT') return '#FF9F0A';
    return 'var(--accent)';
  };

  return (
    <div className="product-catalog-premium" style={{ width: '100%', padding: '2rem 4rem 5rem', maxWidth: '1600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '4rem', flexWrap: 'wrap', gap: '3rem' }}>
        <div>
          <button 
            onClick={() => navigate('/admin')}
            style={{ 
                background: glassBg, border: `1px solid ${glassBorder}`, color: 'var(--text-primary)', 
                padding: '0.8rem 1.8rem', borderRadius: '100px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '950',
                marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.8rem', transition: 'var(--transition)',
                letterSpacing: '1px'
            }}
            onMouseOver={e => e.currentTarget.style.background = 'var(--border-subtle)'}
            onMouseOut={e => e.currentTarget.style.background = ''}
          >
            ← ANA PANEL
          </button>
          <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', marginBottom: '1rem', color: 'var(--text-primary)', letterSpacing: '-3px', fontWeight: '950', lineHeight: '1' }}>{t('admin.catalog.title')}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', fontWeight: '500' }}>{t('admin.catalog.desc')}</p>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', width: '100%', maxWidth: '800px', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
                <span style={{ position: 'absolute', left: '1.5rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1.2rem', opacity: 0.5 }}>🔍</span>
                <input 
                    type="text" 
                    placeholder="Ürün adı, barkod veya model ara..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        width: '100%', padding: '1.3rem 1.5rem 1.3rem 4rem', borderRadius: '2rem', background: inputBg,
                        border: `1px solid ${inputBorder}`, color: 'var(--text-primary)', outline: 'none', fontSize: '1rem', fontWeight: '800',
                        boxShadow: 'var(--laminar-shadow)', transition: '0.3s'
                    }}
                />
            </div>
            <select 
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                style={{ 
                    padding: '1.3rem 2.5rem', borderRadius: '2rem', background: inputBg, 
                    border: `1px solid ${inputBorder}`, color: 'var(--text-primary)', fontWeight: '950', cursor: 'pointer', outline: 'none',
                    boxShadow: 'var(--laminar-shadow)', transition: '0.3s'
                }}
            >
                <option value="ALL" style={{ background: optionBg, color: optionColor }}>TÜM MARKALAR</option>
                <option value="ZARA" style={{ background: optionBg, color: optionColor }}>ZARA</option>
                <option value="SEAT" style={{ background: optionBg, color: optionColor }}>SEAT</option>
                <option value="FORD" style={{ background: optionBg, color: optionColor }}>FORD</option>
                <option value="AUDI" style={{ background: optionBg, color: optionColor }}>AUDI</option>
            </select>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '2.5rem', borderRadius: '3rem', border: `1px solid ${glassBorder}`, background: glassBg, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '10rem', textAlign: 'center' }}>
              <div className="spinner" style={{ width: '50px', height: '50px', border: `5px solid ${isLight ? 'rgba(15,23,42,0.1)' : 'rgba(255,255,255,0.1)'}`, borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 2rem' }}></div>
              <div style={{ fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: '900', letterSpacing: '2px' }}>KATALOG YÜKLENİYOR...</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
              <div className="table-responsive">
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: 'var(--text-primary)', minWidth: '1200px' }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${isLight ? 'rgba(15,23,42,0.08)' : 'rgba(255,255,255,0.15)'}` }}>
                      <th style={{ padding: '1.2rem 1.5rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '1.5px', fontWeight: '900' }}>MODEL KODU</th>
                      <th style={{ padding: '1.2rem 1.5rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '1.5px', fontWeight: '900' }}>ÜRÜN ADI</th>
                      <th style={{ padding: '1.2rem 1.5rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '1.5px', fontWeight: '900' }}>MARKA</th>
                      <th style={{ padding: '1.2rem 1.5rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '1.5px', fontWeight: '900' }}>RENK / BEDEN</th>
                      <th style={{ padding: '1.2rem 1.5rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '1.5px', fontWeight: '900' }}>BARKOD</th>
                      <th style={{ padding: '1.2rem 1.5rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '1.5px', fontWeight: '900' }}>FİYAT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length > 0 ? filteredProducts.map((product) => {
                      const brandAccent = getBrandAccent(product.brand);
                      return (
                        <tr key={product.id} style={{ borderBottom: `1px solid ${isLight ? 'rgba(15,23,42,0.03)' : 'rgba(255,255,255,0.03)'}`, transition: '0.3s' }} className="table-row-hover">
                          <td style={{ padding: '1.2rem 1.5rem', fontWeight: '950', fontSize: '1rem', color: brandAccent }}>{product.sku}</td>
                          <td style={{ padding: '1.2rem 1.5rem', color: 'var(--text-primary)', fontWeight: '700', fontSize: '1rem' }}>{product.product_name}</td>
                          <td style={{ padding: '1.2rem 1.5rem' }}>
                            <span style={{ 
                              padding: '0.4rem 1rem', 
                              borderRadius: '100px', 
                              background: `${brandAccent}15`, 
                              fontSize: '0.75rem', 
                              fontWeight: '950', 
                              color: brandAccent, 
                              border: `1px solid ${brandAccent}30`,
                              letterSpacing: '0.5px'
                            }}>
                              {product.brand}
                            </span>
                          </td>
                          <td style={{ padding: '1.2rem 1.5rem', color: 'var(--text-muted)', fontWeight: '800', fontSize: '0.95rem' }}>{product.color} <span style={{ color: 'var(--text-primary)' }}>/ {product.size}</span></td>
                          <td style={{ padding: '1.2rem 1.5rem', color: 'var(--color-info)', fontWeight: '950', fontSize: '1rem', letterSpacing: '0.5px' }}>{product.barcode}</td>
                          <td style={{ padding: '1.2rem 1.5rem', color: 'var(--color-success)', fontWeight: '950', fontSize: '1.15rem' }}>{product.price} <span style={{ fontSize: '0.75rem' }}>TL</span></td>
                        </tr>
                      );
                    }) : (
                      <tr><td colSpan="6" style={{ padding: '8rem', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '950', fontSize: '1.5rem' }}>KATALOGDA ÜRÜN BULUNAMADI</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
          </div>
        )}
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .table-row-hover:hover { background: ${rowHoverBg} !important; }
      `}</style>
    </div>
  );
};

export default ProductCatalog;
