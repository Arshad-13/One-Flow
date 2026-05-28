/**
 * /dashboard layout — kept as a thin shell.
 * The middleware (src/middleware.js) intercepts all /dashboard/* requests
 * and redirects them to the correct /{role}/dashboard path.
 * This layout only renders briefly before the middleware redirect fires.
 */
import { Loader2 } from 'lucide-react'

export default function DashboardRedirectLayout({ children }) {
    return (
        <div className="flex h-screen items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Redirecting to your dashboard...</p>
            </div>
        </div>
    )
}
