// ============================================================
//  خروجی PDF برنامهٔ تمرینی (قالب برندشدهٔ COACHDESK)
// ============================================================
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { DAYS } from "./api.js";

function el(tag, style, html) {
  const e = document.createElement(tag);
  if (style) Object.assign(e.style, style);
  if (html != null) e.innerHTML = html;
  return e;
}

function buildTemplate({ athleteName, coachName, goal, weeks }) {
  const wrap = el("div", {
    position: "fixed", top: "0", left: "-9999px", width: "780px",
    background: "#0b0b0c", color: "#fff", fontFamily: "Vazirmatn, Tahoma, sans-serif",
    direction: "rtl", padding: "30px", boxSizing: "border-box",
  });

  wrap.appendChild(el("div", {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    borderBottom: "2px solid #2a2a2e", paddingBottom: "16px", marginBottom: "22px",
  }, `
    <div style="font-size:24px;font-weight:800;letter-spacing:.5px;">🏋️ COACHDESK</div>
    <div style="font-size:12px;color:#9a9a9a;">تاریخ صدور: ${new Date().toLocaleDateString("fa-IR")}</div>
  `));

  wrap.appendChild(el("div", {
    background: "linear-gradient(135deg,#181819,#111112)", border: "1px solid #2a2a2e",
    borderRadius: "16px", padding: "20px 22px", marginBottom: "26px",
  }, `
    <div style="font-size:21px;font-weight:800;margin-bottom:8px;">برنامهٔ تمرینی — ${athleteName}</div>
    <div style="font-size:13px;color:#b5b5b5;line-height:1.9;">
      ${coachName ? "مربی: " + coachName : ""} ${goal ? " &nbsp;·&nbsp; هدف: " + goal : ""}
    </div>
  `));

  weeks.forEach(({ week, plans }) => {
    const weekBlock = el("div", { marginBottom: "18px" });
    weekBlock.appendChild(el("div", {
      fontSize: "16px", fontWeight: "800", color: "#ff5a1f",
      margin: "0 0 12px", borderRight: "4px solid #ff5a1f", paddingRight: "10px",
    }, `هفته ${week}`));

    plans.forEach(p => {
      const dayCard = el("div", {
        background: "#151517", border: "1px solid #232326", borderRadius: "12px",
        padding: "14px 16px", marginBottom: "10px",
      });
      dayCard.appendChild(el("div", {
        display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px",
      }, `
        <span style="font-weight:700;font-size:14px;">${DAYS[p.day]}${p.title ? " — " + p.title : ""}</span>
        <span style="font-size:11px;color:#8a8a8a;">${p.items.length} حرکت</span>
      `));
      if (p.items.length === 0) {
        dayCard.appendChild(el("div", { fontSize: "12px", color: "#8a8a8a" }, "روز استراحت 🛌"));
      } else {
        const table = el("table", { width: "100%", borderCollapse: "collapse", fontSize: "12px" });
        table.innerHTML = `
          <thead><tr style="color:#8a8a8a;text-align:center;">
            <th style="padding:6px 4px;text-align:right;">حرکت</th>
            <th style="padding:6px 4px;">ست</th><th style="padding:6px 4px;">تکرار</th>
            <th style="padding:6px 4px;">استراحت</th><th style="padding:6px 4px;">وزنه</th>
          </tr></thead>
          <tbody>${p.items.map(i => `
            <tr style="border-top:1px solid #232326;">
              <td style="padding:7px 4px;text-align:right;">${i.exercise?.name || "—"}</td>
              <td style="padding:7px 4px;text-align:center;">${i.sets || "—"}</td>
              <td style="padding:7px 4px;text-align:center;">${i.reps || "—"}</td>
              <td style="padding:7px 4px;text-align:center;">${i.rest_seconds ? i.rest_seconds + "ث" : "—"}</td>
              <td style="padding:7px 4px;text-align:center;">${i.weight || "—"}</td>
            </tr>`).join("")}
          </tbody>`;
        dayCard.appendChild(table);
      }
      weekBlock.appendChild(dayCard);
    });
    wrap.appendChild(weekBlock);
  });

  if (weeks.length === 0) {
    wrap.appendChild(el("div", { fontSize: "13px", color: "#8a8a8a", padding: "20px 0" }, "هنوز برنامه‌ای ثبت نشده."));
  }

  wrap.appendChild(el("div", {
    textAlign: "center", fontSize: "11px", color: "#5a5a5a", marginTop: "24px",
    borderTop: "1px solid #2a2a2e", paddingTop: "14px",
  }, "ساخته‌شده با COACHDESK"));

  return wrap;
}

export async function exportPlanPdf({ athleteName, coachName, goal, weeks }) {
  const node = buildTemplate({ athleteName, coachName, goal, weeks });
  document.body.appendChild(node);
  await new Promise(r => setTimeout(r, 60));
  try {
    const canvas = await html2canvas(node, { scale: 2, backgroundColor: "#0b0b0c", useCORS: true });
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
