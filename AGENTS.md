# Arbeitsablauf für Änderungen

Der Nutzer hat folgenden Ablauf für jede Änderung ausdrücklich autorisiert:

- Jede fertige Änderung mit einer neuen, fortlaufenden Version als geprüfte Release-APK bauen. Den vorhandenen Schlüssel von Version 209 beibehalten; niemals einen Ersatzschlüssel generieren. `scripts/build-release.ps1` und `scripts/verify-apk.ps1` verwenden.
- Web-Quelle bleibt `app/src/main/assets`; `docs` einschließlich Version, Cache und Open-Graph-Metadaten synchron halten.
- APK und HTML versioniert in `Privat` archivieren. Die neue APK auch als `docs/MatheKids-v<VERSION>.apk` und `docs/MatheKids-latest.apk` veröffentlichen; bisherige MatheGuru-Download-Adressen weiter bedienen.
- Änderungen samt APK auf GitHub hochladen und GitHub Pages prüfen. Danach den tatsächlich erreichbaren versionierten APK-Link zum Testen nennen. Diese Veröffentlichung ist bereits autorisiert; nicht jedes Mal erneut fragen.
- Teilen mit und ohne Einstellungen erhalten; das `#settings`-Fragment darf bei Weiterleitungen nicht verloren gehen.
- Build und APK-Signatur prüfen. Keine erfolgreiche Installation oder WhatsApp-Karte behaupten, wenn kein entsprechender Gerätetest erfolgt ist.
- Bestehende Dateien und Nutzeränderungen schützen; kein Force-Push. Keine Signierschlüssel oder Zugangsdaten veröffentlichen.

Cloud-Builds verwenden JDK 17, Android SDK 35 und den Gradle-Wrapper. Die vorbereitete Umgebung speichert Werkzeuge unter `/workspace/.cloud-tools`. Build-Ausgaben liegen jetzt plattformübergreifend im ignorierten `.release-build`, da `app/build` bereits getrackte historische Ausgaben enthält. PowerShell (`powershell` unter Windows, `pwsh` unter Linux) muss im PATH verfügbar sein. Externe Signierungsvariablen und Schlüssel werden sicher bereitgestellt; keine Schlüsseldatei ins Repository kopieren. Siehe `ANDROID_BUILD_SIGNING.md`.

# Info und weiterer Ausbau

- Jede neue oder geänderte Aufgabenfamilie muss in der anklickbaren, zum Schulbereich passenden App-Info berücksichtigt werden. Den Realschul-Themenkatalog aus den aktiven Generatoren erzeugen, damit die Info automatisch mitwächst.
- Aussagen über viele Übungsmöglichkeiten mit unterschiedlichen erzeugten Aufgabenstellungen belegen. Übungsvarianten nicht als komplette Prüfungen oder vollständige Lehrplanabdeckung bezeichnen; keine unbelegte Prozentzahl nennen.
- Standardwerte, lokale Speicherung und bewusstes Teilen erhalten. Änderungen an der Grundschul-Auswahl zunächst mit einem konkreten Vorschlag zur Bedienung besprechen. Erste und zweite Zahl müssen weiter getrennt einstellbar bleiben.
- Freies Zeichnen/Konstruieren und dessen Platzbedarf vor einer Implementierung besprechen. Nach Version 209 zunächst eine Bedienbarkeits-Testphase anstreben; keine weiteren Generatoren allein zur Vergrößerung der Anzahl hinzufügen.
