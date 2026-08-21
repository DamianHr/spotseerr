// Site configuration for multi-site support - SINGLE SOURCE OF TRUTH

export interface SiteConfig {
  id: string;
  name: string;
  domains: string[];
  titleSelector: string;
  enabled: boolean;
}

export const SITES_CONFIG: Record<string, SiteConfig> = {
  youtube: {
    id: "youtube",
    name: "YouTube",
    domains: ["youtube.com", "youtu.be"],
    titleSelector: "h1.ytd-watch-metadata, h1.ytdMiniplayerInfoBarTitle, h1",
    enabled: true,
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
