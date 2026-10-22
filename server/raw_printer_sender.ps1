param (
    [string]$PrinterKeyword = "SATO",
    [string]$FilePath = "",
    [switch]$DryRun = $false
)

if ($DryRun -or $env:VOG_DRY_RUN -eq "true" -or (Test-Path "c:\vog_system\server\.dry_run_active")) {
    Write-Host "PRINT_SUCCESS_DRY_RUN:True"
    exit 0
}

$printer = Get-Printer | Where-Object { $_.Name -like "*$PrinterKeyword*" } | Select-Object -First 1
if (-not $printer) {
    $printer = Get-Printer | Where-Object { $_.Name -like "*SATO*" -or $_.Name -like "*Godex*" -or $_.Name -like "*TSC*" } | Select-Object -First 1
}

if (-not $printer) {
    Write-Host "NO_PRINTER_FOUND"
    exit 1
}

Write-Host "FOUND_PRINTER:$($printer.Name)"

if (-not $FilePath -or -not (Test-Path $FilePath)) {
    Write-Host "FILE_NOT_FOUND"
    exit 1
}

$raw = Get-Content -Raw -Path $FilePath -Encoding UTF8

$code = @"
using System;
using System.Runtime.InteropServices;

public class VogRawPrinterSpooler {
    [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Ansi)]
    public class DOCINFOA {
        [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
        [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile;
        [MarshalAs(UnmanagedType.LPStr)] public string pDataType;
    }

    [DllImport("winspool.Drv", EntryPoint="OpenPrinterA", SetLastError=true, CharSet=CharSet.Ansi, ExactSpelling=true, CallingConvention=CallingConvention.StdCall)]
    public static extern bool OpenPrinter([MarshalAs(UnmanagedType.LPStr)] string szPrinter, out IntPtr hPrinter, IntPtr pd);

    [DllImport("winspool.Drv", EntryPoint="ClosePrinter", SetLastError=true, ExactSpelling=true, CallingConvention=CallingConvention.StdCall)]
    public static extern bool ClosePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint="StartDocPrinterA", SetLastError=true, CharSet=CharSet.Ansi, ExactSpelling=true, CallingConvention=CallingConvention.StdCall)]
    public static extern bool StartDocPrinter(IntPtr hPrinter, int level, [In, MarshalAs(UnmanagedType.LPStruct)] DOCINFOA di);

    [DllImport("winspool.Drv", EntryPoint="EndDocPrinter", SetLastError=true, ExactSpelling=true, CallingConvention=CallingConvention.StdCall)]
    public static extern bool EndDocPrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint="StartPagePrinter", SetLastError=true, ExactSpelling=true, CallingConvention=CallingConvention.StdCall)]
    public static extern bool StartPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint="EndPagePrinter", SetLastError=true, ExactSpelling=true, CallingConvention=CallingConvention.StdCall)]
    public static extern bool EndPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint="WritePrinter", SetLastError=true, ExactSpelling=true, CallingConvention=CallingConvention.StdCall)]
    public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, int dwCount, out int dwWritten);

    public static bool SendBytes(string printerName, string rawData) {
        IntPtr pBytes = Marshal.StringToCoTaskMemAnsi(rawData);
        int dwCount = rawData.Length;
        int dwWritten = 0;
        IntPtr hPrinter = IntPtr.Zero;
        DOCINFOA di = new DOCINFOA();
        di.pDocName = "VOG BOX LABEL RAW PRINT";
        di.pDataType = "RAW";

        bool success = false;
        if (OpenPrinter(printerName, out hPrinter, IntPtr.Zero)) {
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

try {
    Add-Type -TypeDefinition $code -Language CSharp -ErrorAction SilentlyContinue
} catch {}

try {
    $res = [VogRawPrinterSpooler]::SendBytes($printer.Name, $raw)
    Write-Host "PRINT_SUCCESS:$res"
} catch {
    Write-Host "PRINT_ERROR:$($_.Exception.Message)"
}
