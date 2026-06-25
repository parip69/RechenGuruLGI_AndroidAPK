# Agent Worklog

## 2026-06-25
- Geplant: Hinzufügen der Optionen "Quadratzahlen Mal" und "Quadratzahlen Geteilt" in der Mathe App (`docs/index.html`).
- **Implementiert**: 
  - Neue Dropdown-Optionen `squareMal` und `squareDiv` zur Aufgabenauswahl (`viewSelect`) in `docs/index.html` hinzugefügt.
  - UI-Sichtbarkeitslogik in `updateControlsVisibility` angepasst, damit für Quadratzahlen dieselben Einstellmöglichkeiten (Schwierigkeit, etc.) erscheinen wie bei Mal/Geteilt.
  - Logik für die Generierung von Quadratzahl-Aufgaben in `makeStandardTask` ergänzt (`a * a` bzw. `(a*a) / a`).
  - Fehlende Faktoren-Suche in `makeFactorMissingTask` für Quadratzahlen freigeschaltet.
  - Übersetzung (Rumänisch) in `translations` hinzugefügt.
- **Erledigt**: Synchronisation von `docs/index.html` nach `app/src/main/assets/index.html` via `Copy-Item`.
