import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSnippetHubStore } from '@/stores/snippet-hub-store'
import {
  Store,
  Search,
  Download,
  Plus,
  Terminal,
  Container,
  Code2,
  Sparkles,
  GitBranch,
  ListOrdered,
  Layers,
  ChevronDown,
  ChevronUp,
  Check,
  Eye,
  Copy,
  X,
  Wrench,
  type LucideIcon
} from 'lucide-react'
import type { SnippetPack } from '@shared/types'
import { toast } from 'sonner'
import { useTranslation } from '@/stores/i18n-store'

interface SnippetHubModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const CATEGORY_MAP: { id: string; labelEn: string; labelVi: string; icon: LucideIcon; color: string }[] = [
  { id: 'all', labelEn: 'All Packs', labelVi: 'Tất cả', icon: Store, color: 'text-emerald-400' },
  { id: 'docker', labelEn: 'Docker & K8s', labelVi: 'Docker & K8s', icon: Container, color: 'text-blue-400' },
  { id: 'nodejs', labelEn: 'Node & Web', labelVi: 'Node & Web', icon: Code2, color: 'text-emerald-400' },
  { id: 'python', labelEn: 'Python & AI', labelVi: 'Python & AI', icon: Sparkles, color: 'text-amber-400' },
  { id: 'windows', labelEn: 'Windows & Network', labelVi: 'Windows & Mạng', icon: Terminal, color: 'text-cyan-400' },
  { id: 'git', labelEn: 'Git Workflows', labelVi: 'Git Workflows', icon: GitBranch, color: 'text-orange-400' },
  { id: 'pipelines', labelEn: 'Sample Pipelines', labelVi: 'Quy Trình Mẫu', icon: ListOrdered, color: 'text-purple-400' }
]

