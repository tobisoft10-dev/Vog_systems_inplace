import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const AdminSidebar = ({ isOpen, onClose }) => {
  const { t, lang, toggleLanguage, setCurrentUser, themeMode } = useLanguage();
  const navigate = useNavigate();

  const isLight = themeMode === 'light';
  const logoFilter = isLight ? 'none' : 'brightness(0) invert(1) drop-shadow(0 0 8px rgba(255,255,255,0.2))';
  const sidebarBg = isLight ? 'rgba(255, 255, 255, 0.75)' : 'rgba(255,255,255,0.02)';
  const sidebarBorder = isLight ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255,255,255,0.08)';
  const sidebarShadow = isLight ? '0 20px 50px rgba(15, 23, 42, 0.05)' : '0 50px 100px rgba(0,0,0,0.5)';
  const userBlockBg = isLight ? 'rgba(15, 23, 42, 0.03)' : 'rgba(0,0,0,0.2)';
  const userBlockBorder = isLight ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255,255,255,0.05)';

  const navItems = [
    { name: 'CEO Review', path: '/admin/ceo', icon: '👑' },
    { name: t('customer.orders'), path: '/admin/orders', icon: '📦' },
    { name: '🤖 Sipariş Bazlı Mini-Sorter', path: '/admin/iot', icon: '🤖' },
    { name: '🎯 Personel Bazlı Sipariş & Sorter', path: '/admin/personnel', icon: '🎯' },
    { name: '🔄 Personel Sorter Akış Yönetimi', path: '/admin/personnel-sorter-flow', icon: '🔄' },
    { name: '🏭 Koli İstasyonu (Fulfillment)', path: '/admin/fulfillment', icon: '🏭' },
    { name: t('admin.nav.tunnel'), path: '/admin/tunnel', icon: '🚇' },
    { name: t('admin.nav.catalog'), path: '/admin/catalog', icon: '🧵' },
    { name: t('admin.nav.reports'), path: '/admin/reports', icon: '📈' },
    { name: t('admin.nav.settings'), path: '/admin/settings', icon: '⚙️' },
  ];

  const handleLogout = () => {
    setCurrentUser(null);
    navigate('/login');
  };

  return (
    <aside className={`admin-sidebar-premium glass ${isOpen ? 'open' : ''}`} style={{
      width: '300px',
      height: 'calc(100vh - 3rem)',
      position: 'fixed',
      left: '1.5rem',
      top: '1.5rem',
      zIndex: 100,
      padding: '3.5rem 1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '2.5rem',
      boxShadow: sidebarShadow,
      background: sidebarBg,
      borderRadius: '3.5rem',
      border: `1px solid ${sidebarBorder}`,
      overflowY: 'auto'
    }}>
      <div className="sidebar-logo" style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <img 
          src="/logo512.png" 
          alt="VOG Logo" 
          style={{ 
            height: '42px', 
            filter: logoFilter,
            transition: 'var(--transition)',
            marginBottom: '0.5rem'
          }} 
        />
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '4px', marginTop: '0.5rem', fontWeight: '900' }}>
          Enterprise Portal
        </p>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end
            onClick={() => {
              if (onClose) onClose();
            }}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '1.2rem',
              padding: '1.2rem 1.8rem',
              borderRadius: '1.5rem',
              textDecoration: 'none',
              color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
              background: isActive ? 'linear-gradient(90deg, rgba(230,0,0,0.15), transparent)' : 'transparent',
              borderLeft: isActive ? '4px solid #E60000' : '4px solid transparent',
              boxShadow: isActive ? 'inset 20px 0 40px -20px rgba(230,0,0,0.3)' : 'none',
              fontWeight: '900',
              transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              fontSize: '0.9rem',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            })}
            className={({ isActive }) => isActive ? 'active-nav' : ''}
            onMouseOver={(e) => {
              if(!e.currentTarget.classList.contains('active-nav')) {
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.background = isLight ? 'rgba(15, 23, 42, 0.04)' : 'rgba(255,255,255,0.03)';
                e.currentTarget.style.transform = 'translateX(10px)';
              }
            }}
            onMouseOut={(e) => {
              if(!e.currentTarget.classList.contains('active-nav')) {
                e.currentTarget.style.color = '';
                e.currentTarget.style.background = '';
                e.currentTarget.style.transform = '';
              }
            }}
          >
            <span style={{ 
              fontSize: '1.3rem', 
              filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.1))',
              transition: '0.3s'
            }}>{item.icon}</span>
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div style={{ marginTop: 'auto', padding: '1.5rem', background: userBlockBg, borderRadius: '1rem', border: `1px solid ${userBlockBorder}`, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ 
            width: '45px', 
            height: '45px', 
            borderRadius: '12px', 
            background: 'linear-gradient(135deg, #00f3ff, #0050ff)',
            boxShadow: '0 0 20px rgba(0,243,255,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-primary)',
            fontWeight: '900',
            fontSize: '1.1rem'
          }}>
            MK
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)' }}>{t('admin.role.adminUser')}</div>
            <div style={{ fontSize: '0.75rem', color: '#00f3ff', opacity: 0.8 }}>{t('admin.role.logisticsManager')}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <button 
            onClick={toggleLanguage}
            style={{ 
              background: isLight ? 'rgba(15, 23, 42, 0.03)' : 'rgba(255,255,255,0.03)', 
              border: `1px solid ${isLight ? 'rgba(15, 23, 42, 0.1)' : 'rgba(255,255,255,0.1)'}`, 
              color: 'var(--text-primary)', 
              padding: '1rem', 
              borderRadius: '1.2rem', 
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: '950',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              letterSpacing: '1.5px'
            }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--border-subtle)'; }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.background = ''; }}
          >
            {lang.toUpperCase()}
          </button>
          <button 
            className="btn-logout"
            onClick={handleLogout}
            style={{ 
              background: 'rgba(230, 0, 0, 0.1)', 
              border: '1px solid rgba(230, 0, 0, 0.2)', 
              color: 'var(--text-primary)', 
              padding: '1rem', 
              borderRadius: '1.2rem', 
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: '950',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              letterSpacing: '1.5px'
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = '#E60000'; e.currentTarget.style.boxShadow = '0 0 20px rgba(230,0,0,0.4)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = ''; e.currentTarget.style.boxShadow = ''; }}
          >
            {t('nav.logout').toUpperCase()}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
