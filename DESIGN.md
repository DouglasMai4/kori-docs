---
name: kori
description: Documentation and brand site for kori, a Go toolkit for Chi. Simplicity that flows.
colors:
  primary: "#315bff"
  primary-on-dark: "#5b8bff"
  primary-deep: "#1a3299"
  crystal: "#75b7ff"
  ice: "#bbd8ff"
  accent-low-dark: "#142357"
  accent-low-light: "#dfe9ff"
  night: "#0d1526"
  night-raised: "#111c30"
  code-surface: "#0f1a2e"
  code-bar: "#131f36"
  deep-slate: "#17243b"
  slate: "#26364f"
  line-dark: "#22324c"
  line-light: "#dbe3f0"
  steel: "#8493ad"
  ink-muted-dark: "#a9b6cc"
  ink-muted-light: "#3e4d68"
  mist: "#e5ecf7"
  snow: "#f5f8ff"
  white: "#ffffff"
typography:
  display:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(3rem, 7.4vw, 5.5rem)"
    fontWeight: 660
    lineHeight: 0.98
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.9rem, 3.4vw, 2.75rem)"
    fontWeight: 640
    lineHeight: 1.08
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 650
    letterSpacing: "-0.025em"
  lede:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.08rem, 1.5vw, 1.25rem)"
    lineHeight: 1.6
  body:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.85rem"
    fontWeight: 400
  wordmark:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.45rem"
    fontWeight: 620
    letterSpacing: "-0.04em"
  code:
    fontFamily: "Geist Mono Variable, ui-monospace, SFMono-Regular, monospace"
    fontSize: "0.86rem"
    lineHeight: 1.7
rounded:
  inline-code: "0.35rem"
  sm: "6px"
  control: "10px"
  window: "14px"
  pill: "999px"
spacing:
  wrap: "76rem"
  content: "46rem"
  section-y: "clamp(4.5rem, 9vw, 7.5rem)"
  head-gap: "3rem"
  column-gap: "4rem"
  row: "1.5rem"
components:
  button-primary:
    textColor: "{colors.night}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0.85rem 1.35rem"
  install-pill:
    textColor: "{colors.mist}"
    typography: "{typography.code}"
    rounded: "{rounded.control}"
    padding: "0.78rem 0.9rem 0.78rem 1.1rem"
  code-window:
    backgroundColor: "{colors.code-surface}"
    textColor: "{colors.mist}"
    typography: "{typography.code}"
    rounded: "{rounded.window}"
  code-window-bar:
    backgroundColor: "{colors.code-bar}"
    padding: "0.8rem 1rem"
  segmented-tab:
    backgroundColor: "{colors.night}"
    textColor: "{colors.ink-muted-dark}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0.35rem 0.85rem"
  segmented-tab-selected:
    backgroundColor: "{colors.slate}"
    textColor: "{colors.white}"
  segmented-tab-resolved:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.white}"
  inline-code-dark:
    backgroundColor: "{colors.accent-low-dark}"
    textColor: "{colors.ice}"
    rounded: "{rounded.inline-code}"
    padding: "0.1em 0.38em"
  inline-code-light:
    backgroundColor: "{colors.accent-low-light}"
    textColor: "{colors.primary-deep}"
    rounded: "{rounded.inline-code}"
    padding: "0.1em 0.38em"
  lang-chip:
    rounded: "{rounded.pill}"
    padding: "0.3rem 0.7rem"
---

# Design System: kori

## Overview

**Creative North Star: "Ice on Night"**

kori is a cold, clear world: a Night field (deep navy, never black) with translucent rounded-diamond glass slabs carrying the brand gradient, and Snow/Mist reading surfaces where the docs live. The system is a docs product first, so code is the hero material. Code always sits in dark windows with a title bar and traffic lights, in both themes, so the code reads the same wherever it appears.

Density is calm and lean, matching the library. Sections breathe on a generous vertical rhythm and split into a two-column head (headline left, explanation right) above a single dominant artifact. There are no feature-card grids. Lists are hairline-ruled rows, not boxes. Color is almost entirely the blue family from the binding brand palette. Accents are reserved for action (Primary) and emphasis (Crystal).

