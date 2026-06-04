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
} from '@heroicons/react/24/outline'
import { useState, useEffect } from 'react'
import { ToastProvider, useToast } from '../components/ToastContext'
import { ToastContainer } from '../components/Toast'

export const Route = createRootRoute({
    component: () => (
        <ToastProvider>
            <RootComponent />
        </ToastProvider>
    ),
})

function RootComponent() {
    const [sidebarHovered, setSidebarHovered] = useState(false)
    const [user, setUser] = useState<{ name: string; email: string } | null>(null)
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [isChecking, setIsChecking] = useState(true)
    const navigate = useNavigate()
    const { toasts, removeToast } = useToast()

    const routerState = useRouterState()
    const currentPath = routerState.location.pathname
    const isLoginPage = currentPath === '/pages/login' || currentPath === '/'

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

    // Cukup satu kali saat mount — tidak perlu watch isLoginPage
    useEffect(() => {
        checkAuthStatus()

        // Listen for custom auth change event (triggered after login)
        const handleAuthChange = () => {
            checkAuthStatus()
        }

        window.addEventListener('auth-change', handleAuthChange)
        return () => window.removeEventListener('auth-change', handleAuthChange)
    }, [])

    const handleLogout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setUser(null)
        setIsLoggedIn(false)
        navigate({ to: '/pages/login' })
    }

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

                <div
                    className="hidden lg:flex fixed inset-y-0 left-0 z-50 flex-col bg-white border-r border-gray-200 overflow-hidden"
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

                <div
                    className="flex-1 flex flex-col w-full"
                    style={{
                        marginLeft: sidebarHovered ? '256px' : '80px',
                        transition: 'margin-left 300ms ease-in-out',
                        transitionDelay: sidebarHovered ? '100ms' : '0ms',
                    }}
                >
                    <div className="bg-white border-b border-gray-200 h-16 px-6 flex items-center justify-between shrink-0">
                        <button className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100">
                            <Bars3Icon className="w-6 h-6" />
                        </button>
                        <div className="flex-1" />
                        <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center shrink-0">
                                <span className="text-white text-sm font-semibold">
                                    {user?.name?.charAt(0).toUpperCase() ?? 'U'}
                                </span>
                            </div>
                            <span className="text-sm font-semibold text-gray-700 hidden sm:block">
                                {user?.name ?? 'User'}
                            </span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto bg-gray-50">
                        <Outlet />
                    </div>
                </div>

            </div>
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </React.Fragment>
    )
}