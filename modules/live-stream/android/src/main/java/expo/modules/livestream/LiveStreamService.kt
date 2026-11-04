package expo.modules.livestream

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat

/**
 * Foreground service (camera|microphone) that keeps the process and capture alive while the UI is backgrounded.
 * It holds no stream state: the engine owns it. START_NOT_STICKY because Android 14+ forbids restarting camera/mic
 * capture from the background; recovery after process death is the user's explicit Resume (§8.3).
 */
class LiveStreamService : Service() {
  companion object {
    const val EXTRA_TITLE = "title"
    private const val CHANNEL_ID = "es_live_stream"
    private const val NOTIFICATION_ID = 7341
    private const val WAKE_LOCK_MAX_MS = 6 * 60 * 60 * 1000L
  }

  private var wakeLock: PowerManager.WakeLock? = null

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    // Title is fixed text ("Live on YouTube"); it never carries destination or key data.
    val title = Redact.text(intent?.getStringExtra(EXTRA_TITLE) ?: "Live broadcast")
    try {
      val types = if (Build.VERSION.SDK_INT >= 30) {
        ServiceInfo.FOREGROUND_SERVICE_TYPE_CAMERA or ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE
      } else 0
      ServiceCompat.startForeground(this, NOTIFICATION_ID, notification(title), types)
    } catch (e: Exception) {
      StreamHub.onServiceFailed(e)
      stopSelf()
      return START_NOT_STICKY
    }
    if (wakeLock == null) {
      val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
      wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "esSports:live-stream").apply {
        setReferenceCounted(false)
        acquire(WAKE_LOCK_MAX_MS)
      }
    }
    StreamHub.logMarker("fgs_started", "")
    return START_NOT_STICKY
  }

  /** Swipe-away: the stream keeps running (stopWithTask=false). OEMs may still kill us; that path is Resume. */
  override fun onTaskRemoved(rootIntent: Intent?) {
    StreamHub.logMarker("task_removed", "")
  }

  override fun onDestroy() {
    wakeLock?.let { if (it.isHeld) it.release() }
    wakeLock = null
    StreamHub.logMarker("fgs_destroyed", "")
    super.onDestroy()
  }

  private fun notification(title: String): Notification {
    val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    if (Build.VERSION.SDK_INT >= 26 && nm.getNotificationChannel(CHANNEL_ID) == null) {
      nm.createNotificationChannel(NotificationChannel(CHANNEL_ID, "Live broadcast", NotificationManager.IMPORTANCE_LOW))
    }
    val launch = packageManager.getLaunchIntentForPackage(packageName)?.let {
      PendingIntent.getActivity(this, 0, it, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
    }
    return NotificationCompat.Builder(this, CHANNEL_ID)
      .setSmallIcon(applicationInfo.icon)
      .setContentTitle(title)
      .setContentText("Tap to open the streamer console")
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .setCategory(NotificationCompat.CATEGORY_SERVICE)
      .setContentIntent(launch)
      .build()
  }
}
