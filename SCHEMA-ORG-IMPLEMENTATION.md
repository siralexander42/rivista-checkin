# 📊 Schema.org Implementation Guide - CHECK-IN Magazine

## 🎯 Obiettivo
Implementare Schema.org structured data per ogni tipo di blocco della rivista CHECK-IN per migliorare il SEO e la visibilità sui motori di ricerca.

---

## 📚 Struttura Generale della Rivista

### Schema.org Type: `PublicationIssue` + `Periodical`

La rivista nel suo complesso deve essere marcata come **PublicationIssue** (numero di una pubblicazione periodica).

```json
{
  "@context": "https://schema.org",
  "@type": "PublicationIssue",
  "@id": "https://www.checkin-magazine.it/{{ magazine.slug }}",
  "issueNumber": "{{ magazine.edition }}",
  "name": "{{ magazine.name }}",
  "description": "{{ magazine.description }}",
  "datePublished": "{{ magazine.publishDate }}",
  "inLanguage": "it-IT",
  "isPartOf": {
    "@type": "Periodical",
    "@id": "https://www.checkin-magazine.it",
    "name": "CHECK-IN",
    "description": "La rivista del viaggio",
    "issn": "XXXX-XXXX",
    "publisher": {
      "@type": "Organization",
      "name": "CHECK-IN Magazine",
      "url": "https://www.checkin-magazine.it",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.italiaatavola.net/images/testate/checkin-testata-hd.svg"
      }
    }
  },
  "publisher": {
    "@type": "Organization",
    "name": "CHECK-IN Magazine",
    "url": "https://www.checkin-magazine.it"
  },
  "url": "https://www.checkin-magazine.it/{{ magazine.slug }}",
  "mainEntity": {
    "@type": "ItemList",
    "itemListElement": [
      // Qui vanno i vari blocchi come items
    ]
  }
}
```

---

## 🧱 Schema.org per Ogni Tipo di Blocco

### 1. **COVER BLOCK** (Copertina)

**Schema Type:** `WebPage` + `CreativeWork`

```json
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "{{ block.title }}",
  "headline": "{{ block.title }}",
  "description": "{{ block.subtitle }}",
  "image": {
    "@type": "ImageObject",
    "url": "{{ block.images[0] }}",
    "caption": "Copertina {{ magazine.name }}"
  },
  "primaryImageOfPage": {
    "@type": "ImageObject",
    "url": "{{ block.images[0] }}"
  },
  "breadcrumb": {
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://www.checkin-magazine.it"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "{{ magazine.name }}",
        "item": "https://www.checkin-magazine.it/{{ magazine.slug }}"
      }
    ]
  },
  "about": {
    "@type": "ItemList",
    "name": "Sommario",
    "numberOfItems": {{ block.settings.sommario.length }},
    "itemListElement": [
      {% for item in block.settings.sommario %}
      {
        "@type": "ListItem",
        "position": {{ loop.index }},
        "name": "{{ item.text }}",
        "url": "{{ item.link }}"
      }
      {% endfor %}
    ]
  }
}
```

**Dove inserirlo:**
```html
<section class="hero-simple" id="hero" itemscope itemtype="https://schema.org/WebPage">
  <script type="application/ld+json">
    // JSON sopra
  </script>
  <!-- resto del markup -->
</section>
```

---

### 2. **HERO BLOCK** (Hero Section)

**Schema Type:** `WebPageElement` + `Article`

```json
{
  "@context": "https://schema.org",
  "@type": "WebPageElement",
  "name": "{{ block.title }}",
  "headline": "{{ block.title }}",
  "alternativeHeadline": "{{ block.subtitle }}",
  "description": "{{ block.content }}",
  "image": {
    "@type": "ImageObject",
    "url": "{{ block.image }}",
    "caption": "{{ block.title }}"
  },
  "url": "{{ block.link }}",
  "potentialAction": {
    "@type": "ReadAction",
    "target": "{{ block.link }}",
    "name": "{{ block.buttonText }}"
  }
}
```

