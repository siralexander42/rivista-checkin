# Blocks Templates

Questa cartella contiene i template dei blocchi disponibili nel CMS CHECK-IN.

## Struttura

Ogni blocco ha la sua cartella con i seguenti file:

```
blocks-templates/
├── index.json              # Indice di tutti i blocchi
├── hero/
│   ├── config.json        # Configurazione blocco
│   ├── template.html      # Template HTML
│   ├── styles.css         # Stili CSS
│   └── script.js          # JavaScript
├── text/
│   ├── config.json
│   ├── template.html
│   ├── styles.css
│   └── script.js
└── ...
```

## File Config.json

Ogni `config.json` contiene:

```json
{
  "type": "hero",              // ID univoco del blocco
  "name": "Hero",              // Nome visualizzato
  "description": "...",        // Descrizione
  "icon": "🦸",               // Emoji icona
  "version": "1.0.0",         // Versione
  "fields": [                 // Campi del blocco
    {
      "name": "title",
      "label": "Titolo",
      "type": "text",
      "required": true
    }
  ]
}
```

## Template HTML

I template HTML usano la sintassi `{{variabile}}` per le variabili:

```html
<div class="hero-block">
    <h1>{{title}}</h1>
    <p>{{subtitle}}</p>
</div>
```

## Gestione

- **Visualizza blocchi**: Vai in "Modalità Sviluppatore" > sezione "Blocchi Attuali"
- **Rinomina blocco**: Click su "Rinomina" nella card del blocco
- **Visualizza file**: Click su "File" per vedere la struttura

## Future Features

- Editor HTML/CSS/JS integrato
- Anteprima live dei blocchi
- Creazione nuovi blocchi da UI
- Import/Export blocchi
- Versioning automatico

## Note

- I blocchi sono condivisi tra tutte le riviste
- Le modifiche ai template si applicano a tutte le riviste che usano quel blocco
- Fai sempre un backup prima di modificare un template esistente
