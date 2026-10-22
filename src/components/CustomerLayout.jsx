import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const CustomerLayout = ({ children }) => {
  const { t, lang, toggleLanguage, currentUser, setCurrentUser, theme, themeMode, toggleThemeMode } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const menuItems = [
    { path: '/customer', label: t('customer.dashboard'), icon: '📊' },
    { path: '/customer/catalog', label: t('admin.nav.catalog'), icon: '🧵' },
    { path: '/customer/orders', label: t('customer.orders'), icon: '📦' },
    { path: '/customer/new-order', label: t('customer.newOrder'), icon: '➕' },
    { path: '/customer/tracking', label: t('customer.logisticsTracking'), icon: '🚚' },
    { path: '/customer/visualizer', label: t('aiLab.title'), icon: '✨' },
  ];

  if (currentUser?.role === 'customer') {
    menuItems.push({ path: '/customer/subs', label: t('customer.subManagement'), icon: '👥' });
  }

  const bottomBarItems = [
    { path: '/customer', label: t('customer.dashboard'), icon: '📊' },
    { path: '/customer/catalog', label: t('admin.nav.catalog'), icon: '🧵' },
    { path: '/customer/new-order', label: t('customer.newOrder'), icon: '➕', isCenter: true },
    { path: '/customer/orders', label: t('customer.orders'), icon: '📦' },
    { path: null, label: t('customer.more'), icon: '⚙️', isMore: true }
  ];

  const handleLogout = () => {
    localStorage.removeItem('vog_user');
    setCurrentUser(null);
    navigate('/login');
  };

  const switchUser = () => {
    const nextRole = currentUser.role === 'customer' ? 'sub-customer' : 'customer';
    setCurrentUser({
      role: nextRole,
      name: nextRole === 'customer' ? 'Mumi Textiles' : 'Mumi Express Store',
      id: nextRole === 'customer' ? 'CUST-001' : 'SUB-099',
      isParent: nextRole === 'customer'
    });
    navigate('/customer');
  };

  const isLight = themeMode === 'light';
  const mobileHeaderBg = isLight ? 'rgba(255, 255, 255, 0.75)' : 'rgba(10, 13, 20, 0.7)';
  const mobileHeaderBorder = isLight ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255,255,255,0.08)';
  const bottomBarBg = isLight ? 'rgba(255, 255, 255, 0.8)' : 'rgba(10, 13, 20, 0.65)';
  const bottomBarBorder = isLight ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255,255,255,0.08)';
  const bottomBarShadow = isLight ? '0 15px 30px rgba(15, 23, 42, 0.05)' : '0 30px 60px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255,255,255,0.1)';
  const topHeaderBg = isLight ? 'rgba(255, 255, 255, 0.75)' : 'rgba(15, 23, 42, 0.4)';
  const topHeaderBorder = isLight ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255,255,255,0.1)';

  return (
    <div className="customer-layout-premium" style={{ 
      display: 'flex', 
      height: '100vh', 
      background: 'var(--midnight)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Mobile Top Nav Bar - Hidden on bottom bar view */}
      <div className="customer-mobile-header" style={{
        display: 'none',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '80px',
        background: mobileHeaderBg,
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        borderBottom: `1px solid ${mobileHeaderBorder}`,
        zIndex: 999,
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 2rem'
      }}>
        <Link to="/customer" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', textDecoration: 'none' }}>
           <div style={{ 
               width: '32px', 
               height: '32px', 
               background: theme.primary, 
               borderRadius: '8px', 
               display: 'flex', 
               alignItems: 'center', 
               justifyContent: 'center',
               fontSize: '1rem',
               fontWeight: '900',
               color: 'var(--text-primary)'
           }}>
             {theme.name[0]}
           </div>
           <div style={{ fontSize: '0.8rem', fontWeight: '900', color: 'var(--text-primary)', letterSpacing: '2px' }}>{theme.name}</div>
        </Link>
        <button 
          onClick={() => setIsMobileOpen(true)}
          style={{
            background: isLight ? 'rgba(15, 23, 42, 0.03)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${isLight ? 'rgba(15, 23, 42, 0.1)' : 'rgba(255,255,255,0.1)'}`,
            color: 'var(--text-primary)',
            fontSize: '1.5rem',
            cursor: 'pointer',
            padding: '0.6rem 1rem',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: '0.3s'
          }}
        >
          ☰
        </button>
      </div>

      {/* Backdrop overlay for mobile sidebar */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)} 
          style={{ 
            position: 'fixed', 
            inset: 0, 
            background: 'rgba(0,0,0,0.6)', 
            backdropFilter: 'blur(10px)', 
            WebkitBackdropFilter: 'blur(10px)',
            zIndex: 998 
          }} 
        />
      )}

      {/* Sidebar */}
      <aside className={`customer-sidebar-premium glass ${isMobileOpen ? 'open' : ''}`} style={{
        width: '300px',
        margin: '1rem',
        padding: '2rem 1.2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        position: 'sticky',
        top: '1rem',
        height: 'calc(100vh - 2rem)',
        borderRadius: '8px',
        background: 'var(--glass)',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--laminar-shadow)',
        zIndex: 100,
        overflowY: 'auto'
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', textDecoration: 'none', padding: '0 0.5rem' }}>
           <div style={{ 
               width: '36px', 
               height: '36px', 
               background: theme.primary, 
               color: 'var(--text-primary)',
               borderRadius: '10px', 
               display: 'flex', 
               alignItems: 'center', 
               justifyContent: 'center',
               fontSize: '1.1rem',
               fontWeight: '900',
               boxShadow: `0 0 20px ${theme.primary}66`
           }}>
             {theme.name[0]}
           </div>
           <div style={{ fontSize: '0.9rem', fontWeight: '900', color: 'var(--text-primary)', letterSpacing: '2px' }}>{theme.name} <span className="gradient-text">PORTAL</span></div>
        </Link>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {menuItems.map(item => (
            <Link 
              key={item.path}
              to={item.path} 
              onClick={() => setIsMobileOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem 1.2rem',
                borderRadius: '4px',
                textDecoration: 'none',
                color: location.pathname === item.path ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: location.pathname === item.path ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(56, 189, 248, 0.05))' : 'transparent',
                border: location.pathname === item.path ? '1px solid rgba(56, 189, 248, 0.2)' : '1px solid transparent',
                fontWeight: '900',
                fontSize: '0.85rem',
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                boxShadow: location.pathname === item.path ? '0 10px 20px rgba(56, 189, 248, 0.1)' : 'none'
              }}
              onMouseOver={e => {
                if (location.pathname !== item.path) {
                    e.currentTarget.style.color = 'var(--text-primary)';
                    e.currentTarget.style.background = 'var(--border-subtle)';
                    e.currentTarget.style.transform = 'translateX(6px)';
                }
              }}
              onMouseOut={e => {
                if (location.pathname !== item.path) {
                    e.currentTarget.style.color = '';
                    e.currentTarget.style.background = '';
                    e.currentTarget.style.transform = '';
                }
              }}
            >
              <span style={{ 
                fontSize: '1.1rem', 
                filter: location.pathname === item.path ? 'drop-shadow(0 0 8px white)' : 'grayscale(1)',
                transition: '0.3s'
              }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem', paddingBottom: '1rem' }}>
           <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', padding: '0 0.5rem', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '900', marginBottom: '0.2rem' }}>
              {t('customer.account')}: <br/>
              <strong style={{ color: 'var(--text-primary)', fontSize: '1rem', letterSpacing: '1px' }}>{currentUser.name.toUpperCase()}</strong>
           </div>
           
           <button onClick={toggleLanguage} style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)', padding: '1rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '950', letterSpacing: '2px', transition: 'var(--transition)' }}>
              {lang === 'tr' ? 'ENGLISH (EN)' : 'TÜRKÇE (TR)'}
           </button>

           <button onClick={switchUser} style={{ background: 'rgba(230,0,0,0.08)', border: '1px solid rgba(230,0,0,0.3)', color: 'var(--text-primary)', padding: '1rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '950', letterSpacing: '2px', boxShadow: '0 0 30px rgba(230,0,0,0.2)', transition: 'var(--transition)' }}>
              {t('nav.switchUser').toUpperCase()}
           </button>
        </div>
      </aside>

      {/* Floating Bottom Tab Bar for Mobile */}
      <nav className="customer-bottom-bar" style={{
        display: 'none',
        position: 'fixed',
        bottom: '1.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 3rem)',
        maxWidth: '480px',
        height: '76px',
        background: bottomBarBg,
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        borderRadius: '8px',
        border: `1px solid ${bottomBarBorder}`,
        boxShadow: bottomBarShadow,
        zIndex: 997,
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '0 0.5rem',
        transition: '0.3s'
      }}>
        {bottomBarItems.map((item, idx) => {
          const isActive = item.path && location.pathname === item.path;
          
          if (item.isCenter) {
            return (
              <Link
                key={idx}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '58px',
                  height: '58px',
                  background: 'var(--text-primary)',
                  borderRadius: '50%',
                  marginTop: '-30px',
                  boxShadow: `0 15px 30px ${theme.primary}44, 0 0 0 5px rgba(10, 13, 20, 0.8)`,
                  textDecoration: 'none',
                  fontSize: '1.4rem',
                  transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.92)'}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                ➕
              </Link>
            );
          }

          if (item.isMore) {
            return (
              <button
                key={idx}
                onClick={() => setIsMobileOpen(true)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'none',
                  border: 'none',
                  color: isMobileOpen ? 'var(--text-primary)' : (isLight ? 'rgba(15, 23, 42, 0.45)' : 'rgba(255,255,255,0.45)'),
                  fontSize: '0.6rem',
                  fontWeight: '900',
                  gap: '0.35rem',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  width: '60px',
                  outline: 'none'
                }}
              >
                <span style={{ fontSize: '1.4rem' }}>⚙️</span>
                {item.label}
              </button>
            );
          }

          return (
            <Link
              key={idx}
              to={item.path}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: isActive ? theme.primary : (isLight ? 'rgba(15, 23, 42, 0.45)' : 'rgba(255,255,255,0.45)'),
                textDecoration: 'none',
                fontSize: '0.6rem',
                fontWeight: '900',
                gap: '0.35rem',
                transition: '0.2s',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                width: '60px'
              }}
            >
              <span style={{ 
                fontSize: '1.4rem', 
                filter: isActive ? 'none' : 'grayscale(0.8)',
                transform: isActive ? 'scale(1.15)' : 'scale(1)',
                transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
              }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Content Container */}
      <div className="customer-main-container" style={{ 
        flex: 1, 
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        padding: '1.5rem 1.5rem 1.5rem 0'
      }}>
        {/* Futuristic Glass Top Header */}
        <div className="glass" style={{
          padding: '1.2rem 2.5rem',
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: topHeaderBg,
          border: `1px solid ${topHeaderBorder}`,
          backdropFilter: 'blur(50px)',
          WebkitBackdropFilter: 'blur(50px)',
          boxShadow: 'var(--laminar-shadow)',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
          zIndex: 90
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '1.5rem' }}>
              {menuItems.find(item => item.path === location.pathname)?.icon || '💼'}
            </span>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--text-primary)', margin: 0, letterSpacing: '1px', textTransform: 'uppercase' }}>
              {menuItems.find(item => item.path === location.pathname)?.label || 'PORTAL'}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {/* Active User Badge */}
            <div style={{
              background: 'var(--input-bg)',
              border: '1px solid var(--input-border)',
              padding: '0.6rem 1.2rem',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem'
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: theme.primary, boxShadow: `0 0 10px ${theme.primary}` }}></span>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '0.5px' }}>
                {currentUser.name.toUpperCase()}
              </span>
            </div>

            {/* Language Toggle */}
            <button 
              onClick={toggleLanguage} 
              style={{ 
                background: 'var(--input-bg)', 
                border: '1px solid var(--input-border)', 
                color: 'var(--text-primary)', 
                padding: '0.6rem 1.2rem', 
                borderRadius: '4px', 
                cursor: 'pointer', 
                fontSize: '0.75rem', 
                fontWeight: '800', 
                transition: '0.3s' 
              }}
              onMouseOver={e => e.currentTarget.style.background = 'var(--border-subtle)'}
              onMouseOut={e => e.currentTarget.style.background = ''}
            >
              🌐 {lang === 'tr' ? 'EN' : 'TR'}
            </button>

            {/* Theme Toggle Switcher */}
            <button 
              onClick={toggleThemeMode} 
              style={{ 
                background: 'var(--input-bg)', 
                border: '1px solid var(--input-border)', 
                color: 'var(--text-primary)', 
                padding: '0.6rem 1.2rem', 
                borderRadius: '4px', 
                cursor: 'pointer', 
                fontSize: '0.75rem', 
                fontWeight: '800', 
                transition: '0.3s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
              onMouseOver={e => e.currentTarget.style.background = 'var(--border-subtle)'}
              onMouseOut={e => e.currentTarget.style.background = ''}
            >
              {themeMode === 'dark' ? '☀️ LIGHT' : '🌙 DARK'}
            </button>

            {/* Logout Button */}
            <button 
              className="btn-logout"
              onClick={handleLogout}
              style={{
                background: `linear-gradient(135deg, ${theme.primary}, #000)`,
                border: `1px solid ${theme.primary}66`,
                color: 'var(--text-primary)',
                padding: '0.6rem 1.5rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: '900',
                boxShadow: `0 10px 20px ${theme.primary}22`,
                transition: '0.3s'
              }}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 15px 25px ${theme.primary}44`; }}
              onMouseOut={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
            >
              🚪 {t('nav.logout').toUpperCase()}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <main className="customer-main-content" style={{ 
          flex: 1, 
          overflowY: 'auto',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: '2.5rem',
          paddingRight: '0.5rem'
        }}>
          <div style={{ maxWidth: '1600px', width: '100%', margin: '0 auto' }}>
            {children}
          </div>
        </main>
      </div>

      <style>{`
        /* Scrollbar styles for the sidebar */
        .customer-sidebar-premium::-webkit-scrollbar {
          width: 5px;
        }
        .customer-sidebar-premium::-webkit-scrollbar-track {
          background: transparent;
        }
        .customer-sidebar-premium::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 10px;
        }
        .customer-sidebar-premium::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.2);
        }

        @media (max-width: 1024px) {
          .customer-main-container {
            padding: 0 !important;
            height: 100vh !important;
          }
          .customer-layout-premium {
            padding-top: 0px !important;
          }
          .customer-mobile-header {
            display: none !important;
          }
          .customer-bottom-bar {
            display: flex !important;
          }
          .customer-sidebar-premium {
            position: fixed !important;
            left: -320px !important;
            top: 0 !important;
            height: 100vh !important;
            width: 300px !important;
            z-index: 1000 !important;
            transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
            display: flex !important;
            margin: 0 !important;
            border-radius: 0 12px 12px 0 !important;
          }
          .customer-sidebar-premium.open {
            transform: translateX(320px) !important;
          }
          .customer-main-content {
            padding: 2rem 1.5rem 8rem !important;
            height: 100vh !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CustomerLayout;
