import { HandoverError, handoverErrorText, handoverMessage, toHandoverError } from '../handover-errors';

const failure = (code: string) => ({ code, message: 'raw server text' });

describe('handover error mapping', () => {
  it.each([
    ['ESH01', 'This scoring request is no longer open.'],
    ['ESH02', 'Scoring is already being handed over. Cancel that request first.'],
    ['ESH03', 'The scorer changed, so this request is no longer open.'],
    ['ESH05', 'This match is finished.'],
    ['42501', 'You are not allowed to do that for this match.'],
  ])('turns %s into a plain message, never the raw server text', (code, text) => {
    expect(handoverMessage(failure(code))).toBe(text);
  });

  it('names the scorer for ESH04, and falls back when the name is unknown', () => {
    expect(handoverMessage(failure('ESH04'), 'Rafi')).toBe('Rafi scored a moment ago. Try again after 15 minutes without a ball.');
    expect(handoverMessage(failure('ESH04'), '  ')).toMatch(/^The scorer scored a moment ago/);
    expect(handoverMessage(failure('ESH04'))).toMatch(/^The scorer scored a moment ago/);
  });

  it.each([[null], [undefined], ['boom'], [{ message: 'timeout' }], [failure('08006')]])(
    'treats %p as a connection problem', (error) => {
      expect(handoverMessage(error)).toBe('Could not reach the server. Check your connection and try again.');
    },
  );

  it.each([['ESH01', true], ['ESH03', true], ['ESH05', true], ['ESH02', false], ['ESH04', false], ['42501', false], ['08006', false]])(
    'marks %s as closed=%s, so the screen refetches instead of retrying', (code, closed) => {
      const error = toHandoverError(failure(code));
      expect(error).toBeInstanceOf(HandoverError);
      expect(error.code).toBe(code);
      expect(error.closed).toBe(closed);
    },
  );

  it('reads the text of a HandoverError as it is and maps anything else', () => {
    expect(handoverErrorText(toHandoverError(failure('ESH05')))).toBe('This match is finished.');
    expect(handoverErrorText(failure('ESH02'))).toMatch(/already being handed over/);
  });
});
