import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Button, ErrorText, Field, Header, Screen, Txt } from '../components/ui';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { uploadImage } from '../lib/listings';
import { MAX_PHOTOS } from '../lib/config';
import { formatFcfa, toInt, TYPE_LABEL } from '../lib/format';
import { colors, radius } from '../lib/theme';

const STEPS = ['Informations', 'Photos', 'Validation'];

function Stepper({ step }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 14 }}>
      {STEPS.map((label, i) => {
        const done = i < step;
        const current = i === step;
        return (
          <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: done || current ? colors.blue : colors.white, borderWidth: 1.5, borderColor: done || current ? colors.blue : colors.line }}>
              {done ? <Ionicons name="checkmark" size={14} color={colors.white} /> : <Txt weight="bold" size={12} color={current ? colors.white : colors.muted}>{i + 1}</Txt>}
            </View>
            <Txt weight={current ? 'semi' : 'regular'} size={12} color={current ? colors.ink : colors.muted}>{label}</Txt>
          </View>
        );
      })}
    </View>
  );
}

function TypeOption({ label, icon, selected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: radius.md, borderWidth: 1.5, borderColor: selected ? colors.blue : colors.line, backgroundColor: selected ? colors.blueSoft : colors.white }}
    >
      <Ionicons name={icon} size={18} color={selected ? colors.blue : colors.muted} />
      <Txt weight="semi" size={13} color={selected ? colors.blue : colors.ink}>{label}</Txt>
    </Pressable>
  );
}

