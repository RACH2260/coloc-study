import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Chip, ErrorText, Field, Header, Loader, Screen, Txt } from '../components/ui';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { toInt } from '../lib/format';
import { MAX_TAGS, SEEKER_TAGS } from '../lib/seekers';
import { colors } from '../lib/theme';

// Création / modification du profil de recherche d'un étudiant
export default function SeekerEdit() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [exists, setExists] = useState(false);
  const [hiddenByAdmin, setHiddenByAdmin] = useState(false);
  const [lookingFor, setLookingFor] = useState(profile?.goal === 'colocataire' ? 'colocataire' : 'logement');
  const [city, setCity] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [budget, setBudget] = useState('');
  const [moveIn, setMoveIn] = useState('');
  const [school, setSchool] = useState('');
  const [about, setAbout] = useState('');
  const [tags, setTags] = useState([]);
  const [visible, setVisible] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('seeker_profiles').select('*').eq('user_id', user.id).maybeSingle();
      if (data) {
        setExists(true);
        setHiddenByAdmin(!!data.hidden_by_admin);
        setLookingFor(data.looking_for);
        setCity(data.city || '');
        setNeighborhood(data.neighborhood || '');
        setBudget(data.budget_max_fcfa ? String(data.budget_max_fcfa) : '');
        setMoveIn(data.move_in || '');
        setSchool(data.school || '');
        setAbout(data.about || '');
        setTags(data.tags || []);
        setVisible(!!data.is_visible);
      }
      setLoading(false);
    })();
  }, [user.id]);

  if (profile?.role !== 'etudiant') {
    return (
      <Screen>
        <Header onBack={() => router.back()} title="Mon profil de recherche" />
        <Txt color={colors.muted}>Les profils de recherche sont réservés aux comptes étudiants.</Txt>
      </Screen>
    );
  }
  if (loading) return <Loader />;

  function toggleTag(t) {
    setTags(prev => (prev.includes(t) ? prev.filter(x => x !== t) : prev.length >= MAX_TAGS ? prev : [...prev, t]));
  }

  async function save() {
    setError('');
    if (!city.trim()) return setError('Indiquez la ville où vous cherchez.');
    if (budget.trim() && !toInt(budget)) return setError('Le budget doit être un nombre (en FCFA).');
    setBusy(true);
    const { error: err } = await supabase.from('seeker_profiles').upsert(
      {
        user_id: user.id,
        looking_for: lookingFor,
        city: city.trim(),
        neighborhood: neighborhood.trim() || null,
        budget_max_fcfa: toInt(budget) || null,
        move_in: moveIn.trim() || null,
        school: school.trim() || null,
        about: about.trim() || null,
        tags,
        is_visible: visible,
      },
      { onConflict: 'user_id' }
    );
    setBusy(false);
    if (err) return setError('Enregistrement impossible : ' + err.message);
    router.back();
  }

  function remove() {
    Alert.alert('Supprimer mon profil de recherche ?', 'Les autres étudiants ne pourront plus vous trouver. Vos discussions restent disponibles.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('seeker_profiles').delete().eq('user_id', user.id);
          router.back();
        },
      },
    ]);
  }

  return (
    <Screen>
      <Header onBack={() => router.back()} title="Mon profil de recherche" />
      <Txt color={colors.muted} size={13}>
        Visible par les autres étudiants. Votre numéro de téléphone n'est jamais affiché : on vous écrit dans l'app.
      </Txt>

      {hiddenByAdmin ? (
        <Txt weight="semi" size={13} color={colors.danger} style={{ marginTop: 10 }}>
          Ce profil a été masqué par l'équipe Coloc'Study suite à un signalement. Contactez le support.
        </Txt>
      ) : null}

      <Txt weight="semi" size={13} style={{ marginTop: 18, marginBottom: 8 }}>Que cherchez-vous ?</Txt>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Chip label="Un logement" active={lookingFor === 'logement'} onPress={() => setLookingFor('logement')} />
        <Chip label="Un colocataire" active={lookingFor === 'colocataire'} onPress={() => setLookingFor('colocataire')} />
      </View>

      <Field label="Ville" value={city} onChangeText={setCity} placeholder="Ex : Ouagadougou" />
      <Field label="Secteur / Quartier (facultatif)" value={neighborhood} onChangeText={setNeighborhood} placeholder="Ex : Ouaga 2000" />
      <Field label="Budget maximum par mois (facultatif)" value={budget} onChangeText={setBudget} placeholder="Ex : 40000" keyboardType="numeric" />
      <Field label="Quand ? (facultatif)" value={moveIn} onChangeText={setMoveIn} placeholder="Ex : Novembre 2026" />
      <Field label="École ou université (facultatif)" value={school} onChangeText={setSchool} placeholder="Ex : Université Joseph Ki-Zerbo" />
      <Field label="À propos de vous (facultatif)" value={about} onChangeText={setAbout} placeholder="Présentez-vous en quelques lignes" multiline maxLength={400} />

      <Txt weight="semi" size={13} style={{ marginTop: 18, marginBottom: 8 }}>Votre style de vie (jusqu'à {MAX_TAGS})</Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {SEEKER_TAGS.map(t => <Chip key={t} label={t} active={tags.includes(t)} onPress={() => toggleTag(t)} />)}
      </View>

      <Txt weight="semi" size={13} style={{ marginTop: 18, marginBottom: 8 }}>Visibilité</Txt>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Chip label="Visible" active={visible} onPress={() => setVisible(true)} />
        <Chip label="Masqué" active={!visible} onPress={() => setVisible(false)} />
      </View>

      <ErrorText>{error}</ErrorText>
      <Button title={exists ? 'Enregistrer' : 'Créer mon profil'} onPress={save} loading={busy} style={{ marginTop: 22 }} />
      {exists ? <Button title="Supprimer mon profil" variant="danger" onPress={remove} style={{ marginTop: 10 }} /> : null}
    </Screen>
  );
}
