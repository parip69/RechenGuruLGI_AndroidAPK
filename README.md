# RechenGuruLGI_AndroidAPK

Android-Studio-Projekt fuer zwei native Android-Wrapper:

- `offline`: laedt die lokale Web-App aus `app/src/main/assets/index.html`
- `web`: laedt die GitHub-Pages-Version unter `https://parip69.github.io/RechenGuruLGI_AndroidAPK/`

Dieses Projekt folgt einem festen Muster:

- `app/src/main/assets/` ist die bearbeitbare Web-Quelle
- `docs/` ist die synchronisierte Auslieferung fuer GitHub Pages und installierte PWAs
- `sync_web_assets.ps1` haelt HTML-Version, Service-Worker-Cache und `docs/` zusammen
- `sync_version_and_build.ps1` erhoeht die Version, baut die APK und erstellt Archivkopien
- iPhone-/Safari-Installation wird ueber `apple-touch-icon.png` mitgedacht

## Wichtige Projektregeln

- Web-Aenderungen nie nur in `docs/` machen
- Quelle bleibt immer `app/src/main/assets/`
- `sw.js` entscheidet mit, ob eine installierte PWA neue Aenderungen wirklich zieht
- Fuer reine Web-/PWA-Aenderungen ist `.\sync_web_assets.bat` der schnelle Sync
- Fuer verteilte Versionen ist `.\sync_version_and_build.bat` der Standardweg

## Wichtige Dateien

- [Privat/START_HIER.md](d:/@Visual%20Studio%20Code/RechenGuruLGI_AndroidAPK/Privat/START_HIER.md)
- [Privat/README.md](d:/@Visual%20Studio%20Code/RechenGuruLGI_AndroidAPK/Privat/README.md)
- [Privat/Prompt_WebApp_PWA_Update_und_Cache.md](d:/@Visual%20Studio%20Code/RechenGuruLGI_AndroidAPK/Privat/Prompt_WebApp_PWA_Update_und_Cache.md)
- [Privat/Vorlage_Android_HTML_APK_Referenz.md](d:/@Visual%20Studio%20Code/RechenGuruLGI_AndroidAPK/Privat/Vorlage_Android_HTML_APK_Referenz.md)

## Schnellstart

Debug-Builds:

```powershell
.\gradlew.bat assembleOfflineDebug
.\gradlew.bat assembleWebDebug
```

Nur Web-Assets und `docs/` synchronisieren:

```powershell
.\sync_web_assets.bat
```

Version erhoehen, APK bauen und archivieren:

```powershell
.\sync_version_and_build.bat
```
