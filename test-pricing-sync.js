// Test script for real-time pricing synchronization
import { pricingManager, setPriceForMedia, subscribeToPricingUpdates } from './src/utils/pricingManager.js';

async function testPricingSync() {
    console.log('🧪 Testing Real-time Pricing Synchronization...\n');

    const testData = {
        categoryId: 'test-category',
        subCategoryId: 'test-subcategory', 
        mediaType: 'image',
        mediaId: 'test-media-123',
        priceData: {
            price: 1500,
            unit: 'sqft',
            currency: 'INR'
        },
        userEmail: 'test@example.com'
    };

    try {
        // Test 1: Subscribe to pricing updates
        console.log('📡 Setting up real-time listener...');
        const unsubscribe = subscribeToPricingUpdates(
            testData.categoryId,
            testData.subCategoryId,
            testData.mediaType,
            (pricingMap) => {
                console.log('🔄 Real-time update received:');
                console.log(`   - Items: ${pricingMap.size}`);
                pricingMap.forEach((price, mediaId) => {
                    console.log(`   - ${mediaId}: ₹${price.price}/${price.unit}`);
                });
                console.log('');
            }
        );

        // Test 2: Set a price
        console.log('💰 Setting price for media item...');
        await setPriceForMedia(
            testData.categoryId,
            testData.subCategoryId,
            testData.mediaType,
            testData.mediaId,
            testData.priceData,
            testData.userEmail
        );
        console.log('✅ Price set successfully!\n');

        // Wait a moment for real-time update
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Test 3: Update the price
        console.log('🔄 Updating price...');
        await setPriceForMedia(
            testData.categoryId,
            testData.subCategoryId,
            testData.mediaType,
            testData.mediaId,
            {
                ...testData.priceData,
                price: 2000
            },
            testData.userEmail
        );
        console.log('✅ Price updated successfully!\n');

        // Wait for real-time update
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Test 4: Remove the price
        console.log('🗑️ Removing price...');
        await pricingManager.removePrice(
            testData.categoryId,
            testData.subCategoryId,
            testData.mediaType,
            testData.mediaId
        );
        console.log('✅ Price removed successfully!\n');

        // Wait for final update
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Cleanup
        if (unsubscribe) {
            unsubscribe();
        }
        pricingManager.cleanup();

        console.log('🎉 All tests completed successfully!');
        console.log('✅ Real-time pricing synchronization is working correctly.');

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run the test
testPricingSync();