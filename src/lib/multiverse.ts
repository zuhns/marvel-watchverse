import { titles, sortTitles, contentTier, normalize } from "./catalog";
import type { Title } from "../types";

export type Sector = "cinema" | "animation" | "extra";
export type Earth = {
  id: string;
  name: string;
  designation: string;
  sector: Sector;
  color: string;
  kind: "screen" | "reference" | "multiple" | "unknown" | "outside";
  description: string;
  note: string;
  source?: { label: string; url: string };
  titles: Title[];
  crossovers: Title[];
};
const wiki = (number: string) => ({
  label: "Riferimento · Marvel Database",
  url: `https://marvel.fandom.com/wiki/Earth-${number}`,
});
const byUniverse = (...universes: string[]) =>
  titles.filter((t) => universes.includes(t.universe));
const byName = (...names: string[]) =>
  titles.filter((t) => names.includes(t.originalTitle));
const colors = [
  "#f1bb72",
  "#bb9aff",
  "#f47783",
  "#69cfe3",
  "#8bd3a4",
  "#e6aaec",
];
type Entry = Omit<Earth, "titles" | "crossovers" | "color"> & {
  titles: Title[];
  crossovers?: Title[];
  color?: string;
};
const entries: Entry[] = [
  {
    id: "616",
    name: "Marvel Cinematic Universe",
    designation: "Terra-616",
    sector: "cinema",
    kind: "screen",
    description:
      "Il mondo degli Avengers. Il filo centrale della saga, da Iron Man alle nuove generazioni di eroi.",
    note: "616 è la designazione usata nel MCU sullo schermo. I repertori editoriali e Spider-Verse usano anche 199999. Le serie Marvel Television sono raccolte separatamente, senza equiparare tutte le loro ramificazioni.",
    source: {
      label: "Film · Doctor Strange nel Multiverso della Follia",
      url: "https://www.marvel.com/movies/doctor-strange-in-the-multiverse-of-madness",
    },
    titles: byUniverse("MCU"),
    color: "#f1bb72",
  },
  {
    id: "10005",
    name: "X-Men & Deadpool",
    designation: "Terra-10005",
    sector: "cinema",
    kind: "screen",
    description:
      "Mutanti, futuri riscritti e un mercenario impossibile da fermare. Il percorso cinematografico Fox incontra la TVA.",
    note: "10005 è identificata in Deadpool & Wolverine. Questo dossier raccoglie la saga Fox e i suoi futuri alternativi: viaggi nel tempo e Logan non costituiscono una cronologia unica senza contraddizioni. La Terra del nuovo Wolverine non è numerata nel film.",
    source: {
      label: "Film · Deadpool & Wolverine",
      url: "https://www.marvel.com/movies/deadpool-and-wolverine",
    },
    titles: byUniverse("X-Men / Fox"),
    crossovers: byName("Deadpool & Wolverine"),
  },
  {
    id: "96283",
    name: "Spider-Man · Raimi",
    designation: "Terra-96283",
    sector: "cinema",
    kind: "reference",
    description:
      "Il Peter Parker di Tobey Maguire: responsabilità, sacrificio e la trilogia di Sam Raimi.",
    note: "Designazione di repertorio. No Way Home è un crossover ambientato nel MCU, non il quarto film di questa Terra.",
    source: wiki("96283"),
    titles: byUniverse("Spider-Man Raimi"),
    crossovers: byName("Spider-Man: No Way Home"),
  },
  {
    id: "120703",
    name: "Spider-Man · Webb",
    designation: "Terra-120703",
    sector: "cinema",
    kind: "reference",
    description:
      "Andrew Garfield e una nuova origine per Spider-Man. Un legame con Gwen Stacy che attraversa il multiverso.",
    note: "Designazione di repertorio per i due film di Marc Webb. Il ritorno di Peter in No Way Home è mostrato tra i crossover.",
    source: wiki("120703"),
    titles: byUniverse("Spider-Man Webb"),
    crossovers: byName("Spider-Man: No Way Home"),
  },
  {
    id: "688",
    name: "Venom & universo Sony",
    designation: "Terra-688",
    sector: "cinema",
    kind: "screen",
    description:
      "Eddie Brock, il suo simbionte e gli antieroi del Sony Spider-Man Universe.",
    note: "688 identifica il mondo di Venom in Across the Spider-Verse. Qui sono raccolti anche i film dello stesso ciclo produttivo Sony; Madame Web non viene dichiarato ambientato sulla medesima Terra.",
    source: {
      label: "Film · Spider-Man: Across the Spider-Verse",
      url: "https://www.sonypictures.com/movies/spidermanacrossthespiderverse",
    },
    titles: byUniverse("Sony Spider-Man Universe").filter(
      (t) => t.originalTitle !== "Madame Web",
    ),
    crossovers: byName(
      "Spider-Man: No Way Home",
      "Spider-Man: Across the Spider-Verse",
    ),
  },
  {
    id: "828",
    name: "Fantastic Four · First Steps",
    designation: "Terra-828",
    sector: "cinema",
    kind: "screen",
    description:
      "Un mondo retrofuturistico. Una famiglia di esploratori. Una Terra diversa per i Fantastici Quattro dei Marvel Studios.",
    note: "Terra distinta dal mondo principale degli Avengers, confermata da Marvel Studios.",
    source: {
      label: "Marvel · Kevin Feige e Terra-828",
      url: "https://www.marvel.com/articles/movies/fantastic-four-first-steps-avengers-doomsday-kevin-feige",
    },
    titles: byUniverse("MCU — Terra-828"),
  },
  {
    id: "838",
    name: "Gli Illuminati",
    designation: "Terra-838",
    sector: "cinema",
    kind: "screen",
    description:
      "Una realtà alternativa protetta dagli Illuminati, raggiunta da Stephen Strange e America Chavez.",
    note: "Una Terra visitata in Multiverse of Madness: le sue varianti non sono i personaggi delle saghe Fox o delle serie Inhumans.",
    source: {
      label: "Film · Doctor Strange nel Multiverso della Follia",
      url: "https://www.marvel.com/movies/doctor-strange-in-the-multiverse-of-madness",
    },
    titles: byName("Doctor Strange in the Multiverse of Madness"),
  },
  {
    id: "121698",
    name: "Fantastic Four · 2005",
    designation: "Terra-121698",
    sector: "cinema",
    kind: "reference",
    description:
      "La famiglia fantastica di Tim Story, tra Doom, Silver Surfer e la minaccia di Galactus.",
    note: "Continuità dei film del 2005 e 2007, distinta dal reboot e da Terra-828.",
    source: wiki("121698"),
    titles: byUniverse("Fantastic Four Fox 2005"),
  },
  {
    id: "15866",
    name: "Fantastic Four · 2015",
    designation: "Terra-15866",
    sector: "cinema",
    kind: "reference",
    description:
      "Il reboot del 2015: quattro giovani scienziati attraversano una dimensione inesplorata.",
    note: "Continuità autonoma del film di Josh Trank.",
    source: wiki("15866"),
    titles: byUniverse("Fantastic Four Fox 2015"),
  },
  {
    id: "tva",
    name: "TVA & Loki",
    designation: "Fuori dal tempo",
    sector: "cinema",
    kind: "outside",
    description:
      "Il luogo da cui osservare le ramificazioni. Loki, la TVA e le storie che attraversano più realtà.",
    note: "La TVA e il Vuoto non sono una Terra. Il disegno dei rami è una mappa narrativa ispirata a Loki, non una genealogia ufficiale delle realtà.",
    source: {
      label: "Marvel · La Sacra Linea Temporale",
      url: "https://www.marvel.com/articles/tv-shows/loki-episode-1-event-report-recap",
    },
    titles: byUniverse("MCU — TVA / Multiverso"),
  },
  {
    id: "1610",
    name: "Spider-Verse · Miles",
    designation: "Terra-1610",
    sector: "animation",
    kind: "screen",
    description:
      "Miles Morales. Brooklyn. Un morso che apre le porte a infinite versioni di Spider-Man.",
    note: "Numero usato nei film animati Sony; il suffisso B nei repertori distingue questa realtà da quella dei fumetti. I film attraversano anche altre Terre.",
    source: {
      label: "Sony · Spider-Verse",
      url: "https://www.sonypictures.com/movies/spidermanacrossthespiderverse",
    },
    titles: byUniverse("Spider-Verse"),
  },
  {
    id: "65",
    name: "Spider-Verse · Gwen",
    designation: "Terra-65",
    sector: "animation",
    kind: "screen",
    description:
      "La realtà di Gwen Stacy: acquerelli, musica e una Spider-Woman alla ricerca del proprio posto.",
    note: "Numero cinematografico, distinto dalla Terra-65 dei fumetti. Qui trovi i film in cui compare la Gwen di Spider-Verse.",
    source: {
      label: "Sony · Spider-Verse",
      url: "https://www.sonypictures.com/movies/spidermanacrossthespiderverse",
    },
    titles: byName(
      "Spider-Man: Into the Spider-Verse",
      "Spider-Man: Across the Spider-Verse",
    ),
  },
  {
    id: "42",
    name: "Spider-Verse · Terra senza Spider-Man",
    designation: "Terra-42",
    sector: "animation",
    kind: "screen",
    description:
      "Il ragno che avrebbe dovuto creare uno Spider-Man è scomparso. Miles si ritrova nella realtà sbagliata.",
    note: "La realtà visitata nel finale di Across the Spider-Verse, distinta dalla Terra di origine di Miles.",
    source: {
      label: "Sony · Spider-Verse",
      url: "https://www.sonypictures.com/movies/spidermanacrossthespiderverse",
    },
    titles: byName("Spider-Man: Across the Spider-Verse"),
  },
  {
    id: "92131",
    name: "X-Men ’92 / ’97 & Spider-Man ’94",
    designation: "Terra-92131",
    sector: "animation",
    kind: "reference",
    description:
      "La grande stagione dei mutanti animati e dello Spider-Man degli anni Novanta.",
    note: "Repertorio delle serie X-Men e Spider-Man anni Novanta. X-Men ’97 continua la serie originale.",
    source: wiki("92131"),
    titles: byUniverse("X-Men animato 1992", "Spider-Man animato 1994"),
  },
  {
    id: "8096",
    name: "Avengers EMH & Wolverine",
    designation: "Terra-8096",
    sector: "animation",
    kind: "reference",
    description:
      "Gli eroi più potenti della Terra e gli X-Men di Wolverine, in un universo animato condiviso.",
    note: "Repertorio di Avengers EMH e Wolverine and the X-Men. Sono inclusi Hulk Vs. e Thor: Tales of Asgard; altri film animati sono raccolti a parte.",
    source: wiki("8096"),
    titles: [
      ...byUniverse("Avengers EMH", "Wolverine and the X-Men"),
      ...byName("Hulk vs. Thor", "Hulk vs. Wolverine", "Thor: Tales of Asgard"),
    ],
  },
  {
    id: "11052",
    name: "X-Men: Evolution",
    designation: "Terra-11052",
    sector: "animation",
    kind: "reference",
    description:
      "Gli X-Men adolescenti, fra la scuola di Xavier e la vita a Bayville.",
    note: "Numero dell’Official Handbook, riportato nel repertorio Marvel Database.",
    source: wiki("11052"),
    titles: byUniverse("X-Men Evolution"),
  },
  {
    id: "26496",
    name: "Spectacular Spider-Man",
    designation: "Terra-26496",
    sector: "animation",
    kind: "reference",
    description:
      "Il Peter Parker di Greg Weisman: due stagioni di amicizie, avversari e doppia vita.",
    note: "Realtà autonoma della serie animata, con designazione di repertorio.",
    source: wiki("26496"),
    titles: byUniverse("Spectacular Spider-Man"),
  },
  {
    id: "14042",
    name: "Disk Wars",
    designation: "Terra-14042",
    sector: "animation",
    kind: "reference",
    description:
      "Gli Avengers racchiusi nei DISK, in un’avventura anime attraverso il mondo.",
    note: "Numero dell’Appendix to the Handbook, riportato nel repertorio.",
    source: wiki("14042"),
    titles: byUniverse("Disk Wars"),
  },
  {
    id: "135263",
    name: "Fantastic Four · Animato 2006",
    designation: "Terra-135263",
    sector: "animation",
    kind: "reference",
    description:
      "La famiglia fantastica nella serie World’s Greatest Heroes del 2006.",
    note: "Designazione dell’Official Handbook per questa serie animata.",
    source: wiki("135263"),
    titles: byUniverse("Fantastic Four animato 2006"),
  },
  {
    id: "904913",
    name: "Iron Man: Armored Adventures",
    designation: "Terra-904913",
    sector: "animation",
    kind: "reference",
    description:
      "Tony Stark adolescente, Pepper, Rhodey e un’armatura che cambia tutto.",
    note: "Designazione di repertorio della serie, distinta dai fumetti tie-in.",
    source: wiki("904913"),
    titles: byUniverse("Iron Man Armored Adventures"),
  },
  {
    id: "17741",
    name: "Future Avengers",
    designation: "Terra-17741",
    sector: "animation",
    kind: "reference",
    description:
      "Una nuova generazione di ragazzi cresce accanto agli Avengers.",
    note: "Designazione di repertorio della serie anime.",
    source: wiki("17741"),
    titles: byUniverse("Future Avengers"),
  },
  {
    id: "751263",
    name: "Spider-Man Unlimited",
    designation: "Terra-751263",
    sector: "animation",
    kind: "reference",
    description:
      "Un viaggio sulla Contro-Terra, tra ribelli, simbionti e l’Alto Evoluzionario.",
    note: "Numero dell’Official Handbook per la serie, distinta dallo Spider-Man animato del 1994.",
    source: wiki("751263"),
    titles: byUniverse("Spider-Man Unlimited"),
  },
  {
    id: "91119",
    name: "Super Hero Squad",
    designation: "Terra-91119",
    sector: "animation",
    kind: "reference",
    description: "Un universo di eroi in miniatura e grandi avventure.",
    note: "Designazione della serie TV; i fumetti hanno una numerazione diversa.",
    source: wiki("91119"),
    titles: byUniverse("Super Hero Squad"),
  },
  {
    id: "1226",
    name: "Hit-Monkey & M.O.D.O.K.",
    designation: "Terra-1226",
    sector: "animation",
    kind: "reference",
    description: "Il lato più irriverente dell’animazione Marvel per adulti.",
    note: "Le serie sono associate dal repertorio a questa Terra. Il crossover Offenders previsto non è stato realizzato.",
    source: wiki("1226"),
    titles: byUniverse("Hit-Monkey", "MODOK"),
  },
  {
    id: "121347",
    name: "Ghost Rider · Nicolas Cage",
    designation: "Terra-121347",
    sector: "extra",
    kind: "reference",
    description:
      "Johnny Blaze e lo Spirito della Vendetta, lontani dal mondo degli Avengers.",
    note: "Continuità dei due film di Ghost Rider.",
    source: wiki("121347"),
    titles: byName("Ghost Rider", "Ghost Rider: Spirit of Vengeance"),
  },
];

