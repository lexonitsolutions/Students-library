import { supabase } from '../lib/supabaseClient';

export async function reportMaterial(materialId: string, reason: string): Promise<void> {
  const { error } = await supabase.from('reports').insert({ material_id: materialId, reason });
  if (error) throw error;
}
