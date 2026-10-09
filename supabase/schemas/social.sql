create table public.watchverse_friends (
  username text not null references public.watchverse_profiles(username) on delete cascade,
  friend text not null references public.watchverse_profiles(username) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (username,friend), check (username <> friend)
);
create index watchverse_friends_friend_idx on public.watchverse_friends(friend);
create table public.watchverse_marathons (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 3 and 60),
  owner text not null references public.watchverse_profiles(username),
  created_at timestamptz not null default now()
);
create index watchverse_marathons_owner_idx on public.watchverse_marathons(owner);
create table public.watchverse_members (
  marathon_id uuid not null references public.watchverse_marathons(id) on delete cascade,
  username text not null references public.watchverse_profiles(username),
  status text not null check (status in ('invited','accepted','declined')),
  primary key(marathon_id,username)
);
create index watchverse_members_username_idx on public.watchverse_members(username,marathon_id);
create table public.watchverse_marathon_progress (
  marathon_id uuid not null references public.watchverse_marathons(id) on delete cascade,
  title_id text not null check (title_id ~ '^[a-z0-9][a-z0-9-]{0,179}$'),
  watched_at timestamptz,
  updated_at timestamptz not null,
  primary key(marathon_id,title_id)
);
alter table public.watchverse_friends enable row level security;
alter table public.watchverse_marathons enable row level security;
alter table public.watchverse_members enable row level security;
alter table public.watchverse_marathon_progress enable row level security;
revoke all on table public.watchverse_friends,public.watchverse_marathons,public.watchverse_members,public.watchverse_marathon_progress from public,anon,authenticated;
grant select,insert,update,delete on table public.watchverse_friends,public.watchverse_marathons,public.watchverse_members,public.watchverse_marathon_progress to service_role;

create function public.watchverse_social(p_username text,p_action text,p_target text default null,p_name text default null,p_marathon uuid default null)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare result jsonb; new_id uuid;
begin
  if p_username !~ '^[a-z0-9][a-z0-9._-]{2,31}$' then raise exception 'Invalid profile'; end if;
  insert into public.watchverse_profiles(username) values(p_username) on conflict do nothing;
  if p_action in ('friend_add','friend_view','marathon_create') then
    if p_target = p_username then raise exception 'Choose another profile'; end if;
    if not exists(select 1 from public.watchverse_profiles where username=p_target) then raise exception 'Profile not found'; end if;
  end if;
  if p_action='friend_add' then
    insert into public.watchverse_friends(username,friend) values(p_username,p_target) on conflict do nothing;
  elsif p_action='friend_remove' then
    delete from public.watchverse_friends where username=p_username and friend=p_target;
  elsif p_action='friend_view' then
    if not exists(select 1 from public.watchverse_friends where username=p_username and friend=p_target) then raise exception 'Friend not found'; end if;
    select jsonb_build_object('username',p_target,'progress',coalesce(jsonb_agg(jsonb_build_object('title_id',title_id,'watched_at',watched_at,'updated_at',updated_at)), '[]'::jsonb)) into result
      from public.watchverse_progress where username=p_target;
    return result;
  elsif p_action='marathon_create' then
    if p_name is null or char_length(btrim(p_name)) not between 3 and 60 then raise exception 'Invalid marathon name'; end if;
    insert into public.watchverse_marathons(name,owner) values(btrim(p_name),p_username) returning id into new_id;
    insert into public.watchverse_members(marathon_id,username,status) values(new_id,p_username,'accepted'),(new_id,p_target,'invited');
  elsif p_action in ('marathon_accept','marathon_decline') then
    update public.watchverse_members set status=case when p_action='marathon_accept' then 'accepted' else 'declined' end
      where marathon_id=p_marathon and username=p_username and status='invited';
    if not found then raise exception 'Invitation not found'; end if;
  elsif p_action <> 'social' then raise exception 'Invalid action';
  end if;
  select jsonb_build_object(
    'friends',coalesce((select jsonb_agg(friend order by friend) from public.watchverse_friends where username=p_username),'[]'::jsonb),
    'marathons',coalesce((select jsonb_agg(jsonb_build_object(
      'id',m.id,'name',m.name,'owner',m.owner,'status',member.status,
      'members',(select jsonb_agg(jsonb_build_object('username',username,'status',status) order by username) from public.watchverse_members where marathon_id=m.id and status<>'declined'),
      'seen',(select count(*) from public.watchverse_marathon_progress where marathon_id=m.id and watched_at is not null)
    ) order by m.created_at desc) from public.watchverse_marathons m join public.watchverse_members member on member.marathon_id=m.id where member.username=p_username and member.status<>'declined'),'[]'::jsonb)
  ) into result;
  return result;
end; $$;
revoke all on function public.watchverse_social(text,text,text,text,uuid) from public,anon,authenticated;
grant execute on function public.watchverse_social(text,text,text,text,uuid) to service_role;

create function public.watchverse_marathon_sync(p_username text,p_marathon uuid,p_changes jsonb default '[]'::jsonb)
returns table(title_id text,watched_at timestamptz,updated_at timestamptz)
language plpgsql security invoker set search_path='' as $$
begin
  if not exists(select 1 from public.watchverse_members where marathon_id=p_marathon and username=p_username and status='accepted') then raise exception 'Marathon access denied'; end if;
  if jsonb_typeof(p_changes) <> 'array' or jsonb_array_length(p_changes)>1000 then raise exception 'Invalid changes'; end if;
  insert into public.watchverse_marathon_progress as current(marathon_id,title_id,watched_at,updated_at)
    select p_marathon,change->>'id',(change->>'watchedAt')::timestamptz,(change->>'changedAt')::timestamptz from jsonb_array_elements(p_changes) as change
    on conflict on constraint watchverse_marathon_progress_pkey do update
      set watched_at=excluded.watched_at,updated_at=excluded.updated_at where current.updated_at < excluded.updated_at;
  return query select p.title_id,p.watched_at,p.updated_at from public.watchverse_marathon_progress p where p.marathon_id=p_marathon;
end; $$;
revoke all on function public.watchverse_marathon_sync(text,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.watchverse_marathon_sync(text,uuid,jsonb) to service_role;
