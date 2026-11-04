package expo.modules.livestream

import android.os.PowerManager
import android.os.SystemClock
import com.pedro.common.ConnectChecker

/**
 * RootEncoder connection callbacks (library threads → engine thread) and the device-safety policy (§5, §7).
 * Kept apart from [StreamEngine] so the engine file holds only lifecycle and preparation.
 */
internal class EngineCallbacks(private val engine: StreamEngine) : ConnectChecker {
  private val rejection = RejectionTracker()

  fun resetRejection() = rejection.reset()

  // --- ConnectChecker ------------------------------------------------------------------------------------------

  override fun onConnectionStarted(url: String) = Unit // url contains the key: never logged

  override fun onConnectionSuccess() {
    engine.handler.post {
      if (engine.state != NativeState.CONNECTING && engine.state != NativeState.RECONNECTING) return@post
      rejection.onPublished()
      engine.reconnect.reset()
      engine.recovery.cancel()
      engine.stream?.requestKeyframe()
      engine.transition(NativeState.LIVE)
    }
  }

  override fun onConnectionFailed(reason: String) {
    val safe = Redact.text(reason)
    engine.handler.post {
      if (engine.state !in StreamEngine.ACTIVE) return@post
      engine.logger.marker("connection_failed", safe)
      // Only count towards "rejected" while the network is up: offline failures say nothing about the key.
      if (engine.monitors.networkAvailable && rejection.onFailure()) {
        return@post engine.fail(ErrorCode.E_DESTINATION_REJECTED, "The platform refused the stream. Check the stream key and server URL.")
      }
      val delay = engine.reconnect.nextDelay(SystemClock.elapsedRealtime())
        ?: return@post engine.fail(ErrorCode.E_NETWORK_EXHAUSTED, "Could not reconnect within 5 minutes.")
      if (engine.state != NativeState.RECONNECTING) engine.transition(NativeState.RECONNECTING)
      engine.recovery.schedule(delay)
    }
  }

  override fun onDisconnect() = engine.logger.marker("disconnect", "")

  override fun onAuthError() {
    engine.handler.post {
      if (engine.state in StreamEngine.ACTIVE) engine.fail(ErrorCode.E_DESTINATION_REJECTED, "The platform refused the stream key.")
    }
  }

  override fun onAuthSuccess() = Unit

  override fun onNewBitrate(bitrate: Long) {
    engine.measuredBps = bitrate
  }

  // --- Device safety (engine thread, via DeviceMonitors) ---------------------------------------------------------

  fun onThermal(status: Int) {
    StreamHub.emit("onThermal", mapOf("status" to status))
    engine.logger.marker("thermal", status.toString())
    if (engine.state !in StreamEngine.ACTIVE) return
    if (status >= PowerManager.THERMAL_STATUS_CRITICAL) {
      engine.emitError(ErrorCode.E_THERMAL_CRITICAL, "The phone is too hot. The stream was stopped to protect it.", true)
      return engine.stopInternal(StopReason.THERMAL)
    }
    val severe = status >= PowerManager.THERMAL_STATUS_SEVERE
    engine.bitrate?.ceilingScale = if (severe) 0.75 else 1.0
    if (severe) engine.presetFallback("thermal")
  }

  fun onBattery(sample: BatterySample) {
    StreamHub.emit("onBattery", mapOf("percent" to sample.percent, "charging" to sample.charging, "temperatureC" to sample.temperatureC))
    if (engine.state in StreamEngine.ACTIVE && !sample.charging && sample.percent in 0 until 5) {
      engine.emitError(ErrorCode.E_BATTERY_CRITICAL, "Battery is critically low. The stream was stopped.", true)
      engine.stopInternal(StopReason.BATTERY)
    }
  }

  fun onNetwork(available: Boolean) {
    engine.logger.marker("network", if (available) "available" else "lost")
    if (available) engine.recovery.onNetworkAvailable()
  }
}
