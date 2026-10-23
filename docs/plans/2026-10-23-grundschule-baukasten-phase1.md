# Grundschule: Bestandsaufnahme und Entwurf zur Freigabe

Stand: 23.10.2026. Geprüfter Quellstand: `471950bc0115dd083a92b5eded7dc358d2c67d95`, Version 225, identisch mit `origin/main` nach `git fetch origin`. Der Checkout hatte keine offenen Änderungen. Diese Datei ist ein Analyse- und Planungsdokument; App-Quellen, Version, Downloads und Signierung wurden nicht geändert. Noch keine Implementierung oder Veröffentlichung.

## 1. Verbindliche Grundlagen

Gelesen: vollständige Root-`AGENTS.md`, `README.md`, `.agent/AGENTS.md`, `ANDROID_BUILD_SIGNING.md`, `README_BUILD.txt`, `VS_CODE_WEITERARBEITEN.md`, die in README genannten Privat-Anleitungen einschließlich Export-/Installationshinweisen sowie Build-/Sync-/Prüfskripte und GitHub-Workflows. Die lokalen Anleitungen `brainstorming` und `writing-plans` wurden eingesehen; der Entwurf wartet entsprechend dem Nutzerauftrag auf Freigabe. Historische Pläne 211/212/214 dienen nur als Hintergrund, maßgeblich ist der Code von 225.

Einige ältere Texte beschreiben noch Debug-Releases, externe Schlüssel oder eine Datei `pwa-bootstrap.js`. Tatsächlich bauen die aktuellen Skripte signierte Releases mit dem Originalschlüssel; `pwa-bootstrap.js` existiert nicht. Keine solche Datei allein aufgrund alter Dokumentation neu anlegen. Die aktuelle Root-AGENTS und die aktuellen Skripte haben Vorrang vor diesen überholten Beschreibungen.

## 2. Vollständige Grundschul-Bestandsliste

Quelle: `app/src/main/assets/index.html`, `#viewSelect` ab Zeile 2702, `RG_SHARE_MODES` ab Zeile 33, `makeRandomTask` ab Zeile 10970. Es gibt **16 auswählbare Aufgabenarten**. Einmaleinsreihen und Lückenformate sind zusätzliche Varianten, keine weiteren eigenständigen Modus-IDs.

Alle Arten sind derzeit erreichbar über **Grundschule → Aufgabenart oben antippen → gruppierte Auswahlkarten**. Einstellungen öffnen über „Einstellen“. Es gibt noch keine Startseite mit dem vorgeschlagenen Hauptkachelraster und keine persönliche Vorlagenbibliothek.

| Aktueller Name | Modus-ID | Generator / Verhalten | Besondere Einstellungen |
| --- | --- | --- | --- |
| Addition (+) | `plus` | `makeRandomTask` → `makeStandardTask('plus')`, bei drei Zahlen `makeThreeOperandTask` | 2/3 Zahlen; erste, zweite, dritte Zahl getrennt frei/0–9/10–99; Normal/adaptiv/mit oder ohne Zehnerübergang |
| Subtraktion (−) | `minus` | dieselben Einstiege, Subtraktion | Wie Plus; Entleihen mit/ohne; regulär nichtnegative Ergebnisse |
| Plus und Minus | `mix` | zufällige Wahl von Plus/Minus; drei Zahlen mit zwei Zeichen möglich | 2/3 Zahlen und getrennte Zahlenprofile; adaptiv/einfach/schwer |
| Multiplikation (×) | `mal` | `makeStandardTask('mal')` | Reihen, Zahlenprofil, Schwierigkeit, optionale Beimischung gemischter Malaufgaben |
| Quadratzahlen (z.B. 12×12) | `squareMal` | `makeStandardTask('squareMal')` | gleiche Faktoren; Zahlenprofil und Grenze; eigene gespeicherte Einstellungen |
| Division (÷) | `geteilt` | `makeStandardTask('geteilt')`, erzeugt Dividend aus Produkt | Reihen, Zahlenprofil, Schwierigkeit; ganzzahlig ohne Rest |
| Quadrat-Division (z.B. 144÷12) | `squareDiv` | `makeStandardTask('squareDiv')` | Quadrat als Dividend, Divisor und Ergebnis gleich; eigene Einstellungen |
| Gemischte Malaufgaben | `mixedMal` | `makeWorksheetTask` → `MatheMixedMal.generate` | A–F, Reihen/Zahlenprofil/Schwierigkeit; einzelne Aufgabe mit Rundenposition; schwere Klammern |
| Mal und Geteilt | `mixMD` | zufällige Wahl Mal/Geteilt | Reihen, Profile, Schwierigkeit, optionale Beimischung A–F |
| Alle Rechenarten | `mixALL` | zufällige Wahl Plus/Minus/Mal/Geteilt | Reihen für ×/÷, Profile, adaptive/einfache/schwere Aufgaben; optionale Beimischung A–F |
| Rechenketten | `chain` | `MatheChains.generate` | 2–10 Zahlen oder gemischte Länge; Zeichenmenge; Aufbau frei/Blöcke/erst Punktrechnung/zufällig; gemeinsame Grenze |
| Verdoppeln | `double` | `makeDoubleTask` | Zahlgrenze, Aufgabenanzahl; festes Verdopplungsformat |
| Halbieren | `half` | `makeHalfTask` | gerade Ausgangszahl, ganzzahlige Hälfte; Zahlgrenze und Aufgabenanzahl |
| Fehler üben | `fehler` | `pickWrongTask`, sonst `makeRandomTask` | gespeicherte Fehler gewichtet wiederholen; auch Ketten/A–F/3-Zahlen-Aufgaben; normale Ersatzaufgaben bei leerem/passend leerem Pool |
| Plus-Pyramide | `pyramide` | `buildPyramideRows` → `generierePyramide` → `renderGrid` | 3/2/1 Steine, Addition benachbarter unterer Steine; Zahlgrenze; bestehende Lückenmuster mit drei fehlenden Steinen |
| Minus-Traube | `traube` | `buildTraubeRows` → `generiereTraube` → `renderGrid` | 3/2/1 Steine, links minus rechts ergibt unten; Zahlgrenze; zwei eindeutige Lücken, gegebenenfalls eine; `countSolutionsTraube` |

