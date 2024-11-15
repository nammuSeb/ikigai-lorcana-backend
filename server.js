const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const app = express();

const joueursRoutes = require('./routes/joueursRoutes');
const defisRoutes = require('./routes/defisRoutes');
const quetesRoutes = require('./routes/quetesRoutes');
const tournoisRoutes = require('./routes/tournoisRoutes');
const catalogueRoutes = require('./routes/catalogueRoutes');
const classementsRoutes = require('./routes/classementsRoutes');
const parametresRoutes = require('./routes/parametresRoutes');

// Configuration de multer pour le stockage des fichiers
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Dossier où les fichiers seront stockés
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Nom du fichier unique
    }
});

const upload = multer({ storage: storage });

app.use(cors({
    //origin: 'http://localhost:5173',
    origin: 'https://www.inkigai.ch',
}));

app.use(express.json());
app.use('/uploads', express.static('uploads')); // Sert les fichiers uploadés en tant que ressources statiques

// Utilisation des routes
app.use('/api/joueurs', joueursRoutes);
app.use('/api/defis', defisRoutes);
//app.use('/api/quetes', quetesRoutes);
app.use('/api/tournois', tournoisRoutes);
app.use('/api/catalogue', catalogueRoutes);
app.use('/api/classements', classementsRoutes);
//app.use('/api/parametres', parametresRoutes);

// Route pour l'upload d'images
app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Aucun fichier uploadé' });
    }
    // Renvoie le chemin de l'image pour l'utiliser dans la base de données
    res.json({ imageUrl: `/uploads/${req.file.filename}` });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
