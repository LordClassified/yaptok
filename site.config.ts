// The owner's details for the share cards and (in a later session) the public
// pages. Nothing here is secret: it all shows on the site.
//
// No imports on purpose, so `node --test` can load it directly.

export const siteConfig = {
  /** The site's name in titles and share cards. */
  siteName: "Yapit",
  /** One line about the site, for share cards and search results. */
  description: "A place to discover, share and enjoy short videos.",
  /** The source code. */
  sourceUrl: "https://github.com/LordClassified/yaptok",
} as const;

export type SiteConfig = typeof siteConfig;
