// fixComments.js
"use strict";

const mongoose = require("mongoose");
require("dotenv").config(); // charge DATA_BASE
const Marqueur = require("./models/marqueur");

async function run() {
  try {
    console.log("Connecting to database...");
    await mongoose.connect(process.env.DATA_BASE);

    console.log("Connected!");

    // On récupère tous les marqueurs
    const marqueurs = await Marqueur.find();

    let totalUpdated = 0;

    for (const m of marqueurs) {
      let modified = false;

      m.properties.comments.forEach(comment => {
        if (!comment.status) {
          comment.status = "pending";
          modified = true;
        }
      });

      if (modified) {
        await m.save();
        console.log(`✔ Marqueur ${m._id} mis à jour.`);
        totalUpdated++;
      }
    }

    console.log(`\n✔ Terminé. ${totalUpdated} marqueur(s) corrigé(s).`);
    process.exit(0);

  } catch (err) {
    console.error("Erreur :", err);
    process.exit(1);
  }
}

run();
