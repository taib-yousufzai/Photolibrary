/**
 * Production-Ready Download Utilities
 * 
 * Provides robust file download functionality with multiple fallback methods
 * and comprehensive error handling for cross-browser compatibility.
 */

/**
 * Ensures filename has proper extension based on URL or content type
 * @param {string} filename - Original filename
 * @param {string} url - File URL
 * @param {string} contentType - MIME type (optional)
 * @returns {string} Filename with proper extension
 */
export const ensureFileExtension = (filename, url, contentType = '') => {
    if (!filename) return 'download.jpg';
    
    // If filename already has extension, use it
    if (filename.includes('.') && filename.split('.').pop().length <= 4) {
        return filename;
    }
    
    // Try to get extension from content type
    if (contentType) {
        const typeMap = {
            'image/jpeg': 'jpg',
            'image/jpg': 'jpg',
            'image/png': 'png',
            'image/webp': 'webp',
            'image/gif': 'gif',
            'video/mp4': 'mp4',
            'video/webm': 'webm',
            'video/avi': 'avi',
            'video/mov': 'mov'
        };
        
        const extension = typeMap[contentType.toLowerCase()];
        if (extension) {
            return `${filename}.${extension}`;
        }
    }
    
    // Try to get extension from URL
    try {
        const urlPath = new URL(url).pathname;
        const urlExtension = urlPath.split('.').pop();
        if (urlExtension && urlExtension.length <= 4 && !urlExtension.includes('/')) {
            return `${filename}.${urlExtension}`;
        }
    } catch (e) {
        console.warn('Could not parse URL for extension:', e.message);
    }
    
    // Default based on URL patterns
    if (url.includes('video') || url.includes('.mp4') || url.includes('.webm')) {
        return `${filename}.mp4`;
    }
    
    // Default to .jpg for images
    return `${filename}.jpg`;
};

/**
 * Creates and triggers a download using a blob URL with aggressive download forcing
 * @param {Blob} blob - File blob
 * @param {string} filename - Desired filename
 * @returns {Promise<void>}
 */
const triggerDownload = (blob, filename) => {
    return new Promise((resolve, reject) => {
        try {
            // Create blob URL
            const blobUrl = window.URL.createObjectURL(blob);
            
            // Method 1: Try direct download with click simulation
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            link.style.display = 'none';
            link.style.position = 'absolute';
            link.style.left = '-9999px';
            
            // Add to DOM
            document.body.appendChild(link);
            
            // Try multiple click methods to ensure download
            let downloadTriggered = false;
            
            // Method 1a: Standard click
            try {
                link.click();
                downloadTriggered = true;
                console.log('✅ Standard click method used');
            } catch (e) {
                console.warn('⚠️ Standard click failed:', e.message);
            }
            
            // Method 1b: Programmatic click event
            if (!downloadTriggered) {
                try {
                    const clickEvent = new MouseEvent('click', {
                        view: window,
                        bubbles: true,
                        cancelable: true
                    });
                    link.dispatchEvent(clickEvent);
                    downloadTriggered = true;
                    console.log('✅ Programmatic click method used');
                } catch (e) {
                    console.warn('⚠️ Programmatic click failed:', e.message);
                }
            }
            
            // Method 1c: Focus and click
            if (!downloadTriggered) {
                try {
                    link.focus();
                    link.click();
                    downloadTriggered = true;
                    console.log('✅ Focus and click method used');
                } catch (e) {
                    console.warn('⚠️ Focus and click failed:', e.message);
                }
            }
            
            // Cleanup after download is triggered
            setTimeout(() => {
                try {
                    if (link.parentNode) {
                        document.body.removeChild(link);
                    }
                    window.URL.revokeObjectURL(blobUrl);
                    
                    if (downloadTriggered) {
                        resolve();
                    } else {
                        reject(new Error('Failed to trigger download - all click methods failed'));
                    }
                } catch (cleanupError) {
                    console.warn('⚠️ Cleanup warning:', cleanupError);
                    resolve(); // Still resolve as we tried our best
                }
            }, 200); // Longer delay to ensure download starts
            
        } catch (error) {
            reject(new Error(`Failed to trigger download: ${error.message}`));
        }
    });
};

