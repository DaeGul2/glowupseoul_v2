Geist / Geist Mono — self-hosted for proposal D (2026-10-19).

Why: loading them from Google Fonts made phones wait for two extra servers, so the
home intro's "Glow Up" showed up late; Google Fonts is also blocked in mainland China.

Source: Google Fonts (fonts.gstatic.com), variable fonts, latin + latin-ext subsets only.
  geist-v5-latin.woff2          Geist, weights 300–700, latin
  geist-v5-latin-ext.woff2      Geist, weights 300–700, latin-ext
  geist-mono-v6-latin.woff2     Geist Mono, weights 400–500, latin
  geist-mono-v6-latin-ext.woff2 Geist Mono, weights 400–500, latin-ext
The @font-face rules (with Google's unicode ranges) are at the top of ../../d/style.css.
File names carry the Google Fonts version, so the server can cache them for a year
(server/routes/blogV3.js); a new version gets a new file name.

License: SIL Open Font License 1.1 — Copyright The Geist Project Authors
(https://github.com/vercel/geist-font). Free to use, embed and redistribute; the
copyright and license notice are also embedded in each font file. https://openfontlicense.org
