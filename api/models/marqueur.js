const mongoose = require("mongoose");

//
// -------------------------------------------------------------
// Sous-schéma pour les commentaires
// -------------------------------------------------------------
//
const CommentSchema = new mongoose.Schema({
  auteur: { type: String, trim: true },
  contenu: { type: String, trim: true, maxlength: 1000 },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
    index: true
  },
  createdAt: { type: Date, default: Date.now }
});

//
// -------------------------------------------------------------
// Sous-schéma pour les images
// -------------------------------------------------------------
//
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


//
// -------------------------------------------------------------
// Schéma principal Marqueur
// -------------------------------------------------------------
//
const MarqueurSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Feature"],
      default: "Feature",
      required: true
    },

    geometry: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
        default: "Point"
      },
      coordinates: {
        type: [Number], // [lat, lng]
        required: true,
        validate: [
          arr => arr.length === 2,
          "geometry.coordinates doit être [lat, lng]"
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
        enum: ["pending", "edit-request", "approved", "rejected"],
        default: "pending",
        index: true
      },

      comments: { type: [CommentSchema], default: [] },

      tags: [{ type: String, trim: true, lowercase: true }],

      createdByName: { type: String },
    },

    //
    // -------------------------------------------------------------
    // Nouveau champ : ARCHIVE des marqueurs
    // -------------------------------------------------------------
    //
    archived: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);


//
// -------------------------------------------------------------
// Index géospatial
// -------------------------------------------------------------
//
MarqueurSchema.index({ geometry: "2dsphere" });


//
// -------------------------------------------------------------
// Validation des coordonnées
// -------------------------------------------------------------
//
MarqueurSchema.path("geometry.coordinates").validate(function (coords) {
  const [lat, lng] = coords;
  return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
}, "Coordonnées invalides (lng/lat).");


//
// -------------------------------------------------------------
// toJSON : sort propre pour Leaflet
// -------------------------------------------------------------
//
MarqueurSchema.set("toJSON", {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;

    // Ajoute properties.id pour compatibilité FE
    if (ret.properties) {
      ret.properties.id = ret.id;
    }

    return ret;
  }
});


//
// -------------------------------------------------------------
// Export modèle
// -------------------------------------------------------------
//
module.exports =
  mongoose.models.Marqueur || mongoose.model("Marqueur", MarqueurSchema);
