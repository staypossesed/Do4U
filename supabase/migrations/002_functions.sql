-- Increment views function (called from client)
create or replace function increment_views(listing_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update listings
  set views_count = views_count + 1
  where id = listing_id;
end;
$$;

-- Nearby listings function using PostGIS
create or replace function nearby_listings(
  user_lat double precision,
  user_lng double precision,
  radius_km double precision default 30,
  cat text default null,
  search_query text default null,
  lim int default 50
)
returns setof listings
language plpgsql
security definer
as $$
begin
  return query
    select l.*
    from listings l
    where l.status = 'active'
      and (cat is null or l.category = cat)
      and (search_query is null or l.title ilike '%' || search_query || '%' or l.description ilike '%' || search_query || '%')
      and (l.location is null or ST_DWithin(
        l.location::geography,
        ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
        radius_km * 1000
      ))
    order by l.created_at desc
    limit lim;
end;
$$;

-- Add reviewed_at and human_notes columns to moderation_logs if not exist
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'moderation_logs' and column_name = 'reviewed_at') then
    alter table moderation_logs add column reviewed_at timestamptz;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'moderation_logs' and column_name = 'human_notes') then
    alter table moderation_logs add column human_notes text;
  end if;
end;
$$;

-- Ensure listings has "rejected" as a valid status
-- (The check constraint from migration 001 should allow this, but let's ensure)
do $$
begin
  -- Drop old constraint if exists and recreate with rejected status
  if exists (select 1 from information_schema.constraint_column_usage where table_name = 'listings' and constraint_name = 'listings_status_check') then
    alter table listings drop constraint listings_status_check;
  end if;
  alter table listings add constraint listings_status_check
    check (status in ('draft', 'active', 'sold', 'archived', 'moderation', 'rejected'));
exception when others then
  null;
end;
$$;
