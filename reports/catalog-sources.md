# Fonti, copertura e limiti del catalogo

Data di riferimento: **8 ottobre 2026**. Il catalogo contiene film, stagioni di serie, cortometraggi e speciali. Una stagione è una voce distinta, non una serie interamente completata.

Generazione finale: **255 voci**, di cui **251 pubblicate** e **4 in arrivo**. Tutte hanno un identificativo TMDB verificato e un riferimento a una locandina raggiungibile; **136 poster sono specifici della stagione**. Il report finale registra **0 poster mancanti** e **0 problemi di risoluzione**. Sono presenti 255 sinossi brevi e 117 durate; le durate di stagione non vengono inventate. Questi numeri descrivono le verifiche HTTP, non sostituiscono il controllo visuale del sito.

## Metadati e locandine

Gli identificativi TMDB sono verificati sulle pagine pubbliche del titolo: nome normalizzato, formato movie/tv e anno iniziale quando esposto dal sito. Il generatore estrae `og:image` dalla pagina principale del film o dalla pagina della singola stagione. La URL della fonte, la URL esatta del poster, la data del controllo e `seasonSpecific` sono salvati nel manifest. Le immagini vengono controllate con una richiesta HTTP HEAD e un Content-Type `image/*`. La visualizzazione nel browser è un controllo separato, riportato dai test del progetto.

La verifica considera anche varianti canoniche del titolo (es. Fantastic Four / Fantastic 4 e il nome TMDB di Avengers Assemble). Per produzioni con anteprima precedente alla distribuzione di riferimento, l’anno usato per verificare l’identità può essere diverso dall’anno della data di uscita visualizzata: Ghost Rider: Spirit of Vengeance (produzione / anteprima 2011, distribuzione 2012) e The Spider Within (anteprima 2023, pubblicazione online 2024). Il registro `posters-resolved-ids.json` conserva i risultati di risoluzione verificati.

Le sinossi sono brevi estratti del testo italiano pubblico TMDB, limitati a 24 parole per fonte e indicati con ellissi quando troncati; non vengono completati inventando dettagli. Il frontend non chiama Wikipedia né TMDB per effettuare ricerche.

Se una pagina di stagione non è disponibile, viene utilizzato il poster generale della medesima serie; se l’identità non è verificabile, la URL rimane nulla. Non si sceglie mai il poster di un altro titolo. I problemi e le locandine mancanti vengono elencati nei report JSON.

Le pagine specifiche di origine sono conservate per ogni titolo in `src/data/titles.json` e per ogni poster in `src/data/posters.json`. La cache HTML di sviluppo è esclusa dalla pubblicazione. Non vengono scaricate né redistribuite immagini protette nel repository; il sito utilizza riferimenti remoti a TMDB. Le immagini restano dei rispettivi titolari. [TMDB: uso del servizio e attribuzione](https://www.themoviedb.org/terms-of-use), [documentazione immagini](https://developer.themoviedb.org/docs/image-basics).

## Date contemporanee verificate su fonti ufficiali

| Titolo | Data di riferimento | Fonte primaria |
| --- | --- | --- |
| Wonder Man | 27 gennaio 2026, pubblicato | [The Walt Disney Company](https://thewaltdisneycompany.com/news/marvel-television-wonder-man/) |
| Daredevil: Born Again, stagione 2 | 24 marzo 2026, pubblicato | [Disney / ABC](https://abc.com/news/75bfeef7-c9e7-489c-a47d-449fa1ded8b1/category/2743918) |
| The Punisher: One Last Kill | 12 maggio 2026, pubblicato | [The Walt Disney Company](https://thewaltdisneycompany.com/news/the-punisher-one-last-kill/) |
| Spider-Noir | 27 maggio 2026, pubblicato | [About Amazon](https://www.aboutamazon.com/news/entertainment/prime-video-movies-tv-shows-music-sports-may-2026) |
| X-Men ’97, stagione 2 | 1 luglio 2026, pubblicato | [Disney UK Press](https://press.disney.co.uk/news/marvel-animations-xmen-97-returns-to-disney-for-second-season-on-july-1) |
| Spider-Man: Brand New Day | 31 luglio 2026, pubblicato | [Sony Pictures](https://www.sonypictures.com/movies/spidermanbrandnewday), [trailer Sony](https://www.youtube.com/watch?v=62bIsvRcPv0) |
| VisionQuest | 14 ottobre 2026, in arrivo | [Marvel](https://www.marvel.com/articles/tv-shows/marvel-television-visionquest-release-date?pubDate=20260513) |
| Avengers: Doomsday | 18 dicembre 2026, in arrivo | [Disney Movies](https://movies.disney.com/avengers-doomsday) |
| Spider-Man: Beyond the Spider-Verse | 18 giugno 2027, in arrivo | [Sony Pictures Animation](https://www.sonypicturesanimation.com/projects/films/spider-man-beyond-spider-verse) |

Per le uscite cinematografiche sono utilizzate date di distribuzione di riferimento, prevalentemente USA. Per le stagioni si legge la prima data di episodio dalla pagina TMDB ove disponibile; le date contemporanee sopra sono mantenute da fonti primarie. Le date possono differire da anteprime festivaliere, distribuzione internazionale o disponibilità italiana. Il catalogo non verifica la disponibilità attuale negli abbonamenti streaming.

## Continuità e ordini

La release è un ordinamento globale per data di distribuzione di riferimento. La cronologia è raggruppata per continuità: nessun indice narrativo globale è presentato come canone. MCU, Raimi, Webb, Fox, animazione e adattamenti legacy rimangono distinti. Le serie Defenders sono collegate al MCU ma hanno un gruppo interno dedicato per evitare di assegnare una collocazione precisa fra tutti i film. Marvel Television segnala esplicitamente le collocazioni/canonicità incerte. Legion, The Gifted, Helstrom e Spider-Noir hanno continuità autonome.

Gli ordini MCU e X-Men / Fox sono proposte editoriali approssimative. X-Men presenta diramazioni e cambiamenti temporali: la sequenza non risolve né cancella le contraddizioni. Loki / TVA, What If...?, Eyes of Wakanda, film animati indipendenti e i titoli futuri possono avere ordine narrativo nullo. Il percorso consigliato è fan-made e parte da Iron Man (2008), poi segue MCU / Defenders / Marvel Television in uscita. Raimi e Webb sono inseriti prima di No Way Home; film Fox e alcuni classici (Blade, Daredevil, Elektra e Fantastic Four 2005/2007) precedono Deadpool & Wolverine. Sony, Spider-Verse, gli altri legacy e l’animazione compongono percorsi complementari in appendice, raggruppati per universo. I titoli futuri vengono alla fine. Ogni ID compare esattamente una volta.

## Manutenzione

Aggiornare le voci sorgente in `scripts/build-catalog.mjs`, verificare la fonte primaria per le nuove uscite, quindi eseguire `node scripts/build-catalog.mjs`. `--refresh` ripete i controlli senza riutilizzare la cache; `--offline` ricostruisce da pagine già acquisite e manifest verificato nelle ultime 24 ore. La generazione avviene in sviluppo, mai nel browser. Trame non verificate sono lasciate vuote anziché inventate.
