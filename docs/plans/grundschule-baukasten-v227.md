# Grundschul-Baukasten – Version 227

## Umsetzung

Der freigegebene Entwurf vom 23. Oktober 2026 ergänzt die vorhandene App um den Einstieg „Aufgaben · Meine Aufgaben“. Hauptkacheln für Plus, Minus, Plus/Minus, Mal/Geteilt, alle Rechenarten und Rechenketten führen zum schnellen Üben oder gemeinsamen Kästcheneditor. Die vollständige bisherige Auswahl bleibt erreichbar. Sonderaufgaben stehen unter „Weitere Aufgaben“.

Die Kästchen zeigen feste Werte ausdrücklich als einzelne Zahl und Zufallsbereiche als Minimum–Maximum. Zahlen und Operatoren sind anklickbar; genau ein zugehöriges Einstellfeld öffnet unter der Rechnung. Einfügen und Entfernen arbeiten mit vollständigen Rechengliedern und stabilen Kästchenkennungen. Ketten unterstützen 2–10 Zahlen, gemischte Länge und die bisherigen Aufbauvarianten. Das Layout bricht um; Hauptnavigation wird während der Detailkonfiguration eingeklappt.

Markierte Zahlen, Zeichen und das Ergebnis können abgefragt werden. Pro Aufgabe wird genau eine mögliche Lücke gewählt und ihre Eindeutigkeit geprüft. Der optionale Mehrlückenmodus wird nicht angeboten. Division bleibt ganzzahlig ohne Rest; keine Division durch Null oder negativen Zwischenwerte. Übergänge/Entleihen werden stellenweise geprüft. Ergebnis- und Zwischenwertgrenzen werden getrennt gespeichert. Unpassende Vorgaben erzeugen eine verständliche Meldung und verhindern den Übungsstart; kein stiller Ersatz durch andere Benutzervorgaben.

Reihentraining umfasst Reihen 1–10, Mehrfach- und Schnellwahl, die bisherigen Zahlenprofile, Quadrate und passende Umkehrdivision. Bei Faktoraufgaben bleibt die bekannte Reihe sichtbar. Richtig/Falsch, Vergleichen, Schwierigkeit/adaptive Gewichtung, Rundenzeit und Blitzmodus bleiben im Baukasten einstellbar. Blitz unterstützt die reine Ergebnisabfrage; widersprüchliche Formate werden erklärt. Fünf Beispiele kommen aus demselben Konfigurationsgenerator wie die Übung und verändern keine Lernwerte.

## Wiederverwendung und unveränderte Funktionen

Die neuen reinen Konfigurationsfunktionen nutzen `MatheChains.generate` als bestehenden Zahlensampler und `MatheChains.evaluate` als gemeinsame exakte Auswertung mit Rechenweg. Die Konfigurationsschicht ergänzt positionsbezogene Bereiche, Operatoren, Reihenbeziehungen und Lückenprüfung. Antwortfelder, Zahlentastatur, bestehende Antwortzustände, Punkte, Fehlerliste, Hinweise, Drucken und Weiter-Schaltung werden weiterverwendet.

`rechenketten.js`, `gemischte-malaufgaben.js`, `answer-flow.js` und `realschule/core.js` sind unverändert. Pyramiden- und Traubengeneratoren samt Raster und Lückenlogik bleiben unverändert. Alle 16 bisherigen Grundschul-Modus-IDs bleiben erhalten. Die Realschul-Produktänderung beschränkt sich auf den Text der gemeinsamen Grundschul-Info. Die native Änderung beschränkt sich auf die Export-Whitelist für die vier neuen Assets. Paketkennung und Originalschlüssel bleiben erhalten.

## Speicherung und Übernahme

`appStorage` verwendet weiterhin den bestehenden Namensraum `RechenGuruLGI_`. Alte `mathModeSettings:*`-Profile werden nicht migriert oder überschrieben. Der Adapter liest sie beim erstmaligen Öffnen des Baukastens. Jeder Hauptbereich und jede Klasse erhalten getrennte letzte Zustände in `mathBuilderLast:grade<0–4>:<family>`. Die aktive Übung liegt in `mathBuilderActive_v1`.

`mathExerciseLibrary_v1` enthält die atomar gespeicherte Bibliothek. Vorlagen besitzen eine zufällige, vom Titel unabhängige ID, Titel, vollständige Konfiguration, echtes Beispiel und Zeitstempel. Bearbeiten/Umbenennen aktualisiert dieselbe ID; Kopieren erzeugt eine neue. Löschen fragt nach und entfernt nur den gewählten Datensatz. Persönliche Vorlagen verändern nicht die letzten Einstellungen der Hauptkacheln. Speicherfehler und zwischenzeitlich geänderte Vorlagen werden gemeldet; eine Rohdatensicherung ist verfügbar.

Teilen ohne Daten bleibt ein normaler App-Link. Die neue ausdrückliche Gruppe „Eigene Aufgaben“ erlaubt die Einzelauswahl. Vorlagen werden mit Größenprüfung als getrennte Nutzdaten übertragen; der Empfänger bestätigt und erhält neue lokale IDs. Einstellungslinks der Schemata 1/2 bleiben lesbar, die PIN bleibt vom Einstellungslink ausgeschlossen. Vorlagen-Dateien und portable HTML-Dateien führen die Bibliothek ebenfalls mit neuen IDs zusammen. Der Export bettet alle neuen Module ein; Web-Sync, nativer Export und Service Worker kennen genau diese Dateien.

## Tatsächlich ausgeführte Prüfungen

