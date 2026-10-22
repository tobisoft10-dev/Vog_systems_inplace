import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import MobileMenu from './MobileMenu';
import Footer from './Footer';
import { useLanguage } from '../context/LanguageContext';

const Layout = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { lang, toggleLanguage, t, currentUser, themeMode, toggleThemeMode } = useLanguage();
  const location = useLocation();
  const [showScrollTop, setShowScrollTop] = useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const portalPath = currentUser 
    ? (currentUser.role === 'admin' ? '/admin' : '/customer')
    : '/login';

  // Navbar portal button always goes to login for non-authenticated flows
  const navPortalPath = '/login';


  const isLight = themeMode === 'light';
  const navBg = isLight ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.05)';
  const navBorder = isLight ? 'rgba(15, 23, 42, 0.08)' : 'var(--glass-border)';
  const navShadow = isLight ? '0 15px 35px rgba(15, 23, 42, 0.05)' : '0 30px 60px rgba(0,0,0,0.4)';
  const logoFilter = isLight ? 'none' : 'brightness(0) invert(1) drop-shadow(0 0 8px rgba(255,255,255,0.2))';
  const portalBtnBg = isLight ? 'rgba(15, 23, 42, 0.03)' : 'rgba(255,255,255,0.03)';
  const portalBtnBorder = isLight ? 'rgba(15, 23, 42, 0.12)' : 'rgba(255,255,255,0.12)';

  const isHomePage = location.pathname === '/';

  return (
    <div className="layout">
      <nav className="glass navbar" style={{
        position: 'fixed',
        top: '1.5rem',
        left: '50%',
        transform: isHomePage && !showScrollTop ? 'translate(-50%, -120px)' : 'translateX(-50%)',
        opacity: isHomePage && !showScrollTop ? 0 : 1,
        pointerEvents: isHomePage && !showScrollTop ? 'none' : 'auto',
        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease',
        width: 'calc(100% - 4rem)',
        maxWidth: '1400px',
        padding: '0.8rem 3rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 100,
        borderRadius: '4px',
        border: `1px solid ${navBorder}`,
        background: navBg,
        backdropFilter: 'blur(40px) saturate(200%)',
        WebkitBackdropFilter: 'blur(40px) saturate(200%)',
        boxShadow: navShadow
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img 
            src="/logo512.png" 
            alt="VOG Logo" 
            className="nav-logo"
            style={{ 
              height: '42px', 
              filter: logoFilter,
              transition: 'var(--transition)'
            }} 
          />
        </Link>

        <div className="desktop-nav" style={{ display: 'flex', gap: '2.5rem', alignItems: 'center' }}>
          <Link to="/about" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.8 }}>{t('nav.about')}</Link>
          <Link to="/products" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.8 }}>{t('nav.products')}</Link>
          <Link to="/news" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.8 }}>{t('nav.news')}</Link>
          <Link to="/gallery" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.8 }}>{t('nav.gallery')}</Link>
          <Link to="/faq" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.8 }}>{t('nav.faq')}</Link>
          <Link to="/contact" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.8 }}>{t('nav.contact')}</Link>
          
          <div style={{ width: '1px', height: '20px', background: 'var(--glass-border)', margin: '0 0.5rem' }}></div>

          <button 
            onClick={toggleLanguage}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--text-primary)', 
              padding: '0.5rem', 
              cursor: 'pointer',
              fontSize: '0.7rem',
              fontWeight: '800',
              opacity: 0.6
            }}
          >
            {lang === 'tr' ? 'EN' : 'TR'}
          </button>

          <button 
            onClick={toggleThemeMode}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--text-primary)', 
              padding: '0.5rem', 
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: '800',
              opacity: 0.6
            }}
          >
            {themeMode === 'dark' ? '☀️' : '🌙'}
          </button>

          <Link 
            to={navPortalPath} 
            style={{ 
              color: 'var(--text-primary)', 
              textDecoration: 'none', 
              fontSize: '0.75rem', 
              fontWeight: '950', 
              letterSpacing: '2px',
              background: portalBtnBg,
              padding: '0.8rem 2.5rem',
              borderRadius: '4px',
              border: `1px solid ${portalBtnBorder}`,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
              boxShadow: isLight ? '0 5px 15px rgba(0, 0, 0, 0.05)' : '0 10px 25px rgba(0, 0, 0, 0.2), inset 0 1px 1px rgba(255,255,255,0.05)',
              transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onMouseOver={e => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.04)';
              e.currentTarget.style.background = 'var(--accent)';
              e.currentTarget.style.color = '#000';
              e.currentTarget.style.borderColor = 'var(--accent)';
              e.currentTarget.style.boxShadow = '0 15px 35px var(--accent-glow)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.transform = '';
              e.currentTarget.style.background = '';
              e.currentTarget.style.color = '';
              e.currentTarget.style.borderColor = '';
              e.currentTarget.style.boxShadow = '';
            }}
          >
            <span>💼</span>
            {t('nav.customer').toUpperCase()}
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={toggleLanguage}
            className="mobile-lang-btn"
            style={{ 
              background: 'transparent', 
              border: '1px solid var(--glass-border)', 
              color: 'var(--text-primary)', 
              padding: '0.4rem 0.8rem', 
              borderRadius: '20px', 
              cursor: 'pointer',
              fontSize: '0.7rem',
              fontWeight: '800',
              display: 'none'
            }}
          >
            {lang === 'tr' ? 'EN' : 'TR'}
          </button>
          <div className={`hamburger ${isMenuOpen ? 'open' : ''}`} onClick={() => setIsMenuOpen(!isMenuOpen)} style={{ color: 'var(--text-primary)' }}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </nav>

      <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <main>{children}</main>
      
      {location.pathname !== '/' && (
          <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1000 }}>
              <Link to="/" style={{ 
                  background: 'var(--text-primary)', 
                  color: 'var(--text-primary)', 
                  width: '50px', 
                  height: '50px', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  textDecoration: 'none',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                  transition: '0.4s cubic-bezier(0.22, 1, 0.36, 1)'
              }}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = '#000'; }}
              onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'var(--text-primary)'; e.currentTarget.style.color = 'var(--midnight)'; }}>
                  🏠
              </Link>
          </div>
      )}

      {showScrollTop && (
          <button 
              onClick={scrollToTop}
              className="scroll-to-top-btn"
              style={{ 
                  bottom: location.pathname !== '/' ? '6rem' : '2rem'
              }}
          >
              ▲
          </button>
      )}

      {location.pathname !== '/' && <Footer />}
    </div>
  );
};

export default Layout;
