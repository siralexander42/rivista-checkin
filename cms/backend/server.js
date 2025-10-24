const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const fs = require('fs').promises;
const path = require('path');
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
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
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
        enum: ['super-admin', 'admin', 'editor'],
        default: 'editor'
    },
    lastLogin: {
        type: Date
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { 
    timestamps: true 
});

const User = mongoose.model('User', userSchema);

// Schema Login Log
const loginLogSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: String,
    success: {
        type: Boolean,
        required: true
    },
    ipAddress: String,
    userAgent: String,
    errorMessage: String,
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

const LoginLog = mongoose.model('LoginLog', loginLogSchema);

// ============================================
// SCHEMA RIVISTE E BLOCCHI
// ============================================

// Schema per i Blocchi di contenuto della rivista
const blockSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['cover', 'hero', 'article', 'gallery', 'text', 'quote', 'video', 'fluid', 'custom'],
        required: true
    },
    title: String,
    subtitle: String,
    content: String,
    image: String,
    images: [String], // Per gallery o backgrounds multipli (cover)
    link: String,
    buttonText: String,
    tag: String, // Per parallasse block E gallery block (occhiello)
    intro: String, // Per parallasse block E gallery block (lead text)
    previewImage: String, // Per parallasse block - immagine iniziale/anteprima
    summaryTitle: String, // Per parallasse block E gallery block - titolo da mostrare nel sommario
    ctaText: String, // Per parallasse block E gallery block
    ctaLink: String, // Per parallasse block E gallery block
    fluidBlocks: [{ // Per parallasse block - array di blocchi di testo con immagini
        heading: String,
        text: String,
        highlight: String,
        image: String
    }],
    // GALLERY STORY BLOCK - Campi specifici
    showStats: Boolean, // Mostra/nascondi sezione stats
    stats: [{ // Array di statistiche animate
        number: String,
        label: String
    }],
    showQuote: Boolean, // Mostra/nascondi citazione
    quote: { // Citazione
        text: String,
        author: String
    },
    showFeatures: Boolean, // Mostra/nascondi lista caratteristiche
    features: [String], // Lista di features/highlights
    galleryImages: [{ // Gallery images con crop data
        url: String,
        caption: String,
        cropData: mongoose.Schema.Types.Mixed
    }],
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
    settings: mongoose.Schema.Types.Mixed, // Impostazioni custom per ogni tipo (es. sommario per cover)
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
    
    // Impostazioni visualizzazione
    showLoadingScreen: {
        type: Boolean,
        default: false
    },
    
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

// Middleware per verificare il ruolo super-admin
const requireSuperAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || user.role !== 'super-admin') {
            return res.status(403).json({ error: 'Accesso negato. Richiesti privilegi di super-admin.' });
        }
        next();
    } catch (error) {
        res.status(500).json({ error: 'Errore verifica autorizzazioni' });
    }
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
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            // Log tentativo fallito - campi mancanti
            await LoginLog.create({
                username: username || 'N/A',
                success: false,
                ipAddress,
                userAgent,
                errorMessage: 'Username o password mancanti'
            });
            
            return res.status(400).json({ 
                success: false,
                error: 'Username e password sono obbligatori' 
            });
        }
        
        const user = await User.findOne({ username: username.toLowerCase() });
        
        if (!user) {
            // Log tentativo fallito - utente non trovato
            await LoginLog.create({
                username: username.toLowerCase(),
                success: false,
                ipAddress,
                userAgent,
                errorMessage: 'Username non esistente'
            });
            
            return res.status(401).json({ 
                success: false,
                error: 'Credenziali non valide' 
            });
        }
        
        const validPassword = await bcrypt.compare(password, user.password);
        
        if (!validPassword) {
            // Log tentativo fallito - password errata
            await LoginLog.create({
                username: user.username,
                email: user.email,
                userId: user._id,
                success: false,
                ipAddress,
                userAgent,
                errorMessage: 'Password errata'
            });
            
            return res.status(401).json({ 
                success: false,
                error: 'Credenziali non valide' 
            });
        }

        // Aggiorna ultimo login
        user.lastLogin = new Date();
        await user.save();
        
        // Log accesso riuscito
        await LoginLog.create({
            username: user.username,
            email: user.email,
            userId: user._id,
            success: true,
            ipAddress,
            userAgent
        });
        
        const token = jwt.sign(
            { 
                id: user._id, 
                username: user.username,
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
                username: user.username,
                email: user.email,
                name: user.name,
                role: user.role,
                lastLogin: user.lastLogin
            }
        });
    } catch (error) {
        console.error('Errore POST /api/auth/login:', error);
        
        // Log errore di sistema
        try {
            await LoginLog.create({
                username: req.body.username || 'N/A',
                success: false,
                ipAddress,
                userAgent,
                errorMessage: 'Errore di sistema: ' + error.message
            });
        } catch (logError) {
            console.error('Errore nel logging:', logError);
        }
        
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

        const { username, email, password, name } = req.body;

        if (!username || !email || !password || !name) {
            return res.status(400).json({ 
                success: false,
                error: 'Username, email, password e nome sono obbligatori' 
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
            username: username.toLowerCase(),
            email: email.toLowerCase(),
            password: hashedPassword,
            name,
            role: 'super-admin'
        });
        
        await user.save();
        
        res.json({ 
            success: true,
            message: 'Super-Admin creato con successo! Ora puoi fare il login.',
            user: {
                username: user.username,
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
// ROTTE GESTIONE UTENTI (SUPER-ADMIN ONLY)
// ============================================

// GET - Lista tutti gli utenti
app.get('/api/users', authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        res.json({ 
            success: true,
            data: users
        });
    } catch (error) {
        console.error('Errore GET /api/users:', error);
        res.status(500).json({ 
            success: false,
            error: 'Errore nel recupero degli utenti' 
        });
    }
});

// POST - Crea nuovo utente
app.post('/api/users', authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
        const { username, email, password, name, role } = req.body;

        if (!username || !email || !password || !name) {
            return res.status(400).json({ 
                success: false,
                error: 'Username, email, password e nome sono obbligatori' 
            });
        }

        if (password.length < 6) {
            return res.status(400).json({ 
                success: false,
                error: 'La password deve essere di almeno 6 caratteri' 
            });
        }

        // Verifica se username o email esistono già
        const existingUser = await User.findOne({ 
            $or: [
                { username: username.toLowerCase() },
                { email: email.toLowerCase() }
            ]
        });

        if (existingUser) {
            return res.status(400).json({ 
                success: false,
                error: 'Username o email già in uso' 
            });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const user = new User({
            username: username.toLowerCase(),
            email: email.toLowerCase(),
            password: hashedPassword,
            name,
            role: role || 'editor'
        });
        
        await user.save();
        
        res.json({ 
            success: true,
            message: 'Utente creato con successo',
            data: {
                id: user._id,
                username: user.username,
                email: user.email,
                name: user.name,
                role: user.role,
                isActive: user.isActive
            }
        });
    } catch (error) {
        console.error('Errore POST /api/users:', error);
        res.status(500).json({ 
            success: false,
            error: 'Errore durante la creazione dell\'utente' 
        });
    }
});

// PUT - Aggiorna utente
app.put('/api/users/:id', authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
        const { username, email, name, role, isActive, password } = req.body;
        const updateData = {};

        if (username) updateData.username = username.toLowerCase();
        if (email) updateData.email = email.toLowerCase();
        if (name) updateData.name = name;
        if (role) updateData.role = role;
        if (typeof isActive === 'boolean') updateData.isActive = isActive;
        
        if (password) {
            if (password.length < 6) {
                return res.status(400).json({ 
                    success: false,
                    error: 'La password deve essere di almeno 6 caratteri' 
                });
            }
            updateData.password = await bcrypt.hash(password, 10);
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ 
                success: false,
                error: 'Utente non trovato' 
            });
        }

        res.json({ 
            success: true,
            message: 'Utente aggiornato con successo',
            data: user
        });
    } catch (error) {
        console.error('Errore PUT /api/users:', error);
        res.status(500).json({ 
            success: false,
            error: 'Errore durante l\'aggiornamento dell\'utente' 
        });
    }
});