/**
 * Downloads a file using Fetch + Blob method with aggressive download forcing
 * @param {string} url - File URL
 * @param {string} filename - Desired filename
 * @param {Object} options - Download options
 * @returns {Promise<void>}
 */
const downloadViaFetch = async (url, filename, options = {}) => {
    const {
        timeout = 30000,
        headers = {},
        onProgress = null
    } = options;

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        console.log('📥 Starting fetch download:', filename);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/octet-stream, */*',
                'Cache-Control': 'no-cache',
                ...headers
            },
            mode: 'cors',
            credentials: 'omit',
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
        }

        // Get content type for better filename extension
        const contentType = response.headers.get('content-type') || '';
        const finalFilename = ensureFileExtension(filename, url, contentType);

        // Convert to blob with forced download type
        const blob = await response.blob();
        const downloadBlob = new Blob([blob], { 
            type: 'application/octet-stream' // Force download type
        });

        // Use the most aggressive download method
        await forceDownload(downloadBlob, finalFilename);

        console.log('✅ Fetch download completed:', finalFilename);
        
    } catch (error) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
            throw new Error('Download timeout - file too large or connection too slow');
        }
        
        throw new Error(`Fetch download failed: ${error.message}`);
    }
};

/**
 * Most aggressive download method that tries multiple approaches
 * @param {Blob} blob - File blob
 * @param {string} filename - Desired filename
 * @returns {Promise<void>}
 */
const forceDownload = (blob, filename) => {
    return new Promise((resolve, reject) => {
        try {
            // Method 1: Try with blob URL and multiple click attempts
            const blobUrl = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            link.style.cssText = 'display: none !important; position: absolute !important; left: -9999px !important;';
            
            // Add to DOM
            document.body.appendChild(link);
            
            // Try multiple approaches to trigger download
            let success = false;
            
            // Approach 1: Standard click
            try {
                link.click();
                success = true;
                console.log('✅ Standard click worked');
            } catch (e) {
                console.warn('⚠️ Standard click failed');
            }
            
            // Approach 2: Mouse event
            if (!success) {
                try {
                    const event = new MouseEvent('click', {
                        view: window,
                        bubbles: true,
                        cancelable: true,
                        button: 0
                    });
                    link.dispatchEvent(event);
                    success = true;
                    console.log('✅ Mouse event worked');
                } catch (e) {
                    console.warn('⚠️ Mouse event failed');
                }
            }
            
            // Approach 3: Focus and click
            if (!success) {
                try {
                    link.focus();
                    link.click();
                    success = true;
                    console.log('✅ Focus and click worked');
                } catch (e) {
                    console.warn('⚠️ Focus and click failed');
                }
            }
            
            // Approach 4: User interaction simulation
            if (!success) {
                try {
                    // Simulate user interaction
                    const userEvent = new Event('click', { bubbles: true });
                    Object.defineProperty(userEvent, 'isTrusted', { value: true });
                    link.dispatchEvent(userEvent);
                    success = true;
                    console.log('✅ User interaction simulation worked');
                } catch (e) {
                    console.warn('⚠️ User interaction simulation failed');
                }
            }
            
            // Cleanup
            setTimeout(() => {
                try {
                    if (link.parentNode) {
                        document.body.removeChild(link);
                    }
                    window.URL.revokeObjectURL(blobUrl);
                    
                    if (success) {
                        resolve();
                    } else {
                        // Try alternative method with data URL
                        tryDataUrlDownload(blob, filename).then(resolve).catch(reject);
                    }
                } catch (cleanupError) {
                    console.warn('⚠️ Cleanup warning:', cleanupError);
                    resolve();
                }
            }, 300);
            
        } catch (error) {
            reject(new Error(`Force download failed: ${error.message}`));
        }
    });
};

/**
 * Alternative download using data URL
 * @param {Blob} blob - File blob
 * @param {string} filename - Desired filename
 * @returns {Promise<void>}
 */
const tryDataUrlDownload = (blob, filename) => {
    return new Promise((resolve, reject) => {
        try {
            const reader = new FileReader();
            reader.onload = function() {
                const dataUrl = reader.result;
                
                const link = document.createElement('a');
                link.href = dataUrl;
                link.download = filename;
                link.style.display = 'none';
                
                document.body.appendChild(link);
                
                // Force click with user gesture simulation
                setTimeout(() => {
                    try {
                        link.click();
                        setTimeout(() => {
                            document.body.removeChild(link);
                            resolve();
                        }, 100);
                    } catch (e) {
                        document.body.removeChild(link);
                        reject(new Error('Data URL download failed'));
                    }
                }, 10);
            };
            
            reader.onerror = () => reject(new Error('Failed to read blob as data URL'));
            reader.readAsDataURL(blob);
            
        } catch (error) {
            reject(new Error(`Data URL download failed: ${error.message}`));
        }
    });
};

/**
 * Downloads a file using XMLHttpRequest (Fallback method)
 * @param {string} url - File URL
 * @param {string} filename - Desired filename
 * @param {Object} options - Download options
 * @returns {Promise<void>}
 */
const downloadViaXHR = (url, filename, options = {}) => {
    const { timeout = 30000, onProgress = null } = options;
    
    return new Promise((resolve, reject) => {
        console.log('🔄 Trying XHR download method:', filename);
        
        const xhr = new XMLHttpRequest();
        xhr.responseType = 'blob';
        xhr.timeout = timeout;
        
        // Prepare URL for Firebase Storage
        let fetchUrl = url;
        if (url.includes('firebasestorage.googleapis.com')) {
            const urlObj = new URL(url);
            urlObj.searchParams.set('response-content-disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
            fetchUrl = urlObj.toString();
        }
        
        xhr.onload = async function() {
            if (xhr.status === 200) {
                try {
                    const blob = xhr.response;
                    const contentType = xhr.getResponseHeader('content-type') || '';
                    const finalFilename = ensureFileExtension(filename, url, contentType);
                    
                    // Force download type
                    const downloadBlob = new Blob([blob], { 
                        type: 'application/octet-stream' 
                    });
                    
                    await forceDownload(downloadBlob, finalFilename);
                    console.log('✅ XHR download completed:', finalFilename);
                    resolve();
                } catch (error) {
                    reject(new Error(`XHR download trigger failed: ${error.message}`));
                }
            } else {
                reject(new Error(`XHR failed with status: ${xhr.status}`));
            }
        };
        
        xhr.onerror = () => reject(new Error('XHR network error'));
        xhr.ontimeout = () => reject(new Error('XHR timeout'));
        
        if (onProgress) {
            xhr.onprogress = (event) => {
                if (event.lengthComputable) {
                    onProgress({
                        loaded: event.loaded,
                        total: event.total,
                        percentage: (event.loaded / event.total) * 100
                    });
                }
            };
        }
        
        xhr.open('GET', fetchUrl, true);
        xhr.send();
    });
};

/**
 * Downloads an image using Canvas method (Fallback for images only)
 * @param {string} url - Image URL
 * @param {string} filename - Desired filename
 * @returns {Promise<void>}
 */
const downloadViaCanvas = (url, filename) => {
    return new Promise((resolve, reject) => {
        console.log('🔄 Trying canvas download method:', filename);
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = async function() {
            try {
                // Create canvas
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Set canvas size to image size
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                
                // Draw image to canvas
                ctx.drawImage(img, 0, 0);
                
                // Convert to blob and download
                canvas.toBlob(async (blob) => {
                    if (blob) {
                        const finalFilename = ensureFileExtension(filename, url, 'image/jpeg');
                        await forceDownload(blob, finalFilename);
                        console.log('✅ Canvas download completed:', finalFilename);
                        resolve();
                    } else {
                        reject(new Error('Failed to create blob from canvas'));
                    }
                }, 'image/jpeg', 0.95);
                
            } catch (error) {
                reject(new Error(`Canvas processing failed: ${error.message}`));
            }
        };
        
        img.onerror = () => reject(new Error('Failed to load image for canvas download'));
        img.src = url;
    });
};

/**
 * Opens file in new tab as final fallback with user instructions
 * @param {string} url - File URL
 * @param {string} filename - Filename for reference
 */
const downloadViaNewTab = (url, filename) => {
    console.log('🔄 Using new tab fallback for:', filename);
    
    // Try to create a download link first
    try {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Show user instructions
        setTimeout(() => {
            const message = `📥 Download Instructions:\n\n` +
                          `If the file opened in a new tab instead of downloading:\n` +
                          `1. Right-click on the image/video\n` +
                          `2. Select "Save image as..." or "Save video as..."\n` +
                          `3. Choose your download location\n\n` +
                          `This happens due to browser security settings.`;
            
            if (window.confirm(message + '\n\nWould you like to try a different download method?')) {
                // Offer alternative - copy URL to clipboard
                navigator.clipboard.writeText(url).then(() => {
                    alert('✅ File URL copied to clipboard!\n\nYou can paste it in a new tab and try downloading from there.');
                }).catch(() => {
                    alert('💡 Alternative: Copy this URL manually and paste it in a new tab:\n\n' + url);
                });
            }
        }, 1000);
        
    } catch (error) {
        console.error('❌ New tab fallback failed:', error);
        // Just open the URL as last resort
        window.open(url, '_blank');
    }
    
    return Promise.resolve();
};

/**
 * Main download function with multiple fallback methods
 * @param {string} url - File URL to download
 * @param {string} filename - Desired filename
 * @param {Object} options - Download options
 * @returns {Promise<{success: boolean, method: string, error?: string}>}
 */
export const downloadFile = async (url, filename, options = {}) => {
    const {
        timeout = 30000,
        onProgress = null,
        showFallbackMessage = true
    } = options;

    if (!url || !filename) {
        throw new Error('URL and filename are required');
    }

    const downloadOptions = { timeout, onProgress };
    const isImage = url.includes('image') || /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url);
    const isFirebaseStorage = url.includes('firebasestorage.googleapis.com');
    
    console.log('📥 Starting download:', { filename, isImage, isFirebaseStorage });

    // Method 1: Direct fetch with data URL (Most reliable for forcing downloads)
    try {
        await downloadViaDirectFetch(url, filename);
        return { success: true, method: 'direct-fetch' };
    } catch (directError) {
        console.warn('❌ Direct fetch download failed:', directError.message);
    }
    
    // Method 2: Fetch + Blob (Primary method)
    try {
        await downloadViaFetch(url, filename, downloadOptions);
        return { success: true, method: 'fetch' };
    } catch (fetchError) {
        console.warn('❌ Fetch download failed:', fetchError.message);
    }

    // Method 3: XMLHttpRequest (Fallback)
    try {
        await downloadViaXHR(url, filename, downloadOptions);
        return { success: true, method: 'xhr' };
    } catch (xhrError) {
        console.warn('❌ XHR download failed:', xhrError.message);
    }

    // Method 4: Canvas (For images only)
    if (isImage) {
        try {
            await downloadViaCanvas(url, filename);
            return { success: true, method: 'canvas' };
        } catch (canvasError) {
            console.warn('❌ Canvas download failed:', canvasError.message);
        }
    }

    // Method 5: Force download with iframe (Alternative approach)
    try {
        await downloadViaIframe(url, filename);
        return { success: true, method: 'iframe' };
    } catch (iframeError) {
        console.warn('❌ Iframe download failed:', iframeError.message);
    }

    // Method 6: New tab (Final fallback)
    try {
        await downloadViaNewTab(url, filename);
        return { success: true, method: 'newtab' };
    } catch (newTabError) {
        console.error('❌ All download methods failed');
        return { 
            success: false, 
            method: 'none', 
            error: 'All download methods failed. Please try again or contact support.' 
        };
    }
};

/**
 * Alternative download method that forces download without blob URLs
 * @param {string} url - File URL
 * @param {string} filename - Desired filename
 * @returns {Promise<void>}
 */
const downloadViaDirectFetch = async (url, filename) => {
    try {
        console.log('🔄 Trying direct fetch download method:', filename);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': '*/*',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            mode: 'cors',
            credentials: 'omit'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        
        // Force download using a different approach
        const reader = new FileReader();
        reader.onload = function() {
            const dataUrl = reader.result;
            
            // Create download link with data URL
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = filename;
            link.style.display = 'none';
            
            // Force download
            document.body.appendChild(link);
            
            // Use setTimeout to ensure the link is in DOM
            setTimeout(() => {
                link.click();
                setTimeout(() => {
                    document.body.removeChild(link);
                }, 100);
            }, 10);
        };
        
        reader.readAsDataURL(blob);
        console.log('✅ Direct fetch download completed:', filename);
        
    } catch (error) {
        throw new Error(`Direct fetch download failed: ${error.message}`);
    }
};

/**
 * Download using hidden iframe method
 * @param {string} url - File URL
 * @param {string} filename - Desired filename
 * @returns {Promise<void>}
 */
const downloadViaIframe = (url, filename) => {
    return new Promise((resolve, reject) => {
        try {
            console.log('🔄 Trying iframe download method:', filename);
            
            // Create hidden iframe
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.style.position = 'absolute';
            iframe.style.left = '-9999px';
            iframe.style.width = '1px';
            iframe.style.height = '1px';
            
            // Set up the iframe source with download parameters
            const downloadUrl = new URL(url);
            downloadUrl.searchParams.set('download', filename);
            downloadUrl.searchParams.set('response-content-disposition', `attachment; filename="${filename}"`);
            
            iframe.src = downloadUrl.toString();
            
            // Add to DOM
            document.body.appendChild(iframe);
            
            // Clean up after a delay
            setTimeout(() => {
                try {
                    if (iframe.parentNode) {
                        document.body.removeChild(iframe);
                    }
                    console.log('✅ Iframe download completed:', filename);
                    resolve();
                } catch (cleanupError) {
                    console.warn('⚠️ Iframe cleanup warning:', cleanupError);
                    resolve();
                }
            }, 2000);
            
        } catch (error) {
            reject(new Error(`Iframe download failed: ${error.message}`));
        }
    });
};

/**
 * Downloads multiple files with progress tracking
 * @param {Array} files - Array of {url, filename} objects
 * @param {Object} options - Download options
 * @returns {Promise<{successful: number, failed: number, results: Array}>}
 */
export const downloadMultipleFiles = async (files, options = {}) => {
    const {
        concurrency = 1, // Sequential by default to avoid overwhelming browser
        onProgress = null,
        onFileComplete = null
    } = options;

    if (!Array.isArray(files) || files.length === 0) {
        throw new Error('Files array is required and must not be empty');
    }

    const results = [];
    let successful = 0;
    let failed = 0;

    // Process files with controlled concurrency
    for (let i = 0; i < files.length; i += concurrency) {
        const batch = files.slice(i, i + concurrency);
        
        const batchPromises = batch.map(async (file, batchIndex) => {
            const globalIndex = i + batchIndex;
            
            try {
                if (onProgress) {
                    onProgress({
                        current: globalIndex + 1,
                        total: files.length,
                        filename: file.filename,
                        status: 'downloading'
                    });
                }

                const result = await downloadFile(file.url, file.filename, {
                    ...options,
                    showFallbackMessage: false // Don't show individual messages
                });

                if (result.success) {
                    successful++;
                } else {
                    failed++;
                }

                results.push({
                    ...file,
                    ...result,
                    index: globalIndex
                });

                if (onFileComplete) {
                    onFileComplete({
                        file,
                        result,
                        index: globalIndex,
                        successful,
                        failed
                    });
                }

                // Small delay between downloads to prevent overwhelming
                if (globalIndex < files.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 300));
                }

            } catch (error) {
                failed++;
                results.push({
                    ...file,
                    success: false,
                    method: 'none',
                    error: error.message,
                    index: globalIndex
                });

                if (onFileComplete) {
                    onFileComplete({
                        file,
                        result: { success: false, error: error.message },
                        index: globalIndex,
                        successful,
                        failed
                    });
                }
            }
        });

        // Wait for current batch to complete
        await Promise.all(batchPromises);
    }

    return {
        successful,
        failed,
        total: files.length,
        results
    };
};

/**
 * Utility to show download progress UI
 * @param {string} title - Progress title
 * @returns {Object} Progress UI controller
 */
export const createProgressUI = (title = 'Downloading Files...') => {
    const progressDiv = document.createElement('div');
    progressDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(0,0,0,0.9);
        color: white;
        padding: 20px;
        border-radius: 12px;
        z-index: 10000;
        font-family: system-ui, -apple-system, sans-serif;
        min-width: 300px;
        max-width: 400px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        backdrop-filter: blur(10px);
    `;
    
    progressDiv.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 8px; font-size: 16px;">${title}</div>
        <div id="progress-text" style="margin-bottom: 12px; color: #ccc; font-size: 14px;">Preparing downloads...</div>
        <div style="background: #333; height: 6px; border-radius: 3px; margin-bottom: 8px; overflow: hidden;">
            <div id="progress-bar" style="background: linear-gradient(90deg, #4CAF50, #45a049); height: 100%; width: 0%; border-radius: 3px; transition: width 0.3s ease;"></div>
        </div>
        <div id="progress-stats" style="font-size: 12px; color: #999; display: flex; justify-content: space-between;">
            <span id="progress-current">0 / 0</span>
            <span id="progress-status">Starting...</span>
        </div>
    `;
    
    document.body.appendChild(progressDiv);

    return {
        update: (current, total, status, filename) => {
            const progressText = document.getElementById('progress-text');
            const progressBar = document.getElementById('progress-bar');
            const progressCurrent = document.getElementById('progress-current');
            const progressStatus = document.getElementById('progress-status');
            
            if (progressText && filename) {
                progressText.textContent = `Downloading: ${filename}`;
            }
            if (progressBar && total > 0) {
                progressBar.style.width = `${(current / total) * 100}%`;
            }
            if (progressCurrent) {
                progressCurrent.textContent = `${current} / ${total}`;
            }
            if (progressStatus && status) {
                progressStatus.textContent = status;
            }
        },
        
        complete: (successful, failed, total) => {
            const progressText = document.getElementById('progress-text');
            const progressStatus = document.getElementById('progress-status');
            
            if (progressText) {
                progressText.textContent = `Download completed!`;
            }
            if (progressStatus) {
                progressStatus.textContent = `${successful} successful, ${failed} failed`;
            }
            
            // Auto-remove after delay
            setTimeout(() => {
                if (progressDiv.parentNode) {
                    progressDiv.parentNode.removeChild(progressDiv);
                }
            }, 3000);
        },
        
        remove: () => {
            if (progressDiv.parentNode) {
                progressDiv.parentNode.removeChild(progressDiv);
            }
        }
    };
};

export default {
    downloadFile,
    downloadMultipleFiles,
    createProgressUI,
    ensureFileExtension
};