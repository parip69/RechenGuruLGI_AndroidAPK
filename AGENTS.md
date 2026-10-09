# Arbeitsablauf für Änderungen

Der Nutzer hat folgenden Ablauf für jede Änderung ausdrücklich autorisiert:

- Jede fertige Änderung mit einer neuen, fortlaufenden Version als Debug-APK bauen.
- Web-Quelle bleibt `app/src/main/assets`; `docs` einschließlich Version, Cache und Open-Graph-Metadaten synchron halten.
- APK und HTML versioniert in `Privat` archivieren. Die neue APK auch als `docs/MatheKids-v<VERSION>.apk` und `docs/MatheKids-latest.apk` veröffentlichen; bisherige MatheGuru-Download-Adressen weiter bedienen.
- Änderungen samt APK auf GitHub hochladen und GitHub Pages prüfen. Danach den tatsächlich erreichbaren versionierten APK-Link zum Testen nennen. Diese Veröffentlichung ist bereits autorisiert; nicht jedes Mal erneut fragen.
- Teilen mit und ohne Einstellungen erhalten; das `#settings`-Fragment darf bei Weiterleitungen nicht verloren gehen.
- Build und APK-Signatur prüfen. Keine erfolgreiche Installation oder WhatsApp-Karte behaupten, wenn kein entsprechender Gerätetest erfolgt ist.
- Bestehende Dateien und Nutzeränderungen schützen; kein Force-Push. Keine Signierschlüssel oder Zugangsdaten veröffentlichen.

Cloud-Builds verwenden JDK 17, Android SDK 35 und den Gradle-Wrapper. Die vorbereitete Umgebung speichert Werkzeuge unter `/workspace/.cloud-tools`. Build-Ausgaben mit `/workspace/.cloud-tools/build-dir.init.gradle` außerhalb des Checkouts ablegen, da `app/build` bereits getrackte Ausgaben enthält. Die Windows-Sync-Tasks bei Linux-Builds ausschließen und die Web-Synchronisation vor dem Build separat durchführen.
