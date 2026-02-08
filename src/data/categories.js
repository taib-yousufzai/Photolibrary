// Brass Space Interior Solution - Categories Data
// All 15 main categories with their sub-categories

// Helper function to generate random counts
const generateRandomCount = (min = 8, max = 35) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Helper function to add random counts to subcategories
const addRandomCounts = (categories) => {
    return categories.map(category => ({
        ...category,
        subCategories: category.subCategories.map(subCat => ({
            ...subCat,
            imageCount: generateRandomCount(8, 35), // Random between 8-35 images
            videoCount: generateRandomCount(2, 12)  // Random between 2-12 videos
        }))
    }));
};

// Base categories data
const baseCategories = [
    {
        id: 'kitchen',
        name: 'Kitchen',
        icon: 'ChefHat',
        emoji: '🍳',
        description: 'Modern kitchen designs from modular to luxury',
        color: '#f59e0b',
        subCategories: [
            { id: 'l-shape', name: 'L-Shape Kitchen' },
            { id: 'u-shape', name: 'U-Shape Kitchen' },
            { id: 'parallel', name: 'Parallel Kitchen' },
            { id: 'island', name: 'Island Kitchen' },
            { id: 'g-shape', name: 'G-Shape Kitchen' },
            { id: 'straight', name: 'Straight Kitchen' },
            { id: 'open', name: 'Open Kitchen' },
            { id: 'modular', name: 'Modular Kitchen' },
            { id: 'small', name: 'Small Kitchen' },
            { id: 'luxury', name: 'Luxury Kitchen' }
        ]
    },
    {
        id: 'living-area',
        name: 'Living Area',
        icon: 'Sofa',
        emoji: '🛋️',
        description: 'Stunning living room designs and wall treatments',
        color: '#8b5cf6',
        subCategories: [
            { id: 'tv-unit', name: 'TV Unit Design' },
            { id: 'cnc-wall', name: 'CNC Wall Design' },
            { id: 'wall-paneling', name: 'Wall Paneling' },
            { id: 'sofa-back', name: 'Sofa Back Panel' },
            { id: 'partition', name: 'Partition Design' },
            { id: 'wallpaper', name: 'Wallpaper Design' },
            { id: 'lighting', name: 'Lighting Design' },
            { id: 'ceiling', name: 'Living False Ceiling' }
        ]
    },
    {
        id: 'bedroom',
        name: 'Bedroom',
        icon: 'Bed',
        emoji: '🛏️',
        description: 'Cozy and elegant bedroom interiors',
        color: '#ec4899',
        subCategories: [
            { id: 'master', name: 'Master Bedroom' },
            { id: 'kids', name: 'Kids Bedroom' },
            { id: 'guest', name: 'Guest Bedroom' },
            { id: 'bed-back', name: 'Bed Back Panel' },
            { id: 'lighting', name: 'Bedroom Lighting' },
            { id: 'ceiling', name: 'Bedroom False Ceiling' }
        ]
    },
    {
        id: 'dining-area',
        name: 'Dining Area',
        icon: 'UtensilsCrossed',
        emoji: '🍽️',
        description: 'Elegant dining room setups and designs',
        color: '#14b8a6',
        subCategories: [
            { id: 'table', name: 'Dining Table Design' },
            { id: 'crockery', name: 'Crockery Unit' },
            { id: 'bar', name: 'Bar Unit' },
            { id: 'wall-panel', name: 'Dining Wall Panel' },
            { id: 'ceiling', name: 'Dining False Ceiling' }
        ]
    },
    {
        id: 'bathroom',
        name: 'Bathroom',
        icon: 'Bath',
        emoji: '🚿',
        description: 'Modern and luxury bathroom designs',
        color: '#06b6d4',
        subCategories: [
            { id: 'modern', name: 'Modern Bathroom' },
            { id: 'luxury', name: 'Luxury Bathroom' },
            { id: 'small', name: 'Small Bathroom' },
            { id: 'vanity', name: 'Vanity Unit' },
            { id: 'shower', name: 'Shower Area' },
            { id: 'tile', name: 'Tile Design' }
        ]
    },
    {
        id: 'wardrobe',
        name: 'Wardrobe',
        icon: 'DoorOpen',
        emoji: '🚪',
        description: 'Stylish wardrobe and storage solutions',
        color: '#a855f7',
        subCategories: [
            { id: 'sliding', name: 'Sliding Wardrobe' },
            { id: 'hinged', name: 'Hinged Wardrobe' },
            { id: 'walkin', name: 'Walk-in Wardrobe' },
            { id: 'open', name: 'Open Wardrobe' },
            { id: 'glass', name: 'Glass Wardrobe' },
            { id: 'kids', name: 'Kids Wardrobe' }
        ]
    },
    {
        id: 'false-ceiling',
        name: 'False Ceiling',
        icon: 'LayoutGrid',
        emoji: '🎯',
        description: 'Designer false ceiling patterns and styles',
        color: '#f97316',
        subCategories: [
            { id: 'gypsum', name: 'Gypsum Ceiling' },
            { id: 'pop', name: 'POP Ceiling' },
            { id: 'wooden', name: 'Wooden Ceiling' },
            { id: 'designer', name: 'Designer Ceiling' },
            { id: 'cove', name: 'Cove Lighting Ceiling' },
            { id: 'minimal', name: 'Minimal Ceiling' }
        ]
    },
    {
        id: 'wall-decor',
        name: 'Wall Décor',
        icon: 'Frame',
        emoji: '🖼️',
        description: 'Creative wall decoration ideas',
        color: '#eab308',
        subCategories: [
            { id: 'cnc', name: 'CNC Wall Design' },
            { id: 'wallpaper', name: 'Wallpaper' },
            { id: 'paneling', name: 'Wall Paneling' },
            { id: '3d-panels', name: '3D Wall Panels' },
            { id: 'texture', name: 'Paint & Texture' },
            { id: 'art', name: 'Wall Art' }
        ]
    },
    {
        id: 'facade',
        name: 'Facade / Exterior',
        icon: 'Building2',
        emoji: '🏢',
        description: 'Stunning building exteriors and facades',
        color: '#64748b',
        subCategories: [
            { id: 'modern', name: 'Modern Facade' },
            { id: 'luxury', name: 'Luxury Facade' },
            { id: 'glass', name: 'Glass Elevation' },
            { id: 'stone', name: 'Stone Cladding' },
            { id: 'wooden', name: 'Wooden Cladding' },
            { id: 'balcony', name: 'Balcony Facade' }
        ]
    },
    {
        id: 'balcony',
        name: 'Balcony',
        icon: 'Trees',
        emoji: '🌿',
        description: 'Beautiful balcony designs and gardens',
        color: '#22c55e',
        subCategories: [
            { id: 'open', name: 'Open Balcony' },
            { id: 'covered', name: 'Covered Balcony' },
            { id: 'seating', name: 'Balcony Seating' },
            { id: 'garden', name: 'Balcony Garden' },
            { id: 'glass-railing', name: 'Glass Railing Balcony' }
        ]
    },
    {
        id: 'temple-room',
        name: 'Temple Room',
        icon: 'Landmark',
        emoji: '🛕',
        description: 'Sacred temple and pooja room designs',
        color: '#dc2626',
        subCategories: [
            { id: 'wooden', name: 'Wooden Mandir' },
            { id: 'marble', name: 'Marble Mandir' },
            { id: 'wall-mounted', name: 'Wall Mounted Mandir' },
            { id: 'traditional', name: 'Traditional Temple' },
            { id: 'modern', name: 'Modern Temple Design' }
        ]
    },
    {
        id: 'study-room',
        name: 'Library / Study Room',
        icon: 'BookOpen',
        emoji: '📚',
        description: 'Productive study and home office spaces',
        color: '#2563eb',
        subCategories: [
            { id: 'home-library', name: 'Home Library' },
            { id: 'study-table', name: 'Study Table Design' },
            { id: 'bookshelf', name: 'Bookshelf Design' },
            { id: 'kids-study', name: 'Kids Study Room' },
            { id: 'home-office', name: 'Home Office' }
        ]
    },
    {
        id: 'entertainment',
        name: 'Entertainment Room',
        icon: 'Clapperboard',
        emoji: '🎬',
        description: 'Home theatres and gaming spaces',
        color: '#7c3aed',
        subCategories: [
            { id: 'theatre', name: 'Home Theatre' },
            { id: 'gaming', name: 'Gaming Room' },
            { id: 'music', name: 'Music Room' },
            { id: 'media-wall', name: 'Media Wall Design' },
            { id: 'acoustic', name: 'Acoustic Panel Design' }
        ]
    },
    {
        id: 'commercial',
        name: 'Commercial Interior',
        icon: 'Store',
        emoji: '🏬',
        description: 'Professional commercial space designs',
        color: '#0891b2',
        subCategories: [
            { id: 'office', name: 'Office Interior' },
            { id: 'retail', name: 'Retail Shop' },
            { id: 'restaurant', name: 'Restaurant Interior' },
            { id: 'cafe', name: 'Cafe Interior' },
            { id: 'salon', name: 'Salon Interior' },
            { id: 'clinic', name: 'Clinic / Hospital Interior' }
        ]
    },
    {
        id: 'materials',
        name: 'Materials & Finishes',
        icon: 'Layers',
        emoji: '🧱',
        description: 'Material samples and finish options',
        color: '#78716c',
        subCategories: [
            { id: 'laminates', name: 'Laminates' },
            { id: 'plywood', name: 'Plywood' },
            { id: 'mdf', name: 'MDF' },
            { id: 'acrylic', name: 'Acrylic' },
            { id: 'glass', name: 'Glass' },
            { id: 'marble', name: 'Marble' },
            { id: 'tiles', name: 'Tiles' },
            { id: 'hardware', name: 'Hardware' },
            { id: 'lighting', name: 'Lighting' }
        ]
    }
];

