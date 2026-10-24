package de.parip69.rechengurulgi

import android.app.Activity
import android.app.DownloadManager
import android.content.Context
import android.app.AlertDialog
import android.content.Intent
import android.content.pm.Signature
import android.content.pm.SigningInfo
import android.os.Build
import java.io.File
import org.robolectric.shadows.ShadowAlertDialog
import android.content.pm.PackageInfo
import android.os.Looper
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [28])
class AppUpdaterTest {
    private lateinit var activity: Activity
    private lateinit var updater: AppUpdater
    private val messages = mutableListOf<String>()
    private val prefs get() = activity.getSharedPreferences("apkUpdate", Context.MODE_PRIVATE)

    @Before fun setup() {
        activity = Robolectric.buildActivity(Activity::class.java).setup().get()
        shadowOf(activity.packageManager).installPackage(activity.packageManager.getPackageInfo(activity.packageName, android.content.pm.PackageManager.GET_PROVIDERS or android.content.pm.PackageManager.GET_META_DATA).apply {
            @Suppress("DEPRECATION")
            versionCode = 230
        })
        prefs.edit().clear().commit()
        // Robolectric uses a new external-files directory for each test; AndroidX
        // otherwise retains the previous test's FileProvider root in its static cache.
        androidx.core.content.FileProvider::class.java.getDeclaredField("sCache").apply {
            isAccessible = true
            (get(null) as MutableMap<*, *>).clear()
        }
        updater = AppUpdater(activity) { title, message, _ -> messages.add("$title $message") }
    }
    @After fun cleanup() { updater.destroy() }

    @Test fun olderVersionsNeverStartDownloads() {
        updater.start(230)
        assertEquals(-1L, prefs.getLong("id", -1))
        assertTrue(messages.last().contains("nicht neuer"))
    }

    @Test fun downloadIsQueuedOnceAndSurvivesNewController() {
        updater.start(231)
        val first = prefs.getLong("id", -1)
        assertTrue(first >= 0)
        updater.start(231)
        assertEquals(first, prefs.getLong("id", -1))
        updater.destroy()
        updater = AppUpdater(activity) { title, message, _ -> messages.add("$title $message") }
        updater.resume()
        shadowOf(Looper.getMainLooper()).idle()
        assertEquals(first, prefs.getLong("id", -1))
        assertTrue(prefs.getBoolean("pending", false))
    }

    @Test fun missingDownloadCanBeRetried() {
        updater.start(231)
        val downloads = activity.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
        val first = prefs.getLong("id", -1)
        downloads.remove(first)
        updater.resume()
        shadowOf(Looper.getMainLooper()).idle()
        assertFalse(prefs.getBoolean("pending", false))
        assertTrue(messages.last().contains("nicht mehr vorhanden"))
        updater.start(231)
        assertNotEquals(first, prefs.getLong("id", -1))
    }

    @Test fun onlyFixedProjectHttpsUrlIsConstructed() {
        assertEquals("https://parip69.github.io/RechenGuruLGI_AndroidAPK/MatheKids-v231.apk?update-check=apk", AppUpdater.downloadUri(231).toString())
        assertThrows(IllegalArgumentException::class.java) { AppUpdater.downloadUri(0) }
    }
    private fun completedArchive(packageName: String = activity.packageName, version: Int = 231, original: Boolean = true): File {
        updater.start(231)
        val downloads = activity.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
        val request = shadowOf(downloads).getRequest(prefs.getLong("id", -1))
        val file = File(shadowOf(request).destination.path!!)
        file.parentFile!!.mkdirs()
        file.writeBytes(byteArrayOf(1, 2, 3))
        val certificate = javaClass.getResourceAsStream("/original-certificate.der")!!.use { it.readBytes() }
        val signatures = arrayOf(Signature(if (original) certificate else byteArrayOf(1, 2, 3)))
        val info = PackageInfo().apply {
            this.packageName = packageName
            @Suppress("DEPRECATION")
            versionCode = version
            if (Build.VERSION.SDK_INT >= 28) {
                signingInfo = SigningInfo().also { shadowOf(it).setSignatures(signatures) }
            } else {
                @Suppress("DEPRECATION")
                this.signatures = signatures
            }
        }
        shadowOf(activity.packageManager).setPackageArchiveInfo(file.absolutePath, info)
        shadowOf(request).setStatus(DownloadManager.STATUS_SUCCESSFUL)
        return file
    }

    @Test fun completedVerifiedDownloadOpensInstallerWithoutBrowser() {
        completedArchive()
        shadowOf(activity.packageManager).setCanRequestPackageInstalls(true)
        updater.resume(); shadowOf(Looper.getMainLooper()).idle()
        val intent = shadowOf(activity).nextStartedActivity
        assertNotNull(messages.toString(), intent)
        assertEquals(Intent.ACTION_VIEW, intent.action)
        assertEquals("application/vnd.android.package-archive", intent.type)
        assertEquals("content", intent.data!!.scheme)
        assertTrue(intent.flags and Intent.FLAG_GRANT_READ_URI_PERMISSION != 0)
        assertFalse(prefs.getBoolean("pending", true))
        assertTrue(messages.last().contains("Installation geöffnet"))
    }

