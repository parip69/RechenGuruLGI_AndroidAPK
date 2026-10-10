# Mathe Kids: Android-Build und bestehende Signatur

## Ergebnis der Bestandsaufnahme (10. Oktober 2026)

Die tatsächlich öffentlich heruntergeladene `MatheKids-v209.apk` entspricht bytegenau der Datei in `docs`: SHA-256 `03714020038b60de58a7faba14559c9cf1601cb17596ce169d0288dee9af136d`.

Ihr Signaturzertifikat hat SHA-256:

```
3e3a9ad569b2e7abb9f8f77ea3e765832c81e2505f38a41f36be49f5ca79c4bc
```

Der Zertifikatsinhaber lautet `C=US, O=Android, CN=Android Debug`. Die bisherige Build-Routine verwendete `assembleDebug`; eine eigene Release-Signierung fehlte. Der zugehörige **private Schlüssel** ist in dieser Cloud unter `/workspace/.cloud-tools/android-user/debug.keystore` als `PrivateKeyEntry`, Alias `androiddebugkey`, vorhanden. Sein Zertifikat stimmt überein. Er wurde nicht aus der APK rekonstruiert. Der erfolgreiche Release-Build mit diesem Schlüssel belegt dessen Verwendbarkeit.

**Nicht alle historischen APKs haben dieselbe Signatur.** Von 86 getrackten APK-Dateien sind alle Signaturen gültig; es gibt drei Zertifikatsgruppen. Die verfügbaren Archive 75–102 verwenden `d1b38d090ab87832d330596b8efdfea874a3d6ef5c9e32c3554865c674af755a`, die verfügbaren Archive 103–110 das nachfolgende zweite Zertifikat. Die verfügbaren versionierten Downloads 104–110 verwenden `e363a406040bc1997b98cac4203388ebaf162f688db934b94a11254bcfd9c6ac`; die verfügbaren Downloads 111–209 verwenden das oben angegebene aktuelle Zertifikat. Vollständige Dateiergebnisse der geprüften, bereits getrackten APKs stehen in [apk-signature-audit.json](docs/plans/apk-signature-audit.json). Nicht verfügbare Zwischenversionen wurden nicht geprüft. Installationen mit dem alten Zertifikat können ohne geeignete, nachgewiesene Signaturlinie nicht mit der aktuellen APK aktualisiert werden. Keine Deinstallation empfehlen, wenn lokale Daten erhalten bleiben müssen.

Der aktuelle Keystore liegt außerhalb von Git; nach Dateinamensprüfung wurden weder im aktuellen Index noch in der erreichbaren Git-Historie Keystores, private PEM/KEY-Dateien oder typische Signing-/Secret-Dateien gefunden. Diese Prüfung ist keine Garantie gegen beliebig anders benanntes oder eingebettetes Schlüsselmaterial. Historische Build-Ausgaben sind bereits getrackt; sie werden jetzt durch einen separaten Build-Ordner geschützt. `.gitignore` verhindert die üblichen Schlüssel-/Secret-Dateien; `git add -f` kann diesen Schutz umgehen.

## Gemeinsame feste Build-Konfiguration

| Eigenschaft | Wert |
|---|---|
| applicationId / namespace | `de.parip69.rechengurulgi` |
| Gradle Wrapper | 8.9, offizieller SHA-256-Prüfwert im Wrapper hinterlegt |
| Android Gradle Plugin | 8.7.3 |
| Kotlin Plugin | 2.0.21 |
| JDK | Java 17 (Cloud: Temurin 17.0.16+8) |
| Android SDK / Build Tools | 35 / 35.0.0 |
| minSdk / targetSdk | 24 / 35 |
| Release | nicht debuggable, kein Minify, v1/v2/v3-Signaturen |
| Version | `version.properties`, integerbasierter Code und Name |
| APK | `MatheKids-v<VERSION>.apk`, eine universelle APK |
| Ausgabe | `.release-build/app/outputs/apk/release/` |

Es gibt keine nativen ABI-Bibliotheken oder APK-Splits im Projekt. Der vorhandene Java/Kotlin- und WebView-Aufbau bleibt erhalten. Identische Signatur und Update-Kompatibilität werden geprüft; byteidentische APKs auf unterschiedlichen Rechnern werden nicht versprochen. Für möglichst gleiche Werkzeuge auch lokal Temurin 17.0.16+8 verwenden. Die lokale Windows-Installation wurde hier nicht ausgeführt oder getestet.

