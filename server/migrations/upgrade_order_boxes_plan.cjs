const { Pool } = require('c:/vog_system/server/node_modules/pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/vog_db'
});

async function migrate() {
  console.log('🚀 Running order_boxes migration for Koli Planlama...');

  await pool.query(`
    DO $$ 
    BEGIN 
      -- 1. target_quantity
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_boxes' AND column_name='target_quantity') THEN
        ALTER TABLE order_boxes ADD COLUMN target_quantity INTEGER DEFAULT 0;
        RAISE NOTICE 'Added column target_quantity to order_boxes';
      END IF;

      -- 2. items_plan
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_boxes' AND column_name='items_plan') THEN
        ALTER TABLE order_boxes ADD COLUMN items_plan JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Added column items_plan to order_boxes';
      END IF;

      -- 3. notes
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_boxes' AND column_name='notes') THEN
        ALTER TABLE order_boxes ADD COLUMN notes TEXT;
        RAISE NOTICE 'Added column notes to order_boxes';
      END IF;

      -- 4. plan_type
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_boxes' AND column_name='plan_type') THEN
        ALTER TABLE order_boxes ADD COLUMN plan_type TEXT DEFAULT 'MANUAL';
        RAISE NOTICE 'Added column plan_type to order_boxes';
      END IF;

      -- 5. orders table: has_box_plan flag if not exists
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='has_box_plan') THEN
        ALTER TABLE orders ADD COLUMN has_box_plan BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added column has_box_plan to orders';
      END IF;
    END $$;
  `);

  console.log('✅ order_boxes and orders migration completed successfully.');
  await pool.end();
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
