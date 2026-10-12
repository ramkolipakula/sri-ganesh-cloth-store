
-- ===== Roles & profiles =====
create type public.app_role as enum ('admin','customer');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text check (char_length(full_name) <= 100),
  phone text check (char_length(phone) <= 20),
  address text check (char_length(address) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "own roles readable" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "profiles select own or admin" on public.profiles for select to authenticated
  using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "profiles update own" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, left(coalesce(new.raw_user_meta_data->>'full_name',''),100), left(coalesce(new.raw_user_meta_data->>'phone',''),20));
  insert into public.user_roles (user_id, role) values (new.id, 'customer');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();

-- ===== Store settings =====
create table public.store_settings (
  id int primary key default 1 check (id = 1),
  store_name text not null default 'Sri Ganesh Cloth Centre',
  phone text not null default '7981809751',
  whatsapp text not null default '917981809751',
  address text not null default '',
  tagline text not null default '',
  upi_id text check (upi_id is null or upi_id ~ '^[A-Za-z0-9._-]{2,}@[A-Za-z0-9.-]{2,}$'),
  payee_name text,
  qr_image_path text,
  payment_instructions text,
  delivery_enabled boolean not null default true,
  pickup_enabled boolean not null default true,
  delivery_fee numeric(10,2) not null default 0 check (delivery_fee >= 0),
  delivery_note text,
  low_stock_threshold int not null default 3 check (low_stock_threshold >= 0),
  reservation_hours int not null default 24 check (reservation_hours between 1 and 168),
  updated_at timestamptz not null default now()
);
grant select on public.store_settings to anon, authenticated;
grant update on public.store_settings to authenticated;
grant all on public.store_settings to service_role;
alter table public.store_settings enable row level security;
create policy "settings public read" on public.store_settings for select to anon, authenticated using (true);
create policy "settings admin update" on public.store_settings for update to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger settings_touch before update on public.store_settings for each row execute function public.touch_updated_at();

insert into public.store_settings (id, address, tagline, payment_instructions)
values (1,
 'Door No. 199/3, Near Ramalayam Temple, Durga Bazar, Arilova Colony, Visakhapatnam, Andhra Pradesh – 530040',
 'Quality Clothes, Comfort for Every You',
 'Scan the QR with PhonePe, Google Pay, Paytm or any UPI app. Enter the exact order amount, pay, then upload the payment screenshot and transaction ID below.');

-- ===== Categories =====
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "categories read" on public.categories for select to anon, authenticated
  using (is_active or public.has_role(auth.uid(),'admin'));
create policy "categories admin write" on public.categories for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger categories_touch before update on public.categories for each row execute function public.touch_updated_at();

insert into public.categories (name, slug, sort_order) values
('Clothes Section','clothes-section',1),('Nighties','nighties',2),('Plazzos','plazzos',3),
('Ladies All Innerwear','ladies-all-innerwear',4),('Towels','towels',5),('Gokul Bannins (Gents)','gokul-bannins-gents',6),
('Sarees','sarees',7),('Three Piece Sets','three-piece-sets',8),('Kurtis','kurtis',9),
('Scarfs and Chunnis','scarfs-and-chunnis',10),('Cotton Dress Materials','cotton-dress-materials',11),('Bed Sheets','bed-sheets',12),
('Ankle Length Leggings','ankle-length-leggings',13),('Lungis','lungis',14),('Blouse Pieces','blouse-pieces',15),('Night Dresses','night-dresses',16);

-- ===== Products =====
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  category_id uuid not null references public.categories(id),
  description text check (char_length(description) <= 2000),
  price numeric(10,2) not null check (price > 0),
  original_price numeric(10,2) check (original_price is null or original_price >= price),
  image_path text,
  inventory_mode text not null default 'size_based' check (inventory_mode in ('size_based','free_size')),
  free_size_stock int not null default 0 check (free_size_stock >= 0),
  is_active boolean not null default true,
  is_featured boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_category_idx on public.products(category_id);
create index products_created_idx on public.products(created_at desc);
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "products read" on public.products for select to anon, authenticated
  using ((is_active and archived_at is null) or public.has_role(auth.uid(),'admin'));
