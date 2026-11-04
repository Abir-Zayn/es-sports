package expo.modules.livestream

import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.HandlerThread
import android.os.Looper

/**
 * Process-wide wiring between the Expo module (JS bridge), the engine and the foreground service. The engine is
 * independent of the JS thread: it lives as long as the process, on its own HandlerThread.
 */
object StreamHub {
  /** Set by the Expo module while JS is attached. Events are dropped (state stays queryable) when null. */
  @Volatile var emitter: ((String, Map<String, Any?>) -> Unit)? = null
  @Volatile var labMode: Boolean = false

  private var appContext: Context? = null
  private val thread by lazy { HandlerThread("es-live-stream").apply { start() } }
  val handler: Handler by lazy { Handler(thread.looper) }
  val mainHandler = Handler(Looper.getMainLooper())

  @Volatile private var engineRef: StreamEngine? = null
  @Volatile private var loggerRef: StatsLogger? = null

  @Synchronized
  fun init(context: Context) {
    if (appContext != null) return
    val app = context.applicationContext
    appContext = app
    loggerRef = StatsLogger(app)
    engineRef = StreamEngine(app, handler, loggerRef!!)
  }

  val engine: StreamEngine get() = engineRef ?: error("StreamHub.init was not called")
  val logger: StatsLogger? get() = loggerRef

  fun emit(name: String, body: Map<String, Any?>) {
    emitter?.invoke(name, body)
  }

  fun logMarker(name: String, detail: String) {
    loggerRef?.marker(name, detail)
  }

  /** Must be called while the app is visible (Android 14+ camera/mic FGS restriction). */
  fun startService(title: String) {
    val ctx = appContext ?: return
    val intent = Intent(ctx, LiveStreamService::class.java).putExtra(LiveStreamService.EXTRA_TITLE, title)
    mainHandler.post {
      try {
        if (Build.VERSION.SDK_INT >= 26) ctx.startForegroundService(intent) else ctx.startService(intent)
      } catch (e: Exception) {
        // ForegroundServiceStartNotAllowedException (12+) or SecurityException: app not in a state that may start it.
        onServiceFailed(e)
      }
    }
  }

  fun stopService() {
    val ctx = appContext ?: return
    mainHandler.post { ctx.stopService(Intent(ctx, LiveStreamService::class.java)) }
  }

  fun onServiceFailed(error: Throwable) {
    logMarker("fgs_failed", error.javaClass.simpleName)
    handler.post { engineRef?.fail(ErrorCode.E_FGS_NOT_ALLOWED, "Could not keep the stream running in the background.") }
  }
}
