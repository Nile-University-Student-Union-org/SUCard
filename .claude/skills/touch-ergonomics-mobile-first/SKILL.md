---
name: touch-ergonomics-mobile-first
description: Touch-first ergonomics, minimum 44px hitboxes, thumb-zone action placement, iOS safe area insets (pb-safe), and bottom-sheet modal behaviors.
risk: safe
source: custom
date_added: "2026-09-24"
---

# Touch Ergonomics & Mobile-First Architecture

## Purpose & Scope
This skill enforces strict mobile-first ergonomics, minimum touch target bounding boxes, thumb-zone primary action placement, and device safe-area management.

## 📱 Core Ergonomic Tenets

### 1. Mandatory Minimum Hitbox Dimension (≥ 44px × 44px)
- **Zero-Tolerance Rule:** Every clickable, tappable, or interactive element MUST satisfy minimum dimensions of **≥ 44px × 44px**:
  ```css
  min-h-[44px] min-w-[44px]
  ```
- **Small Icon Buttons:** If visual icon is small (e.g. 16px-20px), padding must expand the bounding box to at least 44px (`p-2.5` to `p-3`).

### 2. Thumb-Zone Action Placement
- On mobile viewports (`< 640px`):
  - Primary call-to-action buttons (e.g. "Save Notes", "Enroll Now", "Submit Assignment") must be sticky or docked at the bottom within the natural thumb sweep zone.
  - Modals convert into bottom sheets (`rounded-t-[24px]` with a visual drag handle).

### 3. iOS Safe-Area Padding (`pb-safe`)
- Any fixed or sticky bottom element must incorporate safe-area insets for modern iPhone home indicators:
  ```css
  pb-safe /* or pb-[calc(1rem+env(safe-area-inset-bottom))] */
  ```

### 4. Zero Horizontal Scrolling
- Mobile pages must never trigger horizontal body scrolling (`overflow-x-hidden` on wrappers and `w-full` on child containers).
