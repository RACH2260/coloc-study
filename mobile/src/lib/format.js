import { KEY_INFO, SUPABASE_URL } from './config';
const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

export function formatNumber(n) {
  return String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function formatFcfa(n) {
  return `${formatNumber(n)} FCFA`;
}

export function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()} à ${hh}:${mm}`;
}

export function formatShortDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

// "70123456" ou "+22670123456" -> "+22670123456", sinon null
export function normalizePhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '').replace(/^226/, '');
  return /^\d{8}$/.test(digits) ? `+226${digits}` : null;
}

// "+22670123456" -> "+226 70 12 34 56"
export function formatPhone(p) {
  const d = String(p || '').replace(/\D/g, '').replace(/^226/, '');
  if (d.length !== 8) return p || '';
  return `+226 ${d.slice(0, 2)} ${d.slice(2, 4)} ${d.slice(4, 6)} ${d.slice(6, 8)}`;
}

export function initials(name) {
  return String(name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');
}

export function toInt(v) {
  const n = parseInt(String(v || '').replace(/\D/g, ''), 10);
  return Number.isFinite(n) ? n : null;
}

export const TYPE_LABEL = { colocation: 'Colocation', logement_entier: 'Logement entier' };

export const STATUS_LABEL = {
  en_attente: 'En attente',
  en_ligne: 'En ligne',
  refuse: 'Refusée',
  archive: 'Archivée',
};

export const ROLE_LABEL = { etudiant: 'Étudiant', proprietaire: 'Propriétaire / Habitant' };

export function firstPhoto(listing) {
  const photos = [...(listing?.listing_photos || [])].sort((a, b) => a.position - b.position);
  return photos[0]?.url || null;
}

export function sortedPhotos(listing) {
  return [...(listing?.listing_photos || [])].sort((a, b) => a.position - b.position).map(p => p.url);
}

// Lit le message d'erreur renvoyé par une Edge Function
export async function functionErrorMessage(error, data) {
  if (data && data.error) return data.error;
  try {
    const body = await error?.context?.json?.();
    if (body?.error) return body.error;
  } catch (_) {}
  return 'Une erreur est survenue. Réessayez.';
}

export function authErrorMessage(err) {
  const m = String(err?.message || '').toLowerCase();
  if (m.includes('invalid login')) return 'E-mail ou mot de passe incorrect.';
  if (m.includes('already registered')) return 'Un compte existe déjà avec cet e-mail. Connectez-vous.';
  if (m.includes('email not confirmed')) return 'Confirmez votre e-mail avant de vous connecter.';
  if (m.includes('password')) return 'Le mot de passe doit contenir au moins 6 caractères.';
  if (m.includes('rate limit')) return 'Trop d\'essais. Patientez quelques minutes.';
  if (m.includes('network') || m.includes('failed to fetch')) return 'Connexion impossible. Vérifiez votre réseau.';
  if (m.includes('api key') || m.includes('apikey'))
    return 'Clé Supabase refusée. Clé lue par l\'app : ' + KEY_INFO + ' | Projet : ' + SUPABASE_URL.replace('https://', '').split('.')[0];
  if (m.includes('signups not allowed') || m.includes('signup is disabled')) return 'Les inscriptions sont désactivées dans Supabase (Authentication > Providers > Email).';
  if (m.includes('valid email') || m.includes('invalid format')) return 'Adresse e-mail invalide.';
  return 'Erreur : ' + (err?.message || 'inconnue');
}
