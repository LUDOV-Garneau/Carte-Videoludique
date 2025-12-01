
import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as marqueurController from './marqueurController.js'
import Marqueur from '../models/marqueur.js'

function mockRes() {
  return {
    statusCode: 200,
    body: null,
    headers: {},
    status (n) { this.statusCode = n; return this },
    json (o) { this.body = o; return this },
    location (path) { this.headers.Location = path; return this }
  }
}
function mockReq({body= {}, params = {}, originalUrl = 'api/test', admin = null} = {}) {
  return { body, params, originalUrl, marqueur: undefined, admin }
}
function mockNext() {
  const fn = vi.fn()
  return fn
}

beforeEach(() =>{
  vi.restoreAllMocks()
})

/* -------------------- createMarqueur -------------------- */
describe('MarqueurController.createMarqueur', () => {
  it('400 si paramètres requis manquants', async () => {
    const req = mockReq({ body: { titre: 'A', type: 'Autres', adresse: 'X' } }) // pas de description
    const res = mockRes()
    await marqueurController.createMarqueur(req, res, mockNext)
    expect(res.statusCode).toBe(400)
    expect(res.body.error).toBe('Bad Request')
  })

  it('201 + Location + payload + payload formaté si OK', async () => {
    vi.spyOn(Marqueur.prototype, 'save')
    .mockResolvedValue({ 
      titre: 'A',
      type: 'Lieu',
      adresse: '123 rue Exemple',
      description: 'Description du lieu',
      temoignage: 'Un témoignage',
      image: 'image.png',
      courriel: 'test@example.com',
      location: { type: 'Point', coordinates: [-73.5, 45.5] }
    })

    const req = mockReq({
      body: {
        titre: 'A',
        type: 'Lieu',
        adresse: '123 rue Exemple',
        description: 'Description du lieu',
        temoignage: 'Un témoignage',
        image: 'image.png',
        courriel: 'test@example.com',
        longitude: -73.5,
        latitude: 45.5
      }     
    })

    const res = mockRes()

    const next = mockNext()

    await marqueurController.createMarqueur(req, res, next)

    expect(res.statusCode).toBe(201)
    expect(res.body.status).toBe(201)
    expect(res.body.message).toBe("Le marqueur a été créé avec succès !")
    expect(res.body.data).toMatchObject({
      titre: 'A',
      type: 'Lieu',
      adresse: '123 rue Exemple',
      description: 'Description du lieu',
      temoignage: 'Un témoignage',
      image: 'image.png',
      courriel: 'test@example.com',
      location: { type: 'Point', coordinates: [-73.5, 45.5] }
    })
    expect(res.body.path).toBe(req.originalUrl)
    expect(new Date(res.body.timestamp).toISOString()).toBe(res.body.timestamp)
  })

  it('201 + status approved si admin connecté', async () => {
    const mockAdmin = { 
      _id: 'admin123', 
      nom: 'Admin Test', 
      courriel: 'admin@test.com' 
    }

    vi.spyOn(Marqueur.prototype, 'save')
    .mockResolvedValue({ 
      _id: 'marqueur123',
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-73.5, 45.5]
      },
      properties: {
        titre: 'Test Admin',
        type: 'Autres',
        adresse: '123 rue Admin',
        description: 'Description admin',
        temoignage: 'Témoignage admin',
        courriel: 'admin@test.com',
        images: [],
        status: 'approved',
        createdByName: 'Anonyme'
      }
    })

    const req = mockReq({
      body: {
        titre: 'Test Admin',
        description: 'Description admin',
        lng: -73.5,
        lat: 45.5
      },
      admin: mockAdmin
    })

    const res = mockRes()
    const next = mockNext()

    await marqueurController.createMarqueur(req, res, next)

    expect(res.statusCode).toBe(201)
    expect(res.body.status).toBe(201)
    expect(res.body.message).toBe("Le marqueur a été créé avec succès !")
    
    // Vérifier que le marqueur est créé avec le statut 'approved'
    const savedMarqueur = vi.mocked(Marqueur.prototype.save).mock.calls[0][0]
    expect(res.body.data.properties.status).toBe('approved')
  })
})

