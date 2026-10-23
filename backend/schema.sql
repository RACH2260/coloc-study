-- =====================================================
-- Coloc'Study : schéma Supabase v1
-- Colle ce fichier dans Supabase > SQL Editor > Run
-- =====================================================

-- ---------- TYPES ----------
create type user_role     as enum ('etudiant', 'proprietaire');
create type student_goal  as enum ('colocataire', 'logement');
create type listing_type  as enum ('colocation', 'logement_entier');
create type listing_status as enum ('en_attente', 'en_ligne', 'refuse', 'archive');
create type payment_status as enum ('en_attente', 'paye', 'echec', 'expire');

-- ---------- PROFILS ----------
-- Un profil par compte auth. Le téléphone reste privé.
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        user_role not null,
  goal        student_goal,                 -- seulement pour les étudiants
  full_name   text not null,
  phone       text not null,                -- format +226XXXXXXXX
  avatar_url  text,
  bio         text,
  created_at  timestamptz not null default now(),
  constraint goal_only_students check (role = 'etudiant' or goal is null)
);

-- Vue publique : jamais de téléphone ici
create view public_profiles as
  select id, role, full_name, avatar_url, bio from profiles;

-- ---------- ANNONCES ----------
create table listings (
  id                  uuid primary key default gen_random_uuid(),
  owner_id            uuid not null references profiles(id) on delete cascade,
  type                listing_type not null,
  title               text not null,
  description         text,
  rent_fcfa           integer not null check (rent_fcfa > 0),
  deposit_months      integer,              -- caution en mois de loyer
  min_duration_months integer,
  move_fee_fcfa       integer,              -- frais de ménage
  city                text not null,
  neighborhood        text,                 -- secteur / quartier
  bedrooms            integer,
  max_roommates       integer,
  status              listing_status not null default 'en_attente',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index listings_search_idx on listings (status, city, neighborhood, rent_fcfa);

create table listing_photos (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references listings(id) on delete cascade,
  url         text not null,
  position    integer not null default 0
);

-- ---------- FAVORIS ----------
create table favorites (
  user_id     uuid not null references profiles(id) on delete cascade,
  listing_id  uuid not null references listings(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, listing_id)
);

-- ---------- PAIEMENTS / DÉBLOCAGE CONTACT ----------
-- 2 000 FCFA par mise en relation, payeur = étudiant ou propriétaire
create table payments (
  id              uuid primary key default gen_random_uuid(),
  payer_id        uuid not null references profiles(id),
  listing_id      uuid not null references listings(id),
  amount_fcfa     integer not null default 2000,
  status          payment_status not null default 'en_attente',
  orange_ref      text,                     -- référence transaction Orange Money
  created_at      timestamptz not null default now(),
  paid_at         timestamptz
);

-- Un seul paiement réussi par (payeur, annonce)
create unique index payments_one_paid_idx
  on payments (payer_id, listing_id) where status = 'paye';

-- ---------- MESSAGES (chat intégré) ----------
create table conversations (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references listings(id) on delete cascade,
  user_a      uuid not null references profiles(id) on delete cascade,
  user_b      uuid not null references profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (listing_id, user_a, user_b)
);

create table messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references conversations(id) on delete cascade,
  sender_id        uuid not null references profiles(id) on delete cascade,
  body             text not null,
  read_at          timestamptz,
  created_at       timestamptz not null default now()
);

create index messages_conv_idx on messages (conversation_id, created_at);

-- =====================================================
-- SÉCURITÉ (RLS)
-- =====================================================
alter table profiles       enable row level security;
alter table listings       enable row level security;
alter table listing_photos enable row level security;
alter table favorites      enable row level security;
alter table payments       enable row level security;
alter table conversations  enable row level security;
alter table messages       enable row level security;

-- profiles : chacun voit et modifie seulement son profil complet
create policy "profil_lecture_perso" on profiles
  for select using (auth.uid() = id);
create policy "profil_creation" on profiles
  for insert with check (auth.uid() = id);
create policy "profil_modification" on profiles
  for update using (auth.uid() = id);

-- listings : annonces en ligne visibles par tous, le propriétaire gère les siennes
create policy "annonces_publiques" on listings
  for select using (status = 'en_ligne' or owner_id = auth.uid());
create policy "annonces_creation" on listings
  for insert with check (owner_id = auth.uid());
create policy "annonces_modification" on listings
  for update using (owner_id = auth.uid());
create policy "annonces_suppression" on listings
  for delete using (owner_id = auth.uid());

-- photos : visibles si l'annonce est visible, gérées par le propriétaire
create policy "photos_lecture" on listing_photos
  for select using (
    exists (select 1 from listings l
            where l.id = listing_id
              and (l.status = 'en_ligne' or l.owner_id = auth.uid()))
  );
create policy "photos_gestion" on listing_photos
  for all using (
    exists (select 1 from listings l
            where l.id = listing_id and l.owner_id = auth.uid())
  ) with check (
    exists (select 1 from listings l
            where l.id = listing_id and l.owner_id = auth.uid())
  );

-- favoris : strictement personnels
create policy "favoris_perso" on favorites
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- paiements : lecture de ses propres paiements ; écriture UNIQUEMENT par le serveur
-- (Edge Function avec la clé service_role, après confirmation Orange Money)
create policy "paiements_lecture_perso" on payments
  for select using (payer_id = auth.uid());

-- conversations / messages : seulement les deux participants
create policy "conv_participants" on conversations
  for select using (auth.uid() in (user_a, user_b));
create policy "conv_creation" on conversations
  for insert with check (
    auth.uid() in (user_a, user_b)
    -- le chat s'ouvre seulement après un déblocage payé sur cette annonce
    and exists (select 1 from payments p
                where p.payer_id = auth.uid()
                  and p.listing_id = conversations.listing_id
                  and p.status = 'paye')
  );

create policy "msg_lecture" on messages
  for select using (
    exists (select 1 from conversations c
            where c.id = conversation_id and auth.uid() in (c.user_a, c.user_b))
  );
create policy "msg_envoi" on messages
  for insert with check (
    sender_id = auth.uid()
    and exists (select 1 from conversations c
                where c.id = conversation_id and auth.uid() in (c.user_a, c.user_b))
  );

-- =====================================================
-- FONCTION : récupérer le numéro du propriétaire
-- Renvoie le téléphone seulement si paiement réussi (ou si c'est le propriétaire)
-- =====================================================
create or replace function get_listing_contact(p_listing_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_phone text;
begin
  select owner_id into v_owner from listings where id = p_listing_id;
  if v_owner is null then
    return null;
  end if;

  if v_owner = auth.uid()
     or exists (select 1 from payments
                where payer_id = auth.uid()
                  and listing_id = p_listing_id
                  and status = 'paye') then
    select phone into v_phone from profiles where id = v_owner;
    return v_phone;
  end if;

  return null;
end;
$$;

-- =====================================================
-- TRIGGER : updated_at automatique sur les annonces
-- =====================================================
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger listings_updated_at
  before update on listings
  for each row execute function set_updated_at();

-- =====================================================
-- STOCKAGE PHOTOS
-- =====================================================
insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', true)
on conflict do nothing;

create policy "photos_upload_perso" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'listing-photos'
              and (storage.foldername(name))[1] = auth.uid()::text);

create policy "photos_lecture_publique" on storage.objects
  for select using (bucket_id = 'listing-photos');
