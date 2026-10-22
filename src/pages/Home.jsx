import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MobileMenu from '../components/MobileMenu';

const Home = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showShowroomModal, setShowShowroomModal] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleShowroomLogin = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setLoginError('Lütfen e-posta ve şifrenizi giriniz.');
      return;
    }
    // Navigate to login / customer catalog
    navigate(`/login?email=${encodeURIComponent(email)}`);
  };

  const productCategories = [
    {
      id: 'polo',
      title: 'Polo Tişörtler',
      material: '%100 Pamuk + %20 Likra',
      img: '/vog_images/cat_polos.jpg',
      link: '/products?cat=polo'
    },
    {
      id: 'tshirt',
      title: 'Tişörtler',
      material: '%100 Pamuk',
      img: '/vog_images/cat_tshirts.jpg',
      link: '/products?cat=tshirt'
    },
    {
      id: 'jacket',
      title: 'Ceketler',
      material: '%100 Pamuk + Polar',
      img: '/vog_images/cat_jackets.jpg',
      link: '/products?cat=jacket'
    },
    {
      id: 'vest',
      title: 'Yelekler',
      material: '%100 Pamuk + %20 Likra',
      img: '/vog_images/cat_wests.jpg',
      link: '/products?cat=vest'
    },
    {
      id: 'ladies_shirt',
      title: 'Gömlekler',
      material: '%100 Pamuk',
      img: '/vog_images/cat_ladies.jpg',
      link: '/products?cat=shirt'
    },
    {
      id: 'sweatshirt',
      title: 'Sweatshirtler',
      material: '%100 Pamuk + Polar',
      img: '/vog_images/cat_sweatshirts.jpg',
      link: '/products?cat=sweatshirt'
    },
    {
      id: 'mens_shirt',
      title: 'Gömlekler',
      material: '%100 Pamuk + %20 Likra',
      img: '/vog_images/cat_shirts.jpg',
      link: '/products?cat=shirt'
    },
    {
      id: 'fleece',
      title: 'Polarlar',
      material: '%100 Pamuk',
      img: '/vog_images/cat_fleeces.jpg',
      link: '/products?cat=fleece'
    },
    {
      id: 'workwear',
      title: 'Kurumsal Kıyafetler',
      material: '%100 Pamuk + Polar',
      img: '/vog_images/cat_workwears.jpg',
      link: '/products?cat=workwear'
    }
  ];

  const newsCards = [
    {
      id: 1,
      date: '12 OCAK 2026',
      title: 'Kapasite Artışımız Devam Ediyor',
      summary: 'Sektörde 30 yıllık tecrübe ile global standartlarda üretim kapasitemizi genişletiyoruz.',
      img: '/vog_images/news_card_1.jpg',
      link: '/news'
    },
    {
      id: 2,
      date: '18 ŞUBAT 2026',
      title: 'Yüksek Teknoloji ile Üretim',
      summary: 'Modern dokuma ve baskı tesislerimizde sürdürülebilir kumaş inovasyonunu sürdürüyoruz.',
      img: '/vog_images/news_card_2.jpg',
      link: '/news'
    },
    {
      id: 3,
      date: '04 MART 2026',
      title: 'Volkswagen Kurumsal Çözüm',
      summary: 'Doğuş Otomotiv ile ortak yürüttüğümüz kurumsal kıyafet projelerimizde mükemmeliyet.',
      img: '/vog_images/news_card_3.jpg',
      link: '/news'
    },
    {
      id: 4,
      date: '15 NİSAN 2026',
      title: 'Doğuş Otomotiv İş Birliği',
      summary: 'Teknik servis ve bayi personeline özel fonksiyonel ve dayanıklı kumaş çözümleri.',
      img: '/vog_images/news_card_4.jpg',
      link: '/news'
    }
  ];

  return (
    <div className="vog-home-wrapper" style={{ background: '#FAF7F2', minHeight: '100vh', fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif", color: '#1F2937' }}>
      
      {/* ============================================================== */}
      {/* 1. HERO SECTION (With Macro Sewing Machine & Diorama Figures) */}
      {/* ============================================================== */}
      <section 
        className="vog-hero-section"
        style={{
          position: 'relative',
          minHeight: '85vh',
          backgroundImage: "linear-gradient(to right, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.3) 45%, rgba(0,0,0,0.05) 100%), url('/vog_images/vog_hero_diorama.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center 40%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '2.5rem 3rem 0 3rem'
        }}
      >
        {/* Top Header Bar inside Hero */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '1440px', margin: '0 auto', zIndex: 10 }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '2.6rem', fontWeight: '950', color: '#ffffff', letterSpacing: '-1px', lineHeight: '1' }}>VOG</span>
            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.85)', letterSpacing: '1.5px', marginTop: '4px', fontWeight: '600' }}>Vog Tekstil • Est. 1996</span>
          </Link>

          {/* Circular Hamburger Button */}
          <button
            onClick={() => setIsMenuOpen(true)}
            aria-label="Menü"
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1.5px solid rgba(255,255,255,0.7)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              padding: 0
            }}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; e.currentTarget.style.transform = 'scale(1.06)'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <span style={{ width: '18px', height: '2px', background: '#ffffff', borderRadius: '2px' }}></span>
            <span style={{ width: '18px', height: '2px', background: '#ffffff', borderRadius: '2px' }}></span>
            <span style={{ width: '18px', height: '2px', background: '#ffffff', borderRadius: '2px' }}></span>
          </button>
        </div>

        {/* Hero Middle Content */}
        <div style={{ maxWidth: '1440px', width: '100%', margin: '4rem auto 5rem auto', zIndex: 5 }}>
          <div style={{ maxWidth: '600px' }}>
            <h1 style={{
              fontSize: 'clamp(2.8rem, 5.5vw, 4.4rem)',
              fontWeight: '900',
              color: '#ffffff',
              lineHeight: '1.1',
              letterSpacing: '-1.5px',
              marginBottom: '1.2rem',
              textShadow: '0 4px 20px rgba(0,0,0,0.4)'
            }}>
              Moda bizim için<br />bir yaşam.
            </h1>
            <p style={{
              color: 'rgba(255,255,255,0.92)',
              fontSize: '1.05rem',
              lineHeight: '1.55',
              fontWeight: '400',
              marginBottom: '2.4rem',
              textShadow: '0 2px 10px rgba(0,0,0,0.3)'
            }}>
              Özel üretim hazır giyim ve kurumsal giyimin öncüsü.<br />
              <strong style={{ fontWeight: '700', letterSpacing: '1px' }}>VOG TEKSTİL • EST. 1996</strong>
            </p>

            <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <Link 
                to="/products"
                style={{
                  background: '#ffffff',
                  color: '#111827',
                  padding: '0.9rem 2.2rem',
                  borderRadius: '9999px',
                  textDecoration: 'none',
                  fontWeight: '700',
                  fontSize: '0.95rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 15px 30px rgba(0,0,0,0.35)'; }}
                onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.25)'; }}
              >
                Ürünleri İncele <span style={{ fontSize: '1.2rem', lineHeight: '1' }}>→</span>
              </Link>

              <Link 
                to="/contact"
                style={{
                  background: 'rgba(255,255,255,0.22)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.45)',
                  color: '#ffffff',
                  padding: '0.9rem 2.2rem',
                  borderRadius: '9999px',
                  textDecoration: 'none',
                  fontWeight: '600',
                  fontSize: '0.95rem',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.35)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.22)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                İletişim
              </Link>
            </div>
          </div>
        </div>

        {/* Serrated Fabric Zigzag Divider (Pinking Shears Cut Border) */}
        <div style={{ width: 'calc(100% + 6rem)', margin: '0 -3rem', overflow: 'hidden', lineHeight: 0, position: 'relative', bottom: '-1px' }}>
          <svg viewBox="0 0 1200 24" preserveAspectRatio="none" style={{ width: '100%', height: '22px', display: 'block' }}>
            <path 
              d="M0,0 L0,12 L15,24 L30,12 L45,24 L60,12 L75,24 L90,12 L105,24 L120,12 L135,24 L150,12 L165,24 L180,12 L195,24 L210,12 L225,24 L240,12 L255,24 L270,12 L285,24 L300,12 L315,24 L330,12 L345,24 L360,12 L375,24 L390,12 L405,24 L420,12 L435,24 L450,12 L465,24 L480,12 L495,24 L510,12 L525,24 L540,12 L555,24 L570,12 L585,24 L600,12 L615,24 L630,12 L645,24 L660,12 L675,24 L690,12 L705,24 L720,12 L735,24 L750,12 L765,24 L780,12 L795,24 L810,12 L825,24 L840,12 L855,24 L870,12 L885,24 L900,12 L915,24 L930,12 L945,24 L960,12 L975,24 L990,12 L1005,24 L1020,12 L1035,24 L1050,12 L1065,24 L1080,12 L1095,24 L1110,12 L1125,24 L1140,12 L1155,24 L1170,12 L1185,24 L1200,12 L1200,0 Z" 
              fill="#FAF7F2" 
            />
          </svg>
        </div>
      </section>


      {/* ============================================================== */}
      {/* 2. PRODUCTS SECTION ("Ürünlerimiz" + 3x3 Cards + Showroom Modal) */}
      {/* ============================================================== */}
      <section style={{ padding: '4.5rem 3rem 5rem 3rem', maxWidth: '1440px', margin: '0 auto', position: 'relative' }}>
        
        {/* Section Header */}
        <div style={{ marginBottom: '3rem' }}>
          <div style={{
            color: '#8B263E',
            fontSize: '0.75rem',
            fontWeight: '900',
            letterSpacing: '2.5px',
            textTransform: 'uppercase',
            marginBottom: '0.5rem'
          }}>
            KOLEKSİYON
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '1.2rem', flexWrap: 'wrap', marginBottom: '1.2rem' }}>
            <h2 style={{ fontSize: '2.4rem', fontWeight: '950', color: '#111827', margin: 0, letterSpacing: '-1px' }}>
              Ürünlerimiz
            </h2>
            <span style={{ color: '#6B7280', fontSize: '0.98rem', fontWeight: '500' }}>
              Vog Tekstil, modern ve zamansız hazır giyim koleksiyonu ile modaya yön veriyor.
            </span>
          </div>

          <p style={{
            maxWidth: '1000px',
            color: '#4B5563',
            fontSize: '0.92rem',
            lineHeight: '1.7',
            margin: 0
          }}>
            Kalite, konfor ve modern şıklığı bir araya getiren zengin ürün koleksiyonumuzu keşfedin. Günlükten stilist tasarımlara uzanan geniş yelpazemizde, yüksek kaliteli kumaş seçenekleri, üstün işçilik ve yenilikçi çizgiler anlayışımızın temelini oluşturuyor. En son trendleri yansıtan modellerden zamansız klasiklere kadar her üründe yüksek dayanıklılık ve estetiği hedefleyerek, kurumsal veya kişisel tarzınızı kusursuz bir şekilde hayata geçirmeniz için tasarlandı.
          </p>
        </div>

        {/* Product Grid Area with Relative Positioning for Center Modal */}
        <div style={{ position: 'relative' }}>
          
          {/* 3x3 Product Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '2rem'
          }}>
            {productCategories.map((cat, idx) => (
              <div 
                key={cat.id}
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: '1px solid rgba(0,0,0,0.06)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                  transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.boxShadow = '0 16px 35px rgba(0,0,0,0.08)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.03)';
                }}
              >
                {/* Photo Container */}
                <div style={{ width: '100%', height: '340px', overflow: 'hidden', background: '#e5e7eb', position: 'relative' }}>
                  <img 
                    src={cat.img} 
                    alt={cat.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      transition: 'transform 0.5s ease'
                    }}
                    onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                  />
                </div>

                {/* Card Content */}
                <div style={{ padding: '1.5rem 1.6rem 1.6rem 1.6rem', display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#111827', margin: '0 0 0.4rem 0' }}>
                      {cat.title}
                    </h3>
                    <div style={{ fontSize: '0.85rem', color: '#6B7280', fontWeight: '500', marginBottom: '1.2rem' }}>
                      {cat.material}
                    </div>
                  </div>

                  <Link 
                    to={cat.link}
                    style={{
                      color: '#8B263E',
                      textDecoration: 'none',
                      fontSize: '0.88rem',
                      fontWeight: '800',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      transition: 'gap 0.2s ease'
                    }}
                    onMouseOver={e => e.currentTarget.style.gap = '0.7rem'}
                    onMouseOut={e => e.currentTarget.style.gap = '0.4rem'}
                  >
                    Ürünleri İncele <span>→</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Miniature Tailor Inspector Figurine (Bottom Right near card 9) */}
          <div style={{
            position: 'absolute',
            bottom: '-25px',
            right: '10px',
            zIndex: 8,
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <img 
              src="/vog_images/miniature_inspector.jpg"
              alt="Quality Inspector"
              style={{
                height: '170px',
                width: 'auto',
                mixBlendMode: 'multiply',
                filter: 'contrast(1.05) drop-shadow(0 15px 15px rgba(0,0,0,0.15))'
              }}
            />
          </div>

          {/* FLOATING "Showroom Girişi" MODAL CARD IN CENTER */}
          {showShowroomModal && (
            <div 
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 30,
                width: '92%',
                maxWidth: '430px',
                background: 'rgba(255, 255, 255, 0.96)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: '20px',
                padding: '2.5rem 2.2rem',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.8)',
                textAlign: 'center',
                animation: 'modalPop 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              {/* Close Button */}
              <button 
                onClick={() => setShowShowroomModal(false)}
                title="Kapat"
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: 'none',
                  background: 'rgba(0,0,0,0.06)',
                  color: '#4B5563',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s ease'
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.12)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(0,0,0,0.06)'}
              >
                ✕
              </button>

              <div style={{
                color: '#8B263E',
                fontSize: '0.72rem',
                fontWeight: '900',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                marginBottom: '0.4rem'
              }}>
                MÜŞTERİ
              </div>

              <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#111827', margin: '0 0 0.6rem 0' }}>
                Showroom Girişi
              </h3>

              <p style={{ fontSize: '0.85rem', color: '#6B7280', lineHeight: '1.5', margin: '0 0 1.8rem 0' }}>
                Size özel hazırlanan koleksiyon ürünlerimizi incelemek için kullanıcı girişi yapınız.
              </p>

              {loginError && (
                <div style={{ background: '#FEE2E2', color: '#B91C1C', padding: '0.6rem', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '1rem', fontWeight: '600' }}>
                  {loginError}
                </div>
              )}

              <form onSubmit={handleShowroomLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#374151', marginBottom: '0.3rem' }}>
                    E-Posta:
                  </label>
                  <input 
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="ornek@sirket.com.tr"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '9999px',
                      border: '1px solid #D1D5DB',
                      background: '#F9FAFB',
                      fontSize: '0.9rem',
                      outline: 'none',
                      color: '#111827',
                      boxSizing: 'border-box'
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = '#8B263E'}
                    onBlur={e => e.currentTarget.style.borderColor = '#D1D5DB'}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#374151', marginBottom: '0.3rem' }}>
                    Şifre:
                  </label>
                  <input 
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '9999px',
                      border: '1px solid #D1D5DB',
                      background: '#F9FAFB',
                      fontSize: '0.9rem',
                      outline: 'none',
                      color: '#111827',
                      boxSizing: 'border-box'
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = '#8B263E'}
                    onBlur={e => e.currentTarget.style.borderColor = '#D1D5DB'}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    background: '#7A2838',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.85rem 1.5rem',
                    borderRadius: '9999px',
                    fontSize: '0.92rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                    marginTop: '0.5rem',
                    transition: 'all 0.25s ease',
                    boxShadow: '0 6px 16px rgba(122, 40, 56, 0.25)'
                  }}
                  onMouseOver={e => { e.currentTarget.style.background = '#8F2F43'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseOut={e => { e.currentTarget.style.background = '#7A2838'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  GİRİŞ YAP
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/contact')}
                  style={{
                    background: 'transparent',
                    color: '#4B5563',
                    border: '1px solid #D1D5DB',
                    padding: '0.7rem 1.5rem',
                    borderRadius: '9999px',
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease'
                  }}
                  onMouseOver={e => { e.currentTarget.style.background = '#F3F4F6'; e.currentTarget.style.color = '#111827'; }}
                  onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#4B5563'; }}
                >
                  Kayıt Ol
                </button>
              </form>

              <div style={{ marginTop: '1.2rem', fontSize: '0.72rem', color: '#9CA3AF' }}>
                Kullanıcı adı ve şifreniz yoksa bizimle iletişime geçin.
              </div>
            </div>
          )}

          {/* Re-open badge if modal was closed */}
          {!showShowroomModal && (
            <button
              onClick={() => setShowShowroomModal(true)}
              style={{
                position: 'fixed',
                bottom: '2rem',
                right: '2rem',
                zIndex: 90,
                background: '#7A2838',
                color: '#ffffff',
                border: 'none',
                padding: '0.9rem 1.8rem',
                borderRadius: '9999px',
                fontWeight: '800',
                fontSize: '0.88rem',
                boxShadow: '0 10px 30px rgba(122, 40, 56, 0.35)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-3px)'}
              onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              🔒 Showroom Girişi
            </button>
          )}

        </div>
      </section>


      {/* ============================================================== */}
      {/* 3. NEWS & EXPERIENCE SECTION ("Dersimizi Çalıştık" + 4 Cards)   */}
      {/* ============================================================== */}
      <section style={{ padding: '3rem 3rem 6rem 3rem', maxWidth: '1440px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{
            color: '#8B263E',
            fontSize: '0.75rem',
            fontWeight: '900',
            letterSpacing: '2.5px',
            textTransform: 'uppercase',
            marginBottom: '0.4rem'
          }}>
            HABERLER & DUYURULAR
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '1.2rem', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: '950', color: '#111827', margin: 0, letterSpacing: '-1px' }}>
              Dersimizi Çalıştık
            </h2>
            <span style={{ color: '#6B7280', fontSize: '0.95rem', fontWeight: '500' }}>
              İş ortaklarımızın kurumsal kimliğini yansıtan özel üretim çözümleri ve başarı hikayelerimiz.
            </span>
          </div>
        </div>

        {/* 4 Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.8rem'
        }}>
          {newsCards.map(news => (
            <div
              key={news.id}
              style={{
                background: '#ffffff',
                borderRadius: '14px',
                overflow: 'hidden',
                border: '1px solid rgba(0,0,0,0.06)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={e => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 12px 25px rgba(0,0,0,0.08)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.03)';
              }}
            >
              {/* Photo */}
              <div style={{ width: '100%', height: '190px', overflow: 'hidden', background: '#e5e7eb' }}>
                <img 
                  src={news.img} 
                  alt={news.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                />
              </div>

              {/* Text */}
              <div style={{ padding: '1.4rem', display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#9CA3AF', fontWeight: '700', letterSpacing: '1px', marginBottom: '0.4rem' }}>
                    {news.date}
                  </div>
                  <h4 style={{ fontSize: '1rem', fontWeight: '800', color: '#111827', margin: '0 0 0.5rem 0', lineHeight: '1.3' }}>
                    {news.title}
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: '#6B7280', lineHeight: '1.55', margin: '0 0 1rem 0' }}>
                    {news.summary}
                  </p>
                </div>

                <Link
                  to={news.link}
                  style={{
                    color: '#8B263E',
                    textDecoration: 'none',
                    fontSize: '0.82rem',
                    fontWeight: '800',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  Devamını Oku <span>→</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* ============================================================== */}
      {/* 4. FOOTER (Rich Burgundy #7A2838 + Social Icons + Legal Bar)  */}
      {/* ============================================================== */}
      <footer style={{ background: '#7A2838', color: '#ffffff', padding: '4.5rem 3rem 2rem 3rem' }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '3.5rem',
            paddingBottom: '3.5rem',
            borderBottom: '1px solid rgba(255,255,255,0.15)'
          }}>
            {/* Left Column: Socials & Copyright */}
            <div>
              <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '2rem' }}>
                {/* Facebook */}
                <a href="https://facebook.com" target="_blank" rel="noreferrer" style={{
                  width: '38px', height: '38px', borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', textDecoration: 'none',
                  fontSize: '0.9rem', fontWeight: 'bold', transition: 'all 0.25s ease'
                }}
                onMouseOver={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#7A2838'; }}
                onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ffffff'; }}
                >
                  f
                </a>
                {/* Instagram */}
                <a href="https://instagram.com" target="_blank" rel="noreferrer" style={{
                  width: '38px', height: '38px', borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', textDecoration: 'none',
                  fontSize: '0.85rem', fontWeight: 'bold', transition: 'all 0.25s ease'
                }}
                onMouseOver={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#7A2838'; }}
                onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ffffff'; }}
                >
                  ig
                </a>
                {/* Twitter / X */}
                <a href="https://twitter.com" target="_blank" rel="noreferrer" style={{
                  width: '38px', height: '38px', borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', textDecoration: 'none',
                  fontSize: '0.85rem', fontWeight: 'bold', transition: 'all 0.25s ease'
                }}
                onMouseOver={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#7A2838'; }}
                onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ffffff'; }}
                >
                  x
                </a>
                {/* YouTube */}
                <a href="https://youtube.com" target="_blank" rel="noreferrer" style={{
                  width: '38px', height: '38px', borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', textDecoration: 'none',
                  fontSize: '0.85rem', fontWeight: 'bold', transition: 'all 0.25s ease'
                }}
                onMouseOver={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#7A2838'; }}
                onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ffffff'; }}
                >
                  yt
                </a>
                {/* Globe / Web */}
                <a href="https://vogtekstil.com.tr" target="_blank" rel="noreferrer" style={{
                  width: '38px', height: '38px', borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', textDecoration: 'none',
                  fontSize: '0.85rem', fontWeight: 'bold', transition: 'all 0.25s ease'
                }}
                onMouseOver={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#7A2838'; }}
                onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ffffff'; }}
                >
                  🌐
                </a>
              </div>

              <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)', lineHeight: '1.6' }}>
                Copyright © 2026 VOG Tekstil.<br />
                Tüm hakları saklıdır.
              </div>
            </div>

            {/* Column 2: Kurumsal */}
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: '800', color: '#ffffff', marginBottom: '1.4rem' }}>
                Kurumsal
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                <Link to="/about" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '0.88rem', transition: 'color 0.2s ease' }} onMouseOver={e => e.currentTarget.style.color = '#fff'} onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}>Hakkımızda</Link>
                <Link to="/about" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '0.88rem', transition: 'color 0.2s ease' }} onMouseOver={e => e.currentTarget.style.color = '#fff'} onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}>Yönetim Kurulu</Link>
                <Link to="/about" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '0.88rem', transition: 'color 0.2s ease' }} onMouseOver={e => e.currentTarget.style.color = '#fff'} onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}>Vizyon & Misyon</Link>
                <Link to="/about" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '0.88rem', transition: 'color 0.2s ease' }} onMouseOver={e => e.currentTarget.style.color = '#fff'} onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}>İnsan Kaynakları</Link>
                <Link to="/sustainability" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '0.88rem', transition: 'color 0.2s ease' }} onMouseOver={e => e.currentTarget.style.color = '#fff'} onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}>Kalite & Sürdürülebilirlik</Link>
              </div>
            </div>

            {/* Column 3: İletişim */}
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: '800', color: '#ffffff', marginBottom: '1.4rem' }}>
                İletişim
              </h4>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.88rem', lineHeight: '1.7', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div>İkitelli OSB Mah. Enkoop Cad. No:12</div>
                <div>34490 Başakşehir / İstanbul</div>
                <div style={{ marginTop: '0.4rem' }}><strong>Tel:</strong> (0212) 485 54 54</div>
                <div><strong>E-Posta:</strong> info@vogtekstil.com</div>
              </div>
            </div>

            {/* Column 4: Ürünler */}
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: '800', color: '#ffffff', marginBottom: '1.4rem' }}>
                Ürünler
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                <Link to="/products" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '0.88rem' }}>İş Kıyafetleri</Link>
                <Link to="/products" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '0.88rem' }}>Özel Üretim</Link>
                <Link to="/products" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '0.88rem' }}>Promosyon Tekstili</Link>
                <Link to="/products" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '0.88rem' }}>Kurumsal Kimlik</Link>
              </div>
            </div>
          </div>

          {/* Bottom Legal Links Bar */}
          <div style={{
            paddingTop: '2rem',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '1.5rem',
            flexWrap: 'wrap',
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.65)',
            letterSpacing: '1px'
          }}>
            <Link to="/faq" style={{ color: 'inherit', textDecoration: 'none' }}>KİŞİSEL VERİLERİN KORUNMASI</Link>
            <span>|</span>
            <Link to="/faq" style={{ color: 'inherit', textDecoration: 'none' }}>ÇEREZ POLİTİKASI</Link>
            <span>|</span>
            <Link to="/faq" style={{ color: 'inherit', textDecoration: 'none' }}>KULLANIM KOŞULLARI</Link>
          </div>

        </div>
      </footer>

      {/* Global Mobile Menu Drawer */}
      <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

    </div>
  );
};

export default Home;
