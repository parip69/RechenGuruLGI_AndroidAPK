# Bedienung und gemeinsamer Signierungsweg – Vorbereitung 212

Stand: 13. Oktober 2026. APK 212 wurde in der bisherigen Cloud mit JDK 17, SDK/Build Tools 35 und Gradle Wrapper 8.9 erfolgreich als Release gebaut. Paket `de.parip69.rechengurulgi`, versionCode/versionName 212, nicht debuggable, gültige v1/v2/v3-Signaturen. Zertifikat SHA-256 `3e3a9ad569b2e7abb9f8f77ea3e765832c81e2505f38a41f36be49f5ca79c4bc`: identisch mit APK 211. APK-Datei SHA-256 `6f346fdbbc6c825c2ae8687d47c6fb1cd275125de65c1edf2f70679025330815`.

Der Nutzer hat nach Prüfung der tatsächlichen öffentlichen Repository-Sichtbarkeit ausdrücklich die gemeinsame Projektablage des Originalschlüssels autorisiert. Die byteidentische Kopie liegt in `android-signing`, außerhalb aller App-/Web-/Download-Dateien. Sie ist kein Geheimnis mehr. Es wurde kein neuer Schlüssel erzeugt und kein Windows-Schlüssel verwendet. Die Standardpasswort-Konvention des vorhandenen Android-Keystores wurde lokal überprüft; Passwörter wurden nicht in Chat oder Build-Logs ausgegeben. Eine Übernahme in GitHub-Secrets ist nicht erfolgt, weil die GitHub-API Forbidden meldet. Der lokale Build benötigt diesen API-Zugriff nicht mehr.

## Bedienung

- Grundschule: große, kräftige Zahlenkästchen auch für Rechenketten und gemischte Malaufgaben. Genau ein echtes Antwortfeld an der fehlenden Stelle; keine separate Antwort darunter.
- Rechenketten: feste Länge 2–10 oder zufällige Länge 2–10. Aufbau wählbar: frei mischen, Mal/Geteilt-Blöcke mit Plus/Minus verbinden, erst Mal/Geteilt und danach Plus/Minus oder zufälliger Aufbau. Nur ausgewählte Zeichen werden verwendet; bestehende Standardwerte bleiben erhalten.
- Die bestehende kleine Zahlentastatur bleibt auf Android/iOS erhalten, weil die unerwünschte Passwort-/Kartenleiste einer Systemtastatur nicht zuverlässig ausgeschlossen werden kann. Cursor-Pfeile links/rechts und Löschen unterstützen gezielte Stellenkorrekturen.
- Weiter/Enter prüft ausdrücklich. Richtig zählt einmal; erst das nächste Weiter wechselt die Aufgabe. Keine automatische Prüfung, keine automatische Umschaltung nach richtiger Eingabe.
- Erster Fehler: rot, Antwort bleibt stehen, noch keine Falsch-Wertung. Nach Korrektur zweite Chance. Zweiter Fehler zählt einmal und wartet auf Weiter. Unverändertes Weiter nach erstem Fehler zählt falsch und geht sofort weiter.
- Neue Aufgabe überspringt eine offene Aufgabe, wie vom Nutzer ausdrücklich gewählt. Abgeschlossene Aufgaben werden nicht noch einmal gezählt.
- Mehrere Antwortfelder: zunächst zum nächsten Feld, nach dem letzten Feld gemeinsam prüfen. Pyramide/Traube werden als eine Aufgabe bewertet, nicht mehrfach je Kästchen.
- Hilfe vor/nach dem ersten Fehler bleibt möglich. Rechenweg wird nur auf ausdrücklichen Druck geöffnet. In Realschule bleibt auch nach einem angesehenen Rechenweg eine Antwortkorrektur möglich.
- Grundschule erhält additive interne Statistik `mathAnswerStats_v1`: sofort richtig, zweiter Versuch richtig, falsch, übersprungen, Hilfe benutzt. Übersprungen zählt in der bisherigen einfachen Richtig/Falsch-Ansicht als falsch. Alte gespeicherte Werte bleiben erhalten.
- Realschule behält vorhandene Sitzungen/Schritte/Statistiken, ergänzt die beiden Erfolgskategorien und Hilfenutzung. „Mit Lösung“ ist bei neuen Aufgaben eine Zusatzinformation zum endgültigen Ergebnis; die Aufgabe wird einmal gezählt.
- Für mobile Auswahlfelder sowie spezielle Realschul-Eingaben gibt es einen kleinen Pfeil als Bedienalternative zu Enter; keine zusätzliche große Prüfen-/Weiter-Leiste unter der Aufgabe.
- Scrollen verwendet gemessene Aufgaben-/Statistikgrenzen, VisualViewport und die tatsächliche Höhe der eigenen Tastatur. Lange Aufgaben halten das aktive Antwortfeld im sichtbaren Bereich.

