/**
 * 🧪 Test Script for Download & Favorites Functionality
 * 
 * Run this in browser console to test the functions
 */

// Test data
const testImage = {
    id: 'test-image-1',
    url: 'https://via.placeholder.com/800x600/4CAF50/white?text=Test+Image',
    name: 'test-image.jpg',
    title: 'Test Image'
};

const testUserId = 'test-user-123';

// Test localStorage favorites
console.log('🧪 Testing Favorites System...');

// 1. Test saving to favorites
const storageKey = `favorites_${testUserId}`;
const currentFavorites = JSON.parse(localStorage.getItem(storageKey) || '[]');
console.log('Current favorites:', currentFavorites);

// 2. Add test image to favorites
const updatedFavorites = [...currentFavorites, testImage.id];
localStorage.setItem(storageKey, JSON.stringify(updatedFavorites));
console.log('✅ Added to favorites:', updatedFavorites);

// 3. Check if favorited
const isFavorited = updatedFavorites.includes(testImage.id);
console.log('Is favorited:', isFavorited);

// 4. Remove from favorites
const removedFavorites = updatedFavorites.filter(id => id !== testImage.id);
localStorage.setItem(storageKey, JSON.stringify(removedFavorites));
console.log('✅ Removed from favorites:', removedFavorites);

// Test download function (simplified version)
console.log('🧪 Testing Download Function...');

const testDownload = async () => {
    try {
        console.log('📥 Starting test download...');
        
        // Fetch the test image
        const response = await fetch(testImage.url, {
            method: 'GET',
            mode: 'cors',
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Convert to blob
        const blob = await response.blob();
        console.log('✅ Blob created:', blob.size, 'bytes');
        
        // Create download link
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = testImage.name;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        }, 100);
        
        console.log('✅ Test download completed!');
        
    } catch (error) {
        console.error('❌ Test download failed:', error);
    }
};

// Run the test
testDownload();

console.log('🎯 Test completed! Check Downloads folder for test-image.jpg');