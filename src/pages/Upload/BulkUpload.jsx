// Bulk Upload Component for Brass Space Interior Solution
// Supports simultaneous image and video uploads with proper validation
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/FirebaseAuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import { storage, db } from '../../firebase/config';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useCategories } from '../../utils/categoryManager';
import {
    Upload,
    Image,
    Video,
    X,
    CheckCircle,
    AlertCircle,
    Folder,
    Tag,
    FileImage,
    FileVideo
} from 'lucide-react';
import UploadSuccessModal from '../../components/UploadSuccessModal';
import './BulkUpload.css';

// File size limits (as per requirements)
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200MB

// Allowed file formats
const ALLOWED_IMAGE_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_FORMATS = ['video/mp4', 'video/webm'];

const BulkUpload = () => {
    const { hasPermission, isAdmin, isStaff, user, userRole } = useAuth();
    const { categories, getCategoryById } = useCategories();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    // Form state
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedSubCategory, setSelectedSubCategory] = useState('');
    const [files, setFiles] = useState([]);
    const [tags, setTags] = useState([]);
    const [tagInput, setTagInput] = useState('');
    
    // Upload state
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({});
    const [uploadStatus, setUploadStatus] = useState({
        message: '',
        isUploading: false,
        completedCount: 0,
        totalCount: 0,
        currentFile: ''
    });

    // Modal state
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [uploadResults, setUploadResults] = useState(null);

    // Redirect if not authorized
    if (!hasPermission('canUpload')) {
        return <Navigate to="/" replace />;
    }

    const currentCategory = getCategoryById(selectedCategory);
    const subCategories = currentCategory?.subCategories || [];

    // Validate file
    const validateFile = (file) => {
        const isImage = ALLOWED_IMAGE_FORMATS.includes(file.type);
        const isVideo = ALLOWED_VIDEO_FORMATS.includes(file.type);
        
        if (!isImage && !isVideo) {
            return {
                valid: false,
                error: `Invalid file type: ${file.type}. Allowed: JPG, PNG, WEBP, MP4, WEBM`
            };
        }

        const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
        const maxSizeMB = maxSize / 1024 / 1024;
        
        if (file.size > maxSize) {
            return {
                valid: false,
                error: `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB (max: ${maxSizeMB}MB)`
            };
        }

        if (file.size === 0) {
            return {
                valid: false,
                error: 'File is empty'
            };
        }

        return { valid: true, mediaType: isImage ? 'image' : 'video' };
    };

    // Handle file selection (supports mixed image/video)
    const handleFileSelect = (e) => {
        const selectedFiles = Array.from(e.target.files);
        console.log(`📁 Selected ${selectedFiles.length} files`);
        
        const validFiles = [];
        const invalidFiles = [];

        selectedFiles.forEach(file => {
            const validation = validateFile(file);
            
            if (validation.valid) {
                validFiles.push({
                    file,
                    preview: URL.createObjectURL(file),
                    status: 'pending',
                    mediaType: validation.mediaType,
                    id: `${Date.now()}-${Math.random()}`
                });
            } else {
                invalidFiles.push({ file, error: validation.error });
                console.warn(`❌ Invalid file: ${file.name} - ${validation.error}`);
            }
        });

        // Show warnings for invalid files
        if (invalidFiles.length > 0) {
            const errorList = invalidFiles.map(item => `• ${item.file.name}: ${item.error}`).join('\n');
            alert(`⚠️ Some files were not added:\n\n${errorList}\n\n💡 Allowed formats:\n• Images: JPG, PNG, WEBP (max 10MB)\n• Videos: MP4, WEBM (max 200MB)`);
        }

        if (validFiles.length > 0) {
            console.log(`✅ Adding ${validFiles.length} valid files`);
            setFiles(prev => [...prev, ...validFiles]);
        }
    };

    // Remove file from list
    const removeFile = (id) => {
        setFiles(prev => {
            const fileToRemove = prev.find(f => f.id === id);
            if (fileToRemove) {
                URL.revokeObjectURL(fileToRemove.preview);
            }
            return prev.filter(f => f.id !== id);
        });
    };

    // Tag management
    const addTag = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim().toLowerCase())) {
            setTags(prev => [...prev, tagInput.trim().toLowerCase()]);
            setTagInput('');
        }
    };

    const removeTag = (tag) => {
        setTags(prev => prev.filter(t => t !== tag));
    };

    // Upload handler
    const handleUpload = async () => {
        if (!selectedCategory || !selectedSubCategory || files.length === 0) {
            alert('Please select category, sub-category, and add files');
            return;
        }

        console.log(`🚀 Starting bulk upload: ${files.length} files`);
        setUploading(true);
        setUploadStatus({
            message: 'Starting upload...',
            isUploading: true,
            completedCount: 0,
            totalCount: files.length,
            currentFile: ''
        });

        let successCount = 0;
        let failureCount = 0;
        const categoryName = currentCategory?.name || selectedCategory;
        const subCategoryName = subCategories.find(sub => sub.id === selectedSubCategory)?.name || selectedSubCategory;

        // Upload files in parallel (with concurrency limit)
        const CONCURRENT_UPLOADS = 1000;
        const uploadQueue = [...files];
        const activeUploads = [];

        const uploadFile = async (fileObj, index) => {
            try {
                setUploadStatus(prev => ({
                    ...prev,
                    currentFile: fileObj.file.name,
                    message: `Uploading ${prev.completedCount + 1} of ${files.length}`
                }));

                // Create storage path
                const timestamp = Date.now();
                const storagePath = `interior-library/${categoryName}/${subCategoryName}/${fileObj.mediaType}/${timestamp}_${fileObj.file.name}`;
                const storageRef = ref(storage, storagePath);

                // Upload with progress tracking
                const uploadTask = uploadBytesResumable(storageRef, fileObj.file);

                await new Promise((resolve, reject) => {
                    uploadTask.on(
                        'state_changed',
                        (snapshot) => {
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            setUploadProgress(prev => ({ ...prev, [fileObj.id]: progress }));
                        },
                        (error) => {
                            console.error(`❌ Upload failed: ${fileObj.file.name}`, error);
                            reject(error);
                        },
                        async () => {
                            try {
                                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

                                // Save to Firestore with complete schema
                                await addDoc(collection(db, 'media'), {
                                    name: fileObj.file.name,
                                    url: downloadURL,
                                    thumbnailUrl: downloadURL, // For videos, you might generate a thumbnail
                                    type: fileObj.mediaType,
                                    categoryId: selectedCategory,
                                    subCategoryId: selectedSubCategory,
                                    tags: tags,
                                    size: fileObj.file.size,
                                    contentType: fileObj.file.type,
                                    uploadedBy: user.uid,
                                    uploaderRole: userRole,
                                    uploaderEmail: user.email,
                                    createdAt: serverTimestamp(),
                                    status: 'active'
                                });

                                // Update file status
                                setFiles(prev => prev.map(f => 
                                    f.id === fileObj.id ? { ...f, status: 'complete' } : f
                                ));

                                successCount++;
                                resolve();
                            } catch (firestoreError) {
                                console.error(`❌ Firestore error: ${fileObj.file.name}`, firestoreError);
                                reject(firestoreError);
                            }
                        }
                    );
                });

            } catch (error) {
                console.error(`❌ Failed to upload: ${fileObj.file.name}`, error);
                setFiles(prev => prev.map(f => 
                    f.id === fileObj.id ? { ...f, status: 'error' } : f
                ));
                failureCount++;
            } finally {
                setUploadStatus(prev => ({
                    ...prev,
                    completedCount: prev.completedCount + 1
                }));
            }
        };

        // Process uploads with concurrency control
        while (uploadQueue.length > 0 || activeUploads.length > 0) {
            while (activeUploads.length < CONCURRENT_UPLOADS && uploadQueue.length > 0) {
                const fileObj = uploadQueue.shift();
                const uploadPromise = uploadFile(fileObj, files.indexOf(fileObj));
                activeUploads.push(uploadPromise);
            }

            if (activeUploads.length > 0) {
                await Promise.race(activeUploads);
                activeUploads.splice(0, 1);
            }
        }

        // Update category counts
        if (successCount > 0) {
            try {
                const categoryRef = doc(db, 'categories', selectedCategory);
                const categoryDoc = await getDoc(categoryRef);

                if (categoryDoc.exists()) {
                    const catData = categoryDoc.data();
                    const imageCount = files.filter(f => f.mediaType === 'image' && f.status === 'complete').length;
                    const videoCount = files.filter(f => f.mediaType === 'video' && f.status === 'complete').length;

                    const updatedSubCats = catData.subCategories.map(sub => {
                        if (sub.id === selectedSubCategory) {
                            return {
                                ...sub,
                                imageCount: (sub.imageCount || 0) + imageCount,
                                videoCount: (sub.videoCount || 0) + videoCount
                            };
                        }
                        return sub;
                    });

                    await updateDoc(categoryRef, { subCategories: updatedSubCats });
                    console.log(`✅ Updated category counts: +${imageCount} images, +${videoCount} videos`);
                }
            } catch (error) {
                console.error('❌ Failed to update category counts:', error);
            }
        }

        // Show results
        setUploading(false);
        setUploadStatus({
            message: `Upload complete! ${successCount} succeeded, ${failureCount} failed`,
            isUploading: false,
            completedCount: files.length,
            totalCount: files.length,
            currentFile: ''
        });

        // Show success modal
        setUploadResults({
            successCount,
            totalCount: files.length,
            categoryName,
            subCategoryName,
            redirectUrl: `/category/${selectedCategory}/${selectedSubCategory}/image`
        });
        setShowSuccessModal(true);
    };

    // Modal handlers
    const handleUploadMore = () => {
        files.forEach(f => URL.revokeObjectURL(f.preview));
        setFiles([]);
        setTags([]);
        setTagInput('');
        setUploadProgress({});
        setShowSuccessModal(false);
        setUploadResults(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleViewGallery = () => {
        if (uploadResults?.redirectUrl) {
            navigate(uploadResults.redirectUrl);
        }
    };

    const handleGoToDashboard = () => {
        navigate('/');
    };

    // Get file statistics
    const fileStats = {
        total: files.length,
        images: files.filter(f => f.mediaType === 'image').length,
        videos: files.filter(f => f.mediaType === 'video').length,
        completed: files.filter(f => f.status === 'complete').length,
        failed: files.filter(f => f.status === 'error').length
    };

    return (
        <div className="bulk-upload-page">
            <UploadSuccessModal
                isOpen={showSuccessModal}
                uploadResults={uploadResults}
                onUploadMore={handleUploadMore}
                onViewGallery={handleViewGallery}
                onGoToDashboard={handleGoToDashboard}
                onClose={() => setShowSuccessModal(false)}
            />

            <div className="page-header">
                <h1>Bulk Upload Media</h1>
                <p>Upload multiple images and videos simultaneously</p>
            </div>

            <div className="upload-container">
                {/* Left: Form */}
                <div className="upload-form">
                    {/* Category Selection */}
                    <div className="form-section">
                        <label className="form-label">
                            <Folder size={16} />
                            Category
                        </label>
                        <select
                            className="form-select"
                            value={selectedCategory}
                            onChange={(e) => {
                                setSelectedCategory(e.target.value);
                                setSelectedSubCategory('');
                            }}
                        >
                            <option value="">Select a category</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.emoji} {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Sub-Category Selection */}
                    <div className="form-section">
                        <label className="form-label">
                            <Folder size={16} />
                            Sub-Category
                        </label>
                        <select
                            className="form-select"
                            value={selectedSubCategory}
                            onChange={(e) => setSelectedSubCategory(e.target.value)}
                            disabled={!selectedCategory}
                        >
                            <option value="">Select a sub-category</option>
                            {subCategories.map(sub => (
                                <option key={sub.id} value={sub.id}>
                                    {sub.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Tags */}
                    <div className="form-section">
                        <label className="form-label">
                            <Tag size={16} />
                            Tags (Optional)
                        </label>
                        <div className="tag-input-container">
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Add a tag..."
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                            />
                            <button className="btn btn-secondary" onClick={addTag}>Add</button>
                        </div>
                        {tags.length > 0 && (
                            <div className="tags-list">
                                {tags.map(tag => (
                                    <span key={tag} className="tag-chip">
                                        #{tag}
                                        <button onClick={() => removeTag(tag)}>
                                            <X size={12} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* File Statistics */}
                    {files.length > 0 && (
                        <div className="file-stats">
                            <div className="stat-item">
                                <FileImage size={16} />
                                <span>{fileStats.images} Images</span>
                            </div>
                            <div className="stat-item">
                                <FileVideo size={16} />
                                <span>{fileStats.videos} Videos</span>
                            </div>
                            <div className="stat-item">
                                <CheckCircle size={16} />
                                <span>{fileStats.completed} Complete</span>
                            </div>
                            {fileStats.failed > 0 && (
                                <div className="stat-item error">
                                    <AlertCircle size={16} />
                                    <span>{fileStats.failed} Failed</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Upload Button */}
                    <button
                        className="btn btn-primary upload-submit"
                        onClick={handleUpload}
                        disabled={uploading || files.length === 0 || !selectedCategory || !selectedSubCategory}
                    >
                        <Upload size={18} />
                        {uploading ? 'Uploading...' : `Upload ${files.length} file${files.length !== 1 ? 's' : ''}`}
                    </button>

                    {/* Upload Status */}
                    {uploadStatus.message && (
                        <div className={`upload-status ${uploadStatus.isUploading ? 'uploading' : 'complete'}`}>
                            <div className="status-message">{uploadStatus.message}</div>
                            {uploadStatus.currentFile && (
                                <div className="status-file">📁 {uploadStatus.currentFile}</div>
                            )}
                            {uploadStatus.isUploading && (
                                <div className="status-progress">
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill"
                                            style={{ width: `${(uploadStatus.completedCount / uploadStatus.totalCount) * 100}%` }}
                                        />
                                    </div>
                                    <span>{uploadStatus.completedCount} / {uploadStatus.totalCount}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right: Drop Zone */}
                <div className="upload-dropzone-container">
                    <div
                        className="upload-dropzone"
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            e.preventDefault();
                            handleFileSelect({ target: { files: e.dataTransfer.files } });
                        }}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/jpeg,image/jpg,image/png,image/webp,video/mp4,video/webm"
                            onChange={handleFileSelect}
                            hidden
                        />
                        <div className="dropzone-content">
                            <Upload size={48} />
                            <h3>Drop files here</h3>
                            <p>or click to browse</p>
                            <span className="file-types">
                                Images: JPG, PNG, WEBP (max 10MB)<br />
                                Videos: MP4, WEBM (max 200MB)
                            </span>
                        </div>
                    </div>

                    {/* File Preview List */}
                    {files.length > 0 && (
                        <div className="file-list">
                            <h4>Selected Files ({files.length})</h4>
                            <div className="files-grid">
                                {files.map((item) => (
                                    <div key={item.id} className={`file-item ${item.status}`}>
                                        <div className="file-preview">
                                            {item.mediaType === 'image' ? (
                                                <img src={item.preview} alt="" />
                                            ) : (
                                                <video src={item.preview} />
                                            )}
                                            <button
                                                className="remove-file"
                                                onClick={() => removeFile(item.id)}
                                                disabled={uploading}
                                            >
                                                <X size={14} />
                                            </button>
                                            {uploadProgress[item.id] !== undefined && uploadProgress[item.id] < 100 && (
                                                <div className="upload-progress">
                                                    <div
                                                        className="progress-bar"
                                                        style={{ width: `${uploadProgress[item.id]}%` }}
                                                    />
                                                </div>
                                            )}
                                            {item.status === 'complete' && (
                                                <div className="upload-complete">
                                                    <CheckCircle size={24} />
                                                </div>
                                            )}
                                            {item.status === 'error' && (
                                                <div className="upload-error">
                                                    <AlertCircle size={24} />
                                                </div>
                                            )}
                                            <div className="file-type-badge">
                                                {item.mediaType === 'image' ? <FileImage size={14} /> : <FileVideo size={14} />}
                                            </div>
                                        </div>
                                        <span className="file-name">{item.file.name}</span>
                                        <span className="file-size">{(item.file.size / 1024 / 1024).toFixed(2)} MB</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BulkUpload;