const referenceEarth = (
  id: string,
  name: string,
  sector: Sector,
  list: Title[],
  note: string,
): Entry => ({
  id,
  name,
  sector,
  designation: `Terra-${id}`,
  kind: "reference",
  source: wiki(id),
  titles: list,
  description: `Esplora le storie di ${name}, attraverso tutte le produzioni di questa continuità.`,
  note,
});
const legacyNames = (...names: string[]) =>
  byUniverse("Marvel Legacy").filter((t) => names.includes(t.originalTitle));
entries.push(
  referenceEarth(
    "26320",
    "Blade · Cinema & TV",
    "extra",
    [
      ...legacyNames("Blade", "Blade II", "Blade: Trinity"),
      ...byUniverse("Blade"),
    ],
    "La trilogia cinematografica e la serie TV del 2006. La serie resta un percorso Nerd extra nell’archivio.",
  ),
  referenceEarth(
    "701306",
    "Daredevil & Elektra · Cinema",
    "extra",
    legacyNames("Daredevil", "Elektra"),
    "I film del 2003 e 2005, distinti dalla Defenders Saga del MCU.",
  ),
  referenceEarth(
    "400005",
    "Hulk · Bill Bixby & Lou Ferrigno",
    "extra",
    [
      ...byUniverse("Hulk televisivo 1977"),
      ...legacyNames(
        "The Incredible Hulk Returns",
        "The Trial of the Incredible Hulk",
        "The Death of the Incredible Hulk",
      ),
    ],
    "La serie storica e i tre film TV, con David Banner e il suo alter ego interpretato da Lou Ferrigno.",
  ),
  referenceEarth(
    "400083",
    "Hulk · Ang Lee",
    "extra",
    legacyNames("Hulk"),
    "La realtà del film del 2003, distinta da L’incredibile Hulk del MCU.",
  ),
  referenceEarth(
    "6799",
    "Spider-Man · Animato 1967",
    "animation",
    byUniverse("Spider-Man animato 1967"),
    "La prima serie animata di Spider-Man e le sue tre stagioni, in una realtà autonoma.",
  ),
  referenceEarth(
    "8107",
    "Spider-Man & Hulk · Animazione ’80",
    "animation",
    byUniverse("Spider-Man animato 1981", "Hulk animato 1982"),
    "Spider-Man, Amazing Friends e Hulk degli anni Ottanta, raccolti dal repertorio in questa continuità.",
  ),
  referenceEarth(
    "12041",
    "Ultimate Spider-Man & Avengers",
    "animation",
    titles.filter(
      (t) =>
        t.originalTitle === "Ultimate Spider-Man" ||
        (t.originalTitle === "Marvel's Avengers Assemble" &&
          (t.season ?? 0) < 5) ||
        t.originalTitle === "Hulk and the Agents of S.M.A.S.H." ||
        t.originalTitle === "Hulk: Where Monsters Dwell",
    ),
    "Ultimate Spider-Man, Avengers Assemble stagioni 1–4, Agents of S.M.A.S.H. e Where Monsters Dwell. La stagione 5 di Avengers segue una continuità diversa nel repertorio.",
  ),
  referenceEarth(
    "17628",
    "Spider-Man ’17 & nuovi Avengers",
    "animation",
    [
      ...byUniverse("Spider-Man animato 2017"),
      ...titles.filter(
        (t) =>
          t.originalTitle === "Marvel's Guardians of the Galaxy" ||
          (t.originalTitle === "Marvel's Avengers Assemble" && t.season === 5),
      ),
    ],
    "Spider-Man del 2017, Guardians of the Galaxy e Black Panther’s Quest (Avengers Assemble stagione 5), secondo la distinzione del repertorio.",
  ),
);

