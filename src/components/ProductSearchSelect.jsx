import React, { useState, useEffect, useRef, useMemo } from 'react';

const ProductSearchSelect = ({ value, onChange, masterProducts, isLight }) => {
    const [search, setSearch] = useState(value || '');
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Keep search input text in sync when parent value changes
    useEffect(() => {
        setSearch(value || '');
    }, [value]);

    // De-duplicate product names
    const uniqueProducts = useMemo(() => {
        const seen = new Set();
        return masterProducts.filter(p => {
            const name = p.product_name?.trim();
            if (!name || seen.has(name)) return false;
            seen.add(name);
            return true;
        });
    }, [masterProducts]);

    // Filter products based on search input
    const filtered = useMemo(() => {
        if (!search) return uniqueProducts;
        const q = search.toLowerCase();
        return uniqueProducts.filter(p => p.product_name.toLowerCase().includes(q));
    }, [search, uniqueProducts]);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        onChange(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder="Ürün Ara..."
                    style={{
                        width: '100%',
                        padding: '0.6rem 2rem 0.6rem 1rem',
                        background: isLight ? '#fff' : '#111',
                        color: 'var(--text-primary)',
                        border: `1px solid ${isLight ? '#ccc' : '#333'}`,
                        borderRadius: '8px',
                        outline: 'none',
                        fontSize: '0.9rem',
                        transition: 'all 0.2s ease',
                        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
                    }}
                />
                <span 
                    onClick={() => setIsOpen(!isOpen)}
                    style={{ 
                        position: 'absolute', 
                        right: '10px', 
                        cursor: 'pointer', 
                        fontSize: '0.7rem', 
                        color: 'var(--text-secondary)',
                        userSelect: 'none',
                        transition: 'transform 0.2s ease',
                        transform: isOpen ? 'rotate(180deg)' : 'none'
                    }}
                >
                    ▼
                </span>
            </div>
            {isOpen && filtered.length > 0 && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    maxHeight: '220px',
                    overflowY: 'auto',
                    background: isLight ? '#fff' : '#151515',
                    border: `1px solid ${isLight ? '#ccc' : '#333'}`,
                    borderRadius: '8px',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
                    zIndex: 1000,
                    marginTop: '4px'
                }}>
                    {filtered.map((p, idx) => (
                        <div
                            key={idx}
                            onClick={() => {
                                onChange(p.product_name);
                                setSearch(p.product_name);
                                setIsOpen(false);
                            }}
                            style={{
                                padding: '0.65rem 1rem',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                color: 'var(--text-primary)',
                                borderBottom: idx < filtered.length - 1 ? `1px solid ${isLight ? '#eee' : '#222'}` : 'none',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = isLight ? '#f5f5f5' : '#252525'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        >
                            {p.product_name}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProductSearchSelect;
