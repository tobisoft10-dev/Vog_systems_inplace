Add-Type -AssemblyName System.Windows.Forms

$srcDir = "D:\bsipdev\src\BSip"
$outDir = "D:\bsipdev"
$resDir = "D:\bsipdev\resources"

if (-not (Test-Path $resDir)) {
    New-Item -ItemType Directory -Path $resDir | Out-Null
}

Write-Host "⚡ Step 1: Compiling .resx files into .resources files..." -ForegroundColor Cyan

$resxFiles = Get-ChildItem -Path $srcDir -Recurse -Filter "*.resx"

$resourceArgs = @()

foreach ($file in $resxFiles) {
    # Calculate manifest resource name
    $relPath = $file.FullName.Substring($srcDir.Length + 1)
    # Remove file extension .resx
    $baseName = $relPath.Substring(0, $relPath.Length - 5)
    # Replace backslashes with dots to get namespace format
    $resourceName = "BSip." + ($baseName -replace "\\", ".") + ".resources"

    $outFile = Join-Path $resDir "$resourceName"

    Write-Host "Compiling $($file.Name) -> $resourceName" -ForegroundColor Gray

    # Read .resx and write .resources
    $reader = New-Object System.Resources.ResXResourceReader($file.FullName)
    $writer = New-Object System.Resources.ResourceWriter($outFile)

    $dict = $reader.GetEnumerator()
    while ($dict.MoveNext()) {
        $writer.AddResource($dict.Key, $dict.Value)
    }

    $reader.Close()
    $writer.Generate()
    $writer.Close()

    $resourceArgs += "/res:`"$outFile`",`"$resourceName`""
}

# Extract BSip.exe.licenses from original BSip.exe if present
$origExe = "D:\VOG_SIPARIS2\BSip.exe"
$asm = [System.Reflection.Assembly]::LoadFile($origExe)
$licenseStream = $asm.GetManifestResourceStream("BSip.exe.licenses")
if ($licenseStream -ne $null) {
    $licensePath = Join-Path $resDir "BSip.exe.licenses"
    $fileStream = [System.IO.File]::Create($licensePath)
    $licenseStream.CopyTo($fileStream)
    $fileStream.Close()
    $licenseStream.Close()
    $resourceArgs += "/res:`"$licensePath`",`"BSip.exe.licenses`""
    Write-Host "Extracted original DevExpress BSip.exe.licenses!" -ForegroundColor Green
}

Write-Host "`n⚡ Step 2: Compiling C# source code with csc.exe..." -ForegroundColor Cyan

$csFiles = Get-ChildItem -Path $srcDir -Recurse -Filter "*.cs" | ForEach-Object { "`"$($_.FullName)`"" }

$dlls = Get-ChildItem -Path $outDir -Filter "*.dll" | ForEach-Object { "/r:`"$($_.FullName)`"" }

$systemRefs = @(
    "/r:`"System.dll`"",
    "/r:`"System.Data.dll`"",
    "/r:`"System.Drawing.dll`"",
    "/r:`"System.Windows.Forms.dll`"",
    "/r:`"System.Xml.dll`"",
    "/r:`"System.Core.dll`"",
    "/r:`"System.ComponentModel.DataAnnotations.dll`""
)

$rspFile = Join-Path $outDir "compile.rsp"
$rspLines = @(
    "/target:winexe",
    "/out:`"$outDir\BSip.exe`"",
    "/optimize+"
) + $dlls + $systemRefs + $resourceArgs + $csFiles

Set-Content -Path $rspFile -Value ($rspLines -join "`n") -Encoding UTF8

$csc = "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
& $csc "@$rspFile"

if ($LASTEXITCODE -eq 0) {
    $item = Get-Item "$outDir\BSip.exe"
    Write-Host "`n🎉 SUCCESS! BSip.exe successfully compiled to $($item.FullName) ($($item.Length) bytes)" -ForegroundColor Green
} else {
    Write-Host "`n❌ Compilation failed!" -ForegroundColor Red
}
