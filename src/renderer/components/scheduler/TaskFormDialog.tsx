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
  X
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
  const [targetType, setTargetType] = useState<ScheduleTargetType>('command')
  const [targetId, setTargetId] = useState('')
  const [scheduleType, setScheduleType] = useState<ScheduleType>('interval')
  const [intervalMinutes, setIntervalMinutes] = useState(15)
  const [dailyTime, setDailyTime] = useState('02:00')
  const [notifyOnComplete, setNotifyOnComplete] = useState(true)
  const [webhookEnabled, setWebhookEnabled] = useState(false)

  useEffect(() => {
    if (taskToEdit) {
      setName(taskToEdit.name)
      setDescription(taskToEdit.description || '')
      setTargetType(taskToEdit.targetType)
      setTargetId(taskToEdit.targetId)
      setScheduleType(taskToEdit.scheduleType)
      setIntervalMinutes(taskToEdit.intervalMinutes || 15)
      setDailyTime(taskToEdit.dailyTime || '02:00')
      setNotifyOnComplete(taskToEdit.notifyOnComplete)
      setWebhookEnabled(taskToEdit.webhookEnabled)
    } else {
      setName('')
      setDescription('')
      setTargetType('command')
      setTargetId(commands[0]?.id || '')
      setScheduleType('interval')
      setIntervalMinutes(15)
      setDailyTime('02:00')
      setNotifyOnComplete(true)
      setWebhookEnabled(false)
    }
  }, [taskToEdit, open, commands])

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error(language === 'en' ? 'Please enter a schedule name' : 'Vui lòng nhập tên lịch trình')
      return
    }

    if (!targetId) {
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
      targetType,
      targetId,
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
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 w-[92vw] max-w-xl p-0 overflow-hidden shadow-2xl rounded-2xl">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="p-5 pb-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Clock size={20} />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-zinc-100">
                  {taskToEdit
                    ? (language === 'en' ? 'Edit Scheduled Task' : 'Chỉnh sửa Lịch Tự Động')
                    : (language === 'en' ? 'Create New Scheduled Task' : 'Tạo Lịch Tự Động Mới')}
                </DialogTitle>
                <p className="text-xs text-zinc-400">
                  {language === 'en'
                    ? 'Automate recurring execution of commands or multi-step sequences'
                    : 'Tự động thực thi câu lệnh hoặc quy trình theo chu kỳ định sẵn'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form Fields */}
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Tên tác vụ */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                {language === 'en' ? 'Schedule Name' : 'Tên lịch trình'} <span className="text-red-400">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={language === 'en' ? 'e.g. Automated Database Backup, Periodic Cache Cleanup...' : 'VD: Backup Database tự động, Quét rác định kỳ...'}
                className="bg-zinc-950 border-zinc-800 text-sm focus:border-emerald-500/50"
                required
              />
            </div>

            {/* Mô tả */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                {language === 'en' ? 'Description (optional)' : 'Mô tả (tùy chọn)'}
              </label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={language === 'en' ? 'Notes on what this scheduled job accomplishes...' : 'Ghi chú thêm về mục đích của lịch tự động này...'}
                className="bg-zinc-950 border-zinc-800 text-sm focus:border-emerald-500/50"
              />
            </div>

            {/* Chọn Loại Mục tiêu: Command vs Sequence */}
            <div className="space-y-2 pt-1">
              <label className="text-xs font-semibold text-zinc-300">
                {language === 'en' ? 'Target Type' : 'Đối tượng thực thi'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTargetType('command')
                    setTargetId(commands[0]?.id || '')
                  }}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                    targetType === 'command'
                      ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-semibold'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <Terminal size={16} />
                  <span>{language === 'en' ? 'Single Command' : 'Câu Lệnh Đơn'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTargetType('sequence')
                    setTargetId(sequences[0]?.id || '')
                  }}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                    targetType === 'sequence'
                      ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-semibold'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <ListOrdered size={16} />
                  <span>{language === 'en' ? 'Sequence (Pipeline)' : 'Quy Trình (Pipeline)'}</span>
                </button>
              </div>
            </div>

            {/* Dropdown chọn Lệnh / Quy trình cụ thể */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                {language === 'en'
                  ? `Select Target ${targetType === 'command' ? 'Command' : 'Sequence'}`
                  : `Chọn ${targetType === 'command' ? 'Câu lệnh' : 'Quy trình'}`}
              </label>
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full h-10 px-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
              >
                {targetType === 'command' ? (
                  commands.length > 0 ? (
                    commands.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.command.slice(0, 40)})
                      </option>
                    ))
                  ) : (
                    <option value="">{language === 'en' ? 'No commands found, create one first' : 'Chưa có lệnh nào, hãy tạo lệnh trước'}</option>
                  )
                ) : sequences.length > 0 ? (
                  sequences.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.steps?.length || 0} {language === 'en' ? (s.steps?.length === 1 ? 'step' : 'steps') : 'bước'})
                    </option>
                  ))
                ) : (
                  <option value="">{language === 'en' ? 'No sequences found, create one first' : 'Chưa có quy trình nào, hãy tạo quy trình trước'}</option>
                )}
              </select>
            </div>

            {/* Kiểu Lịch Trình (Interval / Daily / Startup) */}
            <div className="space-y-2 pt-2 border-t border-zinc-800/60">
              <label className="text-xs font-semibold text-zinc-300">
                {language === 'en' ? 'Schedule Frequency Type' : 'Kiểu Chu kỳ Lập lịch'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setScheduleType('interval')}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium gap-1 transition-all cursor-pointer ${
                    scheduleType === 'interval'
                      ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-bold'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <Timer size={16} />
                  <span>{language === 'en' ? 'Periodic Interval' : 'Theo Chu Kỳ'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setScheduleType('daily')}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium gap-1 transition-all cursor-pointer ${
                    scheduleType === 'daily'
                      ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-bold'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <Calendar size={16} />
                  <span>{language === 'en' ? 'Daily Time' : 'Hàng Ngày'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setScheduleType('startup')}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium gap-1 transition-all cursor-pointer ${
                    scheduleType === 'startup'
                      ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-bold'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <Zap size={16} />
                  <span>{language === 'en' ? 'On App Startup' : 'Khi Mở App'}</span>
                </button>
              </div>
            </div>

            {/* Chi tiết theo từng Kiểu Lịch */}
            {scheduleType === 'interval' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  {language === 'en' ? 'Repeat Interval' : 'Lặp lại sau mỗi'}
                </label>
                <select
                  value={intervalMinutes}
                  onChange={(e) => setIntervalMinutes(Number(e.target.value))}
                  className="w-full h-10 px-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
                >
                  {intervalOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {scheduleType === 'daily' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  {language === 'en' ? 'Daily Run Time (HH:mm)' : 'Thời điểm chạy mỗi ngày (Giờ:Phút)'}
                </label>
                <Input
                  type="time"
                  value={dailyTime}
                  onChange={(e) => setDailyTime(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 text-sm font-mono focus:border-emerald-500/50"
                  required
                />
              </div>
            )}

            {scheduleType === 'startup' && (
              <div className="p-3 bg-zinc-950/80 border border-zinc-800/80 rounded-xl text-xs text-zinc-400 leading-relaxed">
                {language === 'en'
                  ? '⚡ Task will trigger automatically once, 3 seconds after CLIM application startup.'
                  : '⚡ Tác vụ sẽ tự động kích hoạt 1 lần duy nhất sau 3 giây kể từ khi mở ứng dụng CLIM.'}
              </div>
            )}

            {/* Tùy chọn Thông báo & Webhook */}
            <div className="pt-2 border-t border-zinc-800/60 space-y-2.5">
              <label className="text-xs font-semibold text-zinc-300">
                {language === 'en' ? 'Reporting & Notifications' : 'Cấu hình Báo cáo'}
              </label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-300 hover:text-zinc-100">
                  <input
                    type="checkbox"
                    checked={notifyOnComplete}
                    onChange={(e) => setNotifyOnComplete(e.target.checked)}
                    className="w-4 h-4 rounded bg-zinc-950 border-zinc-700 text-emerald-500 focus:ring-0 cursor-pointer"
                  />
                  <Bell size={14} className="text-emerald-400" />
                  <span>{language === 'en' ? 'Send Windows Desktop Notification on completion' : 'Bắn thông báo Windows Desktop khi hoàn tất'}</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-300 hover:text-zinc-100">
                  <input
                    type="checkbox"
                    checked={webhookEnabled}
                    onChange={(e) => setWebhookEnabled(e.target.checked)}
                    className="w-4 h-4 rounded bg-zinc-950 border-zinc-700 text-emerald-500 focus:ring-0 cursor-pointer"
                  />
                  <Send size={14} className="text-blue-400" />
                  <span>{language === 'en' ? 'Send result via Webhook (Discord / Telegram)' : 'Gửi kết quả qua Webhook (Discord / Telegram)'}</span>
                </label>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs text-zinc-400 hover:text-zinc-200"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs px-5 py-2 h-9 cursor-pointer"
            >
              {taskToEdit
                ? (language === 'en' ? 'Save Changes' : 'Lưu Thay Đổi')
                : (language === 'en' ? 'Create Schedule' : 'Tạo Lịch Trình')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
