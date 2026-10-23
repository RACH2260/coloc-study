import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { Button, Card, Header, Screen, Txt } from '../components/ui';
import { useAuth } from '../lib/auth';
import { ROLE_LABEL } from '../lib/format';
import { colors } from '../lib/theme';

export default function Settings() {
  const router = useRouter();
  const { signOut, profile, user } = useAuth();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    await signOut();
    router.replace('/');
  }

  return (
    <Screen>
      <Header onBack={() => router.back()} title="Paramètres" />
      <Card>
        <Txt size={12} color={colors.muted}>Compte</Txt>
        <Txt weight="semi" size={14} style={{ marginTop: 2 }}>{user?.email}</Txt>
        <Txt size={13} color={colors.muted} style={{ marginTop: 2 }}>{ROLE_LABEL[profile?.role]}</Txt>
      </Card>
      <Button title="Se déconnecter" variant="danger" onPress={logout} loading={busy} style={{ marginTop: 20 }} />
      <View style={{ alignItems: 'center', marginTop: 32 }}>
        <Txt size={12} color={colors.muted}>Coloc'Study, version {Constants.expoConfig?.version || '1.0.0'}</Txt>
      </View>
    </Screen>
  );
}
