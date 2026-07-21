-- ============================================================
--  ثبت جزئیات هر حرکت در گزارش روزانه: تیک انجام‌شدن + وزنهٔ هر ست
--  در Supabase → SQL Editor اجرا کن (یک‌بار کافی است)
-- ============================================================
create table if not exists public.report_exercises (
  id           uuid primary key default gen_random_uuid(),
  report_id    uuid not null references public.daily_reports(id) on delete cascade,
  exercise_id  uuid references public.exercises(id) on delete set null,
  name         text not null default '',
  done         boolean default false,
  set_weights  jsonb default '[]'::jsonb,
  order_index  int default 0,
  created_at   timestamptz default now()
);

alter table public.report_exercises enable row level security;

drop policy if exists "re athlete all" on public.report_exercises;
create policy "re athlete all" on public.report_exercises for all using (
  exists(select 1 from public.daily_reports r where r.id = report_id and r.athlete_id = auth.uid())
) with check (
  exists(select 1 from public.daily_reports r where r.id = report_id and r.athlete_id = auth.uid())
);

drop policy if exists "re coach read" on public.report_exercises;
create policy "re coach read" on public.report_exercises for select using (
  exists(
    select 1 from public.daily_reports r
    join public.profiles p on p.id = r.athlete_id
    where r.id = report_id and p.coach_id = auth.uid()
  )
);
