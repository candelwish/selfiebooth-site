// Generate La Joya ISD framework-compliant lesson decks from portal teach data.
// Usage: node gen_decks.js lessons.json outdir [onlyKey]
const fs = require("fs");
const pptxgen = require("pptxgenjs");

const lessons = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const OUT = process.argv[3];
const ONLY = process.argv[4] || null;

// ---- palette (portal brand) ----
const VIOLET = "6D28D9", PINK = "EC4899", INK = "16121F", MUTED = "6B6480",
      LIGHT = "F3E8FF", GOLD = "F0B429", GREEN = "10B981", WHITE = "FFFFFF",
      PALE = "FAF7FF", REDC = "C9132B";

const COMPONENTS = ["ACTIVATE", "I DO", "WE DO", "YOU DO", "DOL", "CLOSE"];
const COMPONENT_FULL = {
  "ACTIVATE": "ACTIVATING LEARNING", "I DO": "EXPLICIT INSTRUCTION",
  "WE DO": "INTERACTIVE PRACTICE", "YOU DO": "INDEPENDENT PRACTICE",
  "DOL": "DEMONSTRATION OF LEARNING", "CLOSE": "CLOSURE"
};
const COMPONENT_COLOR = {
  "ACTIVATE": "F59E0B", "I DO": VIOLET, "WE DO": "2563EB",
  "YOU DO": "0D9488", "DOL": REDC, "CLOSE": GREEN
};

function strip(s) {
  return String(s == null ? "" : s).replace(/<[^>]+>/g, "").replace(/&amp;/g, "&")
    .replace(/&mdash;/g, "-").replace(/&rarr;/g, "->").replace(/\s+/g, " ").trim();
}
function trimW(str, n) {
  str = strip(str);
  if (str.length <= n) return str;
  const cut = str.slice(0, n);
  const i = cut.lastIndexOf(" ");
  return (i > n * 0.6 ? cut.slice(0, i) : cut) + "...";
}
function todayIWill(objectives) {
  let s = strip(objectives).replace(/^Students will\s+/i, "").replace(/\btheir\b/gi, "my");
  s = s.charAt(0).toLowerCase() + s.slice(1);
  if (s.length > 110) { // trim to first clause boundary past 60 chars
    const cut = s.slice(0, 110);
    const idx = Math.max(cut.lastIndexOf(", "), cut.lastIndexOf(" and "));
    s = (idx > 60 ? s.slice(0, idx) : cut).trim() + ".";
  }
  return "TODAY I WILL: " + s.replace(/\.\.$/, ".").replace(/([^.])$/, "$1.");
}

function chrome(slide, comp, tiw) {
  // component chip - top left
  slide.addText(COMPONENT_FULL[comp], {
    x: 0.25, y: 0.14, w: 3.4, h: 0.34, fontFace: "Arial", fontSize: 11, bold: true,
    color: WHITE, fill: { color: COMPONENT_COLOR[comp] }, align: "center", valign: "middle", margin: 0
  });
  // objective - top right
  slide.addText(tiw, {
    x: 3.85, y: 0.10, w: 6.1, h: 0.44, fontFace: "Calibri", fontSize: 9.5, italic: true,
    color: MUTED, align: "right", valign: "middle", margin: 0
  });
  // progress indicator - bottom
  const runs = [];
  COMPONENTS.forEach((c, i) => {
    runs.push({ text: c, options: {
      bold: c === comp, color: c === comp ? COMPONENT_COLOR[comp] : "B9B3C6",
      fontSize: c === comp ? 11 : 9.5
    }});
    if (i < COMPONENTS.length - 1) runs.push({ text: "  →  ", options: { color: "D8D2E4", fontSize: 9.5 } });
  });
  slide.addText(runs, { x: 0.25, y: 5.28, w: 9.5, h: 0.3, align: "center", fontFace: "Arial", margin: 0 });
}

function titleBar(slide, txt, color) {
  slide.addText(strip(txt), {
    x: 0.45, y: 0.62, w: 9.1, h: 0.62, fontFace: "Cambria", fontSize: 26, bold: true,
    color: color || INK, margin: 0, valign: "middle"
  });
}