**Dove inserirlo:**
```html
<section class="hero-block" itemscope itemtype="https://schema.org/WebPageElement">
  <script type="application/ld+json">
    // JSON sopra
  </script>
  <meta itemprop="name" content="{{ block.title }}">
  <meta itemprop="headline" content="{{ block.title }}">
  <!-- resto del markup -->
</section>
```

---

### 3. **ARTICLE BLOCK** (Articolo)

**Schema Type:** `Article` o `NewsArticle` (se è una notizia)

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "@id": "https://www.checkin-magazine.it/{{ magazine.slug }}#article-{{ block._id }}",
  "headline": "{{ block.title }}",
  "alternativeHeadline": "{{ block.subtitle }}",
  "articleBody": "{{ block.content | striptags }}",
  "image": {
    "@type": "ImageObject",
    "url": "{{ block.image }}",
    "caption": "{{ block.title }}"
  },
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
  "datePublished": "{{ magazine.publishDate }}",
  "dateModified": "{{ magazine.updatedAt }}",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://www.checkin-magazine.it/{{ magazine.slug }}"
  },
  "url": "{{ block.link }}",
  "isPartOf": {
    "@type": "PublicationIssue",
    "@id": "https://www.checkin-magazine.it/{{ magazine.slug }}"
  }
}
```

**Dove inserirlo:**
```html
<article class="article-block" itemscope itemtype="https://schema.org/Article">
  <script type="application/ld+json">
    // JSON sopra
  </script>
  <h2 itemprop="headline">{{ block.title }}</h2>
  <p itemprop="alternativeHeadline">{{ block.subtitle }}</p>
  <div itemprop="articleBody">{{ block.content }}</div>
  <img itemprop="image" src="{{ block.image }}" alt="{{ block.title }}">
</article>
```

---

### 4. **GALLERY BLOCK** (Gallery Story)

**Schema Type:** `ImageGallery` + `Article`

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "@id": "https://www.checkin-magazine.it/{{ magazine.slug }}#gallery-{{ block._id }}",
  "headline": "{{ block.title }}",
  "alternativeHeadline": "{{ block.intro }}",
  "articleBody": "{{ block.intro }}",
  "keywords": "{{ block.tag }}",
  "author": {
    "@type": "Organization",
    "name": "CHECK-IN Magazine"
  },
  "publisher": {
    "@type": "Organization",
    "name": "CHECK-IN Magazine"
  },
  "datePublished": "{{ magazine.publishDate }}",
  "image": [
    {% for img in block.galleryImages %}
    {
      "@type": "ImageObject",
      "url": "{{ img.url }}",
      "caption": "{{ img.caption }}",
      "contentUrl": "{{ img.url }}"
    }{{ "," if not loop.last }}
    {% endfor %}
  ],
  "associatedMedia": [
    {% for img in block.galleryImages %}
    {
      "@type": "ImageObject",
      "contentUrl": "{{ img.url }}",
      "description": "{{ img.caption }}",
      "thumbnailUrl": "{{ img.url }}"
    }{{ "," if not loop.last }}
    {% endfor %}
  ],
  "about": {
    "@type": "Thing",
    "name": "{{ block.title }}",
    "description": "{{ block.intro }}"
  },
  "mainEntity": {
    "@type": "ImageGallery",
    "name": "{{ block.title }}",
    "numberOfItems": {{ block.galleryImages.length }},
    "associatedMedia": [
      {% for img in block.galleryImages %}
      {
        "@type": "ImageObject",
        "url": "{{ img.url }}",
        "caption": "{{ img.caption }}"
      }{{ "," if not loop.last }}
      {% endfor %}
    ]
  },
  {% if block.quote.text %}
  "citation": {
    "@type": "Quotation",
    "text": "{{ block.quote.text }}",
    "author": {
      "@type": "Person",
      "name": "{{ block.quote.author }}"
    }
  },
  {% endif %}
  "offers": {
    "@type": "Offer",
    "url": "{{ block.ctaLink }}",
    "name": "{{ block.ctaText }}",
    "availability": "https://schema.org/InStock"
  }
}
```

