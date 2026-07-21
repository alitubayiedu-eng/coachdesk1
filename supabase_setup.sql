-- ============================================================
--  پلتفرم مربی و ورزشجو — اسکیمای نهایی Supabase
--  شامل: جدول‌ها + RLS + Storage + مربی پیش‌فرض «یاسین بیات»
--  یکجا در Supabase → SQL Editor اجرا کن
-- ============================================================

-- ============================================================
--  پاکسازی کامل (اگر از قبل جدول‌ها وجود دارند، همه حذف شوند)
--  ⚠️ همهٔ داده‌ها پاک می‌شود — فقط برای نصب تازه استفاده کن
-- ============================================================
drop table if exists public.stories        cascade;
drop table if exists public.partnerships   cascade;
drop table if exists public.follows        cascade;
drop table if exists public.post_comments  cascade;
drop table if exists public.post_likes     cascade;
drop table if exists public.posts          cascade;
drop table if exists public.progress_photos cascade;
drop table if exists public.daily_reports  cascade;
drop table if exists public.diet_plans     cascade;
drop table if exists public.plan_items     cascade;
drop table if exists public.workout_plans  cascade;
drop table if exists public.exercises      cascade;
drop table if exists public.profiles       cascade;

drop function if exists public.my_coach()  cascade;
drop function if exists public.is_coach()  cascade;

-- ---------- 1. پروفایل‌ها ----------
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text not null,
  role          text not null default 'athlete' check (role in ('coach','athlete')),
  coach_id      uuid references public.profiles(id) on delete set null,
  phone         text,
  birth_year    int,
  height_cm     int,
  goal          text,
  notes         text,
  photo         text,
  journey       text,
  journey_weeks int default 12,
  current_week  int default 1,
  created_at    timestamptz default now()
);

-- ---------- 2. کتابخانه حرکات ----------
create table public.exercises (
  id           uuid primary key default gen_random_uuid(),
  coach_id     uuid not null references public.profiles(id) on delete cascade,
  name         text not null,
  muscle_group text,
  description  text,
  video_url    text,
  video_path   text,
  created_at   timestamptz default now()
);

-- ---------- 3. برنامه (هفته/روز) ----------
create table public.workout_plans (
  id          uuid primary key default gen_random_uuid(),
  athlete_id  uuid not null references public.profiles(id) on delete cascade,
  coach_id    uuid not null references public.profiles(id) on delete cascade,
  week        int not null,
  day         int not null check (day between 0 and 6),  -- 0=شنبه ... 6=جمعه
  title       text,
  created_at  timestamptz default now(),
  unique (athlete_id, week, day)
);

-- ---------- 4. حرکات هر برنامه ----------
create table public.plan_items (
  id           uuid primary key default gen_random_uuid(),
  plan_id      uuid not null references public.workout_plans(id) on delete cascade,
  exercise_id  uuid references public.exercises(id) on delete set null,
  sets         int,
  reps         text,
  rest_seconds int,
  weight       text,
  order_index  int default 0
);

-- ---------- 5. رژیم ----------
create table public.diet_plans (
  id          uuid primary key default gen_random_uuid(),
  athlete_id  uuid not null references public.profiles(id) on delete cascade,
  coach_id    uuid not null references public.profiles(id) on delete cascade,
  title       text,
  content     text,
  start_date  date default current_date,
  created_at  timestamptz default now()
);

-- ---------- 6. گزارش روزانه ----------
create table public.daily_reports (
  id           uuid primary key default gen_random_uuid(),
  athlete_id   uuid not null references public.profiles(id) on delete cascade,
  plan_id      uuid references public.workout_plans(id) on delete set null,
  report_date  date not null default current_date,
  completed    boolean default false,
  weight_kg    numeric,
  energy_level int check (energy_level between 1 and 5),
  notes        text,
  coach_seen   boolean default false,
  created_at   timestamptz default now()
);

-- ---------- 7. عکس‌های پیشرفت ----------
create table public.progress_photos (
  id          uuid primary key default gen_random_uuid(),
  athlete_id  uuid not null references public.profiles(id) on delete cascade,
  path        text not null,
  caption     text,
  photo_date  date default current_date,
  created_at  timestamptz default now()
);

-- ---------- 8. شبکهٔ اجتماعی: پست‌ها ----------
create table public.posts (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references public.profiles(id) on delete cascade,
  text        text,
  image_path  text,
  created_at  timestamptz default now()
);
create table public.post_likes (
  post_id     uuid references public.posts(id) on delete cascade,
  user_id     uuid references public.profiles(id) on delete cascade,
  primary key (post_id, user_id)
);
create table public.post_comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid references public.posts(id) on delete cascade,
  user_id     uuid references public.profiles(id) on delete cascade,
  text        text not null,
  created_at  timestamptz default now()
);

