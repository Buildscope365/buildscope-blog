export type ConversionEventName =
  | "visual_library_open"
  | "carousel_slide_view"
  | "carousel_complete"
  | "visual_library_search"
  | "skool_cta_click"
  | "pro_page_view"
  | "pro_upgrade_click";

export type ConsentStatus = "granted" | "denied";

export type ConversionEventParameters = {
  content_id?: string;
  content_title?: string;
  content_category?: string;
  topic_slug?: string;
  cta_location?: string;
  destination_type?: string;
  destination_url?: string;
  slide_index?: number;
  slide_count?: number;
  search_type?: "text" | "category" | "tag" | "clear" | "reset";
  search_term_length?: number;
  selected_category?: string;
  selected_tag?: string;
  result_count?: number;
  first_utm_source?: string;
  first_utm_medium?: string;
  first_utm_campaign?: string;
  first_utm_content?: string;
  first_utm_term?: string;
  current_utm_source?: string;
  current_utm_medium?: string;
  current_utm_campaign?: string;
  current_utm_content?: string;
  current_utm_term?: string;
};

type CampaignAttribution = Partial<Record<"source" | "medium" | "campaign" | "content" | "term", string>>;
type GtagParameters = ConversionEventParameters & Record<string, string | number | boolean | undefined>;
type GtagCommand = "config" | "consent" | "event" | "js";
type GtagFunction = (command: GtagCommand, target: string | Date, parameters?: GtagParameters) => void;

declare global {
  interface Window {
    __BUILDSCOPE_ANALYTICS_ENABLED__?: boolean;
    BuildScopeAnalytics?: {
      getConsent: () => ConsentStatus;
      setConsent: (status: ConsentStatus) => void;
    };
    dataLayer?: unknown[];
    gtag?: GtagFunction;
  }
}

const CONSENT_STORAGE_KEY = "buildscope_analytics_consent";
const FIRST_CAMPAIGN_KEY = "buildscope_first_campaign";
const CURRENT_CAMPAIGN_KEY = "buildscope_current_campaign";
const UTM_KEYS = ["source", "medium", "campaign", "content", "term"] as const;
const queuedEvents: Array<{ name: ConversionEventName; parameters: ConversionEventParameters }> = [];
const recentEvents = new Map<string, number>();

let initialized = false;
let gaReady = false;
let gaLoading = false;
let measurementId = "";
let debugMode = false;
let consentRequired = true;
let consentStatus: ConsentStatus = "denied";
let firstCampaign: CampaignAttribution = {};
let currentCampaign: CampaignAttribution = {};

function safeStorage(storage: "localStorage" | "sessionStorage") {
  try {
    return window[storage];
  } catch {
    return null;
  }
}

function readJson<T>(storage: Storage | null, key: string): T | null {
  if (!storage) return null;
  try {
    const value = storage.getItem(key);
    return value ? JSON.parse(value) as T : null;
  } catch {
    return null;
  }
}

function writeJson(storage: Storage | null, key: string, value: unknown): void {
  if (!storage) return;
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage restrictions must never affect the website.
  }
}

function cleanCampaignValue(value: string | null): string | undefined {
  if (!value) return undefined;
  const cleaned = value.trim().slice(0, 100);
  return cleaned || undefined;
}

function campaignFromUrl(url: URL): CampaignAttribution {
  const campaign: CampaignAttribution = {};
  UTM_KEYS.forEach((key) => {
    const value = cleanCampaignValue(url.searchParams.get(`utm_${key}`));
    if (value) campaign[key] = value;
  });
  return campaign;
}

function hasCampaign(campaign: CampaignAttribution): boolean {
  return Object.keys(campaign).length > 0;
}

function captureCampaignAttribution(): void {
  if (consentStatus !== "granted") return;

  const local = safeStorage("localStorage");
  const session = safeStorage("sessionStorage");
  const landingCampaign = campaignFromUrl(new URL(window.location.href));
  firstCampaign = readJson<CampaignAttribution>(local, FIRST_CAMPAIGN_KEY) ?? {};
  currentCampaign = readJson<CampaignAttribution>(session, CURRENT_CAMPAIGN_KEY) ?? {};

  if (hasCampaign(landingCampaign)) {
    currentCampaign = landingCampaign;
    writeJson(session, CURRENT_CAMPAIGN_KEY, currentCampaign);
    if (!hasCampaign(firstCampaign)) {
      firstCampaign = landingCampaign;
      writeJson(local, FIRST_CAMPAIGN_KEY, firstCampaign);
    }
  }
}

