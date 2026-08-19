import { create } from 'zustand'
import type { TerminalRecording, LogBookmark, IncidentReport } from '@shared/types'
import { toast } from 'sonner'
import { exportToAsciinemaCast, exportToStandaloneHtmlPlayer } from '@/lib/asciinema-exporter'

const BOOKMARKS_KEY = 'clim-log-bookmarks'
const INCIDENTS_KEY = 'clim-incident-reports'

interface RecordingStore {
  // Session recording state
  isRecording: boolean
  activeSessionId: string | null
  activeRecording: TerminalRecording | null
  recordingDurationSec: number
  timerIntervalId: any

  // Bookmarks & Incident Reports
  bookmarks: LogBookmark[]
  incidents: IncidentReport[]

  // Actions
  startRecording: (sessionId: string, title?: string) => void
  recordChunk: (sessionId: string, chunk: string) => void
  stopRecording: () => TerminalRecording | null
  exportRecording: (format: 'cast' | 'html' | 'txt') => Promise<void>

  addBookmark: (bookmark: Omit<LogBookmark, 'id' | 'timestamp'>) => void
  deleteBookmark: (id: string) => void

  createIncidentReport: (report: Omit<IncidentReport, 'id' | 'createdAt'>) => IncidentReport
  deleteIncidentReport: (id: string) => void
}

export const useRecordingStore = create<RecordingStore>((set, get) => {
  const loadBookmarks = (): LogBookmark[] => {
    try {
      const saved = localStorage.getItem(BOOKMARKS_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  }

  const loadIncidents = (): IncidentReport[] => {
    try {
      const saved = localStorage.getItem(INCIDENTS_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  }

  return {
    isRecording: false,
    activeSessionId: null,
    activeRecording: null,
    recordingDurationSec: 0,
    timerIntervalId: null,

    bookmarks: loadBookmarks(),
    incidents: loadIncidents(),

    startRecording: (sessionId: string, title = 'Terminal Session') => {
      const existingInterval = get().timerIntervalId
      if (existingInterval) clearInterval(existingInterval)

      const recording: TerminalRecording = {
        id: `rec-${Date.now()}`,
        sessionId,
        title,
        startedAt: Date.now(),
        durationMs: 0,
        events: []
      }

      const timerId = setInterval(() => {
        set((state) => ({
          recordingDurationSec: state.recordingDurationSec + 1,
          activeRecording: state.activeRecording
            ? { ...state.activeRecording, durationMs: Date.now() - state.activeRecording.startedAt }
            : null
        }))
      }, 1000)

      set({
        isRecording: true,
        activeSessionId: sessionId,
        activeRecording: recording,
        recordingDurationSec: 0,
        timerIntervalId: timerId
      })

      toast.info(`🔴 Đang ghi lại phiên terminal "${title}"`, {
        description: 'Tất cả lệnh và đầu ra sẽ được ghi nhận với timestamp.'
      })
    },

    recordChunk: (sessionId: string, chunk: string) => {
      const { isRecording, activeSessionId, activeRecording } = get()
      if (!isRecording || activeSessionId !== sessionId || !activeRecording) return

      const timeOffset = Date.now() - activeRecording.startedAt
      const updatedEvents = [...activeRecording.events, { time: timeOffset, data: chunk }]

      set({
        activeRecording: {
          ...activeRecording,
          durationMs: timeOffset,
          events: updatedEvents
        }
      })
    },

    stopRecording: () => {
      const { timerIntervalId, activeRecording } = get()
      if (timerIntervalId) clearInterval(timerIntervalId)

      if (!activeRecording) {
        set({ isRecording: false, activeSessionId: null, timerIntervalId: null })
        return null
      }

      const finalRecording: TerminalRecording = {
        ...activeRecording,
        endedAt: Date.now(),
        durationMs: Date.now() - activeRecording.startedAt
      }

      set({
        isRecording: false,
        activeSessionId: null,
        activeRecording: finalRecording,
        timerIntervalId: null
      })

      toast.success('Đã dừng ghi phiên terminal', {
        description: `Tổng thời gian: ${(finalRecording.durationMs / 1000).toFixed(1)}s, ${finalRecording.events.length} sự kiện log.`
      })

      return finalRecording
    },

    exportRecording: async (format: 'cast' | 'html' | 'txt') => {
      const recording = get().activeRecording
      if (!recording || recording.events.length === 0) {
        toast.error('Không có dữ liệu bản ghi để xuất')
        return
      }

      let content = ''
      let defaultFileName = `terminal-recording-${Date.now()}`

      if (format === 'cast') {
        content = exportToAsciinemaCast(recording)
        defaultFileName += '.cast'
      } else if (format === 'html') {
        content = exportToStandaloneHtmlPlayer(recording)
        defaultFileName += '.html'
      } else {
        // Plain text with relative timestamps
        const lines = recording.events.map(
          (e) => `[+${(e.time / 1000).toFixed(2)}s] ${e.data}`
        )
        content = lines.join('')
        defaultFileName += '.txt'
      }

      try {
        if (window.api?.system?.saveFile) {
          const filePath = await window.api.system.saveFile(content, defaultFileName)
          if (filePath) {
            toast.success(`Đã lưu bản ghi (${format.toUpperCase()}) thành công`)
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Lỗi khi lưu file'
        toast.error(`Lỗi: ${msg}`)
      }
    },

    addBookmark: (bookmark) => {
      const newBm: LogBookmark = {
        ...bookmark,
        id: `bm-${Date.now()}`,
        timestamp: Date.now()
      }

      const updated = [newBm, ...get().bookmarks]
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updated))
      set({ bookmarks: updated })
      toast.success('Đã đánh dấu đoạn log thành công')
    },

    deleteBookmark: (id: string) => {
      const updated = get().bookmarks.filter((b) => b.id !== id)
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updated))
      set({ bookmarks: updated })
      toast.info('Đã xóa đánh dấu')
    },

    createIncidentReport: (report) => {
      const newReport: IncidentReport = {
        ...report,
        id: `inc-${Date.now()}`,
        createdAt: Date.now()
      }

      const updated = [newReport, ...get().incidents]
      localStorage.setItem(INCIDENTS_KEY, JSON.stringify(updated))
      set({ incidents: updated })
      toast.success(`Đã tạo Báo Cáo Thực Thi: "${newReport.title}"`)
      return newReport
    },

    deleteIncidentReport: (id: string) => {
      const updated = get().incidents.filter((i) => i.id !== id)
      localStorage.setItem(INCIDENTS_KEY, JSON.stringify(updated))
      set({ incidents: updated })
      toast.info('Đã xóa báo cáo thực thi')
    }
  }
})
