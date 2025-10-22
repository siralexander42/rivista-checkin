# CHECK-IN CMS

Sistema di gestione contenuti per CHECK-IN Magazine.

## 📁 Struttura

```
cms/
├── backend/          # Server API Node.js + Express + MongoDB
│   ├── server.js     # Server principale
│   ├── package.json  # Dipendenze
│   └── .env          # Configurazione (NON committare!)
└── admin/            # Pannello amministrazione (TODO)
```

## 🚀 Setup Backend

### 1. Installa dipendenze

```bash
cd cms/backend
npm install
```

### 2. Configura .env

Il file `.env` è già configurato con le credenziali MongoDB.

**⚠️ IMPORTANTE:** In produzione cambia `JWT_SECRET`!

### 3. Avvia il server

```bash
# Modalità sviluppo (con auto-reload)
npm run dev

# Modalità produzione
npm start
```

Il server partirà su: `http://localhost:3001`

## 🔐 Setup Primo Admin

**PRIMA COSA DA FARE:** Crea il primo utente amministratore.

### Metodo 1: Con curl (da terminale)

```bash
curl -X POST http://localhost:3001/api/auth/setup-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@check-in.it",
    "password": "tuaPasswordSicura123",
    "name": "Alessandro Venturini"
  }'
```

### Metodo 2: Con Postman/Insomnia

- **URL:** `POST http://localhost:3001/api/auth/setup-admin`
- **Body (JSON):**
```json
{
  "email": "admin@check-in.it",
  "password": "tuaPasswordSicura123",
  "name": "Alessandro Venturini"
}
```

### Metodo 3: Dal browser (console)

Apri la console del browser e incolla:

```javascript
fetch('http://localhost:3001/api/auth/setup-admin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@check-in.it',
    password: 'tuaPasswordSicura123',
    name: 'Alessandro Venturini'
  })
})
.then(r => r.json())
.then(console.log);
```

**⚠️ Questo endpoint funziona SOLO la prima volta!** Dopo che hai creato l'admin, non sarà più possibile usarlo.

## 📡 API Endpoints

### 🌐 Pubbliche (per il sito)

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/articles` | Tutti gli articoli pubblicati |
| GET | `/api/articles/:id` | Singolo articolo |
| GET | `/api/articles/category/:category` | Articoli per categoria |
| GET | `/api/magazine/current` | Rivista corrente |
| GET | `/health` | Health check |

**Query params per `/api/articles`:**
- `category`: filtra per categoria (viaggi, enogastronomia, ospitalita, cultura, eventi)
- `featured`: filtra articoli in evidenza (true/false)
- `limit`: limita risultati (default: 100)

### 🔐 Admin (richiedono autenticazione)

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/verify` | Verifica token |
| GET | `/api/admin/articles` | Tutti gli articoli (anche draft) |
| GET | `/api/admin/articles/:id` | Singolo articolo |
| POST | `/api/admin/articles` | Crea articolo |
| PUT | `/api/admin/articles/:id` | Modifica articolo |
| DELETE | `/api/admin/articles/:id` | Cancella articolo |
| PUT | `/api/admin/articles/reorder` | Riordina articoli |
| GET | `/api/admin/stats` | Statistiche dashboard |
| GET | `/api/admin/magazines` | Tutte le edizioni |
| POST | `/api/admin/magazines` | Crea edizione |
| PUT | `/api/admin/magazines/:id` | Modifica edizione |

### 🔑 Autenticazione

Tutte le rotte admin richiedono un token JWT nell'header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Esempio di login:**

```javascript
const response = await fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@check-in.it',
    password: 'tuaPassword'
  })
});

const { token, user } = await response.json();
// Salva il token per le richieste successive
```

**Esempio di richiesta autenticata:**

```javascript
const response = await fetch('http://localhost:3001/api/admin/articles', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## 📊 Schema Dati

### Articolo

```javascript
{
  title: String,              // Titolo articolo
  description: String,        // Descrizione breve
  image: String,              // URL immagine
  externalLink: String,       // Link a Italia a Tavola
  category: String,           // viaggi | enogastronomia | ospitalita | cultura | eventi
  featured: Boolean,          // In evidenza?
  position: Number,           // Ordine di visualizzazione
  publishDate: Date,          // Data pubblicazione
  status: String,             // draft | published | archived
  views: Number               // Numero visualizzazioni
}
```

### Rivista

```javascript
{
  editionNumber: Number,      // Numero edizione
  title: String,              // Titolo (default: "CHECK-IN Magazine")
  subtitle: String,           // Sottotitolo
  coverImage: String,         // Immagine copertina
  publishDate: Date,          // Data pubblicazione
  published: Boolean,         // Pubblicata?
  featured: Boolean           // Edizione corrente?
}
```

## 🌐 Deploy

### Backend su Railway/Render

1. Push su GitHub
2. Connetti Railway/Render al repo
3. Imposta variabili d'ambiente:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `PORT` (automatico su Railway/Render)
   - `FRONTEND_URL`
   - `ADMIN_URL`

## 🔧 Sviluppo

```bash
# Avvia in modalità dev con auto-reload
npm run dev

# Testa health check
curl http://localhost:3001/health

# Testa API pubblica
curl http://localhost:3001/api/articles
```

## 📝 TODO

- [ ] Pannello admin (HTML/CSS/JS)
- [ ] Upload immagini
- [ ] Sistema di ricerca articoli
- [ ] Export dati
- [ ] Backup automatico
- [ ] Rate limiting
- [ ] Logger avanzato

## 🐛 Troubleshooting

### Errore connessione MongoDB

Controlla che:
- La stringa di connessione in `.env` sia corretta
- L'IP sia nella whitelist di MongoDB Atlas
- Internet sia connesso

### Errore "Admin già esistente"

L'endpoint `/api/auth/setup-admin` funziona solo la prima volta. Usa `/api/auth/login` per accedere.

### CORS Error

Assicurati che `FRONTEND_URL` e `ADMIN_URL` in `.env` corrispondano agli URL usati dal frontend.
