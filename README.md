# MARVEL WATCHVERSE

**Ogni storia. Ogni universo.** Archivio cinematografico fan-made in italiano, con vere locandine, percorsi di visione, profili per nome utente, amici e maratone condivise.

- Sito: https://zuhns.github.io/marvel-watchverse/
- Repository: https://github.com/zuhns/marvel-watchverse
- Data di riferimento del catalogo: **8 ottobre 2026**.

## Cosa puoi fare

Esplora film, singole stagioni, cortometraggi e speciali. Formati, universi e franchise ammettono selezioni multiple: basta selezionare le caselle o i pulsanti desiderati. Le scelte nello stesso filtro sono alternative; filtri diversi si combinano. Le produzioni future sono separate dai titoli pubblicati e non aumentano il denominatore dei progressi.

L'apertura iniziale usa **Film + Serie**, **Percorso consigliato** e le due modalità Nerd disattivate. I progressi esistenti sono preservati; le preferenze della versione precedente vengono aggiornate una volta a questi valori. Successivamente le scelte esplicite vengono ricordate nel browser.

**Nerd** aggiunge i percorsi TV laterali scelti dal proprietario: Blade (la serie, non i film), The Gifted, Legion, Helstrom, SHIELD, Agent Carter, Inhumans, Runaways, Cloak & Dagger e le altre continuità alternative. È una scelta editoriale di visione, non una dichiarazione sul canone ufficiale.

**Nerd Multiverso** aggiunge Avengers EMH, Disk Wars, Fantastic Four animato 2006, Future Avengers, Hit-Monkey, Iron Man Armored Adventures, i film animati indipendenti, Marvel animato 2010s, Spectacular Spider-Man, Spider-Man animato 2017, Spider-Man Unlimited, Spidey and Friends, Super Hero Squad, X-Men animato 1992, X-Men Evolution e Wolverine and the X-Men. Include anche l'archivio storico, mantenendo accessibili le produzioni dal 1967. Le due scelte sono nel menu a tendina **Modalità Nerd**: puoi attivarle singolarmente, entrambe o disattivarle tutte. Le serie vengono classificate per continuità, includendo tutte le stagioni. Corti e speciali richiedono la selezione del relativo formato.

Il percorso e le statistiche seguono le modalità scelte. Disattivare una modalità nasconde i suoi contenuti senza cancellarne i progressi.

Tre ordini di visione:

1. **Uscita**: prima distribuzione internazionale di riferimento, ordinata globalmente. Le date possono differire dall’uscita italiana.
2. **Cronologia interna**: titoli raggruppati per continuità. Gli X-Men hanno timeline ramificate; le posizioni approssimative sono dichiarate nei dettagli. Le produzioni di canone incerto e l’animazione legacy restano separate.
3. **Consigliato**: consiglio editoriale indipendente; inserisce Raimi/Webb prima di No Way Home e Deadpool/Wolverine prima del crossover. Non è una timeline canonica ufficiale.

**Archivio** è l’unica sezione per catalogo e ordini. Il vecchio collegamento `#orders` apre lo stesso archivio. Nella cronologia ogni intestazione occupa una riga completa sopra la propria griglia, conservando l’allineamento delle locandine.

**Universi** è un terminale TVA con carta invecchiata, comandi fisici e uno schermo CRT anni Ottanta. La Sacra Linea Temporale riprende l’immagine fornita dal proprietario: luce azzurra e viola, ramificazioni sottili, scorrimento continuo ed energia animata. Miss Minutes segue il menu Cinema & MCU, Universi animati e Serie & Legacy. Passando il cursore o usando il focus su un segnale compaiono Terra, universo e descrizione; il clic apre il dossier. L’osservatorio mostra soltanto 32 Terre numerate con fonti, distinguendo identificazioni sullo schermo e designazioni di repertorio. Le Terre non confermate e le raccolte multirealtà sono escluse dalla mappa; tutti i 255 titoli rimangono nell’archivio. La geometria dei rami è editoriale, non una genealogia canonica.

