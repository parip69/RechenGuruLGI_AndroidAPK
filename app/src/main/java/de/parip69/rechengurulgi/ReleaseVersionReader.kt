package de.parip69.rechengurulgi

import java.net.HttpURLConnection
import java.net.URL
import org.json.JSONObject

/** A fixed HTTPS endpoint replaces unrestricted network access from file pages. */
internal class ReleaseVersionReader(
    private val connect: (URL) -> HttpURLConnection = { it.openConnection() as HttpURLConnection }
) {
    fun read(): Int {
        val connection = connect(URL(RELEASE_VERSION_URL))
        try {
            connection.connectTimeout = 12_000
            connection.readTimeout = 12_000
            connection.instanceFollowRedirects = false
            connection.useCaches = false
            connection.setRequestProperty("Cache-Control", "no-cache")
            check(connection.responseCode == HttpURLConnection.HTTP_OK) { "Release metadata unavailable" }
            val bytes = connection.inputStream.use { input ->
                val buffer = ByteArray(4097)
                var count = 0
                while (count < buffer.size) {
                    val read = input.read(buffer, count, buffer.size - count)
                    if (read == -1) break
                    count += read
                }
                buffer.copyOf(count)
            }
            check(bytes.size <= 4096) { "Release metadata too large" }
            val version = JSONObject(bytes.toString(Charsets.UTF_8)).getString("version").toIntOrNull()
            check(version != null && version > 0) { "Invalid release version" }
            return version
        } finally {
            connection.disconnect()
        }
    }

    companion object {
        const val RELEASE_VERSION_URL = "https://parip69.github.io/RechenGuruLGI_AndroidAPK/version.json"
    }
}
