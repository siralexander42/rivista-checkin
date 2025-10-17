// =============================================================================
// SOMMARIO FLOTTANTE - FLOATING INDEX
// =============================================================================

document.addEventListener('DOMContentLoaded', function() {
    
    const heroSommario = document.querySelector('.hero-sommario');
    const floatingBtn = document.querySelector('.floating-sommario-btn');
    const floatingMenu = document.querySelector('.floating-sommario-menu');
    const hero = document.querySelector('.hero-simple');
    
    if (!floatingBtn || !floatingMenu) return;
    
    // =============================================================================
    // GESTIONE VISIBILITÀ PULSANTE FLOTTANTE
    // =============================================================================
    
    function handleScroll() {
        const heroBottom = hero ? hero.getBoundingClientRect().bottom : 0;
        
        // Mostra il pulsante flottante quando si esce dalla hero
        if (heroBottom < 0) {
            floatingBtn.style.display = 'flex';
            setTimeout(() => {
                floatingBtn.style.opacity = '1';
                floatingBtn.style.transform = 'translateY(0)';
            }, 10);
        } else {
            floatingBtn.style.opacity = '0';
            floatingBtn.style.transform = 'translateY(20px)';
            setTimeout(() => {
                if (heroBottom >= 0) {
                    floatingBtn.style.display = 'none';
                }
            }, 300);
            // Chiudi il menu se aperto
            floatingMenu.classList.remove('active');
            floatingBtn.classList.remove('active');
        }
    }
    
    // Inizializza stili
    floatingBtn.style.opacity = '0';
    floatingBtn.style.transform = 'translateY(20px)';
    floatingBtn.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    
    // Ascolta lo scroll con throttle per performance
    let ticking = false;
    window.addEventListener('scroll', function() {
        if (!ticking) {
            window.requestAnimationFrame(function() {
                handleScroll();
                ticking = false;
            });
            ticking = true;
        }
    });
    
    // Controlla subito all'avvio
    handleScroll();
    
    // =============================================================================
    // TOGGLE MENU FLOTTANTE
    // =============================================================================
    
    floatingBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        floatingMenu.classList.toggle('active');
        floatingBtn.classList.toggle('active');
    });
    
    // =============================================================================
    // SMOOTH SCROLL AI LINK
    // =============================================================================
    
    const allSommarioLinks = document.querySelectorAll('.sommario-link');
    
    allSommarioLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                // Chiudi il menu flottante se aperto
                floatingMenu.classList.remove('active');
                floatingBtn.classList.remove('active');
                
                // Smooth scroll
                const offsetTop = targetElement.offsetTop - 80; // 80px per la navbar
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
                
                // Effetto highlight sulla sezione di destinazione
                targetElement.style.transition = 'background-color 0.6s ease';
                targetElement.style.backgroundColor = 'rgba(211, 228, 252, 0.05)';
                
                setTimeout(() => {
                    targetElement.style.backgroundColor = '';
                }, 1500);
            }
        });
    });
    
    // =============================================================================
    // CHIUDI MENU CLICCANDO FUORI
    // =============================================================================
    
    document.addEventListener('click', function(e) {
        if (!floatingMenu.contains(e.target) && !floatingBtn.contains(e.target)) {
            floatingMenu.classList.remove('active');
            floatingBtn.classList.remove('active');
        }
    });
    
    // =============================================================================
    // EVIDENZIA SEZIONE ATTIVA (OPTIONAL)
    // =============================================================================
    
    const sections = document.querySelectorAll('section[id]');
    
    function highlightActiveSection() {
        const scrollPos = window.scrollY + 150;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                // Rimuovi active da tutti
                allSommarioLinks.forEach(link => {
                    link.classList.remove('active-section');
                });
                
                // Aggiungi active al link corrispondente
                const activeLink = document.querySelector(`.sommario-link[href="#${sectionId}"]`);
                if (activeLink) {
                    activeLink.classList.add('active-section');
                }
            }
        });
    }
    
    // Stile per sezione attiva
    const style = document.createElement('style');
    style.textContent = `
        .sommario-link.active-section {
            background: rgba(211, 228, 252, 0.15) !important;
            border-color: rgba(211, 228, 252, 0.4) !important;
            color: #ffffff !important;
        }
        .sommario-link.active-section::before {
            transform: scaleY(1) !important;
        }
    `;
    document.head.appendChild(style);
    
    // Controlla la sezione attiva durante lo scroll
    let activeCheckTicking = false;
    window.addEventListener('scroll', function() {
        if (!activeCheckTicking) {
            window.requestAnimationFrame(function() {
                highlightActiveSection();
                activeCheckTicking = false;
            });
            activeCheckTicking = true;
        }
    });
    
    // Controlla subito
    highlightActiveSection();
    
});
