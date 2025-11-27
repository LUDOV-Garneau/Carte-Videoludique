import { ref, watch } from 'vue';

// Variable globale pour la position de scroll sauvegardée
let savedScrollPosition = 0;
let lockCount = 0; // Compteur pour gérer plusieurs modals

export function useBodyScroll() {
    const isLocked = ref(false);

    function disableScroll() {
        if (lockCount === 0) {
            // Sauvegarder la position actuelle du scroll
            savedScrollPosition = window.scrollY;
            document.body.style.position = 'fixed';
            document.body.style.top = `-${savedScrollPosition}px`;
            document.body.style.left = '0';
            document.body.style.right = '0';
            document.body.style.overflow = 'hidden';
        }
        lockCount++;
        isLocked.value = true;
    }

    function enableScroll() {
        if (lockCount > 0) {
            lockCount--;
        }

        if (lockCount === 0) {
            // Restaurer les styles du body
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.left = '';
            document.body.style.right = '';
            document.body.style.overflow = '';
            
            // Restaurer la position sans animation/saut visuel
            if (savedScrollPosition > 0) {
                requestAnimationFrame(() => {
                    window.scrollTo({
                        top: savedScrollPosition,
                        behavior: 'instant'
                    });
                });
            }
        }
        
        if (lockCount === 0) {
            isLocked.value = false;
        }
    }

    function toggleScroll(shouldLock) {
        if (shouldLock) {
            disableScroll();
        } else {
            enableScroll();
        }
    }

    // Auto-gestion avec watcher
    function lockScrollWhen(condition, options = { immediate: true }) {
        return watch(condition, (newVal) => {
            toggleScroll(newVal);
        }, options);
    }

    return {
        isLocked,
        disableScroll,
        enableScroll,
        toggleScroll,
        lockScrollWhen
    };
}