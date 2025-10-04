const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class UserController {
    static async getAll(req, res) {
        try {
            const users = await User.findAll();
            res.json({ success: true, data: users });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async getById(req, res) {
        try {
            const user = await User.findById(req.params.id);
            if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
            res.json({ success: true, data: user });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async create(req, res) {
        try {
            const newUser = await User.create(req.body);
            res.status(201).json({ success: true, data: newUser });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async update(req, res) {
        try {
            const updatedUser = await User.update(req.params.id, req.body);
            res.json({ success: true, data: updatedUser });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async delete(req, res) {
        try {
            const success = await User.delete(req.params.id);
            if (!success) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
            res.json({ success: true, message: 'Utilisateur supprimé' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async login(req, res) {
    try {
      const { username, password } = req.body;

      // Vérifier si l'utilisateur existe
      const user = await User.findByUsername(username);
      if (!user) {
        return res.status(401).json({ success: false, message: "Utilisateur non trouvé" });
      }

      // Vérifier le mot de passe
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: "Mot de passe incorrect" });
      }

      // Générer un token JWT
      const token = jwt.sign(
        { id: user.id, username: user.username, type: user.type },
        process.env.JWT_SECRET || "secretkey",
        { expiresIn: "1h" }
      );

      res.json({
        success: true,
        message: "Connexion réussie",
        token,
        user: { id: user.id, username: user.username, type: user.type }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

}

module.exports = UserController;
