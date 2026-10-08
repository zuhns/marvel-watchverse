# Verifica della versione iniziale

Data di riferimento: 8 ottobre 2026.

- Catalogo: 255 ID univoci, 251 produzioni/stagioni pubblicate, 4 future.
- Poster: 255 riferimenti con verifica HTTP positiva; 136 specifici di stagione; nessun mancante.
- Browser Chromium: **255/255 immagini decodificate**, con dimensioni naturali positive. Dettagli in `posters-browser.json`.
- Gli 11 poster prioritari sono stati aperti e verificati anche singolarmente su desktop e mobile: Iron Man 2008, Avengers: Endgame, Spider-Man: No Way Home, X-Men 2000, Logan, Deadpool & Wolverine, Venom, Fantastic Four 2005, Blade, Daredevil stagione 1, WandaVision.
- TypeScript: nessun errore.
- Build Vite: completata. ExcelJS è un chunk separato caricato su richiesta; il suo peso non blocca la build.
- Vitest: **9 test superati**.
- Playwright: **7 test superati**; il duplicato dell’audit completo di 255 immagini su mobile è intenzionalmente saltato, poiché le 11 prioritarie sono già verificate su entrambi i profili.
- Tracker: segna visto, cambia ordine, conserva filtri e stato dopo refresh.
- Backup: export e import JSON e XLSX reali nel browser; import invalido rifiutato senza perdita dei progressi.
- Excel: tre fogli, ordine coerente, filtri, colonne dimensionate e ID stabili.
- Layout: nessun overflow orizzontale indesiderato a 320, 390, 768, 1366, 1920 px su Home e Universi; menu mobile verificato.
- Prefisso `/marvel-watchverse/`: build e browser QA eseguiti direttamente con questo percorso.

Screenshot locali disponibili in `reports/`; non vengono pubblicati nel repository, poiché includono immagini dei rispettivi titolari. La verifica del deployment pubblico viene eseguita separatamente dopo il push.
