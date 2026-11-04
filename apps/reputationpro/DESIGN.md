---
name: ReputationPro
description: Clinic correspondence folio for patient feedback and owner follow-up.
colors:
  ink: "#183c34"
  green: "#214e43"
  green-deep: "#173e34"
  muted: "#60716a"
  paper: "#fafbf7"
  line: "#dce3da"
  lime: "#d5ed9c"
  white: "#fff"
  placeholder: "#647263"
  star-empty: "#718269"
  star-selected: "#b48422"
typography:
  display:
    fontFamily: "Manrope, sans-serif"
    fontSize: "clamp(44px,4.65vw,64px)"
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: "-.04em"
  headline:
    fontFamily: "Manrope, sans-serif"
    fontSize: "34px"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-.035em"
  title:
    fontFamily: "Manrope, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.6
    letterSpacing: "-.025em"
  body:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.6
  button:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.4
  statistic:
    fontFamily: "Manrope"
    fontSize: "33px"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "-.035em"
rounded:
  tag: "4px"
  field: "7px"
  control: "8px"
  small-card: "10px"
  sheet: "12px"
  panel: "14px"
  circle: "50%"
spacing:
  "10": "10px"
  "12": "12px"
  "18": "18px"
  "20": "20px"
  "24": "24px"
  "40": "40px"
components:
  button-primary:
    backgroundColor: "{colors.green}"
    textColor: "{colors.white}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "15px 23px"
  button-primary-hover:
    backgroundColor: "#143a30"
  button-secondary:
    backgroundColor: "{colors.white}"
    textColor: "{colors.green}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "15px 23px"
  button-secondary-hover:
    backgroundColor: "#f0f4ec"
  button-lime:
    backgroundColor: "{colors.lime}"
    textColor: "#193e32"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "15px 23px"
  button-lime-hover:
    backgroundColor: "#e1f6b4"
  button-small:
    rounded: "{rounded.control}"
    padding: "9px 13px"
  input:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "12px 13px"
    width: "100%"
  status-new:
    backgroundColor: "#faf0d9"
    textColor: "#86601b"
    rounded: "{rounded.tag}"
    padding: "3px 8px"
  status-resolved:
    backgroundColor: "#eaf2e6"
    textColor: "#336847"
    rounded: "{rounded.tag}"
    padding: "3px 8px"
  dashboard-panel:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.panel}"
    padding: "24px"
  patient-sheet:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.panel}"
    padding: "34px 45px 28px"
  owner-navigation:
    backgroundColor: "{colors.green-deep}"
    textColor: "#d4dfd4"
    padding: "30px 23px"
    width: "246px"
  rating-choice:
    textColor: "{colors.star-empty}"
    rounded: "{rounded.field}"
    padding: "5px"
  rating-choice-selected:
    textColor: "{colors.star-selected}"
---

# Design System: ReputationPro

## Overview

**Creative North Star: "Clinic correspondence folio"**

Forest-green ink, lightly green paper, thin rules and inset white sheets give patient feedback the character of clear clinic correspondence. Manrope headings establish a calm hierarchy; DM Sans keeps forms and the owner's inbox practical and readable.

The system is restrained and task-oriented. Depth isolates a patient sheet; owner tools stay compact and mostly flat. Lithuanian copy and the speech-bubble/star mark carry the identity. This records the implemented code-led world, with no approved raster comp.

**Key Characteristics:**

- Green ink and pale paper with a lime action accent.
- White sheets, thin separators and gently curved controls.
- Clear type hierarchy and quiet secondary labels.
- Amber ratings, explicit status text and tabular data.

## Colors

The frontmatter contains the reused palette extracted from `src/app/globals.css`; component-specific state colors remain with their components.

### Primary

- **Forest Green (`green`):** primary actions, links and form accents.
- **Deep Forest (`green-deep`):** owner navigation and the pricing surface.
- **Light Lime (`lime`):** the action on a dark surface, selection highlight and unread badge.

### Secondary

- **Rating Amber (`star-selected`):** selected patient rating choices. The preview, inbox stars and average use their existing local amber values; they are not aliases of this token.

### Neutral

- **Green Ink (`ink`):** primary text; **Muted Green (`muted`):** supporting text.
- **Paper (`paper`):** page ground; **White (`white`):** form and content surfaces; **Rule (`line`):** panel edges and dividers.
- **Placeholder (`placeholder`):** empty text-field hints, at full opacity.
- **Empty Star (`star-empty`):** both unselected patient choices and unfilled inbox stars.

**The State Has Words Rule.** Pair rating and status colors with the existing labels, numeric values or selected-state semantics.

## Typography

**Display Font:** Manrope, sans-serif. **Body Font:** DM Sans, sans-serif. Fonts are bundled through `@fontsource` in `src/app/layout.tsx`: Manrope 400/600/700/800 and DM Sans 400/500/600. There is no separate label or mono family.

Frontmatter roles capture the base hierarchy, not a new modular scale. Headings balance text; body text uses the normal flow. Hero copy is constrained to (420px), with (17px/1.75) text on desktop and (15px) at smaller sizes. Common operational copy is (11–14px); tertiary labels reach (8–10px). Do not promote those tertiary sizes to patient form body text.

| Element | Desktop | At ≤1180px | At ≤960px | At ≤700px |
| --- | --- | --- | --- | --- |
| Landing hero heading | Frontmatter display | 49px | 42px | clamp(42px,9vw,60px) |
| Workflow/owner heading | Frontmatter headline | same | 29px | 29px |
| Owner dashboard heading | 31px | same | 26px | 27px |
| Patient heading | 32px, -.035em | same | same | 29px |
| Checkout heading | 47px | same | 38px | 39px |
| Pricing figure | 78px/1.1, 600 | same | 62px | 72px |
| Statistic figure | Frontmatter statistic | same | same | 30px |

