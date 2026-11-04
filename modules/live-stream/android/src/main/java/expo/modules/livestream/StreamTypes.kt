package expo.modules.livestream

/** Native stream lifecycle. Transitions are validated by [StreamStateMachine]; JS only observes them. */
enum class NativeState(val js: String) {
  IDLE("idle"), PREPARING("preparing"), CONNECTING("connecting"), LIVE("live"),
  RECONNECTING("reconnecting"), STOPPING("stopping"), STOPPED("stopped"), ERROR("error");
}

enum class ErrorCode(val fatal: Boolean) {
  E_PERMISSION(true), E_CAMERA(true), E_MIC(true), E_ENCODER_INIT(true), E_FGS_NOT_ALLOWED(true),
  E_INVALID_DESTINATION(true), E_DESTINATION_REJECTED(true), E_NETWORK_EXHAUSTED(false),
  E_THERMAL_CRITICAL(true), E_BATTERY_CRITICAL(true), E_UNKNOWN(true);
}

enum class StopReason(val js: String) {
  USER("user"), CREW_CHANGE("crew_change"), SUPERSEDED("superseded"), MATCH_COMPLETED("match_completed"),
  THERMAL("thermal"), BATTERY("battery"), FATAL("fatal");

  companion object {
    fun from(value: String): StopReason = entries.firstOrNull { it.js == value } ?: USER
  }
}

enum class Platform(val js: String) {
  YOUTUBE("youtube"), FACEBOOK("facebook");

  companion object {
    fun from(value: String): Platform? = entries.firstOrNull { it.js == value }
  }
}

enum class Preset(val js: String, val width: Int, val height: Int, val fps: Int) {
  P720("720p30", 1280, 720, 30), P1080("1080p30", 1920, 1080, 30);

  companion object {
    fun from(value: String): Preset? = entries.firstOrNull { it.js == value }
  }
}

/**
 * Bits per second. Nominal floor = the platform's published minimum for this resolution (below it the stream is
 * "degraded" but kept up). Hard floor = the lowest ABR will go. Values: docs/tasks/live-broadcast.md §3.2.
 */
data class BitrateProfile(val start: Int, val ceiling: Int, val nominalFloor: Int, val hardFloor: Int)

object BitrateProfiles {
  private const val MBPS = 1_000_000

  fun of(preset: Preset, platform: Platform): BitrateProfile = when (preset to platform) {
    Preset.P720 to Platform.YOUTUBE -> BitrateProfile(3 * MBPS, 4_500_000, 3 * MBPS, 1_500_000)
    Preset.P720 to Platform.FACEBOOK -> BitrateProfile(3 * MBPS, 4 * MBPS, 1_500_000, 1 * MBPS)
    Preset.P1080 to Platform.YOUTUBE -> BitrateProfile(5 * MBPS, 6 * MBPS, 5 * MBPS, 3_500_000)
    else -> BitrateProfile(4_500_000, 6 * MBPS, 3 * MBPS, 2_500_000)
  }
}

object StreamConstants {
  const val AUDIO_SAMPLE_RATE = 44_100
  const val AUDIO_BITRATE = 128_000
  const val KEYFRAME_INTERVAL_S = 2
  /** About 2 s of 30 fps video plus AAC frames; bounds memory during congestion. */
  const val SEND_CACHE_ITEMS = 150
  const val TICK_MS = 1_000L
  const val STATS_EVERY_TICKS = 2
}

/** Allowed transitions of §4.1. Anything else is a programming error and is rejected, never applied. */
object StreamStateMachine {
  private val allowed: Map<NativeState, Set<NativeState>> = mapOf(
    NativeState.IDLE to setOf(NativeState.PREPARING),
    NativeState.PREPARING to setOf(NativeState.CONNECTING, NativeState.ERROR, NativeState.STOPPING),
    NativeState.CONNECTING to setOf(NativeState.LIVE, NativeState.RECONNECTING, NativeState.ERROR, NativeState.STOPPING),
    NativeState.LIVE to setOf(NativeState.RECONNECTING, NativeState.PREPARING, NativeState.STOPPING),
    NativeState.RECONNECTING to setOf(NativeState.LIVE, NativeState.ERROR, NativeState.STOPPING),
    NativeState.ERROR to setOf(NativeState.CONNECTING, NativeState.STOPPING),
    NativeState.STOPPING to setOf(NativeState.STOPPED),
    NativeState.STOPPED to setOf(NativeState.IDLE),
  )

  fun canTransition(from: NativeState, to: NativeState): Boolean = allowed[from]?.contains(to) == true
}
