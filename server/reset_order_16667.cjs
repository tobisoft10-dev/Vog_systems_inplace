const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/.env' });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function resetOrder16667() {
    console.log('🔄 Resetting Order #16667...');
    try {
        await pool.query('DELETE FROM vouchers WHERE order_id = 16667');
        await pool.query('DELETE FROM sales WHERE order_id = 16667');
        await pool.query('DELETE FROM tunnel_scans WHERE order_id = 16667');

        const ordRes = await pool.query(
            `UPDATE orders 
             SET status = 'İşlem Bekliyor', 
                 processed_quantity = 0, 
                 remaining_quantity = quantity, 
                 updated_at = CURRENT_TIMESTAMP 
             WHERE order_number = 16667 OR id::text = '16667'
             RETURNING *`
        );

        console.log('✅ Order #16667 has been completely reset.');
        if (ordRes.rows.length > 0) {
            console.log('Order status:', ordRes.rows[0].status, '| Quantity:', ordRes.rows[0].quantity, '| Processed:', ordRes.rows[0].processed_quantity, '| Remaining:', ordRes.rows[0].remaining_quantity);
        } else {
            console.log('⚠️ Order #16667 entry not found in orders table, check ID.');
        }
    } catch (e) {
        console.error('❌ Error resetting order #16667:', e.message);
    } finally {
        await pool.end();
    }
}

resetOrder16667();
