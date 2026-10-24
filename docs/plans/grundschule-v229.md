# Version 229: Aufgabenauswahl als breite Balken

## Freigegebene Bedienung

Nach dem lokalen APK-Entwurf 228 hat der Nutzer am 24. Oktober 2026 die breite einspaltige Auswahl und ihre Veröffentlichung ausdrücklich freigegeben. Die Aufgaben stehen untereinander als horizontale Balken. Links stehen der ungeteilte Titel und zwei kurze Zeilen mit den tatsächlich gespeicherten Einstellungen; das eigene Zahnrad hat rechts einen festen, mittig ausgerichteten Platz mit mindestens 48 Pixeln Touch-Fläche. Ein kräftiger korallfarbener Rahmen und eine innere Markierung kennzeichnen die aktive Aufgabenfamilie. Der ausgewählte Balken wird beim Öffnen sichtbar gescrollt. Verzögerter Aufgabenfokus darf die Zahlentastatur nicht über die Auswahl legen.

Sechs Hauptbereiche: Plus/Minus, Mal/Geteilt, Rechenketten, Quadratzahlen, Pyramiden und Trauben. Verdoppeln, Halbieren und Fehler üben bleiben darunter erreichbar. Alle 16 ursprünglichen Modus-IDs und gespeicherten Klassen-/Modusprofile bleiben erhalten. Der Textbereich startet die zuletzt verwendete Auswahl; das Zahnrad öffnet den zugehörigen Dialog mit den vorhandenen Einstellfeldern und den besprochenen Positionskästchen. Die früheren globalen Rechen-Einstellfelder werden weiterverwendet; das äußere Zahnrad entfällt.

Zahlen lassen sich pro Position als Bereich oder feste Zahl festlegen, Zeichen pro Position als erlaubte Auswahl. Lücken-Häkchen stehen sichtbar unter den Zahlen und dem Ergebnis. Pro Aufgabe wird eine markierte, eindeutig bestimmbare Position gesucht. Ergebnisauswahl, Reihen/Quadrate, Rechenketten mit 2–10 Zahlen, Rechenreihenfolge und ganzzahlige nichtnegative Zwischenwerte werden geprüft. Besondere Malaufgaben A–F, Pyramiden und Trauben nutzen ihre bisherigen Generatoren. Zusätzliche bisherige Felder bleiben unter „Weitere Einstellungen“ verfügbar.

## Speicherung und Wiederverwendung

Die Positionseinstellungen sind das neue Feld `positionConfig` innerhalb der bisherigen `mathModeSettings`-Profile je Klasse und Modus. Die versteckte Textarea hat unveränderte leere DOM-Standardwerte; damit übernehmen neu geöffnete Aufgabenarten keine fremden Positionskonfigurationen. Eine gespeicherte Auswahl je Familie liegt in `mathTileLast:*`. Bestehende Profile werden nicht zwangsweise migriert. Das vorhandene Teilen/Importieren und der portable HTML-Export führen das zusätzliche Profilfeld mit; fremde Profile und PIN werden dabei geschützt.

Die mathematischen Dateien `rechenketten.js`, `gemischte-malaufgaben.js`, `answer-flow.js` und `realschule/core.js` sind gegenüber dem Stand 225 unverändert. Die Konfigurationsschicht verwendet `MatheChains.generate` und `MatheChains.evaluate`. Native Änderung: ausschließlich die Export-Whitelist für die drei neuen Positionsmodule. Quelle bleibt `app/src/main/assets`, `docs` ist byteidentisch synchronisiert. Service Worker und Versionsinformationen enthalten 229. Die CI prüft auch die neuen reinen Konfigurations-Tests und die Synchronisation des Positionsverzeichnisses.

## Tatsächlich ausgeführte Prüfungen

