import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import API_BASE_URL from '../services/apiConfig';
import OrderBoxPlanModal from '../components/OrderBoxPlanModal';
import PersonnelOrdersView from '../components/PersonnelOrdersView';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  } catch (e) {
    return dateStr;
  }
};

export const cleanModelDisplayName = (str) => {
  if (!str || typeof str !== 'string') return '---';
  return str
    .replace(/[\s\-_/]*(?:BAY\s*[\/&\-]\s*BAYAN|BAY\s+BAYAN|BAYAN\s*[\/&\-]\s*BAY|ERKEK\s*[\/&\-]\s*KADIN|ERKEK\s+VE\s+BAYAN|ERKEK\s+VE\s+KADIN|ERKEK\s+KADIN|KADIN\s*[\/&\-]\s*ERKEK|ERKEK\s*[\/&\-]\s*BAYAN|ERKEK\s+BAYAN|BAY\s*[\/&\-]\s*BAY)[\s\-_/]*/gi, ' ')
    .replace(/\s*\(\s*(?:BAY\s*[\/&\-]\s*BAYAN|BAYAN|BAY|ERKEK\s*MODEL[İIıi]?|BAY\s*MODEL[İIıi]?|BAYAN\s*MODEL[İIıi]?|ERKEK|KADIN|UNISEX)\s*\)\s*/gi, ' ')
    .replace(/\b(?:ERKEK|BAYAN|BAY|KADIN)\s*MODEL[İIıiA-Za-z]*\b/gi, ' ')
    .replace(/\b(?:ERKEKLER|KADINLAR|BAYANLAR|BAYANDA|ERKEKTE|KADINDA)\b/gi, ' ')
    .replace(/\b(?:BAYAN|BAY(?![iİıIeErR])|ERKEK|KADIN)\b/gi, ' ')
    .replace(/(?<=[A-ZÇĞİÖŞÜ])(?:BAYAN|BAY(?![iİıIeErR])|ERKEK|KADIN)\b/gi, '')
    .replace(/\b(?:BAYAN|BAY(?![iİıIeErR])|ERKEK|KADIN)(?=[A-ZÇĞİÖŞÜ])/gi, '')
    .replace(/\s+/g, ' ')
    .replace(/[\s\-_/\*]+$/g, '')
    .replace(/^[\s\-_/\*]+/g, '')
    .trim() || str.trim();
};

export const formatOrderDisplayParcaNo = (row) => {
  if (!row) return '---';
  let val = row.ParcaNo || row.Sku || row.sku || '';
  if (!val || /^(?:TEK\s*TEK|PAKET|KOL[Iİ]|PO[SŞ]ET|İSİM|ISIM)/i.test(String(val).trim())) {
    if (row.Detay5 && !/^(?:TEK\s*TEK|PAKET|KOL[Iİ]|PO[SŞ]ET|İSİM|ISIM)/i.test(String(row.Detay5).trim())) {
      val = row.Detay5;
    } else {
      val = row.Id ? `PVOG${row.Id}` : '---';
    }
  }
  return String(val).trim();
};

const SIZES_DEFAULT = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL', '6XL', '7XL', '8XL', '9XL'];

export const SIZE_TEXT_TO_NUM_MALE = {
  'XXS': '36',
  'XS': '38',
  'S': '40',
  'M': '42',
  'L': '44',
  'XL': '46',
  'XXL': '48',
  '2XL': '48',
  '3XL': '50',
  '4XL': '52',
  '5XL': '54',
  '6XL': '56',
  '7XL': '58',
  '8XL': '60',
  '9XL': '62'
};

export const SIZE_NUM_TO_TEXT_MALE = {
  '36': 'XXS',
  '38': 'XS',
  '40': 'S',
  '42': 'M',
  '44': 'L',
  '46': 'XL',
  '48': '2XL',
  '50': '3XL',
  '52': '4XL',
  '54': '5XL',
  '56': '6XL',
  '58': '7XL',
  '60': '8XL',
  '62': '9XL'
};

export const SIZE_TEXT_TO_NUM_FEMALE = {
  'XXS': '34',
  'XS': '36',
  'S': '38',
  'M': '40',
  'L': '42',
  'XL': '44',
  'XXL': '46',
  '2XL': '46',
  '3XL': '48',
  '4XL': '50',
  '5XL': '52',
  '6XL': '54',
  '7XL': '56',
  '8XL': '58',
  '9XL': '60'
};

export const SIZE_NUM_TO_TEXT_FEMALE = {
  '34': 'XXS',
  '36': 'XS',
  '38': 'S',
  '40': 'M',
  '42': 'L',
  '44': 'XL',
  '46': '2XL',
  '48': '3XL',
  '50': '4XL',
  '52': '5XL',
  '54': '6XL',
  '56': '7XL',
  '58': '8XL',
  '60': '9XL'
};

export const SIZE_TEXT_TO_NUM = SIZE_TEXT_TO_NUM_MALE;
export const SIZE_NUM_TO_TEXT = SIZE_NUM_TO_TEXT_MALE;

export const isAltBedenGarment = (productName = '', extraInfo = '', size = '') => {
  const combined = `${productName || ''} ${extraInfo || ''}`.toUpperCase();
  if (/\b(PANT(?:OLON)?|ŞORT|SORT|BERMUDA|ETEK|TAYT|ESOFMAN\s*ALTI|EŞOFMAN\s*ALTI|ALT\s*BEDEN|ALT\s*G[İI]Y[İI]M|SALOPET)\b/i.test(combined)) {
    return true;
  }
  if (/\bALT\b/i.test(combined) && !/\b(YALITIM|ALTERNATIF|ASIL|ALTIN)\b/i.test(combined)) {
    return true;
  }
  if (size && /^(?:3[4-9]|[45]\d|6[0-2])$/.test(String(size).trim())) {
    return true;
  }
  return false;
};

export const getSizeTextToNum = (gender, isAltBeden = false) => {
  const isFemalePants = Boolean(isAltBeden && ((gender || '').toUpperCase().includes('KADIN') || (gender || '').toUpperCase().includes('BAYAN')));
  return isFemalePants ? SIZE_TEXT_TO_NUM_FEMALE : SIZE_TEXT_TO_NUM_MALE;
};

export const getSizeNumToText = (gender, isAltBeden = false) => {
  const isFemalePants = Boolean(isAltBeden && ((gender || '').toUpperCase().includes('KADIN') || (gender || '').toUpperCase().includes('BAYAN')));
  return isFemalePants ? SIZE_NUM_TO_TEXT_FEMALE : SIZE_NUM_TO_TEXT_MALE;
};

export const getOrderHeaders = (order) => {
  if (order?.SizeHeaders && Array.isArray(order.SizeHeaders) && order.SizeHeaders.length > 0) {
    return order.SizeHeaders;
  }
  if (Array.isArray(order?.SizeMatrix) && order.SizeMatrix.length > 0) {
    const keys = Object.keys(order.SizeMatrix[0]).filter(k => 
      !['process', 'gender', 'total', 'note', 'SiparisId', 'Id', 'Cinsiyet', 'B01', 'B02', 'B03', 'B04', 'B05', 'B06', 'B07', 'B08', 'B09', 'B10', 'B11', 'B12', 'B13', 'B14'].includes(k)
    );
    if (keys.length > 0) return keys;
  }
  return SIZES_DEFAULT;
};

export const STANDARD_LETTER_SIZES = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL', '6XL', '7XL', '8XL', '9XL'];
export const STANDARD_NUMERIC_SIZES = ['34', '36', '38', '40', '42', '44', '46', '48', '50', '52', '54', '56', '58', '60'];

export const isNumericSizeOrder = (order) => {
  const headers = getOrderHeaders(order);
  const numericCount = headers.filter(h => /^\d{2}$/.test(String(h).trim())).length;
  if (numericCount >= 2) return true;
  return isAltBedenGarment(order?.Model || order?.product_name, order?.Grup || order?.grup);
};

export const getAllAvailableSizes = (order) => {
  const orderHeaders = getOrderHeaders(order);
  const isNum = isNumericSizeOrder(order);
  const standardList = isNum ? STANDARD_NUMERIC_SIZES : STANDARD_LETTER_SIZES;
  
  const combined = [...orderHeaders];
  standardList.forEach(s => {
    if (!combined.some(existing => existing.toUpperCase() === s.toUpperCase())) {
      combined.push(s);
    }
  });
  return combined;
};

export const getSizeMatrixForOrder = (order) => {
  if (!order) return [];
  if (Array.isArray(order.SizeMatrix) && order.SizeMatrix.length > 0) {
    return order.SizeMatrix;
  }

  const headers = getOrderHeaders(order);
  const total = Number(order.Adet || order.quantity || 30);
  const mIdx = Math.min(3, headers.length - 1);
  const lIdx = Math.min(4, headers.length - 1);
  const xlIdx = Math.min(5, headers.length - 1);
  
  const mKey = headers[mIdx] || 'M';
  const lKey = headers[lIdx] || 'L';
  const xlKey = headers[xlIdx] || 'XL';

  const mQty = Math.floor(total * 0.4);
  const lQty = Math.floor(total * 0.4);
  const xlQty = total - mQty - lQty;

  const makeRow = (process, gender, totalVal, isMale) => {
    const row = { process, gender, total: totalVal, note: '' };
    headers.forEach(h => { row[h] = 0; });
    if (isMale) {
      row[mKey] = mQty;
      row[lKey] = lQty;
      row[xlKey] = xlQty;
    }
    return row;
  };

  return [
    makeRow('PLANLAMA', 'Erkek', total, true),
    makeRow('PLANLAMA', 'Kadın', 0, false),
    makeRow('PLANLAMA', 'Çocuk', 0, false),
    makeRow('KESİM', 'Erkek', total, true),
    makeRow('KESİM', 'Kadın', 0, false),
    makeRow('KESİM', 'Çocuk', 0, false),
    makeRow('ÜTÜ PAKET', 'Erkek', total, true),
    makeRow('ÜTÜ PAKET', 'Kadın', 0, false),
    makeRow('ÜTÜ PAKET', 'Çocuk', 0, false)
  ];
};

export const ProductionMatrixTable = ({ matrix, headers, isLight, onSelectRowOrCell, selectedRow, selectedCell }) => {
  if (!matrix || matrix.length === 0) return null;

  const activeHeaders = (headers && Array.isArray(headers) && headers.length > 0)
    ? headers
    : (matrix[0]
        ? Object.keys(matrix[0]).filter(k => 
            !['process', 'gender', 'total', 'note', 'SiparisId', 'Id', 'Cinsiyet', 'B01', 'B02', 'B03', 'B04', 'B05', 'B06', 'B07', 'B08', 'B09', 'B10', 'B11', 'B12', 'B13', 'B14'].includes(k)
          )
        : SIZES_DEFAULT);

  return (
    <div style={{ overflowX: 'auto', border: `1px solid ${isLight ? '#cbd5e1' : '#334155'}`, borderRadius: '8px', background: isLight ? '#ffffff' : '#0f172a', marginBottom: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', textAlign: 'center', whiteSpace: 'nowrap', fontFamily: 'Segoe UI, Tahoma, sans-serif' }}>
        <thead>
          <tr style={{ background: isLight ? '#e2e8f0' : '#1e293b', color: isLight ? '#334155' : '#e2e8f0', borderBottom: `2px solid ${isLight ? '#cbd5e1' : '#334155'}`, fontWeight: '700' }}>
            <th style={{ padding: '0.45rem 0.6rem', textAlign: 'left', borderRight: `1px solid ${isLight ? '#cbd5e1' : '#334155'}`, minWidth: '85px' }}>İşlem</th>
            <th style={{ padding: '0.45rem 0.6rem', textAlign: 'left', borderRight: `1px solid ${isLight ? '#cbd5e1' : '#334155'}`, minWidth: '65px' }}>Cinsiyet</th>
            {activeHeaders.map(sz => (
              <th key={sz} style={{ padding: '0.45rem 0.35rem', minWidth: '34px', borderRight: `1px solid ${isLight ? '#cbd5e1' : '#334155'}` }}>{sz}</th>
            ))}
            <th style={{ padding: '0.45rem 0.6rem', fontWeight: '800', borderRight: `1px solid ${isLight ? '#cbd5e1' : '#334155'}`, background: isLight ? '#fef9c3' : '#363415', color: isLight ? '#854d0e' : '#fef08a' }}>Toplam</th>
            <th style={{ padding: '0.45rem 0.6rem', textAlign: 'left', minWidth: '60px' }}>Not</th>
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, rIdx) => {
            const isKesim = row.process === 'KESİM';
            const isSelected = selectedRow && selectedRow.process === row.process && selectedRow.gender === row.gender;
            
            let bg = rIdx % 2 === 0 ? (isLight ? '#ffffff' : '#0f172a') : (isLight ? '#f8fafc' : '#1e293b');
            if (isKesim) {
              bg = isLight ? '#fefce8' : '#1c1917';
            }
            if (isSelected) {
              bg = isLight ? '#dbeafe' : '#1e3a8a';
            }

            return (
              <tr 
                key={rIdx} 
                onClick={() => onSelectRowOrCell && onSelectRowOrCell(row, null, row.total, rIdx)}
                style={{ 
                  background: bg, 
                  cursor: onSelectRowOrCell ? 'pointer' : 'default', 
                  borderBottom: `1px solid ${isLight ? '#e2e8f0' : '#1e293b'}`,
                  transition: 'background 0.15s ease'
                }}
              >
                <td style={{ padding: '0.4rem 0.6rem', textAlign: 'left', fontWeight: '800', color: isKesim ? '#2563eb' : 'inherit', borderRight: `1px solid ${isLight ? '#f1f5f9' : '#1e293b'}` }}>
                  {isKesim ? '▶ KESİM' : row.process}
                </td>
                <td style={{ padding: '0.4rem 0.6rem', textAlign: 'left', fontWeight: '700', color: (String(row.gender || '').toUpperCase().includes('ERKEK') || String(row.gender || '').toUpperCase() === 'BAY') ? '#0284c7' : ((String(row.gender || '').toUpperCase().includes('KADIN') || String(row.gender || '').toUpperCase().includes('BAYAN')) ? '#ec4899' : '#8b5cf6'), borderRight: `1px solid ${isLight ? '#f1f5f9' : '#1e293b'}` }}>
                  {(String(row.gender || '').toUpperCase().includes('ERKEK') || String(row.gender || '').toUpperCase() === 'BAY') ? '👨 ERKEK' : ((String(row.gender || '').toUpperCase().includes('KADIN') || String(row.gender || '').toUpperCase().includes('BAYAN')) ? '👩 KADIN' : 'UNISEX')}
                </td>
                {activeHeaders.map(sz => {
                  const val = row[sz] || 0;
                  const isCellSelected = selectedCell && selectedCell.rIdx === rIdx && selectedCell.sz === sz;

                  return (
                    <td 
                      key={sz} 
                      onClick={(e) => {
                        if (val > 0 && onSelectRowOrCell) {
                          e.stopPropagation();
                          onSelectRowOrCell(row, sz, val, rIdx);
                        }
                      }}
                      style={{ 
                        padding: '0.4rem 0.2rem', 
                        fontWeight: val > 0 ? '900' : '400', 
                        fontSize: val > 0 ? '0.82rem' : '0.72rem',
                        color: isCellSelected ? '#ffffff' : (val > 0 ? (isKesim ? '#059669' : '#2563eb') : '#94a3b8'),
                        background: isCellSelected ? '#10b981' : (val > 0 ? (isLight ? '#dcfce7' : '#064e3b') : 'transparent'),
                        borderRight: `1px solid ${isLight ? '#f1f5f9' : '#1e293b'}`
                      }}
                    >
                      {val || 0}
                    </td>
                  );
                })}
                <td style={{ padding: '0.4rem 0.6rem', fontWeight: '900', fontSize: '0.85rem', color: isKesim ? '#059669' : '#2563eb', borderRight: `1px solid ${isLight ? '#f1f5f9' : '#1e293b'}`, background: isLight ? '#fef08a' : '#363415' }}>
                  {row.total || 0}
                </td>
                <td style={{ padding: '0.4rem 0.6rem', textAlign: 'left', color: '#64748b', fontSize: '0.72rem' }}>
                  {row.note || ''}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export const calculateOrderSizeBreakdown = (order, summary, filterGender = null, includeAllHeaders = false) => {
  const allHeaders = includeAllHeaders ? getAllAvailableSizes(order) : getOrderHeaders(order);
  const sizeTotals = {};
  allHeaders.forEach(s => sizeTotals[s] = 0);

  const normGender = filterGender 
    ? (['KADIN', 'BAYAN'].includes(String(filterGender).toUpperCase()) ? 'KADIN' : 
       (['ÇOCUK', 'COCUK'].includes(String(filterGender).toUpperCase()) ? 'ÇOCUK' : 'ERKEK'))
    : null;

  if (Array.isArray(order?.SizeMatrix) && order.SizeMatrix.length > 0) {
    const kesimRows = order.SizeMatrix.filter(r => r.process === 'KESİM');
    const baseRows = kesimRows.length > 0 ? kesimRows : order.SizeMatrix;
    
    // If filterGender is requested, filter rows by gender
    const targetRows = normGender 
      ? baseRows.filter(r => {
          const rG = String(r.gender || '').toUpperCase();
          if (normGender === 'KADIN') return rG.includes('KADIN') || rG.includes('BAYAN') || rG === '1';
          if (normGender === 'ÇOCUK') return rG.includes('ÇOCUK') || rG.includes('COCUK') || rG === '2';
          return rG.includes('ERKEK') || rG.includes('BAY') || rG === '0';
        })
      : baseRows;

    targetRows.forEach(row => {
      allHeaders.forEach(s => {
        if (row[s]) sizeTotals[s] += parseInt(row[s]) || 0;
      });
    });
  } else if (order?.BedenAdi) {
    const sClean = order.BedenAdi.replace(/beden/gi, '').trim().toUpperCase();
    if (allHeaders.includes(sClean)) {
      sizeTotals[sClean] = parseInt(order.Adet || order.quantity || 0);
    }
  }

  const processedBySize = summary?.processed_by_size || {};
  const processedByGender = (normGender && summary?.processed_by_gender_and_size?.[normGender]) || null;
  const activeSizes = [];

  allHeaders.forEach(sz => {
    const orderQty = sizeTotals[sz] || 0;
    const processedQty = processedByGender ? (processedByGender[sz] || 0) : (processedBySize[sz] || 0);
    const remainingQty = Math.max(0, orderQty - processedQty);

    if (includeAllHeaders || orderQty > 0 || processedQty > 0) {
      activeSizes.push({
        size: sz,
        orderQty,
        processedQty,
        remainingQty,
        gender: normGender || 'ERKEK',
        notInOrder: orderQty === 0
      });
    }
  });

  if (activeSizes.length === 0 && !normGender) {
    const fallbackQty = parseInt(order?.Adet || order?.quantity || 30);
    const mIdx = Math.min(3, allHeaders.length - 1);
    const lIdx = Math.min(4, allHeaders.length - 1);
    const xlIdx = Math.min(5, allHeaders.length - 1);

    const mKey = allHeaders[mIdx] || 'M';
    const lKey = allHeaders[lIdx] || 'L';
    const xlKey = allHeaders[xlIdx] || 'XL';

    const mQty = Math.floor(fallbackQty * 0.4);
    const lQty = Math.floor(fallbackQty * 0.4);
    const xlQty = fallbackQty - mQty - lQty;
    
    activeSizes.push(
      { size: mKey, orderQty: mQty, processedQty: processedBySize[mKey] || 0, remainingQty: Math.max(0, mQty - (processedBySize[mKey] || 0)), gender: 'ERKEK' },
      { size: lKey, orderQty: lQty, processedQty: processedBySize[lKey] || 0, remainingQty: Math.max(0, lQty - (processedBySize[lKey] || 0)), gender: 'ERKEK' },
      { size: xlKey, orderQty: xlQty, processedQty: processedBySize[xlKey] || 0, remainingQty: Math.max(0, xlQty - (processedBySize[xlKey] || 0)), gender: 'ERKEK' }
    );
  }

  return activeSizes;
};

const OrdersPage = () => {
  const navigate = useNavigate();
  const { themeMode } = useLanguage();

  // Mode Selection: 'ORDERS' (ERP Toptan) | 'PERSONNEL' (Volkswagen Bayi Danışmanları)
  const [activeMainTab, setActiveMainTab] = useState(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      return p.get('tab') === 'personnel' ? 'PERSONNEL' : 'ORDERS';
    } catch (e) {
      return 'ORDERS';
    }
  });

  const handleSwitchMainTab = (newTab) => {
    setActiveMainTab(newTab);
    const targetUrl = newTab === 'PERSONNEL' ? '?tab=personnel' : '/admin/orders';
    window.history.replaceState(null, '', targetUrl);
  };
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalFilteredCount, setTotalFilteredCount] = useState(0);
  const [totalQuantitySum, setTotalQuantitySum] = useState(0);
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0, accounted: 0, totalQuantity: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [dataSource, setDataSource] = useState('');
  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL', 'PENDING', 'COMPLETED', 'ACCOUNTED'
  const [selectedBoxPlanOrder, setSelectedBoxPlanOrder] = useState(null);

  // Voucher / Label Generation State
  const [voucherSummaries, setVoucherSummaries] = useState({});
  const [selectedVoucherOrder, setSelectedVoucherOrder] = useState(null);
  const [printMode, setPrintMode] = useState('FULL'); // 'FULL' or 'PARTIAL'
  const [quantityInput, setQuantityInput] = useState('');
  const [selectedGender, setSelectedGender] = useState('Bay');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedProcess, setSelectedProcess] = useState('KESİM');
  const [boxNo, setBoxNo] = useState(1);
  const [totalBoxes, setTotalBoxes] = useState(1);
  const [locationName, setLocationName] = useState('Ana Depo Tesellüm');
  const [rfidLabelTemplate, setRfidLabelTemplate] = useState('QR'); // 'QR' or 'CLASSIC_1D'
  const [submittingVoucher, setSubmittingVoucher] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);
  
  // Real-time Size Matrix & Voucher Transfer History State
  const [sizeTransferInputs, setSizeTransferInputs] = useState({});
  const [orderVouchersHistory, setOrderVouchersHistory] = useState([]);
  const [showAllSizes, setShowAllSizes] = useState(false);
  const [customAddedSizes, setCustomAddedSizes] = useState([]);
  const [newCustomSizeInput, setNewCustomSizeInput] = useState('');

  const isLight = themeMode === 'light';

  useEffect(() => {
    // Instant Stale-While-Revalidate Render from SessionStorage (0 ms)
    try {
      const saved = sessionStorage.getItem('vog_admin_orders_cache_v9');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.orders) && parsed.orders.length > 0) {
          setOrders(parsed.orders);
          setStats(parsed.stats || { total: parsed.orders.length, pending: 0, completed: 0, accounted: 0, totalQuantity: 0 });
          setVoucherSummaries(parsed.voucherSummaries || {});
          setTotalFilteredCount(parsed.totalCount || parsed.orders.length);
          setLoading(false);
        }
      }
    } catch (e) { }

    fetchMssqlOrders(statusFilter, 1, false, searchTerm);
  }, []);

  // Debounced search trigger across 16,000+ orders
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMssqlOrders(statusFilter, 1, false, searchTerm);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchMssqlOrders = async (tab = statusFilter, page = 1, append = false, search = searchTerm, forceRefresh = false) => {
    if (!append) {
      if (orders.length === 0) setLoading(true);
      else setIsRefreshing(true);
    } else {
      setFetchingMore(true);
    }

    try {
      const params = new URLSearchParams({
        tab: tab || 'ALL',
        page: String(page || 1),
        limit: '100'
      });
      if (search && search.trim()) {
        params.set('search', search.trim());
      }
      if (forceRefresh) {
        params.set('refresh', 'true');
      }

      const res = await fetch(`${API_BASE_URL}/api/orders/mssql-list?${params.toString()}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.data)) {
        if (append) {
          setOrders(prev => {
            const existingIds = new Set(prev.map(p => p.Id));
            const newItems = data.data.filter(d => !existingIds.has(d.Id));
            return [...prev, ...newItems];
          });
        } else {
          setOrders(data.data);
          if (data.data.length > 0 && !selectedRowId) {
            setSelectedRowId(data.data[0].Id);
          }
        }

        if (data.stats) {
          setStats(data.stats);
        }
        if (data.voucherSummaries) {
          setVoucherSummaries(prev => ({ ...prev, ...data.voucherSummaries }));
        }

        setTotalFilteredCount(data.filteredTotal !== undefined ? data.filteredTotal : data.total || 0);
        setTotalQuantitySum(data.filteredTotalQuantity !== undefined ? data.filteredTotalQuantity : 0);
        setHasMore(!!data.hasMore);
        setCurrentPage(page);
        setDataSource(data.source === 'mssql' ? 'Canlı SQL Server (SIPARIS)' : 'Önizleme Veritabanı (SQL Server)');

        // Save fast snapshot to sessionStorage for instant next visit
        if (page === 1 && !search && tab === 'ALL') {
          try {
            sessionStorage.setItem('vog_admin_orders_cache_v9', JSON.stringify({
              orders: data.data,
              stats: data.stats,
              voucherSummaries: data.voucherSummaries,
              totalCount: data.filteredTotal || data.total
            }));
          } catch (e) { }
        }
      }
    } catch (err) {
      console.error('Error fetching MSSQL orders:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      setFetchingMore(false);
    }
  };

  const handleTabChange = (newTab) => {
    setStatusFilter(newTab);
    setCurrentPage(1);
    fetchMssqlOrders(newTab, 1, false, searchTerm);
  };

  const handleLoadMore = () => {
    if (fetchingMore || !hasMore) return;
    const nextPage = currentPage + 1;
    fetchMssqlOrders(statusFilter, nextPage, true, searchTerm);
  };

  const fetchVoucherSummaries = async (orderIds) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/vouchers/summary-by-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_ids: orderIds, all: true })
      });
      const data = await res.json();
      if (data.success && data.summaries) {
        setVoucherSummaries(prev => ({ ...prev, ...data.summaries }));
      }
    } catch (err) {
      console.error('Error fetching voucher summaries:', err);
    }
  };

  const fetchOrderVouchersHistory = async (orderId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/vouchers/order-history/${orderId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.vouchers)) {
        setOrderVouchersHistory(data.vouchers);
      }
    } catch (err) {
      console.error('Error fetching order vouchers history:', err);
    }
  };

  const handleToggleMuhasebe = async (orderId, currentVal, e) => {
    e.stopPropagation();
    const newVal = !currentVal;
    
    setOrders(prev => prev.map(o => o.Id === orderId ? { ...o, Muhasebelesti: newVal } : o));

    try {
      await fetch(`${API_BASE_URL}/api/orders/update-accounting`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, muhasebelesti: newVal })
      });
    } catch (err) {
      console.error('Muhasebe güncelleme hatası:', err);
    }
  };

  const openVoucherModal = (order, e) => {
    if (e) e.stopPropagation();
    setSelectedVoucherOrder(order);
    setPrintMode('FULL');
    setQuantityInput('');
    setSelectedGender('Erkek');
    setSelectedSize(order.BedenAdi || '');
    setSelectedProcess(order.IslemId || 'ÜTÜ PAKET');
    setBoxNo(1);
    setTotalBoxes(1);
    setFeedbackMsg(null);
    setSizeTransferInputs({});
    setShowAllSizes(false);
    setCustomAddedSizes([]);
    setNewCustomSizeInput('');
    fetchOrderVouchersHistory(order.Id);
  };

  const handleAddCustomSize = () => {
    const trimmed = (newCustomSizeInput || '').trim().toUpperCase();
    if (!trimmed) return;
    if (!customAddedSizes.includes(trimmed)) {
      setCustomAddedSizes(prev => [...prev, trimmed]);
    }
    setNewCustomSizeInput('');
  };

  const handleDeleteOrder = async (orderId, event, isLogoBilled = false, logoInvoiceNo = '') => {
    if (event) event.stopPropagation();

    if (isLogoBilled) {
      const invText = logoInvoiceNo ? ` (Fatura No: ${logoInvoiceNo})` : '';
      alert(`⚠️ İŞLEM ENGELENDİ: #${orderId} numaralı siparişe ait irsaliye LOGO ERP'de faturalaştırılmıştır${invText}.\n\nFaturalanmış irsaliye ve siparişler VOG sisteminde silinemez veya değiştirilemez. Değişiklik yapmak için önce LOGO'da faturanın iptal edilmesi gerekmektedir.`);
      return;
    }

    if (!window.confirm(`#${orderId} Numaralı siparişi ve LOGO İrsaliyesini silmek istediğinize emin misiniz?`)) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        alert(`🎉 #${orderId} numaralı sipariş ve LOGO İrsaliyesi silindi.`);
        setOrders(prev => prev.filter(o => o.Id !== orderId));
        fetchMssqlOrders(statusFilter, 1, false, searchTerm, true);
      } else {
        alert(`❌ ${data.message || 'Silme İşlemi Engellendi'}`);
      }
    } catch (err) {
      alert(`❌ Bağlantı Hatası: ${err.message}`);
    }
  };


  const handleFillAllRemainingSizes = (activeSizes) => {
    const inputs = {};
    activeSizes.forEach(item => {
      inputs[item.size] = item.remainingQty;
    });
    setSizeTransferInputs(inputs);
  };

  const handleCreateVoucher = async () => {
    if (!selectedVoucherOrder) return;
    
    if (selectedVoucherOrder.LogoBilled) {
      const invText = selectedVoucherOrder.LogoInvoiceNo ? ` (Fatura No: ${selectedVoucherOrder.LogoInvoiceNo})` : '';
      setFeedbackMsg({
        type: 'error',
        text: `⚠️ İŞLEM ENGELENDİ: #${selectedVoucherOrder.Id} numaralı sipariş LOGO ERP'de faturalaştırılmıştır${invText}. Faturalanmış siparişler üzerinde etiket basımı ve irsaliye güncellemesi yapılamaz!`
      });
      return;
    }

    const summary = voucherSummaries[selectedVoucherOrder.Id] || { processed_quantity: 0, total_quantity: 0, status: 'BEKLİYOR' };
    const totalOrderQty = selectedVoucherOrder.Adet || selectedVoucherOrder.quantity || 100;
    let activeSizes = calculateOrderSizeBreakdown(selectedVoucherOrder, summary, null, showAllSizes);
    if (customAddedSizes.length > 0) {
      const existingSet = new Set(activeSizes.map(it => it.size.toUpperCase()));
      customAddedSizes.forEach(cSz => {
        const up = cSz.trim().toUpperCase();
        if (up && !existingSet.has(up)) {
          activeSizes.push({
            size: up,
            orderQty: 0,
            processedQty: 0,
            remainingQty: 0,
            gender: selectedGender || 'Erkek',
            notInOrder: true
          });
        }
      });
    }

    let sizeItemsToSubmit = [];

    if (printMode === 'FULL') {
      sizeItemsToSubmit = activeSizes.map(item => ({
        size: item.size,
        quantity: item.remainingQty,
        gender: selectedGender || 'Erkek'
      })).filter(item => item.quantity > 0);
    } else {
      // 1. Check size matrix table inputs (including custom/unlisted sizes)
      const activeMap = new Map(activeSizes.map(item => [item.size, item]));
      sizeItemsToSubmit = [];
      Object.entries(sizeTransferInputs).forEach(([sz, val]) => {
        const q = parseInt(val) || 0;
        if (q > 0) {
          const item = activeMap.get(sz);
          sizeItemsToSubmit.push({
            size: sz,
            quantity: q,
            gender: (item && item.gender) || selectedGender || 'Erkek'
          });
        }
      });

      // 2. If matrix inputs are empty, use single selected size & quantity input field
      if (sizeItemsToSubmit.length === 0) {
        const qtyVal = parseInt(quantityInput);
        if (qtyVal > 0) {
          const rawSz = (selectedSize || selectedVoucherOrder.BedenAdi || 'XL').replace(/^BEDEN\s*/i, '').trim() || 'XL';
          sizeItemsToSubmit = [{
            size: rawSz,
            quantity: qtyVal,
            gender: selectedGender || 'Bay'
          }];
        }
      }
    }

    const totalBatchQty = sizeItemsToSubmit.reduce((sum, item) => sum + item.quantity, 0);

    if (totalBatchQty <= 0) {
      setFeedbackMsg({ type: 'error', text: 'Lütfen aktarılacak bedenler için en az 1 adet miktar giriniz veya "Kalan Tüm Bedenleri Aktar" seçeneğini kullanınız.' });
      return;
    }

    setSubmittingVoucher(true);
    setFeedbackMsg(null);

    try {
      const rawSkuCandidate = selectedVoucherOrder.ParcaNo || selectedVoucherOrder.Code39 || selectedVoucherOrder.Sku || selectedVoucherOrder.sku || selectedVoucherOrder.code39 || selectedVoucherOrder.Detay1 || selectedVoucherOrder.Not || '';
      const cleanOrderSku = rawSkuCandidate || `PVOG${selectedVoucherOrder.Id}`;
      
      // Gerçek 869/868 ile başlayan 13 haneli EAN-13 barkodu önceliklendir (AUTO- veya geçersiz metinleri eler)
      const actualBarcode = 
        (selectedVoucherOrder.Ean13 && /^\d{8,14}$/.test(String(selectedVoucherOrder.Ean13).trim()) ? String(selectedVoucherOrder.Ean13).trim() : null) ||
        (selectedVoucherOrder.ean13 && /^\d{8,14}$/.test(String(selectedVoucherOrder.ean13).trim()) ? String(selectedVoucherOrder.ean13).trim() : null) ||
        (selectedVoucherOrder.Detay2 && /^\d{8,14}$/.test(String(selectedVoucherOrder.Detay2).trim()) ? String(selectedVoucherOrder.Detay2).trim() : null) ||
        (selectedVoucherOrder.Barcode && /^\d{8,14}$/.test(String(selectedVoucherOrder.Barcode).trim()) ? String(selectedVoucherOrder.Barcode).trim() : null) ||
        (selectedVoucherOrder.barcode && /^\d{8,14}$/.test(String(selectedVoucherOrder.barcode).trim()) ? String(selectedVoucherOrder.barcode).trim() : null) ||
        '';

      const payload = {
        order_id: selectedVoucherOrder.Id || selectedVoucherOrder.id || selectedVoucherOrder.order_number,
        total_quantity: totalOrderQty,
        quantity: totalBatchQty,
        items: sizeItemsToSubmit,
        sub_customer_name: selectedVoucherOrder.MusteriAdi || selectedVoucherOrder.sub_customer_name || '',
        staff_name: selectedVoucherOrder.PersonelId || selectedVoucherOrder.staff_name || '',
        product_name: selectedVoucherOrder.Model || selectedVoucherOrder.product_name || '',
        size: selectedSize || selectedVoucherOrder.BedenAdi || 'BEDEN (XXS-9XL)',
        gender: selectedGender || 'Erkek',
        brand: selectedVoucherOrder.Marka || selectedVoucherOrder.brand || 'GENEL',
        sku: cleanOrderSku,
        code39: cleanOrderSku,
        barcode: actualBarcode || cleanOrderSku,
        ean13: actualBarcode || cleanOrderSku,
        detail1: `${cleanOrderSku} - ${selectedVoucherOrder.Model || selectedVoucherOrder.product_name || ''}`,
        detail2: selectedVoucherOrder.MusteriAdi || selectedVoucherOrder.sub_customer_name || '',
        box_no: boxNo,
        total_boxes: totalBoxes,
        location: locationName || 'Ana Depo Tesellüm'
      };

      const res = await fetch(`${API_BASE_URL}/api/vouchers/create-from-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        setFeedbackMsg({ type: 'success', text: `🎉 ${data.message}` });
        if (data.summary) {
          setVoucherSummaries(prev => ({
            ...prev,
            [selectedVoucherOrder.Id]: data.summary
          }));
        }
        fetchOrderVouchersHistory(selectedVoucherOrder.Id);
        setSizeTransferInputs({});
      } else {
        setFeedbackMsg({ type: 'error', text: data.message || 'Fiş oluşturulurken bir hata meydana geldi.' });
      }
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: `Hata: ${err.message}` });
    } finally {
      setSubmittingVoucher(false);
    }
  };

  const handlePrintSatoRfidLabels = async () => {

    if (!selectedVoucherOrder) return;
    
    const summary = voucherSummaries[selectedVoucherOrder.Id] || { processed_quantity: 0 };
    const totalOrderQty = selectedVoucherOrder.Adet || selectedVoucherOrder.quantity || 100;
    let activeSizes = calculateOrderSizeBreakdown(selectedVoucherOrder, summary, null, showAllSizes);
    if (customAddedSizes.length > 0) {
      const existingSet = new Set(activeSizes.map(it => it.size.toUpperCase()));
      customAddedSizes.forEach(cSz => {
        const up = cSz.trim().toUpperCase();
        if (up && !existingSet.has(up)) {
          activeSizes.push({
            size: up,
            orderQty: 0,
            processedQty: 0,
            remainingQty: 0,
            gender: selectedGender || 'Erkek',
            notInOrder: true
          });
        }
      });
    }

    let sizeItemsToSubmit = [];
    if (printMode === 'FULL') {
      sizeItemsToSubmit = activeSizes.map(item => ({
        size: item.size,
        quantity: item.remainingQty,
        gender: selectedGender || 'Erkek'
      })).filter(item => item.quantity > 0);
    } else {
      const activeMap = new Map(activeSizes.map(item => [item.size, item]));
      sizeItemsToSubmit = [];
      Object.entries(sizeTransferInputs).forEach(([sz, val]) => {
        const q = parseInt(val) || 0;
        if (q > 0) {
          const item = activeMap.get(sz);
          sizeItemsToSubmit.push({
            size: sz,
            quantity: q,
            gender: (item && item.gender) || selectedGender || 'Erkek'
          });
        }
      });

      if (sizeItemsToSubmit.length === 0) {
        const qtyVal = parseInt(quantityInput);
        if (qtyVal > 0) {
          const rawSz = (selectedSize || selectedVoucherOrder.BedenAdi || 'XL').replace(/^BEDEN\s*/i, '').trim() || 'XL';
          sizeItemsToSubmit = [{
            size: rawSz,
            quantity: qtyVal,
            gender: selectedGender || 'Erkek'
          }];
        }
      }
    }

    const totalBatchQty = sizeItemsToSubmit.reduce((sum, item) => sum + item.quantity, 0);
    if (totalBatchQty <= 0) {
      setFeedbackMsg({ type: 'error', text: 'Lütfen basılacak etiketler için en az 1 adet miktar giriniz.' });
      return;
    }

    setSubmittingVoucher(true);
    setFeedbackMsg({ type: 'info', text: `⏳ SATO CL4NX Plus yazıcıya ${totalBatchQty} adet RFID etiket ve EPC kodlama emri gönderiliyor...` });

    try {
      const rawSkuCandidate = selectedVoucherOrder.ParcaNo || selectedVoucherOrder.Code39 || selectedVoucherOrder.Sku || selectedVoucherOrder.sku || selectedVoucherOrder.code39 || selectedVoucherOrder.Detay1 || selectedVoucherOrder.Not || '';
      const cleanOrderSku = rawSkuCandidate || `PVOG${selectedVoucherOrder.Id}`;
      
      // Gerçek 869/868 ile başlayan 13 haneli EAN-13 barkodu önceliklendir (AUTO- veya geçersiz metinleri eler)
      const actualBarcode = 
        (selectedVoucherOrder.Ean13 && /^\d{8,14}$/.test(String(selectedVoucherOrder.Ean13).trim()) ? String(selectedVoucherOrder.Ean13).trim() : null) ||
        (selectedVoucherOrder.ean13 && /^\d{8,14}$/.test(String(selectedVoucherOrder.ean13).trim()) ? String(selectedVoucherOrder.ean13).trim() : null) ||
        (selectedVoucherOrder.Detay2 && /^\d{8,14}$/.test(String(selectedVoucherOrder.Detay2).trim()) ? String(selectedVoucherOrder.Detay2).trim() : null) ||
        (selectedVoucherOrder.Barcode && /^\d{8,14}$/.test(String(selectedVoucherOrder.Barcode).trim()) ? String(selectedVoucherOrder.Barcode).trim() : null) ||
        (selectedVoucherOrder.barcode && /^\d{8,14}$/.test(String(selectedVoucherOrder.barcode).trim()) ? String(selectedVoucherOrder.barcode).trim() : null) ||
        '';

      const payload = {
        order_id: selectedVoucherOrder.Id || selectedVoucherOrder.id || selectedVoucherOrder.order_number,
        items: sizeItemsToSubmit,
        product_name: selectedVoucherOrder.Model || selectedVoucherOrder.product_name || '',
        sku: cleanOrderSku,
        brand: selectedVoucherOrder.Marka || selectedVoucherOrder.brand || 'GENEL',
        gender: selectedGender || 'Erkek',
        detail1: `${cleanOrderSku} - ${selectedVoucherOrder.Model || selectedVoucherOrder.product_name || ''}`,
        detail2: selectedVoucherOrder.MusteriAdi || selectedVoucherOrder.sub_customer_name || '',
        barcode: actualBarcode || cleanOrderSku,
        total_boxes: totalBoxes,
        box_no: boxNo,
        label_template: rfidLabelTemplate
      };


      const res = await fetch(`${API_BASE_URL}/api/printer/print-order-rfid-labels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        setFeedbackMsg({ type: 'success', text: `✅ ${data.message}` });
        if (data.summary) {
          setVoucherSummaries(prev => ({
            ...prev,
            [selectedVoucherOrder.Id]: data.summary
          }));
        } else {
          fetchVoucherSummaries([selectedVoucherOrder.Id]);
        }
        fetchOrderVouchersHistory(selectedVoucherOrder.Id);
        setSizeTransferInputs({});
      } else {
        setFeedbackMsg({ type: 'error', text: data.error || data.message || 'Yazıcıya gönderilirken bir hata oluştu.' });
      }
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: `Yazıcı Hatası: ${err.message}` });
    } finally {
      setSubmittingVoucher(false);
    }
  };

  const handlePrintGodexBoxLabel = async () => {
    if (!selectedVoucherOrder) return;
    
    setSubmittingVoucher(true);
    setFeedbackMsg({ type: 'info', text: '⏳ Godex G530 yazıcıya koli etiketi gönderiliyor...' });

    try {
      const actualBarcode = 
        (selectedVoucherOrder.Ean13 && /^\d{8,14}$/.test(String(selectedVoucherOrder.Ean13).trim()) ? String(selectedVoucherOrder.Ean13).trim() : null) ||
        (selectedVoucherOrder.ean13 && /^\d{8,14}$/.test(String(selectedVoucherOrder.ean13).trim()) ? String(selectedVoucherOrder.ean13).trim() : null) ||
        (selectedVoucherOrder.Detay2 && /^\d{8,14}$/.test(String(selectedVoucherOrder.Detay2).trim()) ? String(selectedVoucherOrder.Detay2).trim() : null) ||
        (selectedVoucherOrder.Barcode && /^\d{8,14}$/.test(String(selectedVoucherOrder.Barcode).trim()) ? String(selectedVoucherOrder.Barcode).trim() : null) ||
        (selectedVoucherOrder.barcode && /^\d{8,14}$/.test(String(selectedVoucherOrder.barcode).trim()) ? String(selectedVoucherOrder.barcode).trim() : null) ||
        '';

      const payload = {
        order_id: selectedVoucherOrder.Id,
        customer_name: selectedVoucherOrder.MusteriAdi || 'MUSTERI',
        product_name: selectedVoucherOrder.Model || 'URUN ADI',
        sku: selectedVoucherOrder.Sku || `PVOG${selectedVoucherOrder.Id}`,
        brand: selectedVoucherOrder.Marka || selectedVoucherOrder.brand || 'GENEL',
        barcode: actualBarcode,
        box_no: boxNo,
        total_boxes: totalBoxes,
        total_quantity: activeSizes.reduce((sum, item) => sum + (parseInt(sizeTransferInputs[item.size]) || item.remainingQty || 0), 0),
        items: activeSizes.map(it => ({ size: it.size, quantity: parseInt(sizeTransferInputs[it.size]) || it.remainingQty || 0 }))
      };

      const res = await fetch(`${API_BASE_URL}/api/printer/print-box-label`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        setFeedbackMsg({ type: 'success', text: `✅ GODEX BAŞARILI: ${data.message}` });
      } else {
        setFeedbackMsg({ type: 'error', text: data.error || 'Godex yazıcıya gönderilemedi.' });
      }
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: `Godex Hatası: ${err.message}` });
    } finally {
      setSubmittingVoucher(false);
    }
  };

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: isLight ? '#f4f6f9' : '#0b0f19', color: isLight ? '#1e293b' : '#f8fafc', padding: '1.5rem 2rem 4rem', fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif' }}>
      
      {/* Top Header Navigation Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <button 
              onClick={() => navigate('/admin')}
              style={{ 
                background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', color: '#3b82f6', 
                padding: '0.5rem 1.2rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '700',
                display: 'flex', alignItems: 'center', gap: '0.5rem'
              }}
            >
              ← ANA PANEL
            </button>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              {activeMainTab === 'ORDERS' 
                ? `TÜM SİPARİŞLER (${(stats.total || totalFilteredCount || orders.length).toLocaleString('tr-TR')} Kayıt)`
                : 'VOLKSWAGEN DANIŞMAN ETİKET MERKEZİ'}
              {activeMainTab === 'ORDERS' && isRefreshing && (
                <span style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(59,130,246,0.1)', padding: '0.2rem 0.6rem', borderRadius: '20px' }}>
                  <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>🔄</span> Canlı Güncelleniyor...
                </span>
              )}
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: '0.9rem', color: isLight ? '#64748b' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: activeMainTab === 'ORDERS' ? '#10b981' : '#3b82f6' }}></span>
            Veri Kaynağı: <strong>{activeMainTab === 'ORDERS' ? (dataSource || 'SQL Server (SIPARIS.dbo.Siparisler)') : 'PostgreSQL (personnel & sorter_mappings)'}</strong>
          </p>
        </div>

        {activeMainTab === 'ORDERS' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ position: 'relative', width: '320px' }}>
              <span style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.6, fontSize: '0.9rem' }}>🔍</span>
              <input 
                type="text" 
                placeholder="Id, Müşteri, Model veya Personel Ara..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ 
                  width: '100%', padding: '0.65rem 1rem 0.65rem 2.5rem', borderRadius: '8px', 
                  background: isLight ? '#ffffff' : '#1e293b', border: `1px solid ${isLight ? '#cbd5e1' : '#334155'}`, 
                  color: 'inherit', outline: 'none', fontSize: '0.9rem'
                }}
              />
            </div>

            <button 
              onClick={() => fetchMssqlOrders(statusFilter, 1, false, searchTerm, true)} 
              disabled={isRefreshing}
              style={{
                background: isRefreshing ? '#64748b' : '#2563eb', color: '#ffffff', padding: '0.65rem 1.4rem', borderRadius: '8px',
                fontWeight: '700', fontSize: '0.85rem', border: 'none', cursor: isRefreshing ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                boxShadow: '0 4px 12px rgba(37,99,235,0.2)'
              }}
            >
              🔄 {isRefreshing ? 'GÜNCELLENİYOR...' : 'YENİLE'}
            </button>
          </div>
        )}
      </div>

      {/* TOP LEVEL MODE SELECTOR: Sipariş Bazlı vs Personel Bazlı */}
      <div style={{
        display: 'flex',
        gap: '0.8rem',
        marginBottom: '1.5rem',
        paddingBottom: '0.8rem',
        borderBottom: `2px solid ${isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)'}`
      }}>
        <button
          type="button"
          onClick={() => handleSwitchMainTab('ORDERS')}
          style={{
            padding: '0.8rem 1.6rem',
            borderRadius: '10px',
            border: `2px solid ${activeMainTab === 'ORDERS' ? '#2563eb' : (isLight ? '#cbd5e1' : '#334155')}`,
            background: activeMainTab === 'ORDERS'
              ? (isLight ? '#2563eb' : '#1d4ed8')
              : (isLight ? '#ffffff' : '#1e293b'),
            color: activeMainTab === 'ORDERS' ? '#ffffff' : (isLight ? '#475569' : '#cbd5e1'),
            fontWeight: '800',
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem',
            boxShadow: activeMainTab === 'ORDERS' ? '0 4px 16px rgba(37, 99, 235, 0.35)' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          <span>📦</span>
          <span>SİPARİŞ BAZLI ETİKET & FİŞ (ERP TOPTAN)</span>
          <span style={{
            padding: '0.15rem 0.55rem',
            borderRadius: '12px',
            fontSize: '0.74rem',
            background: activeMainTab === 'ORDERS' ? 'rgba(255,255,255,0.25)' : (isLight ? '#e2e8f0' : '#334155'),
            color: activeMainTab === 'ORDERS' ? '#ffffff' : (isLight ? '#475569' : '#cbd5e1'),
            fontWeight: '900'
          }}>
            {(stats.total || totalFilteredCount || orders.length).toLocaleString('tr-TR')}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleSwitchMainTab('PERSONNEL')}
          style={{
            padding: '0.8rem 1.6rem',
            borderRadius: '10px',
            border: `2px solid ${activeMainTab === 'PERSONNEL' ? '#10b981' : (isLight ? '#cbd5e1' : '#334155')}`,
            background: activeMainTab === 'PERSONNEL'
              ? (isLight ? '#10b981' : '#059669')
              : (isLight ? '#ffffff' : '#1e293b'),
            color: activeMainTab === 'PERSONNEL' ? '#ffffff' : (isLight ? '#475569' : '#cbd5e1'),
            fontWeight: '800',
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem',
            boxShadow: activeMainTab === 'PERSONNEL' ? '0 4px 16px rgba(16, 185, 129, 0.35)' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          <span>👤</span>
          <span>PERSONEL BAZLI ETİKET & FİŞ (VOLKSWAGEN / BAYİ)</span>
          <span style={{
            padding: '0.15rem 0.55rem',
            borderRadius: '12px',
            fontSize: '0.74rem',
            background: activeMainTab === 'PERSONNEL' ? 'rgba(255,255,255,0.25)' : (isLight ? '#e2e8f0' : '#334155'),
            color: activeMainTab === 'PERSONNEL' ? '#ffffff' : (isLight ? '#475569' : '#cbd5e1'),
            fontWeight: '900'
          }}>
            442+ Danışman
          </span>
        </button>
      </div>

      {activeMainTab === 'PERSONNEL' ? (
        <PersonnelOrdersView isLight={isLight} navigate={navigate} />
      ) : (
        <>
          {/* Status Filter Tabs with Live Server Stats */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {[
          { key: 'ALL', label: 'TÜM SİPARİŞLER (HEPSİ)', color: '#2563eb', count: stats.total },
          { key: 'PENDING', label: 'BEKLEYENLER / KISMİ', color: '#d97706', count: stats.pending },
          { key: 'COMPLETED', label: 'TAMAMLANANLAR', color: '#10b981', count: stats.completed },
          { key: 'ACCOUNTED', label: 'MUHASEBELEŞENLER', color: '#8b5cf6', count: stats.accounted }
        ].map(tab => {
          const isActive = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              style={{
                padding: '0.55rem 1.2rem',
                borderRadius: '8px',
                border: `1px solid ${isActive ? tab.color : (isLight ? '#cbd5e1' : '#334155')}`,
                background: isActive ? tab.color : (isLight ? '#ffffff' : '#1e293b'),
                color: isActive ? '#ffffff' : (isLight ? '#475569' : '#cbd5e1'),
                fontWeight: '700',
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: isActive ? `0 4px 12px ${tab.color}33` : 'none'
              }}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span style={{
                  padding: '0.15rem 0.5rem',
                  borderRadius: '12px',
                  fontSize: '0.74rem',
                  background: isActive ? 'rgba(255,255,255,0.25)' : (isLight ? '#e2e8f0' : '#334155'),
                  color: isActive ? '#ffffff' : (isLight ? '#475569' : '#cbd5e1'),
                  fontWeight: '800'
                }}>
                  {tab.count.toLocaleString('tr-TR')}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Data Grid Table Container */}
      <div style={{ 
        background: isLight ? '#ffffff' : '#0f172a', 
        borderRadius: '8px', 
        border: `1px solid ${isLight ? '#cbd5e1' : '#1e293b'}`, 
        boxShadow: isLight ? '0 4px 20px rgba(0,0,0,0.05)' : '0 4px 20px rgba(0,0,0,0.4)',
        overflow: 'hidden'
      }}>
        {loading && orders.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
            <div className="spinner" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⌛</div>
            <div style={{ fontWeight: '700', fontSize: '1rem' }}>SQL Server Siparişler tablosundan veriler çekiliyor...</div>
            <div style={{ fontSize: '0.82rem', marginTop: '0.4rem', color: '#94a3b8' }}>16.000+ kayıt önbellekten hızlıca getiriliyor...</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 220px)' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse', 
              fontSize: '0.82rem', 
              fontFamily: 'Segoe UI, Arial, sans-serif',
              whiteSpace: 'nowrap'
            }}>
              <thead>
                <tr style={{ 
                  background: isLight ? '#e2e8f0' : '#1e293b', 
                  color: isLight ? '#334155' : '#e2e8f0', 
                  borderBottom: `2px solid ${isLight ? '#cbd5e1' : '#334155'}`,
                  position: 'sticky', top: 0, zIndex: 10
                }}>
                  <th style={{ padding: '0.65rem 1rem', textAlign: 'left', fontWeight: '700', borderRight: `1px solid ${isLight ? '#cbd5e1' : '#334155'}`, width: '70px' }}>ID</th>
                  <th style={{ padding: '0.65rem 1rem', textAlign: 'center', fontWeight: '700', borderRight: `1px solid ${isLight ? '#cbd5e1' : '#334155'}`, width: '110px' }}>SON İŞLEM</th>
                  <th style={{ padding: '0.65rem 1rem', textAlign: 'center', fontWeight: '700', borderRight: `1px solid ${isLight ? '#cbd5e1' : '#334155'}`, width: '150px' }}>FİŞ & STOK DURUMU</th>
                  <th style={{ padding: '0.65rem 1rem', textAlign: 'center', fontWeight: '700', borderRight: `1px solid ${isLight ? '#cbd5e1' : '#334155'}`, width: '130px' }}>İŞLEM</th>
                  <th style={{ padding: '0.65rem 1rem', textAlign: 'left', fontWeight: '700', borderRight: `1px solid ${isLight ? '#cbd5e1' : '#334155'}` }}>MÜŞTERİ</th>
                  <th style={{ padding: '0.65rem 1rem', textAlign: 'left', fontWeight: '700', borderRight: `1px solid ${isLight ? '#cbd5e1' : '#334155'}`, minWidth: '135px' }}>PARÇA NO</th>
                  <th style={{ padding: '0.65rem 1rem', textAlign: 'left', fontWeight: '700', borderRight: `1px solid ${isLight ? '#cbd5e1' : '#334155'}` }}>MODEL</th>
                  <th style={{ padding: '0.65rem 1rem', textAlign: 'left', fontWeight: '700', borderRight: `1px solid ${isLight ? '#cbd5e1' : '#334155'}`, width: '140px' }}>BEDEN</th>
                  <th style={{ padding: '0.65rem 1rem', textAlign: 'right', fontWeight: '700', borderRight: `1px solid ${isLight ? '#cbd5e1' : '#334155'}`, width: '90px' }}>ADET</th>
                  <th style={{ padding: '0.65rem 1rem', textAlign: 'left', fontWeight: '700', borderRight: `1px solid ${isLight ? '#cbd5e1' : '#334155'}`, width: '120px' }}>ZAMAN</th>
                  <th style={{ padding: '0.65rem 1rem', textAlign: 'left', fontWeight: '700', borderRight: `1px solid ${isLight ? '#cbd5e1' : '#334155'}`, width: '120px' }}>TESLİM ZAMANI</th>
                  <th style={{ padding: '0.65rem 1rem', textAlign: 'left', fontWeight: '700', borderRight: `1px solid ${isLight ? '#cbd5e1' : '#334155'}`, width: '100px' }}>PERSONEL</th>
                  <th style={{ padding: '0.65rem 1rem', textAlign: 'center', fontWeight: '700', width: '90px' }}>MUHASEBE</th>
                </tr>
              </thead>
              <tbody>
                {orders.length > 0 ? (
                  orders.map((row, idx) => {
                    const isSelected = selectedRowId === row.Id;
                    const summary = voucherSummaries[row.Id] || {
                      processed_quantity: row.processed_quantity || 0,
                      status: row.voucher_status || 'BEKLİYOR',
                      processed_by_size: row.processed_by_size || {}
                    };
                    const totalQty = Number(row.Adet) || 0;
                    const processedQty = summary ? summary.processed_quantity : 0;
                    const isCompleted = summary && (summary.status === 'TAMAMLANDI' || processedQty >= totalQty);
                    const isPartial = processedQty > 0 && !isCompleted;

                    let statusBadge = { text: '📦 BEKLİYOR', bg: 'rgba(100, 116, 139, 0.15)', color: '#64748b' };
                    if (isCompleted) {
                      statusBadge = { text: '✅ TAMAMLANDI', bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981' };
                    } else if (isPartial) {
                      statusBadge = { text: `⏳ KISMI (${processedQty}/${totalQty})`, bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' };
                    }

                    const rowBg = isSelected 
                      ? (isLight ? '#fef9c3' : '#422006') 
                      : (idx % 2 === 0 
                          ? (isLight ? '#ffffff' : '#0f172a') 
                          : (isLight ? '#f8fafc' : '#1e293b'));

                    return (
                      <tr 
                        key={row.Id || idx}
                        onClick={() => setSelectedRowId(row.Id)}
                        onDoubleClick={() => setSelectedOrderDetail(row)}
                        style={{ 
                          background: rowBg, 
                          borderBottom: `1px solid ${isLight ? '#e2e8f0' : '#1e293b'}`,
                          cursor: 'pointer',
                          transition: 'background 0.15s'
                        }}
                      >
                        <td style={{ padding: '0.6rem 1rem', fontWeight: '700', color: isSelected ? '#854d0e' : (isLight ? '#1e293b' : '#f8fafc'), borderRight: `1px solid ${isLight ? '#f1f5f9' : '#1e293b'}` }}>
                          {row.Id}
                        </td>
                        <td style={{ padding: '0.6rem 1rem', textAlign: 'center', borderRight: `1px solid ${isLight ? '#f1f5f9' : '#1e293b'}` }}>
                          <span style={{ 
                            padding: '0.2rem 0.6rem', 
                            borderRadius: '4px', 
                            fontSize: '0.75rem', 
                            fontWeight: '800',
                            letterSpacing: '0.5px',
                            background: row.IslemId === 'KESİM' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(59, 130, 246, 0.15)',
                            color: row.IslemId === 'KESİM' ? '#d97706' : '#2563eb',
                            border: `1px solid ${row.IslemId === 'KESİM' ? 'rgba(234, 179, 8, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`
                          }}>
                            {row.IslemId || 'PLANLAMA'}
                          </span>
                        </td>
                        <td style={{ padding: '0.6rem 1rem', textAlign: 'center', borderRight: `1px solid ${isLight ? '#f1f5f9' : '#1e293b'}` }}>
                          <span style={{
                            padding: '0.25rem 0.6rem',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: '800',
                            background: statusBadge.bg,
                            color: statusBadge.color,
                            border: `1px solid ${statusBadge.color}33`
                          }}>
                            {statusBadge.text}
                          </span>
                        </td>
                        <td style={{ padding: '0.6rem 1rem', textAlign: 'center', borderRight: `1px solid ${isLight ? '#f1f5f9' : '#1e293b'}` }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center', flexWrap: 'nowrap' }}>
                            {row.LogoBilled && (
                              <span 
                                style={{
                                  background: '#fef3c7',
                                  color: '#92400e',
                                  border: '1px solid #f59e0b',
                                  padding: '0.25rem 0.55rem',
                                  borderRadius: '6px',
                                  fontSize: '0.72rem',
                                  fontWeight: '800',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  boxShadow: '0 1px 4px rgba(245,158,11,0.2)'
                                }}
                                title={`LOGO Fatura No: ${row.LogoInvoiceNo || 'Mevcut'}`}
                              >
                                🔒 LOGO Faturalandı
                              </span>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/admin/orders/${row.Id}/labels`, { state: { order: row } });
                              }}
                              style={{
                                background: summary && summary.status === 'TAMAMLANDI' ? '#0284c7' : '#10b981',
                                color: '#ffffff',
                                border: 'none',
                                padding: '0.35rem 0.75rem',
                                borderRadius: '6px',
                                fontWeight: '700',
                                fontSize: '0.78rem',
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem'
                              }}
                              title="Etiket & Fiş Basım Merkezi (Canlı Takip & Ekstra Basım)"
                            >
                              🏷️ Fiş & Etiket Bas
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBoxPlanOrder(row);
                              }}
                              style={{
                                background: row.has_box_plan ? 'rgba(99, 102, 241, 0.15)' : '#6366f1',
                                color: row.has_box_plan ? '#4f46e5' : '#ffffff',
                                border: row.has_box_plan ? '1px solid #6366f1' : 'none',
                                padding: '0.35rem 0.75rem',
                                borderRadius: '6px',
                                fontWeight: '700',
                                fontSize: '0.78rem',
                                cursor: 'pointer',
                                boxShadow: row.has_box_plan ? 'none' : '0 2px 8px rgba(99,102,241,0.3)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem'
                              }}
                              title={row.has_box_plan ? `Koli Planı Mevcut (${row.box_plan_boxes || ''} Koli) - Düzenle` : "Sipariş Koli ve Beden Dağılımını Planla"}
                            >
                              📦 {row.has_box_plan ? `Koli (${row.box_plan_boxes || 'Planlı'})` : 'Koli Planla'}
                            </button>
                            <button
                              onClick={(e) => handleDeleteOrder(row.Id, e, row.LogoBilled, row.LogoInvoiceNo)}
                              title={row.LogoBilled ? `🔒 LOGO'da faturalandığı için silinemez (${row.LogoInvoiceNo || 'Faturalandı'})` : "Siparişi ve LOGO İrsaliyesini Sil"}
                              style={{
                                background: row.LogoBilled ? '#94a3b8' : '#ef4444',
                                color: '#ffffff',
                                border: 'none',
                                padding: '0.35rem 0.65rem',
                                borderRadius: '6px',
                                fontWeight: '700',
                                fontSize: '0.78rem',
                                cursor: 'pointer',
                                boxShadow: row.LogoBilled ? 'none' : '0 2px 8px rgba(239,68,68,0.3)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.2rem',
                                opacity: row.LogoBilled ? 0.75 : 1
                              }}
                            >
                              {row.LogoBilled ? '🔒 Silinemez' : '🗑️ Sil'}
                            </button>
                          </div>
                        </td>
                        <td style={{ padding: '0.6rem 1rem', fontWeight: '700', color: isLight ? '#0f172a' : '#ffffff', borderRight: `1px solid ${isLight ? '#f1f5f9' : '#1e293b'}` }}>
                          {row.MusteriAdi || '---'}
                        </td>
                        <td style={{ padding: '0.6rem 1rem', fontFamily: 'monospace', fontWeight: '800', color: isLight ? '#0369a1' : '#38bdf8', borderRight: `1px solid ${isLight ? '#f1f5f9' : '#1e293b'}` }}>
                          {formatOrderDisplayParcaNo(row)}
                        </td>
                        <td style={{ padding: '0.6rem 1rem', color: isLight ? '#334155' : '#e2e8f0', borderRight: `1px solid ${isLight ? '#f1f5f9' : '#1e293b'}` }}>
                          {cleanModelDisplayName(row.Model || row.product_name)}
                        </td>
                        <td style={{ padding: '0.6rem 1rem', color: isLight ? '#475569' : '#94a3b8', borderRight: `1px solid ${isLight ? '#f1f5f9' : '#1e293b'}` }}>
                          {row.BedenAdi || 'BEDEN (XXS-9XL)'}
                        </td>
                        <td style={{ padding: '0.6rem 1rem', textAlign: 'right', fontWeight: '800', color: isLight ? '#0284c7' : '#38bdf8', borderRight: `1px solid ${isLight ? '#f1f5f9' : '#1e293b'}` }}>
                          {row.Adet ? Number(row.Adet).toLocaleString('tr-TR') : '---'}
                        </td>
                        <td style={{ padding: '0.6rem 1rem', color: isLight ? '#475569' : '#cbd5e1', borderRight: `1px solid ${isLight ? '#f1f5f9' : '#1e293b'}` }}>
                          {formatDate(row.Zaman)}
                        </td>
                        <td style={{ padding: '0.6rem 1rem', color: isLight ? '#475569' : '#cbd5e1', borderRight: `1px solid ${isLight ? '#f1f5f9' : '#1e293b'}` }}>
                          {formatDate(row.TeslimZaman)}
                        </td>
                        <td style={{ padding: '0.6rem 1rem', fontWeight: '600', color: isLight ? '#334155' : '#e2e8f0', borderRight: `1px solid ${isLight ? '#f1f5f9' : '#1e293b'}` }}>
                          {row.PersonelId || '---'}
                        </td>
                        <td style={{ padding: '0.6rem 1rem', textAlign: 'center' }}>
                          <input 
                            type="checkbox" 
                            checked={!!row.Muhasebelesti} 
                            onChange={(e) => handleToggleMuhasebe(row.Id, row.Muhasebelesti, e)}
                            style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#2563eb' }}
                          />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="12" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                      Aramaya uygun sipariş kaydı bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Summary & Pagination Bar */}
        <div style={{ 
          padding: '0.9rem 1.5rem', 
          background: isLight ? '#f1f5f9' : '#1e293b', 
          borderTop: `1px solid ${isLight ? '#cbd5e1' : '#334155'}`,
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.85rem',
          color: isLight ? '#475569' : '#94a3b8'
        }}>
          <div>
            Toplam <strong>{totalFilteredCount.toLocaleString('tr-TR')}</strong> siparişten <strong style={{ color: '#2563eb' }}>{orders.length.toLocaleString('tr-TR')}</strong> tanesi listeleniyor (Kayıtlı Toplam: <strong>{(totalQuantitySum || stats.totalQuantity || 0).toLocaleString('tr-TR')}</strong> adet ürün).
            {isRefreshing && <span style={{ marginLeft: '0.8rem', color: '#3b82f6', fontWeight: '600' }}>⚡ Veriler güncelleniyor...</span>}
          </div>

          {hasMore && (
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
              <button
                onClick={handleLoadMore}
                disabled={fetchingMore}
                style={{
                  padding: '0.5rem 1.2rem', borderRadius: '8px', background: '#2563eb', color: '#ffffff',
                  border: 'none', fontWeight: '800', cursor: fetchingMore ? 'wait' : 'pointer', fontSize: '0.82rem',
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
                  opacity: fetchingMore ? 0.7 : 1
                }}
              >
                {fetchingMore ? '⏳ Yükleniyor...' : '⚡ +100 Daha Göster (Sonraki Sayfa)'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrderDetail && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', 
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' 
        }}>
          <div style={{ 
            background: isLight ? '#ffffff' : '#0f172a', 
            width: '100%', maxWidth: '700px', borderRadius: '12px', 
            padding: '2rem', boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            border: `1px solid ${isLight ? '#cbd5e1' : '#334155'}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: `1px solid ${isLight ? '#e2e8f0' : '#1e293b'}`, paddingBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#2563eb', textTransform: 'uppercase', letterSpacing: '1px' }}>SİPARİŞ DETAYI</span>
                <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '800' }}>Sipariş #{selectedOrderDetail.Id}</h2>
              </div>
              <button onClick={() => setSelectedOrderDetail(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'inherit' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700' }}>MÜŞTERİ</div>
                <div style={{ fontWeight: '700', fontSize: '1rem' }}>{selectedOrderDetail.MusteriAdi || '---'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700' }}>PERSONEL</div>
                <div style={{ fontWeight: '700', fontSize: '1rem' }}>{selectedOrderDetail.PersonelId || '---'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700' }}>SİPARİŞ ZAMANI</div>
                <div>{formatDate(selectedOrderDetail.Zaman)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700' }}>TESLİM ZAMANI</div>
                <div>{formatDate(selectedOrderDetail.TeslimZaman)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700' }}>PARÇA NO</div>
                <div style={{ fontWeight: '800', fontFamily: 'monospace', color: '#0284c7', fontSize: '1.05rem' }}>
                  {formatOrderDisplayParcaNo(selectedOrderDetail)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700' }}>MODEL</div>
                <div style={{ fontWeight: '700' }}>{cleanModelDisplayName(selectedOrderDetail.Model || selectedOrderDetail.product_name)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700' }}>BEDEN ARALIĞI</div>
                <div>{selectedOrderDetail.BedenAdi || '---'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700' }}>SON İŞLEM</div>
                <div>{selectedOrderDetail.IslemId || 'PLANLAMA'}</div>
              </div>
            </div>

            {/* Üretim Bilgileri Matrix Section (ERP Birebir Görünümü) */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', borderBottom: `2px solid ${isLight ? '#e2e8f0' : '#334155'}`, marginBottom: '0.75rem' }}>
                <div style={{ padding: '0.4rem 1rem', background: '#2563eb', color: '#ffffff', fontWeight: '800', fontSize: '0.8rem', borderRadius: '6px 6px 0 0' }}>
                  📋 Üretim Bilgileri
                </div>
                <div style={{ padding: '0.4rem 1rem', color: '#64748b', fontSize: '0.8rem' }}>Hammadeler</div>
                <div style={{ padding: '0.4rem 1rem', color: '#64748b', fontSize: '0.8rem' }}>Üretim Planı</div>
                <div style={{ padding: '0.4rem 1rem', color: '#64748b', fontSize: '0.8rem' }}>Detay Bilgileri</div>
              </div>

              <ProductionMatrixTable 
                matrix={getSizeMatrixForOrder(selectedOrderDetail)} 
                headers={selectedOrderDetail?.SizeHeaders} 
                isLight={isLight} 
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button 
                onClick={() => {
                  const ord = selectedOrderDetail;
                  setSelectedOrderDetail(null);
                  navigate(`/admin/orders/${ord.Id}/labels`, { state: { order: ord } });
                }} 
                style={{ 
                  padding: '0.6rem 1.4rem', 
                  borderRadius: '8px', 
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                  color: '#ffffff', 
                  border: 'none', 
                  fontWeight: '800', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
              >
                🏷️ Fiş & Etiket Basım Sayfası
              </button>
              <button 
                onClick={() => setSelectedBoxPlanOrder(selectedOrderDetail)} 
                style={{ 
                  padding: '0.6rem 1.4rem', 
                  borderRadius: '8px', 
                  background: '#6366f1', 
                  color: '#ffffff', 
                  border: 'none', 
                  fontWeight: '800', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                }}
              >
                📦 Koli & Beden Dağılımını Planla
              </button>
              <button 
                onClick={() => setSelectedOrderDetail(null)} 
                style={{ padding: '0.6rem 1.5rem', borderRadius: '8px', background: '#e2e8f0', color: '#1e293b', border: 'none', fontWeight: '700', cursor: 'pointer' }}
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Voucher & Label Generation Modal */}
      {selectedVoucherOrder && (() => {
        const summary = voucherSummaries[selectedVoucherOrder.Id] || { processed_quantity: 0, status: 'BEKLİYOR' };
        const totalOrderQty = selectedVoucherOrder.Adet || selectedVoucherOrder.quantity || 100;
        const previouslyProcessed = summary.processed_quantity || 0;
        const remainingQty = Math.max(0, totalOrderQty - previouslyProcessed);
        let activeSizes = calculateOrderSizeBreakdown(selectedVoucherOrder, summary, null, showAllSizes);
        if (customAddedSizes.length > 0) {
          const existingSet = new Set(activeSizes.map(it => it.size.toUpperCase()));
          customAddedSizes.forEach(cSz => {
            const up = cSz.trim().toUpperCase();
            if (up && !existingSet.has(up)) {
              activeSizes.push({
                size: up,
                orderQty: 0,
                processedQty: 0,
                remainingQty: 0,
                gender: selectedGender || 'Erkek',
                notInOrder: true
              });
            }
          });
        }

        return (
          <div style={{ 
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
            background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(5px)', 
            zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' 
          }}>
            <div style={{ 
              background: isLight ? '#ffffff' : '#0f172a', 
              width: '100%', maxWidth: '840px', borderRadius: '16px', 
              padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)',
              border: `1px solid ${isLight ? '#cbd5e1' : '#334155'}`,
              maxHeight: '90vh', overflowY: 'auto'
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: `1px solid ${isLight ? '#e2e8f0' : '#1e293b'}`, paddingBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
                    🏷️
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '800' }}>Fiş & Etiket Oluştur</h3>
                    <div style={{ fontSize: '0.82rem', color: '#64748b' }}>Sipariş #{selectedVoucherOrder.Id} • {selectedVoucherOrder.MusteriAdi}</div>
                  </div>
                </div>
                <button onClick={() => setSelectedVoucherOrder(null)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'inherit' }}>✕</button>
              </div>

              {/* Order Info & Quantity Tracker Box */}
              <div style={{ background: isLight ? '#f8fafc' : '#1e293b', padding: '1rem 1.25rem', borderRadius: '10px', marginBottom: '1.25rem', border: `1px solid ${isLight ? '#e2e8f0' : '#334155'}` }}>
                <div style={{ fontWeight: '700', fontSize: '0.95rem', marginBottom: '0.5rem', color: '#10b981' }}>
                  📦 {cleanModelDisplayName(selectedVoucherOrder.Model || selectedVoucherOrder.product_name || 'Standart Ürün / Model')} ({selectedVoucherOrder.BedenAdi || 'BEDEN'})
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', fontSize: '0.82rem', textAlign: 'center' }}>
                  <div style={{ background: isLight ? '#ffffff' : '#0f172a', padding: '0.5rem', borderRadius: '8px', border: `1px solid ${isLight ? '#cbd5e1' : '#334155'}` }}>
                    <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Toplam Sipariş</div>
                    <div style={{ fontWeight: '800', fontSize: '1.1rem' }}>{totalOrderQty} <span style={{ fontSize: '0.75rem' }}>Adet</span></div>
                  </div>
                  <div style={{ background: isLight ? '#ffffff' : '#0f172a', padding: '0.5rem', borderRadius: '8px', border: `1px solid ${isLight ? '#cbd5e1' : '#334155'}` }}>
                    <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Önceden Basılan</div>
                    <div style={{ fontWeight: '800', fontSize: '1.1rem', color: '#3b82f6' }}>{previouslyProcessed} <span style={{ fontSize: '0.75rem' }}>Adet</span></div>
                  </div>
                  <div style={{ background: isLight ? '#ffffff' : '#0f172a', padding: '0.5rem', borderRadius: '8px', border: `1px solid ${isLight ? '#cbd5e1' : '#334155'}` }}>
                    <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Kalan Basılabilir</div>
                    <div style={{ fontWeight: '800', fontSize: '1.1rem', color: '#10b981' }}>{remainingQty} <span style={{ fontSize: '0.75rem' }}>Adet</span></div>
                  </div>
                </div>
              </div>

              {/* Üretim Bilgileri Matrix Section (ERP Birebir Görünümü) */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '800', color: '#2563eb' }}>
                    📋 Üretim Bilgileri (Kesim / Beden Dağılımı - bsip):
                  </label>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>💡 Tabloda satır/hücreye tıklayarak miktar seçebilirsiniz</span>
                </div>

                <ProductionMatrixTable 
                  matrix={getSizeMatrixForOrder(selectedVoucherOrder)} 
                  headers={selectedVoucherOrder?.SizeHeaders}
                  isLight={isLight} 
                  onSelectRowOrCell={(row, sz, val, rIdx) => {
                    setSelectedGender(row.gender);
                    setSelectedProcess(row.process);
                    setPrintMode('PARTIAL');
                    if (sz) {
                      setSelectedSize(sz);
                      setQuantityInput(val);
                      setSizeTransferInputs(prev => ({
                        ...prev,
                        [sz]: val
                      }));
                    } else {
                      setSelectedSize(selectedVoucherOrder.BedenAdi || 'BEDEN');
                      setQuantityInput(val);
                    }
                  }}
                />
              </div>

              {/* Beden Dağılımı ve Hızlı Adet Aktarımı Grid */}
              {activeSizes && activeSizes.length > 0 && (
                <div style={{ background: isLight ? '#f8fafc' : '#1e293b', padding: '1rem', borderRadius: '10px', marginBottom: '1.25rem', border: `1px solid ${isLight ? '#cbd5e1' : '#334155'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: '800', color: '#10b981' }}>
                        📊 Beden Bazında Kalan Adetler ve Fiş Dağılımı:
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowAllSizes(prev => !prev)}
                        style={{
                          padding: '0.25rem 0.6rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          background: showAllSizes ? '#3b82f6' : (isLight ? '#e2e8f0' : '#334155'),
                          color: showAllSizes ? '#ffffff' : 'inherit',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                        title="Siparişte yer almayan tüm standart bedenleri de listeye ekler veya gizler"
                      >
                        {showAllSizes ? '👁️ Sadece Sipariştekileri Göster' : '➕ Tüm Standart Bedenleri Göster'}
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <input
                          type="text"
                          placeholder="Örn: 4XL, 50"
                          value={newCustomSizeInput}
                          onChange={(e) => setNewCustomSizeInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomSize(); } }}
                          style={{
                            width: '100px',
                            padding: '0.25rem 0.4rem',
                            borderRadius: '5px',
                            fontSize: '0.75rem',
                            border: `1px solid ${isLight ? '#cbd5e1' : '#475569'}`,
                            background: isLight ? '#ffffff' : '#0f172a',
                            color: 'inherit'
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomSize}
                          style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '5px',
                            fontSize: '0.75rem',
                            fontWeight: '800',
                            background: '#6366f1',
                            color: '#ffffff',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                          title="Özel beden kutusu ekle"
                        >
                          + Beden Ekle
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleFillAllRemainingSizes(activeSizes)}
                        style={{
                          padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800',
                          background: '#10b981', color: '#ffffff', border: 'none', cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)'
                        }}
                      >
                        ⚡ Tüm Kalan Bedenleri Doldur
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.6rem' }}>
                    {activeSizes.map(szItem => {
                      const currentInput = sizeTransferInputs[szItem.size] !== undefined ? sizeTransferInputs[szItem.size] : '';
                      return (
                        <div 
                          key={szItem.size} 
                          style={{ 
                            background: isLight ? '#ffffff' : '#0f172a', padding: '0.5rem 0.6rem', borderRadius: '8px', 
                            border: `1px solid ${szItem.notInOrder ? '#f59e0b' : (isLight ? '#cbd5e1' : '#334155')}`, textAlign: 'center',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
                          }}
                        >
                          <div style={{ fontWeight: '800', fontSize: '0.9rem', color: szItem.notInOrder ? '#f59e0b' : '#2563eb', marginBottom: '0.2rem' }}>
                            {szItem.size}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '0.4rem' }}>
                            {szItem.notInOrder ? (
                              <span style={{ color: '#f59e0b', fontWeight: '700' }}>⚠️ İlave Beden</span>
                            ) : (
                              <>Top: <strong>{szItem.orderQty}</strong> | Kalan: <strong style={{ color: '#10b981' }}>{szItem.remainingQty}</strong></>
                            )}
                          </div>
                          <input
                            type="number"
                            min="0"
                            placeholder={szItem.notInOrder ? '0' : String(szItem.remainingQty)}
                            value={currentInput}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSizeTransferInputs(prev => ({
                                ...prev,
                                [szItem.size]: val === '' ? '' : parseInt(val) || 0
                              }));
                            }}
                            style={{
                              width: '100%', padding: '0.35rem 0.5rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '700',
                              textAlign: 'center', border: `1px solid ${szItem.notInOrder ? '#f59e0b' : (isLight ? '#cbd5e1' : '#475569')}`,
                              background: isLight ? '#f8fafc' : '#1e293b', color: 'inherit', outline: 'none'
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Gender & Size Breakdown Controls */}
              <div style={{ background: isLight ? '#f8fafc' : '#1e293b', padding: '1rem', borderRadius: '10px', marginBottom: '1.25rem', border: `1px solid ${isLight ? '#cbd5e1' : '#334155'}` }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.4rem' }}>CİNSİYET SEÇİMİ:</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {['Erkek', 'Kadın', 'Çocuk'].map(g => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setSelectedGender(g)}
                          style={{
                            flex: 1, padding: '0.45rem 0.5rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '700',
                            border: `1px solid ${selectedGender === g ? '#2563eb' : (isLight ? '#cbd5e1' : '#475569')}`,
                            background: selectedGender === g ? '#2563eb' : (isLight ? '#ffffff' : '#0f172a'),
                            color: selectedGender === g ? '#ffffff' : 'inherit',
                            cursor: 'pointer'
                          }}
                        >
                          {g === 'Erkek' ? '👨 Erkek' : (g === 'Kadın' ? '👩 Kadın' : '🧒 Çocuk')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.4rem' }}>BEDEN SEÇİMİ:</label>
                    <input
                      type="text"
                      placeholder="Örn: M, L, XL, 48, 50..."
                      value={selectedSize}
                      onChange={(e) => setSelectedSize(e.target.value)}
                      style={{
                        width: '100%', padding: '0.45rem 0.75rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '700',
                        border: `1px solid ${isLight ? '#cbd5e1' : '#475569'}`, background: isLight ? '#ffffff' : '#0f172a',
                        color: 'inherit', outline: 'none'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Printing Mode Radio Selection */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.5rem' }}>Basım Miktarı Seçimi:</label>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <label style={{ 
                    display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '8px', 
                    border: `1px solid ${printMode === 'FULL' ? '#10b981' : (isLight ? '#cbd5e1' : '#334155')}`,
                    background: printMode === 'FULL' ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                    cursor: 'pointer'
                  }}>
                    <input 
                      type="radio" 
                      name="printMode" 
                      value="FULL" 
                      checked={printMode === 'FULL'} 
                      onChange={() => setPrintMode('FULL')}
                      style={{ accentColor: '#10b981', width: '16px', height: '16px' }}
                    />
                    <div>
                      <strong style={{ fontSize: '0.9rem' }}>Kalan Adetlerin Tamamını Bas ({remainingQty} Adet)</strong>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Siparişin kalan miktarının tamamı için fiş kaydı oluşturulur ve stok durumuna işlenir.</div>
                    </div>
                  </label>

                  <label style={{ 
                    display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '8px', 
                    border: `1px solid ${printMode === 'PARTIAL' ? '#3b82f6' : (isLight ? '#cbd5e1' : '#334155')}`,
                    background: printMode === 'PARTIAL' ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                    cursor: 'pointer'
                  }}>
                    <input 
                      type="radio" 
                      name="printMode" 
                      value="PARTIAL" 
                      checked={printMode === 'PARTIAL'} 
                      onChange={() => setPrintMode('PARTIAL')}
                      style={{ accentColor: '#3b82f6', width: '16px', height: '16px' }}
                    />
                    <div style={{ width: '100%' }}>
                      <strong style={{ fontSize: '0.9rem' }}>Seçili Cinsiyet/Beden Miktarını Bas ({selectedGender} - {selectedSize || 'Özel Adet'})</strong>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '0.4rem' }}>Üretilen veya basılmak istenen özel miktarı girin.</div>
                      
                      {printMode === 'PARTIAL' && (
                        <input 
                          type="number" 
                          min="1" 
                          max={remainingQty}
                          placeholder={`Max: ${remainingQty}`}
                          value={quantityInput}
                          onChange={(e) => setQuantityInput(e.target.value)}
                          style={{ 
                            width: '180px', padding: '0.5rem 0.75rem', borderRadius: '6px', 
                            border: `1px solid ${isLight ? '#cbd5e1' : '#334155'}`, background: isLight ? '#ffffff' : '#0f172a',
                            color: 'inherit', fontWeight: '700', fontSize: '0.9rem', outline: 'none'
                          }}
                        />
                      )}
                    </div>
                  </label>
                </div>
              </div>

              {/* Koli / Shipping Details Options */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#64748b', marginBottom: '0.3rem' }}>KOLİ NO</label>
                  <input 
                    type="number" 
                    min="1"
                    value={boxNo}
                    onChange={(e) => setBoxNo(parseInt(e.target.value) || 1)}
                    style={{ 
                      width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', 
                      border: `1px solid ${isLight ? '#cbd5e1' : '#334155'}`, background: isLight ? '#ffffff' : '#1e293b',
                      color: 'inherit', fontSize: '0.9rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#64748b', marginBottom: '0.3rem' }}>TOPLAM KOLİ SAYISI</label>
                  <input 
                    type="number" 
                    min="1"
                    value={totalBoxes}
                    onChange={(e) => setTotalBoxes(parseInt(e.target.value) || 1)}
                    style={{ 
                      width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', 
                      border: `1px solid ${isLight ? '#cbd5e1' : '#334155'}`, background: isLight ? '#ffffff' : '#1e293b',
                      color: 'inherit', fontSize: '0.9rem'
                    }}
                  />
                </div>
              </div>

              {/* Etiket Şablonu / Formatı Seçimi */}
              <div style={{ marginBottom: '1.2rem', padding: '0.85rem 1rem', borderRadius: '8px', border: `1px solid ${isLight ? '#cbd5e1' : '#334155'}`, background: isLight ? '#f8fafc' : '#0f172a' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '800', color: isLight ? '#334155' : '#94a3b8', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  🏷️ SATO RFID Etiket Şablonu / Tasarımı
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <label style={{ 
                    display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.65rem 0.85rem', borderRadius: '6px', cursor: 'pointer',
                    border: `1.5px solid ${rfidLabelTemplate === 'QR' ? '#2563eb' : (isLight ? '#cbd5e1' : '#334155')}`,
                    background: rfidLabelTemplate === 'QR' ? (isLight ? '#eff6ff' : 'rgba(37, 99, 235, 0.15)') : 'transparent',
                    boxShadow: rfidLabelTemplate === 'QR' ? '0 2px 8px rgba(37, 99, 235, 0.15)' : 'none',
                    transition: 'all 0.2s ease'
                  }}>
                    <input 
                      type="radio" 
                      name="rfidLabelTemplate" 
                      value="QR" 
                      checked={rfidLabelTemplate === 'QR'} 
                      onChange={() => setRfidLabelTemplate('QR')}
                      style={{ accentColor: '#2563eb', width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <div>
                      <div style={{ fontWeight: '800', fontSize: '0.88rem', color: rfidLabelTemplate === 'QR' ? '#2563eb' : 'inherit' }}>🔲 QR Kodlu Tasarım</div>
                      <div style={{ fontSize: '0.73rem', color: '#64748b' }}>Karekod + Barkod + Parça No + Beden</div>
                    </div>
                  </label>

                  <label style={{ 
                    display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.65rem 0.85rem', borderRadius: '6px', cursor: 'pointer',
                    border: `1.5px solid ${rfidLabelTemplate === 'CLASSIC_1D' ? '#2563eb' : (isLight ? '#cbd5e1' : '#334155')}`,
                    background: rfidLabelTemplate === 'CLASSIC_1D' ? (isLight ? '#eff6ff' : 'rgba(37, 99, 235, 0.15)') : 'transparent',
                    boxShadow: rfidLabelTemplate === 'CLASSIC_1D' ? '0 2px 8px rgba(37, 99, 235, 0.15)' : 'none',
                    transition: 'all 0.2s ease'
                  }}>
                    <input 
                      type="radio" 
                      name="rfidLabelTemplate" 
                      value="CLASSIC_1D" 
                      checked={rfidLabelTemplate === 'CLASSIC_1D'} 
                      onChange={() => setRfidLabelTemplate('CLASSIC_1D')}
                      style={{ accentColor: '#2563eb', width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <div>
                      <div style={{ fontWeight: '800', fontSize: '0.88rem', color: rfidLabelTemplate === 'CLASSIC_1D' ? '#2563eb' : 'inherit' }}>🏷️ Klasik Çizgi Barkod (1D)</div>
                      <div style={{ fontSize: '0.73rem', color: '#64748b' }}>Code 128 Standart Çizgili Şablon</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Feedback Message Banner */}
              {feedbackMsg && (
                <div style={{ 
                  padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.2rem', fontSize: '0.85rem', fontWeight: '700',
                  background: feedbackMsg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: feedbackMsg.type === 'success' ? '#10b981' : '#ef4444',
                  border: `1px solid ${feedbackMsg.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                }}>
                  {feedbackMsg.text}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => setSelectedVoucherOrder(null)} 
                  disabled={submittingVoucher}
                  style={{ padding: '0.65rem 1.2rem', borderRadius: '8px', background: isLight ? '#e2e8f0' : '#334155', color: 'inherit', border: 'none', fontWeight: '700', cursor: 'pointer' }}
                >
                  İptal
                </button>

                <button 
                  onClick={handlePrintGodexBoxLabel}
                  disabled={submittingVoucher}
                  style={{ 
                    padding: '0.65rem 1.3rem', borderRadius: '8px', 
                    background: '#f59e0b', color: '#ffffff', 
                    border: 'none', fontWeight: '800', cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                    display: 'flex', alignItems: 'center', gap: '0.4rem'
                  }}
                  title="Godex G530 Yazıcısından Koli Sevkiyat Etiketi Basar"
                >
                  📦 Godex'ten Koli Etiketi Bas
                </button>

                <button 
                  onClick={handleCreateVoucher}
                  disabled={submittingVoucher || remainingQty <= 0}
                  style={{ 
                    padding: '0.65rem 1.3rem', borderRadius: '8px', 
                    background: isLight ? '#64748b' : '#475569', color: '#ffffff', 
                    border: 'none', fontWeight: '700', cursor: remainingQty <= 0 ? 'not-allowed' : 'pointer'
                  }}
                  title="Yazıcıya göndermeden sadece sisteme fiş/stok kaydı açar"
                >
                  ✅ Sadece Fiş Oluştur
                </button>

                <button 
                  onClick={handlePrintSatoRfidLabels}
                  disabled={submittingVoucher || remainingQty <= 0}
                  style={{ 
                    padding: '0.65rem 1.6rem', borderRadius: '8px', 
                    background: remainingQty <= 0 ? '#94a3b8' : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: '#ffffff', 
                    border: 'none', fontWeight: '800', cursor: remainingQty <= 0 ? 'not-allowed' : 'pointer',
                    boxShadow: remainingQty <= 0 ? 'none' : '0 4px 16px rgba(37, 99, 235, 0.4)',
                    display: 'flex', alignItems: 'center', gap: '0.5rem'
                  }}
                  title="SATO CL4NX Plus ile hem fiziki etiketi basar hem de içine EPC çipini yazar"
                >
                  {submittingVoucher ? 'Yazıcıya Gönderiliyor...' : '🖨️ SATO\'dan RFID Etiket Bas (Çipli)'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Order Box Plan Modal */}
      {selectedBoxPlanOrder && (
        <OrderBoxPlanModal
          order={selectedBoxPlanOrder}
          onClose={() => setSelectedBoxPlanOrder(null)}
          onSaved={() => {
            fetchMssqlOrders(statusFilter, currentPage, false, searchTerm, true);
          }}
        />
      )}
        </>
      )}
    </div>
  );
};

export default OrdersPage;