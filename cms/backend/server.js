const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// MIDDLEWARE
// ============================================

app.use(cors({
    origin: '*', // Permetti tutte le origini per ora
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// ============================================
// MONGODB CONNECTION
// ============================================

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB connesso con successo'))
    .catch(err => {
        console.error('❌ Errore connessione MongoDB:', err);
        process.exit(1);
    });

// ============================================
// SCHEMAS & MODELS
// ============================================

// Schema Articolo
const articleSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: [true, 'Il titolo è obbligatorio'],
        trim: true
    },
    description: { 
        type: String, 
        required: [true, 'La descrizione è obbligatoria'],
        trim: true
    },
    image: { 
        type: String, 
        required: [true, "L'immagine è obbligatoria"]
    },
    externalLink: { 
        type: String, 
        required: [true, 'Il link esterno è obbligatorio']
    },
    category: { 
        type: String, 
        enum: ['viaggi', 'enogastronomia', 'ospitalita', 'cultura', 'eventi'],
        required: [true, 'La categoria è obbligatoria']
    },
    featured: { 
        type: Boolean, 
        default: false 
    },
    position: {
        type: Number,
        default: 0
    },
    publishDate: { 
        type: Date, 
        default: Date.now 
    },
    status: { 
        type: String, 
        enum: ['draft', 'published', 'archived'],
        default: 'draft'
    },
    views: {
        type: Number,
        default: 0
    }
}, { 
    timestamps: true 
});

const Article = mongoose.model('Article', articleSchema);

// Schema User (Admin)
const userSchema = new mongoose.Schema({
    email: { 
        type: String, 
        required: true, 
        unique: true,
        lowercase: true,
        trim: true
    },
    password: { 
        type: String, 
        required: true 
    },
    name: { 
        type: String, 
        required: true 
    },
    role: {
        type: String,
        enum: ['admin', 'editor'],
        default: 'editor'
    },
    lastLogin: {
        type: Date
    }
}, { 
    timestamps: true 
});

const User = mongoose.model('User', userSchema);

// ============================================
// SCHEMA RIVISTE E BLOCCHI
// ============================================

// Schema per i Blocchi di contenuto della rivista
const blockSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['hero', 'article', 'gallery', 'text', 'quote', 'video', 'custom'],
        required: true
    },
    title: String,
    subtitle: String,
    content: String,
    image: String,
    images: [String], // Per gallery
    link: String,
    buttonText: String,
    position: {
        type: Number,
        default: 0
    },
    style: {
        backgroundColor: String,
        textColor: String,
        layout: String, // 'full', 'left', 'right', 'center'
        height: String
    },
    settings: mongoose.Schema.Types.Mixed, // Impostazioni custom per ogni tipo
    visible: {
        type: Boolean,
        default: true
    }
}, { _id: true });

// Schema Rivista Completo
const magazineSchema = new mongoose.Schema({
    // Metadata
    name: {
        type: String,
        required: [true, 'Il nome della rivista è obbligatorio'],
        trim: true
    },
    slug: {
        type: String,
        required: [true, 'Lo slug URL è obbligatorio'],
        unique: true,
        lowercase: true,
        trim: true
    },
    edition: {
        type: String, // es: "Gennaio 2025", "Estate 2025"
        required: true
    },
    editionNumber: {
        type: Number,
        required: true
    },
    
    // SEO
    metaTitle: {
        type: String,
        required: true
    },
    metaDescription: {
        type: String,
        required: true,
        maxlength: 160
    },
    metaKeywords: [String],
    ogImage: String, // Open Graph image
    
    // Contenuto
    coverImage: String,
    subtitle: String,
    description: String,
    
    // Blocchi di contenuto
    blocks: [blockSchema],
    
    // Stato pubblicazione
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft'
    },
    publishDate: {
        type: Date
    },
    featured: {
        type: Boolean,
        default: false
    },
    
    // Statistiche
    views: {
        type: Number,
        default: 0
    },
    
    // Autore
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

const Magazine = mongoose.model('Magazine', magazineSchema);

// ============================================
// MIDDLEWARE AUTENTICAZIONE
// ============================================

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token mancante. Accesso negato.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token non valido o scaduto.' });
        }
        req.user = user;
        next();
    });
};

