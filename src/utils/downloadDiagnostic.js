/**
 * Download Diagnostic Tool
 * 
 * Helps identify specific issues with download functionality
 */

/**
 * Test if basic download functionality works
 */
export const testBasicDownload = () => {
    console.log('🔧 Testing basic download functionality...');
    
    try {
        // Create a simple test file
        const content = 'Test download file\nCreated: ' + new Date().toISOString();
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        // Create download link
        const link = document.createElement('a');
        link.href = url;
        link.download = 'test-download.txt';
        
        // Check if download attribute is supported
        if (!('download' in link)) {
            console.error('❌ Download attribute not supported in this browser');
            return { success: false, error: 'Download attribute not supported' };
        }
        
        // Add to DOM
        document.body.appendChild(link);
        
        console.log('🔗 Created download link:', {
            href: link.href,
            download: link.download,
            inDOM: document.body.contains(link)
        });
        
        // Try to trigger download
        link.click();
        
        // Cleanup
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 1000);
        
        console.log('✅ Basic download test completed');
        return { success: true, method: 'basic' };
        
    } catch (error) {
        console.error('❌ Basic download test failed:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Test download with different MIME types
 */
export const testMimeTypes = () => {
    console.log('🔧 Testing different MIME types...');
    
    const tests = [
        { type: 'text/plain', filename: 'test.txt', content: 'Plain text file' },
        { type: 'application/octet-stream', filename: 'test-binary.bin', content: 'Binary file' },
        { type: 'image/jpeg', filename: 'test.jpg', content: 'Fake image data' }
    ];
    
    tests.forEach((test, index) => {
        setTimeout(() => {
            try {
                const blob = new Blob([test.content], { type: test.type });
                const url = URL.createObjectURL(blob);
                
                const link = document.createElement('a');
                link.href = url;
                link.download = test.filename;
                link.style.display = 'none';
                
                document.body.appendChild(link);
                link.click();
                
                setTimeout(() => {
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                }, 500);
                
                console.log(`✅ MIME type test ${index + 1} completed:`, test.type);
                
            } catch (error) {
                console.error(`❌ MIME type test ${index + 1} failed:`, error);
            }
        }, index * 1000);
    });
    
    return { success: true, message: 'MIME type tests started' };
};

/**
 * Check browser security settings that might block downloads
 */
export const checkSecuritySettings = () => {
    console.log('🔧 Checking browser security settings...');
    
    const checks = {
        userGesture: document.hasStorageAccess !== undefined,
        popupBlocked: false,
        downloadBlocked: false,
        corsEnabled: true
    };
    
    // Test popup blocker
    try {
        const popup = window.open('', '_blank', 'width=1,height=1');
        if (popup) {
            popup.close();
            checks.popupBlocked = false;
        } else {
            checks.popupBlocked = true;
        }
    } catch (error) {
        checks.popupBlocked = true;
    }
    
    // Check if downloads are being blocked
    try {
        const link = document.createElement('a');
        link.href = 'data:text/plain,test';
        link.download = 'security-test.txt';
        link.style.display = 'none';
        
        document.body.appendChild(link);
        
        // Try to click without user gesture
        const clickEvent = new MouseEvent('click', { bubbles: true });
        const result = link.dispatchEvent(clickEvent);
        
        checks.downloadBlocked = !result;
        
        document.body.removeChild(link);
        
    } catch (error) {
        checks.downloadBlocked = true;
    }
    
    console.log('🔍 Security check results:', checks);
    return checks;
};

/**
 * Test with actual Firebase Storage URL pattern
 */
export const testFirebasePattern = (testUrl = null) => {
    console.log('🔧 Testing Firebase Storage URL pattern...');
    
    // Use a test URL if none provided
    const url = testUrl || 'https://firebasestorage.googleapis.com/v0/b/test-bucket/o/test-file.jpg?alt=media&token=test-token';
    
    try {
        // Test URL parsing
        const urlObj = new URL(url);
        console.log('🔗 URL components:', {
            origin: urlObj.origin,
            pathname: urlObj.pathname,
            search: urlObj.search,
            isFirebase: url.includes('firebasestorage.googleapis.com')
        });
        
        // Test if we can modify the URL for download
        const downloadUrl = new URL(url);
        downloadUrl.searchParams.set('response-content-disposition', 'attachment; filename="test-download.jpg"');
        
        console.log('📥 Modified download URL:', downloadUrl.toString());
        
        return { 
            success: true, 
            originalUrl: url, 
            downloadUrl: downloadUrl.toString(),
            isFirebase: url.includes('firebasestorage.googleapis.com')
        };
        
    } catch (error) {
        console.error('❌ Firebase URL test failed:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Run comprehensive diagnostic
 */
export const runDiagnostic = (firebaseUrl = null) => {
    console.log('🚀 Running download diagnostic...');
    
    const results = {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        basicDownload: testBasicDownload(),
        securitySettings: checkSecuritySettings(),
        firebasePattern: testFirebasePattern(firebaseUrl)
    };
    
    // Test MIME types (async)
    setTimeout(() => {
        results.mimeTypes = testMimeTypes();
    }, 2000);
    
    console.log('📊 Diagnostic results:', results);
    
    // Generate summary
    let summary = '📋 Download Diagnostic Summary:\n\n';
    summary += `🕐 Timestamp: ${results.timestamp}\n`;
    summary += `🌐 Browser: ${navigator.userAgent.split(' ').pop()}\n\n`;
    
    summary += `📥 Basic Download: ${results.basicDownload.success ? '✅ WORKING' : '❌ FAILED'}\n`;
    if (results.basicDownload.error) {
        summary += `   Error: ${results.basicDownload.error}\n`;
    }
    
    summary += `🔒 Security Settings:\n`;
    summary += `   • Popup Blocked: ${results.securitySettings.popupBlocked ? '❌ YES' : '✅ NO'}\n`;
    summary += `   • Download Blocked: ${results.securitySettings.downloadBlocked ? '❌ YES' : '✅ NO'}\n`;
    
    if (firebaseUrl) {
        summary += `🔥 Firebase URL: ${results.firebasePattern.success ? '✅ VALID' : '❌ INVALID'}\n`;
    }
    
    summary += '\n💡 Recommendations:\n';
    
    if (!results.basicDownload.success) {
        summary += '• Basic download failed - check browser compatibility\n';
    }
    
    if (results.securitySettings.popupBlocked) {
        summary += '• Popup blocker is active - may interfere with downloads\n';
    }
    
    if (results.securitySettings.downloadBlocked) {
        summary += '• Downloads may be blocked by browser security settings\n';
    }
    
    console.log(summary);
    
    return { results, summary };
};

export default {
    testBasicDownload,
    testMimeTypes,
    checkSecuritySettings,
    testFirebasePattern,
    runDiagnostic
};