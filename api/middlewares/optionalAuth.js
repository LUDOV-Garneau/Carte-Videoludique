"use strict";

const { formatErrorResponse} = require("../utils/formatErrorResponse");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();
const Admin = require("../models/admin");

module.exports = async (req, res, next) => {
    const authHeader = req.get("Authorization");

    if (!authHeader || !/^Bearer\s+/i.test(authHeader)) {
        req.admin = null;
        return next();
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
        req.admin = null;
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.SECRET_JWT);

        if (!decoded || typeof decoded !== "object" || !decoded.id) {
            return res.status(401).json(formatErrorResponse(
                401,
                "Unauthorized",
                "Token invalide ou non vérifié.",
                req.originalUrl
            ));
        }

        if (typeof decoded.exp === "number" && decoded.exp < Date.now() / 1000) {
            return res.status(401).json(formatErrorResponse(
                401,
                "Unauthorized",
                "Session expirée.",
                req.originalUrl
            ));
        }

        const admin = await Admin.findById(decoded.id);
        if (!admin) {
            return res.status(401).json(formatErrorResponse(
                401,
                "Unauthorized",
                "Admin non trouvé.",
                req.originalUrl
            ));
        }

        req.admin = admin;
        next();
    } catch (err) {
        if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
            return res.status(401).json(formatErrorResponse(
                401,
                "Unauthorized",
                "Token invalide ou expiré.",
                req.originalUrl
            ));
        }
        res.status(500).json(formatErrorResponse(
            500,
            "Internal Server Error",
            "Une erreur est survenue lors de la vérification du token.",
            req.originalUrl
        ));
    }