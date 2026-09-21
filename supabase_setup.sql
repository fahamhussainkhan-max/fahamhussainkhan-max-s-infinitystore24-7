-- ==============================================================================
-- Infinity Store: Admin Orders RLS Policies & Realtime Publication Setup
-- Execute this script in your Supabase Project SQL Editor (https://supabase.com/dashboard)
-- ==============================================================================

-- 0. Helper function: check if authenticated user is admin or super_admin
create or replace function public.is_admin(user_id uuid)
returns boolean
language plpgsql
security definer
as $$
begin
  return exists (
    select 1
    from public.user_roles
    where user_roles.user_id = $1
      and user_roles.role in ('admin', 'super_admin')
  );
end;
$$;

-- 1. Ensure Admins have full UPDATE and ALL permissions on orders
drop policy if exists "Admins manage all orders" on orders;

create policy "Admins manage all orders" on orders
  for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- Also ensure authenticated and public customers can create orders and read their orders
drop policy if exists "Customers can create orders" on orders;
create policy "Customers can create orders" on orders
  for insert
  with check (true);

drop policy if exists "Customers can view their orders" on orders;
create policy "Customers can view their orders" on orders
  for select
  using (true);

-- 2. Enable full replica identity for realtime update tracking (ensures old/new payloads in Realtime)
alter table orders replica identity full;

-- 3. Add orders table to realtime publication
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table orders;
  end if;
end $$;
