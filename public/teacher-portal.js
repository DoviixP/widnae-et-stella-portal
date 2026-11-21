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
    #tpLoginForm label{font-size:13px;font-weight:600}`;
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

  /* ───────── 2) Teacher dashboard ───────── */
  const originalShowDashboard = window.showDashboard;
  window.showDashboard = async function (user) {
    if (user && user.role === "TEACHER") return teacherHome(user);
    return originalShowDashboard(user);
  };

  async function teacherHome(user) {
    $("loginSection").style.display = "none";
    $("dashboard").style.display = "block";
    $("userEmail").textContent = user.displayName || user.username || user.email || "";
    $("userRole").textContent = "TEACHER";
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
        <p id="tpMyMsg"></p>
        <div class="assignment-table-wrap"><table class="assignment-table">
          <thead><tr><th>Class</th><th>Subject</th><th>Coefficient</th></tr></thead>
          <tbody id="tpMyBody"><tr><td colspan="3">Loading...</td></tr></tbody>
        </table></div>
      </section>`;
    if (user.mustChangePassword) {
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
        $("tpMustChange").textContent = ""; e.target.reset();
      } catch (err) { m.style.color = "#b42318"; m.textContent = err.message; }
    });
    try {
      const r = await portalControlRequest("getMyAssignments");
      const items = r.assignments || [];
      $("tpMyBody").innerHTML = items.length
        ? items.map(a => `<tr><td>${esc(a.className)}</td><td>${esc(a.subjectName)}</td><td>${esc(a.coefficient)}</td></tr>`).join("")
        : '<tr><td colspan="3">No classes have been assigned to you yet. Contact the school administration.</td></tr>';
      $("tpMyMsg").textContent = items.length ? items.length + " class-subject(s) assigned to you." : "";
    } catch (err) {
      $("tpMyBody").innerHTML = '<tr><td colspan="3">Unable to load your classes.</td></tr>';
      $("tpMyMsg").textContent = err.message;
    }
    await loadPortalState();
  }

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
})();
