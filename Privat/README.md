# RechenGuruLGI_AndroidAPK - Projektablauf

Diese Datei beschreibt den festen Ablauf fuer dieses Projekt, damit Web-App, PWA, GitHub Pages und APK dauerhaft nach demselben Muster gepflegt werden.

## Grundregel

- `app/src/main/assets/` ist die Quelle
- `docs/` ist die Auslieferung

Das gilt fuer:

- `index.html`
- `manifest.webmanifest`
- `sw.js`
- `pwa-bootstrap.js`
- alle Dateien unter `app/src/main/assets/icons/`

## Die zwei wichtigsten Skripte

### `sync_web_assets.ps1` / `sync_web_assets.bat`

Dieses Skript:

- zieht die aktuelle Version aus `version.properties`
- setzt die sichtbare HTML-Version
- setzt die Web-/Service-Worker-Cache-Version
- synchronisiert die Dateien von `app/src/main/assets/` nach `docs/`
- haelt `docs/index.html`, `docs/manifest.webmanifest`, `docs/sw.js` und die Icons aktuell

Nutzen fuer:

- reine Web-/PWA-Aenderungen
- Fullscreen-/Manifest-/Icon-Aenderungen
- wenn `docs/` nachgezogen werden soll

### `sync_version_and_build.ps1` / `sync_version_and_build.bat`

Dieses Skript:

- erhoeht `VERSION_CODE` und `VERSION_NAME`
- ruft `sync_web_assets.ps1` auf
- baut die Debug-APK
- synchronisiert danach sicherheitshalber noch einmal die Web-Assets
- archiviert HTML und APK in `Privat/`

Nutzen fuer:

- neue verteilte Versionen
- APK-Release-Staende
- Archivierung mit konsistenter Versionsnummer

## Was fuer PWA-/Web-Updates wichtig ist

- Nicht nur `docs/` bearbeiten
- Immer `app/src/main/assets/` als Quelle aendern
- Danach mindestens `.\sync_web_assets.bat` oder `.\gradlew.bat assembleDebug` ausfuehren
- Danach pruefen, dass die Aenderung auch in `docs/` angekommen ist

## Was fuer iPhone wichtig ist

- `apple-touch-icon.png` ist Teil des Pflichtpakets
- In `index.html` muss `apple-touch-icon` mit `sizes="180x180"` verlinkt sein
- Bei Icon-Aenderungen kann auf iPhone oder manchen Android-Launchern eine Neuinstallation der Web-App noetig sein

## Wichtige Prompt-Datei

Fuer spaetere KI-gestuetzte Web-/PWA-Aenderungen benutze:

- `Privat/Prompt_WebApp_PWA_Update_und_Cache.md`

Damit muessen wir die Grundregeln nicht jedes Mal neu erklaeren.
