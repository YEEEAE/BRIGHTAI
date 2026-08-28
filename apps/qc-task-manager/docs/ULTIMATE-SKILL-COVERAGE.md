# ULTIMATE-SKILL-COVERAGE — جرد المهارات الكامل (تدقيق 2026-08-28)

- HEAD: 3b25585b2fc472247bf9f6b13145f52952db4656 | المصدر الكنسي: .agents/skills/ + skills-lock.json
- **مجلدات المهارات على القرص: 364** (كلها فيها SKILL.md مقروء برمجيًا: frontmatter + name + description)
- ملفات SKILL.md متداخلة شاذة: 1 (`distribb/90-day-seo-sprint/SKILL.md`)
- مدخلات skills-lock.json: **175** — **11** منها تشير لمجلدات غير موجودة، و**164/164** من الهاشات المدوّنة لا تطابق المحتوى الحالي (انجراف سجل)
- مهارات على القرص غير مسجلة في skills-lock.json: **201**
- عدد المهارات الفعلي المطلوب توثيقه في الدساتير: **364** (وليس 67 كما في AGENTS.md/CLAUDE.md)

## منهجية التصنيف (شفافة)
1. مسح برمجي كامل لكل SKILL.md (frontmatter/name/description) + تدقيق سلامة: تطابق name مع المجلد (0 انحراف)، ازدواج أسماء (0)، قراءة (0 فاشلة).
2. قراءة كاملة للمهارات المحورية المستخدمة في هذا التدقيق: using-superpowers, better-ui, design-first-ui-prompting, emil-design-eng, write-like-meng-on-x.
3. APPLIED = استُخدمت فعليًا في هذا التدقيق، أو فحوصها مطبقة كأجنحة كنسية داخل المستودع (a11y e2e 86 فحص، responsive e2e 648 فحص، performance، ui-consistency 164 فحص، backup/restore drill).
4. REVIEWED_NOT_APPLICABLE = مجالها خارج نطاق منتج QC الداخلي (ألعاب/3D/WebGL/شيدرز/منصات Apple/سوشال/كتابة X/تسويق الموقع العام) — حُدِّدت من أوصافها المستخرجة؛ التطبيق داخلي مغلق غير معروض للفهرسة أصلاً.
5. BROKEN_OR_MISSING = مرجع لمهارة غير موجودة أو سجل مهترئ.

## مصفوفة التغطية — كل المهارات الـ364 (بلا عينات ولا استثناءات)

