import { describe, it, expect, beforeEach, vi } from "vitest"
import * as marqueurController from "./marqueurController.js"
import Marqueur from "../models/marqueur.js"

/* -----------------------------------------------------------
   HELPERS
----------------------------------------------------------- */
function mockRes() {
  return {
    statusCode: 200,
    body: null,
    headers: {},
    status(n) { this.statusCode = n; return this },
    json(o) { this.body = o; return this },
    location(path) { this.headers.Location = path; return this }
  }
}

function mockReq({ body = {}, params = {}, originalUrl = "api/test", admin = null } = {}) {
  return { body, params, originalUrl, admin }
}

function mockNext() {
  return vi.fn()
}

beforeEach(() => {
  vi.restoreAllMocks()
})

/* -----------------------------------------------------------
   createMarqueur
----------------------------------------------------------- */
describe("MarqueurController.createMarqueur", () => {
  it("400 si titre/description manquants", async () => {
    const req = mockReq({ body: { titre: "A" } })
    const res = mockRes()

    await marqueurController.createMarqueur(req, res, mockNext())

    expect(res.statusCode).toBe(400)
    expect(res.body.error).toBe("Bad Request")
  })

  it("201 + creation OK", async () => {
    vi.spyOn(Marqueur.prototype, "save").mockResolvedValue({
      _id: "123",
      titre: "A"
    })

    const req = mockReq({
      body: { titre: "A", description: "test", lat: 45.5, lng: -73.5 }
    })
    const res = mockRes()

    await marqueurController.createMarqueur(req, res, mockNext())

    expect(res.statusCode).toBe(201)
    expect(res.body.status).toBe(201)
  })

  it("admin → status=approved", async () => {
    vi.spyOn(Marqueur.prototype, "save").mockResolvedValue({
      _id: "123",
      properties: { status: "approved" }
    })

    const req = mockReq({
      body: { titre: "A", description: "B", lat: 0, lng: 0 },
      admin: {}
    })
    const res = mockRes()

    await marqueurController.createMarqueur(req, res, mockNext())

    expect(res.body.data.properties.status).toBe("approved")
  })
})

/* -----------------------------------------------------------
   getMarqueurs
----------------------------------------------------------- */
describe("MarqueurController.getMarqueurs", () => {
  it("200 + retourne la liste", async () => {
    const fake = [
      { properties: { comments: [] } }
    ]

    vi.spyOn(Marqueur, "find").mockResolvedValue(fake)

    const req = mockReq()
    const res = mockRes()

    await marqueurController.getMarqueurs(req, res, mockNext())

    expect(res.statusCode).toBe(200)
    expect(res.body.data).toEqual(fake)
  })
})

/* -----------------------------------------------------------
   getMarqueur
----------------------------------------------------------- */
describe("MarqueurController.getMarqueur", () => {
  it("200 si trouvé", async () => {
    const obj = { _id: "1", properties: { comments: [] } }
    vi.spyOn(Marqueur, "findById").mockResolvedValue(obj)

    const req = mockReq({ params: { marqueurId: "1" } })
    const res = mockRes()

    await marqueurController.getMarqueur(req, res, mockNext())

    expect(res.statusCode).toBe(200)
    expect(res.body.data).toBe(obj)
  })

  it("404 si introuvable", async () => {
    vi.spyOn(Marqueur, "findById").mockResolvedValue(null)

    const req = mockReq({ params: { marqueurId: "999" } })
    const res = mockRes()

    await marqueurController.getMarqueur(req, res, mockNext())

    expect(res.statusCode).toBe(404)
  })
})

/* -----------------------------------------------------------
   updateMarqueur
----------------------------------------------------------- */
describe("MarqueurController.updateMarqueur", () => {
  it("200 si update OK", async () => {
    const updated = { _id: "abc", properties: { titre: "Nouveau" } }

    vi.spyOn(Marqueur, "findByIdAndUpdate").mockResolvedValue(updated)

    const req = mockReq({
      params: { marqueurId: "abc" },
      body: { titre: "Nouveau" }
    })
    const res = mockRes()

    await marqueurController.updateMarqueur(req, res, mockNext())

    expect(res.statusCode).toBe(200)
    expect(res.body.data).toBe(updated)
  })

  it("404 si update impossible", async () => {
    vi.spyOn(Marqueur, "findByIdAndUpdate").mockResolvedValue(null)

    const req = mockReq({ params: { marqueurId: "nope" }, body: { titre: "X" } })
    const res = mockRes()

    await marqueurController.updateMarqueur(req, res, mockNext())

    expect(res.statusCode).toBe(404)
  })
})

