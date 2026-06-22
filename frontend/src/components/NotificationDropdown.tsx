'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    link?: string;
    isRead: boolean;
    createdAt: string;
}

export default function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fetch notifications
    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadCount || 0);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every 30 seconds for new notifications
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    // Handle clicks outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = async (id: string, e?: React.MouseEvent) => {
        if (e) e.preventDefault();

        try {
            await fetch('/api/notifications/mark-read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationId: id })
            });

            // Optimistic UI update
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await fetch('/api/notifications/mark-read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ markAll: true })
            });

            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const handleRSVP = async (e: React.MouseEvent, notificationId: string, enrollmentId: string, rsvp: 'YES' | 'NO') => {
        e.stopPropagation();
        e.preventDefault();
        try {
            const res = await fetch('/api/workshops/rsvp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enrollmentId, notificationId, rsvp })
            });

            if (res.ok) {
                // Optimistically mark as read and update UI
                setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
            } else {
                const data = await res.json();
                alert(`RSVP failed: ${data.error}`);
            }
        } catch (error) {
            console.error('RSVP error:', error);
            alert('An error occurred submitting your RSVP.');
        }
    };

    // Formatter
    const timeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    const getIconTheme = (type: string) => {
        switch (type) {
            case 'REPORT_READY': return 'bg-purple-100 text-purple-600';
            case 'MODULE_UPDATE': return 'bg-emerald-100 text-emerald-600';
            case 'APPOINTMENT': return 'bg-blue-100 text-blue-600';
            case 'CHAT': return 'bg-orange-100 text-orange-600';
            default: return 'bg-slate-100 text-slate-400';
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors focus:outline-none"
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>

                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-rose-500 rounded-full border-2 border-white select-none">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel / Prominent Box */}
            {isOpen && (
                <>
                    {/* Fixed Backdrop to hide background */}
                    <div
                        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 transition-opacity"
                        onClick={() => setIsOpen(false)}
                    />

                    <div className="absolute right-0 top-full mt-3 w-[calc(100vw-2rem)] max-w-[22rem] sm:max-w-[28rem] sm:w-[28rem] bg-slate-900 rounded-2xl shadow-xl border border-slate-700 overflow-hidden z-50 transform origin-top-right transition-all max-h-[80vh] flex flex-col">
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between bg-slate-800">
                            <h3 className="font-semibold text-slate-100">Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                                >
                                    Mark all as read
                                </button>
                            )}
                        </div>

                        {/* Notification List */}
                        <div className="flex-1 overflow-y-auto min-h-[100px] p-1">
                            {isLoading ? (
                                <div className="flex justify-center items-center py-8">
                                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                                    <span className="bg-slate-100 text-3xl p-3 rounded-full mb-3">📭</span>
                                    <p className="text-slate-500 text-sm font-medium">You have no notifications right now.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100/80">
                                    {notifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            onClick={() => !notification.isRead && markAsRead(notification.id)}
                                            className={`flex items-start p-4 m-1 rounded-xl transition-colors cursor-pointer ${!notification.isRead ? 'bg-indigo-500/5 hover:bg-indigo-500/10' : 'hover:bg-slate-800'}`}
                                        >
                                            <div className={`mt-1 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm border border-slate-700 ${getIconTheme(notification.type)}`}>
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div className="ml-4 flex-1 min-w-0">
                                                {notification.link?.startsWith('rsvp:') ? (
                                                    <div className="block group">
                                                        <p className={`text-[15px] ${!notification.isRead ? 'font-bold text-slate-100' : 'font-semibold text-slate-200'}`}>
                                                            {notification.title}
                                                        </p>
                                                        <p className="text-sm text-slate-400 mt-1 break-words">
                                                            {notification.message}
                                                        </p>
                                                        {!notification.isRead && (
                                                            <div className="flex gap-3 mt-3 mb-1">
                                                                <button
                                                                    onClick={(e) => handleRSVP(e, notification.id, notification.link!.split(':')[1], 'YES')}
                                                                    className="flex-1 px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold rounded-lg transition-colors shadow-sm border border-emerald-200/50"
                                                                >
                                                                    ✓ Attending
                                                                </button>
                                                                <button
                                                                    onClick={(e) => handleRSVP(e, notification.id, notification.link!.split(':')[1], 'NO')}
                                                                    className="flex-1 px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold rounded-lg transition-colors shadow-sm border border-rose-200/50"
                                                                >
                                                                    ✗ Can't Make It
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : notification.link ? (
                                                    <Link href={notification.link} className="block group">
                                                        <p className={`text-[15px] ${!notification.isRead ? 'font-bold text-slate-100' : 'font-semibold text-slate-200'} group-hover:text-indigo-600`}>
                                                            {notification.title}
                                                        </p>
                                                        <p className="text-sm text-slate-400 mt-1 break-words line-clamp-2">
                                                            {notification.message}
                                                        </p>
                                                    </Link>
                                                ) : (
                                                    <>
                                                        <p className={`text-[15px] ${!notification.isRead ? 'font-bold text-slate-100' : 'font-semibold text-slate-200'}`}>
                                                            {notification.title}
                                                        </p>
                                                        <p className="text-sm text-slate-400 mt-1 break-words">
                                                            {notification.message}
                                                        </p>
                                                    </>
                                                )}
                                                <p className="text-xs text-slate-400 mt-2 font-medium flex items-center">
                                                    {timeAgo(notification.createdAt)}
                                                </p>
                                            </div>
                                            {!notification.isRead && (
                                                <div className="flex-shrink-0 ml-3">
                                                    <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full mt-2 shadow-sm"></div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="p-3 border-t border-slate-700 bg-slate-800">
                                <button className="w-full text-center text-sm text-slate-500 hover:text-slate-100 font-medium">
                                    View all notifications
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
