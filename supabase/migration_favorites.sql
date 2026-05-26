create table if not exists favorites (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references profiles(id) on delete cascade not null,
  speakeasy_id uuid references speakeasies(id) on delete cascade not null,
  created_at   timestamptz default now(),
  unique(user_id, speakeasy_id)
);

alter table favorites enable row level security;
create policy "favorites_select" on favorites for select using (auth.uid() = user_id);
create policy "favorites_insert" on favorites for insert with check (auth.uid() = user_id);
create policy "favorites_delete" on favorites for delete using (auth.uid() = user_id);
