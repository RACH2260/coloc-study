-- Reçus de paiement + suivi des revenus
-- À coller dans Supabase > SQL Editor > Run

alter table payments add column if not exists receipt_number text unique;
alter table payments add column if not exists listing_title text;  -- titre figé au moment du paiement

create sequence if not exists receipt_seq;

-- Numéro de reçu automatique (ex : CS-2026-000001) dès que le paiement passe à "paye"
create or replace function set_receipt_number()
returns trigger language plpgsql as $$
begin
  if new.status = 'paye' and old.status is distinct from 'paye' and new.receipt_number is null then
    new.receipt_number := 'CS-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('receipt_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists payments_receipt on payments;
create trigger payments_receipt
  before update on payments
  for each row execute function set_receipt_number();

-- Revenus par jour (paiements réels uniquement, tests exclus).
-- security_invoker : l'API n'expose jamais ce total aux utilisateurs.
-- Tu le consultes dans le SQL Editor : select * from revenue_daily order by day desc;
create or replace view revenue_daily with (security_invoker = true) as
  select date_trunc('day', paid_at)::date as day,
         count(*)                         as paiements,
         sum(amount_fcfa)                 as total_fcfa
  from payments
  where status = 'paye'
    and coalesce(orange_ref, '') not like 'TEST-%'
  group by 1;
