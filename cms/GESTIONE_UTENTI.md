# Sistema di Gestione Utenti - CHECK-IN CMS

## 🔐 Configurazione Iniziale

### 1. Primo Super-Admin

Per creare il primo super-admin, esegui questo comando (SOLO la prima volta):

```bash
curl -X POST http://localhost:3001/api/auth/setup-admin \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alessandro",
    "email": "admin@check-in.it",
    "password": "Admin123!",
    "name": "Alessandro Venturini"
  }'
```

### 2. Login

Dopo aver creato il super-admin, accedi al CMS:
- URL: `http://localhost:5500/cms/admin/login.html` (o il tuo URL)
- **Username**: `alessandro`
- **Password**: `Admin123!`

## 👥 Gestione Utenti

### Accesso alla Pagina Utenti

1. Solo gli utenti con ruolo **super-admin** vedono la voce "Utenti" nella sidebar
2. All'apertura della pagina, viene richiesta una **password speciale**
3. Password speciale: `alessandro.venturini!`
4. Dopo la verifica, puoi gestire tutti gli utenti

### Ruoli Disponibili

- **Super Admin**: Accesso completo + gestione utenti
- **Admin**: Può gestire riviste e contenuti
- **Editor**: Può modificare contenuti

### Creare Nuovo Utente

1. Clicca su "Nuovo Utente"
2. Compila i campi:
   - Nome Completo
   - Username (solo lettere minuscole)
   - Email
   - Password (minimo 6 caratteri)
   - Ruolo
   - Stato (attivo/disattivato)

### Modificare Utente

1. Clicca sull'icona ✏️ nella riga dell'utente
2. Modifica i campi necessari
3. La password è opzionale (lascia vuoto per mantenerla)

### Eliminare Utente

1. Clicca sull'icona 🗑️ nella riga dell'utente
2. Conferma l'eliminazione
3. **NON** puoi eliminare il tuo account

## 🔒 Sicurezza

- Le password sono hashate con bcrypt
- La password speciale per accesso utenti è hardcoded: `alessandro.venturini!`
- Solo i super-admin possono accedere alla gestione utenti
- Gli username sono sempre in lowercase
- Le email sono sempre in lowercase

## 📝 Modifiche al Sistema Login

Il sistema di login è stato modificato per usare **username + password** invece di email + password.

### Aggiornare Utenti Esistenti

Se hai utenti creati prima di questo aggiornamento, devi aggiungergli un username manualmente nel database:

```javascript
// Connettiti a MongoDB e esegui:
db.users.updateOne(
  { email: "admin@check-in.it" },
  { $set: { username: "alessandro", role: "super-admin" } }
)
```

## 🛠️ API Endpoints

### Autenticazione
- `POST /api/auth/login` - Login con username e password
- `POST /api/auth/verify` - Verifica token JWT

### Gestione Utenti (solo super-admin)
- `GET /api/users` - Lista tutti gli utenti
- `POST /api/users` - Crea nuovo utente
- `PUT /api/users/:id` - Aggiorna utente
- `DELETE /api/users/:id` - Elimina utente
- `POST /api/users/verify-access` - Verifica password speciale

## 🚀 Test del Sistema

1. Riavvia il backend: `node cms/backend/server.js`
2. Crea super-admin (comando sopra)
3. Fai login con username `alessandro`
4. Vai su "Utenti" nella sidebar
5. Inserisci password: `alessandro.venturini!`
6. Crea nuovi utenti!

---

**Note**: La password speciale è diversa dalla password di login del super-admin per maggiore sicurezza.
