---
name: Pai's Blog
description: A Chinese technical reading handbook with cool paper, blue-gray navigation and deep teal links.
colors:
  paper: '#f4f7f8'
  surface: '#fff'
  rail: '#e8eef1'
  ink: '#183b50'
  secondary: '#36596b'
  muted: '#506c7b'
  accent: '#176b67'
  line: '#c7d5dc'
  selected: '#d4e7e5'
  link-hover: '#104d4a'
  selected-ink: '#145d5b'
  control-border: '#a5b9c4'
  highlight: '#d8ebe3'
  highlight-ink: '#143f38'
typography:
  display:
    fontFamily: '"Pai Headings", "PingFang SC", "Microsoft YaHei", sans-serif'
    fontSize: 32px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: -0.02em
  headline:
    fontFamily: '"Pai Headings", "PingFang SC", "Microsoft YaHei", sans-serif'
    fontSize: 25px
    fontWeight: 600
    lineHeight: 1.5
  title:
    fontFamily: '"Pai Headings", "PingFang SC", "Microsoft YaHei", sans-serif'
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.6
  body:
    fontFamily: '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif'
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.8
  label:
    fontFamily: '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif'
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.8
rounded:
  navigation: 4px
  control: 6px
  panel: 12px
spacing:
  '4': 4px
  '8': 8px
  '12': 12px
  '16': 16px
  '20': 20px
  '24': 24px
  '28': 28px
  '32': 32px
  '36': 36px
  '40': 40px
  '48': 48px
  '56': 56px
components:
  search-field:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.ink}'
    rounded: '{rounded.control}'
    padding: 0 4px 0 12px
    width: min(400px, 100%)
  text-button:
    backgroundColor: transparent
    textColor: '{colors.accent}'
    padding: 8px
  more-button:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.accent}'
    rounded: '{rounded.control}'
    padding: 8px 20px
  stage-navigation:
    textColor: '{colors.secondary}'
    rounded: '{rounded.navigation}'
    padding: 8px 12px
  stage-navigation-current:
    backgroundColor: '{colors.selected}'
    textColor: '{colors.selected-ink}'
  reading-stage:
    padding: 20px 0
  margin-note:
    padding: 16px 0 0
  archive-entry:
    padding: 24px 0
  data-panel:
    backgroundColor: '{colors.surface}'
    rounded: '{rounded.panel}'
    padding: 20px
---

# Design System: Pai's Blog

## Overview

**Creative North Star: "Reading handbook"**

A calm Chinese technical reference built from cool paper, a blue-gray navigation rail, deep blue text and deep teal links. Headings establish hierarchy without a promotional hero; compact controls use familiar document syntax.

The implemented visual language is flat and text-led. Rules, spacing and restrained tonal changes distinguish regions; explanatory relationships stay close to the material they qualify. The homepage and article reader share the palette and heading face from `assets/reading-theme.css`; their reading layouts remain surface decisions in `.impeccable/surfaces/`.

**Key Characteristics:**

- Cool paper and blue-gray support surfaces.
- Self-hosted Chinese headings paired with platform body text.
- Flat document rows, fine separators and restrained controls.
- Visible keyboard focus and inline search feedback.

## Colors

The palette reads as cool paper with blue text and a reserved teal action color. The frontmatter preserves the actual CSS values and names.

### Primary

- **Deep teal** (`accent`): links, actionable text, caret, focus outlines and chart data.
- **Deep teal hover** (`link-hover`): darker ordinary link hover.
- **Selected teal ink** (`selected-ink`): navigation hover and current text.

### Neutral

