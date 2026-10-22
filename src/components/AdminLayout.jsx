import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import AdminSidebar from './AdminSidebar';

const AdminLayout = ({ children }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { t, theme, themeMode } = useLanguage();
  const location = useLocation();

  const isLight = themeMode === 'light';

  const bottomBarItems = [
    { path: '/admin/orders', name: t('customer.orders'), icon: '📦' },
    { path: '/admin/tunnel', name: t('admin.nav.tunnel'), icon: '🚇' },
    { path: '/admin/catalog', name: t('admin.nav.catalog'), icon: '🧵' },
    { path: null, name: t('customer.more'), icon: '⚙️', isMore: true }
  ];

  return (
    <div className="admin-layout-premium aurora" style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      background: 'var(--midnight)',
      paddingLeft: '320px', // Content offset for sidebar
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* Global Ambient Glows for Admin Area */}
      <div style={{ position: 'fixed', top: '-10%', left: '20%', width: '800px', height: '800px', background: 'radial-gradient(circle, rgba(56, 189, 248, 0.03) 0%, transparent 70%)', filter: 'blur(100px)', zIndex: 0, pointerEvents: 'none' }}></div>
      <div style={{ position: 'fixed', bottom: '-20%', right: '0%', width: '1000px', height: '1000px', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.03) 0%, transparent 60%)', filter: 'blur(120px)', zIndex: 0, pointerEvents: 'none' }}></div>

      {/* Mobile Top Nav Bar - Hidden on bottom bar view */}
      <div className="admin-mobile-header" style={{
        display: 'none',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '80px',
        background: isLight ? 'rgba(255, 255, 255, 0.75)' : 'rgba(10, 13, 20, 0.7)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        borderBottom: `1px solid ${isLight ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255,255,255,0.08)'}`,
        zIndex: 999,
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 2rem'
      }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '950', letterSpacing: '-2px', color: 'var(--text-primary)', margin: 0 }}>
          VOG <span className="gradient-text">PREMIUM</span>
        </h2>
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

      <AdminSidebar isOpen={isMobileOpen} onClose={() => setIsMobileOpen(false)} />
      
      {/* Floating Bottom Tab Bar for Mobile Admin */}
      <nav className="admin-bottom-bar" style={{
        display: 'none',
        position: 'fixed',
        bottom: '1.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 3rem)',
        maxWidth: '480px',
        height: '76px',
        background: isLight ? 'rgba(255, 255, 255, 0.8)' : 'rgba(10, 13, 20, 0.65)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        borderRadius: '8px',
        border: `1px solid ${isLight ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255,255,255,0.08)'}`,
        boxShadow: isLight ? '0 15px 30px rgba(15, 23, 42, 0.05)' : '0 30px 60px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
        zIndex: 997,
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '0 0.5rem',
        transition: '0.3s'
      }}>
        {bottomBarItems.map((item, idx) => {
          const isActive = item.path && location.pathname === item.path;
          
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
                {item.name}
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
                color: isActive ? (theme?.primary || '#E60000') : (isLight ? 'rgba(15, 23, 42, 0.45)' : 'rgba(255,255,255,0.45)'),
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
              {item.name}
            </Link>
          );
        })}
      </nav>

      <main className="admin-main-content" style={{ 
        flex: 1, 
        padding: '3rem 4rem',
        maxWidth: '1800px',
        margin: '0 auto',
        width: '100%',
        position: 'relative'
      }}>
        {children}
      </main>

      <style>{`
        /* Global Glow & Glassmorphism Utilities for Admin */
        .admin-layout-premium * {
          box-sizing: border-box;
        }
        
        .admin-layout-premium .glass-panel {
          background: rgba(15, 23, 42, 0.5);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.05);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.05);
          border-radius: 8px;
        }

        :root.light-mode .admin-layout-premium .glass-panel {
          background: rgba(255, 255, 255, 0.75);
          border: 1px solid rgba(15, 23, 42, 0.08);
          box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.9);
        }

        .neon-text-blue {
          color: #00f3ff;
          text-shadow: 0 0 15px rgba(0, 243, 255, 0.5);
        }

        .neon-text-red {
          color: #ff003c;
          text-shadow: 0 0 15px rgba(255, 0, 60, 0.5);
        }
        
        .neon-border-blue:hover {
          border-color: rgba(0, 243, 255, 0.5) !important;
          box-shadow: 0 0 20px rgba(0, 243, 255, 0.1) !important;
        }

        /* Scrollbar styling for dark mode */
        .admin-layout-premium::-webkit-scrollbar,
        .admin-sidebar-premium::-webkit-scrollbar {
          width: 6px;
        }
        .admin-layout-premium::-webkit-scrollbar-track,
        .admin-sidebar-premium::-webkit-scrollbar-track {
          background: transparent; 
        }
        .admin-layout-premium::-webkit-scrollbar-thumb,
        .admin-sidebar-premium::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1); 
          border-radius: 10px;
        }
        .admin-layout-premium::-webkit-scrollbar-thumb:hover,
        .admin-sidebar-premium::-webkit-scrollbar-thumb:hover {
          background: #00f3ff; 
        }

        @media (max-width: 1024px) {
          .admin-layout-premium {
            padding-left: 0 !important;
            padding-top: 0px !important;
          }
          .admin-mobile-header {
            display: none !important;
          }
          .admin-bottom-bar {
            display: flex !important;
          }
          .admin-sidebar-premium {
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
          .admin-sidebar-premium.open {
            transform: translateX(320px) !important;
          }
          .admin-main-content {
            padding: 2rem 1.5rem 8rem !important;
            height: 100vh !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminLayout;
