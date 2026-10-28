// Stand-in for `profiles` until user search reads from Supabase.
import type { UserSummary } from './types';

export const sampleUsers: UserSummary[] = [
  { id: 'u-rafi', name: 'Rafi Hasan', area: 'Halishahar', avatarUrl: null },
  { id: 'u-nayeem', name: 'Nayeem Islam', area: 'Agrabad', avatarUrl: null },
  { id: 'u-tanvir', name: 'Tanvir Ahmed', area: 'Patenga', avatarUrl: null },
  { id: 'u-sabbir', name: 'Sabbir Rahman', area: 'Nasirabad', avatarUrl: null },
  { id: 'u-arif', name: 'Arif Chowdhury', area: 'Kotwali', avatarUrl: null },
  { id: 'u-mahmud', name: 'Mahmudul Karim', area: 'Bayazid', avatarUrl: null },
  { id: 'u-imran', name: 'Imran Hossain', area: 'Halishahar', avatarUrl: null },
  { id: 'u-shuvo', name: 'Shuvo Das', area: 'Kalurghat', avatarUrl: null },
  { id: 'u-farhan', name: 'Farhan Kabir', area: 'Khulshi', avatarUrl: null },
  { id: 'u-rakib', name: 'Rakibul Hasan', area: 'Panchlaish', avatarUrl: null },
];
