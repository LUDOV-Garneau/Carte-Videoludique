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