import { create } from 'zustand'
import type { SystemLogEntry, SystemLogLevel, SystemLogCategory } from '@shared/types'

const STORAGE_KEY = 'clim_system_event_logs_v1'
const MAX_LOGS = 1000

export interface SystemLogFilter {
  search: string
  level: SystemLogLevel | 'all'
  category: SystemLogCategory | 'all'
}

interface SystemLogState {
  logs: SystemLogEntry[]
  filter: SystemLogFilter
  autoScroll: boolean
  columns: 1 | 2
  layoutWidth: 'centered' | 'full'

  // Actions
  addLog: (entry: {
    level: SystemLogLevel
    category: SystemLogCategory
    source: string
    message: string
    details?: string
    metadata?: Record<string, any>
    timestamp?: number
  }) => SystemLogEntry
  clearLogs: () => void
  setFilter: (filter: Partial<SystemLogFilter>) => void
  setAutoScroll: (autoScroll: boolean) => void
  setColumns: (columns: 1 | 2) => void
  setLayoutWidth: (layoutWidth: 'centered' | 'full') => void
  loadLogs: () => void
  exportLogs: (format: 'txt' | 'json') => void
}

function loadInitialLogs(): SystemLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {
    // Ignore error
  }
  return []
}

function saveLogsToStorage(logs: SystemLogEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs.slice(0, MAX_LOGS)))
  } catch {
    // Ignore storage quota errors
  }
}

export const useSystemLogStore = create<SystemLogState>((set, get) => ({
  logs: loadInitialLogs(),
  filter: {
    search: '',
    level: 'all',
    category: 'all'
  },
  autoScroll: true,
  columns: 1,
  layoutWidth: 'full',

  addLog: (entry) => {
    const newLog: SystemLogEntry = {
      id: crypto.randomUUID(),
      timestamp: entry.timestamp || Date.now(),
      level: entry.level,
      category: entry.category,
      source: entry.source,
      message: entry.message,
      details: entry.details,
      metadata: entry.metadata
    }

    set((state) => {
      // Prepend so newest is first
      const updated = [newLog, ...state.logs].slice(0, MAX_LOGS)
      saveLogsToStorage(updated)
      return { logs: updated }
    })

    return newLog
  },

  clearLogs: () => {
    localStorage.removeItem(STORAGE_KEY)
    set({ logs: [] })
  },

  setFilter: (filterUpdate) => {
    set((state) => ({
      filter: { ...state.filter, ...filterUpdate }
    }))
  },

  setAutoScroll: (autoScroll) => set({ autoScroll }),
  setColumns: (columns) => set({ columns }),
  setLayoutWidth: (layoutWidth) => set({ layoutWidth }),

  loadLogs: () => {
    set({ logs: loadInitialLogs() })
  },

  exportLogs: (format: 'txt' | 'json') => {
    const { logs } = get()
    if (logs.length === 0) return

    let content = ''
    let mime = 'text/plain;charset=utf-8'
    let filename = `clim-system-logs-${new Date().toISOString().slice(0, 10)}`

    if (format === 'json') {
      content = JSON.stringify(logs, null, 2)
      mime = 'application/json;charset=utf-8'
      filename += '.json'
    } else {
      content = logs
        .map((l) => {
          const time = new Date(l.timestamp).toLocaleString('vi-VN')
          const level = l.level.toUpperCase().padEnd(7, ' ')
          const cat = `[${l.category.toUpperCase()}]`.padEnd(12, ' ')
          const src = `(${l.source})`
          let line = `[${time}] ${level} ${cat} ${src} ${l.message}`
          if (l.details) {
            line += `\n  Details: ${l.details.replace(/\n/g, '\n  ')}`
          }
          return line
        })
        .join('\n\n')
      filename += '.txt'
    }

    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}))
