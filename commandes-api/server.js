// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const commandeRoutes = require('./routes/commandeRoutes');
const userRoutes = require('./routes/userRoutes');




const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir les fichiers statiques (images uploadées)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes API
app.use('/api/commandes', commandeRoutes);

app.use('/api/users', userRoutes);

// Route de santé
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'API Commandes opérationnelle',
        timestamp: new Date().toISOString()
    });
});

// Gestion des routes non trouvées ✅
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route non trouvée'
    });
});

// Gestionnaire d'erreurs global
app.use((error, req, res, next) => {
    console.error('Erreur serveur:', error);
    res.status(500).json({
        success: false,
        message: 'Erreur serveur interne',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Une erreur est survenue'
    });
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`🚀 Serveur API démarré sur le port ${PORT}`);
    console.log(`📝 Documentation API: http://localhost:${PORT}/health`);
    console.log(`📁 Fichiers statiques: http://localhost:${PORT}/uploads/`);
});

module.exports = app;