Pyramide und Traube benutzen ihre bisherigen Raster, Prüfung, Hilfen, Fehlerübernahme und Druckdarstellung. Ihre Generatoren werden nicht durch den Baukasten geleitet.

### Vorhandene Formate und gemeinsame Optionen

- Ergebnis fehlt (`standard`); Zahl fehlt (`faktor`); richtig/falsch (`wahrfalsch`); Rechenzeichen fehlt (`operator`); Zahlen/Ausdrücke vergleichen (`compare`). Doppel-/Halbiermodus und Sonderaufgaben haben eigene Formate. Ketten fragen aktuell ausschließlich das Ergebnis ab; A–F enthalten gezielt eine unbekannte Zahl oder das Ergebnis.
- Plus/Minus mit zwei Zahlen: „Zahl fehlt“ wählt erste oder zweite Zahl zufällig; mit drei Zahlen eine von drei Zahlen. Die normale Malvariante lässt derzeit den ersten Faktor fehlen, Division den zweiten Operanden. A–F halten die ausgewählte Reihe beim unbekannten Gegenfaktor sichtbar.
- Aufgabenanzahl: 1, 3, 5, 10, 12, 15 oder 20. Bei `mixedMal` erscheinen die Aufgaben nacheinander, andere normale Modi zeigen mehrere Zeilen. Blitzmodus begrenzt auf eine Aufgabe und das Ergebnisformat.
- „Zahlen bis“: HTML-Eingabe vierstellig; **wirksame Web-Grenze 5–1000** durch `getMax`, nicht 9999. Der reine Kettengenerator akzeptiert dagegen 1–9999. Zunächst wirksamen App-Bereich erhalten und seine Semantik eindeutig erklären.
- „2./3. Zahl begrenzen“: frei oder 0–9, bei Plus/Minus durch die getrennten Operandenauswahlen ersetzt. Versteckte historische Werte können auch Sondergeneratoren beeinflussen und dürfen beim Umbau nicht nebenbei gelöscht werden.
- Einmaleinsreihen: 1 bis 10 einzeln und mehrfach auswählbar, „Gemischt“, „Quadratzahlen“, Kombination aus Reihen und Quadraten. Keine weiteren expliziten Reihen oberhalb 10 gefunden. Größere Faktoren sind über „Frei“ und Quadratzahlen möglich.
- Zahlenprofile ×/÷: kleines 1×1 1–9 (`table9`), bis 10 (`table`), Zehnerzahlen (`tens`), frei/über 10 (`free`). Bei `table9` wird die 10er-Reihe bisher deaktiviert; der Baukasten soll diesen Konflikt erklären und einen bewussten Profilwechsel anbieten.
- Schwierigkeit je Modus: Normal, adaptiv, mit/ohne Zehnerübergang bzw. Entleihen, Einfach/Schwer. Bisherige Übergangsprüfungen prüfen insbesondere die Einerstelle; keine unbelegte Zusage einer bereits vorhandenen vollständigen stellenweisen Übertragsprüfung.
- Rechenketten: Punkt vor Strich, gleichrangig von links; jede Zahl und jeder ausgewertete Zwischenwert innerhalb der gemeinsamen Grenze, nur nichtnegative Ganzzahlen, exakte Division. Keine freien Klammern, individuellen Zahlendomänen oder Zeichenmengen pro Position vorhanden.
- A–F: A fehlender Faktor und wechselnde Gleichungsrichtung; B Summe zweier Produkte; C Differenz zweier Produkte; D Produkt plus Zahl; E Produkt minus Zahl; F schwere kombinierte Lücken, einschließlich `r × (□ + n)`. Optionales Beimischen bei Mal/Mal-Geteilt/Alle nur mit Ergebnisformat und ohne Blitz.
- Weitere Optionen: Blitzmodus mit Anzeige-/Wiederholungsdauer, Rundenzeitlimit, automatischer Aufgabenwechsel, Zurücksetzen der einzelnen Aufgabenart, Drucken einschließlich Fehler-Arbeitsblättern, Hinweise und vollständige Rechenwege.
- Deutsch/Rumänisch, Designs, Eltern-PIN, Aufgabenziel, Punkte/Level/Statistik und eigener mobiler Zahlenblock bleiben erhalten. Der aktuelle Antwortablauf bestätigt richtige Eingaben standardmäßig automatisch und wechselt; ausdrückliches Bestätigen wechselt ebenfalls weiter. Diesen Ablauf nicht auf Basis alter Pläne zurücksetzen.
- Nicht vorhanden: Grundschul-Division mit Rest, frei aktivierbare negative Kettenergebnisse, frei wählbare Rechenreihenfolge, allgemeine Klammerbearbeitung. Solche Optionen werden nicht als funktionsfähige Schalter angeboten.

### Vorhandene Klassenprofile

`applyPreset`, `mergeModeSettings`, `presetDefaultsForMode`: eigene Einstellungen (Klasse 0) und Klassen 1–4, jeweils getrennt nach Modus. Bestehende Werte gewinnen beim Auffüllen gegen Vorgaben.

| Klasse | Plus/Minus/Mix | ×/÷/Quadrate/MixMD | Figuren | Verdoppeln/Halbieren |
| --- | --- | --- | --- | --- |
| 1 | bis 20; Plus ohne Übergang, Minus ohne Entleihen, Mix einfach | bis 20, einfach, 1–9 | bis 20 | bis 20 |
| 2 | bis 100, entsprechend ohne Übergang/einfach | bis 81, einfach, 1–9 | bis 100 | bis 100 |
| 3 | bis 100, adaptiv | bis 100, adaptiv, 1–10 | bis 100 | bis 200 |
| 4 | bis 1000, adaptiv | bis 1000, adaptiv, frei | bis 1000 | Vorgabe 2000; aktuell durch `getMax` auf 1000 begrenzt |

