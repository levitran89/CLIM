import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Play, Square, ListOrdered, X, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { useSequenceStore } from '@/stores/sequence-store'
import { cn } from '@/lib/utils'

import { useCommandRunner } from '@/components/providers/CommandRunnerProvider'

export function SequenceRunnerPanel(): React.JSX.Element | null {
  const activeRun = useSequenceStore((s) => s.activeRun)
  const sequences = useSequenceStore((s) => s.sequences)
  const runStep = useSequenceStore((s) => s.runStep)
  const pauseStep = useSequenceStore((s) => s.pauseStep)
  const focusStep = useSequenceStore((s) => s.focusStep)
  const finishSequence = useSequenceStore((s) => s.finishSequence)
  const stopSequence = useSequenceStore((s) => s.stopSequence)
  const { runSequenceStep } = useCommandRunner()

  if (!activeRun) return null

  const sequence = sequences.find((s) => s.id === activeRun.sequenceId)
  if (!sequence) return null

  // Bước đang chạy và bước tiếp theo
  const activeRunningStepId =
    activeRun.runningStepIds.length > 0
      ? activeRun.runningStepIds[activeRun.runningStepIds.length - 1]
      : null
  const currentStep = sequence.steps.find((s) => s.id === activeRunningStepId)
  const nextStep = sequence.steps.find(
    (s) => !activeRun.completedStepIds.includes(s.id) && !activeRun.runningStepIds.includes(s.id)
  )

  const [countdown, setCountdown] = useState<number | null>(null)
  const [scheduledNextStepId, setScheduledNextStepId] = useState<string | null>(null)
  const scheduledForStepIdRef = useRef<string | null>(null)

  const handleRunStep = async (stepId: string): Promise<void> => {
    try {
      await runSequenceStep(stepId, sequence)
    } catch {
      toast.error('Không thể chạy bước này')
    }
  }

  // Khi bước đang chạy thay đổi, tự động lên lịch chạy bước kế tiếp nếu có delaySeconds
  useEffect(() => {
    if (!currentStep || !nextStep) {
      setCountdown(null)
      setScheduledNextStepId(null)
      scheduledForStepIdRef.current = null
      return
    }

    const delaySec = currentStep.delaySeconds ?? nextStep.delaySeconds ?? 0

    if (delaySec > 0) {
      if (scheduledForStepIdRef.current !== currentStep.id) {
        scheduledForStepIdRef.current = currentStep.id
        setScheduledNextStepId(nextStep.id)
        setCountdown(delaySec)
      }
    } else {
      setCountdown(null)
      setScheduledNextStepId(null)
      scheduledForStepIdRef.current = null
    }
  }, [currentStep?.id, nextStep?.id, activeRun.completedStepIds.length])

  // Đếm ngược mỗi giây và kích hoạt bước tiếp theo khi về 0
  useEffect(() => {
    if (countdown === null) return

    if (countdown <= 0) {
      const stepToRunId = scheduledNextStepId
      setCountdown(null)
      setScheduledNextStepId(null)
      if (stepToRunId) {
        handleRunStep(stepToRunId)
      }
      return
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => (prev !== null && prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => clearTimeout(timer)
  }, [countdown, scheduledNextStepId])

  const handleSkipCountdownAndRun = async (stepId: string): Promise<void> => {
    setCountdown(null)
    setScheduledNextStepId(null)
    scheduledForStepIdRef.current = null
    await handleRunStep(stepId)
  }

  const handleCancelCountdown = (): void => {
    setCountdown(null)
    setScheduledNextStepId(null)
    scheduledForStepIdRef.current = null
    toast.info('Đã hủy đếm ngược tự động chạy bước tiếp theo')
  }

  const handlePauseStep = async (stepId: string): Promise<void> => {
    try {
      await pauseStep(stepId)
      setCountdown(null)
      setScheduledNextStepId(null)
      scheduledForStepIdRef.current = null
      toast.info('Đã dừng lệnh')
    } catch {
      toast.error('Không thể dừng lệnh')
    }
  }

  const handleRunNext = async (): Promise<void> => {
    if (nextStep) {
      await handleSkipCountdownAndRun(nextStep.id)
    } else {
      toast.info('Tất cả các bước trong quy trình đã hoàn thành!')
    }
  }

  const handleFinishSequence = (): void => {
    setCountdown(null)
    setScheduledNextStepId(null)
    scheduledForStepIdRef.current = null
    finishSequence()
    toast.info(`Đã kết thúc quy trình "${sequence.name}" (cửa sổ Terminal vẫn giữ nguyên)`)
  }

  const handleCloseSequence = async (): Promise<void> => {
    setCountdown(null)
    setScheduledNextStepId(null)
    scheduledForStepIdRef.current = null
    await stopSequence()
    toast.warning(`Đã đóng quy trình "${sequence.name}" và toàn bộ cửa sổ Terminal`)
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
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className={cn('text-[9px] font-medium', statusClass)}>
                      {statusLabel}
                    </span>
                    {step.delaySeconds ? (
                      <span className="text-[9px] font-mono text-amber-400/90 inline-flex items-center gap-0.5 px-1 py-0.2 bg-amber-500/10 rounded border border-amber-500/20">
                        <Clock size={8} />
                        {step.delaySeconds}s
                      </span>
                    ) : null}
                  </div>
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

      {/* Khung thông tin tiến trình & đếm ngược cố định */}
      <div className="p-2 mx-1.5 mb-1.5 bg-zinc-950/80 border border-zinc-800 rounded-lg text-xs space-y-1.5 transition-all">
        {countdown !== null && nextStep ? (
          // Trạng thái 1: Đang đếm ngược tự động chạy bước tiếp theo
          <>
            <div className="flex items-center justify-between text-amber-300 font-medium">
              <span className="flex items-center gap-1.5 text-[11px]">
                <Clock size={12} className="animate-spin text-amber-400 shrink-0" />
                <span className="truncate max-w-[110px]">
                  Tự chạy Bước {sequence.steps.indexOf(nextStep) + 1}
                </span>
              </span>
              <span className="font-mono font-bold text-xs text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">
                {countdown}s
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 truncate">
              {nextStep.name || nextStep.command}
            </p>
            <div className="flex items-center gap-1 pt-0.5">
              <Button
                size="sm"
                className="flex-1 h-5 text-[10px] bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-md cursor-pointer"
                onClick={() => handleSkipCountdownAndRun(nextStep.id)}
              >
                Chạy ngay
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 px-1.5 text-[10px] text-zinc-400 hover:text-zinc-200 rounded-md cursor-pointer"
                onClick={handleCancelCountdown}
              >
                Hủy
              </Button>
            </div>
          </>
        ) : currentStep ? (
          // Trạng thái 2: Đang thực thi một bước lệnh
          <>
            <div className="flex items-center justify-between text-emerald-300 font-medium">
              <span className="flex items-center gap-1.5 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="truncate max-w-[125px]">
                  Đang chạy Bước {sequence.steps.indexOf(currentStep) + 1}
                </span>
              </span>
              <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded border border-emerald-500/20">
                Running
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 truncate">
              {currentStep.name || currentStep.command}
            </p>
            {nextStep && (
              <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-0.5 border-t border-zinc-800/60">
                <span>Kế tiếp: Bước {sequence.steps.indexOf(nextStep) + 1}</span>
                <button
                  type="button"
                  onClick={() => handleSkipCountdownAndRun(nextStep.id)}
                  className="text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer"
                >
                  Chạy kế tiếp →
                </button>
              </div>
            )}
          </>
        ) : activeRun.completedStepIds.length === sequence.steps.length ? (
          // Trạng thái 3: Đã hoàn thành toàn bộ quy trình
          <div className="flex items-center justify-between text-emerald-400 py-0.5">
            <span className="flex items-center gap-1.5 text-[11px] font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <span>Đã xong tất cả các bước</span>
            </span>
            <span className="text-[10px] font-mono text-zinc-400">
              {sequence.steps.length}/{sequence.steps.length}
            </span>
          </div>
        ) : (
          // Trạng thái 4: Chờ / Sẵn sàng
          <div className="flex items-center justify-between text-zinc-400 py-0.5">
            <span className="flex items-center gap-1.5 text-[11px]">
              <Clock size={12} className="text-amber-400" />
              <span>Sẵn sàng quy trình</span>
            </span>
            <span className="text-[10px] font-mono text-zinc-500">
              {activeRun.completedStepIds.length}/{sequence.steps.length}
            </span>
          </div>
        )}
      </div>

      <div className="p-1.5 border-t border-zinc-800/50 space-y-1">
        <Button
          size="sm"
          className="w-full h-7 text-[11px] bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold gap-1 rounded-md cursor-pointer"
          onClick={handleRunNext}
        >
          <Play size={11} />
          Chạy lệnh tiếp theo
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="w-full h-7 text-[11px] border-amber-500/30 text-amber-400 hover:bg-amber-500/10 rounded-md cursor-pointer"
          title="Dừng các bước của quy trình nhưng giữ nguyên cửa sổ Terminal đang chạy"
          onClick={handleFinishSequence}
        >
          <Square size={10} className="mr-1" />
          Kết thúc quy trình
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="w-full h-7 text-[11px] border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-md cursor-pointer"
          title="Đóng quy trình và tắt toàn bộ cửa sổ Terminal liên quan"
          onClick={handleCloseSequence}
        >
          <X size={10} className="mr-1" />
          Đóng quy trình
        </Button>
      </div>
    </div>
  )
}
