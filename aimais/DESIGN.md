# Design System: AIMAIS Quality Intelligence
**Version:** 1.0 - Production

## 1. Visual Theme & Atmosphere

AIMAIS embodies a **precision-first operational intelligence platform**. The visual language should feel like a Bloomberg Terminal refined with the restraint of Vercel's dashboard. The interface stays **dense with purpose but never cluttered**, and every element earns its pixels through functional necessity.

The mood is **technical confidence**: dark surfaces recede, data advances, and interactions respond with surgical precision. There is no decorative noise. The aesthetic should communicate that the tool was built by people who respect a manager's time and cognitive load.

Key characteristics:
- Near-black backgrounds that make data glow
- Single accent color, green, used with discipline and never as decoration
- Monospace numbers that feel like instrument readings
- Micro-animations that confirm actions and never entertain
- Whitespace used as signal, not filler

## 2. Color Palette & Roles

### Backgrounds

- **Void Black** (`#050b11`): Page background and deepest layer
- **Elevated Charcoal** (`#0a1520`): Cards, panels, sidebar, and primary containers
- **Lifted Surface** (`#0f1d2e`): Hover states, selected rows, and active inputs

### Borders

- **Ghost Line** (`rgba(255,255,255,0.06)`): Subtle dividers
- **Defined Edge** (`rgba(255,255,255,0.09)`): Default card and panel borders
- **Strong Boundary** (`rgba(255,255,255,0.15)`): Focus states and prominent hover borders

### Text

- **Primary White** (`#f1f5f9`): Headings, high-priority values, and key labels
- **Secondary Slate** (`#94a3b8`): Body text and supporting descriptions
- **Muted Steel** (`#6e8098`): Metadata, timestamps, placeholders, and eyebrow labels

### Accent System

- **Signal Green** (`#3ecf8e`): Brand mark, active states, positive indicators, progress fills
- **Alert Amber** (`#f5a623`): Warning states and reject rates between 3% and 5%
- **Danger Red** (`#f06060`): Critical alerts, reject rates above 5%, destructive actions
- **Sky Blue** (`#5b9cf6`): Secondary interactive states, informational badges, links

### Data Color Assignments

- Reject rate line or bar: Signal Green (`#3ecf8e`)
- Above threshold (`5%+`): Danger Red (`#f06060`)
- Near threshold (`3%-5%`): Alert Amber (`#f5a623`)
- Below threshold (`<3%`): Signal Green (`#3ecf8e`)

## 3. Typography Rules

**Primary Font:** Geist (sans-serif)  
**Monospace Font:** Geist Mono for numbers, percentages, item codes, and dates

### Hierarchy

- **Page Title (H1):** Geist 600, `2rem`, `-0.032em` letter spacing
- **Section Header (H2):** Geist 600, `1.5rem`, `-0.028em`
- **Card Label:** Geist 500, `1rem`, `-0.02em`
- **Body:** Geist 400, `0.938rem`, `1.6` line height
- **Eyebrow:** Geist 600, `0.688rem`, `0.18em` letter spacing, all caps, Signal Green
- **Data Values:** Geist Mono 600, sized by context
- **Small/Meta:** Geist 400, `0.813rem`

### Rules

- Numbers never appear in proportional typefaces
- Heading letter spacing stays negative for a tighter, more confident feel
- Maximum paragraph width is 66 characters
- Eyebrows always appear above their heading, never alone
- Every eyebrow is preceded by a 4px Signal Green dot

## 4. Component Stylings

### Buttons

- **Primary Action:** Signal Green background, Void Black text, 8px radius, used once per context maximum
- **Secondary/Ghost:** Transparent background, Defined Edge border, Secondary Slate text, becoming primary on hover
- **Destructive:** Transparent background with Danger Red border and text, never filled
- **Interaction:** `scale(0.98)` on active press
- **Disabled:** `opacity: 0.4`

### Cards & Panels

- Background: Elevated Charcoal
- Border: 1px Defined Edge
- Top highlight: subtle 1px gradient line using `rgba(255,255,255,0.07)`
- Border radius: 12px
- Padding: 20px to 24px
- Hover: border shifts to Strong Boundary
- Do not use shadows

### Data Badges

- Shape: 4px radius
- Structure: 4px colored dot plus all-caps Geist Mono text
- **CRITICAL:** Danger Red tint, text, and dot
- **HIGH:** Alert Amber tint, text, and dot
- **ELEVATED:** Sky Blue tint, text, and dot
- **NORMAL:** Signal Green tint, text, and dot

### Tables

- Header row: Geist 600, `0.688rem`, all caps, `0.12em` spacing, Muted Steel
- Data rows: 12px vertical padding with Defined Edge bottom border
- Hover state: Lifted Surface
- Numeric values: Geist Mono and right-aligned when comparative
- No zebra striping

### Navigation Sidebar

- Width: 300px on desktop
- Link style: transparent background, no border, Muted Steel text
- Hover: Lifted Surface background with Primary White text
- Active: same hover treatment plus a 4px Signal Green dot before the label
- Active indicator should be a dot, not an underline or side rail

### Inputs & Search

- Border: 1px Defined Edge
- Background: Elevated Charcoal
- Focus: Signal Green border only, with no glow or shadow
- Border radius: 8px for inputs and 999px for search
- Placeholder: Muted Steel at `0.85rem`

### Eyebrow + Heading Pattern

Every content section follows this order:

1. 4px Signal Green dot plus all-caps eyebrow
2. Heading that answers "what is this?"
3. Optional one-line description in Secondary Slate

## 5. Layout Principles

### Grid

- **Desktop:** 300px sidebar plus fluid content area with 20px gap
- **Tablet (769px-1024px):** 240px sidebar plus fluid content
- **Mobile (768px and below):** Full-width content with sidebar converted to a left drawer

### Spacing Scale

- `4px`: dots, tight icon padding
- `8px`: inline gaps
- `12px`: compact component padding
- `16px`: default component padding
- `20px`: grid gaps
- `24px`: generous component or section padding
- `32px`: major section separation
- `48px+`: page breathing room

### Content Density

- Data-heavy pages such as analytics use 20px padding and tighter gaps
- Narrative pages such as dashboard summaries and reports use 24px padding and more whitespace

### Page Load Animation

Sections enter once on first render with:

- `opacity: 0 -> 1`
- `transform: translateY(10px) -> translateY(0)`
- duration `0.32s`
- easing `cubic-bezier(0.16, 1, 0.3, 1)`
- stagger delay `55ms` per section

## 6. Mobile-Specific Rules

### Navigation Drawer

- Slide from the left
- Width: `80vw`, max `300px`
- Overlay: `rgba(0,0,0,0.55)` with `backdrop-filter: blur(2px)`
- Animation: `0.28s cubic-bezier(0.16, 1, 0.3, 1)`
- Close on overlay tap or `Esc`

### Mobile Top Bar

- Height: 52px
- Left side: brand mark (SVG diamond) plus `AIMAIS` in Geist 700
- Right side: hamburger icon with 3 lines, 1.5px stroke, 18px width, 5px gap
- Background: Elevated Charcoal with Ghost Line bottom border

### Touch Targets

- Minimum `44x44px` for all interactive elements
- Navigation links should use full-width tap targets
- Table rows should keep a minimum height of 48px

### Data on Mobile

- Tables: horizontal scrolling with `overflow-x: auto`
- Charts: minimum height 200px with responsive layout
- KPI cards: 2-column grid instead of 4 columns
- Alerts table: show only Item Code, Reject %, and Status on mobile
