package expo.modules.livestream

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.os.BatteryManager
import android.os.Build
import android.os.Handler
import android.os.PowerManager

data class BatterySample(val percent: Int, val charging: Boolean, val temperatureC: Double)

/**
 * Thermal status (API 29+), battery and network availability while a stream runs. All callbacks are delivered on
 * [handler] (the engine thread). [start] and [stop] are idempotent; [stop] unregisters everything.
 */
class DeviceMonitors(
  private val context: Context,
  private val handler: Handler,
  private val onThermal: (Int) -> Unit,
  private val onBattery: (BatterySample) -> Unit,
  private val onNetwork: (Boolean) -> Unit,
) {
  private var running = false
  private var thermalListener: PowerManager.OnThermalStatusChangedListener? = null
  @Volatile var networkAvailable: Boolean = true
    private set
  var lastBattery: BatterySample? = null
    private set
  var lastThermal: Int? = null
    private set

  private val batteryReceiver = object : BroadcastReceiver() {
    override fun onReceive(ctx: Context, intent: Intent) {
      val level = intent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1)
      val scale = intent.getIntExtra(BatteryManager.EXTRA_SCALE, 100).coerceAtLeast(1)
      val status = intent.getIntExtra(BatteryManager.EXTRA_STATUS, -1)
      val tenthsC = intent.getIntExtra(BatteryManager.EXTRA_TEMPERATURE, 0)
      val sample = BatterySample(
        percent = if (level < 0) -1 else level * 100 / scale,
        charging = status == BatteryManager.BATTERY_STATUS_CHARGING || status == BatteryManager.BATTERY_STATUS_FULL,
        temperatureC = tenthsC / 10.0,
      )
      handler.post { lastBattery = sample; onBattery(sample) }
    }
  }

  private val networkCallback = object : ConnectivityManager.NetworkCallback() {
    override fun onAvailable(network: Network) {
      handler.post {
        val was = networkAvailable
        networkAvailable = true
        if (!was) onNetwork(true)
      }
    }

    override fun onLost(network: Network) {
      handler.post { refreshNetwork() }
    }
  }

  private val connectivity get() = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager

  fun start() {
    if (running) return
    running = true
    context.registerReceiver(batteryReceiver, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
    if (Build.VERSION.SDK_INT >= 29) {
      val pm = context.getSystemService(Context.POWER_SERVICE) as PowerManager
      lastThermal = pm.currentThermalStatus
      // The executor already runs on the engine thread, so the listener body needs no extra post.
      val listener = PowerManager.OnThermalStatusChangedListener { status -> lastThermal = status; onThermal(status) }
      pm.addThermalStatusListener({ runnable -> handler.post(runnable) }, listener)
      thermalListener = listener
    }
    val request = NetworkRequest.Builder().addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET).build()
    runCatching { connectivity.registerNetworkCallback(request, networkCallback) }
    refreshNetwork()
  }

  fun stop() {
    if (!running) return
    running = false
    runCatching { context.unregisterReceiver(batteryReceiver) }
    if (Build.VERSION.SDK_INT >= 29) {
      thermalListener?.let { (context.getSystemService(Context.POWER_SERVICE) as PowerManager).removeThermalStatusListener(it) }
    }
    thermalListener = null
    runCatching { connectivity.unregisterNetworkCallback(networkCallback) }
  }

  /** Lab only (S10): feed a fake reading through the real policy path. */
  fun simulateThermal(status: Int) = handler.post { lastThermal = status; onThermal(status) }
  fun simulateBattery(percent: Int) = handler.post {
    val sample = BatterySample(percent, false, lastBattery?.temperatureC ?: 0.0)
    lastBattery = sample
    onBattery(sample)
  }

  private fun refreshNetwork() {
    val caps = runCatching { connectivity.getNetworkCapabilities(connectivity.activeNetwork) }.getOrNull()
    val available = caps?.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) == true
    if (available != networkAvailable) {
      networkAvailable = available
      onNetwork(available)
    }
  }
}
