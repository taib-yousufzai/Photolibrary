/**
 * 🎯 PRODUCTION-READY IMAGE MODAL FUNCTIONS
 * 
 * Complete Download & Favorites functionality for React image modals
 * Works with any image data structure: { id, src, title }
 */

// ===================================
// 📥 DOWNLOAD FUNCTIONALITY
// ===================================

/**
 * Downloads an image directly to the user's device
 * 
 * Why previous behavior occurred:
 * - Simple <a href> links open in new tab due to CORS
 * - Browser security prevents direct cross-origin downloads
 * - Firebase Storage/CDN URLs need special handling
 * 
 * @param {Object} image - Image object { id, src, title }
 * @param {Function} showToast - Optional toast notification function
 */
export const downloadImage = async (image, showToast = null) => {
    try {
        console.log('📥 Starting download:', image.title);
        showToast?.('⏳ Preparing download...', 'info');

        // Method 1: Fetch + Blob (Primary)
        const response = await fetch(image.src, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/octet-stream',
            },
            mode: 'cors',
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Convert response to blob
        const blob = await response.blob();
        
        // Create object URL from blob
        const blobUrl = window.URL.createObjectURL(blob);
        
        // Create temporary anchor element
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = image.title || `image-${image.id}.jpg`;
        link.style.display = 'none';
        
        // Append to body, trigger click, remove
        document.body.appendChild(link);
        link.click();
        
        // Cleanup after short delay (prevents memory leaks)
        setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        }, 100);
        
        console.log('✅ Download completed:', image.title);
        showToast?.('✅ Download completed successfully!', 'success');
        
    } catch (error) {
        console.error('❌ Primary download failed:', error);
        
        // Method 2: XMLHttpRequest Fallback
        try {
            await downloadViaXHR(image, showToast);
        } catch (xhrError) {
            console.error('❌ XHR download failed:', xhrError);
            
            // Method 3: Final Fallback - Open in new tab
            window.open(image.src, '_blank');
            showToast?.('ℹ️ Image opened in new tab. Right-click to save.', 'info');
        }
    }
};

/**
 * Alternative download method using XMLHttpRequest
 * Better compatibility with some CORS configurations
 */
const downloadViaXHR = (image, showToast) => {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.responseType = 'blob';
        
        xhr.onload = function() {
            if (xhr.status === 200) {
                const blob = xhr.response;
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = image.title || `image-${image.id}.jpg`;
                
                document.body.appendChild(link);
                link.click();
                
                setTimeout(() => {
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                }, 100);
                
                showToast?.('✅ Download completed!', 'success');
                resolve();
            } else {
                reject(new Error('XHR failed'));
            }
        };
        
        xhr.onerror = () => reject(new Error('XHR error'));
        xhr.open('GET', image.src, true);
        xhr.send();
    });
};

// ===================================
// ❤️ FAVORITES FUNCTIONALITY
// ===================================

/**
 * Saves an image to favorites (localStorage)
 * 
 * Why previous behavior occurred:
 * - Only UI state was updated, no persistent storage
 * - No duplicate prevention
 * - Data lost on page reload
 * 
 * @param {Object} image - Image object { id, src, title }
 * @param {string} userId - User identifier for storage key
 * @param {Function} showToast - Optional toast notification function
 * @returns {Array} Updated favorites array
 */
export const saveToFavorites = (image, userId = 'default', showToast = null) => {
    try {
        const storageKey = `favorites_${userId}`;
        
        // Get current favorites
        const currentFavorites = getFavorites(userId);
        
        // Check if already exists (prevent duplicates)
        if (currentFavorites.some(fav => fav.id === image.id)) {
            console.log('⚠️ Image already in favorites:', image.title);
            showToast?.('ℹ️ Already in favorites!', 'info');
            return currentFavorites;
        }
        
        // Add to favorites
        const updatedFavorites = [...currentFavorites, {
            id: image.id,
            src: image.src,
            title: image.title,
            savedAt: new Date().toISOString()
        }];
        
        // Save to localStorage
        localStorage.setItem(storageKey, JSON.stringify(updatedFavorites));
        
        console.log('❤️ Added to favorites:', image.title);
        showToast?.('❤️ Added to favorites!', 'success');
        
        return updatedFavorites;
        
    } catch (error) {
        console.error('❌ Error saving to favorites:', error);
        showToast?.('❌ Failed to save to favorites', 'error');
        return getFavorites(userId);
    }
};

/**
 * Removes an image from favorites
 * 
 * @param {string} imageId - Image ID to remove
 * @param {string} userId - User identifier for storage key
 * @param {Function} showToast - Optional toast notification function
 * @returns {Array} Updated favorites array
 */