`mixALL` und Fehlerprofil verwenden Klasse 2 bis 100 statt 81. Ketten und A–F sind nicht vollständig in den ursprünglichen Preset-Tabellen enthalten; A–F besitzen einen zusätzlichen klassenabhängigen Max-Fallback. Keine neuen Klassenvorgaben ungefragt über vorhandene Profile schreiben.

## 3. Bestehende Speicherung, Export und Teilen

- `appStorage` kapselt `localStorage` mit Präfix `RechenGuruLGI_` (`index.html:3744`). Es gibt keine Cloud-Datenbank.
- `modeSettingsKey` (`7031`): `mathModeSettings:<mode>` für eigene Einstellungen, `mathModeSettings:grade1:<mode>` bis `grade4`. JSON enthält die IDs/Werte aller Eingabefelder in `controlsArea` außer global markierten Feldern. `saveModeSettings`, `loadModeSettings`, `applyModeSettings`, `wechselAnsicht` und Listener sichern/wiederherstellen.
- `mathActiveGrade`, `mathLastMode` merken Klasse und Aufgabenart. Migrationen ergänzen alte Aufgabenanzahl-, Blitz-, Einser- und Zeitlimitdaten nur dort, wo Werte fehlen. Bereits angepasste Profile bleiben erhalten.
- Weitere getrennte Schlüssel speichern Lernstände, Ziel, Statistik, Sprache, Design, PIN und `mathWrongPool` (maximal 200 Einträge). Realschule verwendet eigene Schlüssel `MatheKids_Realschule_v1` und `MatheKids_SchoolSection_v1`.
- Vorhandene „Profile“ sind Modus-/Klassen-Einstellungen und Zahlenprofile. Es gibt **keine frei benannten persönlichen Übungskacheln mit stabilen IDs**.
- Teilen: App-Link ohne Daten oder selektive Einstellungsgruppen; Schema 1 und 2 werden gelesen, neue Links verwenden 2. Benutzer bestätigt die Übernahme und wählt Gruppen/Modi. PIN ist ausdrücklich ausgeschlossen. Grenzen: 60.000 Zeichen im Fragment, 200 Schlüssel, 12.000 Zeichen je Wert. Neue Vorlagen müssen dieses Größenmodell berücksichtigen.
- Native Übernahme über `rechengurulgi://settings?data=...`, weiter als lokales `#settings`-Fragment. Keine Änderung der Paketkennung oder Fragmentverluste.
- Portabler HTML-Export sammelt eigene Speicherschlüssel (`buildPortableHtmlStatePayload`), bettet Zustand sicher serialisiert ein und bündelt externe Module (`bundleRealschuleAssets`). Der bisherige Bootstrap überschreibt beim ersten Öffnen Snapshot-Schlüssel. Für die neue Vorlagenbibliothek braucht es dort ausdrücklich eine kollisionssichere Zusammenführung.
- Native Asset-Whitelist in `MainActivity.kt:285` erlaubt exakt die vorhandenen Module. Neue Baukasten-Dateien müssen ausdrücklich ergänzt, eingebettet, synchronisiert und offline gecacht werden.
- Speicherfehler werden bisher teilweise abgefangen, ohne Benutzerhinweis. Neue Vorlagen dürfen nur nach erfolgreichem Schreiben als gespeichert angezeigt werden; beschädigte Bibliotheken nicht durch eine leere Liste ersetzen.

## 4. Wiederverwendung und empfohlene Architektur

Empfehlung: **gemeinsames versioniertes Konfigurationsmodell mit Adapter auf bestehende Generatoren**. UI, Validierung und Speicherung getrennt. Die Rechnung wird weiterhin mit derselben Mathematik für Vorschau, Übung und gespeicherte Kachel erzeugt.

| Vorhandene Funktion | Verwendung |
| --- | --- |
| `makeStandardTask`, `makeRandomTask` | bisherige Zweizahl-Aufgaben, Profile, Reihen und Schwierigkeit; kompatibler Altpfad |
| `makeThreeOperandTask` | bisherige Plus/Minus-Profile mit drei Zahlen weiter laden; ihre Informationen in das gemeinsame Modell überführen |
| `MatheChains.generate/evaluate/text` | Ketten 2–10, mathematische Auswertung, Zwischenwerte, Rechenweg; Schnittstelle für Zahlendomänen und Zeichenmengen pro Stelle erweitern |
| `MatheMixedMal.generate/rowsFor/accepts` | A–F samt schwerer Klammern, Reihen und eindeutigem Gegenfaktor unverändert erreichbar halten |
| `makeFactorMissingTask`, `makeOperatorMissingTask`, `makeTrueFalseTask`, `makeCompareTask` | bestehende Formate erhalten; Lücken- und Eindeutigkeitsprüfung zentral ergänzen |
| Reihen-Normalisierung/-Serialisierung, Klassen-/Modusprofile | Kompatibilitätsadapter und bewusste Profilwahl |
| `renderTask`, Antwortzustand und `answer-flow.js` | gewohnter Antwortablauf, Zähler, Hilfen, Fehlerwiederholung; strukturierte Lückenmetadaten ergänzen |
| `buildPyramideRows`, `buildTraubeRows`, `renderGrid` | unveränderte Sonderansichten; keine neue lineare Generatorlogik für Figuren |
| bestehende Teile-/Export-/Sync-Funktionen | explizite neue Vorlagengruppe und neue Module ergänzen |

Die alten Generatoren können nicht jede neue Bedingung schon heute ausdrücken. Insbesondere feste Werte, individuelle Min/Max-Werte, Operatoren je Position und beliebige Lücken erfordern additive Schnittstellen. Keine bloße UI-Umschreibung oder unbegrenztes Verwerfen von Zufallsaufgaben. Gemeinsame Auswertung und Validierung verwenden, keine zweite parallele Rechenlogik aufbauen.

