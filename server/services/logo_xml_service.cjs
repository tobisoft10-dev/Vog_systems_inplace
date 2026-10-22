const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function cleanTurkishForLogoXml(str = '') {
    if (!str) return '';
    return str.toString()
        .replace(/İ/g, 'I')
        .replace(/ı/g, 'i')
        .replace(/Ş/g, 'S')
        .replace(/ş/g, 's')
        .replace(/Ğ/g, 'G')
        .replace(/ğ/g, 'g')
        .replace(/Ç/g, 'C')
        .replace(/ç/g, 'c')
        .replace(/Ö/g, 'O')
        .replace(/ö/g, 'o')
        .replace(/Ü/g, 'U')
        .replace(/ü/g, 'u')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
        .trim();
}

function formatLogoDate(dateObj = new Date()) {
    const d = ('0' + dateObj.getDate()).slice(-2);
    const m = ('0' + (dateObj.getMonth() + 1)).slice(-2);
    const y = dateObj.getFullYear();
    return `${d}.${m}.${y}`;
}

// Brand to Logo Cari Kodu mapping tablosu (LG_225_CLCARD)
const BRAND_TO_LOGO_ARP = {
    'VOLKSWAGEN': '120.01.0191',
    'VW': '120.01.0191',
    'AUDI': '120.01.0191',
    'SKODA': '120.01.0191',
    'SEAT': '120.01.0191',
    'CUPRA': '120.01.0191',
    'NISSAN': '120.01.1374', // NİSSAN OTOMOTİV A.Ş.
    'PORSCHE': '120.01.0191',
    'FORD': '120.01.0191',
    'ACIBADEM': '120.01.0003',
    'REDCELL': '120.01.0001',
    'GENEL': '120.01.0191'
};

/**
 * Generate 100% Logo Tiger Wings Native XML (Matches Logo Export Schema)
 */
