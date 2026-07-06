-- Listing campaign members with a display name. auth.users isn't exposed via
-- the API (and shouldn't be queried directly by clients), so this is a
-- SECURITY DEFINER function: it reads auth.users internally and returns only
-- a computed display name, never raw auth data. Anonymous users have no
-- email, so they get a stable "Guest-XXXXXX" label derived from their user
-- id; linked-email users are shown their email.
create function get_campaign_members(p_campaign_id uuid)
returns table (user_id uuid, display_name text, joined_at timestamptz)
language sql
security definer
set search_path = public
stable
as $$
  select
    cm.user_id,
    case
      when u.is_anonymous or u.email is null
        then 'Guest-' || upper(substring(cm.user_id::text, 1, 6))
      else u.email
    end as display_name,
    cm.joined_at
  from campaign_members cm
  join auth.users u on u.id = cm.user_id
  where cm.campaign_id = p_campaign_id
    and is_campaign_member(p_campaign_id, auth.uid())
  order by cm.joined_at;
$$;

grant execute on function get_campaign_members(uuid) to authenticated;
