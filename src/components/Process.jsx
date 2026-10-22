import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const Process = () => {
  const { t } = useLanguage();

  const steps = [
    { id: '01', title: t('process.steps.s01.title'), desc: t('process.steps.s01.desc'), img: 'https://www.vogtekstil.com.tr/wp-content/uploads/2017/04/style.jpg' },
    { id: '02', title: t('process.steps.s02.title'), desc: t('process.steps.s02.desc'), img: 'https://www.vogtekstil.com.tr/wp-content/uploads/2017/04/fabric-1.jpg' },
    { id: '03', title: t('process.steps.s03.title'), desc: t('process.steps.s03.desc'), img: 'https://www.vogtekstil.com.tr/wp-content/uploads/2017/04/cut.jpg' },
    { id: '04', title: t('process.steps.s04.title'), desc: t('process.steps.s04.desc'), img: 'https://www.vogtekstil.com.tr/wp-content/uploads/2017/05/printing.jpg' },
    { id: '05', title: t('process.steps.s05.title'), desc: t('process.steps.s05.desc'), img: 'https://www.vogtekstil.com.tr/wp-content/uploads/2017/04/Embroidery.jpg' },
    { id: '06', title: t('process.steps.s06.title'), desc: t('process.steps.s06.desc'), img: 'https://www.vogtekstil.com.tr/wp-content/uploads/2017/05/qc.jpg' },
    { id: '07', title: t('process.steps.s07.title'), desc: t('process.steps.s07.desc'), img: 'https://www.vogtekstil.com.tr/wp-content/uploads/2017/04/sewing.jpg' },
    { id: '08', title: t('process.steps.s08.title'), desc: t('process.steps.s08.desc'), img: 'https://www.vogtekstil.com.tr/wp-content/uploads/2017/04/qc.jpg' },
    { id: '09', title: t('process.steps.s09.title'), desc: t('process.steps.s09.desc'), img: 'https://www.vogtekstil.com.tr/wp-content/uploads/2017/04/packaging.jpg' }
  ];

  return (
    <section id="process" className="process-section" style={{ padding: '4rem 0', background: 'var(--midnight)' }}>
      <div className="container">
        <h2 style={{ fontSize: 'clamp(3rem, 6vw, 4.5rem)', marginBottom: '4rem', textAlign: 'center', fontWeight: '900', color: 'var(--text-primary)', letterSpacing: '-2px' }}>
          {t('process.title').split(' ')[0]} <span className="gradient-text">{t('process.title').split(' ')[1]}</span> {t('process.title').split(' ').slice(2).join(' ')}
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '3rem',
        }}>
          {steps.map((step) => (
            <div key={step.id} className="process-card animate-up" style={{
              padding: '0',
              transition: 'var(--transition)',
              position: 'relative',
              borderRadius: '3rem',
              overflow: 'hidden',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-20px)';
              e.currentTarget.style.borderColor = 'var(--accent)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
            }}>
              <div style={{ height: '280px', overflow: 'hidden', position: 'relative' }}>
                <img src={step.img} alt={step.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(to bottom, transparent 50%, var(--midnight) 100%)' }}></div>
              </div>
              
              <div style={{ padding: '2.5rem', position: 'relative' }}>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <h3 style={{ fontSize: '1.8rem', marginBottom: '1rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                    <span style={{ color: 'var(--accent)', marginRight: '0.8rem', fontFamily: 'var(--font-heading)' }}>{step.id}</span>
                    {step.title}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: '1.6', fontWeight: '500' }}>
                    {step.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Process;
