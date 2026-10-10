# Version 202 – Eingabekontrast, Rückmeldung und weitere Rechenübungen

Realschul-Eingaben und Auswahlfelder haben jetzt einen hellen Hintergrund, dunkle Schrift und einen deutlich sichtbaren Rand. Die Farben bleiben in sämtlichen App-Farbstilen lesbar. Buttons reagieren beim Drücken mit einer sichtbaren Vertiefung; ein kurzer Druckzustand bleibt auch bei sofortiger Neudarstellung erkennbar.

Richtige Antworten bleiben im Feld stehen. Die Aufgabe bekommt einen grünen Rahmen, der Prüfen-Button zeigt „✓ Richtig“, und „Weiter →“ wird hervorgehoben. Richtige Zwischenschritte erscheinen eingerahmt im Rechenweg. Fehler erhalten eine rote Rückmeldung; Hinweise und unvollständige Antworten eine neutrale blaue Anzeige. Der Zustand bleibt beim Reiterwechsel und Neuladen erhalten. Angezeigte Lösungen zählen weiterhin separat und erhalten keine Kennzeichnung als selbständig richtig gelöst.

**Kein automatischer Aufgabenwechsel im Realschulbereich:** Die gelöste Aufgabe bleibt zum Nachsehen stehen. Erst ein bewusster Druck auf Weiter lädt die nächste Aufgabe. Die Grundschul-Einstellungen zum Aufgabenwechsel bleiben erhalten.

## Erweiterte Übungsauswahl

- Klasse 6, M6 1: Bruch-Rechenketten mit Klammern; je nach Schwierigkeit Addition und Multiplikation, Subtraktion und Division oder eine zusätzliche abschließende Addition. Sichere Zwischenschrittprüfung und vollständig gekürztes Ergebnis.
- Klasse 7, M7 I 6 / II–III 4: Klammerterme für vorgegebene x-Werte berechnen, mit mehreren Klammern und negativen Zahlen in schwierigeren Aufgaben.

Die Zuordnung verwendet die für die bisherigen Versionen geprüften LehrplanPLUS-Quellen. Die Realschule bietet jetzt 31 Generatoren, weiterhin eine Auswahl und keinen vollständigen Prüfungstrainer. Bestehende Aufgaben-IDs, Speicher und laufende Sitzungen bleiben erhalten. Die neuen Rückmeldungsfelder sind optionale Ergänzungen des vorhandenen Sitzungsformats.

## Dateien und Verifikation

- `realschule/ui.js`: dauerhafte Rückmeldung, Ergebnis im Eingabefeld, manuelles Weiter und Druckzustände.
- `realschule/style.css`: helle Eingaben, gut erkennbare Ränder, grüne/rote/neutrale Rückmeldungen und Buttonzustände.
- `realschule/core.js`: zwei neue Generatoren und Katalogeinträge.
- `tests/realschule.test.cjs`: 13 Tests mit 6.700 generierten Aufgaben, einschließlich Klammern und korrekter Klassen-Zuordnung.
- Bestehende UI-Prüfungen: Grundschul-Datenerhalt, Rechenwege, Persistenz, Fehlerwiederholung, Export und Versionskompatibilität.
- `tests/realschule-feedback-ui.cjs`: alle vier Farbstile, 320/390/768 Pixel, richtige/falsche Rückmeldung, manuelles Weiter, kein Aufgabenwechsel nach Wartezeit, Zustand nach Neuladen, gedrückte Buttons und die neuen Rechenaufgaben.

Version, Cache und Web-Assets werden synchronisiert; APK und eigenständige HTML-Datei werden archiviert. Build, Signatur und öffentlicher Download werden vor der Auslieferung geprüft. Kein echter Android-Geräte- oder WhatsApp-Test in der Cloud.

Als nächste größere Etappe bleiben unter anderem Funktionsgraphen, Bruchgleichungen mit Definitionsmengen, quadratische Gleichungen und weitere Sachaufgaben offen.