-- ---------- 9. دنبال‌کردن و حریف تمرینی ----------
create table public.follows (
  follower    uuid references public.profiles(id) on delete cascade,
  followee    uuid references public.profiles(id) on delete cascade,
  primary key (follower, followee)
);
create table public.partnerships (
  id          uuid primary key default gen_random_uuid(),
  a           uuid references public.profiles(id) on delete cascade,
  b           uuid references public.profiles(id) on delete cascade
);

-- ---------- 10. استوری (۲۴ ساعته) ----------
create table public.stories (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references public.profiles(id) on delete cascade,
  image_path  text,
  text        text,
  bg          text,
  created_at  timestamptz default now(),
  expires_at  timestamptz default (now() + interval '24 hours')
);

-- ============================================================
--  Row Level Security
-- ============================================================
alter table public.profiles       enable row level security;
alter table public.exercises      enable row level security;
alter table public.workout_plans  enable row level security;
alter table public.plan_items     enable row level security;
alter table public.diet_plans     enable row level security;
alter table public.daily_reports  enable row level security;
alter table public.progress_photos enable row level security;
alter table public.posts          enable row level security;
alter table public.post_likes     enable row level security;
alter table public.post_comments  enable row level security;
alter table public.follows        enable row level security;
alter table public.partnerships   enable row level security;
alter table public.stories        enable row level security;

-- helper: coach_id کاربر جاری
create or replace function public.my_coach() returns uuid
language sql stable security definer as $$
  select coach_id from public.profiles where id = auth.uid()
$$;
create or replace function public.is_coach() returns boolean
language sql stable security definer as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role='coach')
$$;

-- profiles: خودت، شاگردانت، یا اگر مربی‌ای همه در باشگاهت
drop policy if exists "profiles read" on public.profiles;
create policy "profiles read" on public.profiles for select using (
  id = auth.uid() or coach_id = auth.uid() or public.my_coach() = coach_id or public.my_coach() = id
);
drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles for update using (
  id = auth.uid() or coach_id = auth.uid()
);
drop policy if exists "profiles insert" on public.profiles;
create policy "profiles insert" on public.profiles for insert with check (
  id = auth.uid() or coach_id = auth.uid()
);

-- exercises
drop policy if exists "ex coach all" on public.exercises;
create policy "ex coach all" on public.exercises for all
  using (coach_id = auth.uid()) with check (coach_id = auth.uid());
drop policy if exists "ex athlete read" on public.exercises;
create policy "ex athlete read" on public.exercises for select using (coach_id = public.my_coach());

-- workout_plans
drop policy if exists "wp coach all" on public.workout_plans;
create policy "wp coach all" on public.workout_plans for all
  using (coach_id = auth.uid()) with check (coach_id = auth.uid());
drop policy if exists "wp athlete read" on public.workout_plans;
create policy "wp athlete read" on public.workout_plans for select using (athlete_id = auth.uid());

-- plan_items
drop policy if exists "pi coach all" on public.plan_items;
create policy "pi coach all" on public.plan_items for all using (
  exists(select 1 from public.workout_plans w where w.id = plan_id and w.coach_id = auth.uid())
) with check (
  exists(select 1 from public.workout_plans w where w.id = plan_id and w.coach_id = auth.uid())
);
drop policy if exists "pi athlete read" on public.plan_items;
create policy "pi athlete read" on public.plan_items for select using (
  exists(select 1 from public.workout_plans w where w.id = plan_id and w.athlete_id = auth.uid())
);

-- diet_plans
drop policy if exists "dp coach all" on public.diet_plans;
create policy "dp coach all" on public.diet_plans for all
  using (coach_id = auth.uid()) with check (coach_id = auth.uid());
drop policy if exists "dp athlete read" on public.diet_plans;
create policy "dp athlete read" on public.diet_plans for select using (athlete_id = auth.uid());

-- daily_reports
drop policy if exists "dr athlete all" on public.daily_reports;
create policy "dr athlete all" on public.daily_reports for all
  using (athlete_id = auth.uid()) with check (athlete_id = auth.uid());
drop policy if exists "dr coach read" on public.daily_reports;
create policy "dr coach read" on public.daily_reports for select using (
  athlete_id in (select id from public.profiles where coach_id = auth.uid())
);
drop policy if exists "dr coach update" on public.daily_reports;
create policy "dr coach update" on public.daily_reports for update using (
  athlete_id in (select id from public.profiles where coach_id = auth.uid())
);