// Apply random counts to all categories
export const categories = addRandomCounts(baseCategories);

// Helper functions
export const getCategoryById = (id) => categories.find(cat => cat.id === id);

export const getSubCategoryById = (categoryId, subCategoryId) => {
    const category = getCategoryById(categoryId);
    if (!category) return null;
    return category.subCategories.find(sub => sub.id === subCategoryId);
};

export const getAllSubCategories = () => {
    return categories.flatMap(cat =>
        cat.subCategories.map(sub => ({
            ...sub,
            categoryId: cat.id,
            categoryName: cat.name
        }))
    );
};

// Tags for filtering
export const tags = [
    { id: 'luxury', name: 'Luxury', color: '#eab308' },
    { id: 'modular', name: 'Modular', color: '#8b5cf6' },
    { id: 'small-space', name: 'Small Space', color: '#06b6d4' },
    { id: 'budget', name: 'Budget Friendly', color: '#22c55e' },
    { id: 'modern', name: 'Modern', color: '#3b82f6' },
    { id: 'traditional', name: 'Traditional', color: '#f97316' },
    { id: 'minimalist', name: 'Minimalist', color: '#64748b' },
    { id: 'premium', name: 'Premium', color: '#ec4899' }
];

// Filters
export const filters = {
    type: [
        { id: 'all', name: 'All' },
        { id: 'image', name: 'Images' },
        { id: 'video', name: 'Videos' }
    ],
    space: [
        { id: 'all', name: 'All' },
        { id: 'residential', name: 'Residential' },
        { id: 'commercial', name: 'Commercial' }
    ],
    budget: [
        { id: 'all', name: 'All' },
        { id: 'budget', name: 'Budget' },
        { id: 'mid', name: 'Mid-Range' },
        { id: 'luxury', name: 'Luxury' }
    ]
};