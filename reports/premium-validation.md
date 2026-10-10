# Revisione visiva e movimento — 10 ottobre 2026

Riferimenti primari: portfolio del production designer Kasra Farahani, https://zafron.com/case-loki-season-one, sezioni Chronomonitoring e Renslayer’s Office. Le foto 021 e 011 mostrano display ambrati incassati, manopole analogiche, apparecchiature arancioni e superfici scure. Le fotografie sono state consultate per la progettazione, non inserite nel sito. Logo e animazione originali già presenti sono conservati.

Universi: palette carbone, verde industriale e arancione TVA, typography leggibile, chronomonitor con involucro fisico e modulo R&A, maniglia, viti, vetro, strumenti e comandi. Flusso luminoso procedurale con profondità variabile, nebbia, particelle su più piani, microfilamenti e bloom. Nessun fotogramma statico o video della serie usato come flusso.

Home, Archivio, Progressi e Amici: gerarchia e spaziature coerenti, superfici sfumate, riflessi sulle locandine, stati hover e pressione, dialoghi con dissolvenza e sfocatura, barre dei progressi interpolate, navigazione fissa, comparsa delle sezioni e collegamento a Universi con portale animato. Un IntersectionObserver e un MutationObserver gestiscono i nuovi elementi; vengono scollegati al cambio pagina. Il movimento ridotto disattiva gli effetti e rende immediatamente visibili i contenuti.

Validazione: TypeScript e build di produzione passati; 255 ID e poster validati; 28 test unitari passati. Suite funzionale browser: 21 superati, 1 saltato previsto su mobile. Le ultime rifiniture TVA hanno superato altri 6 controlli desktop/mobile; i 2 nuovi controlli delle animazioni verificano nuovi contenuti, ricerca e cambio della preferenza di movimento ridotto. Nessuna mutazione dei profili di produzione.

Controllo visivo: Home, Universi, Archivio, Progressi e Amici a 1440 e 390 px; controlli di overflow esistenti a 320, 390, 768, 1366 e 1920 px. Nessun errore JavaScript. Screenshot in reports/premium-*.png (esclusi da Git). Misurazione headless locale durante controlli concorrenti: 53 ridisegni in 2,5 secondi; obiettivo massimo 30 fps, non una garanzia su ogni dispositivo.
