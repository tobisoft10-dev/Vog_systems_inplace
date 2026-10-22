function parseShoeCode(code, gender) {
  if (!code) return { parcaNo: 'PVW-AYK', size: 'STD' };
  const raw = String(code).trim().toUpperCase();

  // Pattern 1: PVWB260011405 -> SKU: PVWB260011, Size: 40.5
  // Pattern 2: PVWB260010375 -> SKU: PVWB260010, Size: 37.5
  // Pattern 3: PVWB260019425 -> SKU: PVWB260019, Size: 42.5
  // Pattern 4: PVWB26001943  -> SKU: PVWB260019, Size: 43
  // Pattern 5: PVWB26001145  -> SKU: PVWB260011, Size: 45
  // Pattern 6: PVWK20010638  -> SKU: PVWK200106, Size: 38
  // Pattern 7: PVWK100100481 -> Kadın Ayakkabısı. 481 ne demek?
  // Pattern 8: PVWB2500140   -> SKU: PVWB25001, Size: 40

  let size = 'STD';
  let sku = raw;

  // Check .5 endings first: 375 -> 37.5, 365 -> 36.5, 405 -> 40.5, 425 -> 42.5, 475 -> 47.5
  const halfMatch = raw.match(/(\d{2})5$/);
  if (halfMatch && parseInt(halfMatch[1]) >= 35 && parseInt(halfMatch[1]) <= 48) {
    size = `${halfMatch[1]}.5`;
  } else {
    // Check standard 2-digit shoe sizes between 35 and 50
    const twoDigit = raw.match(/(3[5-9]|4[0-9]|50)$/);
    if (twoDigit) {
      size = twoDigit[1];
    } else {
      // Check 481 special case or other
      const match481 = raw.match(/481$/);
      if (match481) {
        // In Turkish shoe sizing, is 481 actually 41 or 38?
        // Let's check!
      }
    }
  }

  return { raw, size, sku };
}

const testCodes = [
  'PVWB26001145', 'PVWB26001943', 'PVWB260010375', 'PVWB26001944',
  'PVWB26001141', 'PVWB26001942', 'PVWB25000636', 'PVWB26001038',
  'PVWB26001142', 'PVWB26001039', 'PVWB2500140',  'PVWB260011405',
  'PVWB26001947', 'PVWK10005340', 'PVWB260010365', 'PVWK20010945',
  'PVWB260018365', 'PVWB26001839', 'PVWB26001946', 'PVWB26001945',
  'PVWB26001941', 'PVWK20010638', 'PVWB26001042', 'PVWB2500246',
  'PVWB26001940', 'PVWK100100481', 'PVWB260018375', 'PVWK20011038',
  'PVWB260019475', 'PVWB260019425', 'PVWB26001040', 'PVWB26001838'
];

testCodes.forEach(c => console.log(c, '->', parseShoeCode(c)));
