// routes/commandeRoutes.js
const express = require('express');
const router = express.Router();
const { CommandeController, uploadImages } = require('../controllers/commandeController');

// Commandes du jour
router.get('/today', CommandeController.getToday);
router.get('/week', CommandeController.getWeek);

// GET /api/commandes/stats/dashboard - Statistiques complètes du dashboard
router.get('/stats/dashboard', CommandeController.getDashboardStats);

// GET /api/commandes/stats - Statistiques générales
router.get('/stats', CommandeController.getStats);

/**
 * ROUTES CRUD PRINCIPALES
 */

// GET /api/commandes - Récupérer toutes les commandes avec pagination et filtres
// Query params: ?page=1&limit=10&status=livree&wilaya=Alger
router.get('/', CommandeController.getAll);

// GET /api/commandes/:id - Récupérer une commande par ID
router.get('/:id', CommandeController.getById);

// POST /api/commandes - Créer une nouvelle commande avec images
// Utilise multer pour gérer l'upload de fichiers (max 10 images)
router.post('/', uploadImages, CommandeController.create);

// PUT /api/commandes/:id - Mettre à jour une commande
// Peut inclure de nouvelles images
router.put('/:id', uploadImages, CommandeController.update);

// DELETE /api/commandes/:id - Supprimer une commande
router.delete('/:id', CommandeController.delete);

/**
 * ROUTES POUR LES IMAGES
 */

// DELETE /api/commandes/images/:imageId - Supprimer une image spécifique
router.delete('/images/:imageId', CommandeController.deleteImage);

module.exports = router;