# Coloc'Study

Application mobile de mise en relation pour étudiants (colocataires et logements) au Burkina Faso.
Recherche gratuite, mise en relation payante : 2 000 FCFA par contact débloqué, via Orange Money.

```
coloc-study/
├── mobile/    Application React Native (Expo SDK 57, Expo Router 57)
├── backend/   Base de données Supabase + fonction de paiement
└── docs/      Maquette de référence
```

## 1. Backend (une seule fois)

1. Supabase > SQL Editor : exécute dans l'ordre
   `backend/schema.sql`, puis `backend/migration_recus.sql`, puis `backend/migration_app.sql`.
2. Supabase > Authentication : garde « Email » activé (désactive « Confirm email » pour tester plus vite).
3. Dans un terminal, depuis le dossier `backend` :
   ```
   npm i -g supabase
   supabase login
   supabase link --project-ref jsgccdrtfabdigmsosae
   supabase secrets set ORANGE_MODE=test
   supabase functions deploy pay-contact
   ```
   En mode test, le code OTP **123456** simule un paiement réussi (aucun argent débité).
   **Avant le lancement** : `supabase secrets unset ORANGE_MODE`, puis renseigne les secrets Orange
   (voir `backend/supabase/functions/_shared/orange.ts`, passages « À ADAPTER »).
4. Valider les annonces : elles naissent « en_attente ». Dans Table Editor > listings,
   passe `status` à `en_ligne` pour les publier.

## 2. Application mobile

Prérequis : Node.js (LTS) sur l'ordinateur, application **Expo Go** sur le téléphone
(version du Play Store ou de l'App Store, qui supporte SDK 57).

```
cd mobile
npm install
```

Ouvre le fichier `mobile/.env` et colle ta clé **anon public** (Supabase > Project Settings > API) :
```
EXPO_PUBLIC_SUPABASE_ANON_KEY=ta_cle_ici
```
Puis :
```
npx expo start
```
Scanne le QR code avec Expo Go (téléphone et ordinateur sur le même Wi-Fi).

## 3. Créer l'APK à installer

```
npx eas-cli@latest login
npx eas-cli@latest build -p android --profile preview
```
Le fichier APK se télécharge depuis le lien donné à la fin de la compilation.

## 4. Écrans (ordre de la maquette)

| Maquette | Fichier |
|---|---|
| 1 Accueil | `mobile/src/app/index.js` |
| 2 Choix du profil | `mobile/src/app/choice.js` (+ `signup.js`, `login.js`) |
| 3 Recherche | `mobile/src/app/(tabs)/search.js` |
| 4 Détail d'annonce | `mobile/src/app/listing/[id].js` |
| 5 Déblocage du contact | `mobile/src/app/pay/[id].js` |
| 6 Saisie du code OTP | `mobile/src/app/otp.js` |
| 7 Numéro débloqué | `mobile/src/app/unlocked.js` |
| Publier une annonce | `mobile/src/app/publish.js` |
| 8 Mes annonces | `mobile/src/app/my-listings.js` |
| 9 Profil | `mobile/src/app/(tabs)/profile.js` |
| Favoris, Messages, discussion | `(tabs)/favorites.js`, `(tabs)/messages.js`, `chat/[id].js` |
| Reçus de paiement | `mobile/src/app/receipts.js` |

## 5. À finaliser

- **Photo d'accueil** : remplace `mobile/assets/images/welcome_city.png` (basse résolution, découpée
  de la maquette) par une photo nette, sans texte, avec le même nom de fichier.
- **API Orange Money** : compte marchand à ouvrir, puis compléter `orange.ts`.
- **Support** : renseigne `SUPPORT_WHATSAPP` dans `mobile/src/lib/config.js` pour afficher le bouton WhatsApp.
- **Prix** : `PRICE_FCFA` dans `mobile/src/lib/config.js` et `AMOUNT_FCFA` dans `pay-contact/index.ts`
  doivent rester identiques.

## Écarts volontaires avec la maquette

- Écran 5 : « Paiement sécurisé par **Orange Money** » (et non PayDunya).
- Écran 6 : le code n'est pas envoyé par SMS, l'utilisateur le génère avec `*144*4*6*2000#`
  (bouton « Composer » dans l'écran) ; le lien « Renvoyer le code » est donc remplacé.
- Écran 3 : « Secteur / Quartier » et « Budget max » sont des champs de saisie, pas des listes déroulantes.
- Aucun champ n'est prérempli : les noms et numéros de la maquette ne sont que des exemples.
