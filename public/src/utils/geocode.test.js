import { describe, it, expect, vi, beforeEach } from 'vitest'
import { reverseGeocode, geocodeAddress } from './geocode.js'

// Mock global fetch
globalThis.fetch = vi.fn()

describe('reverseGeocode', () => {
  beforeEach(() => {
    fetch.mockClear()
  })

  it('retourne address quand HTTP 200 OK', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        display_name: '123 Rue Saint-Jean, Québec, Canada',
        address: { road: 'Rue Saint-Jean', city: 'Québec' },
      }),
    })

    const res = await reverseGeocode(46.8139, -71.2082)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('nominatim.openstreetmap.org/reverse'),
      expect.objectContaining({ headers: expect.any(Object) })
    )
    expect(res.full).toContain('Saint-Jean')
  })

  it('jette une erreur si HTTP non OK', async () => {
    fetch.mockResolvedValueOnce({ ok: false })

    await expect(reverseGeocode(0, 0))
      .rejects.toThrow('Reverse geocode error')
  })
});

describe('geocodeAddress', () => {
  beforeEach(() => {
    fetch.mockClear()
  })

  it('retourne null si la chaîne est vide', async () => {
    await expect(geocodeAddress('')).resolves.toBeNull()
    await expect(geocodeAddress('   ')).resolves.toBeNull()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('retourne {lat,lng} pour un résultat', async () => {
    const arr = [{ lat: '46.8129', lon: '-71.2082' }]
    fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(arr) })

    const res = await geocodeAddress('355 Rue Charest Est, Québec, Canada')
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('nominatim.openstreetmap.org/search'),
      expect.objectContaining({ headers: expect.any(Object) })
    )
    expect(res).toEqual({ lat: 46.8129, lng: -71.2082 })
  })

  it('retourne null si aucun résultat', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
    await expect(geocodeAddress('adresse improbable')).resolves.toBeNull()
  })

  it('jette une erreur si HTTP non OK', async () => {
    fetch.mockResolvedValueOnce({ ok: false })
    await expect(geocodeAddress('Québec')).rejects.toThrow('Geocode error')
  })
});