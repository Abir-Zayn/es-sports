import { fake } from '../../__fixtures__/supabase-fake';
import { removeTeamPhotos, uploadTeamPhoto } from '../team-images';
import { TournamentError } from '../tournament-errors';

jest.mock('@/lib/supabase', () => ({ supabase: jest.requireActual('../../__fixtures__/supabase-fake').fake }));

const originalFetch = globalThis.fetch;

describe('team photo storage helpers', () => {
  beforeEach(() => {
    fake.reset();
    globalThis.fetch = jest.fn(async () => ({
      ok: true,
      headers: { get: () => 'image/png' },
      arrayBuffer: async () => new ArrayBuffer(1024),
    })) as unknown as typeof fetch;
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  it('uploads profile and cover photos under teams/<teamId>/ and returns public URLs', async () => {
    const url = await uploadTeamPhoto('team-1', 'profile', 'file:///logo.png');
    expect(url).toMatch(/^https:\/\/example\.supabase\.co\/storage\/v1\/object\/public\/avatars\/teams\/team-1\/profile-/);
    expect(fake.storageUploads).toHaveLength(1);
    expect(fake.storageUploads[0]).toMatchObject({ bucket: 'avatars', contentType: 'image/png' });
    expect(fake.storageUploads[0].path).toMatch(/^teams\/team-1\/profile-/);

    const coverUrl = await uploadTeamPhoto('team-1', 'cover', 'file:///cover.jpg');
    expect(coverUrl).toMatch(/\/teams\/team-1\/cover-/);
  });

  it('rejects files larger than 2 MB and unreadable local URIs', async () => {
    globalThis.fetch = jest.fn(async () => ({
      ok: true,
      headers: { get: () => 'image/jpeg' },
      arrayBuffer: async () => new ArrayBuffer(2 * 1024 * 1024 + 1),
    })) as unknown as typeof fetch;
    await expect(uploadTeamPhoto('team-1', 'profile', 'file:///huge.jpg')).rejects.toThrow('Images must be under 2 MB');

    globalThis.fetch = jest.fn(async () => ({ ok: false })) as unknown as typeof fetch;
    await expect(uploadTeamPhoto('team-1', 'cover', 'file:///bad.jpg')).rejects.toBeInstanceOf(TournamentError);
  });

  it('removes only unique paths belonging to the team and retries once on error', async () => {
    const prefix = 'https://example.supabase.co/storage/v1/object/public/avatars';
    fake.storageRemoveResult = { error: { message: 'temporary failure' } };
    await removeTeamPhotos(
      'team-1',
      [
        `${prefix}/teams/team-1/profile-1`,
        `${prefix}/teams/team-1/profile-1?t=2`,
        `${prefix}/teams/team-2/profile-other`,
        `${prefix}/user-1/team/team-1/cover-legacy`,
        'https://external.example.com/other.png',
        null,
      ],
      'user-1',
    );
    expect(fake.storageRemovals).toHaveLength(2);
    expect(fake.storageRemovals[0]).toEqual({
      bucket: 'avatars',
      paths: ['teams/team-1/profile-1', 'user-1/team/team-1/cover-legacy'],
    });
  });
});
