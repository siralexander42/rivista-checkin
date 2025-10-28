// schema-generator.js
// Generatore automatico di Schema.org JSON-LD per ogni tipo di blocco

/**
 * Genera lo schema.org JSON-LD completo per la rivista
 * @param {Object} magazine - Oggetto magazine dal database
 * @returns {Object} Schema.org JSON-LD
 */
function generateMagazineSchema(magazine) {
    const baseUrl = 'https://www.checkin-magazine.it';
    
    return {
        "@context": "https://schema.org",
        "@type": "PublicationIssue",
        "@id": `${baseUrl}/${magazine.slug}`,
        "issueNumber": magazine.edition || "1",
        "name": magazine.name,
        "description": magazine.description || magazine.metaDescription || "La rivista del viaggio",
        "datePublished": magazine.publishDate || magazine.createdAt,
        "dateModified": magazine.updatedAt,
        "inLanguage": "it-IT",
        "url": `${baseUrl}/${magazine.slug}`,
        "isPartOf": {
            "@type": "Periodical",
            "@id": baseUrl,
            "name": "CHECK-IN",
            "description": "La rivista del viaggio",
            "issn": "XXXX-XXXX", // TODO: Richiedere ISSN ufficiale
            "publisher": {
                "@type": "Organization",
                "name": "CHECK-IN Magazine",
                "url": baseUrl,
                "logo": {
                    "@type": "ImageObject",
                    "url": "https://www.italiaatavola.net/images/testate/checkin-testata-hd.svg",
                    "width": "200",
                    "height": "50"
                }
            }
        },
        "publisher": {
            "@type": "Organization",
            "name": "CHECK-IN Magazine",
            "url": baseUrl,
            "logo": {
                "@type": "ImageObject",
                "url": "https://www.italiaatavola.net/images/testate/checkin-testata-hd.svg"
            }
        },
        "image": magazine.coverImage ? {
            "@type": "ImageObject",
            "url": magazine.coverImage
        } : undefined
    };
}

/**
 * Genera lo schema per il blocco COVER
 */
function generateCoverSchema(block, magazine) {
    const baseUrl = 'https://www.checkin-magazine.it';
    const sommarioItems = block.settings?.sommario || [];
    
    return {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "@id": `${baseUrl}/${magazine.slug}`,
        "name": block.title || magazine.name,
        "headline": block.title || magazine.name,
        "description": block.subtitle || magazine.description,
        "url": `${baseUrl}/${magazine.slug}`,
        "inLanguage": "it-IT",
        "isPartOf": {
            "@type": "PublicationIssue",
            "@id": `${baseUrl}/${magazine.slug}`
        },
        "primaryImageOfPage": block.images && block.images[0] ? {
            "@type": "ImageObject",
            "url": block.images[0],
            "caption": block.title || magazine.name
        } : undefined,
        "breadcrumb": {
            "@type": "BreadcrumbList",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Home",
                    "item": baseUrl
                },
                {
                    "@type": "ListItem",
                    "position": 2,
                    "name": magazine.name,
                    "item": `${baseUrl}/${magazine.slug}`
                }
            ]
        },
        "about": sommarioItems.length > 0 ? {
            "@type": "ItemList",
            "name": "Sommario",
            "numberOfItems": sommarioItems.length,
            "itemListElement": sommarioItems.map((item, idx) => ({
                "@type": "ListItem",
                "position": idx + 1,
                "name": item.text,
                "url": item.link
            }))
        } : undefined
    };
}

/**
 * Genera lo schema per il blocco HERO
 */
function generateHeroSchema(block, magazine) {
    const baseUrl = 'https://www.checkin-magazine.it';
    
    return {
        "@context": "https://schema.org",
        "@type": "WebPageElement",
        "@id": `${baseUrl}/${magazine.slug}#hero-${block._id}`,
        "name": block.title,
        "headline": block.title,
        "alternativeHeadline": block.subtitle,
        "description": stripHtmlTags(block.content),
        "image": block.image ? {
            "@type": "ImageObject",
            "url": block.image,
            "caption": block.title
        } : undefined,
        "url": block.link,
        "potentialAction": block.link && block.buttonText ? {
            "@type": "ReadAction",
            "target": block.link,
            "name": block.buttonText
        } : undefined
    };
}

/**
 * Genera lo schema per il blocco ARTICLE
 */
