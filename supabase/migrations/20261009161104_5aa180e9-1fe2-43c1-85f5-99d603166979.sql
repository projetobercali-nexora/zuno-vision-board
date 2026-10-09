create table public.webhook_logs (
  id uuid primary key default gen_random_uuid(),
  recebido_em timestamptz not null default now(),
  cabecalhos jsonb,
  corpo jsonb,
  processado boolean not null default false,
  erro text
);
grant select on public.webhook_logs to authenticated;
grant all on public.webhook_logs to service_role;
alter table public.webhook_logs enable row level security;
create policy "admins leem logs" on public.webhook_logs for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create index on public.webhook_logs(recebido_em desc);