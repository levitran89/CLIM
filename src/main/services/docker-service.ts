import { exec } from 'child_process'
import type { DockerContainer } from '../../shared/types'

export class DockerService {
  /**
   * Kiểm tra xem Docker CLI và Docker daemon có đang hoạt động không
   */
  public async checkAvailability(): Promise<{ isAvailable: boolean; version?: string; error?: string }> {
    return new Promise((resolve) => {
      exec('docker version --format "{{.Server.Version}}"', { timeout: 4000 }, (error, stdout) => {
        if (error) {
          // Check if at least docker client is installed
          exec('docker --version', { timeout: 3000 }, (clientErr, clientStdout) => {
            if (clientErr) {
              resolve({
                isAvailable: false,
                error: 'Docker chưa được cài đặt hoặc chưa thêm vào PATH.'
              })
            } else {
              resolve({
                isAvailable: false,
                version: clientStdout.trim(),
                error: 'Docker Daemon chưa được khởi chạy (Hãy mở Docker Desktop).'
              })
            }
          })
        } else {
          resolve({
            isAvailable: true,
            version: stdout.trim() || 'Docker Engine Active'
          })
        }
      })
    })
  }

  /**
   * Lấy danh sách toàn bộ Docker Containers
   */
  public async listContainers(all = true): Promise<{ success: boolean; containers: DockerContainer[]; error?: string }> {
    return new Promise((resolve) => {
      const flag = all ? '-a' : ''
      // Query json formatted list
      const cmd = `docker ps ${flag} --no-trunc --format "{{json .}}"`
      exec(cmd, { timeout: 8000, maxBuffer: 1024 * 1024 * 5 }, (error, stdout, stderr) => {
        if (error) {
          resolve({ success: false, containers: [], error: stderr || error.message })
          return
        }

        try {
          const lines = stdout.trim().split('\n').filter(Boolean)
          const containers: DockerContainer[] = lines.map((line) => {
            try {
              const raw = JSON.parse(line)
              const stateRaw = (raw.State || raw.Status || '').toLowerCase()
              let state: DockerContainer['state'] = 'exited'
              if (stateRaw.includes('running') || stateRaw.includes('up')) state = 'running'
              else if (stateRaw.includes('paused')) state = 'paused'
              else if (stateRaw.includes('restarting')) state = 'restarting'
              else if (stateRaw.includes('dead')) state = 'dead'

              return {
                id: raw.ID ? raw.ID.slice(0, 12) : 'unknown',
                name: (raw.Names || raw.Name || 'unnamed').replace(/^\//, ''),
                image: raw.Image || 'unknown',
                command: raw.Command || '',
                createdAt: raw.CreatedAt || raw.RunningFor || '',
                status: raw.Status || '',
                state,
                ports: raw.Ports || '',
                size: raw.Size || ''
              }
            } catch {
              return {
                id: 'parse-err',
                name: 'unnamed',
                image: 'unknown',
                command: '',
                createdAt: '',
                status: line,
                state: 'exited',
                ports: ''
              }
            }
          })
          resolve({ success: true, containers })
        } catch (e: any) {
          resolve({ success: false, containers: [], error: e.message })
        }
      })
    })
  }

  /**
   * Thao tác điều khiển Container (start, stop, restart, kill, rm)
   */
  public async controlContainer(
    action: 'start' | 'stop' | 'restart' | 'kill' | 'rm',
    containerId: string
  ): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      if (!/^[a-zA-Z0-9_\-.]+$/.test(containerId)) {
        resolve({ success: false, error: 'Container ID không hợp lệ.' })
        return
      }

      const cmd = `docker ${action} ${containerId}`
      exec(cmd, { timeout: 15000 }, (error, _stdout, stderr) => {
        if (error) {
          resolve({ success: false, error: stderr || error.message })
        } else {
          resolve({ success: true })
        }
      })
    })
  }

  /**
   * Lấy Logs của Container
   */
  public async getContainerLogs(
    containerId: string,
    tailLines = 150
  ): Promise<{ success: boolean; logs: string; error?: string }> {
    return new Promise((resolve) => {
      if (!/^[a-zA-Z0-9_\-.]+$/.test(containerId)) {
        resolve({ success: false, logs: '', error: 'Container ID không hợp lệ.' })
        return
      }

      const cmd = `docker logs --tail ${tailLines} ${containerId}`
      exec(cmd, { timeout: 10000, maxBuffer: 1024 * 1024 * 5 }, (error, stdout, stderr) => {
        if (error && !stdout && !stderr) {
          resolve({ success: false, logs: '', error: error.message })
        } else {
          // Docker logs outputs both stdout and stderr
          const logs = stdout || stderr || 'Không có log.'
          resolve({ success: true, logs })
        }
      })
    })
  }
}

export const dockerService = new DockerService()
