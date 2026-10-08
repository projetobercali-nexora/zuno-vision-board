create type public.app_role as enum ('admin','atendente');
create type public.estado_conversa as enum ('aberta','fechada');
create type public.remetente_msg as enum ('cliente','agente','humano');
create type public.jogada_jev as enum ('perguntar','qualificar','apresentar','objecao','fechar');

create table public.organizacoes (id uuid primary key default gen_random_uuid(), nome text not null, criado_em timestamptz not null default now());
create table public.perfis (id uuid primary key references auth.users(id) on delete cascade, organizacao_id uuid not null references public.organizacoes(id) on delete cascade, nome text, criado_em timestamptz not null default now());
create table public.papeis_utilizador (id uuid primary key default gen_random_uuid(), utilizador_id uuid not null references auth.users(id) on delete cascade, papel public.app_role not null, unique(utilizador_id,papel));
create table public.contactos (id uuid primary key default gen_random_uuid(), organizacao_id uuid not null references public.organizacoes(id) on delete cascade, nome text, telefone text not null, etiquetas text[] not null default '{}', origem text, criado_em timestamptz not null default now());
create table public.estagios_funil (id uuid primary key default gen_random_uuid(), organizacao_id uuid not null references public.organizacoes(id) on delete cascade, nome text not null, ordem int not null default 0, cor text);
create table public.conversas (id uuid primary key default gen_random_uuid(), organizacao_id uuid not null references public.organizacoes(id) on delete cascade, contacto_id uuid not null references public.contactos(id) on delete cascade, estagio_id uuid references public.estagios_funil(id) on delete set null, ia_ativa boolean not null default true, estado public.estado_conversa not null default 'aberta', ultima_mensagem_em timestamptz, criado_em timestamptz not null default now());
create table public.mensagens (id uuid primary key default gen_random_uuid(), organizacao_id uuid not null references public.organizacoes(id) on delete cascade, conversa_id uuid not null references public.conversas(id) on delete cascade, remetente public.remetente_msg not null, texto text not null, criado_em timestamptz not null default now());
create table public.decisoes_jev (id uuid primary key default gen_random_uuid(), organizacao_id uuid not null references public.organizacoes(id) on delete cascade, conversa_id uuid not null references public.conversas(id) on delete cascade, estagio text, progresso int not null default 0 check (progresso between 0 and 100), jogada public.jogada_jev not null, motivo text, criado_em timestamptz not null default now());

grant select, update on public.organizacoes to authenticated;
grant select, update on public.perfis to authenticated;
grant select on public.papeis_utilizador to authenticated;
grant select, insert, update, delete on public.contactos, public.estagios_funil, public.conversas, public.mensagens, public.decisoes_jev to authenticated;
grant all on public.organizacoes, public.perfis, public.papeis_utilizador, public.contactos, public.estagios_funil, public.conversas, public.mensagens, public.decisoes_jev to service_role;

alter table public.organizacoes enable row level security;
alter table public.perfis enable row level security;
alter table public.papeis_utilizador enable row level security;
alter table public.contactos enable row level security;
alter table public.estagios_funil enable row level security;
alter table public.conversas enable row level security;
alter table public.mensagens enable row level security;
alter table public.decisoes_jev enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.papeis_utilizador where utilizador_id=_user_id and papel=_role) $$;
create or replace function public.minha_organizacao() returns uuid language sql stable security definer set search_path = public as $$
  select organizacao_id from public.perfis where id = auth.uid() $$;

create policy "ver própria org" on public.organizacoes for select to authenticated using (id = public.minha_organizacao());
create policy "admin edita org" on public.organizacoes for update to authenticated using (id = public.minha_organizacao() and public.has_role(auth.uid(),'admin'));
create policy "ver perfis da org" on public.perfis for select to authenticated using (organizacao_id = public.minha_organizacao());
create policy "editar próprio perfil" on public.perfis for update to authenticated using (id = auth.uid()) with check (id = auth.uid() and organizacao_id = public.minha_organizacao());
create policy "ver próprios papéis" on public.papeis_utilizador for select to authenticated using (utilizador_id = auth.uid());

create policy "org contactos" on public.contactos for all to authenticated using (organizacao_id = public.minha_organizacao()) with check (organizacao_id = public.minha_organizacao());
create policy "org estagios" on public.estagios_funil for all to authenticated using (organizacao_id = public.minha_organizacao()) with check (organizacao_id = public.minha_organizacao());
create policy "org conversas" on public.conversas for all to authenticated using (organizacao_id = public.minha_organizacao()) with check (organizacao_id = public.minha_organizacao());
create policy "org mensagens" on public.mensagens for all to authenticated using (organizacao_id = public.minha_organizacao()) with check (organizacao_id = public.minha_organizacao());
create policy "org decisoes" on public.decisoes_jev for all to authenticated using (organizacao_id = public.minha_organizacao()) with check (organizacao_id = public.minha_organizacao());

create index on public.perfis(organizacao_id);
create index on public.contactos(organizacao_id);
create index on public.contactos(telefone);
create index on public.estagios_funil(organizacao_id);
create index on public.conversas(organizacao_id);
create index on public.conversas(contacto_id);
create index on public.mensagens(organizacao_id);
create index on public.mensagens(conversa_id);
create index on public.decisoes_jev(organizacao_id);
create index on public.decisoes_jev(conversa_id);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
declare org uuid; nm text;
begin
  nm := coalesce(new.raw_user_meta_data->>'nome', split_part(new.email,'@',1));
  insert into public.organizacoes(nome) values (coalesce(new.raw_user_meta_data->>'organizacao', 'Organização de '||nm)) returning id into org;
  insert into public.perfis(id, organizacao_id, nome) values (new.id, org, nm);
  insert into public.papeis_utilizador(utilizador_id, papel) values (new.id, 'admin');
  insert into public.estagios_funil(organizacao_id, nome, ordem, cor) values
    (org,'1º contacto',1,'#64748b'),(org,'Interesse',2,'#0ea5e9'),(org,'Proposta',3,'#eab308'),(org,'Negociação',4,'#f97316'),(org,'Fechado',5,'#22c55e');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter publication supabase_realtime add table public.mensagens;
alter publication supabase_realtime add table public.conversas;