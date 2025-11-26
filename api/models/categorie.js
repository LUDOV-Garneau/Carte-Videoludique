const mongoose = require("mongoose");

const CategorieSchema = new mongoose.Schema({
    nom: { type: String, required: true, trim: true, maxlength: 100 },
    status: { type: String, enum: ["actif", "inactif"], default: "actif" }
}, { timestamps: true });

module.exports = mongoose.model("Categorie", CategorieSchema);