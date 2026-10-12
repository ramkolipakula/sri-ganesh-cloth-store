
-- Create storage buckets if they do not already exist
insert into storage.buckets (id, name, public)
values
  ('product-images', 'product-images', true),
  ('store-assets', 'store-assets', true),
  ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;

-- Product images & store assets: anyone may read (via signed URLs), only admins write
create policy "catalog images readable" on storage.objects for select to anon, authenticated
  using (bucket_id in ('product-images','store-assets'));
create policy "catalog images admin insert" on storage.objects for insert to authenticated
  with check (bucket_id in ('product-images','store-assets') and public.has_role(auth.uid(),'admin')
              and lower(storage.extension(name)) in ('jpg','jpeg','png','webp'));
create policy "catalog images admin update" on storage.objects for update to authenticated
  using (bucket_id in ('product-images','store-assets') and public.has_role(auth.uid(),'admin'));
create policy "catalog images admin delete" on storage.objects for delete to authenticated
  using (bucket_id in ('product-images','store-assets') and public.has_role(auth.uid(),'admin'));

-- Payment proofs: path = <user_id>/<order_id>/<file>; customer uploads only into own order folder
create policy "proof owner insert" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'payment-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
    and lower(storage.extension(name)) in ('jpg','jpeg','png','webp')
    and exists (select 1 from public.orders o where o.id::text = (storage.foldername(name))[2] and o.customer_id = auth.uid())
  );
create policy "proof owner or admin read" on storage.objects for select to authenticated
  using (bucket_id = 'payment-proofs' and ((storage.foldername(name))[1] = auth.uid()::text or public.has_role(auth.uid(),'admin')));
