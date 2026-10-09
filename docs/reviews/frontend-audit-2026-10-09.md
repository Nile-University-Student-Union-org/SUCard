# SU Card frontend audit — 2026-10-09

Source audit of all `app/` page/layout/error routes, their feature components, and `components/ui/*`; no browser or device session was run. Prior review `ui-review-2026-10-08.md` was checked against the current tree: auth skeletons, mobile walkthrough, offer outage/control states, vendor first-tab loading/export/status confirmation, scanner zoom/offline/KPI states, dialog naming, and student card/wallet copy have landed; they are not reopened here. `AGY` and `CX` refer to the disjoint briefs below; **handoff** rows belong to work already in progress.

## P0 — blocking (0)

## P1 — major (10)

- `app/manifest.ts:5` — The root manifest installs every route as **SU Card Scanner** and launches `/scan`, sending a student installation to a cashier-only route. **CX-1**
- `app/admin-2fa/verify/verify-admin-factor.tsx:19` — A rejected verification request has no `catch/finally`, leaving `busy` true and the only submit action disabled. **CX-1**
- `app/(admin)/admin/layout.tsx:15` — Keyboard users must traverse the full sidebar before `<main>`; add a visible-on-focus bypass target for WCAG 2.4.1 in the ongoing admin redesign. **Handoff**
- `components/student/card-scanner.tsx:229` — Camera permission can resolve after the modal closes; the late stream is assigned and scanning starts after cleanup, leaving the camera live. **CX-2**
- `hooks/use-qr-camera.ts:152` — The cashier camera has the same late-permission race after a tab switch/unmount, so a stopped scanner can restart media capture. **CX-2**
- `components/scanner/scanner-manager.tsx:93` — A state-only validation guard permits different QR callbacks before rerender to launch concurrent validations and overwrite the result panel. **CX-2**
- `components/admin/audit/audit-manager.tsx:127` — A pending “load older” request can append rows from the previous filter after the URL changes, mislabeling audit events. **CX-3**
- `components/admin/settings/settings-manager.tsx:110` — `parseInt` silently converts a fractional physical-card quota such as `1.5` to `1`, changing issuance limits from what the admin entered. **CX-3**
- `components/ui/button.tsx:13` — Dark primary buttons still render white text on light-blue `--brand` (`#52A5E8`), below WCAG AA normal-text contrast; include this in active shared-control styling. **Handoff**
- `components/admin/admin-header.tsx:115` — The mobile menu trigger remains 40×40px, below the requested 44px target; include this in the ongoing admin redesign. **Handoff**

## P2 — minor (15)

- `components/ui/pin-input.tsx:117` — Switching to the error state changes the digit row key and remounts every field, dropping keyboard focus during code correction. **Handoff**
- `components/ui/pin-input.tsx:28` — OTP autofocus defaults on, opening the iOS keyboard before the user chooses a field. **Handoff**
- `components/ui/textarea.tsx:65` — IDs derived only from label text collide when two mounted textareas share a label; labels and error descriptions can target the wrong field. **CX-1**
- `components/ui/overflow-scroller.tsx:97` — Arrow scrolling and the `scroll-smooth` class force motion even with `prefers-reduced-motion`. **CX-1**
- `components/ui/user-nav-dropdown.tsx:246` — The portal menu uses `100vh` for maximum height, so iOS Safari’s visible viewport and safe area can clip the last actions. **CX-1**
- `components/student/history-view.tsx:105` — A “load more” failure sets the page-level error and replaces already loaded redemption history with an error panel. **CX-2**
- `components/landing/lanyard-hero.tsx:61` — `checkWebGLSupport()` creates a canvas on every hero rerender instead of using a stable capability result. **CX-2**
- `hooks/use-qr-camera.ts:61` — The scanner constructs a new `BarcodeDetector` for every video frame, adding avoidable work during continuous camera use. **CX-2**
- `components/vendor/vendor-portal-manager.tsx:453` — A date-filter refresh error hides previously loaded figures instead of retaining them with an unavailable/stale notice. **CX-3**
- `components/vendor/vendor-portal-manager.tsx:433` — The range picker receives the last response range rather than pending `dateRange`, so its selection appears to revert while a request runs or fails. **CX-3**
- `components/admin/vendors/detail/vendor-insights-tab.tsx:102` — A failed refetch with existing data is never surfaced; old analytics remain onscreen without a stale/error indicator. **CX-3**
- `components/landing/how-it-works.tsx:175` — The desktop walkthrough still reserves three viewport heights for three steps, delaying offers and the final CTA; address in active landing motion work. **Handoff**
- `components/student/deals-view.tsx:305` — The only visible partner name is single-line truncated on narrow cards, obscuring who honors the offer. **AGY-2**
- `components/scanner/scanner-viewfinder.tsx:202` — Scanner guidance advertises Apple Wallet QR while the student UI explicitly says Apple Wallet is still in development. **AGY-2**
- `components/admin/vendors/detail/vendor-offer-modal.tsx:243` — A second `72vh` scroll area inside the shared modal makes this long form and its footer fragile with a 360px viewport and open keyboard. **Handoff**

## P3 — polish (5)

- `app/login/page.tsx:314` — Gradient-highlighted hero text repeats a generic SaaS treatment instead of the navy/sky brand hierarchy. **AGY-1**
- `components/landing/offers-carousel.tsx:156` — Gradient text competes with the discount and vendor name for attention; address in active landing motion work. **Handoff**
- `components/landing/offers-carousel.tsx:315` — Repeated card sheen adds unrelated motion to an offer list; let the micro-animation implementer assess and quiet it. **Handoff**
- `components/not-found-view.tsx:74` — The animated 404 ring is decorative perpetual motion on a recovery page; let the micro-animation implementer replace it with a quiet state. **Handoff**
- `components/ui/toast.tsx:183` — The custom toast provider is unused while the app mounts Sonner, leaving a duplicate notification implementation and barrel export; remove after the active date-picker port finishes editing `ui/index.ts`. **CX-1**

## Concurrent handoff checks

- `components/ui/tab-bar.tsx:233` — Current scanner/vendor call sites omit `panelIdPrefix`; the active redesign should connect tabs to named `tabpanel`s and preserve keyboard/focus behavior. **Handoff**
- `components/scanner/scan-valid-panel.tsx:167` — The result sheet renders a second `<main>` inside scanner `<main>`; the panel implementer should use a neutral scroll container and verify Escape, focus return, safe areas, and 360px layout across valid/invalid/success panels. **Handoff**
- `components/admin/qr-studio/editor/editor-view.tsx:169` — Serialized autosave and native-input undo guards now exist; the QR Studio implementer should preserve both while changing the side-by-side editor. **Handoff**

## Disjoint task map

- **AGY-1:** Sign-in presentation — `frontend-tasks/agy-1.txt`.
- **AGY-2:** Operational screen clarity and small-screen layouts — `frontend-tasks/agy-2.txt`.
- **CX-1:** Shared semantics, OTP resilience, manifest, and dead UI code — `frontend-tasks/cx-1.txt`.
- **CX-2:** Camera lifecycle, scanner request guard, student history, and hero capability work — `frontend-tasks/cx-2.txt`.
- **CX-3:** Admin/vendor request-state and quota correctness — `frontend-tasks/cx-3.txt`.
