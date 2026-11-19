/* QEC Academy — portal behaviour shared by every portal screen. */
(function () {
  "use strict";

  /* ---------- toast ---------- */
  var toastEl;
  window.qecToast = function (msg) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast"; toastEl.setAttribute("role", "status"); toastEl.setAttribute("aria-live", "polite");
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg; toastEl.classList.add("show");
    clearTimeout(toastEl._t); toastEl._t = setTimeout(function () { toastEl.classList.remove("show"); }, 3200);
  };

  /* ---------- views (sidebar navigation) ---------- */
  var navBtns = document.querySelectorAll("[data-view-btn]");
  var views = document.querySelectorAll("[data-view]");
  var title = document.getElementById("view-title");
  function show(name, push) {
    var found = false;
    views.forEach(function (v) { var on = v.getAttribute("data-view") === name; v.classList.toggle("on", on); if (on) found = true; });
    if (!found && views.length) { name = views[0].getAttribute("data-view"); views[0].classList.add("on"); }
    navBtns.forEach(function (b) {
      var on = b.getAttribute("data-view-btn") === name;
      if (on) { b.setAttribute("aria-current", "page"); if (title) title.textContent = b.getAttribute("data-title") || b.textContent.trim(); }
      else b.removeAttribute("aria-current");
    });
    if (push && history.replaceState) history.replaceState(null, "", "#" + name);
    closeSide();
    var main = document.getElementById("main"); if (main && push) main.scrollTop = 0;
    if (push) window.scrollTo(0, 0);
  }
  navBtns.forEach(function (b) { b.addEventListener("click", function () { show(b.getAttribute("data-view-btn"), true); }); });
  document.querySelectorAll("[data-goto]").forEach(function (b) {
    b.addEventListener("click", function (e) { e.preventDefault(); show(b.getAttribute("data-goto"), true); });
  });
  if (views.length) show((location.hash || "").slice(1), false);
  window.addEventListener("hashchange", function () { show(location.hash.slice(1), false); });

  /* ---------- mobile sidebar ---------- */
  var side = document.querySelector(".side"), tog = document.querySelector(".side-toggle"), scrim = document.querySelector(".scrim");
  function closeSide() {
    if (!side) return;
    side.classList.remove("open"); if (scrim) scrim.classList.remove("on");
    if (tog) tog.setAttribute("aria-expanded", "false");
  }
  if (tog && side) {
    tog.addEventListener("click", function () {
      var open = !side.classList.contains("open");
      side.classList.toggle("open", open); if (scrim) scrim.classList.toggle("on", open);
      tog.setAttribute("aria-expanded", String(open));
      if (open) { var f = side.querySelector("button,a"); if (f) f.focus(); }
    });
    if (scrim) scrim.addEventListener("click", closeSide);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && side.classList.contains("open")) { closeSide(); tog.focus(); } });
  }

  /* ---------- greeting by time of day (Asia/Dhaka) ---------- */
  var greet = document.querySelector("[data-greet]");
  if (greet) {
    var h;
    try { h = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Asia/Dhaka" }).format(new Date())); }
    catch (e) { h = new Date().getHours(); }
    var g = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
    greet.textContent = g + ", " + greet.getAttribute("data-greet");
  }
  var today = document.querySelector("[data-today]");
  if (today) {
    try { today.textContent = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Dhaka" }).format(new Date()); }
    catch (e) { today.textContent = new Date().toDateString(); }
  }

  /* ---------- demo-only buttons ---------- */
  document.querySelectorAll("[data-demo]").forEach(function (b) {
    b.addEventListener("click", function (e) { e.preventDefault(); qecToast(b.getAttribute("data-demo")); });
  });
})();
