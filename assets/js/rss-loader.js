// ==============================================
// RSS LOADER - CHECK-IN
// ==============================================

class RSSLoader {
    constructor() {
        this.rssUrl = 'https://rss.italiaatavola.net/2023/check-in.xml';
        this.articles = [];
        this.categories = {
            viaggi: [],
            enogastronomia: [],
            ospitalita: [],
            cultura: []
        };
        this.init();
    }

    async init() {
        try {
            await this.loadRSS();
            this.categorizeArticles();
            this.renderGallery();
            this.updateSectionCounts();
        } catch (error) {
            console.error('Errore nel caricamento RSS:', error);
            this.loadMockData();
        }
    }

    async loadRSS() {
        // Simula il caricamento RSS (in produzione usare un proxy server-side)
        const mockArticles = [
            {
                title: "In Repubblica Ceca la magia del Natale comincia già a novembre",
                description: "Dalle piazze di Praga alle città della Moravia, l'Avvento trasforma la Repubblica Ceca in un viaggio fra luci, cori e profumi. Un Paese che vive il Natale come un rito collettivo, autentico e sorprendentemente vitale",
                image: "https://www.italiaatavola.net/images/contenutiarticoli/praga_natale.jpg",
                link: "https://www.italiaatavola.net/check-in/2025/10/16/in-repubblica-ceca-magia-del-natale-comincia-gia-a-novembre/115086/",
                category: "viaggi"
            },
            {
                title: "Massimo Cosmo e i sapori di Napoli che seducono la città di Prato",
                description: "Da 12 anni in Toscana, ha mantenuto un legame molto stretto con la sua terra, che si esprime nell'offerta del Ristorante Pizzeria Antiche Volte. Cucina in prevalenza campana e pizze tra classiche e speciali",
                image: "https://www.italiaatavola.net/images/contenutiarticoli/cosmo_prato.jpg",
                link: "https://www.italiaatavola.net/check-in/2025/10/16/massimo-cosmo-sapori-napoli-seducono-prato/114486/",
                category: "enogastronomia"
            },
            {
                title: "Nel Novarese c'è un casale del Cinquecento che è diventato un rifugio gourmet",
                description: "L'agriturismo Capuccina a Cureggio (No) unisce charme, orto biologico e cucina di territorio, con soggiorni slow, menu stagionali dello chef Alessio Bordenca e spazi immersi nella natura, tra relax e convivialità",
                image: "https://www.italiaatavola.net/images/contenutiarticoli/INSTA_CAPUCCINA.jpg",
                link: "https://www.italiaatavola.net/check-in/2025/10/15/novarese-casale-cinquecento-diventato-rifugio-gourmet/115071/",
                category: "ospitalita"
            },
            {
                title: "Venezia, il segreto del Caffè Florian: tra arte, letteratura e un espresso senza tempo",
                description: "Il Caffè Florian di Venezia, aperto nel 1720, è simbolo di storia, arte e cultura. Tra sale affrescate, arredi d'epoca e ospiti illustri, offre un'esperienza unica che fonde tradizione e gastronomia",
                image: "https://www.italiaatavola.net/images/contenutiarticoli/IAT-Foto-Copyright-Caffe-Florian-(2).jpg",
                link: "https://www.italiaatavola.net/check-in/2025/10/15/venezia-segreto-caffe-florian-arte-letteratura-espresso-senza-tempo/114977/",
                category: "cultura"
            },
            {
                title: "Lucera, crocevia di popoli e tradizioni: viaggio tra storia e gastronomia",
                description: "Lucera, Capitale pugliese della Cultura 2025, unisce storia federiciana, anfiteatro romano e Fortezza svevo-angioina a sapori autentici di grano, olio Peranzana e Cacc' E Mmitte Dop",
                image: "https://www.italiaatavola.net/images/contenutiarticoli/SH_lucera.jpg",
                link: "https://www.italiaatavola.net/check-in/2025/10/14/lucera-crocevia-di-popoli-tradizioni-viaggio-tra-storia-gastronomia/114860/",
                category: "viaggi"
            },
            {
                title: "Hotel Windsor di Laigueglia, addormentarsi cullati dalle onde del mare",
                description: "Nel cuore di Laigueglia, in provincia di Savona, in Liguria, un'oasi di tranquillità ed eleganza: 25 camere, una spiaggia privata e un ambizioso ristorante, il Savô di Roberto Stella",
                image: "https://www.italiaatavola.net/images/contenutiarticoli/13_Hotel_Windsor_Laigueglia.jpeg",
                link: "https://www.italiaatavola.net/check-in/2025/10/13/hotel-windsor-laigueglia-addormentarsi-cullati-onde-mare/114995/",
                category: "ospitalita"
            },
            {
                title: "Sci, cultura e gusto: Plan de Corones, tutto pronto per la stagione 2025/26",
                description: "Dal 29 novembre si torna a sciare sulla montagna simbolo dell'Alto Adige: 121 km di piste, due musei in vetta, cucina d'autore firmata Niederkofler e un calendario ricco di eventi fino ai Giochi Olimpici 2026",
                image: "https://www.italiaatavola.net/images/contenutiarticoli/Plandecorones2.jpg",
                link: "https://www.italiaatavola.net/check-in/2025/10/13/sci-cultura-gusto-plan-de-corones-tutto-pronto-per-stagione-2025-26/115007/",
                category: "viaggi"
            },
            {
                title: "Alla scoperta del ristorante di Treviso dove nacque il tiramisù",
                description: "Il ristorante Le Beccherie è un luogo che intreccia storia e cucina, memoria e sperimentazione, in un equilibrio che racconta l'anima più autentica della città e dei suoi protagonisti ai fornelli",
                image: "https://www.italiaatavola.net/images/contenutiarticoli/le_beccherie_1.jpg",
                link: "https://www.italiaatavola.net/check-in/2025/10/13/alla-scoperta-del-ristorante-di-treviso-dove-nacque-tiramisu/114959/",
                category: "enogastronomia"
            },
            {
                title: "Due strutture dove passare l'inverno a San Candido tra design e benessere alpino",
                description: "A San Candido (Bz), Naturhotel Leitlhof e Atto Suites & Cuisine offrono un inverno sulle Dolomiti di Sesto tra lusso sostenibile e design alpino. Due esperienze uniche per una vacanza completa",
                image: "https://www.italiaatavola.net/images/contenutiarticoli/leitlhof_atto_cuisine.jpg",
                link: "https://www.italiaatavola.net/check-in/2025/10/12/due-strutture-dove-passare-l-inverno-a-san-candido-tra-design-benessere-alpino/114983/",
                category: "ospitalita"
            },
            {
                title: "Tra Marubini e violini: alla scoperta di Cremona, la città che suona e cucina",
                description: "Cremona, città d'arte e tradizione, intreccia storia, paesaggio e gastronomia. Celebre per la liuteria, custodisce tesori come il Duomo e il Torrazzo. Terra di sapori autentici",
                image: "https://www.italiaatavola.net/images/contenutiarticoli/SH_CREMONA.jpg",
                link: "https://www.italiaatavola.net/check-in/2025/10/12/tra-marubini-violini-alla-scoperta-di-cremona-citta-che-suona-cucina/114881/",
                category: "cultura"
            },
            {
                title: "Luci, profumi e felicità: alcuni mercatini di Natale da non perdere in Europa",
                description: "Dall'Alsazia alle Dolomiti, da Vienna a Tallinn fino alla Provenza, i mercatini di Natale raccontano un'Europa che cambia volto d'inverno. Le città si riscoprono intime, i borghi si fanno teatro di incontri e gesti quotidiani",
                image: "https://www.italiaatavola.net/images/contenutiarticoli/mercatini_vienna.jpg",
                link: "https://www.italiaatavola.net/check-in/2025/10/9/luci-profumi-felicita-alcuni-mercatini-di-natale-da-non-perdere-in-europa/114938/",
                category: "viaggi"
            },
            {
                title: "Del Cambio celebra 268 anni: la storia, il gusto e la bellezza di un'icona",
                description: "Del Cambio celebra 268 anni a Torino, unendo storia, arte e cucina piemontese con influenze francesi. Menu rivisitato, cantina storica e spazi contemporanei rendono l'esperienza gastronomica un'icona del gusto",
                image: "https://www.italiaatavola.net/images/contenutiarticoli/genta_al_cambio_ostrica_gratinata.jpg",
                link: "https://www.italiaatavola.net/check-in/2025/10/7/del-cambio-celebra-268-anni-storia-gusto-bellezza-di-icona/114884/",
                category: "enogastronomia"
            }
        ];

        this.articles = mockArticles;
    }

    categorizeArticles() {
        const keywords = {
            viaggi: ['viaggio', 'destinazione', 'scoperta', 'itinerario', 'europa', 'italia', 'città', 'montagna', 'mare', 'natale', 'mercatini'],
            enogastronomia: ['cucina', 'ristorante', 'chef', 'sapori', 'gastronomia', 'piatti', 'menu', 'tradizione', 'gourmet', 'cibo'],
            ospitalita: ['hotel', 'resort', 'spa', 'benessere', 'suite', 'ospitalità', 'soggiorno', 'relax', 'lusso'],
            cultura: ['arte', 'storia', 'cultura', 'museo', 'tradizione', 'patrimonio', 'eventi', 'festival']
        };

        this.articles.forEach(article => {
            if (article.category && this.categories[article.category]) {
                this.categories[article.category].push(article);
                return;
            }

            // Auto-categorizzazione basata su keywords
            const text = (article.title + ' ' + article.description).toLowerCase();
            let bestMatch = 'cultura';
            let bestScore = 0;

            Object.entries(keywords).forEach(([category, words]) => {
                let score = 0;
                words.forEach(word => {
                    if (text.includes(word)) score++;
                });
                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = category;
                }
            });

            this.categories[bestMatch].push(article);
        });
    }

    renderGallery() {
        const track = document.querySelector('.gallery-track');
        const dots = document.querySelector('.gallery-dots');
        
        if (!track || !dots) return;

        track.innerHTML = '';
        dots.innerHTML = '';

        // Prendi i primi 6 articoli più rilevanti
        const featured = this.articles.slice(0, 6);

        featured.forEach((article, index) => {
            // Crea l'item della gallery
            const item = document.createElement('div');
            item.className = 'gallery-item';
            if (index === 0) item.classList.add('active');

            item.innerHTML = `
                <div class="gallery-image">
                    <img src="${article.image}" alt="${article.title}" loading="lazy">
                </div>
                <div class="gallery-content">
                    <div class="gallery-category">${this.getCategoryLabel(article.category)}</div>
                    <h2 class="gallery-title">${article.title}</h2>
                    <p class="gallery-description">${article.description}</p>
                    <a href="${article.link}" class="gallery-link">
                        Leggi l'articolo
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </a>
                </div>
            `;

            track.appendChild(item);

            // Crea il dot
            const dot = document.createElement('div');
            dot.className = 'gallery-dot';
            if (index === 0) dot.classList.add('active');
            dot.addEventListener('click', () => this.goToSlide(index));
            dots.appendChild(dot);
        });
    }

    getCategoryLabel(category) {
        const labels = {
            viaggi: 'VIAGGI',
            enogastronomia: 'ENOGASTRONOMIA',
            ospitalita: 'OSPITALITÀ',
            cultura: 'CULTURA'
        };
        return labels[category] || 'CHECK-IN';
    }

    updateSectionCounts() {
        Object.entries(this.categories).forEach(([category, articles]) => {
            const card = document.querySelector(`[data-section="${category}"]`);
            if (card) {
                const countEl = card.querySelector('.section-count');
                if (countEl) {
                    this.animateCount(countEl, articles.length);
                }
            }
        });
    }

    animateCount(element, target) {
        let current = 0;
        const duration = 2000;
        const increment = target / (duration / 16);
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = target;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current);
            }
        }, 16);
    }

    goToSlide(index) {
        const items = document.querySelectorAll('.gallery-item');
        const dots = document.querySelectorAll('.gallery-dot');
        
        items.forEach(item => item.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        
        if (items[index]) items[index].classList.add('active');
        if (dots[index]) dots[index].classList.add('active');
    }

    loadMockData() {
        console.log('Caricamento dati mock...');
        this.articles = [];
        this.renderGallery();
        this.updateSectionCounts();
    }
}

// Inizializza quando il DOM è pronto
document.addEventListener('DOMContentLoaded', () => {
    window.rssLoader = new RSSLoader();
});