// ============================================
// ROTTE PUBBLICHE (per il sito)
// ============================================

// GET - Tutti gli articoli pubblicati
app.get('/api/articles', async (req, res) => {
    try {
        const { category, featured, limit } = req.query;
        let query = { status: 'published' };
        
        if (category) query.category = category;
        if (featured === 'true') query.featured = true;

        const articles = await Article
            .find(query)
            .sort({ position: 1, publishDate: -1 })
            .limit(parseInt(limit) || 100);

        res.json({
            success: true,
            count: articles.length,
            data: articles
        });
    } catch (error) {
        console.error('Errore GET /api/articles:', error);
        res.status(500).json({ 
            success: false,
            error: 'Errore nel recupero degli articoli' 
        });
    }
});

// GET - Singolo articolo
app.get('/api/articles/:id', async (req, res) => {
    try {
        const article = await Article.findOne({ 
            _id: req.params.id,
            status: 'published'
        });
        
        if (!article) {
            return res.status(404).json({ 
                success: false,
                error: 'Articolo non trovato' 
            });
        }

        // Incrementa views
        article.views += 1;
        await article.save();
        
        res.json({
            success: true,
            data: article
        });
    } catch (error) {
        console.error('Errore GET /api/articles/:id:', error);
        res.status(500).json({ 
            success: false,
            error: 'Errore nel recupero dell\'articolo' 
        });
    }
});

// GET - Articoli per categoria
app.get('/api/articles/category/:category', async (req, res) => {
    try {
        const articles = await Article
            .find({ 
                category: req.params.category,
                status: 'published'
            })
            .sort({ position: 1, publishDate: -1 });
        
        res.json({
            success: true,
            count: articles.length,
            data: articles
        });
    } catch (error) {
        console.error('Errore GET /api/articles/category/:category:', error);
        res.status(500).json({ 
            success: false,
            error: 'Errore nel recupero degli articoli' 
        });
    }
});

// GET - Info rivista corrente
app.get('/api/magazine/current', async (req, res) => {
    try {
        const magazine = await Magazine.findOne({ 
            published: true,
            featured: true
        }).sort({ publishDate: -1 });
        
        if (!magazine) {
            return res.status(404).json({ 
                success: false,
                error: 'Nessuna rivista pubblicata' 
            });
        }
        
        res.json({
            success: true,
            data: magazine
        });
    } catch (error) {
        console.error('Errore GET /api/magazine/current:', error);
        res.status(500).json({ 
            success: false,
            error: 'Errore nel recupero della rivista' 
        });
    }
});

// ============================================
// ROTTE AUTENTICAZIONE
// ============================================

// POST - Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                success: false,
                error: 'Email e password sono obbligatori' 
            });
        }
        
        const user = await User.findOne({ email: email.toLowerCase() });
        
        if (!user) {
            return res.status(401).json({ 
                success: false,
                error: 'Credenziali non valide' 
            });
        }
        
        const validPassword = await bcrypt.compare(password, user.password);
        
        if (!validPassword) {
            return res.status(401).json({ 
                success: false,
                error: 'Credenziali non valide' 
            });
        }

        // Aggiorna ultimo login
        user.lastLogin = new Date();
        await user.save();
        
        const token = jwt.sign(
            { 
                id: user._id, 
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.json({ 
            success: true,
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                lastLogin: user.lastLogin
            }
        });
    } catch (error) {
        console.error('Errore POST /api/auth/login:', error);
        res.status(500).json({ 
            success: false,
            error: 'Errore durante il login' 
        });
    }
});

// POST - Verifica token
app.post('/api/auth/verify', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        
        if (!user) {
            return res.status(404).json({ 
                success: false,
                error: 'Utente non trovato' 
            });
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Errore POST /api/auth/verify:', error);
        res.status(500).json({ 
            success: false,
            error: 'Errore nella verifica del token' 
        });
    }
});

