[CmdletBinding()]
param([string]$KeystorePath = '/workspace/.cloud-tools/android-user/debug.keystore')
$ErrorActionPreference = 'Stop'
if (-not (Test-Path -LiteralPath $KeystorePath -PathType Leaf)) {
    throw 'Der bisherige Cloud-Schluessel ist in dieser Sitzung nicht vorhanden. Die bisherige Cloud-Umgebung oder eine sichere Original-Sicherung verwenden. Keinen Ersatz erzeugen.'
}
$config = Get-Content (Join-Path $PSScriptRoot '../android-signing.json') -Raw | ConvertFrom-Json
$names = @('ANDROID_KEYSTORE_PATH','ANDROID_KEYSTORE_PASSWORD','ANDROID_KEY_ALIAS','ANDROID_KEY_PASSWORD')
$previous = @{}
foreach ($name in $names) { $previous[$name] = [Environment]::GetEnvironmentVariable($name) }
function Read-LocalSecret([string]$Prompt) {
    $secure = Read-Host $Prompt -AsSecureString
    $buffer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try { [Runtime.InteropServices.Marshal]::PtrToStringBSTR($buffer) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($buffer); $secure.Dispose() }
}
try {
    $env:ANDROID_KEYSTORE_PATH = [IO.Path]::GetFullPath($KeystorePath)
    $env:ANDROID_KEY_ALIAS = $config.keyAlias
    if (-not $env:ANDROID_KEYSTORE_PASSWORD) { $env:ANDROID_KEYSTORE_PASSWORD = Read-LocalSecret 'Passwort des vorhandenen Cloud-Keystores (wird nicht angezeigt)' }
    if (-not $env:ANDROID_KEY_PASSWORD) { $env:ANDROID_KEY_PASSWORD = Read-LocalSecret 'Passwort des vorhandenen privaten Schluessels (wird nicht angezeigt)' }
    & "$PSScriptRoot/configure-github-signing.ps1"
} finally { foreach ($name in $names) { [Environment]::SetEnvironmentVariable($name, $previous[$name], 'Process') } }
