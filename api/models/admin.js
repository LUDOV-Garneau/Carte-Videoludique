"use strict";

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AdminSchema = new Schema(
  {
    nom: {
      type: String,
      required: true,
      minLength: 1,
      maxLength: 50,
    },
    prenom: {
      type: String,
      required: true,
      minLength: 1,
      maxLength: 50,
    },
    courriel: {
      type: String,
      required: true,
      unique: true,
      match: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
    },
    role: {
      type: String,
      enum: ["Gestionnaire", "Éditeur"],
      required:true
    },
    status: {
      type: String,
      enum: ["Actif", "Inactif"],
      required:true
    },
    motDePasse: {
      type: String,
      required: true,
      minLength: 6,
    },
  },

  { timestamps: true }
);

module.exports = mongoose.models.Admin || mongoose.model("Admin", AdminSchema);