// POST - Crea primo admin (SOLO per setup iniziale)
app.post('/api/auth/setup-admin', async (req, res) => {
    try {
        // Controlla se esiste già un utente
        const existingUser = await User.findOne({});
        if (existingUser) {
            return res.status(400).json({ 
                success: false,
                error: 'Admin già esistente. Usa il login normale.' 
            });
        }

        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ 
                success: false,
                error: 'Email, password e nome sono obbligatori' 
            });
        }

        if (password.length < 6) {
            return res.status(400).json({ 
                success: false,
                error: 'La password deve essere di almeno 6 caratteri' 
            });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const user = new User({
            email: email.toLowerCase(),
            password: hashedPassword,
            name,
            role: 'admin'
        });
        
        await user.save();
        
        res.json({ 
            success: true,
            message: 'Admin creato con successo! Ora puoi fare il login.',
            user: {
                email: user.email,
                name: user.name
            }
        });
    } catch (error) {
        console.error('Errore POST /api/auth/setup-admin:', error);
        res.status(500).json({ 
            success: false,
            error: 'Errore durante la creazione dell\'admin' 
        });
    }
});

// ============================================
// ROTTE ADMIN (PROTETTE)
// ============================================

// GET - Tutti gli articoli (anche draft)
app.get('/api/admin/articles', authenticateToken, async (req, res) => {
    try {
        const { status, category } = req.query;
        let query = {};
        
        if (status) query.status = status;
        if (category) query.category = category;

        const articles = await Article
            .find(query)
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: articles.length,
            data: articles
        });
    } catch (error) {
        console.error('Errore GET /api/admin/articles:', error);
        res.status(500).json({ 
            success: false,
            error: 'Errore nel recupero degli articoli' 
        });
    }
});

// GET - Singolo articolo (admin)
app.get('/api/admin/articles/:id', authenticateToken, async (req, res) => {
    try {
        const article = await Article.findById(req.params.id);
        
        if (!article) {
            return res.status(404).json({ 
                success: false,
                error: 'Articolo non trovato' 
            });
        }

        res.json({
            success: true,
            data: article
        });
    } catch (error) {
        console.error('Errore GET /api/admin/articles/:id:', error);
        res.status(500).json({ 
            success: false,
            error: 'Errore nel recupero dell\'articolo' 
        });
    }
});

// POST - Crea articolo
app.post('/api/admin/articles', authenticateToken, async (req, res) => {
    try {
        const article = new Article(req.body);
        await article.save();
        
        res.status(201).json({
            success: true,
            message: 'Articolo creato con successo',
            data: article
        });
    } catch (error) {
        console.error('Errore POST /api/admin/articles:', error);
        res.status(400).json({ 
            success: false,
            error: error.message || 'Errore nella creazione dell\'articolo' 
        });
    }
});

// PUT - Modifica articolo
app.put('/api/admin/articles/:id', authenticateToken, async (req, res) => {
    try {
        const article = await Article.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!article) {
            return res.status(404).json({ 
                success: false,
                error: 'Articolo non trovato' 
            });
        }
        
        res.json({
            success: true,
            message: 'Articolo aggiornato con successo',
            data: article
        });
    } catch (error) {
        console.error('Errore PUT /api/admin/articles/:id:', error);
        res.status(400).json({ 
            success: false,
            error: error.message || 'Errore nell\'aggiornamento dell\'articolo' 
        });
    }
});

// DELETE - Cancella articolo
app.delete('/api/admin/articles/:id', authenticateToken, async (req, res) => {
    try {
        const article = await Article.findByIdAndDelete(req.params.id);
        
        if (!article) {
            return res.status(404).json({ 
                success: false,
                error: 'Articolo non trovato' 
            });
        }
        
        res.json({ 
            success: true,
            message: 'Articolo cancellato con successo' 
        });
    } catch (error) {
        console.error('Errore DELETE /api/admin/articles/:id:', error);
        res.status(500).json({ 
            success: false,
            error: 'Errore nella cancellazione dell\'articolo' 
        });
    }
});

