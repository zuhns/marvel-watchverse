# Verifica aggiornamento filtri e profili — 9 ottobre 2026

- Catalogo: 255 ID univoci, 255 poster verificati; nessun titolo o progresso storico cancellato.
- TypeScript e build di produzione: completati.
- Vitest: 23 test passati. Include classificazione dei 16 universi Nerd Multiverso richiesti, schema PostgreSQL in PGlite, permessi, aggiornamenti indipendenti, inviti e separazione fra profili e maratone.
- Playwright: filtri multipli e profilo persistente verificati su desktop e mobile; controllo del catalogo storico dal 1967, selezioni conservate dopo refresh e migrazione dei dati locali.
- Menu universi e profilo: controllo delle dimensioni e screenshot a 320, 390 e 1366 px, senza menu fuori dal viewport o overflow orizzontale.
- Sincronizzazione: prova con due contesti browser separati e backend simulato, migrazione dei progressi preesistenti, rimozione dall'altro dispositivo, errore di rete, coda persistente dopo refresh e recupero. Nessun profilo di una persona reale usato nei test.
- Le verifiche preesistenti di backup JSON, import/export Excel, locandine e layout continuano a passare; tutte le 255 immagini sono state decodificate nel browser.

## Attivazione cloud

La sincronizzazione di produzione è stata attivata sul progetto `mddtitqobohlvfaxilfx`, indicato dal proprietario. Schema applicato al database inizialmente vuoto; Edge Function `watchverse-sync` distribuita e verificata con richieste reali. La variabile GitHub Actions `VITE_SYNC_URL` contiene solo l'URL pubblico della funzione.

Playwright contro il backend reale ha verificato login dalla barra superiore, tre browser e due nomi utente, progressi ritrovati sul secondo dispositivo, lista amici e vista in sola lettura, invito e accettazione, maratona inizialmente vuota, aggiornamento condiviso, refresh e ritorno ai progressi personali senza contaminazione tra i percorsi. Sono stati usati esclusivamente profili QA temporanei.

Controllo del layout di Amici & Maratone e barra superiore a 320, 390, 768, 900, 1024, 1150, 1366 e 1920 px: nessun overflow dopo le correzioni del menu. Login verificato visivamente a 320 px.

Gli advisor non riportano avvisi o errori: solo informazioni su RLS senza policy e indici appena creati. RLS senza policy è intenzionale: le tabelle non concedono accesso ad anon/authenticated e sono usate esclusivamente dal backend con service_role. [Dettaglio RLS](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy). Gli indici delle chiavi esterne sono mantenuti anche quando risultano ancora inutilizzati nel database nuovo. [Dettaglio indici](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index).

Per ripetere la prova dei due browser, compila con `VITE_SYNC_URL=https://sync.watchverse.test/progress`, quindi esegui `WATCHVERSE_SYNC_TEST=1 pnpm exec playwright test tests/e2e/cloud.spec.ts --project chromium`. Il test intercetta quell'endpoint. Rimuovi la variabile e ricompila prima della pubblicazione.

Per la prova reale compila con l'endpoint di produzione ed esegui `WATCHVERSE_LIVE_TEST=1 pnpm exec playwright test tests/e2e/social-live.spec.ts --project chromium`. I nomi QA creati sono registrati in `reports/live-test-profiles.json` per consentire di rimuovere esattamente i dati della prova. Non eseguire due suite Playwright sullo stesso percorso di risultati contemporaneamente.
