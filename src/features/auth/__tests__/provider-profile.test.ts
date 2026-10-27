import { providerProfileFromMetadata } from '../provider-profile';

describe('providerProfileFromMetadata', () => {
  it('reads Google full_name and avatar_url', () => {
    expect(providerProfileFromMetadata({ full_name: 'Tanvir Rahman', avatar_url: 'https://lh3.googleusercontent.com/a/x' })).toEqual({
      fullName: 'Tanvir Rahman',
      avatarUrl: 'https://lh3.googleusercontent.com/a/x',
    });
  });

  it('falls back to name and picture', () => {
    expect(providerProfileFromMetadata({ name: 'Tanvir', picture: 'https://example.com/p.jpg' })).toEqual({
      fullName: 'Tanvir',
      avatarUrl: 'https://example.com/p.jpg',
    });
  });

  it('prefers full_name over name', () => {
    expect(providerProfileFromMetadata({ full_name: 'Full Name', name: 'Other' }).fullName).toBe('Full Name');
  });

  it('trims the name and cuts it to 40 characters', () => {
    expect(providerProfileFromMetadata({ full_name: `  ${'x'.repeat(60)}  ` }).fullName).toHaveLength(40);
  });

  it('ignores a name shorter than 2 characters and a photo that is not https', () => {
    expect(providerProfileFromMetadata({ full_name: 'A', avatar_url: 'http://example.com/p.jpg' })).toEqual({
      fullName: undefined,
      avatarUrl: undefined,
    });
  });

  it('ignores values that are not strings, and missing metadata', () => {
    expect(providerProfileFromMetadata({ full_name: 42, avatar_url: {} })).toEqual({ fullName: undefined, avatarUrl: undefined });
    expect(providerProfileFromMetadata(null)).toEqual({ fullName: undefined, avatarUrl: undefined });
    expect(providerProfileFromMetadata(undefined)).toEqual({ fullName: undefined, avatarUrl: undefined });
  });
});
