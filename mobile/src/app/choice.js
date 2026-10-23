import { Pressable, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Logo, Screen, Txt } from '../components/ui';
import { useAuth } from '../lib/auth';
import { colors, radius } from '../lib/theme';

function ProfileCard({ avatar, title, text, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        marginTop: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: colors.line,
        borderRadius: radius.lg,
        backgroundColor: pressed ? colors.blueSoft : colors.white,
      })}
    >
      <Image source={avatar} style={{ width: 64, height: 64, borderRadius: 32 }} contentFit="cover" />
      <View style={{ flex: 1 }}>
        <Txt weight="bold" size={16}>{title}</Txt>
        <Txt size={13} color={colors.muted}>{text}</Txt>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.muted} />
    </Pressable>
  );
}

export default function Choice() {
  const router = useRouter();
  const { signedIn } = useAuth();
  if (signedIn) return <Redirect href="/(tabs)/home" />;

  return (
    <Screen>
      <View style={{ marginTop: 24, marginBottom: 40 }}>
        <Logo size={26} />
      </View>
      <Txt weight="bold" size={26}>Bienvenue !</Txt>
      <Txt color={colors.muted} style={{ marginTop: 4 }}>Choisissez votre profil pour continuer</Txt>

      <ProfileCard
        avatar={require('../../assets/images/avatar_student.png')}
        title="Étudiant"
        text="Je recherche un colocataire ou un logement"
        onPress={() => router.push({ pathname: '/signup', params: { role: 'etudiant' } })}
      />
      <ProfileCard
        avatar={require('../../assets/images/avatar_owner.png')}
        title="Propriétaire / Habitant"
        text="Je propose un logement libre"
        onPress={() => router.push({ pathname: '/signup', params: { role: 'proprietaire' } })}
      />

      <Txt color={colors.muted} size={13} style={{ textAlign: 'center', marginTop: 48 }}>
        Déjà un compte ?{' '}
        <Txt weight="semi" size={13} color={colors.blue} onPress={() => router.push('/login')} style={{ textDecorationLine: 'underline' }}>
          Se connecter
        </Txt>
      </Txt>
    </Screen>
  );
}
