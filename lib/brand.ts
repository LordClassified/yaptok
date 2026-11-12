/**
 * The YapTok mark, in one place so the app shell, the favicon and the sign in
 * card all draw the same thing.
 *
 * The mark is an orange speech bubble (a "yap") with three white sound bars
 * inside it: talk, on video. Orange is the family color it shares with
 * Yapin'. The accent is a golden yellow, used sparingly (a liked heart, a
 * saved bookmark, the unread dot). It is our own drawing: no play button,
 * no musical note, and nothing borrowed from another app.
 *
 * No imports on purpose, so `node --test` and scripts/favicon.mjs can load it.
 */

/** The mark is drawn on a 24 by 24 grid. */
export const MARK_VIEWBOX = "0 0 24 24";

/** The speech bubble with its tail at the bottom left, filled with the brand orange. */
export const MARK_BUBBLE =
  "M6.5 3h11A4.5 4.5 0 0 1 22 7.5v6a4.5 4.5 0 0 1-4.5 4.5h-6.2l-3.9 3.2c-.6.5-1.4.1-1.4-.7V17.9A4.5 4.5 0 0 1 2 13.5v-6A4.5 4.5 0 0 1 6.5 3z";

/** The three sound bars inside the bubble, stroked in white. */
export const MARK_BARS = "M8 9.6v1.8M12 7.6v5.8M16 8.9v3.2";

/** Brand colors, also set as --mark, --brand, --brand-strong and --accent in app/globals.css. */
export const BRAND = {
  /** The mark and highlights. */
  orange: "#f97316",
  /** Links and the wordmark on a dark page. */
  orangeLight: "#fb923c",
  /** Buttons: dark enough for white text to read on it. */
  orangeDeep: "#c2410c",
  /** A liked heart, a saved bookmark, the unread dot. */
  gold: "#fbbf24",
  /** The app's dark page color. */
  ink: "#0f0d0c",
} as const;

export const SITE_NAME = "YapTok";

/** The mark as a standalone SVG string (favicon, press use). */
export function markSvg(size = 24, color: string = BRAND.orange): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${MARK_VIEWBOX}">` +
    `<path d="${MARK_BUBBLE}" fill="${color}"/>` +
    `<path d="${MARK_BARS}" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>` +
    `</svg>`
  );
}

/** The mark and the two tone wordmark ("Yap" in orange, "Tok" in near black). */
export function logoSvg(): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="560" height="120" viewBox="0 0 140 30">` +
    `<g transform="translate(1 2) scale(1.08)"><path d="${MARK_BUBBLE}" fill="${BRAND.orange}"/>` +
    `<path d="${MARK_BARS}" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/></g>` +
    `<text x="30" y="21" font-family="Roboto, Arial, sans-serif" font-size="20" font-weight="700" letter-spacing="-0.6">` +
    `<tspan fill="${BRAND.orangeDeep}">Yap</tspan><tspan fill="#1c1410">Tok</tspan></text>` +
    `</svg>`
  );
}
