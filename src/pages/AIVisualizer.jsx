import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

const AIVisualizer = () => {
    const { t } = useLanguage();
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [result, setResult] = useState(null);
    const [fabric, setFabric] = useState('Cotton');
    const [style, setStyle] = useState('Corporate');
    
    const [savedDesigns, setSavedDesigns] = useState([
        { id: 'DES-001', name: 'ZARA Classic Polo', image: '/vog_images/cat_polos.jpg', date: '2026-05-01' },
        { id: 'DES-002', name: 'SEAT Reflective Suit', image: '/vog_images/cat_workwears.jpg', date: '2026-05-03' }
    ]);

    const handleGenerate = async () => {
        if (!prompt) return;
        setIsGenerating(true);
        setResult(null);
        
        try {
            // Mock AI Generation delay
            await new Promise(resolve => setTimeout(resolve, 2500));
            
            // Just randomly select one of the existing images for the mock
            const mockImages = ['/vog_images/cat_jackets.jpg', '/vog_images/cat_shirts.jpg', '/vog_images/cat_sweatshirts.jpg'];
            const mockImageUrl = mockImages[Math.floor(Math.random() * mockImages.length)];
            
            setResult(mockImageUrl);
            setSavedDesigns(prev => [{
                id: `DES-${Math.floor(Math.random() * 1000)}`,
                name: `${prompt.substring(0, 15).toUpperCase()} ${style.toUpperCase()}`,
                image: mockImageUrl,
                date: new Date().toISOString().split('T')[0]
            }, ...prev]);
        } catch (error) {
            console.error("AI Generation Error:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleRequestSample = (designName) => {
        alert(`NUMUNE TALEBİ ALINDI: ${designName}\n\nÜretim ekibimiz tasarımınızı inceleyip en kısa sürede size geri dönüş yapacaktır.`);
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
            <header style={{ marginBottom: '4rem' }}>
                <h1 style={{ fontSize: '3.5rem', fontWeight: '950', letterSpacing: '-2px', color: 'var(--text-primary)', lineHeight: '1' }}>
                    AI <span className="gradient-text">{t('aiLab.title') || 'TASARIM LABORATUVARI'}</span>
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginTop: '1rem', letterSpacing: '1px' }}>
                    {t('aiLab.subtitle') || 'Yapay Zeka Destekli Endüstriyel Tasarım Asistanı'}
                </p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '3rem' }}>
                {/* Controls */}
                <div className="prism-glass holographic" style={{ padding: '3rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '2px' }}>
                            {t('aiLab.productDesc') || 'ÜRÜN TANIMI VE DETAYLAR'}
                        </label>
                        <textarea 
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={t('aiLab.placeholder') || 'Örn: Siyah renkli, altın fermuarlı, reflektör şeritli teknik personel ceketi...'}
                            style={{ 
                                background: 'var(--input-bg)', 
                                border: '1px solid var(--input-border)', 
                                borderRadius: '4px', 
                                padding: '1.5rem', 
                                color: 'var(--text-primary)', 
                                minHeight: '150px',
                                fontSize: '1rem',
                                resize: 'none',
                                outline: 'none',
                                transition: 'var(--transition)'
                            }}
                            onFocus={(e) => e.target.style.border = '1px solid var(--accent)'}
                            onBlur={(e) => e.target.style.border = '1px solid var(--input-border)'}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            <label style={{ fontSize: '0.7rem', fontWeight: '900', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('aiLab.fabricType') || 'KUMAŞ TİPİ'}</label>
                            <select value={fabric} onChange={e => setFabric(e.target.value)} style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)', padding: '1.2rem', borderRadius: '4px', outline: 'none', fontSize: '0.9rem' }}>
                                <option value="Cotton">{t('aiLab.fabrics.cotton') || 'Pamuk (Cotton)'}</option>
                                <option value="Polyester">{t('aiLab.fabrics.polyester') || 'Polyester'}</option>
                                <option value="Antistatic">{t('aiLab.fabrics.antistatic') || 'Antistatik (ESD)'}</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            <label style={{ fontSize: '0.7rem', fontWeight: '900', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('aiLab.style') || 'STİL & KESİM'}</label>
                            <select value={style} onChange={e => setStyle(e.target.value)} style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)', padding: '1.2rem', borderRadius: '4px', outline: 'none', fontSize: '0.9rem' }}>
                                <option value="Corporate">{t('aiLab.styles.corporate') || 'Kurumsal (Corporate)'}</option>
                                <option value="Technical">{t('aiLab.styles.technical') || 'Teknik (Technical)'}</option>
                                <option value="Minimal">{t('aiLab.styles.minimal') || 'Minimal'}</option>
                            </select>
                        </div>
                    </div>

                    <button 
                        onClick={handleGenerate}
                        disabled={isGenerating || !prompt}
                        style={{ 
                            background: 'var(--text-primary)', 
                            color: 'var(--midnight)', 
                            padding: '1.5rem', 
                            borderRadius: '4px', 
                            fontWeight: '950', 
                            fontSize: '0.9rem', 
                            border: 'none', 
                            cursor: 'pointer',
                            textTransform: 'uppercase',
                            letterSpacing: '3px',
                            marginTop: '1rem',
                            opacity: isGenerating || !prompt ? 0.5 : 1,
                            transition: 'var(--transition)'
                        }}
                        onMouseOver={(e) => {
                          if (!isGenerating && prompt) {
                            e.currentTarget.style.background = 'var(--accent)';
                            e.currentTarget.style.color = '#fff';
                          }
                        }}
                        onMouseOut={(e) => {
                          if (!isGenerating && prompt) {
                            e.currentTarget.style.background = 'var(--text-primary)';
                            e.currentTarget.style.color = 'var(--midnight)';
                          }
                        }}
                    >
                        {isGenerating ? (t('aiLab.generating') || 'ÜRETİLİYOR...') : (t('aiLab.generate') || 'GÖRSEL ÜRET ✨')}
                    </button>
                </div>

                {/* Preview Area */}
                <div className="prism-glass" style={{ 
                    borderRadius: '12px', 
                    background: 'var(--input-bg)', 
                    border: '1px solid var(--input-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    position: 'relative',
                    minHeight: '500px'
                }}>
                    {!result && !isGenerating && (
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                            <div style={{ fontSize: '4rem', marginBottom: '1.5rem', opacity: 0.5 }}>🤖</div>
                            <div style={{ fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase' }}>{t('aiLab.noDesign') || 'HENÜZ TASARIM YOK'}</div>
                        </div>
                    )}

                    {isGenerating && (
                        <div style={{ textAlign: 'center' }}>
                            <div className="ai-loader" style={{ 
                                width: '80px', 
                                height: '80px', 
                                border: '3px solid rgba(255,255,255,0.1)', 
                                borderTop: '3px solid var(--accent)', 
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                                margin: '0 auto 2rem'
                            }}></div>
                            <div style={{ color: 'var(--text-primary)', fontWeight: '900', letterSpacing: '4px', textTransform: 'uppercase' }}>
                                {t('aiLab.analyzing') || 'YAPAY ZEKA ANALİZ EDİYOR...'}
                            </div>
                        </div>
                    )}

                    {result && !isGenerating && (
                        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                            <img src={result} alt="AI Generated Design" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{ 
                                position: 'absolute', 
                                bottom: '1.5rem', 
                                left: '1.5rem', 
                                right: '1.5rem',
                                background: 'rgba(5,5,5,0.85)',
                                backdropFilter: 'blur(10px)',
                                padding: '1.5rem',
                                borderRadius: '8px',
                                border: '1px solid var(--glass-border)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div>
                                        <div style={{ color: 'var(--text-primary)', fontWeight: '950', fontSize: '1.1rem', textTransform: 'uppercase' }}>
                                            {prompt.substring(0, 20)}... {style}
                                        </div>
                                        <div style={{ color: 'var(--accent)', fontSize: '0.75rem', fontWeight: '800', letterSpacing: '1px', marginTop: '0.3rem' }}>
                                            AI Model: VOG-Gen 1.0 • Technical Blueprint
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleRequestSample(prompt.substring(0, 20))}
                                        style={{ background: 'var(--text-primary)', color: 'var(--midnight)', padding: '0.8rem 1.5rem', borderRadius: '4px', fontWeight: '950', border: 'none', cursor: 'pointer', fontSize: '0.75rem', letterSpacing: '1px' }}
                                    >
                                        {t('aiLab.requestSample') || 'NUMUNE TALEBİ ET ↗'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div style={{ marginTop: '6rem' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: '950', color: 'var(--text-primary)', marginBottom: '2.5rem', letterSpacing: '-1px' }}>
                    {t('aiLab.savedDesigns') || 'KAYITLI TASARIMLARINIZ'}
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2.5rem' }}>
                    {savedDesigns.map(design => (
                        <div key={design.id} className="prism-glass" style={{ padding: '1rem', borderRadius: '12px', overflow: 'hidden' }}>
                            <img src={design.image} alt={design.name} style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: '8px', marginBottom: '1.5rem' }} />
                            <div style={{ padding: '0 0.5rem 0.5rem' }}>
                                <div style={{ color: 'var(--text-primary)', fontWeight: '950', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '0.3rem' }}>{design.name}</div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: '800' }}>{design.date}</div>
                                <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.5rem' }}>
                                    <button 
                                        onClick={() => {
                                            setResult(design.image);
                                            setPrompt(design.name);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                        style={{ flex: 1, background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--input-border)', padding: '0.8rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '900', cursor: 'pointer', transition: '0.3s' }}
                                    >
                                        {t('aiLab.view') || 'İNCELE'}
                                    </button>
                                    <button 
                                        onClick={() => handleRequestSample(design.name)}
                                        style={{ flex: 1, background: 'var(--accent)', color: 'var(--midnight)', border: 'none', padding: '0.8rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '900', cursor: 'pointer', transition: '0.3s' }}
                                    >
                                        {t('aiLab.requestSampleShort') || 'NUMUNE İSTE'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default AIVisualizer;
