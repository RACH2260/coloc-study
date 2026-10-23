import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase';
import { useAuth } from './auth';

const FavoritesContext = createContext({ ids: new Set(), isFav: () => false, toggle: () => {} });

export function useFavorites() {
  return useContext(FavoritesContext);
}

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const uid = user?.id;
  const [ids, setIds] = useState(new Set());

  useEffect(() => {
    if (!uid) {
      setIds(new Set());
      return;
    }
    supabase
      .from('favorites')
      .select('listing_id')
      .eq('user_id', uid)
      .then(({ data }) => setIds(new Set((data || []).map(r => r.listing_id))));
  }, [uid]);

  const toggle = useCallback(
    async listingId => {
      if (!uid) return;
      const has = ids.has(listingId);
      // Mise à jour immédiate de l'écran, annulée si le serveur refuse
      setIds(prev => {
        const next = new Set(prev);
        if (has) next.delete(listingId);
        else next.add(listingId);
        return next;
      });
      const { error } = has
        ? await supabase.from('favorites').delete().eq('user_id', uid).eq('listing_id', listingId)
        : await supabase.from('favorites').insert({ user_id: uid, listing_id: listingId });
      if (error) {
        setIds(prev => {
          const next = new Set(prev);
          if (has) next.add(listingId);
          else next.delete(listingId);
          return next;
        });
      }
    },
    [uid, ids]
  );

  const value = useMemo(() => ({ ids, isFav: id => ids.has(id), toggle }), [ids, toggle]);
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}
