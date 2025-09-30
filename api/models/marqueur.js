const mongoose = require("mongoose");

const GeoPointSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ["Point"],
        required: true,
        default: "Point"
    },
    coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
        validate : {
            validator: function(value) {
                return Array.isArray(value) &&
                value.length === 2 &&
                value.every(coord => typeof coord === 'number' && Number.isFinite(coord)) &&
                value[0] >= -180 && value[0] <= 180 && // longitude
                value[1] >= -90 && value[1] <= 90; // latitude
            },
            message: "Les coordonnées doivent être en [longitude, latitude] avec des valeurs valides."
        }
    }
},
{ _id : false });

const MarqueurSchema = new mongoose.Schema({
    geometry: {
        type: GeoPointSchema,
        required: true
    },
    properties: {
        titre: {
            type: String,
            required: [true, "Le titre est requis"],
            minlength: 1,
            maxlength: 100,
            trim: true
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
                'Autres'
            ],
            required: false,
            default: "Autres"
        },
        adresse: {
            type: String,
            required: false,
            minlength: 1,
            maxlength: 100,
            default: ""
        },
        description: {
            type: String,
            required: [true, "La description est requise"],
            minlength: 1,
            maxlength: 1000
        },
        souvenirs: {
            type: [String],
            default: []
        },
        images: {
            type: [String],
            default: []
        },
        source: {
            type: [String],
            default: []
        },
        nom: {
            type: String,
            default: "",
        },
        courriel:{
            type: String,
            default: "",
        },
        status: {
            type: String,
            required: true,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        }
    }
},
{ timestamps: true });

MarqueurSchema.index({ geometry: "2dsphere" });

MarqueurSchema.set("toJSON", {
    virtuals: true,
    transform: (_, ret) => {
        const id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return {
            type: "Feature",
            id,
            geometry: ret.geometry,
            properties: {
                ...ret.properties,
                createdAt: ret.createdAt,
                updatedAt: ret.updatedAt
            }
        };
    }
});

module.exports = mongoose.model("Marqueur", MarqueurSchema);