Alternativen: Nur das bestehende Menü optisch verändern wäre kleiner, erfüllt aber feste Zahlen und individuelle Ketten nicht. Ein komplett neuer Generator neben allen Altgeneratoren würde Rechenregeln duplizieren und erhöht das Regressionsrisiko. Deshalb der gemeinsame Adapter mit gezielten Erweiterungen.

## 5. Vorgesehene Bedienung und Erreichbarkeit

Die Schulbereich-Tabs und zuletzt aktive Übung bleiben erhalten. Ein neuer Einstieg „Aufgaben“ zeigt große Kacheln. Beim App-Start muss die zuletzt aktive Übung weiterhin direkt nutzbar bleiben; kein zusätzlicher Pflichtdialog.

```text
Grundschule (1–4)                       Realschule (5–10)
Klasse: [Eigene] [1] [2] [3] [4]

[ Plus           ]  [ Minus          ]
[ Plus & Minus   ]  [ Mal & Geteilt   ]
[ Alle Rechenarten]  [ Rechenketten    ]

Weitere Aufgaben
[ Plus-Pyramide  ]  [ Minus-Traube    ]
[ Gemischte Malaufgaben A–F          ]
[ Quadratzahlen  ]  [ Quadrat-Division]
[ Verdoppeln     ]  [ Halbieren      ]
[ Fehler üben                         ]

Meine Aufgaben                         [Neu erstellen]
[ Plus bis 100                    × ]
[ 47 + 28 = □                       ]
[ Nur Plus · Mit Zehnerübergang      ]
[ Üben ]                 [ Bearbeiten]
```

„Meine Aufgaben“ ist sowohl als Hauptzugang/Scrollziel als auch als eigener Abschnitt unter den normalen Kacheln erreichbar. Keine doppelte Bibliothek. Die bisherige vollständige Aufgabenartauswahl bleibt als weiterer Einstieg verfügbar.

- Plus → letzte Plus-Konfiguration mit sofort sichtbarem „Üben“ und „Konfigurieren“.
- Minus → gleicher Bildschirmtyp, eigene Minus-Werte.
- Plus & Minus → direkt sichtbare Auswahl `[Nur Plus] [Nur Minus] [Gemischt]`; darunter „Üben“ und „Konfigurieren“. Dieselbe Konfigurator-Komponente wie Plus/Minus, keine weiteren Einstellseiten. Der Einstieg behält einen eigenen letzten Zustand, auch wenn dort „Nur Plus“ gewählt wird.
- Mal & Geteilt → direkt sichtbare Auswahl `[Nur Mal] [Nur Geteilt] [Gemischt]`, Reihen und zuletzt verwendete Werte. Bestehende `mal`-, `geteilt`- und `mixMD`-Profile bleiben zusätzlich einzeln erhalten; der Hauptbereich merkt seine letzte Unterauswahl.
- Alle Rechenarten und Rechenketten → derselbe Baukasten mit jeweils passender Ausgangsauswahl.
- Plus-Pyramide → direkt bisherige Pyramidenansicht; Minus-Traube → direkt bisherige Traubenansicht. Keine vorgeschaltete Kästchen-Konfiguration.
- Quadrate, Quadrat-Division, A–F, Verdoppeln, Halbieren und Fehler bleiben explizit anwählbar. Quadrate sind außerdem in Mal & Geteilt einstellbar.
- Persönliche Kachel → „Üben“ startet exakt die gespeicherte Konfiguration, „Bearbeiten“ öffnet sie vollständig. Kein Speichern beim bloßen Öffnen.

### Kästchen-Konfigurator

```text
Plus · Konfigurieren

[ 10–99 ] [ + ] [ 1–9 ] [ = ] [ ? ]
                      ↑ ausgewählt

2. Zahl
(●) Zufallszahl      ( ) Feste Zahl
[0–9] [1–9] [10–99] [100–999] [Eigener Bereich]
Minimum [1]                       Maximum [9]
[ ] Null erlauben
[✓] Dieses Kästchen darf abgefragt werden
[ Davor einfügen ] [ Danach einfügen ] [ Entfernen ]

[ + Rechenglied ]
Abfrage: [ Ergebnis / markierte Kästchen / zufällig ]
▸ Weitere Rechenregeln
[ 5 Beispielaufgaben anzeigen ]
[ Üben ] [ Als eigene Vorlage speichern ]
```

Bei Auswahl „Feste Zahl“ erscheint ausschließlich ein Zahlenwert-Feld, beispielsweise 25; die Kachel zeigt `25`, niemals `0–25`. Bei Bereichswahl zeigt sie `10–99`. Ein Klick auf einen Operator öffnet darunter vier Mehrfachwahlknöpfe; mindestens eines bleibt an. Beschriftung `+`, `±`, `× ÷` oder `Mix` mit zugänglicher vollständiger Beschreibung.

Das Ergebnis-Kästchen ist zur Abfragewahl anklickbar, `=` wird automatisch verwaltet. „Darf abgefragt werden“ wird sichtbar am betreffenden Kästchen markiert, unabhängig von Zahlendomäne und Operatorauswahl. Standardmäßig genau eine erlaubte Lücke je Aufgabe. Eine Auswahl „nur Ergebnis“ kann über den Abfrageschalter wiederhergestellt werden. Bei 10 Zahlen Hinzufügen deaktivieren, bei 2 Zahlen Entfernen deaktivieren. Einfügen/Entfernen arbeitet immer mit Zahl und benachbartem Operator; interne stabile Kästchen-IDs erhalten die Lückenmarkierungen der übrigen Positionen.

Auf schmalen Displays umbrechen, zum Beispiel:

```text
[ 10–99 ] [ + ] [ 1–9 ]
[ − ] [ 1–9 ] [ = ] [ ? ]
```