function generateLogoDispatchXml(order = {}, lineItems = []) {
    try {
        const orderNumber = (order.order_number || order.orderId || order.id || 'GENEL').toString();
        const brand = (order.brand || 'GENEL').toUpperCase().trim();
        const arpCode = order.arp_code || BRAND_TO_LOGO_ARP[brand] || '120.01.0191';
        const docNumber = orderNumber.replace(/[^0-9A-Za-z]/g, '');

        const now = new Date();
        const dateStr = formatLogoDate(now);
        const curMonth = now.getMonth() + 1;
        const curYear = now.getFullYear();

        let lines = [];
        if (Array.isArray(lineItems) && lineItems.length > 0) {
            lines = lineItems;
        } else {
            lines = [{
                item_code: 'FASON.TSHIRT',
                master_def: 'T-SHIRT',
                description: `${docNumber} - ` + (order.product_name || order.model || `${brand} Tekstil Urunu`),
                quantity: parseFloat(order.quantity || order.total_qty || 1),
                price: parseFloat(order.price || 0),
                unit_code: 'ADET',
                vat_rate: 10
            }];
        }

        let transactionNodes = '';
        lines.forEach((ln) => {
            let itemCode = (ln.item_code || ln.sku || '').trim();
            if (!itemCode || (!itemCode.startsWith('153.') && !itemCode.startsWith('FASON.') && !itemCode.includes('.'))) {
                itemCode = 'FASON.TSHIRT';
            }
            itemCode = cleanTurkishForLogoXml(itemCode);
            const masterDef = cleanTurkishForLogoXml(ln.master_def || 'T-SHIRT');
            const desc = cleanTurkishForLogoXml(ln.description || `${docNumber} - VOG Tekstil Urunu`);
            const qty = parseFloat(ln.quantity || 1) || 1;
            const price = parseFloat(ln.price || 0) || 0;
            const total = qty * price;
            const vat = ln.vat_rate || 10;
            const lineGuid = crypto.randomUUID().toUpperCase();

            transactionNodes += `
      <TRANSACTION>
        <TYPE>0</TYPE>
        <MASTER_CODE>${itemCode}</MASTER_CODE>
        <QUANTITY>${qty}</QUANTITY>
        <PRICE>${price.toFixed(2)}</PRICE>
        <TOTAL>${total.toFixed(2)}</TOTAL>
        <DESCRIPTION>${desc}</DESCRIPTION>
        <UNIT_CODE>ADET</UNIT_CODE>
        <UNIT_CONV1>1</UNIT_CONV1>
        <UNIT_CONV2>1</UNIT_CONV2>
        <VAT_RATE>${vat}</VAT_RATE>
        <PROJECT_CODE>${docNumber}</PROJECT_CODE>
        <MONTH>${curMonth}</MONTH>
        <YEAR>${curYear}</YEAR>
        <ADD_TAX_EFFECT_KDV>1</ADD_TAX_EFFECT_KDV>
        <AFFECT_RISK>1</AFFECT_RISK>
        <UNIT_GLOBAL_CODE>EA</UNIT_GLOBAL_CODE>
        <GUID>${lineGuid}</GUID>
        <MASTER_DEF>${masterDef}</MASTER_DEF>
        <FOREIGN_TRADE_TYPE>0</FOREIGN_TRADE_TYPE>
        <DISTRIBUTION_TYPE_WHS>0</DISTRIBUTION_TYPE_WHS>
        <DISTRIBUTION_TYPE_FNO>0</DISTRIBUTION_TYPE_FNO>
      </TRANSACTION>`;
        });

        const notes1 = cleanTurkishForLogoXml(`${docNumber} VOG RFID Koli Irsaliyesi`);
        const notes2 = cleanTurkishForLogoXml(order.sub_customer_name || order.musteri_adi || brand);
        const headerGuid = crypto.randomUUID().toUpperCase();

        const xmlContent = `<?xml version="1.0" encoding="ISO-8859-9"?>
<SALES_DISPATCHES>
  <DISPATCH DBOP="INS">
    <TYPE>8</TYPE>
    <NUMBER></NUMBER>
    <DOC_NUMBER>${docNumber}</DOC_NUMBER>
    <DATE>${dateStr}</DATE>
    <TIME>254490698</TIME>
    <ARP_CODE>${arpCode}</ARP_CODE>
    <GL_CODE>${arpCode}</GL_CODE>
    <NOTES1>${notes1}</NOTES1>
    <NOTES2>${notes2}</NOTES2>
    <SOURCE_WH>0</SOURCE_WH>
    <DEDUCTIONPART1>2</DEDUCTIONPART1>
    <DEDUCTIONPART2>3</DEDUCTIONPART2>
    <AFFECT_RISK>1</AFFECT_RISK>
    <DISP_STATUS>1</DISP_STATUS>
    <GUID>${headerGuid}</GUID>
    <SHIP_DATE>${dateStr}</SHIP_DATE>
    <SHIP_TIME>254490698</SHIP_TIME>
    <DOC_DATE>${dateStr}</DOC_DATE>
    <DOC_TIME>254490698</DOC_TIME>
    <EDESPATCH>0</EDESPATCH>
    <EDESPATCH_PROFILEID>0</EDESPATCH_PROFILEID>
    <EDESPATCH_STATUS>0</EDESPATCH_STATUS>
    <EINVOICE>1</EINVOICE>
    <EINVOICE_PROFILEID>0</EINVOICE_PROFILEID>
    <TRANSACTIONS>${transactionNodes}
    </TRANSACTIONS>
  </DISPATCH>
</SALES_DISPATCHES>
`;

        const fileName = `DISPATCH_${docNumber}_${Date.now()}.XML`;

        // 1. Save to local outbox
        const localOutboxDir = path.resolve(__dirname, '../../logo_xml_outbox');
        if (!fs.existsSync(localOutboxDir)) {
            fs.mkdirSync(localOutboxDir, { recursive: true });
        }
        const localPath = path.join(localOutboxDir, fileName);
        fs.writeFileSync(localPath, xmlContent, 'latin1');

        // 2. Save to DC shared XML_INBOX folder
        const dcInboxDir = '\\\\DC\\Logo\\XML_INBOX';
        let dcPath = null;
        let dcCopied = false;

        try {
            if (!fs.existsSync(dcInboxDir)) {
                fs.mkdirSync(dcInboxDir, { recursive: true });
            }
            dcPath = path.join(dcInboxDir, fileName);
            fs.writeFileSync(dcPath, xmlContent, 'latin1');
            dcCopied = true;
        } catch (dcErr) {
            console.warn(`⚠️ [LOGO XML SERVICE] Could not write directly to DC folder [${dcInboxDir}]:`, dcErr.message);
        }

        console.log(`✅ [LOGO XML SERVICE] Generated exact native XML for Order #${docNumber}: ${fileName} (DC Synced: ${dcCopied})`);

        return {
            success: true,
            fileName,
            localPath,
            dcPath,
            dcCopied,
            docNumber,
            xmlContent
        };
    } catch (err) {
        console.error('❌ [LOGO XML SERVICE ERROR]:', err.message);
        return {
            success: false,
            error: err.message
        };
    }
}

module.exports = {
    generateLogoDispatchXml,
    formatLogoDate,
    BRAND_TO_LOGO_ARP
};
