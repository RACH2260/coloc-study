import { useEffect, useState } from 'react';
import { Linking, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, ErrorText, Loader, Screen, Txt } from '../components/ui';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { formatPhone } from '../lib/format';
import { colors } from '../lib/theme';

const CONFETTI = [
  { top: 6, left: '18%', c: '#F7B500' }, { top: 30, left: '78%', c: '#1553D6' },
  { top: 70, left: '10%', c: '#FF5A5F' }, { top: 12, left: '60%', c: '#12805C' },
  { top: 90, left: '88%', c: '#F7B500' }, { top: 58, left: '30%', c: '#1553D6' },
];

export default function Unlocked() {
  const { id, fresh } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [phone, setPhone] = useState(null);
  const [ownerId, setOwnerId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chatBusy, setChatBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: num } = await supabase.rpc('get_listing_contact', { p_listing_id: id });
      const { data: l } = await supabase.from('listings').select('owner_id').eq('id', id).maybeSingle();
      setPhone(num);
      setOwnerId(l?.owner_id ?? null);
      setLoading(false);
    })();
  }, [id]);

  async function openChat() {
    if (!ownerId) return;
    setChatBusy(true);
    setError('');
    let { data: conv } = await supabase
      .from('conversations')
      .select('id')
      .eq('listing_id', id)
      .eq('user_a', user.id)
      .eq('user_b', ownerId)
      .maybeSingle();
    if (!conv) {
      const res = await supabase
        .from('conversations')
        .insert({ listing_id: id, user_a: user.id, user_b: ownerId })
        .select('id')
        .single();
      conv = res.data;
      if (res.error) {
        setChatBusy(false);
        return setError('Impossible d\'ouvrir la discussion.');
      }
    }
    setChatBusy(false);
    router.push(`/chat/${conv.id}`);
  }

  if (loading) return <Loader />;

  if (!phone) {
    return (
      <Screen>
        <View style={{ alignItems: 'center', paddingTop: 60 }}>
          <Ionicons name="lock-closed" size={48} color={colors.muted} />
          <Txt weight="bold" size={18} style={{ marginTop: 12 }}>Contact non débloqué</Txt>
          <Txt color={colors.muted} style={{ textAlign: 'center', marginTop: 6 }}>Effectuez le paiement pour voir le numéro.</Txt>
        </View>
        <Button title="Retour à l'annonce" onPress={() => router.replace(`/listing/${id}`)} style={{ marginTop: 28 }} />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={{ alignItems: 'center', marginTop: 30 }}>
        <View style={{ width: 130, height: 130, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch' }}>
          {CONFETTI.map((d, i) => (
            <View key={i} style={{ position: 'absolute', top: d.top, left: d.left, width: 7, height: 7, borderRadius: 4, backgroundColor: d.c }} />
          ))}
          <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: colors.ok, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="checkmark" size={50} color={colors.white} />
          </View>
        </View>
        <Txt weight="bold" size={24} color={colors.ok} style={{ marginTop: 4 }}>
          {fresh ? 'Paiement réussi !' : 'Contact débloqué'}
        </Txt>
        <Txt size={13} color={colors.muted} style={{ marginTop: 6, textAlign: 'center' }}>
          Le numéro du propriétaire est maintenant débloqué.
        </Txt>
      </View>

      <Card style={{ marginTop: 28 }}>
        <Txt size={13} color={colors.muted}>Contact</Txt>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.okSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="call" size={20} color={colors.ok} />
          </View>
          <Txt weight="bold" size={20} selectable>{formatPhone(phone)}</Txt>
        </View>
        <Button title="Appeler" icon="call" onPress={() => Linking.openURL(`tel:${phone}`)} style={{ marginTop: 14 }} />
        <Button title="Envoyer un message" icon="chatbubble-outline" variant="soft" onPress={openChat} loading={chatBusy} style={{ marginTop: 10 }} />
        <ErrorText>{error}</ErrorText>
      </Card>

      <Button title="Retour aux détails de l'annonce" variant="soft" onPress={() => router.replace(`/listing/${id}`)} style={{ marginTop: 16 }} />
      {fresh ? (
        <Txt weight="semi" size={13} color={colors.blue} onPress={() => router.push('/receipts')} style={{ textAlign: 'center', marginTop: 16, textDecorationLine: 'underline' }}>
          Voir mon reçu
        </Txt>
      ) : null}
    </Screen>
  );
}
