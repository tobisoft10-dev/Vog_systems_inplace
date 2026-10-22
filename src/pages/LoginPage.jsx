import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import API_BASE_URL from '../services/apiConfig';

const LoginPage = () => {
  const { t, setCurrentUser, themeMode } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 900);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: email,
          password: password,
          database_name: 'vog_db'
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setCurrentUser({
          role: data.role.toLowerCase(), // 'admin' or 'customer'
          name: data.role === 'ADMIN' ? 'System Admin' : `${data.brand} Global Operations`,
          id: data.role === 'ADMIN' ? 'ADM-01' : `CUST-${data.brand}`,
          brand: data.brand,
          token: data.token,
          isParent: data.role !== 'ADMIN'
        });
        
        if (data.role.toLowerCase() === 'admin') {
          navigate('/admin');
        } else {
          navigate('/customer');
        }
      } else {
        setErrorMsg(data.message || 'Giriş başarısız. Bilgilerinizi kontrol edin.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setErrorMsg('Sunucu bağlantı hatası oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      background: 'var(--bg-primary)',
      overflow: 'hidden'
    }}>
      {/* LEFT PANEL - HIGH END EDITORIAL IMAGE */}
      {!isMobile && (
        <div style={{
          flex: '1.2',
          position: 'relative',
          backgroundImage: `url('/vog_images/vog_login_hero.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 30%'
        }}>
          {/* Subtle gradient overlay to blend into the right panel */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: themeMode === 'light' 
              ? 'linear-gradient(to right, rgba(250,250,250,0.1), rgba(250,250,250,1))' 
              : 'linear-gradient(to right, rgba(5,5,5,0.1), rgba(5,5,5,1))'
          }}></div>
          
          <div style={{
            position: 'absolute',
            bottom: '4rem',
            left: '4rem',
            color: '#fff',
            zIndex: 10
          }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '3.5rem', fontWeight: '400', fontStyle: 'italic', marginBottom: '1rem', textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
              Elite Craftsmanship
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', letterSpacing: '4px', textTransform: 'uppercase', opacity: 0.8, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
              Defining Corporate Fashion Since 1994
            </p>
          </div>
        </div>
      )}

      {/* RIGHT PANEL - LOGIN FORM */}
      <div className="aurora" style={{
        flex: '1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '2rem' : '4rem',
        position: 'relative',
        background: 'transparent'
      }}>
        <div className="fade-in" style={{
          width: '100%',
          maxWidth: '440px',
          position: 'relative',
          zIndex: 10
        }}>
          
          <div style={{ marginBottom: '4rem', textAlign: 'left' }}>
            <img 
              src="/logo512.png" 
              alt="VOG" 
              style={{ height: '45px', marginBottom: '2.5rem', filter: themeMode === 'light' ? 'brightness(0)' : 'brightness(0) invert(1)' }} 
            />
            <h1 style={{ 
              fontFamily: 'var(--font-heading)', 
              fontSize: '2.8rem', 
              fontWeight: '900', 
              marginBottom: '0.5rem', 
              color: 'var(--text-primary)', 
              letterSpacing: '-1px' 
            }}>
              <span className="gradient-text">Welcome</span> Back.
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: '600' }}>
              {t('auth.title')} / GLOBAL PORTAL
            </p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem' }}>
            <div>
              <label style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.6rem', display: 'block', letterSpacing: '1px' }}>
                {t('auth.email')} / USERNAME
              </label>
              <input 
                type="text" 
                placeholder="zara@vogtekstil.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '1.2rem 1.5rem',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--input-border)',
                  borderRadius: '4px',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  transition: 'all 0.3s ease',
                  boxShadow: 'var(--laminar-shadow)'
                }}
                onFocus={(e) => {
                  e.target.style.border = '1px solid var(--accent)';
                  e.target.style.boxShadow = '0 0 15px var(--accent-glow)';
                }}
                onBlur={(e) => {
                  e.target.style.border = '1px solid var(--input-border)';
                  e.target.style.boxShadow = 'var(--laminar-shadow)';
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.6rem', display: 'block', letterSpacing: '1px' }}>
                {t('auth.password')}
              </label>
              <div style={{ position: 'relative', width: '100%' }}>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '1.2rem 4rem 1.2rem 1.5rem',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--input-border)',
                    borderRadius: '4px',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontSize: '0.95rem',
                    fontWeight: '500',
                    transition: 'all 0.3s ease',
                    boxShadow: 'var(--laminar-shadow)'
                  }}
                  onFocus={(e) => {
                    e.target.style.border = '1px solid var(--accent)';
                    e.target.style.boxShadow = '0 0 15px var(--accent-glow)';
                  }}
                  onBlur={(e) => {
                    e.target.style.border = '1px solid var(--input-border)';
                    e.target.style.boxShadow = 'var(--laminar-shadow)';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '1.2rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.2rem',
                    outline: 'none',
                    transition: 'color 0.2s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                  onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.815 7.815 3.15 3.15m-3.15-3.15-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div style={{
                background: 'rgba(255, 77, 77, 0.05)',
                borderLeft: '3px solid #ff4d4d',
                color: '#ff4d4d',
                padding: '1rem 1.2rem',
                fontSize: '0.8rem',
                fontWeight: '600',
                marginTop: '0.5rem',
                letterSpacing: '0.5px'
              }}>
                {errorMsg}
              </div>
            )}

            <button type="submit" className="login-btn" disabled={loading} style={{ 
              marginTop: '1.5rem', 
              width: '100%', 
              borderRadius: '4px', 
              padding: '1.4rem', 
              background: '#ffffff', 
              color: '#000000', 
              fontSize: '0.9rem', 
              letterSpacing: '3px', 
              fontWeight: '900', 
              textTransform: 'uppercase',
              opacity: loading ? 0.7 : 1, 
              cursor: loading ? 'not-allowed' : 'pointer', 
              border: 'none', 
              transition: 'all 0.3s ease',
              boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
            }}
            onMouseOver={(e) => {
              if(!loading) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 15px 25px rgba(0,0,0,0.2)';
                e.currentTarget.style.background = 'var(--accent)';
                e.currentTarget.style.color = '#000000';
              }
            }}
            onMouseOut={(e) => {
              if(!loading) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
                e.currentTarget.style.background = '#ffffff';
                e.currentTarget.style.color = '#000000';
              }
            }}>
              {loading ? 'BAĞLANILIYOR...' : 'PANELE GİT'}
            </button>
          </form>

          <div style={{ 
            marginTop: '3.5rem', 
            paddingTop: '2rem', 
            borderTop: '1px solid var(--border-subtle)', 
            fontSize: '0.75rem', 
            color: 'var(--text-secondary)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <p style={{ margin: 0 }}>{t('auth.noAccount')}</p>
            <span style={{ fontWeight: '800', letterSpacing: '1px' }}>VOG-SEC-1</span>
          </div>
        </div>
      </div>

      <style>{`
        .fade-in {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
