export type Format = "movie" | "series" | "short" | "special";
export type Order = "release" | "chronology" | "recommended";
export interface Title {
  id: string;
  title: string;
  originalTitle: string;
  year: number;
  releaseDate: string;
  type: Format;
  franchise: string;
  category: string;
  universe: string;
  continuity: string;
  status: "released" | "upcoming";
  tmdbId: number | null;
  season: number | null;
  sourceUrl: string;
  runtime: number | null;
  synopsis: string;
  characters: string[];
  releaseOrder: number;
  chronologicalOrder: number | null;
  recommendedOrder: number;
  timelineGroup: string;
  chronologyConfidence: "confirmed" | "approximate" | "unknown";
  chronologyNotes: string;
  notes: string;
}
export interface Poster {
  url: string | null;
  localPath: string | null;
  sourceUrl: string | null;
  verified: boolean;
  checkedAt: string;
  seasonSpecific: boolean;
}
export type Watched = Record<string, { watchedAt: string }>;
export interface Preferences {
  order: Order;
  category: string;
  universe: string;
  format: string;
  state: string;
  availability: string;
  search: string;
}
export interface Backup {
  version: 1;
  exportedAt: string;
  watched: Watched;
  preferences: Preferences;
}
