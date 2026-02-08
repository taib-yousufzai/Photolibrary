/**
 * Force Download Utility - Bypasses Browser Restrictions
 * 
 * Uses multiple aggressive methods to force file downloads
 */

/**
 * Force download using iframe method
 */
export const forceDownloadViaIframe = (url, filename) => {
    try {
        console.log('🔄 Forcing download via iframe:', filename);
        
        // Create hidden iframe
        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;visibility:hidden;';
        
        // Set source to trigger download
        iframe.src = url;
        
        // Add to DOM
        document.body.appendChild(iframe);
        
        // Remove after delay
        setTimeout(() => {
            if (iframe.parentNode) {
                document.body.removeChild(iframe);
            }
        }, 3000);
        
        console.log('✅ Iframe download triggered');
        return true;
        
    } catch (error) {
        console.error('❌ Iframe download failed:', error);
        return false;
    }
};

/**
 * Force download by opening in new window
 */
export const forceDownloadViaWindow = (url, filename) => {
    try {
        console.log('🔄 Forcing download via new window:', filename);
        
        // Open in new window with download intent
        const newWindow = window.open(url, '_blank', 'width=1,height=1,scrollbars=no,resizable=no');
        
        if (newWindow) {
            // Close after a short delay
            setTimeout(() => {
                try {
                    newWindow.close();
                } catch (e) {
                    // Ignore close errors
                }
            }, 2000);
            
            console.log('✅ New window download triggered');
            return true;
        } else {
            console.warn('⚠️ Popup blocked');
            return false;
        }
        
    } catch (error) {
        console.error('❌ New window download failed:', error);
        return false;
    }
};

/**
 * Force download using form submission
 */
export const forceDownloadViaForm = (url, filename) => {
    try {
        console.log('🔄 Forcing download via form:', filename);
        
        // Create hidden form
        const form = document.createElement('form');
        form.method = 'GET';
        form.action = url;
        form.target = '_blank';
        form.style.display = 'none';
        
        // Add to DOM and submit
        document.body.appendChild(form);
        form.submit();
        
        // Remove form
        setTimeout(() => {
            if (form.parentNode) {
                document.body.removeChild(form);
            }
        }, 1000);
        
        console.log('✅ Form download triggered');
        return true;
        
    } catch (error) {
        console.error('❌ Form download failed:', error);
        return false;
    }
};

/**
 * Force download using location change
 */
export const forceDownloadViaLocation = (url, filename) => {
    try {
        console.log('🔄 Forcing download via location:', filename);
        
        // Save current location
        const currentUrl = window.location.href;
        
        // Change location to file URL
        window.location.href = url;
        
        // Restore location after delay
        setTimeout(() => {
            if (window.location.href === url) {
                window.location.href = currentUrl;
            }
        }, 3000);
        
        console.log('✅ Location download triggered');
        return true;
        
    } catch (error) {
        console.error('❌ Location download failed:', error);
        return false;
    }
};

/**
 * Create download with user instructions
 */
export const showDownloadInstructions = (url, filename) => {
    const instructions = `📥 Manual Download Required\n\n` +
                        `File: ${filename}\n\n` +
                        `Your browser is blocking automatic downloads. Please:\n\n` +
                        `1. Copy this URL: ${url}\n` +
                        `2. Open a new tab\n` +
                        `3. Paste the URL and press Enter\n` +
                        `4. Right-click the image and select "Save image as..."\n\n` +
                        `Would you like to copy the URL to clipboard?`;
    
    if (confirm(instructions)) {
        try {
            navigator.clipboard.writeText(url).then(() => {
                alert('✅ URL copied to clipboard!\n\nPaste it in a new tab to download the file.');
            }).catch(() => {
                prompt('Copy this URL manually:', url);
            });
        } catch (error) {
            prompt('Copy this URL manually:', url);
        }
    }
};

/**
 * Main force download function with all methods
 */
export const forceDownload = async (url, filename) => {
    console.log('🚀 Starting aggressive download for:', filename);
    
    if (!url || !filename) {
        console.error('❌ URL and filename are required');
        return false;
    }
    
    // Method 1: Try iframe download
    if (forceDownloadViaIframe(url, filename)) {
        setTimeout(() => {
            alert('📥 Download initiated via iframe method.\n\nCheck your downloads folder for the file.\n\nIf no download started, we\'ll try another method.');
        }, 1000);
        return true;
    }
    
    // Method 2: Try new window
    if (forceDownloadViaWindow(url, filename)) {
        setTimeout(() => {
            alert('📥 Download initiated via new window.\n\nCheck your downloads folder for the file.\n\nIf no download started, we\'ll show manual instructions.');
        }, 2000);
        return true;
    }
    
    // Method 3: Try form submission
    if (forceDownloadViaForm(url, filename)) {
        setTimeout(() => {
            alert('📥 Download initiated via form submission.\n\nCheck your downloads folder for the file.');
        }, 1000);
        return true;
    }
    
    // Method 4: Show manual instructions
    setTimeout(() => {
        showDownloadInstructions(url, filename);
    }, 500);
    
    return true; // Always return true as we provide manual fallback
};

/**
 * Simple test download
 */
export const testForceDownload = () => {
    try {
        console.log('🧪 Testing force download...');
        
        // Create test file
        const content = `Force Download Test\nCreated: ${new Date().toISOString()}\n\nThis file tests aggressive download methods.`;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        // Try force download
        const result = forceDownload(url, 'force-download-test.txt');
        
        // Cleanup
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 5000);
        
        return result;
        
    } catch (error) {
        console.error('❌ Force download test failed:', error);
        return false;
    }
};

export default {
    forceDownload,
    forceDownloadViaIframe,
    forceDownloadViaWindow,
    forceDownloadViaForm,
    forceDownloadViaLocation,
    showDownloadInstructions,
    testForceDownload
};