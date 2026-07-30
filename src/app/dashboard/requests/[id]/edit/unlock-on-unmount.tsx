'use client'

import { useEffect } from 'react'
import { unlockRequest } from '../../actions'

export function UnlockOnUnmount({ requestId }: { requestId: string }) {
    useEffect(() => {
        return () => {
            unlockRequest(requestId)
        }
    }, [requestId])

    return null
}

