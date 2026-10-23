import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Button, ErrorText, Field, Header, Screen, Txt } from '../components/ui';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { uploadImage } from '../lib/listings';
import { normalizePhone } from '../lib/format';
import { colors } from '../lib/theme';

export default function EditProfile() {
  const router = useRouter();
  const { profile, user, refreshProfile } = useAuth();
  const [name, setName] = useState(profile.full_name || '');
  const [phone, setPhone] = useState((profile.phone || '').replace(/^\+226/, ''));
  const [bio, setBio] = useState(profile.bio || '');
  const [avatar, setAvatar] = useState(profile.avatar_url || null);
  const [newAvatarUri, setNewAvatarUri] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function pickAvatar() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });
    if (!res.canceled && res.assets?.[0]) {
      setNewAvatarUri(res.assets[0].uri);
      setAvatar(res.assets[0].uri);
    }
  }

  async function save() {
    setError('');
    const clean = normalizePhone(phone);
    if (name.trim().length < 2) return setError('Entrez votre nom complet.');
    if (!clean) return setError('Entrez un numéro à 8 chiffres.');
    setBusy(true);
    try {
      let avatar_url = profile.avatar_url || null;
      if (newAvatarUri) avatar_url = await uploadImage(user.id, 'avatar', newAvatarUri);
      const { error: err } = await supabase
        .from('profiles')
        .update({ full_name: name.trim(), phone: clean, bio: bio.trim() || null, avatar_url })
        .eq('id', user.id);
      if (err) throw err;
      await refreshProfile();
      router.back();
    } catch (e) {
      setError('Enregistrement impossible. Réessayez.');
    }
    setBusy(false);
  }

  return (
    <Screen>
      <Header onBack={() => router.back()} title="Modifier le profil" />
      <View style={{ alignItems: 'center', marginTop: 8 }}>
        <Pressable onPress={pickAvatar} accessibilityLabel="Changer la photo">
          <Avatar uri={avatar} name={name} size={92} />
          <View style={{ position: 'absolute', right: -2, bottom: -2, width: 30, height: 30, borderRadius: 15, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.white }}>
            <Ionicons name="camera" size={15} color={colors.white} />
          </View>
        </Pressable>
        <Txt size={12} color={colors.muted} style={{ marginTop: 8 }}>Changer la photo</Txt>
      </View>

      <Field label="Nom complet" value={name} onChangeText={setName} />
      <Field label="Téléphone" prefix="+226" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <Field label="À propos de vous (facultatif)" value={bio} onChangeText={setBio} multiline placeholder="Quelques mots sur vous" />

      <ErrorText>{error}</ErrorText>
      <Button title="Enregistrer" onPress={save} loading={busy} style={{ marginTop: 20 }} />
    </Screen>
  );
}
