// models/User.js
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'literie_de_luxe'
};

class User {
    static async createConnection() {
        return await mysql.createConnection(dbConfig);
    }

    // Créer un utilisateur (hash du password)
    static async create(userData) {
        const connection = await this.createConnection();
        try {
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            const [result] = await connection.execute(
                `INSERT INTO users (username, password, type) VALUES (?, ?, ?)`,
                [userData.username, hashedPassword, userData.type]
            );
            return { id: result.insertId, username: userData.username, type: userData.type };
        } finally {
            await connection.end();
        }
    }

    // Récupérer tous les users
    static async findAll() {
        const connection = await this.createConnection();
        try {
            const [rows] = await connection.execute(`SELECT * FROM users`);
            return rows;
        } finally {
            await connection.end();
        }
    }

    // Récupérer par ID
    static async findById(id) {
        const connection = await this.createConnection();
        try {
            const [rows] = await connection.execute(`SELECT * FROM users WHERE id = ?`, [id]);
            return rows.length > 0 ? rows[0] : null;
        } finally {
            await connection.end();
        }
    }

    // Récupérer par username
    static async findByUsername(username) {
        const connection = await this.createConnection();
        try {
            const [rows] = await connection.execute(`SELECT * FROM users WHERE username = ?`, [username]);
            return rows.length > 0 ? rows[0] : null;
        } finally {
            await connection.end();
        }
    }

    // Mettre à jour un utilisateur
    static async update(id, userData) {
        const connection = await this.createConnection();
        try {
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            await connection.execute(
                `UPDATE users SET username=?, password=?, type=? WHERE id=?`,
                [userData.username, hashedPassword, userData.type, id]
            );
            return await this.findById(id);
        } finally {
            await connection.end();
        }
    }

    // Supprimer
    static async delete(id) {
        const connection = await this.createConnection();
        try {
            const [result] = await connection.execute(`DELETE FROM users WHERE id = ?`, [id]);
            return result.affectedRows > 0;
        } finally {
            await connection.end();
        }
    }
}

module.exports = User;
