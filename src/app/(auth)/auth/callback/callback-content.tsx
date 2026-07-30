'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/appwrite/client'
import { Loader2 } from 'lucide-react'

export default function AuthCallbackContent() {
    const router = useRouter()
    const searchParams = useSearchParams()

    useEffect(() => {
        const handleCallback = async () => {
            const { account } = createClient()

            const type = searchParams.get('type')
            const userId = searchParams.get('userId')
            const secret = searchParams.get('secret')

            // Handle Appwrite recovery flow
            if (type === 'recovery' && userId && secret) {
                try {
                    // Complete the recovery by updating the password
                    // The user will be redirected to update-password page
                    router.push(`/update-password?userId=${userId}&secret=${secret}`)
                    return
                } catch (err) {
                    console.error('Error processing recovery:', err)
                    router.push('/login?error=recovery_failed')
                    return
                }
            }

            // Handle OAuth2 or other flows
            // Appwrite OAuth redirects back with a token in URL params
            const sessionToken = searchParams.get('sessionToken')
            if (sessionToken) {
                router.push('/dashboard')
                return
            }

            // No valid auth params, redirect to login
            console.log('No valid auth parameters found')
            router.push('/login')
        }

        handleCallback()
    }, [router, searchParams])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-gray-600">Processando recuperação de senha...</p>
            </div>
        </div>
    )
}
