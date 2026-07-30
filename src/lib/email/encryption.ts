import { randomBytes, createCipheriv, createDecipheriv, scryptSync, createHash } from 'crypto'

const ALGORITHM = 'aes-256-cbc'
const IV_LENGTH = 16
const KEY_LENGTH = 32
const SALT_LENGTH = 16
const SALTED_PREFIX = 'Salted__'

function getEncryptionKey(): string {
    const key = process.env.SMTP_ENCRYPTION_KEY ?? ''
    if (!key) throw new Error('SMTP_ENCRYPTION_KEY não configurada. Defina esta variável de ambiente.')
    return key
}

/**
 * AES-256-CBC com scrypt key derivation e IV aleatório (novo formato)
 * Formato: <salt_hex>:<iv_hex>:<ciphertext_hex>
 */
export function encryptPassword(password: string): string {
    const passphrase = getEncryptionKey()
    const salt = randomBytes(SALT_LENGTH)
    const key = scryptSync(passphrase, salt, KEY_LENGTH)
    const iv = randomBytes(IV_LENGTH)
    const cipher = createCipheriv(ALGORITHM, key, iv)
    const encrypted = Buffer.concat([cipher.update(password, 'utf8'), cipher.final()])
    return salt.toString('hex') + ':' + iv.toString('hex') + ':' + encrypted.toString('hex')
}

/**
 * Deriva key+IV no formato usado pelo CryptoJS (EVP_BytesToKey)
 * para compatibilidade com senhas criptografadas antes da migração
 */
function evpBytesToKey(password: string, salt: Buffer): { key: Buffer; iv: Buffer } {
    let derived = Buffer.alloc(0)
    let prev: Buffer | null = null
    while (derived.length < KEY_LENGTH + IV_LENGTH) {
        const toHash: Buffer[] = prev ? [prev, Buffer.from(password), salt] : [Buffer.from(password), salt]
        prev = createHash('md5').update(Buffer.concat(toHash)).digest()
        derived = Buffer.concat([derived, prev])
    }
    return { key: derived.subarray(0, KEY_LENGTH), iv: derived.subarray(KEY_LENGTH, KEY_LENGTH + IV_LENGTH) }
}

/**
 * Descriptografa senha. Tenta novo formato (salt:iv:ciphertext hex) primeiro;
 * se falhar, tenta formato legado do CryptoJS (base64 com prefixo Salted__).
 */
export function decryptPassword(encryptedPassword: string): string {
    const parts = encryptedPassword.split(':')

    if (parts.length === 3) {
        const salt = Buffer.from(parts[0], 'hex')
        const iv = Buffer.from(parts[1], 'hex')
        const encrypted = Buffer.from(parts[2], 'hex')
        if (salt.length === SALT_LENGTH && iv.length === IV_LENGTH && encrypted.length > 0) {
            try {
                const key = scryptSync(getEncryptionKey(), salt, KEY_LENGTH)
                const decipher = createDecipheriv(ALGORITHM, key, iv)
                return decipher.update(encrypted) + decipher.final('utf8')
            } catch {
                // fallback: tentar formato legado
            }
        }
    }

    const fullBuffer = Buffer.from(encryptedPassword, 'base64')
    if (fullBuffer.length < 16) throw new Error('Formato de senha criptografada inválido')
    const prefix = fullBuffer.subarray(0, 8).toString()
    if (prefix !== SALTED_PREFIX) throw new Error('Formato de senha criptografada não reconhecido')
    const salt = fullBuffer.subarray(8, 16)
    const ciphertext = fullBuffer.subarray(16)
    const { key, iv } = evpBytesToKey(getEncryptionKey(), salt)
    const decipher = createDecipheriv(ALGORITHM, key, iv)
    return decipher.update(ciphertext) + decipher.final('utf8')
}

/**
 * Mascara a senha para exibição (mostra apenas os primeiros 3 caracteres)
 */
export function maskPassword(password: string): string {
    if (!password || password.length < 3) return '***'
    return password.substring(0, 3) + '*'.repeat(password.length - 3)
}