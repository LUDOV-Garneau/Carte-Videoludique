const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const MarqueurSchema = new mongoose.Schema({
    titre: {
        type: String,
        required: [true, "Le titre est requis"],
        minlength: 1,
        maxlength: 100
    },
    type: {
        type: String,
        required: [true, "Le type est requis"],
        minlength: 1,
        maxlength: 100
    },
    adresse: {
        type: String,
        required: [true, "L'adresse est requise"],
        minlength: 1,
        maxlength: 100
    },
    description: {
        type: String,
        default: ""
    },
    temoignage: {
        type: String,
        default: ""
    },
    location: {
        type: {
            type: String,
            enum: ["Point"],
            required: true
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true
        }
    },
    image: {
        type: String,
        default: ""  
    },
    courriel:{
        type: String,
        default: "",
        required: true
    }
}, 
{
    timestamps: true, 
});

MarqueurSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Marqueur", MarqueurSchema);
