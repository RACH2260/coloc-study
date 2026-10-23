import { ScrollView, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Button, Card, Txt } from '../../components/ui';
import { useAuth } from '../../lib/auth';
import { ROLE_LABEL } from '../../lib/format';
import { colors } from '../../lib/theme';

function MenuRow({ icon, label, onPress, last }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 14,
        paddingHorizontal: 4,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.line,
        backgroundColor: pressed ? colors.bg : 'transparent',
      })}
    >
      <Ionicons name={icon} size={20} color={colors.ink} />
      <Txt weight="medium" size={14} style={{ flex: 1 }}>{label}</Txt>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

export default function Profile() {
  const router = useRouter();
  const { profile, user } = useAuth();

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.white }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <Avatar uri={profile.avatar_url} name={profile.full_name} size={72} />
          <View style={{ flex: 1 }}>
            <Txt weight="bold" size={20}>{profile.full_name}</Txt>
            <Txt size={13} color={colors.muted}>{ROLE_LABEL[profile.role]}</Txt>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 }}>
              <Ionicons name="mail-outline" size={13} color={colors.muted} />
              <Txt size={12} color={colors.muted} numberOfLines={1} style={{ flex: 1 }}>{user.email}</Txt>
            </View>
          </View>
        </View>

        <Button title="Modifier le profil" variant="soft" onPress={() => router.push('/edit-profile')} style={{ marginTop: 18 }} />

        <Card style={{ marginTop: 20, paddingVertical: 4 }}>
          <MenuRow icon="albums-outline" label="Mes annonces" onPress={() => router.push('/my-listings')} />
          <MenuRow icon="heart-outline" label="Mes favoris" onPress={() => router.push('/(tabs)/favorites')} />
          <MenuRow icon="chatbubble-outline" label="Mes messages" onPress={() => router.push('/(tabs)/messages')} />
          <MenuRow icon="receipt-outline" label="Mes paiements" onPress={() => router.push('/receipts')} />
          <MenuRow icon="help-circle-outline" label="Aide et support" onPress={() => router.push('/help')} />
          <MenuRow icon="settings-outline" label="Paramètres" onPress={() => router.push('/settings')} last />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
