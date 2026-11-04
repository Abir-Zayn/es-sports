package expo.modules.livestream

import android.Manifest
import android.app.ActivityManager
import android.content.Context
import android.content.pm.PackageManager
import android.graphics.SurfaceTexture
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraManager
import android.media.MediaCodecInfo
import android.media.MediaCodecList
import android.net.ConnectivityManager
import android.os.BatteryManager
import android.os.Build
import android.os.PowerManager
import androidx.core.content.ContextCompat

/** Preflight of §3.1. Read-only; safe to call repeatedly. Facts are reported even when a check fails. */
class DeviceEligibility(private val context: Context) {
  companion object {
    /** Marketed 4 GB phones report ~3.5–3.8 GiB in totalMem. Tuned in Phase 0. */
    const val MIN_TOTAL_MEM_BYTES = 3_543_348_019L // 3.3 GiB
    const val MIN_ADVERTISED_MEM_BYTES = 3_900_000_000L
    const val MIN_BATTERY_PCT = 10
  }

  private data class Encoder(val name: String, val hardware: Boolean, val caps: MediaCodecInfo.VideoCapabilities?)

  fun evaluate(): Map<String, Any?> {
    val am = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
    val mem = ActivityManager.MemoryInfo().also { am.getMemoryInfo(it) }
    val advertised = if (Build.VERSION.SDK_INT >= 34) mem.advertisedMem else null
    val ramOk = if (advertised != null && advertised > 0) advertised >= MIN_ADVERTISED_MEM_BYTES else mem.totalMem >= MIN_TOTAL_MEM_BYTES

    val encoders = avcEncoders()
    val hw = encoders.filter { it.hardware }
    val cameraOk = granted(Manifest.permission.CAMERA)
    val micOk = granted(Manifest.permission.RECORD_AUDIO)
    val thermal = thermalStatus()
    val battery = batteryPercent()
    val charging = isCharging()

    val common = mutableListOf<String>()
    if (!ramOk) common += "This phone has less than 4 GB RAM."
    if (hw.isEmpty()) common += "No hardware H.264 video encoder found."
    if (!cameraOk) common += "Camera permission is needed."
    if (!micOk) common += "Microphone permission is needed."
    if (thermal != null && thermal >= PowerManager.THERMAL_STATUS_SEVERE) common += "The phone is too hot. Let it cool down."
    if (battery != null && battery < MIN_BATTERY_PCT && !charging) common += "Battery is below $MIN_BATTERY_PCT%. Connect a charger."

    fun preset(p: Preset): Map<String, Any?> {
      val reasons = common.toMutableList()
      val bitrate = BitrateProfiles.of(p, Platform.YOUTUBE).ceiling
      if (hw.isNotEmpty() && hw.none { supports(it.caps, p, bitrate) }) reasons += "Hardware encoder cannot do ${p.js}."
      if (cameraOk && !backCameraSupports(p)) reasons += "Back camera cannot capture ${p.width}×${p.height}."
      return mapOf("ok" to reasons.isEmpty(), "reasons" to reasons)
    }

    return mapOf(
      "apiLevel" to Build.VERSION.SDK_INT,
      "totalMemBytes" to mem.totalMem.toDouble(),
      "advertisedMemBytes" to advertised?.toDouble(),
      "meetsRam" to ramOk,
      "encoders" to encoders.map { mapOf("name" to it.name, "hardware" to it.hardware) },
      "thermalStatus" to thermal,
      "batteryPercent" to battery,
      "charging" to charging,
      "upstreamKbps" to upstreamKbps(),
      "presets" to mapOf(Preset.P720.js to preset(Preset.P720), Preset.P1080.js to preset(Preset.P1080)),
    )
  }

  private fun avcEncoders(): List<Encoder> = MediaCodecList(MediaCodecList.REGULAR_CODECS).codecInfos
    .filter { info -> info.isEncoder && info.supportedTypes.any { it.equals("video/avc", ignoreCase = true) } }
    .map { info ->
      val hardware = if (Build.VERSION.SDK_INT >= 29) info.isHardwareAccelerated && !info.isSoftwareOnly
      else !info.name.startsWith("OMX.google.", true) && !info.name.startsWith("c2.android.", true)
      val caps = runCatching { info.getCapabilitiesForType("video/avc").videoCapabilities }.getOrNull()
      Encoder(info.name, hardware, caps)
    }

  private fun supports(caps: MediaCodecInfo.VideoCapabilities?, p: Preset, bitrate: Int): Boolean {
    if (caps == null) return false
    val sizeRate = runCatching { caps.areSizeAndRateSupported(p.width, p.height, p.fps.toDouble()) }.getOrDefault(false)
    if (!sizeRate || !caps.bitrateRange.contains(bitrate)) return false
    if (Build.VERSION.SDK_INT >= 29) {
      val points = caps.supportedPerformancePoints
      if (!points.isNullOrEmpty()) {
        val wanted = MediaCodecInfo.VideoCapabilities.PerformancePoint(p.width, p.height, p.fps)
        return points.any { it.covers(wanted) }
      }
    }
    return true
  }

  private fun backCameraSupports(p: Preset): Boolean = runCatching {
    val cm = context.getSystemService(Context.CAMERA_SERVICE) as CameraManager
    cm.cameraIdList.any { id ->
      val ch = cm.getCameraCharacteristics(id)
      ch.get(CameraCharacteristics.LENS_FACING) == CameraCharacteristics.LENS_FACING_BACK &&
        ch.get(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP)
          ?.getOutputSizes(SurfaceTexture::class.java)
          ?.any { it.width == p.width && it.height == p.height } == true
    }
  }.getOrDefault(false)

  private fun granted(permission: String) =
    ContextCompat.checkSelfPermission(context, permission) == PackageManager.PERMISSION_GRANTED

  private fun thermalStatus(): Int? = if (Build.VERSION.SDK_INT >= 29) {
    (context.getSystemService(Context.POWER_SERVICE) as PowerManager).currentThermalStatus
  } else null

  private fun batteryPercent(): Int? =
    (context.getSystemService(Context.BATTERY_SERVICE) as BatteryManager)
      .getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY).takeIf { it in 0..100 }

  private fun isCharging(): Boolean =
    (context.getSystemService(Context.BATTERY_SERVICE) as BatteryManager).isCharging

  /** Advisory only: the OS estimate is often wrong. Never blocks streaming. */
  private fun upstreamKbps(): Int? = runCatching {
    val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
    cm.getNetworkCapabilities(cm.activeNetwork)?.linkUpstreamBandwidthKbps
  }.getOrNull()
}
