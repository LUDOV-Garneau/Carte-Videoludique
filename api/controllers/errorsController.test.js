'use strict'
import { describe, it, expect, beforeEach } from 'vitest'

// ⚠️ adapte le chemin si besoin
import * as errorController from './errorsController.js'

function mockRes() {
  return {
    statusCode: 200,
    body: null,
    status(n) { this.statusCode = n; return this },
    json(obj) { this.body = obj; return this },
  }
}
function mockReq(url = '/api/test') {
  return { originalUrl: url }
}

beforeEach(() => {
  // rien pour l’instant
})

describe('get404', () => {
  it('retourne une réponse 404 formatée', () => {
    const req = mockReq('/api/unknown')
    const res = mockRes()

    errorController.get404(req, res, () => {})

    expect(res.statusCode).toBe(404)
    expect(res.body).toMatchObject({
      status: 404,
      error: 'Not Found',
      message: 'La ressource demandée est introuvable.',
      path: '/api/unknown',
    })
    // timestamp ISO
    expect(new Date(res.body.timestamp).toISOString()).toBe(res.body.timestamp)
  })
})

describe('getErrors', () => {
  it('500 par défaut avec message générique', () => {
    const err = new Error('Boom')
    const req = mockReq('/api/crash')
    const res = mockRes()

    errorController.getErrors(err, req, res, () => {})

    expect(res.statusCode).toBe(500)
    expect(res.body).toMatchObject({
      status: 500,
      error: 'Internal Server Error',
      message: 'Boom',
      path: '/api/crash',
    })
  })

  it('utilise err.statusCode si présent', () => {
    const err = new Error('Oops')
    err.statusCode = 418 // I’m a teapot
    const req = mockReq('/api/teapot')
    const res = mockRes()

    errorController.getErrors(err, req, res, () => {})

    expect(res.statusCode).toBe(418)
    expect(res.body.status).toBe(418)
    expect(res.body.message).toBe('Oops')
    expect(res.body.error).toBe('Internal Server Error') // tu gardes ce label par défaut
  })

  it('CastError (ObjectId invalide) → 404 Not Found', () => {
    const err = {
      name: 'CastError',
      kind: 'ObjectId',
      value: 'bad-id-123',
      message: 'Cast to ObjectId failed'
    }
    const req = mockReq('/api/admins/bad-id-123')
    const res = mockRes()

    errorController.getErrors(err, req, res, () => {})

    expect(res.statusCode).toBe(404)
    expect(res.body).toMatchObject({
      status: 404,
      error: 'Not Found',
      message: "L'id fourni est invalide ou n'existe pas : bad-id-123",
      path: '/api/admins/bad-id-123',
    })
  })

  it('ValidationError → 400 Bad Request avec messages agrégés', () => {
    const err = {
      name: 'ValidationError',
      errors: {
        nom: { message: 'Nom requis' },
        courriel: { message: 'Courriel invalide' },
      }
    }
    const req = mockReq('/api/admins')
    const res = mockRes()

    errorController.getErrors(err, req, res, () => {})

    expect(res.statusCode).toBe(400)
    expect(res.body.status).toBe(400)
    expect(res.body.error).toBe('Bad Request')
    expect(res.body.message).toContain('Nom requis')
    expect(res.body.message).toContain('Courriel invalide')
    expect(res.body.path).toBe('/api/admins')
  })
})