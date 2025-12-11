import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as editRequestController from './editRequestController.js'
import EditRequest from '../models/editRequest.js'
import Marqueur from '../models/marqueur.js'


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
})

describe('editRequestController.createEditRequest', () => {
  it('404 si marqueur non trouvé', async () => {
    vi.spyOn(Marqueur, 'findById').mockResolvedValue(null)

    const req = mockReq(
      {
        titre: 'Nouveau titre',
        type: 'arcade',
        adresse: '123 rue Test',
        description: 'Desc',
        temoignage: 'Témoignage',
        courriel: 'test@example.com',
        images: ['img1.jpg'],
        tags: ['tag1'],
      },
      { marqueurId: 'marqueurid' },
      '/api/marqueurs/marqueurid/edit-requests'
    )

    const res = mockRes()
    const next = mockNext()

    await editRequestController.createEditRequest(req, res, next)

    expect(Marqueur.findById).toHaveBeenCalledWith('marqueurid')
    expect(res.statusCode).toBe(404)
    expect(res.body).toMatchObject({
      status: 404,
      error: 'Not Found',
      message: "Le marqueur spécifié n'existe pas",
      path: req.originalUrl,
    })
  })

   it('crée une edit request pour un marqueur existant', async () => {
    const mockMarqueur = { _id: 'marqueurid' }
    vi.spyOn(Marqueur, 'findById').mockResolvedValue(mockMarqueur)

    const mockEditRequest = {
      _id: 'editrequestid',
      marqueur: 'marqueurid',
      proposedProperties: {
        titre: 'Nouveau titre',
        type: 'arcade',
        adresse: '123 rue Test',
        description: 'Desc',
        temoignage: 'Témoignage',
        courriel: 'test@example.com',
        images: ['img1.jpg'],
        tags: ['tag1'],
      },
      requestedByUserId: 'userid',
      requestedByName: 'Admin',
    }
    vi.spyOn(EditRequest, 'create').mockResolvedValue(mockEditRequest)

    const req = mockReq(
      {
        titre: 'Nouveau titre',
        type: 'arcade',
        adresse: '123 rue Test',
        description: 'Desc',
        temoignage: 'Témoignage',
        courriel: 'test@example.com',
        images: ['img1.jpg'],
        tags: ['tag1'],
      },
      { marqueurId: 'marqueurid' },
      '/api/marqueurs/marqueurid/edit-requests',
      { _id: 'userid', name: 'Admin' } // si ton mockReq supporte un user
    )

    const res = mockRes()
    const next = mockNext()

    await editRequestController.createEditRequest(req, res, next)

    expect(Marqueur.findById).toHaveBeenCalledWith('marqueurid')
    expect(EditRequest.create).toHaveBeenCalledWith({
      marqueur: 'marqueurid',
      proposedProperties: {
        titre: 'Nouveau titre',
        type: 'arcade',
        adresse: '123 rue Test',
        description: 'Desc',
        temoignage: 'Témoignage',
        courriel: 'test@example.com',
        images: ['img1.jpg'],
        tags: ['tag1'],
      },
      requestedByUserId: req.user?._id,
      requestedByName: req.user?.name,
    })

    expect(res.statusCode).toBe(201)
    expect(res.body).toMatchObject({
      status: 201,
      message: 'Demande de modification créée avec succès',
      path: req.originalUrl,
      data: expect.objectContaining({
        _id: 'editrequestid',
        marqueur: 'marqueurid',
      }),
    })
  })
})


describe('editRequestController.getEditRequests', () => {
  it('renvoie toutes les demandes quand aucun status n’est fourni', async () => {
    const fakeEditRequests = [
      { _id: '1', status: 'pending' },
      { _id: '2', status: 'approved' },
    ]

    const populateMock = vi.fn().mockResolvedValue(fakeEditRequests)
    vi.spyOn(EditRequest, 'find').mockReturnValue({ populate: populateMock })

    const req = {
      query: {},
      params: {},
      body: {},
      originalUrl: '/api/edit-requests',
    }
    const res = mockRes()
    const next = mockNext()

    await editRequestController.getEditRequests(req, res, next)

    expect(EditRequest.find).toHaveBeenCalledWith({})
    expect(populateMock).toHaveBeenCalledWith('marqueur')

    expect(res.statusCode).toBe(200)
    expect(res.body).toMatchObject({
      status: 200,
      message: 'Liste des demandes de modification récupérée avec succès',
      path: req.originalUrl,
      data: fakeEditRequests,
    })
  })

  it('filtre les demandes par status quand le query param est fourni', async () => {
    const fakeEditRequests = [
      { _id: '1', status: 'pending' },
      { _id: '3', status: 'pending' },
    ]

    const populateMock = vi.fn().mockResolvedValue(fakeEditRequests)
    vi.spyOn(EditRequest, 'find').mockReturnValue({ populate: populateMock })

    const req = {
      query: { status: 'pending' },
      params: {},
      body: {},
      originalUrl: '/api/edit-requests?status=pending',
    }
    const res = mockRes()
    const next = mockNext()

    await editRequestController.getEditRequests(req, res, next)

    expect(EditRequest.find).toHaveBeenCalledWith({ status: 'pending' })
    expect(populateMock).toHaveBeenCalledWith('marqueur')

    expect(res.statusCode).toBe(200)
    expect(res.body).toMatchObject({
      status: 200,
      message: 'Liste des demandes de modification récupérée avec succès',
      path: req.originalUrl,
      data: fakeEditRequests,
    })
  })
})

