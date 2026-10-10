| Schritt | Status |
| --- | --- |
| Rückfrage bei neuer Realschulrunde entfernen | Erledigt: direkter Start, auch bei Wiederholung; Themenfortschritt unverändert |
| Lokale Speicherung und Offline-Verhalten prüfen | Erledigt: Browserprüfung mit lokal bereitgestellten Assets und gesperrtem Netzwerk; mehrere neue Runden ohne Dialog; Fortschritt, Einstellungen und laufende Aufgabe nach Reload erhalten |
| Version 203 bauen und archivieren | Erledigt: Build erfolgreich, Assets identisch, gültige bestehende Signatur, APK und eigenständige HTML-Datei archiviert |
| GitHub und öffentlichen Download prüfen | In Veröffentlichung |

Die APK lädt weiterhin `file:///android_asset/index.html` und nutzt DOM-Storage. Realschulaufgaben werden lokal erzeugt; es gibt keine Online-Speicherung der Realschuldaten. Updateprüfungen und Downloads benötigen weiterhin Internet.

Kein echter Android-Gerätetest. Der zusätzliche direkte file://-Test im verwalteten Chromium wurde durch dessen Administratorrichtlinie blockiert; die Richtlinie blieb unverändert.
