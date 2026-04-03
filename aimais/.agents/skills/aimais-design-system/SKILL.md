---
name: aimais-design-system
description: Enforce the AIMAIS dashboard design system for product UI, analytics screens, navigation, forms, tables, cards, and mobile adaptations. Use when Codex needs to design, build, refactor, or review AIMAIS frontend work so it stays aligned with the project's dark operational intelligence visual language, spacing rules, typography, color roles, and interaction behavior.
---

# AIMAIS Design System

Apply this skill before changing AIMAIS frontend screens, shared UI components, or layout primitives.

## Core Workflow

1. Read `/Users/yzydalshmry/Desktop/BRIGHTAI/aimais/DESIGN.md` before making visual decisions.
2. Extract the relevant subset of rules for the task:
   - layout and navigation for page shells
   - cards, tables, badges, and metrics for analytics views
   - forms, inputs, and buttons for workflows
   - mobile drawer and responsive density rules for small screens
3. Preserve the system's core identity:
   - near-black layered surfaces
   - disciplined green accent usage
   - Geist for UI text and Geist Mono for numbers, codes, dates, and percentages
   - dense but controlled information hierarchy
4. Implement using reusable tokens first. Prefer CSS variables, shared component props, and existing primitives over one-off values.
5. Validate that the result still feels operational and not decorative. Remove visual noise, unnecessary gradients, oversized spacing, and generic dashboard defaults.

## Non-Negotiables

- Keep RTL support intact when touching layout, alignment, or navigation behavior.
- Use the green accent only for functional emphasis, never as decoration.
- Keep data values in a monospace treatment.
- Avoid heavy shadows, glossy effects, or playful animation.
- Keep hover, focus, and active states subtle and precise.
- Preserve mobile usability with 44x44 minimum touch targets and drawer-based navigation.

## Implementation Rules

### Layout

- Use a sidebar plus fluid content layout on desktop and tablet.
- Collapse the sidebar into a left drawer on mobile.
- Keep section spacing aligned to the documented scale: 4, 8, 12, 16, 20, 24, 32, 48+.

### Surfaces and Borders

- Default page background to Void Black.
- Use Elevated Charcoal for panels and Lifted Surface for interactive elevation states.
- Prefer thin borders over shadows for separation.

### Typography

- Use Geist for headings, labels, and body copy.
- Use Geist Mono for operational data, item codes, dates, and percentages.
- Keep headings tight with negative letter spacing.

### Components

- Primary action: one green filled button per context maximum.
- Secondary actions: outlined or ghost treatment.
- Destructive actions: outlined red only, not filled.
- Tables: no zebra striping; rely on hover and clear dividers.
- Status badges: compact, squared, and color-coded by severity.

## Review Checklist

- Does the screen read as AIMAIS rather than a generic SaaS dashboard?
- Are numbers rendered in monospace?
- Is the accent color used sparingly and only where meaning is attached?
- Do hover and focus states rely on border and surface shifts instead of glow effects?
- Does mobile preserve clarity without collapsing critical data structure?

## Output Expectation

When applying this skill, explain the design choices in terms of the AIMAIS system language and call out any deliberate deviations from `/Users/yzydalshmry/Desktop/BRIGHTAI/aimais/DESIGN.md`.