// DELETE - Elimina utente
app.delete('/api/users/:id', authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
        // Non permettere di eliminare se stesso
        if (req.params.id === req.user.id) {
            return res.status(400).json({ 
                success: false,
                error: 'Non puoi eliminare il tuo account' 
            });
        }

        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({ 
                success: false,
                error: 'Utente non trovato' 
            });
        }

        res.json({ 
            success: true,
            message: 'Utente eliminato con successo'
        });
    } catch (error) {
        console.error('Errore DELETE /api/users:', error);
        res.status(500).json({ 
            success: false,
            error: 'Errore durante l\'eliminazione dell\'utente' 
        });
    }
});

// POST - Verifica password super-admin per accesso pagina utenti
app.post('/api/users/verify-access', authenticateToken, async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ 
                success: false,
                error: 'Password richiesta' 
            });
        }

        const user = await User.findById(req.user.id);

        if (!user || user.role !== 'super-admin') {
            return res.status(403).json({ 
                success: false,
                error: 'Accesso negato' 
            });
        }

        // Verifica password speciale
        if (password !== 'alessandro.venturini!') {
            return res.status(401).json({ 
                success: false,
                error: 'Password non corretta' 
            });
        }

        res.json({ 
            success: true,
            message: 'Accesso consentito'
        });
    } catch (error) {
        console.error('Errore POST /api/users/verify-access:', error);
        res.status(500).json({ 
            success: false,
            error: 'Errore durante la verifica' 
        });
    }
});

// ============================================
// ROTTE LOGIN LOGS (SUPER-ADMIN ONLY)
// ============================================

// GET - Lista tutti i log di accesso
app.get('/api/login-logs', authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
        const { limit = 100, success, username } = req.query;
        
        let query = {};
        if (success !== undefined) {
            query.success = success === 'true';
        }
        if (username) {
            query.username = new RegExp(username, 'i');
        }
        
        const logs = await LoginLog.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .populate('userId', 'name email role');
        
        res.json({ 
            success: true,
            data: logs
        });
    } catch (error) {
        console.error('Errore GET /api/login-logs:', error);
        res.status(500).json({ 
            success: false,
            error: 'Errore nel recupero dei log' 
        });
    }
});

// GET - Statistiche accessi
app.get('/api/login-logs/stats', authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
        const total = await LoginLog.countDocuments();
        const successful = await LoginLog.countDocuments({ success: true });
        const failed = await LoginLog.countDocuments({ success: false });
        
        // Ultimi 24 ore
        const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentTotal = await LoginLog.countDocuments({ createdAt: { $gte: last24h } });
        const recentFailed = await LoginLog.countDocuments({ success: false, createdAt: { $gte: last24h } });
        
        res.json({ 
            success: true,
            data: {
                total,
                successful,
                failed,
                last24h: {
                    total: recentTotal,
                    failed: recentFailed
                }
            }
        });
    } catch (error) {
        console.error('Errore GET /api/login-logs/stats:', error);
        res.status(500).json({ 
            success: false,
            error: 'Errore nel calcolo delle statistiche' 
        });
    }
});

