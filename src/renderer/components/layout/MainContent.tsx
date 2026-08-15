import React, { useState } from 'react'
import { CommandList } from '@/components/commands/CommandList'
import { PortList } from '@/components/ports/PortList'
import { TerminalGrid } from '@/components/terminal/TerminalGrid'
import { SequenceManager } from '@/components/sequences/SequenceManager'

type AppTab = 'commands' | 'sequences' | 'terminal' | 'ports'

export function MainContent(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<AppTab>('commands')

  const tabClass = (tab: AppTab, accent = false): string => {
    const active = activeTab === tab
    if (accent) {
      return `px-4 py-2 text-sm font-medium rounded-sm transition-all ${
        active
          ? 'bg-emerald-600/20 text-emerald-300 shadow-sm border border-emerald-500/30'
          : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30 border border-transparent'
      }`
    }
    return `px-4 py-2 text-sm font-medium rounded-sm transition-all ${
      active
        ? 'bg-zinc-800 text-zinc-100 shadow-sm'
        : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30'
    }`
  }

  return (
    <div className="flex flex-col h-full w-full bg-zinc-950">
      {/* Lệnh, Dãy lệnh bên trái — Terminal, Ports bên phải */}
      <div className="flex items-center justify-between bg-zinc-900/60 px-4 py-2 border-b border-zinc-800/50">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setActiveTab('commands')}
            className={tabClass('commands')}
          >
            Lệnh
          </button>
          <button
            onClick={() => setActiveTab('sequences')}
            className={tabClass('sequences')}
          >
            Dãy lệnh
          </button>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => setActiveTab('terminal')}
            className={tabClass('terminal', true)}
          >
            Terminal
          </button>
          <button
            onClick={() => setActiveTab('ports')}
            className={tabClass('ports')}
          >
            Ports
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'commands' && (
          <CommandList onNavigateToTerminal={() => setActiveTab('terminal')} />
        )}
        {activeTab === 'sequences' && (
          <SequenceManager onNavigateToTerminal={() => setActiveTab('terminal')} />
        )}
        {activeTab === 'terminal' && <TerminalGrid />}
        {activeTab === 'ports' && <PortList />}
      </div>
    </div>
  )
}
