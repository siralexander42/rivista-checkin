// seo-analyzer.js - Sistema di Analisi SEO
// Basato su best practices SEO e linee guida Google

/**
 * Analizza i metadati SEO e restituisce un punteggio
 * @param {Object} data - Dati SEO da analizzare
 * @returns {Object} - Score e issues rilevati
 */
function analyzeSEO(data) {
    const issues = [];
    let score = 100;
    
    // Analisi Meta Title
    if (!data.metaTitle || data.metaTitle.trim().length === 0) {
        issues.push({
            type: 'error',
            category: 'Meta Title',
            message: 'Meta Title mancante',
            impact: -20,
            suggestion: 'Aggiungi un titolo descrittivo di 50-60 caratteri'
        });
        score -= 20;
    } else {
        const titleLength = data.metaTitle.length;
        if (titleLength < 30) {
            issues.push({
                type: 'warning',
                category: 'Meta Title',
                message: 'Meta Title troppo corto',
                impact: -10,
                suggestion: 'Aumenta la lunghezza a 50-60 caratteri per migliore visibilità'
            });
            score -= 10;
        } else if (titleLength > 60) {
            issues.push({
                type: 'warning',
                category: 'Meta Title',
                message: 'Meta Title troppo lungo',
                impact: -5,
                suggestion: 'Riduci a massimo 60 caratteri per evitare troncamento'
            });
            score -= 5;
        } else if (titleLength >= 50 && titleLength <= 60) {
            issues.push({
                type: 'success',
                category: 'Meta Title',
                message: 'Lunghezza ottimale del titolo',
                impact: 0
            });
        }
        
        // Check per keywords nel title
        if (!containsKeywords(data.metaTitle, data.metaKeywords)) {
            issues.push({
                type: 'warning',
                category: 'Meta Title',
                message: 'Nessuna keyword principale nel titolo',
                impact: -8,
                suggestion: 'Includi almeno una keyword rilevante nel titolo'
            });
            score -= 8;
        }
    }
    
    // Analisi Meta Description
    if (!data.metaDescription || data.metaDescription.trim().length === 0) {
        issues.push({
            type: 'error',
            category: 'Meta Description',
            message: 'Meta Description mancante',
            impact: -15,
            suggestion: 'Aggiungi una description di 120-160 caratteri'
        });
        score -= 15;
    } else {
        const descLength = data.metaDescription.length;
        if (descLength < 70) {
            issues.push({
                type: 'warning',
                category: 'Meta Description',
                message: 'Meta Description troppo corta',
                impact: -8,
                suggestion: 'Espandi a 120-160 caratteri per massimo impatto'
            });
            score -= 8;
        } else if (descLength > 160) {
            issues.push({
                type: 'warning',
                category: 'Meta Description',
                message: 'Meta Description troppo lunga',
                impact: -5,
                suggestion: 'Riduci a massimo 160 caratteri'
            });
            score -= 5;
        } else if (descLength >= 120 && descLength <= 160) {
            issues.push({
                type: 'success',
                category: 'Meta Description',
                message: 'Lunghezza ottimale della description',
                impact: 0
            });
        }
        
        // Check CTA (Call to Action)
        if (!hasCTA(data.metaDescription)) {
            issues.push({
                type: 'info',
                category: 'Meta Description',
                message: 'Considera di aggiungere una Call-to-Action',
                impact: -3,
                suggestion: 'Parole come "Scopri", "Leggi", "Esplora" aumentano il CTR'
            });
            score -= 3;
        }
    }
    
    // Analisi Keywords
    if (!data.metaKeywords || data.metaKeywords.trim().length === 0) {
        issues.push({
            type: 'warning',
            category: 'Keywords',
            message: 'Keywords non definite',
            impact: -10,
            suggestion: 'Aggiungi 5-10 keywords rilevanti'
        });
        score -= 10;
    } else {
        const keywords = data.metaKeywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
        if (keywords.length > 10) {
            issues.push({
                type: 'warning',
                category: 'Keywords',
                message: 'Troppe keywords',
                impact: -5,
                suggestion: 'Limita a 5-10 keywords più rilevanti'
            });
            score -= 5;
        } else if (keywords.length < 3) {
            issues.push({
                type: 'warning',
                category: 'Keywords',
                message: 'Poche keywords',
                impact: -5,
                suggestion: 'Aggiungi almeno 5 keywords per migliore targeting'
            });
            score -= 5;
        } else {
            issues.push({
                type: 'success',
                category: 'Keywords',
                message: `${keywords.length} keywords definite`,
                impact: 0
            });
        }
    }
    
    // Analisi Canonical URL
    if (data.canonicalUrl && !isValidURL(data.canonicalUrl)) {
        issues.push({
            type: 'error',
            category: 'Canonical URL',
            message: 'URL canonico non valido',
            impact: -10,
            suggestion: 'Inserisci un URL completo e valido (es: https://...)'
        });
        score -= 10;
    } else if (data.canonicalUrl) {
        issues.push({
            type: 'success',
            category: 'Canonical URL',
            message: 'URL canonico configurato correttamente',
            impact: 0
        });
    }
    
    // Analisi Open Graph Image
    if (!data.ogImage) {
        issues.push({
            type: 'warning',
            category: 'Social Media',
            message: 'Immagine Open Graph mancante',
            impact: -8,
            suggestion: 'Aggiungi un\'immagine 1200x630px per condivisioni social'
        });
        score -= 8;
    } else if (!isValidURL(data.ogImage)) {
        issues.push({
            type: 'error',
            category: 'Social Media',
            message: 'URL immagine OG non valido',
            impact: -5,
            suggestion: 'Inserisci un URL immagine completo e valido'
        });
        score -= 5;
    } else {
        issues.push({
            type: 'success',
            category: 'Social Media',
            message: 'Immagine Open Graph configurata',
            impact: 0
        });
    }
    
    // Analisi Robots Meta
    if (data.robotsMeta === 'noindex,follow' || data.robotsMeta === 'noindex,nofollow') {
        issues.push({
            type: 'warning',
            category: 'Indicizzazione',
            message: 'Pagina esclusa dall\'indicizzazione',
            impact: 0,
            suggestion: 'La rivista non apparirà nei risultati di ricerca'
        });
    } else {
        issues.push({
            type: 'success',
            category: 'Indicizzazione',
            message: 'Configurazione robots ottimale',
            impact: 0
        });
    }
    
    // Limita score a 0-100
    score = Math.max(0, Math.min(100, score));
    
    return {
        score: Math.round(score),
        issues: issues,
        grade: getGrade(score)
    };
}

