import { useCallback, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState, Txt } from '../../components/ui';
import ListingCard from '../../components/ListingCard';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { useFavorites } from '../../lib/favorites';
import { LISTING_COLUMNS } from '../../lib/listings';
import { colors } from '../../lib/theme';

export default function Favorites() {
  const router = useRouter();
  const { user } = useAuth();
  const { ids } = useFavorites();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const { data } = await supabase
          .from('favorites')
          .select(`created_at, listings(${LISTING_COLUMNS})`)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (!active) return;
        setItems((data || []).map(r => r.listings).filter(Boolean));
        setLoading(false);
      })();
      return () => {
        active = false;
      };
    }, [user.id])
  );

  const visible = items.filter(l => ids.has(l.id));

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.white }}>
      <FlatList
        data={visible}
        keyExtractor={l => l.id}
        ListHeaderComponent={<Txt weight="bold" size={20} style={{ marginBottom: 8 }}>Mes favoris</Txt>}
        contentContainerStyle={{ padding: 20, paddingBottom: 32, gap: 14 }}
        renderItem={({ item }) => (
          <ListingCard listing={item} onPress={() => router.push(`/listing/${item.id}`)} />
        )}
        ListEmptyComponent={
          loading ? null : (
            <EmptyState icon="heart-outline" title="Aucun favori" text="Touchez le cœur d'une annonce pour la retrouver ici." />
          )
        }
      />
    </SafeAreaView>
  );
}
