const mongoose = require('mongoose');

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

const EditRequestSchema = new mongoose.Schema(
  {
    // Marqueur ciblé
    marqueur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Marqueur',
      required: true,
    },

    // Propositions de modifications (même logique que properties)
    proposedProperties: {
      titre: { type: String, trim: true, maxlength: 140 },
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
        ]
      },
      adresse: { type: String, trim: true, maxlength: 150 },
      description: { type: String, trim: true, maxlength: 1000 },
      temoignage: { type: String, trim: true },
      courriel: { type: String, trim: true, lowercase: true },
      images: { type: [ImageSchema], default: [] },
      tags: [{ type: String, trim: true, lowercase: true }],
    },

    // Infos sur la personne qui demande la modif
    requestedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    requestedByName: { type: String },

    // Statut de la demande
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },

    // Optionnel : infos de review par l’admin
    adminComment: { type: String, trim: true, maxlength: 1000 },
    reviewedAt: { type: Date },
    reviewedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedByName: { type: String },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.EditRequest || mongoose.model('EditRequest', EditRequestSchema);