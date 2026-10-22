const fs = require('fs');
const { execSync } = require('child_process');

const items = [
    // 16 Taşıma Arabası (Ana Etiketler)
    { code: 'R01', type: 'CART', label: 'TASIMA ARABASI - R01 (9 GOZ)' },
    { code: 'R02', type: 'CART', label: 'TASIMA ARABASI - R02 (9 GOZ)' },
    { code: 'R03', type: 'CART', label: 'TASIMA ARABASI - R03 (9 GOZ)' },
    { code: 'R04', type: 'CART', label: 'TASIMA ARABASI - R04 (9 GOZ)' },
    { code: 'R05', type: 'CART', label: 'TASIMA ARABASI - R05 (9 GOZ)' },
    { code: 'R06', type: 'CART', label: 'TASIMA ARABASI - R06 (9 GOZ)' },
    { code: 'R07', type: 'CART', label: 'TASIMA ARABASI - R07 (9 GOZ)' },
    { code: 'R08', type: 'CART', label: 'TASIMA ARABASI - R08 (9 GOZ)' },
    { code: 'R09', type: 'CART', label: 'TASIMA ARABASI - R09 (6 GOZ)' },
    { code: 'R10', type: 'CART', label: 'TASIMA ARABASI - R10 (6 GOZ)' },
    { code: 'R11', type: 'CART', label: 'TASIMA ARABASI - R11 (6 GOZ)' },
    { code: 'R12', type: 'CART', label: 'TASIMA ARABASI - R12 (6 GOZ)' },
    { code: 'R13', type: 'CART', label: 'TASIMA ARABASI - R13 (6 GOZ)' },
    { code: 'R14', type: 'CART', label: 'TASIMA ARABASI - R14 (6 GOZ)' },
    { code: 'R15', type: 'CART', label: 'TASIMA ARABASI - R15 (6 GOZ)' },
    { code: 'R16', type: 'CART', label: 'TASIMA ARABASI - R16 (6 GOZ)' },

    // 8 Duvar Modülü
    { code: 'M145-WALL-A-0', type: 'WALL', label: 'BOLUM 1 (SOL DIS) - Z-A0-1 [6 GOZ]' },
    { code: 'M145-WALL-B-0', type: 'WALL', label: 'BOLUM 3 (SAG IC) - Z-B0-1 [6 GOZ]' },
    { code: 'M145-WALL-A-1', type: 'WALL', label: 'BOLUM 1 (SOL DIS) - Z-A1-1 [9 GOZ]' },
    { code: 'M145-WALL-B-1', type: 'WALL', label: 'BOLUM 3 (SAG IC) - Z-B1-1 [9 GOZ]' },
    { code: 'M145-WALL-A-3', type: 'WALL', label: 'BOLUM 2 (SOL IC) - Z-A3-1 [9 GOZ]' },
    { code: 'M145-WALL-B-3', type: 'WALL', label: 'BOLUM 4 (SAG DIS) - Z-B3-1 [9 GOZ]' },
    { code: 'M145-WALL-A-4', type: 'WALL', label: 'BOLUM 2 (SOL IC) - Z-A4-1 [6 GOZ]' },
    { code: 'M145-WALL-B-4', type: 'WALL', label: 'BOLUM 4 (SAG DIS) - Z-B4-1 [6 GOZ]' },

    // 120 Araba Göz Barkodları (R01.1 .. R08.9 & R09.1 .. R16.6)
    ...(() => {
        const list = [];
        for (let c = 1; c <= 8; c++) {
            const cartStr = `R${c.toString().padStart(2, '0')}`;
            for (let k = 1; k <= 9; k++) {
                let kat = 1;
                if (k >= 7) kat = 3;
                else if (k >= 4) kat = 2;
                list.push({
                    code: `${cartStr}.${k}`,
                    type: 'CHUTE',
                    cart: cartStr,
                    label: `ARABA ${cartStr} - GOZ ${k} (KAT ${kat})`
                });
            }
        }
        for (let c = 9; c <= 16; c++) {
            const cartStr = `R${c.toString().padStart(2, '0')}`;
            for (let k = 1; k <= 6; k++) {
                let kat = 1;
                if (k >= 5) kat = 3;
                else if (k >= 3) kat = 2;
                list.push({
                    code: `${cartStr}.${k}`,
                    type: 'CHUTE',
                    cart: cartStr,
                    label: `ARABA ${cartStr} - GOZ ${k} (KAT ${kat})`
                });
            }
        }
        return list;
    })()
];

