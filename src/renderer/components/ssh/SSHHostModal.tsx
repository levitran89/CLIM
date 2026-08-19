import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Server,
  Key,
  Lock,
  Plus,
  Trash2,
  Network,
  Shield,
  Tag,
  Folder,
  Layers,
  Upload
} from 'lucide-react'
import type { SSHHost, SSHTunnel } from '@shared/types'
import { toast } from 'sonner'
import { useTranslation } from '@/stores/i18n-store'

interface SSHHostModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  host?: SSHHost | null
  onSave: (host: SSHHost) => void
}

export function SSHHostModal({
  open,
  onOpenChange,
  host,
  onSave
}: SSHHostModalProps): React.JSX.Element {
  const { t, language } = useTranslation()
  const [name, setName] = useState('')
  const [hostAddr, setHostAddr] = useState('')
  const [port, setPort] = useState(22)
  const [username, setUsername] = useState('root')
  const [authType, setAuthType] = useState<'password' | 'privateKey'>('password')
  const [password, setPassword] = useState('')
  const [privateKeyPath, setPrivateKeyPath] = useState('')
  const [group, setGroup] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tunnels, setTunnels] = useState<SSHTunnel[]>([])

  // Tunnel input state
  const [tunnelName, setTunnelName] = useState('')
  const [localPort, setLocalPort] = useState<number>(3000)
  const [remoteHost, setRemoteHost] = useState('localhost')
  const [remotePort, setRemotePort] = useState<number>(3000)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleBrowsePrivateKey = async () => {
    try {
      if (window.api?.system?.selectFile) {
        const filePath = await window.api.system.selectFile({
          title: language === 'en' ? 'Select Private Key (.pem, .ppk, .key, id_rsa)' : 'Chọn file Private Key (.pem, .ppk, .key, id_rsa)',
          filters: [
            { name: 'Private Keys', extensions: ['pem', 'ppk', 'key', 'id_rsa', 'id_ed25519', 'txt'] },
            { name: 'All Files', extensions: ['*'] }
          ]
        })
        if (filePath) {
          setPrivateKeyPath(filePath)
          toast.success(language === 'en' ? `Selected file: ${filePath.split('\\').pop() || filePath}` : `Đã chọn file: ${filePath.split('\\').pop() || filePath}`)
        }
      } else {
        fileInputRef.current?.click()
      }
    } catch (e: any) {
      toast.error(language === 'en' ? `File select error: ${e.message}` : `Lỗi chọn file: ${e.message}`)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const path = (file as any).path || file.name
      setPrivateKeyPath(path)
      toast.success(language === 'en' ? `Selected file: ${file.name}` : `Đã chọn file: ${file.name}`)
    }
  }
  const [tunnelType, setTunnelType] = useState<'local' | 'remote'>('local')
  const [showTunnelForm, setShowTunnelForm] = useState(false)

  useEffect(() => {
    if (host) {
      setName(host.name || '')
      setHostAddr(host.host || '')
      setPort(host.port || 22)
      setUsername(host.username || 'root')
      setAuthType(host.authType || 'password')
      setPassword(host.password || '')
      setPrivateKeyPath(host.privateKeyPath || '')
      setGroup(host.group || '')
      setTags(host.tags || [])
      setTunnels(host.tunnels || [])
    } else {
      setName('')
      setHostAddr('')
      setPort(22)
      setUsername('root')
      setAuthType('password')
      setPassword('')
      setPrivateKeyPath('')
      setGroup('')
      setTags([])
      setTunnels([])
    }
    setShowTunnelForm(false)
  }, [host, open])

  const handleAddTag = () => {
    const trimmed = tagInput.trim()
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const handleAddTunnel = () => {
    if (!localPort || !remotePort) {
      toast.error(language === 'en' ? 'Please enter both Local and Remote Port' : 'Vui lòng nhập đầy đủ Port Local và Remote')
      return
    }

    const newTunnel: SSHTunnel = {
      id: `tunnel-${Date.now()}`,
      name: tunnelName.trim() || `Port ${localPort}->${remotePort}`,
      localPort: Number(localPort),
      remoteHost: remoteHost.trim() || '127.0.0.1',
      remotePort: Number(remotePort),
      type: tunnelType
    }

    setTunnels([...tunnels, newTunnel])
    setTunnelName('')
    setLocalPort(8080)
    setRemoteHost('127.0.0.1')
    setRemotePort(80)
    setShowTunnelForm(false)
  }

  const handleRemoveTunnel = (id: string) => {
    setTunnels(tunnels.filter((t) => t.id !== id))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error(language === 'en' ? 'Please enter host display name' : 'Vui lòng nhập tên máy chủ gợi nhớ')
      return
    }
    if (!hostAddr.trim()) {
      toast.error(language === 'en' ? 'Please enter Host address / IP' : 'Vui lòng nhập địa chỉ Host / IP')
      return
    }

    const finalHost: SSHHost = {
      id: host?.id || `ssh-${Date.now()}`,
      name: name.trim(),
      host: hostAddr.trim(),
      port: Number(port) || 22,
      username: username.trim() || 'root',
      authType,
      password: authType === 'password' ? password : undefined,
      privateKeyPath: authType === 'privateKey' ? privateKeyPath.trim() : undefined,
      group: group.trim() || undefined,
      tags,
      tunnels,
      lastConnectedAt: host?.lastConnectedAt,
      createdAt: host?.createdAt || Date.now(),
      updatedAt: Date.now()
    }

    onSave(finalHost)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-zinc-950 border-zinc-800 text-zinc-100 max-h-[90vh] flex flex-col p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-zinc-800 shrink-0">
          <DialogTitle className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-zinc-100">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Server size={17} />
            </div>
            <span>
              {host
                ? (language === 'en' ? 'Edit SSH Server' : 'Chỉnh Sửa Máy Chủ SSH')
                : (language === 'en' ? 'Add New SSH Server' : 'Thêm Máy Chủ SSH Mới')}
            </span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Tên & Nhóm */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-zinc-300">
                {language === 'en' ? 'Display Name *' : 'Tên gợi nhớ *'}
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={language === 'en' ? 'e.g. VPS Production, Cloud DB' : 'VD: VPS Production, Cloud DB'}
                className="bg-zinc-900 border-zinc-750 text-xs sm:text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-zinc-300">
                {language === 'en' ? 'Group Category' : 'Nhóm phân loại (Group)'}
              </Label>
              <Input
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                placeholder={language === 'en' ? 'e.g. Production, Staging, Lab' : 'VD: Production, Staging, Lab'}
                className="bg-zinc-900 border-zinc-750 text-xs sm:text-sm"
              />
            </div>
          </div>

          {/* Host, Port, Username */}
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-12 sm:col-span-6 space-y-1.5">
              <Label className="text-xs font-semibold text-zinc-300">
                {language === 'en' ? 'Host / IP Address *' : 'Địa chỉ Host / IP *'}
              </Label>
              <Input
                value={hostAddr}
                onChange={(e) => setHostAddr(e.target.value)}
                placeholder={language === 'en' ? 'e.g. 192.168.1.100 or domain.com' : 'VD: 192.168.1.100 hoặc domain.com'}
                className="bg-zinc-900 border-zinc-750 text-xs sm:text-sm font-mono"
                required
              />
            </div>

            <div className="col-span-4 sm:col-span-2 space-y-1.5">
              <Label className="text-xs font-semibold text-zinc-300">
                {language === 'en' ? 'Port' : 'Cổng'}
              </Label>
              <Input
                type="number"
                value={port}
                onChange={(e) => setPort(Number(e.target.value))}
                placeholder="22"
                className="bg-zinc-900 border-zinc-750 text-xs sm:text-sm font-mono"
              />
            </div>

            <div className="col-span-8 sm:col-span-4 space-y-1.5">
              <Label className="text-xs font-semibold text-zinc-300">Username *</Label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="root / ubuntu"
                className="bg-zinc-900 border-zinc-750 text-xs sm:text-sm font-mono"
                required
              />
            </div>
          </div>

          {/* Xác thực (Auth Type) */}
          <div className="p-3.5 bg-zinc-900/70 border border-zinc-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Shield size={14} className="text-emerald-400" />
                {language === 'en' ? 'Authentication Method' : 'Phương thức xác thực'}
              </Label>

              <div className="flex items-center bg-zinc-950 p-0.5 rounded-lg border border-zinc-800 text-xs">
                <button
                  type="button"
                  onClick={() => setAuthType('password')}
                  className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    authType === 'password'
                      ? 'bg-zinc-800 text-emerald-400 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {language === 'en' ? 'Password' : 'Mật khẩu'}
                </button>
                <button
                  type="button"
                  onClick={() => setAuthType('privateKey')}
                  className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    authType === 'privateKey'
                      ? 'bg-zinc-800 text-emerald-400 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Private Key (.pem/.ppk)
                </button>
              </div>
            </div>

            {authType === 'password' ? (
              <div className="space-y-1.5 pt-1">
                <Label className="text-[11px] text-zinc-400">
                  {language === 'en' ? 'SSH Password (optional to save)' : 'Mật khẩu SSH (tùy chọn lưu)'}
                </Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={language === 'en' ? 'Enter SSH password (or enter upon opening terminal)' : 'Nhập mật khẩu SSH (hoặc nhập trực tiếp khi mở terminal)'}
                  className="bg-zinc-950 border-zinc-800 text-xs sm:text-sm"
                />
              </div>
            ) : (
              <div className="space-y-1.5 pt-1">
                <Label className="text-[11px] text-zinc-400">
                  {language === 'en' ? 'Private Key File Path (.pem, .ppk, id_rsa)' : 'Đường dẫn file Private Key (.pem, .ppk, id_rsa)'}
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={privateKeyPath}
                    onChange={(e) => setPrivateKeyPath(e.target.value)}
                    placeholder={language === 'en' ? 'e.g. C:\\Users\\user\\.ssh\\id_rsa or /keys/server.pem' : 'VD: C:\\Users\\user\\.ssh\\id_rsa hoặc /keys/server.pem'}
                    className="bg-zinc-950 border-zinc-800 text-xs sm:text-sm font-mono flex-1"
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBrowsePrivateKey}
                    className="h-9 px-3 text-xs bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-purple-300 hover:text-purple-200 gap-1.5 cursor-pointer shrink-0"
                  >
                    <Upload size={13} className="text-purple-400" />
                    <span>{language === 'en' ? 'Upload File' : 'Tải Lên File'}</span>
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Port Forwarding Tunnels */}
          <div className="p-3.5 bg-zinc-900/70 border border-zinc-800 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Network size={14} className="text-purple-400" />
                {language === 'en' ? 'Port Forwarding Tunnels' : 'Đường Hầm Chuyển Tiếp (Port Forwarding Tunnels)'}
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowTunnelForm(!showTunnelForm)}
                className="h-7 px-2 text-xs text-purple-400 hover:text-purple-300 hover:bg-purple-500/15 gap-1 cursor-pointer"
              >
                <Plus size={13} />
                <span>{language === 'en' ? 'Add Tunnel' : 'Thêm Tunnel'}</span>
              </Button>
            </div>

            {/* List tunnels */}
            {tunnels.length > 0 && (
              <div className="space-y-1.5">
                {tunnels.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] text-purple-400 border-purple-500/30">
                        {t.type === 'local' ? '-L Local' : '-R Remote'}
                      </Badge>
                      <span className="text-zinc-200 font-bold">:{t.localPort}</span>
                      <span className="text-zinc-500">➔</span>
                      <span className="text-zinc-300">{t.remoteHost}:{t.remotePort}</span>
                      <span className="text-zinc-500 font-sans text-[11px]">({t.name})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveTunnel(t.id)}
                      className="text-zinc-500 hover:text-red-400 p-1 cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Form add tunnel */}
            {showTunnelForm && (
              <div className="p-3 bg-zinc-950 rounded-lg border border-purple-500/30 space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px] text-zinc-400">
                      {language === 'en' ? 'Tunnel Name' : 'Tên Tunnel'}
                    </Label>
                    <Input
                      value={tunnelName}
                      onChange={(e) => setTunnelName(e.target.value)}
                      placeholder={language === 'en' ? 'e.g. MySQL Tunnel' : 'VD: MySQL Tunnel'}
                      className="h-7 text-xs bg-zinc-900 border-zinc-800"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-zinc-400">
                      {language === 'en' ? 'Tunnel Type' : 'Loại Tunnel'}
                    </Label>
                    <select
                      value={tunnelType}
                      onChange={(e) => setTunnelType(e.target.value as 'local' | 'remote')}
                      className="w-full h-7 text-xs bg-zinc-900 border border-zinc-800 rounded px-2 text-zinc-200"
                    >
                      <option value="local">Local Forwarding (-L)</option>
                      <option value="remote">Remote Forwarding (-R)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-[10px] text-zinc-400">Local Port</Label>
                    <Input
                      type="number"
                      value={localPort}
                      onChange={(e) => setLocalPort(Number(e.target.value))}
                      placeholder="8080"
                      className="h-7 text-xs bg-zinc-900 border-zinc-800 font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-zinc-400">Remote Host</Label>
                    <Input
                      value={remoteHost}
                      onChange={(e) => setRemoteHost(e.target.value)}
                      placeholder="127.0.0.1"
                      className="h-7 text-xs bg-zinc-900 border-zinc-800 font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-zinc-400">Remote Port</Label>
                    <Input
                      type="number"
                      value={remotePort}
                      onChange={(e) => setRemotePort(Number(e.target.value))}
                      placeholder="80"
                      className="h-7 text-xs bg-zinc-900 border-zinc-800 font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-1.5 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowTunnelForm(false)}
                    className="h-6 text-xs text-zinc-400"
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddTunnel}
                    className="h-6 text-xs bg-purple-600 hover:bg-purple-500 text-white"
                  >
                    {t('common.add')}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Tag size={13} className="text-zinc-400" />
              {language === 'en' ? 'Tags' : 'Thẻ phân loại (Tags)'}
            </Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddTag()
                  }
                }}
                placeholder={language === 'en' ? 'Enter tag and press Enter (e.g. aws, nginx, docker)...' : 'Nhập tag rồi ấn Enter (VD: aws, nginx, docker)...'}
                className="bg-zinc-900 border-zinc-750 text-xs sm:text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTag}
                className="border-zinc-700 bg-zinc-900 text-xs shrink-0 cursor-pointer"
              >
                {language === 'en' ? 'Add Tag' : 'Thêm Tag'}
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="bg-zinc-850 text-zinc-300 text-xs px-2 py-0.5 gap-1 border border-zinc-700"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-zinc-500 hover:text-red-400 cursor-pointer ml-0.5"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="pt-3 border-t border-zinc-800 gap-2 shrink-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-zinc-400 hover:text-zinc-200 cursor-pointer"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer shadow-sm"
            >
              {host ? (language === 'en' ? 'Save Changes' : 'Lưu Thay Đổi') : (language === 'en' ? 'Add Server' : 'Tạo Máy Chủ')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
