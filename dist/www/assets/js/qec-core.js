/* =====================================================================
   QEC core: environment, cross-app links, safe storage, toast, escaping.
   Loaded first on every page of every app.
   ===================================================================== */
(function () {
  "use strict";
  var DOMAIN = "qecacademy.com";
  var HOSTS = { www: DOMAIN, student: "student." + DOMAIN, teacher: "teacher." + DOMAIN, sales: "sales." + DOMAIN, office: "office." + DOMAIN };
  var host = (location.hostname || "").toLowerCase();
  var isProd = host === DOMAIN || host === "www." + DOMAIN || /\.qecacademy\.com$/.test(host);

  /* In production each app is its own subdomain; in the preview they sit side by side as folders. */
  function appUrl(app, page) {
    page = page || "index.html";
    if (isProd) return "https://" + HOSTS[app] + "/" + (page === "index.html" ? "" : page);
    var here = document.body ? document.body.getAttribute("data-app") : null;
    if (here === app) return page;
    return (here ? "../" : "") + app + "/" + page;
  }

  /* localStorage can be missing or throw (private mode, sandboxed frames): fall back to memory. */
  var mem = {};
  var store = {
    get: function (k) { try { var v = window.localStorage.getItem(k); return v === null ? (k in mem ? mem[k] : null) : v; } catch (e) { return k in mem ? mem[k] : null; } },
    set: function (k, v) { mem[k] = v; try { window.localStorage.setItem(k, v); } catch (e) {} },
    del: function (k) { delete mem[k]; try { window.localStorage.removeItem(k); } catch (e) {} }
  };
  var session = {
    get: function (k) { try { return window.sessionStorage.getItem(k) || store.get("s:" + k); } catch (e) { return store.get("s:" + k); } },
    set: function (k, v) { try { window.sessionStorage.setItem(k, v); } catch (e) {} store.set("s:" + k, v); },
    del: function (k) { try { window.sessionStorage.removeItem(k); } catch (e) {} store.del("s:" + k); }
  };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  }

  var toastEl;
  function toast(msg, kind) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast"; toastEl.setAttribute("role", "status"); toastEl.setAttribute("aria-live", "polite");
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.className = "toast show" + (kind ? " " + kind : "");
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(function () { toastEl.className = "toast"; }, 3600);
  }

  function param(name) {
    try { return new URLSearchParams(location.search).get(name); } catch (e) {
      var m = new RegExp("[?&]" + name + "=([^&#]*)").exec(location.search); return m ? decodeURIComponent(m[1]) : null;
    }
  }

  /* Rewrite links marked data-xapp="student/index.html" to the right host. */
  function fixLinks(root) {
    (root || document).querySelectorAll("a[data-xapp]").forEach(function (a) {
      var v = a.getAttribute("data-xapp").split("/");
      a.setAttribute("href", appUrl(v[0], v.slice(1).join("/") || "index.html"));
    });
  }
  document.addEventListener("DOMContentLoaded", function () { fixLinks(); });

  var BN_DIGITS = "০১২৩৪৫৬৭৮৯";
  function bn(n) { return String(n).replace(/\d/g, function (d) { return BN_DIGITS[+d]; }); }

  window.QEC = { isProd: isProd, hosts: HOSTS, appUrl: appUrl, store: store, session: session, esc: esc, toast: toast, param: param, fixLinks: fixLinks, bn: bn };
  window.qecToast = toast;
})();
