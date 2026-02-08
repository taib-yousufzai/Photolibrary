/**
 * Download Test Utility
 * 
 * Helps debug download issues by testing different methods
 */

import { downloadFile } from './downloadUtils';

/**
 * Test download functionality with a sample image
 */
export const testDownload = async () => {
    // Create a test blob (small image)
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    
    // Draw a simple test pattern
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(0, 0, 100, 100);
    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.fillText('TEST', 30, 55);
    
    // Convert to blob
    return new Promise((resolve) => {
        canvas.toBlob(async (blob) => {
            const testUrl = URL.createObjectURL(blob);
            
            try {
                console.log('🧪 Testing download functionality...');
                const result = await downloadFile(testUrl, 'download-test.png');
                
                console.log('✅ Download test result:', result);
                
                // Cleanup
                URL.revokeObjectURL(testUrl);
                
                resolve(result);
            } catch (error) {
                console.error('❌ Download test failed:', error);
                URL.revokeObjectURL(testUrl);
                resolve({ success: false, error: error.message });
            }
        }, 'image/png');
    });
};

/**
 * Test download with a Firebase Storage URL
 */
export const testFirebaseDownload = async (firebaseUrl, filename = 'firebase-test-download') => {
    if (!firebaseUrl || !firebaseUrl.includes('firebasestorage.googleapis.com')) {
        console.error('❌ Invalid Firebase Storage URL provided');
        return { success: false, error: 'Invalid Firebase Storage URL' };
    }
    
    try {
        console.log('🔥 Testing Firebase Storage download...');
        const result = await downloadFile(firebaseUrl, filename);
        console.log('✅ Firebase download test result:', result);
        return result;
    } catch (error) {
        console.error('❌ Firebase download test failed:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Check browser download capabilities
 */
export const checkDownloadCapabilities = () => {
    const capabilities = {
        fetch: typeof fetch !== 'undefined',
        blob: typeof Blob !== 'undefined',
        url: typeof URL !== 'undefined' && typeof URL.createObjectURL !== 'undefined',
        xhr: typeof XMLHttpRequest !== 'undefined',
        canvas: typeof HTMLCanvasElement !== 'undefined',
        download: (() => {
            const a = document.createElement('a');
            return typeof a.download !== 'undefined';
        })(),
        clipboard: typeof navigator.clipboard !== 'undefined',
        webShare: typeof navigator.share !== 'undefined'
    };
    
    console.log('🔍 Browser download capabilities:', capabilities);
    
    const issues = [];
    if (!capabilities.fetch) issues.push('Fetch API not supported');
    if (!capabilities.blob) issues.push('Blob not supported');
    if (!capabilities.url) issues.push('URL.createObjectURL not supported');
    if (!capabilities.download) issues.push('Download attribute not supported');
    
    if (issues.length > 0) {
        console.warn('⚠️ Potential download issues:', issues);
    } else {
        console.log('✅ All download capabilities are supported');
    }
    
    return { capabilities, issues };
};

export default {
    testDownload,
    testFirebaseDownload,
    checkDownloadCapabilities
};