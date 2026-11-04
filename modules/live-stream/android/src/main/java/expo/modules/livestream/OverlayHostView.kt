package expo.modules.livestream

import android.content.Context
import android.os.SystemClock
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView

/**
 * Hosts the React Native graphics. capture() draws this view (and its RN children) into the reused overlay
 * bitmap, scaled to the stream resolution. Runs on the main thread (Expo view functions are dispatched there).
 */
class OverlayHostView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  var streamWidth: Int = Preset.P720.width
  var streamHeight: Int = Preset.P720.height

  fun capture(): Map<String, Any?> {
    val started = SystemClock.elapsedRealtimeNanos()
    val w = width
    val h = height
    if (w <= 0 || h <= 0) return result(false, started, "Overlay host is not laid out")
    val buffers = OverlayRegistry.ensure(streamWidth, streamHeight)
    val ok = buffers.draw { canvas ->
      canvas.scale(streamWidth.toFloat() / w, streamHeight.toFloat() / h)
      draw(canvas)
    }
    val res = result(ok, started, if (ok) null else "Overlay draw failed; previous overlay kept")
    StreamHub.logMarker("overlay_capture", "ok=$ok ms=${res["ms"]}")
    return res
  }

  private fun result(ok: Boolean, startedNanos: Long, error: String?): Map<String, Any?> = mapOf(
    "ok" to ok,
    "capturedAt" to System.currentTimeMillis().toDouble(),
    "ms" to (SystemClock.elapsedRealtimeNanos() - startedNanos) / 1_000_000.0,
    "error" to error,
  )
}
