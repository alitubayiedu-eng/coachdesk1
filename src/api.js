// ============================================================
//  لایهٔ اتصال به Supabase (نسخهٔ واقعی، async)
//  جایگزین db.js محلی. همهٔ توابع Promise برمی‌گردانند.
// ============================================================
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("⚠️ VITE_SUPABASE_URL یا VITE_SUPABASE_ANON_KEY تنظیم نشده — فایل .env را بررسی کن");
}

export const supabase = createClient(url, key);
export const DAYS = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];

// ---------- کمکی‌ها ----------
const today = () => new Date().toISOString().slice(0, 10);

async function signedUrl(bucket, path) {
  if (!path) return "";
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
  return data?.signedUrl || "";
}
async function uploadFile(bucket, userId, file) {
  const ext = (file.name || "img").split(".").pop();
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
  if (error) throw error;
  return path;
}
// dataURL → Blob (برای عکس‌هایی که در مرورگر resize شده‌اند)
function dataURLtoBlob(dataUrl) {
  const [head, body] = dataUrl.split(",");
  const mime = head.match(/:(.*?);/)[1];
  const bin = atob(body);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}
async function uploadDataUrl(bucket, userId, dataUrl) {
  const blob = dataURLtoBlob(dataUrl);
  const path = `${userId}/${Date.now()}.jpg`;
  const { error } = await supabase.storage.from(bucket).upload(path, blob, { upsert: false });
  if (error) throw error;
  return path;
}
async function publicUrl(bucket, path) {
  if (!path) return "";
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl || "";
}

