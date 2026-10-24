package de.parip69.rechengurulgi

import android.os.Looper
import android.os.SystemClock
import android.view.MotionEvent
import android.view.View
import android.webkit.WebView
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [28])
class SettingsScrollTest {
    @Test fun parentCannotStealDialogSwipesAndPageRefreshReturnsAfterClosing() {
        val controller = Robolectric.buildActivity(MainActivity::class.java).setup()
        try {
            val activity = controller.get()
            val wrapper = activity.findViewById<SwipeRefreshLayout>(R.id.swipeRefresh)
            wrapper.measure(View.MeasureSpec.makeMeasureSpec(390, View.MeasureSpec.EXACTLY), View.MeasureSpec.makeMeasureSpec(844, View.MeasureSpec.EXACTLY))
            wrapper.layout(0, 0, 390, 844)
            assertTrue(wrapper.isEnabled)
            // A WebView at page top does not report scrolling inside an HTML dialog.
            assertFalse(activity.findViewById<WebView>(R.id.webView).canScrollVertically(-1))
            fun swipeIntercepted(): Boolean {
                val now = SystemClock.uptimeMillis()
                val down = MotionEvent.obtain(now, now, MotionEvent.ACTION_DOWN, 180f, 80f, 0)
                val move = MotionEvent.obtain(now, now + 100, MotionEvent.ACTION_MOVE, 180f, 300f, 0)
                val cancel = MotionEvent.obtain(now, now + 110, MotionEvent.ACTION_CANCEL, 180f, 300f, 0)
                try { wrapper.onInterceptTouchEvent(down); return wrapper.onInterceptTouchEvent(move) }
                finally { wrapper.onInterceptTouchEvent(cancel); down.recycle(); move.recycle(); cancel.recycle() }
            }
            assertTrue("Before the guard, native pull-to-refresh captures this downward swipe", swipeIntercepted())
            activity.AndroidInterface().setSettingsDialogOpen(true)
            shadowOf(Looper.getMainLooper()).idle()
            assertFalse(wrapper.isEnabled)
            repeat(5) { assertFalse("Dialog swipe must reach WebView", swipeIntercepted()) }
            activity.AndroidInterface().setSettingsDialogOpen(false)
            shadowOf(Looper.getMainLooper()).idle()
            assertTrue(wrapper.isEnabled)
            assertTrue("Page pull-to-refresh retained", swipeIntercepted())
        } finally { controller.pause().stop().destroy() }
    }

    @Test fun remotePageCannotControlNativeRefresh() {
        val controller = Robolectric.buildActivity(MainActivity::class.java).setup()
        try {
            val activity = controller.get()
            val wrapper = activity.findViewById<SwipeRefreshLayout>(R.id.swipeRefresh)
            activity.findViewById<WebView>(R.id.webView).loadUrl("https://example.org/")
            activity.AndroidInterface().setSettingsDialogOpen(true)
            shadowOf(Looper.getMainLooper()).idle()
            assertTrue(wrapper.isEnabled)
        } finally { controller.pause().stop().destroy() }
    }
}
