import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useCommandStore } from '@/stores/command-store'
import { useSequenceStore } from '@/stores/sequence-store'
import { useSchedulerStore } from '@/stores/scheduler-store'
import {
  Clock,
  Terminal,
  ListOrdered,
  Bell,
  Send,
  Timer,
  Calendar,
  Zap,
  X,
  Code2,
  CheckSquare,
  WrapText,
  Sparkles,
  HelpCircle
} from 'lucide-react'
import { toast } from 'sonner'
import type { ScheduledTask, ScheduleType, ScheduleTargetType } from '@shared/types'
import { useTranslation } from '@/stores/i18n-store'

interface TaskFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  taskToEdit?: ScheduledTask | null
}

export function TaskFormDialog({
  open,
  onOpenChange,
  taskToEdit
}: TaskFormDialogProps): React.JSX.Element {
  const { commands } = useCommandStore()
  const { sequences } = useSequenceStore()
  const { saveTask } = useSchedulerStore()
  const { t, language } = useTranslation()

  const intervalOptions = [
    { value: 1, label: language === 'en' ? 'Every 1 minute (Testing)' : 'Mỗi 1 phút (Kiểm thử)' },
    { value: 5, label: language === 'en' ? 'Every 5 minutes' : 'Mỗi 5 phút' },
    { value: 15, label: language === 'en' ? 'Every 15 minutes' : 'Mỗi 15 phút' },
    { value: 30, label: language === 'en' ? 'Every 30 minutes' : 'Mỗi 30 phút' },
    { value: 60, label: language === 'en' ? 'Every 1 hour' : 'Mỗi 1 giờ' },
    { value: 120, label: language === 'en' ? 'Every 2 hours' : 'Mỗi 2 giờ' },
    { value: 360, label: language === 'en' ? 'Every 6 hours' : 'Mỗi 6 giờ' },
    { value: 720, label: language === 'en' ? 'Every 12 hours' : 'Mỗi 12 giờ' },
    { value: 1440, label: language === 'en' ? 'Every 24 hours (1 day)' : 'Mỗi 24 giờ (1 ngày)' }
  ]

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isDirectCommand, setIsDirectCommand] = useState(false)
  const [isWrap, setIsWrap] = useState(false)
  const [targetType, setTargetType] = useState<ScheduleTargetType>('command')
  const [targetId, setTargetId] = useState('')
  const [customCommand, setCustomCommand] = useState('')
  const [scheduleType, setScheduleType] = useState<ScheduleType>('interval')
  const [intervalMinutes, setIntervalMinutes] = useState(15)
  const [dailyTime, setDailyTime] = useState('02:00')
  const [notifyOnComplete, setNotifyOnComplete] = useState(true)
  const [webhookEnabled, setWebhookEnabled] = useState(false)
  const [showTips, setShowTips] = useState(false)

  useEffect(() => {
    if (!open) return

    if (taskToEdit) {
      setName(taskToEdit.name)
      setDescription(taskToEdit.description || '')
      const isDirect =
        !taskToEdit.targetId ||
        taskToEdit.targetId === 'custom_direct' ||
        Boolean(
          taskToEdit.customCommand &&
            !commands.some((c) => c.id === taskToEdit.targetId) &&
            !sequences.some((s) => s.id === taskToEdit.targetId)
        )
      setIsDirectCommand(isDirect)
      setTargetType(taskToEdit.targetType)
      setTargetId(taskToEdit.targetId)
      // Nếu taskToEdit chưa có customCommand riêng, tự động nạp từ lệnh hoặc quy trình gốc
      if (taskToEdit.customCommand) {
        setCustomCommand(taskToEdit.customCommand)
      } else if (taskToEdit.targetType === 'command') {
        const cmd = commands.find((c) => c.id === taskToEdit.targetId)
        setCustomCommand(cmd?.command || '')
      } else {
        const seq = sequences.find((s) => s.id === taskToEdit.targetId)
        setCustomCommand(seq?.steps?.map((s) => s.command).join(' && ') || '')
      }
      setScheduleType(taskToEdit.scheduleType)
      setIntervalMinutes(taskToEdit.intervalMinutes || 15)
      setDailyTime(taskToEdit.dailyTime || '02:00')
      setNotifyOnComplete(taskToEdit.notifyOnComplete)
      setWebhookEnabled(taskToEdit.webhookEnabled)
    } else {
      setName('')
      setDescription('')
      setIsDirectCommand(false)
      setTargetType('command')
      const firstCmd = commands[0]
      setTargetId(firstCmd?.id || '')
      setCustomCommand(firstCmd?.command || '')
      setScheduleType('interval')
      setIntervalMinutes(15)
      setDailyTime('02:00')
      setNotifyOnComplete(true)
      setWebhookEnabled(false)
    }
  }, [taskToEdit, open])

  const handleTargetTypeChange = (type: ScheduleTargetType) => {
    setTargetType(type)
    if (type === 'command') {
      const first = commands[0]
      setTargetId(first?.id || '')
      setCustomCommand(first?.command || '')
    } else {
      const first = sequences[0]
      setTargetId(first?.id || '')
      setCustomCommand(first?.steps?.map((s) => s.command).join(' && ') || '')
    }
  }

  const handleTargetIdChange = (id: string) => {
    setTargetId(id)
    if (targetType === 'command') {
      const cmd = commands.find((c) => c.id === id)
      if (cmd) setCustomCommand(cmd.command)
    } else {
      const seq = sequences.find((s) => s.id === id)
      if (seq) setCustomCommand(seq.steps?.map((s) => s.command).join(' && ') || '')
    }
  }

  // Dồn mã lệnh nhiều dòng/ngắt dòng thành 1 dòng liền mạch (Single-line Command)
  const handleMakeSingleLine = () => {
    if (!customCommand.trim()) return
    const lines = customCommand
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)

    const firstLine = lines[0]?.toLowerCase() || ''
    const isSingleCmd =
      firstLine.startsWith('ssh') ||
      firstLine.startsWith('curl') ||
      firstLine.startsWith('scp') ||
      firstLine.startsWith('docker') ||
      firstLine.startsWith('git')

    if (isSingleCmd) {
      const merged = lines.join(' ')
      setCustomCommand(merged)
      toast.success(
        language === 'en' ? 'Formatted as single-line command' : 'Đã dồn mã lệnh thành 1 dòng liền mạch'
      )
    } else {
      const merged = lines.join(' && ')
      setCustomCommand(merged)
      toast.success(
        language === 'en' ? 'Combined lines with &&' : 'Đã nối các dòng lệnh bằng &&'
      )
    }
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error(language === 'en' ? 'Please enter a schedule name' : 'Vui lòng nhập tên lịch trình')
      return
    }

    const finalCustomCommand = customCommand.trim()

    if (isDirectCommand) {
      if (!finalCustomCommand) {
        toast.error(language === 'en' ? 'Please enter the execution command' : 'Vui lòng nhập mã lệnh thực thi trực tiếp')
        return
      }
    } else if (!targetId && !finalCustomCommand) {
      toast.error(
        language === 'en'
          ? `Please select a target ${targetType === 'command' ? 'command' : 'sequence'}`
          : `Vui lòng chọn ${targetType === 'command' ? 'câu lệnh' : 'quy trình'} mục tiêu`
      )
      return
    }

    const task: ScheduledTask = {
      id: taskToEdit ? taskToEdit.id : crypto.randomUUID(),
      name: name.trim(),
      description: description.trim() || undefined,
      targetType: isDirectCommand ? 'command' : targetType,
      targetId: isDirectCommand ? 'custom_direct' : targetId,
      customCommand: finalCustomCommand || undefined,
      scheduleType,
      intervalMinutes: scheduleType === 'interval' ? intervalMinutes : undefined,
      dailyTime: scheduleType === 'daily' ? dailyTime : undefined,
      enabled: taskToEdit ? taskToEdit.enabled : true,
      lastRunAt: taskToEdit?.lastRunAt,
      nextRunAt: taskToEdit?.nextRunAt,
      lastStatus: taskToEdit?.lastStatus,
      notifyOnComplete,
      webhookEnabled,
      createdAt: taskToEdit ? taskToEdit.createdAt : Date.now()
    }

    await saveTask(task)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 w-[95vw] max-w-5xl h-[88vh] max-h-[720px] p-0 overflow-hidden shadow-2xl rounded-xl flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="px-6 py-3.5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Clock size={17} />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-zinc-100">
                  {taskToEdit
                    ? (language === 'en' ? 'Edit Scheduled Task' : 'Chỉnh Sửa Lịch Tự Động')
                    : (language === 'en' ? 'Create Scheduled Task' : 'Tạo Lịch Tự Động Mới')}
                </DialogTitle>
                <p className="text-[11px] text-zinc-400">
                  {language === 'en'
                    ? 'Automate recurring execution of commands or multi-step sequences'
                    : 'Tự động thực thi câu lệnh hoặc quy trình theo chu kỳ định sẵn'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* 2-Row Layout: Cấu hình phía trên (2 cột) & Khung soạn thảo mã lệnh ở dưới cùng (Full-width) */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {/* Phần Cấu Hình Phía Trên (2 cột cân đối) */}
            <div className="p-5 pb-3 border-b border-zinc-800/80 grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0 bg-zinc-900/40 overflow-y-auto max-h-[48vh]">
              {/* Cột 1: Thông tin cơ bản & Báo cáo */}
              <div className="space-y-3">
                {/* Tên tác vụ */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">
                    {language === 'en' ? 'Schedule Name' : 'Tên lịch trình'} <span className="text-red-400">*</span>
                  </label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={language === 'en' ? 'e.g. Automated DB Backup...' : 'VD: Backup Database, SSH Tunnel VPS, Kiểm tra định kỳ...'}
                    className="bg-zinc-950 border-zinc-800 rounded-md text-xs focus:border-emerald-500/50 h-8"
                    required
                  />
                </div>

                {/* Mô tả */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">
                    {language === 'en' ? 'Description (optional)' : 'Mô tả (tùy chọn)'}
                  </label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={language === 'en' ? 'Notes on what this task accomplishes...' : 'Ghi chú mục đích của lịch tự động này...'}
                    className="bg-zinc-950 border-zinc-800 rounded-md text-xs focus:border-emerald-500/50 h-8"
                  />
                </div>

                {/* Tùy chọn Thông báo & Webhook */}
                <div className="pt-2 border-t border-zinc-800/60 space-y-1.5">
                  <label className="text-[11px] font-semibold text-zinc-400">
                    {language === 'en' ? 'Reporting & Notifications' : 'Cấu hình Báo cáo'}
                  </label>
                  <div className="flex flex-col gap-1.5">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300 hover:text-zinc-100">
                      <input
                        type="checkbox"
                        checked={notifyOnComplete}
                        onChange={(e) => setNotifyOnComplete(e.target.checked)}
                        className="w-3.5 h-3.5 rounded bg-zinc-950 border-zinc-700 text-emerald-500 focus:ring-0 cursor-pointer"
                      />
                      <Bell size={13} className="text-emerald-400 shrink-0" />
                      <span>{language === 'en' ? 'Windows Desktop Notification' : 'Bắn thông báo Windows Desktop khi hoàn tất'}</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300 hover:text-zinc-100">
                      <input
                        type="checkbox"
                        checked={webhookEnabled}
                        onChange={(e) => setWebhookEnabled(e.target.checked)}
                        className="w-3.5 h-3.5 rounded bg-zinc-950 border-zinc-700 text-emerald-500 focus:ring-0 cursor-pointer"
                      />
                      <Send size={13} className="text-blue-400 shrink-0" />
                      <span>{language === 'en' ? 'Send result via Webhook (Discord / Telegram)' : 'Gửi kết quả qua Webhook (Discord / Telegram)'}</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Cột 2: Mục tiêu & Chu kỳ lịch trình */}
              <div className="space-y-3">
                {/* Nút Tích Vô Hiệu Lệnh Đơn/Quy Trình */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/70 border border-zinc-800">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-200 select-none">
                    <input
                      type="checkbox"
                      checked={isDirectCommand}
                      onChange={(e) => {
                        setIsDirectCommand(e.target.checked)
                        if (e.target.checked && !customCommand) {
                          setCustomCommand('')
                        }
                      }}
                      className="w-3.5 h-3.5 rounded bg-zinc-950 border-zinc-700 text-emerald-500 focus:ring-0 cursor-pointer"
                    />
                    <span>
                      {language === 'en'
                        ? 'Custom Direct Command (Disable Preset)'
                        : 'Vô hiệu hóa lệnh đơn / quy trình (Tự nhập mã trực tiếp)'}
                    </span>
                  </label>
                  {isDirectCommand && (
                    <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded">
                      Direct
                    </span>
                  )}
                </div>

                {/* Chọn Lệnh/Quy trình có sẵn nếu không vô hiệu */}
                {!isDirectCommand && (
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2 rounded-lg bg-zinc-950/40 border border-zinc-800/80">
                    <div className="sm:col-span-5 flex gap-1">
                      <button
                        type="button"
                        onClick={() => handleTargetTypeChange('command')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded border text-xs font-medium transition-all cursor-pointer ${
                          targetType === 'command'
                            ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-semibold'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <Terminal size={13} />
                        <span>Lệnh đơn</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTargetTypeChange('sequence')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded border text-xs font-medium transition-all cursor-pointer ${
                          targetType === 'sequence'
                            ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-semibold'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <ListOrdered size={13} />
                        <span>Quy trình</span>
                      </button>
                    </div>

                    <div className="sm:col-span-7 overflow-hidden">
                      <select
                        value={targetId}
                        onChange={(e) => handleTargetIdChange(e.target.value)}
                        className="w-full h-8 px-2.5 rounded bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500/50 cursor-pointer truncate"
                        style={{ maxWidth: '100%' }}
                      >
                        {targetType === 'command' ? (
                          commands.length > 0 ? (
                            commands.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))
                          ) : (
                            <option value="">{language === 'en' ? 'No commands' : 'Chưa có lệnh nào'}</option>
                          )
                        ) : sequences.length > 0 ? (
                          sequences.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.steps?.length || 0} {language === 'en' ? 'steps' : 'bước'})
                            </option>
                          ))
                        ) : (
                          <option value="">{language === 'en' ? 'No sequences' : 'Chưa có quy trình nào'}</option>
                        )}
                      </select>
                    </div>
                  </div>
                )}

                {/* Kiểu Chu kỳ Lập lịch (Theo chu kỳ / Hàng ngày / Khi mở app) */}
                <div className="space-y-1.5">
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setScheduleType('interval')}
                      className={`flex items-center justify-center p-1.5 rounded border text-xs font-medium gap-1 transition-all cursor-pointer ${
                        scheduleType === 'interval'
                          ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-bold'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <Timer size={13} />
                      <span>{language === 'en' ? 'Interval' : 'Theo Chu Kỳ'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setScheduleType('daily')}
                      className={`flex items-center justify-center p-1.5 rounded border text-xs font-medium gap-1 transition-all cursor-pointer ${
                        scheduleType === 'daily'
                          ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-bold'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <Calendar size={13} />
                      <span>{language === 'en' ? 'Daily' : 'Hàng Ngày'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setScheduleType('startup')}
                      className={`flex items-center justify-center p-1.5 rounded border text-xs font-medium gap-1 transition-all cursor-pointer ${
                        scheduleType === 'startup'
                          ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-bold'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <Zap size={13} />
                      <span>{language === 'en' ? 'Startup' : 'Khi Mở App'}</span>
                    </button>
                  </div>

                  {/* Chi tiết chu kỳ */}
                  {scheduleType === 'interval' && (
                    <select
                      value={intervalMinutes}
                      onChange={(e) => setIntervalMinutes(Number(e.target.value))}
                      className="w-full h-8 px-3 rounded bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
                    >
                      {intervalOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}

                  {scheduleType === 'daily' && (
                    <Input
                      type="time"
                      value={dailyTime}
                      onChange={(e) => setDailyTime(e.target.value)}
                      className="bg-zinc-950 border-zinc-800 rounded text-xs font-mono focus:border-emerald-500/50 h-8"
                      required
                    />
                  )}

                  {scheduleType === 'startup' && (
                    <div className="p-1.5 bg-zinc-950 border border-zinc-800/80 rounded text-[11px] text-zinc-400">
                      ⚡ Tác vụ sẽ tự động kích hoạt sau 3 giây kể từ khi mở ứng dụng CLIM.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Phần Soạn Thảo Mã Lệnh Ở Dưới Cùng (Full Width trải rộng 100%) */}
            <div className="flex-1 min-h-[180px] p-5 pt-3.5 flex flex-col space-y-1.5 bg-zinc-950/30 overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Code2 size={14} className="text-emerald-400" />
                    {language === 'en' ? 'Execution Command / Script' : 'Mã lệnh thực thi của lịch này'}
                  </label>
                  <span className="text-[10px] text-zinc-500 hidden sm:inline">
                    ({language === 'en' ? 'Executed directly · Does not alter original code' : 'Thực thi trực tiếp · Không làm đổi mã gốc'})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowTips(true)}
                    title={language === 'en' ? 'View guidance on what commands work best with Cron' : 'Xem hướng dẫn loại lệnh nào lập lịch tốt nhất, loại lệnh nào không nên dùng'}
                    className="text-[10px] text-blue-400 hover:text-blue-300 hover:bg-blue-500/15 flex items-center gap-1 px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20 cursor-pointer transition-colors"
                  >
                    <HelpCircle size={11} />
                    <span>{language === 'en' ? 'Cron Tips' : 'Hướng dẫn lệnh'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleMakeSingleLine}
                    title={
                      language === 'en'
                        ? 'Combine all broken lines into one seamless single-line command'
                        : 'Gom tất cả các dòng bị ngắt/xuống dòng thành 1 dòng duy nhất liền mạch'
                    }
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/15 flex items-center gap-1 px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 cursor-pointer transition-colors"
                  >
                    <Sparkles size={11} />
                    <span>{language === 'en' ? 'Single Line' : 'Dồn 1 dòng'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsWrap(!isWrap)}
                    title={isWrap ? 'Tắt tự xuống dòng (chuyển sang cuộn ngang)' : 'Bật tự xuống dòng'}
                    className={`text-[10px] flex items-center gap-1 px-2 py-1 rounded border cursor-pointer transition-colors ${
                      isWrap
                        ? 'bg-zinc-800 text-zinc-200 border-zinc-700'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    <WrapText size={11} />
                    <span>{isWrap ? 'Wrap ON' : 'No Wrap'}</span>
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-[140px] flex flex-col relative rounded-md border border-zinc-800 bg-zinc-950 focus-within:border-emerald-500/50 overflow-hidden">
                <textarea
                  value={customCommand}
                  onChange={(e) => setCustomCommand(e.target.value)}
                  wrap={isWrap ? 'soft' : 'off'}
                  spellCheck={false}
                  autoCapitalize="off"
                  autoCorrect="off"
                  placeholder={
                    language === 'en'
                      ? 'Enter CLI script to run (e.g. ssh -i key.pem user@host -o BatchMode=yes -N -L 9119:127.0.0.1:9119, ping 8.8.8.8)...'
                      : 'Nhập câu lệnh / kịch bản CLI sẽ chạy (VD: ssh -i key.pem user@host -o BatchMode=yes -N -L 9119:127.0.0.1:9119, docker restart app)...'
                  }
                  className={`w-full h-full p-3 bg-transparent text-xs font-mono text-emerald-300 placeholder:text-zinc-600 focus:outline-none resize-none leading-relaxed ${
                    isWrap ? 'whitespace-pre-wrap break-all' : 'whitespace-pre overflow-x-auto'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 bg-zinc-950 border-t border-zinc-800 flex items-center justify-end gap-2.5 shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs text-zinc-400 hover:text-zinc-200 rounded-md h-8 px-4 cursor-pointer"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs px-5 h-8 rounded-md cursor-pointer"
            >
              {taskToEdit
                ? (language === 'en' ? 'Save Changes' : 'Lưu Thay Đổi')
                : (language === 'en' ? 'Create Schedule' : 'Tạo Lịch Trình')}
            </Button>
          </div>
        </form>
      </DialogContent>

      {/* Mini Tips Modal: Hướng dẫn loại lệnh nên & không nên dùng */}
      {showTips && (
        <Dialog open={showTips} onOpenChange={setShowTips}>
          <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 max-w-xl max-h-[85vh] p-0 overflow-hidden shadow-2xl rounded-2xl flex flex-col z-[70]">
            <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <HelpCircle size={16} />
                </div>
                <div>
                  <DialogTitle className="text-sm font-bold text-zinc-100">
                    {language === 'en' ? 'Cron Automation Guide & Best Practices' : 'Hướng Dẫn Chọn Lệnh Lập Lịch Cron'}
                  </DialogTitle>
                  <p className="text-[11px] text-zinc-400">
                    {language === 'en' ? 'Which commands work best in background scheduler and which to avoid' : 'Loại lệnh nào chạy ngầm tốt nhất và loại nào sẽ bị lỗi'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTips(false)}
                className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Nên dùng */}
              <div className="p-3.5 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-2.5">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <span>🟢</span>
                  <span>{language === 'en' ? 'Recommended for Cron Automation:' : 'Loại Lệnh Lập Lịch TỐT NHẤT (Nên Dùng):'}</span>
                </div>
                <ul className="space-y-1.5 text-zinc-300 text-[11px] leading-relaxed pl-1">
                  <li><strong className="text-zinc-100">✓ Sao lưu database / file:</strong> mysqldump, pg_dump, tar -czf, Compress-Archive.</li>
                  <li><strong className="text-zinc-100">✓ Dọn dẹp rác & bộ nhớ:</strong> Remove-Item "$env:TEMP\*" -Force, dọn log cũ, dọn cache.</li>
                  <li><strong className="text-zinc-100">✓ Quản lý Docker & Dịch vụ:</strong> docker restart app, pm2 reload all, docker compose up -d.</li>
                  <li><strong className="text-zinc-100">✓ Kiểm tra mạng & API:</strong> curl -sSf https://your-domain.com/health, Test-Connection.</li>
                  <li><strong className="text-zinc-100">✓ SSH Tunnel Port Forwarding:</strong> ssh -i key.key -N -L 9119:127.0.0.1:9119 user@host (CLIM tự xác thực 4s).</li>
                </ul>
              </div>

              {/* Không nên dùng */}
              <div className="p-3.5 bg-rose-950/20 border border-rose-500/30 rounded-xl space-y-2.5">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                  <span>🔴</span>
                  <span>{language === 'en' ? 'Avoid for Cron (Will Hang or Fail):' : 'Loại Lệnh KHÔNG NÊN / KHÔNG DÙNG ĐƯỢC:'}</span>
                </div>
                <ul className="space-y-1.5 text-zinc-300 text-[11px] leading-relaxed pl-1">
                  <li><strong className="text-zinc-100">✗ Lệnh cần bàn phím tương tác:</strong> nano, vim, htop, less, python -i, fzf (tiến trình sẽ bị treo).</li>
                  <li><strong className="text-zinc-100">✗ Lệnh hỏi xác nhận [y/N]:</strong> apt install không có -y, rm không có -f (phải thêm cờ tự động -y / -Force).</li>
                  <li><strong className="text-zinc-100">✗ SSH gõ mật khẩu bằng tay:</strong> Phải dùng SSH Key (-i "path.key") vì Cron chạy ngầm không thể gõ password.</li>
                  <li><strong className="text-zinc-100">✗ Phần mềm giao diện GUI:</strong> notepad.exe, chrome.exe (chờ người dùng bấm nút đóng cửa sổ mới thoát).</li>
                </ul>
              </div>
            </div>

            <div className="px-5 py-3 bg-zinc-900/60 border-t border-zinc-800 flex justify-end shrink-0">
              <Button
                size="sm"
                onClick={() => setShowTips(false)}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs h-7 px-4 rounded-md"
              >
                {language === 'en' ? 'Got it' : 'Đã hiểu'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  )
}
