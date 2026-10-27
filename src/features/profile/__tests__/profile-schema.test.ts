import { profileSchema } from '../profile-schema';

const valid = {
  fullName: 'Tanvir Rahman',
  area: 'Halishahar',
  district: 'Chattogram',
  bloodGroup: 'B+',
  phone: '01712345678',
  nationalId: '1990123456789',
  role: 'all-rounder',
  battingStyle: 'right',
};

describe('profileSchema', () => {
  it('accepts a complete profile', () => {
    expect(profileSchema.safeParse(valid).success).toBe(true);
  });

  it('trims the name, area and district', () => {
    const parsed = profileSchema.parse({ ...valid, fullName: '  Tanvir  ', area: ' Agrabad ', district: ' Dhaka ' });
    expect(parsed.fullName).toBe('Tanvir');
    expect(parsed.area).toBe('Agrabad');
    expect(parsed.district).toBe('Dhaka');
  });

  it('allows an empty area, district and blood group', () => {
    expect(profileSchema.safeParse({ ...valid, area: '', district: '', bloodGroup: '' }).success).toBe(true);
  });

  it('rejects a name shorter than 2 characters after trimming', () => {
    expect(profileSchema.safeParse({ ...valid, fullName: ' A ' }).success).toBe(false);
  });

  it('rejects a name, area or district over 40 characters', () => {
    expect(profileSchema.safeParse({ ...valid, fullName: 'x'.repeat(41) }).success).toBe(false);
    expect(profileSchema.safeParse({ ...valid, area: 'x'.repeat(41) }).success).toBe(false);
    expect(profileSchema.safeParse({ ...valid, district: 'x'.repeat(41) }).success).toBe(false);
  });

  it('accepts all eight blood groups and rejects anything else', () => {
    for (const bloodGroup of ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']) {
      expect(profileSchema.safeParse({ ...valid, bloodGroup }).success).toBe(true);
    }
    expect(profileSchema.safeParse({ ...valid, bloodGroup: 'C+' }).success).toBe(false);
  });

  it('allows an empty phone and National ID', () => {
    expect(profileSchema.safeParse({ ...valid, phone: '', nationalId: '' }).success).toBe(true);
  });

  it('accepts phone numbers with +88 or separators and strips them', () => {
    expect(profileSchema.parse({ ...valid, phone: '+880 1712-345678' }).phone).toBe('+8801712345678');
    expect(profileSchema.parse({ ...valid, phone: '017 1234 5678' }).phone).toBe('01712345678');
  });

  it('rejects a malformed phone number', () => {
    expect(profileSchema.safeParse({ ...valid, phone: '12345' }).success).toBe(false);
    expect(profileSchema.safeParse({ ...valid, phone: '01212345678' }).success).toBe(false);
  });

  it('accepts National IDs of 10, 13 and 17 digits only', () => {
    for (const nationalId of ['1234567890', '1990123456789', '19901234567890123']) {
      expect(profileSchema.safeParse({ ...valid, nationalId }).success).toBe(true);
    }
    for (const nationalId of ['123456789', '12345678901', 'abcdefghij']) {
      expect(profileSchema.safeParse({ ...valid, nationalId }).success).toBe(false);
    }
  });

  it('rejects an unknown role', () => {
    expect(profileSchema.safeParse({ ...valid, role: 'umpire' }).success).toBe(false);
  });
});