- 56 Unitprüfungen bestanden, einschließlich bestehender Rechenketten, Malaufgaben A–F und Realschul-Mathematik sowie neuer Positions-, Ergebnis-, Reihen-/Quadrat- und Lückenprüfungen.
- Acht Browserprüfdateien bestanden: `positions-selection-ui`, `positions-ui`, `positions-sharing-ui`, `positions-pwa-ui`, `answer-sizing-ui`, `auto-next-ui`, `answer-flow-ui`, `realschule-stage2-ui`.
- Auswahlbalken bei 320/360/390/412/768 Pixeln: eine Spalte, ungeteilte Titel, drei Textfelder, keine horizontale Überlappung, Zahnrad rechts und mittig, kräftige aktive Markierung sowie Auswahl-/Zahnradnavigation. Die Tastatur bleibt trotz verzögertem Fokus geschlossen.
- Positionseditor: unabhängige Bereiche, feste Werte, drei zufällige Lückenpositionen, Vorschau, Rechenweg, Neustart/Profile, sieben Zahlen, Einfügen/Entfernen im Inneren, ungültige Vorgaben, Querformat und vergrößerte Schrift. Vorhandene Antwortbreiten zusätzlich bei 1280 Pixeln, Auto-Weiter und Android-Touch emuliert.
- Teilen/Import schützt andere Profile und PIN; portabler Export enthält die drei neuen Module inline. Ausführung des exportierten HTML in einem isolierten Browserkontext geprüft. Direkte file://-Navigation ist im Testbrowser administrativ gesperrt und wird nicht als erfolgreicher Test behauptet. Echter Service-Worker-Cache und Offline-Neuladen über lokalen HTTP-Server bestanden.
- Kein eigener physischer Android-/Samsung-Installationstest. Die Prüfung des Nutzers am Entwurf 228 ist kein von diesem Agenten ausgeführter Gerätetest der Version 229.

## APK und Veröffentlichung

Release 229 einschließlich Release-Lint lokal erfolgreich gebaut. Paket `de.parip69.rechengurulgi`, unverändertes Originalzertifikat SHA-256 `3e3a9ad569b2e7abb9f8f77ea3e765832c81e2505f38a41f36be49f5ca79c4bc`, nicht debuggable, gültige v1/v2/v3-Signaturen. Alle 25 Web-Assets sind byteidentisch zwischen finaler APK, Quelle und docs; die sechs Release-APK-Kopien stimmen überein, das HTML-Archiv ist geprüft.

Dateigröße: 13.691.566 Bytes. APK-SHA-256: `38310df9488652f5f3de4afda96886567a70bdced2549080a0d9791459363cad`.

Versionierte APK und HTML liegen im Archiv `Privat`; MatheKids- und bisherige MatheGuru-Downloadadressen sind für Version 229 vorbereitet. Der lokale Teststand 228 bleibt separat erhalten und wird nicht zusätzlich als öffentlicher Release eingecheckt.

Die laufende Cloud-Instanz blockiert weiterhin direkte Abrufe von `parip69.github.io` mit HTTP 403. Deshalb darf ein erfolgreicher Download-/Hashvergleich über die Pages-Adresse nicht behauptet werden. Nach dem normalen GitHub-Upload werden Branch, öffentliche GitHub-APK und GitHub-Actions/Pages-Status gesondert geprüft. Erfolg des Auto-Updates auf einem echten Gerät ist damit noch nicht belegt.

## Abschluss des GitHub-Uploads

Der geprüfte App-Stand wurde ohne Force-Push als `19ebb4ab2b5f81f4d5c05c9141b5b7948a00d7bc` auf `main` hochgeladen. Der Branch wurde über die GitHub-Verbindung bestätigt. Die öffentliche versionierte APK aus genau diesem Commit wurde erneut heruntergeladen und hat denselben SHA-256 wie die lokale Release-APK. `docs/version.json` auf GitHub enthält Version 229. Projekt-Signierungsprüfungen und alle fünf APK-Ablehnungsfälle wurden auch für diesen Release erfolgreich ausgeführt.

Geprüfter öffentlicher GitHub-Download: https://raw.githubusercontent.com/parip69/RechenGuruLGI_AndroidAPK/19ebb4ab2b5f81f4d5c05c9141b5b7948a00d7bc/docs/MatheKids-v229.apk

Für den neuen App-Commit waren bei den abschließenden API-Abfragen noch keine Workflow-Läufe gelistet. Die Pages-Bereitstellung und damit das Auto-Update über die bisherige Pages-Adresse sind deshalb nicht als erfolgreich bestätigt. Die Cloud-Netzwerksperre für diese Adresse bleibt bestehen. Der direkt geprüfte GitHub-Download ist davon getrennt verfügbar.