The logo mark at `src/assets/kori-mark.svg` is an **interim vector**: three rotated rounded squares with gradient fills approximating the mock, pending the official vectorization. Treat its geometry as provisional. The binding commitments are the stacked rounded-diamond form and the gradient.

**Key Characteristics:**
- Night hero field with a radial Primary glow and drifting rounded-diamond glass slabs bleeding off the right edge.
- Geist Sans with tight negative tracking on display sizes. Geist Mono is used only for code.
- Code windows are always dark, 14px-rounded, with traffic-light dots and a mono filename.
- Blue-family palette only. The brand gradient appears on the mark and the slabs.
- Hairline borders and tonal steps carry structure. Shadows are soft, sparse, and diffuse.

## Colors

A single-hue blue system, from Night to Snow, with Primary for action and Crystal for emphasis.

### Primary
- **Kori Primary** (`primary`): the action color. Selected or resolved states (the "with kori" tab once the diff collapses), links and accents in light theme. On dark docs surfaces it lifts to **Primary on Dark** (`primary-on-dark`) so it holds contrast, and in light theme it deepens to **Primary Deep** (`primary-deep`) for accent-high text such as inline code and active sidebar items.

### Secondary
- **Crystal Blue** (`crystal`): emphasis on dark. The second line of the hero headline, API names and section links in dark theme, Chi bullet diamonds, the OpenAPI arrow, focus rings on the landing, the copy-confirmation tooltip, and text selection (mixed 45% with transparent).
- **Ice Blue** (`ice`): the light end of the gradient. Slab borders (at 25 to 35% alpha), accent-high text on dark docs, and string or number tokens in code.

### Neutral
- **Night** (`night`): the hero field, the dark page background, segmented-control track, and text on light buttons.
- **Night Raised** (`night-raised`): the alternate dark section band and the docs gray-7.
- **Code Surface** (`code-surface`) and **Code Bar** (`code-bar`): the code window body and title bar. They stay the same in both themes.
- **Deep Slate** (`deep-slate`) / **Slate** (`slate`): dark gray steps. Slate is the selected segment background and the scrollbar thumb.
- **Line Dark** (`line-dark`) / **Line Light** (`line-light`): hairlines for windows, rows, section borders, and pill strokes.
- **Steel** (`steel`): de-emphasized mono text, such as the filename, the `$` prompt, and the line counter.
- **Ink Muted** (`ink-muted-dark` / `ink-muted-light`): secondary prose for section explanations, row descriptions, and the footer.
- **Mist** (`mist`) / **Snow** (`snow`) / **White** (`white`): light surfaces and text on dark. Snow is the light page background and Mist is the alternate light band.

### Named Rules
**The Gradient Belongs to the Mark Rule.** The brand gradient `linear-gradient(120deg, #bbd8ff 0%, #75b7ff 38%, #315bff 100%)` appears only on the logo mark and the hero slabs that echo it. Do not use it as a section background or a text fill.

**The Night Is Not Black Rule.** The darkest value is Night (`#0d1526`). Dark surfaces step up through Night Raised, Code Surface, and Code Bar. Never use pure `#000`.

**The Blue Family Rule.** Every UI color comes from the blue-navy ramp. The only exceptions are the three macOS traffic-light dots (`#ff5f57`, `#febc2e`, `#28c840`), and they appear only in code-window title bars.

## Typography

**Display Font:** Geist Variable (with ui-sans-serif, system-ui)
**Body Font:** Geist Variable
**Label/Mono Font:** Geist Mono Variable (with ui-monospace, SFMono-Regular), for code only

**Character:** A precise, modern grotesque set tight at large sizes, so headlines feel compact and engineered. The mono shares Geist's skeleton, so code and prose sit in the same family.

