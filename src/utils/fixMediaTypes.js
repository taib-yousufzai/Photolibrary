// Utility to fix media type fields in Firestore
import { db } from '../firebase/config';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

/**
 * Fix media documents that have incorrect or missing type fields
 * This ensures all media documents have a proper 'type' field set to 'image' or 'video'
 */
export async function fixMediaTypes() {
    console.log('🔧 Starting media type fix...');
    
    try {
        const mediaSnapshot = await getDocs(collection(db, 'media'));
        console.log(`📊 Found ${mediaSnapshot.size} media documents`);
        
        let fixed = 0;
        let alreadyCorrect = 0;
        let errors = 0;
        
        for (const mediaDoc of mediaSnapshot.docs) {
            const data = mediaDoc.data();
            const docId = mediaDoc.id;
            
            try {
                // Check if type field exists and is correct
                if (data.type === 'image' || data.type === 'video') {
                    alreadyCorrect++;
                    console.log(`✅ ${docId}: Already correct (${data.type})`);
                    continue;
                }
                
                // Determine type from various sources
                let correctType = null;
                
                // 1. Check mediaType field (from old uploads)
                if (data.mediaType === 'image' || data.mediaType === 'video') {
                    correctType = data.mediaType;
                }
                
                // 2. Check contentType
                if (!correctType && data.contentType) {
                    if (data.contentType.startsWith('image/')) {
                        correctType = 'image';
                    } else if (data.contentType.startsWith('video/')) {
                        correctType = 'video';
                    }
                }
                
                // 3. Check URL or name for file extension
                if (!correctType) {
                    const fileName = data.name || data.url || '';
                    const lowerName = fileName.toLowerCase();
                    
                    if (lowerName.match(/\.(jpg|jpeg|png|webp|gif)$/)) {
                        correctType = 'image';
                    } else if (lowerName.match(/\.(mp4|webm|mov|avi)$/)) {
                        correctType = 'video';
                    }
                }
                
                // 4. Default to image if still unknown
                if (!correctType) {
                    correctType = 'image';
                    console.warn(`⚠️ ${docId}: Could not determine type, defaulting to image`);
                }
                
                // Update the document
                await updateDoc(doc(db, 'media', docId), {
                    type: correctType
                });
                
                fixed++;
                console.log(`🔧 ${docId}: Fixed type to '${correctType}'`);
                
            } catch (error) {
                errors++;
                console.error(`❌ ${docId}: Error fixing type:`, error);
            }
        }
        
        console.log('\n📊 Media Type Fix Summary:');
        console.log(`✅ Already correct: ${alreadyCorrect}`);
        console.log(`🔧 Fixed: ${fixed}`);
        console.log(`❌ Errors: ${errors}`);
        console.log(`📊 Total processed: ${mediaSnapshot.size}`);
        
        return {
            total: mediaSnapshot.size,
            alreadyCorrect,
            fixed,
            errors
        };
        
    } catch (error) {
        console.error('❌ Error in fixMediaTypes:', error);
        throw error;
    }
}

/**
 * Get media statistics
 */
export async function getMediaStats() {
    try {
        const mediaSnapshot = await getDocs(collection(db, 'media'));
        
        let images = 0;
        let videos = 0;
        let unknown = 0;
        
        mediaSnapshot.forEach(doc => {
            const data = doc.data();
            const type = data.type || data.mediaType;
            
            if (type === 'image') {
                images++;
            } else if (type === 'video') {
                videos++;
            } else {
                unknown++;
                console.warn('Unknown media type:', { id: doc.id, type, name: data.name });
            }
        });
        
        console.log('📊 Media Statistics:');
        console.log(`🖼️ Images: ${images}`);
        console.log(`🎬 Videos: ${videos}`);
        console.log(`❓ Unknown: ${unknown}`);
        console.log(`📊 Total: ${mediaSnapshot.size}`);
        
        return {
            images,
            videos,
            unknown,
            total: mediaSnapshot.size
        };
        
    } catch (error) {
        console.error('❌ Error getting media stats:', error);
        throw error;
    }
}