// PUT - Riordina articoli
app.put('/api/admin/articles/reorder', authenticateToken, async (req, res) => {
    try {
        const { articles } = req.body; // Array di { id, position }

        if (!Array.isArray(articles)) {
            return res.status(400).json({ 
                success: false,
                error: 'Formato dati non valido' 
            });
        }

        // Aggiorna la posizione di ogni articolo
        const updates = articles.map(({ id, position }) => 
            Article.findByIdAndUpdate(id, { position })
        );

        await Promise.all(updates);

        res.json({
            success: true,
            message: 'Ordine articoli aggiornato con successo'
        });
    } catch (error) {
        console.error('Errore PUT /api/admin/articles/reorder:', error);
        res.status(500).json({ 
            success: false,
            error: 'Errore nel riordinamento degli articoli' 
        });
    }
});

// GET - Statistiche dashboard
app.get('/api/admin/stats', authenticateToken, async (req, res) => {
    try {
        const totalArticles = await Article.countDocuments();
        const publishedArticles = await Article.countDocuments({ status: 'published' });
        const draftArticles = await Article.countDocuments({ status: 'draft' });
        const totalViews = await Article.aggregate([
            { $group: { _id: null, total: { $sum: '$views' } } }
        ]);

        const recentArticles = await Article
            .find()
            .sort({ createdAt: -1 })
            .limit(5);

        res.json({
            success: true,
            data: {
                totalArticles,
                publishedArticles,
                draftArticles,
                totalViews: totalViews[0]?.total || 0,
                recentArticles
            }
        });
    } catch (error) {
        console.error('Errore GET /api/admin/stats:', error);
        res.status(500).json({ 
            success: false,
            error: 'Errore nel recupero delle statistiche' 
        });
    }
});

// ============================================
// ROTTE GESTIONE RIVISTA E BLOCCHI
// ============================================

// GET - Tutte le riviste
app.get('/api/admin/magazines', authenticateToken, async (req, res) => {
    try {
        const magazines = await Magazine.find()
            .sort({ createdAt: -1 })
            .populate('author', 'name email');
        
        res.json({
            success: true,
            count: magazines.length,
            data: magazines
        });
    } catch (error) {
        console.error('Errore GET /api/admin/magazines:', error);
        res.status(500).json({ 
            success: false,
            error: 'Errore nel recupero delle riviste' 
        });
    }
});

// GET - Singola rivista
app.get('/api/admin/magazines/:id', authenticateToken, async (req, res) => {
    try {
        const magazine = await Magazine.findById(req.params.id)
            .populate('author', 'name email');
        
        if (!magazine) {
            return res.status(404).json({ 
                success: false,
                error: 'Rivista non trovata' 
            });
        }
        
        res.json({
            success: true,
            data: magazine
        });
    } catch (error) {
        console.error('Errore GET /api/admin/magazines/:id:', error);
        res.status(500).json({ 
            success: false,
            error: 'Errore nel recupero della rivista' 
        });
    }
});

// GET - Rivista pubblica per slug
app.get('/api/magazines/slug/:slug', async (req, res) => {
    try {
        const magazine = await Magazine.findOne({ 
            slug: req.params.slug,
            status: 'published'
        }).populate('author', 'name');
        
        if (!magazine) {
            return res.status(404).json({ 
                success: false,
                error: 'Rivista non trovata' 
            });
        }
        
        // Incrementa views
        magazine.views += 1;
        await magazine.save();
        
        res.json({
            success: true,
            data: magazine
        });
    } catch (error) {
        console.error('Errore GET /api/magazines/slug/:slug:', error);
        res.status(500).json({ 
            success: false,
            error: 'Errore nel recupero della rivista' 
        });
    }
});

// ============================================
// GESTIONE BLOCCHI DENTRO LA RIVISTA
// ============================================