// DELETE - Elimina log vecchi
app.delete('/api/login-logs/cleanup', authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        
        const result = await LoginLog.deleteMany({ createdAt: { $lt: cutoffDate } });
        
        res.json({ 
            success: true,
            message: `Eliminati ${result.deletedCount} log più vecchi di ${days} giorni`
        });
    } catch (error) {
        console.error('Errore DELETE /api/login-logs/cleanup:', error);
        res.status(500).json({ 
            success: false,
            error: 'Errore durante la pulizia dei log' 
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

// GET - Tutte le riviste pubblicate (per homepage/indice)
app.get('/api/magazines/published', async (req, res) => {
    try {
        const magazines = await Magazine.find({ 
            status: 'published' 
        })
        .select('name slug edition editionNumber metaTitle metaDescription coverImage publishDate views featured')
        .sort({ publishDate: -1 });
        
        res.json({
            success: true,
            count: magazines.length,
            data: magazines
        });
    } catch (error) {
        console.error('Errore GET /api/magazines/published:', error);
        res.status(500).json({ 
            success: false,
            error: 'Errore nel recupero delle riviste pubblicate' 
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

// POST - Anteprima blocco singolo
app.post('/api/admin/blocks/preview', async (req, res) => {
    try {
        const { type, data } = req.body;
        
        // Genera HTML del blocco
        const blockHtml = generateBlockHTML({ type, ...data }, 0);
        
        // Crea HTML completo con CSS
        const fullHtml = `
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Anteprima Blocco</title>
    <link rel="stylesheet" href="${process.env.BASE_URL || 'http://localhost:3001'}/assets/css/style.css">
    <link rel="stylesheet" href="${process.env.BASE_URL || 'http://localhost:3001'}/assets/css/main.css">
    <link rel="stylesheet" href="${process.env.BASE_URL || 'http://localhost:3001'}/assets/css/cremona-scroll.css">
    <link rel="stylesheet" href="${process.env.BASE_URL || 'http://localhost:3001'}/assets/css/sommario.css">
    <link rel="stylesheet" href="${process.env.BASE_URL || 'http://localhost:3001'}/assets/css/mobile.css">
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        }
        * { box-sizing: border-box; }
    </style>
</head>
<body>
    ${blockHtml}
    
    <script>
        // Script base per il funzionamento del blocco
        document.addEventListener('DOMContentLoaded', function() {
            // IntersectionObserver per Parallasse Block
            const cremonaSections = document.querySelectorAll('.cremona-scroll-section');
            cremonaSections.forEach(section => {
                const textBlocks = section.querySelectorAll('.cremona-text-block');
                const images = section.querySelectorAll('.cremona-img');
                
                if (textBlocks.length === 0 || images.length === 0) return;
                
                textBlocks[0].classList.add('active');
                images[0].classList.add('active');
                
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const block = entry.target;
                            const imageIndex = parseInt(block.getAttribute('data-image'));
                            
                            textBlocks.forEach(b => b.classList.remove('active'));
                            block.classList.add('active');
                            
                            if (imageIndex >= 0 && imageIndex < images.length) {
                                images.forEach(img => img.classList.remove('active'));
                                images[imageIndex].classList.add('active');
                            }
                        }
                    });
                }, {
                    threshold: 0.5,
                    rootMargin: '-20% 0px -20% 0px'
                });
                
                textBlocks.forEach(block => observer.observe(block));
            });
            
            // Sommario toggle per Cover
            const sommarioToggle = document.querySelector('.sommario-toggle-hero');
            const dropdown = document.querySelector('.hero-sommario-dropdown');
            if (sommarioToggle && dropdown) {
                sommarioToggle.addEventListener('click', () => {
                    dropdown.classList.toggle('active');
                    sommarioToggle.classList.toggle('active');
                });
            }
        });
    </script>
</body>
</html>`;
        
        res.json({
            success: true,
            html: fullHtml
        });
    } catch (error) {
        console.error('Errore anteprima blocco:', error);
        res.status(500).json({
            success: false,
            error: 'Errore nella generazione dell\'anteprima'
        });
    }
});

// ============================================
// GENERAZIONE HTML RIVISTA
// ============================================

// Servi file di anteprima statici
app.use('/preview', express.static(path.join(__dirname, 'preview')));

// Genera l'HTML completo della rivista dai blocchi e salva come file preview
app.post('/api/admin/magazines/:id/generate-html', async (req, res) => {
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
        
        // Controlla se la rivista ha la loading screen attiva
        const showLoadingScreen = magazine.showLoadingScreen || false;
        
        // Leggi i CSS inline per l'anteprima
        const cssPath = path.join(__dirname, '../../assets/css/magazine-generated.css');
        const cremonaCssPath = path.join(__dirname, '../../assets/css/cremona-scroll.css');
        const mainCssPath = path.join(__dirname, '../../assets/css/main.css');
        const loadingCssPath = path.join(__dirname, '../../assets/css/loading.css');
        const cremonaJsPath = path.join(__dirname, '../../assets/js/cremona-scroll.js');
        const loadingJsPath = path.join(__dirname, '../../assets/js/loading.js');
        
        let inlineCSS = '';
        let cremonaCSS = '';
        let mainCSS = '';
        let loadingCSS = '';
        let cremonaJS = '';
        let loadingJS = '';
        
        try {
            inlineCSS = await fs.readFile(cssPath, 'utf8');
        } catch (err) {
            console.warn('magazine-generated.css not found');
        }
        
        try {
            cremonaCSS = await fs.readFile(cremonaCssPath, 'utf8');
        } catch (err) {
            console.warn('cremona-scroll.css not found');
        }
        
        try {
            mainCSS = await fs.readFile(mainCssPath, 'utf8');
        } catch (err) {
            console.warn('main.css not found');
        }
        
        if (showLoadingScreen) {
            try {
                loadingCSS = await fs.readFile(loadingCssPath, 'utf8');
            } catch (err) {
                console.warn('loading.css not found');
            }
            
            try {
                loadingJS = await fs.readFile(loadingJsPath, 'utf8');
            } catch (err) {
                console.warn('loading.js not found');
            }
        }
        
        try {
            cremonaJS = await fs.readFile(cremonaJsPath, 'utf8');
        } catch (err) {
            console.warn('cremona-scroll.js not found');
        }
        
        // Template HTML completo con CSS inline
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
    
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    
    <!-- Inline Styles for Preview -->
    <style>
        /* Reset base */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background: #ffffff;
        }
        
        ${showLoadingScreen ? `/* Loading Screen CSS */\n        ${loadingCSS}\n        ` : ''}
        /* Main CSS */
        ${mainCSS}
        
        /* Cremona Scroll CSS */
        ${cremonaCSS}
        
        /* Magazine Generated CSS */
        ${inlineCSS}
    </style>
</head>
<body>
    ${showLoadingScreen ? `<!-- LOADING SCREEN -->
    <div class="loading-screen" id="loadingScreen">
        <svg class="loading-logo" enable-background="new 0 0 818 192" viewBox="0 0 818 192" xmlns="http://www.w3.org/2000/svg" style="width: 200px; height: auto; filter: brightness(0) invert(1);"><g fill="#373683"><path d="m185.63 157.83 2.88 2.88c-19.36 19.88-44.21 28.51-68.53 28.51-51.79 0-93.12-41.85-93.12-93.65s41.32-93.65 93.11-93.65c31.13 0 51.01 9.94 69.06 27.21l-6.54 6.28c-15.69-18.05-34-29.82-62.52-29.82-51.79 0-79.52 42.64-79.52 89.98 0 47.35 27.73 89.98 79.52 89.98 24.33 0 46.83-9.15 65.66-27.72zm-48.65-47.09v37.15h-12.56v-104.64h12.56v63.83h83.18v-103.06h12.56v171.86c0 4.19.26 6.54 2.62 11.25h-15.17v-76.38h-83.19z"/><path d="m328.46 183.2c-3.66 2.88-7.06 3.92-11.51 3.92h-52.84v-171.86c0-4.18-.26-6.54-2.62-11.25h60.69v3.66h-45.52v76.64h45.52v3.66h-45.52v95.48h39.24c3.92 0 7.32-1.05 10.46-3.14z"/><path d="m494.56 35.41c-15.7-18.05-34.01-29.82-62.52-29.82-51.79 0-79.52 42.64-79.52 89.98 0 47.35 27.73 89.98 79.52 89.98 24.33 0 46.82-9.16 65.66-27.73l2.88 2.88c-19.36 19.88-44.21 28.51-68.53 28.51-51.79 0-93.12-41.85-93.12-93.65s41.33-93.65 93.12-93.65c31.13 0 51.01 9.94 69.06 27.21z"/><path d="m592.13 175.87c2.09 3.92 3.92 6.54 7.59 11.25h-17.53c-.26-4.71-1.57-7.06-3.66-11.25l-38.71-76.91-5.23 8.89v79.26h-12.55v-171.85c0-4.18-.26-6.54-2.62-11.25h15.17v96.26l56.24-96.26h4.45l-48.13 82.4z"/><path d="m619.87 97.4v-3.66h30.68v3.66z"/><path d="m688.64 175.87c0 4.19.26 6.54 2.62 11.25h-17.79c2.35-4.71 2.62-7.06 2.62-11.25v-160.61c0-4.18-.26-6.54-2.62-11.25h17.79c-2.35 4.71-2.62 7.06-2.62 11.25z"/><path d="m787 182.41c.26.52.78.52.78 0v-178.39h3.66v176.57c0 4.97-3.4 7.59-8.63 7.59-4.97 0-7.85-2.62-9.42-7.85l-49.17-171.34c0-.52-.52-.52-.52 0v178.14h-3.66v-171.87c0-4.18-.26-6.54-2.62-11.25h11.51c4.45 0 7.85 3.66 9.16 8.11z"/></g></svg>
        
        <!-- Tabellone aeroporto vintage -->
        <div class="departure-board">
            <div class="board-header">
                <span class="board-icon">✈</span>
                <span>IMBARCHI</span>
                <span class="board-icon">✈</span>
            </div>
            
            <!-- Voli fittizi superiori (sfocati) -->
            <div class="board-row blurred">
                <span class="board-flight">AZ 1247</span>
                <span class="board-destination">LONDRA HEATHROW</span>
                <span class="board-time">14:35</span>
                <span class="board-gate">GATE 12</span>
                <span class="board-status status-boarding">IMBARCO</span>
            </div>
            <div class="board-row blurred">
                <span class="board-flight">AF 9823</span>
                <span class="board-destination">PARIGI CDG</span>
                <span class="board-time">15:10</span>
                <span class="board-gate">GATE 8</span>
                <span class="board-status status-ontime">IN ORARIO</span>
            </div>
            
            <!-- Scritta centrale principale -->
            <div class="board-text main-message">
                <div class="flip-letter" data-letter="C" data-flips="X,K,E,C,7,C">C</div>
                <div class="flip-letter" data-letter="H" data-flips="A,N,3,H,I,H">H</div>
                <div class="flip-letter" data-letter="E" data-flips="U,O,8,E,O,E">E</div>
                <div class="flip-letter" data-letter="C" data-flips="L,G,9,C,B,C">C</div>
                <div class="flip-letter" data-letter="K" data-flips="T,R,2,K,S,K">K</div>
                <div class="flip-letter" data-letter="-" data-flips="-,-,-,-,-,-">-</div>
                <div class="flip-letter" data-letter="I" data-flips="A,L,6,I,J,I">I</div>
                <div class="flip-letter" data-letter="N" data-flips="M,L,1,N,K,N">N</div>
                <div class="flip-letter-space"></div>
                <br class="mobile-break">
                <div class="flip-letter" data-letter="I" data-flips="L,J,9,I,O,I">I</div>
                <div class="flip-letter" data-letter="N" data-flips="M,K,7,N,Q,N">N</div>
                <div class="flip-letter-space"></div>
                <div class="flip-letter" data-letter="C" data-flips="B,D,7,C,Q,C">C</div>
                <div class="flip-letter" data-letter="O" data-flips="Q,U,3,O,E,O">O</div>
                <div class="flip-letter" data-letter="R" data-flips="S,T,8,R,N,R">R</div>
                <div class="flip-letter" data-letter="S" data-flips="V,W,2,S,Y,S">S</div>
                <div class="flip-letter" data-letter="O" data-flips="P,E,6,O,U,O">O</div>
                <div class="flip-letter dots" data-letter="." data-flips=".,.,.,.,.,.">.</div>
                <div class="flip-letter dots" data-letter="." data-flips=".,.,.,.,.,.">.</div>
                <div class="flip-letter dots" data-letter="." data-flips=".,.,.,.,.,.">.</div>
            </div>
            
            <!-- Voli fittizi inferiori (sfocati) -->
            <div class="board-row blurred">
                <span class="board-flight">BA 2891</span>
                <span class="board-destination">NEW YORK JFK</span>
                <span class="board-time">16:20</span>
                <span class="board-gate">GATE 23</span>
                <span class="board-status status-delayed">RITARDO</span>
            </div>
            <div class="board-row blurred">
                <span class="board-flight">IB 5634</span>
                <span class="board-destination">MADRID BARAJAS</span>
                <span class="board-time">16:55</span>
                <span class="board-gate">GATE 15</span>
                <span class="board-status status-boarding">IMBARCO</span>
            </div>
        </div>
        
        <div class="loading-progress">
            <div class="flight-path">
                <svg class="flight-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                </svg>
                <div class="flight-trail"></div>
            </div>
        </div>
    </div>
    ` : ''}
    <!-- Generated by CHECK-IN CMS -->
    <div class="magazine-container" data-magazine-id="${magazine._id}" data-slug="${magazine.slug}">
        
${blocksHTML}
        
    </div>
    
    <!-- Script per Sommario Cover Block -->
    <script>
        // Hero background alternation
        function initHeroBackgrounds() {
            const backgrounds = document.querySelectorAll('.hero-bg');
            if (!backgrounds.length) return;
            
            let currentIndex = 0;
            
            setInterval(() => {
                backgrounds[currentIndex].classList.remove('active');
                currentIndex = (currentIndex + 1) % backgrounds.length;
                backgrounds[currentIndex].classList.add('active');
            }, 5000); // Cambia ogni 5 secondi
        }
        
        // Typewriter effect for hero subtitle
        function initTypewriter() {
            const subtitle = document.querySelector('.hero-subtitle');
            const description = document.querySelector('.hero-description');
            if (!subtitle) return;
            
            const text = subtitle.getAttribute('data-text') || subtitle.textContent.trim();
            subtitle.innerHTML = '';
            
            // Inizio subito a scrivere (senza aspettare loading)
            setTimeout(() => {
                subtitle.classList.add('typing');
                let charIndex = 0;
                
                function typeChar() {
                    if (charIndex < text.length) {
                        subtitle.textContent += text.charAt(charIndex);
                        charIndex++;
                        setTimeout(typeChar, 50); // 50ms per carattere
                    } else {
                        subtitle.classList.add('typed');
                        setTimeout(() => {
                            subtitle.classList.remove('typing');
                            subtitle.style.borderRight = 'none';
                            if (description) {
                                description.style.opacity = '1';
                            }
                        }, 1500);
                    }
                }
                typeChar();
            }, 500);
        }
        
        // Sommario toggle
        document.addEventListener('DOMContentLoaded', function() {
            // Inizializza alternanza sfondi hero
            initHeroBackgrounds();
            
            // Inizializza effetto typewriter
            initTypewriter();
            
            // Toggle dropdown sommario
            const toggleBtn = document.querySelector('.sommario-toggle-hero');
            const dropdown = document.querySelector('.hero-sommario-dropdown');
            const toggleLabel = document.querySelector('.sommario-toggle-label');
            
            if (toggleBtn && dropdown) {
                toggleBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    dropdown.classList.toggle('active');
                    toggleBtn.classList.toggle('active');
                    
                    // Nascondi/mostra la label
                    if (toggleLabel) {
                        if (dropdown.classList.contains('active')) {
                            toggleLabel.style.opacity = '0';
                        } else {
                            toggleLabel.style.opacity = '1';
                        }
                    }
                });
            }
            
            // Gestione sottomenu espandibili
            const itemsWithSubmenu = document.querySelectorAll('.sommario-item:has(.sommario-submenu)');
            
            itemsWithSubmenu.forEach(item => {
                const expandBtn = item.querySelector('.sommario-expand');
                const submenu = item.querySelector('.sommario-submenu');
                
                if (expandBtn && submenu) {
                    expandBtn.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        item.classList.toggle('expanded');
                    });
                }
            });
        });
    </script>
    
    ${showLoadingScreen ? `<!-- Loading Screen Script -->
    <script>
        ${loadingJS}
    </script>
    ` : ''}
    
    <!-- Parallasse Block Script -->
    <script>
        // Script dedicato per blocchi Parallasse
        document.addEventListener('DOMContentLoaded', function() {
            const cremonaSections = document.querySelectorAll('.cremona-scroll-section');
            
            cremonaSections.forEach(section => {
                const textBlocks = section.querySelectorAll('.cremona-text-block');
                const images = section.querySelectorAll('.cremona-img');
                
                if (textBlocks.length === 0 || images.length === 0) return;
                
                // Attiva il primo blocco e la prima immagine
                textBlocks[0].classList.add('active');
                images[0].classList.add('active');
                
                // Observer per rilevare quando i blocchi di testo entrano in viewport
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const block = entry.target;
                            const imageIndex = parseInt(block.getAttribute('data-image'));
                            
                            // Attiva il blocco di testo
                            textBlocks.forEach(b => b.classList.remove('active'));
                            block.classList.add('active');
                            
                            // Cambia l'immagine corrispondente
                            if (imageIndex >= 0 && imageIndex < images.length) {
                                images.forEach(img => img.classList.remove('active'));
                                images[imageIndex].classList.add('active');
                            }
                        }
                    });
                }, {
                    threshold: 0.5,
                    rootMargin: '-20% 0px -20% 0px'
                });
                
                // Osserva tutti i blocchi di testo
                textBlocks.forEach(block => observer.observe(block));
            });
        });
    </script>
