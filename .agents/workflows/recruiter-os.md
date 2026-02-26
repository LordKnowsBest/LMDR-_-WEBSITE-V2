---
description: Enforces the Solarized Neumorphic Design System whenever implementing or modifying RecruiterOS views, CSS, or components
---

# RecruiterOS Implementation Workflow

This workflow MUST be followed for ANY work touching the Recruiter Operating System.

## Pre-Flight Checks

1. **Read the skill first.** Before writing any code, read the full design system skill:
   ```
   .agents/skills/recruiter-os-design-system/SKILL.md
   ```

2. **Identify the hub.** The central file is:
   ```
   src/public/recruiter/os/RecruiterOS.html
   ```
   - ALL RecruiterOS features live inside this single HTML shell
   - NEVER create a second HTML file for OS features
   - ALL view modules register via `ROS.views.registerView()`

3. **Locate the CSS.** Design tokens live in:
   ```
   src/public/recruiter/os/css/recruiter-os.css
   ```
   - Contains `:root` (light) and `html.dark` (dark) variable blocks
   - Contains all neumorphic elevation classes (`.neu`, `.neu-s`, `.neu-x`, etc.)
   - NEVER add inline `<style>` blocks in view JS files

## Implementation Steps

// turbo-all

4. **If creating a new view module:**
   - Create file at `src/public/recruiter/os/js/views/ros-view-{name}.js`
   - Follow the IIFE + registerView pattern from the skill
   - Register bridge messages in the MESSAGES array
   - Add a `<script>` tag in `RecruiterOS.html` to load the module via CDN
   - Wire `onMount()` to fetch data via `ROS.bridge.sendToVelo()`

5. **If modifying an existing view:**
   - Check the view's current structure matches the canonical pattern
   - Ensure all new UI uses neumorphic classes, not arbitrary shadows
   - Verify text uses `text-lmdr-dark` or `text-tan`, never `text-gray-*`

6. **If adding CSS:**
   - Add to `recruiter-os.css`, grouped with related styles
   - If the style needs dark mode support, add an `html.dark` override
   - Use CSS custom properties (`var(--ros-*)`) for all colors/shadows

## Compliance Verification

7. **Run the design system checklist** from the skill:
   - All surfaces: `var(--ros-surface)` or `bg-beige`
   - All shadows: neumorphic classes only
   - All text: `text-lmdr-dark` / `text-tan`
   - All icons: Material Symbols Outlined
   - All inputs: `neu-in` / `neu-ins`
   - 45° lighting maintained
   - Bridge pattern used for data

8. **Verify dark mode** doesn't break:
   - Check that any hardcoded Tailwind classes have `html.dark` overrides in CSS
   - New CSS vars should have both `:root` and `html.dark` values