## Schlüssel sicher bereitstellen

Den **vorhandenen** Keystore verschlüsselt und redundant sichern und sicher auf den Windows-PC übertragen; niemals über dieses öffentliche Repository, dessen `Privat`-Ordner, GitHub Pages, Release-Assets oder Chat. `Privat` ist nur ein Verzeichnisname und kein Zugriffsschutz! Unter Windows außerhalb des Checkouts ablegen, beispielsweise in einem durch Benutzerrechte und Laufwerksverschlüsselung geschützten Ordner. Unter Linux Dateirechte `600` und restriktive Verzeichnisrechte verwenden. Alias und Fingerabdruck müssen erhalten bleiben.

In der jeweiligen Build-Sitzung müssen diese echten lokalen Umgebungsvariablen gesetzt sein:

- `ANDROID_KEYSTORE_PATH`: absoluter Pfad zum vorhandenen Keystore, außerhalb des Repositories
- `ANDROID_KEYSTORE_PASSWORD`: Passwort des vorhandenen Keystores
- `ANDROID_KEY_ALIAS`: `androiddebugkey`
- `ANDROID_KEY_PASSWORD`: Passwort des vorhandenen privaten Schlüssels

Passwörter über einen lokalen Secret-Manager oder eine verdeckte Eingabe in die Sitzungsumgebung übernehmen; nicht als Kommandozeilenargumente, im Terminalverlauf, in `.ps1`/`.bat`, Gradle-Dateien oder Protokollen speichern. Das bisherige automatisch erzeugte Debug-Keystore hat eine schwache Standard-Passwortkonvention. Es sollte bei sicherer Bereitstellung mit einem stärkeren Store-/Schlüsselpasswort geschützt werden, **ohne den privaten Schlüssel oder das Zertifikat zu wechseln**. Dies wurde hier nicht eigenmächtig vorgenommen. Passwortänderungen und verschlüsselte Backups anschließend mit einem Test-Build prüfen. Keine echten Passwörter werden dokumentiert.

Der aktuelle Cloud-Schlüssel wurde auf Dateirechte `600` gesetzt. Seine Existenz in diesem Workspace beweist keine dauerhafte Sicherung oder Verfügbarkeit in einer neuen Cloud-Umgebung. Die gemeldete Cloud-Konfiguration hat derzeit keine sicheren Signing-Bindings. Proxy-Secrets für HTTPS sind keine echten lokalen Keystore-Passwörter und dürfen dafür nicht zweckentfremdet werden. Ohne sicher bereitgestellten Originalschlüssel muss ein Release-Build abbrechen. Für dauerhafte zentrale Signierung bieten sich GitHub Actions mit geschützten Environment-Secrets, Freigabe und temporärem Keystore außerhalb des Checkouts an; dies ist eine Option, hier nicht eingerichtet. Niemals ersatzweise einen neuen Debug- oder Release-Schlüssel erzeugen.

## Windows / Visual Studio Code

1. Java 17, Android SDK 35 einschließlich Build Tools 35.0.0 und PowerShell bereitstellen. `JAVA_HOME` und `ANDROID_HOME` setzen; Java muss im PATH liegen. Android-Lizenzen regulär akzeptieren.
2. Original-Keystore außerhalb des Repositories bereitstellen und die vier Signierungsvariablen sicher setzen.
3. Im Repository-Terminal eine höhere, noch unbenutzte Version bauen:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/build-release.ps1 -VersionCode 211 -PublishFiles
```

`211` ist ein Beispiel für die Version nach 210, kein dauerhaft festzulegender Wert. Ohne `-PublishFiles` wird nur gebaut und geprüft; nichts nach `docs` oder `Privat` kopiert. Die Version und Web-Metadaten werden dabei synchronisiert. Die vorhandene `sync_version_and_build.bat`/`.ps1` ruft denselben geprüften Release-Ablauf mit der nächsten Version auf. `-SkipBuild` veröffentlicht keine ungeprüften Dateien mehr.

## Codex Cloud

Die eingerichtete Umgebung verwendet `/workspace/.cloud-tools/jdk-17.0.16+8`, `/workspace/.cloud-tools/android-sdk`, `/workspace/.cloud-tools/gradle` und `/workspace/.cloud-tools/pwsh`. Java und `pwsh` müssen im PATH sein. `GRADLE_USER_HOME` auf den vorhandenen Cache setzen. Die vorhandene Cloud-CA-Vertrauensstellung (`/etc/ssl/certs/java/cacerts`) für Gradle beibehalten. Original-Keystore und Signierungsvariablen wie oben sicher bereitstellen.

```bash
pwsh -NoProfile -File scripts/build-release.ps1 -VersionCode 211 -PublishFiles
```

Kein Init-Skript für Build-Verzeichnisse und keine ausgeschlossenen Sync-Tasks mehr nötig. Der Wrapper und die Gradle-Sync-Tasks funktionieren für beide Plattformen. Nur Werkzeuge und der externe Keystore unterscheiden sich im Pfad, nicht die Build-Einstellungen.

## Prüfung und Veröffentlichung

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/verify-apk.ps1 -Apk .release-build/app/outputs/apk/release/MatheKids-v211.apk -ExpectedVersion 211
```