Flex-Umbruch, `min-width:0`, variable Breiten, mindestens 48 px hohe Touchflächen; keine starre Gesamtbreite oder horizontale Scrollpflicht. Kleine Operator-Zahl-Gruppen dürfen zusammenbleiben, müssen sich bei großem Text aber ebenfalls auflösen können. Einstellfeld unter der ganzen Rechnung in voller verfügbarer Breite. Nur ein Kästchen-Einstellfeld gleichzeitig geöffnet; Tastaturfokus springt nicht durch Neugenerierung weg. Lange Titel umbrechen, Aktionen in eigener Zeile, keine überlagerte X-Taste.

### Mal/Geteilt und Regeln

Reihen 1–10 mehrfach auswählbar, Schnellwahl alle / 2,5,10 / 2–9 / eigene Auswahl. Bestehende Profile 1–9, bis 10, Zehner und frei bleiben verfügbar. Quadrate getrennt als normal / nur Quadrate / beimischen sowie passende Division. Gewählte Reihen schränken im neuen Baukasten auch Quadratbasen ein; beispielsweise Reihe 7 erlaubt `7×7` und `49÷7`, keine fremde Quadratbasis. Historische separate Quadratprofile bleiben kompatibel lesbar.

Bei Reihe 7 sind `7×8`, `7×□=56`, `56÷7` und `□÷7=8` möglich. Soll die bekannte Reihe sichtbar bleiben, erhält ihr Kästchen keine Lücke. Bei unmöglichen Kombinationen wie 10er-Reihe im Profil 1–9 bietet die App einen ausdrücklich anzutippenden Wechsel zu bis 10 an. Keine automatische Profilkorrektur.

„Weitere Rechenregeln“ enthält Ergebnisgrenze, Grenze für Zwischenwerte, Übergang/Entleihen beliebig/mit/ohne, Schwierigkeit/adaptiv sowie die bestehenden sinnvollen Zusatzoptionen. Punkt vor Strich, nichtnegative Ganzzahlen und exakte Division werden als geltende Regeln erklärt. Keine inaktiven Versprechen für Restdivision, negative Ergebnisse oder freie Klammern. Vorhandene A–F-Klammern bleiben im A–F-Modus verfügbar. Richtig/falsch und Vergleichen bleiben als eigene Abfrageformate erhalten, auch wenn sie keine einzelne lineare Lücke darstellen.

### Mathematische Prüfung

Vor dem Start Struktur, Werte, Bereiche, Operatorauswahl, Reihen-/Profilkonflikte, Divisoren, Ergebnis-/Zwischenwertgrenzen und Übergangsbedingungen prüfen. Ein expliziter Divisorbereich mit Null wird markiert und eine Änderung auf Minimum 1 angeboten; die ursprüngliche Eingabe bleibt bis zur Zustimmung erhalten.

Jede erzeugte Aufgabe nochmals gegen alle Regeln und die exakte Auswertung prüfen. Zahlenlücken mit Nullfaktoren, Operatorlücken mit mehreren passenden Zeichen und andere mehrdeutige Gleichungen verwerfen. Eindeutigkeit aus der angezeigten Gleichung und den erlaubten Domänen/Beziehungen prüfen, nicht allein aus dem vom Generator ursprünglich gewählten Wert ableiten. Für einen fehlenden Operator alle angebotenen Operatorantworten prüfen.

Mehrere gleichzeitige Lücken nur bei nachgewiesener Eindeutigkeit. Endliche Domänen, algebraische Prüfung und begrenzte Suche mit Abbruch nach zweiter Lösung; ein Zeitbudget schützt Smartphones vor Blockade. Eine nicht abgeschlossene Prüfung bedeutet „nicht sicher geprüft“, niemals „eindeutig“. Bei zu großer oder nicht eindeutiger Auswahl Start sperren und Einzel-Lücke anbieten. Der optionale Mehrlückenmodus darf nur freigeschaltet werden, wenn diese Prüfung und die gemeinsame Antwortwertung vollständig implementiert und getestet sind.

Fehler enthalten betroffene Kästchen, verständliche Ursache und eine explizit auswählbare Korrektur. Zeitbegrenztes erfolgloses Generieren wird nicht als mathematischer Unmöglichkeitsbeweis bezeichnet. „5 Beispielaufgaben“ benutzt den Übungsgenerator ohne Punkte, Fehlerlisten, Rundenzähler oder adaptive Lernwerte zu verändern. Wenn der gültige Raum nur eine feste Rechnung enthält, wird das erklärt; keine künstliche Zufallsvielfalt behaupten.

## 6. Persönliche Kacheln und Kompatibilität

Vorgeschlagene neue Schlüssel innerhalb `appStorage`:

- `mathExerciseLibrary_v1`: atomar geschriebene JSON-Bibliothek `{schema:1, templates:[...]}`. Jede Vorlage enthält dauerhafte zufällige ID, Titel, Erstell-/Änderungsdatum, ursprüngliche Modus-/Klasseninformation, vollständige Konfiguration, benötigte Schema-/Funktionsversion und validierte Beispielaufgabe. ID unabhängig vom Titel, mit geprüftem Zufalls-Fallback für ältere WebViews.
- `mathBuilderLast:grade<0–4>:<family>`: letzter Baukasten-Zustand je Hauptbereich und Klasse, getrennt von der Bibliothek und den alten Modusprofilen. Familienidentität bleibt von der tatsächlich verwendeten Generator-Rechenart getrennt.
- Das Konfigurationsmodell unterscheidet feste Werte, Bereiche und Reihenbeziehungen ausdrücklich; Zahlenkästchen, Operatorpositionen, zulässige Lücken, Quadratmodus, Regeln, Formate, Anzahl und vorhandene optionale Einstellungen werden vollständig gespeichert.

Alte `mathModeSettings:*`-Daten bleiben erhalten. Beim erstmaligen Öffnen eines alten Profils wird ein kompatibler Zustand abgeleitet. Keine Massenmigration und kein Zurückschreiben neuer Standardwerte beim App-Start. Der alte Pfad bleibt nutzbar, solange ein Profil nicht im Baukasten geändert wurde. Bei neuen Feldern muss `saveModeSettings`, das derzeit alle Controls einsammelt, ausdrücklich vor Vermischung von Vorlagentitel/Editorzustand und Altprofilen geschützt werden.