/* -----------------------------------------------------------
   updateStatusMarqueur
----------------------------------------------------------- */
describe("MarqueurController.updateStatusMarqueur", () => {
  it("400 si statut invalide", async () => {
    const req = mockReq({ params: { marqueurId: "1" }, body: { status: "wrong" } })
    const res = mockRes()

    await marqueurController.updateStatusMarqueur(req, res, mockNext())

    expect(res.statusCode).toBe(400)
  })

  it("404 si rejected mais marqueur inexistant", async () => {
    vi.spyOn(Marqueur, "findByIdAndUpdate").mockResolvedValue(null)

    const req = mockReq({ params: { marqueurId: "nope" }, body: { status: "rejected" } })
    const res = mockRes()

    await marqueurController.updateStatusMarqueur(req, res, mockNext())

    expect(res.statusCode).toBe(404)
  })

  it("200 si rejected archive", async () => {
    const obj = { _id: "abc", archived: true }
    vi.spyOn(Marqueur, "findByIdAndUpdate").mockResolvedValue(obj)

    const req = mockReq({ params: { marqueurId: "abc" }, body: { status: "rejected" } })
    const res = mockRes()

    await marqueurController.updateStatusMarqueur(req, res, mockNext())

    expect(res.statusCode).toBe(200)
    expect(res.body.data).toBe(obj)
  })

  it("200 si approved update OK", async () => {
    const obj = { _id: "abc", properties: { status: "approved" } }
    vi.spyOn(Marqueur, "findByIdAndUpdate").mockResolvedValue(obj)

    const req = mockReq({ params: { marqueurId: "abc" }, body: { status: "approved" } })
    const res = mockRes()

    await marqueurController.updateStatusMarqueur(req, res, mockNext())

    expect(res.statusCode).toBe(200)
  })
})

/* -----------------------------------------------------------
   addCommentMarqueur
----------------------------------------------------------- */
describe("MarqueurController.addCommentMarqueur", () => {
  it("400 si texte manquant", async () => {
    const req = mockReq({ params: { marqueurId: "1" }, body: { texte: "" } })
    const res = mockRes()

    await marqueurController.addCommentMarqueur(req, res, mockNext())

    expect(res.statusCode).toBe(400)
  })

  it("404 si marqueur inexistant", async () => {
    vi.spyOn(Marqueur, "findById").mockResolvedValue(null)

    const req = mockReq({ params: { marqueurId: "1" }, body: { texte: "Salut" } })
    const res = mockRes()

    await marqueurController.addCommentMarqueur(req, res, mockNext())

    expect(res.statusCode).toBe(404)
  })

  it("201 si commentaire ajouté", async () => {
    const mockSave = vi.fn().mockResolvedValue(true)
    const mockDoc = { properties: { comments: [] }, save: mockSave }

    vi.spyOn(Marqueur, "findById").mockResolvedValue(mockDoc)

    const req = mockReq({ params: { marqueurId: "1" }, body: { texte: "Test" } })
    const res = mockRes()

    await marqueurController.addCommentMarqueur(req, res, mockNext())

    expect(res.statusCode).toBe(201)
  })
})

/* -----------------------------------------------------------
   archiveCommentaire
----------------------------------------------------------- */
describe("MarqueurController.archiveCommentaire", () => {
  it("404 si marqueur introuvable", async () => {
    vi.spyOn(Marqueur, "findById").mockResolvedValue(null)

    const req = mockReq({ params: { marqueurId: "nope", commentId: "c1" } })
    const res = mockRes()

    await marqueurController.archiveCommentaire(req, res, mockNext())

    expect(res.statusCode).toBe(404)
  })

  it("404 si commentaire introuvable", async () => {
    const doc = { properties: { comments: { id: () => null } } }
    vi.spyOn(Marqueur, "findById").mockResolvedValue(doc)

    const req = mockReq({ params: { marqueurId: "1", commentId: "x" } })
    const res = mockRes()

    await marqueurController.archiveCommentaire(req, res, mockNext())

    expect(res.statusCode).toBe(404)
  })

  it("200 si archivé", async () => {
    const comment = { archived: false }
    const doc = {
      properties: { comments: { id: () => comment }},
      save: vi.fn().mockResolvedValue(true)
    }

    vi.spyOn(Marqueur, "findById").mockResolvedValue(doc)

    const req = mockReq({ params: { marqueurId: "1", commentId: "c1" } })
    const res = mockRes()

    await marqueurController.archiveCommentaire(req, res, mockNext())

    expect(comment.archived).toBe(true)
    expect(doc.save).toHaveBeenCalled()
    expect(res.statusCode).toBe(200)
  })
})