Ogni dossier mostra film, serie, corti e speciali, progressi personali e crossover separati. **Ordina nell’archivio** trasferisce esattamente il dossier, abilita i contenuti Nerd necessari e conserva il filtro al refresh e nel backup. Il menu Tracce filtra le produzioni nella mappa; il selettore raggiunge ogni Terra identificata. Tab e frecce navigano fra i segnali, trascinamento e comandi laterali esplorano il monitor, con zoom fino al 175%. Su telefono la mappa si scorre con il dito. **Ferma il tempo** e la preferenza di sistema per movimento ridotto fermano le animazioni, anche quando quest’ultima cambia a pagina aperta.

La linea temporale è generata in tempo reale con WebGL: filamenti azzurri e viola cambiano forma, si intrecciano e trasportano impulsi luminosi fra ramificazioni e aloni. Non usa un’immagine di sfondo; se WebGL non è disponibile, usa un motore Canvas 2D animato. Il marchio TVA conserva il lettering originale e Miss Minutes usa l’animazione pubblicata da Disney D23. I testi usano Jost e Archivo Narrow, distribuiti localmente con licenza OFL e scelti per avvicinarsi alla segnaletica degli uffici; non sono dichiarati come font ufficiali della produzione. Provenienza degli asset in `public/assets/README.md`.

La revisione grafica del 10 ottobre usa superfici carbone e verde industriale, arancione smaltato e indicatori ambrati, seguendo le fotografie degli apparati TVA nel portfolio di Kasra Farahani. Il chronomonitor ha vetro incassato, viti, maniglia, griglie, manopole decorative e un modulo R&A laterale. La scena temporale aggiunge profondità variabile dei filamenti, veli di luce turbolenti, particelle su tre piani e diffusione luminosa con esposizione controllata. La rappresentazione rimane procedurale e non è un filmato CGI della serie.

Il sito dispone di navigazione fissa con sfondo sfocato, transizioni delle pagine, comparsa progressiva delle sezioni, riflessi e ingrandimento delle locandine, apertura dei dialoghi, barre dei progressi animate e un portale nella Home verso Universi. Un solo osservatore gestisce anche i contenuti aggiunti da filtri e paginazione. La preferenza per movimento ridotto mostra subito tutti i contenuti e disattiva gli effetti; non altera filtri, progressi o dati dei profili.

**Attiva atmosfera** avvia una composizione originale di 96 secondi: accordi che evolvono, coro sintetico, richiami lontani, arpeggi e pulsazioni con riverbero stereo. Il file AAC locale viene caricato solo al clic e riprodotto in ciclo tramite Web Audio. Ha volume regolabile e sfuma prima di sospendersi quando il terminale è in pausa, silenziato o la scheda non è visibile. Uscire da Universi chiude il contesto audio e ferma il motore grafico. La partitura è riproducibile con `scripts/compose-temporal-score.mjs` usando Playwright e FFmpeg.

I progressi usano ID stabili e timestamp in `localStorage`, chiave `marvel-watchverse.v1`. Cambiare ordine o filtri non cambia lo stato visto. I vecchi backup con filtri singoli vengono migrati automaticamente. La pagina progressi mostra dati complessivi e per universo, gli ultimi titoli visti e il prossimo capitolo.

Il pulsante **Accedi** in alto a destra apre il profilo per nome utente. Il nome viene normalizzato in minuscolo e resta memorizzato, senza un comando per cambiarlo o uscire. Inserendo lo stesso nome su un altro dispositivo accedi agli stessi progressi. Il profilo usa solo il nome: chi lo conosce può leggere e modificare i progressi, come richiesto dal proprietario. Non ci sono email o password. Il sito GitHub Pages resta pubblico.

La sincronizzazione mantiene una coda locale delle modifiche, funziona nuovamente al ritorno della connessione e legge gli aggiornamenti ogni 15 secondi quando la pagina è visibile. Ogni titolo viene aggiornato separatamente; l'ultima modifica prevale, comprese le rimozioni, secondo il timestamp del dispositivo. Usa un orologio di sistema corretto. Al primo collegamento, i progressi locali si uniscono a quelli del profilo senza ripristinare titoli rimossi nel cloud. Le preferenze dei filtri restano specifiche del dispositivo. Se il cloud non è configurato o non risponde, l'interfaccia lo segnala e conserva i dati locali.

