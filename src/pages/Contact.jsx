import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import API_BASE_URL from '../services/apiConfig';

const Contact = () => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({ name: '', email: '', service: '' });
  const [status, setStatus] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;
    try {
      setStatus('Gönderiliyor...');
      const res = await fetch(`${API_BASE_URL}/api/contact/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setStatus('Talebiniz başarıyla alındı.');
        setFormData({ name: '', email: '', service: '' });
        setTimeout(() => setStatus(''), 3000);
      }
    } catch (err) {
      console.error(err);
      setStatus('Hata oluştu.');
    }
  };

  return (
    <div className="contact-page" style={{ paddingTop: '8rem' }}>
      <section className="container">
        <h1 style={{ fontSize: 'clamp(3rem, 8vw, 5rem)', marginBottom: '3rem' }}>
          {t('contact.title').split(' ').slice(0, 2).join(' ')} <span className="gradient-text">{t('contact.title').split(' ')[2]}</span> {t('contact.title').split(' ')[3]}
        </h1>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem' }}>
          <div className="glass" style={{ padding: '3rem' }}>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '2rem' }}>{t('contact.getInTouch')}</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{t('contact.form.name')}</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required style={{ width: '100%', padding: '1rem', background: 'var(--text-primary)', border: '1px solid var(--glass-border)', color: 'var(--midnight)', borderRadius: '0.5rem' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{t('contact.form.email')}</label>
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required style={{ width: '100%', padding: '1rem', background: 'var(--text-primary)', border: '1px solid var(--glass-border)', color: 'var(--midnight)', borderRadius: '0.5rem' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{t('contact.form.service')}</label>
                <select value={formData.service} onChange={e => setFormData({...formData, service: e.target.value})} style={{ width: '100%', padding: '1rem', background: 'var(--text-primary)', border: '1px solid var(--glass-border)', color: 'var(--midnight)', borderRadius: '0.5rem' }}>
                  <option value="">{t('contact.form.services.uniforms')}</option>
                  <option>{t('contact.form.services.motorsports')}</option>
                  <option>{t('contact.form.services.printing')}</option>
                  <option>{t('contact.form.services.embroidery')}</option>
                </select>
              </div>
              {status && <div style={{ color: 'var(--color-success)', fontSize: '0.9rem', fontWeight: 'bold' }}>{status}</div>}
              <button className="btn-primary" type="submit" style={{ marginTop: '1rem' }}>{t('contact.form.submit')}</button>
            </form>
          </div>
          
          <div>
            <div className="glass" style={{ padding: '3rem', marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1.5rem', color: 'var(--accent)' }}>{t('contact.operations')}</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Madenler Mah. Şehit Ünal Kalafat Cad. No: 32/14</p>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Ümraniye, İstanbul, TR</p>
              <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <a href="mailto:info@vogtekstil.com.tr" style={{ color: 'var(--text-primary)', fontWeight: '600', textDecoration: 'none' }}>info@vogtekstil.com.tr</a>
                <a href="tel:+902164845558" style={{ color: 'var(--text-primary)', fontWeight: '600', textDecoration: 'none' }}>+90 (216) 484 55 58</a>
              </div>
            </div>

            <div className="glass" style={{ padding: '3rem', marginBottom: '2rem', transition: 'transform 0.3s ease' }}>
              <h3 style={{ marginBottom: '1.5rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.2rem' }}>🕒</span> {t('contact.hoursTitle')}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.6rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{t('contact.weekday').split(': ')[0]}</span>
                  <span style={{ fontWeight: '600' }}>{t('contact.weekday').split(': ')[1]}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.6rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{t('contact.saturday').split(': ')[0]}</span>
                  <span style={{ fontWeight: '600' }}>{t('contact.saturday').split(': ')[1]}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{t('contact.sunday').split(': ')[0]}</span>
                  <span style={{ fontWeight: '600' }}>{t('contact.sunday').split(': ')[1]}</span>
                </div>
              </div>
            </div>
            
            <div style={{ position: 'relative', height: '200px', borderRadius: '1.5rem', overflow: 'hidden', background: 'var(--glass)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{t('contact.mapPlaceholder')}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
