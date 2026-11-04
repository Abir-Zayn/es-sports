package expo.modules.livestream

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.opengl.GLES20
import android.opengl.GLUtils
import com.pedro.encoder.input.gl.render.filters.`object`.BaseObjectFilterRender

/**
 * Two reused ARGB bitmaps at stream resolution. The main thread draws into the back buffer and swaps; the GL thread
 * uploads the front buffer. A failed capture never swaps, so the last valid overlay stays on air (§6, R11).
 */
class OverlayBuffers(val width: Int, val height: Int) {
  private val lock = Any()
  private var back: Bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
  private var front: Bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
  private var dirty = false
  private var released = false
  @Volatile var lastAppliedAtMs: Long = 0L
    private set

  /** Main thread. Returns false (and keeps the previous overlay) when drawing throws. */
  fun draw(block: (Canvas) -> Unit): Boolean {
    val target = synchronized(lock) { if (released) return false else back }
    return try {
      target.eraseColor(Color.TRANSPARENT)
      block(Canvas(target))
      synchronized(lock) {
        if (released) return false
        back = front
        front = target
        dirty = true
      }
      true
    } catch (e: RuntimeException) {
      false
    }
  }

  /** GL thread. Holds the lock while uploading so the main thread cannot reuse the bitmap mid-upload. */
  fun consumeIfDirty(upload: (Bitmap) -> Unit) = synchronized(lock) {
    if (!dirty || released) return@synchronized
    upload(front)
    dirty = false
    lastAppliedAtMs = System.currentTimeMillis()
  }

  /** After the GL context is recreated the texture is gone; upload the current front again. */
  fun markDirty() = synchronized(lock) { if (!released) dirty = true }

  fun release() = synchronized(lock) {
    released = true
    back.recycle()
    front.recycle()
  }
}

/**
 * Full-frame overlay filter that keeps ONE texture and updates it with texSubImage2D. RootEncoder's ImageFilterRender
 * deletes and recreates its texture on every setImage(), which would allocate on every score change.
 */
class OverlayFilter : BaseObjectFilterRender() {
  @Volatile var buffers: OverlayBuffers? = null
  @Volatile var enabled: Boolean = true
  private var texWidth = 0
  private var texHeight = 0

  override fun drawFilter() {
    buffers?.consumeIfDirty(::upload)
    super.drawFilter()
    GLES20.glBindTexture(GLES20.GL_TEXTURE_2D, streamObjectTextureId[0])
    GLES20.glUniform1f(uAlphaHandle, if (streamObjectTextureId[0] == -1 || !enabled) 0f else alpha)
  }

  private fun upload(bitmap: Bitmap) {
    if (bitmap.isRecycled) return
    val id = streamObjectTextureId[0]
    if (id == -1 || texWidth != bitmap.width || texHeight != bitmap.height) {
      if (id != -1) GLES20.glDeleteTextures(1, streamObjectTextureId, 0)
      GLES20.glGenTextures(1, streamObjectTextureId, 0)
      GLES20.glBindTexture(GLES20.GL_TEXTURE_2D, streamObjectTextureId[0])
      GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_MIN_FILTER, GLES20.GL_LINEAR)
      GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_MAG_FILTER, GLES20.GL_LINEAR)
      GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_WRAP_S, GLES20.GL_CLAMP_TO_EDGE)
      GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_WRAP_T, GLES20.GL_CLAMP_TO_EDGE)
      GLUtils.texImage2D(GLES20.GL_TEXTURE_2D, 0, bitmap, 0)
      texWidth = bitmap.width
      texHeight = bitmap.height
    } else {
      GLES20.glBindTexture(GLES20.GL_TEXTURE_2D, id)
      GLUtils.texSubImage2D(GLES20.GL_TEXTURE_2D, 0, 0, 0, bitmap)
    }
  }

  override fun release() {
    super.release() // deletes the texture and resets the id to -1
    texWidth = 0
    texHeight = 0
    buffers?.markDirty()
  }
}

/** Process-wide owner of the overlay buffers and filter, shared by [OverlayHostView] and [StreamEngine]. */
object OverlayRegistry {
  val filter = OverlayFilter()
  @Volatile private var current: OverlayBuffers? = null

  @Synchronized
  fun ensure(width: Int, height: Int): OverlayBuffers {
    current?.let { if (it.width == width && it.height == height) return it }
    val next = OverlayBuffers(width, height)
    val old = current
    current = next
    filter.buffers = next
    old?.release()
    return next
  }

  fun overlayAgeMs(): Long? = current?.lastAppliedAtMs?.takeIf { it > 0 }?.let { System.currentTimeMillis() - it }

  @Synchronized
  fun release() {
    filter.buffers = null
    current?.release()
    current = null
  }
}
