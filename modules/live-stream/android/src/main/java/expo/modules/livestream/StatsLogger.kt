package expo.modules.livestream

import android.content.Context
import android.os.Debug
import java.io.BufferedWriter
import java.io.File
import java.io.FileWriter
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/** One row per tick (or marker) of the Phase 0 instrumentation, columns of §10. Values are pre-redacted. */
data class StatsRow(
  val state: String, val preset: String, val targetBps: Int, val measuredBps: Long, val fps: Int,
  val droppedVideo: Long, val sentVideo: Long, val queueItems: Int, val congested: Boolean, val quality: String,
  val thermal: Int?, val batteryPct: Int?, val batteryTempC: Double?, val charging: Boolean?,
  val overlayAgeMs: Long?, val reconnectAttempt: Int,
)

/**
 * CSV log at <external files>/broadcast-lab/stats-<time>.csv (adb-pullable without root). Off unless the lab enables
 * it. PSS is sampled every 5th row because Debug.getPss() costs a few ms.
 */
class StatsLogger(private val context: Context) {
  private var writer: BufferedWriter? = null
  private var rows = 0
  var path: String? = null
    private set

  @Synchronized
  fun enable(enabled: Boolean) {
    if (!enabled) return close()
    if (writer != null) return
    val dir = File(context.getExternalFilesDir(null) ?: context.filesDir, "broadcast-lab").apply { mkdirs() }
    val stamp = SimpleDateFormat("yyyyMMdd-HHmmss", Locale.US).format(Date())
    val file = File(dir, "stats-$stamp.csv")
    path = file.absolutePath
    writer = BufferedWriter(FileWriter(file, true)).also {
      it.write(
        "t_ms,state,preset,target_bps,measured_bps,fps,dropped_video,sent_video,queue_items,congested,quality," +
          "thermal,battery_pct,battery_temp_c,charging,overlay_age_ms,reconnect_attempt,pss_kb,marker,detail\n",
      )
    }
  }

  @Synchronized
  fun row(r: StatsRow) {
    val w = writer ?: return
    rows += 1
    val pss = if (rows % 5 == 0) Debug.getPss().toString() else ""
    w.write(
      listOf(
        System.currentTimeMillis(), r.state, r.preset, r.targetBps, r.measuredBps, r.fps, r.droppedVideo, r.sentVideo,
        r.queueItems, r.congested, r.quality, r.thermal ?: "", r.batteryPct ?: "", r.batteryTempC ?: "",
        r.charging ?: "", r.overlayAgeMs ?: "", r.reconnectAttempt, pss, "", "",
      ).joinToString(",") + "\n",
    )
    if (rows % 5 == 0) w.flush()
  }

  @Synchronized
  fun marker(name: String, detail: String) {
    val w = writer ?: return
    val safe = Redact.text(detail).replace(",", ";").replace("\n", " ")
    w.write("${System.currentTimeMillis()},,,,,,,,,,,,,,,,,,${name.take(40)},$safe\n")
    w.flush()
  }

  @Synchronized
  fun close() {
    runCatching { writer?.flush(); writer?.close() }
    writer = null
  }
}
