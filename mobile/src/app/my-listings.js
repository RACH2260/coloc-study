import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Button, EmptyState, Header, Screen, StatusPill, Txt } from '../components/ui';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { LISTING_COLUMNS } from '../lib/listings';
import { firstPhoto, formatFcfa } from '../lib/format';
import { colors, radius } from '../lib/theme';

export default function MyListings() {
  const router = useRouter();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('listings')
      .select(LISTING_COLUMNS)
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });
    setItems(data || []);
    setLoading(false);
  }, [user.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function archive(l) {
    await supabase.from('listings').update({ status: 'archive' }).eq('id', l.id);
    load();
  }

  function remove(l) {
    Alert.alert('Supprimer cette annonce ?', 'Cette action est définitive.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('listings').delete().eq('id', l.id);
          load();
        },
      },
    ]);
  }

  return (
    <Screen scroll={false} contentStyle={{ padding: 20, paddingBottom: 0 }}>
      <Header onBack={() => router.back()} title="Mes annonces" />

      <View style={{ flexDirection: 'row', backgroundColor: colors.bg, borderRadius: radius.md, padding: 4, marginBottom: 14 }}>
        <View style={{ flex: 1, paddingVertical: 8, borderRadius: radius.sm, backgroundColor: colors.white, alignItems: 'center' }}>
          <Txt weight="semi" size={13} color={colors.blue}>Mes annonces</Txt>
        </View>
        <Pressable onPress={() => router.replace('/(tabs)/profile')} style={{ flex: 1, paddingVertical: 8, alignItems: 'center' }}>
          <Txt weight="medium" size={13} color={colors.muted}>Mon profil</Txt>
        </Pressable>
      </View>

      <FlatList
        data={items}
        keyExtractor={l => l.id}
        contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const photo = firstPhoto(item);
          return (
            <Pressable
              onPress={() => router.push(`/listing/${item.id}`)}
              style={{ flexDirection: 'row', gap: 12, padding: 10, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg }}
            >
              <View style={{ width: 84, height: 84, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' }}>
                {photo ? <Image source={{ uri: photo }} style={{ width: 84, height: 84 }} contentFit="cover" /> : <Ionicons name="image-outline" size={26} color={colors.blue} />}
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Txt weight="semi" size={14} numberOfLines={1}>{item.title}</Txt>
                <Txt weight="semi" size={13} color={colors.blue}>{formatFcfa(item.rent_fcfa)} / mois</Txt>
                <StatusPill status={item.status} />
                <View style={{ flexDirection: 'row', gap: 16, marginTop: 2 }}>
                  {item.status !== 'archive' ? (
                    <Txt weight="semi" size={12} color={colors.muted} onPress={() => archive(item)}>Archiver</Txt>
                  ) : null}
                  <Txt weight="semi" size={12} color={colors.danger} onPress={() => remove(item)}>Supprimer</Txt>
                </View>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          loading ? null : (
            <EmptyState icon="albums-outline" title="Aucune annonce" text="Publiez votre première annonce, elle sera visible après validation.">
              <Button title="Publier une annonce" onPress={() => router.push('/publish')} />
            </EmptyState>
          )
        }
        ListFooterComponent={
          items.length ? <Button title="Publier une annonce" icon="add" onPress={() => router.push('/publish')} style={{ marginTop: 8 }} /> : null
        }
      />
    </Screen>
  );
}
