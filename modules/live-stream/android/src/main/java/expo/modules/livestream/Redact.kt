package expo.modules.livestream

/**
 * Removes stream destinations and key-shaped tokens from any text that leaves native code (events, CSV, notification).
 * The active URL and key are registered while a stream runs, so they are removed even if they look ordinary.
 */
object Redact {
  private val rtmpUrl = Regex("""rtmps?://\S+""", RegexOption.IGNORE_CASE)
  // Long tokens that contain a digit (stream keys, query secrets). Plain words such as exception names are kept.
  private val keyLike = Regex("""(?<![A-Za-z0-9_\-])(?=[A-Za-z0-9_\-]*\d)[A-Za-z0-9_\-]{16,}(?![A-Za-z0-9_\-])""")
  private const val MAX_LENGTH = 300

  @Volatile
  private var secrets: List<String> = emptyList()

  fun register(vararg values: String) {
    secrets = values.filter { it.length >= 4 }
  }

  fun clear() {
    secrets = emptyList()
  }

  fun text(value: String?): String {
    if (value.isNullOrEmpty()) return ""
    var out: String = value
    for (secret in secrets) out = out.replace(secret, "[redacted]")
    out = out.replace(rtmpUrl, "[destination]").replace(keyLike, "[redacted]")
    return out.take(MAX_LENGTH)
  }
}

/** A validated RTMP(S) endpoint. The full endpoint is a bearer secret: never logged, persisted or emitted. */
class Destination private constructor(val endpoint: String, val host: String) {
  companion object {
    /** Null when invalid. Facebook requires RTMPS (§R9). */
    fun parse(url: String, key: String, platform: Platform): Destination? {
      val base = url.trim().trimEnd('/')
      val cleanKey = key.trim().trimStart('/')
      val match = Regex("""^(rtmps?)://([^/\s:]+)(:\d+)?(/\S*)?$""", RegexOption.IGNORE_CASE).find(base) ?: return null
      val scheme = match.groupValues[1].lowercase()
      if (platform == Platform.FACEBOOK && scheme != "rtmps") return null
      if (cleanKey.isEmpty() || cleanKey.any { it.isWhitespace() } || cleanKey.length > 512) return null
      return Destination("$base/$cleanKey", match.groupValues[2].lowercase())
    }
  }
}