- `node --test tests/*.test.cjs`: 56 bestanden, 0 fehlgeschlagen. Enthält die vorhandenen 9.450 deterministischen Kettenfälle, 14.500 Realschulaufgaben, A–F sowie neue Bereiche/Festwerte, Operatoren, Reihen/Quadrate, Übergänge, Eindeutigkeit, Kettenaufbau/gemischte Länge, Schwierigkeiten, Altprofile und Vorlagen-CRUD/Import/Speicherfehler.
- Alle 12 Browserprüfdateien ausgeführt. Antwortablauf, Antwortfeldgrößen, automatische/manuelle Umschaltung, A–F, Kästcheneditor, Vorlagen/Neustart/Umbenennen/Kopie/Löschrückfrage, Einfügen/Entfernen, mathematische Vorschau, Teilen/Import, portabler Export, Realschule und Ketten geprüft. Vier ältere Tests benötigen aktuelle Erwartungen beziehungsweise das ausdrückliche Öffnen der Einstellungen oder Abschalten der Automatik für ihre manuellen Prüfszenarien; Produktverhalten wurde dafür nicht zurückgebaut.
- Baukasten bei 320/360/390/412/768 Pixeln, Querformat und 200 % Schrift geprüft; keine Überlappung der Kästchen oder horizontaler Seitenüberlauf. Lange Titel und 51 persönliche Kacheln geprüft. Bestehende Antwortgrößenprüfung zusätzlich bei 1280 Pixeln.
- Echte Service-Worker-Prüfung über lokalen HTTP-Server: alle vier neuen Dateien im Cache, Offline-Neuladen, Vorlage und neue Übung nach Wiederherstellung verfügbar.
- Projekt-Originalsignierung und bestehende Release-APK 225 mit JDK 17, SDK/Build Tools 35 und PowerShell geprüft.
- Kein echter Android-/Samsung-Installationstest, kein Play-Protect- oder WhatsApp-Gerätetest. Touch-/Browseremulation beweist keine Installation auf einem physischen Gerät.

## Release-Nachweis

Release 227 wurde mit JDK 17.0.17, Android SDK/Build Tools 35 und Wrapper 8.9 erfolgreich als Release gebaut, einschließlich Release-Lint. Der erste Versuch benötigte die im Projekt dokumentierte JVM-Vertrauensstellung auf `/etc/ssl/certs/java/cacerts`; TLS-Prüfung wurde nicht deaktiviert. Der intern bereits gebaute, unveröffentlichte Stand 226 wurde nach der Kontrastkorrektur durch 227 abgelöst; seine Dateien bleiben unter dem ignorierten `.release-build/unpublished-v226` erhalten.

Paket: `de.parip69.rechengurulgi`; Code/Name 227; nicht debuggable; gültige v1/v2/v3-Signaturen. Zertifikat SHA-256: `3e3a9ad569b2e7abb9f8f77ea3e765832c81e2505f38a41f36be49f5ca79c4bc`, unverändert gegenüber dem Original. Alle Projekt-Signierungsprüfungen und fünf APK-Ablehnungsfälle bestanden. Alle 26 APK-Assets sind byteidentisch mit Quelle und docs. Sechs APK-Kopien und das HTML-Archiv sind geprüft. In allen sechs Farbschemata erreicht die neue Oberfläche den im Browsertest geprüften Textkontrast von mindestens 4,5:1.

APK-Datei: `Privat/MatheKids-v227.apk`, 13.694.077 Bytes. SHA-256: `dba221d06196897b93b019efa07560655e70e1f3ff47b0fe4dad171443975267`.

## GitHub-Veröffentlichung

Auf erneuten ausdrücklichen Upload-Auftrag wurde der geprüfte Stand am 23. Oktober 2026 ohne Force-Push auf `main` veröffentlicht: `c74ba23003aaa4c0ebe1ca172033cdcf44ccb39e`. Der GitHub-Branch wurde anschließend über die Verbindung und per Git abgefragt. Die versionierte APK wurde aus genau diesem öffentlichen Commit erneut heruntergeladen; Größe und SHA-256 stimmen mit der geprüften lokalen APK überein.

Geprüfter direkter GitHub-Download: https://raw.githubusercontent.com/parip69/RechenGuruLGI_AndroidAPK/c74ba23003aaa4c0ebe1ca172033cdcf44ccb39e/docs/MatheKids-v227.apk

Die Quellen und `docs` enthalten Version 227, den zugehörigen Service-Worker-Cache sowie die versionierten und bisherigen APK-Downloadadressen. Der bestehende Android-Updater lädt nach Erkennung der neuen öffentlichen HTML-Version `MatheKids-v227.apk`; die Installation bestätigt der Nutzer auf dem Gerät.

Die automatischen Prüfungen und die Pages-Bereitstellung werden gesondert kontrolliert. Zum Zeitpunkt des ersten Abrufs waren für den neuen Commit noch keine Workflow-Läufe beziehungsweise Check-Runs gelistet. Eine erfolgreiche Pages-Bereitstellung wird erst nach entsprechendem GitHub-Nachweis bestätigt.

**Offene externe Prüfung:** Diese laufende Cloud-Instanz verweigert den direkten HTTPS-Abruf von `parip69.github.io` weiterhin mit CONNECT/HTTP 403. Daher sind ein Download-/Hashvergleich über die Pages-Adresse und ein echtes Geräteupdate bisher nicht bestätigt. Der oben geprüfte GitHub-Download ist kein Nachweis für den Zustand des Pages-CDN. Keine erneute Installation auf einem physischen Android-Gerät durchgeführt.