In **Amici & Maratone**, aggiungi il nome esatto di un profilo già creato. La lista è personale: non invia una richiesta di amicizia. Selezionando un amico vedi conteggi, percentuali per universo e titoli visti o da vedere in sola lettura.

Per una **maratona**, scegli un nome e il nome utente della persona da invitare. L'invito compare nella sua pagina Amici & Maratone, dove può accettarlo o rifiutarlo. Entrambi aprono lo stesso percorso condiviso, con progressi inizialmente vuoti. Segnare un titolo nella maratona non cambia i progressi personali. Il banner identifica sempre la maratona attiva; **Torna al mio profilo** ripristina il proprio percorso. La selezione della maratona e la sua coda di modifiche sopravvivono al refresh. L'API controlla l'appartenenza accettata prima di leggere o modificare i progressi comuni. Non vengono inviate email o notifiche esterne.

**Backup JSON** esporta progressi e preferenze. L’importazione valida tutto prima di aggiornare lo stato e unisce i titoli visti ai dati esistenti. Un import non cancella progressi: per togliere un titolo visto, usa il suo pulsante nel catalogo.

**Excel `.xlsx`** viene generato nel browser, su richiesta, con tre fogli, filtri, intestazioni, colonne dimensionate, ID stabili e timestamp. Puoi reimportarlo dopo aver cambiato `Stato` in `Visto`; viene letto il primo foglio compatibile. Le righe non viste non cancellano titoli già visti nel browser. Backup e tracker locale funzionano anche senza il servizio cloud.

## Sviluppo locale

Richiede **Node.js 22+** e **pnpm 11.25.0**.

```sh
corepack enable
corepack prepare pnpm@11.25.0 --activate
pnpm install --frozen-lockfile
pnpm dev
```

Apri l’indirizzo stampato da Vite, con il percorso `/marvel-watchverse/`.

```sh
pnpm validate
pnpm test
pnpm build
pnpm preview
pnpm exec playwright install chromium
pnpm test:e2e
```

I test Vitest verificano catalogo, ordini, filtri multipli, modalità Nerd, vecchi backup, profilo persistente, riconciliazione cloud, API, Excel e schema PostgreSQL con PGlite. I test Playwright verificano locandine, filtri, modalità Nerd, nome utente dopo refresh, esportazioni/importazioni, menu mobile e overflow a 320, 390, 768, 1366 e 1920 px.

## Architettura

```text
src/data/titles.json          catalogo con ID, fonti e continuità
src/data/posters.json         manifest immagini, fonte e verifica
src/data/viewing-orders.json  indici dei percorsi e note editoriali
src/components/              componenti UI riutilizzabili
src/pages/                   archivio, universi e progressi
src/hooks/useCloudTracker.ts  salvataggio locale, coda e sincronizzazione
src/lib/                     ordinamento, filtri, backup, Excel
supabase/schemas/            schema PostgreSQL e permessi
supabase/functions/          API pubblica per nome utente
scripts/                     validazione e sincronizzazione immagini
reports/                     fonti, verifiche poster e screenshot QA
.github/workflows/deploy.yml  test, build e GitHub Pages
```

Il frontend legge il catalogo e il manifest poster dai JSON locali, senza token o API di metadati. Progressi, amici e maratone usano la Edge Function Supabase. Le locandine remote TMDB usano una dimensione da 500 px. Ogni immagine ha un rapporto 2:3 stabile, lazy loading nell’archivio, skeleton e fallback con titolo/franchise in caso di indisponibilità. Il caricamento progressivo parte da 30 titoli (12 nella Home).

Le esportazioni Excel vengono caricate in un chunk separato soltanto quando servono. I font remoti hanno fallback di sistema. Le animazioni rispettano `prefers-reduced-motion`. Navigazione hash, `BASE_URL` e favicon funzionano sotto il prefisso GitHub Pages.

## Aggiungere o aggiornare un titolo

1. Aggiungi un oggetto in `src/data/titles.json` con un **ID immutabile**. Conserva gli ID esistenti anche se cambi titolo o data.
2. Verifica titolo, anno, tipo, prima uscita e identificativo sulla pagina TMDB e, per uscite nuove, sulla fonte ufficiale Marvel/Disney/Sony. Per una stagione usa l’ID della serie e `season`.
3. Compila universo, continuità, `timelineGroup`, livello di affidabilità e note. Non forzare un titolo dal canone incerto nella cronologia MCU.
4. Assegna posizioni di uscita, interne al gruppo e editoriali. Mantieni coerente `viewing-orders.json`. L’interfaccia usa come riferimento i campi tipizzati di ciascun titolo.
5. Aggiungi la voce nel manifest poster, quindi esegui `pnpm validate`, `pnpm test` e `pnpm build`.

