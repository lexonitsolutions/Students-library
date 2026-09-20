import { supabase } from '../lib/supabaseClient';
import { cachedQuery, invalidateCache } from '../lib/queryCache';
import type { ProfileRow, ProfileStatsRow, ProfileUpdate } from '../types/database.types';

export async function getProfile(userId: string): Promise<ProfileRow> {
  if (!userId) throw new Error('User ID is required');

  return cachedQuery(`profile:${userId}`, async () => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (!error && data) {
      return data;
    }

    // If profile doesn't exist yet, construct and attempt to upsert default profile
    try {
      const { data: authData } = await supabase.auth.getUser();
      const authUser = authData?.user;
      const name =
        (authUser?.user_metadata?.full_name as string) ||
        (authUser?.user_metadata?.name as string) ||
        authUser?.email?.split('@')[0] ||
        'User';
      const email = authUser?.email || null;
      const phone = authUser?.phone || null;
      const avatar_url =
        (authUser?.user_metadata?.avatar_url as string) ||
        (authUser?.user_metadata?.picture as string) ||
        null;

      const baseUsername = name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'user';
      const username = `${baseUsername}_${userId.slice(0, 5)}`;

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

      const { data: inserted, error: insertError } = await supabase
        .from('profiles')
        .upsert(defaultProfile, { onConflict: 'id' })
        .select()
        .maybeSingle();

      if (!insertError && inserted) {
        return inserted;
      }

      return defaultProfile;
    } catch {
      if (error) throw error;
      throw new Error('Profile could not be loaded.');
    }
  }, 60_000); // 60 seconds TTL
}

export async function getProfileStats(userId: string): Promise<ProfileStatsRow> {
  if (!userId) {
    return {
      user_id: '',
      uploads_count: 0,
      downloads_count: 0,
      saved_count: 0,
    };
  }

  return cachedQuery(`profile_stats:${userId}`, async () => {
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
  }, 60_000); // 60 seconds TTL
}

export async function updateProfile(userId: string, fields: ProfileUpdate): Promise<ProfileRow> {
  const { data, error } = await supabase.from('profiles').update(fields).eq('id', userId).select().single();
  if (error) {
    // Handle cases where new columns haven't been migrated yet (PGRST204)
    if (error.code === 'PGRST204' || error.message?.toLowerCase().includes('column')) {
      const { course, preferred_subjects, cover_image, ...safeFields } = fields;
      if (Object.keys(safeFields).length > 0) {
        const { data: retryData, error: retryError } = await supabase
          .from('profiles')
          .update(safeFields)
          .eq('id', userId)
          .select()
          .single();
        if (!retryError && retryData) {
          invalidateCache(`profile:${userId}`);
          return {
            ...retryData,
            course: course ?? null,
            preferred_subjects: preferred_subjects ?? null,
            cover_image: cover_image ?? null,
          };
        }
      } else {
        const existing = await getProfile(userId);
        invalidateCache(`profile:${userId}`);
        return {
          ...existing,
          course: course ?? null,
          preferred_subjects: preferred_subjects ?? null,
          cover_image: cover_image ?? null,
        };
      }
    }
    throw error;
  }
  invalidateCache(`profile:${userId}`);
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
