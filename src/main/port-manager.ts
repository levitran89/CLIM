import { exec } from 'child_process'
import { promisify } from 'util'
import type { PortInfo } from '../shared/types'

const execAsync = promisify(exec)

export class PortManager {
  /**
   * Retrieves a list of active listening ports along with their associated process information.
   * Currently implemented for Windows.
   */
  async getPorts(): Promise<PortInfo[]> {
    try {
      if (process.platform !== 'win32') {
        // macOS / Linux implementation could go here using lsof or netstat
        throw new Error('Port mapping is currently only supported on Windows')
      }

      // Get all listening ports
      const { stdout: netstatOutput } = await execAsync('netstat -ano | findstr LISTENING')
      
      // Get all processes to map PID to name
      const { stdout: tasklistOutput } = await execAsync('tasklist /FO CSV /NH')
      
      // Parse tasklist output: "process.exe","1234","Console",...
      const processMap = new Map<number, string>()
      const taskLines = tasklistOutput.split('\n').map(l => l.trim()).filter(Boolean)
      for (const line of taskLines) {
        // Simple regex to parse CSV
        const parts = line.split('","')
        if (parts.length >= 2) {
          const processName = parts[0].replace(/^"/, '')
          const pid = parseInt(parts[1], 10)
          if (!isNaN(pid)) {
            processMap.set(pid, processName)
          }
        }
      }

      // Parse netstat output
      const ports: PortInfo[] = []
      const netstatLines = netstatOutput.split('\n').map(l => l.trim()).filter(Boolean)
      
      for (const line of netstatLines) {
        // Example line: TCP    0.0.0.0:135    0.0.0.0:0    LISTENING    1128
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
                // Avoid duplicates (sometimes same port bound to 0.0.0.0 and [::])
                if (!ports.find(p => p.port === port)) {
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
      
      // Sort by port number
      return ports.sort((a, b) => a.port - b.port)
      
    } catch (error) {
      console.error('Error fetching ports:', error)
      return []
    }
  }

  /**
   * Kills a process by its PID
   */
  async killPort(pid: number): Promise<{ success: boolean; error?: string }> {
    try {
      if (process.platform === 'win32') {
        await execAsync(`taskkill /F /PID ${pid}`)
        return { success: true }
      } else {
        await execAsync(`kill -9 ${pid}`)
        return { success: true }
      }
    } catch (error: any) {
      console.error(`Error killing PID ${pid}:`, error)
      return { success: false, error: error.message }
    }
  }
}

export const portManager = new PortManager()
