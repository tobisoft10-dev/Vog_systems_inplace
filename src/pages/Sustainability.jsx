import React, { useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

const Sustainability = () => {
  const { t } = useLanguage();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="sustainability-page" style={{ paddingTop: '8rem' }}>
      <section className="container">
        <h1 style={{ fontSize: 'clamp(3rem, 8vw, 5rem)', marginBottom: '3rem' }}>
          {t('sustainability.title').split(' ')[0]} <span className="gradient-text">{t('sustainability.title').split(' ')[1]}</span> {t('sustainability.title').split(' ')[2]}
        </h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem', alignItems: 'center' }}>
          <div className="animate-up revealed">
            <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>{t('sustainability.evolution.title').split(' ')[0]} <span className="gradient-text">{t('sustainability.evolution.title').split(' ').slice(1).join(' ')}</span></h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1.1rem' }}>
              {t('sustainability.evolution.desc')}
            </p>
            <div className="glass" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ padding: '0.5rem 1rem', background: 'var(--color-info-bg)', color: 'var(--color-info)', borderRadius: '1rem', fontSize: '0.8rem', letterSpacing: '1px', fontWeight: 'bold' }}>{t('sustainability.model.ethical')}</div>
                <div style={{ padding: '0.5rem 1rem', background: 'var(--color-info-bg)', color: 'var(--color-info)', borderRadius: '1rem', fontSize: '0.8rem', letterSpacing: '1px', fontWeight: 'bold' }}>{t('sustainability.model.local')}</div>
              </div>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                {t('sustainability.model.desc')}
              </p>
            </div>
          </div>
          <div>
            <img src="https://www.vogtekstil.com.tr/wp-content/uploads/2017/04/fabric-1.jpg" alt="Sürdürülebilir Kumaş" style={{ width: '100%', borderRadius: '2rem' }} />
          </div>
        </div>
      </section>

      <section style={{ padding: '8rem 0', background: 'var(--royal)', margin: '4rem 0' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', marginBottom: '4rem' }}>{t('sustainability.standards.title').split(' ')[0]} {t('sustainability.standards.title').split(' ')[1]} <span className="gradient-text">{t('sustainability.standards.title').split(' ')[2]}</span></h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            {[
              { title: t('sustainability.standards.integrity.title'), desc: t('sustainability.standards.integrity.desc') },
              { title: t('sustainability.standards.longevity.title'), desc: t('sustainability.standards.longevity.desc') },
              { title: t('sustainability.standards.efficiency.title'), desc: t('sustainability.standards.efficiency.desc') }
            ].map((item, i) => (
              <div key={i} className="glass" style={{ padding: '2.5rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>{item.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Sustainability;
