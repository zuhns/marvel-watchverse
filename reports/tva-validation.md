# Terminale TVA — aggiornato al 10 ottobre 2026

Il terminale usa il logo geometrico TVA e l’animazione originale di Miss Minutes pubblicata da Disney D23. Il filmato conserva i fotogrammi della GIF originale, transcodificati in WebM con trasparenza; la GIF resta disponibile come fallback e il primo fotogramma viene usato durante pausa e movimento ridotto. Il menu sposta la mascotte fra le tre sezioni.

La linea temporale non usa fotografie. Mesh di filamenti, shader animati, impulsi luminosi e un passaggio bloom producono un flusso continuo con ramificazioni. Il motore gira a 30 fotogrammi al secondo con DPR massimo 1,25; interrompe il ridisegno quando è fermo o la pagina è nascosta. Un motore Canvas 2D procedurale mantiene l’animazione senza WebGL. Pausa e preferenza di sistema fermano anche Miss Minutes.

La revisione del 10 ottobre introduce filamenti con profondità e fuoco variabili, 64 fasci centrali, microstrutture luminose, nebbia turbolenta, polvere su tre piani e bloom con tre raggi e controllo dell’esposizione. I rami principali seguono il movimento della linea centrale nel punto di origine. L’involucro del monitor riprende apparecchiature arancioni, cornici scure e strumenti ambrati delle foto di produzione, con modulo laterale, manopole decorative, griglie, viti e maniglia. Su telefono il modulo laterale lascia spazio allo schermo.

La grafica riprende colori, marchio e segnaletica degli uffici documentati dal designer di produzione: https://zafron.com/case-loki-season-one. Il lettering del logo è originale; Jost e Archivo Narrow sono font locali con licenza OFL scelti per i testi, non attestati come font ufficiali della serie. Fonti complete in public/assets/README.md.

La composizione originale locale dura 96 secondi: quattro armonie alternate, coro sintetico, arpeggi, richiami e pulsazioni, riverbero stereo. Il generatore riproducibile è scripts/compose-temporal-score.mjs; il report del segnale è temporal-score-analysis.json. Picco normalizzato 0,82, nessun clipping. Web Audio carica e decodifica il file al clic, gestisce volume, dissolvenza, pausa, scheda nascosta e chiusura all’uscita.

La mappa conserva 32 Terre numerate con fonti, tooltip, tastiera, trascinamento, scorrimento touch, zoom, filtri per formato e dossier. Non aggiunge Terre non confermate. La geometria dei rami rimane una rappresentazione editoriale.

Verifiche: TypeScript, build di produzione e 28 test unitari. Suite browser completa: 21 superati e 1 saltato previsto su mobile. I test confrontano i pixel di fotogrammi diversi, verificano assenza della vecchia fotografia, riproduzione di Miss Minutes, font locali, pausa, movimento ridotto, fallback senza WebGL, tooltip, filtri, dossier e archivio. I test audio campionano il segnale effettivo per volume, silenzio, sospensione, ripresa e chiusura. Controllo visivo desktop e mobile, senza errori JavaScript né overflow. Nessuna modifica ai profili o ai servizi cloud.
