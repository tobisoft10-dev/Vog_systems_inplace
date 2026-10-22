import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

const News = () => {
  const { t, currentLang } = useLanguage();
  const [selectedArticle, setSelectedArticle] = useState(null);

  const mediaItems = [
    { 
      id: 1, 
      title: t('news.articles.yamaha'), 
      category: t('news.categories.event'), 
      img: 'https://www.vogtekstil.com.tr/wp-content/uploads/2017/04/slider7.jpg',
      content: {
        en: [
          "Since its establishment, VOG Tekstil has been manufacturing premium uniforms for Yamaha Motorsports teams and technical staff, designed to withstand harsh track conditions while offering windproofing and maximum mobility.",
          "Thanks to our boutique production quality and 100% in-house manufacturing lines, we combine wind-resistant, waterproof, and abrasion-resistant fabric technologies while remaining strictly faithful to Yamaha's corporate color codes.",
          "Every single jacket, vest, and fleece suit is specifically engineered to guarantee maximum comfort and protection on the racetracks. Our partnerships are built on absolute trust and continuous innovation in performance sportswear."
        ],
        tr: [
          "VOG Tekstil, kurulduğu günden bu yana Yamaha Motor spor ekiplerinin ve teknik kadrolarının zorlu saha koşullarına dayanıklı, rüzgar geçirmez ve yüksek hareket kabiliyeti sunan premium üniformalarını üretmektedir.",
          "Butik üretim kalitesi ve yüzde yüz yerli üretim hattımız sayesinde Yamaha'nın kurumsal renk kodlarına sadık kalarak, rüzgar, yağmur ve aşınmaya dayanıklı kumaş teknolojilerini bir araya getiriyoruz.",
          "Her bir giysi, mont, yelek ve polar takımlar, zorlu yarış pistlerinde maksimum konfor ve koruma sağlamak üzere özel olarak tasarlanmıştır. Ortaklıklarımız, performans spor giyiminde mutlak güven ve sürekli yenilik üzerine inşa edilmiştir."
        ]
      }
    },
    { 
      id: 2, 
      category: t('news.categories.production'), 
      title: t('news.articles.fabric'), 
      img: 'https://www.vogtekstil.com.tr/wp-content/uploads/2017/04/fabric.jpg',
      content: {
        en: [
          "Our next-generation technical fabric series, offered to our partners through our B2B portal, redefines high durability and breathability standards in the corporate wear sector.",
          "Engineered from a blend of 60% technical cotton and 40% polyester microfibre, these fabrics feature advanced high-wicking moisture management and SPF 50+ UV protection.",
          "Rigorously tested for industrial workwear and motorsport jackets, this series has achieved outstanding ratings in friction and durability tests, proving that comfort and safety can coexist perfectly."
        ],
        tr: [
          "B2B portalımız üzerinden müşterilerimize sunduğumuz yeni nesil teknik kumaş serimiz, kurumsal giyim sektöründe yüksek dayanıklılık ve nefes alabilirlik standartlarını yeniden tanımlıyor.",
          "%60 teknik pamuk ve %40 polyester mikrofiber karışımından üretilen kumaşlarımız, nem yönetimi (high-wicking) ve SPF 50+ güneş koruması özelliklerine sahiptir.",
          "Özellikle endüstriyel iş kıyafetleri ve motorsporları montları için laboratuvar ortamında test edilen bu seri, aşınma ve sürtünme testlerinden en yüksek notları alarak konfor ile güvenliğin bir arada olabileceğini kanıtlamıştır."
        ]
      }
    },
    { 
      id: 3, 
      title: t('news.articles.repsol'), 
      category: t('news.categories.event'), 
      img: 'https://www.vogtekstil.com.tr/wp-content/uploads/2017/04/gallery16.jpg',
      content: {
        en: [
          "Under our long-term collaboration with the Repsol Racing Team, we manufacture anti-static jumpsuits and technical vests that are highly resistant to extreme heat and oil stains for pit crews and engineers.",
          "Our premium manufacturing standards ensure that mechanics can perform high-speed pit stops with full flexibility and optimal body temperature regulation.",
          "With our RFID-tagged shipments passing through our smart logistics tunnels, we guarantee just-in-time and error-free delivery of team gear to Repsol hubs across international championship circuits."
        ],
        tr: [
          "Repsol Racing Team ile yürüttüğümüz uzun soluklu iş birliği çerçevesinde, pit ekiplerinin ve mühendislerin yüksek ısıya ve yağ lekelerine karşı dirençli antistatik tulum ve teknik yeleklerini üretiyoruz.",
          "Üstün üretim standartlarımız, mekanikerlerin yüksek hızlı pit stoplar sırasında tam esneklik ve ideal vücut ısısı dengesiyle performans göstermesini sağlar.",
          "Akıllı lojistik tünellerimizden saniyeler içinde geçen RFID etiketli sevkiyatlarımızla, uluslararası şampiyona pistlerindeki Repsol merkezlerine tam zamanında ve hatasız teslimat sağlıyoruz."
        ]
      }
    },
    { 
      id: 4, 
      title: t('news.articles.cad'), 
      category: t('news.categories.internal'), 
      img: 'https://www.vogtekstil.com.tr/wp-content/uploads/2017/04/styling.jpg',
      content: {
        en: [
          "By utilizing state-of-the-art CAD modeling systems in our Istanbul design studio, we reduce fabric waste to zero while implementing even the most complex pattern blueprints with millimeter precision.",
          "Our computerized layout optimization automatically places patterns to maximize efficiency and respect the fabric's grain line.",
          "Every digitally prototyped design accelerates the client approval process, enabling rapid virtual iterations and completely eliminating physical sampling error margins before mass production."
        ],
        tr: [
          "İstanbul tasarım stüdyomuzda kullandığımız son teknoloji CAD modelleme sistemleri sayesinde, kumaş israfını sıfıra indirirken en karmaşık kalıp tasarımlarını bile milimetrik hassasiyetle uyguluyoruz.",
          "Bilgisayarlı serim planlama optimizasyonumuz, kalıpları kumaş yönüne ve dokusuna sadık kalarak maksimum verimlilikle yerleştirir.",
          "Dijital olarak prototiplenen her tasarım, müşteri onay sürecini hızlandırmakta, hızlı sanal revizyonlara imkan tanımakta ve seri üretime geçişte hata payını tamamen ortadan kaldırmaktadır."
        ]
      }
    },
    { 
      id: 5, 
      category: t('news.categories.event'), 
      title: t('news.articles.fair'), 
      img: 'https://www.vogtekstil.com.tr/wp-content/uploads/2017/04/gallery2.jpg',
      content: {
        en: [
          "VOG Tekstil showcases its latest collections of waterproof jackets, softshell outerwear, and custom embroidered team apparel at the annual Global Motorsports Expo.",
          "Our premium manufacturing quality, chosen by global automotive and racing brands, continues to attract significant attention from international delegations and corporate purchasers.",
          "During the exhibition, we demonstrate our smart RFID logistics integration and eco-friendly manufacturing capabilities, establishing new partnerships across Europe and the Middle East."
        ],
        tr: [
          "VOG Tekstil, her yıl düzenlenen Küresel Motor Sporları Fuarı'nda en yeni su geçirmez mont, softshell ceket ve özel nakışlı takım kıyafetleri koleksiyonlarını sergilemektedir.",
          "Küresel otomotiv ve yarış markalarının tercih ettiği birinci sınıf üretim kalitemiz, fuar süresince uluslararası delegasyonlardan ve kurumsal satın almacılardan büyük ilgi görmeye devam ediyor.",
          "Fuar boyunca akıllı RFID lojistik entegrasyonumuzu ve çevre dostu üretim yeteneklerimizi sergileyerek, Avrupa ve Orta Doğu genelinde yeni stratejik ortaklıklar kuruyoruz."
        ]
      }
    },
    { 
      id: 6, 
      title: t('news.articles.embroidery'), 
      category: t('news.categories.craft'), 
      img: 'https://www.vogtekstil.com.tr/wp-content/uploads/2017/04/Embroidery.jpg',
      content: {
        en: [
          "With our high-precision multi-head embroidery machinery and expert artisan supervision, we stitch your corporate logos and team emblems onto garments with unmatched durability.",
          "We source premium threads that are highly resistant to high-temperature industrial washing, fading, and abrasion.",
          "Our embroidery techniques maintain absolute structural integrity and color vibrancy even after hundreds of intensive washing cycles, preserving your brand's premium identity."
        ],
        tr: [
          "Yüksek hassasiyetli çok kafalı nakış makinelerimiz ve uzman zanaatkarlarımızın gözetimiyle, kurumsal logolarınızı ve takım amblemlerinizi giysilere benzersiz bir dayanıklılıkla işliyoruz.",
          "Yüksek sıcaklıktaki endüstriyel yıkamaya, solmaya ve yıpranmaya karşı son derece dirençli birinci sınıf nakış iplikleri kullanıyoruz.",
          "Uyguladığımız gelişmiş nakış teknikleri, yüzlerce yoğun yıkama döngüsünden sonra bile yapısal bütünlüğünü ve renk canlılığını ilk günkü gibi koruyarak markanızın prestijli kimliğini yansıtır."
        ]
      }
    }
  ];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="news-page" style={{ paddingTop: '10rem', background: 'var(--midnight)', minHeight: '100vh' }}>
      <section className="container">
        <h1 className="animate-up revealed" style={{ 
          fontSize: 'clamp(3.5rem, 10vw, 6rem)', 
          marginBottom: '5rem',
          fontWeight: '900',
          letterSpacing: '-0.03em'
        }}>
          {t('news.title').split(' ')[0]} {t('news.title').split(' ')[1]} <span className="gradient-text">{t('news.title').split(' ')[2]}</span>
        </h1>
        
        <div className="grid-stack" style={{ gap: '3rem' }}>
          {mediaItems.map((item, idx) => (
            <div key={item.id} className={`glass animate-up delay-${(idx % 3) + 1} revealed`} style={{ 
              overflow: 'hidden', 
              borderRadius: '24px',
              transition: 'var(--transition)',
              transform: 'translateY(0)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.06)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}>
              <div style={{ height: '320px', overflow: 'hidden' }}>
                <img src={item.img} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 1s ease' }} />
              </div>
              <div style={{ padding: '2.5rem' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: '800', letterSpacing: '3px' }}>{item.category.toUpperCase()}</span>
                <h3 style={{ fontSize: '1.6rem', marginTop: '1.2rem', lineHeight: '1.2', fontWeight: '800' }}>{item.title}</h3>
                <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button 
                    onClick={() => setSelectedArticle(item)}
                    style={{ 
                      color: 'var(--text-primary)', 
                      fontWeight: '800', 
                      background: 'none',
                      border: 'none',
                      borderBottom: '2px solid var(--accent)', 
                      fontSize: '0.9rem',
                      paddingBottom: '4px',
                      cursor: 'pointer',
                      transition: 'var(--transition)',
                      padding: '0 0 4px 0',
                      fontFamily: 'inherit'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.color = 'var(--accent)'}
                    onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                  >
                    {t('news.readMore')}
                  </button>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)' }}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Premium Article Glassmorphism Modal */}
      {selectedArticle && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(10, 15, 30, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '2rem'
        }}
        onClick={() => setSelectedArticle(null)}
        >
          <div 
            className="prism-glass fade-in"
            style={{
              background: 'var(--glass)',
              border: '1px solid var(--glass-border)',
              boxShadow: 'var(--laminar-shadow)',
              borderRadius: '2.5rem',
              maxWidth: '850px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative',
              animation: 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedArticle(null)}
              style={{
                position: 'absolute',
                top: '1.5rem',
                right: '1.5rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10,
                fontSize: '1rem',
                transition: 'var(--transition)'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
            >
              ✕
            </button>

            {/* Header Image */}
            <div style={{ height: '360px', width: '100%', overflow: 'hidden', position: 'relative' }}>
              <img 
                src={selectedArticle.img} 
                alt={selectedArticle.title} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '100%',
                height: '60%',
                background: 'linear-gradient(to top, rgba(15, 23, 42, 0.95), transparent)'
              }}></div>
            </div>

            {/* Content Container */}
            <div style={{ padding: '3.5rem', marginTop: '-3rem', position: 'relative', zIndex: 2 }}>
              <span style={{ 
                fontSize: '0.75rem', 
                color: 'var(--accent)', 
                fontWeight: '900', 
                letterSpacing: '4px',
                textTransform: 'uppercase',
                background: 'rgba(212, 175, 55, 0.1)',
                padding: '0.5rem 1.2rem',
                borderRadius: '100px'
              }}>
                {selectedArticle.category}
              </span>
              
              <h2 style={{ 
                fontSize: 'clamp(2rem, 4vw, 2.6rem)', 
                fontWeight: '950', 
                color: 'var(--text-primary)', 
                marginTop: '1.5rem',
                marginBottom: '2rem',
                lineHeight: '1.1',
                letterSpacing: '-1.5px'
              }}>
                {selectedArticle.title}
              </h2>

              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '1.5rem', 
                color: 'var(--text-secondary)', 
                fontSize: '1.05rem', 
                lineHeight: '1.8',
                fontWeight: '500'
              }}>
                {(selectedArticle.content[currentLang] || selectedArticle.content.en).map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>

              {/* Decorative Brand Accent Divider */}
              <div style={{ 
                marginTop: '3.5rem', 
                paddingTop: '2.5rem', 
                borderTop: '1px solid var(--glass-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', letterSpacing: '1px', color: 'var(--text-secondary)' }}>
                  VOG TEKSTİL NEWS & MEDIA
                </span>
                <span style={{ color: 'var(--accent)', fontWeight: '900' }}>✦ 2026</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default News;

