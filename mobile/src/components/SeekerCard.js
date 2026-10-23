import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Badge, Txt } from './ui';
import { colors, radius } from '../lib/theme';
import { formatNumber } from '../lib/format';
import { LOOKING_LABEL } from '../lib/seekers';

export default function SeekerCard({ seeker, onPress }) {
  const place = [seeker.neighborhood, seeker.city].filter(Boolean).join(', ');
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        gap: 12,
        padding: 14,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.line,
        borderRadius: radius.lg,
        opacity: pressed ? 0.92 : 1,
      })}
    >
      <Avatar uri={seeker.avatar_url} name={seeker.full_name} size={56} />
      <View style={{ flex: 1, gap: 4 }}>
        <Txt weight="bold" size={15} numberOfLines={1}>{seeker.full_name}</Txt>
        <Badge label={LOOKING_LABEL[seeker.looking_for]} bg={colors.blueSoft} fg={colors.blue} />
        {place ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Ionicons name="location-outline" size={14} color={colors.muted} />
            <Txt size={13} color={colors.muted} numberOfLines={1} style={{ flex: 1 }}>{place}</Txt>
          </View>
        ) : null}
        <Txt size={13} color={colors.muted}>
          {[
            seeker.budget_max_fcfa ? `Budget : ${formatNumber(seeker.budget_max_fcfa)} FCFA` : null,
            seeker.move_in || null,
          ].filter(Boolean).join(' · ')}
        </Txt>
        {seeker.tags?.length ? (
          <Txt size={12} color={colors.blue} numberOfLines={1}>{seeker.tags.slice(0, 3).join(' · ')}</Txt>
        ) : null}
      </View>
    </Pressable>
  );
}
