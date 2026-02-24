# Font Considerations — Coffee@CU Display Heading

Replacing Cormorant Garamond (too thin, especially in italic at large sizes).
Goal: warm serif, thicker stroke, readable, college/editorial feel.

---

## Currently Active

### Fraunces
- **Character**: Optical-size variable font — letterforms are specifically tuned to look great at large display sizes. Warm, literary, slightly artisanal. Has personality without being gimmicky.
- **Feel**: Independent bookstore meets university press. Less generic than Playfair.
- **Weights**: 100–900, normal + italic. Variable axes: optical size, softness, wonky.
- **Google Fonts**: `Fraunces`
- **Best for**: Hero headlines, section titles where you want warmth and distinctiveness.

---

## Tried

### Playfair Display
- **Character**: The de facto editorial/prestige serif on the web. Thick/thin stroke contrast, rich ball terminals, strong italic. Beautiful at large sizes.
- **Feel**: Alumni magazine, Atlantic Monthly, university commencement program.
- **Weights**: 400–900, normal + italic.
- **Google Fonts**: `Playfair_Display`
- **Note**: Slightly overused — every "prestige" site uses it — but for good reason.

---

## Shortlist (not yet tried)

### Source Serif 4
- **Character**: Professional screen serif designed for readability. More neutral than others but very substantial. Clean, modern-academic.
- **Feel**: Digital-first editorial — think scientific journal meets magazine.
- **Weights**: 200–900 (variable), normal + italic.
- **Google Fonts**: `Source_Serif_4`
- **Best for**: Projects where readability at body sizes matters as much as display.

### Libre Baskerville
- **Character**: Classical Baskerville revival, optimized for screens. Strong serifs, consistent stroke weight, very authoritative.
- **Feel**: University press, textbook, "serious" institution.
- **Weights**: 400, 700 (normal + italic). Limited weight range.
- **Google Fonts**: `Libre_Baskerville`
- **Best for**: When you want the most "academic press" traditional feel.

### DM Serif Display
- **Character**: Made by Colophon Foundry for Google. Clean, modern editorial serif with good weight. Newer, less traditional.
- **Feel**: Contemporary media brand with a serif sensibility — NYT Wirecutter, not Columbia Spectator.
- **Weights**: 400 only (normal + italic). No weight variation.
- **Google Fonts**: `DM_Serif_Display`
- **Best for**: Landing pages that want editorial without looking old-school.

---

## Existing Type System

| Role | Font | Variable |
|---|---|---|
| Display / Headings | *(swappable — see above)* | `--font-cormorant` |
| Body copy | Lora | `--font-lora` |
| Labels / mono | Courier Prime | `--font-courier` |

> The display font is loaded via `--font-cormorant` throughout the codebase. Swap it in `src/app/layout.tsx` only.