Der Prüfer verwendet SDK 35.0.0 `apksigner verify --verbose --print-certs` und `aapt dump badging`. Die v1-Signatur wird zusätzlich mit `--min-sdk-version 23` geprüft, weil die normale Prüfung für minSdk 24 v2 statt v1 prüft. Dies ist nur eine Signaturprüfung; die App unterstützt weiterhin Android ab API 24. Warnungen zu v1-META-INF-Einträgen sind durch die für die unterstützten Android-Versionen geprüfte vollständige v2/v3-Signatur abgedeckt. Er verlangt das fest hinterlegte Zertifikat von 209, denselben Paketnamen, eine höhere tatsächliche Versionsnummer als die bisherige `docs/MatheKids-latest.apk`, passenden Versionsnamen, gültige v1/v2/v3-Signaturen und `debuggable=false`. Eine vorher veröffentlichte APK kann zum Nachprüfen mit `-Baseline docs/MatheKids-v209.apk` geprüft werden; `-AllowSameVersion` ist ausschließlich für wiederholte Prüfung, nicht für Veröffentlichung.

Der Build-Helfer prüft zusätzlich die höchste vorhandene versionierte Download-Datei und verweigert Überschreiben von Versionsarchiven. Erst nach erfolgreicher Prüfung kopiert `-PublishFiles` APK, HTML und öffentliche Prüfmetadaten in die vorgesehenen Ordner; nur die beiden ausdrücklich dafür vorgesehenen `latest`-Aliase werden aktualisiert. Keine bestehenden versionierten APKs oder Releases löschen oder überschreiben. Nicht mit `assembleDebug` gebaute Dateien manuell veröffentlichen. Ein bloßes `assembleRelease` ist noch keine Freigabe: den Prüfer immer ausführen.

Vor dem Commit `git status` und `git diff` kontrollieren, nur Quell-/Build-Dateien, Dokumentation, APKs und öffentliche Prüfmetadaten aufnehmen. Nie Schlüssel, Passwörter, lokale Secret-Dateien oder komplette Build-Verzeichnisse aufnehmen. Danach normal committen und auf `main` pushen. Pages-Deployment abwarten und die tatsächlich öffentliche versionierte APK erneut herunterladen; SHA-256 mit der geprüften Datei vergleichen. GitHub-Release-Tags wären zusätzlich möglich, werden vom bestehenden Updater aber nicht benötigt. Neue Tags/Assets niemals wiederverwenden oder ersetzen.

## Bestehender Update-Weg und Datenschutz

Die App liest die Versionsnummer aus der HTML-Seite von `https://parip69.github.io/RechenGuruLGI_AndroidAPK/` mit Cache-Busting und vergleicht numerisch. Sie bietet nur höhere Versionen an. Der Download verwendet `MatheKids-v<Nummer>.apk` auf genau dieser HTTPS-Pages-Basis; der manuelle Download verwendet `MatheKids-latest.apk`. `MatheGuru`-Aliase bleiben erhalten. Die native Brücke öffnet den HTTPS-Download im externen Browser; Androids Installation bleibt eine bestätigte Benutzeraktion. Es wird keine GitHub-Releases-API gebraucht. Diese API war während des Audits per Proxy gesperrt. Die zugängliche öffentliche GitHub-Releases-HTML-Seite meldete „There aren’t any releases here“; lokale Git-Tags waren ebenfalls nicht vorhanden. Die tatsächliche Veröffentlichung erfolgt über getrackte APK-Dateien und Pages, nicht Release-Objekte.

