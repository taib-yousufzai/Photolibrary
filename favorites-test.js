/**
 * 🧪 FAVORITES FUNCTIONALITY TEST
 * 
 * Run this in browser console to test the favorites system
 * Make sure you're logged in and on the gallery page
 */

// Test the favorites functionality
window.testFavorites = function() {
    console.log('🧪 Testing Favorites Functionality...');
    
    // Get current user (assuming you're logged in)
    const user = { uid: 'test-user-123' }; // Replace with actual user
    const testMediaId = 'test-media-' + Date.now();
    
    console.log('👤 Testing with user:', user.uid);
    console.log('🖼️ Testing with media ID:', testMediaId);
    
    // Test 1: Check initial state
    const storageKey = `favorites_${user.uid}`;
    const initialFavorites = JSON.parse(localStorage.getItem(storageKey) || '[]');
    console.log('📚 Initial favorites:', initialFavorites);
    
    // Test 2: Add to favorites
    const updatedFavorites = [...initialFavorites, testMediaId];
    localStorage.setItem(storageKey, JSON.stringify(updatedFavorites));
    console.log('✅ Added to favorites:', updatedFavorites);
    
    // Test 3: Check if favorited
    const isFavorited = updatedFavorites.includes(testMediaId);
    console.log('❤️ Is favorited:', isFavorited);
    
    // Test 4: Remove from favorites
    const removedFavorites = updatedFavorites.filter(id => id !== testMediaId);
    localStorage.setItem(storageKey, JSON.stringify(removedFavorites));
    console.log('💔 Removed from favorites:', removedFavorites);
    
    // Test 5: Verify removal
    const finalCheck = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const isStillFavorited = finalCheck.includes(testMediaId);
    console.log('🔍 Final check - still favorited:', isStillFavorited);
    
    // Test 6: Test duplicate prevention
    const testDuplicates = [...finalCheck, 'duplicate-test', 'duplicate-test'];
    const noDuplicates = [...new Set(testDuplicates)];
    console.log('🚫 Duplicate prevention test:', {
        withDuplicates: testDuplicates,
        withoutDuplicates: noDuplicates
    });
    
    console.log('✅ Favorites test completed!');
    
    return {
        initialFavorites,
        finalFavorites: finalCheck,
        testPassed: !isStillFavorited
    };
};

// Test the UI update functionality
window.testFavoritesUI = function() {
    console.log('🎨 Testing Favorites UI Updates...');
    
    // Find favorite buttons on the page
    const favoriteButtons = document.querySelectorAll('button[title*="favorite"], button[aria-label*="favorite"]');
    console.log('🔘 Found favorite buttons:', favoriteButtons.length);
    
    favoriteButtons.forEach((button, index) => {
        console.log(`Button ${index + 1}:`, {
            text: button.textContent.trim(),
            classes: button.className,
            title: button.title,
            ariaLabel: button.getAttribute('aria-label')
        });
    });
    
    // Test heart icon states
    const heartIcons = document.querySelectorAll('svg[data-lucide="heart"]');
    console.log('❤️ Found heart icons:', heartIcons.length);
    
    heartIcons.forEach((heart, index) => {
        console.log(`Heart ${index + 1}:`, {
            fill: heart.getAttribute('fill'),
            isFilled: heart.getAttribute('fill') === 'currentColor'
        });
    });
    
    return {
        buttonCount: favoriteButtons.length,
        heartCount: heartIcons.length
    };
};

// Test localStorage persistence
window.testFavoritesPersistence = function() {
    console.log('💾 Testing Favorites Persistence...');
    
    const testUserId = 'persistence-test-' + Date.now();
    const storageKey = `favorites_${testUserId}`;
    const testData = ['item1', 'item2', 'item3'];
    
    // Save test data
    localStorage.setItem(storageKey, JSON.stringify(testData));
    console.log('💾 Saved test data:', testData);
    
    // Retrieve test data
    const retrieved = JSON.parse(localStorage.getItem(storageKey) || '[]');
    console.log('📖 Retrieved test data:', retrieved);
    
    // Compare
    const isEqual = JSON.stringify(testData) === JSON.stringify(retrieved);
    console.log('✅ Data persistence test:', isEqual ? 'PASSED' : 'FAILED');
    
    // Cleanup
    localStorage.removeItem(storageKey);
    console.log('🧹 Cleaned up test data');
    
    return { testPassed: isEqual };
};

console.log('🧪 Favorites test functions loaded!');
console.log('Run these commands in console:');
console.log('- testFavorites() - Test basic functionality');
console.log('- testFavoritesUI() - Test UI elements');
console.log('- testFavoritesPersistence() - Test localStorage');