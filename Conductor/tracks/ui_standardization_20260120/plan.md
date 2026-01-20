# Implementation Plan: Landing Page Standardization

## Goal
Standardize all 18 HTML files in `src/public/landing/` to use the unified design system. This eliminates inline configurations and hardcoded colors, ensuring consistency across the platform.

## User Review Required
> [!NOTE]
> This plan modifies public-facing landing pages. Visual changes should be minimal (token replacement).

## Proposed Changes

### Shared configuration
- **Target**: `src/public/landing/*.html`
- **Action**: 
    - Remove `<script>tailwind.config = { ... }</script>` blocks.
    - Add `<script src="../lmdr-config.js"></script>`.
    - Ensure Font Awesome is used.

### Color Tokenization
- **Target**: `src/public/landing/*.html`
- **Action**: Replace hardcoded Tailwind classes with LMDR semantic tokens:
    - `bg-blue-600` → `bg-lmdr-blue`
    - `text-blue-600` → `text-lmdr-blue`
    - `bg-yellow-400` → `bg-lmdr-yellow`
    - `text-yellow-400` → `text-lmdr-yellow`
    - `bg-slate-900` → `bg-lmdr-dark`
    - `text-slate-900` → `text-lmdr-dark`

## Verification Plan

### Automated Verification
Run the custom validation script:
```powershell
powershell -ExecutionPolicy Bypass -File Conductor/scans/validate-landing-standardization.ps1
```
Expected Output: `Validation PASSED`
