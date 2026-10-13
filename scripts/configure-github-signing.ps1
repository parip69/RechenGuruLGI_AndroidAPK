[CmdletBinding()]
param([string]$Repository = 'parip69/RechenGuruLGI_AndroidAPK')
$ErrorActionPreference = 'Stop'
& "$PSScriptRoot/check-signing-key.ps1"
$root = Split-Path -Parent $PSScriptRoot
$config = Get-Content -LiteralPath (Join-Path $root 'android-signing.json') -Raw | ConvertFrom-Json
$environment = $config.githubEnvironment
# The environment is deliberately restricted to main, not arbitrary PR/branch code.
$body = '{"deployment_branch_policy":{"protected_branches":false,"custom_branch_policies":true}}'
$body | & gh api --method PUT "repos/$Repository/environments/$environment" --input - | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Unable to configure the GitHub signing environment.' }
$policies = & gh api "repos/$Repository/environments/$environment/deployment-branch-policies" | ConvertFrom-Json
if ($LASTEXITCODE -ne 0) { throw 'Unable to read environment branch rules.' }
if (-not ($policies.branch_policies | Where-Object { $_.name -eq 'main' -and $_.type -eq 'branch' })) {
    '{"name":"main","type":"branch"}' | & gh api --method POST "repos/$Repository/environments/$environment/deployment-branch-policies" --input - | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Unable to restrict signing to main.' }
}
$bytes = [IO.File]::ReadAllBytes([IO.Path]::GetFullPath($env:ANDROID_KEYSTORE_PATH))
try {
    $encoded = [Convert]::ToBase64String($bytes)
    if ([Text.Encoding]::UTF8.GetByteCount($encoded) -ge 48000) { throw 'Keystore exceeds the GitHub secret size limit.' }
    $encoded | & gh secret set ANDROID_KEYSTORE_BASE64 --repo $Repository --env $environment
    if ($LASTEXITCODE -ne 0) { throw 'Keystore secret upload failed.' }
    foreach ($name in @('ANDROID_KEYSTORE_PASSWORD','ANDROID_KEY_ALIAS','ANDROID_KEY_PASSWORD')) {
        [Environment]::GetEnvironmentVariable($name) | & gh secret set $name --repo $Repository --env $environment
        if ($LASTEXITCODE -ne 0) { throw "Secret upload failed: $name" }
    }
} finally { [Array]::Clear($bytes, 0, $bytes.Length); $encoded = $null }
Write-Host 'Original key stored in GitHub environment secrets. It is never committed or downloadable from Git.'
