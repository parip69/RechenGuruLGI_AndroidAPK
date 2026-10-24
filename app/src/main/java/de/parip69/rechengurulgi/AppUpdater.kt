package de.parip69.rechengurulgi

import android.app.Activity
import android.app.AlertDialog
import android.app.DownloadManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import androidx.core.content.FileProvider
import java.io.File
import java.security.MessageDigest

/** System-managed download survives backgrounding/process death; installation needs user approval. */
internal class AppUpdater(
    private val activity: Activity,
    private val status: (String, String, Boolean) -> Unit
) {
    private val prefs = activity.getSharedPreferences("apkUpdate", Context.MODE_PRIVATE)
    private val downloads = activity.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
    private val handler = Handler(Looper.getMainLooper())
    private var resumed = false
    private var installerPermissionDialog: AlertDialog? = null
    private val poll = object : Runnable {
        override fun run() {
            if (!resumed) return
            checkDownload()
            if (prefs.getBoolean("pending", false)) handler.postDelayed(this, 1000)
        }
    }

    fun resume() {
        resumed = true
        if (prefs.getBoolean("permission", false)) {
            prefs.edit().putBoolean("permission", false).apply()
            if (canInstall()) installDownloaded() else fail("Die Installation wurde noch nicht erlaubt. Tippe erneut auf Jetzt installieren, um fortzufahren.", false)
        }
        handler.removeCallbacks(poll)
        handler.post(poll)
    }

    fun pause() {
        resumed = false
        handler.removeCallbacks(poll)
    }

    fun destroy() {
        pause()
        installerPermissionDialog?.dismiss()
    }

    fun start(version: Int) {
        if (version <= installedVersion()) {
            fail("Diese Version ist nicht neuer als die installierte App.", false)
            return
        }
        try {
            val previousId = prefs.getLong("id", -1)
            if (prefs.getInt("version", 0) != version || previousId == -1L) {
                if (previousId != -1L) downloads.remove(previousId)
                val file = updateFile(version)
                file.parentFile?.mkdirs()
                if (file.exists() && !file.delete()) error("Die alte Update-Datei konnte nicht entfernt werden.")
                val request = DownloadManager.Request(downloadUri(version))
                    .setTitle("Mathe Kids aktualisieren")
                    .setDescription("Version $version wird heruntergeladen")
                    .setMimeType("application/vnd.android.package-archive")
                    .setAllowedOverMetered(true)
                    .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                    .setDestinationUri(Uri.fromFile(file))
                val id = downloads.enqueue(request)
                prefs.edit().putLong("id", id).putInt("version", version).apply()
            }
            prefs.edit().putBoolean("pending", true).putBoolean("permission", false).apply()
            status("Update wird heruntergeladen", "Der Download läuft im Hintergrund. Danach öffnet sich die Android-Installation automatisch, sobald Mathe Kids im Vordergrund ist.", false)
            handler.removeCallbacks(poll)
            handler.post(poll)
        } catch (_: Exception) {
            fail("Der Update-Download konnte nicht gestartet werden. Bitte prüfe die Internetverbindung und den freien Speicher und versuche es erneut.")
        }
    }

    private fun checkDownload() {
        if (!prefs.getBoolean("pending", false)) return
        try {
            downloads.query(DownloadManager.Query().setFilterById(prefs.getLong("id", -1))).use { cursor ->
                if (cursor == null || !cursor.moveToFirst()) {
                    fail("Der Download ist nicht mehr vorhanden. Bitte starte das Update erneut.")
                    return
                }
                when (cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS))) {
                    DownloadManager.STATUS_SUCCESSFUL -> {
                        prefs.edit().putBoolean("pending", false).apply()
                        installDownloaded()
                    }
                    DownloadManager.STATUS_FAILED -> fail("Der Download ist fehlgeschlagen. Bitte prüfe die Verbindung und den Speicher und starte das Update erneut.")
                    else -> {
                        val bytes = cursor.getLong(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR))
                        val total = cursor.getLong(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_TOTAL_SIZE_BYTES))
                        val progress = if (total > 0) " (${(bytes * 100 / total).coerceIn(0, 100)} %)" else ""
                        status("Update wird heruntergeladen$progress", "Du musst keine Datei suchen. Nach dem Download öffnet sich die Android-Installation. Bei unterbrochener Verbindung wartet Android auf die Fortsetzung.", false)
                    }
                }
            }
        } catch (_: Exception) {
            fail("Der Downloadstatus konnte nicht gelesen werden. Bitte starte das Update erneut.")
        }
    }

    @Suppress("DEPRECATION")
    private fun installedVersion(): Long = activity.packageManager.getPackageInfo(activity.packageName, 0).let {
        if (Build.VERSION.SDK_INT >= 28) it.longVersionCode else it.versionCode.toLong()
    }

    private fun updateFile(version: Int): File {
        val root = activity.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS)
            ?: error("Der Update-Speicher ist nicht verfügbar.")
        return File(root, "updates/MatheKids-v$version.apk")
    }

    @Suppress("DEPRECATION")
    private fun verify(file: File, version: Int) {
        require(file.isFile && file.length() > 0) { "Die Update-Datei fehlt oder ist leer." }
        val flags = if (Build.VERSION.SDK_INT >= 28) PackageManager.GET_SIGNING_CERTIFICATES else PackageManager.GET_SIGNATURES
        val archive = activity.packageManager.getPackageArchiveInfo(file.absolutePath, flags)
            ?: error("Der Download ist keine gültige Android-App.")
        val code = if (Build.VERSION.SDK_INT >= 28) archive.longVersionCode else archive.versionCode.toLong()
        require(archive.packageName == activity.packageName && code == version.toLong() && code > installedVersion()) {
            "Die Update-Datei gehört nicht zur erwarteten neuen Mathe-Kids-Version."
        }
        val signatures = if (Build.VERSION.SDK_INT >= 28) archive.signingInfo?.apkContentsSigners else archive.signatures
        require(signatures?.size == 1 && fingerprint(signatures[0].toByteArray()) == ORIGINAL_CERTIFICATE) {
            "Die Update-Signatur stimmt nicht mit der Original-App überein."
        }
    }

    private fun canInstall() = Build.VERSION.SDK_INT < 26 || activity.packageManager.canRequestPackageInstalls()

    private fun installDownloaded() {
        try {
            val version = prefs.getInt("version", 0)
            val file = updateFile(version)
            verify(file, version)
            if (!canInstall()) {
                status("Installation erlauben", "Erlaube Android einmalig die Installation von Updates durch Mathe Kids. Danach geht es hier automatisch weiter.", false)
                installerPermissionDialog?.dismiss()
                installerPermissionDialog = AlertDialog.Builder(activity)
                    .setTitle("Mathe-Kids-Update installieren")
                    .setMessage("Android benötigt einmalig die Erlaubnis „Aus dieser Quelle zulassen“. Danach öffnet Mathe Kids die heruntergeladene APK direkt zur Installation.")
                    .setPositiveButton("Erlauben") { _, _ ->
                        try {
                            prefs.edit().putBoolean("permission", true).apply()
                            activity.startActivity(Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:${activity.packageName}")))
                        } catch (_: Exception) {
                            prefs.edit().putBoolean("permission", false).apply()
                            fail("Die Android-Einstellung konnte nicht geöffnet werden. Bitte erlaube Mathe Kids unter „Unbekannte Apps installieren“ und versuche es erneut.", false)
                        }
                    }
                    .setNegativeButton("Später") { _, _ -> fail("Die APK ist bereit. Tippe erneut auf Jetzt installieren, wenn du fortfahren möchtest.", false) }
                    .setOnCancelListener { fail("Die APK ist bereit. Die Installation kann später erneut gestartet werden.", false) }
                    .show()
                return
            }
            val uri = FileProvider.getUriForFile(activity, "${activity.packageName}.provider", file)
            val intent = Intent(Intent.ACTION_VIEW).setDataAndType(uri, "application/vnd.android.package-archive")
                .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            activity.startActivity(intent)
            status("Android-Installation geöffnet", "Bestätige jetzt die Installation im Android-Fenster. Deine bisherigen App-Daten bleiben bei diesem Update erhalten.", false)
        } catch (error: Exception) {
            fail(error.message ?: "Die Installation konnte nicht geöffnet werden. Bitte starte das Update erneut.")
        }
    }

    private fun fail(message: String, discard: Boolean = true) {
        prefs.edit().putBoolean("pending", false).apply()
        if (discard) {
            val id = prefs.getLong("id", -1)
            if (id != -1L) runCatching { downloads.remove(id) }
            prefs.edit().remove("id").apply()
        }
        status("Update nicht abgeschlossen", message, true)
    }

    companion object {
        const val ORIGINAL_CERTIFICATE = "3e3a9ad569b2e7abb9f8f77ea3e765832c81e2505f38a41f36be49f5ca79c4bc"
        fun downloadUri(version: Int): Uri {
            require(version > 0)
            return Uri.parse("https://parip69.github.io/RechenGuruLGI_AndroidAPK/MatheKids-v$version.apk?update-check=apk")
        }
        fun fingerprint(bytes: ByteArray): String = MessageDigest.getInstance("SHA-256").digest(bytes).joinToString("") { "%02x".format(it) }
    }
}
