const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const app = express();

const joueursRoutes = require('./routes/joueursRoutes');
const defisRoutes = require('./routes/defisRoutes');
const tournoisRoutes = require('./routes/tournoisRoutes');
const reglementRoutes = require('./routes/reglementRoutes');
const catalogueRoutes = require('./routes/catalogueRoutes');
const classementsRoutes = require('./routes/classementsRoutes');
const parametresRoutes = require('./routes/parametresRoutes');

// Middleware pour afficher les logs des requêtes et des en-têtes CORS
app.use((req, res, next) => {
    /*
    console.log('--- Request Received ---');
    console.log(`Method: ${req.method}`);
    console.log(`Path: ${req.path}`);
    console.log(`Origin: ${req.headers.origin}`);
    console.log('Headers:', req.headers);
    console.log('-------------------------');
    */
    next();
});

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

// Configuration de CORS avec logs pour chaque requête
app.use(cors({
    origin: (origin, callback) => {
        //console.log(`CORS request from origin: ${origin}`);
        // Ajoutez ici vos conditions pour autoriser l'origine
        const allowedOrigins = [
            'http://localhost:5173',
            'http://localhost:3000',
            'https://inkigai.ch',
            'https://www.inkigai.ch',
            'http://ikigai.jcloud.ik-server.com'
        ];
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log(`Blocked CORS request from origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true // Autorise l'envoi des cookies et des identifiants
}));

app.use(express.json());
app.use('/uploads', express.static('uploads')); // Sert les fichiers uploadés en tant que ressources statiques

// Utilisation des routes
app.use('/api/joueurs', joueursRoutes);
app.use('/api/defis', defisRoutes);
//app.use('/api/quetes', quetesRoutes);
app.use('/api/tournois', tournoisRoutes);
app.use('/api/reglement', reglementRoutes);
app.use('/api/catalogue', catalogueRoutes);
app.use('/api/classements', classementsRoutes);
app.use('/api/parametres', parametresRoutes);

// Route pour l'upload d'images
app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        console.error('Aucun fichier uploadé');
        return res.status(400).json({ message: 'Aucun fichier uploadé' });
    }
    // Renvoie le chemin de l'image pour l'utiliser dans la base de données
    console.log(`Image uploaded: ${req.file.filename}`);
    res.json({ imageUrl: `/uploads/${req.file.filename}` });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
