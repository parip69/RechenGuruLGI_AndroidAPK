| Schritt | Status |
| --- | --- |
| Audit öffentliches 209 | HTTP 200, vollständige Datei byteidentisch, Zertifikat und Paketname geprüft |
| Historische Signaturen | 86 vorhandene APK-Dateien gültig, drei Zertifikatsgruppen; Details in apk-signature-audit.json |
| Ursprünglicher aktueller Schlüssel | Externer PrivateKeyEntry gefunden, Zertifikat passt, Release-Signierung erfolgreich |
| Gemeinsame Release-Struktur | Externe Umgebungsvariablen, Java 17 / Gradle 8.9 / AGP 8.7.3 / SDK 35, Windows-/Linux-Sync, getrennte Ausgaben |
| Release 210 | Erfolgreich gebaut, kein Debuggable, gleiche Signatur und App-ID wie 209, höhere Version, v1/v2/v3 geprüft |
| Schutzprüfungen | Gültige APK akzeptiert, fünf problematische APK-Fälle abgewiesen; Mathematik-Regression erfolgreich |
| Dokumentation | ANDROID_BUILD_SIGNING.md, sichere manuelle Schlüsselbereitstellung und Backup noch erforderlich |
| Veröffentlichung | Kompatibilität technisch belegt; Veröffentlichung und öffentlicher Download werden abschließend geprüft |

Keine Aufgaben-/UI-/Speicherlogik geändert. Keine echte Android-Installation, Windows-Ausführung oder Play-Protect-Prüfung. Keine Signaturänderung und kein neuer Schlüssel. Bestehende versionierte APKs bleiben erhalten.
