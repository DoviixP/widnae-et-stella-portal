/* teacher-portal.js — teacher username/password sign-in, teacher dashboard,
   admin login management and assignment tools. Loaded AFTER the main script in index.html. */
(function () {
  const $ = id => document.getElementById(id);
  const esc = v => escapeTeacherText(v);

  /* Show the server's real error text (the Worker uses "message", the backend uses "error"). */
  window.portalControlRequest = async function (action, extra = {}) {
    const res = await fetch(API_URL, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, payload: { token: sessionStorage.getItem("wes_session_token"), ...extra } })
    });
    let data = {}; try { data = await res.json(); } catch (e) { /* not JSON */ }
    if (!res.ok || !data.ok) throw new Error(data.error || data.message || "Request failed (" + res.status + ").");
    return data.result;
  };

  const css = document.createElement("style");
  css.textContent = `
    .tp-btn{border:0;border-radius:7px;padding:10px 14px;cursor:pointer;font-weight:600;background:#102b50;color:#fff}
    .tp-btn.alt{background:#e8f0ff;color:#2455a4}
    .tp-input{width:100%;padding:11px 12px;border:1px solid #d8dee8;border-radius:7px;margin:6px 0 10px}
    .tp-box{border:1px solid #e2e8f0;background:#f8fafc;border-radius:10px;padding:14px;margin:14px 0;font-size:13px}
    .tp-box textarea{width:100%;margin:10px 0;padding:10px;font-family:monospace;font-size:12px;border:1px solid #d8dee8;border-radius:7px}
    #tpLoginForm label{font-size:13px;font-weight:600}
    .tp-chip{display:inline-block;padding:3px 9px;border-radius:12px;font-size:11px;font-weight:700;margin:2px;background:#eef2f6;color:#53647a}
    .tp-chip.done{background:#e7f6ec;color:#16803c}.tp-chip.part{background:#fff4e0;color:#9a5b00}
    .tp-tick{color:#16803c;font-weight:700;font-size:16px}
    .tp-row{cursor:pointer}.tp-row:hover{background:#f3f7ff}
    .tp-mark{width:90px;padding:8px;border:1px solid #d8dee8;border-radius:6px;font-size:14px}
    .tp-mark.tp-changed{border-color:#e0a100;background:#fffbea}.tp-mark:disabled{background:#f1f5f9;color:#475569}
    .tp-bar{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:14px 0}`;
  document.head.appendChild(css);

  /* ───────── 1) Teacher sign-in box under the Google button ───────── */
  $("loginSection").insertAdjacentHTML("beforeend", `
    <div class="divider"></div>
    <h3 style="margin-bottom:12px">Teacher sign-in</h3>
    <form id="tpLoginForm" style="text-align:left">
      <label for="tpUser">Username</label>
      <input class="tp-input" id="tpUser" autocomplete="username" autocapitalize="none" required>
      <label for="tpPass">Password</label>
      <input class="tp-input" id="tpPass" type="password" autocomplete="current-password" required>
      <button class="tp-btn" type="submit" style="width:100%">Sign in</button>
    </form>
    <p class="status" id="tpLoginStatus"></p>`);

  $("tpLoginForm").addEventListener("submit", async e => {
    e.preventDefault();
    const st = $("tpLoginStatus");
    st.style.color = "#53647a"; st.textContent = "Signing in...";
    try {
      const res = await fetch(API_URL, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "teacherLogin", payload: { username: $("tpUser").value, password: $("tpPass").value } })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || data.message || "Sign-in failed.");
      const r = data.result;
      if (!r || !r.success || !r.token) throw new Error("The server returned an invalid login response.");
      sessionStorage.setItem("wes_session_token", r.token);
      $("tpPass").value = ""; st.textContent = "";
      await showDashboard(r);
    } catch (err) { st.style.color = "#c0392b"; st.textContent = err.message || "Sign-in failed."; }
  });

  /* ───────── 2) Teacher dashboard + mark sheet ───────── */
  const originalShowDashboard = window.showDashboard;
  window.showDashboard = async function (user) {
    if (user && user.role === "TEACHER") return teacherHome(user);
    await originalShowDashboard(user);
    if (user && (user.role === "SUPER_ADMIN" || user.role === "SCHOOL_ADMIN")) {
      $("dashboardContent").insertAdjacentHTML("beforeend", progressMarkup());
      tpLoadProgress();
    }
  };

  let tpUser = null, sheet = null;

  async function teacherHome(user) {
    tpUser = user; sheet = null;
    $("loginSection").style.display = "none";
    $("dashboard").style.display = "block";
    $("userEmail").textContent = user.displayName || user.username || user.email || "";
    $("userRole").textContent = "TEACHER";
    await renderHome();
    await loadPortalState();
  }

  async function renderHome() {
    $("dashboardContent").innerHTML = `
      <div class="user-panel">
        <h2>Teacher Dashboard</h2>
        <p id="tpMustChange" style="color:#b42318;font-weight:600;margin-bottom:10px"></p>
        <details id="tpPwBox"><summary style="cursor:pointer;font-weight:600">Change my password</summary>
          <form id="tpPwForm" style="max-width:360px;margin-top:10px">
            <input class="tp-input" id="tpCur" type="password" placeholder="Current password" autocomplete="current-password" required>
            <input class="tp-input" id="tpNew" type="password" placeholder="New password (8+ characters)" autocomplete="new-password" required minlength="8">
            <input class="tp-input" id="tpNew2" type="password" placeholder="Repeat new password" autocomplete="new-password" required>
            <button class="tp-btn" type="submit">Save password</button>
            <p id="tpPwMsg" style="margin-top:8px;font-size:13px"></p>
          </form>
        </details>
      </div>
      <section class="assignment-management">
        <h2>My classes and subjects</h2>
        <p id="tpMyMsg">Click a class to enter marks. A <span class="tp-tick">✓</span> means you marked it as complete.</p>
        <div class="assignment-table-wrap"><table class="assignment-table">
          <thead><tr><th>Class</th><th>Subject</th><th>Coef</th><th>Marks by sequence</th><th></th></tr></thead>
          <tbody id="tpMyBody"><tr><td colspan="5">Loading...</td></tr></tbody>
        </table></div>
      </section>`;
    if (tpUser && tpUser.mustChangePassword) {
      $("tpMustChange").textContent = "Please choose your own password before you continue.";
      $("tpPwBox").open = true;
    }
    $("tpPwForm").addEventListener("submit", async e => {
      e.preventDefault();
      const m = $("tpPwMsg"); m.style.color = "#53647a";
      if ($("tpNew").value !== $("tpNew2").value) { m.style.color = "#b42318"; m.textContent = "The two new passwords do not match."; return; }
      try {
        const r = await portalControlRequest("changeMyPassword", { currentPassword: $("tpCur").value, newPassword: $("tpNew").value });
        m.style.color = "#16803c"; m.textContent = r.message || "Password changed.";
        $("tpMustChange").textContent = ""; if (tpUser) tpUser.mustChangePassword = false; e.target.reset();
      } catch (err) { m.style.color = "#b42318"; m.textContent = err.message; }
    });
    await tpLoadMine();
  }

  async function tpLoadMine() {
    try {
      const r = await portalControlRequest("getMyAssignments");
      const items = r.assignments || [], seqs = r.sequences || [];
      const chip = (q, p) => {
        const st = p ? p.status : "NONE";
        const cls = st === "SUBMITTED" ? "done" : st === "IN_PROGRESS" ? "part" : "";
        const txt = st === "SUBMITTED" ? "✓ complete" : st === "IN_PROGRESS" ? p.entered + "/" + p.total : "not started";
        return `<span class="tp-chip ${cls}">Seq ${esc(q.number)}: ${esc(txt)}</span>`;
      };
      $("tpMyBody").innerHTML = items.length ? items.map(a => {
        const done = seqs.length > 0 && seqs.every(q => a.progress && a.progress[q.sequenceId] && a.progress[q.sequenceId].status === "SUBMITTED");
        return `<tr class="tp-row" onclick="tpOpenSheet('${esc(a.classSubjectId)}')">
          <td>${esc(a.className)}</td><td>${done ? '<span class="tp-tick">✓</span> ' : ""}${esc(a.subjectName)}</td><td>${esc(a.coefficient)}</td>
          <td>${seqs.map(q => chip(q, a.progress && a.progress[q.sequenceId])).join("")}</td><td><button class="tp-btn" type="button">Enter marks</button></td></tr>`;
      }).join("") : '<tr><td colspan="5">No classes have been assigned to you yet. Contact the school administration.</td></tr>';
    } catch (err) {
      $("tpMyBody").innerHTML = '<tr><td colspan="5">Unable to load your classes.</td></tr>';
      $("tpMyMsg").textContent = err.message;
    }
  }

  const dirtyCount = () => (sheet ? Object.keys(sheet.dirty).length : 0);
  const sheetMsg = (t, bad) => { const m = $("tpSheetMsg"); if (m) { m.textContent = t; m.style.color = bad ? "#b42318" : "#16803c"; } };

  window.tpOpenSheet = async function (csId, seqId) {
    if (sheet && dirtyCount() && !confirm("You have unsaved marks. Leave without saving them?")) {
      if ($("tpSeqSel")) $("tpSeqSel").value = sheet.d.sequenceId;
      return;
    }
    $("dashboardContent").innerHTML = '<div class="user-panel"><p>Loading the mark sheet...</p></div>';
    try {
      const d = await portalControlRequest("getMarkSheet", { classSubjectId: csId, sequenceId: seqId });
      sheet = { csId, d, dirty: {}, orig: {} };
      d.students.forEach(s => { sheet.orig[s.studentId] = s.mark === null ? "" : String(s.mark); });
      renderSheet();
    } catch (err) {
      sheet = null;
      $("dashboardContent").innerHTML = `<div class="user-panel"><p style="color:#b42318">${esc(err.message)}</p><button class="tp-btn" type="button" onclick="tpBack()">Back to my classes</button></div>`;
    }
  };

  window.tpBack = async function () {
    if (sheet && dirtyCount() && !confirm("You have unsaved marks. Leave without saving them?")) return;
    sheet = null; await renderHome();
  };

  function renderSheet() {
    const d = sheet.d, c = d.classSubject;
    const seqOpts = d.sequences.map(q => `<option value="${esc(q.sequenceId)}" ${q.sequenceId === d.sequenceId ? "selected" : ""}>Sequence ${esc(q.number)}${q.open ? "" : " (closed)"}</option>`).join("");
    const banner = d.submitted
      ? '<div class="tp-box" style="background:#e7f6ec;border-color:#b7e1c4"><strong>✓ Marked as complete.</strong> These marks are locked. To correct something, ask the administration to reopen them.</div>'
      : (!d.open ? '<div class="tp-box">This sequence is closed. Marks can no longer be changed.</div>' : "");
    const rows = d.students.map((s, i) => `<tr><td>${i + 1}</td><td>${esc(s.matricule)}</td><td>${esc(s.name)}</td>
      <td><input class="tp-mark" data-sid="${esc(s.studentId)}" type="text" inputmode="decimal" autocomplete="off" maxlength="5" value="${s.mark === null ? "" : esc(s.mark)}" ${d.locked ? "disabled" : ""}></td></tr>`).join("");
    $("dashboardContent").innerHTML = `
      <section class="assignment-management">
        <button class="tp-btn alt" type="button" onclick="tpBack()">← My classes</button>
        <h2 style="margin-top:14px">${esc(c.className)} — ${esc(c.subjectName)} <small style="font-weight:400">(coef ${esc(c.coefficient)})</small></h2>
        <div class="tp-bar"><label for="tpSeqSel"><strong>Sequence</strong></label>
          <select id="tpSeqSel" onchange="tpOpenSheet('${esc(sheet.csId)}', this.value)" style="padding:9px;border:1px solid #d8dee8;border-radius:7px">${seqOpts}</select>
          <span id="tpCount" style="font-size:13px;color:#53647a"></span></div>
        ${banner}
        <p style="font-size:13px;color:#53647a;margin-bottom:8px">Marks are out of 20. Leave the box empty for a student who did not write.</p>
        <div class="assignment-table-wrap"><table class="assignment-table">
          <thead><tr><th>#</th><th>Matricule</th><th>Student</th><th>Mark /20</th></tr></thead>
          <tbody id="tpSheetBody">${rows || '<tr><td colspan="4">No students found for this class and subject.</td></tr>'}</tbody></table></div>
        ${d.locked ? "" : `<div class="tp-bar"><button class="tp-btn" type="button" onclick="tpSave()">Save marks</button>
          <button class="tp-btn alt" type="button" onclick="tpComplete()">Mark as complete ✓</button></div>`}
        <p id="tpSheetMsg" role="status" style="font-size:13px"></p>
      </section>`;
    const body = $("tpSheetBody");
    body.addEventListener("input", e => {
      const el = e.target; if (!el.classList.contains("tp-mark")) return;
      const sid = el.dataset.sid, v = el.value.trim();
      if (v === sheet.orig[sid]) { delete sheet.dirty[sid]; el.classList.remove("tp-changed"); } else { sheet.dirty[sid] = v; el.classList.add("tp-changed"); }
      updateCount();
    });
    body.addEventListener("keydown", e => {
      if (e.key !== "Enter" || !e.target.classList.contains("tp-mark")) return;
      e.preventDefault();
      const all = [...document.querySelectorAll(".tp-mark")], i = all.indexOf(e.target);
      if (all[i + 1]) all[i + 1].focus();
    });
    updateCount();
  }

  function updateCount() {
    const n = [...document.querySelectorAll(".tp-mark")].filter(el => el.value.trim() !== "").length;
    const c = $("tpCount"); if (c) c.textContent = n + " of " + sheet.d.total + " students have a mark" + (dirtyCount() ? " · unsaved changes" : "");
  }

  window.tpSave = async function (quiet) {
    const entries = Object.entries(sheet.dirty);
    if (!entries.length) { if (!quiet) sheetMsg("Nothing new to save."); return true; }
    for (const [sid, v] of entries) {
      const n = Number(String(v).replace(",", "."));
      if (v !== "" && !(n >= 0 && n <= 20)) {
        sheetMsg("Marks must be between 0 and 20.", true);
        const el = document.querySelector('.tp-mark[data-sid="' + sid + '"]'); if (el) el.focus();
        return false;
      }
    }
    try {
      const r = await portalControlRequest("saveMarks", { classSubjectId: sheet.csId, sequenceId: sheet.d.sequenceId, marks: entries.map(([studentId, mark]) => ({ studentId, mark })) });
      entries.forEach(([sid, v]) => { sheet.orig[sid] = v; });
      sheet.dirty = {};
      document.querySelectorAll(".tp-mark.tp-changed").forEach(el => el.classList.remove("tp-changed"));
      sheetMsg((r.message || "Saved.") + " " + r.entered + " of " + r.total + " students have a mark."); updateCount();
      return true;
    } catch (err) { sheetMsg(err.message, true); return false; }
  };

  window.tpComplete = async function () {
    const n = [...document.querySelectorAll(".tp-mark")].filter(el => el.value.trim() !== "").length, c = sheet.d.classSubject;
    if (!n) { sheetMsg("Enter at least one mark before marking this as complete.", true); return; }
    if (!confirm("Mark " + c.subjectName + " (" + c.className + ") as complete?\n\n" + n + " of " + sheet.d.total +
      " students have a mark. Students without a mark are treated as not having written.\nAfter this the marks are locked.")) return;
    if (!(await tpSave(true))) return;
    try {
      await portalControlRequest("submitMarks", { classSubjectId: sheet.csId, sequenceId: sheet.d.sequenceId });
      await tpOpenSheet(sheet.csId, sheet.d.sequenceId);
    } catch (err) { sheetMsg(err.message, true); }
  };

  /* ───────── 3) Admin: teacher list with logins ───────── */
  window.teacherManagementMarkup = function () {
    return `
    <section class="teacher-management">
      <h2>Teacher Management</h2>
      <p>Teachers sign in with a username and password. Teachers from the school software appear here after a sync.</p>
      <div class="teacher-toolbar">
        <input id="teacherSearch" type="search" placeholder="Search by name or username" oninput="filterTeacherRows()">
        <select id="teacherStatusFilter" onchange="filterTeacherRows()">
          <option value="ALL">All accounts</option><option value="ACTIVE">Active</option><option value="DISABLED">Deactivated</option>
        </select>
        <select id="teacherLoginFilter" onchange="filterTeacherRows()">
          <option value="ALL">All logins</option><option value="READY">Login ready</option><option value="NONE">No login yet</option>
        </select>
        <button class="tp-btn" type="button" onclick="tpGenerateLogins()">Generate logins</button>
      </div>
      <p id="teacherFeedback" role="status"></p>
      <div id="tpCreds"></div>
      <div class="teacher-table-wrap"><table class="teacher-table">
        <thead><tr><th>Teacher</th><th>Login</th><th>Account</th><th>Actions</th></tr></thead>
        <tbody id="teacherTableBody"><tr><td colspan="4">Loading teachers...</td></tr></tbody>
      </table></div>
    </section>`;
  };

  window.renderTeacherRows = function (items) {
    const body = $("teacherTableBody"); if (!body) return;
    if (!items.length) { body.innerHTML = '<tr><td colspan="4">No teachers found.</td></tr>'; return; }
    body.innerHTML = items.map(t => {
      const on = t.status === "ACTIVE";
      return `<tr>
        <td><strong>${esc(t.displayName || "Unnamed teacher")}</strong><br><small>${esc(t.username || t.email)}</small></td>
        <td><span class="teacher-pill ${t.hasPassword ? "active" : "inactive"}">${t.hasPassword ? "LOGIN READY" : "NO LOGIN"}</span></td>
        <td><span class="teacher-pill ${on ? "active" : "inactive"}">${on ? "ACTIVE" : "DISABLED"}</span></td>
        <td>
          <button class="teacher-action" onclick="tpSetPassword('${esc(t.teacherId)}')">${t.hasPassword ? "Reset password" : "Set login"}</button>
          <button class="${on ? "teacher-danger" : "teacher-success"}" onclick="changeTeacherStatus('${esc(t.teacherId)}','${on ? "DISABLED" : "ACTIVE"}')">${on ? "Deactivate" : "Activate"}</button>
        </td></tr>`;
    }).join("");
  };

  window.filterTeacherRows = function () {
    const q = ($("teacherSearch")?.value || "").trim().toLowerCase();
    const st = $("teacherStatusFilter")?.value || "ALL", lg = $("teacherLoginFilter")?.value || "ALL";
    renderTeacherRows(teacherRecords.filter(t =>
      (!q || String(t.displayName).toLowerCase().includes(q) || String(t.username || "").toLowerCase().includes(q) || String(t.email).toLowerCase().includes(q)) &&
      (st === "ALL" || t.status === st) &&
      (lg === "ALL" || (lg === "READY") === !!t.hasPassword)));
  };

  let lastCreds = [];
  function showCreds(list) {
    lastCreds = list;
    const text = "Name\tUsername\tPassword\n" + list.map(x => [x.name, x.username, x.password].join("\t")).join("\n");
    $("tpCreds").innerHTML = `<div class="tp-box"><strong>${list.length} login(s) created. The passwords are shown ONLY NOW — copy or download them before leaving this page.</strong>
      <textarea id="tpCredText" readonly rows="${Math.min(12, list.length + 2)}">${esc(text)}</textarea>
      <button class="tp-btn" type="button" onclick="tpCopyCreds()">Copy</button>
      <button class="tp-btn alt" type="button" onclick="tpDownloadCreds()">Download CSV</button>
      <button class="tp-btn alt" type="button" onclick="document.getElementById('tpCreds').innerHTML=''">Hide</button></div>`;
  }
  window.tpCopyCreds = async function () {
    try { await navigator.clipboard.writeText($("tpCredText").value); teacherFeedback("Copied."); }
    catch (e) { $("tpCredText").select(); teacherFeedback("Press Ctrl+C to copy the selected text."); }
  };
  window.tpDownloadCreds = function () {
    const q = s => '"' + String(s).replace(/"/g, '""') + '"';
    const csv = "name,username,password\n" + lastCreds.map(x => [x.name, x.username, x.password].map(q).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "teacher-logins.csv"; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };

  window.tpGenerateLogins = async function () {
    if (!confirm("Create a username and password for every active teacher who has no login yet?")) return;
    let all = [], remaining = 1, rounds = 0;
    try {
      while (remaining > 0 && rounds++ < 10) {
        teacherFeedback("Creating logins... " + all.length + " done");
        const r = await portalControlRequest("generateTeacherLogins");
        const got = r.logins || [];
        all = all.concat(got); remaining = r.remaining || 0;
        if (!got.length) break;
      }
      teacherFeedback(all.length ? "Done." : "Every active teacher already has a login.");
    } catch (err) { teacherFeedback(err.message, true); }
    if (all.length) showCreds(all);
    await loadTeacherManagement();
  };

  window.tpSetPassword = async function (teacherId) {
    const t = teacherRecords.find(x => x.teacherId === teacherId); if (!t) return;
    const pw = prompt("New password for " + (t.displayName || "this teacher") + " (8+ characters).\nLeave empty to generate one automatically.", "");
    if (pw === null) return;
    if (pw && pw.length < 8) { teacherFeedback("The password must have at least 8 characters.", true); return; }
    try {
      const r = await portalControlRequest("setTeacherCredentials", { teacherId, password: pw || undefined });
      showCreds([{ name: t.displayName, username: r.username, password: r.password }]);
      teacherFeedback(r.message);
      await loadTeacherManagement();
    } catch (err) { teacherFeedback(err.message, true); }
  };

  /* ───────── 4) Admin: assignments + auto-assign ───────── */
  window.assignmentManagementMarkup = function () {
    return `
    <section class="assignment-management">
      <h2>Teacher Assignment Management</h2>
      <p>Assign teachers to a class and subject. Several teachers can share the same class and subject.</p>
      <div class="tp-box"><strong>Auto-assign from the school software</strong>
        <p style="margin:6px 0 10px">Links each class-subject to the teacher whose name matches the name in the school software. You see a preview first and nothing is saved until you confirm.</p>
        <button class="tp-btn" type="button" onclick="tpAutoPreview()">Preview auto-assign</button>
        <div id="tpAuto"></div></div>
      <form class="assignment-form" onsubmit="createTeacherAssignment(event)">
        <select id="assignmentTeacher" required><option value="">Select teacher</option></select>
        <select id="assignmentClassSubject" required><option value="">Select class and subject</option></select>
        <button class="teacher-primary" type="submit">Assign</button>
      </form>
      <input class="tp-input" id="assignmentSearch" type="search" placeholder="Filter assignments by teacher, class or subject" oninput="renderTeacherAssignments()">
      <p id="assignmentFeedback" role="status"></p>
      <div class="assignment-table-wrap"><table class="assignment-table">
        <thead><tr><th>Teacher</th><th>Class</th><th>Subject</th><th>Status</th><th>Action</th></tr></thead>
        <tbody id="assignmentTableBody"><tr><td colspan="5">Loading assignments...</td></tr></tbody>
      </table></div>
    </section>`;
  };

  window.loadTeacherAssignments = async function () {
    const body = $("assignmentTableBody"); if (!body) return;
    body.innerHTML = '<tr><td colspan="5">Loading assignments...</td></tr>';
    try {
      teacherAssignmentData = await portalControlRequest("getTeacherAssignmentData");
      $("assignmentTeacher").innerHTML = '<option value="">Select teacher</option>' +
        teacherAssignmentData.teachers.map(t => `<option value="${esc(t.teacherId)}">${esc(t.name)}${t.username ? " — " + esc(t.username) : ""}</option>`).join("");
      $("assignmentClassSubject").innerHTML = '<option value="">Select class and subject</option>' +
        teacherAssignmentData.classSubjects.map(x => `<option value="${esc(x.classSubjectId)}">${esc(x.className)} — ${esc(x.subjectName)}${x.electronTeacher ? " (" + esc(x.electronTeacher) + ")" : ""}</option>`).join("");
      renderTeacherAssignments();
      if (!teacherAssignmentData.teachers.length) assignmentFeedback("No active teachers yet. Sync from the school software first.", true);
      else if (!teacherAssignmentData.classSubjects.length) assignmentFeedback("No class-subjects available yet. Sync classes and subjects from the school software first.", true);
      else assignmentFeedback("");
    } catch (err) {
      body.innerHTML = '<tr><td colspan="5">Unable to load assignments.</td></tr>';
      assignmentFeedback(err.message, true);
    }
  };

  window.renderTeacherAssignments = function () {
    const body = $("assignmentTableBody"); if (!body) return;
    const q = ($("assignmentSearch")?.value || "").trim().toLowerCase();
    const items = (teacherAssignmentData.assignments || []).filter(a =>
      !q || [a.teacherName, a.teacherEmail, a.className, a.subjectName].join(" ").toLowerCase().includes(q));
    if (!items.length) { body.innerHTML = '<tr><td colspan="5">No assignments found.</td></tr>'; return; }
    body.innerHTML = items.map(a => {
      const on = a.status === "ACTIVE";
      return `<tr>
        <td><strong>${esc(a.teacherName)}</strong><br><small>${esc(a.teacherEmail)}</small></td>
        <td>${esc(a.className)}</td><td>${esc(a.subjectName)}</td>
        <td><span class="teacher-pill ${on ? "active" : "inactive"}">${on ? "ACTIVE" : "REMOVED"}</span></td>
        <td><button class="${on ? "teacher-danger" : "teacher-success"}" onclick="setTeacherAssignmentStatus('${esc(a.assignmentId)}','${on ? "INACTIVE" : "ACTIVE"}')">${on ? "Remove" : "Restore"}</button></td></tr>`;
    }).join("");
  };

  window.tpAutoPreview = async function () {
    const box = $("tpAuto"); box.textContent = "Checking...";
    try {
      const r = await portalControlRequest("autoAssignFromNames", { confirm: false });
      const un = (r.unmatchedNames || []).length ? `<p style="margin-top:6px">Names with no matching teacher: ${r.unmatchedNames.map(esc).join(", ")}</p>` : "";
      box.innerHTML = `<p style="margin-top:10px"><strong>${r.willAssign}</strong> class-subject(s) will be assigned.<br>
        Already assigned: ${r.alreadyAssigned} · No teacher name in the school software: ${r.noTeacherName} · Ambiguous names: ${r.ambiguous}</p>${un}` +
        (r.willAssign ? `<button class="tp-btn" type="button" style="margin-top:10px" onclick="tpAutoConfirm(${r.willAssign})">Confirm and assign ${r.willAssign}</button>` : "");
    } catch (err) { box.textContent = err.message; }
  };
  window.tpAutoConfirm = async function (n) {
    if (!confirm("Create " + n + " assignments now?")) return;
    try {
      const r = await portalControlRequest("autoAssignFromNames", { confirm: true });
      $("tpAuto").innerHTML = ""; assignmentFeedback(r.message || "Done.");
      await loadTeacherAssignments();
    } catch (err) { assignmentFeedback(err.message, true); }
  };

  /* ───────── 5) Admin: mark entry progress ───────── */
  let progData = { sequences: [], rows: [] };
  function progressMarkup() {
    return `
    <section class="assignment-management" id="tpProg">
      <h2>Mark Entry Progress</h2>
      <p>Which class-subjects the teachers have marked as complete (✓).</p>
      <div class="teacher-toolbar">
        <select id="tpProgSeq" onchange="tpLoadProgress(this.value)"></select>
        <select id="tpProgStatus" onchange="tpRenderProgress()">
          <option value="ALL">All</option><option value="SUBMITTED">✓ Complete</option><option value="IN_PROGRESS">In progress</option><option value="NOT_STARTED">Not started</option>
        </select>
        <input id="tpProgSearch" type="search" placeholder="Filter by class, subject or teacher" oninput="tpRenderProgress()">
      </div>
      <p id="tpProgSummary" style="font-size:13px"></p>
      <p id="tpProgMsg" role="status" style="font-size:13px"></p>
      <div class="assignment-table-wrap"><table class="assignment-table">
        <thead><tr><th>Class</th><th>Subject</th><th>Teacher(s)</th><th>Marks</th><th>Status</th><th></th></tr></thead>
        <tbody id="tpProgBody"><tr><td colspan="6">Loading...</td></tr></tbody></table></div>
    </section>`;
  }

  window.tpLoadProgress = async function (seqId) {
    const body = $("tpProgBody"); if (!body) return;
    try {
      progData = await portalControlRequest("getMarkProgress", { sequenceId: seqId });
      $("tpProgSeq").innerHTML = progData.sequences.map(q => `<option value="${esc(q.sequenceId)}" ${q.sequenceId === progData.sequenceId ? "selected" : ""}>Sequence ${esc(q.number)}${q.open ? "" : " (closed)"}</option>`).join("");
      tpRenderProgress();
    } catch (err) { body.innerHTML = '<tr><td colspan="6">Unable to load progress.</td></tr>'; $("tpProgMsg").textContent = err.message; $("tpProgMsg").style.color = "#b42318"; }
  };

  window.tpRenderProgress = function () {
    const body = $("tpProgBody"); if (!body) return;
    const st = $("tpProgStatus").value, q = ($("tpProgSearch").value || "").trim().toLowerCase(), rows = progData.rows || [];
    const done = rows.filter(r => r.status === "SUBMITTED").length;
    $("tpProgSummary").textContent = rows.length ? done + " of " + rows.length + " class-subjects are complete." : "";
    const list = rows.filter(r => (st === "ALL" || r.status === st) && (!q || [r.className, r.subjectName, (r.teachers || []).join(" ")].join(" ").toLowerCase().includes(q)));
    body.innerHTML = list.length ? list.map(r => {
      const cls = r.status === "SUBMITTED" ? "done" : r.status === "IN_PROGRESS" ? "part" : "";
      const label = r.status === "SUBMITTED" ? "✓ Complete" : r.status === "IN_PROGRESS" ? "In progress" : "Not started";
      return `<tr><td>${esc(r.className)}</td><td>${esc(r.subjectName)}</td><td>${r.teachers && r.teachers.length ? esc(r.teachers.join(", ")) : "<small>— none —</small>"}</td>
        <td>${esc(r.entered)} / ${esc(r.total)}</td><td><span class="tp-chip ${cls}">${label}</span></td>
        <td>${r.status === "SUBMITTED" ? `<button class="teacher-action" type="button" onclick="tpReopen('${esc(r.classSubjectId)}')">Reopen</button>` : ""}</td></tr>`;
    }).join("") : '<tr><td colspan="6">Nothing to show.</td></tr>';
  };

  window.tpReopen = async function (csId) {
    if (!confirm("Reopen these marks so the teacher can edit them again?")) return;
    try {
      const r = await portalControlRequest("reopenMarkSubmission", { classSubjectId: csId, sequenceId: progData.sequenceId });
      $("tpProgMsg").style.color = "#16803c"; $("tpProgMsg").textContent = r.message;
      await tpLoadProgress(progData.sequenceId);
    } catch (err) { $("tpProgMsg").style.color = "#b42318"; $("tpProgMsg").textContent = err.message; }
  };
})();
