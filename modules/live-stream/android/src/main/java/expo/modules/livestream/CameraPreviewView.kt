package expo.modules.livestream

import android.content.Context
import android.view.SurfaceView
import android.view.ViewGroup
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView

/**
 * Camera preview surface. Binding is tied to window attachment; the stream itself never depends on this view, so
 * leaving the screen or backgrounding only stops the preview (camera keeps feeding the encoder while live).
 */
class CameraPreviewView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  private val surface = SurfaceView(context).also {
    it.layoutParams = ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
    addView(it)
  }

  init {
    StreamHub.init(context)
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    StreamHub.engine.bindPreview(surface)
  }

  override fun onDetachedFromWindow() {
    StreamHub.engine.unbindPreview(surface)
    super.onDetachedFromWindow()
  }

  override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
    surface.layout(0, 0, r - l, b - t)
  }
}
