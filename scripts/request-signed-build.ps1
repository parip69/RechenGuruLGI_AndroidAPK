[CmdletBinding()]
param([int]$VersionCode = 0)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Push-Location $root
try {
    $config = Get-Content android-signing.json -Raw | ConvertFrom-Json
    $repo = 'parip69/RechenGuruLGI_AndroidAPK'
    if (-not (Test-Path -LiteralPath 'android-signing/original.keystore')) {
        $required = @('ANDROID_KEYSTORE_BASE64','ANDROID_KEYSTORE_PASSWORD','ANDROID_KEY_ALIAS','ANDROID_KEY_PASSWORD')
        $names = & gh secret list --repo $repo --env $config.githubEnvironment --json name --jq '.[].name'
        if ($LASTEXITCODE -ne 0) { throw 'GitHub-Signierungsumgebung nicht erreichbar und Originalschluessel fehlt im Projekt.' }
        if (@($required | Where-Object { $_ -notin $names }).Count) { throw 'Originalschluessel nicht vollstaendig eingerichtet. Kein Ersatz wird erzeugt.' }
    }
    $changes = & git status --porcelain
    if ($LASTEXITCODE -ne 0 -or $changes) { throw 'Zuerst die Aenderungen committen und auf GitHub hochladen. Gebaut wird genau dieser Commit.' }
    & git fetch origin
    if ($LASTEXITCODE -ne 0) { throw 'GitHub konnte nicht aktualisiert werden.' }
    $revision = (& git rev-parse HEAD).Trim()
    $branch = (& git branch --show-current).Trim()
    if (-not $branch) { throw 'Fuer einen Build einen hochgeladenen Branch auswaehlen.' }
    $remote = & git rev-parse "origin/$branch"
    if ($LASTEXITCODE -ne 0 -or $remote.Trim() -ne $revision) { throw 'Den aktuellen Commit zuerst normal auf GitHub pushen; der Remote-Stand ist abweichend.' }
    & gh workflow run $config.githubWorkflow --repo $repo --ref main -f "source_sha=$revision" -f "version=$VersionCode"
    if ($LASTEXITCODE -ne 0) { throw 'Der gemeinsame Signierungsworkflow konnte nicht gestartet werden.' }
    Write-Host "Signierter GitHub-Build gestartet fuer Commit $revision."
    Write-Host "Fortschritt: https://github.com/$repo/actions/workflows/$($config.githubWorkflow)"
    Write-Host 'Nach erfolgreichem Build: Von GitHub holen. APK, HTML und Versionsnummer kommen gemeinsam zurueck.'
} finally { Pop-Location }
