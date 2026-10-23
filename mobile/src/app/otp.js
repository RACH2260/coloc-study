import { useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, ErrorText, Header, Screen, Txt } from '../components/ui';
import { supabase } from '../lib/supabase';
import { PRICE_FCFA } from '../lib/config';
import { formatPhone, functionErrorMessage } from '../lib/format';
import { colors, radius } from '../lib/theme';

const KEYS = [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['', '0', 'del']];

export default function Otp() {
  const { id, phone } = useLocalSearchParams();
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const ussd = `*144*4*6*${PRICE_FCFA}#`;

  function press(k) {
    if (busy) return;
    setError('');
    if (k === 'del') setCode(c => c.slice(0, -1));
    else if (k) setCode(c => (c.length < 6 ? c + k : c));
  }

  function dial() {
    Linking.openURL(`tel:${encodeURIComponent(ussd)}`).catch(() => {
      setError(`Composez ${ussd} sur votre téléphone.`);
    });
  }

  async function validate() {
    if (code.length !== 6) return;
    setBusy(true);
    setError('');
    const { data, error: err } = await supabase.functions.invoke('pay-contact', {
      body: { listing_id: id, phone, otp: code },
    });
    if (err) {
      setBusy(false);
      setCode('');
      return setError(await functionErrorMessage(err, data));
    }
    if (data?.ok) {
      router.replace({ pathname: '/unlocked', params: { id, fresh: '1' } });
    } else {
      setBusy(false);
      setCode('');
      setError(data?.error || 'Paiement refusé. Vérifiez votre code.');
    }
  }

  return (
    <Screen scroll={false} contentStyle={{ padding: 20 }}>
      <Header onBack={() => router.back()} title="Saisissez le code OTP" center />

      <Txt size={13} color={colors.muted} style={{ textAlign: 'center', marginTop: 4, lineHeight: 19 }}>
        Générez votre code à 6 chiffres avec Orange Money, puis saisissez-le ici.{'\n'}
        Numéro : {formatPhone(phone)}
      </Txt>

      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 20 }}>
        {[0, 1, 2, 3, 4, 5].map(i => (
          <View
            key={i}
            style={{
              width: 46,
              height: 52,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: radius.md,
              borderWidth: 1.5,
              borderColor: i === code.length ? colors.blue : colors.line,
              backgroundColor: colors.white,
            }}
          >
            <Txt weight="bold" size={22}>{code[i] || ''}</Txt>
          </View>
        ))}
      </View>

      <Pressable onPress={dial} style={{ alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, padding: 6 }}>
        <Ionicons name="keypad" size={15} color={colors.blue} />
        <Txt weight="semi" size={13} color={colors.blue}>Composer {ussd}</Txt>
      </Pressable>

      <View style={{ alignItems: 'center', minHeight: 22 }}>
        <ErrorText>{error}</ErrorText>
      </View>

      <Button title="Valider" onPress={validate} loading={busy} disabled={code.length !== 6} style={{ marginTop: 10 }} />

      <View style={{ marginTop: 'auto', gap: 8, paddingTop: 16 }}>
        {KEYS.map((row, r) => (
          <View key={r} style={{ flexDirection: 'row', gap: 8 }}>
            {row.map((k, c) => (
              <Pressable
                key={c}
                onPress={() => press(k)}
                disabled={!k}
                style={({ pressed }) => ({
                  flex: 1,
                  height: 52,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: radius.sm,
                  borderWidth: k ? 1 : 0,
                  borderColor: colors.line,
                  backgroundColor: pressed ? colors.blueSoft : k ? colors.white : 'transparent',
                })}
              >
                {k === 'del' ? (
                  <Ionicons name="backspace-outline" size={24} color={colors.ink} />
                ) : (
                  <Txt weight="semi" size={22}>{k}</Txt>
                )}
              </Pressable>
            ))}
          </View>
        ))}
      </View>
    </Screen>
  );
}
