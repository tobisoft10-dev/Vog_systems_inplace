import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const Footer = () => {
  const { t, themeMode } = useLanguage();
  const isLight = themeMode === 'light';

  return (
    <footer id="contact" style={{
      padding: '10rem 0 5rem',
      background: 'var(--midnight)',
      borderTop: `1px solid ${isLight ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255,255,255,0.05)'}`
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '4rem',
          marginBottom: '6rem'
        }}>
          <div>
            <div style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '2rem', color: 'var(--text-primary)', letterSpacing: '-2px' }}>
              VOG <span className="gradient-text">TEKSTIL</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '300px', fontSize: '1rem', lineHeight: '1.7' }}>
              {t('footer.tagline')}
            </p>
          </div>
          
          <div>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '2rem', fontSize: '0.8rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '4px' }}>{t('footer.operations')}</h4>
            <div style={{ color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '1rem' }}>
              <p>Madenler Mah. Şehit Ünal Kalafat Cad. No: 32/14</p>
              <p>Ümraniye / İstanbul</p>
              <p>+90 (216) 484 55 58</p>
              <p>info@vogtekstil.com.tr</p>
            </div>
          </div>

          <div>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '2rem', fontSize: '0.8rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '4px' }}>{t('footer.quickLinks')}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '1rem' }}>
              <Link to="/about" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'var(--transition)' }}>{t('nav.about')}</Link>
              <Link to="/products" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'var(--transition)' }}>{t('nav.products')}</Link>
              <Link to="/sustainability" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'var(--transition)' }}>{t('nav.esg')}</Link>
              <Link to="/gallery" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'var(--transition)' }}>{t('nav.gallery')}</Link>
              <Link to="/faq" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'var(--transition)' }}>{t('nav.faq')}</Link>
              <Link to="/contact" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'var(--transition)' }}>{t('nav.contact')}</Link>
            </div>
          </div>

          <div>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '2rem', fontSize: '0.8rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '4px' }}>{t('footer.status')}</h4>
            <div className="glass-card" style={{
              padding: '2rem',
              borderRadius: '2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1.5rem',
            }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--color-success)', boxShadow: '0 0 20px var(--color-success)' }}></div>
              <span style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '1px' }}>SYSTEMS ONLINE</span>
            </div>
          </div>
        </div>

        <div style={{
          borderTop: `1px solid ${isLight ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255,255,255,0.05)'}`,
          paddingTop: '4rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.75rem',
          letterSpacing: '2px',
          fontWeight: '700'
        }}>
          <div>{t('footer.copy')}</div>
          <div style={{ color: 'var(--accent)' }}>POWERED BY VOG DIGITAL SOLUTIONS</div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