- **Cool paper** (`paper`): page and sticky header background.
- **White surface** (`surface`): search control, more-results button and data panel.
- **Blue-gray rail** (`rail`): persistent reading navigation.
- **Deep blue ink** (`ink`): body text and headings.
- **Secondary blue** (`secondary`): descriptive prose and navigation.
- **Muted blue-gray** (`muted`): metadata, help, relationship notes and labels.
- **Fine blue-gray line** (`line`): dividers and panel borders.
- **Selected wash** (`selected`): navigation hover and current location.
- **Control stroke** (`control-border`): field and more-results button borders.
- **Search highlight wash / ink** (`highlight`, `highlight-ink`): matched query fragments, with text remaining readable.

**The Teal Action Rule.** Use deep teal for links, focus and actionable text; keep prose in the blue text hierarchy.

## Typography

**Display Font:** Pai Headings, the self-hosted Noto Sans SC weight-600 subset, with PingFang SC, Microsoft YaHei and sans-serif fallbacks.
**Body Font:** Segoe UI, PingFang SC, Microsoft YaHei, sans-serif.

**Character:** Direct, compact Chinese technical prose. The bundled heading file covers 253 glyphs (35,036 bytes), uses `font-display: swap`, and carries its OFL and source in `assets/fonts/`. It is a subset rather than a full Chinese font.

### Hierarchy

- **Display:** the page h1; the frontmatter desktop role reduces to (28px) at the (860px) breakpoint and (26px) at (540px).
- **Headline:** section h2; reduces to (23px) at (540px). Margin h2 uses the compact (16px) heading variant.
- **Title:** article and search-result h3; reduces to (18px) at (540px). Reading-stage h3 uses (16px), then (18px) on small screens.
- **Body:** the frontmatter body role; supporting notes commonly use (14px), with topic descriptions at (1.7) and relationship notes at (1.85) line height.
- **Label:** metadata and sidebar annotation; navigation uses (15px), topic navigation and top links use (14px). Brand sizes are (26px) in the rail and (22px) on mobile.

**The Real Heading Rule.** Use the bundled heading face for the brand and semantic headings. Keep headings as ordinary document titles without decorative eyebrows.

## Layout

The current homepage has a centered frame capped at (1640px), a sticky left rail (224px), and a workspace inset (36px). Its content grid uses a flexible reading column capped at (820px), a relationship margin (224px) and a gutter (36px). Reading stages pair a compact label column (108px) with explanatory content, separated by a (20px) gap. Topics form two columns. Spacing uses the observed frontmatter steps rather than a fabricated uniform scale.

At widths above (1500px), workspace insets and the main gutter become (48px). At (1150px) and below, the rail becomes (208px), insets (28px), and relationships flow after the guide in a two-column block before the archive. At (860px) and below, the rail is replaced by a mobile brand and native disclosure navigation; insets become (24px), and the search field occupies a full header row. At (540px) and below, insets become (20px), stages, topics and relationship notes become single-column, and archive spacing tightens.

The header remains sticky. Anchor scroll padding is (96px), increasing to (152px) when the mobile header wraps. The reading content, inline search region and footer share the same workspace. These are measured homepage arrangements, not universal page templates.

## Elevation & Depth

The interface uses no box shadows. White controls and the data panel sit on cool paper; a blue-gray rail and fine borders establish regions. Navigation changes tone on hover and at the current location. Focus is an explicit teal outline (2px), normally offset (4px); the search form uses a (2px) offset.

**The Flat Reading Rule.** Separate content with fine rules, whitespace and paper tones; the implemented components use no box shadows.

Color and background transitions last (160ms), with `ease-out`, only when reduced motion is not requested. There is no decorative motion grammar.

## Shapes

Most content consists of square document rows with a top rule. Navigation uses the small navigation radius, search and the more-results button use the control radius, and the data panel uses the larger panel radius. Borders are generally (1px). There is no recurring pill or chip component.

## Components

### Buttons

Compact text actions sit beside reading controls. Clear is transparent, teal, padded by the text-button token and has a minimum height (40px). Retry is an underlined transparent text action with padding (4px 8px). The more-results button uses a white fill, control stroke and control radius. Buttons retain visible focus; no custom active or disabled visual variant is established.

### Inputs / Fields

