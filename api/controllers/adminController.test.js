'use strict'

import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as adminController from './adminController.js'       
import Admin from '../models/admin.js'                          
import bcrypt from 'bcrypt'

function mockRes() {
  return {
    statusCode: 200,
    body: null,
    status(n) { this.statusCode = n; return this },
    json(obj) { this.body = obj; return this },
  }
}
function mockReq(body = {}, params = {}, originalUrl = '/api/test') {
  return { body, params, originalUrl, admin: undefined }
}
function mockNext() {
  const fn = vi.fn()
  return fn
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.SECRET_JWT = 'test-secret' 
})

/* ---------- SIGNUP ---------- */
describe('AdminController.signup', () => {
  it('400 si champs manquants', async () => {
    const req = mockReq({ nom:'A', prenom:'B', courriel:'a@b.com',role:'Gestionnaire', mdp:'x' /* mdp2 manquant */ })
    const res = mockRes()
    const next = mockNext()

    await adminController.signup(req, res, next)

    expect(res.statusCode).toBe(400)
    expect(res.body).toMatchObject({
      status: 400,
      error: 'Bad Request',
      message: 'Tous les champs sont requis.',
      path: req.originalUrl
    })
  })

  it('400 si mdp !== mdp2', async () => {
    const req = mockReq({ nom:'A', prenom:'B', courriel:'a@b.com',role:'Gestionnaire', mdp:'x', mdp2:'y' })
    const res = mockRes()
    const next = mockNext()

    await adminController.signup(req, res, next)

    expect(res.statusCode).toBe(400)
    expect(res.body.message).toBe('Les mots de passe ne correspondent pas.')
  })

  it('409 si admin existe déjà', async () => {
    vi.spyOn(Admin, 'findOne').mockResolvedValue({ _id: 'exists' })

    const req = mockReq({ nom:'A', prenom:'B', courriel:'a@b.com',role:'Gestionnaire', mdp:'x', mdp2:'x' })
    const res = mockRes()
    const next = mockNext()

    await adminController.signup(req, res, next)

    expect(Admin.findOne).toHaveBeenCalledWith({ courriel: 'a@b.com' })
    expect(res.statusCode).toBe(409)
    expect(res.body.error).toBe('Conflict')
  })
  it('201 et retourne admin créé (format standard)', async () => {
    vi.spyOn(Admin, 'findOne').mockResolvedValue(null)
    vi.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-x')
    // mock du save de l’instance
    vi.spyOn(Admin.prototype, 'save').mockResolvedValue(undefined)

    const req = mockReq({ nom:'A', prenom:'B', courriel:'a@b.com', role:'Gestionnaire', mdp:'x', mdp2:'x' })
    const res = mockRes()
    const next = mockNext()

    await adminController.signup(req, res, next)

    expect(bcrypt.hash).toHaveBeenCalledWith('x', 12)
    expect(res.statusCode).toBe(201)
    // ⚠️ attend le format: status, message (texte), data (objet admin), path, timestamp
    expect(res.body.status).toBe(201)
    expect(res.body.message).toBe('Administrateur créé !') // ← nécessite la correction dans ton controller
    expect(res.body.data).toMatchObject({
      nom: 'A',
      prenom: 'B',
      courriel: 'a@b.com',
      role:'Gestionnaire',
      motDePasse: 'hashed-x',
    })
    expect(res.body.path).toBe(req.originalUrl)
    expect(new Date(res.body.timestamp).toISOString()).toBe(res.body.timestamp)
  })
})

/* ---------- LOGIN ---------- */
describe('AdminController.login', () => {
  it('401 si admin introuvable', async () => {
    vi.spyOn(Admin, 'findOne').mockResolvedValue(null)

    const req = mockReq({ courriel:'no@x.com', mdp:'x' })
    const res = mockRes()
    const next = mockNext()

    await adminController.login(req, res, next)

    expect(res.statusCode).toBe(401)
    expect(res.body.error).toBe('Unauthorized')
  })

  it('401 si mot de passe invalide', async () => {
    vi.spyOn(Admin, 'findOne').mockResolvedValue({ motDePasse: 'hash' })
    vi.spyOn(bcrypt, 'compare').mockResolvedValue(false)

    const req = mockReq({ courriel:'a@b.com', mdp:'x' })
    const res = mockRes()
    const next = mockNext()

    await adminController.login(req, res, next)

    expect(bcrypt.compare).toHaveBeenCalled()
    expect(res.statusCode).toBe(401)
    expect(res.body.message).toBe('Courriel ou mot de passe invalide')
  })

  it('200 + token au format standardisé', async () => {
    const admin = { courriel:'a@b.com', nom:'A', prenom:'B', id:'123', motDePasse:'hash' }
    vi.spyOn(Admin, 'findOne').mockResolvedValue(admin)
    vi.spyOn(bcrypt, 'compare').mockResolvedValue(true)

    const req = mockReq({ courriel:'a@b.com', mdp:'x' })
    const res = mockRes()
    const next = mockNext()

    await adminController.login(req, res, next)

    expect(res.statusCode).toBe(200)
    expect(res.body).toMatchObject({
      status: 200,
      message: 'Authentifié',
      path: req.originalUrl,
    })
  
    expect(typeof res.body.data?.token).toBe('string')

    expect(res.body.data.token).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/)

    const { default: jwt } = await import('jsonwebtoken')
    const decoded = jwt.decode(res.body.data.token)
    expect(decoded).toMatchObject({
      courriel: 'a@b.com',
      nom: 'A',
      prenom: 'B',
      id: '123',
    })
  })
})

/* ---------- GET ADMINS ---------- */
describe('AdminController.getAdmins', () => {
  it('200 + liste admins dans data', async () => {
    const list = [{ id:1 }, { id:2 }]
    vi.spyOn(Admin, 'find').mockResolvedValue(list)

    const req = mockReq()
    const res = mockRes()
    const next = mockNext()

    await adminController.getAdmins(req, res, next)

    expect(res.statusCode).toBe(200)
    expect(res.body.status).toBe(200)
    expect(res.body.data).toEqual(list)
  })
})

/* ---------- GET ADMIN (propriétaire uniquement) ---------- */
describe('AdminController.getAdmin', () => {
  it('200 quand l’admin connecté correspond à :adminId', async () => {
    const req = mockReq({}, { adminId: '42' })
    req.admin = { id: '42', nom: 'Alice' }

    const res = mockRes()
    const next = mockNext()

    await adminController.getAdmin(req, res, next)

    expect(res.statusCode).toBe(200)
    expect(res.body.message).toBe("L'administrateur est trouvé")
    expect(res.body.data).toMatchObject({ id: '42', nom: 'Alice' })
  })

  it('403 sinon', async () => {
    const req = mockReq({}, { adminId: '99' })
    req.admin = { id: '42', nom: 'Alice' }

    const res = mockRes()
    const next = mockNext()

    await adminController.getAdmin(req, res, next)

    expect(res.statusCode).toBe(403)
    expect(res.body.error).toBe('Forbidden')
  })
})