function campaignParameters(): ConversionEventParameters {
  const parameters: ConversionEventParameters = {};
  UTM_KEYS.forEach((key) => {
    const firstValue = firstCampaign[key];
    const currentValue = currentCampaign[key];
    if (firstValue) parameters[`first_utm_${key}`] = firstValue;
    if (currentValue) parameters[`current_utm_${key}`] = currentValue;
  });
  return parameters;
}

function sanitizedPageLocation(): string {
  const url = new URL(window.location.href);
  [...url.searchParams.keys()].forEach((key) => {
    if (!key.startsWith("utm_")) url.searchParams.delete(key);
  });
  url.hash = "";
  return url.toString();
}

function eventKey(eventName: ConversionEventName, parameters: ConversionEventParameters): string {
  const ordered = Object.entries(parameters)
    .filter(([, value]) => value !== undefined)
    .sort(([a], [b]) => a.localeCompare(b));
  return `${eventName}:${JSON.stringify(ordered)}`;
}

function isDuplicate(eventName: ConversionEventName, parameters: ConversionEventParameters): boolean {
  const now = Date.now();
  const key = eventKey(eventName, parameters);
  const previous = recentEvents.get(key) ?? 0;
  recentEvents.set(key, now);
  for (const [storedKey, timestamp] of recentEvents) {
    if (now - timestamp > 5000) recentEvents.delete(storedKey);
  }
  return now - previous < 1000;
}

function exposeDebugEvent(eventName: string, parameters: GtagParameters): void {
  if (!debugMode) return;
  try {
    const root = document.documentElement;
    const history = JSON.parse(root.dataset.ga4DebugEvents ?? "[]") as Array<{ name: string; parameters: GtagParameters }>;
    history.push({ name: eventName, parameters });
    root.dataset.ga4DebugEvents = JSON.stringify(history.slice(-30));
  } catch {
    // Debug evidence must never affect analytics or the interface.
  }
}

function flushQueue(): void {
  if (!gaReady || consentStatus !== "granted" || typeof window.gtag !== "function") return;
  while (queuedEvents.length > 0) {
    const event = queuedEvents.shift();
    if (event) window.gtag("event", event.name, event.parameters);
  }
}

