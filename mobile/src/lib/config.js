// Configuration de l'application.
// L'URL et la clé viennent du fichier .env à la racine du projet mobile.
// Nettoie la valeur lue : espaces, retours à la ligne et guillemets collés par erreur
const clean = v => String(v || '').trim().replace(/^['"]|['"]$/g, '').trim();

export const SUPABASE_URL = clean(process.env.EXPO_PUBLIC_SUPABASE_URL) || 'https://jsgccdrtfabdigmsosae.supabase.co';
// Accepte la clé "publishable" (sb_publishable_...) ou l'ancienne clé "anon" (eyJ...)
export const SUPABASE_ANON_KEY =
  clean(process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY) || clean(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
export const KEY_MISSING = !SUPABASE_ANON_KEY;
// Diagnostic affiché en cas d'erreur de clé (ne révèle que le début de la clé)
export const KEY_INFO = SUPABASE_ANON_KEY
  ? SUPABASE_ANON_KEY.slice(0, 14) + '... (' + SUPABASE_ANON_KEY.length + ' caractères)'
  : 'aucune';

// Prix de la mise en relation (doit rester identique à la fonction pay-contact)
export const PRICE_FCFA = 2000;

// Numéro WhatsApp du support, format 226XXXXXXXX. Laisse vide pour masquer le bouton.
export const SUPPORT_WHATSAPP = '';

// Limites
export const MAX_PHOTOS = 6;

// Lien de téléchargement de l'app (Play Store ou APK), ajouté aux messages de partage.
// Laisse vide tant que l'app n'est pas publiée.
export const APP_DOWNLOAD_URL = '';
