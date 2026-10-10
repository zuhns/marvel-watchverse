export type OfferKind = "FLATRATE" | "RENT" | "BUY" | "FREE" | "ADS";
export interface StreamingOffer {
  provider: string;
  providerId: number;
  icon: string;
  url: string;
  kind: OfferKind;
  price: number | null;
  currency: string;
  qualities: string[];
}
export interface StreamingEntry {
  status: "available" | "no_offers" | "not_found" | "upcoming";
  checkedAt: string | null;
  source: string;
  scope: "movie" | "show";
  offers: StreamingOffer[];
}
export interface StreamingDataset {
  country: "IT";
  generatedAt: string;
  entries: Record<string, StreamingEntry>;
}
export const streamingKey = (title: { type: string; tmdbId: number | null }) =>
  `${title.type === "series" ? "show" : "movie"}:${title.tmdbId}`;
export function safeWebUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}
export const streamingSearch = (name: string) =>
  `https://www.justwatch.com/it/cerca?q=${encodeURIComponent(name.replace(/\s*—\s*Stagione\s+\d+$/i, ""))}`;
export function platformDestination(url: string, source: string): string {
  const parsed = new URL(url);
  return parsed.pathname === "/" && !parsed.search ? source : url;
}
