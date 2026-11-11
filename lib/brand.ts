/**
 * The YapTok mark, in one place so the app shell, the favicon and the sign in
 * card all draw the same thing.
 *
 * The mark is a violet speech bubble (a "yap") with three white sound bars
 * inside it: talk, on video. The accent is a warm amber, used sparingly (the
 * like heart and the upload button). It is our own drawing: no play button,
 * no musical note, and nothing borrowed from another app.
 *
 * No imports on purpose, so `node --test` and scripts/favicon.mjs can load it.
 */

/** The mark is drawn on a 24 by 24 grid. */
export const MARK_VIEWBOX = "0 0 24 24";

/** The speech bubble with its tail at the bottom left, filled with the brand violet. */
export const MARK_BUBBLE =
  "M6.5 3h11A4.5 4.5 0 0 1 22 7.5v6a4.5 4.5 0 0 1-4.5 4.5h-6.2l-3.9 3.2c-.6.5-1.4.1-1.4-.7V17.9A4.5 4.5 0 0 1 2 13.5v-6A4.5 4.5 0 0 1 6.5 3z";

/** The three sound bars inside the bubble, stroked in white. */
export const MARK_BARS = "M8 9.6v1.8M12 7.6v5.8M16 8.9v3.2";

/** Brand colors, also set as --brand, --brand-strong and --accent in app/globals.css. */
export const BRAND = {
  /** The mark and primary buttons. */
  violet: "#7c3aed",
  /** The mark on a dark page, links on dark. */
  violetLight: "#a78bfa",
  /** Hover and pressed states. */
  violetDeep: "#6d28d9",
  /** The like heart and small highlights. */
  amber: "#f59e0b",
  /** The app's dark page color. */
  ink: "#0e0b14",
} as const;

export const SITE_NAME = "YapTok";

/** The mark as a standalone SVG string (favicon, press use). */
export function markSvg(size = 24, color: string = BRAND.violet): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${MARK_VIEWBOX}">` +
    `<path d="${MARK_BUBBLE}" fill="${color}"/>` +
    `<path d="${MARK_BARS}" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>` +
    `</svg>`
  );
}

/** The mark and the two tone wordmark ("Yap" in violet, "Tok" in near black). */
export function logoSvg(): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="560" height="120" viewBox="0 0 140 30">` +
    `<g transform="translate(1 2) scale(1.08)"><path d="${MARK_BUBBLE}" fill="${BRAND.violet}"/>` +
    `<path d="${MARK_BARS}" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/></g>` +
    `<text x="30" y="21" font-family="Roboto, Arial, sans-serif" font-size="20" font-weight="700" letter-spacing="-0.6">` +
    `<tspan fill="${BRAND.violet}">Yap</tspan><tspan fill="#16121f">Tok</tspan></text>` +
    `</svg>`
  );
}