„Neu speichern“ legt eine ID an; „Änderungen speichern“ aktualisiert genau diese ID; „Als weitere Vorlage speichern“ erzeugt eine neue ID. Umbenennen ändert nur Titel und Änderungsdatum. X fragt vor dem Löschen; nur den ausgewählten Datensatz entfernen. Atomare Schreiboperation prüfen, erst danach UI-Erfolg melden. Bei beschädigter Bibliothek Wiederherstellung/Export anbieten und Originaldaten behalten. Mehrere offene PWA-Tabs durch Einlesen des aktuellen Standes und Konflikterkennung berücksichtigen.

Teilen bekommt die ausdrücklich wählbare Gruppe „Eigene Aufgaben“ mit Einzelauswahl. Bibliothek nicht pauschal als einen möglicherweise zu großen 12.000-Zeichen-Wert in den alten Link kopieren: ausgewählte Vorlagen als separat begrenzte Nutzdaten übertragen, Gesamtlänge vorher prüfen. Ein neues Schema muss alte Links 1/2 weiterhin lesen und auf alten Empfängern verständlich als nicht unterstützte Funktion erkennbar sein. Details des Versionshinweises sind Teil der Umsetzung.

Import zeigt Titel und Vorschau, validiert die Daten und legt standardmäßig neue lokale IDs an. Niemals persönliche Vorlagen nach Titel oder fremder ID ungefragt überschreiben. Expliziter Ersatz kann nach Auswahl einer Zielvorlage angeboten werden. Dasselbe Zusammenführungsprinzip beim portablen HTML-Import anwenden. „Nur App senden“ enthält keine Vorlagen oder Nutzereinstellungen. PIN bleibt beim Einstellungslink ausgeschlossen.

## 7. Konkrete Risiken und Gegenmaßnahmen

| Befund im aktuellen Code | Konsequenz für die Umsetzung |
| --- | --- |
| Hauptlogik in rund 15.000 Zeilen `index.html`, DOM-abhängige Generatorparameter | neue Konfiguration/Validierung/Speicherung in testbaren Modulen; bestehende Aufrufer gezielt adaptieren |
| `makeThreeOperandTask` fällt nach 500 Versuchen auf Plus zurück, `applyOpRanges` beendet nach 80 Versuchen auch ohne Bereichsgarantie | neue strenge Konfigurationen dürfen solche Resultate nicht durchlassen; finale Regelprüfung und expliziter Fehler statt stiller Ersatzrechnung |
| Standardgeneratoren besitzen weitere Profil-/Grenz-Fallbacks; `makeOperatorMissingTask` stoppt nach 100 Versuchen | eindeutige Antwort und vollständige Regelkonformität nach Generierung prüfen; kein Start trotz bloß erreichtem Versuchslimit |
| `MatheChains.generate` normalisiert leere Zeichenliste auf Plus und verwendet bei Engpässen 0/1 | neue Konfiguration vorher streng validieren und feste Domänen nachher prüfen; Altverhalten für alte Profile schützen |
| `MatheMixedMal` kann auf Typ A zurückfallen | altes A–F-Verhalten erhalten; ausdrücklich gewählte neue Struktur darf nicht still ersetzt werden |
| Globale statt positionsbezogener Kettenoptionen | Schnittstelle ergänzen; Auswertung und Rechenweg weiterverwenden |
| Web-Maximum 1000 vs. Generator 9999, Klasse-4-Vorgabe 2000 bei Verdoppeln/Halbieren | Grenze dokumentieren und getrennt behandeln; keine heimliche Änderung bestehender Profile |
| Quadrat-Beimischung aktuell als eigener Auswahlzweig, nicht zwingend auf numerische Reihen eingeschränkt | neue Beziehung eindeutig modellieren; Altprofile nicht unbemerkt umdeuten |
| Teile-Limits, portable Bootstrap-Überschreibung, Speicherquoten und Mehrtab-Konflikte | neues validiertes Vorlagen-Importmodell, Größenprüfung, atomare Speicherung und sichtbare Konflikte |
| Numerische Eingabehärtung entfernt Minuszeichen; Kettenauswertung verbietet negative Werte | keine Option „negative Ergebnisse“ freischalten, solange der gesamte Antwortpfad dies nicht unterstützt |
| Zwei bestehende Browserprüfungen erwarten alten Antwortablauf | Test-Erwartungen gezielt auf bestätigtes aktuelles Verhalten aktualisieren; richtige Prüfung nicht durch Abschalten aller Aussagen ersetzen |
| JDK 21 aktiv; JDK17/SDK/Pwsh derzeit nicht nachgewiesen | vor Release Toolchain einrichten und Originalsignierung prüfen; bei Fehler Veröffentlichung stoppen |

## 8. Umsetzungsfolge nach ausdrücklicher Freigabe

1. **Regression absichern:** ältere Browserprüfungen an aktuelle Bestätigung/Weiter-Logik anpassen; Altprofile und Sondergeneratoren mit reproduzierbaren Testdaten erfassen. Keine Produktfunktion dafür zurückbauen.
2. **Konfigurationsmodell und Adapter:** Schema, stabile Kästchen-IDs, feste Zahlen/Bereiche/Beziehungen, Operatoren je Stelle, Lücken, Regeln und Altprofil-Lesen. Tests für jede Einschränkung zuerst definieren.
3. **Generatorintegration:** bestehende Zwei-/Dreizahlpfade wiederverwenden, Kettenschnittstelle gezielt erweitern, finale Regelprüfung und Eindeutigkeit; A–F und Figuren schützen. Vorschau und Übung aus derselben Schnittstelle.
4. **Oberfläche:** Hauptkacheln und direkt sichtbare Unterauswahl; gemeinsamer Kästcheneditor mit nur einem geöffneten Einstellfeld; Reihen/Quadrate, Regeln, Vorschau, Tastatur-/Fokusführung und Übersetzungen. Alle bisherigen Formate weiterhin erreichbar.
5. **Bibliothek:** stabile IDs, Speichern/Bearbeiten/Kopie/Umbenennen/Löschen, unabhängige letzte Zustände, fehlerfeste Wiederherstellung und sichtbare Speicherfehler.
6. **Teilen/Export/Offline:** selektive Vorlagenübernahme, neue IDs bei Import, Schemakompatibilität, portable Zusammenführung, native Whitelist, SW und Web-Sync.
7. **Gesamtabnahme:** Generator-, Speicher-, Import-, Browser- und Layoutprüfungen; unveränderte Realschule und Figuren kontrollieren; alle Abweichungen beheben.
8. **Release:** unmittelbar vorher `origin/main` und belegte Versionsnummern erneut prüfen. Nach aktuellem Stand wäre 226 die nächste freie Version; nicht jetzt reservieren. Nur erfolgreich geprüften Stand signieren, archivieren und veröffentlichen.

