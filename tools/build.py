#!/usr/bin/env python3
"""
QEC Academy platform builder.

Five separate static apps are built from _src/ into dist/:

    dist/www/      -> qecacademy.com            public website (+ student sign-up / log-in / account)
    dist/student/  -> student.qecacademy.com    private: enrolled students and guardians
    dist/teacher/  -> teacher.qecacademy.com    private: teachers
    dist/sales/    -> sales.qecacademy.com      private: sales team (enrolment approval)
    dist/office/   -> office.qecacademy.com     private: office / management
    dist/index.html                              preview hub only (not deployed to any domain)

Each app folder is self-contained (its own copy of assets/), so each one can be the
document root of its own (sub)domain on Hostinger.

Page sources: _src/<app>/pages/*.html. Every page starts with a meta comment:
    <!--meta title="Courses" desc="..." nav="courses" layout="site" -->
layouts: site (public header+footer) | app (private app screen) | bare (head only)

Placeholders: {{root}} (always "" - pages sit at the app root), {{year}}, {{m.<key>}} (meta values)
Include a partial with: <!--#include gate.html-->
Run: python3 tools/build.py
"""
import datetime
import html
import pathlib
import re
import shutil
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "_src"
DIST = ROOT / "dist"
PARTIALS = SRC / "partials"

APPS = {
    "www":     {"host": "qecacademy.com",         "private": False, "name": "QEC Academy",          "manifest": True},
    "student": {"host": "student.qecacademy.com", "private": True,  "name": "QEC Student Portal",   "manifest": True},
    "teacher": {"host": "teacher.qecacademy.com", "private": True,  "name": "QEC Teacher Portal",   "manifest": False},
    "sales":   {"host": "sales.qecacademy.com",   "private": True,  "name": "QEC Sales Desk",       "manifest": False},
    "office":  {"host": "office.qecacademy.com",  "private": True,  "name": "QEC Office Console",   "manifest": False},
}
NAV_KEYS = ["", "home", "courses", "skillhub", "books", "medha", "about", "contact", "account"]
META_RE = re.compile(r"^\s*<!--meta(.*?)-->", re.S)
ATTR_RE = re.compile(r'(\w+)="(.*?)"', re.S)
INCLUDE_RE = re.compile(r"<!--#include ([\w.-]+)-->")


def read(p):
    return p.read_text(encoding="utf-8")


def fail(msg):
    sys.exit("ERROR: " + msg)


def parse(path):
    text = read(path)
    m = META_RE.match(text)
    if not m:
        fail(f"{path} has no <!--meta ... --> line at the top")
    meta = dict(ATTR_RE.findall(m.group(1)))
    for key in ("title", "desc"):
        if key not in meta:
            fail(f"{path} meta is missing {key}=")
    meta.setdefault("layout", "site")
    meta.setdefault("nav", "")
    if meta["layout"] not in ("site", "app", "bare"):
        fail(f"{path} layout must be site, app or bare")
    if meta["nav"] not in NAV_KEYS:
        fail(f"{path} nav must be one of {NAV_KEYS}")
    return meta, text[m.end():]


def includes(body, depth=0):
    if depth > 3:
        fail("include nesting too deep")
    return INCLUDE_RE.sub(lambda m: includes(read(PARTIALS / m.group(1)), depth + 1), body)


def mark_active(fragment, nav):
    def repl(m):
        tag = m.group(0)
        return tag.replace("data-nav=", 'aria-current="page" data-nav=', 1) if m.group(1) == nav and nav else tag
    return re.sub(r'<a\b[^>]*data-nav="(\w+)"', repl, fragment)


def head_for(app, meta):
    cfg = APPS[app]
    title = cfg["name"] if meta["title"] == "Home" else f'{meta["title"]} | {cfg["name"]}'
    robots = '<meta name="robots" content="noindex, nofollow, noarchive">' if cfg["private"] else '<meta name="robots" content="index, follow">'
    extra = '<link rel="stylesheet" href="assets/css/portal.css">' if meta["layout"] == "app" else ""
    manifest = '<link rel="manifest" href="manifest.webmanifest">' if cfg["manifest"] else ""
    return (read(PARTIALS / "head.html")
            .replace("{{title}}", html.escape(title))
            .replace("{{desc}}", html.escape(meta["desc"]))
            .replace("{{robots}}", robots)
            .replace("{{manifest}}", manifest)
            .replace("{{extra_css}}", extra)
            .replace("{{app}}", app))


