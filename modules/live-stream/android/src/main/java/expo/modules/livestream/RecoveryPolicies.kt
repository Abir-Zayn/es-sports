package expo.modules.livestream

import kotlin.math.max
import kotlin.math.min

/**
 * Bounded exponential reconnect backoff: 1, 2, 4, 8, 16, 30 s (capped) with ±20 % jitter, inside a total window.
 * Returns null once the window is spent, so the caller moves to ERROR instead of looping.
 */
class ReconnectPolicy(
  private val windowMs: Long = 300_000L,
  private val capMs: Long = 30_000L,
  private val random: () -> Double = Math::random,
) {
  var attempts: Int = 0
    private set
  private var windowStart = -1L

  fun reset() {
    attempts = 0
    windowStart = -1L
  }

  /** True once a reconnect window has started and run out (used while waiting for the network). */
  fun isExhausted(nowMs: Long): Boolean = windowStart >= 0 && nowMs - windowStart >= windowMs

  fun nextDelay(nowMs: Long): Long? {
    if (windowStart < 0) windowStart = nowMs
    if (nowMs - windowStart >= windowMs) return null
    val base = min(capMs, 1_000L shl min(attempts, 5))
    attempts += 1
    val jittered = (base * (0.8 + 0.4 * random())).toLong()
    return max(0L, min(jittered, windowStart + windowMs - nowMs))
  }
}

/**
 * RTMP servers rarely send a clear auth error for a bad key. Heuristic (§5): [threshold] consecutive
 * handshake/publish failures before any successful publish in this session = destination rejected.
 * Failures after a publish are treated as network trouble.
 */
class RejectionTracker(private val threshold: Int = 3) {
  private var published = false
  private var consecutive = 0

  fun reset() {
    published = false
    consecutive = 0
  }

  fun onPublished() {
    published = true
    consecutive = 0
  }

  /** True when this failure means the destination rejected us. */
  fun onFailure(): Boolean {
    if (published) return false
    consecutive += 1
    return consecutive >= threshold
  }
}

/**
 * Adaptive bitrate. Down 15 % per 2 s while congested; up 5 % per 10 s after 20 s without congestion.
 * Clamped to [hard floor, ceiling × ceilingScale]. Below the nominal floor the stream is "degraded".
 */
class BitratePolicy(private val profile: BitrateProfile) {
  var current: Int = profile.start
    private set
  /** Lowered under thermal pressure (§7). */
  var ceilingScale: Double = 1.0
  private var lastDecreaseAt = Long.MIN_VALUE / 2
  private var lastIncreaseAt = Long.MIN_VALUE / 2
  private var stableSince = -1L

  val degraded: Boolean get() = current < profile.nominalFloor
  private val ceiling: Int get() = max(profile.hardFloor, (profile.ceiling * ceilingScale).toInt())

  /** Returns the new bitrate when it changed, else null. */
  fun onSample(congested: Boolean, nowMs: Long): Int? {
    if (current > ceiling) return apply(ceiling)
    if (congested) {
      stableSince = -1L
      if (nowMs - lastDecreaseAt < 2_000L) return null
      lastDecreaseAt = nowMs
      return apply(max(profile.hardFloor, (current * 0.85).toInt()))
    }
    if (stableSince < 0) stableSince = nowMs
    if (nowMs - stableSince < 20_000L || nowMs - lastIncreaseAt < 10_000L) return null
    lastIncreaseAt = nowMs
    return apply(min(ceiling, (current * 1.05).toInt()))
  }

  private fun apply(next: Int): Int? {
    if (next == current) return null
    current = next
    return next
  }
}

/** 1080p → 720p controlled fallback trigger (§3.3): degraded+congested, or FPS < 25, sustained. */
class FallbackMonitor(private val sustainMs: Long = 45_000L) {
  private var badSince = -1L

  fun reset() {
    badSince = -1L
  }

  fun onSample(degradedAndCongested: Boolean, fps: Int, nowMs: Long): Boolean {
    val bad = degradedAndCongested || fps in 1..24
    if (!bad) {
      badSince = -1L
      return false
    }
    if (badSince < 0) badSince = nowMs
    return nowMs - badSince >= sustainMs
  }
}
