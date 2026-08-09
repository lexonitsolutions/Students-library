import { supabase } from '../lib/supabaseClient';
import type { ProfileRow, ProfileStatsRow, ProfileUpdate } from '../types/database.types';

export async function getProfile(userId: string): Promise<ProfileRow> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error) throw error;
  return data;
}

export async function getProfileStats(userId: string): Promise<ProfileStatsRow> {
  const { data, error } = await supabase.from('profile_stats').select('*').eq('user_id', userId).single();
  if (error) throw error;
  return data;
}

export async function updateProfile(userId: string, fields: ProfileUpdate): Promise<ProfileRow> {
  const { data, error } = await supabase.from('profiles').update(fields).eq('id', userId).select().single();
  if (error) throw error;
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
