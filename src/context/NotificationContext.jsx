// Notification Context
import { createContext, useContext, useState, useEffect } from 'react';

const NotificationContext = createContext();

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Initialize with some sample notifications
    useEffect(() => {
        const sampleNotifications = [
            {
                id: '1',
                title: 'Welcome to Interior Library',
                message: 'Explore thousands of design inspirations',
                type: 'info',
                timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
                read: false,
                icon: '🎉'
            },
            {
                id: '2',
                title: 'New Category Added',
                message: 'Check out the new Modern Kitchen designs',
                type: 'success',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
                read: false,
                icon: '🏠'
            },
            {
                id: '3',
                title: 'Download Complete',
                message: 'Your design collection has been downloaded',
                type: 'success',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
                read: true,
                icon: '📥'
            }
        ];
        
        setNotifications(sampleNotifications);
        setUnreadCount(sampleNotifications.filter(n => !n.read).length);
    }, []);

    const addNotification = (notification) => {
        const newNotification = {
            id: Date.now().toString(),
            timestamp: new Date(),
            read: false,
            type: 'info',
            icon: '📢',
            ...notification
        };
        
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
    };

    const markAsRead = (id) => {
        setNotifications(prev => 
            prev.map(notification => 
                notification.id === id 
                    ? { ...notification, read: true }
                    : notification
            )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const markAllAsRead = () => {
        setNotifications(prev => 
            prev.map(notification => ({ ...notification, read: true }))
        );
        setUnreadCount(0);
    };

    const removeNotification = (id) => {
        setNotifications(prev => {
            const notification = prev.find(n => n.id === id);
            const newNotifications = prev.filter(n => n.id !== id);
            
            if (notification && !notification.read) {
                setUnreadCount(prevCount => Math.max(0, prevCount - 1));
            }
            
            return newNotifications;
        });
    };

    const clearAllNotifications = () => {
        setNotifications([]);
        setUnreadCount(0);
    };

    const value = {
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAllNotifications
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};