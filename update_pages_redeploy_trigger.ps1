[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$targetFile = Join-Path $scriptRoot "docs\redeploy-trigger.txt"

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

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss K"
$content = @(
    "GitHub Pages Redeploy Trigger"
    "Timestamp: $timestamp"
    "Reason: Automatic update before each local commit"
    ""
) -join "`n"

Write-Utf8NoBom -Path $targetFile -Content $content

Write-Host "Redeploy-Trigger aktualisiert:"
Write-Host " - Datei: $targetFile"
Write-Host " - Zeit:  $timestamp"