The search form is a white bordered control with an inline SVG magnifier. Its input is borderless, (42px) high and (16px) in type size; the form carries the focus outline. The clear button appears when the input has content. Before JavaScript initializes, the input is disabled with explanatory placeholder text; a noscript message preserves access to the archive.

### Navigation

The rail uses compact links with a tonal wash for hover and `aria-current`. Topic links are quieter and underline on hover. On narrow screens, native details/summary exposes a wrapping link list. The skip link appears on focus. Ordinary links use a (1px) underline with (4px) offset.

### Article Reader

First visits use the same cool paper, blue-gray rail, blue text, teal links and selected wash as the homepage. Pai's Blog appears above the article contents; a persistent Home link remains accessible when the contents are closed. Long chapter labels retain a wider (280px) rail, and long-form prose retains (17px/1.95) on desktop and (16px/1.95) on mobile. The desktop toolbar shares the homepage's (80px) height; mobile uses a compact (60px) toolbar. Controls use (6px) radii and contents links (4px), without shadows. Headings use the same bundled face and (32/25/20px) hierarchy, with existing mobile reductions.

The optional dark theme preserves an explicit saved choice. Notes, summaries, citations, tables and code use theme-aware surfaces; code keywords, strings and comments have readable colors in both modes. Paper figures, authored SVGs and interactive diagrams retain their original graphics palettes. `build-reader.py` embeds the shared theme and licensed WOFF2 font as a data URL, preserving standalone HTML without runtime font/CSS dependencies.

### Reading Stages and Relationship Notes

Reading stages use a top divider and a label/content pair rather than a card shell. Topic explanations sit directly under their links. Relationship notes use a slightly stronger top rule and muted body text. In the current homepage DOM, the margin follows the guide immediately, allowing it to precede the archive after the desktop columns collapse.

### Archive Entries

Entries are unboxed rows with a fine top rule, heading link, secondary summary and muted metadata. Summaries wrap long terms rather than overflowing. Related links remain ordinary inline links.

### Search Results and Feedback

Search replaces the reading content inline when the trimmed query is non-empty; it is not a modal. Results reuse archive-like divided rows, with highlighted title/snippet matches. The local index is fetched lazily on focus or query, covers 16 articles and is approximately 1.2 MB. Until it arrives, title and summary matches remain available. A failed or timed-out fetch (8 seconds) keeps that fallback and exposes Retry. The no-match state gives a shorter-keyword suggestion; punctuation-only queries request Chinese, English or numeric keywords. A polite live status announces result counts.

Input updates are debounced (120ms) and respect IME composition. `/` outside editing or Ctrl/Cmd+K focuses search; Escape in the input clears the query. Submit focuses the first result. Initially up to 12 article results appear; the more-results action reveals the remainder and focuses the first newly shown result. Clear restores the guide and input focus. The `q` URL parameter preserves the current query; section navigation clears it.

### Data Panel

The white, rounded, lightly bordered panel contains real profile-view context and an SVG chart. Fine chart gridlines and teal marks carry the data. Empty or unavailable snapshots retain the explanatory placeholder. This panel is the exception to the otherwise unboxed article rows.

## Do's and Don'ts

### Do:

- Do use the bundled heading face and retain readable platform fallbacks for glyphs outside the subset.
- Do preserve the distinction between ink, secondary prose and muted supporting text.
- Do keep navigation, fields and buttons keyboard reachable with visible teal focus.
- Do retain semantic source order when columns collapse; relationship notes follow the guide before the archive on this homepage.
- Do present search loading, fallback, no-match and retry messages inside the main content.

### Don't:

- Don't add decorative eyebrows above normal headings.
- Don't turn document rows into shadowed promotional cards.
- Don't treat the homepage reading sequence or Read mode as a requirement for every product surface.
- Don't assume the bundled heading subset covers newly added Chinese copy; extend its licensed subset or allow the declared fallbacks.
