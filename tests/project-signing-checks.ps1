$ErrorActionPreference = 'Stop'
$names = @('ANDROID_KEYSTORE_PATH','ANDROID_KEYSTORE_PASSWORD','ANDROID_KEY_ALIAS','ANDROID_KEY_PASSWORD')
$previous = @{}
foreach ($name in $names) {
    $previous[$name] = [Environment]::GetEnvironmentVariable($name)
    [Environment]::SetEnvironmentVariable($name, $null, 'Process')
}
$check = Join-Path $PSScriptRoot '../scripts/check-signing-key.ps1'
function Expect-Rejection([string]$Name, [scriptblock]$Action, [string]$Reason) {
    $rejected = $false
    try { & $Action } catch {
        if (-not $_.Exception.Message.Contains($Reason)) { throw }
        $rejected = $true
    }
    if (-not $rejected) { throw "Unsafe signing configuration accepted: $Name" }
    Write-Host "PASS: $Name rejected"
}
try {
    & $check
    Write-Host 'PASS: project-only original signing configuration verified without external secrets'
    $alias = $env:ANDROID_KEY_ALIAS
    try {
        $env:ANDROID_KEY_ALIAS = 'not-the-original-alias'
        Expect-Rejection 'different external alias' { & $check } 'Signing alias differs'
    } finally { $env:ANDROID_KEY_ALIAS = $alias }
    $path = $env:ANDROID_KEYSTORE_PATH
    try {
        $env:ANDROID_KEYSTORE_PATH = Join-Path (Split-Path -Parent $PSScriptRoot) 'app/unconfigured.keystore'
        Expect-Rejection 'unconfigured key inside source tree' { & $check } 'Only the explicitly configured original key'
    } finally { $env:ANDROID_KEYSTORE_PATH = $path }
    $password = $env:ANDROID_KEYSTORE_PASSWORD
    try {
        $env:ANDROID_KEYSTORE_PASSWORD = 'invalid-for-test'
        Expect-Rejection 'wrong external password' { & $check } 'Cannot open the existing keystore'
    } finally { $env:ANDROID_KEYSTORE_PASSWORD = $password }
} finally {
    foreach ($name in $names) { [Environment]::SetEnvironmentVariable($name, $previous[$name], 'Process') }
}
exit 0
