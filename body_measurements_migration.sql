-- ============================================================
--  افزودن اندازه‌های بدنی برای محاسبهٔ علمی درصد چربی و BMI
--  در Supabase → SQL Editor اجرا کن (یک‌بار کافی است، IF NOT EXISTS دارد)
-- ============================================================
alter table public.profiles
  add column if not exists sex       text check (sex in ('male','female')),
  add column if not exists weight_kg numeric,
  add column if not exists neck_cm   numeric,
  add column if not exists waist_cm  numeric,
  add column if not exists hip_cm    numeric,
  add column if not exists arm_cm    numeric,
  add column if not exists thigh_cm  numeric;
