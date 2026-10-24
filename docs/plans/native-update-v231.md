# Version 231: APK herunterladen und direkt zur Installation öffnen

## Ablauf

„Jetzt installieren“ nutzt im neuen Android-Wrapper den System-DownloadManager statt eines externen Browserlinks. Android lädt die versionierte Pages-APK im Hintergrund in den eigenen Update-Ordner von Mathe Kids. Fortschritt und Fehler erscheinen im vorhandenen Updatefenster; dieses kann während des Downloads geschlossen werden. Download-ID und Zielversion bleiben lokal erhalten. Ein neuer Aufruf derselben Version legt keinen zweiten Download an. Nach App-Rückkehr bzw. Prozessneustart wird der Status wieder aufgenommen. Ist die App im Hintergrund, wartet das Öffnen des Installers auf ihre Rückkehr in den Vordergrund.

Vor dem Installer-Aufruf werden gültige APK-Metadaten, Paketname, erwartete höhere Version und das ursprüngliche Zertifikat geprüft. Android selbst prüft bei der Installation zusätzlich die APK-Integrität und Update-Kompatibilität. FileProvider übergibt die Datei mit temporärer Leseberechtigung an den Android-Installer. Es ist keine Dateisuche erforderlich. Fehler und fehlende/ungültige Downloads können erneut versucht werden.

Ab Android 8 kann einmalig die Freigabe „Aus dieser Quelle zulassen“ für Mathe Kids nötig sein. Ein Dialog führt direkt zur passenden Android-Einstellung; nach der Rückkehr wird erneut geprüft und die Installation fortgesetzt. Ablehnen erzeugt keine Endlosschleife und löscht die bereits geladene gültige APK nicht. Die abschließende Installationsbestätigung bleibt eine Android-Benutzeraktion. Eine stille Hintergrundinstallation wird nicht behauptet.

Neue Berechtigung: REQUEST_INSTALL_PACKAGES. Keine neue Speicherberechtigung, kein Ersatzschlüssel. Die privilegierte Download-Brücke akzeptiert nur eine positive ganze Versionsnummer und wird nur für die gebündelte lokale App-Seite ausgeführt; Host und APK-Pfad sind fest. Browser/PWA sowie ältere Android-Wrapper behalten ihren bestehenden Weg.

Die neue native Funktion muss einmal über die Installation von Version 231 ins Gerät gelangen. Eine bereits installierte Version 229/230 enthält weiterhin ihren alten Browser-Download. Erst zukünftige Updates aus 231 heraus verwenden den neuen nativen Ablauf. Nicht deinstallieren; bestehende Paketkennung und Signatur erlauben das normale Update mit erhaltenen App-Daten.

## Tatsächlich ausgeführte Prüfungen

- 13 lokale Android-Tests unter Robolectric bestanden (API 28 und zusätzlich API 24): veraltete Version abweisen, persistenter/einmaliger Download, fehlender und fehlgeschlagener Download mit Wiederholung, festes HTTPS-Ziel, Installer-Intent mit content-URI und temporärem Lesezugriff, Freigabe-Einstellung und Rückkehr, Ablehnung ohne Schleife, ungültige APK sowie falsche Paket-/Versions-/Zertifikatsdaten abweisen. Paketmanager und Systemdownload werden hier simuliert; dies ist kein echter Geräte-Download oder Installationstest.
- Öffentliches Zertifikat als Test-Fixture; keine privaten Test-Schlüssel. Die vorhandene Datei-Provider-Konfiguration wird im Test verwendet. AndroidX-Cache wird zwischen den unterschiedlichen temporären Robolectric-Dateiwurzeln geleert.
- Neuer Browsertest native-update-ui bestanden: native Brücke statt Browser, Fortschritt, Fehler/Wiederholen, Installerhinweis und Rückfall für alte Wrapper.
- Bestehende Browserdateien positions-ui und positions-sharing-ui bestanden: Einstellungen, Sonderaufgaben, Profile, responsive Darstellung, Teilen/Import und portables HTML bleiben funktionsfähig.
- Alle 57 bestehenden JavaScript-Unitprüfungen bestanden.
- Der optionale signierte Build-Workflow führt künftig auch testReleaseUnitTest aus.
- Kein physischer Android-/Samsung-Installationstest durchgeführt. Keine erfolgreiche stille Installation behauptet.

Release-Build, Originalsignatur und öffentliche Download-Datei werden vor Abschluss separat geprüft. Direkter Zugriff auf parip69.github.io ist in dieser Cloud weiterhin eingeschränkt; der Pages-/Auto-Update-Erfolg darf nur bei tatsächlich erfolgreicher Prüfung behauptet werden.

## Lokale Release-Prüfung

Release 231 einschließlich Release-Lint erfolgreich gebaut; Paket de.parip69.rechengurulgi, Originalzertifikat SHA-256 3e3a9ad569b2e7abb9f8f77ea3e765832c81e2505f38a41f36be49f5ca79c4bc, nicht debuggable, v1/v2/v3 gültig. Der APK-Prüfer akzeptiert die Release-Datei und weist alle fünf Schutzfälle einschließlich einer manipulierten APK zurück. Alle 25 Web-Assets stimmen zwischen finaler APK, Quelle und docs überein; sechs APK-Kopien sind byteidentisch. Test-Zertifikatsfixture wird nicht in die APK verpackt.

APK-SHA-256: `55a6fc0bf1eb46b0dcf07d652a318473ab1f90dc28ef5c17539274c931637cc5`.

Pages-Abfrage in dieser Cloud: CONNECT HTTP 403. Ein erfolgreicher Pages-Download oder Update auf einem echten Gerät ist daher nicht bestätigt.
