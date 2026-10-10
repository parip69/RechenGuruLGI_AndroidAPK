# Version 209 – Info automatisch aktuell und Start der Bedienbarkeits-Testphase

Neue Vorgabe dauerhaft in AGENTS.md: Jede ergänzte/geänderte Aufgabenfamilie muss in der passenden anklickbaren App-Info berücksichtigt werden. Freies Zeichnen/Konstruieren vorher besprechen. Standardwerte und getrennte Einstellung der ersten/zweiten Zahl erhalten. Kein Umbau der Grundschul-Auswahl ohne vorher besprochenen konkreten Vorschlag.

## Ausgelieferte Änderungen

Die Info zeigt den gesamten aktiven Realschul-Katalog nach Klassen und Gruppen sowie sämtliche Grundschul-Rechenarten aus der vorhandenen Auswahl. Sie wächst automatisch mit diesen Quellen. Die Grundschul-Info erklärt außerdem, wie man heute Rechenart, Einstellen, Zahlenobergrenze und erste/zweite Zahl findet.

Die Realschul-Info nennt „über 10.000 unterschiedliche Übungsvarianten“. Beleg: deterministische Stichprobe aller Klassen, Gruppen und drei festen Schwierigkeiten mit jeweils 100 Seeds; 43.500 erzeugte Aufgaben, 12.916 unterschiedliche Prompt-Inhalte nach Deduplizierung. Damit wird keine exakte Gesamtzahl aller möglichen Aufgaben oder Prüfungssammlung behauptet. Ein dauerhafter Test schützt die Schwelle von 10.000. Die Stichprobe ist nicht die Anzahl der Aufgabenfamilien: Diese bleibt 70.

19 Mathematiktests mit 14.500 Katalogaufgaben plus Referenzfällen und Variantenstichprobe bestanden. UI-Prüfung beider Info-Kataloge, unveränderte Übungsdaten, Vollbild, numerischer Rechenweg und bestehende Schritte bestanden. Finaler Build, Signatur und identische APK-Assets geprüft. Kein echter Android-Gerätetest.

## Grundschul-Auswahl – konkreter Vorschlag, noch nicht umgesetzt

Aktuell: Rechenart im ausklappbaren Menü wählen, separat Einstellen öffnen, kontextabhängige Felder finden. Für erste/zweite Zahl stehen abhängig vom Modus Einser/Zehner/Frei und weitere Profile bzw. Reihen zur Verfügung. Der Umfang und die Verteilung der Optionen machen die Auswahl unübersichtlich.

Empfohlene Alternative:

1. Vier gleich große, direkt sichtbare Kacheln: Plus, Minus, Mal, Teilen. Gemischte Rechenarten und Sonderübungen unter „Weitere Übungen“.
2. Direkt darunter die aktuelle Einstellung als lesbarer Satz. Tippen auf eine Rechenart verwendet weiterhin die bisherigen gespeicherten Werte für diese Klasse und Rechenart.
3. Ein deutlicher Button „Zahlen anpassen“ öffnet eine kompakte Ansicht mit „Erste Zahl“ und „Zweite Zahl“ in getrennten Zeilen. Einser/Zehner/Frei sowie vorhandene Modusprofile bleiben erhalten. Bei Mal/Teilen steht die Reihen-Auswahl vorne, wenn das vorhandene Profil sie verwendet.
4. Eine Beispielaufgabe zeigt den Effekt der Auswahl. „Übernehmen“ speichert bewusst; „Abbrechen“ lässt die bisherigen Werte stehen. Weitere Optionen bleiben separat erreichbar.

Ein vorläufiges Textbeispiel (keine neue Einstellung und kein neuer Generator):

```
[ Plus ] [ Minus ] [ Mal ] [ Teilen ]
Aktuell: Plus · Zahlen bis 10 · zwei Zahlen
[ Zahlen anpassen ]

Erste Zahl:  Frei innerhalb der bisherigen Grenze
Zweite Zahl: Frei innerhalb der bisherigen Grenze
Beispiel:   3 + 4 = ?
[ Abbrechen ] [ Übernehmen ]
```

Das ist ein Vorschlag für die nächste Besprechung, kein bereits ausgelieferter Umbau.

## Testphase statt weiterer Generatoren

Zunächst mit dem aktuellen Stand üben: Rechenart finden, erste/zweite Zahl einstellen, Hinweise und Rechenwege verfolgen, lokale Fortsetzung nach Schließen, Updates und vorhandenes Teilen. Rückmeldungen aus echter Benutzung sollen die nächsten Feinarbeiten bestimmen. Weitere komplexe Aufgaben oder interaktive Zeichentools erst als getrenntes, besprochenes Ausbaupaket.

Bekannte größere Lücken bleiben wie in realschule-abschluss-v208.md dokumentiert, einschließlich Realschul-Themenauswahl im Einstellungslink. Keine vollständige Lehrplanabdeckung behauptet.
