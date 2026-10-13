[CmdletBinding()]
param([switch]$SkipBuild)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
try {
    if ($SkipBuild) { throw 'Ungepruefte APKs werden nicht veroeffentlicht. Fuer Web-Sync sync_web_assets.ps1 verwenden.' }
    Set-Location $root
    $current = [int][regex]::Match((Get-Content version.properties -Raw), '(?m)^VERSION_CODE=(\d+)').Groups[1].Value
    $published = (Get-ChildItem docs -Filter '*-v*.apk' | ForEach-Object { if ($_.Name -match '-v(\d+)\.apk$') { [int]$Matches[1] } } | Measure-Object -Maximum).Maximum
    $next = [Math]::Max($current, $published + 1)
    & (Join-Path $root 'scripts/build-release.ps1') -VersionCode $next -PublishFiles
} catch {
    Write-Host "APK-Build nicht gestartet: $($_.Exception.Message)" -ForegroundColor Yellow
    exit 1
}
