import React, { useState, useEffect, useRef } from 'react';
import * as bwipjs from '@bwip-js/browser';
import API_BASE_URL from '../services/apiConfig';
import { extractCleanShoeDisplay } from '../pages/PersonnelOrderManagement';

// Barcode Preview Canvas
export const BarcodePreviewCanvas = ({ barcode, template = 'CODE128', height = 50 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const cleanText = String(barcode || 'KOLI-VW-0001').trim();
    try {
      if (template === 'QR') {
        bwipjs.toCanvas(canvasRef.current, {
          bcid: 'qrcode',
          text: cleanText,
          scale: 3,
          includetext: false
        });
      } else {
        bwipjs.toCanvas(canvasRef.current, {
          bcid: 'code128',
          text: cleanText,
          scale: 2,
          height: 12,
          includetext: true,
          textsize: 9
        });
      }
    } catch (e) {
      // preview error ignored
    }
  }, [barcode, template]);

  return (
    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <canvas ref={canvasRef} style={{ maxWidth: '100%', maxHeight: `${height}px`, display: 'block', margin: '0 auto' }} />
    </div>
  );
};

const chToPhysicalMap = {
  // Bölüm 1 (A Hattı Sol: A1 [9] + A0 [6])
  1: 'A1-1', 2: 'A1-2', 3: 'A1-3', 4: 'A1-4', 5: 'A1-5', 6: 'A1-6', 7: 'A1-7', 8: 'A1-8', 9: 'A1-9',
  10: 'A0-1', 11: 'A0-2', 12: 'A0-3', 13: 'A0-4', 14: 'A0-5', 15: 'A0-6',
  // Bölüm 2 (A Hattı Sağ: A3 [9] + A4 [6])
  16: 'A3-1', 17: 'A3-2', 18: 'A3-3', 19: 'A3-4', 20: 'A3-5', 21: 'A3-6', 22: 'A3-7', 23: 'A3-8', 24: 'A3-9',
  25: 'A4-1', 26: 'A4-2', 27: 'A4-3', 28: 'A4-4', 29: 'A4-5', 30: 'A4-6',
  // Bölüm 3 (B Hattı Sol: B1 [9] + B0 [6])
  31: 'B1-1', 32: 'B1-2', 33: 'B1-3', 34: 'B1-4', 35: 'B1-5', 36: 'B1-6', 37: 'B1-7', 38: 'B1-8', 39: 'B1-9',
  40: 'B0-1', 41: 'B0-2', 42: 'B0-3', 43: 'B0-4', 44: 'B0-5', 45: 'B0-6',
  // Bölüm 4 (B Hattı Sağ: B3 [9] + B4 [6])
  46: 'B3-1', 47: 'B3-2', 48: 'B3-3', 49: 'B3-4', 50: 'B3-5', 51: 'B3-6', 52: 'B3-7', 53: 'B3-8', 54: 'B3-9',
  55: 'B4-1', 56: 'B4-2', 57: 'B4-3', 58: 'B4-4', 59: 'B4-5', 60: 'B4-6',
  // Asansör Arkası Hata/Kontrol (A2: 3 Göz)
  61: 'A2-1', 62: 'A2-2', 63: 'A2-3'
};

