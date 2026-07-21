// ============================================================
//  محاسبهٔ ترکیب بدنی (علمی)
//  BMI: استاندارد WHO
//  درصد چربی بدن: روش دور بدن نیروی دریایی آمریکا (US Navy Method،
//  Hodgdon & Beckett 1984) — با خطای حدود ۳-۴٪، معتبرترین روش
//  تخمین چربی بدن فقط با متر نواری.
//  نیازمند: قد، گردن، کمر (و برای زنان: باسن)
// ============================================================

export function bmiOf(weight_kg, height_cm) {
  if (!weight_kg || !height_cm) return null;
  const h = height_cm / 100;
  return weight_kg / (h * h);
}

export function bmiCategory(bmi) {
  if (bmi == null) return null;
  if (bmi < 18.5) return { label: "کم‌وزن", color: "var(--ring)" };
  if (bmi < 25) return { label: "طبیعی", color: "var(--green)" };
  if (bmi < 30) return { label: "اضافه‌وزن", color: "var(--accent)" };
  return { label: "چاقی", color: "var(--red)" };
}

// درصد چربی بدن به روش نیروی دریایی آمریکا (واحد: سانتی‌متر)
export function navyBodyFat({ sex, height_cm, neck_cm, waist_cm, hip_cm }) {
  if (!height_cm || !neck_cm || !waist_cm) return null;
  if (sex === "female") {
    if (!hip_cm) return null;
    const d = waist_cm + hip_cm - neck_cm;
    if (d <= 0) return null;
    return 495 / (1.29579 - 0.35004 * Math.log10(d) + 0.221 * Math.log10(height_cm)) - 450;
  }
  const d = waist_cm - neck_cm;
  if (d <= 0) return null;
  return 495 / (1.0324 - 0.19077 * Math.log10(d) + 0.15456 * Math.log10(height_cm)) - 450;
}

// دسته‌بندی درصد چربی بر اساس استاندارد ACE (بر حسب جنسیت)
export function bodyFatCategory(bf, sex) {
  if (bf == null) return null;
  const table = sex === "female"
    ? [[13, "چربی ضروری"], [20, "ورزشکار"], [24, "تناسب اندام"], [31, "طبیعی"], [Infinity, "بالای حد طبیعی"]]
    : [[5, "چربی ضروری"], [13, "ورزشکار"], [17, "تناسب اندام"], [24, "طبیعی"], [Infinity, "بالای حد طبیعی"]];
  const hit = table.find(([max]) => bf < max);
  return hit ? hit[1] : table[table.length - 1][1];
}

// خروجی کامل ترکیب بدنی برای نمایش در پروفایل
export function bodyComposition({ sex, height_cm, weight_kg, neck_cm, waist_cm, hip_cm }) {
  const bmi = bmiOf(weight_kg, height_cm);
  const bf = navyBodyFat({ sex, height_cm, neck_cm, waist_cm, hip_cm });
  const bfRounded = bf != null ? Math.round(bf * 10) / 10 : null;
  const fatMass = (bfRounded != null && weight_kg) ? Math.round(weight_kg * (bfRounded / 100) * 10) / 10 : null;
  const leanMass = (fatMass != null && weight_kg) ? Math.round((weight_kg - fatMass) * 10) / 10 : null;
  return {
    bmi: bmi != null ? Math.round(bmi * 10) / 10 : null,
    bmiCat: bmiCategory(bmi),
    bodyFat: bfRounded,
    bodyFatCat: bodyFatCategory(bfRounded, sex),
    fatMass, leanMass,
    missing: !height_cm ? "قد" : !weight_kg ? "وزن" : !neck_cm ? "دور گردن" : !waist_cm ? "دور کمر" : (sex === "female" && !hip_cm) ? "دور باسن" : null,
  };
}
