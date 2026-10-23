import { initialsOf } from '../initials';

describe('initialsOf', () => {
  it('takes up to two initials', () => {
    expect(initialsOf('Rafi Hasan')).toBe('RH');
    expect(initialsOf('Tamim Iqbal Jr')).toBe('TI');
    expect(initialsOf('Nayeem')).toBe('N');
  });
});