### Hierarchy
- **Display** (660, clamp(3rem, 7.4vw, 5.5rem), 0.98, -0.04em): the landing hero headline only. It runs on two lines with the second line in Crystal, and the first line does not wrap.
- **Headline** (640, clamp(1.9rem, 3.4vw, 2.75rem), 1.08, -0.035em): landing section headlines, balanced wrap.
- **Title** (650, 2.5rem, -0.025em): the docs page h1. Docs h2 is 620 with 2.75rem top margin, h3 is 600, and all docs headings use -0.025em with balanced wrap.
- **Lede** (400, clamp(1.08rem, 1.5vw, 1.25rem), max 32rem): hero subline in muted ink.
- **Body** (400, 1.0625rem, 1.6): landing prose with pretty wrap. Explanations cap at 34rem and notes at 46rem. Docs content width is 46rem.
- **Label** (0.85rem): segmented tabs, line counter, language chip, nav at 0.95rem.
- **Code** (Geist Mono, 0.86rem, 1.7): code windows. Inline code is 0.875em. The install pill uses 0.88rem.

### Named Rules
**The Mono Is for Code Rule.** Geist Mono appears only where the content is literally code: code windows, inline code, API names, filenames, and the `go get` command. It never sets headings, labels, or decorative text.

**The Tight Display Rule.** Tracking tightens as size grows: -0.04em at display and wordmark, -0.035em at landing headline, -0.025em in docs headings, and default tracking at body.

## Layout

Content sits in a centered wrap of `min(100% - 3rem, 76rem)`, and docs content runs at 46rem. Landing sections pad vertically at clamp(4.5rem, 9vw, 7.5rem). A section opens with a two-column head (headline and explanation, aligned to the bottom, 2rem by 4rem gap, 3rem below) followed by one artifact: a code window, a split of copy and window (0.9fr / 1.1fr, 4rem gap), a hairline-ruled definition list (12rem term column, 1.5rem row padding), or a pair of windows joined by an arrow (1.25fr / 3rem / 0.85fr). Alternate bands switch to the raised background with hairline top and bottom borders.

The hero is always Night in both themes and is at least `min(42rem, 100svh - 5rem)` tall. Copy is capped at 46rem on the left and the slabs are absolutely positioned at the right, bleeding about 12% off-edge.

Breakpoints: at 960px, heads, splits, and the OpenAPI pair collapse to one column, the arrow turns 90 degrees, secondary nav links hide, and the slabs drop behind the copy at 50% opacity. At 640px, definition rows stack, the code-window bar wraps, and nav gaps tighten.

## Elevation & Depth

The system is mostly flat with tonal layering. Depth comes from stepping navy values (Night, Night Raised, Code Bar, Code Surface) and from 1px hairlines. Shadows are rare, soft, and negatively spread, so they read as ambient lift under code windows and the primary button. They are never structural or offset. The hero adds atmospheric depth through a radial Primary glow and translucent, backdrop-blurred slabs.

### Shadow Vocabulary
- **Window Lift** (`box-shadow: 0 30px 60px -30px rgb(13 21 38 / .45)`; light theme `0 30px 60px -32px rgb(23 36 59 / .35)`): under every code window.
- **Button Lift** (`box-shadow: 0 6px 16px -6px rgb(13 21 38 / .55), inset 0 1px 0 rgb(255 255 255 / .25)`): the primary button at rest. On hover it deepens to `0 10px 22px -8px` and the button rises 1px.
- **Slab Drop** (`box-shadow: 0 40px 80px -30px rgb(13 21 38 / .9)`): the solid gradient slab only.
- **Nav Glass** (`backdrop-filter: saturate(1.4) blur(12px)` over an 86% alpha nav background): the docs header.

### Named Rules
**The Ambient Only Rule.** Shadows are large-blur and negatively spread, tinted Night or Deep Slate. Hard or offset shadows are not part of this world.

## Shapes

Corners are softly rounded throughout, in steps: 0.35rem for inline code, 6px for small controls (segment buttons, tooltip, theme toggle at 8px), 10px for the primary button and install pill (9px for the segment track), 14px for code windows, and fully rounded for the language chip. The signature silhouette is the **rounded diamond**, a square rotated 45 degrees with about 18% corner radius. It appears in the mark, the hero slabs, and as the 0.62rem bullet (3px radius) in the Chi list. Borders are always 1px hairlines.

