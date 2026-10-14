# Arbeitsablauf für Änderungen

Der Nutzer hat folgenden Ablauf für jede Änderung ausdrücklich autorisiert:

- Jede fertige Änderung mit einer neuen, fortlaufenden Version als geprüfte Release-APK bauen. Den vorhandenen Schlüssel von Version 209 beibehalten; niemals einen Ersatzschlüssel generieren. `scripts/build-release.ps1` und `scripts/verify-apk.ps1` verwenden.
- Web-Quelle bleibt `app/src/main/assets`; `docs` einschließlich Version, Cache und Open-Graph-Metadaten synchron halten.
- APK und HTML versioniert in `Privat` archivieren. Die neue APK auch als `docs/MatheKids-v<VERSION>.apk` und `docs/MatheKids-latest.apk` veröffentlichen; bisherige MatheGuru-Download-Adressen weiter bedienen.
- Änderungen samt APK auf GitHub hochladen und GitHub Pages prüfen. Danach den tatsächlich erreichbaren versionierten APK-Link zum Testen nennen. Diese Veröffentlichung ist bereits autorisiert; nicht jedes Mal erneut fragen.
- Teilen mit und ohne Einstellungen erhalten; das `#settings`-Fragment darf bei Weiterleitungen nicht verloren gehen.
- Build und APK-Signatur prüfen. Keine erfolgreiche Installation oder WhatsApp-Karte behaupten, wenn kein entsprechender Gerätetest erfolgt ist.
- Bestehende Dateien und Nutzeränderungen schützen; kein Force-Push. Keine Signierschlüssel oder Zugangsdaten veröffentlichen.

Cloud-Builds verwenden JDK 17, Android SDK 35 und den Gradle-Wrapper. Die vorbereitete Umgebung speichert Werkzeuge unter `/workspace/.cloud-tools`. Build-Ausgaben liegen jetzt plattformübergreifend im ignorierten `.release-build`, da `app/build` bereits getrackte historische Ausgaben enthält. PowerShell (`powershell` unter Windows, `pwsh` unter Linux) muss im PATH verfügbar sein. Signierung verwendet die ausdrücklich autorisierte Projektkopie oder externe Signierungsvariablen. Siehe `ANDROID_BUILD_SIGNING.md`.

## Gemeinsamer Signierungsweg für Windows und Cloud

- Am 13. Oktober 2026 hat der Nutzer nach ausdrücklicher Erklärung der öffentlichen Repository-Sichtbarkeit die Aufnahme des Originalschlüssels und seiner Build-Konfiguration ins Repository autorisiert. Diese Entscheidung ersetzt die bisherigen Vorgaben zur ausschließlich externen Speicherung. Nicht behaupten, dass dieser Schlüssel noch geheim oder ausschließlich in GitHub-Secrets liegt.
- Der vorhandene Originalschlüssel liegt in `android-signing/original.keystore`, die zugehörige Build-Konfiguration in `android-signing/signing.properties`. Niemals einen neuen oder abweichenden Schlüssel erzeugen. Der öffentliche Fingerabdruck und Paketname bleiben in `android-signing.json` festgelegt.
- Signierungsdateien dürfen ausschließlich in diesem separaten Root-Verzeichnis liegen: niemals unter `docs`, `Privat`, App-Assets, APK-Inhalten oder Download-Artefakten. Ihre Inhalte nicht in Chat oder Logs ausgeben.
- Windows/Cloud: `scripts/build-release.ps1` prüft den Originalfingerabdruck, baut mit dem Wrapper und prüft die tatsächliche APK. `sync_version_and_build.ps1` wählt die nächste freie Version. Externe Signierungsvariablen haben weiterhin Vorrang.
- Der optionale GitHub-Workflow verwendet vorhandene Environment-Secrets bevorzugt, andernfalls dieselbe Projektkopie. Er bleibt auf `main` und expliziten Workflow-Dispatch beschränkt. Die Übernahme in GitHub-Secrets ist aktuell nicht erfolgt; die GitHub-API ist aus dieser Cloud blockiert.
- Vor einem lokalen Build keine Quellen committen oder veröffentlichen. Erst nach erfolgreichem Build und Tests explizit die notwendigen Quellen, Signierungsdateien, Web-Spiegel und geprüften APK-/HTML-Archive committen und ohne Force-Push veröffentlichen.

# Info und weiterer Ausbau

