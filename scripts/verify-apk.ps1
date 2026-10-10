[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)][string]$Apk,
    [string]$Baseline = (Join-Path $PSScriptRoot '../docs/MatheKids-latest.apk'),
    [int]$ExpectedVersion = 0,
    [switch]$AllowSameVersion
)
$ErrorActionPreference = 'Stop'
$expectedPackage = 'de.parip69.rechengurulgi'
$expectedCert = '3e3a9ad569b2e7abb9f8f77ea3e765832c81e2505f38a41f36be49f5ca79c4bc'
$sdk = $env:ANDROID_HOME
if (-not $sdk) { $sdk = $env:ANDROID_SDK_ROOT }
if (-not $sdk) { throw 'ANDROID_HOME must point to Android SDK 35.' }
$tools = Join-Path $sdk 'build-tools/35.0.0'
$windowsHost = [Environment]::OSVersion.Platform -eq [PlatformID]::Win32NT
$signer = Join-Path $tools $(if ($windowsHost) {'apksigner.bat'} else {'apksigner'})
$aapt = Join-Path $tools $(if ($windowsHost) {'aapt.exe'} else {'aapt'})
function Read-Apk([string]$Path, [bool]$Release = $false) {
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { throw 'APK is missing.' }
    $certOutput = (& $signer verify --verbose --print-certs $Path 2>&1 | Out-String)
    if ($LASTEXITCODE -ne 0) { throw 'APK signature verification failed.' }
    $certs = [regex]::Matches($certOutput, 'certificate SHA-256 digest: ([a-fA-F0-9]{64})')
    if ($certs.Count -ne 1 -or $certs[0].Groups[1].Value.ToLowerInvariant() -ne $expectedCert) { throw 'APK certificate differs from the trusted version 209 certificate.' }
    # At minSdk 24 apksigner normally verifies v2, not v1. Audit v1 separately;
    # this does not change the manifest or claim Android 23 support.
    $v1Output = ''
    if ($Release) {
        $v1Output = (& $signer verify --verbose --min-sdk-version 23 $Path 2>&1 | Out-String)
        if ($LASTEXITCODE -ne 0) { throw 'Additional v1 signature verification failed.' }
    }
    $badging = (& $aapt dump badging $Path 2>&1 | Out-String)
    if ($LASTEXITCODE -ne 0) { throw 'APK manifest cannot be read.' }
    $package = [regex]::Match($badging, "package: name='([^']+)' versionCode='([0-9]+)' versionName='([^']+)'")
    if (-not $package.Success -or $package.Groups[1].Value -ne $expectedPackage) { throw 'APK applicationId mismatch.' }
    [pscustomobject]@{
        Package = $package.Groups[1].Value
        VersionCode = [int]$package.Groups[2].Value
        VersionName = $package.Groups[3].Value
        CertificateSHA256 = $expectedCert
        FileSHA256 = (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant()
        Debuggable = $badging.Contains('application-debuggable')
        V1 = $v1Output.Contains('Verified using v1 scheme (JAR signing): true')
        V2 = $certOutput.Contains('Verified using v2 scheme (APK Signature Scheme v2): true')
        V3 = $certOutput.Contains('Verified using v3 scheme (APK Signature Scheme v3): true')
    }
}
$old = Read-Apk $Baseline
$new = Read-Apk $Apk
if ($new.Debuggable) { throw 'A debuggable APK must not be released.' }
$new = Read-Apk $Apk $true
if (-not $new.V1 -or -not $new.V2 -or -not $new.V3) { throw 'Release APK must have valid v1/v2/v3 signatures.' }
if ($new.VersionCode -lt $old.VersionCode -or (-not $AllowSameVersion -and $new.VersionCode -eq $old.VersionCode)) { throw 'Release versionCode must increase.' }
if ($ExpectedVersion -gt 0 -and ($new.VersionCode -ne $ExpectedVersion -or $new.VersionName -ne [string]$ExpectedVersion)) { throw 'APK version does not match version.properties.' }
$new | ConvertTo-Json
