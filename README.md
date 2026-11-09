# TypePulse

A free, no-sign-up typing test. Choose a timed run, a quick word row, a single word,
a full paragraph, or a fresh quote fetched from the web. You get live
WPM, accuracy and personal records — all saved locally in the browser.

## Run it

No build step or dependencies. Open `index.html` directly, or serve the folder:

```powershell
npx serve .
```

Then visit the printed local URL.

## Features

- 15 / 30 / 60 / 120 second timed tests
- Row mode: a short single-row sprint that ends when you finish the row
- Word mode: choose preset words (10/20/30) or enter custom count via "Custom" button
- Paragraph mode: longer built-in passages with punctuation and capital letters
- Online mode: a random quote fetched from the web, with an offline paragraph fallback
- Timed mode: choose preset duration (15/30/60/120s) or enter custom seconds via "Custom" button
- Custom number selector for words (Word mode) and seconds (Timed mode) on the right side
- Live WPM and accuracy while typing, plus a progress bar in untimed modes
- Personal bests per timed duration and per practice mode, test count and average accuracy in `localStorage`
- Light and dark themes (follows the system preference on first visit)
- Animated CSS-only 3D scene with a perspective grid, floating keycaps and glow rings
- Transparent glass panels with backdrop blur over the 3D background
- Keyboard-friendly: `Esc` restarts the current test
- Responsive layout with a mobile keyboard fallback
- Reduced-motion support and zero accounts, ads or tracking

## Files

- `index.html` — landing page structure and content
- `practice.html` — standalone typing practice page (opens from "Start typing")
- `practice.js` — typing engine for the practice page
- `style.css` — theme variables, layout and responsive styles
- `script.js` — landing page test generation, typing engine, timer and storage