// Remaining collections are explicitly unnumbered or contain several realities.
// Never turn a catalog grouping (Legacy, What If..., Marvel Television) into one Earth.
const assigned = new Set(entries.flatMap((e) => e.titles.map((t) => t.id)));
const remaining = titles.filter((t) => !assigned.has(t.id));
for (const universe of [...new Set(remaining.map((t) => t.universe))]) {
  const list = remaining.filter((t) => t.universe === universe);
  const multiple = [
    "Marvel Legacy",
    "Marvel animato — Film indipendenti",
    "Marvel animato 1990s",
    "Marvel animato 2010s",
    "MCU — Multiverso animato",
  ].includes(universe);
  entries.push({
    id: `collection-${normalize(universe)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-$/, "")}`,
    name: universe === "Marvel Legacy" ? "Legacy · Altre realtà" : universe,
    designation: multiple ? "Più Terre" : "Terra non confermata",
    sector: list.every(
      (t) =>
        t.category === "Animazione" ||
        t.universe.includes("animato") ||
        t.universe.includes("Zombies"),
    )
      ? "animation"
      : "extra",
    kind: multiple ? "multiple" : "unknown",
    titles: list,
    description: multiple
      ? "Storie di realtà differenti, raccolte nello stesso dossier per esplorare tutte le loro produzioni."
      : `Il percorso di ${universe}, con tutte le produzioni presenti nell’archivio.`,
    note: multiple
      ? "Raggruppamento editoriale: questi titoli non condividono necessariamente una Terra. Le singole continuità sono indicate nelle schede."
      : "Non attribuiamo un numero definitivo a questa continuità senza una fonte verificata. Consulta la scheda di ogni titolo per i dettagli narrativi.",
  });
}
export const earths: Earth[] = entries.map((e, i) => ({
  ...e,
  color: e.color ?? colors[i % colors.length],
  titles: sortTitles(e.titles, "release"),
  crossovers: e.crossovers ?? [],
}));
export const earthById = (id: string) => earths.find((e) => e.id === id)!;
export function earthMode(earth: Earth) {
  return {
    nerdMode: earth.titles.some((t) => contentTier(t) === "nerd"),
    advancedNerdMode: earth.titles.some((t) => contentTier(t) === "multiverse"),
  };
}
