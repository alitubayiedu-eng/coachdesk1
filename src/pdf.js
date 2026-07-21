// ============================================================
//  خروجی PDF برنامهٔ تمرینی (قالب پوستری COACHDESK)
// ============================================================
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { muscleCategory, dayMuscleGroups, dayCategory, CATEGORY_EMOJI } from "./planDesign.js";

function el(tag, style, html) {
  const e = document.createElement(tag);
  if (style) Object.assign(e.style, style);
  if (html != null) e.innerHTML = html;
  return e;
}

function dayBoxHtml(p, idx) {
  const groups = dayMuscleGroups(p.items);
  const cat = dayCategory(p.items);
  const rows = p.items.length === 0
    ? `<div style="flex:1;background:#f2f0eb;color:#555;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;">روز استراحت 🛌</div>`
    : `<div style="flex:1;background:#f2f0eb;color:#111;min-width:0;">
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="border-bottom:1.5px solid #111;">
              <th style="font-size:10px;letter-spacing:1px;color:#555;padding:9px 6px;text-align:center;width:28px;">#</th>
              <th style="font-size:10px;letter-spacing:1px;color:#555;padding:9px 6px;text-align:right;">حرکت</th>
              <th style="font-size:10px;letter-spacing:1px;color:#555;padding:9px 6px;text-align:center;">ست × تکرار</th>
              <th style="font-size:10px;letter-spacing:1px;color:#555;padding:9px 6px;text-align:center;width:34px;"></th>
            </tr>
          </thead>
          <tbody>
            ${p.items.map((it, i) => `
              <tr style="border-bottom:1px solid #dedad0;">
                <td style="font-size:12.5px;padding:9px 6px;text-align:center;">${i + 1}</td>
                <td style="font-size:12.5px;padding:9px 6px;text-align:right;">
                  <b>${it.exercise?.name || "—"}</b>
                  ${it.weight ? `<div style="font-size:10.5px;color:#777;">وزنه: ${it.weight}</div>` : ""}
                </td>
                <td style="font-size:12.5px;padding:9px 6px;text-align:center;">${it.sets || "—"} × ${it.reps || "—"}</td>
                <td style="font-size:15px;padding:9px 6px;text-align:center;">${CATEGORY_EMOJI[muscleCategory(it.exercise?.muscle_group)]}</td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>`;
  return `
    <div style="display:flex;margin-bottom:14px;border-radius:14px;overflow:hidden;border:1px solid #232326;">
      <div style="background:#000;color:#fff;width:96px;flex-shrink:0;padding:14px 8px;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;">
        <div style="font-size:9.5px;letter-spacing:2px;color:#8a8a8a;font-weight:700;">DAY</div>
        <div style="font-size:24px;font-weight:800;line-height:1;">${idx + 1}</div>
        <div style="font-size:18px;margin-top:2px;">${CATEGORY_EMOJI[cat]}</div>
        <div style="font-size:9px;color:#c9c9c9;font-weight:600;line-height:1.5;">${groups.length ? groups.join(" + ") : "استراحت"}</div>
      </div>
      ${rows}
    </div>`;
}

function buildTemplate({ athleteName, coachName, goal, journeyWeeks, weeks }) {
  const wrap = el("div", {
    position: "fixed", top: "0", left: "-9999px", width: "780px",
    background: "#000", color: "#fff", fontFamily: "Vazirmatn, Tahoma, sans-serif",
    direction: "rtl", padding: "26px", boxSizing: "border-box",
  });

  wrap.appendChild(el("div", {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    borderBottom: "2px solid #232326", paddingBottom: "16px", marginBottom: "18px",
  }, `
    <div>
      <div style="font-size:26px;font-weight:700;letter-spacing:.5px;">🏋️ COACHDESK</div>
      <div style="font-size:11px;color:#8a8a8a;letter-spacing:2px;margin-top:2px;">برنامهٔ تمرینی — ${athleteName || ""}</div>
    </div>
    <div style="font-size:11px;color:#8a8a8a;text-align:left;">تاریخ صدور: ${new Date().toLocaleDateString("fa-IR")}${coachName ? "<br/>مربی: " + coachName : ""}</div>
  `));

  wrap.appendChild(el("div", { display: "flex", gap: "10px", marginBottom: "20px" }, `
    <div style="flex:1;background:#141416;border:1px solid #232326;border-radius:12px;padding:10px 12px;text-align:center;">
      <div style="font-size:14px;font-weight:700;">${goal || "—"}</div>
      <div style="font-size:10.5px;color:#8a8a8a;margin-top:2px;">هدف</div>
    </div>
    <div style="flex:1;background:#141416;border:1px solid #232326;border-radius:12px;padding:10px 12px;text-align:center;">
      <div style="font-size:14px;font-weight:700;">${weeks.length} هفته</div>
      <div style="font-size:10.5px;color:#8a8a8a;margin-top:2px;">هفته‌های برنامه‌ریزی‌شده</div>
    </div>
    <div style="flex:1;background:#141416;border:1px solid #232326;border-radius:12px;padding:10px 12px;text-align:center;">
      <div style="font-size:14px;font-weight:700;">${journeyWeeks || 12} هفته</div>
      <div style="font-size:10.5px;color:#8a8a8a;margin-top:2px;">مدت زمان کل برنامه</div>
    </div>
  `));

  weeks.forEach(({ week, plans }) => {
    const weekBlock = el("div", { marginBottom: "18px" });
    weekBlock.appendChild(el("div", {
      fontSize: "15px", fontWeight: "700", color: "#ff5a1f",
      margin: "0 0 12px", borderRight: "4px solid #ff5a1f", paddingRight: "10px",
    }, `هفته ${week}`));
    plans.forEach((p, idx) => weekBlock.appendChild(el("div", null, dayBoxHtml(p, idx))));
    wrap.appendChild(weekBlock);
  });

  if (weeks.length === 0) {
    wrap.appendChild(el("div", { fontSize: "13px", color: "#8a8a8a", padding: "20px 0" }, "هنوز برنامه‌ای ثبت نشده."));
  }

  wrap.appendChild(el("div", {
    textAlign: "center", fontSize: "11px", color: "#5a5a5a", marginTop: "20px",
    borderTop: "1px solid #232326", paddingTop: "14px",
  }, "ساخته‌شده با COACHDESK"));

  return wrap;
}

export async function exportPlanPdf({ athleteName, coachName, goal, journeyWeeks, weeks }) {
  const node = buildTemplate({ athleteName, coachName, goal, journeyWeeks, weeks });
  document.body.appendChild(node);
  await new Promise(r => setTimeout(r, 60));
  try {
    const canvas = await html2canvas(node, { scale: 2, backgroundColor: "#000000", useCORS: true });
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const margin = 8;
    const pageWidth = doc.internal.pageSize.getWidth() - margin * 2;
    const pageHeight = doc.internal.pageSize.getHeight() - margin * 2;
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const imgData = canvas.toDataURL("image/jpeg", 0.92);
    let heightLeft = imgHeight, position = 0, first = true;
    while (heightLeft > 0) {
      if (!first) doc.addPage();
      first = false;
      doc.addImage(imgData, "JPEG", margin, margin + position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      position -= pageHeight;
    }
    doc.save(`برنامه-تمرینی-${athleteName || "ورزشجو"}.pdf`);
  } finally {
    document.body.removeChild(node);
  }
}
