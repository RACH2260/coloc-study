import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, ErrorText, Field, Header, Screen, Txt } from '../components/ui';
import { lastProfileError, savePendingProfile, useAuth } from '../lib/auth';
import { KEY_MISSING } from '../lib/config';
import { supabase } from '../lib/supabase';
import { authErrorMessage, normalizePhone } from '../lib/format';
import { colors, radius } from '../lib/theme';

function GoalOption({ label, selected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        borderRadius: radius.md,
        borderWidth: 1.5,
        borderColor: selected ? colors.blue : colors.line,
        backgroundColor: selected ? colors.blueSoft : colors.white,
      }}
    >
      <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={20} color={selected ? colors.blue : colors.muted} />
      <Txt weight="semi" size={13} style={{ flex: 1 }}>{label}</Txt>
    </Pressable>
  );
}

export default function Signup() {
  const router = useRouter();
  const { role: roleParam } = useLocalSearchParams();
  const role = roleParam === 'proprietaire' ? 'proprietaire' : 'etudiant';
  const { signedIn, refreshProfile } = useAuth();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [goal, setGoal] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  if (signedIn) return <Redirect href="/(tabs)/home" />;

  async function submit() {
    setError('');
    setInfo('');
    const cleanPhone = normalizePhone(phone);
    if (name.trim().length < 2) return setError('Entrez votre nom complet.');
    if (!cleanPhone) return setError('Entrez un numéro à 8 chiffres.');
    if (role === 'etudiant' && !goal) return setError('Indiquez ce que vous cherchez.');
    if (!email.trim()) return setError('Entrez votre e-mail.');
    if (password.length < 6) return setError('Le mot de passe doit contenir au moins 6 caractères.');

    if (KEY_MISSING) return setError('Clé Supabase absente : complétez EXPO_PUBLIC_SUPABASE_ANON_KEY dans mobile/.env, puis relancez avec : npx expo start -c');

    setBusy(true);
    await savePendingProfile({ role, goal, full_name: name.trim(), phone: cleanPhone });
    const { data, error: err } = await supabase.auth.signUp({ email: email.trim(), password });
    if (err) {
      setBusy(false);
      return setError(authErrorMessage(err));
    }
    if (data.session) {
      const created = await refreshProfile(); // crée le profil depuis les infos enregistrées, la redirection suit
      setBusy(false);
      if (!created) {
        setError(
          'Compte créé, mais le profil n\'a pas pu être enregistré' +
            (lastProfileError ? ' (' + lastProfileError + ')' : '') +
            '. Vérifiez que schema.sql a bien été exécuté dans Supabase.'
        );
      }
    } else {
      setBusy(false);
      setInfo('Un e-mail de confirmation vous a été envoyé. Confirmez-le, puis connectez-vous.');
    }
  }

  return (
    <Screen>
      <Header onBack={() => router.back()} title="" />
      <Txt weight="bold" size={26}>{role === 'etudiant' ? 'Compte étudiant' : 'Compte propriétaire'}</Txt>
      <Txt color={colors.muted} style={{ marginTop: 4 }}>
        {role === 'etudiant' ? 'Trouvez un colocataire ou un logement.' : 'Publiez votre logement libre.'}
      </Txt>

      <Field label="Nom complet" value={name} onChangeText={setName} placeholder="Ex : Aminata Ouédraogo" autoComplete="name" />
      <Field label="Téléphone" prefix="+226" value={phone} onChangeText={setPhone} placeholder="70 12 34 56" keyboardType="phone-pad" />

      {role === 'etudiant' ? (
        <View style={{ marginTop: 16 }}>
          <Txt weight="semi" size={13} style={{ marginBottom: 8 }}>Que cherchez-vous ?</Txt>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <GoalOption label="Un colocataire" selected={goal === 'colocataire'} onPress={() => setGoal('colocataire')} />
            <GoalOption label="Un logement" selected={goal === 'logement'} onPress={() => setGoal('logement')} />
          </View>
        </View>
      ) : null}

      <Field label="E-mail" value={email} onChangeText={setEmail} placeholder="vous@exemple.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
      <Field label="Mot de passe" value={password} onChangeText={setPassword} placeholder="6 caractères minimum" secureTextEntry autoCapitalize="none" />

      <ErrorText>{error}</ErrorText>
      {info ? <Txt weight="semi" size={13} color={colors.ok} style={{ marginTop: 10 }}>{info}</Txt> : null}

      <Button title="Créer mon compte" onPress={submit} loading={busy} style={{ marginTop: 20 }} />

      <Txt color={colors.muted} size={13} style={{ textAlign: 'center', marginTop: 20 }}>
        Déjà un compte ?{' '}
        <Txt weight="semi" size={13} color={colors.blue} onPress={() => router.replace('/login')} style={{ textDecorationLine: 'underline' }}>
          Se connecter
        </Txt>
      </Txt>
    </Screen>
  );
}
