export type ConversionEventName =
  | "visual_library_view"
  | "carousel_complete"
  | "skool_cta_click"
  | "pro_page_view"
  | "pro_upgrade_click";

export type ConversionEventParameters = {
  content_id?: string;
  content_title?: string;
  content_category?: string;
  cta_location?: string;
  destination_type?: string;
};

declare global {
  interface Window {
    __BUILDSCOPE_ANALYTICS_ENABLED__?: boolean;
    gtag?: (command: "event", eventName: string, parameters?: ConversionEventParameters) => void;
  }
}

export function trackConversionEvent(
  eventName: ConversionEventName,
  parameters: ConversionEventParameters = {},
): void {
  if (typeof window === "undefined") return;
  if (window.__BUILDSCOPE_ANALYTICS_ENABLED__ !== true) return;
  if (typeof window.gtag !== "function") return;

  try {
    window.gtag("event", eventName, parameters);
  } catch {
    // Analytics must never interrupt the reader or conversion experience.
  }
}