// POST - Aggiungi blocco a una rivista
app.post('/api/admin/magazines/:id/blocks', authenticateToken, async (req, res) => {
    try {
        const magazine = await Magazine.findById(req.params.id);
        
        if (!magazine) {
            return res.status(404).json({ 
                success: false,
                error: 'Rivista non trovata' 
            });
        }
        
        // Calcola la posizione del nuovo blocco
        const maxPosition = magazine.blocks.length > 0 
            ? Math.max(...magazine.blocks.map(b => b.position))
            : -1;
        
        const newBlock = {
            ...req.body,
            position: maxPosition + 1
        };
        
        magazine.blocks.push(newBlock);
        await magazine.save();
        
        res.status(201).json({
            success: true,
            message: 'Blocco aggiunto con successo',
            data: magazine
        });
    } catch (error) {
        console.error('Errore POST /api/admin/magazines/:id/blocks:', error);
        res.status(400).json({ 
            success: false,
            error: error.message || 'Errore nell\'aggiunta del blocco' 
        });
    }
});

// PUT - Aggiorna blocco
app.put('/api/admin/magazines/:id/blocks/:blockId', authenticateToken, async (req, res) => {
    try {
        const magazine = await Magazine.findById(req.params.id);
        
        if (!magazine) {
            return res.status(404).json({ 
                success: false,
                error: 'Rivista non trovata' 
            });
        }
        
        const block = magazine.blocks.id(req.params.blockId);
        
        if (!block) {
            return res.status(404).json({ 
                success: false,
                error: 'Blocco non trovato' 
            });
        }
        
        // Aggiorna i campi del blocco
        Object.assign(block, req.body);
        await magazine.save();
        
        res.json({
            success: true,
            message: 'Blocco aggiornato con successo',
            data: magazine
        });
    } catch (error) {
        console.error('Errore PUT /api/admin/magazines/:id/blocks/:blockId:', error);
        res.status(400).json({ 
            success: false,
            error: error.message || 'Errore nell\'aggiornamento del blocco' 
        });
    }
});

// DELETE - Elimina blocco
app.delete('/api/admin/magazines/:id/blocks/:blockId', authenticateToken, async (req, res) => {
    try {
        const magazine = await Magazine.findById(req.params.id);
        
        if (!magazine) {
            return res.status(404).json({ 
                success: false,
                error: 'Rivista non trovata' 
            });
        }
        
        magazine.blocks.pull(req.params.blockId);
        await magazine.save();
        
        res.json({
            success: true,
            message: 'Blocco eliminato con successo',
            data: magazine
        });
    } catch (error) {
        console.error('Errore DELETE /api/admin/magazines/:id/blocks/:blockId:', error);
        res.status(500).json({ 
            success: false,
            error: 'Errore nell\'eliminazione del blocco' 
        });
    }
});

// PUT - Riordina blocchi
app.put('/api/admin/magazines/:id/blocks/reorder', authenticateToken, async (req, res) => {
    try {
        const magazine = await Magazine.findById(req.params.id);
        
        if (!magazine) {
            return res.status(404).json({ 
                success: false,
                error: 'Rivista non trovata' 
            });
        }
        
        const { blocks } = req.body; // Array di { id, position }
        
        if (!Array.isArray(blocks)) {
            return res.status(400).json({ 
                success: false,
                error: 'Formato dati non valido' 
            });
        }
        
        // Aggiorna la posizione di ogni blocco
        blocks.forEach(({ id, position }) => {
            const block = magazine.blocks.id(id);
            if (block) {
                block.position = position;
            }
        });
        
        await magazine.save();
        
        res.json({
            success: true,
            message: 'Ordine blocchi aggiornato con successo',
            data: magazine
        });
    } catch (error) {
        console.error('Errore PUT /api/admin/magazines/:id/blocks/reorder:', error);
        res.status(500).json({ 
            success: false,
            error: 'Errore nel riordinamento dei blocchi' 
        });
    }
});

// ============================================
// ROTTE GESTIONE RIVISTA (CRUD BASE)
// ============================================

