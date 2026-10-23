import { useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { Button, ErrorText, Field, Header, Screen, Txt } from '../components/ui';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { authErrorMessage } from '../lib/format';
import { colors } from '../lib/theme';

export default function Login() {
  const router = useRouter();
  const { signedIn, refreshProfile } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (signedIn) return <Redirect href="/(tabs)/home" />;

  async function submit() {
    setError('');
    if (!email.trim() || !password) return setError('Entrez votre e-mail et votre mot de passe.');
    setBusy(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (err) {
      setBusy(false);
      return setError(authErrorMessage(err));
    }
    const profile = await refreshProfile();
    if (!profile) {
      await supabase.auth.signOut();
      setError('Profil introuvable. Créez un compte depuis l\'accueil.');
    }
    setBusy(false);
  }

  return (
    <Screen>
      <Header onBack={() => router.back()} title="" />
      <Txt weight="bold" size={26}>Se connecter</Txt>
      <Txt color={colors.muted} style={{ marginTop: 4 }}>Content de vous revoir.</Txt>

      <Field label="E-mail" value={email} onChangeText={setEmail} placeholder="vous@exemple.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
      <Field label="Mot de passe" value={password} onChangeText={setPassword} placeholder="Votre mot de passe" secureTextEntry autoCapitalize="none" />

      <Txt weight="semi" size={13} color={colors.blue} onPress={() => router.push('/forgot-password')} style={{ marginTop: 12, alignSelf: 'flex-end', textDecorationLine: 'underline' }}>
        Mot de passe oublié ?
      </Txt>

      <ErrorText>{error}</ErrorText>
      <Button title="Se connecter" onPress={submit} loading={busy} style={{ marginTop: 20 }} />

      <Txt color={colors.muted} size={13} style={{ textAlign: 'center', marginTop: 20 }}>
        Pas encore de compte ?{' '}
        <Txt weight="semi" size={13} color={colors.blue} onPress={() => router.replace('/choice')} style={{ textDecorationLine: 'underline' }}>
          Créer un compte
        </Txt>
      </Txt>
    </Screen>
  );
}
