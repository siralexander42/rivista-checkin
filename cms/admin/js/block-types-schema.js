/**
 * BLOCK TYPES SCHEMA
 * Schema completo di tutti i tipi di blocco disponibili
 * Modificabile in modalità sviluppatore
 */

const BLOCK_TYPES_SCHEMA = {
  // ============================================
  // COVER BLOCK - Copertina rivista
  // ============================================
  cover: {
    id: 'cover',
    name: 'Copertina',
    description: 'Copertina rivista con sommario dropdown e sfondi multipli animati',
    icon: '📸',
    category: 'hero',
    tags: ['Hero', 'Animato'],
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    
    // Schema dei campi del blocco
    fields: [
      {
        id: 'title',
        type: 'text',
        label: 'Titolo Principale',
        required: true,
        placeholder: 'Alta Badia',
        defaultValue: '',
        validation: {
          minLength: 3,
          maxLength: 100
        }
      },
      {
        id: 'subtitle',
        type: 'text',
        label: 'Sottotitolo',
        required: false,
        placeholder: 'Tre settimane di eventi per vivere l\'autunno sulle Dolomiti',
        defaultValue: ''
      },
      {
        id: 'content',
        type: 'textarea',
        label: 'Descrizione',
        required: false,
        rows: 4,
        placeholder: 'Testo descrittivo della copertina...',
        defaultValue: ''
      },
      {
        id: 'images',
        type: 'image-list',
        label: 'Immagini di sfondo',
        required: true,
        multiple: true,
        placeholder: 'https://esempio.com/bg1.jpg',
        help: 'Inserisci almeno 1 immagine. Le immagini si alterneranno automaticamente',
        validation: {
          minItems: 1,
          maxItems: 10
        }
      },
      {
        id: 'sommario',
        type: 'repeater',
        label: 'Sommario "In questo numero"',
        required: false,
        help: 'Gli elementi del sommario appariranno nel dropdown in alto',
        fields: [
          {
            id: 'text',
            type: 'text',
            label: 'Testo voce',
            required: true,
            placeholder: 'Alta Badia'
          },
          {
            id: 'link',
            type: 'text',
            label: 'Link (opzionale)',
            required: false,
            placeholder: '#sezione-1'
          }
        ]
      }
    ],
    
    // Template di default per nuovi blocchi
    defaultData: {
      title: 'Nuova Copertina',
      subtitle: '',
      content: '',
      images: [],
      sommario: []
    }
  },

  // ============================================
  // FLUID BLOCK - Parallasse stile Apple
  // ============================================
  fluid: {
    id: 'fluid',
    name: 'Fluid Block',
    description: 'Testo scrollabile con immagini che cambiano in parallelo. Stile Apple',
    icon: '👁️',
    category: 'content',
    tags: ['Parallasse', 'Premium'],
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    
    fields: [
      {
        id: 'title',
        type: 'text',
        label: 'Titolo',
        required: true,
        placeholder: 'Esperienze Uniche',
        defaultValue: ''
      },
      {
        id: 'subtitle',
        type: 'text',
        label: 'Sottotitolo',
        required: false,
        placeholder: 'Scopri le meraviglie',
        defaultValue: ''
      },
      {
        id: 'fluidBlocks',
        type: 'repeater',
        label: 'Sezioni Parallasse',
        required: true,
        help: 'Ogni sezione avrà un\'immagine di sfondo che cambia durante lo scroll',
        validation: {
          minItems: 1
        },
        fields: [
          {
            id: 'title',
            type: 'text',
            label: 'Titolo sezione',
            required: true,
            placeholder: 'Una nuova prospettiva'
          },
          {
            id: 'content',
            type: 'textarea',
            label: 'Contenuto',
            required: true,
            rows: 6,
            placeholder: 'Testo che verrà visualizzato durante lo scroll...'
          },
          {
            id: 'image',
            type: 'image',
            label: 'Immagine di sfondo',
            required: true,
            placeholder: 'https://esempio.com/image.jpg'
          }
        ]
      }
    ],
    
    defaultData: {
      title: 'Nuovo Fluid Block',
      subtitle: '',
      fluidBlocks: [
        {
          title: 'Sezione 1',
          content: '',
          image: ''
        }
      ]
    }
  },

  // ============================================
  // GALLERY STORY - Rich Media Block
  // ============================================
  gallery: {
    id: 'gallery',
    name: 'Gallery Story',
    description: 'Blocco completo con galleria, stats animate e citazioni premium',
    icon: '🖼️',
    category: 'media',
    tags: ['Rich Media', 'Stats'],
    gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    
    fields: [
      {
        id: 'title',
        type: 'text',
        label: 'Titolo',
        required: true,
        placeholder: 'Galleria Fotografica',
        defaultValue: ''
      },
      {
        id: 'subtitle',
        type: 'text',
        label: 'Sottotitolo',
        required: false,
        placeholder: 'Una collezione di momenti',
        defaultValue: ''
      },
      {
        id: 'content',
        type: 'textarea',
        label: 'Descrizione',
        required: false,
        rows: 4,
        placeholder: 'Testo introduttivo...',
        defaultValue: ''
      },
      {
        id: 'images',
        type: 'image-gallery',
        label: 'Immagini Galleria',
        required: true,
        help: 'Galleria principale con caption e link',
        fields: [
          {
            id: 'url',
            type: 'image',
            label: 'URL Immagine',
            required: true,
            placeholder: 'https://esempio.com/image.jpg'
          },
          {
            id: 'caption',
            type: 'text',
            label: 'Didascalia',
            required: false,
            placeholder: 'Descrizione immagine'
          },
          {
            id: 'link',
            type: 'text',
            label: 'Link (opzionale)',
            required: false,
            placeholder: 'https://...'
          }
        ]
      },
      {
        id: 'stats',
        type: 'repeater',
        label: 'Statistiche Animate',
        required: false,
        help: 'Numeri/statistiche che si animano all\'ingresso',
        fields: [
          {
            id: 'value',
            type: 'text',
            label: 'Valore',
            required: true,
            placeholder: '150+'
          },
          {
            id: 'label',
            type: 'text',
            label: 'Etichetta',
            required: true,
            placeholder: 'Destinazioni'
          }
        ]
      },
      {
        id: 'quote',
        type: 'group',
        label: 'Citazione (opzionale)',
        required: false,
        fields: [
          {
            id: 'text',
            type: 'textarea',
            label: 'Testo citazione',
            required: false,
            rows: 3,
            placeholder: '"Un viaggio di mille miglia inizia sempre con un passo"'
          },
          {
            id: 'author',
            type: 'text',
            label: 'Autore',
            required: false,
            placeholder: 'Lao Tzu'
          }
        ]
      }
    ],
    
    defaultData: {
      title: 'Nuova Gallery',
      subtitle: '',
      content: '',
      images: [],
      stats: [],
      quote: {
        text: '',
        author: ''
      }
    }
  },

  // ============================================
  // CAROUSEL STORIE - Swipe Cards
  // ============================================
  carousel: {
    id: 'carousel',
    name: 'Carousel Storie',
    description: 'Carousel orizzontale con card storie. Perfetto per presentare contenuti',
    icon: '🎴',
    category: 'content',
    tags: ['Swipe', 'Multi-card'],
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    
    fields: [
      {
        id: 'title',
        type: 'text',
        label: 'Titolo Sezione',
        required: true,
        placeholder: 'Le Nostre Storie',
        defaultValue: ''
      },
      {
        id: 'subtitle',
        type: 'text',
        label: 'Sottotitolo',
        required: false,
        placeholder: 'Racconti dal mondo',
        defaultValue: ''
      },
      {
        id: 'cards',
        type: 'repeater',
        label: 'Card del Carousel',
        required: true,
        help: 'Ogni card rappresenta una storia o contenuto',
        validation: {
          minItems: 1
        },
        fields: [
          {
            id: 'image',
            type: 'image',
            label: 'Immagine card',
            required: true,
            placeholder: 'https://esempio.com/card.jpg'
          },
          {
            id: 'title',
            type: 'text',
            label: 'Titolo',
            required: true,
            placeholder: 'Storia avvincente'
          },
          {
            id: 'subtitle',
            type: 'text',
            label: 'Sottotitolo',
            required: false,
            placeholder: 'Breve descrizione'
          },
          {
            id: 'content',
            type: 'textarea',
            label: 'Contenuto',
            required: false,
            rows: 4,
            placeholder: 'Testo della card...'
          },
          {
            id: 'link',
            type: 'text',
            label: 'Link (opzionale)',
            required: false,
            placeholder: 'https://...'
          },
          {
            id: 'buttonText',
            type: 'text',
            label: 'Testo bottone',
            required: false,
            placeholder: 'Leggi di più'
          }
        ]
      }
    ],
    
    defaultData: {
      title: 'Nuovo Carousel',
      subtitle: '',
      cards: [
        {
          image: '',
          title: 'Card 1',
          subtitle: '',
          content: '',
          link: '',
          buttonText: 'Scopri'
        }
      ]
    }
  },

  // ============================================
  // GEOGRAPHIC BLOCK - Mappa interattiva
  // ============================================
  geographic: {
    id: 'geographic',
    name: 'Geographic',
    description: 'Destinazione geografica con hero, stories e Google Maps con marker',
    icon: '🗺️',
    category: 'interactive',
    tags: ['Mappa', 'Destinazione', 'Google Maps'],
    gradient: 'linear-gradient(135deg, #ff3366 0%, #ff6b8a 100%)',
    
    fields: [
      {
        id: 'heroImages',
        type: 'image-list',
        label: 'Immagini Hero',
        required: true,
        multiple: true,
        help: 'Immagini rotanti in background (min 1, max 5)'
      },
      {
        id: 'preTitle',
        type: 'text',
        label: 'Pre-titolo',
        placeholder: 'Speciale'
      },
      {
        id: 'title',
        type: 'text',
        label: 'Titolo Destinazione',
        required: true,
        placeholder: 'LAGO DI GARDA'
      },
      {
        id: 'subtitle',
        type: 'text',
        label: 'Sottotitolo',
        placeholder: 'In continuo movimento tra tradizione e innovazione'
      },
      {
        id: 'stories',
        type: 'repeater',
        label: 'Stories',
        fields: [
          {
            id: 'image',
            type: 'image',
            label: 'Immagine',
            required: true
          },
          {
            id: 'title',
            type: 'text',
            label: 'Titolo',
            required: true
          },
          {
            id: 'description',
            type: 'textarea',
            label: 'Descrizione'
          },
          {
            id: 'tags',
            type: 'text',
            label: 'Tag (separati da virgola)',
            placeholder: '#Tag1, #Tag2'
          }
        ]
      },
      {
        id: 'mapTitle',
        type: 'text',
        label: 'Titolo Mappa',
        placeholder: 'ESPLORA LA DESTINAZIONE'
      },
      {
        id: 'mapSubtitle',
        type: 'text',
        label: 'Sottotitolo Mappa',
        placeholder: '📍 Clicca sui marker'
      },
      {
        id: 'mapEmbedUrl',
        type: 'textarea',
        label: 'URL Embed Google Maps',
        required: true,
        help: 'Google Maps > Share > Embed a map'
      },
      {
        id: 'places',
        type: 'repeater',
        label: 'Luoghi (Marker)',
        fields: [
          {
            id: 'name',
            type: 'text',
            label: 'Nome Luogo',
            required: true
          },
          {
            id: 'category',
            type: 'select',
            label: 'Categoria',
            options: [
              { value: 'restaurant', label: '🍽️ Ristorante' },
              { value: 'hotel', label: '🏨 Hotel' }
            ]
          },
          {
            id: 'googleMapsUrl',
            type: 'text',
            label: 'Link Google Maps del luogo *',
            required: true,
            placeholder: 'https://www.google.com/maps/place/Ristorante+.../@43.6990473,10.3869316,17z/',
            help: 'Coordinate estratte automaticamente da URL. Apri Google Maps > cerca luogo > Share > Copy link'
          },
          {
            id: 'positionLeft',
            type: 'text',
            label: 'Posizione Left (%) - opzionale',
            placeholder: '28',
            help: 'Usa solo se vuoi posizionare manualmente (sovrascrive coordinate da URL)'
          },
          {
            id: 'positionTop',
            type: 'text',
            label: 'Posizione Top (%) - opzionale',
            placeholder: '68',
            help: 'Usa solo se vuoi posizionare manualmente (sovrascrive coordinate da URL)'
          },
          {
            id: 'image',
            type: 'image',
            label: 'Immagine Popup'
          },
          {
            id: 'description',
            type: 'textarea',
            label: 'Descrizione'
          },
          {
            id: 'linkUrl',
            type: 'text',
            label: 'Link CTA',
            placeholder: '#articolo-ristorante'
          },
          {
            id: 'linkText',
            type: 'text',
            label: 'Testo Link',
            placeholder: 'Scopri di più →'
          }
        ]
      }
    ],
    
    defaultData: {
      heroImages: [],
      preTitle: 'Destinazione',
      title: 'Nuova Destinazione',
      subtitle: '',
      stories: [],
      mapTitle: 'ESPLORA LA DESTINAZIONE',
      mapSubtitle: '📍 Clicca sui marker per scoprire di più',
      mapEmbedUrl: '',
      places: []
    }
  }
};

// Esporta per uso globale
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BLOCK_TYPES_SCHEMA;
}
