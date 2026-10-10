[CmdletBinding()]
param([Parameter(Mandatory=$true)][string]$Apk)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$verify = Join-Path $root 'scripts/verify-apk.ps1'
$baseline = Join-Path $root 'docs/MatheKids-v209.apk'
$version = [int][regex]::Match((Get-Content (Join-Path $root 'version.properties') -Raw), '(?m)^VERSION_CODE=(\d+)').Groups[1].Value
$null = & $verify -Apk $Apk -Baseline $baseline -ExpectedVersion $version
function Expect-Rejection([string]$Name, [scriptblock]$Action, [string]$Reason) {
    $rejected = $false
    try { $null = & $Action } catch {
        if (-not $_.Exception.Message.Contains($Reason)) { throw }
        $rejected = $true
    }
    if (-not $rejected) { throw "Unsafe APK accepted: $Name" }
    Write-Host "PASS: $Name rejected"
}
Expect-Rejection 'different historical certificate' { & $verify -Apk (Join-Path $root 'docs/MatheGuru-v104.apk') -Baseline $baseline } 'certificate differs'
Expect-Rejection 'debug build' { & $verify -Apk $baseline -Baseline $baseline -AllowSameVersion } 'debuggable APK'
Expect-Rejection 'reused versionCode' { & $verify -Apk $Apk -Baseline $Apk } 'versionCode must increase'
Expect-Rejection 'wrong requested version' { & $verify -Apk $Apk -Baseline $baseline -ExpectedVersion ($version + 1) } 'version does not match'
$temp = [IO.Path]::GetTempFileName()
try {
    $bytes = [IO.File]::ReadAllBytes($Apk)
    $offset = [int]($bytes.Length / 2)
    $bytes[$offset] = $bytes[$offset] -bxor 1
    [IO.File]::WriteAllBytes($temp, $bytes)
    Expect-Rejection 'tampered signed APK' { & $verify -Apk $temp -Baseline $baseline } 'signature verification failed'
} finally { Remove-Item -LiteralPath $temp -Force }
Write-Host 'PASS: valid release accepted; all five rejection checks passed.'
# The final negative test intentionally leaves a failed native apksigner status.
# Return success for the completed test script, including GitHub's pwsh wrapper.
exit 0