Lo script `scripts/build-catalog.mjs` documenta la generazione iniziale e le verifiche da pagine pubbliche. Modifiche manuali ai JSON non vanno rigenerate automaticamente senza trasferirle anche al builder.

## Aggiornare le locandine con TMDB

Richiedi un tuo **API Read Access Token** a TMDB. Usa una variabile di ambiente del terminale; **mai** un prefisso `VITE_`, mai un token nel repository.

PowerShell:

```powershell
$env:TMDB_READ_TOKEN = 'il-tuo-token'
pnpm posters:sync
Remove-Item Env:TMDB_READ_TOKEN
pnpm posters:check
pnpm validate
```

Lo script cerca per identificativo univoco, controlla anno e tipologia, usa il poster della stagione quando presente e verifica il Content-Type dell’URL. La sincronizzazione scrive `reports/posters-sync.json`; i titoli non verificabili non vengono sostituiti con immagini arbitrarie. `posters:check` scarica temporaneamente i byte per verificare le immagini, senza salvarle nel repository, e produce `reports/posters-network.json`.

Le locandine non sono redistribuite localmente: restano sui server della fonte. Per esse il repository contiene solo riferimenti e metadati. Un URL verificato può diventare indisponibile in futuro: aggiorna il manifest e consulta il report prima di ogni aggiornamento importante.

## Disponibilità streaming in Italia

Le schede usano `public/data/streaming-it.json`, ricavato dalle **pagine pubbliche JustWatch**: non dall'API partner e senza token. `pnpm streaming:sync` verifica ogni produzione del catalogo, confrontando tipo, anno e titolo italiano/originale. Le stagioni condividono la disponibilità della serie, indicata esplicitamente nell'interfaccia. Il report `reports/streaming-coverage.json` elenca le corrispondenze mancanti e gli errori.

Il workflow Pages aggiorna e ripubblica i dati ogni giorno alle 05:00 UTC e negli avvii manuali. Gli aggiornamenti programmati vengono pubblicati nel sito senza creare commit giornalieri. Le richieste sono sequenziali e distanziate; il parser interpreta soltanto dati JSON delle pagine. In caso di errori conserva le precedenti disponibilità e le loro date; un guasto esteso interrompe la pubblicazione. Cambiamenti nel sito JustWatch possono richiedere un aggiornamento del parser.

Abbonamento, noleggio, acquisto e offerte gratuite sono separati. I prezzi indicati sono i minimi segnalati per il titolo, non il costo dell'abbonamento. Ogni scheda mostra fonte JustWatch e data del controllo; dopo tre giorni segnala che i dati potrebbero essere cambiati. I collegamenti HTTPS dei servizi aprono il titolo nel sito o nell'app quando il sistema operativo e la piattaforma supportano i link universali. Non si forza l'apertura di applicazioni tramite schemi inventati.

## Pubblicazione su GitHub Pages

GitHub Pages deve usare **Settings → Pages → Source: GitHub Actions**. Ogni push a `main` esegue installazione con lockfile, validazione, test e build, poi pubblica `dist`. Il workflow usa soltanto `GITHUB_TOKEN` e l’OIDC di Pages; non serve alcuna chiave TMDB per la build.

### Attivare la sincronizzazione Supabase

1. Crea un progetto Supabase separato nell'organizzazione scelta dal proprietario.
2. Applica `supabase/schemas/watchverse.sql` e poi `supabase/schemas/social.sql` al database vuoto. Le tabelle hanno RLS e non sono accessibili con le chiavi pubbliche; le funzioni SQL sono concesse solo a `service_role`.
3. Distribuisci la Edge Function `watchverse-sync` con i due file in `supabase/functions/watchverse-sync/`. La verifica JWT è disattivata intenzionalmente perché l'accesso richiesto è basato sul solo nome. La chiave di servizio viene letta dall'ambiente Supabase e resta nel backend.
4. Imposta la variabile GitHub Actions **VITE_SYNC_URL** all'URL pubblico `https://<project-ref>.supabase.co/functions/v1/watchverse-sync`, poi avvia il workflow. In locale usa la stessa variabile in `.env.local`, escluso da Git.
5. Verifica con due browser separati: stesso nome, titolo visto, lettura dall'altro browser, rimozione e riapertura. Non inserire chiavi Supabase nel frontend o nel repository.

La funzione consente l'origine GitHub Pages del progetto e le porte locali 4173/5173. Se cambi hosting, aggiorna l'elenco in `handler.ts`. Il servizio non espone un elenco dei profili. La configurazione dell'URL deve avvenire dopo la distribuzione e la verifica del backend.

Il backend di produzione è attivo nel progetto indicato dal proprietario, `mddtitqobohlvfaxilfx`. Il workflow usa l'URL pubblico della funzione nella variabile GitHub Actions `VITE_SYNC_URL`; nessuna chiave di servizio è inclusa nella build.

## Dedica, musica ed Easter egg

Il footer dedica il sito a Veronica. L'atmosfera della pagina Universi è attiva di default al **10%**: si interrompe in pausa, quando la scheda del browser è nascosta e quando si lascia Universi. Se il browser blocca l'autoplay, parte al primo clic o tocco; opening e schiocco sospendono temporaneamente l'atmosfera per evitare sovrapposizioni.

L'opening usa esclusivamente un lettore audio nativo in sottofondo, senza video, iframe o collegamenti a YouTube. Il file della sigla originale deve ancora essere fornito: `public/data/opening-audio.json` contiene quindi `{"src":null}` e non avvia alcun brano. Per attivarla, aggiungere il file MP3/M4A/OGG/WAV in `public/assets/` e impostare `src` al percorso relativo, per esempio `assets/marvel-opening.m4a`. Il volume iniziale è 35%, con un piccolo pulsante per silenziarla. Se l'autoplay è bloccato, il lettore riprova al primo clic o tasto. `marvel-watchverse.opening-audio.v2` registra soltanto una riproduzione effettivamente avviata, evitando di ripeterla alle visite successive. Una nuova installazione del browser o la cancellazione dei dati del sito conta come nuova visita.

Sei Gemme sono nascoste nelle pagine e possono essere incastonate nel Guanto. La raccolta è salvata sul dispositivo in `marvel-watchverse.infinity.v1`. Con tutte le Gemme, un clic sul Guanto dissolve metà dei **film** del catalogo, arrotondando per difetto: le serie restano. Le locandine si sgretolano in circa 1.700 frammenti ciascuna, che vengono trascinati dal vento e svaniscono, accompagnati da una composizione oscura originale. Le schede scomparse mantengono il proprio spazio vuoto nella griglia e nel collage iniziale, senza spostare gli altri titoli. Se nessun film è visibile, lo schiocco porta all'Archivio. “Riporta indietro le storie” ripristina tutto; anche ricaricare il sito annulla lo schiocco. L'effetto non cambia né cancella progressi personali o delle maratone. Con movimento ridotto usa una breve dissolvenza senza particelle o lampi.

## Fonti e limiti

Consulta `reports/catalog-sources.md` e i report delle locandine. Le sinossi, quando disponibili, sono brevi estratti descrittivi della fonte. Durate o date non confermate restano esplicitamente mancanti. Le future uscite sono soggette a cambiamenti e il catalogo non si aggiorna automaticamente con il passare del tempo.

Il progetto copre le principali produzioni richieste e numerose stagioni animate; non promette ogni singolo adattamento Marvel, episodio o promo mai realizzato. La disponibilità sulle piattaforme varia per paese e periodo: “pubblicato” indica l’uscita della produzione, non un abbonamento o un servizio di streaming italiano garantito.

## Licenza e attribuzione

Codice originale sotto licenza MIT. Titoli, marchi, personaggi, sinossi della fonte e locandine appartengono ai rispettivi titolari e non sono coperti dalla licenza del codice. Fan-made indipendente, non affiliato a Marvel, Disney, Sony o TMDB.

This product uses the TMDB API but is not endorsed or certified by TMDB.
