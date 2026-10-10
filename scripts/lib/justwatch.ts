import {
  safeWebUrl,
  type StreamingOffer,
  type OfferKind,
} from "../../src/lib/streaming";
type Entity = Record<string, any>;
const kinds = new Set(["FLATRATE", "RENT", "BUY", "FREE", "ADS"]);
export const normalizeTitle = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
// Decode the public SSR payload as data only; never execute scripts from pages.
export function publicEntities(html: string): Entity[] {
  const payload = html.match(
    /<script[^>]*id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/,
  )?.[1];
  if (!payload) throw new Error("Public page payload missing");
  const data = JSON.parse(payload);
  if (!Array.isArray(data) || data.length > 250000)
    throw new Error("Invalid public payload");
  const cache = new Map<number, any>();
  function resolve(index: number): any {
    if (index < 0) return null;
    if (!Number.isInteger(index) || index >= data.length)
      throw new Error("Invalid reference");
    if (cache.has(index)) return cache.get(index);
    const value = data[index];
    if (value === null || typeof value !== "object") return value;
    if (Array.isArray(value)) {
      if (typeof value[0] === "string") {
        if (
          ["Reactive", "ShallowReactive", "Ref", "ShallowRef"].includes(
            value[0],
          )
        )
          return resolve(value[1]);
        return null;
      }
      const result: any[] = [];
      cache.set(index, result);
      for (const ref of value) result.push(resolve(ref));
      return result;
    }
    const result = Object.create(null);
    cache.set(index, result);
    for (const [key, ref] of Object.entries(value))
      result[key] = resolve(ref as number);
    return result;
  }
  return data.flatMap((value: any, index: number) =>
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    value.__typename !== undefined
      ? [resolve(index)]
      : [],
  );
}
export function contentOf(entity: Entity): Entity | undefined {
  return Object.entries(entity).find(
    ([key]) => key === 'content({"country":"IT","language":"it"})',
  )?.[1];
}
export function offersOf(
  node: Entity,
  entities: Entity[],
): StreamingOffer[] | null {
  const table = new Map(entities.map((e) => [`${e.__typename}:${e.id}`, e]));
  const deref = (e: Entity) => (e?.__ref ? table.get(e.__ref) : e);
  const raw =
    node[
      'offers({"country":"IT","filter":{"preAffiliate":true},"platform":"WEB"})'
    ] ??
    Object.entries(node).find(
      ([key]) =>
        key.startsWith("offers(") &&
        key.includes('"country":"IT"') &&
        key.includes('"bestOnlyByPackageAndMonetization":true') &&
        key.includes('"presentationTypes":["CANVAS","HD","SD","_4K"]') &&
        key.includes('"BUY","RENT","FLATRATE"'),
    )?.[1];
  if (!Array.isArray(raw)) return null;
  const grouped = new Map<string, StreamingOffer>();
  for (const ref of raw) {
    const offer = deref(ref),
      provider = deref(offer?.package);
    const url = safeWebUrl(offer?.standardWebURL);
    if (
      !offer ||
      offer.country !== "IT" ||
      !["STANDARD", "AGGREGATED"].includes(offer.type) ||
      !kinds.has(offer.monetizationType) ||
      !provider ||
      !url ||
      !["SD", "HD", "_4K"].includes(offer.presentationType)
    )
      continue;
    const iconPath = provider['icon({"profile":"S100"})'] || provider.icon;
    const icon =
      typeof iconPath === "string" && iconPath.startsWith("/icon/")
        ? `https://images.justwatch.com${iconPath.replace("{profile}", "s100").replace("{format}", "png")}`
        : "";
    const key = `${provider.packageId}:${offer.monetizationType}`;
    const quality =
      offer.presentationType === "_4K" ? "4K" : offer.presentationType;
    const price =
      typeof offer.retailPriceValue === "number"
        ? offer.retailPriceValue
        : null;
    const previous = grouped.get(key);
    if (previous) {
      if (quality && !previous.qualities.includes(quality))
        previous.qualities.push(quality);
      if (
        price !== null &&
        (previous.price === null || price < previous.price)
      ) {
        previous.price = price;
        previous.url = url;
      }
    } else
      grouped.set(key, {
        provider: provider.clearName,
        providerId: provider.packageId,
        icon,
        url,
        kind: offer.monetizationType as OfferKind,
        price,
        currency: offer.currency || "EUR",
        qualities: quality ? [quality] : [],
      });
  }
  return [...grouped.values()];
}
