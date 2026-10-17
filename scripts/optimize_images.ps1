Add-Type -AssemblyName System.Drawing

function Optimize-Png($filePath, $maxWidth, $maxHeight) {
    if (-not (Test-Path $filePath)) { return }
    $resolved = (Resolve-Path $filePath).Path
    $oldSize = (Get-Item $resolved).Length

    # Backup original
    $backupPath = $resolved + ".bak"
    Copy-Item $resolved $backupPath -Force

    $srcImg = [System.Drawing.Image]::FromFile($resolved)
    $origW = $srcImg.Width
    $origH = $srcImg.Height

    # Calculate proportional scale
    $scale = 1.0
    if ($origW -gt $maxWidth -or $origH -gt $maxHeight) {
        $scaleW = $maxWidth / $origW
        $scaleH = $maxHeight / $origH
        $scale = [Math]::Min($scaleW, $scaleH)
    }

    $newW = [Math]::Max(1, [int][Math]::Round($origW * $scale))
    $newH = [Math]::Max(1, [int][Math]::Round($origH * $scale))

    $destBmp = New-Object System.Drawing.Bitmap($newW, $newH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($destBmp)
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $g.Clear([System.Drawing.Color]::Transparent)
    $g.DrawImage($srcImg, 0, 0, $newW, $newH)
    $g.Dispose()
    $srcImg.Dispose()

    $destBmp.Save($resolved, [System.Drawing.Imaging.ImageFormat]::Png)
    $destBmp.Dispose()

    $newSize = (Get-Item $resolved).Length
    Remove-Item $backupPath -Force -ErrorAction SilentlyContinue

    Write-Host "Optimized $filePath ($origW x $origH -> $newW x $newH): $([Math]::Round($oldSize/1024, 1)) KB -> $([Math]::Round($newSize/1024, 1)) KB"
}

# 1. Optimize logo.png to max 384x384 (Navbar is 40x40, preloader is 72x72, modal is 80x80; 384px is sharp for 4K Retina)
Optimize-Png "frontend/public/logo.png" 384 384

# 2. Optimize daruntech-icon.png to 128x128 (Shown at 24x24 in preloader)
Optimize-Png "frontend/public/daruntech-icon.png" 128 128
