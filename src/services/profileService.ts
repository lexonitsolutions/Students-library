import { supabase } from '../lib/supabaseClient';
import { cachedQuery, invalidateCache } from '../lib/queryCache';
import { emailToUuid } from '../lib/idUtils';
import type { ProfileRow, ProfileStatsRow, ProfileUpdate } from '../types/database.types';

export async function getProfile(pointer: string, defaultData?: Partial<ProfileRow>): Promise<ProfileRow> {
  if (!pointer && !defaultData?.email) throw new Error('User email or ID is required');

  const resolvedEmail = (defaultData?.email || (pointer.includes('@') ? pointer : '')).trim().toLowerCase();
  const cacheKey = resolvedEmail ? `profile:email:${resolvedEmail}` : `profile:id:${pointer}`;

  return cachedQuery(cacheKey, async () => {
    // 1. Primary lookup using email as pointer
    if (resolvedEmail) {
      const { data: byEmail, error: emailError } = await supabase
        .from('profiles')
        .select('*')
        .ilike('email', resolvedEmail)
        .maybeSingle();

      if (!emailError && byEmail) {
        if (byEmail.is_deleted && defaultData?.is_deleted === false) {
          await supabase
            .from('profiles')
            .update({
              is_deleted: false,
              ...(defaultData.name && { name: defaultData.name }),
              ...(defaultData.avatar_url && { avatar_url: defaultData.avatar_url }),
            })
            .ilike('email', resolvedEmail);
          byEmail.is_deleted = false;
        }

        let currentRole = byEmail.role;
        const isRootAdmin =
          resolvedEmail === 'lexonitservices@gmail.com' ||
          resolvedEmail === 'hr@lexonit.com';

        let shouldBeAdmin = isRootAdmin;
        if (!shouldBeAdmin) {
          try {
            const { data: allowEntry } = await supabase
              .from('admin_allowlist')
              .select('email')
              .ilike('email', resolvedEmail)
              .maybeSingle();
            if (allowEntry) shouldBeAdmin = true;
          } catch {}
        }

        if (shouldBeAdmin && currentRole !== 'admin') {
          currentRole = 'admin';
          await supabase
            .from('profiles')
            .update({ role: 'admin' })
            .ilike('email', resolvedEmail);
        }

        const resolvedProfile: ProfileRow = {
          ...byEmail,
          role: currentRole,
        };

        // Also cache by profile ID for fast ID lookups
        invalidateCache(`profile:id:${byEmail.id}`);
        return resolvedProfile;
      }
    }

    // 2. Secondary lookup by UUID id if pointer is a UUID
    if (pointer && !pointer.includes('@')) {
      const { data: byId, error: idError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', pointer)
        .maybeSingle();

      if (!idError && byId) {
        if (byId.email) invalidateCache(`profile:email:${byId.email.toLowerCase()}`);
        return byId;
      }
    }

    // 3. Profile doesn't exist yet: construct and upsert default profile in Supabase
    try {
      const name = defaultData?.name || (resolvedEmail ? resolvedEmail.split('@')[0] : 'User');
      const email = resolvedEmail || defaultData?.email || null;
      const phone = defaultData?.phone || null;
      const avatar_url = defaultData?.avatar_url || null;

      const baseUsername = name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'user';
      const effectiveId = email ? emailToUuid(email) : pointer;
      const username = defaultData?.username || `${baseUsername}_${effectiveId.slice(0, 5)}`;

      let isAdmin =
        (email || '').toLowerCase() === 'lexonitservices@gmail.com' ||
        (email || '').toLowerCase() === 'hr@lexonit.com' ||
        defaultData?.role === 'admin';

      if (!isAdmin && email) {
        try {
          const { data: allowEntry } = await supabase
            .from('admin_allowlist')
            .select('email')
            .ilike('email', email)
            .maybeSingle();
          if (allowEntry) isAdmin = true;
        } catch {}
      }

      const defaultProfile: ProfileRow = {
        id: effectiveId,
        name,
        username,
        email,
        phone,
        avatar_url,
        university: defaultData?.university || null,
        college: defaultData?.college || null,
        branch: defaultData?.branch || null,
        major: defaultData?.major || null,
        year: defaultData?.year || null,
        semester: defaultData?.semester || null,
        role: isAdmin ? 'admin' : (defaultData?.role || 'student'),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Try upserting by email if email is present, or by id
      let inserted: ProfileRow | null = null;
      let insertError: any = null;

      const res = await supabase
        .from('profiles')
        .upsert(defaultProfile, { onConflict: 'id' })
        .select()
        .maybeSingle();

      inserted = res.data;
      insertError = res.error;

      if (insertError && email) {
        // Fallback: try inserting directly
        const retryRes = await supabase
          .from('profiles')
          .insert(defaultProfile)
          .select()
          .maybeSingle();
        inserted = retryRes.data;
        insertError = retryRes.error;
      }

      if (!insertError && inserted) {
        return inserted;
      }

      return defaultProfile;
    } catch (err) {
      console.warn('Profile provisioning notice:', err);
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

export async function updateProfile(pointer: string, fields: ProfileUpdate): Promise<ProfileRow> {
  const isEmail = pointer.includes('@');
  const normalized = pointer.trim().toLowerCase();

  let query = supabase.from('profiles').update(fields);
  if (isEmail) {
    query = query.ilike('email', normalized);
  } else {
    query = query.eq('id', pointer);
  }

  const { data, error } = await query.select().single();
  if (error) {
    // Handle cases where new columns haven't been migrated yet (PGRST204)
    if (error.code === 'PGRST204' || error.message?.toLowerCase().includes('column')) {
      const { course, preferred_subjects, cover_image, ...safeFields } = fields;
      if (Object.keys(safeFields).length > 0) {
        let retryQuery = supabase.from('profiles').update(safeFields);
        if (isEmail) {
          retryQuery = retryQuery.ilike('email', normalized);
        } else {
          retryQuery = retryQuery.eq('id', pointer);
        }

        const { data: retryData, error: retryError } = await retryQuery.select().single();
        if (!retryError && retryData) {
          invalidateCache(`profile:email:${normalized}`);
          invalidateCache(`profile:id:${retryData.id}`);
          invalidateCache(`profile:${pointer}`);
          return {
            ...retryData,
            course: course ?? null,
            preferred_subjects: preferred_subjects ?? null,
            cover_image: cover_image ?? null,
          };
        }
      } else {
        const existing = await getProfile(pointer);
        invalidateCache(`profile:email:${normalized}`);
        invalidateCache(`profile:id:${existing.id}`);
        invalidateCache(`profile:${pointer}`);
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

  if (isEmail) {
    invalidateCache(`profile:email:${normalized}`);
    invalidateCache(`profile:id:${data.id}`);
  } else {
    invalidateCache(`profile:id:${pointer}`);
    if (data.email) invalidateCache(`profile:email:${data.email.toLowerCase()}`);
  }
  invalidateCache(`profile:${pointer}`);

  return data;
}

export async function uploadAvatar(pointer: string, file: File): Promise<string> {
  const extension = file.name.split('.').pop() ?? 'jpg';
  const safeFolder = pointer.includes('@')
    ? pointer.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')
    : pointer;
  const path = `${safeFolder}/${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl;
}