### Geplante Dateien

| Datei | Geplante Änderung |
| --- | --- |
| `app/src/main/assets/index.html` | Navigation, Einbindung, Adapter zu alten Controls/Generatoren, Vorschau/Übung/Rendering/Drucken, Teilen/Import und portabler Export |
| neu `app/src/main/assets/grundschule/config.js` | reines Konfigurationsmodell, Validierung, Altprofiladapter und Generatoranbindung |
| neu `app/src/main/assets/grundschule/templates.js` | Bibliothek, CRUD, ID-/Import-/Speicherprüfungen |
| neu `app/src/main/assets/grundschule/ui.js` | Kacheln und Kästcheneditor |
| neu `app/src/main/assets/grundschule/style.css` | auf Grundschule begrenztes responsives Layout mit vorhandenen Theme-Variablen |
| `app/src/main/assets/rechenketten.js` | additive Optionen für individuelle Kästchen, bestehende API weiter gültig; gemeinsame Auswertung |
| `app/src/main/assets/gemischte-malaufgaben.js` | möglichst unverändert; nur notwendige gemeinsame Schnittstellenanpassung mit Regression |
| `app/src/main/assets/answer-flow.js` | bestehendes Verhalten erhalten; nur notwendige vollständige Mehrlückenintegration, falls angeboten |
| `app/src/main/assets/realschule/ui.js` | ausschließlich gemeinsame Grundschul-Info anpassen; Realschul-Generatoren unverändert |
| `app/src/main/java/de/parip69/rechengurulgi/MainActivity.kt` | nur ausdrückliche Erweiterung der portablen Export-Whitelist um neue Assets |
| `sync_web_assets.ps1`, `app/src/main/assets/sw.js` | neue Module kopieren und cachen, vorhandenen Versionsprozess nutzen |
| `tests/grundschule-config.test.cjs`, `tests/grundschule-templates.test.cjs`, `tests/grundschule-baukasten-ui.cjs` (neu) | mathematische, Speicher-, Import- und Bedienprüfungen |
| bestehende `tests/rechenketten*`, `tests/gemischte-malaufgaben*`, Antwort-/Realschultests | API-/Regressionsprüfungen und aktuelle Antwort-Erwartungen |
| `.github/workflows/verify-web-sync.yml`, `.github/workflows/build-signed-apk.yml` | neue Testdateien und Asset-Synchronitätsprüfung aufnehmen |
| `docs/plans/task.md` | Fortschritt ergänzen, vorhandenen Verlauf bewahren |
| `docs/grundschule/*`, weitere `docs`-Webdateien | ausschließlich über Synchronisation |
| `version.properties`, HTML-/SW-/Versionsmetadaten, `docs/MatheKids-*.apk`, `docs/MatheGuru-*.apk`, `Privat/MatheKids-v<VERSION>.*` | erst beim geprüften Release durch vorhandene Skripte |

Keine geplante Änderung an Paketkennung, Signierschlüssel, Schulbereich-Daten oder Realschul-Mathematik.

## 9. Testplan und bisher tatsächlich ausgeführte Prüfungen

### Geplante automatisierte Abnahme

- Plus, Minus, Plus/Minus, Mal, Geteilt, Mal/Geteilt und alle Rechenarten mit unabhängiger Nachrechnung; feste Zahlen, Null ein/aus, alle Standardbereiche, eigene Bereiche und widersprüchliche Grenzen.
- Reihen 1–10 einzeln/mehrfach/Schnellauswahlen, Profile 1–9/10/Zehner/frei, nur Quadrate/Beimischen/Umkehrdivision. Bekannte Reihe bei fehlendem Gegenfaktor sichtbar. Kein falscher Ersatz für leere Schnittmengen.
- Übergang/Entleihen mit/ohne/beliebig; Ergebnis- und Zwischenwertgrenzen; keine Null-Division und keine Division mit Rest.
- Erste/zweite/andere Zahl, Ergebnis und Operator als Lücke; zufällige erlaubte Position, vollständige Wiederherstellung der Markierungen. Nullfaktor- und Mehrdeutigkeitsfälle explizit ablehnen; bei Mehrlücken jede zugelassene Aufgabe auf eindeutige vollständige Lösung prüfen.
- Kettenlängen 2–10, alle 15 Zeichenkombinationen, Zeichen pro Position, Punkt vor Strich und gleichrangig links; Einfügen/Entfernen am Anfang/in der Mitte/am Ende erhält Struktur und IDs. A–F einschließlich vorhandener Klammern separat absichern.
- Vorlagen erstellen, ID beim Bearbeiten/Umbenennen erhalten, Kopie mit neuer ID, nur ausgewählte Vorlage löschen, Rückfrage abbrechen, Reload/Neustart, defekte Bibliothek, volle Speicherquote, Mehrtab-Konflikt. Sämtliche Werte einschließlich Formaten und optionalen Einstellungen vergleichen.
- Alte Klasse-0/1/2/3/4-Profile laden, unbekannte Zusatzfelder erhalten, unabhängige letzte Einstellungen je Hauptbereich, kein Umschreiben beim bloßen Öffnen.
- Teilen ohne Einstellungen unverändert; neue Vorlagen explizit auswählen, Linkgrößen begrenzen, alte Schemata lesen, Importkollisionen erzeugen neue IDs, keine PIN. Native Weiterleitung erhält Fragment. Portables HTML startet offline mit Modulen und Vorlagen.
- Figuren: Pyramidenbeziehungen/Lücken, Traubenbeziehungen/Eindeutigkeit, Eingabe, Hilfen, Fehlerübernahme und Druck unverändert; Verdoppeln/Halbieren/Fehlerpool, Richtig/Falsch und Vergleichen weiterhin verwendbar.
- Vorschau verändert keine Lernstatistik oder aktuelle Sitzung, Aufgaben erfüllen genau die gespeicherte Konfiguration. Wiederherstellung gespeicherter Beispielrechnung prüfen.

