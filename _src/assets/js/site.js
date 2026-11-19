/* QEC Academy — public site behaviour (v2). No dependencies. */
(function () {
  "use strict";
  var C = window.QEC_CATALOG || { courses: [], books: [] };
  var esc = QEC.esc;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- header: mobile menu, shadow on scroll, signed-in state ---------- */
  var toggle = document.querySelector(".nav-toggle"), nav = document.getElementById("sitenav");
  function setNav(open) { if (!toggle) return; toggle.setAttribute("aria-expanded", String(open)); nav.classList.toggle("open", open); }
  if (toggle && nav) {
    toggle.addEventListener("click", function () { setNav(toggle.getAttribute("aria-expanded") !== "true"); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setNav(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && nav.classList.contains("open")) { setNav(false); toggle.focus(); } });
    window.addEventListener("resize", function () { if (window.innerWidth > 1080) setNav(false); });
  }
  var bar = document.querySelector(".topbar");
  if (bar) { var onS = function () { bar.classList.toggle("scrolled", window.scrollY > 8); }; window.addEventListener("scroll", onS, { passive: true }); onS(); }
  QEC_API.me().then(function (a) {
    if (!a) return;
    document.body.classList.add("signed-in");
    var i = document.getElementById("nav-initials");
    if (i) i.textContent = a.name.split(/\s+/).map(function (w) { return w.charAt(0); }).join("").slice(0, 2).toUpperCase();
  });

  /* ---------- course card ---------- */
  var ICON = {
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    live: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="14" height="12" rx="2"/><path d="M16 10l6-3v10l-6-3z"/></svg>',
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>'
  };
  function modeText(c) { return c.modes.length === 2 ? "Online & Offline" : (c.modes[0] === "online" ? "Online" : "Offline"); }
  function cta(c) {
    if (c.kind === "free") return '<a class="btn btn-amber btn-sm" href="free-class.html">Book Free Class</a>';
    if (c.upcoming) return '<a class="btn btn-ghost btn-sm" href="course.html?id=' + esc(c.id) + '">Join Waitlist</a>';
    return '<a class="btn btn-plum btn-sm" href="course.html?id=' + esc(c.id) + '">Enroll Now <span class="ar" aria-hidden="true">›</span></a>';
  }
  function card(c, opts) {
    opts = opts || {};
    var num = c.cls === "4-6" ? "4–6" : c.cls;
    var hot = c.badge === "Most Popular" || c.badge === "Free" || c.badge === "New";
    return '<article class="ccard" data-tilt>' +
      '<a class="poster t-' + esc(c.theme) + '" href="course.html?id=' + esc(c.id) + '" aria-label="' + esc(c.title) + ' details">' +
        '<span class="badge' + (hot ? " hot" : "") + '">' + esc(c.badge) + "</span>" +
        '<span><span class="trk">' + esc(c.track === "Skill Hub" ? "Skill Hub · Class 4–6" : (c.cls === "4-6" ? "Class 4–6" : "Class " + c.cls)) + '</span><br><span class="ttl">' + esc(c.short) + "</span></span>" +
        '<span class="num" aria-hidden="true">' + esc(num) + "</span></a>" +
      '<div class="cbody"><p class="tagline">' + esc(c.tagline) + "</p>" +
        '<div class="meta"><span>' + ICON.clock + esc(c.duration) + "</span><span>" + ICON.live + esc(c.perWeek) + "</span><span>" + ICON.pin + esc(modeText(c)) + "</span><span>" + ICON.cal + "Starts " + esc(c.start) + "</span></div>" +
        (opts.compact ? "" : '<ul class="flist">' + c.features.slice(0, 3).map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("") + "</ul>") +
      "</div>" +
      '<div class="cfoot"><span class="price">' + esc(c.feeText) + (c.sample ? '<span class="ph-dot" title="Sample content"></span>' : "") +
        "<small>" + (c.kind === "free" ? "No Payment Needed" : c.upcoming ? "Waitlist Is Open" : "Bangla & English Version") + "</small></span>" + (opts.nocta ? "" : cta(c)) + "</div></article>";
  }
  window.QEC_UI = { card: card, ICON: ICON, modeText: modeText };

  /* home / any grid: <div class="ccards" data-cards="pc4,pc5,pc6"> */
  document.querySelectorAll("[data-cards]").forEach(function (g) {
    var ids = g.getAttribute("data-cards").split(",");
    g.innerHTML = ids.map(function (id) { var c = C.courses.filter(function (x) { return x.id === id.trim(); })[0]; return c ? card(c) : ""; }).join("");
  });

  /* ---------- courses page ---------- */
  var grid = document.getElementById("course-grid");
  if (grid) {
    var state = { cls: "any", prog: "any", mode: "any" };
    var PROG = { academic: function (c) { return c.kind === "academic"; }, skill: function (c) { return c.kind === "skill"; }, exam: function (c) { return c.kind === "exam"; }, free: function (c) { return c.kind === "free"; } };
    var render = function () {
      var list = C.courses.filter(function (c) {
        var inCls = state.cls === "any" || c.cls === state.cls || (c.cls === "4-6" && ["4", "5", "6"].indexOf(state.cls) >= 0) || (state.cls === "9-10" && (c.cls === "9" || c.cls === "10"));
        return inCls && (state.prog === "any" || PROG[state.prog](c)) && (state.mode === "any" || c.modes.indexOf(state.mode) >= 0);
      });
      var count = document.getElementById("course-count");
      if (count) count.textContent = list.length === 1 ? "1 Program" : list.length + " Programs";
      grid.innerHTML = list.length ? list.map(function (c) { return card(c); }).join("") :
        '<div class="empty"><b>No program matches these filters.</b><br>Try another class, or show everything. <br><button class="btn btn-ghost btn-sm" type="button" id="clear-filters" style="margin-top:14px">Show All Programs</button></div>';
      var cl = document.getElementById("clear-filters");
      if (cl) cl.addEventListener("click", function () { state = { cls: "any", prog: "any", mode: "any" }; sync(); });
      bindTilt(grid); reveal(grid.children);
    };
    var sync = function () {
      document.querySelectorAll(".fbtn").forEach(function (b) { b.setAttribute("aria-pressed", String(state[b.getAttribute("data-f")] === b.getAttribute("data-v"))); });
      render();
    };
    document.querySelectorAll(".fbtn").forEach(function (b) { b.addEventListener("click", function () { state[b.getAttribute("data-f")] = b.getAttribute("data-v"); sync(); }); });
    var qc = QEC.param("class"); if (["4", "5", "6", "9-10"].indexOf(qc) >= 0) state.cls = qc;
    var qp = QEC.param("program"); if (PROG[qp]) state.prog = qp;
    if (QEC.param("track") === "Cadet College") { state.cls = "6"; state.prog = "academic"; }
    sync();
  }

  /* ---------- course detail page ---------- */
  var cd = document.getElementById("course-detail");
  if (cd) {
    var c = C.courses.filter(function (x) { return x.id === QEC.param("id"); })[0];
    if (!c) {
      cd.innerHTML = '<div class="empty"><b>This course was not found.</b><br><a class="btn btn-plum btn-sm" href="courses.html" style="margin-top:14px">See All Courses</a></div>';
    } else {
      document.title = c.title + " | QEC Academy";
      var setTxt = function (id, v) { var el = document.getElementById(id); if (el) el.textContent = v; };
      setTxt("cd-title", c.title); setTxt("cd-tagline", c.tagline); setTxt("cd-blurb", c.blurb); setTxt("cd-crumb", c.short);
      var sec = function (title, html) { return '<div class="cd-block" data-reveal><h2>' + title + "</h2>" + html + "</div>"; };
      var body = sec("What Your Child Gets", '<ul class="ticks">' + c.features.map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("") + "</ul>") +
        sec("Subjects", '<div class="subj">' + c.subjects.map(function (s) { return "<span>" + esc(s) + "</span>"; }).join("") + "</div>") +
        (c.outcomes.length ? sec("By the End of the Course", '<ul class="ticks">' + c.outcomes.map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("") + "</ul>") : "") +
        sec("How Enrollment Works", '<ol class="steps" style="grid-template-columns:repeat(4,1fr)"><li><h3>Create an Account</h3><p>Sign up with the student\'s details.</p></li><li><h3>Apply</h3><p>Choose this course and a batch.</p></li><li><h3>Pay</h3><p>bKash, Nagad, Rocket, bank or at the office.</p></li><li class="amber"><h3>Get Access</h3><p>The office confirms and sends the Student ID and PIN.</p></li></ol>') +
        sec("Questions Guardians Ask", '<details class="faq"><summary>Is there a Bangla version and an English version batch?</summary><p>Yes. Choose the version when you apply. Both follow the same syllabus and the same exams.</p></details><details class="faq"><summary>When do we get access to classes?</summary><p>As soon as the office confirms your payment. You receive a Student ID and PIN for the private Student Portal.</p></details><details class="faq"><summary>Can we try a class first?</summary><p>Yes. <a href="free-class.html">Book a free class</a>; no account is needed.</p></details>');
      document.getElementById("cd-body").innerHTML = body;
      var side = document.getElementById("cd-side");
      side.innerHTML = card(c, { nocta: true }) + '<div class="panel" style="margin-top:16px"><h3 style="font-size:18px">' + (c.upcoming ? "Join the Waitlist" : c.kind === "free" ? "Book Your Free Class" : "Apply for This Course") + '</h3>' +
        (c.kind === "free" ? '<a class="btn btn-amber btn-block" href="free-class.html">Book Free Class</a>' :
        '<form id="apply-form" novalidate><div class="field"><span class="lbl" id="ap-shift">Preferred Batch</span><div class="seg" role="radiogroup" aria-labelledby="ap-shift">' +
        '<label><input type="radio" name="shift" value="Afternoon" checked> Afternoon</label><label><input type="radio" name="shift" value="Night"> Night</label>' + (c.modes.indexOf("offline") >= 0 ? '<label><input type="radio" name="shift" value="Offline"> At the Centre</label>' : "") +
        '</div></div><button class="btn btn-amber btn-block" type="submit" style="margin-top:14px">' + (c.upcoming ? "Join Waitlist" : "Apply Now") + '</button><p class="form-note" id="apply-note">You need a free QEC account to apply.</p></form>') + "</div>";
      var af = document.getElementById("apply-form");
      if (af) {
        QEC_API.me().then(function (a) { if (a) document.getElementById("apply-note").textContent = "Applying as " + a.name + "."; });
        af.addEventListener("submit", function (e) {
          e.preventDefault();
          var shift = (af.querySelector("input[name=shift]:checked") || {}).value || "Afternoon";
          var btn = af.querySelector("button"); btn.disabled = true;
          QEC_API.me().then(function (a) {
            if (!a) { location.href = "signup.html?course=" + encodeURIComponent(c.id) + "&shift=" + encodeURIComponent(shift); return; }
            return QEC_API.requestEnrollment(c.id, { shift: shift }).then(function (en) { location.href = "account.html#" + en.id; });
          }).catch(function (er) { btn.disabled = false; QEC.toast(er.message, "bad"); });
        });
      }
      bindTilt(side); reveal(document.querySelectorAll("#cd-body [data-reveal]"));
    }
  }

  /* ---------- books page ---------- */
  var bookGrid = document.getElementById("book-grid");
  if (bookGrid) {
    bookGrid.innerHTML = C.books.map(function (b, i) {
      var dark = b.color === "#c9861a" ? "color:#2a0730;" : "";
      return '<article class="book" data-reveal style="--d:' + (i % 4) * 0.08 + 's"><div class="cover" style="background:' + b.color + ";" + dark + '">' +
        '<span class="series">' + esc(b.series) + '</span><span class="title">' + esc(b.title) + '</span><span class="cls">' + esc(b.cls) + "</span>" +
        '<img src="assets/img/mark.png" alt=""></div><div class="book-body"><h3>' + esc(b.series + " " + b.title) + '<span class="ph-dot" title="Sample title"></span></h3>' +
        "<p>" + esc(b.cls) + ". Chapter practice, solved examples and test papers.</p>" +
        '<div class="book-foot"><span class="price">' + esc(b.price) + '</span><a class="btn btn-ghost btn-sm" href="contact.html?topic=book">Order Now</a></div></div></article>';
    }).join("");
  }

  /* ---------- card tilt + light (pointer only) ---------- */
  function bindTilt(root) {
    if (reduce || !window.matchMedia("(hover: hover)").matches) return;
    (root || document).querySelectorAll("[data-tilt]").forEach(function (el) {
      if (el._tilt) return; el._tilt = true;
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.style.setProperty("--ry", ((x - 0.5) * 6).toFixed(2) + "deg"); el.style.setProperty("--rx", ((0.5 - y) * 6).toFixed(2) + "deg");
        el.style.setProperty("--mx", (x * 100).toFixed(1) + "%"); el.style.setProperty("--my", (y * 100).toFixed(1) + "%");
      });
      el.addEventListener("pointerleave", function () { el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg"); });
    });
  }
  bindTilt(document);

  /* ---------- scroll reveal ---------- */
  var io = ("IntersectionObserver" in window) ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }) : null;
  function reveal(nodes) {
    Array.prototype.forEach.call(nodes || document.querySelectorAll("[data-reveal]"), function (n, i) {
      if (!n.hasAttribute("data-reveal")) { n.setAttribute("data-reveal", ""); n.style.setProperty("--d", (i % 3) * 0.08 + "s"); }
      if (io && !reduce) io.observe(n); else n.classList.add("in");
    });
  }
  reveal();
  document.querySelectorAll("[data-stagger]").forEach(function (g) { reveal(g.children); });

  /* ---------- counters ---------- */
  var cio = ("IntersectionObserver" in window) ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) { count(en.target); cio.unobserve(en.target); } });
  }, { threshold: 0.4 }) : null;
  function count(el) {
    var to = Number(el.getAttribute("data-count")), suf = el.getAttribute("data-suffix") || "", t0 = null, dur = 1400;
    if (reduce || !to) { el.textContent = to + suf; return; }
    function step(t) { if (!t0) t0 = t; var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3); el.textContent = Math.round(to * e) + suf; if (p < 1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }
  document.querySelectorAll("[data-count]").forEach(function (el) { if (cio) cio.observe(el); else count(el); });

  /* ---------- rotating headline word ---------- */
  var rot = document.querySelector(".rot");
  if (rot) {
    var words = rot.querySelectorAll("span[data-w]"), ri = 0;
    if (words.length > 1 && !reduce) setInterval(function () {
      if (document.hidden) return;
      var cur = words[ri]; cur.classList.remove("on"); cur.classList.add("out");
      ri = (ri + 1) % words.length;
      var nx = words[ri]; nx.classList.remove("out"); nx.classList.add("on");
      setTimeout(function () { cur.classList.remove("out"); }, 600);
    }, 2600);
  }

  /* ---------- carousel ---------- */
  document.querySelectorAll(".carousel").forEach(function (car) {
    var slides = car.querySelectorAll(".slide"), dots = car.querySelectorAll(".dot"), pp = car.querySelector(".pp"), i = 0, timer = null, DUR = 6000;
    var playing = !reduce;
    car.style.setProperty("--dur", DUR / 1000 + "s");
    function go(n) {
      i = (n + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle("on", k === i); s.setAttribute("aria-hidden", String(k !== i)); s.querySelectorAll("a,button").forEach(function (a) { a.tabIndex = k === i ? 0 : -1; }); });
      dots.forEach(function (d, k) { d.setAttribute("aria-current", String(k === i)); var c2 = d.cloneNode(true); d.parentNode.replaceChild(c2, d); });
      dots = car.querySelectorAll(".dot"); bindDots(); schedule();
    }
    function schedule() { clearTimeout(timer); if (playing) timer = setTimeout(function () { go(i + 1); }, DUR); }
    function bindDots() { dots.forEach(function (d, k) { d.onclick = function () { go(k); }; }); }
    function setPlay(p) { playing = p; car.classList.toggle("paused", !p); if (pp) { pp.setAttribute("aria-label", p ? "Pause slides" : "Play slides"); pp.innerHTML = p ? "❚❚" : "▶"; } schedule(); }
    if (pp) pp.addEventListener("click", function () { setPlay(!playing); });
    car.addEventListener("mouseenter", function () { if (playing) { clearTimeout(timer); car.classList.add("paused"); } });
    car.addEventListener("mouseleave", function () { if (playing) { car.classList.remove("paused"); go(i); } });
    car.addEventListener("focusin", function () { clearTimeout(timer); car.classList.add("paused"); });
    car.addEventListener("keydown", function (e) { if (e.key === "ArrowRight") go(i + 1); if (e.key === "ArrowLeft") go(i - 1); });
    setPlay(playing); go(0);
  });

  /* ---------- forms ---------- */
  var RULES = {
    required: function (v) { return v.trim().length > 0; },
    phone: function (v) { return v.trim() === "" || QEC_API.validators.phone(v); },
    email: function (v) { return v.trim() === "" || QEC_API.validators.email(v); },
    name: function (v) { return v.trim() === "" || QEC_API.validators.name(v); },
    password: function (v) { return v === "" || QEC_API.validators.password(v); },
    trx: function (v) { return v.trim() === "" || QEC_API.validators.trx(v); },
    amount: function (v) { return v.trim() === "" || (Number(v) > 0 && Number(v) <= 200000); },
    same: function (v, input) { var o = document.getElementById(input.getAttribute("data-same")); return !o || v === o.value; }
  };
  function checkField(f) {
    var input = f.querySelector("input,select,textarea"); if (!input) return true;
    // A server error stays until the user changes the value it was about.
    if (f.dataset.serverVal !== undefined) {
      if (f.dataset.serverVal === input.value) return false;
      delete f.dataset.serverVal;
    }
    var ok = true;
    if (input.type === "radio") {
      ok = !input.required || !!f.querySelector('input[name="' + input.name + '"]:checked');
    } else if (input.type === "checkbox") {
      ok = !input.required || input.checked;
    } else {
      var rules = (input.getAttribute("data-rules") || "").split(/\s+/).filter(Boolean);
      if (input.required) rules.unshift("required");
      for (var i = 0; i < rules.length; i++) if (RULES[rules[i]] && !RULES[rules[i]](input.value || "", input)) { ok = false; break; }
    }
    f.classList.toggle("invalid", !ok); input.setAttribute("aria-invalid", String(!ok));
    var err = f.querySelector(".err"); if (err && err.dataset.orig) err.textContent = err.dataset.orig;
    return ok;
  }
  function serverError(form, e) {
    var input = form.querySelector('[name="' + e.code + '"]');
    var f = input && input.closest(".field");
    if (f) {
      var err = f.querySelector(".err"); if (err) { if (!err.dataset.orig) err.dataset.orig = err.textContent; err.textContent = e.message; }
      f.dataset.serverVal = input.value;
      f.classList.add("invalid"); input.setAttribute("aria-invalid", "true"); input.focus();
    } else {
      var al = form.querySelector(".alert"); if (al) { al.textContent = e.message; al.classList.add("show"); } else QEC.toast(e.message, "bad");
    }
  }
  window.QEC_FORMS = window.QEC_FORMS || {};
  var pointerDown = false;
  document.addEventListener("pointerdown", function () { pointerDown = true; }, true);
  document.addEventListener("pointerup", function () { pointerDown = false; }, true);
  document.addEventListener("pointercancel", function () { pointerDown = false; }, true);
  function wire(form) {
    if (form._wired) return; form._wired = true;
    var fields = form.querySelectorAll(".field");
    fields.forEach(function (f) {
      var input = f.querySelector("input,select,textarea"); if (!input) return;
      var err = f.querySelector(".err");
      if (err) { if (!err.id) err.id = (input.id || input.name) + "-err"; input.setAttribute("aria-describedby", err.id); }
      f.querySelectorAll("input,select,textarea").forEach(function (inp) {
        inp.addEventListener("input", function () { if (f.classList.contains("invalid")) checkField(f); });
        inp.addEventListener("change", function () { if (f.classList.contains("invalid")) checkField(f); });
      });
      input.addEventListener("blur", function () {
        if (!(f.classList.contains("invalid") || input.value) || input.type === "radio") return;
        if (pointerDown) document.addEventListener("pointerup", function () { setTimeout(function () { checkField(f); }, 0); }, { once: true });
        else checkField(f);
      });
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var al = form.querySelector(".alert"); if (al) al.classList.remove("show");
      var bad = null;
      fields.forEach(function (f) { delete f.dataset.serverVal; });
      fields.forEach(function (f) { if (!checkField(f) && !bad) bad = f; });
      if (bad) { var el = bad.querySelector("input,select,textarea"); if (el) el.focus(); return; }
      var btn = form.querySelector('[type="submit"]'); if (btn) btn.disabled = true;
      var data = {}; new FormData(form).forEach(function (v, k) { data[k] = typeof v === "string" ? v.trim() : v; });
      var handler = window.QEC_FORMS[form.getAttribute("data-handler")];
      var p = handler ? Promise.resolve().then(function () { return handler(data, form); }) : new Promise(function (r) { setTimeout(r, 350); });
      p.then(function () {
        var done = document.getElementById(form.getAttribute("data-done"));
        if (done) { form.hidden = true; done.classList.add("show"); done.setAttribute("tabindex", "-1"); done.focus(); }
        if (btn) btn.disabled = false;
      }).catch(function (er) { if (btn) btn.disabled = false; serverError(form, er); });
    });
  }
  window.QEC_wireForm = wire;
  document.querySelectorAll("form[data-validate]").forEach(wire);
  document.querySelectorAll("[data-reset-form]").forEach(function (b) {
    b.addEventListener("click", function () {
      var form = document.getElementById(b.getAttribute("data-reset-form")), done = b.closest(".form-done");
      if (!form) return;
      form.reset(); form.hidden = false;
      form.querySelectorAll(".invalid").forEach(function (f) { f.classList.remove("invalid"); });
      if (done) done.classList.remove("show");
      var first = form.querySelector("input,select,textarea"); if (first) first.focus();
    });
  });
  document.querySelectorAll(".pw-wrap button").forEach(function (b) {
    b.addEventListener("click", function () {
      var i = b.parentNode.querySelector("input"), show = i.type === "password";
      i.type = show ? "text" : "password"; b.textContent = show ? "Hide" : "Show"; b.setAttribute("aria-pressed", String(show));
    });
  });
  /* prefill selects from the query string: ?topic= ?class= ?course= */
  [["topic", "c-topic"], ["class", "f-class"], ["course", "f-course"]].forEach(function (p) {
    var v = QEC.param(p[0]), s = document.getElementById(p[1]);
    if (v && s) for (var k = 0; k < s.options.length; k++) if (s.options[k].value === v) { s.value = v; break; }
  });
})();
