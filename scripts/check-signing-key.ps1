[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
. "$PSScriptRoot/load-project-signing.ps1"
$config = Get-Content -LiteralPath (Join-Path $root 'android-signing.json') -Raw | ConvertFrom-Json
foreach ($name in @('ANDROID_KEYSTORE_PATH','ANDROID_KEYSTORE_PASSWORD','ANDROID_KEY_ALIAS','ANDROID_KEY_PASSWORD')) {
    if (-not [Environment]::GetEnvironmentVariable($name)) { throw "Original signing key not configured: $name. No replacement will be generated." }
}
$path = [IO.Path]::GetFullPath($env:ANDROID_KEYSTORE_PATH)
$prefix = [IO.Path]::GetFullPath($root) + [IO.Path]::DirectorySeparatorChar
$bundledPath = [IO.Path]::GetFullPath((Join-Path $root 'android-signing/original.keystore'))
if ($path.StartsWith($prefix, [StringComparison]::OrdinalIgnoreCase) -and $path -ne $bundledPath) { throw 'Only the explicitly configured original key may be inside the repository.' }
if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { throw 'Original signing key file is unavailable.' }
if ($env:ANDROID_KEY_ALIAS -ne $config.keyAlias) { throw 'Signing alias differs from android-signing.json.' }
$keytool = if ($env:JAVA_HOME) { Join-Path $env:JAVA_HOME 'bin/keytool' } else { 'keytool' }
if ([Environment]::OSVersion.Platform -eq [PlatformID]::Win32NT -and $env:JAVA_HOME) { $keytool += '.exe' }
# Password is read by keytool from the environment, never a command-line argument.
$info = (& $keytool '-J-Duser.language=en' '-J-Duser.country=US' -list -v -keystore $path -storepass:env ANDROID_KEYSTORE_PASSWORD -alias $env:ANDROID_KEY_ALIAS 2>&1 | Out-String)
if ($LASTEXITCODE -ne 0) { throw 'Cannot open the existing keystore. Check its secure local configuration.' }
$match = [regex]::Match($info, 'SHA256:\s*([A-Fa-f0-9:]{64,95})')
$fingerprint = $match.Groups[1].Value.Replace(':','').ToLowerInvariant()
if (-not $match.Success -or $fingerprint -ne $config.certificateSHA256) { throw 'Wrong signing key: certificate does not match versions 209-211. Build/upload refused.' }
Write-Host 'Original signing certificate matches the fixed project fingerprint.'
