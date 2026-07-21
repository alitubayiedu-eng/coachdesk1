import React, { useState, useRef, useEffect } from "react";
import { api } from "./api.js";
import { useAsync } from "./useAsync.js";
import { Heart, MessageCircle, Trash2, X, Camera, UserPlus, UserCheck, Swords, Clock } from "lucide-react";

// ---------- کمکی‌ها ----------
export function timeAgo(ts) {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return "الان";
  if (m < 60) return `${m} دقیقه پیش`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ساعت پیش`;
  return `${Math.floor(h / 24)} روز پیش`;
}
function storyLeft(ts) {
  const h = Math.max(0, Math.ceil((ts + 86400000 - Date.now()) / 3600000));
  return `${h} ساعت مانده`;
}
function Av({ p, size = 40 }) {
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size / 2.4 }}>
      {p?.photo ? <img src={p.photo} alt="" /> : p?.full_name?.[0]}
    </div>
  );
}
function resize(file, maxW, cb) {
  const img = new Image(); const url = URL.createObjectURL(file);
  img.onload = () => {
    const s = Math.min(1, maxW / img.width);
    const cv = document.createElement("canvas");
    cv.width = img.width * s; cv.height = img.height * s;
    cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
    cb(cv.toDataURL("image/jpeg", 0.75)); URL.revokeObjectURL(url);
  };
  img.src = url;
}

// ---------- ردیف استوری ----------
function StoriesRow({ me, onAdd }) {
  const [groups] = useAsync(() => api.storiesGrouped(me.id), []);
  const [view, setView] = useState(null);
  return (
    <div className="card" style={{ padding: "14px 16px 6px" }}>
      <div className="stories">
        <button className="story" onClick={onAdd}>
          <div className="ring add"><div className="inner"><div>+</div></div></div>
          <span>استوری شما</span>
        </button>
        {(groups || []).map(g => (
          <button key={g.author.id} className="story" onClick={() => setView(g)}>
            <div className="ring"><div className="inner">
              {g.author.photo ? <img src={g.author.photo} alt="" /> : <div>{g.author.full_name[0]}</div>}
            </div></div>
            <span>{g.author.id === me.id ? "شما" : g.author.full_name.split(" ")[0]}</span>
          </button>
        ))}
      </div>
      <p className="small" style={{ margin: "0 0 8px" }}>استوری‌ها بعد از ۲۴ ساعت خودکار حذف می‌شوند</p>
      {view && <StoryViewer group={view} onClose={() => setView(null)} />}
    </div>
  );
}

function StoryViewer({ group, onClose }) {
  const [i, setI] = useState(0);
  const s = group.stories[i];
  const next = () => { if (i < group.stories.length - 1) setI(i + 1); else onClose(); };
  return (
    <div className="story-view" onClick={next}>
      <div className="sv-head" onClick={e => e.stopPropagation()}>
        <Av p={group.author} size={36} />
        <div style={{ flex: 1 }}>
          <b style={{ fontSize: 14 }}>{group.author.full_name}</b>
          <div style={{ fontSize: 11, opacity: .7, display: "flex", gap: 8 }}>
            <span>{timeAgo(s.created_at)}</span>·<span><Clock size={10} style={{ marginLeft: 3 }} />{storyLeft(s.created_at)}</span>
          </div>
        </div>
        <span style={{ fontSize: 12, opacity: .7 }}>{i + 1}/{group.stories.length}</span>
        <button className="icon-btn" style={{ color: "#fff" }} onClick={onClose}><X size={22} /></button>
      </div>
      <div className="sv-body" style={s.bg && !s.image ? { background: s.bg } : {}}>
        {s.image ? <img src={s.image} alt="" /> : s.text}
      </div>
      {s.image && s.text && <div style={{ color: "#fff", textAlign: "center", padding: 16 }}>{s.text}</div>}
    </div>
  );
}

function Comment({ c }) {
  const [u] = useAsync(() => api.getProfile(c.user_id), []);
  return <div className="comment"><b>{u?.full_name?.split(" ")[0] || "…"}</b><span>{c.text}</span></div>;
}

// ---------- کارت پست ----------
function PostCard({ me, post, refresh }) {
  const [cmt, setCmt] = useState("");
  const [showAll, setShowAll] = useState(false);
  const liked = post.likes.includes(me.id);
  const canFollow = me.role === "athlete" && post.author.role === "athlete" && post.author.id !== me.id;
  const [following, setFollowing] = useState(false);
  useEffect(() => { if (canFollow) api.isFollowing(me.id, post.author.id).then(setFollowing); }, []);
  const comments = showAll ? post.comments : post.comments.slice(-2);
  return (
    <div className="card post">
      <div className="p-head">
        <Av p={post.author} />
        <div style={{ flex: 1 }}>
          <b style={{ fontSize: 14 }}>{post.author.full_name}</b>
          {post.author.role === "coach" && <span className="badge orange" style={{ marginRight: 6, fontSize: 10 }}>مربی</span>}
          <div className="small">{timeAgo(post.created_at)}</div>
        </div>
        {canFollow && (
          <button className="btn-ghost" style={{ fontSize: 12 }} onClick={async () => { await api.toggleFollow(me.id, post.author.id); setFollowing(f => !f); }}>
            {following ? <><UserCheck size={14} style={{ marginLeft: 4 }} />دنبال می‌کنید</> : <><UserPlus size={14} style={{ marginLeft: 4 }} />دنبال کردن</>}
          </button>
        )}
        {post.author.id === me.id && (
          <button className="icon-btn" onClick={async () => { if (confirm("پست حذف شود؟")) { await api.deletePost(post.id); refresh(); } }}><Trash2 size={15} /></button>
        )}
      </div>
      {post.image && <img className="p-img" src={post.image} alt="" />}
      {post.text && <div className="p-body" style={{ fontSize: 14, lineHeight: 1.9 }}>{post.text}</div>}
      <div className="p-actions">
        <button className={"icon-btn" + (liked ? " liked" : "")} onClick={async () => { await api.toggleLike(post.id, me.id); refresh(); }}>
          <Heart size={19} fill={liked ? "currentColor" : "none"} /> {post.likes.length || ""}
        </button>
        <span className="icon-btn"><MessageCircle size={19} /> {post.comments.length || ""}</span>
      </div>
      <div className="p-body" style={{ paddingTop: 0 }}>
        {post.comments.length > 2 && !showAll &&
          <button className="btn-ghost" style={{ padding: "2px 0", fontSize: 12 }} onClick={() => setShowAll(true)}>مشاهده همه {post.comments.length} کامنت</button>}
        {comments.map(c => <Comment key={c.id} c={c} />)}
        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
          <input className="input" style={{ marginBottom: 0, flex: 1 }} placeholder="کامنت بگذار…" value={cmt}
            onChange={e => setCmt(e.target.value)}
            onKeyDown={async e => { if (e.key === "Enter" && cmt.trim()) { await api.addComment(post.id, me.id, cmt.trim()); setCmt(""); refresh(); } }} />
          <button className="btn btn-sm" disabled={!cmt.trim()}
            onClick={async () => { if (cmt.trim()) { await api.addComment(post.id, me.id, cmt.trim()); setCmt(""); refresh(); } }}>ارسال</button>
        </div>
      </div>
    </div>
  );
}

// ---------- فید ----------
export function FeedPage({ me, openCreate }) {
  const [posts, , refresh] = useAsync(() => api.feed(me.id), []);
  return (
    <div style={{ maxWidth: 560 }}>
      <StoriesRow me={me} onAdd={openCreate} />
      {posts && posts.length === 0 && <div className="card"><p className="muted">هنوز پستی نیست. اولین نفر باش! ✍️</p></div>}
      {(posts || []).map(p => <PostCard key={p.id} me={me} post={p} refresh={refresh} />)}
    </div>
  );
}

// ---------- هم‌باشگاهی‌ها ----------
function MateRow({ me, m, partner, refresh }) {
  const [following, setFollowing] = useState(false);
  const [score, setScore] = useState(null);
  const [myScore, setMyScore] = useState(null);
  useEffect(() => {
    api.isFollowing(me.id, m.id).then(setFollowing);
    api.progressScore(m.id).then(setScore);
    api.progressScore(me.id).then(setMyScore);
  }, []);
  const isPartner = partner?.id === m.id;
  return (
    <div className="row">
      <Av p={m} />
      <div className="grow">
        <b style={{ fontSize: 14 }}>{m.full_name}</b>
        <div className="small">
          {m.goal && m.goal + " · "}امتیاز: {score ?? "…"}
          {score != null && myScore != null && (score > myScore ? " (جلوتر)" : score < myScore ? " (عقب‌تر)" : " (هم‌سطح)")}
        </div>
      </div>
      <button className="btn-ghost" style={{ fontSize: 12 }} onClick={async () => { await api.toggleFollow(me.id, m.id); setFollowing(f => !f); }}>
        {following ? <UserCheck size={15} /> : <UserPlus size={15} />}
      </button>
      {isPartner
        ? <span className="badge orange">حریف ⚔️</span>
        : <button className="btn btn-sm" onClick={async () => {
            if (partner && !confirm(`حریف فعلی (${partner.full_name}) عوض شود؟`)) return;
            await api.setPartner(me.id, m.id); refresh();
          }}>انتخاب حریف</button>}
    </div>
  );
}

export function MatesPage({ me }) {
  const [mates, , reloadM] = useAsync(async () => (await api.gymMatesOf(me.id)).filter(m => m.role === "athlete"), []);
  const [partner, , reloadP] = useAsync(() => api.partnerOf(me.id), []);
  const [counts, , reloadC] = useAsync(() => api.followCounts(me.id), []);
  const refresh = () => { reloadM(); reloadP(); reloadC(); };
  return (
    <div style={{ maxWidth: 640 }}>
      <div className="card" style={{ display: "flex", gap: 20 }}>
        <div className="stat" style={{ flex: 1 }}><b>{counts?.followers ?? 0}</b><span>دنبال‌کننده</span></div>
        <div className="stat" style={{ flex: 1 }}><b>{counts?.following ?? 0}</b><span>دنبال‌شده</span></div>
      </div>
      {partner && (
        <div className="card" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Swords size={20} color="var(--accent)" />
          <Av p={partner} />
          <div style={{ flex: 1 }}>
            <b>حریف تمرینی: {partner.full_name}</b>
            <div className="small">برنامهٔ روزهای مشترک بر اساس نفرِ پیشرفته‌تر یکسان می‌شود</div>
          </div>
          <button className="btn btn-sm btn-red" onClick={async () => { await api.removePartner(me.id); refresh(); }}>حذف</button>
        </div>
      )}
      <div className="card">
        <h3>هم‌باشگاهی‌ها ({mates?.length || 0})</h3>
        <p className="sub">ورزشجوهای مربی شما</p>
        {(mates || []).map(m => <MateRow key={m.id} me={me} m={m} partner={partner} refresh={refresh} />)}
        {mates && mates.length === 0 && <p className="muted">هم‌باشگاهی دیگری نیست.</p>}
      </div>
    </div>
  );
}

// ---------- مودال ایجاد ----------
const BGS = [
  "linear-gradient(135deg,#f97316,#ef4444)",
  "linear-gradient(135deg,#111827,#374151)",
  "linear-gradient(135deg,#22c55e,#0ea5e9)",
  "linear-gradient(135deg,#a855f7,#ec4899)",
];

export function CreateModal({ me, onClose, onDone }) {
  const [tab, setTab] = useState("post");
  const [text, setText] = useState("");
  const [img, setImg] = useState("");
  const [bg, setBg] = useState(BGS[0]);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef();
  const submit = async () => {
    if (!text.trim() && !img) return;
    setBusy(true);
    try {
      if (tab === "post") await api.addPost(me.id, text.trim(), img);
      else await api.addStory(me.id, { image: img, text: text.trim(), bg });
      onDone(); onClose();
    } catch (e) { alert("خطا: " + e.message); setBusy(false); }
  };
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>ایجاد</h3>
          <button className="icon-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="tabs2">
          <button className={"week-chip" + (tab === "post" ? " active" : "")} onClick={() => setTab("post")}>📝 پست</button>
          <button className={"week-chip" + (tab === "story" ? " active" : "")} onClick={() => setTab("story")}>⏱ استوری (۲۴ساعته)</button>
        </div>
        <textarea className="input" style={{ height: 90 }}
          placeholder={tab === "post" ? "چه خبر از تمرین؟…" : "متن استوری…"}
          value={text} onChange={e => setText(e.target.value)} />
        {tab === "story" && !img && (
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            {BGS.map(b => (
              <button key={b} onClick={() => setBg(b)}
                style={{ width: 34, height: 34, borderRadius: 8, border: bg === b ? "3px solid var(--text)" : "1px solid var(--border)", background: b, cursor: "pointer" }} />
            ))}
          </div>
        )}
        {img && <img src={img} alt="" style={{ width: "100%", borderRadius: 10, marginBottom: 10 }} />}
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-sm btn-gray" onClick={() => fileRef.current.click()}>
            <Camera size={14} style={{ marginLeft: 5 }} />{img ? "تغییر عکس" : "افزودن عکس"}
          </button>
          <button className="btn btn-sm" onClick={submit} disabled={busy}>{busy ? "…" : (tab === "post" ? "انتشار پست" : "انتشار استوری")}</button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" hidden
          onChange={e => e.target.files[0] && resize(e.target.files[0], 600, setImg)} />
      </div>
    </div>
  );
}
