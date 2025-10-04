// models/Commande.js
const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'literie_de_luxe'
};

class Commande {
    static async createConnection() {
        return await mysql.createConnection(dbConfig);
    }

    // Créer une nouvelle commande
    static async create(commandeData, images = []) {
        const connection = await this.createConnection();
        
        try {
            await connection.beginTransaction();

            const [result] = await connection.execute(
                `INSERT INTO commandes (nom, prenom, wilaya, total, quantite, description, obs, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    commandeData.nom,
                    commandeData.prenom,
                    commandeData.wilaya,
                    commandeData.total,
                    commandeData.quantite,
                    commandeData.description || null,
                    commandeData.obs || null,
                    commandeData.status || 'confirmee'
                ]
            );

            const commandeId = result.insertId;

            if (images && images.length > 0) {
                for (const image of images) {
                    await connection.execute(
                        `INSERT INTO commande_images (commande_id, image_url, image_name) VALUES (?, ?, ?)`,
                        [commandeId, image.url, image.name]
                    );
                }
            }

            await connection.commit();
            return { id: commandeId, ...commandeData };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            await connection.end();
        }
    }

    // Récupérer toutes les commandes avec leurs images
  // models/Commande.js

static async findAll(page = 1, limit = 10, filters = {}) {
    const connection = await this.createConnection(); // ✅ on crée la connexion
    try {
        const offset = (page - 1) * limit;
        let query = `
            SELECT c.*, 
                   GROUP_CONCAT(
                       JSON_OBJECT(
                           'id', ci.id,
                           'url', ci.image_url,
                           'name', ci.image_name
                       )
                   ) as images
            FROM commandes c
            LEFT JOIN commande_images ci ON c.id = ci.commande_id
            WHERE 1=1
        `;
        
        const params = [];

        // Filtre par statut
        if (filters.status) {
            query += ' AND c.status = ?';
            params.push(filters.status);
        }

        // Filtre par wilaya
        if (filters.wilaya) {
            query += ' AND c.wilaya = ?';
            params.push(filters.wilaya);
        }

        // Filtre par mois (YYYY-MM)
        if (filters.month) {
            query += ' AND DATE_FORMAT(c.created_at, "%Y-%m") = ?';
            params.push(filters.month);
        }

        query += ' GROUP BY c.id ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const [rows] = await connection.query(query, params); // ✅ on utilise connection

        return rows.map(row => ({
            ...row,
            images: row.images ? JSON.parse(`[${row.images}]`) : []
        }));
    } catch (error) {
        console.error('Erreur findAll:', error);
        throw error;
    } finally {
        await connection.end(); // ✅ on ferme proprement
    }
}


    // Récupérer une commande par ID
    static async findById(id) {
        const connection = await this.createConnection();
        
        try {
            const [rows] = await connection.execute(
                'SELECT * FROM commandes WHERE id = ?',
                [id]
            );

            if (rows.length === 0) return null;

            const commande = rows[0];

            const [images] = await connection.execute(
                'SELECT * FROM commande_images WHERE commande_id = ?',
                [id]
            );

            commande.images = images;
            return commande;
        } finally {
            await connection.end();
        }
    }

    // Mettre à jour une commande
    static async update(id, commandeData, newImages = []) {
        const connection = await this.createConnection();
        
        try {
            await connection.beginTransaction();

            await connection.execute(
                `UPDATE commandes SET nom=?, prenom=?, wilaya=?, total=?, quantite=?, 
                 description=?, obs=?, status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
                [
                    commandeData.nom,
                    commandeData.prenom,
                    commandeData.wilaya,
                    commandeData.total,
                    commandeData.quantite,
                    commandeData.description || null,
                    commandeData.obs || null,
                    commandeData.status,
                    id
                ]
            );

            if (newImages && newImages.length > 0) {
                for (const image of newImages) {
                    await connection.execute(
                        `INSERT INTO commande_images (commande_id, image_url, image_name) VALUES (?, ?, ?)`,
                        [id, image.url, image.name]
                    );
                }
            }

            await connection.commit();
            return await this.findById(id);
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            await connection.end();
        }
    }

    // Supprimer une commande
    static async delete(id) {
        const connection = await this.createConnection();
        
        try {
            const [result] = await connection.execute(
                'DELETE FROM commandes WHERE id = ?',
                [id]
            );
            return result.affectedRows > 0;
        } finally {
            await connection.end();
        }
    }

    // Supprimer une image
    static async deleteImage(imageId) {
        const connection = await this.createConnection();
        
        try {
            const [result] = await connection.execute(
                'DELETE FROM commande_images WHERE id = ?',
                [imageId]
            );
            return result.affectedRows > 0;
        } finally {
            await connection.end();
        }
    }

