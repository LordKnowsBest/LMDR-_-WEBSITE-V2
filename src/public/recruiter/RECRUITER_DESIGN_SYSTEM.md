# Recruiter Design System

Use this system to replicate Recruiter OS neumorphism across recruiter surfaces.

## 1. Import

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/recruiter/recruiter-design-system.css">
```

For `src/public/recruiter/os/RecruiterOS.html`, use:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/recruiter/recruiter-design-system.css">
```

## 2. Core Tokens

- Background: `--rds-bg` (`#f5f5dc`)
- Shadow pair: `--rds-shadow-dark` / `--rds-shadow-light`
- Primary accent: `--rds-primary` (`#2563eb`)
- Elevations: `--rds-elev-1` / `--rds-elev-2` / `--rds-elev-3`
- Inset fields: `--rds-inset-1` / `--rds-inset-2`

## 3. Primary Building Blocks

- Containers: `rds-surface`, `rds-surface-soft`, `rds-grid-bg`
- Panels: `rds-panel`, `rds-panel-strong`, `rds-panel-inset`, `rds-card`
- KPI cards: `rds-kpi`, `rds-kpi-label`, `rds-kpi-value`
- Buttons: `rds-btn`, `rds-btn-primary`, `rds-btn-danger`, `rds-btn-ghost`
- Inputs: `rds-input`, `rds-select`, `rds-textarea`
- Status: `rds-chip`, `rds-badge`, `rds-badge-success`, `rds-badge-warn`, `rds-badge-danger`
- Navigation: `rds-nav-item` + `is-active`

## 4. Example

```html
<section class="rds-surface rds-grid-bg" style="padding: 16px;">
  <div class="rds-kpi rds-animate-in">
    <p class="rds-kpi-label">Qualified Drivers</p>
    <p class="rds-kpi-value">124</p>
  </div>
  <div style="margin-top: 12px; display: flex; gap: 8px;">
    <button class="rds-btn rds-btn-primary">Message</button>
    <button class="rds-btn">Save</button>
  </div>
</section>
```

## 5. Theme Variant (Optional)

Set `data-rds-theme="midnight"` on any container to switch to a dark recruiter variant:

```html
<div data-rds-theme="midnight">...</div>
```


