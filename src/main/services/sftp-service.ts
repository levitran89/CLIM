import { exec } from 'child_process'
import { SSHService } from './ssh-service'
import type { SFTPItem, SSHHost } from '../../shared/types'

export class SFTPService {
  private getHost(hostId: string): SSHHost | undefined {
    return SSHService.getHosts().find((h) => h.id === hostId)
  }

  private buildSSHExecPrefix(host: SSHHost): string {
    const parts = ['ssh', '-o BatchMode=yes', '-o StrictHostKeyChecking=no', '-o ConnectTimeout=5']
    if (host.port && host.port !== 22) {
      parts.push(`-p ${host.port}`)
    }
    if (host.authType === 'privateKey' && host.privateKeyPath) {
      const escapedKey = host.privateKeyPath.includes(' ')
        ? `"${host.privateKeyPath}"`
        : host.privateKeyPath
      parts.push(`-i ${escapedKey}`)
    }
    const userHost = host.username ? `${host.username}@${host.host}` : host.host
    parts.push(userHost)
    return parts.join(' ')
  }

  /**
   * Liệt kê danh sách tệp & thư mục từ xa
   */
  public async listDirectory(
    hostId: string,
    remotePath = '.'
  ): Promise<{ success: boolean; items: SFTPItem[]; currentPath: string; error?: string }> {
    const host = this.getHost(hostId)
    if (!host) return { success: false, items: [], currentPath: remotePath, error: 'Không tìm thấy thông tin máy chủ SSH.' }

    const targetDir = remotePath.trim() || '.'
    const sshPrefix = this.buildSSHExecPrefix(host)
    // Run bash script on remote to get pwd and structured file listing
    const remoteCmd = `cd "${targetDir}" && pwd && ls -la --time-style=+%s 2>/dev/null || ls -la`
    const fullCmd = `${sshPrefix} "${remoteCmd}"`

    return new Promise((resolve) => {
      exec(fullCmd, { timeout: 10000 }, (error, stdout, stderr) => {
        if (error) {
          resolve({
            success: false,
            items: [],
            currentPath: targetDir,
            error: stderr || error.message || 'Không thể kết nối hoặc đọc thư mục máy chủ.'
          })
          return
        }

        try {
          const lines = stdout.split('\n').filter(Boolean)
          const currentPath = lines[0] || targetDir
          const rawItems = lines.slice(1)

          const items: SFTPItem[] = []
          for (const line of rawItems) {
            // Regex for standard ls -la: permissions links owner group size timestamp name
            const parts = line.trim().split(/\s+/)
            if (parts.length < 8 || parts[0].startsWith('total')) continue

            const permissions = parts[0]
            const isDir = permissions.startsWith('d')
            const isSymlink = permissions.startsWith('l')
            const size = parseInt(parts[4], 10) || 0
            
            // Reconstruct filename (might contain spaces)
            const name = parts.slice(6).join(' ')
            if (name === '.' || name === '..') continue

            const type: SFTPItem['type'] = isDir ? 'directory' : isSymlink ? 'symlink' : 'file'
            const fullItemPath = currentPath === '/' ? `/${name}` : `${currentPath}/${name}`

            items.push({
              name,
              path: fullItemPath,
              type,
              size,
              modifyTime: Date.now(),
              permissions
            })
          }

          // Sort: Directories first, then alphabetical
          items.sort((a, b) => {
            if (a.type === 'directory' && b.type !== 'directory') return -1
            if (a.type !== 'directory' && b.type === 'directory') return 1
            return a.name.localeCompare(b.name)
          })

          resolve({ success: true, items, currentPath })
        } catch (e: any) {
          resolve({ success: false, items: [], currentPath: targetDir, error: e.message })
        }
      })
    })
  }

  /**
   * Đọc nội dung tệp văn bản từ xa
   */
  public async readFile(
    hostId: string,
    remotePath: string
  ): Promise<{ success: boolean; content: string; isBinary?: boolean; error?: string }> {
    const host = this.getHost(hostId)
    if (!host) return { success: false, content: '', error: 'Không tìm thấy máy chủ.' }

    const sshPrefix = this.buildSSHExecPrefix(host)
    const fullCmd = `${sshPrefix} "head -c 2000000 '${remotePath}'"`

    return new Promise((resolve) => {
      exec(fullCmd, { timeout: 12000, maxBuffer: 1024 * 1024 * 5 }, (error, stdout, stderr) => {
        if (error) {
          resolve({ success: false, content: '', error: stderr || error.message })
        } else {
          resolve({ success: true, content: stdout })
        }
      })
    })
  }

  /**
   * Ghi nội dung tệp lên máy chủ từ xa
   */
  public async writeFile(
    hostId: string,
    remotePath: string,
    content: string
  ): Promise<{ success: boolean; error?: string }> {
    const host = this.getHost(hostId)
    if (!host) return { success: false, error: 'Không tìm thấy máy chủ.' }

    const sshPrefix = this.buildSSHExecPrefix(host)
    const base64Content = Buffer.from(content, 'utf-8').toString('base64')
    const fullCmd = `${sshPrefix} "echo '${base64Content}' | base64 -d > '${remotePath}'"`

    return new Promise((resolve) => {
      exec(fullCmd, { timeout: 15000 }, (error, _stdout, stderr) => {
        if (error) {
          resolve({ success: false, error: stderr || error.message })
        } else {
          resolve({ success: true })
        }
      })
    })
  }

  /**
   * Xóa tệp hoặc thư mục từ xa
   */
  public async deleteItem(
    hostId: string,
    remotePath: string
  ): Promise<{ success: boolean; error?: string }> {
    const host = this.getHost(hostId)
    if (!host) return { success: false, error: 'Không tìm thấy máy chủ.' }

    const sshPrefix = this.buildSSHExecPrefix(host)
    const fullCmd = `${sshPrefix} "rm -rf '${remotePath}'"`

    return new Promise((resolve) => {
      exec(fullCmd, { timeout: 10000 }, (error, _stdout, stderr) => {
        if (error) {
          resolve({ success: false, error: stderr || error.message })
        } else {
          resolve({ success: true })
        }
      })
    })
  }

  /**
   * Tạo thư mục mới trên máy chủ từ xa
   */
  public async createDirectory(
    hostId: string,
    remotePath: string
  ): Promise<{ success: boolean; error?: string }> {
    const host = this.getHost(hostId)
    if (!host) return { success: false, error: 'Không tìm thấy máy chủ.' }

    const sshPrefix = this.buildSSHExecPrefix(host)
    const fullCmd = `${sshPrefix} "mkdir -p '${remotePath}'"`

    return new Promise((resolve) => {
      exec(fullCmd, { timeout: 8000 }, (error, _stdout, stderr) => {
        if (error) {
          resolve({ success: false, error: stderr || error.message })
        } else {
          resolve({ success: true })
        }
      })
    })
  }
}

export const sftpService = new SFTPService()