export function SnippetHubModal({ open, onOpenChange }: SnippetHubModalProps): React.JSX.Element {
  const {
    filteredPacks,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    installPack,
    installSingleCommand,
    installedPackIds
  } = useSnippetHubStore()
  const { t, language } = useTranslation()

  const [expandedPackIds, setExpandedPackIds] = useState<Record<string, boolean>>({})
  const [installingPackId, setInstallingPackId] = useState<string | null>(null)
  const [viewingPack, setViewingPack] = useState<SnippetPack | null>(null)

  const packs = filteredPacks()

  const toggleExpand = (packId: string): void => {
    setExpandedPackIds((prev) => ({
      ...prev,
      [packId]: !prev[packId]
    }))
  }

  const handleInstallPack = async (packId: string): Promise<void> => {
    setInstallingPackId(packId)
    await installPack(packId)
    setInstallingPackId(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 w-[94vw] max-w-6xl h-[88vh] flex flex-col p-0 overflow-hidden shadow-2xl rounded-2xl">
        {/* Header */}
        <div className="p-5 pb-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Store size={22} />
            </div>
            <div>
              <DialogTitle className="text-lg sm:text-xl font-black text-zinc-100 flex items-center gap-2">
                {t('snippetHub.title')}
                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs px-2">
                  1-Click Install
                </Badge>
              </DialogTitle>
              <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                {t('snippetHub.subtitle')}
              </p>
            </div>
          </div>

          <button
            onClick={() => onOpenChange(false)}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
            title={language === 'en' ? 'Close window' : 'Đóng cửa sổ'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Category Tabs Header */}
        <div className="px-5 py-3 border-b border-zinc-800/60 bg-zinc-950/30 flex items-center justify-between">
          {/* Categories Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full pb-1 sm:pb-0">
            {CATEGORY_MAP.map((cat) => {
              const active = (selectedCategory === null && cat.id === 'all') || selectedCategory === cat.id
              const Icon = cat.icon
              const label = language === 'en' ? cat.labelEn : cat.labelVi
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id === 'all' ? null : cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 border border-transparent'
                  }`}
                >
                  <Icon size={14} className={cat.color} />
                  <span>{label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Content Cards Grid */}
        <ScrollArea className="flex-1 p-5 bg-zinc-900/50">
          {packs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Store size={48} className="text-zinc-700 mb-3 stroke-[1.5]" />
              <h4 className="text-zinc-300 font-bold text-base">{t('snippetHub.noSnippets')}</h4>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {packs.map((pack) => {
                const isExpanded = Boolean(expandedPackIds[pack.id])
                const isInstalled = installedPackIds.includes(pack.id)
                const isInstalling = installingPackId === pack.id
                const totalItems = pack.commands.length + (pack.sequences?.length || 0)

                return (
                  <div
                    key={pack.id}
                    className="bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700/80 rounded-2xl p-4 transition-all shadow-sm flex flex-col justify-between space-y-4"
                  >
                    {/* Card Header */}
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400 shrink-0">
                            {pack.category === 'docker' && <Container size={18} className="text-blue-400" />}
                            {pack.category === 'nodejs' && <Code2 size={18} className="text-emerald-400" />}
                            {pack.category === 'python' && <Sparkles size={18} className="text-amber-400" />}
                            {pack.category === 'windows' && <Terminal size={18} className="text-cyan-400" />}
                            {pack.category === 'git' && <GitBranch size={18} className="text-orange-400" />}
                            {pack.category === 'pipelines' && <ListOrdered size={18} className="text-purple-400" />}
                          </div>
                          <div>
                            <h4 className="font-bold text-zinc-100 text-sm">
                              {language === 'en' && pack.nameEn ? pack.nameEn : pack.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] text-zinc-500 font-mono">
                                {language === 'en' ? `by ${pack.author}` : `bởi ${pack.author}`}
                              </span>
                              <span className="text-zinc-700">•</span>
                              <span className="text-[11px] text-emerald-400/90 font-medium">
                                {totalItems} {pack.category === 'pipelines' ? (language === 'en' ? 'pipelines' : 'quy trình') : (language === 'en' ? 'commands' : 'câu lệnh')}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewingPack(pack)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-400 hover:bg-zinc-850 border border-zinc-800 transition-colors cursor-pointer flex items-center gap-1 text-xs"
                            title={language === 'en' ? 'View pack details' : 'Xem chi tiết gói lệnh này'}
                          >
                            <Eye size={14} />
                            <span className="hidden sm:inline text-[11px]">{language === 'en' ? 'Details' : 'Chi tiết'}</span>
                          </button>

                          <Badge
                            variant="secondary"
                            className="text-[10px] uppercase font-mono tracking-wider bg-zinc-900 border-zinc-800 text-zinc-400"
                          >
                            {pack.category}
                          </Badge>
                        </div>
                      </div>

                      <p className="text-xs text-zinc-400 mt-2.5 line-clamp-2 leading-relaxed">
                        {language === 'en' && pack.descriptionEn ? pack.descriptionEn : pack.description}
                      </p>

                      {/* Tool Requirements Badge */}
                      {(pack.toolRequirements || pack.toolRequirementsEn) && (
                        <div className="flex items-center gap-1.5 text-[11px] text-amber-400/90 font-medium bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg mt-2.5">
                          <Wrench size={12} className="shrink-0 text-amber-400" />
                          <span className="truncate">
                            {language === 'en'
                              ? `Requires: ${pack.toolRequirementsEn || pack.toolRequirements}`
                              : `Yêu cầu: ${pack.toolRequirements || pack.toolRequirementsEn}`}
                          </span>
                        </div>
                      )}

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {pack.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 text-[10px] font-mono text-zinc-400 bg-zinc-900/90 border border-zinc-800/80 rounded-md"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Expandable Preview Section */}
                    <div className="space-y-2">
                      <button
                        onClick={() => toggleExpand(pack.id)}
                        className="flex items-center justify-between w-full py-1.5 px-3 rounded-lg text-xs font-semibold text-zinc-300 hover:text-zinc-100 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800/80 transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5">
                          <Layers size={13} className="text-emerald-400" />
                          <span>
                            {isExpanded
                              ? (language === 'en' ? 'Hide command list' : 'Ẩn danh sách lệnh')
                              : (language === 'en' ? `Preview ${totalItems} commands & workflows` : `Xem trước ${totalItems} lệnh & quy trình`)}
                          </span>
                        </span>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>

                      {isExpanded && (
                        <div className="p-2.5 bg-zinc-900/90 border border-zinc-800/80 rounded-xl space-y-2 max-h-56 overflow-y-auto">
                          {pack.commands.map((cmd, idx) => (
                            <div
                              key={idx}
                              className="p-2 bg-zinc-950 border border-zinc-800/60 rounded-lg flex items-center justify-between gap-2 text-xs"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="font-semibold text-zinc-200 truncate">{cmd.name}</div>
                                <code className="text-[11px] text-emerald-400/90 font-mono truncate block mt-0.5">
                                  {cmd.command}
                                </code>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => installSingleCommand(pack.id, idx)}
                                className="h-7 px-2 text-[11px] text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 shrink-0 gap-1 cursor-pointer"
                                title={language === 'en' ? 'Add this single command' : 'Thêm riêng câu lệnh này'}
                              >
                                <Plus size={12} />
                                <span>{language === 'en' ? 'Add' : 'Thêm'}</span>
                              </Button>
                            </div>
                          ))}

                          {pack.sequences?.map((seq, idx) => (
                            <div
                              key={`seq-${idx}`}
                              className="p-2 bg-zinc-950 border border-zinc-800/60 rounded-lg space-y-1 text-xs"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-purple-300">
                                  {language === 'en' ? `Pipeline: ${seq.name}` : `Quy trình: ${seq.name}`}
                                </span>
                                <Badge className="text-[9px] bg-purple-500/10 text-purple-400 border-purple-500/20">
                                  {seq.steps?.length || 0} {language === 'en' ? (seq.steps?.length === 1 ? 'step' : 'steps') : 'bước'}
                                </Badge>
                              </div>
                              <p className="text-[11px] text-zinc-400">{seq.description}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Card Actions */}
                    <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between">
                      <span className="text-[11px] text-zinc-500">
                        {isInstalled ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                            <Check size={13} /> {language === 'en' ? 'Installed on machine' : 'Đã cài đặt trên máy'}
                          </span>
                        ) : (
                          language === 'en' ? 'Ready to install' : 'Sẵn sàng cài đặt'
                        )}
                      </span>

                      <Button
                        size="sm"
                        disabled={isInstalling}
                        onClick={() => handleInstallPack(pack.id)}
                        className={`h-8 px-4 text-xs font-bold gap-1.5 cursor-pointer ${
                          isInstalled
                            ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-zinc-950 shadow-sm'
                        }`}
                      >
                        <Download size={13} />
                        <span>
                          {isInstalling
                            ? (language === 'en' ? 'Installing...' : 'Đang cài...')
                            : isInstalled
                              ? (language === 'en' ? 'Re-install Pack' : 'Cài Đặt Lại Gói')
                              : (language === 'en' ? 'Install Full Pack' : 'Cài Đặt Toàn Bộ')}
                        </span>
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 bg-zinc-950 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="text-xs text-zinc-500 font-mono hidden md:inline">
            {language === 'en'
              ? 'CLIM Snippet Hub - Optimized CLI snippets for Windows, PowerShell & WSL'
              : 'CLIM Snippet Hub - Cộng đồng câu lệnh CLI tối ưu hóa cho Windows & WSL'}
          </span>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {/* Search Box in Footer */}
            <div className="relative w-full sm:w-72">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'en' ? 'Search by keyword, command, tag...' : 'Tìm theo từ khóa, lệnh, tag...'}
                className="bg-zinc-900 border-zinc-800 text-zinc-100 text-xs pl-8 pr-7 h-8 rounded-lg placeholder:text-zinc-500 focus-visible:ring-emerald-500/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <Button
              size="sm"
              onClick={() => onOpenChange(false)}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs px-5 h-8 font-medium cursor-pointer shrink-0"
            >
              {language === 'en' ? 'Close Hub' : 'Đóng Kho Lệnh'}
            </Button>
          </div>
        </div>

        {/* POPUP: XEM CHI TIẾT GÓI LỆNH (PACK DETAILS MODAL) */}
        {viewingPack && (
          <Dialog open={Boolean(viewingPack)} onOpenChange={(open) => !open && setViewingPack(null)}>
            <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 w-[90vw] max-w-4xl h-[82vh] flex flex-col p-0 overflow-hidden shadow-2xl rounded-2xl">
              {/* Detail Header */}
              <div className="p-5 pb-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <Store size={20} />
                  </div>
                  <div>
                    <DialogTitle className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                      {language === 'en' && viewingPack.nameEn ? viewingPack.nameEn : viewingPack.name}
                      <Badge variant="secondary" className="text-xs uppercase font-mono bg-zinc-800 text-zinc-300">
                        {viewingPack.category}
                      </Badge>
                    </DialogTitle>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {language === 'en'
                        ? `Packaged by ${viewingPack.author} • ${viewingPack.commands.length} commands ${viewingPack.sequences?.length ? `• ${viewingPack.sequences.length} pipelines` : ''}`
                        : `Được đóng gói bởi ${viewingPack.author} • ${viewingPack.commands.length} câu lệnh ${viewingPack.sequences?.length ? `• ${viewingPack.sequences.length} quy trình` : ''}`}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setViewingPack(null)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Detail Content */}
              <ScrollArea className="flex-1 p-5 space-y-5 bg-zinc-950/30">
                {/* Description & Tags */}
                <div className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-xl space-y-3">
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    {language === 'en' && viewingPack.descriptionEn ? viewingPack.descriptionEn : viewingPack.description}
                  </p>

                  {/* Tool Requirements Callout */}
                  {(viewingPack.toolRequirements || viewingPack.toolRequirementsEn) && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl flex items-center gap-2.5 text-xs text-amber-300">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0 text-amber-400">
                        <Wrench size={14} />
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-amber-200">
                          {language === 'en' ? 'Tool Requirements: ' : 'Công cụ / Công nghệ yêu cầu: '}
                        </span>
                        <span className="font-mono text-amber-300/90">
                          {language === 'en'
                            ? (viewingPack.toolRequirementsEn || viewingPack.toolRequirements)
                            : (viewingPack.toolRequirements || viewingPack.toolRequirementsEn)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {viewingPack.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 text-xs font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-md"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Commands Section */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal size={14} className="text-emerald-400" />
                    {language === 'en'
                      ? `Commands in Pack (${viewingPack.commands.length})`
                      : `Danh sách Câu lệnh trong Gói (${viewingPack.commands.length})`}
                  </h4>

                  <div className="space-y-2.5">
                    {viewingPack.commands.map((cmd, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 bg-zinc-950 border border-zinc-800/90 rounded-xl space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-zinc-200 text-sm">{cmd.name}</span>
                            <Badge className="text-[10px] bg-zinc-900 text-zinc-400 border-zinc-800 font-mono">
                              {cmd.shell || 'powershell'}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                navigator.clipboard.writeText(cmd.command)
                                toast.success(language === 'en' ? 'Command copied!' : 'Đã sao chép lệnh!')
                              }}
                              className="h-7 px-2.5 text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-800/80 gap-1 cursor-pointer"
                              title={language === 'en' ? 'Copy command' : 'Sao chép câu lệnh'}
                            >
                              <Copy size={12} />
                              <span>Copy</span>
                            </Button>

                            <Button
                              size="sm"
                              onClick={async () => {
                                await installSingleCommand(viewingPack.id, idx)
                              }}
                              className="h-7 px-2.5 text-xs bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 gap-1 cursor-pointer font-medium"
                              title={language === 'en' ? 'Add this command to your repository' : 'Thêm riêng câu lệnh này vào danh mục của bạn'}
                            >
                              <Plus size={12} />
                              <span>{language === 'en' ? 'Add Command' : 'Thêm Lệnh'}</span>
                            </Button>
                          </div>
                        </div>

                        {cmd.description && (
                          <p className="text-xs text-zinc-400">{cmd.description}</p>
                        )}

                        <div className="p-2.5 bg-zinc-900/90 border border-zinc-800 rounded-lg font-mono text-xs text-emerald-400 overflow-x-auto select-all">
                          {cmd.command}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sequences Section (if any) */}
                {viewingPack.sequences && viewingPack.sequences.length > 0 && (
                  <div className="space-y-3 pt-3">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <ListOrdered size={14} className="text-purple-400" />
                      {language === 'en'
                        ? `Sample Workflow Pipelines (${viewingPack.sequences.length})`
                        : `Quy trình Chuỗi lệnh Mẫu (${viewingPack.sequences.length})`}
                    </h4>

                    <div className="space-y-2.5">
                      {viewingPack.sequences.map((seq, sIdx) => (
                        <div
                          key={sIdx}
                          className="p-3.5 bg-zinc-950 border border-purple-500/20 rounded-xl space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-purple-300 text-sm">{seq.name}</span>
                            <Badge className="text-[10px] bg-purple-500/10 text-purple-400 border-purple-500/20">
                              {seq.steps?.length || 0} {language === 'en' ? (seq.steps?.length === 1 ? 'step' : 'steps') : 'bước thực thi'}
                            </Badge>
                          </div>
                          <p className="text-xs text-zinc-400">{seq.description}</p>
                          <div className="space-y-1 pt-1">
                            {seq.steps?.map((step, stepIdx) => (
                              <div
                                key={stepIdx}
                                className="px-2.5 py-1.5 bg-zinc-900 border border-zinc-800/80 rounded text-xs font-mono text-zinc-300 flex items-center gap-2"
                              >
                                <span className="w-4 h-4 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-[10px] font-bold">
                                  {stepIdx + 1}
                                </span>
                                <span>{step.name || step.command}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </ScrollArea>

              {/* Detail Footer */}
              <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setViewingPack(null)}
                  className="text-zinc-400 hover:text-zinc-200 text-xs px-4 h-8"
                >
                  {language === 'en' ? 'Close Details' : 'Đóng Chi Tiết'}
                </Button>

                <Button
                  size="sm"
                  onClick={async () => {
                    await handleInstallPack(viewingPack.id)
                    setViewingPack(null)
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs px-5 h-8 gap-1.5 cursor-pointer shadow-sm"
                >
                  <Download size={13} />
                  <span>{language === 'en' ? 'Install Full Pack' : 'Cài Đặt Toàn Bộ Gói Này'}</span>
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  )
}
