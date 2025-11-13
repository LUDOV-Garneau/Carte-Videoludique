const {
  formatErrorResponse,
  formatSuccessResponse,
} = require("../utils/formatErrorResponse");
("use strict");

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
exports.signup = async (req, res, next) => {
  const { nom, prenom, courriel, role, mdp, mdp2 } = req.body;

  if (!nom || !prenom || !courriel || !role || !mdp || !mdp2) {
    return res
      .status(400)
      .json(
        formatErrorResponse(
          400,
          "Bad Request",
          "Tous les champs sont requis.",
          req.originalUrl
        )
      );
  }

  try {
    if (mdp !== mdp2) {
      return res
        .status(400)
        .json(
          formatErrorResponse(
            400,
            "Bad Request",
            "Les mots de passe ne correspondent pas.",
            req.originalUrl
          )
        );
    }
    // Vérification que le rôle est valide selon le modèle
    const rolesValides = Admin.schema.path("role").enumValues; // récupère ["Gestionnaire", "Éditeur"]
    if (!rolesValides.includes(role)) {
      return res
        .status(400)
        .json(
          formatErrorResponse(
            400,
            "Bad Request",
            `Le rôle doit être l'un de : ${rolesValides.join(", ")}`,
            req.originalUrl
          )
        );
    }
    const adminExistant = await Admin.findOne({ courriel: courriel });
    if (adminExistant) {
      return res
        .status(409)
        .json(
          formatErrorResponse(
            409,
            "Conflict",
            "Un administrateur avec ce courriel existe déjà.",
            req.originalUrl
          )
        );
    }
    // Encryption du mot de passe
    const hashedPassword = await bcrypt.hash(mdp, 12);
    // Création d'un nouvel administrateur
    const admin = new Admin({
      nom: nom,
      prenom: prenom,
      courriel: courriel,
      role: role,
      motDePasse: hashedPassword,
    });

    await admin.save();
    return res
      .status(201)
      .json(
        formatSuccessResponse(
          201,
          "Administrateur créé !",
          admin,
          req.originalUrl
        )
      );
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
    const admin = await Admin.findOne({ courriel });
    if (!admin) {
      return res
        .status(401)
        .json(
          formatErrorResponse(
            401,
            "Unauthorized",
            "Courriel ou mot de passe invalide",
            req.originalUrl
          )
        );
    }

    // Vérifie si le mot de passe est valide
    const isEqual = await bcrypt.compare(mdp, admin.motDePasse);
    if (!isEqual) {
      return res
        .status(401)
        .json(
          formatErrorResponse(
            401,
            "Unauthorized",
            "Courriel ou mot de passe invalide",
            req.originalUrl
          )
        );
    }

    // Création d'un jeton JWT
    const token = jwt.sign(
      {
        courriel: admin.courriel,
        nom: admin.nom,
        role: admin.role,
        prenom: admin.prenom,
        id: admin.id,
      },
      process.env.SECRET_JWT,
      { expiresIn: "24h" }
    );

    return res
      .status(200)
      .json(
        formatSuccessResponse(200, "Authentifié", { token }, req.originalUrl)
      );
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
    return res
      .status(200)
      .json(
        formatSuccessResponse(
          200,
          "Les administrateurs ont été récupérés",
          admins,
          req.originalUrl
        )
      );
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
    if (admin.id == req.params.adminId) {
      return res
        .status(200)
        .json(
          formatSuccessResponse(
            200,
            "L'administrateur est trouvé",
            admin,
            req.originalUrl
          )
        );
    }
    return res
      .status(403)
      .json(
        formatErrorResponse(
          403,
          "Forbidden",
          "Cette ressource ne vous appartient pas",
          req.originalUrl
        )
      );
  } catch (err) {
    next(err);
  }
};
