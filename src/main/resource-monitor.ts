import os from 'os'
import { execFile } from 'child_process'
import { promisify } from 'util'
import type { SystemMetrics, ProcessMetric } from '../shared/types'

const execFileAsync = promisify(execFile)

// Helper to calculate CPU usage
let lastCpuInfo: { idle: number; total: number } | null = null
const lastProcessCpu = new Map<number, { cpuTime: number; timestamp: number }>()

function getCpuTimes(): { idle: number; total: number } {
  const cpus = os.cpus()
  let idle = 0
  let total = 0

  for (const cpu of cpus) {
    for (const type in cpu.times) {
      total += (cpu.times as Record<string, number>)[type]
    }
    idle += cpu.times.idle
  }

  return { idle, total }
}

export class ResourceMonitor {
  /**
   * Lấy chỉ số tài nguyên tổng thể hệ thống (CPU % & RAM)
   */
  public async getSystemMetrics(): Promise<SystemMetrics> {
    const cpus = os.cpus()
    const cpuCount = cpus.length
    const cpuModel = cpus[0]?.model || 'Generic CPU'
    const totalMemoryBytes = os.totalmem()
    const freeMemoryBytes = os.freemem()
    const usedMemoryBytes = totalMemoryBytes - freeMemoryBytes
    const memoryUsagePercent = Math.round((usedMemoryBytes / totalMemoryBytes) * 100)
    const uptimeSeconds = Math.round(os.uptime())

    // Calculate CPU Usage Percent
    let cpuUsagePercent = 0
    const currentCpu = getCpuTimes()

    if (lastCpuInfo) {
      const idleDelta = currentCpu.idle - lastCpuInfo.idle
      const totalDelta = currentCpu.total - lastCpuInfo.total
      if (totalDelta > 0) {
        const usage = 100 - Math.round((idleDelta / totalDelta) * 100)
        cpuUsagePercent = Math.max(0, Math.min(100, usage))
      }
    } else {
      // First tick estimate
      cpuUsagePercent = 10
    }
    lastCpuInfo = currentCpu

    return {
      cpuUsagePercent,
      cpuCount,
      cpuModel,
      totalMemoryBytes,
      freeMemoryBytes,
      usedMemoryBytes,
      memoryUsagePercent,
      uptimeSeconds
    }
  }

  /**
   * Lấy chi tiết mức sử dụng RAM và CPU của danh sách các Process IDs
   */
  public async getProcessMetrics(pids?: number[]): Promise<ProcessMetric[]> {
    const uniquePids = Array.from(
      new Set((pids || []).filter((p) => typeof p === 'number' && p > 0))
    )

    try {
      let trackedOutput = ''
      if (uniquePids.length > 0) {
        const idList = uniquePids.join(',')
        try {
          const res = await execFileAsync('powershell.exe', [
            '-NoProfile',
            '-NonInteractive',
            '-Command',
            `Get-Process -Id ${idList} -ErrorAction SilentlyContinue | Select-Object Id,ProcessName,CPU,WorkingSet64 | ConvertTo-Json -Compress`
          ], { timeout: 3000 })
          trackedOutput = res.stdout
        } catch {
          // ignore
        }
      }

      // Also get common dev/terminal processes
      let devOutput = ''
      try {
        const res = await execFileAsync('powershell.exe', [
          '-NoProfile',
          '-NonInteractive',
          '-Command',
          `Get-Process -ErrorAction SilentlyContinue | Where-Object ProcessName -match '^(powershell|pwsh|cmd|wsl|wslhost|conhost|node|python|git|docker|java|dotnet)$' | Select-Object -First 30 Id,ProcessName,CPU,WorkingSet64 | ConvertTo-Json -Compress`
        ], { timeout: 3000 })
        devOutput = res.stdout
      } catch {
        // ignore
      }

      const parseJsonList = (str: string): any[] => {
        if (!str || !str.trim()) return []
        try {
          const parsed = JSON.parse(str.trim())
          return Array.isArray(parsed) ? parsed : [parsed]
        } catch {
          return []
        }
      }

      const allItems = [...parseJsonList(trackedOutput), ...parseJsonList(devOutput)]
      const seenIds = new Set<number>()
      const results: ProcessMetric[] = []
      const now = Date.now()
      const cores = os.cpus().length || 1

      for (const item of allItems) {
        if (item && typeof item === 'object' && 'Id' in item && typeof item.Id === 'number') {
          if (seenIds.has(item.Id)) continue
          seenIds.add(item.Id)

          const memoryBytes = item.WorkingSet64 || 0
          const memoryMb = Math.round((memoryBytes / (1024 * 1024)) * 10) / 10
          
          // Calculate delta CPU % based on accumulated CPU seconds
          let cpuPercent = 0
          const prev = lastProcessCpu.get(item.Id)
          if (prev && typeof item.CPU === 'number') {
            const cpuDelta = item.CPU - prev.cpuTime
            const timeDelta = (now - prev.timestamp) / 1000
            if (timeDelta > 0 && cpuDelta >= 0) {
              cpuPercent = Math.min(100, Math.round((cpuDelta / (timeDelta * cores)) * 100 * 10) / 10)
            }
          }
          if (typeof item.CPU === 'number') {
            lastProcessCpu.set(item.Id, { cpuTime: item.CPU, timestamp: now })
          }

          const isTracked = uniquePids.includes(item.Id)

          results.push({
            pid: item.Id,
            name: item.ProcessName || 'Process',
            type: isTracked ? 'terminal' : 'port',
            cpuPercent,
            memoryBytes,
            memoryMb
          })
        }
      }

      return results.sort((a, b) => b.memoryBytes - a.memoryBytes)
    } catch {
      return []
    }
  }

  /**
   * Buộc dừng tiến trình theo PID
   */
  public async killProcess(pid: number): Promise<{ success: boolean; error?: string }> {
    try {
      await execFileAsync('taskkill', ['/F', '/PID', String(pid)])
      return { success: true }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      return { success: false, error: msg }
    }
  }
}

export const resourceMonitor = new ResourceMonitor()
