Add-Type -AssemblyName System.Drawing

function Convert-ImageToZplGfa($imagePath, $targetWidth, $targetHeight) {
    $img = [System.Drawing.Bitmap]::FromFile($imagePath)
    $resized = New-Object System.Drawing.Bitmap($targetWidth, $targetHeight)
    $g = [System.Drawing.Graphics]::FromImage($resized)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($img, 0, 0, $targetWidth, $targetHeight)
    $g.Dispose()
    $img.Dispose()

    $bytesPerRow = [Math]::Ceiling($targetWidth / 8.0)
    $totalBytes = $bytesPerRow * $targetHeight
    $hexBuilder = New-Object System.Text.StringBuilder

    for ($y = 0; $y -lt $targetHeight; $y++) {
        for ($byteIdx = 0; $byteIdx -lt $bytesPerRow; $byteIdx++) {
            $byteVal = 0
            for ($bit = 0; $bit -lt 8; $bit++) {
                $x = $byteIdx * 8 + $bit
                if ($x -lt $targetWidth) {
                    $pixel = $resized.GetPixel($x, $y)
                    $lum = 0.299 * $pixel.R + 0.587 * $pixel.G + 0.114 * $pixel.B
                    if ($lum -lt 150 -and $pixel.A -gt 50) {
                        $byteVal = $byteVal -bor (1 -shl (7 - $bit))
                    }
                }
            }
            [void]$hexBuilder.Append($byteVal.ToString("X2"))
        }
    }
    $resized.Dispose()

    return "^GFA,$totalBytes,$totalBytes,$bytesPerRow," + $hexBuilder.ToString()
}

$uploadDir = "C:\Users\ctopuz\.gemini\antigravity-ide\brain\c2fc37e9-fd87-4445-8ebf-4855f8163fe8\.user_uploaded"
$yerliImg = Join-Path $uploadDir "media_1787050396075.png"
$rfidImg = Join-Path $uploadDir "media_1787050406319.png"

# Optimal sizes to fit side by side at bottom right
$yerliZpl = Convert-ImageToZplGfa $yerliImg 96 46
$rfidZpl = Convert-ImageToZplGfa $rfidImg 50 46

$output = @{
    yerli = $yerliZpl
    rfid = $rfidZpl
} | ConvertTo-Json

$output | Out-File -FilePath "c:\vog_system\server\converted_logos.json" -Encoding utf8
Write-Host "✅ OPTIMAL BOYUTLU LOGOLAR OLUŞTURULDU!"
