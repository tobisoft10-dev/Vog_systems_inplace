// Pure Node.js script to create ZPL ^GF bitmaps for Yerli Üretim & RFID logos
const fs = require('fs');

function createYerliUretimZpl() {
    // 80x50 dots Yerli Üretim badge
    // We can draw a crisp monochrome bitmap:
    // Outer rounded box, Handshake icon on top, "YERLİ ÜRETİM" text beneath
    const width = 88; // 11 bytes per row
    const height = 54;
    const bytesPerRow = Math.ceil(width / 8);
    const totalBytes = bytesPerRow * height;
    const buffer = Buffer.alloc(totalBytes, 0);

    function setPixel(x, y) {
        if (x < 0 || x >= width || y < 0 || y >= height) return;
        const byteIndex = y * bytesPerRow + Math.floor(x / 8);
        const bitIndex = 7 - (x % 8);
        buffer[byteIndex] |= (1 << bitIndex);
    }

    // Outer border (thickness 2)
    for (let x = 2; x < width - 2; x++) {
        setPixel(x, 1); setPixel(x, 2);
        setPixel(x, height - 2); setPixel(x, height - 3);
    }
    for (let y = 2; y < height - 2; y++) {
        setPixel(1, y); setPixel(2, y);
        setPixel(width - 2, y); setPixel(width - 3, y);
    }

    // Handshake icon in top half (y: 6 to 24)
    // Left hand coming in
    for (let y = 10; y <= 16; y++) {
        for (let x = 8; x <= 22; x++) setPixel(x, y);
    }
    // Right hand coming in
    for (let y = 12; y <= 18; y++) {
        for (let x = 66; x <= 80; x++) setPixel(x, y);
    }
    // Clasp / fingers
    for (let x = 24; x <= 64; x++) {
        for (let y = 8; y <= 22; y++) {
            if ((x + y) % 3 !== 0) setPixel(x, y);
        }
    }

    // Divider line
    for (let x = 4; x < width - 4; x++) {
        setPixel(x, 27); setPixel(x, 28);
    }

    const hex = buffer.toString('hex').toUpperCase();
    return `^GFA,${totalBytes},${totalBytes},${bytesPerRow},${hex}`;
}

function createRfidLogoZpl() {
    // 64x54 dots RFID Antenna Wave box
    const width = 64; // 8 bytes per row
    const height = 54;
    const bytesPerRow = 8;
    const totalBytes = bytesPerRow * height;
    const buffer = Buffer.alloc(totalBytes, 0);

    function setPixel(x, y) {
        if (x < 0 || x >= width || y < 0 || y >= height) return;
        const byteIndex = y * bytesPerRow + Math.floor(x / 8);
        const bitIndex = 7 - (x % 8);
        buffer[byteIndex] |= (1 << bitIndex);
    }

    // Outer border
    for (let x = 2; x < width - 2; x++) {
        setPixel(x, 1); setPixel(x, 2);
        setPixel(x, height - 2); setPixel(x, height - 3);
    }
    for (let y = 2; y < height - 2; y++) {
        setPixel(1, y); setPixel(2, y);
        setPixel(width - 2, y); setPixel(width - 3, y);
    }

    // Center dot (y: 20-22, x: 20-22)
    for (let x = 18; x <= 24; x++) {
        for (let y = 18; y <= 24; y++) setPixel(x, y);
    }

    // Arc 1 (radius 10)
    for (let angle = -60; angle <= 60; angle += 4) {
        const rad = angle * Math.PI / 180;
        const cx = 21 + Math.round(11 * Math.cos(rad));
        const cy = 21 + Math.round(11 * Math.sin(rad));
        setPixel(cx, cy); setPixel(cx + 1, cy);
    }

    // Arc 2 (radius 18)
    for (let angle = -60; angle <= 60; angle += 3) {
        const rad = angle * Math.PI / 180;
        const cx = 21 + Math.round(18 * Math.cos(rad));
        const cy = 21 + Math.round(18 * Math.sin(rad));
        setPixel(cx, cy); setPixel(cx + 1, cy);
    }

    // Arc 3 (radius 26)
    for (let angle = -55; angle <= 55; angle += 2) {
        const rad = angle * Math.PI / 180;
        const cx = 21 + Math.round(26 * Math.cos(rad));
        const cy = 21 + Math.round(26 * Math.sin(rad));
        setPixel(cx, cy); setPixel(cx + 1, cy);
    }

    const hex = buffer.toString('hex').toUpperCase();
    return `^GFA,${totalBytes},${totalBytes},${bytesPerRow},${hex}`;
}

module.exports = { createYerliUretimZpl, createRfidLogoZpl };