function loadGoogleAnalytics(): void {
  if (gaLoading || gaReady || consentStatus !== "granted" || !measurementId) return;
  gaLoading = true;
  captureCampaignAttribution();

  window.dataLayer = window.dataLayer ?? [];
  const gtag = function gtag() {
    window.dataLayer?.push(arguments);
  } as GtagFunction;
  window.gtag = gtag;

  gtag("consent", "default", {
    analytics_storage: "granted",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  gtag("js", new Date());
  gtag("config", measurementId, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    debug_mode: debugMode,
  });

  const pageViewParameters = {
    page_location: sanitizedPageLocation(),
    page_title: document.title.slice(0, 200),
    ...campaignParameters(),
  };
  exposeDebugEvent("page_view", pageViewParameters);
  gtag("event", "page_view", pageViewParameters);

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  script.addEventListener("load", () => {
    gaReady = true;
    window.__BUILDSCOPE_ANALYTICS_ENABLED__ = true;
    flushQueue();
  }, { once: true });
  script.addEventListener("error", () => {
    gaLoading = false;
  }, { once: true });
  document.head.appendChild(script);
}

function setConsent(status: ConsentStatus): void {
  consentStatus = status;
  const local = safeStorage("localStorage");
  try {
    local?.setItem(CONSENT_STORAGE_KEY, status);
  } catch {
    // Consent can still apply for the current page if storage is unavailable.
  }

  if (status === "granted") {
    captureCampaignAttribution();
    loadGoogleAnalytics();
    return;
  }

  window.__BUILDSCOPE_ANALYTICS_ENABLED__ = false;
  queuedEvents.length = 0;
  window.gtag?.("consent", "update", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  document.cookie.split(";").forEach((cookie) => {
    const name = cookie.split("=")[0]?.trim();
    if (!name || (name !== "_ga" && !name.startsWith("_ga_"))) return;
    document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
    document.cookie = `${name}=; Max-Age=0; path=/; domain=${window.location.hostname}; SameSite=Lax`;
    document.cookie = `${name}=; Max-Age=0; path=/; domain=.${window.location.hostname}; SameSite=Lax`;
  });
}

function inferCtaLocation(link: HTMLAnchorElement): string {
  if (link.dataset.ctaLocation) return link.dataset.ctaLocation;
  if (link.closest("header")) return "site_header";
  if (link.closest("footer")) return "site_footer";
  const section = link.closest<HTMLElement>("section[id], section[class]");
  if (section?.id) return section.id.slice(0, 100);
  if (section?.classList.length) return [...section.classList].slice(0, 2).join("_").slice(0, 100);
  return "page_content";
}

function topicFromPath(pathname: string): string {
  const readerMatch = pathname.match(/^\/read\/([^/]+)/);
  if (readerMatch?.[1]) return readerMatch[1];
  if (pathname.startsWith("/visual-library")) return "visual-library";
  if (pathname.startsWith("/pro")) return "pro";
  if (pathname === "/") return "homepage";
  return pathname.split("/").filter(Boolean).join("-") || "sitewide";
}

function installSkoolClickTracking(): void {
  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const link = target.closest<HTMLAnchorElement>("a[href]");
    if (!link) return;

    let destination: URL;
    try {
      destination = new URL(link.href, window.location.href);
    } catch {
      return;
    }
    if (destination.hostname !== "skool.com" && !destination.hostname.endsWith(".skool.com")) return;

    const contentRoot = link.closest<HTMLElement>("[data-skool-conversion], [data-content-id]");
    const parameters: ConversionEventParameters = {
      content_id: link.dataset.contentId ?? contentRoot?.dataset.contentId,
      content_title: link.dataset.contentTitle ?? contentRoot?.dataset.contentTitle,
      content_category: link.dataset.contentCategory ?? contentRoot?.dataset.contentCategory,
      topic_slug: link.dataset.contentId ?? contentRoot?.dataset.contentId ?? topicFromPath(window.location.pathname),
      cta_location: inferCtaLocation(link),
      destination_type: link.dataset.destinationType ?? "skool_community",
      destination_url: destination.toString().slice(0, 500),
    };
    trackConversionEvent("skool_cta_click", parameters);

    if (link.dataset.trackEvent === "pro_upgrade_click") {
      trackConversionEvent("pro_upgrade_click", parameters);
    }
  }, { capture: true });
}

export function initializeAnalytics(): void {
  if (typeof window === "undefined" || initialized) return;
  initialized = true;

  const body = document.body;
  const configuredId = body.dataset.ga4MeasurementId?.trim() ?? "";
  measurementId = /^G-[A-Z0-9]+$/i.test(configuredId) ? configuredId : "";
  debugMode = body.dataset.ga4DebugMode === "true";
  consentRequired = body.dataset.ga4ConsentRequired !== "false";

  const storedConsent = safeStorage("localStorage")?.getItem(CONSENT_STORAGE_KEY);
  consentStatus = consentRequired
    ? storedConsent === "granted" ? "granted" : "denied"
    : "granted";

  window.BuildScopeAnalytics = {
    getConsent: () => consentStatus,
    setConsent,
  };
  window.addEventListener("buildscope:analytics-consent", ((event: CustomEvent<{ status?: ConsentStatus }>) => {
    if (event.detail?.status === "granted" || event.detail?.status === "denied") {
      setConsent(event.detail.status);
    }
  }) as EventListener);

  installSkoolClickTracking();
  if (measurementId && consentStatus === "granted") loadGoogleAnalytics();
}

export function trackConversionEvent(
  eventName: ConversionEventName,
  parameters: ConversionEventParameters = {},
): void {
  if (typeof window === "undefined") return;
  if (!initialized) initializeAnalytics();
  if (!measurementId || consentStatus !== "granted") return;

  const enriched = { ...campaignParameters(), ...parameters };
  if (isDuplicate(eventName, enriched)) return;
  exposeDebugEvent(eventName, enriched);

  try {
    if (!gaReady || typeof window.gtag !== "function") {
      queuedEvents.push({ name: eventName, parameters: enriched });
      loadGoogleAnalytics();
      return;
    }
    window.gtag("event", eventName, enriched);
  } catch {
    // Analytics must never interrupt the reader or conversion experience.
  }
}
