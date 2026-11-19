# QEC Academy website (template)

The new public website and portal screens for **QEC Academy** (Quarantine Education Care), planned for **qecacademy.com**.
This version is a **template for management review**: every page and screen is built, and names, numbers and prices marked with an amber dot are sample content.

## What is inside

| Area | Pages |
| --- | --- |
| Public site | Home, Courses (filter by class, mode and type), Skill Hub, QEC Mastering books, Medha Onneshon 2026, About + teachers + hall of fame, Admission, Contact |
| One login | `login.html`: Student, Guardian, Teacher, Sales, Office, plus a link to the separate Medha exam login |
| Portals | `portal/student.html` (also guardian view with `?view=guardian`), `portal/teacher.html`, `portal/sales.html`, `portal/admin.html` |
| Plan | `roadmap.html`: timeline, how the systems fit, and a list of every page |

The live Medha Onneshon exam site stays in its own repo (`rhrbd/qec-medha`, `medha.qecacademy.com`); this site only links to it.

## How it is built

- Plain HTML, CSS and JavaScript. No framework and no build step is needed to host it.
- Brand: QEC plum `#5b1462` and amber `#f3ae3c` from the QEC logo; fonts Baloo Da 2 and Hind Siliguri (Google Fonts) with Kalpurush as an offline Bangla fallback.
- `manifest.webmanifest` lets phones install the site as an app ("Add to Home screen") at no cost.
- Forms check input (Bangladesh mobile numbers, Gmail, required fields) but **send nothing yet**.
- Course, Skill Hub and book data live in one file, `assets/js/catalog.js`, so a backend can replace it later.

### Editing pages

Edit the sources, then rebuild:

```
_src/partials/   head.html, header.html, footer.html (shared on every public page)
_src/pages/      one file per page; portal screens in _src/pages/portal/
python3 tools/build.py
```

`build.py` writes the finished HTML files to the repository root. Commit both the `_src` change and the rebuilt HTML.

## Putting it on Hostinger later

1. hPanel > Websites > qecacademy.com > Advanced > **Git**.
2. Repository: `https://github.com/rhrbd/qec-academy-website`, branch `main`, install path empty (public_html).
   For a private repo, add the SSH deploy key that hPanel shows to GitHub > Settings > Deploy keys.
3. Deploy. Turn on auto-deployment so every push updates the site.
4. Keep `medha.qecacademy.com` pointing where it is today.

## Next steps

1. Replace sample content (prices, book titles, teachers, photos, address, policies).
2. Connect forms and sign-in to the QEC Master Database through an API layer.
3. Move Teacher Portal features into `portal/teacher.html`.

Maintainer: Rifat Hasan (IT, QEC Academy)
