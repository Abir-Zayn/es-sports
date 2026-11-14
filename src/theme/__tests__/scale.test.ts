import { makeScale } from '../scale';

test('matches the spec on a 375pt-wide phone', () => {
  const { dp, sp } = makeScale(375, 812);
  expect(dp(16)).toBe(16);
  expect(sp(14)).toBe(14);
});

test('scales up on wider phones, fonts less than layout', () => {
  const { dp, sp } = makeScale(430, 932);
  // 430/375 = 1.1467 for layout, half that growth for fonts; results snap to the pixel grid.
  expect(Math.abs(dp(100) - 114.67)).toBeLessThanOrEqual(0.5);
  expect(Math.abs(sp(100) - 107.33)).toBeLessThanOrEqual(0.5);
});

test('clamps on very small and very large screens', () => {
  expect(makeScale(200, 400).dp(100)).toBe(85);
  expect(makeScale(1024, 1366).dp(100)).toBe(125);
  expect(makeScale(1024, 1366).sp(100)).toBe(115);
});

test('never returns NaN for a zero-size window', () => {
  const { dp, sp } = makeScale(0, 0);
  expect(dp(10)).toBe(10);
  expect(sp(10)).toBe(10);
});
