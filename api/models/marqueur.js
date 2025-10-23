const mongoose = require("mongoose");

const ImageSchema = new mongoose.Schema({
    publicId: String,
    url: String,
    width: Number,
    height: Number,
    bytes: Number,
    format: String,
    createdAt: String,
    originalFilename: String,
}, { _id: false });

const MarqueurSchema = new mongoose.Schema({
    titre: {
        type: String,
        required: [true, "Le titre est requis"],
        minlength: 1,
        maxlength: 100
    },
    type: {
        type: String,
        enum: ['Écoles et instituts de formation',
            'Développement et édition de jeux',
            'Boutiques spécialisées',
            'Magasins à grande surface',
            'Friperies, marchés aux puces et d\'occasion',
            'Dépanneurs et marchés',
            'Clubs vidéo',
            'Arcades et salles de jeux',
            'Organismes et institutions',
            'Autres',
        ],
        default: 'Autres'
    },
    adresse: {
        type: String,
        maxlength: 100,
        default: ""
    },
    description: {
        type: String,
        required: [true, "La description est requise"],
        minlength: 1,
        maxlength: 1000
    },
    temoignage: {
        type: String,
        default: ""
    },
    location: {
        type: {
            type: String,
            enum: ["Point"],
            required: false
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: false
        }
    },
    images: {
        type: [ImageSchema],
        default: []
    },
    courriel:{
        type: String,
        default: "",
    },
    status: {
        type: String,
        enum: ['En attente', 'Approuvé', 'Rejeté'],
        default: 'En attente'
    }
}, 
{
    timestamps: true, 
});

MarqueurSchema.index({ location: "2dsphere" });

module.exports = mongoose.models.Marqueur || mongoose.model('Marqueur', MarqueurSchema);
