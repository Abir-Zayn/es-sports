import { deleteAvatar, isLocalImage, toDbPatch, toStoredProfile } from '../profile-repository';

const mockList = jest.fn();
const mockRemove = jest.fn();
jest.mock('@/lib/supabase', () => ({
  supabase: {
    storage: {
      from: jest.fn(() => ({
        list: mockList,
        remove: mockRemove,
      })),
    },
  },
}));

describe('toStoredProfile', () => {
  it('combines the public and private rows', () => {
    expect(
      toStoredProfile(
        { full_name: 'Tanvir', avatar_url: 'https://x/a.jpg', area: 'Halishahar', district: 'Chattogram', role: 'bowler', batting_style: 'left' },
        { phone: '01712345678', national_id: '1990123456789', blood_group: 'B+' },
      ),
    ).toEqual({
      fullName: 'Tanvir',
      avatarUrl: 'https://x/a.jpg',
      area: 'Halishahar',
      district: 'Chattogram',
      role: 'bowler',
      battingStyle: 'left',
      phone: '01712345678',
      nationalId: '1990123456789',
      bloodGroup: 'B+',
    });
  });

  it('uses null for the private fields when there is no private row yet', () => {
    const stored = toStoredProfile(
      { full_name: null, avatar_url: null, area: null, district: null, role: null, batting_style: null },
      null,
    );
    expect(stored.phone).toBeNull();
    expect(stored.nationalId).toBeNull();
    expect(stored.bloodGroup).toBeNull();
  });
});

describe('toDbPatch', () => {
  it('sends name and photo changes to profiles only', () => {
    expect(toDbPatch({ fullName: 'New', avatarUrl: null })).toEqual({ profile: { full_name: 'New', avatar_url: null }, private: {} });
  });

  it('sends phone, National ID and blood group to the private table', () => {
    expect(toDbPatch({ phone: '017', nationalId: '123', bloodGroup: 'O-' })).toEqual({
      profile: {},
      private: { phone: '017', national_id: '123', blood_group: 'O-' },
    });
  });

  it('leaves out fields that were not given, so they are not overwritten', () => {
    expect(toDbPatch({ area: 'Agrabad' })).toEqual({ profile: { area: 'Agrabad' }, private: {} });
    expect(toDbPatch({})).toEqual({ profile: {}, private: {} });
  });
});

describe('isLocalImage', () => {
  it('tells device photos from hosted ones', () => {
    expect(isLocalImage('file:///data/user/0/cache/ImagePicker/x.jpg')).toBe(true);
    expect(isLocalImage('content://media/picker/0/x')).toBe(true);
    expect(isLocalImage('https://lh3.googleusercontent.com/a/x')).toBe(false);
  });
});

describe('deleteAvatar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists the user folder and removes all old avatars', async () => {
    mockList.mockResolvedValueOnce({ data: [{ name: 'avatar-1.jpg' }, { name: 'avatar-2.jpg' }] });
    mockRemove.mockResolvedValueOnce({ data: [], error: null });
    await deleteAvatar('user-123');
    expect(mockList).toHaveBeenCalledWith('user-123');
    expect(mockRemove).toHaveBeenCalledWith(['user-123/avatar-1.jpg', 'user-123/avatar-2.jpg']);
  });

  it('does nothing if no files exist in the user folder', async () => {
    mockList.mockResolvedValueOnce({ data: [] });
    await deleteAvatar('user-456');
    expect(mockRemove).not.toHaveBeenCalled();
  });
});
