[CmdletBinding()]
param(
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$versionFile = Join-Path $scriptRoot "version.properties"
$indexFile = Join-Path $scriptRoot "app\src\main\assets\index.html"
$syncWebAssetsScript = Join-Path $scriptRoot "sync_web_assets.ps1"
$gradlewBat = Join-Path $scriptRoot "gradlew.bat"
$privatDir = Join-Path $scriptRoot "Privat"
$apkOutputDir = Join-Path $scriptRoot "app\build\outputs\apk"
$apkBaseName = "MatheGuru"
$htmlBaseName = "MatheGuru"

function Write-Utf8NoBom {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path,
        [Parameter(Mandatory = $true)]
        [string]$Content
    )

    $encoding = [System.Text.UTF8Encoding]::new($false)
    [System.IO.File]::WriteAllText($Path, $Content, $encoding)
}

function Get-CurrentVersionCode {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        throw "Versionsdatei nicht gefunden: $Path"
    }

    $match = Select-String -Path $Path -Pattern '^\s*VERSION_CODE\s*=\s*(\d+)\s*$'
    if (-not $match) {
        throw "In '$Path' wurde kein gueltiger VERSION_CODE gefunden."
    }

    return [int]$match.Matches[0].Groups[1].Value
}

function Set-VersionProperties {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path,
        [Parameter(Mandatory = $true)]
        [int]$VersionCode,
        [Parameter(Mandatory = $true)]
        [string]$VersionName
    )

    $content = @(
        "# Zentrale App-Version"
        "VERSION_CODE=$VersionCode"
        "VERSION_NAME=$VersionName"
        ""
    ) -join "`n"

    Write-Utf8NoBom -Path $Path -Content $content
}

function Find-VersionedApk {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path,
        [Parameter(Mandatory = $true)]
        [string]$VersionName
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        return $null
    }

    Get-ChildItem -Path $Path -Recurse -File -Filter "*.apk" |
        Where-Object { $_.Name -eq "$apkBaseName-v$VersionName.apk" } |
        Select-Object -First 1
}

Push-Location $scriptRoot
try {
    $currentVersionCode = Get-CurrentVersionCode -Path $versionFile
    $nextVersionCode = $currentVersionCode + 1
    $nextVersionName = $nextVersionCode.ToString()

    Set-VersionProperties -Path $versionFile -VersionCode $nextVersionCode -VersionName $nextVersionName
    if (-not (Test-Path -LiteralPath $syncWebAssetsScript)) {
        throw "Synchronisationsskript nicht gefunden: $syncWebAssetsScript"
    }
    try {
        & $syncWebAssetsScript -VersionName $nextVersionName
    }
    catch {
        throw "Synchronisierung der Web-Assets fehlgeschlagen: $($_.Exception.Message)"
    }

    Write-Host "Version auf $nextVersionName synchronisiert (Assets + docs)."

    if ($SkipBuild) {
        Write-Host "Build wurde mit -SkipBuild uebersprungen."
        return
    }

    if (-not (Test-Path -LiteralPath $gradlewBat)) {
        throw "gradlew.bat nicht gefunden: $gradlewBat"
    }

    & $gradlewBat assembleDebug
    if ($LASTEXITCODE -ne 0) {
        throw "Gradle-Build fehlgeschlagen."
    }

    try {
        & $syncWebAssetsScript -VersionName $nextVersionName
    }
    catch {
        throw "Abschliessende Synchronisierung nach dem Build fehlgeschlagen: $($_.Exception.Message)"
    }

    New-Item -ItemType Directory -Force -Path $privatDir | Out-Null

    $htmlArchivePath = Join-Path $privatDir "$htmlBaseName-v$nextVersionName.html"
    Copy-Item -LiteralPath $indexFile -Destination $htmlArchivePath -Force

    $apkFile = Find-VersionedApk -Path $apkOutputDir -VersionName $nextVersionName
    if (-not $apkFile) {
        throw "Es wurde keine APK mit dem Namen '$apkBaseName-v$nextVersionName.apk' gefunden."
    }

    $apkArchivePath = Join-Path $privatDir $apkFile.Name
    Copy-Item -LiteralPath $apkFile.FullName -Destination $apkArchivePath -Force

    Write-Host "Archivkopien erstellt:"
    Write-Host " - $htmlArchivePath"
    Write-Host " - $apkArchivePath"
    Write-Host " - docs/index.html ist auf dem neuesten Stand."
}
finally {
    Pop-Location
}
