// Role definitions for Brass Space Interior Solution
export const ROLES = {
    ADMIN: 'admin',
    STAFF: 'staff',
    CLIENT: 'client'
};

export const PERMISSIONS = {
    [ROLES.ADMIN]: {
        canUpload: true,
        canDelete: true,
        canDownload: true,
        canScreenshot: true,
        canShare: true,
        canManageCategories: true,
        canManageUsers: true,
        canViewAnalytics: true,
        canFavorite: true,
        canAccessQuotationBuilder: true
    },
    [ROLES.STAFF]: {
        canUpload: true,              // ✅ Staff can upload
        canDelete: false,
        canDownload: true,
        canScreenshot: true,
        canShare: true,
        canManageCategories: false,
        canManageUsers: false,
        canViewAnalytics: true,       // ✅ Staff can view limited analytics
        canFavorite: true,
        canAccessQuotationBuilder: true
    },
    [ROLES.CLIENT]: {
        canUpload: false,
        canDelete: false,
        canDownload: false,
        canScreenshot: false,
        canShare: false,
        canManageCategories: false,
        canManageUsers: false,
        canViewAnalytics: false,
        canFavorite: true,
        canAccessQuotationBuilder: false  // ❌ Clients cannot access Quotation Builder
    }
};
