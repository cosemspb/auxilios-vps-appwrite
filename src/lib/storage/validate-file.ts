const ALLOWED_TYPES = {
  avatar: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  comprovante: ['image/jpeg', 'image/png', 'application/pdf'],
} as const

const MAX_SIZES = {
  avatar: 2 * 1024 * 1024,
  comprovante: 10 * 1024 * 1024,
} as const

export type FileCategory = keyof typeof ALLOWED_TYPES

export interface FileValidationError {
  code: 'INVALID_TYPE' | 'FILE_TOO_LARGE' | 'INVALID_EXTENSION'
  message: string
}

function getExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? ''
}

const EXTENSION_MAP: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  pdf: 'application/pdf',
}

export function validateFile(
  file: File,
  category: FileCategory
): FileValidationError | null {
  const allowedMimes = ALLOWED_TYPES[category]
  const maxSize = MAX_SIZES[category]

  if (file.size > maxSize) {
    const sizeMB = maxSize / (1024 * 1024)
    return {
      code: 'FILE_TOO_LARGE',
      message: `Arquivo muito grande. O tamanho máximo é ${sizeMB}MB.`,
    }
  }

  const ext = getExtension(file.name)
  const expectedMime = EXTENSION_MAP[ext]

  if (!expectedMime || !(allowedMimes as readonly string[]).includes(expectedMime)) {
    const extensions = allowedMimes
      .map((m) => EXTENSION_MAP[m.replace('image/', '')] || m.split('/')[1])
      .join(', ')
    return {
      code: 'INVALID_EXTENSION',
      message: `Tipo de arquivo não permitido. Use: ${extensions.toUpperCase()}`,
    }
  }

  if (!(allowedMimes as readonly string[]).includes(file.type) && file.type !== '') {
    return {
      code: 'INVALID_TYPE',
      message: 'Tipo MIME do arquivo não corresponde à extensão.',
    }
  }

  return null
}

export function validateFileSize(size: number, category: FileCategory): FileValidationError | null {
  const maxSize = MAX_SIZES[category]
  if (size > maxSize) {
    const sizeMB = maxSize / (1024 * 1024)
    return {
      code: 'FILE_TOO_LARGE',
      message: `Arquivo muito grande. O tamanho máximo é ${sizeMB}MB.`,
    }
  }
  return null
}
