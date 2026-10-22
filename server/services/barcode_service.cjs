/**
 * VOG System - High Precision Vector QRCode Generator
 * Generates crisp, offline-ready vector SVG QR-Codes for all labels, boxes, and HTML previews.
 */

let bwipjs = null;
try {
    bwipjs = require('bwip-js');
} catch (e) {
    console.warn('[BARCODE SERVICE] bwip-js not loaded, fallback mode active.');
}

function generateQrCodeSvg(text = '', options = {}) {
    const cleanText = text.toString().trim() || 'VOG-RFID';
    if (bwipjs) {
        try {
            const svg = bwipjs.toSVG({
                bcid: 'qrcode',
                text: cleanText,
                scale: options.scale || 3,
                includetext: false
            });
            return svg;
        } catch (e) {
            console.error('QRCode SVG error:', e.message);
        }
    }
    return `<div style="font-family:monospace;font-weight:bold;text-align:center;padding:4px;border:1px solid #000;">${cleanText}</div>`;
}

// Map Code128 to QRCode as well for 100% global QR compliance
function generateCode128Svg(text = '', options = {}) {
    return generateQrCodeSvg(text, options);
}

module.exports = {
    generateCode128Svg,
    generateQrCodeSvg
};

