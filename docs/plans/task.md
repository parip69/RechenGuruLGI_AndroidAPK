| Schritt | Status |
| --- | --- |
| Audit öffentliches 209 | HTTP 200, vollständige Datei byteidentisch, Zertifikat und Paketname geprüft |
| Historische Signaturen | 86 vorhandene APK-Dateien gültig, drei Zertifikatsgruppen; Details in apk-signature-audit.json |
| Ursprünglicher aktueller Schlüssel | Externer PrivateKeyEntry gefunden, Zertifikat passt, Release-Signierung erfolgreich |
| Gemeinsame Release-Struktur | Externe Umgebungsvariablen, Java 17 / Gradle 8.9 / AGP 8.7.3 / SDK 35, Windows-/Linux-Sync, getrennte Ausgaben |
| Release 210 | Erfolgreich gebaut, kein Debuggable, gleiche Signatur und App-ID wie 209, höhere Version, v1/v2/v3 geprüft |
| Schutzprüfungen | Gültige APK akzeptiert, fünf problematische APK-Fälle abgewiesen; Mathematik-Regression erfolgreich |
| Dokumentation | ANDROID_BUILD_SIGNING.md, sichere manuelle Schlüsselbereitstellung und Backup noch erforderlich |
| Veröffentlichung | APK 210 auf main; alle vier geprüften GitHub-Läufe erfolgreich (APK-Prüfung, abhängiges Pages-Deployment, Web-Sync, bisherige Pages-Auslieferung); öffentliche APK und alle Download-Aliase HTTP 200 und byteidentisch |

Keine Aufgaben-/UI-/Speicherlogik geändert. Keine echte Android-Installation, Windows-Ausführung oder Play-Protect-Prüfung. Keine Signaturänderung und kein neuer Schlüssel. Bestehende versionierte APKs bleiben erhalten.

APK: https://parip69.github.io/RechenGuruLGI_AndroidAPK/MatheKids-v210.apk?v=210
Datei-SHA-256: `4c1678985a2e2a4bda151b9cfd01c9a3eef5dd3d8a18e305291c9e0186078d82`
Zertifikat-SHA-256: `3e3a9ad569b2e7abb9f8f77ea3e765832c81e2505f38a41f36be49f5ca79c4bc`

Geprüfte CI-Läufe des Commit be916c9: 38074632274, 38074632250, 38074632225, 38074632078. Die anschließende Aktualisierung dieses Prüfprotokolls ändert keine APK oder Build-Logik.
Manuell: Originalschlüssel sicher sichern und auf Windows bereitstellen; Signierungsvariablen sicher setzen; Pages-Quelle GitHub Actions wählen, damit kein unabhängiger Branch-Deployment-Weg die Freigabeprüfung umgeht; echten Update-/Datenerhaltungstest durchführen.