function notes(slide, arr) {
  slide.addNotes(arr.filter(Boolean).join("\n\n"));
}

function bulletBox(slide, items, opts) {
  const o = Object.assign({ x: 0.45, y: 1.4, w: 9.1, h: 3.6, fontFace: "Calibri", fontSize: 15, color: INK, margin: 0 }, opts || {});
  const runs = items.map((t, i) => ({ text: strip(t), options: { bullet: { code: "2022" }, breakLine: i < items.length - 1, paraSpaceAfter: 8 } }));
  slide.addText(runs, o);
}

function addTableSlide(pres, tbl, title, comp, tiw, noteText) {
  const s = pres.addSlide();
  s.background = { color: WHITE };
  chrome(s, comp, tiw);
  titleBar(s, title);
  const head = tbl.head.map(hd => ({ text: strip(hd), options: { bold: true, color: WHITE, fill: { color: VIOLET }, fontSize: 12 } }));
  const rows = [head].concat(tbl.rows.map(r => r.map(c => ({ text: strip(c), options: { fontSize: 11.5, color: INK } }))));
  s.addTable(rows, { x: 0.45, y: 1.35, w: 9.1, fontFace: "Calibri", border: { pt: 0.5, color: "D8D2E4" }, autoPage: false, rowH: 0.32, valign: "middle" });
  notes(s, [noteText]);
  return s;
}

