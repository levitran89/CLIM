import React from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Play, Square, ListOrdered } from 'lucide-react'
import { toast } from 'sonner'
import { useSequenceStore } from '@/stores/sequence-store'
import { cn } from '@/lib/utils'

export function SequenceRunnerPanel(): React.JSX.Element | null {
  const activeRun = useSequenceStore((s) => s.activeRun)
  const sequences = useSequenceStore((s) => s.sequences)
  const runStep = useSequenceStore((s) => s.runStep)
  const pauseStep = useSequenceStore((s) => s.pauseStep)
  const focusStep = useSequenceStore((s) => s.focusStep)
  const stopSequence = useSequenceStore((s) => s.stopSequence)

  if (!activeRun) return null

  const sequence = sequences.find((s) => s.id === activeRun.sequenceId)
  if (!sequence) return null

  const handleRunStep = async (stepId: string): Promise<void> => {
    try {
      await runStep(stepId)
    } catch {
      toast.error('Không thể chạy bước này')
    }
  }

  const handlePauseStep = async (stepId: string): Promise<void> => {
    try {
      await pauseStep(stepId)
      toast.info('Đã dừng lệnh')
    } catch {
      toast.error('Không thể dừng lệnh')
    }
  }

  const handleStop = async (): Promise<void> => {
    await stopSequence()
    toast.warning(`Đã kết thúc dãy lệnh "${sequence.name}"`)
  }

  return (
    <div className="w-56 shrink-0 flex flex-col border-r border-zinc-800/60 bg-zinc-900/50">
      <div className="px-2.5 py-2 border-b border-zinc-800/50">
        <div className="flex items-center gap-1.5 min-w-0">
          <ListOrdered size={12} className="text-violet-400 shrink-0" />
          <p className="text-xs font-medium text-zinc-100 truncate">{sequence.name}</p>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-1.5 space-y-0.5">
          {sequence.steps.map((step, index) => {
            const isRunning = activeRun.runningStepIds.includes(step.id)
            const isCompleted = activeRun.completedStepIds.includes(step.id)
            const isActive = activeRun.activeStepId === step.id
            const statusLabel = isRunning
              ? 'Đang chạy'
              : isCompleted
                ? 'Kết thúc'
                : 'Chờ'
            const statusClass = isRunning
              ? 'text-emerald-400'
              : isCompleted
                ? 'text-zinc-500'
                : 'text-amber-500/80'

            return (
              <div
                key={step.id}
                onClick={() => focusStep(step.id)}
                className={cn(
                  'group flex items-center gap-1.5 rounded-md px-1.5 py-1.5 cursor-pointer transition-all border',
                  isRunning
                    ? 'bg-emerald-500/15 border-emerald-500/40'
                    : isActive
                      ? 'bg-zinc-800/70 border-zinc-600/40'
                      : 'border-transparent hover:bg-zinc-800/40'
                )}
              >
                <span
                  className={cn(
                    'text-[10px] font-mono w-3.5 shrink-0 text-center',
                    isRunning ? 'text-emerald-400' : 'text-zinc-500'
                  )}
                >
                  {index + 1}
                </span>

                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      'text-[11px] font-medium truncate leading-tight',
                      isRunning ? 'text-emerald-100' : 'text-zinc-200'
                    )}
                  >
                    {step.name || step.command}
                  </p>
                  {step.name ? (
                    <p className="text-[9px] font-mono text-zinc-500 truncate leading-tight mt-0.5">
                      {step.command}
                    </p>
                  ) : null}
                  <span className={cn('text-[9px] font-medium', statusClass)}>
                    {statusLabel}
                  </span>
                </div>

                {isRunning ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    title="Dừng lệnh"
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePauseStep(step.id)
                    }}
                  >
                    <Square size={13} fill="currentColor" />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 shrink-0 text-[10px] text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 gap-1"
                    title="Chạy lệnh"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRunStep(step.id)
                    }}
                  >
                    <Play size={12} />
                    Chạy
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      </ScrollArea>

      <div className="p-1.5 border-t border-zinc-800/50">
        <Button
          variant="outline"
          size="sm"
          className="w-full h-7 text-[11px] border-red-500/30 text-red-400 hover:bg-red-500/10"
          onClick={handleStop}
        >
          <Square size={10} className="mr-1" />
          Kết thúc dãy
        </Button>
      </div>
    </div>
  )
}
