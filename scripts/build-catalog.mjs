/** Offline catalog builder. Public TMDB pages are used at generation time only.
 * API credentials, when supplied, belong to environment variables; no secrets enter JSON.
 * Run: node scripts/build-catalog.mjs [--refresh] [--offline]
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cutoff = "2026-10-08";
const checkedAt = new Date().toISOString();
const refresh = process.argv.includes("--refresh");
const offline = process.argv.includes("--offline");
const cacheDir = path.join(root, ".cache", "tmdb");
await fs.mkdir(cacheDir, { recursive: true });
await fs.mkdir(path.join(root, "src/data"), { recursive: true });
await fs.mkdir(path.join(root, "reports"), { recursive: true });
const titles = [],
  posters = {},
  issues = [];
let previousPosters = {};
try {
  previousPosters = JSON.parse(
    await fs.readFile(path.join(root, "src/data/posters.json"), "utf8"),
  );
} catch {}
let resolvedIds = {};
try {
  resolvedIds = JSON.parse(
    await fs.readFile(
      path.join(root, "reports/posters-resolved-ids.json"),
      "utf8",
    ),
  );
} catch {}
const slug = (s) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const decode = (s) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&apos;/g, "'")
    .replace(/&quot;/g, '"');
const normalize = (s) =>
  slug(decode(s))
    .replace(
      /marvel-s-|marvel-television-s-|marvel-animation-s-|marvel-studios-/g,
      "",
    )
    .replace(/fantastic-4/g, "fantastic-four");
const characterNames = {
  "iron-man": ["Tony Stark", "Iron Man"],
  avengers: [
    "Tony Stark",
    "Steve Rogers",
    "Thor",
    "Bruce Banner",
    "Natasha Romanoff",
    "Clint Barton",
  ],
  hulk: ["Bruce Banner", "Hulk"],
  thor: ["Thor", "Loki"],
  "captain-america": ["Steve Rogers", "Sam Wilson", "Bucky Barnes"],
  "guardians-of-the-galaxy": [
    "Peter Quill",
    "Star-Lord",
    "Gamora",
    "Rocket",
    "Groot",
    "Drax",
  ],
  "ant-man": ["Scott Lang", "Hope van Dyne", "Hank Pym"],
  "captain-marvel": ["Carol Danvers", "Kamala Khan", "Monica Rambeau"],
  "doctor-strange": ["Stephen Strange", "Wong"],
  "black-panther": ["T’Challa", "Shuri", "Okoye"],
  "black-widow": ["Natasha Romanoff", "Yelena Belova"],
  "shang-chi": ["Shang-Chi", "Wenwu"],
  "spider-man": ["Peter Parker", "Spider-Man"],
  deadpool: ["Wade Wilson", "Deadpool", "Wolverine"],
  wolverine: ["Logan", "Wolverine"],
  "x-men": [
    "Wolverine",
    "Professor X",
    "Charles Xavier",
    "Magneto",
    "Jean Grey",
  ],
  "fantastic-four": ["Reed Richards", "Sue Storm", "Johnny Storm", "Ben Grimm"],
  venom: ["Eddie Brock", "Venom"],
  blade: ["Eric Brooks", "Blade"],
  daredevil: ["Matt Murdock", "Daredevil", "Wilson Fisk"],
  punisher: ["Frank Castle", "Punisher"],
  "ghost-rider": ["Johnny Blaze", "Ghost Rider"],
  wandavision: ["Wanda Maximoff", "Vision"],
  loki: ["Loki", "Mobius"],
  hawkeye: ["Clint Barton", "Kate Bishop"],
  "moon-knight": ["Marc Spector", "Steven Grant"],
  "ms-marvel": ["Kamala Khan"],
  "she-hulk": ["Jennifer Walters", "Bruce Banner"],
  agatha: ["Agatha Harkness"],
  "wonder-man": ["Simon Williams", "Trevor Slattery"],
  "jessica-jones": ["Jessica Jones", "Kilgrave"],
  "luke-cage": ["Luke Cage"],
  "iron-fist": ["Danny Rand"],
  defenders: ["Matt Murdock", "Jessica Jones", "Luke Cage", "Danny Rand"],
};
async function html(url) {
  const file = path.join(cacheDir, slug(url) + ".html");
  if (!refresh) {
    try {
      return await fs.readFile(file, "utf8");
    } catch {}
  }
  if (offline) throw Error("No cached source: " + url);
  const r = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw Error("HTTP " + r.status + " " + url);
  const content = await r.text();
  if (!content.includes("og:title"))
    throw Error("Unrecognized TMDB page " + url);
  await fs.writeFile(file, content);
  return content;
}
const meta = (s, key) =>
  decode(
    s.match(
      new RegExp('<meta[^>]+property="' + key + '"[^>]+content="([^"]*)"'),
    )?.[1] || "",
  );
async function resolve(seed, type) {
  const key = type + "-" + seed.firstYear + "-" + slug(seed.originalTitle);
  let id = resolvedIds[key] || seed.tmdbId;
  const verify = async (candidate) => {
    const sourceUrl = `https://www.themoviedb.org/${type}/${candidate}?language=en-US`;
    const page = await html(sourceUrl);
    const pageTitle = meta(page, "og:title");
    const pageYear = +(
      page.match(/<title>[^<]*\((?:TV Series )?(\d{4})/i)?.[1] || 0
    );
    const accepted = [seed.originalTitle, ...(seed.aliases || [])].map(
      normalize,
    );
    if (!accepted.includes(normalize(pageTitle)))
      throw Error(
        "ID/title mismatch " +
          candidate +
          ": " +
          pageTitle +
          " vs " +
          seed.originalTitle,
      );
    if (seed.firstYear && pageYear && seed.firstYear !== pageYear)
      throw Error(
        "ID/year mismatch " +
          candidate +
          ": " +
          pageYear +
          " vs " +
          seed.firstYear,
      );
    let italianPage = null;
    try {
      italianPage = await html(
        `https://www.themoviedb.org/${type}/${candidate}?language=it-IT`,
      );
    } catch {}
    const overview =
      italianPage?.match(
        /<div class="overview"[^>]*>\s*<p>([\s\S]*?)<\/p>/,
      )?.[1] || meta(italianPage || "", "og:description");
    const synopsis = decode(overview || "")
      .replace(/<[^>]+>/g, "")
      .trim()
      .split(/\s+/)
      .slice(0, 24)
      .join(" ");
    return {
      id: candidate,
      page,
      sourceUrl,
      synopsis: synopsis ? synopsis + (/[.!?]$/.test(synopsis) ? "" : "…") : "",
      italianTitle: meta(italianPage || "", "og:title"),
    };
  };
  try {
    if (id) {
      const result = await verify(id);
      resolvedIds[key] = id;
      return result;
    }
  } catch {}
  if (offline)
    throw Error("ID cannot be verified offline: " + seed.originalTitle);
  const response = await fetch(
    "https://www.themoviedb.org/search?query=" +
      encodeURIComponent(seed.originalTitle),
    { signal: AbortSignal.timeout(20000) },
  );
  const search = await response.text();
  const candidates = [
    ...new Set(
      [
        ...search.matchAll(new RegExp('href="/' + type + '/(\\d+)[^"?]*', "g")),
      ].map((m) => +m[1]),
    ),
  ].slice(0, 12);
  for (const candidate of candidates) {
    try {
      const result = await verify(candidate);
      resolvedIds[key] = candidate;
      return result;
    } catch {}
  }
  throw Error(
    "No TMDB title + type + year match: " +
      seed.originalTitle +
      " (" +
      seed.firstYear +
      ")",
  );
}
function create(seed, date, season = null) {
  const id = `${slug(seed.category)}-${seed.firstYear}-${slug(seed.originalTitle)}${season ? "-s" + season : ""}`;
  const key = normalize(seed.franchise || seed.originalTitle);
  const characters =
    seed.characters ||
    characterNames[key] ||
    Object.entries(characterNames).find(([k]) => key.includes(k))?.[1] ||
    [];
  return {
    id,
    title: seed.title || seed.originalTitle,
    originalTitle: seed.originalTitle,
    year: +date.slice(0, 4),
    releaseDate: date,
    type: seed.type || "movie",
    franchise: seed.franchise || seed.originalTitle,
    category: seed.category,
    universe: seed.universe,
    continuity: seed.continuity || seed.universe,
    status: date > cutoff ? "upcoming" : "released",
    tmdbId: null,
    season,
    sourceUrl: seed.official || null,
    runtime: seed.runtime || null,
    synopsis: "",
    characters,
    releaseOrder: 0,
    chronologicalOrder: null,
    recommendedOrder: 0,
    timelineGroup:
      seed.timeline ||
      (seed.category === "Defenders" ? "MCU — Defenders Saga" : seed.universe),
    chronologyConfidence: "unknown",
    chronologyNotes:
      "Ordine narrativo non stabilito; consulta la continuità specifica.",
    notes:
      seed.notes ||
      "Data di prima distribuzione cinematografica o trasmissione di riferimento; può differire dall’uscita italiana.",
  };
}
function poster(page, sourceUrl, seasonSpecific) {
  const url = meta(page, "og:image");
  return {
    url: /^https:\/\/(media\.themoviedb\.org|image\.tmdb\.org)\/t\/p\//.test(
      url,
    )
      ? url
      : null,
    localPath: null,
    sourceUrl,
    verified: false,
    checkedAt,
    seasonSpecific,
  };
}
async function checkPoster(p) {
  if (!p.url) return p;
  const prior = Object.values(previousPosters).find(
    (old) =>
      old.url === p.url &&
      old.verified &&
      Date.now() - Date.parse(old.checkedAt) < 86400000,
  );
  if (!refresh && prior)
    return { ...p, verified: true, checkedAt: prior.checkedAt };
  if (offline) return p;
  try {
    const r = await fetch(p.url, {
      method: "HEAD",
      signal: AbortSignal.timeout(20000),
    });
    p.verified =
      r.ok && (r.headers.get("content-type") || "").startsWith("image/");
  } catch (error) {
    p.error = error.message;
  }
  if (!p.verified) {
    try {
      const r = await fetch(p.url, { signal: AbortSignal.timeout(20000) });
      p.verified =
        r.ok && (r.headers.get("content-type") || "").startsWith("image/");
      await r.body?.cancel();
    } catch {}
  }
  return p;
}
async function processSeed(seed) {
  const type = seed.type === "series" ? "tv" : "movie";
  let resolved;
  try {
    resolved = await resolve(seed, type);
  } catch (error) {
    issues.push({ title: seed.originalTitle, error: error.message });
  }
  if (seed.type === "series") {
    for (let i = 0; i < seed.dates.length; i++) {
      const record = create(seed, seed.dates[i], i + 1);
      record.title += ` — Stagione ${i + 1}`;
      let page = resolved?.page,
        sourceUrl = resolved?.sourceUrl,
        specific = false;
      if (resolved) {
        record.tmdbId = resolved.id;
        record.synopsis = resolved.synopsis;
        record.title =
          (seed.title || resolved.italianTitle || seed.originalTitle) +
          ` — Stagione ${i + 1}`;
        try {
          sourceUrl = `https://www.themoviedb.org/tv/${resolved.id}/season/${i + 1}?language=en-US`;
          page = await html(sourceUrl);
          const pageDate = page.match(
            /<span class="date">([^<]+)<\/span>/,
          )?.[1];
          const epoch = pageDate ? Date.parse(pageDate) : NaN;
          if (!seed.officialDates && !Number.isNaN(epoch)) {
            record.releaseDate = new Date(epoch).toISOString().slice(0, 10);
            record.year = +record.releaseDate.slice(0, 4);
            record.status =
              record.releaseDate > cutoff ? "upcoming" : "released";
          }
          specific = true;
        } catch (error) {
          sourceUrl = resolved.sourceUrl;
          issues.push({
            title: record.title,
            error: "Season poster fallback: " + error.message,
          });
        }
      }
      record.sourceUrl =
        seed.official ||
        sourceUrl ||
        `https://en.wikipedia.org/wiki/${encodeURIComponent(seed.wiki || seed.originalTitle)}`;
      titles.push(record);
      posters[record.id] = page
        ? await checkPoster(poster(page, sourceUrl, specific))
        : {
            url: null,
            localPath: null,
            sourceUrl: null,
            verified: false,
            checkedAt,
            seasonSpecific: false,
          };
    }
  } else {
    const record = create(seed, seed.date);
    if (resolved) {
      record.tmdbId = resolved.id;
      record.sourceUrl = seed.official || resolved.sourceUrl;
      record.synopsis = resolved.synopsis;
      record.title = seed.title || resolved.italianTitle || seed.originalTitle;
      const rt = resolved.page.match(
        /<span class="runtime">\s*(?:(\d+)h)?\s*(?:(\d+)m)?/,
      );
      if (rt && (rt[1] || rt[2]))
        record.runtime = +(rt[1] || 0) * 60 + +(rt[2] || 0);
    }
    record.sourceUrl ||= `https://en.wikipedia.org/wiki/${encodeURIComponent(seed.wiki || seed.originalTitle)}`;
    titles.push(record);
    posters[record.id] = resolved
      ? await checkPoster(poster(resolved.page, resolved.sourceUrl, false))
      : {
          url: null,
          localPath: null,
          sourceUrl: null,
          verified: false,
          checkedAt,
          seasonSpecific: false,
        };
  }
  console.log(seed.originalTitle, titles.length);
}
const seeds = [];
function films(category, universe, rows, extras = {}) {
  for (const line of rows.trim().split("\n")) {
    const [originalTitle, date, tmdbId, franchise, title] = line.split("|");
    seeds.push({
      originalTitle,
      date,
      firstYear: +date.slice(0, 4),
      tmdbId: +tmdbId || null,
      franchise,
      title,
      category,
      universe,
      ...extras,
    });
  }
}
function series(originalTitle, tmdbId, dates, category, universe, extras = {}) {
  seeds.push({
    originalTitle,
    tmdbId,
    dates: dates.split(","),
    firstYear: +dates.slice(0, 4),
    type: "series",
    category,
    universe,
    ...extras,
  });
}
films(
  "MCU",
  "MCU",
  `
Iron Man|2008-05-02|1726|Iron Man
The Incredible Hulk|2008-06-13|1724|Hulk|L’incredibile Hulk
Iron Man 2|2010-05-07|10138|Iron Man
Thor|2011-05-06|10195|Thor
Captain America: The First Avenger|2011-07-22|1771|Captain America|Captain America - Il primo Vendicatore
The Avengers|2012-05-04|24428|Avengers
Iron Man 3|2013-05-03|68721|Iron Man
Thor: The Dark World|2013-11-08|76338|Thor
Captain America: The Winter Soldier|2014-04-04|100402|Captain America
Guardians of the Galaxy|2014-08-01|118340|Guardians of the Galaxy|Guardiani della Galassia
Avengers: Age of Ultron|2015-05-01|99861|Avengers
Ant-Man|2015-07-17|102899|Ant-Man
Captain America: Civil War|2016-05-06|271110|Captain America
Doctor Strange|2016-11-04|284052|Doctor Strange
Guardians of the Galaxy Vol. 2|2017-05-05|283995|Guardians of the Galaxy|Guardiani della Galassia Vol. 2
Spider-Man: Homecoming|2017-07-07|315635|Spider-Man
Thor: Ragnarok|2017-11-03|284053|Thor
Black Panther|2018-02-16|284054|Black Panther
Avengers: Infinity War|2018-04-27|299536|Avengers
Ant-Man and the Wasp|2018-07-06|363088|Ant-Man
Captain Marvel|2019-03-08|299537|Captain Marvel
Avengers: Endgame|2019-04-26|299534|Avengers
Spider-Man: Far From Home|2019-07-02|429617|Spider-Man
Black Widow|2021-07-09|497698|Black Widow
Shang-Chi and the Legend of the Ten Rings|2021-09-03|566525|Shang-Chi|Shang-Chi e la leggenda dei dieci anelli
Eternals|2021-11-05|524434|Eternals
Spider-Man: No Way Home|2021-12-17|634649|Spider-Man
Doctor Strange in the Multiverse of Madness|2022-05-06|453395|Doctor Strange
Thor: Love and Thunder|2022-07-08|616037|Thor
Black Panther: Wakanda Forever|2022-11-11|505642|Black Panther
Ant-Man and the Wasp: Quantumania|2023-02-17|640146|Ant-Man
Guardians of the Galaxy Vol. 3|2023-05-05|447365|Guardians of the Galaxy|Guardiani della Galassia Vol. 3
The Marvels|2023-11-10|609681|Captain Marvel
Deadpool & Wolverine|2024-07-26|533535|Deadpool
Captain America: Brave New World|2025-02-14|822119|Captain America
Thunderbolts*|2025-05-02|986056|Thunderbolts
The Fantastic Four: First Steps|2025-07-25|617126|Fantastic Four|I Fantastici 4: Gli inizi
Spider-Man: Brand New Day|2026-07-31|969681|Spider-Man
Avengers: Doomsday|2026-12-18|1003596|Avengers
Avengers: Secret Wars|2027-12-17|1003598|Avengers
`,
);
films(
  "X-Men",
  "X-Men / Fox",
  `
X-Men|2000-07-14|36657|X-Men
X2|2003-05-02|36658|X-Men|X-Men 2
X-Men: The Last Stand|2006-05-26|36668|X-Men|X-Men - Conflitto finale
X-Men Origins: Wolverine|2009-05-01|2080|Wolverine|X-Men le origini - Wolverine
X-Men: First Class|2011-06-03|49538|X-Men|X-Men - L’inizio
The Wolverine|2013-07-26|76170|Wolverine|Wolverine - L’immortale
X-Men: Days of Future Past|2014-05-23|127585|X-Men|X-Men - Giorni di un futuro passato
Deadpool|2016-02-12|293660|Deadpool
X-Men: Apocalypse|2016-05-27|246655|X-Men|X-Men - Apocalisse
Logan|2017-03-03|263115|Wolverine|Logan - The Wolverine
Deadpool 2|2018-05-18|383498|Deadpool
Dark Phoenix|2019-06-07|320288|X-Men|X-Men - Dark Phoenix
The New Mutants|2020-08-28|340102|X-Men
`,
  {
    notes:
      "Continuità Fox con diramazioni temporali. Days of Future Past modifica la storia: l’ordine interno è una proposta approssimativa, non un canone globale.",
  },
);
films(
  "Spider-Man",
  "Spider-Man Raimi",
  `
Spider-Man|2002-05-03|557|Spider-Man Raimi
Spider-Man 2|2004-06-30|558|Spider-Man Raimi
Spider-Man 3|2007-05-04|559|Spider-Man Raimi
`,
);
films(
  "Spider-Man",
  "Spider-Man Webb",
  `
The Amazing Spider-Man|2012-07-03|1930|Spider-Man Webb
The Amazing Spider-Man 2|2014-05-02|102382|Spider-Man Webb|The Amazing Spider-Man 2 - Il potere di Electro
`,
);
films(
  "Sony / Venom",
  "Sony Spider-Man Universe",
  `
Venom|2018-10-05|335983|Venom
Venom: Let There Be Carnage|2021-10-01|580489|Venom|Venom - La furia di Carnage
Morbius|2022-04-01|526896|Morbius
Madame Web|2024-02-14|634492|Madame Web
Venom: The Last Dance|2024-10-25|912649|Venom
Kraven the Hunter|2024-12-13|539972|Kraven
`,
);
films(
  "Spider-Verse",
  "Spider-Verse",
  `
Spider-Man: Into the Spider-Verse|2018-12-14|324857|Spider-Verse|Spider-Man - Un nuovo universo
Spider-Man: Across the Spider-Verse|2023-06-02|569094|Spider-Verse
Spider-Man: Beyond the Spider-Verse|2027-06-18|911916|Spider-Verse
The Spider Within: A Spider-Verse Story|2024-03-27|1130663|Spider-Verse
`,
);
films(
  "Fantastic Four",
  "Fantastic Four Fox 2005",
  `
Fantastic Four|2005-07-08|9738|Fantastic Four|I Fantastici 4
Fantastic Four: Rise of the Silver Surfer|2007-06-15|1979|Fantastic Four|I Fantastici 4 e Silver Surfer
`,
);
films(
  "Fantastic Four",
  "Fantastic Four Fox 2015",
  "Fantastic Four|2015-08-07|166424|Fantastic Four|Fantastic 4 - I Fantastici Quattro",
);
films(
  "Legacy",
  "Marvel Legacy",
  `
Blade|1998-08-21|36647|Blade
Blade II|2002-03-22|36586|Blade
Blade: Trinity|2004-12-08|36648|Blade
Daredevil|2003-02-14|9480|Daredevil
Elektra|2005-01-14|9947|Daredevil
Hulk|2003-06-20|1927|Hulk
The Punisher|1989-10-05|8867|Punisher|Il vendicatore
The Punisher|2004-04-16|7220|Punisher
Punisher: War Zone|2008-12-05|13056|Punisher
Ghost Rider|2007-02-16|1250|Ghost Rider
Ghost Rider: Spirit of Vengeance|2012-02-17|71676|Ghost Rider|Ghost Rider - Spirito di vendetta
Howard the Duck|1986-08-01|10658|Howard the Duck|Howard e il destino del mondo
Captain America|1990-12-14|13995|Captain America
Dr. Strange|1978-09-06|50468|Doctor Strange
Nick Fury: Agent of S.H.I.E.L.D.|1998-05-26|27460|Nick Fury
Generation X|1996-02-20|26626|X-Men
Man-Thing|2005-04-30|18882|Man-Thing
Captain America|1979-01-19|19761|Captain America
Captain America II: Death Too Soon|1979-11-23|19762|Captain America
The Incredible Hulk Returns|1988-05-22|26883|Hulk
The Trial of the Incredible Hulk|1989-05-07|26880|Hulk
The Death of the Incredible Hulk|1990-02-18|26914|Hulk
`,
  {
    notes:
      "Adattamento storico indipendente; nessuna cronologia comune fra franchise legacy.",
  },
);
films(
  "MCU",
  "MCU",
  `
Marvel One-Shot: The Consultant|2011-09-13|76122|Marvel One-Shots|The Consultant
Marvel One-Shot: A Funny Thing Happened on the Way to Thor’s Hammer|2011-10-25|76535|Marvel One-Shots|A Funny Thing Happened on the Way to Thor’s Hammer
Marvel One-Shot: Item 47|2012-09-25|119569|Marvel One-Shots|Item 47
Marvel One-Shot: Agent Carter|2013-09-24|211387|Marvel One-Shots|Agent Carter (One-Shot)
Marvel One-Shot: All Hail the King|2014-02-25|253980|Marvel One-Shots|All Hail the King
`,
  { type: "short" },
);
films(
  "MCU",
  "Team Thor (parodia)",
  `
Team Thor|2016-08-28|413279|Team Thor
Team Thor: Part 2|2017-02-14|441829|Team Thor
Team Darryl|2018-02-20|505945|Team Thor
`,
  {
    type: "short",
    notes:
      "Cortometraggio comico: continuità parodica, non timeline canonica MCU.",
  },
);
films(
  "MCU",
  "MCU",
  `
Werewolf by Night|2022-10-07|894205|Werewolf by Night|Licantropus
The Guardians of the Galaxy Holiday Special|2022-11-25|774752|Guardians of the Galaxy|Guardiani della Galassia Holiday Special
The Punisher: One Last Kill|2026-05-12|1439930|Punisher
`,
  { type: "special" },
);
series("WandaVision", 85271, "2021-01-15", "MCU", "MCU");
series("The Falcon and the Winter Soldier", 88396, "2021-03-19", "MCU", "MCU");
series("Loki", 84958, "2021-06-09,2023-10-05", "MCU", "MCU — TVA / Multiverso");
series(
  "What If...?",
  91363,
  "2021-08-11,2023-12-22,2024-12-22",
  "MCU",
  "MCU — Multiverso animato",
);
series("Hawkeye", 88329, "2021-11-24", "MCU", "MCU");
series("Moon Knight", 92749, "2022-03-30", "MCU", "MCU");
series("Ms. Marvel", 92782, "2022-06-08", "MCU", "MCU");
series("She-Hulk: Attorney at Law", 92783, "2022-08-18", "MCU", "MCU");
series("Secret Invasion", 114472, "2023-06-21", "MCU", "MCU");
series("Echo", 122226, "2024-01-09", "MCU", "MCU");
series("Agatha All Along", 138501, "2024-09-18", "MCU", "MCU");
series("Ironheart", 114471, "2025-06-24", "MCU", "MCU");
series("Daredevil: Born Again", 202555, "2025-03-04,2026-03-24", "MCU", "MCU", {
  officialDates: true,
});
series("Wonder Man", 203455, "2026-01-27", "MCU", "MCU", {
  officialDates: true,
  official:
    "https://thewaltdisneycompany.com/news/marvel-television-wonder-man/",
});
series("Eyes of Wakanda", 241222, "2025-08-01", "MCU", "MCU", {
  notes:
    "Antologia ambientata in epoche diverse della storia di Wakanda; non ha un unico posto nella cronologia.",
});
series("Marvel Zombies", 138505, "2025-09-24", "MCU", "MCU — Marvel Zombies");
series("I Am Groot", 114469, "2022-08-10,2023-09-06", "MCU", "MCU", {
  notes: "Raccolta di cortometraggi; una voce per stagione.",
});
series(
  "Your Friendly Neighborhood Spider-Man",
  138503,
  "2025-01-29",
  "Animazione",
  "Spider-Man — Continuità alternativa",
);
series("VisionQuest", 213375, "2026-10-14", "MCU", "MCU", {
  officialDates: true,
  official:
    "https://www.marvel.com/articles/tv-shows/marvel-television-visionquest-release-date?pubDate=20260513",
});
series(
  "Marvel’s Daredevil",
  61889,
  "2015-04-10,2016-03-18,2018-10-19",
  "Defenders",
  "MCU",
  { franchise: "Daredevil", continuity: "Defenders Saga — MCU" },
);
series(
  "Marvel’s Jessica Jones",
  38472,
  "2015-11-20,2018-03-08,2019-06-14",
  "Defenders",
  "MCU",
  { franchise: "Jessica Jones", continuity: "Defenders Saga — MCU" },
);
series(
  "Marvel’s Luke Cage",
  62126,
  "2016-09-30,2018-06-22",
  "Defenders",
  "MCU",
  { franchise: "Luke Cage", continuity: "Defenders Saga — MCU" },
);
series(
  "Marvel’s Iron Fist",
  62127,
  "2017-03-17,2018-09-07",
  "Defenders",
  "MCU",
  { franchise: "Iron Fist", continuity: "Defenders Saga — MCU" },
);
series("Marvel’s The Defenders", 62285, "2017-08-18", "Defenders", "MCU", {
  franchise: "Defenders",
  continuity: "Defenders Saga — MCU",
});
series(
  "Marvel’s The Punisher",
  67178,
  "2017-11-17,2019-01-18",
  "Defenders",
  "MCU",
  { franchise: "Punisher", continuity: "Defenders Saga — MCU" },
);
const tvNotes = {
  notes:
    "Marvel Television: collegamenti narrativi al MCU, ma collocazione nella timeline ufficiale non confermata per l’intera serie.",
  continuity: "Collegata al MCU — canone / collocazione incerti",
};
series(
  "Marvel’s Agents of S.H.I.E.L.D.",
  1403,
  "2013-09-24,2014-09-23,2015-09-29,2016-09-20,2017-12-01,2019-05-10,2020-05-27",
  "Marvel Television",
  "Marvel Television — SHIELD",
  tvNotes,
);
series(
  "Marvel’s Agent Carter",
  61550,
  "2015-01-06,2016-01-19",
  "Marvel Television",
  "Marvel Television — Agent Carter",
  tvNotes,
);
series(
  "Marvel’s Inhumans",
  68716,
  "2017-09-29",
  "Marvel Television",
  "Marvel Television — Inhumans",
  tvNotes,
);
series(
  "Marvel’s Runaways",
  67466,
  "2017-11-21,2018-12-21,2019-12-13",
  "Marvel Television",
  "Marvel Television — Runaways",
  tvNotes,
);
series(
  "Marvel’s Cloak & Dagger",
  66190,
  "2018-06-07,2019-04-04",
  "Marvel Television",
  "Marvel Television — Cloak & Dagger",
  tvNotes,
);
series(
  "Helstrom",
  88987,
  "2020-10-16",
  "Marvel Television",
  "Helstrom — Continuità indipendente",
  { continuity: "Continuità indipendente, fuori dal MCU" },
);
series(
  "Marvel’s Agents of S.H.I.E.L.D.: Slingshot",
  69088,
  "2016-12-13",
  "Marvel Television",
  "Marvel Television — SHIELD",
  {
    ...tvNotes,
    notes:
      "Webserie spin-off di Agents of S.H.I.E.L.D.; da guardare nel contesto della quarta stagione.",
  },
);
series("Legion", 67195, "2017-02-08,2018-04-03,2019-06-24", "X-Men", "Legion", {
  continuity: "Continuità alternativa autonoma legata ai personaggi X-Men",
});
series("The Gifted", 69629, "2017-10-02,2018-09-25", "X-Men", "The Gifted", {
  continuity: "Continuità alternativa, distinta dalla cronologia dei film Fox",
});
series("Spider-Noir", 220102, "2026-05-27", "Spider-Man", "Spider-Noir", {
  officialDates: true,
  official:
    "https://www.aboutamazon.com/news/entertainment/prime-video-movies-tv-shows-music-sports-may-2026",
  continuity: "Universo alternativo Spider-Noir; distinto da Raimi, Webb e MCU",
});
series("Blade: The Series", 4626, "2006-06-28", "Legacy", "Blade", {
  franchise: "Blade",
});
series(
  "The Incredible Hulk",
  1130,
  "1977-11-04,1978-09-22,1979-09-21,1980-11-07,1981-10-02",
  "Legacy",
  "Hulk televisivo 1977",
  { franchise: "Hulk" },
);
series(
  "The Amazing Spider-Man",
  2045,
  "1977-09-14,1978-09-05",
  "Legacy",
  "Spider-Man televisivo 1977",
  { franchise: "Spider-Man" },
);
series("Spider-Man", 2640, "1978-05-17", "Legacy", "Spider-Man Toei", {
  firstYear: 1978,
  franchise: "Spider-Man",
  aliases: ["Japanese Spiderman", "Japanese Spider-Man"],
  notes: "Serie live action giapponese Toei, universo autonomo.",
});
series(
  "X-Men",
  4574,
  "1992-10-31,1993-10-23,1994-07-29,1995-05-06,1996-09-07",
  "Animazione",
  "X-Men animato 1992",
  { franchise: "X-Men" },
);
series(
  "X-Men ’97",
  138502,
  "2024-03-20,2026-07-01",
  "Animazione",
  "X-Men animato 1992",
  {
    franchise: "X-Men",
    officialDates: true,
    official:
      "https://press.disney.co.uk/news/marvel-animations-xmen-97-returns-to-disney-for-second-season-on-july-1",
    notes:
      "Continuazione della serie animata del 1992. Non appartiene alla timeline principale MCU.",
  },
);
series(
  "Spider-Man",
  888,
  "1994-11-19,1995-09-09,1996-04-27,1997-02-01,1997-09-12",
  "Animazione",
  "Spider-Man animato 1994",
  { franchise: "Spider-Man" },
);
series(
  "The Spectacular Spider-Man",
  3854,
  "2008-03-08,2009-06-22",
  "Animazione",
  "Spectacular Spider-Man",
  { franchise: "Spider-Man" },
);
series(
  "The Avengers: Earth’s Mightiest Heroes",
  33623,
  "2010-10-20,2012-04-01",
  "Animazione",
  "Avengers EMH",
  { franchise: "Avengers" },
);
series(
  "Ultimate Spider-Man",
  34391,
  "2012-04-01,2013-01-21,2014-08-31,2016-02-21",
  "Animazione",
  "Marvel animato 2010s",
  { franchise: "Spider-Man" },
);
series(
  "Fantastic Four",
  1747,
  "1994-09-24,1995-09-23",
  "Animazione",
  "Marvel animato 1990s",
  { franchise: "Fantastic Four" },
);
series(
  "Iron Man",
  971,
  "1994-09-24,1995-09-23",
  "Animazione",
  "Marvel animato 1990s",
  { franchise: "Iron Man" },
);
series(
  "X-Men: Evolution",
  668,
  "2000-11-04,2001-09-29,2002-09-14,2003-08-02",
  "Animazione",
  "X-Men Evolution",
  { franchise: "X-Men" },
);
series(
  "Wolverine and the X-Men",
  6549,
  "2009-01-23",
  "Animazione",
  "Wolverine and the X-Men",
  { franchise: "X-Men" },
);
series(
  "Marvel’s Avengers Assemble",
  59427,
  "2013-05-26,2014-09-28,2016-03-13,2017-06-17,2018-09-23",
  "Animazione",
  "Marvel animato 2010s",
  { franchise: "Avengers" },
);
series(
  "Marvel’s Guardians of the Galaxy",
  63181,
  "2015-09-05,2017-03-11,2018-03-18",
  "Animazione",
  "Marvel animato 2010s",
  { franchise: "Guardians of the Galaxy" },
);
series(
  "Marvel’s Spider-Man",
  72705,
  "2017-08-19,2018-06-18,2020-04-19",
  "Animazione",
  "Spider-Man animato 2017",
  { franchise: "Spider-Man" },
);
series(
  "Hulk and the Agents of S.M.A.S.H.",
  46823,
  "2013-08-11,2014-10-12",
  "Animazione",
  "Marvel animato 2010s",
  { franchise: "Hulk" },
);
series(
  "The Super Hero Squad Show",
  21762,
  "2009-09-14,2010-10-23",
  "Animazione",
  "Super Hero Squad",
  { franchise: "Avengers" },
);
series(
  "Spider-Man",
  628,
  "1967-09-09,1968-09-14,1970-03-22",
  "Animazione",
  "Spider-Man animato 1967",
  { franchise: "Spider-Man" },
);
series(
  "Spider-Man",
  1309,
  "1981-09-12",
  "Animazione",
  "Spider-Man animato 1981",
  { franchise: "Spider-Man" },
);
series(
  "Spider-Man and His Amazing Friends",
  1269,
  "1981-09-12,1982-09-18,1983-09-17",
  "Animazione",
  "Spider-Man animato 1981",
  { franchise: "Spider-Man" },
);
series(
  "Spider-Man Unlimited",
  10079,
  "1999-10-02",
  "Animazione",
  "Spider-Man Unlimited",
  { franchise: "Spider-Man" },
);
series(
  "The Incredible Hulk",
  2429,
  "1996-09-08,1997-09-21",
  "Animazione",
  "Marvel animato 1990s",
  { franchise: "Hulk" },
);
series(
  "The Incredible Hulk",
  1139,
  "1982-09-18",
  "Animazione",
  "Hulk animato 1982",
  { franchise: "Hulk" },
);
series(
  "Fantastic Four: World’s Greatest Heroes",
  1262,
  "2006-09-02",
  "Animazione",
  "Fantastic Four animato 2006",
  { franchise: "Fantastic Four" },
);
series(
  "Iron Man: Armored Adventures",
  7330,
  "2009-04-24,2011-07-13",
  "Animazione",
  "Iron Man Armored Adventures",
  { franchise: "Iron Man" },
);
series("Marvel’s M.O.D.O.K.", 104156, "2021-05-21", "Animazione", "MODOK", {
  franchise: "MODOK",
});
series(
  "Marvel’s Hit-Monkey",
  104155,
  "2021-11-17,2024-07-15",
  "Animazione",
  "Hit-Monkey",
  { franchise: "Hit-Monkey" },
);
series(
  "Marvel Disk Wars: The Avengers",
  61363,
  "2014-04-02",
  "Animazione",
  "Disk Wars",
  { franchise: "Avengers" },
);
series(
  "Marvel Future Avengers",
  72710,
  "2017-07-22,2018-07-30",
  "Animazione",
  "Future Avengers",
  { franchise: "Avengers" },
);
series(
  "Spidey and His Amazing Friends",
  127635,
  "2021-08-06,2022-08-19,2024-01-08",
  "Animazione",
  "Spidey and Friends",
  { franchise: "Spider-Man" },
);
films(
  "Animazione",
  "Marvel animato — Film indipendenti",
  `
Ultimate Avengers: The Movie|2006-02-21|14609|Avengers
Ultimate Avengers 2|2006-08-08|14611|Avengers
The Invincible Iron Man|2007-01-23|13647|Iron Man
Doctor Strange|2007-08-14|14830|Doctor Strange
Next Avengers: Heroes of Tomorrow|2008-09-02|14613|Avengers
Hulk vs. Wolverine|2009-01-27|101099|Hulk
Hulk vs. Thor|2009-01-27|101098|Hulk
Planet Hulk|2010-02-02|30685|Hulk
Thor: Tales of Asgard|2011-05-17|63736|Thor
Iron Man: Rise of Technovore|2013-04-16|169934|Iron Man
Iron Man & Hulk: Heroes United|2013-12-03|230896|Iron Man
Avengers Confidential: Black Widow & Punisher|2014-03-25|257346|Avengers
Iron Man & Captain America: Heroes United|2014-07-29|284274|Iron Man
Big Hero 6|2014-11-07|177572|Big Hero 6
Hulk: Where Monsters Dwell|2016-10-21|422153|Hulk
`,
  { notes: "Film animato in continuità separata dal MCU principale." },
);
const firstSteps = seeds.find(
  (s) => s.originalTitle === "The Fantastic Four: First Steps",
);
firstSteps.universe = "MCU — Terra-828";
firstSteps.continuity = "Universo alternativo collegato al multiverso MCU";
const crossover = seeds.find((s) => s.originalTitle === "Deadpool & Wolverine");
crossover.universe = "MCU — TVA / Multiverso";
crossover.continuity = "Crossover MCU / Terra-10005 (Fox)";
seeds.find(
  (s) => s.originalTitle === "The Spider Within: A Spider-Verse Story",
).type = "short";
seeds.find((s) => s.originalTitle === "The Punisher: One Last Kill").official =
  "https://thewaltdisneycompany.com/news/the-punisher-one-last-kill/";
seeds.find((s) => s.originalTitle === "Spider-Man: Brand New Day").official =
  "https://www.sonypictures.com/movies/spidermanbrandnewday";
seeds.find(
  (s) => s.originalTitle === "Spider-Man: Beyond the Spider-Verse",
).official =
  "https://www.sonypicturesanimation.com/projects/films/spider-man-beyond-spider-verse";
seeds.find((s) => s.originalTitle === "Avengers: Doomsday").official =
  "https://movies.disney.com/avengers-doomsday";
seeds.find(
  (s) => s.originalTitle === "Ghost Rider: Spirit of Vengeance",
).firstYear = 2011;
seeds.find(
  (s) => s.originalTitle === "The Spider Within: A Spider-Verse Story",
).firstYear = 2023;
seeds.find(
  (s) => s.originalTitle === "The Amazing Spider-Man" && s.type === "series",
).firstYear = 1978;
seeds.find((s) => s.originalTitle === "Marvel Future Avengers").aliases = [
  "Marvel's Future Avengers",
];
seeds.find((s) => s.originalTitle === "Marvel’s Avengers Assemble").aliases = [
  "Marvel's Avengers",
];
for (const seed of seeds)
  seed.originalTitle = seed.originalTitle.replace(/[’‘]/g, "'");
// Bound concurrency avoids overwhelming public sources.
for (let i = 0; i < seeds.length; i += 5)
  await Promise.all(seeds.slice(i, i + 5).map(processSeed));
titles.sort(
  (a, b) =>
    a.releaseDate.localeCompare(b.releaseDate) || a.id.localeCompare(b.id),
);
titles.forEach((t, i) => (t.releaseOrder = i + 1));
// MCU order is editorial and approximate: flashbacks and concurrent stories prevent exact total ordering.
const mcuChrono = [
  "Captain America: The First Avenger",
  "Captain Marvel",
  "Iron Man",
  "Iron Man 2",
  "The Incredible Hulk",
  "Marvel One-Shot: The Consultant",
  "Marvel One-Shot: A Funny Thing Happened on the Way to Thor’s Hammer",
  "Thor",
  "The Avengers",
  "Marvel One-Shot: Item 47",
  "Thor: The Dark World",
  "Iron Man 3",
  "Marvel One-Shot: All Hail the King",
  "Captain America: The Winter Soldier",
  "Guardians of the Galaxy",
  "Guardians of the Galaxy Vol. 2",
  "I Am Groot",
  "Avengers: Age of Ultron",
  "Ant-Man",
  "Captain America: Civil War",
  "Black Widow",
  "Black Panther",
  "Spider-Man: Homecoming",
  "Doctor Strange",
  "Thor: Ragnarok",
  "Ant-Man and the Wasp",
  "Avengers: Infinity War",
  "Avengers: Endgame",
  "WandaVision",
  "Shang-Chi and the Legend of the Ten Rings",
  "The Falcon and the Winter Soldier",
  "Spider-Man: Far From Home",
  "Eternals",
  "Spider-Man: No Way Home",
  "Doctor Strange in the Multiverse of Madness",
  "Hawkeye",
  "Moon Knight",
  "Black Panther: Wakanda Forever",
  "Echo",
  "She-Hulk: Attorney at Law",
  "Ms. Marvel",
  "Thor: Love and Thunder",
  "Werewolf by Night",
  "The Guardians of the Galaxy Holiday Special",
  "Ant-Man and the Wasp: Quantumania",
  "Guardians of the Galaxy Vol. 3",
  "Secret Invasion",
  "The Marvels",
  "Agatha All Along",
  "Daredevil: Born Again",
  "Ironheart",
  "Captain America: Brave New World",
  "Thunderbolts*",
  "Wonder Man",
  "The Punisher: One Last Kill",
  "Spider-Man: Brand New Day",
  "VisionQuest",
];
const foxChrono = [
  "X-Men: First Class",
  "X-Men: Days of Future Past",
  "X-Men Origins: Wolverine",
  "X-Men",
  "X2",
  "X-Men: The Last Stand",
  "The Wolverine",
  "X-Men: Apocalypse",
  "Dark Phoenix",
  "Deadpool",
  "Deadpool 2",
  "The New Mutants",
  "Logan",
];
mcuChrono.splice(1, 0, "Marvel One-Shot: Agent Carter");
const groups = [...new Set(titles.map((t) => t.timelineGroup))].sort();
for (const group of groups) {
  const internal = titles.filter((t) => t.timelineGroup === group);
  const order =
    group === "MCU" ? mcuChrono : group === "X-Men / Fox" ? foxChrono : null;
  if (order)
    internal.sort((a, b) => {
      const names = order.map(normalize);
      const x = names.indexOf(normalize(a.originalTitle)),
        y = names.indexOf(normalize(b.originalTitle));
      return (
        (x < 0 ? 999 : x) - (y < 0 ? 999 : y) || a.releaseOrder - b.releaseOrder
      );
    });
  internal.forEach((t, i) => {
    const uncertain =
      group.includes("Multiverso") ||
      group.includes("TVA") ||
      group.includes("Legacy") ||
      group.includes("indipendenti") ||
      group.includes("SHIELD") ||
      t.originalTitle === "Eyes of Wakanda" ||
      t.status === "upcoming";
    if (!uncertain) {
      t.chronologicalOrder = i + 1;
      t.chronologyConfidence =
        group === "Spider-Man Raimi" || group === "Spider-Man Webb"
          ? "confirmed"
          : "approximate";
      t.chronologyNotes =
        group === "X-Men / Fox"
          ? "Timeline ramificate: gli eventi del passato in Days of Future Past cambiano il futuro. Logan è ambientato nel 2029; collocazione complessiva approssimativa."
          : group === "MCU"
            ? "Ordine editoriale interno approssimativo. I flashback non determinano la posizione; le stagioni Defenders seguono l’ordine di pubblicazione relativo."
            : "Ordine della continuità specifica; le stagioni seguono la progressione della serie.";
    }
    if (group === "Marvel Legacy") {
      t.timelineGroup =
        `Legacy — ${t.franchise} ${t.franchise === "Hulk" ? "2003" : t.year < 1995 ? t.year : ""}`.trim();
    }
  });
}
// MCU / Defenders / Marvel Television form the central, release-ordered journey.
// Earlier adaptations are introduced only when their connections become useful.
let recommended = titles.filter(
  (t) =>
    ["MCU", "Defenders", "Marvel Television"].includes(t.category) &&
    t.status === "released",
);
function insertBefore(selected, target) {
  recommended = recommended.filter((t) => !selected.includes(t));
  const index = recommended.findIndex((t) => t.originalTitle === target);
  recommended.splice(index < 0 ? recommended.length : index, 0, ...selected);
}
insertBefore(
  titles.filter(
    (t) =>
      t.type === "movie" &&
      ["Spider-Man Raimi", "Spider-Man Webb"].includes(t.universe),
  ),
  "Spider-Man: No Way Home",
);
const multiversePreparation = titles.filter(
  (t) =>
    t.status === "released" &&
    t.type === "movie" &&
    (t.category === "X-Men" ||
      [
        "legacy-1998-blade",
        "legacy-2003-daredevil",
        "legacy-2005-elektra",
        "fantastic-four-2005-fantastic-four",
        "fantastic-four-2007-fantastic-four-rise-of-the-silver-surfer",
      ].includes(t.id)),
);
insertBefore(multiversePreparation, "Deadpool & Wolverine");
// Complete the archive with coherent companion blocks, then announced future releases.
const appendixCategories = [
  "Sony / Venom",
  "Spider-Verse",
  "Spider-Man",
  "Fantastic Four",
  "X-Men",
  "Legacy",
  "Animazione",
];
for (const category of appendixCategories) {
  const remaining = titles.filter(
    (t) =>
      t.status === "released" &&
      t.category === category &&
      !recommended.includes(t),
  );
  const universes = [...new Set(remaining.map((t) => t.universe))];
  for (const universe of universes)
    recommended.push(...remaining.filter((t) => t.universe === universe));
}
recommended.push(...titles.filter((t) => !recommended.includes(t)));
recommended.forEach((t, i) => (t.recommendedOrder = i + 1));
const orders = {
  cutoff,
  release: {
    label: "Ordine di uscita",
    description:
      "Prima distribuzione cinematografica / streaming o prima trasmissione di stagione. Date di riferimento prevalentemente USA; non indica la disponibilità nei servizi italiani.",
    ids: titles.map((t) => t.id),
  },
  chronological: {
    label: "Cronologia per universo",
    description:
      "Continuità separate. Ordini interni approssimativi dove indicato; i titoli senza collocazione certa compaiono in uscita relativa.",
    groups: [...new Set(titles.map((t) => t.timelineGroup))]
      .sort()
      .map((group) => ({
        id: slug(group),
        label: group,
        ids: titles
          .filter((t) => t.timelineGroup === group)
          .sort(
            (a, b) =>
              (a.chronologicalOrder ?? 999) - (b.chronologicalOrder ?? 999) ||
              a.releaseOrder - b.releaseOrder,
          )
          .map((t) => t.id),
      })),
  },
  recommended: {
    label: "Percorso consigliato",
    description:
      "Consiglio editoriale fan-made: inizia da Iron Man (2008), segue MCU e serie collegate in uscita, introduce Raimi e Webb prima di No Way Home e Fox / alcuni classici prima di Deadpool & Wolverine. Gli altri universi sono percorsi complementari in appendice; le uscite future vengono alla fine. Non è una cronologia ufficiale.",
    ids: recommended.map((t) => t.id),
  },
};
const missing = titles
  .filter((t) => !posters[t.id]?.verified)
  .map((t) => ({
    id: t.id,
    title: t.title,
    url: posters[t.id]?.url || null,
    sourceUrl: t.sourceUrl,
  }));
await fs.writeFile(
  path.join(root, "src/data/titles.json"),
  JSON.stringify(titles, null, 2) + "\n",
);
await fs.writeFile(
  path.join(root, "src/data/posters.json"),
  JSON.stringify(posters, null, 2) + "\n",
);
await fs.writeFile(
  path.join(root, "src/data/viewing-orders.json"),
  JSON.stringify(orders, null, 2) + "\n",
);
await fs.writeFile(
  path.join(root, "reports/posters-missing.json"),
  JSON.stringify(missing, null, 2) + "\n",
);
await fs.writeFile(
  path.join(root, "reports/posters-generation.json"),
  JSON.stringify(
    {
      checkedAt,
      cutoff,
      total: titles.length,
      verified: titles.length - missing.length,
      seasonSpecific: Object.values(posters).filter(
        (p) => p.seasonSpecific && p.verified,
      ).length,
      issues,
    },
    null,
    2,
  ) + "\n",
);
await fs.writeFile(
  path.join(root, "reports/posters-resolved-ids.json"),
  JSON.stringify(resolvedIds, null, 2) + "\n",
);
console.log(
  JSON.stringify(
    {
      total: titles.length,
      verified: titles.length - missing.length,
      missing: missing.length,
      issues: issues.length,
    },
    null,
    2,
  ),
);
