import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../services/apiConfig';

const AdminSettings = () => {
  const { t, lang, setLanguage, themeMode, toggleThemeMode } = useLanguage();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState(0);
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [twoFA, setTwoFA] = useState(false);
  const [notifications, setNotifications] = useState({
    emailOrders: true,
    emailStock: true,
    emailRFID: false,
    pushOrders: true,
    pushStock: false,
    pushSystem: true
  });
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [notifSaved, setNotifSaved] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/admin/settings`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          if (data.data.notifications) {
            // In a real app we might map specific notification fields here
          }
        }
      })
      .catch(err => console.error("Error fetching settings:", err));
  }, []);

  const sections = [
    { title: t('admin.settings.sections.general'), icon: '⚙️', id: 'general' },
    { title: t('admin.settings.sections.security'), icon: '🔒', id: 'security' },
    { title: t('admin.settings.sections.notifications'), icon: '🔔', id: 'notifications' },
  ];

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (passwordForm.newPass !== passwordForm.confirm) {
      alert(t('admin.settings.security.passMismatch'));
      return;
    }
    if (passwordForm.newPass.length < 6) {
      alert(t('admin.settings.security.passLength'));
      return;
    }
    setPasswordSaved(true);
    setPasswordForm({ current: '', newPass: '', confirm: '' });
    setTimeout(() => setPasswordSaved(false), 3000);
  };

  const handleNotifSave = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifications })
      });
      if (res.ok) {
        setNotifSaved(true);
        setTimeout(() => setNotifSaved(false), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const inputStyle = {
    width: '100%', padding: '1.2rem 1.5rem', background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1.2rem',
    color: 'var(--text-primary)', fontWeight: '800', outline: 'none', transition: '0.3s'
  };

  const toggleStyle = (active) => ({
    width: '52px', height: '28px', borderRadius: '100px', cursor: 'pointer', border: 'none',
    background: active ? 'var(--color-success)' : (themeMode === 'light' ? 'rgba(15, 23, 42, 0.1)' : 'rgba(255,255,255,0.1)'), position: 'relative',
    transition: '0.3s', boxShadow: active ? (themeMode === 'light' ? '0 0 12px rgba(5,150,105,0.2)' : '0 0 15px rgba(0,255,102,0.3)') : 'none'
  });

  const toggleKnob = (active) => ({
    position: 'absolute', top: '3px', left: active ? '26px' : '3px',
    width: '22px', height: '22px', borderRadius: '50%', background: 'var(--text-primary)',
    transition: '0.3s', boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
  });

  return (
    <div className="admin-settings">
      <div style={{ marginBottom: '3rem' }}>
        <button 
          onClick={() => navigate('/admin')}
          style={{ 
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', 
              padding: '0.6rem 1.2rem', borderRadius: '100px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '800',
              marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: '0.3s'
          }}
          onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
        >
          {t('admin.settings.goBack')}
        </button>
        <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem', color: 'var(--text-primary)', letterSpacing: '-1px', textShadow: '0 0 20px rgba(255,255,255,0.2)' }}>{t('admin.settings.title')}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>{t('admin.settings.subtitle')}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '3rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', height: 'fit-content' }}>
          {sections.map((section, i) => (
            <div key={i} 
              onClick={() => setActiveSection(i)}
              style={{ 
                padding: '1.2rem 1.5rem', 
                borderRadius: '12px', 
                color: activeSection === i ? 'var(--text-primary)' : 'var(--text-secondary)', 
                background: activeSection === i ? 'rgba(255,255,255,0.05)' : 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                fontWeight: '700',
                fontSize: '0.9rem',
                transition: 'all 0.3s ease',
                borderLeft: activeSection === i ? '3px solid #E60000' : '3px solid transparent'
              }}
              onMouseOver={(e) => { if(activeSection !== i) e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseOut={(e) => { if(activeSection !== i) e.currentTarget.style.color = 'var(--text-secondary)'; }}>
              <span>{section.icon}</span>
              {section.title}
            </div>
          ))}
        </div>

        <div className="glass-panel" style={{ padding: '3rem' }}>
          {/* ========== GENEL AYARLAR ========== */}
          {activeSection === 0 && (
            <>
              <div style={{ marginBottom: '3rem' }}>
                <h3 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {t('admin.settings.language')}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div 
                    onClick={() => setLanguage('tr')}
                    style={{ 
                      padding: '1.5rem', 
                      borderRadius: '16px', 
                      border: lang === 'tr' ? '2px solid #E60000' : (themeMode === 'light' ? '1px solid rgba(15, 23, 42, 0.15)' : '1px solid rgba(255,255,255,0.1)'),
                      background: lang === 'tr' ? 'rgba(230,0,0,0.05)' : (themeMode === 'light' ? 'rgba(15, 23, 42, 0.02)' : 'rgba(255,255,255,0.02)'),
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}>
                    <div style={{ fontWeight: '800', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>TÜRKÇE</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t('admin.settings.langDesc')}: Türkçe</div>
                  </div>
                  <div 
                    onClick={() => setLanguage('en')}
                    style={{ 
                      padding: '1.5rem', 
                      borderRadius: '16px', 
                      border: lang === 'en' ? '2px solid #E60000' : (themeMode === 'light' ? '1px solid rgba(15, 23, 42, 0.15)' : '1px solid rgba(255,255,255,0.1)'),
                      background: lang === 'en' ? 'rgba(230,0,0,0.05)' : (themeMode === 'light' ? 'rgba(15, 23, 42, 0.02)' : 'rgba(255,255,255,0.02)'),
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}>
                    <div style={{ fontWeight: '800', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>ENGLISH</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t('admin.settings.langDesc')}: English</div>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '3rem' }}>
                <h3 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', marginBottom: '1.5rem' }}>{t('admin.settings.theme')}</h3>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                   <div 
                     onClick={() => { if(themeMode !== 'dark') toggleThemeMode(); }}
                     style={{ flex: 1, padding: '1.5rem', borderRadius: '16px', border: themeMode === 'dark' ? '2px solid #00f3ff' : (themeMode === 'light' ? '1px solid rgba(15, 23, 42, 0.15)' : '1px solid rgba(255,255,255,0.1)'), background: themeMode === 'dark' ? 'rgba(0,243,255,0.05)' : (themeMode === 'light' ? 'rgba(15, 23, 42, 0.02)' : 'rgba(255,255,255,0.02)'), cursor: 'pointer', transition: '0.3s' }}>
                     <div style={{ fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>🌙 {t('admin.settings.dark')}</div>
                     <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{t('admin.settings.darkDesc')}</div>
                   </div>
                   <div 
                     onClick={() => { if(themeMode !== 'light') toggleThemeMode(); }}
                     style={{ flex: 1, padding: '1.5rem', borderRadius: '16px', border: themeMode === 'light' ? '2px solid #E60000' : (themeMode === 'light' ? '1px solid rgba(15, 23, 42, 0.15)' : '1px solid rgba(255,255,255,0.1)'), background: themeMode === 'light' ? 'rgba(230,0,0,0.05)' : (themeMode === 'light' ? 'rgba(15, 23, 42, 0.02)' : 'rgba(255,255,255,0.02)'), cursor: 'pointer', transition: '0.3s' }}>
                     <div style={{ fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>☀️ {t('admin.settings.light')}</div>
                     <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{t('admin.settings.lightDesc')}</div>
                   </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '3rem', marginTop: '3rem' }}>
                <h3 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', marginBottom: '1.5rem' }}>{t('admin.settings.infrastructure.title')}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  {[
                    { name: t('admin.settings.infrastructure.sick'), status: t('admin.settings.infrastructure.online'), color: 'var(--color-success)', endpoint: 'hardware/status' },
                    { name: t('admin.settings.infrastructure.logo'), status: t('admin.settings.infrastructure.online'), color: 'var(--color-success)', endpoint: 'logo/status' },
                    { name: t('admin.settings.infrastructure.sorter'), status: t('admin.settings.infrastructure.active'), color: 'var(--color-success)' },
                    { name: t('admin.settings.infrastructure.ai'), status: t('admin.settings.infrastructure.online'), color: 'var(--color-success)' },
                  ].map((service, i) => (
                    <div key={i} style={{ padding: '1.2rem', background: themeMode === 'light' ? 'rgba(15, 23, 42, 0.02)' : 'rgba(255,255,255,0.02)', borderRadius: '12px', border: themeMode === 'light' ? '1px solid rgba(15, 23, 42, 0.06)' : '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>{service.name}</span>
                        {service.endpoint && <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>v1.0.4-stable</span>}
                      </div>
                      <span style={{ fontSize: '0.7rem', fontWeight: '800', color: service.color, background: 'var(--color-success-bg)', padding: '0.3rem 0.6rem', borderRadius: '4px' }}>{service.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ========== GÜVENLİK AYARLARI ========== */}
          {activeSection === 1 && (
            <>
              <div style={{ marginBottom: '3rem' }}>
                <h3 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {t('admin.settings.security.title')}
                </h3>
                {passwordSaved && (
                  <div style={{ padding: '1rem 1.5rem', background: 'var(--color-success-bg)', border: '1px solid var(--color-success)', borderRadius: '1rem', color: 'var(--color-success)', fontWeight: '900', fontSize: '0.85rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    {t('admin.settings.security.passSuccess')}
                  </div>
                )}
                <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.7rem', fontWeight: '950', color: 'var(--text-muted)', letterSpacing: '2px' }}>{t('admin.settings.security.currentPass')}</label>
                    <input type="password" value={passwordForm.current} onChange={e => setPasswordForm({...passwordForm, current: e.target.value})} required placeholder="••••••••" style={inputStyle} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.7rem', fontWeight: '950', color: 'var(--text-muted)', letterSpacing: '2px' }}>{t('admin.settings.security.newPass')}</label>
                      <input type="password" value={passwordForm.newPass} onChange={e => setPasswordForm({...passwordForm, newPass: e.target.value})} required placeholder={t('admin.settings.security.newPassPlaceholder')} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.7rem', fontWeight: '950', color: 'var(--text-muted)', letterSpacing: '2px' }}>{t('admin.settings.security.confirmPass')}</label>
                      <input type="password" value={passwordForm.confirm} onChange={e => setPasswordForm({...passwordForm, confirm: e.target.value})} required placeholder={t('admin.settings.security.confirmPassPlaceholder')} style={inputStyle} />
                    </div>
                  </div>
                  <button type="submit" 
                    style={{ padding: '1.2rem', borderRadius: '1.2rem', background: 'var(--text-primary)', color: 'var(--midnight)', border: 'none', fontWeight: '950', cursor: 'pointer', fontSize: '0.9rem', letterSpacing: '1px', boxShadow: themeMode === 'light' ? '0 15px 30px rgba(15,23,42,0.05)' : '0 15px 30px rgba(255,255,255,0.08)', transition: '0.3s', width: 'fit-content', paddingLeft: '3rem', paddingRight: '3rem' }}
                    onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'; e.currentTarget.style.boxShadow = themeMode === 'light' ? '0 10px 25px rgba(15,23,42,0.12)' : '0 10px 25px rgba(255,255,255,0.15)'; }}
                    onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = themeMode === 'light' ? '0 15px 30px rgba(15,23,42,0.05)' : '0 15px 30px rgba(255,255,255,0.08)'; }}
                  >
                    {t('admin.settings.security.updateBtn')}
                  </button>
                </form>
              </div>

              <div style={{ borderTop: themeMode === 'light' ? '1px solid rgba(15, 23, 42, 0.06)' : '1px solid rgba(255,255,255,0.05)', paddingTop: '3rem' }}>
                <h3 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', marginBottom: '1.5rem' }}>{t('admin.settings.security.twoFA')}</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2rem', background: themeMode === 'light' ? 'rgba(15, 23, 42, 0.02)' : 'rgba(255,255,255,0.02)', borderRadius: '1.5rem', border: themeMode === 'light' ? '1px solid rgba(15, 23, 42, 0.06)' : '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <div style={{ color: 'var(--text-primary)', fontWeight: '900', marginBottom: '0.5rem' }}>{t('admin.settings.security.authApp')}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t('admin.settings.security.authAppDesc')}</div>
                  </div>
                  <button onClick={() => setTwoFA(!twoFA)} style={toggleStyle(twoFA)}>
                    <div style={toggleKnob(twoFA)}></div>
                  </button>
                </div>
                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2rem', background: themeMode === 'light' ? 'rgba(15, 23, 42, 0.02)' : 'rgba(255,255,255,0.02)', borderRadius: '1.5rem', border: themeMode === 'light' ? '1px solid rgba(15, 23, 42, 0.06)' : '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <div style={{ color: 'var(--text-primary)', fontWeight: '900', marginBottom: '0.5rem' }}>{t('admin.settings.security.timeout')}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t('admin.settings.security.timeoutDesc')}</div>
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: '950', color: 'var(--color-info)', background: 'rgba(0,243,255,0.1)', padding: '0.5rem 1.2rem', borderRadius: '100px' }}>{t('admin.settings.security.active')}</span>
                </div>
              </div>
            </>
          )}

          {/* ========== BİLDİRİM AYARLARI ========== */}
          {activeSection === 2 && (
            <>
              <h3 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', marginBottom: '2rem' }}>{t('admin.settings.notifications.emailTitle')}</h3>
              {notifSaved && (
                <div style={{ padding: '1rem 1.5rem', background: 'var(--color-success-bg)', border: '1px solid var(--color-success)', borderRadius: '1rem', color: 'var(--color-success)', fontWeight: '900', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                  {t('admin.settings.notifications.notifSuccess')}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '3rem' }}>
                {[
                  { key: 'emailOrders', label: t('admin.settings.notifications.emailOrders'), desc: t('admin.settings.notifications.emailOrdersDesc') },
                  { key: 'emailStock', label: t('admin.settings.notifications.emailStock'), desc: t('admin.settings.notifications.emailStockDesc') },
                  { key: 'emailRFID', label: t('admin.settings.notifications.emailRFID'), desc: t('admin.settings.notifications.emailRFIDDesc') }
                ].map(item => (
                  <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2rem', background: themeMode === 'light' ? 'rgba(15, 23, 42, 0.02)' : 'rgba(255,255,255,0.02)', borderRadius: '1.5rem', border: themeMode === 'light' ? '1px solid rgba(15, 23, 42, 0.06)' : '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                      <div style={{ color: 'var(--text-primary)', fontWeight: '800', marginBottom: '0.3rem' }}>{item.label}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.desc}</div>
                    </div>
                    <button onClick={() => setNotifications({...notifications, [item.key]: !notifications[item.key]})} style={toggleStyle(notifications[item.key])}>
                      <div style={toggleKnob(notifications[item.key])}></div>
                    </button>
                  </div>
                ))}
              </div>

              <h3 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', marginBottom: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2rem' }}>{t('admin.settings.notifications.pushTitle')}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                {[
                  { key: 'pushOrders', label: t('admin.settings.notifications.pushOrders'), desc: t('admin.settings.notifications.pushOrdersDesc') },
                  { key: 'pushStock', label: t('admin.settings.notifications.pushStock'), desc: t('admin.settings.notifications.pushStockDesc') },
                  { key: 'pushSystem', label: t('admin.settings.notifications.pushSystem'), desc: t('admin.settings.notifications.pushSystemDesc') }
                ].map(item => (
                  <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2rem', background: themeMode === 'light' ? 'rgba(15, 23, 42, 0.02)' : 'rgba(255,255,255,0.02)', borderRadius: '1.5rem', border: themeMode === 'light' ? '1px solid rgba(15, 23, 42, 0.06)' : '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                      <div style={{ color: 'var(--text-primary)', fontWeight: '800', marginBottom: '0.3rem' }}>{item.label}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.desc}</div>
                    </div>
                    <button onClick={() => setNotifications({...notifications, [item.key]: !notifications[item.key]})} style={toggleStyle(notifications[item.key])}>
                      <div style={toggleKnob(notifications[item.key])}></div>
                    </button>
                  </div>
                ))}
              </div>

              <button 
                onClick={handleNotifSave}
                style={{ padding: '1.2rem 3rem', borderRadius: '1.2rem', background: 'var(--text-primary)', color: 'var(--midnight)', border: 'none', fontWeight: '950', cursor: 'pointer', fontSize: '0.9rem', letterSpacing: '1px', boxShadow: themeMode === 'light' ? '0 15px 30px rgba(15,23,42,0.05)' : '0 15px 30px rgba(255,255,255,0.08)', transition: '0.3s' }}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'; e.currentTarget.style.boxShadow = themeMode === 'light' ? '0 10px 25px rgba(15,23,42,0.12)' : '0 10px 25px rgba(255,255,255,0.15)'; }}
                onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = themeMode === 'light' ? '0 15px 30px rgba(15,23,42,0.05)' : '0 15px 30px rgba(255,255,255,0.08)'; }}
              >
                {t('admin.settings.notifications.saveBtn')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