/* -----------------------------------------------------------
   restoreCommentaire
----------------------------------------------------------- */
describe("MarqueurController.restoreCommentaire", () => {
  it("404 si marqueur introuvable", async () => {
    vi.spyOn(Marqueur, "findById").mockResolvedValue(null)

    const req = mockReq({ params: { marqueurId: "x", commentId: "c1" } })
    const res = mockRes()

    await marqueurController.restoreCommentaire(req, res, mockNext())

    expect(res.statusCode).toBe(404)
  })

  it("404 si commentaire introuvable", async () => {
    const doc = { properties: { comments: { id: () => null } } }
    vi.spyOn(Marqueur, "findById").mockResolvedValue(doc)

    const req = mockReq({ params: { marqueurId: "1", commentId: "x" } })
    const res = mockRes()

    await marqueurController.restoreCommentaire(req, res, mockNext())

    expect(res.statusCode).toBe(404)
  })

  it("200 si restauré", async () => {
    const comment = { archived: true }
    const doc = {
      properties: { comments: { id: () => comment }},
      save: vi.fn().mockResolvedValue(true)
    }

    vi.spyOn(Marqueur, "findById").mockResolvedValue(doc)

    const req = mockReq({ params: { marqueurId: "1", commentId: "c1" } })
    const res = mockRes()

    await marqueurController.restoreCommentaire(req, res, mockNext())

    expect(comment.archived).toBe(false)
    expect(doc.save).toHaveBeenCalled()
    expect(res.statusCode).toBe(200)
  })
})

/* -----------------------------------------------------------
   archiveMarqueur
----------------------------------------------------------- */
describe("MarqueurController.archiveMarqueur", () => {
  it("404 si introuvable", async () => {
    vi.spyOn(Marqueur, "findByIdAndUpdate").mockResolvedValue(null)

    const req = mockReq({ params: { marqueurId: "nope" } })
    const res = mockRes()

    await marqueurController.archiveMarqueur(req, res, mockNext())

    expect(res.statusCode).toBe(404)
  })

  it("200 si archivé", async () => {
    const obj = { _id: "abc", archived: true }
    vi.spyOn(Marqueur, "findByIdAndUpdate").mockResolvedValue(obj)

    const req = mockReq({ params: { marqueurId: "abc" } })
    const res = mockRes()

    await marqueurController.archiveMarqueur(req, res, mockNext())

    expect(res.statusCode).toBe(200)
    expect(res.body.data).toBe(obj)
  })
})

/* -----------------------------------------------------------
   restoreMarqueur
----------------------------------------------------------- */
describe("MarqueurController.restoreMarqueur", () => {
  it("404 si introuvable", async () => {
    vi.spyOn(Marqueur, "findByIdAndUpdate").mockResolvedValue(null)

    const req = mockReq({ params: { marqueurId: "nope" } })
    const res = mockRes()

    await marqueurController.restoreMarqueur(req, res, mockNext())

    expect(res.statusCode).toBe(404)
  })

  it("200 si restauré", async () => {
    const obj = { _id: "abc", archived: false }
    vi.spyOn(Marqueur, "findByIdAndUpdate").mockResolvedValue(obj)

    const req = mockReq({ params: { marqueurId: "abc" } })
    const res = mockRes()

    await marqueurController.restoreMarqueur(req, res, mockNext())

    expect(res.statusCode).toBe(200)
    expect(res.body.data).toBe(obj)
  })
})

/* -----------------------------------------------------------
   getArchivedMarqueurs
----------------------------------------------------------- */
describe("MarqueurController.getArchivedMarqueurs", () => {
  it("200 retourne liste", async () => {
    const list = [{ _id: "1", archived: true }]
    vi.spyOn(Marqueur, "find").mockResolvedValue(list)

    const req = mockReq()
    const res = mockRes()

    await marqueurController.getArchivedMarqueurs(req, res, mockNext())

    expect(res.statusCode).toBe(200)
    expect(res.body.data).toEqual(list)
  })
})

/* -----------------------------------------------------------
   deleteMarqueurDefinitif
----------------------------------------------------------- */
describe("MarqueurController.deleteMarqueurDefinitif", () => {
  it("404 si introuvable", async () => {
    vi.spyOn(Marqueur, "findByIdAndDelete").mockResolvedValue(null)

    const req = mockReq({ params: { marqueurId: "nope" } })
    const res = mockRes()

    await marqueurController.deleteMarqueurDefinitif(req, res, mockNext())

    expect(res.statusCode).toBe(404)
  })

  it("200 si supprimé", async () => {
    const obj = { _id: "abc" }
    vi.spyOn(Marqueur, "findByIdAndDelete").mockResolvedValue(obj)

    const req = mockReq({ params: { marqueurId: "abc" } })
    const res = mockRes()

    await marqueurController.deleteMarqueurDefinitif(req, res, mockNext())

    expect(res.statusCode).toBe(200)
    expect(res.body.data).toBe(obj)
  })
})
