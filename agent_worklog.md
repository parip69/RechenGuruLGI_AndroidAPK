# Agent Worklog

## 2026-10-16 · Version 221
- Richtige Eingaben zeigen bereits beim Tippen den grünen Rahmen und Haken; gezählt wird erst beim ausdrücklichen Weitergehen.
- Auf ausdrücklichen Wunsch den zusätzlichen Weiter-Knopf am Antwortfeld und den verzögerten Aufgabenwechsel entfernt.
- Enter, Bildschirm-Eingabetaste und Neue Aufgaben bewerten eine eingetragene Antwort einmal als richtig oder falsch und wechseln sofort weiter. Bereits bestätigte Aufgaben werden nicht erneut gezählt. Der Cursor springt ins nächste Eingabefeld.
- Hinweise/Rechenweg sind vor dem Weitergehen aufrufbar; der Schließknopf unten in den Einstellungen bleibt erhalten.
- Regressionen für Desktop und Android-Touch-Simulation prüfen direkte Übergänge, Zählung, Fokus und alle numerischen Grundschulmodi. Die 39 Generator-/Ablauftests sind bestanden. Kein echter Android-Installationstest.
- Bereits lokal vorhandene Archive von Version 218 und die lokalen Zwischenstände 219/220 werden unverändert erhalten.

## 2026-10-16 · Version 217
- Enter, Weiter und Neue Aufgaben verwenden für eingetragene Antworten dieselbe Prüfung. Bereits bestätigte Antworten werden beim Aufgabenwechsel nicht erneut gezählt.
- Richtige Antworten: grüner Rahmen und Häkchen, nach 1,2 Sekunden automatisch weiter. Die neue Checkbox in den Einstellungen ist standardmäßig aktiv und wird lokal gespeichert; ausgeschaltet bleibt der Wechsel manuell.
- Falsche Antworten bleiben zur Korrektur und für Hilfen stehen. Bewusstes Weitergehen nach dem ersten Fehler zählt einmal falsch. Der Fokus wechselt ins nächste Eingabefeld.
- Einstellungen unten per Schaltfläche, per Klick außerhalb oder Escape schließen.
- Geprüft: 39 Generator-/Ablauftests, bestehende umfassende Browserprüfung sowie neue Regression tests/auto-next-ui.cjs auf Desktop und Android-Touch-Simulation einschließlich Zählung und Cursorwechsel.
- Kein Installationstest auf einem echten Android-Gerät.

## 2026-09-23
- Einstellungen neu gegliedert: verständlicher 3-Schritt-Ablauf, kontextabhängige Hilfetexte und seltene Optionen in einem separaten Bereich.
- Auswahl der Aufgabenarten umbenannt und im Popup nach Grundrechenarten, Mal/Geteilt und weiteren Übungen gruppiert; kurze Erklärungen je Modus ergänzt.
- Kompakte Zusammenfassung der aktuellen Konfiguration direkt unter der Aufgabenart ergänzt.
- Aufgabenformat und Schwierigkeitsstufen verständlicher benannt, ohne interne Werte oder gespeicherte Einstellungen zu ändern.
- Aufgabenzahl um 12, 15 und 20 erweitert; Klassenstufen-Presets berücksichtigen nun auch die beiden Quadratzahl-Modi.
- Deutsche und rumänische Oberflächentexte aktualisiert.

## 2026-06-25
- Geplant: Hinzufügen der Optionen "Quadratzahlen Mal" und "Quadratzahlen Geteilt" in der Mathe App (`docs/index.html`).
- **Implementiert**: 
  - Neue Dropdown-Optionen `squareMal` und `squareDiv` zur Aufgabenauswahl (`viewSelect`) in `docs/index.html` hinzugefügt.
  - UI-Sichtbarkeitslogik in `updateControlsVisibility` angepasst, damit für Quadratzahlen dieselben Einstellmöglichkeiten (Schwierigkeit, etc.) erscheinen wie bei Mal/Geteilt.
  - Logik für die Generierung von Quadratzahl-Aufgaben in `makeStandardTask` ergänzt (`a * a` bzw. `(a*a) / a`).
  - Fehlende Faktoren-Suche in `makeFactorMissingTask` für Quadratzahlen freigeschaltet.
  - Übersetzung (Rumänisch) in `translations` hinzugefügt.
  - **Neu:** Dropdown-Beschriftungen auf `Zeilen (x²)` und `Zeilen (÷x²)` gekürzt.
  - **Neu:** Option `2-stellig (10-99)` im Dropdown `mulProfile` hinzugefügt und in `makeStandardTask` für Quadratzahlen (und normale Mal/Geteilt) als Logik implementiert, damit man gezielt den Zahlenbereich einschränken kann.
- **Erledigt**: Synchronisation von `docs/index.html` nach `app/src/main/assets/index.html` via Skript.


## 2026-10-16 · Version 223
- Aktuellen Stand 222 von GitHub übernommen. Automatisch weiter bei richtiger Antwort als globale, lokal gespeicherte Einstellung ergänzt, standardmäßig aktiv; Schalter unten in beiden Schulbereichen.
- Grundschule: nach 850 ms grüner Bestätigung ohne Enter weiter, erst wenn alle Antwortfelder richtig sind. Fehler bleiben stehen, Korrektur und Rechenweg bleiben möglich; Neue Aufgabe erlaubt bewusstes Weitergehen. Bearbeiten, Hilfe und offene Einstellungen verhindern einen verzögerten Wechsel.
- Realschule: richtige Endantworten automatisch bestätigen und nach sichtbarer Bestätigung weitergehen; falsche Antworten bleiben stehen. Einstellungen unten schließen und durch Außenklick schließen; Grundschul-Außenklick einschließlich Neue Aufgabe geprüft.
- Validierung: 39 Generator-/Bewertungsprüfungen sowie Browserprüfungen für Desktop und Android-Touch, gespeicherter Aus-Schalter, Korrektur, Abbruch eines vorgemerkten Wechsels, Fokus, Zähler und beide Einstellungsfenster. Signierter Release mit Originalschlüssel über vorhandene Build-/Prüfskripte.
- GitHub Pages ist durch die Netzwerkregeln dieser Umgebung gesperrt (HTTP 403); öffentlicher GitHub-Download wird nach dem Push separat mit dem lokalen APK-Hash verglichen. Kein Installationstest auf einem Android-Gerät.


## 2026-10-16 · Version 224
- Nutzerwunsch anhand zweier Screenshots: großer, gestalteter Schließen-Button über die gesamte Menübreite oben und zusätzlich ganz unten hinter dem Zurücksetzen-Bereich. CSS-Flexreihenfolge explizit festgelegt; Automatik-Schalter unten vor Zurücksetzen einsortiert.
- Schließen-Button im Realschulbereich ebenfalls über volle Breite gestaltet. Keine Änderung der Bewertungs-/Automatiklogik von 223.
- Browserprüfung bei 390 und 1280 Pixeln: beide Grundschul-Buttons volle Breite, mindestens 56 Pixel hoch, unterer Button hinter Automatik und Zurücksetzen; beide schließen. Mobile Darstellung zusätzlich als Screenshot geprüft.
- Ergänzter Nutzerwunsch: Neue Aufgabe bei leerem Feld bleibt ohne jede Richtig-/Fehlerwertung, verändert weder Gesamtzähler noch Fehlerpool, Serie oder Zielstand. Eingetragene Antworten einschließlich 0 werden beim bewussten Weitergehen ausgewertet. Browserprüfungen entsprechend erweitert.