| # | المهارة | في السجل؟ | التصنيف | الوصف (مقتطف) |
|---|---|---|---|---|
| 1 | 12-principles-of-animation | YES | REVIEWED_NOT_APPLICABLE | Audit animation code against Disney's 12 principles adapted for web. Use when reviewing motion, implementing a |
| 2 | a-b-test-design | — | REVIEWED_NOT_APPLICABLE | Design an A/B experiment — hypothesis, variants, primary metric, and sample size. Use when a change can be mea |
| 3 | ability-spectrum-mapping | — | REVIEWED_NOT_APPLICABLE | "Map how a product or feature works across the full spectrum of human ability — not just 'can use' and 'can't  |
| 4 | accessibility-audit | — | APPLIED | Audit an existing interface against WCAG, producing findings with severity ratings and remediation steps. Use  |
| 5 | accessibility-debt-tracking | — | REVIEWED_NOT_APPLICABLE | "Track and manage accessibility debt — known accessibility issues that have been deferred. Use when managing a |
| 6 | accessibility-decisions-document | — | REVIEWED_NOT_APPLICABLE | "Document accessibility decisions and tradeoffs for a feature. Chains: decision-documentation, tradeoff-analys |
| 7 | accessibility-decisions-handoff | — | REVIEWED_NOT_APPLICABLE | "Generate an accessibility decision handoff for engineering. Chains: decision-documentation, compliance-mappin |
| 8 | accessibility-decisions-review | — | REVIEWED_NOT_APPLICABLE | "Review and surface undocumented accessibility assumptions in an existing feature or product. Chains: decision |
| 9 | accessibility-test-plan | — | REVIEWED_NOT_APPLICABLE | Plan accessibility testing — assistive technologies, participant criteria, WCAG coverage, and session protocol |
| 10 | accessibility-testing-strategy | — | REVIEWED_NOT_APPLICABLE | "Plan what to test, how to test, and who should test for accessibility. Use when defining a testing approach,  |
| 11 | accessible-content-review | — | REVIEWED_NOT_APPLICABLE | "Review content for accessibility across cognitive and literacy levels. Chains: readable-content, alt-text-des |
| 12 | accessible-content-rewrite | — | REVIEWED_NOT_APPLICABLE | "Rewrite content in plain language while preserving meaning. Chains: readable-content, link-text-design. Use w |
| 13 | accessible-content-structure | — | REVIEWED_NOT_APPLICABLE | "Structure content for screen reader and assistive technology use. Chains: heading-structure, alt-text-design, |
| 14 | adaptive-interfaces-specify | — | REVIEWED_NOT_APPLICABLE | "Specify adaptive behaviour for an interface. Chains: user-preference-respect, responsive-accessibility, flexi |
| 15 | adaptive-personalisation | — | REVIEWED_NOT_APPLICABLE | "Design help systems and support patterns that work for people with cognitive disabilities. Use when designing |
| 16 | add-mouse-driven-orbit | YES | REVIEWED_NOT_APPLICABLE | Add restrained mouse-driven orbit and parallax depth to a Three.js hero by damping one pointer target and spli |
| 17 | add-shader-cursor-trail | YES | REVIEWED_NOT_APPLICABLE | "Add the Shaders WebGPU mouse effect used for the Tidal Commons hero: a white twinkling halftone cursor trail  |
| 18 | aesthetic-usability | — | REVIEWED_NOT_APPLICABLE | Apply the Aesthetic-Usability Effect — polished, consistent interfaces are perceived as more usable and forgiv |
| 19 | affinity-diagram | — | REVIEWED_NOT_APPLICABLE | Cluster many qualitative data points into themes and insight statements. Use when synthesising across multiple |
| 20 | agency-grid-layout-minimal | YES | REVIEWED_NOT_APPLICABLE | "Create a minimal agency design system with a disciplined editorial grid, oversized typography, quiet uppercas |
| 21 | alt-text-design | — | REVIEWED_NOT_APPLICABLE | "Write meaningful alternative text for images, charts, diagrams, and visual content. Use when creating or revi |
| 22 | ambient-section-particles | YES | REVIEWED_NOT_APPLICABLE | Add a restrained particle atmosphere inside one section with configurable shapes, density, gravity, wind, sway |
| 23 | animate | YES | REVIEWED_NOT_APPLICABLE | Build an animation from scratch, making the decisions in the order that determines whether it feels right — sh |
| 24 | animate-expo | YES | REVIEWED_NOT_APPLICABLE | Build animations in React Native and Expo, making the decisions in the order that determines whether they feel |
| 25 | animation-on-scroll | YES | REVIEWED_NOT_APPLICABLE | Create an on-scroll animation trigger using IntersectionObserver with Tailwind-friendly animation classes and  |
| 26 | animation-principles | — | REVIEWED_NOT_APPLICABLE | Apply animation principles — easing, staging, follow-through — to one specific UI motion. Use when tuning how  |
| 27 | animation-systems | YES | REVIEWED_NOT_APPLICABLE | Use when designing or implementing product-grade web motion like Stripe, Linear, Apple, and Vercel. Covers mot |
| 28 | animation-vocabulary | YES | REVIEWED_NOT_APPLICABLE | Reverse-lookup glossary that turns a vague description of a web animation or motion effect into its exact term |
| 29 | apple-design | YES | APPLIED | Apple's approach to interface design and fluid, physical motion, translated for the web. Use when building or  |
| 30 | article-prompts-to-skills | YES | REVIEWED_NOT_APPLICABLE | Convert an article, tutorial, or prompt pack into focused reusable AgentSkills, one independent capability per |
| 31 | ask-sonner | YES | REVIEWED_NOT_APPLICABLE | Guide to Sonner, the React toast library — install and wire up the Toaster, pick the right toast() call, promi |
| 32 | assess-load | — | REVIEWED_NOT_APPLICABLE | "Assess cognitive load across a complete multi-step process and produce a load map. Chains: cognitive-load-ass |
| 33 | assistive-technology-scenarios | — | REVIEWED_NOT_APPLICABLE | "Write usage scenarios that include assistive technology and diverse interaction methods. Use when writing sce |
| 34 | astro-developer | YES | APPLIED | Comprehensive guide for developing in the Astro monorepo. Covers architecture, debugging, testing, and critica |
| 35 | atmosphere-background | YES | REVIEWED_NOT_APPLICABLE | "Create a dark atmospheric background with drifting vertical light folds, screen-blended glow, and a concentra |
| 36 | audit-reference-originality | YES | REVIEWED_NOT_APPLICABLE | Audit a website or digital experience against its supplied source references for originality and plagiarism ri |
| 37 | audit-stories | — | REVIEWED_NOT_APPLICABLE | "Audit user stories for disability inclusion. Chains: inclusive-user-stories, edge-case-identification. Use wh |
| 38 | audit-verify-explain-grade-5 | YES | REVIEWED_NOT_APPLICABLE | Audit work, verify claims with concrete evidence, and explain the result in simple grade-5 language. Use when  |
| 39 | aura-asset-images | YES | REVIEWED_NOT_APPLICABLE | "Use when you need high-quality stock-style images from Aura Assets (aura.build/assets) similar to Unsplash fo |
| 40 | author-game-levels | YES | REVIEWED_NOT_APPLICABLE | Author or revise readable, flat-world Three.js game levels. Use for movement and camera routes, collision and  |
| 41 | awesome-design-md | — | REVIEWED_NOT_APPLICABLE | Use curated DESIGN.md references from VoltAgent/awesome-design-md and getdesign.md to choose, fetch, compare,  |
| 42 | background-grid-webgl | YES | REVIEWED_NOT_APPLICABLE | "Create a perspective WebGL background grid with fading lines, subtle particle haze, slow forward drift, and g |
| 43 | beam-glow-states | YES | REVIEWED_NOT_APPLICABLE | Create React loading, processing, selected, current, focus, and pressed states with the border-beam package's  |
| 44 | beautiful-shadows | YES | REVIEWED_NOT_APPLICABLE | Apply exact Tailwind arbitrary shadow utilities for polished, layered neutral elevation. Use when compact card |
| 45 | better-accessibility | YES | APPLIED | Accessibility engineering for product interfaces. Use when building or reviewing UI components and custom widg |
| 46 | better-colors | YES | APPLIED | Color systems for digital products. Use when creating or extending a palette, theming light and dark appearanc |
| 47 | better-interface | YES | APPLIED | >- |
| 48 | better-layout | YES | APPLIED | Layout structure for web interfaces. Use when structuring a page or component, deciding what collapses at smal |
| 49 | better-typography | YES | APPLIED | Web typography. Use when picking or pairing typefaces, setting up a type scale, or styling and truncating text |
| 50 | better-ui | YES | APPLIED | Design engineering principles for making interfaces feel polished. Use when building UI components, implementi |
| 51 | better-writing | YES | APPLIED | >- |
| 52 | blue-cloudy-clean-modern | YES | REVIEWED_NOT_APPLICABLE | "Create a clean modern design system with a luminous blue sky atmosphere, soft drifting cloud light, minimal w |
| 53 | blue-laser-clean-glass-layout | YES | REVIEWED_NOT_APPLICABLE | "Create a clean dark glass layout system with a thin blue laser atmosphere, frosted premium shells, and polish |
| 54 | book-serif-index | YES | REVIEWED_NOT_APPLICABLE | "Create an archival book-reader design system with serif-led pages, mono index navigation, aged paper surfaces |
| 55 | brainstorming | — | REVIEWED_NOT_APPLICABLE | "You MUST use this before any creative work - creating features, building components, adding functionality, or |
| 56 | brandkit | YES | REVIEWED_NOT_APPLICABLE | Premium brand-kit image generation skill for creating high-end brand-guidelines boards, logo systems, identity |
| 57 | break | YES | REVIEWED_NOT_APPLICABLE | Answers "does this survive?" for one component. Renders it on a page in every state real use can put it in, an |
| 58 | bright-green-tech-system-webgl | YES | REVIEWED_NOT_APPLICABLE | "Create a bright-green technical design system with structured split layouts, hard-framed dark surfaces, mono  |
| 59 | browser-video-recording | YES | REVIEWED_NOT_APPLICABLE | Create polished 60 fps 4:3 4K browser screen-recording style videos from Codex in-app browser captures, with b |
| 60 | build-awwwards-quality-sites | YES | REVIEWED_NOT_APPLICABLE | Art-direct and implement distinctive, motion-rich marketing, editorial, portfolio, and landing websites with o |
| 61 | build-daily-inspiration-sites | YES | REVIEWED_NOT_APPLICABLE | Turn a completed daily UI inspiration capture into exactly five original landing-page builds, one per separate |
| 62 | build-game-audio-feedback | YES | REVIEWED_NOT_APPLICABLE | Design or implement responsive audio feedback for a Three.js or web game. Use for action sounds, combat layers |
| 63 | build-game-camera-controls | YES | REVIEWED_NOT_APPLICABLE | Implement or tune Three.js game cameras. Use for isometric framing, follow behavior, orbit/zoom limits, occlus |
| 64 | build-game-changelog | YES | REVIEWED_NOT_APPLICABLE | Design, implement, backfill, audit, and release in-game changelogs with contiguous versioning, deployment prov |
| 65 | build-game-inventory | YES | REVIEWED_NOT_APPLICABLE | Build or repair game inventory, loot, equipment, tooltips, drag-and-drop, persistence, and progression systems |
| 66 | build-game-map-editor | YES | REVIEWED_NOT_APPLICABLE | Build, extend, or audit production-linked browser map editors for Three.js and isometric games. Use when Codex |
| 67 | build-game-monster-system | YES | REVIEWED_NOT_APPLICABLE | Build, integrate, audit, or refactor rigged monsters for Three.js and web action games. Use for monster asset  |
| 68 | build-hybrid-game-assets | YES | REVIEWED_NOT_APPLICABLE | Plan, create, integrate, or audit a hybrid asset pipeline for a Three.js or web game. Use when choosing among  |
| 69 | build-interactive-particle-trail | YES | REVIEWED_NOT_APPLICABLE | Build a cursor or touch particle interaction that emits by distance along the traveled segment into a recycled |
| 70 | build-isometric-arpg | YES | REVIEWED_NOT_APPLICABLE | Build or extend a playable isometric action RPG in Three.js, React, or similar web technology. Use for game-lo |
| 71 | build-mobile-threejs-games | YES | REVIEWED_NOT_APPLICABLE | Build, tune, or test a Three.js game for mobile web. Use for touch movement, action controls, target selection |
| 72 | build-rigged-game-assets | YES | REVIEWED_NOT_APPLICABLE | Create, integrate, or audit production-ready rigged 3D characters and monsters with a main model, skeleton, an |
| 73 | build-threejs-enemy-systems | YES | REVIEWED_NOT_APPLICABLE | Build or refactor reusable, data-driven enemy archetype and moveset systems for Three.js action games. Use for |
| 74 | build-threejs-scroll-worlds | YES | REVIEWED_NOT_APPLICABLE | Build rich, scroll-controlled real-time Three.js experiences as one persistent 3D world whose camera, lighting |
| 75 | build-vesperfall-review-assets | YES | REVIEWED_NOT_APPLICABLE | Build truthful Vesperfall asset-library review pairs from transparent PNG references and live Three.js, FBX, o |
| 76 | build-wireframe-scan-reveal | YES | REVIEWED_NOT_APPLICABLE | Reveal Three.js geometry with an expanding world-space scan whose wire cage leads the solid surface, then burn |
| 77 | business-design | — | REVIEWED_NOT_APPLICABLE | Read financials, map competitive landscapes, and argue design decisions in the language of value. Use when def |
| 78 | card-sort-analysis | — | REVIEWED_NOT_APPLICABLE | Analyse open or closed card sort results into a proposed grouping and label set. Use after running a sort stud |
| 79 | case-study | — | REVIEWED_NOT_APPLICABLE | Craft a portfolio case study with narrative arc, process evidence, and outcomes. Use when telling a project's  |
| 80 | cinematic-gsap-lenis-motion-system | YES | REVIEWED_NOT_APPLICABLE | Create premium cinematic web motion systems with GSAP, ScrollTrigger, and Lenis. Use for luxury editorial webs |
| 81 | cinematic-scroll-storytelling | YES | REVIEWED_NOT_APPLICABLE | Create cinematic scroll-driven landing pages with Lenis smooth scrolling, GSAP ScrollTrigger, scroll-linked pr |
| 82 | clean-minimal-beige-light-mode | YES | REVIEWED_NOT_APPLICABLE | "Create a clean minimal beige light-mode design system with warm neutral shells, quiet process grids, restrain |
| 83 | click-test-plan | — | REVIEWED_NOT_APPLICABLE | Design first-click and click tests for findability and navigation. Use when testing whether people can locate  |
| 84 | cobejs | YES | REVIEWED_NOT_APPLICABLE | Use when adding a lightweight interactive globe with cobe (canvas setup, markers, interaction, performance, in |
| 85 | cognitive-accessibility-review | — | REVIEWED_NOT_APPLICABLE | "Run a full cognitive accessibility review of a flow, screen, or interface. Chains: cognitive-load-assessment, |
| 86 | cognitive-accessibility-simplify | — | REVIEWED_NOT_APPLICABLE | "Simplify content and interactions to reduce cognitive load. Chains: plain-language-design, cognitive-load-ass |
| 87 | cognitive-load-assessment | — | REVIEWED_NOT_APPLICABLE | "Assess and reduce cognitive load in interfaces, flows, and content. Use when designing or reviewing any multi |
| 88 | color-system | — | APPLIED | Build a product colour system — tonal scales, semantic roles, and contrast compliance. Use when defining or re |
| 89 | colour-independence | — | REVIEWED_NOT_APPLICABLE | "Design interfaces where colour is never the only way information is communicated. Use when designing status i |
| 90 | company-logos | YES | REVIEWED_NOT_APPLICABLE | "Use Iconify Simple Icons logos (64x64) instead of text logos." |
| 91 | competitive-analysis | — | REVIEWED_NOT_APPLICABLE | Compare UX patterns, features, strengths, and gaps across rival products. Use when you need to know what other |
| 92 | compliance-mapping | — | REVIEWED_NOT_APPLICABLE | "Map design decisions to accessibility standards and legal requirements. Use when documenting WCAG conformance |
| 93 | component-spec | — | REVIEWED_NOT_APPLICABLE | Specify one component — props, states, variants, accessibility, and usage rules. Use when defining a library c |
| 94 | container-lines | YES | REVIEWED_NOT_APPLICABLE | Add vertical container-size guide lines with mini corner squares for precise, structured web layouts. Use when |
| 95 | content-strategy | — | REVIEWED_NOT_APPLICABLE | Define what content a product needs, how it is structured, and who owns it. Use when content itself is the pro |
| 96 | contextual-help-design | — | REVIEWED_NOT_APPLICABLE | "Design help systems and support patterns that work for people with cognitive disabilities. Use when designing |
| 97 | conversational-ux | — | REVIEWED_NOT_APPLICABLE | Design voice and conversational interfaces — dialog flows, error recovery, and persona. Use when the interface |
| 98 | corner-diagonals | YES | REVIEWED_NOT_APPLICABLE | Apply diagonal-cut corners and chamfered edges to buttons, cards, panels, and container shells. Use when a des |
| 99 | corner-lasers | YES | REVIEWED_NOT_APPLICABLE | "Create a corner-anchored laser composition with thin beams, a bright emitter node, bloom, and atmospheric glo |
| 100 | create-game-vfx | YES | REVIEWED_NOT_APPLICABLE | Create readable, performance-safe Three.js game visual effects. Use for attacks, impacts, damage feedback, sta |
| 101 | critique-affordance | — | REVIEWED_NOT_APPLICABLE | Critique a rendered screen's affordances — what looks clickable, state visibility, CTA clarity, and action dis |
| 102 | critique-brand-consistency | — | REVIEWED_NOT_APPLICABLE | Critique a rendered screen against mood.md, voice.md, and tokens.md. Use when those brand files exist and you  |
| 103 | critique-color | — | REVIEWED_NOT_APPLICABLE | Critique a rendered screen's colour — contrast ratios, palette coherence, and semantic meaning. Use when revie |
| 104 | critique-composition | — | REVIEWED_NOT_APPLICABLE | Critique a rendered screen's composition — balance, whitespace, rhythm, and gestalt grouping. Use when a layou |
| 105 | critique-information-density | — | REVIEWED_NOT_APPLICABLE | Critique a rendered screen's density — cognitive load, content prioritisation, scanning patterns, and progress |
| 106 | critique-typography | — | REVIEWED_NOT_APPLICABLE | Critique a rendered screen's typography — scale usage, readability, consistency, and token compliance. Use whe |
| 107 | critique-visual-hierarchy | — | REVIEWED_NOT_APPLICABLE | Critique a rendered screen's hierarchy — entry point, eye flow, weight distribution, and emphasis. Use when at |
| 108 | css-alpha-masking | YES | REVIEWED_NOT_APPLICABLE | Apply CSS alpha masking with linear-gradient for horizontal or vertical edge fades (mask-image and -webkit-mas |
| 109 | css-border-gradient | YES | REVIEWED_NOT_APPLICABLE | Apply subtle gradient-border treatments for premium web surfaces. Use when cards, pricing panels, nav bars, mo |
| 110 | daily-ui-inspiration-capture | YES | REVIEWED_NOT_APPLICABLE | Create a recurring daily UI inspiration capture. Use when the user asks to run, refresh, package, or validate  |
| 111 | dark-blue-contrasting-clean | YES | REVIEWED_NOT_APPLICABLE | "Create a dark-blue clean design system with strong contrast, cobalt gradient feature blocks, crisp framed str |
| 112 | dark-glass-clean-layout | YES | REVIEWED_NOT_APPLICABLE | "Create a dark glass layout system with frosted premium shells, clean multi-column workspace structure, floati |
| 113 | dark-mode-design | — | REVIEWED_NOT_APPLICABLE | Adapt an existing palette to dark mode — surface elevation, contrast rebalancing, and desaturation rules. Use  |
| 114 | data-visualization | — | APPLIED | Select chart types and design data encodings — marks, axes, labels, and accessible chart styling. Use when pre |
| 115 | decision-documentation | — | REVIEWED_NOT_APPLICABLE | "Document accessibility decisions and the reasoning behind them so they survive team changes, redesigns, and t |
| 116 | design-action-combat | YES | REVIEWED_NOT_APPLICABLE | Design, implement, tune, or test readable tactical action combat for web games. Use for attack timing, guard a |
| 117 | design-brief | — | REVIEWED_NOT_APPLICABLE | Write a project brief — problem space, constraints, audience, and success criteria. Use at kickoff for one spe |
| 118 | design-critique | — | REVIEWED_NOT_APPLICABLE | Facilitate a structured team critique — framing, feedback rules, and actionable outcomes. Use when running a s |
| 119 | design-debt-audit | — | REVIEWED_NOT_APPLICABLE | Inventory and prioritise accumulated design inconsistencies across a product. Use when drift has built up over |
| 120 | design-first-ui-prompting | YES | APPLIED | Use when you need design-first, spec-driven, skimmable prompts for UI generation. Covers prompt structure, con |
| 121 | design-flow | — | REVIEWED_NOT_APPLICABLE | "Design an interaction flow with inclusive input and output options from the start. Chains: multi-modal-input, |
| 122 | design-game-encounters | YES | REVIEWED_NOT_APPLICABLE | Design, implement, tune, or test Three.js action-game encounters. Use for arena layout, enemy composition, spa |
| 123 | design-impact-reporting | — | REVIEWED_NOT_APPLICABLE | Communicate design's contribution to business and user outcomes in stakeholder language. Use when reporting re |
| 124 | design-md | — | REVIEWED_NOT_APPLICABLE | Analyze existing designed screens, UI systems, and visual patterns, then synthesize them into a semantic `DESI |
| 125 | design-negotiation | — | REVIEWED_NOT_APPLICABLE | Advocate for design quality, scope, and timeline with partners and leadership using evidence and shared goals. |
| 126 | design-pipeline | — | REVIEWED_NOT_APPLICABLE | / |
| 127 | design-principles | — | APPLIED | Define actionable principles that resolve trade-offs when the team disagrees. Use when the same decisions keep |
| 128 | design-qa-checklist | — | APPLIED | Build a QA checklist for verifying that a build matches the design. Use at implementation review. For the spec |
| 129 | design-rationale | — | REVIEWED_NOT_APPLICABLE | Write rationale connecting decisions to user needs, business goals, and principles. Use when a decision needs  |
| 130 | design-review-process | — | REVIEWED_NOT_APPLICABLE | Establish review gates — criteria, checkpoints, and approval flow. Use when work ships without consistent revi |
| 131 | design-sprint-plan | — | REVIEWED_NOT_APPLICABLE | Plan and facilitate a design sprint from challenge framing through prototype testing. Use when compressing dis |
| 132 | design-system-adoption | — | REVIEWED_NOT_APPLICABLE | Create adoption strategy and enablement materials to drive design system usage. Use when the system exists but |
| 133 | design-system-governance | — | REVIEWED_NOT_APPLICABLE | Define how the system evolves — contribution model, versioning, deprecation, and change management. Use when m |
| 134 | design-taste-frontend | YES | REVIEWED_NOT_APPLICABLE | Anti-slop frontend skill for landing pages, portfolios, and redesigns. The agent reads the brief, infers the r |
| 135 | design-token | — | REVIEWED_NOT_APPLICABLE | Define and organise tokens for colour, spacing, type, and elevation with naming and usage rules. Use when esta |
| 136 | design-token-audit | — | REVIEWED_NOT_APPLICABLE | Audit token usage across a product for coverage, drift, and hard-coded values. Use when tokens exist and you s |
| 137 | diary-study-plan | — | REVIEWED_NOT_APPLICABLE | Design a diary study — prompts, cadence, duration, participant criteria, and analysis frame. Use when behaviou |
| 138 | disability-inclusive-personas | — | REVIEWED_NOT_APPLICABLE | "Create user personas that include disability as a natural dimension of human diversity — not as a separate 'a |
| 139 | dispatching-parallel-agents | — | REVIEWED_NOT_APPLICABLE | Use when facing 2 or more independent tasks that share no state or ordering — dispatch them to parallel subage |
| 140 | distribb | YES | REVIEWED_NOT_APPLICABLE | Distribb is an SEO platform that handles keyword research, original data research, content publishing to WordP |
| 141 | dither-background | YES | REVIEWED_NOT_APPLICABLE | Create a dark monochrome procedural background with enlarged square pixels and visible Bayer-style ordered dit |
| 142 | dither-laser-dark-mode | YES | REVIEWED_NOT_APPLICABLE | "Create a dark premium design system that combines near-black surfaces, subtle ordered-dither texture, and a t |
| 143 | documentary-brutalist-agency | YES | REVIEWED_NOT_APPLICABLE | Create or redesign creative agency, production studio, architecture, culture, and portfolio websites with bill |
| 144 | documentation-template | — | APPLIED | Generate a reusable documentation scaffold for components, patterns, or guidelines. Use when standardising how |
| 145 | doherty-threshold | — | REVIEWED_NOT_APPLICABLE | Apply the Doherty Threshold — keep system response under 400ms to preserve user flow. Use when diagnosing perc |
| 146 | edge-case-identification | — | REVIEWED_NOT_APPLICABLE | "Identify and design for edge cases that disproportionately affect users with disabilities. Use when reviewing |
| 147 | editorial-portfolio-chapters | YES | REVIEWED_NOT_APPLICABLE | Create or redesign creative-studio, agency, photographer, artist, and portfolio websites where project work le |
| 148 | editorial-service-booking | YES | REVIEWED_NOT_APPLICABLE | Create or redesign appointment-based service websites for salons, barbers, spas, wellness studios, clinics, an |
| 149 | editorial-tech | YES | REVIEWED_NOT_APPLICABLE | "Blend editorial magazine composition with precision product-tech detailing using asymmetrical grids, cinemati |
| 150 | elevenlabs-tts | YES | REVIEWED_NOT_APPLICABLE | Generate ElevenLabs text-to-speech audio from scripts or inline text using local voice profiles. Use when the  |
| 151 | emil-design-eng | YES | APPLIED | This skill encodes Emil Kowalski's philosophy on UI polish, component design, animation decisions, and the inv |
| 152 | empathy-map | — | REVIEWED_NOT_APPLICABLE | Build a Says, Thinks, Does, Feels map for one user or segment. Use when sharing user understanding quickly. Fo |
| 153 | error-handling-ux | — | APPLIED | Design error prevention, detection, and recovery across a product — message content, placement, and escape rou |
| 154 | error-prevention-recovery | — | REVIEWED_NOT_APPLICABLE | "Design error prevention, error messages, and recovery flows for cognitive accessibility. Use when designing f |
| 155 | executing-plans | — | APPLIED | Use when you have a written implementation plan (e.g. from docs/superpowers/plans/) to execute, especially in  |
| 156 | experience-map | — | REVIEWED_NOT_APPLICABLE | Map the full ecosystem of touchpoints, channels, and relationships across a service. Use when the experience s |
| 157 | explain-interface | YES | REVIEWED_NOT_APPLICABLE | Answers "how was this built?" about an interface. Give it a URL and name the thing you're curious about, and i |
| 158 | falling-leaves | YES | REVIEWED_NOT_APPLICABLE | Build falling leaves that read as leaves, with each one tumbling on its own axis so it presents a face, thins  |
| 159 | feedback-and-status | — | APPLIED | "Design feedback and status communication that works across senses — visual, auditory, and haptic. Use when de |
| 160 | feedback-patterns | — | REVIEWED_NOT_APPLICABLE | Design confirmations, status updates, and notifications that tell users an action registered. Use when the sys |
| 161 | find-animation-opportunities | YES | REVIEWED_NOT_APPLICABLE | Search a codebase or UI for places that don't animate but should, and reject everything that shouldn't. Read-o |
| 162 | fitts-law | — | REVIEWED_NOT_APPLICABLE | Apply Fitts's Law — target acquisition time depends on size and distance. Use when sizing and positioning cont |
| 163 | flexible-typography | — | REVIEWED_NOT_APPLICABLE | "Design typography systems that adapt to user needs — scaling, spacing, and font preferences. Use when designi |
| 164 | focus-attention-design | — | REVIEWED_NOT_APPLICABLE | "Design interfaces that support sustained focus and reduce distractions. Use when designing for users with ADH |
| 165 | form-design | — | APPLIED | Design a form end to end — field order, grouping, validation, and completion. Use when the artifact is a form. |
| 166 | form-labelling | — | APPLIED | "Design form labels, instructions, and grouping that work for screen readers and cognitive accessibility. Use  |
| 167 | framed-grid-layout | YES | REVIEWED_NOT_APPLICABLE | Create minimal framed grid layouts with thin visible boundary lines, L-shaped corner brackets, subtle diagonal |
| 168 | framed-tech-dark-border-gradient | YES | REVIEWED_NOT_APPLICABLE | "Create a framed dark technical design system with border-gradient shells, asymmetrical grid panels, mono util |
| 169 | frontend-design | — | REVIEWED_NOT_APPLICABLE | Design and build distinctive production-ready frontend interfaces with strong visual direction, polished layou |
| 170 | funky-purple-container-tech | YES | REVIEWED_NOT_APPLICABLE | "Create a dark container-led technical design system with fuchsia-purple accents, layered rounded shells, cris |
| 171 | generate-reference-inspired-brand-worlds | YES | REVIEWED_NOT_APPLICABLE | Generate multiple original brand campaign worlds from a supplied visual reference while controlling how close  |
| 172 | gesture-alternatives | — | REVIEWED_NOT_APPLICABLE | "Design alternatives to gesture-based and motion-based interactions. Use when designing swipe actions, pinch-t |
| 173 | gesture-patterns | — | REVIEWED_NOT_APPLICABLE | Design gesture interactions for touch and pointer — swipe, drag, long-press, and their discoverability. Use wh |
| 174 | glass-dark-mode-clock | YES | REVIEWED_NOT_APPLICABLE | "Create a dark glass design system with frosted shells, soft beam grids, circular clock-like calibration dials |
| 175 | glass-dark-ui | YES | REVIEWED_NOT_APPLICABLE | Build dark-mode glassmorphism interfaces with readable contrast, frosted surfaces, and gradient borders using  |
| 176 | globe-gl | YES | REVIEWED_NOT_APPLICABLE | Use when implementing globe.gl (Globe.GL) for 3D globe data visualization with WebGL/ThreeJS, including setup, |
| 177 | globe-particles | YES | REVIEWED_NOT_APPLICABLE | Create a globe-like 3D particle visualization with a dense luminous spherical core and thinner orbital ring or |
| 178 | gooey-blob-system | YES | REVIEWED_NOT_APPLICABLE | "Create a gooey blob system using SVG filters where multiple shapes merge into a single fluid form. Use overla |
| 179 | google-indexing-seo-guardian | — | REVIEWED_NOT_APPLICABLE | "Audit and repair Google crawling, indexing, and SEO readiness for static HTML sites after page or markup chan |
| 180 | gsap | YES | REVIEWED_NOT_APPLICABLE | Use when you need to add or debug professional web animations with GSAP (timelines, ScrollTrigger, stagger, tr |
| 181 | gsap-scrolltrigger-storytelling | YES | REVIEWED_NOT_APPLICABLE | "Build cinematic sticky product storytelling with GSAP ScrollTrigger, progressive UI reveals, scroll-synced an |
| 182 | handoff-spec | — | REVIEWED_NOT_APPLICABLE | Write the implementation handoff — measurements, behaviours, assets, states, and edge cases. Use when engineer |
| 183 | heading-structure | — | REVIEWED_NOT_APPLICABLE | "Design heading hierarchies and content structure that work for screen readers and cognitive accessibility. Us |
| 184 | heuristic-evaluation | — | REVIEWED_NOT_APPLICABLE | Run an expert review against Nielsen's heuristics and domain criteria, with severity ratings. Use when you nee |
| 185 | hicks-law | — | REVIEWED_NOT_APPLICABLE | Apply Hick's Law — decision time grows with the number of simultaneous choices. Use when a screen offers too m |
| 186 | high-contrast-skeuomorphic-clean | YES | REVIEWED_NOT_APPLICABLE | "Create a high-contrast clean skeuomorphic design system with molded dark surfaces, crisp light separation, ta |
| 187 | high-end-visual-design | YES | APPLIED | Teaches the AI to design like a high-end agency. Defines the exact fonts, spacing, shadows, card structures, a |
| 188 | html-to-interaction-prompts | YES | REVIEWED_NOT_APPLICABLE | Convert a supplied HTML page or generated HTML reference into a screenshot-backed article containing multiple  |
| 189 | i-have-adhd | YES | REVIEWED_NOT_APPLICABLE | 'Shape output for a reader with ADHD: lead with the next action, number multi-step work, restate state across  |
| 190 | icon-system | — | REVIEWED_NOT_APPLICABLE | Specify an icon system — grid, sizing, stroke weight, naming, categories, and implementation. Use when standar |
| 191 | illustration-style | — | REVIEWED_NOT_APPLICABLE | Define an illustration style guide — visual language, colour usage, and application rules. Use when commission |
| 192 | image-first-grid-layout | YES | REVIEWED_NOT_APPLICABLE | "Create an image-led grid design system with full-bleed photography, structural guide lines, anchored content  |
| 193 | implement-fog-of-war | YES | REVIEWED_NOT_APPLICABLE | Implement, tune, debug, or validate soft wall-aware fog of war and gameplay perception in Three.js action game |
| 194 | improve-animations | YES | REVIEWED_NOT_APPLICABLE | Survey a codebase's animation and motion code as a senior motion advisor, then produce a prioritized audit and |
| 195 | inclusive-interaction-audit | — | REVIEWED_NOT_APPLICABLE | "Audit an interface for multi-modal interaction support. Chains: keyboard-navigation, touch-target-design, mul |
| 196 | inclusive-personas-generate | — | REVIEWED_NOT_APPLICABLE | "Generate a diverse, inclusive persona set for a product. Chains: disability-inclusive-personas, situational-i |
| 197 | inclusive-user-stories | — | REVIEWED_NOT_APPLICABLE | "Write user stories that account for disability and diverse abilities from the start. Use when writing user st |
| 198 | industrial-brutalist-ui | YES | REVIEWED_NOT_APPLICABLE | Raw mechanical interfaces fusing Swiss typographic print with military terminal aesthetics. Rigid grids, extre |
| 199 | information-architecture | — | REVIEWED_NOT_APPLICABLE | Design content structure, hierarchy, labelling, and the navigation model. Use when organising what exists. For |
| 200 | information-density | — | REVIEWED_NOT_APPLICABLE | "Design interfaces where information density can be adjusted to suit different cognitive needs and preferences |
| 201 | intelligent-content-reviewer-validator | — | REVIEWED_NOT_APPLICABLE | Review and validate changed content for logical flow, contextual consistency, structure, clarity, tone, redund |
| 202 | interface-review | YES | APPLIED | >- |
| 203 | interfaces-that-feel | — | REVIEWED_NOT_APPLICABLE | Apply an emotional resonance lens to a UI that is technically correct but flat, prescribing changes at the cop |
| 204 | internal-links-guardian | — | REVIEWED_NOT_APPLICABLE | Guard internal links, local paths, imports, exports, asset references, and project file paths across BrightAI  |
| 205 | interview-script | — | REVIEWED_NOT_APPLICABLE | Write a structured interview guide — warm-up, core exploration, and wrap-up. Use before running interviews. Fo |
| 206 | iterate-until-verified | YES | APPLIED | Apply a prompt-agnostic execution and verification loop to any substantial task while preserving the original  |
| 207 | jakobs-law | — | REVIEWED_NOT_APPLICABLE | Apply Jakob's Law — users expect your product to work like the others they already use. Use when deciding whet |
| 208 | jobs-to-be-done | — | REVIEWED_NOT_APPLICABLE | Map functional, emotional, and social jobs with outcome expectations. Use when reframing decisions around moti |
| 209 | journey-map | — | REVIEWED_NOT_APPLICABLE | Map one persona's end-to-end experience with stages, touchpoints, emotions, and pain points. Use when improvin |
| 210 | karpathy-guidelines | — | REVIEWED_NOT_APPLICABLE | Behavioral guidelines for coding, code review, and refactoring work that reduce common LLM mistakes. Use when  |
| 211 | keyboard-navigation | — | REVIEWED_NOT_APPLICABLE | "Design keyboard navigation and focus management for users who cannot or prefer not to use a mouse or touch sc |
| 212 | keyboard-review | — | REVIEWED_NOT_APPLICABLE | "Review keyboard navigation and focus management in an existing interface. Chains: keyboard-navigation, feedba |
| 213 | landing-page | YES | REVIEWED_NOT_APPLICABLE | Use when designing or rewriting a high-converting landing page (single-offer page) for SaaS/apps/services. Cov |
| 214 | law-of-closure | — | REVIEWED_NOT_APPLICABLE | Apply the Law of Closure — the eye completes implied shapes from partial forms. Use when reducing visual weigh |
| 215 | law-of-common-region | — | REVIEWED_NOT_APPLICABLE | Apply the Law of Common Region — a shared container, background, or border groups elements regardless of spaci |
| 216 | law-of-continuity | — | REVIEWED_NOT_APPLICABLE | Apply the Law of Continuity — the eye follows alignment and unbroken paths. Use when sequencing steps, alignin |
| 217 | law-of-figure-ground | — | REVIEWED_NOT_APPLICABLE | Apply the Law of Figure-Ground — establish which layer is foreground and actionable versus background. Use whe |
| 218 | law-of-proximity | — | REVIEWED_NOT_APPLICABLE | Apply the Law of Proximity — spatial closeness groups elements more strongly than any other cue. Use when spac |
| 219 | law-of-similarity | — | REVIEWED_NOT_APPLICABLE | Apply the Law of Similarity — shared colour, shape, or size signals that elements belong to one category. Use  |
| 220 | layout-grid | — | REVIEWED_NOT_APPLICABLE | Define a responsive grid — columns, gutters, margins, and breakpoint behaviour. Use when establishing page str |
| 221 | light-mode-paper-technical | YES | REVIEWED_NOT_APPLICABLE | "Create a light-mode technical design system with warm paper surfaces, dark outer framing, subtle diagonal tex |
| 222 | link-text-design | — | REVIEWED_NOT_APPLICABLE | "Write link text that makes sense out of context for screen reader users and improves usability for everyone.  |
| 223 | liquid-metal-border | YES | REVIEWED_NOT_APPLICABLE | Add and tune animated liquid-metal WebGL borders with the React `metal-fx` package. Use when buttons, icon con |
| 224 | llm-council | — | REVIEWED_NOT_APPLICABLE | Convene a council of independent agents that answer a hard question separately, blind-review and rank each oth |
| 225 | loading-states | — | APPLIED | Design waiting experiences — spinners, skeletons, optimistic updates, and progressive reveal. Use when content |
| 226 | localization-design | — | REVIEWED_NOT_APPLICABLE | Design for multiple languages, writing directions, and cultural contexts — text expansion, RTL mirroring, and  |
| 227 | make-interfaces-feel-better | YES | REVIEWED_NOT_APPLICABLE | Design engineering principles for making interfaces feel polished. Use when building UI components, reviewing  |
| 228 | marquee-loop | YES | REVIEWED_NOT_APPLICABLE | "Apply seamless infinite marquee loops using duplicated items." |
| 229 | masked-reveal | YES | REVIEWED_NOT_APPLICABLE | Create masked staggered word reveals on scroll with GSAP ScrollTrigger. Use when headings, hero copy, section  |
| 230 | matterjs | YES | REVIEWED_NOT_APPLICABLE | Use when implementing 2D physics interactions with Matter.js, including Engine/World setup, Render/Runner conf |
| 231 | memory-load-reduction | — | REVIEWED_NOT_APPLICABLE | "Design interfaces that minimise demands on working memory. Use when designing multi-step flows, dashboards, c |
| 232 | mesh-gradient-dark-blue-clean | YES | REVIEWED_NOT_APPLICABLE | Create a futuristic, premium, clean dark-blue mesh-gradient design system across background rendering, hero sh |
| 233 | metrics-definition | — | REVIEWED_NOT_APPLICABLE | Define UX metrics and KPIs that connect design decisions to measurable outcomes. Use when choosing what to mea |
| 234 | micro-interaction-spec | — | REVIEWED_NOT_APPLICABLE | Specify one micro-interaction completely — trigger, rules, feedback, loops, and modes. Use when handing a sing |
| 235 | millers-law | — | REVIEWED_NOT_APPLICABLE | Apply Miller's Law — chunk information into groups of about four to fit working memory. Use when grouping fiel |
| 236 | minimalist-ui | YES | APPLIED | Clean editorial-style interfaces: warm monochrome palette, strong typographic contrast, flat bento grids, mute |
| 237 | motion-sensitivity | — | REVIEWED_NOT_APPLICABLE | "Design for people with vestibular disorders, motion sensitivity, or seizure conditions. Use when designing an |
| 238 | motion-system | — | REVIEWED_NOT_APPLICABLE | Define motion tokens — durations, easing vocabulary, and reduced-motion handling — for consistency product-wid |
| 239 | multi-modal-input | — | REVIEWED_NOT_APPLICABLE | "Design interfaces that offer multiple input methods so users can choose what works for their abilities and co |
| 240 | multimedia-accessibility | — | REVIEWED_NOT_APPLICABLE | "Design accessible video, audio, and multimedia content with captions, transcripts, and audio descriptions. Us |
| 241 | naming-convention | — | REVIEWED_NOT_APPLICABLE | Establish naming rules for components, tokens, and layers with patterns and worked examples. Use when names ar |
| 242 | navigation-patterns | — | REVIEWED_NOT_APPLICABLE | Select and design a navigation pattern — tabs, drawer, hierarchy, or hub — matched to product structure and us |
| 243 | nested-container-clean-agency | YES | REVIEWED_NOT_APPLICABLE | "Create a clean agency design system built from nested containers, with an outer editorial shell, inset dark f |
| 244 | nested-container-frames | YES | REVIEWED_NOT_APPLICABLE | "Create a container-in-container layout system using nested frames. Use an outer centered container with visib |
| 245 | north-star-vision | — | REVIEWED_NOT_APPLICABLE | Articulate a long-horizon product vision that aligns teams and anchors strategy. Use when direction is contest |
| 246 | number-details | YES | REVIEWED_NOT_APPLICABLE | "Add decorative 01, 02, 03 numeric detail markers." |
| 247 | onboarding-design | — | REVIEWED_NOT_APPLICABLE | Design the first-run experience — activation path, progressive disclosure, and time to first value. Use for a  |
| 248 | operational-enterprise-ai | YES | REVIEWED_NOT_APPLICABLE | Create or redesign enterprise AI, automation, security, and operations product pages that explain system bound |
| 249 | opportunity-framework | — | REVIEWED_NOT_APPLICABLE | Identify, score, and prioritise design opportunities against impact and effort. Use when there are more ideas  |
| 250 | optimize-threejs-games | YES | REVIEWED_NOT_APPLICABLE | Profile, diagnose, and improve Three.js or WebGL game performance without regressing gameplay. Use for frame-t |
| 251 | optimize-web-animations | YES | REVIEWED_NOT_APPLICABLE | Profile, audit, and optimize frontend page performance with emphasis on animation work, memory-leak risks, lon |
| 252 | orange-clean-paper-saas | YES | REVIEWED_NOT_APPLICABLE | "Create a clean paper-toned SaaS design system with warm neutrals, orange accent signals, rounded premium form |
| 253 | pattern-library | — | REVIEWED_NOT_APPLICABLE | Structure a pattern entry — problem context, solution, usage examples, and related patterns. Use when document |
| 254 | peak-end-rule | — | REVIEWED_NOT_APPLICABLE | Apply the Peak-End Rule — a flow is remembered by its most intense moment and its last. Use when designing com |
| 255 | performance-profiling | YES | APPLIED | Guide performance profiling for Apple platform apps with Instruments, Xcode diagnostics, and MetricKit. Use wh |
| 256 | pick-ui-library | YES | REVIEWED_NOT_APPLICABLE | Pick the right library for a given frontend task from a curated, opinionated list — numbers, OTP inputs, chart |
| 257 | plain-language-design | — | REVIEWED_NOT_APPLICABLE | "Write and review content for plain language accessibility. Use when writing interface copy, error messages, i |
| 258 | platform-conventions | — | REVIEWED_NOT_APPLICABLE | Design to iOS and Android conventions — what each OS mandates, where they diverge, and when to unify. Use when |
| 259 | pointer-trail-emitter | YES | REVIEWED_NOT_APPLICABLE | Build a cursor trail whose spacing stays constant at any hand speed, by emitting motes per unit of distance tr |
| 260 | preference-audit | — | REVIEWED_NOT_APPLICABLE | "Audit an existing interface for respect of user preferences including motion, contrast, colour scheme, and te |
| 261 | presentation-deck | — | REVIEWED_NOT_APPLICABLE | Structure a design presentation for a specific audience and decision. Use when presenting internally. For a po |
| 262 | pricing-page | YES | REVIEWED_NOT_APPLICABLE | Use when designing or rewriting a high-converting SaaS pricing page (structure, plan design, copywriting, SEO/ |
| 263 | product-proof-saas | YES | REVIEWED_NOT_APPLICABLE | Create or redesign SaaS and AI product landing pages where a real workflow, interface, or deterministic demo i |
| 264 | progressive-blur | YES | REVIEWED_NOT_APPLICABLE | Create a layered CSS progressive blur (top or bottom) using multiple backdrop-filter masks for depth and softn |
| 265 | prototype | YES | REVIEWED_NOT_APPLICABLE | Build multiple genuinely different versions of a UI piece you describe, rendered behind a visual picker so you |
| 266 | prototype-strategy | — | REVIEWED_NOT_APPLICABLE | Choose prototype fidelity and method to match the design question and the decision at stake. Use before buildi |
| 267 | publish-project-to-github | YES | REVIEWED_NOT_APPLICABLE | Package a finished local project into an intentional GitHub repository, create a strong README and visual prev |
| 268 | readable-content | — | REVIEWED_NOT_APPLICABLE | "Write and structure content for diverse reading abilities and cognitive styles. Use when writing long-form co |
| 269 | readable-measure | — | REVIEWED_NOT_APPLICABLE | Set line length and measure for comfortable reading across type sizes and breakpoints. Use when tuning body te |
| 270 | receiving-code-review | — | REVIEWED_NOT_APPLICABLE | Use when receiving code review feedback, before implementing suggestions, especially if feedback seems unclear |
| 271 | redesign-existing-projects | YES | REVIEWED_NOT_APPLICABLE | Upgrades existing websites and apps to premium quality. Audits current design, identifies generic AI patterns, |
| 272 | render-deploy | — | REVIEWED_NOT_APPLICABLE | Deploy applications to Render by analyzing codebases, generating render.yaml Blueprints, and providing Dashboa |
| 273 | requesting-code-review | — | REVIEWED_NOT_APPLICABLE | Use when completing a task or major feature and before committing or merging — dispatch a code-reviewer subage |
| 274 | research-repository | — | REVIEWED_NOT_APPLICABLE | Build a repository that makes findings findable, reusable, and cumulative across teams. Use when the same rese |
| 275 | responsive-accessibility | — | REVIEWED_NOT_APPLICABLE | "Design responsive layouts that maintain accessibility across screen sizes, zoom levels, and orientations. Use |
| 276 | responsive-design | — | APPLIED | Design layouts and interactions that adapt across screen sizes and input methods. Use when one design must ser |
| 277 | responsive-review | — | APPLIED | "Review responsive and flexible layout for accessibility across devices, zoom levels, and orientations. Chains |
| 278 | reveal-hover-effect | YES | REVIEWED_NOT_APPLICABLE | Build cursor-following spotlight reveals that expose a second aligned image through a soft radial mask. Use fo |
| 279 | review-animations | YES | REVIEWED_NOT_APPLICABLE | Reviews animation and motion code against a high craft bar derived from Emil Kowalski's design engineering phi |
| 280 | scenario-map | — | REVIEWED_NOT_APPLICABLE | "Map inclusive usage scenarios across ability spectrums for a product or feature. Chains: ability-spectrum-map |
| 281 | scroll-progress-timeline | YES | REVIEWED_NOT_APPLICABLE | Turn any ordered process into a data-driven vertical or horizontal scroll story with a base line, progress fil |
| 282 | scroll-scrubbed-visual-sequence | YES | REVIEWED_NOT_APPLICABLE | Build reversible scroll-controlled visual transformations with a pinned or sticky stage, normalized progress,  |
| 283 | scroll-scrubbed-word-reveal | YES | REVIEWED_NOT_APPLICABLE | Reveal marked-up text word by word as scroll progress advances, while preserving semantic inline links, emphas |
| 284 | scroll-world-storytelling | YES | REVIEWED_NOT_APPLICABLE | "Turn an article, case study, brand narrative, product journey, or long-form story into a cinematic scroll-dri |
| 285 | search-ux | — | REVIEWED_NOT_APPLICABLE | Design search — query input, zero results, refinement, and result presentation. Use when users retrieve rather |
| 286 | seo | — | REVIEWED_NOT_APPLICABLE | > |
| 287 | seo-audit | — | REVIEWED_NOT_APPLICABLE | > |
| 288 | seo-content | — | REVIEWED_NOT_APPLICABLE | > |
| 289 | seo-geo | — | REVIEWED_NOT_APPLICABLE | > |
| 290 | seo-hreflang | — | REVIEWED_NOT_APPLICABLE | > |
| 291 | seo-images | — | REVIEWED_NOT_APPLICABLE | > |
| 292 | seo-local | — | REVIEWED_NOT_APPLICABLE | > |
| 293 | seo-optimizer | — | REVIEWED_NOT_APPLICABLE | Search Engine Optimization specialist for content strategy, technical SEO, keyword research, and ranking impro |
| 294 | seo-page | — | REVIEWED_NOT_APPLICABLE | > |
| 295 | seo-plan | — | REVIEWED_NOT_APPLICABLE | > |
| 296 | seo-schema | — | REVIEWED_NOT_APPLICABLE | > |
| 297 | seo-sitemap | — | REVIEWED_NOT_APPLICABLE | > |
| 298 | seo-technical | — | REVIEWED_NOT_APPLICABLE | > |
| 299 | serial-position-effect | — | REVIEWED_NOT_APPLICABLE | Apply the Serial Position Effect — first and last items in a sequence are recalled best. Use when ordering men |
| 300 | service-blueprint | — | REVIEWED_NOT_APPLICABLE | Map service delivery across frontstage actions, backstage processes, and supporting systems. Use when staff an |
| 301 | shaders-cursor-ripples | YES | REVIEWED_NOT_APPLICABLE | Add cursor-following fluid WebGPU distortion over an existing image with the Shaders library's ImageTexture an |
| 302 | ship-web-games | YES | REVIEWED_NOT_APPLICABLE | Package, deploy, and verify a playable Three.js or web game. Use for release builds, asset delivery, private/p |
| 303 | simplified-views | — | REVIEWED_NOT_APPLICABLE | "Design simplified and reduced-complexity views of interfaces for users who need less visual noise and fewer o |
| 304 | situational-impairment-mapping | — | REVIEWED_NOT_APPLICABLE | "Map situational impairments that affect all users in specific contexts — not just people with permanent disab |
| 305 | skeuomorphic-ui | YES | REVIEWED_NOT_APPLICABLE | Create skeuomorphic web UI surfaces with layered gradients, stacked inner and outer shadows, reflective gradie |
| 306 | solar-duotone-bold | YES | REVIEWED_NOT_APPLICABLE | "Use Iconify Solar Duotone Bold icon style." |
| 307 | spacing-system | — | APPLIED | Create a spacing scale from a base unit with rules for when each step applies. Use when standardising padding  |
| 308 | split-layout-technical | YES | REVIEWED_NOT_APPLICABLE | "Create a technical split-screen design system with dual panels, fine frame lines, mono metadata, quiet editor |
| 309 | staggered-word-reveal | YES | REVIEWED_NOT_APPLICABLE | Create subtle editorial word-by-word text reveal animations where each word fades and rises into place once it |
| 310 | stakeholder-alignment | — | REVIEWED_NOT_APPLICABLE | Build alignment artifacts — responsibility matrices, decision rights, and communication plans. Use when unclea |
| 311 | stakeholder-communication | — | REVIEWED_NOT_APPLICABLE | "Communicate accessibility decisions, requirements, and value to stakeholders who aren't accessibility special |
| 312 | state-machine | — | APPLIED | Model component behaviour as explicit states, events, and transitions. Use when a component has many interacti |
| 313 | stitched-full-page-capture | YES | REVIEWED_NOT_APPLICABLE | Capture or repair reliable full-page screenshots for lazy-loaded, scroll-animated, Framer, WebGL/canvas, or re |
| 314 | subagent-driven-development | — | REVIEWED_NOT_APPLICABLE | Use when executing an implementation plan with independent tasks in the current session — delegate each task t |
| 315 | summarize-interview | — | REVIEWED_NOT_APPLICABLE | Turn one interview transcript into themes, supporting quotes, and action items. Use immediately after a sessio |
| 316 | survey-design | — | REVIEWED_NOT_APPLICABLE | Design unbiased survey instruments — question wording, scales, and sampling — to measure attitudes at scale. U |
| 317 | table-accessibility | — | REVIEWED_NOT_APPLICABLE | "Design data tables that work for screen readers and cognitive accessibility. Use when creating or reviewing t |
| 318 | tailwindcss | YES | APPLIED | Use when designing/implementing UI with Tailwind CSS (layout, typography, responsive, theming, component patte |
| 319 | team-workflow | — | REVIEWED_NOT_APPLICABLE | Design the team's operating rhythm — task management, collaboration rituals, and tooling. Use when the day-to- |
| 320 | tech-green-dark-mode-modern | YES | REVIEWED_NOT_APPLICABLE | "Create a modern dark-mode technical design system with matte-black surfaces, emerald signal accents, mono sys |
| 321 | technical-wireframe-info-layout | YES | REVIEWED_NOT_APPLICABLE | "Create a monochrome technical wireframe design system with exploded 3D structure, connector annotations, spar |
| 322 | teslers-law | — | REVIEWED_NOT_APPLICABLE | Apply Tesler's Law — every process has irreducible complexity that someone must absorb. Use when deciding whet |
| 323 | test-playable-web-games | YES | REVIEWED_NOT_APPLICABLE | Test a playable browser game end to end with deterministic fixtures and real browser evidence. Use for gamepla |
| 324 | test-scenario | — | REVIEWED_NOT_APPLICABLE | Write realistic usability task scenarios with success criteria and facilitation notes. Use when you have a stu |
| 325 | theming-system | — | REVIEWED_NOT_APPLICABLE | Design theming architecture — brand variants, dark mode, and high-contrast — mapped through token layers. Use  |
| 326 | thinking-orbs | YES | REVIEWED_NOT_APPLICABLE | Add accessible animated AI loading and agent-status indicators with the React thinking-orbs library. Use when  |
| 327 | threejs | YES | REVIEWED_NOT_APPLICABLE | Use when building or debugging interactive 3D scenes on the web with Three.js (scene/camera/renderer, lights/m |
| 328 | threejs-landscape | YES | REVIEWED_NOT_APPLICABLE | Build a live Three.js landscape that stays quiet behind a subject — a noise heightfield on a polar grid so res |
| 329 | threejs-towers | YES | REVIEWED_NOT_APPLICABLE | Generate architecture procedurally in Three.js and film it assembling — a small geometry vocabulary that build |
| 330 | threejs-weather | YES | REVIEWED_NOT_APPLICABLE | Put weather into a Three.js scene that reads as weather — rain anchored inside the frustum, a storm that is th |
| 331 | touch-target-design | — | REVIEWED_NOT_APPLICABLE | "Design touch targets and pointer interactions that work for people with motor difficulties, tremors, limited  |
| 332 | tradeoff-analysis | — | REVIEWED_NOT_APPLICABLE | "Analyse accessibility tradeoffs when a design decision improves accessibility for one group but may affect an |
| 333 | transformer-workspace-auditor | — | REVIEWED_NOT_APPLICABLE | Apply the Transformer Circuits global-workspace and Jacobian-lens framework to LLM reasoning, interpretability |
| 334 | tune-enemy-ai | YES | REVIEWED_NOT_APPLICABLE | Build, debug, balance, or test combat enemy AI for playable action games. Use for aggro, target selection, nav |
| 335 | typography-scale | — | APPLIED | Create a modular type scale with size, weight, and line-height relationships. Use when establishing typographi |
| 336 | unicorn-studio | YES | REVIEWED_NOT_APPLICABLE | Use when embedding and customizing Unicorn Studio interactive animations on the web (embed, responsive sizing, |
| 337 | unsplash-asset-images | YES | REVIEWED_NOT_APPLICABLE | Use when you need to pick high-quality Unsplash images for product/design assets (avatars, headshots, portrait |
| 338 | usability-test-plan | — | REVIEWED_NOT_APPLICABLE | Design a usability study — research questions, methodology, participant criteria, metrics, and facilitation gu |
| 339 | user-flow-diagram | — | REVIEWED_NOT_APPLICABLE | Diagram screen-level paths, decision points, and branch logic. Use when specifying how a feature is traversed. |
| 340 | user-persona | — | REVIEWED_NOT_APPLICABLE | Build research-grounded personas with goals, frustrations, and behavioural patterns. Use when decisions need a |
| 341 | user-preference-respect | — | REVIEWED_NOT_APPLICABLE | "Design interfaces that detect and respond to system-level user preferences. Use when implementing dark mode,  |
| 342 | using-git-worktrees | — | REVIEWED_NOT_APPLICABLE | Use when starting feature work that needs isolation from current workspace or before executing implementation  |
| 343 | using-superpowers | — | APPLIED | Use when starting any conversation - establishes how to find and use skills, requiring Skill tool invocation b |
| 344 | ux-writing | — | REVIEWED_NOT_APPLICABLE | Write interface copy — microcopy, error messages, empty states, and CTAs. Use when the words are the deliverab |
| 345 | vantajs | YES | REVIEWED_NOT_APPLICABLE | Use when adding animated WebGL background effects with Vanta.js (setup, parameters, resizing, performance, int |
| 346 | variant | YES | REVIEWED_NOT_APPLICABLE | Answers "which of these?" rather than "is this right?". Builds several genuinely different versions of one pie |
| 347 | verification-before-completion | — | APPLIED | Use when about to claim work is complete, fixed, or passing, before committing or creating PRs - requires runn |
| 348 | version-control-strategy | — | REVIEWED_NOT_APPLICABLE | Define version control for design files, components, and libraries — branching, naming, and release. Use when  |
| 349 | video-to-superprompt | YES | REVIEWED_NOT_APPLICABLE | Turn a reference video into a super detailed recreation or inspiration prompt. Use when the user provides, men |
| 350 | visual-hierarchy | — | APPLIED | Establish hierarchy through size, weight, colour, spacing, and position so the eye lands in the intended order |
| 351 | voice-interaction | — | REVIEWED_NOT_APPLICABLE | "Design voice interactions and speech interfaces that work for people with diverse speech patterns, accents, a |
| 352 | von-restorff-effect | — | REVIEWED_NOT_APPLICABLE | Apply the Von Restorff Effect — the element that differs from its neighbours is the one remembered. Use when a |
| 353 | wayfinding-navigation | — | REVIEWED_NOT_APPLICABLE | "Design navigation and information architecture for cognitive accessibility. Use when designing or reviewing n |
| 354 | web-technique-to-skill | YES | REVIEWED_NOT_APPLICABLE | Turn a visual or interaction technique you already built into a reusable web-design skill, by isolating the on |
| 355 | webgl-3d-object | YES | REVIEWED_NOT_APPLICABLE | Create a real 3D WebGL object with geometric mesh depth, physically based material, directional and ambient li |
| 356 | webgl-landing-steering | YES | REVIEWED_NOT_APPLICABLE | Use when creating or refining WebGL-heavy landing pages and you need to steer toward a specific visual outcome |
| 357 | webgl-laser | YES | REVIEWED_NOT_APPLICABLE | Create a fixed full-screen WebGL laser background effect with a thin white-hot vertical core, restrained brand |
| 358 | wireframe-spec | — | REVIEWED_NOT_APPLICABLE | Specify wireframe layout — content priority, component placement, and annotation. Use when defining structure  |
| 359 | write-like-meng-on-x | YES | REVIEWED_NOT_APPLICABLE | Write, rewrite, review, or continuously refine X/Twitter posts in Meng To's current voice using his deduplicat |
| 360 | write-swift | YES | REVIEWED_NOT_APPLICABLE | How to write modern Swift well — modeling with value types, Swift 6 data-race safety and approachable concurre |
| 361 | writing-plans | — | APPLIED | Use when you have a spec or requirements for a multi-step task, BEFORE touching code. Produces a comprehensive |
| 362 | writing-skills | — | REVIEWED_NOT_APPLICABLE | Use when creating a new skill, editing an existing skill, or verifying a skill works before deployment. Covers |
| 363 | x-bookmark-quote-posts | YES | REVIEWED_NOT_APPLICABLE | Check a user's latest X/Twitter bookmarks and turn recent saved posts into source-backed quote-post drafts cal |
| 364 | zeigarnik-effect | — | REVIEWED_NOT_APPLICABLE | Apply the Zeigarnik Effect — incomplete tasks stay mentally active. Use when designing progress indicators, sa |

**الإجمالي:** 364 مهارة | APPLIED: 38 | REVIEWED_NOT_APPLICABLE: 326 | BROKEN_OR_MISSING (مراجع ميتة): 2

## مشاكل السلامة (BROKEN_OR_MISSING)

| # | المشكلة | الدليل |
|---|---|---|
| 1 | design-pipeline/SKILL.md يحيل لمهارة stitch-design-taste غير الموجودة (مجلد محذوف سابقًا) | design-pipeline/SKILL.md:6,10,28 |
| 2 | design-pipeline/SKILL.md يحيل لمهارة image-to-code غير الموجودة على القرص (مدخل سجل ميت فقط) | design-pipeline/SKILL.md:6,10,31 |
| 3 | skills-lock.json: 164/164 هاش لا يطابق + 11 مدخلًا لمجلدات مفقودة (gpt-taste, grill-me, performance, systematic-debugging, web-design-guidelines, design-taste-frontend-v1, full-output-enforcement, imagegen-frontend-web/mobile, image-to-code, stitch-design-taste) | تدقيق sha256 برمجي 2026-08-28 |
| 4 | تغليف متداخل شاذ: distribb يحوي 90-day-seo-sprint/SKILL.md داخله | find .agents/skills -name SKILL.md |

ملاحظة: تحديث السجل والعدّ في الدساتير ضمن برومبت الإغلاق CP-04.
