import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const PENDING_KEY = 'coloc_pending_profile';
const COLUMNS = 'id, role, goal, full_name, phone, avatar_url, bio';

const AuthContext = createContext(null);

// Dernière erreur rencontrée en créant le profil (pour l'afficher à l'écran d'inscription)
export let lastProfileError = null;

export function useAuth() {
  return useContext(AuthContext);
}

// À appeler AVANT signUp : le profil sera créé dès que le compte est actif
export async function savePendingProfile(profile) {
  await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(profile));
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async user => {
    if (!user) {
      setProfile(null);
      return null;
    }
    let { data } = await supabase.from('profiles').select(COLUMNS).eq('id', user.id).maybeSingle();

    if (!data) {
      const raw = await AsyncStorage.getItem(PENDING_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        // Si le profil existe déjà (double appel), l'erreur est ignorée : on relit juste après
        const ins = await supabase.from('profiles').insert({
          id: user.id,
          role: p.role,
          goal: p.role === 'etudiant' ? p.goal : null,
          full_name: p.full_name,
          phone: p.phone,
        });
        lastProfileError = ins.error ? ins.error.message : null;
        const again = await supabase.from('profiles').select(COLUMNS).eq('id', user.id).maybeSingle();
        data = again.data;
        if (data) await AsyncStorage.removeItem(PENDING_KEY);
      }
    }
    setProfile(data || null);
    return data || null;
  }, []);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      await loadProfile(data.session?.user);
      if (active) setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      // setTimeout : évite de bloquer le client Supabase pendant l'événement
      setTimeout(() => loadProfile(s?.user), 0);
    });

    const appState = AppState.addEventListener('change', state => {
      if (state === 'active') supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
      appState.remove();
    };
  }, [loadProfile]);

  const refreshProfile = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    return loadProfile(data.user);
  }, [loadProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      signedIn: !!session && !!profile,
      refreshProfile,
      signOut,
    }),
    [session, profile, loading, refreshProfile, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
