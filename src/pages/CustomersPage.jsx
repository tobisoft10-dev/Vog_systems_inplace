import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../services/apiConfig';

const CustomersPage = () => {
  const { t, themeMode } = useLanguage();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const isLight = themeMode === 'light';
  const glassBg = isLight ? 'rgba(15, 23, 42, 0.02)' : 'rgba(255, 255, 255, 0.02)';
  const glassBorder = isLight ? 'rgba(15, 23, 42, 0.05)' : 'rgba(255, 255, 255, 0.05)';
  const inputBg = isLight ? 'rgba(15, 23, 42, 0.03)' : 'rgba(255, 255, 255, 0.03)';
  const inputBorder = isLight ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.1)';
  const modalBackdrop = isLight ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.9)';

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users`);
      const data = await res.json();
      if (data.success) {
        const mapped = data.data.filter(u => u.role === 'customer' || u.role === 'CUSTOMER').map((u, i) => {
          const name = u.brand || u.email.split('@')[0];
          return {
            id: `C-${(i+1).toString().padStart(2, '0')}`,
            name: name,
            region: 'Global',
            orders: Math.floor(Math.random() * 50) + 1,
            activeProjects: Math.floor(Math.random() * 5) + 1,
            logo: name.substring(0, 2).toUpperCase(),
            status: 'corporate',
            contact: u.email,
            email: u.email
          };
        });
        setCustomers(mapped.length > 0 ? mapped : [
            { id: 'C-01', name: 'Yamaha Motors', region: 'Global / Japan', orders: 24, activeProjects: 3, logo: 'YM', status: 'priority', contact: 'Kenji Suzuki', email: 'k.suzuki@yamaha.jp' },
            { id: 'C-02', name: 'Motul Global', region: 'Europe / France', orders: 115, activeProjects: 8, logo: 'MT', status: 'major', contact: 'Jean Dupont', email: 'j.dupont@motul.fr' }
        ]);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.region.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getBrandAccent = (name) => {
    const n = name.toUpperCase();
    if (n.includes('YAMAHA')) return '#FF9F0A';
    if (n.includes('ZARA')) return '#ffffff';
    if (n.includes('FORD')) return '#0066FF';
    if (n.includes('AUDI')) return '#E50914';
    return 'var(--accent)';
  };

  return (
    <div className="customers-page-premium" style={{ padding: '2rem 4rem 5rem', maxWidth: '1600px', margin: '0 auto' }}>
      <div style={{ marginBottom: '4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '3rem' }}>
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
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', marginBottom: '1rem', color: 'var(--text-primary)', letterSpacing: '-3px', fontWeight: '950', lineHeight: '1' }}>{t('admin.customers.title')}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', fontWeight: '500' }}>{t('admin.customers.desc')}</p>
        </div>

        <div style={{ position: 'relative', width: '100%', maxWidth: '500px' }}>
            <span style={{ position: 'absolute', left: '1.5rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1.2rem', opacity: 0.5 }}>🔍</span>
            <input 
                type="text" 
                placeholder="Müşteri veya bölge ara..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                    width: '100%', padding: '1.4rem 1.5rem 1.4rem 4rem', borderRadius: '4px', background: inputBg,
                    border: `1px solid ${inputBorder}`, color: 'var(--text-primary)', outline: 'none', fontSize: '1rem', fontWeight: '800',
                    boxShadow: 'var(--laminar-shadow)', transition: '0.3s'
                }}
            />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '2.5rem' }}>
        {filteredCustomers.map((customer, i) => {
          const brandAccent = getBrandAccent(customer.name);
          return (
             <div key={i} className="prism-glass holographic" style={{ 
              padding: '2.2rem 2rem', 
              borderRadius: '4px', 
              transition: 'var(--transition)',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden'
            }}
            onClick={() => setSelectedCustomer(customer)}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width) * 100;
              const y = ((e.clientY - rect.top) / rect.height) * 100;
              e.currentTarget.style.setProperty('--mouse-x', `${x}%`);
              e.currentTarget.style.setProperty('--mouse-y', `${y}%`);
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem' }}>
                <div style={{ 
                  fontSize: '1.1rem', 
                  fontWeight: '900',
                  background: `${brandAccent}15`, 
                  color: brandAccent,
                  width: '55px', 
                  height: '55px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  borderRadius: '4px', 
                  border: `1px solid ${brandAccent}30`,
                  boxShadow: `0 6px 15px ${brandAccent}15`
                }}>
                  {customer.logo}
                </div>
                <span style={{ 
                  fontSize: '0.65rem', 
                  fontWeight: '950', 
                  textTransform: 'uppercase', 
                  padding: '0.4rem 1rem', 
                  borderRadius: '100px', 
                  background: isLight ? 'rgba(15, 23, 42, 0.03)' : 'rgba(255,255,255,0.03)', 
                  color: customer.status === 'priority' ? '#ef4444' : 'var(--text-secondary)',
                  letterSpacing: '1px',
                  border: `1px solid ${customer.status === 'priority' ? 'rgba(239, 68, 68, 0.2)' : 'var(--border-subtle)'}`,
                }}>
                  {t(`admin.customers.statuses.${customer.status}`)}
                </span>
              </div>
              
              <h3 style={{ fontSize: '1.6rem', marginBottom: '0.3rem', color: 'var(--text-primary)', fontWeight: '950', letterSpacing: '-1px' }}>{customer.name}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700' }}>
                <span style={{ color: brandAccent }}>📍</span> {customer.region}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', paddingTop: '1.5rem', borderTop: `1px solid ${glassBorder}` }}>
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '900', textTransform: 'uppercase', marginBottom: '0.3rem', letterSpacing: '1px' }}>{t('admin.customers.totalOrders')}</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: '950', color: 'var(--text-primary)' }}>{customer.orders}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '900', textTransform: 'uppercase', marginBottom: '0.3rem', letterSpacing: '1px' }}>AKTİF PROJE</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: '950', color: brandAccent }}>{customer.activeProjects}</div>
                </div>
              </div>

              <button 
                className="btn-primary"
                style={{ 
                  width: '100%', 
                  marginTop: '1.8rem', 
                  padding: '1.1rem', 
                  borderRadius: '4px', 
                  fontSize: '0.75rem', 
                  fontWeight: '950', 
                  letterSpacing: '2px',
                  background: isLight ? '#0f172a' : 'rgba(255, 255, 255, 0.05)',
                  border: isLight ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#fffffe',
                  cursor: 'pointer',
                  transition: 'var(--transition)'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 10px 25px ${brandAccent}33`;
                  if (!isLight) e.currentTarget.style.background = brandAccent;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.background = isLight ? '#0f172a' : 'rgba(255, 255, 255, 0.05)';
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/customer');
                }}
              >
                {t('admin.customers.viewDashboard').toUpperCase()}
              </button>
            </div>
          );
        })}
        {filteredCustomers.length === 0 && (
            <div style={{ gridColumn: '1/-1', padding: '10rem', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '950', fontSize: '1.5rem' }}>
                ARAMA İLE EŞLEŞEN MÜŞTERİ BULUNAMADI
            </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedCustomer && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: modalBackdrop, backdropFilter: 'blur(30px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
              <div className="prism-glass holographic" style={{ width: '100%', maxWidth: '800px', padding: '5rem', borderRadius: '4rem', position: 'relative' }}>
                  <button onClick={() => setSelectedCustomer(null)} style={{ position: 'absolute', top: '3rem', right: '3rem', background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '2.5rem', cursor: 'pointer' }}>✕</button>
                  
                  <div style={{ display: 'flex', gap: '3rem', alignItems: 'center', marginBottom: '4rem' }}>
                      <div style={{ 
                        fontSize: '2rem', 
                        fontWeight: '900',
                        background: `${getBrandAccent(selectedCustomer.name)}15`, 
                        color: getBrandAccent(selectedCustomer.name),
                        width: '100px', 
                        height: '100px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        borderRadius: '4px', 
                        border: `1px solid ${getBrandAccent(selectedCustomer.name)}30`
                      }}>
                        {selectedCustomer.logo}
                      </div>
                      <div>
                          <h2 style={{ fontSize: '3.5rem', fontWeight: '950', color: 'var(--text-primary)', margin: 0, letterSpacing: '-2px' }}>{selectedCustomer.name}</h2>
                          <p style={{ color: getBrandAccent(selectedCustomer.name), fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', marginTop: '0.5rem' }}>{selectedCustomer.id} • STRATEJİK PARTNER</p>
                      </div>
                  </div>
 
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginBottom: '4rem' }}>
                      <div className="glass" style={{ padding: '2rem', borderRadius: '4px', background: isLight ? 'rgba(15, 23, 42, 0.03)' : 'rgba(255, 255, 255, 0.02)', border: `1px solid ${glassBorder}` }}>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: '900', marginBottom: '1rem', letterSpacing: '2px' }}>İLETİŞİM KİŞİSİ</div>
                          <div style={{ color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: '900' }}>{selectedCustomer.contact}</div>
                      </div>
                      <div className="glass" style={{ padding: '2rem', borderRadius: '4px', background: isLight ? 'rgba(15, 23, 42, 0.03)' : 'rgba(255, 255, 255, 0.02)', border: `1px solid ${glassBorder}` }}>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: '900', marginBottom: '1rem', letterSpacing: '2px' }}>E-POSTA ADRESİ</div>
                          <div style={{ color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: '900' }}>{selectedCustomer.email}</div>
                      </div>
                  </div>
 
                  <div style={{ display: 'flex', gap: '2rem' }}>
                      <button 
                        className="btn-primary" 
                        style={{ flex: 2, padding: '1.8rem', borderRadius: '4px', fontSize: '1rem', fontWeight: '950', cursor: 'pointer' }}
                        onClick={() => navigate('/customer')}
                      >
                        MÜŞTERİ PANELİNE GİT
                      </button>
                      <button 
                        style={{ flex: 1, padding: '1.8rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.1)', fontWeight: '950', cursor: 'pointer' }}
                        onClick={() => setSelectedCustomer(null)}
                      >
                        KAPAT
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default CustomersPage;


