 /**
 * Simple Download Test - Error-Free Implementation
 * 
 * Provides basic download testing without complex error handling
 */

/**
 * Simple test that creates and downloads a text file
 */
export const simpleDownloadTest = () => {
    try {
        console.log('🧪 Running simple download test...');
        
        // Create test content
        const content = `Simple Download Test
Created: ${new Date().toISOString()}
Browser: ${navigator.userAgent.split(' ').pop()}
URL: ${window.location.href}

This file was created by the download test system.
If you can see this file in your downloads folder, 
the download functionality is working correctly.`;

        // Create blob
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        // Create download link
        const link = document.createElement('a');
        link.href = url;
        link.download = 'simple-download-test.txt';
        link.style.display = 'none';
        
        // Add to DOM and click
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        setTimeout(() => {
            if (link.parentNode) {
                document.body.removeChild(link);
            }
            URL.revokeObjectURL(url);
        }, 1000);
        
        console.log('✅ Simple download test completed');
        return { success: true, message: 'Download test completed' };
        
    } catch (error) {
        console.error('❌ Simple download test failed:', error);
        return { success: false, message: error.message || 'Unknown error' };
    }
};

/**
 * Test Firebase URL format without making requests
 */
export const testFirebaseUrlFormat = (url) => {
    try {
        if (!url || typeof url !== 'string') {
            return { valid: false, reason: 'URL is empty or not a string' };
        }
        
        if (!url.includes('firebasestorage.googleapis.com')) {
            return { valid: false, reason: 'Not a Firebase Storage URL' };
        }
        
        // Try to parse as URL
        const urlObj = new URL(url);
        
        if (!urlObj.pathname.includes('/o/')) {
            return { valid: false, reason: 'Invalid Firebase Storage path format' };
        }
        
        return { 
            valid: true, 
            host: urlObj.host,
            pathname: urlObj.pathname,
            hasToken: urlObj.searchParams.has('token')
        };
        
    } catch (error) {
        return { valid: false, reason: 'Invalid URL format' };
    }
};

/**
 * Safe error message formatter
 */
export const formatErrorMessage = (error) => {
    if (!error) return 'Unknown error occurred';
    
    if (typeof error === 'string') return error;
    
    if (error.message) return error.message;
    
    if (error.toString) return error.toString();
    
    return 'Error occurred but details unavailable';
};

/**
 * Check browser download capabilities safely
 */
export const checkDownloadSupport = () => {
    const support = {
        downloadAttribute: false,
        blobUrls: false,
        createObjectURL: false
    };
    
    try {
        // Test download attribute
        const testLink = document.createElement('a');
        support.downloadAttribute = 'download' in testLink;
    } catch (e) {
        // Ignore error
    }
    
    try {
        // Test blob URLs
        support.blobUrls = typeof Blob !== 'undefined';
    } catch (e) {
        // Ignore error
    }
    
    try {
        // Test createObjectURL
        support.createObjectURL = typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function';
    } catch (e) {
        // Ignore error
    }
    
    return support;
};

export default {
    simpleDownloadTest,
    testFirebaseUrlFormat,
    formatErrorMessage,
    checkDownloadSupport
};