def render(app, meta, body):
    body = includes(body)
    h = head_for(app, meta)
    if meta["layout"] == "site":
        out = (h + f'<body class="site" data-app="{app}">\n' + mark_active(includes(read(PARTIALS / "header.html")), meta["nav"])
               + '\n<main id="main">\n' + body.strip() + "\n</main>\n" + read(PARTIALS / "footer.html")
               + '\n<script src="assets/js/site.js" defer></script>\n</body>\n</html>\n')
    elif meta["layout"] == "app":
        out = (h + f'<body class="portal" data-app="{app}">\n' + body.strip()
               + '\n<script src="assets/js/portal.js" defer></script>\n</body>\n</html>\n')
    else:
        out = h + f'<body class="bare" data-app="{app}">\n' + body.strip() + "\n</body>\n</html>\n"
    out = out.replace("{{root}}", "").replace("{{year}}", str(datetime.date.today().year))
    for k, v in meta.items():
        out = out.replace("{{m." + k + "}}", v)
    left = sorted(set(re.findall(r"\{\{[\w.>-]+\}\}", out)))
    if left:
        fail(f"{app}: unreplaced placeholders {left}")
    return out


def write_app_extras(app, out_dir):
    cfg = APPS[app]
    if cfg["private"]:
        (out_dir / "robots.txt").write_text("User-agent: *\nDisallow: /\n", encoding="utf-8")
        # Apache (Hostinger): never index, and only answer on the app's own subdomain.
        (out_dir / ".htaccess").write_text(
            "# " + cfg["name"] + " - private app\n"
            "Options -Indexes\n"
            "<IfModule mod_headers.c>\n  Header set X-Robots-Tag \"noindex, nofollow, noarchive\"\n"
            "  Header set X-Frame-Options \"SAMEORIGIN\"\n  Header set Referrer-Policy \"same-origin\"\n</IfModule>\n"
            "<IfModule mod_rewrite.c>\n  RewriteEngine On\n"
            f"  RewriteCond %{{HTTP_HOST}} !^{re.escape(cfg['host'])}$ [NC]\n"
            f"  RewriteRule ^(.*)$ https://{cfg['host']}/$1 [R=301,L]\n</IfModule>\n", encoding="utf-8")
    else:
        pages = sorted(p.name for p in out_dir.glob("*.html") if p.name not in ("account.html", "login.html", "signup.html", "404.html", "course.html"))
        urls = "".join(f"  <url><loc>https://{cfg['host']}/{'' if p == 'index.html' else p}</loc></url>\n" for p in pages)
        (out_dir / "sitemap.xml").write_text(
            '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + "</urlset>\n",
            encoding="utf-8")
        (out_dir / "robots.txt").write_text(
            "User-agent: *\nDisallow: /account.html\nAllow: /\nSitemap: https://qecacademy.com/sitemap.xml\n", encoding="utf-8")
        (out_dir / ".htaccess").write_text(
            "Options -Indexes\nErrorDocument 404 /404.html\n"
            "<IfModule mod_rewrite.c>\n  RewriteEngine On\n  RewriteCond %{HTTPS} off\n"
            "  RewriteRule ^(.*)$ https://%{HTTP_HOST}/$1 [R=301,L]\n</IfModule>\n", encoding="utf-8")
    if cfg["manifest"]:
        start = "index.html"
        (out_dir / "manifest.webmanifest").write_text(
            '{\n  "name": "%s",\n  "short_name": "%s",\n  "start_url": "./%s",\n  "scope": "./",\n'
            '  "display": "standalone",\n  "background_color": "#fdfbfd",\n  "theme_color": "#5b1462",\n'
            '  "icons": [\n    { "src": "assets/img/icon-192.png", "sizes": "192x192", "type": "image/png" },\n'
            '    { "src": "assets/img/icon-512.png", "sizes": "512x512", "type": "image/png" }\n  ]\n}\n'
            % (cfg["name"], "QEC" if app == "www" else "QEC Student", start), encoding="utf-8")


def build():
    if DIST.exists():
        shutil.rmtree(DIST)
    report = []
    for app in APPS:
        pages_dir = SRC / app / "pages"
        if not pages_dir.is_dir():
            fail(f"missing {pages_dir}")
        out_dir = DIST / app
        shutil.copytree(SRC / "assets", out_dir / "assets")
        n = 0
        for page in sorted(pages_dir.glob("*.html")):
            meta, body = parse(page)
            if app != "www" and meta["layout"] == "site":
                fail(f"{app}/{page.name}: private apps cannot use the public site layout")
            (out_dir / page.name).write_text(render(app, meta, body), encoding="utf-8")
            n += 1
        if not (out_dir / "index.html").exists():
            fail(f"{app} has no index.html")
        write_app_extras(app, out_dir)
        report.append(f"{app}: {n} pages")
    hub = SRC / "hub.html"
    if hub.exists():
        (DIST / "index.html").write_text(read(hub).replace("{{year}}", str(datetime.date.today().year)), encoding="utf-8")
        report.append("preview hub")
    print("Built " + " | ".join(report))


if __name__ == "__main__":
    build()
