# Agent Worklog

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
