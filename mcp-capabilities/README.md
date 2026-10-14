# Capability Discovery und Feature Requests

Wiederverwendbarer MCP-Server für Mathe-Guru, Barcode-Scanner, Lianas Backwelt und weitere Anwendungen. Node.js ab Version 20, keine zusätzlichen Pakete. Der Server führt keine App-Funktion aus, ändert keinen Programmcode und besitzt keine Netzwerk-, Veröffentlichungs- oder Installationsschnittstelle.

## Start und MCP-Anbindung

```sh
node mcp-capabilities/server.mjs --catalog mcp-capabilities/catalog.json --store .feature-requests/requests.json
```

Der MCP-Client startet den Server als Unterprozess. Kommunikation: JSON-RPC über stdio mit einer JSON-Nachricht pro Zeile; stdout enthält ausschließlich Protokollantworten. Unterstützte Protokollversionen: 2024-11-05, 2025-03-26 und 2025-06-18. Kein HTTP-Listener und keine automatische Registrierung in einem fremden Client. In einer Codex-Konfiguration beispielsweise:

```toml
[mcp_servers.capability_features]
command = "node"
args = ["/ABSOLUTER/PROJEKTPFAD/mcp-capabilities/server.mjs", "--catalog", "/ABSOLUTER/PROJEKTPFAD/mcp-capabilities/catalog.json", "--store", "/ABSOLUTER/PROJEKTPFAD/.feature-requests/requests.json"]
```

Unter Windows entsprechend absolute Windows-Pfade verwenden. In TOML-Literalstrings mit einfachen Anführungszeichen müssen Backslashes nicht verdoppelt werden. Der Client muss die MCP-Konfiguration laden; allein das Git-Klonen aktiviert noch keinen Server. Persönliche Client-Konfigurationen werden durch dieses Projekt nicht überschrieben.

## Die fünf Tools

| Tool | Eingaben | Wirkung |
|---|---|---|
| `check_capability` | `application`, `function` | Geprüften Katalogstatus samt Belegen und Grenzen zurückgeben |
| `find_alternative` | `application`, `function` | Deklarierte und aktuell berechtigte Alternativen mit Einschränkungen liefern |
| `create_feature_request` | Anwendung, Funktion, Titel, Beschreibung, `desired_behavior`, optional Priorität, `confirmed: true` | Nach Benutzerbestätigung lokal speichern; exakte Dubletten zusammenführen |
| `list_feature_requests` | Optional Anwendung, Status, `limit`, `offset` | Standardmäßig offen/geplant/in Arbeit, mit explizitem Filter auch abgeschlossene Vorschläge |
| `get_feature_request_status` | `id` | Gespeicherten Vorschlag, Status, Verlauf und Umsetzungsbelege anzeigen |

Die KI konkretisiert den Wunsch zunächst in eine Capability-ID beziehungsweise einen eindeutigen Alias. Der Server rät nicht anhand ähnlicher Worte, dass eine Funktion vorhanden sei. Kein eindeutiger Treffer bedeutet bei unvollständigem Katalog `unknown`. Nach der Abfrage erklärt die KI den Status und Einschränkungen, prüft Alternativen und bietet gegebenenfalls einen Vorschlag an. Erst nach ausdrücklicher Bestätigung darf sie `confirmed: true` senden. Die Schnittstelle kann diese Bestätigung verlangen, aber nicht unabhängig überprüfen, ob ein fremder KI-Client die Unterhaltung wahrheitsgemäß wiedergibt.

Das Benutzerbeispiel „Hinweis und zweiter Versuch“ ist in Mathe-Guru bereits vorhanden. Der mitgelieferte Eintrag beschreibt die tatsächlich bestehende Hilfe **auf Nachfrage**, keine automatische Hinweisöffnung. Eine solche Erweiterung darf deshalb nicht fälschlich als neue fehlende Funktion dargestellt werden. Falls ausdrücklich automatische Hinweise gewünscht sind, ist dies ein eigener, zunächst zu prüfender Wunsch.

## Status und Beleglage

| Status | Aussage |
|---|---|
| `available` | Funktion laut aktuellem, belegtem Katalog vorhanden |
| `partially_available` | Teilfunktion vorhanden; konkrete Grenzen sind dokumentiert |
| `alternative_available` | Gewünschte Funktion nachweislich nicht implementiert; geprüfte Alternativen vorhanden |
| `not_implemented` | Expliziter aktueller Abwesenheitsbeleg oder vollständiges, aktuelles Inventar ohne diese Funktion |
| `permission_denied` | Bekannte fehlende Funktions-/Discovery-Berechtigung; kein Beleg einer fehlenden Implementierung |
| `unknown` | Fehlende, veraltete oder mehrdeutige Belege beziehungsweise unbekannte Berechtigung |

Dies ist ein Katalog-Adapter, kein universeller Laufzeit-Prober. Die Ausgabe enthält `basis: catalog_snapshot`, Quellen und Prüfdatum. Eine Abfrage belegt weder eine gerade erfolgreiche Ausführung noch den aktuellen Zustand eines entfernten Servers. Andere Anwendungen benötigen eigene, vom Betreiber geprüfte Inventare/Adapter. Die bloße Registrierung eines Anwendungsnamens reicht nicht aus. Unterscheidungen von HTTP 401/403 und fehlender Implementierung werden bei künftigen Live-Adaptern in `permissions`/`discovery_requires` abgebildet; ein solcher Live-Adapter ist hier noch nicht enthalten.

