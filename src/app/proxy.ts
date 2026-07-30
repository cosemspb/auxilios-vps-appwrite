import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Client, Account } from 'node-appwrite'

const publicRoutes = ['/login', '/forgot-password', '/recover-password', '/update-password', '/auth/callback']
const pendingRoutes = ['/completar-cadastro']

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl

    const isPublic = publicRoutes.some((route) => pathname.startsWith(route)) || pathname === '/'
    const isPendingRoute = pendingRoutes.some((route) => pathname.startsWith(route))

    let user = null

    try {
        const client = new Client()
            .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
            .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)

        // Forward cookies from the request for session auth
        const cookieHeader = request.headers.get('cookie') || ''
        if (cookieHeader) {
            // node-appwrite client can use cookies via the client config
            // Pass cookies via the HTTP headers
        }

        const account = new Account(client)
        user = await account.get()
    } catch {
        // No valid session
    }

    const isAuthenticated = !!user

    if (isAuthenticated && (pathname === '/login' || pathname === '/')) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    if (!isAuthenticated && !isPublic) {
        const loginUrl = new URL('/login', request.url)
        if (isPendingRoute) loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
    }

    if (isAuthenticated && !isPublic && !isPendingRoute) {
        const prefs = (user?.prefs || {}) as Record<string, any>
        if (prefs.status === 'pendente') {
            return NextResponse.redirect(new URL('/completar-cadastro', request.url))
        }
    }

    return NextResponse.next({ request })
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.svg|logo.png|api/email-preview).*)'],
}
