import { exec } from 'child_process'
import { promisify } from 'util'
import type { PortInfo } from '../shared/types'

const execAsync = promisify(exec)

const DEFAULT_TIMEOUT_MS = 10_000

/**
 * Wraps execAsync with a configurable timeout to prevent indefinite hangs.
 * Throws a descriptive error if the process exceeds the timeout window.
 */
async function execWithTimeout(
  command: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<{ stdout: string; stderr: string }> {
  let timer: NodeJS.Timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`Command timed out after ${timeoutMs}ms: ${command}`))
    }, timeoutMs)
  })

  try {
    const result = await Promise.race([execAsync(command), timeoutPromise])
    return result as { stdout: string; stderr: string }
  } finally {
    clearTimeout(timer!)
  }
}

export class PortManager {
    /**
   * Retrieves a list of active listening ports along with their associated process information.
   * Supports Windows, Linux, and macOS.
   */
  async getPorts(): Promise<PortInfo[]> {
    try {
      if (process.platform === 'win32') {
        return this._getPortsWindows()
      } else {
        // macOS / Linux
        return this._getPortsUnix()
      }
        } catch (error) {
      console.error('Error fetching ports:', error)
      return []
    }
  }

  /**
   * Windows-specific implementation to retrieve listening ports.
   * Uses `netstat` and `tasklist`.
   */
  private async _getPortsWindows(): Promise<PortInfo[]> {
    // Get all listening ports
    const { stdout: netstatOutput } = await execWithTimeout('netstat -ano | findstr LISTENING')

    // Get all processes to map PID to name
    const { stdout: tasklistOutput } = await execWithTimeout('tasklist /FO CSV /NH')

    // Parse tasklist output: "process.exe","1234","Console",...
    const processMap = new Map<number, string>()
    const taskLines = tasklistOutput.split('\n').map((l) => l.trim()).filter(Boolean)
    for (const line of taskLines) {
      const parts = line.split('","')
      if (parts.length >= 2) {
        const processName = parts[0].replace(/^"/, '')
        const pid = parseInt(parts[1], 10)
        if (!isNaN(pid)) {
          processMap.set(pid, processName)
        }
      }
    }

    const ports: PortInfo[] = []
    const netstatLines = netstatOutput.split('\n').map((l) => l.trim()).filter(Boolean)

    for (const line of netstatLines) {
      const parts = line.split(/\s+/)
      if (parts.length >= 5) {
        const protocol = parts[0]
        const localAddress = parts[1]
        const pid = parseInt(parts[4], 10)

        if (localAddress) {
          const addressParts = localAddress.split(':')
          if (addressParts.length >= 2) {
            const portStr = addressParts[addressParts.length - 1]
            const port = parseInt(portStr, 10)

            if (!isNaN(port) && !isNaN(pid)) {
              if (!ports.find((p) => p.port === port)) {
                ports.push({
                  port,
                  pid,
                  processName: processMap.get(pid) || 'Unknown',
                  protocol
                })
              }
            }
          }
        }
      }
    }

        return ports.sort((a, b) => a.port - b.port)
  }

  /**
   * Linux/macOS-specific implementation to retrieve listening ports.
   * Tries `lsof` first, falls back to `ss` (Linux) or `netstat`.
   */
  private async _getPortsUnix(): Promise<PortInfo[]> {
    const ports: PortInfo[] = []

    // Try lsof first (available on both macOS and most Linux distros)
    try {
      const { stdout } = await execWithTimeout('lsof -i -P -n | grep LISTEN')
      const lines = stdout.split('\n').map((l) => l.trim()).filter(Boolean)

      for (const line of lines) {
        // Example: COMMAND PID USER FD TYPE DEVICE SIZE/OFF NODE NAME
        // nginx    1234 root  6u  IPv4  12345      0t0  TCP *:80 (LISTEN)
        const parts = line.split(/\s+/)
        if (parts.length >= 9) {
          const processName = parts[0]
          const pid = parseInt(parts[1], 10)
          const namePart = parts[8] // e.g., *:80 or 0.0.0.0:80

          const portMatch = namePart.match(/:(\d+)$/)
          if (portMatch) {
            const port = parseInt(portMatch[1], 10)
            if (!isNaN(port) && !isNaN(pid)) {
              if (!ports.find((p) => p.port === port)) {
                ports.push({
                  port,
                  pid,
                  processName,
                  protocol: 'TCP'
                })
              }
            }
          }
        }
      }

      if (ports.length > 0) {
        return ports.sort((a, b) => a.port - b.port)
      }
    } catch (e) {
      // lsof might not be available, try ss/netstat fallback
    }

    // Fallback: Try `ss` (common on modern Linux)
    try {
      const { stdout } = await execWithTimeout('ss -tulnp | grep LISTEN')
      const lines = stdout.split('\n').map((l) => l.trim()).filter(Boolean)

      for (const line of lines) {
        // Example: LISTEN 0 511 0.0.0.0:5173 0.0.0.0:* users:(("node",pid=1234,fd=21))
        const parts = line.split(/\s+/)
        if (parts.length >= 6) {
          const localAddress = parts[3]
          const pidMatch = parts[5].match(/pid=(\d+)/)
          const processNameMatch = parts[5].match(/\("(\w+)"/)

          const portMatch = localAddress.match(/:(\d+)$/)

          if (pidMatch && portMatch) {
            const pid = parseInt(pidMatch[1], 10)
            const port = parseInt(portMatch[1], 10)

            if (!isNaN(port) && !isNaN(pid)) {
              if (!ports.find((p) => p.port === port)) {
                ports.push({
                  port,
                  pid,
                  processName: processNameMatch ? processNameMatch[1] : 'Unknown',
                  protocol: 'TCP'
                })
              }
            }
          }
        }
      }

      if (ports.length > 0) {
        return ports.sort((a, b) => a.port - b.port)
      }
    } catch (e) {
      // ss might not be available
    }

    // Last resort fallback: netstat
    try {
      const { stdout } = await execWithTimeout('netstat -tulnp | grep LISTEN')
      const lines = stdout.split('\n').map((l) => l.trim()).filter(Boolean)

      for (const line of lines) {
        // Example: tcp  0  0 0.0.0.0:5173  0.0.0.0:*  LISTEN  1234/node
        const parts = line.split(/\s+/)
        if (parts.length >= 7) {
          const localAddress = parts[3]
          const pidAndName = parts[6]
          const pidMatch = pidAndName.match(/^(\d+)$/)
          const pidNameMatch = pidAndName.match(/^(\d+)\/(.+)$/)

          const portMatch = localAddress.match(/:(\d+)$/)

          if (pidMatch || pidNameMatch) {
            const pid = parseInt((pidNameMatch || pidMatch)![1], 10)
            const port = parseInt(portMatch![1], 10)

            if (!isNaN(port) && !isNaN(pid)) {
              if (!ports.find((p) => p.port === port)) {
                ports.push({
                  port,
                  pid,
                  processName: pidNameMatch ? pidNameMatch[2] : 'Unknown',
                  protocol: parts[0].toUpperCase()
                })
              }
            }
          }
        }
      }
    } catch (e) {
      // netstat failed as well
    }

    return ports.sort((a, b) => a.port - b.port)
  }

  /**
   * Kills a process by its PID.
   * Returns whether the action succeeded and, if it failed due to permissions,
   * indicates the user may need to run CLIM as administrator.
   */
    async killPort(
    pid: number
  ): Promise<{ success: boolean; error?: string; requiresAdmin?: boolean }> {
    try {
      if (process.platform === 'win32') {
        await execWithTimeout(`taskkill /F /PID ${pid}`)
        return { success: true }
      } else {
        await execWithTimeout(`kill -9 ${pid}`)
        return { success: true }
      }
    } catch (error: any) {
      console.error(`Error killing PID ${pid}:`, error)

      // Detect common Windows permission-denied scenarios
      const isAccessDenied =
        error?.message?.toLowerCase().includes('access is denied') ||
        error?.code === 5 || // Win32 ERROR_ACCESS_DENIED
        error?.stderr?.toLowerCase().includes('access is denied') ||
        error?.message?.toLowerCase().includes('operation not permitted') || // Unix EPERM
        error?.code === 'EPERM' // Unix equivalent of ERROR_ACCESS_DENIED

      if (isAccessDenied) {
        return {
          success: false,
          error: process.platform === 'win32'
            ? 'Access denied. Please run CLIM as administrator to kill this process.'
            : 'Permission denied. Try running CLIM with elevated privileges (sudo).',
          requiresAdmin: true
        }
      }

      return {
        success: false,
        error: error.message,
        requiresAdmin: false
      }
    }
  }
}

export const portManager = new PortManager()

