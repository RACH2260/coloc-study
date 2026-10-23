import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import { AuthProvider, useAuth } from '../lib/auth';
import { FavoritesProvider } from '../lib/favorites';
import { Loader } from '../components/ui';
import { colors } from '../lib/theme';

function Gate() {
  const { loading, signedIn } = useAuth();
  if (loading) return <Loader />;
  // key : à la connexion/déconnexion, toute la navigation est reconstruite.
  // Les écrans ouverts sont fermés au lieu d'être redessinés avec un utilisateur vide (plantage).
  return (
    <Stack
      key={signedIn ? 'in' : 'out'}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: colors.white },
      }}
    />
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });
  if (!loaded) return <Loader />;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <FavoritesProvider>
          <StatusBar style="dark" />
          <Gate />
        </FavoritesProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
