// Edge Function : débloquer le contact d'une annonce (2 000 FCFA via Orange Money OTP)
// Appel depuis l'app :
//   supabase.functions.invoke("pay-contact", { body: { listing_id, phone, otp } })
// Puis, si ok : supabase.rpc("get_listing_contact", { p_listing_id })

import { createClient } from "npm:@supabase/supabase-js@2";
import { chargeWithOtp } from "../_shared/orange.ts";

const AMOUNT_FCFA = 2000;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Méthode non permise" }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL")!;

    // 1. Identifier l'utilisateur connecté
    const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Connexion requise" }, 401);

    // 2. Valider les données reçues
    const { listing_id, phone, otp } = await req.json();
    if (typeof listing_id !== "string" || !/^[0-9a-f-]{36}$/i.test(listing_id)) {
      return json({ error: "Annonce invalide" }, 400);
    }
    if (typeof phone !== "string" || !/^(\+?226)?\d{8}$/.test(phone.replace(/\s/g, ""))) {
      return json({ error: "Numéro Orange Money invalide" }, 400);
    }
    if (typeof otp !== "string" || !/^\d{4,6}$/.test(otp)) {
      return json({ error: "Code OTP invalide" }, 400);
    }
    const msisdn = phone.replace(/\s/g, "").replace(/^\+?226/, "226");

    // 3. Client serveur (contourne la RLS : seul lui peut écrire dans payments)
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: listing } = await admin
      .from("listings").select("id, owner_id, status, title").eq("id", listing_id).maybeSingle();
    if (!listing || listing.status !== "en_ligne") {
      return json({ error: "Annonce introuvable" }, 404);
    }
    if (listing.owner_id === user.id) {
      return json({ error: "C'est votre propre annonce" }, 400);
    }

    // 4. Déjà payé ? On ne facture pas deux fois
    const { data: already } = await admin
      .from("payments").select("id")
      .eq("payer_id", user.id).eq("listing_id", listing_id).eq("status", "paye")
      .maybeSingle();
    if (already) return json({ ok: true, already_paid: true });

    // 5. Anti double-clic : un paiement en attente récent bloque un nouvel essai
    const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const { data: pending } = await admin
      .from("payments").select("id")
      .eq("payer_id", user.id).eq("listing_id", listing_id)
      .eq("status", "en_attente").gte("created_at", twoMinAgo)
      .maybeSingle();
    if (pending) return json({ error: "Paiement déjà en cours, patientez" }, 409);

    // 6. Créer le paiement en attente
    const { data: payment, error: insertError } = await admin
      .from("payments")
      .insert({ payer_id: user.id, listing_id, amount_fcfa: AMOUNT_FCFA, listing_title: listing.title })
      .select("id").single();
    if (insertError || !payment) return json({ error: "Erreur serveur" }, 500);

    // 7. Débiter via Orange Money
    let result;
    try {
      result = await chargeWithOtp({
        amount: AMOUNT_FCFA, phone: msisdn, otp, reference: payment.id,
      });
    } catch (e) {
      await admin.from("payments").update({ status: "echec" }).eq("id", payment.id);
      console.error(e);
      return json({ error: "Service de paiement indisponible" }, 502);
    }

    // 8. Enregistrer le résultat
    if (result.ok) {
      await admin.from("payments").update({
        status: "paye", orange_ref: result.orangeRef ?? null, paid_at: new Date().toISOString(),
      }).eq("id", payment.id);
      return json({ ok: true });
    }

    await admin.from("payments").update({ status: "echec" }).eq("id", payment.id);
    return json({ ok: false, error: result.error ?? "Paiement refusé" }, 402);
  } catch (e) {
    console.error(e);
    return json({ error: "Erreur serveur" }, 500);
  }
});