`catalog.json` enthält nur den belegten Mathe-Guru-Eintrag. Barcode-Scanner und Lianas Backwelt sind ausdrücklich unvollständig und unbekannt. Kataloge pro Projekt sind über `--catalog` austauschbar. Jeder Eintrag hat:

- `id`, optional Titel/Aliase/Beschreibung, `implementation`: `implemented`, `partial`, `absent` oder `unknown`.
- `verified_at` und `evidence`: Prüfdatum und nachvollziehbare Belege. Standardmäßig nach 30 Tagen unbekannt; Neustarten erneuert keine Belege. Beim Aktualisieren die Funktion tatsächlich prüfen.
- `requires`: benötigte Berechtigungsnamen. Die serverseitige Anwendungskonfiguration `permissions` enthält `true`, `false` oder keinen Wert für unbekannt. Der MCP-Aufrufer kann keine Berechtigungen erteilen.
- `limitations` bei Teilunterstützung, `alternatives` als andere Capability-IDs derselben Anwendung.
- Auf Anwendungsebene optional `discovery_requires` für die Berechtigung zur Bestandsaufnahme. Nur `inventory_complete: true` mit frischem Prüfdatum und Belegen erlaubt einen Abwesenheitsschluss bei unbekannter Capability-ID.

## Lokale Aufgabenliste und Dubletten

Der Speicherpfad ist vom Serverbetreiber festgelegt, nicht durch Tool-Aufrufe frei wählbar. `.feature-requests/requests.json` ist standardmäßig Git-ignoriert und liegt außerhalb von Pages und APK. Eine leere Liste wird erst beim bestätigten ersten Vorschlag angelegt. Codex kann die JSON-Datei später lesen; andere Rechner erhalten diese lokalen Wünsche nicht automatisch mit Git. Eine bewusste Übertragung oder der optionale Issue-Export ist getrennt zu autorisieren.

Gespeichert werden ID (`FR-UUID`), Titel, natürliche Beschreibung, Anwendung, Funktion, gewünschtes Verhalten, geprüfte Alternativen, Priorität, Status, Zeitstempel, Vorkommenszahl und Verlauf. Prioritäten: `niedrig`, `normal`, `hoch`, `kritisch`. Status: `offen`, `geplant`, `in_arbeit` (Anzeige „in Arbeit“), `umgesetzt`, `abgelehnt`.

Gleiche Anwendung, Funktion und gleiches gewünschtes Verhalten nach Unicode-/Großkleinschreibungs-/Leerzeichennormalisierung werden zusammengeführt. Titelvarianten bleiben erhalten; eine höhere Priorität wird übernommen und der bestehende Status geschützt. Ähnliche Texte erscheinen nur als `possible_duplicates`: Negationen, andere Zahlen oder widersprüchliche Ziele werden nicht automatisch gleichgesetzt.

Schreiben erfolgt mit exklusivem Lock und atomarem Dateiaustausch. Bei Parallelzugriff `storage_busy`: erneut versuchen. Nach einem Prozessabsturz darf ein verbliebener Lock erst nach Prüfung entfernt werden. Beschädigte Listen werden nicht zurückgesetzt oder überschrieben. Dateiberechtigungsfehler werden als `permission_denied` gemeldet, nicht als fehlende Implementierung.

## Optionaler Codex-/GitHub-Workflow

MCP kann den Umsetzungsstatus lesen, aber nicht verändern. Für eine ausdrücklich autorisierte Entwicklungsarbeit gibt es ein getrenntes CLI:

```sh
node mcp-capabilities/developer.mjs set-status .feature-requests/requests.json FR-ID geplant --authorized --reason "Explizit beauftragte Planung"
node mcp-capabilities/developer.mjs set-status .feature-requests/requests.json FR-ID umgesetzt --authorized --reason "Implementiert und geprüft" --proof proof.json
node mcp-capabilities/developer.mjs export-github .feature-requests/requests.json FR-ID
```

`FR-ID` durch die vollständige gespeicherte ID ersetzen. Für `umgesetzt` ist ein Belegobjekt mit `commit`, nichtleerer `tests`-Liste und `approval` erforderlich. Diese Angaben dokumentieren die Freigabe; das CLI führt keine Tests aus und überprüft nicht automatisch entfernte Commits. Es kann selbst keinen Code ändern oder veröffentlichen. `export-github` liefert lediglich Issue-Titel, Body und Labels als JSON. Keine automatische Issue-Erstellung, Tokenverwendung oder Netzwerkanfrage. Veröffentlichung und spätere Codeänderungen bleiben separate, ausdrücklich autorisierte Arbeitsabläufe.

## Tests

```sh
cd mcp-capabilities
npm test
```

Getestet werden Statusabgrenzung, veraltete Belege, fehlende Discovery-/Funktionsberechtigungen, Alternativen, Bestätigung, persistente Dubletten, Negationen, Filter, Locks, beschädigte Daten, Statusbelege und echter stdio-MCP-Handshake. Die Tests erzeugen Vorschläge ausschließlich in temporären Verzeichnissen. Keine automatische App-Installation oder produktive Änderung.
