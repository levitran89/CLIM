import React, { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Terminal, Play } from 'lucide-react'
import type { Command } from '../../../shared/types'
import { useProfileStore } from '@/stores/profile-store'

interface VariablePromptModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  command: Command | null
  variables: string[]
  onConfirm: (finalCommand: string, values: Record<string, string>) => void
}

export function VariablePromptModal({
  open,
  onOpenChange,
  command,
  variables,
  onConfirm
}: VariablePromptModalProps): React.JSX.Element | null {
  const [values, setValues] = useState<Record<string, string>>({})
  const { getActiveProfile } = useProfileStore()
  const activeProfile = getActiveProfile()

  useEffect(() => {
    if (open && command) {
      const initialValues: Record<string, string> = {}
      const profileVars = activeProfile?.variables || {}

      variables.forEach((v) => {
        // Pre-fill from active profile if available, else empty
        initialValues[v] = profileVars[v] || ''
      })

      setValues(initialValues)
    }
  }, [open, command, variables, activeProfile])

  const finalCommandString = useMemo(() => {
    if (!command) return ''
    let result = command.command
    variables.forEach((v) => {
      const val = values[v] !== undefined ? values[v] : ''
      // Replace ${VAR}
      result = result.replaceAll(`\${${v}}`, val)
      // Replace {{VAR}} or {{VAR:-default}}
      result = result.replace(new RegExp(`\\{\\{${v}(:-[^}]+)?\\}\\}`, 'g'), val)
      // Replace $env:VAR
      result = result.replace(new RegExp(`\\$env:${v}\\b`, 'gi'), val)
    })
    return result
  }, [command, variables, values])

  if (!command) return null

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    onConfirm(finalCommandString, values)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border border-zinc-700/90 text-zinc-100 w-[92vw] max-w-lg p-6 rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.9),0_0_30px_rgba(16,185,129,0.15)] ring-1 ring-zinc-600/50">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.25)]">
              <Terminal size={22} />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                Nhập giá trị cho biến
              </DialogTitle>
              <p className="text-xs text-zinc-400 mt-0.5">
                Lệnh: <strong className="text-emerald-300">{command.name}</strong>
              </p>
            </div>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed pt-1">
            Câu lệnh chứa các biến động <code className="text-emerald-300 font-mono">${'{...}'}</code>. Vui lòng xác nhận giá trị trước khi chạy:
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {variables.map((v, i) => (
              <div key={v} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-sm font-bold text-emerald-400">
                    ${`{${v}}`}
                  </label>
                  {activeProfile?.variables?.[v] && (
                    <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                      Gợi ý từ: <strong className="text-zinc-200">{activeProfile.name}</strong>
                    </span>
                  )}
                </div>
                <Input
                  value={values[v] || ''}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [v]: e.target.value }))
                  }
                  placeholder={`Nhập giá trị cho ${v}...`}
                  className="bg-zinc-950 border-zinc-800 text-sm h-9 font-mono text-zinc-100"
                  autoFocus={i === 0}
                />
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-zinc-950/90 border border-zinc-800/90 space-y-1.5">
            <span className="text-xs text-zinc-400 uppercase tracking-wider font-semibold block">
              Xem trước câu lệnh thực thi
            </span>
            <p className="font-mono text-xs sm:text-sm text-emerald-300 break-all select-all font-medium">
              {finalCommandString}
            </p>
          </div>

          <DialogFooter className="pt-3 border-t border-zinc-800/80">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-9 px-4 text-sm text-zinc-400 hover:text-zinc-200"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="h-9 px-5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm cursor-pointer gap-2"
            >
              <Play size={14} fill="currentColor" />
              Chạy lệnh ngay
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
