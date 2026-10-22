const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/.env' });

console.log('🔍 Remote Server - Backend Debug Diagnostics...');
console.log('📂 Directory:', __dirname);
console.log('⚙️ Environment Variables Loaded:');
console.log('  - DB_USER:', process.env.DB_USER);
console.log('  - DB_HOST:', process.env.DB_HOST);
console.log('  - DB_PORT:', process.env.DB_PORT);
console.log('  - DB_NAME:', process.env.DB_NAME);
console.log('  - PORT:', process.env.PORT || 3001);

console.log('\n1. Testing PostgreSQL connection...');
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    connectionTimeoutMillis: 5000
});

pool.connect()
    .then(client => {
        console.log('✅ PostgreSQL connection successful!');
        return client.query('SELECT version()')
            .then(res => {
                console.log('📊 Postgres version:', res.rows[0].version);
                client.release();
                
                console.log('\n2. Testing backend app requirements...');
                try {
                    require('./app.js');
                    console.log('✅ app.js parsed successfully (No syntax or import errors).');
                    process.exit(0);
                } catch (err) {
                    console.error('❌ Failed to require/run app.js:', err.message);
                    console.error(err.stack);
                    process.exit(1);
                }
            });
    })
    .catch(err => {
        console.error('❌ PostgreSQL connection failed!');
        console.error(err.message);
        console.error('\nPlease verify that PostgreSQL is running on the remote server and that the credentials in server/.env match.');
        process.exit(1);
    });
