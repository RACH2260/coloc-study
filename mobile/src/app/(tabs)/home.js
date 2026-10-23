import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Button, EmptyState, Logo, Txt } from '../../components/ui';
import ListingCard from '../../components/ListingCard';
import { useAuth } from '../../lib/auth';
import { searchListings } from '../../lib/listings';
import { colors, radius } from '../../lib/theme';

export default function Home() {
  const router = useRouter();
  const { profile } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await searchListings({ limit: 10 });
    setItems(data);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const first = (profile?.full_name || '').split(' ')[0];

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.white }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={colors.blue} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Logo size={22} />
          <Avatar uri={profile?.avatar_url} name={profile?.full_name} size={40} />
        </View>

        <Txt weight="bold" size={24} style={{ marginTop: 24 }}>Bonjour {first}</Txt>
        <Txt color={colors.muted} style={{ marginTop: 2 }}>Que cherchez-vous aujourd'hui ?</Txt>

        <Pressable
          onPress={() => router.push('/(tabs)/search')}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16, padding: 14, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md }}
        >
          <Ionicons name="search" size={18} color={colors.muted} />
          <Txt color="#98A2B3">Rechercher un logement ou une colocation</Txt>
        </Pressable>

        <Button title="Publier une annonce" icon="add-circle-outline" variant="soft" onPress={() => router.push('/publish')} style={{ marginTop: 12 }} />

        <Txt weight="bold" size={17} style={{ marginTop: 28, marginBottom: 12 }}>Annonces récentes</Txt>
        {!loading && items.length === 0 ? (
          <EmptyState icon="home-outline" title="Aucune annonce pour le moment" text="Les nouvelles annonces apparaîtront ici." />
        ) : (
          <View style={{ gap: 14 }}>
            {items.map(l => (
              <View key={l.id} style={{ flexDirection: 'row' }}>
                <ListingCard listing={l} onPress={() => router.push(`/listing/${l.id}`)} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
