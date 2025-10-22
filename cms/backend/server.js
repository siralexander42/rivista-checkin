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
    origin: [process.env.FRONTEND_URL, process.env.ADMIN_URL],
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

// Schema Rivista (per gestire layout e metadata)
const magazineSchema = new mongoose.Schema({
    editionNumber: {
        type: Number,
        required: true
    },
    title: {
        type: String,
        default: 'CHECK-IN Magazine'
    },
    subtitle: {
        type: String
    },
    coverImage: {
        type: String
    },
    publishDate: {
        type: Date,
        default: Date.now
    },
    published: {
        type: Boolean,
        default: false
    },
    featured: {
        type: Boolean,
        default: true
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
// ROTTE GESTIONE RIVISTA
// ============================================

// GET - Tutte le edizioni
app.get('/api/admin/magazines', authenticateToken, async (req, res) => {
    try {
        const magazines = await Magazine.find().sort({ publishDate: -1 });
        
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

// POST - Crea nuova edizione
app.post('/api/admin/magazines', authenticateToken, async (req, res) => {
    try {
        const magazine = new Magazine(req.body);
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
