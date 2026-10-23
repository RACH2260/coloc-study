import { useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { Button, ErrorText, Field, Header, Screen, Txt } from '../components/ui';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { authErrorMessage } from '../lib/format';
import { colors } from '../lib/theme';

// Étape 1 : on envoie un code par e-mail. Étape 2 : code + nouveau mot de passe.
export default function ForgotPassword() {
  const router = useRouter();
  const { signedIn, beginRecovery, endRecovery } = useAuth();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  if (signedIn) return <Redirect href="/(tabs)/home" />;

  async function sendCode() {
    setError('');
    setInfo('');
    const mail = email.trim();
    if (!mail.includes('@')) return setError('Entrez une adresse e-mail valide.');
    setBusy(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(mail);
    setBusy(false);
    if (err) return setError(authErrorMessage(err));
    setInfo('Si un compte existe avec cet e-mail, un code vient de vous être envoyé. Pensez à regarder dans les spams.');
    setStep(2);
  }

  async function resetPassword() {
    setError('');
    if (!/^\d{6,8}$/.test(code.trim())) return setError('Entrez le code reçu par e-mail (6 chiffres).');
    if (password.length < 6) return setError('Le mot de passe doit contenir au moins 6 caractères.');
    if (password !== confirm) return setError('Les deux mots de passe ne sont pas identiques.');

    setBusy(true);
    beginRecovery(); // empêche la redirection automatique tant que le mot de passe n'est pas changé
    const { error: e1 } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'recovery' });
    if (e1) {
      endRecovery();
      setBusy(false);
      return setError('Code invalide ou expiré. Demandez un nouveau code.');
    }
    const { error: e2 } = await supabase.auth.updateUser({ password });
    if (e2) {
      await supabase.auth.signOut();
      endRecovery();
      setBusy(false);
      setStep(1);
      setCode('');
      return setError(authErrorMessage(e2) + ' Demandez un nouveau code.');
    }
    setBusy(false);
    endRecovery(); // la connexion est active : l'app ouvre l'accueil automatiquement
  }

  return (
    <Screen>
      <Header onBack={() => router.back()} title="" />
      <Txt weight="bold" size={26}>Mot de passe oublié</Txt>
      <Txt color={colors.muted} style={{ marginTop: 4 }}>
        {step === 1 ? 'Entrez votre e-mail, nous vous envoyons un code.' : 'Entrez le code reçu et choisissez un nouveau mot de passe.'}
      </Txt>

      {step === 1 ? (
        <>
          <Field label="E-mail" value={email} onChangeText={setEmail} placeholder="vous@exemple.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
          <ErrorText>{error}</ErrorText>
          <Button title="Envoyer le code" onPress={sendCode} loading={busy} style={{ marginTop: 20 }} />
        </>
      ) : (
        <>
          {info ? <Txt size={13} color={colors.muted} style={{ marginTop: 12 }}>{info}</Txt> : null}
          <Field label="Code reçu par e-mail" value={code} onChangeText={setCode} placeholder="123456" keyboardType="number-pad" maxLength={8} />
          <Field label="Nouveau mot de passe" value={password} onChangeText={setPassword} placeholder="6 caractères minimum" secureTextEntry autoCapitalize="none" />
          <Field label="Confirmer le mot de passe" value={confirm} onChangeText={setConfirm} placeholder="Répétez le mot de passe" secureTextEntry autoCapitalize="none" />
          <ErrorText>{error}</ErrorText>
          <Button title="Changer le mot de passe" onPress={resetPassword} loading={busy} style={{ marginTop: 20 }} />
          <Txt weight="semi" size={13} color={colors.blue} style={{ textAlign: 'center', marginTop: 18, textDecorationLine: 'underline' }} onPress={() => { setStep(1); setError(''); setInfo(''); }}>
            Renvoyer un code
          </Txt>
        </>
      )}
    </Screen>
  );
}
