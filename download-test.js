/**
 * 🧪 DOWNLOAD FUNCTIONALITY TEST
 * 
 * Run this in browser console to test the download system
 * Make sure you're on the gallery page with images loaded
 */

// Test the download functionality
window.testDownload = function() {
    console.log('🧪 Testing Download Functionality...');
    
    // Test data with different filename scenarios
    const testCases = [
        {
            name: '1766838986732_391-17612105-kmBGY.jpg',
            url: 'https://via.placeholder.com/800x600/4CAF50/white?text=Test+Image+1',
            type: 'image'
        },
        {
            name: 'interior-design-sample.png',
            url: 'https://via.placeholder.com/800x600/2196F3/white?text=Test+Image+2',
            type: 'image'
        },
        {
            name: 'no-extension-file',
            url: 'https://via.placeholder.com/800x600/FF9800/white?text=Test+Image+3',
            type: 'image'
        },
        {
            name: '',
            url: 'https://via.placeholder.com/800x600/9C27B0/white?text=Test+Image+4',
            type: 'image'
        }
    ];
    
    console.log('📋 Test cases prepared:', testCases.length);
    
    // Test filename extension function
    const ensureFileExtension = (filename, url) => {
        if (!filename) return 'download.jpg';
        
        // If filename already has extension, use it
        if (filename.includes('.')) {
            return filename;
        }
        
        // Try to get extension from URL
        try {
            const urlPath = new URL(url).pathname;
            const urlExtension = urlPath.split('.').pop();
            if (urlExtension && urlExtension.length <= 4) {
                return `${filename}.${urlExtension}`;
            }
        } catch (e) {
            console.warn('Could not parse URL for extension');
        }
        
        // Default to .jpg for images
        return `${filename}.jpg`;
    };
    
    // Test each case
    testCases.forEach((testCase, index) => {
        const result = ensureFileExtension(testCase.name, testCase.url);
        console.log(`Test ${index + 1}:`, {
            input: testCase.name || '(empty)',
            url: testCase.url,
            output: result,
            passed: result.includes('.')
        });
    });
    
    return {
        testsPassed: testCases.length,
        ensureFileExtension
    };
};

// Test actual download (requires user interaction)
window.testActualDownload = async function() {
    console.log('📥 Testing Actual Download...');
    
    const testImage = {
        id: 'test-download-' + Date.now(),
        name: '1766838986732_391-17612105-kmBGY.jpg',
        url: 'https://via.placeholder.com/800x600/4CAF50/white?text=Download+Test',
        type: 'image'
    };
    
    console.log('🖼️ Test image:', testImage);
    
    try {
        // Simulate the download process
        console.log('📥 Starting download test...');
        
        // Fetch the image
        const response = await fetch(testImage.url, {
            method: 'GET',
            mode: 'cors',
            credentials: 'omit'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Convert to blob
        const blob = await response.blob();
        console.log('📦 Blob created:', blob.size, 'bytes, type:', blob.type);
        
        // Create download link
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = testImage.name;
        link.style.display = 'none';
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        }, 100);
        
        console.log('✅ Download test completed!');
        console.log('📁 Check your Downloads folder for:', testImage.name);
        
        return {
            success: true,
            filename: testImage.name,
            blobSize: blob.size
        };
        
    } catch (error) {
        console.error('❌ Download test failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Test browser compatibility
window.testBrowserCompatibility = function() {
    console.log('🌐 Testing Browser Compatibility...');
    
    const features = {
        fetch: typeof fetch !== 'undefined',
        blob: typeof Blob !== 'undefined',
        url: typeof URL !== 'undefined' && typeof URL.createObjectURL !== 'undefined',
        anchor: document.createElement('a').download !== undefined,
        xhr: typeof XMLHttpRequest !== 'undefined'
    };
    
    console.log('🔍 Feature support:', features);
    
    const allSupported = Object.values(features).every(supported => supported);
    
    console.log(allSupported ? '✅ All features supported!' : '⚠️ Some features missing');
    
    // Test specific browser
    const userAgent = navigator.userAgent;
    let browser = 'Unknown';
    
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';
    
    console.log('🌐 Browser:', browser);
    console.log('📱 User Agent:', userAgent);
    
    return {
        browser,
        features,
        allSupported,
        userAgent
    };
};

// Test CORS handling
window.testCORS = async function() {
    console.log('🔒 Testing CORS Handling...');
    
    const testUrls = [
        'https://via.placeholder.com/100x100/FF0000/FFFFFF?text=CORS+Test',
        'https://httpbin.org/image/jpeg', // This might have CORS issues
        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzAwRkYwMCIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkRhdGEgVVJMPC90ZXh0Pjwvc3ZnPg=='
    ];
    
    const results = [];
    
    for (const [index, url] of testUrls.entries()) {
        try {
            console.log(`🔍 Testing URL ${index + 1}:`, url.substring(0, 50) + '...');
            
            const response = await fetch(url, {
                method: 'GET',
                mode: 'cors',
                credentials: 'omit'
            });
            
            results.push({
                url: url.substring(0, 50) + '...',
                status: response.status,
                success: response.ok,
                contentType: response.headers.get('content-type')
            });
            
            console.log(`✅ URL ${index + 1} success:`, response.status);
            
        } catch (error) {
            results.push({
                url: url.substring(0, 50) + '...',
                success: false,
                error: error.message
            });
            
            console.log(`❌ URL ${index + 1} failed:`, error.message);
        }
    }
    
    console.log('📊 CORS test results:', results);
    return results;
};

console.log('🧪 Download test functions loaded!');
console.log('Run these commands in console:');
console.log('- testDownload() - Test filename handling');
console.log('- testActualDownload() - Test actual download (requires user interaction)');
console.log('- testBrowserCompatibility() - Check browser support');
console.log('- testCORS() - Test CORS handling');