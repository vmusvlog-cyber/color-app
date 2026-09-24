# Color Palette App — Project Spec

## How to work with the owner
The owner is a complete beginner with no coding experience.
- Always explain what you are doing in simple Arabic, one step at a time.
- Ask before any big decision.
- Keep the code simple and well commented.
- Build phase by phase and stop after each phase so the owner can test.

## Tech decisions (agreed)
- **Stack:** plain HTML + CSS + JavaScript. No build step, no frameworks, no npm needed.
  Open `index.html` directly in a browser to run it.
- **Deploy (free):** Netlify (drag the folder onto app.netlify.com/drop) or GitHub Pages.
- **Scripts:** classic `<script>` tags (not ES modules) so the app also works when opened
  straight from a file (`file://`).
- **Translations:** ALL Arabic and English text lives in `js/i18n.js`. To add a language,
  copy one language block and translate it. Color names and palette names live there too.
- **Routing:** the URL hash (e.g. `#/result/beginner?c=F7F7F5-2B2D42-3A86FF`), so the
  browser Back button works and a palette can be shared by copying the link.
- **Fonts:** Google Fonts — Tajawal (Arabic) and Inter (English) for the UI; font pairings
  for results are loaded on demand from `js/fonts.js`.
- **Images:** mood and style pictures are drawn in code (SVG), not photos (owner agreed).

## File structure
```
index.html        The single page; loads the CSS and scripts
css/style.css     All styling (white minimal UI, responsive, RTL-aware)
js/i18n.js        All UI text in Arabic + English, color names, palette names
js/colors.js      Color math: HEX/HSL, color names, random & regenerated colors
js/palettes.js    Audiences, the five styles, curated ready palettes
js/drag.js        Drag-and-drop (mouse + touch) used by free picking
js/wheel.js       The color wheel drawn on a canvas
js/generator.js   Palette generation (quiz answers / user colors), style detection,
                  color families & meanings, competitor colors, color-name lookup
js/fonts.js       Font pairings per style (Google Fonts) and the font loader
js/scenes.js      SVG drawings for the mood and style choices (no photos needed)
js/describe.js    "Describe your idea" screens: choice, quiz, my colors, 3 options
js/result.js      Result screen: Polaroids, why, competitors, fonts, previews
js/app.js         State, home/methods/ready/free screens, navigation (router)
```

## Phase status
- [x] Phase 1: Home, four sections, ready palettes, Polaroid cards, free picking with drag/delete.
- [x] Phase 2: Quiz (5 questions, drawn images), "has colors" input (name/HEX/wheel),
      3 palettes, font pairings, previews. Also added (owner agreed): "Why these colors?"
      and "stand out from competitors".
- [ ] Phase 3
- [ ] Phase 4
- [ ] Phase 5
- [ ] Phase 6

---

## Product
A free, bilingual (Arabic + English, full RTL support) web app that helps people with no
design experience choose harmonious color palettes for text, images and brand identity.
Target feeling: "That was easy, I needed no expertise." Fewest steps possible, tap-to-choose.
UI: clean minimal white interface; the colors are the hero. Responsive (phone, iPad, desktop).

## Home
Four equal cards laid out horizontally: Color beginner, Business owners, Content creators,
Identity that fits you. Each opens the same four start methods (below), tuned to that audience.

## Start methods
1. Upload image: extract dominant colors in the browser (canvas + k-means), detect the style,
   explain why the colors work, offer: keep these colors OR adjusted suggestions.
2. Describe your idea: first ask "Beginner, or do you have colors in mind?"
   - Has colors: accept HEX, a color wheel, or a plain color name (e.g. "olive green"),
     then complete a harmonious palette around them.
   - Beginner: 5 questions (3 text choices: industry, audience, where colors will be used;
     2 visual choices: a mood image, and one of 5 styles shown as images). Output 3 palettes.
3. Ready palettes: curated palettes by style, in 3-color or 5-color sets.
4. Free picking: drag colors from a refreshing suggestion strip, a full color wheel, or ready
   palettes into a palette; reorder by drag; tap a color then "Delete" to remove.

## Five styles
Minimal modern, Luxury (black/gold/navy/burgundy), Bold (strong contrast),
Earthy (beige/olive/brown/terracotta), Retro/vintage (warm faded tones).

## Result screen
- Each color is a Polaroid-style card: white frame, wider bottom showing color name + HEX.
- Show the 60-30-10 ratio visually on the cards.
- "Regenerate" button on each color/background.
- Optional "Why these colors?" button with meaning and feeling.
- At least 3 font pairings (headings + body, Arabic and English Google Fonts) with short advice.
- Previews: social post, business card, logo (project name in chosen font/color), website header.
- Toggles: gradients section, dark mode version, "for print" (print-safe adjustment).
- Small optional culture icon: pick audience country to adjust suggestions.
- Suggest colors that stand out from common competitor colors in the chosen industry.
- Save palettes and share by link.

## Download
Free PNG and PDF of the cards, user's choice. Before download: 3 short mandatory
tap-to-answer feedback questions about the experience and problems faced.
Simple sign-up required only at download time.

## Community
Public gallery of shared palettes, filterable by style, industry and most popular.

## Not in v1
Text contrast check, image links, Canva/Figma/Adobe integrations.

## Build plan (do these in order, stop after each phase so the owner can test)
Phase 1: Home, four sections, ready palettes, Polaroid cards, free picking with drag/delete.
Phase 2: Beginner questionnaire and "has colors" input, 3-palette results, fonts, previews.
Phase 3: Image upload and color extraction, toggles (gradients, dark, print), culture icon.
Phase 4: PNG/PDF download with feedback questions; save and share (simplified, local first).
Phase 5: Community gallery and accounts (tell the owner what server/database is needed and the cost).
Phase 6 (optional, later): connect the Claude API for real AI explanations.
