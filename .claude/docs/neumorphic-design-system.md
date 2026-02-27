# Solarized Neumorphic Design System
**Applies to:** All non-driver surfaces — Admin, Recruiter, Carrier, B2B (VelocityMatch-branded)
**Exempt:** Driver surfaces (use LMDR brand styling)
**Primary skill file:** `.agents/skills/recruiter-os-design-system/SKILL.md`
**Visual guides:** `.agents/skills/recruiter-os-design-system/resources/`

---

## The Lighting Principle

Neumorphism simulates physical depth through paired shadows from a **45° top-left light source**:

```
☀️  (top-left)
 ↘
┌──────────────────────────┐
│  HIGHLIGHT top-left      │  → light shadow: -x, -y (#FFFFF5 / rgba(88,110,117,.3))
│                          │
│       SURFACE            │  → background (#F5F5DC light, #002B36 dark)
│                          │
│  SHADOW bottom-right     │  → dark shadow: +x, +y (#C8B896 light, #05232c dark)
└──────────────────────────┘
```

- **Raised (extruded):** `box-shadow: Xpx Xpx Ypx DARK, -Xpx -Xpx Ypx LIGHT`
- **Pressed (recessed):** `box-shadow: inset Xpx Xpx Ypx DARK, inset -Xpx -Xpx Ypx LIGHT`
- **Rule:** Shadows are ALWAYS paired. Never use a single-side shadow.

---

## Elevation Scale

### Raised — Elements that "pop out"
```css
.neu-x  { box-shadow:  2px  2px  5px var(--ros-shadow-d), -2px  -2px  5px var(--ros-shadow-l); }
.neu-s  { box-shadow:  3px  3px  6px var(--ros-shadow-d), -3px  -3px  6px var(--ros-shadow-l); }
.neu    { box-shadow:  6px  6px 12px var(--ros-shadow-d), -6px  -6px 12px var(--ros-shadow-l); }
.neu-lg { box-shadow: 12px 12px 24px var(--ros-shadow-d), -12px -12px 24px var(--ros-shadow-l); }
```

### Pressed — Elements "pushed into" the surface
```css
.neu-ins { box-shadow: inset 2px 2px  4px var(--ros-shadow-d), inset -2px -2px  4px var(--ros-shadow-l); }
.neu-in  { box-shadow: inset 4px 4px  8px var(--ros-shadow-d), inset -4px -4px  8px var(--ros-shadow-l); }
.neu-ind { box-shadow: inset 8px 8px 16px var(--ros-shadow-d), inset -8px -8px 16px var(--ros-shadow-l); }
```

### Usage Guide
| Class | Use For |
|-------|---------|
| `neu-x` | Tool orbs, tiny buttons, filter pills |
| `neu-s` | Small cards, drawer sections, rail items |
| `neu` | Main content cards, panels, command bar |
| `neu-lg` | Modals, floating panels, spotlight overlays |
| `neu-ins` | Subtle wells, progress bars, XP bars |
| `neu-in` | Text inputs, search bars, filter areas |
| `neu-ind` | Deep content wells, activity feeds |

---

## Color Palette

### Light Mode: Solarized Beige

| Role | Hex | Tailwind Class | CSS Variable |
|------|-----|---------------|--------------|
| **Background** | `#F5F5DC` | `bg-beige` | `--ros-surface` |
| **Shadow dark** | `#C8B896` | `text-tan` | `--ros-shadow-d` |
| **Shadow light** | `#FFFFF5` | `text-ivory` | `--ros-shadow-l` |
| **Deep surface** | `#E8D5B7` | `bg-beige-d` | `--ros-bg-d` |
| **Primary text** | `#0f172a` | `text-lmdr-dark` | `--ros-text` |
| **Muted text** | `rgba(15,23,42,.55)` | `text-tan` | `--ros-text-muted` |
| **Primary action** | `#2563eb` | `text-lmdr-blue` | `--ros-accent` |
| **Deep action** | `#1e40af` | `text-lmdr-deep` | `--ros-accent-d` |
| **Success** | `#859900` | `text-sg` | — |
| **Warning** | `#CB4B16` | `text-solar-orange` | — |
| **Danger** | `#DC322F` | `text-solar-red` | — |
| **Info** | `#268BD2` | `text-solar-blue` | — |
| **XP / badge** | `#fbbf24` | `text-lmdr-yellow` | — |

