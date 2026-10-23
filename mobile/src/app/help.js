import { Linking, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, Header, Screen, Txt } from '../components/ui';
import { PRICE_FCFA, SUPPORT_WHATSAPP } from '../lib/config';
import { formatNumber } from '../lib/format';

const FAQ = [
  ['Comment ça marche ?', 'La recherche et la consultation des annonces sont gratuites. Vous payez seulement quand vous voulez obtenir le numéro de contact d\'une annonce.'],
  ['Combien coûte une mise en relation ?', `${formatNumber(PRICE_FCFA)} FCFA, par Orange Money, pour tout le monde. Le paiement est unique pour chaque annonce débloquée.`],
  ['Comment payer ?', 'Touchez « Débloquer le contact », saisissez votre numéro Orange Money, générez votre code OTP en composant le code affiché, puis saisissez-le dans l\'application.'],
  ['Où retrouver mon reçu ?', 'Dans Profil, puis « Mes paiements ». Chaque paiement réussi a son reçu numéroté.'],
  ['Mon annonce n\'est pas visible', 'Toute annonce est vérifiée avant d\'être mise en ligne. Son statut est visible dans « Mes annonces ».'],
];

export default function Help() {
  const router = useRouter();
  return (
    <Screen>
      <Header onBack={() => router.back()} title="Aide et support" />
      <View style={{ gap: 12, marginTop: 4 }}>
        {FAQ.map(([q, a]) => (
          <Card key={q}>
            <Txt weight="bold" size={14}>{q}</Txt>
            <Txt size={13} style={{ marginTop: 4, lineHeight: 19 }}>{a}</Txt>
          </Card>
        ))}
      </View>
      {SUPPORT_WHATSAPP ? (
        <Button title="Contacter le support sur WhatsApp" icon="logo-whatsapp" onPress={() => Linking.openURL(`https://wa.me/${SUPPORT_WHATSAPP}`)} style={{ marginTop: 20 }} />
      ) : null}
    </Screen>
  );
}
