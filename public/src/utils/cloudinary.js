"use strict";

import { CLOUD_NAME, API_URL } from '../config.js';

async function uploadOneImage(file, folder) {
    try {
        const signatureResponse = await fetch(`${API_URL}/upload-signature?folder=MapImages/Marqueurs/${folder}`);
        if (!signatureResponse.ok) throw new Error('Impossible de récupérer la signature d\'upload');
        const signatureData = await signatureResponse.json();

        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', signatureData.data.apiKey);
        formData.append('timestamp', signatureData.data.timestamp);
        formData.append('signature', signatureData.data.signature);
        if (signatureData.data.folder) formData.append('folder', signatureData.data.folder);

        const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
            method: `POST`,
            body: formData
        });
        const uploadData = await uploadResponse.json();
        if (uploadData.error) throw new Error(`Erreur Cloudinary: ${uploadData.error.message || "error inconnue"}`);

        return {
            publicId: uploadData.public_id,
            url: uploadData.secure_url,
            width: uploadData.width,
            height: uploadData.height,
            bytes: uploadData.bytes,
            format: uploadData.format,
            createdAt: uploadData.created_at,
            originalFilename: uploadData.original_filename
        };
    } catch (err) {
        console.error("Erreur lors de l'upload de l'image :", err);
        throw err;
    }
}

async function uploadMultipleImages(files, folder) {
    try {
        const uploadPromises = await Promise.allSettled(files.map(file => uploadOneImage(file, folder)));
        const successes = uploadPromises.filter(result => result.status === 'fulfilled').map(result => result.value);
        const failures = uploadPromises.filter(result => result.status === 'rejected').map(result => result.reason);
        if (successes === 0) throw new Error('Aucun upload réussi');
        if (failures.length > 0) {
            console.warn(`${failures.length} uploads ont échoué`, failures);
        }
        console.log(successes);
        return successes;
    } catch (err) {
        console.error(err);
        throw err;
    }
}

async function cleanupImages(publicIds, options = {}) {
    try {
        const body = { 
            publicIds,
            folderPath: options.folderPath || null
        };

        const response = await fetch(`${API_URL}/cleanup-images`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(body)
        });
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        return result;
    } catch (err) {
        console.error("Erreur lors du nettoyage des images :", err);
        throw err;
    }
}

export { uploadOneImage, uploadMultipleImages, cleanupImages };