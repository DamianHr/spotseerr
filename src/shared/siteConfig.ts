// Site configuration for multi-site support - SINGLE SOURCE OF TRUTH

export interface SiteConfig {
  id: string;
  name: string;
  domains: string[];
  titleSelector: string;
  enabled: boolean;
  // Path pattern that identifies an actual media page (vs the site homepage /
  // search / listing pages). Auto-detection only runs when the current URL's
  // pathname matches. Omitted = every path on the domain counts as a media page.
  mediaPathPattern?: RegExp;
}

export const SITES_CONFIG: Record<string, SiteConfig> = {
  youtube: {
    id: "youtube",
    name: "YouTube",
    domains: ["youtube.com", "youtu.be"],
    titleSelector: "h1.ytd-watch-metadata, h1.ytdMiniplayerInfoBarTitle, h1",
    enabled: true,
    mediaPathPattern: /^\/watch/,
  },
  netflix: {
    id: "netflix",
    name: "Netflix",
    domains: ["netflix.com"],
    titleSelector: "",
    enabled: false,
  },
  dailymotion: {
    id: "dailymotion",
    name: "Dailymotion",
    domains: ["dailymotion.com"],
    titleSelector: "",
    enabled: false,
  },
  imdb: {
    id: "imdb",
    name: "IMDb",
    domains: ["imdb.com"],
    titleSelector: "h1",
    enabled: true,
    mediaPathPattern: /^\/title\//,
  },
};

export function getSiteByDomain(domain: string): SiteConfig | null {
  for (const site of Object.values(SITES_CONFIG)) {
    if (!site.enabled) continue;
    for (const d of site.domains) {
      if (domain.includes(d)) {
        return site;
      }
    }
  }
  return null;
}

export function getEnabledSites(): SiteConfig[] {
  return Object.values(SITES_CONFIG).filter((s) => s.enabled);
}

// True when `pathname` corresponds to an actual media page for the given site.
// Sites without a `mediaPathPattern` treat every path as a media page.
export function isMediaPage(pathname: string, site: SiteConfig): boolean {
  if (!site.mediaPathPattern) return true;
  return site.mediaPathPattern.test(pathname);
}