/* -------------------- getMarqueurs -------------------- */
describe('MarqueurController.getMarqueurs', () => {
  it('200 + liste marqueurs dans data', async () => {
    const list = [{id:1}, {id:2}]
    vi.spyOn(Marqueur, 'find').mockResolvedValue(list)
 
    const req = mockReq()
    const res = mockRes()
    const next = mockNext()

    await marqueurController.getMarqueurs(req, res, next)

    expect(res.statusCode).toBe(200)
    expect(res.body.status).toBe(200)
    expect(res.body.data).toEqual(list)
  })
})

/* -------------------- getMarqueur -------------------- */
describe('MarqueurController.getMarqueur', () => {
  it('200 + payload quand trouvé', async () => {
    const found = { _id: 'abc123', titre: 'A' }
    vi.spyOn(Marqueur, 'findById').mockResolvedValue(found)

    const req = mockReq({
      params: { marqueurId: 'abc123' },
      originalUrl: '/api/marqueurs/abc123'
    })
    const res = mockRes()
    const next = mockNext()

    await marqueurController.getMarqueur(req, res, next)

    expect(Marqueur.findById).toHaveBeenCalledWith('abc123')
    expect(next).not.toHaveBeenCalled()
    expect(res.statusCode).toBe(200)
    expect(res.body).toMatchObject({
      status: 200,
      message: 'Marqueur trouvé',
      data: found,
      path: '/api/marqueurs/abc123',
    })
  })

  it('404 si le marqueur n\'Est pas trouvé', async() => {
    vi.spyOn(Marqueur, 'findById').mockResolvedValue(null)
    
    const req = mockReq({
      params: { marqueurId: 'nope'},
      originalUrl: '/api/marqueurs/nope'
    })
    const res = mockRes()
    const next = mockNext()

    await marqueurController.getMarqueur(req, res, next)

    expect(Marqueur.findById).toHaveBeenCalledWith('nope')
    expect(next).not.toHaveBeenCalled()
    expect(res.statusCode).toBe(404)
    expect(res.body).toMatchObject({
      status: 404,
      error: 'Not Found',
      message: "Le marqueur spécifié n'existe pas",
      path: '/api/marqueurs/nope',
    })
  })
})

/* -------------------- updateMarqueur -------------------- */
describe('MarqueurController.updateMarqueur', () => {
  it('200 + payload mis à jour quand OK', async () => {
    const updated = {
      _id: 'abc123',
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-73.5, 45.5]
      },
      properties: {
        titre: 'Nouveau titre',
        type: 'Clubs vidéo',
        adresse: '123 rue Exemple',
        description: 'Desc',
        temoignage: 'Tem',
        image: 'img.png',
        status: 'pending'
      }
    }
    vi.spyOn(Marqueur, 'findByIdAndUpdate').mockResolvedValue(updated)

    const req = mockReq({
      params: { marqueurId: 'abc123' },
      originalUrl: '/api/marqueurs/abc123',
      body: {
        titre: 'Nouveau titre',
        type: 'Clubs vidéo',
        adresse: '123 rue Exemple',
        description: 'Desc',
        temoignage: 'Tem',
        image: 'img.png'
      }
    })
    const res = mockRes()
    const next = mockNext()

    await marqueurController.updateMarqueur(req, res, next)

    // Vérifier que findByIdAndUpdate utilise $set pour les champs imbriqués
    expect(Marqueur.findByIdAndUpdate).toHaveBeenCalledWith(
      'abc123',
      expect.objectContaining({
        $set: expect.objectContaining({
          'properties.titre': 'Nouveau titre',
          'properties.type': 'Clubs vidéo',
          'properties.adresse': '123 rue Exemple',
          'properties.description': 'Desc',
          'properties.temoignage': 'Tem',
          'properties.image': 'img.png'
        })
      }),
      { new: true, runValidators: true }
    )

    expect(next).not.toHaveBeenCalled()
    expect(res.statusCode).toBe(200)
    expect(res.body).toMatchObject({
      status: 200,
      message: 'Le marqueur a été mis à jour avec succès!',
      data: updated,
      path: '/api/marqueurs/abc123'
    })
  })

  it('404 si le marqueur n\'existe pas', async () => {
    vi.spyOn(Marqueur, 'findByIdAndUpdate').mockResolvedValue(null)

    const req = mockReq({
      params: { marqueurId: 'nope'},
      originalUrl: '/api/marqueurs/nope',
      body: { titre: 'X' }
    })
    const res = mockRes()
    const next = mockNext()

    await marqueurController.updateMarqueur(req, res, next)

    expect(Marqueur.findByIdAndUpdate).toHaveBeenCalled()
    expect(next).not.toHaveBeenCalled()
    expect(res.statusCode).toBe(404)
    expect(res.body).toMatchObject({
      status: 404,
      error: 'Not Found',
      message: "Le marqueur à mettre à jour n'existe pas",
      path: '/api/marqueurs/nope'
    })
  })

  it('next(err) si Mongoose jette une erreur (ex: ValidationError)', async () => {
    const boom = Object.assign(new Error('ValidationError'), { name: 'ValidationError' })
    vi.spyOn(Marqueur, 'findByIdAndUpdate').mockRejectedValue(boom)

    const req = mockReq({
      params: { marqueurId: 'abc123' },
      originalUrl: '/api/marqueurs/abc123',
      body: { titre: '' }
    })
    const res = mockRes()
    const next = mockNext()

    await marqueurController.updateMarqueur(req, res, next)

    expect(Marqueur.findByIdAndUpdate).toHaveBeenCalled()
    expect(next).toHaveBeenCalledTimes(1)
    expect(next).toHaveBeenCalledWith(boom)
  })
})