function cleanThermalText(str) {
    if (!str) return '';
    return str
        .replace(/Ğ/g, 'G').replace(/ğ/g, 'g')
        .replace(/Ü/g, 'U').replace(/ü/g, 'u')
        .replace(/Ş/g, 'S').replace(/ş/g, 's')
        .replace(/İ/g, 'I').replace(/ı/g, 'i')
        .replace(/Ö/g, 'O').replace(/ö/g, 'o')
        .replace(/Ç/g, 'C').replace(/ç/g, 'c')
        .replace(/[^\x20-\x7E]/g, '')
        .trim();
}

function buildEpcHex(code, type) {
    const prefix = type === 'WALL' ? 'E280AA0000000000' : 'E280CA0000000000';
    const codeHex = Buffer.from(code.replace(/[^A-Z0-9-.]/gi, '')).toString('hex').toUpperCase();
    return (prefix + codeHex).padEnd(24, '0').substring(0, 24);
}

function generateCartLabelZpl(item) {
    const isCart = item.type === 'CART';
    const isChute = item.type === 'CHUTE';
    const subTitle = isChute 
        ? 'VOG OMNISORT - ARABA GOZU' 
        : (isCart ? 'VOG OTOMASYON - TASIMA ARABASI' : 'VOG OMNISORT - DUVAR MODULU');
    const desc = cleanThermalText(item.label || item.code);
    const code = cleanThermalText(item.code);
    const epcHex = buildEpcHex(code, item.type);

    if (isChute) {
        return `^XA
~SD25
^MD15
^PR3,3,3
^PW580
^LL310
^PON
^LH10,10
^RS8,,,1^FS
^RFW,H^FD${epcHex}^FS

^FO20,15^A0N,22,22^FD${subTitle}^FS
^FO20,42^GB520,2,2^FS

^FO20,54^A0N,64,64^FD${code}^FS
^FO210,68^A0N,20,20^FD${desc}^FS

^FO35,130^BY3,3,85^BCN,85,Y,N,N^FD${code}^FS

^FO20,265^A0N,18,18^FDRFID EPC: ${epcHex}^FS
^XZ\n`;
    } else if (isCart) {
        return `^XA
~SD25
^MD15
^PR3,3,3
^PW580
^LL310
^PON
^LH10,10
^RS8,,,1^FS
^RFW,H^FD${epcHex}^FS

^FO20,15^A0N,22,22^FD${subTitle}^FS
^FO20,42^GB520,2,2^FS

^FO20,54^A0N,64,64^FD${code}^FS
^FO200,68^A0N,22,22^FD${desc}^FS

^FO35,130^BY3,3,85^BCN,85,Y,N,N^FD${code}^FS

^FO20,265^A0N,18,18^FDRFID EPC: ${epcHex}^FS
^XZ\n`;
    } else {
        return `^XA
~SD25
^MD15
^PR3,3,3
^PW580
^LL310
^PON
^LH10,10
^RS8,,,1^FS
^RFW,H^FD${epcHex}^FS

^FO20,15^A0N,22,22^FD${subTitle}^FS
^FO20,42^GB520,2,2^FS

^FO20,54^A0N,38,38^FD${code}^FS
^FO20,96^A0N,20,20^FD${desc}^FS

^FO30,130^BY2,3,85^BCN,85,Y,N,N^FD${code}^FS

^FO20,265^A0N,18,18^FDRFID EPC: ${epcHex}^FS
^XZ\n`;
    }
}

