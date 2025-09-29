import { describe, it, expect } from 'vitest'
import { formatErrorResponse, formatSuccessResponse } from './utils/formatErrorResponse'

describe('formatApiResponse utils', () => {
  it('formatErrorResponse retourne un objet structuré', () => {
    const res = formatErrorResponse(404, 'Not Found', 'Ressource manquante', '/test')
    expect(res.status).toBe(404)
    expect(res.error).toBe('Not Found')
    expect(res.message).toBe('Ressource manquante')
    expect(res.path).toBe('/test')
    expect(typeof res.timestamp).toBe('string')
  })

  it('formatSuccessResponse retourne un objet structuré', () => {
    const res = formatSuccessResponse(200, 'OK', { id: 1 }, '/test')
    expect(res.status).toBe(200)
    expect(res.message).toBe('OK')
    expect(res.data).toEqual({ id: 1 })
    expect(res.path).toBe('/test')
    expect(typeof res.timestamp).toBe('string')
  })
})