# Asset del terminale TVA

- `tva-logo.svg`: riproduzione vettoriale del marchio Time Variance Authority, Marvel Studios, da https://commons.wikimedia.org/wiki/File:Time_Variance_Authority_logo_black_and_white.svg. La geometria del lettering è preservata; il colore viene applicato con CSS.
- `miss-minutes-original.gif`: animazione originale pubblicata da Disney D23, https://d23.com/mm_v4_250x250/; file https://d23.com/app/uploads/2023/10/MM_V4_250x250.gif.
- `miss-minutes.webm` e `miss-minutes-poster.png`: transcodifica della stessa animazione e primo fotogramma, senza ridisegno del personaggio. Il WebM mantiene la trasparenza e riduce il peso del download; la GIF è il fallback.
- `fonts/jost.ttf`: Jost di Owen Earl, https://github.com/google/fonts/tree/main/ofl/jost; licenza in `fonts/jost-OFL.txt`.
- `fonts/archivo-narrow.ttf`: Archivo Narrow, https://github.com/google/fonts/tree/main/ofl/archivonarrow; licenza in `fonts/archivo-narrow-OFL.txt`.
- `temporal-score.m4a`: composizione originale MARVEL WATCHVERSE di 96 secondi, generata da `scripts/compose-temporal-score.mjs`. Non contiene registrazioni o campioni della colonna sonora di Loki.
- `infinity-snap.m4a`: composizione originale di 14 secondi, generata da `scripts/compose-infinity-score.mjs`: sub-bassi, coro sintetico dissonante, campane e vento. Non contiene campioni di colonne sonore Marvel. Analisi in `reports/infinity-score-analysis.json`.
- Opening di prima visita: lettore audio nativo; nessun player YouTube. Il file della sigla deve ancora essere fornito e non è incluso nel repository. Configurazione in `public/data/opening-audio.json`.
- `infinity-gauntlet-v2.webp`: asset CGI generato con lo strumento integrato image_gen, ispirato al Guanto di Infinity War; non è un asset originale del film. Metallo trasparente con sedi vuote, gemme e luminescenze SVG animate nel codice. Prompt e riferimento alla replica Hasbro in `reports/gauntlet-design.md`.

Il logo e Miss Minutes appartengono ai rispettivi titolari e non rientrano nella licenza MIT del codice. Progetto fan-made indipendente, non affiliato a Marvel o Disney. I font dei testi sono una scelta grafica ispirata alla segnaletica TVA; non vengono presentati come font ufficiali della serie.
