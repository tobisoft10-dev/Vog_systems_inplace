const http = require('http');
const net = require('net');
const { execSync } = require('child_process');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

async function runDiagnostics() {
  const report = {
    timestamp: new Date().toISOString(),
    system: {
      hostname: require('os').hostname(),
      platform: process.platform,
      arch: process.arch,
      node_version: process.version,
      cpu_count: require('os').cpus().length,
      free_mem_mb: Math.round(require('os').freemem() / 1024 / 1024),
      total_mem_mb: Math.round(require('os').totalmem() / 1024 / 1024)
    },
    pm2Services: [],
    printersSpooler: {},
    databasePostgreSQL: {},
    apiHealth: {},
    hardwareNetwork: {}
  };

  // 1. PM2 Services Check
  try {
    const pm2Output = execSync('pm2 jlist').toString();
    const pm2List = JSON.parse(pm2Output);
    report.pm2Services = pm2List.map(p => ({
      name: p.name,
      status: p.pm2_env.status,
      uptime_sec: Math.floor((Date.now() - p.pm2_env.pm_uptime) / 1000),
      restarts: p.pm2_env.restart_time,
      memory_mb: Math.round(p.monit.memory / 1024 / 1024),
      cpu_percent: p.monit.cpu
    }));
  } catch (e) {
    report.pm2Services_error = e.message;
  }

  // 2. Windows Print Spooler (ZERO PRINT)
  try {
    const satoJobs = execSync("powershell -Command \"(Get-PrintJob -PrinterName 'SATO CL4NX Plus' -ErrorAction SilentlyContinue).Count\"").toString().trim();
    const godexJobs = execSync("powershell -Command \"(Get-PrintJob -PrinterName 'Godex G530' -ErrorAction SilentlyContinue).Count\"").toString().trim();
    report.printersSpooler = {
      sato_cl4nx_plus_active_jobs: parseInt(satoJobs || '0', 10),
      godex_g530_active_jobs: parseInt(godexJobs || '0', 10),
      status: (parseInt(satoJobs || '0', 10) === 0 && parseInt(godexJobs || '0', 10) === 0) ? 'CLEAR (ZERO PRINT SAFE)' : 'JOBS PENDING'
    };
  } catch (e) {
    report.printersSpooler = { error: e.message };
  }

  // 3. PostgreSQL Database Check
  try {
    const pool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'vog_db',
      password: process.env.DB_PASSWORD || '!719356Qse!',
      port: process.env.DB_PORT || 5432,
      connectionTimeoutMillis: 3000
    });
    const orderCountRes = await pool.query('SELECT COUNT(*) as total_orders FROM orders');
    const order16693 = await pool.query("SELECT id, order_number, brand, product_name, status, quantity FROM orders WHERE order_number = '16693' LIMIT 1");
    const scannedTagsRes = await pool.query('SELECT COUNT(*) as total_scans FROM rfid_tags');
    report.databasePostgreSQL = {
      connected: true,
      database: process.env.DB_NAME || 'vog_db',
      total_orders_records: parseInt(orderCountRes.rows[0].total_orders, 10),
      sample_order_16693: order16693.rows[0] || null,
      total_rfid_tags_scanned: parseInt(scannedTagsRes.rows[0].total_scans, 10)
    };
    await pool.end();
  } catch (e) {
    report.databasePostgreSQL = { connected: false, error: e.message };
  }

  // 4. API Endpoints Check
  const checkEndpoint = (path) => new Promise((resolve) => {
    const start = Date.now();
    const req = http.get(`http://localhost:3001${path}`, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        resolve({
          path,
          statusCode: res.statusCode,
          latencyMs: Date.now() - start,
          ok: res.statusCode >= 200 && res.statusCode < 400,
          preview: data.substring(0, 100)
        });
      });
    });
    req.on('error', (err) => resolve({ path, ok: false, error: err.message }));
    req.setTimeout(3000, () => {
      req.destroy();
      resolve({ path, ok: false, error: 'TIMEOUT' });
    });
  });

  report.apiHealth.orderDetail16693 = await checkEndpoint('/api/orders/detail/16693');
  report.apiHealth.printerActiveJobStatus = await checkEndpoint('/api/printer/active-job-status');
  report.apiHealth.nemotronStatus = await checkEndpoint('/api/ai/nemotron/status');

  // 5. Hardware Network Connectivity
  const checkSocket = (host, port) => new Promise((resolve) => {
    const sock = new net.Socket();
    sock.setTimeout(1500);
    sock.on('connect', () => {
      sock.destroy();
      resolve({ host, port, status: 'OPEN / REACHABLE' });
    });
    sock.on('timeout', () => {
      sock.destroy();
      resolve({ host, port, status: 'TIMEOUT' });
    });
    sock.on('error', (err) => {
      resolve({ host, port, status: 'UNREACHABLE / ' + err.code });
    });
    sock.connect(port, host);
  });

  report.hardwareNetwork.impinjReader = await checkSocket(process.env.IMPINJ_IP || '192.168.1.79', 5084);
  report.hardwareNetwork.hcSorter = await checkSocket('192.168.1.234', 4000);

  console.log(JSON.stringify(report, null, 2));
}

runDiagnostics();
