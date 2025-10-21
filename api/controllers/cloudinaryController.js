"use strict";
const {formatErrorResponse, formatSuccessResponse} = require('../utils/formatErrorResponse');

const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");
dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Fonction permettant de créer une signature pour l'upload vers Cloudinary
 * @param {*} req - L'objet de requête Express.
 * @param {*} res - L'objet de réponse Express.
 * @param {*} next - La fonction middleware suivante
 * @returns - retourne la signature créée, la clé API et le dossier
 */
exports.createUploadSignature = async(req, res, next) => {
    try {
        const folder = req.query.folder || "";
        const timestamp = Math.round(Date.now() / 1000);

        const paramsToSign = { timestamp, folder };
        const signature = cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET);

        return res.status(200).json(formatSuccessResponse(
            200,
            'Signature d\'upload cloudinary créée et récupérée avec succès.',
            {
                apiKey: process.env.CLOUDINARY_API_KEY,
                timestamp,
                signature,
                folder,
            },
            req.originalUrl,
        ));
    } catch (err) {
        next(err);
    }
};