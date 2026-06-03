# 🎨 Everyday Tracker — UI Theme Guide

> A fresh, cozy, and modern productivity app design system inspired by the warmth of a well-lit workspace — clean lines, soft depth, and vibrant accent pops.

---

## 🌈 Color Palette

### Background & Surface

| Token | Light Value | Description |
|---|---|---|
| `--et-bg` | `hsl(220 20% 97%)` | Page background |
| `--et-surface` | `hsl(0 0% 100%)` | Card / panel surface |
| `--et-surface-2` | `hsl(220 18% 96%)` | Elevated surface |
| `--et-sidebar-bg` | `hsl(228 30% 98%)` | Sidebar background |
| `--et-sidebar-hover` | `hsl(228 50% 97%)` | Sidebar item hover |
| `--et-sidebar-active` | `hsl(252 100% 97%)` | Sidebar active item |

### Brand Accent Colors (Colorful!)

| Token | Value | Use |
|---|---|---|
| `--et-violet` | `#7c5cfc` | Primary brand, active states |
| `--et-sky` | `#0ea5e9` | AI Assistant, info |
| `--et-emerald` | `#10b981` | Notes, success |
| `--et-amber` | `#f59e0b` | Calendar, warnings |
| `--et-rose` | `#f43f5e` | Tasks & Kanban, alerts |
| `--et-indigo` | `#6366f1` | Pages & Spaces |
| `--et-teal` | `#14b8a6` | Whiteboard |
| `--et-orange` | `#f97316` | AI Templates |

### Text

| Token | Value | Use |
|---|---|---|
| `--et-text-primary` | `hsl(222 30% 15%)` | Headlines, labels |
| `--et-text-secondary` | `hsl(222 15% 42%)` | Body text, descriptions |
| `--et-text-muted` | `hsl(222 10% 62%)` | Meta, placeholders |

### Borders

| Token | Value | Use |
|---|---|---|
| `--et-border` | `hsl(220 20% 90%)` | Component borders |
| `--et-border-subtle` | `hsl(220 15% 94%)` | Dividers, section separators |

---

## ✍️ Typography

```css
/* Primary: Inter — Clean, readable, modern */
--et-font-sans: 'Inter', system-ui, sans-serif;

/* Display: Outfit — Friendly, rounded, expressive */
--et-font-display: 'Outfit', 'Inter', sans-serif;
```

| Scale | Size | Weight | Use |
|---|---|---|---|
| `xs` | `0.6875rem` | 400 | Badges, group labels |
| `sm` | `0.8125rem` | 400/500 | Sidebar items, activity |
| `base` | `0.9375rem` | 400 | Body text, widget titles |
| `lg` | `1.125rem` | 600 | Section headings |
| `xl` | `1.375rem` | 700 | Page titles |
| `2xl` | `1.75rem` | 800 | Hero / display headings |

---

## 📐 Spacing, Radius & Layout

```css
/* Sidebar widths */
--et-sidebar-width: 232px;         /* Expanded */
--et-sidebar-collapsed: 64px;      /* Icon-only */

/* Border radius */
--et-radius-sm: 6px;
--et-radius-md: 10px;
--et-radius-lg: 14px;
--et-radius-xl: 20px;
--et-radius-full: 9999px;

/* Shadows */
--et-shadow-sm: 0 1px 3px rgba(0,0,0,0.05);
--et-shadow-md: 0 4px 12px rgba(0,0,0,0.08);

/* Animation */
--et-ease: cubic-bezier(0.4, 0, 0.2, 1);
--et-duration: 220ms;
```

---

## 🎨 Sidebar Icon Color Map

| Menu Item | Lucide Icon | Color |
|---|---|---|
| Dashboard | `LayoutDashboard` | `#7c5cfc` (violet) |
| AI Assistant | `Sparkles` | `#0ea5e9` (sky) |
| AI Templates | `Wand2` | `#f97316` (orange) |
| Calendar | `Calendar` | `#f59e0b` (amber) |
| Tasks & Kanban | `Kanban` | `#f43f5e` (rose) |
| Notes | `NotebookPen` | `#10b981` (emerald) |
| Whiteboard | `PenTool` | `#14b8a6` (teal) |
| Pages & Spaces | `BookOpen` | `#6366f1` (indigo) |
| Settings | `Settings2` | `#94a3b8` (slate) |

---

## 🧩 Design Principles

1. **Fresh & Breathable** — Generous whitespace, never cluttered
2. **Colorful Accents** — Each feature gets its own vibrant accent
3. **Smooth Transitions** — All states use `220ms cubic-bezier(0.4, 0, 0.2, 1)`
4. **Grouped Sidebar** — Items grouped under uppercase labels: Overview, Intelligence, Workspace, Content, System
5. **Cozy Depth** — Soft shadows over hard borders, rounded corners everywhere
6. **Responsive** — Sidebar collapses to icon-only, grid reflows gracefully

---

## 💡 Component States

```
Default   → Muted icon, secondary text color, transparent background
Hover     → Accent tint background, primary icon color, slight lift (-1px)
Active    → Accent background + left border accent strip, full icon color, bold label
Disabled  → 40% opacity, no pointer events
```

---

## 📁 File Structure

```
app/
  layout.tsx            ← Root layout (fonts, ClerkProvider)
  globals.css           ← All theme tokens + component styles
  dashboard/
    layout.tsx          ← Dashboard shell (Sidebar + main content)
    page.tsx            ← Dashboard home (stats, quick actions, activity)
components/
  sidebar.tsx           ← Collapsible sidebar with grouped nav
docs/
  theme.md              ← This file
```