### Dark Mode: Solarized Dark (`html.dark` or `data-rds-theme='midnight'`)

| Role | Solarized Name | Hex | CSS Variable |
|------|---------------|-----|-------------|
| **Background** | Base03 | `#002B36` | `--ros-surface` |
| **Shadow dark** | Deep | `#05232c` | `--ros-shadow-d` |
| **Shadow light** | Base01 30% | `rgba(88,110,117,.3)` | `--ros-shadow-l` |
| **Secondary surface** | Base02 | `#073642` | `--ros-bg-d` |
| **Primary text** | Base0 | `#839496` | `--ros-text` |
| **Muted text** | Base01 | `#586E75` | `--ros-text-muted` |
| **Heading text** | Base1 | `#93A1A1` | (Tailwind override) |
| **Accent** | Solar Blue | `#268BD2` | `--ros-accent` |

Dark mode neumorphic shadows differ from light mode:
```css
/* Dark raised */
.neu    { box-shadow: 6px 6px 12px #05232c, -4px -4px 10px rgba(88,110,117,.3); }
.neu-s  { box-shadow: 3px 3px 6px #05232c, -2px -2px 5px rgba(88,110,117,.25); }
.neu-lg { box-shadow: 12px 12px 24px #05232c, -8px -8px 20px rgba(88,110,117,.2); }

/* Dark pressed */
.neu-in { box-shadow: inset 4px 4px 8px #05232c, inset -3px -3px 6px rgba(88,110,117,.2); }
```

---

## Typography

**Font:** Inter (weights 300–900) via Google Fonts. JetBrains Mono for data/code.

| Element | Size | Weight | Tailwind |
|---------|------|--------|----------|
| Page heading | 18px | 700 | `text-lg font-bold text-lmdr-dark` |
| Section heading | 14px | 700 | `text-[14px] font-bold text-lmdr-dark` |
| Card heading | 13px | 700 | `text-[13px] font-bold text-lmdr-dark` |
| Body | 12px | 500 | `text-[12px] font-medium text-lmdr-dark` |
| Label / tag | 10–11px | 700 | `text-[10px] font-bold text-tan uppercase tracking-wider` |
| Micro / badge | 8–9px | 700 | `text-[9px] font-bold text-tan` |
| KPI value | 20–24px | 900 | `text-[22px] font-black text-lmdr-dark` |

---

## Component Patterns

### Card
```html
<div class="neu rounded-2xl p-5">
  <h3 class="text-[14px] font-bold text-lmdr-dark mb-3">Title</h3>
  <p class="text-[12px] text-tan">Content</p>
</div>
```

### KPI Stat
```html
<div class="neu-s p-4 rounded-xl text-center">
  <span class="material-symbols-outlined text-lmdr-blue text-[20px]">trending_up</span>
  <h3 class="text-[22px] font-black text-lmdr-dark mt-1">128</h3>
  <p class="text-[9px] font-bold uppercase tracking-widest text-tan mt-1">Active Drivers</p>
</div>
```

### Inset Input
```html
<div class="flex items-center px-4 py-3 neu-in rounded-xl">
  <span class="material-symbols-outlined text-tan text-[18px]">search</span>
  <input class="bg-transparent border-none focus:ring-0 text-base text-lmdr-dark placeholder-tan/50 w-full ml-2 outline-none font-medium"
         placeholder="Search..."/>
</div>
```

