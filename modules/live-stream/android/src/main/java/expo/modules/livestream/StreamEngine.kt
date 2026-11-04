package expo.modules.livestream

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.media.MediaCodec
import android.media.MediaCodecInfo
import android.os.Handler
import android.view.SurfaceView
import androidx.core.content.ContextCompat
import com.pedro.encoder.CodecErrorCallback
import com.pedro.encoder.input.sources.audio.MicrophoneSource
import com.pedro.encoder.input.sources.video.Camera2Source
import com.pedro.encoder.utils.CodecUtil
import com.pedro.library.rtmp.RtmpStream

/**
 * Owns the RootEncoder stream and the §4.1 state machine. Every mutation runs on [handler] (one engine thread),
 * so the stream keeps its lifecycle, reconnect and ABR while the JS thread is frozen or detached.
 */
class StreamEngine(
  private val context: Context,
  internal val handler: Handler,
  internal val logger: StatsLogger,
) {
  @Volatile var state: NativeState = NativeState.IDLE
    private set
  @Volatile internal var stream: RtmpStream? = null
  @Volatile internal var preset: Preset = Preset.P720
  @Volatile internal var platform: Platform = Platform.YOUTUBE
  @Volatile internal var sessionId: String? = null
  @Volatile internal var bitrate: BitratePolicy? = null
  @Volatile internal var fps: Int = 0
  @Volatile internal var measuredBps: Long = 0
  @Volatile private var lastError: Pair<ErrorCode, String>? = null
  private var preparedKey: Pair<Preset, Int>? = null
  private var destination: Destination? = null
  private var previewView: SurfaceView? = null
  internal val reconnect = ReconnectPolicy()
  internal val fallback = FallbackMonitor()
  private val callbacks = EngineCallbacks(this)
  internal val monitors = DeviceMonitors(context, handler, callbacks::onThermal, callbacks::onBattery, callbacks::onNetwork)
  internal val telemetry = StreamTelemetry(this)
  internal val recovery = ReconnectScheduler(this)

  // --- Public API (any thread) ---------------------------------------------------------------------------------

  fun start(session: String, platform: Platform, url: String, key: String, preset: Preset) = handler.post {
    if (state != NativeState.IDLE) return@post emitError(ErrorCode.E_UNKNOWN, "A stream is already running.", false)
    lastError = null
    transition(NativeState.PREPARING)
    val dest = Destination.parse(url, key, platform)
      ?: return@post fail(ErrorCode.E_INVALID_DESTINATION, "The server URL or stream key is not valid. Facebook needs rtmps://.")
    Redact.register(url.trim(), key.trim(), dest.endpoint)
    sessionId = session
    this.platform = platform
    this.preset = preset
    destination = dest
    if (!hasPermissions()) return@post fail(ErrorCode.E_PERMISSION, "Camera and microphone permission are needed.")
    if (!prepare(preset, platform)) return@post fail(ErrorCode.E_ENCODER_INIT, "The video encoder could not start at ${preset.js}.")
    bitrate = BitratePolicy(BitrateProfiles.of(preset, platform))
    reconnect.reset(); callbacks.resetRejection(); fallback.reset()
    monitors.start()
    StreamHub.startService("Live on ${if (platform == Platform.YOUTUBE) "YouTube" else "Facebook"}")
    connect()
  }

  fun stop(reason: StopReason) = handler.post { stopInternal(reason) }

  fun retry() = handler.post {
    if (state != NativeState.ERROR || destination == null) return@post
    reconnect.reset(); callbacks.resetRejection()
    connect()
  }

  fun setPreset(next: Preset) = handler.post {
    if (state != NativeState.IDLE || next == preset) return@post
    preset = next
    if (previewView != null && hasPermissions()) prepare(next, platform)
  }

  /** Main thread (view attach). RootEncoder auto-handles surface create/destroy synchronously on the main thread. */
  fun bindPreview(view: SurfaceView) = handler.post {
    previewView = view
    if (!hasPermissions()) return@post emitError(ErrorCode.E_PERMISSION, "Camera and microphone permission are needed.", false)
    if (!prepare(preset, platform)) return@post emitError(ErrorCode.E_ENCODER_INIT, "Camera preview could not start.", false)
    startPreviewOn(view)
  }

  fun unbindPreview(view: SurfaceView) = handler.post {
    if (previewView !== view) return@post
    previewView = null
    stream?.let { s -> runCatching { if (s.isOnPreview) s.stopPreview(true) } }
    releaseIfIdle()
  }

  fun status(): Map<String, Any?> = telemetry.status(lastError)

  // --- Engine thread internals ---------------------------------------------------------------------------------

  internal fun transition(to: NativeState, reason: StopReason? = null) {
    val from = state
    if (!StreamStateMachine.canTransition(from, to)) {
      logger.marker("illegal_transition", "${from.js}->${to.js}")
      return
    }
    state = to
    logger.marker("state", "${from.js}->${to.js} ${reason?.js ?: ""}")
    StreamHub.emit("onStateChange", mapOf("state" to to.js, "previous" to from.js, "reason" to reason?.js, "sessionId" to sessionId))
  }

  internal fun connect() {
    val s = stream ?: return fail(ErrorCode.E_ENCODER_INIT, "The stream is not prepared.")
    val dest = destination ?: return fail(ErrorCode.E_INVALID_DESTINATION, "No destination.")
    transition(NativeState.CONNECTING)
    s.getStreamClient().apply { setLogs(false); setReTries(10_000); resizeCache(StreamConstants.SEND_CACHE_ITEMS) }
    try {
      if (!s.isStreaming) s.startStream(dest.endpoint)
      else if (!s.getStreamClient().reTry(0, "retry")) return fail(ErrorCode.E_NETWORK_EXHAUSTED, "Reconnect attempts exhausted.")
      s.getGlInterface().setFilter(OverlayRegistry.filter)
      telemetry.start()
    } catch (e: RuntimeException) {
      fail(ErrorCode.E_UNKNOWN, Redact.text(e.message ?: e.javaClass.simpleName))
    }
  }

  internal fun fail(code: ErrorCode, message: String) {
    recovery.cancel(); telemetry.stop()
    stream?.let { s -> runCatching { if (s.isStreaming) s.stopStream() } }
    if (StreamStateMachine.canTransition(state, NativeState.ERROR)) {
      lastError = code to message
      transition(NativeState.ERROR)
      emitError(code, message, code.fatal)
    } else {
      emitError(code, message, true)
      stopInternal(StopReason.FATAL)
    }
  }

  internal fun stopInternal(reason: StopReason) {
    if (state == NativeState.IDLE || state == NativeState.STOPPING || state == NativeState.STOPPED) return
    transition(NativeState.STOPPING, reason)
    recovery.cancel(); telemetry.stop(); monitors.stop()
    stream?.let { s -> runCatching { if (s.isStreaming) s.stopStream() } }
    StreamHub.stopService()
    Redact.clear()
    destination = null
    bitrate = null
    transition(NativeState.STOPPED, reason)
    transition(NativeState.IDLE)
    releaseIfIdle()
  }

  internal fun emitError(code: ErrorCode, message: String, fatal: Boolean) {
    val safe = Redact.text(message)
    logger.marker("error", "${code.name} $safe")
    StreamHub.emit("onError", mapOf("code" to code.name, "fatal" to fatal, "message" to safe))
  }

  internal fun presetFallback(reason: String) {
    if (preset != Preset.P1080 || state != NativeState.LIVE) return
    StreamHub.emit("onPresetFallback", mapOf("from" to Preset.P1080.js, "to" to Preset.P720.js, "reason" to reason))
    transition(NativeState.PREPARING)
    telemetry.stop()
    stream?.let { s -> runCatching { if (s.isStreaming) s.stopStream() } }
    preset = Preset.P720
    if (!prepare(Preset.P720, platform)) return fail(ErrorCode.E_ENCODER_INIT, "Could not restart at 720p.")
    bitrate = BitratePolicy(BitrateProfiles.of(Preset.P720, platform))
    fallback.reset()
    connect()
  }

  private fun ensureStream(): RtmpStream = stream ?: RtmpStream(context, callbacks, Camera2Source(context), MicrophoneSource()).also { s ->
    s.setFpsListener { value -> fps = value }
    s.setEncoderErrorCallback(object : CodecErrorCallback {
      override fun onCodecError(type: CodecUtil.CodecTypeError, e: MediaCodec.CodecException) {
        handler.post { fail(ErrorCode.E_ENCODER_INIT, "Encoder error (${type.name}).") }
      }
    })
    stream = s
  }

  /** prepareVideo/Audio require preview and stream stopped; the preview is restarted afterwards. */
  private fun prepare(p: Preset, pl: Platform): Boolean {
    val start = BitrateProfiles.of(p, pl).start
    if (preparedKey == (p to start) && stream != null) return true
    val s = ensureStream()
    val hadPreview = s.isOnPreview
    if (hadPreview) runCatching { s.stopPreview() }
    val k = StreamConstants.KEYFRAME_INTERVAL_S
    val ok = runCatching {
      (s.prepareVideo(p.width, p.height, start, p.fps, k, 0, MediaCodecInfo.CodecProfileLevel.AVCProfileHigh) ||
        s.prepareVideo(p.width, p.height, start, p.fps, k, 0)) &&
        s.prepareAudio(StreamConstants.AUDIO_SAMPLE_RATE, true, StreamConstants.AUDIO_BITRATE)
    }.getOrDefault(false)
    preparedKey = if (ok) p to start else null
    if (ok && hadPreview) previewView?.let(::startPreviewOn)
    return ok
  }

  private fun startPreviewOn(view: SurfaceView) {
    val s = stream ?: return
    if (s.isOnPreview) return
    runCatching { s.startPreview(view, true); s.getGlInterface().setFilter(OverlayRegistry.filter) }
      .onFailure { emitError(ErrorCode.E_CAMERA, "Camera could not start: ${it.javaClass.simpleName}", false) }
  }

  /** Frees camera, encoders and overlay memory when nothing needs them (G4). */
  private fun releaseIfIdle() {
    if (state != NativeState.IDLE || previewView != null) return
    stream?.let { s -> runCatching { s.release() } }
    stream = null
    preparedKey = null
    StreamHub.mainHandler.post { OverlayRegistry.release() }
  }

  private fun hasPermissions() = listOf(Manifest.permission.CAMERA, Manifest.permission.RECORD_AUDIO)
    .all { ContextCompat.checkSelfPermission(context, it) == PackageManager.PERMISSION_GRANTED }

  internal companion object {
    val ACTIVE = setOf(NativeState.CONNECTING, NativeState.LIVE, NativeState.RECONNECTING)
  }
}
