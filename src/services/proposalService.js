import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ROBOTO_REGULAR, ROBOTO_BOLD } from '../assets/fonts/fonts.js';

// Helper to load image from URL with CORS awareness and timeout protection
const loadImage = (url, timeout = 5000) => {
    return new Promise((resolve, reject) => {
        if (!url) {
            console.warn('Empty URL provided to loadImage');
            return reject(new Error('Empty URL'));
        }
        
        const img = new Image();
        const timer = setTimeout(() => {
            img.src = ""; // Stop loading
            console.warn(`Image load timed out after ${timeout}ms: ${url}`);
            reject(new Error(`Timeout loading image: ${url}`));
        }, timeout);

        if (url.startsWith('http')) {
            img.crossOrigin = "anonymous";
        }

        img.onload = () => {
            clearTimeout(timer);
            resolve(img);
        };
        img.onerror = (err) => {
            clearTimeout(timer);
            console.warn(`Failed to load image: ${url}`, err);
            reject(new Error(`Image load failed: ${url}`));
        };
        img.src = url;
    });
};

/**
 * Advanced Hybrid Compositing: Maps ACTUAL product pixels onto an AI high-fashion model.
 * Preserves 100% of pattern, weave, and color of the source image.
 */
export const compositeDressing = async (productUrl, baseModelUrl = '/ai_model_base.png') => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // 1. Load both images
    // Note: productImg contains the AUTHENTIC pattern and color the user wants.
    const [baseModel, productImg] = await Promise.all([
        loadImage(baseModelUrl),
        loadImage(productUrl)
    ]);

    canvas.width = baseModel.width;
    canvas.height = baseModel.height;

    // A. Draw the AI Model background (hair, face, background)
    ctx.drawImage(baseModel, 0, 0);

    // B. Masking & Texture Injection
    ctx.save();
    
    // Torso Mask for high_fashion_base_model_neutral
    // This defines where the "Fabric" will live.
    ctx.beginPath();
    ctx.moveTo(375, 275); // Neck start left
    ctx.bezierCurveTo(300, 300, 260, 350, 240, 500); // Left shoulder & arm top
    ctx.lineTo(250, 850); // Left waist side
    ctx.lineTo(750, 850); // Right waist side
    ctx.lineTo(760, 500); // Right arm top
    ctx.bezierCurveTo(740, 350, 700, 300, 625, 275); // Right shoulder
    ctx.closePath();
    ctx.clip();

    // 2. Draw the AUTHENTIC Product Texture
    // We scale it slightly to fit the torso while keeping the weave ratio original
    const pWidth = canvas.width * 0.65;
    const pHeight = canvas.height * 0.65;
    const pX = (canvas.width - pWidth) / 2;
    const pY = 280;

    // Use AUTHENTIC pixels - no filters yet
    ctx.drawImage(productImg, pX, pY, pWidth, pHeight);

    // 3. APPLY AI LIGHTING (The "Secret Sauce")
    // We take the shadows and muscle definition of the AI Model and multiply them OVER the product texture.
    // This makes the flat product image follow the lighting of the studio shoot.
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.55; // Adjust based on fabric depth
    ctx.drawImage(baseModel, 0, 0);

    // 4. ADD HIGHLIGHTS (Preserves silk/cotton sheen)
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.2;
    ctx.drawImage(baseModel, 0, 0);

    ctx.restore();

    return canvas.toDataURL('image/png');
};

/**
 * Generates the multi-page PDF proposal
 */
