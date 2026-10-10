Mathe Kids – gemeinsamer Android-Build

Verbindliche Anleitung: ANDROID_BUILD_SIGNING.md

Release: Java 17, SDK 35, Build Tools 35.0.0, Gradle-Wrapper 8.9.
Vorhandenen Keystore von Version 209 außerhalb des Repositories sicher bereitstellen.
ANDROID_KEYSTORE_PATH, ANDROID_KEYSTORE_PASSWORD, ANDROID_KEY_ALIAS und ANDROID_KEY_PASSWORD sicher in der Sitzungsumgebung setzen.
Keinen neuen Signaturschlüssel erzeugen und keine Schlüsseldateien hochladen.

Windows: powershell -NoProfile -ExecutionPolicy Bypass -File scripts/build-release.ps1 -VersionCode <NEUE_VERSION> -PublishFiles
Cloud: pwsh -NoProfile -File scripts/build-release.ps1 -VersionCode <NEUE_VERSION> -PublishFiles

Die neue Version muss höher sein als alle bereits veröffentlichten Versionen.
Ausgabe: .release-build/app/outputs/apk/release/MatheKids-v<NEUE_VERSION>.apk
Signatur, Paketname, Version und Release-Eigenschaft werden vor dem Kopieren geprüft.
Versionierte Dateien werden nicht überschrieben; latest-Aliase bleiben bestehen.
Die bisherige sync_version_and_build.bat verwendet jetzt denselben geprüften Release-Ablauf.

Die HTML-App wird weiterhin offline aus Android-Assets geladen.
Web-Quelle: app/src/main/assets; synchronisierte Pages-Dateien: docs.
Für reine Web-Synchronisation weiterhin sync_web_assets.bat verwenden.
Debug-Builds sind nur für Entwicklung und dürfen nicht als Release veröffentlicht werden.
Eine lokale Entwicklungssignatur muss nicht zur installierten Cloud-App passen.
Vor dem Veröffentlichen Dokumentation und Prüfer benutzen; Android-Gerätetest bleibt erforderlich.
