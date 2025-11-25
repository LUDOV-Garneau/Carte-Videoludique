"use strict";
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
const MIN_CHAR = 3

function getMainLocality(address) {
  return normalize(
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    ''
  )
}

/** Cette fonction normalise l'ecriture de la chaine ecrite par l'utilisateur */
function normalize(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') 
    .replace(/^ville de /, '')
    .replace(/-/g, ' ')
    .trim();
}

function extractExpectedCity(input) {
  if (!input) return null
  const parts = input.split(',').map(p => p.trim()).filter(Boolean)
  if (parts.length === 0) return null
  return parts[parts.length - 1]
}

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

  if (
    lower.includes('québec') ||
    lower.includes('quebec') ||
    lower.includes('canada') ||
    lower.includes(',')
  ) {
    return raw
  }

  // sinon on aide juste un peu Nominatim
  return `${raw}, Québec, Canada`
}

/**
 * Effectue une géocodification inverse (coordonnées → adresse) à l’aide du service Nominatim d’OpenStreetMap.
 *
 * Cette fonction interroge l’API publique de Nominatim pour obtenir une adresse
 * correspondant à des coordonnées GPS (latitude et longitude).
 * Les résultats sont renvoyés en français et incluent :
 *  - une représentation complète de l’adresse (`display_name`),
 *  - un objet détaillé des composants d’adresse (`address`).
 *
 * ⚠️ Remarque :
 * - L’API Nominatim est publique, il est donc recommandé d’inclure un User-Agent identifiable.
 * - Le service impose des limites de taux (~1 requête/seconde).
 *
 * @async
 * @function reverseGeocode
 * @param {number} lat - Latitude en degrés décimaux.
 * @param {number} lng - Longitude en degrés décimaux.
 * @returns {Promise<{ full: string, address: object }>}
 * Objet contenant :
 *  - `full` : chaîne textuelle complète de l’adresse (ex. `"123 Rue Saint-Jean, Québec, Canada"`)
 *  - `address` : objet détaillé incluant les clés `road`, `city`, `postcode`, `country`, etc.
 * @throws {Error} Si la requête HTTP échoue ou si la réponse n’est pas valide.
 *
 * @example
 * const { full, address } = await reverseGeocode(46.8139, -71.2082);
 * console.log(full);
 * // → "Rue Saint-Jean, Québec, G1R 1R5, Canada"
 */
async function reverseGeocode(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${lat}&lon=${lng}`
  const resp = await fetch(url, {
    headers: {
      // 🔸 Mieux pour obtenir des libellés en français
      'Accept-Language': 'fr',
      // 🔸 Recommandé par Nominatim: mettre un identifiant + contact
      'User-Agent': 'CarteVideoludique/1.0 (contact@example.com)'
    }
  })
  if (!resp.ok) throw new Error('Reverse geocode error')
  const data = await resp.json()
  return {
    full: data.display_name || '',
    address: data.address || {}
  }
}

/**
 * Effectue une géocodification directe (adresse → coordonnées GPS) à l’aide du service Nominatim d’OpenStreetMap.
 *
 * Cette fonction interroge l’API publique de Nominatim pour obtenir les coordonnées
 * (latitude et longitude) correspondant à une adresse textuelle donnée.
 *
 * Elle retourne uniquement le premier résultat trouvé (paramètre `limit=1`).
 *
 * ⚠️ Remarque :
 * - L’API Nominatim est publique et sujette à des limites de taux (~1 requête/seconde).
 * - Le paramètre `User-Agent` est requis pour identifier ton application.
 * - Si aucune correspondance n’est trouvée, la fonction retourne `null`.
 *
 * @async
 * @function geocodeAddress
 * @param {string} q - L’adresse à rechercher (ex. `"350 rue des Lilas Ouest, Québec"`).
 * @returns {Promise<{ lat: number, lng: number } | null>}
 * Objet contenant :
 *  - `lat` : latitude en degrés décimaux
 *  - `lng` : longitude en degrés décimaux
 * ou `null` si aucune adresse correspondante n’a été trouvée.
 * @throws {Error} Si la requête HTTP échoue ou si la réponse du service est invalide.
 *
 * @example
 * const coords = await geocodeAddress('350 rue des Lilas Ouest, Québec');
 * if (coords) {
 *   console.log(coords.lat, coords.lng);
 *   // → 46.8139, -71.2082
 * } else {
 *   console.log('Adresse introuvable');
 * }
 */
async function geocodeAddress(q) {
  const base = (q || '').trim()
  if (!base) return null

  const expectedCityRaw  = extractExpectedCity(base)
  const expectedCityNorm = normalize(expectedCityRaw)

  const query = buildQuebecQuery(base)
  if (!query) return null

  const url = `https://nominatim.openstreetmap.org/search?${new URLSearchParams({
    q: query,
    format: 'jsonv2',
    limit: '10',
    countrycodes: 'ca',
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

  const candidates = data.filter(d => isAddressInQuebecProvince(d.address))
  if (candidates.length === 0) return null

  candidates.sort((a, b) =>
    scoreCandidate(a, expectedCityNorm) - scoreCandidate(b, expectedCityNorm)
  )

  const best = candidates[0]
  const bestScore = scoreCandidate(best, expectedCityNorm)
  console.log(' Best candidate:', getMainLocality(best.address), 'score:', bestScore)

  if (expectedCityNorm && bestScore > 1) {
    console.warn('Aucun résultat dans la ville attendue, adresse refusée.')
    return null
  }

  return {
    lat: parseFloat(best.lat),
    lng: parseFloat(best.lon),
  }
}

function scoreCandidate(d, expectedCityNorm) {
  const a = d.address
  const mainLocality = getMainLocality(a)
  const districtNorm = normalize(a.city_district)
  const suburbNorm   = normalize(a.suburb)
  const stateNorm    = normalize(a.state)

  console.log('Expected :', expectedCityNorm)
  console.log('mainLocality :', mainLocality)
  console.log('district/suburb :', districtNorm, suburbNorm)
  console.log('stateNorm :', stateNorm)

  if (!expectedCityNorm) return 3

  // ✅ Cas particulier : si l'utilisateur tape "Québec"
  // on accepte "Vieux-Québec", "Haute-Ville", "Saint-Roch", etc.
  if (expectedCityNorm === 'quebec') {
    if (
      mainLocality === 'quebec' ||
      districtNorm?.includes('quebec') ||
      suburbNorm?.includes('quebec') ||
      a.city === 'Québec' // sécurité au cas où
    ) {
      return 0
    }
  }

  if (mainLocality === expectedCityNorm) return 0
  if (mainLocality.includes(expectedCityNorm)) return 1
  if (districtNorm?.includes(expectedCityNorm) || suburbNorm?.includes(expectedCityNorm)) return 1
  if (stateNorm?.includes(expectedCityNorm)) return 2
  return 3
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
    limit: '5',
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