function buildDeck(L, outPath) {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  const T = L.teach;
  const tiw = todayIWill(L.objectives);
  const lessonName = "Lesson " + L.id + ": " + strip(L.topic).split(";")[0].split(":")[0];

  // ---------- TEACHER PLANNING (marked, not student-facing) ----------
  let s = pres.addSlide();
  s.background = { color: VIOLET };
  s.addText("TEACHER PLANNING", { x: 0.6, y: 0.55, w: 8.8, h: 0.4, fontFace: "Arial", fontSize: 13, bold: true, color: GOLD, charSpacing: 3, margin: 0 });
  s.addText(lessonName, { x: 0.6, y: 1.0, w: 8.8, h: 1.5, fontFace: "Cambria", fontSize: 34, bold: true, color: WHITE, margin: 0 });
  s.addText([
    { text: "Course: Professional Communications (TEKS 130.110)\n", options: {} },
    { text: "Module " + L.module_num + ": " + strip(L.module) + "\n", options: {} },
    { text: "Pacing: " + strip(L.chapter) + "   |   TEKS: " + strip(L.teks), options: {} }
  ], { x: 0.6, y: 2.6, w: 8.8, h: 1.2, fontFace: "Calibri", fontSize: 15, color: "E9DFFB", margin: 0 });
  s.addText("Slides 1-3 are for the teacher. Student-facing slides begin at slide 4.",
    { x: 0.6, y: 4.7, w: 8.8, h: 0.4, fontFace: "Calibri", fontSize: 12, italic: true, color: "CBB8F0", margin: 0 });
  notes(s, ["TEACHER BRIEF: " + strip(T.brief),
    "Vocabulary: " + (L.vocab || []).join(", "),
    "Language objective: " + strip(L.language_obj)]);

  // Alignment slide
  s = pres.addSlide();
  s.background = { color: PALE };
  s.addText("TEACHER PLANNING - ALIGNMENT", { x: 0.45, y: 0.25, w: 9.1, h: 0.35, fontFace: "Arial", fontSize: 12, bold: true, color: VIOLET, charSpacing: 2, margin: 0 });
  const alignRows = [
    ["Content Objective", strip(L.objectives)],
    ["Language Objective", strip(L.language_obj) || "Discuss and write using this lesson's academic vocabulary."],
    ["Student-Facing Objective", tiw],
    ["Demonstration of Learning", "Exit Ticket: 3 independent questions measuring the same skill as the objective" + (L.quiz ? " + in-app Module Quiz" : "")],
    ["Essential Vocabulary", (L.vocab || []).join(", ")],
    ["Supports", (T.supports || []).map(strip).join("  |  ")]
  ].map(r => [{ text: r[0], options: { bold: true, fontSize: 11.5, color: VIOLET } }, { text: r[1], options: { fontSize: 11.5, color: INK } }]);
  s.addTable(alignRows, { x: 0.45, y: 0.75, w: 9.1, colW: [2.5, 6.6], fontFace: "Calibri", border: { pt: 0.5, color: "D8D2E4" }, valign: "middle" });
  notes(s, ["Objective/DOL alignment: the exit ticket items were written to the same verb and cognitive level as the objective. Review them (DOL slide notes) before teaching."]);

  // Lesson map from run sheet
  s = pres.addSlide();
  s.background = { color: PALE };
  s.addText("TEACHER PLANNING - LESSON MAP", { x: 0.45, y: 0.25, w: 9.1, h: 0.35, fontFace: "Arial", fontSize: 12, bold: true, color: VIOLET, charSpacing: 2, margin: 0 });
  const mapHead = ["Time", "Component", "Instruction / Strategy", "Evidence"].map(t => ({ text: t, options: { bold: true, color: WHITE, fill: { color: VIOLET }, fontSize: 10 } }));
  const mapRows = [mapHead];
  (T.run || []).forEach(dayObj => {
    if ((T.run || []).length > 1) mapRows.push([{ text: "DAY " + dayObj.day, options: { bold: true, fill: { color: LIGHT }, colspan: 4, fontSize: 11 } }]);
    (dayObj.blocks || []).forEach(b => {
      mapRows.push([
        { text: strip(b.t), options: { fontSize: 9.5, bold: true } },
        { text: strip(b.label), options: { fontSize: 9.5 } },
        { text: trimW(b.d, 95), options: { fontSize: 9.5 } },
        { text: "", options: { fontSize: 10 } }
      ]);
    });
  });
  s.addTable(mapRows, { x: 0.45, y: 0.75, w: 9.1, colW: [0.9, 1.5, 5.7, 1.0], fontFace: "Calibri", border: { pt: 0.5, color: "D8D2E4" }, valign: "middle" });
  notes(s, ["Full run sheet with timings. Evidence column: use guided-notes completion, quick-check responses, and the exit ticket."]);

  // ---------- 1. ACTIVATING LEARNING ----------
  const warm = ((T.run || [])[0] && T.run[0].blocks && T.run[0].blocks[0]) ? T.run[0].blocks[0].d : (T.sections[0] ? T.sections[0].core : "");
  s = pres.addSlide(); s.background = { color: WHITE };
  chrome(s, "ACTIVATE", tiw);
  titleBar(s, "Let's get thinking", COMPONENT_COLOR["ACTIVATE"]);
  s.addShape(pres.ShapeType.roundRect, { x: 0.45, y: 1.5, w: 9.1, h: 2.4, fill: { color: "FFF7E0" }, line: { color: GOLD, width: 1 }, rectRadius: 0.12 });
  s.addText(strip(warm), { x: 0.75, y: 1.7, w: 8.5, h: 2.0, fontFace: "Calibri", fontSize: 17, color: INK, valign: "top", margin: 0 });
  s.addText("Quick Write, then Turn and Talk: jot your answer (2 min), then compare with a partner (1 min).",
    { x: 0.45, y: 4.15, w: 9.1, h: 0.6, fontFace: "Calibri", fontSize: 13, italic: true, color: MUTED, margin: 0 });
  notes(s, ["ACTIVATE (3-5 min). Run as Quick Write -> Turn and Talk.",
    "WAYGROUND: open-ended response - collect initial answers before the partner talk, revisit at Closure.",
    "Then post the objective and read it aloud with the class: " + tiw]);

  // ---------- 2. EXPLICIT INSTRUCTION (I DO) per section, guided notes as WE DO after each ----------
  (T.sections || []).forEach((sec, si) => {
    // I DO concept slide
    s = pres.addSlide(); s.background = { color: WHITE };
    chrome(s, "I DO", tiw);
    titleBar(s, sec.title);
    s.addText(strip(sec.core), { x: 0.45, y: 1.35, w: 9.1, h: 0.75, fontFace: "Calibri", fontSize: 15, italic: true, color: VIOLET, margin: 0 });
    let yCursor = 2.15;
    if (sec.hook) {
      s.addShape(pres.ShapeType.roundRect, { x: 0.45, y: 4.15, w: 9.1, h: 0.85, fill: { color: "FFF7E0" }, line: { color: GOLD, width: 1 }, rectRadius: 0.1 });
      s.addText([{ text: "MEMORY HOOK  ", options: { bold: true, color: "92400E", fontSize: 11 } },
                 { text: strip(sec.hook), options: { color: INK, fontSize: 13 } }],
        { x: 0.7, y: 4.22, w: 8.6, h: 0.7, fontFace: "Calibri", valign: "middle", margin: 0 });
    }
    if (sec.table && sec.table.head && sec.table.rows.length <= 7) {
      const head = sec.table.head.map(hd => ({ text: strip(hd), options: { bold: true, color: WHITE, fill: { color: VIOLET }, fontSize: 11 } }));
      const rows = [head].concat(sec.table.rows.map(r => r.map(c => ({ text: trimW(c, 110), options: { fontSize: 10.5, color: INK } }))));
      s.addTable(rows, { x: 0.45, y: yCursor, w: 9.1, fontFace: "Calibri", border: { pt: 0.5, color: "D8D2E4" }, valign: "middle" });
    } else {
      // distill script beats into 3-4 student-visible key points (Board: lines preferred)
      const boards = (sec.script || []).filter(b => b.indexOf("Board:") === 0).map(b => b.replace(/^Board:\s*/, ""));
      const points = boards.length ? boards : (sec.script || []).filter(b => b.indexOf("Say:") === 0).slice(0, 3).map(b => strip(b.replace(/^Say:\s*/, "")).split(". ")[0] + ".");
      bulletBox(s, points.slice(0, 4), { y: yCursor, h: sec.hook ? 1.85 : 2.8, fontSize: 15 });
    }
    notes(s, ["I DO - teach this section with the script:"].concat((sec.script || []).map(strip))
      .concat(["CFU as you go; do not exceed 2-3 slides of talk without a student response."]));

    // WE DO guided notes slide for this section
    if (sec.guided && sec.guided.length) {
      s = pres.addSlide(); s.background = { color: WHITE };
      chrome(s, "WE DO", tiw);
      titleBar(s, "Guided notes - fill in as we discuss", COMPONENT_COLOR["WE DO"]);
      const gitems = sec.guided.map(g => strip(g.q));
      bulletBox(s, gitems, { y: 1.5, h: 2.6, fontSize: 16 });
      s.addText("INK -> PAIR -> SHARE: write your answer, compare with a partner, be ready to share.",
        { x: 0.45, y: 4.35, w: 9.1, h: 0.5, fontFace: "Calibri", fontSize: 13, italic: true, color: MUTED, margin: 0 });
      notes(s, ["WE DO - Ink-Pair-Share. Answers:"].concat(sec.guided.map(g => "- " + strip(g.q) + "  ->  " + strip(g.a)))
        .concat(["WAYGROUND: convert each blank to a short-answer or matching item; students submit AFTER the pair discussion.",
                 "CFU decision: CONTINUE if most pairs are right; CLARIFY or RETEACH this section if not."]));
    }
  });

  // ---------- 3. WE DO: quick check scenarios (first 2) ----------
  const qc = T.quickcheck || [];
  if (qc.length) {
    s = pres.addSlide(); s.background = { color: WHITE };
    chrome(s, "WE DO", tiw);
    titleBar(s, "Work the scenarios - together", COMPONENT_COLOR["WE DO"]);
    bulletBox(s, qc.slice(0, 2).map(q => strip(q.q)), { y: 1.5, h: 2.7, fontSize: 16 });
    s.addText("THINK -> PAIR -> SHARE: 1 minute of silent thinking, then discuss with your partner.",
      { x: 0.45, y: 4.35, w: 9.1, h: 0.5, fontFace: "Calibri", fontSize: 13, italic: true, color: MUTED, margin: 0 });
    notes(s, ["WE DO - Think-Pair-Share on scenarios 1-2. Model answers:"]
      .concat(qc.slice(0, 2).map((q, i) => (i + 1) + ". " + strip(q.a)))
      .concat(["WAYGROUND: poll or open response after the share; debrief patterns before moving on."]));
  }

  // ---------- 4. YOU DO: remaining quick checks ----------
  if (qc.length > 2) {
    s = pres.addSlide(); s.background = { color: WHITE };
    chrome(s, "YOU DO", tiw);
    titleBar(s, "Your turn - on your own", COMPONENT_COLOR["YOU DO"]);
    bulletBox(s, qc.slice(2, 6).map((q, i) => (i + 1) + ". " + strip(q.q)), { y: 1.45, h: 2.6, fontSize: 14 });
    s.addTable([[
      { text: "TASK: answer in complete sentences", options: { fontSize: 10.5, bold: true, color: "0D9488" } },
      { text: "MODE: independent", options: { fontSize: 10.5 } },
      { text: "TIME: 8-10 min", options: { fontSize: 10.5 } },
      { text: "RESOURCES: your notes", options: { fontSize: 10.5 } },
      { text: "PRODUCT: written answers", options: { fontSize: 10.5 } }
    ]], { x: 0.45, y: 4.25, w: 9.1, fontFace: "Calibri", border: { pt: 0.5, color: "CBE7E3" }, fill: { color: "F0FBF9" }, valign: "middle" });
    notes(s, ["YOU DO - independent written practice. Circulate and check. Model answers:"]
      .concat(qc.slice(2, 6).map((q, i) => (i + 1) + ". " + strip(q.a)))
      .concat(["WAYGROUND: open-ended items; review responses live to pick who needs a re-teach.",
               "Do not introduce new content here."]));
  }

  // ---------- Activity (WE DO if team, YOU DO if individual) ----------
  if (T.activity) {
    const A = T.activity;
    const fmt = strip(A.format || "");
    const team = /team|pair|group/i.test(fmt);
    const comp = team ? "WE DO" : "YOU DO";
    const noteArr = ["Activity (" + comp + "). Rubric criteria (circle-the-score 4/3/2/1):"]
      .concat((T.rubric && T.rubric.criteria || []).map(c => "- " + strip(c)))
      .concat(["Full rubric + evidence table are in the web app lesson page (printable).",
               "WAYGROUND: collect the product as an open response or file/photo where supported."]);
    // first slide: title + format + scenario (+ evidence table if small)
    s = pres.addSlide(); s.background = { color: WHITE };
    chrome(s, comp, tiw);
    titleBar(s, strip(A.title), REDC);
    s.addText(fmt, { x: 0.45, y: 1.3, w: 9.1, h: 0.55, fontFace: "Calibri", fontSize: 12.5, bold: true, color: REDC, margin: 0, valign: "top" });
    s.addText(strip(A.scenario), { x: 0.45, y: 1.9, w: 9.1, h: 1.0, fontFace: "Calibri", fontSize: 13, color: INK, margin: 0, valign: "top" });
    if (A.evidence && A.evidence.head && A.evidence.rows && A.evidence.rows.length <= 6) {
      const eh = A.evidence.head.map(hd => ({ text: strip(hd), options: { bold: true, color: WHITE, fill: { color: REDC }, fontSize: 10.5 } }));
      const er = [eh].concat(A.evidence.rows.map(r => r.map(c => ({ text: trimW(c, 90), options: { fontSize: 10, color: INK } }))));
      s.addTable(er, { x: 0.45, y: 3.0, w: 9.1, fontFace: "Calibri", border: { pt: 0.5, color: "F3C6C6" }, valign: "middle" });
    } else {
      s.addText("Your tasks are on the next slide" + ((A.parts || []).length > 2 ? "s" : "") + ".",
        { x: 0.45, y: 3.1, w: 9.1, h: 0.4, fontFace: "Calibri", fontSize: 12, italic: true, color: MUTED, margin: 0 });
    }
    notes(s, noteArr);
    // continuation slides: 2 parts per slide
    const parts = A.parts || [];
    for (let pi = 0; pi < parts.length; pi += 2) {
      const chunk = parts.slice(pi, pi + 2);
      s = pres.addSlide(); s.background = { color: WHITE };
      chrome(s, comp, tiw);
      titleBar(s, strip(A.title) + " - tasks", REDC);
      const partItems = [];
      chunk.forEach(pt => {
        partItems.push({ text: strip(pt.t), options: { bold: true, color: REDC, fontSize: 13.5, breakLine: true, paraSpaceAfter: 3 } });
        (pt.items || []).forEach(it => partItems.push({ text: strip(it), options: { bullet: { code: "2022" }, fontSize: 12.5, breakLine: true, paraSpaceAfter: 5 } }));
      });
      if (partItems.length) { partItems[partItems.length - 1].options.breakLine = false; }
      s.addText(partItems, { x: 0.45, y: 1.4, w: 9.1, h: 3.6, fontFace: "Calibri", color: INK, valign: "top", margin: 0 });
      notes(s, ["Work time. Circulate with the rubric criteria (see first activity slide notes)."]);
    }
  }

  // ---------- 5. DOL: exit ticket ----------
  s = pres.addSlide(); s.background = { color: WHITE };
  chrome(s, "DOL", tiw);
  titleBar(s, "SHOW WHAT YOU KNOW", REDC);
  const exitItems = [];
  (T.exit || []).forEach((m, qi) => {
    exitItems.push({ text: (qi + 1) + ". " + strip(m.q), options: { bold: true, fontSize: 12.5, breakLine: true, paraSpaceAfter: 2 } });
    (m.opts || []).forEach(o => exitItems.push({ text: strip(o), options: { fontSize: 11.5, color: MUTED, breakLine: true, paraSpaceAfter: 2, bullet: { code: "25CB" } } }));
  });
  if (exitItems.length) { exitItems[exitItems.length - 1].options.breakLine = false; }
  s.addText(exitItems, { x: 0.45, y: 1.4, w: 9.1, h: 3.3, fontFace: "Calibri", color: INK, valign: "top", margin: 0 });
  s.addText("Independent. No notes. This shows me what you mastered today.",
    { x: 0.45, y: 4.75, w: 9.1, h: 0.35, fontFace: "Calibri", fontSize: 12, italic: true, color: MUTED, margin: 0 });
  notes(s, ["DOL - independent, 5 min. Answers:"]
    .concat((T.exit || []).map((m, i) => (i + 1) + ". " + strip((m.opts || [])[m.ans]) + "  (" + strip(m.why || "") + ")"))
    .concat(["Sort results: mastery / approaching / re-teach group.",
             "WAYGROUND: deliver as auto-graded multiple choice; the web app also has this exit ticket interactive.",
             L.quiz ? "MODULE QUIZ: this lesson also carries the 10-item module quiz in the web app - use it as the module assessment." : ""]));

  // ---------- 6. CLOSURE ----------
  s = pres.addSlide(); s.background = { color: WHITE };
  chrome(s, "CLOSE", tiw);
  titleBar(s, "Where did we land?", GREEN);
  s.addShape(pres.ShapeType.roundRect, { x: 0.45, y: 1.5, w: 9.1, h: 1.0, fill: { color: "EEFAF2" }, line: { color: GREEN, width: 1 }, rectRadius: 0.1 });
  s.addText(tiw, { x: 0.7, y: 1.62, w: 8.6, h: 0.75, fontFace: "Calibri", fontSize: 15, bold: true, color: "14532D", valign: "middle", margin: 0 });
  bulletBox(s, [
    "3 - things you learned today",
    "2 - places you will use this outside class",
    "1 - question you still have"
  ], { y: 2.8, h: 1.6, fontSize: 16 });
  s.addText("Rate yourself on the objective: Got it / Almost / Need help", { x: 0.45, y: 4.5, w: 9.1, h: 0.4, fontFace: "Calibri", fontSize: 13, italic: true, color: MUTED, margin: 0 });
  notes(s, ["CLOSURE (3-4 min) - distinct from the DOL. Return to the objective and run the 3-2-1.",
    "WAYGROUND: self-assessment poll (Got it / Almost / Need help) + one open response for the question.",
    "Preview tomorrow: next lesson in Module " + L.module_num + "."]);

  return pres.writeFile({ fileName: outPath });
}

(async () => {
  let made = 0;
  for (const L of lessons) {
    if (ONLY && L.key !== ONLY) continue;
    const name = "PC_L" + L.id.replace(".", "-") + "_Deck.pptx";
    await buildDeck(L, OUT + "/" + name);
    made++;
  }
  console.log("decks written:", made);
})().catch(e => { console.error("FAIL", e); process.exit(1); });
