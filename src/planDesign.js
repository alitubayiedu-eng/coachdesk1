// ============================================================
//  کمکی‌های طراحی «برنامه تمرینی» (پوستری) — مشترک بین اپ و PDF
// ============================================================
const LOWER = ["جلوران", "پشت ران", "باسن", "ساق پا"];

export function muscleCategory(group) {
  if (LOWER.includes(group)) return "lower";
  if (group === "شکم") return "core";
  if (group === "کل بدن") return "full";
  if (group === "کشش و گرم‌کردن") return "stretch";
  return "upper"; // سینه، پشت، شانه، جلوبازو، پشت بازو، ساعد
}

export const CATEGORY_EMOJI = { upper: "💪", lower: "🦵", core: "🔥", full: "⚡", stretch: "🧘" };

export function dayMuscleGroups(items) {
  return [...new Set(items.map(i => i.exercise?.muscle_group).filter(Boolean))];
}

export function dayCategory(items) {
  const groups = dayMuscleGroups(items);
  if (!groups.length) return "upper";
  const cats = groups.map(muscleCategory);
  // پرتکرارترین دسته را برای آیکون سمت روز انتخاب کن
  const counts = {};
  cats.forEach(c => { counts[c] = (counts[c] || 0) + 1; });
  return Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
}
