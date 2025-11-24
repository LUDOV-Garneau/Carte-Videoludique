"use strict";
// /**
//  * Vérifie si un point est à l'intérieur d'un polygone Leaflet.
//  * @param {L.LatLng} point - Coordonnées du clic
//  * @param {L.Polygon} polygon - Polygone Leaflet
//  * @returns {boolean}
//  */
// export function isInPolygon(point, polygon) {
//   const latlngs = polygon.getLatLngs()[0]
//   const x = point.lng
//   const y = point.lat
//   let inside = false

//   for (let i = 0, j = latlngs.length - 1; i < latlngs.length; j = i++) {
//     const xi = latlngs[i].lng, yi = latlngs[i].lat
//     const xj = latlngs[j].lng, yj = latlngs[j].lat

//     const intersect =
//       yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
//     if (intersect) inside = !inside
//   }

//   return inside
// }

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
// async function geocodeAddress(q) {
//   if (!q || !q.trim()) return null
//   const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(q)}`
//   const resp = await fetch(url, {
//     headers: {
//       'Accept-Language': 'fr',
//       'User-Agent': 'CarteVideoludique/1.0 (contact@example.com)',
//     },
//   })
//   if (!resp.ok) throw new Error('Geocode error')
//   const [res] = await resp.json()
//   if (!res) return null
//   return { lat: parseFloat(res.lat), lng: parseFloat(res.lon) }
// }

async function geocodeAddress(q) {
  const query = buildQuebecQuery(q)
  if (!query) return null

  const url =
    'https://nominatim.openstreetmap.org/search?' +
    new URLSearchParams({
      q: query,
      format: 'jsonv2',
      limit: '1',
      countrycodes: 'ca',
      addressdetails: '1'
    }).toString()

  const resp = await fetch(url, {
    headers: {
      'Accept-Language': 'fr',
      'User-Agent': 'CarteVideoludique/1.0 (contact@example.com)',
    },
  })

  if (!resp.ok) throw new Error('Geocode error')

  const data = await resp.json()
  const res = data[0]
  if (!res) return null

  return { lat: parseFloat(res.lat), lng: parseFloat(res.lon) }
}

async function fetchAdresseSuggestions(suggestion, showSuggestion, rawQuery) {
  const base = (rawQuery || '').trim()

  if (!base || base.length < 3) {
    suggestion.value = []
    showSuggestion.value = false
    return
  }

  const fullQuery = buildQuebecQuery(base)
  if (!fullQuery) {
    suggestion.value = []
    showSuggestion.value = false
    return
  }

  const params = new URLSearchParams({
    q: fullQuery,
    format: 'json',
    addressdetails: '1',
    limit: '5',
    countrycodes: 'ca',
  })

  const url = 'https://nominatim.openstreetmap.org/search?' + params.toString()

  try {
    const resp = await fetch(url, {
      headers: {
        'Accept-Language': 'fr',
        'User-Agent': 'CarteVideoludique/1.0 (contact@exemple.com)',
      },
    })

    let data = await resp.json()

    // Sécurité : garder seulement le Canada
    data = data.filter(
      item => item.address && item.address.country_code === 'ca'
    )

    suggestion.value = data
    showSuggestion.value = data.length > 0
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des suggestions d'adresse : ",
      error
    )
    suggestion.value = []
    showSuggestion.value = false
  }
}

function buildQuebecQuery(input) {
  const raw = (input || '').trim()
  if (!raw) return null

  const lower = raw.toLowerCase()

  // Si l'utilisateur a déjà mis "québec" ou "quebec", on ne rajoute rien
  if (lower.includes('québec') || lower.includes('quebec')) {
    return raw
  }
  console.log(`${raw}, Québec, QC, Canada`)
  // Sinon on force le contexte géographique
  return `${raw}, Québec, QC, Canada`
}

export { reverseGeocode, geocodeAddress, fetchAdresseSuggestions };