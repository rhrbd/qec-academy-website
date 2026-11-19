#!/usr/bin/env python3
"""
QEC Academy website builder.

Pages live in _src/pages/ (portal pages in _src/pages/portal/). Each page starts with
one meta comment, for example:

    <!--meta title="Courses" desc="..." nav="courses" layout="site" -->

layout="site"   -> public header + footer are wrapped around the page body
layout="portal" -> the page is a portal screen; only the shared <head> is added

The builder writes plain static HTML to the repository root, so the site can be
uploaded to Hostinger (public_html) or any static host exactly as it is.
Placeholders available inside pages and partials:
    {{root}}   relative path back to the site root ("" or "../")
    {{year}}   current year
Run:  python3 tools/build.py
"""
import datetime
import html
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "_src"
PAGES = SRC / "pages"
PARTIALS = SRC / "partials"

META_RE = re.compile(r"^\s*<!--meta(.*?)-->", re.S)
ATTR_RE = re.compile(r'(\w+)="(.*?)"', re.S)
NAV_KEYS = ["home", "courses", "skillhub", "books", "medha", "about", "contact", "roadmap"]


def read(p):
    return p.read_text(encoding="utf-8")


def parse(page_path):
    text = read(page_path)
    m = META_RE.match(text)
    if not m:
        sys.exit(f"ERROR: {page_path} has no <!--meta ... --> line at the top")
    meta = dict(ATTR_RE.findall(m.group(1)))
    for key in ("title", "desc"):
        if key not in meta:
            sys.exit(f"ERROR: {page_path} meta is missing {key}=")
    meta.setdefault("layout", "site")
    meta.setdefault("nav", "")
    if meta["layout"] not in ("site", "portal"):
        sys.exit(f"ERROR: {page_path} layout must be site or portal")
    if meta["nav"] and meta["nav"] not in NAV_KEYS:
        sys.exit(f"ERROR: {page_path} nav must be one of {NAV_KEYS}")
    return meta, text[m.end():]


def mark_active(fragment, nav):
    # <a data-nav="courses" ...> gets aria-current="page" on the active page
    def repl(m):
        tag = m.group(0)
        if m.group(1) == nav:
            return tag.replace("data-nav=", 'aria-current="page" data-nav=', 1)
        return tag
    return re.sub(r'<a\b[^>]*data-nav="(\w+)"', repl, fragment)


def build():
    head = read(PARTIALS / "head.html")
    header = read(PARTIALS / "header.html")
    footer = read(PARTIALS / "footer.html")
    year = str(datetime.date.today().year)
    built = []
    for page in sorted(PAGES.rglob("*.html")):
        rel = page.relative_to(PAGES)
        depth = len(rel.parts) - 1
        root = "../" * depth
        meta, body = parse(page)
        full_title = "QEC Academy" if meta["title"] == "Home" else f'{meta["title"]} | QEC Academy'
        h = (head.replace("{{title}}", html.escape(full_title))
                 .replace("{{desc}}", html.escape(meta["desc"]))
                 .replace("{{extra_css}}",
                          f'<link rel="stylesheet" href="{{{{root}}}}assets/css/portal.css">' if meta["layout"] == "portal" else ""))
        if meta["layout"] == "site":
            out = (h + '<body class="site">\n' + mark_active(header, meta["nav"]) + "\n<main id=\"main\">\n"
                   + body.strip() + "\n</main>\n" + footer
                   + '\n<script src="{{root}}assets/js/site.js" defer></script>\n</body>\n</html>\n')
        else:
            out = (h + '<body class="portal">\n' + body.strip()
                   + '\n<script src="{{root}}assets/js/portal.js" defer></script>\n</body>\n</html>\n')
        out = out.replace("{{root}}", root).replace("{{year}}", year)
        left = re.findall(r"\{\{\w+\}\}", out)
        if left:
            sys.exit(f"ERROR: {rel} still has unreplaced placeholders: {sorted(set(left))}")
        dest = ROOT / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(out, encoding="utf-8")
        built.append(str(rel))
    print("Built", len(built), "pages:", ", ".join(built))


if __name__ == "__main__":
    build()
