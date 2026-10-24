package de.parip69.rechengurulgi

import java.io.ByteArrayInputStream
import java.net.HttpURLConnection
import java.net.URL
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class ReleaseVersionReaderTest {
    private class Response(val body: String, val status: Int = 200) : HttpURLConnection(URL(ReleaseVersionReader.RELEASE_VERSION_URL)) {
        var disconnected = false
        override fun connect() {}
        override fun disconnect() { disconnected = true }
        override fun usingProxy() = false
        override fun getResponseCode() = status
        override fun getInputStream() = ByteArrayInputStream(body.toByteArray())
    }

    @Test fun readsFixedHttpsEndpointWithoutRedirectsOrCache() {
        val response = Response("""{"version":"233"}""")
        val version = ReleaseVersionReader { url ->
            assertEquals(ReleaseVersionReader.RELEASE_VERSION_URL, url.toString())
            assertEquals("https", url.protocol)
            response
        }.read()
        assertEquals(233, version)
        assertFalse(response.instanceFollowRedirects)
        assertFalse(response.useCaches)
        assertEquals(12_000, response.connectTimeout)
        assertEquals(12_000, response.readTimeout)
        assertTrue(response.disconnected)
    }

    private fun rejects(body: String, status: Int = 200) {
        val response = Response(body, status)
        assertThrows(Exception::class.java) { ReleaseVersionReader { response }.read() }
        assertTrue(response.disconnected)
    }

    @Test fun rejectsRedirectsAndHttpErrors() {
        for (code in listOf(301, 302, 404, 500)) rejects("""{"version":"233"}""", code)
    }

    @Test fun rejectsInvalidOrMissingVersion() {
        for (body in listOf("not json", "{}", """{"version":"0"}""", """{"version":"-1"}""", """{"version":"233.1"}""", """{"version":"9999999999999"}""")) rejects(body)
    }

    @Test fun rejectsOversizedMetadata() {
        rejects("""{"version":"233","padding":"${"x".repeat(4096)}"}""")
    }
}
