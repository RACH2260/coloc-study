import { ImageBackground, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Txt } from '../components/ui';
import { useAuth } from '../lib/auth';
import { KEY_MISSING } from '../lib/config';
import { colors } from '../lib/theme';

export default function Welcome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signedIn } = useAuth();
  if (signedIn) return <Redirect href="/(tabs)/home" />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.blue }}>
      <StatusBar style="light" />
      <ImageBackground
        source={require('../../assets/images/welcome_city.png')}
        resizeMode="cover"
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(12, 52, 150, 0.62)', paddingTop: insets.top + 56, alignItems: 'center' }}>
          <Ionicons name="school" size={74} color={colors.white} />
          <Txt weight="black" size={42} color={colors.white} style={{ letterSpacing: -1, marginTop: 4 }}>
            Coloc<Txt weight="black" size={42} color={colors.yellow}>'Study</Txt>
          </Txt>
          <Txt weight="medium" size={20} color={colors.white} style={{ textAlign: 'center', marginTop: 28, lineHeight: 28 }}>
            Trouvez votre logement,{'\n'}votre coloc, votre avenir
          </Txt>
        </View>
      </ImageBackground>

      <View
        style={{
          marginTop: -28,
          backgroundColor: colors.white,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          padding: 24,
          paddingBottom: insets.bottom + 24,
          gap: 12,
        }}
      >
        {KEY_MISSING ? (
          <Txt size={12} color={colors.danger} weight="semi" style={{ textAlign: 'center' }}>
            Clé Supabase manquante : renseigne EXPO_PUBLIC_SUPABASE_ANON_KEY dans le fichier .env
          </Txt>
        ) : null}
        <Button title="Commencer" onPress={() => router.push('/choice')} />
        <Button title="Se connecter" variant="outline" onPress={() => router.push('/login')} />
        <Txt color={colors.muted} size={13} style={{ textAlign: 'center', marginTop: 4 }}>
          Étudiant ? Propriétaire ?{'\n'}Rejoignez la communauté !
        </Txt>
      </View>
    </View>
  );
}