## Dateien

Gemeinsame Zustandslogik: `app/src/main/assets/answer-flow.js`. Grundschul-Steuerung/Layout: `app/src/main/assets/index.html`. Realschule: `realschule/ui.js` und `style.css`. Offline-/HTML-Export: Service Worker, Web-Sync und native Asset-Whitelist. Die Quelle bleibt unter `app/src/main/assets`; `docs` wird synchronisiert.

Gemeinsame Signierung: `android-signing/original.keystore`, `android-signing/signing.properties`, `android-signing.json`, `scripts/load-project-signing.ps1`, `check-signing-key.ps1`, `build-release.ps1` und `sync_version_and_build.ps1`. Der vorhandene VS-Code-Build-Task baut lokal mit dem Originalschlüssel. Optional bleibt `request-signed-build.ps1` für GitHub Actions; der Workflow bevorzugt Secrets und nutzt sonst die Projektkopie. „Von GitHub holen“ verwendet weiterhin Fast-forward. Signierungsdateien sind durch APK-Inventarprüfung von APK-Inhalten ausgeschlossen; in docs, Privat und App-Assets wurden keine Signierungsdateien gefunden.

## Durchgeführte Prüfungen

- 10 Zustandsprüfungen und 28 bestehende Generator-/Parserprüfungen bestanden, einschließlich 14.500 Realschulaufgaben und aller Rechenketten-Zeichenkombinationen.
- Browserprüfung der neuen Steuerung unter Chrome: PC-Enter und Android-Touch-Emulation mit der eigenen Zahlentastatur, inklusive Korrigieren/Löschen/Cursor-Pfeilen, zwei Versuchen, Überspringen, Statistik, Hilfe, allen Zahlenmodi, mehreren Antwortfeldern, Reload und Realschul-Bruchschritten.
- Bestehende Browserprüfungen für Rechenketten, gemischte Malaufgaben, Realschule, Bruch-/Systemaufgaben, Rückmeldungen und Vollbild-Rechenwege bestanden. Tests an die neue ausdrückliche Prüfsteuerung und verzögerte Fehlerzählung angepasst.
- Layout bei 320/390/768 Pixeln sowie Querformat untersucht; kräftige Inline-Eingabe und kein horizontaler Seitenüberlauf geprüft.
- `assembleRelease` einschließlich Kotlin-Kompilierung und Release-Lint mit JDK 17 / SDK 35 erfolgreich. Die tatsächlich gebaute APK 212 wurde anschließend geprüft.
- Projekt-Signierung ohne externe Variablen bestanden; falscher Alias, unkonfigurierter Schlüsselpfad und falsches externes Passwort korrekt abgelehnt.
- APK-Negativprüfungen bestanden: anderes historisches Zertifikat, Debug-APK, wiederverwendete Version, falsche erwartete Version und manipulierte APK abgelehnt.
- Alle sechs Build-/Download-/Archiv-APK-Kopien haben denselben SHA-256; HTML-Archiv und Web-Spiegel sind synchron.
- Bestehende Release-APK 211 mit unverändertem Paketnamen und Zertifikat sowie v1/v2/v3-Signaturen nachgeprüft.
- Kein Android-Gerät per ADB erkannt. Touch-Emulation ist kein echter Android-/iOS-Gerätetest; Passwortleistenfreiheit und Installation auf einem realen Gerät bleiben zu prüfen.

## Veröffentlichung

Erst nach erfolgreichen Build-/Generator-/Zustands-/Browserprüfungen committen und normal auf main pushen. Anschließend GitHub-Prüfungen und Pages abwarten sowie die tatsächlich öffentlich heruntergeladene `MatheKids-v212.apk` mit dem oben genannten Hash vergleichen. Ein realer Android-Installationstest und die Prüfung der Passwort-/Autofill-Leisten auf einem echten Gerät wurden nicht durchgeführt.
