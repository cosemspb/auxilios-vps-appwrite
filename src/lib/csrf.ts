import { randomBytes } from 'crypto'
import { cookies } from 'next/headers'

const CSRF_COOKIE_NAME = 'csrf_token'
const TOKEN_LENGTH = 32

export function generateCsrfToken(): string {
    return randomBytes(TOKEN_LENGTH).toString('hex')
}

export async function getCsrfCookie(): Promise<string | undefined> {
    const cookieStore = await cookies()
    return cookieStore.get(CSRF_COOKIE_NAME)?.value
}

export async function setCsrfCookie(): Promise<string> {
    const token = generateCsrfToken()
    const cookieStore = await cookies()
    cookieStore.set(CSRF_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60,
    })
    return token
}

export async function validateCsrfToken(token: string): Promise<boolean> {
    const stored = await getCsrfCookie()
    if (!stored || !token) return false
    return stored === token
}
