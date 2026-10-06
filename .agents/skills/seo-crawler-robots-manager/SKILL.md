---
name: seo-crawler-robots-manager
description: "Directives, maintenance guidelines, and security policies for robots.txt, sitemaps, and search engine crawler boundaries."
risk: low
source: custom
date_added: "2026-09-24"
---

# SEO Crawler & Robots.txt Manager Skill

> **Mandate:** Maintain strict crawler boundaries across The Canvas platform. Allow indexing of public educational marketing pages, course catalogs, and knowledge bases while forbidding search engine crawlers from indexing private tenant dashboards, exam rooms, student profiles, grading feeds, and administrative control panels.

---

## 1. Directory & Route Indexing Matrix

| Route Pattern | Crawler Policy | Rationale |
| :--- | :--- | :--- |
| `/` | `Allow` | Public homepage & platform landing |
| `/courses` | `Allow` | Public course catalog & previews |
| `/about`, `/contact`, `/pricing` | `Allow` | Marketing & platform info |
| `/login`, `/signup` | `Allow` | Authentication entrypoints |
| `/admin/*` | `Disallow` | Zero-Trust SuperAdmin control surfaces |
| `/teacher/*` | `Disallow` | Protected educator cohort & grading portals |
| `/owner/*` | `Disallow` | Tenant owner analytics & financial metrics |
| `/courses/*/learn` | `Disallow` | Enrolled learner classroom |
| `/courses/*/quizzes/*` | `Disallow` | High-stakes exam rooms & live proctoring |
| `/profile-selector` | `Disallow` | Multi-profile account switcher |
| `/settings/*`, `/notifications/*` | `Disallow` | Private user preferences & real-time alerts |
| `/api/*`, `/hubs/*` | `Disallow` | Backend REST endpoints & SignalR WebSockets |

---

## 2. Mandatory Synchronization Tenet
Whenever any new route or page (`page.tsx`) is added to `ROUTES.md`:
1. Check if the route is public or private.
2. If private or contains user data, ensure `frontend/public/robots.txt` disallows crawler access.
3. Keep `robots.txt` updated in the same transaction as `ROUTES.md` and `AGENTS.md`.
