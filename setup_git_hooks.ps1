[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

Push-Location $scriptRoot
try {
    git rev-parse --is-inside-work-tree *> $null
    if ($LASTEXITCODE -ne 0) {
        throw "Dieses Verzeichnis ist kein Git-Repository: $scriptRoot"
    }

    git config --local core.hooksPath .githooks
    if ($LASTEXITCODE -ne 0) {
        throw "Git-Hooks konnten nicht aktiviert werden."
    }

    Write-Host "Git-Hooks aktiviert."
    Write-Host " - hooksPath: .githooks"
    Write-Host " - Commit und Push pruefen jetzt automatisch den Sync nach docs/."
}
finally {
    Pop-Location
}