</body>
</html>`;
        
        // Crea la cartella preview se non esiste
        const previewDir = path.join(__dirname, 'preview');
        try {
            await fs.mkdir(previewDir, { recursive: true });
        } catch (err) {
            // Directory già esistente, ignora
        }
        
        // Salva il file di anteprima
        const previewFileName = `${magazine._id}.html`;
        const previewPath = path.join(previewDir, previewFileName);
        await fs.writeFile(previewPath, fullHTML, 'utf8');
        
        // URL di anteprima (usa l'host corrente del server)
        const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
        const previewUrl = `${baseUrl}/preview/${previewFileName}`;
        
        res.json({
            success: true,
            previewUrl: previewUrl,
            message: 'Anteprima generata con successo',
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
            // Gallery Story Block - Blocco con stats, quote, features e gallery immagini
            const galleryImages = block.galleryImages || [];
            const stats = block.stats || [];
            const features = block.features || [];
            const quote = block.quote || {};
            
            // Genera ID univoco per i controlli immagini
            const storyId = `story-${block._id}`;
            
            return `
    <!-- Gallery Story Block -->
    <section class="story-section${block.style?.backgroundColor === 'dark' ? ' dark' : ''}" id="${storyId}">
        <div class="story-container">
            <!-- COLONNA SINISTRA: TESTO FISSO -->
            <div class="story-text">
                ${block.tag ? `<span class="category-tag">${block.tag}</span>` : ''}
                ${block.title ? `<h2>${block.title}</h2>` : ''}
                ${block.intro ? `<p class="lead-text">${block.intro}</p>` : ''}
                
                ${block.showStats && stats.length > 0 ? `
                <div class="story-details">
                    ${stats.map(stat => `
                    <div class="detail-item">
                        <strong>${stat.number || ''}</strong>
                        <span>${stat.label || ''}</span>
                    </div>
                    `).join('')}
                </div>
                ` : ''}
                
                ${block.showQuote && quote.text ? `
                <blockquote>
                    "${quote.text}"
                    ${quote.author ? `<cite>— ${quote.author}</cite>` : ''}
                </blockquote>
                ` : ''}
                
                ${block.showFeatures && features.length > 0 ? `
                <ul class="features-list">
                    ${features.map(feature => `
                    <li>✓ ${feature}</li>
                    `).join('')}
                </ul>
                ` : ''}
                
                ${block.ctaText && block.ctaLink ? `
                <a href="${block.ctaLink}" class="btn-primary">${block.ctaText} →</a>
                ` : ''}
            </div>
            
            <!-- COLONNA DESTRA: IMMAGINI CHE SCORRONO -->
            <div class="story-images">
                <div class="image-scroll-wrapper" data-story="${block._id}">
                    ${galleryImages.map((img, idx) => {
                        // Applica cropData se presente
                        let imageStyle = '';
                        if (img.cropData) {
                            const crop = img.cropData;
                            imageStyle = `style="object-position: ${crop.x}% ${crop.y}%; width: ${crop.width}%; height: ${crop.height}%;"`;
                        }
                        return `
                    <div class="scroll-image">
                        <img src="${img.url || ''}" 
                             alt="${img.caption || `Image ${idx + 1}`}"
                             ${imageStyle}
                             onerror="this.style.display='none'">
                        ${img.caption ? `<div class="image-caption">${img.caption}</div>` : ''}
                    </div>
                        `;
                    }).join('')}
                </div>
                
                ${galleryImages.length > 1 ? `
                <!-- Controlli immagini -->
                <div class="image-controls">
                    <button class="control-btn prev-btn" data-story="${block._id}">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </button>
                    <div class="image-dots" data-story="${block._id}">
                        ${galleryImages.map((_, idx) => `
                        <span class="dot ${idx === 0 ? 'active' : ''}" data-index="${idx}"></span>
                        `).join('')}
                    </div>
                    <button class="control-btn next-btn" data-story="${block._id}">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </button>
                </div>
                ` : ''}
            </div>
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
        
        case 'fluid':
            // Parallasse Block - Scroll parallax con immagini che cambiano
            const fluidBlocks = block.fluidBlocks || [];
            // Crea array di immagini: previewImage come prima, poi le immagini dei blocchi
            const fluidBlockImages = fluidBlocks.map(fb => fb.image).filter(Boolean);
            const fluidImages = block.previewImage 
                ? [block.previewImage, ...fluidBlockImages]
                : fluidBlockImages;
            
            return `
    <!-- Parallasse Block (Cremona Style) -->
    <section class="cremona-scroll-section" id="fluid-${block._id}">
        <div class="cremona-container">
            <!-- TESTO SCROLLABILE A SINISTRA -->
            <div class="cremona-text-scroll">
                <!-- Primo blocco con tag e titolo principale -->
                <div class="cremona-text-block" data-image="0">
                    ${block.tag ? `<span class="cremona-tag">${block.tag}</span>` : ''}
                    ${block.title ? `<h2 class="cremona-title">${block.title}</h2>` : ''}
                    ${block.intro ? `<p class="cremona-intro">${block.intro}</p>` : ''}
                </div>

                ${fluidBlocks.map((fb, idx) => `
                <div class="cremona-text-block" data-image="${idx + 1}">
                    ${fb.heading ? `<h3>${fb.heading}</h3>` : ''}
                    ${fb.text ? `<p>${fb.text}</p>` : ''}
                    ${fb.highlight ? `<p class="cremona-highlight">${fb.highlight}</p>` : ''}
                </div>
                `).join('')}

                ${block.ctaText && block.ctaLink ? `
                <div class="cremona-text-block" data-image="0">
                    <a href="${block.ctaLink}" class="cremona-cta" target="_blank">
                        ${block.ctaText}
                    </a>
                </div>
                ` : ''}
            </div>

            <!-- IMMAGINI FISSE A DESTRA -->
            <div class="cremona-images-sticky">
                <div class="cremona-image-wrapper">
                    ${fluidImages.map((img, idx) => `
                    <img src="${img}" 
                         alt="${block.title || 'Image'} ${idx + 1}"
                         class="cremona-img ${idx === 0 ? 'active' : ''}"
                         data-index="${idx}">
                    `).join('')}
                </div>
            </div>
        </div>
    </section>`;
        
        case 'cover':
            // Blocco copertina stile CHECK-IN con background multipli e dropdown sommario
            const backgrounds = block.images || [];
            const sommarioItems = block.settings?.sommario || [];
            
            return `
    <!-- Cover Block (Hero con Sommario) -->
    <section class="hero-simple" id="hero">
        <!-- TOGGLE FRECCIA CON LABEL -->
        <div class="sommario-toggle-wrapper">
            <span class="sommario-toggle-label">In questo numero</span>
            <button class="sommario-toggle-hero" aria-label="Mostra/Nascondi sommario">
                <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </button>
        </div>
        
        <!-- DROPDOWN SOMMARIO CHE SCENDE DALL'ALTO -->
        <div class="hero-sommario-dropdown">
            <div class="sommario-dropdown-content">
                <h3>In questo numero</h3>
                ${sommarioItems.length > 0 ? `
                <ul class="sommario-list">
                    ${sommarioItems.map(item => `
                    <li class="sommario-item">
                        <a href="${item.link || '#'}" class="sommario-link">
                            <span class="sommario-text">${item.text || ''}</span>
                        </a>
                    </li>`).join('')}
                </ul>
                ` : `
                <p style="color: rgba(255,255,255,0.5); text-align: center; padding: 20px;">
                    📝 Nessuna voce nel sommario.<br>
                    Aggiungi le voci quando modifichi il blocco!
                </p>
                `}
            </div>
        </div>
        
        <div class="hero-backgrounds">
            ${backgrounds.map((bg, idx) => `
            <div class="hero-bg ${idx === 0 ? 'active' : ''}" style="background-image: url('${bg}')"></div>`).join('')}
        </div>
        <div class="hero-container">
            ${block.title ? `<h1>${block.title}</h1>` : ''}
            ${block.subtitle ? `<p class="hero-subtitle" data-text="${block.subtitle}">${block.subtitle}</p>` : ''}
            ${block.content ? `
            <p class="hero-description">
                ${block.content}
            </p>` : ''}
            <div class="scroll-indicator">
                <span>Scorri per esplorare</span>
                <div class="scroll-arrow">↓</div>
            </div>
        </div>
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
    <link rel="stylesheet" href="assets/css/cremona-scroll.css">
    <link rel="stylesheet" href="assets/css/magazine-generated.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
</head>
<body>
    <!-- Generated by CHECK-IN CMS on ${new Date().toISOString()} -->
    <!-- Magazine: ${magazine.name} (${magazine.slug}) -->
    <div class="magazine-container" data-magazine-id="${magazine._id}" data-slug="${magazine.slug}">
        
${blocksHTML}
        
    </div>
    
    <!-- Scripts -->
    <script src="assets/js/main.js"></script>
    <script src="assets/js/cremona-scroll.js"></script>
    
    <!-- Script aggiuntivo per Sommario Cover Block -->
    <script>
        // Override/integrazione per blocco cover se main.js non lo gestisce già
        document.addEventListener('DOMContentLoaded', function() {
            // Toggle dropdown sommario
            const toggleBtn = document.querySelector('.sommario-toggle-hero');
            const dropdown = document.querySelector('.hero-sommario-dropdown');
            const toggleLabel = document.querySelector('.sommario-toggle-label');
            
            if (toggleBtn && dropdown) {
                toggleBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    dropdown.classList.toggle('active');
                    toggleBtn.classList.toggle('active');
                    
                    // Nascondi/mostra la label
                    if (toggleLabel) {
                        if (dropdown.classList.contains('active')) {
                            toggleLabel.style.opacity = '0';
                        } else {
                            toggleLabel.style.opacity = '1';
                        }
                    }
                });
            }
            
            // Gestione sottomenu espandibili
            const itemsWithSubmenu = document.querySelectorAll('.sommario-item:has(.sommario-submenu)');
            
            itemsWithSubmenu.forEach(item => {
                const expandBtn = item.querySelector('.sommario-expand');
                const submenu = item.querySelector('.sommario-submenu');
                
                if (expandBtn && submenu) {
                    expandBtn.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        item.classList.toggle('expanded');
                    });
                }
            });
        });
    </script>
</body>
</html>`;
        
        // Salva il file nella directory pubblica con il nome dello slug
        const fileName = `${magazine.slug}.html`;
        const publicPath = path.join(__dirname, '../../', fileName);
        await fs.writeFile(publicPath, fullHTML, 'utf8');
        
        // Aggiorna lo stato della rivista
        magazine.status = 'published';
        magazine.publishDate = new Date();
        await magazine.save();
        
        // Aggiorna l'index.html con la lista delle riviste
        await updateIndexPage();
        
        res.json({
            success: true,
            message: 'Rivista pubblicata con successo!',
            path: publicPath,
            fileName: fileName,
            url: `https://rivista-checkin.vercel.app/${fileName}`,
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

// Funzione per aggiornare index.html con lista riviste
async function updateIndexPage() {
    try {
        const magazines = await Magazine.find({ 
            status: 'published' 
        })
        .select('name slug edition editionNumber metaTitle metaDescription coverImage publishDate views featured')
        .sort({ publishDate: -1 });
        
        const magazineCards = magazines.map(mag => `
            <div class="magazine-card">
                <a href="${mag.slug}.html" class="magazine-link">
                    ${mag.coverImage ? `
                        <div class="magazine-cover">
                            <img src="${mag.coverImage}" alt="${mag.name}">
                        </div>
                    ` : `
                        <div class="magazine-cover-placeholder">
                            <span class="magazine-icon">📖</span>
                        </div>
                    `}
                    <div class="magazine-info">
                        <h3 class="magazine-name">${mag.name}</h3>
                        <p class="magazine-edition">Edizione ${mag.editionNumber} • ${mag.edition}</p>
                        ${mag.metaDescription ? `<p class="magazine-description">${mag.metaDescription}</p>` : ''}
                        <div class="magazine-meta">
                            <span>📅 ${new Date(mag.publishDate).toLocaleDateString('it-IT')}</span>
                            <span>👁️ ${mag.views || 0} visite</span>
                        </div>
                    </div>
                </a>
            </div>
        `).join('');
        
        const indexHTML = `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CHECK-IN | Rivista del Viaggio - Tutte le Edizioni</title>
    <meta name="description" content="Scopri tutte le edizioni della rivista CHECK-IN: viaggi, ospitalità, enogastronomia e cultura italiana.">
    
    <!-- Open Graph -->
    <meta property="og:title" content="CHECK-IN | Rivista del Viaggio">
    <meta property="og:description" content="Scopri tutte le edizioni della rivista CHECK-IN">
    <meta property="og:type" content="website">
    
    <!-- Styles -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    
    <style>
        :root {
            --brand-primary: #3C3D8F;
            --brand-secondary: #D3E4FC;
            --text-dark: #1f2937;
            --text-light: #6b7280;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: #fafbfc;
            color: var(--text-dark);
            line-height: 1.6;
        }
        
        .header {
            background: linear-gradient(135deg, var(--brand-primary) 0%, #2A2B5F 100%);
            color: white;
            padding: 80px 20px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 64px;
            font-weight: 800;
            margin-bottom: 16px;
            letter-spacing: -0.02em;
        }
        
        .header p {
            font-size: 24px;
            opacity: 0.9;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 80px 20px;
        }
        
        .section-title {
            font-size: 42px;
            font-weight: 700;
            color: var(--brand-primary);
            margin-bottom: 48px;
            text-align: center;
        }
        
        .magazines-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 32px;
        }
        
        .magazine-card {
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            transition: all 0.3s ease;
        }
        
        .magazine-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 12px 24px rgba(60, 61, 143, 0.15);
        }
        
        .magazine-link {
            text-decoration: none;
            color: inherit;
            display: block;
        }
        
        .magazine-cover,
        .magazine-cover-placeholder {
            width: 100%;
            height: 250px;
            overflow: hidden;
        }
        
        .magazine-cover img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .magazine-cover-placeholder {
            background: linear-gradient(135deg, var(--brand-secondary) 0%, #E8F1FD 100%);
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .magazine-icon {
            font-size: 80px;
        }
        
        .magazine-info {
            padding: 24px;
        }
        
        .magazine-name {
            font-size: 24px;
            font-weight: 700;
            color: var(--brand-primary);
            margin-bottom: 8px;
        }
        
        .magazine-edition {
            font-size: 14px;
            color: var(--text-light);
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 12px;
        }
        
        .magazine-description {
            font-size: 15px;
            color: var(--text-dark);
            line-height: 1.6;
            margin-bottom: 16px;
        }
        
        .magazine-meta {
            display: flex;
            gap: 16px;
            font-size: 13px;
            color: var(--text-light);
        }
        
        .footer {
            background: var(--brand-primary);
            color: white;
            padding: 40px 20px;
            text-align: center;
        }
        
        @media (max-width: 768px) {
            .header h1 {
                font-size: 42px;
            }
            
            .header p {
                font-size: 18px;
            }
            
            .magazines-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <!-- Auto-generated by CHECK-IN CMS on ${new Date().toISOString()} -->
    
    <header class="header">
        <h1>CHECK-IN</h1>
        <p>La Rivista del Viaggio</p>
    </header>
    
    <main class="container">
        <h2 class="section-title">Tutte le Edizioni</h2>
        
        <div class="magazines-grid">
            ${magazineCards || '<p style="text-align: center; color: var(--text-light);">Nessuna rivista pubblicata</p>'}
        </div>
    </main>
    
    <footer class="footer">
        <p>&copy; ${new Date().getFullYear()} CHECK-IN Magazine. All rights reserved.</p>
        <p style="margin-top: 8px; opacity: 0.8; font-size: 14px;">Powered by CHECK-IN CMS</p>
    </footer>
</body>
</html>`;
        
        const indexPath = path.join(__dirname, '../../index.html');
        await fs.writeFile(indexPath, indexHTML, 'utf8');
        
        console.log('✅ Index.html aggiornato con', magazines.length, 'riviste');
    } catch (error) {
        console.error('❌ Errore aggiornamento index.html:', error);
    }
}

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