## Components

### Buttons
Confident and luminous, the one bright object on the Night field.
- **Shape:** gently rounded (10px).
- **Primary:** a short Crystal-to-blue gradient (`linear-gradient(120deg, #75b7ff, #4f8cff)`) with Night text, weight 560, padding 0.85rem by 1.35rem, and a trailing arrow icon.
- **Hover / Focus:** rises 1px, the shadow deepens, and the arrow slides 3px right on `cubic-bezier(0.16, 1, 0.3, 1)` over 0.3s. Focus shows a 2px Crystal outline offset by 3px.

### Install Pill
The copyable `$ go get github.com/douglasmai4/kori` command. It sits on a 4% white wash with a 1px `#2a3b58` stroke and a 10px radius. The text is mono, with the prompt `$` in Steel and not selectable. On hover the stroke brightens and the wash rises to 7%. On click it copies, and a Crystal tooltip ("Copied") rises 4px above the copy icon for 1.6s. On light sections it uses the page background and Line stroke.

### Code Window (signature)
The house container for code, always dark. It has a Code Surface body, a Code Bar title bar with a hairline bottom, a 14px radius, a 1px Line Dark border, and Window Lift. The bar holds three traffic-light dots (0.7rem) and either a mono filename in Steel or controls. Code pads 1.25rem by 1.4rem and is highlighted with the `kori-dark` Shiki theme: Crystal keywords, Ice strings and numbers, `#8fb0ff` functions, `#9fc6ff` types, and italic `#6b7a94` comments.

### Segmented Toggle and Collapse Counter (signature)
This lives in the diff window bar. A 3px-padded Night track (9px radius) holds 6px-radius tabs. The selected tab is Slate, and in the resolved "with kori" state it is Primary. A tabular-numeral line counter at the right animates from the before count to the after count over 700ms with ease-out-quart. The pane height animates over 0.7s, and the incoming pane fades in from 6px blur. On first view the window auto-collapses after 1.4s unless the user has already interacted. Reduced motion skips the animation and jumps to the final state.

### Definition Rows
The API index uses a hairline-ruled `dl` with no boxes. The term is weight 600 at -0.01em, names are mono in emphasis color, and descriptions use muted ink.

### Navigation
- **Landing:** the mark at 30px plus the lowercase wordmark (620, 1.45rem, -0.04em), then text links at 0.95rem in `#d7e0ef` that hover to white. GitHub has an outbound arrow, the language switch is a pill chip, and the theme toggle swaps sun and moon icons with a rotate-and-scale crossfade.
- **Docs (Starlight):** a glass header. The active sidebar item gets an accent-low background, accent-high text, and weight 560. Links use 1px underlines at a 0.22em offset.

### Inline Code (docs)
Accent-low background with accent-high text, no border, 0.35rem radius, 0.875em size.

## Do's and Don'ts

### Do:
- **Do** put every code sample in a dark code window with traffic lights and a filename, in both themes.
- **Do** keep the hero on Night in both themes, with the Primary radial glow and the rounded-diamond slabs at right.
- **Do** use Crystal for emphasis on dark surfaces and Primary for action and resolved state.
- **Do** use the rounded diamond (45 degree rotation, rounded corners) as the recurring brand shape, including list bullets.
- **Do** structure lists and indexes with 1px hairline rows instead of cards.
- **Do** use `cubic-bezier(0.16, 1, 0.3, 1)` for all state motion and honor `prefers-reduced-motion`.
- **Do** use tabular numerals in tables and counters.

### Don't:
- **Don't** use the brand gradient anywhere except the mark and the slabs that echo it.
- **Don't** set headings, labels, or UI chrome in Geist Mono.
- **Don't** use pure black, or hues outside the blue family (the traffic-light dots are the only exception).
- **Don't** use emoji feature-card grids. Sections show one real artifact, not tiles of claims.
- **Don't** use hard or offset shadows. Elevation is ambient and diffuse.
