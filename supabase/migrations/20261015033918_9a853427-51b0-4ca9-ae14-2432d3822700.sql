do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='lembretes') then
    alter publication supabase_realtime add table public.lembretes;
  end if;
end $$;