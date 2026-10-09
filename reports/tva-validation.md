# Terminale TVA — 9 ottobre 2026

Pagina Universi ricostruita come terminale rétro: carta, colori ruggine, comandi fisici, cornice e vetro CRT, scansione. L’immagine fornita dall’utente è inclusa senza modifiche in `public/assets/tva-timeline.png`. Il canvas combina esposizione, scorrimento ciclico, ramificazioni procedurali e particelle luminose. Il movimento rispetta pausa, visibilità della scheda e preferenza di sistema, comprese modifiche a pagina aperta. La texture dei rami è prerenderizzata e la risoluzione limitata a 1,5 DPR; nessun ridisegno continuo mentre il flusso è fermo.

Miss Minutes è un SVG animato che segue selezione, hover e focus del menu. La mappa dispone di segnali con anteprima dell’universo, navigazione da tastiera, trascinamento, scorrimento touch, comandi laterali, zoom e centratura. I menu mostrano soltanto 32 Terre numerate con una fonte; raccolte non confermate, multirealtà e luoghi fuori dal tempo sono esclusi dalla pagina Universi. Il modello completo rimane disponibile per catalogo e backup.

L’atmosfera è una sintesi Web Audio originale con droni, modulazioni lente, rumore filtrato e riverbero. Nessun file musicale o servizio esterno. Si attiva solo dal pulsante; dispone di volume, dissolvenza, sospensione durante pausa o scheda nascosta e chiusura all’uscita.

Verifiche: TypeScript e build di produzione; 28 test unitari; test browser su desktop e telefono per flusso, pausa e movimento ridotto, anteprime, filtro delle Terre, esplorazione, dossier e archivio esatto, layout, progressi e preferenze. I test audio campionano il segnale effettivo tramite AnalyserNode e verificano suono, volume zero, sospensione, ripresa e chiusura. Controllo visivo del terminale desktop/mobile. Nessuna modifica ai profili o ai servizi cloud.