export default function Publish() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [type, setType] = useState('colocation');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rent, setRent] = useState('');
  const [city, setCity] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [roommates, setRoommates] = useState('');
  const [deposit, setDeposit] = useState('');
  const [duration, setDuration] = useState('');
  const [moveFee, setMoveFee] = useState('');
  const [photos, setPhotos] = useState([]);

  function back() {
    setError('');
    if (step === 0) router.back();
    else setStep(step - 1);
  }

  function nextFromInfo() {
    if (title.trim().length < 5) return setError('Donnez un titre d\'au moins 5 caractères.');
    if (!toInt(rent)) return setError('Entrez le loyer en FCFA.');
    if (!city.trim()) return setError('Entrez la ville.');
    setError('');
    setStep(1);
  }

  function nextFromPhotos() {
    if (!photos.length) return setError('Ajoutez au moins une photo.');
    setError('');
    setStep(2);
  }

  async function pickPhotos() {
    const left = MAX_PHOTOS - photos.length;
    if (left <= 0) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: left,
      quality: 0.5,
    });
    if (!res.canceled) {
      setPhotos(prev => [...prev, ...res.assets.map(a => a.uri)].slice(0, MAX_PHOTOS));
      setError('');
    }
  }

  async function publish() {
    setBusy(true);
    setError('');
    let listingId = null;
    try {
      const { data, error: err } = await supabase
        .from('listings')
        .insert({
          owner_id: user.id,
          type,
          title: title.trim(),
          description: description.trim() || null,
          rent_fcfa: toInt(rent),
          deposit_months: toInt(deposit),
          min_duration_months: toInt(duration),
          move_fee_fcfa: toInt(moveFee),
          city: city.trim(),
          neighborhood: neighborhood.trim() || null,
          bedrooms: toInt(bedrooms),
          max_roommates: type === 'colocation' ? toInt(roommates) : null,
        })
        .select('id')
        .single();
      if (err) throw err;
      listingId = data.id;

      const urls = [];
      for (const uri of photos) urls.push(await uploadImage(user.id, listingId, uri));

      const { error: photoErr } = await supabase
        .from('listing_photos')
        .insert(urls.map((url, position) => ({ listing_id: listingId, url, position })));
      if (photoErr) throw photoErr;

      Alert.alert('Annonce envoyée', 'Elle sera visible par les autres après validation.');
      router.replace('/my-listings');
    } catch (e) {
      // on ne laisse pas d'annonce à moitié créée
      if (listingId) await supabase.from('listings').delete().eq('id', listingId);
      setError('La publication a échoué. Vérifiez votre connexion et réessayez.');
    }
    setBusy(false);
  }

  const place = [neighborhood.trim(), city.trim()].filter(Boolean).join(', ');

  return (
    <Screen>
      <Header onBack={back} title="Publier une annonce" />
      <Stepper step={step} />

      {step === 0 ? (
        <>
          <Txt weight="semi" size={13} style={{ marginTop: 6, marginBottom: 8 }}>Type de logement</Txt>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TypeOption label="Colocation" icon="people-outline" selected={type === 'colocation'} onPress={() => setType('colocation')} />
            <TypeOption label="Logement entier" icon="home-outline" selected={type === 'logement_entier'} onPress={() => setType('logement_entier')} />
          </View>

          <Field label="Titre de l'annonce" value={title} onChangeText={setTitle} placeholder="Ex : Chambre meublée à Ouaga 2000" />
          <Field label="Description" value={description} onChangeText={setDescription} multiline placeholder="Décrivez votre logement, les équipements, les conditions..." />
          <Field label="Loyer (FCFA)" value={rent} onChangeText={setRent} keyboardType="numeric" placeholder="Ex : 75000" />
          <Field label="Ville" value={city} onChangeText={setCity} placeholder="Ex : Ouagadougou" />
          <Field label="Secteur / Quartier" value={neighborhood} onChangeText={setNeighborhood} placeholder="Ex : Ouaga 2000" />

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Field label="Chambres" value={bedrooms} onChangeText={setBedrooms} keyboardType="numeric" placeholder="Ex : 3" style={{ flex: 1 }} />
            {type === 'colocation' ? (
              <Field label="Colocataires max" value={roommates} onChangeText={setRoommates} keyboardType="numeric" placeholder="Ex : 2" style={{ flex: 1 }} />
            ) : null}
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Field label="Caution (mois)" value={deposit} onChangeText={setDeposit} keyboardType="numeric" placeholder="Ex : 1" style={{ flex: 1 }} />
            <Field label="Durée min. (mois)" value={duration} onChangeText={setDuration} keyboardType="numeric" placeholder="Ex : 6" style={{ flex: 1 }} />
          </View>
          <Field label="Frais de ménage (FCFA)" value={moveFee} onChangeText={setMoveFee} keyboardType="numeric" placeholder="Ex : 5000" />

          <ErrorText>{error}</ErrorText>
          <Button title="Suivant" onPress={nextFromInfo} style={{ marginTop: 20 }} />
        </>
      ) : null}

      {step === 1 ? (
        <>
          <Txt size={13} color={colors.muted}>Ajoutez jusqu'à {MAX_PHOTOS} photos. La première sera la photo principale.</Txt>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
            {photos.map((uri, i) => (
              <View key={uri} style={{ width: '31%', aspectRatio: 1 }}>
                <Image source={{ uri }} style={{ flex: 1, borderRadius: radius.md }} contentFit="cover" />
                <Pressable
                  onPress={() => setPhotos(p => p.filter(x => x !== uri))}
                  accessibilityLabel="Retirer la photo"
                  style={{ position: 'absolute', top: 4, right: 4, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(20,33,61,0.7)', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Ionicons name="close" size={15} color={colors.white} />
                </Pressable>
                {i === 0 ? (
                  <View style={{ position: 'absolute', left: 4, bottom: 4, backgroundColor: colors.blue, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 }}>
                    <Txt weight="semi" size={10} color={colors.white}>Principale</Txt>
                  </View>
                ) : null}
              </View>
            ))}
            {photos.length < MAX_PHOTOS ? (
              <Pressable
                onPress={pickPhotos}
                style={{ width: '31%', aspectRatio: 1, borderRadius: radius.md, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.blue, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center', gap: 4 }}
              >
                <Ionicons name="add" size={26} color={colors.blue} />
                <Txt weight="semi" size={11} color={colors.blue}>Ajouter</Txt>
              </Pressable>
            ) : null}
          </View>

          <ErrorText>{error}</ErrorText>
          <Button title="Suivant" onPress={nextFromPhotos} style={{ marginTop: 24 }} />
        </>
      ) : null}

      {step === 2 ? (
        <>
          <Txt size={13} color={colors.muted}>Vérifiez votre annonce avant de l'envoyer.</Txt>

          <View style={{ marginTop: 14, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, overflow: 'hidden' }}>
            <Image source={{ uri: photos[0] }} style={{ height: 170 }} contentFit="cover" />
            <View style={{ padding: 14, gap: 4 }}>
              <Txt size={12} weight="semi" color={colors.blue}>{TYPE_LABEL[type]}</Txt>
              <Txt weight="bold" size={16}>{title.trim()}</Txt>
              <Txt weight="semi" size={14} color={colors.blue}>{formatFcfa(toInt(rent))} / mois</Txt>
              <Txt size={13} color={colors.muted}>{place}</Txt>
              <Txt size={12} color={colors.muted}>{photos.length} photo{photos.length > 1 ? 's' : ''}</Txt>
            </View>
          </View>

          <Txt size={12} color={colors.muted} style={{ marginTop: 12, lineHeight: 18 }}>
            Votre numéro de téléphone reste masqué. Il est révélé à une personne seulement après son paiement. L'annonce sera visible après validation.
          </Txt>

          <ErrorText>{error}</ErrorText>
          <Button title="Publier l'annonce" onPress={publish} loading={busy} style={{ marginTop: 20 }} />
        </>
      ) : null}
    </Screen>
  );
}
