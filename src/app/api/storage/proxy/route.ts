import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/appwrite/server'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('fileId')
    const bucketId = searchParams.get('bucket') || 'comprovantes'
    if (!fileId) {
        return new NextResponse('Missing fileId parameter', { status: 400 })
    }

    const download = searchParams.get('download') === '1'

    try {
        const { storage } = createAdminClient()

        // Get file metadata
        const file = await storage.getFile(bucketId, fileId)

        const ext = file.name.split('.').pop()?.toLowerCase() || ''
        const mimeTypes: Record<string, string> = {
            pdf: 'application/pdf',
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            png: 'image/png',
            gif: 'image/gif',
            webp: 'image/webp',
        }
        const contentType = mimeTypes[ext] || file.mimeType || 'application/octet-stream'

        const headers: Record<string, string> = {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=300',
        }

        if (download) {
            headers['Content-Disposition'] = `attachment; filename="${file.name}"`
        }

        // Get file and stream it through
        const appwriteEndpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!
        const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!
        const url = `${appwriteEndpoint}/storage/buckets/${bucketId}/files/${fileId}/download?project=${projectId}`

        const response = await fetch(url, {
            headers: {
                'X-Appwrite-Project': projectId,
                'X-Appwrite-Key': process.env.APPWRITE_API_KEY!,
            },
        })

        if (!response.ok) {
            console.error('[storage-proxy] Appwrite download error:', response.status)
            return new NextResponse('File not found', { status: 404 })
        }

        const blob = await response.arrayBuffer()
        return new NextResponse(blob, { headers })
    } catch (err) {
        console.error('[storage-proxy] Error:', err)
        return new NextResponse('Internal server error', { status: 500 })
    }
}
