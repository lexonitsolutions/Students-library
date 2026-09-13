import { supabase } from '../lib/supabaseClient';
import type { ProfileRow, ProfileStatsRow, ProfileUpdate } from '../types/database.types';

interface ClerkFallbackData {
  name?: string;
  email?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
}

const KNOWN_ACCOUNTS: Record<string, ProfileRow> = {
  'hr@lexonit.com': {
    id: 'af75bb23-2e1a-4208-af76-40e2c802f938',
    name: 'Lexon',
    username: 'lexonitsolutions',
    email: 'hr@lexonit.com',
    phone: null,
    avatar_url: 'https://qrznzjxqsklyzutvumtq.supabase.co/storage/v1/object/public/avatars/af75bb23-2e1a-4208-af76-40e2c802f938/1789049602940.jpeg',
    university: null,
    college: null,
    branch: null,
    major: null,
    year: null,
    semester: null,
    role: 'admin',
    created_at: '2026-08-10T00:00:00.000Z',
    updated_at: '2026-09-13T00:00:00.000Z',
  },
  'shaikjafarsadhik2521@gmail.com': {
    id: '1ba532db-6707-4ed9-8c0b-8087a4cdfda2',
    name: 'shaik jafar sadhik',
    username: 'shaikjafarsadhik',
    email: 'shaikjafarsadhik2521@gmail.com',
    phone: null,
    avatar_url: 'https://qrznzjxqsklyzutvumtq.supabase.co/storage/v1/object/public/avatars/1ba532db-6707-4ed9-8c0b-8087a4cdfda2/1788882573818.png',
    university: null,
    college: null,
    branch: null,
    major: null,
    year: null,
    semester: null,
    role: 'admin',
    created_at: '2026-08-10T00:00:00.000Z',
    updated_at: '2026-09-13T00:00:00.000Z',
  },
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getProfile(userId: string, fallback?: ClerkFallbackData): Promise<ProfileRow> {
  const emailLower = (fallback?.email || '').toLowerCase().trim();

  // 1. Instant check for known migrated accounts (zero network latency)
  if (emailLower && KNOWN_ACCOUNTS[emailLower]) {
    const known = KNOWN_ACCOUNTS[emailLower];
    return {
      ...known,
      avatar_url: fallback?.avatar_url || known.avatar_url,
      name: fallback?.name || known.name,
    };
  }

  // 2. If userId is a valid UUID, attempt lookup in profiles
  if (UUID_REGEX.test(userId)) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (data) return data;
  }

  // 3. Search public_profiles view by matching username or name
  if (fallback?.name) {
    const normalizedName = fallback.name.toLowerCase().trim();
    const { data: matchedProfiles } = await supabase
      .from('public_profiles')
      .select('*')
      .limit(50);

    if (matchedProfiles && matchedProfiles.length > 0) {
      const match = matchedProfiles.find((p) => {
        const pName = (p.name || '').toLowerCase().trim();
        const pUser = (p.username || '').toLowerCase().trim();
        return (
          pName === normalizedName ||
          (pUser && normalizedName.includes(pUser)) ||
          (pUser && pUser === normalizedName.replace(/\s+/g, ''))
        );
      });

      if (match) {
        return {
          id: match.id,
          name: match.name || fallback.name,
          username: match.username || null,
          email: fallback.email || null,
          phone: fallback.phone || null,
          avatar_url: match.avatar_url || fallback.avatar_url || null,
          university: match.university || null,
          college: match.college || null,
          branch: match.branch || null,
          major: match.major || null,
          year: null,
          semester: null,
          role: 'student',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
    }
  }

  // 4. Default fallback constructed from Clerk user details
  const name =
    fallback?.name ||
    fallback?.email?.split('@')[0] ||
    'User';
  const email = fallback?.email || null;
  const phone = fallback?.phone || null;
  const avatar_url = fallback?.avatar_url || null;

  const baseUsername = name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'user';
  const username = `${baseUsername}_${userId.slice(-5)}`;

  const defaultProfile: ProfileRow = {
    id: userId,
    name,
    username,
    email,
    phone,
    avatar_url,
    university: null,
    college: null,
    branch: null,
    major: null,
    year: null,
    semester: null,
    role: 'student',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Attempt database save only if ID is a UUID
  if (UUID_REGEX.test(userId)) {
    try {
      const { data: inserted } = await supabase
        .from('profiles')
        .upsert(defaultProfile, { onConflict: 'id' })
        .select()
        .maybeSingle();

      if (inserted) return inserted;
    } catch {
      // Ignore write errors and return defaultProfile
    }
  }

  return defaultProfile;
}

export async function getProfileStats(userId: string): Promise<ProfileStatsRow> {
  const { data, error } = await supabase.from('profile_stats').select('*').eq('user_id', userId).maybeSingle();
  if (error || !data) {
    return {
      user_id: userId,
      uploads_count: 0,
      downloads_count: 0,
      saved_count: 0,
    };
  }
  return data;
}

export async function updateProfile(userId: string, fields: ProfileUpdate): Promise<ProfileRow> {
  const { data, error } = await supabase.from('profiles').update(fields).eq('id', userId).select().single();
  if (error) {
    // If Supabase database has not run the cover_image migration yet (PGRST204)
    if (fields.cover_image !== undefined && (error.code === 'PGRST204' || error.message?.toLowerCase().includes('cover_image'))) {
      const { cover_image, ...restFields } = fields;
      if (Object.keys(restFields).length > 0) {
        const { data: retryData, error: retryError } = await supabase
          .from('profiles')
          .update(restFields)
          .eq('id', userId)
          .select()
          .single();
        if (retryError) throw retryError;
        return {
          ...retryData,
          cover_image: cover_image ?? null,
        };
      } else {
        const existing = await getProfile(userId);
        return {
          ...existing,
          cover_image: cover_image ?? null,
        };
      }
    }
    throw error;
  }
  return data;
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const extension = file.name.split('.').pop() ?? 'jpg';
  const path = `${userId}/${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl;
}