Panel headings use (17px) with (-.025em) tracking; patient and checkout headings inherit the h1 weight and line height. Statistic figures and distribution rows use tabular numerals.

## Layout

The public wrapper is `min(1180px,calc(100% - 80px))`; its total gutter becomes (48px) at ≤960px and (40px) at ≤700px. Public sections use (85px) vertical padding, then (65px), then (50px). These are observed sizes, not an imposed spacing scale.

- **Landing:** two-column hero (1.05fr/1fr, 76px gap), reduced to (38px) at ≤1180px and (30px) at ≤960px. At ≤700px it becomes one column with (40px) gap; the inset preview caps at (480px). Steps change from three columns to one. Pricing, FAQ and owner preview stack at the same mobile breakpoint. At ≥1600px hero vertical padding becomes (100px).
- **Owner workspace:** fixed sidebar (246px), then (218px) at ≤1180px and (190px) at ≤960px. Content caps at (1380px). Inbox plus rail use `minmax(0,1fr) 285px`, then a (255px) rail. At ≤960px the inbox spans one column, rail panels sit in two columns, and four stats become two. At ≤700px navigation moves into the document header as horizontally scrollable links, content margins reset, and the rail stacks.
- **Forms:** paired fields use equal columns with (18px) gap and stack at ≤700px. Patient sheet caps at (560px), login at (440px), success at (520px); settings forms cap at (770px). Patient inset changes from (34px 45px 28px) to (28px 23px).
- **Checkout:** columns are 1fr/1.2fr with (90px) gap, then (50px), then (30px). At ≤700px they stack with (35px) gap. The form inset changes from (32px) to (24px) at ≤960px and (26px 21px) on mobile.

## Elevation & Depth

Most depth comes from tonal layering and one-pixel rules. Dashboard panels, buttons and pricing are flat at rest. The two shadows isolate white correspondence sheets:

- **Landing preview sheet:** `0 14px 30px -17px #173d3433`.
- **Patient sheet:** `0 20px 50px -25px #173d3420`.

**The Sheet Depth Rule.** Keep these shadows attached to sheet surfaces; use rules and pale grounds for workspace separation.

## Shapes

The frontmatter records the actual corner vocabulary: tags, fields, controls, small inset cards, preview sheets and large panels. Panels share the root `--radius`; avatars and success markers are circles. Borders are generally (1px). The brand uses a rounded speech-bubble container with a small inset star. Lucide line icons stay compact; icons accompany readable labels on major actions.

## Components

- **Buttons:** solid green, white bordered and lime variants share the frontmatter base inset, (50px) minimum height and (10px) icon gap. Small actions use (12px) text, (37px) minimum height and (7px) gap. Hover lifts enabled buttons by (1px); background, color and transform transition over (.18s ease). Disabled buttons have (.6) opacity and a wait cursor. No custom active press style is implemented.
- **Fields:** white with (1px solid #c8d4c9) edges, (14px/1.5) text and frontmatter field corners. Focus changes the border to (#6c8d64). Labels use the label role; optional/helper copy is smaller and muted. Textareas resize vertically. Errors use (#9b322c) text on (#fff0ec), (6px) corners and (10px 12px) inset.
- **Focus:** all focus-visible elements receive a (3px solid #6b8b3e) outline with (4px) offset. Preserve the visible skip link and field labels.
- **Status tags:** compact (10px, 600) labels use the new/resolved frontmatter variants. Inbox filters use a (2px) green active underline plus weight (600); filter state is also exposed through `aria-pressed`.
- **Owner navigation:** default muted pale text; hovered and active rows use (#315b4b) with (#f5f8ec) text. Rows have field corners and (13px 12px) inset. Mobile rows use (10px) type, (10px) inset and (14px) icons. The current section styling is an implemented static overview state.
- **Patient rating:** five outlined star buttons, each at least (47px × 54px), with (43px) icons and (7px) gap. Hover adds (#f8f5e9) behind the choice; selection fills stars with current color. On mobile, minimum width is (43px), icons (38px), inset (3px) and gap (4px); minimum height remains (54px).
- **Inbox and sharing:** feedback rows are divided by rules, preserve entered line breaks, and wrap long text. QR display is (180px) square and (200px) on mobile. Loopback URLs show the local-computer guidance; other hostnames show the registration-desk guidance. Keep those contexts visibly distinct.
- **Motion:** the landing sheet enters once over (.7s) using `cubic-bezier(.16,1,.3,1)`, translating from (15px) while its clipped bottom opens. Disclosure chevrons rotate over (.2s); loading icons spin at (1s linear infinite). Reduced motion switches scrolling to auto, forces animations/transitions to (.01ms), and limits animations to one iteration.

## Do's and Don'ts

### Do:

- **Do** keep Manrope hierarchy, DM Sans controls and the existing green/paper palette together.
- **Do** use white sheets and thin rules to separate correspondence and owner tasks.
- **Do** preserve visible focus, field labels, selected-state semantics and written statuses.
- **Do** inherit the implemented breakpoints and distinguish patient text from tertiary owner labels.

### Don't:

- **Don't** add decorative imagery, glow or unrelated motifs to this code-led visual world.
- **Don't** use color alone to communicate rating, error or resolution state.
- **Don't** replace the existing local amber variants with an unused palette declaration without an intentional source change.
- **Don't** describe this design record as runtime, accessibility or policy approval.
