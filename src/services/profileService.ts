import { supabase } from '../lib/supabaseClient';
import type { ProfileRow, ProfileStatsRow, ProfileUpdate } from '../types/database.types';

export async function getProfile(userId: string): Promise<ProfileRow> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (!error && data) {
    return data;
  }

  // If profile doesn't exist yet, construct and attempt to upsert default profile
  try {
    const { data: authData } = await supabase.auth.getUser();
    const authUser = authData?.user;
    const name =
      (authUser?.user_metadata?.name as string) ||
      authUser?.email?.split('@')[0] ||
      'User';
    const email = authUser?.email || null;
    const phone = authUser?.phone || null;

    const defaultProfile: ProfileRow = {
      id: userId,
      name,
      username: name.toLowerCase().replace(/[^a-z0-9]/g, '') || null,
      email,
      phone,
      avatar_url: null,
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
