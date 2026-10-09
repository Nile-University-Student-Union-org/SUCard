<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# SU Card — project rules

Digital + physical membership card for Nile University Student Union (NUSU). Specs live in `docs/`:
`docs/REQUIREMENTS.md`, `docs/ARCHITECTURE.md` (plus `DEPLOY.md`, `EMAIL-SETUP.md`, `PRIVACY-NOTICE.md`).

## Stack

Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind CSS 4 + shadcn/ui (`base-nova` style, Base UI primitives, `cn` from `"cn"`) · PostgreSQL 17 + Drizzle ORM (`pg` driver) · Better Auth · Zod 4 · Vitest · pnpm.

## Layout

```
app/(admin)/admin/…     admin panel pages       app/api/…       route handlers
app/login/              staff login             components/ui/  shared shadcn components
components/admin/…      admin feature UI        lib/db/         Drizzle schema + client
lib/auth/               Better Auth + guards    lib/cards/      tokens, batches, export
lib/qr-style/           QR SVG renderer         scripts/        seed & maintenance
drizzle/                migrations              docs/           specs, designs, brand source files
public/brand/           logos used by the app
```

## Commands (gates)

```
pnpm typecheck      # next typegen && tsc --noEmit
pnpm lint           # eslint
pnpm test           # vitest run
pnpm build          # next build
pnpm db:up          # start Postgres + Redis (Docker)
pnpm db:generate    # drizzle-kit generate (after schema changes)
pnpm db:migrate     # apply migrations
pnpm db:seed        # create first super admin from .env.local
```

## Brand

Colors: black `#000000`, navy `#0F3056` (primary), blue `#0F548D`, sky `#018BCE` (accent), white.
Fonts: **Anton** (display/headings), **Poppins** (body/UI). Logos in `public/brand/`.

## Rules

- Validate every input with Zod on the server. Check the role on the server in every route/action.
- Don't add dependencies without saying so in your report.
- Shared contracts: `lib/cards/types.ts` (cards API JSON) and `lib/auth/guards.ts` (auth helpers). Keep signatures stable.
- Never cache scan/claim/auth decisions.
- Don't commit; the orchestrator reviews and commits.
- Never use the "sparkles" icon (lucide Sparkles / Sparkle / WandSparkles / stars, or any similar AI-sparkle glyph) in any UI, in any project. Pick a meaningful icon or none.
- UI work: before designing or restyling, read and follow C:\Users\Ahmed\.claude\plugins\cache\taste-skill\taste-skill\1.0.0\skills\taste-skill\SKILL.md (and redesign-skill\SKILL.md when reworking an existing screen), within this project's brand rules. Also follow the impeccable skill (~/.claude/skills/impeccable/SKILL.md or ~/.gemini/skills/impeccable/SKILL.md, incl. its anti-patterns reference) and the frontend-design skill (~/.claude/plugins/cache/claude-plugins-official/frontend-design/*/skills/frontend-design/SKILL.md).
- Codebase map: before exploring, read graphify-out/GRAPH_REPORT.md (knowledge graph of modules, god nodes, communities) to find relevant files fast.
