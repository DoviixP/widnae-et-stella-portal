/* teacher-portal.js — teacher username/password sign-in, teacher dashboard,
   admin login management and assignment tools. Loaded AFTER the main script in index.html.
   Bilingual: English / French. Only interface text is translated; names of classes,
   subjects, teachers and students always come from the data and are never changed. */
(function () {
  const $ = id => document.getElementById(id);
  const esc = v => escapeTeacherText(v);

  /* ───────── 0) Translations ───────── */
  const I18N = {
    en: {
      language: "Language",
      teacherSignIn: "Teacher sign-in", username: "Username", password: "Password",
      signIn: "Sign in", signingIn: "Signing in...", signInFailed: "Sign-in failed.",
      invalidLogin: "The server returned an invalid login response.",
      requestFailed: "Request failed ({status}).",
      roleTeacher: "TEACHER",
      teacherDashboard: "Teacher Dashboard", myClasses: "My classes and subjects",
      clickHint: "Click a class to enter marks. A {tick} means you marked it as complete.",
      colClass: "Class", colSubject: "Subject", colCoef: "Coef", colMarksBySeq: "Marks by sequence",
      loading: "Loading...", enterMarks: "Enter marks",
      noAssign: "No classes have been assigned to you yet. Contact the school administration.",
      unableLoadClasses: "Unable to load your classes.",
      seq: "Seq {n}", seqLong: "Sequence", closed: "closed",
      stComplete: "✓ complete", stNotStarted: "not started",
      unsaved: "You have unsaved marks. Leave without saving them?",
      loadingSheet: "Loading the mark sheet...", backToClasses: "Back to my classes", myClassesBtn: "← My classes",
      coefParen: "(coef {c})",
      completeTitle: "✓ Marked as complete.",
      completeBody: "These marks are locked. To correct something, ask the administration to reopen them.",
      closedSeq: "This sequence is closed. Marks can no longer be changed.",
      sheetHint: "Marks are out of 20. Leave the box empty for a student who did not write.",
      colMatricule: "Matricule", colStudent: "Student", colMark: "Mark /20",
      noStudents: "No students found for this class and subject.",
      saveMarks: "Save marks", markComplete: "Mark as complete ✓",
      countLine: "{n} of {total} students have a mark", unsavedChanges: "unsaved changes",
      nothingToSave: "Nothing new to save.", marksRange: "Marks must be between 0 and 20.",
      saved: "Saved.", savedCount: "{entered} of {total} students have a mark.",
      enterOne: "Enter at least one mark before marking this as complete.",
      confirmComplete: "Mark {subject} ({cls}) as complete?\n\n{n} of {total} students have a mark. Students without a mark are treated as not having written.\nAfter this the marks are locked.",
      teacherMgmt: "Teacher Management",
      teacherIntro: "Teachers sign in with a username and password. Teachers from the school software appear here after a sync.",
      searchTeacher: "Search by name or username",
      allAccounts: "All accounts", active: "Active", deactivated: "Deactivated",
      allLogins: "All logins", loginReady: "Login ready", noLoginYet: "No login yet",
      generateLogins: "Generate logins",
      colTeacher: "Teacher", colLogin: "Login", colAccount: "Account", colActions: "Actions", colStatus: "Status", colAction: "Action",
      loadingTeachers: "Loading teachers...", noTeachers: "No teachers found.", unnamed: "Unnamed teacher",
      pillLoginReady: "LOGIN READY", pillNoLogin: "NO LOGIN", pillActive: "ACTIVE", pillDisabled: "DISABLED", pillRemoved: "REMOVED",
      resetPw: "Reset password", setLogin: "Set login", deactivate: "Deactivate", activate: "Activate",
      credsShown: "{n} login(s) created. The passwords are shown ONLY NOW — copy or download them before leaving this page.",
      credHeader: "Name\tUsername\tPassword",
      copy: "Copy", downloadCsv: "Download CSV", hide: "Hide",
      copied: "Copied.", pressCtrlC: "Press Ctrl+C to copy the selected text.",
      confirmGen: "Create a username and password for every active teacher who has no login yet?",
      creating: "Creating logins... {n} done", done: "Done.",
      allHaveLogin: "Every active teacher already has a login.",
      promptPw: "New password for {name} (8+ characters).\nLeave empty to generate one automatically.",
      thisTeacher: "this teacher", pwShort: "The password must have at least 8 characters.",
      assignMgmt: "Teacher Assignment Management",
      assignIntro: "Assign teachers to a class and subject. Several teachers can share the same class and subject.",
      autoTitle: "Auto-assign from the school software",
      autoDesc: "Links each class-subject to the teacher whose name matches the name in the school software. You see a preview first and nothing is saved until you confirm.",
      previewAuto: "Preview auto-assign",
      selectTeacher: "Select teacher", selectCS: "Select class and subject", assign: "Assign",
      filterAssign: "Filter assignments by teacher, class or subject",
      loadingAssign: "Loading assignments...", noAssignFound: "No assignments found.",
      noActiveTeachers: "No active teachers yet. Sync from the school software first.",
      noCS: "No class-subjects available yet. Sync classes and subjects from the school software first.",
      unableAssign: "Unable to load assignments.", remove: "Remove", restore: "Restore",
      checking: "Checking...",
      unmatched: "Names with no matching teacher: {names}",
      willAssign: "{n} class-subject(s) will be assigned.",
      autoStats: "Already assigned: {a} · No teacher name in the school software: {b} · Ambiguous names: {c}",
      confirmAssignBtn: "Confirm and assign {n}", confirmCreate: "Create {n} assignments now?",
      progTitle: "Mark Entry Progress", progDesc: "Which class-subjects the teachers have marked as complete (✓).",
      all: "All", optComplete: "✓ Complete", optInProgress: "In progress", optNotStarted: "Not started",
      filterProg: "Filter by class, subject or teacher",
      progSummary: "{d} of {n} class-subjects are complete.",
      colTeachersP: "Teacher(s)", colMarks: "Marks", none: "— none —", reopen: "Reopen",
      nothing: "Nothing to show.", unableProg: "Unable to load progress.",
      confirmReopen: "Reopen these marks so the teacher can edit them again?"
    },
    fr: {
      language: "Langue",
      teacherSignIn: "Connexion enseignant", username: "Nom d'utilisateur", password: "Mot de passe",
      signIn: "Se connecter", signingIn: "Connexion en cours...", signInFailed: "Échec de la connexion.",
      invalidLogin: "Le serveur a renvoyé une réponse de connexion invalide.",
      requestFailed: "Échec de la requête ({status}).",
      roleTeacher: "ENSEIGNANT",
      teacherDashboard: "Tableau de bord enseignant", myClasses: "Mes classes et matières",
      clickHint: "Cliquez sur une classe pour saisir les notes. Un {tick} signifie que vous l'avez marquée comme terminée.",
      colClass: "Classe", colSubject: "Matière", colCoef: "Coef", colMarksBySeq: "Notes par séquence",
      loading: "Chargement...", enterMarks: "Saisir les notes",
      noAssign: "Aucune classe ne vous a encore été attribuée. Contactez l'administration de l'école.",
      unableLoadClasses: "Impossible de charger vos classes.",
      seq: "Séq {n}", seqLong: "Séquence", closed: "clôturée",
      stComplete: "✓ terminée", stNotStarted: "non commencée",
      unsaved: "Vous avez des notes non enregistrées. Quitter sans les enregistrer ?",
      loadingSheet: "Chargement de la feuille de notes...", backToClasses: "Retour à mes classes", myClassesBtn: "← Mes classes",
      coefParen: "(coef {c})",
      completeTitle: "✓ Marquée comme terminée.",
      completeBody: "Ces notes sont verrouillées. Pour corriger quelque chose, demandez à l'administration de les rouvrir.",
      closedSeq: "Cette séquence est clôturée. Les notes ne peuvent plus être modifiées.",
      sheetHint: "Les notes sont sur 20. Laissez la case vide pour un élève qui n'a pas composé.",
      colMatricule: "Matricule", colStudent: "Élève", colMark: "Note /20",
      noStudents: "Aucun élève trouvé pour cette classe et cette matière.",
      saveMarks: "Enregistrer les notes", markComplete: "Marquer comme terminée ✓",
      countLine: "{n} élève(s) sur {total} ont une note", unsavedChanges: "modifications non enregistrées",
      nothingToSave: "Rien de nouveau à enregistrer.", marksRange: "Les notes doivent être comprises entre 0 et 20.",
      saved: "Enregistré.", savedCount: "{entered} élève(s) sur {total} ont une note.",
      enterOne: "Saisissez au moins une note avant de marquer comme terminée.",
      confirmComplete: "Marquer {subject} ({cls}) comme terminée ?\n\n{n} élève(s) sur {total} ont une note. Les élèves sans note sont considérés comme n'ayant pas composé.\nAprès cela, les notes sont verrouillées.",
      teacherMgmt: "Gestion des enseignants",
      teacherIntro: "Les enseignants se connectent avec un nom d'utilisateur et un mot de passe. Les enseignants du logiciel de l'école apparaissent ici après une synchronisation.",
      searchTeacher: "Rechercher par nom ou nom d'utilisateur",
      allAccounts: "Tous les comptes", active: "Actifs", deactivated: "Désactivés",
      allLogins: "Toutes les connexions", loginReady: "Connexion prête", noLoginYet: "Pas encore de connexion",
      generateLogins: "Générer les connexions",
      colTeacher: "Enseignant", colLogin: "Connexion", colAccount: "Compte", colActions: "Actions", colStatus: "Statut", colAction: "Action",
      loadingTeachers: "Chargement des enseignants...", noTeachers: "Aucun enseignant trouvé.", unnamed: "Enseignant sans nom",
      pillLoginReady: "CONNEXION PRÊTE", pillNoLogin: "SANS CONNEXION", pillActive: "ACTIF", pillDisabled: "DÉSACTIVÉ", pillRemoved: "RETIRÉE",
      resetPw: "Réinitialiser le mot de passe", setLogin: "Créer la connexion", deactivate: "Désactiver", activate: "Activer",
      credsShown: "{n} connexion(s) créée(s). Les mots de passe ne sont affichés QU'UNE SEULE FOIS — copiez-les ou téléchargez-les avant de quitter cette page.",
      credHeader: "Nom\tNom d'utilisateur\tMot de passe",
      copy: "Copier", downloadCsv: "Télécharger le CSV", hide: "Masquer",
      copied: "Copié.", pressCtrlC: "Appuyez sur Ctrl+C pour copier le texte sélectionné.",
      confirmGen: "Créer un nom d'utilisateur et un mot de passe pour chaque enseignant actif qui n'a pas encore de connexion ?",
      creating: "Création des connexions... {n} terminée(s)", done: "Terminé.",
      allHaveLogin: "Tous les enseignants actifs ont déjà une connexion.",
      promptPw: "Nouveau mot de passe pour {name} (8 caractères minimum).\nLaissez vide pour en générer un automatiquement.",
      thisTeacher: "cet enseignant", pwShort: "Le mot de passe doit contenir au moins 8 caractères.",
      assignMgmt: "Gestion des affectations des enseignants",
      assignIntro: "Affectez des enseignants à une classe et une matière. Plusieurs enseignants peuvent partager la même classe et la même matière.",
      autoTitle: "Affectation automatique depuis le logiciel de l'école",
      autoDesc: "Associe chaque classe-matière à l'enseignant dont le nom correspond à celui du logiciel de l'école. Vous voyez d'abord un aperçu et rien n'est enregistré avant votre confirmation.",
      previewAuto: "Aperçu de l'affectation automatique",
      selectTeacher: "Choisir un enseignant", selectCS: "Choisir une classe et une matière", assign: "Affecter",
      filterAssign: "Filtrer les affectations par enseignant, classe ou matière",
      loadingAssign: "Chargement des affectations...", noAssignFound: "Aucune affectation trouvée.",
      noActiveTeachers: "Aucun enseignant actif pour le moment. Synchronisez d'abord depuis le logiciel de l'école.",
      noCS: "Aucune classe-matière disponible pour le moment. Synchronisez d'abord les classes et les matières depuis le logiciel de l'école.",
      unableAssign: "Impossible de charger les affectations.", remove: "Retirer", restore: "Rétablir",
      checking: "Vérification...",
      unmatched: "Noms sans enseignant correspondant : {names}",
      willAssign: "{n} classe(s)-matière(s) seront affectée(s).",
      autoStats: "Déjà affectées : {a} · Sans nom d'enseignant dans le logiciel de l'école : {b} · Noms ambigus : {c}",
      confirmAssignBtn: "Confirmer et affecter {n}", confirmCreate: "Créer {n} affectations maintenant ?",
      progTitle: "Avancement de la saisie des notes", progDesc: "Les classes-matières que les enseignants ont marquées comme terminées (✓).",
      all: "Tous", optComplete: "✓ Terminé", optInProgress: "En cours", optNotStarted: "Non commencé",
      filterProg: "Filtrer par classe, matière ou enseignant",
      progSummary: "{d} classe(s)-matière(s) sur {n} sont terminées.",
      colTeachersP: "Enseignant(s)", colMarks: "Notes", none: "— aucun —", reopen: "Rouvrir",
      nothing: "Rien à afficher.", unableProg: "Impossible de charger l'avancement.",
      confirmReopen: "Rouvrir ces notes pour que l'enseignant puisse les modifier à nouveau ?"
    }
  };

  let LANG = "en";
  try {
    const saved = localStorage.getItem("wes_lang");
    LANG = saved === "fr" || saved === "en" ? saved : ((navigator.language || "en").toLowerCase().startsWith("fr") ? "fr" : "en");
  } catch (e) { /* storage blocked: stay on default */ }
  document.documentElement.lang = LANG;

  const t = (key, vars) => {
    let s = (I18N[LANG] && I18N[LANG][key]) || I18N.en[key] || key;
    if (vars) for (const k in vars) s = s.split("{" + k + "}").join(vars[k]);
    return s;
  };
  window.tpT = t; /* so the main script can use the same translations if you want */
  window.tpLang = () => LANG;

  /* Server requests also tell the backend which language is active (optional for it to use). */
  window.portalControlRequest = async function (action, extra = {}) {
    const res = await fetch(API_URL, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, payload: { token: sessionStorage.getItem("wes_session_token"), lang: LANG, ...extra } })
    });
    let data = {}; try { data = await res.json(); } catch (e) { /* not JSON */ }
    if (!res.ok || !data.ok) throw new Error(data.error || data.message || t("requestFailed", { status: res.status }));
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
    .tp-bar{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:14px 0}
    #tpLang{position:fixed;top:10px;right:10px;z-index:9999;display:flex;gap:4px;background:#fff;border:1px solid #d8dee8;border-radius:8px;padding:4px;box-shadow:0 2px 8px rgba(0,0,0,.08)}
    #tpLang button{border:0;border-radius:5px;padding:5px 10px;cursor:pointer;font-weight:700;font-size:12px;background:transparent;color:#53647a}
    #tpLang button.on{background:#102b50;color:#fff}`;
  document.head.appendChild(css);

  /* Language switcher (always visible, top-right) */
  const langBox = document.createElement("div");
  langBox.id = "tpLang";
  langBox.setAttribute("role", "group");
  langBox.innerHTML = `<button type="button" data-lang="en" title="English">EN</button><button type="button" data-lang="fr" title="Français">FR</button>`;
  document.body.appendChild(langBox);
  langBox.addEventListener("click", e => {
    const b = e.target.closest("button[data-lang]");
    if (b) setLang(b.dataset.lang);
  });

  /* Static pieces (login form) carry data-i18n so they can be re-labelled. */
  function applyStatic() {
    document.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
    langBox.querySelectorAll("button").forEach(b => {
      b.classList.toggle("on", b.dataset.lang === LANG);
      b.setAttribute("aria-pressed", b.dataset.lang === LANG ? "true" : "false");
    });
    langBox.setAttribute("aria-label", t("language"));
  }

  function setLang(l) {
    if (l !== "en" && l !== "fr") return;
    if (l === LANG) return;
    LANG = l;
    try { localStorage.setItem("wes_lang", l); } catch (e) { /* ignore */ }
    document.documentElement.lang = l;
    applyStatic();
    rerender();
  }
  window.tpSetLang = setLang;

  /* Re-draw whatever screen is open, in the new language, without losing unsaved marks. */
  function rerender() {
    const dash = $("dashboard");
    if (!dash || dash.style.display === "none" || !lastUser) return;
    if (lastUser.role === "TEACHER") {
      $("userRole").textContent = t("roleTeacher");
      if (sheet) renderSheet(); else renderHome();
    } else {
      window.showDashboard(lastUser); /* admin: rebuild with the translated markup functions */
    }
  }

  /* ───────── 1) Teacher sign-in box under the Google button ───────── */
  $("loginSection").insertAdjacentHTML("beforeend", `
    <div class="divider"></div>
    <h3 style="margin-bottom:12px" data-i18n="teacherSignIn"></h3>
    <form id="tpLoginForm" style="text-align:left">
      <label for="tpUser" data-i18n="username"></label>
      <input class="tp-input" id="tpUser" autocomplete="username" autocapitalize="none" required>
      <label for="tpPass" data-i18n="password"></label>
      <input class="tp-input" id="tpPass" type="password" autocomplete="current-password" required>
      <button class="tp-btn" type="submit" style="width:100%" data-i18n="signIn"></button>
    </form>
    <p class="status" id="tpLoginStatus"></p>`);
  applyStatic();

  $("tpLoginForm").addEventListener("submit", async e => {
    e.preventDefault();
    const st = $("tpLoginStatus");
    st.style.color = "#53647a"; st.textContent = t("signingIn");
    try {
      const res = await fetch(API_URL, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "teacherLogin", payload: { username: $("tpUser").value, password: $("tpPass").value, lang: LANG } })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || data.message || t("signInFailed"));
      const r = data.result;
      if (!r || !r.success || !r.token) throw new Error(t("invalidLogin"));
      sessionStorage.setItem("wes_session_token", r.token);
      $("tpPass").value = ""; st.textContent = "";
      await showDashboard(r);
    } catch (err) { st.style.color = "#c0392b"; st.textContent = err.message || t("signInFailed"); }
  });

  /* ───────── 2) Teacher dashboard + mark sheet ───────── */
  const originalShowDashboard = window.showDashboard;
  let lastUser = null;
  window.showDashboard = async function (user) {
    if (user) lastUser = user;
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
    $("userRole").textContent = t("roleTeacher");
    await renderHome();
    await loadPortalState();
  }

  async function renderHome() {
    $("dashboardContent").innerHTML = `
      <div class="user-panel">
        <h2>${t("teacherDashboard")}</h2>
      </div>
      <section class="assignment-management">
        <h2>${t("myClasses")}</h2>
        <p id="tpMyMsg">${t("clickHint", { tick: '<span class="tp-tick">✓</span>' })}</p>
        <div class="assignment-table-wrap"><table class="assignment-table">
          <thead><tr><th>${t("colClass")}</th><th>${t("colSubject")}</th><th>${t("colCoef")}</th><th>${t("colMarksBySeq")}</th><th></th></tr></thead>
          <tbody id="tpMyBody"><tr><td colspan="5">${t("loading")}</td></tr></tbody>
        </table></div>
      </section>`;
    await tpLoadMine();
  }

  async function tpLoadMine() {
    try {
      const r = await portalControlRequest("getMyAssignments");
      const items = r.assignments || [], seqs = r.sequences || [];
      const chip = (q, p) => {
        const st = p ? p.status : "NONE";
        const cls = st === "SUBMITTED" ? "done" : st === "IN_PROGRESS" ? "part" : "";
        const txt = st === "SUBMITTED" ? t("stComplete") : st === "IN_PROGRESS" ? p.entered + "/" + p.total : t("stNotStarted");
        return `<span class="tp-chip ${cls}">${esc(t("seq", { n: q.number }))}: ${esc(txt)}</span>`;
      };
      $("tpMyBody").innerHTML = items.length ? items.map(a => {
        const done = seqs.length > 0 && seqs.every(q => a.progress && a.progress[q.sequenceId] && a.progress[q.sequenceId].status === "SUBMITTED");
        return `<tr class="tp-row" onclick="tpOpenSheet('${esc(a.classSubjectId)}')">
          <td>${esc(a.className)}</td><td>${done ? '<span class="tp-tick">✓</span> ' : ""}${esc(a.subjectName)}</td><td>${esc(a.coefficient)}</td>
          <td>${seqs.map(q => chip(q, a.progress && a.progress[q.sequenceId])).join("")}</td><td><button class="tp-btn" type="button">${t("enterMarks")}</button></td></tr>`;
      }).join("") : `<tr><td colspan="5">${t("noAssign")}</td></tr>`;
    } catch (err) {
      $("tpMyBody").innerHTML = `<tr><td colspan="5">${t("unableLoadClasses")}</td></tr>`;
      $("tpMyMsg").textContent = err.message;
    }
  }

  const dirtyCount = () => (sheet ? Object.keys(sheet.dirty).length : 0);
  const sheetMsg = (txt, bad) => { const m = $("tpSheetMsg"); if (m) { m.textContent = txt; m.style.color = bad ? "#b42318" : "#16803c"; } };

  window.tpOpenSheet = async function (csId, seqId) {
    if (sheet && dirtyCount() && !confirm(t("unsaved"))) {
      if ($("tpSeqSel")) $("tpSeqSel").value = sheet.d.sequenceId;
      return;
    }
    $("dashboardContent").innerHTML = `<div class="user-panel"><p>${t("loadingSheet")}</p></div>`;
    try {
      const d = await portalControlRequest("getMarkSheet", { classSubjectId: csId, sequenceId: seqId });
      sheet = { csId, d, dirty: {}, orig: {} };
      d.students.forEach(s => { sheet.orig[s.studentId] = s.mark === null ? "" : String(s.mark); });
      renderSheet();
    } catch (err) {
      sheet = null;
      $("dashboardContent").innerHTML = `<div class="user-panel"><p style="color:#b42318">${esc(err.message)}</p><button class="tp-btn" type="button" onclick="tpBack()">${t("backToClasses")}</button></div>`;
    }
  };

  window.tpBack = async function () {
    if (sheet && dirtyCount() && !confirm(t("unsaved"))) return;
    sheet = null; await renderHome();
  };

  function renderSheet() {
    const d = sheet.d, c = d.classSubject;
    const seqOpts = d.sequences.map(q => `<option value="${esc(q.sequenceId)}" ${q.sequenceId === d.sequenceId ? "selected" : ""}>${esc(t("seqLong"))} ${esc(q.number)}${q.open ? "" : " (" + esc(t("closed")) + ")"}</option>`).join("");
    const banner = d.submitted
      ? `<div class="tp-box" style="background:#e7f6ec;border-color:#b7e1c4"><strong>${t("completeTitle")}</strong> ${t("completeBody")}</div>`
      : (!d.open ? `<div class="tp-box">${t("closedSeq")}</div>` : "");
    const rows = d.students.map((s, i) => {
      const changed = Object.prototype.hasOwnProperty.call(sheet.dirty, s.studentId);
      const val = changed ? sheet.dirty[s.studentId] : (s.mark === null ? "" : s.mark);
      return `<tr><td>${i + 1}</td><td>${esc(s.matricule)}</td><td>${esc(s.name)}</td>
      <td><input class="tp-mark${changed ? " tp-changed" : ""}" data-sid="${esc(s.studentId)}" type="text" inputmode="decimal" autocomplete="off" maxlength="5" value="${esc(val)}" ${d.locked ? "disabled" : ""}></td></tr>`;
    }).join("");
    $("dashboardContent").innerHTML = `
      <section class="assignment-management">
        <button class="tp-btn alt" type="button" onclick="tpBack()">${t("myClassesBtn")}</button>
        <h2 style="margin-top:14px">${esc(c.className)} — ${esc(c.subjectName)} <small style="font-weight:400">${esc(t("coefParen", { c: c.coefficient }))}</small></h2>
        <div class="tp-bar"><label for="tpSeqSel"><strong>${t("seqLong")}</strong></label>
          <select id="tpSeqSel" onchange="tpOpenSheet('${esc(sheet.csId)}', this.value)" style="padding:9px;border:1px solid #d8dee8;border-radius:7px">${seqOpts}</select>
          <span id="tpCount" style="font-size:13px;color:#53647a"></span></div>
        ${banner}
        <p style="font-size:13px;color:#53647a;margin-bottom:8px">${t("sheetHint")}</p>
        <div class="assignment-table-wrap"><table class="assignment-table">
          <thead><tr><th>#</th><th>${t("colMatricule")}</th><th>${t("colStudent")}</th><th>${t("colMark")}</th></tr></thead>
          <tbody id="tpSheetBody">${rows || `<tr><td colspan="4">${t("noStudents")}</td></tr>`}</tbody></table></div>
        ${d.locked ? "" : `<div class="tp-bar"><button class="tp-btn" type="button" onclick="tpSave()">${t("saveMarks")}</button>
          <button class="tp-btn alt" type="button" onclick="tpComplete()">${t("markComplete")}</button></div>`}
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
    const c = $("tpCount");
    if (c) c.textContent = t("countLine", { n, total: sheet.d.total }) + (dirtyCount() ? " · " + t("unsavedChanges") : "");
  }

  window.tpSave = async function (quiet) {
    const entries = Object.entries(sheet.dirty);
    if (!entries.length) { if (!quiet) sheetMsg(t("nothingToSave")); return true; }
    for (const [sid, v] of entries) {
      const n = Number(String(v).replace(",", "."));
      if (v !== "" && !(n >= 0 && n <= 20)) {
        sheetMsg(t("marksRange"), true);
        const el = document.querySelector('.tp-mark[data-sid="' + sid + '"]'); if (el) el.focus();
        return false;
      }
    }
    try {
      const r = await portalControlRequest("saveMarks", { classSubjectId: sheet.csId, sequenceId: sheet.d.sequenceId, marks: entries.map(([studentId, mark]) => ({ studentId, mark })) });
      entries.forEach(([sid, v]) => { sheet.orig[sid] = v; });
      sheet.dirty = {};
      document.querySelectorAll(".tp-mark.tp-changed").forEach(el => el.classList.remove("tp-changed"));
      sheetMsg(t("saved") + " " + t("savedCount", { entered: r.entered, total: r.total })); updateCount();
      return true;
    } catch (err) { sheetMsg(err.message, true); return false; }
  };

  window.tpComplete = async function () {
    const n = [...document.querySelectorAll(".tp-mark")].filter(el => el.value.trim() !== "").length, c = sheet.d.classSubject;
    if (!n) { sheetMsg(t("enterOne"), true); return; }
    if (!confirm(t("confirmComplete", { subject: c.subjectName, cls: c.className, n, total: sheet.d.total }))) return;
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
      <h2>${t("teacherMgmt")}</h2>
      <p>${t("teacherIntro")}</p>
      <div class="teacher-toolbar">
        <input id="teacherSearch" type="search" placeholder="${esc(t("searchTeacher"))}" oninput="filterTeacherRows()">
        <select id="teacherStatusFilter" onchange="filterTeacherRows()">
          <option value="ALL">${t("allAccounts")}</option><option value="ACTIVE">${t("active")}</option><option value="DISABLED">${t("deactivated")}</option>
        </select>
        <select id="teacherLoginFilter" onchange="filterTeacherRows()">
          <option value="ALL">${t("allLogins")}</option><option value="READY">${t("loginReady")}</option><option value="NONE">${t("noLoginYet")}</option>
        </select>
        <button class="tp-btn" type="button" onclick="tpGenerateLogins()">${t("generateLogins")}</button>
      </div>
      <p id="teacherFeedback" role="status"></p>
      <div id="tpCreds"></div>
      <div class="teacher-table-wrap"><table class="teacher-table">
        <thead><tr><th>${t("colTeacher")}</th><th>${t("colLogin")}</th><th>${t("colAccount")}</th><th>${t("colActions")}</th></tr></thead>
        <tbody id="teacherTableBody"><tr><td colspan="4">${t("loadingTeachers")}</td></tr></tbody>
      </table></div>
    </section>`;
  };

  window.renderTeacherRows = function (items) {
    const body = $("teacherTableBody"); if (!body) return;
    if (!items.length) { body.innerHTML = `<tr><td colspan="4">${t("noTeachers")}</td></tr>`; return; }
    body.innerHTML = items.map(x => {
      const on = x.status === "ACTIVE";
      return `<tr>
        <td><strong>${esc(x.displayName || t("unnamed"))}</strong><br><small>${esc(x.username || x.email)}</small></td>
        <td><span class="teacher-pill ${x.hasPassword ? "active" : "inactive"}">${x.hasPassword ? t("pillLoginReady") : t("pillNoLogin")}</span></td>
        <td><span class="teacher-pill ${on ? "active" : "inactive"}">${on ? t("pillActive") : t("pillDisabled")}</span></td>
        <td>
          <button class="teacher-action" onclick="tpSetPassword('${esc(x.teacherId)}')">${x.hasPassword ? t("resetPw") : t("setLogin")}</button>
          <button class="${on ? "teacher-danger" : "teacher-success"}" onclick="changeTeacherStatus('${esc(x.teacherId)}','${on ? "DISABLED" : "ACTIVE"}')">${on ? t("deactivate") : t("activate")}</button>
        </td></tr>`;
    }).join("");
  };

  window.filterTeacherRows = function () {
    const q = ($("teacherSearch")?.value || "").trim().toLowerCase();
    const st = $("teacherStatusFilter")?.value || "ALL", lg = $("teacherLoginFilter")?.value || "ALL";
    renderTeacherRows(teacherRecords.filter(x =>
      (!q || String(x.displayName).toLowerCase().includes(q) || String(x.username || "").toLowerCase().includes(q) || String(x.email).toLowerCase().includes(q)) &&
      (st === "ALL" || x.status === st) &&
      (lg === "ALL" || (lg === "READY") === !!x.hasPassword)));
  };

  let lastCreds = [];
  function showCreds(list) {
    lastCreds = list;
    const text = t("credHeader") + "\n" + list.map(x => [x.name, x.username, x.password].join("\t")).join("\n");
    $("tpCreds").innerHTML = `<div class="tp-box"><strong>${t("credsShown", { n: list.length })}</strong>
      <textarea id="tpCredText" readonly rows="${Math.min(12, list.length + 2)}">${esc(text)}</textarea>
      <button class="tp-btn" type="button" onclick="tpCopyCreds()">${t("copy")}</button>
      <button class="tp-btn alt" type="button" onclick="tpDownloadCreds()">${t("downloadCsv")}</button>
      <button class="tp-btn alt" type="button" onclick="document.getElementById('tpCreds').innerHTML=''">${t("hide")}</button></div>`;
  }
  window.tpCopyCreds = async function () {
    try { await navigator.clipboard.writeText($("tpCredText").value); teacherFeedback(t("copied")); }
    catch (e) { $("tpCredText").select(); teacherFeedback(t("pressCtrlC")); }
  };
  window.tpDownloadCreds = function () {
    const q = s => '"' + String(s).replace(/"/g, '""') + '"';
    const csv = "name,username,password\n" + lastCreds.map(x => [x.name, x.username, x.password].map(q).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "teacher-logins.csv"; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };

  window.tpGenerateLogins = async function () {
    if (!confirm(t("confirmGen"))) return;
    let all = [], remaining = 1, rounds = 0;
    try {
      while (remaining > 0 && rounds++ < 10) {
        teacherFeedback(t("creating", { n: all.length }));
        const r = await portalControlRequest("generateTeacherLogins");
        const got = r.logins || [];
        all = all.concat(got); remaining = r.remaining || 0;
        if (!got.length) break;
      }
      teacherFeedback(all.length ? t("done") : t("allHaveLogin"));
    } catch (err) { teacherFeedback(err.message, true); }
    if (all.length) showCreds(all);
    await loadTeacherManagement();
  };

  window.tpSetPassword = async function (teacherId) {
    const x = teacherRecords.find(r => r.teacherId === teacherId); if (!x) return;
    const pw = prompt(t("promptPw", { name: x.displayName || t("thisTeacher") }), "");
    if (pw === null) return;
    if (pw && pw.length < 8) { teacherFeedback(t("pwShort"), true); return; }
    try {
      const r = await portalControlRequest("setTeacherCredentials", { teacherId, password: pw || undefined });
      showCreds([{ name: x.displayName, username: r.username, password: r.password }]);
      teacherFeedback(r.message);
      await loadTeacherManagement();
    } catch (err) { teacherFeedback(err.message, true); }
  };

  /* ───────── 4) Admin: assignments + auto-assign ───────── */
  window.assignmentManagementMarkup = function () {
    return `
    <section class="assignment-management">
      <h2>${t("assignMgmt")}</h2>
      <p>${t("assignIntro")}</p>
      <div class="tp-box"><strong>${t("autoTitle")}</strong>
        <p style="margin:6px 0 10px">${t("autoDesc")}</p>
        <button class="tp-btn" type="button" onclick="tpAutoPreview()">${t("previewAuto")}</button>
        <div id="tpAuto"></div></div>
      <form class="assignment-form" onsubmit="createTeacherAssignment(event)">
        <select id="assignmentTeacher" required><option value="">${t("selectTeacher")}</option></select>
        <select id="assignmentClassSubject" required><option value="">${t("selectCS")}</option></select>
        <button class="teacher-primary" type="submit">${t("assign")}</button>
      </form>
      <input class="tp-input" id="assignmentSearch" type="search" placeholder="${esc(t("filterAssign"))}" oninput="renderTeacherAssignments()">
      <p id="assignmentFeedback" role="status"></p>
      <div class="assignment-table-wrap"><table class="assignment-table">
        <thead><tr><th>${t("colTeacher")}</th><th>${t("colClass")}</th><th>${t("colSubject")}</th><th>${t("colStatus")}</th><th>${t("colAction")}</th></tr></thead>
        <tbody id="assignmentTableBody"><tr><td colspan="5">${t("loadingAssign")}</td></tr></tbody>
      </table></div>
    </section>`;
  };

  window.loadTeacherAssignments = async function () {
    const body = $("assignmentTableBody"); if (!body) return;
    body.innerHTML = `<tr><td colspan="5">${t("loadingAssign")}</td></tr>`;
    try {
      teacherAssignmentData = await portalControlRequest("getTeacherAssignmentData");
      $("assignmentTeacher").innerHTML = `<option value="">${t("selectTeacher")}</option>` +
        teacherAssignmentData.teachers.map(x => `<option value="${esc(x.teacherId)}">${esc(x.name)}${x.username ? " — " + esc(x.username) : ""}</option>`).join("");
      $("assignmentClassSubject").innerHTML = `<option value="">${t("selectCS")}</option>` +
        teacherAssignmentData.classSubjects.map(x => `<option value="${esc(x.classSubjectId)}">${esc(x.className)} — ${esc(x.subjectName)}${x.electronTeacher ? " (" + esc(x.electronTeacher) + ")" : ""}</option>`).join("");
      renderTeacherAssignments();
      if (!teacherAssignmentData.teachers.length) assignmentFeedback(t("noActiveTeachers"), true);
      else if (!teacherAssignmentData.classSubjects.length) assignmentFeedback(t("noCS"), true);
      else assignmentFeedback("");
    } catch (err) {
      body.innerHTML = `<tr><td colspan="5">${t("unableAssign")}</td></tr>`;
      assignmentFeedback(err.message, true);
    }
  };

  window.renderTeacherAssignments = function () {
    const body = $("assignmentTableBody"); if (!body) return;
    const q = ($("assignmentSearch")?.value || "").trim().toLowerCase();
    const items = (teacherAssignmentData.assignments || []).filter(a =>
      !q || [a.teacherName, a.teacherEmail, a.className, a.subjectName].join(" ").toLowerCase().includes(q));
    if (!items.length) { body.innerHTML = `<tr><td colspan="5">${t("noAssignFound")}</td></tr>`; return; }
    body.innerHTML = items.map(a => {
      const on = a.status === "ACTIVE";
      return `<tr>
        <td><strong>${esc(a.teacherName)}</strong><br><small>${esc(a.teacherEmail)}</small></td>
        <td>${esc(a.className)}</td><td>${esc(a.subjectName)}</td>
        <td><span class="teacher-pill ${on ? "active" : "inactive"}">${on ? t("pillActive") : t("pillRemoved")}</span></td>
        <td><button class="${on ? "teacher-danger" : "teacher-success"}" onclick="setTeacherAssignmentStatus('${esc(a.assignmentId)}','${on ? "INACTIVE" : "ACTIVE"}')">${on ? t("remove") : t("restore")}</button></td></tr>`;
    }).join("");
  };

  window.tpAutoPreview = async function () {
    const box = $("tpAuto"); box.textContent = t("checking");
    try {
      const r = await portalControlRequest("autoAssignFromNames", { confirm: false });
      const un = (r.unmatchedNames || []).length ? `<p style="margin-top:6px">${t("unmatched", { names: r.unmatchedNames.map(esc).join(", ") })}</p>` : "";
      box.innerHTML = `<p style="margin-top:10px">${t("willAssign", { n: "<strong>" + r.willAssign + "</strong>" })}<br>
        ${t("autoStats", { a: r.alreadyAssigned, b: r.noTeacherName, c: r.ambiguous })}</p>${un}` +
        (r.willAssign ? `<button class="tp-btn" type="button" style="margin-top:10px" onclick="tpAutoConfirm(${r.willAssign})">${t("confirmAssignBtn", { n: r.willAssign })}</button>` : "");
    } catch (err) { box.textContent = err.message; }
  };
  window.tpAutoConfirm = async function (n) {
    if (!confirm(t("confirmCreate", { n }))) return;
    try {
      const r = await portalControlRequest("autoAssignFromNames", { confirm: true });
      $("tpAuto").innerHTML = ""; assignmentFeedback(r.message || t("done"));
      await loadTeacherAssignments();
    } catch (err) { assignmentFeedback(err.message, true); }
  };

  /* ───────── 5) Admin: mark entry progress ───────── */
  let progData = { sequences: [], rows: [] };
  function progressMarkup() {
    return `
    <section class="assignment-management" id="tpProg">
      <h2>${t("progTitle")}</h2>
      <p>${t("progDesc")}</p>
      <div class="teacher-toolbar">
        <select id="tpProgSeq" onchange="tpLoadProgress(this.value)"></select>
        <select id="tpProgStatus" onchange="tpRenderProgress()">
          <option value="ALL">${t("all")}</option><option value="SUBMITTED">${t("optComplete")}</option><option value="IN_PROGRESS">${t("optInProgress")}</option><option value="NOT_STARTED">${t("optNotStarted")}</option>
        </select>
        <input id="tpProgSearch" type="search" placeholder="${esc(t("filterProg"))}" oninput="tpRenderProgress()">
      </div>
      <p id="tpProgSummary" style="font-size:13px"></p>
      <p id="tpProgMsg" role="status" style="font-size:13px"></p>
      <div class="assignment-table-wrap"><table class="assignment-table">
        <thead><tr><th>${t("colClass")}</th><th>${t("colSubject")}</th><th>${t("colTeachersP")}</th><th>${t("colMarks")}</th><th>${t("colStatus")}</th><th></th></tr></thead>
        <tbody id="tpProgBody"><tr><td colspan="6">${t("loading")}</td></tr></tbody></table></div>
    </section>`;
  }

  window.tpLoadProgress = async function (seqId) {
    const body = $("tpProgBody"); if (!body) return;
    try {
      progData = await portalControlRequest("getMarkProgress", { sequenceId: seqId });
      $("tpProgSeq").innerHTML = progData.sequences.map(q => `<option value="${esc(q.sequenceId)}" ${q.sequenceId === progData.sequenceId ? "selected" : ""}>${esc(t("seqLong"))} ${esc(q.number)}${q.open ? "" : " (" + esc(t("closed")) + ")"}</option>`).join("");
      tpRenderProgress();
    } catch (err) { body.innerHTML = `<tr><td colspan="6">${t("unableProg")}</td></tr>`; $("tpProgMsg").textContent = err.message; $("tpProgMsg").style.color = "#b42318"; }
  };

  window.tpRenderProgress = function () {
    const body = $("tpProgBody"); if (!body) return;
    const st = $("tpProgStatus").value, q = ($("tpProgSearch").value || "").trim().toLowerCase(), rows = progData.rows || [];
    const done = rows.filter(r => r.status === "SUBMITTED").length;
    $("tpProgSummary").textContent = rows.length ? t("progSummary", { d: done, n: rows.length }) : "";
    const list = rows.filter(r => (st === "ALL" || r.status === st) && (!q || [r.className, r.subjectName, (r.teachers || []).join(" ")].join(" ").toLowerCase().includes(q)));
    body.innerHTML = list.length ? list.map(r => {
      const cls = r.status === "SUBMITTED" ? "done" : r.status === "IN_PROGRESS" ? "part" : "";
      const label = r.status === "SUBMITTED" ? t("optComplete") : r.status === "IN_PROGRESS" ? t("optInProgress") : t("optNotStarted");
      return `<tr><td>${esc(r.className)}</td><td>${esc(r.subjectName)}</td><td>${r.teachers && r.teachers.length ? esc(r.teachers.join(", ")) : "<small>" + t("none") + "</small>"}</td>
        <td>${esc(r.entered)} / ${esc(r.total)}</td><td><span class="tp-chip ${cls}">${label}</span></td>
        <td>${r.status === "SUBMITTED" ? `<button class="teacher-action" type="button" onclick="tpReopen('${esc(r.classSubjectId)}')">${t("reopen")}</button>` : ""}</td></tr>`;
    }).join("") : `<tr><td colspan="6">${t("nothing")}</td></tr>`;
  };

  window.tpReopen = async function (csId) {
    if (!confirm(t("confirmReopen"))) return;
    try {
      const r = await portalControlRequest("reopenMarkSubmission", { classSubjectId: csId, sequenceId: progData.sequenceId });
      $("tpProgMsg").style.color = "#16803c"; $("tpProgMsg").textContent = r.message;
      await tpLoadProgress(progData.sequenceId);
    } catch (err) { $("tpProgMsg").style.color = "#b42318"; $("tpProgMsg").textContent = err.message; }
  };
})();
