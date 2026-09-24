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
- **Backend (Phase 5, owner agreed):** Supabase (free tier) with magic-link email sign-in.
  supabase-js is loaded from jsDelivr (pinned). If keys are empty or the library fails to
  load, the app runs in local-only mode. Hosting: Netlify (https://loquacious-fairy-3a37e7.netlify.app)
  deploys the `main` branch automatically; the owner agreed to keep `main` updated with the app.
  The claude.ai preview cannot reach Supabase (its CSP blocks it), so test cloud features
  on Netlify.

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
js/refine.js      "Refine the result" panel: feeling, warm/cool, harmony, saturation,
                  brightness, contrast, technique row (logic + panel UI)
js/techniques.js  The owner's 10 marketing techniques: original colors (never changed),
                  English prompt wording, small CSS demo per technique
js/fonts.js       Font pairings per style (Google Fonts) and the font loader
js/describe.js    Section questions screen (#/quiz/<section>), my colors, 3 options
js/sections.js    The 7 sections and their 1–2 questions (owner's lists); each answer maps
                  to feel/mood/style/ind/temp/contrast/preview kind (sectionProfile)
js/image.js       "Upload image": in-browser k-means color extraction, adjusted options
js/variants.js    Dark version, print-safe version + CMYK, gradients, culture notes/adjust
js/storage.js     localStorage helpers: saved palettes, simple account, feedback answers
js/download.js    Download window (sign-up → 3 feedback questions → PNG/PDF), canvas
                  drawing of the cards, and a tiny PDF writer (no external library)
js/config.js      Supabase URL + public anon key (empty = local-only mode)
js/cloud.js       All Supabase calls: magic-link auth, palettes, gallery, likes, feedback
js/gallery.js     Gallery screen (#/gallery, filters + likes), sign-in modal, My palettes
js/prompts.js     Ready English image prompts (4 per place) with the palette's HEX codes,
                  for ChatGPT/Gemini; Unsplash search words. (English-only by owner decision,
                  so these templates live here, not in i18n.js)
js/unsplash.js    Unsplash: search links (no key) and in-app photos + credits (with key)
js/result.js      Result screen: Polaroids, why, competitors, fonts, previews
js/app.js         State, home/methods/ready/free screens, navigation (router), startApp
supabase/schema.sql  Tables + Row Level Security (run once in Supabase SQL Editor)
SETUP-SUPABASE.md    Owner's Arabic step-by-step guide: Supabase + Netlify + keys
NEXT-STEPS.md        Saved list of agreed next options (email, name, testing, Phase 6, Google)
```

## Phase status
- [x] Phase 1: Home, four sections, ready palettes, Polaroid cards, free picking with drag/delete.
- [x] Phase 2: Quiz (5 questions, drawn images), "has colors" input (name/HEX/wheel),
      3 palettes, font pairings, previews. Also added (owner agreed): "Why these colors?"
      and "stand out from competitors".
- [x] Phase 3: Image upload + k-means extraction (keep or adjusted suggestions), toggles
      (gradients, dark version, for print with CMYK), culture icon (6 regions, notes + adjust).
- [x] Phase 4: Download PNG/PDF (own PDF writer, works offline), sign-up + 3 feedback
      questions asked once per device, Save to "My palettes" (#/saved), Share link.
      Account, feedback and saved palettes are stored in localStorage only for now;
      Phase 5 moves them to a real server/database.
- [x] Phase 5: Public gallery (filters: style, field; sort: newest/most liked; likes),
      publish to gallery, account palettes (local ones migrate on first sign-in), feedback
      sent to the `feedback` table (owner reads `feedback_readable`). Schema + RLS tested on
      local PostgreSQL; app tested against a mocked Supabase API with the real supabase-js.
- [x] Extra (owner's 10 answers): "🎯 Refine the result" panel, always open, on the quiz
      options, "I have colors", image "suggest adjustments" and ready palettes. Options (each
      starts at Auto): feeling (11: trust, pro, calm, energy, excite, warm, luxury, creative,
      joy, nature, health), warm/cool, harmony (complementary/analogous/triadic/mono — when
      chosen, all 3 palettes use it), saturation, brightness, contrast. Quiz has a 6th
      question "feeling" (4th in order, with "choose for me"); mood images kept (feeling sets
      hue, mood sets intensity). User's own colors are never changed. Brand roles: primary,
      secondary, accent, neutral, support. Labels: simple word + small hint.
- [x] Extra: result cards have previous/next arrows with per-color history (2/3 counter).
- [x] Extra (owner's answers): quiz questions 2 and 3 depend on the field (FIELD_QUESTIONS in
      describe.js); "Homes, decor & places" asks which place (apartment, rooms, office,
      restaurant, café, shop, facade) and where (walls, furniture, floors, accessories).
      Result previews: "👁 Where do you want to see your colors?" picker with 8 previews
      (logo, social, room/facade, web, app, card, packaging, menu); only the chosen one shows,
      auto-picked from the answers.
- [x] Redesign Part A done (colors).
- [x] Redesign Part B done (prompts + Unsplash). Drawn previews removed. UNSPLASH_ACCESS_KEY in
      config.js is empty until the owner creates one (see SETUP-SUPABASE.md); without it the
      quiz keeps its drawings and the result shows Unsplash/Pinterest search buttons.
- [ ] Redesign (owner's 20 answers, customers' feedback "colors too dark, no strength"):
      Part A — colors: background always light (only Luxury stays dark, or user picks dark);
      remove all 60-30-10 percentages; palette size 3/4/5 chosen by user (default 5); result
      shown as a big full-width color strip (no Polaroids); warm/cool makes ALL colors warm/cool
      incl. neutrals, via a fixed 🔥/❄️ button in the top bar usable anytime; default strength
      follows mood & style but second color is no longer near-black; conflicting choices are
      prevented (warm hides cool feelings and vice versa).
      Part B — images: remove primitive drawings; each preview place gets 3–4 ready English
      prompts (with the palette's HEX codes) to copy into ChatGPT/Gemini, with one Arabic line
      explaining it, plus Unsplash inspiration (search button now; in-app photos once the owner
      gives an Unsplash key; quiz mood/style photos also need that key).
      Part C DONE — the owner's 10 marketing techniques: a "Technique" row (last) in the Refine
      panel; choosing one shows a card (CSS demo, its ORIGINAL 3 colors, short explanation,
      "More" = marketing idea + how to use, "Use this technique's colors" → result with
      `&tech=<id>`). On the result: a technique note + More; warm/cool never changes its colors;
      prompts add "Apply the <name> marketing technique: ...". Texts in i18n 'tech.*'.
- [x] Extra (owner's 10 answers): home screen ONLY got new colors (every other screen stays
      white and calm so users focus on their palette). Cream #F3E8CC background, cream top bar
      with forest-green outlined buttons, rounded fonts (Baloo Bhaijaan 2 / Fredoka), title words
      each in a different color (not yellow/cream, unreadable on cream), 6-color strip, cards
      without icons in a bento layout of different sizes: beginner #FFC926, business #18542A,
      creator #F96015, identity #D52518, plus a small kiwi #9ABC05 card that opens the gallery.
      Hover scales the card. Styles are scoped under `body.home-page` (set in render()).
- [x] Extra (owner's 5 answers): all other screens use off-white #FBF7EE (`--page`); headings are
      forest green (`--heading`) with a small 5-color bar under page titles and section titles;
      buttons/cards stay simple. ALL emoji removed app-wide (text only; kept only ← → ↗ ✕ ♥ as
      UI symbols); top bar shows words, wrapping to 2 lines on phones. Fonts moved from the result
      page into a "Fonts" button next to Download/Save/Share that opens a modal with 6 pairings
      (fontPairsFor: 3 for the style + 3 "also try" from other styles), each sample drawn in the
      palette's own colors; the chosen pairing feeds the prompts.
- [x] Extra (owner's 3 answers): "Upload image" is now a standalone feature: an "ارفع صورة"
      button in the top bar (all screens) → #/upload/<current audience>; removed from the start
      methods (now 3: describe, ready, free). The upload page has "Take a photo" (capture=
      environment) and "Choose from your device"; back goes home; strip shows HEX, no percentages.
      Home shows it as a big white full-width card FIRST in the bento ("Colors from a photo",
      6-color stripe, green button); the top-bar upload button is hidden on home only.
- [x] Restructure (owner's 7 answers): 7 sections on home — beginner (yellow), business (white),
      creator (orange), identity (red), photo (kiwi), expo "exhibitions & events" (green), decor
      "decor & places" (#EADBB4) — plus the "Colors from a photo" card; the small gallery card was
      removed (gallery stays in the top bar). Tapping a section opens ITS questions directly
      (#/quiz/<id>): beginner 1 question (10 color kinds; "one color → 3" opens My colors), all
      others 2 questions with all 10 options shown; then straight to the 3 palettes (no feeling/
      mood/style questions — ease first). Small links under the questions: I have colors, Ready,
      Free. The old methods/describe screens and the drawn scenes (scenes.js) were removed
      (#/methods and #/describe now open the questions). Answers set the Refine panel defaults and
      go into the prompts; new preview kinds video / photo / expo with 4 prompts each.
- [ ] Phase 6

---

## Product
A free, bilingual (Arabic + English, full RTL support) web app that helps people with no
design experience choose harmonious color palettes for text, images and brand identity.
Target feeling: "That was easy, I needed no expertise." Fewest steps possible, tap-to-choose.
UI: clean minimal white interface; the colors are the hero. Responsive (phone, iPad, desktop).

## Home
(Updated by the owner) A big "Colors from a photo" card, then 7 section cards in a colored bento:
Color beginner, Business owners, Content creators, Identity that fits you, Photography,
Exhibitions & events, Decor & places. Each opens its own 1–2 questions (js/sections.js).

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
- ~~Show the 60-30-10 ratio~~ (removed by the owner in the redesign: no percentages; colors
  shown as one big strip; background always light except Luxury).
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
