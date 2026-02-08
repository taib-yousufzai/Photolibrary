// Migration script to move existing localStorage pricing data to Firebase
import { setPriceForMedia } from './src/utils/pricingManager.js';

/**
 * Migrate existing localStorage pricing data to Firebase Firestore
 * Run this script once after deploying the new pricing system
 */
async function migratePricingData() {
    console.log('🔄 Starting pricing data migration from localStorage to Firebase...\n');

    try {
        // Get all localStorage keys that contain pricing data
        const pricingKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('pricing_')) {
                pricingKeys.push(key);
            }
        }

        if (pricingKeys.length === 0) {
            console.log('ℹ️ No existing pricing data found in localStorage.');
            console.log('✅ Migration complete - nothing to migrate.\n');
            return;
        }

        console.log(`📊 Found ${pricingKeys.length} pricing datasets to migrate:\n`);

        let totalMigrated = 0;
        let errors = 0;

        for (const key of pricingKeys) {
            try {
                // Parse the key to extract category info
                // Format: pricing_categoryId_subCategoryId_mediaType
                const keyParts = key.replace('pricing_', '').split('_');
                if (keyParts.length !== 3) {
                    console.log(`⚠️ Skipping invalid key format: ${key}`);
                    continue;
                }

                const [categoryId, subCategoryId, mediaType] = keyParts;
                console.log(`🔄 Migrating: ${categoryId}/${subCategoryId}/${mediaType}`);

                // Get the pricing data from localStorage
                const storedData = localStorage.getItem(key);
                if (!storedData) continue;

                const pricingData = JSON.parse(storedData);
                
                // Migrate each media item's pricing
                for (const [mediaId, priceInfo] of Object.entries(pricingData)) {
                    try {
                        await setPriceForMedia(
                            categoryId,
                            subCategoryId,
                            mediaType,
                            mediaId,
                            {
                                price: priceInfo.price,
                                unit: priceInfo.unit || 'sqft',
                                currency: priceInfo.currency || 'INR'
                            },
                            priceInfo.updatedBy || 'Migration Script'
                        );

                        totalMigrated++;
                        console.log(`  ✅ Migrated ${mediaId}: ₹${priceInfo.price}/${priceInfo.unit || 'sqft'}`);
                        
                        // Small delay to avoid overwhelming Firestore
                        await new Promise(resolve => setTimeout(resolve, 100));
                        
                    } catch (error) {
                        errors++;
                        console.log(`  ❌ Failed to migrate ${mediaId}:`, error.message);
                    }
                }

                console.log(''); // Empty line for readability

            } catch (error) {
                errors++;
                console.log(`❌ Error processing ${key}:`, error.message);
            }
        }

        console.log('\n📊 Migration Summary:');
        console.log(`✅ Successfully migrated: ${totalMigrated} price entries`);
        console.log(`❌ Errors encountered: ${errors}`);
        
        if (errors === 0) {
            console.log('\n🎉 Migration completed successfully!');
            console.log('💡 You can now safely clear localStorage pricing data if desired.');
            console.log('   The new system will use Firebase Firestore for real-time sync.');
        } else {
            console.log('\n⚠️ Migration completed with some errors.');
            console.log('   Please review the errors above and retry if necessary.');
        }

    } catch (error) {
        console.error('❌ Migration failed:', error);
    }
}

/**
 * Clear localStorage pricing data after successful migration
 * Only run this after confirming the migration was successful
 */
function clearLocalStoragePricing() {
    console.log('🧹 Clearing localStorage pricing data...');
    
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('pricing_')) {
            keysToRemove.push(key);
        }
    }

    keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log(`🗑️ Removed: ${key}`);
    });

    console.log(`✅ Cleared ${keysToRemove.length} localStorage pricing entries.`);
}

// Export functions for manual use
window.migratePricingData = migratePricingData;
window.clearLocalStoragePricing = clearLocalStoragePricing;

// Auto-run migration (comment out if you want to run manually)
console.log('🚀 Auto-running pricing data migration...');
migratePricingData();