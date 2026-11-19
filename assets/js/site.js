/* QEC Academy — public site behaviour (no dependencies). */
(function () {
  "use strict";

  /* ---------- mobile navigation ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("sitenav");
  function setNav(open) {
    if (!toggle || !nav) return;
    toggle.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("open", open);
  }
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      setNav(toggle.getAttribute("aria-expanded") !== "true");
    });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setNav(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) { setNav(false); toggle.focus(); }
    });
    window.addEventListener("resize", function () { if (window.innerWidth > 1060) setNav(false); });
  }

  /* ---------- toast ---------- */
  var toastEl;
  window.qecToast = function (msg) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast"; toastEl.setAttribute("role", "status"); toastEl.setAttribute("aria-live", "polite");
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(function () { toastEl.classList.remove("show"); }, 3200);
  };

  /* ---------- form validation ---------- */
  // Bangladesh mobile: 01[3-9]XXXXXXXX, optional +88 / 88 prefix, spaces or dashes allowed.
  function normPhone(v) { return String(v || "").replace(/[\s-]/g, "").replace(/^\+?88/, ""); }
  var RULES = {
    required: function (v) { return v.trim().length > 0; },
    phone: function (v) { return v.trim() === "" || /^01[3-9]\d{8}$/.test(normPhone(v)); },
    email: function (v) { return v.trim() === "" || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); },
    name: function (v) { return v.trim() === "" || v.trim().length >= 2; },
    digits: function (v) { return v.trim() === "" || /^\d+$/.test(v.trim()); }
  };
  function checkField(field) {
    var input = field.querySelector("input,select,textarea");
    if (!input) return true;
    var rules = (input.getAttribute("data-rules") || "").split(/\s+/).filter(Boolean);
    if (input.required && rules.indexOf("required") < 0) rules.unshift("required");
    var ok = true;
    if (input.type === "radio") {
      var group = field.querySelectorAll('input[name="' + input.name + '"]');
      ok = !input.required || Array.prototype.some.call(group, function (r) { return r.checked; });
    } else {
      for (var i = 0; i < rules.length; i++) {
        if (RULES[rules[i]] && !RULES[rules[i]](input.value || "")) { ok = false; break; }
      }
    }
    field.classList.toggle("invalid", !ok);
    input.setAttribute("aria-invalid", String(!ok));
    return ok;
  }
  var pointerDown = false;
  document.addEventListener("pointerdown", function () { pointerDown = true; }, true);
  document.addEventListener("pointerup", function () { pointerDown = false; }, true);
  document.addEventListener("pointercancel", function () { pointerDown = false; }, true);
  document.querySelectorAll("form[data-validate]").forEach(function (form) {
    var fields = form.querySelectorAll(".field");
    fields.forEach(function (f) {
      var input = f.querySelector("input,select,textarea");
      if (!input) return;
      var err = f.querySelector(".err");
      if (err) { if (!err.id) err.id = (input.id || input.name) + "-err"; input.setAttribute("aria-describedby", err.id); }
      // Re-check while typing once a field is marked wrong, so its error clears before the user moves on.
      input.addEventListener("input", function () { if (f.classList.contains("invalid")) checkField(f); });
      // On leaving a field, wait until any click in progress has finished, so a message
      // appearing or disappearing never moves the element the user is clicking.
      input.addEventListener("blur", function () {
        if (!(f.classList.contains("invalid") || input.value)) return;
        if (pointerDown) document.addEventListener("pointerup", function () { setTimeout(function () { checkField(f); }, 0); }, { once: true });
        else checkField(f);
      });
      f.querySelectorAll("input,select,textarea").forEach(function (inp) {
        inp.addEventListener("change", function () { if (f.classList.contains("invalid")) checkField(f); });
      });
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var firstBad = null;
      fields.forEach(function (f) { if (!checkField(f) && !firstBad) firstBad = f; });
      if (firstBad) {
        var el = firstBad.querySelector("input,select,textarea");
        if (el) el.focus();
        return;
      }
      var btn = form.querySelector('[type="submit"]');
      if (btn) { btn.disabled = true; }
      // Template: nothing is sent or stored yet. The backend will receive this later.
      var done = document.getElementById(form.getAttribute("data-done"));
      setTimeout(function () {
        if (done) { form.hidden = true; done.classList.add("show"); done.setAttribute("tabindex", "-1"); done.focus(); }
        else { qecToast("Saved for the preview. Nothing was sent."); if (btn) btn.disabled = false; form.reset(); }
      }, 350);
    });
  });
  document.querySelectorAll("[data-reset-form]").forEach(function (b) {
    b.addEventListener("click", function () {
      var form = document.getElementById(b.getAttribute("data-reset-form"));
      var done = b.closest(".form-done");
      if (!form) return;
      form.reset(); form.hidden = false;
      form.querySelectorAll(".invalid").forEach(function (f) { f.classList.remove("invalid"); });
      var btn = form.querySelector('[type="submit"]'); if (btn) btn.disabled = false;
      if (done) done.classList.remove("show");
      var first = form.querySelector("input,select,textarea"); if (first) first.focus();
    });
  });

  /* ---------- prefill course from ?course= ---------- */
  try {
    var q = new URLSearchParams(location.search);
    var c = q.get("course"), sel = document.getElementById("f-course");
    if (c && sel) {
      for (var i = 0; i < sel.options.length; i++) if (sel.options[i].value === c) { sel.value = c; break; }
    }
    var cl = q.get("class"), cs = document.getElementById("f-class");
    if (cl && cs) for (var j = 0; j < cs.options.length; j++) if (cs.options[j].value === cl) { cs.value = cl; break; }
  } catch (e) { /* old browsers: ignore */ }

  /* ---------- course catalogue (courses.html) ---------- */
  var grid = document.getElementById("course-grid");
  if (grid && window.QEC_CATALOG) {
    var state = { cls: "any", mode: "any", kind: "any" };
    var MODE = { online: "Online", offline: "Offline" };
    function esc(s) { return String(s).replace(/[&<>"']/g, function (ch) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]; }); }
    function render() {
      var list = QEC_CATALOG.courses.filter(function (c) {
        var clsOk = state.cls === "any" || c.cls === state.cls || (c.cls === "all" && ["4", "5", "6"].indexOf(state.cls) >= 0);
        var modeOk = state.mode === "any" || c.modes.indexOf(state.mode) >= 0;
        var kindOk = state.kind === "any" || c.kind === state.kind;
        return clsOk && modeOk && kindOk;
      });
      var count = document.getElementById("course-count");
      if (count) count.textContent = list.length === 1 ? "1 program" : list.length + " programs";
      if (!list.length) {
        grid.innerHTML = '<div class="empty"><b>No program matches these filters.</b><br>Try another class or choose "Any". <button class="btn btn-ghost btn-sm" type="button" id="clear-filters" style="margin-top:12px">Clear filters</button></div>';
        document.getElementById("clear-filters").addEventListener("click", function () { setAll("any"); });
        return;
      }
      grid.innerHTML = list.map(function (c) {
        var clsLabel = c.cls === "all" ? "4–6" : c.cls;
        var modeTxt = c.modes.length === 2 ? "Online & offline" : MODE[c.modes[0]];
        var verTxt = c.versions.length === 2 ? "Bangla & English version" : (c.versions[0] === "BV" ? "Bangla version" : "English version");
        var chips = '<span class="chip">' + modeTxt + '</span><span class="chip">' + verTxt + "</span>" +
          (c.upcoming ? '<span class="chip chip-amber">Opening 2027</span>' : "") +
          (c.kind === "free" ? '<span class="chip chip-leaf">Free</span>' : "");
        var cta = c.upcoming
          ? '<a class="btn btn-ghost btn-sm" href="admission.html?course=' + esc(c.id) + '">Notify me</a>'
          : '<a class="btn btn-plum btn-sm" href="admission.html?course=' + esc(c.id) + '">' + (c.kind === "free" ? "Book free class" : "Enrol") + "</a>";
        return '<article class="course' + (c.upcoming ? " upcoming" : "") + '">' +
          '<div class="course-top"><span class="cl" aria-hidden="true">' + esc(clsLabel) + '</span><div class="chips">' + chips + "</div>" +
          "<h3>" + esc(c.title) + "</h3><p>" + esc(c.blurb) + "</p></div>" +
          "<ul>" + c.features.map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("") +
          "<li>Subjects: " + esc(c.subjects.join(", ")) + "</li></ul>" +
          '<div class="course-foot"><span class="price">' + esc(c.price) + (c.sample ? '<span class="ph-dot" title="Sample content"></span>' : "") + "</span>" + cta + "</div></article>";
      }).join("");
    }
    function sync() {
      document.querySelectorAll(".fbtn").forEach(function (b) {
        b.setAttribute("aria-pressed", String(state[b.getAttribute("data-f")] === b.getAttribute("data-v")));
      });
      render();
    }
    function setAll(v) { state.cls = v; state.mode = v; state.kind = v; sync(); }
    document.querySelectorAll(".fbtn").forEach(function (b) {
      b.addEventListener("click", function () { state[b.getAttribute("data-f")] = b.getAttribute("data-v"); sync(); });
    });
    try {
      var qc = new URLSearchParams(location.search).get("class");
      if (qc && ["4", "5", "6", "9", "10"].indexOf(qc) >= 0) state.cls = qc;
    } catch (e) {}
    sync();
  }

  /* ---------- books (books.html) ---------- */
  var bookGrid = document.getElementById("book-grid");
  if (bookGrid && window.QEC_CATALOG) {
    bookGrid.innerHTML = QEC_CATALOG.books.map(function (b) {
      var dark = b.color === "#c9861a" ? "color:#2a0730" : "";
      return '<article class="book"><div class="cover" style="background:' + b.color + ";" + dark + '">' +
        '<span class="series">' + b.series + '</span><span class="title">' + b.title + '</span><span class="cls">' + b.cls + "</span>" +
        '<img src="assets/img/mark.png" alt=""></div>' +
        '<div class="book-body"><h3>' + b.series + " " + b.title + '<span class="ph-dot" title="Sample title"></span></h3>' +
        "<p>" + b.cls + ". Chapter practice, solved examples and test papers.</p>" +
        '<div class="book-foot"><span class="price">' + b.price + '</span><a class="btn btn-ghost btn-sm" href="contact.html?topic=book">Order</a></div></div></article>';
    }).join("");
  }
})();
