# 📰 Blocco Copertina - Guida Rapida

## Cos'è il Blocco Copertina?

Il **Blocco Copertina** è un nuovo tipo di blocco che replica esattamente la copertina stilosa che hai in `index.html`, con:
- ✨ **Sfondi multipli** che si alternano automaticamente
- 📋 **Sommario dropdown** con menu "In questo numero"
- 🎨 **Design elegante** con glassmorphism e animazioni
- 📱 **Responsive** su tutti i dispositivi

## Come Usarlo

### 1. Crea una Nuova Rivista
1. Vai su `/cms/admin/magazines.html`
2. Clicca su "➕ Nuova Rivista"
3. Compila i campi (Nome, Slug, Edizione, SEO, ecc.)
4. Salva

### 2. Aggiungi il Blocco Copertina
1. Clicca su "📦 Gestisci Blocchi" per la tua rivista
2. Clicca su "➕ Aggiungi Blocco"
3. Seleziona **📰 Copertina** (è in evidenza con sfondo blu)

### 3. Compila il Form della Copertina

#### **Titolo Principale** (obbligatorio)
Es: `Alta Badia`
Questo sarà il grande titolo centrale della copertina.

#### **Sottotitolo**
Es: `Tre settimane di eventi per vivere l'autunno sulle Dolomiti`
Appare sotto il titolo principale.

#### **Descrizione**
Testo descrittivo che appare sotto il sottotitolo.

#### **Immagini di sfondo** (obbligatorio)
Inserisci gli URL delle immagini, **uno per riga**:
```
https://esempio.com/immagine1.jpg
https://esempio.com/immagine2.jpg
https://esempio.com/immagine3.jpg
https://esempio.com/immagine4.jpg
```

Le immagini si alterneranno automaticamente con effetto zoom e fade.

#### **Sommario "In questo numero"**
Clicca su "➕ Aggiungi voce sommario" per ogni articolo:
- **Testo voce**: `Cremona: Città che suona e cucina`
- **Link**: `#cremona` (o URL esterno)

Puoi aggiungere quante voci vuoi!

### 4. Salva e Pubblica
1. Clicca su "💾 Salva Blocco"
2. Clicca su "👁️ Preview" per vedere l'anteprima
3. Quando sei soddisfatto, clicca su "🚀 Pubblica Rivista"

## Risultato

La rivista sarà pubblicata come `{slug}.html` con:
- Copertina a tutto schermo con sfondi animati
- Freccia in alto per aprire il sommario
- Dropdown che scende dall'alto con tutte le voci
- Design identico a quello di `index.html`

## Esempio Completo

**Rivista**: Carnevale di Venezia 2025
**Slug**: `carnevale-venezia`

**Blocco Copertina**:
- Titolo: `Carnevale di Venezia`
- Sottotitolo: `La magia delle maschere torna in laguna`
- Immagini: 4 foto del carnevale
- Sommario:
  - `Storia del Carnevale` → `#storia`
  - `Le maschere tradizionali` → `#maschere`
  - `Eventi 2025` → `#eventi`
  - `Dove alloggiare` → `#hotel`

Pubblicando, crei → `carnevale-venezia.html` con copertina funzionante!

## Note Tecniche

- Il blocco usa gli stili in `assets/css/magazine-generated.css`
- Il JavaScript per il toggle del sommario è incluso automaticamente
- Gli sfondi hanno animazione zoom di 20 secondi
- Il sommario si apre/chiude con transizione smooth di 0.6s
- Tutto è responsive e ottimizzato per mobile

## Prossimi Passi

Dopo il blocco Copertina, puoi aggiungere:
- 📝 **Blocco Articolo**: contenuto con immagini
- 🖼️ **Blocco Gallery**: griglia di foto
- 💬 **Blocco Citazione**: quote in evidenza
- 🎥 **Blocco Video**: embed YouTube/Vimeo

---

**Fatto!** 🎉 Ora hai una copertina professionale come quella di CHECK-IN!
