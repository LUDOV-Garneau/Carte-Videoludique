import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { API_URL } from "../config.js";
import { useAuthStore } from "./auth.js";

const isDev = import.meta.env.DEV;

const iconsBase = isDev
    ? import.meta.env.BASE_URL + 'icons/'
    : (window.LUDOV_VUE?.iconsBase ?? './icons/');

export const useCategorieStore = defineStore("categories", () => {
    const authStore = useAuthStore();
    
    // État
    const categories = ref([]);
    const isLoading = ref(false);
    const error = ref(null);

    // Configuration des icônes organisées par catégories (noms sans extension ni taille)
    const iconCategories = {
        accommodation: [
            'hostel', 'hotel', 'motel'
        ],
        administration: [
            'courthouse', 'embassy', 'government', 'prison', 'town-hall'
        ],
        amenity: [
            'cemetery', 'cinema', 'clock', 'entrance', 'exit', 
            'library', 'nightclub', 'playground', 'post-office', 
            'recycling', 'telephone', 'toilets'
        ],
        barrier: [
            'bollard', 'cattle-grid', 'gate', 'lift-gate', 'steps'
        ],
        'eat-drink': [
            'bar', 'beer', 'biergarten', 'cafe', 'fast-food', 
            'ice-cream', 'pub', 'restaurant', 'teahouse'
        ],
        emergency: [
            'danger', 'emergency-phone', 'fire-station', 'police'
        ],
        energy: [
            'power-wind'
        ],
        health: [
            'dentist', 'doctor', 'hospital', 'pharmacy', 'veterinary'
        ],
        money: [
            'atm', 'bank'
        ],
        nature: [
            'garden', 'mountain', 'park', 'peak', 'saddle', 
            'spring', 'tree-coniferous', 'tree-deciduous', 'tree-unspecified', 'waterfall'
        ],
        outdoor: [
            'alpine-hut', 'basic-hut', 'bench', 'camping', 'caravan',
            'drinking-water', 'fountain', 'guidepost', 'hunting-stand', 
            'lighthouse', 'mast', 'mast-communications', 'shelter', 
            'table', 'waste-basket', 'water-tower', 'wilderness-hut'
        ],
        religious: [
            'buddhist', 'christian', 'christian-orthodox', 'hinduist', 
            'jewish', 'muslim', 'place-of-worship', 'shintoist', 'sikhist', 'taoist'
        ],
        shapes: [
            'circle', 'circle-stroked', 'cross', 'marker', 'square', 
            'square-stroked', 'star', 'star-stroked', 'triangle', 'triangle-stroked'
        ],
        shop: [
            'alcohol', 'bakery', 'beauty', 'beverages', 'bicycle', 'books',
            'butcher', 'car', 'car-parts', 'chemist', 'clothes', 'computer',
            'confectionery', 'convenience', 'copyshop', 'doityourself', 'electronics',
            'florist', 'furniture', 'garden-centre', 'gift', 'greengrocer',
            'hairdresser', 'hifi', 'ice-cream', 'jewellery', 'kiosk',
            'laundry', 'mobile-phone', 'news', 'optician', 'pet',
            'photo', 'repair-bicycle', 'repair-car', 'shoes', 'stationery',
            'supermarket', 'toys'
        ],
        sports: [
            'america-football', 'baseball', 'basketball', 'cricket', 'golf', 
            'skiing', 'soccer', 'stadium', 'swimming', 'tennis'
        ],
        tourism: [
            'aquarium', 'archaeological-site', 'campsite', 'castle', 'castle-defensive',
            'castle-fortress', 'castle-manor', 'castle-palace', 'castle-stately',
            'city-gate', 'fort', 'information', 'memorial', 'monument',
            'museum', 'picnic-site', 'theatre', 'viewpoint', 'watchtower',
            'windmill', 'zoo'
        ],
        transport: [
            'aerialway', 'airfield', 'airport', 'bicycle-share', 'bus', 'bus-station',
            'bus-stop', 'car', 'charging-station', 'elevator', 'ferry', 'ford',
            'fuel', 'harbor', 'heliport', 'luggage', 'metro', 'parking-bicycle',
            'parking-car', 'parking-garage-car', 'rail', 'rail-light', 'rail-metro',
            'railway-halt', 'railway-station', 'rental-bicycle', 'rental-car',
            'roadblock', 'shared-car', 'taxi', 'tram-stop'
        ]
    };

    // Getters
    const activeCategories = computed(() => 
        categories.value.filter(cat => cat.active)
    );

    function getCategorie(categorieId) {
        return categories.value.find(cat => cat._id === categorieId) || null;
    }

    const categoriesCount = computed(() => categories.value.length);

    const getIconCategories = computed(() => iconCategories);

    const getAllIcons = computed(() => {
        const allIcons = [];
        Object.entries(iconCategories).forEach(([categoryName, icons]) => {
            icons.forEach(icon => {
                allIcons.push({
                    name: icon,
                    category: categoryName,
                    url: `${iconsBase}categories/${categoryName}/${icon}-15.svg`
                });
            });
        });
        return allIcons;
    });

    // Fonctions utilitaires pour les icônes
    function getIconUrl(iconName, categoryName = null) {
        // Utiliser la fonction synchrone pour obtenir l'URL intelligente
        const info = getIconInfoSync(iconName, categoryName);
        return info.url;
    }

    async function getIconInfo(iconName, categoryName = null) {
        // D'abord déterminer la catégorie si elle n'est pas fournie
        if (!categoryName) {
            for (const [catName, icons] of Object.entries(iconCategories)) {
                if (icons.includes(iconName)) {
                    categoryName = catName;
                    break;
                }
            }
        }
        
        if (!categoryName) {
            categoryName = 'shapes';
        }

        // Tester quelles tailles sont disponibles
        const sizes = [15, 14, 10];
        let availableSize = 15; // par défaut
        
        for (const size of sizes) {
            const testUrl = `${iconsBase}categories/${categoryName}/${iconName}-${size}.svg`;
            try {
                // Tester si l'image existe
                const response = await fetch(testUrl, { method: 'HEAD' });
                if (response.ok) {
                    availableSize = size;
                    break;
                }
            } catch (err) {
                // Continue vers la taille suivante
            }
        }
        
        const url = `${iconsBase}categories/${categoryName}/${iconName}-${availableSize}.svg`;
        const copyright = availableSize === 15 ? '© Mapbox' : '© Osmic';
        
        return {
            url,
            size: availableSize,
            copyright,
            category: categoryName,
            name: iconName
        };
    }

    // Mapping précis des tailles d'icônes par catégorie et nom
    const iconSizeMap = {
        // Catégories principalement en -14 (Osmic)
        accommodation: { defaultSize: 14, exceptions: {} },
        administration: { defaultSize: 14, exceptions: {} },
        amenity: { defaultSize: 14, exceptions: {} },
        barrier: { defaultSize: 14, exceptions: {} },
        'eat-drink': { defaultSize: 14, exceptions: { 'beer': 15, 'ice-cream': 15, 'teahouse': 15 } },
        emergency: { defaultSize: 14, exceptions: { 'danger': 15 } },
        energy: { defaultSize: 14, exceptions: {} },
        health: { defaultSize: 14, exceptions: {} },
        money: { defaultSize: 14, exceptions: {} },
        nature: { defaultSize: 14, exceptions: { 'garden': 15, 'mountain': 15, 'park': 15 } },
        outdoor: { defaultSize: 14, exceptions: {} },
        religious: { defaultSize: 14, exceptions: {} },
        shop: { defaultSize: 14, exceptions: {} },
        transport: { defaultSize: 14, exceptions: { 'aerialway': 15, 'airfield': 15, 'bicycle-share': 15, 'bus': 15, 'car': 15, 'ferry': 15, 'harbor': 15, 'rail': 15, 'rail-light': 15, 'rail-metro': 15, 'roadblock': 15 } },
        
        // Catégories principalement en -15 (Maki)
        shapes: { defaultSize: 15, exceptions: {} },
        sports: { defaultSize: 15, exceptions: { 'swimming': 14 } },
        tourism: { defaultSize: 15, exceptions: { 'archaeological-site': 14, 'castle-defensive': 14, 'castle-fortress': 14, 'castle-manor': 14, 'castle-palace': 14, 'castle-stately': 14, 'city-gate': 14, 'fort': 14, 'information': 14, 'memorial': 14, 'monument': 14, 'museum': 14, 'theatre': 14, 'viewpoint': 14, 'watchtower': 14, 'windmill': 14 } }
    };

    // Version synchrone pour un accès rapide
    function getIconInfoSync(iconName, categoryName = null) {
        // D'abord déterminer la catégorie si elle n'est pas fournie
        if (!categoryName) {
            for (const [catName, icons] of Object.entries(iconCategories)) {
                if (icons.includes(iconName)) {
                    categoryName = catName;
                    break;
                }
            }
        }
        
        if (!categoryName) {
            categoryName = 'shapes';
        }

        // Déterminer la taille précise basée sur le mapping
        const categoryInfo = iconSizeMap[categoryName] || { defaultSize: 15, exceptions: {} };
        const probableSize = categoryInfo.exceptions[iconName] || categoryInfo.defaultSize;
        
        const url = `${iconsBase}categories/${categoryName}/${iconName}-${probableSize}.svg`;
        const copyright = probableSize === 15 ? '© Mapbox' : '© Osmic';
        
        return {
            url,
            size: probableSize,
            copyright,
            category: categoryName,
            name: iconName
        };
    }

    function getIconsByCategory(categoryName) {
        return iconCategories[categoryName] || [];
    }

    function findIconCategory(iconName) {
        for (const [categoryName, icons] of Object.entries(iconCategories)) {
            if (icons.includes(iconName)) {
                return categoryName;
            }
        }
        return null;
    }

    // Fonction pour générer l'alt avec la provenance
    function getIconAltWithSource(iconName, categoryName = null) {
        const iconInfo = getIconInfoSync(iconName, categoryName)
        const source = iconInfo.size === 14 ? 'Osmic' : 'Mapbox'
    return `${iconName} — © ${source}`
    }

    // Actions CRUD
    async function fetchCategories() {
        isLoading.value = true;
        error.value = null;
        
        try {
            const response = await fetch(`${API_URL}/categories`);
            if (!response.ok) {
                throw new Error(`Erreur ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            categories.value = data.data || [];
        } catch (err) {
            error.value = err.message;
            console.error('Erreur lors du chargement des catégories:', err);
        } finally {
            isLoading.value = false;
        }
    }

    async function createCategory(categoryData) {
        isLoading.value = true;
        error.value = null;
        
        try {
            const response = await fetch(`${API_URL}/categories`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authStore.token}`
                },
                body: JSON.stringify(categoryData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors de la création');
            }

            const data = await response.json();
            categories.value.push(data.data);
            return data.data;
        } catch (err) {
            error.value = err.message;
            console.error('Erreur lors de la création de la catégorie:', err);
            throw err;
        } finally {
            isLoading.value = false;
        }
    }

    async function updateCategory(categoryId, updateData) {
        isLoading.value = true;
        error.value = null;
        
        try {
            const response = await fetch(`${API_URL}/categories/${categoryId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authStore.token}`
                },
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors de la mise à jour');
            }

            const data = await response.json();
            const index = categories.value.findIndex(cat => cat._id === categoryId);
            if (index !== -1) {
                categories.value[index] = data.data;
            }
            return data.data;
        } catch (err) {
            error.value = err.message;
            console.error('Erreur lors de la mise à jour de la catégorie:', err);
            throw err;
        } finally {
            isLoading.value = false;
        }
    }

    // Fonctions de mise à jour spécialisées
    async function updateCategoryNom(categoryId, nom) {
        try {
            const response = await fetch(`${API_URL}/categories/${categoryId}/nom`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authStore.token}`
                },
                body: JSON.stringify({ nom })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors de la mise à jour du nom');
            }

            const data = await response.json();
            const index = categories.value.findIndex(cat => cat._id === categoryId);
            if (index !== -1) {
                categories.value[index] = data.data;
            }
            return data.data;
        } catch (err) {
            error.value = err.message;
            throw err;
        }
    }

    async function updateCategoryDescription(categoryId, description) {
        try {
            const response = await fetch(`${API_URL}/categories/${categoryId}/description`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authStore.token}`
                },
                body: JSON.stringify({ description })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors de la mise à jour de la description');
            }

            const data = await response.json();
            const index = categories.value.findIndex(cat => cat._id === categoryId);
            if (index !== -1) {
                categories.value[index] = data.data;
            }
            return data.data;
        } catch (err) {
            error.value = err.message;
            throw err;
        }
    }

    async function updateCategoryCouleur(categoryId, couleur) {
        try {
            const response = await fetch(`${API_URL}/categories/${categoryId}/couleur`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authStore.token}`
                },
                body: JSON.stringify({ couleur })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors de la mise à jour de la couleur');
            }

            const data = await response.json();
            const index = categories.value.findIndex(cat => cat._id === categoryId);
            if (index !== -1) {
                categories.value[index] = data.data;
            }
            return data.data;
        } catch (err) {
            error.value = err.message;
            throw err;
        }
    }

    async function updateCategoryImage(categoryId, image) {
        try {
            const response = await fetch(`${API_URL}/categories/${categoryId}/image`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authStore.token}`
                },
                body: JSON.stringify({ image })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors de la mise à jour de l\'icône');
            }

            const data = await response.json();
            const index = categories.value.findIndex(cat => cat._id === categoryId);
            if (index !== -1) {
                categories.value[index] = data.data;
            }
            return data.data;
        } catch (err) {
            error.value = err.message;
            throw err;
        }
    }

    async function updateCategoryActive(categoryId, active) {
        try {
            const response = await fetch(`${API_URL}/categories/${categoryId}/active`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authStore.token}`
                },
                body: JSON.stringify({ active })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors de la mise à jour du statut');
            }

            const data = await response.json();
            const index = categories.value.findIndex(cat => cat._id === categoryId);
            if (index !== -1) {
                categories.value[index] = data.data;
            }
            return data.data;
        } catch (err) {
            error.value = err.message;
            throw err;
        }
    }

    async function deleteCategory(categoryId) {
        isLoading.value = true;
        error.value = null;
        
        try {
            // Utiliser PATCH /active avec false pour désactiver/supprimer la catégorie
            const response = await fetch(`${API_URL}/categories/${categoryId}/active`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authStore.token}`
                },
                body: JSON.stringify({ active: false })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors de la suppression');
            }

            const responseData = await response.json();
            
            // Si la catégorie a été supprimée (message contient "supprimée"), la retirer de la liste
            if (responseData.message && responseData.message.includes('supprimée')) {
                categories.value = categories.value.filter(cat => cat._id !== categoryId);
            } else {
                // Sinon, juste la marquer comme inactive
                const categoryIndex = categories.value.findIndex(cat => cat._id === categoryId);
                if (categoryIndex !== -1) {
                    categories.value[categoryIndex].active = false;
                }
            }
        } catch (err) {
            error.value = err.message;
            console.error('Erreur lors de la suppression/désactivation de la catégorie:', err);
            throw err;
        } finally {
            isLoading.value = false;
        }
    }

    function clearError() {
        error.value = null;
    }

    return {
        // État
        categories,
        isLoading,
        error,
        
        // Getters
        activeCategories,
        categoriesCount,
        getIconCategories,
        getAllIcons,
        
        // Fonctions utilitaires icônes
        getCategorie,
        getIconUrl,
        getIconInfo,
        getIconInfoSync,
        getIconAltWithSource,
        getIconsByCategory,
        findIconCategory,
        
        // Actions
        fetchCategories,
        createCategory,
        updateCategory,
        updateCategoryNom,
        updateCategoryDescription,
        updateCategoryCouleur,
        updateCategoryImage,
        updateCategoryActive,
        deleteCategory,
        clearError
    };
}, { 
    persist: true
});