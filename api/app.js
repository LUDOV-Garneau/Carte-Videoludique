"use strict";

const express = require("express");
const mongoose = require("mongoose");
const app = express();
const dotenv = require('dotenv');
dotenv.config();

const cors = require('cors');

app.use(cors());

app.use(express.json());  


app.use((req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', '*');

	res.setHeader('Access-Control-Allow-Methods','OPTIONS, GET, POST, PUT, PATCH, DELETE');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
	if (req.method === 'OPTIONS') {
		return res.sendStatus(200).end();
	}
	next();
});

const adminRoutes = require("./routes/admin");
const marqueurRoutes = require("./routes/marqueur")
const cloudinaryRoutes = require("./routes/cloudinary");

// app.use(seed);

app.use(adminRoutes);
app.use(marqueurRoutes);
app.use(cloudinaryRoutes);

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  const code = err.status || 500;
  res.status(code).json({ message: err.message || 'Erreur serveur.' });
});

console.log("DATA_BASE =", process.env.DATA_BASE);

//(async () => {
//	try {
//		await mongoose.connect(process.env.DATA_BASE);
//  
//		app.listen(process.env.PORT, () => {
//			console.log(`Serveur à l'écoute sur : http://localhost:${process.env.PORT}`);
//		});
//	} catch (err) {
//		console.error("Erreur de connexion à MongoDB :", err);
//	}
//  })();
 mongoose.connect(process.env.DATA_BASE)
   .then(() => console.log("MongoDB connecté"))
   .catch((err) => console.error("Erreur MongoDB :", err));

module.exports = app;
