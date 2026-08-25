/**
 * CLIM License Key Generator & Verifier
 * Developed for TMT Team
 */

export interface LicensePayload {
  name: string
  plan: 'lifetime' | 'annual'
  issuedAt: string // YYYY-MM-DD
  expiresAt?: string // YYYY-MM-DD (nếu là annual)
  featureFlags?: string[]
}

export interface LicenseVerificationResult {
  valid: boolean
  isPro: boolean
  payload?: LicensePayload
  error?: string
}

// Master secret salt - Chỉ TMT Team và CLIM engine biết
const MASTER_SECRET = 'TMT_CLIM_EDITION_2026_PRO_SECURE_SALT'

/**
 * Thuật toán băm FNV-1a 64-bit kết hợp với Secret Salt để tạo chữ ký số offline
 */
function generateSignature(dataString: string): string {
  const combined = `${dataString}:${MASTER_SECRET}`
  let h1 = 0x811c9dc5
  let h2 = 0xcbf29ce4

  for (let i = 0; i < combined.length; i++) {
    const code = combined.charCodeAt(i)
    h1 = Math.imul(h1 ^ code, 0x01000193)
    h2 = Math.imul(h2 ^ (code * 31), 0x5bd1e995)
  }

  // Kết hợp thành chuỗi Hex 12 ký tự viết hoa
  const p1 = (h1 >>> 0).toString(16).padStart(8, '0').toUpperCase()
  const p2 = (h2 >>> 0).toString(16).slice(0, 4).padStart(4, '0').toUpperCase()
  return `${p1}${p2}`
}

/**
 * Chuyển đổi UTF-8 string thành Base64URL tương thích 100% cả Node.js và Browser
 */
function utf8ToBase64Url(str: string): string {
  try {
    if (typeof TextEncoder !== 'undefined' && typeof btoa !== 'undefined') {
      const bytes = new TextEncoder().encode(str)
      let binary = ''
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i])
      }
      return btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')
    }
  } catch {
    // fallback to Buffer if available
  }

  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'utf8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
  }

  return ''
}

/**
 * Giải mã Base64URL thành UTF-8 string
 */
function base64UrlToUtf8(base64Url: string): string {
  try {
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    while (base64.length % 4) {
      base64 += '='
    }

    if (typeof TextDecoder !== 'undefined' && typeof atob !== 'undefined') {
      const binary = atob(base64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
      }
      return new TextDecoder().decode(bytes)
    }

    if (typeof Buffer !== 'undefined') {
      return Buffer.from(base64, 'base64').toString('utf8')
    }
  } catch {
    return ''
  }

  return ''
}

/**
 * Chuyển đổi payload thành chuỗi Base64URL gọn gàng
 */
function encodePayload(payload: LicensePayload): string {
  const json = JSON.stringify({
    n: payload.name,
    p: payload.plan === 'lifetime' ? 'L' : 'A',
    i: payload.issuedAt,
    e: payload.expiresAt || ''
  })
  
  return utf8ToBase64Url(json)
}

/**
 * Giải mã chuỗi payload
 */
function decodePayload(encoded: string): LicensePayload | null {
  try {
    const jsonStr = base64UrlToUtf8(encoded)
    if (!jsonStr) return null

    const obj = JSON.parse(jsonStr)
    return {
      name: obj.n || 'User',
      plan: obj.p === 'L' ? 'lifetime' : 'annual',
      issuedAt: obj.i || new Date().toISOString().split('T')[0],
      expiresAt: obj.e || undefined
    }
  } catch {
    return null
  }
}

/**
 * Sinh chuỗi License Key hoàn chỉnh dạng:
 * CLIM-PRO-[PAYLOAD]-[SIGNATURE]
 */
export function generateLicenseKey(payload: LicensePayload): string {
  const encodedPayload = encodePayload(payload)
  const signature = generateSignature(encodedPayload)
  return `CLIM-PRO-${encodedPayload}-${signature}`
}

/**
 * Kiểm tra tính hợp lệ của License Key
 */
export function verifyLicenseKey(rawKey: string | null | undefined): LicenseVerificationResult {
  if (!rawKey || typeof rawKey !== 'string') {
    return { valid: false, isPro: false, error: 'Chưa nhập mã bản quyền' }
  }

  const cleanKey = rawKey.trim()
  if (!cleanKey.startsWith('CLIM-PRO-')) {
    return { valid: false, isPro: false, error: 'Định dạng mã bản quyền không đúng (phải bắt đầu bằng CLIM-PRO-)' }
  }

  const parts = cleanKey.split('-')
  if (parts.length < 4) {
    return { valid: false, isPro: false, error: 'Mã bản quyền bị thiếu thông tin hoặc sai cấu trúc' }
  }

  // Tách payload và signature
  const signature = parts[parts.length - 1]
  const encodedPayload = parts.slice(2, parts.length - 1).join('-')

  // Kiểm tra chữ ký bảo mật
  const expectedSig = generateSignature(encodedPayload)
  if (signature.toUpperCase() !== expectedSig.toUpperCase()) {
    return { valid: false, isPro: false, error: 'Mã bản quyền không hợp lệ hoặc đã bị chỉnh sửa' }
  }

  // Giải mã dữ liệu
  const payload = decodePayload(encodedPayload)
  if (!payload) {
    return { valid: false, isPro: false, error: 'Không thể giải mã dữ liệu bản quyền' }
  }

  // Kiểm tra ngày hết hạn nếu là gói có thời hạn
  if (payload.plan === 'annual' && payload.expiresAt) {
    const today = new Date().toISOString().split('T')[0]
    if (today > payload.expiresAt) {
      return {
        valid: false,
        isPro: false,
        payload,
        error: `Bản quyền đã hết hạn vào ngày ${payload.expiresAt}`
      }
    }
  }

  return {
    valid: true,
    isPro: true,
    payload
  }
}
