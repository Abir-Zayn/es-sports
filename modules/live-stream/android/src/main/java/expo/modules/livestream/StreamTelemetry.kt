package expo.modules.livestream

import android.os.SystemClock

/**
 * The 1 s engine tick while a stream is active: ABR, 1080p fallback, reconnect-window expiry while offline, stats
 * events (every 2 s) and the Phase 0 CSV row. Runs on the engine thread only.
 */
class StreamTelemetry(private val engine: StreamEngine) {
  private var running = false
  private var ticks = 0
  @Volatile private var dropped = 0L
  @Volatile private var sent = 0L
  @Volatile private var queueItems = 0
  @Volatile private var congested = false

  private val tick = object : Runnable {
    override fun run() {
      if (!running) return
      ticks += 1
      onTick()
      engine.handler.postDelayed(this, StreamConstants.TICK_MS)
    }
  }

  fun start() {
    if (running) return
    running = true
    ticks = 0
    engine.handler.postDelayed(tick, StreamConstants.TICK_MS)
  }

  fun stop() {
    running = false
    engine.handler.removeCallbacks(tick)
  }

  private fun onTick() {
    val now = SystemClock.elapsedRealtime()
    val s = engine.stream ?: return
    val client = s.getStreamClient()
    congested = runCatching { client.hasCongestion() }.getOrDefault(false)
    dropped = runCatching { client.getDroppedVideoFrames() }.getOrDefault(dropped)
    sent = runCatching { client.getSentVideoFrames() }.getOrDefault(sent)
    queueItems = runCatching { client.getItemsInCache() }.getOrDefault(0)

    val policy = engine.bitrate
    when (engine.state) {
      NativeState.LIVE -> {
        policy?.onSample(congested, now)?.let { next ->
          runCatching { s.setVideoBitrateOnFly(next) }
          engine.logger.marker("bitrate", next.toString())
        }
        val degraded = policy?.degraded == true
        if (engine.preset == Preset.P1080 && engine.fallback.onSample(degraded && congested, engine.fps, now)) {
          return engine.presetFallback("sustained congestion or low fps")
        }
      }
      NativeState.RECONNECTING -> if (engine.reconnect.isExhausted(now)) {
        return engine.fail(ErrorCode.E_NETWORK_EXHAUSTED, "Could not reconnect within 5 minutes.")
      }
      else -> Unit
    }

    if (ticks % StreamConstants.STATS_EVERY_TICKS == 0) StreamHub.emit("onStats", stats())
    val battery = engine.monitors.lastBattery
    engine.logger.row(
      StatsRow(
        state = engine.state.js, preset = engine.preset.js, targetBps = policy?.current ?: 0,
        measuredBps = engine.measuredBps, fps = engine.fps, droppedVideo = dropped, sentVideo = sent,
        queueItems = queueItems, congested = congested, quality = quality(),
        thermal = engine.monitors.lastThermal, batteryPct = battery?.percent, batteryTempC = battery?.temperatureC,
        charging = battery?.charging, overlayAgeMs = OverlayRegistry.overlayAgeMs(),
        reconnectAttempt = engine.reconnect.attempts,
      ),
    )
  }

  private fun quality() = if (engine.bitrate?.degraded == true) "degraded" else "normal"

  private fun stats(): Map<String, Any?> = mapOf(
    "fps" to engine.fps,
    "bitrateKbps" to (engine.bitrate?.current ?: 0) / 1000,
    "measuredKbps" to engine.measuredBps / 1000,
    "droppedFrames" to dropped.toDouble(),
    "sentFrames" to sent.toDouble(),
    "queueItems" to queueItems,
    "congested" to congested,
    "quality" to quality(),
    "overlayAgeMs" to OverlayRegistry.overlayAgeMs()?.toDouble(),
  )

  /** Snapshot for getStatus(); safe from any thread (values are volatile, possibly one tick old). */
  fun status(lastError: Pair<ErrorCode, String>?): Map<String, Any?> = stats() + mapOf(
    "state" to engine.state.js,
    "sessionId" to engine.sessionId,
    "preset" to engine.preset.js,
    "platform" to engine.platform.js,
    "reconnectAttempt" to engine.reconnect.attempts,
    "thermal" to engine.monitors.lastThermal,
    "lastError" to lastError?.let { (code, message) -> mapOf("code" to code.name, "fatal" to code.fatal, "message" to message) },
  )
}

/** Owns the pending reconnect timer; waits for the network instead of burning attempts while offline (§5). */
class ReconnectScheduler(private val engine: StreamEngine) {
  private var pending: Runnable? = null
  private var waitingForNetwork = false

  fun schedule(delayMs: Long) {
    cancel()
    val run = Runnable {
      pending = null
      if (!engine.monitors.networkAvailable) waitingForNetwork = true else attempt()
    }
    pending = run
    engine.handler.postDelayed(run, delayMs)
  }

  fun onNetworkAvailable() {
    if (engine.state != NativeState.RECONNECTING || (pending == null && !waitingForNetwork)) return
    cancel()
    attempt()
  }

  fun cancel() {
    pending?.let { engine.handler.removeCallbacks(it) }
    pending = null
    waitingForNetwork = false
  }

  private fun attempt() {
    if (engine.state != NativeState.RECONNECTING) return
    engine.logger.marker("reconnect_attempt", engine.reconnect.attempts.toString())
    val s = engine.stream ?: return engine.fail(ErrorCode.E_UNKNOWN, "Stream released during reconnect.")
    val accepted = runCatching { s.getStreamClient().reTry(0, "reconnect") }.getOrDefault(false)
    if (!accepted) engine.fail(ErrorCode.E_NETWORK_EXHAUSTED, "Reconnect attempts exhausted.")
  }
}
