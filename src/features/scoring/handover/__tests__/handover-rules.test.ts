import { canOfferTakeover, expiryText, isOpen, minutesLeft } from '../handover-rules';
import type { Handover, TakeoverFacts } from '../types';

const NOW = Date.parse('2026-11-01T12:00:00Z');
const at = (minutes: number) => new Date(NOW + minutes * 60_000).toISOString();
const offer = (over: Partial<Handover> = {}): Handover => ({
  id: 'h1', matchId: 'm1', fromUser: 'a', toUser: 'b', initiatedBy: 'a', status: 'pending', expiresAt: at(10), ...over,
});
const facts = (over: Partial<TakeoverFacts> = {}): TakeoverFacts => ({
  creatorId: 'me', scorerId: 'other', status: 'live', friendly: true, lastBallAt: at(-20), ...over,
});

describe('an offer counts as open', () => {
  it('only while pending and before its expiry, whatever the stored status says', () => {
    expect(isOpen(offer(), NOW)).toBe(true);
    expect(isOpen(offer({ expiresAt: at(-1) }), NOW)).toBe(false);
    expect(isOpen(offer({ expiresAt: at(0) }), NOW)).toBe(false);
    for (const status of ['accepted', 'declined', 'cancelled', 'expired'] as const) expect(isOpen(offer({ status }), NOW)).toBe(false);
  });

  it('is not open when the expiry cannot be read', () => {
    expect(isOpen(offer({ expiresAt: 'soon' }), NOW)).toBe(false);
  });

  it('shows the minutes left, at least 1 while open, never NaN', () => {
    expect(minutesLeft(offer({ expiresAt: at(15) }), NOW)).toBe(15);
    expect(minutesLeft(offer({ expiresAt: new Date(NOW + 5_000).toISOString() }), NOW)).toBe(1);
    expect(minutesLeft(offer({ expiresAt: at(-3) }), NOW)).toBe(0);
    expect(minutesLeft(offer({ expiresAt: 'soon' }), NOW)).toBe(0);
    expect(minutesLeft(offer(), Number.NaN)).toBe(0);
    expect(expiryText(offer({ expiresAt: at(12) }), NOW)).toBe('Expires in 12 min');
    expect(expiryText(offer({ expiresAt: at(-1) }), NOW)).toBe('Expired');
  });
});

describe('the creator takeover button', () => {
  it('shows for a live friendly whose other scorer has had no ball for 15 minutes', () => {
    expect(canOfferTakeover(facts({ lastBallAt: at(-15) }), 'me', NOW)).toBe(true);
    expect(canOfferTakeover(facts({ lastBallAt: at(-90) }), 'me', NOW)).toBe(true);
  });

  it('shows when the match has no ball yet', () => {
    expect(canOfferTakeover(facts({ lastBallAt: null }), 'me', NOW)).toBe(true);
  });

  it('hides while the scorer was active within 15 minutes', () => {
    expect(canOfferTakeover(facts({ lastBallAt: at(-14) }), 'me', NOW)).toBe(false);
  });

  it.each([
    ['the match is not live', { status: 'completed' }],
    ['the match is scheduled', { status: 'scheduled' }],
    ['it is not a friendly', { friendly: false }],
    ['the viewer did not create it', { creatorId: 'someone' }],
    ['the creator is the scorer already', { scorerId: 'me' }],
    ['the newest ball time cannot be read', { lastBallAt: 'never' }],
  ] as const)('hides when %s', (_label, over) => {
    expect(canOfferTakeover(facts(over), 'me', NOW)).toBe(false);
  });

  it('hides without facts or a signed-in user', () => {
    expect(canOfferTakeover(null, 'me', NOW)).toBe(false);
    expect(canOfferTakeover(undefined, 'me', NOW)).toBe(false);
    expect(canOfferTakeover(facts(), undefined, NOW)).toBe(false);
  });
});
