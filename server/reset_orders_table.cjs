const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'vog_db',
    password: process.env.DB_PASSWORD || '123456',
    port: process.env.DB_PORT || 5432,
});

async function resetOrdersTable() {
    const client = await pool.connect();
    try {
        console.log("Veritabanına bağlanıldı. İşlem başlatılıyor...");
        await client.query('BEGIN');

        console.log("1. Eski orders tablosu siliniyor...");
        await client.query(`DROP TABLE IF EXISTS public.orders CASCADE;`);

        console.log("2. Sequence (numaratör) yeniden oluşturuluyor...");
        await client.query(`CREATE SEQUENCE IF NOT EXISTS public.orders_order_number_seq START WITH 1001;`);

        console.log("3. orders tablosu tıpkı lokaldeki (kusursuz) yapısıyla yeniden oluşturuluyor...");
        await client.query(`
            CREATE TABLE public.orders
            (
                id uuid NOT NULL DEFAULT gen_random_uuid(),
                order_number integer DEFAULT nextval('orders_order_number_seq'::regclass),
                service_center text,
                department text,
                staff_name text,
                sku text,
                product_name text,
                quantity integer,
                status text DEFAULT 'İşlem Bekliyor',
                rfid_tag text,
                brand text,
                estimated_delivery_date text,
                procurement_needed integer DEFAULT 0,
                notes text,
                sub_customer_id uuid REFERENCES public.sub_customers (id) ON DELETE SET NULL,
                sub_customer_name text,
                ean13 text,
                barcode text,
                grup text,
                size text,
                created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT orders_pkey PRIMARY KEY (id)
            )
        `);

        console.log("4. Numaratör tabloya bağlanıyor...");
        await client.query(`ALTER SEQUENCE public.orders_order_number_seq OWNED BY public.orders.order_number;`);

        console.log("5. Trigger (güncelleme tarihi tetikleyicisi) oluşturuluyor...");
        await client.query(`DROP TRIGGER IF EXISTS set_updated_at_orders ON public.orders;`);
        await client.query(`
            CREATE TRIGGER set_updated_at_orders
                BEFORE UPDATE 
                ON public.orders
                FOR EACH ROW
                EXECUTE FUNCTION public.update_updated_at_column();
        `);

        await client.query('COMMIT');
        console.log("✅ İŞLEM BAŞARILI! orders tablosu lokal veritabanınızla %100 aynı yapıya getirildi.");
        console.log("👉 Artık VOG Admin paneline girip 'Excel İçe Aktar' butonunu kullanarak orijinal sipariş excel dosyanızı (siparisler.xlsx) içeri aktarabilirsiniz. Kodlar eksiksiz çalışacaktır.");

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("❌ HATA OLUŞTU:", error);
    } finally {
        client.release();
        await pool.end();
    }
}

resetOrdersTable();
