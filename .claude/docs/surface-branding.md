# Surface Branding Rules

## Brand by Surface

| Surface | Brand Name | Logo Icon | Subtitle |
|---------|-----------|-----------|----------|
| **Driver** (`src/public/driver/`) | LMDR | LM | -- |
| **Carrier** (`src/public/carrier/`) | VelocityMatch | VM | Carrier OS |
| **Recruiter** (`src/public/recruiter/`) | VelocityMatch | VM | Recruiter OS |
| **Admin** (`src/public/admin/`) | VelocityMatch | VM | Admin |
| **Utility** (`src/public/utility/`) | VelocityMatch | VM | -- |
| **Landing** (`src/public/landing/`) | VelocityMatch | VM | -- |
| **Collateral** (`src/public/collateral/`) | VelocityMatch | VM | -- |

## Rule

**All non-driver HTML surfaces must use VelocityMatch branding.** Only `src/public/driver/` files use LMDR.

## Branding Elements

### Sidebar Logo Icon (non-driver)
```html
<div class="...">VM</div>
```

### Sidebar Brand Name (non-driver)
```html
<h1 class="font-bold text-white text-sm tracking-tight">Velocity<span class="text-blue-400">Match</span></h1>
```

### Page Title Tags (non-driver)
```html
<title>Page Name | VelocityMatch</title>
```

## Prohibited Patterns on Non-Driver Surfaces

These patterns must NOT appear in any file outside `src/public/driver/`:

- `>LM</div>` (old logo icon)
- `LMDR<span` or `LMDR.ai` (old brand name)
- `<title>...LMDR...</title>` (old title reference)
