package de.parip69.rechengurulgi

import android.annotation.SuppressLint
import android.content.ContentValues
import android.content.Intent
import android.graphics.Bitmap
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.print.PrintAttributes
import android.print.PrintManager
import android.provider.MediaStore
import android.view.View
import android.webkit.ConsoleMessage
import android.webkit.JavascriptInterface
import android.webkit.MimeTypeMap
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.FileProvider
import de.parip69.rechengurulgi.databinding.ActivityMainBinding
import java.io.ByteArrayInputStream
import java.io.File

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding

    private fun showToast(message: String) {
        runOnUiThread {
            Toast.makeText(this@MainActivity, message, Toast.LENGTH_LONG).show()
        }
    }

    private fun sanitizeFileName(fileName: String, fallbackFileName: String = "export.txt"): String {
        val candidate = fileName.trim().ifEmpty { fallbackFileName }
        return candidate
            .replace(Regex("[<>:\"/\\\\|?*\\u0000-\\u001f]"), "_")
            .replace(Regex("\\s+"), "_")
            .trim('_')
            .ifEmpty { fallbackFileName }
    }

    private fun resolveMimeTypeForFileName(fileName: String, fallbackMimeType: String = "text/plain"): String {
        val extension = fileName.substringAfterLast('.', "").lowercase()
        if (extension.isEmpty()) return fallbackMimeType

        return when (extension) {
            "html", "htm" -> "text/html"
            "json" -> "application/json"
            "txt" -> "text/plain"
            "csv" -> "text/csv"
            else -> MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension) ?: fallbackMimeType
        }
    }

    private fun saveBytesToDownloads(fileName: String, bytes: ByteArray, mimeType: String): Boolean {
        val safeFileName = sanitizeFileName(fileName)

        return try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val resolver = contentResolver
                val values = ContentValues().apply {
                    put(MediaStore.MediaColumns.DISPLAY_NAME, safeFileName)
                    put(MediaStore.MediaColumns.MIME_TYPE, mimeType)
                    put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
                    put(MediaStore.MediaColumns.IS_PENDING, 1)
                }

                val collection = MediaStore.Downloads.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
                val itemUri = resolver.insert(collection, values)
                    ?: throw IllegalStateException("Datei konnte im Download-Ordner nicht angelegt werden.")

                try {
                    resolver.openOutputStream(itemUri)?.use { output ->
                        output.write(bytes)
                    } ?: throw IllegalStateException("Ausgabestream fuer den Download konnte nicht geoeffnet werden.")

                    values.clear()
                    values.put(MediaStore.MediaColumns.IS_PENDING, 0)
                    resolver.update(itemUri, values, null, null)
                } catch (error: Exception) {
                    resolver.delete(itemUri, null, null)
                    throw error
                }

                showToast("Datei gespeichert: Downloads/$safeFileName")
                true
            } else {
                val legacyDownloadsDir = getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS)
                    ?: File(filesDir, "downloads")
                if (!legacyDownloadsDir.exists()) {
                    legacyDownloadsDir.mkdirs()
                }

                val outputFile = File(legacyDownloadsDir, safeFileName)
                outputFile.writeBytes(bytes)
                showToast("Datei gespeichert: ${outputFile.absolutePath}")
                true
            }
        } catch (error: Exception) {
            showToast("Fehler beim Speichern: ${error.message ?: "Unbekannt"}")
            false
        }
    }

    private fun resolveAppDisplayName(): String {
        val label = applicationInfo.loadLabel(packageManager).toString().trim()
        return label.ifEmpty { getString(R.string.app_name) }
    }

    private fun resolveAppVersionName(): String {
        return try {
            val packageInfo = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                packageManager.getPackageInfo(
                    packageName,
                    android.content.pm.PackageManager.PackageInfoFlags.of(0)
                )
            } else {
                @Suppress("DEPRECATION")
                packageManager.getPackageInfo(packageName, 0)
            }
            packageInfo.versionName?.trim().orEmpty()
        } catch (_: Exception) {
            ""
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
        )

        configureWebView(binding.webView)
        binding.webView.loadUrl("file:///android_asset/index.html")

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (binding.webView.canGoBack()) {
                    binding.webView.goBack()
                } else {
                    finish()
                }
            }
        })
    }

    private fun printWebView() {
        val printManager = getSystemService(PRINT_SERVICE) as? PrintManager ?: return
        val jobName = "RechenGuru Arbeitsblatt"
        val printAdapter = binding.webView.createPrintDocumentAdapter(jobName)
        printManager.print(jobName, printAdapter, PrintAttributes.Builder()
            .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
            .build())
    }

    inner class WebAppInterface {
        @JavascriptInterface
        fun printPage() {
            runOnUiThread { printWebView() }
        }
    }

    inner class AndroidInterface {
        @JavascriptInterface
        fun saveTextFile(fileName: String, content: String): Boolean {
            return saveBytesToDownloads(
                fileName,
                content.toByteArray(Charsets.UTF_8),
                resolveMimeTypeForFileName(fileName)
            )
        }

        @JavascriptInterface
        fun getBundledIndexHtml(): String {
            return try {
                assets.open("index.html").bufferedReader(Charsets.UTF_8).use { it.readText() }
            } catch (_: Exception) {
                ""
            }
        }

        @JavascriptInterface
        fun getAppDisplayName(): String {
            return resolveAppDisplayName()
        }

        @JavascriptInterface
        fun getAppVersionName(): String {
            return resolveAppVersionName()
        }

        @JavascriptInterface
        fun shareTextFile(fileName: String, content: String): Boolean {
            return try {
                val safeFileName = sanitizeFileName(fileName)
                val shareDir = File(cacheDir, "shared_exports").apply { mkdirs() }
                val shareFile = File(shareDir, safeFileName)
                shareFile.writeText(content, Charsets.UTF_8)

                val shareUri = FileProvider.getUriForFile(
                    this@MainActivity,
                    "${packageName}.provider",
                    shareFile
                )

                runOnUiThread {
                    try {
                        val shareIntent = Intent(Intent.ACTION_SEND).apply {
                            type = resolveMimeTypeForFileName(safeFileName)
                            putExtra(Intent.EXTRA_STREAM, shareUri)
                            putExtra(Intent.EXTRA_SUBJECT, safeFileName)
                            clipData = android.content.ClipData.newRawUri(safeFileName, shareUri)
                            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                        }
                        startActivity(Intent.createChooser(shareIntent, "Datei teilen"))
                    } catch (error: Exception) {
                        showToast("Fehler beim Teilen: ${error.message ?: "Unbekannt"}")
                    }
                }
                true
            } catch (error: Exception) {
                showToast("Fehler beim Teilen: ${error.message ?: "Unbekannt"}")
                false
            }
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun configureWebView(webView: WebView) {
        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.allowFileAccess = true
        settings.allowContentAccess = true
        settings.loadsImagesAutomatically = true
        settings.mediaPlaybackRequiresUserGesture = false
        settings.setSupportZoom(false)
        settings.builtInZoomControls = false
        settings.displayZoomControls = false
        settings.cacheMode = WebSettings.LOAD_DEFAULT
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true
        settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN) {
            settings.allowFileAccessFromFileURLs = true
            settings.allowUniversalAccessFromFileURLs = true
        }

        webView.isVerticalScrollBarEnabled = false
        webView.isHorizontalScrollBarEnabled = false

        webView.addJavascriptInterface(WebAppInterface(), "AndroidPrint")
        webView.addJavascriptInterface(AndroidInterface(), "AndroidInterface")

        webView.webChromeClient = object : WebChromeClient() {
            override fun onConsoleMessage(consoleMessage: ConsoleMessage): Boolean {
                return true
            }
        }

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                return false
            }

            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                view?.evaluateJavascript(
                    "window.print = function() { AndroidPrint.printPage(); };", null
                )
            }

            override fun shouldInterceptRequest(view: WebView?, request: WebResourceRequest?): WebResourceResponse? {
                val url = request?.url?.toString() ?: return super.shouldInterceptRequest(view, request)
                return when {
                    url.endsWith("manifest.webmanifest") -> assetResponse("manifest.webmanifest", "application/manifest+json")
                    url.endsWith("sw.js") -> assetResponse("sw.js", "application/javascript")
                    url.contains("/icons/") -> {
                        val name = url.substringAfterLast('/')
                        assetResponse("icons/$name", "image/png")
                    }
                    else -> super.shouldInterceptRequest(view, request)
                }
            }
        }
    }

    private fun assetResponse(assetPath: String, mimeType: String): WebResourceResponse? {
        return try {
            val bytes = assets.open(assetPath).readBytes()
            WebResourceResponse(mimeType, "utf-8", ByteArrayInputStream(bytes))
        } catch (_: Exception) {
            null
        }
    }

    override fun onDestroy() {
        binding.webView.destroy()
        super.onDestroy()
    }
}
