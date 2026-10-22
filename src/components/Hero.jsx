import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const Hero = () => {
  const { t, themeMode } = useLanguage();
  const isLight = themeMode === 'light';

  return (
    <div className="hero-section" style={{
      position: 'relative',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      overflow: 'hidden',
      background: isLight 
        ? `linear-gradient(135deg, rgba(248, 250, 252, 0.8), rgba(248, 250, 252, 0.95)), url('https://www.vogtekstil.com.tr/wp-content/uploads/2017/04/slider5.jpg')`
        : `linear-gradient(135deg, rgba(10, 13, 20, 0.7), rgba(10, 13, 20, 0.95)), url('https://www.vogtekstil.com.tr/wp-content/uploads/2017/04/slider5.jpg')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    }}>
      <div className="container" style={{ position: 'relative', zIndex: 2 }}>
        {/* Architectural Glass Frame */}
        <div style={{ 
          maxWidth: '1300px', 
          margin: '0 auto',
          padding: '8rem 6rem',
          borderRadius: '12px',
          background: isLight ? 'rgba(15, 23, 42, 0.02)' : 'rgba(255,255,255,0.02)',
          backdropFilter: 'blur(60px) saturate(220%)',
          WebkitBackdropFilter: 'blur(60px) saturate(220%)',
          border: `1px solid ${isLight ? 'rgba(15, 23, 42, 0.1)' : 'rgba(255,255,255,0.2)'}`,
          boxShadow: isLight ? '0 40px 100px rgba(15, 23, 42, 0.05)' : '0 80px 200px rgba(0,0,0,0.6)',
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: '1.2fr 0.8fr',
          gap: '5rem',
          alignItems: 'center'
        }} className="animate-up revealed">
          
          <div>
            <div style={{ 
              display: 'inline-block',
              padding: '1rem 2.5rem',
              background: 'rgba(212, 175, 55, 0.1)',
              borderRadius: '4px',
              fontSize: '0.8rem', 
              color: 'var(--text-primary)', 
              fontWeight: '900', 
              letterSpacing: '6px',
              textTransform: 'uppercase',
              marginBottom: '3rem',
              border: '1px solid var(--accent)',
              boxShadow: '0 0 40px var(--accent-glow)'
            }}>
              EST. 1996 • ELITE CRAFTSMANSHIP
            </div>
            <h1 style={{ 
              fontSize: 'clamp(3.5rem, 12vw, 9rem)', 
              lineHeight: '0.8', 
              fontWeight: '950', 
              color: 'var(--text-primary)', 
              marginBottom: '3.5rem',
              letterSpacing: '-8px'
            }}>
              {t('hero.tagline').split(' ').slice(0, 2).join(' ')} <br/>
              <span className="gradient-text" style={{ fontSize: '1.1em' }}>{t('hero.tagline').split(' ').slice(2, 3).join(' ')}</span> <br/>
              {t('hero.tagline').split(' ').slice(3).join(' ')}
            </h1>
            <p style={{ 
              color: 'var(--text-secondary)', 
              fontSize: '1.4rem', 
              lineHeight: '1.8', 
              marginBottom: '5rem',
              maxWidth: '650px',
              fontWeight: '400'
            }}>
              {t('hero.taglineDesc')}
            </p>
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
              <Link to="/contact" className="btn-primary" style={{ padding: '2rem 5rem', fontSize: '1rem', background: 'var(--text-primary)', color: 'var(--midnight)', textDecoration: 'none' }}>{t('hero.cta')}</Link>
              <Link to="/products" style={{ 
                padding: '2rem 5rem', 
                borderRadius: '4px', 
                border: `1px solid ${isLight ? 'rgba(15, 23, 42, 0.15)' : 'rgba(255,255,255,0.2)'}`,
                background: isLight ? 'rgba(15, 23, 42, 0.03)' : 'rgba(255,255,255,0.05)',
                color: 'var(--text-primary)',
                textDecoration: 'none',
                transition: 'var(--transition)',
                fontSize: '1rem',
                fontWeight: '900',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                backdropFilter: 'blur(10px)'
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = 'var(--text-muted)'; e.currentTarget.style.transform = 'translateY(-5px)'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = ''; e.currentTarget.style.transform = ''; }}>
                {t('hero.portfolio')}
              </Link>
            </div>
          </div>

          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
             <div className="glass-card" style={{ 
               padding: '5rem 4rem', 
               borderRadius: '12px', 
               textAlign: 'center',
               border: `1px solid ${isLight ? 'rgba(15, 23, 42, 0.1)' : 'rgba(255,255,255,0.3)'}`,
               transform: 'rotate(3deg)',
               boxShadow: isLight ? '0 20px 40px rgba(15, 23, 42, 0.05)' : '0 50px 100px rgba(212, 175, 55,0.15)',
               background: isLight 
                 ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.05) 0%, rgba(15, 23, 42, 0.01) 100%)'
                 : 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 100%)'
             }}>
                <div style={{ fontSize: '6rem', fontWeight: '950', color: 'var(--text-primary)', marginBottom: '0.5rem', letterSpacing: '-4px' }}>30Y</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: '900', letterSpacing: '6px' }}>YEARS OF EXCELLENCE</div>
             </div>
             
             {/* Dynamic Blobs behind the card */}
             <div style={{ 
               position: 'absolute', 
               top: '-60px', 
               right: '-30px', 
               width: '200px', 
               height: '200px', 
               background: 'var(--accent)', 
               borderRadius: '50%', 
               filter: 'blur(80px)', 
               opacity: 0.5,
               zIndex: -1 
             }}></div>
          </div>
        </div>
      </div>

      {/* Extreme Lighting Effects */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '-10%',
        width: '1000px',
        height: '1000px',
        background: 'radial-gradient(circle, rgba(212, 175, 55,0.15) 0%, transparent 70%)',
        zIndex: 0,
        filter: 'blur(150px)',
        pointerEvents: 'none'
      }}></div>
    </div>
  );
};

export default Hero;