-- progress_photos: ورزشجو مال خودش، مربی شاگردانش
drop policy if exists "pp owner" on public.progress_photos;
create policy "pp owner" on public.progress_photos for all
  using (athlete_id = auth.uid()) with check (athlete_id = auth.uid());
drop policy if exists "pp coach read" on public.progress_photos;
create policy "pp coach read" on public.progress_photos for select using (
  athlete_id in (select id from public.profiles where coach_id = auth.uid())
);

-- posts / likes / comments: بین اعضای یک باشگاه
drop policy if exists "posts read" on public.posts;
create policy "posts read" on public.posts for select using (
  author_id = auth.uid()
  or author_id = public.my_coach()
  or author_id in (select id from public.profiles where coach_id = public.my_coach())
  or author_id in (select id from public.profiles where coach_id = auth.uid())
);
drop policy if exists "posts own write" on public.posts;
create policy "posts own write" on public.posts for all
  using (author_id = auth.uid()) with check (author_id = auth.uid());

drop policy if exists "likes read" on public.post_likes;
create policy "likes read" on public.post_likes for select using (true);
drop policy if exists "likes own" on public.post_likes;
create policy "likes own" on public.post_likes for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "comments read" on public.post_comments;
create policy "comments read" on public.post_comments for select using (true);
drop policy if exists "comments own" on public.post_comments;
create policy "comments own" on public.post_comments for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- follows / partnerships
drop policy if exists "follows read" on public.follows;
create policy "follows read" on public.follows for select using (true);
drop policy if exists "follows own" on public.follows;
create policy "follows own" on public.follows for all
  using (follower = auth.uid()) with check (follower = auth.uid());

drop policy if exists "partner read" on public.partnerships;
create policy "partner read" on public.partnerships for select using (true);
drop policy if exists "partner own" on public.partnerships;
create policy "partner own" on public.partnerships for all
  using (a = auth.uid() or b = auth.uid()) with check (a = auth.uid() or b = auth.uid());

-- stories: فقط فعال‌ها خوانده شوند
drop policy if exists "stories read" on public.stories;
create policy "stories read" on public.stories for select using (
  expires_at > now() and (
    author_id = auth.uid()
    or author_id = public.my_coach()
    or author_id in (select id from public.profiles where coach_id = public.my_coach())
    or author_id in (select id from public.profiles where coach_id = auth.uid())
  )
);
drop policy if exists "stories own" on public.stories;
create policy "stories own" on public.stories for all
  using (author_id = auth.uid()) with check (author_id = auth.uid());

-- ============================================================
--  Storage: باکت‌ها برای ویدیو، عکس پیشرفت، پست، استوری
-- ============================================================
insert into storage.buckets (id, name, public) values
  ('exercise-videos','exercise-videos', false),
  ('progress-photos','progress-photos', false),
  ('post-images','post-images', true),
  ('story-images','story-images', true)
on conflict (id) do nothing;

drop policy if exists "authed upload" on storage.objects;
create policy "authed upload" on storage.objects for insert
  with check (auth.role() = 'authenticated');
drop policy if exists "authed read" on storage.objects;
create policy "authed read" on storage.objects for select
  using (auth.role() = 'authenticated' or bucket_id in ('post-images','story-images'));
drop policy if exists "owner delete" on storage.objects;
create policy "owner delete" on storage.objects for delete
  using (auth.uid() = owner);

-- ============================================================
--  حذف خودکار استوری‌های منقضی (تا حافظه اشغال نشود)
--  نیازمند افزونهٔ pg_cron (در Supabase از Database → Extensions فعال کن)
-- ============================================================
-- create extension if not exists pg_cron;
-- select cron.schedule('purge-stories','*/30 * * * *',
--   $$ delete from public.stories where expires_at < now() $$);

-- ============================================================
--  مربی پیش‌فرض: یاسین بیات
--  (این بلوک بعد از ساختن کاربر در Authentication اجرا می‌شود)
-- ============================================================
-- روش خودکار: اگر کاربری با این ایمیل در auth.users باشد، پروفایل مربی بساز
do $$
declare uid uuid;
begin
  select id into uid from auth.users where email = 'yasin@coachdesk.app' limit 1;
  if uid is not null then
    insert into public.profiles (id, full_name, role)
    values (uid, 'یاسین بیات', 'coach')
    on conflict (id) do update set full_name = 'یاسین بیات', role = 'coach';
    raise notice 'مربی یاسین بیات ساخته/به‌روز شد.';
  else
    raise notice 'ابتدا کاربر yasin@coachdesk.app را در Authentication بساز، سپس این اسکریپت را دوباره اجرا کن.';
  end if;
end $$;
