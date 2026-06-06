import * as React from 'react'
import { createRootRoute, Link, Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import {
    HomeIcon,
    PencilSquareIcon,
    UsersIcon,
    CalendarIcon,
    StarIcon,
    Cog6ToothIcon,
    ArrowRightOnRectangleIcon,
    Bars3Icon,
    BriefcaseIcon,
    DocumentIcon,
    MagnifyingGlassIcon,
    BellIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline'
import { useState, useEffect, useRef } from 'react'
import { ToastProvider, useToast } from '../components/ToastContext'
import { ToastContainer } from '../components/Toast'
import { apiCall, API_ENDPOINTS } from '../lib/api'

export const Route = createRootRoute({
    component: () => (
        <ToastProvider>
            <RootComponent />
        </ToastProvider>
    ),
})

function RootComponent() {
    const [sidebarHovered, setSidebarHovered] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false) // State untuk Sidebar Mobile
    const [user, setUser] = useState<{ name: string; email: string } | null>(null)
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [isChecking, setIsChecking] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false)
    const [notifications, setNotifications] = useState<any[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isLoadingNotifications, setIsLoadingNotifications] = useState(false)
    const notificationsRef = useRef<HTMLDivElement>(null)
    const navigate = useNavigate()
    const { toasts, removeToast } = useToast()

    const routerState = useRouterState()
    const currentPath = routerState.location.pathname
    const isLoginPage = currentPath === '/pages/login' || currentPath === '/'

    // Tutup menu mobile ketika rute halaman berubah
    useEffect(() => {
        setIsMobileMenuOpen(false)
    }, [currentPath])

    const checkAuthStatus = () => {
        const token = localStorage.getItem('token')
        const userStr = localStorage.getItem('user')
        const onLoginPage =
            window.location.pathname === '/pages/login' ||
            window.location.pathname === '/'

        if (!token) {
            setIsLoggedIn(false)
            setUser(null)
            setIsChecking(false)
            if (!onLoginPage) {
                navigate({ to: '/pages/login' })
            }
            return
        }

        // Token exists, try to get user from localStorage
        try {
            if (userStr) {
                const userData = JSON.parse(userStr)
                setUser({
                    name: userData.name || 'User',
                    email: userData.email || ''
                })
            } else {
                // Fallback if user data not in localStorage
                setUser({ name: 'User', email: '' })
            }
            setIsLoggedIn(true)
        } catch (err) {
            console.error('Error parsing user from localStorage:', err)
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            setUser(null)
            setIsLoggedIn(false)
            if (!onLoginPage) {
                navigate({ to: '/pages/login' })
            }
        } finally {
            setIsChecking(false)
        }
    }

    // Fetch notifications dari server
    const fetchNotifications = async () => {
        try {
            setIsLoadingNotifications(true)
            const res = await apiCall(API_ENDPOINTS.notifications)
            if (!res.ok) throw new Error('Gagal mengambil notifikasi')
            
            const data = await res.json()
            const allNotifications = Array.isArray(data.data) ? data.data : []
            
            // Ambil 5 notifikasi terbaru untuk dropdown
            const recentNotifications = allNotifications.slice(0, 5)
            setNotifications(recentNotifications)
            
            // Hitung unread count
            const unread = allNotifications.filter((n: any) => !n.isRead).length
            setUnreadCount(unread)
        } catch (err) {
            console.error('Error fetching notifications:', err)
        } finally {
            setIsLoadingNotifications(false)
        }
    }

    // Cukup satu kali saat mount — tidak perlu watch isLoginPage
    useEffect(() => {
        checkAuthStatus()
        
        // Fetch notifications setelah login berhasil
        const timer = setTimeout(() => {
            fetchNotifications()
        }, 500)

        // Listen for custom auth change event (triggered after login)
        const handleAuthChange = () => {
            checkAuthStatus()
        }

        window.addEventListener('auth-change', handleAuthChange)
        return () => {
            clearTimeout(timer)
            window.removeEventListener('auth-change', handleAuthChange)
        }
    }, [])

    const handleLogout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setUser(null)
        setIsLoggedIn(false)
        navigate({ to: '/pages/login' })
    }

    const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            navigate({ to: `/pages/search?query=${encodeURIComponent(searchQuery)}` })
            setSearchQuery('')
        }
    }

    const handleNotificationMarkAsRead = async (notificationId: string) => {
        try {
            const res = await apiCall(`${API_ENDPOINTS.notifications}/${notificationId}/read`, {
                method: 'PATCH'
            })
            if (res.ok) {
                // Update local state
                setNotifications(prev => 
                    prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
                )
                setUnreadCount(prev => Math.max(0, prev - 1))
            }
        } catch (err) {
            console.error('Error marking notification as read:', err)
        }
    }

    const handleNotificationDelete = async (notificationId: string) => {
        try {
            const res = await apiCall(`${API_ENDPOINTS.notifications}/${notificationId}`, {
                method: 'DELETE'
            })
            if (res.ok) {
                setNotifications(prev => prev.filter(n => n.id !== notificationId))
            }
        } catch (err) {
            console.error('Error deleting notification:', err)
        }
    }

    // Close notification dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
                setShowNotificationsDropdown(false)
            }
        }

        if (showNotificationsDropdown) {
            document.addEventListener('mousedown', handleClickOutside)
            return () => document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [showNotificationsDropdown])

    // Keyboard shortcut for search (Cmd+K / Ctrl+K)
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                // Focus search input if it exists
                const searchInput = document.getElementById('header-search-input') as HTMLInputElement
                if (searchInput) {
                    searchInput.focus()
                }
            }
        }

        if (!isLoginPage) {
            window.addEventListener('keydown', handleKeyPress)
            return () => window.removeEventListener('keydown', handleKeyPress)
        }
    }, [isLoginPage])

    const menuItems = [
        { name: 'Dashboard',     icon: HomeIcon,          to: '/pages/dashboard'     },
        { name: 'Creator',       icon: PencilSquareIcon,  to: '/pages/creator'       },
        { name: 'Client',        icon: UsersIcon,         to: '/pages/client'        },
        { name: 'Collaboration', icon: BriefcaseIcon,     to: '/pages/collaboration' },
        { name: 'Invoice',       icon: DocumentIcon,      to: '/pages/invoice'       },
        { name: 'Schedule',      icon: CalendarIcon,      to: '/pages/schedule'      },
        { name: 'Review',        icon: StarIcon,          to: '/pages/review'        },
        { name: 'Settings',      icon: Cog6ToothIcon,     to: '/pages/settings'      },
    ]

    if (isChecking) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="text-sm text-gray-400">Memuat...</div>
            </div>
        )
    }

    if (isLoginPage) {
        return <Outlet />
    }

    if (!isLoggedIn) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="text-sm text-gray-400">Memeriksa akses...</div>
            </div>
        )
    }

    return (
        <React.Fragment>
            <div className="flex h-screen bg-white overflow-hidden">

                {/* --- MOBILE SIDEBAR OVERLAY --- */}
                {isMobileMenuOpen && (
                    <div className="fixed inset-0 z-50 flex lg:hidden">
                        {/* Background Overlay */}
                        <div 
                            className="fixed inset-0 bg-gray-900/60 transition-opacity" 
                            onClick={() => setIsMobileMenuOpen(false)}
                            aria-hidden="true"
                        />
                        
                        {/* Mobile Panel */}
                        <div className="relative flex w-64 max-w-xs flex-col bg-white shadow-xl h-full">
                            <div className="absolute top-0 right-0 -mr-12 pt-4">
                                <button
                                    type="button"
                                    className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                                </button>
                            </div>

                            <div className="flex items-center h-16 px-5 border-b border-gray-200 shrink-0">
                                <img
                                    alt="CreatorHub"
                                    src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500"
                                    className="h-8 w-8 shrink-0"
                                />
                                <span className="ml-3 text-xl font-bold text-gray-900">CreatorHub</span>
                            </div>

                            <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
                                {menuItems.map((item) => {
                                    const Icon = item.icon
                                    return (
                                        <Link
                                            key={item.name}
                                            to={item.to}
                                            className="flex items-center px-3 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors group w-full"
                                            activeProps={{ className: 'flex items-center px-3 py-3 bg-blue-50 text-blue-600 rounded-lg group w-full' }}
                                        >
                                            <Icon className="w-6 h-6 shrink-0 group-hover:text-blue-600" />
                                            <span className="ml-3 text-sm font-medium">{item.name}</span>
                                        </Link>
                                    )
                                })}
                            </nav>

                            <div className="border-t border-gray-200 p-3 shrink-0">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center px-3 py-3 text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors group"
                                >
                                    <ArrowRightOnRectangleIcon className="w-6 h-6 shrink-0 group-hover:text-red-600" />
                                    <span className="ml-3 text-sm font-medium">Logout</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {/* ------------------------------ */}

                {/* --- DESKTOP SIDEBAR --- */}
                <div
                    className="hidden lg:flex fixed inset-y-0 left-0 z-40 flex-col bg-white border-r border-gray-200 overflow-hidden"
                    style={{
                        width: sidebarHovered ? '256px' : '80px',
                        transition: 'width 300ms ease-in-out',
                        transitionDelay: sidebarHovered ? '100ms' : '0ms',
                    }}
                    onMouseEnter={() => setSidebarHovered(true)}
                    onMouseLeave={() => setSidebarHovered(false)}
                >
                    <div className="flex items-center h-16 px-5 border-b border-gray-200 shrink-0 overflow-hidden">
                        <img
                            alt="CreatorHub"
                            src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500"
                            className="h-8 w-8 shrink-0"
                        />
                        <span
                            className="ml-3 text-xl font-bold text-gray-900 whitespace-nowrap"
                            style={{
                                opacity: sidebarHovered ? 1 : 0,
                                transition: 'opacity 200ms ease-in-out',
                                transitionDelay: sidebarHovered ? '200ms' : '0ms',
                            }}
                        >
                            CreatorHub
                        </span>
                    </div>

                    <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto overflow-x-hidden">
                        {menuItems.map((item) => {
                            const Icon = item.icon
                            return (
                                <Link
                                    key={item.name}
                                    to={item.to}
                                    title={!sidebarHovered ? item.name : ''}
                                    className="flex items-center px-3 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors group w-full"
                                    activeProps={{ className: 'flex items-center px-3 py-3 bg-blue-50 text-blue-600 rounded-lg group w-full' }}
                                >
                                    <Icon className="w-6 h-6 shrink-0 group-hover:text-blue-600" />
                                    <span
                                        className="ml-3 text-sm font-medium whitespace-nowrap"
                                        style={{
                                            opacity: sidebarHovered ? 1 : 0,
                                            transition: 'opacity 200ms ease-in-out',
                                            transitionDelay: sidebarHovered ? '200ms' : '0ms',
                                        }}
                                    >
                                        {item.name}
                                    </span>
                                </Link>
                            )
                        })}
                    </nav>

                    <div className="border-t border-gray-200 p-3 shrink-0">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center px-3 py-3 text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors group"
                        >
                            <ArrowRightOnRectangleIcon className="w-6 h-6 shrink-0 group-hover:text-red-600" />
                            <span
                                className="ml-3 text-sm font-medium whitespace-nowrap"
                                style={{
                                    opacity: sidebarHovered ? 1 : 0,
                                    transition: 'opacity 200ms ease-in-out',
                                    transitionDelay: sidebarHovered ? '200ms' : '0ms',
                                }}
                            >
                                Logout
                            </span>
                        </button>
                    </div>
                </div>
                {/* ----------------------- */}

                {/* --- MAIN CONTENT AREA --- */}
                {/* Menggunakan Tailwind classes untuk margin responsif (lg:ml-...) */}
                <div
                    className={`flex-1 flex flex-col w-full transition-all duration-300 ease-in-out ${
                        sidebarHovered ? 'lg:ml-[256px]' : 'lg:ml-[80px]'
                    }`}
                >
                    <div className="bg-white border-b border-gray-200 h-16 px-4 sm:px-6 flex items-center justify-between shrink-0 gap-4">
                        {/* Hamburger & Search */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <button 
                                onClick={() => setIsMobileMenuOpen(true)}
                                className="lg:hidden p-2 -ml-2 rounded-lg text-gray-600 hover:bg-gray-100 shrink-0"
                            >
                                <Bars3Icon className="w-6 h-6" />
                            </button>
                            
                            {/* Search Bar */}
                            {isLoggedIn && (
                                <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-xs">
                                    <input
                                        id="header-search-input"
                                        type="text"
                                        placeholder="🔍 Cari kreator..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full px-3 py-2 pl-10 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 pointer-events-none hidden sm:inline">⌘K</span>
                                </form>
                            )}
                        </div>

                        {/* Notifications & User Profile */}
                        {isLoggedIn && (
                            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                                {/* Notification Bell */}
                                <div className="relative" ref={notificationsRef}>
                                    <button
                                        onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                                        className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <BellIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                                        {unreadCount > 0 && (
                                            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] sm:text-xs rounded-full flex items-center justify-center font-semibold">
                                                {unreadCount > 99 ? '99+' : unreadCount}
                                            </span>
                                        )}
                                    </button>

                                    {/* Notifications Dropdown */}
                                    {showNotificationsDropdown && (
                                        <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                                            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                                                <h3 className="font-semibold text-gray-900">Notifikasi</h3>
                                                <button
                                                    onClick={() => setShowNotificationsDropdown(false)}
                                                    className="text-gray-400 hover:text-gray-600"
                                                >
                                                    <XMarkIcon className="w-5 h-5" />
                                                </button>
                                            </div>

                                            {isLoadingNotifications ? (
                                                <div className="p-4 text-center text-gray-500 text-sm">
                                                    Loading...
                                                </div>
                                            ) : notifications.length > 0 ? (
                                                <div className="max-h-80 sm:max-h-96 overflow-y-auto">
                                                    {notifications.map((notification: any) => (
                                                        <div
                                                            key={notification.id}
                                                            className={`p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors group ${
                                                                !notification.isRead ? 'bg-blue-50' : ''
                                                            }`}
                                                        >
                                                            <div className="flex justify-between items-start gap-2">
                                                                <div className="flex-1 min-w-0">
                                                                    <h4 className="font-medium text-sm text-gray-900 truncate">
                                                                        {notification.title}
                                                                    </h4>
                                                                    <p className="text-xs text-gray-600 line-clamp-2">
                                                                        {notification.message}
                                                                    </p>
                                                                    <div className="flex gap-2 mt-2">
                                                                        <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-medium ${
                                                                            notification.type === 'deadline' ? 'bg-red-100 text-red-700' :
                                                                            notification.type === 'campaign' ? 'bg-blue-100 text-blue-700' :
                                                                            'bg-gray-100 text-gray-700'
                                                                        }`}>
                                                                            {notification.type === 'deadline' ? '📌 Deadline' :
                                                                             notification.type === 'campaign' ? '🎯 Campaign' :
                                                                             '📢 Sistem'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        handleNotificationDelete(notification.id)
                                                                    }}
                                                                    className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                                                >
                                                                    <XMarkIcon className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                            {!notification.isRead && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        handleNotificationMarkAsRead(notification.id)
                                                                    }}
                                                                    className="text-[10px] sm:text-xs text-blue-600 hover:text-blue-700 font-medium mt-2"
                                                                >
                                                                    Tandai Sudah Dibaca
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-4 text-center text-gray-500 text-sm">
                                                    Tidak ada notifikasi
                                                </div>
                                            )}

                                            <div className="p-3 border-t border-gray-200 bg-gray-50 text-center">
                                                <Link
                                                    to="/pages/notification"
                                                    onClick={() => setShowNotificationsDropdown(false)}
                                                    className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium"
                                                >
                                                    Lihat Semua Notifikasi →
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* User Profile */}
                                <div className="flex items-center space-x-2 sm:space-x-3 pl-2 sm:pl-3 border-l border-gray-200">
                                    <div className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-500 rounded-full flex items-center justify-center shrink-0">
                                        <span className="text-white text-xs sm:text-sm font-semibold">
                                            {user?.name?.charAt(0).toUpperCase() ?? 'U'}
                                        </span>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-700 hidden sm:block">
                                        {user?.name ?? 'User'}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-auto bg-gray-50">
                        <Outlet />
                    </div>
                </div>
                {/* --------------------------- */}

            </div>
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </React.Fragment>
    )
}