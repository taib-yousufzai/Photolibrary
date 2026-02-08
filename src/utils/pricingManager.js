// Real-time Pricing Manager - Firebase Firestore Integration
import { db } from '../firebase/config';
import { 
    collection, 
    doc, 
    setDoc, 
    deleteDoc, 
    onSnapshot, 
    query, 
    where,
    serverTimestamp 
} from 'firebase/firestore';

/**
 * Real-time pricing manager that syncs across all devices
 * Stores pricing data in Firestore for real-time synchronization
 */
export class PricingManager {
    constructor() {
        this.listeners = new Map(); // Track active listeners
        this.cache = new Map(); // Local cache for performance
    }

    /**
     * Get the Firestore document path for pricing data
     */
    getPricingDocPath(categoryId, subCategoryId, mediaType, mediaId) {
        return `pricing/${categoryId}_${subCategoryId}_${mediaType}_${mediaId}`;
    }

    /**
     * Set price for a media item with real-time sync
     */
    async setPrice(categoryId, subCategoryId, mediaType, mediaId, priceData, userEmail) {
        try {
            const docPath = this.getPricingDocPath(categoryId, subCategoryId, mediaType, mediaId);
            const pricingDoc = {
                categoryId,
                subCategoryId,
                mediaType,
                mediaId,
                price: parseFloat(priceData.price),
                unit: priceData.unit || 'sqft',
                currency: priceData.currency || 'INR',
                updatedAt: serverTimestamp(),
                updatedBy: userEmail || 'Unknown',
                createdAt: serverTimestamp()
            };

            await setDoc(doc(db, 'pricing', docPath), pricingDoc, { merge: true });
            
            // Update local cache
            this.cache.set(mediaId, {
                price: pricingDoc.price,
                unit: pricingDoc.unit,
                currency: pricingDoc.currency,
                updatedAt: new Date().toISOString(),
                updatedBy: pricingDoc.updatedBy
            });

            console.log('💰 Price saved to Firestore:', { mediaId, ...pricingDoc });
            return true;
        } catch (error) {
            console.error('❌ Error saving price to Firestore:', error);
            throw error;
        }
    }

    /**
     * Remove price for a media item
     */
    async removePrice(categoryId, subCategoryId, mediaType, mediaId) {
        try {
            const docPath = this.getPricingDocPath(categoryId, subCategoryId, mediaType, mediaId);
            await deleteDoc(doc(db, 'pricing', docPath));
            
            // Remove from local cache
            this.cache.delete(mediaId);
            
            console.log('🗑️ Price removed from Firestore:', mediaId);
            return true;
        } catch (error) {
            console.error('❌ Error removing price from Firestore:', error);
            throw error;
        }
    }

    /**
     * Subscribe to real-time price updates for a category/subcategory
     */
    subscribeToPricing(categoryId, subCategoryId, mediaType, callback) {
        const listenerKey = `${categoryId}_${subCategoryId}_${mediaType}`;
        
        // Unsubscribe existing listener if any
        this.unsubscribeFromPricing(listenerKey);

        try {
            // Create query to get all pricing for this category/subcategory/mediaType
            const pricingQuery = query(
                collection(db, 'pricing'),
                where('categoryId', '==', categoryId),
                where('subCategoryId', '==', subCategoryId),
                where('mediaType', '==', mediaType)
            );

            // Set up real-time listener
            const unsubscribe = onSnapshot(pricingQuery, (snapshot) => {
                const pricingMap = new Map();
                
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    const mediaId = data.mediaId;
                    
                    if (mediaId) {
                        const priceData = {
                            price: data.price,
                            unit: data.unit,
                            currency: data.currency,
                            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                            updatedBy: data.updatedBy
                        };
                        
                        pricingMap.set(mediaId, priceData);
                        this.cache.set(mediaId, priceData);
                    }
                });

                console.log('📊 Real-time pricing update received:', {
                    listenerKey,
                    count: pricingMap.size,
                    timestamp: new Date().toISOString()
                });

                // Call the callback with updated pricing data
                callback(pricingMap);
            }, (error) => {
                console.error('❌ Error in pricing listener:', error);
                // Fallback to cached data on error
                callback(new Map(this.cache));
            });

            // Store the unsubscribe function
            this.listeners.set(listenerKey, unsubscribe);
            
            console.log('🔄 Subscribed to real-time pricing updates:', listenerKey);
            return unsubscribe;
            
        } catch (error) {
            console.error('❌ Error setting up pricing listener:', error);
            // Return cached data on error
            callback(new Map(this.cache));
            return null;
        }
    }

    /**
     * Unsubscribe from pricing updates
     */
    unsubscribeFromPricing(listenerKey) {
        const unsubscribe = this.listeners.get(listenerKey);
        if (unsubscribe) {
            unsubscribe();
            this.listeners.delete(listenerKey);
            console.log('🔇 Unsubscribed from pricing updates:', listenerKey);
        }
    }

    /**
     * Clean up all listeners
     */
    cleanup() {
        this.listeners.forEach((unsubscribe, key) => {
            unsubscribe();
            console.log('🧹 Cleaned up pricing listener:', key);
        });
        this.listeners.clear();
        this.cache.clear();
    }

    /**
     * Get cached price data (for immediate access)
     */
    getCachedPrice(mediaId) {
        return this.cache.get(mediaId);
    }

    /**
     * Format price for display
     */
    formatPrice(priceData) {
        if (!priceData || !priceData.price) return null;
        
        const { price, unit, currency } = priceData;
        const currencySymbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency;
        
        return `${currencySymbol}${price.toLocaleString()}/${unit}`;
    }
}

// Create a singleton instance
export const pricingManager = new PricingManager();

// Export utility functions for direct use
export const setPriceForMedia = (categoryId, subCategoryId, mediaType, mediaId, priceData, userEmail) => {
    return pricingManager.setPrice(categoryId, subCategoryId, mediaType, mediaId, priceData, userEmail);
};

export const removePriceForMedia = (categoryId, subCategoryId, mediaType, mediaId) => {
    return pricingManager.removePrice(categoryId, subCategoryId, mediaType, mediaId);
};

export const subscribeToPricingUpdates = (categoryId, subCategoryId, mediaType, callback) => {
    return pricingManager.subscribeToPricing(categoryId, subCategoryId, mediaType, callback);
};

export const formatPriceDisplay = (priceData) => {
    return pricingManager.formatPrice(priceData);
};