function generateArticleSchema(block, magazine) {
    const baseUrl = 'https://www.checkin-magazine.it';
    
    return {
        "@context": "https://schema.org",
        "@type": "Article",
        "@id": `${baseUrl}/${magazine.slug}#article-${block._id}`,
        "headline": block.title,
        "alternativeHeadline": block.subtitle,
        "articleBody": stripHtmlTags(block.content),
        "image": block.image ? {
            "@type": "ImageObject",
            "url": block.image,
            "caption": block.title
        } : undefined,
        "author": {
            "@type": "Organization",
            "name": "CHECK-IN Magazine",
            "url": baseUrl
        },
        "publisher": {
            "@type": "Organization",
            "name": "CHECK-IN Magazine",
            "logo": {
                "@type": "ImageObject",
                "url": "https://www.italiaatavola.net/images/testate/checkin-testata-hd.svg"
            }
        },
        "datePublished": magazine.publishDate || magazine.createdAt,
        "dateModified": magazine.updatedAt,
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": `${baseUrl}/${magazine.slug}`
        },
        "url": block.link || `${baseUrl}/${magazine.slug}#article-${block._id}`,
        "isPartOf": {
            "@type": "PublicationIssue",
            "@id": `${baseUrl}/${magazine.slug}`
        },
        "inLanguage": "it-IT"
    };
}

/**
 * Genera lo schema per il blocco GALLERY
 */
function generateGallerySchema(block, magazine) {
    const baseUrl = 'https://www.checkin-magazine.it';
    const galleryImages = block.galleryImages || [];
    const stats = block.stats || [];
    
    return {
        "@context": "https://schema.org",
        "@type": "Article",
        "@id": `${baseUrl}/${magazine.slug}#gallery-${block._id}`,
        "headline": block.title,
        "alternativeHeadline": block.intro,
        "articleBody": stripHtmlTags(block.intro),
        "keywords": block.tag,
        "author": {
            "@type": "Organization",
            "name": "CHECK-IN Magazine"
        },
        "publisher": {
            "@type": "Organization",
            "name": "CHECK-IN Magazine",
            "logo": {
                "@type": "ImageObject",
                "url": "https://www.italiaatavola.net/images/testate/checkin-testata-hd.svg"
            }
        },
        "datePublished": magazine.publishDate || magazine.createdAt,
        "dateModified": magazine.updatedAt,
        "image": galleryImages.map(img => ({
            "@type": "ImageObject",
            "url": img.url,
            "caption": img.caption || "",
            "contentUrl": img.url
        })),
        "associatedMedia": galleryImages.map(img => ({
            "@type": "ImageObject",
            "contentUrl": img.url,
            "description": img.caption || "",
            "thumbnailUrl": img.url
        })),
        "about": {
            "@type": "Thing",
            "name": block.title,
            "description": block.intro
        },
        "mainEntity": {
            "@type": "ImageGallery",
            "name": block.title,
            "numberOfItems": galleryImages.length,
            "associatedMedia": galleryImages.map(img => ({
                "@type": "ImageObject",
                "url": img.url,
                "caption": img.caption || ""
            }))
        },
        "citation": block.quote?.text ? {
            "@type": "Quotation",
            "text": block.quote.text,
            "author": block.quote.author ? {
                "@type": "Person",
                "name": block.quote.author
            } : undefined
        } : undefined,
        "offers": block.ctaLink && block.ctaText ? {
            "@type": "Offer",
            "url": block.ctaLink,
            "name": block.ctaText,
            "availability": "https://schema.org/InStock"
        } : undefined,
        "isPartOf": {
            "@type": "PublicationIssue",
            "@id": `${baseUrl}/${magazine.slug}`
        }
    };
}

/**
 * Genera lo schema per il blocco TEXT
 */
function generateTextSchema(block, magazine) {
    const baseUrl = 'https://www.checkin-magazine.it';
    
    return {
        "@context": "https://schema.org",
        "@type": "CreativeWork",
        "@id": `${baseUrl}/${magazine.slug}#text-${block._id}`,
        "name": block.title,
        "text": stripHtmlTags(block.content),
        "author": {
            "@type": "Organization",
            "name": "CHECK-IN Magazine"
        },
        "publisher": {
            "@type": "Organization",
            "name": "CHECK-IN Magazine"
        },
        "datePublished": magazine.publishDate || magazine.createdAt,
        "inLanguage": "it-IT"
    };
}

/**
 * Genera lo schema per il blocco QUOTE
 */