describe('editRequestController.getEditRequest', () => {
  it('404 si edit request non trouvée', async () => {
    const populateMock = vi.fn().mockResolvedValue(null)
    vi.spyOn(EditRequest, 'findById').mockReturnValue({ populate: populateMock })

    const req = mockReq(
      {},
      { editRequestId: 'nonexistentid' },
      '/api/edit-requests/nonexistentid'
    )
    const res = mockRes()
    const next = mockNext()

    await editRequestController.getEditRequest(req, res, next)

    expect(EditRequest.findById).toHaveBeenCalledWith('nonexistentid')
    expect(populateMock).toHaveBeenCalledWith('marqueur')

    expect(res.statusCode).toBe(404)
    expect(res.body).toMatchObject({
      status: 404,
      error: 'Not Found',
      message: "La demande de modification spécifiée n'existe pas",
      path: req.originalUrl,
    })
  })

  it('200 et renvoie la demande quand elle existe', async () => {
    const mockEditRequest = {
      _id: 'editrequestid',
      status: 'pending',
      marqueur: { _id: 'marqueurid', titre: 'Un lieu' },
    }

    const populateMock = vi.fn().mockResolvedValue(mockEditRequest)
    vi.spyOn(EditRequest, 'findById').mockReturnValue({ populate: populateMock })

    const req = mockReq(
      {},
      { editRequestId: 'editrequestid' },
      '/api/edit-requests/editrequestid'
    )
    const res = mockRes()
    const next = mockNext()

    await editRequestController.getEditRequest(req, res, next)

    expect(EditRequest.findById).toHaveBeenCalledWith('editrequestid')
    expect(populateMock).toHaveBeenCalledWith('marqueur')

    expect(res.statusCode).toBe(200)
    expect(res.body).toMatchObject({
      status: 200,
      message: 'Demande de modification récupérée avec succès',
      path: req.originalUrl,
      data: expect.objectContaining({
        _id: 'editrequestid',
        status: 'pending',
      }),
    })
  })
})

describe('editRequestController.approveEditRequest', () => {
  it('404 si edit request non trouvée', async () => {
    vi.spyOn(EditRequest, 'findById').mockResolvedValue(null)
    const req = mockReq({}, { editRequestId: 'nonexistentid' }, '/api/edit-requests/nonexistentid/approve')
    const res = mockRes()
    const next = mockNext()
    await editRequestController.approveEditRequest(req, res, next)
    expect(res.statusCode).toBe(404)
    expect(res.body).toMatchObject({
        status: 404,
        error: 'Not Found',
        message: "La demande de modification spécifiée n'existe pas",
        path: req.originalUrl
    })
  })

  it('approuve une edit request existante', async () => {
    const mockEditRequest = {
        _id: 'editrequestid',
        marqueur: 'marqueurid', 
        proposedProperties: {
            titre: 'Updated Title',
        },
        status: 'pending',       
        save: vi.fn().mockResolvedValue(true),
    }

    const mockMarqueur = {
        _id: 'marqueurid',
        properties: {           
            titre: 'Old Title',
        },
        save: vi.fn().mockResolvedValue(true),
    }

    vi.spyOn(EditRequest, 'findById').mockResolvedValue(mockEditRequest)
    vi.spyOn(EditRequest, 'findByIdAndDelete').mockResolvedValue(mockEditRequest)
    vi.spyOn(Marqueur, 'findById').mockResolvedValue(mockMarqueur)

    const req = mockReq(
        {}, 
        { editRequestId: 'editrequestid' }, 
        '/api/edit-requests/editrequestid/approve' 
    )
    const res = mockRes()
    const next = mockNext()

    await editRequestController.approveEditRequest(req, res, next)

    expect(mockMarqueur.properties.titre).toBe('Updated Title')
    expect(mockMarqueur.save).toHaveBeenCalled()
    expect(EditRequest.findByIdAndDelete).toHaveBeenCalledWith('editrequestid')

    expect(res.statusCode).toBe(200)
    expect(res.body).toMatchObject({
        status: 200,
        message: 'Demande de modification acceptée et appliquée avec succès',
    })
    })
})

describe('editRequestController.rejectEditRequest', () => {
    it('404 si edit request non trouvée', async () => {
        vi.spyOn(EditRequest, 'findById').mockResolvedValue(null)
        const req = mockReq({}, { editRequestId: 'nonexistentid' }, '/api/edit-requests/nonexistentid/reject')
        const res = mockRes()
        const next = mockNext()
        await editRequestController.rejectEditRequest(req, res, next)
        expect(res.statusCode).toBe(404)
        expect(res.body).toMatchObject({
            status: 404,
            error: 'Not Found',
            message: "La demande de modification spécifiée n'existe pas",
            path: req.originalUrl
        })
    })

    it('rejette une edit request existante', async () => {
        const mockEditRequest = {
            _id: 'editrequestid',
            status: 'pending',
            save: vi.fn().mockResolvedValue(true)
        }
        vi.spyOn(EditRequest, 'findById').mockResolvedValue(mockEditRequest)
        vi.spyOn(EditRequest, 'findByIdAndDelete').mockResolvedValue(mockEditRequest)
        const req = mockReq({}, { editRequestId: 'editrequestid' }, '/api/edit-requests/editrequestid/reject')
        const res = mockRes()
        const next = mockNext()
        await editRequestController.rejectEditRequest(req, res, next)
        expect(EditRequest.findByIdAndDelete).toHaveBeenCalledWith('editrequestid')
        expect(res.statusCode).toBe(200)
        expect(res.body).toMatchObject({
            status: 200,
            message: 'Demande de modification refusée et supprimée avec succès',
        })
    })
})
