import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Badge, Button, Card, EmptyState, ErrorText, Header, Loader, Screen, Txt } from '../../components/ui';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { formatNumber } from '../../lib/format';
import { LOOKING_LABEL, openDirectChat, SEEKER_COLUMNS } from '../../lib/seekers';
import { colors } from '../../lib/theme';

function Row({ icon, label, value }) {
  if (!value) return null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 }}>
      <Ionicons name={icon} size={18} color={colors.muted} />
      <View style={{ flex: 1 }}>
        <Txt size={11} color={colors.muted}>{label}</Txt>
        <Txt size={14}>{value}</Txt>
      </View>
    </View>
  );
}

// Fiche d'un profil de recherche (id = id de l'utilisateur)
export default function SeekerDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [seeker, setSeeker] = useState(null);
  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const [{ data: s }, { data: p }] = await Promise.all([
        supabase.from('seeker_profiles').select(SEEKER_COLUMNS).eq('user_id', id).maybeSingle(),
        supabase.from('public_profiles').select('id, full_name, avatar_url').eq('id', id).maybeSingle(),
      ]);
      setSeeker(s);
      setPerson(p);
      setLoading(false);
    })();
  }, [id]);

  const mine = id === user.id;

  async function contact() {
    setError('');
    setBusy(true);
    const res = await openDirectChat(user.id, id);
    setBusy(false);
    if (res.error) return setError('Impossible d\'ouvrir la discussion. Réessayez.');
    router.push(`/chat/${res.id}`);
  }

  if (loading) return <Loader />;
  if (!seeker) {
    return (
      <Screen>
        <Header onBack={() => router.back()} title="" />
        <EmptyState icon="person-outline" title="Profil introuvable" text="Il a peut-être été retiré ou masqué." />
      </Screen>
    );
  }

  const place = [seeker.neighborhood, seeker.city].filter(Boolean).join(', ');
  const name = person?.full_name || 'Étudiant';

  return (
    <Screen
      footer={
        <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.white }}>
          <ErrorText>{error}</ErrorText>
          {mine ? (
            <Button title="Modifier mon profil" variant="soft" onPress={() => router.push('/seeker-edit')} />
          ) : (
            <Button title="Envoyer un message" icon="chatbubble" onPress={contact} loading={busy} />
          )}
        </View>
      }
    >
      <Header
        onBack={() => router.back()}
        title=""
        right={
          mine ? null : (
            <Pressable onPress={() => router.push({ pathname: '/report', params: { type: 'profil', id } })} hitSlop={10} accessibilityLabel="Signaler">
              <Ionicons name="flag-outline" size={22} color={colors.muted} />
            </Pressable>
          )
        }
      />

      <View style={{ alignItems: 'center' }}>
        <Avatar uri={person?.avatar_url} name={name} size={96} />
        <Txt weight="bold" size={22} style={{ marginTop: 12 }}>{name}</Txt>
        <Badge label={LOOKING_LABEL[seeker.looking_for]} bg={colors.blueSoft} fg={colors.blue} style={{ marginTop: 8, alignSelf: 'center' }} />
      </View>

      <Card style={{ marginTop: 22 }}>
        <Row icon="location-outline" label="Où" value={place} />
        <Row icon="cash-outline" label="Budget maximum" value={seeker.budget_max_fcfa ? `${formatNumber(seeker.budget_max_fcfa)} FCFA / mois` : null} />
        <Row icon="calendar-outline" label="Quand" value={seeker.move_in} />
        <Row icon="school-outline" label="École ou université" value={seeker.school} />
      </Card>

      {seeker.about ? (
        <>
          <Txt weight="bold" size={15} style={{ marginTop: 22 }}>À propos</Txt>
          <Txt size={14} style={{ marginTop: 6, lineHeight: 21 }}>{seeker.about}</Txt>
        </>
      ) : null}

      {seeker.tags?.length ? (
        <>
          <Txt weight="bold" size={15} style={{ marginTop: 22 }}>Style de vie</Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {seeker.tags.map(t => <Badge key={t} label={t} bg={colors.bg} fg={colors.ink} style={{ paddingVertical: 6, paddingHorizontal: 10 }} />)}
          </View>
        </>
      ) : null}

      <Txt size={12} color={colors.muted} style={{ marginTop: 24 }}>
        Pour votre sécurité, ne partagez jamais d'argent avant d'avoir rencontré la personne et visité le logement.
      </Txt>
    </Screen>
  );
}
