export const SESSION_COOKIE_NAME = `a_session_${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || ''}`

export function getSessionCookieName() {
    return SESSION_COOKIE_NAME
}
