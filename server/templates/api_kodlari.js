app.get('/api/print-label/:order_id', async (req, res) => {
    try {
        const orderId = req.params.order_id;
        
        let query = `
            SELECT barcode, COUNT(id) as qty
            FROM tunnel_scans
            WHERE (order_id::text = $1)
            GROUP BY barcode
        `;
        
        const result = await pool.query(query, [orderId]);
        const items = result.rows;
        
        let totalQty = 0;
        let productRowsHtml = "";
        
        items.forEach(item => {
            const qty = parseInt(item.qty, 10);
            totalQty += qty;
            productRowsHtml += `
                <tr>
                    <td>${item.barcode || 'Bilinmiyor'}</td>
                    <td>Ürün / Parça</td>
                    <td class="qty">${qty}</td>
                </tr>
            `;
        });
        
        if (items.length === 0) {
            productRowsHtml = `<tr><td colspan="3" style="text-align:center;">Kayıt bulunamadı.</td></tr>`;
        }

        const templatePath = path.join(__dirname, 'templates', 'koli_etiketi.html');
        if (!fs.existsSync(templatePath)) {
            return res.status(500).send("Etiket şablonu (template) bulunamadı.");
        }
        
        let htmlContent = fs.readFileSync(templatePath, 'utf8');
        htmlContent = htmlContent.replace(/{{ORDER_ID}}/g, orderId);
        htmlContent = htmlContent.replace(/{{BARCODE_STRING}}/g, `${orderId}-PASS-TR`);
        htmlContent = htmlContent.replace(/{{PRODUCT_ROWS}}/g, productRowsHtml);
        htmlContent = htmlContent.replace(/{{TOTAL_QTY}}/g, totalQty);
        
        res.send(htmlContent);
    } catch (error) {
        console.error("Print label error:", error);
        res.status(500).send("Sunucu hatası: " + error.message);
    }
});