**Dove inserirlo:**
```html
<section class="story-section" itemscope itemtype="https://schema.org/Article">
  <script type="application/ld+json">
    // JSON sopra
  </script>
  <h2 itemprop="headline">{{ block.title }}</h2>
  <p itemprop="articleBody">{{ block.intro }}</p>
  <div itemprop="image" itemscope itemtype="https://schema.org/ImageObject">
    <img itemprop="url" src="{{ img.url }}" alt="{{ img.caption }}">
    <meta itemprop="caption" content="{{ img.caption }}">
  </div>
</section>
```

---

### 5. **TEXT BLOCK** (Blocco Testo)

**Schema Type:** `CreativeWork`

```json
{
  "@context": "https://schema.org",
  "@type": "CreativeWork",
  "name": "{{ block.title }}",
  "text": "{{ block.content | striptags }}",
  "author": {
    "@type": "Organization",
    "name": "CHECK-IN Magazine"
  },
  "publisher": {
    "@type": "Organization",
    "name": "CHECK-IN Magazine"
  },
  "datePublished": "{{ magazine.publishDate }}",
  "inLanguage": "it-IT"
}
```

**Dove inserirlo:**
```html
<section class="text-block" itemscope itemtype="https://schema.org/CreativeWork">
  <script type="application/ld+json">
    // JSON sopra
  </script>
  <h2 itemprop="name">{{ block.title }}</h2>
  <div itemprop="text">{{ block.content }}</div>
</section>
```

---

### 6. **QUOTE BLOCK** (Citazione)

**Schema Type:** `Quotation`

```json
{
  "@context": "https://schema.org",
  "@type": "Quotation",
  "text": "{{ block.content | block.title }}",
  "spokenByCharacter": {
    "@type": "Person",
    "name": "{{ block.subtitle }}"
  },
  "creator": {
    "@type": "Person",
    "name": "{{ block.subtitle }}"
  },
  "inLanguage": "it-IT"
}
```

**Dove inserirlo:**
```html
<section class="quote-block" itemscope itemtype="https://schema.org/Quotation">
  <script type="application/ld+json">
    // JSON sopra
  </script>
  <blockquote itemprop="text">{{ block.content }}</blockquote>
  <cite itemprop="spokenByCharacter" itemscope itemtype="https://schema.org/Person">
    <span itemprop="name">{{ block.subtitle }}</span>
  </cite>
</section>
```

---

### 7. **VIDEO BLOCK** (Video)

**Schema Type:** `VideoObject`

```json
{
  "@context": "https://schema.org",
  "@type": "VideoObject",
  "name": "{{ block.title }}",
  "description": "{{ block.content }}",
  "embedUrl": "{{ block.link }}",
  "contentUrl": "{{ block.link }}",
  "uploadDate": "{{ magazine.publishDate }}",
  "thumbnailUrl": "{{ block.image }}",
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
}
```

**Dove inserirlo:**
```html
<section class="video-block" itemscope itemtype="https://schema.org/VideoObject">
  <script type="application/ld+json">
    // JSON sopra
  </script>
  <h2 itemprop="name">{{ block.title }}</h2>
  <div class="video-container">
    <iframe itemprop="embedUrl" src="{{ block.link }}"></iframe>
  </div>
  <meta itemprop="description" content="{{ block.content }}">
</section>
```

---

### 8. **FLUID/PARALLAX BLOCK** (Scroll Parallax)

