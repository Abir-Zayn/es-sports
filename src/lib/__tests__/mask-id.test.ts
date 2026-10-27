import { maskId } from '../mask-id';

describe('maskId', () => {
  it('shows only the last 4 characters', () => {
    expect(maskId('1990123456789')).toBe('•••• 6789');
  });

  it('leaves a short value as is', () => {
    expect(maskId('1234')).toBe('1234');
  });

  it('honours a custom visible length', () => {
    expect(maskId('1990123456789', 2)).toBe('•••• 89');
  });
});