// POST - Crea nuova rivista
app.post('/api/admin/magazines', authenticateToken, async (req, res) => {
    try {
        const magazine = new Magazine({
            ...req.body,
            author: req.user.id
        });
        await magazine.save();
        
        res.status(201).json({
            success: true,
            message: 'Rivista creata con successo',
            data: magazine
        });
    } catch (error) {
        console.error('Errore POST /api/admin/magazines:', error);
        res.status(400).json({ 
            success: false,
            error: error.message || 'Errore nella creazione della rivista' 
        });
    }
});

// DELETE - Elimina rivista
app.delete('/api/admin/magazines/:id', authenticateToken, async (req, res) => {
    try {
        const magazine = await Magazine.findByIdAndDelete(req.params.id);
        
        if (!magazine) {
            return res.status(404).json({ 
                success: false,
                error: 'Rivista non trovata' 
            });
        }
        
        res.json({ 
            success: true,
            message: 'Rivista eliminata con successo' 
        });
    } catch (error) {
        console.error('Errore DELETE /api/admin/magazines/:id:', error);
        res.status(500).json({ 
            success: false,
            error: 'Errore nell\'eliminazione della rivista' 
        });
    }
});

// PUT - Aggiorna rivista
app.put('/api/admin/magazines/:id', authenticateToken, async (req, res) => {
    try {
        const magazine = await Magazine.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!magazine) {
            return res.status(404).json({ 
                success: false,
                error: 'Rivista non trovata' 
            });
        }
        
        res.json({
            success: true,
            message: 'Rivista aggiornata con successo',
            data: magazine
        });
    } catch (error) {
        console.error('Errore PUT /api/admin/magazines/:id:', error);
        res.status(400).json({ 
            success: false,
            error: error.message || 'Errore nell\'aggiornamento della rivista' 
        });
    }
});

// ============================================
// GENERAZIONE HTML RIVISTA
// ============================================

// Genera l'HTML completo della rivista dai blocchi
app.post('/api/admin/magazines/:id/generate-html', authenticateToken, async (req, res) => {
    try {
        const magazine = await Magazine.findById(req.params.id);
        
        if (!magazine) {
            return res.status(404).json({ 
                success: false,
                error: 'Rivista non trovata' 
            });
        }
        
        // Ordina i blocchi per posizione
        const sortedBlocks = magazine.blocks.sort((a, b) => a.position - b.position);
        
        // Genera HTML per ogni blocco
        const blocksHTML = sortedBlocks
            .filter(block => block.visible !== false)
            .map(block => generateBlockHTML(block))
            .join('\n\n');
        
        // Template HTML completo
        const fullHTML = `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${magazine.metaTitle || magazine.name}</title>
    <meta name="description" content="${magazine.metaDescription || ''}">
    ${magazine.metaKeywords?.length ? `<meta name="keywords" content="${magazine.metaKeywords.join(', ')}">` : ''}
    
    <!-- Open Graph -->
    <meta property="og:title" content="${magazine.metaTitle || magazine.name}">
    <meta property="og:description" content="${magazine.metaDescription || ''}">
    ${magazine.ogImage ? `<meta property="og:image" content="${magazine.ogImage}">` : ''}
    <meta property="og:type" content="website">
    
    <!-- Styles -->
    <link rel="stylesheet" href="assets/css/loading.css">
    <link rel="stylesheet" href="assets/css/main.css">
    <link rel="stylesheet" href="assets/css/magazine-generated.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
</head>
<body>
    <!-- Generated by CHECK-IN CMS -->
    <div class="magazine-container" data-magazine-id="${magazine._id}" data-slug="${magazine.slug}">
        
${blocksHTML}
        
    </div>
    
    <!-- Scripts -->
    <script src="assets/js/main.js"></script>
</body>
</html>`;
        
        res.json({
            success: true,
            html: fullHTML,
            magazine: {
                id: magazine._id,
                name: magazine.name,
                slug: magazine.slug,
                blocksCount: sortedBlocks.length
            }
        });
        
    } catch (error) {
        console.error('Errore generazione HTML:', error);
        res.status(500).json({ 
            success: false,
            error: 'Errore nella generazione dell\'HTML' 
        });
    }
});

