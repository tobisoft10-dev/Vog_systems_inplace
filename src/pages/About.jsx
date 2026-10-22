import React, { useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

const About = () => {
  const { t } = useLanguage();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="about-page" style={{ paddingTop: '8rem' }}>
      <section className="container">
        <h1 style={{ fontSize: 'clamp(3rem, 8vw, 5rem)', marginBottom: '2rem' }}>
          {t('about.title').split(' ')[0]} <span className="gradient-text">{t('about.title').split(' ')[1]}</span>
        </h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              {t('about.mission')}
            </p>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              {t('about.history')}
            </p>
            <div className="glass" style={{ padding: '2rem', marginTop: '2rem' }}>
              <h3 style={{ color: 'var(--accent)', marginBottom: '1rem' }}>{t('about.excellence.title')}</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                {t('about.excellence.desc')}
              </p>
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <img src="https://www.vogtekstil.com.tr/wp-content/uploads/2017/04/gallery3.jpg" alt="Vog Atölye" style={{ width: '100%', borderRadius: '2rem' }} />
          </div>
        </div>
      </section>

      {/* Volkan Bars CEO Quote Section */}
      <section className="container" style={{ marginTop: '5rem', marginBottom: '1rem' }}>
        <div className="glass" style={{ padding: '3.5rem 3rem', borderRadius: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '3.5rem', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <img 
              src="/profile.png" 
              alt="Volkan Bars" 
              style={{ 
                width: '180px', 
                height: '180px', 
                borderRadius: '50%', 
                border: '3px solid var(--accent)', 
                objectFit: 'cover', 
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)' 
              }} 
            />
            <h3 style={{ marginTop: '1.25rem', color: 'var(--text-primary)', fontSize: '1.35rem', marginBottom: '0.25rem' }}>Volkan Bars</h3>
            <p style={{ color: 'var(--accent)', fontSize: '0.85rem', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: '600' }}>CEO & Founder</p>
          </div>
          <div>
            <blockquote style={{ fontSize: '1.05rem', fontStyle: 'italic', color: 'var(--text-secondary)', borderLeft: '4px solid var(--accent)', paddingLeft: '1.5rem', margin: 0, lineHeight: '1.7' }}>
              "{t('about.ceoQuote')}"
            </blockquote>
          </div>
        </div>
      </section>

      <section style={{ margin: '4rem 0', position: 'relative' }}>
        <div className="glass" style={{ margin: '0 var(--container-pad)', padding: '4rem 0', borderRadius: '2rem' }}>
          <div className="container">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
              {[
                { label: t('about.stats.established'), value: '1996' },
                { label: t('about.stats.partners'), value: '150+' },
                { label: t('about.stats.styles'), value: '400+' },
                { label: t('about.stats.logistics'), value: t('about.stats.global') }
              ].map((stat, i) => (
                <div key={i} style={{ textAlign: 'center', position: 'relative' }}>
                  <div style={{ fontSize: '3rem', fontWeight: '800', background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--color-info) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.5rem' }}>{stat.value}</div>
                  <div style={{ display: 'inline-block', padding: '0.4rem 1rem', background: 'var(--color-info-bg)', color: 'var(--color-info)', borderRadius: '1rem', fontSize: '0.8rem', letterSpacing: '2px', fontWeight: '600' }}>{stat.label.toUpperCase()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      
      <section className="container">
        <h2 style={{ fontSize: '2.5rem', marginBottom: '3rem' }}>{t('about.philosophy.title').split(' ')[0]} <span className="gradient-text">{t('about.philosophy.title').split(' ')[1]}</span></h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {[
            { title: t('about.philosophy.quality.title'), desc: t('about.philosophy.quality.desc'), icon: '✨' },
            { title: t('about.philosophy.innovation.title'), desc: t('about.philosophy.innovation.desc'), icon: '🚀' },
            { title: t('about.philosophy.reliability.title'), desc: t('about.philosophy.reliability.desc'), icon: '🛡️' }
          ].map((item, i) => (
            <div key={i} className="glass-card" style={{ padding: '3rem', position: 'relative', overflow: 'hidden', borderRadius: '2rem' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, transparent, var(--accent), transparent)' }}></div>
              <div style={{ fontSize: '2.5rem', marginBottom: '1.5rem', opacity: '0.9' }}>{item.icon}</div>
              <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {item.title}
              </h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default About;
