# Realschule Bayern – Version 200

Version 200 beginnt einen eigenständigen Realschulbereich. Die bisherige Grundschul-App bleibt erhalten. Der Realschulbereich ist eine erste Auswahl funktionierender Übungen, **kein vollständiger Lehrplan oder Prüfungstrainer**. Es gibt keine auswählbaren Platzhalter.

## Architektur

- `app/src/main/assets/realschule/core.js`: datenbasierter Themenkatalog mit Klassen, Wahlpflichtfächergruppen und offiziellen Quellen; 24 parametrierte Generatoren; exakte rationale Arithmetik und begrenzter Ausdrucksparser ohne eval.
- `realschule/ui.js`: Einstellungen, einzelne Aufgabe, Rechenweg, Lernrunde, Themenstatistik und Fehlerwiederholung. Eigener Speicher `MatheKids_Realschule_v1`; die Grundschul-Datenformate bleiben erhalten. Einstellungen gelten für die nächste Runde. Die laufende Aufgabe einschließlich eingegebener Schritte bleibt beim Reiterwechsel und Neuladen erhalten.
- `realschule/style.css`: mobile Oberfläche, Bruchdarstellung und große Bedienelemente.
- `index.html`: zwei Reiter, Grundschulpanel, Fokus- und Timerpausen beim Wechsel; HTML-Export bettet die neuen Dateien und Realschul-Daten ein.
- `MainActivity.kt`: begrenzter Asset-Leser für den bestehenden nativen HTML-Export. Drei fest erlaubte Dateien; keine frei wählbaren Dateipfade.
- Service Worker, Sync-Skript und Web-Sync-CI berücksichtigen die neuen Dateien. APK und Webseite enthalten dieselben Assets.

## Aktive Übungen

| Klasse | Übungen | LehrplanPLUS-Lernbereiche |
| --- | --- | --- |
| 5 | Ganze Zahlen, Rechteckfläche/Umfang, direkter Dreisatz | M5 1/2, 5, 4 |
| 6 | Bruchmultiplikation mit Zwischenschritt und Kürzen, Dezimalrechnung, lineare Gleichungen mit Rechenweg, Prozentwert, Dreiecksfläche, Quadervolumen | M6 1, 5, 6, 3, 4 |
| 7 | Potenzregel, Gleichungen mit Klammern, vermehrter/verminderter Grundwert, arithmetisches Mittel | M7 1; I 6 / II–III 4; I 7 / II–III 5; I 8 / II–III 6 |
| 8 | Gleichungen mit x auf beiden Seiten, lineare Funktionswerte, relative Häufigkeit, Trapezfläche | M8 I 4 / II–III 3; I 6 / II–III 5; I 7 / II–III 6; 1 |
| 9 | Quadratwurzeln, Pythagoras, Kreisfläche, Gegenereignis; zusätzlich I: Scheitelwert einer quadratischen Funktion; II/III: lineare Funktionswerte | M9 1, 3, 4; I 8 / II–III 7; I 7 / II–III 5 |
| 10 | Kosinussatz, exponentielles Wachstum, Pfadregel; zusätzlich I: Potenzfunktionswerte; II/III: quadratischer Scheitelwert und Zylindervolumen | M10 1; I 4 / II–III 3; 5; I 3 / II–III 4 und 2 |

Quellen am 10.10.2026 direkt abgerufen: [Klasse 5](https://www.lehrplanplus.bayern.de/fachlehrplan/realschule/5/mathematik), [Klasse 6](https://www.lehrplanplus.bayern.de/fachlehrplan/realschule/6/mathematik); Klassen 7–10 jeweils mit `/wpfg1` und `/wpfg2-3`, beispielsweise [Klasse 9 I](https://www.lehrplanplus.bayern.de/fachlehrplan/realschule/9/mathematik/wpfg1) und [Klasse 9 II/III](https://www.lehrplanplus.bayern.de/fachlehrplan/realschule/9/mathematik/wpfg2-3). Jede aktive Themenzeile enthält ihre eigene Quellenadresse. Grundlagen wiederholen ist eine eigene Auswahl bereits implementierter Themen aus früheren Realschulklassen.

## Prüfregeln und Grenzen

Bei Gleichungen gelten äquivalente lineare Gleichungen als richtige Schritte. Reine Wiederholungen und bloße Endergebnisse ohne Umformung zählen nicht als gelöst. Der Parser unterstützt Zahlen, Dezimalkomma, x, Rechenzeichen, Klammern und Exponenten 0–2. Variable Nenner, beliebige Funktionen und höhere Potenzen werden verständlich abgewiesen. Es wird die Lösungsgleichheit geprüft, keine vollständige symbolische Beweisführung.

Brüche werden exakt verglichen. Vorheriges Kürzen und unreduzierte richtige Zwischenbrüche sind zulässig; der Abschluss verlangt einen gekürzten Bruch und einen vorherigen Zwischenschritt. Einheiten können passend eingegeben oder weggelassen werden. Bei Rundungsaufgaben gilt eine Toleranz von einer halben Einheit der letzten verlangten Dezimalstelle. Hinweise verraten schrittweise mehr; angezeigte Lösungen und übersprungene Aufgaben zählen separat.

Fehlversuche werden je Thema gespeichert. Eine Fehlerwiederholung verwendet neue Zahlen desselben Prinzips innerhalb der ausgewählten Themen; nach selbständiger Lösung wird das Thema aus der Fehlerliste entfernt. Ergebnisse werden nach Themen zusammengefasst. Es werden keine Daten an einen Server gesendet.

## Verifikation

- `node --test tests/realschule.test.cjs`: sichere Eingabe, Grenzen, alternative Gleichungswege, Bruchkürzung, Einheiten, Rundung und 5.300 generierte Aufgaben.
- `node tests/realschule-ui.cjs` mit Playwright und Chromium: Reiterwechsel, unveränderte Grundschul-Aufgabe/Eingabe/Speicher, Rechenwegprüfung, Persistenz, Fehlerwiederholung, HTML-Export, Timerpause und 320/390/768-Pixel-Ansichten.
- Bestehende Download-, Update- und Teilen-Prüfungen sowie Android-Build und APK-Signatur separat prüfen. Das Android-Projekt besitzt derzeit keine nativen Unit-Tests (`NO-SOURCE`). Kein echter Android-Geräte- oder WhatsApp-Test in der Cloud.

## Noch offen und nächste Etappen

Die Generatoren decken jeweils ausgewählte Unterthemen ab. Noch fehlen unter anderem Bruchaddition/division als mehrstufige Übungen, Bruchgleichungen mit Definitionsmengen, lineare Gleichungssysteme, quadratische Gleichungen und Nullstellen, Graphenzeichnen, Konstruktionen/Abbildungen, Logarithmen und umfangreiche Abschlussprüfungsaufgaben. Auch Realschul-Übersetzungen und das gezielte Teilen von Realschul-Einstellungen sind noch nicht enthalten; bestehendes Teilen von Grundschul-Einstellungen bleibt erhalten.

Als nächste Etappe eignen sich weitere Bruchoperationen und Gleichungssysteme mit Tests für unterschiedliche Rechenwege; anschließend Graphen und Aufgaben aus dem Abschlussprüfungsbereich. Für diese Inhalte neue Generatoren und Katalogzeilen ergänzen, ohne Grundschul-Generatoren umzubauen.
