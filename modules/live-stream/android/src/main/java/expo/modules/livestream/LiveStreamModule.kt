package expo.modules.livestream

import android.os.Handler
import android.os.Looper
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class StartOptions : Record {
  @Field val sessionId: String = ""
  @Field val platform: String = ""
  @Field val url: String = ""
  @Field val key: String = ""
  @Field val preset: String = Preset.P720.js
}

class InvalidOptionException(message: String) : CodedException(message)

/** JS bridge. Holds no stream state: everything lives in [StreamHub] / [StreamEngine], which outlive the JS runtime. */
class LiveStreamModule : Module() {
  private val context get() = requireNotNull(appContext.reactContext) { "React context unavailable" }.applicationContext

  override fun definition() = ModuleDefinition {
    Name("LiveStream")
    Events("onStateChange", "onStats", "onError", "onPresetFallback", "onThermal", "onBattery")

    OnCreate {
      StreamHub.init(context)
      StreamHub.emitter = { name, body -> sendEvent(name, body) }
    }
    OnDestroy { StreamHub.emitter = null }

    AsyncFunction("getDeviceEligibility") { DeviceEligibility(context).evaluate() }
    Function("getStatus") { StreamHub.engine.status() }

    AsyncFunction("start") { options: StartOptions ->
      val platform = Platform.from(options.platform) ?: throw InvalidOptionException("Unknown platform")
      val preset = Preset.from(options.preset) ?: throw InvalidOptionException("Unknown preset")
      if (options.sessionId.isBlank()) throw InvalidOptionException("sessionId is required")
      // The key is passed straight to native memory; it is never persisted, logged or echoed back.
      StreamHub.engine.start(options.sessionId, platform, options.url, options.key, preset)
    }
    AsyncFunction("stop") { reason: String -> StreamHub.engine.stop(StopReason.from(reason)) }
    AsyncFunction("retry") { StreamHub.engine.retry() }
    Function("setPreset") { value: String ->
      StreamHub.engine.setPreset(Preset.from(value) ?: throw InvalidOptionException("Unknown preset"))
    }
    Function("setOverlayEnabled") { enabled: Boolean -> OverlayRegistry.filter.enabled = enabled }

    // --- Phase 0 instrumentation (lab only) ---
    Function("setLabMode") { enabled: Boolean -> StreamHub.labMode = enabled }
    Function("setStatsLogging") { enabled: Boolean -> StreamHub.logger?.enable(enabled); StreamHub.logger?.path }
    Function("logMarker") { name: String, detail: String -> StreamHub.logMarker(name, detail) }
    Function("labSimulateThermal") { status: Int -> requireLab(); StreamHub.engine.monitors.simulateThermal(status) }
    Function("labSimulateBattery") { percent: Int -> requireLab(); StreamHub.engine.monitors.simulateBattery(percent) }
    Function("labCrashNative") {
      requireLab()
      // S4c: an uncaught exception on the main thread kills the process like a real native crash.
      Handler(Looper.getMainLooper()).post { throw IllegalStateException("Phase 0 lab: deliberate native crash") }
    }

    View(CameraPreviewView::class) {}
  }

  private fun requireLab() {
    if (!StreamHub.labMode) throw InvalidOptionException("Lab mode is off")
  }
}

/** Separate module because one Expo module exposes one view. */
class LiveStreamOverlayModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("LiveStreamOverlay")
    View(OverlayHostView::class) {
      Prop("streamWidth") { view: OverlayHostView, value: Int -> view.streamWidth = value.coerceIn(320, 1920) }
      Prop("streamHeight") { view: OverlayHostView, value: Int -> view.streamHeight = value.coerceIn(180, 1080) }
      AsyncFunction("capture") { view: OverlayHostView -> view.capture() }
    }
  }
}