const PersonnelLabelAndReceiptModal = ({ person, onClose, onPrinted, isLight = false }) => {
  const [activePrintTab, setActivePrintTab] = useState('ALL'); // 'ALL', 'RECEIPT', 'LABELS', 'BOX'
  const [loadingPrintData, setLoadingPrintData] = useState(true);
  const [printModalData, setPrintModalData] = useState(null);
  const [labelBarcodeType, setLabelBarcodeType] = useState('1D'); // '1D' or 'QR'
  const [isPrintingAction, setIsPrintingAction] = useState(false);
  const [modalFeedback, setModalFeedback] = useState(null);

  useEffect(() => {
    if (!person || !person.id) return;
    let isMounted = true;
    setLoadingPrintData(true);
    setModalFeedback(null);

    const loadData = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/personnel-orders/${person.id}/label-data`);
        const data = await res.json();
        if (isMounted) {
          if (data.success) {
            setPrintModalData(data);
          } else {
            setModalFeedback({ type: 'error', text: data.message || 'Etiket verisi alınamadı.' });
          }
        }
      } catch (err) {
        if (isMounted) {
          setModalFeedback({ type: 'error', text: 'Bağlantı hatası: ' + err.message });
        }
      } finally {
        if (isMounted) {
          setLoadingPrintData(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [person]);

  // Tarayıcı Doğrudan Yazdırma Fonksiyonu (Hidden iframe ile Pop-up Engelini %100 Aşar)
  const printHtmlBlock = (elementId, title = 'Baskı', pageFormat = 'A5') => {
    const el = document.getElementById(elementId);
    if (!el) {
      console.warn('Yazdırılacak alan bulunamadı:', elementId);
      return false;
    }

    let iframe = document.getElementById('vog-silent-print-frame');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'vog-silent-print-frame';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.opacity = '0';
      iframe.style.pointerEvents = 'none';
      document.body.appendChild(iframe);
    }

    try {
      // 1. Elementin klonunu al ve canvasları baskıda kaybolmaması için dataURL img elementine çevir
      const clone = el.cloneNode(true);
      const originalCanvases = el.querySelectorAll('canvas');
      const clonedCanvases = clone.querySelectorAll('canvas');

      originalCanvases.forEach((origCanvas, idx) => {
        const targetCanvas = clonedCanvases[idx];
        if (targetCanvas) {
          try {
            const dataUrl = origCanvas.toDataURL('image/png');
            const img = document.createElement('img');
            img.src = dataUrl;
            img.style.maxWidth = targetCanvas.style.maxWidth || '100%';
            img.style.maxHeight = targetCanvas.style.maxHeight || '100%';
            img.style.display = 'block';
            img.style.margin = '0 auto';
            targetCanvas.parentNode.replaceChild(img, targetCanvas);
          } catch (canvasErr) {
            console.warn('Canvas toDataURL error:', canvasErr);
          }
        }
      });

      const isA5 = pageFormat === 'A5' || elementId === 'personnel-receipt-print-area';
      const isBox = pageFormat === 'Box' || elementId === 'personnel-box-print-area';
      const pageRule = isA5
        ? '@page { size: A5 portrait; margin: 5mm 6mm; }'
        : (isBox 
            ? '@page { size: 80mm 100mm portrait; margin: 0; }' 
            : '@page { size: auto; margin: 6mm; }');

      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>${title}</title>
            <style>
              ${pageRule}
              * { box-sizing: border-box; }
              html, body {
                margin: 0;
                padding: 0;
                background: #ffffff;
                color: #000000;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                -webkit-font-smoothing: antialiased;
              }
              body {
                padding: ${isA5 ? '1mm 2mm' : '8px'};
                width: 100%;
              }
              table { width: 100%; border-collapse: collapse; }
              img { max-width: 100%; height: auto; }
              @media print {
                .no-print { display: none !important; }
                body {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                #personnel-receipt-print-area {
                  border: 1.5px solid #000 !important;
                  border-radius: 0.6rem !important;
                  box-shadow: none !important;
                  padding: 10px 14px !important;
                  margin: 0 auto !important;
                  width: 100% !important;
                  max-width: 100% !important;
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                }
              }
            </style>
          </head>
          <body>
            ${clone.outerHTML}
          </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        } catch (e) {
          console.warn('Iframe print error, falling back to window.print:', e);
          window.print();
        }
      }, 350);
      return true;
    } catch (printErr) {
      console.warn('Print iframe error:', printErr);
      return false;
    }
  };

  // Action: Fiş & Etiket Yazdırma Emri (Termal SATO/Godex + Tarayıcı Yazdırma Penceresi)
  const handlePrintVoucher = async (personId, printType = 'ALL') => {
    setIsPrintingAction(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/personnel-orders/print-voucher`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staff_id: personId,
          personnel_id: personId,
          print_type: printType,
          print_labels: printType === 'ALL' || printType === 'LABELS',
          print_receipt: printType === 'ALL' || printType === 'RECEIPT',
          print_box: printType === 'ALL' || printType === 'BOX',
          barcode_type: labelBarcodeType
        })
      });
      const data = await res.json();
      if (data.success) {
        setModalFeedback({
          type: 'success',
          text: `✅ ${data.message} (Yazıcı: SATO CL4NX Plus [${labelBarcodeType === 'QR' ? '2D Karekod' : '1D Barkod'}] & Godex G530)`
        });

        // If Tarayıcı baskısı istendiyse veya Fiş seçildiyse doğrudan tarayıcı yazdırmayı da tetikle
        if (printType === 'RECEIPT') {
          setTimeout(() => {
            printHtmlBlock('personnel-receipt-print-area', 'VOG Üretim & Sevk Fişi (A5)', 'A5');
          }, 400);
        } else if (printType === 'LABELS') {
          setTimeout(() => {
            printHtmlBlock('personnel-labels-print-area', '7 Parça Kıyafet Etiketleri', 'Labels');
          }, 400);
        } else if (printType === 'BOX') {
          setTimeout(() => {
            printHtmlBlock('personnel-box-print-area', 'Godex Koli Etiketi', 'Box');
          }, 400);
        }

        if (onPrinted) {
          onPrinted(personId, printType);
        }
      } else {
        setModalFeedback({ type: 'error', text: '⚠️ ' + (data.message || 'Yazdırma işlemi başarısız oldu.') });
      }
    } catch (err) {
      setModalFeedback({ type: 'error', text: '⚠️ Yazdırma hatası: ' + err.message });
    } finally {
      setIsPrintingAction(false);
    }
  };

  if (!person) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10001,
      padding: '1rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '920px',
        maxHeight: '94vh',
        background: isLight ? '#ffffff' : '#0f172a',
        color: isLight ? '#0f172a' : '#f8fafc',
        borderRadius: '2rem',
        border: `1px solid ${isLight ? '#e2e8f0' : 'rgba(255,255,255,0.1)'}`,
        boxShadow: '0 25px 70px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '1.2rem 1.8rem',
          background: isLight ? '#f8fafc' : 'rgba(30, 41, 59, 0.8)',
          borderBottom: `1px solid ${isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <span style={{ fontSize: '1.4rem' }}>🏷️</span>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '900' }}>
                  {(person.brand || 'VOLKSWAGEN').toUpperCase()} | FİŞ & ETİKET BASIM MERKEZİ
                </h2>
                <div style={{ fontSize: '0.8rem', color: isLight ? '#64748b' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.8rem', marginTop: '0.2rem' }}>
                  <span><strong>{person.brand === 'SCANIA' ? 'Personel:' : 'Danışman:'}</strong> {person.name} ({person.gender || 'Erkek'})</span>
                  <span>•</span>
                  <span><strong>Bayi:</strong> {person.service_center}</span>
                  {person.sorter_chute && (
                    <>
                      <span>•</span>
                      <span style={{ color: '#f59e0b', fontWeight: '900' }}>
                        🎯 GÖZ #{person.sorter_chute} ({chToPhysicalMap[person.sorter_chute] || `CH-${person.sorter_chute}`})
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <span style={{
              padding: '0.35rem 0.8rem',
              borderRadius: '0.7rem',
              fontSize: '0.75rem',
              fontWeight: '900',
              background: person.voucher_status === 'BASILDI'
                ? 'rgba(2, 132, 199, 0.15)'
                : (person.voucher_status === 'TAMAMLANDI' || person.packing_status === 'PACKED')
                  ? 'rgba(16, 185, 129, 0.15)'
                  : 'rgba(217, 119, 6, 0.15)',
              color: person.voucher_status === 'BASILDI'
                ? '#0284c7'
                : (person.voucher_status === 'TAMAMLANDI' || person.packing_status === 'PACKED')
                  ? '#10b981'
                  : '#d97706',
              border: `1px solid ${person.voucher_status === 'BASILDI' ? '#7dd3fc' : '#fde68a'}`
            }}>
              {person.voucher_status === 'BASILDI' ? '🖨️ FİŞ BASILDI' : (person.voucher_status === 'TAMAMLANDI' ? '✅ TAMAMLANDI' : '⏳ BEKLİYOR')}
            </span>

            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.6rem',
                color: isLight ? '#64748b' : '#94a3b8',
                cursor: 'pointer',
                fontWeight: '900',
                lineHeight: 1
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Tabs & Format Selector Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          padding: '0.6rem 1.8rem',
          background: isLight ? '#ffffff' : '#0f172a',
          borderBottom: `1px solid ${isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)'}`,
          gap: '0.8rem'
        }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: '📑 TÜMÜ (Genel Bakış & Hızlı Basım)' },
              { id: 'RECEIPT', label: '🧾 ÜRETİM & SEVK FİŞİ (A5)' },
              { id: 'LABELS', label: `🏷️ ${printModalData?.receipt?.total_items || printModalData?.item_labels?.length || 7} PARÇA KIYAFET ETİKETLERİ` },
              { id: 'BOX', label: '📦 GODEX DİKEY KOLİ ETİKETİ' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActivePrintTab(t.id)}
                style={{
                  padding: '0.55rem 1rem',
                  borderRadius: '0.8rem',
                  border: 'none',
                  background: activePrintTab === t.id ? (isLight ? '#0f172a' : '#ffffff') : 'transparent',
                  color: activePrintTab === t.id ? (isLight ? '#ffffff' : '#0f172a') : (isLight ? '#64748b' : '#94a3b8'),
                  fontWeight: '800',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Barkod Formatı Seçimi (1D Çizgili Barkod vs 2D QR Karekod) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.08)',
            padding: '0.25rem 0.4rem',
            borderRadius: '0.8rem',
            border: `1.5px solid ${isLight ? '#cbd5e1' : 'rgba(255,255,255,0.15)'}`
          }}>
            <span style={{ fontSize: '0.72rem', fontWeight: '900', color: isLight ? '#475569' : '#94a3b8', padding: '0 0.35rem' }}>
              BARKOD FORMATI:
            </span>
            <button
              type="button"
              onClick={() => setLabelBarcodeType('1D')}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '0.6rem',
                border: 'none',
                background: labelBarcodeType === '1D' ? '#2563eb' : 'transparent',
                color: labelBarcodeType === '1D' ? '#ffffff' : (isLight ? '#334155' : '#cbd5e1'),
                fontWeight: '900',
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                boxShadow: labelBarcodeType === '1D' ? '0 2px 6px rgba(37,99,235,0.4)' : 'none',
                transition: 'all 0.15s ease'
              }}
              title="SATO CL4NX Plus ve canlı önizleme için 1D Çizgili Barkod (Code 128) formatı"
            >
              <span>🏷️</span>
              <span>1D Çizgili Barkod</span>
            </button>
            <button
              type="button"
              onClick={() => setLabelBarcodeType('QR')}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '0.6rem',
                border: 'none',
                background: labelBarcodeType === 'QR' ? '#2563eb' : 'transparent',
                color: labelBarcodeType === 'QR' ? '#ffffff' : (isLight ? '#334155' : '#cbd5e1'),
                fontWeight: '900',
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                boxShadow: labelBarcodeType === 'QR' ? '0 2px 6px rgba(37,99,235,0.4)' : 'none',
                transition: 'all 0.15s ease'
              }}
              title="SATO CL4NX Plus ve canlı önizleme için 2D QR Karekod formatı"
            >
              <span>🔲</span>
              <span>2D QR Karekod</span>
            </button>
          </div>
        </div>

        {/* Modal Inside Feedback Toast Banner */}
        {modalFeedback && (
          <div style={{
            margin: '0.9rem 1.8rem 0 1.8rem',
            padding: '0.85rem 1.2rem',
            borderRadius: '0.8rem',
            background: modalFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1.5px solid ${modalFeedback.type === 'success' ? '#10b981' : '#ef4444'}`,
            color: modalFeedback.type === 'success' ? '#047857' : '#b91c1c',
            fontWeight: '800',
            fontSize: '0.88rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 4px 14px rgba(0,0,0,0.06)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>{modalFeedback.type === 'success' ? '✅' : '⚠️'}</span>
              <span>{modalFeedback.text}</span>
            </div>
            <button
              onClick={() => setModalFeedback(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: '900', fontSize: '1.2rem', color: 'inherit', padding: '0 0.4rem' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Modal Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 1.8rem' }}>
          {loadingPrintData ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
              ⏳ Fiş ve etiket verileri hazırlanıyor...
            </div>
          ) : !printModalData ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#ef4444' }}>
              Etiket verisi yüklenemedi. Lütfen tekrar deneyin.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* TAB: RECEIPT (Üretim & Sevk Fişi A5) */}
              {(activePrintTab === 'ALL' || activePrintTab === 'RECEIPT') && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '900' }}>
                      🧾 A5 Resmi Üretim ve Dağıtım Sevk Fişi
                    </h3>
                    <button
                      onClick={() => handlePrintVoucher(person.id, 'RECEIPT')}
                      style={{
                        padding: '0.45rem 1.1rem',
                        borderRadius: '0.6rem',
                        border: 'none',
                        background: '#2563eb',
                        color: '#ffffff',
                        fontWeight: '900',
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        boxShadow: '0 2px 8px rgba(37, 99, 235, 0.35)'
                      }}
                      title="A5 Fişini Tarayıcıdan Yazdır veya PDF Olarak Kaydet"
                    >
                      <span>🖨️</span>
                      <span>Bu Fişi Yazdır (A5)</span>
                    </button>
                  </div>

                  <div id="personnel-receipt-print-area" style={{
                    background: '#ffffff',
                    color: '#000000',
                    padding: '1.2rem 1.4rem',
                    borderRadius: '0.8rem',
                    border: '2px solid #000000',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                    maxWidth: '800px',
                    width: '100%',
                    margin: '0 auto',
                    boxSizing: 'border-box'
                  }}>
                    {/* Fiş Header (Sol Kurumsal Bilgi - Sağ Fiş ve Sorter Bilgisi) */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      borderBottom: '2px solid #000000',
                      paddingBottom: '0.6rem',
                      marginBottom: '0.8rem',
                      gap: '1rem'
                    }}>
                      <div style={{ flex: '1 1 auto', minWidth: '0' }}>
                        <div style={{ fontSize: '1.05rem', fontWeight: '900', letterSpacing: '0.3px', whiteSpace: 'nowrap', color: '#000000' }}>
                          VOG TEKSTİL SAN. TİC. LTD. ŞTİ.
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#475569', whiteSpace: 'nowrap', marginTop: '1px' }}>
                          VOG Sorter Akıllı Lojistik & Sipariş Ayrıştırma Sistemi
                        </div>
                        <div style={{ fontSize: '0.92rem', fontWeight: '900', marginTop: '0.35rem', color: '#000000', lineHeight: 1.25 }}>
                          VOLKSWAGEN YETKİLİ SERVİS KIYAFET DAĞITIM VE SEVK FİŞİ
                        </div>
                      </div>

                      <div style={{ flex: '0 0 auto', textAlign: 'right', whiteSpace: 'nowrap', paddingLeft: '0.8rem' }}>
                        <div style={{ fontWeight: '900', fontSize: '0.92rem', color: '#000000' }}>
                          FİŞ NO: {printModalData.receipt.receipt_no}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '2px' }}>
                          <strong>Tarih:</strong> {printModalData.receipt.date}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#475569' }}>
                          <strong>Saat:</strong> {printModalData.receipt.time}
                        </div>
                        <div style={{
                          display: 'inline-block',
                          marginTop: '0.3rem',
                          padding: '0.18rem 0.6rem',
                          borderRadius: '0.35rem',
                          background: '#000000',
                          color: '#ffffff',
                          fontWeight: '900',
                          fontSize: '0.72rem',
                          letterSpacing: '0.3px'
                        }}>
                          {printModalData.receipt.sorter_chute ? `SORTER GÖZ #${printModalData.receipt.sorter_chute} (${printModalData.receipt.chute_code})` : 'STANDBY'}
                        </div>
                      </div>
                    </div>

                    {/* Personnel Metadata Grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '0.5rem 0.8rem',
                      padding: '0.65rem 0.85rem',
                      background: '#f8fafc',
                      borderRadius: '0.5rem',
                      border: '1px solid #cbd5e1',
                      marginBottom: '0.8rem',
                      fontSize: '0.8rem',
                      lineHeight: 1.35
                    }}>
                      <div><span style={{ color: '#64748b' }}>Yetkili Satıcı (Bayi):</span><br /><strong style={{ color: '#0f172a' }}>{printModalData.staff.service_center}</strong></div>
                      <div><span style={{ color: '#64748b' }}>Bölüm & Pozisyon:</span><br /><strong style={{ color: '#0f172a' }}>{printModalData.staff.department} ({printModalData.staff.role || 'Servis Danışmanı'})</strong></div>
                      <div><span style={{ color: '#64748b' }}>Personel Adı:</span><br /><span style={{ fontSize: '0.92rem', fontWeight: '900', color: '#0f172a' }}>{printModalData.staff.name}</span> ({printModalData.staff.gender || 'Erkek'})</div>
                      <div><span style={{ color: '#64748b' }}>Parça No:</span><br /><code style={{ fontWeight: '900', fontSize: '0.82rem', color: '#1e40af' }}>{printModalData.staff.part_no}</code></div>
                      <div><span style={{ color: '#64748b' }}>Koli Barkodu:</span><br /><code style={{ fontWeight: '900', fontSize: '0.82rem', color: '#0f172a' }}>{printModalData.staff.box_barcode}</code></div>
                      <div><span style={{ color: '#64748b' }}>Mont Tercihi:</span><br /><strong style={{ color: printModalData.staff.mont_preference === 'KALIN' ? '#d97706' : '#0284c7' }}>{printModalData.staff.mont_preference === 'KALIN' ? '🧥 KALIN MONT' : '🦺 İNCE MONT'}</strong></div>
                    </div>

                    {/* 7 Parça Dökümü Tablosu */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', marginBottom: '0.8rem' }}>
                      <thead>
                        <tr style={{ background: '#0f172a', color: '#ffffff' }}>
                          <th style={{ padding: '0.4rem 0.5rem', textAlign: 'center', width: '30px' }}>#</th>
                          <th style={{ padding: '0.4rem 0.5rem', textAlign: 'left' }}>Ürün Açıklaması</th>
                          <th style={{ padding: '0.4rem 0.5rem', textAlign: 'left', width: '130px' }}>Parça No</th>
                          <th style={{ padding: '0.4rem 0.5rem', textAlign: 'center', width: '55px' }}>Beden</th>
                          <th style={{ padding: '0.4rem 0.5rem', textAlign: 'center', width: '40px' }}>Adet</th>
                          <th style={{ padding: '0.4rem 0.5rem', textAlign: 'left', width: '130px' }}>EAN-13 Barkod</th>
                          <th style={{ padding: '0.4rem 0.5rem', textAlign: 'center', width: '70px' }}>Durum</th>
                        </tr>
                      </thead>
                      <tbody>
                        {printModalData.receipt.items.map((item, idx) => (
                          <tr key={item.id || idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                            <td style={{ padding: '0.35rem 0.5rem', textAlign: 'center', fontWeight: '800' }}>{idx + 1}</td>
                            <td style={{ padding: '0.35rem 0.5rem', fontWeight: '700' }}>{item.name}</td>
                            <td style={{ padding: '0.35rem 0.5rem', fontFamily: 'monospace', fontSize: '0.76rem', fontWeight: '800', color: '#1e40af' }}>{item.part_no || '-'}</td>
                            <td style={{ padding: '0.35rem 0.5rem', textAlign: 'center', fontWeight: '900', color: '#0f172a' }}>{item.size}</td>
                            <td style={{ padding: '0.35rem 0.5rem', textAlign: 'center', fontWeight: '900' }}>{item.qty}</td>
                            <td style={{ padding: '0.35rem 0.5rem', fontFamily: 'monospace', fontSize: '0.76rem', fontWeight: '800' }}>{item.barcode}</td>
                            <td style={{ padding: '0.35rem 0.5rem', textAlign: 'center' }}>
                              <span style={{ padding: '0.12rem 0.45rem', borderRadius: '0.35rem', fontSize: '0.68rem', fontWeight: '900', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
                                ✓ HAZIR
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: '#f1f5f9', fontWeight: '900', borderTop: '2px solid #000' }}>
                          <td colSpan="4" style={{ padding: '0.4rem 0.5rem', textAlign: 'right' }}>TOPLAM:</td>
                          <td style={{ padding: '0.4rem 0.5rem', textAlign: 'center' }}>
                            {printModalData.receipt.total_items || printModalData.receipt.items.reduce((s, i) => s + (i.qty || 1), 0)} Adet
                          </td>
                          <td colSpan="2" style={{ padding: '0.4rem 0.5rem', color: '#059669' }}>Eksiksiz Personel Seti</td>
                        </tr>
                      </tfoot>
                    </table>

                    {/* Barkod & İmza Alanı */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #000000', paddingTop: '0.65rem', marginTop: '0.3rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <BarcodePreviewCanvas barcode={printModalData.staff.box_barcode} template="QR" height={52} />
                        <div>
                          <div style={{ fontSize: '0.74rem', fontWeight: '900' }}>DİJİTAL SEVK KONTROLÜ</div>
                          <div style={{ fontSize: '0.7rem', color: '#334155', fontFamily: 'monospace', fontWeight: '700' }}>{printModalData.staff.box_barcode}</div>
                          <div style={{ fontSize: '0.66rem', color: '#64748b' }}>VOG Sorter Doğrulama Onaylı</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '1.5rem' }}>
                        <div style={{ textAlign: 'center', borderTop: '1px dashed #666666', width: '125px', paddingTop: '0.35rem', fontSize: '0.73rem' }}>
                          <strong>Teslim Eden (VOG)</strong><br />İmza / Kaşe
                        </div>
                        <div style={{ textAlign: 'center', borderTop: '1px dashed #666666', width: '125px', paddingTop: '0.35rem', fontSize: '0.73rem' }}>
                          <strong>Teslim Alan (Bayi)</strong><br />Adı Soyadı / İmza
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: LABELS (Kıyafet Etiketleri) */}
              {(activePrintTab === 'ALL' || activePrintTab === 'LABELS') && (
                <div>
                  {/* Kıyafet Etiketi Başlık & Aksiyonlar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', flexWrap: 'wrap', gap: '0.8rem' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '900' }}>
                        🏷️ {printModalData?.receipt?.total_items || printModalData?.item_labels?.length || 7} Parça Bireysel Kıyafet Barkod Etiketleri (100x50 mm)
                      </h3>
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        Termal Rulo Yazıcı Uyumlu (SATO CL4NX Plus / Zebra / Godex)
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button
                        onClick={() => printHtmlBlock('personnel-labels-print-area', `${printModalData?.receipt?.total_items || 7} Parça Kıyafet Etiketleri`)}
                        style={{
                          padding: '0.45rem 0.85rem',
                          borderRadius: '0.6rem',
                          border: '1px solid #cbd5e1',
                          background: '#f8fafc',
                          color: '#334155',
                          fontWeight: '800',
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                        title="Kıyafet Etiketlerini Tarayıcıdan Yazdır veya PDF Olarak Kaydet"
                      >
                        <span>📄</span>
                        <span>Tarayıcı / PDF</span>
                      </button>
                      <button
                        onClick={() => handlePrintVoucher(person.id, 'LABELS')}
                        style={{
                          padding: '0.45rem 1.1rem',
                          borderRadius: '0.6rem',
                          border: 'none',
                          background: '#10b981',
                          color: '#ffffff',
                          fontWeight: '900',
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)'
                        }}
                        title="Kıyafet Etiketlerini SATO CL4NX Plus Termal Yazıcıya Gönder"
                      >
                        <span>🏷️</span>
                        <span>Bu {printModalData?.receipt?.total_items || printModalData?.item_labels?.length || 7} Etiketi Bas (SATO - {labelBarcodeType === 'QR' ? '2D Karekod' : '1D Barkod'})</span>
                      </button>
                    </div>
                  </div>

                  {/* Barkod Formatı Seçim Kutusu (1D Çizgili Barkod vs 2D QR Karekod) */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.8rem',
                    padding: '0.75rem 1.1rem',
                    borderRadius: '0.8rem',
                    background: isLight ? '#f1f5f9' : 'rgba(30, 41, 59, 0.7)',
                    border: `1.5px solid ${isLight ? '#cbd5e1' : 'rgba(255,255,255,0.12)'}`,
                    marginBottom: '1rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ fontSize: '1.25rem' }}>
                        {labelBarcodeType === 'QR' ? '🔲' : '🏷️'}
                      </span>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: '900', color: isLight ? '#0f172a' : '#f8fafc' }}>
                          Barkod Formatı: <span style={{ color: '#2563eb' }}>{labelBarcodeType === 'QR' ? '2D QR Karekod' : '1D Çizgili Barkod (Code 128)'}</span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                          Seçtiğiniz format aşağıdaki 7 önizleme etiketine ve SATO CL4NX Plus termal yazıcı çıktısına anında yansır.
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem', background: isLight ? '#e2e8f0' : 'rgba(0,0,0,0.3)', padding: '0.25rem', borderRadius: '0.65rem' }}>
                      <button
                        type="button"
                        onClick={() => setLabelBarcodeType('1D')}
                        style={{
                          padding: '0.45rem 0.9rem',
                          borderRadius: '0.5rem',
                          border: 'none',
                          background: labelBarcodeType === '1D' ? '#2563eb' : 'transparent',
                          color: labelBarcodeType === '1D' ? '#ffffff' : (isLight ? '#334155' : '#cbd5e1'),
                          fontWeight: '900',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          boxShadow: labelBarcodeType === '1D' ? '0 2px 6px rgba(37,99,235,0.4)' : 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span>🏷️</span>
                        <span>1D Çizgili Barkod (Code 128)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setLabelBarcodeType('QR')}
                        style={{
                          padding: '0.45rem 0.9rem',
                          borderRadius: '0.5rem',
                          border: 'none',
                          background: labelBarcodeType === 'QR' ? '#2563eb' : 'transparent',
                          color: labelBarcodeType === 'QR' ? '#ffffff' : (isLight ? '#334155' : '#cbd5e1'),
                          fontWeight: '900',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          boxShadow: labelBarcodeType === 'QR' ? '0 2px 6px rgba(37,99,235,0.4)' : 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span>🔲</span>
                        <span>2D QR Karekod</span>
                      </button>
                    </div>
                  </div>

                  <div id="personnel-labels-print-area" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                    {printModalData.bundle_items.map((item, idx) => (
                      <div
                        key={item.id}
                        style={{
                          background: '#ffffff',
                          color: '#000000',
                          border: '2px solid #000',
                          borderRadius: '0.8rem',
                          padding: '0.8rem',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                        }}
                      >
                        {/* Label Header: Ürün Adı & Model (Sipariş Bazlı Etiket Formatı - Personel Adı Olmaksızın) */}
                        <div style={{ borderBottom: '1.5px solid #000', paddingBottom: '0.3rem', marginBottom: '0.35rem' }}>
                          <div style={{ fontWeight: '900', fontSize: '0.88rem', color: '#000000', textTransform: 'uppercase', letterSpacing: '0.2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.name}
                          </div>
                          <div style={{ fontSize: '0.74rem', fontWeight: '800', color: '#334155', marginTop: '1px' }}>
                            {(item.gender || printModalData.staff.gender || 'Erkek').toUpperCase()}  |  {(printModalData.staff.brand || 'SCANIA').toUpperCase()}
                          </div>
                        </div>

                        {/* Grid: Parça No, Beden, EAN */}
                        <div style={{ background: '#f8fafc', padding: '0.45rem 0.6rem', borderRadius: '0.4rem', border: '1px solid #e2e8f0', marginBottom: '0.5rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '800' }}>PARÇA NO:</div>
                              <code style={{ fontWeight: '900', fontSize: '0.86rem', color: '#1e40af' }}>{item.part_no || item.sku || '-'}</code>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '800' }}>BEDEN:</div>
                              <span style={{ fontWeight: '900', fontSize: '1.15rem', color: '#000' }}>{item.size || 'STD'}</span>
                            </div>
                          </div>
                          <div style={{ marginTop: '0.25rem', paddingTop: '0.25rem', borderTop: '1px dashed #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '800' }}>EAN / BARKOD:</span>
                            <code style={{ fontSize: '0.78rem', fontWeight: '800', color: '#0f172a' }}>{item.barcode || item.part_no}</code>
                          </div>
                        </div>

                        {/* Barcode Canvas */}
                        <div style={{ background: '#fff', padding: '0.25rem 0', borderRadius: '0.4rem', textAlign: 'center' }}>
                          <BarcodePreviewCanvas
                            barcode={item.part_no || item.barcode}
                            template={labelBarcodeType === 'QR' ? 'QR' : 'CODE128'}
                            height={labelBarcodeType === 'QR' ? 52 : 36}
                          />
                          <div style={{ fontSize: '0.62rem', color: '#64748b', textAlign: 'center', marginTop: '0.2rem', fontWeight: '800', letterSpacing: '0.3px' }}>
                            {labelBarcodeType === 'QR' ? '🔲 2D QR KAREKOD' : '🏷️ 1D ÇİZGİLİ BARKOD (CODE 128)'}
                          </div>
                        </div>

                        {/* Label Footer (Standart Kurumsal Etiket Altlığı) */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.62rem', color: '#475569', borderTop: '1.5px solid #000', paddingTop: '0.3rem', marginTop: '0.35rem' }}>
                          <span>VOG TEKSTİL A.Ş.</span>
                          <span style={{ fontWeight: '800' }}>🇹🇷 YERLİ ÜRETİM • ((RFID))</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB: BOX (Godex Dikey Koli Etiketi) */}
              {(activePrintTab === 'ALL' || activePrintTab === 'BOX') && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '900' }}>
                        📦 Godex G530 Dikey Koli Etiketi (80x100 mm)
                      </h3>
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        Dış Koli Üzerine Yapıştırılacak Resmi Sevk Etiketi
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button
                        onClick={() => printHtmlBlock('personnel-box-print-area', 'Godex Koli Etiketi')}
                        style={{
                          padding: '0.45rem 0.85rem',
                          borderRadius: '0.6rem',
                          border: '1px solid #cbd5e1',
                          background: '#f8fafc',
                          color: '#334155',
                          fontWeight: '800',
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                        title="Koli Etiketini Tarayıcıdan Yazdır veya PDF Olarak Kaydet"
                      >
                        <span>📄</span>
                        <span>Tarayıcı / PDF</span>
                      </button>
                      <button
                        onClick={() => handlePrintVoucher(person.id, 'BOX')}
                        style={{
                          padding: '0.45rem 1.1rem',
                          borderRadius: '0.6rem',
                          border: 'none',
                          background: '#6366f1',
                          color: '#ffffff',
                          fontWeight: '900',
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          boxShadow: '0 2px 8px rgba(99, 102, 241, 0.35)'
                        }}
                        title="Godex G530 Koli Etiketini Termal Yazıcıya Gönder"
                      >
                        <span>📦</span>
                        <span>Bu Koli Etiketini Bas (Godex)</span>
                      </button>
                    </div>
                  </div>

                  <div id="personnel-box-print-area" style={{
                    maxWidth: '480px',
                    margin: '0 auto',
                    background: '#fff',
                    color: '#000',
                    border: '3px solid #000',
                    borderRadius: '0.8rem',
                    padding: '1rem',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.08)'
                  }}>
                    <div style={{ background: '#000', color: '#fff', padding: '0.5rem 0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '900', fontSize: '1.1rem' }}>
                      <span>VOLKSWAGEN</span>
                      <span>KOLİ: 1 / 1</span>
                    </div>

                    <div style={{ padding: '0.6rem 0', borderBottom: '1px solid #ccc', fontSize: '0.85rem' }}>
                      <div><strong>BAYİ:</strong> {printModalData.staff.service_center}</div>
                      <div><strong>BÖLÜM:</strong> {printModalData.staff.department}</div>
                      <div style={{ marginTop: '0.3rem', fontSize: '1.05rem', fontWeight: '900' }}>
                        PERSONEL: {printModalData.staff.name} ({printModalData.staff.gender || 'Erkek'})
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.15rem' }}>
                        PARÇA NO: {printModalData.staff.part_no} | {printModalData.staff.sorter_chute ? `SORTER GÖZ #${printModalData.staff.sorter_chute} (${printModalData.staff.chute_code})` : 'STANDBY'}
                      </div>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                      <thead>
                        <tr style={{ background: '#000', color: '#fff', fontSize: '0.75rem' }}>
                          <th style={{ padding: '0.3rem' }}>Beden</th>
                          <th style={{ padding: '0.3rem' }}>Ürün Açıklaması</th>
                          <th style={{ padding: '0.3rem', textAlign: 'right' }}>Adet</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr><td style={{ borderBottom: '1px solid #eee', padding: '0.3rem', textAlign: 'center', fontWeight: '800' }}>{printModalData.staff.top_size}</td><td style={{ borderBottom: '1px solid #eee', padding: '0.3rem' }}>Servis Danışman Montu ({printModalData.staff.mont_preference})</td><td style={{ borderBottom: '1px solid #eee', padding: '0.3rem', textAlign: 'right' }}>1</td></tr>
                        <tr><td style={{ borderBottom: '1px solid #eee', padding: '0.3rem', textAlign: 'center', fontWeight: '800' }}>{printModalData.staff.top_size}</td><td style={{ borderBottom: '1px solid #eee', padding: '0.3rem' }}>Servis Danışman Yelek</td><td style={{ borderBottom: '1px solid #eee', padding: '0.3rem', textAlign: 'right' }}>1</td></tr>
                        <tr><td style={{ borderBottom: '1px solid #eee', padding: '0.3rem', textAlign: 'center', fontWeight: '800' }}>{printModalData.staff.top_size}</td><td style={{ borderBottom: '1px solid #eee', padding: '0.3rem' }}>Servis Danışman Gömlek</td><td style={{ borderBottom: '1px solid #eee', padding: '0.3rem', textAlign: 'right' }}>2</td></tr>
                        <tr><td style={{ borderBottom: '1px solid #eee', padding: '0.3rem', textAlign: 'center', fontWeight: '800' }}>{printModalData.staff.bottom_size}</td><td style={{ borderBottom: '1px solid #eee', padding: '0.3rem' }}>Servis Danışman Pantolon</td><td style={{ borderBottom: '1px solid #eee', padding: '0.3rem', textAlign: 'right' }}>2</td></tr>
                        <tr>
                          <td style={{ borderBottom: '1px solid #eee', padding: '0.3rem', textAlign: 'center', fontWeight: '800' }}>
                            {(printModalData.bundle_items && printModalData.bundle_items[6] ? printModalData.bundle_items[6].size : extractCleanShoeDisplay(printModalData.staff.shoe_size))}
                          </td>
                          <td style={{ borderBottom: '1px solid #eee', padding: '0.3rem' }}>
                            Servis Danışman Ayakkabı {(printModalData.bundle_items && printModalData.bundle_items[6]?.part_no ? `(${printModalData.bundle_items[6].part_no})` : (printModalData.staff.shoe_part_no || (printModalData.staff.shoe_size && printModalData.staff.shoe_size.startsWith('PVW') ? `(${printModalData.staff.shoe_size})` : '')))}
                          </td>
                          <td style={{ borderBottom: '1px solid #eee', padding: '0.3rem', textAlign: 'right' }}>1</td>
                        </tr>
                      </tbody>
                    </table>

                    <div style={{ marginTop: '0.6rem', padding: '0.4rem 0.6rem', background: '#f5f5f5', border: '1px solid #000', display: 'flex', justifyContent: 'space-between', fontWeight: '900', fontSize: '0.9rem' }}>
                      <span>TOPLAM:</span>
                      <span>7 ADET ÜRÜN</span>
                    </div>

                    <div style={{ marginTop: '0.6rem', padding: '0.5rem', border: '1px solid #ccc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <BarcodePreviewCanvas barcode={printModalData.staff.box_barcode} template="QR" height={50} />
                      <div style={{ flex: 1, paddingLeft: '1rem' }}>
                        <BarcodePreviewCanvas barcode={printModalData.staff.box_barcode} template="CODE128" height={32} />
                        <div style={{ fontSize: '0.65rem', color: '#666', marginTop: '0.2rem', textAlign: 'center' }}>
                          DİJİTAL KOLİ DOĞRULAMA & BARKOD
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Bottom Actions Bar */}
        <div style={{
          padding: '1.2rem 1.8rem',
          background: isLight ? '#f8fafc' : 'rgba(30, 41, 59, 0.9)',
          borderTop: `1px solid ${isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.8rem'
        }}>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            {/* Fiş Yazdır Butonu */}
            <button
              onClick={() => handlePrintVoucher(person.id, 'RECEIPT')}
              disabled={isPrintingAction}
              style={{
                padding: '0.75rem 1.2rem',
                borderRadius: '0.8rem',
                border: 'none',
                background: '#2563eb',
                color: '#fff',
                fontWeight: '800',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)'
              }}
              title="A5 Üretim ve Sevk Fişini Sisteme İşle / Yazdır"
            >
              <span>🖨️</span>
              <span>Fiş Yazdır (A5)</span>
            </button>

            {/* 7 Parça Etiketini Bas Butonu */}
            <button
              onClick={() => handlePrintVoucher(person.id, 'LABELS')}
              disabled={isPrintingAction}
              style={{
                padding: '0.75rem 1.2rem',
                borderRadius: '0.8rem',
                border: 'none',
                background: '#10b981',
                color: '#fff',
                fontWeight: '800',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
              }}
              title={`7 Bireysel Kıyafet Etiketini SATO CL4NX Plus Termal Yazıcıya Gönder (${labelBarcodeType === 'QR' ? '2D QR Karekod' : '1D Çizgili Barkod'})`}
            >
              <span>🏷️</span>
              <span>7 Parça Etiketini Bas (SATO - {labelBarcodeType === 'QR' ? 'Karekod' : '1D'})</span>
            </button>

            {/* Koli Etiketi Bas Butonu */}
            <button
              onClick={() => handlePrintVoucher(person.id, 'BOX')}
              disabled={isPrintingAction}
              style={{
                padding: '0.75rem 1.2rem',
                borderRadius: '0.8rem',
                border: 'none',
                background: '#6366f1',
                color: '#fff',
                fontWeight: '800',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)'
              }}
              title="Dış Koli İçin Godex G530 Termal Yazıcıya Gönder"
            >
              <span>📦</span>
              <span>Koli Etiketi Bas (Godex)</span>
            </button>

            {/* Tarayıcı / PDF Yazdır Butonu */}
            <button
              onClick={() => {
                if (activePrintTab === 'BOX') {
                  printHtmlBlock('personnel-box-print-area', 'Godex Koli Etiketi');
                } else if (activePrintTab === 'LABELS') {
                  printHtmlBlock('personnel-labels-print-area', '7 Parça Kıyafet Etiketleri');
                } else {
                  printHtmlBlock('personnel-receipt-print-area', 'VOG Üretim & Sevk Fişi (A5)');
                }
              }}
              style={{
                padding: '0.75rem 1.1rem',
                borderRadius: '0.8rem',
                border: `1.5px solid ${isLight ? '#cbd5e1' : '#334155'}`,
                background: isLight ? '#ffffff' : '#1e293b',
                color: isLight ? '#0f172a' : '#f8fafc',
                fontWeight: '800',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
              }}
              title="Görüntülenen sekmeyi tarayıcı yazdırma ekranında aç veya PDF olarak kaydet"
            >
              <span>📄</span>
              <span>Tarayıcıdan Yazdır / PDF</span>
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
            {/* Hepsini Tek Tıkla Bas */}
            <button
              onClick={() => handlePrintVoucher(person.id, 'ALL')}
              disabled={isPrintingAction}
              style={{
                padding: '0.75rem 1.4rem',
                borderRadius: '0.8rem',
                border: 'none',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#ffffff',
                fontWeight: '900',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 15px rgba(245, 158, 11, 0.35)'
              }}
              title="Fiş + 7 Kıyafet Etiketi + Koli Etiketinin tamamını tek tıkla sisteme işle ve bas"
            >
              <span>🚀</span>
              <span>Hepsini Tek Tıkla Bas (Fiş + 7 Etiket + Koli)</span>
            </button>

            <button
              onClick={onClose}
              style={{
                padding: '0.75rem 1.2rem',
                borderRadius: '0.8rem',
                border: `1px solid ${isLight ? '#cbd5e1' : 'rgba(255,255,255,0.1)'}`,
                background: isLight ? '#ffffff' : 'rgba(255,255,255,0.05)',
                color: 'inherit',
                fontWeight: '800',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonnelLabelAndReceiptModal;
