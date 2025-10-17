// ==============================================
// MAIN.JS - Script principale pulito
// ==============================================

// Hero background alternation
function initHeroBackgrounds() {
    const backgrounds = document.querySelectorAll('.hero-bg');
    if (!backgrounds.length) return;
    
    let currentIndex = 0;
    
    setInterval(() => {
        backgrounds[currentIndex].classList.remove('active');
        currentIndex = (currentIndex + 1) % backgrounds.length;
        backgrounds[currentIndex].classList.add('active');
    }, 5000); // Cambia ogni 5 secondi
}

// Dati articoli (usare quelli del RSS quando disponibili)
let articles = [];

// Carica articoli
function loadArticles() {
    // Usa articoli dal RSS se disponibili
    if (window.articlesFromRSS && window.articlesFromRSS.length > 0) {
        articles = window.articlesFromRSS;
    } else {
        // Fallback con articoli di esempio
        articles = [
            {
                title: "In Repubblica Ceca la magia del Natale comincia già a novembre",
                description: "Praga si trasforma in un villaggio incantato",
                image: "https://www.italiaatavola.net/images/contenutiarticoli/praga_natale.jpg",
                category: "viaggi"
            },
            {
                title: "Massimo Cosmo e i sapori di Napoli che seducono Prato",
                description: "Lo chef napoletano conquista la Toscana",
                image: "https://www.italiaatavola.net/images/contenutiarticoli/cosmo_prato.jpg",
                category: "enogastronomia"
            },
            {
                title: "Nel Novarese un casale del Cinquecento è un'oasi di charme",
                description: "La Capuccina: storia e benessere",
                image: "https://www.italiaatavola.net/images/contenutiarticoli/INSTA_CAPUCCINA.jpg",
                category: "ospitalità"
            },
            {
                title: "Venezia, il segreto del Caffè Florian",
                description: "Il caffè più bello del mondo",
                image: "https://www.italiaatavola.net/images/contenutiarticoli/florian_venezia.jpg",
                category: "cultura"
            }
        ];
    }
    
    populateGrid();
    initScrollEffects();
}

// Popola la griglia articoli
function populateGrid() {
    const wrapper = document.querySelector('.articles-wrapper');
    if (!wrapper) return;
    
    wrapper.innerHTML = articles.map(article => `
        <div class="article-card">
            <img src="${article.image}" 
                 alt="${article.title}"
                 onerror="this.src='https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400'">
            <div class="article-content">
                <div class="article-category">${article.category}</div>
                <h3>${article.title}</h3>
            </div>
        </div>
    `).join('');
}

// Effetto scroll immagini nelle sezioni story - DISABILITATO per usare controlli manuali
function initScrollEffects() {
    // Disabilitato - usiamo i controlli manuali invece dello scroll automatico
    console.log('ℹ️ Scroll automatico immagini disabilitato - controlli manuali attivi');
}

function handleImageScroll(section, images) {
    // Funzione disabilitata - usiamo controlli manuali
}

// Inizializza tutto
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 CHECK-IN Magazine loaded');
    initHeroBackgrounds();
    loadArticles();
    initParallaxHero();
    initSmoothScroll();
    initNavbarScroll();
    
    // Ritardiamo l'inizializzazione dei counter per dare tempo al DOM di caricarsi completamente
    setTimeout(() => {
        console.log('⏰ Inizializzazione counter ritardata');
        initCounterAnimation();
    }, 500);
    
    initImageControls();
    initHolographicEffect();
    initTypewriter();
});

// Typewriter effect for hero subtitle
function initTypewriter() {
    const subtitle = document.querySelector('.hero-subtitle');
    const description = document.querySelector('.hero-description');
    if (!subtitle) {
        console.log('❌ Subtitle non trovato');
        return;
    }
    
    // Prendi il testo dal data attribute
    const text = subtitle.getAttribute('data-text') || subtitle.textContent.trim();
    
    // Svuota completamente il contenuto
    subtitle.innerHTML = '';
    
    console.log('🎬 Typewriter pronto. Aspetto fine loading...');
    
    // ASPETTA CHE IL LOADING SIA FINITO
    window.addEventListener('loadingComplete', () => {
        console.log('📝 Loading finito! Inizio a scrivere:', text);
        
        subtitle.classList.add('typing');
        let charIndex = 0;
        
        function typeChar() {
            if (charIndex < text.length) {
                subtitle.textContent += text.charAt(charIndex);
                charIndex++;
                setTimeout(typeChar, 50); // 50ms per carattere
            } else {
                console.log('✅ Scrittura completata! IL TESTO RESTA VISIBILE PER SEMPRE');
                
                // IMPORTANTE: Aggiungi classe 'typed' per mantenerlo visibile
                subtitle.classList.add('typed');
                
                // Rimuovi solo il cursore lampeggiante dopo 1.5 secondi
                setTimeout(() => {
                    subtitle.classList.remove('typing');
                    subtitle.style.borderRight = 'none';
                    
                    // Mostra la descrizione
                    if (description) {
                        description.classList.add('visible');
                        console.log('👁️ Descrizione mostrata');
                    }
                }, 1500);
            }
        }
        
        // Inizia a scrivere dopo 800ms dalla fine del loading
        setTimeout(typeChar, 800);
    }, { once: true });
}

// Counter animato per i numeri
function initCounterAnimation() {
    const counters = document.querySelectorAll('.detail-item strong');
    console.log('🔢 Counters trovati:', counters.length);
    
    if (counters.length === 0) {
        console.log('⚠️ Nessun counter trovato!');
        return;
    }
    
    counters.forEach((counter, index) => {
        console.log(`Counter ${index}:`, counter.textContent, counter);
    });
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            console.log('👀 Observer triggered:', entry.target.textContent, 'isIntersecting:', entry.isIntersecting, 'intersectionRatio:', entry.intersectionRatio);
            if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                console.log('✅ Animating:', entry.target.textContent);
                entry.target.classList.add('counted');
                animateCounter(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    counters.forEach(counter => {
        observer.observe(counter);
        console.log('👁️ Observer attached to:', counter.textContent);
    });
}

function animateCounter(element) {
    const text = element.textContent;
    const hasPlus = text.includes('+');
    const number = parseInt(text.replace(/\D/g, ''));
    
    console.log('🎬 Starting animation for:', text, 'Extracted number:', number);
    
    if (isNaN(number)) {
        console.log('❌ NaN detected for:', text);
        return;
    }
    
    const duration = 2500;
    const steps = 80;
    const increment = number / steps;
    let current = 0;
    let step = 0;
    
    const easeOutQuart = (x) => {
        return 1 - Math.pow(1 - x, 4);
    };
    
    const timer = setInterval(() => {
        step++;
        const progress = step / steps;
        const easedProgress = easeOutQuart(progress);
        current = Math.floor(number * easedProgress);
        
        element.textContent = hasPlus ? current + '+' : current + ' giorni';
        
        if (step >= steps) {
            clearInterval(timer);
            element.textContent = text;
        }
    }, duration / steps);
}

// Parallax Hero
function initParallaxHero() {
    const hero = document.querySelector('.hero-simple');
    if (!hero) return;
    
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const parallaxSpeed = 0.5;
        hero.style.transform = `translateY(${scrolled * parallaxSpeed}px)`;
    }, { passive: true });
}

// Smooth scroll per i link
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Navbar scroll effect
function initNavbarScroll() {
    const nav = document.querySelector('.main-nav');
    const scrollIndicator = document.querySelector('.scroll-indicator');
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        // Nascondi scroll indicator dopo aver iniziato a scrollare
        if (currentScroll > 100 && scrollIndicator) {
            scrollIndicator.style.opacity = '0';
            scrollIndicator.style.transform = 'translateX(-50%) translateY(20px)';
        } else if (scrollIndicator) {
            scrollIndicator.style.opacity = '1';
            scrollIndicator.style.transform = 'translateX(-50%) translateY(0)';
        }
        
        if (currentScroll > 100) {
            nav.style.background = 'rgba(10, 10, 15, 0.98)';
            nav.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.3)';
        } else {
            nav.style.background = 'rgba(10, 10, 15, 0.95)';
            nav.style.boxShadow = 'none';
        }
        
        // Hide on scroll down, show on scroll up
        if (currentScroll > lastScroll && currentScroll > 200) {
            nav.style.transform = 'translateY(-100%)';
        } else {
            nav.style.transform = 'translateY(0)';
        }
        
        lastScroll = currentScroll;
    }, { passive: true });
}

// === CONTROLLI MODERNI GALLERY WIDGET ===
function initImageControls() {
    console.log('🎨 Inizializzazione controlli immagini...');
    
    document.querySelectorAll('.image-controls').forEach(ctrl => {
        const storyId = ctrl.querySelector('.image-dots')?.getAttribute('data-story');
        console.log('📷 Story ID trovato:', storyId);
        
        if (!storyId) {
            console.error('❌ data-story non trovato per questo controllo');
            return;
        }
        
        const wrapper = document.querySelector('.image-scroll-wrapper[data-story="' + storyId + '"]');
        console.log('📦 Wrapper trovato:', wrapper);
        
        if (!wrapper) {
            console.error('❌ Wrapper non trovato per story:', storyId);
            return;
        }
        
        const images = wrapper.querySelectorAll('.scroll-image');
        const dots = ctrl.querySelectorAll('.dot');
        console.log(`✅ Trovate ${images.length} immagini per story ${storyId}`);
        
        let current = 0;

        function showImage(idx) {
            console.log(`🔄 Cambio immagine: ${current} → ${idx}`);
            
            // Rimuovi active da tutte
            images.forEach((img, i) => {
                img.classList.remove('active');
                img.style.opacity = '0';
                img.style.transform = 'translateY(0) scale(0.95)';
            });
            
            // Attiva la nuova
            images[idx].classList.add('active');
            images[idx].style.opacity = '1';
            images[idx].style.transform = 'translateY(0) scale(1)';
            images[idx].style.zIndex = '2';
            
            // Aggiorna dots
            dots.forEach((dot, i) => {
                if (i === idx) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            });
            
            current = idx;
        }

        // Event listeners
        const prevBtn = ctrl.querySelector('.prev-btn');
        const nextBtn = ctrl.querySelector('.next-btn');
        
        if (prevBtn) {
            prevBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('⬅️ Click prev');
                showImage((current - 1 + images.length) % images.length);
            };
        }
        
        if (nextBtn) {
            nextBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('➡️ Click next');
                showImage((current + 1) % images.length);
            };
        }
        
        dots.forEach(dot => {
            dot.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const idx = Number(dot.getAttribute('data-index'));
                console.log('⚫ Click dot:', idx);
                showImage(idx);
            };
        });
        
        // Attiva la prima all'avvio
        showImage(0);
    });
    
    console.log('✅ Controlli immagini inizializzati');
}

// === EFFETTO HOLOGRAFICO 3D ===
function initHolographicEffect() {
    const images = document.querySelectorAll('.scroll-image');
    
    images.forEach(imageWrapper => {
        const img = imageWrapper.querySelector('img');
        if (!img) return;
        
        imageWrapper.addEventListener('mousemove', (e) => {
            if (!imageWrapper.classList.contains('active')) return;
            
            const rect = imageWrapper.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const percentX = (x - centerX) / centerX;
            const percentY = (y - centerY) / centerY;
            
            const rotateX = percentY * -5; // Max 5 gradi
            const rotateY = percentX * 5;
            
            // Effetto 3D tilt
            img.style.transform = `
                scale(1.05) 
                perspective(1000px) 
                rotateX(${rotateX}deg) 
                rotateY(${rotateY}deg)
            `;
            
            // Gradiente che segue il mouse
            const gradientX = (percentX + 1) * 50;
            const gradientY = (percentY + 1) * 50;
            
            imageWrapper.style.setProperty('--mouse-x', `${gradientX}%`);
            imageWrapper.style.setProperty('--mouse-y', `${gradientY}%`);
        });
        
        imageWrapper.addEventListener('mouseleave', () => {
            img.style.transform = 'scale(1.05) perspective(1000px) rotateX(0deg) rotateY(0deg)';
        });
    });
    
    console.log('✨ Effetto holografico attivato');
}