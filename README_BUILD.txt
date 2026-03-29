Mathe Guru Android-Projekt

Das ist ein fertiges Android-Studio-Projekt für eine APK auf Basis deiner HTML-Datei.

So baust du die APK:
1. Android Studio installieren
2. Diesen Ordner in Android Studio öffnen
3. Warten bis Gradle synchronisiert ist
4. Menü: Build > Build APK(s)
5. Danach liegt die Debug-APK typischerweise unter:
   app/build/outputs/apk/debug/MatheGuru-v<Version>.apk

Hinweise:
- Die HTML wird offline aus den Android-Assets geladen
- JavaScript und DOM Storage sind aktiviert
- Die App ist auf Hochformat gestellt
- Version und APK-Dateiname werden aus version.properties gelesen
- Vor jedem Build und nach jedem Versions-Build werden die Web-Assets aus app/src/main/assets nach docs synchronisiert
- Dabei werden index.html, sw.js und die docs-Version auf die aktuelle VERSION_NAME abgestimmt
- Fuer manuelle HTML-Aenderungen kannst du jederzeit .\sync_web_assets.bat ausfuehren
- Nach einmaligem Ausfuehren von .\setup_git_hooks.bat pruefen Git-Hooks vor Commit und Push automatisch, dass docs/index.html wirklich die neueste Version aus app/src/main/assets enthaelt
- Beim lokalen Commit wird zusaetzlich automatisch docs/redeploy-trigger.txt aktualisiert, damit GitHub Pages nach dem Push sicher einen frischen Redeploy anstoesst
- Empfohlen fuer GitHub Pages: In GitHub unter Settings -> Pages die Quelle auf GitHub Actions stellen und den Workflow "Deploy GitHub Pages" verwenden

Wenn du eine signierte Release-APK willst:
- Build > Generate Signed Bundle / APK
