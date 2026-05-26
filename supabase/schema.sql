-- ─────────────────────────────────────────
-- CONVERSA — Schema
-- Correr en Supabase > SQL Editor
-- ─────────────────────────────────────────

-- Perfiles (extiende auth.users de Supabase)
create table if not exists profiles (
  id             uuid references auth.users on delete cascade primary key,
  name           text not null,
  age            integer check (age >= 18 and age <= 99),
  city           text,
  bio            text,
  avatar         text default 'U',
  english_level  text default 'básico' check (english_level in ('básico','intermedio','avanzado')),
  topics         text[] default '{}',
  created_at     timestamptz default now()
);

-- Speakeasies
create table if not exists speakeasies (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  topic            text not null,
  description      text,
  date             date not null,
  time             time not null,
  meeting_url      text,
  facilitator_id   uuid references profiles(id) on delete cascade not null,
  level            text default 'intermedio' check (level in ('básico','intermedio','avanzado')),
  max_participants integer default 4,
  created_at       timestamptz default now()
);

-- Participantes
create table if not exists participants (
  id            uuid primary key default gen_random_uuid(),
  speakeasy_id  uuid references speakeasies(id) on delete cascade not null,
  user_id       uuid references profiles(id) on delete cascade not null,
  joined_at     timestamptz default now(),
  unique(speakeasy_id, user_id)
);

-- ─── RLS ───
alter table profiles     enable row level security;
alter table speakeasies  enable row level security;
alter table participants enable row level security;

-- Profiles: cualquiera lee, solo el dueño edita
create policy "profiles_select" on profiles for select using (true);
create policy "profiles_insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on profiles for update using (auth.uid() = id);

-- Speakeasies: cualquiera lee, autenticados crean, facilitador edita/borra
create policy "speakeasies_select" on speakeasies for select using (true);
create policy "speakeasies_insert" on speakeasies for insert with check (auth.uid() = facilitator_id);
create policy "speakeasies_update" on speakeasies for update using (auth.uid() = facilitator_id);
create policy "speakeasies_delete" on speakeasies for delete using (auth.uid() = facilitator_id);

-- Participants: autenticados leen y se anotan, solo el dueño se va
create policy "participants_select" on participants for select using (true);
create policy "participants_insert" on participants for insert with check (auth.uid() = user_id);
create policy "participants_delete" on participants for delete using (auth.uid() = user_id);

-- ─── Trigger: crear perfil automáticamente al registrarse ───
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, name, age, city, bio, avatar, english_level, topics)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    case when new.raw_user_meta_data->>'age' is not null then (new.raw_user_meta_data->>'age')::integer else null end,
    new.raw_user_meta_data->>'city',
    new.raw_user_meta_data->>'bio',
    upper(substr(coalesce(new.raw_user_meta_data->>'name', new.email), 1, 1)),
    coalesce(new.raw_user_meta_data->>'english_level', 'básico'),
    case when new.raw_user_meta_data->'topics' is not null
      then array(select jsonb_array_elements_text(new.raw_user_meta_data->'topics'))
      else '{}'
    end
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
