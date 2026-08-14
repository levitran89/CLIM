import React, { useEffect, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, XCircle, Search, ChevronDown, ChevronRight, Edit3 } from 'lucide-react'
import { toast } from 'sonner'
import type { PortInfo, Command } from '@shared/types'
import { getPortInfo } from './port-dict'

export function PortList(): React.JSX.Element {
  const [ports, setPorts] = useState<PortInfo[]>([])
  const [commands, setCommands] = useState<Command[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false)
  const [expandedPort, setExpandedPort] = useState<number | null>(null)

  const fetchPortsAndCommands = async () => {
    setLoading(true)
    try {
      const [activePorts, cmdList] = await Promise.all([
        window.api.system.getPorts(),
        window.api.commands.list()
      ])
      setPorts(activePorts)
      setCommands(cmdList)
      setHasFetchedOnce(true)
    } catch (error) {
      toast.error('Lỗi khi tải danh sách port')
    } finally {
      setLoading(false)
    }
  }

  const handleKill = async (pid: number, port: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!window.confirm(`Bạn có chắc muốn đóng port ${port} (PID: ${pid}) không?`)) return
    
    try {
      const res = await window.api.system.killPort(pid)
      if (res.success) {
        toast.success(`Đã đóng port ${port} thành công`)
        fetchPortsAndCommands() // refresh
      } else if (res.requiresAdmin) {
        toast.error('Không có quyền. Vui lòng chạy CLIM với tư cấu hành trình viên.', { duration: 5000, action: { label: 'Chi tiết', onClick: () => alert(res.error || 'Access denied') } })
      } else {
        toast.error(`Không thể đóng port ${port}: ${res.error}`)
      }
    } catch (error: any) {
      toast.error(`Lỗi: ${error.message}`)
    }
  }



  const filteredPorts = useMemo(() => {
    if (!searchQuery) return ports
    const query = searchQuery.toLowerCase()
    return ports.filter(p => 
      p.port.toString().includes(query) || 
      p.processName.toLowerCase().includes(query)
    )
  }, [ports, searchQuery])



  return (
    <div className="flex flex-col h-full bg-zinc-900/40">
      <div className="p-3 flex flex-col gap-2 border-b border-zinc-800/30">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-zinc-300">Quản lý Port</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-zinc-400 hover:text-zinc-100"
            onClick={fetchPortsAndCommands}
            disabled={loading}
            title="Làm mới"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </Button>
        </div>
        
        {hasFetchedOnce && (
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
            <input
              type="text"
              placeholder="Tìm port hoặc tên tiến trình..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950/50 border border-zinc-800/50 rounded-md py-1.5 pl-7 pr-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors"
            />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2">
        {!hasFetchedOnce ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <div className="text-zinc-500 text-sm text-center max-w-[200px]">
              Tải danh sách port có thể mất chút thời gian.
            </div>
            <Button onClick={fetchPortsAndCommands} disabled={loading} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200">
              {loading ? 'Đang lấy dữ liệu...' : 'Lấy danh sách Port'}
            </Button>
          </div>
        ) : filteredPorts.length === 0 ? (
          <div className="text-center text-zinc-500 text-sm mt-4">
            Không tìm thấy cổng nào.
          </div>
        ) : (
          <div className="space-y-2">
            {filteredPorts.map((p) => {
              const isExpanded = expandedPort === p.port
              const info = getPortInfo(p.port)
              const isSystem = info.importance === 'System'

              return (
                <div key={`${p.port}-${p.pid}`} className="flex flex-col rounded-md border border-zinc-800/50 bg-zinc-950/30 overflow-hidden">
                  <div 
                    className="group flex items-center justify-between p-2 hover:bg-zinc-800/30 transition-colors cursor-pointer"
                    onClick={() => setExpandedPort(isExpanded ? null : p.port)}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      {isExpanded ? <ChevronDown size={14} className="text-zinc-500" /> : <ChevronRight size={14} className="text-zinc-500" />}
                      <span className="text-zinc-200 font-bold font-mono text-sm w-12">:{p.port}</span>
                      <span className="text-zinc-400 text-xs truncate">
                        {p.processName}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-7 w-7 ${isSystem ? 'text-zinc-600 opacity-50 cursor-not-allowed' : 'text-red-500/70 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100'} transition-opacity`}
                      onClick={(e) => {
                        if (!isSystem) handleKill(p.pid, p.port, e)
                        else {
                          e.stopPropagation()
                          toast.error('Không thể đóng các port hệ thống để đảm bảo an toàn.')
                        }
                      }}
                      title={isSystem ? 'Port hệ thống (Không thể đóng)' : 'Đóng kết nối (Kill)'}
                    >
                      <XCircle size={15} />
                    </Button>
                  </div>
                  
                  {isExpanded && (
                    <div className="p-3 bg-zinc-900/50 border-t border-zinc-800/30 text-xs flex flex-col gap-2">
                      <div className="grid grid-cols-[100px_1fr] gap-1">
                        <span className="text-zinc-500">PID:</span>
                        <span className="text-zinc-300">{p.pid}</span>
                        <span className="text-zinc-500">Giao thức:</span>
                        <span className="text-zinc-300">{p.protocol}</span>
                        <span className="text-zinc-500">Dịch vụ:</span>
                        <span className="text-zinc-300">{info.service}</span>
                        <span className="text-zinc-500">Mức độ:</span>
                        <span className={`font-medium ${info.importance === 'System' ? 'text-red-400' : info.importance === 'Common' ? 'text-blue-400' : 'text-green-400'}`}>
                          {info.importance}
                        </span>
                        <span className="text-zinc-500 mt-1">Mô tả:</span>
                        <span className="text-zinc-400 mt-1">{info.description}</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