// Funzione helper per generare HTML di ogni tipo di blocco
function generateBlockHTML(block) {
    const style = block.style || {};
    const bgColor = style.backgroundColor || '';
    const textColor = style.textColor || '';
    const layout = style.layout || 'center';
    const height = style.height || 'auto';
    
    const styleAttr = `style="
        ${bgColor ? `background-color: ${bgColor};` : ''}
        ${textColor ? `color: ${textColor};` : ''}
        ${height !== 'auto' ? `min-height: ${height};` : ''}
    "`;
    
    switch (block.type) {
        case 'hero':
            return `
    <!-- Hero Block -->
    <section class="hero-block block-${block._id}" ${styleAttr} data-layout="${layout}">
        ${block.image ? `<div class="hero-background" style="background-image: url('${block.image}');"></div>` : ''}
        <div class="hero-content">
            ${block.title ? `<h1 class="hero-title">${block.title}</h1>` : ''}
            ${block.subtitle ? `<p class="hero-subtitle">${block.subtitle}</p>` : ''}
            ${block.content ? `<div class="hero-description">${block.content}</div>` : ''}
            ${block.link && block.buttonText ? `
                <a href="${block.link}" class="hero-cta">${block.buttonText}</a>
            ` : ''}
        </div>
    </section>`;
        
        case 'article':
            return `
    <!-- Article Block -->
    <article class="article-block block-${block._id}" ${styleAttr} data-layout="${layout}">
        <div class="article-container">
            ${block.image ? `
                <div class="article-image">
                    <img src="${block.image}" alt="${block.title || ''}" loading="lazy">
                </div>
            ` : ''}
            <div class="article-content">
                ${block.title ? `<h2 class="article-title">${block.title}</h2>` : ''}
                ${block.subtitle ? `<p class="article-subtitle">${block.subtitle}</p>` : ''}
                ${block.content ? `<div class="article-body">${block.content}</div>` : ''}
                ${block.link && block.buttonText ? `
                    <a href="${block.link}" class="article-link">${block.buttonText} →</a>
                ` : ''}
            </div>
        </div>
    </article>`;
        
        case 'gallery':
            const images = block.images || [];
            return `
    <!-- Gallery Block -->
    <section class="gallery-block block-${block._id}" ${styleAttr}>
        ${block.title ? `<h2 class="gallery-title">${block.title}</h2>` : ''}
        ${block.subtitle ? `<p class="gallery-subtitle">${block.subtitle}</p>` : ''}
        <div class="gallery-grid" data-columns="${block.settings?.columns || 3}">
            ${images.map((img, idx) => `
                <div class="gallery-item">
                    <img src="${img}" alt="Gallery image ${idx + 1}" loading="lazy">
                </div>
            `).join('')}
        </div>
    </section>`;
        
        case 'text':
            return `
    <!-- Text Block -->
    <section class="text-block block-${block._id}" ${styleAttr} data-layout="${layout}">
        <div class="text-container">
            ${block.title ? `<h2 class="text-title">${block.title}</h2>` : ''}
            ${block.content ? `<div class="text-content">${block.content}</div>` : ''}
        </div>
    </section>`;
        
        case 'quote':
            return `
    <!-- Quote Block -->
    <section class="quote-block block-${block._id}" ${styleAttr}>
        <div class="quote-container">
            <blockquote class="quote-text">
                ${block.content || block.title || ''}
            </blockquote>
            ${block.subtitle ? `<cite class="quote-author">${block.subtitle}</cite>` : ''}
        </div>
    </section>`;
        
        case 'video':
            return `
    <!-- Video Block -->
    <section class="video-block block-${block._id}" ${styleAttr}>
        ${block.title ? `<h2 class="video-title">${block.title}</h2>` : ''}
        <div class="video-container">
            ${block.link ? `
                <iframe 
                    src="${block.link}" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen
                    loading="lazy">
                </iframe>
            ` : ''}
        </div>
        ${block.content ? `<div class="video-description">${block.content}</div>` : ''}
    </section>`;
        
        case 'custom':
            return `
    <!-- Custom Block -->
    <section class="custom-block block-${block._id}" ${styleAttr}>
        ${block.content || ''}
    </section>`;
        
        default:
            return `<!-- Unknown block type: ${block.type} -->`;
    }
}

