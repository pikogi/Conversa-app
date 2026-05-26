-- ─────────────────────────────────────────
-- Migración: agregar campos al perfil + fix trigger
-- Correr en Supabase > SQL Editor
-- ─────────────────────────────────────────

-- Agregar columnas nuevas a profiles
alter table profiles
  add column if not exists english_level text default 'básico' check (english_level in ('básico','intermedio','avanzado')),
  add column if not exists topics        text[] default '{}';

-- Fix: reemplazar el trigger con search_path explícito
-- (sin esto, security definer no encuentra la tabla profiles)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, age, city, bio, avatar, english_level, topics)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    case
      when new.raw_user_meta_data->>'age' ~ '^\d+$'
      then (new.raw_user_meta_data->>'age')::integer
      else null
    end,
    new.raw_user_meta_data->>'city',
    new.raw_user_meta_data->>'bio',
    upper(substr(coalesce(new.raw_user_meta_data->>'name', new.email), 1, 1)),
    coalesce(new.raw_user_meta_data->>'english_level', 'básico'),
    case
      when new.raw_user_meta_data->'topics' is not null
      then array(select jsonb_array_elements_text(new.raw_user_meta_data->'topics'))
      else '{}'
    end
  );
  return new;
end;
$$;

-- Re-crear el trigger por si no existe
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
