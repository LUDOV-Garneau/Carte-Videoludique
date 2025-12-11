import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import InfoMarqueur from '@/components/InfoMarqueurComponant.vue'

describe('InfoMarqueur', () => {
  const marqueurFake = {
    type: 'Feature',
    properties: {
      titre: 'Café ludique du Plateau',
      type: 'Lieu de mémoire',
      adresse: '123 Rue des Cartes, Québec',
      description: 'Un lieu convivial pour les joueurs.',
      temoignage: '« Super ambiance et belles soirées jeux ! »',
      images: [
        'https://picsum.photos/seed/ludov1/800/600',
        'https://picsum.photos/seed/ludov2/800/600'
      ]
    },
    geometry: {
      type: 'Point',
      coordinates: [-71.2075, 46.8139]
    }
  }

  it('affiche les infos du marqueur', () => {
    const wrapper = mount(InfoMarqueur, {
      props: {
        marqueur: marqueurFake
      },
      global: {
        // on stub la lightbox pour éviter les erreurs internes
        stubs: {
          ImageLightbox: true
        }
      }
    })

    expect(wrapper.text()).toContain('Café ludique du Plateau')
    expect(wrapper.text()).toContain('Lieu de mémoire')
    expect(wrapper.text()).toContain('123 Rue des Cartes, Québec')
  })

  it('affiche les vignettes des images', () => {
    const wrapper = mount(InfoMarqueur, {
      props: { marqueur: marqueurFake },
      global: {
        stubs: {
          ImageLightbox: true
        }
      }
    })

    const thumbs = wrapper.findAll('.image-thumb')
    expect(thumbs.length).toBe(2)
    const imgs = wrapper.findAll('.image-thumb img')
    expect(imgs[0].attributes('src')).toBe(marqueurFake.properties.images[0])
  })
})