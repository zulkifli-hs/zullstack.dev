/**
 * Single source of truth for site navigation.
 *
 * The header and the mobile menu previously kept their own copies of this list,
 * which is exactly how a link ends up in one menu and not the other.
 */
/**
 * Literal union rather than `string`, so `t(item.key)` stays checked against
 * the message files — a typo here fails the build instead of rendering the
 * raw key in the navigation.
 */
export type NavKey =
  | "home"
  | "projects"
  | "experience"
  | "mentoring"
  | "articles"
  | "testimonials"
  | "openSource"
  | "resources"
  | "playground";

export type NavItem = {
  href: string;
  /** Key under the `nav` message namespace. */
  key: NavKey;
  /**
   * Hidden from every public menu, the home page and the sitemap, and marked
   * `noindex`. The route still resolves so it can be developed and previewed
   * directly — this hides the section, it does not delete it.
   */
  experimental?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/projects", key: "projects" },
  { href: "/experience", key: "experience" },
  { href: "/mentoring", key: "mentoring" },
  { href: "/articles", key: "articles" },
  { href: "/testimonials", key: "testimonials" },
  { href: "/open-source", key: "openSource" },
  // Still being designed — hidden from the public site until they are ready.
  { href: "/resources", key: "resources", experimental: true },
  { href: "/playground", key: "playground", experimental: true },
];

/** Menu items visible to visitors. */
export const PUBLIC_NAV = NAV_ITEMS.filter((item) => !item.experimental);

/** Compact set for the desktop header, which has limited horizontal room. */
export const HEADER_NAV = PUBLIC_NAV.filter(
  (item) => !["/testimonials", "/open-source"].includes(item.href),
);

/**
 * The mobile bottom tab bar.
 *
 * Five entries, deliberately, and deliberately *only* destinations. Apple's
 * guidance for the iOS 26 tab bar is explicit on both counts: three to five
 * stable tabs, and tab bars are for navigating between sections rather than for
 * actions or settings. So search, theme, language and the glass controls stay
 * in the top bar where they already live, and no "Tools" tab exists.
 *
 * There is no "More" tab either. Testimonials and Open Source are reachable
 * from their home-page sections — both already carry a "see all" link — and
 * from the footer, which is a better place for supporting evidence than a
 * catch-all tab.
 */
export const TAB_NAV: NavItem[] = [
  { href: "/", key: "home" },
  { href: "/projects", key: "projects" },
  { href: "/experience", key: "experience" },
  { href: "/mentoring", key: "mentoring" },
  { href: "/articles", key: "articles" },
];

export const EXPERIMENTAL_PATHS = NAV_ITEMS.filter((item) => item.experimental).map(
  (item) => item.href,
);

export function isExperimental(path: string) {
  return EXPERIMENTAL_PATHS.includes(path);
}

/**
 * Applied to experimental pages so they are not indexed while hidden — the
 * route stays reachable, but a crawler that finds it will not list it.
 */
export const NOINDEX = { robots: { index: false, follow: false } } as const;
