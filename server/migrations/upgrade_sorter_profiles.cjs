const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function upgradeSorterProfiles() {
    console.log('🚀 Starting Sorter Profiles database migration...');
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Sorter Global Settings Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS sorter_settings (
                id SERIAL PRIMARY KEY,
                key VARCHAR(100) NOT NULL UNIQUE,
                value TEXT NOT NULL,
                description TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Insert Default Settings if not exists
        const defaultSettings = [
            { key: 'active_profile', value: 'PROFILE_BRAND_DEALER', desc: 'Active Sorter Profile Mode (1-5)' },
            { key: 'max_chute_capacity', value: '25', desc: 'Default maximum item capacity per chute/box' },
            { key: 'error_chute', value: '60', desc: 'Default error/unassigned inspection chute (B4-3)' },
            { key: 'auto_print_on_full', value: 'true', desc: 'Auto print box label when chute capacity is reached' },
            { key: 'auto_reset_on_label', value: 'true', desc: 'Auto reset chute counter after box label is printed' }
        ];

        for (const s of defaultSettings) {
            await client.query(`
                INSERT INTO sorter_settings (key, value, description)
                VALUES ($1, $2, $3)
                ON CONFLICT (key) DO NOTHING;
            `, [s.key, s.value, s.desc]);
        }
        console.log('✅ sorter_settings table initialized.');

        // 2. Upgrade sorter_mappings table
        await client.query(`
            CREATE TABLE IF NOT EXISTS sorter_mappings (
                id SERIAL PRIMARY KEY,
                destination_name VARCHAR(255) NOT NULL,
                chute_no INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Drop UNIQUE constraint on destination_name if it exists to allow cascade/multiple chutes per destination
        await client.query(`
            ALTER TABLE sorter_mappings DROP CONSTRAINT IF EXISTS sorter_mappings_destination_name_key;
        `);

        // Add new columns if not exist
        await client.query(`
            ALTER TABLE sorter_mappings 
            ADD COLUMN IF NOT EXISTS match_type VARCHAR(50) DEFAULT 'DEALER',
            ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 1,
            ADD COLUMN IF NOT EXISTS target_capacity INTEGER DEFAULT 25,
            ADD COLUMN IF NOT EXISTS current_count INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'ACTIVE';
        `);
        console.log('✅ sorter_mappings table upgraded with multi-chute and match_type columns.');

        // 3. Sorter Chute Live State Table (1 to 60)
        await client.query(`
            CREATE TABLE IF NOT EXISTS sorter_chute_state (
                chute_no INTEGER PRIMARY KEY,
                physical_code VARCHAR(50) NOT NULL,
                assigned_destination VARCHAR(255) DEFAULT '---',
                match_type VARCHAR(50) DEFAULT 'DEALER',
                item_count INTEGER DEFAULT 0,
                target_capacity INTEGER DEFAULT 25,
                status VARCHAR(50) DEFAULT 'standby',
                last_barcode VARCHAR(255),
                last_sku VARCHAR(255),
                last_product_name VARCHAR(255),
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        const chToPhysicalMap = {
            1: 'A0-1', 2: 'A0-2', 3: 'A0-3', 4: 'A0-4', 5: 'A0-5', 6: 'A0-6',
            7: 'B0-1', 8: 'B0-2', 9: 'B0-3', 10: 'B0-4', 11: 'B0-5', 12: 'B0-6',
            13: 'A1-1', 14: 'A1-2', 15: 'A1-3', 16: 'A1-4', 17: 'A1-5', 18: 'A1-6', 19: 'A1-7', 20: 'A1-8', 21: 'A1-9',
            22: 'B1-1', 23: 'B1-2', 24: 'B1-3', 25: 'B1-4', 26: 'B1-5', 27: 'B1-6', 28: 'B1-7', 29: 'B1-8', 30: 'B1-9',
            31: 'A2-1', 32: 'A2-2', 33: 'A2-3',
            34: 'A3-1', 35: 'A3-2', 36: 'A3-3', 37: 'A3-4', 38: 'A3-5', 39: 'A3-6', 40: 'A3-7', 41: 'A3-8', 42: 'A3-9',
            43: 'B3-1', 44: 'B3-2', 45: 'B3-3', 46: 'B3-4', 47: 'B3-5', 48: 'B3-6', 49: 'B3-7', 50: 'B3-8', 51: 'B3-9',
            52: 'A4-1', 53: 'A4-2', 54: 'A4-3', 55: 'A4-4', 56: 'A4-5', 57: 'A4-6',
            58: 'B4-1', 59: 'B4-2', 60: 'B4-3'
        };

        for (let i = 1; i <= 60; i++) {
            const phys = chToPhysicalMap[i] || `CH-${i.toString().padStart(2, '0')}`;
            await client.query(`
                INSERT INTO sorter_chute_state (chute_no, physical_code, target_capacity, status)
                VALUES ($1, $2, 25, 'standby')
                ON CONFLICT (chute_no) DO UPDATE SET physical_code = $2;
            `, [i, phys]);
        }
        console.log('✅ sorter_chute_state (60 chutes) initialized.');

        await client.query('COMMIT');
        console.log('🎉 Sorter Profiles database migration COMPLETED successfully!');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Migration error:', err);
        throw err;
    } finally {
        client.release();
        await pool.end();
    }
}

upgradeSorterProfiles();
