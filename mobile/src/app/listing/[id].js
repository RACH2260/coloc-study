import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, ScrollView, Share, View, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Button, EmptyState, Loader, StatusPill, Txt } from '../../components/ui';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { useFavorites } from '../../lib/favorites';
import { LISTING_COLUMNS } from '../../lib/listings';
import { formatFcfa, formatNumber, sortedPhotos, TYPE_LABEL } from '../../lib/format';
import { colors, radius } from '../../lib/theme';

function RoundButton({ icon, onPress, color = colors.white, label }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(20,33,61,0.55)', alignItems: 'center', justifyContent: 'center' }}
    >
      <Ionicons name={icon} size={20} color={color} />
    </Pressable>
  );
}

export default function ListingDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const { isFav, toggle } = useFavorites();
  const listRef = useRef(null);

  const [listing, setListing] = useState(null);
  const [paid, setPaid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);

  const load = useCallback(async () => {
    const { data } = await supabase.from('listings').select(LISTING_COLUMNS).eq('id', id).maybeSingle();
    const { data: pay } = await supabase
      .from('payments')
      .select('id')
      .eq('payer_id', user.id)
      .eq('listing_id', id)
      .eq('status', 'paye')
      .maybeSingle();
    setListing(data);
    setPaid(!!pay);
    setLoading(false);
  }, [id, user.id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Loader />;
  if (!listing) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.white, paddingTop: insets.top + 12 }}>
        <Pressable onPress={() => router.back()} style={{ padding: 16 }}>
          <Ionicons name="chevron-back" size={26} color={colors.ink} />
        </Pressable>
        <EmptyState icon="alert-circle-outline" title="Annonce introuvable" text="Elle a peut-être été retirée." />
      </View>
    );
  }

  const photos = sortedPhotos(listing);
  const mine = listing.owner_id === user.id;
  const place = [listing.neighborhood, listing.city].filter(Boolean).join(', ');
  const imgH = 270;

  const conditions = [
    listing.deposit_months != null ? `Caution : ${listing.deposit_months} mois` : null,
    listing.min_duration_months != null ? `Durée minimale : ${listing.min_duration_months} mois` : null,
    listing.move_fee_fcfa != null ? `Frais de ménage : ${formatFcfa(listing.move_fee_fcfa)}` : null,
  ].filter(Boolean);

  function share() {
    Share.share({
      message: `${listing.title} : ${formatFcfa(listing.rent_fcfa)} / mois à ${place}. Trouvé sur Coloc'Study.`,
    });
  }

  function goTo(i) {
    setIndex(i);
    listRef.current?.scrollToIndex({ index: i, animated: true });
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Galerie */}
        <View style={{ height: imgH, backgroundColor: colors.blueSoft }}>
          {photos.length ? (
            <FlatList
              ref={listRef}
              data={photos}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(u, i) => u + i}
              getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
              onMomentumScrollEnd={e => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
              renderItem={({ item }) => (
                <Image source={{ uri: item }} style={{ width, height: imgH }} contentFit="cover" />
              )}
            />
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="image-outline" size={48} color={colors.blue} />
            </View>
          )}

          <View style={{ position: 'absolute', top: insets.top + 8, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' }}>
            <RoundButton icon="chevron-back" label="Retour" onPress={() => router.back()} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <RoundButton icon={isFav(listing.id) ? 'heart' : 'heart-outline'} color={isFav(listing.id) ? '#FF6B72' : colors.white} label="Favori" onPress={() => toggle(listing.id)} />
              <RoundButton icon="share-social-outline" label="Partager" onPress={share} />
            </View>
          </View>

          {photos.length > 1 ? (
            <View style={{ position: 'absolute', right: 14, bottom: 12, backgroundColor: 'rgba(20,33,61,0.6)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 }}>
              <Txt weight="semi" size={12} color={colors.white}>{index + 1}/{photos.length}</Txt>
            </View>
          ) : null}
        </View>

        {photos.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingTop: 10 }}>
            {photos.map((u, i) => (
              <Pressable key={u + i} onPress={() => goTo(i)}>
                <Image source={{ uri: u }} style={{ width: 62, height: 50, borderRadius: 8, borderWidth: 2, borderColor: i === index ? colors.blue : 'transparent' }} contentFit="cover" />
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        <View style={{ padding: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Badge label={TYPE_LABEL[listing.type] || listing.type} />
            <Txt weight="bold" size={15} color={colors.blue}>
              {formatNumber(listing.rent_fcfa)} FCFA <Txt size={12} color={colors.muted}>/ mois</Txt>
            </Txt>
          </View>

          <Txt weight="bold" size={20} style={{ marginTop: 12 }}>{listing.title}</Txt>

          {place ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 }}>
              <Ionicons name="location-outline" size={15} color={colors.muted} />
              <Txt size={13} color={colors.muted}>{place}</Txt>
            </View>
          ) : null}

          {(listing.bedrooms || listing.max_roommates) ? (
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
              {listing.bedrooms ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Ionicons name="bed-outline" size={15} color={colors.muted} />
                  <Txt size={13} color={colors.muted}>{listing.bedrooms} chambre{listing.bedrooms > 1 ? 's' : ''}</Txt>
                </View>
              ) : null}
              {listing.max_roommates ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Ionicons name="people-outline" size={15} color={colors.muted} />
                  <Txt size={13} color={colors.muted}>{listing.max_roommates} colocataire{listing.max_roommates > 1 ? 's' : ''} max</Txt>
                </View>
              ) : null}
            </View>
          ) : null}

          {mine ? <View style={{ marginTop: 12 }}><StatusPill status={listing.status} /></View> : null}

          {listing.description ? (
            <>
              <Txt weight="bold" size={15} style={{ marginTop: 22 }}>Description</Txt>
              <Txt size={14} color={colors.ink} style={{ marginTop: 6, lineHeight: 21 }}>{listing.description}</Txt>
            </>
          ) : null}

          {conditions.length ? (
            <>
              <Txt weight="bold" size={15} style={{ marginTop: 22 }}>Conditions</Txt>
              <View style={{ marginTop: 6, gap: 4 }}>
                {conditions.map(c => <Txt key={c} size={14}>{c}</Txt>)}
              </View>
            </>
          ) : null}
        </View>
      </ScrollView>

      <View style={{ padding: 16, paddingBottom: insets.bottom + 12, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.white }}>
        {mine ? (
          <Button title="C'est votre annonce" variant="outline" disabled />
        ) : paid ? (
          <Button title="Voir le contact" icon="call" onPress={() => router.push({ pathname: '/unlocked', params: { id: listing.id } })} />
        ) : (
          <Button title="Débloquer le contact" icon="lock-closed" onPress={() => router.push(`/pay/${listing.id}`)} />
        )}
      </View>
    </View>
  );
}