function generateQuoteSchema(block, magazine) {
    const baseUrl = 'https://www.checkin-magazine.it';
    
    return {
        "@context": "https://schema.org",
        "@type": "Quotation",
        "@id": `${baseUrl}/${magazine.slug}#quote-${block._id}`,
        "text": block.content || block.title,
        "spokenByCharacter": block.subtitle ? {
            "@type": "Person",
            "name": block.subtitle
        } : undefined,
        "creator": block.subtitle ? {
            "@type": "Person",
            "name": block.subtitle
        } : undefined,
        "inLanguage": "it-IT"
    };
}

/**
 * Genera lo schema per il blocco VIDEO
 */
function generateVideoSchema(block, magazine) {
    const baseUrl = 'https://www.checkin-magazine.it';
    
    return {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        "@id": `${baseUrl}/${magazine.slug}#video-${block._id}`,
        "name": block.title,
        "description": stripHtmlTags(block.content),
        "embedUrl": block.link,
        "contentUrl": block.link,
        "uploadDate": magazine.publishDate || magazine.createdAt,
        "thumbnailUrl": block.image,
        "author": {
            "@type": "Organization",
            "name": "CHECK-IN Magazine"
        },
        "publisher": {
            "@type": "Organization",
            "name": "CHECK-IN Magazine",
            "logo": {
                "@type": "ImageObject",
                "url": "https://www.italiaatavola.net/images/testate/checkin-testata-hd.svg"
            }
        },
        "inLanguage": "it-IT"
    };
}

/**
 * Genera lo schema per il blocco FLUID (Parallasse)
 */
function generateFluidSchema(block, magazine) {
    const baseUrl = 'https://www.checkin-magazine.it';
    const fluidBlocks = block.fluidBlocks || [];
    
    // Combina tutti i testi dei blocchi
    const articleBody = [
        block.intro,
        ...fluidBlocks.map(fb => fb.text)
    ].filter(Boolean).join(' ');
    
    // Raccogli tutte le immagini
    const images = [
        block.previewImage,
        ...fluidBlocks.map(fb => fb.image).filter(Boolean)
    ].filter(Boolean);
    
    return {
        "@context": "https://schema.org",
        "@type": "Article",
        "@id": `${baseUrl}/${magazine.slug}#fluid-${block._id}`,
        "headline": block.title,
        "alternativeHeadline": block.intro,
        "keywords": block.tag,
        "articleBody": stripHtmlTags(articleBody),
        "author": {
            "@type": "Organization",
            "name": "CHECK-IN Magazine"
        },
        "publisher": {
            "@type": "Organization",
            "name": "CHECK-IN Magazine",
            "logo": {
                "@type": "ImageObject",
                "url": "https://www.italiaatavola.net/images/testate/checkin-testata-hd.svg"
            }
        },
        "datePublished": magazine.publishDate || magazine.createdAt,
        "image": images.map(img => ({
            "@type": "ImageObject",
            "url": img
        })),
        "hasPart": fluidBlocks.map(fb => ({
            "@type": "WebPageElement",
            "name": fb.heading,
            "text": stripHtmlTags(fb.text),
            "image": fb.image ? {
                "@type": "ImageObject",
                "url": fb.image
            } : undefined
        })),
        "isPartOf": {
            "@type": "PublicationIssue",
            "@id": `${baseUrl}/${magazine.slug}`
        }
    };
}

/**
 * Genera lo schema per il blocco CAROUSEL
 */
function generateCarouselSchema(block, magazine) {
    const baseUrl = 'https://www.checkin-magazine.it';
    const cards = block.cards || [];
    
    return {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "@id": `${baseUrl}/${magazine.slug}#carousel-${block._id}`,
        "name": block.title,
        "description": block.subtitle,
        "numberOfItems": cards.length,
        "itemListElement": cards.map((card, idx) => ({
            "@type": "ListItem",
            "position": idx + 1,
            "item": {
                "@type": "Article",
                "headline": card.title,
                "description": stripHtmlTags(card.description),
                "image": card.image ? {
                    "@type": "ImageObject",
                    "url": card.image
                } : undefined,
                "url": card.link,
                "articleSection": card.category,
                "author": {
                    "@type": "Organization",
                    "name": "CHECK-IN Magazine"
                },
                "publisher": {
                    "@type": "Organization",
                    "name": "CHECK-IN Magazine"
                },
                "datePublished": magazine.publishDate || magazine.createdAt
            }
        }))
    };
}

/**
 * Genera lo schema per il blocco CUSTOM
 */
