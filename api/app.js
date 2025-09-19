"use strict";

//const hateoasLinker = require("express-hateoas-links");
const express = require("express");
const mongoose = require("mongoose");
const app = express();
const dotenv = require('dotenv');
dotenv.config();
//const cors = require('cors');

//app.use(cors());


// parse application/json
// Permet de parser le corps des requêtes (body) en JSON
app.use(express.json());  


// app.use((req, res, next) => {
// 	res.setHeader('Access-Control-Allow-Origin', '*');
// 	res.setHeader(
//   'Access-Control-Allow-Methods',
//   'OPTIONS, GET, POST, PUT, PATCH, DELETE'
// 	);
// 	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
//   next();
// });



// Importe les routes
// const authRoutes = require("./routes/auth");
// const utilisateurRoutes = require("./routes/utilisateur");
// const tableauRoutes = require("./routes/tableau");
// const listeRoutes = require("./routes/liste");
// const carteRoutes = require("./routes/carte");
// const seed = require("./routes/db");

// Utilisation des routes en tant que middleware
// app.use(seed);
// app.use(authRoutes);
// app.use(utilisateurRoutes);
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
