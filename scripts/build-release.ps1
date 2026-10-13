[CmdletBinding()]
param([int]$VersionCode = 0, [switch]$PublishFiles)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
& "$PSScriptRoot/check-signing-key.ps1"
foreach ($name in @('ANDROID_KEYSTORE_PATH','ANDROID_KEYSTORE_PASSWORD','ANDROID_KEY_ALIAS','ANDROID_KEY_PASSWORD')) {
    if (-not [Environment]::GetEnvironmentVariable($name)) { throw "Missing secure environment variable: $name" }
}
$keyPath = [IO.Path]::GetFullPath($env:ANDROID_KEYSTORE_PATH)
$rootPrefix = [IO.Path]::GetFullPath($root) + [IO.Path]::DirectorySeparatorChar
$bundledPath = [IO.Path]::GetFullPath((Join-Path $root 'android-signing/original.keystore'))
if ($keyPath.StartsWith($rootPrefix, [StringComparison]::OrdinalIgnoreCase) -and $keyPath -ne $bundledPath) { throw 'Unconfigured keystore inside the repository.' }
if (-not (Test-Path -LiteralPath $keyPath -PathType Leaf)) { throw 'Existing keystore is unavailable; no replacement will be generated.' }
$properties = Get-Content -LiteralPath 'version.properties' -Raw
$current = [int][regex]::Match($properties, '(?m)^VERSION_CODE=(\d+)').Groups[1].Value
if ($VersionCode -eq 0) { $VersionCode = $current }
$published = @(Get-ChildItem docs -Filter '*-v*.apk' | ForEach-Object {
    if ($_.Name -match '-v(\d+)\.apk$') { [int]$Matches[1] }
} | Measure-Object -Maximum)[0].Maximum
if ($VersionCode -le $published -or $VersionCode -lt $current) { throw 'Use a version higher than every published APK and never decrease version.properties.' }
$destinations = @("docs/MatheKids-v$VersionCode.apk", "docs/MatheGuru-v$VersionCode.apk", "Privat/MatheKids-v$VersionCode.apk", "Privat/MatheKids-v$VersionCode.html", "Privat/MatheKids-v$VersionCode-signature.json")
foreach ($destination in $destinations) { if (Test-Path -LiteralPath $destination) { throw "Refusing to overwrite existing versioned file: $destination" } }
[IO.File]::WriteAllText((Join-Path $root 'version.properties'), "# Zentrale App-Version`nVERSION_CODE=$VersionCode`nVERSION_NAME=$VersionCode`n", [Text.UTF8Encoding]::new($false))
$windowsHost = [Environment]::OSVersion.Platform -eq [PlatformID]::Win32NT
if ($windowsHost) { & ./gradlew.bat assembleRelease --no-daemon --max-workers=2 --console=plain '-Pkotlin.compiler.execution.strategy=in-process' }
else { & bash ./gradlew assembleRelease --no-daemon --max-workers=2 --console=plain '-Pkotlin.compiler.execution.strategy=in-process' }
if ($LASTEXITCODE -ne 0) { throw 'Release build failed. Nothing is published.' }
$apk = Join-Path $root ".release-build/app/outputs/apk/release/MatheKids-v$VersionCode.apk"
$proof = & "$PSScriptRoot/verify-apk.ps1" -Apk $apk -ExpectedVersion $VersionCode
if ($PublishFiles) {
    foreach ($destination in $destinations[0..2]) { Copy-Item -LiteralPath $apk -Destination $destination }
    Copy-Item -LiteralPath 'app/src/main/assets/index.html' -Destination $destinations[3]
    [IO.File]::WriteAllText((Join-Path $root $destinations[4]), ($proof -join "`n") + "`n", [Text.UTF8Encoding]::new($false))
    Copy-Item -LiteralPath $apk -Destination 'docs/MatheKids-latest.apk' -Force
    Copy-Item -LiteralPath $apk -Destination 'docs/MatheGuru-latest.apk' -Force
    Write-Host 'Verified release files prepared. Review git diff, commit and push normally; existing versioned APKs remain untouched.'
}
$proof
