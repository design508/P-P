MISSING FONT FILES
==================
Six Aquatail weights could not be exported from the source store:

  pp-aquatail-black.ttf
  pp-aquatail-bold.ttf
  pp-aquatail-extrabold.ttf
  pp-aquatail-medium.ttf
  pp-aquatail-regular.ttf
  pp-aquatail-semibold.ttf

Shopify serves theme assets over 256 KB as signed Google Storage URLs, which the
export environment could not reach. The three Futura files ARE included.

To complete the theme:
  Source store admin -> Online Store -> Themes -> "P&P 8/9" -> ... -> Export theme
  Shopify emails a ZIP containing the fonts. Copy the six .ttf files into
  this theme's assets/ folder (Edit code -> Assets -> Add a new asset).

Until then, headings fall back to Playfair Display (set in config/settings_schema.json
as heading_font). Body text falls back to Assistant.