### Geplante Bedien- und Release-Abnahme

- Chromium/Playwright: 320, 360, 390, 412 und 768 px; Querformat; 200 % Schrift/Zoom; 10 Zahlen mit langen Werten; offenes Einstellfeld; sichtbare Tastatur; lange Titel; mindestens 50 gespeicherte Kacheln. Geometrisch auf Überlappungen und Dokument-/Dialogüberlauf prüfen, nicht nur Screenshots betrachten.
- Touch, Tastatur/Tab/Enter/Escape, sichtbarer Fokus, große berührbare Ziele, ausgewählte Zustände, zugängliche Fehlermeldungen; passende deutsche und rumänische Texte.
- Antwortablauf, automatische/manuelle Umschaltung, zwei Versuche, Punkte und Fehlerliste; bestehende Realschulregression.
- PWA aktualisieren, offline neu starten, Cacheversion/Module/Quelle-docs-Gleichheit; APK-Assets mit Quellen vergleichen.
- Release mit JDK17, SDK/Build Tools35, Wrapper8.9 und PowerShell; Originalschlüsselprüfung, Paket `de.parip69.rechengurulgi`, höherer Code, nicht debuggable, v1/v2/v3. `tests/project-signing-checks.ps1` und `tests/android-release-checks.ps1` samt Ablehnungsfällen.
- Versionierte APK/HTML/Prüfbeleg in Privat, MatheKids- und MatheGuru-Downloadpfade; normaler Push, GitHub-Prüfungen/Pages abwarten, öffentliche versionierte APK herunterladen und SHA-256 vergleichen. Öffentliche HTML-Version und Update-Erkennung prüfen. Bei erforderlichem Fehlschlag Veröffentlichung stoppen.
- Echter Samsung-/Android-Updateinstallationstest mit Datenübernahme und großer Systemschrift bleibt ein separater Gerätetest. Ohne verfügbares Gerät ausdrücklich als nicht ausgeführt ausweisen. Der vorhandene Updater bietet APK-Download/Installation an; Android bestätigt die Installation weiterhin durch den Benutzer.

### Tatsächlich ausgeführt am unveränderten Stand 225

| Prüfung | Ergebnis |
| --- | --- |
| `git fetch origin`, SHA-/Statusvergleich | erfolgreich; HEAD = origin/main = 471950b; keine offenen Änderungen vor Analyse |
| `node --test tests/answer-flow.test.cjs tests/realschule.test.cjs tests/rechenketten.test.cjs tests/gemischte-malaufgaben.test.cjs` | **39 bestanden, 0 fehlgeschlagen**; darunter 9.450 deterministische Kettenfälle und 14.500 Realschulaufgaben sowie A–F-Prüfungen |
| `node tests/answer-sizing-ui.cjs` | bestanden bei 320/390/1280 px; Antwortgrößen, Eingabefeld/Umrandung/Cursor, eigener Zahlenblock, Pyramide/Traube und Realschule |
| `node tests/auto-next-ui.cjs` | bestanden, Desktop und Android-Touch-Emulation; automatische richtige Antwort, Korrektur, Abbruch, gespeichertes Abschalten, Fokus und Wertung |
| `node tests/rechenketten-ui.cjs` | fehlgeschlagen Zeile 26: erwartet dieselbe Aufgabe nach korrektem Enter, aktuelle App hat bereits gewechselt |
| `node tests/gemischte-malaufgaben-ui.cjs` | fehlgeschlagen Zeile 23: erwartet `correct` an der alten Aufgabe nach korrektem Enter, aktuelle App zeigt bereits die nächste |
| APK-Build/Originalsignaturprüfung in dieser Sitzung | nicht ausgeführt; Phase 1. JDK21 aktiv, kein `pwsh` im PATH, keine gültigen JAVA_HOME/ANDROID_HOME/ANDROID_SDK_ROOT und kein dokumentierter `.cloud-tools`-Ordner; Toolchain vor Phase 3 bereitstellen |
| Echter Android-/Samsung-Installationstest, öffentliche neue Downloadlinks | nicht ausgeführt; keine neue Version erstellt oder veröffentlicht |

Die beiden fehlgeschlagenen Browsertests enthalten Erwartungen aus dem älteren manuellen Antwortablauf. Der aktuelle Code wechselt beim erfolgreichen ausdrücklichen Bestätigen sofort weiter; dies erklärt genau diese Assertions. Ihre nachfolgenden Prüfungen wurden durch den Abbruch nicht ausgeführt. Daraus folgt keine vollständige Browserabnahme aller übrigen Funktionen.

## 10. Freigabepunkt

Zur Freigabe steht die gemeinsame Konfigurationsschicht mit den oben gezeigten Kacheln, dem Kästcheneditor, stabil gespeicherten persönlichen Vorlagen und unveränderten Sonderansichten. Erst nach ausdrücklicher Nutzerfreigabe produktiven Code ändern. Danach zusammenhängend implementieren, prüfen, mit der nächsten dann freien Version und dem Originalschlüssel bauen, archivieren, GitHub/Pages aktualisieren und die tatsächlich geprüften Downloadlinks nennen.
