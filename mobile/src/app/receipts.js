import { useEffect, useState } from 'react';
import { FlatList, Share, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card, EmptyState, Header, Screen, Txt } from '../components/ui';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { formatDate, formatFcfa } from '../lib/format';
import { colors } from '../lib/theme';

function Line({ label, value }) {
  if (!value) return null;
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 6 }}>
      <Txt size={12} color={colors.muted}>{label}</Txt>
      <Txt weight="medium" size={12} style={{ flexShrink: 1, textAlign: 'right' }}>{value}</Txt>
    </View>
  );
}

export default function Receipts() {
  const router = useRouter();
  const { profile } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('payments')
      .select('id, amount_fcfa, receipt_number, listing_title, orange_ref, paid_at')
      .eq('status', 'paye')
      .order('paid_at', { ascending: false })
      .then(({ data }) => {
        setItems(data || []);
        setLoading(false);
      });
  }, []);

  function share(p) {
    Share.share({
      message:
        `Reçu Coloc'Study ${p.receipt_number || ''}\n` +
        `Annonce : ${p.listing_title || '-'}\n` +
        `Montant : ${formatFcfa(p.amount_fcfa)}\n` +
        `Date : ${formatDate(p.paid_at)}\n` +
        `Payé par : ${profile.full_name}` +
        (p.orange_ref ? `\nRéf. Orange Money : ${p.orange_ref}` : ''),
    });
  }

  return (
    <Screen scroll={false} contentStyle={{ padding: 20, paddingBottom: 0 }}>
      <Header onBack={() => router.back()} title="Mes paiements" />
      <FlatList
        data={items}
        keyExtractor={p => p.id}
        contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
        renderItem={({ item }) => (
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Txt weight="bold" size={14}>{item.receipt_number || 'Reçu'}</Txt>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="checkmark-circle" size={16} color={colors.ok} />
                <Txt weight="semi" size={12} color={colors.ok}>Payé</Txt>
              </View>
            </View>
            <Txt weight="bold" size={22} style={{ marginTop: 8 }}>{formatFcfa(item.amount_fcfa)}</Txt>
            <View style={{ height: 1, backgroundColor: colors.line, marginTop: 10 }} />
            <Line label="Annonce" value={item.listing_title} />
            <Line label="Date" value={formatDate(item.paid_at)} />
            <Line label="Payé par" value={profile.full_name} />
            <Line label="Réf. Orange Money" value={item.orange_ref} />
            <Txt weight="semi" size={13} color={colors.blue} onPress={() => share(item)} style={{ marginTop: 12 }}>Partager le reçu</Txt>
          </Card>
        )}
        ListEmptyComponent={
          loading ? null : (
            <EmptyState icon="receipt-outline" title="Aucun paiement" text="Vos reçus apparaîtront ici après un déblocage de contact." />
          )
        }
      />
    </Screen>
  );
}