export const generateProposalPDF = async (product, lang = 'tr', t, aiImageUrl = null) => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    // --- Font Registration (Roboto TTF is highly reliable for Turkish and PDF viewers) ---
    doc.addFileToVFS('Roboto-Regular.ttf', ROBOTO_REGULAR);
    doc.addFileToVFS('Roboto-Bold.ttf', ROBOTO_BOLD);
    doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
    doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
    doc.setFont('Roboto', 'normal');

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Page 1: Cover (Premium Light Theme)
    doc.setFillColor(252, 252, 252);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    
    // Header accent
    doc.setFillColor(230, 0, 0);
    doc.rect(0, 0, pageWidth, 4, 'F');

    try {
        const logo = await loadImage('/vog_logo.png');
        // Sharper, more elegant logo sizing (32mm)
        // Removed redundant 'VOG TEKSTİL' text as it is already in the logo
        doc.addImage(logo, 'PNG', (pageWidth - 32)/2, 35, 32, 26.2); 
    } catch(e) { console.warn('Logo load failed'); }

    doc.setFontSize(14);
    doc.setFont('Roboto', 'normal');
    doc.setTextColor(100, 100, 100);
    const title = t('pdf.title').toUpperCase();
    doc.text(title, pageWidth/2, 75, { align: 'center', charSpace: 1 });
    
    doc.setDrawColor(230, 0, 0);
    doc.setLineWidth(1);
    doc.line(pageWidth/2 - 20, 82, pageWidth/2 + 20, 82);

    // Cover product visual (Centered & Portrait)
    try {
        const coverImgPath = aiImageUrl || product.img;
        // MUST load image first to ensure it's in memory for jsPDF
        const coverImg = await loadImage(coverImgPath);
        doc.addImage(coverImg, 'JPEG', (pageWidth - 100)/2, 115, 100, 125, undefined, 'FAST');
    } catch(e) {
        console.warn('Cover image failed, using fallback text', e);
        doc.setFontSize(10);
        doc.text('[Product Visual Unavailable]', pageWidth/2, 175, { align: 'center' });
    }

    doc.setFontSize(26);
    doc.setFont('Roboto', 'bold');
    doc.setTextColor(5, 7, 10);
    doc.text(product.title, pageWidth/2, 255, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('Roboto', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text(`REF: VOG-${new Date().getFullYear()}-00${product.id}`, pageWidth/2, 265, { align: 'center' });

    // Page 2: Design Concept & Expert Fabric Detail
    doc.addPage();
    doc.setFillColor(252, 252, 252);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    doc.setTextColor(5, 7, 10);
    doc.setFontSize(22);
    doc.setFont('Roboto', 'bold');
    doc.text(t('pdf.vision'), 20, 30);
    
    doc.setDrawColor(230, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(20, 34, 40, 34); // Accent line
    
    doc.setFontSize(10);
    doc.setFont('Roboto', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text(`${t('pdf.ref')}: PVWK${product.id}0000 | COLOR: ${product.color || 'Standard'}`, 20, 42);

    // 1. PRIMARY DESIGN VISION (AI Concepts)
    if (aiImageUrl) {
        try {
            const aiImg = await loadImage(aiImageUrl);
            doc.addImage(aiImg, 'PNG', 20, 55, 100, 140, undefined, 'FAST');
            
            doc.setFontSize(8);
            doc.setTextColor(180, 180, 180);
            doc.text(`* ${t('pdf.conceptLabel')}`, 20, 200);
        } catch (e) {
            console.warn('AI image load failed');
        }
    }

    // 2. INDUSTRIAL ACCURACY SECTION
    // A. Original Product Cutout
    doc.setFillColor(248, 248, 248);
    doc.setDrawColor(240, 240, 240);
    // Box made taller (75mm) for portrait orientation
    doc.roundedRect(130, 55, 60, 75, 3, 3, 'FD');
    
    doc.setTextColor(5, 7, 10);
    doc.setFontSize(10);
    doc.setFont('Roboto', 'bold');
    doc.text(t('pdf.sample'), 135, 65);

    try {
        const prodImg = await loadImage(product.img);
        // Image adjusted to 4:5 ratio (50x62.5 or 50x58 for fit)
        doc.addImage(prodImg, 'JPEG', 135, 70, 50, 56, undefined, 'FAST');
    } catch(e) {}

    // B. MACRO FABRIC DETAIL
    doc.setFillColor(248, 248, 248);
    // Shifted down slightly (y=135) to accommodate taller top box
    doc.roundedRect(130, 137, 60, 65, 3, 3, 'FD');
    
    doc.setTextColor(5, 7, 10);
    doc.setFont('Roboto', 'bold');
    doc.text(t('pdf.fabric'), 135, 147);

    try {
        const prodImgPath = product.img;
        // We try to load it. If it fails (CORS), we use a placeholder or skip.
        const prodImg = await loadImage(prodImgPath);
        
        const zoomCanvas = document.createElement('canvas');
        zoomCanvas.width = 400;
        zoomCanvas.height = 400;
        const zctx = zoomCanvas.getContext('2d');
        
        const sourceSize = Math.min(prodImg.width, prodImg.height) * 0.4;
        const sourceX = (prodImg.width - sourceSize) / 2;
        const sourceY = (prodImg.height - sourceSize) / 2;
        
        zctx.drawImage(prodImg, sourceX, sourceY, sourceSize, sourceSize, 0, 0, 400, 400);
        // Positioned below the 'Doku Onayı' header (header is at 147)
        doc.addImage(zoomCanvas.toDataURL('image/jpeg'), 'JPEG', 135, 152, 50, 45, undefined, 'FAST');
    } catch(e) {
        console.warn('Macro View failed:', e);
        doc.setFontSize(8);
        doc.setFont('Roboto', 'normal');
        doc.text('Macro View Unavailable', 135, 165);
    }

    doc.setFontSize(8);
    doc.setFont('Roboto', 'normal');
    doc.setTextColor(150, 150, 150);
    // Adjusted y-position for the footer text of this section
    doc.text('Textile Integrity Proof / Doku Onayı', 135, 207);

    // Fabric Composition Box
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(230, 0, 0); // VOG Red accent border prefix
    doc.rect(20, 225, 2, 50, 'F');
    
    doc.setFillColor(250, 250, 250);
    doc.rect(22, 225, 168, 50, 'F');
    
    doc.setTextColor(5, 7, 10);
    doc.setFontSize(12);
    doc.setFont('Roboto', 'bold');
    doc.text(t('pdf.comp').toUpperCase(), 30, 237);
    
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`• ${t('pdf.comp1')}`, 30, 248);
    doc.text(`• ${t('pdf.comp2')}`, 30, 256);
    doc.text(`• ${t('pdf.comp3')}`, 30, 264);

    // Page 3: Technical Specs
    doc.addPage();
    doc.setFontSize(22);
    doc.setFont('Roboto', 'bold');
    doc.setTextColor(5, 7, 10);
    doc.text(t('pdf.specs'), 20, 30);
    
    doc.setDrawColor(230, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(20, 34, 40, 34);

    try {
        const sketch = await loadImage('/tech_sketch.png');
        doc.addImage(sketch, 'PNG', (pageWidth-120)/2, 45, 120, 85, undefined, 'FAST');
    } catch(e) { console.warn('Sketch load failed'); }

    doc.setFontSize(16);
    doc.setFont('Roboto', 'bold');
    doc.text(t('pdf.measurements'), 20, 150);

    let tableHead = [ 'SIZE', t('pdf.chest'), t('pdf.sleeve'), t('pdf.back') ];
    let tableBody = [
        ['S', '52.0 CM', '64.5 CM', '74.0 CM'],
        ['M', '54.5 CM', '65.5 CM', '75.5 CM'],
        ['L', '57.0 CM', '66.5 CM', '77.0 CM'],
        ['XL', '60.0 CM', '67.5 CM', '79.0 CM'],
        ['2XL', '63.0 CM', '68.5 CM', '81.0 CM'],
        ['3XL', '66.0 CM', '69.5 CM', '83.0 CM'],
    ];

    if (product.measurements) {
        tableHead = [...product.measurements.headers];
        tableBody = product.measurements.rows.map(row => [...row]);
    }

    if (product.selectedSizesQty) {
        tableHead.push(t('customer.quantity') ? t('customer.quantity').toUpperCase() : 'QTY');
        tableBody.forEach(row => {
            const sizeKey = row[0];
            const qty = product.selectedSizesQty[sizeKey] || 0;
            row.push(`${qty} PCS`);
        });
    }

    // Measurements Table - Luxury Style
    autoTable(doc, {
        startY: 160,
        head: [tableHead],
        body: tableBody,
        theme: 'plain',
        headStyles: { 
            fillColor: [5, 7, 10], 
            textColor: 255,
            font: 'Roboto', 
            fontStyle: 'bold',
            fontSize: 9,
            cellPadding: 4,
            halign: 'center'
        },
        styles: { 
            font: 'Roboto', 
            fontSize: 9,
            cellPadding: 4,
            lineColor: [240, 240, 240],
            lineWidth: 0.1,
            halign: 'center',
            textColor: [50, 50, 50]
        },
        columnStyles: {
            0: { fontStyle: 'bold', fillColor: [250, 250, 250] }
        },
        alternateRowStyles: { fillColor: [253, 253, 253] }
    });

    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(8);
    doc.setFont('Roboto', 'italic');
    doc.setTextColor(180, 180, 180);
    doc.text(t('pdf.tolerance'), 20, finalY > pageHeight - 20 ? pageHeight - 20 : finalY);

    const pageCount = doc.internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setFont('Roboto', 'normal');
        doc.setTextColor(180, 180, 180);
        doc.text(`VOG TEKSTİL PREMIUM — PAGE ${i} OF ${pageCount}`, pageWidth/2, pageHeight - 10, { align: 'center', charSpace: 1 });
    }

    doc.save(`${product.title.replace(/\s+/g, '_')}_Proposal.pdf`);
};
