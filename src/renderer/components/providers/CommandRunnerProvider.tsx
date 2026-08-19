import React, { createContext, useContext, useState, ReactNode } from 'react'
import { VariablePromptModal } from '../commands/VariablePromptModal'
import { useTerminalStore } from '@/stores/terminal-store'
import { useProfileStore } from '@/stores/profile-store'
import { useSequenceStore } from '@/stores/sequence-store'
import type { Command, CommandSequence } from '@shared/types'
import { toast } from 'sonner'

interface CommandRunnerContextValue {
  runCommand: (cmd: Command, onNavigate?: () => void) => Promise<void>
  runSequence: (seq: CommandSequence, onNavigate?: () => void) => Promise<void>
  runSequenceStep: (stepId: string, seq: CommandSequence) => Promise<void>
}

const CommandRunnerContext = createContext<CommandRunnerContextValue | null>(null)

export const useCommandRunner = () => {
  const context = useContext(CommandRunnerContext)
  if (!context) {
    throw new Error('useCommandRunner must be used within CommandRunnerProvider')
  }
  return context
}

export const CommandRunnerProvider = ({ children }: { children: ReactNode }) => {
  const [promptModalOpen, setPromptModalOpen] = useState(false)
  const [promptingCommand, setPromptingCommand] = useState<Command | null>(null)
  const [promptingSequence, setPromptingSequence] = useState<CommandSequence | null>(null)
  const [promptingStepId, setPromptingStepId] = useState<string | null>(null)
  const [promptingVariables, setPromptingVariables] = useState<string[]>([])
  
  const [navigateCallback, setNavigateCallback] = useState<(() => void) | null>(null)

  const { createTerminal, sessions, setActiveSession } = useTerminalStore()
  const { getActiveProfile } = useProfileStore()
  const { startSequence, activeRun } = useSequenceStore()

  const extractVariables = (text: string): string[] => {
    const regex = /(\$\{([^}]+)\}|\{\{([^}]+)\}\}|\$env:([a-zA-Z0-9_]+))/g
    const matches: string[] = []
    let m: RegExpExecArray | null
    while ((m = regex.exec(text)) !== null) {
      const raw = m[2] || m[3] || m[4] || ''
      const varName = raw.split(':-')[0].trim()
      if (varName) matches.push(varName)
    }
    return Array.from(new Set(matches))
  }

  const executeCommandDirectly = async (command: Command, actualCommandString: string, onNavigate?: () => void) => {
    const existingSession = sessions.find(
      (s) => s.commandId === command.id && s.status === 'running'
    )
    if (existingSession) {
      if (existingSession.isBackground) {
        useTerminalStore.getState().updateSession(existingSession.id, { isBackground: false })
      }
      setActiveSession(existingSession.id)
      onNavigate?.()
      return
    }

    const activeProfile = getActiveProfile()
    toast.info(`Đang khởi chạy "${command.name}"...`)
    const sessionId = await createTerminal({
      shell: command.shell || 'powershell',
      cwd: command.workingDirectory,
      title: command.name,
      commandId: command.id,
      env: activeProfile?.variables
    })
    setActiveSession(sessionId)
    onNavigate?.()
    setTimeout(() => {
      window.api.terminal.input(sessionId, actualCommandString + '\r\n')
    }, 500)
  }

  const executeSequenceDirectly = async (sequence: CommandSequence, actualSequence: CommandSequence, onNavigate?: () => void) => {
    if (sequence.steps.length === 0) {
      toast.error('Dãy lệnh trống')
      return
    }
    if (activeRun) {
      toast.error('Đang có quy trình khác chạy. Hãy kết thúc trên tab Terminal trước.')
      return
    }

    try {
      await startSequence(actualSequence)
      onNavigate?.()
      const mode = sequence.runMode || 'first'
      if (mode === 'none') {
        toast.info(`Đã mở terminal cho "${sequence.name}". Chọn lệnh bên trái để chạy.`)
      } else if (mode === 'first') {
        toast.info(`Đã chạy lệnh đầu của "${sequence.name}"`)
      } else {
        toast.info(`Đã chạy tất cả lệnh của "${sequence.name}"`)
      }
    } catch {
      toast.error('Không thể khởi chạy quy trình')
    }
  }

  const runCommand = async (cmd: Command, onNavigate?: () => void) => {
    const vars = extractVariables(cmd.command)
    if (vars.length > 0) {
      setPromptingCommand(cmd)
      setPromptingSequence(null)
      setPromptingVariables(vars)
      setNavigateCallback(() => onNavigate)
      setPromptModalOpen(true)
    } else {
      await executeCommandDirectly(cmd, cmd.command, onNavigate)
    }
  }

  const runSequence = async (seq: CommandSequence, onNavigate?: () => void) => {
    const runMode = seq.runMode || 'first'
    
    // Nếu chế độ Không tự động chạy (none), bỏ qua hỏi biến toàn cục, 
    // để SequenceRunnerPanel tự hỏi khi bấm từng lệnh (Option B)
    if (runMode === 'none') {
      await executeSequenceDirectly(seq, seq, onNavigate)
      return
    }

    const allVars = new Set<string>()
    if (runMode === 'first' && seq.steps.length > 0) {
      extractVariables(seq.steps[0].command).forEach(v => allVars.add(v))
    } else if (runMode === 'all') {
      seq.steps.forEach(step => {
        extractVariables(step.command).forEach(v => allVars.add(v))
      })
    }

    const uniqueVars = Array.from(allVars)
    if (uniqueVars.length > 0) {
      setPromptingSequence(seq)
      setPromptingCommand(null)
      setPromptingStepId(null)
      setPromptingVariables(uniqueVars)
      setNavigateCallback(() => onNavigate)
      
      const tempCommand: Command = {
        id: seq.id,
        name: seq.name,
        command: runMode === 'first' ? seq.steps[0].command : seq.steps.map(s => s.command).join('\n'),
        category: seq.category,
        shell: seq.shell || 'powershell',
        tags: seq.tags,
        createdAt: seq.createdAt,
        updatedAt: seq.updatedAt
      }
      setPromptingCommand(tempCommand)
      
      setPromptModalOpen(true)
    } else {
      await executeSequenceDirectly(seq, seq, onNavigate)
    }
  }

  const runSequenceStep = async (stepId: string, seq: CommandSequence) => {
    const step = seq.steps.find((s) => s.id === stepId)
    if (!step) return
    const vars = extractVariables(step.command)
    if (vars.length > 0) {
      const tempCommand: Command = {
        id: step.id,
        name: step.name || `Bước: ${seq.name}`,
        command: step.command,
        category: seq.category,
        shell: seq.shell || 'powershell',
        tags: seq.tags,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
      setPromptingCommand(tempCommand)
      setPromptingSequence(null)
      setPromptingStepId(stepId)
      setPromptingVariables(vars)
      setNavigateCallback(null)
      setPromptModalOpen(true)
    } else {
      await useSequenceStore.getState().runStep(stepId)
    }
  }

  const handleConfirmPrompt = (finalCommandString: string, values: Record<string, string>) => {
    if (promptingStepId) {
      useSequenceStore.getState().runStep(promptingStepId, finalCommandString)
    } else if (promptingSequence) {
      const replaceVariables = (str: string, vals: Record<string, string>) => {
        let result = str
        promptingVariables.forEach((v) => {
          const val = vals[v] !== undefined ? vals[v] : ''
          result = result.replaceAll(`\${${v}}`, val)
          result = result.replace(new RegExp(`\\{\\{${v}(:-[^}]+)?\\}\\}`, 'g'), val)
          result = result.replace(new RegExp(`\\$env:${v}\\b`, 'gi'), val)
        })
        return result
      }
      
      const modifiedSequence: CommandSequence = {
        ...promptingSequence,
        steps: promptingSequence.steps.map(step => ({
          ...step,
          command: replaceVariables(step.command, values)
        }))
      }
      executeSequenceDirectly(promptingSequence, modifiedSequence, navigateCallback || undefined)
    } else if (promptingCommand) {
      executeCommandDirectly(promptingCommand, finalCommandString, navigateCallback || undefined)
    }
  }

  return (
    <CommandRunnerContext.Provider value={{ runCommand, runSequence, runSequenceStep }}>
      {children}
      <VariablePromptModal
        open={promptModalOpen}
        onOpenChange={(open) => {
          setPromptModalOpen(open)
          if (!open) {
            setPromptingCommand(null)
            setPromptingSequence(null)
            setPromptingStepId(null)
            setPromptingVariables([])
            setNavigateCallback(null)
          }
        }}
        command={promptingCommand}
        variables={promptingVariables}
        onConfirm={(finalCmd, values) => handleConfirmPrompt(finalCmd, values)}
      />
    </CommandRunnerContext.Provider>
  )
}
