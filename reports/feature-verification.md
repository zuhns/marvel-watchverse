# Verifica aggiornamento filtri e profili — 9 ottobre 2026

- Catalogo: 255 ID univoci, 255 poster verificati; nessun titolo o progresso storico cancellato.
- TypeScript e build di produzione: completati.
- Vitest: 21 test passati. Include schema PostgreSQL reale in PGlite, accesso limitato a service_role, isolamento tra nomi, aggiornamenti indipendenti, rimozioni e retry obsoleti.
- Playwright: filtri multipli e profilo persistente verificati su desktop e mobile; controllo del catalogo storico dal 1967, selezioni conservate dopo refresh e migrazione dei dati locali.
- Menu universi e profilo: controllo delle dimensioni e screenshot a 320, 390 e 1366 px, senza menu fuori dal viewport o overflow orizzontale.
- Sincronizzazione: prova con due contesti browser separati e backend simulato, migrazione dei progressi preesistenti, rimozione dall'altro dispositivo, errore di rete, coda persistente dopo refresh e recupero. Nessun profilo di una persona reale usato nei test.
- Le verifiche preesistenti di backup JSON, import/export Excel, locandine e layout continuano a passare; tutte le 255 immagini sono state decodificate nel browser.

## Attivazione cloud

Il codice di sincronizzazione è predisposto, ma il backend di produzione non è ancora distribuito: il proprietario ha scelto un'organizzazione Supabase diversa da quella attualmente accessibile e deve renderla disponibile. Finché manca `VITE_SYNC_URL`, il sito segnala «cloud da attivare» e mantiene i progressi sul dispositivo.

Per ripetere la prova dei due browser, compila con `VITE_SYNC_URL=https://sync.watchverse.test/progress`, quindi esegui `WATCHVERSE_SYNC_TEST=1 pnpm exec playwright test tests/e2e/cloud.spec.ts --project chromium`. Il test intercetta quell'endpoint. Rimuovi la variabile e ricompila prima della pubblicazione.
