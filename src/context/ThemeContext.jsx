// Theme Context for Day/Night Mode
import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    const [isDark, setIsDark] = useState(() => {
        // Check localStorage first
        const saved = localStorage.getItem('theme');
        if (saved) {
            return saved === 'dark';
        }
        // Check system preference
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    // Apply theme to document
    useEffect(() => {
        const root = document.documentElement;
        
        if (isDark) {
            root.classList.add('dark-theme');
            root.classList.remove('light-theme');
        } else {
            root.classList.add('light-theme');
            root.classList.remove('dark-theme');
        }
        
        // Save to localStorage
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        
        console.log(`🎨 Theme changed to: ${isDark ? 'dark' : 'light'}`);
    }, [isDark]);

    // Listen for system theme changes
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        const handleChange = (e) => {
            // Only auto-switch if user hasn't manually set a preference
            const savedTheme = localStorage.getItem('theme');
            if (!savedTheme) {
                setIsDark(e.matches);
            }
        };
        
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    const toggleTheme = () => {
        setIsDark(prev => !prev);
    };

    const setTheme = (theme) => {
        setIsDark(theme === 'dark');
    };

    const value = {
        isDark,
        theme: isDark ? 'dark' : 'light',
        toggleTheme,
        setTheme
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};