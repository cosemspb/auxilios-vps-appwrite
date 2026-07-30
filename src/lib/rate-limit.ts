interface RateLimitEntry {
    count: number
    resetAt: number
}

const store = new Map<string, RateLimitEntry>()
const CLEANUP_INTERVAL = 60_000
const WINDOW_MS = 60_000

setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store) {
        if (entry.resetAt < now) store.delete(key)
    }
}, CLEANUP_INTERVAL)

export interface RateLimitConfig {
    maxRequests: number
    windowMs?: number
}

export function checkRateLimit(key: string, config: RateLimitConfig): { allowed: boolean; remaining: number; resetAt: number } {
    const windowMs = config.windowMs ?? WINDOW_MS
    const now = Date.now()
    const entry = store.get(key)

    if (!entry || entry.resetAt < now) {
        store.set(key, { count: 1, resetAt: now + windowMs })
        return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + windowMs }
    }

    entry.count++
    const remaining = Math.max(0, config.maxRequests - entry.count)
    return { allowed: entry.count <= config.maxRequests, remaining, resetAt: entry.resetAt }
}

export function getRateLimitKey(identifier: string, action: string): string {
    return `${identifier}:${action}`
}
