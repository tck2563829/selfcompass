create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  goal text not null default '自分の軸で選べる人',
  answers jsonb not null default '[]'::jsonb,
  logs jsonb not null default '[]'::jsonb,
  ai_scores jsonb,
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists ai_scores jsonb;

alter table public.profiles enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);