## MCP-Fähigkeiten und Erweiterungswünsche

- Das unabhängige Modul `mcp-capabilities` stellt fünf MCP-Tools bereit. Es führt keine App-Funktionen aus und ändert/veröffentlicht/installiert keinen Programmcode.
- Funktionsauskünfte nur aus dem geprüften Katalog ableiten. Unvollständige, veraltete oder mehrdeutige Daten bedeuten unbekannt. Fehlende Berechtigung bedeutet niemals fehlende Implementierung.
- Vorschläge ausschließlich nach ausdrücklicher Benutzerbestätigung speichern. Lokale Aufgabenliste: `.feature-requests/requests.json`, standardmäßig nicht mit Git synchronisiert und niemals automatisch über Pages veröffentlichen.
- Codex kann diese Liste im ausdrücklich autorisierten Entwicklungsworkflow lesen. Ein offener Vorschlag allein autorisiert keine Umsetzung. Statusänderungen erfolgen über das getrennte Entwickler-CLI; umgesetzt erfordert dokumentierte Commit-, Test- und Freigabebelege.
- Neue Anwendungsadapter müssen ihre Funktionsermittlung und Berechtigungsabgrenzung belegen. Ein Anwendungsname im Katalog ist kein Nachweis vorhandener Funktionen. GitHub-Export erzeugt nur Daten und keine Issues.
- Modulprüfungen: in `mcp-capabilities` `npm test` ausführen. Sie benötigen Node.js >=20 und keine zusätzlichen Pakete. Persönliche MCP-Client-Konfiguration nicht ohne Auftrag ändern.

- Jede neue oder geänderte Aufgabenfamilie muss in der anklickbaren, zum Schulbereich passenden App-Info berücksichtigt werden. Den Realschul-Themenkatalog aus den aktiven Generatoren erzeugen, damit die Info automatisch mitwächst.
- Aussagen über viele Übungsmöglichkeiten mit unterschiedlichen erzeugten Aufgabenstellungen belegen. Übungsvarianten nicht als komplette Prüfungen oder vollständige Lehrplanabdeckung bezeichnen; keine unbelegte Prozentzahl nennen.
- Standardwerte, lokale Speicherung und bewusstes Teilen erhalten. Änderungen an der Grundschul-Auswahl zunächst mit einem konkreten Vorschlag zur Bedienung besprechen. Erste und zweite Zahl müssen weiter getrennt einstellbar bleiben.
- Freies Zeichnen/Konstruieren und dessen Platzbedarf vor einer Implementierung besprechen. Nach Version 209 zunächst eine Bedienbarkeits-Testphase anstreben; keine weiteren Generatoren allein zur Vergrößerung der Anzahl hinzufügen.

# Grundschul-Erweiterungen ab Version 211

- Rechenketten: 2–10 Zahlen, frei kombinierbare Plus/Minus/Mal/Geteilt-Auswahl, Punkt vor Strich, ganzzahlige nichtnegative Ergebnisse. Alle Zahlen und jeder Zwischenschritt müssen die gewählte Grenze einhalten.
- Gemischte Malaufgaben: Typen A–F aus dem Nutzerauftrag; gewählte Einmaleinsreihen/Zahlenprofile verwenden, bekannte Reihe bei fehlenden Faktoren sichtbar lassen, unbekannte Zahl eindeutig lösbar. Schwere Aufgaben enthalten kombinierte Lücken und Klammern.
- Standardwerte und gespeicherte Profile der bisherigen Aufgabenarten schützen. Beimischen per Checkbox derzeit bei Mal, Mal/Geteilt und Alle Rechenarten mit „Ergebnis fehlt“ und ohne Blitzmodus; andere Formate behalten ihr bisheriges Verhalten.
- Neue Aufgabenarten auch in RG_SHARE_MODES, App-Info, Service-Worker-Cache, Web-Sync und portablem HTML-Export berücksichtigen. Die native Export-Whitelist bleibt auf ausdrücklich erlaubte Asset-Dateien begrenzt.
- Papier-Rechenweg: einzelne Produktrechnungen sind getrennte Gleichungen, keine falsche Gleichheitskette zwischen unterschiedlichen Produkten. Nächster Hinweis gibt Schritte auf Nachfrage frei; vollständiger Rechenweg nur auf ausdrücklichen Druck.
- Automatische Generator- und Browserprüfungen liegen unter tests/rechenketten* und tests/gemischte-malaufgaben*.
