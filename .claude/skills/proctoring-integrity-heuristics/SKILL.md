---
name: proctoring-integrity-heuristics
description: "Exam proctoring heuristics, tab-switch detection, background away duration computation, clipboard interception, and live student integrity matrices."
risk: low
source: custom
date_added: "2026-09-24"
---

# Proctoring Integrity Heuristics Skill

> **Mandate:** Provide automated heuristics and telemetry analysis for online assessments without intruding on learner privacy while maintaining strict academic integrity.

---

## 1. Key Integrity Telemetry Signals

1. **Tab Switch & Focus Loss Counter:**
   - Detects when the user minimizes the browser, switches tabs, or opens external applications.
   - Categorizes violations into severity levels:
     - 1 tab switch: Warning (`severity: "warning"`)
     - ≥ 2 tab switches: Danger / Proctor Escalation (`severity: "danger"`)

2. **Away Duration Tracking:**
   - Measures the total contiguous seconds the exam tab remained un-focused.
   - If away duration exceeds 15 seconds, trigger an alert in the teacher's live SignalR proctoring feed.

3. **Input & Clipboard Interception:**
   - Intercepts unauthorized copy/paste/cut attempts in question text or answers.
   - Logs timestamp, target question, and attempted action.

4. **Multi-Monitor / Cursor Boundary Detection:**
   - Flags when cursor leaves the window bounds repeatedly during an active question attempt.

---

## 2. Instructor Live Oversight
- Telemetry matrices must surface live connection status (`live`, `disconnected`, `submitted`), tab switch counts, question progress, and a chronological audit modal for every participant.
