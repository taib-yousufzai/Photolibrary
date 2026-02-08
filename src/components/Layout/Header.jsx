// Header Component
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/FirebaseAuthContext';
import { useTheme } from '../../context/ThemeContext';
import NotificationDropdown from '../NotificationDropdown';
import ProfileDropdown from '../ProfileDropdown';
import {
    Search,
    Moon,
    Sun,
    Menu,
    ChevronRight,
    Home
} from 'lucide-react';
import './Header.css';

const Header = ({ onMenuClick }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const { user, userRole } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    // Generate breadcrumbs from path
    const getBreadcrumbs = () => {
        const paths = location.pathname.split('/').filter(Boolean);
        const breadcrumbs = [{ label: 'Home', path: '/' }];

        let currentPath = '';
        paths.forEach((path) => {
            currentPath += `/${path}`;
            const label = path
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            breadcrumbs.push({ label, path: currentPath });
        });

        return breadcrumbs;
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
        }
    };

    return (
        <header className="header">
            <div className="header-left">
                <button className="menu-btn mobile-only" onClick={onMenuClick}>
                    <Menu size={24} />
                </button>

                {/* Breadcrumbs */}
                <nav className="breadcrumbs" aria-label="Breadcrumb">
                    {getBreadcrumbs().map((crumb, index, arr) => (
                        <span key={crumb.path} className="breadcrumb-item">
                            {index === 0 ? (
                                <button
                                    className="breadcrumb-link home"
                                    onClick={() => navigate(crumb.path)}
                                >
                                    <Home size={16} />
                                </button>
                            ) : (
                                <>
                                    <ChevronRight size={14} className="breadcrumb-separator" />
                                    {index === arr.length - 1 ? (
                                        <span className="breadcrumb-current">{crumb.label}</span>
                                    ) : (
                                        <button
                                            className="breadcrumb-link"
                                            onClick={() => navigate(crumb.path)}
                                        >
                                            {crumb.label}
                                        </button>
                                    )}
                                </>
                            )}
                        </span>
                    ))}
                </nav>
            </div>

            <div className="header-center">
                <form className="search-form" onSubmit={handleSearch}>
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search designs, categories..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <kbd className="search-shortcut">⌘K</kbd>
                </form>
            </div>

            <div className="header-right">
                <button
                    className="header-btn"
                    onClick={toggleTheme}
                    aria-label="Toggle theme"
                >
                    {isDark ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                <NotificationDropdown />

                <ProfileDropdown />
            </div>
        </header>
    );
};

export default Header;
