
const EditRequest = require('../models/editRequest');
const Marqueur = require('../models/marqueur.js');

const dotenv = require("dotenv");
const { formatErrorResponse, formatSuccessResponse } = require("../utils/formatErrorResponse");

dotenv.config();

exports.createEditRequest = async (req, res, next) => {
  try {
    const marqueurId = req.params.marqueurId;

    const {
      titre,
      type,
      adresse,
      description,
      temoignage,
      courriel,
      images,
      tags,
    } = req.body;

    const marqueur = await Marqueur.findById(marqueurId);
    if (!marqueur) {
      return res.status(404).json(formatErrorResponse(
        404,
        "Not Found",
        "Le marqueur spécifié n'existe pas",
        req.originalUrl
      ));
    }

    const editRequest = await EditRequest.create({
      marqueur: marqueurId,
      proposedProperties: {
        titre,
        type,
        adresse,
        description,
        temoignage, 
        courriel,
        images,
        tags,
      },
      requestedByUserId: req.admin?._id,
      requestedByName: req.admin?.nom || req.admin?.email,
    }); 

    res.status(201).json(formatSuccessResponse(
      201,
      "Demande de modification créée avec succès",
      editRequest,
      req.originalUrl
    ));

  } catch (err) {
    next(err);
  }
}

exports.getEditRequests = async (req, res, next) => {
  try {
    const status = req.query.status;

    const filter = {};
    if (status) {
      filter.status = status;
    }

    const editRequests = await EditRequest.find(filter).populate("marqueur");

    return res.status(200).json(
      formatSuccessResponse(
        200,
        "Liste des demandes de modification récupérée avec succès",
        editRequests,
        req.originalUrl
      )
    );
  } catch (err) {
    next(err);
  }
};

exports.getEditRequest = async (req, res, next) => {
  try {
    const requestId = req.params.editRequestId;
    const editRequest = await EditRequest.findById(requestId).populate("marqueur");
    if (!editRequest) {
      return res.status(404).json(formatErrorResponse(
        404,
        "Not Found",
        "La demande de modification spécifiée n'existe pas",
        req.originalUrl
      ));
    }
    return res.status(200).json(formatSuccessResponse(
      200,
      "Demande de modification récupérée avec succès",
      editRequest,
    req.originalUrl
    ));
  } catch (err) {
    next(err);
  }
};

exports.approveEditRequest = async (req, res, next) => {
  try {
    const requestId = req.params.editRequestId;

    const editRequest = await EditRequest.findById(requestId);
    if (!editRequest) {
      return res.status(404).json(
        formatErrorResponse(
          404,
          "Not Found",
          "La demande de modification spécifiée n'existe pas",
          req.originalUrl
        )
      );
    }

    if (editRequest.status !== "pending") {
      return res.status(400).json(
        formatErrorResponse(
          400,
          "Bad Request",
          "Cette demande a déjà été traitée",
          req.originalUrl
        )
      );
    }

    const marqueur = await Marqueur.findById(editRequest.marqueur);
    if (!marqueur) {
      return res.status(404).json(
        formatErrorResponse(
          404,
          "Not Found",
          "Le marqueur associé à cette demande n'existe plus",
          req.originalUrl
        )
      );
    }

    const proposed = editRequest.proposedProperties || {};

    // On écrase seulement les champs définis dans proposed
    Object.keys(proposed).forEach((key) => {
      if (proposed[key] !== undefined) {
        marqueur.properties[key] = proposed[key];
      }
    });

    await marqueur.save();

    // Supprimer la demande de modification après l'avoir appliquée
    await EditRequest.findByIdAndDelete(requestId);

    return res.status(200).json(
      formatSuccessResponse(
        200,
        "Demande de modification acceptée et appliquée avec succès",
        { marqueur },
        req.originalUrl
      )
    );
  } catch (err) {
    next(err);
  }
};

exports.rejectEditRequest = async (req, res, next) => {
  try {
    const requestId = req.params.editRequestId;
    const { adminComment } = req.body;

    const editRequest = await EditRequest.findById(requestId);
    if (!editRequest) {
      return res.status(404).json(
        formatErrorResponse(
          404,
          "Not Found",
          "La demande de modification spécifiée n'existe pas",
          req.originalUrl
        )
      );
    }

    if (editRequest.status !== "pending") {
      return res.status(400).json(
        formatErrorResponse(
          400,
          "Bad Request",
          "Cette demande a déjà été traitée",
          req.originalUrl
        )
      );
    }

    // Supprimer la demande de modification après l'avoir refusée
    await EditRequest.findByIdAndDelete(requestId);

    return res.status(200).json(
      formatSuccessResponse(
        200,
        "Demande de modification refusée et supprimée avec succès",
        { message: "Demande supprimée" },
        req.originalUrl
      )
    );
  } catch (err) {
    next(err);
  }
};
