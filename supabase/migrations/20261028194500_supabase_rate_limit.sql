begin;

create schema if not exists private;

create table if not exists private.rate_limit_buckets (
  scope text not null,
  subject_hash text not null check (subject_hash ~ '^[a-z0-9:-]{1,160}$'),
  window_started_at timestamptz not null default now(),
  hit_count integer not null default 1 check (hit_count > 0),
  primary key (scope, subject_hash)
);

revoke all on private.rate_limit_buckets from public, anon, authenticated, service_role;

create or replace function public.consume_rate_limit(
  p_scope text,
  p_subject_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_hits integer;
  allowed boolean;
begin
  if p_scope !~ '^[a-z][a-z0-9-]{0,63}$'
    or p_subject_hash !~ '^[a-z0-9:-]{1,160}$'
    or p_limit < 1 or p_limit > 10000
    or p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'invalid rate limit parameters';
  end if;

  insert into private.rate_limit_buckets (scope, subject_hash, window_started_at, hit_count)
  values (p_scope, p_subject_hash, now(), 1)
  on conflict (scope, subject_hash) do update
    set window_started_at = case
          when private.rate_limit_buckets.window_started_at <= now() - make_interval(secs => p_window_seconds) then now()
          else private.rate_limit_buckets.window_started_at
        end,
        hit_count = case
          when private.rate_limit_buckets.window_started_at <= now() - make_interval(secs => p_window_seconds) then 1
          else private.rate_limit_buckets.hit_count + 1
        end
  returning hit_count into current_hits;

  allowed := current_hits <= p_limit;

  if random() < 0.01 then
    delete from private.rate_limit_buckets
    where window_started_at < now() - interval '1 day';
  end if;

  return allowed;
end;
$$;

revoke all on function public.consume_rate_limit(text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, text, integer, integer) to service_role;

commit;
