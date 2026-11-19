/* =====================================================================
   QEC API (preview edition).

   Every page talks to the platform only through window.QEC_API. In this preview
   the calls are answered in the browser (data kept on this device), so the whole
   flow can be shown without a server:

     Sign up -> choose a course -> pay (bKash / Nagad / bank / at the office)
     -> sales team verifies the payment and enrolls -> Student ID + PIN issued
     -> the student can open the private Student Portal.

   For launch, replace the bodies of these functions with fetch() calls to the
   QEC backend. Keep the same names, arguments and return shapes; no page needs to
   change. Real security (passwords, roles, who sees what) MUST be enforced by that
   backend: nothing in this file is a security boundary.
   ===================================================================== */
(function () {
  "use strict";
  var KEY = "qec.preview.db.v2";
  var S = window.QEC.store;

  function blank() {
    return { v: 2, accounts: [], enrollments: [], seq: { acc: 1000, enr: 5000, sid: {} } };
  }
  function load() {
    try { var d = JSON.parse(S.get(KEY) || "null"); if (d && d.v === 2) return d; } catch (e) {}
    return blank();
  }
  function save(d) { S.set(KEY, JSON.stringify(d)); }
  function now() { return new Date().toISOString(); }
  function ok(v) { return new Promise(function (res) { setTimeout(function () { res(v); }, 180); }); }
  function err(code, msg) { return new Promise(function (_, rej) { setTimeout(function () { var e = new Error(msg); e.code = code; rej(e); }, 180); }); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  /* ---------- validation shared with the backend ---------- */
  function normPhone(v) { return String(v || "").replace(/[\s-]/g, "").replace(/^\+?88/, ""); }
  var V = {
    phone: function (v) { return /^01[3-9]\d{8}$/.test(normPhone(v)); },
    email: function (v) { return !v || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim()); },
    name: function (v) { return String(v || "").trim().length >= 2; },
    password: function (v) { return String(v || "").length >= 8 && /[A-Za-z]/.test(v) && /\d/.test(v); },
    trx: function (v) { return /^[A-Za-z0-9]{6,20}$/.test(String(v || "").trim()); }
  };

  /* ---------- password hashing (preview: SHA-256 with a per-account salt) ---------- */
  function hex(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ("0" + b.toString(16)).slice(-2); }).join(""); }
  function fallbackHash(s) { var h1 = 0xdeadbeef, h2 = 0x41c6ce57; for (var i = 0; i < s.length; i++) { var c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); } return (h1 >>> 0).toString(16) + (h2 >>> 0).toString(16); }
  function hash(pw, salt) {
    var s = salt + ":" + pw;
    try {
      if (window.crypto && crypto.subtle && window.TextEncoder) {
        return crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)).then(hex).catch(function () { return fallbackHash(s); });
      }
    } catch (e) {}
    return Promise.resolve(fallbackHash(s));
  }
  function salt() { var a = ""; for (var i = 0; i < 16; i++) a += Math.floor(Math.random() * 16).toString(16); return a; }

  /* ---------- catalogue helpers ---------- */
  function course(id) { return (window.QEC_CATALOG.courses || []).filter(function (c) { return c.id === id; })[0] || null; }
  function publicAccount(a) { if (!a) return null; var c = clone(a); delete c.pass; delete c.salt; return c; }
  function decorate(e) {
    var x = clone(e), c = course(e.courseId);
    x.course = c ? { id: c.id, title: c.title, cls: c.cls, fee: c.fee, feeText: c.feeText, kind: c.kind, upcoming: !!c.upcoming } : { id: e.courseId, title: e.courseId };
    return x;
  }
  var ACTIVE = ["requested", "payment_submitted", "enrolled", "waitlist"];
  var WWW_SESSION = "qec.www.account";

  /* ---------- student ID: session year (2 digits) + class (1-2 digits) + serial (3 digits) ---------- */
  function newStudentId(d, cls) {
    var yy = String(new Date().getFullYear() + (new Date().getMonth() >= 9 ? 1 : 0)).slice(-2);
    var k = yy + String(cls);
    d.seq.sid[k] = (d.seq.sid[k] || 0) + 1;
    return k + ("00" + d.seq.sid[k]).slice(-3);
  }
  function newPin() { return String(Math.floor(100000 + Math.random() * 900000)); }

  var API = {
    validators: V,
    normPhone: normPhone,

    /* ===== public website: account ===== */
    signup: function (f) {
      var d = load();
      f = f || {};
      if (!V.name(f.name)) return err("name", "Write the student's full name.");
      if (!V.name(f.guardian)) return err("guardian", "Write the guardian's name.");
      if (!V.phone(f.phone)) return err("phone", "Use an 11-digit mobile number that starts with 01.");
      if (!V.email(f.email)) return err("email", "Check the email address.");
      if (["4", "5", "6", "8", "9"].indexOf(String(f.cls)) < 0) return err("cls", "Choose the student's class.");
      if (["BV", "EV"].indexOf(f.version) < 0) return err("version", "Choose Bangla or English version.");
      if (!V.password(f.password)) return err("password", "Use at least 8 characters with a letter and a number.");
      var phone = normPhone(f.phone);
      if (d.accounts.some(function (a) { return a.phone === phone; })) return err("phone", "An account with this mobile number already exists. Log in instead.");
      var email = String(f.email || "").trim().toLowerCase();
      if (email && d.accounts.some(function (a) { return a.email === email; })) return err("email", "An account with this email already exists. Log in instead.");
      var s = salt();
      return hash(f.password, s).then(function (h) {
        d = load();
        var a = { id: "A" + (++d.seq.acc), name: String(f.name).trim(), guardian: String(f.guardian).trim(), phone: phone, email: email,
                  cls: String(f.cls), version: f.version, school: String(f.school || "").trim(), salt: s, pass: h, createdAt: now() };
        d.accounts.push(a); save(d);
        QEC.session.set(WWW_SESSION, a.id);
        return publicAccount(a);
      });
    },
    login: function (who, password) {
      var d = load(), w = String(who || "").trim().toLowerCase(), phone = normPhone(w);
      var a = d.accounts.filter(function (x) { return x.phone === phone || (x.email && x.email === w); })[0];
      if (!a) return err("who", "No account uses this mobile number or email.");
      return hash(password || "", a.salt).then(function (h) {
        if (h !== a.pass) { var e = new Error("The password is not right. Try again or reset it from the office."); e.code = "password"; throw e; }
        QEC.session.set(WWW_SESSION, a.id);
        return publicAccount(a);
      });
    },
    logout: function () { QEC.session.del(WWW_SESSION); return ok(true); },
    me: function () {
      var id = QEC.session.get(WWW_SESSION), d = load();
      var a = d.accounts.filter(function (x) { return x.id === id; })[0];
      return ok(publicAccount(a));
    },
    myEnrollments: function () {
      var id = QEC.session.get(WWW_SESSION), d = load();
      return ok(d.enrollments.filter(function (e) { return e.accountId === id; }).map(decorate).reverse());
    },
    requestEnrollment: function (courseId, prefs) {
      var id = QEC.session.get(WWW_SESSION), d = load(), c = course(courseId);
      if (!id) return err("auth", "Log in first.");
      if (!c) return err("course", "This course is not available.");
      if (c.kind === "free") return err("course", "Book the free class from the Free Class page.");
      var dup = d.enrollments.filter(function (e) { return e.accountId === id && e.courseId === courseId && ACTIVE.indexOf(e.status) >= 0; })[0];
      if (dup) return ok(decorate(dup));
      prefs = prefs || {};
      var acc = d.accounts.filter(function (x) { return x.id === id; })[0];
      var e = { id: "E" + (++d.seq.enr), accountId: id, courseId: courseId,
                status: c.upcoming ? "waitlist" : "requested",
                shift: ["Afternoon", "Night", "Offline"].indexOf(prefs.shift) >= 0 ? prefs.shift : "Afternoon",
                version: prefs.version || (acc ? acc.version : "BV"),
                createdAt: now(), history: [{ at: now(), what: c.upcoming ? "Joined the waitlist" : "Applied for the course" }] };
      d.enrollments.push(e); save(d);
      return ok(decorate(e));
    },
    submitPayment: function (enrId, p) {
      var id = QEC.session.get(WWW_SESSION), d = load();
      var e = d.enrollments.filter(function (x) { return x.id === enrId && x.accountId === id; })[0];
      if (!e) return err("enr", "Application not found.");
      if (["requested", "payment_submitted"].indexOf(e.status) < 0) return err("status", "This application is not waiting for payment.");
      p = p || {};
      if (["bKash", "Nagad", "Rocket", "Bank"].indexOf(p.method) < 0) return err("method", "Choose how you paid.");
      if (!V.trx(p.trx)) return err("trx", "The transaction ID has 6 to 20 letters and numbers.");
      var amt = Number(p.amount);
      if (!(amt > 0) || amt > 200000) return err("amount", "Write the amount you paid, in taka.");
      if (!V.phone(p.payer)) return err("payer", "Write the mobile number the money was sent from.");
      e.payment = { method: p.method, trx: String(p.trx).trim().toUpperCase(), amount: amt, payer: normPhone(p.payer), at: now() };
      e.status = "payment_submitted";
      e.history.push({ at: now(), what: "Payment details sent (" + p.method + ")" });
      save(d);
      return ok(decorate(e));
    },
    cancelEnrollment: function (enrId) {
      var id = QEC.session.get(WWW_SESSION), d = load();
      var e = d.enrollments.filter(function (x) { return x.id === enrId && x.accountId === id; })[0];
      if (!e) return err("enr", "Application not found.");
      if (["requested", "waitlist"].indexOf(e.status) < 0) return err("status", "Only an unpaid application can be cancelled here. Call the office.");
      e.status = "cancelled"; e.history.push({ at: now(), what: "Cancelled by the student" }); save(d);
      return ok(decorate(e));
    },

    /* ===== sales desk (private) ===== */
    listEnrollments: function (status) {
      var d = load();
      var list = d.enrollments.filter(function (e) { return !status || status === "all" || e.status === status; }).map(function (e) {
        var x = decorate(e), a = d.accounts.filter(function (y) { return y.id === e.accountId; })[0];
        x.account = publicAccount(a); return x;
      });
      return ok(list.reverse());
    },
    counts: function () {
      var d = load(), c = { requested: 0, payment_submitted: 0, enrolled: 0, rejected: 0, waitlist: 0, cancelled: 0 };
      d.enrollments.forEach(function (e) { c[e.status] = (c[e.status] || 0) + 1; });
      return ok(c);
    },
    verifyAndEnroll: function (enrId, x) {
      var d = load(), e = d.enrollments.filter(function (y) { return y.id === enrId; })[0];
      if (!e) return err("enr", "Application not found.");
      if (["requested", "payment_submitted"].indexOf(e.status) < 0) return err("status", "Only a pending application can be enrolled.");
      x = x || {};
      if (!/^\d(BV|EV)-(Aft|Night|Offline)$/.test(x.batch || "")) return err("batch", "Choose a batch.");
      var amt = Number(x.amount);
      if (!(amt > 0)) return err("amount", "Write the amount received.");
      if (["bKash", "Nagad", "Rocket", "Bank", "Cash"].indexOf(x.method) < 0) return err("method", "Choose how the money was received.");
      if (x.method !== "Cash" && !V.trx(x.trx)) return err("trx", "Write the transaction ID you checked.");
      var c = course(e.courseId);
      e.studentId = newStudentId(d, c ? c.cls : x.batch.charAt(0));
      e.pin = newPin();
      e.batch = x.batch;
      e.received = { amount: amt, method: x.method, trx: x.method === "Cash" ? "" : String(x.trx).trim().toUpperCase(), by: x.staff || "Sales", at: now(), note: String(x.note || "").trim() };
      e.status = "enrolled";
      e.history.push({ at: now(), what: "Payment verified and enrolled by " + (x.staff || "Sales") + " · Student ID " + e.studentId });
      save(d);
      return ok(decorate(e));
    },
    reject: function (enrId, reason) {
      var d = load(), e = d.enrollments.filter(function (y) { return y.id === enrId; })[0];
      if (!e) return err("enr", "Application not found.");
      if (["requested", "payment_submitted", "waitlist"].indexOf(e.status) < 0) return err("status", "This application is already closed.");
      reason = String(reason || "").trim();
      if (reason.length < 4) return err("reason", "Write a short reason the guardian will see.");
      e.status = "rejected"; e.reason = reason; e.history.push({ at: now(), what: "Not approved: " + reason }); save(d);
      return ok(decorate(e));
    },

    /* ===== private portals: sign-in ===== */
    studentLogin: function (sid, pin) {
      sid = String(sid || "").trim(); pin = String(pin || "").trim();
      var d = load(), e = d.enrollments.filter(function (y) { return y.status === "enrolled" && y.studentId === sid; })[0];
      if (e) {
        if (e.pin !== pin) return err("pin", "The PIN is not right.");
        var a = d.accounts.filter(function (y) { return y.id === e.accountId; })[0];
        var s = { studentId: sid, name: a ? a.name : "Student", batch: e.batch, course: decorate(e).course.title, guardian: a ? a.guardian : "" };
        QEC.session.set("qec.student", JSON.stringify(s)); return ok(s);
      }
      if (sid === "50412" && pin === "123456") { // sample student for the preview
        var demo = { studentId: "50412", name: "Ayaan Rahman", batch: "5BV-Aft", course: "Pre-Cadet Builder · Class 5", guardian: "Mr. Rahman", sample: true };
        QEC.session.set("qec.student", JSON.stringify(demo)); return ok(demo);
      }
      return err("sid", "This Student ID is not enrolled. Enrollment is confirmed by the QEC office after payment.");
    },
    staffLogin: function (app, id, pin) {
      var STAFF = { teacher: { "90003": ["1234", "Math teacher", "Mathematics"] }, sales: { "70003": ["1234", "Sales officer", "Admissions"] }, office: { "70001": ["1234", "IT Admin", "Office"] } };
      var row = STAFF[app] && STAFF[app][String(id || "").trim()];
      if (!row || row[0] !== String(pin || "").trim()) return err("auth", "This ID and PIN do not match a " + app + " account.");
      var s = { id: String(id).trim(), name: row[1], dept: row[2], app: app };
      QEC.session.set("qec.staff." + app, JSON.stringify(s)); return ok(s);
    },
    current: function (key) { try { return JSON.parse(QEC.session.get(key) || "null"); } catch (e) { return null; } },
    signOut: function (key) { QEC.session.del(key); return ok(true); },

    /* preview helper */
    resetPreview: function () { S.del(KEY); QEC.session.del(WWW_SESSION); return ok(true); }
  };
  window.QEC_API = API;
})();
