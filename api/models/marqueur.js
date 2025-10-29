const mongoose = require("mongoose");


// Optionnel : sous-schéma pour les commentaires
const CommentSchema = new mongoose.Schema({
  auteur: { type: String, trim: true },
  contenu: { type: String, trim: true, maxlength: 1000 },
  createdAt: { type: Date, default: Date.now }
});

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

const MarqueurSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["Feature"], default: "Feature", required: true },
    geometry: {
      type: { type: String, enum: ["Point"], required: true, default: "Point" },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true,
        validate: [
          arr => arr.length === 2,
          "geometry.coordinates doit être [lng, lat]"
        ]
      }
    },
    properties: {
      titre: { type: String, required: true, trim: true, maxlength: 140 },
      type: {
        type: String,
        enum: [
          "Écoles et instituts de formation",
          "Développement et édition de jeux",
          "Boutiques spécialisées",
          "Magasins à grande surface",
          "Friperies, marchés aux puces et d'occasion",
          "Dépanneurs et marchés",
          "Clubs vidéo",
          "Arcades et salles de jeux",
          "Organismes et institutions",
          "Autres"
        ],
        default: "Autres"
      },
      adresse: { type: String, trim: true, maxlength: 150 },
      description: { type: String, trim: true, maxlength: 1000 },
      temoignage: { type: String, trim: true },
      courriel: { type: String, trim: true, lowercase: true },
      images: { type: [ImageSchema], default: [] },
      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
        index: true
      },
      tags: [{ type: String, trim: true, lowercase: true }],
      createdByName: { type: String },
    },
    comments: [CommentSchema],
    flags: [{
      reason: { type: String, trim: true },
      createdAt: { type: Date, default: Date.now }
    }]
  },
  { timestamps: true }
);

// Index géospatial
MarqueurSchema.index({ geometry: "2dsphere" });

// Validation des coordonnées
MarqueurSchema.path("geometry.coordinates").validate(function (coords) {
  const [lng, lat] = coords;
  return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
}, "Coordonnées invalides (lng/lat).");

// Sortie JSON propre pour Leaflet
MarqueurSchema.set("toJSON", {
  versionKey: false,
  transform: function (doc, ret) {
    return {
      type: ret.type,
      geometry: ret.geometry,
      properties: {
        id: ret._id,
        ...ret.properties,
        createdAt: ret.createdAt,
        updatedAt: ret.updatedAt
      }
    };
  }
});

module.exports =
  mongoose.models.Marqueur || mongoose.model("Marqueur", MarqueurSchema);
