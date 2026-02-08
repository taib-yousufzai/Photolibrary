/**
 * Firebase Storage Download Fix
 * 
 * Specific solutions for Firebase Storage download issues
 */

/**
 * Test Firebase Storage URL access
 */
export const testFirebaseAccess = async (firebaseUrl) => {
    console.log('🔥 Testing Firebase Storage access:', firebaseUrl);
    
    try {
        // Test basic fetch
        const response = await fetch(firebaseUrl, {
            method: 'HEAD', // Just check if we can access
            mode: 'cors'
        });
        
        console.log('📡 Firebase access test:', {
            status: response.status,
            ok: response.ok,
            headers: Object.fromEntries(response.headers.entries())
        });
        
        return {
            success: response.ok,
            status: response.status,
            headers: Object.fromEntries(response.headers.entries())
        };
        
    } catch (error) {
        console.error('❌ Firebase access failed:', error);
        return {
            success: false,
            error: error.message,
            type: error.name
        };
    }
};

/**
 * Download Firebase Storage file with CORS workaround
 */
export const downloadFirebaseFile = async (url, filename) => {
    console.log('🔥 Attempting Firebase Storage download:', filename);
    
    try {
        // Method 1: Try with modified URL parameters
        const downloadUrl = new URL(url);
        downloadUrl.searchParams.set('response-content-disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        downloadUrl.searchParams.set('response-content-type', 'application/octet-stream');
        
        console.log('🔗 Modified URL:', downloadUrl.toString());
        
        // Try direct link approach first
        const link = document.createElement('a');
        link.href = downloadUrl.toString();
        link.download = filename;
        link.target = '_blank';
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        
        // Wait a moment then cleanup
        setTimeout(() => {
            document.body.removeChild(link);
        }, 1000);
        
        console.log('✅ Firebase direct download attempted');
        return { success: true, method: 'firebase-direct' };
        
    } catch (error) {
        console.error('❌ Firebase direct download failed:', error);
        
        // Method 2: Try proxy approach
        try {
            return await downloadViaProxy(url, filename);
        } catch (proxyError) {
            console.error('❌ Proxy download failed:', proxyError);
            
            // Method 3: Force new tab with instructions
            return await forceNewTabDownload(url, filename);
        }
    }
};

/**
 * Download via proxy/fetch with blob
 */
const downloadViaProxy = async (url, filename) => {
    console.log('🔄 Trying proxy download method');
    
    try {
        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors',
            credentials: 'omit',
            headers: {
                'Accept': '*/*',
                'Cache-Control': 'no-cache'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const blob = await response.blob();
        console.log('📦 Got blob:', blob.size, 'bytes, type:', blob.type);
        
        // Force download with application/octet-stream
        const downloadBlob = new Blob([blob], { type: 'application/octet-stream' });
        const blobUrl = URL.createObjectURL(downloadBlob);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        
        // Try multiple click methods
        let success = false;
        
        // Method 1: Standard click
        try {
            link.click();
            success = true;
            console.log('✅ Standard click worked');
        } catch (e) {
            console.warn('⚠️ Standard click failed');
        }
        
        // Method 2: Programmatic event
        if (!success) {
            try {
                const event = new MouseEvent('click', {
                    view: window,
                    bubbles: true,
                    cancelable: true
                });
                link.dispatchEvent(event);
                success = true;
                console.log('✅ Programmatic click worked');
            } catch (e) {
                console.warn('⚠️ Programmatic click failed');
            }
        }
        
        // Cleanup
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
        }, 1000);
        
        if (success) {
            console.log('✅ Proxy download completed');
            return { success: true, method: 'proxy' };
        } else {
            throw new Error('All click methods failed');
        }
        
    } catch (error) {
        throw new Error(`Proxy download failed: ${error.message}`);
    }
};

/**
 * Force new tab download with user instructions
 */
const forceNewTabDownload = async (url, filename) => {
    console.log('🔄 Using new tab fallback');
    
    try {
        // Open in new tab
        const newTab = window.open(url, '_blank');
        
        // Show instructions after a delay
        setTimeout(() => {
            const instructions = `📥 Download Instructions for "${filename}":\n\n` +
                               `The file opened in a new tab due to browser security restrictions.\n\n` +
                               `To download:\n` +
                               `1. Right-click on the image\n` +
                               `2. Select "Save image as..." or "Save as..."\n` +
                               `3. Choose your download location\n` +
                               `4. Click "Save"\n\n` +
                               `Alternative: Press Ctrl+S (Cmd+S on Mac) to save the page.`;
            
            if (confirm(instructions + '\n\nWould you like to copy the file URL to clipboard?')) {
                navigator.clipboard.writeText(url).then(() => {
                    alert('✅ File URL copied to clipboard!\n\nYou can paste it in a new tab or download manager.');
                }).catch(() => {
                    prompt('Copy this URL manually:', url);
                });
            }
        }, 1500);
        
        return { success: true, method: 'newtab-instructions' };
        
    } catch (error) {
        throw new Error(`New tab fallback failed: ${error.message}`);
    }
};

/**
 * Check if URL is Firebase Storage
 */
export const isFirebaseStorageUrl = (url) => {
    return url && url.includes('firebasestorage.googleapis.com');
};

/**
 * Extract filename from Firebase Storage URL
 */
export const extractFirebaseFilename = (url) => {
    try {
        const urlObj = new URL(url);
        const pathMatch = urlObj.pathname.match(/\/o\/(.+)$/);
        
        if (pathMatch) {
            const encodedPath = pathMatch[1];
            const decodedPath = decodeURIComponent(encodedPath);
            
            // Extract just the filename from the path
            const parts = decodedPath.split('/');
            const filename = parts[parts.length - 1];
            
            return filename || 'download';
        }
        
        return 'download';
    } catch (error) {
        console.warn('Could not extract filename from Firebase URL:', error);
        return 'download';
    }
};

/**
 * Main Firebase download function
 */
export const downloadFromFirebase = async (url, filename) => {
    if (!isFirebaseStorageUrl(url)) {
        throw new Error('Not a Firebase Storage URL');
    }
    
    console.log('🔥 Starting Firebase Storage download:', filename);
    
    // First test if we can access the URL
    const accessTest = await testFirebaseAccess(url);
    
    if (!accessTest.success) {
        console.error('❌ Cannot access Firebase Storage URL:', accessTest.error);
        
        if (accessTest.type === 'TypeError' && accessTest.error && accessTest.error.includes('CORS')) {
            throw new Error('CORS error: Firebase Storage CORS configuration may be needed');
        } else {
            throw new Error(`Access denied: ${accessTest.error}`);
        }
    }
    
    console.log('✅ Firebase Storage URL is accessible');
    
    // Try to download
    return await downloadFirebaseFile(url, filename);
};

export default {
    testFirebaseAccess,
    downloadFirebaseFile,
    downloadFromFirebase,
    isFirebaseStorageUrl,
    extractFirebaseFilename
};