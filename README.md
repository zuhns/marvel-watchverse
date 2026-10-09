# MARVEL WATCHVERSE

**Ogni storia. Ogni universo.** Archivio cinematografico fan-made in italiano, con catalogo statico, vere locandine, percorsi di visione e tracker personale senza login.

- Sito: https://zuhns.github.io/marvel-watchverse/
- Repository: https://github.com/zuhns/marvel-watchverse
- Data di riferimento del catalogo: **8 ottobre 2026**.

## Cosa puoi fare

Esplora film, singole stagioni, cortometraggi e speciali. Formati, universi e franchise ammettono selezioni multiple: basta selezionare le caselle o i pulsanti desiderati. Le scelte nello stesso filtro sono alternative; filtri diversi si combinano. Le produzioni future sono separate dai titoli pubblicati e non aumentano il denominatore dei progressi.

Il percorso predefinito parte dal **1998, con Blade**. Attiva **Modalità Nerd** per includere le produzioni storiche dal 1967 in tutti gli ordini di visione. Il percorso e le statistiche seguono la modalità scelta; i progressi storici restano conservati quando Nerd è disattivata. La preferenza viene ricordata nel browser.

Tre ordini di visione:

1. **Uscita**: prima distribuzione internazionale di riferimento, ordinata globalmente. Le date possono differire dall’uscita italiana.
2. **Cronologia interna**: titoli raggruppati per continuità. Gli X-Men hanno timeline ramificate; le posizioni approssimative sono dichiarate nei dettagli. Le produzioni di canone incerto e l’animazione legacy restano separate.
3. **Consigliato**: consiglio editoriale indipendente; inserisce Raimi/Webb prima di No Way Home e Deadpool/Wolverine prima del crossover. Non è una timeline canonica ufficiale.

I progressi usano ID stabili e timestamp in `localStorage`, chiave `marvel-watchverse.v1`. Cambiare ordine o filtri non cambia lo stato visto. I vecchi backup con filtri singoli vengono migrati automaticamente. La pagina progressi mostra dati complessivi e per universo, gli ultimi titoli visti e il prossimo capitolo.

In **I miei progressi** puoi associare un nome utente al browser. Il nome viene normalizzato in minuscolo e resta memorizzato, senza un comando per cambiarlo o uscire. Inserendo lo stesso nome su un altro dispositivo accedi agli stessi progressi quando il servizio cloud è configurato. Il profilo usa solo il nome: chi lo conosce può leggere e modificare i progressi, come richiesto dal proprietario. Non ci sono email o password. Il sito GitHub Pages resta pubblico.

La sincronizzazione mantiene una coda locale delle modifiche, funziona nuovamente al ritorno della connessione e legge gli aggiornamenti ogni 15 secondi quando la pagina è visibile. Ogni titolo viene aggiornato separatamente; l'ultima modifica prevale, comprese le rimozioni, secondo il timestamp del dispositivo. Usa un orologio di sistema corretto. Al primo collegamento, i progressi locali si uniscono a quelli del profilo senza ripristinare titoli rimossi nel cloud. Le preferenze dei filtri restano specifiche del dispositivo. Se il cloud non è configurato o non risponde, l'interfaccia lo segnala e conserva i dati locali.

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

Il frontend non cerca immagini su Wikipedia, non contiene token e non chiama un’API di metadati. Legge esclusivamente i due JSON locali. Le locandine remote TMDB usano una dimensione da 500 px. Ogni immagine ha un rapporto 2:3 stabile, lazy loading nell’archivio, skeleton e fallback con titolo/franchise in caso di indisponibilità. Il caricamento progressivo parte da 30 titoli (12 nella Home).

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

Le immagini non sono redistribuite localmente: restano sui server della fonte. Il repository contiene solo riferimenti e metadati. Un URL verificato può diventare indisponibile in futuro: aggiorna il manifest e consulta il report prima di ogni aggiornamento importante.

## Pubblicazione

GitHub Pages deve usare **Settings → Pages → Source: GitHub Actions**. Ogni push a `main` esegue installazione con lockfile, validazione, test e build, poi pubblica `dist`. Il workflow usa soltanto `GITHUB_TOKEN` e l’OIDC di Pages; non serve alcuna chiave TMDB per la build.

### Attivare la sincronizzazione Supabase

1. Crea un progetto Supabase separato nell'organizzazione scelta dal proprietario.
2. Applica lo schema `supabase/schemas/watchverse.sql` al database vuoto. Le tabelle hanno RLS e non sono accessibili con le chiavi pubbliche; la funzione SQL è concessa solo a `service_role`.
3. Distribuisci la Edge Function `watchverse-sync` con i due file in `supabase/functions/watchverse-sync/`. La verifica JWT è disattivata intenzionalmente perché l'accesso richiesto è basato sul solo nome. La chiave di servizio viene letta dall'ambiente Supabase e resta nel backend.
4. Imposta la variabile GitHub Actions **VITE_SYNC_URL** all'URL pubblico `https://<project-ref>.supabase.co/functions/v1/watchverse-sync`, poi avvia il workflow. In locale usa la stessa variabile in `.env.local`, escluso da Git.
5. Verifica con due browser separati: stesso nome, titolo visto, lettura dall'altro browser, rimozione e riapertura. Non inserire chiavi Supabase nel frontend o nel repository.

La funzione consente l'origine GitHub Pages del progetto e le porte locali 4173/5173. Se cambi hosting, aggiorna l'elenco in `handler.ts`. Il servizio non espone un elenco dei profili. La configurazione dell'URL deve avvenire dopo la distribuzione e la verifica del backend.

## Fonti e limiti

Consulta `reports/catalog-sources.md` e i report delle locandine. Le sinossi, quando disponibili, sono brevi estratti descrittivi della fonte. Durate o date non confermate restano esplicitamente mancanti. Le future uscite sono soggette a cambiamenti e il catalogo non si aggiorna automaticamente con il passare del tempo.

Il progetto copre le principali produzioni richieste e numerose stagioni animate; non promette ogni singolo adattamento Marvel, episodio o promo mai realizzato. La disponibilità sulle piattaforme varia per paese e periodo: “pubblicato” indica l’uscita della produzione, non un abbonamento o un servizio di streaming italiano garantito.

## Licenza e attribuzione

Codice originale sotto licenza MIT. Titoli, marchi, personaggi, sinossi della fonte e locandine appartengono ai rispettivi titolari e non sono coperti dalla licenza del codice. Fan-made indipendente, non affiliato a Marvel, Disney, Sony o TMDB.

This product uses the TMDB API but is not endorsed or certified by TMDB.
