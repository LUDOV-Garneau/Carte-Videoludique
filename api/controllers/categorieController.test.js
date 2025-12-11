import { describe, it, expect, beforeEach, vi } from "vitest";
import * as categorieController from "./categorieController.js";
import Categorie from "../models/categorie";
import { json } from "express";

function mockRes() {
    return {
        statusCode: 200,
        body: null,
        headers: {},
        status(code) { this.statusCode = code; return this; },
        json(object) { this.body = object; return this; },
        location (path) { this.headers.Location = path; return this; }
    }
}
function mockReq({body = {}, params = {}, originalUrl = 'api/test'} = {}) {
    return { body, params, originalUrl, categorie: undefined };
}
function mockNext() {
    const fn = vi.fn();
    return fn;
}

beforeEach(() => {
    vi.restoreAllMocks();
});

describe("categorieController.createCategorie", () => {
    it("400 si le nom est manquant", async () => {
        const req = mockReq({ body: {} });
        const res = mockRes();

        await categorieController.createCategorie(req, res, mockNext);
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe("Bad Request");
    });

    it("400 si le code couleur est invalide", async () => {
        const req = mockReq({ body: { nom: "Test", couleur: "invalid-color" } });
        const res = mockRes();

        await categorieController.createCategorie(req, res, mockNext);
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe("Bad Request");
    });

    it("400 si la description est trop longue", async () => {
        const longDescription = "a".repeat(201);
        const req = mockReq({ body: { nom: "Test", description: longDescription } });
        const res = mockRes();

        await categorieController.createCategorie(req, res, mockNext);
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe("Bad Request");
    });

    it("201 et crée une catégorie valide", async () => {
        vi.spyOn(Categorie.prototype, "save").mockResolvedValueOnce({
            _id: "609e129e1c4ae12f34567890",
            nom: "Test",
            couleur: "#FF5733",
            description: "Une catégorie de test.",
            image: { type: "predefined", filename: "icon-test.svg", alt: "Icone de test" }
        });

        const req = mockReq({ 
            body: { 
                nom: "Test", 
                couleur: "#FF5733", 
                description: "Une catégorie de test.",
                image: { type: "predefined", filename: "icon-test.svg", alt: "Icone de test" }
            }
        });
        const res = mockRes();

        await categorieController.createCategorie(req, res, mockNext);
        expect(res.statusCode).toBe(201);
        expect(res.body.status).toBe(201);
        expect(res.headers.Location).toBe("/categories/609e129e1c4ae12f34567890");
        expect(res.body.data).toMatchObject({
            nom: "Test",
            couleur: "#FF5733",
            description: "Une catégorie de test.",
            image: { type: "predefined", filename: "icon-test.svg", alt: "Icone de test" }
        });
        expect(res.body.path).toBe(req.originalUrl);
        expect(new Date(res.body.timestamp).toISOString()).toBe(res.body.timestamp);
    });
})

describe("categorieController.patchCategorieNom", () => {
    it("400 si le nom est vide", async () => {
        const req = mockReq({ body: { nom: "" }, params: { categorieId: "123" } });
        const res = mockRes();

        await categorieController.patchCategorieNom(req, res, mockNext);
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe("Bad Request");
    });

    it("200 et met à jour le nom", async () => {
        vi.spyOn(Categorie, "findByIdAndUpdate").mockResolvedValueOnce({
            _id: "123",
            nom: "Nouveau nom"
        });

        const req = mockReq({ body: { nom: "Nouveau nom" }, params: { categorieId: "123" } });
        const res = mockRes();

        await categorieController.patchCategorieNom(req, res, mockNext);
        expect(res.statusCode).toBe(200);
        expect(res.body.data.nom).toBe("Nouveau nom");
    });
})

describe("categorieController.patchCategorieCouleur", () => {
    it("400 si couleur invalide", async () => {
        const req = mockReq({ body: { couleur: "invalid" }, params: { categorieId: "123" } });
        const res = mockRes();

        await categorieController.patchCategorieCouleur(req, res, mockNext);
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe("Bad Request");
    });

    it("200 et met à jour la couleur", async () => {
        vi.spyOn(Categorie, "findByIdAndUpdate").mockResolvedValueOnce({
            _id: "123",
            couleur: "#FF0000"
        });

        const req = mockReq({ body: { couleur: "#FF0000" }, params: { categorieId: "123" } });
        const res = mockRes();

        await categorieController.patchCategorieCouleur(req, res, mockNext);
        expect(res.statusCode).toBe(200);
        expect(res.body.data.couleur).toBe("#FF0000");
    });
})

