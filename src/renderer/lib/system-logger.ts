import { useSystemLogStore } from '@/stores/system-log-store'
import type { SystemLogLevel, SystemLogCategory, SystemLogEntry } from '@shared/types'

/**
 * Ghi log một sự kiện hệ thống vào Tab Log Hệ Thống
 */
export function logSystemEvent(
  level: SystemLogLevel,
  category: SystemLogCategory,
  source: string,
  message: string,
  details?: string | Record<string, any>,
  metadata?: Record<string, any>
): SystemLogEntry {
  const detailsStr =
    typeof details === 'object' ? JSON.stringify(details, null, 2) : details

  return useSystemLogStore.getState().addLog({
    level,
    category,
    source,
    message,
    details: detailsStr,
    metadata
  })
}

// Convenience helpers
export const sysLog = {
  info: (cat: SystemLogCategory, src: string, msg: string, det?: string | Record<string, any>) =>
    logSystemEvent('info', cat, src, msg, det),
  success: (cat: SystemLogCategory, src: string, msg: string, det?: string | Record<string, any>) =>
    logSystemEvent('success', cat, src, msg, det),
  warn: (cat: SystemLogCategory, src: string, msg: string, det?: string | Record<string, any>) =>
    logSystemEvent('warning', cat, src, msg, det),
  error: (cat: SystemLogCategory, src: string, msg: string, det?: string | Record<string, any>) =>
    logSystemEvent('error', cat, src, msg, det)
}
