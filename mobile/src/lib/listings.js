import { supabase } from './supabase';
import { toInt } from './format';

export const LISTING_COLUMNS =
  'id, owner_id, type, title, description, rent_fcfa, deposit_months, min_duration_months, move_fee_fcfa, city, neighborhood, bedrooms, max_roommates, status, created_at, listing_photos(url, position)';

export async function searchListings({ city, type, neighborhood, budget, limit = 50 }) {
  let q = supabase
    .from('listings')
    .select(LISTING_COLUMNS, { count: 'exact' })
    .eq('status', 'en_ligne')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (city && city.trim()) q = q.ilike('city', `%${city.trim()}%`);
  if (neighborhood && neighborhood.trim()) q = q.ilike('neighborhood', `%${neighborhood.trim()}%`);
  if (type && type !== 'tous') q = q.eq('type', type);
  const max = toInt(budget);
  if (max) q = q.lte('rent_fcfa', max);

  const { data, count, error } = await q;
  return { data: data || [], count: count ?? (data || []).length, error };
}

export async function uploadImage(uid, folder, uri) {
  const res = await fetch(uri);
  const buffer = await res.arrayBuffer();
  const path = `${uid}/${folder}/${Date.now()}_${Math.floor(Math.random() * 1e6)}.jpg`;
  const { error } = await supabase.storage
    .from('listing-photos')
    .upload(path, buffer, { contentType: 'image/jpeg' });
  if (error) throw error;
  return supabase.storage.from('listing-photos').getPublicUrl(path).data.publicUrl;
}