// Pubblica la rivista (copia HTML nel file index.html)
const fs = require('fs').promises;
const path = require('path');

app.post('/api/admin/magazines/:id/publish', authenticateToken, async (req, res) => {
    try {
        const magazine = await Magazine.findById(req.params.id);
        
        if (!magazine) {
            return res.status(404).json({ 
                success: false,
                error: 'Rivista non trovata' 
            });
        }
        
        // Genera l'HTML
        const sortedBlocks = magazine.blocks.sort((a, b) => a.position - b.position);
        const blocksHTML = sortedBlocks
            .filter(block => block.visible !== false)
            .map(block => generateBlockHTML(block))
            .join('\n\n');
        
        const fullHTML = `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${magazine.metaTitle || magazine.name}</title>
    <meta name="description" content="${magazine.metaDescription || ''}">
    ${magazine.metaKeywords?.length ? `<meta name="keywords" content="${magazine.metaKeywords.join(', ')}">` : ''}
    
    <!-- Open Graph -->
    <meta property="og:title" content="${magazine.metaTitle || magazine.name}">
    <meta property="og:description" content="${magazine.metaDescription || ''}">
    ${magazine.ogImage ? `<meta property="og:image" content="${magazine.ogImage}">` : ''}
    <meta property="og:type" content="website">
    
    <!-- Styles -->
    <link rel="stylesheet" href="assets/css/loading.css">
    <link rel="stylesheet" href="assets/css/main.css">
    <link rel="stylesheet" href="assets/css/magazine-generated.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
</head>
<body>
    <!-- Generated by CHECK-IN CMS on ${new Date().toISOString()} -->
    <div class="magazine-container" data-magazine-id="${magazine._id}" data-slug="${magazine.slug}">
        
${blocksHTML}
        
    </div>
    
    <!-- Scripts -->
    <script src="assets/js/main.js"></script>
</body>
</html>`;
        
        // Salva il file nella directory pubblica
        const publicPath = path.join(__dirname, '../../index.html');
        await fs.writeFile(publicPath, fullHTML, 'utf8');
        
        // Aggiorna lo stato della rivista
        magazine.status = 'published';
        magazine.publishDate = new Date();
        await magazine.save();
        
        res.json({
            success: true,
            message: 'Rivista pubblicata con successo!',
            path: publicPath,
            url: `/${magazine.slug}`,
            magazine: {
                id: magazine._id,
                name: magazine.name,
                slug: magazine.slug,
                publishDate: magazine.publishDate
            }
        });
        
    } catch (error) {
        console.error('Errore pubblicazione rivista:', error);
        res.status(500).json({ 
            success: false,
            error: 'Errore nella pubblicazione: ' + error.message 
        });
    }
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
    res.json({ 
        success: true,
        message: 'CHECK-IN CMS Backend is running!',
        timestamp: new Date().toISOString(),
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// ============================================
// 404 Handler
// ============================================

app.use((req, res) => {
    res.status(404).json({ 
        success: false,
        error: 'Endpoint non trovato' 
    });
});

// ============================================
// ERROR Handler
// ============================================

app.use((err, req, res, next) => {
    console.error('Errore server:', err);
    res.status(500).json({ 
        success: false,
        error: 'Errore interno del server' 
    });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════╗
║                                               ║
║   🚀 CHECK-IN CMS Backend                    ║
║                                               ║
║   Server: http://localhost:${PORT}              ║
║   Health: http://localhost:${PORT}/health       ║
║   Status: ✅ Running                          ║
║                                               ║
╚═══════════════════════════════════════════════╝
    `);
});
