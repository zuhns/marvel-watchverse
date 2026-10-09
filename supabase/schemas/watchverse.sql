-- Username-only access is an explicit product choice. Tables are never public.
create table public.watchverse_profiles (
  username text primary key check (username ~ '^[a-z0-9][a-z0-9._-]{2,31}$'),
  created_at timestamptz not null default now()
);
create table public.watchverse_progress (
  username text not null references public.watchverse_profiles(username) on delete cascade,
  title_id text not null check (title_id ~ '^[a-z0-9][a-z0-9-]{0,179}$'),
  watched_at timestamptz,
  updated_at timestamptz not null,
  primary key (username,title_id)
);
alter table public.watchverse_profiles enable row level security;
alter table public.watchverse_progress enable row level security;
revoke all on table public.watchverse_profiles,public.watchverse_progress from public,anon,authenticated;
grant select,insert,update,delete on table public.watchverse_profiles,public.watchverse_progress to service_role;

-- Invoker function: only the trusted Edge Function's service role can call it.
-- Each title has its own timestamp, including tombstones for "not watched".
create function public.watchverse_sync(p_username text,p_changes jsonb default '[]'::jsonb)
returns table(title_id text,watched_at timestamptz,updated_at timestamptz)
language plpgsql security invoker set search_path = '' as $$
begin
  if p_username !~ '^[a-z0-9][a-z0-9._-]{2,31}$'
     or jsonb_typeof(p_changes) <> 'array'
     or jsonb_array_length(p_changes) > 1000 then
    raise exception 'Invalid profile or changes';
  end if;
  insert into public.watchverse_profiles(username) values(p_username) on conflict do nothing;
  insert into public.watchverse_progress as current(username,title_id,watched_at,updated_at)
    select p_username,change->>'id',(change->>'watchedAt')::timestamptz,(change->>'changedAt')::timestamptz
    from jsonb_array_elements(p_changes) as change
    on conflict on constraint watchverse_progress_pkey do update
      set watched_at=excluded.watched_at,updated_at=excluded.updated_at
      where current.updated_at < excluded.updated_at;
  return query select progress.title_id,progress.watched_at,progress.updated_at
    from public.watchverse_progress as progress where progress.username=p_username;
end;
$$;
revoke all on function public.watchverse_sync(text,jsonb) from public,anon,authenticated;
grant execute on function public.watchverse_sync(text,jsonb) to service_role;
