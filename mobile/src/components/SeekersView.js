import { useCallback, useEffect, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Chip, EmptyState, Field, Txt } from './ui';
import SeekerCard from './SeekerCard';
import ModeToggle from './ModeToggle';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { searchSeekers } from '../lib/seekers';
import { colors } from '../lib/theme';

// Liste des profils de recherche (visible par les étudiants)
export default function SeekersView({ mode, onModeChange }) {
  const router = useRouter();
  const { user } = useAuth();
  const [city, setCity] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [looking, setLooking] = useState('tous');
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mine, setMine] = useState(undefined); // undefined = chargement, null = aucun profil

  const run = useCallback(
    async (override = {}) => {
      setLoading(true);
      setError('');
      const res = await searchSeekers({ city, neighborhood, looking, exclude: user.id, ...override });
      setLoading(false);
      if (res.error) return setError('Impossible de charger les profils. Vérifiez votre connexion et que la migration v2 a été exécutée.');
      setItems(res.data);
      setCount(res.count);
    },
    [city, neighborhood, looking, user.id]
  );

  useEffect(() => {
    run();
    // première recherche au chargement
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFocusEffect(
    useCallback(() => {
      supabase
        .from('seeker_profiles')
        .select('user_id, is_visible, hidden_by_admin')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => setMine(data || null));
    }, [user.id])
  );

  function pickLooking(v) {
    setLooking(v);
    run({ looking: v });
  }

  const header = (
    <View style={{ paddingBottom: 8 }}>
      <ModeToggle mode={mode} onChange={onModeChange} />
      <Txt weight="bold" size={20} style={{ marginBottom: 12 }}>Rechercher un colocataire</Txt>

      {mine === null ? (
        <Card style={{ backgroundColor: colors.blueSoft, borderColor: colors.blueSoft, marginBottom: 6 }}>
          <Txt weight="semi" size={14}>Créez votre profil de recherche</Txt>
          <Txt size={13} color={colors.muted} style={{ marginTop: 4 }}>
            Les autres étudiants pourront vous trouver et vous écrire. Votre numéro reste privé.
          </Txt>
          <Button title="Créer mon profil" onPress={() => router.push('/seeker-edit')} style={{ marginTop: 12 }} />
        </Card>
      ) : mine ? (
        <Card style={{ marginBottom: 6 }}>
          <Txt weight="semi" size={14}>
            {mine.hidden_by_admin ? 'Votre profil a été masqué' : mine.is_visible ? 'Votre profil est visible' : 'Votre profil est masqué'}
          </Txt>
          <Txt weight="semi" size={13} color={colors.blue} onPress={() => router.push('/seeker-edit')} style={{ marginTop: 4, textDecorationLine: 'underline' }}>
            {mine.hidden_by_admin ? 'Voir mon profil' : 'Modifier mon profil'}
          </Txt>
        </Card>
      ) : null}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
        <Chip label="Tous" active={looking === 'tous'} onPress={() => pickLooking('tous')} />
        <Chip label="Cherchent un logement" active={looking === 'logement'} onPress={() => pickLooking('logement')} />
        <Chip label="Cherchent un colocataire" active={looking === 'colocataire'} onPress={() => pickLooking('colocataire')} />
      </View>

      <Field value={city} onChangeText={setCity} placeholder="Ville (ex : Ouagadougou)" returnKeyType="search" onSubmitEditing={() => run()} />
      <Field value={neighborhood} onChangeText={setNeighborhood} placeholder="Secteur / Quartier" returnKeyType="search" onSubmitEditing={() => run()} />
      <Button title="Rechercher" onPress={() => run()} style={{ marginTop: 14 }} />

      <Txt weight="bold" size={15} style={{ marginTop: 18, marginBottom: 6 }}>
        Résultats <Txt size={13} color={colors.muted}>({count} profil{count > 1 ? 's' : ''})</Txt>
      </Txt>
      {error ? <Txt weight="semi" size={13} color={colors.danger}>{error}</Txt> : null}
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.white }}>
      <FlatList
        data={items}
        keyExtractor={s => s.user_id}
        ListHeaderComponent={header}
        contentContainerStyle={{ padding: 20, paddingBottom: 32, gap: 12 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <SeekerCard seeker={item} onPress={() => router.push(`/seeker/${item.user_id}`)} />}
        ListEmptyComponent={
          loading ? null : (
            <EmptyState icon="people-outline" title="Aucun profil trouvé" text="Essayez une autre ville ou un autre quartier. De nouveaux profils arrivent régulièrement." />
          )
        }
      />
    </SafeAreaView>
  );
}
