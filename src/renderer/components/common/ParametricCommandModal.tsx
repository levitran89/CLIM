import React, { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SlidersHorizontal, Play, X, Terminal, Code2 } from 'lucide-react'
import type { Command } from '@shared/types'

export interface PlaceholderItem {
  key: string
  defaultValue?: string
  raw: string
}

export function extractCommandPlaceholders(cmdStr: string): PlaceholderItem[] {
  const regex = /\{\{([^}]+)\}\}/g
  const matches: PlaceholderItem[] = []
  const seen = new Set<string>()

  let match: RegExpExecArray | null
  while ((match = regex.exec(cmdStr)) !== null) {
    const rawInner = match[1].trim()
    let key = rawInner
    let defaultValue: string | undefined = undefined

    if (rawInner.includes(':-')) {
      const parts = rawInner.split(':-')
      key = parts[0].trim()
      defaultValue = parts[1] ? parts[1].trim() : ''
    }

    if (!seen.has(key)) {
      seen.add(key)
      matches.push({
        key,
        defaultValue,
        raw: match[0]
      })
    }
  }

  return matches
}

export function replaceCommandPlaceholders(cmdStr: string, values: Record<string, string>): string {
  return cmdStr.replace(/\{\{([^}]+)\}\}/g, (fullMatch, inner) => {
    const rawInner = inner.trim()
    let key = rawInner
    let defaultValue = ''
    if (rawInner.includes(':-')) {
      const parts = rawInner.split(':-')
      key = parts[0].trim()
      defaultValue = parts[1] ? parts[1].trim() : ''
    }
    const val = values[key]
    return val !== undefined && val !== '' ? val : defaultValue
  })
}

interface ParametricCommandModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  command: Command | null
  onExecuteFinalCommand: (finalCommand: Command) => void
}

export function ParametricCommandModal({
  open,
  onOpenChange,
  command,
  onExecuteFinalCommand
}: ParametricCommandModalProps): React.JSX.Element | null {
  const [paramValues, setParamValues] = useState<Record<string, string>>({})

  const placeholders = useMemo(() => {
    if (!command) return []
    return extractCommandPlaceholders(command.command)
  }, [command])

  useEffect(() => {
    if (open && command) {
      const initial: Record<string, string> = {}
      for (const p of placeholders) {
        initial[p.key] = p.defaultValue || ''
      }
      setParamValues(initial)
    }
  }, [open, command, placeholders])

  if (!command) return null

  const resolvedCommandText = replaceCommandPlaceholders(command.command, paramValues)

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    const finalCmd: Command = {
      ...command,
      command: resolvedCommandText
    }
    onOpenChange(false)
    onExecuteFinalCommand(finalCmd)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 w-[92vw] max-w-lg p-0 overflow-hidden shadow-2xl rounded-2xl">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <SlidersHorizontal size={20} />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-zinc-100 flex items-center gap-2">
                  Điền Tham Số Câu Lệnh
                </DialogTitle>
                <p className="text-xs text-zinc-400">
                  Câu lệnh chứa {placeholders.length} biến động cần nhập giá trị
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Form Fields */}
          <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-zinc-200">{command.name}</span>
              {command.description && (
                <p className="text-xs text-zinc-400">{command.description}</p>
              )}
            </div>

            <div className="space-y-3 pt-1">
              {placeholders.map((p) => (
                <div key={p.key} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono text-blue-300 font-bold">
                      {`{{${p.key}}}`}
                    </label>
                    {p.defaultValue && (
                      <span className="text-[10px] text-zinc-500 font-mono">
                        Mặc định: {p.defaultValue}
                      </span>
                    )}
                  </div>
                  <Input
                    type="text"
                    value={paramValues[p.key] || ''}
                    onChange={(e) =>
                      setParamValues((prev) => ({ ...prev, [p.key]: e.target.value }))
                    }
                    placeholder={p.defaultValue ? `Mặc định: ${p.defaultValue}` : `Nhập giá trị cho ${p.key}...`}
                    className="bg-zinc-950 border-zinc-700 text-zinc-100 text-xs h-9 font-mono"
                    autoFocus={placeholders[0].key === p.key}
                  />
                </div>
              ))}
            </div>

            {/* Live Preview */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs text-zinc-400 flex items-center gap-1.5">
                <Terminal size={13} className="text-emerald-400" />
                <span>Xem trước câu lệnh hoàn chỉnh:</span>
              </label>
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl font-mono text-xs text-emerald-400 select-all overflow-x-auto leading-relaxed">
                {resolvedCommandText}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-zinc-400 hover:text-zinc-200 text-xs px-4 h-9"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs px-5 h-9 gap-1.5 cursor-pointer shadow-sm"
            >
              <Play size={14} className="fill-zinc-950" />
              <span>Chạy Trong Terminal</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
