import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

const FAQ = () => {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqItems = [
    { q: 'faq.q1', a: 'faq.a1' },
    { q: 'faq.q2', a: 'faq.a2' },
    { q: 'faq.q3', a: 'faq.a3' },
    { q: 'faq.q4', a: 'faq.a4' },
    { q: 'faq.q5', a: 'faq.a5' },
    { q: 'faq.q6', a: 'faq.a6' },
    { q: 'faq.q7', a: 'faq.a7' },
    { q: 'faq.q8', a: 'faq.a8' }
  ];

  return (
    <div className="faq-page" style={{ paddingTop: '8rem', minHeight: '80vh', paddingBottom: '4rem' }}>
      <section className="container" style={{ maxWidth: '800px' }}>
        <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.2rem)', marginBottom: '1rem', textAlign: 'center' }}>
          {t('faq.title').split(' ').slice(0, -1).join(' ')} <span className="gradient-text">{t('faq.title').split(' ').slice(-1)}</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '3rem', fontSize: '1.05rem' }}>
          {t('faq.subtitle')}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {faqItems.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div 
                key={index} 
                className="glass-card" 
                style={{ 
                  borderRadius: '1rem', 
                  overflow: 'hidden', 
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: isOpen ? '1px solid var(--accent)' : '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: isOpen ? '0 8px 32px 0 rgba(220, 38, 38, 0.1)' : 'none',
                  background: 'rgba(255, 255, 255, 0.03)'
                }}
              >
                <button
                  onClick={() => toggleAccordion(index)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1.1rem 1.4rem',
                    background: 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    color: isOpen ? 'var(--accent)' : 'var(--text-primary)',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    transition: 'color 0.2s ease'
                  }}
                >
                  <span style={{ paddingRight: '1rem' }}>{t(item.q)}</span>
                  <svg 
                    width="18" 
                    height="18" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    style={{
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      color: isOpen ? 'var(--accent)' : 'var(--text-secondary)',
                      flexShrink: 0
                    }}
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                <div 
                  style={{
                    maxHeight: isOpen ? '500px' : '0',
                    opacity: isOpen ? '1' : '0',
                    overflow: 'hidden',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  <div 
                    style={{ 
                      padding: '0 1.4rem 1.25rem 1.4rem', 
                      color: 'var(--text-secondary)', 
                      lineHeight: '1.6',
                      fontSize: '0.9rem',
                      whiteSpace: 'pre-line'
                    }}
                  >
                    {t(item.a)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default FAQ;
