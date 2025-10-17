// ==============================================
// PRO ANIMATIONS CON GSAP
// ==============================================

// Carica i dati RSS reali
let articlesData = [];

async function loadRealArticles() {
    try {
        // Usa i dati già caricati da rss-loader.js
        if (window.articlesFromRSS && window.articlesFromRSS.length > 0) {
            articlesData = window.articlesFromRSS;
        } else {
            // Fallback: usa mock data con articoli reali estratti
            articlesData = [
                {
                    title: "In Repubblica Ceca la magia del Natale comincia già a novembre",
                    description: "Praga si trasforma in un villaggio incantato per le festività",
                    image: "https://www.italiaatavola.net/images/contenutiarticoli/praga_natale.jpg",
                    category: "viaggi",
                    link: "https://www.italiaatavola.net/....."
                },
                {
                    title: "Massimo Cosmo e i sapori di Napoli che seducono la città di Prato",
                    description: "Lo chef napoletano porta la sua arte culinaria in Toscana",
                    image: "https://www.italiaatavola.net/images/contenutiarticoli/cosmo_prato.jpg",
                    category: "enogastronomia",
                    link: "https://www.italiaatavola.net/....."
                },
                {
                    title: "Nel Novarese c'è un casale del Cinquecento che è un'oasi di charme e benessere",
                    description: "La Capuccina: storia e comfort in una location unica",
                    image: "https://www.italiaatavola.net/images/contenutiarticoli/INSTA_CAPUCCINA.jpg",
                    category: "ospitalità",
                    link: "https://www.italiaatavola.net/....."
                },
                {
                    title: "Venezia, il segreto del Caffè Florian: il più bello del mondo",
                    description: "Oltre tre secoli di storia nel salotto d'Europa",
                    image: "https://www.italiaatavola.net/images/contenutiarticoli/florian_venezia.jpg",
                    category: "cultura",
                    link: "https://www.italiaatavola.net/....."
                }
            ];
        }
        
        populateContent();
        initAnimations();
    } catch (error) {
        console.error('Error loading articles:', error);
    }
}

// Popola i contenuti con gli articoli RSS
function populateContent() {
    // Horizontal scroll gallery
    const horizontalWrapper = document.querySelector('.horizontal-wrapper');
    if (horizontalWrapper) {
        const enogastronomiaArticles = articlesData.filter(a => a.category === 'enogastronomia').slice(0, 8);
        
        horizontalWrapper.innerHTML = enogastronomiaArticles.map(article => `
            <div class="horizontal-item">
                <img src="${article.image}" alt="${article.title}" onerror="this.src='https://via.placeholder.com/400x500?text=CHECK-IN'">
                <div class="horizontal-item-overlay">
                    <h3>${article.title}</h3>
                    <p>${article.description.substring(0, 100)}...</p>
                </div>
            </div>
        `).join('');
    }

    // Interactive grid
    const gridWrapper = document.querySelector('.grid-wrapper');
    if (gridWrapper) {
        gridWrapper.innerHTML = articlesData.slice(0, 12).map(article => `
            <div class="grid-item" data-reveal>
                <img src="${article.image}" alt="${article.title}" onerror="this.src='https://via.placeholder.com/350x400?text=CHECK-IN'">
                <div class="grid-item-content">
                    <span class="grid-item-category">${article.category}</span>
                    <h3>${article.title}</h3>
                </div>
            </div>
        `).join('');
    }

    // Depliant cards
    const depliantGrid = document.querySelector('.depliant-grid');
    if (depliantGrid) {
        const featuredArticles = articlesData.slice(0, 6);
        
        depliantGrid.innerHTML = featuredArticles.map(article => `
            <div class="depliant-card" data-reveal>
                <div class="card-front">
                    <img src="${article.image}" alt="${article.title}" onerror="this.src='https://via.placeholder.com/320x400?text=CHECK-IN'">
                    <div class="card-overlay">
                        <h3>${article.title.substring(0, 50)}...</h3>
                        <p>${article.category}</p>
                    </div>
                </div>
                <div class="card-back">
                    <h3>${article.title}</h3>
                    <p>${article.description}</p>
                    <a href="${article.link}" class="read-more">Leggi tutto →</a>
                </div>
            </div>
        `).join('');
    }
}

// Inizializza tutte le animazioni
function initAnimations() {
    initHeroParallax();
    initPinnedSections();
    initHorizontalScroll();
    initRevealOnScroll();
    initStatsCounter();
}

// ==============================================
// HERO PARALLAX LAYERS
// ==============================================
function initHeroParallax() {
    const layers = document.querySelectorAll('.hero-layers .layer');
    
    window.addEventListener('mousemove', (e) => {
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;
        
        layers.forEach((layer, index) => {
            const speed = parseFloat(layer.dataset.speed);
            const moveX = (x - 0.5) * 50 * speed;
            const moveY = (y - 0.5) * 50 * speed;
            
            layer.style.transform = `translate(${moveX}px, ${moveY}px) scale(1.1)`;
        });
    });

    // Split text animation
    const title = document.querySelector('.hero-title-split');
    if (title) {
        const text = title.textContent;
        title.innerHTML = text.split('').map((char, i) => 
            `<span style="display:inline-block;opacity:0;transform:translateY(50px);animation:fadeInUp 0.8s forwards ${i * 0.05}s;">${char === ' ' ? '&nbsp;' : char}</span>`
        ).join('');
    }

    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeInUp {
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);
}

// ==============================================
// PINNED SECTIONS - Testo fisso, immagini scrollano
// ==============================================
function initPinnedSections() {
    const sections = document.querySelectorAll('.pinned-section');
    
    sections.forEach(section => {
        const content = section.querySelector('.pinned-content');
        const images = section.querySelector('.scrolling-images');
        const imageItems = images?.querySelectorAll('.scroll-image-item');
        
        if (!content || !images || !imageItems) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    handlePinnedScroll(section, content, imageItems);
                }
            });
        }, { threshold: 0.1 });

        observer.observe(section);
    });
}

function handlePinnedScroll(section, content, imageItems) {
    const updateScroll = () => {
        const rect = section.getBoundingClientRect();
        const sectionTop = rect.top;
        const sectionHeight = rect.height;
        const windowHeight = window.innerHeight;

        // Progress: 0 all'inizio, 1 alla fine
        const progress = Math.max(0, Math.min(1, -sectionTop / (sectionHeight - windowHeight)));

        // Pin content quando sezione visibile
        if (sectionTop <= 0 && sectionTop + sectionHeight > windowHeight) {
            content.style.position = 'fixed';
            content.style.top = '50%';
            content.style.left = '0';
            content.style.width = '50%';
            content.style.transform = 'translateY(-50%)';
        } else if (sectionTop > 0) {
            content.style.position = 'absolute';
            content.style.top = '50%';
            content.style.transform = 'translateY(-50%)';
        } else {
            content.style.position = 'absolute';
            content.style.top = 'auto';
            content.style.bottom = windowHeight / 2 + 'px';
            content.style.transform = 'translateY(50%)';
        }

        // Anima le immagini
        const totalImages = imageItems.length;
        imageItems.forEach((item, index) => {
            const imageProgress = (progress * totalImages) - index;
            const clampedProgress = Math.max(0, Math.min(1, imageProgress));
            
            if (imageProgress >= 0 && imageProgress <= 1) {
                item.style.opacity = '1';
                item.style.transform = `translateY(${(1 - clampedProgress) * 50}px) scale(${0.95 + clampedProgress * 0.05})`;
                item.style.zIndex = index;
            } else if (imageProgress < 0) {
                item.style.opacity = '0';
                item.style.transform = 'translateY(100px) scale(0.9)';
            } else {
                item.style.opacity = '0.3';
                item.style.transform = 'translateY(-50px) scale(0.95)';
            }
        });
    };

    window.addEventListener('scroll', updateScroll, { passive: true });
    updateScroll();
}

// ==============================================
// HORIZONTAL SCROLL
// ==============================================
function initHorizontalScroll() {
    const section = document.querySelector('.horizontal-scroll-section');
    const wrapper = document.querySelector('.horizontal-wrapper');
    const items = document.querySelectorAll('.horizontal-item');
    
    if (!section || !wrapper || !items.length) return;

    const itemWidth = items[0].offsetWidth + 32; // width + gap
    const totalWidth = itemWidth * items.length;
    
    section.style.height = totalWidth + window.innerHeight + 'px';

    const updateHorizontalScroll = () => {
        const rect = section.getBoundingClientRect();
        const progress = -rect.top / (rect.height - window.innerHeight);
        
        if (progress >= 0 && progress <= 1) {
            const translateX = progress * (totalWidth - window.innerWidth + 100);
            wrapper.style.transform = `translateX(-${translateX}px)`;
        }
    };

    window.addEventListener('scroll', updateHorizontalScroll, { passive: true });
    updateHorizontalScroll();
}

// ==============================================
// REVEAL ON SCROLL
// ==============================================
function initRevealOnScroll() {
    const elements = document.querySelectorAll('[data-reveal]');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const delay = entry.target.dataset.delay || 0;
                setTimeout(() => {
                    entry.target.classList.add('revealed');
                }, delay);
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -100px 0px'
    });

    elements.forEach(el => observer.observe(el));
}

// ==============================================
// STATS COUNTER
// ==============================================
function initStatsCounter() {
    const numbers = document.querySelectorAll('.stat-number');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.dataset.target);
                animateNumber(entry.target, 0, target, 2000);
                observer.unobserve(entry.target);
            }
        });
    });

    numbers.forEach(num => observer.observe(num));
}

function animateNumber(element, start, end, duration) {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
            element.textContent = end;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

// ==============================================
// INIT
// ==============================================
document.addEventListener('DOMContentLoaded', () => {
    loadRealArticles();
    console.log('🚀 Pro animations loaded');
});