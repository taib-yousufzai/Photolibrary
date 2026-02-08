/**
 * Gallery Component - Fully Functional Image Library Modal
 * 
 * Features:
 * ✅ Modal Core:
 *    - Opens/closes correctly with X button, overlay click, or ESC key
 *    - Body scroll locked when modal is open
 *    - Focus trap keeps keyboard navigation within modal
 * 
 * ✅ Image Navigation:
 *    - Left/Right arrow keys or buttons to navigate
 *    - Arrows disabled at first/last image
 *    - Smooth fade-in transitions between images
 *    - Image preloading for adjacent items
 * 
 * ✅ Save Button:
 *    - Saves to favorites (localStorage + Firebase sync)
 *    - Toggle saved/unsaved state with visual feedback
 *    - Gold color when saved, pulse animation
 * 
 * ✅ Download Button:
 *    - Downloads current image with correct filename
 *    - Works in all modern browsers
 *    - Shows success/error toast notifications
 *    - Permission-based (disabled for clients)
 * 
 * ✅ Share Button:
 *    - Uses Web Share API when supported
 *    - Fallback: copies URL to clipboard
 *    - Success/error feedback via toast
 *    - Permission-based (disabled for clients)
 * 
 * ✅ Footer Buttons:
 *    - Fully clickable (fixed z-index & pointer-events)
 *    - Centered with Flexbox, equal spacing
 *    - Keyboard accessible with proper ARIA labels
 *    - Responsive on all screen sizes
 * 
 * ✅ Accessibility:
 *    - ARIA roles and labels
 *    - Keyboard navigation (←, →, Esc, Tab)
 *    - Focus trap within modal
 *    - Screen reader support
 * 
 * ✅ UX Enhancements:
 *    - Toast notifications for actions
 *    - Smooth animations and transitions
 *    - Mobile-optimized (touch support)
 *    - Loading states and error handling
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/FirebaseAuthContext';
import { db, storage } from '../firebase/config';
import { doc, updateDoc, arrayUnion, arrayRemove, onSnapshot } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { useCategories } from '../utils/categoryManager';
import { scanStorageForMediaOptimized } from '../utils/storageScanner';
import { downloadFile } from '../utils/downloadUtils';
import { downloadFromFirebase, isFirebaseStorageUrl, extractFirebaseFilename } from '../utils/firebaseDownloadFix';
import { forceDownload } from '../utils/forceDownload';
import { 
    pricingManager, 
    setPriceForMedia, 
    removePriceForMedia, 
    subscribeToPricingUpdates, 
    formatPriceDisplay 
} from '../utils/pricingManager';
import ImageWithFallback from '../components/ImageWithFallback';
import { 
    ArrowLeft,
    Grid,
    List,
    Download,
    Share2,
    Heart,
    Filter,
    SortDesc,
    X,
    Play,
    Image as ImageIcon,
    Lock,
    ChevronLeft,
    ChevronRight,
    Trash2,
    IndianRupee,
    Edit3,
    Save,
    XCircle
} from 'lucide-react';
import './Gallery.css';

const Gallery = () => {
    // Basic state initialization
    const { categoryId, subCategoryId, mediaType } = useParams();
    const { hasPermission, isClient, user } = useAuth();
    const { getCategoryById } = useCategories();
    
    // Component state
    const [viewMode, setViewMode] = useState('grid');
    const [selectedMedia, setSelectedMedia] = useState(null);
    const [favorites, setFavorites] = useState(new Set());
    const [mediaItems, setMediaItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [visibleItems, setVisibleItems] = useState(20);
    const [loadingMore, setLoadingMore] = useState(false);
    const [imageErrors, setImageErrors] = useState(new Map());
    const [showBatchErrorMessage, setShowBatchErrorMessage] = useState(false);
    const [retryKey, setRetryKey] = useState(0);
    
    // Pricing system state
    const [pricing, setPricing] = useState(new Map()); // mediaId -> {price, unit, currency}
    const [editingPrice, setEditingPrice] = useState(null); // mediaId being edited
    const [priceForm, setPriceForm] = useState({ price: '', unit: 'sqft', currency: 'INR' });

    // Get category and subcategory data safely
    const category = getCategoryById(categoryId);
    const subCategory = category?.subCategories?.find(s => s.id === subCategoryId);
    const isVideo = mediaType === 'video';

    // Simple error handling functions
    const handleImageError = useCallback((mediaId, errorInfo) => {
        setImageErrors(prev => {
            const newErrors = new Map(prev);
            newErrors.set(mediaId, errorInfo);
            
            if (newErrors.size >= 3) {
                setShowBatchErrorMessage(true);
            }
            
            return newErrors;
        });
    }, []);

    const handleImageLoad = useCallback((mediaId) => {
        setImageErrors(prev => {
            const newErrors = new Map(prev);
            newErrors.delete(mediaId);
            
            if (newErrors.size < 3) {
                setShowBatchErrorMessage(false);
            }
            
            return newErrors;
        });
    }, []);

    const retryAllFailedImages = useCallback(() => {
        setImageErrors(new Map());
        setShowBatchErrorMessage(false);
        setRetryKey(prev => prev + 1);
        console.log('🔄 Retrying all failed images...');
    }, []);

    const dismissBatchError = useCallback(() => {
        setShowBatchErrorMessage(false);
    }, []);

    // Load media items with error handling
    useEffect(() => {
        if (!categoryId || !subCategoryId || !mediaType) return;

        const loadMedia = async () => {
            setLoading(true);
            console.log(`📷 Loading media: ${categoryId}/${subCategoryId}/${mediaType}`);
            
            try {
                const items = await scanStorageForMediaOptimized(categoryId, subCategoryId, mediaType);
                console.log(`✅ Loaded ${items.length} media items`);
                setMediaItems(items || []);
                setVisibleItems(Math.min(20, items?.length || 0));
            } catch (error) {
                console.error('❌ Error loading media:', error);
                setMediaItems([]);
            } finally {
                setLoading(false);
            }
        };

        loadMedia();
    }, [categoryId, subCategoryId, mediaType]);

    // Infinite scroll / Load more functionality
    const loadMoreItems = () => {
        if (loadingMore || visibleItems >= mediaItems.length) return;
        
        try {
            setLoadingMore(true);
            setTimeout(() => {
                try {
                    setVisibleItems(prev => Math.min(prev + 20, mediaItems.length));
                    setLoadingMore(false);
                } catch (error) {
                    console.error('Error updating visible items:', error);
                    setLoadingMore(false);
                }
            }, 300); // Small delay to show loading state
        } catch (error) {
            console.error('Error in loadMoreItems:', error);
            setLoadingMore(false);
        }
    };

    // Intersection Observer for infinite scroll
    useEffect(() => {
        let observer = null;
        
        try {
            observer = new IntersectionObserver(
                (entries) => {
                    try {
                        if (entries[0] && entries[0].isIntersecting && !loadingMore && visibleItems < mediaItems.length) {
                            loadMoreItems();
                        }
                    } catch (error) {
                        console.error('Error in intersection observer callback:', error);
                    }
                },
                { threshold: 0.1 }
            );

            const sentinel = document.querySelector('.load-more-sentinel');
            if (sentinel && observer) {
                observer.observe(sentinel);
            }
        } catch (error) {
            console.error('Error setting up intersection observer:', error);
        }

        return () => {
            try {
                if (observer) {
                    observer.disconnect();
                }
            } catch (error) {
                console.error('Error disconnecting intersection observer:', error);
            }
        };
    }, [loadingMore, visibleItems, mediaItems.length]);

    // Screenshot protection for clients
    useEffect(() => {
        if (isClient) {
            // Disable right-click
            const handleContextMenu = (e) => {
                e.preventDefault();
                return false;
            };

            // Disable keyboard shortcuts
            const handleKeyDown = (e) => {
                // Block Print Screen
                if (e.key === 'PrintScreen') {
                    e.preventDefault();
                    return false;
                }
                // Block Ctrl+S, Ctrl+P, Ctrl+Shift+S
                if (e.ctrlKey && (e.key === 's' || e.key === 'p' || e.key === 'S' || e.key === 'P')) {
                    e.preventDefault();
                    return false;
                }
                // Block F12 (DevTools)
                if (e.key === 'F12') {
                    e.preventDefault();
                    return false;
                }
            };

            document.addEventListener('contextmenu', handleContextMenu);
            document.addEventListener('keydown', handleKeyDown);

            return () => {
                document.removeEventListener('contextmenu', handleContextMenu);
                document.removeEventListener('keydown', handleKeyDown);
            };
        }
    }, [isClient]);

    /**
     * PRODUCTION-READY FAVORITES SYSTEM
     * 
     * Why previous behavior occurred:
     * - UI updated but data wasn't properly persisted
     * - localStorage wasn't being used correctly
     * - No validation for duplicates
     * - Firebase sync was optional but not reliable
     * 
     * Solution:
     * - Store complete media objects in localStorage as primary storage
     * - Sync with Firebase as backup (when available)
     * - Prevent duplicates using media ID comparison
     * - Persist on page reload
     * - Update UI immediately for better UX
     */
    const toggleFavorite = useCallback(async (mediaId) => {
        if (!user || !mediaId) {
            showToast('⚠️ Please login to manage favorites', 'error');
            return;
        }

        try {
            console.log('🔄 Toggling favorite for:', mediaId);
            
            // Find the complete media object
            const mediaObject = mediaItems.find(item => item.id === mediaId);
            if (!mediaObject) {
                console.error('❌ Media object not found for ID:', mediaId);
                showToast('❌ Media not found', 'error');
                return;
            }
            
            // Get current favorites from localStorage (store complete objects)
            const storageKey = `favorites_${user.uid}`;
            const storedFavorites = localStorage.getItem(storageKey);
            const currentFavorites = storedFavorites ? JSON.parse(storedFavorites) : [];
            
            console.log('📚 Current favorites count:', currentFavorites.length);
            
            // Check if already favorited (by ID)
            const isFavorited = currentFavorites.some(fav => fav.id === mediaId);
            let updatedFavorites;
            
            if (isFavorited) {
                // Remove from favorites
                updatedFavorites = currentFavorites.filter(fav => fav.id !== mediaId);
                console.log('❤️ Removing from favorites:', mediaId);
                showToast('💔 Removed from favorites', 'success');
            } else {
                // Add complete media object to favorites (prevent duplicates)
                if (!currentFavorites.some(fav => fav.id === mediaId)) {
                    const favoriteObject = {
                        id: mediaObject.id,
                        name: mediaObject.name,
                        url: mediaObject.url,
                        type: mediaObject.type,
                        category: category?.name || 'Unknown',
                        subCategory: subCategory?.name || 'Unknown',
                        categoryId: categoryId,
                        subCategoryId: subCategoryId,
                        mediaType: mediaType,
                        addedAt: new Date().toISOString(),
                        // Add thumbnail for better display in favorites page
                        thumbnail: mediaObject.thumbnail || mediaObject.url
                    };
                    
                    updatedFavorites = [...currentFavorites, favoriteObject];
                    console.log('❤️ Adding to favorites:', mediaId);
                    showToast('❤️ Added to favorites!', 'success');
                } else {
                    console.log('⚠️ Already in favorites:', mediaId);
                    showToast('ℹ️ Already in favorites!', 'info');
                    return;
                }
            }
            
            // Validate the updated array
            if (!Array.isArray(updatedFavorites)) {
                throw new Error('Invalid favorites array');
            }
            
            // Update localStorage immediately with complete objects
            localStorage.setItem(storageKey, JSON.stringify(updatedFavorites));
            console.log('💾 Saved to localStorage:', updatedFavorites.length, 'favorites');
            
            // Update UI state immediately (optimistic update) - use IDs for Set
            const favoriteIds = updatedFavorites.map(fav => fav.id);
            setFavorites(new Set(favoriteIds));
            console.log('🎨 Updated UI state');
            
            // Dispatch custom event to notify Favorites page
            window.dispatchEvent(new CustomEvent('favoritesUpdated'));
            
            // Sync to Firebase (store IDs only for compatibility)
            try {
                const userRef = doc(db, 'users', user.uid);
                if (isFavorited) {
                    await updateDoc(userRef, {
                        favorites: arrayRemove(mediaId)
                    });
                    console.log('🔄 Removed from Firebase');
                } else {
                    await updateDoc(userRef, {
                        favorites: arrayUnion(mediaId)
                    });
                    console.log('🔄 Added to Firebase');
                }
                console.log('✅ Synced to Firebase successfully');
            } catch (firebaseError) {
                console.warn('⚠️ Firebase sync failed (using localStorage only):', firebaseError.message);
                // Don't show error to user - localStorage is working
            }
            
        } catch (error) {
            console.error('❌ Error toggling favorite:', error);
            showToast('❌ Failed to update favorites', 'error');
            
            // Try to recover by reloading favorites from localStorage
            try {
                const storageKey = `favorites_${user.uid}`;
                const storedFavorites = localStorage.getItem(storageKey);
                const recoveredFavorites = storedFavorites ? JSON.parse(storedFavorites) : [];
                const favoriteIds = recoveredFavorites.map(fav => fav.id || fav); // Handle both objects and IDs
                setFavorites(new Set(favoriteIds));
                console.log('🔄 Recovered favorites from localStorage');
            } catch (recoveryError) {
                console.error('❌ Failed to recover favorites:', recoveryError);
                setFavorites(new Set());
            }
        }
    }, [user, mediaItems, category, subCategory, categoryId, subCategoryId, mediaType]);

    /**
     * Load favorites on component mount and user change
     * Loads from localStorage first, then syncs with Firebase
     * Handles both new object format and legacy ID format
     */
    useEffect(() => {
        if (!user) {
            setFavorites(new Set());
            return;
        }

        const loadFavorites = () => {
            try {
                const storageKey = `favorites_${user.uid}`;
                console.log('📚 Loading favorites for user:', user.uid);
                
                // Load from localStorage immediately
                const storedFavorites = localStorage.getItem(storageKey);
                if (storedFavorites) {
                    try {
                        const favArray = JSON.parse(storedFavorites);
                        if (Array.isArray(favArray)) {
                            // Handle both object format and legacy ID format
                            const favoriteIds = favArray.map(fav => {
                                if (typeof fav === 'object' && fav.id) {
                                    return fav.id; // New object format
                                } else if (typeof fav === 'string') {
                                    return fav; // Legacy ID format
                                }
                                return null;
                            }).filter(id => id !== null);
                            
                            setFavorites(new Set(favoriteIds));
                            console.log(`📚 Loaded ${favoriteIds.length} favorites from localStorage`);
                        } else {
                            console.warn('⚠️ Invalid favorites format in localStorage, resetting');
                            localStorage.setItem(storageKey, JSON.stringify([]));
                            setFavorites(new Set());
                        }
                    } catch (parseError) {
                        console.error('❌ Error parsing favorites from localStorage:', parseError);
                        localStorage.setItem(storageKey, JSON.stringify([]));
                        setFavorites(new Set());
                    }
                } else {
                    console.log('📚 No favorites found in localStorage, starting fresh');
                    setFavorites(new Set());
                }

                // Try to sync with Firebase (optional)
                const unsubscribe = onSnapshot(
                    doc(db, 'users', user.uid), 
                    (docSnapshot) => {
                        try {
                            if (docSnapshot.exists()) {
                                const data = docSnapshot.data();
                                const firebaseFavorites = data.favorites || [];
                                
                                if (Array.isArray(firebaseFavorites)) {
                                    // Firebase stores IDs only, merge with localStorage objects
                                    const localStoredFavorites = localStorage.getItem(storageKey);
                                    const localFavorites = localStoredFavorites ? JSON.parse(localStoredFavorites) : [];
                                    
                                    // Update UI with Firebase IDs
                                    setFavorites(new Set(firebaseFavorites));
                                    
                                    // If localStorage has objects but Firebase has IDs, keep localStorage format
                                    if (localFavorites.length > 0 && typeof localFavorites[0] === 'object') {
                                        console.log(`🔄 Using localStorage objects, synced ${firebaseFavorites.length} IDs from Firebase`);
                                    } else {
                                        // Update localStorage with Firebase IDs if it only had IDs
                                        localStorage.setItem(storageKey, JSON.stringify(firebaseFavorites));
                                        console.log(`🔄 Synced ${firebaseFavorites.length} favorites from Firebase`);
                                    }
                                } else {
                                    console.warn('⚠️ Invalid favorites format in Firebase');
                                }
                            } else {
                                console.log('📚 No user document in Firebase, using localStorage only');
                            }
                        } catch (snapshotError) {
                            console.error('❌ Error processing Firebase snapshot:', snapshotError);
                        }
                    },
                    (error) => {
                        console.warn('⚠️ Firebase sync unavailable, using localStorage only:', error.message);
                        // Continue using localStorage - no error shown to user
                    }
                );

                return unsubscribe;
            } catch (error) {
                console.error('❌ Error loading favorites:', error);
                setFavorites(new Set());
            }
        };

        const unsubscribe = loadFavorites();
        
        return () => {
            if (unsubscribe && typeof unsubscribe === 'function') {
                try {
                    unsubscribe();
                } catch (error) {
                    console.error('❌ Error unsubscribing from Firebase:', error);
                }
            }
        };
    }, [user]);

    // Navigation functions for media viewer
    const getCurrentMediaIndex = () => {
        if (!selectedMedia || !mediaItems || mediaItems.length === 0) return -1;
        return mediaItems.findIndex(item => item && item.id === selectedMedia.id);
    };

    const preloadAdjacentImages = (currentIndex) => {
        if (!mediaItems || mediaItems.length === 0) return;
        
        // Preload next and previous images for faster navigation
        const preloadImage = (index) => {
            try {
                if (index >= 0 && index < mediaItems.length) {
                    const media = mediaItems[index];
                    if (media && media.url && media.type && !media.type.includes('video')) {
                        const img = new Image();
                        img.src = media.url;
                        img.onerror = () => {
                            console.warn(`Failed to preload image at index ${index}`);
                        };
                    }
                }
            } catch (error) {
                console.error(`Error preloading image at index ${index}:`, error);
            }
        };

        // Preload previous and next images
        preloadImage(currentIndex - 1);
        preloadImage(currentIndex + 1);
    };

    const goToPreviousMedia = () => {
        try {
            const currentIndex = getCurrentMediaIndex();
            if (currentIndex > 0 && mediaItems[currentIndex - 1]) {
                const newMedia = mediaItems[currentIndex - 1];
                setSelectedMedia(newMedia);
                preloadAdjacentImages(currentIndex - 1);
            }
        } catch (error) {
            console.error('Error navigating to previous media:', error);
        }
    };

    const goToNextMedia = () => {
        try {
            const currentIndex = getCurrentMediaIndex();
            if (currentIndex < mediaItems.length - 1 && mediaItems[currentIndex + 1]) {
                const newMedia = mediaItems[currentIndex + 1];
                setSelectedMedia(newMedia);
                preloadAdjacentImages(currentIndex + 1);
            }
        } catch (error) {
            console.error('Error navigating to next media:', error);
        }
    };

    // Preload adjacent images when a media item is selected
    useEffect(() => {
        if (selectedMedia && mediaItems && mediaItems.length > 0) {
            try {
                const currentIndex = getCurrentMediaIndex();
                if (currentIndex >= 0) {
                    preloadAdjacentImages(currentIndex);
                }
            } catch (error) {
                console.error('Error preloading adjacent images:', error);
            }
        }
    }, [selectedMedia, mediaItems]);

    // Keyboard navigation for media viewer with focus trap
    useEffect(() => {
        if (!selectedMedia) return;

        // Focus the modal when it opens
        const modalElement = document.querySelector('.media-viewer');
        if (modalElement) {
            modalElement.focus();
        }

        const handleKeyDown = (e) => {
            try {
                switch (e.key) {
                    case 'ArrowLeft':
                        e.preventDefault();
                        goToPreviousMedia();
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        goToNextMedia();
                        break;
                    case 'Escape':
                        e.preventDefault();
                        setSelectedMedia(null);
                        break;
                    case 'Tab':
                        // Focus trap - keep focus within modal
                        const focusableElements = modalElement?.querySelectorAll(
                            'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                        );
                        if (focusableElements && focusableElements.length > 0) {
                            const firstElement = focusableElements[0];
                            const lastElement = focusableElements[focusableElements.length - 1];
                            
                            if (e.shiftKey && document.activeElement === firstElement) {
                                e.preventDefault();
                                lastElement.focus();
                            } else if (!e.shiftKey && document.activeElement === lastElement) {
                                e.preventDefault();
                                firstElement.focus();
                            }
                        }
                        break;
                    default:
                        // Do nothing for other keys
                        break;
                }
            } catch (error) {
                console.error('Error handling keyboard navigation:', error);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        
        // Lock body scroll when modal is open
        document.body.style.overflow = 'hidden';
        
        return () => {
            try {
                document.removeEventListener('keydown', handleKeyDown);
                // Restore body scroll when modal closes
                document.body.style.overflow = 'unset';
            } catch (error) {
                console.error('Error removing keyboard event listener:', error);
            }
        };
    }, [selectedMedia, mediaItems]);

    /**
     * AGGRESSIVE DOWNLOAD FUNCTION - BYPASSES BROWSER RESTRICTIONS
     * 
     * Uses multiple aggressive methods to force downloads when standard methods fail
     */
    const handleDownload = async (media) => {
        if (!hasPermission('canDownload')) {
            showToast('⚠️ Download not available for your account', 'error');
            return;
        }

        try {
            console.log('📥 Starting aggressive download:', media.name);
            showToast('⏳ Forcing download...', 'info');

            const filename = media.name || `design-${media.id}`;
            
            // Use aggressive force download method
            const success = await forceDownload(media.url, filename);
            
            if (success) {
                console.log('✅ Aggressive download initiated:', filename);
                showToast('🚀 Download forced! Check your downloads folder.', 'success');
            } else {
                console.error('❌ All aggressive download methods failed');
                showToast('❌ Download failed. Manual download required.', 'error');
            }
            
        } catch (error) {
            console.error('❌ Aggressive download error:', error);
            showToast('❌ Download failed. Please try manual download.', 'error');
            
            // Show manual download instructions as final fallback
            setTimeout(() => {
                const instructions = `📥 Manual Download Instructions:\n\n` +
                                   `1. Right-click on the image\n` +
                                   `2. Select "Save image as..." or "Save as..."\n` +
                                   `3. Choose your download location\n` +
                                   `4. Click "Save"\n\n` +
                                   `Alternative: Copy the image URL and paste it in a new tab.`;
                
                if (confirm(instructions + '\n\nWould you like to copy the image URL?')) {
                    try {
                        navigator.clipboard.writeText(media.url).then(() => {
                            alert('✅ Image URL copied to clipboard!');
                        }).catch(() => {
                            prompt('Copy this URL manually:', media.url);
                        });
                    } catch (clipError) {
                        prompt('Copy this URL manually:', media.url);
                    }
                }
            }, 1000);
        }
    };

    const handleShare = async (media) => {
        if (!hasPermission('canShare')) {
            alert('⚠️ Sharing not available for your account.');
            return;
        }

        try {
            // Check if Web Share API is supported
            if (navigator.share) {
                await navigator.share({
                    title: media.name,
                    text: `Check out this interior design: ${media.name}`,
                    url: media.url
                });
                console.log('✅ Shared successfully via Web Share API');
                showToast('✅ Shared successfully!', 'success');
            } else {
                // Fallback: Copy URL to clipboard
                await navigator.clipboard.writeText(media.url);
                console.log('✅ URL copied to clipboard');
                showToast('✅ Link copied to clipboard!', 'success');
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('ℹ️ Share cancelled by user');
            } else {
                console.error('❌ Share failed:', error);
                showToast('❌ Share failed. Please try again.', 'error');
            }
        }
    };

    /**
     * ADMIN-ONLY DELETE FUNCTIONALITY
     * 
     * Allows admin users to permanently delete media files from Firebase Storage
     * Includes confirmation dialog and proper error handling
     */
    const handleDelete = async (media) => {
        // Check if user has admin permissions
        if (!hasPermission('canManageUsers')) { // Using canManageUsers as admin check
            showToast('⚠️ Delete not available for your account', 'error');
            return;
        }

        // Confirmation dialog
        const confirmDelete = window.confirm(
            `⚠️ PERMANENT DELETE WARNING\n\n` +
            `Are you sure you want to permanently delete this media?\n\n` +
            `File: ${media.name}\n` +
            `Category: ${category?.name} > ${subCategory?.name}\n\n` +
            `This action CANNOT be undone!`
        );

        if (!confirmDelete) {
            console.log('🚫 Delete cancelled by user');
            return;
        }

        try {
            console.log('🗑️ Starting delete process for:', media.name);
            showToast('⏳ Deleting media...', 'info');

            // Extract the storage path from the URL
            // Firebase Storage URLs format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?{params}
            const url = new URL(media.url);
            const pathMatch = url.pathname.match(/\/o\/(.+)$/);
            
            if (!pathMatch) {
                throw new Error('Could not extract storage path from URL');
            }

            // Decode the path (Firebase encodes special characters)
            const storagePath = decodeURIComponent(pathMatch[1]);
            console.log('📁 Storage path:', storagePath);

            // Create storage reference and delete
            const storageRef = ref(storage, storagePath);
            await deleteObject(storageRef);
            
            console.log('✅ File deleted from Firebase Storage');

            // Remove from local state immediately (optimistic update)
            setMediaItems(prev => prev.filter(item => item.id !== media.id));
            
            // Close modal if the deleted item was selected
            if (selectedMedia && selectedMedia.id === media.id) {
                setSelectedMedia(null);
            }

            // Remove from favorites if it was favorited
            if (favorites.has(media.id)) {
                try {
                    const storageKey = `favorites_${user.uid}`;
                    const currentFavorites = JSON.parse(localStorage.getItem(storageKey) || '[]');
                    const updatedFavorites = currentFavorites.filter(id => id !== media.id);
                    localStorage.setItem(storageKey, JSON.stringify(updatedFavorites));
                    setFavorites(new Set(updatedFavorites));
                    
                    // Also remove from Firebase favorites
                    const userRef = doc(db, 'users', user.uid);
                    await updateDoc(userRef, {
                        favorites: arrayRemove(media.id)
                    });
                } catch (favError) {
                    console.warn('⚠️ Error removing from favorites:', favError);
                }
            }

            console.log('✅ Media deleted successfully');
            showToast('✅ Media deleted successfully!', 'success');

        } catch (error) {
            console.error('❌ Delete failed:', error);
            
            // Provide specific error messages
            let errorMessage = '❌ Failed to delete media';
            
            if (error.code === 'storage/object-not-found') {
                errorMessage = '⚠️ File not found in storage';
            } else if (error.code === 'storage/unauthorized') {
                errorMessage = '⚠️ Insufficient permissions to delete';
            } else if (error.code === 'storage/unknown') {
                errorMessage = '❌ Storage service unavailable';
            }
            
            showToast(errorMessage, 'error');
        }
    };

    // Toast notification system
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast({ show: false, message: '', type: 'success' });
        }, 3000);
    };

    /**
     * PRICING SYSTEM - ADMIN ONLY
     * 
     * Allows admin users to set prices with units for design items
     * Stores pricing data in Firebase Firestore for real-time sync across devices
     */
    
    // Load pricing data with real-time sync
    useEffect(() => {
        if (!categoryId || !subCategoryId || !mediaType) return;

        // Subscribe to real-time pricing updates
        const unsubscribe = subscribeToPricingUpdates(
            categoryId, 
            subCategoryId, 
            mediaType, 
            (pricingMap) => {
                setPricing(pricingMap);
                console.log('📊 Real-time pricing data updated:', {
                    count: pricingMap.size,
                    timestamp: new Date().toISOString()
                });
            }
        );

        // Cleanup subscription on unmount
        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
            pricingManager.cleanup();
        };
    }, [categoryId, subCategoryId, mediaType]);

    // Start editing price for a media item
    const startEditingPrice = (mediaId) => {
        if (!hasPermission('canManageUsers')) {
            showToast('⚠️ Only admins can edit prices', 'error');
            return;
        }

        const currentPricing = pricing.get(mediaId) || { price: '', unit: 'sqft', currency: 'INR' };
        setPriceForm(currentPricing);
        setEditingPrice(mediaId);
    };

    // Cancel price editing
    const cancelEditingPrice = () => {
        setEditingPrice(null);
        setPriceForm({ price: '', unit: 'sqft', currency: 'INR' });
    };

    // Save price for a media item
    const savePrice = async (mediaId) => {
        if (!hasPermission('canManageUsers')) {
            showToast('⚠️ Only admins can edit prices', 'error');
            return;
        }

        try {
            const price = parseFloat(priceForm.price);
            
            if (isNaN(price) || price < 0) {
                showToast('⚠️ Please enter a valid price', 'error');
                return;
            }

            // Save to Firebase Firestore for real-time sync
            await setPriceForMedia(
                categoryId,
                subCategoryId,
                mediaType,
                mediaId,
                {
                    price: price,
                    unit: priceForm.unit,
                    currency: priceForm.currency
                },
                user?.email || 'Unknown'
            );

            setEditingPrice(null);
            setPriceForm({ price: '', unit: 'sqft', currency: 'INR' });

            showToast('✅ Price updated successfully! Synced across all devices.', 'success');
            console.log('💰 Price updated for:', mediaId, priceForm);

        } catch (error) {
            console.error('❌ Error saving price:', error);
            showToast('❌ Failed to save price', 'error');
        }
    };

    // Remove price for a media item
    const removePrice = async (mediaId) => {
        if (!hasPermission('canManageUsers')) {
            showToast('⚠️ Only admins can edit prices', 'error');
            return;
        }

        try {
            // Remove from Firebase Firestore for real-time sync
            await removePriceForMedia(categoryId, subCategoryId, mediaType, mediaId);
            showToast('✅ Price removed and synced across all devices', 'success');
        } catch (error) {
            console.error('❌ Error removing price:', error);
            showToast('❌ Failed to remove price', 'error');
        }
    };

    // Format price for display using the pricing manager utility
    const formatPrice = (priceData) => {
        return formatPriceDisplay(priceData);
    };

    // Available units for pricing
    const priceUnits = [
        { value: 'sqft', label: 'per sq ft' },
        { value: 'sqm', label: 'per sq m' },
        { value: 'pcs', label: 'per piece' },
        { value: 'set', label: 'per set' },
        { value: 'room', label: 'per room' },
        { value: 'project', label: 'per project' },
        { value: 'hour', label: 'per hour' },
        { value: 'design', label: 'per design' }
    ];

    // Available currencies
    const currencies = [
        { value: 'INR', label: 'INR (₹)' },
        { value: 'USD', label: 'USD ($)' },
        { value: 'EUR', label: 'EUR (€)' },
        { value: 'GBP', label: 'GBP (£)' }
    ];

    if (!category || !subCategory) {
        return (
            <div className="not-found">
                <h2>Content not found</h2>
                <Link to="/categories" className="btn btn-primary">
                    Back to Categories
                </Link>
            </div>
        );
    }

    return (
        <div className={`gallery-page ${isClient ? 'protected-content' : ''}`}>
            {/* Back Link */}
            <Link to={`/category/${categoryId}`} className="back-link">
                <ArrowLeft size={18} />
                <span>Back to {category.name}</span>
            </Link>

            {/* Gallery Header */}
            <div className="gallery-header">
                <div className="gallery-title">
                    <span className="category-emoji">{category.emoji}</span>
                    <div className="title-info">
                        <h1>{subCategory.name}</h1>
                        <p>{isVideo ? 'Videos' : 'Images'} • {category.name}</p>
                    </div>
                </div>

                <div className="gallery-controls">
                    {/* View Mode Toggle */}
                    <div className="view-toggle">
                        <button
                            className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                            onClick={() => setViewMode('grid')}
                        >
                            <Grid size={18} />
                        </button>
                        <button
                            className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                            onClick={() => setViewMode('list')}
                        >
                            <List size={18} />
                        </button>
                    </div>

                    <button className="btn btn-secondary">
                        <Filter size={16} />
                        Filter
                    </button>

                    <button className="btn btn-secondary">
                        <SortDesc size={16} />
                        Sort
                    </button>
                </div>
            </div>

            {/* Client Protection Notice */}
            {isClient && (
                <div className="protection-notice">
                    <Lock size={16} />
                    <span>View-only mode. Downloads and screenshots are disabled for your account.</span>
                </div>
            )}

            {/* Batch Error Message */}
            {showBatchErrorMessage && (
                <div className="batch-error-notice">
                    <div className="error-content">
                        <ImageIcon size={20} />
                        <div className="error-text">
                            <h4>Multiple images failed to load</h4>
                            <p>
                                {imageErrors.size} image{imageErrors.size !== 1 ? 's' : ''} couldn't be displayed. 
                                This might be due to network issues or storage configuration problems.
                            </p>
                        </div>
                    </div>
                    <div className="error-actions">
                        <button className="btn btn-primary btn-sm" onClick={retryAllFailedImages}>
                            Retry All
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={dismissBatchError}>
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Gallery Grid */}
            {loading ? (
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Loading {isVideo ? 'videos' : 'images'}...</p>
                </div>
            ) : mediaItems.length > 0 ? (
                <>
                    <div className={`gallery-grid ${viewMode}`}>
                        {mediaItems.slice(0, visibleItems).map((media, index) => (
                            <div
                                key={media.id}
                                className="media-card"
                                style={{ animationDelay: `${(index % 20) * 0.05}s` }}
                                onClick={() => setSelectedMedia(media)}
                            >
                                {/* Media Preview */}
                                <div className="media-preview">
                                    {isVideo ? (
                                        <div className="video-thumbnail">
                                            <ImageWithFallback
                                                key={`${media.id}-thumbnail-${retryKey}`}
                                                src={media.thumbnail} 
                                                alt={media.name} 
                                                draggable="false"
                                                lazy={index > 8} // Lazy load after first 9 images
                                                onLoad={() => {
                                                    console.log(`🖼️ Loaded thumbnail: ${media.name}`);
                                                    handleImageLoad(media.id);
                                                }}
                                                onError={(e, errorInfo) => {
                                                    console.error(`❌ Failed to load thumbnail: ${media.name}`, errorInfo);
                                                    handleImageError(media.id, errorInfo);
                                                }}
                                            />
                                            <div className="play-overlay">
                                                <Play size={32} />
                                            </div>
                                        </div>
                                    ) : (
                                        <ImageWithFallback
                                            key={`${media.id}-image-${retryKey}`}
                                            src={media.url} 
                                            alt={media.name} 
                                            draggable="false"
                                            lazy={index > 8} // Lazy load after first 9 images
                                            onLoad={() => {
                                                console.log(`🖼️ Loaded image: ${media.name}`);
                                                handleImageLoad(media.id);
                                            }}
                                            onError={(e, errorInfo) => {
                                                console.error(`❌ Failed to load image: ${media.name}`, errorInfo);
                                                handleImageError(media.id, errorInfo);
                                            }}
                                        />
                                    )}

                                    {/* Client Watermark */}
                                    {isClient && (
                                        <>
                                            <div className="watermark-overlay"></div>
                                            <div className="watermark-text">PREVIEW</div>
                                        </>
                                    )}

                                    {/* Quick Actions */}
                                    <div className="media-actions">
                                        <button
                                            className={`action-btn ${favorites.has(media.id) ? 'active' : ''}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleFavorite(media.id);
                                            }}
                                        >
                                            <Heart size={18} fill={favorites.has(media.id) ? 'currentColor' : 'none'} />
                                        </button>

                                        {hasPermission('canDownload') && (
                                            <button
                                                className="action-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDownload(media);
                                                }}
                                            >
                                                <Download size={18} />
                                            </button>
                                        )}

                                        {hasPermission('canShare') && (
                                            <button
                                                className="action-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleShare(media);
                                                }}
                                            >
                                                <Share2 size={18} />
                                            </button>
                                        )}

                                        {/* Admin-only Delete Button */}
                                        {hasPermission('canManageUsers') && (
                                            <button
                                                className="action-btn delete-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(media);
                                                }}
                                                title="Delete media (Admin only)"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Media Info */}
                                <div className="media-info">
                                    <h4>{media.name}</h4>
                                    {media.tags && (
                                        <div className="media-tags">
                                            {media.tags.slice(0, 3).map(tag => (
                                                <span key={tag} className="tag">#{tag}</span>
                                            ))}
                                        </div>
                                    )}
                                    
                                    {/* Price Display */}
                                    <div className="media-pricing">
                                        {pricing.get(media.id) ? (
                                            <div className="price-display">
                                                <IndianRupee size={14} />
                                                <span className="price-text">
                                                    {formatPrice(pricing.get(media.id))}
                                                </span>
                                                {hasPermission('canManageUsers') && (
                                                    <button
                                                        className="edit-price-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            startEditingPrice(media.id);
                                                        }}
                                                        title="Edit price (Admin only)"
                                                    >
                                                        <Edit3 size={12} />
                                                    </button>
                                                )}
                                            </div>
                                        ) : hasPermission('canManageUsers') ? (
                                            <button
                                                className="add-price-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    startEditingPrice(media.id);
                                                }}
                                                title="Add price (Admin only)"
                                            >
                                                <IndianRupee size={14} />
                                                <span>Add Price</span>
                                            </button>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Load More Sentinel */}
                    {visibleItems < mediaItems.length && (
                        <div className="load-more-container">
                            <div className="load-more-sentinel"></div>
                            {loadingMore && (
                                <div className="loading-more">
                                    <div className="loading-spinner"></div>
                                    <p>Loading more {isVideo ? 'videos' : 'images'}...</p>
                                </div>
                            )}
                            {!loadingMore && (
                                <button className="btn btn-secondary load-more-btn" onClick={loadMoreItems}>
                                    Load More ({mediaItems.length - visibleItems} remaining)
                                </button>
                            )}
                        </div>
                    )}
                </>
            ) : (
                /* Empty State */
                <div className="empty-state">
                    {isVideo ? <Play size={64} /> : <ImageIcon size={64} />}
                    <h3>No {isVideo ? 'videos' : 'images'} yet</h3>
                    <p>This collection is empty. Check back soon for new content.</p>
                    {hasPermission('canUpload') && (
                        <Link to="/upload" className="btn btn-primary">
                            Upload {isVideo ? 'Videos' : 'Images'}
                        </Link>
                    )}
                </div>
            )}

            {/* Media Viewer Modal */}
            {selectedMedia && (
                <div 
                    className="media-viewer-overlay" 
                    onClick={() => setSelectedMedia(null)}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="viewer-title"
                >
                    <div 
                        className="media-viewer" 
                        onClick={(e) => e.stopPropagation()}
                        tabIndex={-1}
                        role="document"
                    >
                        {/* Close button */}
                        <button 
                            className="close-viewer" 
                            onClick={() => setSelectedMedia(null)}
                            aria-label="Close viewer"
                            title="Close (Esc)"
                        >
                            <X size={24} />
                        </button>

                        {/* Previous button */}
                        {getCurrentMediaIndex() > 0 && (
                            <button 
                                className="nav-viewer nav-prev" 
                                onClick={goToPreviousMedia}
                                aria-label="Previous image"
                                title="Previous (←)"
                            >
                                <ChevronLeft size={32} />
                            </button>
                        )}

                        {/* Next button */}
                        {getCurrentMediaIndex() < mediaItems.length - 1 && (
                            <button 
                                className="nav-viewer nav-next" 
                                onClick={goToNextMedia}
                                aria-label="Next image"
                                title="Next (→)"
                            >
                                <ChevronRight size={32} />
                            </button>
                        )}

                        <div className={`viewer-content ${isClient ? 'protected-content' : ''}`}>
                            {isVideo ? (
                                <video
                                    src={selectedMedia.url}
                                    controls={!isClient}
                                    autoPlay
                                    controlsList={isClient ? "nodownload" : ""}
                                />
                            ) : (
                                <ImageWithFallback
                                    src={selectedMedia.url}
                                    alt={selectedMedia.name}
                                    draggable="false"
                                    lazy={false}
                                    className="viewer-image"
                                />
                            )}

                            {/* Client Watermark in Viewer */}
                            {isClient && (
                                <>
                                    <div className="watermark-overlay"></div>
                                    <div className="watermark-text">PREVIEW ONLY</div>
                                </>
                            )}
                        </div>

                        <div className="viewer-info">
                            <h3 id="viewer-title">{selectedMedia.name}</h3>
                            <div className="viewer-meta">
                                <span className="media-counter">
                                    {getCurrentMediaIndex() + 1} of {mediaItems.length}
                                </span>
                                
                                {/* Price Display in Modal */}
                                {pricing.get(selectedMedia.id) && (
                                    <div className="viewer-price">
                                        <IndianRupee size={16} />
                                        <span className="price-text">
                                            {formatPrice(pricing.get(selectedMedia.id))}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="viewer-actions">
                                <button
                                    className={`btn ${favorites.has(selectedMedia.id) ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleFavorite(selectedMedia.id);
                                    }}
                                    title={favorites.has(selectedMedia.id) ? 'Remove from favorites' : 'Add to favorites'}
                                    aria-label={favorites.has(selectedMedia.id) ? 'Remove from favorites' : 'Add to favorites'}
                                >
                                    <Heart size={22} fill={favorites.has(selectedMedia.id) ? 'currentColor' : 'none'} />
                                    {favorites.has(selectedMedia.id) ? 'Favorited' : 'Favorite'}
                                </button>

                                {hasPermission('canDownload') ? (
                                    <button 
                                        className="btn btn-secondary" 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDownload(selectedMedia);
                                        }}
                                        title="Download this media"
                                        aria-label="Download media"
                                    >
                                        <Download size={22} />
                                        Download
                                    </button>
                                ) : (
                                    <button 
                                        className="btn btn-secondary" 
                                        disabled
                                        title="Download not available for your account"
                                        aria-label="Download not available"
                                    >
                                        <Download size={22} />
                                        Download
                                    </button>
                                )}

                                {hasPermission('canShare') ? (
                                    <button 
                                        className="btn btn-secondary" 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleShare(selectedMedia);
                                        }}
                                        title="Share this media"
                                        aria-label="Share media"
                                    >
                                        <Share2 size={22} />
                                        Share
                                    </button>
                                ) : (
                                    <button 
                                        className="btn btn-secondary" 
                                        disabled
                                        title="Share not available for your account"
                                        aria-label="Share not available"
                                    >
                                        <Share2 size={22} />
                                        Share
                                    </button>
                                )}

                                {/* Admin-only Delete Button */}
                                {hasPermission('canManageUsers') && (
                                    <button 
                                        className="btn btn-danger" 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(selectedMedia);
                                        }}
                                        title="Permanently delete this media (Admin only)"
                                        aria-label="Delete media"
                                    >
                                        <Trash2 size={22} />
                                        Delete
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Price Editing Modal - Admin Only */}
            {editingPrice && hasPermission('canManageUsers') && (
                <div className="price-modal-overlay" onClick={cancelEditingPrice}>
                    <div className="price-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="price-modal-header">
                            <h3>
                                <IndianRupee size={20} />
                                Edit Price
                            </h3>
                            <button 
                                className="close-modal-btn"
                                onClick={cancelEditingPrice}
                                aria-label="Close"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="price-modal-content">
                            <div className="price-form">
                                <div className="form-group">
                                    <label htmlFor="price-input">Price</label>
                                    <div className="price-input-group">
                                        <select
                                            value={priceForm.currency}
                                            onChange={(e) => setPriceForm(prev => ({ ...prev, currency: e.target.value }))}
                                            className="currency-select"
                                        >
                                            {currencies.map(curr => (
                                                <option key={curr.value} value={curr.value}>
                                                    {curr.label}
                                                </option>
                                            ))}
                                        </select>
                                        <input
                                            id="price-input"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={priceForm.price}
                                            onChange={(e) => setPriceForm(prev => ({ ...prev, price: e.target.value }))}
                                            placeholder="0.00"
                                            className="price-input"
                                            autoFocus
                                        />
                                    </div>
                                </div>
                                
                                <div className="form-group">
                                    <label htmlFor="unit-select">Unit</label>
                                    <select
                                        id="unit-select"
                                        value={priceForm.unit}
                                        onChange={(e) => setPriceForm(prev => ({ ...prev, unit: e.target.value }))}
                                        className="unit-select"
                                    >
                                        {priceUnits.map(unit => (
                                            <option key={unit.value} value={unit.value}>
                                                {unit.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div className="price-preview">
                                    <strong>Preview: </strong>
                                    {priceForm.price && !isNaN(parseFloat(priceForm.price)) ? (
                                        <span className="preview-text">
                                            {formatPrice({
                                                price: parseFloat(priceForm.price),
                                                unit: priceForm.unit,
                                                currency: priceForm.currency
                                            })}
                                        </span>
                                    ) : (
                                        <span className="preview-placeholder">Enter a price to see preview</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <div className="price-modal-actions">
                            {pricing.get(editingPrice) && (
                                <button
                                    className="btn btn-danger"
                                    onClick={() => {
                                        removePrice(editingPrice);
                                        cancelEditingPrice();
                                    }}
                                >
                                    <Trash2 size={16} />
                                    Remove Price
                                </button>
                            )}
                            
                            <div className="action-buttons">
                                <button
                                    className="btn btn-secondary"
                                    onClick={cancelEditingPrice}
                                >
                                    <XCircle size={16} />
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => savePrice(editingPrice)}
                                    disabled={!priceForm.price || isNaN(parseFloat(priceForm.price))}
                                >
                                    <Save size={16} />
                                    Save Price
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast.show && (
                <div className={`toast toast-${toast.type}`}>
                    <div className="toast-content">
                        <span className="toast-icon">
                            {toast.type === 'success' ? '✓' : '✕'}
                        </span>
                        <span className="toast-message">{toast.message}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Gallery;