package expo.modules.livestream

import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class StreamTypesTest {
  @After fun clearSecrets() = Redact.clear()

  @Test fun stateMachineAllowsTheDocumentedPath() {
    val path = listOf(
      NativeState.IDLE, NativeState.PREPARING, NativeState.CONNECTING, NativeState.LIVE, NativeState.RECONNECTING,
      NativeState.LIVE, NativeState.STOPPING, NativeState.STOPPED, NativeState.IDLE,
    )
    path.zipWithNext().forEach { (a, b) -> assertTrue("$a -> $b", StreamStateMachine.canTransition(a, b)) }
  }

  @Test fun stateMachineRejectsShortcuts() {
    assertFalse(StreamStateMachine.canTransition(NativeState.IDLE, NativeState.LIVE))
    assertFalse(StreamStateMachine.canTransition(NativeState.LIVE, NativeState.ERROR))
    assertFalse(StreamStateMachine.canTransition(NativeState.STOPPED, NativeState.LIVE))
    assertTrue(StreamStateMachine.canTransition(NativeState.ERROR, NativeState.CONNECTING)) // retry()
    assertTrue(StreamStateMachine.canTransition(NativeState.LIVE, NativeState.PREPARING)) // preset fallback
  }

  @Test fun facebookRequiresRtmps() {
    assertNull(Destination.parse("rtmp://live-api-s.facebook.com:80/rtmp", "FB-123", Platform.FACEBOOK))
    assertNotNull(Destination.parse("rtmps://live-api-s.facebook.com:443/rtmp/", "FB-123?s_bl=1", Platform.FACEBOOK))
  }

  @Test fun youtubeAcceptsRtmpsAndRtmp() {
    val dest = Destination.parse("rtmps://a.rtmp.youtube.com/live2/", "abcd-efgh-ijkl", Platform.YOUTUBE)
    assertEquals("rtmps://a.rtmp.youtube.com/live2/abcd-efgh-ijkl", dest?.endpoint)
    assertEquals("a.rtmp.youtube.com", dest?.host)
    assertNotNull(Destination.parse("rtmp://a.rtmp.youtube.com/live2", "k", Platform.YOUTUBE))
  }

  @Test fun destinationRejectsJunk() {
    assertNull(Destination.parse("https://youtube.com/live2", "k", Platform.YOUTUBE))
    assertNull(Destination.parse("rtmps://a.rtmp.youtube.com/live2", "", Platform.YOUTUBE))
    assertNull(Destination.parse("rtmps://a.rtmp.youtube.com/live2", "has space", Platform.YOUTUBE))
  }

  @Test fun redactRemovesUrlsRegisteredSecretsAndKeyLikeTokens() {
    Redact.register("abcd-efgh-ijkl-mnop")
    val out = Redact.text("failed rtmps://a.rtmp.youtube.com/live2/xyz key abcd-efgh-ijkl-mnop token Zx9Qw8Er7Ty6Ui5Op4")
    assertFalse(out.contains("youtube.com"))
    assertFalse(out.contains("abcd-efgh-ijkl-mnop"))
    assertFalse(out.contains("Zx9Qw8Er7Ty6Ui5Op4"))
  }

  @Test fun redactKeepsOrdinaryWords() {
    assertEquals("IllegalStateException in encoder", Redact.text("IllegalStateException in encoder"))
  }
}
