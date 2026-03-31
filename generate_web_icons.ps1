[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$iconsDir = Join-Path $scriptRoot "app\src\main\assets\icons"

$variants = @(
    @{ Source = "icon-192.png"; Target = "web-icon-192.png" }
    @{ Source = "icon-512.png"; Target = "web-icon-512.png" }
    @{ Source = "apple-touch-icon.png"; Target = "web-apple-touch-icon.png" }
)

function New-WebIconVariant {
    param(
        [Parameter(Mandatory = $true)]
        [string]$SourceName,
        [Parameter(Mandatory = $true)]
        [string]$TargetName
    )

    $sourcePath = Join-Path $iconsDir $SourceName
    $targetPath = Join-Path $iconsDir $TargetName

    if (-not (Test-Path -LiteralPath $sourcePath)) {
        throw "Icon-Quelldatei nicht gefunden: $sourcePath"
    }

    $sourceBitmap = [System.Drawing.Bitmap]::new($sourcePath)
    try {
        $canvas = [System.Drawing.Bitmap]::new(
            $sourceBitmap.Width,
            $sourceBitmap.Height,
            [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
        )

        try {
            $graphics = [System.Drawing.Graphics]::FromImage($canvas)
            try {
                $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
                $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
                $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
                $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

                $graphics.DrawImage($sourceBitmap, 0, 0, $canvas.Width, $canvas.Height)

                $size = [Math]::Min($canvas.Width, $canvas.Height)
                $dotDiameter = [Math]::Max([int][Math]::Round($size * 0.16), 18)
                $margin = [Math]::Max([int][Math]::Round($size * 0.08), 10)
                $x = $canvas.Width - $dotDiameter - $margin
                $y = $canvas.Height - $dotDiameter - $margin

                $dotBrush = [System.Drawing.SolidBrush]::new(
                    [System.Drawing.Color]::FromArgb(255, 229, 57, 53)
                )

                try {
                    $graphics.FillEllipse($dotBrush, $x, $y, $dotDiameter, $dotDiameter)
                }
                finally {
                    $dotBrush.Dispose()
                }
            }
            finally {
                $graphics.Dispose()
            }

            if (Test-Path -LiteralPath $targetPath) {
                Remove-Item -LiteralPath $targetPath -Force
            }

            $canvas.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)
        }
        finally {
            $canvas.Dispose()
        }
    }
    finally {
        $sourceBitmap.Dispose()
    }
}

foreach ($variant in $variants) {
    New-WebIconVariant -SourceName $variant.Source -TargetName $variant.Target
}

Write-Host "Web-PWA-Icons aktualisiert:"
foreach ($variant in $variants) {
    Write-Host " - $($variant.Target)"
}
