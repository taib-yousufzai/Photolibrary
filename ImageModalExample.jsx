/**
 * 🎯 COMPLETE IMAGE MODAL EXAMPLE
 * 
 * Ready-to-use React component with working Download & Favorites
 */

import React, { useState, useEffect } from 'react';
import { downloadImage, useFavorites } from './ImageModalFunctions';

const ImageModal = ({ 
    image,           // { id, src, title }
    isOpen, 
    onClose, 
    user = null      // { id } or null for guest users
}) => {
    // Favorites hook
    const { toggleFavorite, isFavorited, favoritesCount } = useFavorites(user?.id || 'guest');
    
    // Toast state
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    
    // Show toast notification
    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast({ show: false, message: '', type: 'success' });
        }, 3000);
    };
    
    // ===================================
    // 📥 DOWNLOAD HANDLER
    // ===================================
    const handleDownload = async () => {
        if (!image) return;
        
        try {
            await downloadImage(image, showToast);
        } catch (error) {
            console.error('Download failed:', error);
            showToast('❌ Download failed. Please try again.', 'error');
        }
    };
    
    // ===================================
    // ❤️ SAVE/FAVORITES HANDLER
    // ===================================
    const handleSave = () => {
        if (!image) return;
        
        try {
            const result = toggleFavorite(image, showToast);
            console.log('Favorite toggled:', result);
        } catch (error) {
            console.error('Save failed:', error);
            showToast('❌ Failed to update favorites', 'error');
        }
    };
    
    // ===================================
    // 🔄 SHARE HANDLER (BONUS)
    // ===================================
    const handleShare = async () => {
        if (!image) return;
        
        try {
            if (navigator.share) {
                await navigator.share({
                    title: image.title,
                    text: `Check out this image: ${image.title}`,
                    url: image.src
                });
                showToast('✅ Shared successfully!', 'success');
            } else {
                // Fallback: Copy to clipboard
                await navigator.clipboard.writeText(image.src);
                showToast('✅ Link copied to clipboard!', 'success');
            }
        } catch (error) {
            console.error('Share failed:', error);
            showToast('❌ Share failed', 'error');
        }
    };
    
    // Close modal on Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden'; // Prevent background scroll
        }
        
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);
    
    if (!isOpen || !image) return null;
    
    const isImageFavorited = isFavorited(image.id);
    
    return (
        <>
            {/* Modal Overlay */}
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    
                    {/* Close Button */}
                    <button className="modal-close" onClick={onClose}>
                        ✕
                    </button>
                    
                    {/* Image */}
                    <div className="modal-image-container">
                        <img 
                            src={image.src} 
                            alt={image.title}
                            className="modal-image"
                        />
                    </div>
                    
                    {/* Image Info */}
                    <div className="modal-info">
                        <h3>{image.title}</h3>
                        <p>ID: {image.id}</p>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="modal-buttons">
                        
                        {/* SAVE BUTTON */}
                        <button 
                            className={`btn btn-save ${isImageFavorited ? 'favorited' : ''}`}
                            onClick={handleSave}
                            title={isImageFavorited ? 'Remove from favorites' : 'Add to favorites'}
                        >
                            <span className="btn-icon">
                                {isImageFavorited ? '❤️' : '🤍'}
                            </span>
                            <span className="btn-text">
                                {isImageFavorited ? 'Saved' : 'Save'}
                            </span>
                        </button>
                        
                        {/* DOWNLOAD BUTTON */}
                        <button 
                            className="btn btn-download"
                            onClick={handleDownload}
                            title="Download image to device"
                        >
                            <span className="btn-icon">📥</span>
                            <span className="btn-text">Download</span>
                        </button>
                        
                        {/* SHARE BUTTON */}
                        <button 
                            className="btn btn-share"
                            onClick={handleShare}
                            title="Share image"
                        >
                            <span className="btn-icon">🔗</span>
                            <span className="btn-text">Share</span>
                        </button>
                        
                    </div>
                    
                    {/* Favorites Counter */}
                    <div className="modal-stats">
                        <small>Total favorites: {favoritesCount}</small>
                    </div>
                    
                </div>
            </div>
            
            {/* Toast Notification */}
            {toast.show && (
                <div className={`toast toast-${toast.type}`}>
                    {toast.message}
                </div>
            )}
        </>
    );
};

export default ImageModal;

// ===================================
// 🎨 EXAMPLE CSS STYLES
// ===================================

const styles = `
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-content {
    background: white;
    border-radius: 12px;
    max-width: 90vw;
    max-height: 90vh;
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
}

.modal-close {
    position: absolute;
    top: 16px;
    right: 16px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    cursor: pointer;
    z-index: 10;
}

.modal-image-container {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
}

.modal-image {
    max-width: 100%;
    max-height: 70vh;
    object-fit: contain;
}

.modal-info {
    padding: 20px;
    border-top: 1px solid #eee;
}

.modal-buttons {
    display: flex;
    gap: 12px;
    padding: 20px;
    justify-content: center;
    border-top: 1px solid #eee;
}

.btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 16px;
    font-weight: 500;
    transition: all 0.2s;
}

.btn-save {
    background: #f3f4f6;
    color: #374151;
}

.btn-save.favorited {
    background: #fef2f2;
    color: #dc2626;
}

.btn-download {
    background: #3b82f6;
    color: white;
}

.btn-share {
    background: #10b981;
    color: white;
}

.btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.toast {
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 16px 24px;
    border-radius: 8px;
    color: white;
    font-weight: 500;
    z-index: 2000;
    animation: slideIn 0.3s ease;
}

.toast-success {
    background: #10b981;
}

.toast-error {
    background: #ef4444;
}

.toast-info {
    background: #3b82f6;
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

.modal-stats {
    padding: 0 20px 20px;
    text-align: center;
    color: #6b7280;
}
`;

// ===================================
// 📋 USAGE EXAMPLE
// ===================================

/*
// In your parent component:

import React, { useState } from 'react';
import ImageModal from './ImageModal';

const App = () => {
    const [selectedImage, setSelectedImage] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const user = { id: 'user123' }; // Your user object
    
    const images = [
        { id: '1', src: 'https://example.com/image1.jpg', title: 'Beautiful Interior' },
        { id: '2', src: 'https://example.com/image2.jpg', title: 'Modern Kitchen' },
    ];
    
    const openModal = (image) => {
        setSelectedImage(image);
        setIsModalOpen(true);
    };
    
    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedImage(null);
    };
    
    return (
        <div>
            {images.map(image => (
                <img 
                    key={image.id}
                    src={image.src} 
                    alt={image.title}
                    onClick={() => openModal(image)}
                    style={{ width: 200, height: 150, cursor: 'pointer' }}
                />
            ))}
            
            <ImageModal 
                image={selectedImage}
                isOpen={isModalOpen}
                onClose={closeModal}
                user={user}
            />
        </div>
    );
};
*/