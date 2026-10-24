package de.parip69.rechengurulgi

import android.content.Intent
import android.net.Uri
import android.webkit.WebView
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [24, 35])
class WebViewCompatibilityTest {
    @Suppress("DEPRECATION") // Robolectric's settings defaults predate targetSdk 16.
    @Test fun bundledOriginStorageAndRestrictedFileDefaultsAreRetained() {
        val controller = Robolectric.buildActivity(MainActivity::class.java).setup()
        try {
            val activity = controller.get()
            val webView = activity.findViewById<WebView>(R.id.webView)
            assertEquals("file:///android_asset/index.html", webView.url)
            // Android defaults both flags to false for targetSdk >= 16. Seed
            // those defaults in the shadow, then verify setup never reopens them.
            webView.settings.allowFileAccessFromFileURLs = false
            webView.settings.allowUniversalAccessFromFileURLs = false
            MainActivity::class.java.getDeclaredMethod("configureWebView", WebView::class.java).apply {
                isAccessible = true
            }.invoke(activity, webView)
            assertTrue(webView.settings.javaScriptEnabled)
            assertTrue(webView.settings.domStorageEnabled)
            assertTrue(webView.settings.allowFileAccess)
            assertFalse(webView.settings.allowFileAccessFromFileURLs)
            assertFalse(webView.settings.allowUniversalAccessFromFileURLs)
            assertTrue(activity.AndroidInterface().getBundledIndexHtml().contains("bundleRealschuleAssets"))
            assertTrue(activity.AndroidInterface().getBundledTextAsset("positions/config.js").isNotEmpty())
            assertEquals("", activity.AndroidInterface().getBundledTextAsset("../../android-signing/signing.properties"))
            assertFalse(activity.AndroidInterface().checkLatestVersion("invalid"))
        } finally { controller.pause().stop().destroy() }
    }

    @Test fun sharedSettingsDeepLinkKeepsBundledOriginAndFragment() {
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse("rechengurulgi://settings?data=abc_123-XYZ"))
        val controller = Robolectric.buildActivity(MainActivity::class.java, intent).setup()
        try {
            assertEquals("file:///android_asset/index.html#settings=abc_123-XYZ", controller.get().findViewById<WebView>(R.id.webView).url)
        } finally { controller.pause().stop().destroy() }
    }
}
