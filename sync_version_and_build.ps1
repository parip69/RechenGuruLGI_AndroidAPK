[CmdletBinding()]
param([switch]$SkipBuild)
$ErrorActionPreference = 'Stop'
if ($SkipBuild) { throw 'Unsigned or unverified publication is disabled. Use sync_web_assets.ps1 for web synchronization only.' }
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$current = [int][regex]::Match((Get-Content (Join-Path $root 'version.properties') -Raw), '(?m)^VERSION_CODE=(\d+)').Groups[1].Value
& (Join-Path $root 'scripts/build-release.ps1') -VersionCode ($current + 1) -PublishFiles
