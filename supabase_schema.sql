-- FixIT Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  avatar_url text,
  role text not null check (role in ('pelanggan', 'teknisi', 'admin')),
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- 2. Teknisi Profiles Table
create table public.teknisi_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  status text default 'offline' check (status in ('tersedia', 'bertugas', 'offline')),
  specializations text[], -- e.g. ['hardware', 'software', 'cleaning', 'estetika']
  rating_avg decimal(3,2) default 0,
  total_jobs int default 0,
  latitude decimal(10,8),
  longitude decimal(11,8),
  updated_at timestamptz default now()
);

-- Enable RLS on teknisi_profiles
alter table public.teknisi_profiles enable row level security;

-- 3. Service Categories Table
create table public.service_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  icon text,
  is_active boolean default true
);

alter table public.service_categories enable row level security;

-- 4. Services Table (Prices and details)
create table public.services (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.service_categories(id) on delete cascade,
  name text not null,
  description text,
  price_min int not null,
  price_max int not null,
  duration_est text,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table public.services enable row level security;

-- 5. Orders Table
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text unique not null,
  pelanggan_id uuid references public.profiles(id) on delete set null,
  teknisi_id uuid references public.profiles(id) on delete set null,
  status text not null default 'menunggu' check (status in ('menunggu', 'dikonfirmasi', 'berangkat', 'diproses', 'selesai', 'dibatalkan')),
  
  device_name text not null,
  device_type text not null check (device_type in ('laptop', 'pc')),
  
  location_address text not null,
  location_lat decimal(10,8),
  location_lng decimal(11,8),
  location_photo text,
  location_notes text,
  
  order_notes text,
  
  subtotal int not null,
  admin_fee int not null default 10000,
  total int not null,
  
  scheduled_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancel_reason text,
  created_at timestamptz default now()
);

alter table public.orders enable row level security;

-- 6. Order Items Table
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  service_name text not null,
  price int not null,
  created_at timestamptz default now()
);

alter table public.order_items enable row level security;

-- 7. Payments Table
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  method text not null check (method in ('qris', 'virtual_account')),
  va_bank text,
  
  midtrans_order_id text unique,
  midtrans_token text,
  midtrans_redirect text,
  
  amount int not null,
  status text default 'pending' check (status in ('pending', 'paid', 'failed', 'expired', 'refunded')),
  paid_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz default now()
);

alter table public.payments enable row level security;

-- 8. Chats Table
create table public.chats (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  created_at timestamptz default now()
);

alter table public.chats enable row level security;

-- 9. Messages Table
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid references public.chats(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete set null,
  content text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

alter table public.messages enable row level security;

-- 10. Reviews Table
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade unique,
  pelanggan_id uuid references public.profiles(id) on delete set null,
  teknisi_id uuid references public.profiles(id) on delete set null,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now()
);

alter table public.reviews enable row level security;

-- 11. Notifications Table
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  type text check (type in ('order', 'payment', 'chat', 'system')),
  is_read boolean default false,
  related_id uuid,
  created_at timestamptz default now()
);

alter table public.notifications enable row level security;


-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Profiles Policies
create policy "Users can view all profiles" on public.profiles for select using (true);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);

-- Teknisi Profiles Policies
create policy "Anyone can view technician profiles" on public.teknisi_profiles for select using (true);
create policy "Technicians can update their own technician profile" on public.teknisi_profiles for update using (auth.uid() = id);

