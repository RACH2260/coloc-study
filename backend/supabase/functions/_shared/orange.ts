// Adaptateur Orange Money Burkina (paiement avec code OTP).
// Les URLs et noms de champs exacts viennent de la documentation Orange
// fournie à l'ouverture du compte marchand : ils sont lus depuis les secrets
// pour ne rien inventer. Adapte seulement les 2 endroits marqués "À ADAPTER".

export interface ChargeInput {
  amount: number;     // en FCFA
  phone: string;      // numéro Orange Money du payeur
  otp: string;        // code généré par le payeur (*144*4*6*montant#)
  reference: string;  // notre ID de paiement (idempotence)
}

export interface ChargeResult {
  ok: boolean;
  orangeRef?: string;
  error?: string;
}

async function getToken(): Promise<string> {
  const authUrl = Deno.env.get("ORANGE_AUTH_URL");
  const clientId = Deno.env.get("ORANGE_CLIENT_ID");
  const clientSecret = Deno.env.get("ORANGE_CLIENT_SECRET");
  if (!authUrl || !clientId || !clientSecret) {
    throw new Error("Orange Money non configuré (secrets manquants)");
  }

  // À ADAPTER si la doc Orange demande un autre format d'authentification
  const res = await fetch(authUrl, {
    method: "POST",
    headers: {
      "Authorization": "Basic " + btoa(`${clientId}:${clientSecret}`),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error("Authentification Orange refusée");
  const data = await res.json();
  return data.access_token;
}

export async function chargeWithOtp(input: ChargeInput): Promise<ChargeResult> {
  // MODE TEST : actif seulement si le secret ORANGE_MODE vaut "test".
  // Aucun argent réel : le code 123456 réussit, tout autre code échoue.
  // À DÉSACTIVER avant le lancement : supabase secrets unset ORANGE_MODE
  if (Deno.env.get("ORANGE_MODE") === "test") {
    if (input.otp === "123456") {
      return { ok: true, orangeRef: `TEST-${input.reference}` };
    }
    return { ok: false, error: "Code OTP incorrect (mode test)" };
  }

  const payUrl = Deno.env.get("ORANGE_PAY_URL");
  const merchantKey = Deno.env.get("ORANGE_MERCHANT_KEY");
  if (!payUrl || !merchantKey) {
    throw new Error("Orange Money non configuré (secrets manquants)");
  }

  const token = await getToken();

  // À ADAPTER : noms des champs selon la doc Orange Money Burkina
  const res = await fetch(payUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      merchant_key: merchantKey,
      amount: input.amount,
      currency: "XOF",
      customer_msisdn: input.phone,
      otp: input.otp,
      order_id: input.reference,
    }),
  });

  const data = await res.json().catch(() => ({}));

  // À ADAPTER : condition de succès et champ de la référence selon la réponse réelle
  if (res.ok && (data.status === "SUCCESS" || data.status === "SUCCESSFUL")) {
    return { ok: true, orangeRef: data.txnid ?? data.transaction_id ?? undefined };
  }
  return { ok: false, error: data.message ?? "Paiement refusé" };
}