export const removeFromFavorites = (imageId, userId = 'default', showToast = null) => {
    try {
        const storageKey = `favorites_${userId}`;
        
        // Get current favorites
        const currentFavorites = getFavorites(userId);
        
        // Remove the image
        const updatedFavorites = currentFavorites.filter(fav => fav.id !== imageId);
        
        // Save to localStorage
        localStorage.setItem(storageKey, JSON.stringify(updatedFavorites));
        
        console.log('💔 Removed from favorites:', imageId);
        showToast?.('💔 Removed from favorites', 'success');
        
        return updatedFavorites;
        
    } catch (error) {
        console.error('❌ Error removing from favorites:', error);
        showToast?.('❌ Failed to remove from favorites', 'error');
        return getFavorites(userId);
    }
};

/**
 * Gets all favorites from localStorage
 * 
 * @param {string} userId - User identifier for storage key
 * @returns {Array} Array of favorite images
 */
export const getFavorites = (userId = 'default') => {
    try {
        const storageKey = `favorites_${userId}`;
        const stored = localStorage.getItem(storageKey);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('❌ Error loading favorites:', error);
        return [];
    }
};

/**
 * Checks if an image is in favorites
 * 
 * @param {string} imageId - Image ID to check
 * @param {string} userId - User identifier for storage key
 * @returns {boolean} True if image is favorited
 */
export const isFavorited = (imageId, userId = 'default') => {
    const favorites = getFavorites(userId);
    return favorites.some(fav => fav.id === imageId);
};

/**
 * Toggles favorite status (add if not favorited, remove if favorited)
 * 
 * @param {Object} image - Image object { id, src, title }
 * @param {string} userId - User identifier for storage key
 * @param {Function} showToast - Optional toast notification function
 * @returns {Object} { isFavorited: boolean, favorites: Array }
 */
export const toggleFavorite = (image, userId = 'default', showToast = null) => {
    const isCurrentlyFavorited = isFavorited(image.id, userId);
    
    let updatedFavorites;
    if (isCurrentlyFavorited) {
        updatedFavorites = removeFromFavorites(image.id, userId, showToast);
    } else {
        updatedFavorites = saveToFavorites(image, userId, showToast);
    }
    
    return {
        isFavorited: !isCurrentlyFavorited,
        favorites: updatedFavorites
    };
};

// ===================================
// 🎯 REACT HOOK FOR FAVORITES
// ===================================

/**
 * Custom React hook for managing favorites
 * Use this in your React components
 */
import { useState, useEffect } from 'react';

export const useFavorites = (userId = 'default') => {
    const [favorites, setFavorites] = useState([]);
    
    // Load favorites on mount
    useEffect(() => {
        const loadedFavorites = getFavorites(userId);
        setFavorites(loadedFavorites);
    }, [userId]);
    
    // Add to favorites
    const addFavorite = (image, showToast) => {
        const updated = saveToFavorites(image, userId, showToast);
        setFavorites(updated);
        return updated;
    };
    
    // Remove from favorites
    const removeFavorite = (imageId, showToast) => {
        const updated = removeFromFavorites(imageId, userId, showToast);
        setFavorites(updated);
        return updated;
    };
    
    // Toggle favorite
    const toggleFav = (image, showToast) => {
        const result = toggleFavorite(image, userId, showToast);
        setFavorites(result.favorites);
        return result;
    };
    
    // Check if favorited
    const checkFavorited = (imageId) => {
        return favorites.some(fav => fav.id === imageId);
    };
    
    return {
        favorites,
        addFavorite,
        removeFavorite,
        toggleFavorite: toggleFav,
        isFavorited: checkFavorited,
        favoritesCount: favorites.length
    };
};

// ===================================
// 📱 EXAMPLE USAGE IN REACT COMPONENT
// ===================================

/*
import React from 'react';
import { downloadImage, useFavorites } from './ImageModalFunctions';

const ImageModal = ({ image, user, onClose }) => {
    const { toggleFavorite, isFavorited } = useFavorites(user?.id);
    
    const handleDownload = () => {
        downloadImage(image, showToast);
    };
    
    const handleSave = () => {
        toggleFavorite(image, showToast);
    };
    
    const showToast = (message, type) => {
        // Your toast implementation
        console.log(`${type}: ${message}`);
    };
    
    return (
        <div className="modal">
            <img src={image.src} alt={image.title} />
            
            <div className="modal-buttons">
                <button 
                    onClick={handleSave}
                    className={isFavorited(image.id) ? 'favorited' : ''}
                >
                    {isFavorited(image.id) ? '❤️ Saved' : '🤍 Save'}
                </button>
                
                <button onClick={handleDownload}>
                    📥 Download
                </button>
            </div>
        </div>
    );
};
*/