**Schema Type:** `Article` con sezioni multiple

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "@id": "https://www.checkin-magazine.it/{{ magazine.slug }}#fluid-{{ block._id }}",
  "headline": "{{ block.title }}",
  "alternativeHeadline": "{{ block.intro }}",
  "keywords": "{{ block.tag }}",
  "articleBody": "{{ block.intro }} {% for fb in block.fluidBlocks %}{{ fb.text }} {% endfor %}",
  "author": {
    "@type": "Organization",
    "name": "CHECK-IN Magazine"
  },
  "publisher": {
    "@type": "Organization",
    "name": "CHECK-IN Magazine"
  },
  "datePublished": "{{ magazine.publishDate }}",
  "image": [
    {% if block.previewImage %}
    {
      "@type": "ImageObject",
      "url": "{{ block.previewImage }}"
    },
    {% endif %}
    {% for fb in block.fluidBlocks %}
    {% if fb.image %}
    {
      "@type": "ImageObject",
      "url": "{{ fb.image }}",
      "caption": "{{ fb.heading }}"
    }{{ "," if not loop.last }}
    {% endif %}
    {% endfor %}
  ],
  "hasPart": [
    {% for fb in block.fluidBlocks %}
    {
      "@type": "WebPageElement",
      "name": "{{ fb.heading }}",
      "text": "{{ fb.text }}",
      "image": {
        "@type": "ImageObject",
        "url": "{{ fb.image }}"
      }
    }{{ "," if not loop.last }}
    {% endfor %}
  ]
}
```

**Dove inserirlo:**
```html
<section class="cremona-scroll-section" itemscope itemtype="https://schema.org/Article">
  <script type="application/ld+json">
    // JSON sopra
  </script>
  <h2 itemprop="headline">{{ block.title }}</h2>
  <p itemprop="alternativeHeadline">{{ block.intro }}</p>
</section>
```

---

### 9. **CAROUSEL BLOCK** (Carousel Stories)

**Schema Type:** `ItemList` + `Article` per ogni card

```json
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "{{ block.title }}",
  "description": "{{ block.subtitle }}",
  "numberOfItems": {{ block.cards.length }},
  "itemListElement": [
    {% for card in block.cards %}
    {
      "@type": "ListItem",
      "position": {{ loop.index }},
      "item": {
        "@type": "Article",
        "headline": "{{ card.title }}",
        "description": "{{ card.description }}",
        "image": {
          "@type": "ImageObject",
          "url": "{{ card.image }}"
        },
        "url": "{{ card.link }}",
        "articleSection": "{{ card.category }}",
        "author": {
          "@type": "Organization",
          "name": "CHECK-IN Magazine"
        },
        "publisher": {
          "@type": "Organization",
          "name": "CHECK-IN Magazine"
        },
        "datePublished": "{{ magazine.publishDate }}"
      }
    }{{ "," if not loop.last }}
    {% endfor %}
  ]
}
```

**Dove inserirlo:**
```html
<section class="carousel-stories-section" itemscope itemtype="https://schema.org/ItemList">
  <script type="application/ld+json">
    // JSON sopra
  </script>
  <h2 itemprop="name">{{ block.title }}</h2>
  <p itemprop="description">{{ block.subtitle }}</p>
  <meta itemprop="numberOfItems" content="{{ block.cards.length }}">
</section>
```

---

### 10. **CUSTOM BLOCK** (Blocco Personalizzato)

**Schema Type:** `CreativeWork` generico

```json
{
  "@context": "https://schema.org",
  "@type": "CreativeWork",
  "text": "{{ block.content | striptags }}",
  "author": {
    "@type": "Organization",
    "name": "CHECK-IN Magazine"
  },
  "publisher": {
    "@type": "Organization",
    "name": "CHECK-IN Magazine"
  },
  "datePublished": "{{ magazine.publishDate }}",
  "inLanguage": "it-IT"
}
```

---

## 🚀 Come Implementare

### Opzione 1: JSON-LD nel `<head>` (Consigliato)

Aggiungi un singolo script JSON-LD nel `<head>` della pagina con tutti i dati strutturati:

```html
<head>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@graph": [
      // Schema della rivista (PublicationIssue)
      {
        "@type": "PublicationIssue",
        // ...
      },
      // Schema per ogni blocco
      {
        "@type": "Article",
        // ...
      }
      // ... altri blocchi
    ]
  }
  </script>