Die App fordert `INTERNET` für Updates; keine Kamera-, Mikrofon-, Standort- oder direkte Installationsberechtigung wurde angefordert. Der Receiver-Schutz aus AndroidX ist keine zusätzliche gefährliche Nutzerberechtigung. Einstellungen, Lernstände und bewusster Einstellungsversand einschließlich URL-Fragment bleiben unverändert. `allowBackup=true` bleibt bestehen: Androids Betriebssystem kann bei aktivierter Gerätesicherung App-Daten sichern; dies ist von der App-eigenen lokalen Speicherung zu unterscheiden. Die native HTTPS-Brücke ist allgemein verwendbar und die WebView hat bestehende großzügige File-/Mixed-Content-Einstellungen; diese Einstellungen wurden bei diesem Build-Auftrag nicht umgeschrieben. Es gibt keine neu eingeführte Online-Speicherung.

## Installationstest, Play Protect und Schlüsselverlust

Der Wechsel von einer Debug-APK zu einer nicht debuggable Release-APK mit **demselben privaten Schlüssel, Paketnamen und höherem versionCode** sollte als Update über 209 installierbar sein. Der Zertifikatsname bleibt aus Kompatibilitätsgründen „Android Debug“; ein neu erzeugtes Zertifikat würde diese Kontinuität zerstören. Ein echter Installationstest auf einem Android-Gerät wurde nicht durchgeführt. Vor breitem Einsatz auf einem Testgerät mit 209 aktualisieren und Einstellungen, Lernstände, Teilen sowie Update-Erkennung prüfen; nicht deinstallieren. Bestehende lokale App-Daten werden durch diesen Build-Auftrag nicht migriert oder verändert.

Gleichbleibende Signierung und gültige Release-Struktur garantieren nicht, dass Google Play Protect keine Warnung mehr zeigt. Unbekannte, außerhalb von Google Play verteilte Apps können weiterhin geprüft oder beanstandet werden. Keine Sicherheitsprüfung deaktivieren. Für eine konkrete Fehlklassifizierung Googles offiziellen [Play-Protect-Beschwerdeweg](https://support.google.com/googleplay/android-developer/contact/protectappeals) und die [Android-Entwicklerverifizierung](https://developer.android.com/developer-verification) prüfen; für Play-Vertrieb die Aufnahme und App-Signing-Verfahren vorher einschließlich Schlüsselkontinuität prüfen.

Bei Schlüsselverlust zuerst sichere Backups und die bisherigen Build-Umgebungen untersuchen. Ein APK-Zertifikat enthält keinen rekonstruierbaren privaten Schlüssel. Ohne den passenden privaten Schlüssel keine kompatible APK freigeben und keinen stillen Schlüsselwechsel durchführen. Falls private Schlüssel jemals veröffentlicht wurden, Fund ausdrücklich melden; kompromittierte Schlüssel erfordern einen geplanten Migrations-/Sicherheitsentscheid. Die Git-Historie nicht eigenmächtig umschreiben und nicht durch einen neuen Schlüssel lokale Daten gefährden.

## Durchgeführte technische Prüfungen für Version 210

- Gemeinsames `scripts/build-release.ps1 -VersionCode 210 -PublishFiles` in der Cloud erfolgreich; `assembleRelease` und `lintVitalRelease` erfolgreich.
- Paketname, Zertifikat von 209, Code/Name 210, `debuggable=false`, gültige v1/v2/v3-Signaturen geprüft. Öffentliche Prüfmetadaten: [MatheKids-v210-signature.json](Privat/MatheKids-v210-signature.json).
- `tests/android-release-checks.ps1` akzeptiert die echte Release-APK und weist fünf Fehlerfälle zurück: altes Zertifikat, Debug-APK, wiederverwendete Version, abweichende erwartete Version und manipulierte APK.
- Gradle ohne Signierungsvariablen getestet: erwarteter Abbruch mit fehlendem `ANDROID_KEYSTORE_PATH`; kein Ersatzschlüssel erzeugt. `.gitignore`-Regeln für Schlüssel, Signing-Dateien, `.env` und Ausgabeordner geprüft.
- Realschul-Regressionstest `node --test tests/realschule.test.cjs` erfolgreich. APK-Asset-Vergleich gegen 209: nur Versionsmetadaten in HTML/Service Worker/JSON sowie von Gradle erzeugte Release-Dex-Optimierungsprofile unterscheiden sich; Aufgabenmodule und Designs sind identisch.
- Keine Windows-Ausführung, keine echte Android-Installation und keine tatsächliche Play-Protect-Prüfung durchgeführt.
