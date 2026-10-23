import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Txt } from './ui';
import { colors, radius } from '../lib/theme';
import { firstPhoto, formatNumber, TYPE_LABEL } from '../lib/format';
import { useFavorites } from '../lib/favorites';

export default function ListingCard({ listing, onPress, compact = false, showHeart = true, footer }) {
  const { isFav, toggle } = useFavorites();
  const photo = firstPhoto(listing);
  const place = [listing.neighborhood, listing.city].filter(Boolean).join(', ');

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.line,
        borderRadius: radius.lg,
        overflow: 'hidden',
        opacity: pressed ? 0.92 : 1,
      })}
    >
      <View style={{ height: compact ? 110 : 150, backgroundColor: colors.blueSoft }}>
        {photo ? (
          <Image source={{ uri: photo }} style={{ flex: 1 }} contentFit="cover" transition={150} />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="image-outline" size={32} color={colors.blue} />
          </View>
        )}
        <Badge label={TYPE_LABEL[listing.type] || listing.type} style={{ position: 'absolute', top: 10, left: 10 }} />
        {showHeart ? (
          <Pressable
            onPress={() => toggle(listing.id)}
            hitSlop={8}
            accessibilityLabel="Ajouter aux favoris"
            style={{ position: 'absolute', top: 8, right: 8, width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name={isFav(listing.id) ? 'heart' : 'heart-outline'} size={19} color={isFav(listing.id) ? colors.danger : colors.ink} />
          </Pressable>
        ) : null}
      </View>

      <View style={{ padding: 12, gap: 3 }}>
        <Txt weight="bold" size={compact ? 13 : 14} color={colors.blue}>
          {formatNumber(listing.rent_fcfa)} FCFA <Txt size={11} color={colors.muted}>/ mois</Txt>
        </Txt>
        <Txt weight="semi" size={compact ? 13 : 14} numberOfLines={1}>{listing.title}</Txt>
        {place ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="location-outline" size={13} color={colors.muted} />
            <Txt size={12} color={colors.muted} numberOfLines={1} style={{ flex: 1 }}>{place}</Txt>
          </View>
        ) : null}
        {!compact && (listing.bedrooms || listing.max_roommates) ? (
          <View style={{ flexDirection: 'row', gap: 14, marginTop: 2 }}>
            {listing.bedrooms ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="bed-outline" size={13} color={colors.muted} />
                <Txt size={12} color={colors.muted}>{listing.bedrooms} chambre{listing.bedrooms > 1 ? 's' : ''}</Txt>
              </View>
            ) : null}
            {listing.max_roommates ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="people-outline" size={13} color={colors.muted} />
                <Txt size={12} color={colors.muted}>{listing.max_roommates} colocataire{listing.max_roommates > 1 ? 's' : ''} max</Txt>
              </View>
            ) : null}
          </View>
        ) : null}
        {footer}
      </View>
    </Pressable>
  );
}
