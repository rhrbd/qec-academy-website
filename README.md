# QEC Academy Platform (template v2)

The new web platform for **QEC Academy** (Quarantine Education Care): one public website and four private portals, each on its own address.

| Folder in `dist/` | Address | Who | Public? |
| --- | --- | --- | --- |
| `www/` | qecacademy.com | Everyone: courses, Skill Hub, books, Medha, about, contact, **student sign up, log in, My Account** | Public |
| `student/` | student.qecacademy.com | Enrolled students and guardians | Private |
| `teacher/` | teacher.qecacademy.com | Teachers | Private |
| `sales/` | sales.qecacademy.com | Sales and admissions team | Private |
| `office/` | office.qecacademy.com | Office and management (includes the platform roadmap) | Private |
| `index.html` | (preview only) | Preview hub for management review; not deployed to any domain | — |

The Medha Onneshon exam site stays in its own repo (`rhrbd/qec-medha`, medha.qecacademy.com).

## Enrollment flow

1. A student **signs up** on qecacademy.com and **applies** for a course and batch.
2. The guardian **pays manually** (bKash, Nagad, Rocket, bank, or cash at the office) and enters the transaction ID in My Account.
3. The sales team checks the payment on **sales.qecacademy.com** and presses **Verify and Enroll** (batch, amount, method, transaction ID).
4. A **Student ID and PIN** are created and the **Student Portal** opens for that student. Upcoming programs (Class 9 and 10) take a waitlist instead.

Only step 2 is manual; online payment can replace it later without changing the other steps.

## How private portals are kept private

- Never linked from the public menu or footer. The public site links only to the Student Portal sign-in, for enrolled students.
- `noindex` meta tag, `X-Robots-Tag` header and `robots.txt: Disallow: /` in every private app.
- `.htaccess` in each private app redirects any other host to its own subdomain (so qecacademy.com/sales/ never serves the sales desk).
- Each portal opens on a sign-in screen; dashboards send anyone without a session back to it.
- **At launch, real security is enforced by the QEC backend**: it checks every sign-in and every data request by role. The static pages alone are not a security boundary.

## Code layout

```
_src/assets/        shared CSS, JS, images, fonts (copied into every app)
  js/qec-core.js    environment, cross-app links, safe storage, toast
  js/qec-api.js     ALL platform calls (signup, login, enrollments, payments, approvals, portal sign-in)
  js/catalog.js     courses, books and payment accounts (template data)
  js/site.js        public site behaviour: motion, course cards, filters, forms
  js/portal.js      portal behaviour: views, menu, sign out
_src/partials/      head, public header and footer, private sign-in gate
_src/<app>/pages/   pages of each app
_src/hub.html       preview hub
tools/build.py      builds dist/
```

Edit sources, then run `python3 tools/build.py` and commit both `_src` and `dist`.

### Preview edition of the API

In this template `qec-api.js` answers every call in the browser (data kept on the device), so the full flow can be demonstrated without a server. For launch, replace each function body with a `fetch()` to the QEC backend, keeping the same names and return shapes. No page needs to change.

Preview sign-ins: Student sample 50412 / 123456 (or the ID and PIN from a test enrollment), Sales 70003 / 1234, Teacher 90003 / 1234, Office 70001 / 1234.

## Hosting on Hostinger later

1. hPanel > Websites > qecacademy.com > Advanced > **Git**: repository `https://github.com/rhrbd/qec-academy-website`, branch `main`.
2. Point the main domain's document root to `dist/www`.
3. Create subdomains `student`, `teacher`, `sales`, `office` with document roots `dist/student`, `dist/teacher`, `dist/sales`, `dist/office`.
4. Turn on auto-deploy so every push updates all five.

## Design

Plum `#5b1462` and amber `#f3ae3c` from the QEC logo; Baloo Da 2 and Hind Siliguri (Kalpurush offline fallback). Cinematic hero with drawn annotations, scroll reveals, counters, featured carousel, animated course cards. All motion turns off for visitors who choose reduced motion. Headings and buttons use Title Case.

Values marked with an amber dot are sample content (fees, book titles, teachers, payment accounts, address).

Maintainer: Rifat Hasan (IT, QEC Academy)
