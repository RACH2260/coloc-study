import { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, ErrorText, Field, Header, Screen, Txt } from '../../components/ui';
import { PRICE_FCFA } from '../../lib/config';
import { formatNumber, normalizePhone } from '../../lib/format';
import { colors } from '../../lib/theme';

const STEPS = [
  'Cliquez sur "Payer maintenant"',
  'Saisissez votre numéro Orange Money',
  'Générez et saisissez le code OTP',
  'Le numéro s\'affiche après validation',
];

export default function Pay() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  function next() {
    const clean = normalizePhone(phone);
    if (!clean) return setError('Entrez votre numéro Orange Money à 8 chiffres.');
    setError('');
    router.push({ pathname: '/otp', params: { id, phone: clean } });
  }

  return (
    <Screen>
      <Header onBack={() => router.back()} title="Déblocage du contact" center />
      <Txt size={13} color={colors.muted} style={{ marginTop: 4 }}>
        Payez via Orange Money pour obtenir le numéro du propriétaire.
      </Txt>

      <Card style={{ marginTop: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <Txt size={13} color={colors.muted}>Montant à payer</Txt>
          <Txt weight="bold" size={24} style={{ marginTop: 2 }}>{formatNumber(PRICE_FCFA)} FCFA</Txt>
        </View>
        <View style={{ alignItems: 'center', gap: 2 }}>
          <View style={{ width: 40, height: 40, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}>
            <Ionicons name="swap-horizontal" size={24} color={colors.white} />
          </View>
          <Txt weight="bold" size={9} style={{ textAlign: 'center', lineHeight: 10 }}>Orange{'\n'}Money</Txt>
        </View>
      </Card>

      <View style={{ marginTop: 22, gap: 14 }}>
        {STEPS.map((s, i) => (
          <View key={s} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' }}>
              <Txt weight="bold" size={12} color={colors.white}>{i + 1}</Txt>
            </View>
            <Txt size={13} style={{ flex: 1 }}>{s}</Txt>
          </View>
        ))}
      </View>

      <Field label="Numéro Orange Money" prefix="+226" value={phone} onChangeText={setPhone} placeholder="70 12 34 56" keyboardType="phone-pad" style={{ marginTop: 24 }} />
      <ErrorText>{error}</ErrorText>

      <Button title="Payer maintenant" variant="orange" onPress={next} style={{ marginTop: 20 }} />

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16 }}>
        <Ionicons name="lock-closed" size={13} color={colors.ink} />
        <Txt size={12} color={colors.muted}>Paiement sécurisé par Orange Money</Txt>
      </View>
    </Screen>
  );
}
