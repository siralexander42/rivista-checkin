// ==============================================
// SISTEMA AVANZATO DI ANIMAZIONI CHECK-IN
// ==============================================

class AnimationEngine {
    constructor() {
        this.activeAnimations = new Set();
        this.observers = new Map();
        this.rafId = null;
        this.init();
    }

    init() {
        this.setupIntersectionObserver();
        this.setupPerformanceOptimizations();
        this.createAnimationLibrary();
    }

    // ==============================================
    // INTERSECTION OBSERVER PER PERFORMANCE
    // ==============================================

    setupIntersectionObserver() {
        const options = {
            root: null,
            rootMargin: '50px',
            threshold: [0, 0.25, 0.5, 0.75, 1]
        };

        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.triggerAnimation(entry.target);
                } else {
                    this.pauseAnimation(entry.target);
                }
            });
        }, options);
    }

    observeElement(element, animationType) {
        element.dataset.animationType = animationType;
        this.intersectionObserver.observe(element);
    }

    triggerAnimation(element) {
        const animationType = element.dataset.animationType;
        if (animationType && !element.classList.contains('animated')) {
            this.playAnimation(element, animationType);
        }
    }

    pauseAnimation(element) {
        // Pausa animazioni costose quando fuori dalla vista
        if (element.classList.contains('expensive-animation')) {
            element.style.animationPlayState = 'paused';
        }
    }

    // ==============================================
    // LIBRERIA DI ANIMAZIONI
    // ==============================================

    createAnimationLibrary() {
        this.animations = {
            // Animazioni di entrata
            fadeInUp: {
                keyframes: [
                    { opacity: 0, transform: 'translateY(50px)' },
                    { opacity: 1, transform: 'translateY(0)' }
                ],
                options: { duration: 800, easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' }
            },

            slideInLeft: {
                keyframes: [
                    { opacity: 0, transform: 'translateX(-100px)' },
                    { opacity: 1, transform: 'translateX(0)' }
                ],
                options: { duration: 600, easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' }
            },

            scaleIn: {
                keyframes: [
                    { opacity: 0, transform: 'scale(0.8)' },
                    { opacity: 1, transform: 'scale(1)' }
                ],
                options: { duration: 500, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }
            },

            rotateIn: {
                keyframes: [
                    { opacity: 0, transform: 'rotate(-90deg) scale(0.8)' },
                    { opacity: 1, transform: 'rotate(0deg) scale(1)' }
                ],
                options: { duration: 700, easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)' }
            },

            // Animazioni hover avanzate
            magneticHover: {
                enter: (element, event) => {
                    const rect = element.getBoundingClientRect();
                    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 20;
                    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 20;
                    
                    element.style.transform = `translate(${x}px, ${y}px) scale(1.05)`;
                    element.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                },
                leave: (element) => {
                    element.style.transform = 'translate(0, 0) scale(1)';
                }
            },

            // Animazioni di testo
            typewriter: {
                async play(element, text, speed = 50) {
                    element.textContent = '';
                    for (let i = 0; i < text.length; i++) {
                        await new Promise(resolve => setTimeout(resolve, speed));
                        element.textContent += text[i];
                    }
                }
            },

            textShuffle: {
                async play(element, finalText, duration = 1000) {
                    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                    const steps = 20;
                    const stepDuration = duration / steps;
                    
                    for (let step = 0; step < steps; step++) {
                        let shuffled = '';
                        for (let i = 0; i < finalText.length; i++) {
                            if (Math.random() < step / steps) {
                                shuffled += finalText[i];
                            } else {
                                shuffled += chars[Math.floor(Math.random() * chars.length)];
                            }
                        }
                        element.textContent = shuffled;
                        await new Promise(resolve => setTimeout(resolve, stepDuration));
                    }
                    element.textContent = finalText;
                }
            }
        };
    }

    // ==============================================
    // RIPRODUZIONE ANIMAZIONI
    // ==============================================

    async playAnimation(element, animationType, options = {}) {
        const animation = this.animations[animationType];
        if (!animation) {
            console.warn(`Animation type "${animationType}" not found`);
            return;
        }

        element.classList.add('animated', `animation-${animationType}`);

        if (animation.keyframes) {
            const webAnimation = element.animate(
                animation.keyframes,
                { ...animation.options, ...options }
            );

            this.activeAnimations.add(webAnimation);

            webAnimation.addEventListener('finish', () => {
                this.activeAnimations.delete(webAnimation);
                element.classList.add('animation-complete');
            });

            return webAnimation;
        }

        if (animation.play) {
            await animation.play(element, options.text, options.speed);
        }
    }

    // ==============================================
    // ANIMAZIONI SEQUENZIALI
    // ==============================================

    async playSequence(elements, animationType, delay = 100) {
        const animations = [];
        
        for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            const animationDelay = i * delay;
            
            setTimeout(() => {
                const animation = this.playAnimation(element, animationType);
                animations.push(animation);
            }, animationDelay);
        }

        return Promise.all(animations);
    }

    // ==============================================
    // ANIMAZIONI PARTICELLARI
    // ==============================================

    createParticleSystem(container, config = {}) {
        const defaultConfig = {
            count: 50,
            colors: ['#c41e3a', '#d4af37', '#2c5aa0'],
            size: { min: 2, max: 6 },
            speed: { min: 1, max: 3 },
            direction: 'random',
            life: 3000
        };

        const finalConfig = { ...defaultConfig, ...config };
        const particles = [];

        for (let i = 0; i < finalConfig.count; i++) {
            const particle = this.createParticle(finalConfig);
            container.appendChild(particle.element);
            particles.push(particle);
        }

        this.animateParticles(particles);
        return particles;
    }

    createParticle(config) {
        const element = document.createElement('div');
        const size = this.random(config.size.min, config.size.max);
        const color = config.colors[Math.floor(Math.random() * config.colors.length)];
        
        element.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            border-radius: 50%;
            pointer-events: none;
            opacity: ${Math.random() * 0.8 + 0.2};
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
        `;

        return {
            element,
            vx: (Math.random() - 0.5) * this.random(config.speed.min, config.speed.max),
            vy: (Math.random() - 0.5) * this.random(config.speed.min, config.speed.max),
            life: config.life,
            maxLife: config.life
        };
    }

    animateParticles(particles) {
        const animate = () => {
            particles.forEach(particle => {
                const rect = particle.element.getBoundingClientRect();
                const newX = rect.left + particle.vx;
                const newY = rect.top + particle.vy;
                
                particle.element.style.left = newX + 'px';
                particle.element.style.top = newY + 'px';
                
                particle.life -= 16; // ~60fps
                particle.element.style.opacity = particle.life / particle.maxLife;
                
                if (particle.life <= 0) {
                    particle.element.remove();
                    particles.splice(particles.indexOf(particle), 1);
                }
            });

            if (particles.length > 0) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    // ==============================================
    // MORPHING E TRASFORMAZIONI
    // ==============================================

    morphPath(pathElement, newPath, duration = 1000) {
        const currentPath = pathElement.getAttribute('d');
        
        if (!currentPath) return;

        const animation = pathElement.animate([
            { d: currentPath },
            { d: newPath }
        ], {
            duration,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            fill: 'forwards'
        });

        animation.addEventListener('finish', () => {
            pathElement.setAttribute('d', newPath);
        });

        return animation;
    }

    // ==============================================
    // ANIMAZIONI 3D E PROSPETTIVA
    // ==============================================

    setup3DContainer(element) {
        element.style.perspective = '1000px';
        element.style.perspectiveOrigin = '50% 50%';
    }

    animate3DFlip(element, axis = 'Y', duration = 600) {
        const isY = axis.toUpperCase() === 'Y';
        const transform = isY ? 'rotateY' : 'rotateX';
        
        return element.animate([
            { transform: `${transform}(0deg)` },
            { transform: `${transform}(90deg)` },
            { transform: `${transform}(180deg)` }
        ], {
            duration,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        });
    }

    // ==============================================
    // ANIMAZIONI RESPONSIVE
    // ==============================================

    getResponsiveConfig() {
        const width = window.innerWidth;
        
        if (width < 768) {
            return {
                duration: 400,
                delay: 50,
                particles: 20,
                reducedMotion: true
            };
        } else if (width < 1024) {
            return {
                duration: 600,
                delay: 75,
                particles: 35,
                reducedMotion: false
            };
        } else {
            return {
                duration: 800,
                delay: 100,
                particles: 50,
                reducedMotion: false
            };
        }
    }

    // ==============================================
    // PERFORMANCE E OTTIMIZZAZIONI
    // ==============================================

    setupPerformanceOptimizations() {
        // Rileva preferenze utente per motion ridotto
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        this.shouldReduceMotion = prefersReducedMotion.matches;
        
        prefersReducedMotion.addEventListener('change', (e) => {
            this.shouldReduceMotion = e.matches;
        });

        // Ottimizza per prestazioni su dispositivi lenti
        this.setupFrameRateOptimization();
    }

    setupFrameRateOptimization() {
        let lastFrameTime = 0;
        let frameCount = 0;
        let fps = 60;

        const measureFPS = (currentTime) => {
            frameCount++;
            
            if (currentTime - lastFrameTime >= 1000) {
                fps = frameCount;
                frameCount = 0;
                lastFrameTime = currentTime;
                
                // Adatta la qualità delle animazioni in base ai FPS
                this.adaptAnimationQuality(fps);
            }
            
            requestAnimationFrame(measureFPS);
        };

        requestAnimationFrame(measureFPS);
    }

    adaptAnimationQuality(fps) {
        if (fps < 30) {
            // Riduci la qualità delle animazioni
            document.documentElement.style.setProperty('--animation-quality', 'low');
        } else if (fps < 50) {
            document.documentElement.style.setProperty('--animation-quality', 'medium');
        } else {
            document.documentElement.style.setProperty('--animation-quality', 'high');
        }
    }

    // ==============================================
    // UTILITY
    // ==============================================

    random(min, max) {
        return Math.random() * (max - min) + min;
    }

    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    }

    lerp(start, end, factor) {
        return start + (end - start) * factor;
    }

    // Cleanup
    destroy() {
        this.activeAnimations.forEach(animation => animation.cancel());
        this.activeAnimations.clear();
        
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
        }
        
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
        }
    }
}

// ==============================================
// STILI CSS PER ANIMAZIONI
// ==============================================

const animationStyles = `
    .animated {
        animation-fill-mode: both;
    }
    
    .animation-fadeInUp {
        animation-name: fadeInUp;
    }
    
    .animation-slideInLeft {
        animation-name: slideInLeft;
    }
    
    .animation-scaleIn {
        animation-name: scaleIn;
    }
    
    .animation-rotateIn {
        animation-name: rotateIn;
    }
    
    /* Riduzione motion per accessibilità */
    @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
        }
    }
    
    /* Ottimizzazioni prestazioni */
    .gpu-accelerated {
        transform: translateZ(0);
        will-change: transform;
    }
    
    .animation-quality-low .expensive-animation {
        animation: none !important;
    }
    
    .animation-quality-medium .expensive-animation {
        animation-duration: 0.5s !important;
    }
`;

// Inserisci gli stili
const animationStyleSheet = document.createElement('style');
animationStyleSheet.textContent = animationStyles;
document.head.appendChild(animationStyleSheet);

// ==============================================
// INIZIALIZZAZIONE GLOBALE
// ==============================================

window.animationEngine = new AnimationEngine();
window.AnimationEngine = AnimationEngine;