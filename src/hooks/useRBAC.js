// Custom Hook for Role-Based Access Control
import { useAuth } from '../context/FirebaseAuthContext';
import { ROLES, PERMISSIONS } from '../utils/roles';

export const useRBAC = () => {
    const { user, userRole, hasPermission, isAdmin, isStaff, isClient } = useAuth();

    // Check if user has specific permission
    const can = (permission) => {
        return hasPermission(permission);
    };

    // Check if user has any of the specified permissions
    const canAny = (permissions) => {
        return permissions.some(permission => hasPermission(permission));
    };

    // Check if user has all of the specified permissions
    const canAll = (permissions) => {
        return permissions.every(permission => hasPermission(permission));
    };

    // Check if user has specific role
    const hasRole = (role) => {
        return userRole === role;
    };

    // Check if user has any of the specified roles
    const hasAnyRole = (roles) => {
        return roles.includes(userRole);
    };

    // Get all permissions for current user
    const getAllPermissions = () => {
        return PERMISSIONS[userRole] || PERMISSIONS[ROLES.CLIENT];
    };

    // Check if feature is accessible
    const canAccessFeature = (feature) => {
        const featurePermissions = {
            upload: 'canUpload',
            delete: 'canDelete',
            download: 'canDownload',
            screenshot: 'canScreenshot',
            share: 'canShare',
            manageCategories: 'canManageCategories',
            manageUsers: 'canManageUsers',
            viewAnalytics: 'canViewAnalytics',
            quotationBuilder: 'canAccessQuotationBuilder'
        };

        const permission = featurePermissions[feature];
        return permission ? hasPermission(permission) : false;
    };

    // Get user role display name
    const getRoleDisplayName = () => {
        const roleNames = {
            [ROLES.ADMIN]: 'Administrator',
            [ROLES.STAFF]: 'Staff Member',
            [ROLES.CLIENT]: 'Client'
        };
        return roleNames[userRole] || 'User';
    };

    // Check if user is authenticated
    const isAuthenticated = () => {
        return !!user;
    };

    return {
        // User info
        user,
        userRole,
        isAuthenticated: isAuthenticated(),
        
        // Role checks
        isAdmin,
        isStaff,
        isClient,
        hasRole,
        hasAnyRole,
        getRoleDisplayName,
        
        // Permission checks
        can,
        canAny,
        canAll,
        hasPermission,
        getAllPermissions,
        canAccessFeature,
        
        // Constants
        ROLES,
        PERMISSIONS
    };
};