describe("categorieController.patchCategorieImage", () => {
    it("400 si image manquante", async () => {
        const req = mockReq({ body: {}, params: { categorieId: "123" } });
        const res = mockRes();

        await categorieController.patchCategorieImage(req, res, mockNext);
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe("Bad Request");
    });

    it("200 et met à jour l'image", async () => {
        vi.spyOn(Categorie, "findByIdAndUpdate").mockResolvedValueOnce({
            _id: "123",
            image: { type: "predefined", filename: "new-icon" }
        });

        const req = mockReq({ 
            body: { image: { type: "predefined", filename: "new-icon" } }, 
            params: { categorieId: "123" } 
        });
        const res = mockRes();

        await categorieController.patchCategorieImage(req, res, mockNext);
        expect(res.statusCode).toBe(200);
        expect(res.body.data.image.filename).toBe("new-icon");
    });
})

describe("categorieController.patchCategorieActive", () => {
    it("400 si active n'est pas booléen", async () => {
        const req = mockReq({ body: { active: "invalid" }, params: { categorieId: "123" } });
        const res = mockRes();

        await categorieController.patchCategorieActive(req, res, mockNext);
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe("Bad Request");
    });

    it("200 et supprime la catégorie si elle n'est pas utilisée", async () => {
        // Mock du modèle Marqueur pour countDocuments (aucun marqueur utilise cette catégorie)
        const mockMarqueurModel = {
            countDocuments: vi.fn().mockResolvedValueOnce(0)
        };
        
        // Mock mongoose.model pour retourner notre mock
        const originalMongoose = require('mongoose');
        vi.spyOn(originalMongoose, 'model').mockReturnValueOnce(mockMarqueurModel);

        vi.spyOn(Categorie, "findByIdAndDelete").mockResolvedValueOnce({
            _id: "123",
            nom: "Test Category",
            active: false
        });

        const req = mockReq({ body: { active: false }, params: { categorieId: "123" } });
        const res = mockRes();

        await categorieController.patchCategorieActive(req, res, mockNext);
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toContain("supprimée");
        expect(Categorie.findByIdAndDelete).toHaveBeenCalledWith("123");
    });

    it("200 et désactive la catégorie si elle est utilisée", async () => {
        // Mock du modèle Marqueur pour countDocuments (1 marqueur utilise cette catégorie)
        const mockMarqueurModel = {
            countDocuments: vi.fn().mockResolvedValueOnce(1)
        };
        
        // Mock mongoose.model pour retourner notre mock
        const originalMongoose = require('mongoose');
        vi.spyOn(originalMongoose, 'model').mockReturnValueOnce(mockMarqueurModel);

        vi.spyOn(Categorie, "findByIdAndUpdate").mockResolvedValueOnce({
            _id: "123",
            active: false
        });

        const req = mockReq({ body: { active: false }, params: { categorieId: "123" } });
        const res = mockRes();

        await categorieController.patchCategorieActive(req, res, mockNext);
        expect(res.statusCode).toBe(200);
        expect(res.body.data.active).toBe(false);
        expect(Categorie.findByIdAndUpdate).toHaveBeenCalledWith("123", { active: false }, { new: true, runValidators: true });
    });
})

describe("categorieController.patchCategorieOrdre", () => {
    it("400 si ordreCategories n'est pas un tableau", async () => {
        const req = mockReq({ body: { ordreCategories: "invalid" } });
        const res = mockRes();

        await categorieController.patchCategorieOrdre(req, res, mockNext);
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe("Bad Request");
    });

    it("400 si ordreCategories est un tableau vide", async () => {
        const req = mockReq({ body: { ordreCategories: [] } });
        const res = mockRes();

        await categorieController.patchCategorieOrdre(req, res, mockNext);
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe("Bad Request");
    });

    it("200 et met à jour l'ordre des catégories", async () => {
        const mockSession = {
            withTransaction: vi.fn(async (callback) => await callback()),
            endSession: vi.fn()
        };
        
        vi.spyOn(require("mongoose"), "startSession").mockResolvedValueOnce(mockSession);
        vi.spyOn(Categorie, "findByIdAndUpdate").mockResolvedValue({ _id: "123", ordre: 0 });
        vi.spyOn(Categorie, "find").mockReturnValue({
            sort: vi.fn().mockResolvedValue([
                { _id: "123", nom: "Cat1", ordre: 0 },
                { _id: "456", nom: "Cat2", ordre: 1 }
            ])
        });

        const req = mockReq({ body: { ordreCategories: ["123", "456"] } });
        const res = mockRes();

        await categorieController.patchCategorieOrdre(req, res, mockNext);
        expect(res.statusCode).toBe(200);
        expect(res.body.data).toHaveLength(2);
        expect(mockSession.endSession).toHaveBeenCalled();
    });
})