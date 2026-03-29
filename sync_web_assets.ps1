[CmdletBinding()]
param(
    [string]$VersionName
)

$ErrorActionPreference = "Stop"

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$versionFile = Join-Path $scriptRoot "version.properties"
$assetsDir = Join-Path $scriptRoot "app\src\main\assets"
$indexFile = Join-Path $assetsDir "index.html"
$manifestFile = Join-Path $assetsDir "manifest.webmanifest"
$swFile = Join-Path $assetsDir "sw.js"
$iconsDir = Join-Path $assetsDir "icons"
$docsDir = Join-Path $scriptRoot "docs"
$docsIconsDir = Join-Path $docsDir "icons"
$docsReadmeFile = Join-Path $docsDir "README-GitHub-Pages.txt"
$docsNoJekyllFile = Join-Path $docsDir ".nojekyll"
$githubPagesNote = @(
    "GitHub -> Settings -> Pages"
    "Source: Deploy from a branch"
    "Branch: main"
    "Folder: /docs"
    ""
) -join "`n"

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

function Get-VersionNameFromProperties {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        throw "Versionsdatei nicht gefunden: $Path"
    }

    $match = Select-String -Path $Path -Pattern '^\s*VERSION_NAME\s*=\s*(.+?)\s*$'
    if (-not $match) {
        throw "In '$Path' wurde kein gueltiger VERSION_NAME gefunden."
    }

    return $match.Matches[0].Groups[1].Value.Trim()
}

function Set-IndexVersionMarkers {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path,
        [Parameter(Mandatory = $true)]
        [string]$ResolvedVersionName,
        [Parameter(Mandatory = $true)]
        [string]$WebCacheVersion
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        throw "index.html nicht gefunden: $Path"
    }

    $content = [System.IO.File]::ReadAllText($Path, [System.Text.Encoding]::UTF8)

    if ($content -notmatch 'data-app-version="' -or $content -notmatch 'id="appVersion"' -or $content -notmatch 'const SW_VERSION = "') {
        throw "In '$Path' fehlen erwartete Versionsmarker."
    }

    $content = [regex]::Replace(
        $content,
        '(<footer\b[^>]*\bdata-app-version=")[^"]*(")',
        ('${1}' + $ResolvedVersionName + '${2}'),
        [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
    )

    $content = [regex]::Replace(
        $content,
        '(<span\b[^>]*\bid="appVersion"[^>]*>)[^<]*(</span>)',
        ('${1}' + $ResolvedVersionName + '${2}'),
        [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
    )

    $content = [regex]::Replace(
        $content,
        '(const\s+SW_VERSION\s*=\s*")[^"]*(";\s*)',
        ('${1}' + $WebCacheVersion + '${2}'),
        [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
    )

    Write-Utf8NoBom -Path $Path -Content $content
}

function Set-ServiceWorkerVersion {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path,
        [Parameter(Mandatory = $true)]
        [string]$WebCacheVersion
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        throw "sw.js nicht gefunden: $Path"
    }

    $content = [System.IO.File]::ReadAllText($Path, [System.Text.Encoding]::UTF8)
    if ($content -notmatch "const CACHE_NAME = '") {
        throw "In '$Path' wurde kein CACHE_NAME gefunden."
    }

    $content = [regex]::Replace(
        $content,
        "(const\s+CACHE_NAME\s*=\s*')[^']*(';\s*)",
        ('${1}' + $WebCacheVersion + '${2}'),
        [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
    )

    Write-Utf8NoBom -Path $Path -Content $content
}

function Sync-DocsFromAssets {
    param(
        [Parameter(Mandatory = $true)]
        [string]$SourceAssetsDir,
        [Parameter(Mandatory = $true)]
        [string]$SourceManifestFile,
        [Parameter(Mandatory = $true)]
        [string]$SourceSwFile,
        [Parameter(Mandatory = $true)]
        [string]$SourceIconsDir,
        [Parameter(Mandatory = $true)]
        [string]$TargetDocsDir,
        [Parameter(Mandatory = $true)]
        [string]$TargetDocsIconsDir,
        [Parameter(Mandatory = $true)]
        [string]$TargetNoJekyllFile,
        [Parameter(Mandatory = $true)]
        [string]$TargetReadmeFile,
        [Parameter(Mandatory = $true)]
        [string]$ReadmeContent
    )

    New-Item -ItemType Directory -Force -Path $TargetDocsDir | Out-Null
    New-Item -ItemType Directory -Force -Path $TargetDocsIconsDir | Out-Null

    Copy-Item -LiteralPath (Join-Path $SourceAssetsDir "index.html") -Destination (Join-Path $TargetDocsDir "index.html") -Force
    Copy-Item -LiteralPath $SourceManifestFile -Destination (Join-Path $TargetDocsDir "manifest.webmanifest") -Force
    Copy-Item -LiteralPath $SourceSwFile -Destination (Join-Path $TargetDocsDir "sw.js") -Force
    Copy-Item -LiteralPath (Join-Path $SourceIconsDir "*") -Destination $TargetDocsIconsDir -Force

    New-Item -ItemType File -Force -Path $TargetNoJekyllFile | Out-Null
    Write-Utf8NoBom -Path $TargetReadmeFile -Content $ReadmeContent
}

$resolvedVersionName = if ($PSBoundParameters.ContainsKey("VersionName") -and -not [string]::IsNullOrWhiteSpace($VersionName)) {
    $VersionName.Trim()
} else {
    Get-VersionNameFromProperties -Path $versionFile
}

$webCacheVersion = "rechenguru-lgi-v$resolvedVersionName"

Set-IndexVersionMarkers -Path $indexFile -ResolvedVersionName $resolvedVersionName -WebCacheVersion $webCacheVersion
Set-ServiceWorkerVersion -Path $swFile -WebCacheVersion $webCacheVersion
Sync-DocsFromAssets `
    -SourceAssetsDir $assetsDir `
    -SourceManifestFile $manifestFile `
    -SourceSwFile $swFile `
    -SourceIconsDir $iconsDir `
    -TargetDocsDir $docsDir `
    -TargetDocsIconsDir $docsIconsDir `
    -TargetNoJekyllFile $docsNoJekyllFile `
    -TargetReadmeFile $docsReadmeFile `
    -ReadmeContent $githubPagesNote

Write-Host "Web-Assets synchronisiert:"
Write-Host " - Quelle: $assetsDir"
Write-Host " - Ziel:   $docsDir"
Write-Host " - Version: $resolvedVersionName"
Write-Host " - Web-Cache: $webCacheVersion"
