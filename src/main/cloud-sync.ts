import https from 'https'
import crypto from 'crypto'
import Store from 'electron-store'
import type { CloudSyncConfig, EncryptedBackupEnvelope, FullBackupPayload } from '../shared/types'

/**
 * CloudSyncManager
 * Quản lý đồng bộ sao lưu đám mây với GitHub Gist và Mã hóa đầu cuối (E2EE)
 */
export class CloudSyncManager {
  private store: Store<{ config: CloudSyncConfig }>

  constructor() {
    this.store = new Store<{ config: CloudSyncConfig }>({
      name: 'clim-cloud-sync',
      defaults: {
        config: {
          githubToken: '',
          gistId: '',
          lastSyncedAt: 0,
          encrypted: false,
          autoSync: false
        }
      }
    })
  }

  public getConfig(): CloudSyncConfig {
    return this.store.get('config') || {}
  }

  public saveConfig(config: CloudSyncConfig): void {
    const current = this.getConfig()
    this.store.set('config', { ...current, ...config })
  }

  /**
   * Mã hóa AES-256-GCM với mật khẩu qua PBKDF2
   */
  public encryptPayload(data: object, password: string): EncryptedBackupEnvelope {
    const salt = crypto.randomBytes(16)
    // Derive key 32 bytes qua PBKDF2 với 100,000 iterations
    const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256')
    const iv = crypto.randomBytes(12)

    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
    const jsonString = JSON.stringify(data)
    let encrypted = cipher.update(jsonString, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    const authTag = cipher.getAuthTag()

    return {
      isEncrypted: true,
      version: '1.0',
      salt: salt.toString('hex'),
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      ciphertext: encrypted,
      createdAt: new Date().toISOString()
    }
  }

  /**
   * Giải mã AES-256-GCM từ EncryptedBackupEnvelope
   */
  public decryptPayload<T = any>(envelope: EncryptedBackupEnvelope, password: string): T {
    try {
      const salt = Buffer.from(envelope.salt, 'hex')
      const iv = Buffer.from(envelope.iv, 'hex')
      const authTag = Buffer.from(envelope.authTag, 'hex')
      const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256')

      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
      decipher.setAuthTag(authTag)

      let decrypted = decipher.update(envelope.ciphertext, 'hex', 'utf8')
      decrypted += decipher.final('utf8')

      return JSON.parse(decrypted)
    } catch {
      throw new Error('Mật khẩu giải mã không chính xác hoặc dữ liệu sao lưu bị hỏng.')
    }
  }

  /**
   * Gửi HTTP/HTTPS request tới GitHub API
   */
  private githubRequest<T = any>(
    path: string,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    token: string,
    body?: object
  ): Promise<{ status: number; data: T }> {
    return new Promise((resolve, reject) => {
      const payloadString = body ? JSON.stringify(body) : undefined
      const headers: Record<string, string | number> = {
        'User-Agent': 'CLIM-Desktop-App',
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token.trim()}`,
        'X-GitHub-Api-Version': '2022-11-28'
      }

      if (payloadString) {
        headers['Content-Type'] = 'application/json'
        headers['Content-Length'] = Buffer.byteLength(payloadString)
      }

      const req = https.request(
        {
          hostname: 'api.github.com',
          path,
          method,
          headers
        },
        (res) => {
          let rawData = ''
          res.setEncoding('utf8')
          res.on('data', (chunk) => {
            rawData += chunk
          })
          res.on('end', () => {
            try {
              const parsed = rawData ? JSON.parse(rawData) : {}
              resolve({ status: res.statusCode || 200, data: parsed })
            } catch {
              resolve({ status: res.statusCode || 200, data: rawData as any })
            }
          })
        }
      )

      req.on('error', (err) => {
        reject(err)
      })

      if (payloadString) {
        req.write(payloadString)
      }
      req.end()
    })
  }

  /**
   * Kiểm tra tính hợp lệ của GitHub Token
   */
  public async testToken(token: string): Promise<{ success: boolean; username?: string; error?: string }> {
    if (!token || !token.trim()) {
      return { success: false, error: 'Chưa nhập GitHub Personal Access Token' }
    }

    try {
      const res = await this.githubRequest<{ login: string; message?: string }>('/user', 'GET', token)
      if (res.status === 200 && res.data.login) {
        return { success: true, username: res.data.login }
      }
      return { success: false, error: res.data.message || `Mã lỗi HTTP: ${res.status}` }
    } catch (err: any) {
      return { success: false, error: err.message || 'Không thể kết nối tới GitHub API' }
    }
  }

  /**
   * Tải toàn bộ cấu hình lên GitHub Gist
   */
  public async uploadToGist(
    payload: FullBackupPayload,
    options: { token: string; gistId?: string; password?: string; isPublic?: boolean }
  ): Promise<{ success: boolean; gistId: string; htmlUrl: string; lastSyncedAt: number; error?: string }> {
    const { token, gistId, password, isPublic = false } = options

    if (!token || !token.trim()) {
      return { success: false, gistId: '', htmlUrl: '', lastSyncedAt: 0, error: 'Chưa nhập GitHub Token' }
    }

    try {
      let fileName = 'clim_backup.json'
      let fileContent = ''
      let isEncrypted = false

      if (password && password.trim()) {
        const envelope = this.encryptPayload(payload, password.trim())
        fileName = 'clim_backup_encrypted.json'
        fileContent = JSON.stringify(envelope, null, 2)
        isEncrypted = true
      } else {
        fileContent = JSON.stringify(payload, null, 2)
      }

      const requestBody = {
        description: `CLIM Desktop Backup [${isEncrypted ? 'Encrypted E2EE' : 'Standard'}] - ${new Date().toISOString()}`,
        public: isPublic,
        files: {
          [fileName]: {
            content: fileContent
          }
        }
      }

      let res: { status: number; data: any }

      if (gistId && gistId.trim()) {
        // Cập nhật Gist hiện có
        res = await this.githubRequest(`/gists/${gistId.trim()}`, 'PATCH', token, requestBody)
      } else {
        // Tạo Gist mới
        res = await this.githubRequest('/gists', 'POST', token, requestBody)
      }

      if (res.status === 200 || res.status === 201) {
        const savedGistId = res.data.id || gistId
        const htmlUrl = res.data.html_url || `https://gist.github.com/${savedGistId}`
        const now = Date.now()

        // Lưu cấu hình
        this.saveConfig({
          githubToken: token,
          gistId: savedGistId,
          lastSyncedAt: now,
          encrypted: isEncrypted
        })

        return {
          success: true,
          gistId: savedGistId,
          htmlUrl,
          lastSyncedAt: now
        }
      }

      return {
        success: false,
        gistId: '',
        htmlUrl: '',
        lastSyncedAt: 0,
        error: res.data.message || `Lỗi từ GitHub API (Status: ${res.status})`
      }
    } catch (err: any) {
      return {
        success: false,
        gistId: '',
        htmlUrl: '',
        lastSyncedAt: 0,
        error: err.message || 'Lỗi khi tải dữ liệu lên GitHub Gist'
      }
    }
  }

  /**
   * Tải cấu hình từ GitHub Gist về và giải mã nếu cần
   */
  public async downloadFromGist(options: {
    token: string
    gistId: string
    password?: string
  }): Promise<{ success: boolean; payload?: FullBackupPayload; isEncrypted?: boolean; error?: string }> {
    const { token, gistId, password } = options

    if (!token || !token.trim()) {
      return { success: false, error: 'Chưa nhập GitHub Token' }
    }
    if (!gistId || !gistId.trim()) {
      return { success: false, error: 'Chưa nhập Gist ID' }
    }

    try {
      const res = await this.githubRequest<any>(`/gists/${gistId.trim()}`, 'GET', token)

      if (res.status !== 200 || !res.data.files) {
        return { success: false, error: res.data.message || `Không tìm thấy Gist với ID: ${gistId}` }
      }

      const files = res.data.files
      // Tìm file backup trong gist
      let targetFile = files['clim_backup_encrypted.json'] || files['clim_backup.json']

      if (!targetFile) {
        // Lấy file json đầu tiên nếu không khớp tên chuẩn
        const firstKey = Object.keys(files).find((k) => k.endsWith('.json'))
        if (firstKey) {
          targetFile = files[firstKey]
        }
      }

      if (!targetFile || !targetFile.content) {
        return { success: false, error: 'Gist không chứa tệp dữ liệu sao lưu CLIM hợp lệ' }
      }

      const parsedContent = JSON.parse(targetFile.content)

      // Kiểm tra nếu là file đã mã hóa E2EE
      if (parsedContent && parsedContent.isEncrypted === true) {
        if (!password || !password.trim()) {
          return {
            success: false,
            isEncrypted: true,
            error: 'Tệp sao lưu này được mã hóa đầu cuối (E2EE). Vui lòng nhập Master Password để mở khóa.'
          }
        }

        try {
          const decryptedPayload = this.decryptPayload<FullBackupPayload>(parsedContent, password.trim())
          return { success: true, payload: decryptedPayload, isEncrypted: true }
        } catch (err: any) {
          return { success: false, isEncrypted: true, error: err.message }
        }
      }

      // File JSON không mã hóa
      return { success: true, payload: parsedContent, isEncrypted: false }
    } catch (err: any) {
      return { success: false, error: err.message || 'Lỗi khi tải dữ liệu từ GitHub Gist' }
    }
  }
}

export const cloudSyncManager = new CloudSyncManager()
