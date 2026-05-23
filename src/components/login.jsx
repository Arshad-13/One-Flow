"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogoIcon } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

const demoAccounts = [
    {
        role: 'Admin',
        companyId: 'ONEFLOW001',
        email: 'admin@oneflow.com',
        password: 'admin123',
        description: 'Full access to all administration and setup screens'
    },
    {
        role: 'Project Manager',
        companyId: 'ONEFLOW001',
        email: 'pm@oneflow.com',
        password: 'pm123',
        description: 'Manage projects, tasks, and team assignments'
    },
    {
        role: 'Team Member',
        companyId: 'ONEFLOW001',
        email: 'dev1@oneflow.com',
        password: 'dev123',
        description: 'Track work, tasks, and timesheets'
    },
    {
        role: 'Sales & Finance',
        companyId: 'ONEFLOW001',
        email: 'sales@oneflow.com',
        password: 'sales123',
        description: 'Handle orders, billing, and finance workflows'
    }
]

export default function LoginComponent() {
    const [companyId, setCompanyId] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()

    const fillDemoAccount = (account) => {
        setCompanyId(account.companyId)
        setEmail(account.email)
        setPassword(account.password)
        setError('')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ companyId, email, password }),
                credentials: 'include'
            })

            const data = await res.json()
            if (!res.ok) {
                setError(data.error || 'Login failed')
                setLoading(false)
                return
            }

            // Cookie is set by backend - no need for localStorage
            // Fetch user role and redirect to role-based dashboard
            const meRes = await fetch('/api/auth/me', { credentials: 'include' })
            if (meRes.ok) {
                const userData = await meRes.json()
                const role = userData.role || 'team_member'
                router.push(`/${role}/dashboard`)
            } else {
                // Fallback to generic dashboard
                router.push('/dashboard')
            }
        } catch (err) {
            setError('Network error')
            setLoading(false)
        }
    }

    return (
        <section
            className="flex min-h-screen bg-zinc-50 px-4 py-16 md:py-32 dark:bg-transparent">
            <div className="m-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <form
                onSubmit={handleSubmit}
                className="bg-card h-fit w-full rounded-[calc(var(--radius)+.125rem)] border p-0.5 shadow-md dark:[--color-muted:var(--color-zinc-900)]">
                <div className="p-8 pb-6">
                    <div>
                        <Link href="/" aria-label="go home">
                            <LogoIcon />
                        </Link>
                        <h1 className="mb-1 mt-4 text-xl font-semibold">Sign In to OneFlow</h1>
                        <p className="text-sm">Welcome back! Sign in to continue</p>
                    </div>


                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="companyId" className="block text-sm">
                                Company ID
                            </Label>
                            <Input type="text" required name="companyId" id="companyId" value={companyId} onChange={(e) => setCompanyId(e.target.value)} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="block text-sm">
                                Email
                            </Label>
                            <Input type="email" required name="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="pwd" className="text-sm">
                                Password
                            </Label>
                            <Input
                                type="password"
                                required
                                name="pwd"
                                id="pwd"
                                className="input sz-md variant-mixed"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)} />
                        </div>

                        <Button className="w-full" type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</Button>
                        {error && <p className="text-sm text-red-500">{error}</p>}
                    </div>
                </div>

                <div className="bg-muted rounded-(--radius) border p-3">
                    <p className="text-accent-foreground text-center text-sm">
                        Don&apos;t have an account ?
                        <Button asChild variant="link" className="px-2">
                            <Link href="/register">Create account</Link>
                        </Button>
                    </p>
                </div>
            </form>

            <aside className="bg-card h-fit rounded-[calc(var(--radius)+.125rem)] border p-0.5 shadow-md dark:[--color-muted:var(--color-zinc-900)]">
                <div className="p-8">
                    <div className="mb-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Test credentials</p>
                        <h2 className="mt-2 text-2xl font-semibold">Use a seeded account</h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                            These accounts are preloaded for demos and production previews. Click any card to fill the login form instantly.
                        </p>
                    </div>

                    <div className="space-y-3">
                        {demoAccounts.map((account) => (
                            <button
                                key={account.role}
                                type="button"
                                onClick={() => fillDemoAccount(account)}
                                className="group w-full rounded-xl border border-border/70 bg-muted/30 p-4 text-left transition-colors hover:border-primary/50 hover:bg-muted/60"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold">{account.role}</p>
                                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">ONEFLOW001</span>
                                        </div>
                                        <p className="mt-1 text-sm text-muted-foreground">{account.description}</p>
                                    </div>
                                    <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground/80 group-hover:border-primary/40">Use</span>
                                </div>

                                <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                                    <div className="rounded-lg bg-background px-3 py-2">
                                        <span className="block text-[11px] uppercase tracking-wide text-muted-foreground">Email</span>
                                        <span className="block truncate font-medium">{account.email}</span>
                                    </div>
                                    <div className="rounded-lg bg-background px-3 py-2">
                                        <span className="block text-[11px] uppercase tracking-wide text-muted-foreground">Password</span>
                                        <span className="block font-medium">{account.password}</span>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </aside>
            </div>
        </section>
    );
}
