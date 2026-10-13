# The user explicitly chose a shared, checked-in original key. Never print its settings.
$signingRoot = Join-Path (Split-Path -Parent $PSScriptRoot) 'android-signing'
$settingsPath = Join-Path $signingRoot 'signing.properties'
if (Test-Path -LiteralPath $settingsPath -PathType Leaf) {
    $settings = Get-Content -LiteralPath $settingsPath -Raw | ConvertFrom-StringData
    $defaults = @{
        ANDROID_KEYSTORE_PATH = Join-Path $signingRoot $settings.keystore
        ANDROID_KEYSTORE_PASSWORD = $settings.storePassword
        ANDROID_KEY_ALIAS = $settings.alias
        ANDROID_KEY_PASSWORD = $settings.keyPassword
    }
    foreach ($name in $defaults.Keys) {
        if (-not [Environment]::GetEnvironmentVariable($name)) {
            [Environment]::SetEnvironmentVariable($name, $defaults[$name], 'Process')
        }
    }
}
