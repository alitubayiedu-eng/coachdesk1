import React, { useState, useRef } from "react";
import { api, DAYS } from "./api.js";
import { useAsync } from "./useAsync.js";
import "./styles.css";
import {
  Dumbbell, Home, Users, Calendar, Apple, BarChart3, LogOut, Bell,
  Video, Camera, ChevronRight, RotateCcw, User, ClipboardList, Trash2, Menu, X,
  Newspaper, PlusSquare, Swords
} from "lucide-react";
import { FeedPage, MatesPage, CreateModal } from "./social.jsx";

// ============================================================
//  ریشه
// ============================================================
export default function App() {
  const [me, setMe] = useState(null);
  const [ready, setReady] = useState(false);
  React.useEffect(() => { api.currentUser().then(u => { setMe(u); setReady(true); }); }, []);
  if (!ready) return <div style={{ padding: 40, color: "#fff", direction: "rtl" }}>در حال اتصال به سرور…</div>;
  if (!me) return <Login onLogin={setMe} />;
  return <Shell me={me} onLogout={async () => { await api.signOut(); setMe(null); }} />;
}

// ============================================================
//  ورود
// ============================================================
function Login({ onLogin }) {
  const [email, setEmail] = useState("coach@test.ir");
  const [pass, setPass] = useState("1234");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const go = async () => {
    setBusy(true); setMsg("");
    const { user, error } = await api.signIn(email, pass);
    setBusy(false);
    if (error) { setMsg(error); return; }
    onLogin(user);
  };
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", direction: "rtl" }}>
      <div className="card" style={{ width: 380 }}>
        <div className="logo" style={{ marginBottom: 20 }}><Dumbbell size={26} /> COACHDESK</div>
        <h3>ورود به پلتفرم</h3>
        <p className="sub">پنل ارتباط مربی و ورزشجو</p>
        <input className="input" placeholder="ایمیل" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && go()} />
        <input className="input" type="password" placeholder="رمز عبور" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === "Enter" && go()} />
        <button className="btn" style={{ width: "100%" }} onClick={go} disabled={busy}>{busy ? "…" : "ورود"}</button>
        {msg && <p style={{ color: "var(--red)", fontSize: 14 }}>{msg}</p>}
        <div className="muted" style={{ marginTop: 14, background: "var(--bg)", padding: 12, borderRadius: 10, lineHeight: 1.9 }}>
          <b>حساب‌های تستی</b> (رمز همه: 1234)<br />
          مربی: coach@test.ir<br />
          ورزشجو: ali@test.ir | sara@test.ir
        </div>
      </div>
    </div>
  );
}

