// Script per aggiornare utente esistente con username e super-admin
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    name: String,
    role: String,
    lastLogin: Date,
    isActive: Boolean
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function updateUser() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connesso');

        // Trova QUALSIASI utente
        const user = await User.findOne({});

        if (!user) {
            console.log('❌ Nessun utente trovato nel database');
            process.exit(1);
        }

        console.log('📝 Utente trovato:', user.email || user.name);

        // Hash nuova password
        const hashedPassword = await bcrypt.hash('Admin123!', 10);

        // Aggiorna con username e super-admin
        user.username = 'alessandro';
        user.email = 'admin@check-in.it';
        user.password = hashedPassword;
        user.role = 'super-admin';
        user.isActive = true;

        await user.save();

        console.log('✅ Utente aggiornato con successo!');
        console.log('   - Username:', user.username);
        console.log('   - Email:', user.email);
        console.log('   - Nome:', user.name);
        console.log('   - Ruolo:', user.role);
        console.log('\n🎉 Ora puoi fare login con:');
        console.log('   Username: alessandro');
        console.log('   Password: Admin123!');

        mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Errore:', error);
        process.exit(1);
    }
}

updateUser();
