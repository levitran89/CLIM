import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  BookOpen,
  Terminal,
  Layers,
  Radio,
  ListOrdered,
  LayoutGrid,
  Variable,
  Copy,
  Sparkles,
  Sliders,
  ShieldCheck,
  Keyboard,
  Clock,
  Activity,
  Cpu,
  HardDrive,
  Cloud,
  Store,
  Bell,
  X
} from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from '@/stores/i18n-store'

export type GuideSection =
  | 'profiles'
  | 'commands'
  | 'sequences'
  | 'snippetHub'
  | 'scheduler'
  | 'terminal'
  | 'ports'
  | 'monitor'
  | 'webhooks'
  | 'cloudSync'
  | 'hotkeys'
  | 'settings'

interface GuideModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialSection?: GuideSection
}

export function GuideModal({
  open,
  onOpenChange,
  initialSection = 'profiles'
}: GuideModalProps): React.JSX.Element {
  const [activeSection, setActiveSection] = useState<GuideSection>(initialSection)
  const { language, t } = useTranslation()

  useEffect(() => {
    if (open) {
      setActiveSection(initialSection)
    }
  }, [open, initialSection])

  const copyToClipboard = (text: string): void => {
    navigator.clipboard.writeText(text)
    toast.success(language === 'en' ? `Copied: ${text}` : `Đã sao chép: ${text}`)
  }

  const sections = [
    { id: 'profiles' as GuideSection, label: t('guide.profiles'), icon: Layers },
    { id: 'commands' as GuideSection, label: t('guide.commands'), icon: Terminal },
    { id: 'sequences' as GuideSection, label: t('guide.sequences'), icon: ListOrdered },
    { id: 'snippetHub' as GuideSection, label: t('guide.snippetHub'), icon: Store },
    { id: 'scheduler' as GuideSection, label: t('guide.scheduler'), icon: Clock },
    { id: 'terminal' as GuideSection, label: t('guide.terminal'), icon: LayoutGrid },
    { id: 'ports' as GuideSection, label: t('guide.ports'), icon: Radio },
    { id: 'monitor' as GuideSection, label: t('guide.monitor'), icon: Activity },
    { id: 'webhooks' as GuideSection, label: t('guide.webhooks'), icon: Bell },
    { id: 'cloudSync' as GuideSection, label: t('guide.cloudSync'), icon: Cloud },
    { id: 'hotkeys' as GuideSection, label: t('guide.hotkeys'), icon: Keyboard },
    { id: 'settings' as GuideSection, label: t('guide.settings'), icon: Sliders }
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 w-[92vw] max-w-6xl h-[88vh] flex flex-col p-0 overflow-hidden shadow-2xl rounded-2xl">
        {/* Header */}
        <div className="p-5 pb-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <BookOpen size={22} />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-zinc-100 flex items-center gap-2.5">
                {t('guide.title')}
                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs py-0.5 font-mono">
                  Full HD Docs v1.5
                </Badge>
              </DialogTitle>
              <p className="text-sm text-zinc-400 mt-0.5">
                {t('guide.subtitle')}
              </p>
            </div>
          </div>

          {/* Close Button X */}
          <button
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
            title={language === 'en' ? 'Close window (ESC)' : 'Đóng cửa sổ (ESC)'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body with Sidebar navigation */}
        <div className="flex flex-1 min-h-0">
          {/* Navigation Sidebar */}
          <div className="w-60 bg-zinc-950/70 p-4 border-r border-zinc-800/80 space-y-1.5 shrink-0">
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider px-3 py-1">
              {t('guide.topics')}
            </div>
            {sections.map((sec) => {
              const Icon = sec.icon
              const isActive = activeSection === sec.id
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 shadow-sm font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-transparent'
                  }`}
                >
                  <Icon size={16} className={isActive ? 'text-emerald-400' : 'text-zinc-500'} />
                  <span>{sec.label}</span>
                </button>
              )
            })}
          </div>

          {/* Content Area */}
          <ScrollArea className="flex-1 p-6 text-sm text-zinc-300">
            {/* =============================================================== */}
            {/* SECTION: PROFILES & DYNAMIC VARIABLES */}
            {/* =============================================================== */}
            {activeSection === 'profiles' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2 mb-2">
                    <Layers size={18} className="text-emerald-400" />
                    {language === 'en' ? 'Environment Profiles & Variables' : 'Quản lý Môi trường (Environment Profiles)'}
                  </h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    {language === 'en'
                      ? 'Environment Profiles allow grouping environment variables (.env) tailored to specific development contexts such as Development, Staging, or Production. When activated, all defined variables are automatically injected into every terminal session you launch.'
                      : 'Environment Profiles cho phép bạn nhóm các biến môi trường (Environment Variables) theo từng ngữ cảnh làm việc như Development, Staging, hoặc Production. Khi một Profile được kích hoạt, tất cả các biến trong profile sẽ tự động được nạp vào mọi phiên Terminal bạn khởi chạy.'}
                  </p>
                </div>

                {/* Dynamic Variables Guide */}
                <div className="p-4 rounded-xl bg-zinc-950 border border-emerald-500/30 space-y-3 shadow-sm">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
                    <Variable size={18} />
                    <span>{language === 'en' ? 'Dynamic Variable Syntax in Commands:' : 'Cú pháp Biến Động trong Câu Lệnh:'} ${'{VARIABLE_NAME}'}</span>
                  </div>
                  <p className="text-zinc-300 leading-relaxed text-sm">
                    {language === 'en'
                      ? 'When saving a command with `${VARIABLE_NAME}` syntax, CLIM automatically detects it as a dynamic parameter. Whenever you click Play (Run), an interactive Variable Prompt modal will pop up for you to supply exact runtime values before execution.'
                      : 'Khi lưu một câu lệnh trong CLIM có chứa cú pháp ${TÊN_BIẾN}, CLIM sẽ tự động nhận diện đó là biến động. Mỗi khi bạn nhấn Play (Chạy), một Cửa sổ Hỏi Biến (Interactive Form) sẽ xuất hiện để bạn nhập giá trị thực tế trước khi thực thi.'}
                  </p>
                  <div className="text-zinc-300 leading-relaxed text-sm mt-2">
                    {language === 'en' ? 'Variable prompts also apply to automated Pipelines (Sequences):' : 'Cửa sổ hỏi biến này cũng áp dụng cho Quy trình (Sequences) với 2 chế độ:'}
                    <ul className="list-disc ml-5 mt-1">
                      <li>
                        {language === 'en'
                          ? 'Unified Prompt (Auto Run): Collects all dynamic variables across all pipeline steps into a single popup before execution begins.'
                          : 'Chế độ Gộp (Tùy chọn A): Nếu chạy quy trình tự động, hệ thống sẽ gom tất cả các biến của mọi lệnh và hỏi 1 lần duy nhất đầu tiên.'}
                      </li>
                      <li>
                        {language === 'en'
                          ? 'Step-by-step Prompt: If the pipeline is configured for manual step triggering, prompts appear per individual step.'
                          : 'Chế độ Từng bước (Tùy chọn B): Nếu cấu hình quy trình là "Không tự động chạy", khi bạn nhấn chạy từng lệnh riêng lẻ, hệ thống sẽ hỏi biến cho lệnh đó.'}
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Dictionary of common variables */}
                <div>
                  <h4 className="text-sm font-bold text-zinc-200 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Sparkles size={16} className="text-amber-400" />
                    {language === 'en' ? 'Suggested Common Variables Reference:' : 'Bảng tra cứu các biến thông dụng gợi ý:'}
                  </h4>
                  <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/60 shadow-sm">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="bg-zinc-900/90 border-b border-zinc-800 text-zinc-300 font-semibold text-xs uppercase">
                          <th className="p-3.5 pl-4">{language === 'en' ? 'Variable Syntax' : 'Cú pháp Biến'}</th>
                          <th className="p-3.5">{language === 'en' ? 'Meaning & Purpose' : 'Ý nghĩa & Mục đích sử dụng'}</th>
                          <th className="p-3.5">{language === 'en' ? 'Example Values' : 'Ví dụ giá trị thực tế'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/70 font-mono text-xs sm:text-sm">
                        <tr className="hover:bg-zinc-800/30 transition-colors">
                          <td className="p-3.5 pl-4 text-emerald-400 font-bold">${'{PORT}'}</td>
                          <td className="p-3.5 font-sans text-zinc-200">{language === 'en' ? 'Server Network Port' : 'Cổng mạng máy chủ (Server Port)'}</td>
                          <td className="p-3.5 text-zinc-400">3000, 8080, 5173</td>
                        </tr>
                        <tr className="hover:bg-zinc-800/30 transition-colors">
                          <td className="p-3.5 pl-4 text-emerald-400 font-bold">${'{NAME}'}</td>
                          <td className="p-3.5 font-sans text-zinc-200">{language === 'en' ? 'Project name, username, or container name' : 'Tên dự án, tên người dùng, tên container'}</td>
                          <td className="p-3.5 text-zinc-400">my-app, levi, backend-api</td>
                        </tr>
                        <tr className="hover:bg-zinc-800/30 transition-colors">
                          <td className="p-3.5 pl-4 text-emerald-400 font-bold">${'{NODE_ENV}'} / ${'{ENV}'}</td>
                          <td className="p-3.5 font-sans text-zinc-200">{language === 'en' ? 'Execution runtime environment' : 'Môi trường thực thi của dự án'}</td>
                          <td className="p-3.5 text-zinc-400">development, production, staging</td>
                        </tr>
                        <tr className="hover:bg-zinc-800/30 transition-colors">
                          <td className="p-3.5 pl-4 text-emerald-400 font-bold">${'{BRANCH}'} / ${'{TAG}'}</td>
                          <td className="p-3.5 font-sans text-zinc-200">{language === 'en' ? 'Git branch name or release tag' : 'Nhánh Git hoặc phiên bản phát hành'}</td>
                          <td className="p-3.5 text-zinc-400">main, release/v1.0.0</td>
                        </tr>
                        <tr className="hover:bg-zinc-800/30 transition-colors">
                          <td className="p-3.5 pl-4 text-emerald-400 font-bold">${'{HOST}'} / ${'{IP}'}</td>
                          <td className="p-3.5 font-sans text-zinc-200">{language === 'en' ? 'Host address or server IP' : 'Địa chỉ máy chủ (Host Address / IP)'}</td>
                          <td className="p-3.5 text-zinc-400">localhost, 127.0.0.1, 192.168.1.1</td>
                        </tr>
                        <tr className="hover:bg-zinc-800/30 transition-colors">
                          <td className="p-3.5 pl-4 text-emerald-400 font-bold">${'{DB_NAME}'} / ${'{DB_URL}'}</td>
                          <td className="p-3.5 font-sans text-zinc-200">{language === 'en' ? 'Database name or connection URI' : 'Tên database hoặc chuỗi kết nối URI'}</td>
                          <td className="p-3.5 text-zinc-400">clim_db, postgres://root@localhost</td>
                        </tr>
                        <tr className="hover:bg-zinc-800/30 transition-colors">
                          <td className="p-3.5 pl-4 text-emerald-400 font-bold">${'{API_KEY}'} / ${'{TOKEN}'}</td>
                          <td className="p-3.5 font-sans text-zinc-200">{language === 'en' ? 'Secret API Key or Access Token' : 'Khóa bí mật API hoặc Access Token'}</td>
                          <td className="p-3.5 text-zinc-400">sk_live_..., ghp_...</td>
                        </tr>
                        <tr className="hover:bg-zinc-800/30 transition-colors">
                          <td className="p-3.5 pl-4 text-emerald-400 font-bold">${'{DIR}'} / ${'{PATH}'}</td>
                          <td className="p-3.5 font-sans text-zinc-200">{language === 'en' ? 'Directory or file path' : 'Đường dẫn thư mục hoặc file'}</td>
                          <td className="p-3.5 text-zinc-400">./dist, C:\Workspace\App</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Example snippets */}
                <div>
                  <h4 className="text-sm font-bold text-zinc-200 uppercase tracking-wider mb-2.5">
                    {language === 'en' ? 'Real-world Command Examples (Click to Copy):' : 'Mẫu câu lệnh áp dụng thực tế (Bấm để copy):'}
                  </h4>
                  <div className="space-y-2.5">
                    <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between font-mono text-xs sm:text-sm">
                      <span className="text-zinc-200">npm run dev -- --port ${'{PORT}'} --host ${'{HOST}'}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2.5 text-xs text-zinc-400 hover:text-emerald-300 gap-1.5 bg-zinc-900"
                        onClick={() => copyToClipboard('npm run dev -- --port ${PORT} --host ${HOST}')}
                        title={language === 'en' ? 'Copy' : 'Sao chép'}
                      >
                        <Copy size={13} />
                        {language === 'en' ? 'Copy' : 'Sao chép'}
                      </Button>
                    </div>
                    <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between font-mono text-xs sm:text-sm">
                      <span className="text-zinc-200">docker run -d -p ${'{PORT}'}:80 --name ${'{NAME}'} nginx:alpine</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2.5 text-xs text-zinc-400 hover:text-emerald-300 gap-1.5 bg-zinc-900"
                        onClick={() => copyToClipboard('docker run -d -p ${PORT}:80 --name ${NAME} nginx:alpine')}
                        title={language === 'en' ? 'Copy' : 'Sao chép'}
                      >
                        <Copy size={13} />
                        {language === 'en' ? 'Copy' : 'Sao chép'}
                      </Button>
                    </div>
                    <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between font-mono text-xs sm:text-sm">
                      <span className="text-zinc-200">git checkout -b ${'{BRANCH}'} && git pull origin ${'{BRANCH}'}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2.5 text-xs text-zinc-400 hover:text-emerald-300 gap-1.5 bg-zinc-900"
                        onClick={() => copyToClipboard('git checkout -b ${BRANCH} && git pull origin ${BRANCH}')}
                        title={language === 'en' ? 'Copy' : 'Sao chép'}
                      >
                        <Copy size={13} />
                        {language === 'en' ? 'Copy' : 'Sao chép'}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl text-zinc-300 text-sm leading-relaxed">
                  💡 <strong className="text-emerald-300">{language === 'en' ? 'Smart Auto-fill Tip:' : 'Mẹo thông minh:'}</strong>{' '}
                  {language === 'en'
                    ? 'If your active Profile contains a key with matching name (e.g. PORT=8080), CLIM automatically pre-fills "8080" into the prompt modal!'
                    : 'Nếu trong Profile đang dùng có chứa biến cùng tên (ví dụ Profile có biến PORT=8080), khi bạn chạy câu lệnh có ${PORT}, CLIM sẽ tự động điền sẵn 8080 vào ô nhập!'}
                </div>
              </div>
            )}

            {/* =============================================================== */}
            {/* SECTION: COMMANDS */}
            {/* =============================================================== */}
            {activeSection === 'commands' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2 mb-2">
                    <Terminal size={18} className="text-emerald-400" />
                    {language === 'en' ? 'CLI Command Catalog (Commands)' : 'Quản lý Thư viện Câu lệnh (Commands)'}
                  </h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    {language === 'en'
                      ? 'Store, tag, search, and reuse everyday CLI scripts across multiple shells with speed and organization.'
                      : 'Lưu trữ, phân loại và tái sử dụng các câu lệnh CLI thường dùng của bạn một cách nhanh chóng và có tổ chức.'}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-1.5">
                    <span className="font-bold text-zinc-100 text-sm">
                      {language === 'en' ? '1. Create Commands & Tagging:' : '1. Tạo lệnh mới & Gắn Tag:'}
                    </span>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      {language === 'en'
                        ? 'Click "+ New Command", provide Name, Script, Working Directory, Shell Type (PowerShell, CMD, WSL) and organizational tags.'
                        : 'Nhấn nút + Tạo mới, nhập Tên, Câu lệnh, Thư mục làm việc (Working Directory), loại Shell (PowerShell, CMD, WSL) và các Tag phân loại.'}
                    </p>
                  </div>

                  <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-1.5">
                    <span className="font-bold text-zinc-100 text-sm">
                      {language === 'en' ? '2. Pin Favorite Commands (⭐ Star):' : '2. Ghim lệnh yêu thích (⭐ Favorite):'}
                    </span>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      {language === 'en'
                        ? 'Click the star icon to pin frequently used scripts to the top "⭐ Pinned Commands" row for 1-click execution.'
                        : 'Nhấn vào biểu tượng ngôi sao để đưa câu lệnh lên nhóm "⭐ Lệnh ghim" ở vị trí trên cùng, giúp truy cập nhanh trong 1 cú click.'}
                    </p>
                  </div>

                  <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-1.5">
                    <span className="font-bold text-zinc-100 text-sm">
                      {language === 'en' ? '3. Import & Export Library:' : '3. Nhập & Xuất thư viện (Import/Export):'}
                    </span>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      {language === 'en'
                        ? 'Use "Export JSON" to backup or transfer configs to other developer machines, and "Import JSON" to load existing script packs.'
                        : 'Sử dụng nút Xuất file JSON để sao lưu hoặc chuyển cấu hình sang máy khác, và Nhập file JSON để nạp danh sách lệnh có sẵn.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* =============================================================== */}
            {/* SECTION: SEQUENCES (QUY TRÌNH) */}
            {/* =============================================================== */}
            {activeSection === 'sequences' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2 mb-2">
                    <ListOrdered size={18} className="text-emerald-400" />
                    {language === 'en' ? 'Command Pipelines & Workflows' : 'Quản lý Quy trình (Command Pipelines / Workflows)'}
                  </h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    {language === 'en'
                      ? 'Combine multiple discrete commands into an automated continuous workflow (e.g. Build → Test → Deploy).'
                      : 'Quy trình cho phép bạn kết hợp nhiều câu lệnh đơn lẻ thành một chuỗi tự động hóa liên hoàn (ví dụ: Quy trình Build → Test → Deploy).'}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-1.5">
                    <span className="font-bold text-emerald-300 text-sm">
                      {language === 'en' ? 'Sequential Mode (Single Session / Sequential):' : 'Chế độ "Chạy tuần tự" (Single Session / Sequential):'}
                    </span>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      {language === 'en'
                        ? 'All step commands execute sequentially one after another in a single unified Terminal tab.'
                        : 'Tất cả các bước lệnh sẽ được thực thi tuần tự lần lượt trong cùng một cửa sổ Terminal duy nhất.'}
                    </p>
                  </div>

                  <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-1.5">
                    <span className="font-bold text-emerald-300 text-sm">
                      {language === 'en' ? 'Parallel Mode (Multi-session / Parallel):' : 'Chế độ "Chạy đồng thời tất cả" (Multi-session / Parallel):'}
                    </span>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      {language === 'en'
                        ? 'Every command in the pipeline spawns its own isolated Terminal session and runs concurrently in parallel.'
                        : 'Mỗi bước lệnh trong quy trình sẽ được khởi tạo trong một Terminal riêng biệt chạy song song.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* =============================================================== */}
            {/* SECTION: TERMINAL & SPLIT */}
            {/* =============================================================== */}
            {activeSection === 'terminal' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2 mb-2">
                    <LayoutGrid size={18} className="text-emerald-400" />
                    <span>Terminal</span>
                  </h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    {language === 'en'
                      ? 'High-performance GPU-accelerated terminal emulator powered by xterm.js and native node-pty.'
                      : 'Trình giả lập Terminal hiệu năng cao tích hợp xterm.js và node-pty native.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-1.5">
                    <span className="font-bold text-zinc-100 text-sm">
                      {language === 'en' ? 'Vertical Split (Left - Right)' : 'Chia đôi dọc (Vertical Split)'}
                    </span>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      {language === 'en'
                        ? 'Displays two terminal sessions side-by-side horizontally for easy log diffing.'
                        : 'Hiển thị 2 terminal cạnh nhau theo chiều ngang (Left - Right) để tiện đối chiếu log.'}
                    </p>
                  </div>
                  <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-1.5">
                    <span className="font-bold text-zinc-100 text-sm">
                      {language === 'en' ? 'Horizontal Split (Top - Bottom)' : 'Chia đôi ngang (Horizontal Split)'}
                    </span>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      {language === 'en'
                        ? 'Displays two terminal sessions stacked vertically.'
                        : 'Hiển thị 2 terminal xếp chồng lên nhau theo chiều dọc (Top - Bottom).'}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-300 leading-relaxed">
                  🚀 <strong>{language === 'en' ? 'Multi-Shell Support:' : 'Hỗ trợ đa Shell:'}</strong>{' '}
                  {language === 'en'
                    ? 'Freely open concurrent PowerShell, CMD, or WSL Linux tabs in one window with a dedicated shell switcher.'
                    : 'Tự do mở đồng thời các tab PowerShell, CMD hoặc WSL Linux trong cùng một ứng dụng với menu chọn Shell trực quan.'}
                </div>
              </div>
            )}

            {/* =============================================================== */}
            {/* SECTION: PORTS */}
            {/* =============================================================== */}
            {activeSection === 'ports' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2 mb-2">
                    <Radio size={18} className="text-emerald-400" />
                    {language === 'en' ? 'Network Port Management (Port Manager)' : 'Quản lý Cổng Mạng (Port Manager)'}
                  </h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    {language === 'en'
                      ? 'Inspect all active LISTENING ports on your computer and safely terminate blocking processes upon conflict.'
                      : 'Giám sát các Port mạng đang ở trạng thái LISTENING trên máy tính của bạn và giải phóng port khi bị xung đột.'}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-1.5">
                    <span className="font-bold text-zinc-100 text-sm">
                      {language === 'en' ? 'View Details & Services:' : 'Xem thông tin chi tiết:'}
                    </span>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      {language === 'en'
                        ? 'Inspect Port Number, Process Name, PID, and network protocol (TCP/UDP).'
                        : 'Hiển thị Số Port, Tên tiến trình (Process Name), PID và giao thức mạng (TCP/UDP).'}
                    </p>
                  </div>

                  <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-1.5">
                    <span className="font-bold text-red-400 text-sm">
                      {language === 'en' ? 'Kill Port (Terminate Blocking Process):' : 'Kill Port (Buộc dừng tiến trình chiếm port):'}
                    </span>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      {language === 'en'
                        ? 'Click the trash icon to immediately terminate the process holding the port (node.exe, python.exe, java.exe). For system services, launch CLIM as Administrator.'
                        : 'Nhấn nút Thùng rác để tắt ngay lập tức tiến trình đang chiếm port (VD: node.exe, python.exe, java.exe). Nếu tiến trình thuộc hệ thống hoặc yêu cầu quyền cao, hãy chạy CLIM dưới quyền Administrator / sudo.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* =============================================================== */}
            {/* SECTION: TASK SCHEDULER & CRON */}
            {/* =============================================================== */}
            {activeSection === 'scheduler' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2 mb-1">
                    <Clock size={18} className="text-emerald-400" />
                    {language === 'en' ? 'Task Scheduler & Cron Automation' : 'Lập Lịch Tự Động Hóa (Cron Tasks & Automation)'}
                  </h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    {language === 'en'
                      ? 'Automate recurring command or pipeline runs with background scheduling, Desktop alerts, and Discord / Telegram webhook reports.'
                      : 'Tự động chạy các câu lệnh hoặc quy trình theo chu kỳ định kỳ, gửi thông báo Desktop và Webhook (Discord / Telegram).'}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
                    <span className="font-bold text-emerald-400 text-sm">
                      {language === 'en' ? '1. Trigger Modes:' : '1. Các Chế độ Chu kỳ:'}
                    </span>
                    <ul className="list-disc list-inside text-zinc-300 text-sm space-y-1.5 leading-relaxed pl-1">
                      <li>
                        <strong>{language === 'en' ? 'Interval:' : 'Theo Chu Kỳ (Interval):'}</strong>{' '}
                        {language === 'en' ? 'Repeat every N minutes (1m, 5m, 15m, 30m, 1h, 2h, 24h...).' : 'Lặp lại sau mỗi N phút (1p, 5p, 15p, 30p, 1h, 2h, 24h...).'}
                      </li>
                      <li>
                        <strong>{language === 'en' ? 'Daily Schedule:' : 'Hàng Ngày (Daily):'}</strong>{' '}
                        {language === 'en' ? 'Run at a fixed time each day (e.g. 02:00 AM for database backups).' : 'Chạy vào một khung giờ cố định mỗi ngày (VD: 02:00 AM để backup database).'}
                      </li>
                      <li>
                        <strong>{language === 'en' ? 'App Startup:' : 'Khi Mở App (Startup):'}</strong>{' '}
                        {language === 'en' ? 'Automatically triggered 3 seconds after opening the CLIM app.' : 'Tự động kích hoạt 1 lần sau 3 giây kể từ khi mở ứng dụng CLIM.'}
                      </li>
                    </ul>
                  </div>

                  <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
                    <span className="font-bold text-blue-400 text-sm">
                      {language === 'en' ? '2. Execution Logs & History:' : '2. Lịch Sử Thực Thi (Execution Logs):'}
                    </span>
                    <p className="text-zinc-300 text-sm leading-relaxed">
                      {language === 'en'
                        ? 'Every run logs its status (Success/Failure), execution duration, exit code, and stdout/stderr output for review.'
                        : 'Mỗi lần tác vụ chạy, CLIM tự động ghi lại trạng thái (Thành công / Thất bại), thời lượng thực thi, mã thoát (Exit code) và trích xuất output log để bạn kiểm tra bất kỳ lúc nào.'}
                    </p>
                  </div>

                  <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
                    <span className="font-bold text-purple-400 text-sm">
                      {language === 'en' ? '3. Desktop Alerts & Webhooks:' : '3. Thông Báo Desktop & Webhook:'}
                    </span>
                    <p className="text-zinc-300 text-sm leading-relaxed">
                      {language === 'en'
                        ? 'When background runs complete, CLIM emits Windows Desktop notifications and delivers formatted Embed cards to Discord or Telegram.'
                        : 'Khi tác vụ hoàn thành trong nền, CLIM sẽ bắn thông báo Windows Desktop và gửi thẻ Embed báo cáo kết quả sang kênh Discord hoặc Telegram Bot của bạn.'}
                    </p>
                  </div>

                  {/* HƯỚNG DẪN CHI TIẾT: LỆNH NÊN & KHÔNG NÊN DÙNG CHO CRON */}
                  <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-3">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                      <span className="text-base">🟢</span>
                      <span>{language === 'en' ? 'Best Commands for Cron Automation (Recommended):' : 'Loại Lệnh Lập Lịch Cron TỐT NHẤT (Nên Dùng):'}</span>
                    </div>
                    <ul className="space-y-2 text-zinc-300 text-xs leading-relaxed pl-1">
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <div>
                          <strong className="text-zinc-100">{language === 'en' ? 'Automated Backups & Archival:' : 'Sao lưu & Đóng gói dữ liệu:'}</strong>{' '}
                          {language === 'en'
                            ? 'Database dumps (mysqldump, pg_dump, mongodump), file archives (tar -czf, Compress-Archive, 7z).'
                            : 'Xuất cơ sở dữ liệu (mysqldump, pg_dump, mongodump), nén file sao lưu định kỳ (tar -czf, Compress-Archive, 7z).'}
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <div>
                          <strong className="text-zinc-100">{language === 'en' ? 'System & Log Cleanups:' : 'Dọn rác & Xoay vòng Log:'}</strong>{' '}
                          {language === 'en'
                            ? 'Clearing temp folders (Remove-Item "$env:TEMP\\*" -Recurse -Force), deleting old logs, clearing npm/docker cache.'
                            : 'Dọn sạch thư mục tạm Windows/Linux (Remove-Item "$env:TEMP\\*" -Force, rm -rf /tmp/*), dọn rác build/cache.'}
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <div>
                          <strong className="text-zinc-100">{language === 'en' ? 'Service Restarts & Container Health:' : 'Khởi động lại dịch vụ & Docker:'}</strong>{' '}
                          {language === 'en'
                            ? 'Docker container maintenance (docker restart <name>, docker compose pull), PM2 process reload (pm2 reload all).'
                            : 'Bảo trì Docker container (docker restart app, docker system prune -f), tái khởi động ứng dụng (pm2 reload all).'}
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <div>
                          <strong className="text-zinc-100">{language === 'en' ? 'Health Checks & Network Probes:' : 'Kiểm tra kết nối & API Health Check:'}</strong>{' '}
                          {language === 'en'
                            ? 'Probing servers (curl -sSf https://api.site.com/health, Test-Connection -Count 4).'
                            : 'Gọi kiểm tra API định kỳ (curl -sSf https://your-domain.com/health), kiểm tra kết nối mạng (Test-Connection -Count 4).'}
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <div>
                          <strong className="text-zinc-100">{language === 'en' ? 'SSH Tunnel & Port Forwarding:' : 'Đường hầm SSH Tunnel ngầm:'}</strong>{' '}
                          {language === 'en'
                            ? 'Maintaining persistent port forwarding (ssh -i key.pem -N -L 9119:127.0.0.1:9119 user@host) with auto 4-second health check.'
                            : 'Mở cổng chuyển tiếp SSH ngầm (ssh -i key.pem -N -L 9119:127.0.0.1:9119 user@ip) - CLIM tự động xác thực kết nối chỉ sau 4s.'}
                        </div>
                      </li>
                    </ul>
                  </div>

                  <div className="p-4 bg-rose-950/20 border border-rose-500/30 rounded-xl space-y-3">
                    <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                      <span className="text-base">🔴</span>
                      <span>{language === 'en' ? 'Commands to AVOID for Cron (Will Fail or Hang):' : 'Loại Lệnh KHÔNG NÊN / KHÔNG THỂ DÙNG Cho Lập Lịch:'}</span>
                    </div>
                    <ul className="space-y-2 text-zinc-300 text-xs leading-relaxed pl-1">
                      <li className="flex items-start gap-2">
                        <span className="text-rose-400 font-bold">✗</span>
                        <div>
                          <strong className="text-zinc-100">{language === 'en' ? 'Interactive Terminal Programs (TUI):' : 'Phần mềm yêu cầu bàn phím tương tác trực tiếp:'}</strong>{' '}
                          {language === 'en'
                            ? 'Commands like nano, vim, htop, less, python -i, fzf. These require user keystrokes and will hang in headless mode.'
                            : 'Các lệnh như nano, vim, htop, less, python -i, fzf. Do chạy ngầm không có bàn phím nên tiến trình sẽ bị treo chờ nhập.'}
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-rose-400 font-bold">✗</span>
                        <div>
                          <strong className="text-zinc-100">{language === 'en' ? 'Interactive Confirmation Prompts [y/N]:' : 'Lệnh hỏi xác nhận [y/N] mà không có cờ tự động:'}</strong>{' '}
                          {language === 'en'
                            ? 'Commands like apt install without -y, or rm without -f. Always add non-interactive flags (e.g. apt install -y, rm -rf, Remove-Item -Force).'
                            : 'Ví dụ apt install mà quên cờ -y, hoặc xóa file hỏi Yes/No. Cần luôn thêm cờ tự động (VD: apt install -y, Remove-Item -Force).'}
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-rose-400 font-bold">✗</span>
                        <div>
                          <strong className="text-zinc-100">{language === 'en' ? 'SSH Requiring Manual Passwords:' : 'Lệnh SSH yêu cầu gõ mật khẩu bằng tay:'}</strong>{' '}
                          {language === 'en'
                            ? 'Headless scheduler cannot type SSH passwords. Use SSH Key authentication (ssh -i path/to/key.pem user@host).'
                            : 'Chạy ngầm không thể gõ mật khẩu. Bắt buộc dùng SSH Key (-i "duong_dan_key.key") thay vì đăng nhập bằng password.'}
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-rose-400 font-bold">✗</span>
                        <div>
                          <strong className="text-zinc-100">{language === 'en' ? 'GUI Desktop Applications:' : 'Phần mềm mở giao diện cửa sổ GUI:'}</strong>{' '}
                          {language === 'en'
                            ? 'Opening apps like notepad.exe, chrome.exe, or games that wait indefinitely for user to close window.'
                            : 'Mở các ứng dụng giao diện như notepad.exe, chrome.exe (chờ người dùng bấm X đóng cửa sổ mới thoát).'}
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* =============================================================== */}
            {/* SECTION: RESOURCE MONITOR */}
            {/* =============================================================== */}
            {activeSection === 'monitor' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2 mb-1">
                    <Activity size={18} className="text-emerald-400" />
                    {language === 'en' ? 'Real-Time System Resource Monitor' : 'Giám Sát Tài Nguyên Máy Tính Thời Gian Thực'}
                  </h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    {language === 'en'
                      ? 'Live visual telemetry for system-wide CPU and RAM, plus individual Terminal processes and Listening Ports.'
                      : 'Theo dõi trực quan mức độ chiếm dụng CPU, RAM của toàn hệ thống và đo lường chi tiết từng cửa sổ Terminal và Cổng Port.'}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
                    <span className="font-bold text-emerald-400 text-sm">
                      {language === 'en' ? '1. System CPU & RAM Gauges:' : '1. Đồng hồ đo CPU & RAM Toàn Hệ Thống:'}
                    </span>
                    <p className="text-zinc-300 text-sm leading-relaxed">
                      {language === 'en'
                        ? 'Measures CPU load (%) and memory usage (GB / Total GB) refreshed every 2.5 seconds with color-coded threshold warnings.'
                        : 'Đo lường mức tải CPU (%) và dung lượng RAM đã dùng (GB / Total GB) cập nhật trực tiếp mỗi 2.5 giây. Tự động chuyển màu cảnh báo khi tài nguyên máy đạt ngưỡng cao.'}
                    </p>
                  </div>

                  <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
                    <span className="font-bold text-amber-400 text-sm">
                      {language === 'en' ? '2. Granular Process Telemetry (PID Tracking):' : '2. Bảng Theo Dõi Tiến Trình Chi Tiết (PID Tracking):'}
                    </span>
                    <p className="text-zinc-300 text-sm leading-relaxed">
                      {language === 'en'
                        ? 'Lists all active PIDs belonging to Terminal tabs and listening ports, showing exact RAM (MB) and CPU (%) per process (node.exe, python.exe, java.exe, powershell.exe...).'
                        : 'Liệt kê tất cả PID thuộc Terminal sessions và Listening Ports đang mở. Hiển thị chính xác mức RAM (MB) và CPU (%) tiêu thụ của từng tiến trình (node.exe, python.exe, java.exe, powershell.exe...).'}
                    </p>
                  </div>

                  <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
                    <span className="font-bold text-red-400 text-sm">
                      {language === 'en' ? '3. Terminate Runaway Processes (Kill Process):' : '3. Dừng Tiến Trình Chiếm Tài Nguyên (Kill Process):'}
                    </span>
                    <p className="text-zinc-300 text-sm leading-relaxed">
                      {language === 'en'
                        ? 'Click the "Kill" button right from the monitor table to instantly free up memory or unfreeze locked tasks.'
                        : 'Nhấn nút "Kill" ngay trên bảng giám sát để giải phóng tức thì bộ nhớ RAM hoặc CPU của tiến trình bị treo.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* =============================================================== */}
            {/* SECTION: SNIPPET HUB */}
            {/* =============================================================== */}
            {activeSection === 'snippetHub' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2 mb-1">
                    <Store size={18} className="text-emerald-400" />
                    {language === 'en' ? 'Curated Snippet Hub' : 'Kho Lệnh Mẫu Thực Chiến (Built-in Snippet Hub)'}
                  </h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    {language === 'en'
                      ? 'Discover and install pre-configured 1-click command packs and pipelines across multiple stacks.'
                      : 'Khám phá và cài đặt tức thì các gói lệnh và quy trình mẫu được tinh chỉnh chuyên nghiệp theo từng công nghệ.'}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
                    <span className="font-bold text-emerald-400 text-sm">
                      {language === 'en' ? '1. Non-destructive 1-Click Install:' : '1. Cài Đặt 1-Click Không Ghi Đè:'}
                    </span>
                    <p className="text-zinc-300 text-sm leading-relaxed">
                      {language === 'en'
                        ? 'Choose "Install Pack" to import all commands and pipelines, or inspect items to individually add specific scripts without overwriting existing data.'
                        : 'Bạn có thể chọn "Cài Đặt Toàn Bộ" để nhập toàn bộ câu lệnh và quy trình trong gói, hoặc mở phần xem trước để "Thêm riêng" từng câu lệnh bạn cần mà không làm ảnh hưởng đến dữ liệu cũ.'}
                    </p>
                  </div>

                  <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
                    <span className="font-bold text-blue-400 text-sm">
                      {language === 'en' ? '2. Diverse Technology Domains:' : '2. Đa Dạng Các Chuyên Ngành:'}
                    </span>
                    <p className="text-zinc-300 text-sm leading-relaxed">
                      {language === 'en'
                        ? 'Includes curated packs for Docker & Kubernetes, Node.js & Frontend, Python & AI (PyTorch/CUDA), Windows DevOps & Networking, Git & GitHub Workflows, and Full-Stack Pipelines.'
                        : 'Bao gồm các gói tiêu chuẩn cho Docker & Kubernetes, Node.js & Frontend, Python & AI (PyTorch/CUDA), Windows DevOps & Mạng, Git & GitHub Workflows, và Full-Stack Pipelines.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* =============================================================== */}
            {/* SECTION: CLOUD SYNC & E2EE */}
            {/* =============================================================== */}
            {activeSection === 'cloudSync' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2 mb-1">
                    <Cloud size={18} className="text-emerald-400" />
                    {language === 'en' ? 'Personal Cloud Sync (GitHub Gist & E2EE)' : 'Đồng Bộ Đám Mây Cá Nhân (GitHub Gist & E2EE)'}
                  </h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    {language === 'en'
                      ? 'Backup and two-way sync all Commands, Pipelines, Profiles, and Schedules into your private GitHub Gist.'
                      : 'Sao lưu và đồng bộ 2 chiều toàn bộ Lệnh, Quy trình, Môi trường, Lịch trình sang GitHub Gist cá nhân bảo mật.'}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
                    <span className="font-bold text-emerald-400 text-sm">
                      {language === 'en' ? '1. GitHub Personal Access Token (PAT):' : '1. GitHub Personal Access Token (PAT):'}
                    </span>
                    <p className="text-zinc-300 text-sm leading-relaxed">
                      {language === 'en'
                        ? 'Create a GitHub PAT with `gist` scope and paste into Settings → Cloud Sync. CLIM automatically provisions a private secret Gist.'
                        : 'Tạo một Token trên GitHub với quyền `gist` và dán vào phần Cài đặt → Đồng bộ Đám mây. CLIM sẽ tự động tạo Gist riêng tư (Secret Gist) để lưu trữ.'}
                    </p>
                  </div>

                  <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
                    <span className="font-bold text-amber-400 text-sm">
                      {language === 'en' ? '2. End-to-End Encryption (Master Password - AES-256-GCM):' : '2. Mã Hóa Đầu Cuối (Master Password - AES-256-GCM):'}
                    </span>
                    <p className="text-zinc-300 text-sm leading-relaxed">
                      {language === 'en'
                        ? 'Provide a custom Master Password when uploading. All data (including API keys and sensitive environment values) is encrypted client-side with AES-256-GCM prior to upload.'
                        : 'Đặt mật khẩu Master Password khi tải lên. Toàn bộ dữ liệu (bao gồm cả API Keys và mật khẩu trong biến môi trường) sẽ được mã hóa chuẩn quân sự AES-256-GCM trước khi gửi lên Gist.'}
                    </p>
                  </div>

                  <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
                    <span className="font-bold text-purple-400 text-sm">
                      {language === 'en' ? '3. Seamless 2-Way Sync (Push & Pull):' : '3. Đồng Bộ 2 Chiều (Push & Pull):'}
                    </span>
                    <p className="text-zinc-300 text-sm leading-relaxed">
                      {language === 'en'
                        ? 'When moving to a new workstation, enter your GitHub Token + Gist ID + Master Password and click "Pull Backup from Gist" to restore 100% of your workspace in seconds!'
                        : 'Chuyển sang máy tính khác, chỉ cần nhập GitHub Token + Gist ID + Master Password và bấm "Tải Về Từ Gist" để khôi phục 100% môi trường làm việc trong 1 giây!'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* =============================================================== */}
            {/* SECTION: WEBHOOKS (DISCORD & TELEGRAM) */}
            {/* =============================================================== */}
            {activeSection === 'webhooks' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2 mb-1">
                    <Bell size={18} className="text-emerald-400" />
                    {language === 'en' ? 'Webhook Setup Guide (Discord & Telegram)' : 'Hướng Dẫn Cấu Hình Webhook (Discord & Telegram)'}
                  </h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    {language === 'en'
                      ? 'Receive automated execution reports directly in your Discord channels or Telegram bot / groups.'
                      : 'Tự động nhận thông báo trạng thái thực thi tác vụ lập lịch và lệnh qua Discord Channel hoặc Telegram cá nhân/nhóm.'}
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Discord Webhook */}
                  <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-3">
                    <span className="font-bold text-blue-400 text-sm flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
                      {language === 'en' ? '1. How to create Discord Webhook URL (3 easy steps):' : '1. Cách Tạo Discord Webhook URL (3 bước đơn giản):'}
                    </span>
                    <ol className="list-decimal list-inside text-zinc-300 text-sm space-y-2 pl-2 leading-relaxed">
                      <li>
                        {language === 'en'
                          ? 'Open Discord → Right-click the channel where you want notifications → Select Edit Channel (or Server Settings → Integrations).'
                          : 'Mở ứng dụng Discord → Nhấp chuột phải vào kênh (Channel) bạn muốn nhận thông báo → Chọn Edit Channel (hoặc vào Server Settings → Integrations).'}
                      </li>
                      <li>
                        {language === 'en'
                          ? 'Select Integrations tab → Click Create Webhook (or View Webhooks → New Webhook).'
                          : 'Chọn tab Integrations → Nhấn nút Create Webhook (hoặc View Webhooks → New Webhook).'}
                      </li>
                      <li>
                        {language === 'en'
                          ? 'Name your bot (e.g. `CLIM Bot`) and click Copy Webhook URL.'
                          : 'Đặt tên cho Bot (ví dụ: CLIM Bot) và nhấn nút Copy Webhook URL.'}
                      </li>
                      <li>
                        {language === 'en'
                          ? 'Paste into Settings → Notifications & Webhooks → Discord Webhook URL in CLIM, then click "Send Test".'
                          : 'Dán URL vừa copy vào mục Cài đặt → Thông báo & Webhook → Discord Webhook URL trong CLIM rồi bấm "Gửi Thử".'}
                      </li>
                    </ol>
                  </div>

                  {/* Telegram Bot */}
                  <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-3">
                    <span className="font-bold text-sky-400 text-sm flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" />
                      {language === 'en' ? '2. How to create Telegram Bot Token & Chat ID:' : '2. Cách Tạo Telegram Bot Token & Lấy Chat ID:'}
                    </span>
                    <div className="space-y-3 text-sm text-zinc-300 leading-relaxed pl-2">
                      <div>
                        <strong className="text-emerald-400">
                          {language === 'en' ? 'Step A - Create Bot Token:' : 'Bước A - Tạo Bot Token:'}
                        </strong>
                        <ul className="list-disc list-inside text-zinc-400 text-xs mt-1 space-y-1 pl-2">
                          <li>{language === 'en' ? 'Open Telegram and search for @BotFather (verified blue check).' : 'Mở Telegram, tìm kiếm tài khoản @BotFather (có dấu tích xanh chính chủ).'}</li>
                          <li>{language === 'en' ? 'Send `/newbot` and follow prompts to name your bot.' : 'Gõ lệnh /newbot và làm theo hướng dẫn để đặt tên bot.'}</li>
                          <li>{language === 'en' ? 'Copy the HTTP API Token (e.g. `123456789:ABCdef...`) into CLIM Bot Token input.' : '@BotFather sẽ gửi cho bạn một chuỗi HTTP API Token (dạng 123456789:ABCdefGHIjklMNO...). Copy token này vào ô Bot Token trong Cài đặt CLIM.'}</li>
                        </ul>
                      </div>

                      <div>
                        <strong className="text-emerald-400">
                          {language === 'en' ? 'Step B - Obtain Chat ID:' : 'Bước B - Lấy Chat ID:'}
                        </strong>
                        <ul className="list-disc list-inside text-zinc-400 text-xs mt-1 space-y-1 pl-2">
                          <li>
                            <strong>{language === 'en' ? 'For Direct Message' : 'Nếu nhận tin nhắn riêng'}</strong>: {language === 'en' ? 'Message @userinfobot on Telegram, send /start to get your personal ID (e.g. 987654321). Send /start to your new bot as well!' : 'Tìm bot @userinfobot trên Telegram, nhấn /start để nhận ngay ID cá nhân của bạn (dạng 987654321). Đừng quên gửi /start cho Bot mới tạo của bạn một lần!'}
                          </li>
                          <li>
                            <strong>{language === 'en' ? 'For Group Channel' : 'Nếu gửi vào nhóm'}</strong>: {language === 'en' ? 'Add your bot to the group, then invite @RawDataBot to read the group chat ID (starts with -100...).' : 'Thêm Bot vừa tạo vào nhóm Telegram của bạn, sau đó thêm bot @RawDataBot để xem chat id của nhóm (thường bắt đầu bằng dấu trừ -100...).'}
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* =============================================================== */}
            {/* SECTION: HOTKEYS & SHORTCUTS */}
            {/* =============================================================== */}
            {activeSection === 'hotkeys' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2 mb-1">
                    <Keyboard size={18} className="text-emerald-400" />
                    {language === 'en' ? 'All Keyboard Shortcuts & Hotkeys' : 'Hệ thống Phím tắt Toàn năng (Keyboard Shortcuts)'}
                  </h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    {language === 'en'
                      ? 'Speed up your terminal workflow with global and in-app keyboard shortcuts.'
                      : 'Tăng tốc 300% hiệu suất làm việc bằng các tổ hợp phím tắt nhanh trên bàn phím.'}
                  </p>
                </div>

                {/* 1. Global Navigation & Spotlight */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    {language === 'en' ? 'Navigation & Quick Spotlight' : 'Điều hướng & Tìm kiếm Nhanh (Spotlight)'}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 bg-zinc-950/80 border border-zinc-800 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-zinc-200 text-sm">Spotlight Command Palette</div>
                        <div className="text-xs text-zinc-500">
                          {language === 'en' ? 'Fuzzy search and run scripts instantly' : 'Mở hộp tìm kiếm & chạy lệnh tức thì'}
                        </div>
                      </div>
                      <kbd className="px-2.5 py-1 text-xs font-mono font-bold text-emerald-400 bg-zinc-900 border border-emerald-500/40 rounded-lg shadow-sm">
                        Ctrl + K
                      </kbd>
                    </div>

                    <div className="p-3.5 bg-zinc-950/80 border border-zinc-800 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-zinc-200 text-sm">
                          {language === 'en' ? 'Open System Preferences' : 'Mở Cài đặt Hệ thống'}
                        </div>
                        <div className="text-xs text-zinc-500">
                          {language === 'en' ? 'UI themes, shell defaults, webhooks' : 'Mở cửa sổ tùy biến giao diện, shell & webhook'}
                        </div>
                      </div>
                      <kbd className="px-2.5 py-1 text-xs font-mono font-bold text-zinc-300 bg-zinc-900 border border-zinc-700 rounded-lg shadow-sm">
                        Ctrl + ,
                      </kbd>
                    </div>

                    <div className="p-3.5 bg-zinc-950/80 border border-zinc-800 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-zinc-200 text-sm">
                          {language === 'en' ? 'Open User Guide' : 'Mở Hướng dẫn Sử dụng'}
                        </div>
                        <div className="text-xs text-zinc-500">
                          {language === 'en' ? 'Documentation, variables, tips' : 'Mở tài liệu tra cứu biến & tính năng'}
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        <kbd className="px-2.5 py-1 text-xs font-mono font-bold text-zinc-300 bg-zinc-900 border border-zinc-700 rounded-lg shadow-sm">
                          F1
                        </kbd>
                        <span className="text-zinc-600 text-xs self-center">{language === 'en' ? 'or' : 'hoặc'}</span>
                        <kbd className="px-2.5 py-1 text-xs font-mono font-bold text-zinc-300 bg-zinc-900 border border-zinc-700 rounded-lg shadow-sm">
                          Ctrl + H
                        </kbd>
                      </div>
                    </div>

                    <div className="p-3.5 bg-zinc-950/80 border border-zinc-800 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-zinc-200 text-sm">
                          {language === 'en' ? 'Switch Tabs 1..7' : 'Chuyển Tab nhanh 1..7'}
                        </div>
                        <div className="text-xs text-zinc-500">
                          {language === 'en'
                            ? '1: Profiles • 2: Commands • 3: Pipelines • 4: Scheduler • 5: Terminal • 6: Ports • 7: Monitor'
                            : '1: Môi trường • 2: Lệnh • 3: Quy trình • 4: Lập lịch • 5: Terminal • 6: Ports • 7: Tài nguyên'}
                        </div>
                      </div>
                      <kbd className="px-2.5 py-1 text-xs font-mono font-bold text-zinc-300 bg-zinc-900 border border-zinc-700 rounded-lg shadow-sm">
                        Ctrl + 1..7
                      </kbd>
                    </div>
                  </div>
                </div>

                {/* 2. Terminal Control */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    {language === 'en' ? 'Terminal Actions' : 'Thao tác trên Terminal'}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 bg-zinc-950/80 border border-zinc-800 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-zinc-200 text-sm">
                          {language === 'en' ? 'New Terminal Tab' : 'Mở Tab Terminal Mới'}
                        </div>
                        <div className="text-xs text-zinc-500">
                          {language === 'en' ? 'Create tab with default shell' : 'Tạo terminal theo Shell mặc định'}
                        </div>
                      </div>
                      <kbd className="px-2.5 py-1 text-xs font-mono font-bold text-blue-400 bg-zinc-900 border border-blue-500/40 rounded-lg shadow-sm">
                        Ctrl + T
                      </kbd>
                    </div>

                    <div className="p-3.5 bg-zinc-950/80 border border-zinc-800 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-zinc-200 text-sm">
                          {language === 'en' ? 'Close Active Terminal Tab' : 'Đóng Tab Terminal Hiện Tại'}
                        </div>
                        <div className="text-xs text-zinc-500">
                          {language === 'en' ? 'Terminate process and close tab' : 'Tắt và giải phóng tiến trình đang mở'}
                        </div>
                      </div>
                      <kbd className="px-2.5 py-1 text-xs font-mono font-bold text-red-400 bg-zinc-900 border border-red-500/40 rounded-lg shadow-sm">
                        Ctrl + W
                      </kbd>
                    </div>

                    <div className="p-3.5 bg-zinc-950/80 border border-zinc-800 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-zinc-200 text-sm">
                          {language === 'en' ? 'Clear Terminal Screen' : 'Xóa trắng màn hình Terminal'}
                        </div>
                        <div className="text-xs text-zinc-500">
                          {language === 'en' ? 'Clear xterm buffer screen' : 'Xóa sạch log hiển thị trong xterm'}
                        </div>
                      </div>
                      <kbd className="px-2.5 py-1 text-xs font-mono font-bold text-amber-400 bg-zinc-900 border border-amber-500/40 rounded-lg shadow-sm">
                        Ctrl + L
                      </kbd>
                    </div>

                    <div className="p-3.5 bg-zinc-950/80 border border-zinc-800 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-zinc-200 text-sm">
                          {language === 'en' ? 'Spotlight Item Navigation' : 'Duyệt & Chọn trong Spotlight'}
                        </div>
                        <div className="text-xs text-zinc-500">
                          {language === 'en' ? 'Navigate up/down and execute' : 'Di chuyển lên xuống và thực thi lệnh'}
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        <kbd className="px-2 py-1 text-xs font-mono font-bold text-zinc-300 bg-zinc-900 border border-zinc-700 rounded-lg">
                          ↑ / ↓
                        </kbd>
                        <kbd className="px-2 py-1 text-xs font-mono font-bold text-zinc-300 bg-zinc-900 border border-zinc-700 rounded-lg">
                          Enter
                        </kbd>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* =============================================================== */}
            {/* SECTION: SETTINGS & PERMISSIONS */}
            {/* =============================================================== */}
            {activeSection === 'settings' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2 mb-2">
                    <ShieldCheck size={18} className="text-emerald-400" />
                    {language === 'en' ? 'Preferences & Permissions (User vs Administrator)' : 'Cài đặt & Quyền hạn Thực thi (User vs Administrator)'}
                  </h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    {language === 'en'
                      ? 'Learn how CLIM inherits process permissions and personalize your workspace preferences.'
                      : 'Tìm hiểu cách CLIM quản lý quyền hạn của Shell và các tùy chọn cá nhân hóa giao diện.'}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
                    <span className="font-bold text-emerald-300 text-sm">
                      {language === 'en' ? 'User vs Administrator Privileges:' : 'Quyền User vs Administrator:'}
                    </span>
                    <p className="text-zinc-300 text-sm leading-relaxed">
                      {language === 'en'
                        ? 'CLIM operates via process inheritance. If opened normally, shells run under standard User privileges. To execute commands requiring elevated access (Windows services, host file modifications, killing protected system ports), right click CLIM and select "Run as administrator".'
                        : 'CLIM hoạt động theo cơ chế kế thừa quyền tiến trình. Nếu bạn mở app CLIM ở chế độ bình thường, các terminal (PowerShell, CMD) sẽ chạy với quyền User. Để chạy với quyền Administrator (chạy netstat admin, quản lý service Windows, đổi DNS/Hosts, kill process hệ thống), hãy chuột phải vào icon app CLIM và chọn "Run as administrator".'}
                    </p>
                  </div>

                  <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
                    <span className="font-bold text-blue-300 text-sm">
                      {language === 'en' ? 'Default Shell Selection:' : 'Shell Mặc định:'}
                    </span>
                    <p className="text-zinc-300 text-sm leading-relaxed">
                      {language === 'en'
                        ? 'Select PowerShell, CMD, or WSL Linux as your default shell in the Settings tab.'
                        : 'Bạn có thể chọn PowerShell, CMD hoặc WSL làm Shell mặc định mỗi khi bấm tạo terminal mới trong tab Cài đặt.'}
                    </p>
                  </div>

                  <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
                    <span className="font-bold text-amber-300 text-sm">
                      {language === 'en' ? 'Full Backup & Migration (.json):' : 'Sao lưu Toàn bộ Cấu hình (Full Backup):'}
                    </span>
                    <p className="text-zinc-300 text-sm leading-relaxed">
                      {language === 'en'
                        ? 'Export/Import backup files to migrate all commands, pipelines, profiles, and preferences between computers in 1 second.'
                        : 'Tính năng Xuất / Nhập file sao lưu (.json) cho phép bạn chuyển toàn bộ các lệnh, dãy lệnh và biến môi trường sang máy khác trong 1 giây.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between text-xs">
          <span className="text-xs text-zinc-500 font-mono">
            {language === 'en' ? 'CLIM - CLI Workspace for Developers' : 'CLIM - CLI Manager cho Developers'}
          </span>
          <Button
            size="sm"
            onClick={() => onOpenChange(false)}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs px-5 py-1.5 h-8 font-medium cursor-pointer"
          >
            {language === 'en' ? 'Got it, Close Guide' : 'Đã hiểu, đóng hướng dẫn'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
