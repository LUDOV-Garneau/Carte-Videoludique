"use strict";
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
const MIN_CHAR = 3

// function getMainLocality(address) {
//   return normalize(
//     address.city ||
//     address.town ||
//     address.village ||
//     address.municipality ||
//     ''
//   )
// }

/** Cette fonction normalise l'ecriture de la chaine ecrite par l'utilisateur */
function normalize(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') 
    .replace(/^ville de /, '')
    .replace(/-/g, ' ')
    .trim();
}

// function extractExpectedCity(input) {
//   if (!input) return null
//   const parts = input.split(',').map(p => p.trim()).filter(Boolean)
//   if (parts.length === 0) return null
//   return parts[parts.length - 1]
// }

function isAddressInQuebecProvince(address) {
  if (!address) return false

  const stateNorm   = normalize(address.state)
  const countryNorm = normalize(address.country)
  const code        = (address.country_code || '').toLowerCase()

  const isCanada = code === 'ca' || countryNorm.includes('canada')
  const isQuebec = stateNorm.includes('quebec')

  return isCanada && isQuebec
}

function buildQuebecQuery(input) {
  const raw = (input || '').trim()
  if (!raw) return null

  const lower = raw.toLowerCase()

  // Si l'adresse contient déjà des informations de localisation, on la garde telle quelle
  if (
    lower.includes('québec') ||
    lower.includes('quebec') ||
    lower.includes('canada') ||
    lower.includes(',')
  ) {
    return raw
  }

  // Sinon on aide Nominatim en ajoutant le contexte québécois
  return `${raw}, Québec, Canada`
}

/**
 * Effectue une géocodification inverse (coordonnées → adresse) à l'aide du service Nominatim d'OpenStreetMap.
 *
 * @async
 * @function reverseGeocode
 * @param {Object} params - Paramètres de géocodification inverse
 * @param {number} params.lat - Latitude en degrés décimaux
 * @param {number} params.lng - Longitude en degrés décimaux
 * @returns {Promise<{ full: string, address: object }>}
 * @throws {Error} Si la requête HTTP échoue ou si la réponse n'est pas valide
 *
 * @example
 * const { full, address } = await reverseGeocode({ lat: 46.8139, lng: -71.2082 });
 */
async function reverseGeocode({ lat, lng }) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${lat}&lon=${lng}`
  const resp = await fetch(url, {
    headers: {
      'Accept-Language': 'fr',
      'User-Agent': 'CarteVideoludique/1.0 (contact@example.com)',
    },
  })

  if (!resp.ok) throw new Error('Reverse geocode error')
  const data = await resp.json()
  const a = data.address || {}

  const ligne = [
    a.house_number,
    a.road,
    a.suburb || a.city_district,
    a.city || a.town,
    a.state,
    a.postcode,
    a.country,
  ].filter(Boolean).join(', ')

  return {
    full: ligne,
    address: a,
  }
}

/**
 * Effectue une géocodification directe (adresse → coordonnées GPS) à l'aide du service Nominatim d'OpenStreetMap.
 *
 * @async
 * @function geocodeAddress
 * @param {Object} params - Paramètres de géocodification
 * @param {string} params.address - L'adresse à rechercher
 * @returns {Promise<{ lat: number, lng: number } | null>}
 * @throws {Error} Si la requête HTTP échoue ou si la réponse du service est invalide
 *
 * @example
 * const coords = await geocodeAddress({ address: '350 rue des Lilas Ouest, Québec' });
 */
async function geocodeAddress({ address }) {
  const query = (address || '')
  if (!query) return null

  const url = `https://nominatim.openstreetmap.org/search?${new URLSearchParams({
    q: query,
    format: 'jsonv2',
    limit: '1',
    addressdetails: '1'
  }).toString()}`

  const resp = await fetch(url, {
    headers: {
      'Accept-Language': 'fr',
      'User-Agent': 'CarteVideoludique/1.0 (contact@example.com)',
    },
  })

  if (!resp.ok) throw new Error('Geocode error')

  const data = await resp.json()
  if (!Array.isArray(data) || data.length === 0) return null

  const result = data[0]
  return {
    lat: parseFloat(result.lat),
    lng: parseFloat(result.lon),
  }
}

async function fetchAdresseSuggestions(query) {
  const base = (query || '').trim()
  if (!base || base.length < MIN_CHAR) return []

  const fullQuery = buildQuebecQuery(base)
  if (!fullQuery) return []

  const params = new URLSearchParams({
    q: fullQuery,
    format: 'json',
    addressdetails: '1',
    limit: '10',
    countrycodes: 'ca',
  })

  const url = `${NOMINATIM_URL}?${params.toString()}`

  try {
    const resp = await fetch(url, {
      headers: {
        'Accept-Language': 'fr',
        'User-Agent': 'CarteVideoludique/1.0 (contact@exemple.com)',
      },
    })

    const data = await resp.json()

    if (!Array.isArray(data)) {
      console.error('Réponse Nominatim inattendue pour suggestions :', data)
      return []
    }

    const filtered = data.filter(
      item => item.address && isAddressInQuebecProvince(item.address)
    )

    return filtered.map(item => ({
      label: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      raw: item,
    }))
  } catch (error) {
    console.error('Erreur getAdresseSuggestions :', error)
    return []
  }
}

export { reverseGeocode, geocodeAddress, fetchAdresseSuggestions, isAddressInQuebecProvince };