### Raised Button
```html
<!-- Standard -->
<button class="px-4 py-2 rounded-xl neu-x font-bold text-[13px] text-lmdr-dark">Action</button>

<!-- Primary gradient -->
<button class="px-4 py-2 rounded-xl bg-gradient-to-br from-lmdr-blue to-lmdr-deep text-white font-bold text-[13px] shadow-lg shadow-lmdr-blue/30">Primary</button>
```

### Filter Pill
```html
<!-- Default -->
<button class="px-3 py-1.5 text-[10px] font-bold rounded-full neu-x text-tan">CDL-A</button>
<!-- Active -->
<button class="px-3 py-1.5 text-[10px] font-bold rounded-full bg-lmdr-blue text-white">CDL-A</button>
```

### Badge / Status Chip
```html
<!-- Info -->
<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-lmdr-blue/10 text-lmdr-blue">Active</span>
<!-- Success -->
<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-sg/10 text-sg">Verified</span>
<!-- Warning -->
<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">Pending</span>
```

---

## Tailwind Config (Required for Wix Iframes)

All non-driver HTML files must include this inline Tailwind config (no external `lmdr-config.js`):

```html
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<script>
  tailwind.config = {
    darkMode: 'class',
    theme: {
      extend: {
        colors: {
          'lmdr-blue':  '#2563eb', 'lmdr-deep':   '#1e40af',
          'lmdr-yellow':'#fbbf24', 'lmdr-dark':   '#0f172a',
          'beige':      '#F5F5DC', 'beige-d':     '#E8E0C8',
          'tan':        '#C8B896', 'ivory':        '#FFFFF5',
          'sg':         '#859900',
          'solar-blue': '#268BD2', 'solar-green': '#859900',
          'solar-orange':'#CB4B16','solar-red':   '#DC322F',
        },
        fontFamily: { 'd': ['Inter', 'sans-serif'] }
      }
    }
  };
</script>
```

---

## Anti-Patterns (NEVER DO THESE)

| ❌ Don't | ✅ Do Instead |
|----------|--------------|
| `box-shadow: 0 4px 6px rgba(0,0,0,.1)` | Use `neu`, `neu-s`, `neu-x`, `neu-in`, etc. |
| `background: white` or `background: #fff` | `bg-beige` / `var(--ros-surface)` |
| `color: #333` or `text-gray-*` | `text-lmdr-dark` or `text-tan` |
| `border: 1px solid #ccc` | `border border-tan/20` |
| Font Awesome icons | Material Symbols Outlined only |
| `style="opacity: 0.5"` via Tailwind `text-tan/50` in innerHTML | Use inline styles — Tailwind CDN play mode won't generate opacity-modifier classes for dynamically-injected HTML |

---

## CSS File Reference

| File | Scope | Contents |
|------|-------|----------|
| `src/public/recruiter/os/css/recruiter-os.css` | RecruiterOS only | `--ros-*` tokens, all `neu-*` classes, dark mode overrides |
| `src/public/recruiter/recruiter-design-system.css` | Cross-page | `--rds-*` tokens, `rds-btn`, `rds-card`, `rds-input`, etc. |

**For new non-driver pages**, load `recruiter-design-system.css` via CDN:
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/recruiter/recruiter-design-system.css"/>
```

---

## Compliance Checklist

Before considering any non-driver UI work complete:

- [ ] All surfaces use `bg-beige` / `var(--ros-surface)`, never hardcoded white/gray
- [ ] All shadows use neumorphic elevation classes (`neu`, `neu-s`, `neu-x`, `neu-in`, etc.)
- [ ] All primary text uses `text-lmdr-dark`, muted text uses `text-tan`
- [ ] All icons use Material Symbols Outlined
- [ ] All inputs have pressed/inset style (`neu-in` or `neu-ins`)
- [ ] All buttons have raised style (`neu-x` or `neu-s`) unless using gradient primary
- [ ] 45° lighting principle maintained (light top-left, shadow bottom-right)
- [ ] Dark mode tokens correct when `html.dark` is applied
- [ ] No arbitrary `box-shadow` values