create policy "products admin write" on public.products for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger products_touch before update on public.products for each row execute function public.touch_updated_at();

create table public.product_sizes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  size_label text not null check (char_length(size_label) between 1 and 20),
  stock int not null default 0 check (stock >= 0),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, size_label)
);
grant select on public.product_sizes to anon, authenticated;
grant insert, update, delete on public.product_sizes to authenticated;
grant all on public.product_sizes to service_role;
alter table public.product_sizes enable row level security;
create policy "sizes read" on public.product_sizes for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id));
create policy "sizes admin write" on public.product_sizes for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger sizes_touch before update on public.product_sizes for each row execute function public.touch_updated_at();

-- Inventory history
create table public.inventory_log (
  id bigint generated always as identity primary key,
  product_id uuid not null,
  size_label text not null,
  old_stock int,
  new_stock int not null,
  reason text,
  changed_by uuid,
  created_at timestamptz not null default now()
);
grant select on public.inventory_log to authenticated;
grant all on public.inventory_log to service_role;
alter table public.inventory_log enable row level security;
create policy "inventory log admin read" on public.inventory_log for select to authenticated
  using (public.has_role(auth.uid(),'admin'));

create or replace function public.log_size_stock() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.stock is distinct from old.stock then
    insert into public.inventory_log(product_id,size_label,old_stock,new_stock,reason,changed_by)
    values (new.product_id, new.size_label, case when tg_op='UPDATE' then old.stock end, new.stock,
            coalesce(nullif(current_setting('app.stock_reason', true),''),'admin adjustment'), auth.uid());
  end if;
  return new;
end $$;
create trigger sizes_log after insert or update on public.product_sizes for each row execute function public.log_size_stock();

create or replace function public.log_free_stock() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.free_size_stock is distinct from old.free_size_stock then
    insert into public.inventory_log(product_id,size_label,old_stock,new_stock,reason,changed_by)
    values (new.id, 'Free Size', case when tg_op='UPDATE' then old.free_size_stock end, new.free_size_stock,
            coalesce(nullif(current_setting('app.stock_reason', true),''),'admin adjustment'), auth.uid());
  end if;
  return new;
end $$;
create trigger products_log after insert or update on public.products for each row execute function public.log_free_stock();

-- ===== Orders =====
create sequence public.order_number_seq start 1001;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid not null,
  idempotency_key uuid not null,
  customer_name text not null,
  customer_phone text not null,
  fulfillment text not null check (fulfillment in ('delivery','pickup')),
  delivery_address text,
  subtotal numeric(10,2) not null default 0,
  delivery_fee numeric(10,2) not null default 0,
  discount numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  status text not null default 'pending_payment' check (status in ('pending_payment','confirmed','processing','completed','cancelled')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','proof_submitted','under_review','verified','rejected','refunded')),
  reserved_until timestamptz,
  stock_released boolean not null default false,
  cancel_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (customer_id, idempotency_key)
);
create index orders_customer_idx on public.orders(customer_id, created_at desc);
create index orders_status_idx on public.orders(status, payment_status);
grant select on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "orders own or admin" on public.orders for select to authenticated
  using (customer_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create trigger orders_touch before update on public.orders for each row execute function public.touch_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  size_label text not null,
  unit_price numeric(10,2) not null,
  quantity int not null check (quantity > 0),
  line_total numeric(10,2) not null
);
create index order_items_order_idx on public.order_items(order_id);
grant select on public.order_items to authenticated;
grant all on public.order_items to service_role;
alter table public.order_items enable row level security;
create policy "order items own or admin" on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and (o.customer_id = auth.uid() or public.has_role(auth.uid(),'admin'))));

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  method text not null default 'upi_qr',
  transaction_ref text not null check (char_length(transaction_ref) between 4 and 64),
  screenshot_path text not null,
  status text not null default 'proof_submitted' check (status in ('proof_submitted','under_review','verified','rejected','refunded')),
  submitted_at timestamptz not null default now(),
  reviewer_id uuid,
  reviewed_at timestamptz,
  rejection_reason text,
  admin_note text
);
create index payments_order_idx on public.payments(order_id, submitted_at desc);
create index payments_status_idx on public.payments(status);
grant select on public.payments to authenticated;
grant all on public.payments to service_role;
alter table public.payments enable row level security;
create policy "payments own or admin" on public.payments for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and (o.customer_id = auth.uid() or public.has_role(auth.uid(),'admin'))));

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null,
  title text not null,
  message text not null,
  order_id uuid references public.orders(id) on delete set null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_recipient_idx on public.notifications(recipient_id, created_at desc);
grant select on public.notifications to authenticated;
grant update (is_read) on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "notifications own read" on public.notifications for select to authenticated using (recipient_id = auth.uid());
create policy "notifications own update" on public.notifications for update to authenticated
  using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());

alter table public.notifications replica identity full;
alter table public.orders replica identity full;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.orders;

-- ===== Internal helpers =====
create or replace function public.notify_admins(_title text, _msg text, _order uuid)
returns void language sql security definer set search_path = public as $$
  insert into public.notifications(recipient_id,title,message,order_id)
  select user_id, _title, _msg, _order from public.user_roles where role = 'admin';
$$;

create or replace function public.notify_user(_uid uuid, _title text, _msg text, _order uuid)
returns void language sql security definer set search_path = public as $$
  insert into public.notifications(recipient_id,title,message,order_id) values (_uid,_title,_msg,_order);
$$;

create or replace function public.restore_order_stock(_order_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare it record; v_released boolean;
begin
  select stock_released into v_released from public.orders where id = _order_id for update;
  if v_released then return; end if;
  perform set_config('app.stock_reason', 'restored from cancelled order', true);
  for it in select oi.* from public.order_items oi where oi.order_id = _order_id order by oi.product_id, oi.size_label loop
    if it.product_id is null then continue; end if;
    if it.size_label = 'Free Size' and exists (select 1 from public.products where id = it.product_id and inventory_mode='free_size') then
      update public.products set free_size_stock = free_size_stock + it.quantity where id = it.product_id;
    elsif exists (select 1 from public.product_sizes where product_id = it.product_id and size_label = it.size_label) then
      update public.product_sizes set stock = stock + it.quantity where product_id = it.product_id and size_label = it.size_label;
    elsif it.size_label = 'Free Size' then
      update public.products set free_size_stock = free_size_stock + it.quantity where id = it.product_id;
    else
      insert into public.product_sizes(product_id,size_label,stock) values (it.product_id,it.size_label,it.quantity);
    end if;
  end loop;
  update public.orders set stock_released = true where id = _order_id;
end $$;

-- Releases reserved stock for unpaid orders past their reservation window
create or replace function public.release_expired_orders()
returns int language plpgsql security definer set search_path = public as $$
declare o record; n int := 0;
begin
  for o in select id, customer_id, order_number from public.orders
           where status = 'pending_payment' and payment_status in ('unpaid','rejected')
             and reserved_until is not null and reserved_until < now()
           for update skip locked loop
    perform public.restore_order_stock(o.id);
    update public.orders set status='cancelled', cancel_reason='Payment not received within the reservation window', reserved_until=null where id=o.id;
    perform public.notify_user(o.customer_id, 'Order cancelled', 'Order '||o.order_number||' was cancelled because payment was not received in time.', o.id);
    n := n + 1;
  end loop;
  return n;
end $$;

-- ===== Atomic checkout =====
create or replace function public.place_order(
  p_items jsonb, p_customer_name text, p_customer_phone text,
  p_fulfillment text, p_address text, p_idempotency_key uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid(); v_order_id uuid; v_num text; s public.store_settings%rowtype;
  it record; v_prod public.products%rowtype; v_size public.product_sizes%rowtype;
  v_label text; v_stock int; v_subtotal numeric(10,2) := 0; v_fee numeric(10,2) := 0;
begin
  if v_uid is null then raise exception 'Please sign in to place an order'; end if;
  if p_idempotency_key is null then raise exception 'Missing request key'; end if;
  select id into v_order_id from public.orders where customer_id = v_uid and idempotency_key = p_idempotency_key;
  if found then return v_order_id; end if;

  p_customer_name := btrim(coalesce(p_customer_name,''));
  p_customer_phone := regexp_replace(coalesce(p_customer_phone,''), '[^0-9+]', '', 'g');
  if char_length(p_customer_name) < 2 or char_length(p_customer_name) > 100 then raise exception 'Please enter your name'; end if;
  if p_customer_phone !~ '^(\+?91)?[6-9][0-9]{9}$' then raise exception 'Please enter a valid 10-digit mobile number'; end if;
  if p_fulfillment not in ('delivery','pickup') then raise exception 'Choose delivery or pickup'; end if;

  select * into s from public.store_settings where id = 1;
  if p_fulfillment = 'delivery' then
    if not s.delivery_enabled then raise exception 'Delivery is currently not available'; end if;
    p_address := btrim(coalesce(p_address,''));
    if char_length(p_address) < 10 or char_length(p_address) > 500 then raise exception 'Please enter a complete delivery address'; end if;
    v_fee := s.delivery_fee;
  else
    if not s.pickup_enabled then raise exception 'Store pickup is currently not available'; end if;
    p_address := null;
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'Your cart is empty'; end if;
  if jsonb_array_length(p_items) > 50 then raise exception 'Too many items in one order'; end if;

  v_num := 'SG' || to_char(now() at time zone 'Asia/Kolkata','YYMMDD') || '-' || nextval('public.order_number_seq');
  insert into public.orders(order_number, customer_id, idempotency_key, customer_name, customer_phone, fulfillment, delivery_address, reserved_until)
  values (v_num, v_uid, p_idempotency_key, p_customer_name, p_customer_phone, p_fulfillment, p_address, now() + make_interval(hours => s.reservation_hours))
  returning id into v_order_id;

  perform set_config('app.stock_reason', 'order '||v_num, true);

  -- consistent lock ordering to avoid deadlocks
  for it in
    select (e->>'product_id')::uuid as product_id, nullif(btrim(e->>'size'),'') as size, sum((e->>'quantity')::int) as qty
    from jsonb_array_elements(p_items) e
    group by 1,2 order by 1,2
  loop
    if it.qty is null or it.qty < 1 or it.qty > 100 then raise exception 'Invalid quantity'; end if;
    select * into v_prod from public.products where id = it.product_id for update;
    if not found or not v_prod.is_active or v_prod.archived_at is not null then
      raise exception 'A product in your cart is no longer available';
    end if;
    if v_prod.inventory_mode = 'free_size' then
      if it.size is not null and it.size <> 'Free Size' then raise exception '% is only available in Free Size', v_prod.name; end if;
      if v_prod.free_size_stock < it.qty then
        raise exception 'Only % left of %', v_prod.free_size_stock, v_prod.name;
      end if;
      update public.products set free_size_stock = free_size_stock - it.qty where id = v_prod.id returning free_size_stock into v_stock;
      v_label := 'Free Size';
    else
      select * into v_size from public.product_sizes where product_id = v_prod.id and size_label = it.size for update;
      if not found then raise exception 'Please choose a valid size for %', v_prod.name; end if;
      if v_size.stock < it.qty then
        raise exception 'Only % left of % (size %)', v_size.stock, v_prod.name, v_size.size_label;
      end if;
      update public.product_sizes set stock = stock - it.qty where id = v_size.id returning stock into v_stock;
      v_label := v_size.size_label;
    end if;
    insert into public.order_items(order_id, product_id, product_name, size_label, unit_price, quantity, line_total)
    values (v_order_id, v_prod.id, v_prod.name, v_label, v_prod.price, it.qty, v_prod.price * it.qty);
    v_subtotal := v_subtotal + v_prod.price * it.qty;
    if v_stock = 0 then
      perform public.notify_admins('Out of stock', v_prod.name || ' (' || v_label || ') is now out of stock.', null);
    elsif v_stock <= s.low_stock_threshold then
      perform public.notify_admins('Low stock', v_prod.name || ' (' || v_label || ') has only ' || v_stock || ' left.', null);
    end if;
  end loop;

  update public.orders set subtotal = v_subtotal, delivery_fee = v_fee, total = v_subtotal + v_fee where id = v_order_id;
  perform public.notify_user(v_uid, 'Order placed', 'Order '||v_num||' created. Please complete the UPI payment and upload proof.', v_order_id);
  perform public.notify_admins('New order', 'Order '||v_num||' from '||p_customer_name||' — ₹'||(v_subtotal+v_fee)::text, v_order_id);
  return v_order_id;
end $$;

-- ===== Payment proof =====
create or replace function public.submit_payment_proof(p_order_id uuid, p_transaction_ref text, p_screenshot_path text)
returns uuid language plpgsql security definer set search_path = public as $$
declare o public.orders%rowtype; v_id uuid; v_resub boolean;
begin
  select * into o from public.orders where id = p_order_id for update;
  if not found or o.customer_id <> auth.uid() then raise exception 'Order not found'; end if;
  if o.status = 'cancelled' then raise exception 'This order was cancelled'; end if;
  if o.payment_status not in ('unpaid','rejected') then raise exception 'Payment proof already submitted for this order'; end if;
  p_transaction_ref := btrim(coalesce(p_transaction_ref,''));
  if p_transaction_ref !~ '^[A-Za-z0-9-]{4,64}$' then raise exception 'Enter a valid transaction / UTR reference'; end if;
  if p_screenshot_path is null or p_screenshot_path not like (auth.uid()::text || '/' || p_order_id::text || '/%') then
    raise exception 'Invalid screenshot';
  end if;
  if not exists (select 1 from storage.objects where bucket_id='payment-proofs' and name = p_screenshot_path) then
    raise exception 'Screenshot upload not found';
  end if;
  v_resub := o.payment_status = 'rejected';
  insert into public.payments(order_id, transaction_ref, screenshot_path) values (p_order_id, p_transaction_ref, p_screenshot_path) returning id into v_id;
  update public.orders set payment_status = 'proof_submitted', reserved_until = null where id = p_order_id;
  perform public.notify_user(o.customer_id, 'Payment proof received', 'We received your payment proof for '||o.order_number||'. The shop will verify it shortly.', o.id);
  perform public.notify_admins(case when v_resub then 'Payment proof resubmitted' else 'Payment proof submitted' end,
     o.order_number||' — ₹'||o.total::text||' — Ref '||p_transaction_ref, o.id);
  return v_id;
end $$;

-- ===== Admin payment review (idempotent) =====
create or replace function public.admin_review_payment(p_payment_id uuid, p_action text, p_reason text default null, p_note text default null)
returns text language plpgsql security definer set search_path = public as $$
declare p public.payments%rowtype; o public.orders%rowtype; s public.store_settings%rowtype;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Not authorized'; end if;
  select * into p from public.payments where id = p_payment_id for update;
  if not found then raise exception 'Payment not found'; end if;
  select * into o from public.orders where id = p.order_id for update;
  if p_note is not null then update public.payments set admin_note = left(p_note, 1000) where id = p.id; end if;

  if p_action = 'verify' then
    if p.status = 'verified' then return 'already_verified'; end if;
    if p.status not in ('proof_submitted','under_review') then raise exception 'This payment cannot be verified (status: %)', p.status; end if;
    if o.status = 'cancelled' then raise exception 'Order is cancelled'; end if;
    update public.payments set status='verified', reviewer_id=auth.uid(), reviewed_at=now() where id=p.id;
    update public.orders set payment_status='verified', status = case when status='pending_payment' then 'confirmed' else status end, reserved_until=null where id=o.id;
    perform public.notify_user(o.customer_id, 'Payment verified', 'Payment for '||o.order_number||' is verified. Your order is confirmed.', o.id);
    return 'verified';
  elsif p_action = 'reject' then
    if p.status = 'rejected' then return 'already_rejected'; end if;
    if p.status not in ('proof_submitted','under_review') then raise exception 'This payment cannot be rejected (status: %)', p.status; end if;
    if p_reason is null or char_length(btrim(p_reason)) < 3 then raise exception 'Please give a rejection reason'; end if;
    select * into s from public.store_settings where id=1;
    update public.payments set status='rejected', rejection_reason=left(btrim(p_reason),500), reviewer_id=auth.uid(), reviewed_at=now() where id=p.id;
    update public.orders set payment_status='rejected', reserved_until = now() + make_interval(hours => s.reservation_hours) where id=o.id;
    perform public.notify_user(o.customer_id, 'Payment proof rejected', 'Payment proof for '||o.order_number||' was rejected: '||left(btrim(p_reason),300)||'. Please submit a new proof.', o.id);
    return 'rejected';
  elsif p_action = 'under_review' then
    if p.status = 'proof_submitted' then
      update public.payments set status='under_review' where id=p.id;
      update public.orders set payment_status='under_review' where id=o.id;
    end if;
    return 'under_review';
  elsif p_action = 'note' then
    return 'noted';
  end if;
  raise exception 'Unknown action';
end $$;

-- ===== Admin order status =====
create or replace function public.admin_update_order_status(p_order_id uuid, p_status text, p_reason text default null)
returns text language plpgsql security definer set search_path = public as $$
declare o public.orders%rowtype;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Not authorized'; end if;
  select * into o from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if o.status = p_status then return 'unchanged'; end if;

  if p_status = 'processing' and not (o.status = 'confirmed' and o.payment_status='verified') then
    raise exception 'Only confirmed, paid orders can move to processing';
  elsif p_status = 'completed' and o.status <> 'processing' then
    raise exception 'Only processing orders can be completed';
  elsif p_status = 'cancelled' then
    if o.status = 'completed' then raise exception 'Completed orders cannot be cancelled'; end if;
    perform public.restore_order_stock(o.id);
    update public.orders set status='cancelled', cancel_reason=left(p_reason,300), reserved_until=null where id=o.id;
    perform public.notify_user(o.customer_id,'Order cancelled','Order '||o.order_number||' was cancelled by the shop'||coalesce(': '||left(p_reason,200),'')||
      case when o.payment_status='verified' then '. Refund status will be updated separately.' else '.' end, o.id);
    return 'cancelled';
  elsif p_status not in ('processing','completed') then
    raise exception 'Invalid status';
  end if;

  update public.orders set status = p_status where id=o.id;
  perform public.notify_user(o.customer_id,'Order update','Order '||o.order_number||' is now '||p_status||'.', o.id);
  return p_status;
end $$;

create or replace function public.admin_mark_refunded(p_order_id uuid)
returns text language plpgsql security definer set search_path = public as $$
declare o public.orders%rowtype;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Not authorized'; end if;
  select * into o from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if o.payment_status = 'refunded' then return 'already_refunded'; end if;
  if o.status <> 'cancelled' or o.payment_status <> 'verified' then raise exception 'Only cancelled orders with verified payment can be refunded'; end if;
  update public.orders set payment_status='refunded' where id=o.id;
  update public.payments set status='refunded' where order_id=o.id and status='verified';
  perform public.notify_user(o.customer_id,'Refund processed','Refund for order '||o.order_number||' has been marked as processed by the shop.', o.id);
  return 'refunded';
end $$;

-- ===== Function execution grants =====
revoke execute on function public.notify_admins(text,text,uuid) from public, anon, authenticated;
revoke execute on function public.notify_user(uuid,text,text,uuid) from public, anon, authenticated;
revoke execute on function public.restore_order_stock(uuid) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.place_order(jsonb,text,text,text,text,uuid) from public, anon;
revoke execute on function public.submit_payment_proof(uuid,text,text) from public, anon;
revoke execute on function public.admin_review_payment(uuid,text,text,text) from public, anon;
revoke execute on function public.admin_update_order_status(uuid,text,text) from public, anon;
revoke execute on function public.admin_mark_refunded(uuid) from public, anon;
revoke execute on function public.release_expired_orders() from public, anon;
grant execute on function public.place_order(jsonb,text,text,text,text,uuid) to authenticated;
grant execute on function public.submit_payment_proof(uuid,text,text) to authenticated;
grant execute on function public.admin_review_payment(uuid,text,text,text) to authenticated;
grant execute on function public.admin_update_order_status(uuid,text,text) to authenticated;
grant execute on function public.admin_mark_refunded(uuid) to authenticated;
grant execute on function public.release_expired_orders() to authenticated;
grant execute on function public.has_role(uuid, public.app_role) to authenticated, anon;