/* -------------------- updateStatusMarqueur -------------------- */
describe("MarqueurController.updateStatusMarqueur", () => {

  it("400 si statut invalide", async () => {
    const req = mockReq({
      params: { marqueurId: "abc123" },
      originalUrl: "/api/marqueurs/abc123/status",
      body: { status: "not-valid" }
    });
    const res = mockRes();
    const next = mockNext();

    await marqueurController.updateStatusMarqueur(req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res.body).toMatchObject({
      status: 400,
      error: "Bad Request",
      message: "Statut invalide.",
      path: "/api/marqueurs/abc123/status"
    });
    expect(next).not.toHaveBeenCalled();
  });

  /* -----------------------------------------------------------
     🔥 TESTS POUR LE CAS "rejected" → SUPPRESSION
  ----------------------------------------------------------- */

  it("404 si status = rejected mais le marqueur n'existe pas", async () => {
    vi.spyOn(Marqueur, "findByIdAndDelete").mockResolvedValue(null);

    const req = mockReq({
      params: { marqueurId: "nope" },
      originalUrl: "/api/marqueurs/nope/status",
      body: { status: "rejected" }
    });
    const res = mockRes();
    const next = mockNext();

    await marqueurController.updateStatusMarqueur(req, res, next);

    expect(Marqueur.findByIdAndDelete).toHaveBeenCalledWith("nope");

    expect(res.statusCode).toBe(404);
    expect(res.body).toMatchObject({
      status: 404,
      error: "Not Found",
      message: "Le marqueur à supprimer n'existe pas.",
      path: "/api/marqueurs/nope/status"
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("200 si status = rejected et suppression OK", async () => {
    const deleted = { _id: "abc123", properties: { status: "rejected" } };

    vi.spyOn(Marqueur, "findByIdAndDelete").mockResolvedValue(deleted);

    const req = mockReq({
      params: { marqueurId: "abc123" },
      originalUrl: "/api/marqueurs/abc123/status",
      body: { status: "rejected" }
    });
    const res = mockRes();
    const next = mockNext();

    await marqueurController.updateStatusMarqueur(req, res, next);

    expect(Marqueur.findByIdAndDelete).toHaveBeenCalledWith("abc123");

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      status: 200,
      message: "Marqueur supprimé (rejeté).",
      data: deleted,
      path: "/api/marqueurs/abc123/status"
    });
    expect(next).not.toHaveBeenCalled();
  });

  /* -----------------------------------------------------------
     🔥 TESTS POUR approved / pending
  ----------------------------------------------------------- */

  it("404 si findByIdAndUpdate retourne null", async () => {
    vi.spyOn(Marqueur, "findByIdAndUpdate").mockResolvedValue(null);

    const req = mockReq({
      params: { marqueurId: "nope" },
      originalUrl: "/api/marqueurs/nope/status",
      body: { status: "approved" }
    });
    const res = mockRes();
    const next = mockNext();

    await marqueurController.updateStatusMarqueur(req, res, next);

    expect(Marqueur.findByIdAndUpdate).toHaveBeenCalledWith(
      "nope",
      { $set: { "properties.status": "approved" } },
      { new: true, runValidators: true }
    );

    expect(res.statusCode).toBe(404);
    expect(res.body).toMatchObject({
      status: 404,
      error: "Not Found",
      message: "Le marqueur à mettre à jour n'existe pas.",
      path: "/api/marqueurs/nope/status"
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("200 quand mise à jour OK", async () => {
    const updated = {
      _id: "abc123",
      properties: { status: "approved" }
    };

    vi.spyOn(Marqueur, "findByIdAndUpdate").mockResolvedValue(updated);

    const req = mockReq({
      params: { marqueurId: "abc123" },
      originalUrl: "/api/marqueurs/abc123/status",
      body: { status: "approved" }
    });
    const res = mockRes();
    const next = mockNext();

    await marqueurController.updateStatusMarqueur(req, res, next);

    expect(Marqueur.findByIdAndUpdate).toHaveBeenCalledWith(
      "abc123",
      { $set: { "properties.status": "approved" } },
      { new: true, runValidators: true }
    );

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      status: 200,
      message: "Statut mis à jour vers 'approved'",
      data: updated,
      path: "/api/marqueurs/abc123/status"
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("next(err) si Mongoose rejette (approved / pending)", async () => {
    const error = new Error("DB failure");
    vi.spyOn(Marqueur, "findByIdAndUpdate").mockRejectedValue(error);

    const req = mockReq({
      params: { marqueurId: "abc123" },
      originalUrl: "/api/marqueurs/abc123/status",
      body: { status: "approved" }
    });
    const res = mockRes();
    const next = mockNext();

    await marqueurController.updateStatusMarqueur(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("next(err) si Mongoose rejette (rejected)", async () => {
    const error = new Error("DB failure");
    vi.spyOn(Marqueur, "findByIdAndDelete").mockRejectedValue(error);

    const req = mockReq({
      params: { marqueurId: "abc123" },
      originalUrl: "/api/marqueurs/abc123/status",
      body: { status: "rejected" }
    });
    const res = mockRes();
    const next = mockNext();

    await marqueurController.updateStatusMarqueur(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

});

/* -------------------- deleteMarqueur -------------------- */
describe('MarqueurController.deleteMarqueur', () => {
  it('200 + payload supprimé quand OK', async () => {
    const deleted = { _id: 'abc123', titre: 'A' }
    vi.spyOn(Marqueur, 'findByIdAndDelete').mockResolvedValue(deleted)
    
    const req = mockReq({
      params: { marqueurId: 'abc123' },
      originalUrl: '/api/marqueurs/abc123'
    })
    const res = mockRes()
    const next = mockNext()

    await marqueurController.deleteMarqueur(req, res, next)

    expect(Marqueur.findByIdAndDelete).toHaveBeenCalledWith('abc123')
    expect(next).not.toHaveBeenCalled()
    expect(res.statusCode).toBe(200)
    expect(res.body).toMatchObject({
      status: 200,
      message: 'Le marqueur a été supprimé avec succès!',
      data: deleted,
      path: '/api/marqueurs/abc123',
    })
  })

  it("404 si le marqueur n'existe pas", async () => {
    vi.spyOn(Marqueur, 'findByIdAndDelete').mockResolvedValue(null)

    const req = mockReq({
      params: { marqueurId: 'nope' },
      originalUrl: '/api/marqueurs/nope'
    })
    const res = mockRes()
    const next = mockNext()

    await marqueurController.deleteMarqueur(req, res, next)

    expect(Marqueur.findByIdAndDelete).toHaveBeenCalledWith('nope')
    expect(next).not.toHaveBeenCalled()
    expect(res.statusCode).toBe(404)
    expect(res.body).toMatchObject({
      status: 404,
      error: 'Not Found',
      message: "Le marqueur à supprimer n'existe pas",
      path: '/api/marqueurs/nope',
    })
  })

  it('next(err) si Mongoose jette une erreur', async () => {
    const boom = new Error('CastError: invalid ObjectId')
    vi.spyOn(Marqueur, 'findByIdAndDelete').mockRejectedValue(boom)

    const req = mockReq({
      params: { marqueurId: '!!!' },
      originalUrl: '/api/marqueurs/!!!'
    })
    const res = mockRes()
    const next = mockNext()

    await marqueurController.deleteMarqueur(req, res, next)

    expect(Marqueur.findByIdAndDelete).toHaveBeenCalledWith('!!!')
    expect(next).toHaveBeenCalledTimes(1)
    expect(next).toHaveBeenCalledWith(boom)
  })
})

/* -------------------- addComment -------------------- */
describe('MarqueurController.addCommentMarqueur', () => {
  it('next(err) si une erreur survient', async () => {
    const boom = new Error('Erreur Mongo');

    const findSpy = vi.spyOn(Marqueur, 'findById').mockRejectedValue(boom);

    const req = mockReq({
      params: { marqueurId: '123' },
      body: { auteur: 'Fred', texte: 'test' },
      originalUrl: '/api/marqueurs/123/commentaires'
    });
    const res = mockRes();
    const next = vi.fn();

    await marqueurController.addCommentMarqueur(req, res, next);

    await new Promise(process.nextTick);

    expect(findSpy).toHaveBeenCalledTimes(1);
    expect(findSpy).toHaveBeenCalledWith('123');
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(boom);
  });
});



/* -------------------- deleteComment -------------------- */
describe('MarqueurController.deleteCommentMarqueur', () => {
  it('404 si le marqueur n’existe pas', async () => {
    vi.spyOn(Marqueur, 'findById').mockResolvedValue(null)

    const req = mockReq({
      params: { marqueurId: 'nope', commentId: '999' },
      originalUrl: '/api/marqueurs/nope/commentaires/999'
    })
    const res = mockRes()
    const next = mockNext()

    await marqueurController.deleteCommentMarqueur(req, res, next)

    expect(Marqueur.findById).toHaveBeenCalledWith('nope')
    expect(res.statusCode).toBe(404)
    expect(res.body).toMatchObject({
      status: 404,
      error: 'Not Found',
      message: "Le marqueur spécifié n'existe pas.",
      path: '/api/marqueurs/nope/commentaires/999'
    })
  })

  it('404 si le commentaire n’existe pas', async () => {
    const marqueur = {
      _id: 'abc123',
      comments: [{ _id: 'a1', texte: 'Ancien commentaire' }],
      save: vi.fn()
    }

    vi.spyOn(Marqueur, 'findById').mockResolvedValue(marqueur)

    const req = mockReq({
      params: { marqueurId: 'abc123', commentId: 'b2' },
      originalUrl: '/api/marqueurs/abc123/commentaires/b2'
    })
    const res = mockRes()
    const next = mockNext()

    await marqueurController.deleteCommentMarqueur(req, res, next)

    expect(res.statusCode).toBe(404)
    expect(res.body).toMatchObject({
      status: 404,
      error: 'Not Found',
      message: "Le commentaire spécifié n'existe pas.",
      path: '/api/marqueurs/abc123/commentaires/b2'
    })
  })

  it('200 + succès quand le commentaire est supprimé', async () => {
    const marqueur = {
      _id: 'abc123',
      comments: [{ _id: 'a1', texte: 'À supprimer' }],
      save: vi.fn().mockResolvedValue(true)
    }

    vi.spyOn(Marqueur, 'findById').mockResolvedValue(marqueur)

    const req = mockReq({
      params: { marqueurId: 'abc123', commentId: 'a1' },
      originalUrl: '/api/marqueurs/abc123/commentaires/a1'
    })
    const res = mockRes()
    const next = mockNext()

    await marqueurController.deleteCommentMarqueur(req, res, next)

    expect(Marqueur.findById).toHaveBeenCalledWith('abc123')
    expect(marqueur.save).toHaveBeenCalled()
    expect(res.statusCode).toBe(200)
    expect(res.body.status).toBe(200)
    expect(res.body.message).toBe('Témoignage supprimé avec succès.')
  })

  it('next(err) si une erreur survient', async () => {
    const boom = new Error('Erreur Mongo')
    vi.spyOn(Marqueur, 'findById').mockRejectedValue(boom)

    const req = mockReq({
      params: { marqueurId: 'abc123', commentId: 'a1' }
    })
    const res = mockRes()
    const next = mockNext()

    await marqueurController.deleteCommentMarqueur(req, res, next)

    expect(next).toHaveBeenCalledWith(boom)
  })
})

/* -------------------- addComment -------------------- */
describe('MarqueurController.addCommentMarqueur', () => {

  it('400 si texte manquant', async () => {
    const req = mockReq({
      params: { marqueurId: '123' },
      body: { auteur: 'Fred', texte: '' },
      originalUrl: '/api/marqueurs/123/commentaires'
    })
    const res = mockRes()
    const next = mockNext()

    await marqueurController.addCommentMarqueur(req, res, next)

    expect(res.statusCode).toBe(400)
    expect(res.body).toMatchObject({
      status: 400,
      error: 'Bad Request',
      message: 'Le contenu du témoignage est requis.',
      path: '/api/marqueurs/123/commentaires'
    })
    expect(next).not.toHaveBeenCalled()
  })

  it('404 si le marqueur est introuvable', async () => {
    vi.spyOn(Marqueur, 'findById').mockResolvedValue(null)

    const req = mockReq({
      params: { marqueurId: '999' },
      body: { auteur: 'Fred', texte: 'Salut' },
      originalUrl: '/api/marqueurs/999/commentaires'
    })
    const res = mockRes()
    const next = mockNext()

    await marqueurController.addCommentMarqueur(req, res, next)

    expect(res.statusCode).toBe(404)
    expect(res.body).toMatchObject({
      status: 404,
      error: 'Not Found',
      message: "Le marqueur spécifié n'existe pas.",
      path: '/api/marqueurs/999/commentaires'
    })
    expect(next).not.toHaveBeenCalled()
  })

  it('201 + commentaire ajouté quand OK', async () => {
    const mockSave = vi.fn().mockResolvedValue(true)

    const marqueur = {
      _id: 'abc123',
      properties: { comments: [] },
      save: mockSave
    }

    vi.spyOn(Marqueur, 'findById').mockResolvedValue(marqueur)

    const req = mockReq({
      params: { marqueurId: 'abc123' },
      body: { auteur: 'Fred', texte: 'Un beau souvenir' },
      originalUrl: '/api/marqueurs/abc123/commentaires'
    })
    const res = mockRes()
    const next = mockNext()

    await marqueurController.addCommentMarqueur(req, res, next)

    expect(mockSave).toHaveBeenCalled()
    expect(res.statusCode).toBe(201)
    expect(res.body).toMatchObject({
      status: 201,
      message: "Témoignage ajouté et en attente d'approbation.",
      path: '/api/marqueurs/abc123/commentaires'
    })
    expect(res.body.data).toMatchObject({
      auteur: 'Fred',
      contenu: 'Un beau souvenir',
      status: 'pending'
    })
    expect(next).not.toHaveBeenCalled()
  })

  it('next(err) si une erreur survient', async () => {
    const boom = new Error('Erreur Mongo')

    const findSpy = vi.spyOn(Marqueur, 'findById').mockRejectedValue(boom)

    const req = mockReq({
      params: { marqueurId: '123' },
      body: { auteur: 'Fred', texte: 'test' },
      originalUrl: '/api/marqueurs/123/commentaires'
    })
    const res = mockRes()
    const next = vi.fn()

    await marqueurController.addCommentMarqueur(req, res, next)

    await new Promise(process.nextTick)

    expect(findSpy).toHaveBeenCalledWith('123')
    expect(next).toHaveBeenCalledWith(boom)
  })
})
