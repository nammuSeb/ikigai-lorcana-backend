const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const [admin] = await db.query(
            'SELECT * FROM admins WHERE email = ?',
            [email]
        );

        if (!admin || !admin.length) {
            return res.status(401).json({ message: 'Identifiants invalides' });
        }

        const validPassword = await bcrypt.compare(password, admin[0].password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Identifiants invalides' });
        }

        // Mise à jour du dernier login
        await db.query(
            'UPDATE admins SET last_login = NOW() WHERE id = ?',
            [admin[0].id]
        );

        const token = jwt.sign(
            { id: admin[0].id, role: admin[0].role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: admin[0].id,
                email: admin[0].email,
                role: admin[0].role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

module.exports = router;