// ============================================================
//  قاب اصلی: سایدبار + محتوا (مطابق وایرفریم)
// ============================================================
function Shell({ me, onLogout }) {
  const isCoach = me.role === "coach";
  const [page, setPage] = useState(isCoach ? "home" : "coach");
  const [createOpen, setCreateOpen] = useState(false);
  const [selAthlete, setSelAthlete] = useState(null); // برای صفحه پروفایل
  const [menuOpen, setMenuOpen] = useState(false);
  const go = (k) => { setPage(k); setMenuOpen(false); };

  const coachNav = [
    ["home", "خانه", Home],
    ["feed", "فید باشگاه", Newspaper],
    ["athletes", "ورزشجوها", Users],
    ["exercises", "کتابخانه حرکات", Video],
    ["plans", "برنامه تمرینی", Calendar],
    ["diets", "رژیم غذایی", Apple],
    ["reports", "گزارش‌ها", ClipboardList],
  ];
  const athleteNav = [
    ["feed", "کامیونیتی", Newspaper],
    ["coach", "کوچ", Dumbbell],
    ["mates", "هم‌باشگاهی‌ها", Users],
    ["mydiet", "تغذیه", Apple],
    ["myreport", "ثبت جلسه", ClipboardList],
    ["myprofile", "پروفایل", User],
  ];
  const nav = isCoach ? coachNav : athleteNav;
  const [unseen] = useAsync(async () => { if (!isCoach) return 0; const r = await api.reportsForCoach(me.id); return r.filter(x => !x.coach_seen).length; }, [page]);

  const goAthlete = (a) => { setSelAthlete(a.id); setPage("athlete-profile"); };

  return (
    <div className="shell" dir="rtl">
      <div className={"backdrop" + (menuOpen ? " show" : "")} onClick={() => setMenuOpen(false)} />
      <aside className={"sidebar" + (menuOpen ? " open" : "")}>
        <div className="logo" style={{ justifyContent: "space-between" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}><Dumbbell size={26} /> COACHDESK</span>
          <button className="btn-ghost hamburger" onClick={() => setMenuOpen(false)}><X size={18} /></button>
        </div>
        <nav className="nav">
          {nav.map(([k, label, Icon]) => (
            <button key={k} className={"nav-item" + (page === k ? " active" : "")} onClick={() => go(k)}>
              <Icon size={17} /> {label}
              {k === "reports" && unseen > 0 && <span className="badge orange" style={{ marginRight: "auto" }}>{unseen}</span>}
            </button>
          ))}
          <button className="nav-item" onClick={onLogout}><LogOut size={17} /> خروج</button>
        </nav>
        <div className="side-card">
          <div style={{ fontWeight: 700 }}>{me.full_name}</div>
          <div style={{ opacity: .7, marginTop: 2 }}>{isCoach ? "مربی" : "ورزشجو"} · نسخه تست محلی</div>
        </div>
      </aside>

      <main className="main">
        <div className="page-head">
          <div className="greet">
            <button className="hamburger" onClick={() => setMenuOpen(true)} aria-label="منو"><Menu size={20} /></button>
            <Avatar p={me} />
            <div>
              <h1>سلام، {me.full_name.split(" ")[0]}! 👋</h1>
              <p>{isCoach ? "امروز چه برنامه‌ای برای شاگردانت داری؟" : "آماده‌ای برای تمرین امروز؟"}</p>
            </div>
          </div>
          <button className="btn-ghost"><Bell size={19} /></button>
        </div>

        {isCoach && page === "home" && <CoachHome me={me} goAthlete={goAthlete} goPage={setPage} />}
        {isCoach && page === "athletes" && <Athletes me={me} goAthlete={goAthlete} />}
        {isCoach && page === "athlete-profile" && <AthleteProfile me={me} athleteId={selAthlete} back={() => setPage("athletes")} coachView />}
        {isCoach && page === "exercises" && <Exercises me={me} />}
        {isCoach && page === "plans" && <PlanBuilder me={me} />}
        {isCoach && page === "diets" && <Diets me={me} />}
        {isCoach && page === "reports" && <CoachReports me={me} />}

        {!isCoach && page === "coach" && <CoachTab me={me} />}
        {!isCoach && page === "mydiet" && <MyDiet me={me} />}
        {!isCoach && page === "myreport" && <MyReport me={me} />}
        {!isCoach && page === "myprofile" && <AthleteProfile me={me} athleteId={me.id} />}
        {page === "feed" && <FeedPage me={me} openCreate={() => setCreateOpen(true)} />}
        {!isCoach && page === "mates" && <MatesPage me={me} />}
      </main>

      {createOpen && <CreateModal me={me} onClose={() => setCreateOpen(false)} onDone={() => setPage("feed")} />}

      {/* نوار پایین موبایل — مانند اینستاگرام */}
      <nav className="bottombar">
        {(isCoach
          ? [["home", Home], ["athletes", Users], ["__create", PlusSquare], ["reports", ClipboardList], ["feed", Newspaper]]
          : [["feed", Newspaper], ["coach", Dumbbell], ["__create", PlusSquare], ["mates", Users], ["myprofile", User]]
        ).map(([k, Icon]) => (
          <button key={k}
            className={page === k ? "active" : ""}
            onClick={() => k === "__create" ? setCreateOpen(true) : go(k)}>
            <Icon size={24} />
          </button>
        ))}
      </nav>
    </div>
  );
}

function Avatar({ p, lg }) {
  return (
    <div className={"avatar" + (lg ? " lg" : "")}>
      {p.photo ? <img src={p.photo} alt="" /> : p.full_name?.[0]}
    </div>
  );
}

// ============================================================
//  حلقه پیشرفت دایره‌ای (مطابق وایرفریم)
// ============================================================
function Ring({ value, label, size = 170 }) {
  const r = size / 2 - 14;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size, margin: "0 auto" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--ring-bg)" strokeWidth="12" fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--ring)" strokeWidth="12" fill="none"
          strokeDasharray={c} strokeDashoffset={c - (value / 100) * c} strokeLinecap="round" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 32, fontWeight: 800 }}>{value}%</div>
        <div className="small">{label}</div>
      </div>
    </div>
  );
}

