-- Compléments pour l'application mobile
-- À exécuter APRÈS schema.sql et migration_recus.sql

-- 1. Messages en temps réel (le chat se met à jour sans rafraîchir)
do $$
begin
  alter publication supabase_realtime add table messages;
exception when duplicate_object then null;
end $$;

-- 2. Photos : chacun peut remplacer ou supprimer SES propres fichiers
create policy "photos_update_perso" on storage.objects
  for update to authenticated
  using (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "photos_delete_perso" on storage.objects
  for delete to authenticated
  using (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = auth.uid()::text);
