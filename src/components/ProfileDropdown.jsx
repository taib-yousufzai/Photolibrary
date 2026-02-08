// Profile Dropdown Component
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/FirebaseAuthContext';
import { 
    User, 
    Settings, 
    LogOut, 
    Shield, 
    Heart, 
    Upload,
    BarChart3,
    ChevronDown
} from 'lucide-react';
import './ProfileDropdown.css';

const ProfileDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const buttonRef = useRef(null);
    const { user, userRole, logout, hasPermission } = useAuth();
    const navigate = useNavigate();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current && 
                !dropdownRef.current.contains(event.target) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close on escape key
    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [isOpen]);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const handleNavigation = (path) => {
        setIsOpen(false);
        navigate(path);
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'admin': return '#ff6b6b';
            case 'staff': return '#4ecdc4';
            case 'client': return '#45b7d1';
            default: return '#95a5a6';
        }
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'admin': return <Shield size={12} />;
            case 'staff': return <BarChart3 size={12} />;
            case 'client': return <User size={12} />;
            default: return <User size={12} />;
        }
    };

    return (
        <div className="profile-container">
            <button
                ref={buttonRef}
                className="profile-btn"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Profile menu"
                aria-expanded={isOpen}
            >
                <div className="user-avatar">
                    {user?.displayName?.[0] || user?.email?.[0] || 'U'}
                </div>
                <div className="user-info">
                    <span className="user-name">
                        {user?.displayName || user?.email?.split('@')[0] || 'User'}
                    </span>
                    <div className="user-role" style={{ color: getRoleColor(userRole) }}>
                        {getRoleIcon(userRole)}
                        <span>{userRole}</span>
                    </div>
                </div>
                <ChevronDown size={16} className={`chevron ${isOpen ? 'open' : ''}`} />
            </button>

            {isOpen && (
                <div ref={dropdownRef} className="profile-dropdown">
                    <div className="profile-header">
                        <div className="profile-avatar-large">
                            {user?.displayName?.[0] || user?.email?.[0] || 'U'}
                        </div>
                        <div className="profile-info">
                            <h3>{user?.displayName || 'User'}</h3>
                            <p>{user?.email}</p>
                            <div className="profile-role" style={{ backgroundColor: getRoleColor(userRole) }}>
                                {getRoleIcon(userRole)}
                                <span>{userRole.toUpperCase()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="profile-menu">
                        <button
                            className="profile-menu-item"
                            onClick={() => handleNavigation('/favorites')}
                        >
                            <Heart size={16} />
                            <span>My Favorites</span>
                        </button>

                        {hasPermission('canUploadMedia') && (
                            <button
                                className="profile-menu-item"
                                onClick={() => handleNavigation('/upload')}
                            >
                                <Upload size={16} />
                                <span>Upload Media</span>
                            </button>
                        )}

                        {hasPermission('canViewAnalytics') && (
                            <button
                                className="profile-menu-item"
                                onClick={() => handleNavigation('/admin/analytics')}
                            >
                                <BarChart3 size={16} />
                                <span>Analytics</span>
                            </button>
                        )}

                        {userRole === 'admin' && (
                            <>
                                <div className="profile-menu-divider" />
                                <button
                                    className="profile-menu-item"
                                    onClick={() => handleNavigation('/admin/users')}
                                >
                                    <User size={16} />
                                    <span>User Management</span>
                                </button>
                                <button
                                    className="profile-menu-item"
                                    onClick={() => handleNavigation('/admin/categories')}
                                >
                                    <Settings size={16} />
                                    <span>Category Management</span>
                                </button>
                            </>
                        )}
                    </div>

                    <div className="profile-footer">
                        <button
                            className="profile-menu-item logout"
                            onClick={handleLogout}
                        >
                            <LogOut size={16} />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileDropdown;