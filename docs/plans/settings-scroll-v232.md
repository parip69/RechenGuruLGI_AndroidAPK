# Version 232: Android-Scrollschutz und verständliche 10er-Sperre

## Befund und Korrektur

Version 230 schloss die Einstellungsdialoge vom JavaScript-Pull-to-Refresh im mobilen Browser aus. Im Android-Wrapper blieb eine zweite Geste aktiv: Das äußere SwipeRefreshLayout prüfte ausschließlich WebView.canScrollVertically(-1). Diese Methode sieht den inneren DOM-Scrollbereich des Dialogs nicht. Am Seitenanfang konnte der native Rahmen deshalb Wischbewegungen des Dialogs abfangen.

Die lokale App-Seite meldet nun Öffnen und Schließen des Einstellungsdialogs über setSettingsDialogOpen an den Wrapper. Solange er geöffnet ist, wird die native Wisch-Aktualisierung zurückgesetzt und ausgeschaltet. Schließen, Escape und Üben geben sie wieder frei; auch das native Dialog-close-Ereignis wird berücksichtigt. Nur die gebündelte lokale App-Seite darf diese neue Brücke verwenden. Der normale Seiten-Refresh bleibt außerhalb des Dialogs erhalten. Dafür ist die neue native APK erforderlich; ein reines Pages-Update einer alten APK kann diesen Rahmen nicht ändern.

Die ausgegraute 10er-Reihe stammt aus dem vorhandenen gespeicherten Profil „Kleines 1×1 (1–9)“. Dieses Verhalten war beabsichtigt, aber der Grund wurde durch die eingeklappte Profilauswahl unverständlich. Neben den Reihen wird die Sperre nun kurz erklärt. „1×1 bis 10 verwenden“ wechselt nach ausdrücklichem Tippen zum bereits vorhandenen Profil mit 10er-Reihe. Öffnen der Einstellungen allein verändert weder Profil noch Standards. Die Sperre erhält zusätzlich aria-disabled und einen Verweis auf den Grund.

Keine Generatoren, Ergebnisgrenzen, Einmaleinsvorgaben oder gespeicherten Standardwerte wurden geändert. Die Aufgabenprofile behalten das vorhandene Speicherformat.

## Ausgeführte Prüfungen

- 15 lokale Android-Prüfungen bestanden (Robolectric): 13 vorhandene Updater-Prüfungen und zwei neue Prüfungen mit der tatsächlichen MainActivity und SwipeRefreshLayout. MotionEvents reproduzieren die abfangende äußere Wischgeste bei WebView-Seitenanfang. Mit geöffnetem Dialog wird sie wiederholt nicht abgefangen; nach Schließen ist normaler Seiten-Refresh möglich. Eine fremde Webseite darf den Zustand nicht ändern. Dies simuliert Android und ersetzt keinen Gerätetest.
- Neuer Browsertest positions-android-settings-ui bestanden: Brückenzustand in allen 15 Aufgabenmodi, Schließen/Escape/Üben, sichtbarer Grund der 10er-Sperre, keine automatische Profiländerung, explizites Freigeben, echte Aufgaben aus der 10er-Reihe innerhalb der Grenze und Wiederherstellung nach Neuladen.
- Bestehender positions-ui-Test bestanden: Positionsfelder, eigene Bereiche, Profile, Sonderaufgaben und responsive Darstellung.
- Alle 57 JavaScript-Unitprüfungen bestanden.
- Keine physische Android-/Samsung-Prüfung durchgeführt.
- Bestehender positions-scroll-ui-Test bestanden: echte Chromium-Wischgesten in beide Richtungen und Richtungswechsel am oberen Rand in allen 15 Aufgabenmodi, ohne abgefangene Browser-Aktualisierung im Dialog. Außerhalb des Dialogs bleibt sie aktiv.

## Release-Prüfung

232 mit Release-Lint gebaut. Paket de.parip69.rechengurulgi und Originalzertifikat unverändert; nicht debuggable, gültige v1/v2/v3-Signaturen. Alle fünf APK-Ablehnungsprüfungen bestanden. 25 Web-Assets zwischen Quelle, docs und APK byteidentisch; sechs APK-Kopien sowie das normalisierte HTML-Archiv geprüft.

APK-SHA-256: `88391a6af04c4738647c372dd8f9e14f5ac746e11da43a8f83191edf4f45af6d`.

Pages-Abruf aus dieser Cloud weiterhin mit CONNECT HTTP 403 blockiert. Keine bestätigte Pages-Auslieferung, kein behaupteter Geräte-Update-Erfolg. GitHub-Upload und öffentlicher GitHub-APK-Download werden gesondert geprüft.
