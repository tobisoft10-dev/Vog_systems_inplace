const mssql = require('mssql');
const { v4: uuidv4 } = require('uuid');

const LOGO_ERP_CONFIG = {
    server: 'DC',
    dbName: 'WINGS',
    user: 'deporfid',
    password: '!1235!',
    firmNo: '225',
    periodNo: '01',
    warehouseNo: 0
};

async function syncOrder16875() {
    const orderId = '16875';
    console.log(`==========================================================================`);
    console.log(`🚀 SYNCING ORDER #${orderId} TO LOGO TIGER ERP WITH DYNAMIC SEQUENTIAL FICHENO`);
    console.log(`==========================================================================\n`);

    try {
        const poolConfig = {
            user: LOGO_ERP_CONFIG.user,
            password: LOGO_ERP_CONFIG.password,
            server: LOGO_ERP_CONFIG.server,
            database: LOGO_ERP_CONFIG.dbName,
            port: 1433,
            options: {
                trustServerCertificate: true,
                connectTimeout: 5000
            }
        };

        const pool = await mssql.connect(poolConfig);

        // 1. Search for existing header in LG_225_01_STFICHE strictly by DOCODE = orderId
        const searchHeader = await pool.request().query(`
            SELECT LOGICALREF, FICHENO, DOCODE, CLIENTREF, SOURCEINDEX 
            FROM LG_225_01_STFICHE 
            WHERE DOCODE = '${orderId}'
        `);

        const existingHeader = searchHeader.recordset[0];
        let stFicheRef;
        let ficheNo;
        const defaultHash = 'g8iN6YXy7PFewlh8H9CoZPq1SgSNF430T5YS5732hvDB7ZvE6wRESiNpGDiFpp1U';
        const curMonth = new Date().getMonth() + 1;
        const curYear = new Date().getFullYear();

        if (existingHeader) {
            stFicheRef = existingHeader.LOGICALREF;
            ficheNo = existingHeader.FICHENO;
            console.log(`🔄 UPDATING EXISTING DISPATCH LOGICALREF = ${stFicheRef} (Fiş No: ${ficheNo})...`);

            await pool.request().query(`
                UPDATE LG_225_01_STFICHE 
                SET DATE_ = CONVERT(datetime, CONVERT(date, GETDATE())), DOCDATE = CONVERT(datetime, CONVERT(date, GETDATE())), FTIME = 36000000, DOCTIME = 171125248,
                    CAPIBLOCK_MODIFIEDBY = 11, CAPIBLOCK_MODIFIEDDATE = GETDATE()
                WHERE LOGICALREF = ${stFicheRef}
            `);

            await pool.request().query(`DELETE FROM LG_225_01_STLINE WHERE STFICHEREF = ${stFicheRef}`);
        } else {
            // Dynamically generate next sequential FICHENO (e.g. IRS2026000012170)
            const prefix = `IRS${curYear}`;
            const maxRes = await pool.request().query(`
                SELECT MAX(FICHENO) AS maxFiche 
                FROM LG_225_01_STFICHE 
                WHERE FICHENO LIKE '${prefix}%'
            `);

            let nextNum = 1;
            if (maxRes.recordset[0] && maxRes.recordset[0].maxFiche) {
                const lastFiche = maxRes.recordset[0].maxFiche;
                const digits = lastFiche.replace(prefix, '');
                const parsed = parseInt(digits, 10);
                if (!isNaN(parsed)) {
                    nextNum = parsed + 1;
                }
            }

            ficheNo = `${prefix}${String(nextNum).padStart(9, '0')}`;
            const headerGuid = uuidv4().toUpperCase();

            // Fetch ClientRef
            const cariRes = await pool.request().query("SELECT TOP 1 LOGICALREF FROM LG_225_CLCARD WHERE CODE = '120.01.0191' OR DEFINITION_ LIKE '%DOĞUŞ OTO PAZARLAMA%'");
            const clientRef = cariRes.recordset[0] ? cariRes.recordset[0].LOGICALREF : 196;

            const insertHeaderSql = `
            INSERT INTO LG_225_01_STFICHE (
                GRPCODE, TRCODE, IOCODE, FICHENO, DATE_, FTIME, DOCODE, SPECODE, CLIENTREF, RECVREF, SOURCEINDEX, 
                CANCELLED, GENEXP1, STATUS, BILLED, EDESPATCH, EDESPSTATUS, PROFILEID, GUID, RECHASH, DOCDATE, DOCTIME,
                CAPIBLOCK_CREATEDBY, CAPIBLOCK_CREADEDDATE, CAPIBLOCK_CREATEDHOUR, CAPIBLOCK_CREATEDMIN, CAPIBLOCK_CREATEDSEC,
                CAPIBLOCK_MODIFIEDBY, CAPIBLOCK_MODIFIEDDATE, CAPIBLOCK_MODIFIEDHOUR, CAPIBLOCK_MODIFIEDMIN, CAPIBLOCK_MODIFIEDSEC,
                GROSSTOTAL, NETTOTAL, TOTALVAT
            ) VALUES (
                2, 8, 3, '${ficheNo}', CONVERT(datetime, CONVERT(date, GETDATE())), 36000000, '${orderId}', 'VOG-RFID', ${clientRef}, ${clientRef}, 0,
                0, 'VOG RFID Koli İrsaliyesi', 0, 0, 0, 0, 0, '${headerGuid}', '${defaultHash}', CONVERT(datetime, CONVERT(date, GETDATE())), 171125248,
                11, GETDATE(), 12, 30, 0, 11, GETDATE(), 12, 30, 0,
                0.00, 0.00, 0.00
            );
            SELECT SCOPE_IDENTITY() AS NewId;
            `;

            const hRes = await pool.request().query(insertHeaderSql);
            stFicheRef = hRes.recordset[0].NewId;
            console.log(`🎉 NEW WAYBILL HEADER CREATED: LOGICALREF = ${stFicheRef}, DYNAMIC FİÇ NO = ${ficheNo}`);
        }

        // Insert lines
        const items = [
            { stockRef: 667, name: 'SKODA TEKNİSYEN MONTSU 2026', qty: 7 },
            { stockRef: 668, name: 'SKODA SERVİS PANTOLONU', qty: 5 }
        ];

        let lineNo = 1;
        for (const item of items) {
            const lineGuid = uuidv4().toUpperCase();
            const cleanName = item.name.replace(/'/g, "''");
            const insertLineSql = `
            INSERT INTO LG_225_01_STLINE (
                STFICHEREF, STFICHELNNO, TRCODE, IOCODE, LINETYPE, STOCKREF, CLIENTREF, DATE_, FTIME, UOMREF, USREF, UINFO1, UINFO2,
                AMOUNT, PRICE, TOTAL, VAT, VATAMNT, LINENET, LINEEXP, MONTH_, YEAR_, DETLINE, GLOBTRANS, CALCTYPE, BILLED, CANCELLED, GUID
            ) VALUES (
                ${stFicheRef}, ${lineNo}, 8, 3, 0, ${item.stockRef}, 196, CONVERT(datetime, CONVERT(date, GETDATE())), 36000000, 24, 6, 1, 1, ${item.qty}, 0.00, 0.00, 10, 0.00, 0.00, '${cleanName}', ${curMonth}, ${curYear}, 0, 0, 0, 0, 0, '${lineGuid}'
            );
            `;
            await pool.request().query(insertLineSql);
            lineNo++;
        }

        console.log(`🎉 SUCCESS! Inserted ${items.length} line items into LG_225_01_STLINE for Header ${stFicheRef}!`);

        // Check inserted fiche in LOGO
        const ficheRes = await pool.request().query(`SELECT LOGICALREF, FICHENO, DOCODE, GRPCODE, TRCODE, IOCODE, CLIENTREF, STATUS, EDESPATCH, DATE_, DOCDATE FROM LG_225_01_STFICHE WHERE LOGICALREF = ${stFicheRef}`);
        console.log("\n📊 VERİTABANINA YAZILAN YENİ İRSALİYE KARTI:");
        console.log(ficheRes.recordset[0]);

        await pool.close();
    } catch(e) {
        console.error("Error:", e.message);
    }
}

syncOrder16875().catch(console.error);
