// inspectMarqueurs.js
"use strict";

const mongoose = require("mongoose");
require("dotenv").config();
const Marqueur = require("./models/marqueur");

async function run() {
  await mongoose.connect(process.env.DATA_BASE);

  console.log("Connected.");

  const marqueurs = await Marqueur.find();

  for (const m of marqueurs) {
    console.log("\n====== Marqueur:", m._id, "======");
    console.log("properties.comments:", m.properties?.comments);
    console.log("comments:", m.comments);
  }

  process.exit(0);
}

run();