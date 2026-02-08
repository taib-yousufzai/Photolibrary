// SubCategories Page - Shows sub-categories for a main category
import { useParams, Link } from 'react-router-dom';
import { Image, Video, ArrowRight, ArrowLeft, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCategories } from '../utils/categoryManager';
import { scanStorageForMediaOptimized } from '../utils/storageScanner';
import ImageWithFallback from '../components/ImageWithFallback';
import './SubCategories.css';

const SubCategories = () => {
    const { categoryId } = useParams();
    const { categories, getCategoryById, realCountsLoaded, refreshRealCounts } = useCategories(); // Get real counts status
    const [category, setCategory] = useState(null);
    const [previewImages, setPreviewImages] = useState(new Map()); // subcategoryId -> preview image
    const [loadingPreviews, setLoadingPreviews] = useState(new Set()); // subcategories being loaded
    const [categoryHeaderImage, setCategoryHeaderImage] = useState(null); // category overview image
    const [loadingCategoryImage, setLoadingCategoryImage] = useState(false);
    const [refreshingCounts, setRefreshingCounts] = useState(false);

    useEffect(() => {
        if (!categoryId) return;

        // Get category from the categories array (which updates when categoryManager changes)
        const foundCategory = getCategoryById(categoryId);
        setCategory(foundCategory);
        
        // Debug: Log category data to help identify count issues
        if (foundCategory) {
            const totalImages = foundCategory.subCategories.reduce((acc, sub) => acc + (sub.imageCount || 0), 0);
            const totalVideos = foundCategory.subCategories.reduce((acc, sub) => acc + (sub.videoCount || 0), 0);
            console.log(`📊 [SubCategories] Category "${foundCategory.name}" counts:`, {
                categoryId: foundCategory.id,
                subCategories: foundCategory.subCategories.length,
                totalImages,
                totalVideos,
                realCountsLoaded,
                subCategoryCounts: foundCategory.subCategories.map(sub => ({
                    id: sub.id,
                    name: sub.name,
                    images: sub.imageCount || 0,
                    videos: sub.videoCount || 0,
                    hasImageCount: 'imageCount' in sub,
                    hasVideoCount: 'videoCount' in sub,
                    imageCountType: typeof sub.imageCount,
                    videoCountType: typeof sub.videoCount,
                    lastUpdated: sub.lastUpdated
                }))
            });
        } else {
            console.error(`❌ [SubCategories] Category not found:`, { categoryId });
        }
    }, [categoryId, categories, realCountsLoaded]); // Added realCountsLoaded dependency

    // Function to refresh real counts
    const handleRefreshCounts = async () => {
        setRefreshingCounts(true);
        try {
            await refreshRealCounts();
            console.log('✅ Real counts refreshed successfully');
        } catch (error) {
            console.error('❌ Error refreshing real counts:', error);
        } finally {
            setRefreshingCounts(false);
        }
    };

    // Load preview images for subcategories
    const loadPreviewImage = async (subCategoryId) => {
        if (!category || loadingPreviews.has(subCategoryId) || previewImages.has(subCategoryId)) {
            return; // Already loading or loaded
        }

        try {
            setLoadingPreviews(prev => new Set([...prev, subCategoryId]));
            
            // Try to get images first, then videos if no images
            let mediaItems = await scanStorageForMediaOptimized(categoryId, subCategoryId, 'image');
            
            if (!mediaItems || mediaItems.length === 0) {
                // Try videos if no images
                mediaItems = await scanStorageForMediaOptimized(categoryId, subCategoryId, 'video');
            }

            if (mediaItems && mediaItems.length > 0) {
                // Get the first media item as preview
                const previewItem = mediaItems[0];
                setPreviewImages(prev => new Map([...prev, [subCategoryId, previewItem]]));
                console.log(`🖼️ Loaded preview for ${subCategoryId}:`, previewItem.name);
            } else {
                console.log(`📭 No media found for ${subCategoryId}`);
            }
        } catch (error) {
            console.error(`❌ Error loading preview for ${subCategoryId}:`, error);
        } finally {
            setLoadingPreviews(prev => {
                const newSet = new Set(prev);
                newSet.delete(subCategoryId);
                return newSet;
            });
        }
    };

    // Load preview images when category is available
    useEffect(() => {
        if (!category) return;

        console.log('🔄 Loading previews for category:', category.name);
        console.log('📊 Subcategories:', category.subCategories.map(sub => ({
            id: sub.id,
            name: sub.name,
            imageCount: sub.imageCount || 0,
            videoCount: sub.videoCount || 0,
            totalItems: (sub.imageCount || 0) + (sub.videoCount || 0)
        })));

        // Load category header image (from first available subcategory)
        loadCategoryHeaderImage();

        // Load preview images for all subcategories
        category.subCategories.forEach(subCat => {
            const totalItems = (subCat.imageCount || 0) + (subCat.videoCount || 0);
            console.log(`🔍 Checking ${subCat.name}: ${totalItems} items`);
            
            // Load preview for all subcategories (not just those with counts, in case counts are wrong)
            loadPreviewImage(subCat.id);
        });
    }, [category]);

    // Load category header image
    const loadCategoryHeaderImage = async () => {
        if (!category || loadingCategoryImage || categoryHeaderImage) {
            return; // Already loading or loaded
        }

        try {
            setLoadingCategoryImage(true);
            
            // Try to find an image from any subcategory for the header
            for (const subCat of category.subCategories) {
                if ((subCat.imageCount || 0) > 0) {
                    try {
                        const mediaItems = await scanStorageForMediaOptimized(categoryId, subCat.id, 'image');
                        if (mediaItems && mediaItems.length > 0) {
                            setCategoryHeaderImage(mediaItems[0]);
                            console.log(`🖼️ Loaded category header image from ${subCat.name}:`, mediaItems[0].name);
                            break; // Found an image, stop looking
                        }
                    } catch (error) {
                        console.warn(`⚠️ Failed to load header image from ${subCat.name}:`, error);
                        continue; // Try next subcategory
                    }
                }
            }
            
            // If no images found, try videos
            if (!categoryHeaderImage) {
                for (const subCat of category.subCategories) {
                    if ((subCat.videoCount || 0) > 0) {
                        try {
                            const mediaItems = await scanStorageForMediaOptimized(categoryId, subCat.id, 'video');
                            if (mediaItems && mediaItems.length > 0) {
                                setCategoryHeaderImage(mediaItems[0]);
                                console.log(`🎥 Loaded category header video from ${subCat.name}:`, mediaItems[0].name);
                                break;
                            }
                        } catch (error) {
                            console.warn(`⚠️ Failed to load header video from ${subCat.name}:`, error);
                            continue;
                        }
                    }
                }
            }
        } catch (error) {
            console.error('❌ Error loading category header image:', error);
        } finally {
            setLoadingCategoryImage(false);
        }
    };

    if (!category) {
        return (
            <div className="not-found">
                <h2>Category not found</h2>
                <Link to="/categories" className="btn btn-primary">
                    Back to Categories
                </Link>
            </div>
        );
    }

    return (
        <div className="subcategories-page">
            {/* Back Link */}
            <div className="subcategories-header">
                <Link to="/categories" className="back-link">
                    <ArrowLeft size={18} />
                    <span>All Categories</span>
                </Link>
                
                {/* Real Counts Status and Refresh Button */}
                <div className="counts-status">
                    {!realCountsLoaded ? (
                        <div className="loading-counts">
                            <div className="loading-spinner"></div>
                            <span>Loading real counts...</span>
                        </div>
                    ) : (
                        <button 
                            className={`refresh-counts-btn ${refreshingCounts ? 'loading' : ''}`}
                            onClick={handleRefreshCounts}
                            disabled={refreshingCounts}
                            title="Refresh media counts from storage"
                        >
                            <RefreshCw size={16} className={refreshingCounts ? 'spinning' : ''} />
                            <span>{refreshingCounts ? 'Refreshing...' : 'Refresh Counts'}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Category Header */}
            <div className="category-header" style={{ '--cat-color': category.color }}>
                {categoryHeaderImage ? (
                    <div className="category-header-image">
                        <ImageWithFallback
                            src={categoryHeaderImage.url}
                            alt={`${category.name} overview`}
                            className="header-bg-image"
                        />
                        <div className="header-image-overlay"></div>
                    </div>
                ) : (
                    <div className="category-header-bg"></div>
                )}
                <div className="category-header-content">
                    <div className="category-icon-container">
                        <span className="category-emoji-large">{category.emoji}</span>
                    </div>
                    <div className="category-header-info">
                        <h1>{category.name}</h1>
                        <p>{category.description}</p>
                        <div className="category-stats">
                            <span>{category.subCategories.length} Sub-categories</span>
                            <span className="separator">•</span>
                            <span>{category.subCategories.reduce((acc, sub) => acc + (sub.imageCount || 0), 0)} Images</span>
                            <span className="separator">•</span>
                            <span>{category.subCategories.reduce((acc, sub) => acc + (sub.videoCount || 0), 0)} Videos</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sub-categories Grid */}
            <div className="subcategories-grid">
                {category.subCategories.map((subCat, index) => (
                    <div
                        key={subCat.id}
                        className="subcategory-card"
                        style={{ animationDelay: `${index * 0.05}s` }}
                    >
                        <div className="subcat-header">
                            <h3>{subCat.name}</h3>
                            <span className={`subcat-badge ${realCountsLoaded ? 'real-counts' : 'loading-counts'}`}>
                                {(subCat.imageCount || 0) + (subCat.videoCount || 0)} items
                            </span>
                        </div>

                        <div className="subcat-preview">
                            {previewImages.has(subCat.id) ? (
                                <div className="preview-image-container">
                                    <ImageWithFallback
                                        src={previewImages.get(subCat.id).url}
                                        alt={`${subCat.name} preview`}
                                        className="preview-image"
                                        lazy={false}
                                    />
                                    <div className="preview-overlay">
                                        <span className="preview-count">
                                            {(subCat.imageCount || 0) + (subCat.videoCount || 0)} items
                                        </span>
                                    </div>
                                </div>
                            ) : loadingPreviews.has(subCat.id) ? (
                                <div className="preview-loading">
                                    <div className="loading-spinner"></div>
                                    <span className="loading-text">Loading preview...</span>
                                </div>
                            ) : (subCat.imageCount || 0) + (subCat.videoCount || 0) > 0 ? (
                                <div className="preview-placeholder">
                                    <span className="preview-emoji">{category.emoji}</span>
                                    <span className="preview-text">Loading...</span>
                                </div>
                            ) : (
                                <div className="preview-placeholder">
                                    <span className="preview-emoji">{category.emoji}</span>
                                    <span className="preview-text">No media yet</span>
                                </div>
                            )}
                        </div>

                        <div className="subcat-actions">
                            <Link
                                to={`/category/${categoryId}/${subCat.id}/image`}
                                className="subcat-link"
                            >
                                <Image size={16} />
                                <span>Images</span>
                                <span className="link-count">{subCat.imageCount || 0}</span>
                                <ArrowRight size={14} className="link-arrow" />
                            </Link>

                            <Link
                                to={`/category/${categoryId}/${subCat.id}/video`}
                                className="subcat-link"
                            >
                                <Video size={16} />
                                <span>Videos</span>
                                <span className="link-count">{subCat.videoCount || 0}</span>
                                <ArrowRight size={14} className="link-arrow" />
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SubCategories;
