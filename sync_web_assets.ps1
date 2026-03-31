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
        [AllowEmptyString()]
        [Parameter(Mandatory = $true)]
        [string]$Content
    )

    $encoding = [System.Text.UTF8Encoding]::new($false)
    [System.IO.File]::WriteAllText($Path, $Content, $encoding)
}

function Invoke-WithRetry {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Description,
        [Parameter(Mandatory = $true)]
        [scriptblock]$Action,
        [int]$MaxAttempts = 6,
        [int]$InitialDelayMs = 200
    )

    $attempt = 0
    while ($attempt -lt $MaxAttempts) {
        $attempt++
        try {
            & $Action
            return
        }
        catch {
            if ($attempt -ge $MaxAttempts) {
                throw "$Description fehlgeschlagen: $($_.Exception.Message)"
            }

            Start-Sleep -Milliseconds ($InitialDelayMs * $attempt)
        }
    }
}

function Get-FileContentUtf8OrNull {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        return $null
    }

    return [System.IO.File]::ReadAllText($Path, [System.Text.Encoding]::UTF8)
}

function Get-FileBytesOrNull {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        return $null
    }

    return [System.IO.File]::ReadAllBytes($Path)
}

function Test-ByteArrayEqual {
    param(
        [byte[]]$Left,
        [byte[]]$Right
    )

    if ($null -eq $Left -or $null -eq $Right) {
        return $false
    }

    if ($Left.Length -ne $Right.Length) {
        return $false
    }

    for ($i = 0; $i -lt $Left.Length; $i++) {
        if ($Left[$i] -ne $Right[$i]) {
            return $false
        }
    }

    return $true
}

function Write-Utf8NoBomIfChanged {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path,
        [AllowEmptyString()]
        [Parameter(Mandatory = $true)]
        [string]$Content
    )

    $currentContent = Get-FileContentUtf8OrNull -Path $Path
    if ($null -ne $currentContent -and $currentContent -ceq $Content) {
        return
    }

    $parentDir = Split-Path -Parent $Path
    if (-not [string]::IsNullOrWhiteSpace($parentDir)) {
        New-Item -ItemType Directory -Force -Path $parentDir | Out-Null
    }

    Invoke-WithRetry -Description "Schreiben von '$Path'" -Action {
        Write-Utf8NoBom -Path $Path -Content $Content
    }
}

function Copy-FileIfChanged {
    param(
        [Parameter(Mandatory = $true)]
        [string]$SourcePath,
        [Parameter(Mandatory = $true)]
        [string]$DestinationPath
    )

    if (-not (Test-Path -LiteralPath $SourcePath)) {
        throw "Quelldatei nicht gefunden: $SourcePath"
    }

    $sourceBytes = Get-FileBytesOrNull -Path $SourcePath
    $destinationBytes = Get-FileBytesOrNull -Path $DestinationPath
    if (Test-ByteArrayEqual -Left $sourceBytes -Right $destinationBytes) {
        return
    }

    $destinationDir = Split-Path -Parent $DestinationPath
    if (-not [string]::IsNullOrWhiteSpace($destinationDir)) {
        New-Item -ItemType Directory -Force -Path $destinationDir | Out-Null
    }

    Invoke-WithRetry -Description "Kopieren von '$SourcePath' nach '$DestinationPath'" -Action {
        Copy-Item -LiteralPath $SourcePath -Destination $DestinationPath -Force
    }
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

    Write-Utf8NoBomIfChanged -Path $Path -Content $content
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

    Write-Utf8NoBomIfChanged -Path $Path -Content $content
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

    Copy-FileIfChanged -SourcePath (Join-Path $SourceAssetsDir "index.html") -DestinationPath (Join-Path $TargetDocsDir "index.html")
    Copy-FileIfChanged -SourcePath $SourceManifestFile -DestinationPath (Join-Path $TargetDocsDir "manifest.webmanifest")
    Copy-FileIfChanged -SourcePath $SourceSwFile -DestinationPath (Join-Path $TargetDocsDir "sw.js")

    Get-ChildItem -LiteralPath $SourceIconsDir -File | ForEach-Object {
        Copy-FileIfChanged -SourcePath $_.FullName -DestinationPath (Join-Path $TargetDocsIconsDir $_.Name)
    }

    Write-Utf8NoBomIfChanged -Path $TargetNoJekyllFile -Content ""
    Write-Utf8NoBomIfChanged -Path $TargetReadmeFile -Content $ReadmeContent
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
