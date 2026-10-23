import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, View } from 'react-native';
import { Redirect, useFocusEffect, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Button, Card, Chip, EmptyState, Header, Screen, Txt } from '../components/ui';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { LISTING_COLUMNS } from '../lib/listings';
import { REFUSE_REASONS } from '../lib/moderation';
import { firstPhoto, formatFcfa, formatShortDate, TYPE_LABEL } from '../lib/format';
import { colors, radius } from '../lib/theme';

// Écran réservé aux administrateurs : validation des annonces et signalements
export default function Admin() {
  const router = useRouter();
  const { profile } = useAuth();
  const [tab, setTab] = useState('annonces');
  const [listings, setListings] = useState([]);
  const [reports, setReports] = useState([]);
  const [error, setError] = useState('');
  const [refusingId, setRefusingId] = useState(null);

  const load = useCallback(async () => {
    setError('');
    const { data: ls, error: e1 } = await supabase
      .from('listings')
      .select(LISTING_COLUMNS)
      .eq('status', 'en_attente')
      .order('created_at', { ascending: true });

    const { data: rs, error: e2 } = await supabase
      .from('reports')
      .select('*')
      .eq('status', 'ouvert')
      .order('created_at', { ascending: false });

    if (e1 || e2) setError('Chargement impossible. Vérifiez que la migration v2 a été exécutée et que votre compte est admin.');

    // noms des propriétaires / personnes concernées
    const ids = [...new Set([...(ls || []).map(l => l.owner_id), ...(rs || []).map(r => r.target_user_id).filter(Boolean)])];
    const listingIds = [...new Set((rs || []).map(r => r.listing_id).filter(Boolean))];
    const [{ data: people }, { data: repListings }] = await Promise.all([
      ids.length ? supabase.from('public_profiles').select('id, full_name').in('id', ids) : { data: [] },
      listingIds.length ? supabase.from('listings').select('id, title').in('id', listingIds) : { data: [] },
    ]);
    const nameOf = id => (people || []).find(p => p.id === id)?.full_name || 'Utilisateur';

    setListings((ls || []).map(l => ({ ...l, ownerName: nameOf(l.owner_id) })));
    setReports(
      (rs || []).map(r => ({
        ...r,
        targetLabel:
          r.target_type === 'annonce'
            ? (repListings || []).find(l => l.id === r.listing_id)?.title || 'Annonce'
            : nameOf(r.target_user_id),
      }))
    );
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (!profile?.is_admin) return <Redirect href="/(tabs)/profile" />;

  async function approve(l) {
    const { error: err } = await supabase.from('listings').update({ status: 'en_ligne', moderation_note: null }).eq('id', l.id);
    if (err) return Alert.alert('Erreur', err.message);
    load();
  }

  async function refuse(l, reason) {
    const { error: err } = await supabase.from('listings').update({ status: 'refuse', moderation_note: reason }).eq('id', l.id);
    if (err) return Alert.alert('Erreur', err.message);
    setRefusingId(null);
    load();
  }

  async function closeReport(r, status, extra) {
    if (extra) {
      const { error: err } = await extra();
      if (err) return Alert.alert('Erreur', err.message);
    }
    const { error: err2 } = await supabase.from('reports').update({ status }).eq('id', r.id);
    if (err2) return Alert.alert('Erreur', err2.message);
    load();
  }

  function archiveListing(r) {
    Alert.alert('Archiver cette annonce ?', 'Elle ne sera plus visible par les utilisateurs.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Archiver', style: 'destructive', onPress: () => closeReport(r, 'traite', () => supabase.from('listings').update({ status: 'archive' }).eq('id', r.listing_id)) },
    ]);
  }

  function hideProfile(r) {
    Alert.alert('Masquer ce profil de recherche ?', 'Il ne sera plus visible par les autres étudiants.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Masquer', style: 'destructive', onPress: () => closeReport(r, 'traite', () => supabase.from('seeker_profiles').update({ hidden_by_admin: true }).eq('user_id', r.target_user_id)) },
    ]);
  }

  const tabs = [
    { key: 'annonces', label: `Annonces (${listings.length})` },
    { key: 'signalements', label: `Signalements (${reports.length})` },
  ];

  const renderListing = ({ item }) => {
    const photo = firstPhoto(item);
    const place = [item.neighborhood, item.city].filter(Boolean).join(', ');
    return (
      <Card style={{ padding: 12 }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ width: 90, height: 90, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' }}>
            {photo ? <Image source={{ uri: photo }} style={{ width: 90, height: 90 }} contentFit="cover" /> : <Ionicons name="image-outline" size={26} color={colors.blue} />}
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Txt weight="semi" size={14} numberOfLines={2}>{item.title}</Txt>
            <Txt weight="semi" size={13} color={colors.blue}>{formatFcfa(item.rent_fcfa)} / mois</Txt>
            <Txt size={12} color={colors.muted} numberOfLines={1}>{[TYPE_LABEL[item.type], place].filter(Boolean).join(' · ')}</Txt>
            <Txt size={12} color={colors.muted}>Par {item.ownerName} · {formatShortDate(item.created_at)} · {(item.listing_photos || []).length} photo(s)</Txt>
          </View>
        </View>
        {item.description ? <Txt size={13} numberOfLines={3} style={{ marginTop: 10 }}>{item.description}</Txt> : null}

        {refusingId === item.id ? (
          <View style={{ marginTop: 12 }}>
            <Txt weight="semi" size={13}>Motif du refus (visible par le propriétaire) :</Txt>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {REFUSE_REASONS.map(r => <Chip key={r} label={r} onPress={() => refuse(item, r)} />)}
            </View>
            <Txt weight="semi" size={13} color={colors.muted} onPress={() => setRefusingId(null)} style={{ marginTop: 10 }}>Annuler</Txt>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <Button title="Voir" variant="soft" onPress={() => router.push(`/listing/${item.id}`)} style={{ flex: 1 }} />
            <Button title="Refuser" variant="danger" onPress={() => setRefusingId(item.id)} style={{ flex: 1 }} />
            <Button title="Approuver" onPress={() => approve(item)} style={{ flex: 1 }} />
          </View>
        )}
      </Card>
    );
  };

  const renderReport = ({ item }) => (
    <Card style={{ padding: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Badge label={item.target_type === 'annonce' ? 'Annonce' : 'Profil'} bg={item.target_type === 'annonce' ? colors.blue : colors.orange} />
        <Txt size={11} color={colors.muted}>{formatShortDate(item.created_at)}</Txt>
      </View>
      <Txt weight="semi" size={14} style={{ marginTop: 8 }} numberOfLines={2}>{item.targetLabel}</Txt>
      <Txt weight="semi" size={13} color={colors.danger} style={{ marginTop: 4 }}>{item.reason}</Txt>
      {item.details ? <Txt size={13} color={colors.muted} style={{ marginTop: 4 }}>{item.details}</Txt> : null}

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
        <Button
          title="Voir"
          variant="soft"
          onPress={() => router.push(item.target_type === 'annonce' ? `/listing/${item.listing_id}` : `/seeker/${item.target_user_id}`)}
          style={{ flex: 1 }}
        />
        {item.target_type === 'annonce' ? (
          <Button title="Archiver l'annonce" variant="danger" onPress={() => archiveListing(item)} style={{ flex: 1.4 }} />
        ) : (
          <Button title="Masquer le profil" variant="danger" onPress={() => hideProfile(item)} style={{ flex: 1.4 }} />
        )}
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
        <Button title="Traité" variant="soft" onPress={() => closeReport(item, 'traite')} style={{ flex: 1 }} />
        <Button title="Ignorer" variant="outline" onPress={() => closeReport(item, 'ignore')} style={{ flex: 1 }} />
      </View>
    </Card>
  );

  return (
    <Screen scroll={false} contentStyle={{ padding: 20, paddingBottom: 0 }}>
      <Header onBack={() => router.back()} title="Administration" />

      <View style={{ flexDirection: 'row', backgroundColor: colors.bg, borderRadius: radius.md, padding: 4, marginBottom: 14 }}>
        {tabs.map(t => {
          const on = tab === t.key;
          return (
            <Pressable key={t.key} onPress={() => setTab(t.key)} style={{ flex: 1, paddingVertical: 9, borderRadius: radius.sm, alignItems: 'center', backgroundColor: on ? colors.white : 'transparent' }}>
              <Txt weight={on ? 'semi' : 'medium'} size={13} color={on ? colors.blue : colors.muted}>{t.label}</Txt>
            </Pressable>
          );
        })}
      </View>

      {error ? <Txt weight="semi" size={13} color={colors.danger} style={{ marginBottom: 10 }}>{error}</Txt> : null}

      {tab === 'annonces' ? (
        <FlatList
          data={listings}
          keyExtractor={l => l.id}
          renderItem={renderListing}
          contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState icon="checkmark-circle-outline" title="Rien à valider" text="Toutes les annonces ont été traitées." />}
        />
      ) : (
        <FlatList
          data={reports}
          keyExtractor={r => r.id}
          renderItem={renderReport}
          contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState icon="shield-checkmark-outline" title="Aucun signalement" text="Les signalements des utilisateurs apparaîtront ici." />}
        />
      )}
    </Screen>
  );
}
