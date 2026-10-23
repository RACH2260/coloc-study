import { useState } from 'react';
import { Alert, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Chip, ErrorText, Field, Header, Screen, Txt } from '../components/ui';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { REPORT_REASONS } from '../lib/moderation';
import { colors } from '../lib/theme';

// Écran de signalement. Paramètres : type = 'annonce' | 'profil', id = id de l'annonce ou de l'utilisateur
export default function Report() {
  const { type, id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const kind = type === 'profil' ? 'profil' : 'annonce';
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError('');
    if (!reason) return setError('Choisissez un motif.');
    setBusy(true);
    const row = {
      reporter_id: user.id,
      target_type: kind,
      reason,
      details: details.trim() || null,
      ...(kind === 'annonce' ? { listing_id: id } : { target_user_id: id }),
    };
    const { error: err } = await supabase.from('reports').insert(row);
    setBusy(false);
    if (err) {
      if (err.code === '23505') return setError('Vous avez déjà signalé ceci. Nous allons l\'examiner.');
      return setError('Signalement non envoyé. Vérifiez votre connexion et réessayez.');
    }
    Alert.alert('Merci', 'Votre signalement a été envoyé. Nous allons l\'examiner rapidement.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  }

  return (
    <Screen>
      <Header onBack={() => router.back()} title="Signaler" />
      <Txt color={colors.muted}>
        {kind === 'annonce' ? 'Pourquoi signalez-vous cette annonce ?' : 'Pourquoi signalez-vous cet utilisateur ?'}
      </Txt>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
        {REPORT_REASONS[kind].map(r => (
          <Chip key={r} label={r} active={reason === r} onPress={() => setReason(r)} />
        ))}
      </View>

      <Field label="Détails (facultatif)" value={details} onChangeText={setDetails} placeholder="Expliquez ce qui ne va pas" multiline maxLength={500} />
      <ErrorText>{error}</ErrorText>
      <Button title="Envoyer le signalement" onPress={submit} loading={busy} style={{ marginTop: 20 }} />
    </Screen>
  );
}