// ============================================================
//  نمودار وزن (SVG ساده)
// ============================================================
function WeightChart({ weights }) {
  if (weights.length < 2) return <p className="muted">برای نمودار حداقل دو گزارش با وزن لازم است.</p>;
  const W = 520, H = 160, P = 28;
  const vals = weights.map(x => x.w);
  const min = Math.min(...vals), max = Math.max(...vals);
  const span = (max - min) || 1;
  const px = i => P + (i * (W - 2 * P)) / (weights.length - 1);
  const py = w => H - P - ((w - min) / span) * (H - 2 * P);
  const pts = weights.map((x, i) => `${px(i)},${py(x.w)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 560 }}>
      <line x1={P} y1={H - P} x2={W - P} y2={H - P} stroke="var(--border)" />
      <polyline points={pts} fill="none" stroke="var(--ring)" strokeWidth="2.5" strokeLinejoin="round" />
      {weights.map((x, i) => (
        <g key={i}>
          <circle cx={px(i)} cy={py(x.w)} r="4" fill="var(--accent)" />
          <text x={px(i)} y={py(x.w) - 9} textAnchor="middle" fontSize="10" fill="var(--muted)">{x.w}</text>
        </g>
      ))}
      <text x={P} y={H - 8} fontSize="9" fill="var(--light)">{weights[0].date}</text>
      <text x={W - P} y={H - 8} textAnchor="end" fontSize="9" fill="var(--light)">{weights[weights.length - 1].date}</text>
    </svg>
  );
}

// ============================================================
//  مربی — خانه
// ============================================================
function CoachHome({ me, goAthlete, goPage }) {
  const [athletes] = useAsync(() => api.athletesOf(me.id), []);
  const [reports] = useAsync(() => api.reportsForCoach(me.id), []);
  const [exCount] = useAsync(async () => (await api.exercisesOf(me.id)).length, []);
  const unseen = (reports || []).filter(r => !r.coach_seen);
  return (
    <div>
      <div className="grid g3" style={{ marginBottom: 20 }}>
        <div className="stat"><b>{athletes?.length ?? "…"}</b><span>ورزشجو</span></div>
        <div className="stat"><b>{exCount ?? "…"}</b><span>حرکت در کتابخانه</span></div>
        <div className="stat"><b style={{ color: unseen.length ? "var(--accent)" : "inherit" }}>{unseen.length}</b><span>گزارش دیده‌نشده</span></div>
      </div>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3>آخرین گزارش‌ها</h3>
          <button className="btn-ghost" onClick={() => goPage("reports")}>مشاهده همه ←</button>
        </div>
        {(reports || []).slice(0, 4).map(r => <ReportRow key={r.id} r={r} />)}
        {reports && reports.length === 0 && <p className="muted">گزارشی ثبت نشده.</p>}
      </div>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3>ورزشجوها</h3>
          <button className="btn-ghost" onClick={() => goPage("athletes")}>مشاهده همه ←</button>
        </div>
        <div className="grid g3">
          {(athletes || []).slice(0, 3).map(a => <AthleteCard key={a.id} a={a} onClick={() => goAthlete(a)} />)}
        </div>
      </div>
    </div>
  );
}

function AthleteCard({ a, onClick }) {
  const [s] = useAsync(() => api.statsOf(a.id), []);
  return (
    <div className="card athlete-card" style={{ marginBottom: 0 }} onClick={onClick}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
        <Avatar p={a} />
        <div>
          <b>{a.full_name}</b>
          <div className="small">{a.goal || "بدون هدف ثبت‌شده"}</div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }} className="muted">
        <span>انجام تمرین: {s?.completionRate ?? 0}%</span>
        <span>{s?.lastW ? s.lastW + "kg" : "—"}</span>
      </div>
      <div style={{ background: "var(--ring-bg)", height: 6, borderRadius: 4, marginTop: 8 }}>
        <div style={{ width: (s?.completionRate || 0) + "%", height: 6, borderRadius: 4, background: "var(--ring)" }} />
      </div>
    </div>
  );
}

// ============================================================
//  مربی — لیست ورزشجوها + افزودن
// ============================================================
function Athletes({ me, goAthlete }) {
  const [list, , reload] = useAsync(() => api.athletesOf(me.id), []);
  const [f, setF] = useState({ name: "", email: "", pass: "" });
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const add = async () => {
    if (!f.name || !f.email || !f.pass) { setMsg("همه فیلدها لازم است"); return; }
    setBusy(true); setMsg("در حال ساخت…");
    const { error } = await api.addAthlete(me.id, f.name, f.email, f.pass);
    setBusy(false);
    if (error) { setMsg("خطا: " + error); return; }
    setF({ name: "", email: "", pass: "" }); setMsg("✅ اضافه شد"); reload();
  };
  return (
    <div className="grid g13">
      <div className="card" style={{ alignSelf: "start" }}>
        <h3>افزودن ورزشجو</h3>
        <p className="sub">حساب و رمز را شما می‌سازید</p>
        <input className="input" placeholder="نام کامل" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
        <input className="input" placeholder="ایمیل" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} />
        <input className="input" placeholder="رمز عبور" value={f.pass} onChange={e => setF({ ...f, pass: e.target.value })} />
        <button className="btn" onClick={add} disabled={busy}>ساخت حساب</button>
        {msg && <p className="muted">{msg}</p>}
      </div>
      <div>
        <div className="grid g2">
          {(list || []).map(a => <AthleteCard key={a.id} a={a} onClick={() => goAthlete(a)} />)}
          {list && list.length === 0 && <p className="muted">هنوز ورزشجویی اضافه نشده.</p>}
        </div>
      </div>
    </div>
  );
}

// ============================================================
//  پروفایل ورزشجو (تحلیل پیشرفت + مشخصات + عکس‌ها)
//  هم مربی می‌بیند، هم خود ورزشجو
// ============================================================
function AthleteProfile({ me, athleteId, back, coachView }) {
  const [a, , reloadA] = useAsync(() => api.getProfile(athleteId), [athleteId]);
  const [s, , reloadS] = useAsync(() => api.statsOf(athleteId), [athleteId]);
  const [photos, , reloadP] = useAsync(() => api.photosOf(athleteId), [athleteId]);
  const [reports] = useAsync(async () => (await api.reportsOf(athleteId)).slice(-6).reverse(), [athleteId]);
  const [edit, setEdit] = useState(false);
  const fileRef = useRef(), avatarRef = useRef();
  const refresh = () => { reloadA(); reloadS(); reloadP(); };
  if (!a) return <div className="card">در حال بارگذاری…</div>;
  const age = a.birth_year ? (1405 - a.birth_year) : null;

  const upload = (file, cb) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, 700 / img.width);
      const cv = document.createElement("canvas");
      cv.width = img.width * scale; cv.height = img.height * scale;
      cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
      cb(cv.toDataURL("image/jpeg", 0.8)); URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <div>
      {back && <button className="btn-ghost" onClick={back} style={{ marginBottom: 12 }}>← بازگشت به لیست</button>}
      <div className="card" style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative" }}>
          <Avatar p={a} lg />
          <button className="btn-ghost" style={{ position: "absolute", bottom: -6, left: -6, background: "var(--card2)", border: "1px solid var(--border)", borderRadius: "50%", padding: 6 }}
            onClick={() => avatarRef.current.click()}><Camera size={14} /></button>
          <input ref={avatarRef} type="file" accept="image/*" hidden
            onChange={e => e.target.files[0] && upload(e.target.files[0], async d => { await api.updateProfile(a.id, { photo: d }); refresh(); })} />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0 }}>{a.full_name}</h2>
          <div className="muted" style={{ marginTop: 4 }}>
            {a.goal && <span className="badge orange" style={{ marginLeft: 8 }}>{a.goal}</span>}
            {age && <span style={{ marginLeft: 12 }}>سن: {age}</span>}
            {a.height_cm && <span style={{ marginLeft: 12 }}>قد: {a.height_cm}cm</span>}
            {s?.lastW && <span>وزن فعلی: {s.lastW}kg</span>}
          </div>
        </div>
        <button className="btn btn-sm" onClick={() => setEdit(!edit)}>{edit ? "بستن" : "ویرایش مشخصات"}</button>
      </div>

      {edit && <EditProfile a={a} onSave={() => { setEdit(false); refresh(); }} />}

      <div className="grid g13">
        <div className="card" style={{ textAlign: "center" }}>
          <h3>پایبندی به تمرین</h3>
          <p className="sub">درصد تمرین‌های کامل‌شده</p>
          <Ring value={s?.completionRate || 0} label={`${s?.totalReports || 0} گزارش`} />
          <div className="grid g2" style={{ marginTop: 16 }}>
            <div className="stat"><b>{s?.avgEnergy || "—"}</b><span>میانگین انرژی /۵</span></div>
            <div className="stat">
              <b style={{ color: s?.weightChange > 0 ? "var(--green)" : s?.weightChange < 0 ? "var(--accent)" : "inherit" }}>
                {s?.weightChange != null ? (s.weightChange > 0 ? "+" : "") + s.weightChange + "kg" : "—"}
              </b><span>تغییر وزن</span>
            </div>
          </div>
        </div>
        <div className="card">
          <h3>روند وزن</h3><p className="sub">بر اساس گزارش‌های روزانه</p>
          <WeightChart weights={s?.weights} />
        </div>
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div><h3>عکس‌های پیشرفت</h3><p className="sub" style={{ margin: 0 }}>{photos?.length || 0} عکس</p></div>
          <button className="btn btn-sm" onClick={() => fileRef.current.click()}><Camera size={14} style={{ marginLeft: 6 }} /> افزودن عکس</button>
          <input ref={fileRef} type="file" accept="image/*" hidden
            onChange={e => e.target.files[0] && upload(e.target.files[0], async d => { await api.addPhoto(athleteId, d, prompt("توضیح عکس (اختیاری):") || ""); refresh(); })} />
        </div>
        {(!photos || photos.length === 0) ? <p className="muted">هنوز عکسی ثبت نشده.</p> : (
          <div className="photo-grid">
            {photos.map(p => (
              <div key={p.id} className="ph">
                <img src={p.data} alt="" />
                <div className="cap">{p.date} {p.caption && "· " + p.caption}
                  <button className="btn-ghost" style={{ padding: 2, float: "left" }} onClick={async () => { if (confirm("حذف شود؟")) { await api.deletePhoto(p.id); refresh(); } }}><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid g2">
        <div className="card">
          <h3>آخرین گزارش‌ها</h3>
          {(!reports || reports.length === 0) && <p className="muted">گزارشی نیست.</p>}
          {(reports || []).map(r => (
            <div key={r.id} className="row">
              <span className={"badge " + (r.completed ? "green" : "gray")}>{r.completed ? "✓" : "✗"}</span>
              <div className="grow">
                <div style={{ fontSize: 14 }}>{r.report_date} {r.plan && <span className="small">· هفته {r.plan.week} — {DAYS[r.plan.day]}</span>}</div>
                {r.notes && <div className="small">{r.notes}</div>}
              </div>
              {r.weight_kg && <span className="muted">{r.weight_kg}kg</span>}
            </div>
          ))}
        </div>
        <div className="card">
          <h3>یادداشت‌ها</h3>
          {coachView ? <NotesEditor a={a} onSave={refresh} />
            : <p style={{ whiteSpace: "pre-wrap" }}>{a.notes || <span className="muted">یادداشتی ثبت نشده.</span>}</p>}
        </div>
      </div>
    </div>
  );
}

function EditProfile({ a, onSave }) {
  const [f, setF] = useState({ full_name: a.full_name, phone: a.phone || "", birth_year: a.birth_year || "", height_cm: a.height_cm || "", goal: a.goal || "" });
  return (
    <div className="card">
      <h3>ویرایش مشخصات</h3>
      <div className="grid g2">
        <div><label className="lbl">نام کامل</label><input className="input" value={f.full_name} onChange={e => setF({ ...f, full_name: e.target.value })} /></div>
        <div><label className="lbl">تلفن</label><input className="input" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} /></div>
        <div><label className="lbl">سال تولد (شمسی)</label><input className="input" value={f.birth_year} onChange={e => setF({ ...f, birth_year: e.target.value })} /></div>
        <div><label className="lbl">قد (cm)</label><input className="input" value={f.height_cm} onChange={e => setF({ ...f, height_cm: e.target.value })} /></div>
      </div>
      <label className="lbl">هدف</label>
      <input className="input" placeholder="مثلا افزایش حجم" value={f.goal} onChange={e => setF({ ...f, goal: e.target.value })} />
      <button className="btn" onClick={async () => { await api.updateProfile(a.id, { ...f, birth_year: +f.birth_year || null, height_cm: +f.height_cm || null }); onSave(); }}>ذخیره</button>
    </div>
  );
}

function NotesEditor({ a, onSave }) {
  const [v, setV] = useState(a.notes || "");
  return (
    <div>
      <textarea className="input" style={{ height: 120 }} value={v} onChange={e => setV(e.target.value)} placeholder="مثلا: سابقه آسیب…" />
      <button className="btn btn-sm" onClick={async () => { await api.updateProfile(a.id, { notes: v }); onSave(); }}>ذخیره یادداشت</button>
    </div>
  );
}

function Exercises({ me }) {
  const [list, , reload] = useAsync(() => api.exercisesOf(me.id), []);
  const [f, setF] = useState({ name: "", muscle_group: "", description: "", video_url: "" });
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const add = async () => {
    if (!f.name) { setMsg("نام حرکت لازم است"); return; }
    setBusy(true); setMsg("در حال ذخیره…");
    try {
      await api.addExercise(me.id, f.name, f.muscle_group, f.description, f.video_url, file);
      setF({ name: "", muscle_group: "", description: "", video_url: "" }); setFile(null); setMsg("✅ ذخیره شد"); reload();
    } catch (e) { setMsg("خطا: " + e.message); }
    setBusy(false);
  };
  return (
    <div className="grid g13">
      <div className="card" style={{ alignSelf: "start" }}>
        <h3>افزودن حرکت</h3>
        <input className="input" placeholder="نام حرکت" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
        <input className="input" placeholder="گروه عضلانی" value={f.muscle_group} onChange={e => setF({ ...f, muscle_group: e.target.value })} />
        <textarea className="input" style={{ height: 60 }} placeholder="توضیحات" value={f.description} onChange={e => setF({ ...f, description: e.target.value })} />
        <input className="input" placeholder="لینک ویدیو (یا فایل زیر)" value={f.video_url} onChange={e => setF({ ...f, video_url: e.target.value })} />
        <input className="input" type="file" accept="video/*" onChange={e => setFile(e.target.files[0])} />
        <button className="btn" onClick={add} disabled={busy}>ذخیره</button>
        {msg && <p className="muted">{msg}</p>}
      </div>
      <div className="card">
        <h3>حرکات ({list?.length || 0})</h3>
        {(list || []).map(ex => <ExerciseRow key={ex.id} ex={ex} />)}
      </div>
    </div>
  );
}

function ExerciseRow({ ex }) {
  const [url, setUrl] = useState("");
  const show = async () => setUrl(await api.exerciseVideoUrl(ex));
  return (
    <div className="row" style={{ flexWrap: "wrap" }}>
      <span className="badge">{ex.muscle_group || "عمومی"}</span>
      <div className="grow">
        <b>{ex.name}</b>
        {ex.description && <div className="small">{ex.description}</div>}
      </div>
      {(ex.video_url || ex.video_path) && !url && <button className="btn-ghost" onClick={show}><Video size={16} /></button>}
      {url && (url.includes("supabase")
        ? <video src={url} controls style={{ width: "100%", maxWidth: 320, borderRadius: 10, marginTop: 8 }} />
        : <a href={url} target="_blank" rel="noreferrer" className="btn btn-sm">باز کردن</a>)}
    </div>
  );
}

function PlanBuilder({ me }) {
  const [athletes] = useAsync(() => api.athletesOf(me.id), []);
  const [exercises] = useAsync(() => api.exercisesOf(me.id), []);
  const [athleteId, setAthleteId] = useState("");
  const [week, setWeek] = useState(1);
  const [day, setDay] = useState(0);
  const [planList, , reloadList] = useAsync(() => athleteId ? api.plansListOf(athleteId) : Promise.resolve([]), [athleteId]);
  const [existing, , reloadExisting] = useAsync(() => athleteId ? api.getPlan(athleteId, week, day) : Promise.resolve(null), [athleteId, week, day]);
  const [title, setTitle] = useState("");
  const [items, setItems] = useState([{ exercise_id: "", sets: "", reps: "", rest_seconds: "", weight: "" }]);
  const [msg, setMsg] = useState("");

  React.useEffect(() => { if (athletes && athletes.length && !athleteId) setAthleteId(athletes[0].id); }, [athletes]);
  React.useEffect(() => {
    if (existing) {
      setTitle(existing.title || "");
      setItems(existing.items.map(i => ({ exercise_id: i.exercise_id, sets: i.sets || "", reps: i.reps || "", rest_seconds: i.rest_seconds || "", weight: i.weight || "" })));
    } else { setTitle(""); setItems([{ exercise_id: "", sets: "", reps: "", rest_seconds: "", weight: "" }]); }
    setMsg("");
  }, [existing]);

  const maxWeek = Math.max(4, ...(planList || []).map(p => p.week), 1) + 1;
  const setItem = (i, k, v) => setItems(items.map((it, idx) => idx === i ? { ...it, [k]: v } : it));
  const hasPlan = (w, d) => (planList || []).some(p => p.week === w && p.day === d);
  const save = async () => {
    if (!athleteId) { setMsg("ورزشجو را انتخاب کن"); return; }
    setMsg("در حال ذخیره…");
    await api.savePlan(me.id, athleteId, week, day, title, items);
    setMsg(`✅ برنامه هفته ${week} — ${DAYS[day]} ذخیره شد`); reloadList(); reloadExisting();
  };

  return (
    <div>
      <div className="card">
        <h3>برنامه تمرینی</h3><p className="sub">بر اساس هفته و روز</p>
        <label className="lbl">ورزشجو</label>
        <select className="input" value={athleteId} onChange={e => setAthleteId(e.target.value)}>
          <option value="">— انتخاب —</option>
          {(athletes || []).map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
        </select>
        <label className="lbl">هفته</label>
        <div className="chips">
          {Array.from({ length: maxWeek }, (_, i) => i + 1).map(w => (
            <button key={w} className={"week-chip" + (week === w ? " active" : "")} onClick={() => setWeek(w)}>هفته {w}</button>
          ))}
        </div>
        <label className="lbl">روز هفته</label>
        <div className="chips">
          {DAYS.map((d, i) => (
            <button key={i} className={"day-tab" + (day === i ? " active" : "") + (hasPlan(week, i) ? " has" : "")} onClick={() => setDay(i)}>
              {d}{hasPlan(week, i) && " ●"}
            </button>
          ))}
        </div>
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, marginTop: 6 }}>
          <b>هفته {week} — {DAYS[day]}</b> {existing && <span className="badge orange" style={{ marginRight: 8 }}>ویرایش</span>}
          <input className="input" style={{ marginTop: 10 }} placeholder="عنوان" value={title} onChange={e => setTitle(e.target.value)} />
          {items.map((it, i) => (
            <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
              <select className="input" style={{ flex: 2, marginBottom: 0, minWidth: 130 }} value={it.exercise_id} onChange={e => setItem(i, "exercise_id", e.target.value)}>
                <option value="">حرکت</option>
                {(exercises || []).map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
              </select>
              <input className="input" style={{ width: 62, marginBottom: 0 }} placeholder="ست" value={it.sets} onChange={e => setItem(i, "sets", e.target.value)} />
              <input className="input" style={{ width: 72, marginBottom: 0 }} placeholder="تکرار" value={it.reps} onChange={e => setItem(i, "reps", e.target.value)} />
              <input className="input" style={{ width: 88, marginBottom: 0 }} placeholder="استراحت" value={it.rest_seconds} onChange={e => setItem(i, "rest_seconds", e.target.value)} />
              <input className="input" style={{ width: 72, marginBottom: 0 }} placeholder="وزنه" value={it.weight} onChange={e => setItem(i, "weight", e.target.value)} />
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button className="btn btn-sm btn-gray" onClick={() => setItems([...items, { exercise_id: "", sets: "", reps: "", rest_seconds: "", weight: "" }])}>+ حرکت</button>
            <button className="btn btn-sm" onClick={save}>ذخیره برنامه</button>
            {existing && <button className="btn btn-sm btn-red" onClick={async () => { if (confirm("حذف شود؟")) { await api.deletePlan(existing.id); reloadList(); reloadExisting(); } }}>حذف</button>}
          </div>
          {msg && <p className="muted">{msg}</p>}
        </div>
      </div>
      {athleteId && <WeeksOverview athleteId={athleteId} key={athleteId + (planList?.length || 0)} />}
    </div>
  );
}

function WeeksOverview({ athleteId }) {
  const [weeks] = useAsync(() => api.weeksOf(athleteId), [athleteId]);
  const keys = Object.keys(weeks || {}).sort((a, b) => a - b);
  if (!weeks || keys.length === 0) return null;
  return (
    <div className="card">
      <h3>نمای کلی برنامه</h3>
      {keys.map(w => (
        <div key={w} style={{ marginBottom: 14 }}>
          <b>هفته {w}</b>
          {weeks[w].map(p => (
            <div key={p.id} className="row" style={{ marginTop: 8 }}>
              <span className="badge">{DAYS[p.day]}</span>
              <div className="grow">
                <b style={{ fontSize: 14 }}>{p.title || "—"}</b>
                <div className="small">{p.items.map(i => i.exercise?.name).filter(Boolean).join("، ") || "بدون حرکت"}</div>
              </div>
              <span className="muted">{p.items.length} حرکت</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function Diets({ me }) {
  const [athletes] = useAsync(() => api.athletesOf(me.id), []);
  const [athleteId, setAthleteId] = useState("");
  const [title, setTitle] = useState(""); const [content, setContent] = useState("");
  const [msg, setMsg] = useState("");
  const [diets, , reload] = useAsync(() => athleteId ? api.dietsOf(athleteId) : Promise.resolve([]), [athleteId]);
  React.useEffect(() => { if (athletes && athletes.length && !athleteId) setAthleteId(athletes[0].id); }, [athletes]);
  const save = async () => {
    if (!athleteId) return;
    await api.addDiet(me.id, athleteId, title, content);
    setMsg("✅ ذخیره شد"); setTitle(""); setContent(""); reload();
  };
  return (
    <div className="grid g2">
      <div className="card" style={{ alignSelf: "start" }}>
        <h3>تنظیم رژیم غذایی</h3>
        <select className="input" value={athleteId} onChange={e => setAthleteId(e.target.value)}>
          <option value="">— انتخاب —</option>
          {(athletes || []).map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
        </select>
        <input className="input" placeholder="عنوان رژیم" value={title} onChange={e => setTitle(e.target.value)} />
        <textarea className="input" style={{ height: 160 }} placeholder="وعده‌ها…" value={content} onChange={e => setContent(e.target.value)} />
        <button className="btn" onClick={save}>ذخیره رژیم</button>
        {msg && <p className="muted">{msg}</p>}
      </div>
      <div className="card">
        <h3>رژیم‌های این ورزشجو</h3>
        {(!diets || diets.length === 0) && <p className="muted">رژیمی ثبت نشده.</p>}
        {(diets || []).map(d => (
          <div key={d.id} className="row" style={{ alignItems: "flex-start" }}>
            <div className="grow">
              <b>{d.title}</b> <span className="small">از {d.start_date}</span>
              <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: 13, margin: "6px 0 0", color: "var(--muted)" }}>{d.content}</pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportRow({ r, onSeen }) {
  return (
    <div className={"row" + (!r.coach_seen ? " unseen" : "")}>
      <span className={"badge " + (r.completed ? "green" : "gray")}>{r.completed ? "✓ انجام شد" : "✗ ناقص"}</span>
      <div className="grow">
        <b style={{ fontSize: 14 }}>{r.athlete?.full_name}</b>
        <span className="small" style={{ marginRight: 8 }}>{r.report_date}{r.plan && ` · هفته ${r.plan.week} — ${DAYS[r.plan.day]}`}</span>
        {r.notes && <div className="small">{r.notes}</div>}
      </div>
      {r.weight_kg && <span className="muted">{r.weight_kg}kg</span>}
      {r.energy_level && <span className="muted">⚡{r.energy_level}/5</span>}
      {!r.coach_seen && onSeen && <button className="btn btn-sm" onClick={() => onSeen(r.id)}>دیدم</button>}
    </div>
  );
}

function CoachReports({ me }) {
  const [reports, , reload] = useAsync(() => api.reportsForCoach(me.id), []);
  const seen = async id => { await api.markSeen(id); reload(); };
  return (
    <div className="card">
      <h3>گزارش‌های روزانه</h3><p className="sub">زردها هنوز دیده نشده‌اند</p>
      {(!reports || reports.length === 0) && <p className="muted">گزارشی ثبت نشده.</p>}
      {(reports || []).map(r => <ReportRow key={r.id} r={r} onSeen={seen} />)}
    </div>
  );
}

function CoachTab({ me }) {
  const [data] = useAsync(() => api.effectiveWeeksOf(me.id), []);
  const [jr] = useAsync(() => api.journeyOf(me.id), []);
  const [week, setWeek] = useState(null);
  const [openSession, setOpenSession] = useState(null);
  const weeks = data?.weeks || {};
  const keys = Object.keys(weeks).map(Number).sort((a, b) => a - b);
  React.useEffect(() => { if (keys.length && week == null) setWeek(keys[0]); }, [data]);
  const plans = weeks[week] || [];

  return (
    <div style={{ maxWidth: 640 }}>
      {jr && (
        <div className="card journey">
          <div className="jr-label">مسیر تمرینی شما</div>
          <div className="jr-title">{jr.name}</div>
          <div className="jr-sub">{jr.totalWeeks} هفته · {jr.percent}٪ ساخته‌شده · پایبندی {jr.completionRate}٪</div>
          <div className="jr-bar"><div style={{ width: jr.percent + "%" }} /></div>
          <div className="small">هفته {jr.currentWeek} از {jr.totalWeeks}</div>
        </div>
      )}
      {data?.partner && (
        <div className="card" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Swords size={20} color="var(--accent)" />
          <div>
            <b>برنامه مشترک با {data.partner.full_name} ⚔️</b>
            <div className="small">بر اساس برنامهٔ {data.source.id === me.id ? "شما (پیشرفته‌تر)" : data.source.full_name + " (پیشرفته‌تر)"}</div>
          </div>
        </div>
      )}
      <div className="chips">
        {keys.map(w => <button key={w} className={"week-chip" + (week === w ? " active" : "")} onClick={() => setWeek(w)}>هفته {w}</button>)}
      </div>
      {keys.length === 0 && <div className="card"><p className="muted">هنوز جلسه‌ای برایت ساخته نشده.</p></div>}
      {plans.map((p, idx) => (
        <div key={p.id} className="session" onClick={() => setOpenSession(openSession === p.id ? null : p.id)}>
          <div className="s-head">
            <div>
              <div className="num">جلسه {idx + 1} · {DAYS[p.day]}</div>
              <div className="s-title">{p.title || "تمرین"}</div>
              <div className="small" style={{ marginTop: 6 }}>{p.items.length} حرکت · حدود {Math.max(15, p.items.length * 8)} دقیقه</div>
            </div>
            <span className="badge">{p.items.length ? "شروع" : "استراحت"}</span>
          </div>
          {openSession === p.id && (
            <div style={{ marginTop: 14, borderTop: "1px solid var(--border)", paddingTop: 14 }}>
              {p.items.map(it => <SessionItem key={it.id} it={it} />)}
              {p.items.length === 0 && <p className="muted">روز استراحت 🛌</p>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function SessionItem({ it }) {
  const [url, setUrl] = useState("");
  return (
    <div className="row">
      <div className="grow">
        <b>{it.exercise?.name}</b>
        <div className="small">
          {it.sets && `${it.sets} ست`} {it.reps && `× ${it.reps}`}{it.weight && ` · ${it.weight}`} {it.rest_seconds && ` · استراحت ${it.rest_seconds}ث`}
        </div>
      </div>
      {(it.exercise?.video_url || it.exercise?.video_path) && !url &&
        <button className="btn btn-sm" onClick={async (e) => { e.stopPropagation(); setUrl(await api.exerciseVideoUrl(it.exercise)); }}>
          <Video size={13} style={{ marginLeft: 5 }} />ویدیو
        </button>}
      {url && (url.includes("supabase")
        ? <video src={url} controls style={{ width: "100%", maxWidth: 300, borderRadius: 10 }} onClick={e => e.stopPropagation()} />
        : <a className="btn btn-sm" href={url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>باز کردن</a>)}
    </div>
  );
}

function MyDiet({ me }) {
  const [diets] = useAsync(() => api.dietsOf(me.id), []);
  return (
    <div>
      {(!diets || diets.length === 0) && <div className="card"><p className="muted">رژیمی تنظیم نشده.</p></div>}
      {(diets || []).map(d => (
        <div key={d.id} className="card">
          <h3>{d.title}</h3><p className="sub">از {d.start_date}</p>
          <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", margin: 0, lineHeight: 2 }}>{d.content}</pre>
        </div>
      ))}
    </div>
  );
}

function MyReport({ me }) {
  const [plans] = useAsync(() => api.plansListOf(me.id), []);
  const [planId, setPlanId] = useState("");
  const [completed, setCompleted] = useState(true);
  const [weight, setWeight] = useState(""); const [energy, setEnergy] = useState(3); const [notes, setNotes] = useState("");
  const [msg, setMsg] = useState("");
  const submit = async () => {
    setMsg("در حال ثبت…");
    await api.addReport(me.id, planId, completed, weight, energy, notes);
    setMsg("✅ گزارش ثبت شد و مربی می‌بیند"); setNotes(""); setWeight("");
  };
  return (
    <div className="card" style={{ maxWidth: 560 }}>
      <h3>گزارش امروز</h3><p className="sub">بعد از هر جلسه پر کن</p>
      <label className="lbl">جلسه مربوطه</label>
      <select className="input" value={planId} onChange={e => setPlanId(e.target.value)}>
        <option value="">— اختیاری —</option>
        {(plans || []).map(p => <option key={p.id} value={p.id}>هفته {p.week} — {DAYS[p.day]} ({p.title})</option>)}
      </select>
      <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <input type="checkbox" checked={completed} onChange={e => setCompleted(e.target.checked)} /> تمرین را کامل انجام دادم
      </label>
      <label className="lbl">وزن امروز (kg)</label>
      <input className="input" value={weight} onChange={e => setWeight(e.target.value)} />
      <label className="lbl">سطح انرژی: {energy}/5</label>
      <input className="input" type="range" min="1" max="5" value={energy} onChange={e => setEnergy(e.target.value)} />
      <textarea className="input" style={{ height: 90 }} placeholder="توضیحات…" value={notes} onChange={e => setNotes(e.target.value)} />
      <button className="btn" onClick={submit}>ثبت گزارش</button>
      {msg && <p className="muted">{msg}</p>}
    </div>
  );
}
