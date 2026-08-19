import type { Terminal } from '@xterm/xterm'

const terminalInstances = new Map<string, Terminal>()

export function registerTerminalInstance(sessionId: string, terminal: Terminal): void {
  terminalInstances.set(sessionId, terminal)
}

export function unregisterTerminalInstance(sessionId: string): void {
  terminalInstances.delete(sessionId)
}

export function getTerminalInstance(sessionId: string): Terminal | undefined {
  return terminalInstances.get(sessionId)
}

export function getTerminalBufferText(sessionId: string): string {
  const terminal = terminalInstances.get(sessionId)
  if (!terminal) return ''
  const buffer = terminal.buffer.active
  const lines: string[] = []
  for (let i = 0; i < buffer.length; i++) {
    const line = buffer.getLine(i)
    if (line) {
      lines.push(line.translateToString(true))
    }
  }
  return lines.join('\n').trim()
}

export interface ExtractedErrorContext {
  lastCommand: string
  errorOutput: string
}

export function extractCommandAndError(rawText: string): ExtractedErrorContext {
  if (!rawText.trim()) {
    return {
      lastCommand: 'Lệnh không xác định',
      errorOutput: 'Terminal chưa có nội dung log.'
    }
  }

  const allLines = rawText.split('\n').map((l) => l.trim()).filter(Boolean)

  // Find lines that look like a prompt: PS C:\...> or C:\...> or user@host:~$ or >
  const promptRegex = /(?:(?:PS\s+[A-Z]:\\[^>]*>)|(?:[A-Z]:\\[^>]*>)|(?:[\w.-]+@[\w.-]+:[^$#]*[$#])|(?:\$\s+)|(?:>\s+))(.*)/i

  let lastCommandIndex = -1
  let lastCommand = ''

  // Look from the end backwards to find the command line that executed
  for (let i = allLines.length - 1; i >= 0; i--) {
    const line = allLines[i]
    const match = line.match(promptRegex)
    if (match && match[1] && match[1].trim()) {
      lastCommand = match[1].trim()
      lastCommandIndex = i
      break
    }
  }

  // If no prompt match, or if command line is found:
  let errorLines: string[] = []
  if (lastCommandIndex !== -1) {
    errorLines = allLines.slice(lastCommandIndex + 1)
    // Filter out the trailing empty prompt if present
    if (
      errorLines.length > 0 &&
      promptRegex.test(errorLines[errorLines.length - 1]) &&
      !errorLines[errorLines.length - 1].replace(promptRegex, '$1').trim()
    ) {
      errorLines.pop()
    }
  } else {
    // Fallback: take last 20 lines
    errorLines = allLines.slice(-20)
    lastCommand = errorLines[0] || 'Lệnh CLI'
  }

  const errorOutput = errorLines.join('\n').trim() || allLines.slice(-15).join('\n')

  return {
    lastCommand: lastCommand || 'npm run dev',
    errorOutput: errorOutput || 'Phát hiện lỗi trong quá trình chạy lệnh.'
  }
}