    @Test fun permissionSettingsReturnContinuesInstallation() {
        completedArchive()
        shadowOf(activity.packageManager).setCanRequestPackageInstalls(false)
        updater.resume(); shadowOf(Looper.getMainLooper()).idle()
        val dialog = ShadowAlertDialog.getLatestAlertDialog()
        assertTrue(dialog.isShowing)
        dialog.getButton(AlertDialog.BUTTON_POSITIVE).performClick()
        shadowOf(Looper.getMainLooper()).idle()
        val settings = shadowOf(activity).nextStartedActivity
        assertNotNull(messages.toString(), settings)
        assertEquals(android.provider.Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, settings.action)
        assertEquals("package:" + activity.packageName, settings.data.toString())
        updater.pause()
        shadowOf(activity.packageManager).setCanRequestPackageInstalls(true)
        updater.resume()
        val installer = shadowOf(activity).nextStartedActivity
        assertNotNull(messages.toString(), installer)
        assertEquals("application/vnd.android.package-archive", installer.type)
        assertFalse(prefs.getBoolean("permission", true))
    }

    @Test fun deniedPermissionDoesNotLoopOrLoseDownloadedFile() {
        val file = completedArchive()
        shadowOf(activity.packageManager).setCanRequestPackageInstalls(false)
        updater.resume(); shadowOf(Looper.getMainLooper()).idle()
        ShadowAlertDialog.getLatestAlertDialog().getButton(AlertDialog.BUTTON_POSITIVE).performClick()
        shadowOf(Looper.getMainLooper()).idle()
        shadowOf(activity).nextStartedActivity
        updater.pause(); updater.resume()
        assertTrue(messages.toString(), messages.last().contains("noch nicht erlaubt"))
        assertTrue(file.exists())
        assertNull(shadowOf(activity).nextStartedActivity)
        assertFalse(prefs.getBoolean("pending", true))
    }

    @Test fun wrongPackageNeverOpensInstaller() {
        completedArchive(packageName = "another.app")
        updater.resume(); shadowOf(Looper.getMainLooper()).idle()
        assertNull(shadowOf(activity).nextStartedActivity)
        assertTrue(messages.last().contains("nicht zur erwarteten"))
    }

    @Test fun wrongVersionNeverOpensInstaller() {
        completedArchive(version = 232)
        updater.resume(); shadowOf(Looper.getMainLooper()).idle()
        assertNull(shadowOf(activity).nextStartedActivity)
        assertTrue(messages.last().contains("nicht zur erwarteten"))
    }

    @Test fun wrongSignatureNeverOpensInstaller() {
        completedArchive(original = false)
        updater.resume(); shadowOf(Looper.getMainLooper()).idle()
        assertNull(shadowOf(activity).nextStartedActivity)
        assertTrue(messages.last().contains("Signatur"))
    }

    @Test fun failedDownloadClearsJobAndCanRetry() {
        updater.start(231)
        val downloads = activity.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
        shadowOf(shadowOf(downloads).getRequest(prefs.getLong("id", -1))).setStatus(DownloadManager.STATUS_FAILED)
        updater.resume(); shadowOf(Looper.getMainLooper()).idle()
        assertEquals(-1L, prefs.getLong("id", -1))
        assertTrue(messages.last().contains("fehlgeschlagen"))
        updater.start(231)
        assertTrue(prefs.getLong("id", -1) >= 0)
    }

    @Test @Config(sdk = [24]) fun androidSevenUsesLegacySignatureAndInstallerPath() {
        completedArchive()
        updater.resume(); shadowOf(Looper.getMainLooper()).idle()
        val installer = shadowOf(activity).nextStartedActivity
        assertNotNull(messages.toString(), installer)
        assertEquals("application/vnd.android.package-archive", installer.type)
    }

    @Test fun invalidApkNeverOpensInstaller() {
        updater.start(231)
        val downloads = activity.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
        val request = shadowOf(downloads).getRequest(prefs.getLong("id", -1))
        val file = File(shadowOf(request).destination.path!!)
        file.parentFile!!.mkdirs(); file.writeBytes(byteArrayOf(0, 0, 0))
        shadowOf(request).setStatus(DownloadManager.STATUS_SUCCESSFUL)
        updater.resume(); shadowOf(Looper.getMainLooper()).idle()
        assertNull(shadowOf(activity).nextStartedActivity)
        assertTrue(messages.toString(), messages.last().contains("gültige Android-App"))
    }

}
