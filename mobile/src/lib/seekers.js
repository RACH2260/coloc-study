import { supabase } from './supabase';

export const LOOKING_LABEL = {
  logement: 'Cherche un logement',
  colocataire: 'Cherche un colocataire',
};

export const SEEKER_TAGS = [
  'Non-fumeur',
  'Calme',
  'Sociable',
  'Studieux',
  'Propre',
  'Sportif',
  'Aime cuisiner',
  'Musique',
  'Pas de fêtes',
];

export const MAX_TAGS = 5;

export const SEEKER_COLUMNS =
  'user_id, looking_for, city, neighborhood, budget_max_fcfa, move_in, school, about, tags, is_visible, hidden_by_admin, created_at';

// Recherche des profils visibles. Le nom et la photo viennent de la vue publique (jamais le téléphone).
export async function searchSeekers({ city, neighborhood, looking, exclude, limit = 50 }) {
  let q = supabase
    .from('seeker_profiles')
    .select(SEEKER_COLUMNS, { count: 'exact' })
    .eq('is_visible', true)
    .eq('hidden_by_admin', false)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (exclude) q = q.neq('user_id', exclude);
  if (city && city.trim()) q = q.ilike('city', `%${city.trim()}%`);
  if (neighborhood && neighborhood.trim()) q = q.ilike('neighborhood', `%${neighborhood.trim()}%`);
  if (looking && looking !== 'tous') q = q.eq('looking_for', looking);

  const { data, count, error } = await q;
  const rows = data || [];
  if (error || !rows.length) return { data: [], count: 0, error };

  const { data: people } = await supabase
    .from('public_profiles')
    .select('id, full_name, avatar_url')
    .in('id', rows.map(r => r.user_id));

  const merged = rows.map(r => {
    const p = (people || []).find(x => x.id === r.user_id);
    return { ...r, full_name: p?.full_name || 'Étudiant', avatar_url: p?.avatar_url || null };
  });
  return { data: merged, count: count ?? merged.length, error: null };
}

// Ouvre (ou crée) la discussion entre deux étudiants, hors annonce.
export async function openDirectChat(me, other) {
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .is('listing_id', null)
    .or(`and(user_a.eq.${me},user_b.eq.${other}),and(user_a.eq.${other},user_b.eq.${me})`)
    .maybeSingle();
  if (existing) return { id: existing.id };

  const { data, error } = await supabase
    .from('conversations')
    .insert({ listing_id: null, user_a: me, user_b: other })
    .select('id')
    .single();
  if (error) return { error };
  return { id: data.id };
}