-- Service Categories Policies
create policy "Anyone can view active categories" on public.service_categories for select using (is_active = true);
create policy "Admins can manage categories" on public.service_categories for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Services Policies
create policy "Anyone can view active services" on public.services for select using (is_active = true);
create policy "Admins can manage services" on public.services for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Orders Policies
create policy "Customers can view their own orders" on public.orders for select using (auth.uid() = pelanggan_id);
create policy "Technicians can view their assigned orders" on public.orders for select using (auth.uid() = teknisi_id);
create policy "Admins can view all orders" on public.orders for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Customers can insert their own orders" on public.orders for insert with check (auth.uid() = pelanggan_id);
create policy "Users can update their own orders" on public.orders for update using (
  auth.uid() = pelanggan_id or 
  auth.uid() = teknisi_id or 
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Order Items Policies
create policy "Users can view items of their orders" on public.order_items for select using (
  exists (
    select 1 from public.orders 
    where orders.id = order_items.order_id 
    and (orders.pelanggan_id = auth.uid() or orders.teknisi_id = auth.uid() or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  )
);
create policy "Customers can insert order items" on public.order_items for insert with check (
  exists (select 1 from public.orders where orders.id = order_id and orders.pelanggan_id = auth.uid())
);

-- Payments Policies
create policy "Customers can view their own payments" on public.payments for select using (
  exists (select 1 from public.orders where orders.id = order_id and orders.pelanggan_id = auth.uid())
);
create policy "Admins can view all payments" on public.payments for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Customers can insert payments for their own orders" on public.payments for insert with check (
  exists (select 1 from public.orders where orders.id = order_id and orders.pelanggan_id = auth.uid())
);
create policy "Customers can update payments for their own orders" on public.payments for update using (
  exists (select 1 from public.orders where orders.id = order_id and orders.pelanggan_id = auth.uid())
);

-- Chats Policies
create policy "Participants can view chats" on public.chats for select using (
  exists (
    select 1 from public.orders 
    where orders.id = chats.order_id 
    and (orders.pelanggan_id = auth.uid() or orders.teknisi_id = auth.uid() or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  )
);
create policy "Participants can create chats" on public.chats for insert with check (
  exists (
    select 1 from public.orders 
    where orders.id = order_id 
    and (orders.pelanggan_id = auth.uid() or orders.teknisi_id = auth.uid())
  )
);

-- Messages Policies
create policy "Chat participants can view messages" on public.messages for select using (
  exists (
    select 1 from public.chats 
    join public.orders on orders.id = chats.order_id
    where chats.id = chat_id 
    and (orders.pelanggan_id = auth.uid() or orders.teknisi_id = auth.uid() or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  )
);
create policy "Chat participants can send messages" on public.messages for insert with check (
  sender_id = auth.uid() and
  exists (
    select 1 from public.chats 
    join public.orders on orders.id = chats.order_id
    where chats.id = chat_id 
    and (orders.pelanggan_id = auth.uid() or orders.teknisi_id = auth.uid())
  )
);

-- Reviews Policies
create policy "Anyone can read reviews" on public.reviews for select using (true);
create policy "Customers can write a review for their completed order" on public.reviews for insert with check (
  auth.uid() = pelanggan_id and 
  exists (select 1 from public.orders where orders.id = order_id and orders.status = 'selesai')
);

-- Notifications Policies
create policy "Users can view their own notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "Users can update their own notifications" on public.notifications for update using (auth.uid() = user_id);


-- ==========================================
-- AUTH TRIGGER TRIGGERS
-- ==========================================

-- Trigger to automatically create profile on sign up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, phone, role, is_active)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'User'),
    new.raw_user_meta_data->>'phone',
    coalesce(new.raw_user_meta_data->>'role', 'pelanggan'),
    case when coalesce(new.raw_user_meta_data->>'role', 'pelanggan') = 'teknisi' then false else true end
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger to automatically create technician profile
create or replace function public.handle_new_teknisi_profile()
returns trigger as $$
declare
  specs_json jsonb;
  specs_arr text[];
begin
  if new.role = 'teknisi' then
    specs_json := new.raw_user_meta_data->'specializations';
    if specs_json is not null then
      select array_agg(val) into specs_arr from jsonb_array_elements_text(specs_json) as val;
    else
      specs_arr := '{}';
    end if;

    insert into public.teknisi_profiles (id, status, specializations, rating_avg, total_jobs, latitude, longitude)
    values (
      new.id,
      'offline',
      specs_arr,
      0,
      0,
      (new.raw_user_meta_data->>'latitude')::decimal,
      (new.raw_user_meta_data->>'longitude')::decimal
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_profile_created_teknisi
  after insert on public.profiles
  for each row execute procedure public.handle_new_teknisi_profile();
