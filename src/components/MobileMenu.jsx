import React from 'react';
import { Link } from 'react-router-dom';

const MobileMenu = ({ isOpen, onClose }) => {
  const menuLinks = [
    { label: 'HOME', path: '/', subtitle: 'Start journey' },
    { label: 'HERITAGE', path: '/about', subtitle: 'Since 1996' },
    { label: 'PRODUCTS', path: '/products', subtitle: 'Collection' },
    { label: 'IMPACT', path: '/sustainability', subtitle: 'ESG Ethics' },
    { label: 'MEDIA', path: '/news', subtitle: 'News Feed' },
    { label: 'GALLERY', path: '/gallery', subtitle: 'In Production' },
    { label: 'FAQ', path: '/faq', subtitle: 'Help & FAQ' },
    { label: 'CONTACT', path: '/contact', subtitle: 'Get in touch' },
    { label: 'PORTAL', path: '/login', subtitle: 'Enterprise Access' }
  ];

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100dvh',
      background: 'rgba(5, 7, 10, 0.98)',
      backdropFilter: 'blur(40px)',
      WebkitBackdropFilter: 'blur(40px)',
      zIndex: 999,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      padding: '4rem var(--container-pad) 2rem var(--container-pad)',
      overflowY: 'auto',
      animation: 'fadeIn 0.4s forwards'
    }}>
      <style>
        {`
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes linkIn { 
            from { opacity: 0; transform: translateY(30px); filter: blur(5px); } 
            to { opacity: 1; transform: translateY(0); filter: blur(0); } 
          }
          .mobile-link-container {
            margin-bottom: 1.2rem;
            opacity: 0;
            animation: linkIn 0.6s forwards cubic-bezier(0.16, 1, 0.3, 1);
          }
          .mobile-link {
            font-family: var(--font-heading);
            font-size: clamp(1.8rem, 8vw, 3rem);
            font-weight: 950;
            color: white;
            text-decoration: none;
            letter-spacing: -1.5px;
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            display: inline-block;
            line-height: 1;
          }
          .mobile-subtitle {
            font-size: 0.6rem;
            color: var(--accent);
            letter-spacing: 3px;
            margin-bottom: 0.25rem;
            font-weight: 900;
            opacity: 0.6;
          }
          .mobile-link:hover {
            color: var(--accent);
            transform: scale(1.03) translateX(8px);
            letter-spacing: -0.5px;
          }
          .mobile-link:active {
            transform: scale(0.97);
          }
        `}
      </style>

      {/* Close Button at top-right inside menu overlay */}
      <button 
        onClick={onClose}
        style={{
          alignSelf: 'flex-end',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: 'white',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '1rem',
          transition: 'background 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {menuLinks.map((link, i) => (
          <div 
            key={i} 
            className="mobile-link-container" 
            style={{ animationDelay: `${0.1 + i * 0.05}s` }}
          >
            <div className="mobile-subtitle">{link.subtitle.toUpperCase()}</div>
            <Link 
              to={link.path} 
              className="mobile-link" 
              onClick={onClose}
            >
              {link.label}
            </Link>
          </div>
        ))}
      </div>

      {/* Social Footer */}
      <div style={{ 
        marginTop: '2rem', 
        paddingTop: '2rem',
        borderTop: '1px solid var(--glass-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        opacity: 0,
        animation: 'fadeIn 1s forwards 0.8s'
      }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', letterSpacing: '1px' }}>
          © 2026 VOG TEKSTİL HQ
        </div>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          {['INSTAGRAM', 'LINKEDIN'].map(social => (
            <a key={social} href="#" style={{ color: 'var(--text-primary)', fontSize: '0.65rem', fontWeight: '700', textDecoration: 'none', borderBottom: '1px solid var(--accent)' }}>{social}</a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
