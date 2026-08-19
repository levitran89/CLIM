import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useRecordingStore } from './recording-store'
import { exportToAsciinemaCast, exportToStandaloneHtmlPlayer } from '@/lib/asciinema-exporter'
import type { TerminalRecording } from '@shared/types'

describe('Recording Store & Asciinema Exporter', () => {
  beforeEach(() => {
    useRecordingStore.setState({
      isRecording: false,
      activeSessionId: null,
      activeRecording: null,
      recordingDurationSec: 0,
      timerIntervalId: null,
      bookmarks: [],
      incidents: []
    })
  })

  it('should start and record chunks accurately', () => {
    const store = useRecordingStore.getState()
    store.startRecording('sess-1', 'Test Session')

    expect(useRecordingStore.getState().isRecording).toBe(true)
    expect(useRecordingStore.getState().activeSessionId).toBe('sess-1')

    useRecordingStore.getState().recordChunk('sess-1', 'npm test\r\n')
    useRecordingStore.getState().recordChunk('sess-1', 'PASS src/test.ts\r\n')

    const rec = useRecordingStore.getState().activeRecording
    expect(rec?.events.length).toBe(2)
    expect(rec?.events[0].data).toBe('npm test\r\n')

    const finalRec = useRecordingStore.getState().stopRecording()
    expect(useRecordingStore.getState().isRecording).toBe(false)
    expect(finalRec?.events.length).toBe(2)
  })

  it('should export recording to Asciinema v2 format (.cast)', () => {
    const mockRec: TerminalRecording = {
      id: 'rec-1',
      sessionId: 'sess-1',
      title: 'Dev Server Build',
      startedAt: 1700000000000,
      durationMs: 3000,
      events: [
        { time: 500, data: 'echo "hello"\r\n' },
        { time: 1200, data: 'hello\r\n' }
      ]
    }

    const cast = exportToAsciinemaCast(mockRec)
    const lines = cast.split('\n')

    expect(lines.length).toBe(3)
    const header = JSON.parse(lines[0])
    expect(header.version).toBe(2)
    expect(header.title).toBe('Dev Server Build')

    const ev1 = JSON.parse(lines[1])
    expect(ev1[0]).toBe(0.5)
    expect(ev1[1]).toBe('o')
    expect(ev1[2]).toBe('echo "hello"\r\n')
  })

  it('should generate standalone HTML player containing asciinema bundle', () => {
    const mockRec: TerminalRecording = {
      id: 'rec-1',
      sessionId: 'sess-1',
      title: 'Demo HTML',
      startedAt: 1700000000000,
      durationMs: 2000,
      events: [{ time: 100, data: 'test' }]
    }

    const html = exportToStandaloneHtmlPlayer(mockRec)
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('asciinema-player')
    expect(html).toContain('Demo HTML')
  })

  it('should manage bookmarks and incident reports', () => {
    const store = useRecordingStore.getState()

    store.addBookmark({
      sessionId: 'sess-1',
      sessionTitle: 'Terminal 1',
      content: 'FATAL ERROR: out of memory',
      category: 'critical',
      note: 'Investigate node max-old-space-size'
    })

    expect(useRecordingStore.getState().bookmarks.length).toBe(1)
    expect(useRecordingStore.getState().bookmarks[0].content).toContain('FATAL ERROR')

    const incident = store.createIncidentReport({
      title: 'Out of memory crash',
      summary: 'Node crashed during build step',
      logExcerpt: 'FATAL ERROR: out of memory',
      status: 'open'
    })

    expect(useRecordingStore.getState().incidents.length).toBe(1)
    expect(incident.id).toBeDefined()
  })
})