/**
 * Controlla se il testo contiene keywords
 */
function containsKeywords(text, keywordsStr) {
    if (!keywordsStr) return false;
    const keywords = keywordsStr.toLowerCase().split(',').map(k => k.trim());
    const textLower = text.toLowerCase();
    return keywords.some(keyword => textLower.includes(keyword));
}

/**
 * Controlla se il testo contiene una Call-to-Action
 */
function hasCTA(text) {
    const ctaWords = ['scopri', 'leggi', 'esplora', 'visita', 'guarda', 'trova', 'scarica', 'prova', 'inizia', 'clicca'];
    const textLower = text.toLowerCase();
    return ctaWords.some(word => textLower.includes(word));
}

/**
 * Valida URL
 */
function isValidURL(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;  
    }
}

/**
 * Restituisce il grado SEO
 */
function getGrade(score) {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
}

/**
 * Renderizza i risultati SEO
 */
function renderSEOResults(result) {
    const scoreValue = document.getElementById('seoScoreValue');
    const progressBar = document.getElementById('seoProgressBar');
    const issuesContainer = document.getElementById('seoIssues');
    
    if (scoreValue) {
        scoreValue.textContent = result.score;
        scoreValue.style.color = getScoreColor(result.score);
    }
    
    if (progressBar) {
        progressBar.style.width = result.score + '%';
        progressBar.style.background = getProgressGradient(result.score);
    }
    
    if (issuesContainer) {
        let html = '';
        
        // Raggruppa issues per tipo
        const errors = result.issues.filter(i => i.type === 'error');
        const warnings = result.issues.filter(i => i.type === 'warning');
        const successes = result.issues.filter(i => i.type === 'success');
        const infos = result.issues.filter(i => i.type === 'info');
        
        if (errors.length > 0) {
            html += renderIssueGroup('Errori Critici', errors, '#ef4444');
        }
        if (warnings.length > 0) {
            html += renderIssueGroup('Avvisi', warnings, '#f59e0b');
        }
        if (successes.length > 0) {
            html += renderIssueGroup('Elementi Ottimali', successes, '#10b981');
        }
        if (infos.length > 0) {
            html += renderIssueGroup('Suggerimenti', infos, '#3b82f6');
        }
        
        issuesContainer.innerHTML = html;
    }
}

function renderIssueGroup(title, issues, color) {
    const icons = {
        'error': '❌',
        'warning': '⚠️',
        'success': '✅',
        'info': '💡'
    };
    
    let html = `
        <div style="margin-bottom: 20px;">
            <h4 style="color: ${color}; font-size: 14px; font-weight: 600; margin-bottom: 12px;">${title}</h4>
            <div style="display: flex; flex-direction: column; gap: 12px;">
    `;
    
    issues.forEach(issue => {
        html += `
            <div style="padding: 12px 16px; background: ${color}10; border-left: 3px solid ${color}; border-radius: 8px;">
                <div style="display: flex; align-items: start; gap: 10px;">
                    <span style="font-size: 18px;">${icons[issue.type]}</span>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: #1e293b; font-size: 13px; margin-bottom: 4px;">
                            ${issue.category}: ${issue.message}
                        </div>
                        ${issue.suggestion ? `<div style="font-size: 12px; color: #64748b;">${issue.suggestion}</div>` : ''}
                    </div>
                </div>
            </div>
        `;
    });
    
    html += `
            </div>
        </div>
    `;
    
    return html;
}

function getScoreColor(score) {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
}

function getProgressGradient(score) {
    if (score >= 80) return 'linear-gradient(90deg, #10b981 0%, #22c55e 100%)';
    if (score >= 60) return 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)';
    return 'linear-gradient(90deg, #ef4444 0%, #f87171 100%)';
}

// Export per uso globale
if (typeof window !== 'undefined') {
    window.analyzeSEO = analyzeSEO;
    window.renderSEOResults = renderSEOResults;
}
