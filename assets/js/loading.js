/**
 * LOADING SCREEN - Departure Board Animation
 * Simula tabellone partenze vintage anni '70 con flip meccanici
 */

(function() {
    'use strict';

    // Attendi che il DOM sia pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDepartureBoard);
    } else {
        initDepartureBoard();
    }

    function initDepartureBoard() {
        // Blocca scroll durante loading
        document.body.style.overflow = 'hidden';
        
        const flipLetters = document.querySelectorAll('.flip-letter[data-flips]');
        
        let maxDuration = 0;
        
        flipLetters.forEach((letter, index) => {
            const flipsData = letter.getAttribute('data-flips');
            if (!flipsData) return;
            
            // Parse: "S,E,I,7,S" -> [S, E, I, 7, S]
            const sequence = flipsData.split(',');
            const finalLetter = sequence[sequence.length - 1];
            
            // Timing MOLTO più lento - finisce a ~3.9 secondi
            const baseDelay = 150 + (index * 40); // Delay iniziale per ogni lettera
            const flipDuration = 380; // Durata di ogni flip (molto più lento)
            
            // Calcola durata totale per questa lettera
            const totalDuration = baseDelay + (sequence.length * flipDuration);
            maxDuration = Math.max(maxDuration, totalDuration);
            
            // Anima ogni flip
            sequence.forEach((char, flipIndex) => {
                setTimeout(() => {
                    letter.textContent = char;
                    letter.setAttribute('data-letter', char);
                }, baseDelay + (flipIndex * flipDuration));
            });
        });
        
        // Chiudi loading screen dopo che tutte le animazioni sono finite
        setTimeout(() => {
            const loadingScreen = document.querySelector('.loading-screen');
            if (loadingScreen) {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                    document.body.style.overflow = 'auto'; // Riabilita scroll
                }, 500);
            }
        }, maxDuration + 600); // Aggiungi un po' di pausa dopo l'ultima lettera
    }
})();
