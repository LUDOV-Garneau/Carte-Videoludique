'use strict';

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AdminSchema = new Schema(
  {
    nom: { 
      type: String, 
      required: true,
      minLength:1,
			maxLength:50 
    },
    prenom: {
      type: String,
      required: true,
      minLength:1,
			maxLength:50
    },
    courriel: {
			type: String,
			required: true,
			unique: true,
			match: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/
		
		},
		motDePasse: {
			type: String,
			required: true,
			minLength: 6
		},
  },
  
  { timestamps: true }
);

module.exports = mongoose.model("Admin", AdminSchema);