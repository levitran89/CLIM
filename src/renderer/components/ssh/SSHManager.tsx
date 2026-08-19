import React, { useEffect, useState, useMemo } from 'react'
import { useSSHStore, buildSSHCommand } from '@/stores/ssh-store'
import { useTerminalStore } from '@/stores/terminal-store'
import { useSettingsStore } from '@/stores/settings-store'
import { confirmAction } from '@/stores/confirm-store'
import { SSHHostModal } from './SSHHostModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Server,
  Plus,
  Search,
  Terminal,
  Activity,
  Key,
  Lock,
  Network,
  RefreshCw,
  Copy,
  Edit2,
  Trash2,
  ExternalLink,
  Tag,
  Check,
  Shield,
  Layers,
  LayoutGrid,
  Table as TableIcon,
  Maximize2,
  Minimize2,
  FolderOpen
} from 'lucide-react'
import { SFTPFileExplorerModal } from './SFTPFileExplorerModal'
import type { SSHHost } from '@shared/types'
import { toast } from 'sonner'
import { twoColumnListClass } from '@/lib/utils'
import { useTranslation } from '@/stores/i18n-store'

interface SSHManagerProps {
  onNavigateToTerminal?: () => void
}

export function SSHManager({ onNavigateToTerminal }: SSHManagerProps): React.JSX.Element {
  const {
    hosts,
    loading,
    statusMap,
    fetchHosts,
    saveHost,
    deleteHost,
    testHostConnection,
    testAllHosts
  } = useSSHStore()
  const { createTerminal } = useTerminalStore()
  const defaultShell = useSettingsStore((s) => s.settings.defaultShell)
  const { t, language } = useTranslation()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGroup, setSelectedGroup] = useState<string>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingHost, setEditingHost] = useState<SSHHost | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  const [sftpHost, setSftpHost] = useState<SSHHost | null>(null)
  const [sftpModalOpen, setSftpModalOpen] = useState(false)
  const [layoutWidth, setLayoutWidth] = useState<'centered' | 'full'>(() => {
    const saved = localStorage.getItem('clim-ssh-layout-width')
    return saved === 'full' ? 'full' : 'centered'
  })

  const toggleLayoutWidth = () => {
    const next = layoutWidth === 'centered' ? 'full' : 'centered'
    setLayoutWidth(next)
    localStorage.setItem('clim-ssh-layout-width', next)
  }

  useEffect(() => {
    fetchHosts()
  }, [])

  // Unique groups
  const groups = useMemo(() => {
    const set = new Set<string>()
    hosts.forEach((h) => {
      if (h.group) set.add(h.group)
    })
    return Array.from(set)
  }, [hosts])

  // Filtered hosts
  const filteredHosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return hosts.filter((h) => {
      const matchGroup = selectedGroup === 'all' || h.group === selectedGroup
      if (!matchGroup) return false
      if (!q) return true
      return (
        h.name.toLowerCase().includes(q) ||
        h.host.toLowerCase().includes(q) ||
        h.username.toLowerCase().includes(q)
      )
    })
  }, [hosts, searchQuery, selectedGroup])

  // Connect to host in Terminal
  const handleConnect = async (host: SSHHost) => {
    const cmd = buildSSHCommand(host)

    // Create a new terminal session
    const sessionId = await createTerminal({
      shell: defaultShell || 'powershell',
      title: `SSH: ${host.name}`
    })

    // Update lastConnectedAt
    saveHost({ ...host, lastConnectedAt: Date.now() })

    // Execute SSH command after brief delay
    setTimeout(() => {
      window.api.terminal.input(sessionId, `${cmd}\r`)
    }, 400)

    toast.success(`Đang kết nối SSH tới "${host.name}" (${host.host})`)
    onNavigateToTerminal?.()
  }

  const handleCopyCommand = (host: SSHHost, e?: React.MouseEvent) => {
    e?.stopPropagation()
    const cmd = buildSSHCommand(host)
    navigator.clipboard.writeText(cmd)
    setCopiedId(host.id)
    setTimeout(() => setCopiedId(null), 1500)
    toast.success(language === 'en' ? 'SSH command copied to clipboard' : 'Đã sao chép lệnh SSH vào Clipboard')
  }

  const handleDelete = async (host: SSHHost, e?: React.MouseEvent) => {
    e?.stopPropagation()
    const ok = await confirmAction({
      title: language === 'en' ? `Delete host "${host.name}"` : `Xóa máy chủ "${host.name}"`,
      description: language === 'en' ? `Are you sure you want to delete ${host.username}@${host.host}?` : `Bạn có chắc chắn muốn xóa máy chủ ${host.username}@${host.host} không?`,
      confirmText: language === 'en' ? 'Delete host' : 'Xóa máy chủ',
      cancelText: t('common.cancel'),
      variant: 'destructive'
    })
    if (ok) deleteHost(host.id)
  }

  return (
    <div className="flex flex-col h-full w-full bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-3 border-b border-zinc-800/80 shrink-0 gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Server size={17} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-zinc-100 flex items-center gap-2">
              <span>{t('ssh.title')}</span>
              <Badge variant="secondary" className="bg-zinc-900 text-zinc-300 font-mono text-xs px-2 py-0 border border-zinc-800">
                {hosts.length} {language === 'en' ? 'Hosts' : 'Máy chủ'}
              </Badge>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={testAllHosts}
            className="border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs h-8 px-3 gap-1.5 cursor-pointer shadow-sm whitespace-nowrap"
            title={language === 'en' ? 'Ping all remote SSH hosts' : 'Kiểm tra độ trễ mạng (Ping) toàn bộ máy chủ'}
          >
            <Activity size={13} className="text-emerald-400" />
            <span>Ping {t('common.all')}</span>
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setEditingHost(null)
              setModalOpen(true)
            }}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-8 px-3.5 gap-1.5 cursor-pointer shadow-sm whitespace-nowrap"
          >
            <Plus size={14} />
            <span>{t('ssh.addServer')}</span>
          </Button>
        </div>
      </div>

      {/* Filter & View Mode Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-2.5 bg-zinc-900/60 border-b border-zinc-800/60 shrink-0 gap-2">
        {/* Left: Search & Groups */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('ssh.searchPlaceholder')}
              className="bg-zinc-950 border-zinc-800 text-zinc-200 placeholder:text-zinc-500 text-xs h-8 pl-9 font-mono"
            />
          </div>

          {/* Group Filter */}
          {groups.length > 0 && (
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
              <button
                onClick={() => setSelectedGroup('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedGroup === 'all'
                    ? 'bg-zinc-800 text-emerald-400 border border-zinc-700'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
                }`}
              >
                {t('common.all')} ({hosts.length})
              </button>
              {groups.map((grp) => (
                <button
                  key={grp}
                  onClick={() => setSelectedGroup(grp)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedGroup === grp
                      ? 'bg-zinc-800 text-emerald-400 border border-zinc-700'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
                  }`}
                >
                  {grp}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: View Mode Toggle */}
        <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-lg p-0.5 shrink-0">
          <button
            onClick={() => setViewMode('cards')}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              viewMode === 'cards' ? 'bg-zinc-800 text-emerald-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title="Chế độ Thẻ Lưới"
          >
            <LayoutGrid size={14} />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              viewMode === 'table' ? 'bg-zinc-800 text-emerald-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title="Chế độ Bảng Danh Sách"
          >
            <TableIcon size={14} />
          </button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className={`h-8 w-8 shrink-0 ${
            layoutWidth === 'centered'
              ? 'text-emerald-400 hover:text-emerald-300 bg-emerald-500/10'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
          }`}
          onClick={toggleLayoutWidth}
          title={layoutWidth === 'centered' ? 'Chuyển sang chế độ Tràn viền' : 'Chuyển sang chế độ Dạng Web ở giữa'}
        >
          {layoutWidth === 'centered' ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </Button>
      </div>

      {/* Main Content Area */}
      <ScrollArea className="flex-1 min-h-0 w-full">
        <div className={layoutWidth === 'centered' ? 'max-w-4xl mx-auto px-4 py-4 pb-8' : 'px-4 sm:px-6 py-4 pb-8'}>
          {filteredHosts.length === 0 ? (
            <div className="p-12 text-center bg-zinc-900/30 border border-zinc-800/80 rounded-2xl max-w-lg mx-auto my-8">
              <Server size={36} className="mx-auto text-zinc-600 mb-3" />
              <h3 className="text-base font-bold text-zinc-200">
                {searchQuery ? 'Không tìm thấy máy chủ phù hợp' : 'Chưa có máy chủ SSH nào'}
              </h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
                Lưu trữ các máy chủ VPS, Cloud Server để kết nối SSH trực tiếp 1-click vào terminal.
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => {
                    setEditingHost(null)
                    setModalOpen(true)
                  }}
                  className="mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-8 px-4 gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus size={14} />
                  <span>Thêm Máy Chủ Đầu Tiên</span>
                </Button>
              )}
            </div>
          ) : viewMode === 'cards' ? (
            /* ─── CARDS VIEW ─── */
            <div className={`${twoColumnListClass} pb-4`}>
              {filteredHosts.map((host) => {
                const status = statusMap[host.id]
                const isOnline = status?.status === 'online'
                const isChecking = status?.status === 'checking'
                const isOffline = status?.status === 'offline'

                return (
                  <div
                    key={host.id}
                    className="group p-4 rounded-xl border border-zinc-800/80 bg-zinc-950/80 hover:bg-zinc-900/90 hover:border-zinc-700 transition-all shadow-sm flex flex-col justify-between space-y-3"
                  >
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm sm:text-base font-bold text-zinc-100 truncate group-hover:text-emerald-300 transition-colors">
                            {host.name}
                          </span>
                          {host.group && (
                            <Badge variant="outline" className="text-[10px] text-zinc-400 border-zinc-800 font-normal">
                              {host.group}
                            </Badge>
                          )}
                        </div>

                        <p className="text-xs font-mono text-zinc-400 truncate mt-1 flex items-center gap-1.5">
                          <strong className="text-zinc-200">{host.username}</strong>
                          <span className="text-zinc-600">@</span>
                          <span className="text-emerald-400 font-semibold">{host.host}</span>
                          {host.port && host.port !== 22 && (
                            <span className="text-zinc-500">:{host.port}</span>
                          )}
                        </p>
                      </div>

                      {/* Ping Status Badge */}
                      <button
                        type="button"
                        onClick={() => testHostConnection(host)}
                        className="cursor-pointer shrink-0"
                        title={language === 'en' ? 'Click to re-test connection' : 'Bấm để kiểm tra kết nối lại'}
                      >
                        {isChecking ? (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px] gap-1 font-mono">
                            <RefreshCw size={10} className="animate-spin" />
                            {language === 'en' ? 'Pinging...' : 'Đang ping...'}
                          </Badge>
                        ) : isOnline ? (
                          <Badge variant="outline" className="bg-emerald-500/15 text-emerald-400 border-emerald-500/40 text-[10px] gap-1 font-mono font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            {status.latencyMs ? `${status.latencyMs}ms` : 'Online'}
                          </Badge>
                        ) : isOffline ? (
                          <Badge variant="outline" className="bg-red-500/15 text-red-400 border-red-500/40 text-[10px] gap-1 font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                            Offline
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-zinc-900 text-zinc-400 border-zinc-800 text-[10px] hover:text-zinc-200 font-mono">
                            Ping
                          </Badge>
                        )}
                      </button>
                    </div>

                    {/* Meta info & Tunnels */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-zinc-850 text-xs">
                      <div className="flex items-center gap-1 text-[11px] text-zinc-500 font-mono">
                        {host.authType === 'privateKey' ? (
                          <span className="flex items-center gap-1 text-purple-300">
                            <Key size={11} className="text-purple-400" />
                            Key (.pem)
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-zinc-400">
                            <Lock size={11} />
                            {language === 'en' ? 'Password' : 'Mật khẩu'}
                          </span>
                        )}
                      </div>

                      {host.tunnels && host.tunnels.length > 0 && (
                        <Badge variant="secondary" className="bg-purple-500/15 text-purple-300 border-purple-500/30 text-[10px] gap-1 font-mono">
                          <Network size={10} />
                          {host.tunnels.length} Tunnels
                        </Badge>
                      )}

                      {host.tags && host.tags.length > 0 && (
                        <div className="flex items-center gap-1 ml-auto">
                          {host.tags.slice(0, 2).map((tTag) => (
                            <span key={tTag} className="text-[10px] text-zinc-400 bg-zinc-900 px-1.5 py-0.2 rounded border border-zinc-800">
                              #{tTag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-zinc-850">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleCopyCommand(host, e)}
                          className="h-7 px-2 text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded gap-1 cursor-pointer"
                          title={language === 'en' ? 'Copy SSH command' : 'Sao chép lệnh SSH'}
                        >
                          {copiedId === host.id ? (
                            <Check size={12} className="text-emerald-400" />
                          ) : (
                            <Copy size={12} />
                          )}
                          <span className="hidden sm:inline">{t('common.copy')}</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingHost(host)
                            setModalOpen(true)
                          }}
                          className="h-7 px-2 text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded gap-1 cursor-pointer"
                          title={language === 'en' ? 'Edit host' : 'Chỉnh sửa máy chủ'}
                        >
                          <Edit2 size={12} />
                          <span className="hidden sm:inline">{t('common.edit')}</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSftpHost(host)
                            setSftpModalOpen(true)
                          }}
                          className="h-7 px-2 text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-500/15 rounded gap-1 cursor-pointer"
                          title={language === 'en' ? 'Open SFTP File Explorer' : 'Mở Quản lý tệp SFTP'}
                        >
                          <FolderOpen size={12} />
                          <span className="hidden sm:inline">SFTP</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDelete(host, e)}
                          className="h-7 px-2 text-xs text-zinc-400 hover:text-red-400 hover:bg-red-500/15 rounded cursor-pointer"
                          title={language === 'en' ? 'Delete host' : 'Xóa máy chủ'}
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>

                      {/* 1-Click Connect Button */}
                      <Button
                        size="sm"
                        onClick={() => handleConnect(host)}
                        className="h-7.5 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Terminal size={13} />
                        <span>{language === 'en' ? 'Connect' : 'Kết Nối'}</span>
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            /* ─── TABLE VIEW ─── */
            <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/60 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-zinc-950 text-zinc-400 uppercase font-semibold border-b border-zinc-800 select-none">
                    <tr>
                      <th className="py-3 px-4">{language === 'en' ? 'Server Name' : 'Tên Máy Chủ'}</th>
                      <th className="py-3 px-4">{language === 'en' ? 'Host / IP Address' : 'Địa Chỉ Host / IP'}</th>
                      <th className="py-3 px-4 w-32">{language === 'en' ? 'Auth' : 'Xác Thực'}</th>
                      <th className="py-3 px-4 w-36">{language === 'en' ? 'Status' : 'Trạng Thái'}</th>
                      <th className="py-3 px-4 w-44 text-right">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {filteredHosts.map((host) => {
                      const status = statusMap[host.id]
                      const isOnline = status?.status === 'online'
                      const isChecking = status?.status === 'checking'
                      const isOffline = status?.status === 'offline'

                      return (
                        <tr key={host.id} className="hover:bg-zinc-800/40 transition-colors group">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-zinc-100 text-sm">{host.name}</span>
                              {host.group && (
                                <Badge variant="outline" className="text-[10px] text-zinc-400 border-zinc-800">
                                  {host.group}
                                </Badge>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-4 font-mono">
                            <span className="text-zinc-400">{host.username}@</span>
                            <span className="text-emerald-400 font-semibold">{host.host}</span>
                            {host.port && host.port !== 22 && (
                              <span className="text-zinc-500">:{host.port}</span>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            {host.authType === 'privateKey' ? (
                              <Badge variant="outline" className="text-[10px] text-purple-300 border-purple-500/30 gap-1 font-mono">
                                <Key size={10} /> Key
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] text-zinc-400 border-zinc-800 gap-1">
                                <Lock size={10} /> {language === 'en' ? 'Password' : 'Mật khẩu'}
                              </Badge>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <button
                              type="button"
                              onClick={() => testHostConnection(host)}
                              className="cursor-pointer"
                            >
                              {isChecking ? (
                                <span className="text-amber-400 font-mono text-xs">Checking...</span>
                              ) : isOnline ? (
                                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/40 text-[10px] font-mono">
                                  {status.latencyMs ? `${status.latencyMs}ms` : 'Online'}
                                </Badge>
                              ) : isOffline ? (
                                <Badge className="bg-red-500/15 text-red-400 border-red-500/40 text-[10px] font-mono">
                                  Offline
                                </Badge>
                              ) : (
                                <span className="text-zinc-500 hover:text-zinc-300 text-xs">Ping</span>
                              )}
                            </button>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => handleCopyCommand(host, e)}
                                className="h-6.5 px-2 text-xs text-zinc-400 hover:text-zinc-100"
                                title={language === 'en' ? 'Copy SSH command' : 'Sao chép lệnh SSH'}
                              >
                                {copiedId === host.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingHost(host)
                                  setModalOpen(true)
                                }}
                                className="h-6.5 px-2 text-xs text-zinc-400 hover:text-zinc-100"
                                title={t('common.edit')}
                              >
                                <Edit2 size={12} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => handleDelete(host, e)}
                                className="h-6.5 px-2 text-xs text-zinc-400 hover:text-red-400"
                                title={t('common.delete')}
                              >
                                <Trash2 size={12} />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleConnect(host)}
                                className="h-6.5 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1 ml-1"
                              >
                                <Terminal size={11} />
                                <span>{language === 'en' ? 'Connect' : 'Kết Nối'}</span>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* SSH Host Form Modal */}
      <SSHHostModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        host={editingHost}
        onSave={saveHost}
      />

      {/* SFTP File Explorer Modal */}
      <SFTPFileExplorerModal
        open={sftpModalOpen}
        onOpenChange={setSftpModalOpen}
        host={sftpHost}
      />
    </div>
  )
}
