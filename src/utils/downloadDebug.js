/**
 * Download Debug Utility
 * 
 * Simple test to identify download issues
 */

import { downloadFile } from './downloadUtils';

/**
 * Test download with a simple blob
 */
export const testSimpleDownload = async () => {
    try {
        console.log('🧪 Testing simple download...');
        
        // Create a simple text blob
        const testContent = 'This is a test download file.\nCreated at: ' + new Date().toISOString();
        const blob = new Blob([testContent], { type: 'text/plain' });
        const testUrl = URL.createObjectURL(blob);
        
        // Test the download
        const result = await downloadFile(testUrl, 'test-download.txt');
        
        // Cleanup
        URL.revokeObjectURL(testUrl);
        
        console.log('✅ Simple download test result:', result);
        return result;
        
    } catch (error) {
        console.error('❌ Simple download test failed:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Test download with direct link approach
 */
export const testDirectDownload = (filename = 'direct-test.txt') => {
    try {
        console.log('🧪 Testing direct download approach...');
        
        // Create test content
        const testContent = 'Direct download test\nTimestamp: ' + new Date().toISOString();
        const blob = new Blob([testContent], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        
        // Create download link
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        // Add to DOM and click
        document.body.appendChild(link);
        
        console.log('🔗 Created download link:', {
            href: link.href,
            download: link.download,
            inDOM: document.body.contains(link)
        });
        
        // Try clicking
        link.click();
        
        // Cleanup after delay
        setTimeout(() => {
            if (link.parentNode) {
                document.body.removeChild(link);
            }
            URL.revokeObjectURL(url);
            console.log('🧹 Cleaned up direct download test');
        }, 1000);
        
        console.log('✅ Direct download test completed');
        return { success: true, method: 'direct' };
        
    } catch (error) {
        console.error('❌ Direct download test failed:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Check browser download support
 */
export const checkBrowserSupport = () => {
    const support = {
        downloadAttribute: (() => {
            const a = document.createElement('a');
            return 'download' in a;
        })(),
        blobUrls: typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function',
        fetch: typeof fetch !== 'undefined',
        fileReader: typeof FileReader !== 'undefined',
        mouseEvents: typeof MouseEvent !== 'undefined'
    };
    
    console.log('🔍 Browser download support:', support);
    
    const issues = [];
    if (!support.downloadAttribute) issues.push('Download attribute not supported');
    if (!support.blobUrls) issues.push('Blob URLs not supported');
    if (!support.fetch) issues.push('Fetch API not supported');
    if (!support.fileReader) issues.push('FileReader not supported');
    if (!support.mouseEvents) issues.push('MouseEvent not supported');
    
    return { support, issues };
};

/**
 * Test with Firebase Storage URL (if provided)
 */
export const testFirebaseUrl = async (firebaseUrl, filename = 'firebase-test') => {
    if (!firebaseUrl || !firebaseUrl.includes('firebasestorage.googleapis.com')) {
        return { success: false, error: 'Invalid Firebase URL' };
    }
    
    try {
        console.log('🔥 Testing Firebase URL download:', firebaseUrl);
        
        const result = await downloadFile(firebaseUrl, filename);
        console.log('✅ Firebase URL test result:', result);
        return result;
        
    } catch (error) {
        console.error('❌ Firebase URL test failed:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Run all download tests
 */
export const runAllTests = async (firebaseUrl = null) => {
    console.log('🚀 Running comprehensive download tests...');
    
    const results = {
        browserSupport: checkBrowserSupport(),
        directDownload: testDirectDownload(),
        simpleDownload: await testSimpleDownload()
    };
    
    if (firebaseUrl) {
        results.firebaseTest = await testFirebaseUrl(firebaseUrl);
    }
    
    console.log('📊 All test results:', results);
    
    // Summary
    const successful = Object.values(results).filter(r => r.success === true).length;
    const total = Object.keys(results).length - (results.browserSupport ? 1 : 0); // Don't count browser support
    
    console.log(`📈 Test Summary: ${successful}/${total} tests passed`);
    
    return results;
};

export default {
    testSimpleDownload,
    testDirectDownload,
    checkBrowserSupport,
    testFirebaseUrl,
    runAllTests
};