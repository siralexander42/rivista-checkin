// =============================================================================
// LAGO DI GARDA - MOVIMENTO ANIMATIONS
// =============================================================================

document.addEventListener('DOMContentLoaded', function() {
    
    // Hero Image Rotation
    const imageStack = document.querySelector('.movement-image-stack');
    if (imageStack) {
        const images = imageStack.querySelectorAll('.movement-img');
        let currentIndex = 0;

        function rotateImages() {
            images[currentIndex].classList.remove('active');
            currentIndex = (currentIndex + 1) % images.length;
            images[currentIndex].classList.add('active');
        }

        // Cambia immagine ogni 5 secondi
        setInterval(rotateImages, 5000);
    }

    // AOS (Animate On Scroll) - Simple Implementation
    const observerOptions = {
        threshold: 0.2,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('aos-animate');
            }
        });
    }, observerOptions);

    // Osserva tutti gli elementi con data-aos
    document.querySelectorAll('[data-aos]').forEach(el => {
        observer.observe(el);
    });

    // Card Hover Effects - Parallax sul numero
    const cards = document.querySelectorAll('.movement-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;
            
            const number = card.querySelector('.movement-card-number');
            if (number) {
                number.style.transform = `translate(${rotateY}px, ${rotateX}px)`;
            }
        });

        card.addEventListener('mouseleave', () => {
            const number = card.querySelector('.movement-card-number');
            if (number) {
                number.style.transform = 'translate(0, 0)';
            }
        });
    });

    // =============================================================================
    // INTERACTIVE MAP FUNCTIONALITY - Google Maps + Custom Markers
    // =============================================================================
    
    const customMarkers = document.querySelectorAll('.custom-marker');
    const mapPopups = document.querySelectorAll('.map-popup');
    const mapContainer = document.querySelector('.garda-map-container');
    let activePopup = null;
    let activeMarker = null;

    // Funzione per posizionare il popup vicino al marker
    function positionPopup(popup, markerElement) {
        const container = mapContainer.getBoundingClientRect();
        const marker = markerElement.getBoundingClientRect();
        const popupWidth = 300;
        const popupHeight = popup.offsetHeight || 380;
        
        // Calcola posizione relativa al container
        let left = marker.left - container.left + marker.width / 2;
        let top = marker.top - container.top;
        
        // Sposta il popup a destra o sinistra del marker
        if (left > container.width / 2) {
            // Marker sulla destra, popup a sinistra
            left = left - popupWidth - 30;
        } else {
            // Marker sulla sinistra, popup a destra
            left = left + 30;
        }
        
        // Centra verticalmente rispetto al marker
        top = top - popupHeight / 2 + marker.height / 2;
        
        // Assicurati che il popup rimanga dentro il container
        if (left < 10) left = 10;
        if (left + popupWidth > container.width - 10) left = container.width - popupWidth - 10;
        if (top < 10) top = 10;
        if (top + popupHeight > container.height - 10) top = container.height - popupHeight - 10;
        
        popup.style.left = `${left}px`;
        popup.style.top = `${top}px`;
    }

    // Chiudi popup attivo
    function closeActivePopup() {
        if (activePopup) {
            activePopup.classList.remove('active');
            activePopup = null;
        }
        if (activeMarker) {
            activeMarker.classList.remove('active');
            activeMarker = null;
        }
    }

    // Aggiungi event listener ai marker custom - CLICK invece di hover
    customMarkers.forEach(marker => {
        marker.addEventListener('click', function(e) {
            e.stopPropagation();
            const location = this.getAttribute('data-location');
            const popup = document.getElementById(`popup-${location}`);
            
            if (popup) {
                // Se stesso marker, chiudi
                if (activeMarker === this) {
                    closeActivePopup();
                    return;
                }
                
                closeActivePopup();
                activePopup = popup;
                activeMarker = this;
                
                // Aggiungi classe active al marker
                this.classList.add('active');
                
                // Posiziona e mostra il popup
                positionPopup(popup, this);
                
                // Piccolo delay per permettere il calcolo dell'altezza
                setTimeout(() => {
                    popup.classList.add('active');
                }, 10);
            }
        });
    });

    // Mantieni il popup aperto quando il mouse è sopra
    mapPopups.forEach(popup => {
        popup.addEventListener('mouseenter', function() {
            this.classList.add('active');
        });
    });

    // Pulsante chiudi popup
    document.querySelectorAll('.popup-close').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            closeActivePopup();
        });
    });

    // Chiudi popup quando si clicca fuori
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.custom-marker') && !e.target.closest('.map-popup')) {
            closeActivePopup();
        }
    });
});