</head>
```

### Opzione 2: JSON-LD per Blocco

Inserisci un `<script type="application/ld+json">` all'inizio di ogni `<section>` blocco.

### Opzione 3: Microdata Inline

Usa gli attributi `itemscope`, `itemtype`, `itemprop` direttamente nel markup HTML.

---

## 📈 Benefici SEO

### 1. **Rich Snippets**
- ⭐ Stelle di rating negli articoli
- 📅 Date di pubblicazione visibili
- 👤 Autore e organizzazione visibili
- 🖼️ Immagini in anteprima nei risultati

### 2. **Google Discover**
- Maggiore possibilità di apparire in Google Discover
- Migliore comprensione del contenuto da parte di Google

### 3. **Knowledge Graph**
- Possibilità di apparire nel Knowledge Panel
- Collegamento con entità riconosciute

### 4. **Accessibilità**
- Migliore comprensione per screen reader
- Struttura semantica chiara

### 5. **Social Media**
- Open Graph automatico
- Twitter Cards ottimizzate
- LinkedIn preview migliorate

---

## 🔧 Strumenti di Validazione

### Google Rich Results Test
```
https://search.google.com/test/rich-results
```

### Schema.org Validator
```
https://validator.schema.org/
```

### Google Search Console
Controlla gli errori di structured data nella sezione "Miglioramenti"

---

## 📝 Note Importanti

1. **Sempre usare URL assoluti** per `@id`, `url`, `image.url`
2. **Date in formato ISO 8601**: `2024-10-28T12:00:00+02:00`
3. **Immagini ad alta risoluzione**: minimo 1200x675px per rich snippets
4. **Testo pulito**: usare `striptags` per rimuovere HTML da `articleBody`
5. **Consistenza**: stessi dati sia in JSON-LD che in microdata
6. **ISSN**: richiedere un ISSN ufficiale per la rivista
7. **Logo**: URL assoluto e dimensione minima 112x112px

---

## 🎨 Esempio Completo per Cover Block

```html
<section class="hero-simple" id="hero" itemscope itemtype="https://schema.org/WebPage">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": "https://www.checkin-magazine.it/edizione-42-ottobre",
    "name": "CHECK-IN Edizione 42 - Ottobre 2024",
    "headline": "La rivista del viaggio",
    "description": "Esplora le destinazioni più affascinanti d'Italia",
    "url": "https://www.checkin-magazine.it/edizione-42-ottobre",
    "inLanguage": "it-IT",
    "isPartOf": {
      "@type": "PublicationIssue",
      "issueNumber": "42",
      "datePublished": "2024-10-01",
      "publisher": {
        "@type": "Organization",
        "name": "CHECK-IN Magazine",
        "url": "https://www.checkin-magazine.it",
        "logo": {
          "@type": "ImageObject",
          "url": "https://www.italiaatavola.net/images/testate/checkin-testata-hd.svg",
          "width": "200",
          "height": "50"
        }
      }
    },
    "primaryImageOfPage": {
      "@type": "ImageObject",
      "url": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600",
      "width": "1600",
      "height": "900"
    },
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://www.checkin-magazine.it"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Edizione 42 - Ottobre",
          "item": "https://www.checkin-magazine.it/edizione-42-ottobre"
        }
      ]
    }
  }
  </script>
  
  <meta itemprop="name" content="CHECK-IN Edizione 42">
  <meta itemprop="description" content="La rivista del viaggio">
  
  <!-- Resto del markup visuale -->
  <div class="hero-container">
    <h1 itemprop="headline">CHECK-IN Edizione 42</h1>
    <p class="hero-subtitle">La rivista del viaggio</p>
  </div>
</section>
```

---

## 🔄 Prossimi Passi

1. ✅ Implementare funzione helper nel backend per generare JSON-LD
2. ✅ Aggiungere JSON-LD nella funzione `generateBlockHTML()`
3. ✅ Testare con Google Rich Results Test
4. ✅ Monitorare in Google Search Console
5. ✅ Richiedere ISSN ufficiale
6. ✅ Ottimizzare immagini per Open Graph
7. ✅ Implementare sitemap.xml con riferimenti schema.org

---

**Creato il:** 28 ottobre 2024  
**Versione:** 1.0  
**Progetto:** CHECK-IN Magazine CMS
