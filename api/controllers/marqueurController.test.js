
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
function mockReq({body= {}, params = {}, originalUrl = 'api/test'} = {}) {
  return { body, params, originalUrl, marqueur: undefined }
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
    const req = mockReq({ body: { titre: 'A', type: 'Lieu', adresse: 'X' } }) // pas de long/lat
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
      titre: 'Nouveau titre',
      type: 'Lieu',
      adresse: '123 rue Exemple',
      description: 'Desc',
      temoignage: 'Tem',
      image: 'img.png'
    }
    vi.spyOn(Marqueur, 'findByIdAndUpdate').mockResolvedValue(updated)

    const req = mockReq({
      params: { marqueurId: 'abc123' },
      originalUrl: '/api/marqueurs/abc123',
      body: {
        titre: 'Nouveau titre',
        description: 'Desc'
      }
    })
    const res = mockRes()
    const next = mockNext()

    await marqueurController.updateMarqueur(req, res, next)

    expect(Marqueur.findByIdAndUpdate).toHaveBeenCalledWith(
      'abc123',
      expect.objectContaining({ titre: 'Nouveau titre', description: 'Desc' }),
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