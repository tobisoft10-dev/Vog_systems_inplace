import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const OrderForm = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    customer: '',
    modelName: '',
    fabricType: '',
    quantity: '',
    deadline: '',
    priority: 'standard',
    notes: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newOrder = {
      id: `VOG-2024-${Math.floor(Math.random() * 900 + 100)}`,
      customer: formData.customer,
      model: formData.modelName,
      quantity: parseInt(formData.quantity) || 0,
      status: 'pending',
      deadline: formData.deadline,
      priority: formData.priority.charAt(0).toUpperCase() + formData.priority.slice(1)
    };

    const existingOrders = JSON.parse(localStorage.getItem('vog_admin_orders') || '[]');
    localStorage.setItem('vog_admin_orders', JSON.stringify([newOrder, ...existingOrders]));

    alert(t('customer.orderSuccess'));
    navigate('/admin/orders');
  };

  const inputStyle = {
    padding: '1.2rem', 
    background: 'rgba(0, 0, 0, 0.4)', 
    border: '1px solid rgba(255,255,255,0.1)', 
    borderRadius: '12px', 
    color: 'var(--text-primary)', 
    outline: 'none',
    transition: 'all 0.3s ease',
    fontSize: '0.95rem'
  };

  const labelStyle = {
    fontSize: '0.75rem', 
    fontWeight: '950', 
    textTransform: 'uppercase', 
    color: 'var(--text-primary)',
    letterSpacing: '2px',
    marginBottom: '0.5rem',
  };

  return (
    <div className="order-form-page" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '4rem' }}>
        <button onClick={() => navigate('/admin/orders')} style={{ 
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', cursor: 'pointer', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.8rem 1.5rem', borderRadius: '100px', fontSize: '0.75rem', fontWeight: '950', letterSpacing: '1px', textTransform: 'uppercase', transition: 'var(--transition)'
        }}
        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
        onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
          {t('admin.orderForm.backBtn')}
        </button>
        <h1 style={{ fontSize: '4.5rem', marginBottom: '1rem', color: 'var(--text-primary)', fontWeight: '950', letterSpacing: '-3px' }}>{t('admin.orderForm.title')}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.4rem', fontWeight: '500' }}>{t('admin.orderForm.subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card" style={{ padding: '6rem', display: 'flex', flexDirection: 'column', gap: '4rem', background: 'rgba(255,255,255,0.02)', borderRadius: '4rem', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 80px 150px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={labelStyle}>{t('admin.orderForm.customer')}</label>
            <input 
              name="customer" 
              value={formData.customer} 
              onChange={handleChange} 
              placeholder={t('admin.orderForm.placeholders.customer')} 
              required
              style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = '#E60000'; e.target.style.boxShadow = '0 0 15px rgba(230,0,0,0.4)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={labelStyle}>{t('admin.orderForm.model')}</label>
            <input 
              name="modelName" 
              value={formData.modelName} 
              onChange={handleChange} 
              placeholder={t('admin.orderForm.placeholders.model')} 
              required
              style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = '#E60000'; e.target.style.boxShadow = '0 0 15px rgba(230,0,0,0.4)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={labelStyle}>{t('admin.orderForm.fabric')}</label>
            <input 
              name="fabricType" 
              value={formData.fabricType} 
              onChange={handleChange} 
              placeholder={t('admin.orderForm.placeholders.fabric')} 
              style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = '#00f3ff'; e.target.style.boxShadow = '0 0 15px rgba(0,243,255,0.4)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={labelStyle}>{t('admin.orderForm.quantity')}</label>
            <input 
              name="quantity" 
              type="number"
              value={formData.quantity} 
              onChange={handleChange} 
              placeholder="0" 
              required
              style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = '#D4AF37'; e.target.style.boxShadow = '0 0 15px rgba(212,175,55,0.4)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={labelStyle}>{t('admin.orderForm.deadline')}</label>
            <input 
              name="deadline" 
              type="date"
              value={formData.deadline} 
              onChange={handleChange} 
              required
              style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = 'var(--color-success)'; e.target.style.boxShadow = '0 0 15px var(--color-success-bg)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={labelStyle}>{t('admin.orderForm.priority')}</label>
            <select 
              name="priority" 
              value={formData.priority} 
              onChange={handleChange}
              style={{ ...inputStyle, appearance: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.05)' }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--text-primary)'; e.target.style.boxShadow = '0 0 20px rgba(255,255,255,0.2)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
            >
              <option value="low" style={{ background: '#0a0d14' }}>{t('admin.orderForm.priorities.low')}</option>
              <option value="standard" style={{ background: '#0a0d14' }}>{t('admin.orderForm.priorities.medium')}</option>
              <option value="high" style={{ background: '#0a0d14' }}>{t('admin.orderForm.priorities.high')}</option>
              <option value="urgent" style={{ background: '#0a0d14' }}>{t('admin.orderForm.priorities.urgent')}</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={labelStyle}>{t('admin.orderForm.notes')}</label>
          <textarea 
            name="notes" 
            value={formData.notes} 
            onChange={handleChange} 
            placeholder={t('admin.orderForm.placeholders.notes')} 
            rows="4"
            style={{ ...inputStyle, resize: 'none' }}
            onFocus={(e) => { e.target.style.borderColor = '#E60000'; e.target.style.boxShadow = '0 0 15px rgba(230,0,0,0.4)'; }}
            onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
          />
        </div>

        <div style={{ display: 'flex', gap: '2rem', marginTop: '3rem' }}>
          <button type="submit" style={{ 
            flex: 2, 
            background: 'var(--text-primary)',
            color: 'var(--midnight)',
            padding: '2rem',
            borderRadius: '2rem',
            fontWeight: '950',
            fontSize: '1.2rem',
            textTransform: 'uppercase',
            letterSpacing: '3px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            transition: 'var(--transition)'
          }}>
            {t('admin.orderForm.submit').toUpperCase()}
          </button>
          
          <button type="button" onClick={() => navigate('/admin/orders')} style={{ 
            flex: 1, 
            padding: '2rem', 
            borderRadius: '2rem', 
            border: '1px solid rgba(255,255,255,0.1)', 
            background: 'transparent', 
            color: 'var(--text-muted)', 
            cursor: 'pointer', 
            fontWeight: '900',
            fontSize: '1rem',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            transition: 'var(--transition)'
          }}>
            {t('common.cancel').toUpperCase()}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OrderForm;

