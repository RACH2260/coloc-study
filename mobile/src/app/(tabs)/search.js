import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button, Chip, EmptyState, Field, Txt } from '../../components/ui';
import ListingCard from '../../components/ListingCard';
import { searchListings } from '../../lib/listings';
import { colors, fonts, radius } from '../../lib/theme';

export default function Search() {
  const router = useRouter();
  const [city, setCity] = useState('');
  const [type, setType] = useState('tous');
  const [neighborhood, setNeighborhood] = useState('');
  const [budget, setBudget] = useState('');
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [grid, setGrid] = useState(false);

  const run = useCallback(
    async (override = {}) => {
      setLoading(true);
      setError('');
      const { data, count: total, error: err } = await searchListings({
        city, type, neighborhood, budget, ...override,
      });
      setLoading(false);
      if (err) return setError('Impossible de charger les annonces. Vérifiez votre connexion.');
      setItems(data);
      setCount(total);
    },
    [city, type, neighborhood, budget]
  );

  useEffect(() => {
    run();
    // première recherche au chargement de l'écran
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pickType(t) {
    setType(t);
    run({ type: t });
  }

  const header = (
    <View style={{ paddingBottom: 8 }}>
      <Txt weight="bold" size={20} style={{ marginBottom: 12 }}>Rechercher un logement</Txt>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md }}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          value={city}
          onChangeText={setCity}
          placeholder="Ville (ex : Ouagadougou)"
          placeholderTextColor="#98A2B3"
          returnKeyType="search"
          onSubmitEditing={() => run()}
          style={{ flex: 1, minHeight: 46, fontFamily: fonts.regular, fontSize: 14, color: colors.ink }}
        />
      </View>

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
        <Chip label="Tous" active={type === 'tous'} onPress={() => pickType('tous')} />
        <Chip label="Colocation" active={type === 'colocation'} onPress={() => pickType('colocation')} />
        <Chip label="Logement entier" active={type === 'logement_entier'} onPress={() => pickType('logement_entier')} />
      </View>

      <Field value={neighborhood} onChangeText={setNeighborhood} placeholder="Secteur / Quartier" returnKeyType="search" onSubmitEditing={() => run()} />
      <Field value={budget} onChangeText={setBudget} placeholder="Budget max (FCFA)" keyboardType="numeric" />

      <Button title="Rechercher" onPress={() => run()} style={{ marginTop: 14 }} />

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, marginBottom: 6 }}>
        <Txt weight="bold" size={15}>
          Résultats <Txt size={13} color={colors.muted}>({count} annonce{count > 1 ? 's' : ''})</Txt>
        </Txt>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <Pressable onPress={() => setGrid(false)} accessibilityLabel="Affichage en liste" style={{ padding: 6, borderRadius: 8, backgroundColor: !grid ? colors.blue : colors.white, borderWidth: 1, borderColor: !grid ? colors.blue : colors.line }}>
            <Ionicons name="list" size={16} color={!grid ? colors.white : colors.muted} />
          </Pressable>
          <Pressable onPress={() => setGrid(true)} accessibilityLabel="Affichage en grille" style={{ padding: 6, borderRadius: 8, backgroundColor: grid ? colors.blue : colors.white, borderWidth: 1, borderColor: grid ? colors.blue : colors.line }}>
            <Ionicons name="grid" size={16} color={grid ? colors.white : colors.muted} />
          </Pressable>
        </View>
      </View>
      {error ? <Txt weight="semi" size={13} color={colors.danger}>{error}</Txt> : null}
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.white }}>
      <FlatList
        key={grid ? 'grid' : 'list'}
        data={items}
        numColumns={grid ? 2 : 1}
        keyExtractor={l => l.id}
        ListHeaderComponent={header}
        columnWrapperStyle={grid ? { gap: 12 } : undefined}
        contentContainerStyle={{ padding: 20, paddingBottom: 32, gap: 14 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <ListingCard listing={item} compact={grid} onPress={() => router.push(`/listing/${item.id}`)} />
        )}
        ListEmptyComponent={
          loading ? null : (
            <EmptyState icon="search-outline" title="Aucune annonce trouvée" text="Essayez une autre ville, un autre quartier ou un budget plus élevé." />
          )
        }
      />
    </SafeAreaView>
  );
}
