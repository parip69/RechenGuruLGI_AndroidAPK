| Schritt | Status |
| --- | --- |
| Vorhandene Grundschul-Komponenten prüfen | Erledigt: Modusprofile, Reihenwahl, Schwierigkeit, Prüfung, Fehlerliste, Teilen und Export verwendet |
| Rechenketten | Erledigt: 2–10 Zahlen, beliebige Zeichenkombinationen, begrenzte Zahlen/Zwischenergebnisse, manueller Weiter-Knopf |
| Gemischte Malaufgaben A–F | Erledigt: sechs Typen, gewählte Reihen, eindeutige Lücken, schwere Klammern, einzeln oder per Checkbox beimischen |
| Bedienung und Hilfe | Erledigt: gruppierte Auswahlkarten, Prüfen/Hilfe/Nächste, aktuelle vollständige Zahlenwege im Vollbild |
| Daten und alte Funktionen | Erledigt: lokale Profile/Statistik/Fehlerliste erhalten, Teileregistrierung und portabler Export ergänzt, RS-Regression erfolgreich |
| Generatorprüfungen | Erledigt: 28 Testfälle, 12.490 generierte neue Testaufgaben, keine negativen oder übergroßen Zwischenwerte, eindeutige erwartete Antworten |
| Release-APK 211 | Erfolgreich gebaut, Version 211, gleicher Paketname und Zertifikat wie 209/210, nicht debuggable, gültige v1/v2/v3-Signaturen; fünf Ablehnungsprüfungen bestanden; APK-Assets byteidentisch mit Quelle/docs |
| GitHub und Pages | Erledigt: ef8eae5 auf main, alle vier Prüfläufe erfolgreich; APK und alte Download-Aliase HTTP 200, korrekter APK-Dateityp, byteidentisch; öffentliche HTML-Version 211 und neue Module geprüft |
| Phase 1 Baukasten: Quellstand | Erledigt: origin/main 471950b, Version 225; sauberer Checkout; Projektanweisungen und relevante Quellen geprüft |
| Phase 1 Baukasten: Bestandsaufnahme und Entwurf | Erledigt: docs/plans/2026-10-23-grundschule-baukasten-phase1.md; 16 Modi, Speicherung, Bedienung, Risiken, Dateien und Testplan |
| Phase 1 Baukasten: Ausgangstests | Erledigt: 39 Unitprüfungen, answer-sizing-ui und auto-next-ui bestanden; zwei ältere UI-Prüfungen scheitern an überholten Erwartungen zum Aufgabenwechsel |
| Phase 2 Baukasten: Umsetzung | Erledigt: Nutzerfreigabe umgesetzt; Konfiguration, Bibliothek, UI, Teilen/Export und Offline integriert; 56 Tests und 12 Browserdateien bestanden |
| Historische Ergänzung zu Version 211 | Ausführlicher Bericht: grundschule-v211.md. Kein echter Android-Gerätetest. Der bestehende Signierschlüssel bleibt außerhalb des Repositories. Privat/onboarding-build/ bleibt unangetastet. |
| Historische Ergänzung zu Version 211 | APK-SHA-256: `345d5a08690e54a76922543750394b62caa3ad7df3295a2ef4c2f5dc132ac362` |
| Historische Ergänzung zu Version 211 | Download: https://parip69.github.io/RechenGuruLGI_AndroidAPK/MatheKids-v211.apk?v=211 |
| Historische Ergänzung zu Version 211 | Bestätigte CI-Läufe: 38411945153, 38411944699, 38411944420, 38411943939. Der abschließende Bericht ändert keine App-Dateien oder APK. |
| Baukasten: Mathematik und Speicherung | 13 neue Prüfungen bestanden; vorhandene C.evaluate/C.generate wiederverwendet |
| Baukasten: Browser | Slots, Neustart, Kacheln, Vorschau, Löschrückfrage, Teilen, Sonderansichten und schmale/große Darstellung geprüft; abschließende Regression läuft |
| Baukasten: Originalsignierung | Projektprüfung und APK-225-Prüfung bestanden; Toolchain unter /workspace/.tools gefunden, JDK17/SDK35/Pwsh verwendbar |
| Baukasten: Abschlussprüfung | 56 Unitprüfungen und alle 12 Browserdateien erfolgreich; sechs Themes mit Kontrastprüfung; Sondergeneratoren unverändert |
| Baukasten: Release 226 | Intern gebaut, nicht veröffentlicht; Originalsignierung gültig; nach Kontrastkorrektur durch 227 abgelöst und unter .release-build/unpublished-v226 erhalten |
| Baukasten: Release 227 lokal | Erledigt: Release-Lint/Build, Originalsignatur, Paket, Version, v1/v2/v3, nicht debuggable, fünf APK-Ablehnungsfälle, 26 Assets und sechs Kopien geprüft; SHA-256 dba221d06196897b93b019efa07560655e70e1f3ff47b0fe4dad171443975267 |
| Baukasten: Veröffentlichung 227 | Blockiert: Cloud-Netzwerk verweigert parip69.github.io mit CONNECT/HTTP 403; Host-Freigabe angefragt. Noch kein Push, keine öffentlichen neuen Links oder echten Installationstests |
