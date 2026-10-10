# Version 201 – Bruchrechnung und lineare Gleichungssysteme

Version 201 ergänzt fünf neue Übungsgeneratoren. Der Realschulbereich enthält damit 29 Generatoren; er bleibt eine Auswahl von Lehrplaninhalten, kein vollständiger Prüfungstrainer.

| Neues Thema | Zuordnung | Rechenweg |
| --- | --- | --- |
| Bruchaddition | Klasse 6, M6 1 | Gemeinsamer Nenner, Zähler addieren, vollständig kürzen |
| Bruchsubtraktion | Klasse 6, M6 1 | Gemeinsamer Nenner, Vorzeichen beachten; auch negative Ergebnisse und null |
| Bruchdivision | Klasse 6, M6 1 | Kehrwert bilden, multiplizieren und kürzen |
| Gemischte Zahlen | Klasse 6, M6 1 | Umwandeln und mit einem weiteren Bruch rechnen; negative gemischte Zahlen in schweren Aufgaben |
| Lineare Gleichungssysteme | Klasse 9, M9 I 6 / II–III 6 | Eliminations- oder Einsetzungsschritt, danach beide Variablen bestimmen |

Die Zuordnung folgt den für Version 200 direkt geprüften offiziellen LehrplanPLUS-Seiten: [Mathematik 6](https://www.lehrplanplus.bayern.de/fachlehrplan/realschule/6/mathematik), [Mathematik 9 I](https://www.lehrplanplus.bayern.de/fachlehrplan/realschule/9/mathematik/wpfg1), [Mathematik 9 II/III](https://www.lehrplanplus.bayern.de/fachlehrplan/realschule/9/mathematik/wpfg2-3). Für ältere Klassen stehen die Bruchübungen im getrennten Grundlagenmodus zur Verfügung.

## Eingabe und mathematische Prüfung

- Brüche beispielsweise als `7/12`, gemischte Zahlen als `2 1/3`. `-2 1/3` bedeutet `-(2+1/3)`. In Ausdrücken Klammern verwenden, beispielsweise `(2/3)/(4/5)`.
- Andere gemeinsame Nenner, Kehrwertrechnung und äquivalente Zwischenwerte werden akzeptiert. Ein gekürztes Endergebnis allein genügt bei Rechenwegaufgaben nicht; Wiederholung der ursprünglichen Rechnung mit zusätzlichen Klammern zählt nicht als Fortschritt.
- Bei gemischten Zahlen wird am Ende ein gekürzter Bruch verlangt; bei ganzzahligen Ergebnissen genügt die Zahl.
- Bei Gleichungssystemen einzelne Gleichungen nacheinander eingeben. Alternativ nach einem Zwischenschritt beide Endwerte gemeinsam eingeben: `x = 3; y = 1`. Dezimalkomma und gleichwertige Brüche sind möglich.
- Der neue Parser rechnet exakt mit rationalen Koeffizienten für Konstante, x und y. Jeder akzeptierte lineare Schritt erfüllt die ursprüngliche eindeutige Lösung. Vor der Endantwort muss ein Schritt mit einer eliminierten Variablen gezeigt werden. Nichtlineare Terme, variable Nenner, Division durch null, zu lange Eingaben und ausführbarer Code werden abgewiesen.
- Die Prüfung erkennt mathematisch richtige lineare Folgerungen; sie rekonstruiert nicht jede einzelne Begründung einer schriftlichen Herleitung. Gleichungssysteme mit keiner oder unendlich vielen Lösungen werden in dieser Version noch nicht als Übungen generiert. Graphische Lösungsverfahren und Sachaufgaben folgen später.

## Dateien und Kompatibilität

`app/src/main/assets/realschule/core.js` enthält den erweiterten Katalog, fünf Generatoren, die Eingabe gemischter Zahlen und den x/y-Parser. `ui.js` ergänzt die Eingabehilfe für Gleichungssysteme; `style.css` ihre zweizeilige Darstellung. Bestehende Grundschul-Generatoren und Speicherformate bleiben erhalten. Die Version wird wie bisher über `version.properties` synchronisiert. `docs` enthält dieselben Assets; die drei bekannten Moduldateien bleiben Teil des APK-, Offline- und HTML-Exports.

Vorhandene Realschulsitzungen verwenden weiterhin denselben Speicher und dieselben IDs und Zufallsseeds. Die bisherige Bruchmultiplikation bleibt erhalten. Der Kompatibilitätstest nutzt eine feste, aus der veröffentlichten Version 200 gewonnene Referenzaufgabe (`tests/fixtures/realschule-v200.json`) und prüft Aufgabe, gespeicherten Zwischenschritt, Eingabetext und Themenfortschritt nach dem Neuladen.

## Verifikation

- `node --test tests/realschule.test.cjs`: 12 Tests, 6.300 generierte Aufgaben einschließlich eindeutiger Systemlösungen, alternativer Lösungswege, negativer/gemischter Zahlen, Vorzeichen, null, Kürzen, Dezimalkomma und Parsergrenzen.
- `node tests/realschule-ui.cjs`: bestehende Grundschule/Realschule, getrennte Daten, Fehlerwiederholung, Export und Timerpause.
- `node tests/realschule-stage2-ui.cjs`: vier neue Brucharten und Gleichungssysteme über die echte Oberfläche, unvollständige Endantwort, beide Variablen, Hinweise/Lösung, Persistenz, Reiterwechsel, Version-200-Kompatibilität und 320/390/768-Pixel-Ansichten. Playwright und Chromium erforderlich.
- Android-Build, enthaltene Assets, Signatur und öffentliche Downloads werden vor der Auslieferung geprüft. Das Projekt hat weiterhin keine nativen Unit-Tests (`NO-SOURCE`). Kein echter Android-Geräte- oder WhatsApp-Test in der Cloud.

## Nächster Ausbau

Als nächstes eignen sich Funktionsgraphen mit Wertetabellen, Steigung und Schnittpunkten. Danach folgen Bruchgleichungen mit Definitionsmengen, quadratische Gleichungen/Nullstellen und umfangreichere Sach- und Abschlussprüfungsaufgaben. Die neuen Bruchübungen sind parametrierte Übungsfamilien; komplexe beliebige Bruchterme und sämtliche mehrgliedrigen Rechenketten sind noch nicht abgedeckt.
