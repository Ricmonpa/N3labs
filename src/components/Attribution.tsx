"use client";

import { useEffect } from "react";

const KEY = "n3-attribution";

export type Attribution = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
  landing?: string;
  firstSeen?: string;
};

/** Read the visitor's stored first-touch attribution. */
export function getAttribution(): Attribution {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Attribution) : {};
  } catch {
    return {};
  }
}

/** Human-readable origin for the sheet, e.g. "conferencia-mty" or "google.com". */
export function describeSource(a: Attribution): string {
  if (a.utmSource) {
    return [a.utmSource, a.utmCampaign].filter(Boolean).join(" / ");
  }
  if (a.referrer) {
    try {
      return new URL(a.referrer).hostname;
    } catch {
      return a.referrer;
    }
  }
  return "directo";
}

/**
 * Records where the visitor came from, once per browser (first touch wins).
 * Invisible to the user — no UI, no extra friction.
 */
export default function AttributionTracker() {
  useEffect(() => {
    try {
      if (localStorage.getItem(KEY)) return; // keep the original source
      const p = new URLSearchParams(window.location.search);
      const data: Attribution = {
        utmSource: p.get("utm_source") ?? undefined,
        utmMedium: p.get("utm_medium") ?? undefined,
        utmCampaign: p.get("utm_campaign") ?? undefined,
        referrer: document.referrer || undefined,
        landing: window.location.pathname,
        firstSeen: new Date().toISOString(),
      };
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      /* storage blocked — attribution is best-effort */
    }
  }, []);

  return null;
}
