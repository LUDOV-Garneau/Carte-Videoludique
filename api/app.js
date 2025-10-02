"use strict";

//const hateoasLinker = require("express-hateoas-links");
const express = require("express");
const mongoose = require("mongoose");
const app = express();
const dotenv = require('dotenv');
dotenv.config();
// const cors = require('cors');

// app.use(cors());


// parse application/json
// Permet de parser le corps des requêtes (body) en JSON
app.use(express.json());  


app.use((req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', 'https://ludov-garneau.github.io');
	res.setHeader('Access-Control-Allow-Methods','OPTIONS, GET, POST, PUT, PATCH, DELETE');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
	if (req.method === 'OPTIONS') {
		return res.sendStatus(200);
	}
  next();
});



// Importe les routes

const adminRoutes = require("./routes/admin");
const marqueurRoutes = require("./routes/marqueur")
// const tableauRoutes = require("./routes/tableau");
// const listeRoutes = require("./routes/liste");
// const carteRoutes = require("./routes/carte");
// const seed = require("./routes/db");

// Utilisation des routes en tant que middleware
// app.use(seed);

app.use(adminRoutes);
app.use(marqueurRoutes);
// app.use(tableauRoutes);
// app.use(listeRoutes);
// app.use(carteRoutes);

// remplace le res.json standard avec la nouvelle version
// qui prend en charge les liens HATEOAS
//app.use(hateoasLinker);

console.log("DATA_BASE =", process.env.DATA_BASE);


// Démarrage du serveur
(async () => {
	try {
		await mongoose.connect(process.env.DATA_BASE);
  
		app.listen(process.env.PORT, () => {
			console.log(`Serveur à l'écoute sur : http://localhost:${process.env.PORT}`);
		});
	} catch (err) {
		console.error("Erreur de connexion à MongoDB :", err);
	}
  })();
