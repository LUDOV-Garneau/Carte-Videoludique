
//const {formatErrorResponse, formatSuccessResponse} = require('../utils/formatApiResponse');
'use strict';

const jwt = require("jsonwebtoken"); 
const bcrypt = require("bcrypt"); 
const dotenv = require("dotenv");
dotenv.config();
//const url_base = process.env.URL + ":" + process.env.PORT;

const Admin = require("../models/admin");

/**
 * Fonction permettant de créer un administrateur
 * @param {*} req - L'objet de requête Express.
 * @param {*} res - L'objet de réponse Express.
 * @param {*} next - La fonction middleware suivante
 * @returns - retourne un administrateur crée
 */
exports.signup = async(req, res, next) => {
    const { nom,prenom, courriel, mdp,mdp2 } = req.body;
    
    if(!nom ||!prenom || !courriel || !mdp || !mdp2){
      return res.status(400).json({
        status: "Bad Request",
        message: "Tous les champs sont requis.",
        path: req.originalUrl,
        timestamp: new Date().toISOString(),
      });
    }

  try {
    if(mdp !== mdp2){
      return res.status(400).json({
        status: "Bad Request",
        message: "Les mots de passe ne correspondent pas.",
        path: req.originalUrl,
        timestamp: new Date().toISOString(),
      });
    }
      const adminExistant = await Admin.findOne({courriel:courriel});
      if (adminExistant) {
        return res.status(409).json({
          status: "Conflict",
          message: "Un administrateur avec ce courriel existe déjà.",
          path: req.originalUrl,
          timestamp: new Date().toISOString(),
        });
      }
        // Encryption du mot de passe
          const hashedPassword = await bcrypt.hash(mdp, 12);
          // Création d'un nouvel administrateur
          const admin = new Admin({
          nom: nom,
          prenom: prenom,
          courriel: courriel,
          motDePasse: hashedPassword,
          });
  
          await admin.save();
          return res.status(201).json({
            status: "Succès",
            message: "Adminitrateur créé !",
            data:admin,
            timestamp: new Date().toISOString()
          });
            
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
			
};

/**
 * Fonction permettant de se connecter
 * @param {*} req  - L'objet de requête Express.
 * @param {*} res  - L'objet de réponse Express.
 * @param {*} next - La fonction middleware suivante
 */
exports.login = async (req, res, next) => {
    const { courriel, mdp } = req.body;
  
    try {
      const admin = await Admin.findOne({ courriel: courriel });
      if (!admin) { //des logs peut-être pour savoir exactement ce qui se passe??
        const error = new Error("Courriel ou mot de passe invalide");
        error.statusCode = 401;
        throw error;
      }
  
      // Vérifie si le mot de passe est valide
      const isEqual = await bcrypt.compare(mdp, admin.motDePasse);
      if (!isEqual) { //des logs peut-être pour savoir exactement ce qui se passe??
        const error = new Error("Courriel ou mot de passe invalide");
        error.statusCode = 401;
        throw error;
      }
          
      // Création d'un jeton JWT
      const token = jwt.sign(
        {
          courriel: admin.courriel,
          nom: admin.nom,
          prenom:admin.prenom,
          id: admin.id,
        },
        process.env.SECRET_JWT,
        { expiresIn: "24h" }
      );
  
      res.status(200).json({ token: token });
    } catch (err) {
      next(err);
    }
};

/**
 * Fonction permettant de récupérer tout les administrateurs
 * @param {*} req - L'objet de requête Express. 
 * @param {*} res - L'objet de réponse Express.
 * @param {*} next - La fonction middleware suivante 
 * @returns - retourne les administrateurs récupérés
 */
exports.getAdmins = async (req, res, next) => {
    try {
        const admins = await Admin.find();
        return res.status(200).json({
          status: "succès",
          message: "Les administrateurs ont été récupérés",
          data: admins,
          path: req.originalUrl,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        next(err);
      }
};

/**
 * Fonction permettant de récupérer un administrateur
 * @param {*} req - L'objet de requête Express. 
 * @param {*} res - L'objet de réponse Express.
 * @param {*} next - La fonction middleware suivante 
 * @returns - retourne l'administrateur récupéré
 */
exports.getAdmin = (req, res, next) => {
    try {
        const admin = req.admin;
        if(admin.id == req.params.adminId){
            return res.status(200).json({
                status: "succès",
                message: "L'administrateur est trouvé",
                data: admin,
                path: req.originalUrl,
                timestamp: new Date().toISOString(),
              });
        }
        else{
            return res.status(403).json({
                status: 403,
                error: "Forbidden",
                message: "Cette ressource ne vous appartient pas",
                path: req.originalUrl,
                timestamp: new Date().toISOString(),
              });
        }
        
      } catch (err) {
        next(err);
      }
	
};


