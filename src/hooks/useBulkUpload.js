// Custom Hook for Bulk Upload Logic
import { useState, useCallback } from 'react';
import { storage, db } from '../firebase/config';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';

// File size limits
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200MB

// Allowed formats
const ALLOWED_IMAGE_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_FORMATS = ['video/mp4', 'video/webm'];

export const useBulkUpload = () => {
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({});
    const [uploadStatus, setUploadStatus] = useState({
        message: '',
        isUploading: false,
        completedCount: 0,
        totalCount: 0,
        currentFile: ''
    });

    // Validate file
    const validateFile = useCallback((file) => {
        const isImage = ALLOWED_IMAGE_FORMATS.includes(file.type);
        const isVideo = ALLOWED_VIDEO_FORMATS.includes(file.type);
        
        if (!isImage && !isVideo) {
            return {
                valid: false,
                error: `Invalid file type: ${file.type}`
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
    }, []);

    // Upload single file
    const uploadFile = useCallback(async (fileObj, categoryName, subCategoryName, selectedCategory, selectedSubCategory, tags, user, userRole) => {
        const timestamp = Date.now();
        const storagePath = `interior-library/${categoryName}/${subCategoryName}/${fileObj.mediaType}/${timestamp}_${fileObj.file.name}`;
        const storageRef = ref(storage, storagePath);

        const uploadTask = uploadBytesResumable(storageRef, fileObj.file);

        return new Promise((resolve, reject) => {
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

                        // Save to Firestore
                        await addDoc(collection(db, 'media'), {
                            name: fileObj.file.name,
                            url: downloadURL,
                            thumbnailUrl: downloadURL,
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

                        resolve({ success: true, fileObj });
                    } catch (firestoreError) {
                        console.error(`❌ Firestore error: ${fileObj.file.name}`, firestoreError);
                        reject(firestoreError);
                    }
                }
            );
        });
    }, []);

    // Update category counts
    const updateCategoryCounts = useCallback(async (selectedCategory, selectedSubCategory, imageCount, videoCount) => {
        try {
            const categoryRef = doc(db, 'categories', selectedCategory);
            const categoryDoc = await getDoc(categoryRef);

            if (categoryDoc.exists()) {
                const catData = categoryDoc.data();
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
                return true;
            }
            return false;
        } catch (error) {
            console.error('❌ Failed to update category counts:', error);
            return false;
        }
    }, []);

    // Bulk upload with concurrency control
    const bulkUpload = useCallback(async (files, categoryName, subCategoryName, selectedCategory, selectedSubCategory, tags, user, userRole, concurrency = 3) => {
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
        const results = [];

        const uploadQueue = [...files];
        const activeUploads = [];

        while (uploadQueue.length > 0 || activeUploads.length > 0) {
            while (activeUploads.length < concurrency && uploadQueue.length > 0) {
                const fileObj = uploadQueue.shift();
                
                setUploadStatus(prev => ({
                    ...prev,
                    currentFile: fileObj.file.name,
                    message: `Uploading ${prev.completedCount + 1} of ${files.length}`
                }));

                const uploadPromise = uploadFile(
                    fileObj,
                    categoryName,
                    subCategoryName,
                    selectedCategory,
                    selectedSubCategory,
                    tags,
                    user,
                    userRole
                )
                    .then(result => {
                        successCount++;
                        results.push({ ...result, status: 'success' });
                        return result;
                    })
                    .catch(error => {
                        failureCount++;
                        results.push({ fileObj, status: 'error', error });
                        return { fileObj, error };
                    })
                    .finally(() => {
                        setUploadStatus(prev => ({
                            ...prev,
                            completedCount: prev.completedCount + 1
                        }));
                    });

                activeUploads.push(uploadPromise);
            }

            if (activeUploads.length > 0) {
                await Promise.race(activeUploads);
                const completedIndex = activeUploads.findIndex(p => p.status !== 'pending');
                if (completedIndex !== -1) {
                    activeUploads.splice(completedIndex, 1);
                }
            }
        }

        // Update category counts
        if (successCount > 0) {
            const imageCount = results.filter(r => r.status === 'success' && r.fileObj.mediaType === 'image').length;
            const videoCount = results.filter(r => r.status === 'success' && r.fileObj.mediaType === 'video').length;
            await updateCategoryCounts(selectedCategory, selectedSubCategory, imageCount, videoCount);
        }

        setUploading(false);
        setUploadStatus({
            message: `Upload complete! ${successCount} succeeded, ${failureCount} failed`,
            isUploading: false,
            completedCount: files.length,
            totalCount: files.length,
            currentFile: ''
        });

        return {
            successCount,
            failureCount,
            totalCount: files.length,
            results
        };
    }, [uploadFile, updateCategoryCounts]);

    const resetUpload = useCallback(() => {
        setUploading(false);
        setUploadProgress({});
        setUploadStatus({
            message: '',
            isUploading: false,
            completedCount: 0,
            totalCount: 0,
            currentFile: ''
        });
    }, []);

    return {
        uploading,
        uploadProgress,
        uploadStatus,
        validateFile,
        bulkUpload,
        resetUpload
    };
};
