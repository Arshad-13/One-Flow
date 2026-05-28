'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
    LayoutDashboard,
    FolderKanban,
    Clock,
    Receipt,
    FileText,
    DollarSign,
    BarChart3,
    Settings,
    LogOut,
    Users,
    Loader2,
    Menu,
    X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ModeToggle } from '@/components/mode-toggle'

const roleNavItems = {
    admin: [
        { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Analytics', href: '/admin/dashboard/analytics', icon: BarChart3 },
        { name: 'Projects', href: '/admin/dashboard/projects', icon: FolderKanban },
        { name: 'Documents', href: '/admin/dashboard/documents', icon: FileText },
        { name: 'Timesheets', href: '/admin/dashboard/timesheets', icon: Clock },
        { name: 'Expenses', href: '/admin/dashboard/expenses', icon: Receipt },
        { name: 'Hourly Rates', href: '/admin/dashboard/hourly-rates', icon: DollarSign },
        { name: 'Team Management', href: '/admin', icon: Users },
    ],
    project_manager: [
        { name: 'Dashboard', href: '/project_manager/dashboard', icon: LayoutDashboard },
        { name: 'Analytics', href: '/project_manager/dashboard/analytics', icon: BarChart3 },
        { name: 'Projects', href: '/project_manager/dashboard/projects', icon: FolderKanban },
        { name: 'Documents', href: '/project_manager/dashboard/documents', icon: FileText },
        { name: 'Timesheets', href: '/project_manager/dashboard/timesheets', icon: Clock },
    ],
    team_member: [
        { name: 'Dashboard', href: '/team_member/dashboard', icon: LayoutDashboard },
        { name: 'My Projects', href: '/team_member/dashboard/projects', icon: FolderKanban },
        { name: 'Timesheets', href: '/team_member/dashboard/timesheets', icon: Clock },
        { name: 'Expenses', href: '/team_member/dashboard/expenses', icon: Receipt },
    ],
    sales_finance: [
        { name: 'Dashboard', href: '/sales_finance/dashboard', icon: LayoutDashboard },
        { name: 'Analytics', href: '/sales_finance/dashboard/analytics', icon: BarChart3 },
        { name: 'Projects', href: '/sales_finance/dashboard/projects', icon: FolderKanban },
        { name: 'Documents', href: '/sales_finance/dashboard/documents', icon: FileText },
    ]
}

export default function RoleBasedLayout({ children, role }) {
    const pathname = usePathname()
    const router = useRouter()
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [redirecting, setRedirecting] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch('/api/auth/me', { credentials: 'include' })

                if (res.status === 401) {
                    setRedirecting(true)
                    router.push('/login')
                    return
                }

                if (res.ok) {
                    const data = await res.json()
                    setUser(data)

                    if (data.role !== role) {
                        setRedirecting(true)
                        router.push('/' + data.role + '/dashboard')
                        return
                    }
                } else {
                    // Any other error (403, 500, etc.) → redirect to login
                    setRedirecting(true)
                    router.push('/login')
                    return
                }
            } catch (error) {
                console.error('Session check failed:', error)
                setRedirecting(true)
                router.push('/login')
                return
            } finally {
                setLoading(false)
            }
        }
        fetchUser()
    }, [role, router])

    // Show spinner during initial load OR while a redirect is in progress
    if (loading || redirecting) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-teal" />
                    {redirecting && (
                        <p className="text-sm text-ink-2">Redirecting...</p>
                    )}
                </div>
            </div>
        )
    }

    // At this point user is confirmed and role matches — safe to render
    if (!user || user.role !== role) {
        // Fallback guard (should never reach here due to redirecting state above)
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-teal" />
            </div>
        )
    }

    const navItems = roleNavItems[role] || []

    const SidebarContent = () => (
        <>
            <div className="p-4 sm:p-6 border-b border-rule">
                <Link href={'/' + role + '/dashboard'} className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                    <div className="w-8 h-8 bg-teal rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-xs">OF</span>
                    </div>
                    <span className="font-serif text-xl tracking-tight text-ink">OneFlow</span>
                </Link>
            </div>

            <nav className="flex-1 p-4 overflow-y-auto font-sans">
                <div className="mb-6 px-3">
                    <div className="text-micro text-ink-3 uppercase tracking-widest">
                        {role.replace(/_/g, ' ')}
                    </div>
                </div>
                <div className="space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={'flex items-center gap-3 px-3 py-2.5 rounded-[7px] transition-all text-sm ' + (
                                    isActive
                                        ? 'bg-ink text-paper dark:bg-foreground dark:text-background font-medium'
                                        : 'text-ink-2 hover:bg-teal-soft/30 hover:text-ink'
                                )}
                            >
                                <item.icon className={'w-4 h-4 ' + (isActive ? 'text-teal' : 'text-ink-3')} />
                                <span>{item.name}</span>
                            </Link>
                        )
                    })}
                </div>
            </nav>

            <div className="p-4 border-t border-rule space-y-2 font-sans">
                <div className="flex items-center justify-between mb-2 px-3">
                    <Button variant="ghost" className="flex-1 justify-start mr-2 text-sm text-ink-2 hover:text-ink rounded-[7px]" asChild>
                        <Link href={'/' + role + '/dashboard/settings'} onClick={() => setMobileMenuOpen(false)}>
                            <Settings className="w-4 h-4 mr-3 text-ink-3" />
                            Settings
                        </Link>
                    </Button>
                    <ModeToggle />
                </div>
                <Button variant="ghost" className="w-full justify-start text-sm text-destructive hover:bg-destructive/5 rounded-[7px]" asChild>
                    <Link href="/api/auth/logout">
                        <LogOut className="w-4 h-4 mr-3" />
                        Logout
                    </Link>
                </Button>
            </div>
        </>
    )

    return (
        <div className="flex h-screen bg-background">
            {/* Mobile Sidebar */}
            {mobileMenuOpen && (
                <>
                    <div className="lg:hidden fixed inset-0 bg-ink/40 backdrop-blur-sm z-40" onClick={() => setMobileMenuOpen(false)} />
                    <aside className="lg:hidden fixed inset-y-0 left-0 w-64 bg-card/80 backdrop-blur-xl border-r border-rule flex flex-col z-40">
                        <SidebarContent />
                    </aside>
                </>
            )}

            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex w-64 bg-card/60 backdrop-blur-xl border-r border-rule flex flex-col shadow-none">
                <SidebarContent />
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>

            {/* Mobile Menu Toggle */}
            {!mobileMenuOpen && (
                <button
                    onClick={() => setMobileMenuOpen(true)}
                    className="lg:hidden fixed top-4 right-4 z-30 p-2 bg-card border border-rule rounded-lg"
                >
                    <Menu className="w-5 h-5" />
                </button>
            )}
        </div>
    )
}
