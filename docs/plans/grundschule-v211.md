# Grundschule: Rechenketten und gemischte Malaufgaben, Version 211

Die bestehenden Grundschul- und Realschul-Aufgaben bleiben erhalten. Die Grundschul-Auswahl zeigt ihre Gruppen als größere zweispaltige Karten mit vollständigen Namen und sichtbarer Auswahl. Keine allgemeine Mehrfachauswahl der bisherigen Aufgabenarten wurde eingeführt.

## Rechenketten

Eine zusätzliche Aufgabenart mit 2–10 Zahlen. Plus, Minus, Mal und Geteilt können einzeln oder in beliebigen Kombinationen ausgewählt werden. Die Zahl der Zahlen pro Kette ist von der Aufgabenanzahl pro Runde getrennt. Punkt vor Strich gilt; gleichrangige Rechenzeichen werden von links nach rechts verarbeitet. Der gewählte Maximalwert gilt für jede Zahl, jedes Zwischenergebnis und das Endergebnis. Keine negativen Werte, keine Division durch null und keine Division mit Rest. Kleine Grenzen und lange Ketten können 0 oder 1 erforderlich machen.

„Prüfen“ bewertet die eingegebene Antwort mit der bestehenden Prüfung. Danach bleibt die Rechnung stehen, bis „Weiter“ gedrückt wird. Hinweise und der vollständige aktuelle Zahlenweg öffnen im Vollbild mit drei breiten Schaltflächen unten.

## Gemischte Malaufgaben

Sechs Aufgabentypen: fehlender Faktor mit wechselnder Lückenposition und vertauschter Gleichung; zwei Malprodukte mit Addition; zwei Malprodukte mit Subtraktion; ein Malprodukt mit Addition; ein Malprodukt mit Subtraktion; auf Schwer eine fehlende Zahl in einer kombinierten Rechnung, einschließlich Klammern. Die ausgewählte Einmaleinsreihe ist kein fest eingebauter 6er-Wert. Bei fehlenden Faktoren bleibt die bekannte Reihe sichtbar; die gesuchte andere Zahl variiert.

Einzeln über „Gemischte Malaufgaben“ auswählen. Diese Variante zeigt eine Aufgabe nach der anderen im selben Übungsfenster, etwa „Aufgabe 7 von 20“. Alternativ per Checkbox in den bisherigen Mal-, Mal/Geteilt- und Alle-Rechenarten-Runden beimischen, soweit „Ergebnis fehlt“ und kein Blitzmodus aktiv sind. Diese bisherigen Runden behalten ihre Mehrzeilen-Ansicht. Keine neuen Reihen- oder Schwierigkeitsfelder: die vorhandenen Felder bleiben maßgeblich.

Einfach verwendet A/D/E und kleine Faktoren; Normal ergänzt B/C; Schwer ergänzt F mit Umkehraufgaben, mehreren Schritten und Klammern. Die bestehende automatische Schwierigkeit kann weiter genutzt werden. Alle aktivierten Reihen müssen mit Zahlenprofil und Grenze möglich sein; unpassende Grenzen werden erklärt, statt unbemerkt Reihen auszuschließen. Bei mehreren Reihen werden Produkte aus unterschiedlichen Reihen bevorzugt. Ein begrenzter Verlauf vermeidet Wiederholungen, soweit genügend Aufgaben möglich sind.

Eine falsche Antwort bleibt sichtbar und kann korrigiert werden; „Nächste Aufgabe“ wird erst nach der richtigen Prüfung freigegeben. „Hilfe“ zeigt zunächst einen Hinweis und gibt mit jedem Druck weitere Schritte frei. „Rechenweg“ zeigt auf ausdrücklichen Druck alle korrekten Einzelgleichungen sowie die vollständige Rechnung mit Ergebnis.

## Daten, Teilen und Export

Neue Aufgaben verwenden dieselben Zähler, Fehlerlisten und Wiederholungsfunktionen. Bestehende gespeicherte Profile und Statistiken werden nicht gelöscht. Einstellungen bleiben lokal und je Klasse/Aufgabenart gespeichert. Beide neuen Modus-IDs sind in der bestehenden selektiven Teilen-Registrierung enthalten; das #settings-Fragment bleibt bestehen. Alte Einstellungslinks bleiben unterstützt. Die neuen Aufgabenarten benötigen bei Empfängern Version 211 oder neuer.

Service-Worker-Cache und Web-Sync berücksichtigen die beiden neuen Offline-Module. Der portable HTML-Export bettet sie ebenso wie die bisherigen Realschul-Dateien ein. Dafür erlaubt die native Dateischnittstelle genau diese zwei zusätzlichen Asset-Dateien; keine beliebigen Dateipfade. Die Realschul-Rechenlogik wurde nicht verändert; lediglich die Grundschul-Texte in der gemeinsamen Info wurden ergänzt.

## Prüfung

- 9.450 generierte Rechenketten über alle 15 Zeichenkombinationen, Längen 2–10 und sieben Grenzen, einschließlich unabhängiger Auswertung, sowie gezielte Fehlerfälle.
- 3.040 generierte Malaufgaben über A–F, wechselnde Positionen/Gleichungsseiten, alle Reihen, Schwierigkeitsstufen, Zahlenprofile, schwere Klammern und eindeutige affine Lösungen. Falsche Antworten und unpassende Grenzen werden zurückgewiesen.
- Die 19 vorhandenen Realschul-Mathematiktests bleiben Teil der Regression. Insgesamt 28 Testfälle in den drei Generator-Testdateien.
- Browserprüfungen: Auswahlkarten; Zahlenanzahl und Zeichenwahl; Prüfen/Wiederholen; Punkte und persistente Fehlerliste; nächste Aufgabe ohne Seitenwechsel; gespeicherte Einstellungen; Checkbox-Mischung und Abschalten; schrittweise Hilfe und mathematisch korrekte sichtbare Gleichungen; Teilen und vollständiger portabler Export; Breiten 320/390/768. Bestehende Realschul-Browserregression erfolgreich.
- Release-APK wird mit dem bisherigen Schlüssel gebaut und auf Paketname, Version, nicht debuggable, v1/v2/v3-Signaturen und Zertifikat von 209/210 geprüft. Kein neuer Signierschlüssel.
- Kein echter Android-Installationstest durchgeführt. Die veröffentlichte APK wurde vollständig heruntergeladen und bytegenau verglichen. Alle vier GitHub-Prüfläufe sind erfolgreich. Die öffentliche HTML-Seite meldet 211; beide neuen Module sind HTTP 200 und byteidentisch mit der Quelle.

## Geänderte Bereiche

Neue Module: app/src/main/assets/rechenketten.js und gemischte-malaufgaben.js. Integration, Einstellungen, Menü, Prüfen, Hilfe, Teilen und Export: index.html. Grundschul-Info: realschule/ui.js. Offline-/Web-Auslieferung: sw.js, sync_web_assets.ps1, docs-Spiegel und Versionsmetadaten. Native Änderung: ausschließlich Export-Whitelist in MainActivity.kt. Tests und CI: vier neue Testdateien und verify-web-sync.yml. APK/HTML/Prüfbericht werden versioniert archiviert; bestehende Releases bleiben erhalten.

APK: https://parip69.github.io/RechenGuruLGI_AndroidAPK/MatheKids-v211.apk?v=211
SHA-256: `345d5a08690e54a76922543750394b62caa3ad7df3295a2ef4c2f5dc132ac362`
