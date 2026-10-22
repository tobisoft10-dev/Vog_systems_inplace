import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const ProductCard = ({ 
  product, 
  variant = 'default', 
  onAction, 
  isLoading, 
  statusText,
  isSelected,
  onSelect
}) => {
  const { t } = useLanguage();

  const isProposal = variant === 'proposal';
  const isSelectable = variant === 'selectable';

  return (
    <div 
      className={`glass animate-up revealed ${isSelectable && isSelected ? 'selected-card' : ''}`} 
      onClick={() => isSelectable && onSelect && onSelect(product)}
      style={{ 
        overflow: 'hidden', 
        transition: 'all 0.5s cubic-bezier(0.23, 1, 0.32, 1)',
        borderRadius: '3rem',
        cursor: isSelectable || isProposal ? 'pointer' : 'default',
        border: isSelectable && isSelected ? '2px solid var(--accent)' : '1px solid rgba(255,255,255,0.08)',
        transform: isSelectable && isSelected ? 'scale(1.02)' : 'none',
        background: isSelectable && isSelected ? 'rgba(230, 0, 0, 0.05)' : 'rgba(255,255,255,0.02)',
        position: 'relative',
        maxWidth: '420px',
        margin: '0 auto',
        width: '100%',
        boxShadow: isSelectable && isSelected ? '0 30px 60px rgba(230,0,0,0.1)' : '0 20px 40px rgba(0,0,0,0.3)'
      }}
      onMouseOver={(e) => {
        if (!isSelectable || !isSelected) {
          e.currentTarget.style.transform = 'translateY(-8px)';
          e.currentTarget.style.boxShadow = '0 30px 60px rgba(0,0,0,0.08)';
        }
      }}
      onMouseOut={(e) => {
        if (!isSelectable || !isSelected) {
          e.currentTarget.style.transform = isSelectable && isSelected ? 'scale(1.02)' : 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
    >
      <div style={{ 
        aspectRatio: '4 / 5', 
        overflow: 'hidden', 
        position: 'relative',
        background: 'var(--midnight)',
        borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
        <img 
          src={product.img} 
          alt={product.title} 
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover', 
            objectPosition: 'top center',
            transition: 'transform 1.2s cubic-bezier(0.2, 0.8, 0.2, 1)' 
          }} 
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        />
        {isSelectable && isSelected && (
          <div style={{ 
            position: 'absolute', 
            top: '1.5rem', 
            right: '1.5rem', 
            background: 'var(--accent)', 
            color: 'var(--text-primary)', 
            width: '36px', 
            height: '36px', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 8px 16px rgba(230,0,0,0.4)',
            zIndex: 2,
            fontSize: '1.2rem',
            fontWeight: 'bold'
          }}>
            ✓
          </div>
        )}
      </div>

      <div style={{ padding: variant === 'compact' ? '1.5rem' : '2rem 2.5rem 2.5rem 2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ 
              display: 'inline-block',
              padding: '0.5rem 1rem',
              background: 'rgba(230, 0, 0, 0.1)',
              borderRadius: '100px',
              fontSize: '0.65rem', 
              color: 'var(--accent)', 
              fontWeight: '800', 
              letterSpacing: '2px',
              textTransform: 'uppercase',
              marginBottom: '1rem',
              border: '1px solid var(--accent)'
            }}>
              {product.category}
            </div>
            <h3 style={{ 
              fontSize: variant === 'compact' ? '1.2rem' : '2rem', 
              margin: '0', 
              fontWeight: '900', 
              letterSpacing: '-1px',
              color: 'var(--text-primary)',
              lineHeight: '1.1'
            }}>
              {product.title}
            </h3>
          </div>
          {product.price && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: 'var(--accent)', fontWeight: '900', fontSize: '1.5rem', letterSpacing: '-1px' }}>
                ₺{product.price}
              </div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '1px' }}>
                UNIT PRICE
              </div>
            </div>
          )}
        </div>

        {isProposal && (
          <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button 
              onClick={(e) => { e.stopPropagation(); onAction(product); }}
              disabled={isLoading}
              style={{ 
                background: isLoading ? 'rgba(255,255,255,0.05)' : 'var(--text-primary)',
                border: 'none',
                color: isLoading ? 'var(--text-muted)' : 'var(--midnight)', 
                padding: '1.2rem 2.5rem',
                borderRadius: '100px',
                fontSize: '0.8rem', 
                fontWeight: '900', 
                cursor: isLoading ? 'wait' : 'pointer',
                transition: 'var(--transition)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.8rem'
              }}
              onMouseOver={(e) => { if (!isLoading) { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
              onMouseOut={(e) => { if (!isLoading) { e.currentTarget.style.background = 'var(--text-primary)'; e.currentTarget.style.color = 'var(--midnight)'; } }}>
              {isLoading && <div className="spinner-small" />}
              {isLoading ? statusText.toUpperCase() : t('products.requestQuote').toUpperCase()}
            </button>
            {!isLoading && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)' }}></div>}
          </div>
        )}

        {isSelectable && (
          <div style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: isSelected ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: '700' }}>
            {isSelected ? t('common.selected').toUpperCase() : t('common.select').toUpperCase()}
          </div>
        )}
      </div>

      <style>
        {`
          .spinner-small {
            width: 12px;
            height: 12px;
            border: 2px solid white;
            border-top-color: transparent;
            borderRadius: 50%;
            animation: spin 0.6s linear infinite;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}
      </style>
    </div>
  );
};

export default ProductCard;