let fullZpl = items.map(generateCartLabelZpl).join('\n');

fs.writeFileSync('c:/vog_system/server/cart_labels.zpl', fullZpl);
console.log('✅ Generated cart_labels.zpl (24 labels)');

// Create PowerShell Direct Spooler Script
const psScript = `
$printer = Get-Printer | Where-Object { $_.Name -like "*SATO*" } | Select-Object -First 1
if (-not $printer) {
    Write-Error "SATO yazıcı bulunamadı!"
    exit 1
}

$printerName = $printer.Name
Write-Host "🖨️ Hedef SATO Yazıcı: $printerName"

$zplContent = Get-Content -Raw -Path "c:\\vog_system\\server\\cart_labels.zpl" -Encoding UTF8

$code = @"
using System;
using System.Runtime.InteropServices;

public class RawPrinterHelper {
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
    public class DOCINFOA {
        [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
        [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile;
        [MarshalAs(UnmanagedType.LPStr)] public string pDataType;
    }
    [DllImport("winspool.Drv", EntryPoint = "OpenPrinterA", SetLastError = true, CharSet = CharSet.Ansi, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool OpenPrinter([MarshalAs(UnmanagedType.LPStr)] string szPrinter, out IntPtr hPrinter, IntPtr pd);
    [DllImport("winspool.Drv", EntryPoint = "ClosePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool ClosePrinter(IntPtr hPrinter);
    [DllImport("winspool.Drv", EntryPoint = "StartDocPrinterA", SetLastError = true, CharSet = CharSet.Ansi, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool StartDocPrinter(IntPtr hPrinter, int level, [In, MarshalAs(UnmanagedType.LPStruct)] DOCINFOA di);
    [DllImport("winspool.Drv", EntryPoint = "EndDocPrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool EndDocPrinter(IntPtr hPrinter);
    [DllImport("winspool.Drv", EntryPoint = "StartPagePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool StartPagePrinter(IntPtr hPrinter);
    [DllImport("winspool.Drv", EntryPoint = "EndPagePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool EndPagePrinter(IntPtr hPrinter);
    [DllImport("winspool.Drv", EntryPoint = "WritePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, int dwCount, out int dwWritten);

    public static bool SendStringToPrinter(string szPrinterName, string szString) {
        IntPtr pBytes = Marshal.StringToCoTaskMemAnsi(szString);
        int dwCount = szString.Length;
        int dwWritten = 0;
        IntPtr hPrinter = IntPtr.Zero;
        DOCINFOA di = new DOCINFOA { pDocName = "VOG CARTS & WALL LABELS", pDataType = "RAW" };
        bool success = false;
        if (OpenPrinter(szPrinterName, out hPrinter, IntPtr.Zero)) {
            if (StartDocPrinter(hPrinter, 1, di)) {
                if (StartPagePrinter(hPrinter)) {
                    success = WritePrinter(hPrinter, pBytes, dwCount, out dwWritten);
                    EndPagePrinter(hPrinter);
                }
                EndDocPrinter(hPrinter);
            }
            ClosePrinter(hPrinter);
        }
        Marshal.FreeCoTaskMem(pBytes);
        return success;
    }
}
"@

Add-Type -TypeDefinition $code -Language CSharp
$res = [RawPrinterHelper]::SendStringToPrinter($printerName, $zplContent)

if ($res) {
    Write-Host "🎉 24 Adet Etiket Başarıyla SATO Yazıcıya Gönderildi!" -ForegroundColor Green
} else {
    Write-Error "Yazdırma başarısız oldu!"
}
`;

fs.writeFileSync('c:/vog_system/server/print_sato_cart_labels.ps1', psScript);
console.log('✅ Generated print_sato_cart_labels.ps1');
