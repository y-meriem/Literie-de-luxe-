// controllers/commandeController.js
const Commande = require('../models/Commande');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configuration multer pour upload d'images
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = 'uploads/commandes';
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Type de fichier non autorisé. Seuls JPG, PNG et GIF sont acceptés.'));
        }
    }
});

class CommandeController {
    // GET /api/commandes - Récupérer toutes les commandes
   // controllers/commandeController.js

static async getAll(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const filters = {
            status: req.query.status,
            wilaya: req.query.wilaya,
            month: req.query.month  // ✓ Déjà présent
        };

        console.log('Filters reçus:', filters); // Debug

        const commandes = await Commande.findAll(page, limit, filters);
        
        res.json({
            success: true,
            data: commandes,
            pagination: {
                page,
                limit,
                total: commandes.length
            }
        });
    } catch (error) {
        console.error('Erreur getAll:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            error: error.message
        });
    }
}

    // GET /api/commandes/:id - Récupérer une commande par ID
    static async getById(req, res) {
        try {
            const { id } = req.params;
            const commande = await Commande.findById(id);
            
            if (!commande) {
                return res.status(404).json({
                    success: false,
                    message: 'Commande non trouvée'
                });
            }

            res.json({
                success: true,
                data: commande
            });
        } catch (error) {
            console.error('Erreur lors de la récupération de la commande:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur serveur lors de la récupération de la commande',
                error: error.message
            });
        }
    }

    // POST /api/commandes - Créer une nouvelle commande
    static async create(req, res) {
        try {
            const commandeData = req.body;
            
            // Validation des données requises
            const requiredFields = ['nom', 'prenom', 'wilaya', 'total', 'quantite'];
            for (const field of requiredFields) {
                if (!commandeData[field]) {
                    return res.status(400).json({
                        success: false,
                        message: `Le champ ${field} est requis`
                    });
                }
            }

            // Traiter les images uploadées
            const images = [];
            if (req.files && req.files.length > 0) {
                for (const file of req.files) {
                    images.push({
                        url: `/uploads/commandes/${file.filename}`,
                        name: file.originalname
                    });
                }
            }

            const nouvelleCommande = await Commande.create(commandeData, images);
            
            res.status(201).json({
                success: true,
                message: 'Commande créée avec succès',
                data: nouvelleCommande
            });
        } catch (error) {
            console.error('Erreur lors de la création de la commande:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur serveur lors de la création de la commande',
                error: error.message
            });
        }
    }

    // PUT /api/commandes/:id - Mettre à jour une commande
    static async update(req, res) {
        try {
            const { id } = req.params;
            const commandeData = req.body;

            // Vérifier si la commande existe
            const existingCommande = await Commande.findById(id);
            if (!existingCommande) {
                return res.status(404).json({
                    success: false,
                    message: 'Commande non trouvée'
                });
            }

            // Traiter les nouvelles images uploadées
            const newImages = [];
            if (req.files && req.files.length > 0) {
                for (const file of req.files) {
                    newImages.push({
                        url: `/uploads/commandes/${file.filename}`,
                        name: file.originalname
                    });
                }
            }

            const commandeMiseAJour = await Commande.update(id, commandeData, newImages);
            
            res.json({
                success: true,
                message: 'Commande mise à jour avec succès',
                data: commandeMiseAJour
            });
        } catch (error) {
            console.error('Erreur lors de la mise à jour de la commande:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur serveur lors de la mise à jour de la commande',
                error: error.message
            });
        }
    }

    // DELETE /api/commandes/:id - Supprimer une commande
    static async delete(req, res) {
        try {
            const { id } = req.params;

            // Récupérer la commande pour obtenir les images à supprimer
            const commande = await Commande.findById(id);
            if (!commande) {
                return res.status(404).json({
                    success: false,
                    message: 'Commande non trouvée'
                });
            }

            // Supprimer les fichiers images du serveur
            if (commande.images && commande.images.length > 0) {
                for (const image of commande.images) {
                    try {
                        const imagePath = path.join(__dirname, '..', image.image_url);
                        await fs.unlink(imagePath);
                    } catch (error) {
                        console.error('Erreur lors de la suppression du fichier:', error);
                    }
                }
            }

            const success = await Commande.delete(id);
            
            if (success) {
                res.json({
                    success: true,
                    message: 'Commande supprimée avec succès'
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: 'Commande non trouvée'
                });
            }
        } catch (error) {
            console.error('Erreur lors de la suppression de la commande:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur serveur lors de la suppression de la commande',
                error: error.message
            });
        }
    }

    // DELETE /api/commandes/images/:imageId - Supprimer une image spécifique
    static async deleteImage(req, res) {
        try {
            const { imageId } = req.params;
            const success = await Commande.deleteImage(imageId);
            
            if (success) {
                res.json({
                    success: true,
                    message: 'Image supprimée avec succès'
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: 'Image non trouvée'
                });
            }
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'image:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur serveur lors de la suppression de l\'image',
                error: error.message
            });
        }
    }

    static async getDashboardStats(req, res) {
        try {
            // Stats du mois en cours
            const currentMonth = await Commande.getCurrentMonthStats();
            
            // Stats mensuelles (6 derniers mois)
            const monthlyStats = await Commande.getMonthlyStats();
            
            // Stats par wilaya
            const wilayaStats = await Commande.getStatsByWilaya();
            
            res.json({
                success: true,
                currentMonth,
                monthlyStats,
                wilayaStats
            });
        } catch (error) {
            console.error('Erreur dashboard stats:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur serveur',
                error: error.message
            });
        }
    }

    // GET /api/commandes/stats - Récupérer les statistiques générales
    static async getStats(req, res) {
        try {
            const stats = await Commande.getStats();
            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Erreur lors de la récupération des statistiques:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur serveur lors de la récupération des statistiques',
                error: error.message
            });
        }
    }
// GET /api/commandes/today - Récupérer les commandes du jour
static async getToday(req, res) {
    try {
        const commandes = await Commande.findToday();

        res.json({
            success: true,
            data: commandes
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des commandes du jour:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la récupération des commandes du jour',
            error: error.message
        });
    }
}

    // GET /api/commandes/week
static async getWeek(req, res) {
    try {
        const commandes = await Commande.findWeek();
        res.json({ success: true, data: commandes });
    } catch (error) {
        res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
    }
}



}

// Export du middleware multer et du contrôleur
module.exports = {
    CommandeController,
    uploadImages: upload.array('images', 10) // Max 10 images
};