    // Statistiques générales
    static async getStats() {
        const connection = await this.createConnection();
        
        try {
            const [stats] = await connection.execute(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'confirmee' THEN 1 ELSE 0 END) as confirmee,
                    SUM(CASE WHEN status = 'livree' THEN 1 ELSE 0 END) as livree,
                    SUM(CASE WHEN status = 'annulee' THEN 1 ELSE 0 END) as annulee,
                    SUM(total) as chiffre_affaire
                FROM commandes
            `);
            
            return stats[0];
        } finally {
            await connection.end();
        }
    }

    // Stats du mois en cours
    static async getCurrentMonthStats() {
        const connection = await this.createConnection();
        
        try {
            const [rows] = await connection.execute(`
                SELECT 
                    COUNT(*) as total_mois,
                    SUM(CASE WHEN status != 'annulee' THEN 1 ELSE 0 END) as total_actif,
                    SUM(CASE WHEN status = 'livree' THEN 1 ELSE 0 END) as livrees,
                    SUM(CASE WHEN status = 'confirmee' THEN 1 ELSE 0 END) as confirmee,
                    SUM(CASE WHEN status = 'annulee' THEN 1 ELSE 0 END) as annulees,
                    SUM(CASE WHEN status = 'livree' THEN total ELSE 0 END) as chiffre_affaires
                FROM commandes
                WHERE MONTH(created_at) = MONTH(CURRENT_DATE())
                AND YEAR(created_at) = YEAR(CURRENT_DATE())
            `);
            
            return rows[0];
        } finally {
            await connection.end();
        }
    }

    // Stats mensuelles (6 derniers mois)
    static async getMonthlyStats() {
        const connection = await this.createConnection();
        
        try {
            const [rows] = await connection.execute(`
                SELECT 
                    DATE_FORMAT(created_at, '%Y-%m') as mois,
                    DATE_FORMAT(created_at, '%M %Y') as mois_label,
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'livree' THEN 1 ELSE 0 END) as livrees,
                    SUM(CASE WHEN status = 'annulee' THEN 1 ELSE 0 END) as annulees,
                    SUM(CASE WHEN status = 'confirmee' THEN 1 ELSE 0 END) as confirmee,
                    SUM(CASE WHEN status = 'livree' THEN total ELSE 0 END) as chiffre_affaires
                FROM commandes
                WHERE created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
                GROUP BY DATE_FORMAT(created_at, '%Y-%m'), DATE_FORMAT(created_at, '%M %Y')
                ORDER BY mois ASC
            `);
            
            return rows;
        } finally {
            await connection.end();
        }
    }

    // Stats par wilaya
    static async getStatsByWilaya() {
        const connection = await this.createConnection();
        
        try {
            const [rows] = await connection.execute(`
                SELECT 
                    wilaya,
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'livree' THEN 1 ELSE 0 END) as livrees,
                    SUM(CASE WHEN status = 'confirmee' THEN 1 ELSE 0 END) as confirmee,
                    SUM(CASE WHEN status = 'annulee' THEN 1 ELSE 0 END) as annulees,
                    SUM(CASE WHEN status = 'livree' THEN total ELSE 0 END) as chiffre_affaires
                FROM commandes
                GROUP BY wilaya
                ORDER BY livrees DESC
            `);
            
            return rows;
        } finally {
            await connection.end();
        }
    }
    // Récupérer les commandes du jour
static async findToday() {
    const connection = await this.createConnection();
    try {
        const [rows] = await connection.execute(
            `SELECT c.*, GROUP_CONCAT(CONCAT(ci.id, ':', ci.image_url, ':', ci.image_name) SEPARATOR '||') as images_data
             FROM commandes c
             LEFT JOIN commande_images ci ON c.id = ci.commande_id
             WHERE DATE(c.created_at) = CURDATE()
             GROUP BY c.id 
             ORDER BY c.created_at DESC`
        );

        const commandes = rows.map(row => {
            const commande = { ...row };
            if (row.images_data) {
                commande.images = row.images_data.split('||').map(img => {
                    const [id, url, name] = img.split(':');
                    return { id: parseInt(id), image_url: url, image_name: name };
                });
            } else {
                commande.images = [];
            }
            delete commande.images_data;
            return commande;
        });

        return commandes;
    } finally {
        await connection.end();
    }
}
// Récupérer les commandes de la semaine
static async findWeek() {
    const connection = await this.createConnection();
    try {
        const [rows] = await connection.execute(
            `SELECT c.*, GROUP_CONCAT(CONCAT(ci.id, ':', ci.image_url, ':', ci.image_name) SEPARATOR '||') as images_data
             FROM commandes c
             LEFT JOIN commande_images ci ON c.id = ci.commande_id
             WHERE YEARWEEK(c.created_at, 1) = YEARWEEK(CURDATE(), 1)
             GROUP BY c.id 
             ORDER BY c.created_at DESC`
        );

        return rows.map(row => {
            const commande = { ...row };
            if (row.images_data) {
                commande.images = row.images_data.split('||').map(img => {
                    const [id, url, name] = img.split(':');
                    return { id: parseInt(id), image_url: url, image_name: name };
                });
            } else {
                commande.images = [];
            }
            delete commande.images_data;
            return commande;
        });
    } finally {
        await connection.end();
    }
}


}

module.exports = Commande;