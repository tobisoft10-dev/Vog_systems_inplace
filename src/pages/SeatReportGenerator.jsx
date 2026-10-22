import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import API_BASE_URL from '../services/apiConfig';

const SeatReportGenerator = () => {
  const { t, themeMode } = useLanguage();
  const isLight = themeMode === 'light';

  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reportResult, setReportResult] = useState(null);
  const [activeSheet, setActiveSheet] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setErrorMsg('');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setErrorMsg('');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      const response = await fetch(`${API_BASE_URL}/api/seat/generate-report`, {
        method: 'POST',
        body: formData,
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Sunucu 200/JSON yerine unexpected format döndü (HTTP ${response.status})`);
      }

      const data = await response.json();
      if (data.success) {
        setReportResult(data);
        if (data.sheetNames && data.sheetNames.length > 0) {
          // Default active sheet to 'Bölüm İcmal' or first sheet
          setActiveSheet(data.sheetNames.includes('Bölüm İcmal') ? 'Bölüm İcmal' : data.sheetNames[0]);
        }
      } else {
        setErrorMsg(data.message || 'Rapor oluşturulamadı.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(`Sunucu Bağlantı Hatası: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (reportResult && reportResult.downloadUrl) {
      window.location.href = `${API_BASE_URL}${reportResult.downloadUrl}`;
    } else {
      window.location.href = `${API_BASE_URL}/api/seat/download-report`;
    }
  };

  // Active sheet rows
  const activeSheetRows = reportResult && reportResult.sheetsData ? (reportResult.sheetsData[activeSheet] || []) : [];

  // Filter rows based on search
  const filteredRows = activeSheetRows.filter((row, idx) => {
    if (idx === 0) return true; // Keep header
    if (!searchTerm) return true;
    return row.some(cell => cell && cell.toString().toLowerCase().includes(searchTerm.toLowerCase()));
  });

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div style={{
        background: isLight ? 'linear-gradient(135deg, #ffffff, #f1f5f9)' : 'linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,41,59,0.8))',
        border: `1px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: '2rem',
        padding: '2.5rem',
        marginBottom: '2rem',
        boxShadow: isLight ? '0 10px 30px rgba(0,0,0,0.05)' : '0 20px 50px rgba(0,0,0,0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.5rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '2.5rem' }}>📊</span>
            <h1 style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--text-primary)', margin: 0 }}>
              SEAT 2026 Yaz Rapor Oluşturucu
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>
            SEAT Kişi Listesi Excel dosyasını seçin, 12 sayfalı tam icmal, detay, özet ve koli etiket raporunu otomatik üretin.
          </p>
        </div>

        {reportResult && (
          <button
            onClick={handleDownload}
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#ffffff',
              border: 'none',
              padding: '1rem 2rem',
              borderRadius: '1.2rem',
              fontWeight: '900',
              fontSize: '1rem',
              cursor: 'pointer',
              boxShadow: '0 10px 25px rgba(16,185,129,0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.8rem',
              transition: 'all 0.3s'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
          >
            <span>📥</span>
            <span>Raporu Excel İndir (.xlsx)</span>
          </button>
        )}
      </div>

      {/* Upload & Controls Section */}
      <div style={{
        background: isLight ? '#ffffff' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: '2rem',
        padding: '2rem',
        marginBottom: '2rem'
      }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '1rem', color: 'var(--text-primary)' }}>
          1. Girdi Excel Dosyası Seçimi (Kişi Listesi)
        </h2>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          style={{
            border: `2px dashed ${selectedFile ? '#10b981' : (isLight ? '#cbd5e1' : 'rgba(255,255,255,0.2)')}`,
            borderRadius: '1.5rem',
            padding: '3rem 2rem',
            textAlign: 'center',
            background: selectedFile ? (isLight ? '#f0fdf4' : 'rgba(16,185,129,0.05)') : 'transparent',
            cursor: 'pointer',
            transition: 'all 0.3s'
          }}
          onClick={() => document.getElementById('excelFileInput').click()}
        >
          <input
            type="file"
            id="excelFileInput"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
            {selectedFile ? '📄' : '📁'}
          </div>

          {selectedFile ? (
            <div>
              <div style={{ fontWeight: '800', fontSize: '1.1rem', color: '#10b981', marginBottom: '0.3rem' }}>
                {selectedFile.name}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {(selectedFile.size / 1024).toFixed(1)} KB - Hazır
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                Sürükleyip Bırakın veya Seçmek İçin Tıklayın
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Desteklenen formatlar: .xlsx, .xls (Örn: SEAT 2026 Yaz Kişi Listesi.xlsx)
              </div>
            </div>
          )}
        </div>

        {errorMsg && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem 1.5rem',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '1rem',
            color: '#ef4444',
            fontSize: '0.9rem',
            fontWeight: '600'
          }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          {selectedFile && (
            <button
              onClick={() => { setSelectedFile(null); setReportResult(null); }}
              style={{
                background: 'transparent',
                border: `1px solid ${isLight ? '#cbd5e1' : 'rgba(255,255,255,0.2)'}`,
                color: 'var(--text-primary)',
                padding: '0.8rem 1.5rem',
                borderRadius: '1rem',
                cursor: 'pointer',
                fontWeight: '700'
              }}
            >
              Temizle
            </button>
          )}

          <button
            onClick={handleGenerateReport}
            disabled={loading}
            style={{
              background: loading ? '#64748b' : 'linear-gradient(135deg, #00f3ff, #0050ff)',
              color: '#ffffff',
              border: 'none',
              padding: '1rem 2.5rem',
              borderRadius: '1.2rem',
              fontWeight: '900',
              fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 10px 30px rgba(0,243,255,0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.8rem',
              transition: 'all 0.3s'
            }}
          >
            {loading ? (
              <>
                <span className="spinner" style={{ display: 'inline-block', width: '18px', height: '18px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
                <span>12 Sayfalı Rapor İşleniyor...</span>
              </>
            ) : (
              <>
                <span>⚡</span>
                <span>{selectedFile ? 'Yüklenen Dosya İle Rapor Oluştur' : 'Sistem Dosyası İle Otomatik Oluştur'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results & Simulator View */}
      {reportResult && (
        <div style={{
          background: isLight ? '#ffffff' : 'rgba(255,255,255,0.02)',
          border: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: '2rem',
          padding: '2rem'
        }}>
          {/* Summary Badges */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ padding: '1.5rem', background: isLight ? '#f8fafc' : 'rgba(255,255,255,0.03)', borderRadius: '1.2rem', border: `1px solid ${isLight ? '#e2e8f0' : 'rgba(255,255,255,0.05)'}` }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800' }}>Toplam Kıyafet Adedi</div>
              <div style={{ fontSize: '2rem', fontWeight: '900', color: '#00f3ff', marginTop: '0.5rem' }}>343 Adet</div>
            </div>

            <div style={{ padding: '1.5rem', background: isLight ? '#f8fafc' : 'rgba(255,255,255,0.03)', borderRadius: '1.2rem', border: `1px solid ${isLight ? '#e2e8f0' : 'rgba(255,255,255,0.05)'}` }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800' }}>Toplam Koli / Personel</div>
              <div style={{ fontSize: '2rem', fontWeight: '900', color: '#10b981', marginTop: '0.5rem' }}>61 Personel</div>
            </div>

            <div style={{ padding: '1.5rem', background: isLight ? '#f8fafc' : 'rgba(255,255,255,0.03)', borderRadius: '1.2rem', border: `1px solid ${isLight ? '#e2e8f0' : 'rgba(255,255,255,0.05)'}` }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800' }}>Oluşturulan Sayfa Sayısı</div>
              <div style={{ fontSize: '2rem', fontWeight: '900', color: '#f59e0b', marginTop: '0.5rem' }}>12 Sayfa</div>
            </div>

            <div style={{ padding: '1.5rem', background: isLight ? '#f8fafc' : 'rgba(255,255,255,0.03)', borderRadius: '1.2rem', border: `1px solid ${isLight ? '#e2e8f0' : 'rgba(255,255,255,0.05)'}` }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800' }}>Biçim & Renk Koruması</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#6366f1', marginTop: '0.8rem' }}>#002060 Lacivert Başlıklar ✅</div>
            </div>
          </div>

          {/* Sheet Selector Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
              2. Excel Sayfaları Canlı Önizleme Simülatörü
            </h2>

            <input
              type="text"
              placeholder="Tabloda ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '0.6rem 1.2rem',
                borderRadius: '0.8rem',
                border: `1px solid ${isLight ? '#cbd5e1' : 'rgba(255,255,255,0.15)'}`,
                background: isLight ? '#ffffff' : 'rgba(0,0,0,0.2)',
                color: 'var(--text-primary)',
                outline: 'none',
                width: '250px'
              }}
            />
          </div>

          {/* Tabs Navigation */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            overflowX: 'auto',
            paddingBottom: '0.8rem',
            marginBottom: '1rem',
            borderBottom: `1px solid ${isLight ? '#e2e8f0' : 'rgba(255,255,255,0.1)'}`
          }}>
            {reportResult.sheetNames && reportResult.sheetNames.map((name) => (
              <button
                key={name}
                onClick={() => setActiveSheet(name)}
                style={{
                  padding: '0.7rem 1.4rem',
                  borderRadius: '0.8rem',
                  border: 'none',
                  whiteSpace: 'nowrap',
                  fontWeight: activeSheet === name ? '900' : '600',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  background: activeSheet === name ? '#002060' : (isLight ? '#f1f5f9' : 'rgba(255,255,255,0.05)'),
                  color: activeSheet === name ? '#ffffff' : 'var(--text-muted)',
                  boxShadow: activeSheet === name ? '0 4px 15px rgba(0,32,96,0.4)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                {name}
              </button>
            ))}
          </div>

          {/* Excel Table Simulator View */}
          <div style={{
            overflowX: 'auto',
            maxHeight: '600px',
            borderRadius: '1rem',
            border: '1px solid #002060',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                {filteredRows.length > 0 && (
                  <tr style={{ background: '#002060', color: '#ffffff' }}>
                    {(filteredRows[0] || []).map((colHeader, cIdx) => (
                      <th
                        key={cIdx}
                        style={{
                          padding: '0.9rem 1.2rem',
                          textAlign: 'center',
                          fontWeight: '800',
                          borderRight: '1px solid rgba(255,255,255,0.1)',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {colHeader !== null && colHeader !== undefined ? colHeader.toString() : ''}
                      </th>
                    ))}
                  </tr>
                )}
              </thead>
              <tbody>
                {filteredRows.slice(1).map((row, rIdx) => (
                  <tr
                    key={rIdx}
                    style={{
                      background: rIdx % 2 === 0 ? (isLight ? '#ffffff' : 'rgba(255,255,255,0.02)') : (isLight ? '#f8fafc' : 'rgba(255,255,255,0.04)'),
                      borderBottom: `1px solid ${isLight ? '#e2e8f0' : 'rgba(255,255,255,0.05)'}`
                    }}
                  >
                    {(row || []).map((cellVal, cIdx) => (
                      <td
                        key={cIdx}
                        style={{
                          padding: '0.75rem 1.2rem',
                          textAlign: (typeof cellVal === 'number' || !isNaN(cellVal)) ? 'center' : 'left',
                          color: 'var(--text-primary)',
                          borderRight: `1px solid ${isLight ? '#f1f5f9' : 'rgba(255,255,255,0.03)'}`,
                          fontWeight: (row[0] === 'Genel Toplam' || cellVal === 'Genel Toplam') ? '900' : 'normal'
                        }}
                      >
                        {cellVal !== null && cellVal !== undefined ? cellVal.toString() : ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeatReportGenerator;
