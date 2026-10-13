# Prompt für Codex in Visual Studio Code

Den folgenden Text in die lokale Codex-Sitzung kopieren:

```text
Arbeite am Repository parip69/RechenGuruLGI_AndroidAPK. Antworte auf Deutsch.
Hole den neuesten geprüften Stand von origin/main. APK 212 wurde in der bisherigen
Codex-Cloud erfolgreich als Release gebaut und mit dem Originalschlüssel signiert.

1. Prüfe zuerst Git-Status, Branch, Remote und AGENTS.md. Schütze alle lokalen,
   uncommitteten Änderungen und untracked Dateien. Kein Reset, Clean oder Force-Push.
   Führe git fetch origin aus. Bei sauberem Checkout main nur per Fast-forward
   aktualisieren. Bei lokalen Änderungen einen neuen isolierten Worktree von
   origin/main anlegen und die Änderungen vergleichen. Bereits auf main vorhandene
   Windows-Patch-Änderungen nicht nochmals anwenden. Sicherungen nicht löschen.

2. Der Nutzer hat ausdrücklich die gemeinsame Projektablage des Originalschlüssels
   im öffentlichen Repository gewählt. Verwende ausschließlich
   android-signing/original.keystore und android-signing/signing.properties oder
   eine nachweislich identische externe Originalkopie. Keine neuen Schlüssel und
   keinen automatisch erzeugten Windows-Debug-Keystore verwenden.
   Paket: de.parip69.rechengurulgi; Alias: androiddebugkey.
   Zertifikat SHA-256:
   3e3a9ad569b2e7abb9f8f77ea3e765832c81e2505f38a41f36be49f5ca79c4bc
   Keine Schlüssel-/Passwortwerte in Chat oder Logs ausgeben. Signierungsdateien
   niemals nach docs, Privat, App-Assets, APK oder Download-Artefakte kopieren.

3. Verwende JDK 17, Android SDK/Build Tools 35 und den Gradle Wrapper 8.9.
   Prüfe JAVA_HOME und ANDROID_HOME. PowerShell muss verfügbar sein.
   Prüfe vorhandene externe ANDROID_KEYSTORE_*/ANDROID_KEY_*-Variablen auf
   unbeabsichtigte Windows-Overrides, ohne ihre Werte auszugeben; externe Werte
   haben Vorrang vor der Projektkonfiguration. Keine globale Konfiguration löschen.

4. Prüfe die Projekt-Signierung mit:
   powershell -NoProfile -ExecutionPolicy Bypass -File tests/project-signing-checks.ps1
   Das Skript prüft bewusst die Projektkopie ohne externe Signierungsvariablen.
   Lies ANDROID_BUILD_SIGNING.md. Für den lokalen Build sind keine GitHub-Secrets
   und kein GitHub-API-Zugriff erforderlich. Der GitHub-Actions-Build ist optional.

5. Bestehende Grundschul-/Realschulfunktionen, Einstellungen, Lernstände,
   Fehlerprotokolle und bewusstes Teilen der Einstellungen erhalten. Alle
   Benutzerdaten bleiben lokal. #settings-Fragmente dürfen nicht verloren gehen.
   Ohne neuen Auftrag keine Änderungen an Bedienung oder Aufgaben durchführen.

6. Für eine nächste fertige Änderung die nächste freie Version verwenden:
   powershell -NoProfile -ExecutionPolicy Bypass -File sync_version_and_build.ps1
   Alternativ scripts/build-release.ps1 mit einer höheren, unbenutzten Version
   und -PublishFiles verwenden. Keine veröffentlichte APK überschreiben.
   Der Build prüft Originalzertifikat, Paket, tatsächliche Version, nicht
   debuggable und v1/v2/v3-Signaturen. Nur geprüfte APKs veröffentlichen.

7. Generator-/Zustandsprüfungen:
   node --test tests/answer-flow.test.cjs tests/realschule.test.cjs tests/rechenketten.test.cjs tests/gemischte-malaufgaben.test.cjs
   Bei Änderungen an der Bedienung auch die Browserprüfungen unter tests/*-ui.cjs
   mit lokalem Chromium/Playwright ausführen. Browseremulation ist kein echter
   Android-Installationstest und beweist keine Passwort-/Autofill-Leistenfreiheit.

8. Erst nach erfolgreichem Build und Tests notwendige Quellen, Web-Spiegel,
   Versionsmetadaten und geprüfte APK-/HTML-Archive gezielt committen und normal
   auf main pushen. .vscode/settings.json bei Bedarf ausschließlich gezielt mit
   git add -f aufnehmen; keine ganzen Ausgabeordner stagen. GitHub-Prüfungen und
   Pages abwarten, versionierte APK wirklich herunterladen und SHA-256 vergleichen.
   Erst dann den Download-Link nennen.

Berichte zunächst kurz: geholter Commit, geschützte lokale Änderungen,
Toolchain-Status und Ergebnis der Originalsignaturprüfung. Warte danach auf
meinen nächsten Änderungsauftrag.
```
