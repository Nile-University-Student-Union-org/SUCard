---
name: quiz-telemetry-audit-logger
description: "High-fidelity client-side assessment event logging, choice selection & modification tracking, theme switch detection, and exam audit trail recording."
risk: low
source: custom
date_added: "2026-09-24"
---

# Quiz Telemetry & Event Audit Logger Skill

> **Mandate:** In high-stakes assessments, every student interaction, choice modification, environment change, and navigation event must be captured chronologically with sub-second precision to guarantee transparency, prevent dispute, and empower proctoring analytics.

---

## 1. Core Event Taxonomies

### A. Answer Selection & Mutation Events
1. **Option Selection (`option_selected`):**
   - Triggered when a student selects an option for the first time.
   - Must capture: `questionId`, `optionId`, `optionText`, `questionOrder`.
2. **Option Modification (`option_changed`):**
   - Triggered when a student replaces their previous choice with a different option.
   - Must capture: `previousOptionId`, `newOptionId`, `previousOptionText`, `newOptionText`, and time elapsed since previous selection.
3. **Multi-Select Toggle (`option_deselected`):**
   - Triggered when a checkbox is unchecked in multi-select questions.
   - Must capture: `optionId`, `remainingSelectedIds`.
4. **Text / Essay Input Mutation (`text_input_changed`):**
   - Triggered on significant text input changes (debounced or on blur).
   - Must capture: word count, character count delta, and length changes.

### B. Environment & Appearance Events
1. **Theme Switch (`theme_changed`):**
   - Triggered when dark mode, light mode, or system theme is toggled during the exam.
   - Must capture: `previousTheme`, `newTheme`.
2. **Screen / Viewport Resize (`screen_resized`):**
   - Triggered when browser dimensions change.
   - Must capture: `width`, `height`, device orientation.

### C. Integrity & Proctoring Telemetry
1. **Window Blur / Tab Switch (`window_blur`):**
   - Triggered via `window.onblur` or `document.visibilitychange`.
   - Increments the student's `tabSwitchCount`.
2. **Window Focus / Return (`window_focus`):**
   - Triggered via `window.onfocus` or `visibilitychange` returning to visible.
   - Computes `awayDurationSeconds`.
3. **Cursor Boundary Exit (`mouse_left_window`):**
   - Triggered via `mouseleave` on document root.
4. **Clipboard Protection Events (`clipboard_action`):**
   - Traps copy (`Ctrl+C`), paste (`Ctrl+V`), cut (`Ctrl+X`) attempts.
5. **Context Menu Trapping (`context_menu_blocked`):**
   - Traps right-click context menu invocations.
6. **Network Freeze / Recovery (`network_disconnected`, `network_reconnected`):**
   - Traps online/offline connectivity shifts.

---

## 2. Telemetry State Management & Zero Data Loss
- All event logs must reside in the Zustand persistent store (`useAssessmentStore`) bound to the active `QuizAttempt`.
- Logs must be accessible to both student results review (`/courses/[id]/quizzes/[quizId]/results`) and teacher proctoring dashboards (`/teacher/courses/[id]/proctoring`).
