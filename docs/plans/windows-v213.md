# Version 213: geprüfter Windows-Build

Am 13. Oktober 2026 wurde der geprüfte Cloud-Stand von `origin/main` in den Windows-Hauptordner übernommen. Die vorherigen lokalen Vorbereitungen bleiben als Git-Stash und zusätzlich als lokale Sicherung erhalten. Bereits veröffentlichte App-Änderungen wurden nicht erneut angewendet.

`sync_version_and_build.bat` baut Version 213 lokal mit JDK 17, Android SDK/Build Tools 35 und Gradle Wrapper 8.9. Verwendet wird die ausdrücklich gewählte Projektkopie des Originalschlüssels; dessen Zertifikat stimmt mit Version 212 überein. Keystore-/Passwortwerte wurden nicht in Logs oder Chat ausgegeben und nicht in APK, Web-Quelle oder Download-Artefakte kopiert.

Die APK-Prüfung verwendet bei fehlenden SDK-Umgebungsvariablen nun dieselbe ignorierte `local.properties` wie Gradle. Dadurch funktioniert der VS-Code-Build auch in einem Terminal ohne `ANDROID_HOME`, sofern der lokale SDK-Pfad korrekt eingerichtet ist. Externe SDK-Variablen behalten Vorrang; globale Einstellungen werden nicht verändert.

Prüfungen: Release-Build einschließlich `lintVitalRelease` erfolgreich, Originalzertifikat/Paket/Version 213 und v1/v2/v3-Signaturen gültig, nicht debuggable. Alle 39 Generator-/Zustandsprüfungen bestanden. Die Signaturprüfung ohne SDK-Umgebungsvariablen funktioniert. Kein Android-Installationstest durchgeführt.

APK SHA-256: `e3d067b6fd9f4f01630ac09b6f64c3364daf7995b81acaf17d34aa77e26531c5`.
