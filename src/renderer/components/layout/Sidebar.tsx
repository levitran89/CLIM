import React, { useState } from 'react'
import { CommandList } from '@/components/commands/CommandList'
import { PortList } from '@/components/ports/PortList'
import { Button } from '@/components/ui/button'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'

export function Sidebar(): React.JSX.Element {
  const [collapsed, setCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState<'commands' | 'ports'>('commands')

  return (
    <>
      <div
        className={`
          flex flex-col border-r border-zinc-800/50 bg-zinc-900/60 backdrop-blur-sm
          transition-all duration-300 ease-in-out
          ${collapsed ? 'w-0 overflow-hidden opacity-0' : 'w-72 opacity-100'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800/30">
          <div className="flex space-x-1 bg-zinc-950/50 p-0.5 rounded-md border border-zinc-800/50">
            <button
              onClick={() => setActiveTab('commands')}
              className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${
                activeTab === 'commands' 
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Lệnh
            </button>
            <button
              onClick={() => setActiveTab('ports')}
              className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${
                activeTab === 'ports' 
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Ports
            </button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-zinc-500 hover:text-zinc-300"
            onClick={() => setCollapsed(!collapsed)}
          >
            <PanelLeftClose size={14} />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 w-72">
          {activeTab === 'commands' ? <CommandList /> : <PortList />}
        </div>
      </div>
      
      {collapsed && (
        <SidebarToggle onToggle={() => setCollapsed(false)} />
      )}
    </>
  )
}

export function SidebarToggle({
  onToggle
}: {
  onToggle: () => void
}): React.JSX.Element {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="fixed left-2 top-12 z-40 h-7 w-7 text-zinc-500 hover:text-zinc-300 bg-zinc-900/80 border border-zinc-800/50 backdrop-blur-sm"
      onClick={onToggle}
    >
      <PanelLeftOpen size={14} />
    </Button>
  )
}
