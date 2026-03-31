-- Feed: active listings within radius, excluding viewer's own rows (30 km MVP)

create or replace function public.nearby_listings_for_marketplace(
  p_viewer_id uuid,
  p_lat double precision,
  p_lng double precision,
  p_radius_km double precision default 30,
  p_category text default null,
  p_search text default null,
  p_order text default 'new',
  p_limit int default 50
)
returns setof listings
language sql
stable
security definer
set search_path = public
as $$
  select l.*
  from listings l
  where l.status = 'active'
    and l.user_id is distinct from p_viewer_id
    and (p_category is null or p_category = '' or l.category::text = p_category)
    and (
      p_search is null or p_search = ''
      or l.title ilike '%' || p_search || '%'
      or l.description ilike '%' || p_search || '%'
    )
    and l.location is not null
    and st_dwithin(
      l.location::geography,
      st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography,
      p_radius_km * 1000
    )
  order by
    case when p_order = 'near' then
      st_distance(
        l.location::geography,
        st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography
      )
    end asc nulls last,
    case when p_order in ('popular', 'hot') then l.views_count end desc nulls last,
    l.created_at desc
  limit p_limit;
$$;

grant execute on function public.nearby_listings_for_marketplace(
  uuid, double precision, double precision, double precision, text, text, text, int
) to authenticated;