// ============================================================
//  API
// ============================================================
export const api = {
  // ---------- احراز هویت ----------
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    const prof = await api.getProfile(data.user.id);
    return { user: prof };
  },
  async signOut() { await supabase.auth.signOut(); },
  async currentUser() {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return null;
    return api.getProfile(data.session.user.id);
  },

  // ---------- پروفایل ----------
  async getProfile(id) {
    const { data } = await supabase.from("profiles").select("*").eq("id", id).single();
    if (data && data.photo) data.photo = await signedUrl("progress-photos", data.photo).catch(() => data.photo);
    return data;
  },
  async updateProfile(id, patch) {
    // اگر photo یک dataURL است، آپلود کن
    if (patch.photo && patch.photo.startsWith("data:")) {
      patch.photo = await uploadDataUrl("progress-photos", id, patch.photo);
    }
    const { data } = await supabase.from("profiles").update(patch).eq("id", id).select().single();
    return data;
  },
  async athletesOf(coachId) {
    const { data } = await supabase.from("profiles").select("*").eq("coach_id", coachId).order("full_name");
    return data || [];
  },
  // ساخت ورزشجو: از Edge Function استفاده می‌شود تا نشست مربی حفظ شود.
  // نسخهٔ سادهٔ فعلی: signUp (توجه: نشست را عوض می‌کند — در راهنما توضیح داده شده)
  async addAthlete(coachId, full_name, email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    await supabase.from("profiles").insert({
      id: data.user.id, full_name, role: "athlete", coach_id: coachId, journey_weeks: 12, current_week: 1,
    });
    return { athlete: { id: data.user.id, full_name } };
  },

  // ---------- حرکات ----------
  async exercisesOf(coachId) {
    const { data } = await supabase.from("exercises").select("*").eq("coach_id", coachId).order("created_at", { ascending: false });
    return data || [];
  },
  async addExercise(coachId, name, muscle_group, description, video_url, videoFile) {
    let video_path = null;
    if (videoFile) video_path = await uploadFile("exercise-videos", coachId, videoFile);
    const { data } = await supabase.from("exercises")
      .insert({ coach_id: coachId, name, muscle_group, description, video_url: video_url || "", video_path })
      .select().single();
    return data;
  },
  async exerciseVideoUrl(ex) {
    if (ex.video_url) return ex.video_url;
    if (ex.video_path) return signedUrl("exercise-videos", ex.video_path);
    return "";
  },

  // ---------- برنامه (هفته/روز) ----------
  async savePlan(coachId, athlete_id, week, day, title, items) {
    // حذف برنامهٔ قبلی همان روز (unique athlete/week/day)
    const { data: old } = await supabase.from("workout_plans")
      .select("id").eq("athlete_id", athlete_id).eq("week", week).eq("day", day).maybeSingle();
    if (old) await supabase.from("workout_plans").delete().eq("id", old.id);

    const { data: plan } = await supabase.from("workout_plans")
      .insert({ athlete_id, coach_id: coachId, week, day, title }).select().single();
    const rows = items.filter(it => it.exercise_id).map((it, idx) => ({
      plan_id: plan.id, exercise_id: it.exercise_id,
      sets: +it.sets || null, reps: it.reps, rest_seconds: +it.rest_seconds || null,
      weight: it.weight, order_index: idx,
    }));
    if (rows.length) await supabase.from("plan_items").insert(rows);
    return plan;
  },
  async deletePlan(planId) { await supabase.from("workout_plans").delete().eq("id", planId); },

  async _plansWithItems(athleteId) {
    const { data: plans } = await supabase.from("workout_plans")
      .select("*, plan_items(*, exercises(*))").eq("athlete_id", athleteId);
    return (plans || []).map(p => ({
      ...p,
      items: (p.plan_items || []).sort((a, b) => a.order_index - b.order_index)
        .map(i => ({ ...i, exercise: i.exercises })),
    }));
  },
  async weeksOf(athleteId) {
    const plans = await api._plansWithItems(athleteId);
    const weeks = {};
    plans.forEach(p => { (weeks[p.week] = weeks[p.week] || []).push(p); });
    Object.values(weeks).forEach(arr => arr.sort((a, b) => a.day - b.day));
    return weeks;
  },
  async getPlan(athleteId, week, day) {
    const plans = await api._plansWithItems(athleteId);
    return plans.find(p => p.week === week && p.day === day) || null;
  },
  async plansListOf(athleteId) {
    const { data } = await supabase.from("workout_plans")
      .select("id, week, day, title").eq("athlete_id", athleteId)
      .order("week").order("day");
    return data || [];
  },

  // ---------- رژیم ----------
  async addDiet(coachId, athlete_id, title, content) {
    const { data } = await supabase.from("diet_plans")
      .insert({ athlete_id, coach_id: coachId, title, content, start_date: today() }).select().single();
    return data;
  },
  async dietsOf(athleteId) {
    const { data } = await supabase.from("diet_plans").select("*").eq("athlete_id", athleteId)
      .order("created_at", { ascending: false });
    return data || [];
  },

  // ---------- گزارش ----------
  async addReport(athleteId, plan_id, completed, weight_kg, energy_level, notes) {
    const { data } = await supabase.from("daily_reports").insert({
      athlete_id: athleteId, plan_id: plan_id || null, report_date: today(),
      completed, weight_kg: weight_kg ? +weight_kg : null, energy_level: +energy_level, notes,
    }).select().single();
    return data;
  },
  async reportsOf(athleteId) {
    const { data } = await supabase.from("daily_reports")
      .select("*, workout_plans(week, day)").eq("athlete_id", athleteId)
      .order("report_date");
    return (data || []).map(r => ({ ...r, plan: r.workout_plans }));
  },
  async reportsForCoach(coachId) {
    const { data } = await supabase.from("daily_reports")
      .select("*, profiles!daily_reports_athlete_id_fkey(full_name), workout_plans(week, day)")
      .order("report_date", { ascending: false });
    return (data || []).map(r => ({ ...r, athlete: r.profiles, plan: r.workout_plans }));
  },
  async markSeen(id) { await supabase.from("daily_reports").update({ coach_seen: true }).eq("id", id); },

  // ---------- عکس پیشرفت ----------
  async addPhoto(athleteId, dataUrl, caption) {
    const path = await uploadDataUrl("progress-photos", athleteId, dataUrl);
    await supabase.from("progress_photos").insert({ athlete_id: athleteId, path, caption: caption || "" });
  },
  async photosOf(athleteId) {
    const { data } = await supabase.from("progress_photos").select("*").eq("athlete_id", athleteId)
      .order("created_at", { ascending: false });
    return Promise.all((data || []).map(async p => ({ ...p, data: await signedUrl("progress-photos", p.path), date: p.photo_date })));
  },
  async deletePhoto(id) { await supabase.from("progress_photos").delete().eq("id", id); },

  // ---------- آمار و مسیر ----------
  async statsOf(athleteId) {
    const reports = await api.reportsOf(athleteId);
    const weights = reports.filter(r => r.weight_kg).map(r => ({ date: r.report_date, w: r.weight_kg }));
    const total = reports.length, done = reports.filter(r => r.completed).length;
    const avgEnergy = total ? reports.reduce((s, r) => s + (r.energy_level || 0), 0) / total : 0;
    const firstW = weights[0]?.w ?? null, lastW = weights[weights.length - 1]?.w ?? null;
    return {
      weights, totalReports: total,
      completionRate: total ? Math.round(done / total * 100) : 0,
      avgEnergy: Math.round(avgEnergy * 10) / 10,
      weightChange: (firstW != null && lastW != null) ? Math.round((lastW - firstW) * 10) / 10 : null,
      firstW, lastW,
    };
  },
  async journeyOf(athleteId) {
    const p = await api.getProfile(athleteId);
    const weeks = await api.weeksOf(athleteId);
    const built = Object.keys(weeks).length;
    const total = p?.journey_weeks || 12;
    const s = await api.statsOf(athleteId);
    return { name: p?.journey || "عمومی", totalWeeks: total, builtWeeks: built,
      currentWeek: p?.current_week || 1, percent: Math.round(built / total * 100), completionRate: s.completionRate };
  },

  // ---------- شبکهٔ اجتماعی ----------
  async gymMatesOf(userId) {
    const me = await api.getProfile(userId);
    const coachId = me.role === "coach" ? me.id : me.coach_id;
    const { data } = await supabase.from("profiles").select("*").eq("coach_id", coachId).neq("id", userId);
    return data || [];
  },
  async isFollowing(a, b) {
    const { data } = await supabase.from("follows").select("follower").eq("follower", a).eq("followee", b).maybeSingle();
    return !!data;
  },
  async toggleFollow(a, b) {
    const on = await api.isFollowing(a, b);
    if (on) await supabase.from("follows").delete().eq("follower", a).eq("followee", b);
    else await supabase.from("follows").insert({ follower: a, followee: b });
  },
  async followCounts(id) {
    const { count: followers } = await supabase.from("follows").select("*", { count: "exact", head: true }).eq("followee", id);
    const { count: following } = await supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower", id);
    return { followers: followers || 0, following: following || 0 };
  },
  async partnerOf(id) {
    const { data } = await supabase.from("partnerships").select("*").or(`a.eq.${id},b.eq.${id}`).maybeSingle();
    if (!data) return null;
    return api.getProfile(data.a === id ? data.b : data.a);
  },
  async setPartner(a, b) {
    await supabase.from("partnerships").delete().or(`a.eq.${a},b.eq.${a},a.eq.${b},b.eq.${b}`);
    await supabase.from("partnerships").insert({ a, b });
  },
  async removePartner(id) {
    await supabase.from("partnerships").delete().or(`a.eq.${id},b.eq.${id}`);
  },
  async progressScore(id) {
    const list = await api.plansListOf(id);
    const maxWeek = Math.max(0, ...list.map(p => p.week));
    const s = await api.statsOf(id);
    return maxWeek * 1000 + s.completionRate * 10 + s.totalReports;
  },
  async effectiveWeeksOf(id) {
    const partner = await api.partnerOf(id);
    if (!partner) return { weeks: await api.weeksOf(id), partner: null, source: null };
    const [sa, sb] = [await api.progressScore(id), await api.progressScore(partner.id)];
    const srcId = sb > sa ? partner.id : id;
    return { weeks: await api.weeksOf(srcId), partner, source: await api.getProfile(srcId) };
  },

  // ---------- پست ----------
  async addPost(author_id, text, imageDataUrl) {
    let image_path = null;
    if (imageDataUrl) image_path = await uploadDataUrl("post-images", author_id, imageDataUrl);
    await supabase.from("posts").insert({ author_id, text, image_path });
  },
  async deletePost(id) { await supabase.from("posts").delete().eq("id", id); },
  async feed(userId) {
    const { data: posts } = await supabase.from("posts")
      .select("*, profiles(*), post_likes(user_id), post_comments(*)")
      .order("created_at", { ascending: false });
    return Promise.all((posts || []).map(async p => ({
      ...p,
      author: p.profiles,
      created_at: new Date(p.created_at).getTime(),
      likes: (p.post_likes || []).map(l => l.user_id),
      comments: (p.post_comments || []).map(c => ({ ...c, created_at: new Date(c.created_at).getTime() }))
        .sort((a, b) => a.created_at - b.created_at),
      image: p.image_path ? await publicUrl("post-images", p.image_path) : "",
    })));
  },
  async toggleLike(postId, userId) {
    const { data } = await supabase.from("post_likes").select("*").eq("post_id", postId).eq("user_id", userId).maybeSingle();
    if (data) await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", userId);
    else await supabase.from("post_likes").insert({ post_id: postId, user_id: userId });
  },
  async addComment(postId, userId, text) {
    await supabase.from("post_comments").insert({ post_id: postId, user_id: userId, text });
  },

  // ---------- استوری ----------
  async addStory(author_id, { image, text, bg }) {
    let image_path = null;
    if (image) image_path = await uploadDataUrl("story-images", author_id, image);
    await supabase.from("stories").insert({ author_id, image_path, text: text || "", bg: bg || "" });
  },
  async storiesGrouped(userId) {
    const { data } = await supabase.from("stories")
      .select("*, profiles(*)").gt("expires_at", new Date().toISOString())
      .order("created_at");
    const groups = {};
    for (const s of data || []) {
      s.image = s.image_path ? await publicUrl("story-images", s.image_path) : "";
      s.created_at = new Date(s.created_at).getTime();
      const aid = s.author_id;
      (groups[aid] = groups[aid] || { author: s.profiles, stories: [] }).stories.push(s);
    }
    return Object.values(groups);
  },
};
