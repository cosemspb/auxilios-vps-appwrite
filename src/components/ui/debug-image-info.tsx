'use client'

import { useEffect } from 'react'

export function DebugImageInfo({ images }: { images: { base64: string }[] }) {
    useEffect(() => {
        if (!images || images.length === 0) {
            console.warn('[DebugImageInfo] No images — check getAccountabilityImages query / signed URLs')
            return
        }
        const totalBytes = images.reduce((sum, img) => sum + img.base64.length, 0)
        const totalMB = (totalBytes / (1024 * 1024)).toFixed(2)
        console.log(`[DebugImageInfo] ${images.length} image(s) found, total ~${totalMB} MB`)
        images.forEach((img, i) => {
            const sizeKB = (img.base64.length / 1024).toFixed(1)
            const prefix = img.base64.substring(0, 60)
            console.log(`  [${i}] ${sizeKB} KB, starts with: ${prefix}...`)
        })
    }, [images])
    return null
}
