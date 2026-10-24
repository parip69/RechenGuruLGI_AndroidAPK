# Version 230: Scrollen in den Aufgabeneinstellungen

## Ursache und Korrektur

Die mobile Web-/PWA-Geste zum Aktualisieren der Seite kannte die neuen nativen Einstellungsdialoge nicht. Wischen auf deren Text und freien Flächen konnte daher eine Seitenaktualisierung statt des unabhängigen Dialog-Scrollens beginnen. Nach Erreichen des oberen Randes konnte der Richtungswechsel hängen bleiben.

Offene Dialoge sind nun vom Pull-to-Refresh ausgeschlossen, auch wenn sie während einer Geste geöffnet werden. Jeder neue Touchbeginn verwirft eine alte unvollständige Geste. Der Dialoginhalt hat einen ausdrücklich flexiblen Scrollbereich; Kopfzeile und Üben-Fußzeile schrumpfen nicht. Normales Pull-to-Refresh auf der eigentlichen Seite bleibt erhalten. Quelle ist `app/src/main/assets`, docs und Cache-Version sind synchronisiert.

## Zahlenbereiche

Die vorhandene Auswahl „Eigene Bereiche“ erlaubt bereits frei konfigurierte Faktoren über 10, unabhängig von Einmaleinsreihen. Hier wurde keine Generatorlogik und kein gespeicherter Standardwert verändert. Ein zusätzlicher Regressionstest prüft Mal/Geteilt gemischt mit erster Zahl 20–22, zweiter Zahl 1–2 und Grenze 44: beide Rechenarten entstehen, darunter 22 × 2 = 44. Grenze 43 bei festem 22 × 2 wird abgewiesen. Die getrennten Einmaleins- und Quadratmodi bleiben unverändert.

## Tatsächlich ausgeführte Prüfungen

- 57 Unitprüfungen bestanden, einschließlich vorhandener Ketten-, gemischter Mal- und Realschulprüfungen.
- Neuer Browser-Touchtest ohne Android-Brücke: echte Chromium-Touchgesten nach oben, unten und Richtungswechsel am oberen Rand in allen 15 ursprünglichen Grundschulmodi. Keine Aktualisierung innerhalb des Dialogs; Seitenaktualisierung außerhalb bleibt verfügbar. Derselbe Test gegen unveränderte Version 229 scheitert reproduzierbar beim Richtungswechsel in Plus.
- Vier weitere Browserdateien bestanden: positions-ui, positions-selection-ui, positions-sharing-ui und positions-pwa-ui. Sie prüfen unter anderem Einstellungen/Profile, schmale und breite Ansichten, Teilen/Import/portables HTML und tatsächlichen Service-Worker-Offlinebetrieb.
- Release 230 mit Release-Lint gebaut und durch den Projekt-APK-Prüfer bestätigt. Paketkennung und Originalzertifikat unverändert; nicht debuggable, v1/v2/v3 gültig. Alle 25 Web-Assets stimmen zwischen Quelle, docs und APK überein; sechs APK-Kopien sind byteidentisch.
- Kein physischer Android-/Samsung-Installationstest durchgeführt.

APK-SHA-256: `acf859c2616e2291430efcbc507778136e95ec97d6dde9457d0e961d887dd04e`.

Die Cloud blockiert den direkten Abruf von parip69.github.io weiterhin mit CONNECT HTTP 403. Ein erfolgreicher Pages-Download oder Geräte-Auto-Update wird deshalb nicht behauptet. Nach normalem GitHub-Push werden Branch und öffentlicher GitHub-APK-Download separat geprüft.
