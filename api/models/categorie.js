const mongoose = require("mongoose");

const ImageCategorieSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ["predefined", "uploaded", "url"],
        required: true
    },
    // Pour les images prédéfinies (ex: "icon-boutique.svg")
    filename: { type: String },
    
    // Pour Cloudinary (réutilise la structure des marqueurs)
    publicId: { type: String },
    url: { type: String },
    width: { type: Number },
    height: { type: Number },
    bytes: { type: Number },
    format: { type: String },
    
    // Pour les URLs externes
    externalUrl: { type: String },
    
    // Métadonnées communes
    alt: { type: String, trim: true, maxlength: 100 },
    createdAt: { type: Date, default: Date.now }
}, { _id: false });

const CategorieSchema = new mongoose.Schema({
    nom: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50,
        unique: true
    },
    image: {
        type: ImageCategorieSchema,
        required: true
    },
    description: {
        type: String,
        trim: true,
        maxlength: 200
    },
    couleur: {
        type: String,
        trim: true,
        match: /^#[0-9A-F]{6}$/i, // Code couleur hexadécimal
        default: "#4CAF50"
    },
    ordre: {
        type: Number,
        default: 0
    },
    active: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Index pour l'ordre d'affichage
CategorieSchema.index({ ordre: 1, nom: 1 });

module.exports = mongoose.models.Categorie || mongoose.model("Categorie", CategorieSchema);