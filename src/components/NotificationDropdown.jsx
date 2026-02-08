// Notification Dropdown Component
import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { Bell, X, Check, CheckCheck, Trash2 } from 'lucide-react';
import './NotificationDropdown.css';

const NotificationDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const buttonRef = useRef(null);
    const { 
        notifications, 
        unreadCount, 
        markAsRead, 
        markAllAsRead, 
        removeNotification, 
        clearAllNotifications 
    } = useNotifications();

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

    const formatTime = (timestamp) => {
        const now = new Date();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return timestamp.toLocaleDateString();
    };

    const getNotificationTypeClass = (type) => {
        switch (type) {
            case 'success': return 'notification-success';
            case 'warning': return 'notification-warning';
            case 'error': return 'notification-error';
            default: return 'notification-info';
        }
    };

    return (
        <div className="notification-container">
            <button
                ref={buttonRef}
                className="header-btn notification-btn"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Notifications"
                aria-expanded={isOpen}
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="notification-badge">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div ref={dropdownRef} className="notification-dropdown">
                    <div className="notification-header">
                        <h3>Notifications</h3>
                        <div className="notification-actions">
                            {unreadCount > 0 && (
                                <button
                                    className="action-btn"
                                    onClick={markAllAsRead}
                                    title="Mark all as read"
                                >
                                    <CheckCheck size={16} />
                                </button>
                            )}
                            {notifications.length > 0 && (
                                <button
                                    className="action-btn"
                                    onClick={clearAllNotifications}
                                    title="Clear all notifications"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="notification-list">
                        {notifications.length === 0 ? (
                            <div className="no-notifications">
                                <Bell size={48} />
                                <p>No notifications yet</p>
                                <span>You're all caught up!</span>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`notification-item ${getNotificationTypeClass(notification.type)} ${
                                        !notification.read ? 'unread' : ''
                                    }`}
                                    onClick={() => !notification.read && markAsRead(notification.id)}
                                >
                                    <div className="notification-icon">
                                        {notification.icon}
                                    </div>
                                    
                                    <div className="notification-content">
                                        <div className="notification-title">
                                            {notification.title}
                                            {!notification.read && <div className="unread-dot" />}
                                        </div>
                                        <div className="notification-message">
                                            {notification.message}
                                        </div>
                                        <div className="notification-time">
                                            {formatTime(notification.timestamp)}
                                        </div>
                                    </div>

                                    <div className="notification-item-actions">
                                        {!notification.read && (
                                            <button
                                                className="mark-read-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    markAsRead(notification.id);
                                                }}
                                                title="Mark as read"
                                            >
                                                <Check size={14} />
                                            </button>
                                        )}
                                        <button
                                            className="remove-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeNotification(notification.id);
                                            }}
                                            title="Remove notification"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div className="notification-footer">
                            <button
                                className="view-all-btn"
                                onClick={() => {
                                    setIsOpen(false);
                                    // Could navigate to a full notifications page
                                }}
                            >
                                View All Notifications
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;