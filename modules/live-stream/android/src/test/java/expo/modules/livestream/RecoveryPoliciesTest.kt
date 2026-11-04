package expo.modules.livestream

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class RecoveryPoliciesTest {
  @Test fun backoffDoublesThenCapsAt30s() {
    val policy = ReconnectPolicy(random = { 0.5 }) // 0.5 → no jitter
    val delays = (0 until 7).map { policy.nextDelay(0L) }
    assertEquals(listOf(1_000L, 2_000L, 4_000L, 8_000L, 16_000L, 30_000L, 30_000L), delays)
  }

  @Test fun jitterStaysWithin20Percent() {
    assertEquals(800L, ReconnectPolicy(random = { 0.0 }).nextDelay(0L))
    assertEquals(1_200L, ReconnectPolicy(random = { 1.0 }).nextDelay(0L))
  }

  @Test fun windowExhaustsAndNeverReturnsBeyondIt() {
    val policy = ReconnectPolicy(windowMs = 10_000L, random = { 0.5 })
    assertNotNull(policy.nextDelay(0L))
    // 2 s backoff is clipped so the retry never lands after the window end (9 s + 1 s = 10 s).
    assertEquals(1_000L, policy.nextDelay(9_000L))
    assertTrue(policy.isExhausted(10_000L))
    assertNull(policy.nextDelay(10_000L))
    policy.reset()
    assertFalse(policy.isExhausted(10_000L))
    assertNotNull(policy.nextDelay(20_000L))
  }

  @Test fun rejectionNeedsThreeFailuresBeforeAnyPublish() {
    val tracker = RejectionTracker()
    assertFalse(tracker.onFailure())
    assertFalse(tracker.onFailure())
    assertTrue(tracker.onFailure())
  }

  @Test fun failuresAfterPublishAreNetworkNotRejection() {
    val tracker = RejectionTracker()
    tracker.onPublished()
    repeat(10) { assertFalse(tracker.onFailure()) }
  }

  @Test fun bitrateDropsUnderCongestionAndRespectsHardFloor() {
    val profile = BitrateProfiles.of(Preset.P720, Platform.YOUTUBE)
    val policy = BitratePolicy(profile)
    var now = 0L
    repeat(40) { policy.onSample(true, now); now += 1_000L }
    assertEquals(profile.hardFloor, policy.current)
    assertTrue(policy.degraded)
  }

  @Test fun bitrateDecreaseIsRateLimitedTo2s() {
    val policy = BitratePolicy(BitrateProfiles.of(Preset.P720, Platform.YOUTUBE))
    assertNotNull(policy.onSample(true, 0L))
    assertNull(policy.onSample(true, 1_000L))
    assertNotNull(policy.onSample(true, 2_000L))
  }

  @Test fun bitrateRecoversOnlyAfter20sStableAndNeverAboveCeiling() {
    val profile = BitrateProfiles.of(Preset.P720, Platform.FACEBOOK)
    val policy = BitratePolicy(profile)
    assertNull(policy.onSample(false, 0L))
    assertNull(policy.onSample(false, 19_000L))
    assertNotNull(policy.onSample(false, 20_000L))
    var now = 20_000L
    repeat(100) { now += 10_000L; policy.onSample(false, now) }
    assertEquals(profile.ceiling, policy.current)
  }

  @Test fun thermalCeilingScaleLowersBitrate() {
    val profile = BitrateProfiles.of(Preset.P1080, Platform.YOUTUBE)
    val policy = BitratePolicy(profile)
    policy.ceilingScale = 0.75
    assertEquals((profile.ceiling * 0.75).toInt(), policy.onSample(false, 0L))
  }

  @Test fun youtube720NominalFloorIsPlatformMinimum() {
    assertEquals(3_000_000, BitrateProfiles.of(Preset.P720, Platform.YOUTUBE).nominalFloor)
    assertEquals(5_000_000, BitrateProfiles.of(Preset.P1080, Platform.YOUTUBE).nominalFloor)
  }

  @Test fun fallbackTriggersOnlyWhenSustained() {
    val monitor = FallbackMonitor(sustainMs = 45_000L)
    assertFalse(monitor.onSample(true, 30, 0L))
    assertFalse(monitor.onSample(true, 30, 44_000L))
    assertTrue(monitor.onSample(true, 30, 45_000L))
    monitor.reset()
    assertFalse(monitor.onSample(false, 20, 0L))
    assertFalse(monitor.onSample(false, 30, 50_000L)) // recovered → timer reset
    assertFalse(monitor.onSample(false, 0, 100_000L)) // fps 0 = unknown, not bad
  }
}
