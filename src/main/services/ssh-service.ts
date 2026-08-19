import Store from 'electron-store'
import net from 'net'
import { app } from 'electron'
import { copyFile, mkdir, chmod, stat } from 'fs/promises'
import path from 'path'
import { exec } from 'child_process'
import type { SSHHost } from '../../shared/types'

const sshStore = new Store<{ hosts: SSHHost[] }>({
  name: 'clim-ssh-hosts',
  defaults: {
    hosts: []
  }
})

export class SSHService {
  /** Lấy danh sách máy chủ SSH đã lưu */
  static getHosts(): SSHHost[] {
    return sshStore.get('hosts', [])
  }

  /** Lưu hoặc cập nhật thông tin máy chủ SSH */
  static async saveHost(host: SSHHost): Promise<void> {
    const hosts = this.getHosts()
    const index = hosts.findIndex((h) => h.id === host.id)

    let updatedHost = { ...host }
    if (updatedHost.authType === 'privateKey' && updatedHost.privateKeyPath) {
      updatedHost.privateKeyPath = await this.securePrivateKey(updatedHost.privateKeyPath)
    }

    if (index >= 0) {
      hosts[index] = { ...updatedHost, updatedAt: Date.now() }
    } else {
      hosts.push({
        ...updatedHost,
        createdAt: updatedHost.createdAt || Date.now(),
        updatedAt: Date.now()
      })
    }

    sshStore.set('hosts', hosts)
  }

  /**
   * Lưu trữ Private Key an toàn trong thư mục ứng dụng (userData/ssh_keys)
   * và tự động thiết lập quyền hạn chế (chmod 600 / icacls) để OpenSSH không báo lỗi
   */
  static async securePrivateKey(rawPath: string): Promise<string> {
    try {
      if (!rawPath || !rawPath.trim()) return rawPath
      const cleanPath = rawPath.replace(/^"|"$/g, '').trim()

      const fileStats = await stat(cleanPath).catch(() => null)
      if (!fileStats) return cleanPath

      const keysDir = path.join(app.getPath('userData'), 'ssh_keys')
      await mkdir(keysDir, { recursive: true })

      let targetPath = cleanPath
      if (!cleanPath.startsWith(keysDir)) {
        const baseName = path.basename(cleanPath)
        targetPath = path.join(keysDir, `${Date.now()}_${baseName}`)
        await copyFile(cleanPath, targetPath)
      }

      // Thiết lập quyền hạn riêng tư để OpenSSH Windows / Linux không báo UNPROTECTED PRIVATE KEY FILE
      if (process.platform === 'win32') {
        const username = process.env.USERNAME || 'CURRENT_USER'
        await new Promise((res) => {
          exec(
            `icacls "${targetPath}" /inheritance:r /grant:r "${username}":(R,W)`,
            () => res(true)
          )
        })
      } else {
        await chmod(targetPath, 0o600)
      }

      return targetPath
    } catch {
      return rawPath
    }
  }

  /** Xóa máy chủ SSH */
  static deleteHost(id: string): void {
    const hosts = this.getHosts().filter((h) => h.id !== id)
    sshStore.set('hosts', hosts)
  }

  /** Kiểm tra kết nối TCP & độ trễ (latency ms) tới Host & Port */
  static testConnection(
    host: string,
    port: number,
    timeoutMs = 4000
  ): Promise<{ success: boolean; latencyMs?: number; error?: string }> {
    return new Promise((resolve) => {
      const startTime = Date.now()
      const socket = new net.Socket()

      socket.setTimeout(timeoutMs)

      socket.on('connect', () => {
        const latencyMs = Date.now() - startTime
        socket.destroy()
        resolve({ success: true, latencyMs })
      })

      socket.on('timeout', () => {
        socket.destroy()
        resolve({ success: false, error: `Hết thời gian chờ kết nối (${timeoutMs}ms)` })
      })

      socket.on('error', (err) => {
        socket.destroy()
        resolve({ success: false, error: err.message || 'Không thể kết nối đến máy chủ' })
      })

      try {
        socket.connect(port || 22, host)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Địa chỉ IP / Host không hợp lệ'
        resolve({ success: false, error: message })
      }
    })
  }

  /**
   * Tạo câu lệnh SSH hoàn chỉnh để chạy trong Terminal
   * Hỗ trợ Port, Private Key (-i), Tunnels (-L / -R)
   */
  static buildSSHCommand(host: SSHHost): string {
    const parts: string[] = ['ssh']

    // Cổng SSH nếu khác 22
    if (host.port && host.port !== 22) {
      parts.push(`-p ${host.port}`)
    }

    // Private key path
    if (host.authType === 'privateKey' && host.privateKeyPath) {
      // Escape path nếu có khoảng trắng
      const escapedKey = host.privateKeyPath.includes(' ')
        ? `"${host.privateKeyPath}"`
        : host.privateKeyPath
      parts.push(`-i ${escapedKey}`)
    }

    // Port Forwarding Tunnels
    if (host.tunnels && host.tunnels.length > 0) {
      for (const tunnel of host.tunnels) {
        if (tunnel.type === 'local') {
          parts.push(`-L ${tunnel.localPort}:${tunnel.remoteHost || 'localhost'}:${tunnel.remotePort}`)
        } else if (tunnel.type === 'remote') {
          parts.push(`-R ${tunnel.localPort}:${tunnel.remoteHost || 'localhost'}:${tunnel.remotePort}`)
        }
      }
    }

    // Username @ Host
    const userHost = host.username ? `${host.username}@${host.host}` : host.host
    parts.push(userHost)

    return parts.join(' ')
  }
}
