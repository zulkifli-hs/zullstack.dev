# Brand assets

| File | Used by |
|---|---|
| `horizontal_rectangle-two_tone_logo-white_text.png` | `<Logo>` in dark mode, and both OG social cards |
| `horizontal_rectangle-two_tone_logo-black_text.png` | `<Logo>` in light mode |
| `square-two_tone_logo-white_text.png` | Reserved for social profile avatars on dark |
| `square-two_tone_logo-black_text.png` | Reserved for social profile avatars on light |
| `square-two_tone_logo-no_text.png` | Reserved — mark alone, where a wordmark would be too small to read |

Favicons live in [`../favicon/`](../favicon) and are declared through
`ICONS` in [`src/lib/brand.ts`](../../src/lib/brand.ts).

## Picking a variant

The `white_text` and `black_text` files differ **only** in the wordmark colour;
the flask is identical in both. The background is transparent, so choosing the
wrong one makes the wordmark invisible rather than merely low-contrast:

- dark background → `white_text`
- light background → `black_text`