function generateCustomSchema(block, magazine) {
    const baseUrl = 'https://www.checkin-magazine.it';
    
    return {
        "@context": "https://schema.org",
        "@type": "CreativeWork",
        "@id": `${baseUrl}/${magazine.slug}#custom-${block._id}`,
        "text": stripHtmlTags(block.content),
        "author": {
            "@type": "Organization",
            "name": "CHECK-IN Magazine"
        },
        "publisher": {
            "@type": "Organization",
            "name": "CHECK-IN Magazine"
        },
        "datePublished": magazine.publishDate || magazine.createdAt,
        "inLanguage": "it-IT"
    };
}

/**
 * Funzione principale che genera lo schema per qualsiasi tipo di blocco
 */
function generateBlockSchema(block, magazine) {
    if (!block.visible) {
        return null; // Non generare schema per blocchi nascosti
    }
    
    switch (block.type) {
        case 'cover':
            return generateCoverSchema(block, magazine);
        case 'hero':
            return generateHeroSchema(block, magazine);
        case 'article':
            return generateArticleSchema(block, magazine);
        case 'gallery':
            return generateGallerySchema(block, magazine);
        case 'text':
            return generateTextSchema(block, magazine);
        case 'quote':
            return generateQuoteSchema(block, magazine);
        case 'video':
            return generateVideoSchema(block, magazine);
        case 'fluid':
            return generateFluidSchema(block, magazine);
        case 'carousel':
            return generateCarouselSchema(block, magazine);
        case 'custom':
            return generateCustomSchema(block, magazine);
        default:
            return null;
    }
}

/**
 * Genera lo schema.org completo usando @graph per includere tutti i blocchi
 */
function generateCompleteSchema(magazine) {
    const baseUrl = 'https://www.checkin-magazine.it';
    const blocks = magazine.blocks || [];
    const visibleBlocks = blocks.filter(b => b.visible !== false);
    
    // Schema principale della rivista
    const magazineSchema = generateMagazineSchema(magazine);
    
    // Schema per Organization (solo una volta)
    const organizationSchema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "@id": baseUrl,
        "name": "CHECK-IN Magazine",
        "url": baseUrl,
        "logo": {
            "@type": "ImageObject",
            "url": "https://www.italiaatavola.net/images/testate/checkin-testata-hd.svg",
            "width": "200",
            "height": "50"
        },
        "sameAs": [
            // TODO: Aggiungere link social media
            "https://www.facebook.com/checkin",
            "https://www.instagram.com/checkin",
            "https://twitter.com/checkin"
        ]
    };
    
    // Schema per ogni blocco
    const blockSchemas = visibleBlocks
        .map(block => generateBlockSchema(block, magazine))
        .filter(Boolean); // Rimuove null/undefined
    
    // Unisci tutto in @graph
    return {
        "@context": "https://schema.org",
        "@graph": [
            organizationSchema,
            magazineSchema,
            ...blockSchemas
        ]
    };
}

/**
 * Helper: Rimuove tag HTML da una stringa
 */
function stripHtmlTags(html) {
    if (!html) return '';
    return html
        .replace(/<[^>]*>/g, '') // Rimuove tag HTML
        .replace(/&nbsp;/g, ' ') // Sostituisce &nbsp; con spazio
        .replace(/&amp;/g, '&')  // Decodifica &amp;
        .replace(/&lt;/g, '<')   // Decodifica &lt;
        .replace(/&gt;/g, '>')   // Decodifica &gt;
        .replace(/&quot;/g, '"') // Decodifica &quot;
        .replace(/&#39;/g, "'")  // Decodifica &#39;
        .trim();
}

/**
 * Genera il tag <script type="application/ld+json"> da inserire nell'HTML
 */
function generateSchemaTag(schema) {
    if (!schema) return '';
    
    // Rimuove proprietà undefined
    const cleanSchema = JSON.parse(JSON.stringify(schema));
    
    return `<script type="application/ld+json">
${JSON.stringify(cleanSchema, null, 2)}
</script>`;
}

// Export per Node.js
module.exports = {
    generateMagazineSchema,
    generateBlockSchema,
    generateCompleteSchema,
    generateSchemaTag,
    stripHtmlTags,
    
    // Export anche i generatori specifici per testing
    generateCoverSchema,
    generateHeroSchema,
    generateArticleSchema,
    generateGallerySchema,
    generateTextSchema,
    generateQuoteSchema,
    generateVideoSchema,
    generateFluidSchema,
    generateCarouselSchema,
    generateCustomSchema
};
